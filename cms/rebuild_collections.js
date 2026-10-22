/**
 * NİZAMLAR BASKI — FULL REBUILD & SEED SCRIPT
 * Directus koleksiyonlarını PostgreSQL fiziksel şeması (schema: {}) ile
 * oluşturur, alanları ve yetkileri tanımlar ve tüm site içeriklerini yükler.
 */

const { DIRECTUS_URL, required } = require('./lib/env');
const ADMIN_EMAIL = required('ADMIN_EMAIL');
const ADMIN_PASSWORD = required('ADMIN_PASSWORD');

// ⚠️ YIKICI İŞLEM KORUMASI ------------------------------------------------------
// Bu betik koleksiyonları SİLİP yeniden oluşturur: müşteri teklifleri ve yöneticinin
// girdiği tüm içerik kaybolur. Önceden yedek alınmadan ÇALIŞMAZ.
//   1) Yedek:   docker exec nizamlar-cms-postgres pg_dump -U directus nizamlar_cms_db > backups/db.sql
//   2) Çalıştır: I_HAVE_A_VERIFIED_BACKUP=yes node cms/rebuild_collections.js --confirm-destroy
if (!process.argv.includes('--confirm-destroy') || process.env.I_HAVE_A_VERIFIED_BACKUP !== 'yes') {
  console.error('⛔ rebuild_collections.js yıkıcıdır ve durduruldu.\n' +
    '   Yedek aldıysanız: I_HAVE_A_VERIFIED_BACKUP=yes node cms/rebuild_collections.js --confirm-destroy\n' +
    '   Yalnızca eksik alan/izin için: node cms/migrate_schema.js');
  process.exit(1);
}

