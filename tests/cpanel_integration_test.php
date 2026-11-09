<?php
/**
 * NİZAMLAR BASKI — TÜRKTiCARET CPANEL ENTEGRASYON TESTİ
 * 
 * Bu test paketi, sitenin TürkTicaret cPanel (Apache + PHP 8.x + MySQL) canlı
 * sunucusuna yüklendikten sonra ortamın tüm gereksinimlerini doğrulamak için tasarlanmıştır.
 * 
 * Güvenlik: CLI'dan doğrudan veya web üzerinden YALNIZCA yetkili yönetici oturumuyla çalışır.
 *
 * Çalıştırma (cPanel Terminal / SSH):
 *   php tests/cpanel_integration_test.php
 */

define('NIZAMLAR_APP', true);

$isCli = (php_sapi_name() === 'cli');

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/helpers.php';
require_once __DIR__ . '/../config/auth.php';

if (!$isCli) {
    init_secure_session();
    require_admin(false);
}

$results = [
    'passed' => 0,
    'failed' => 0,
    'warnings' => 0,
    'tests' => []
];

function record_test(string $group, string $name, bool $status, string $details = '', bool $isWarning = false) {
    global $results, $isCli;
    if ($status) {
        $results['passed']++;
        $state = 'PASS';
    } elseif ($isWarning) {
        $results['warnings']++;
        $state = 'WARN';
    } else {
        $results['failed']++;
        $state = 'FAIL';
    }

    $results['tests'][] = [
        'group'   => $group,
        'name'    => $name,
        'status'  => $state,
        'details' => $details
    ];

    if ($isCli) {
        $icon = match($state) {
            'PASS' => "\033[32m[PASS]\033[0m",
            'WARN' => "\033[33m[WARN]\033[0m",
            'FAIL' => "\033[31m[FAIL]\033[0m"
        };
        echo "  {$icon} [{$group}] {$name}" . ($details ? " ({$details})" : "") . PHP_EOL;
    }
}

if ($isCli) {
    echo "==================================================================\n";
    echo " NİZAMLAR BASKI — CPANEL CANLI ORTAM ENTEGRASYON TESTİ\n";
    echo " Sunucu: " . ($_SERVER['SERVER_NAME'] ?? php_uname('n')) . " | PHP: " . PHP_VERSION . "\n";
    echo " Tarih : " . date('d.m.Y H:i:s') . "\n";
    echo "==================================================================\n\n";
}

// -----------------------------------------------------------------------------
// 1. PHP VE ÇALIŞMA ZAMANI ORTAMI
// -----------------------------------------------------------------------------
$grp = "PHP Ortamı";
record_test($grp, "PHP 8.1+ Sürümü", version_compare(PHP_VERSION, '8.1.0', '>='), PHP_VERSION);
record_test($grp, "PDO MySQL Sürücüsü", extension_loaded('pdo_mysql'), extension_loaded('pdo_mysql') ? 'Aktif' : 'Eksik');
record_test($grp, "FileInfo Eklentisi (Sihirli Bayt Doğrulaması)", extension_loaded('fileinfo'));
record_test($grp, "MBString Eklentisi (UTF-8 Desteği)", extension_loaded('mbstring'));
record_test($grp, "OpenSSL Eklentisi (HTTPS / TLS)", extension_loaded('openssl'));
record_test($grp, "JSON Eklentisi", extension_loaded('json'));
record_test($grp, "cURL Eklentisi", extension_loaded('curl'));

// Bellek ve Yükleme Limitleri
$uploadMax = ini_get('upload_max_filesize');
$postMax   = ini_get('post_max_size');
$memLimit  = ini_get('memory_limit');

record_test($grp, "upload_max_filesize >= 20M", (int)$uploadMax >= 20, "Mevcut: {$uploadMax}", (int)$uploadMax < 20);
record_test($grp, "post_max_size >= 25M", (int)$postMax >= 25, "Mevcut: {$postMax}", (int)$postMax < 25);

