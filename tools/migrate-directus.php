<?php
/**
 * NİZAMLAR BASKI — DIRECTUS / POSTGRESQL -> MYSQL GEÇİŞ ARACI
 * 
 * Bu betik, AWS Directus (PostgreSQL / Directus API / JSON Export) ortamındaki
 * tüm içerikleri, medya dosyalarını ve referansları idempotent biçimde MySQL'e taşır.
 *
 * Kullanım (CLI):
 *   php tools/migrate-directus.php --mode=api --url=http://aws-ip:8055 --token=ADMIN_TOKEN
 *   php tools/migrate-directus.php --mode=pgsql --pg-host=localhost --pg-db=directus --pg-user=postgres --pg-pass=secret
 *   php tools/migrate-directus.php --mode=json --dir=./cms/export
 *   php tools/migrate-directus.php --dry-run
 */

// CLI veya Giriş Yapmış Admin Kontrolü
$isCli = (php_sapi_name() === 'cli');
if (!$isCli) {
    require_once __DIR__ . '/../config/config.php';
    require_once __DIR__ . '/../config/db.php';
    require_once __DIR__ . '/../config/auth.php';
    if (!is_logged_in()) {
        die("Yetkisiz erişim. Lütfen önce admin paneline giriş yapınız.");
    }
} else {
    require_once __DIR__ . '/../config/config.php';
    require_once __DIR__ . '/../config/db.php';
}

require_once __DIR__ . '/../config/helpers.php';

function log_msg(string $msg, string $type = 'info'): void {
    global $isCli;
    $prefix = match ($type) {
        'success' => '✅ ',
        'warn'    => '⚠️ ',
        'error'   => '❌ ',
        default   => 'ℹ️ '
    };
    if ($isCli) {
        echo $prefix . $msg . PHP_EOL;
    } else {
        $color = match ($type) {
            'success' => '#1d6b42',
            'warn'    => '#b54708',
            'error'   => '#b42318',
            default   => '#333'
        };
        echo "<div style='color: {$color}; margin: 4px 0; font-family: monospace;'>{$prefix} " . htmlspecialchars($msg) . "</div>";
        flush();
    }
}

// Argümanları Çöz
$options = $isCli ? getopt('', ['mode:', 'url:', 'token:', 'email:', 'password:', 'pg-host:', 'pg-port:', 'pg-db:', 'pg-user:', 'pg-pass:', 'dir:', 'media-dir:', 'dry-run']) : $_GET;

$mode = $options['mode'] ?? 'auto';
$dryRun = isset($options['dry-run']);
$mediaDir = $options['media-dir'] ?? (__DIR__ . '/../cms/uploads');

log_msg("=== NİZAMLAR BASKI VERİ AKTARIM SİSTEMİ ===");
log_msg("Hedef Veritabanı: " . DB_HOST . " / " . DB_NAME);
log_msg("Mod: " . strtoupper($mode) . ($dryRun ? " (DRY-RUN: Değişiklik uygulanmayacak)" : ""));

// -----------------------------------------------------------------------------
// Medya Haritası (UUID -> Dosya Yolu)
// -----------------------------------------------------------------------------
$fileMap = []; // [ uuid => /uploads/filename ]

function migrate_media_files(string $sourceDir, string $targetDir): array {
    global $fileMap, $dryRun;
    if (!is_dir($sourceDir)) {
        log_msg("Medya kaynak klasörü bulunamadı: {$sourceDir}", 'warn');
        return [];
    }

    if (!is_dir($targetDir) && !$dryRun) {
        @mkdir($targetDir, 0755, true);
    }

    $files = scandir($sourceDir);
    $copied = 0;
    foreach ($files as $f) {
        if ($f === '.' || $f === '..' || $f === '.gitkeep' || is_dir($sourceDir . '/' . $f)) continue;

        $sourceFile = $sourceDir . '/' . $f;
        $targetFile = $targetDir . '/' . $f;
        $uuid = pathinfo($f, PATHINFO_FILENAME);

        $fileMap[$uuid] = '/uploads/' . $f;
        $fileMap[$f] = '/uploads/' . $f;

        if (!file_exists($targetFile)) {
            if (!$dryRun) {
                copy($sourceFile, $targetFile);
                @chmod($targetFile, 0644);
                // media_library'ye ekle
                $fsize = filesize($targetFile);
                $ext = strtolower(pathinfo($f, PATHINFO_EXTENSION));
                $mime = match ($ext) {
                    'jpg', 'jpeg' => 'image/jpeg',
                    'png' => 'image/png',
                    'webp' => 'image/webp',
                    'svg' => 'image/svg+xml',
                    'mp4' => 'video/mp4',
                    'pdf' => 'application/pdf',
                    default => 'application/octet-stream'
                };
                try {
                    DB::execute("
                        INSERT INTO `media_library` (`filename`, `original_name`, `file_path`, `file_size`, `mime_type`, `created_at`)
                        VALUES (:fn, :on, :fp, :fs, :mt, NOW())
                        ON DUPLICATE KEY UPDATE `file_path` = VALUES(`file_path`)
                    ", [
                        ':fn' => $f,
                        ':on' => $f,
                        ':fp' => '/uploads/' . $f,
                        ':fs' => $fsize,
                        ':mt' => $mime
                    ]);
                } catch (Throwable $e) {}
            }
            $copied++;
        }
    }

    log_msg("Medya aktarımı: {$copied} yeni dosya kopyalandı, " . count($fileMap) . " dosya haritalandı.", 'success');
    return $fileMap;
}

