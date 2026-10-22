const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUTPUT_DIR = path.join(__dirname, 'screenshots_after');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const VIEWPORTS = [
  { name: '1920x1080', width: 1920, height: 1080 },
  { name: '1440x900',  width: 1440, height: 900 },
  { name: '1366x768',  width: 1366, height: 768 },
  { name: '768x1024',  width: 768,  height: 1024 },
  { name: '390x844',   width: 390,  height: 844, isMobile: true }
];

async function runStudioTests() {
  console.log('\n======================================================');
  console.log('🧪 NİZAMLAR BASKI — KOMPAKT TAM EKRAN STÜDYO E2E TESTİ');
  console.log('======================================================\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  let allPassed = true;

  for (const vp of VIEWPORTS) {
    console.log(`\n--- Test Viewport: ${vp.name} (${vp.width}x${vp.height}) ---`);
    const page = await browser.newPage();
    await page.setViewport({
      width: vp.width,
      height: vp.height,
      isMobile: !!vp.isMobile
    });

    await page.goto('http://localhost:3030/#canli-onizleme', { waitUntil: 'networkidle0' });

    // Scroll directly to #canli-onizleme
    await page.evaluate(() => {
      const el = document.getElementById('canli-onizleme');
      if (el) {
        el.scrollIntoView({ behavior: 'instant', block: 'start' });
      }
    });

    await new Promise(r => setTimeout(r, 600));

    // Evaluate layout measurements
    const metrics = await page.evaluate(() => {
      const section = document.getElementById('canli-onizleme');
      const grid = document.querySelector('.studio-grid');
      const controls = document.querySelector('.studio-controls-panel');
      const viewportPanel = document.querySelector('.studio-viewport-panel');
      const stageFrame = document.getElementById('mockup-stage-frame');
      const quoteBtn = document.getElementById('btn-studio-quote');
      const dropzone = document.getElementById('studio-dropzone');
      const productGrid = document.querySelector('.product-selector-grid');
      const productCards = document.querySelectorAll('.product-pick-card');
      const sampleButtons = document.querySelectorAll('.btn-sample-pick');

      const secRect = section.getBoundingClientRect();
      const frameRect = stageFrame.getBoundingClientRect();
      const quoteRect = quoteBtn.getBoundingClientRect();
      const controlsRect = controls.getBoundingClientRect();
      const dropRect = dropzone.getBoundingClientRect();

      // Check product cards columns / rows
      const cardTops = Array.from(productCards).map(c => Math.round(c.getBoundingClientRect().top));
      const allCardsSameRow = cardTops.every(t => Math.abs(t - cardTops[0]) < 5);

      return {
        sectionHeight: secRect.height,
        frameHeight: frameRect.height,
        frameWidth: frameRect.width,
        frameAspectRatio: (frameRect.width / frameRect.height).toFixed(3),
        quoteBottom: quoteRect.bottom,
        controlsHeight: controlsRect.height,
        controlsScrollable: controls.scrollHeight > controls.clientHeight,
        dropzoneHeight: dropRect.height,
        productCardsCount: productCards.length,
        allProductsOneRow: allCardsSameRow,
        sampleCount: sampleButtons.length,
        hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth
      };
    });

    console.log(`  Section Height: ${Math.round(metrics.sectionHeight)}px`);
    console.log(`  Stage Frame: ${Math.round(metrics.frameWidth)}x${Math.round(metrics.frameHeight)} (aspect: ${metrics.frameAspectRatio})`);
    console.log(`  Dropzone Height: ${Math.round(metrics.dropzoneHeight)}px`);
    console.log(`  5 Product Cards on 1 row: ${metrics.allProductsOneRow ? 'YES ✅' : 'NO ❌'}`);
    console.log(`  Horizontal Overflow: ${metrics.hasHorizontalOverflow ? 'FAIL ❌' : 'NONE ✅'}`);

    // Check desktop requirements:
    if (vp.width >= 1024) {
      if (metrics.dropzoneHeight > 60) {
        console.error(`  ❌ Dropzone is too tall (${metrics.dropzoneHeight}px > 60px)`);
        allPassed = false;
      } else {
        console.log(`  ✅ Dropzone is compact (${Math.round(metrics.dropzoneHeight)}px)`);
      }

      if (!metrics.allProductsOneRow) {
        console.error('  ❌ 5 Products are not in a single row!');
        allPassed = false;
      }

      // Check if quote button is visible on screen
      if (metrics.quoteBottom > vp.height + 60) {
        console.error(`  ⚠️ Quote button is far below fold: bottom at ${Math.round(metrics.quoteBottom)}px (viewport: ${vp.height}px)`);
      } else {
        console.log(`  ✅ Quote button is visible within single screen (bottom: ${Math.round(metrics.quoteBottom)}px <= ${vp.height + 60}px)`);
      }
    }

    // Capture screenshots
    const viewportPath = path.join(OUTPUT_DIR, `studio-${vp.name}-viewport.png`);
    await page.screenshot({ path: viewportPath });
    console.log(`  📸 Saved viewport screenshot: ${viewportPath}`);

    const sectionEl = await page.$('#canli-onizleme');
    if (sectionEl) {
      const sectionPath = path.join(OUTPUT_DIR, `studio-${vp.name}-fullsection.png`);
      await sectionEl.screenshot({ path: sectionPath });
      console.log(`  📸 Saved section screenshot: ${sectionPath}`);
    }

    await page.close();
  }

  // Interactive Drag & Corner Resize Verification
  console.log('\n--- Test: Doğrudan Ürün Üzerinde Taşıma ve 4 Köşe Boyutlandırma ---');
  const interactPage = await browser.newPage();
  await interactPage.setViewport({ width: 1440, height: 900 });
  await interactPage.goto('http://localhost:3030/#canli-onizleme', { waitUntil: 'networkidle0' });

  // Open sample designs drawer if collapsible
  const toggleBtn = await interactPage.$('#btn-toggle-samples');
  if (toggleBtn) {
    await toggleBtn.click();
    await new Promise(r => setTimeout(r, 300));
  }

  // Select first sample design
  await interactPage.click('.btn-sample-pick');
  await new Promise(r => setTimeout(r, 400));

  const initialTransform = await interactPage.evaluate(() => {
    const layer = document.getElementById('user-artwork-layer');
    return {
      left: layer.style.left,
      top: layer.style.top,
      width: layer.style.width,
      display: layer.style.display
    };
  });
  console.log('  Initial artwork state:', initialTransform);

  // Drag artwork
  const layerHandle = await interactPage.$('#user-artwork-layer');
  const box = await layerHandle.boundingBox();
  await interactPage.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await interactPage.mouse.down();
  await interactPage.mouse.move(box.x + box.width / 2 + 50, box.y + box.height / 2 + 40);
  await interactPage.mouse.up();
  await new Promise(r => setTimeout(r, 300));

  const draggedTransform = await interactPage.evaluate(() => {
    const layer = document.getElementById('user-artwork-layer');
    return {
      left: layer.style.left,
      top: layer.style.top,
      width: layer.style.width
    };
  });
  console.log('  Dragged artwork state:', draggedTransform);

  if (draggedTransform.left !== initialTransform.left || draggedTransform.top !== initialTransform.top) {
    console.log('  ✅ Doğrudan fare ile sürükleme BAŞARILI!');
  } else {
    console.error('  ❌ Sürükleme gerçekleşmedi!');
    allPassed = false;
  }

  // Resize using SE corner handle
  const seHandle = await interactPage.$('.artwork-corner-handle.corner-se');
  const seBox = await seHandle.boundingBox();
  await interactPage.mouse.move(seBox.x + seBox.width / 2, seBox.y + seBox.height / 2);
  await interactPage.mouse.down();
  await interactPage.mouse.move(seBox.x + seBox.width / 2 + 40, seBox.y + seBox.height / 2 + 40);
  await interactPage.mouse.up();
  await new Promise(r => setTimeout(r, 300));

  const resizedTransform = await interactPage.evaluate(() => {
    const layer = document.getElementById('user-artwork-layer');
    return {
      width: layer.style.width
    };
  });
  console.log('  Resized artwork width:', resizedTransform.width);

  if (resizedTransform.width !== initialTransform.width) {
    console.log('  ✅ 4 Köşeden boyutlandırma tutamacı BAŞARILI!');
  } else {
    console.error('  ❌ Boyutlandırma gerçekleşmedi!');
    allPassed = false;
  }

  // Test Product switching (Tişört -> Hoodie -> Çanta)
  console.log('\n--- Test: Ürün Değişimi & Kumaş Rengi ---');
  await interactPage.click('.product-pick-card[data-product="hoodie"]');
  await new Promise(r => setTimeout(r, 400));
  const hoodieName = await interactPage.$eval('#stage-badge-product', el => el.textContent.trim());
  console.log(`  Switched to: ${hoodieName}`);

  // Test Color switching
  const swatches = await interactPage.$$('.color-swatch-btn');
  if (swatches.length > 2) {
    await swatches[2].click();
    await new Promise(r => setTimeout(r, 300));
    const activeColor = await interactPage.$eval('#selected-color-name', el => el.textContent.trim());
    console.log(`  Active color: ${activeColor}`);
  }

  // Capture interaction screenshot
  const interactPath = path.join(OUTPUT_DIR, 'studio-interaction-verified.png');
  await interactPage.screenshot({ path: interactPath });
  console.log(`  📸 Saved interaction screenshot: ${interactPath}`);

  await interactPage.close();
  await browser.close();

  console.log('\n======================================================');
  if (allPassed) {
    console.log('🎉 TÜM KOMPAKT STÜDYO E2E TESTLERİ %100 BAŞARIYLA GEÇTİ!');
  } else {
    console.log('⚠️ BAZI TESTLERDE UYARI/HATA ALINDI!');
  }
  console.log('======================================================\n');
}

runStudioTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
