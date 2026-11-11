<?php
/**
 * NİZAMLAR BASKI — TEKLİF TALEPLERİ YÖNETİMİ
 */

$pageTitle = 'Teklif Talepleri';
require_once __DIR__ . '/header.php';

$success = null;
$error = null;

// Durum güncelleme veya not kaydetme
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    if (!verify_csrf_token($_POST['csrf_token'] ?? '')) {
        $error = 'Güvenlik doğrulaması geçersiz.';
    } elseif ($_POST['action'] === 'update_status') {
        $id = (int)$_POST['id'];
        $newStatus = clean_input($_POST['status'] ?? '', 50);
        $adminNotes = clean_input($_POST['admin_notes'] ?? '', 2000);

        $allowedStatuses = ['Yeni', 'İnceleniyor', 'Teklif Hazırlandı', 'Tamamlandı', 'İptal'];
        if (in_array($newStatus, $allowedStatuses, true)) {
            DB::execute(
                "UPDATE `quote_requests` SET `status` = :st, `admin_notes` = :notes WHERE `id` = :id",
                [':st' => $newStatus, ':notes' => $adminNotes, ':id' => $id]
            );
            $success = "Talep #{$id} durumu başarıyla güncellendi.";
        }
    } elseif ($_POST['action'] === 'delete') {
        $id = (int)$_POST['id'];
        $q = DB::fetch("SELECT `file_url`, `preview_file_url` FROM `quote_requests` WHERE `id` = :id", [':id' => $id]);
        // İki dosyayı da yalnızca ilgili teklif silindiğinde temizle.
        foreach (['file_url', 'preview_file_url'] as $key) {
            if ($q && !empty($q[$key])) {
                parse_str(parse_url($q[$key], PHP_URL_QUERY) ?? '', $qp);
                $fn = $qp['file'] ?? basename($q[$key]);
                $fp = PRIVATE_QUOTES_DIR . '/' . basename($fn);
                if (is_file($fp)) @unlink($fp);
            }
        }
        DB::execute("DELETE FROM `quote_requests` WHERE `id` = :id", [':id' => $id]);
        $success = "Talep #{$id} silindi.";
    }
}

// Filtreler
$statusFilter = clean_input($_GET['status'] ?? '', 50);
$search = clean_input($_GET['q'] ?? '', 100);

$where = [];
$params = [];

if (!empty($statusFilter) && $statusFilter !== 'all') {
    $where[] = "`status` = :status";
    $params[':status'] = $statusFilter;
}

if (!empty($search)) {
    $where[] = "(`customer_name` LIKE :search OR `company_name` LIKE :search OR `phone` LIKE :search OR `email` LIKE :search)";
    $params[':search'] = "%{$search}%";
}

$sql = "SELECT * FROM `quote_requests`";
if (!empty($where)) {
    $sql .= " WHERE " . implode(" AND ", $where);
}
$sql .= " ORDER BY `created_at` DESC";

$quotes = DB::fetchAll($sql, $params);
?>

<?php if ($success): ?>
  <div class="adm-alert adm-alert-success"><?= esc($success) ?></div>
<?php endif; ?>
<?php if ($error): ?>
  <div class="adm-alert adm-alert-danger"><?= esc($error) ?></div>
<?php endif; ?>

<!-- FİLTRE VE ARAMA ÇUBUĞU -->
<div class="adm-card" style="margin-bottom: 24px;">
  <form method="GET" action="" style="display: flex; gap: 14px; align-items: center; flex-wrap: wrap;">
    <div style="flex: 1; min-width: 220px;">
      <input type="text" name="q" class="adm-input" placeholder="Müşteri adı, firma, telefon veya e-posta ara..." value="<?= esc($search) ?>">
    </div>

    <div style="width: 180px;">
      <select name="status" class="adm-select" onchange="this.form.submit()">
        <option value="all" <?= $statusFilter === 'all' || empty($statusFilter) ? 'selected' : '' ?>>Tüm Durumlar</option>
        <option value="Yeni" <?= $statusFilter === 'Yeni' ? 'selected' : '' ?>>🔴 Yeni Talepler</option>
        <option value="İnceleniyor" <?= $statusFilter === 'İnceleniyor' ? 'selected' : '' ?>>🟡 İnceleniyor</option>
        <option value="Teklif Hazırlandı" <?= $statusFilter === 'Teklif Hazırlandı' ? 'selected' : '' ?>>🔵 Teklif Hazırlandı</option>
        <option value="Tamamlandı" <?= $statusFilter === 'Tamamlandı' ? 'selected' : '' ?>>🟢 Tamamlandı</option>
        <option value="İptal" <?= $statusFilter === 'İptal' ? 'selected' : '' ?>>⚫ İptal Edilenler</option>
      </select>
    </div>

    <button type="submit" class="adm-btn adm-btn-gold">Filtrele</button>
    <?php if (!empty($search) || (!empty($statusFilter) && $statusFilter !== 'all')): ?>
      <a href="/admin/quotes.php" class="adm-btn adm-btn-secondary">Sıfırla</a>
    <?php endif; ?>
  </form>
