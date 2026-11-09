<?php
/**
 * NİZAMLAR BASKI — SAYFA VE HERO YÖNETİMİ
 */

$pageTitle = 'Sayfalar & Hero';
require_once __DIR__ . '/header.php';

$success = null;
$error = null;

// Sayfa Düzenleme İşlemi
$editSlug = clean_input($_GET['edit'] ?? '', 100);
$editPage = null;

if (!empty($editSlug)) {
    $editPage = DB::fetch("SELECT * FROM `pages` WHERE `slug` = :slug LIMIT 1", [':slug' => $editSlug]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    if (!verify_csrf_token($_POST['csrf_token'] ?? '')) {
        $error = 'Güvenlik doğrulaması geçersiz.';
    } elseif ($_POST['action'] === 'save_page') {
        $slug = clean_input($_POST['slug'] ?? '', 100);
        $title = clean_input($_POST['title'] ?? '', 255);
        $subtitle = clean_input($_POST['subtitle'] ?? '', 2000);
        $heroTitle = clean_input($_POST['hero_title'] ?? '', 2000);
        $heroSubtitle = clean_input($_POST['hero_subtitle'] ?? '', 2000);
        $heroImage = clean_input($_POST['hero_image'] ?? '', 255);
        $heroVideo = clean_input($_POST['hero_video'] ?? '', 255);
        $heroBtnText = clean_input($_POST['hero_btn_text'] ?? '', 100);
        $heroBtnLink = clean_input($_POST['hero_btn_link'] ?? '', 255);
        $seoTitle = clean_input($_POST['seo_title'] ?? '', 255);
        $seoDesc = clean_input($_POST['seo_description'] ?? '', 2000);
        $seoKeywords = clean_input($_POST['seo_keywords'] ?? '', 255);
        $status = clean_input($_POST['status'] ?? 'published', 20);

        try {
            DB::execute("
                UPDATE `pages` SET
                    `title` = :title,
                    `subtitle` = :subtitle,
                    `hero_title` = :ht,
                    `hero_subtitle` = :hs,
                    `hero_image` = :hi,
                    `hero_video` = :hv,
                    `hero_btn_text` = :hbt,
                    `hero_btn_link` = :hbl,
                    `seo_title` = :st,
                    `seo_description` = :sd,
                    `seo_keywords` = :sk,
                    `status` = :status,
                    `updated_at` = NOW()
                WHERE `slug` = :slug
            ", [
                ':title'    => $title,
                ':subtitle' => $subtitle,
                ':ht'       => $heroTitle,
                ':hs'       => $heroSubtitle,
                ':hi'       => $heroImage,
                ':hv'       => $heroVideo,
                ':hbt'      => $heroBtnText,
                ':hbl'      => $heroBtnLink,
                ':st'       => $seoTitle,
                ':sd'       => $seoDesc,
                ':sk'       => $seoKeywords,
                ':status'   => $status,
                ':slug'     => $slug
            ]);

            $success = "{$slug} sayfası başarıyla güncellendi.";
            $editPage = DB::fetch("SELECT * FROM `pages` WHERE `slug` = :slug LIMIT 1", [':slug' => $slug]);
        } catch (Exception $e) {
            $error = "Güncelleme hatası: " . $e->getMessage();
        }
    }
}

$pages = DB::fetchAll("SELECT * FROM `pages` ORDER BY `id` ASC");
?>

<?php if ($success): ?>
  <div class="adm-alert adm-alert-success"><?= esc($success) ?></div>
<?php endif; ?>
<?php if ($error): ?>
  <div class="adm-alert adm-alert-danger"><?= esc($error) ?></div>
<?php endif; ?>

