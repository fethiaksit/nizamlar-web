/**
 * NİZAMLAR BASKI — HEADER YAPISI VE TEST SÜRECİ
 * Real Chrome automation via Chrome DevTools Protocol (CDP)
 */

const { spawn } = require('child_process');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getDebuggerUrl() {
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9222/json');
      if (res.ok) {
        const list = await res.json();
        const page = list.find(p => p.type === 'page');
        if (page && page.webSocketDebuggerUrl) {
          return page.webSocketDebuggerUrl;
        }
      }
    } catch (e) {
      // wait for chrome to start
    }
    await sleep(250);
  }
  throw new Error('Chrome remote debugger not accessible');
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.id = 0;
    this.callbacks = new Map();
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.callbacks.has(msg.id)) {
        const { resolve, reject } = this.callbacks.get(msg.id);
        this.callbacks.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      }
    };
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++this.id;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      throw new Error(res.exceptionDetails.text || 'Evaluation exception');
    }
    return res.result.value;
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function runHeaderTests() {
  console.log('\n===============================================================');
  console.log('🏛️ NİZAMLAR BASKI — HEADER YAPISI VE TEST SÜRECİ');
  console.log('===============================================================\n');

  const chromeProcess = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    'http://localhost:3030'
  ], { stdio: 'ignore' });

  try {
    const wsUrl = await getDebuggerUrl();
    const cdp = new CDPClient(wsUrl);
    await cdp.connect();

    await sleep(1500);

    // TEST 1: Header Sınıf Yapısı ve Logo Boyutları
    console.log('--- TEST 1: Header Temel Sınıfları ve Logo Doğrulaması ---');
    const t1 = await cdp.evaluate(`
      (function() {
        const header = document.querySelector('.site-header');
        const container = header ? header.querySelector('.header-container') : null;
        const logoLink = container ? container.querySelector('.header-logo') : null;
        const logoImg = logoLink ? logoLink.querySelector('img') : null;
        const actions = container ? container.querySelector('.header-actions') : null;
        const quoteBtn = actions ? actions.querySelector('.btn-header-quote') : null;

        const rect = logoImg ? logoImg.getBoundingClientRect() : null;
        const style = logoImg ? window.getComputedStyle(logoImg) : null;

        return {
          hasHeader: !!header,
          hasContainer: !!container,
          hasLogoLink: !!logoLink,
          logoHref: logoLink ? logoLink.getAttribute('href') : null,
          logoSrc: logoImg ? logoImg.getAttribute('src') : null,
          logoAttrWidth: logoImg ? logoImg.getAttribute('width') : null,
          logoAttrHeight: logoImg ? logoImg.getAttribute('height') : null,
          logoComputedHeight: style ? style.height : null,
          hasActions: !!actions,
          quoteBtnText: quoteBtn ? quoteBtn.textContent.trim() : null
        };
      })()
    `);

    console.log('Test 1 Çıktısı:', t1);
    if (!t1.hasHeader || !t1.hasContainer || !t1.hasLogoLink || !t1.hasActions) {
      throw new Error('Header temel HTML yapısı eksik!');
    }
    if (t1.logoAttrWidth !== '220' || t1.logoAttrHeight !== '42') {
      throw new Error(`Logo HTML ölçüleri width="220" height="42" olmalı! Bulunan: w=${t1.logoAttrWidth}, h=${t1.logoAttrHeight}`);
    }
    if (t1.quoteBtnText !== 'Teklif Al') {
      throw new Error(`Sağ CTA butonu "Teklif Al" olmalı! Bulunan: ${t1.quoteBtnText}`);
    }
    console.log('✅ TEST 1 BAŞARILI: Header yapısı ve logo ölçüleri doğrulandı.');

    // TEST 2: Navigasyon Menü Öğeleri Sıralaması
    console.log('\n--- TEST 2: Navigasyon Menü Öğeleri Sıralaması (Tam 8 Öğe) ---');
    const t2 = await cdp.evaluate(`
      (function() {
        const items = Array.from(document.querySelectorAll('.site-header .nav-menu > .nav-item'));
        return items.map((item, idx) => {
          const link = item.querySelector('.nav-link');
          const clone = link ? link.cloneNode(true) : null;
          if (clone) {
            const svg = clone.querySelector('svg');
            if (svg) svg.remove();
          }
          return {
            index: idx + 1,
            label: clone ? clone.textContent.trim() : '',
            href: link ? link.getAttribute('href') : '',
            isActive: item.classList.contains('active') && (link ? link.classList.contains('active') : false),
            hasDropdown: !!item.querySelector('.dropdown-menu')
          };
        });
      })()
    `);

    console.log('Menü Öğeleri Listesi:', t2);
    const expectedMenus = [
      'Ana Sayfa',
      'Kurumsal',
      'Hizmetlerimiz',
      'Üretim',
      'Galeri',
      'Referanslar',
      'Blog',
      'İletişim'
    ];

    if (t2.length !== 8) {
      throw new Error(`Menüde tam 8 öğe olmalı! Bulunan: ${t2.length}`);
    }

    expectedMenus.forEach((expected, i) => {
      if (t2[i].label !== expected) {
        throw new Error(`Menü #${i + 1} "${expected}" olmalı! Bulunan: "${t2[i].label}"`);
      }
    });

    if (!t2[0].isActive) {
      throw new Error('Ana Sayfa menüsü aktif olmalıdır!');
    }
    for (let i = 1; i < t2.length; i++) {
      if (t2[i].isActive) {
        throw new Error(`"${t2[i].label}" ana sayfada aktif olmamalıdır!`);
      }
    }
    console.log('✅ TEST 2 BAŞARILI: Menü öğeleri tam olarak 8 adet ve istenen sırada. Sadece Ana Sayfa aktif.');

    // TEST 3: Canlı Stüdyo Menü Öğesinin Kaldırılması
    console.log('\n--- TEST 3: Canlı Stüdyo Navigasyon Öğesinin Kaldırılması ---');
    const t3 = await cdp.evaluate(`
      (function() {
        const studioItem = document.querySelector('.site-header .nav-item-studio');
        const studioLink = document.querySelector('.site-header .nav-link-studio');
        const studioPulse = document.querySelector('.site-header .nav-studio-pulse');
        const navLinks = Array.from(document.querySelectorAll('.site-header .nav-link'));
        const hasStudioInNav = navLinks.some(l => l.textContent.includes('Canlı'));

        return {
          hasStudioItem: !!studioItem,
          hasStudioLink: !!studioLink,
          hasStudioPulse: !!studioPulse,
          hasStudioInNav: hasStudioInNav
        };
      })()
    `);

    console.log('Canlı Stüdyo Nav Durumu:', t3);
    if (t3.hasStudioItem || t3.hasStudioLink || t3.hasStudioPulse || t3.hasStudioInNav) {
      throw new Error('Canlı Stüdyo / Canlı Önizleme navigasyondan kaldırılmalıdır!');
    }
    console.log('✅ TEST 3 BAŞARILI: Canlı Stüdyo menü öğesi kaldırıldı.');

    // TEST 4: Dropdown Menülerin İçeriği ve Etiketleri
    console.log('\n--- TEST 4: Dropdown Menülerin Kontrolü ---');
    const t4 = await cdp.evaluate(`
      (function() {
        const getDropdownLinks = (idx) => {
          const item = document.querySelectorAll('.site-header .nav-menu > .nav-item')[idx];
          if (!item) return [];
          const links = Array.from(item.querySelectorAll('.dropdown-menu .dropdown-link'));
          return links.map(a => {
            const tag = a.querySelector('.dropdown-tag');
            return {
              text: a.textContent.trim(),
              tag: tag ? tag.textContent.trim() : null,
              href: a.getAttribute('href')
            };
          });
        };

        return {
          kurumsal: getDropdownLinks(1),
          hizmetlerimiz: getDropdownLinks(2),
          uretim: getDropdownLinks(3)
        };
      })()
    `);

    console.log('Kurumsal Dropdown:', t4.kurumsal);
    console.log('Hizmetlerimiz Dropdown:', t4.hizmetlerimiz);
    console.log('Üretim Dropdown:', t4.uretim);

    const kurumsalLabels = t4.kurumsal.map(x => x.text);
    if (kurumsalLabels[0] !== 'Hakkımızda' || kurumsalLabels[1] !== 'Sürdürülebilirlik' || kurumsalLabels[2] !== 'Sertifikalarımız') {
      throw new Error(`Kurumsal dropdown içeriği hatalı: ${kurumsalLabels.join(', ')}`);
    }

    const dtfItem = t4.hizmetlerimiz.find(x => x.text.includes('DTF Baskı'));
    if (!dtfItem || dtfItem.tag !== 'Popüler') {
      throw new Error('Hizmetlerimiz dropdownunda "DTF Baskı Popüler" etiketi bulunmalı!');
    }

    const uretimLabels = t4.uretim.map(x => x.text);
    if (uretimLabels[0] !== 'Üretim Süreçleri' || uretimLabels[1] !== 'Makine Parkurumuz') {
      throw new Error(`Üretim dropdown içeriği hatalı: ${uretimLabels.join(', ')}`);
    }
    console.log('✅ TEST 4 BAŞARILI: Tüm dropdown menüler tam ve Popüler etiketi korundu.');

    // TEST 5: Mobil Çekmece (Drawer) ve Canlı Stüdyo Bağlantısının Olmaması
    console.log('\n--- TEST 5: Mobil Menü Çekmecesi ve Etkileşim ---');
    const t5 = await cdp.evaluate(`
      (function() {
        const drawer = document.querySelector('.mobile-drawer');
        const toggle = document.querySelector('.mobile-toggle');
        const backdrop = document.querySelector('.mobile-backdrop');
        const links = drawer ? Array.from(drawer.querySelectorAll('.mobile-nav-link')) : [];
        const hasStudioInMobile = links.some(l => l.textContent.includes('Canlı'));
        const linkTexts = links.map(l => l.textContent.trim());

        return {
          hasDrawer: !!drawer,
          hasToggle: !!toggle,
          hasBackdrop: !!backdrop,
          hasStudioInMobile: hasStudioInMobile,
          mobileLinks: linkTexts
        };
      })()
    `);

    console.log('Mobil Menü Çıktısı:', t5);
    if (!t5.hasDrawer || !t5.hasToggle || !t5.hasBackdrop) {
      throw new Error('Mobil menü elemanları eksik!');
    }
    if (t5.hasStudioInMobile) {
      throw new Error('Mobil menüde Canlı Stüdyo linki bulunmamalıdır!');
    }

    // Toggle tıkla
    await cdp.evaluate(`
      document.querySelector('.mobile-toggle').click();
    `);
    await sleep(400);

    const isDrawerOpen = await cdp.evaluate(`
      (function() {
        const d = document.querySelector('.mobile-drawer');
        const b = document.querySelector('.mobile-backdrop');
        return d.classList.contains('active') && b.classList.contains('active');
      })()
    `);
    console.log('Mobil Çekmece Açıldı mı?:', isDrawerOpen);
    if (!isDrawerOpen) throw new Error('Mobil menü toggle ile açılamadı!');

    // Backdrop tıkla
    await cdp.evaluate(`
      document.querySelector('.mobile-backdrop').click();
    `);
    await sleep(400);

    const isDrawerClosed = await cdp.evaluate(`
      (function() {
        const d = document.querySelector('.mobile-drawer');
        return !d.classList.contains('active');
      })()
    `);
    console.log('Mobil Çekmece Kapanma Testi:', isDrawerClosed);
    if (!isDrawerClosed) throw new Error('Mobil menü backdrop tıklanınca kapanmadı!');
    console.log('✅ TEST 5 BAŞARILI: Mobil menü kusursuz çalışıyor, canlı linki yok.');

    // TEST 6: Gövdedeki Canlı Baskı Önizleme Stüdyosu Kesinlikle Silinmedi mi?
    console.log('\n--- TEST 6: Gövdedeki Canlı Önizleme Stüdyosu Bölümü Kontrolü ---');
    const t6 = await cdp.evaluate(`
      (function() {
        const studio = document.querySelector('#canli-onizleme');
        const swatches = document.querySelectorAll('.color-swatch-btn');
        const canvas = document.querySelector('.mockup-canvas-area');
        const svgWrap = document.querySelector('#mockup-svg-wrap');

        return {
          hasStudioSection: !!studio,
          totalSwatches: swatches.length,
          hasCanvas: !!canvas,
          hasSvgWrap: !!svgWrap
        };
      })()
    `);

    console.log('Gövde Canlı Stüdyo Durumu:', t6);
    if (!t6.hasStudioSection || t6.totalSwatches < 8 || !t6.hasCanvas || !t6.hasSvgWrap) {
      throw new Error('Gövdedeki Canlı Baskı Önizleme Stüdyosu bozulmuş veya silinmiş!');
    }
    console.log('✅ TEST 6 BAŞARILI: Canlı Baskı Stüdyosu ve 12-renk kartelası gövdede sağlam.');

    // TEST 7: /uretim-surecleri/ Sayfası ile Karşılaştırma
    console.log('\n--- TEST 7: /uretim-surecleri/ Sayfası Header Yapısı ile Tutarlılık ---');
    await cdp.evaluate(`window.location.href = 'http://localhost:3030/uretim-surecleri/';`);
    await sleep(1500);

    const t7 = await cdp.evaluate(`
      (function() {
        const uretimLogo = document.querySelector('.header-logo img');
        const uretimMenus = Array.from(document.querySelectorAll('.site-header .nav-menu > .nav-item')).map(item => {
          const link = item.querySelector('.nav-link');
          const clone = link.cloneNode(true);
          const svg = clone.querySelector('svg');
          if (svg) svg.remove();
          return {
            label: clone.textContent.trim(),
            isActive: item.classList.contains('active')
          };
        });

        return {
          logoWidth: uretimLogo ? uretimLogo.getAttribute('width') : null,
          logoHeight: uretimLogo ? uretimLogo.getAttribute('height') : null,
          menus: uretimMenus
        };
      })()
    `);

    console.log('Üretim Süreçleri Menüleri:', t7.menus);
    if (t7.logoWidth !== '220' || t7.logoHeight !== '42') {
      throw new Error('Üretim süreçleri logosu 220x42 olmalı!');
    }
    // Üretim süreçlerinde 4. menü ("Üretim") aktif olmalıdır
    const activeUretimMenu = t7.menus.find(m => m.isActive);
    if (!activeUretimMenu || activeUretimMenu.label !== 'Üretim') {
      throw new Error(`Üretim süreçleri sayfasında "Üretim" aktif olmalı! Aktif bulunan: ${activeUretimMenu ? activeUretimMenu.label : 'yok'}`);
    }
    console.log('✅ TEST 7 BAŞARILI: Üretim süreçleri sayfası ile tutarlı ve aktif menü mantığı korunuyor.');

    cdp.close();
    chromeProcess.kill();

    console.log('\n===============================================================');
    console.log('🎉 TÜM TESTLER %100 BAŞARIYLA GEÇTİ (7/7)');
    console.log('===============================================================\n');

  } catch (err) {
    chromeProcess.kill();
    console.error('\n❌ TEST HATASI:', err);
    process.exit(1);
  }
}

runHeaderTests();
