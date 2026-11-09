<?php
/**
 * NİZAMLAR BASKI — İLK YÖNETİCİ KURULUM SİHİRBAZI
 * 
 * Güvenlik: Tek kullanımlıktır.
 * Kurulum tamamlandığında storage/install.lock oluşturulur ve bu ekran kalıcı olarak kilitlenir.
 * Varsayılan veya sabit kodlanmış şifre içermez.
 */

define('NIZAMLAR_APP', true);
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/helpers.php';
require_once __DIR__ . '/../config/auth.php';

init_secure_session();

$lockFile = STORAGE_DIR . '/install.lock';
$alreadyInstalled = file_exists($lockFile);
$dbConnected = true;
$dbError = null;

if (!$alreadyInstalled) {
    try {
        $check = DB::fetch("SELECT COUNT(*) as cnt FROM `admin_users`");
        if ($check && (int)$check['cnt'] > 0) {
            $alreadyInstalled = true;
            @file_put_contents($lockFile, date('c'));
            @chmod($lockFile, 0600);
        }
    } catch (Exception $e) {
        // Tablo henüz açılmamış veya veritabanına bağlanılamamış olabilir
        try {
            DB::connect();
        } catch (Exception $connEx) {
            $dbConnected = false;
            $dbError = $connEx->getMessage();
        }
    }
}

$error = null;
$success = null;

