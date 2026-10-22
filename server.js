/**
 * NİZAMLAR BASKI — UNIFIED WEB & CMS SERVER
 * Express: statik site + Directus proxy (/admin, /items, /assets/:id) + filtreli public içerik API'si
 *          (/api/public/*) + güvenli teklif API'si (/api/quote).
 *
 * Güvenlik özeti:
 *  - Sırlar yalnızca .env / ortam değişkenlerinden okunur.
 *  - Yalnızca beyaz listedeki dizinler yayınlanır (proje kökü, .git, cms/, node_modules ASLA).
 *  - Ziyaretçiler içeriği /api/public/* üzerinden, sunucu tarafında ZORUNLU status=published filtresiyle okur.
 *  - Teklifler doğrulanır, spam korumalıdır; DB kaydı başarısızsa kullanıcıya hata döner (sahte başarı yok).
 *  - Teklif dosyaları web köküne konmaz; yalnızca oturum açmış Directus kullanıcıları indirebilir.
 */

require('./cms/lib/env'); // .env yükler

const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { createProxyMiddleware } = require('http-proxy-middleware');
const multer = require('multer');

const app = express();
const IS_PROD = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 3030;
const DIRECTUS_URL = (process.env.DIRECTUS_URL || 'http://127.0.0.1:8055').replace(/\/$/, '');
const SERVICE_TOKEN = process.env.DIRECTUS_SERVICE_TOKEN || '';
const ROOT = __dirname;

app.disable('x-powered-by');
app.set('trust proxy', process.env.TRUST_PROXY ? Number(process.env.TRUST_PROXY) || process.env.TRUST_PROXY : 'loopback');

/* ------------------------------------------------------------------ *
 * 0. Yardımcılar
 * ------------------------------------------------------------------ */
const PRIVATE_QUOTE_DIR = path.join(ROOT, 'cms', 'private', 'quotes'); // statik olarak ASLA sunulmaz
fs.mkdirSync(PRIVATE_QUOTE_DIR, { recursive: true });

