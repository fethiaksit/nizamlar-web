<?php
/**
 * NİZAMLAR BASKI — YÖNETİM PANELİ HEADER ŞABLONU
 */

if (!defined('NIZAMLAR_APP')) {
    define('NIZAMLAR_APP', true);
}
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/helpers.php';
require_once __DIR__ . '/../config/auth.php';

require_admin(false);

$admin = current_admin();
$currentPage = basename($_SERVER['PHP_SELF'], '.php');

// Yeni teklif ve mesaj sayılarını çek
$newQuotesCount = 0;
$newMessagesCount = 0;
try {
    $qRow = DB::fetch("SELECT COUNT(*) as cnt FROM `quote_requests` WHERE `status` = 'Yeni'");
    $newQuotesCount = (int)($qRow['cnt'] ?? 0);
    
    $mRow = DB::fetch("SELECT COUNT(*) as cnt FROM `contact_messages` WHERE `status` = 'new'");
    $newMessagesCount = (int)($mRow['cnt'] ?? 0);
} catch (Exception $e) {
    // DB hatası durumunda devam et
}

$pageTitle = $pageTitle ?? 'Yönetim Paneli';
?>
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><?= esc($pageTitle) ?> — Nizamlar Baskı CMS</title>
  <link rel="icon" type="image/svg+xml" href="/assets/images/logo.svg">
  <link rel="stylesheet" href="/admin/assets/admin.css">
</head>
<body>
<div class="adm-layout">
  <!-- SIDEBAR -->
  <aside class="adm-sidebar" id="admSidebar">
    <div class="adm-brand">
      <img src="/assets/images/logo.svg" alt="Nizamlar Baskı">
      <div>
        <div class="adm-brand-text">NİZAMLAR</div>
        <div class="adm-brand-badge">cPanel CMS</div>
      </div>
    </div>

    <nav class="adm-nav">
      <div class="adm-nav-group-title">Genel Bakış</div>
      <a href="/admin/dashboard.php" class="adm-nav-link <?= $currentPage === 'dashboard' ? 'active' : '' ?>">
        <span class="adm-nav-link-content">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          Dashboard
        </span>
      </a>

      <div class="adm-nav-group-title">Müşteri Talepleri</div>
      <a href="/admin/quotes.php" class="adm-nav-link <?= $currentPage === 'quotes' ? 'active' : '' ?>">
        <span class="adm-nav-link-content">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          Teklif Talepleri
        </span>
        <?php if ($newQuotesCount > 0): ?>
          <span class="adm-badge adm-badge-gold"><?= $newQuotesCount ?></span>
        <?php endif; ?>
      </a>

      <a href="/admin/messages.php" class="adm-nav-link <?= $currentPage === 'messages' ? 'active' : '' ?>">
        <span class="adm-nav-link-content">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          İletişim Mesajları
        </span>
        <?php if ($newMessagesCount > 0): ?>
          <span class="adm-badge adm-badge-blue"><?= $newMessagesCount ?></span>
        <?php endif; ?>
      </a>

      <div class="adm-nav-group-title">İçerik Yönetimi</div>
      <a href="/admin/pages.php" class="adm-nav-link <?= $currentPage === 'pages' ? 'active' : '' ?>">
        <span class="adm-nav-link-content">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
          Sayfalar & Hero
        </span>
      </a>

      <a href="/admin/services.php" class="adm-nav-link <?= $currentPage === 'services' ? 'active' : '' ?>">
        <span class="adm-nav-link-content">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
          Hizmetlerimiz
        </span>
      </a>

      <a href="/admin/products.php" class="adm-nav-link <?= $currentPage === 'products' ? 'active' : '' ?>">
        <span class="adm-nav-link-content">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/></svg>
          Baskılı Ürünler
        </span>
      </a>

      <a href="/admin/blog.php" class="adm-nav-link <?= $currentPage === 'blog' ? 'active' : '' ?>">
        <span class="adm-nav-link-content">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1m2 13a2 2 0 0 1-2-2V7m2 13a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/></svg>
          Blog Yazıları
        </span>
      </a>

      <a href="/admin/machines.php" class="adm-nav-link <?= $currentPage === 'machines' ? 'active' : '' ?>">
        <span class="adm-nav-link-content">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          Makine Parkuru
        </span>
      </a>

      <a href="/admin/processes.php" class="adm-nav-link <?= $currentPage === 'processes' ? 'active' : '' ?>">
        <span class="adm-nav-link-content">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
          Üretim Süreçleri
        </span>
      </a>

      <a href="/admin/references.php" class="adm-nav-link <?= $currentPage === 'references' ? 'active' : '' ?>">
        <span class="adm-nav-link-content">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          Referanslar
        </span>
      </a>

      <a href="/admin/certificates.php" class="adm-nav-link <?= $currentPage === 'certificates' ? 'active' : '' ?>">
        <span class="adm-nav-link-content">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          Sertifikalar
        </span>
      </a>

      <div class="adm-nav-group-title">Medya ve Ayarlar</div>
      <a href="/admin/media.php" class="adm-nav-link <?= $currentPage === 'media' ? 'active' : '' ?>">
        <span class="adm-nav-link-content">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          Medya Kütüphanesi
        </span>
      </a>

      <a href="/admin/settings.php" class="adm-nav-link <?= $currentPage === 'settings' ? 'active' : '' ?>">
        <span class="adm-nav-link-content">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>
          Site & İletişim Ayarları
        </span>
      </a>
    </nav>

    <div class="adm-sidebar-footer">
      <div class="adm-user-info">
        <div class="adm-avatar"><?= strtoupper(substr($admin['username'] ?? 'A', 0, 1)) ?></div>
        <div>
          <div class="adm-username"><?= esc($admin['full_name'] ?: $admin['username']) ?></div>
          <div class="adm-user-role"><?= esc($admin['role'] ?? 'Yönetici') ?></div>
        </div>
      </div>
      <a href="/admin/logout.php" title="Güvenli Çıkış" style="color: var(--adm-text-dim); padding: 4px;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
      </a>
    </div>
  </aside>

  <!-- MAIN WRAPPER -->
  <main class="adm-main">
    <header class="adm-topbar">
      <div class="adm-topbar-left">
        <button type="button" class="adm-menu-toggle" id="admMenuToggle" aria-label="Menüyü Aç/Kapat">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
        <h1 class="adm-page-title"><?= esc($pageTitle) ?></h1>
      </div>

      <div class="adm-topbar-actions">
        <a href="/" target="_blank" rel="noopener" class="adm-btn adm-btn-secondary adm-btn-sm">
          <span>Siteyi Görüntüle</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        </a>
      </div>
    </header>

    <div class="adm-content">
