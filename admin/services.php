<?php
/**
 * NİZAMLAR BASKI — HİZMETLER YÖNETİMİ
 */

$pageTitle = 'Hizmetlerimiz';
require_once __DIR__ . '/header.php';

$success = null;
$error = null;

$action = $_GET['action'] ?? 'list';
$editId = (int)($_GET['id'] ?? 0);
$editItem = null;

if ($editId > 0) {
    $editItem = DB::fetch("SELECT * FROM `services` WHERE `id` = :id LIMIT 1", [':id' => $editId]);
}

// POST İşlemleri (Ekleme, Güncelleme, Silme)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    if (!verify_csrf_token($_POST['csrf_token'] ?? '')) {
        $error = 'Güvenlik doğrulaması geçersiz.';
    } elseif ($_POST['action'] === 'save') {
        $id = (int)($_POST['id'] ?? 0);
        $title = clean_input($_POST['title'] ?? '', 255);
        $slug = slugify($_POST['slug'] ?? $title);
        $badge = clean_input($_POST['badge'] ?? '', 100);
        $capacity = clean_input($_POST['capacity_info'] ?? '', 150);
        $shortDesc = clean_input($_POST['short_desc'] ?? '', 2000);
        $content = $_POST['content'] ?? ''; // HTML içerik
        $coverImage = clean_input($_POST['cover_image'] ?? '', 255);
        $sort = (int)($_POST['sort'] ?? 0);
        $status = clean_input($_POST['status'] ?? 'published', 20);

        // Özellikleri satır satır JSON dizisine dönüştür
        $featuresRaw = explode("\n", (string)($_POST['features'] ?? ''));
        $features = array_values(array_filter(array_map('trim', $featuresRaw)));
        $featuresJson = json_encode($features, JSON_UNESCAPED_UNICODE);

        if (empty($title)) {
            $error = 'Hizmet adı zorunludur.';
        } elseif (empty($slug)) {
            $error = 'Geçerli bir slug üretilemedi.';
        } else {
            try {
                if ($id > 0) {
                    // Mevcut kaydın eski slug'ını kontrol et
                    $old = DB::fetch("SELECT `slug`, `old_slugs` FROM `services` WHERE `id` = :id", [':id' => $id]);
                    $oldSlugs = json_decode((string)($old['old_slugs'] ?? '[]'), true) ?: [];
                    if ($old && $old['slug'] !== $slug && !in_array($old['slug'], $oldSlugs, true)) {
                        $oldSlugs[] = $old['slug'];
                    }

                    DB::execute("
                        UPDATE `services` SET
                            `title` = :title,
                            `slug` = :slug,
                            `badge` = :badge,
                            `capacity_info` = :capacity,
                            `short_desc` = :short_desc,
                            `content` = :content,
                            `cover_image` = :cover_image,
                            `features` = :features,
                            `old_slugs` = :old_slugs,
                            `sort` = :sort,
                            `status` = :status,
                            `updated_at` = NOW()
                        WHERE `id` = :id
                    ", [
                        ':title'       => $title,
                        ':slug'        => $slug,
                        ':badge'       => $badge,
                        ':capacity'    => $capacity,
                        ':short_desc'  => $shortDesc,
                        ':content'     => $content,
                        ':cover_image' => $coverImage,
                        ':features'    => $featuresJson,
                        ':old_slugs'   => json_encode($oldSlugs, JSON_UNESCAPED_UNICODE),
                        ':sort'        => $sort,
                        ':status'      => $status,
                        ':id'          => $id
                    ]);
                    $success = "Hizmet (#{$id}) başarıyla güncellendi.";
                } else {
                    DB::execute("
                        INSERT INTO `services` (
                            `title`, `slug`, `badge`, `capacity_info`, `short_desc`,
                            `content`, `cover_image`, `features`, `sort`, `status`, `updated_at`
                        ) VALUES (
                            :title, :slug, :badge, :capacity, :short_desc,
                            :content, :cover_image, :features, :sort, :status, NOW()
                        )
                    ", [
                        ':title'       => $title,
                        ':slug'        => $slug,
                        ':badge'       => $badge,
                        ':capacity'    => $capacity,
                        ':short_desc'  => $shortDesc,
                        ':content'     => $content,
                        ':cover_image' => $coverImage,
                        ':features'    => $featuresJson,
                        ':sort'        => $sort,
                        ':status'      => $status
                    ]);
                    $success = "Yeni hizmet eklendi.";
                }
                $action = 'list';
            } catch (Exception $e) {
                $error = "Veritabanı hatası: " . $e->getMessage();
            }
        }
    } elseif ($_POST['action'] === 'delete') {
        $delId = (int)$_POST['id'];
        DB::execute("DELETE FROM `services` WHERE `id` = :id", [':id' => $delId]);
        $success = "Hizmet silindi.";
    }
}

