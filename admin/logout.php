<?php
/**
 * NİZAMLAR BASKI — GÜVENLİ ÇIKIŞ (LOGOUT)
 */

define('NIZAMLAR_APP', true);
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/auth.php';

admin_logout();
header('Location: /admin/login.php');
exit;
