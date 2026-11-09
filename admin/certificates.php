<?php
/**
 * NİZAMLAR BASKI — SERTİFİKALAR YÖNETİMİ
 */

$pageTitle = 'Sertifikalar';
require_once __DIR__ . '/header.php';

$success = null;
$error = null;

$action = $_GET['action'] ?? 'list';
$editId = (int)($_GET['id'] ?? 0);
$editItem = null;

if ($editId > 0) {
    $editItem = DB::fetch("SELECT * FROM `certificates` WHERE `id` = :id LIMIT 1", [':id' => $editId]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    if (!verify_csrf_token($_POST['csrf_token'] ?? '')) {
        $error = 'Güvenlik doğrulaması geçersiz.';
    } elseif ($_POST['action'] === 'save') {
        $id = (int)($_POST['id'] ?? 0);
        $title = clean_input($_POST['title'] ?? '', 255);
        $org = clean_input($_POST['organization'] ?? '', 150);
        $no = clean_input($_POST['certificate_no'] ?? '', 100);
        $val = clean_input($_POST['validity'] ?? '', 100);
        $desc = clean_input($_POST['description'] ?? '', 2000);
        $image = clean_input($_POST['image'] ?? '', 255);
        $pdf = clean_input($_POST['pdf_file'] ?? '', 255);
        $sort = (int)($_POST['sort'] ?? 0);
        $status = clean_input($_POST['status'] ?? 'published', 20);

        if (empty($title)) {
            $error = 'Sertifika adı zorunludur.';
        } else {
            try {
                if ($id > 0) {
                    DB::execute("
                        UPDATE `certificates` SET
                            `title` = :t, `organization` = :org, `certificate_no` = :no,
                            `validity` = :val, `description` = :desc, `image` = :img,
                            `pdf_file` = :pdf, `sort` = :sort, `status` = :st, `updated_at` = NOW()
                        WHERE `id` = :id
                    ", [
                        ':t' => $title, ':org' => $org, ':no' => $no,
                        ':val' => $val, ':desc' => $desc, ':img' => $image,
                        ':pdf' => $pdf, ':sort' => $sort, ':st' => $status, ':id' => $id
                    ]);
                    $success = "Sertifika güncellendi.";
                } else {
                    DB::execute("
                        INSERT INTO `certificates` (
                            `title`, `organization`, `certificate_no`, `validity`,
                            `description`, `image`, `pdf_file`, `sort`, `status`, `updated_at`
                        ) VALUES (
                            :t, :org, :no, :val,
                            :desc, :img, :pdf, :sort, :st, NOW()
                        )
                    ", [
                        ':t' => $title, ':org' => $org, ':no' => $no,
                        ':val' => $val, ':desc' => $desc, ':img' => $image,
                        ':pdf' => $pdf, ':sort' => $sort, ':st' => $status
                    ]);
                    $success = "Yeni sertifika eklendi.";
                }
                $action = 'list';
            } catch (Exception $e) {
                $error = "Hata: " . $e->getMessage();
            }
        }
    } elseif ($_POST['action'] === 'delete') {
        $delId = (int)$_POST['id'];
        DB::execute("DELETE FROM `certificates` WHERE `id` = :id", [':id' => $delId]);
        $success = "Sertifika silindi.";
    }
}