<?php if ($editPage): ?>
  <!-- DÜZENLEME FORMU -->
  <div class="adm-card" style="margin-bottom: 24px;">
    <div class="adm-card-header">
      <div class="adm-card-title">Sayfayı Düzenle: <?= esc($editPage['page_name']) ?> (/<?= esc($editPage['slug']) ?>/)</div>
      <a href="/admin/pages.php" class="adm-btn adm-btn-secondary adm-btn-sm">← Sayfa Listesine Dön</a>
    </div>

    <form method="POST" action="">
      <input type="hidden" name="csrf_token" value="<?= csrf_token() ?>">
      <input type="hidden" name="action" value="save_page">
      <input type="hidden" name="slug" value="<?= esc($editPage['slug']) ?>">

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;">
        <!-- Sol Kolon: Hero ve Başlıklar -->
        <div>
          <h3 style="font-size: 14px; font-weight: 700; color: var(--adm-gold); margin-bottom: 14px;">Hero & Başlık Alanı</h3>

          <div class="adm-form-group">
            <label class="adm-label" for="hero_title">Hero Başlığı <small>(Vurgu için *italik* yapabilirsiniz)</small></label>
            <textarea id="hero_title" name="hero_title" class="adm-textarea" style="min-height: 80px;" required><?= esc($editPage['hero_title']) ?></textarea>
          </div>

          <div class="adm-form-group">
            <label class="adm-label" for="hero_subtitle">Hero Alt Metni</label>
            <textarea id="hero_subtitle" name="hero_subtitle" class="adm-textarea"><?= esc($editPage['hero_subtitle']) ?></textarea>
          </div>

          <div class="adm-form-group">
            <label class="adm-label" for="title">Sayfa Üst Başlığı (Alternatif)</label>
            <input type="text" id="title" name="title" class="adm-input" value="<?= esc($editPage['title']) ?>">
          </div>

          <div class="adm-form-group">
            <label class="adm-label" for="subtitle">Sayfa Üst Açıklaması</label>
            <textarea id="subtitle" name="subtitle" class="adm-textarea" style="min-height: 70px;"><?= esc($editPage['subtitle']) ?></textarea>
          </div>
        </div>

        <!-- Sağ Kolon: Görsel, Buton ve SEO -->
        <div>
          <h3 style="font-size: 14px; font-weight: 700; color: var(--adm-gold); margin-bottom: 14px;">Görsel, Buton ve SEO</h3>

          <div class="adm-form-group">
            <label class="adm-label" for="hero_image">Hero Görseli Yolu <small>(örn: assets/images/...)</small></label>
            <input type="text" id="hero_image" name="hero_image" class="adm-input" value="<?= esc($editPage['hero_image']) ?>">
          </div>

          <div class="adm-form-group">
            <label class="adm-label" for="hero_video">Hero Videosu (Opsiyonel)</label>
            <input type="text" id="hero_video" name="hero_video" class="adm-input" value="<?= esc($editPage['hero_video']) ?>">
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div class="adm-form-group">
              <label class="adm-label" for="hero_btn_text">Buton Yazısı</label>
              <input type="text" id="hero_btn_text" name="hero_btn_text" class="adm-input" value="<?= esc($editPage['hero_btn_text']) ?>">
            </div>
            <div class="adm-form-group">
              <label class="adm-label" for="hero_btn_link">Buton Linki</label>
              <input type="text" id="hero_btn_link" name="hero_btn_link" class="adm-input" value="<?= esc($editPage['hero_btn_link']) ?>">
            </div>
          </div>

          <div class="adm-form-group">
            <label class="adm-label" for="seo_title">SEO Sayfa Başlığı (Meta Title)</label>
            <input type="text" id="seo_title" name="seo_title" class="adm-input" value="<?= esc($editPage['seo_title']) ?>">
          </div>

          <div class="adm-form-group">
            <label class="adm-label" for="seo_description">SEO Açıklaması (Meta Description)</label>
            <textarea id="seo_description" name="seo_description" class="adm-textarea" style="min-height: 70px;"><?= esc($editPage['seo_description']) ?></textarea>
          </div>

          <div class="adm-form-group">
            <label class="adm-label" for="status">Yayın Durumu</label>
            <select name="status" id="status" class="adm-select">
              <option value="published" <?= $editPage['status'] === 'published' ? 'selected' : '' ?>>Yayında</option>
              <option value="draft" <?= $editPage['status'] === 'draft' ? 'selected' : '' ?>>Taslak</option>
            </select>
          </div>
        </div>
      </div>

      <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--adm-border); display: flex; gap: 12px; justify-content: flex-end;">
        <a href="/admin/pages.php" class="adm-btn adm-btn-secondary">İptal</a>
        <button type="submit" class="adm-btn adm-btn-gold">Değişiklikleri Kaydet</button>
      </div>
    </form>
  </div>
<?php endif; ?>

<!-- SAYFA LİSTESİ -->
<div class="adm-card">
  <div class="adm-card-header">
    <div class="adm-card-title">Mevcut Sayfalar (Toplam: <?= count($pages) ?>)</div>
  </div>

  <div class="adm-table-wrap">
    <table class="adm-table">
      <thead>
        <tr>
          <th>Sayfa Adı</th>
          <th>URL / Slug</th>
          <th>Hero Başlığı</th>
          <th>SEO Başlığı</th>
          <th>Durum</th>
          <th style="text-align: right;">İşlem</th>
        </tr>
      </thead>
      <tbody>
        <?php foreach ($pages as $p): ?>
          <tr>
            <td>
              <strong><?= esc($p['page_name']) ?></strong>
            </td>
            <td>
              <code style="font-family: var(--adm-font-mono); color: var(--adm-gold); font-size: 12px;">/<?= esc($p['slug'] === 'home' ? '' : $p['slug'] . '/') ?></code>
            </td>
            <td style="max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              <?= esc($p['hero_title']) ?>
            </td>
            <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--adm-text-muted);">
              <?= esc($p['seo_title']) ?>
            </td>
            <td>
              <span class="adm-pill <?= $p['status'] === 'published' ? 'adm-pill-published' : 'adm-pill-draft' ?>">
                <?= $p['status'] === 'published' ? 'Yayında' : 'Taslak' ?>
              </span>
            </td>
            <td style="text-align: right; white-space: nowrap;">
              <a href="/admin/pages.php?edit=<?= urlencode($p['slug']) ?>" class="adm-btn adm-btn-gold adm-btn-sm">Düzenle</a>
              <a href="/<?= $p['slug'] === 'home' ? '' : esc($p['slug']) . '/' ?>" target="_blank" rel="noopener" class="adm-btn adm-btn-secondary adm-btn-sm">Görüntüle ↗</a>
            </td>
          </tr>
        <?php endforeach; ?>
      </tbody>
    </table>
  </div>
</div>

<?php require_once __DIR__ . '/footer.php'; ?>
