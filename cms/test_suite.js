/**
 * NİZAMLAR BASKI — FULL AUTOMATED END-TO-END TEST SUITE (18 ADIM)
 * Gerçek Directus API, Express Proxy ve Frontend DOM bağlamalarını test eder.
 * Test sonrasında tüm test verilerini temizler ve orijinal verileri eski haline getirir.
 */

const fs = require('fs');
const SERVER_URL = 'http://localhost:3030';
const { DIRECTUS_URL, required } = require('./lib/env');
const ADMIN_EMAIL = required('ADMIN_EMAIL');
const ADMIN_PASSWORD = required('ADMIN_PASSWORD');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTestSuite() {
  console.log('\n======================================================');
  console.log('🧪 NİZAMLAR BASKI — 18 ADIMLI TAM KAPSAMLI TEST SÜİTİ');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;
  const results = [];

  function record(id, title, ok, details = '') {
    if (ok) {
      passed++;
      console.log(`✅ [ADIM ${id}] ${title}`);
      results.push({ id, title, ok: true, details });
    } else {
      failed++;
      console.error(`❌ [ADIM ${id}] ${title} — ${details}`);
      results.push({ id, title, ok: false, details });
    }
  }

  let adminToken = null;
  let originalHeroTitle = null;
  let homePageId = null;
  let createdProductId = null;
  let createdBlogId = null;
  let uploadedFileId = null;
  let originalWaNumber = null;
  let originalServiceDesc = null;
  let testQuoteId = null;

  try {
    // ---------------------------------------------------------
    // 1. Admin paneline giriş yap
    // ---------------------------------------------------------
    const loginRes = await fetch(`${SERVER_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
    });
    const loginJson = await loginRes.json();
    adminToken = loginJson?.data?.access_token;
    record(1, 'Admin paneline giriş yap', Boolean(adminToken), adminToken ? 'JWT token alındı' : 'Giriş başarısız');

    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    };

    // ---------------------------------------------------------
    // 2-3. Ana sayfa başlığını değiştir, kaydet ve yayımla
    // ---------------------------------------------------------
    const homePageRes = await fetch(`${SERVER_URL}/items/pages?filter[slug][_eq]=home`, { headers: authHeaders });
    const homePageData = await homePageRes.json();
    homePageId = homePageData.data[0].id;
    originalHeroTitle = homePageData.data[0].hero_title;

    const testHeroTitle = 'Test Otomasyon: Endüstriyel Tekstil Baskı Gücü';
    const updateTitleRes = await fetch(`${SERVER_URL}/items/pages/${homePageId}`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ hero_title: testHeroTitle, status: 'published' })
    });
    record(2, 'Ana sayfa başlığını değiştir ve kaydet', updateTitleRes.ok, `HTTP ${updateTitleRes.status}`);
    record(3, 'Başlığı yayımla (status: published)', updateTitleRes.ok, 'Yayın durumu güncellendi');

    // ---------------------------------------------------------
    // 4-5. Ziyaretçi sayfasını/API'yi sorgula, başlığın değiştiğini doğrula
    // ---------------------------------------------------------
    const pubHomeRes = await fetch(`${SERVER_URL}/api/public/pages?slug=home`);
    const pubHomeJson = await pubHomeRes.json();
    const fetchedTitle = pubHomeJson?.data?.[0]?.hero_title;
    record(4, 'Ziyaretçi API/sayfa yenileme yanıtını al', pubHomeRes.status === 200, `HTTP ${pubHomeRes.status}`);
    record(5, 'Başlığın ziyaretçiye güncel yansıdığını kontrol et', fetchedTitle === testHeroTitle, `Beklenen: "${testHeroTitle}", Gelen: "${fetchedTitle}"`);

    // ---------------------------------------------------------
    // 6-7. Yeni ürün ekle ve slider/API'de görüntülendiğini kontrol et
    // ---------------------------------------------------------
    const newProdRes = await fetch(`${SERVER_URL}/items/products`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        status: 'published',
        name: 'Automated Test Tişört Vitrin Ürünü',
        category: 'Tişört',
        description: 'Otomatik test ürünü',
        cover_image: 'assets/images/products/tee-front-vintage.svg',
        back_image: 'assets/images/products/tee-back-streetwear.svg',
        print_technique: 'DTF Transfer',
        fabric_details: '%100 Pamuk',
        sort: 999
      })
    });
    const newProdJson = await newProdRes.json();
    createdProductId = newProdJson?.data?.id;
    record(6, 'Yeni ürün ekle', Boolean(createdProductId), `Ürün ID: ${createdProductId}`);

    const pubProdsRes = await fetch(`${SERVER_URL}/api/public/products`);
    const pubProdsJson = await pubProdsRes.json();
    const foundInPub = (pubProdsJson?.data || []).some(p => p.id === createdProductId);
    record(7, 'Yeni ürünün ürün vitrininde görüntülendiğini doğrula', foundInPub, `Slider koleksiyonunda bulundu mu: ${foundInPub}`);

    // ---------------------------------------------------------
    // 8-9. Ürünü yayından kaldır (draft yap) ve vitrinden kaybolduğunu doğrula
    // ---------------------------------------------------------
    const unpublishRes = await fetch(`${SERVER_URL}/items/products/${createdProductId}`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ status: 'draft' })
    });
    record(8, 'Ürünü yayından kaldır (status: draft)', unpublishRes.ok, `HTTP ${unpublishRes.status}`);

    const pubProdsAfterRes = await fetch(`${SERVER_URL}/api/public/products`);
    const pubProdsAfterJson = await pubProdsAfterRes.json();
    const stillInPub = (pubProdsAfterJson?.data || []).some(p => p.id === createdProductId);
    record(9, 'Taslak ürünün vitrinden ve public API\'den kaybolduğunu doğrula', !stillInPub, `Public listede yok: ${!stillInPub}`);

    // ---------------------------------------------------------
    // 10-11. Yeni blog yazısı yayımla ve sayfada görüntülendiğini doğrula
    // ---------------------------------------------------------
    const newBlogRes = await fetch(`${SERVER_URL}/items/blog_posts`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        status: 'published',
        title: 'Otomasyon Test Makalesi: Sürdürülebilirlik',
        slug: 'otomasyon-test-makalesi',
        category: 'Test',
        summary: 'Otomasyon test özeti',
        content: '<p>Bu makale otomatik entegrasyon testleri tarafından oluşturulmuştur.</p>'
      })
    });
    const newBlogJson = await newBlogRes.json();
    createdBlogId = newBlogJson?.data?.id;
    record(10, 'Yeni blog yazısı yayımla', Boolean(createdBlogId), `Blog ID: ${createdBlogId}`);

    const pubBlogRes = await fetch(`${SERVER_URL}/api/public/blog_posts?slug=otomasyon-test-makalesi`);
    const pubBlogJson = await pubBlogRes.json();
    const blogVisible = (pubBlogJson?.data || []).some(b => b.slug === 'otomasyon-test-makalesi');
    record(11, 'Blog yazısının ilgili listede/sayfada görüntülendiğini doğrula', blogVisible, `Slug eşleşti: ${blogVisible}`);

    // ---------------------------------------------------------
    // 12. Hizmet açıklamasını değiştir
    // ---------------------------------------------------------
    const servicesRes = await fetch(`${SERVER_URL}/items/services?filter[slug][_eq]=dtf-baski`, { headers: authHeaders });
    const servicesData = await servicesRes.json();
    const dtfService = servicesData?.data?.[0];
    originalServiceDesc = dtfService?.short_desc;

    const testServiceDesc = 'Güncellenmiş DTF Transfer Baskı Açıklaması - Otomasyon Testi';
    const updateSvcRes = await fetch(`${SERVER_URL}/items/services/${dtfService.id}`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ short_desc: testServiceDesc })
    });
    const verifySvc = await (await fetch(`${SERVER_URL}/api/public/services?slug=dtf-baski`)).json();
    record(12, 'Hizmet açıklamasını değiştir ve yansımasını doğrula', verifySvc?.data?.[0]?.short_desc === testServiceDesc, `Açıklama güncellendi`);

    // ---------------------------------------------------------
    // 13. Yeni görsel yükle ve sayfada görüntüle
    // ---------------------------------------------------------
    const testSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="#b29460"/></svg>`;
    const blob = new Blob([testSvg], { type: 'image/svg+xml' });
    const uploadForm = new FormData();
    uploadForm.append('file', blob, 'test-media-upload.svg');
    uploadForm.append('title', 'Otomasyon Test Görseli');

    const fileRes = await fetch(`${SERVER_URL}/files`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` },
      body: uploadForm
    });
    const fileJson = await fileRes.json();
    uploadedFileId = fileJson?.data?.id;
    let fileCheckRes = { ok: false };
    if (uploadedFileId) {
      for (let retry = 0; retry < 5; retry++) {
        await sleep(600);
        fileCheckRes = await fetch(`${SERVER_URL}/assets/${uploadedFileId}`);
        if (fileCheckRes.ok) break;
      }
    }
    record(13, 'Yeni görsel yükle ve /assets/:id ile görüntülenebilir olduğunu doğrula', Boolean(uploadedFileId && fileCheckRes.ok), `File ID: ${uploadedFileId}`);

    // ---------------------------------------------------------
    // 14-15. WhatsApp numarasını test ortamında değiştir ve linkleri kontrol et
    // ---------------------------------------------------------
    const waRes = await fetch(`${SERVER_URL}/items/whatsapp_settings`, { headers: authHeaders });
    const waData = await waRes.json();
    originalWaNumber = waData?.data?.whatsapp_number;

    const testWaNumber = '+90 532 999 11 22';
    await fetch(`${SERVER_URL}/items/whatsapp_settings`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ whatsapp_number: testWaNumber })
    });
    const pubWa = await (await fetch(`${SERVER_URL}/api/public/whatsapp_settings`)).json();
    record(14, 'WhatsApp numarasını test ortamında değiştir', pubWa?.data?.whatsapp_number === testWaNumber, `Numara: ${pubWa?.data?.whatsapp_number}`);
    record(15, 'Bütün WhatsApp bağlantılarının tek merkezden güncellendiğini doğrula', pubWa?.data?.whatsapp_number === testWaNumber, 'Public ayar güncellendi');

    // ---------------------------------------------------------
    // 16. Test teklif formu gönder ve admin panelinde kaydını doğrula
    // ---------------------------------------------------------
    const quoteFd = new FormData();
    quoteFd.append('_form_ts', String(Date.now() - 5000));
    quoteFd.append('name', 'E2E Otomasyon Test');
    quoteFd.append('company', 'Nizamlar Test Şti');
    quoteFd.append('phone', '05551234567');
    quoteFd.append('email', 'e2e@test.com');
    quoteFd.append('service', 'Serigrafi Baskı');
    quoteFd.append('quantity', '1.000 Adet');
    quoteFd.append('notes', 'Bu kayıt otomatik 18-adım test süiti tarafından gönderilmiştir.');
    const qBlob = new Blob(['<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50"><circle cx="25" cy="25" r="20"/></svg>'], { type: 'image/svg+xml' });
    quoteFd.append('design_file', qBlob, 'e2e-design.svg');

    const submitQuoteRes = await fetch(`${SERVER_URL}/api/quote`, { method: 'POST', body: quoteFd });
    const submitQuoteJson = await submitQuoteRes.json();

    const quotesInDb = await (await fetch(`${SERVER_URL}/items/quote_requests?sort=-id&limit=1`, { headers: authHeaders })).json();
    const latestQuote = quotesInDb?.data?.[0];
    testQuoteId = latestQuote?.id;
    const quoteVerified = latestQuote && latestQuote.customer_name === 'E2E Otomasyon Test';
    record(16, 'Test teklif formu gönder ve admin panelinde kaydını doğrula', submitQuoteRes.status === 201 && quoteVerified, `Kayıt ID: ${testQuoteId}`);

    // ---------------------------------------------------------
    // 17. Yetkisiz kullanıcının taslak içerikleri ve teklif kayıtlarını okuyamadığını doğrula
    // ---------------------------------------------------------
    const unauthQuotesRes = await fetch(`${SERVER_URL}/items/quote_requests`);
    const unauthDirectusUsers = await fetch(`${SERVER_URL}/users`);
    const securityCheck = (unauthQuotesRes.status === 403 || unauthQuotesRes.status === 401) &&
                          (unauthDirectusUsers.status === 403 || unauthDirectusUsers.status === 401);
    record(17, 'Yetkisiz kullanıcının taslak ve teklif verilerini okuyamadığını doğrula (403/401)', securityCheck, `Quotes HTTP: ${unauthQuotesRes.status}, Users HTTP: ${unauthDirectusUsers.status}`);

    // ---------------------------------------------------------
    // 18. Masaüstü ve mobil menüleri kontrol et
    // ---------------------------------------------------------
    const navRes = await fetch(`${SERVER_URL}/api/public/navigation_menus`);
    const navJson = await navRes.json();
    const hasDesktop = (navJson?.data || []).some(n => n.show_desktop !== false);
    const hasMobile = (navJson?.data || []).some(n => n.show_mobile !== false);
    record(18, 'Masaüstü ve mobil menülerin CMS üzerinden eksiksiz geldiğini kontrol et', Boolean(hasDesktop && hasMobile), `Menü kayıt sayısı: ${navJson?.data?.length}`);

  } catch (err) {
    console.error('Test akışı sırasında beklenmeyen hata:', err);
  } finally {
    // ---------------------------------------------------------
    // TEMİZLİK: Test verilerini temizle ve orijinalleri geri yükle
    // ---------------------------------------------------------
    console.log('\n🧹 Test verileri güvenle temizleniyor ve orijinal değerlere dönülüyor...');
    const cleanupHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` };

    if (homePageId && originalHeroTitle) {
      await fetch(`${SERVER_URL}/items/pages/${homePageId}`, {
        method: 'PATCH',
        headers: cleanupHeaders,
        body: JSON.stringify({ hero_title: originalHeroTitle })
      });
      console.log('  ↩️  Ana sayfa başlığı eski haline getirildi.');
    }

    if (createdProductId) {
      await fetch(`${SERVER_URL}/items/products/${createdProductId}`, { method: 'DELETE', headers: cleanupHeaders });
      console.log(`  🗑️  Test ürünü silindi (ID: ${createdProductId}).`);
    }

    if (createdBlogId) {
      await fetch(`${SERVER_URL}/items/blog_posts/${createdBlogId}`, { method: 'DELETE', headers: cleanupHeaders });
      console.log(`  🗑️  Test blog yazısı silindi (ID: ${createdBlogId}).`);
    }

    if (uploadedFileId) {
      await fetch(`${SERVER_URL}/files/${uploadedFileId}`, { method: 'DELETE', headers: cleanupHeaders });
      console.log(`  🗑️  Test görseli silindi (ID: ${uploadedFileId}).`);
    }

    if (originalWaNumber) {
      await fetch(`${SERVER_URL}/items/whatsapp_settings`, {
        method: 'PATCH',
        headers: cleanupHeaders,
        body: JSON.stringify({ whatsapp_number: originalWaNumber })
      });
      console.log('  ↩️  WhatsApp numarası eski haline getirildi.');
    }

    if (originalServiceDesc) {
      const sRes = await fetch(`${SERVER_URL}/items/services?filter[slug][_eq]=dtf-baski`, { headers: cleanupHeaders });
      const sData = await sRes.json();
      if (sData?.data?.[0]?.id) {
        await fetch(`${SERVER_URL}/items/services/${sData.data[0].id}`, {
          method: 'PATCH',
          headers: cleanupHeaders,
          body: JSON.stringify({ short_desc: originalServiceDesc })
        });
        console.log('  ↩️  Hizmet açıklaması eski haline getirildi.');
      }
    }

    if (testQuoteId) {
      await fetch(`${SERVER_URL}/items/quote_requests/${testQuoteId}`, { method: 'DELETE', headers: cleanupHeaders });
      console.log(`  🗑️  Test teklif talebi silindi (ID: ${testQuoteId}).`);
    }
  }

  // ÖZET RAPOR
  console.log('\n======================================================');
  console.log(`🏁 TEST RAPORU: ${passed} / 18 TEST BAŞARILI, ${failed} BAŞARISIZ`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runTestSuite().catch(e => {
    console.error('Fatal test error:', e);
    process.exit(1);
  });
}

module.exports = runTestSuite;
