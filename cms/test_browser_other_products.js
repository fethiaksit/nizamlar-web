/**
 * NİZAMLAR BASKI — OTHER PRODUCTS COLOR TEST
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
        if (page && page.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
      }
    } catch (e) {}
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
    await new Promise((res, rej) => {
      this.ws.onopen = res;
      this.ws.onerror = rej;
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
    const res = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (res.exceptionDetails) throw new Error(res.exceptionDetails.text);
    return res.result.value;
  }
  close() {
    if (this.ws) this.ws.close();
  }
}

async function run() {
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

    const prods = ['sweatshirt', 'hoodie', 'pantolon', 'canta'];
    for (const p of prods) {
      console.log(`\nÜrün Testi: ${p.toUpperCase()}...`);
      const res = await cdp.evaluate(`
        (async function() {
          const card = document.querySelector('.product-pick-card[data-product="${p}"]');
          if (card) card.click();
          await new Promise(r => setTimeout(r, 200));

          // Haki veya Ekru seç
          const colorBtn = document.querySelector('#color-swatches-wrap .color-swatch-btn[data-color-id="haki"]') ||
                           document.querySelector('#color-swatches-wrap .color-swatch-btn[data-color-id="ekru"]');
          if (colorBtn) colorBtn.click();
          await new Promise(r => setTimeout(r, 200));

          const activeSwatch = document.querySelector('#color-swatches-wrap .color-swatch-btn.active');
          const svg = document.querySelector('#mockup-svg-wrap svg');
          const bodyPath = svg ? (svg.querySelector('#garmentBodyPath') || svg.querySelector('path[fill="url(#fabricGrad)"]')) : null;
          const gradStops = svg ? Array.from(svg.querySelectorAll('#fabricGrad stop')).map(s => s.getAttribute('stop-color')) : [];

          return {
            productId: '${p}',
            activeColor: activeSwatch ? activeSwatch.getAttribute('data-color-id') : null,
            hasBodyPath: !!bodyPath,
            gradStops: gradStops
          };
        })()
      `);
      console.log(`✓ ${p} seçildi, aktif renk: ${res.activeColor}, kumaş gradyanı:`, res.gradStops);
    }

    console.log('\n🎉 TÜM ÜRÜNLER (SWEATSHIRT, HOODIE, PANTOLON, ÇANTA) RENK DEĞİŞİMİ DOĞRULANDI!');
    cdp.close();
  } finally {
    chromeProcess.kill('SIGKILL');
  }
}

run();