async function directus(pathAndQuery, { method = 'GET', body, token = SERVICE_TOKEN, timeoutMs = 8000 } = {}) {
  const res = await fetch(`${DIRECTUS_URL}${pathAndQuery}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs)
  });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch (e) { /* düz metin */ }
  return { ok: res.ok, status: res.status, json, text };
}

function parseCookies(header) {
  const out = {};
  String(header || '').split(';').forEach(p => {
    const i = p.indexOf('=');
    if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
}

/** Directus oturumu (yönetici paneli çerezi) geçerli mi? Önizleme ve teklif dosyası indirme için. */
async function isStaffRequest(req) {
  const t = parseCookies(req.headers.cookie).directus_session_token;
  if (!t) return false;
  try {
    const r = await directus('/users/me?fields=id,status', { token: t, timeoutMs: 4000 });
    return r.ok && r.json && r.json.data && r.json.data.status === 'active';
  } catch (e) { return false; }
}

/* ------------------------------------------------------------------ *
 * 1. Güvenlik başlıkları
 * ------------------------------------------------------------------ */
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (IS_PROD) res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

/* ------------------------------------------------------------------ *
 * 2. Directus proxy (/admin, /items, /auth, /assets/:uuid ...)
 * ------------------------------------------------------------------ */
const directusProxy = createProxyMiddleware({
  target: DIRECTUS_URL,
  changeOrigin: true,
  ws: true,
  xfwd: true,
  on: {
    error: (err, req, res) => {
      console.error('Directus proxy hatası:', err.message);
      if (res && !res.headersSent && res.status) res.status(502).json({ error: 'CMS şu anda erişilemiyor' });
    }
  }
});

const DIRECTUS_ROUTES = [
  'admin', 'auth', 'activity', 'collections', 'comments', 'dashboards', 'extensions', 'fields', 'files', 'flows',
  'folders', 'graphql', 'insights', 'items', 'notifications', 'operations', 'panels', 'permissions', 'policies',
  'presets', 'relations', 'revisions', 'roles', 'schema', 'server', 'settings', 'shares', 'sync', 'translations',
  'tours', 'users', 'utils', 'versions', 'websocket', 'access', 'metrics'
];
const STATIC_ASSET_DIRS = ['css', 'js', 'images', 'videos']; // /assets/<bunlar> Express'e, /assets/<uuid> Directus'a gider

app.use((req, res, next) => {
  const p = req.path;
  if (p === '/assets' || p.startsWith('/assets/')) {
    const seg = p.split('/')[2];
    if (STATIC_ASSET_DIRS.includes(seg)) return next();
    return directusProxy(req, res, next); // Directus dosyaları
  }
  if (DIRECTUS_ROUTES.some(r => p === `/${r}` || p.startsWith(`/${r}/`))) return directusProxy(req, res, next);
  next();
});

/* ------------------------------------------------------------------ *
 * 3. Public içerik API'si (yalnızca yayımlanmış içerik)
 * ------------------------------------------------------------------ */
const PUBLIC_COLLECTIONS = {
  site_settings: { singleton: true },
  whatsapp_settings: { singleton: true },
  mockup_preview_settings: { singleton: true },
  seo_settings: { sort: 'id' },
  pages: { status: true, filters: ['slug'], slugIn: true },
  products: { status: true, sort: 'sort' },
  services: { status: true, sort: 'sort', filters: ['slug'] },
  machines: { status: true, sort: 'sort' },
  production_processes: { status: true, sort: 'sort,step_number' },
  references: { status: true, sort: 'sort' },
  certificates: { status: true, sort: 'sort' },
  blog_posts: { status: true, sort: '-published_date', filters: ['slug'] },
  animations_config: { status: true, filters: ['key'] },
  navigation_menus: { status: true, sort: 'sort' }
};
const SAFE_VALUE = /^[\p{L}\p{N}\-_./ ]{1,160}$/u;

app.get('/api/public/:collection', async (req, res) => {
  const cfg = PUBLIC_COLLECTIONS[req.params.collection];
  res.setHeader('Cache-Control', 'no-cache'); // her yenilemede doğrula (ETag ile 304)
  if (!cfg) return res.status(404).json({ error: 'Bilinmeyen koleksiyon' });
  if (!SERVICE_TOKEN) return res.status(503).json({ error: 'CMS servis anahtarı yapılandırılmamış' });

  const q = new URLSearchParams();
  if (cfg.singleton) {
    // tek kayıt
  } else {
    q.set('limit', '-1');
    if (cfg.sort) q.set('sort', cfg.sort);
    const wantsPreview = req.query.preview === '1';
    const preview = wantsPreview && cfg.status && await isStaffRequest(req);
    if (cfg.status && !preview) q.set('filter[status][_eq]', 'published'); // ZORUNLU filtre
    for (const f of cfg.filters || []) {
      if (req.query[f] === undefined) continue;
      const v = String(req.query[f]);
      if (!SAFE_VALUE.test(v)) return res.status(400).json({ error: `Geçersiz ${f}` });
      q.set(`filter[${f}][_eq]`, v);
    }
    if (cfg.slugIn && req.query.slugs) {
      const list = String(req.query.slugs).split(',').filter(v => SAFE_VALUE.test(v)).slice(0, 6);
      if (list.length) q.set('filter[slug][_in]', list.join(','));
    }
  }

  try {
    const r = await directus(`/items/${req.params.collection}?${q.toString()}`);
    if (!r.ok) {
      console.error(`/api/public/${req.params.collection} -> Directus HTTP ${r.status}`);
      return res.status(502).json({ error: 'CMS verisi okunamadı' });
    }
    res.json(r.json);
  } catch (e) {
    console.error('Public API hatası:', e.message);
    res.status(502).json({ error: 'CMS erişilemiyor' });
  }
});

/* ------------------------------------------------------------------ *
 * 4. Teklif formu (/api/quote)
 * ------------------------------------------------------------------ */
const ALLOWED_EXT = ['.pdf', '.ai', '.psd', '.png', '.jpg', '.jpeg', '.svg', '.tif', '.tiff', '.zip', '.rar'];
const MAX_FILE_BYTES = 25 * 1024 * 1024;

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, PRIVATE_QUOTE_DIR),
    filename: (req, file, cb) => cb(null, `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`)
  }),
  limits: { fileSize: MAX_FILE_BYTES, files: 1, fields: 20, fieldSize: 8 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_EXT.includes(ext)) return cb(null, true);
    const err = new Error('Desteklenmeyen dosya formatı. PDF, AI, PSD, PNG, JPG, SVG, TIFF, ZIP veya RAR yükleyin.');
    err.code = 'BAD_FILE_TYPE';
    cb(err);
  }
});

/** Dosya içeriğini (ilk baytlar) uzantıyla doğrular — yalnızca uzantıya güvenmez. */
function fileContentMatches(file) {
  const fd = fs.openSync(file.path, 'r');
  const buf = Buffer.alloc(512);
  const n = fs.readSync(fd, buf, 0, 512, 0);
  fs.closeSync(fd);
  const head = buf.subarray(0, n);
  const ext = path.extname(file.originalname).toLowerCase();
  const starts = sig => head.subarray(0, sig.length).equals(Buffer.from(sig));
  switch (ext) {
    case '.pdf': return starts([0x25, 0x50, 0x44, 0x46]);
    case '.ai': return starts([0x25, 0x50, 0x44, 0x46]) || starts([0x25, 0x21]); // PDF tabanlı veya PostScript
    case '.psd': return starts([0x38, 0x42, 0x50, 0x53]);
    case '.png': return starts([0x89, 0x50, 0x4e, 0x47]);
    case '.jpg': case '.jpeg': return starts([0xff, 0xd8, 0xff]);
    case '.tif': case '.tiff': return starts([0x49, 0x49, 0x2a, 0x00]) || starts([0x4d, 0x4d, 0x00, 0x2a]);
    case '.zip': return starts([0x50, 0x4b, 0x03, 0x04]) || starts([0x50, 0x4b, 0x05, 0x06]);
    case '.rar': return starts([0x52, 0x61, 0x72, 0x21]);
    case '.svg': {
      const txt = fs.readFileSync(file.path, 'utf8');
      return /<svg[\s>]/i.test(txt.slice(0, 2048)) && !/<script|onload\s*=|onerror\s*=|javascript:/i.test(txt);
    }
    default: return false;
  }
}

// Basit bellek içi hız sınırı (IP başına)
const rateBuckets = new Map();
function rateLimit({ windowMs, max }) {
  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip;
    const hits = (rateBuckets.get(key) || []).filter(t => now - t < windowMs);
    if (hits.length >= max) {
      res.setHeader('Retry-After', Math.ceil(windowMs / 1000));
      return res.status(429).json({ success: false, error: 'Çok fazla deneme. Lütfen biraz sonra tekrar deneyin.' });
    }
    hits.push(now);
    rateBuckets.set(key, hits);
    next();
  };
}
setInterval(() => { const now = Date.now(); for (const [k, v] of rateBuckets) if (!v.some(t => now - t < 3600e3)) rateBuckets.delete(k); }, 600e3).unref();

const clean = (v, max) => String(v === undefined || v === null ? '' : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max);

function validateQuote(b) {
  const errors = {};
  const name = clean(b.name || b.customer_name, 120);
  const email = clean(b.email, 160);
  const phone = clean(b.phone, 40);
  if (name.length < 2) errors.name = 'Ad soyad zorunludur.';
  if (!phone && !email) errors.contact = 'Telefon veya e-posta bilgisinden en az biri zorunludur.';
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errors.email = 'E-posta adresi geçersiz.';
  if (phone && (phone.replace(/\D/g, '').length < 7 || !/^[+\d\s()\-.]+$/.test(phone))) errors.phone = 'Telefon numarası geçersiz.';
  const extra = [['Ürün türü', b.product_type], ['Baskı ebadı', b.print_size], ['Kumaş', b.fabric]]
    .map(([k, v]) => [k, clean(v, 200)]).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`);
  const description = clean([clean(b.notes || b.description || b.message, 3500), ...extra].filter(Boolean).join('\n'), 4000);
  return {
    errors,
    value: {
      customer_name: name,
      company_name: clean(b.company || b.company_name, 160),
      phone,
      email,
      print_type: clean(b.service || b.print_type, 120) || 'Genel Tekstil Baskı',
      quantity: clean(b.quantity, 60) || 'Belirtilmedi',
      description
    }
  };
}

