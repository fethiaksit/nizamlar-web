<?php
/**
 * NİZAMLAR BASKI — BASKILI ÜRÜNLER YÖNETİMİ
 */

$pageTitle = 'Baskılı Ürünler';
require_once __DIR__ . '/header.php';

$success = null;
$error = null;

$action = $_GET['action'] ?? 'list';
$editId = (int)($_GET['id'] ?? 0);
$editItem = null;

if ($editId > 0) {
    $editItem = DB::fetch("SELECT * FROM `products` WHERE `id` = :id LIMIT 1", [':id' => $editId]);
}

$categories = ['Tişört', 'Sweatshirt', 'Hoodie', 'Kazak', 'Pantolon', 'Eşofman', 'Şort', 'Forma', 'Diğer tekstil ürünleri'];

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    if (!verify_csrf_token($_POST['csrf_token'] ?? '')) {
        $error = 'Güvenlik doğrulaması geçersiz.';
    } elseif ($_POST['action'] === 'save') {
        $id = (int)($_POST['id'] ?? 0);
        $name = clean_input($_POST['name'] ?? '', 255);
        $category = clean_input($_POST['category'] ?? 'Tişört', 100);
        $description = clean_input($_POST['description'] ?? '', 3000);
        $coverImage = clean_input($_POST['cover_image'] ?? '', 255);
        $backImage = clean_input($_POST['back_image'] ?? '', 255);
        $printTechnique = clean_input($_POST['print_technique'] ?? '', 150);
        $patternType = clean_input($_POST['pattern_type'] ?? '', 150);
        $fabricDetails = clean_input($_POST['fabric_details'] ?? '', 150);
        $videoUrl = clean_input($_POST['video_url'] ?? '', 255);
        $featured = isset($_POST['featured']) ? 1 : 0;
        $sort = (int)($_POST['sort'] ?? 0);
        $status = clean_input($_POST['status'] ?? 'published', 20);

        if (empty($name)) {
            $error = 'Ürün adı zorunludur.';
        } else {
            try {
                if ($id > 0) {
                    DB::execute("
                        UPDATE `products` SET
                            `name` = :name,
                            `category` = :cat,
                            `description` = :desc,
                            `cover_image` = :cover,
                            `back_image` = :back,
                            `print_technique` = :tech,
                            `pattern_type` = :pattern,
                            `fabric_details` = :fabric,
                            `video_url` = :video,
                            `featured` = :featured,
                            `sort` = :sort,
                            `status` = :status,
                            `updated_at` = NOW()
                        WHERE `id` = :id
                    ", [
                        ':name'     => $name,
                        ':cat'      => $category,
                        ':desc'     => $description,
                        ':cover'    => $coverImage,
                        ':back'     => $backImage,
                        ':tech'     => $printTechnique,
                        ':pattern'  => $patternType,
                        ':fabric'   => $fabricDetails,
                        ':video'    => $videoUrl,
                        ':featured' => $featured,
                        ':sort'     => $sort,
                        ':status'   => $status,
                        ':id'       => $id
                    ]);
                    $success = "Ürün (#{$id}) güncellendi.";
                } else {
                    DB::execute("
                        INSERT INTO `products` (
                            `name`, `category`, `description`, `cover_image`, `back_image`,
                            `print_technique`, `pattern_type`, `fabric_details`, `video_url`,
                            `featured`, `sort`, `status`, `updated_at`
                        ) VALUES (
                            :name, :cat, :desc, :cover, :back,
                            :tech, :pattern, :fabric, :video,
                            :featured, :sort, :status, NOW()
                        )
                    ", [
                        ':name'     => $name,
                        ':cat'      => $category,
                        ':desc'     => $description,
                        ':cover'    => $coverImage,
                        ':back'     => $backImage,
                        ':tech'     => $printTechnique,
                        ':pattern'  => $patternType,
                        ':fabric'   => $fabricDetails,
                        ':video'    => $videoUrl,
                        ':featured' => $featured,
                        ':sort'     => $sort,
                        ':status'   => $status
                    ]);
                    $success = "Yeni ürün eklendi.";
                }
                $action = 'list';
            } catch (Exception $e) {
                $error = "Veritabanı hatası: " . $e->getMessage();
            }
        }
    } elseif ($_POST['action'] === 'delete') {
        $delId = (int)$_POST['id'];
        DB::execute("DELETE FROM `products` WHERE `id` = :id", [':id' => $delId]);
        $success = "Ürün silindi.";
    }
}

