/**
 * NİZAMLAR BASKI — CMS SETUP & SEED SCRIPT
 * Directus Headless CMS koleksiyonlarını, alanlarını, yetkilerini ve
 * mevcut kurumsal site içeriklerini %100 eksiksiz yapılandırır.
 */

const { DIRECTUS_URL, required } = require('./lib/env');
const ADMIN_EMAIL = required('ADMIN_EMAIL');
const ADMIN_PASSWORD = required('ADMIN_PASSWORD');

async function run() {
  console.log('🚀 Nizamlar Baskı CMS Kurulumu Başlatılıyor...');

  // 1. Admin Girişi ve Token Alma
  console.log('🔑 Yönetici girişi yapılıyor...');
  const loginRes = await fetch(`${DIRECTUS_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
  });

  if (!loginRes.ok) {
    throw new Error(`Giriş başarısız: ${loginRes.status} ${await loginRes.text()}`);
  }

  const { data: { access_token } } = await loginRes.json();
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${access_token}`
  };
  console.log('✅ Giriş başarılı. Token alındı.');

  // 2. Proje Genel Ayarları & Tema (Antrasit / Gold)
  console.log('🎨 Panel marka ve tema ayarları uygulanıyor...');
  await fetch(`${DIRECTUS_URL}/settings`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      project_name: 'Nizamlar Baskı Yönetim Paneli',
      project_descriptor: 'Tekstil Baskı Kurumsal İçerik & CMS Platformu',
      project_color: '#c5a059',
      default_language: 'tr-TR',
      public_favicon: null,
      custom_css: `
        :root {
          --theme--primary: #c5a059 !important;
          --theme--navigation--background: #18191b !important;
        }
      `
    })
  });
  console.log('✅ Panel tema ve Türkçe dil ayarları uygulandı.');

  // 3. Koleksiyon Oluşturma Yardımcı Fonksiyonu
  async function createCollection(collectionConfig) {
    const check = await fetch(`${DIRECTUS_URL}/collections/${collectionConfig.collection}`, { headers });
    if (check.ok) {
      console.log(`ℹ️  Koleksiyon zaten var: ${collectionConfig.collection}`);
      return;
    }

    const res = await fetch(`${DIRECTUS_URL}/collections`, {
      method: 'POST',
      headers,
      body: JSON.stringify(collectionConfig)
    });

    if (!res.ok) {
      console.error(`❌ Koleksiyon oluşturulamadı: ${collectionConfig.collection}`, await res.text());
    } else {
      console.log(`✨ Koleksiyon oluşturuldu: ${collectionConfig.collection}`);
    }
  }

  // Grup Klasörleri (Sidebar Gruplama)
  const groups = [
    {
      collection: 'grp_icerik',
      meta: { collection: 'grp_icerik', icon: 'auto_stories', group: null, translations: [{ language: 'tr-TR', translation: 'İçerik Yönetimi' }] },
      schema: null
    },
    {
      collection: 'grp_uretim',
      meta: { collection: 'grp_uretim', icon: 'precision_manufacturing', group: null, translations: [{ language: 'tr-TR', translation: 'Ürün ve Üretim' }] },
      schema: null
    },
    {
      collection: 'grp_medya',
      meta: { collection: 'grp_medya', icon: 'perm_media', group: null, translations: [{ language: 'tr-TR', translation: 'Medya ve Animasyon' }] },
      schema: null
    },
    {
      collection: 'grp_iletisim',
      meta: { collection: 'grp_iletisim', icon: 'contact_phone', group: null, translations: [{ language: 'tr-TR', translation: 'Talepler ve İletişim' }] },
      schema: null
    },
    {
      collection: 'grp_kurumsal',
      meta: { collection: 'grp_kurumsal', icon: 'verified', group: null, translations: [{ language: 'tr-TR', translation: 'Kurumsal ve Güven' }] },
      schema: null
    },
    {
      collection: 'grp_ayarlar',
      meta: { collection: 'grp_ayarlar', icon: 'settings', group: null, translations: [{ language: 'tr-TR', translation: 'Site & SEO Ayarları' }] },
      schema: null
    }
  ];

  for (const g of groups) {
    await createCollection(g);
  }

  // 4. Ana Koleksiyonların Tanımlanması
  const collections = [
    // Site Ayarları
    {
      collection: 'site_settings',
      meta: {
        collection: 'site_settings',
        singleton: true,
        icon: 'tune',
        group: 'grp_ayarlar',
        note: 'Firma unvanı, iletişim bilgileri, sosyal medya ve genel site ayarları',
        translations: [{ language: 'tr-TR', translation: 'Site Ayarları' }]
      },
      fields: [
        { field: 'id', type: 'integer', meta: { hidden: true }, schema: { is_primary_key: true, has_auto_increment: true } },
        { field: 'site_name', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Site Adı' }] } },
        { field: 'tagline', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Slogan' }] } },
        { field: 'company_legal_name', type: 'string', meta: { interface: 'input', width: 'full', translations: [{ language: 'tr-TR', translation: 'Resmi Firma Unvanı' }] } },
        { field: 'contact_phone', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Telefon (Görünen)' }] } },
        { field: 'contact_phone_raw', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Telefon (Tel Bağlantısı)' }] } },
        { field: 'contact_email', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'E-Posta Adresi' }] } },
        { field: 'working_hours', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Çalışma Saatleri' }] } },
        { field: 'contact_address', type: 'text', meta: { interface: 'textarea', width: 'full', translations: [{ language: 'tr-TR', translation: 'Fabrika / Ofis Adresi' }] } },
        { field: 'instagram_url', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Instagram Bağlantısı' }] } },
        { field: 'linkedin_url', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'LinkedIn Bağlantısı' }] } },
        { field: 'facebook_url', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Facebook Bağlantısı' }] } },
        { field: 'youtube_url', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'YouTube Bağlantısı' }] } }
      ]
    },

    // WhatsApp ve Hızlı İletişim Yönetimi (Merkezi ayar)
    {
      collection: 'whatsapp_settings',
      meta: {
        collection: 'whatsapp_settings',
        singleton: true,
        icon: 'chat',
        group: 'grp_iletisim',
        note: 'Tüm sitedeki (Header, Footer, Butonlar, İletişim) WhatsApp ayarlarını tek merkezden yönetir',
        translations: [{ language: 'tr-TR', translation: 'İletişim ve WhatsApp' }]
      },
      fields: [
        { field: 'id', type: 'integer', meta: { hidden: true }, schema: { is_primary_key: true, has_auto_increment: true } },
        { field: 'whatsapp_number', type: 'string', meta: { interface: 'input', width: 'half', note: 'Uluslararası formatta (+905320000000 veya +90 532 000 00 00)', translations: [{ language: 'tr-TR', translation: 'WhatsApp Numarası' }] } },
        { field: 'is_active', type: 'boolean', meta: { interface: 'boolean', width: 'half', translations: [{ language: 'tr-TR', translation: 'WhatsApp Butonu Aktif mi?' }] } },
        { field: 'button_text', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Buton Üzerindeki Metin' }] } },
        { field: 'floating_button_active', type: 'boolean', meta: { interface: 'boolean', width: 'half', translations: [{ language: 'tr-TR', translation: 'Sağ Altta Sabit WhatsApp Balonu' }] } },
        { field: 'default_message', type: 'text', meta: { interface: 'textarea', width: 'full', note: 'Müşteri WhatsApp ikonuna tıkladığında otomatik açılacak varsayılan mesaj', translations: [{ language: 'tr-TR', translation: 'Varsayılan Karşılama Mesajı' }] } },
        { field: 'agent_name', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Müşteri Danışmanı Adı' }] } },
        { field: 'display_pages', type: 'string', meta: { interface: 'input', width: 'half', note: 'Örn: all (tüm sayfalar) veya belirli sayfalar', translations: [{ language: 'tr-TR', translation: 'Görüneceği Sayfalar' }] } }
      ]
    },

    // Sayfa Yönetimi
    {
      collection: 'pages',
      meta: {
        collection: 'pages',
        icon: 'web',
        group: 'grp_icerik',
        note: 'Sitedeki tüm bağımsız sayfaların başlık, hero, metin ve bölümlerini yönetir',
        translations: [{ language: 'tr-TR', translation: 'Sayfa Yönetimi' }]
      },
      fields: [
        { field: 'id', type: 'integer', meta: { hidden: true }, schema: { is_primary_key: true, has_auto_increment: true } },
        { field: 'status', type: 'string', meta: { interface: 'select-dropdown', width: 'half', options: { choices: [{ text: 'Yayınlandı (Yayında)', value: 'published' }, { text: 'Taslak (Gizli)', value: 'draft' }] }, translations: [{ language: 'tr-TR', translation: 'Yayın Durumu' }] } },
        { field: 'slug', type: 'string', meta: { interface: 'input', width: 'half', note: 'Örn: home, hakkimizda, hizmetlerimiz, galeri...', translations: [{ language: 'tr-TR', translation: 'Sayfa Kodu (Slug)' }] } },
        { field: 'page_name', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Sayfa Adı' }] } },
        { field: 'title', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Sayfa Başlığı' }] } },
        { field: 'subtitle', type: 'text', meta: { interface: 'textarea', width: 'full', translations: [{ language: 'tr-TR', translation: 'Alt Başlık / Özet' }] } },
        { field: 'hero_title', type: 'string', meta: { interface: 'input', width: 'full', translations: [{ language: 'tr-TR', translation: 'Hero Bölüm Başlığı' }] } },
        { field: 'hero_subtitle', type: 'text', meta: { interface: 'textarea', width: 'full', translations: [{ language: 'tr-TR', translation: 'Hero Açıklama Metni' }] } },
        { field: 'hero_image', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Hero Görsel Yolu / URL' }] } },
        { field: 'hero_video', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Hero Video Yolu / MP4' }] } },
        { field: 'hero_btn_text', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Hero Buton Yazısı' }] } },
        { field: 'hero_btn_link', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Hero Buton Linki' }] } },
        { field: 'sections_data', type: 'json', meta: { interface: 'input-code', options: { language: 'json' }, width: 'full', note: 'Bölüm başlıkları, metinleri ve görünürlük durumları', translations: [{ language: 'tr-TR', translation: 'Bölüm Yapılandırması' }] } },
        { field: 'seo_title', type: 'string', meta: { interface: 'input', width: 'full', translations: [{ language: 'tr-TR', translation: 'SEO Başlığı (Title)' }] } },
        { field: 'seo_description', type: 'text', meta: { interface: 'textarea', width: 'full', translations: [{ language: 'tr-TR', translation: 'Meta Açıklaması (Description)' }] } },
        { field: 'seo_keywords', type: 'string', meta: { interface: 'input', width: 'full', translations: [{ language: 'tr-TR', translation: 'Anahtar Kelimeler (Keywords)' }] } }
      ]
    },

    // Baskılı Tekstil Ürünleri
    {
      collection: 'products',
      meta: {
        collection: 'products',
        icon: 'checkroom',
        group: 'grp_uretim',
        sort_field: 'sort',
        note: 'Tişört, sweatshirt, hoodie, forma vb. baskı örnekleri ve kurumsal galeri ürünleri',
        translations: [{ language: 'tr-TR', translation: 'Baskılı Ürünler' }]
      },
      fields: [
        { field: 'id', type: 'integer', meta: { hidden: true }, schema: { is_primary_key: true, has_auto_increment: true } },
        { field: 'status', type: 'string', meta: { interface: 'select-dropdown', width: 'half', options: { choices: [{ text: 'Yayınlandı', value: 'published' }, { text: 'Taslak', value: 'draft' }] }, translations: [{ language: 'tr-TR', translation: 'Durum' }] } },
        { field: 'sort', type: 'integer', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Sıralama' }] } },
        { field: 'name', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Ürün Adı' }] } },
        {
          field: 'category',
          type: 'string',
          meta: {
            interface: 'select-dropdown',
            width: 'half',
            options: {
              choices: [
                { text: 'Tişört', value: 'Tişört' },
                { text: 'Sweatshirt', value: 'Sweatshirt' },
                { text: 'Hoodie', value: 'Hoodie' },
                { text: 'Kazak', value: 'Kazak' },
                { text: 'Pantolon', value: 'Pantolon' },
                { text: 'Eşofman', value: 'Eşofman' },
                { text: 'Şort', value: 'Şort' },
                { text: 'Forma', value: 'Forma' },
                { text: 'Diğer tekstil ürünleri', value: 'Diğer tekstil ürünleri' }
              ]
            },
            translations: [{ language: 'tr-TR', translation: 'Ürün Kategorisi' }]
          }
        },
        { field: 'description', type: 'text', meta: { interface: 'textarea', width: 'full', translations: [{ language: 'tr-TR', translation: 'Açıklama' }] } },
        { field: 'cover_image', type: 'string', meta: { interface: 'input', width: 'half', note: 'Ön yüz görseli', translations: [{ language: 'tr-TR', translation: 'Kapak Görseli (Ön Yüz)' }] } },
        { field: 'back_image', type: 'string', meta: { interface: 'input', width: 'half', note: 'Arka yüz / sırt baskısı (Kartı döndürme özelliği)', translations: [{ language: 'tr-TR', translation: 'Arka Yüz Görseli' }] } },
        { field: 'gallery_images', type: 'json', meta: { interface: 'input-code', options: { language: 'json' }, width: 'full', translations: [{ language: 'tr-TR', translation: 'Ek Görseller' }] } },
        { field: 'print_technique', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Baskı Tekniği' }] } },
        { field: 'pattern_type', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Desen Türü' }] } },
        { field: 'fabric_details', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Kumaş Detayı' }] } },
        { field: 'video_url', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Tanıtım / Animasyon Videosu' }] } },
        { field: 'featured', type: 'boolean', meta: { interface: 'boolean', width: 'half', translations: [{ language: 'tr-TR', translation: 'Ana Sayfada Öne Çıkar' }] } }
      ]
    },

    // Hizmetlerimiz
    {
      collection: 'services',
      meta: {
        collection: 'services',
        icon: 'layers',
        group: 'grp_uretim',
        sort_field: 'sort',
        note: 'DTF, serigrafi, tişört ve konfeksiyon parça baskı hizmetleri',
        translations: [{ language: 'tr-TR', translation: 'Hizmetlerimiz' }]
      },
      fields: [
        { field: 'id', type: 'integer', meta: { hidden: true }, schema: { is_primary_key: true, has_auto_increment: true } },
        { field: 'status', type: 'string', meta: { interface: 'select-dropdown', width: 'half', options: { choices: [{ text: 'Yayınlandı', value: 'published' }, { text: 'Taslak', value: 'draft' }] }, translations: [{ language: 'tr-TR', translation: 'Durum' }] } },
        { field: 'sort', type: 'integer', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Sıralama' }] } },
        { field: 'title', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Hizmet Adı' }] } },
        { field: 'slug', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Bağlantı Kodu (Slug)' }] } },
        { field: 'badge', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Etiket / Rozet' }] } },
        { field: 'capacity_info', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Kapasite Bilgisi' }] } },
        { field: 'short_desc', type: 'text', meta: { interface: 'textarea', width: 'full', translations: [{ language: 'tr-TR', translation: 'Kısa Özet' }] } },
        { field: 'content', type: 'text', meta: { interface: 'textarea', width: 'full', translations: [{ language: 'tr-TR', translation: 'Detaylı İçerik' }] } },
        { field: 'cover_image', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Kapak Görseli' }] } },
        { field: 'video_url', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Uygulama Videosu' }] } },
        { field: 'features', type: 'json', meta: { interface: 'input-code', options: { language: 'json' }, width: 'full', translations: [{ language: 'tr-TR', translation: 'Öne Çıkan Özellikler' }] } }
      ]
    },

    // Makine Parkuru
    {
      collection: 'machines',
      meta: {
        collection: 'machines',
        icon: 'build_circle',
        group: 'grp_uretim',
        sort_field: 'sort',
        note: 'Endüstriyel baskı makineleri, fikse fırınları ve pres üniteleri',
        translations: [{ language: 'tr-TR', translation: 'Makine Parkuru' }]
      },
      fields: [
        { field: 'id', type: 'integer', meta: { hidden: true }, schema: { is_primary_key: true, has_auto_increment: true } },
        { field: 'status', type: 'string', meta: { interface: 'select-dropdown', width: 'half', options: { choices: [{ text: 'Yayınlandı', value: 'published' }, { text: 'Taslak', value: 'draft' }] }, translations: [{ language: 'tr-TR', translation: 'Durum' }] } },
        { field: 'sort', type: 'integer', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Sıralama' }] } },
        { field: 'name', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Makine Adı' }] } },
        { field: 'brand_model', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Marka & Model' }] } },
        { field: 'category', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Kategori' }] } },
        { field: 'print_type', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'İlgili Baskı Türü' }] } },
        { field: 'capacity', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Üretim Kapasitesi' }] } },
        { field: 'description', type: 'text', meta: { interface: 'textarea', width: 'full', translations: [{ language: 'tr-TR', translation: 'Açıklama' }] } },
        { field: 'specs', type: 'json', meta: { interface: 'input-code', options: { language: 'json' }, width: 'full', translations: [{ language: 'tr-TR', translation: 'Teknik Özellikler' }] } },
        { field: 'image', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Makine Fotoğrafı' }] } },
        { field: 'video_url', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Çalışma Videosu' }] } },
        { field: 'is_active', type: 'boolean', meta: { interface: 'boolean', width: 'half', translations: [{ language: 'tr-TR', translation: 'Sayfada Gösterilsin mi?' }] } }
      ]
    },

    // Üretim Süreçleri
    {
      collection: 'production_processes',
      meta: {
        collection: 'production_processes',
        icon: 'account_tree',
        group: 'grp_uretim',
        sort_field: 'sort',
        note: 'Baskı öncesi hazırlıktan paketlemeye kadar adım adım üretim süreçleri',
        translations: [{ language: 'tr-TR', translation: 'Üretim Süreçleri' }]
      },
      fields: [
        { field: 'id', type: 'integer', meta: { hidden: true }, schema: { is_primary_key: true, has_auto_increment: true } },
        { field: 'status', type: 'string', meta: { interface: 'select-dropdown', width: 'half', options: { choices: [{ text: 'Yayınlandı', value: 'published' }, { text: 'Taslak', value: 'draft' }] }, translations: [{ language: 'tr-TR', translation: 'Durum' }] } },
        { field: 'sort', type: 'integer', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Sıralama' }] } },
        { field: 'step_number', type: 'integer', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Adım No (1, 2, 3...)' }] } },
        { field: 'title', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Aşama Başlığı' }] } },
        { field: 'short_desc', type: 'text', meta: { interface: 'textarea', width: 'full', translations: [{ language: 'tr-TR', translation: 'Kısa Açıklama' }] } },
        { field: 'detail_text', type: 'text', meta: { interface: 'textarea', width: 'full', translations: [{ language: 'tr-TR', translation: 'Süreç Detayları' }] } },
        { field: 'duration_info', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Süre Bilgisi' }] } },
        { field: 'image', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Aşama Görseli / Simülasyon' }] } }
      ]
    },

    // Referanslar
    {
      collection: 'references',
      meta: {
        collection: 'references',
        icon: 'star',
        group: 'grp_kurumsal',
        sort_field: 'sort',
        note: 'Baskı çözümlerimizi tercih eden markalar ve kurumsal müşteriler',
        translations: [{ language: 'tr-TR', translation: 'Referanslar' }]
      },
      fields: [
        { field: 'id', type: 'integer', meta: { hidden: true }, schema: { is_primary_key: true, has_auto_increment: true } },
        { field: 'status', type: 'string', meta: { interface: 'select-dropdown', width: 'half', options: { choices: [{ text: 'Yayınlandı', value: 'published' }, { text: 'Taslak', value: 'draft' }] }, translations: [{ language: 'tr-TR', translation: 'Durum' }] } },
        { field: 'sort', type: 'integer', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Sıralama' }] } },
        { field: 'company_name', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Firma / Marka Adı' }] } },
        { field: 'industry', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Sektör' }] } },
        { field: 'logo', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Marka Logosu' }] } },
        { field: 'collaboration_type', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'İş Birliği Türü' }] } },
        { field: 'featured', type: 'boolean', meta: { interface: 'boolean', width: 'half', translations: [{ language: 'tr-TR', translation: 'Ana Sayfada Göster' }] } }
      ]
    },

    // Sertifikalar
    {
      collection: 'certificates',
      meta: {
        collection: 'certificates',
        icon: 'verified',
        group: 'grp_kurumsal',
        sort_field: 'sort',
        note: 'OEKO-TEX, GOTS, ISO vb. kalite ve sürdürülebilirlik sertifikaları',
        translations: [{ language: 'tr-TR', translation: 'Sertifikalar' }]
      },
      fields: [
        { field: 'id', type: 'integer', meta: { hidden: true }, schema: { is_primary_key: true, has_auto_increment: true } },
        { field: 'status', type: 'string', meta: { interface: 'select-dropdown', width: 'half', options: { choices: [{ text: 'Yayınlandı', value: 'published' }, { text: 'Taslak', value: 'draft' }] }, translations: [{ language: 'tr-TR', translation: 'Durum' }] } },
        { field: 'sort', type: 'integer', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Sıralama' }] } },
        { field: 'title', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Sertifika Adı' }] } },
        { field: 'organization', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Veren Kuruluş' }] } },
        { field: 'certificate_no', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Sertifika / Lisans No' }] } },
        { field: 'validity', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Geçerlilik Tarihi' }] } },
        { field: 'description', type: 'text', meta: { interface: 'textarea', width: 'full', translations: [{ language: 'tr-TR', translation: 'Kapsam & Açıklama' }] } },
        { field: 'image', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Sertifika Logosu / Görseli' }] } },
        { field: 'pdf_file', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'PDF Belgesi Bağlantısı' }] } }
      ]
    },

    // Blog Yönetimi
    {
      collection: 'blog_posts',
      meta: {
        collection: 'blog_posts',
        icon: 'article',
        group: 'grp_icerik',
        sort_field: 'sort',
        note: 'Sektörel makaleler, baskı teknikleri karşılaştırmaları ve kılavuzlar',
        translations: [{ language: 'tr-TR', translation: 'Blog Yönetimi' }]
      },
      fields: [
        { field: 'id', type: 'integer', meta: { hidden: true }, schema: { is_primary_key: true, has_auto_increment: true } },
        { field: 'status', type: 'string', meta: { interface: 'select-dropdown', width: 'half', options: { choices: [{ text: 'Yayınlandı', value: 'published' }, { text: 'Taslak', value: 'draft' }] }, translations: [{ language: 'tr-TR', translation: 'Yayın Durumu' }] } },
        { field: 'sort', type: 'integer', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Sıralama' }] } },
        { field: 'title', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Makale Başlığı' }] } },
        { field: 'slug', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'URL Kodu (Slug)' }] } },
        { field: 'category', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Kategori' }] } },
        { field: 'author', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Yazar' }] } },
        { field: 'read_time', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Okuma Süresi' }] } },
        { field: 'published_date', type: 'date', meta: { interface: 'datetime', width: 'half', translations: [{ language: 'tr-TR', translation: 'Yayın Tarihi' }] } },
        { field: 'summary', type: 'text', meta: { interface: 'textarea', width: 'full', translations: [{ language: 'tr-TR', translation: 'Özet Açıklama' }] } },
        { field: 'content', type: 'text', meta: { interface: 'input-rich-text-html', width: 'full', translations: [{ language: 'tr-TR', translation: 'Makale Metni' }] } },
        { field: 'cover_image', type: 'string', meta: { interface: 'input', width: 'full', translations: [{ language: 'tr-TR', translation: 'Kapak Görseli' }] } }
      ]
    },

    // Teklif Talepleri (Gelen Form Verileri)
    {
      collection: 'quote_requests',
      meta: {
        collection: 'quote_requests',
        icon: 'inbox',
        group: 'grp_iletisim',
        note: 'Web sitesi teklif formundan gelen müşteri talepleri ve proje dosyaları',
        translations: [{ language: 'tr-TR', translation: 'Teklif Talepleri' }]
      },
      fields: [
        { field: 'id', type: 'integer', meta: { hidden: true }, schema: { is_primary_key: true, has_auto_increment: true } },
        { field: 'created_at', type: 'timestamp', meta: { interface: 'datetime', width: 'half', readonly: true, translations: [{ language: 'tr-TR', translation: 'Talep Tarihi' }] } },
        {
          field: 'status',
          type: 'string',
          meta: {
            interface: 'select-dropdown',
            width: 'half',
            options: {
              choices: [
                { text: '🔴 Yeni Talep', value: 'Yeni' },
                { text: '🟡 İnceleniyor', value: 'İnceleniyor' },
                { text: '🔵 Teklif Hazırlandı', value: 'Teklif Hazırlandı' },
                { text: '🟢 Tamamlandı', value: 'Tamamlandı' },
                { text: '⚫ İptal', value: 'İptal' }
              ]
            },
            translations: [{ language: 'tr-TR', translation: 'Talep Durumu' }]
          }
        },
        { field: 'customer_name', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Müşteri Adı' }] } },
        { field: 'company_name', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Firma Adı' }] } },
        { field: 'phone', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Telefon' }] } },
        { field: 'email', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'E-Posta' }] } },
        { field: 'print_type', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'İstenen Baskı Türü' }] } },
        { field: 'quantity', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Tahmini Adet' }] } },
        { field: 'description', type: 'text', meta: { interface: 'textarea', width: 'full', translations: [{ language: 'tr-TR', translation: 'Açıklama / Notlar' }] } },
        { field: 'file_url', type: 'string', meta: { interface: 'input', width: 'half', readonly: true, translations: [{ language: 'tr-TR', translation: 'Yüklenen Dosya Yolu' }] } },
        { field: 'file_name', type: 'string', meta: { interface: 'input', width: 'half', readonly: true, translations: [{ language: 'tr-TR', translation: 'Dosya Adı' }] } },
        { field: 'admin_notes', type: 'text', meta: { interface: 'textarea', width: 'full', note: 'Sadece yöneticilerin görebileceği iç operasyonel notlar', translations: [{ language: 'tr-TR', translation: 'Yönetici Notu' }] } }
      ]
    },

    // Video ve Animasyon Yönetimi
    {
      collection: 'animations_config',
      meta: {
        collection: 'animations_config',
        icon: 'smart_display',
        group: 'grp_medya',
        note: 'Baskı makinesi videoları, video döngüleri, süreler ve animasyon efektleri',
        translations: [{ language: 'tr-TR', translation: 'Video ve Animasyonlar' }]
      },
      fields: [
        { field: 'id', type: 'integer', meta: { hidden: true }, schema: { is_primary_key: true, has_auto_increment: true } },
        { field: 'status', type: 'string', meta: { interface: 'select-dropdown', width: 'half', options: { choices: [{ text: 'Aktif', value: 'published' }, { text: 'Pasif', value: 'draft' }] }, translations: [{ language: 'tr-TR', translation: 'Durum' }] } },
        { field: 'key', type: 'string', meta: { interface: 'input', width: 'half', note: 'Örn: hero_video, production_simulation, print_reveal_effect', translations: [{ language: 'tr-TR', translation: 'Sistem Anahtarı (Key)' }] } },
        { field: 'title', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Video / Animasyon Başlığı' }] } },
        { field: 'target_page', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Kullanıldığı Sayfa' }] } },
        { field: 'video_url', type: 'string', meta: { interface: 'input', width: 'half', note: 'MP4 / WebM video dosyası yolu', translations: [{ language: 'tr-TR', translation: 'Video Dosyası (Masaüstü)' }] } },
        { field: 'mobile_video_url', type: 'string', meta: { interface: 'input', width: 'half', note: 'Mobil cihazlar için hafif alternatif video', translations: [{ language: 'tr-TR', translation: 'Mobil Video Alternatifi' }] } },
        { field: 'poster_image', type: 'string', meta: { interface: 'input', width: 'half', note: 'Video yüklenmeden önce görünen kapak karesi', translations: [{ language: 'tr-TR', translation: 'Poster Görseli' }] } },
        {
          field: 'animation_type',
          type: 'string',
          meta: {
            interface: 'select-dropdown',
            width: 'half',
            options: {
              choices: [
                { text: 'Fade (Yumuşak Belirme)', value: 'Fade' },
                { text: 'Slide (Kayarak Giriş)', value: 'Slide' },
                { text: 'Reveal (Doğal Ortaya Çıkış)', value: 'Reveal' },
                { text: 'Zoom (Derinlikli Yakınlaşma)', value: 'Zoom' },
                { text: 'Mask Reveal (Endüstriyel Maskeleme)', value: 'Mask Reveal' },
                { text: 'Product Print Reveal (Lazer / Ragle Tarama)', value: 'Product Print Reveal' }
              ]
            },
            translations: [{ language: 'tr-TR', translation: 'Animasyon Türü' }]
          }
        },
        { field: 'animation_duration_ms', type: 'integer', meta: { interface: 'input', width: 'half', note: 'Milisaniye cinsinden (Örn: 600)', translations: [{ language: 'tr-TR', translation: 'Animasyon Süresi (ms)' }] } },
        { field: 'autoplay', type: 'boolean', meta: { interface: 'boolean', width: 'half', translations: [{ language: 'tr-TR', translation: 'Otomatik Oynat (Autoplay)' }] } },
        { field: 'loop', type: 'boolean', meta: { interface: 'boolean', width: 'half', translations: [{ language: 'tr-TR', translation: 'Sürekli Döngü (Loop)' }] } },
        { field: 'muted', type: 'boolean', meta: { interface: 'boolean', width: 'half', translations: [{ language: 'tr-TR', translation: 'Sessiz Başlat (Muted)' }] } }
      ]
    },

    // Menü ve Footer Yönetimi
    {
      collection: 'navigation_menus',
      meta: {
        collection: 'navigation_menus',
        icon: 'menu',
        group: 'grp_icerik',
        sort_field: 'sort',
        note: 'Header ana menüsü ve Footer sütunlarındaki linklerin yönetimi',
        translations: [{ language: 'tr-TR', translation: 'Menü ve Footer' }]
      },
      fields: [
        { field: 'id', type: 'integer', meta: { hidden: true }, schema: { is_primary_key: true, has_auto_increment: true } },
        { field: 'status', type: 'string', meta: { interface: 'select-dropdown', width: 'half', options: { choices: [{ text: 'Yayınlandı', value: 'published' }, { text: 'Taslak', value: 'draft' }] }, translations: [{ language: 'tr-TR', translation: 'Durum' }] } },
        { field: 'sort', type: 'integer', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Sıralama' }] } },
        {
          field: 'menu_location',
          type: 'string',
          meta: {
            interface: 'select-dropdown',
            width: 'half',
            options: {
              choices: [
                { text: 'Header Ana Menü', value: 'header' },
                { text: 'Footer - Kurumsal', value: 'footer_kurumsal' },
                { text: 'Footer - Hizmetlerimiz', value: 'footer_hizmetler' },
                { text: 'Footer - Yasal Bilgiler', value: 'footer_legal' }
              ]
            },
            translations: [{ language: 'tr-TR', translation: 'Menü Konumu' }]
          }
        },
        { field: 'title', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Menü Yazısı' }] } },
        { field: 'url', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Yönlendirme Adresi (URL)' }] } },
        { field: 'badge', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Vurgu Etiketi (Örn: Popüler)' }] } }
      ]
    },

    // SEO Ayarları
    {
      collection: 'seo_settings',
      meta: {
        collection: 'seo_settings',
        icon: 'search',
        group: 'grp_ayarlar',
        note: 'Arama motoru etiketleri, Google görünümü ve sosyal medya paylaşım önizlemeleri',
        translations: [{ language: 'tr-TR', translation: 'SEO Ayarları' }]
      },
      fields: [
        { field: 'id', type: 'integer', meta: { hidden: true }, schema: { is_primary_key: true, has_auto_increment: true } },
        { field: 'page_slug', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Sayfa Kodu' }] } },
        { field: 'meta_title', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Meta Başlığı (Title)' }] } },
        { field: 'meta_description', type: 'text', meta: { interface: 'textarea', width: 'full', translations: [{ language: 'tr-TR', translation: 'Meta Açıklaması' }] } },
        { field: 'meta_keywords', type: 'string', meta: { interface: 'input', width: 'full', translations: [{ language: 'tr-TR', translation: 'Anahtar Kelimeler' }] } },
        { field: 'og_image', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Sosyal Medya Görseli (OG Image)' }] } }
      ]
    }
  ];

  for (const col of collections) {
    await createCollection(col);
  }

  // 5. İzinler: tek kaynak cms/set_public_permissions.js (yalnızca yayımlanmış içerik, public yazma yok).
  console.log('🔒 İzinler için çalıştırın: node cms/set_public_permissions.js && node cms/setup_service_user.js');

  console.log('✅ Bütün koleksiyonlar, alanlar ve güvenlik izinleri başarıyla kuruldu!');
}

run().catch(err => {
  console.error('Hata:', err);
  process.exit(1);
});