const discard = file => { if (file && file.path) fs.unlink(file.path, () => {}); };

app.post('/api/quote',
  express.json({ limit: '10mb' }),
  express.urlencoded({ extended: true, limit: '10mb' }),
  rateLimit({ windowMs: 10 * 60e3, max: 6 }),
  (req, res, next) => upload.single('design_file')(req, res, err => {
    if (!err) return next();
    const msg = err.code === 'LIMIT_FILE_SIZE' ? `Dosya en fazla ${MAX_FILE_BYTES / 1024 / 1024} MB olabilir.` : err.message;
    return res.status(400).json({ success: false, error: msg });
  }),
  async (req, res) => {
    const file = req.file;
    try {
      const b = req.body || {};
      // Spam: honeypot + çok hızlı gönderim
      if (clean(b.website, 200) || clean(b.company_url, 200)) { discard(file); return res.status(400).json({ success: false, error: 'Geçersiz istek.' }); }
      const started = Number(b._form_ts);
      if (!started || Date.now() - started < 2500) { discard(file); return res.status(400).json({ success: false, error: 'Form çok hızlı gönderildi. Lütfen tekrar deneyin.' }); }

      const { errors, value } = validateQuote(b);
      if (Object.keys(errors).length) { discard(file); return res.status(422).json({ success: false, error: 'Lütfen form alanlarını kontrol edin.', fields: errors }); }

      if (file && !fileContentMatches(file)) { discard(file); return res.status(400).json({ success: false, error: 'Dosya içeriği uzantısıyla uyuşmuyor veya güvenli değil.' }); }
      if (!SERVICE_TOKEN) { discard(file); console.error('DIRECTUS_SERVICE_TOKEN tanımsız: teklif kaydedilemedi'); return res.status(503).json({ success: false, error: 'Teklif sistemi şu anda yapılandırılmamış. Lütfen telefon veya WhatsApp ile ulaşın.' }); }

      const payload = {
        ...value,
        file_url: file ? `/api/admin/quote-file/${file.filename}` : '',
        file_name: file ? clean(file.originalname, 200) : '',
        status: 'Yeni',
        created_at: new Date().toISOString(),
        source_ip_hash: crypto.createHash('sha256').update(String(req.ip)).digest('hex').slice(0, 16)
      };

      const r = await directus('/items/quote_requests', { method: 'POST', body: payload });
      if (!r.ok) {
        discard(file);
        console.error(`Teklif Directus'a kaydedilemedi: HTTP ${r.status} ${r.text.slice(0, 300)}`);
        return res.status(502).json({ success: false, error: 'Talebiniz kaydedilemedi. Lütfen tekrar deneyin veya bizi arayın.' });
      }
      return res.status(201).json({ success: true, message: 'Teklif talebiniz başarıyla kaydedildi.', id: r.json && r.json.data && r.json.data.id });
    } catch (err) {
      discard(file);
      console.error('Teklif işleme hatası:', err);
      return res.status(500).json({ success: false, error: 'Beklenmeyen bir hata oluştu. Talebiniz kaydedilmedi.' });
    }
  }
);

