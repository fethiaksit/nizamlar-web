<?php
/**
 * NİZAMLAR BASKI — PHP BACKEND VE SİSTEM TESTLERİ
 * 
 * Bu betik, PHP backend bileşenlerini, veri modellerini, güvenlik fonksiyonlarını,
 * API uç noktalarını ve SSR sayfalarını yerel ortamda otomatik olarak test eder.
 *
 * Çalıştırma:
 *   /opt/homebrew/bin/php tests/test_php_backend.php
 */

define('IN_TEST_RUNNER', true);

$passed = 0;
$failed = 0;

function assert_test(string $name, bool $condition, string $detail = '') {
    global $passed, $failed;
    if ($condition) {
        $passed++;
        echo "  [PASS] {$name}\n";
    } else {
        $failed++;
        echo "  [FAIL] {$name} " . ($detail ? "({$detail})" : "") . "\n";
    }
}

echo "========================================================\n";
echo " NİZAMLAR BASKI — OTOMATİK DOĞRULAMA TESTLERİ\n";
echo " PHP Sürümü: " . PHP_VERSION . "\n";
echo " Tarih: " . date('d.m.Y H:i:s') . "\n";
echo "========================================================\n\n";

// 1. PHP EKLENTİLERİ TESTİ
echo "1. PHP Ortamı ve Eklentiler:\n";
assert_test("PHP 8.x Sürümü", version_compare(PHP_VERSION, '8.0.0', '>='));
assert_test("PDO Eklentisi", extension_loaded('pdo'));
assert_test("FileInfo Eklentisi", extension_loaded('fileinfo'));
assert_test("MBString Eklentisi", extension_loaded('mbstring'));
assert_test("JSON Eklentisi", extension_loaded('json'));
assert_test("OpenSSL Eklentisi", extension_loaded('openssl'));
echo "\n";

// 2. DOSYA VE DİZİN YAPISI TESTİ
echo "2. Sayfa ve Varlık Dosyaları Bütünlüğü:\n";
$requiredPages = [
    'index.html',
    'hakkimizda/index.html',
    'hizmetlerimiz/index.html',
    'blog/index.html',
    'makine-parkurumuz/index.html',
    'uretim-surecleri/index.html',
    'referanslarimiz/index.html',
    'sertifikalarimiz/index.html',
    'iletisim/index.html',
    'teklif-al/index.html'
];
foreach ($requiredPages as $page) {
    assert_test("Sayfa Mevcut: {$page}", file_exists(__DIR__ . '/../' . $page));
}

$backendFiles = [
    'database.sql',
    '.htaccess',
    'config/config.php',
    'config/db.php',
    'config/helpers.php',
    'config/auth.php',
    'config/mailer.php',
    'api/public.php',
    'api/quote.php',
    'api/contact.php',
    'api/health.php',
    'hizmetlerimiz/detail.php',
    'blog/detail.php',
    'admin/index.php',
    'admin/install.php',
    'admin/login.php',
    'admin/dashboard.php',
    'admin/quotes.php',
    'admin/quote-file.php',
    'admin/messages.php',
    'admin/pages.php',
    'admin/services.php',
    'admin/products.php',
    'admin/blog.php',
    'admin/machines.php',
    'admin/processes.php',
    'admin/references.php',
    'admin/certificates.php',
    'admin/media.php',
    'admin/settings.php'
];
foreach ($backendFiles as $file) {
    assert_test("Backend Dosyası Mevcut: {$file}", file_exists(__DIR__ . '/../' . $file));
}
echo "\n";

// 3. YARDIMCI VE GÜVENLİK FONKSİYONLARI TESTİ
echo "3. Yardımcı Fonksiyonlar ve Güvenlik:\n";
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/helpers.php';

// XSS Kaçışı (esc)
$dirtyXss = "<script>alert('xss');</script>";
$escaped = esc($dirtyXss);
assert_test("esc() XSS Kaçırma", !str_contains($escaped, '<script>') && str_contains($escaped, '&lt;script&gt;'));

// clean_input() Kontrol Karakteri Temizliği
$controlChars = "Test\x00\x08Metin";
$cleanResult = clean_input($controlChars);
assert_test("clean_input() Null-Byte Temizliği", $cleanResult === 'TestMetin');

// Türkçe Slug
$slugTest1 = turkish_slug("Özel Serigrafi ve DTF Transfer Baskı Çözümleri!");
assert_test("turkish_slug() Türkçe Karakter Dönüşümü", $slugTest1 === 'ozel-serigrafi-ve-dtf-transfer-baski-cozumleri', "Sonuç: {$slugTest1}");

