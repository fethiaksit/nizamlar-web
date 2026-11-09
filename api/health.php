<?php
/**
 * NİZAMLAR BASKI — SİSTEM SAĞLIK KONTROLÜ (HEALTH CHECK)
 */

define('NIZAMLAR_APP', true);
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/helpers.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$dbStatus = 'offline';
$dbError = null;

try {
    $pdo = DB::connect();
    $res = DB::fetch("SELECT 1 as ping");
    if ($res && $res['ping'] == 1) {
        $dbStatus = 'online';
    }
} catch (Exception $e) {
    $dbError = $isDev ? $e->getMessage() : 'Veritabanı bağlantı hatası';
}

$quoteStorageWritable = is_dir(PRIVATE_QUOTES_DIR) ? is_writable(PRIVATE_QUOTES_DIR) : is_writable(STORAGE_DIR);
$uploadsWritable = is_dir(UPLOADS_DIR) ? is_writable(UPLOADS_DIR) : is_writable(ROOT_DIR);

$health = [
    'status'       => ($dbStatus === 'online') ? 'ok' : 'degraded',
    'database'     => $dbStatus,
    'php_version'  => phpversion(),
    'db_driver'    => DB_DRIVER,
    'storage'      => [
        'quotes_writable'  => $quoteStorageWritable,
        'uploads_writable' => $uploadsWritable,
    ],
    'max_upload'   => ini_get('upload_max_filesize'),
    'post_max'     => ini_get('post_max_size'),
    'timestamp'    => date('c')
];

if ($dbError) {
    $health['db_error'] = $dbError;
}

json_response($health, ($dbStatus === 'online') ? 200 : 503);
