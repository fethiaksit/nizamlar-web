<?php
/**
 * NİZAMLAR BASKI — İLETİŞİM MESAJLARI YÖNETİMİ
 */

$pageTitle = 'İletişim Mesajları';
require_once __DIR__ . '/header.php';

$success = null;
$error = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    if (!verify_csrf_token($_POST['csrf_token'] ?? '')) {
        $error = 'Güvenlik doğrulaması geçersiz.';
    } elseif ($_POST['action'] === 'update_status') {
        $id = (int)$_POST['id'];
        $newStatus = clean_input($_POST['status'] ?? '', 20);
        $notes = clean_input($_POST['admin_notes'] ?? '', 2000);
        if (in_array($newStatus, ['new', 'read', 'replied'], true)) {
            DB::execute("UPDATE `contact_messages` SET `status` = :st, `admin_notes` = :notes WHERE `id` = :id", [
                ':st' => $newStatus,
                ':notes' => $notes,
                ':id' => $id
            ]);
            $success = "Mesaj #{$id} durumu güncellendi.";
        }
    } elseif ($_POST['action'] === 'retry_email') {
        $id = (int)$_POST['id'];
        $msg = DB::fetch("SELECT * FROM `contact_messages` WHERE `id` = :id LIMIT 1", [':id' => $id]);
        if ($msg) {
            $mailSubject = "Yeni İletişim Mesajı (#{$id}) — {$msg['name']} [{$msg['subject']}]";
            $mailBody = "<h2>İletişim Mesajı (Yeniden Gönderildi)</h2>" .
                        "<p><strong>Gönderen:</strong> " . esc($msg['name']) . "</p>" .
                        "<p><strong>Firma:</strong> " . esc($msg['company']) . "</p>" .
                        "<p><strong>Telefon:</strong> " . esc($msg['phone']) . "</p>" .
                        "<p><strong>E-posta:</strong> " . esc($msg['email']) . "</p>" .
                        "<p><strong>Konu:</strong> " . esc($msg['subject']) . "</p>" .
                        "<p><strong>Mesaj:</strong><br>" . nl2br(esc($msg['message'])) . "</p>";

            $adminEmail = env_get('CONTACT_NOTIFICATION_EMAIL', 'nizamlartekstill@gmail.com');
            $res = SimpleSMTP::send($adminEmail, $mailSubject, $mailBody);
            $newEmailStatus = $res['ok'] ? 'sent' : 'failed';
            DB::execute("UPDATE `contact_messages` SET `email_status` = :st WHERE `id` = :id", [
                ':st' => $newEmailStatus,
                ':id' => $id
            ]);
            if ($res['ok']) {
                $success = "E-posta bildirimi başarıyla gönderildi.";
            } else {
                $error = "E-posta gönderimi tekrar başarısız oldu: " . ($res['error'] ?? 'SMTP hatası');
            }
        }
    } elseif ($_POST['action'] === 'delete') {
        $id = (int)$_POST['id'];
        DB::execute("DELETE FROM `contact_messages` WHERE `id` = :id", [':id' => $id]);
        $success = "Mesaj #{$id} silindi.";
    }
}

$statusFilter = clean_input($_GET['status'] ?? '', 20);
$search = clean_input($_GET['q'] ?? '', 100);

$where = [];
$params = [];

if (!empty($statusFilter) && $statusFilter !== 'all') {
    $where[] = "`status` = :st";
    $params[':st'] = $statusFilter;
}

if (!empty($search)) {
    $where[] = "(`name` LIKE :search OR `company` LIKE :search OR `email` LIKE :search OR `phone` LIKE :search OR `message` LIKE :search)";
    $params[':search'] = "%{$search}%";
}

$sql = "SELECT * FROM `contact_messages`";
if (!empty($where)) {
    $sql .= " WHERE " . implode(" AND ", $where);
}
$sql .= " ORDER BY `received_at` DESC";

$messages = DB::fetchAll($sql, $params);
?>

<?php if ($success): ?>
  <div class="adm-alert adm-alert-success"><?= esc($success) ?></div>
<?php endif; ?>
<?php if ($error): ?>
  <div class="adm-alert adm-alert-danger"><?= esc($error) ?></div>
<?php endif; ?>

