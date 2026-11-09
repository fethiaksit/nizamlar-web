<?php
/**
 * NİZAMLAR BASKI — E-POSTA BİLDİRİM MOTORU (SMTP)
 * 
 * Harici kütüphane gerektirmeyen, saf PHP soket tabanlı SMTP istemcisi.
 * cPanel standart posta sunucusu ve harici SMTP servisleriyle (Yandex, Gmail, Resend SMTP) tam uyumlu.
 * Gönderim başarısız olsa bile talep kaybı yaşanmaz; hata izlenir.
 */

if (!defined('NIZAMLAR_APP')) {
    require_once __DIR__ . '/config.php';
}
require_once __DIR__ . '/db.php';

class SimpleSMTP {
    public static function send(string $to, string $subject, string $htmlBody, array $options = []): array {
        // Veritabanından aktif SMTP ayarlarını oku
        $cfg = null;
        try {
            $cfg = DB::fetch("SELECT * FROM `smtp_settings` WHERE `id` = 1 LIMIT 1");
        } catch (Exception $e) {
            // DB yoksa fallback
        }

        $host = $options['host'] ?? $cfg['host'] ?? 'localhost';
        $port = (int)($options['port'] ?? $cfg['port'] ?? 587);
        $enc  = strtolower($options['encryption'] ?? $cfg['encryption'] ?? 'tls');
        $user = $options['username'] ?? $cfg['username'] ?? '';
        $pass = $options['password'] ?? $cfg['password'] ?? '';
        $fromEmail = $options['from_email'] ?? $cfg['from_email'] ?? 'info@nizamlarbaski.com';
        $fromName  = $options['from_name'] ?? $cfg['from_name'] ?? 'Nizamlar Baskı';

        // SMTP kimlik bilgisi yoksa veya aktif değilse standart PHP mail() dene
        if (empty($user) || empty($pass) || (isset($cfg['is_active']) && !$cfg['is_active'])) {
            $headers  = "MIME-Version: 1.0\r\n";
            $headers .= "Content-type: text/html; charset=UTF-8\r\n";
            $headers .= "From: =?UTF-8?B?" . base64_encode($fromName) . "?= <{$fromEmail}>\r\n";
            $headers .= "Reply-To: {$fromEmail}\r\n";
            $headers .= "X-Mailer: PHP/" . phpversion();

            $ok = @mail($to, '=?UTF-8?B?' . base64_encode($subject) . '?=', $htmlBody, $headers);
            return $ok ? ['ok' => true] : ['ok' => false, 'error' => 'Yerel mail() gönderimi başarısız oldu veya sunucu posta gönderimine kapalı.'];
        }

        // Soket ile doğrudan SMTP bağlantısı
        try {
            $socketHost = ($enc === 'ssl' ? 'ssl://' : '') . $host;
            $timeout = 10;
            $socket = @fsockopen($socketHost, $port, $errno, $errstr, $timeout);
            if (!$socket) {
                return ['ok' => false, 'error' => "SMTP Bağlantı hatası ($errno): $errstr"];
            }

            stream_set_timeout($socket, $timeout);

            $read = fn() => fgets($socket, 512);
            $send = function(string $cmd) use ($socket) {
                fputs($socket, $cmd . "\r\n");
            };

            $response = $read();
            if (substr($response, 0, 3) !== '220') {
                fclose($socket);
                return ['ok' => false, 'error' => 'SMTP Sunucu selamı geçersiz: ' . $response];
            }

            $send("EHLO " . ($_SERVER['SERVER_NAME'] ?? 'localhost'));
            while ($line = $read()) {
                if (substr($line, 3, 1) === ' ') break;
            }

            if ($enc === 'tls') {
                $send("STARTTLS");
                $res = $read();
                if (substr($res, 0, 3) === '220') {
                    stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
                    $send("EHLO " . ($_SERVER['SERVER_NAME'] ?? 'localhost'));
                    while ($line = $read()) {
                        if (substr($line, 3, 1) === ' ') break;
                    }
                }
            }

            $send("AUTH LOGIN");
            $read();
            $send(base64_encode($user));
            $read();
            $send(base64_encode($pass));
            $authRes = $read();
            if (substr($authRes, 0, 3) !== '235') {
                fclose($socket);
                return ['ok' => false, 'error' => 'SMTP Kimlik doğrulama başarısız: ' . $authRes];
            }

            $send("MAIL FROM:<$fromEmail>");
            $read();
            $send("RCPT TO:<$to>");
            $read();
            $send("DATA");
            $read();

            $headers  = "MIME-Version: 1.0\r\n";
            $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
            $headers .= "From: =?UTF-8?B?" . base64_encode($fromName) . "?= <{$fromEmail}>\r\n";
            $headers .= "To: <{$to}>\r\n";
            $headers .= "Subject: =?UTF-8?B?" . base64_encode($subject) . "?=\r\n";
            $headers .= "Date: " . date('r') . "\r\n";
            $headers .= "X-Mailer: Nizamlar Mailer\r\n\r\n";

            $send($headers . $htmlBody . "\r\n.");
            $dataRes = $read();

            $send("QUIT");
            fclose($socket);

            if (substr($dataRes, 0, 3) === '250') {
                return ['ok' => true];
            }
            return ['ok' => false, 'error' => 'E-posta gövdesi reddedildi: ' . $dataRes];
        } catch (Exception $e) {
            return ['ok' => false, 'error' => $e->getMessage()];
        }
    }
}