$services = DB::fetchAll("SELECT * FROM `services` ORDER BY `sort` ASC, `id` ASC");
?>

<?php if ($success): ?>
  <div class="adm-alert adm-alert-success"><?= esc($success) ?></div>
<?php endif; ?>
<?php if ($error): ?>
  <div class="adm-alert adm-alert-danger"><?= esc($error) ?></div>
<?php endif; ?>

<?php if ($action === 'new' || $action === 'edit'): ?>
  <?php
    $item = $editItem ?? [
      'id' => 0, 'title' => '', 'slug' => '', 'badge' => '',
      'capacity_info' => '', 'short_desc' => '', 'content' => '',
      'cover_image' => '', 'features' => '[]', 'sort' => 0, 'status' => 'published'
    ];
    $featuresArr = json_decode((string)$item['features'], true) ?: [];
    $featuresText = implode("\n", $featuresArr);
  ?>
  <div class="adm-card">
    <div class="adm-card-header">
      <div class="adm-card-title"><?= $item['id'] ? 'Hizmeti Düzenle: ' . esc($item['title']) : 'Yeni Hizmet Ekle' ?></div>
      <a href="/admin/services.php" class="adm-btn adm-btn-secondary adm-btn-sm">← Listeye Dön</a>
    </div>

    <form method="POST" action="">
      <input type="hidden" name="csrf_token" value="<?= csrf_token() ?>">
      <input type="hidden" name="action" value="save">
      <input type="hidden" name="id" value="<?= $item['id'] ?>">

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;">
        <div>
          <div class="adm-form-group">
            <label class="adm-label" for="title">Hizmet Adı *</label>
            <input type="text" id="title" name="title" class="adm-input" placeholder="Örn: DTF Transfer Baskı" required value="<?= esc($item['title']) ?>">
          </div>

          <div class="adm-form-group">
            <label class="adm-label" for="slug">Sayfa URL / Slug <small>(Boş bırakılırsa otomatik üretilir)</small></label>
            <input type="text" id="slug" name="slug" class="adm-input" placeholder="dtf-baski" value="<?= esc($item['slug']) ?>">
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div class="adm-form-group">
              <label class="adm-label" for="badge">Rozet / Etiket</label>
              <input type="text" id="badge" name="badge" class="adm-input" placeholder="Örn: Popüler & Esnek" value="<?= esc($item['badge']) ?>">
            </div>
            <div class="adm-form-group">
              <label class="adm-label" for="capacity_info">Kapasite Bilgisi</label>
              <input type="text" id="capacity_info" name="capacity_info" class="adm-input" placeholder="Örn: Günlük 15.000+ Metre" value="<?= esc($item['capacity_info']) ?>">
            </div>
          </div>

          <div class="adm-form-group">
            <label class="adm-label" for="short_desc">Kısa Açıklama (Kart Metni)</label>
            <textarea id="short_desc" name="short_desc" class="adm-textarea" style="min-height: 80px;"><?= esc($item['short_desc']) ?></textarea>
          </div>

          <div class="adm-form-group">
            <label class="adm-label" for="features">Öne Çıkan Özellikler <small>(Her satıra bir özellik yazınız)</small></label>
            <textarea id="features" name="features" class="adm-textarea" style="min-height: 110px;" placeholder="1440 DPI Ultra Yüksek Çözünürlük&#10;Her Kumaş Türüyle %100 Uyumlu&#10;60°C Yıkama Dayanımı"><?= esc($featuresText) ?></textarea>
          </div>
        </div>

        <div>
          <div class="adm-form-group">
            <label class="adm-label" for="cover_image">Kapak Görseli Yolu</label>
            <input type="text" id="cover_image" name="cover_image" class="adm-input" placeholder="assets/images/machines/... veya /uploads/..." value="<?= esc($item['cover_image']) ?>">
          </div>

          <div class="adm-form-group">
            <label class="adm-label" for="content">Detaylı Hizmet İçeriği (HTML)</label>
            <textarea id="content" name="content" class="adm-textarea" style="min-height: 160px;" placeholder="<p>Hizmetin teknik detayları...</p>"><?= esc($item['content']) ?></textarea>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div class="adm-form-group">
              <label class="adm-label" for="sort">Sıralama</label>
              <input type="number" id="sort" name="sort" class="adm-input" value="<?= (int)$item['sort'] ?>">
            </div>
            <div class="adm-form-group">
              <label class="adm-label" for="status">Yayın Durumu</label>
              <select name="status" id="status" class="adm-select">
                <option value="published" <?= $item['status'] === 'published' ? 'selected' : '' ?>>Yayında</option>
                <option value="draft" <?= $item['status'] === 'draft' ? 'selected' : '' ?>>Taslak</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--adm-border); display: flex; gap: 12px; justify-content: flex-end;">
        <a href="/admin/services.php" class="adm-btn adm-btn-secondary">İptal</a>
        <button type="submit" class="adm-btn adm-btn-gold">Hizmeti Kaydet</button>
      </div>
    </form>
  </div>
