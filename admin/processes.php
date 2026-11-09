<?php
/**
 * NİZAMLAR BASKI — ÜRETİM SÜREÇLERİ YÖNETİMİ
 */

$pageTitle = 'Üretim Süreçleri';
require_once __DIR__ . '/header.php';

$success = null;
$error = null;

$action = $_GET['action'] ?? 'list';
$editId = (int)($_GET['id'] ?? 0);
$editItem = null;

if ($editId > 0) {
    $editItem = DB::fetch("SELECT * FROM `production_processes` WHERE `id` = :id LIMIT 1", [':id' => $editId]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    if (!verify_csrf_token($_POST['csrf_token'] ?? '')) {
        $error = 'Güvenlik doğrulaması geçersiz.';
    } elseif ($_POST['action'] === 'save') {
        $id = (int)($_POST['id'] ?? 0);
        $stepNumber = (int)($_POST['step_number'] ?? 1);
        $title = clean_input($_POST['title'] ?? '', 255);
        $shortDesc = clean_input($_POST['short_desc'] ?? '', 2000);
        $detailText = clean_input($_POST['detail_text'] ?? '', 4000);
        $durationInfo = clean_input($_POST['duration_info'] ?? '', 100);
        $image = clean_input($_POST['image'] ?? '', 255);
        $sort = (int)($_POST['sort'] ?? $stepNumber);
        $status = clean_input($_POST['status'] ?? 'published', 20);

        if (empty($title)) {
            $error = 'Süreç başlığı zorunludur.';
        } else {
            try {
                if ($id > 0) {
                    DB::execute("
                        UPDATE `production_processes` SET
                            `step_number` = :step, `title` = :title, `short_desc` = :sdesc,
                            `detail_text` = :dtext, `duration_info` = :dur, `image` = :img,
                            `sort` = :sort, `status` = :st, `updated_at` = NOW()
                        WHERE `id` = :id
                    ", [
                        ':step' => $stepNumber, ':title' => $title, ':sdesc' => $shortDesc,
                        ':dtext' => $detailText, ':dur' => $durationInfo, ':img' => $image,
                        ':sort' => $sort, ':st' => $status, ':id' => $id
                    ]);
                    $success = "Süreç adımı (#{$id}) güncellendi.";
                } else {
                    DB::execute("
                        INSERT INTO `production_processes` (
                            `step_number`, `title`, `short_desc`, `detail_text`, `duration_info`,
                            `image`, `sort`, `status`, `updated_at`
                        ) VALUES (
                            :step, :title, :sdesc, :dtext, :dur,
                            :img, :sort, :st, NOW()
                        )
                    ", [
                        ':step' => $stepNumber, ':title' => $title, ':sdesc' => $shortDesc,
                        ':dtext' => $detailText, ':dur' => $durationInfo, ':img' => $image,
                        ':sort' => $sort, ':st' => $status
                    ]);
                    $success = "Yeni üretim süreci adımı eklendi.";
                }
                $action = 'list';
            } catch (Exception $e) {
                $error = "Hata: " . $e->getMessage();
            }
        }
    } elseif ($_POST['action'] === 'delete') {
        $delId = (int)$_POST['id'];
        DB::execute("DELETE FROM `production_processes` WHERE `id` = :id", [':id' => $delId]);
        $success = "Süreç adımı silindi.";
    }
}

