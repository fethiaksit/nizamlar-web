<?php
/**
 * NİZAMLAR BASKI — MAKİNE PARKURU YÖNETİMİ
 */

$pageTitle = 'Makine Parkuru';
require_once __DIR__ . '/header.php';

$success = null;
$error = null;

$action = $_GET['action'] ?? 'list';
$editId = (int)($_GET['id'] ?? 0);
$editItem = null;

if ($editId > 0) {
    $editItem = DB::fetch("SELECT * FROM `machines` WHERE `id` = :id LIMIT 1", [':id' => $editId]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    if (!verify_csrf_token($_POST['csrf_token'] ?? '')) {
        $error = 'Güvenlik doğrulaması geçersiz.';
    } elseif ($_POST['action'] === 'save') {
        $id = (int)($_POST['id'] ?? 0);
        $name = clean_input($_POST['name'] ?? '', 255);
        $brandModel = clean_input($_POST['brand_model'] ?? '', 150);
        $category = clean_input($_POST['category'] ?? '', 100);
        $printType = clean_input($_POST['print_type'] ?? '', 150);
        $capacity = clean_input($_POST['capacity'] ?? '', 150);
        $description = clean_input($_POST['description'] ?? '', 3000);
        $image = clean_input($_POST['image'] ?? '', 255);
        $videoUrl = clean_input($_POST['video_url'] ?? '', 255);
        $isActive = isset($_POST['is_active']) ? 1 : 0;
        $sort = (int)($_POST['sort'] ?? 0);
        $status = clean_input($_POST['status'] ?? 'published', 20);

        if (empty($name)) {
            $error = 'Makine adı zorunludur.';
        } else {
            try {
                if ($id > 0) {
                    DB::execute("
                        UPDATE `machines` SET
                            `name` = :name, `brand_model` = :bm, `category` = :cat,
                            `print_type` = :pt, `capacity` = :cap, `description` = :desc,
                            `image` = :img, `video_url` = :vid, `is_active` = :act,
                            `sort` = :sort, `status` = :st, `updated_at` = NOW()
                        WHERE `id` = :id
                    ", [
                        ':name' => $name, ':bm' => $brandModel, ':cat' => $category,
                        ':pt' => $printType, ':cap' => $capacity, ':desc' => $description,
                        ':img' => $image, ':vid' => $videoUrl, ':act' => $isActive,
                        ':sort' => $sort, ':st' => $status, ':id' => $id
                    ]);
                    $success = "Makine (#{$id}) güncellendi.";
                } else {
                    DB::execute("
                        INSERT INTO `machines` (
                            `name`, `brand_model`, `category`, `print_type`, `capacity`,
                            `description`, `image`, `video_url`, `is_active`, `sort`, `status`, `updated_at`
                        ) VALUES (
                            :name, :bm, :cat, :pt, :cap,
                            :desc, :img, :vid, :act, :sort, :st, NOW()
                        )
                    ", [
                        ':name' => $name, ':bm' => $brandModel, ':cat' => $category,
                        ':pt' => $printType, ':cap' => $capacity, ':desc' => $description,
                        ':img' => $image, ':vid' => $videoUrl, ':act' => $isActive,
                        ':sort' => $sort, ':st' => $status
                    ]);
                    $success = "Yeni makine eklendi.";
                }
                $action = 'list';
            } catch (Exception $e) {
                $error = "Hata: " . $e->getMessage();
            }
        }
    } elseif ($_POST['action'] === 'delete') {
        $delId = (int)$_POST['id'];
        DB::execute("DELETE FROM `machines` WHERE `id` = :id", [':id' => $delId]);
        $success = "Makine silindi.";
    }
}

