/**
 * NİZAMLAR BASKI — İÇERİK GÖÇÜ (idempotent, yıkıcı değil)
 * HTML'deki tasarım metinlerini (italik vurgular, satır sonları) CMS'e aktarır, ama yöneticinin
 * değiştirdiği HİÇBİR değeri ezmez:
 *   - pages.hero_title / hero_subtitle: yalnızca hâlâ ilk seed değerindeyse (ya da boşsa) güncellenir
 *   - pages.sections_data: yalnızca boşsa doldurulur
 *   - blog_posts.content: yalnızca kısa seed özetindeyse (<600 karakter) statik makale gövdesiyle değiştirilir
 *   - navigation_menus: yalnızca tablo boşsa tohumlanır
 *   - site_settings yeni alanlar: yalnızca boşsa doldurulur
 * Biçim: *italik vurgu*  ve satır sonu = \n  (client güvenli şekilde <span class="editorial-italic"> / <br> üretir)
 */
const fs = require('fs');
const path = require('path');
const { adminClient } = require('./lib/env');

const ROOT = path.join(__dirname, '..');
const pageContent = require('./seed/page_content.json');

function seedValues() {
  const src = fs.readFileSync(path.join(__dirname, 'seed_content.js'), 'utf8');
  const out = {};
  const re = /slug:\s*'([^']+)'[\s\S]*?hero_title:\s*'((?:[^'\\]|\\.)*)'[\s\S]*?hero_subtitle:\s*'((?:[^'\\]|\\.)*)'/g;
  let m;
  while ((m = re.exec(src))) out[m[1]] = { title: m[2].replace(/\\'/g, "'"), subtitle: m[3].replace(/\\'/g, "'") };
  return out;
}

const NAV = [
  { title: 'Ana Sayfa', url: '/' },
  { title: 'Kurumsal', url: '/hakkimizda/', children: [['Hakkımızda', '/hakkimizda/'], ['Sürdürülebilirlik', '/surdurulebilirlik/'], ['Sertifikalarımız', '/sertifikalarimiz/']] },
  { title: 'Hizmetlerimiz', url: '/hizmetlerimiz/', children: [['Tüm Hizmetler', '/hizmetlerimiz/'], ['DTF Baskı', '/hizmetlerimiz/dtf-baski/', 'Popüler'], ['Emprime Baskı', '/hizmetlerimiz/emprime-baski/'], ['Tişört Baskı', '/hizmetlerimiz/tisort-baski/']] },
  { title: 'Üretim', url: '/uretim-surecleri/', children: [['Üretim Süreçleri', '/uretim-surecleri/'], ['Makine Parkurumuz', '/makine-parkurumuz/']] },
  { title: 'Galeri', url: '/galeri/' },
  { title: 'Referanslar', url: '/referanslarimiz/' },
  { title: 'Blog', url: '/blog/' },
  { title: 'İletişim', url: '/iletisim/' }
];

async function main() {
  const { api } = await adminClient();
  const seed = seedValues();

  // 1) Sayfalar
  const pages = await api('GET', '/items/pages?limit=-1&fields=id,slug,hero_title,hero_subtitle,sections_data');
  for (const p of pages) {
    const c = pageContent[p.slug];
    if (!c) continue;
    const patch = {};
    const sd = seed[p.slug] || {};
    if (c.hero.title && (!p.hero_title || p.hero_title === sd.title)) patch.hero_title = c.hero.title;
    if (c.hero.subtitle && (!p.hero_subtitle || p.hero_subtitle === sd.subtitle)) patch.hero_subtitle = c.hero.subtitle;
    if (!p.sections_data && Object.keys(c.sections).length) patch.sections_data = c.sections;
    if (Object.keys(patch).length) { await api('PATCH', `/items/pages/${p.id}`, patch); console.log(`✨ sayfa güncellendi: ${p.slug} [${Object.keys(patch).join(', ')}]`); }
    else console.log(`↩️  sayfa değişmedi: ${p.slug}`);
  }

  // 2) Blog makale gövdeleri
  const posts = await api('GET', '/items/blog_posts?limit=-1&fields=id,slug,content');
  for (const b of posts) {
    const file = path.join(ROOT, 'blog', b.slug, 'index.html');
    if ((b.content || '').length >= 600 || !fs.existsSync(file)) continue;
    const html = fs.readFileSync(file, 'utf8');
    const m = html.match(/<div class="article-content"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/article>/);
    if (!m) continue;
    const body = m[1].replace(/\.\.\/\.\.\/teklif-al\//g, '/teklif-al/').trim();
    await api('PATCH', `/items/blog_posts/${b.id}`, { content: body });
    console.log(`✨ blog içeriği aktarıldı: ${b.slug} (${body.length} karakter)`);
  }

  // 3) Menü
  const navCount = (await api('GET', '/items/navigation_menus?limit=1&fields=id')).length;
  if (!navCount) {
    let sort = 1;
    for (const item of NAV) {
      const parent = await api('POST', '/items/navigation_menus', { status: 'published', sort: sort++, menu_location: 'header', title: item.title, url: item.url, open_new_tab: false, show_desktop: true, show_mobile: true });
      for (const [i, ch] of (item.children || []).entries()) {
        await api('POST', '/items/navigation_menus', { status: 'published', sort: i + 1, menu_location: 'header', title: ch[0], url: ch[1], badge: ch[2] || null, parent_id: parent.id, open_new_tab: false, show_desktop: true, show_mobile: true });
      }
    }
    console.log('✨ menü tohumlandı');
  } else console.log('↩️  menü dolu, dokunulmadı');

  // 4) Site ayarları (yeni alanlar)
  const site = await api('GET', '/items/site_settings');
  const sp = {};
  if (!site.address_full) sp.address_full = 'Organize Sanayi Bölgesi, Tekstilciler Sanayi Sitesi, No: 18-20, Başakşehir / İstanbul';
  if (!site.working_hours_detail) sp.working_hours_detail = 'Hafta İçi: 08:30 - 18:30 | Cumartesi: 09:00 - 14:00 (Pazar: Kapalı)';
  if (!site.order_email) sp.order_email = 'siparis@nizamlarbaski.com';
  if (Object.keys(sp).length) { await api('PATCH', '/items/site_settings', sp); console.log('✨ site_settings yeni alanlar dolduruldu'); }
  console.log('✅ İçerik göçü tamam.');
}
main().catch(e => { console.error('Hata:', e.message); process.exit(1); });
