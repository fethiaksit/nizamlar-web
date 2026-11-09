<?php
/**
 * NİZAMLAR BASKI — SİTE VE SİSTEM AYARLARI
 * Site Genel Bilgileri, WhatsApp, Mockup Stüdyo ve SMTP Yapılandırması
 */

$pageTitle = 'Site Ayarları';
require_once __DIR__ . '/header.php';

$success = null;
$error = null;
$activeTab = clean_input($_GET['tab'] ?? 'site', 20);

// Mevcut ayarları çek
$site = DB::fetch("SELECT * FROM `site_settings` WHERE `id` = 1 LIMIT 1") ?: [];
$whatsapp = DB::fetch("SELECT * FROM `whatsapp_settings` WHERE `id` = 1 LIMIT 1") ?: [];
$mockup = DB::fetch("SELECT * FROM `mockup_preview_settings` WHERE `id` = 1 LIMIT 1") ?: [];
$smtp = DB::fetch("SELECT * FROM `smtp_settings` WHERE `id` = 1 LIMIT 1") ?: [];

// POST İşlemleri
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    if (!verify_csrf_token($_POST['csrf_token'] ?? '')) {
        $error = 'Güvenlik doğrulaması geçersiz. Lütfen sayfayı yenileyip tekrar deneyin.';
    } elseif ($_POST['action'] === 'save_site') {
        $activeTab = 'site';
        $siteName = clean_input($_POST['site_name'] ?? '', 255);
        $tagline = clean_input($_POST['tagline'] ?? '', 255);
        $legalName = clean_input($_POST['company_legal_name'] ?? '', 255);
        $phone = clean_input($_POST['contact_phone'] ?? '', 100);
        $phoneRaw = clean_input($_POST['contact_phone_raw'] ?? '', 50);
        $email = clean_input($_POST['contact_email'] ?? '', 150);
        $hours = clean_input($_POST['working_hours'] ?? '', 150);
        $address = clean_input($_POST['contact_address'] ?? '', 2000);
        $insta = clean_input($_POST['instagram_url'] ?? '', 255);
        $linkedin = clean_input($_POST['linkedin_url'] ?? '', 255);
        $fb = clean_input($_POST['facebook_url'] ?? '', 255);
        $yt = clean_input($_POST['youtube_url'] ?? '', 255);

        try {
            DB::execute("
                UPDATE `site_settings` SET
                    `site_name` = :sn, `tagline` = :tg, `company_legal_name` = :cl,
                    `contact_phone` = :ph, `contact_phone_raw` = :pr, `contact_email` = :em,
                    `working_hours` = :wh, `contact_address` = :addr,
                    `instagram_url` = :in, `linkedin_url` = :li, `facebook_url` = :fb, `youtube_url` = :yt
                WHERE `id` = 1
            ", [
                ':sn' => $siteName, ':tg' => $tagline, ':cl' => $legalName,
                ':ph' => $phone, ':pr' => $phoneRaw, ':em' => $email,
                ':wh' => $hours, ':addr' => $address,
                ':in' => $insta, ':li' => $linkedin, ':fb' => $fb, ':yt' => $yt
            ]);
            $success = 'Site genel ayarları başarıyla güncellendi.';
            $site = DB::fetch("SELECT * FROM `site_settings` WHERE `id` = 1 LIMIT 1");
        } catch (Throwable $e) {
            $error = 'Ayarlar kaydedilemedi: ' . $e->getMessage();
        }

    } elseif ($_POST['action'] === 'save_whatsapp') {
        $activeTab = 'whatsapp';
        $number = clean_input($_POST['whatsapp_number'] ?? '', 50);
        $isActive = isset($_POST['is_active']) ? 1 : 0;
        $btnText = clean_input($_POST['button_text'] ?? '', 255);
        $floating = isset($_POST['floating_button_active']) ? 1 : 0;
        $defMsg = clean_input($_POST['default_message'] ?? '', 2000);
        $agent = clean_input($_POST['agent_name'] ?? '', 100);
        $pages = clean_input($_POST['display_pages'] ?? 'all', 100);

        try {
            DB::execute("
                UPDATE `whatsapp_settings` SET
                    `whatsapp_number` = :wn, `is_active` = :ia, `button_text` = :bt,
                    `floating_button_active` = :fl, `default_message` = :dm,
                    `agent_name` = :ag, `display_pages` = :dp
                WHERE `id` = 1
            ", [
                ':wn' => $number, ':ia' => $isActive, ':bt' => $btnText,
                ':fl' => $floating, ':dm' => $defMsg, ':ag' => $agent, ':dp' => $pages
            ]);
            $success = 'WhatsApp entegrasyon ayarları güncellendi.';
            $whatsapp = DB::fetch("SELECT * FROM `whatsapp_settings` WHERE `id` = 1 LIMIT 1");
        } catch (Throwable $e) {
            $error = 'WhatsApp ayarları kaydedilemedi: ' . $e->getMessage();
        }

    } elseif ($_POST['action'] === 'save_mockup') {
        $activeTab = 'mockup';
        $isActive = isset($_POST['is_active']) ? 1 : 0;
        $secTag = clean_input($_POST['section_tag'] ?? '', 100);
        $secTitle = clean_input($_POST['section_title'] ?? '', 255);
        $secDesc = clean_input($_POST['section_desc'] ?? '', 2000);
        $fileTypes = clean_input($_POST['allowed_file_types'] ?? 'PNG, JPG, JPEG, WEBP, SVG', 255);
        $maxMb = (int)($_POST['max_file_size_mb'] ?? 25);
        $defProduct = clean_input($_POST['default_product'] ?? 'tisort', 50);

        try {
            DB::execute("
                UPDATE `mockup_preview_settings` SET
                    `is_active` = :ia, `section_tag` = :st, `section_title` = :tl,
                    `section_desc` = :sd, `allowed_file_types` = :ft,
                    `max_file_size_mb` = :mb, `default_product` = :dp
                WHERE `id` = 1
            ", [
                ':ia' => $isActive, ':st' => $secTag, ':tl' => $secTitle,
                ':sd' => $secDesc, ':ft' => $fileTypes, ':mb' => $maxMb, ':dp' => $defProduct
            ]);
            $success = 'Mockup canlı stüdyo ayarları güncellendi.';
            $mockup = DB::fetch("SELECT * FROM `mockup_preview_settings` WHERE `id` = 1 LIMIT 1");
        } catch (Throwable $e) {
            $error = 'Mockup ayarları kaydedilemedi: ' . $e->getMessage();
        }

    } elseif ($_POST['action'] === 'save_smtp') {
        $activeTab = 'smtp';
        $isActive = isset($_POST['is_active']) ? 1 : 0;
        $host = clean_input($_POST['host'] ?? '', 255);
        $port = (int)($_POST['port'] ?? 587);
        $encryption = clean_input($_POST['encryption'] ?? 'tls', 20);
        $username = clean_input($_POST['username'] ?? '', 255);
        $fromEmail = clean_input($_POST['from_email'] ?? '', 255);
        $fromName = clean_input($_POST['from_name'] ?? '', 255);
        $notifEmail = clean_input($_POST['notification_email'] ?? '', 255);
        $newPass = trim($_POST['password'] ?? '');

        try {
            if (!empty($newPass)) {
                DB::execute("
                    UPDATE `smtp_settings` SET
                        `is_active` = :ia, `host` = :h, `port` = :p, `encryption` = :enc,
                        `username` = :u, `password` = :pw, `from_email` = :fe,
                        `from_name` = :fn, `notification_email` = :ne
                    WHERE `id` = 1
                ", [
                    ':ia' => $isActive, ':h' => $host, ':p' => $port, ':enc' => $encryption,
                    ':u' => $username, ':pw' => $newPass, ':fe' => $fromEmail,
                    ':fn' => $fromName, ':ne' => $notifEmail
                ]);
            } else {
                DB::execute("
                    UPDATE `smtp_settings` SET
                        `is_active` = :ia, `host` = :h, `port` = :p, `encryption` = :enc,
                        `username` = :u, `from_email` = :fe,
                        `from_name` = :fn, `notification_email` = :ne
                    WHERE `id` = 1
                ", [
                    ':ia' => $isActive, ':h' => $host, ':p' => $port, ':enc' => $encryption,
                    ':u' => $username, ':fe' => $fromEmail,
                    ':fn' => $fromName, ':ne' => $notifEmail
                ]);
            }
            $success = 'SMTP e-posta ayarları kaydedildi.';
            $smtp = DB::fetch("SELECT * FROM `smtp_settings` WHERE `id` = 1 LIMIT 1");
        } catch (Throwable $e) {
            $error = 'SMTP ayarları kaydedilemedi: ' . $e->getMessage();
        }

    } elseif ($_POST['action'] === 'test_smtp') {
        $activeTab = 'smtp';
        $testTarget = clean_input($_POST['test_email'] ?? $smtp['notification_email'], 255);
        if (empty($testTarget) || !filter_var($testTarget, FILTER_VALIDATE_EMAIL)) {
            $error = 'Geçerli bir test e-posta adresi giriniz.';
        } else {
            $subject = 'Nizamlar Baskı — SMTP Yapılandırma Testi';
            $body = "<h2>SMTP Bağlantı Testi Başarılı!</h2>\n" .
                    "<p>Bu mesaj <strong>Nizamlar Baskı</strong> yönetim panelinden SMTP ayarlarınızı doğrulamak amacıyla gönderilmiştir.</p>\n" .
                    "<ul>\n" .
                    "  <li><strong>Tarih:</strong> " . date('d.m.Y H:i:s') . "</li>\n" .
                    "  <li><strong>Sunucu:</strong> " . esc($smtp['host'] ?? 'Bilinmiyor') . ":" . (int)($smtp['port'] ?? 0) . "</li>\n" .
                    "  <li><strong>Gönderen:</strong> " . esc($smtp['from_email'] ?? '') . "</li>\n" .
                    "</ul>\n" .
                    "<p>Yeni teklif ve iletişim talepleri bu adrese başarıyla iletilecektir.</p>";

            $result = send_mail($testTarget, $subject, $body);
            if ($result) {
                $success = "Test e-postası başarıyla '{$testTarget}' adresine gönderildi. Lütfen gelen kutunuzu (ve spam klasörünü) kontrol edin.";
            } else {
                $error = "Test e-postası gönderilemedi. Sunucu adı, port, SSL/TLS modu veya şifrenizi kontrol edin.";
            }
        }
    }
}
?>