async function rebuild() {
  console.log('🚀 Nizamlar Baskı CMS Rebuild Başlatılıyor...');

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

  // Eski test ve şemasız koleksiyonları temizle
  const toDelete = [
    'test_col',
    'site_settings',
    'whatsapp_settings',
    'pages',
    'products',
    'services',
    'machines',
    'production_processes',
    'references',
    'certificates',
    'blog_posts',
    'quote_requests',
    'animations_config',
    'navigation_menus',
    'seo_settings'
  ];

  for (const c of toDelete) {
    try {
      await fetch(`${DIRECTUS_URL}/collections/${c}`, { method: 'DELETE', headers });
    } catch (e) {}
  }
  console.log('🧹 Eski koleksiyonlar temizlendi.');

  // Grup Klasörleri (schema: null - sadece menü gruplaması için)
  const groups = [
    { collection: 'grp_icerik', meta: { collection: 'grp_icerik', icon: 'auto_stories', group: null, translations: [{ language: 'tr-TR', translation: 'İçerik Yönetimi' }] }, schema: null },
    { collection: 'grp_uretim', meta: { collection: 'grp_uretim', icon: 'precision_manufacturing', group: null, translations: [{ language: 'tr-TR', translation: 'Ürün ve Üretim' }] }, schema: null },
    { collection: 'grp_medya', meta: { collection: 'grp_medya', icon: 'perm_media', group: null, translations: [{ language: 'tr-TR', translation: 'Medya ve Animasyon' }] }, schema: null },
    { collection: 'grp_iletisim', meta: { collection: 'grp_iletisim', icon: 'contact_phone', group: null, translations: [{ language: 'tr-TR', translation: 'Talepler ve İletişim' }] }, schema: null },
    { collection: 'grp_kurumsal', meta: { collection: 'grp_kurumsal', icon: 'verified', group: null, translations: [{ language: 'tr-TR', translation: 'Kurumsal ve Güven' }] }, schema: null },
    { collection: 'grp_ayarlar', meta: { collection: 'grp_ayarlar', icon: 'settings', group: null, translations: [{ language: 'tr-TR', translation: 'Site & SEO Ayarları' }] }, schema: null }
  ];

  for (const g of groups) {
    const check = await fetch(`${DIRECTUS_URL}/collections/${g.collection}`, { headers });
    if (!check.ok) {
      await fetch(`${DIRECTUS_URL}/collections`, { method: 'POST', headers, body: JSON.stringify(g) });
    }
  }

  // Fiziksel Koleksiyonlar (schema: {})
  const physicalCollections = [
    {
      collection: 'site_settings',
      schema: {},
      meta: {
        collection: 'site_settings',
        singleton: true,
        icon: 'tune',
        group: 'grp_ayarlar',
        note: 'Firma unvanı, iletişim bilgileri, sosyal medya ve genel site ayarları',
        translations: [{ language: 'tr-TR', translation: 'Site Ayarları' }]
      },
      fields: [
        { field: 'id', type: 'integer', schema: { is_primary_key: true, has_auto_increment: true }, meta: { hidden: true } },
        { field: 'site_name', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Site Adı' }] } },
        { field: 'tagline', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Slogan' }] } },
        { field: 'company_legal_name', type: 'string', meta: { interface: 'input', width: 'full', translations: [{ language: 'tr-TR', translation: 'Resmi Firma Unvanı' }] } },
        { field: 'contact_phone', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Telefon (Görünen)' }] } },
        { field: 'contact_phone_raw', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Telefon (Tel Linki)' }] } },
        { field: 'contact_email', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'E-Posta Adresi' }] } },
        { field: 'working_hours', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Çalışma Saatleri' }] } },
        { field: 'contact_address', type: 'text', meta: { interface: 'textarea', width: 'full', translations: [{ language: 'tr-TR', translation: 'Fabrika / Ofis Adresi' }] } },
        { field: 'instagram_url', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Instagram Bağlantısı' }] } },
        { field: 'linkedin_url', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'LinkedIn Bağlantısı' }] } },
        { field: 'facebook_url', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Facebook Bağlantısı' }] } },
        { field: 'youtube_url', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'YouTube Bağlantısı' }] } }
      ]
    },
    {
      collection: 'whatsapp_settings',
      schema: {},
      meta: {
        collection: 'whatsapp_settings',
        singleton: true,
        icon: 'chat',
        group: 'grp_iletisim',
        note: 'Tüm sitedeki WhatsApp numarası ve buton ayarları',
        translations: [{ language: 'tr-TR', translation: 'İletişim ve WhatsApp' }]
      },
      fields: [
        { field: 'id', type: 'integer', schema: { is_primary_key: true, has_auto_increment: true }, meta: { hidden: true } },
        { field: 'whatsapp_number', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'WhatsApp Numarası (+90 formatında)' }] } },
        { field: 'is_active', type: 'boolean', meta: { interface: 'boolean', width: 'half', translations: [{ language: 'tr-TR', translation: 'WhatsApp Butonları Aktif mi?' }] } },
        { field: 'button_text', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Buton Üzerindeki Yazı' }] } },
        { field: 'floating_button_active', type: 'boolean', meta: { interface: 'boolean', width: 'half', translations: [{ language: 'tr-TR', translation: 'Sağ Altta Sabit Balon Görünsün mü?' }] } },
        { field: 'default_message', type: 'text', meta: { interface: 'textarea', width: 'full', translations: [{ language: 'tr-TR', translation: 'Varsayılan WhatsApp Mesajı' }] } },
        { field: 'agent_name', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Müşteri Temsilcisi Adı' }] } },
        { field: 'display_pages', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Görüneceği Sayfalar' }] } }
      ]
    },
    {
      collection: 'pages',
      schema: {},
      meta: {
        collection: 'pages',
        icon: 'web',
        group: 'grp_icerik',
        note: 'Bütün sayfaların başlık, hero, metin ve bölümleri',
        translations: [{ language: 'tr-TR', translation: 'Sayfa Yönetimi' }]
      },
      fields: [
        { field: 'id', type: 'integer', schema: { is_primary_key: true, has_auto_increment: true }, meta: { hidden: true } },
        { field: 'status', type: 'string', meta: { interface: 'select-dropdown', width: 'half', options: { choices: [{ text: 'Yayınlandı', value: 'published' }, { text: 'Taslak', value: 'draft' }] }, translations: [{ language: 'tr-TR', translation: 'Yayın Durumu' }] } },
        { field: 'slug', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Sayfa Kodu (Slug)' }] } },
        { field: 'page_name', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Sayfa Adı' }] } },
        { field: 'title', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Sayfa Başlığı' }] } },
        { field: 'subtitle', type: 'text', meta: { interface: 'textarea', width: 'full', translations: [{ language: 'tr-TR', translation: 'Alt Başlık' }] } },
        { field: 'hero_title', type: 'string', meta: { interface: 'input', width: 'full', translations: [{ language: 'tr-TR', translation: 'Hero Başlığı' }] } },
        { field: 'hero_subtitle', type: 'text', meta: { interface: 'textarea', width: 'full', translations: [{ language: 'tr-TR', translation: 'Hero Alt Metni' }] } },
        { field: 'hero_image', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Hero Görseli' }] } },
        { field: 'hero_video', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Hero Videosu' }] } },
        { field: 'hero_btn_text', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Hero Buton Yazısı' }] } },
        { field: 'hero_btn_link', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Hero Buton Linki' }] } },
        { field: 'sections_data', type: 'json', meta: { interface: 'input-code', options: { language: 'json' }, width: 'full', translations: [{ language: 'tr-TR', translation: 'Bölümler (JSON)' }] } },
        { field: 'seo_title', type: 'string', meta: { interface: 'input', width: 'full', translations: [{ language: 'tr-TR', translation: 'SEO Başlığı' }] } },
        { field: 'seo_description', type: 'text', meta: { interface: 'textarea', width: 'full', translations: [{ language: 'tr-TR', translation: 'Meta Açıklaması' }] } },
        { field: 'seo_keywords', type: 'string', meta: { interface: 'input', width: 'full', translations: [{ language: 'tr-TR', translation: 'Anahtar Kelimeler' }] } }
      ]
    },
    {
      collection: 'products',
      schema: {},
      meta: {
        collection: 'products',
        icon: 'checkroom',
        group: 'grp_uretim',
        sort_field: 'sort',
        note: 'Baskılı tekstil ürün örnekleri',
        translations: [{ language: 'tr-TR', translation: 'Baskılı Ürünler' }]
      },
      fields: [
        { field: 'id', type: 'integer', schema: { is_primary_key: true, has_auto_increment: true }, meta: { hidden: true } },
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
            translations: [{ language: 'tr-TR', translation: 'Kategori' }]
          }
        },
        { field: 'description', type: 'text', meta: { interface: 'textarea', width: 'full', translations: [{ language: 'tr-TR', translation: 'Açıklama' }] } },
        { field: 'cover_image', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Ön Yüz Görseli' }] } },
        { field: 'back_image', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Arka Yüz Görseli' }] } },
        { field: 'gallery_images', type: 'json', meta: { interface: 'input-code', options: { language: 'json' }, width: 'full', translations: [{ language: 'tr-TR', translation: 'Ek Görseller' }] } },
        { field: 'print_technique', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Baskı Tekniği' }] } },
        { field: 'pattern_type', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Desen Türü' }] } },
        { field: 'fabric_details', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Kumaş Detayı' }] } },
        { field: 'video_url', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Video URL' }] } },
        { field: 'featured', type: 'boolean', meta: { interface: 'boolean', width: 'half', translations: [{ language: 'tr-TR', translation: 'Öne Çıkar' }] } }
      ]
    },
    {
      collection: 'services',
      schema: {},
      meta: {
        collection: 'services',
        icon: 'layers',
        group: 'grp_uretim',
        sort_field: 'sort',
        translations: [{ language: 'tr-TR', translation: 'Hizmetlerimiz' }]
      },
      fields: [
        { field: 'id', type: 'integer', schema: { is_primary_key: true, has_auto_increment: true }, meta: { hidden: true } },
        { field: 'status', type: 'string', meta: { interface: 'select-dropdown', width: 'half', options: { choices: [{ text: 'Yayınlandı', value: 'published' }, { text: 'Taslak', value: 'draft' }] }, translations: [{ language: 'tr-TR', translation: 'Durum' }] } },
        { field: 'sort', type: 'integer', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Sıralama' }] } },
        { field: 'title', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Hizmet Adı' }] } },
        { field: 'slug', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Slug' }] } },
        { field: 'badge', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Etiket' }] } },
        { field: 'capacity_info', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Kapasite' }] } },
        { field: 'short_desc', type: 'text', meta: { interface: 'textarea', width: 'full', translations: [{ language: 'tr-TR', translation: 'Kısa Açıklama' }] } },
        { field: 'content', type: 'text', meta: { interface: 'textarea', width: 'full', translations: [{ language: 'tr-TR', translation: 'Detaylı İçerik' }] } },
        { field: 'cover_image', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Kapak Görseli' }] } },
        { field: 'features', type: 'json', meta: { interface: 'input-code', options: { language: 'json' }, width: 'full', translations: [{ language: 'tr-TR', translation: 'Öne Çıkan Özellikler' }] } }
      ]
    },
    {
      collection: 'machines',
      schema: {},
      meta: {
        collection: 'machines',
        icon: 'build_circle',
        group: 'grp_uretim',
        sort_field: 'sort',
        translations: [{ language: 'tr-TR', translation: 'Makine Parkuru' }]
      },
      fields: [
        { field: 'id', type: 'integer', schema: { is_primary_key: true, has_auto_increment: true }, meta: { hidden: true } },
        { field: 'status', type: 'string', meta: { interface: 'select-dropdown', width: 'half', options: { choices: [{ text: 'Yayınlandı', value: 'published' }, { text: 'Taslak', value: 'draft' }] }, translations: [{ language: 'tr-TR', translation: 'Durum' }] } },
        { field: 'sort', type: 'integer', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Sıralama' }] } },
        { field: 'name', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Makine Adı' }] } },
        { field: 'brand_model', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Marka/Model' }] } },
        { field: 'category', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Kategori' }] } },
        { field: 'print_type', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Baskı Türü' }] } },
        { field: 'capacity', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Kapasite' }] } },
        { field: 'description', type: 'text', meta: { interface: 'textarea', width: 'full', translations: [{ language: 'tr-TR', translation: 'Açıklama' }] } },
        { field: 'specs', type: 'json', meta: { interface: 'input-code', options: { language: 'json' }, width: 'full', translations: [{ language: 'tr-TR', translation: 'Teknik Özellikler' }] } },
        { field: 'image', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Fotoğraf' }] } },
        { field: 'video_url', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Video' }] } },
        { field: 'is_active', type: 'boolean', meta: { interface: 'boolean', width: 'half', translations: [{ language: 'tr-TR', translation: 'Aktif mi?' }] } }
      ]
    },
    {
      collection: 'production_processes',
      schema: {},
      meta: {
        collection: 'production_processes',
        icon: 'account_tree',
        group: 'grp_uretim',
        sort_field: 'sort',
        translations: [{ language: 'tr-TR', translation: 'Üretim Süreçleri' }]
      },
      fields: [
        { field: 'id', type: 'integer', schema: { is_primary_key: true, has_auto_increment: true }, meta: { hidden: true } },
        { field: 'status', type: 'string', meta: { interface: 'select-dropdown', width: 'half', options: { choices: [{ text: 'Yayınlandı', value: 'published' }, { text: 'Taslak', value: 'draft' }] }, translations: [{ language: 'tr-TR', translation: 'Durum' }] } },
        { field: 'sort', type: 'integer', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Sıralama' }] } },
        { field: 'step_number', type: 'integer', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Adım No' }] } },
        { field: 'title', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Başlık' }] } },
        { field: 'short_desc', type: 'text', meta: { interface: 'textarea', width: 'full', translations: [{ language: 'tr-TR', translation: 'Kısa Açıklama' }] } },
        { field: 'detail_text', type: 'text', meta: { interface: 'textarea', width: 'full', translations: [{ language: 'tr-TR', translation: 'Detaylı Açıklama' }] } },
        { field: 'duration_info', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Süre' }] } },
        { field: 'image', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Görsel' }] } }
      ]
    },
    {
      collection: 'references',
      schema: {},
      meta: {
        collection: 'references',
        icon: 'star',
        group: 'grp_kurumsal',
        sort_field: 'sort',
        translations: [{ language: 'tr-TR', translation: 'Referanslar' }]
      },
      fields: [
        { field: 'id', type: 'integer', schema: { is_primary_key: true, has_auto_increment: true }, meta: { hidden: true } },
        { field: 'status', type: 'string', meta: { interface: 'select-dropdown', width: 'half', options: { choices: [{ text: 'Yayınlandı', value: 'published' }, { text: 'Taslak', value: 'draft' }] }, translations: [{ language: 'tr-TR', translation: 'Durum' }] } },
        { field: 'sort', type: 'integer', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Sıralama' }] } },
        { field: 'company_name', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Firma Adı' }] } },
        { field: 'industry', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Sektör' }] } },
        { field: 'logo', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Logo' }] } },
        { field: 'collaboration_type', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'İş Birliği' }] } },
        { field: 'featured', type: 'boolean', meta: { interface: 'boolean', width: 'half', translations: [{ language: 'tr-TR', translation: 'Öne Çıkar' }] } }
      ]
    },
    {
      collection: 'certificates',
      schema: {},
      meta: {
        collection: 'certificates',
        icon: 'verified',
        group: 'grp_kurumsal',
        sort_field: 'sort',
        translations: [{ language: 'tr-TR', translation: 'Sertifikalar' }]
      },
      fields: [
        { field: 'id', type: 'integer', schema: { is_primary_key: true, has_auto_increment: true }, meta: { hidden: true } },
        { field: 'status', type: 'string', meta: { interface: 'select-dropdown', width: 'half', options: { choices: [{ text: 'Yayınlandı', value: 'published' }, { text: 'Taslak', value: 'draft' }] }, translations: [{ language: 'tr-TR', translation: 'Durum' }] } },
        { field: 'sort', type: 'integer', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Sıralama' }] } },
        { field: 'title', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Sertifika Adı' }] } },
        { field: 'organization', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Kuruluş' }] } },
        { field: 'certificate_no', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Sertifika No' }] } },
        { field: 'validity', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Geçerlilik' }] } },
        { field: 'description', type: 'text', meta: { interface: 'textarea', width: 'full', translations: [{ language: 'tr-TR', translation: 'Açıklama' }] } },
        { field: 'image', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Görsel' }] } },
        { field: 'pdf_file', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'PDF Belgesi' }] } }
      ]
    },
    {
      collection: 'blog_posts',
      schema: {},
      meta: {
        collection: 'blog_posts',
        icon: 'article',
        group: 'grp_icerik',
        sort_field: 'sort',
        translations: [{ language: 'tr-TR', translation: 'Blog Yönetimi' }]
      },
      fields: [
        { field: 'id', type: 'integer', schema: { is_primary_key: true, has_auto_increment: true }, meta: { hidden: true } },
        { field: 'status', type: 'string', meta: { interface: 'select-dropdown', width: 'half', options: { choices: [{ text: 'Yayınlandı', value: 'published' }, { text: 'Taslak', value: 'draft' }] }, translations: [{ language: 'tr-TR', translation: 'Durum' }] } },
        { field: 'sort', type: 'integer', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Sıralama' }] } },
        { field: 'title', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Başlık' }] } },
        { field: 'slug', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Slug' }] } },
        { field: 'category', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Kategori' }] } },
        { field: 'author', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Yazar' }] } },
        { field: 'read_time', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Okuma Süresi' }] } },
        { field: 'published_date', type: 'date', meta: { interface: 'datetime', width: 'half', translations: [{ language: 'tr-TR', translation: 'Tarih' }] } },
        { field: 'summary', type: 'text', meta: { interface: 'textarea', width: 'full', translations: [{ language: 'tr-TR', translation: 'Özet' }] } },
        { field: 'content', type: 'text', meta: { interface: 'input-rich-text-html', width: 'full', translations: [{ language: 'tr-TR', translation: 'İçerik' }] } },
        { field: 'cover_image', type: 'string', meta: { interface: 'input', width: 'full', translations: [{ language: 'tr-TR', translation: 'Kapak Görseli' }] } }
      ]
    },
    {
      collection: 'quote_requests',
      schema: {},
      meta: {
        collection: 'quote_requests',
        icon: 'inbox',
        group: 'grp_iletisim',
        note: 'Gelen teklif talepleri',
        translations: [{ language: 'tr-TR', translation: 'Teklif Talepleri' }]
      },
      fields: [
        { field: 'id', type: 'integer', schema: { is_primary_key: true, has_auto_increment: true }, meta: { hidden: true } },
        { field: 'created_at', type: 'timestamp', meta: { interface: 'datetime', width: 'half', translations: [{ language: 'tr-TR', translation: 'Talep Tarihi' }] } },
        {
          field: 'status',
          type: 'string',
          meta: {
            interface: 'select-dropdown',
            width: 'half',
            options: {
              choices: [
                { text: '🔴 Yeni', value: 'Yeni' },
                { text: '🟡 İnceleniyor', value: 'İnceleniyor' },
                { text: '🔵 Teklif Hazırlandı', value: 'Teklif Hazırlandı' },
                { text: '🟢 Tamamlandı', value: 'Tamamlandı' },
                { text: '⚫ İptal', value: 'İptal' }
              ]
            },
            translations: [{ language: 'tr-TR', translation: 'Durum' }]
          }
        },
        { field: 'customer_name', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Müşteri Adı' }] } },
        { field: 'company_name', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Firma Adı' }] } },
        { field: 'phone', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Telefon' }] } },
        { field: 'email', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'E-Posta' }] } },
        { field: 'print_type', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Baskı Türü' }] } },
        { field: 'quantity', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Adet' }] } },
        { field: 'description', type: 'text', meta: { interface: 'textarea', width: 'full', translations: [{ language: 'tr-TR', translation: 'Açıklama' }] } },
        { field: 'file_url', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Dosya Yolu' }] } },
        { field: 'file_name', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Dosya Adı' }] } },
        { field: 'admin_notes', type: 'text', meta: { interface: 'textarea', width: 'full', translations: [{ language: 'tr-TR', translation: 'Yönetici Notu' }] } }
      ]
    },
    {
      collection: 'animations_config',
      schema: {},
      meta: {
        collection: 'animations_config',
        icon: 'smart_display',
        group: 'grp_medya',
        note: 'Baskı makinesi videoları ve CSS/JS animasyon ayarları',
        translations: [{ language: 'tr-TR', translation: 'Video ve Animasyonlar' }]
      },
      fields: [
        { field: 'id', type: 'integer', schema: { is_primary_key: true, has_auto_increment: true }, meta: { hidden: true } },
        { field: 'status', type: 'string', meta: { interface: 'select-dropdown', width: 'half', options: { choices: [{ text: 'Aktif', value: 'published' }, { text: 'Pasif', value: 'draft' }] }, translations: [{ language: 'tr-TR', translation: 'Durum' }] } },
        { field: 'key', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Anahtar (Key)' }] } },
        { field: 'title', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Başlık' }] } },
        { field: 'target_page', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Kullanıldığı Sayfa' }] } },
        { field: 'video_url', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Video URL' }] } },
        { field: 'mobile_video_url', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Mobil Video' }] } },
        { field: 'poster_image', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Poster Görseli' }] } },
        {
          field: 'animation_type',
          type: 'string',
          meta: {
            interface: 'select-dropdown',
            width: 'half',
            options: {
              choices: [
                { text: 'Fade', value: 'Fade' },
                { text: 'Slide', value: 'Slide' },
                { text: 'Reveal', value: 'Reveal' },
                { text: 'Zoom', value: 'Zoom' },
                { text: 'Mask Reveal', value: 'Mask Reveal' },
                { text: 'Product Print Reveal', value: 'Product Print Reveal' }
              ]
            },
            translations: [{ language: 'tr-TR', translation: 'Animasyon Türü' }]
          }
        },
        { field: 'animation_duration_ms', type: 'integer', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Süre (ms)' }] } },
        { field: 'autoplay', type: 'boolean', meta: { interface: 'boolean', width: 'half', translations: [{ language: 'tr-TR', translation: 'Autoplay' }] } },
        { field: 'loop', type: 'boolean', meta: { interface: 'boolean', width: 'half', translations: [{ language: 'tr-TR', translation: 'Loop' }] } },
        { field: 'muted', type: 'boolean', meta: { interface: 'boolean', width: 'half', translations: [{ language: 'tr-TR', translation: 'Muted' }] } }
      ]
    },
    {
      collection: 'navigation_menus',
      schema: {},
      meta: {
        collection: 'navigation_menus',
        icon: 'menu',
        group: 'grp_icerik',
        sort_field: 'sort',
        translations: [{ language: 'tr-TR', translation: 'Menü ve Footer' }]
      },
      fields: [
        { field: 'id', type: 'integer', schema: { is_primary_key: true, has_auto_increment: true }, meta: { hidden: true } },
        { field: 'status', type: 'string', meta: { interface: 'select-dropdown', width: 'half', options: { choices: [{ text: 'Yayınlandı', value: 'published' }, { text: 'Taslak', value: 'draft' }] }, translations: [{ language: 'tr-TR', translation: 'Durum' }] } },
        { field: 'sort', type: 'integer', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Sıralama' }] } },
        { field: 'menu_location', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Menü Konumu' }] } },
        { field: 'title', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Menü Yazısı' }] } },
        { field: 'url', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'URL' }] } },
        { field: 'badge', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Rozet' }] } }
      ]
    },
    {
      collection: 'seo_settings',
      schema: {},
      meta: {
        collection: 'seo_settings',
        icon: 'search',
        group: 'grp_ayarlar',
        translations: [{ language: 'tr-TR', translation: 'SEO Ayarları' }]
      },
      fields: [
        { field: 'id', type: 'integer', schema: { is_primary_key: true, has_auto_increment: true }, meta: { hidden: true } },
        { field: 'page_slug', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Sayfa Kodu' }] } },
        { field: 'meta_title', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Meta Title' }] } },
        { field: 'meta_description', type: 'text', meta: { interface: 'textarea', width: 'full', translations: [{ language: 'tr-TR', translation: 'Meta Description' }] } },
        { field: 'meta_keywords', type: 'string', meta: { interface: 'input', width: 'full', translations: [{ language: 'tr-TR', translation: 'Anahtar Kelimeler' }] } },
        { field: 'og_image', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'OG Görseli' }] } }
      ]
    }
  ];

  for (const pc of physicalCollections) {
    const res = await fetch(`${DIRECTUS_URL}/collections`, {
      method: 'POST',
      headers,
      body: JSON.stringify(pc)
    });
    if (res.ok) {
      console.log(`✨ Fiziksel koleksiyon ve tablo oluşturuldu: ${pc.collection}`);
    } else {
      console.error(`❌ Koleksiyon hatası: ${pc.collection}`, await res.text());
    }
  }

  // Güvenlik & İzinler (Public)
  console.log('🔒 İzinler tanımlanıyor...');
  const publicCollections = [
    'site_settings',
    'whatsapp_settings',
    'pages',
    'products',
    'services',
    'machines',
    'production_processes',
    'references',
    'certificates',
    'blog_posts',
    'animations_config',
    'navigation_menus',
    'seo_settings'
  ];

  for (const col of publicCollections) {
    await fetch(`${DIRECTUS_URL}/permissions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        role: null,
        collection: col,
        action: 'read',
        permissions: col.includes('settings') ? {} : { status: { _eq: 'published' } },
        fields: ['*']
      })
    });
  }

  // Quote Requests: Public CREATE only!
  await fetch(`${DIRECTUS_URL}/permissions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      role: null,
      collection: 'quote_requests',
      action: 'create',
      permissions: {},
      fields: ['customer_name', 'company_name', 'phone', 'email', 'print_type', 'quantity', 'description', 'file_url', 'file_name']
    })
  });

  console.log('✅ Rebuild tamamlandı. Veri tohumlama betiği çağrılıyor...');
}

rebuild().catch(err => {
  console.error('Rebuild hatası:', err);
  process.exit(1);
});
