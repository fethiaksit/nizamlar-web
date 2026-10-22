/**
 * NİZAMLAR BASKI — CMS CLIENT RUNTIME (v3)
 *
 * Directus içeriğini sitenin gerçek bileşenlerine bağlar. Tüm okumalar aynı origin'deki
 * /api/public/* ucundan yapılır (yalnızca yayımlanmış içerik; sunucu filtreler).
 *
 * Eşleştirme sözleşmesi (HTML'deki data-cms-* öznitelikleri):
 *   data-cms-hero="title|subtitle|button|media"   -> pages.hero_*
 *   data-cms-text="sN.tag|title|desc"             -> pages.sections_data
 *   data-cms-site="<site_settings alanı>"         -> site_settings
 *   data-cms-list="machines|references|processes|blog|gallery|certificates"
 *   data-cms-service="slug [alias ...]"           -> hizmetler sayfasındaki bloklar
 *   data-cms-detail="blog|service"                -> sunucunun ürettiği detay şablonları
 *   #product-gallery-slider                       -> products (ana sayfa vitrini)
 * Biçim: metin alanlarında *italik vurgu* ve satır sonu desteklenir; HTML ASLA ham olarak basılmaz.
 * API hatasında statik HTML (yedek içerik) olduğu gibi kalır; hata konsola ve data-cms-status'a yazılır.
 */