</div>

<!-- LİSTE -->
<div class="adm-card">
  <div class="adm-card-header">
    <div class="adm-card-title">
      Teklif Talepleri (Toplam: <?= count($quotes) ?>)
    </div>
  </div>

  <div class="adm-table-wrap">
    <table class="adm-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Tarih</th>
          <th>Müşteri Bilgisi</th>
          <th>Baskı / Adet</th>
          <th>Açıklama / Notlar</th>
          <th>Tasarım Dosyası</th>
          <th>Durum</th>
          <th style="text-align: right;">İşlemler</th>
        </tr>
      </thead>
      <tbody>
        <?php if (empty($quotes)): ?>
          <tr><td colspan="8" style="text-align: center; padding: 32px; color: var(--adm-text-dim);">Filtreye uygun teklif talebi bulunamadı.</td></tr>
        <?php else: ?>
          <?php foreach ($quotes as $q): ?>
            <tr>
              <td><strong>#<?= $q['id'] ?></strong></td>
              <td style="font-size: 12px; color: var(--adm-text-dim); white-space: nowrap;">
                <?= date('d.m.Y H:i', strtotime($q['created_at'])) ?>
              </td>
              <td>
                <div style="font-weight: 700; color: #fff;"><?= esc($q['customer_name']) ?></div>
                <?php if (!empty($q['company_name'])): ?>
                  <div style="font-size: 12px; color: var(--adm-text-muted);"><?= esc($q['company_name']) ?></div>
                <?php endif; ?>
                <div style="font-size: 11px; color: var(--adm-text-dim); margin-top: 2px;">
                  <?php if (!empty($q['phone'])): ?>
                    <a href="tel:<?= esc($q['phone']) ?>" style="color: var(--adm-gold);"><?= esc($q['phone']) ?></a>
                  <?php endif; ?>
                  <?php if (!empty($q['phone']) && !empty($q['email'])) echo ' • '; ?>
                  <?php if (!empty($q['email'])): ?>
                    <a href="mailto:<?= esc($q['email']) ?>" style="color: var(--adm-text-muted);"><?= esc($q['email']) ?></a>
                  <?php endif; ?>
                </div>
              </td>
              <td>
                <div style="font-weight: 600;"><?= esc($q['print_type']) ?></div>
                <div style="font-size: 12px; color: var(--adm-text-dim);"><?= esc($q['quantity']) ?></div>
              </td>
              <td style="max-width: 250px;">
                <div style="font-size: 12px; color: var(--adm-text-muted); max-height: 48px; overflow: hidden; text-overflow: ellipsis; white-space: pre-line;">
                  <?= esc($q['description']) ?>
                </div>
                <?php if (!empty($q['admin_notes'])): ?>
                  <div style="font-size: 11px; color: var(--adm-gold); margin-top: 4px;">
                    <strong>Yönetici Notu:</strong> <?= esc($q['admin_notes']) ?>
                  </div>
                <?php endif; ?>
              </td>
              <td>
                <?php if (!empty($q['preview_file_url'])): ?>
                  <div style="display:flex; flex-direction:column; gap:6px; margin-bottom:8px;">
                    <a href="/admin/quote-file.php?id=<?= (int)$q['id'] ?>&amp;kind=preview&amp;view=1"
                       target="_blank" rel="noopener" title="Ürün üzerindeki tasarımı büyüt">
                      <img src="/admin/quote-file.php?id=<?= (int)$q['id'] ?>&amp;kind=preview&amp;view=1"
                           alt="Teklif #<?= (int)$q['id'] ?> ürün mockup önizlemesi" loading="lazy"
                           style="width:100px;height:112px;object-fit:contain;border-radius:6px;border:1px solid rgba(178,148,96,.4);background:#1a1b1d;">
                    </a>
                    <a href="/admin/quote-file.php?id=<?= (int)$q['id'] ?>&amp;kind=preview"
                       class="adm-btn adm-btn-secondary adm-btn-sm">Mockup PNG indir</a>
                  </div>
                <?php endif; ?>
                <?php if (!empty($q['file_url'])): ?>
                  <a href="/admin/quote-file.php?id=<?= (int)$q['id'] ?>"
                     class="adm-btn adm-btn-secondary adm-btn-sm" title="<?= esc($q['file_name']) ?>">
                    Orijinal tasarımı indir (<?= round(($q['file_size'] ?? 0)/1024/1024, 2) ?> MB)
                  </a>
                <?php elseif (empty($q['preview_file_url'])): ?>
                  <span style="font-size:11px;color:var(--adm-text-dim);">Dosya yok</span>
                <?php endif; ?>
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
              <td style="text-align: right; white-space: nowrap;">
                <button type="button" class="adm-btn adm-btn-secondary adm-btn-sm" onclick="openEditModal(<?= htmlspecialchars(json_encode($q), ENT_QUOTES, 'UTF-8') ?>)">
                  Düzenle
                </button>
                <form method="POST" action="" style="display: inline-block;" onsubmit="return confirm('Bu teklif talebini silmek istediğinize emin misiniz?');">
                  <input type="hidden" name="csrf_token" value="<?= csrf_token() ?>">
                  <input type="hidden" name="action" value="delete">
                  <input type="hidden" name="id" value="<?= $q['id'] ?>">
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

