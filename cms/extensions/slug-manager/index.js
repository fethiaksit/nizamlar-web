/**
 * Directus Hook: Otomatik Slug Üretimi & 301 Yönlendirme Geçmişi
 *
 * Hizmet veya Blog başlığı değiştiğinde:
 * 1. Türkçe karakterleri kusursuz slug formatına dönüştürür.
 * 2. Slug çakışmalarını tespit edip (-2, -3) benzersiz hale getirir.
 * 3. Eski slug'ı 'old_slugs' alanına ve 'url_redirects' tablosuna kaydeder.
 * 4. Sabit kurumsal sayfaların (home, hakkimizda vb.) URL'lerini korur.
 */

function slugify(text) {
  if (!text) return '';
  return text
    .toString()
    .trim()
    .replace(/Ğ/g, 'g').replace(/ğ/g, 'g')
    .replace(/Ü/g, 'u').replace(/ü/g, 'u')
    .replace(/Ş/g, 's').replace(/ş/g, 's')
    .replace(/I/g, 'i').replace(/ı/g, 'i')
    .replace(/İ/g, 'i').replace(/i̇/g, 'i')
    .replace(/Ö/g, 'o').replace(/ö/g, 'o')
    .replace(/Ç/g, 'c').replace(/ç/g, 'c')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function getUniqueSlug(db, collection, baseSlug, currentId = null) {
  let candidate = baseSlug || 'isimsiz';
  let counter = 1;
  while (true) {
    const query = db(collection).where('slug', candidate);
    if (currentId) query.whereNot('id', currentId);
    const existing = await query.first();
    if (!existing) return candidate;
    counter++;
    candidate = `${baseSlug}-${counter}`;
  }
}

module.exports = function ({ filter, action }, { database, logger }) {
  const MANAGED_COLLECTIONS = {
    services: '/hizmetlerimiz',
    blog_posts: '/blog'
  };

  // 1. Yeni kayıt oluşturulurken (items.create)
  filter('items.create', async (input, meta, context) => {
    const prefix = MANAGED_COLLECTIONS[meta.collection];
    if (!prefix) return input;

    const db = context.database || database;
    const baseText = input.slug ? input.slug : input.title;
    if (baseText) {
      const rawSlug = slugify(baseText);
      input.slug = await getUniqueSlug(db, meta.collection, rawSlug);
    }
    if (!input.old_slugs) input.old_slugs = [];
    return input;
  });

  // 2. Kayıt güncellenirken (items.update)
  filter('items.update', async (input, meta, context) => {
    const prefix = MANAGED_COLLECTIONS[meta.collection];
    if (!prefix) return input;

    const db = context.database || database;
    const id = meta.keys && meta.keys[0];
    if (!id) return input;

    try {
      const current = await db(meta.collection).where('id', id).first();
      if (!current) return input;

      let targetSlug = null;
      if (input.slug !== undefined && input.slug !== null) {
        // Manuel slug girişi
        const candidate = slugify(input.slug);
        if (candidate && candidate !== current.slug) {
          targetSlug = candidate;
        }
      } else if (input.title && input.title !== current.title) {
        // Başlık değişti ve slug manuel girilmedi: otomatik slug üret
        const candidate = slugify(input.title);
        if (candidate && candidate !== current.slug) {
          targetSlug = candidate;
        }
      }

      if (targetSlug) {
        const uniqueSlug = await getUniqueSlug(db, meta.collection, targetSlug, id);
        input.slug = uniqueSlug;

        // Eski slug geçmişini sakla
        let history = [];
        try {
          if (Array.isArray(current.old_slugs)) history = [...current.old_slugs];
          else if (typeof current.old_slugs === 'string') history = JSON.parse(current.old_slugs || '[]');
        } catch (e) { history = []; }

        if (current.slug && !history.includes(current.slug)) {
          history.push(current.slug);
          input.old_slugs = history;
        }

        // url_redirects tablosuna 301 kaydı ekle
        const fromPath = `${prefix}/${current.slug}/`;
        const toPath = `${prefix}/${uniqueSlug}/`;

        try {
          const hasRedirectTable = await db.schema.hasTable('url_redirects');
          if (hasRedirectTable) {
            const existingRedirect = await db('url_redirects').where('from_path', fromPath).first();
            if (existingRedirect) {
              await db('url_redirects').where('id', existingRedirect.id).update({
                to_path: toPath,
                status_code: 301
              });
            } else {
              await db('url_redirects').insert({
                from_path: fromPath,
                to_path: toPath,
                collection: meta.collection,
                item_id: id,
                status_code: 301
              });
            }
          }
        } catch (err) {
          if (logger) logger.warn(`[slug-manager] url_redirects güncellenemedi: ${err.message}`);
        }
      }
    } catch (err) {
      if (logger) logger.error(`[slug-manager] Hata: ${err.message}`);
    }

    return input;
  });
};
