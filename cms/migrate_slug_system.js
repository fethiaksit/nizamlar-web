/**
 * Nizamlar Baskı — Otomatik Slug & 301 Yönlendirme Veritabanı Şeması
 *
 * 1. services koleksiyonuna old_slugs (JSON dizisi) alanı ekler.
 * 2. blog_posts koleksiyonuna old_slugs alanı ekler.
 * 3. url_redirects koleksiyonunu oluşturur (eski URL -> yeni URL 301 eşleşmeleri).
 */
const { adminClient } = require('./lib/env');

async function migrate() {
  console.log('🔄 Otomatik Slug ve Yönlendirme Şeması Taşınıyor...');
  const { api } = await adminClient();

  // 1. services.old_slugs
  try {
    const sFields = await api('GET', '/fields/services');
    if (!sFields.some(f => f.field === 'old_slugs')) {
      await api('POST', '/fields/services', {
        field: 'old_slugs',
        type: 'json',
        schema: { default_value: [] },
        meta: {
          interface: 'tags',
          special: ['cast-json'],
          width: 'full',
          translations: [{ language: 'tr-TR', translation: 'Eski URL Slug Geçmişi' }],
          note: 'Bu hizmetin geçmişteki slug adresleri. Bu adreslere gelen ziyaretçiler otomatik 301 ile güncel URL\'ye yönlendirilir.'
        }
      });
      console.log('✨ [services] old_slugs alanı oluşturuldu.');
    } else {
      console.log('↩️  [services] old_slugs alanı zaten mevcut.');
    }
  } catch (err) {
    console.warn('⚠️ services.old_slugs uyarısı:', err.message);
  }

  // 2. blog_posts.old_slugs
  try {
    const bFields = await api('GET', '/fields/blog_posts');
    if (!bFields.some(f => f.field === 'old_slugs')) {
      await api('POST', '/fields/blog_posts', {
        field: 'old_slugs',
        type: 'json',
        schema: { default_value: [] },
        meta: {
          interface: 'tags',
          special: ['cast-json'],
          width: 'full',
          translations: [{ language: 'tr-TR', translation: 'Eski URL Slug Geçmişi' }],
          note: 'Yazının geçmişteki slug adresleri (otomatik 301 yönlendirmesi için).'
        }
      });
      console.log('✨ [blog_posts] old_slugs alanı oluşturuldu.');
    } else {
      console.log('↩️  [blog_posts] old_slugs alanı zaten mevcut.');
    }
  } catch (err) {
    console.warn('⚠️ blog_posts.old_slugs uyarısı:', err.message);
  }

  // 3. url_redirects koleksiyonu
  try {
    const colls = await api('GET', '/collections');
    if (!colls.some(c => c.collection === 'url_redirects')) {
      await api('POST', '/collections', {
        collection: 'url_redirects',
        meta: {
          collection: 'url_redirects',
          icon: 'alt_route',
          group: 'grp_ayarlar',
          translations: [{ language: 'tr-TR', translation: 'URL 301 Yönlendirmeleri' }],
          note: 'Hizmet ve blog URL değişikliklerinde otomatik kaydedilen 301 yönlendirme haritası.'
        },
        schema: { name: 'url_redirects' },
        fields: [
          {
            field: 'id',
            type: 'integer',
            schema: { is_primary_key: true, has_auto_increment: true }
          },
          {
            field: 'from_path',
            type: 'string',
            meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Eski URL / Slug' }] }
          },
          {
            field: 'to_path',
            type: 'string',
            meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Yeni Hedef URL' }] }
          },
          {
            field: 'collection',
            type: 'string',
            meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'İlgili Koleksiyon' }] }
          },
          {
            field: 'item_id',
            type: 'integer',
            meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Öğe ID' }] }
          },
          {
            field: 'status_code',
            type: 'integer',
            schema: { default_value: 301 },
            meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'HTTP Yönlendirme Kodu (301)' }] }
          }
        ]
      });
      console.log('✨ url_redirects koleksiyonu oluşturuldu.');
    } else {
      console.log('↩️  url_redirects koleksiyonu zaten mevcut.');
    }
  } catch (err) {
    console.warn('⚠️ url_redirects uyarısı:', err.message);
  }

  // Başlangıç yönlendirmesi: serigrafi-baski -> emprime-baski
  try {
    const r = await api('GET', '/items/url_redirects?filter[from_path][_eq]=/hizmetlerimiz/serigrafi-baski/');
    if (!r.length) {
      await api('POST', '/items/url_redirects', {
        from_path: '/hizmetlerimiz/serigrafi-baski/',
        to_path: '/hizmetlerimiz/emprime-baski/',
        collection: 'services',
        item_id: 2,
        status_code: 301
      });
      console.log('✨ İlk 301 yönlendirmesi eklendi: /hizmetlerimiz/serigrafi-baski/ -> /hizmetlerimiz/emprime-baski/');
    }
  } catch (err) {
    console.warn('⚠️ İlk yönlendirme eklenirken uyarı:', err.message);
  }

  // Emprime Baskı (ID: 2) old_slugs alanına serigrafi-baski ekle
  try {
    const s2 = await api('GET', '/items/services/2');
    if (s2) {
      const slugs = Array.isArray(s2.old_slugs) ? s2.old_slugs : [];
      if (!slugs.includes('serigrafi-baski')) {
        slugs.push('serigrafi-baski');
        await api('PATCH', '/items/services/2', { old_slugs: slugs });
        console.log('✨ Emprime Baskı old_slugs güncellendi:', slugs);
      }
    }
  } catch (err) {
    console.warn('⚠️ s2.old_slugs uyarısı:', err.message);
  }

  console.log('🎉 Otomatik slug ve 301 şema hazırlığı tamamlandı!');
}

if (require.main === module) {
  migrate().catch(console.error);
}

module.exports = { migrate };
