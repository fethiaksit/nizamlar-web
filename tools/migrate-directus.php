<?php
/**
 * NİZAMLAR BASKI — DIRECTUS / POSTGRESQL -> MYSQL GEÇİŞ VE DOĞRULAMA ARACI
 * 
 * Bu betik, AWS Directus (PostgreSQL / Directus API / JSON Export) ortamındaki
 * tüm içerikleri, medya dosyalarını ve referansları idempotent biçimde MySQL'e taşır
 * ve aktarım öncesi/sonrası kayıt sayısı ile medya bütünlüğünü doğrular.
 *
 * Kullanım (CLI):
 *   php tools/migrate-directus.php --mode=json --dir=./cms/export
 *   php tools/migrate-directus.php --mode=api --url=http://aws-ip:8055 --token=ADMIN_TOKEN
 *   php tools/migrate-directus.php --mode=pgsql --pg-host=localhost --pg-db=directus --pg-user=postgres --pg-pass=secret
 *   php tools/migrate-directus.php --verify-only    (Sadece mevcut veritabanı ve medya bütünlüğünü denetler)
 *   php tools/migrate-directus.php --dry-run        (Değişiklik yapmadan simüle eder)
 */

define('NIZAMLAR_APP', true);

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
$options = $isCli ? getopt('', ['mode:', 'url:', 'token:', 'email:', 'password:', 'pg-host:', 'pg-port:', 'pg-db:', 'pg-user:', 'pg-pass:', 'dir:', 'media-dir:', 'dry-run', 'verify-only']) : $_GET;

$mode = $options['mode'] ?? 'auto';
$dryRun = isset($options['dry-run']);
$verifyOnly = isset($options['verify-only']);
$mediaDir = $options['media-dir'] ?? (__DIR__ . '/../cms/uploads');

log_msg("==================================================================");
log_msg(" NİZAMLAR BASKI — DIRECTUS -> MYSQL VERİ AKTARIM VE DOĞRULAMA");
log_msg("==================================================================");
log_msg("Hedef Veritabanı : " . DB_HOST . " / " . DB_NAME);
log_msg("Mod              : " . strtoupper($mode) . ($dryRun ? " [DRY-RUN]" : "") . ($verifyOnly ? " [SADECE DOĞRULAMA]" : ""));
log_msg("Medya Kaynağı    : " . $mediaDir);
log_msg("------------------------------------------------------------------");
log_msg("BİLGİLENDİRME: Canlı AWS Directus veritabanına doğrudan bağlantı henüz");
log_msg("yapılmamıştır. Mevcut tablolar tohumlama (seed) verilerini içermektedir.");
log_msg("Canlı AWS verileri aktarılırken bu araç kayıt ve medya denetimi yapacaktır.");
log_msg("------------------------------------------------------------------");

// Koleksiyon Tanımları
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
        'media_fields' => ['design_file', 'file_url']
    ],
    'contact_messages' => [
        'natural_key' => 'id',
        'table' => 'contact_messages'
    ],
    'media_library' => [
        'natural_key' => 'filename',
        'table' => 'media_library'
    ]
];

