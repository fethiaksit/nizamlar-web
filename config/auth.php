<?php
/**
 * NİZAMLAR BASKI — YÖNETİCİ KİMLİK DOĞRULAMA VE OTURUM YÖNETİMİ
 */

if (!defined('NIZAMLAR_APP')) {
    require_once __DIR__ . '/config.php';
}
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/helpers.php';

init_secure_session();

function is_authenticated(): bool {
    if (!empty($_SESSION['admin_user_id']) && !empty($_SESSION['admin_logged_in'])) {
        // Oturum çalınmasını engellemek için IP veya User-Agent parmak izi denetimi
        if (isset($_SESSION['admin_user_ip']) && $_SESSION['admin_user_ip'] === get_client_ip()) {
            return true;
        }
    }
    return false;
}

function current_admin(): ?array {
    if (!is_authenticated()) return null;
    return $_SESSION['admin_user'] ?? null;
}

function require_admin(bool $isApi = false): void {
    if (!is_authenticated()) {
        if ($isApi) {
            json_response(['success' => false, 'error' => 'Yetkisiz erişim. Lütfen giriş yapınız.'], 401);
        } else {
            header('Location: /admin/login.php');
            exit;
        }
    }
}

function admin_login(string $identifier, string $password): array {
    $identifier = clean_input($identifier, 150);
    if (empty($identifier) || empty($password)) {
        return ['success' => false, 'message' => 'Kullanıcı adı ve şifre zorunludur.'];
    }

    if (!check_rate_limit('admin_login_' . $identifier, 5, 900)) {
        return ['success' => false, 'message' => 'Çok fazla hatalı deneme yapıldı. Lütfen 15 dakika sonra tekrar deneyin.'];
    }

    try {
        $user = DB::fetch(
            "SELECT * FROM `admin_users` WHERE (`username` = :id1 OR `email` = :id2) AND `is_active` = 1 LIMIT 1",
            [':id1' => $identifier, ':id2' => $identifier]
        );

        if (!$user) {
            return ['success' => false, 'message' => 'Kullanıcı adı veya şifre hatalı.'];
        }

        if (password_verify($password, $user['password_hash'])) {
            // Başarılı giriş
            session_regenerate_id(true);
            $_SESSION['admin_logged_in'] = true;
            $_SESSION['admin_user_id'] = $user['id'];
            $_SESSION['admin_user_ip'] = get_client_ip();
            $_SESSION['admin_user'] = [
                'id'        => $user['id'],
                'username'  => $user['username'],
                'email'     => $user['email'],
                'full_name' => $user['full_name'],
                'role'      => $user['role']
            ];

            // Son giriş tarihini ve başarısız denemeleri güncelle
            DB::execute(
                "UPDATE `admin_users` SET `last_login` = NOW(), `failed_logins` = 0 WHERE `id` = :id",
                [':id' => $user['id']]
            );

            return ['success' => true];
        } else {
            // Hatalı şifre
            DB::execute(
                "UPDATE `admin_users` SET `failed_logins` = `failed_logins` + 1 WHERE `id` = :id",
                [':id' => $user['id']]
            );
            return ['success' => false, 'message' => 'Kullanıcı adı veya şifre hatalı.'];
        }
    } catch (Exception $e) {
        error_log("Giriş hatası: " . $e->getMessage());
        return ['success' => false, 'message' => 'Sistem hatası oluştu. Lütfen tekrar deneyiniz.'];
    }
}

function admin_logout(): void {
    $_SESSION = [];
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params["path"], $params["domain"],
            $params["secure"], $params["httponly"]
        );
    }
    session_destroy();
}

function csrf_token(): string {
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function verify_csrf_token(?string $token): bool {
    if (empty($token) || empty($_SESSION['csrf_token'])) {
        return false;
    }
    return hash_equals($_SESSION['csrf_token'], $token);
}