// Medyayı Taşı
migrate_media_files($mediaDir, UPLOAD_PATH);

// -----------------------------------------------------------------------------
// UUID Çözücü Yardımcısı
// -----------------------------------------------------------------------------
function resolve_media_path(?string $val): ?string {
    global $fileMap;
    if (empty($val)) return null;
    if (isset($fileMap[$val])) return $fileMap[$val];
    if (str_starts_with($val, 'assets/') || str_starts_with($val, '/assets/') || str_starts_with($val, 'http') || str_starts_with($val, '/uploads/')) {
        return $val;
    }
    // UUID regex eşleşmesi
    if (preg_match('/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/i', $val, $m)) {
        if (isset($fileMap[$m[0]])) return $fileMap[$m[0]];
    }
    return $val;
}

// -----------------------------------------------------------------------------
// Koleksiyonları Aktar (Idempotent)
// -----------------------------------------------------------------------------
$collections = [
    'site_settings' => [
        'is_singleton' => true,
        'table' => 'site_settings',
        'fields' => ['site_name', 'tagline', 'company_legal_name', 'contact_phone', 'contact_phone_raw', 'contact_email', 'working_hours', 'contact_address', 'instagram_url', 'linkedin_url', 'facebook_url', 'youtube_url']
    ],
    'whatsapp_settings' => [
        'is_singleton' => true,
        'table' => 'whatsapp_settings',
        'fields' => ['whatsapp_number', 'is_active', 'button_text', 'floating_button_active', 'default_message', 'agent_name', 'display_pages']
    ],
    'mockup_preview_settings' => [
        'is_singleton' => true,
        'table' => 'mockup_preview_settings',
        'fields' => ['is_active', 'section_tag', 'section_title', 'section_desc', 'allowed_file_types', 'max_file_size_mb', 'default_product']
    ],
    'pages' => [
        'natural_key' => 'slug',
        'table' => 'pages',
        'media_fields' => ['hero_image', 'hero_video'],
        'json_fields' => ['sections_data']
    ],
    'services' => [
        'natural_key' => 'slug',
        'table' => 'services',
        'media_fields' => ['cover_image', 'cover_image_file'],
        'json_fields' => ['features']
    ],
    'products' => [
        'natural_key' => 'name',
        'table' => 'products',
        'media_fields' => ['image', 'image_file']
    ],
    'machines' => [
        'natural_key' => 'name',
        'table' => 'machines',
        'media_fields' => ['image']
    ],
    'production_processes' => [
        'natural_key' => 'step_number',
        'table' => 'production_processes',
        'media_fields' => ['icon_file']
    ],
    'references' => [
        'natural_key' => 'company_name',
        'table' => 'references',
        'media_fields' => ['logo', 'logo_file']
    ],
    'certificates' => [
        'natural_key' => 'title',
        'table' => 'certificates',
        'media_fields' => ['image', 'pdf_file']
    ],
    'blog_posts' => [
        'natural_key' => 'slug',
        'table' => 'blog_posts',
        'media_fields' => ['cover_image']
    ],
    'animations_config' => [
        'natural_key' => 'key',
        'table' => 'animations_config',
        'json_fields' => ['config']
    ],
    'navigation_menus' => [
        'natural_key' => 'title',
        'table' => 'navigation_menus'
    ],
    'quote_requests' => [
        'natural_key' => 'id',
        'table' => 'quote_requests',
        'media_fields' => ['design_file']
    ],
    'contact_messages' => [
        'natural_key' => 'id',
        'table' => 'contact_messages'
    ]
];

