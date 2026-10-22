/**
 * Nizamlar Baskı — Directus Admin "Bu Sayfaya Git" Buton ve Yönlendirme Yapılandırıcısı
 *
 * 1. Directus Settings: project_url ve preview_base_url ayarlanır.
 * 2. Collection preview_url: services, pages ve blog_posts koleksiyonlarına
 *    Directus native preview_url şablonu tanımlanır.
 * 3. view_on_site Presentation Link Alanı:
 *    services, pages ve blog_posts formlarının en üstüne (sort: 1)
 *    "Bu Sayfaya Git (Web Sitesinde Aç)" butonu eklenir/güncellenir.
 *
 * Yerel ortamda: PUBLIC_SITE_URL (http://localhost:3030)
 * Canlı ortamda: https://nizamlarbaski.com
 */
const { adminClient } = require('./lib/env');

const SITE_URL = (process.env.PUBLIC_SITE_URL || 'http://localhost:3030').replace(/\/$/, '');

async function setup() {
  console.log(`🔗 "Bu Sayfaya Git" yapılandırması başlatılıyor (Hedef: ${SITE_URL})...`);
  const { api } = await adminClient();

  // 1. Directus Genel Ayarları
  try {
    await api('PATCH', '/settings', {
      project_url: SITE_URL,
      preview_base_url: SITE_URL
    });
    console.log('✅ Directus Settings (project_url ve preview_base_url) güncellendi.');
  } catch (err) {
    console.warn('⚠️ Settings güncellenirken uyarı:', err.message);
  }

  // 2. Koleksiyon preview_url Tanımları
  const collConfigs = [
    { coll: 'services', url: `${SITE_URL}/hizmetlerimiz/{{slug}}/` },
    { coll: 'pages', url: `${SITE_URL}/{{slug}}/` },
    { coll: 'blog_posts', url: `${SITE_URL}/blog/{{slug}}/` }
  ];

  for (const { coll, url } of collConfigs) {
    try {
      await api('PATCH', `/collections/${coll}`, {
        meta: { preview_url: url }
      });
      console.log(`✅ Koleksiyon preview_url güncellendi [${coll}]: ${url}`);
    } catch (err) {
      console.warn(`⚠️ [${coll}] preview_url uyarısı:`, err.message);
    }
  }

  // 3. Form Üzerindeki "Bu Sayfaya Git" Alanı (presentation-links)
  const fieldConfigs = [
    {
      coll: 'services',
      links: [
        {
          url: `${SITE_URL}/hizmetlerimiz/{{slug}}/`,
          label: 'Bu Hizmetin Sayfasına Git (Web Sitesinde Aç) ↗',
          icon: 'open_in_new',
          type: 'primary'
        },
        {
          url: `${SITE_URL}/hizmetlerimiz/`,
          label: 'Tüm Hizmetlerimiz Sayfası ↗',
          icon: 'layers'
        }
      ]
    },
    {
      coll: 'pages',
      links: [
        {
          url: `${SITE_URL}/{{slug}}/`,
          label: 'Bu Sayfaya Git (Web Sitesinde Aç) ↗',
          icon: 'open_in_new',
          type: 'primary'
        },
        {
          url: `${SITE_URL}/`,
          label: 'Ana Sayfaya Git ↗',
          icon: 'home'
        }
      ]
    },
    {
      coll: 'blog_posts',
      links: [
        {
          url: `${SITE_URL}/blog/{{slug}}/`,
          label: 'Bu Blog Yazısına Git (Web Sitesinde Aç) ↗',
          icon: 'open_in_new',
          type: 'primary'
        },
        {
          url: `${SITE_URL}/blog/`,
          label: 'Tüm Blog Yazıları ↗',
          icon: 'article'
        }
      ]
    }
  ];

  for (const { coll, links } of fieldConfigs) {
    const existing = await api('GET', `/fields/${coll}`);
    const exists = existing.some(f => f.field === 'view_on_site');

    const payload = {
      meta: {
        interface: 'presentation-links',
        special: ['alias', 'no-data'],
        sort: 1, // Formun en tepesinde görünsün
        width: 'full',
        translations: [
          { language: 'tr-TR', translation: 'Bu Sayfaya Git' }
        ],
        note: `Bu butona tıkladığınızda içeriğin ${SITE_URL} üzerindeki canlı web sayfası açılır.`,
        options: { links }
      }
    };

    if (exists) {
      await api('PATCH', `/fields/${coll}/view_on_site`, payload);
      console.log(`✅ [${coll}] view_on_site alanı güncellendi.`);
    } else {
      await api('POST', `/fields/${coll}`, {
        field: 'view_on_site',
        type: 'alias',
        ...payload
      });
      console.log(`✨ [${coll}] view_on_site alanı oluşturuldu.`);
    }
  }

  console.log('\n🎉 "Bu Sayfaya Git" yönlendirme altyapısı başarıyla tamamlandı!');
}

if (require.main === module) {
  setup().catch(err => {
    console.error('❌ Hata:', err);
    process.exit(1);
  });
}

module.exports = { setup };
