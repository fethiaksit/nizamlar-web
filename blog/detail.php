<?php
/**
 * NİZAMLAR BASKI — BLOG DETAY SAYFASI (SSR ROUTER)
 * 
 * /blog/:slug/ adresini templates/blog-post.html şablonuyla sunar.
 * 301 yönlendirmeleri, taslak denetimi ve 404 sayfasına düşüşü yönetir.
 */

define('NIZAMLAR_APP', true);
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/helpers.php';
require_once __DIR__ . '/../config/auth.php';

$slug = clean_input($_GET['slug'] ?? '', 150);

if (empty($slug)) {
    header('Location: /blog/');
    exit;
}

try {
    // 1. Veritabanından blog yazısını sorgula
    $item = DB::fetch(
        "SELECT * FROM `blog_posts` WHERE `slug` = :slug LIMIT 1",
        [':slug' => $slug]
    );

    // 2. Bulunamadıysa 301 yönlendirmelerini denetle
    if (!$item) {
        $targetPath = "/blog/{$slug}/";
        $redirect = DB::fetch(
            "SELECT * FROM `url_redirects` WHERE `from_path` = :path LIMIT 1",
            [':path' => $targetPath]
        );
        if ($redirect) {
            header("Location: " . $redirect['to_path'], true, (int)$redirect['status_code']);
            exit;
        }

        // Eski slug listesini JSON içinde ara
        $oldItems = DB::fetchAll("SELECT `slug`, `old_slugs` FROM `blog_posts` WHERE `old_slugs` IS NOT NULL");
        foreach ($oldItems as $oi) {
            $olds = json_decode((string)$oi['old_slugs'], true);
            if (is_array($olds) && in_array($slug, $olds, true)) {
                header("Location: /blog/" . rawurlencode($oi['slug']) . "/", true, 301);
                exit;
            }
        }

        // Bulunamadı -> 404
        http_response_code(404);
        readfile(ROOT_DIR . '/404.html');
        exit;
    }

    // 3. Taslak denetimi (Taslak içerikler ziyaretçilere 404 döner, yöneticiler ?preview=1 ile görebilir)
    $wantsPreview = isset($_GET['preview']) && ($_GET['preview'] === '1' || $_GET['preview'] === 'true');
    $preview = $wantsPreview && is_authenticated();

    if ($item['status'] !== 'published' && !$preview) {
        http_response_code(404);
        readfile(ROOT_DIR . '/404.html');
        exit;
    }

    // 4. Şablon verilerini hazırla
    $pageTitle = $item['title'] . ' | Nizamlar Baskı';
    $pageDesc = $item['summary'] ?? '';

    $coverImage = '/assets/images/placeholder.svg';
    if (!empty($item['cover_image'])) {
        $ci = $item['cover_image'];
        $coverImage = (str_starts_with($ci, '/') || str_starts_with($ci, 'http')) ? $ci : ('/' . $ci);
    }

    $vars = [
        'HEAD_TITLE'   => $pageTitle,
        'TITLE'        => $item['title'],
        'DESC'         => $pageDesc,
        'SLUG'         => $item['slug'],
        'CONTENT_HTML' => $item['content'] ?? '',
        'COVER_IMAGE'  => $coverImage
    ];

    header('Content-Type: text/html; charset=utf-8');
    header('Cache-Control: no-cache, no-store, must-revalidate');
    echo render_template_file('blog-post.html', $vars);
    exit;

} catch (Exception $e) {
    error_log("Blog detay render hatası ($slug): " . $e->getMessage());
    http_response_code(404);
    readfile(ROOT_DIR . '/404.html');
    exit;
}