<!-- FİLTRE VE ARAMA -->
<div class="adm-card" style="margin-bottom: 24px;">
  <form method="GET" action="" style="display: flex; gap: 14px; align-items: center; flex-wrap: wrap;">
    <div style="flex: 1; min-width: 220px;">
      <input type="text" name="q" class="adm-input" placeholder="Gönderen adı, firma, telefon veya mesaj içeriği ara..." value="<?= esc($search) ?>">
    </div>

    <div style="width: 180px;">
      <select name="status" class="adm-select" onchange="this.form.submit()">
        <option value="all" <?= $statusFilter === 'all' || empty($statusFilter) ? 'selected' : '' ?>>Tüm Durumlar</option>
        <option value="new" <?= $statusFilter === 'new' ? 'selected' : '' ?>>🔴 Okunmamış (Yeni)</option>
        <option value="read" <?= $statusFilter === 'read' ? 'selected' : '' ?>>🔵 Okundu</option>
        <option value="replied" <?= $statusFilter === 'replied' ? 'selected' : '' ?>>🟢 Yanıtlandı</option>
      </select>
    </div>

    <button type="submit" class="adm-btn adm-btn-gold">Filtrele</button>
    <?php if (!empty($search) || (!empty($statusFilter) && $statusFilter !== 'all')): ?>
      <a href="/admin/messages.php" class="adm-btn adm-btn-secondary">Sıfırla</a>
    <?php endif; ?>
  </form>
</div>

<!-- MESAJ TABLOSU -->
<div class="adm-card">
  <div class="adm-card-header">
    <div class="adm-card-title">Gelen İletişim Mesajları (Toplam: <?= count($messages) ?>)</div>
  </div>

  <div class="adm-table-wrap">
    <table class="adm-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Tarih</th>
          <th>Gönderen</th>
          <th>Konu</th>
          <th>Mesaj Özeti</th>
          <th>E-posta Durumu</th>
          <th>Durum</th>
          <th style="text-align: right;">İşlemler</th>
        </tr>
      </thead>
      <tbody>
        <?php if (empty($messages)): ?>
          <tr><td colspan="8" style="text-align: center; padding: 32px; color: var(--adm-text-dim);">Filtreye uygun mesaj bulunamadı.</td></tr>
        <?php else: ?>
          <?php foreach ($messages as $m): ?>
            <tr>
              <td><strong>#<?= $m['id'] ?></strong></td>
              <td style="font-size: 12px; color: var(--adm-text-dim); white-space: nowrap;">
                <?= date('d.m.Y H:i', strtotime($m['received_at'])) ?>
              </td>
              <td>
                <div style="font-weight: 700; color: #fff;"><?= esc($m['name']) ?></div>
                <?php if (!empty($m['company'])): ?>
                  <div style="font-size: 12px; color: var(--adm-text-muted);"><?= esc($m['company']) ?></div>
                <?php endif; ?>
                <div style="font-size: 11px; color: var(--adm-text-dim);">
                  <a href="tel:<?= esc($m['phone']) ?>" style="color: var(--adm-gold);"><?= esc($m['phone']) ?></a> • 
                  <a href="mailto:<?= esc($m['email']) ?>" style="color: var(--adm-text-muted);"><?= esc($m['email']) ?></a>
                </div>
              </td>
              <td style="font-weight: 600; white-space: nowrap;">
                <?= esc($m['subject']) ?>
              </td>
              <td style="max-width: 250px;">
                <div style="font-size: 12px; color: var(--adm-text-muted); max-height: 48px; overflow: hidden; text-overflow: ellipsis; white-space: pre-line;">
                  <?= esc($m['message']) ?>
                </div>
              </td>
              <td>
                <?php if ($m['email_status'] === 'sent'): ?>
                  <span class="adm-pill adm-pill-done" title="SMTP bildirimi başarıyla iletildi">İletildi</span>
                <?php elseif ($m['email_status'] === 'failed'): ?>
                  <span class="adm-pill adm-pill-new" title="SMTP gönderim hatası">Başarısız</span>
                  <form method="POST" action="" style="display: inline-block; margin-left: 4px;">
                    <input type="hidden" name="csrf_token" value="<?= csrf_token() ?>">
                    <input type="hidden" name="action" value="retry_email">
                    <input type="hidden" name="id" value="<?= $m['id'] ?>">
                    <button type="submit" class="adm-btn adm-btn-secondary adm-btn-sm" style="padding: 2px 6px; font-size: 10px;" title="E-postayı Yeniden Gönder">Tekrar Dene</button>
                  </form>
                <?php else: ?>
                  <span class="adm-pill adm-pill-review">Bekliyor</span>
                <?php endif; ?>
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
              <td style="text-align: right; white-space: nowrap;">
                <button type="button" class="adm-btn adm-btn-secondary adm-btn-sm" onclick="openMsgModal(<?= htmlspecialchars(json_encode($m), ENT_QUOTES, 'UTF-8') ?>)">
                  Detay
                </button>
                <form method="POST" action="" style="display: inline-block;" onsubmit="return confirm('Bu mesajı silmek istediğinize emin misiniz?');">
                  <input type="hidden" name="csrf_token" value="<?= csrf_token() ?>">
                  <input type="hidden" name="action" value="delete">
                  <input type="hidden" name="id" value="<?= $m['id'] ?>">
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