$machines = DB::fetchAll("SELECT * FROM `machines` ORDER BY `sort` ASC, `id` ASC");
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
      'id' => 0, 'name' => '', 'brand_model' => '', 'category' => '',
      'print_type' => '', 'capacity' => '', 'description' => '', 'image' => '',
      'video_url' => '', 'is_active' => 1, 'sort' => 0, 'status' => 'published'
    ];
  ?>
  <div class="adm-card">
    <div class="adm-card-header">
      <div class="adm-card-title"><?= $item['id'] ? 'Makineyi Düzenle: ' . esc($item['name']) : 'Yeni Makine Ekle' ?></div>
      <a href="/admin/machines.php" class="adm-btn adm-btn-secondary adm-btn-sm">← Listeye Dön</a>
    </div>

    <form method="POST" action="">
      <input type="hidden" name="csrf_token" value="<?= csrf_token() ?>">
      <input type="hidden" name="action" value="save">
      <input type="hidden" name="id" value="<?= $item['id'] ?>">

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;">
        <div>
          <div class="adm-form-group">
            <label class="adm-label" for="name">Makine Adı *</label>
            <input type="text" id="name" name="name" class="adm-input" required value="<?= esc($item['name']) ?>">
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div class="adm-form-group">
              <label class="adm-label" for="brand_model">Marka / Model</label>
              <input type="text" id="brand_model" name="brand_model" class="adm-input" value="<?= esc($item['brand_model']) ?>">
            </div>
            <div class="adm-form-group">
              <label class="adm-label" for="category">Kategori</label>
              <input type="text" id="category" name="category" class="adm-input" value="<?= esc($item['category']) ?>">
            </div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div class="adm-form-group">
              <label class="adm-label" for="print_type">Baskı Türü</label>
              <input type="text" id="print_type" name="print_type" class="adm-input" value="<?= esc($item['print_type']) ?>">
            </div>
            <div class="adm-form-group">
              <label class="adm-label" for="capacity">Kapasite</label>
              <input type="text" id="capacity" name="capacity" class="adm-input" value="<?= esc($item['capacity']) ?>">
            </div>
          </div>
          <div class="adm-form-group">
            <label class="adm-label" for="description">Açıklama</label>
            <textarea id="description" name="description" class="adm-textarea" style="min-height: 100px;"><?= esc($item['description']) ?></textarea>
          </div>
        </div>

        <div>
          <div class="adm-form-group">
            <label class="adm-label" for="image">Fotoğraf Yolu</label>
            <input type="text" id="image" name="image" class="adm-input" placeholder="assets/images/machines/... veya /uploads/..." value="<?= esc($item['image']) ?>">
          </div>
          <div class="adm-form-group">
            <label class="adm-label" for="video_url">Video Bağlantısı</label>
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
              <input type="checkbox" name="is_active" value="1" <?= !empty($item['is_active']) ? 'checked' : '' ?> style="width: 18px; height: 18px; accent-color: var(--adm-gold);">
              <span><strong>Parkurda Aktif Makine</strong> (Sitede listelenir)</span>
            </label>
          </div>
        </div>
      </div>

      <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--adm-border); display: flex; gap: 12px; justify-content: flex-end;">
        <a href="/admin/machines.php" class="adm-btn adm-btn-secondary">İptal</a>
        <button type="submit" class="adm-btn adm-btn-gold">Kaydet</button>
      </div>
    </form>
  </div>
<?php else: ?>
  <div class="adm-card">
    <div class="adm-card-header">
      <div class="adm-card-title">Makine Parkuru Listesi (Toplam: <?= count($machines) ?>)</div>
      <a href="/admin/machines.php?action=new" class="adm-btn adm-btn-gold adm-btn-sm">+ Yeni Makine Ekle</a>
    </div>

    <div class="adm-table-wrap">
      <table class="adm-table">
        <thead>
          <tr>
            <th>Görsel</th>
            <th>Makine Adı / Model</th>
            <th>Kategori</th>
            <th>Kapasite</th>
            <th>Durum</th>
            <th style="text-align: right;">İşlemler</th>
          </tr>
        </thead>
        <tbody>
          <?php foreach ($machines as $m): ?>
            <tr>
              <td style="width: 50px;">
                <?php if (!empty($m['image'])): ?>
                  <img src="/<?= ltrim($m['image'], '/') ?>" alt="" style="width: 44px; height: 44px; object-fit: contain; background: #0c0d0e; border-radius: 4px;">
                <?php endif; ?>
              </td>
              <td>
                <strong><?= esc($m['name']) ?></strong>
                <div style="font-size: 11px; color: var(--adm-text-dim);"><?= esc($m['brand_model']) ?></div>
              </td>
              <td><?= esc($m['category']) ?></td>
              <td style="font-size: 12px;"><?= esc($m['capacity']) ?></td>
              <td>
                <span class="adm-pill <?= $m['status'] === 'published' ? 'adm-pill-published' : 'adm-pill-draft' ?>">
                  <?= $m['status'] === 'published' ? 'Yayında' : 'Taslak' ?>
                </span>
              </td>
              <td style="text-align: right; white-space: nowrap;">
                <a href="/admin/machines.php?action=edit&id=<?= $m['id'] ?>" class="adm-btn adm-btn-gold adm-btn-sm">Düzenle</a>
                <form method="POST" action="" style="display: inline-block;" onsubmit="return confirm('Bu makineyi silmek istediğinize emin misiniz?');">
                  <input type="hidden" name="csrf_token" value="<?= csrf_token() ?>">
                  <input type="hidden" name="action" value="delete">
                  <input type="hidden" name="id" value="<?= $m['id'] ?>">
                  <button type="submit" class="adm-btn adm-btn-danger adm-btn-sm">Sil</button>
                </form>
              </td>
            </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    </div>
  </div>
<?php endif; ?>

<?php require_once __DIR__ . '/footer.php'; ?>