// Teklif dosyaları: yalnızca giriş yapmış Directus kullanıcıları
app.get('/api/admin/quote-file/:name', async (req, res) => {
  if (!/^[0-9a-f-]{36}\.[a-z0-9]{2,4}$/.test(req.params.name)) return res.status(400).end();
  if (!(await isStaffRequest(req))) return res.status(401).json({ error: 'Yetkisiz' });
  const full = path.join(PRIVATE_QUOTE_DIR, req.params.name);
  if (!fs.existsSync(full)) return res.status(404).json({ error: 'Dosya yok' });
  res.setHeader('Cache-Control', 'private, no-store');
  res.download(full);
});

/* ------------------------------------------------------------------ *
 * 5. Sağlık
 * ------------------------------------------------------------------ */
app.get('/api/health', async (req, res) => {
  let cms = 'offline';
  try { cms = (await directus('/server/ping', { token: '', timeoutMs: 3000 })).ok ? 'online' : 'error'; } catch (e) { /* offline */ }
  res.setHeader('Cache-Control', 'no-store');
  res.json({ status: 'ok', cms_status: cms, quote_ready: Boolean(SERVICE_TOKEN), timestamp: new Date().toISOString() });
});

/* ------------------------------------------------------------------ *
 * 6. Dinamik detay sayfaları (blog yazıları ve hizmet detayları)
 *    - Taslak/silinmiş içerik 404 döner (statik yedek sayfa olsa bile).
 *    - CMS kapalıysa statik yedek sayfaya düşer.
 * ------------------------------------------------------------------ */
