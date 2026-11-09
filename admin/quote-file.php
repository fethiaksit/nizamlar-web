<?php
/**
 * NİZAMLAR BASKI — GÜVENLİ TEKLİF DOSYASI İNDİRME ENDPOINT'İ
 * 
 * Yalnızca oturum açmış yetkili yöneticiler indirebilir.
 * Path traversal (dizin aşma) saldırılarına karşı tam korumalıdır.
 */

define('NIZAMLAR_APP', true);
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/helpers.php';
require_once __DIR__ . '/../config/auth.php';

require_admin(false);

$file = $_GET['file'] ?? '';
$id   = (int)($_GET['id'] ?? 0);

$quote = null;
if ($id > 0) {
    $quote = DB::fetch("SELECT * FROM `quote_requests` WHERE `id` = :id LIMIT 1", [':id' => $id]);
    if ($quote && !empty($quote['file_url'])) {
        // file_url'den dosya adını çıkar: /admin/quote-file.php?file=xyz.pdf
        parse_str(parse_url($quote['file_url'], PHP_URL_QUERY) ?? '', $queryParams);
        $file = $queryParams['file'] ?? basename($quote['file_url']);
    }
}

$safeFileName = basename($file);

if (empty($safeFileName) || !preg_match('/^[a-zA-Z0-9_\-\.]{5,100}$/', $safeFileName)) {
    http_response_code(400);
    die('Geçersiz dosya parametresi.');
}

$fullPath = PRIVATE_QUOTES_DIR . '/' . $safeFileName;

if (!file_exists($fullPath) || !is_file($fullPath)) {
    http_response_code(404);
    die('Talep edilen tasarım dosyası sunucuda bulunamadı veya silinmiş.');
}

$displayName = $quote['file_name'] ?? $safeFileName;
$displayName = str_replace(['"', "'", "\r", "\n"], '', $displayName);
$mimeType = mime_content_type($fullPath) ?: 'application/octet-stream';

header('Content-Type: ' . $mimeType);
header('Content-Disposition: attachment; filename="' . $displayName . '"');
header('Content-Length: ' . filesize($fullPath));
header('Cache-Control: private, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

readfile($fullPath);
exit;
