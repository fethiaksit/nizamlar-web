/**
 * NİZAMLAR BASKI — KULLANICI İSTEĞİ 10 MADDELİK KAPSAMLI TEST SÜİTİ
 */

const SERVER_URL = 'http://localhost:3030';
const { adminClient } = require('./lib/env');

async function run() {
  console.log('\n======================================================');
  console.log('🧪 NİZAMLAR BASKI — 10 MADDELİK HİZMET YÖNLENDİRME TESTİ');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;
  const { api } = await adminClient();

  function record(no, title, ok, details = '') {
    if (ok) {
      passed++;
      console.log(`✅ [TEST ${no}] ${title}`);
    } else {
      failed++;
      console.error(`❌ [TEST ${no}] ${title} — ${details}`);
    }
  }

  // ID 2 verisini kontrol et
  const service2 = await api('GET', '/items/services/2');
  console.log(`🔍 Directus ID 2 Durumu: Başlık="${service2.title}", Slug="${service2.slug}", Durum="${service2.status}"\n`);

  // 1. /hizmetlerimiz/ açılıyor mu?
  const res1 = await fetch(`${SERVER_URL}/hizmetlerimiz/`);
  const html1 = await res1.text();
  record(1, '/hizmetlerimiz/ sayfası açılıyor mu (HTTP 200)?', res1.status === 200 && html1.includes('Tekstil Baskı'));

  // 2. /hizmetlerimiz/emprime-baski/ açılıyor mu?
  const res2 = await fetch(`${SERVER_URL}/hizmetlerimiz/emprime-baski/`);
  const html2 = await res2.text();
  record(2, '/hizmetlerimiz/emprime-baski/ açılıyor mu (HTTP 200)?', res2.status === 200 && html2.includes('Emprime Baskı'));

  // 3. Listedeki Emprime Baskı bağlantısı doğru mu?
  const hasEmprimeLink = html1.includes('/hizmetlerimiz/emprime-baski/') || html1.includes('../hizmetlerimiz/emprime-baski/');
  record(3, 'Hizmetlerimiz listesindeki Emprime Baskı bağlantısı güncel slug ile eşleşiyor mu?', hasEmprimeLink);

  // 4. Menüden hizmete ulaşılabiliyor mu?
  const resHome = await fetch(`${SERVER_URL}/`);
  const homeHtml = await resHome.text();
  const menuHasEmprime = homeHtml.includes('hizmetlerimiz/emprime-baski/') || html1.includes('hizmetlerimiz/emprime-baski/');
  record(4, 'Menüden (masaüstü & açılır menü) Emprime Baskı hizmetine ulaşılabiliyor mu?', menuHasEmprime);

  // 5 & 6. Hizmet adı değiştirildiğinde yeni URL çalışıyor mu & Eski URL 301 yönlendirmesi yapıyor mu?
  let testSlug = null;
  try {
    const updated = await api('PATCH', '/items/services/2', { title: 'Özel Emprime Baskı Çözümleri' });
    testSlug = updated.slug;
    
    // 5: Yeni URL kontrolü
    const resNew = await fetch(`${SERVER_URL}/hizmetlerimiz/${testSlug}/`, { redirect: 'manual' });
    record(5, 'Hizmet adı değişince yeni URL (Türkçe slug) otomatik oluşuyor ve açılıyor mu?', resNew.status === 200 && testSlug === 'ozel-emprime-baski-cozumleri');

    // 6: Eski URL 301 yönlendirmesi
    const resRedirect = await fetch(`${SERVER_URL}/hizmetlerimiz/emprime-baski/`, { redirect: 'manual' });
    const location = resRedirect.headers.get('location');
    record(6, 'Eski URL (emprime-baski) yeni URL\'ye 301 ile yönleniyor mu?', resRedirect.status === 301 && location === `/hizmetlerimiz/${testSlug}/`);

  } finally {
    // ID 2'yi eski haline getir
    await api('PATCH', '/items/services/2', {
      title: 'Emprime Baskı',
      slug: 'emprime-baski',
      old_slugs: ['serigrafi-baski']
    });
    // Geçici test yönlendirmelerini temizle
    const redList = await api('GET', '/items/url_redirects');
    for (const r of redList) {
      if (r.to_path && r.to_path.includes('ozel-emprime')) {
        await api('DELETE', `/items/url_redirects/${r.id}`);
      }
    }
  }

  // 7. Admin panelindeki "Bu Sayfaya Git" doğru adresi açıyor mu?
  const bridgeRes = await fetch(`${SERVER_URL}/go/services/emprime-baski`, { redirect: 'manual' });
  record(7, 'Admin paneli "Bu Sayfaya Git" köprüsü doğru web sitesi URL\'sine yönlendiriyor mu?', bridgeRes.status === 302 && bridgeRes.headers.get('location') === '/hizmetlerimiz/emprime-baski/');

  // 8. Mobil menüde aynı bağlantılar çalışıyor mu?
  const hasMobileLink = homeHtml.includes('mobile-submenu-link') && (homeHtml.includes('hizmetlerimiz/emprime-baski/'));
  record(8, 'Mobil menüde Emprime Baskı güncel bağlantısı mevcut mu?', hasMobileLink);

  // 9. Yeni hizmet eklenince sayfası otomatik açılıyor mu?
  let createdId = null;
  try {
    const created = await api('POST', '/items/services', {
      title: 'Süblimasyon Transfer Baskı',
      status: 'published',
      short_desc: 'Spor formaları ve bayrak kumaşları için derinlemesine boyama çözümü.',
      content: '<p>Yüksek ısı altında gaz fazına geçen boyalar polyester liflerin içine işler.</p>',
      features: ['Sıfır Tuşe Hissi', 'Nefes Alan Yapı']
    });
    createdId = created.id;
    const resCreated = await fetch(`${SERVER_URL}/hizmetlerimiz/${created.slug}/`, { redirect: 'manual' });
    record(9, 'Yeni hizmet eklenince dinamik sayfası otomatik açılıyor mu (manuel HTML klasörü olmadan)?', resCreated.status === 200);
  } finally {
    if (createdId) {
      await api('DELETE', `/items/services/${createdId}`);
    }
  }

  // 10. Taslak hizmet ziyaretçilerden gizleniyor mu?
  let draftId = null;
  try {
    const draftItem = await api('POST', '/items/services', {
      title: 'Gizli Taslak Hizmet',
      status: 'draft',
      short_desc: 'Henüz yayımlanmamış hizmet.'
    });
    draftId = draftItem.id;
    const resDraft = await fetch(`${SERVER_URL}/hizmetlerimiz/${draftItem.slug}/`, { redirect: 'manual' });
    record(10, 'Taslak (draft) statüsündeki hizmet ziyaretçilere 404 döndürüyor mu?', resDraft.status === 404);
  } finally {
    if (draftId) {
      await api('DELETE', `/items/services/${draftId}`);
    }
  }

  // Ek Kontroller: DTF, Serigrafi ve Tişört detay sayfaları
  const dtfRes = await fetch(`${SERVER_URL}/hizmetlerimiz/dtf-baski/`);
  const seriRes = await fetch(`${SERVER_URL}/hizmetlerimiz/serigrafi-baski/`, { redirect: 'manual' });
  const tisortRes = await fetch(`${SERVER_URL}/hizmetlerimiz/tisort-baski/`);
  const parcaRes = await fetch(`${SERVER_URL}/hizmetlerimiz/emprime-parca-baski/`);

  console.log('\n--- Ek Sayfa Kontrolleri ---');
  record('11A', 'DTF Baskı sayfası açılıyor mu (200)?', dtfRes.status === 200);
  record('11B', 'Eski Serigrafi Baskı URL\'si Emprime Baskı\'ya 301 yönleniyor mu?', seriRes.status === 301 && seriRes.headers.get('location') === '/hizmetlerimiz/emprime-baski/');
  record('11C', 'Tişört Baskı sayfası açılıyor mu (200)?', tisortRes.status === 200);
  record('11D', 'Konfeksiyon Parça Baskı sayfası açılıyor mu (200)?', parcaRes.status === 200);

  console.log('\n======================================================');
  console.log(`🏁 SONUÇ: ${passed} / ${passed + failed} TEST BAŞARILI`);
  console.log('======================================================\n');

  if (failed > 0) process.exit(1);
}

run().catch(e => {
  console.error('Test hatası:', e);
  process.exit(1);
});