<div class="adm-header">
  <div>
    <h1 class="adm-title">Site ve Sistem Ayarları</h1>
    <p class="adm-subtitle">Genel iletişim bilgileri, WhatsApp, Mockup Stüdyo ve SMTP bildirimlerini yapılandırın.</p>
  </div>
</div>

<?php if ($success): ?>
  <div class="adm-alert adm-alert-success"><?= esc($success) ?></div>
<?php endif; ?>

<?php if ($error): ?>
  <div class="adm-alert adm-alert-danger"><?= esc($error) ?></div>
<?php endif; ?>

<!-- Sekmeler (Tabs) -->
<div style="display: flex; gap: 8px; border-bottom: 1px solid var(--adm-border); margin-bottom: 24px; overflow-x: auto; padding-bottom: 2px;">
  <a href="/admin/settings.php?tab=site" class="adm-btn <?= $activeTab === 'site' ? 'adm-btn-primary' : 'adm-btn-secondary' ?>" style="white-space: nowrap;">
    Genel & İletişim
  </a>
  <a href="/admin/settings.php?tab=whatsapp" class="adm-btn <?= $activeTab === 'whatsapp' ? 'adm-btn-primary' : 'adm-btn-secondary' ?>" style="white-space: nowrap;">
    WhatsApp Entegrasyonu
  </a>
  <a href="/admin/settings.php?tab=mockup" class="adm-btn <?= $activeTab === 'mockup' ? 'adm-btn-primary' : 'adm-btn-secondary' ?>" style="white-space: nowrap;">
    Canlı Mockup Stüdyo
  </a>
  <a href="/admin/settings.php?tab=smtp" class="adm-btn <?= $activeTab === 'smtp' ? 'adm-btn-primary' : 'adm-btn-secondary' ?>" style="white-space: nowrap;">
    SMTP & E-posta Bildirimleri
  </a>
