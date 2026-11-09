<?php
/**
 * NİZAMLAR BASKI — BLOG YAZILARI YÖNETİMİ
 */

$pageTitle = 'Blog Yazıları';
require_once __DIR__ . '/header.php';

$success = null;
$error = null;

$action = $_GET['action'] ?? 'list';
$editId = (int)($_GET['id'] ?? 0);
$editItem = null;

if ($editId > 0) {
    $editItem = DB::fetch("SELECT * FROM `blog_posts` WHERE `id` = :id LIMIT 1", [':id' => $editId]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    if (!verify_csrf_token($_POST['csrf_token'] ?? '')) {
        $error = 'Güvenlik doğrulaması geçersiz.';
    } elseif ($_POST['action'] === 'save') {
        $id = (int)($_POST['id'] ?? 0);
        $title = clean_input($_POST['title'] ?? '', 255);
        $slug = slugify($_POST['slug'] ?? $title);
        $category = clean_input($_POST['category'] ?? 'Genel', 100);
        $author = clean_input($_POST['author'] ?? 'Nizamlar Baskı', 100);
        $readTime = clean_input($_POST['read_time'] ?? '5 Dakika', 50);
        $pubDate = clean_input($_POST['published_date'] ?? date('Y-m-d'), 20);
        $summary = clean_input($_POST['summary'] ?? '', 2000);
        $content = $_POST['content'] ?? '';
        $coverImage = clean_input($_POST['cover_image'] ?? '', 255);
        $sort = (int)($_POST['sort'] ?? 0);
        $status = clean_input($_POST['status'] ?? 'published', 20);

        if (empty($title)) {
            $error = 'Blog başlığı zorunludur.';
        } elseif (empty($slug)) {
            $error = 'Geçerli bir slug üretilemedi.';
        } else {
            try {
                if ($id > 0) {
                    $old = DB::fetch("SELECT `slug`, `old_slugs` FROM `blog_posts` WHERE `id` = :id", [':id' => $id]);
                    $oldSlugs = json_decode((string)($old['old_slugs'] ?? '[]'), true) ?: [];
                    if ($old && $old['slug'] !== $slug && !in_array($old['slug'], $oldSlugs, true)) {
                        $oldSlugs[] = $old['slug'];
                    }

                    DB::execute("
                        UPDATE `blog_posts` SET
                            `title` = :title,
                            `slug` = :slug,
                            `category` = :cat,
                            `author` = :author,
                            `read_time` = :read_time,
                            `published_date` = :pub_date,
                            `summary` = :summary,
                            `content` = :content,
                            `cover_image` = :cover,
                            `old_slugs` = :old_slugs,
                            `sort` = :sort,
                            `status` = :status,
                            `updated_at` = NOW()
                        WHERE `id` = :id
                    ", [
                        ':title'     => $title,
                        ':slug'      => $slug,
                        ':cat'       => $category,
                        ':author'    => $author,
                        ':read_time' => $readTime,
                        ':pub_date'  => $pubDate,
                        ':summary'   => $summary,
                        ':content'   => $content,
                        ':cover'     => $coverImage,
                        ':old_slugs' => json_encode($oldSlugs, JSON_UNESCAPED_UNICODE),
                        ':sort'      => $sort,
                        ':status'    => $status,
                        ':id'        => $id
                    ]);
                    $success = "Blog yazısı (#{$id}) güncellendi.";
                } else {
                    DB::execute("
                        INSERT INTO `blog_posts` (
                            `title`, `slug`, `category`, `author`, `read_time`,
                            `published_date`, `summary`, `content`, `cover_image`,
                            `sort`, `status`, `updated_at`
                        ) VALUES (
                            :title, :slug, :cat, :author, :read_time,
                            :pub_date, :summary, :content, :cover,
                            :sort, :status, NOW()
                        )
                    ", [
                        ':title'     => $title,
                        ':slug'      => $slug,
                        ':cat'       => $category,
                        ':author'    => $author,
                        ':read_time' => $readTime,
                        ':pub_date'  => $pubDate,
                        ':summary'   => $summary,
                        ':content'   => $content,
                        ':cover'     => $coverImage,
                        ':sort'      => $sort,
                        ':status'    => $status
                    ]);
                    $success = "Yeni blog yazısı eklendi.";
                }
                $action = 'list';
            } catch (Exception $e) {
                $error = "Veritabanı hatası: " . $e->getMessage();
            }
        }
    } elseif ($_POST['action'] === 'delete') {
        $delId = (int)$_POST['id'];
        DB::execute("DELETE FROM `blog_posts` WHERE `id` = :id", [':id' => $delId]);
        $success = "Blog yazısı silindi.";
    }
}

