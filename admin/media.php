<?php
/**
 * NİZAMLAR BASKI — MEDYA KÜTÜPHANESİ
 * Görsel, video, PDF ve diğer medya varlıklarının yönetimi
 */

$pageTitle = 'Medya Kütüphanesi';
require_once __DIR__ . '/header.php';

$success = null;
$error = null;

$uploadDir = UPLOAD_PATH;
if (!is_dir($uploadDir)) {
    @mkdir($uploadDir, 0755, true);
}

// -----------------------------------------------------------------------------
// POST İşlemleri (Yükleme & Silme)
// -----------------------------------------------------------------------------
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    if (!verify_csrf_token($_POST['csrf_token'] ?? '')) {
        $error = 'Güvenlik doğrulaması geçersiz. Lütfen sayfayı yenileyip tekrar deneyin.';
    } elseif ($_POST['action'] === 'upload') {
        if (!empty($_FILES['media_files']['name'][0])) {
            $allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'svg', 'gif', 'mp4', 'webm', 'pdf'];
            $allowedMimes = [
                'image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif',
                'video/mp4', 'video/webm', 'application/pdf'
            ];
            $uploadedCount = 0;
            $failedCount = 0;

            $count = count($_FILES['media_files']['name']);
            for ($i = 0; $i < $count; $i++) {
                if ($_FILES['media_files']['error'][$i] !== UPLOAD_ERR_OK) {
                    $failedCount++;
                    continue;
                }

                $origName = $_FILES['media_files']['name'][$i];
                $tmpPath = $_FILES['media_files']['tmp_name'][$i];
                $fileSize = (int)$_FILES['media_files']['size'][$i];
                $ext = strtolower(pathinfo($origName, PATHINFO_EXTENSION));

                // 25 MB limit
                if ($fileSize > 25 * 1024 * 1024) {
                    $failedCount++;
                    continue;
                }

                if (!in_array($ext, $allowedExtensions, true)) {
                    $failedCount++;
                    continue;
                }

                $finfo = finfo_open(FILEINFO_MIME_TYPE);
                $detectedMime = finfo_file($finfo, $tmpPath);
                finfo_close($finfo);

                if (!in_array($detectedMime, $allowedMimes, true) && $ext !== 'svg') {
                    $failedCount++;
                    continue;
                }

                // SVG için betik denetimi
                if ($ext === 'svg') {
                    $svgContent = @file_get_contents($tmpPath);
                    if ($svgContent === false || preg_match('/<script|onload|onerror|javascript:/i', $svgContent)) {
                        $failedCount++;
                        continue;
                    }
                    $detectedMime = 'image/svg+xml';
                }

                $safeBasename = preg_replace('/[^a-zA-Z0-9_\-]/', '_', pathinfo($origName, PATHINFO_FILENAME));
                $safeBasename = substr($safeBasename, 0, 40);
                $uniqueName = 'media_' . date('Ymd_His') . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
                $targetPath = $uploadDir . '/' . $uniqueName;

                if (move_uploaded_file($tmpPath, $targetPath)) {
                    @chmod($targetPath, 0644);
                    try {
                        DB::execute("
                            INSERT INTO `media_library` (
                                `filename`, `original_name`, `file_path`, `file_size`, `mime_type`, `created_at`
                            ) VALUES (
                                :fn, :on, :fp, :fs, :mt, NOW()
                            )
                        ", [
                            ':fn' => $uniqueName,
                            ':on' => $origName,
                            ':fp' => '/uploads/' . $uniqueName,
                            ':fs' => $fileSize,
                            ':mt' => $detectedMime
                        ]);
                        $uploadedCount++;
                    } catch (Throwable $e) {
                        @unlink($targetPath);
                        $failedCount++;
                    }
                } else {
                    $failedCount++;
                }
            }

            if ($uploadedCount > 0) {
                $success = "{$uploadedCount} dosya başarıyla kütüphaneye yüklendi." . ($failedCount > 0 ? " ({$failedCount} dosya yüklenemedi)" : "");
            } else {
                $error = "Dosya yüklenemedi. İzin verilen türler ve boyut limitlerini (maks 25 MB) kontrol edin.";
            }
        } else {
            $error = 'Lütfen yüklenecek en az bir dosya seçin.';
        }
    } elseif ($_POST['action'] === 'delete') {
        $id = (int)($_POST['id'] ?? 0);
        $media = DB::fetch("SELECT * FROM `media_library` WHERE `id` = :id LIMIT 1", [':id' => $id]);
        if ($media) {
            $targetPath = $uploadDir . '/' . $media['filename'];
            if (file_exists($targetPath)) {
                @unlink($targetPath);
            }
            DB::execute("DELETE FROM `media_library` WHERE `id` = :id LIMIT 1", [':id' => $id]);
            $success = "Medya dosyası '{$media['original_name']}' silindi.";
        } else {
            $error = "Silinecek medya bulunamadı.";
        }
    }
}