</div>

<!-- ========================================================================= -->
<!-- SEKME 1: SİTE GENEL & İLETİŞİM                                            -->
<!-- ========================================================================= -->
<?php if ($activeTab === 'site'): ?>
  <div class="adm-card">
    <div class="adm-card-header">
      <h2 class="adm-card-title">Kurumsal ve İletişim Bilgileri</h2>
    </div>
    <div class="adm-card-body">
      <form method="POST" action="/admin/settings.php?tab=site">
        <input type="hidden" name="csrf_token" value="<?= get_csrf_token() ?>">
        <input type="hidden" name="action" value="save_site">

        <div class="adm-grid adm-grid-2">
          <div class="adm-form-group">
            <label class="adm-label">Site / Marka Adı</label>
            <input type="text" name="site_name" class="adm-input" value="<?= esc($site['site_name'] ?? 'Nizamlar Baskı') ?>" required>
          </div>
          <div class="adm-form-group">
            <label class="adm-label">Slogan (Tagline)</label>
            <input type="text" name="tagline" class="adm-input" value="<?= esc($site['tagline'] ?? '') ?>">
          </div>
        </div>

        <div class="adm-form-group">
          <label class="adm-label">Şirket Resmi Ünvanı</label>
          <input type="text" name="company_legal_name" class="adm-input" value="<?= esc($site['company_legal_name'] ?? '') ?>">
        </div>

        <div class="adm-grid adm-grid-3">
          <div class="adm-form-group">
            <label class="adm-label">Görünen Telefon Numarası</label>
            <input type="text" name="contact_phone" class="adm-input" value="<?= esc($site['contact_phone'] ?? '') ?>">
            <span style="font-size: 0.75rem; color: var(--adm-text-dim);">Örnek: +90 (212) 000 00 00</span>
          </div>
          <div class="adm-form-group">
            <label class="adm-label">Ham Telefon (Tıklanabilir Tel Bağlantısı)</label>
            <input type="text" name="contact_phone_raw" class="adm-input" value="<?= esc($site['contact_phone_raw'] ?? '') ?>">
            <span style="font-size: 0.75rem; color: var(--adm-text-dim);">Örnek: +902120000000 (boşluksuz)</span>
          </div>
          <div class="adm-form-group">
            <label class="adm-label">İletişim E-posta Adresi</label>
            <input type="email" name="contact_email" class="adm-input" value="<?= esc($site['contact_email'] ?? '') ?>" required>
          </div>
        </div>

        <div class="adm-grid adm-grid-2">
          <div class="adm-form-group">
            <label class="adm-label">Çalışma Saatleri</label>
            <input type="text" name="working_hours" class="adm-input" value="<?= esc($site['working_hours'] ?? 'Hafta İçi: 08:30 - 18:30') ?>">
          </div>
          <div class="adm-form-group">
            <label class="adm-label">Fiziksel Adres</label>
            <textarea name="contact_address" class="adm-textarea" rows="2"><?= esc($site['contact_address'] ?? '') ?></textarea>
          </div>
        </div>

        <h3 style="font-size: 1rem; color: var(--adm-gold); margin: 24px 0 16px 0; border-top: 1px solid var(--adm-border); padding-top: 20px;">
          Sosyal Medya Bağlantıları
        </h3>

        <div class="adm-grid adm-grid-2">
          <div class="adm-form-group">
            <label class="adm-label">Instagram URL</label>
            <input type="url" name="instagram_url" class="adm-input" value="<?= esc($site['instagram_url'] ?? '') ?>" placeholder="https://instagram.com/nizamlarbaski">
          </div>
          <div class="adm-form-group">
            <label class="adm-label">LinkedIn URL</label>
            <input type="url" name="linkedin_url" class="adm-input" value="<?= esc($site['linkedin_url'] ?? '') ?>" placeholder="https://linkedin.com/company/nizamlarbaski">
          </div>
          <div class="adm-form-group">
            <label class="adm-label">Facebook URL</label>
            <input type="url" name="facebook_url" class="adm-input" value="<?= esc($site['facebook_url'] ?? '') ?>" placeholder="https://facebook.com/nizamlarbaski">
          </div>
          <div class="adm-form-group">
            <label class="adm-label">YouTube URL</label>
            <input type="url" name="youtube_url" class="adm-input" value="<?= esc($site['youtube_url'] ?? '') ?>" placeholder="https://youtube.com/@nizamlarbaski">
          </div>
        </div>

        <div style="margin-top: 24px; display: flex; justify-content: flex-end;">
          <button type="submit" class="adm-btn adm-btn-primary">
            Bilgileri Kaydet
          </button>
        </div>
      </form>
    </div>
  </div>
