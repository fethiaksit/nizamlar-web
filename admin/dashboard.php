<?php
/**
 * NİZAMLAR BASKI — YÖNETİM PANELİ DASHBOARD
 */

$pageTitle = 'Dashboard';
require_once __DIR__ . '/header.php';

// Sayım metrikleri
$totalQuotes = 0;
$pendingQuotes = 0;
$totalMessages = 0;
$pendingMessages = 0;
$totalServices = 0;
$totalProducts = 0;
$totalBlog = 0;
$totalMachines = 0;

try {
    $qStats = DB::fetch("SELECT COUNT(*) as total, SUM(CASE WHEN `status` = 'Yeni' THEN 1 ELSE 0 END) as pending FROM `quote_requests`");
    $totalQuotes = (int)($qStats['total'] ?? 0);
    $pendingQuotes = (int)($qStats['pending'] ?? 0);

    $mStats = DB::fetch("SELECT COUNT(*) as total, SUM(CASE WHEN `status` = 'new' THEN 1 ELSE 0 END) as pending FROM `contact_messages`");
    $totalMessages = (int)($mStats['total'] ?? 0);
    $pendingMessages = (int)($mStats['pending'] ?? 0);

    $totalServices = (int)(DB::fetch("SELECT COUNT(*) as cnt FROM `services` WHERE `status` = 'published'")['cnt'] ?? 0);
    $totalProducts = (int)(DB::fetch("SELECT COUNT(*) as cnt FROM `products` WHERE `status` = 'published'")['cnt'] ?? 0);
    $totalBlog     = (int)(DB::fetch("SELECT COUNT(*) as cnt FROM `blog_posts` WHERE `status` = 'published'")['cnt'] ?? 0);
    $totalMachines = (int)(DB::fetch("SELECT COUNT(*) as cnt FROM `machines` WHERE `status` = 'published'")['cnt'] ?? 0);

    // Son 5 Teklif
    $recentQuotes = DB::fetchAll("SELECT * FROM `quote_requests` ORDER BY `created_at` DESC LIMIT 5");

    // Son 5 Mesaj
    $recentMessages = DB::fetchAll("SELECT * FROM `contact_messages` ORDER BY `received_at` DESC LIMIT 5");
} catch (Exception $e) {
    echo '<div class="adm-alert adm-alert-danger">Veri yükleme hatası: ' . esc($e->getMessage()) . '</div>';
    $recentQuotes = [];
    $recentMessages = [];
}
?>

<?php if (isset($_GET['installed'])): ?>
  <div class="adm-alert adm-alert-success">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
    <div><strong>Kurulum Başarılı!</strong> Yönetim paneliniz TürkTicaret hosting üzerinde tamamen aktif. Aşağıdan içeriklerinizi ve tekliflerinizi yönetebilirsiniz.</div>
  </div>
<?php endif; ?>