$posts = DB::fetchAll("SELECT * FROM `blog_posts` ORDER BY `published_date` DESC, `id` DESC");
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
      'id' => 0, 'title' => '', 'slug' => '', 'category' => 'Teknik Rehber',
      'author' => 'Nizamlar Baskı', 'read_time' => '5 Dakika', 'published_date' => date('Y-m-d'),
      'summary' => '', 'content' => '', 'cover_image' => '', 'sort' => 0, 'status' => 'published'
    ];
  ?>
  <div class="adm-card">
    <div class="adm-card-header">
      <div class="adm-card-title"><?= $item['id'] ? 'Blog Yazısını Düzenle: ' . esc($item['title']) : 'Yeni Blog Yazısı Ekle' ?></div>
      <a href="/admin/blog.php" class="adm-btn adm-btn-secondary adm-btn-sm">← Listeye Dön</a>
    </div>

    <form method="POST" action="">
      <input type="hidden" name="csrf_token" value="<?= csrf_token() ?>">
      <input type="hidden" name="action" value="save">
      <input type="hidden" name="id" value="<?= $item['id'] ?>">

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;">
        <div>
          <div class="adm-form-group">
            <label class="adm-label" for="title">Yazı Başlığı *</label>
            <input type="text" id="title" name="title" class="adm-input" placeholder="Örn: DTF Baskı ve Serigrafi Karşılaştırması" required value="<?= esc($item['title']) ?>">
          </div>

          <div class="adm-form-group">
            <label class="adm-label" for="slug">URL Slug <small>(Boş bırakılırsa başlıktan üretilir)</small></label>
            <input type="text" id="slug" name="slug" class="adm-input" value="<?= esc($item['slug']) ?>">
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div class="adm-form-group">
              <label class="adm-label" for="category">Kategori</label>
              <input type="text" id="category" name="category" class="adm-input" value="<?= esc($item['category']) ?>">
            </div>
            <div class="adm-form-group">
              <label class="adm-label" for="author">Yazar</label>
              <input type="text" id="author" name="author" class="adm-input" value="<?= esc($item['author']) ?>">
            </div>
          </div>

          <div class="adm-form-group">
            <label class="adm-label" for="summary">Özet (Giriş Metni)</label>
            <textarea id="summary" name="summary" class="adm-textarea" style="min-height: 90px;"><?= esc($item['summary']) ?></textarea>
          </div>
        </div>

        <div>
          <div class="adm-form-group">
            <label class="adm-label" for="cover_image">Kapak Görseli Yolu</label>
            <input type="text" id="cover_image" name="cover_image" class="adm-input" placeholder="assets/images/certs/... veya /uploads/..." value="<?= esc($item['cover_image']) ?>">
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div class="adm-form-group">
              <label class="adm-label" for="published_date">Yayın Tarihi</label>
              <input type="date" id="published_date" name="published_date" class="adm-input" value="<?= esc($item['published_date']) ?>">
            </div>
            <div class="adm-form-group">
              <label class="adm-label" for="read_time">Okuma Süresi</label>
              <input type="text" id="read_time" name="read_time" class="adm-input" placeholder="Örn: 5 Dakika" value="<?= esc($item['read_time']) ?>">
            </div>
          </div>

          <div class="adm-form-group">
            <label class="adm-label" for="content">Makale İçeriği (HTML)</label>
            <textarea id="content" name="content" class="adm-textarea" style="min-height: 180px;" placeholder="<p>Makale paragrafları...</p>"><?= esc($item['content']) ?></textarea>
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

      <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--adm-border); display: flex; gap: 12px; justify-content: flex-end;">
        <a href="/admin/blog.php" class="adm-btn adm-btn-secondary">İptal</a>
        <button type="submit" class="adm-btn adm-btn-gold">Makaleyi Kaydet</button>
      </div>
    </form>
  </div>
<?php else: ?>
  <!-- LİSTE -->
  <div class="adm-card">
    <div class="adm-card-header">
      <div class="adm-card-title">Blog Yazıları (Toplam: <?= count($posts) ?>)</div>
      <a href="/admin/blog.php?action=new" class="adm-btn adm-btn-gold adm-btn-sm">+ Yeni Yazı Ekle</a>
    </div>

    <div class="adm-table-wrap">
      <table class="adm-table">
        <thead>
          <tr>
            <th>Başlık</th>
            <th>Slug / URL</th>
            <th>Kategori</th>
            <th>Yazar / Tarih</th>
            <th>Durum</th>
            <th style="text-align: right;">İşlemler</th>
          </tr>
        </thead>
        <tbody>
          <?php if (empty($posts)): ?>
            <tr><td colspan="6" style="text-align: center; padding: 24px; color: var(--adm-text-dim);">Henüz blog yazısı eklenmemiş.</td></tr>
          <?php else: ?>
            <?php foreach ($posts as $p): ?>
              <tr>
                <td>
                  <strong><?= esc($p['title']) ?></strong>
                </td>
                <td>
                  <code style="font-family: var(--adm-font-mono); color: var(--adm-gold); font-size: 12px;">/blog/<?= esc($p['slug']) ?>/</code>
                </td>
                <td>
                  <span class="adm-badge adm-badge-gold"><?= esc($p['category']) ?></span>
                </td>
                <td>
                  <div style="font-size: 12px;"><?= esc($p['author']) ?></div>
                  <div style="font-size: 11px; color: var(--adm-text-dim);"><?= date('d.m.Y', strtotime($p['published_date'])) ?></div>
                </td>
                <td>
                  <span class="adm-pill <?= $p['status'] === 'published' ? 'adm-pill-published' : 'adm-pill-draft' ?>">
                    <?= $p['status'] === 'published' ? 'Yayında' : 'Taslak' ?>
                  </span>
                </td>
                <td style="text-align: right; white-space: nowrap;">
                  <a href="/blog/<?= esc($p['slug']) ?>/" target="_blank" rel="noopener" class="adm-btn adm-btn-secondary adm-btn-sm" title="Sitede Gör">↗</a>
                  <a href="/admin/blog.php?action=edit&id=<?= $p['id'] ?>" class="adm-btn adm-btn-gold adm-btn-sm">Düzenle</a>
                  <form method="POST" action="" style="display: inline-block;" onsubmit="return confirm('Bu blog yazısını silmek istediğinize emin misiniz?');">
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