$products = DB::fetchAll("SELECT * FROM `products` ORDER BY `sort` ASC, `id` ASC");
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
      'id' => 0, 'name' => '', 'category' => 'Tişört', 'description' => '',
      'cover_image' => '', 'back_image' => '', 'print_technique' => '',
      'pattern_type' => '', 'fabric_details' => '', 'video_url' => '',
      'featured' => 0, 'sort' => 0, 'status' => 'published'
    ];
  ?>
  <div class="adm-card">
    <div class="adm-card-header">
      <div class="adm-card-title"><?= $item['id'] ? 'Ürünü Düzenle: ' . esc($item['name']) : 'Yeni Ürün Ekle' ?></div>
      <a href="/admin/products.php" class="adm-btn adm-btn-secondary adm-btn-sm">← Listeye Dön</a>
    </div>

    <form method="POST" action="">
      <input type="hidden" name="csrf_token" value="<?= csrf_token() ?>">
      <input type="hidden" name="action" value="save">
      <input type="hidden" name="id" value="<?= $item['id'] ?>">

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;">
        <div>
          <div class="adm-form-group">
            <label class="adm-label" for="name">Ürün Adı *</label>
            <input type="text" id="name" name="name" class="adm-input" placeholder="Örn: Oversize Streetwear Grafik Tişört" required value="<?= esc($item['name']) ?>">
          </div>

          <div class="adm-form-group">
            <label class="adm-label" for="category">Kategori</label>
            <select name="category" id="category" class="adm-select">
              <?php foreach ($categories as $cat): ?>
                <option value="<?= esc($cat) ?>" <?= $item['category'] === $cat ? 'selected' : '' ?>><?= esc($cat) ?></option>
              <?php endforeach; ?>
            </select>
          </div>

          <div class="adm-form-group">
            <label class="adm-label" for="description">Açıklama</label>
            <textarea id="description" name="description" class="adm-textarea"><?= esc($item['description']) ?></textarea>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div class="adm-form-group">
              <label class="adm-label" for="print_technique">Baskı Tekniği</label>
              <input type="text" id="print_technique" name="print_technique" class="adm-input" placeholder="DTF Transfer Baskı" value="<?= esc($item['print_technique']) ?>">
            </div>
            <div class="adm-form-group">
              <label class="adm-label" for="pattern_type">Desen Türü</label>
              <input type="text" id="pattern_type" name="pattern_type" class="adm-input" placeholder="Vektörel & Tipografik" value="<?= esc($item['pattern_type']) ?>">
            </div>
          </div>

          <div class="adm-form-group">
            <label class="adm-label" for="fabric_details">Kumaş Detayları</label>
            <input type="text" id="fabric_details" name="fabric_details" class="adm-input" placeholder="%100 Kompakt Penye Pamuk (240 GSM)" value="<?= esc($item['fabric_details']) ?>">
          </div>
        </div>

        <div>
          <div class="adm-form-group">
            <label class="adm-label" for="cover_image">Ön Yüz Görseli Yolu</label>
            <input type="text" id="cover_image" name="cover_image" class="adm-input" placeholder="assets/images/products/... veya /uploads/..." value="<?= esc($item['cover_image']) ?>">
          </div>

          <div class="adm-form-group">
            <label class="adm-label" for="back_image">Arka Yüz Görseli Yolu (Opsiyonel)</label>
            <input type="text" id="back_image" name="back_image" class="adm-input" placeholder="assets/images/products/..." value="<?= esc($item['back_image']) ?>">
          </div>

          <div class="adm-form-group">
            <label class="adm-label" for="video_url">Video Bağlantısı (Opsiyonel)</label>
            <input type="text" id="video_url" name="video_url" class="adm-input" value="<?= esc($item['video_url']) ?>">
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

          <div class="adm-form-group" style="margin-top: 10px;">
            <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; color: #fff;">
              <input type="checkbox" name="featured" value="1" <?= !empty($item['featured']) ? 'checked' : '' ?> style="width: 18px; height: 18px; accent-color: var(--adm-gold);">
              <span><strong>Öne Çıkarılan Ürün</strong> (Ana sayfa vitrin slider'ında listelenir)</span>
            </label>
          </div>
        </div>
      </div>

      <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--adm-border); display: flex; gap: 12px; justify-content: flex-end;">
        <a href="/admin/products.php" class="adm-btn adm-btn-secondary">İptal</a>
        <button type="submit" class="adm-btn adm-btn-gold">Ürünü Kaydet</button>
      </div>
    </form>
  </div>
