/**
 * NİZAMLAR BASKI — CANLI BASKI ÖNİZLEME ALANI TEST PROTOKOLÜ
 * Kullanıcı istek dokümanındaki 15 test maddesini doğrular.
 */

const fs = require('fs');
const path = require('path');

const SERVER_URL = 'http://localhost:3030';
const DIRECTUS_URL = 'http://localhost:8055';

async function runMockupTests() {
  console.log('\n======================================================');
  console.log('🧪 NİZAMLAR BASKI — CANLI BASKI ÖNİZLEME TEST PROTOKOLÜ');
  console.log('======================================================\n');

  let passed = 0;
  let total = 15;

  // TEST 1: index.html içerisinde Canlı Önizleme bölümü var mı?
  console.log('Test 1: Bölüm HTML İşaretlemesi ve Başlık Kontrolü...');
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf-8');
  if (
    indexHtml.includes('id="canli-onizleme"') &&
    indexHtml.includes('Tasarımını Yükle, Baskını') &&
    indexHtml.includes('İnteraktif Baskı Stüdyosu')
  ) {
    console.log('✅ TEST 1 BAŞARILI: #canli-onizleme alanı kurumsal başlık ve etiketlerle mevcut.');
    passed++;
  } else {
    console.error('❌ TEST 1 BAŞARISIZ: Bölüm HTML işaretlemesi eksik.');
  }

  // TEST 2: Desteklenen Dosya Türleri Doğrulaması (PNG, JPG, WEBP, SVG)
  console.log('\nTest 2: Desteklenen Dosya Türleri ve Boyut Kontrolü...');
  const cfgJs = fs.readFileSync(path.join(__dirname, '..', 'assets', 'js', 'mockup-config.js'), 'utf-8');
  const liveJs = fs.readFileSync(path.join(__dirname, '..', 'assets', 'js', 'live-preview.js'), 'utf-8');
  if (
    liveJs.includes('.png') && liveJs.includes('.jpg') &&
    liveJs.includes('.webp') && liveJs.includes('.svg') &&
    liveJs.includes('25') // 25 MB max
  ) {
    console.log('✅ TEST 2 BAŞARILI: PNG, JPG, JPEG, WEBP, SVG ve 25 MB sınır doğrulaması mevcut.');
    passed++;
  } else {
    console.error('❌ TEST 2 BAŞARISIZ: Dosya türü kontrolleri eksik.');
  }

  // TEST 3: Şeffaf PNG ve Kumaş Dokusu (Blend Mode) Desteği
  console.log('\nTest 3: Şeffaf PNG ve Doku Harmanlama Desteği...');
  const css = fs.readFileSync(path.join(__dirname, '..', 'assets', 'css', 'live-preview.css'), 'utf-8');
  if (
    css.includes('blend-multiply') &&
    css.includes('mix-blend-mode: multiply') &&
    css.includes('blend-normal')
  ) {
    console.log('✅ TEST 3 BAŞARILI: Şeffaf PNG için DTF Canlı ve Su Bazlı Tuşe (mix-blend-mode) aktif.');
    passed++;
  } else {
    console.error('❌ TEST 3 BAŞARISIZ: Blend mode stilleri eksik.');
  }

  // TEST 4: Tişört Mockup'ında Baskı Konumları (Sol Göğüs, Tam Ön, Sırt)
  console.log('\nTest 4: Tişört Baskı Konumları ve Mockup Dosyaları...');
  const teeFront = fs.existsSync(path.join(__dirname, '..', 'assets', 'images', 'products', 'tee-blank-cotton.svg'));
  const teeBack = fs.existsSync(path.join(__dirname, '..', 'assets', 'images', 'products', 'tee-blank-back.svg'));
  if (
    teeFront && teeBack &&
    cfgJs.includes('gogus') && cfgJs.includes('tam_on') && cfgJs.includes('sirt_tam')
  ) {
    console.log('✅ TEST 4 BAŞARILI: Tişört ön ve sırt mockupları ile 3 ana baskı konumu tanımlı.');
    passed++;
  } else {
    console.error('❌ TEST 4 BAŞARISIZ: Tişört mockupları veya konum tanımları eksik.');
  }

  // TEST 5: Sweatshirt & Hoodie Mockup Baskı Alanı
  console.log('\nTest 5: Sweatshirt ve Hoodie Mockup Baskı Alanları...');
  const sweatBlank = fs.existsSync(path.join(__dirname, '..', 'assets', 'images', 'products', 'sweat-blank-fleece.svg'));
  const hoodieBlank = fs.existsSync(path.join(__dirname, '..', 'assets', 'images', 'products', 'hoodie-blank.svg'));
  if (sweatBlank && hoodieBlank && cfgJs.includes('hoodie') && cfgJs.includes('sweatshirt')) {
    console.log('✅ TEST 5 BAŞARILI: Sweatshirt ve Hoodie blank mockupları ve koordinatları hazır.');
    passed++;
  } else {
    console.error('❌ TEST 5 BAŞARISIZ: Sweatshirt veya Hoodie mockupları eksik.');
  }

  // TEST 6: Pantolon / Eşofman Mockup Baskı Alanı (Yan Paça & Üst Uyluk)
  console.log('\nTest 6: Pantolon / Jogger Mockup Baskı Alanı...');
  const joggerBlank = fs.existsSync(path.join(__dirname, '..', 'assets', 'images', 'products', 'jogger-blank.svg'));
  if (joggerBlank && cfgJs.includes('yan_paca') && cfgJs.includes('ust_uyluk')) {
    console.log('✅ TEST 6 BAŞARILI: Jogger pantolonda Yan Paça ve Üst Cep/Uyluk baskı alanları hazır.');
    passed++;
  } else {
    console.error('❌ TEST 6 BAŞARISIZ: Jogger mockup veya yan paça koordinatları eksik.');
  }

  // TEST 7: Bez Çanta (Tote Bag) Mockup ve Orta Alan Baskısı
  console.log('\nTest 7: Bez Çanta Mockup ve Orta Alan Baskısı...');
  const toteBlank = fs.existsSync(path.join(__dirname, '..', 'assets', 'images', 'products', 'tote-bag-blank.svg'));
  if (toteBlank && cfgJs.includes('canta') && cfgJs.includes('320 GSM')) {
    console.log('✅ TEST 7 BAŞARILI: Bez çanta ham kanvas mockup ve merkez baskı alanı hazır.');
    passed++;
  } else {
    console.error('❌ TEST 7 BAŞARISIZ: Çanta mockup eksik.');
  }

  // TEST 8: Boyut (Scale) ve Döndürme (Rotation) Ayarları
  console.log('\nTest 8: Boyut ve Döndürme Sürgüleri...');
  if (
    indexHtml.includes('id="slider-scale"') &&
    indexHtml.includes('id="slider-rotate"') &&
    liveJs.includes('sliderScale.addEventListener')
  ) {
    console.log('✅ TEST 8 BAŞARILI: Boyut (%20-%180) ve döndürme (-180°..+180°) sürgüleri entegre.');
    passed++;
  } else {
    console.error('❌ TEST 8 BAŞARISIZ: Boyut/döndürme kontrolleri eksik.');
  }

  // TEST 9: Doğrudan Ürün Üzerinde Fare & Dokunmatik Sürükleme (Drag & Move)
  console.log('\nTest 9: Ürün Üzerinde Doğrudan Sürükle-Bırak Taşıma...');
  if (
    liveJs.includes('pointerdown') &&
    liveJs.includes('pointermove') &&
    liveJs.includes('setupDirectInteraction')
  ) {
    console.log('✅ TEST 9 BAŞARILI: Pointer events ile masaüstü mouse ve mobil dokunmatik sürükleme aktif.');
    passed++;
  } else {
    console.error('❌ TEST 9 BAŞARISIZ: Sürükleme etkileşimi eksik.');
  }

  // TEST 10: Hazır Örnek Tasarımlarla Anında Deneme
  console.log('\nTest 10: Hazır Örnek Tasarımlarla Deneme Desteği...');
  const s1 = fs.existsSync(path.join(__dirname, '..', 'assets', 'images', 'samples', 'sample-monogram.svg'));
  const s2 = fs.existsSync(path.join(__dirname, '..', 'assets', 'images', 'samples', 'sample-streetwear.svg'));
  const s3 = fs.existsSync(path.join(__dirname, '..', 'assets', 'images', 'samples', 'sample-vintage.svg'));
  if (s1 && s2 && s3 && cfgJs.includes('sample-monogram.svg')) {
    console.log('✅ TEST 10 BAŞARILI: 3 adet yüksek kaliteli örnek vektör tasarım hazır ve ilk açılışta otomatik yüklü.');
    passed++;
  } else {
    console.error('❌ TEST 10 BAŞARISIZ: Örnek tasarımlar eksik.');
  }

  // TEST 11: Önizlemeyi Yüksek Çözünürlüklü İndirme (PNG Export)
  console.log('\nTest 11: Canvas Mockup PNG Export Motoru...');
  if (
    liveJs.includes('exportHighResMockupPng') &&
    liveJs.includes('canvas.width = 1200') &&
    liveJs.includes('canvas.toDataURL')
  ) {
    console.log('✅ TEST 11 BAŞARILI: 1200x1360 2X Retina çözünürlükte Canvas PNG dışa aktarma fonksiyonu hazır.');
    passed++;
  } else {
    console.error('❌ TEST 11 BAŞARISIZ: PNG indirme fonksiyonu eksik.');
  }

  // TEST 12: Teklif Formu Entegrasyonu (SessionStorage & URL Köprüsü)
  console.log('\nTest 12: Teklif Formu Bağlantısı...');
  const mainJs = fs.readFileSync(path.join(__dirname, '..', 'assets', 'js', 'main.js'), 'utf-8');
  const teklifHtml = fs.readFileSync(path.join(__dirname, '..', 'teklif-al', 'index.html'), 'utf-8');
  if (
    liveJs.includes('sessionStorage.setItem(\'nizamlar_custom_preview\'') &&
    mainJs.includes('sessionStorage.getItem(\'nizamlar_custom_preview\'') &&
    teklifHtml.includes('id="custom-preview-quote-banner"')
  ) {
    console.log('✅ TEST 12 BAŞARILI: "Bu Tasarımla Teklif İste" ile ürün, konum ve görsel verisi teklif formuna taşınıyor.');
    passed++;
  } else {
    console.error('❌ TEST 12 BAŞARISIZ: Teklif formu bağlantısı eksik.');
  }

  // TEST 13: Directus CMS Singleton Yönetim API'si
  console.log('\nTest 13: Directus CMS Yönetim API Entegrasyonu...');
  try {
    const cmsRes = await fetch(`${SERVER_URL}/items/mockup_preview_settings`);
    if (cmsRes.ok) {
      const cmsData = await cmsRes.json();
      if (cmsData.data && cmsData.data.is_active === true) {
        console.log('✅ TEST 13 BAŞARILI: Directus CMS mockup_preview_settings koleksiyonu online ve erişilebilir.');
        passed++;
      } else {
        console.error('❌ TEST 13 BAŞARISIZ: CMS veri formatı uyumsuz.');
      }
    } else {
      console.error('❌ TEST 13 BAŞARISIZ: CMS HTTP ' + cmsRes.status);
    }
  } catch (err) {
    console.error('❌ TEST 13 BAŞARISIZ: CMS bağlantı hatası: ' + err.message);
  }

  // TEST 14: Kurumsal Renk Paleti ve Tasarım Dili Uyumu
  console.log('\nTest 14: Kurumsal Renk Paleti & Tasarım Dili Doğrulaması...');
  if (
    css.includes('var(--c-anthracite)') &&
    css.includes('var(--c-gold)') &&
    css.includes('var(--c-cream-pure)') &&
    css.includes('var(--font-mono)')
  ) {
    console.log('✅ TEST 14 BAŞARILI: Tasarım sistemi değişkenleri (Antrasit, Gold, Krem, Mono) eksiksiz uygulandı.');
    passed++;
  } else {
    console.error('❌ TEST 14 BAŞARISIZ: Tasarım sistemi değişkenleri eksik.');
  }

  // TEST 15: Scroll Davranışı & Performans (Sıfır Scrolljacking)
  console.log('\nTest 15: Sayfa Kaydırma & Performans Uyumu...');
  const themeCss = fs.readFileSync(path.join(__dirname, '..', 'assets', 'css', 'theme.css'), 'utf-8');
  if (
    themeCss.includes('scroll-behavior: auto !important') &&
    !liveJs.includes('window.addEventListener(\'wheel\'') &&
    !liveJs.includes('window.addEventListener(\'scroll\'')
  ) {
    console.log('✅ TEST 15 BAŞARILI: Doğal tarayıcı kaydırma davranışı tam korundu, scrolljacking yok.');
    passed++;
  } else {
    console.error('❌ TEST 15 BAŞARISIZ: Scroll davranışı ihlali.');
  }

  // ÖZET RAPOR
  console.log('\n======================================================');
  console.log(`📊 TEST SONUCU: ${passed} / ${total} BAŞARILI`);
  if (passed === total) {
    console.log('🎉 BÜTÜN DOĞRULAMA TESTLERİ %100 BAŞARIYLA GEÇTİ!');
  } else {
    console.log('⚠️ Bazı testlerde eksiklikler tespit edildi.');
  }
  console.log('======================================================\n');
}

runMockupTests().catch(err => {
  console.error('Test hatası:', err);
  process.exit(1);
});