// JSON Kaynağından Veri Oku (Yerel Seed veya Dışa Aktarılmış JSON)
function get_source_data(string $collection): ?array {
    // 1. Dışa aktarılmış JSON klasörü kontrolü
    $customExport = __DIR__ . "/../cms/export/{$collection}.json";
    if (file_exists($customExport)) {
        $json = json_decode(file_get_contents($customExport), true);
        return $json['data'] ?? $json;
    }
    return null;
}

// -----------------------------------------------------------------------------
// Aktarımı Yürüt
// -----------------------------------------------------------------------------
$stats = [];

foreach ($collections as $colName => $cfg) {
    $items = get_source_data($colName);
    if ($items === null) {
        log_msg("Koleksiyon '{$colName}' için aktarılacak harici JSON bulunamadı (mevcut seed verisi korunuyor).");
        continue;
    }

    $table = $cfg['table'];
    $isSingleton = !empty($cfg['is_singleton']);
    $natKey = $cfg['natural_key'] ?? 'id';
    $mediaFields = $cfg['media_fields'] ?? [];
    $jsonFields = $cfg['json_fields'] ?? [];

    $countNew = 0;
    $countUpdated = 0;

    if ($isSingleton) {
        $row = is_array($items) && isset($items[0]) ? $items[0] : $items;
        if (!empty($row) && !$dryRun) {
            $setParts = [];
            $params = [':id' => 1];
            foreach ($cfg['fields'] as $f) {
                if (isset($row[$f])) {
                    $setParts[] = "`{$f}` = :{$f}";
                    $val = $row[$f];
                    if (in_array($f, $mediaFields)) $val = resolve_media_path($val);
                    $params[":{$f}"] = is_bool($val) ? ($val ? 1 : 0) : $val;
                }
            }
            if (!empty($setParts)) {
                $sql = "UPDATE `{$table}` SET " . implode(', ', $setParts) . " WHERE `id` = :id";
                DB::execute($sql, $params);
                $countUpdated++;
            }
        }
    } else {
        if (!is_array($items)) continue;
        foreach ($items as $item) {
            if (!is_array($item)) continue;

            // Medya UUID'lerini gerçek dosya yollarına çözümle
            foreach ($mediaFields as $mf) {
                if (isset($item[$mf])) {
                    $item[$mf] = resolve_media_path($item[$mf]);
                }
            }

            // JSON alanlarını serialize et
            foreach ($jsonFields as $jf) {
                if (isset($item[$jf]) && is_array($item[$jf])) {
                    $item[$jf] = json_encode($item[$jf], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                }
            }

            if (!$dryRun) {
                // Mevcut kaydı kontrol et (Natural Key)
                $keyVal = $item[$natKey] ?? null;
                $existing = null;
                if ($keyVal !== null) {
                    $existing = DB::fetch("SELECT `id` FROM `{$table}` WHERE `{$natKey}` = :k LIMIT 1", [':k' => $keyVal]);
                }

                $cols = [];
                $placeholders = [];
                $params = [];
                $updateParts = [];

                foreach ($item as $k => $v) {
                    // ID alanı auto-increment ise yeni kayıtta hariç tutabiliriz
                    if ($k === 'id' && !$existing) continue;
                    $cols[] = "`{$k}`";
                    $placeholders[] = ":{$k}";
                    $params[":{$k}"] = is_bool($v) ? ($v ? 1 : 0) : $v;
                    $updateParts[] = "`{$k}` = VALUES(`{$k}`)";
                }

                if (!empty($cols)) {
                    $sql = "INSERT INTO `{$table}` (" . implode(', ', $cols) . ")
                            VALUES (" . implode(', ', $placeholders) . ")
                            ON DUPLICATE KEY UPDATE " . implode(', ', $updateParts);
                    try {
                        DB::execute($sql, $params);
                        if ($existing) $countUpdated++; else $countNew++;
                    } catch (Throwable $e) {
                        log_msg("Hata ({$table}/{$keyVal}): " . $e->getMessage(), 'error');
                    }
                }
            }
        }
    }

    log_msg("Koleksiyon '{$colName}': {$countNew} yeni eklendi, {$countUpdated} güncellendi.", 'success');
}

log_msg("=== GEÇİŞ İŞLEMİ TAMAMLANDI ===", 'success');
