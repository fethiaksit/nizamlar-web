<?php
/**
 * NİZAMLAR BASKI — İLETİŞİM FORMU API ENDPOINT'İ (/api/contact.php)
 * 
 * - Spam, honeypot ve hız korumalı
 * - PDO prepared statements ile MySQL'e güvenli kayıt
 * - E-posta bildirimi (SMTP)
 * - E-posta gönderimi başarısız olsa bile talep kaydı kaybolmaz; bildirim hatası ayrı izlenir.
 * - Veritabanına kaydedilmediğinde KESİNLİKLE başarı mesajı gösterilmez.
 */

define('NIZAMLAR_APP', true);
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/helpers.php';
require_once __DIR__ . '/../config/mailer.php';

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['success' => false, 'error' => 'Yalnızca POST istekleri kabul edilir.'], 405);
}

// 1. Hız Sınırlaması (Rate Limiting: 10 dakikada en fazla 10 mesaj)
if (!check_rate_limit('contact_submission', 10, 600)) {
    http_response_code(429);
    header('Retry-After: 600');
    json_response(['success' => false, 'error' => 'Çok fazla deneme yapıldı. Lütfen biraz sonra tekrar deneyiniz.'], 429);
}

// Girdi Verileri (JSON veya application/x-www-form-urlencoded)
$rawBody = file_get_contents('php://input');
$jsonBody = json_decode($rawBody, true) ?: [];
$data = array_merge($_POST, $jsonBody);

// 2. Spam ve Bot Koruması (Honeypot + Zamanlama)
$honeypot = clean_input($data['website'] ?? $data['company_url'] ?? '', 100);
if (!empty($honeypot)) {
    json_response(['success' => false, 'error' => 'Geçersiz istek tespit edildi.'], 400);
}

$startedAt = (int)($data['_form_ts'] ?? 0);
if ($startedAt > 0) {
    $nowMs = (int)(microtime(true) * 1000);
    if (($nowMs - $startedAt) < 2000) {
        json_response(['success' => false, 'error' => 'Form çok hızlı gönderildi. Lütfen bilgileri kontrol edip tekrar deneyiniz.'], 400);
    }
}

// 3. Zorunlu Alan Doğrulamaları
$name    = clean_input($data['name'] ?? '', 120);
$company = clean_input($data['company'] ?? '', 150);
$phone   = clean_input($data['phone'] ?? '', 40);
$email   = clean_input($data['email'] ?? '', 150);
$subject = clean_input($data['subject'] ?? '', 150);
$message = clean_input($data['message'] ?? '', 4000);

$errors = [];
if (mb_strlen($name, 'UTF-8') < 2) {
    $errors['name'] = 'Ad Soyad alanı en az 2 karakter olmalıdır.';
}
if (empty($phone) && empty($email)) {
    $errors['contact'] = 'Telefon veya e-posta bilgisinden en az biri zorunludur.';
}
if (!empty($email) && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors['email'] = 'Geçerli bir e-posta adresi giriniz.';
}
if (!empty($phone) && strlen(preg_replace('/\D/', '', $phone)) < 7) {
    $errors['phone'] = 'Geçerli bir telefon numarası giriniz.';
}
if (empty($subject)) {
    $errors['subject'] = 'Lütfen mesajınız için bir konu seçiniz.';
}
if (mb_strlen($message, 'UTF-8') < 10) {
    $errors['message'] = 'Mesajınız en az 10 karakter uzunluğunda olmalıdır.';
}

if (!empty($errors)) {
    json_response([
        'success' => false,
        'error'   => 'Lütfen form alanlarını kontrol ediniz.',
        'fields'  => $errors
    ], 422);
}

// 4. Veritabanına Kayıt (Prepared Statement)
try {
    $ipHash = hash('sha256', get_client_ip());

    $query = "INSERT INTO `contact_messages` (
        `received_at`, `name`, `company`, `phone`, `email`,
        `subject`, `message`, `status`, `email_status`, `source_ip_hash`
    ) VALUES (
        NOW(), :name, :company, :phone, :email,
        :subject, :message, 'new', 'pending', :ip_hash
    )";

    $params = [
        ':name'     => $name,
        ':company'  => $company,
        ':phone'    => $phone,
        ':email'    => $email,
        ':subject'  => $subject,
        ':message'  => $message,
        ':ip_hash'  => $ipHash
    ];

    $rowCount = DB::execute($query, $params);
    $insertId = (int)DB::lastInsertId();

    if ($rowCount <= 0 || $insertId <= 0) {
        throw new Exception("İletişim mesajı veritabanına eklenemedi.");
    }

    // 5. E-posta Bildirimi (SMTP) — Talep kaydından bağımsız izlenir
    $emailStatus = 'sent';
    try {
        $mailSubject = "Yeni İletişim Mesajı (#{$insertId}) — {$name} [{$subject}]";
        $mailBody = "<h2>Yeni Bir İletişim Mesajı Alındı</h2>" .
                    "<p><strong>Mesaj No:</strong> #{$insertId}</p>" .
                    "<p><strong>Gönderen:</strong> " . esc($name) . "</p>" .
                    "<p><strong>Firma:</strong> " . esc($company) . "</p>" .
                    "<p><strong>Telefon:</strong> " . esc($phone) . "</p>" .
                    "<p><strong>E-posta:</strong> " . esc($email) . "</p>" .
                    "<p><strong>Konu:</strong> " . esc($subject) . "</p>" .
                    "<p><strong>Mesaj:</strong><br>" . nl2br(esc($message)) . "</p>" .
                    "<hr><p><small>Bu bildirim Nizamlar Baskı web sitesi iletişim formundan otomatik iletilmiştir.</small></p>";

        $adminEmail = env_get('CONTACT_NOTIFICATION_EMAIL', 'nizamlartekstill@gmail.com');
        $sendResult = SimpleSMTP::send($adminEmail, $mailSubject, $mailBody);
        if (!$sendResult['ok']) {
            $emailStatus = 'failed';
            error_log("İletişim formu e-posta bildirim hatası: " . ($sendResult['error'] ?? 'Bilinmeyen hata'));
        }
    } catch (Exception $mailEx) {
        $emailStatus = 'failed';
        error_log("İletişim formu e-posta bildirim istisnası: " . $mailEx->getMessage());
    }

    // E-posta gönderim durumunu güncelle
    DB::execute(
        "UPDATE `contact_messages` SET `email_status` = :email_status WHERE `id` = :id",
        [':email_status' => $emailStatus, ':id' => $insertId]
    );

    // Gerçek başarı yanıtı
    json_response([
        'success'      => true,
        'message'      => 'Mesajınız başarıyla alınmıştır. En kısa sürede sizinle iletişime geçeceğiz.',
        'id'           => $insertId,
        'email_status' => $emailStatus
    ], 201);

} catch (Exception $e) {
    error_log("İletişim mesajı işleme hatası: " . $e->getMessage());
    // KAYDEDİLMEDİĞİ İÇİN HİÇBİR DURUMDA BAŞARI GÖSTERİLMEZ
    json_response([
        'success' => false,
        'error'   => 'Mesajınız kaydedilemedi. Lütfen sayfayı yenileyip tekrar deneyiniz veya bizi telefonla arayınız.'
    ], 500);
}