if (!$alreadyInstalled && $_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!check_rate_limit('admin_install_attempt', 5, 900)) {
        $error = 'Çok fazla deneme yapıldı. Lütfen 15 dakika bekleyiniz.';
    } elseif (!$dbConnected) {
        $error = 'Veritabanı bağlantısı kurulamadığı için yönetici hesabı oluşturulamıyor. Lütfen .env veya config/config.php dosyasındaki veritabanı ayarlarını kontrol ediniz.';
    } elseif (!verify_csrf_token($_POST['csrf_token'] ?? '')) {
        $error = 'Geçersiz güvenlik doğrulaması (CSRF). Lütfen formu yenileyiniz.';
    } else {
        $fullName = clean_input($_POST['full_name'] ?? '', 100);
        $username = clean_input($_POST['username'] ?? '', 50);
        $email    = clean_input($_POST['email'] ?? '', 100);
        $password = $_POST['password'] ?? '';
        $confirm  = $_POST['password_confirm'] ?? '';

        if (mb_strlen($fullName) < 3) {
            $error = 'Lütfen geçerli bir ad soyad giriniz.';
        } elseif (!preg_match('/^[a-zA-Z0-9_\-\.]{3,30}$/', $username)) {
            $error = 'Kullanıcı adı 3-30 karakter olmalı ve yalnızca harf, rakam, alt tire ve tire içermelidir.';
        } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $error = 'Lütfen geçerli bir e-posta adresi giriniz.';
        } elseif (strlen($password) < 8) {
            $error = 'Şifreniz en az 8 karakter uzunluğunda olmalıdır.';
        } elseif ($password !== $confirm) {
            $error = 'Şifreler birbiriyle eşleşmiyor.';
        } else {
            try {
                // admin_users tablosu yoksa otomatik oluştur
                DB::connect()->exec("
                    CREATE TABLE IF NOT EXISTS `admin_users` (
                        `id` INT AUTO_INCREMENT PRIMARY KEY,
                        `username` VARCHAR(100) NOT NULL UNIQUE,
                        `email` VARCHAR(150) NOT NULL UNIQUE,
                        `password_hash` VARCHAR(255) NOT NULL,
                        `full_name` VARCHAR(150) NOT NULL,
                        `role` VARCHAR(50) NOT NULL DEFAULT 'admin',
                        `is_active` TINYINT(1) NOT NULL DEFAULT 1,
                        `last_login` DATETIME NULL DEFAULT NULL,
                        `failed_logins` INT NOT NULL DEFAULT 0,
                        `lockout_until` DATETIME NULL DEFAULT NULL,
                        `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
                ");

                $hash = password_hash($password, PASSWORD_DEFAULT);

                DB::execute("
                    INSERT INTO `admin_users` (`username`, `email`, `password_hash`, `full_name`, `role`, `is_active`, `created_at`)
                    VALUES (:username, :email, :hash, :name, 'admin', 1, NOW())
                ", [
                    ':username' => $username,
                    ':email'    => $email,
                    ':hash'     => $hash,
                    ':name'     => $fullName
                ]);

                // Kurulumu kalıcı olarak kilitle
                if (!is_dir(STORAGE_DIR)) {
                    @mkdir(STORAGE_DIR, 0755, true);
                }
                file_put_contents($lockFile, "Installed at " . date('c') . " by " . $username);

                // Otomatik oturum aç ve dashboard'a yönlendir
                admin_login($username, $password);
                header('Location: /admin/dashboard.php?installed=1');
                exit;

            } catch (Exception $e) {
                $error = 'Kurulum sırasında hata oluştu: ' . $e->getMessage();
            }
        }
    }
}
?>
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>İlk Yönetici Kurulumu — Nizamlar Baskı</title>
  <link rel="icon" type="image/svg+xml" href="/assets/images/logo.svg">
  <link rel="stylesheet" href="/admin/assets/admin.css">
  <style>
    .install-wrap {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      background: radial-gradient(circle at top, #1e2026, #111214);
    }
    .install-box {
      width: 100%;
      max-width: 460px;
      background: var(--adm-card);
      border: 1px solid var(--adm-border);
      border-radius: var(--adm-radius);
      padding: 36px 32px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
    }
    .install-logo {
      text-align: center;
      margin-bottom: 24px;
    }
    .install-logo img {
      height: 48px;
    }
    .install-title {
      font-size: 20px;
      font-weight: 700;
      color: #fff;
      text-align: center;
      margin-bottom: 8px;
    }
    .install-desc {
      font-size: 13px;
      color: var(--adm-text-muted);
      text-align: center;
      margin-bottom: 24px;
    }
  </style>
</head>
<body>
<div class="install-wrap">
  <div class="install-box">
    <div class="install-logo">
      <img src="/assets/images/logo.svg" alt="Nizamlar Baskı">
    </div>

    <?php if ($alreadyInstalled): ?>
      <div class="install-title">Kurulum Zaten Tamamlandı</div>
      <p class="install-desc" style="color: var(--adm-text-muted);">
        Yönetici hesabı daha önce oluşturulmuş ve güvenlik sebebiyle tek kullanımlık kurulum sihirbazı kilitlenmiştir.
      </p>
      <div style="text-align: center; margin-top: 24px;">
        <a href="/admin/login.php" class="adm-btn adm-btn-gold" style="width: 100%;">Yönetim Paneline Giriş Yap</a>
      </div>
    <?php else: ?>
      <div class="install-title">İlk Yönetici Hesabını Oluştur</div>
      <p class="install-desc">
        TürkTicaret cPanel üzerinde çalışan Nizamlar Baskı yönetim paneliniz için birincil yönetici kullanıcısını tanımlayınız.
      </p>

      <?php if (!$dbConnected): ?>
        <div class="adm-alert adm-alert-danger" style="text-align: left; font-size: 13px;">
          <strong>Veritabanı Bağlantı Uyarısı:</strong><br>
          Veritabanına bağlanılamadı. Lütfen <code>.env</code> veya <code>config/config.php</code> dosyasındaki MySQL kullanıcı adı, şifresi ve veritabanı adını kontrol ediniz.<br>
          <small style="opacity: 0.8;"><?= esc($dbError ?? '') ?></small>
        </div>
      <?php endif; ?>

      <?php if ($error): ?>
        <div class="adm-alert adm-alert-danger"><?= esc($error) ?></div>
      <?php endif; ?>

      <form method="POST" action="">
        <input type="hidden" name="csrf_token" value="<?= csrf_token() ?>">

        <div class="adm-form-group">
          <label class="adm-label" for="full_name">Adınız Soyadınız</label>
          <input type="text" id="full_name" name="full_name" class="adm-input" placeholder="Örn: Fethi Akşit" required value="<?= esc($_POST['full_name'] ?? '') ?>">
        </div>

        <div class="adm-form-group">
          <label class="adm-label" for="username">Kullanıcı Adı</label>
          <input type="text" id="username" name="username" class="adm-input" placeholder="Örn: admin" required value="<?= esc($_POST['username'] ?? '') ?>">
        </div>

        <div class="adm-form-group">
          <label class="adm-label" for="email">E-posta Adresi</label>
          <input type="email" id="email" name="email" class="adm-input" placeholder="ornek@nizamlarbaski.com" required value="<?= esc($_POST['email'] ?? '') ?>">
        </div>

        <div class="adm-form-group">
          <label class="adm-label" for="password">Güçlü Yönetici Şifresi <small>(En az 8 karakter)</small></label>
          <input type="password" id="password" name="password" class="adm-input" placeholder="••••••••••••" required minlength="8">
        </div>

        <div class="adm-form-group">
          <label class="adm-label" for="password_confirm">Şifre Tekrarı</label>
          <input type="password" id="password_confirm" name="password_confirm" class="adm-input" placeholder="••••••••••••" required minlength="8">
        </div>

        <button type="submit" class="adm-btn adm-btn-gold" style="width: 100%; padding: 12px; margin-top: 8px;">
          <span>Hesabı Oluştur ve Paneli Başlat</span>
        </button>
      </form>
    <?php endif; ?>
  </div>
</div>
</body>
</html>
