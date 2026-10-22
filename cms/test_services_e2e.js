/**
 * Nizamlar Baskı — Hizmetlerimiz E2E Gerçek Kayıt Testi
 * Admin panelinden yapılan değişikliğin veritabanına, API'ye,
 * /hizmetlerimiz/ sayfasına ve /hizmetlerimiz/dtf-baski/ detay sayfasına
 * gerçek Chrome tarayıcısı üzerinden anlık yansıdığını test eder.
 */
const { execSync } = require('child_process');
const { adminClient } = require('./lib/env');

const APP_URL = 'http://127.0.0.1:3030';
const CHROME_BIN = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const TEST_TITLE = 'DTF BASKI BAĞLANTI TESTİ 2026';
const ORIGINAL_TITLE = 'DTF Transfer Baskı';

function runChrome(url, userAgent = '') {
  const uaFlag = userAgent ? `--user-agent="${userAgent}"` : '';
  const cmd = `"${CHROME_BIN}" --headless --incognito --disable-gpu --virtual-time-budget=3500 ${uaFlag} --dump-dom "${url}" 2>/dev/null`;
  return execSync(cmd, { encoding: 'utf8', timeout: 15000 });
}

async function run() {
  console.log('======================================================');
  console.log('🧪 HİZMETLERİMİZ UÇTAN UCA ENTEGRASYON VE KAYIT TESTİ');
  console.log('======================================================\n');

  const { api } = await adminClient();

  // 1. Admin kayıt isteği
  process.stdout.write('⏳ [1/7] Admin paneli üzerinden DTF Baskı başlığı değiştiriliyor...');
  const patchRes = await api('PATCH', '/items/services/1', { title: TEST_TITLE });
  if (patchRes && patchRes.title === TEST_TITLE) {
    console.log(' ✅ BAŞARILI');
  } else {
    throw new Error(`Admin kayıt başarısız: ${JSON.stringify(patchRes)}`);
  }

  // 2. Veritabanındaki değer kontrolü
  process.stdout.write('⏳ [2/7] Veritabanı doğrudan sorgulanıyor...');
  const dbItem = await api('GET', '/items/services/1');
  if (dbItem.title === TEST_TITLE) {
    console.log(` ✅ BAŞARILI (DB: "${dbItem.title}")`);
  } else {
    throw new Error(`DB değeri eşleşmiyor: ${dbItem.title}`);
  }

  // 3. /items/services API güncel veri kontrolü
  process.stdout.write('⏳ [3/7] /api/public/services API cevabı kontrol ediliyor...');
  const apiRes = await fetch(`${APP_URL}/api/public/services?slug=dtf-baski`);
  const apiJson = await apiRes.json();
  const apiSvc = apiJson.data && apiJson.data[0];
  if (apiSvc && apiSvc.title === TEST_TITLE) {
    console.log(` ✅ BAŞARILI (API: "${apiSvc.title}")`);
  } else {
    throw new Error(`API güncel veriyi döndürmedi: ${JSON.stringify(apiSvc)}`);
  }

  // 4. /hizmetlerimiz/ sayfası Chrome üzerinde render ediliyor
  process.stdout.write('⏳ [4/7] /hizmetlerimiz/ sayfası headless Chrome ile açılıyor ve DOM denetleniyor...');
  const listHtml = runChrome(`${APP_URL}/hizmetlerimiz/`);
  if (listHtml.includes(TEST_TITLE)) {
    console.log(` ✅ BAŞARILI (Yeni başlık liste sayfasında render edildi)`);
  } else {
    throw new Error('/hizmetlerimiz/ sayfasında test başlığı bulunamadı!');
  }

  // 5. /hizmetlerimiz/dtf-baski/ detay sayfası kontrolü
  process.stdout.write('⏳ [5/7] /hizmetlerimiz/dtf-baski/ sayfası açılıyor ve başlık kontrol ediliyor...');
  const detailHtml = runChrome(`${APP_URL}/hizmetlerimiz/dtf-baski/`);
  if (detailHtml.includes(TEST_TITLE)) {
    console.log(` ✅ BAŞARILI (Detay sayfasında başlık güncellendi)`);
  } else {
    throw new Error('/hizmetlerimiz/dtf-baski/ sayfasında test başlığı bulunamadı!');
  }

  // 6. Sayfa yenilendiğinde değişiklik korunuyor mu?
  process.stdout.write('⏳ [6/7] Sayfa yenileme (2. istek) kontrol ediliyor...');
  const reloadHtml = runChrome(`${APP_URL}/hizmetlerimiz/dtf-baski/`);
  if (reloadHtml.includes(TEST_TITLE)) {
    console.log(` ✅ BAŞARILI (Yenileme sonrası değişiklik korundu)`);
  } else {
    throw new Error('Sayfa yenilendikten sonra test başlığı kayboldu!');
  }

  // 7. Gizli sekme / farklı istemci bağlamı kontrolü
  process.stdout.write('⏳ [7/7] Farklı istemci / gizli sekme simülasyonu kontrol ediliyor...');
  const incognitoHtml = runChrome(`${APP_URL}/hizmetlerimiz/dtf-baski/`, 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15');
  if (incognitoHtml.includes(TEST_TITLE)) {
    console.log(` ✅ BAŞARILI (Farklı tarayıcı oturumunda da yansıdı)`);
  } else {
    throw new Error('Farklı istemci oturumunda test başlığı görünmedi!');
  }

  // Temizlik ve orijinal başlığı geri yükleme
  console.log('\n🧹 Orijinal başlık geri yükleniyor...');
  await api('PATCH', '/items/services/1', { title: ORIGINAL_TITLE });
  const restored = await api('GET', '/items/services/1');
  if (restored.title === ORIGINAL_TITLE) {
    console.log(`↩️  DTF Baskı başlığı başarıyla geri yüklendi: "${restored.title}"`);
  } else {
    console.warn('⚠️  Başlık geri yüklenirken uyarı:', restored);
  }

  console.log('\n======================================================');
  console.log('🎉 7/7 ADIM TAM BAŞARILI: HİZMETLERİMİZ ENTEGRASYONU KANITLANDI!');
  console.log('======================================================');
}

run().catch(err => {
  console.error('\n❌ TEST BAŞARISIZ:', err.message);
  process.exit(1);
});