<!-- İSTATİSTİK KARTLARI -->
<div class="adm-grid-4">
  <div class="adm-stat-card">
    <div>
      <div class="adm-stat-label">Teklif Talepleri</div>
      <div class="adm-stat-value"><?= $pendingQuotes ?> <small style="font-size: 14px; font-weight: normal; color: var(--adm-text-dim);">/ <?= $totalQuotes ?> toplam</small></div>
      <?php if ($pendingQuotes > 0): ?>
        <div style="font-size: 11px; color: #f87171; font-weight: 600; margin-top: 4px;">● <?= $pendingQuotes ?> yeni incelenmeyi bekliyor</div>
      <?php else: ?>
        <div style="font-size: 11px; color: var(--adm-text-dim); margin-top: 4px;">Yeni talep bulunmuyor</div>
      <?php endif; ?>
    </div>
    <div class="adm-stat-icon">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
    </div>
  </div>

  <div class="adm-stat-card">
    <div>
      <div class="adm-stat-label">İletişim Mesajları</div>
      <div class="adm-stat-value"><?= $pendingMessages ?> <small style="font-size: 14px; font-weight: normal; color: var(--adm-text-dim);">/ <?= $totalMessages ?> toplam</small></div>
      <?php if ($pendingMessages > 0): ?>
        <div style="font-size: 11px; color: #60a5fa; font-weight: 600; margin-top: 4px;">● <?= $pendingMessages ?> yeni okunmamış mesaj</div>
      <?php else: ?>
        <div style="font-size: 11px; color: var(--adm-text-dim); margin-top: 4px;">Tüm mesajlar okundu</div>
      <?php endif; ?>
    </div>
    <div class="adm-stat-icon" style="color: var(--adm-info);">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
    </div>
  </div>

  <div class="adm-stat-card">
    <div>
      <div class="adm-stat-label">Yayındaki Hizmetler</div>
      <div class="adm-stat-value"><?= $totalServices ?></div>
      <div style="font-size: 11px; color: var(--adm-text-dim); margin-top: 4px;">DTF, Serigrafi & Parça Baskı</div>
    </div>
    <div class="adm-stat-icon">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
    </div>
  </div>

  <div class="adm-stat-card">
    <div>
      <div class="adm-stat-label">Katalog Ürünleri</div>
      <div class="adm-stat-value"><?= $totalProducts ?></div>
      <div style="font-size: 11px; color: var(--adm-text-dim); margin-top: 4px;">Tişört, Sweatshirt, Jogger vb.</div>
    </div>
    <div class="adm-stat-icon">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/></svg>
    </div>
  </div>
</div>

<!-- HIZLI İŞLEM BUTONLARI -->
<div style="display: flex; gap: 12px; margin-bottom: 28px; flex-wrap: wrap;">
  <a href="/admin/quotes.php" class="adm-btn adm-btn-gold">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
    <span>Teklifleri İncele</span>
  </a>
  <a href="/admin/services.php?action=new" class="adm-btn adm-btn-secondary">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
    <span>Yeni Hizmet Ekle</span>
  </a>
  <a href="/admin/products.php?action=new" class="adm-btn adm-btn-secondary">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
    <span>Yeni Ürün Ekle</span>
  </a>
  <a href="/admin/blog.php?action=new" class="adm-btn adm-btn-secondary">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
    <span>Yeni Blog Yazısı</span>
  </a>
  <a href="/admin/media.php" class="adm-btn adm-btn-secondary">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
    <span>Medya Yükle</span>
  </a>
</div>

