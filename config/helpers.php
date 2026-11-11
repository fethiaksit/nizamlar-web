<?php
/**
 * NİZAMLAR BASKI — GÜVENLİK VE YARDIMCI FONKSİYONLAR
 */

if (!defined('NIZAMLAR_APP')) {
    require_once __DIR__ . '/config.php';
}

/**
 * XSS Koruması için HTML kaçış fonksiyonu
 */
function esc(?string $str): string {
    return htmlspecialchars((string)$str, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/**
 * Girdi temizleme (boşluklar, kontrol karakterleri ve uzunluk sınırı)
 */
function clean_input(?string $val, int $max = 1000): string {
    if ($val === null) return '';
    $clean = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F]/u', '', trim($val));
    return mb_substr($clean, 0, $max, 'UTF-8');
}

/**
 * JSON yanıtı döndürme
 */
function json_response(array $data, int $status = 200): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/**
 * İstemci IP adresi
 */
function get_client_ip(): string {
    $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $parts = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
        $candidate = trim($parts[0]);
        if (filter_var($candidate, FILTER_VALIDATE_IP)) {
            $ip = $candidate;
        }
    }
    return $ip;
}

/**
 * Türkçe uyumlu SEO Slug üretici
 */
function slugify(string $text): string {
    $tr = ['ı' => 'i', 'ğ' => 'g', 'ü' => 'u', 'ş' => 's', 'ö' => 'o', 'ç' => 'c',
           'I' => 'i', 'Ğ' => 'g', 'Ü' => 'u', 'Ş' => 's', 'Ö' => 'o', 'Ç' => 'c'];
    $text = strtr($text, $tr);
    $text = preg_replace('/[^a-zA-Z0-9\s-]/', '', strtolower($text));
    $text = preg_replace('/[\s-]+/', '-', trim($text));
    return trim($text, '-');
}

/**
 * Türkçe slug için yardımcı takma ad
 */
function turkish_slug(string $text): string {
    return slugify($text);
}

/**
 * Basit IP bazlı hız sınırlaması (Rate Limiting)
 */
function check_rate_limit(string $action, int $maxHits = 10, int $windowSeconds = 600): bool {
    $ipHash = hash('sha256', get_client_ip() . $action);
    $cacheDir = STORAGE_DIR . '/rate_limits';
    if (!is_dir($cacheDir)) {
        @mkdir($cacheDir, 0755, true);
    }
    $file = $cacheDir . '/' . $ipHash . '.json';
    $now = time();
    $hits = [];

    if (file_exists($file)) {
        $data = json_decode((string)file_get_contents($file), true);
        if (is_array($data)) {
            $hits = array_filter($data, fn($t) => ($now - $t) < $windowSeconds);
        }
    }

    if (count($hits) >= $maxHits) {
        return false;
    }

    $hits[] = $now;
    @file_put_contents($file, json_encode($hits), LOCK_EX);
    return true;
}

/**
 * İkili dosya içeriği doğrulaması (Binary magic bytes & SVG script kontrolü)
 * Yalnızca uzantıya değil, dosyanın ilk baytlarına ve içeriğine bakar.
 */
function validate_file_content(string $filePath, string $ext): bool {
    if (!file_exists($filePath) || !is_readable($filePath)) return false;
    $ext = strtolower($ext);

    $fp = fopen($filePath, 'rb');
    if (!$fp) return false;
    $header = fread($fp, 512);
    fclose($fp);

    $starts = fn(string $sig) => substr($header, 0, strlen($sig)) === $sig;

    switch ($ext) {
        case 'pdf':
            return $starts("%PDF");
        case 'ai':
            return $starts("%PDF") || $starts("%!");
        case 'psd':
            return $starts("8BPS");
        case 'png':
            return $starts("\x89PNG\r\n\x1a\n");
        case 'webp':
            return $starts("RIFF") && substr($header, 8, 4) === "WEBP";
        case 'jpg':
        case 'jpeg':
            return $starts("\xFF\xD8\xFF");
        case 'tif':
        case 'tiff':
            return $starts("II*\x00") || $starts("MM\x00*");
        case 'zip':
            return $starts("PK\x03\x04") || $starts("PK\x05\x06");
        case 'rar':
            return $starts("Rar!\x1a\x07");
        case 'svg':
            $content = file_get_contents($filePath, false, null, 0, 8192);
            if (!preg_match('/<svg[\s>]/i', $content)) return false;
            // Script veya XSS vektörlerini engelle
            if (preg_match('/<script|onload\s*=|onerror\s*=|javascript:/i', $content)) return false;
            return true;
        default:
            return false;
    }
}

/**
 * HTML Şablon doldurucu (SSR render)
 */
function render_template_file(string $templateFile, array $vars): string {
    $fullPath = ROOT_DIR . '/templates/' . $templateFile;
    if (!file_exists($fullPath)) {
        throw new Exception("Şablon dosyası bulunamadı: " . $templateFile);
    }
    $html = file_get_contents($fullPath);
    foreach ($vars as $k => $v) {
        $isRaw = str_ends_with($k, '_RAW') || str_ends_with($k, '_HTML');
        $val = $isRaw ? (string)$v : esc((string)$v);
        $html = str_replace('{{' . $k . '}}', $val, $html);
    }
    return $html;
}