// -----------------------------------------------------------------------------
// Medya Listeleme & Filtreleme
// -----------------------------------------------------------------------------
$search = clean_input($_GET['q'] ?? '', 100);
$filterType = clean_input($_GET['type'] ?? 'all', 20);

$query = "SELECT * FROM `media_library` WHERE 1=1";
$params = [];

if (!empty($search)) {
    $query .= " AND (`original_name` LIKE :q OR `filename` LIKE :q2)";
    $params[':q'] = "%{$search}%";
    $params[':q2'] = "%{$search}%";
}

if ($filterType === 'image') {
    $query .= " AND `mime_type` LIKE 'image/%'";
} elseif ($filterType === 'video') {
    $query .= " AND `mime_type` LIKE 'video/%'";
} elseif ($filterType === 'pdf') {
    $query .= " AND `mime_type` = 'application/pdf'";
}

$query .= " ORDER BY `created_at` DESC";

$mediaList = DB::fetchAll($query, $params);
$totalCount = count($mediaList);

function format_file_size_human(int $bytes): string {
    if ($bytes >= 1048576) {
        return number_format($bytes / 1048576, 1) . ' MB';
    } elseif ($bytes >= 1024) {
        return number_format($bytes / 1024, 0) . ' KB';
    }
    return $bytes . ' B';
}
?>

<div class="adm-header">
  <div>
    <h1 class="adm-title">Medya Kütüphanesi</h1>
    <p class="adm-subtitle">Sitede kullanılan görsel, video ve belgeleri yönetin, yeni dosyalar yükleyin.</p>
  </div>
  <div>
    <button type="button" class="adm-btn adm-btn-primary" onclick="document.getElementById('uploadDrawer').classList.toggle('hidden')">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
      Dosya Yükle
    </button>
  </div>
</div>

<?php if ($success): ?>
  <div class="adm-alert adm-alert-success"><?= esc($success) ?></div>
<?php endif; ?>

<?php if ($error): ?>
  <div class="adm-alert adm-alert-danger"><?= esc($error) ?></div>
<?php endif; ?>