<?php endif; ?>

<!-- ========================================================================= -->
<!-- SEKME 2: WHATSAPP AYARLARI                                               -->
<!-- ========================================================================= -->
<?php if ($activeTab === 'whatsapp'): ?>
  <div class="adm-card">
    <div class="adm-card-header">
      <h2 class="adm-card-title">WhatsApp Entegrasyonu</h2>
    </div>
    <div class="adm-card-body">
      <form method="POST" action="/admin/settings.php?tab=whatsapp">
        <input type="hidden" name="csrf_token" value="<?= get_csrf_token() ?>">
        <input type="hidden" name="action" value="save_whatsapp">

        <div class="adm-grid adm-grid-2">
          <div class="adm-form-group">
            <label class="adm-label">WhatsApp Numarası</label>
            <input type="text" name="whatsapp_number" class="adm-input" value="<?= esc($whatsapp['whatsapp_number'] ?? '+90 532 000 00 00') ?>" required>
            <span style="font-size: 0.75rem; color: var(--adm-text-dim);">Örnek: +90 532 000 00 00</span>
          </div>
          <div class="adm-form-group">
            <label class="adm-label">Temsilci / Danışman İsmi</label>
            <input type="text" name="agent_name" class="adm-input" value="<?= esc($whatsapp['agent_name'] ?? 'Nizamlar Müşteri Danışmanı') ?>">
          </div>
        </div>

        <div class="adm-form-group">
          <label class="adm-label">Buton Metni</label>
          <input type="text" name="button_text" class="adm-input" value="<?= esc($whatsapp['button_text'] ?? 'WhatsApp ile Hızlı Teklif Al') ?>">
        </div>

        <div class="adm-form-group">
          <label class="adm-label">Varsayılan Hazır Mesaj</label>
          <textarea name="default_message" class="adm-textarea" rows="3"><?= esc($whatsapp['default_message'] ?? '') ?></textarea>
          <span style="font-size: 0.75rem; color: var(--adm-text-dim);">Kullanıcı butona tıkladığında WhatsApp sohbet penceresinde hazır gelecek mesaj.</span>
        </div>

        <div class="adm-grid adm-grid-2" style="margin-top: 16px;">
          <div class="adm-form-group">
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; color: var(--adm-text);">
              <input type="checkbox" name="is_active" value="1" <?= !empty($whatsapp['is_active']) ? 'checked' : '' ?>>
              <strong>WhatsApp Entegrasyonunu Etkinleştir</strong>
            </label>
          </div>
          <div class="adm-form-group">
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; color: var(--adm-text);">
              <input type="checkbox" name="floating_button_active" value="1" <?= !empty($whatsapp['floating_button_active']) ? 'checked' : '' ?>>
              <strong>Sağ Altta Sabit Kayan Buton Göster</strong>
            </label>
          </div>
        </div>

        <div style="margin-top: 24px; display: flex; justify-content: flex-end;">
          <button type="submit" class="adm-btn adm-btn-primary">
            WhatsApp Ayarlarını Kaydet
          </button>
        </div>
      </form>
    </div>
  </div>
