<?php
/**
 * NİZAMLAR BASKI — PUBLIC İÇERİK API'Sİ
 * 
 * /api/public/:collection veya /api/public.php?collection=:collection
 * Yalnızca yayımlanmış içerikleri döner.
 * Directus ile %100 uyumlu { data: ... } JSON yapısı sunar.
 */

define('NIZAMLAR_APP', true);
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/helpers.php';
require_once __DIR__ . '/../config/auth.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('X-Content-Type-Options: nosniff');

$collection = clean_input($_GET['collection'] ?? '', 80);
if (empty($collection)) {
    // /api/public/pages gibi path_info veya rewrite desteği
    $path = $_SERVER['PATH_INFO'] ?? '';
    $collection = trim($path, '/');
}

$PUBLIC_COLLECTIONS = [
    'site_settings'           => ['singleton' => true],
    'whatsapp_settings'       => ['singleton' => true],
    'mockup_preview_settings' => ['singleton' => true],
    'pages'                   => ['status' => true, 'slugIn' => true, 'filters' => ['slug']],
    'products'                => ['status' => true, 'sort' => 'sort ASC'],
    'services'                => ['status' => true, 'sort' => 'sort ASC', 'filters' => ['slug']],
    'machines'                => ['status' => true, 'sort' => 'sort ASC'],
    'production_processes'    => ['status' => true, 'sort' => 'sort ASC, step_number ASC'],
    'references'              => ['status' => true, 'sort' => 'sort ASC'],
    'certificates'            => ['status' => true, 'sort' => 'sort ASC'],
    'blog_posts'              => ['status' => true, 'sort' => 'published_date DESC', 'filters' => ['slug']],
    'animations_config'       => ['status' => true, 'filters' => ['key']],
    'navigation_menus'        => ['status' => true, 'sort' => 'sort ASC'],
    'seo_settings'            => ['filters' => ['page_slug']],
    'url_redirects'           => ['filters' => ['from_path']]
];

if (!isset($PUBLIC_COLLECTIONS[$collection])) {
    json_response(['error' => 'Bilinmeyen veya erişime kapalı koleksiyon: ' . esc($collection)], 404);
}

$cfg = $PUBLIC_COLLECTIONS[$collection];
$wantsPreview = isset($_GET['preview']) && ($_GET['preview'] === '1' || $_GET['preview'] === 'true');
$preview = $wantsPreview && is_authenticated();

try {
    // JSON alanlarını çözme listesi
    $jsonFields = ['sections_data', 'features', 'specs', 'gallery_images', 'config_json', 'old_slugs'];

    if (!empty($cfg['singleton'])) {
        $row = DB::fetch("SELECT * FROM `{$collection}` WHERE `id` = 1 LIMIT 1");
        if (!$row) {
            $row = DB::fetch("SELECT * FROM `{$collection}` LIMIT 1");
        }
        if ($row) {
            foreach ($jsonFields as $f) {
                if (isset($row[$f]) && is_string($row[$f])) {
                    $decoded = json_decode($row[$f], true);
                    if ($decoded !== null) $row[$f] = $decoded;
                }
            }
        }
        json_response(['data' => $row ?: (object)[]]);
    }

    $where = [];
    $params = [];

    // Durum filtresi (Yalnızca yayınlananlar; önizleme oturumu varsa taslaklar da döner)
    if (!empty($cfg['status']) && !$preview) {
        $where[] = "`status` = 'published'";
    }

    // Filtreler (slug, key, vb.)
    if (!empty($cfg['filters'])) {
        foreach ($cfg['filters'] as $f) {
            if (isset($_GET[$f]) && $_GET[$f] !== '') {
                $val = clean_input($_GET[$f], 160);
                $paramName = ":f_{$f}";
                $where[] = "`{$f}` = {$paramName}";
                $params[$paramName] = $val;
            }
        }
    }

    // Directus filter[...] sözdizimi desteği: filter[slug][_eq]=...
    if (!empty($_GET['filter']) && is_array($_GET['filter'])) {
        foreach ($_GET['filter'] as $f => $opVal) {
            if (is_array($opVal) && isset($opVal['_eq'])) {
                $val = clean_input($opVal['_eq'], 160);
                $paramName = ":eq_{$f}";
                $where[] = "`{$f}` = {$paramName}";
                $params[$paramName] = $val;
            } elseif (is_string($opVal)) {
                $val = clean_input($opVal, 160);
                $paramName = ":eq_{$f}";
                $where[] = "`{$f}` = {$paramName}";
                $params[$paramName] = $val;
            }
        }
    }

    // Slugs virgülle ayrılmış liste filtresi: ?slugs=home,hakkimizda
    if (!empty($cfg['slugIn']) && !empty($_GET['slugs'])) {
        $slugList = explode(',', (string)$_GET['slugs']);
        $inPlaceholders = [];
        foreach ($slugList as $idx => $s) {
            $s = clean_input($s, 80);
            if ($s !== '') {
                $p = ":slugIn_{$idx}";
                $inPlaceholders[] = $p;
                $params[$p] = $s;
            }
        }
        if (!empty($inPlaceholders)) {
            $where[] = "`slug` IN (" . implode(',', $inPlaceholders) . ")";
        }
    }

    $sql = "SELECT * FROM `{$collection}`";
    if (!empty($where)) {
        $sql .= " WHERE " . implode(" AND ", $where);
    }
    if (!empty($cfg['sort'])) {
        $sql .= " ORDER BY " . $cfg['sort'];
    }

    $rows = DB::fetchAll($sql, $params);

    // JSON alanlarını çöz
    foreach ($rows as &$r) {
        foreach ($jsonFields as $f) {
            if (isset($r[$f]) && is_string($r[$f])) {
                $decoded = json_decode($r[$f], true);
                if ($decoded !== null) $r[$f] = $decoded;
            }
        }
    }
    unset($r);

    json_response(['data' => $rows]);
} catch (Exception $e) {
    error_log("Public API hatası ({$collection}): " . $e->getMessage());
    json_response(['error' => 'CMS verisi okunamadı', 'message' => $isDev ? $e->getMessage() : null], 500);
}
