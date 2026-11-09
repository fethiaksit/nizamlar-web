<?php
/**
 * NİZAMLAR BASKI — YÖNETİM PANELİ ANA YÖNLENDİRİCİSİ
 */

define('NIZAMLAR_APP', true);
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/auth.php';

// Veritabanında admin kullanıcısı var mı kontrol et
try {
    $hasUser = DB::fetch("SELECT COUNT(*) as cnt FROM `admin_users`");
    if (!$hasUser || (int)$hasUser['cnt'] === 0) {
        header('Location: /admin/install.php');
        exit;
    }
} catch (Exception $e) {
    // Veritabanı henüz kurulmamış olabilir
    header('Location: /admin/install.php');
    exit;
}

if (is_authenticated()) {
    header('Location: /admin/dashboard.php');
    exit;
}

header('Location: /admin/login.php');
exit;