<?php else: ?>
  <!-- LİSTE -->
  <div class="adm-card">
    <div class="adm-card-header">
      <div class="adm-card-title">Hizmetlerimiz Listesi (Toplam: <?= count($services) ?>)</div>
      <a href="/admin/services.php?action=new" class="adm-btn adm-btn-gold adm-btn-sm">+ Yeni Hizmet Ekle</a>
    </div>

    <div class="adm-table-wrap">
      <table class="adm-table">
        <thead>
          <tr>
            <th>Sıra</th>
            <th>Hizmet Adı</th>
            <th>Slug / URL</th>
            <th>Etiket / Kapasite</th>
            <th>Durum</th>
            <th style="text-align: right;">İşlemler</th>
          </tr>
        </thead>
        <tbody>
          <?php if (empty($services)): ?>
            <tr><td colspan="6" style="text-align: center; padding: 24px; color: var(--adm-text-dim);">Henüz hizmet eklenmemiş.</td></tr>
          <?php else: ?>
            <?php foreach ($services as $s): ?>
              <tr>
                <td><?= $s['sort'] ?></td>
                <td>
                  <strong><?= esc($s['title']) ?></strong>
                </td>
                <td>
                  <code style="font-family: var(--adm-font-mono); color: var(--adm-gold); font-size: 12px;">/hizmetlerimiz/<?= esc($s['slug']) ?>/</code>
                </td>
                <td>
                  <?php if (!empty($s['badge'])): ?>
                    <span class="adm-badge adm-badge-gold"><?= esc($s['badge']) ?></span>
                  <?php endif; ?>
                  <div style="font-size: 11px; color: var(--adm-text-dim); margin-top: 2px;"><?= esc($s['capacity_info']) ?></div>
                </td>
                <td>
                  <span class="adm-pill <?= $s['status'] === 'published' ? 'adm-pill-published' : 'adm-pill-draft' ?>">
                    <?= $s['status'] === 'published' ? 'Yayında' : 'Taslak' ?>
                  </span>
                </td>
                <td style="text-align: right; white-space: nowrap;">
                  <a href="/hizmetlerimiz/<?= esc($s['slug']) ?>/" target="_blank" rel="noopener" class="adm-btn adm-btn-secondary adm-btn-sm" title="Sitede Gör">↗</a>
                  <a href="/admin/services.php?action=edit&id=<?= $s['id'] ?>" class="adm-btn adm-btn-gold adm-btn-sm">Düzenle</a>
                  <form method="POST" action="" style="display: inline-block;" onsubmit="return confirm('Bu hizmeti silmek istediğinize emin misiniz?');">
                    <input type="hidden" name="csrf_token" value="<?= csrf_token() ?>">
                    <input type="hidden" name="action" value="delete">
                    <input type="hidden" name="id" value="<?= $s['id'] ?>">
                    <button type="submit" class="adm-btn adm-btn-danger adm-btn-sm">Sil</button>
                  </form>
                </td>
              </tr>
            <?php endforeach; ?>
          <?php endif; ?>
        </tbody>
      </table>
    </div>
  </div>
<?php endif; ?>

<?php require_once __DIR__ . '/footer.php'; ?>
