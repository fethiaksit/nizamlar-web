/**
 * NİZAMLAR BASKI — DİNAMİK URL & 301 YÖNLENDİRME TEST SÜİTİ
 */

const SERVER_URL = 'http://localhost:3030';
const { adminClient } = require('./lib/env');

async function run() {
  console.log('\n======================================================');
  console.log('🧪 DİNAMİK URL, 301 YÖNLENDİRME VE 404 TESTLERİ');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(name, condition, details = '') {
    if (condition) {
      passed++;
      console.log(`✅ ${name}`);
    } else {
      failed++;
      console.error(`❌ ${name} — ${details}`);
    }
  }

  // 1. Dinamik hizmet sayfaları (200 OK)
  const services = ['dtf-baski', 'emprime-baski', 'tisort-baski', 'emprime-parca-baski'];
  for (const s of services) {
    const res = await fetch(`${SERVER_URL}/hizmetlerimiz/${s}/`, { redirect: 'manual' });
    const text = await res.text();
    assert(`Dinamik hizmet detayı: /hizmetlerimiz/${s}/ (HTTP ${res.status})`, res.status === 200 && text.includes('Nizamlar Baskı'));
  }

  // 2. Trailing slash olmadan istek (301 -> /hizmetlerimiz/emprime-baski/)
  const noSlashRes = await fetch(`${SERVER_URL}/hizmetlerimiz/emprime-baski`, { redirect: 'manual' });
  assert('Trailing slash otomatik tamamlama: /hizmetlerimiz/emprime-baski -> 301', noSlashRes.status === 301 && noSlashRes.headers.get('location') === '/hizmetlerimiz/emprime-baski/');

  // 3. Eski slug 301 kalıcı yönlendirmesi (/hizmetlerimiz/serigrafi-baski/ -> /hizmetlerimiz/emprime-baski/)
  const oldSlugRes = await fetch(`${SERVER_URL}/hizmetlerimiz/serigrafi-baski/`, { redirect: 'manual' });
  assert('Eski slug 301 yönlendirmesi: serigrafi-baski -> emprime-baski', oldSlugRes.status === 301 && oldSlugRes.headers.get('location') === '/hizmetlerimiz/emprime-baski/');

  // 4. Olmayan hizmet (Gerçek 404 ve çalışan linkler)
  const notFoundRes = await fetch(`${SERVER_URL}/hizmetlerimiz/kesinlikle-olmayan-hizmet-999/`, { redirect: 'manual' });
  const notFoundHtml = await notFoundRes.text();
  assert('Olmayan hizmet için gerçek HTTP 404 döndürme', notFoundRes.status === 404);
  assert('404 sayfasında kök-göreli linkler (/hizmetlerimiz/ vb.)', notFoundHtml.includes('href="/hizmetlerimiz/"') && notFoundHtml.includes('href="/"'));

  // 5. Directus Admin "Bu Sayfaya Git" köprüsü
  const bridgeRes = await fetch(`${SERVER_URL}/go/services/emprime-baski`, { redirect: 'manual' });
  assert('Admin "Bu Sayfaya Git" köprü yönlendirmesi (/go/services/:slug)', bridgeRes.status === 302 && bridgeRes.headers.get('location') === '/hizmetlerimiz/emprime-baski/');

  // 6. Sabit kurumsal sayfaların URL kararlılığı
  const homeRes = await fetch(`${SERVER_URL}/`);
  const aboutRes = await fetch(`${SERVER_URL}/hakkimizda/`);
  const contactRes = await fetch(`${SERVER_URL}/iletisim/`);
  assert('Sabit kurumsal sayfaların URL kararlılığı (Ana Sayfa, Hakkımızda, İletişim: 200 OK)', homeRes.status === 200 && aboutRes.status === 200 && contactRes.status === 200);

  console.log('\n======================================================');
  console.log(`🏁 SONUÇ: ${passed} / ${passed + failed} TEST BAŞARILI`);
  console.log('======================================================\n');

  if (failed > 0) process.exit(1);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