const esc = s => String(s === undefined || s === null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function renderTemplate(file, vars, res) {
  let html = fs.readFileSync(path.join(ROOT, 'templates', file), 'utf8');
  for (const [k, v] of Object.entries(vars)) html = html.split(`{{${k}}}`).join(esc(v));
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.send(versionAssets(html));
}

function dynamicDetail(collection, base, template) {
  return async (req, res, next) => {
    const slug = req.params.slug;
    if (!SAFE_VALUE.test(slug) || !SERVICE_TOKEN) return next();
    if (!req.path.endsWith('/')) return res.redirect(301, `${base}/${encodeURIComponent(slug)}/`);
    try {
      const r = await directus(`/items/${collection}?limit=1&filter[slug][_eq]=${encodeURIComponent(slug)}`);
      if (!r.ok) return next(); // CMS sorunu: statik yedeğe düş
      let item = r.json.data && r.json.data[0];

      // Slug doğrudan eşleşmediyse bilinen alias eşleşmelerini kontrol et (örn: serigrafi-baski <-> emprime-baski)
      if (!item && collection === 'services') {
        const aliasMap = { 'serigrafi-baski': 'emprime-baski', 'emprime-baski': 'serigrafi-baski' };
        const altSlug = aliasMap[slug];
        if (altSlug) {
          const altR = await directus(`/items/services?limit=1&filter[slug][_eq]=${encodeURIComponent(altSlug)}`);
          if (altR.ok && altR.json.data && altR.json.data[0]) {
            return res.redirect(301, `${base}/${encodeURIComponent(altSlug)}/`);
          }
        }
      }

      if (!item) return next(); // CMS'te yok: statik (varsa) devam
      const preview = req.query.preview === '1' && await isStaffRequest(req);
      if (item.status !== 'published' && !preview) return res.status(404).sendFile(path.join(ROOT, '404.html'));

      const pageTitle = `${item.title} | Nizamlar Baskı`;
      const pageDesc = item.seo_description || item.summary || item.short_desc || '';

      // Özel bir statik sayfa şablonu varsa (örn: hizmetlerimiz/dtf-baski/index.html):
      // Onu oku ve CMS verileriyle dinamik zenginleştirerek sun (böylece özel bölümler korunur)
      const specificPath = path.join(ROOT, base.replace(/^\//, ''), slug, 'index.html');
      if (fs.existsSync(specificPath)) {
        let html = fs.readFileSync(specificPath, 'utf8');
        if (item.title) {
          html = html.replace(/<title>.*?<\/title>/i, `<title>${esc(pageTitle)}</title>`);
          html = html.replace(/(<meta\s+property=["']og:title["']\s+content=["']).*?(["'])/i, `$1${esc(pageTitle)}$2`);
          html = html.replace(/(<h1[^>]*class=["'][^"']*page-hero-title[^"']*["'][^>]*>)([\s\S]*?)(<\/h1>)/i, `$1${esc(item.title)}$3`);
          html = html.replace(/(<span[^>]*data-cms-field=["']title["'][^>]*>)([\s\S]*?)(<\/span>)/i, `$1${esc(item.title)}$3`);
        }
        if (pageDesc) {
          html = html.replace(/(<meta\s+name=["']description["']\s+content=["']).*?(["'])/i, `$1${esc(pageDesc)}$2`);
          html = html.replace(/(<meta\s+property=["']og:description["']\s+content=["']).*?(["'])/i, `$1${esc(pageDesc)}$2`);
          html = html.replace(/(<p[^>]*class=["'][^"']*page-hero-desc[^"']*["'][^>]*>)([\s\S]*?)(<\/p>)/i, `$1${esc(pageDesc)}$3`);
        }
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache');
        return res.send(versionAssets(html));
      }

      return renderTemplate(template, {
        HEAD_TITLE: pageTitle,
        TITLE: item.title,
        DESC: pageDesc,
        SLUG: slug
      }, res);
    } catch (e) { return next(); }
  };
}

/* ------------------------------------------------------------------ *
 * Directus Admin "Bu Sayfaya Git" köprü yönlendirmeleri
 * ------------------------------------------------------------------ */
app.get('/go/services/:slug', (req, res) => res.redirect(302, `/hizmetlerimiz/${encodeURIComponent(req.params.slug)}/`));
app.get('/go/services', (req, res) => res.redirect(302, '/hizmetlerimiz/'));
app.get('/go/blog/:slug', (req, res) => res.redirect(302, `/blog/${encodeURIComponent(req.params.slug)}/`));
app.get('/go/blog', (req, res) => res.redirect(302, '/blog/'));
app.get('/go/pages/:slug', (req, res) => {
  const s = req.params.slug;
  return res.redirect(302, s === 'home' ? '/' : `/${encodeURIComponent(s)}/`);
});
app.get('/blog/:slug', dynamicDetail('blog_posts', '/blog', 'blog-post.html'));
app.get('/blog/:slug/', dynamicDetail('blog_posts', '/blog', 'blog-post.html'));
app.get('/hizmetlerimiz/:slug', dynamicDetail('services', '/hizmetlerimiz', 'service-detail.html'));
app.get('/hizmetlerimiz/:slug/', dynamicDetail('services', '/hizmetlerimiz', 'service-detail.html'));

/* ------------------------------------------------------------------ *
 * 7. Statik site (YALNIZCA beyaz liste) + sürümlü JS/CSS
 * ------------------------------------------------------------------ */
const PAGE_DIRS = ['blog', 'galeri', 'hakkimizda', 'hizmetlerimiz', 'iletisim', 'makine-parkurumuz', 'referanslarimiz', 'sertifikalarimiz', 'surdurulebilirlik', 'teklif-al', 'uretim-surecleri'];
const ROOT_FILES = { '/robots.txt': 'robots.txt', '/sitemap.xml': 'sitemap.xml' };

const versionCache = new Map();
function assetVersion(rel) {
  const full = path.join(ROOT, rel);
  try {
    const st = fs.statSync(full);
    const hit = versionCache.get(full);
    if (hit && hit.m === st.mtimeMs) return hit.v;
    const v = crypto.createHash('md5').update(fs.readFileSync(full)).digest('hex').slice(0, 10);
    versionCache.set(full, { m: st.mtimeMs, v });
    return v;
  } catch (e) { return null; }
}
/** HTML içindeki yerel .js/.css bağlantılarına içerik özetli ?v= ekler (önbellek kırma). */
function versionAssets(html) {
  return html.replace(/((?:src|href)=")((?:\.\.\/|\.\/|\/)*(assets\/(?:js|css)\/[^"?#]+))(")/g, (m, a, url, rel, d) => {
    const v = assetVersion(rel);
    return v ? `${a}${url}?v=${v}${d}` : m;
  });
}

function sendHtml(res, file) {
  try {
    const html = fs.readFileSync(file, 'utf8');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache'); // HTML her zaman doğrulanır; içerik zaten API'den gelir
    res.send(versionAssets(html));
  } catch (e) {
    res.status(404).sendFile(path.join(ROOT, '404.html'));
  }
}

app.get('/favicon.ico', (req, res) => {
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.sendFile(path.join(ROOT, 'assets', 'images', 'logo.svg'));
});

app.get(Object.keys(ROOT_FILES), (req, res) => res.sendFile(path.join(ROOT, ROOT_FILES[req.path])));

// Statik varlıklar. JS/CSS ?v=<içerik özeti> ile istenirse (HTML'e sunucu ekler) üretimde 1 yıl önbelleğe alınır;
// özetsiz istek her seferinde doğrulanır. Görseller kısa süre önbelleğe alınır.
const staticOpts = {
  index: false, dotfiles: 'ignore', redirect: false,
  setHeaders: (res, filePath) => {
    const versioned = Boolean(res.req && res.req.query && res.req.query.v);
    if (/\.(js|css)$/.test(filePath)) {
      res.setHeader('Cache-Control', IS_PROD && versioned ? 'public, max-age=31536000, immutable' : 'no-cache');
    } else {
      res.setHeader('Cache-Control', IS_PROD ? 'public, max-age=3600, stale-while-revalidate=86400' : 'no-cache');
    }
  }
};
for (const dir of STATIC_ASSET_DIRS) app.use(`/assets/${dir}`, express.static(path.join(ROOT, 'assets', dir), staticOpts));

// Sayfalar
app.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  let p = decodeURIComponent(req.path);
  if (p === '/' || p === '/index.html') return sendHtml(res, path.join(ROOT, 'index.html'));
  const top = p.split('/')[1];
  if (!PAGE_DIRS.includes(top)) return next();
  if (!p.endsWith('/') && !path.extname(p)) return res.redirect(301, `${p}/`);
  const rel = p.endsWith('/') ? `${p}index.html` : p;
  const full = path.normalize(path.join(ROOT, rel));
  if (!full.startsWith(ROOT + path.sep) || !full.endsWith('.html')) return next();
  if (!fs.existsSync(full)) return next();
  sendHtml(res, full);
});

app.use((req, res) => {
  res.status(404);
  const f = path.join(ROOT, '404.html');
  if (req.accepts('html') && fs.existsSync(f)) return res.sendFile(f);
  res.json({ error: 'Bulunamadı' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Nizamlar Baskı: http://localhost:${PORT}  (yönetim: /admin)  [${IS_PROD ? 'production' : 'development'}]`);
    if (!SERVICE_TOKEN) console.warn('⚠️  DIRECTUS_SERVICE_TOKEN tanımsız: içerik API\'si ve teklif formu çalışmaz. Çalıştırın: node cms/setup_service_user.js');
  });
}

module.exports = app;