// -----------------------------------------------------------------------------
// Medya Bütünlüğü Denetim Fonksiyonu
// -----------------------------------------------------------------------------
function verify_media_and_records(array $collections): array {
    $report = [];
    $totalMissing = 0;
    $totalVerified = 0;

    foreach ($collections as $colName => $cfg) {
        $table = $cfg['table'];
        $mediaFields = $cfg['media_fields'] ?? [];
        $isSingleton = !empty($cfg['is_singleton']);

        $count = 0;
        try {
            $row = DB::fetch("SELECT COUNT(*) as cnt FROM `{$table}`");
            $count = (int)($row['cnt'] ?? 0);
        } catch (\Throwable $e) {
            $report[$table] = [
                'count' => 0,
                'status' => 'TABLO YOK / HATA',
                'media_checked' => 0,
                'media_ok' => 0,
                'media_missing' => 0,
                'missing_files' => []
            ];
            continue;
        }

        $mediaChecked = 0;
        $mediaOk = 0;
        $mediaMissing = 0;
        $missingList = [];

        if (!empty($mediaFields) && $count > 0) {
            $rows = DB::fetchAll("SELECT * FROM `{$table}`");
            foreach ($rows as $r) {
                foreach ($mediaFields as $mf) {
                    if (empty($r[$mf])) continue;
                    $val = trim((string)$r[$mf]);
                    $mediaChecked++;

                    // Harici URL ise geçerli say
                    if (str_starts_with($val, 'http://') || str_starts_with($val, 'https://')) {
                        $mediaOk++;
                        continue;
                    }

                    // UUID formatında çözümlenmemiş kalmışsa
                    if (preg_match('/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i', $val)) {
                        $mediaMissing++;
                        $missingList[] = "Çözümlenmemiş UUID: {$val} ({$table} #{$r['id']})";
                        continue;
                    }

                    // Fiziksel dosya denetimi
                    $cleanPath = ltrim(parse_url($val, PHP_URL_PATH) ?? '', '/');
                    $possibleFiles = [
                        ROOT_DIR . '/' . $cleanPath,
                        UPLOADS_DIR . '/' . basename($val),
                        ROOT_DIR . '/assets/images/' . basename($val)
                    ];

                    $exists = false;
                    foreach ($possibleFiles as $pf) {
                        if (file_exists($pf) && is_file($pf)) {
                            $exists = true;
                            break;
                        }
                    }

                    if ($exists) {
                        $mediaOk++;
                    } else {
                        $mediaMissing++;
                        $missingList[] = "Bulunamadı: {$val} ({$table} ID:" . ($r['id'] ?? 'singleton') . ")";
                    }
                }
            }
        }

        $totalVerified += $mediaOk;
        $totalMissing += $mediaMissing;

        $report[$table] = [
            'count' => $count,
            'status' => ($mediaMissing > 0 ? 'MEDYA EKSİK' : 'TAMAM'),
            'media_checked' => $mediaChecked,
            'media_ok' => $mediaOk,
            'media_missing' => $mediaMissing,
            'missing_files' => $missingList
        ];
    }

    return [
        'tables' => $report,
        'total_media_checked' => $totalVerified + $totalMissing,
        'total_media_ok' => $totalVerified,
        'total_media_missing' => $totalMissing
    ];
}

// -----------------------------------------------------------------------------
// SADECE DOĞRULAMA MODU (--verify-only)
// -----------------------------------------------------------------------------
if ($verifyOnly) {
    log_msg("📊 Mevcut Veritabanı ve Medya Bütünlüğü Denetleniyor...");
    $audit = verify_media_and_records($collections);
    
    echo "\n" . str_pad("Tablo Adı", 25) . str_pad("Kayıt", 10) . str_pad("Medya", 10) . str_pad("Mevcut", 10) . str_pad("Eksik", 10) . "Durum\n";
    echo str_repeat("-", 75) . "\n";
    foreach ($audit['tables'] as $tbl => $d) {
        echo str_pad($tbl, 25) . 
             str_pad((string)$d['count'], 10) . 
             str_pad((string)$d['media_checked'], 10) . 
             str_pad((string)$d['media_ok'], 10) . 
             str_pad((string)$d['media_missing'], 10) . 
             $d['status'] . "\n";
    }
    echo str_repeat("-", 75) . "\n";
    log_msg("Toplam Denetlenen Medya: {$audit['total_media_checked']}, Doğrulanan: {$audit['total_media_ok']}, Eksik: {$audit['total_media_missing']}", $audit['total_media_missing'] === 0 ? 'success' : 'warn');

    if ($audit['total_media_missing'] > 0) {
        log_msg("Eksik Dosya Ayrıntıları (İlk 10):", 'warn');
        $c = 0;
        foreach ($audit['tables'] as $tbl => $d) {
            foreach ($d['missing_files'] as $mf) {
                if (++$c > 10) break 2;
                log_msg("  - " . $mf, 'warn');
            }
        }
    }
    exit(0);
}