$certs = DB::fetchAll("SELECT * FROM `certificates` ORDER BY `sort` ASC, `id` ASC");
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
      'id' => 0, 'title' => '', 'organization' => '', 'certificate_no' => '',
      'validity' => '', 'description' => '', 'image' => '', 'pdf_file' => '',
      'sort' => 0, 'status' => 'published'
    ];
  ?>
  <div class="adm-card">
    <div class="adm-card-header">
      <div class="adm-card-title"><?= $item['id'] ? 'Sertifikayı Düzenle: ' . esc($item['title']) : 'Yeni Sertifika Ekle' ?></div>
      <a href="/admin/certificates.php" class="adm-btn adm-btn-secondary adm-btn-sm">← Listeye Dön</a>
    </div>

    <form method="POST" action="">
      <input type="hidden" name="csrf_token" value="<?= csrf_token() ?>">
      <input type="hidden" name="action" value="save">
      <input type="hidden" name="id" value="<?= $item['id'] ?>">

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;">
        <div>
          <div class="adm-form-group">
            <label class="adm-label" for="title">Sertifika Adı *</label>
            <input type="text" id="title" name="title" class="adm-input" required value="<?= esc($item['title']) ?>">
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div class="adm-form-group">
              <label class="adm-label" for="organization">Veren Kuruluş</label>
              <input type="text" id="organization" name="organization" class="adm-input" value="<?= esc($item['organization']) ?>">
            </div>
            <div class="adm-form-group">
              <label class="adm-label" for="certificate_no">Belge No</label>
              <input type="text" id="certificate_no" name="certificate_no" class="adm-input" value="<?= esc($item['certificate_no']) ?>">
            </div>
          </div>
          <div class="adm-form-group">
            <label class="adm-label" for="validity">Geçerlilik Tarihi (Örn: 2026 - 2027)</label>
            <input type="text" id="validity" name="validity" class="adm-input" value="<?= esc($item['validity']) ?>">
          </div>
          <div class="adm-form-group">
            <label class="adm-label" for="description">Açıklama</label>
            <textarea id="description" name="description" class="adm-textarea"><?= esc($item['description']) ?></textarea>
          </div>
        </div>

        <div>
          <div class="adm-form-group">
            <label class="adm-label" for="image">Görsel / Rozet Yolu</label>
            <input type="text" id="image" name="image" class="adm-input" placeholder="assets/images/certs/... veya /uploads/..." value="<?= esc($item['image']) ?>">
          </div>
          <div class="adm-form-group">
            <label class="adm-label" for="pdf_file">PDF Belgesi Yolu (Opsiyonel)</label>
            <input type="text" id="pdf_file" name="pdf_file" class="adm-input" value="<?= esc($item['pdf_file']) ?>">
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
        <a href="/admin/certificates.php" class="adm-btn adm-btn-secondary">İptal</a>
        <button type="submit" class="adm-btn adm-btn-gold">Kaydet</button>
      </div>
    </form>
  </div>
<?php else: ?>
  <div class="adm-card">
    <div class="adm-card-header">
      <div class="adm-card-title">Sertifikalar Listesi (Toplam: <?= count($certs) ?>)</div>
      <a href="/admin/certificates.php?action=new" class="adm-btn adm-btn-gold adm-btn-sm">+ Yeni Sertifika Ekle</a>
    </div>

    <div class="adm-table-wrap">
      <table class="adm-table">
        <thead>
          <tr>
            <th>Görsel</th>
            <th>Sertifika Adı</th>
            <th>Kuruluş</th>
            <th>Geçerlilik</th>
            <th>Durum</th>
            <th style="text-align: right;">İşlemler</th>
          </tr>
        </thead>
        <tbody>
          <?php foreach ($certs as $c): ?>
            <tr>
              <td style="width: 50px;">
                <?php if (!empty($c['image'])): ?>
                  <img src="/<?= ltrim($c['image'], '/') ?>" alt="" style="width: 44px; height: 44px; object-fit: contain; background: #0c0d0e; border-radius: 4px;">
                <?php endif; ?>
              </td>
              <td>
                <strong><?= esc($c['title']) ?></strong>
                <div style="font-size: 11px; color: var(--adm-text-dim);"><?= esc($c['certificate_no']) ?></div>
              </td>
              <td><?= esc($c['organization']) ?></td>
              <td><?= esc($c['validity']) ?></td>
              <td>
                <span class="adm-pill <?= $c['status'] === 'published' ? 'adm-pill-published' : 'adm-pill-draft' ?>">
                  <?= $c['status'] === 'published' ? 'Yayında' : 'Taslak' ?>
                </span>
              </td>
              <td style="text-align: right; white-space: nowrap;">
                <a href="/admin/certificates.php?action=edit&id=<?= $c['id'] ?>" class="adm-btn adm-btn-gold adm-btn-sm">Düzenle</a>
                <form method="POST" action="" style="display: inline-block;" onsubmit="return confirm('Bu sertifikayı silmek istediğinize emin misiniz?');">
                  <input type="hidden" name="csrf_token" value="<?= csrf_token() ?>">
                  <input type="hidden" name="action" value="delete">
                  <input type="hidden" name="id" value="<?= $c['id'] ?>">
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