<?php endif; ?>

<!-- ========================================================================= -->
<!-- SEKME 3: CANLI MOCKUP STÜDYO                                             -->
<!-- ========================================================================= -->
<?php if ($activeTab === 'mockup'): ?>
  <div class="adm-card">
    <div class="adm-card-header">
      <h2 class="adm-card-title">Canlı Mockup Stüdyo Yapılandırması</h2>
    </div>
    <div class="adm-card-body">
      <form method="POST" action="/admin/settings.php?tab=mockup">
        <input type="hidden" name="csrf_token" value="<?= get_csrf_token() ?>">
        <input type="hidden" name="action" value="save_mockup">

        <div class="adm-form-group">
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; color: var(--adm-text);">
            <input type="checkbox" name="is_active" value="1" <?= !empty($mockup['is_active']) ? 'checked' : '' ?>>
            <strong>Mockup Stüdyosunu Ana Sayfada Göster</strong>
          </label>
        </div>

        <div class="adm-grid adm-grid-2">
          <div class="adm-form-group">
            <label class="adm-label">Bölüm Etiketi (Section Tag)</label>
            <input type="text" name="section_tag" class="adm-input" value="<?= esc($mockup['section_tag'] ?? 'İnteraktif Stüdyo') ?>">
          </div>
          <div class="adm-form-group">
            <label class="adm-label">Bölüm Başlığı</label>
            <input type="text" name="section_title" class="adm-input" value="<?= esc($mockup['section_title'] ?? 'Tasarımını Yükle, Baskını Canlı Önizle') ?>">
          </div>
        </div>

        <div class="adm-form-group">
          <label class="adm-label">Bölüm Açıklaması</label>
          <textarea name="section_desc" class="adm-textarea" rows="3"><?= esc($mockup['section_desc'] ?? '') ?></textarea>
        </div>

        <div class="adm-grid adm-grid-3">
          <div class="adm-form-group">
            <label class="adm-label">İzin Verilen Dosya Türleri</label>
            <input type="text" name="allowed_file_types" class="adm-input" value="<?= esc($mockup['allowed_file_types'] ?? 'PNG, JPG, JPEG, WEBP, SVG') ?>">
          </div>
          <div class="adm-form-group">
            <label class="adm-label">Maksimum Dosya Boyutu (MB)</label>
            <input type="number" name="max_file_size_mb" class="adm-input" value="<?= (int)($mockup['max_file_size_mb'] ?? 25) ?>" min="1" max="100">
          </div>
          <div class="adm-form-group">
            <label class="adm-label">Varsayılan Ürün</label>
            <select name="default_product" class="adm-select">
              <option value="tisort" <?= ($mockup['default_product'] ?? '') === 'tisort' ? 'selected' : '' ?>>Tişört (Oversize T-Shirt)</option>
              <option value="sweatshirt" <?= ($mockup['default_product'] ?? '') === 'sweatshirt' ? 'selected' : '' ?>>Sweatshirt (Crewneck)</option>
              <option value="hoodie" <?= ($mockup['default_product'] ?? '') === 'hoodie' ? 'selected' : '' ?>>Kapüşonlu Hoodie</option>
              <option value="bez-canta" <?= ($mockup['default_product'] ?? '') === 'bez-canta' ? 'selected' : '' ?>>Bez Çanta (Tote Bag)</option>
            </select>
          </div>
        </div>

        <div style="margin-top: 24px; display: flex; justify-content: flex-end;">
          <button type="submit" class="adm-btn adm-btn-primary">
            Stüdyo Ayarlarını Kaydet
          </button>
        </div>
      </form>
    </div>
  </div>