<!-- MESAJ İNCELEME MODALI -->
<div class="adm-modal" id="msgModal">
  <div class="adm-modal-box">
    <div class="adm-modal-header">
      <div class="adm-card-title" id="msgModalTitle">Mesaj Detayı</div>
      <button type="button" class="adm-btn adm-btn-secondary adm-btn-sm" onclick="closeMsgModal()">✕</button>
    </div>
    <form method="POST" action="" class="adm-modal-body">
      <input type="hidden" name="csrf_token" value="<?= csrf_token() ?>">
      <input type="hidden" name="action" value="update_status">
      <input type="hidden" name="id" id="modalMsgId">

      <div class="adm-form-group">
        <label class="adm-label">Gönderen Bilgileri</label>
        <div id="modalSenderInfo" style="padding: 10px; background: rgba(0,0,0,0.2); border-radius: 4px; font-size: 13px;"></div>
      </div>

      <div class="adm-form-group">
        <label class="adm-label">Mesaj İçeriği</label>
        <div id="modalMessageText" style="padding: 12px; background: rgba(0,0,0,0.2); border-radius: 4px; font-size: 13px; max-height: 180px; overflow-y: auto; white-space: pre-line; color: #fff;"></div>
      </div>

      <div class="adm-form-group">
        <label class="adm-label" for="modalMsgStatus">Mesaj Durumu</label>
        <select name="status" id="modalMsgStatus" class="adm-select">
          <option value="new">🔴 Yeni (Okunmadı)</option>
          <option value="read">🔵 Okundu</option>
          <option value="replied">🟢 Yanıtlandı</option>
        </select>
      </div>

      <div class="adm-form-group">
        <label class="adm-label" for="modalMsgNotes">Yönetici Notu</label>
        <textarea name="admin_notes" id="modalMsgNotes" class="adm-textarea" placeholder="Bu müşteri ile ilgili şirket içi notlar..."></textarea>
      </div>

      <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 16px;">
        <button type="button" class="adm-btn adm-btn-secondary" onclick="closeMsgModal()">Kapat</button>
        <button type="submit" class="adm-btn adm-btn-gold">Durumu Güncelle</button>
      </div>
    </form>
  </div>
</div>

<script>
function openMsgModal(m) {
  document.getElementById('modalMsgId').value = m.id;
  document.getElementById('msgModalTitle').textContent = `Mesaj #${m.id} — ${m.name}`;
  document.getElementById('modalSenderInfo').innerHTML = `
    <strong>${m.name}</strong> ${m.company ? `(${m.company})` : ''}<br>
    Telefon: <a href="tel:${m.phone}" style="color: var(--adm-gold);">${m.phone || '-'}</a> | 
    E-posta: <a href="mailto:${m.email}" style="color: var(--adm-gold);">${m.email || '-'}</a><br>
    Konu: <strong>${m.subject}</strong>
  `;
  document.getElementById('modalMessageText').textContent = m.message;
  document.getElementById('modalMsgStatus').value = m.status;
  document.getElementById('modalMsgNotes').value = m.admin_notes || '';
  document.getElementById('msgModal').classList.add('active');
}

function closeMsgModal() {
  document.getElementById('msgModal').classList.remove('active');
}

document.getElementById('msgModal').addEventListener('click', (e) => {
  if (e.target.id === 'msgModal') closeMsgModal();
});
</script>

<?php require_once __DIR__ . '/footer.php'; ?>