(function () {
  'use strict';

  const API = '/api/public';
  const params = new URLSearchParams(window.location.search);
  const isPreview = params.get('preview') === 'true' || params.get('draft') === 'true';

  /* ------------------------------ yardımcılar ------------------------------ */
  const rawPath = window.location.pathname.replace(/index\.html$/, '');
  const segments = rawPath.split('/').filter(Boolean);
  const prefix = '../'.repeat(segments.length);
  const tr = s => String(s || '').toLocaleUpperCase('tr-TR');
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  const esc = s => String(s === undefined || s === null ? '' : s)
    .replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /** *italik* + satır sonu -> güvenli HTML (önce kaçışlanır, sonra yalnızca iki sabit etiket üretilir). */
  const markup = text => esc(text).replace(/\*([^*\n]+)\*/g, '<span class="editorial-italic">$1</span>').replace(/\r?\n/g, '<br>');

  const SAFE_URL = /^(https?:|mailto:|tel:|\/(?!\/)|#|\.{1,2}\/)/i;
  /** Yönetici girdisi bağlantı: güvenli şemalar; köke göre yazılmış 'teklif-al/' -> '/teklif-al/'. */
  function link(u) {
    u = String(u || '').trim();
    if (!u) return '';
    if (/^(javascript|data|vbscript):/i.test(u)) return '';
    if (SAFE_URL.test(u)) return u;
    return /^[\w\-\u00C0-\u024F]/.test(u) ? '/' + u.replace(/^\/+/, '') : '';
  }

  /** Directus dosya UUID'si, mutlak URL veya site içi yol -> kullanılabilir URL. */
  function media(v) {
    if (!v || typeof v !== 'string') return '';
    v = v.trim();
    if (UUID.test(v)) return `/assets/${v}`;
    if (/^https?:\/\//i.test(v) || v.startsWith('/')) return v;
    if (/^(javascript|data):/i.test(v)) return '';
    return prefix + v.replace(/^\.?\//, '');
  }
  /** Medya kütüphanesi alanı (uuid) eski metin alanından önceliklidir. */
  const pickMedia = (item, fileField, textField) => media(item[fileField]) || media(item[textField]);

  const FALLBACK_IMG = () => `${prefix}assets/images/placeholder.svg`;
  document.addEventListener('error', e => {
    const img = e.target;
    if (img && img.tagName === 'IMG' && img.dataset.cmsImg && !img.dataset.cmsFailed) {
      img.dataset.cmsFailed = '1';
      img.src = FALLBACK_IMG();
    }
  }, true);
  const imgTag = (src, alt, extra = '') => `<img src="${esc(src || FALLBACK_IMG())}" alt="${esc(alt)}" data-cms-img="1" ${extra}>`;

  /** Yönetici HTML'ini (blog/hizmet içeriği) izin listesiyle temizler. */
  const ALLOWED_TAGS = new Set(['P', 'BR', 'H2', 'H3', 'H4', 'UL', 'OL', 'LI', 'STRONG', 'B', 'EM', 'I', 'U', 'A', 'IMG', 'BLOCKQUOTE', 'DIV', 'SPAN', 'TABLE', 'THEAD', 'TBODY', 'TR', 'TH', 'TD', 'HR', 'FIGURE', 'FIGCAPTION', 'CODE', 'PRE', 'SMALL', 'SUB', 'SUP']);
  const ALLOWED_ATTRS = new Set(['href', 'src', 'alt', 'title', 'class', 'colspan', 'rowspan', 'target', 'rel', 'width', 'height', 'loading']);
  function sanitizeHtml(dirty) {
    const doc = new DOMParser().parseFromString(`<body>${dirty || ''}</body>`, 'text/html');
    (function walk(node) {
      Array.from(node.children).forEach(el => {
        if (!ALLOWED_TAGS.has(el.tagName)) {
          if (['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'LINK', 'META', 'FORM', 'SVG', 'MATH', 'TEMPLATE'].includes(el.tagName.toUpperCase())) { el.remove(); return; }
          const frag = document.createDocumentFragment();
          while (el.firstChild) frag.appendChild(el.firstChild);
          el.replaceWith(frag);
          walk(node);
          return;
        }
        Array.from(el.attributes).forEach(a => {
          const n = a.name.toLowerCase();
          if (!ALLOWED_ATTRS.has(n)) { el.removeAttribute(a.name); return; }
          if ((n === 'href' || n === 'src') && !link(a.value) && !media(a.value)) el.removeAttribute(a.name);
        });
        if (el.tagName === 'A' && el.getAttribute('target') === '_blank') el.setAttribute('rel', 'noopener noreferrer');
        walk(el);
      });
    })(doc.body);
    return doc.body.innerHTML;
  }

  /* ------------------------------ API katmanı ------------------------------ */
  const cache = new Map();
  function load(collection, query = {}) {
    const qs = new URLSearchParams(query);
    if (isPreview) qs.set('preview', '1');
    const key = `${collection}?${qs}`;
    if (!cache.has(key)) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 9000);
      cache.set(key, fetch(`${API}/${collection}${qs.toString() ? '?' + qs : ''}`, { credentials: 'same-origin', headers: { Accept: 'application/json' }, signal: ctrl.signal })
        .then(async res => {
          if (!res.ok) throw new Error(`${collection}: HTTP ${res.status}`);
          const json = await res.json();
          return json.data;
        })
        .finally(() => clearTimeout(timer)));
    }
    return cache.get(key);
  }
  const failures = [];
  async function guarded(name, fn) {
    try { await fn(); } catch (err) {
      failures.push(name);
      console.error(`[CMS] "${name}" yüklenemedi; statik içerik korunuyor.`, err);
    }
  }

  /* ------------------------------ önizleme rozeti ------------------------------ */
  function setupPreviewBanner() {
    if (!isPreview) return;
    const b = document.createElement('div');
    b.id = 'cms-preview-banner';
    b.setAttribute('role', 'status');
    b.style.cssText = 'position:fixed;top:0;left:0;width:100%;background:linear-gradient(90deg,#c5a059,#a4823e);color:#111214;font:700 13px system-ui,sans-serif;padding:10px 16px;display:flex;align-items:center;justify-content:space-between;z-index:999999;box-shadow:0 4px 20px rgba(0,0,0,.5)';
    b.innerHTML = `<span>CANLI ÖNİZLEME (taslaklar yalnızca yönetici oturumuyla görünür)</span>
      <span><a href="/admin" target="_blank" rel="noopener" style="background:#18191b;color:#c5a059;padding:4px 12px;border-radius:4px;text-decoration:none;margin-right:8px">Yönetim Paneli ↗</a>
      <a href="${esc(window.location.pathname)}" style="background:rgba(0,0,0,.2);color:#fff;padding:4px 10px;border-radius:4px;text-decoration:none">Önizlemeden Çık ✕</a></span>`;
    document.body.prepend(b);
    document.body.style.paddingTop = '40px';
  }

  /* ------------------------------ site ayarları ------------------------------ */
  async function hydrateSite() {
    const site = await load('site_settings');
    if (!site) return;
    document.querySelectorAll('[data-cms-site]').forEach(el => {
      const field = el.getAttribute('data-cms-site');
      const val = site[field];
      if (!val) return; // boşsa statik yedek
      el.textContent = val;
      if (field === 'contact_phone') el.setAttribute('href', `tel:${(site.contact_phone_raw || val).replace(/[^\d+]/g, '')}`);
      if (field === 'contact_email' || field === 'order_email') el.setAttribute('href', `mailto:${val}`);
    });
    const social = { instagram: site.instagram_url, linkedin: site.linkedin_url, facebook: site.facebook_url, youtube: site.youtube_url };
    Object.entries(social).forEach(([name, url]) => {
      const u = link(url);
      if (u) document.querySelectorAll(`a[href*="${name}.com"]`).forEach(a => a.setAttribute('href', u));
    });
    // Mobil çekmece satırları (nav-component tarafından sonradan üretilir)
    window.__NZ_SITE = site;
    applySiteToDrawer();
  }
  function applySiteToDrawer() {
    const site = window.__NZ_SITE;
    if (!site) return;
    document.querySelectorAll('.mobile-contact-line [data-cms-site]').forEach(el => {
      const v = site[el.getAttribute('data-cms-site')];
      if (v) el.textContent = (el.dataset.cmsPrefix || '') + v;
    });
  }

  /* ------------------------------ WhatsApp ------------------------------ */
  let waUrl = '';
  function waLinks() {
    if (!waUrl) return;
    document.querySelectorAll('a[href*="wa.me"], a[href*="api.whatsapp.com"], a[data-whatsapp-btn]').forEach(el => {
      el.setAttribute('href', waUrl);
      el.setAttribute('target', '_blank');
      el.setAttribute('rel', 'noopener noreferrer');
    });
  }
  async function hydrateWhatsApp() {
    const wa = await load('whatsapp_settings');
    if (!wa) return;
    if (wa.is_active === false) {
      document.querySelectorAll('a[href*="wa.me"], a[data-whatsapp-btn]').forEach(el => { el.hidden = true; });
      return;
    }
    const number = String(wa.whatsapp_number || '').replace(/\D/g, '');
    if (!number) return;
    const msg = wa.default_message || 'Merhaba Nizamlar Baskı, tekstil baskı çözümleriniz hakkında bilgi almak istiyorum.';
    waUrl = `https://wa.me/${number}?text=${encodeURIComponent(msg)}`;
    window.__NIZAMLAR_WHATSAPP_URL = waUrl;
    window.__NIZAMLAR_WHATSAPP_NUMBER = wa.whatsapp_number;
    waLinks();

    const pages = String(wa.display_pages || 'all').split(',').map(s => s.trim().toLowerCase());
    const slug = segments[0] || 'home';
    const showOnPage = pages.includes('all') || pages.includes(slug);
    if (wa.floating_button_active !== false && showOnPage && !document.getElementById('cms-floating-whatsapp')) {
      const a = document.createElement('a');
      a.id = 'cms-floating-whatsapp';
      a.href = waUrl; a.target = '_blank'; a.rel = 'noopener noreferrer';
      a.setAttribute('aria-label', wa.button_text || 'WhatsApp ile İletişime Geçin');
      a.style.cssText = 'position:fixed;bottom:24px;right:24px;width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,#25D366,#128C7E);color:#fff;display:flex;align-items:center;justify-content:center;z-index:9999;box-shadow:0 6px 24px rgba(37,211,102,.45);transition:transform .3s;cursor:pointer';
      a.innerHTML = '<svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.18-2.587-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.311.045-.698.071-1.114-.063-.263-.085-.604-.199-1.04-.388-1.848-.801-3.045-2.673-3.138-2.797-.093-.125-.754-.999-.754-1.905 0-.907.478-1.353.648-1.537.17-.184.372-.23.496-.23.125 0 .25.002.359.007.114.006.267-.043.418.32.155.372.531 1.295.577 1.39.046.094.077.205.016.327-.061.123-.092.2-.183.308-.092.107-.193.24-.276.322-.093.092-.19.193-.082.378.109.184.484.798 1.038 1.291.713.633 1.314.829 1.501.921.187.093.297.078.406-.046.11-.125.469-.546.594-.734.125-.187.25-.156.422-.094.172.062 1.093.516 1.28.609.188.094.313.141.359.219.047.078.047.453-.097.858z"/></svg><span style="position:absolute;right:70px;background:#18191b;color:#fff;font-size:12px;font-weight:600;white-space:nowrap;padding:6px 12px;border-radius:6px;border:1px solid rgba(197,160,89,.4);opacity:0;transform:translateX(10px);transition:opacity .3s,transform .3s;pointer-events:none"></span>';
      a.querySelector('span').textContent = wa.button_text || 'Hızlı Teklif Al';
      const tip = a.querySelector('span');
      a.addEventListener('mouseenter', () => { a.style.transform = 'scale(1.08)'; tip.style.opacity = '1'; tip.style.transform = 'none'; });
      a.addEventListener('mouseleave', () => { a.style.transform = 'scale(1)'; tip.style.opacity = '0'; tip.style.transform = 'translateX(10px)'; });
      document.body.appendChild(a);
    }
  }

  /* ------------------------------ sayfa içeriği + SEO ------------------------------ */
  function slugCandidates() {
    if (!segments.length) return ['home'];
    const out = [];
    for (let i = segments.length; i > 0; i--) out.push(segments.slice(0, i).join('/'));
    return out; // en özelden en genele: 'hizmetlerimiz/dtf-baski', 'hizmetlerimiz'
  }
  const setMeta = (sel, attr, val) => { const m = document.querySelector(sel); if (m && val) m.setAttribute(attr, val); };

  async function hydratePage() {
    if (document.querySelector('[data-cms-detail]')) return; // detay sayfaları ayrı hydrate edilir
    const cands = slugCandidates();
    const pages = await load('pages', { slugs: cands.join(',') });
    const p = cands.map(c => (pages || []).find(x => x.slug === c)).find(Boolean);
    if (!p) return;

    let seo = null;
    try { seo = (await load('seo_settings') || []).find(s => cands.includes(s.page_slug)); } catch (e) { console.warn('[CMS] seo_settings okunamadı', e); }
    const title = (seo && seo.meta_title) || p.seo_title;
    const desc = (seo && seo.meta_description) || p.seo_description;
    if (title) { document.title = title; setMeta('meta[property="og:title"]', 'content', title); }
    if (desc) { setMeta('meta[name="description"]', 'content', desc); setMeta('meta[property="og:description"]', 'content', desc); }
    const kw = (seo && seo.meta_keywords) || p.seo_keywords;
    if (kw) setMeta('meta[name="keywords"]', 'content', kw);
    if (seo && seo.og_image) setMeta('meta[property="og:image"]', 'content', media(seo.og_image));

    const t = document.querySelector('[data-cms-hero="title"]');
    if (t && p.hero_title) t.innerHTML = markup(p.hero_title);
    const s = document.querySelector('[data-cms-hero="subtitle"]');
    if (s && p.hero_subtitle) s.innerHTML = markup(p.hero_subtitle);

    const btn = document.querySelector('[data-cms-hero="button"]');
    if (btn && p.hero_btn_text) {
      const label = btn.querySelector('span:not(.btn-icon)') || btn;
      label.textContent = p.hero_btn_text;
      const href = link(p.hero_btn_link);
      if (href) btn.setAttribute('href', href);
    }

    // Hero medyası: yalnızca medya kütüphanesi alanları (hero_image_file / hero_video_file) uygulanır.
    const mediaBox = document.querySelector('[data-cms-hero="media"]');
    if (mediaBox) {
      const vid = media(p.hero_video_file);
      const img = media(p.hero_image_file);
      if (vid) {
        mediaBox.innerHTML = `<video src="${esc(vid)}" ${img ? `poster="${esc(img)}"` : ''} autoplay muted loop playsinline style="width:100%;height:100%;object-fit:cover"></video>`;
      } else if (img) {
        const el = mediaBox.querySelector('img');
        if (el) { el.src = img; el.removeAttribute('srcset'); }
      }
    }

    const sd = p.sections_data;
    if (sd && typeof sd === 'object') {
      document.querySelectorAll('[data-cms-text]').forEach(el => {
        const [key, field] = el.getAttribute('data-cms-text').split('.');
        const val = sd[key] && sd[key][field];
        if (typeof val === 'string' && val.trim()) el.innerHTML = markup(val);
      });
    }
  }

  /* ------------------------------ menü ------------------------------ */
  function buildTree(items, flag) {
    const vis = items.filter(i => i[flag] !== false && link(i.url));
    const roots = vis.filter(i => !i.parent_id).sort((a, b) => (a.sort ?? 999) - (b.sort ?? 999));
    return roots.map(r => ({ ...r, children: vis.filter(c => c.parent_id === r.id).sort((a, b) => (a.sort ?? 999) - (b.sort ?? 999)) }));
  }
  const norm = u => { try { return new URL(u, location.origin).pathname.replace(/index\.html$/, '').replace(/\/$/, '') || '/'; } catch (e) { return u; } };
  const here = norm(location.pathname);
  const isActive = u => { const n = norm(u); return n === '/' ? here === '/' : here === n || here.startsWith(n + '/'); };
  const tgt = i => (i.open_new_tab ? ' target="_blank" rel="noopener noreferrer"' : '');

  async function hydrateNavigation() {
    const items = await load('navigation_menus');
    if (!items || !items.length) return; // boşsa statik/nav-component yedeği
    const desktop = buildTree(items, 'show_desktop');
    const mobile = buildTree(items, 'show_mobile');
    const nav = document.querySelector('.nav-menu');
    if (nav && desktop.length) {
      nav.innerHTML = desktop.map(it => {
        const kids = it.children;
        const act = isActive(it.url) || kids.some(k => isActive(k.url));
        return `<div class="nav-item ${act ? 'active' : ''}"><a href="${esc(link(it.url))}" class="nav-link ${act ? 'active' : ''}"${tgt(it)}>${esc(it.title)}${kids.length ? '<svg class="nav-chevron" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z"/></svg>' : ''}</a>` +
          (kids.length ? `<ul class="dropdown-menu">${kids.map(k => `<li class="dropdown-item"><a href="${esc(link(k.url))}" class="dropdown-link ${isActive(k.url) ? 'active' : ''}"${tgt(k)}>${esc(k.title)}${k.badge ? ` <span class="dropdown-tag">${esc(k.badge)}</span>` : ''}</a></li>`).join('')}</ul>` : '') + '</div>';
      }).join('');
    }
    const mlist = document.querySelector('.mobile-nav-list');
    if (mlist && mobile.length) {
      mlist.innerHTML = mobile.map(it => {
        const kids = it.children;
        if (!kids.length) return `<li><a href="${esc(link(it.url))}" class="mobile-nav-link ${isActive(it.url) ? 'active' : ''}"${tgt(it)}>${esc(it.title)}</a></li>`;
        return `<li class="mobile-nav-item-has-submenu"><span class="mobile-nav-link mobile-nav-accordion-header"><span>${esc(it.title)}</span><svg class="nav-chevron" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z"/></svg></span><ul class="mobile-submenu">${kids.map(k => `<li><a href="${esc(link(k.url))}" class="mobile-submenu-link ${isActive(k.url) ? 'active' : ''}"${tgt(k)}>${esc(k.title)}</a></li>`).join('')}</ul></li>`;
      }).join('');
    }
  }
  // Yeniden üretilen menü öğeleri için delegasyon (akordeon + linke tıklayınca çekmeceyi kapat)
  document.addEventListener('click', e => {
    const head = e.target.closest('.mobile-drawer .mobile-nav-accordion-header');
    if (head) { const li = head.closest('.mobile-nav-item-has-submenu'); if (li) li.classList.toggle('expanded'); return; }
    if (e.target.closest('.mobile-drawer a')) {
      document.querySelectorAll('.mobile-drawer, .mobile-backdrop, .mobile-toggle').forEach(n => n.classList.remove('active'));
      document.body.style.overflow = '';
    }
  });

  /* ------------------------------ ürün vitrini ------------------------------ */
  const FLIP_SVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 16V4m0 0L3 8m4-4l4 4m6 4v12m0 0l4-4m-4 4l-4-4"/></svg>';
  async function hydrateProducts() {
    const track = document.getElementById('product-gallery-slider');
    if (!track) return;
    const products = await load('products');
    if (!Array.isArray(products)) return;
    track.innerHTML = products.map((p, i) => {
      const front = pickMedia(p, 'cover_image_file', 'cover_image');
      const back = pickMedia(p, 'back_image_file', 'back_image');
      const hasBack = back && back !== front;
      return `<article class="product-card-enhanced product-slide-item" data-index="${i}">
        <div class="product-card-media">
          <span class="product-print-tag">${esc(tr(p.print_technique || ''))}</span>
          <img src="${esc(front || FALLBACK_IMG())}" alt="${esc(p.name)}" data-cms-img="1" data-front="${esc(front)}" data-back="${esc(hasBack ? back : front)}" data-view="front" draggable="false">
          ${hasBack ? `<div class="product-interactive-tools"><button type="button" class="btn-product-tool btn-product-flip" title="Ön / Arka Baskı Görünümü Değiştir" aria-label="Görünüm Değiştir">${FLIP_SVG}</button></div>` : ''}
          <div class="product-gold-shimmer"></div>
        </div>
        <div class="product-card-info">
          <span class="product-category-meta">${esc(tr([p.category, p.fabric_details].filter(Boolean).join(' // ')))}</span>
          <h3 class="product-item-title">${esc(p.name)}</h3>
          <div class="product-print-technique">${esc(p.pattern_type || '')}</div>
        </div>
      </article>`;
    }).join('');
    document.dispatchEvent(new CustomEvent('cms:products-rendered', { detail: { count: products.length } }));
  }

  /* ------------------------------ listeler ------------------------------ */
  const pad = n => String(n).padStart(2, '0');

  const RENDERERS = {
    async machines(box) {
      const list = (await load('machines')).filter(m => m.is_active !== false);
      box.innerHTML = list.map(m => {
        const specs = m.specs && typeof m.specs === 'object' ? Object.entries(m.specs) : [];
        return `<div class="machine-card"><div class="machine-media">
          <span class="machine-badge">${esc(tr(m.category || m.print_type || ''))}</span>${imgTag(pickMedia(m, 'image_file', 'image'), m.name)}</div>
          <div class="machine-info"><h3 class="machine-title">${esc(m.name)}</h3>
          <p style="font-size:.92rem;color:#555860;line-height:1.6">${esc(m.description || '')}</p>
          <table class="machine-specs-table">${m.capacity ? `<tr><td>Kapasite:</td><td>${esc(m.capacity)}</td></tr>` : ''}${specs.map(([k, v]) => `<tr><td>${esc(k)}:</td><td>${esc(v)}</td></tr>`).join('')}</table></div></div>`;
      }).join('');
    },
    async references(box) {
      const list = await load('references');
      box.innerHTML = list.map(r => {
        const logo = media(r.logo_file);
        return `<div class="reference-card">${logo ? imgTag(logo, r.company_name, 'style="max-height:44px;width:auto;margin-bottom:.75rem"') : ''}
          <span class="reference-category">${esc(r.industry || '')}</span><div class="reference-name">${esc(r.company_name)}</div>
          ${r.collaboration_type ? `<p style="font-size:.8rem;color:#777;margin-top:.35rem">${esc(r.collaboration_type)}</p>` : ''}</div>`;
      }).join('');
    },
    async processes(box) {
      const list = await load('production_processes');
      box.innerHTML = list.map((s, i) => `<div class="process-step-row"><div class="process-step-icon">${pad(s.step_number || i + 1)}</div>
        <div class="process-step-card"><div class="process-step-body"><span class="process-step-num">Aşama ${esc(s.step_number || i + 1)}</span>
        <h3 class="process-step-title">${esc(s.title)}</h3><p class="process-step-desc">${esc(s.short_desc || '')}</p>
        <div class="process-step-points">${s.detail_text ? `<div class="process-step-point">${esc(s.detail_text)}</div>` : ''}${s.duration_info ? `<div class="process-step-point">Süre: ${esc(s.duration_info)}</div>` : ''}</div></div>
        <div class="process-step-img">${imgTag(pickMedia(s, 'image_file', 'image'), s.title)}</div></div></div>`).join('');
    },
    async blog(box) {
      const list = await load('blog_posts');
      box.innerHTML = list.map(b => {
        const href = `/blog/${encodeURIComponent(b.slug)}/`;
        return `<article class="blog-card"><div class="blog-card-media">${imgTag(pickMedia(b, 'cover_image_file', 'cover_image'), b.title)}</div>
          <div class="blog-card-body"><div class="blog-meta"><span class="blog-category">${esc(b.category || '')}</span>${b.read_time ? `<span>•</span><span>${esc(b.read_time)}</span>` : ''}</div>
          <h3 class="blog-card-title"><a href="${href}">${esc(b.title)}</a></h3><p class="blog-card-excerpt">${esc(b.summary || '')}</p>
          <a href="${href}" class="blog-read-more"><span>Devamını Oku</span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg></a></div></article>`;
      }).join('');
    },
    async gallery(box) {
      const [products, machines] = await Promise.all([load('products'), load('machines')]);
      const cat = c => ({ 'Tişört': 'tisort', 'Sweatshirt': 'sweatshirt', 'Hoodie': 'sweatshirt', 'Kazak': 'sweatshirt', 'Pantolon': 'pantolon', 'Eşofman': 'pantolon', 'Şort': 'pantolon' }[c] || 'diger');
      const items = [
        ...products.map(p => ({ cat: cat(p.category), src: pickMedia(p, 'cover_image_file', 'cover_image'), tag: `${p.category || ''} // ${p.print_technique || ''}`, title: p.name })),
        ...machines.filter(m => m.is_active !== false).map(m => ({ cat: 'makine', src: pickMedia(m, 'image_file', 'image'), tag: `Makine Parkuru // ${m.category || ''}`, title: m.name }))
      ];
      box.innerHTML = items.map((it, i) => `<div class="gallery-item ${i % 4 === 0 ? 'span-2' : ''}" data-category="${it.cat}">${imgTag(it.src, it.title, 'loading="lazy"')}
        <div class="gallery-item-overlay"><span class="gallery-item-tag">${esc(it.tag)}</span><h4 class="gallery-item-title">${esc(it.title)}</h4></div></div>`).join('');
    },
    async certificates(box) {
      const list = await load('certificates');
      const tpl = box.firstElementChild ? box.firstElementChild.cloneNode(true) : null;
      if (!tpl) return;
      box.innerHTML = '';
      list.forEach(c => {
        const card = tpl.cloneNode(true);
        card.removeAttribute('data-reveal');
        const img = card.querySelector('img'); const badge = card.querySelector('.badge');
        const h3 = card.querySelector('h3'); const p = card.querySelector('p');
        const tail = card.lastElementChild;
        const src = pickMedia(c, 'image_file', 'image');
        if (img) { img.src = src || FALLBACK_IMG(); img.alt = c.title || ''; img.dataset.cmsImg = '1'; }
        if (badge) badge.textContent = c.certificate_no || c.organization || '';
        if (h3) h3.textContent = c.title || '';
        if (p) p.textContent = c.description || '';
        if (tail && tail !== p && tail !== h3 && tail.tagName === 'DIV') tail.textContent = [c.organization, c.validity && `Geçerlilik: ${c.validity}`].filter(Boolean).join(' · ');
        const doc = media(c.pdf_document);
        if (doc) { const a = document.createElement('a'); a.href = doc; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = 'Belgeyi görüntüle →'; a.style.cssText = 'font-size:.85rem;color:var(--c-gold)'; card.appendChild(a); }
        box.appendChild(card);
      });
    }
  };

  async function hydrateLists() {
    const boxes = Array.from(document.querySelectorAll('[data-cms-list]'));
    await Promise.all(boxes.map(box => guarded(`liste:${box.dataset.cmsList}`, async () => {
      const fn = RENDERERS[box.dataset.cmsList];
      if (fn) { await fn(box); box.dataset.cmsRendered = '1'; }
    })));
    waLinks();
  }

  /* Hizmetler sayfası: tasarlanmış blokları yerinde bağla; yayından kalkanı gizle; eksik hizmeti ekle */
  async function hydrateServices() {
    const container = document.getElementById('services-blocks-container');
    const blocks = Array.from(document.querySelectorAll('section[data-cms-service]'));
    if (!blocks.length && !container) return;
    const services = await load('services');
    if (!services || !services.length) return;

    // Directus sort sırasına göre sırala
    services.sort((a, b) => (a.sort ?? 999) - (b.sort ?? 999) || (a.id - b.id));

    const usedSlugs = new Set();
    const serviceMap = new Map();
    services.forEach(s => {
      serviceMap.set(s.slug, s);
      if (s.slug === 'serigrafi-baski') {
        serviceMap.set('emprime-baski', s);
        serviceMap.set('emprime-baskı', s);
        serviceMap.set('emprimebaskı', s);
      }
    });

    // 1. Mevcut DOM bloklarını güncelle
    blocks.forEach(block => {
      const aliases = (block.getAttribute('data-cms-service') || '').split(/\s+/);
      let matched = null;
      for (const a of aliases) {
        if (serviceMap.has(a)) {
          matched = serviceMap.get(a);
          break;
        }
      }

      if (!matched || matched.status !== 'published') {
        block.style.display = 'none';
        return;
      }

      block.style.display = '';
      usedSlugs.add(matched.slug);

      const set = (sel, val) => { const el = block.querySelector(sel); if (el && val !== undefined && val !== null) el.textContent = val; };
      set('.section-tag', matched.badge);
      set('.section-title', matched.title);
      set('.lead', matched.short_desc);

      const detail = block.querySelector('a.btn-anthracite');
      if (detail) {
        detail.setAttribute('href', `/hizmetlerimiz/${encodeURIComponent(matched.slug)}/`);
        const label = detail.querySelector('span:not(.btn-icon)');
        if (label && matched.title) label.textContent = `${matched.title} Detay Sayfası`;
      }

      if (Array.isArray(matched.features) && matched.features.length) {
        const holder = block.querySelector('[style*="flex-wrap"]');
        if (holder) {
          const cls = ['badge-gold', 'badge-anthracite', 'badge-cream'];
          holder.innerHTML = matched.features.slice(0, 4).map((f, i) => `<span class="badge ${cls[i % cls.length]}">${esc(f)}</span>`).join('');
        }
      }

      const liveDot = block.querySelector('.live-dot');
      if (liveDot && (matched.capacity_info || matched.title)) liveDot.textContent = matched.capacity_info || matched.title;

      const mediaUrl = pickMedia(matched, 'cover_image_file', 'cover_image');
      if (mediaUrl) {
        const img = block.querySelector('.product-visual-box img, .img-zoom-wrapper img');
        if (img) {
          img.src = mediaUrl;
          img.alt = matched.title || '';
        }
      }

      block.dataset.cmsSort = String(matched.sort ?? 999);
    });

    // 2. CMS'de olup DOM'da olmayan yeni hizmetleri ekle
    const unrendered = services.filter(s => !usedSlugs.has(s.slug) && s.status === 'published' && s.title);
    if (unrendered.length) {
      const parent = container || (blocks.length ? blocks[0].parentNode : null);
      if (parent) {
        unrendered.forEach(s => {
          const totalExisting = parent.querySelectorAll('section[data-cms-service]').length;
          const isOdd = totalExisting % 2 === 1;
          const sec = document.createElement('section');
          sec.setAttribute('data-cms-service', s.slug);
          sec.className = `section ${isOdd ? 'bg-cream-pure' : 'bg-cream'}`;
          sec.style.borderTop = '1px solid var(--c-stone-border)';
          sec.dataset.cmsSort = String(s.sort ?? 999);

          const mediaUrl = pickMedia(s, 'cover_image_file', 'cover_image') || '/assets/images/placeholder.svg';
          const badges = Array.isArray(s.features) && s.features.length
            ? s.features.slice(0, 3).map((f, i) => `<span class="badge ${['badge-gold', 'badge-anthracite', 'badge-cream'][i % 3]}">${esc(f)}</span>`).join('')
            : '';

          sec.innerHTML = `
            <div class="container">
              <div class="grid grid-2 items-center gap-6">
                <div data-reveal="fade-up" style="${isOdd ? 'order: 2;' : ''}">
                  <div class="section-tag">${esc(s.badge || 'Hizmet')}</div>
                  <h2 class="section-title">${esc(s.title)}</h2>
                  <div class="gold-line-solid"></div>
                  <p class="lead">${esc(s.short_desc || '')}</p>
                  <p>${esc(s.content ? s.content.slice(0, 260) + '...' : '')}</p>
                  <div style="display: flex; gap: 1rem; flex-wrap: wrap; margin: 2rem 0;">${badges}</div>
                  <div style="display: flex; gap: 1rem; align-items: center;">
                    <a href="/hizmetlerimiz/${encodeURIComponent(s.slug)}/" class="btn btn-anthracite">
                      <span>${esc(s.title)} Detay Sayfası</span>
                      <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </a>
                    <a href="/teklif-al/" class="btn btn-gold">Teklif Al</a>
                  </div>
                </div>
                <div data-reveal="${isOdd ? 'slide-right' : 'clip-left'}" data-delay="200" style="${isOdd ? 'order: 1;' : ''}">
                  <div style="position: relative; box-shadow: var(--shadow-card); border-radius: var(--radius-md); overflow: hidden; background: var(--c-anthracite); border: 1px solid var(--c-gold-border);">
                    <div style="padding: 1.25rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.08); display: flex; justify-content: space-between; align-items: center;">
                      <span class="live-dot" style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--c-gold); text-transform: uppercase;">${esc(s.capacity_info || s.title)}</span>
                      <span class="badge badge-gold" style="font-size: 0.7rem;">${esc(s.badge || 'Profesyonel')}</span>
                    </div>
                    <div class="product-card-enhanced" style="background: transparent; border: none; padding: 0;">
                      <div class="product-visual-box" style="height: 340px; background: radial-gradient(circle at center, #2e2825 0%, #1a1a1c 100%);">
                        <div class="print-reveal-container" style="width: 100%; height: 100%;">
                          <img src="${esc(mediaUrl)}" alt="${esc(s.title)}" style="width: 100%; height: 100%; object-fit: contain; padding: 1.5rem;">
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>`;

          if (container) container.appendChild(sec);
          else if (blocks.length) blocks[blocks.length - 1].after(sec);
        });
      }
    }

    // 3. Sıralamayı (sort) DOM'a uygula
    if (container) {
      const allSections = Array.from(container.querySelectorAll('section[data-cms-service]'));
      allSections.sort((a, b) => {
        const sa = Number(a.dataset.cmsSort || 999);
        const sb = Number(b.dataset.cmsSort || 999);
        return sa - sb;
      });
      allSections.forEach(s => container.appendChild(s));
    }
  }

  /* ------------------------------ detay sayfaları ------------------------------ */
  async function hydrateDetail() {
    let root = document.querySelector('[data-cms-detail]');
    let kind = root ? root.getAttribute('data-cms-detail') : null;
    let slug = root ? root.getAttribute('data-cms-slug') : null;

    // URL'den otomatik tespiti destekle (/hizmetlerimiz/:slug/ ve /blog/:slug/)
    if (!kind || !slug) {
      if (segments.length >= 2 && segments[0] === 'hizmetlerimiz') {
        kind = 'service';
        slug = segments[1];
        if (!root) root = document.querySelector('main') || document.body;
      } else if (segments.length >= 2 && segments[0] === 'blog') {
        kind = 'blog';
        slug = segments[1];
        if (!root) root = document.querySelector('main') || document.body;
      }
    }

    if (!kind || !slug || !root) return;

    const collection = kind === 'blog' ? 'blog_posts' : 'services';
    const items = await load(collection, { slug });
    const it = items && items[0];
    if (!it) {
      const c = root.querySelector('[data-cms-html="content"]');
      if (c) c.innerHTML = '<p>İçerik bulunamadı veya henüz yayımlanmadı.</p>';
      return;
    }

    // Başlık ve SEO etiketlerini güncelle
    if (it.title) {
      document.title = `${it.title} | Nizamlar Baskı`;
      setMeta('meta[property="og:title"]', 'content', `${it.title} | Nizamlar Baskı`);
    }
    const desc = it.seo_description || it.summary || it.short_desc;
    if (desc) {
      setMeta('meta[name="description"]', 'content', desc);
      setMeta('meta[property="og:description"]', 'content', desc);
    }

    // Doğrudan data-cms-field etiketli alanları güncelle
    root.querySelectorAll('[data-cms-field]').forEach(el => {
      const f = el.getAttribute('data-cms-field');
      let v = it[f];
      if (f === 'meta') {
        const d = it.published_date ? new Date(it.published_date).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
        v = [it.category, d, it.read_time, it.author].filter(Boolean).join(' • ');
      }
      if (v !== undefined && v !== null && v !== '') el.textContent = v;
    });

    // Başlık ve açıklamaları seçicilerle güncelle
    const heroTitle = root.querySelector('.page-hero-title, [data-cms-hero="title"]');
    if (heroTitle && it.title) heroTitle.textContent = it.title;

    const heroDesc = root.querySelector('.page-hero-desc, [data-cms-hero="subtitle"]');
    if (heroDesc && (it.short_desc || it.summary)) heroDesc.textContent = it.short_desc || it.summary;

    const sectionTitle = root.querySelector('.section-title');
    if (sectionTitle && it.title) sectionTitle.textContent = it.title;

    const badgeEl = root.querySelector('.section-tag');
    if (badgeEl && it.badge) badgeEl.textContent = it.badge;

    const leadEl = root.querySelector('.lead');
    if (leadEl && it.short_desc) leadEl.textContent = it.short_desc;

    const html = root.querySelector('[data-cms-html="content"]');
    if (html && it.content) html.innerHTML = sanitizeHtml(it.content);

    const src = pickMedia(it, 'cover_image_file', 'cover_image');
    if (src) {
      root.querySelectorAll('img[data-cms-image], .img-zoom-wrapper img, .article-content > img').forEach(img => {
        img.src = src;
        img.alt = it.title || '';
        img.dataset.cmsImg = '1';
        img.hidden = false;
      });
      setMeta('meta[property="og:image"]', 'content', src);
    }

    const ul = root.querySelector('[data-cms-list="features"]');
    if (ul && Array.isArray(it.features)) {
      ul.innerHTML = it.features.map(f => `<li>${esc(f)}</li>`).join('');
    }
  }

  /* ------------------------------ teklif formları ------------------------------ */
  function setupForms() {
    document.querySelectorAll('form[data-form-handler]').forEach(form => {
      const startedAt = Date.now();
      // Honeypot (insanlar görmez)
      const hp = document.createElement('input');
      hp.type = 'text'; hp.name = 'website'; hp.tabIndex = -1; hp.autocomplete = 'off'; hp.setAttribute('aria-hidden', 'true');
      hp.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;opacity:0';
      form.appendChild(hp);

      let errBox = form.querySelector('.cms-form-error');
      if (!errBox) {
        errBox = document.createElement('div');
        errBox.className = 'cms-form-error';
        errBox.setAttribute('role', 'alert');
        errBox.style.cssText = 'display:none;margin:1rem 0;padding:.85rem 1rem;border:1px solid #c53030;border-radius:6px;background:#fff5f5;color:#9b1c1c;font-size:.92rem';
        const submit = form.querySelector('button[type="submit"]');
        (submit ? submit.parentNode : form).insertBefore(errBox, submit || null);
      }
      const showError = msg => { errBox.textContent = msg; errBox.style.display = 'block'; errBox.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); };

      form.addEventListener('submit', async e => {
        e.preventDefault();
        errBox.style.display = 'none';
        // Doğrulama
        let ok = true;
        form.querySelectorAll('[required]').forEach(inp => {
          const bad = !String(inp.value || '').trim() || (inp.type === 'email' && !inp.checkValidity());
          inp.style.borderColor = bad ? '#c53030' : '';
          if (bad) ok = false;
        });
        if (!ok) return showError('Lütfen zorunlu alanları eksiksiz ve geçerli biçimde doldurun.');

        const fileInput = form.querySelector('input[type="file"]');
        const file = fileInput && fileInput.files && fileInput.files[0];
        if (file && file.size > 25 * 1024 * 1024) return showError('Dosya en fazla 25 MB olabilir.');

        const fd = new FormData(form);
        fd.set('_form_ts', String(startedAt));
        // Seçeneklerin okunabilir etiketlerini gönder (admin panelinde anlaşılır olsun)
        form.querySelectorAll('select[name]').forEach(sel => {
          const opt = sel.options[sel.selectedIndex];
          if (opt && opt.value) fd.set(sel.name, opt.textContent.trim());
        });
        if (file) fd.set('design_file', file, file.name); else fd.delete('design_file');

        const btn = form.querySelector('button[type="submit"]');
        const label = btn ? btn.innerHTML : '';
        if (btn) { btn.disabled = true; btn.textContent = 'Gönderiliyor...'; }
        try {
          const res = await fetch('/api/quote', { method: 'POST', body: fd });
          let json = null;
          try { json = await res.json(); } catch (_) { /* gövde yok */ }
          if (res.ok && json && json.success) {
            const modal = document.querySelector('.modal-feedback');
            if (modal) modal.classList.add('active');
            else alert('Teklif talebiniz alındı. Ekibimiz en kısa sürede sizinle iletişime geçecektir.');
            form.reset();
            const st = document.querySelector('#file-upload-status'); if (st) st.innerHTML = '';
          } else {
            const fieldMsg = json && json.fields ? ' ' + Object.values(json.fields).join(' ') : '';
            showError(((json && json.error) || `Talebiniz kaydedilemedi (HTTP ${res.status}).`) + fieldMsg);
          }
        } catch (err) {
          console.error('Form gönderim hatası:', err);
          showError('Bağlantı hatası: talebiniz KAYDEDİLMEDİ. Lütfen tekrar deneyin veya bizi telefonla arayın.');
        } finally {
          if (btn) { btn.disabled = false; btn.innerHTML = label; }
        }
      });
    });
  }

  /* ------------------------------ üretim sahnesi (mevcut davranış) ------------------------------ */
  async function hydrateProductionShowcase() {
    const container = document.querySelector('#dynamic-production-showcase-container');
    const tmpl = document.querySelector('#tmpl-production-showcase');
    if (!container || !tmpl) return;
    let show = Boolean(window.NIZAMLAR_CONFIG && window.NIZAMLAR_CONFIG.showProductionShowcase);
    try {
      const site = await load('site_settings');
      if (site && typeof site.show_production_showcase !== 'undefined') show = Boolean(site.show_production_showcase);
    } catch (e) { /* kapalı kalır */ }
    if (params.get('show_production_showcase') === 'true') show = true;
    container.innerHTML = '';
    if (!show) return;
    container.appendChild(tmpl.content.cloneNode(true));
    const video = container.querySelector('.video-showcase-element');
    const playBtn = container.querySelector('.btn-video-play');
    const muteBtn = container.querySelector('.btn-video-mute');
    const PLAY = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg><span>Oynat</span>';
    const PAUSE = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg><span>Durdur</span>';
    if (video && playBtn) playBtn.addEventListener('click', () => { if (video.paused) { video.play(); playBtn.innerHTML = PAUSE; } else { video.pause(); playBtn.innerHTML = PLAY; } });
    if (video && muteBtn) muteBtn.addEventListener('click', () => {
      video.muted = !video.muted;
      muteBtn.innerHTML = video.muted
        ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg><span>Sessiz</span>'
        : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg><span>Ses Açık</span>';
    });
  }

  /* ------------------------------ başlat ------------------------------ */
  async function init() {
    setupPreviewBanner();
    setupForms();
    await Promise.all([
      guarded('üretim sahnesi', hydrateProductionShowcase),
      guarded('site ayarları', hydrateSite),
      guarded('whatsapp', async () => { await hydrateWhatsApp(); }),
      guarded('sayfa içeriği', hydratePage),
      guarded('menü', hydrateNavigation),
      guarded('ürün vitrini', hydrateProducts),
      guarded('hizmetler', hydrateServices),
      guarded('detay', hydrateDetail),
      hydrateLists()
    ]);
    waLinks();
    applySiteToDrawer();
    document.documentElement.setAttribute('data-cms-status', failures.length ? 'partial' : 'ready');
    document.dispatchEvent(new CustomEvent('cms:ready', { detail: { failures } }));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

  window.NizamlarCMS = {
    version: '3.0.0',
    failures,
    refresh() { cache.clear(); return init(); }
  };
})();