<?php else: ?>
  <!-- LİSTE -->
  <div class="adm-card">
    <div class="adm-card-header">
      <div class="adm-card-title">Katalog Ürünleri (Toplam: <?= count($products) ?>)</div>
      <a href="/admin/products.php?action=new" class="adm-btn adm-btn-gold adm-btn-sm">+ Yeni Ürün Ekle</a>
    </div>

    <div class="adm-table-wrap">
      <table class="adm-table">
        <thead>
          <tr>
            <th>Görsel</th>
            <th>Ürün Adı</th>
            <th>Kategori</th>
            <th>Baskı & Kumaş</th>
            <th>Öne Çıkan</th>
            <th>Durum</th>
            <th style="text-align: right;">İşlemler</th>
          </tr>
        </thead>
        <tbody>
          <?php if (empty($products)): ?>
            <tr><td colspan="7" style="text-align: center; padding: 24px; color: var(--adm-text-dim);">Henüz ürün eklenmemiş.</td></tr>
          <?php else: ?>
            <?php foreach ($products as $p): ?>
              <tr>
                <td style="width: 50px;">
                  <?php if (!empty($p['cover_image'])): ?>
                    <img src="/<?= ltrim($p['cover_image'], '/') ?>" alt="" style="width: 44px; height: 44px; object-fit: contain; background: #0c0d0e; border-radius: 4px; border: 1px solid var(--adm-border);">
                  <?php else: ?>
                    <div style="width: 44px; height: 44px; background: #0c0d0e; border-radius: 4px;"></div>
                  <?php endif; ?>
                </td>
                <td>
                  <strong><?= esc($p['name']) ?></strong>
                  <div style="font-size: 11px; color: var(--adm-text-dim);">Sıra: <?= $p['sort'] ?></div>
                </td>
                <td>
                  <span class="adm-badge adm-badge-gold"><?= esc($p['category']) ?></span>
                </td>
                <td>
                  <div style="font-size: 12px;"><?= esc($p['print_technique']) ?></div>
                  <div style="font-size: 11px; color: var(--adm-text-dim);"><?= esc($p['fabric_details']) ?></div>
                </td>
                <td>
                  <?= !empty($p['featured']) ? '<span style="color: var(--adm-gold); font-size: 16px;" title="Öne Çıkarıldı">★</span>' : '<span style="color: var(--adm-text-dim);">☆</span>' ?>
                </td>
                <td>
                  <span class="adm-pill <?= $p['status'] === 'published' ? 'adm-pill-published' : 'adm-pill-draft' ?>">
                    <?= $p['status'] === 'published' ? 'Yayında' : 'Taslak' ?>
                  </span>
                </td>
                <td style="text-align: right; white-space: nowrap;">
                  <a href="/admin/products.php?action=edit&id=<?= $p['id'] ?>" class="adm-btn adm-btn-gold adm-btn-sm">Düzenle</a>
                  <form method="POST" action="" style="display: inline-block;" onsubmit="return confirm('Bu ürünü silmek istediğinize emin misiniz?');">
                    <input type="hidden" name="csrf_token" value="<?= csrf_token() ?>">
                    <input type="hidden" name="action" value="delete">
                    <input type="hidden" name="id" value="<?= $p['id'] ?>">
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