// Sihirli Bayt (Magic Bytes) Güvenlik Doğrulaması (Gerçek PNG Başlığı)
$tmpPng = tempnam(sys_get_temp_dir(), 'test_png');
file_put_contents($tmpPng, "\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR" . str_repeat("\x00", 50));
assert_test("validate_file_content() Gerçek PNG Doğrulama", validate_file_content($tmpPng, 'png') === true);
unlink($tmpPng);

// Sahte/Zararlı Dosya (PHP kodu gizlenmiş sahte PNG)
$tmpFake = tempnam(sys_get_temp_dir(), 'test_fake');
file_put_contents($tmpFake, "<?php echo 'zararli kod'; ?>");
assert_test("validate_file_content() Sahte PNG Reddetme", validate_file_content($tmpFake, 'png') === false);
unlink($tmpFake);

// PDF Sihirli Bayt Testi
$tmpPdf = tempnam(sys_get_temp_dir(), 'test_pdf');
file_put_contents($tmpPdf, "%PDF-1.4\n%...\n");
assert_test("validate_file_content() Gerçek PDF Doğrulama", validate_file_content($tmpPdf, 'pdf') === true);
unlink($tmpPdf);

// SVG XSS Testi (İçinde script barındıran SVG reddedilmeli)
$tmpSvgBad = tempnam(sys_get_temp_dir(), 'test_svg_bad');
file_put_contents($tmpSvgBad, "<svg xmlns='http://www.w3.org/2000/svg'><script>alert(1)</script></svg>");
assert_test("validate_file_content() Script İçeren SVG Reddi", validate_file_content($tmpSvgBad, 'svg') === false);
unlink($tmpSvgBad);

// Rate Limiting
assert_test("check_rate_limit() İlk İstek Kabul", check_rate_limit('test_action', 5, 60));
echo "\n";

// 4. OTURUM VE KİMLİK DOĞRULAMA TESTİ
echo "4. Kimlik Doğrulama ve Parola Güvenliği:\n";
$testPassword = "SuperGucluParola!2026";
$hashed = password_hash($testPassword, PASSWORD_DEFAULT);
assert_test("password_hash() Üretimi", !empty($hashed));
assert_test("password_verify() Doğru Parola", password_verify($testPassword, $hashed));
assert_test("password_verify() Yanlış Parola Reddi", !password_verify("YanlisParola", $hashed));
echo "\n";

// 5. PRODUCTION KODUNDA LOCALHOST VE DIRECTUS KALINTI KONTROLÜ
echo "5. Frontend İstemci Dosyalarında Directus ve Localhost Denetimi:\n";
$clientJs = file_get_contents(__DIR__ . '/../assets/js/cms-client.js');
$mainJs = file_get_contents(__DIR__ . '/../assets/js/main.js');

assert_test("cms-client.js localhost:8055 İçermiyor", !str_contains($clientJs, 'localhost:8055'));
assert_test("main.js localhost:8055 İçermiyor", !str_contains($mainJs, 'localhost:8055'));
assert_test("cms-client.js /api/quote Endpoint Kullanıyor", str_contains($clientJs, '/api/quote'));
assert_test("cms-client.js /api/public Endpoint Kullanıyor", str_contains($clientJs, '/api/public'));
echo "\n";

// 6. TEKLİF VE İLETİŞİM SAYFALARINDA METİN KONTROLÜ
echo "6. Sayfa Arayüz Metinleri ve Form Modalları:\n";
$teklifHtml = file_get_contents(__DIR__ . '/../teklif-al/index.html');
assert_test("teklif-al/index.html 'yerel önizleme sürümüdür' notu kaldırılmış", !str_contains($teklifHtml, 'yerel önizleme sürümüdür'));
assert_test("teklif-al/index.html gerçek bilgilendirme mesajı içeriyor", str_contains($teklifHtml, 'güvenle kaydedilmiştir'));
echo "\n";

// 7. CPANEL DAĞITIM PAKETİ TESTİ
echo "7. cPanel Dağıtım Paketi Bütünlüğü:\n";
$zipPath = __DIR__ . '/../nizamlar-cpanel-deploy.zip';
assert_test("nizamlar-cpanel-deploy.zip Mevcut", file_exists($zipPath));
if (file_exists($zipPath)) {
    assert_test("nizamlar-cpanel-deploy.zip Boyutu > 100 KB", filesize($zipPath) > 100000);
}
assert_test("CPANEL_KURULUM_REHBERI.md Mevcut", file_exists(__DIR__ . '/../CPANEL_KURULUM_REHBERI.md'));
echo "\n";

echo "========================================================\n";
echo " TEST ÖZETİ:\n";
echo "   BAŞARILI : {$passed}\n";
echo "   BAŞARISIZ: {$failed}\n";
echo "========================================================\n";

if ($failed > 0) {
    exit(1);
} else {
    echo "🎉 TÜM YEREL DOĞRULAMA TESTLERİ BAŞARIYLA GEÇTİ!\n";
    exit(0);
}
