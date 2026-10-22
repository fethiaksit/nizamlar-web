'use strict';
const fs = require('fs');
const path = require('path');

function slugify(input) {
  return String(input || '').toLocaleLowerCase('tr-TR').replace(/ı/g, 'i')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
function canonical(s) {
  const saved = slugify(s.slug), fromName = slugify(s.title);
  // Correct legacy saved slugs without word separators.
  if (saved && fromName && !saved.includes('-') && fromName.includes('-') &&
      saved.replace(/-/g, '') === fromName.replace(/-/g, '')) return fromName;
  return saved || fromName;
}
function match(services, input) {
  const wanted = slugify(input);
  const published = services.filter(s => s && s.status === 'published');
  const exact = published.find(s => canonical(s) === wanted);
  if (exact) return exact;
  const loose = published.filter(s => canonical(s).replace(/-/g, '') === wanted.replace(/-/g, ''));
  return loose.length === 1 ? loose[0] : null;
}
function esc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function imgSrc(service) {
  const raw = service.cover_image_file || service.cover_image || '';
  const name = String(raw && typeof raw === 'object' ? raw.id : raw);
  if (/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(name)) return '/assets/' + name;
  if (/^\/?assets\/images\/[\w\-./]+$/i.test(name) && !name.includes('..'))
    return '/' + name.replace(/^\/+/, '');
  return '';
}
function render(service, slug) {
  const name = esc(service.title || 'Hizmet'), description = esc(service.short_desc || '');
  const body = esc(service.content || ''), image = imgSrc(service);
  let features = service.features || [];
  if (typeof features === 'string') { try { features = JSON.parse(features); } catch (_) { features = []; } }
  if (!Array.isArray(features)) features = [];
  const list = features.map(f => '<li>' + esc(f) + '</li>').join('');
  return [
    '<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">',
    '<title>' + name + ' | Nizamlar Baskı</title><meta name="description" content="' + description + '">',
    '<link rel="canonical" href="https://nizamlarbaski.com/hizmetlerimiz/' + slug + '/">',
    '<link rel="stylesheet" href="/assets/css/theme.css"><link rel="stylesheet" href="/assets/css/nav.css">',
    '<link rel="stylesheet" href="/assets/css/footer.css"><link rel="stylesheet" href="/assets/css/pages.css">',
    '</head><body><header class="site-header"><div class="header-container">',
    '<a class="header-logo" href="/"><img src="/assets/images/logo-light.svg" alt="Nizamlar Baskı" width="220" height="42"></a>',
    '<nav class="nav-menu"><div class="nav-item"><a class="nav-link" href="/">Ana Sayfa</a></div>',
    '<div class="nav-item"><a class="nav-link" href="/hizmetlerimiz/">Hizmetlerimiz</a></div>',
    '<div class="nav-item"><a class="nav-link" href="/iletisim/">İletişim</a></div></nav>',
    '<div class="header-actions"><a class="btn btn-gold" href="/teklif-al/">Teklif Al</a></div>',
    '</div></header>',
    '<main><section class="page-hero"><div class="container"><div class="breadcrumb">',
    '<a href="/">Ana Sayfa</a> / <a href="/hizmetlerimiz/">Hizmetlerimiz</a> / ' + name,
    '</div><h1 class="page-hero-title">' + name + '</h1><p class="page-hero-desc">' + description + '</p>',
    '</div></section><section class="section bg-cream"><div class="container">',
    '<div class="grid grid-2 items-center gap-6"><div><div class="section-tag">' + esc(service.badge) + '</div>',
    '<h2 class="section-title">' + name + '</h2><div class="gold-line-solid"></div>',
    '<p class="lead" style="white-space:pre-wrap">' + (body || description) + '</p>',
    (service.capacity_info ? '<p>' + esc(service.capacity_info) + '</p>' : ''),
    (list ? '<ul style="margin:1rem 0 2rem;padding-left:1.5rem">' + list + '</ul>' : ''),
    '<a class="btn btn-gold" href="/teklif-al/">Fiyat Teklifi Al</a></div>',
    (image ? '<div><img src="' + esc(image) + '" alt="' + name + '" style="width:100%;height:auto;border-radius:var(--radius-md)"></div>' : ''),
    '</div></div></section></main><footer class="site-footer"><div class="container" style="padding:2rem 0">',
    '<a href="/">Nizamlar Baskı</a> · <a href="/hizmetlerimiz/">Tüm Hizmetler</a>',
    '</div></footer></body></html>'
  ].join('\n');
}
function register(app, opts) {
  app.get('/hizmetlerimiz/:slug', async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    try {
      const api = new URL('/items/services', opts.directusUrl);
      api.searchParams.set('filter[status][_eq]', 'published');
      api.searchParams.set('limit', '100');
      const response = await fetch(api, { signal: AbortSignal.timeout(6000) });
      if (!response.ok) return res.status(502).send('Hizmet verisine erişilemiyor.');
      const json = await response.json();
      if (!Array.isArray(json.data)) return res.status(502).send('Hizmet verisi geçersiz.');
      const service = match(json.data, req.params.slug);
      if (!service) return res.status(404).sendFile(path.join(opts.root, '404.html'));
      const slug = canonical(service), url = '/hizmetlerimiz/' + slug + '/';
      if (req.path !== url) return res.redirect(301, url);
      const existing = path.join(opts.root, 'hizmetlerimiz', slug, 'index.html');
      if (fs.existsSync(existing)) {
        let page = fs.readFileSync(existing, 'utf8');
        if (service.title) page = page.replace(/(<h1 class="page-hero-title"[^>]*>)[\s\S]*?(<\/h1>)/,
          (_, a, b) => a + esc(service.title) + b);
        if (service.short_desc) page = page.replace(/(<p class="page-hero-desc"[^>]*>)[\s\S]*?(<\/p>)/,
          (_, a, b) => a + esc(service.short_desc) + b);
        return res.type('html').send(page);
      }
      return res.type('html').send(render(service, slug));
    } catch (error) {
      console.error('CMS service route error:', error.message);
      return res.status(503).send('Hizmet sayfası şu anda kullanılamıyor.');
    }
  });
}
module.exports = register;
module.exports._test = { slugify, canonical, match, render };