<!-- DÜZENLEME MODALI -->
<div class="adm-modal" id="editModal">
  <div class="adm-modal-box">
    <div class="adm-modal-header">
      <div class="adm-card-title" id="modalTitle">Teklif Talebini Yönet</div>
      <button type="button" class="adm-btn adm-btn-secondary adm-btn-sm" onclick="closeEditModal()">✕</button>
    </div>
    <form method="POST" action="" class="adm-modal-body">
      <input type="hidden" name="csrf_token" value="<?= csrf_token() ?>">
      <input type="hidden" name="action" value="update_status">
      <input type="hidden" name="id" id="modalQuoteId">

      <div class="adm-form-group">
        <label class="adm-label">Müşteri & İletişim</label>
        <div id="modalClientInfo" style="padding: 10px; background: rgba(0,0,0,0.2); border-radius: 4px; font-size: 13px;"></div>
      </div>

      <div class="adm-form-group">
        <label class="adm-label">Talebin Tam Metni</label>
        <div id="modalDescription" style="padding: 10px; background: rgba(0,0,0,0.2); border-radius: 4px; font-size: 12px; max-height: 140px; overflow-y: auto; white-space: pre-line; color: var(--adm-text-muted);"></div>
      </div>

      <div class="adm-form-group">
        <label class="adm-label" for="modalStatus">Talep Durumu</label>
        <select name="status" id="modalStatus" class="adm-select">
          <option value="Yeni">🔴 Yeni Talep</option>
          <option value="İnceleniyor">🟡 İnceleniyor</option>
          <option value="Teklif Hazırlandı">🔵 Teklif Hazırlandı</option>
          <option value="Tamamlandı">🟢 Tamamlandı (Sipariş Onaylandı)</option>
          <option value="İptal">⚫ İptal Edildi</option>
        </select>
      </div>

      <div class="adm-form-group">
        <label class="adm-label" for="modalNotes">Yönetici Notları <small>(Yalnızca şirket içinde görünür)</small></label>
        <textarea name="admin_notes" id="modalNotes" class="adm-textarea" placeholder="Örn: 24.10 tarihinde telefonla arandı, numune gönderimi için adres teyit edildi..."></textarea>
      </div>

      <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 16px;">
        <button type="button" class="adm-btn adm-btn-secondary" onclick="closeEditModal()">Kapat</button>
        <button type="submit" class="adm-btn adm-btn-gold">Değişiklikleri Kaydet</button>
      </div>
    </form>
  </div>
</div>

<script>
function openEditModal(q) {
  document.getElementById('modalQuoteId').value = q.id;
  document.getElementById('modalTitle').textContent = `Teklif Talebi #${q.id} — ${q.customer_name}`;
  document.getElementById('modalClientInfo').innerHTML = `
    <strong>${q.customer_name}</strong> ${q.company_name ? `(${q.company_name})` : ''}<br>
    Telefon: <a href="tel:${q.phone}" style="color: var(--adm-gold);">${q.phone || '-'}</a> | 
    E-posta: <a href="mailto:${q.email}" style="color: var(--adm-gold);">${q.email || '-'}</a><br>
    Baskı Türü: <strong>${q.print_type}</strong> | Adet: <strong>${q.quantity}</strong>
  `;
  document.getElementById('modalDescription').textContent = q.description || 'Açıklama belirtilmemiş.';
  document.getElementById('modalStatus').value = q.status;
  document.getElementById('modalNotes').value = q.admin_notes || '';
  document.getElementById('editModal').classList.add('active');
}

function closeEditModal() {
  document.getElementById('editModal').classList.remove('active');
}

document.getElementById('editModal').addEventListener('click', (e) => {
  if (e.target.id === 'editModal') closeEditModal();
});
</script>

<?php require_once __DIR__ . '/footer.php'; ?>