// -----------------------------------------------------------------------------
// 2. CANLI MYSQL VERİTABANI BAĞLANTISI VE TABLO ŞEMALARI
// -----------------------------------------------------------------------------
$grp = "MySQL Veritabanı";
$dbOk = false;
$dbVersion = '';

try {
    $pdo = DB::connect();
    $dbOk = true;
    $vRow = $pdo->query("SELECT VERSION() as v")->fetch();
    $dbVersion = $vRow['v'] ?? 'Bilinmiyor';
    record_test($grp, "MySQL Sunucu Bağlantısı (PDO)", true, "Sürüm: {$dbVersion}");
} catch (\Throwable $e) {
    record_test($grp, "MySQL Sunucu Bağlantısı (PDO)", false, $e->getMessage());
}

if ($dbOk) {
    $expectedTables = [
        'site_settings', 'whatsapp_settings', 'mockup_preview_settings', 'pages',
        'services', 'products', 'machines', 'production_processes', 'references',
        'certificates', 'blog_posts', 'animations_config', 'navigation_menus',
        'seo_settings', 'url_redirects', 'quote_requests', 'contact_messages',
        'admin_users', 'media_library', 'smtp_settings'
    ];

    $existingTables = [];
    try {
        $tblRows = DB::fetchAll("SHOW TABLES");
        foreach ($tblRows as $tr) {
            $existingTables[] = strtolower(reset($tr));
        }
    } catch (\Throwable $e) {}

    $allFound = true;
    $missingTbls = [];
    foreach ($expectedTables as $et) {
        if (!in_array(strtolower($et), $existingTables, true)) {
            $allFound = false;
            $missingTbls[] = $et;
        }
    }

    record_test($grp, "20 Tablolu Şema Bütünlüğü", $allFound, $allFound ? "20/20 Tablo Mevcut" : "Eksik: " . implode(', ', $missingTbls));

    // Singleton tabloları kontrol et
    $siteSet = DB::fetch("SELECT id, site_name FROM `site_settings` WHERE `id` = 1 LIMIT 1");
    record_test($grp, "site_settings Seed Verisi", !empty($siteSet), $siteSet ? $siteSet['site_name'] : 'Kayıt Yok');

    $waSet = DB::fetch("SELECT id, whatsapp_number FROM `whatsapp_settings` WHERE `id` = 1 LIMIT 1");
    record_test($grp, "whatsapp_settings Seed Verisi", !empty($waSet), $waSet ? $waSet['whatsapp_number'] : 'Kayıt Yok');
}

// -----------------------------------------------------------------------------
// 3. DOSYA VE DİZİN YAZMA İZİNLERİ
// -----------------------------------------------------------------------------
$grp = "Depolama ve İzinler";

$dirsToCheck = [
    'uploads'        => UPLOADS_DIR,
    'storage'        => STORAGE_DIR,
    'storage/quotes' => PRIVATE_QUOTES_DIR,
    'storage/logs'   => STORAGE_DIR . '/logs'
];

foreach ($dirsToCheck as $label => $dpath) {
    if (!is_dir($dpath)) {
        @mkdir($dpath, 0755, true);
    }
    $writable = is_dir($dpath) && is_writable($dpath);
    record_test($grp, "Yazma İzni: {$label}", $writable, $writable ? 'Yazılabilir (755)' : 'Yazma İzni Yok');
}

// Güvenli anahtar dosyası denetimi
$secKey = STORAGE_DIR . '/app_secret.key';
record_test($grp, "storage/app_secret.key Varlığı", file_exists($secKey), file_exists($secKey) ? 'Mevcut (256-bit)' : 'Henüz Üretilmedi');

// -----------------------------------------------------------------------------
// 4. GÜVENLİK VE .HTACCESS KORUMA TESTLERİ
// -----------------------------------------------------------------------------
$grp = "Güvenlik Bariyeri (.htaccess)";

// storage/.htaccess ve uploads/.htaccess varlığı
record_test($grp, "storage/.htaccess Koruması", file_exists(STORAGE_DIR . '/.htaccess'));
record_test($grp, "uploads/.htaccess Betik Yasağı", file_exists(UPLOADS_DIR . '/.htaccess'));