<!-- Yükleme Kutusu (Varsayılan Açık / Açılıp Kapanabilir) -->
<div id="uploadDrawer" class="adm-card <?= empty($error) && empty($_FILES) ? '' : '' ?>" style="margin-bottom: 24px;">
  <div class="adm-card-header">
    <h2 class="adm-card-title">Yeni Dosya Yükle</h2>
    <span style="font-size: 0.8125rem; color: var(--adm-text-dim);">JPG, PNG, WebP, SVG, GIF, MP4, PDF (Maks 25 MB)</span>
  </div>
  <div class="adm-card-body">
    <form method="POST" action="/admin/media.php" enctype="multipart/form-data">
      <input type="hidden" name="csrf_token" value="<?= get_csrf_token() ?>">
      <input type="hidden" name="action" value="upload">

      <div style="border: 2px dashed var(--adm-border); border-radius: var(--adm-radius-md); padding: 32px 20px; text-align: center; background: rgba(255,255,255,0.02); transition: border-color var(--adm-transition);" id="dropArea">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--adm-gold)" stroke-width="1.8" style="margin-bottom: 12px;"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
        <p style="font-weight: 500; margin-bottom: 6px; color: var(--adm-text);">Dosyaları buraya sürükleyip bırakın veya seçin</p>
        <p style="font-size: 0.8125rem; color: var(--adm-text-dim); margin-bottom: 16px;">Birden fazla dosya seçebilirsiniz.</p>
        <input type="file" name="media_files[]" id="mediaInput" multiple accept=".jpg,.jpeg,.png,.webp,.svg,.gif,.mp4,.webm,.pdf" style="display:none;" onchange="updateSelectedFiles(this)">
        <button type="button" class="adm-btn adm-btn-secondary" onclick="document.getElementById('mediaInput').click()">Dosya Seç</button>
        <div id="fileSelectionText" style="margin-top: 12px; font-size: 0.8125rem; color: var(--adm-gold); font-weight: 500;"></div>
      </div>

      <div style="margin-top: 16px; display: flex; justify-content: flex-end;">
        <button type="submit" class="adm-btn adm-btn-primary" id="uploadSubmitBtn" disabled>
          Yüklemeyi Başlat
        </button>
      </div>
    </form>
  </div>
</div>

<!-- Filtre & Arama Çubuğu -->
<div class="adm-card" style="margin-bottom: 24px;">
  <div class="adm-card-body" style="padding: 14px 18px;">
    <form method="GET" action="/admin/media.php" style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
      <div style="flex: 1; min-width: 220px;">
        <input type="text" name="q" class="adm-input" placeholder="Dosya adı veya başlık ara..." value="<?= esc($search) ?>">
      </div>
      <div style="width: 160px;">
        <select name="type" class="adm-select" onchange="this.form.submit()">
          <option value="all" <?= $filterType === 'all' ? 'selected' : '' ?>>Tüm Dosyalar</option>
          <option value="image" <?= $filterType === 'image' ? 'selected' : '' ?>>Sadece Görseller</option>
          <option value="video" <?= $filterType === 'video' ? 'selected' : '' ?>>Videolar</option>
          <option value="pdf" <?= $filterType === 'pdf' ? 'selected' : '' ?>>PDF Belgeleri</option>
        </select>
      </div>
      <button type="submit" class="adm-btn adm-btn-secondary">Filtrele</button>
      <?php if (!empty($search) || $filterType !== 'all'): ?>
        <a href="/admin/media.php" class="adm-btn adm-btn-secondary" title="Sıfırla">Temizle</a>
      <?php endif; ?>
      <span style="margin-left: auto; font-size: 0.8125rem; color: var(--adm-text-dim);">Toplam <strong><?= $totalCount ?></strong> kayıt</span>
    </form>
  </div>
</div>

<!-- Medya Izgarası -->
<?php if (empty($mediaList)): ?>
  <div class="adm-card">
    <div class="adm-empty">
      <div class="adm-empty-icon">📁</div>
      <div class="adm-empty-title">Henüz medya dosyası yüklenmemiş</div>
      <p class="adm-empty-desc">Yukarıdaki "Dosya Yükle" butonunu kullanarak web sitenizde kullanacağınız görselleri yükleyebilirsiniz.</p>
    </div>
  </div>