<?php endif; ?>

<!-- ========================================================================= -->
<!-- SEKME 4: SMTP & E-POSTA BİLDİRİMLERİ                                     -->
<!-- ========================================================================= -->
<?php if ($activeTab === 'smtp'): ?>
  <div class="adm-grid adm-grid-2">
    <!-- Yapılandırma Kartı -->
    <div class="adm-card">
      <div class="adm-card-header">
        <h2 class="adm-card-title">SMTP Sunucu Yapılandırması</h2>
      </div>
      <div class="adm-card-body">
        <form method="POST" action="/admin/settings.php?tab=smtp">
          <input type="hidden" name="csrf_token" value="<?= get_csrf_token() ?>">
          <input type="hidden" name="action" value="save_smtp">

          <div class="adm-form-group">
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; color: var(--adm-text);">
              <input type="checkbox" name="is_active" value="1" <?= !empty($smtp['is_active']) ? 'checked' : '' ?>>
              <strong>SMTP ile E-posta Gönderimini Aktifleştir</strong>
            </label>
            <span style="font-size: 0.75rem; color: var(--adm-text-dim); display: block; margin-top: 4px;">
              İşaretli değilse cPanel varsayılan <code>mail()</code> fonksiyonu denenir veya bildirimler sıraya alınır.
            </span>
          </div>

          <div class="adm-grid adm-grid-2">
            <div class="adm-form-group">
              <label class="adm-label">SMTP Sunucu Adresi (Host)</label>
              <input type="text" name="host" class="adm-input" value="<?= esc($smtp['host'] ?? 'mail.nizamlarbaski.com') ?>" placeholder="mail.nizamlarbaski.com" required>
            </div>
            <div class="adm-form-group">
              <label class="adm-label">Port</label>
              <input type="number" name="port" class="adm-input" value="<?= (int)($smtp['port'] ?? 587) ?>" placeholder="587" required>
            </div>
          </div>

          <div class="adm-grid adm-grid-2">
            <div class="adm-form-group">
              <label class="adm-label">Şifreleme Türü</label>
              <select name="encryption" class="adm-select">
                <option value="tls" <?= ($smtp['encryption'] ?? 'tls') === 'tls' ? 'selected' : '' ?>>TLS / STARTTLS (Port 587)</option>
                <option value="ssl" <?= ($smtp['encryption'] ?? '') === 'ssl' ? 'selected' : '' ?>>SSL / SMTPS (Port 465)</option>
                <option value="none" <?= ($smtp['encryption'] ?? '') === 'none' ? 'selected' : '' ?>>Düz / Şifresiz (Port 25)</option>
              </select>
            </div>
            <div class="adm-form-group">
              <label class="adm-label">Kullanıcı Adı (E-posta)</label>
              <input type="text" name="username" class="adm-input" value="<?= esc($smtp['username'] ?? '') ?>" placeholder="info@nizamlarbaski.com">
            </div>
          </div>

          <div class="adm-form-group">
            <label class="adm-label">SMTP Şifresi</label>
            <input type="password" name="password" class="adm-input" placeholder="Değiştirmek istemiyorsanız boş bırakın">
            <span style="font-size: 0.75rem; color: var(--adm-text-dim);">
              Mevcut şifre: <?= !empty($smtp['password']) ? '••••••••' : '<span style="color:var(--adm-warning);">Tanımlanmamış</span>' ?>
            </span>
          </div>

          <div class="adm-grid adm-grid-2">
            <div class="adm-form-group">
              <label class="adm-label">Gönderen E-posta (From Email)</label>
              <input type="email" name="from_email" class="adm-input" value="<?= esc($smtp['from_email'] ?? 'info@nizamlarbaski.com') ?>" required>
            </div>
            <div class="adm-form-group">
              <label class="adm-label">Gönderen Adı (From Name)</label>
              <input type="text" name="from_name" class="adm-input" value="<?= esc($smtp['from_name'] ?? 'Nizamlar Baskı') ?>">
            </div>
          </div>

          <div class="adm-form-group">
            <label class="adm-label">Bildirim Alacak E-posta (Admin Alıcısı)</label>
            <input type="email" name="notification_email" class="adm-input" value="<?= esc($smtp['notification_email'] ?? 'nizamlartekstill@gmail.com') ?>" required>
            <span style="font-size: 0.75rem; color: var(--adm-text-dim);">Siteden gelen teklif ve iletişim talepleri anında bu adrese iletilir.</span>
          </div>

          <div style="margin-top: 24px; display: flex; justify-content: flex-end;">
            <button type="submit" class="adm-btn adm-btn-primary">
              SMTP Ayarlarını Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Test Kartı & Bilgilendirme -->
    <div style="display: flex; flex-direction: column; gap: 20px;">
      <div class="adm-card">
        <div class="adm-card-header">
          <h2 class="adm-card-title">SMTP Bağlantı Testi</h2>
        </div>
        <div class="adm-card-body">
          <p style="font-size: 0.875rem; color: var(--adm-text-muted); margin-bottom: 16px;">
            Aşağıdaki butona tıklayarak SMTP yapılandırmanızın doğru çalışıp çalışmadığını hemen test edebilirsiniz.
          </p>

          <form method="POST" action="/admin/settings.php?tab=smtp">
            <input type="hidden" name="csrf_token" value="<?= get_csrf_token() ?>">
            <input type="hidden" name="action" value="test_smtp">

            <div class="adm-form-group">
              <label class="adm-label">Test E-postası Gönderilecek Adres</label>
              <input type="email" name="test_email" class="adm-input" value="<?= esc($smtp['notification_email'] ?? 'nizamlartekstill@gmail.com') ?>" required>
            </div>

            <button type="submit" class="adm-btn adm-btn-secondary" style="width: 100%; justify-content: center;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
              Test E-postası Gönder
            </button>
          </form>
        </div>
      </div>

      <div class="adm-card">
        <div class="adm-card-header">
          <h2 class="adm-card-title">TürkTicaret cPanel E-posta İpuçları</h2>
        </div>
        <div class="adm-card-body" style="font-size: 0.8125rem; color: var(--adm-text-muted); line-height: 1.6;">
          <ul style="padding-left: 18px; margin: 0; display: flex; flex-direction: column; gap: 8px;">
            <li>TürkTicaret cPanel üzerinde <strong>E-Posta Hesapları</strong> menüsünden <code>info@nizamlarbaski.com</code> hesabı oluşturun.</li>
            <li>Sunucu adı genellikle <code>mail.nizamlarbaski.com</code> veya sunucunuzun ana hostname'idir.</li>
            <li>Giden sunucu için <strong>Port 587 (TLS)</strong> önerilir. Alternatif olarak <strong>Port 465 (SSL)</strong> kullanılabilir.</li>
            <li>E-posta gönderimi başarısız olsa bile gelen teklif ve iletişim kayıtları veritabanında güvenle saklanır, veri kaybı yaşanmaz.</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
<?php endif; ?>

<?php require_once __DIR__ . '/footer.php'; ?>
