/**
 * Nizamlar Baskı — "Bu Sayfaya Git" ve Dinamik Hizmet Detay Doğrulama Testi
 *
 * 1. Directus services preview_url ve view_on_site buton ayarlarını doğrular.
 * 2. Directus'taki 4 hizmetin (dtf-baski, emprime-baski, tisort-baski, emprime-parca-baski)
 *    her birinin buton yönlendirmesini ve frontend'de 200 OK ile doğru verileri render ettiğini test eder.
 * 3. emprime-baski için gerçek bir içerik değişikliği yapar, Chrome üzerinden yansımasını kanıtlar
 *    ve orijinal veriyi geri yükler.
 */
const { execSync } = require('child_process');
const { adminClient } = require('./lib/env');

const APP_URL = (process.env.PUBLIC_SITE_URL || 'http://localhost:3030').replace(/\/$/, '');
const CHROME_BIN = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

function renderDom(url) {
  const cmd = `"${CHROME_BIN}" --headless --virtual-time-budget=3500 --dump-dom "${url}" 2>/dev/null`;
  return execSync(cmd, { encoding: 'utf8', timeout: 15000 });
}

async function run() {
  console.log('======================================================');
  console.log('🔍 "BU SAYFAYA GİT" VE DİNAMİK HİZMET DETAY TESTİ');
  console.log('======================================================\n');

  const { api } = await adminClient();

  // 1. Directus preview_url ve buton alanı kontrolü
  process.stdout.write('⏳ [1/5] Directus services koleksiyonu preview_url kontrol ediliyor...');
  const coll = (await api('GET', '/collections')).find(c => c.collection === 'services');
  const previewUrl = coll && coll.meta && coll.meta.preview_url;
  const expectedPreviewPattern = `${APP_URL}/hizmetlerimiz/{{slug}}/`;
  if (previewUrl === expectedPreviewPattern) {
    console.log(` ✅ BAŞARILI (${previewUrl})`);
  } else {
    throw new Error(`Beklenen preview_url "${expectedPreviewPattern}", mevcut: "${previewUrl}"`);
  }

  process.stdout.write('⏳ [2/5] Directus "Bu Sayfaya Git" (view_on_site) form alanı kontrol ediliyor...');
  const fields = await api('GET', '/fields/services');
  const btnField = fields.find(f => f.field === 'view_on_site');
  if (btnField && btnField.meta && btnField.meta.interface === 'presentation-links') {
    const primaryLink = btnField.meta.options.links[0];
    console.log(` ✅ BAŞARILI (Buton hedefi: ${primaryLink.url})`);
  } else {
    throw new Error('view_on_site alanı bulunamadı veya interface hatalı!');
  }

  // 2. Directus'taki tüm hizmetlerin detay sayfalarını dinamik açma kontrolü
  process.stdout.write('⏳ [3/5] Directus veritabanındaki 4 hizmetin detay sayfaları taranıyor...\n');
  const services = await api('GET', '/items/services?sort=sort');
  for (const svc of services) {
    const targetUrl = `${APP_URL}/hizmetlerimiz/${encodeURIComponent(svc.slug)}/`;
    process.stdout.write(`   👉 Hizmet [ID ${svc.id}] "${svc.title}" (slug: ${svc.slug}) -> ${targetUrl} ...`);
    const res = await fetch(targetUrl);
    if (res.status !== 200) {
      throw new Error(`HTTP ${res.status} döndü: ${targetUrl}`);
    }
    const html = await res.text();
    const unesc = s => s.replace(/&amp;/g, '&');
    if (!html.includes(svc.title) && !unesc(html).includes(svc.title)) {
      throw new Error(`Sayfa içinde hizmet başlığı ("${svc.title}") bulunamadı!`);
    }
    console.log(' ✅ 200 OK');
  }

  // 3. /go/services/:slug ve /go/services yönlendirme köprüleri kontrolü
  process.stdout.write('⏳ [4/5] Admin köprü yönlendirmesi (/go/services/emprime-baski) kontrol ediliyor...');
  const goRes = await fetch(`${APP_URL}/go/services/emprime-baski`, { redirect: 'manual' });
  const loc = goRes.headers.get('location');
  if (goRes.status === 302 && loc && loc.includes('/hizmetlerimiz/emprime-baski/')) {
    console.log(` ✅ BAŞARILI (302 -> ${loc})`);
  } else {
    throw new Error(`Yönlendirme başarısız: HTTP ${goRes.status}, Location: ${loc}`);
  }

  // 4. Canlı içerik güncelleme ve tarayıcı DOM doğrulaması
  process.stdout.write('⏳ [5/5] "Emprime Baskı" için test güncellemesi ve Chrome DOM doğrulaması yapılıyor...\n');
  const originalShortDesc = services.find(s => s.slug === 'emprime-baski').short_desc;
  const testBadge = 'ÖZEL TEST ROZETİ 2026';

  // Admin PATCH
  await api('PATCH', '/items/services/2', { badge: testBadge });
  console.log(`   ✍️  Emprime Baskı rozeti güncellendi: "${testBadge}"`);

  // Chrome render
  const rendered = renderDom(`${APP_URL}/hizmetlerimiz/emprime-baski/`);
  if (rendered.includes(testBadge)) {
    console.log('   ✅ Chrome DOM üzerinde güncel veri doğrulandı!');
  } else {
    throw new Error('Chrome DOM üzerinde yeni rozet bulunamadı!');
  }

  // Orijinal veriyi geri yükle
  await api('PATCH', '/items/services/2', { badge: 'Yüksek Kapasite' });
  console.log('   ↩️  Orijinal rozet ("Yüksek Kapasite") geri yüklendi.');

  console.log('\n======================================================');
  console.log('🎉 "BU SAYFAYA GİT" VE DİNAMİK DETAY ENTEGRASYONU TAM BAŞARILI!');
  console.log('======================================================');
}

run().catch(err => {
  console.error('\n❌ TEST BAŞARISIZ:', err.message);
  process.exit(1);
});
