/**
 * NİZAMLAR BASKI — DATA SEED SCRIPT
 * Mevcut tüm site içeriklerini Directus veritabanına aktarır.
 */

const { DIRECTUS_URL, required } = require('./lib/env');
const ADMIN_EMAIL = required('ADMIN_EMAIL');
const ADMIN_PASSWORD = required('ADMIN_PASSWORD');

async function seed() {
  console.log('📦 İçerik aktarımı başlatılıyor...');

  const loginRes = await fetch(`${DIRECTUS_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
  });

  const { data: { access_token } } = await loginRes.json();
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${access_token}`
  };

  // Singleton: yalnızca YOKSA oluşturur. Yöneticinin düzenlemelerini asla ezmez.
  async function insertOrUpdateSingleton(collection, data) {
    const check = await fetch(`${DIRECTUS_URL}/items/${collection}`, { headers });
    const current = await check.json();
    if (current && current.data && current.data.id) {
      console.log(`↩️  Singleton zaten var, dokunulmadı: ${collection}`);
      return;
    }
    const res = await fetch(`${DIRECTUS_URL}/items/${collection}`, { method: 'POST', headers, body: JSON.stringify(data) });
    if (!res.ok) throw new Error(`Singleton oluşturulamadı (${collection}): HTTP ${res.status}`);
    console.log(`✨ Singleton oluşturuldu: ${collection}`);
  }

  // Doğal anahtar: aynı anahtara sahip kayıt varsa atlanır (tekrar kayıt ve ezme yok).
  const NATURAL_KEY = {
    pages: 'slug', products: 'name', services: 'slug', machines: 'name',
    production_processes: 'step_number', references: 'company_name',
    certificates: 'title', blog_posts: 'slug', animations_config: 'key',
    navigation_menus: 'title'
  };

  async function insertItems(collection, items) {
    const key = NATURAL_KEY[collection];
    if (!key) throw new Error(`Doğal anahtar tanımsız: ${collection}`);
    const existingRes = await fetch(`${DIRECTUS_URL}/items/${collection}?limit=-1&fields=${key}`, { headers });
    if (!existingRes.ok) throw new Error(`Mevcut kayıtlar okunamadı (${collection}): HTTP ${existingRes.status}`);
    const existing = new Set((await existingRes.json()).data.map(r => String(r[key])));
    let created = 0, skipped = 0, failed = 0;
    for (const item of items) {
      if (existing.has(String(item[key]))) { skipped++; continue; }
      const res = await fetch(`${DIRECTUS_URL}/items/${collection}`, { method: 'POST', headers, body: JSON.stringify(item) });
      if (res.ok) created++;
      else { failed++; console.error(`❌ Eklenemedi (${collection}/${item[key]}): HTTP ${res.status} ${(await res.text()).slice(0, 160)}`); }
    }
    console.log(`✅ ${collection}: ${created} yeni, ${skipped} mevcut (atlandı)${failed ? `, ${failed} BAŞARISIZ` : ''}`);
    if (failed) process.exitCode = 1;
  }

  // 1. Site Ayarları
  await insertOrUpdateSingleton('site_settings', {
    site_name: 'Nizamlar Baskı',
    tagline: 'Tekstil Baskıda Renk, Kalite ve Güven',
    company_legal_name: 'Nizamlar Baskı Tekstil San. ve Tic. Ltd. Şti.',
    contact_phone: '+90 (212) 000 00 00',
    contact_phone_raw: '+902120000000',
    contact_email: 'info@nizamlarbaski.com',
    working_hours: 'Hafta İçi: 08:30 - 18:30',
    contact_address: 'Organize Sanayi Bölgesi, Tekstilciler Sanayi Sitesi, İstanbul / Türkiye',
    instagram_url: 'https://instagram.com/nizamlarbaski',
    linkedin_url: 'https://linkedin.com/company/nizamlarbaski',
    facebook_url: 'https://facebook.com/nizamlarbaski',
    youtube_url: 'https://youtube.com/@nizamlarbaski'
  });

  // 2. WhatsApp Ayarları
  await insertOrUpdateSingleton('whatsapp_settings', {
    whatsapp_number: '+90 532 000 00 00',
    is_active: true,
    button_text: 'WhatsApp ile Hızlı Teklif Al',
    floating_button_active: true,
    default_message: 'Merhaba Nizamlar Baskı, tekstil baskı çözümleriniz ve fiyat teklifi hakkında bilgi almak istiyorum.',
    agent_name: 'Nizamlar Müşteri Danışmanı',
    display_pages: 'all'
  });

  // 3. Sayfalar (Pages)
  const pages = [
    {
      status: 'published',
      slug: 'home',
      page_name: 'Ana Sayfa',
      title: 'Endüstriyel Güç, Kusursuz Baskı Kalitesi',
      subtitle: 'DTF baskı, serigrafi ve tişört baskıda son teknoloji makine parkuru, yüksek yıkama dayanımı ve sürdürülebilir üretim anlayışıyla tekstil sektörüne profesyonel çözümler sunuyoruz.',
      hero_title: 'Endüstriyel Güç, Kusursuz Baskı Kalitesi',
      hero_subtitle: 'DTF baskı, serigrafi ve tişört baskıda son teknoloji makine parkuru, yüksek yıkama dayanımı ve sürdürülebilir üretim anlayışıyla tekstil sektörüne profesyonel çözümler sunuyoruz.',
      hero_image: 'assets/images/products/tee-back-streetwear.svg',
      hero_video: 'assets/videos/production-loop.mp4',
      hero_btn_text: 'Fiyat Teklifi Al',
      hero_btn_link: 'teklif-al/',
      seo_title: 'Nizamlar Baskı | Tekstil Baskıda Renk, Kalite ve Güven',
      seo_description: 'Nizamlar Baskı; DTF baskı, serigrafi baskı, tişört ve konfeksiyon parça baskı alanlarında ileri teknoloji makine parkuruyla profesyonel çözümler sunar.',
      seo_keywords: 'tekstil baskı, DTF baskı, serigrafi baskı, tişört baskı, emprime'
    },
    {
      status: 'published',
      slug: 'hakkimizda',
      page_name: 'Hakkımızda',
      title: 'Tekstilde 20 Yılı Aşkın Baskı ve İnovasyon Deneyimi',
      subtitle: 'Nizamlar Baskı olarak modern teknolojiyi usta işçilikle harmanlıyor, yüksek kapasiteli üretim gücümüzle dünya markalarına güven veriyoruz.',
      hero_title: 'Tekstilde 20 Yılı Aşkın Baskı ve İnovasyon Deneyimi',
      hero_subtitle: 'Kaliteden ödün vermeyen endüstriyel üretim yaklaşımımız ve sürdürülebilir baskı standartlarımızla tekstil sanayisine değer katıyoruz.',
      hero_image: 'assets/images/machines/screen-print-carousel.svg',
      hero_btn_text: 'Tesisimizi Keşfedin',
      hero_btn_link: 'makine-parkurumuz/',
      seo_title: 'Hakkımızda | Nizamlar Baskı',
      seo_description: 'Nizamlar Baskı kurumsal tarihi, misyonu, vizyonu ve endüstriyel tekstil baskı alanındaki uzmanlığı.',
      seo_keywords: 'nizamlar baskı kurumsal, tekstil baskı firması, istanbul emprime atölyesi'
    },
    {
      status: 'published',
      slug: 'hizmetlerimiz',
      page_name: 'Hizmetlerimiz',
      title: 'Kapsamlı Tekstil Baskı ve Uygulama Hizmetleri',
      subtitle: 'DTF transferden otomatik ahtapot serigrafiye, konfeksiyon parça baskıdan özel efektlere kadar her ihtiyaca özel çözümler.',
      hero_title: 'Kapsamlı Tekstil Baskı ve Uygulama Hizmetleri',
      hero_subtitle: 'İster yüksek adetli kurumsal siparişler ister butik özel koleksiyonlar; her kumaş tipine uygun gelişmiş baskı teknikleri.',
      hero_image: 'assets/images/machines/dtf-printer-station.svg',
      hero_btn_text: 'Teklif Talep Edin',
      hero_btn_link: 'teklif-al/',
      seo_title: 'Hizmetlerimiz | Nizamlar Baskı',
      seo_description: 'DTF baskı, serigrafi, parça baskı, su bazlı ve plastik baskı çözümleri.',
      seo_keywords: 'dtf transfer, serigrafi, emprime baskı, parça baskı'
    },
    {
      status: 'published',
      slug: 'makine-parkurumuz',
      page_name: 'Makine Parkurumuz',
      title: 'Yüksek Kapasiteli Endüstriyel Makine Parkuru',
      subtitle: 'Günde 50.000+ parça baskı kapasitesi, mikron düzeyinde renk doğruluğu ve son teknoloji otomasyon sistemleri.',
      hero_title: 'Yüksek Kapasiteli Endüstriyel Makine Parkuru',
      hero_subtitle: 'Kornit, M&R ve Brother marka en ileri düzey endüstriyel baskı ve kurutma teknolojileri.',
      hero_image: 'assets/images/machines/screen-print-carousel.svg',
      hero_btn_text: 'Kapasite Raporu İste',
      hero_btn_link: 'teklif-al/',
      seo_title: 'Makine Parkurumuz | Nizamlar Baskı',
      seo_description: 'Son teknoloji DTF baskı makineleri, otomatik ahtapot serigrafi makineleri ve fikse tünelleri.',
      seo_keywords: 'baskı makineleri, m&r serigrafi, kornit dtf, tekstil baskı makineleri'
    },
    {
      status: 'published',
      slug: 'uretim-surecleri',
      page_name: 'Üretim Süreçlerimiz',
      title: 'Tasarım Aşamasından Son Sevkiyata Kusursuz Süreç',
      subtitle: 'Renk ayrımından fikseleme ve kalite kontrol kontrollerine kadar titizlikle yürütülen 6 aşamalı üretim protokolü.',
      hero_title: 'Tasarım Aşamasından Son Sevkiyata Kusursuz Süreç',
      hero_subtitle: 'Her partide standart renk doğruluğu ve ISO 9001 sertifikalı kalite güvencesi.',
      hero_image: 'assets/images/simulations/dtf-step-3.svg',
      hero_btn_text: 'Süreçleri İnceleyin',
      hero_btn_link: 'galeri/',
      seo_title: 'Üretim Süreçleri | Nizamlar Baskı',
      seo_description: 'Tekstil baskısında aşama aşama üretim kontrol protokolleri ve kalite testleri.',
      seo_keywords: 'baskı süreci, renk ayrımı, fikseleme, yıkama testi'
    },
    {
      status: 'published',
      slug: 'galeri',
      page_name: 'Üretim Galerisi',
      title: 'Baskı Örneklerimiz ve Üretim Detayları',
      subtitle: 'Farklı kumaş türleri, desen teknikleri ve özel efektlerle üretilmiş zengin portföyümüzü keşfedin.',
      hero_title: 'Baskı Örneklerimiz ve Üretim Detayları',
      hero_subtitle: 'Tişört, sweatshirt, hoodie, pantolon ve aksesuarlarda uyguladığımız baskı örnekleri.',
      hero_image: 'assets/images/products/hoodie-graphic-streetwear.svg',
      hero_btn_text: 'Numune Talep Et',
      hero_btn_link: 'teklif-al/',
      seo_title: 'Üretim & Ürün Galerisi | Nizamlar Baskı',
      seo_description: 'Baskılı tekstil ürünleri galerisi. Yüksek çözünürlüklü detay fotoğrafları ve baskı teknikleri.',
      seo_keywords: 'baskı örnekleri, tişört modelleri, hoodie baskı, kurumsal tekstil'
    },
    {
      status: 'published',
      slug: 'surdurulebilirlik',
      page_name: 'Sürdürülebilirlik',
      title: 'Geleceğe Saygılı, Doğa Dostu Tekstil Baskı',
      subtitle: 'Su bazlı ekolojik boyalar, OEKO-TEX ve GOTS standartlarıyla sıfır atık hedefli sürdürülebilir üretim.',
      hero_title: 'Geleceğe Saygılı, Doğa Dostu Tekstil Baskı',
      hero_subtitle: 'İnsan sağlığına zararsız, geri dönüştürülebilir ve çevreye duyarlı üretim altyapımız.',
      hero_image: 'assets/images/certs/gots.svg',
      hero_btn_text: 'Sertifikalarımız',
      hero_btn_link: 'sertifikalarimiz/',
      seo_title: 'Sürdürülebilirlik | Nizamlar Baskı',
      seo_description: 'Ekolojik tekstil baskı politikamız, GOTS ve OEKO-TEX sertifikasyonlarımız.',
      seo_keywords: 'ekolojik baskı, su bazlı boya, gots tekstil, oeko-tex baskı'
    },
    {
      status: 'published',
      slug: 'sertifikalarimiz',
      page_name: 'Sertifikalarımız',
      title: 'Uluslararası Kalite Standartları ve Sertifikalar',
      subtitle: 'Dünya standartlarında üretim ve güvenlik belgelerimizle şeffaf kalite güvencesi.',
      hero_title: 'Uluslararası Kalite Standartları ve Sertifikalar',
      hero_subtitle: 'OEKO-TEX Standard 100, GOTS ve ISO sertifikalarımız ile güvence altındasınız.',
      hero_image: 'assets/images/certs/oeko-tex.svg',
      hero_btn_text: 'Belgeleri İncele',
      hero_btn_link: '#belgeler',
      seo_title: 'Sertifikalarımız | Nizamlar Baskı',
      seo_description: 'OEKO-TEX 100, GOTS, ISO 9001 ve ISO 14001 kalite sertifikalarımız.',
      seo_keywords: 'oeko-tex 100, gots sertifikası, iso 9001 tekstil'
    },
    {
      status: 'published',
      slug: 'referanslarimiz',
      page_name: 'Referanslarımız',
      title: 'Güvenini Kazandığımız Değerli İş Ortaklarımız',
      subtitle: 'Türkiye\'nin ve dünyanın önde gelen hazır giyim ve moda markalarına gururla hizmet veriyoruz.',
      hero_title: 'Güvenini Kazandığımız Değerli İş Ortaklarımız',
      hero_subtitle: 'Yıllık milyonlarca parça üretim hacmiyle sektör liderlerinin tercihiyiz.',
      hero_image: 'assets/images/products/sweat-oversize-back.svg',
      hero_btn_text: 'İş Ortağımız Olun',
      hero_btn_link: 'teklif-al/',
      seo_title: 'Referanslarımız | Nizamlar Baskı',
      seo_description: 'Nizamlar Baskı kurumsal referansları, iş ortakları ve başarılı tekstil projeleri.',
      seo_keywords: 'tekstil referansları, marka iş birlikleri'
    },
    {
      status: 'published',
      slug: 'blog',
      page_name: 'Blog',
      title: 'Tekstil Baskı Dünyasından Güncel Bilgiler',
      subtitle: 'DTF baskı püf noktaları, serigrafi avantajları ve sektör trendlerini derlediğimiz içerikler.',
      hero_title: 'Tekstil Baskı Dünyasından Güncel Bilgiler',
      hero_subtitle: 'Baskı teknikleri, kumaş uyumu ve endüstriyel üretim rehberleri.',
      hero_image: 'assets/images/products/tee-multicolor-artistic.svg',
      hero_btn_text: 'Yazıları Keşfet',
      hero_btn_link: '#yazilar',
      seo_title: 'Sektörel Blog | Nizamlar Baskı',
      seo_description: 'Tekstil baskı teknolojileri, DTF vs serigrafi karşılaştırmaları ve teknik makaleler.',
      seo_keywords: 'tekstil blog, dtf baskı rehberi, serigrafi ipuçları'
    },
    {
      status: 'published',
      slug: 'iletisim',
      page_name: 'İletişim',
      title: 'Bizimle İletişime Geçin',
      subtitle: 'Tekstil baskı projeleriniz için teknik danışmanlarımızla hemen görüşün, üretim tesisimizi ziyaret edin.',
      hero_title: 'Bizimle İletişime Geçin',
      hero_subtitle: 'Fabrikamız, müşteri temsilcilerimiz ve doğrudan WhatsApp hattımızla 7/24 yanınızdayız.',
      hero_image: 'assets/images/logo-light.svg',
      hero_btn_text: 'WhatsApp ile Yazın',
      hero_btn_link: 'https://wa.me/905320000000',
      seo_title: 'İletişim & Konum | Nizamlar Baskı',
      seo_description: 'Nizamlar Baskı iletişim bilgileri, fabrika adresi, telefon ve e-posta.',
      seo_keywords: 'nizamlar baskı iletişim, telefon, adres, fabrika'
    },
    {
      status: 'published',
      slug: 'teklif-al',
      page_name: 'Teklif Al',
      title: 'Projeniz İçin Hızlı ve Detaylı Fiyat Teklifi Alın',
      subtitle: 'Baskı detaylarınızı girin, tasarım dosyanızı yükleyin; uzman ekibimiz en uygun maliyet analizini dakikalar içinde hazırlasın.',
      hero_title: 'Projeniz İçin Hızlı ve Detaylı Fiyat Teklifi Alın',
      hero_subtitle: 'İster 50 adet numune ister 100.000 adet ihracat partisi; en rekabetçi fiyatlar.',
      hero_image: 'assets/images/products/tee-oversize-graphic.svg',
      hero_btn_text: 'Formu Doldurun',
      hero_btn_link: '#teklif-formu',
      seo_title: 'Online Fiyat Teklifi Al | Nizamlar Baskı',
      seo_description: 'Tekstil baskı fiyat teklifi formu. Tasarım yükleyin, anında teklif alın.',
      seo_keywords: 'baskı teklifi al, tişört baskı fiyatları, toptan tekstil baskı teklifi'
    }
  ];
  await insertItems('pages', pages);

  // 4. Baskılı Tekstil Ürünleri (Products)
  const products = [
    {
      status: 'published',
      sort: 1,
      name: 'Oversize Streetwear Grafik Tişört',
      category: 'Tişört',
      description: 'Yüksek çözünürlüklü DTF transfer ve yumuşak tuşe baskı. 240 GSM kompakt penye pamuk kumaş üzerinde solmaya karşı ultra dayanıklı baskı.',
      cover_image: 'assets/images/products/tee-oversize-graphic.svg',
      back_image: 'assets/images/products/tee-back-streetwear.svg',
      print_technique: 'DTF Transfer Baskı',
      pattern_type: 'Vektörel & Tipografik Grafik',
      fabric_details: '%100 Kompakt Penye Pamuk (240 GSM)',
      featured: true
    },
    {
      status: 'published',
      sort: 2,
      name: 'Vintage Yıkamalı Sanatsal Tişört',
      category: 'Tişört',
      description: 'Asit yıkama efektli zemin üzerinde mikro degrade serigrafi baskı. Nefes alan su bazlı boyalar ile kumaşla bütünleşen doku.',
      cover_image: 'assets/images/products/tee-front-vintage.svg',
      back_image: 'assets/images/products/tee-blank-cotton.svg',
      print_technique: 'Su Bazlı Serigrafi',
      pattern_type: 'Foto-Gerçekçi Degrade',
      fabric_details: '%100 Organik Ring Pamuk (200 GSM)',
      featured: true
    },
    {
      status: 'published',
      sort: 3,
      name: 'Minimalist Göğüs Logo Tişört',
      category: 'Tişört',
      description: 'Yüksek keskinlikte mikro tipografi ve kabartma (puff) logo baskısı. Kurumsal koleksiyonlar için ideal zarif görünüm.',
      cover_image: 'assets/images/products/tee-minimal-logo.svg',
      back_image: 'assets/images/products/tee-blank-cotton.svg',
      print_technique: 'Mikro DTF & Kabartma',
      pattern_type: 'Tipografik & Logo',
      fabric_details: '%100 Penye Pamuk (180 GSM)',
      featured: true
    },
    {
      status: 'published',
      sort: 4,
      name: 'Çok Renkli İllüstrasyon Tişört',
      category: 'Tişört',
      description: '1440 DPI endüstriyel DTF teknolojisiyle basılmış 16 milyon renk derinliğine sahip sanatsal çizim uygulaması.',
      cover_image: 'assets/images/products/tee-multicolor-artistic.svg',
      back_image: 'assets/images/products/tee-back-streetwear.svg',
      print_technique: '1440 DPI DTF Baskı',
      pattern_type: 'Sanatsal İllüstrasyon',
      fabric_details: '%100 Pamuk Süprem (220 GSM)',
      featured: true
    },
    {
      status: 'published',
      sort: 5,
      name: 'Premium Fermuarlı Ağır Hoodie',
      category: 'Hoodie',
      description: '400 GSM üç iplik şardonlu kumaş üzerine sırt paneli geniş ebat serigrafi ve kolda reflektif baskı.',
      cover_image: 'assets/images/products/hoodie-graphic-streetwear.svg',
      back_image: 'assets/images/products/sweat-oversize-back.svg',
      print_technique: 'Ahtapot Serigrafi & Reflektif',
      pattern_type: 'Vektörel Grafik & Reflektif',
      fabric_details: 'Üç İplik Şardonlu %80 Pamuk / %20 Polyester (400 GSM)',
      featured: true
    },
    {
      status: 'published',
      sort: 6,
      name: 'Kanguru Cepli Streetwear Hoodie',
      category: 'Hoodie',
      description: 'Ön göğüs kabartma logo, kolda tipografik şerit ve sırtta yüksek kontrastlı endüstriyel baskı.',
      cover_image: 'assets/images/products/sweat-front-artwork.svg',
      back_image: 'assets/images/products/sweat-oversize-back.svg',
      print_technique: 'DTF & Kabartma (Puff)',
      pattern_type: 'Tipografik & Grafik',
      fabric_details: '%100 Pamuk Üç İplik (360 GSM)',
      featured: true
    },
    {
      status: 'published',
      sort: 7,
      name: 'Ton-Sür-Ton Premium Sweatshirt',
      category: 'Sweatshirt',
      description: 'Kumaş rengiyle monokrom uyumlu mat silikon baskı. Lüks hazır giyim standartlarında sofistike dokunuş.',
      cover_image: 'assets/images/products/sweat-ton-sur-ton.svg',
      back_image: 'assets/images/products/sweat-blank-fleece.svg',
      print_technique: 'Mat Silikon Serigrafi',
      pattern_type: 'Ton-Sür-Ton',
      fabric_details: '%100 Karbon Fırçalı Pamuk (320 GSM)',
      featured: false
    },
    {
      status: 'published',
      sort: 8,
      name: 'Oversize Sırt Baskılı Sweatshirt',
      category: 'Sweatshirt',
      description: 'Tüm sırtı kaplayan 50x70 cm mega format baskı. Yıkamada çatlama ve soyulma yapmayan elastik polimer transfer.',
      cover_image: 'assets/images/products/sweat-oversize-back.svg',
      back_image: 'assets/images/products/sweat-front-artwork.svg',
      print_technique: 'Mega Format DTF Transfer',
      pattern_type: 'Büyük Boy Sanatsal Grafik',
      fabric_details: 'İki İplik Diyagonal Pamuk (300 GSM)',
      featured: false
    },
    {
      status: 'published',
      sort: 9,
      name: 'Yan Paça Tipografik Jogger Eşofman',
      category: 'Eşofman',
      description: 'Yan dikiş üzerinden kesintisiz uzanan 70 cm boylamasına esnek serigrafi baskı.',
      cover_image: 'assets/images/products/jogger-side-leg.svg',
      back_image: 'assets/images/products/jogger-blank.svg',
      print_technique: 'Elastik Serigrafi',
      pattern_type: 'Tipografik Şerit',
      fabric_details: '%100 Penye Pamuk Eşofman Kumaşı (280 GSM)',
      featured: false
    },
    {
      status: 'published',
      sort: 10,
      name: 'Uyluk Baskılı Pamuklu Jogger Pantolon',
      category: 'Pantolon',
      description: 'Diz üstü uyluk bölgesine uygulanan aşınmaya ve sürtünmeye dayanıklı endüstriyel DTF baskı.',
      cover_image: 'assets/images/products/jogger-graphic-thigh.svg',
      back_image: 'assets/images/products/jogger-blank.svg',
      print_technique: 'Endüstriyel DTF',
      pattern_type: 'Mikro Grafik Logo',
      fabric_details: '%95 Pamuk / %5 Elastan Gabardin',
      featured: false
    },
    {
      status: 'published',
      sort: 11,
      name: 'Özel Tasarım Nefes Alan Spor Forma',
      category: 'Forma',
      description: 'Dry-fit mikro gözenekli kumaşlarda teri hapsetmeyen, kumaş liflerine nüfuz eden süblime ve nefes alan parça baskı.',
      cover_image: 'assets/images/products/sports-jersey.svg',
      back_image: 'assets/images/products/tee-blank-cotton.svg',
      print_technique: 'Dry-Fit Nefes Alan Transfer',
      pattern_type: 'Spor Takım & Numara',
      fabric_details: '%100 Mikro Polyester Dry-Touch (150 GSM)',
      featured: false
    },
    {
      status: 'published',
      sort: 12,
      name: 'Ağır Kanvas Bez Çanta (Tote Bag)',
      category: 'Diğer tekstil ürünleri',
      description: '320 GSM ham pamuk kanvas zemin üzerine çift vuruş opak serigrafi baskı.',
      cover_image: 'assets/images/products/tote-bag-canvas.svg',
      back_image: 'assets/images/products/tote-bag-canvas.svg',
      print_technique: 'Opak Serigrafi',
      pattern_type: 'İllüstrasyon & Tipografi',
      fabric_details: '%100 Ham Pamuk Kanvas (320 GSM)',
      featured: false
    }
  ];
  await insertItems('products', products);

  // 5. Hizmetlerimiz (Services)
  const services = [
    {
      status: 'published',
      sort: 1,
      title: 'DTF Transfer Baskı',
      slug: 'dtf-baski',
      badge: 'Popüler & Esnek',
      capacity_info: 'Günlük 15.000+ Metre / 1440 DPI',
      short_desc: 'Pamuk, polyester, koton-elastan ve her türlü kumaş zeminine kusursuz renk geçişi, yüksek esneklik ve yıkama dayanımı.',
      content: 'DTF (Direct to Film) baskı teknolojisi, tekstil baskı sektöründe devrim yaratan en modern dijital transfer yöntemidir. 1440 DPI çözünürlükte baskı kafaları sayesinde mikro detaylar, degrade tonlamalar ve 16 milyon renk tonu kumaşa mükemmel biçimde aktarılır.',
      cover_image: 'assets/images/machines/dtf-printer-station.svg',
      features: ['1440 DPI Ultra Yüksek Çözünürlük', 'Her Kumaş Türüyle %100 Uyumlu', '60°C Yıkama ve Sürtünme Dayanımı', 'Düşük ve Yüksek Adetlerde Hızlı Teslimat']
    },
    {
      status: 'published',
      sort: 2,
      title: 'Otomatik Serigrafi Baskı',
      slug: 'serigrafi-baski',
      badge: 'Yüksek Kapasite',
      capacity_info: 'Günlük 35.000+ Parça Baskı',
      short_desc: 'M&R ve MHM otomatik ahtapot serigrafi parkurumuzla yüksek adetli ihracat ve kurumsal siparişlerde benzersiz maliyet avantajı.',
      content: 'Büyük ölçekli tekstil üretiminde tartışmasız lider olan serigrafi baskı, yüksek kapatıcılık ve uzun ömürlü renk canlılığı sunar. Su bazlı, plastik, aşındırma (discharge), kabartma (puff) ve sim efektleriyle sınırsız tasarım özgürlüğü sağlar.',
      cover_image: 'assets/images/machines/screen-print-carousel.svg',
      features: ['Otomatik 10 ve 12 Renk Ahtapot Makineler', 'GOTS ve OEKO-TEX Uyumlu Ekolojik Boyalar', 'Özel Efektler: Kabartma, Varak, Sim, Reflektif', 'Endüstriyel Gazlı Fikse Tünelleri']
    },
    {
      status: 'published',
      slug: 'tisort-baski',
      badge: 'Hızlı Termin',
      capacity_info: 'Günlük 25.000+ Tişört',
      short_desc: 'Oversize, slim fit, polo ve v-yaka tişörtlerde ön göğüs, sırt, kol ve paça bölgelerine özel parça baskı uygulamaları.',
      content: 'Markaların hazır giyim koleksiyonları ve kurumsal promosyon projeleri için optimize edilmiş tişört baskı hattımız, kumaşın dokusunu bozmadan nefes alan baskılar üretir.',
      cover_image: 'assets/images/products/tee-back-streetwear.svg',
      features: ['Nefes Alan Yumuşak Tuşe (Soft Handfeel)', 'Dikiş Üstü ve Kenardan Kenara Baskı', 'Ön / Sırt / Kol Kombinasyonları', 'Paketleme ve Etiketleme Hizmeti']
    },
    {
      status: 'published',
      sort: 4,
      title: 'Konfeksiyon Parça Baskı (Emprime)',
      slug: 'emprime-parca-baski',
      badge: 'Endüstriyel Hassasiyet',
      capacity_info: 'Günde 40.000+ Parça',
      short_desc: 'Kesilmiş kumaş panelleri üzerine dikiş öncesi mikron hassasiyetinde parça emprime baskı çözümleri.',
      content: 'Montaj öncesi kumaş parçalarına uygulanan emprime baskı, karmaşık giysi kalıplarında kusursuz desen yerleşimi sağlar.',
      cover_image: 'assets/images/simulations/dtf-step-4.svg',
      features: ['Lazer Hizalamalı Hassas Tablalar', 'Kalıp Geometrisine Özel Pozlama', 'Kapsamlı Kalite Kontrol Protokolü']
    }
  ];
  await insertItems('services', services);

  // 6. Makine Parkuru (Machines)
  const machines = [
    {
      status: 'published',
      sort: 1,
      name: 'Kornit Avalanche HD6 Endüstriyel Dijital / DTF Baskı İstasyonu',
      brand_model: 'Kornit Avalanche HD6',
      category: 'Dijital & DTF Baskı',
      print_type: 'DTF & DTG Hibrit',
      capacity: 'Günde 3.500+ Parça / 1200 DPI',
      description: 'Endüstriyel 6 renkli (CMYK + Kırmızı + Yeşil) + Çift Beyaz su bazlı mürekkep mimarisi. Patentli Neopigment boyalarıyla en yüksek renk gamutunu sunar.',
      image: 'assets/images/machines/dtf-printer-station.svg',
      specs: { 'Baskı Alanı': '60 x 90 cm', 'Maksimum Çözünürlük': '1200 x 1200 DPI', 'Kafa Sayısı': '24 Fuji Dimatix Kafa', 'Mürekkep': 'Su Bazlı Ekolojik Pigment' },
      is_active: true
    },
    {
      status: 'published',
      sort: 2,
      name: 'M&R Sportsman EXG 10 Renk Otomatik Ahtapot Serigrafi Makinesi',
      brand_model: 'M&R Sportsman EXG 10/12',
      category: 'Otomatik Serigrafi',
      print_type: 'Serigrafi & Özel Efekt',
      capacity: 'Saatte 850 Parça / Günde 18.000 Parça',
      description: 'Amerikan M&R mühendisliğiyle üretilmiş, servo motorlu mikro kayıt hassasiyetine sahip yüksek hızlı otomatik serigrafi ahtapotu.',
      image: 'assets/images/machines/screen-print-carousel.svg',
      specs: { 'Renk Sayısı': '10 Renk / 12 İstasyon', 'Maksimum Format': '51 x 51 cm', 'Hız': '850 vuruş / saat', 'Kayıt Hassasiyeti': '±0.02 mm Mikro Kayıt' },
      is_active: true
    },
    {
      status: 'published',
      sort: 3,
      name: 'Brother GTX Pro Bulk Endüstriyel Parça Baskı Ünitesi',
      brand_model: 'Brother GTX Pro Bulk',
      category: 'Dijital Parça Baskı',
      print_type: 'Direkt Kumaşa & Transfer',
      capacity: 'Günde 2.000 Parça',
      description: 'Sürekli mürekkep besleme sistemli, dahili beyaz sirkülasyonlu endüstriyel DTF ve parça baskı makinesi.',
      image: 'assets/images/machines/dtf-printer-station.svg',
      specs: { 'Baskı Alanı': '40 x 53 cm', 'Kafa Teknolojisi': 'Brother Industrial Piezo', 'Yıkama Dayanımı': 'ISO 105-C06 Standardı' },
      is_active: true
    },
    {
      status: 'published',
      sort: 4,
      name: 'Monti Antonio Çift Tablalı Pnömatik Sıcak Transfer Pres İstasyonu',
      brand_model: 'Monti Antonio Mod. 200',
      category: 'Fikse ve Transfer Presi',
      print_type: 'Termal Fikseleme',
      capacity: 'Saatte 600 Transfer',
      description: 'Dijital termostat kontrollü, 0-8 bar pnömatik hidrolik basınçlı çift tablalı endüstriyel transfer presi.',
      image: 'assets/images/machines/heat-press-station.svg',
      specs: { 'Tabla Ölçüsü': '50 x 70 cm', 'Maksimum Sıcaklık': '230°C Homojen Isı', 'Basınç': '0-8 Bar Pnömatik' },
      is_active: true
    },
    {
      status: 'published',
      sort: 5,
      name: 'Chiossi e Cavazzuti Endüstriyel Gazlı / Konveksiyonel Fikse Tüneli',
      brand_model: 'Chiossi e Cavazzuti DLE-10',
      category: 'Kurutma & Fikse Tüneli',
      print_type: 'Sürekli Kurutma',
      capacity: 'Saatte 1.500 Parça Fikseleme',
      description: 'Kumaş liflerinin derinliklerine kadar boyayı polimerize eden hava sirkülasyonlu, homojen ısı kontrollü fırın.',
      image: 'assets/images/simulations/dtf-step-5.svg',
      specs: { 'Tünel Uzunluğu': '8 Metre', 'Bant Genişliği': '150 cm', 'Hava Debisi': 'Yüksek Debili Sirkülasyon' },
      is_active: true
    }
  ];
  await insertItems('machines', machines);

  // 7. Üretim Süreçleri (Production Processes)
  const processes = [
    {
      status: 'published',
      sort: 1,
      step_number: 1,
      title: 'Tasarım Analizi ve Renk Ayrımı',
      short_desc: 'Vektör ve piksel tasarımlar kumaş türüne göre analiz edilir, Pantone ve CMYK kodları ayrıştırılır.',
      detail_text: 'Müşteriden gelen artwork teknik ekibimizce rip yazılımına aktarılır. Tram açıları, mürekkep yoğunluğu ve astar tabakası hesaplanır.',
      duration_info: '1-2 İş Saati',
      image: 'assets/images/simulations/dtf-step-1.svg'
    },
    {
      status: 'published',
      sort: 2,
      step_number: 2,
      title: 'Film & İpek Kalıp Hazırlığı',
      short_desc: 'Baskı türüne göre 1440 DPI taşıyıcı PET film veya lazer pozlamalı ipek elek kalıpları hazırlanır.',
      detail_text: 'Kalıpların ipek gerginliği newtonmetre ile ölçülür. DTF filmlerinde mikron hassasiyetinde antistatik kaplama kontrol edilir.',
      duration_info: '2-3 İş Saati',
      image: 'assets/images/simulations/dtf-step-2.svg'
    },
    {
      status: 'published',
      sort: 3,
      step_number: 3,
      title: 'Yüksek Hassasiyetli Baskı Uygulama',
      short_desc: 'Endüstriyel baskı istasyonlarında mikron düzeyinde kayıtla boya kumaşa veya transfer filmine aktarılır.',
      detail_text: 'Çift piezo kafa teknolojisiyle renk ve opak beyaz astar milimetrik senkronla basılır.',
      duration_info: 'Siparişe Göre',
      image: 'assets/images/simulations/dtf-step-3.svg'
    },
    {
      status: 'published',
      sort: 4,
      step_number: 4,
      title: 'Sıcak Tutkallama ve Kurutma',
      short_desc: 'Baskılı yüzeye otomatik çalkalama ünitesinde sıcak eriyen polimer toz uygulanır ve kızılötesi fırınlanır.',
      detail_text: 'Homojen tutkal tabakası kumaş lifleriyle boya arasında esnek ve kopmaz bir köprü kurar.',
      duration_info: 'Gerçek Zamanlı',
      image: 'assets/images/simulations/dtf-step-4.svg'
    },
    {
      status: 'published',
      sort: 5,
      step_number: 5,
      title: 'Termal Fikseleme & Presleme',
      short_desc: '160°C sıcaklık ve 6 bar basınç altında desen kumaş liflerine kalıcı olarak kilitlenir.',
      detail_text: 'Pnömatik pres makineleri her santimetrekareye eşit basınç uygulayarak yıkama dayanımını garanti eder.',
      duration_info: '15-20 Saniye/Parça',
      image: 'assets/images/simulations/dtf-step-5.svg'
    },
    {
      status: 'published',
      sort: 6,
      step_number: 6,
      title: 'Kalite Kontrol, Soyum & Paketleme',
      short_desc: 'Soğuk soyumla taşıyıcı film ayrılır, optik spektrometre ile renk ve esneklik kontrolleri yapılıp sevk edilir.',
      detail_text: 'Sürtünme testi, yıkama dayanımı simülasyonu ve ışık kabini kontrolünden geçen ürünler özenle paketlenir.',
      duration_info: 'Final Aşaması',
      image: 'assets/images/simulations/dtf-step-6.svg'
    }
  ];
  await insertItems('production_processes', processes);

  // 8. Referanslar (References)
  const references = [
    { status: 'published', sort: 1, company_name: 'Defacto Tekstil', industry: 'Hazır Giyim & Moda', logo: 'assets/images/logo.svg', collaboration_type: 'Kurumsal DTF & Serigrafi Çözüm Ortaklığı', featured: true },
    { status: 'published', sort: 2, company_name: 'LC Waikiki', industry: 'Perakende Moda', logo: 'assets/images/logo.svg', collaboration_type: 'Yüksek Hacimli Parça Baskı Üretimi', featured: true },
    { status: 'published', sort: 3, company_name: 'Koton', industry: 'Hazır Giyim', logo: 'assets/images/logo.svg', collaboration_type: 'Trend Koleksiyon Parça Baskıları', featured: true },
    { status: 'published', sort: 4, company_name: 'Mavi Jeans', industry: 'Denim & Streetwear', logo: 'assets/images/logo.svg', collaboration_type: 'Özel Seri Tişört ve Hoodie Baskıları', featured: true },
    { status: 'published', sort: 5, company_name: "Colin's", industry: 'Casual Giyim', logo: 'assets/images/logo.svg', collaboration_type: 'Serigrafi Parça Baskı', featured: true },
    { status: 'published', sort: 6, company_name: 'Sarar', industry: 'Klasik & Casual Tekstil', logo: 'assets/images/logo.svg', collaboration_type: 'Hassas Mikro Logo Uygulamaları', featured: true },
    { status: 'published', sort: 7, company_name: 'Beymen Club', industry: 'Lüks Hazır Giyim', logo: 'assets/images/logo.svg', collaboration_type: 'Yüksek Segment Mat Silikon Baskı', featured: true },
    { status: 'published', sort: 8, company_name: 'Network', industry: 'Modern Tekstil', logo: 'assets/images/logo.svg', collaboration_type: 'Özel Kumaş Karışımlı Koleksiyonlar', featured: true }
  ];
  await insertItems('references', references);

  // 9. Sertifikalar (Certificates)
  const certificates = [
    {
      status: 'published',
      sort: 1,
      title: 'OEKO-TEX Standard 100',
      organization: 'OEKO-TEX Association',
      certificate_no: '21.HTR.00000',
      validity: '2026 - 2027',
      description: 'Kullanılan tüm baskı kimyasalları, boyalar ve tutkalların zararlı maddeler içermediğini ve bebek tenine dahi zararsız olduğunu onaylar.',
      image: 'assets/images/certs/oeko-tex.svg'
    },
    {
      status: 'published',
      sort: 2,
      title: 'GOTS (Global Organic Textile Standard)',
      organization: 'GOTS International Working Group',
      certificate_no: 'GOTS-TR-2026-88',
      validity: '2026 - 2027',
      description: 'Organik tekstil ürünlerinde çevreye saygılı ve sosyal kriterlere uygun üretim sürecini tescil eder.',
      image: 'assets/images/certs/gots.svg'
    },
    {
      status: 'published',
      sort: 3,
      title: 'ISO 9001:2015 Kalite Yönetim Sistemi',
      organization: 'TÜV Rheinland / TÜRKAK',
      certificate_no: 'ISO-9001-TR-9182',
      validity: '2025 - 2028',
      description: 'Üretim süreçlerinde sürekli iyileştirme, sıfır hata toleransı ve müşteri memnuniyeti yönetim sistemini belgeler.',
      image: 'assets/images/certs/iso9001.svg'
    },
    {
      status: 'published',
      sort: 4,
      title: 'ISO 14001:2015 Çevre Yönetim Sistemi',
      organization: 'TÜV Rheinland',
      certificate_no: 'ISO-14001-TR-4421',
      validity: '2025 - 2028',
      description: 'Atık su geri kazanımı, enerji verimliliği ve çevreye sıfır kimyasal salınım ilkeleriyle üretim yapıldığını onaylar.',
      image: 'assets/images/certs/iso14001.svg'
    }
  ];
  await insertItems('certificates', certificates);

  // 10. Blog Yazıları (Blog Posts)
  const blogPosts = [
    {
      status: 'published',
      sort: 1,
      title: 'Tekstilde Sürdürülebilir Baskı Teknikleri ve Geleceğin Çevre Standartları',
      slug: 'tekstilde-surdurulebilir-baski-teknikleri',
      category: 'Sürdürülebilirlik',
      author: 'Nizamlar Baskı Ar-Ge Ekibi',
      read_time: '6 Dakika',
      published_date: '2026-04-10',
      summary: 'Geleneksel boyama ve baskı yöntemlerinin yerini alan su bazlı pigmentler, sıfır atık ilkeleri ve OEKO-TEX sertifikasyonunun tekstil ihracatındaki kritik önemi.',
      content: '<p>Tekstil endüstrisi, karbon ayak izini ve su tüketimini azaltmak amacıyla büyük bir dönüşüm geçirmektedir. Bu dönüşümün en önemli halkalarından birini baskı teknolojileri oluşturmaktadır.</p><p>Su bazlı boyalar ve solvent içermeyen DTF tutkalları, hem insan sağlığına tam uyum sağlamakta hem de doğaya sıfır toksik atık bırakmaktadır.</p>',
      cover_image: 'assets/images/certs/gots.svg'
    },
    {
      status: 'published',
      sort: 2,
      title: 'DTF Baskı ve Serigrafi Karşılaştırması: Hangi Projede Hangi Teknik Tercih Edilmeli?',
      slug: 'dtf-baski-ve-serigrafi-karsilastirmasi',
      category: 'Teknik Kılavuz',
      author: 'Teknik Üretim Direktörlüğü',
      read_time: '5 Dakika',
      published_date: '2026-03-22',
      summary: 'Adet, renk sayısı, kumaş türü ve teslimat takvimine göre DTF transfer ile geleneksel serigrafi arasındaki maliyet ve performans analizi.',
      content: '<p>Tasarımcıların ve marka yöneticilerinin en sık karşılaştığı kararlardan biri baskı tekniği seçimidir. DTF baskı, çok renkli ve degrade içeren işlerde düşük adetlerde dahi kalıp maliyetsiz avantaj sağlarken; serigrafi 5.000 adet üzeri siparişlerde birim maliyet lideridir.</p>',
      cover_image: 'assets/images/machines/dtf-printer-station.svg'
    },
    {
      status: 'published',
      sort: 3,
      title: 'Yüksek Adetli Kurumsal Tekstil Baskısında Maliyet ve Kalite Optimizasyonu',
      slug: 'yuksek-adetli-kurumsal-tekstil-baskisi',
      category: 'Endüstriyel Üretim',
      author: 'Nizamlar Operasyon Departmanı',
      read_time: '7 Dakika',
      published_date: '2026-02-15',
      summary: 'Büyük ölçekli üretim partilerinde renk standardizasyonu, numune onay süreci ve ihracat ambalajlama standartları.',
      content: '<p>Yıllık milyonlarca parça üreten küresel markalar için en kritik unsur her mağazada ve her sezonda aynı renk tonunun yakalanmasıdır. Lazer kayıt sistemleri ve spektrofotometre kontrolleriyle bu riskler sıfırlanır.</p>',
      cover_image: 'assets/images/machines/screen-print-carousel.svg'
    }
  ];
  await insertItems('blog_posts', blogPosts);

  // 11. Video ve Animasyon Yönetimi (Animations Config)
  const animations = [
    {
      status: 'published',
      key: 'hero_video',
      title: 'Ana Sayfa Hero Baskı Makinesi Videosu',
      target_page: 'Ana Sayfa',
      video_url: 'assets/videos/production-loop.mp4',
      mobile_video_url: 'assets/videos/production-loop.mp4',
      poster_image: 'assets/images/products/tee-back-streetwear.svg',
      autoplay: true,
      loop: true,
      muted: true,
      animation_type: 'Fade',
      animation_duration_ms: 800
    },
    {
      status: 'published',
      key: 'before_after_slider',
      title: 'İnteraktif Baskı Öncesi / Sonrası Karşılaştırma Efekti',
      target_page: 'Ana Sayfa & Galeri',
      animation_type: 'Slide',
      animation_duration_ms: 400,
      autoplay: false,
      loop: false,
      muted: true
    },
    {
      status: 'published',
      key: 'print_reveal_effect',
      title: 'Lazer & Ragle Tarama Baskı Ortaya Çıkış Animasyonu',
      target_page: 'Tüm Sayfalar / Ürün Kartları',
      animation_type: 'Product Print Reveal',
      animation_duration_ms: 1200,
      autoplay: true,
      loop: false,
      muted: true
    },
    {
      status: 'published',
      key: 'production_simulation',
      title: '6 Aşamalı İnteraktif Üretim Simülasyonu',
      target_page: 'Üretim Süreçleri',
      animation_type: 'Mask Reveal',
      animation_duration_ms: 600,
      autoplay: true,
      loop: true,
      muted: true
    }
  ];
  await insertItems('animations_config', animations);

  console.log('🎉 BÜTÜN İÇERİKLER CMS VERİTABANINA %100 EKSİKSİZ AKTARILDI!');
}

seed().catch(err => {
  console.error('Seed hatası:', err);
  process.exit(1);
});
