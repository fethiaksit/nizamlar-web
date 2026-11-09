<?php
/**
 * NİZAMLAR BASKI — REFERANSLAR YÖNETİMİ
 */

$pageTitle = 'Referanslar';
require_once __DIR__ . '/header.php';

$success = null;
$error = null;

$action = $_GET['action'] ?? 'list';
$editId = (int)($_GET['id'] ?? 0);
$editItem = null;

if ($editId > 0) {
    $editItem = DB::fetch("SELECT * FROM `references` WHERE `id` = :id LIMIT 1", [':id' => $editId]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    if (!verify_csrf_token($_POST['csrf_token'] ?? '')) {
        $error = 'Güvenlik doğrulaması geçersiz.';
    } elseif ($_POST['action'] === 'save') {
        $id = (int)($_POST['id'] ?? 0);
        $company = clean_input($_POST['company_name'] ?? '', 255);
        $industry = clean_input($_POST['industry'] ?? '', 150);
        $logo = clean_input($_POST['logo'] ?? '', 255);
        $collab = clean_input($_POST['collaboration_type'] ?? '', 150);
        $featured = isset($_POST['featured']) ? 1 : 0;
        $sort = (int)($_POST['sort'] ?? 0);
        $status = clean_input($_POST['status'] ?? 'published', 20);

        if (empty($company)) {
            $error = 'Firma adı zorunludur.';
        } else {
            try {
                if ($id > 0) {
                    DB::execute("
                        UPDATE `references` SET
                            `company_name` = :c, `industry` = :ind, `logo` = :logo,
                            `collaboration_type` = :collab, `featured` = :feat,
                            `sort` = :sort, `status` = :st, `updated_at` = NOW()
                        WHERE `id` = :id
                    ", [
                        ':c' => $company, ':ind' => $industry, ':logo' => $logo,
                        ':collab' => $collab, ':feat' => $featured,
                        ':sort' => $sort, ':st' => $status, ':id' => $id
                    ]);
                    $success = "Referans güncellendi.";
                } else {
                    DB::execute("
                        INSERT INTO `references` (
                            `company_name`, `industry`, `logo`, `collaboration_type`,
                            `featured`, `sort`, `status`, `updated_at`
                        ) VALUES (
                            :c, :ind, :logo, :collab, :feat, :sort, :st, NOW()
                        )
                    ", [
                        ':c' => $company, ':ind' => $industry, ':logo' => $logo,
                        ':collab' => $collab, ':feat' => $featured,
                        ':sort' => $sort, ':st' => $status
                    ]);
                    $success = "Yeni referans eklendi.";
                }
                $action = 'list';
            } catch (Exception $e) {
                $error = "Hata: " . $e->getMessage();
            }
        }
    } elseif ($_POST['action'] === 'delete') {
        $delId = (int)$_POST['id'];
        DB::execute("DELETE FROM `references` WHERE `id` = :id", [':id' => $delId]);
        $success = "Referans silindi.";
    }
}

$refs = DB::fetchAll("SELECT * FROM `references` ORDER BY `sort` ASC, `id` ASC");
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
      'id' => 0, 'company_name' => '', 'industry' => '', 'logo' => '',
      'collaboration_type' => '', 'featured' => 1, 'sort' => 0, 'status' => 'published'
    ];
  ?>
  <div class="adm-card">
    <div class="adm-card-header">
      <div class="adm-card-title"><?= $item['id'] ? 'Referansı Düzenle: ' . esc($item['company_name']) : 'Yeni Referans Ekle' ?></div>
      <a href="/admin/references.php" class="adm-btn adm-btn-secondary adm-btn-sm">← Listeye Dön</a>
    </div>

    <form method="POST" action="">
      <input type="hidden" name="csrf_token" value="<?= csrf_token() ?>">
      <input type="hidden" name="action" value="save">
      <input type="hidden" name="id" value="<?= $item['id'] ?>">

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;">
        <div>
          <div class="adm-form-group">
            <label class="adm-label" for="company_name">Firma Adı *</label>
            <input type="text" id="company_name" name="company_name" class="adm-input" required value="<?= esc($item['company_name']) ?>">
          </div>
          <div class="adm-form-group">
            <label class="adm-label" for="industry">Sektör</label>
            <input type="text" id="industry" name="industry" class="adm-input" placeholder="Hazır Giyim & Moda" value="<?= esc($item['industry']) ?>">
          </div>
          <div class="adm-form-group">
            <label class="adm-label" for="collaboration_type">İş Birliği Türü</label>
            <input type="text" id="collaboration_type" name="collaboration_type" class="adm-input" placeholder="Kurumsal DTF & Serigrafi Çözüm Ortaklığı" value="<?= esc($item['collaboration_type']) ?>">
          </div>
        </div>

        <div>
          <div class="adm-form-group">
            <label class="adm-label" for="logo">Logo Yolu</label>
            <input type="text" id="logo" name="logo" class="adm-input" placeholder="assets/images/... veya /uploads/..." value="<?= esc($item['logo']) ?>">
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
              <span><strong>Öne Çıkarılan Referans</strong> (Ana sayfada logolar arasında listelenir)</span>
            </label>
          </div>
        </div>
      </div>

      <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--adm-border); display: flex; gap: 12px; justify-content: flex-end;">
        <a href="/admin/references.php" class="adm-btn adm-btn-secondary">İptal</a>
        <button type="submit" class="adm-btn adm-btn-gold">Kaydet</button>
      </div>
    </form>
  </div>
<?php else: ?>
  <div class="adm-card">
    <div class="adm-card-header">
      <div class="adm-card-title">Referanslar Listesi (Toplam: <?= count($refs) ?>)</div>
      <a href="/admin/references.php?action=new" class="adm-btn adm-btn-gold adm-btn-sm">+ Yeni Referans Ekle</a>
    </div>

    <div class="adm-table-wrap">
      <table class="adm-table">
        <thead>
          <tr>
            <th>Firma Adı</th>
            <th>Sektör</th>
            <th>İş Birliği Türü</th>
            <th>Öne Çıkan</th>
            <th>Durum</th>
            <th style="text-align: right;">İşlemler</th>
          </tr>
        </thead>
        <tbody>
          <?php foreach ($refs as $r): ?>
            <tr>
              <td><strong><?= esc($r['company_name']) ?></strong></td>
              <td><?= esc($r['industry']) ?></td>
              <td style="font-size: 12px; color: var(--adm-text-muted);"><?= esc($r['collaboration_type']) ?></td>
              <td><?= !empty($r['featured']) ? '<span style="color: var(--adm-gold);">★</span>' : '☆' ?></td>
              <td>
                <span class="adm-pill <?= $r['status'] === 'published' ? 'adm-pill-published' : 'adm-pill-draft' ?>">
                  <?= $r['status'] === 'published' ? 'Yayında' : 'Taslak' ?>
                </span>
              </td>
              <td style="text-align: right; white-space: nowrap;">
                <a href="/admin/references.php?action=edit&id=<?= $r['id'] ?>" class="adm-btn adm-btn-gold adm-btn-sm">Düzenle</a>
                <form method="POST" action="" style="display: inline-block;" onsubmit="return confirm('Bu referansı silmek istediğinize emin misiniz?');">
                  <input type="hidden" name="csrf_token" value="<?= csrf_token() ?>">
                  <input type="hidden" name="action" value="delete">
                  <input type="hidden" name="id" value="<?= $r['id'] ?>">
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
