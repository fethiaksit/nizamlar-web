<?php
/**
 * NİZAMLAR BASKI — YÖNETİCİ GİRİŞİ (LOGIN)
 */

define('NIZAMLAR_APP', true);
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/helpers.php';
require_once __DIR__ . '/../config/auth.php';

init_secure_session();

if (is_authenticated()) {
    header('Location: /admin/dashboard.php');
    exit;
}

$error = null;
$info = null;

if (isset($_GET['installed'])) {
    $info = 'İlk yönetici hesabı başarıyla oluşturuldu. Lütfen giriş yapınız.';
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!verify_csrf_token($_POST['csrf_token'] ?? '')) {
        $error = 'Güvenlik doğrulaması zaman aşımına uğradı. Lütfen tekrar deneyiniz.';
    } else {
        $identifier = $_POST['identifier'] ?? '';
        $password   = $_POST['password'] ?? '';

        $result = admin_login($identifier, $password);
        if ($result['success']) {
            header('Location: /admin/dashboard.php');
            exit;
        } else {
            $error = $result['message'];
        }
    }
}
?>
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Yönetici Girişi — Nizamlar Baskı CMS</title>
  <link rel="icon" type="image/svg+xml" href="/assets/images/logo.svg">
  <link rel="stylesheet" href="/admin/assets/admin.css">
  <style>
    .login-wrap {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      background: radial-gradient(circle at top, #1e2026, #111214);
    }
    .login-box {
      width: 100%;
      max-width: 420px;
      background: var(--adm-card);
      border: 1px solid var(--adm-border);
      border-radius: var(--adm-radius);
      padding: 40px 32px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
    }
    .login-logo {
      text-align: center;
      margin-bottom: 24px;
    }
    .login-logo img {
      height: 44px;
      width: auto;
    }
    .login-title {
      font-size: 20px;
      font-weight: 700;
      color: #fff;
      text-align: center;
      margin-bottom: 6px;
    }
    .login-desc {
      font-size: 13px;
      color: var(--adm-text-muted);
      text-align: center;
      margin-bottom: 28px;
    }
  </style>
</head>
<body>
<div class="login-wrap">
  <div class="login-box">
    <div class="login-logo">
      <img src="/assets/images/logo.svg" alt="Nizamlar Baskı">
    </div>

    <div class="login-title">Yönetim Paneli Girişi</div>
    <div class="login-desc">Nizamlar Baskı Kurumsal CMS Platformu</div>

    <?php if ($info): ?>
      <div class="adm-alert adm-alert-success"><?= esc($info) ?></div>
    <?php endif; ?>

    <?php if ($error): ?>
      <div class="adm-alert adm-alert-danger"><?= esc($error) ?></div>
    <?php endif; ?>

    <form method="POST" action="">
      <input type="hidden" name="csrf_token" value="<?= csrf_token() ?>">

      <div class="adm-form-group">
        <label class="adm-label" for="identifier">Kullanıcı Adı veya E-posta</label>
        <input type="text" id="identifier" name="identifier" class="adm-input" placeholder="admin veya e-posta" required autofocus value="<?= esc($_POST['identifier'] ?? '') ?>">
      </div>

      <div class="adm-form-group">
        <label class="adm-label" for="password">Şifre</label>
        <input type="password" id="password" name="password" class="adm-input" placeholder="••••••••" required>
      </div>

      <button type="submit" class="adm-btn adm-btn-gold" style="width: 100%; padding: 12px; margin-top: 10px;">
        <span>Giriş Yap</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </button>
    </form>

    <div style="text-align: center; margin-top: 24px; font-size: 12px; color: var(--adm-text-dim);">
      <a href="/" target="_blank" rel="noopener" style="color: var(--adm-text-muted);">← Web Sitesine Dön</a>
    </div>
  </div>
</div>
</body>
</html>
