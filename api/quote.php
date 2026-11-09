<?php
/**
 * NİZAMLAR BASKI — TEKLİF TALEBİ API ENDPOINT'İ (/api/quote.php)
 * 
 * - Spam, honeypot ve hız korumalı
 * - Güvenli sunucu taraflı dosya yükleme (MIME + sihirli bayt doğrulaması)
 * - PDO prepared statements ile MySQL'e güvenli kayıt
 * - E-posta bildirimi (SMTP)
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

// 1. Hız Sınırlaması (Rate Limiting: 10 dakikada en fazla 6 teklif)
if (!check_rate_limit('quote_submission', 6, 600)) {
    http_response_code(429);
    header('Retry-After: 600');
    json_response(['success' => false, 'error' => 'Çok fazla istek yapıldı. Lütfen birkaç dakika sonra tekrar deneyiniz.'], 429);
}

// Girdi Verileri (JSON veya multipart/form-data)
$rawBody = file_get_contents('php://input');
$jsonBody = json_decode($rawBody, true) ?: [];
$data = array_merge($_POST, $jsonBody);

// 2. Spam ve Bot Koruması (Honeypot + Zamanlama)
$honeypot = clean_input($data['website'] ?? $data['company_url'] ?? '', 100);
if (!empty($honeypot)) {
    // Bot tuzağına düştü
    json_response(['success' => false, 'error' => 'Geçersiz istek tespit edildi.'], 400);
}

$startedAt = (int)($data['_form_ts'] ?? 0);
if ($startedAt > 0) {
    $nowMs = (int)(microtime(true) * 1000);
    if (($nowMs - $startedAt) < 2000) {
        // 2 saniyeden hızlı doldurulan formlar insan olamaz
        json_response(['success' => false, 'error' => 'Form çok hızlı gönderildi. Lütfen bilgileri kontrol edip tekrar deneyiniz.'], 400);
    }
}

// 3. Zorunlu Alan Doğrulamaları
$name = clean_input($data['name'] ?? $data['customer_name'] ?? '', 120);
$company = clean_input($data['company'] ?? $data['company_name'] ?? '', 150);
$phone = clean_input($data['phone'] ?? '', 40);
$email = clean_input($data['email'] ?? '', 150);
$printType = clean_input($data['service'] ?? $data['print_type'] ?? 'Genel Tekstil Baskı', 120);
$quantity = clean_input($data['quantity'] ?? 'Belirtilmedi', 60);

$errors = [];
if (mb_strlen($name, 'UTF-8') < 2) {
    $errors['name'] = 'Ad Soyad alanı zorunludur (en az 2 karakter).';
}
if (empty($phone) && empty($email)) {
    $errors['contact'] = 'Telefon veya e-posta bilgilerinden en az birini belirtmelisiniz.';
}
if (!empty($email) && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors['email'] = 'Geçerli bir e-posta adresi giriniz.';
}
if (!empty($phone) && strlen(preg_replace('/\D/', '', $phone)) < 7) {
    $errors['phone'] = 'Geçerli bir telefon numarası giriniz.';
}

if (!empty($errors)) {
    json_response([
        'success' => false,
        'error'   => 'Lütfen form alanlarını kontrol ediniz.',
        'fields'  => $errors
    ], 422);
}

// Ek Açıklamalar ve Parametreler
$extra = [];
if (!empty($data['product_type']))  $extra[] = "Ürün türü: " . clean_input($data['product_type'], 100);
if (!empty($data['print_size']))    $extra[] = "Baskı ebadı: " . clean_input($data['print_size'], 100);
if (!empty($data['fabric']))        $extra[] = "Kumaş detayı: " . clean_input($data['fabric'], 150);
$notes = clean_input($data['notes'] ?? $data['description'] ?? $data['message'] ?? '', 3500);

$description = trim($notes . (!empty($extra) ? "\n\n[Teknik Parametreler]\n" . implode("\n", $extra) : ''));

// 4. Dosya Yükleme Yönetimi
$uploadedFile = null;
$storedFileName = null;
$origFileName = null;
$fileSize = 0;
$mimeType = null;
$fileUrl = null;

$allowedExts = ['pdf', 'ai', 'psd', 'png', 'jpg', 'jpeg', 'svg', 'tif', 'tiff', 'zip', 'rar'];

if (isset($_FILES['design_file']) && $_FILES['design_file']['error'] !== UPLOAD_ERR_NO_FILE) {
    $file = $_FILES['design_file'];

    if ($file['error'] !== UPLOAD_ERR_OK) {
        $uploadErrors = [
            UPLOAD_ERR_INI_SIZE   => 'Dosya boyutu sunucu limitini aşıyor.',
            UPLOAD_ERR_FORM_SIZE  => 'Dosya boyutu form limitini aşıyor.',
            UPLOAD_ERR_PARTIAL    => 'Dosya kısmen yüklendi, tekrar deneyin.',
            UPLOAD_ERR_NO_TMP_DIR => 'Sunucu geçici dizin hatası.',
            UPLOAD_ERR_CANT_WRITE => 'Dosya diske yazılamadı.',
            UPLOAD_ERR_EXTENSION  => 'Yükleme sunucu eklentisi tarafından durduruldu.'
        ];
        $msg = $uploadErrors[$file['error']] ?? 'Dosya yükleme hatası oluştu.';
        json_response(['success' => false, 'error' => $msg], 400);
    }

    if ($file['size'] > MAX_UPLOAD_BYTES) {
        json_response(['success' => false, 'error' => 'Dosya boyutu en fazla 25 MB olabilir.'], 400);
    }

    $pathInfo = pathinfo($file['name']);
    $ext = strtolower($pathInfo['extension'] ?? '');

    if (!in_array($ext, $allowedExts, true)) {
        json_response(['success' => false, 'error' => 'Desteklenmeyen dosya formatı. (PDF, AI, PSD, PNG, JPG, SVG, TIFF, ZIP veya RAR yükleyiniz)'], 400);
    }

    // Dosya içeriği ve sihirli bayt doğrulaması (uzantı hilesini engelle)
    if (!validate_file_content($file['tmp_name'], $ext)) {
        json_response(['success' => false, 'error' => 'Dosya içeriği uzantısıyla uyuşmuyor veya güvenli değil.'], 400);
    }

    // Güvenli depolama dizini hazırla (public_html DIŞINDA veya .htaccess ile korumalı)
    if (!is_dir(PRIVATE_QUOTES_DIR)) {
        @mkdir(PRIVATE_QUOTES_DIR, 0755, true);
        @file_put_contents(PRIVATE_QUOTES_DIR . '/.htaccess', "Deny from all\nRequire all denied\n");
    }

    $safeUuid = bin2hex(random_bytes(16));
    $storedFileName = $safeUuid . '.' . $ext;
    $targetPath = PRIVATE_QUOTES_DIR . '/' . $storedFileName;

    if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
        error_log("Teklif dosyası taşınamadı: " . $targetPath);
        json_response(['success' => false, 'error' => 'Dosya sunucuya kaydedilemedi. Lütfen tekrar deneyiniz.'], 500);
    }

    $origFileName = clean_input($file['name'], 200);
    $fileSize = (int)$file['size'];
    $mimeType = mime_content_type($targetPath) ?: 'application/octet-stream';
    $fileUrl = '/admin/quote-file.php?file=' . urlencode($storedFileName);
}

// 5. Veritabanına Kayıt (Prepared Statement)
try {
    $ipHash = hash('sha256', get_client_ip());
    
    $query = "INSERT INTO `quote_requests` (
        `created_at`, `status`, `customer_name`, `company_name`, `phone`, `email`,
        `print_type`, `quantity`, `description`, `file_url`, `file_name`, `file_size`,
        `mime_type`, `source_ip_hash`
    ) VALUES (
        NOW(), 'Yeni', :name, :company, :phone, :email,
        :print_type, :quantity, :description, :file_url, :file_name, :file_size,
        :mime_type, :ip_hash
    )";

    $params = [
        ':name'        => $name,
        ':company'     => $company,
        ':phone'       => $phone,
        ':email'       => $email,
        ':print_type'  => $printType,
        ':quantity'    => $quantity,
        ':description' => $description,
        ':file_url'    => $fileUrl,
        ':file_name'   => $origFileName,
        ':file_size'   => $fileSize,
        ':mime_type'   => $mimeType,
        ':ip_hash'     => $ipHash
    ];

    $rowCount = DB::execute($query, $params);
    $insertId = (int)DB::lastInsertId();

    if ($rowCount <= 0 || $insertId <= 0) {
        throw new Exception("Veritabanı kaydı başarısız oldu.");
    }

    // 6. E-posta Bildirimi (SMTP) — Arka planda çalışır, hata olsa bile talep kaydı korunur
    try {
        $mailSubject = "Yeni Fiyat Teklifi Talebi (#{$insertId}) — {$name}";
        $mailBody = "<h2>Yeni Bir Teklif Talebi Alındı</h2>" .
                    "<p><strong>Talep No:</strong> #{$insertId}</p>" .
                    "<p><strong>Ad Soyad:</strong> " . esc($name) . "</p>" .
                    "<p><strong>Firma:</strong> " . esc($company) . "</p>" .
                    "<p><strong>Telefon:</strong> " . esc($phone) . "</p>" .
                    "<p><strong>E-posta:</strong> " . esc($email) . "</p>" .
                    "<p><strong>Baskı Türü:</strong> " . esc($printType) . "</p>" .
                    "<p><strong>Tahmini Adet:</strong> " . esc($quantity) . "</p>" .
                    "<p><strong>Açıklama & Detaylar:</strong><br>" . nl2br(esc($description)) . "</p>";

        if ($origFileName) {
            $mailBody .= "<p><strong>Ekli Tasarım Dosyası:</strong> " . esc($origFileName) . " (" . round($fileSize / 1024 / 1024, 2) . " MB)</p>";
        }

        $mailBody .= "<hr><p><small>Bu mesaj Nizamlar Baskı web sitesi üzerinden iletilmiştir. Yönetim panelinden talebi inceleyebilirsiniz.</small></p>";

        $adminEmail = env_get('CONTACT_NOTIFICATION_EMAIL', 'nizamlartekstill@gmail.com');
        SimpleSMTP::send($adminEmail, $mailSubject, $mailBody);
    } catch (Exception $mailEx) {
        error_log("Teklif e-posta bildirim hatası: " . $mailEx->getMessage());
    }

    // Gerçek başarı yanıtı
    json_response([
        'success' => true,
        'message' => 'Teklif talebiniz başarıyla alındı ve kayıtlara geçti. Uzman ekibimiz en kısa sürede sizinle iletişime geçecektir.',
        'id'      => $insertId
    ], 201);

} catch (Exception $e) {
    error_log("Teklif işleme hatası: " . $e->getMessage());
    // Yüklenen dosya varsa temizle
    if (!empty($targetPath) && file_exists($targetPath)) {
        @unlink($targetPath);
    }
    // TALEP KAYDEDİLMEDİĞİ İÇİN HİÇBİR KOŞULDA BAŞARI DÖNÜLEMEZ
    json_response([
        'success' => false,
        'error'   => 'Talebiniz kaydedilemedi. Lütfen doğrudan telefon veya WhatsApp ile iletişime geçiniz.'
    ], 500);
}