$processes = DB::fetchAll("SELECT * FROM `production_processes` ORDER BY `sort` ASC, `step_number` ASC");
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
      'id' => 0, 'step_number' => 1, 'title' => '', 'short_desc' => '',
      'detail_text' => '', 'duration_info' => '', 'image' => '', 'sort' => 1, 'status' => 'published'
    ];
  ?>
  <div class="adm-card">
    <div class="adm-card-header">
      <div class="adm-card-title"><?= $item['id'] ? 'Süreç Adımını Düzenle: ' . esc($item['title']) : 'Yeni Süreç Adımı Ekle' ?></div>
      <a href="/admin/processes.php" class="adm-btn adm-btn-secondary adm-btn-sm">← Listeye Dön</a>
    </div>

    <form method="POST" action="">
      <input type="hidden" name="csrf_token" value="<?= csrf_token() ?>">
      <input type="hidden" name="action" value="save">
      <input type="hidden" name="id" value="<?= $item['id'] ?>">

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;">
        <div>
          <div style="display: grid; grid-template-columns: 100px 1fr; gap: 12px;">
            <div class="adm-form-group">
              <label class="adm-label" for="step_number">Adım No</label>
              <input type="number" id="step_number" name="step_number" class="adm-input" required value="<?= (int)$item['step_number'] ?>">
            </div>
            <div class="adm-form-group">
              <label class="adm-label" for="title">Başlık *</label>
              <input type="text" id="title" name="title" class="adm-input" required value="<?= esc($item['title']) ?>">
            </div>
          </div>
          <div class="adm-form-group">
            <label class="adm-label" for="short_desc">Kısa Açıklama (Simülasyon Metni)</label>
            <textarea id="short_desc" name="short_desc" class="adm-textarea" style="min-height: 80px;"><?= esc($item['short_desc']) ?></textarea>
          </div>
          <div class="adm-form-group">
            <label class="adm-label" for="detail_text">Detaylı Teknik Bilgi</label>
            <textarea id="detail_text" name="detail_text" class="adm-textarea" style="min-height: 100px;"><?= esc($item['detail_text']) ?></textarea>
          </div>
        </div>

        <div>
          <div class="adm-form-group">
            <label class="adm-label" for="duration_info">Süre Bilgisi (Örn: 1-2 İş Saati)</label>
            <input type="text" id="duration_info" name="duration_info" class="adm-input" value="<?= esc($item['duration_info']) ?>">
          </div>
          <div class="adm-form-group">
            <label class="adm-label" for="image">Görsel Yolu</label>
            <input type="text" id="image" name="image" class="adm-input" placeholder="assets/images/simulations/... veya /uploads/..." value="<?= esc($item['image']) ?>">
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
        <a href="/admin/processes.php" class="adm-btn adm-btn-secondary">İptal</a>
        <button type="submit" class="adm-btn adm-btn-gold">Kaydet</button>
      </div>
    </form>
  </div>
<?php else: ?>
  <div class="adm-card">
    <div class="adm-card-header">
      <div class="adm-card-title">Üretim Süreçleri Adımları (Toplam: <?= count($processes) ?>)</div>
      <a href="/admin/processes.php?action=new" class="adm-btn adm-btn-gold adm-btn-sm">+ Yeni Adım Ekle</a>
    </div>

    <div class="adm-table-wrap">
      <table class="adm-table">
        <thead>
          <tr>
            <th>Adım</th>
            <th>Görsel</th>
            <th>Başlık</th>
            <th>Süre</th>
            <th>Durum</th>
            <th style="text-align: right;">İşlemler</th>
          </tr>
        </thead>
        <tbody>
          <?php foreach ($processes as $pr): ?>
            <tr>
              <td><span class="adm-badge adm-badge-gold">ADIM <?= $pr['step_number'] ?></span></td>
              <td style="width: 50px;">
                <?php if (!empty($pr['image'])): ?>
                  <img src="/<?= ltrim($pr['image'], '/') ?>" alt="" style="width: 44px; height: 44px; object-fit: contain; background: #0c0d0e; border-radius: 4px;">
                <?php endif; ?>
              </td>
              <td>
                <strong><?= esc($pr['title']) ?></strong>
                <div style="font-size: 11px; color: var(--adm-text-dim);"><?= esc($pr['short_desc']) ?></div>
              </td>
              <td><?= esc($pr['duration_info']) ?></td>
              <td>
                <span class="adm-pill <?= $pr['status'] === 'published' ? 'adm-pill-published' : 'adm-pill-draft' ?>">
                  <?= $pr['status'] === 'published' ? 'Yayında' : 'Taslak' ?>
                </span>
              </td>
              <td style="text-align: right; white-space: nowrap;">
                <a href="/admin/processes.php?action=edit&id=<?= $pr['id'] ?>" class="adm-btn adm-btn-gold adm-btn-sm">Düzenle</a>
                <form method="POST" action="" style="display: inline-block;" onsubmit="return confirm('Bu adımı silmek istediğinize emin misiniz?');">
                  <input type="hidden" name="csrf_token" value="<?= csrf_token() ?>">
                  <input type="hidden" name="action" value="delete">
                  <input type="hidden" name="id" value="<?= $pr['id'] ?>">
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