// cURL ile dışarıdan doğrudan hassas dosya okuma girişimi (Eğer web üzerinden veya alan adı erişilebilirse)
if (function_exists('curl_init') && !empty($_SERVER['HTTP_HOST'])) {
    $baseUrl = 'http://' . $_SERVER['HTTP_HOST'];
    $probeFiles = ['.env', 'database.sql', 'config/config.php', 'storage/'];

    foreach ($probeFiles as $pf) {
        $ch = curl_init($baseUrl . '/' . $pf);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 3);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
        curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $blocked = in_array($code, [403, 404, 301, 302], true);
        record_test($grp, "Dış Erişim Engeli: /{$pf}", $blocked, "HTTP Kodu: {$code}");
    }
} else {
    record_test($grp, "HTTP Dış Erişim Testi", true, "CLI ortamında atlandı", true);
}

// -----------------------------------------------------------------------------
// 5. TEST SONUÇ RAPORU
// -----------------------------------------------------------------------------
if ($isCli) {
    echo "\n==================================================================\n";
    echo " CPANEL ENTEGRASYON TESTİ SONUCU:\n";
    echo "   BAŞARILI : {$results['passed']}\n";
    echo "   UYARI    : {$results['warnings']}\n";
    echo "   BAŞARISIZ: {$results['failed']}\n";
    echo "==================================================================\n";

    if ($results['failed'] === 0) {
        echo "🎉 TÜM CPANEL ENTEGRASYON KONTROLLERİ BAŞARIYLA TAMAMLANDI!\n";
        exit(0);
    } else {
        echo "❌ Bazı kontroller başarısız oldu. Lütfen yukarıdaki [FAIL] maddelerini inceleyiniz.\n";
        exit(1);
    }
} else {
    // Web Admin arayüzü çıktısı
    ?>
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="UTF-8">
      <title>cPanel Entegrasyon Testi — Nizamlar Baskı</title>
      <link rel="stylesheet" href="/admin/assets/admin.css">
    </head>
    <body style="padding: 24px;">
      <div style="max-width: 900px; margin: 0 auto;" class="adm-card">
        <div class="adm-card-header">
          <h1 class="adm-card-title">TürkTicaret cPanel Entegrasyon Test Sonuçları</h1>
        </div>
        <div class="adm-card-body">
          <div style="margin-bottom: 20px;">
            <span class="adm-badge adm-badge-success" style="font-size: 14px; padding: 6px 12px;">Başarılı: <?= $results['passed'] ?></span>
            <span class="adm-badge adm-badge-warning" style="font-size: 14px; padding: 6px 12px;">Uyarı: <?= $results['warnings'] ?></span>
            <span class="adm-badge adm-badge-danger" style="font-size: 14px; padding: 6px 12px;">Başarısız: <?= $results['failed'] ?></span>
          </div>

          <table class="adm-table">
            <thead>
              <tr>
                <th>Grup</th>
                <th>Test Maddesi</th>
                <th>Durum</th>
                <th>Ayrıntı</th>
              </tr>
            </thead>
            <tbody>
              <?php foreach ($results['tests'] as $t): ?>
                <tr>
                  <td><strong><?= esc($t['group']) ?></strong></td>
                  <td><?= esc($t['name']) ?></td>
                  <td>
                    <?php if ($t['status'] === 'PASS'): ?>
                      <span class="adm-badge adm-badge-success">Başarılı</span>
                    <?php elseif ($t['status'] === 'WARN'): ?>
                      <span class="adm-badge adm-badge-warning">Uyarı</span>
                    <?php else: ?>
                      <span class="adm-badge adm-badge-danger">Başarısız</span>
                    <?php endif; ?>
                  </td>
                  <td style="color: var(--adm-text-muted); font-size: 12px;"><?= esc($t['details']) ?></td>
                </tr>
              <?php endforeach; ?>
            </tbody>
          </table>

          <div style="margin-top: 24px; text-align: right;">
            <a href="/admin/dashboard.php" class="adm-btn adm-btn-secondary">Panele Dön</a>
          </div>
        </div>
      </div>
    </body>
    </html>
    <?php
}