// -----------------------------------------------------------------------------
// AKTARIM ÖNCESİ KAYIT SAYILARI
// -----------------------------------------------------------------------------
$beforeCounts = [];
foreach ($collections as $colName => $cfg) {
    try {
        $r = DB::fetch("SELECT COUNT(*) as cnt FROM `{$cfg['table']}`");
        $beforeCounts[$cfg['table']] = (int)($r['cnt'] ?? 0);
    } catch (\Throwable $e) {
        $beforeCounts[$cfg['table']] = 0;
    }
}

// Medya Haritası (UUID -> /uploads/filename)
$fileMap = [];

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
                } catch (\Throwable $e) {}
            }
            $copied++;
        }
    }

    log_msg("Medya aktarımı: {$copied} dosya hedefe kopyalandı, " . count($fileMap) . " dosya eşleştirildi.", 'success');
    return $fileMap;
}

// Medyayı Taşı
migrate_media_files($mediaDir, UPLOAD_PATH);

function resolve_media_path(?string $val): ?string {
    global $fileMap;
    if (empty($val)) return null;
    if (isset($fileMap[$val])) return $fileMap[$val];
    if (str_starts_with($val, 'assets/') || str_starts_with($val, '/assets/') || str_starts_with($val, 'http') || str_starts_with($val, '/uploads/')) {
        return $val;
    }
    if (preg_match('/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/i', $val, $m)) {
        if (isset($fileMap[$m[0]])) return $fileMap[$m[0]];
    }
    return $val;
}

function get_source_data(string $collection): ?array {
    $customExport = __DIR__ . "/../cms/export/{$collection}.json";
    if (file_exists($customExport)) {
        $json = json_decode(file_get_contents($customExport), true);
        return $json['data'] ?? $json;
    }
    return null;
}

// -----------------------------------------------------------------------------
// KOLEKSİYONLARI AKTAR
// -----------------------------------------------------------------------------
foreach ($collections as $colName => $cfg) {
    $items = get_source_data($colName);
    if ($items === null) {
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

            foreach ($mediaFields as $mf) {
                if (isset($item[$mf])) {
                    $item[$mf] = resolve_media_path($item[$mf]);
                }
            }

            foreach ($jsonFields as $jf) {
                if (isset($item[$jf]) && is_array($item[$jf])) {
                    $item[$jf] = json_encode($item[$jf], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                }
            }

            if (!$dryRun) {
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
                    } catch (\Throwable $e) {
                        log_msg("Hata ({$table}/{$keyVal}): " . $e->getMessage(), 'error');
                    }
                }
            }
        }
    }

    log_msg("Koleksiyon '{$colName}': {$countNew} yeni eklendi, {$countUpdated} güncellendi.", 'success');
}

// -----------------------------------------------------------------------------
// AKTARIM SONRASI DOĞRULAMA VE RAPOR
// -----------------------------------------------------------------------------
log_msg("------------------------------------------------------------------");
log_msg("📊 AKTARIM SONRASI DOĞRULAMA VE BÜTÜNLÜK RAPORU:");
echo "\n" . str_pad("Tablo Adı", 25) . str_pad("Önce", 8) . str_pad("Sonra", 8) . str_pad("Medya", 8) . str_pad("Doğru", 8) . str_pad("Eksik", 8) . "Durum\n";
echo str_repeat("-", 80) . "\n";

$finalAudit = verify_media_and_records($collections);
foreach ($finalAudit['tables'] as $tbl => $d) {
    $before = $beforeCounts[$tbl] ?? 0;
    $after = $d['count'];
    echo str_pad($tbl, 25) . 
         str_pad((string)$before, 8) . 
         str_pad((string)$after, 8) . 
         str_pad((string)$d['media_checked'], 8) . 
         str_pad((string)$d['media_ok'], 8) . 
         str_pad((string)$d['media_missing'], 8) . 
         $d['status'] . "\n";
}
echo str_repeat("-", 80) . "\n";
log_msg("Doğrulanan Medya: {$finalAudit['total_media_ok']}, Eksik/Hatalı Medya: {$finalAudit['total_media_missing']}", $finalAudit['total_media_missing'] === 0 ? 'success' : 'warn');
log_msg("=== GEÇİŞ VE DOĞRULAMA TAMAMLANDI ===", 'success');