<!-- TABLOLAR IZGARASI -->
<div class="adm-grid-2">
  <!-- SON TEKLİF TALEPLERİ -->
  <div class="adm-card">
    <div class="adm-card-header">
      <div class="adm-card-title">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        Son Teklif Talepleri
      </div>
      <a href="/admin/quotes.php" class="adm-btn adm-btn-secondary adm-btn-sm">Tümünü Gör (<?= $totalQuotes ?>)</a>
    </div>

    <div class="adm-table-wrap">
      <table class="adm-table">
        <thead>
          <tr>
            <th>Müşteri / Firma</th>
            <th>Baskı / Adet</th>
            <th>Durum</th>
            <th>Tarih</th>
          </tr>
        </thead>
        <tbody>
          <?php if (empty($recentQuotes)): ?>
            <tr><td colspan="4" style="text-align: center; color: var(--adm-text-dim); padding: 24px;">Henüz teklif talebi bulunmuyor.</td></tr>
          <?php else: ?>
            <?php foreach ($recentQuotes as $q): ?>
              <tr>
                <td>
                  <strong><?= esc($q['customer_name']) ?></strong>
                  <?php if (!empty($q['company_name'])): ?>
                    <div style="font-size: 11px; color: var(--adm-text-muted);"><?= esc($q['company_name']) ?></div>
                  <?php endif; ?>
                </td>
                <td>
                  <div><?= esc($q['print_type']) ?></div>
                  <div style="font-size: 11px; color: var(--adm-text-dim);"><?= esc($q['quantity']) ?></div>
                </td>
                <td>
                  <?php
                    $pClass = match($q['status']) {
                      'Yeni' => 'adm-pill-new',
                      'İnceleniyor' => 'adm-pill-review',
                      'Teklif Hazırlandı' => 'adm-pill-ready',
                      'Tamamlandı' => 'adm-pill-done',
                      default => 'adm-pill-cancelled'
                    };
                  ?>
                  <span class="adm-pill <?= $pClass ?>"><?= esc($q['status']) ?></span>
                </td>
                <td style="font-size: 11px; color: var(--adm-text-dim); white-space: nowrap;">
                  <?= date('d.m.Y H:i', strtotime($q['created_at'])) ?>
                </td>
              </tr>
            <?php endforeach; ?>
          <?php endif; ?>
        </tbody>
      </table>
    </div>
  </div>

  <!-- SON İLETİŞİM MESAJLARI -->
  <div class="adm-card">
    <div class="adm-card-header">
      <div class="adm-card-title">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
        Son İletişim Mesajları
      </div>
      <a href="/admin/messages.php" class="adm-btn adm-btn-secondary adm-btn-sm">Tümünü Gör (<?= $totalMessages ?>)</a>
    </div>

    <div class="adm-table-wrap">
      <table class="adm-table">
        <thead>
          <tr>
            <th>Gönderen</th>
            <th>Konu</th>
            <th>Durum</th>
            <th>Tarih</th>
          </tr>
        </thead>
        <tbody>
          <?php if (empty($recentMessages)): ?>
            <tr><td colspan="4" style="text-align: center; color: var(--adm-text-dim); padding: 24px;">Henüz mesaj bulunmuyor.</td></tr>
          <?php else: ?>
            <?php foreach ($recentMessages as $m): ?>
              <tr>
                <td>
                  <strong><?= esc($m['name']) ?></strong>
                  <div style="font-size: 11px; color: var(--adm-text-dim);"><?= esc($m['phone'] ?: $m['email']) ?></div>
                </td>
                <td style="max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                  <?= esc($m['subject']) ?>
                </td>
                <td>
                  <?php if ($m['status'] === 'new'): ?>
                    <span class="adm-pill adm-pill-new">Yeni</span>
                  <?php elseif ($m['status'] === 'read'): ?>
                    <span class="adm-pill adm-pill-ready">Okundu</span>
                  <?php else: ?>
                    <span class="adm-pill adm-pill-done">Yanıtlandı</span>
                  <?php endif; ?>
                </td>
                <td style="font-size: 11px; color: var(--adm-text-dim); white-space: nowrap;">
                  <?= date('d.m.Y H:i', strtotime($m['received_at'])) ?>
                </td>
              </tr>
            <?php endforeach; ?>
          <?php endif; ?>
        </tbody>
      </table>
    </div>
  </div>
</div>

<!-- SİSTEM BİLGİ KARTI -->
<div class="adm-card" style="margin-top: 8px;">
  <div class="adm-card-header">
    <div class="adm-card-title">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
      Sistem ve Sunucu Durumu (TürkTicaret cPanel)
    </div>
    <span class="adm-pill adm-pill-done">Aktif & Çalışır Durumda</span>
  </div>

  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; font-size: 13px;">
    <div>
      <span style="color: var(--adm-text-dim);">PHP Sürümü:</span>
      <div style="font-weight: 600; color: #fff;"><?= phpversion() ?></div>
    </div>
    <div>
      <span style="color: var(--adm-text-dim);">Veritabanı Sürücüsü:</span>
      <div style="font-weight: 600; color: #fff;"><?= strtoupper(DB_DRIVER) ?> (PDO)</div>
    </div>
    <div>
      <span style="color: var(--adm-text-dim);">Teklif Deposu:</span>
      <div style="font-weight: 600; color: <?= is_writable(STORAGE_DIR) ? '#34d399' : '#f87171' ?>;">
        <?= is_writable(STORAGE_DIR) ? 'Yazılabilir (Güvenli)' : 'Yazma İzni Yok!' ?>
      </div>
    </div>
    <div>
      <span style="color: var(--adm-text-dim);">Maksimum Dosya Yükleme:</span>
      <div style="font-weight: 600; color: #fff;"><?= ini_get('upload_max_filesize') ?></div>
    </div>
  </div>
</div>

<?php require_once __DIR__ . '/footer.php'; ?>