<?php else: ?>
  <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px;">
    <?php foreach ($mediaList as $m): ?>
      <?php
        $isImage = str_starts_with($m['mime_type'], 'image/');
        $isVideo = str_starts_with($m['mime_type'], 'video/');
        $isPdf = $m['mime_type'] === 'application/pdf';
        $fullUrl = $m['file_path'];
      ?>
      <div class="adm-card" style="display: flex; flex-direction: column; overflow: hidden; position: relative;">
        <!-- Önizleme Alanı -->
        <div style="height: 150px; background: rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; overflow: hidden; border-bottom: 1px solid var(--adm-border);">
          <?php if ($isImage): ?>
            <img src="<?= esc($fullUrl) ?>" alt="<?= esc($m['original_name']) ?>" style="max-height: 100%; max-width: 100%; object-fit: contain;" loading="lazy">
          <?php elseif ($isVideo): ?>
            <div style="text-align: center; color: var(--adm-gold);">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              <div style="font-size: 0.75rem; margin-top: 4px;">Video</div>
            </div>
          <?php elseif ($isPdf): ?>
            <div style="text-align: center; color: var(--adm-danger);">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              <div style="font-size: 0.75rem; margin-top: 4px;">PDF Belgesi</div>
            </div>
          <?php else: ?>
            <div style="text-align: center; color: var(--adm-text-dim);">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
            </div>
          <?php endif; ?>
        </div>

        <!-- Bilgi Alanı -->
        <div style="padding: 12px; flex: 1; display: flex; flex-direction: column;">
          <div style="font-weight: 500; font-size: 0.8125rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--adm-text);" title="<?= esc($m['original_name']) ?>">
            <?= esc($m['original_name']) ?>
          </div>
          <div style="font-size: 0.6875rem; color: var(--adm-text-dim); margin-top: 4px; display: flex; justify-content: space-between;">
            <span><?= format_file_size_human((int)$m['file_size']) ?></span>
            <span><?= date('d.m.Y', strtotime($m['created_at'])) ?></span>
          </div>

          <div style="margin-top: 12px; display: flex; gap: 6px; padding-top: 8px; border-top: 1px solid var(--adm-border);">
            <button type="button" class="adm-btn adm-btn-secondary adm-btn-sm" style="flex: 1; justify-content: center;" onclick="copyMediaUrl('<?= esc($fullUrl) ?>', this)">
              URL Kopyala
            </button>
            <a href="<?= esc($fullUrl) ?>" target="_blank" rel="noopener" class="adm-btn adm-btn-secondary adm-btn-sm" title="Yeni Sekmede Aç" style="padding: 6px 8px;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/></svg>
            </a>
            <form method="POST" action="/admin/media.php" onsubmit="return confirm('Bu medya dosyasını silmek istediğinize emin misiniz? Sitedeki görseller bozulabilir.');" style="margin: 0;">
              <input type="hidden" name="csrf_token" value="<?= get_csrf_token() ?>">
              <input type="hidden" name="action" value="delete">
              <input type="hidden" name="id" value="<?= (int)$m['id'] ?>">
              <button type="submit" class="adm-btn adm-btn-danger adm-btn-sm" title="Sil" style="padding: 6px 8px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </form>
          </div>
        </div>
      </div>
    <?php endforeach; ?>
  </div>
<?php endif; ?>

<script>
function updateSelectedFiles(input) {
  const btn = document.getElementById('uploadSubmitBtn');
  const txt = document.getElementById('fileSelectionText');
  if (input.files && input.files.length > 0) {
    btn.disabled = false;
    txt.textContent = input.files.length + ' dosya seçildi.';
  } else {
    btn.disabled = true;
    txt.textContent = '';
  }
}

function copyMediaUrl(url, btn) {
  const full = window.location.origin + url;
  navigator.clipboard.writeText(full).then(() => {
    const originalText = btn.textContent;
    btn.textContent = 'Kopyalandı!';
    btn.style.color = 'var(--adm-gold)';
    setTimeout(() => {
      btn.textContent = originalText;
      btn.style.color = '';
    }, 2000);
  }).catch(() => {
    prompt('Dosya URL:', window.location.origin + url);
  });
}
</script>

<?php require_once __DIR__ . '/footer.php'; ?>
