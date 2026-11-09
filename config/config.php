<?php
/**
 * NİZAMLAR BASKI — MERKEZİ YAPILANDIRMA (CONFIG)
 * 
 * TürkTicaret cPanel Hosting ve yerel geliştirme uyumlu.
 * Hassas bilgiler bu dosyada veya kök dizindeki / üst dizindeki .env dosyasında saklanabilir.
 * Canlı sunucu kurulumunda veritabanı bilgilerinizi .env içine veya buraya giriniz.
 */

if (!defined('NIZAMLAR_APP')) {
    define('NIZAMLAR_APP', true);
}

// Hata raporlama: Canlıda hataları gizle, loglara yaz
$isDev = (isset($_SERVER['SERVER_NAME']) && in_array($_SERVER['SERVER_NAME'], ['localhost', '127.0.0.1']));
if ($isDev) {
    ini_set('display_errors', '1');
    ini_set('display_startup_errors', '1');
    error_reporting(E_ALL);
} else {
    ini_set('display_errors', '0');
    ini_set('display_startup_errors', '0');
    error_reporting(E_ALL & ~E_DEPRECATED);
    ini_set('log_errors', '1');
}

// Dizin Yolları
define('ROOT_DIR', dirname(__DIR__));
define('STORAGE_DIR', ROOT_DIR . '/storage');
define('STORAGE_PATH', STORAGE_DIR);
define('PRIVATE_QUOTES_DIR', STORAGE_DIR . '/quotes');
define('UPLOADS_DIR', ROOT_DIR . '/uploads');
define('UPLOAD_PATH', UPLOADS_DIR);

// .env dosyasını oku (Önce public_html DIŞINDAKİ /home/user/.env, sonra web kökündeki .env kontrol edilir)
$possibleEnvPaths = [
    dirname(ROOT_DIR) . '/.env',  // cPanel: /home/cpanelkullanici/.env (public_html DIŞI - En güvenli)
    ROOT_DIR . '/.env'            // Web kök dizini (public_html/.env)
];

foreach ($possibleEnvPaths as $envFile) {
    if (file_exists($envFile) && is_readable($envFile)) {
        $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '' || $line[0] === '#') continue;
            if (strpos($line, '=') !== false) {
                list($k, $v) = explode('=', $line, 2);
                $k = trim($k);
                $v = trim($v, " \t\n\r\0\x0B\"'");
                if (!isset($_ENV[$k]) && !isset($_SERVER[$k])) {
                    putenv("$k=$v");
                    $_ENV[$k] = $v;
                    $_SERVER[$k] = $v;
                }
            }
        }
        break; // İlk bulunan .env dosyasını uygula
    }
}

// Ortam değişkeni okuma yardımcısı
function env_get($key, $default = null) {
    $val = getenv($key);
    if ($val !== false && $val !== '') return $val;
    if (isset($_ENV[$key]) && $_ENV[$key] !== '') return $_ENV[$key];
    if (isset($_SERVER[$key]) && $_SERVER[$key] !== '') return $_SERVER[$key];
    return $default;
}

// Güvenli APP_SECRET Belirleme (Sabit kodlanmış şifre kaldırıldı)
function get_or_create_app_secret(): string {
    $envSecret = env_get('APP_SECRET');
    if (!empty($envSecret) && strlen($envSecret) >= 32 && !str_contains($envSecret, 'change-in-production')) {
        return $envSecret;
    }

    $secretFile = STORAGE_DIR . '/app_secret.key';
    if (file_exists($secretFile) && is_readable($secretFile)) {
        $stored = trim((string)file_get_contents($secretFile));
        if (strlen($stored) >= 32) {
            return $stored;
        }
    }

    // Storage dizini yoksa oluştur
    if (!is_dir(STORAGE_DIR)) {
        @mkdir(STORAGE_DIR, 0755, true);
    }

    // 256-bit kriptografik rastgele anahtar üret ve sakla
    try {
        $generated = bin2hex(random_bytes(32));
        if (is_writable(STORAGE_DIR)) {
            @file_put_contents($secretFile, $generated, LOCK_EX);
            @chmod($secretFile, 0600);
        }
        return $generated;
    } catch (\Throwable $e) {
        return hash('sha256', php_uname() . __FILE__ . (microtime(true) * 1000));
    }
}

define('APP_SECRET', get_or_create_app_secret());
define('SESSION_LIFETIME', 86400); // 24 saat
define('MAX_UPLOAD_BYTES', 25 * 1024 * 1024); // 25 MB

// Veritabanı Yapılandırması
// TürkTicaret cPanel'de cPanel > MySQL Veritabanları alanından oluşturulan bilgiler girilir.
define('DB_DRIVER', env_get('DB_DRIVER', 'mysql')); // 'mysql' veya 'sqlite'
define('DB_HOST', env_get('DB_HOST', 'localhost'));
define('DB_PORT', env_get('DB_PORT', '3306'));
define('DB_NAME', env_get('DB_NAME', 'nizamlar_baski'));
define('DB_USER', env_get('DB_USER', 'nizamlar_user'));
define('DB_PASS', env_get('DB_PASS', ''));
define('DB_CHARSET', env_get('DB_CHARSET', 'utf8mb4'));
define('DB_SQLITE_PATH', env_get('DB_SQLITE_PATH', STORAGE_DIR . '/database.sqlite'));

// Oturum başlatma güvenliği
function init_secure_session() {
    if (session_status() === PHP_SESSION_NONE) {
        $isHttps = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') ||
                   (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https');
        
        ini_set('session.use_strict_mode', '1');
        ini_set('session.use_only_cookies', '1');
        
        session_set_cookie_params([
            'lifetime' => SESSION_LIFETIME,
            'path'     => '/',
            'domain'   => '',
            'secure'   => $isHttps,
            'httponly' => true,
            'samesite' => 'Lax'
        ]);
        
        session_name('NIZAMLAR_SESSION');
        session_start();
    }
}
