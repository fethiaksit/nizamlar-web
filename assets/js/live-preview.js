/**
 * NİZAMLAR BASKI — GELİŞMİŞ CANLI BASKI ÖNİZLEME STÜDYOSU
 * - Doğrudan ürün üzerinde fare/dokunmatik serbest sürükleme
 * - 4 Köşe etkileşimli boyutlandırma tutamaçları (maintain aspect ratio)
 * - Manyetik akıllı hizalama (Snap-to-center / Snap guides)
 * - Geri Al (Undo) ve Yeniden Yap (Redo) geçmişi
 * - Tek tuşla ortalama ve güvenli sıfırlama (dosyayı silmez)
 * - Sadeleştirilmiş ana kontroller ve akordeon gelişmiş ayarlar
 * - Güvenli SVG işleme (DOMParser, script stripping) ve dosya kontrolleri
 * - İki parmakla mobil pinch-to-zoom (sayfa scrollunu bozmadan izole)
 * - Yüksek çözünürlüklü Retina Mockup PNG dışa aktarma (CORS safe)
 */

(function () {
  'use strict';

  const CFG = window.NIZAMLAR_MOCKUP_CONFIG;
  if (!CFG) {
    console.error('Nizamlar Mockup Config yüklenemedi.');
    return;
  }

  // Durum Yönetimi (State)
  const state = {
    productId: 'tisort',
    view: 'front',
    colorId: 'siyah',
    positionId: 'buyuk_on',
    image: null,
    imageDataUrl: null,
    imageFileName: null,
    imageFileSize: null,
    activeSampleId: null,
    naturalWidth: 1,
    naturalHeight: 1,
    transform: {
      x: 300,
      y: 330,
      scale: 0.95,
      rotation: 0
    },
    blendMode: 'normal',
    showGuide: true,
    isDragging: false,
    isResizing: false,
    resizeCorner: null,
    dragStart: { pointerX: 0, pointerY: 0, initialX: 0, initialY: 0, initialScale: 1 }
  };

  // Geri Al / Yeniden Yap Yığını (History Stack)
  const history = {
    undoStack: [],
    redoStack: [],
    maxDepth: 30,
    push(transform) {
      this.undoStack.push({ ...transform });
      if (this.undoStack.length > this.maxDepth) {
        this.undoStack.shift();
      }
      this.redoStack = [];
      updateHistoryButtons();
    },
    undo() {
      if (this.undoStack.length === 0) return null;
      this.redoStack.push({ ...state.transform });
      const prev = this.undoStack.pop();
      updateHistoryButtons();
      return prev;
    },
    redo() {
      if (this.redoStack.length === 0) return null;
      this.undoStack.push({ ...state.transform });
      const next = this.redoStack.pop();
      updateHistoryButtons();
      return next;
    }
  };

  let dom = {};

  function cacheDom() {
    dom = {
      section: document.querySelector('#canli-onizleme'),
      sectionTag: document.querySelector('#studio-section-tag'),
      sectionTitle: document.querySelector('#studio-section-title'),
      sectionDesc: document.querySelector('#studio-section-desc'),

      // Dosya Yükleme
      dropzone: document.querySelector('#studio-dropzone'),
      fileInput: document.querySelector('#studio-file-input'),
      activeFileBar: document.querySelector('#active-file-bar'),
      activeFileThumb: document.querySelector('#active-file-thumb'),
      activeFileName: document.querySelector('#active-file-name'),
      activeFileSize: document.querySelector('#active-file-size'),
      btnRemoveFile: document.querySelector('#btn-remove-file'),
      btnToggleSamples: document.querySelector('#btn-toggle-samples'),
      sampleDesignsWrap: document.querySelector('#sample-designs-wrap'),
      sampleButtonsRow: document.querySelector('#sample-buttons-row'),

      // Ürün & Seçenekler
      productCards: document.querySelectorAll('.product-pick-card'),
      viewToggleWrap: document.querySelector('#view-toggle-wrap'),
      btnViewToggles: document.querySelectorAll('.btn-view-toggle'),
      colorSwatchesWrap: document.querySelector('#color-swatches-wrap'),
      selectedColorName: document.querySelector('#selected-color-name'),
      placementPillsRow: document.querySelector('#placement-pills-row'),

      // Hızlı Kontroller
      quickScaleSlider: document.querySelector('#studio-quick-scale'),
      btnCenterArtwork: document.querySelector('#btn-center-artwork'),
      btnUndo: document.querySelector('#btn-undo-transform'),
      btnRedo: document.querySelector('#btn-redo-transform'),
      btnReset: document.querySelector('#btn-reset-adjustments'),
      advancedToggle: document.querySelector('#toggle-advanced-adjustments'),
      advancedPanel: document.querySelector('#advanced-adjustments-panel'),

      // İleri Düzey Sürgüler
      sliderScale: document.querySelector('#slider-scale'),
      valScale: document.querySelector('#val-scale'),
      sliderRotate: document.querySelector('#slider-rotate'),
      valRotate: document.querySelector('#val-rotate'),
      sliderX: document.querySelector('#slider-x'),
      valX: document.querySelector('#val-x'),
      sliderY: document.querySelector('#slider-y'),
      valY: document.querySelector('#val-y'),
      btnBlendNormal: document.querySelector('#btn-blend-normal'),
      btnBlendMultiply: document.querySelector('#btn-blend-multiply'),

      // Viewport / Sahne
      stageFrame: document.querySelector('#mockup-stage-frame'),
      mockupCanvasArea: document.querySelector('#mockup-canvas-area') || document.querySelector('.mockup-canvas-area'),
      mockupSvgWrap: document.querySelector('#mockup-svg-wrap'),
      mockupBaseImg: document.querySelector('#mockup-base-img'),
      printableGuide: document.querySelector('#printable-guide-box'),
      guideTag: document.querySelector('#printable-guide-tag'),
      snapGuideX: document.querySelector('#snap-guide-x'),
      snapGuideY: document.querySelector('#snap-guide-y'),
      artworkLayer: document.querySelector('#user-artwork-layer'),
      artworkImg: document.querySelector('#user-artwork-img'),
      emptyPrompt: document.querySelector('#stage-empty-prompt'),
      badgeProductName: document.querySelector('#stage-badge-product'),
      badgeSpec: document.querySelector('#stage-badge-spec'),
      badgeView: document.querySelector('#stage-badge-view'),
      btnToggleGuide: document.querySelector('#btn-toggle-guide'),
      btnStageReset: document.querySelector('#btn-stage-reset'),

      // Aksiyonlar
      btnQuote: document.querySelector('#btn-studio-quote'),
      btnDownload: document.querySelector('#btn-studio-download'),
      btnShare: document.querySelector('#btn-studio-share'),
      toast: document.querySelector('#studio-toast'),
      toastMsg: document.querySelector('#studio-toast-msg')
    };
  }

  function showToast(message, duration = 3000) {
    if (!dom.toast) return;
    dom.toastMsg.textContent = message;
    dom.toast.classList.add('show');
    clearTimeout(dom.toast._timer);
    dom.toast._timer = setTimeout(() => {
      dom.toast.classList.remove('show');
    }, duration);
  }

  function updateHistoryButtons() {
    if (dom.btnUndo) {
      dom.btnUndo.disabled = history.undoStack.length === 0;
      dom.btnUndo.style.opacity = history.undoStack.length === 0 ? '0.45' : '1';
    }
    if (dom.btnRedo) {
      dom.btnRedo.disabled = history.redoStack.length === 0;
      dom.btnRedo.style.opacity = history.redoStack.length === 0 ? '0.45' : '1';
    }
  }

  // Aktif Ürün ve Görünüm Yapılandırmasını Al
  function getCurrentProductConfig() {
    return CFG.products[state.productId] || CFG.products.tisort;
  }

  function getCurrentViewConfig() {
    const prod = getCurrentProductConfig();
    return prod.views[state.view] || prod.views[prod.defaultView || 'front'];
  }

  // Güvenli Baskı Alanı Sınırlarını Hesapla (Normalised Canvas Koordinatları: 600x680)
  function getPrintableBounds() {
    const view = getCurrentViewConfig();
    if (view && view.printableArea) {
      const p = view.printableArea;
      return {
        minX: p.x,
        maxX: p.x + p.width,
        minY: p.y,
        maxY: p.y + p.height,
        centerX: p.x + p.width / 2,
        centerY: p.y + p.height / 2,
        width: p.width,
        height: p.height
      };
    }
    return {
      minX: 180,
      maxX: 420,
      minY: 140,
      maxY: 540,
      centerX: 300,
      centerY: 340,
      width: 240,
      height: 400
    };
  }

  // ==========================================
  // PROFESYONEL TEKSTİL KUMAŞ VE RENK MOTORU
  // ==========================================

  function hexToRgb(hex) {
    let c = (hex || '#202020').replace('#', '').trim();
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    const num = parseInt(c, 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255
    };
  }

  function rgbToHex(r, g, b) {
    const clamp = v => Math.max(0, Math.min(255, Math.round(v)));
    return '#' + [clamp(r), clamp(g), clamp(b)].map(x => x.toString(16).padStart(2, '0')).join('');
  }

  function isColorLight(hex) {
    const { r, g, b } = hexToRgb(hex);
    return (0.299 * r + 0.587 * g + 0.114 * b) > 140;
  }

  // Kumaşın 3 Boyutlu Doğal Drapaj Işık ve Gölge Tonlarını Hesapla
  function generateFabricShades(baseHex) {
    const { r, g, b } = hexToRgb(baseHex);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b);
    const isLight = luminance > 140;

    // Stüdyo tepe/yan ana ışık (Key light) - kumaşın aydınlık tepesi
    const lightFactor = isLight ? 0.18 : 0.28;
    const lightHex = rgbToHex(
      r + (255 - r) * lightFactor,
      g + (255 - g) * lightFactor,
      b + (255 - b) * lightFactor
    );

    // Kumaş kıvrım ve kenar derinlik gölgesi
    const darkFactor = isLight ? 0.82 : 0.68;
    const darkHex = rgbToHex(r * darkFactor, g * darkFactor, b * darkFactor);

    // Triko/ribana yaka, manşet ve bel lastiği doku tonu
    const ribFactor = isLight ? 0.88 : 0.78;
    const ribHex = rgbToHex(r * ribFactor, g * ribFactor, b * ribFactor);

    // Dikiş, kıvrım ve gölge katmanı transparanlıkları (Katman 1 koruma)
    const creaseStroke = isLight ? 'rgba(0, 0, 0, 0.13)' : 'rgba(255, 255, 255, 0.08)';
    const stitchStroke = isLight ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.06)';
    const highlightStroke = isLight ? 'rgba(255, 255, 255, 0.40)' : 'rgba(255, 255, 255, 0.08)';
    const shadowOpacity = isLight ? 0.14 : (luminance < 40 ? 0.32 : 0.24);

    return {
      baseHex,
      lightHex,
      darkHex,
      ribHex,
      isLight,
      creaseStroke,
      stitchStroke,
      highlightStroke,
      shadowOpacity
    };
  }

  // Ürün ve Renk Değerine Göre Canlı Vektör Mockup SVG'si Üret (Katman 1: Doku/Gölge, Katman 2: Kumaş Rengi)
  function generateProductSvg(productId, view, colorHex, specText) {
    const shades = generateFabricShades(colorHex || '#202020');
    const spec = specText || '240 GSM PENYE';

    const defsContent = `
      <defs>
        <!-- Kumaş Penye Örgü Filtresi -->
        <filter id="fabricTexture" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="4" result="noise" />
          <feColorMatrix type="matrix" values="0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0 0 0 0.12 0" in="noise" result="coloredNoise" />
          <feComposite operator="in" in2="SourceGraphic" result="textured" />
          <feBlend mode="multiply" in="textured" in2="SourceGraphic" />
        </filter>
        <!-- Ağır Şardonlu Fleece Filtresi -->
        <filter id="fleeceTexture" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="3" result="fleeceNoise" />
          <feColorMatrix type="matrix" values="0.2 0.2 0.2 0 0  0.2 0.2 0.2 0 0  0.2 0.2 0.2 0 0  0 0 0 0.18 0" in="fleeceNoise" result="fleeceOverlay" />
          <feComposite operator="in" in2="SourceGraphic" />
          <feBlend mode="overlay" in2="SourceGraphic" />
        </filter>
        <!-- Dinamik Kumaş Işık/Gölge Gradyanı (Katman 2) -->
        <linearGradient id="fabricGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${shades.lightHex}" />
          <stop offset="42%" stop-color="${shades.baseHex}" />
          <stop offset="100%" stop-color="${shades.darkHex}" />
        </linearGradient>
        <!-- Stüdyo Ortam Işığı -->
        <radialGradient id="studioLight" cx="50%" cy="40%" r="58%">
          <stop offset="0%" stop-color="#3d4046" stop-opacity="0.85" />
          <stop offset="50%" stop-color="#282a2e" stop-opacity="0.92" />
          <stop offset="100%" stop-color="#161719" stop-opacity="1" />
        </radialGradient>
      </defs>
      <!-- Stüdyo Zemin Tonu -->
      <rect width="600" height="680" fill="#18191b" rx="16" />
      <rect width="600" height="680" fill="url(#studioLight)" rx="16" />
    `;

    const badgeSvg = `
      <g transform="translate(30, 30)">
        <rect width="140" height="26" rx="4" fill="rgba(22,23,24,0.85)" stroke="rgba(178,148,96,0.3)" stroke-width="1" />
        <circle cx="14" cy="13" r="3.5" fill="#b29460" />
        <text x="26" y="17" font-family="'JetBrains Mono', monospace" font-size="8.5" fill="#f3efe7" font-weight="600" letter-spacing="0.5">${spec.toUpperCase()}</text>
      </g>
    `;

    let bodyContent = '';

    if (productId === 'tisort') {
      const isBack = view === 'back';
      const collarSvg = isBack ? `
        <!-- Sırt Yaka Triko & Etiket -->
        <path id="collarRibBack" d="M 235 90 Q 300 115 365 90 Q 300 95 235 90 Z" fill="${shades.ribHex}" />
        <text x="300" y="112" font-family="'JetBrains Mono', monospace" font-size="7" fill="#b29460" font-weight="600" text-anchor="middle" letter-spacing="1">NİZAMLAR LAB / 100% COTTON</text>
      ` : `
        <!-- Ön Yaka Ribana Kavisleri -->
        <path id="collarRib" d="M 235 90 Q 300 145 365 90 Q 300 135 235 90 Z" fill="${shades.ribHex}" />
        <path d="M 238 93 Q 300 142 362 93" fill="none" stroke="#b29460" stroke-width="0.8" opacity="0.35" stroke-dasharray="2,2" />
      `;

      bodyContent = `
        <!-- Zemin Gölgesi -->
        <ellipse cx="300" cy="635" rx="210" ry="24" fill="#090a0b" opacity="0.65" filter="blur(8px)" />
        <g id="tshirtBody">
          <!-- Katman 2: Kumaş Rengi ve Dokusu Gövde Silüeti -->
          <path id="garmentBodyPath" d="M 235 90 L 105 175 L 140 260 L 195 225 L 190 235 L 190 590 L 410 590 L 410 235 L 405 225 L 460 260 L 495 175 L 365 90 Z" 
                fill="url(#fabricGrad)" filter="url(#fabricTexture)" />
          <!-- Katman 1: Kıvrımlar, Gölgeler ve Doğal Drapaj Folds -->
          <path d="M 190 230 C 185 300 195 480 188 590" fill="none" stroke="${shades.creaseStroke}" stroke-width="2" />
          <path d="M 410 230 C 415 300 405 480 412 590" fill="none" stroke="${shades.creaseStroke}" stroke-width="2" />
          <path d="M 215 150 Q 230 350 220 585" fill="none" stroke="rgba(0,0,0,${shades.shadowOpacity})" stroke-width="12" filter="blur(6px)" />
          <path d="M 385 150 Q 370 350 380 585" fill="none" stroke="rgba(0,0,0,${shades.shadowOpacity})" stroke-width="12" filter="blur(6px)" />
          <path d="M 250 200 Q 300 240 350 200" fill="none" stroke="${shades.highlightStroke}" stroke-width="18" filter="blur(10px)" />
          <!-- Kol Manşetleri ve Reçme Çift Dikiş Detayları -->
          <path d="M 105 175 L 140 260" fill="none" stroke="${shades.stitchStroke}" stroke-width="1" />
          <path d="M 109 178 L 142 257" fill="none" stroke="${shades.stitchStroke}" stroke-width="0.8" stroke-dasharray="3,2" />
          <path d="M 495 175 L 460 260" fill="none" stroke="${shades.stitchStroke}" stroke-width="1" />
          <path d="M 491 178 L 458 257" fill="none" stroke="${shades.stitchStroke}" stroke-width="0.8" stroke-dasharray="3,2" />
          <path d="M 190 575 L 410 575" fill="none" stroke="rgba(0,0,0,0.25)" stroke-width="1.5" />
          <path d="M 190 578 L 410 578" fill="none" stroke="${shades.stitchStroke}" stroke-width="0.8" stroke-dasharray="4,2" />
          ${collarSvg}
        </g>
      `;
    } else if (productId === 'sweatshirt') {
      bodyContent = `
        <ellipse cx="300" cy="640" rx="220" ry="22" fill="#080809" opacity="0.7" filter="blur(8px)" />
        <g id="sweatBody">
          <!-- Gövde -->
          <path id="garmentBodyPath" d="M 225 90 L 85 190 L 115 285 L 175 250 L 180 580 L 420 580 L 425 250 L 485 285 L 515 190 L 375 90 Z" 
                fill="url(#fabricGrad)" filter="url(#fleeceTexture)" />
          <!-- Manşetler ve Bel Ribanası -->
          <rect x="92" y="270" width="30" height="22" transform="rotate(-30, 92, 270)" fill="${shades.ribHex}" stroke="${shades.stitchStroke}" stroke-width="1.5" />
          <rect x="480" y="255" width="30" height="22" transform="rotate(30, 480, 255)" fill="${shades.ribHex}" stroke="${shades.stitchStroke}" stroke-width="1.5" />
          <rect x="180" y="560" width="240" height="35" fill="${shades.ribHex}" stroke="${shades.stitchStroke}" stroke-width="1.5" />
          <line x1="180" y1="565" x2="420" y2="565" stroke="${shades.stitchStroke}" stroke-width="1" stroke-dasharray="4,2" />
          <!-- Gölgeler ve Dikişler -->
          <path d="M 200 170 Q 215 380 205 560" fill="none" stroke="rgba(0,0,0,${shades.shadowOpacity})" stroke-width="16" filter="blur(8px)" />
          <path d="M 400 170 Q 385 380 395 560" fill="none" stroke="rgba(0,0,0,${shades.shadowOpacity})" stroke-width="16" filter="blur(8px)" />
          <path d="M 225 90 Q 300 135 375 90 Q 300 120 225 90 Z" fill="${shades.ribHex}" />
        </g>
      `;
    } else if (productId === 'hoodie') {
      bodyContent = `
        <ellipse cx="300" cy="640" rx="220" ry="22" fill="#080809" opacity="0.7" filter="blur(8px)" />
        <g id="hoodieBody">
          <!-- Gövde -->
          <path id="garmentBodyPath" d="M 225 90 L 85 190 L 115 285 L 175 250 L 180 580 L 420 580 L 425 250 L 485 285 L 515 190 L 375 90 Z" 
                fill="url(#fabricGrad)" filter="url(#fleeceTexture)" />
          <!-- Manşetler ve Bel Lastiği -->
          <rect x="92" y="270" width="30" height="22" transform="rotate(-30, 92, 270)" fill="${shades.ribHex}" stroke="${shades.stitchStroke}" stroke-width="1.5" />
          <rect x="480" y="255" width="30" height="22" transform="rotate(30, 480, 255)" fill="${shades.ribHex}" stroke="${shades.stitchStroke}" stroke-width="1.5" />
          <rect x="180" y="560" width="240" height="35" fill="${shades.ribHex}" stroke="${shades.stitchStroke}" stroke-width="1.5" />
          <line x1="180" y1="565" x2="420" y2="565" stroke="${shades.stitchStroke}" stroke-width="1" stroke-dasharray="4,2" />
          <!-- Gölgeler -->
          <path d="M 200 170 Q 215 380 205 560" fill="none" stroke="rgba(0,0,0,${shades.shadowOpacity})" stroke-width="16" filter="blur(8px)" />
          <path d="M 400 170 Q 385 380 395 560" fill="none" stroke="rgba(0,0,0,${shades.shadowOpacity})" stroke-width="16" filter="blur(8px)" />
          <!-- Kapüşon -->
          <path d="M 220 100 Q 185 30 300 25 Q 415 30 380 100 Q 300 135 220 100 Z" fill="url(#fabricGrad)" filter="url(#fleeceTexture)" />
          <path d="M 245 105 Q 300 125 355 105" fill="none" stroke="${shades.creaseStroke}" stroke-width="2" />
          <!-- Kordonlar ve Metal Uçlar -->
          <path d="M 265 110 C 260 170 250 200 255 225" fill="none" stroke="#ded9cf" stroke-width="3" stroke-linecap="round" />
          <rect x="252" y="225" width="6" height="14" rx="2" fill="#b29460" />
          <path d="M 335 110 C 340 170 350 200 345 225" fill="none" stroke="#ded9cf" stroke-width="3" stroke-linecap="round" />
          <rect x="342" y="225" width="6" height="14" rx="2" fill="#b29460" />
          <!-- Kanguru Cep -->
          <path d="M 215 440 L 385 440 L 405 520 L 195 520 Z" fill="none" stroke="${shades.creaseStroke}" stroke-width="2" />
          <path d="M 215 440 L 195 520" fill="none" stroke="rgba(0,0,0,0.3)" stroke-width="3" />
          <path d="M 385 440 L 405 520" fill="none" stroke="rgba(0,0,0,0.3)" stroke-width="3" />
        </g>
      `;
    } else if (productId === 'pantolon') {
      bodyContent = `
        <ellipse cx="300" cy="650" rx="220" ry="18" fill="#080809" opacity="0.7" filter="blur(8px)" />
        <g id="pantsBody">
          <!-- Beli ve Kordonlar -->
          <rect x="200" y="60" width="200" height="35" rx="4" fill="${shades.ribHex}" stroke="${shades.stitchStroke}" stroke-width="1.5" />
          <line x1="200" y1="78" x2="400" y2="78" stroke="${shades.stitchStroke}" stroke-width="1" stroke-dasharray="3,2" />
          <path d="M 285 85 C 280 120 270 145 275 165" fill="none" stroke="#ded9cf" stroke-width="2.5" stroke-linecap="round" />
          <rect x="272" y="165" width="5" height="12" rx="1.5" fill="#b29460" />
          <path d="M 315 85 C 320 120 330 145 325 165" fill="none" stroke="#ded9cf" stroke-width="2.5" stroke-linecap="round" />
          <rect x="323" y="165" width="5" height="12" rx="1.5" fill="#b29460" />
          <!-- Bacaklar -->
          <path d="M 200 95 L 180 320 L 210 610 L 270 610 L 285 300 L 300 240 L 300 95 Z" 
                fill="url(#fabricGrad)" filter="url(#fleeceTexture)" />
          <path d="M 400 95 L 420 320 L 390 610 L 330 610 L 315 300 L 300 240 L 300 95 Z" 
                fill="url(#fabricGrad)" filter="url(#fleeceTexture)" />
          <path d="M 300 95 L 300 245" fill="none" stroke="rgba(0,0,0,0.4)" stroke-width="2" />
          <path d="M 205 110 Q 235 150 215 190" fill="none" stroke="${shades.creaseStroke}" stroke-width="2" />
          <path d="M 395 110 Q 365 150 385 190" fill="none" stroke="${shades.creaseStroke}" stroke-width="2" />
          <!-- Paça Lastikleri -->
          <rect x="210" y="610" width="60" height="25" fill="${shades.ribHex}" stroke="${shades.stitchStroke}" stroke-width="1.5" />
          <rect x="330" y="610" width="60" height="25" fill="${shades.ribHex}" stroke="${shades.stitchStroke}" stroke-width="1.5" />
          <path d="M 240 200 Q 255 420 245 590" fill="none" stroke="rgba(0,0,0,${shades.shadowOpacity})" stroke-width="12" filter="blur(6px)" />
          <path d="M 360 200 Q 345 420 355 590" fill="none" stroke="rgba(0,0,0,${shades.shadowOpacity})" stroke-width="12" filter="blur(6px)" />
        </g>
      `;
    } else if (productId === 'canta') {
      bodyContent = `
        <ellipse cx="300" cy="620" rx="200" ry="20" fill="#090a0b" opacity="0.6" filter="blur(8px)" />
        <!-- Askılar -->
        <path d="M 230 200 C 230 60 370 60 370 200" fill="none" stroke="${shades.ribHex}" stroke-width="18" stroke-linecap="round" />
        <path d="M 230 200 C 230 60 370 60 370 200" fill="none" stroke="rgba(0,0,0,0.3)" stroke-width="1" stroke-dasharray="3,3" />
        <!-- Çanta Gövdesi -->
        <path d="M 160 200 L 440 200 L 420 580 L 180 580 Z" fill="url(#fabricGrad)" filter="url(#fabricTexture)" />
        <line x1="160" y1="210" x2="440" y2="210" stroke="rgba(0,0,0,0.15)" stroke-width="2" />
        <line x1="160" y1="214" x2="440" y2="214" stroke="${shades.stitchStroke}" stroke-width="1" stroke-dasharray="4,2" />
        <!-- Çapraz Takviye Dikişleri -->
        <rect x="220" y="210" width="22" height="28" fill="none" stroke="rgba(0,0,0,0.25)" stroke-width="1.5" />
        <line x1="220" y1="210" x2="242" y2="238" stroke="rgba(0,0,0,0.25)" stroke-width="1" />
        <line x1="242" y1="210" x2="220" y2="238" stroke="rgba(0,0,0,0.25)" stroke-width="1" />
        <rect x="360" y="210" width="22" height="28" fill="none" stroke="rgba(0,0,0,0.25)" stroke-width="1.5" />
        <line x1="360" y1="210" x2="382" y2="238" stroke="rgba(0,0,0,0.25)" stroke-width="1" />
        <line x1="382" y1="210" x2="360" y2="238" stroke="rgba(0,0,0,0.25)" stroke-width="1" />
      `;
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 680" width="100%" height="100%">${defsContent}${bodyContent}${badgeSvg}</svg>`;
  }

  // Renk Kimliğini Güvenle Eşle ve Doğrula
  function normalizeColorId(colorId, supportedColors) {
    if (!supportedColors || supportedColors.length === 0) return 'siyah';
    if (!colorId) return supportedColors[0].id;
    if (colorId === 'anthracite') {
      const match = supportedColors.find(c => c.id === 'siyah' || c.id === 'antrasit');
      return match ? match.id : supportedColors[0].id;
    }
    if (colorId === 'cream') {
      const match = supportedColors.find(c => c.id === 'ekru' || c.id === 'beyaz');
      return match ? match.id : supportedColors[0].id;
    }
    const exists = supportedColors.some(c => c.id === colorId);
    return exists ? colorId : supportedColors[0].id;
  }

  // Taban Mockup Görselini ve Vektör Kumaş Katmanını Güncelle
  function updateMockupBase() {
    const prod = getCurrentProductConfig();
    const viewCfg = getCurrentViewConfig();
    if (!viewCfg) return;

    state.colorId = normalizeColorId(state.colorId, prod.supportedColors);
    const activeColor = prod.supportedColors.find(c => c.id === state.colorId) || prod.supportedColors[0];

    // 1. Dinamik Kumaş ve Renk Vektör SVG'sini Sahneye Çiz (Katman 1 & Katman 2)
    const svgContent = generateProductSvg(state.productId, state.view, activeColor.hex, prod.spec);
    if (dom.mockupSvgWrap) {
      dom.mockupSvgWrap.innerHTML = svgContent;
    }

    // 2. Geriye Dönük Uyumluluk için Mockup Base Image'ı SVG Data URL ile Eşzamanla
    const svgDataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgContent);
    if (dom.mockupBaseImg) {
      dom.mockupBaseImg.src = svgDataUrl;
      dom.mockupBaseImg.alt = `${prod.name} ${viewCfg.label} - Nizamlar Baskı (${activeColor.name})`;
    }

    // 3. Üst Rozetleri ve Seçili Renk Adını Güncelle
    if (dom.badgeProductName) dom.badgeProductName.textContent = prod.name;
    if (dom.badgeSpec) dom.badgeSpec.textContent = prod.spec;
    if (dom.badgeView) dom.badgeView.textContent = viewCfg.label;
    if (dom.selectedColorName) dom.selectedColorName.textContent = activeColor.name;

    // 4. Baskı Kılavuz Alanını Konumlandır
    if (dom.printableGuide && viewCfg.printableArea) {
      const pa = viewCfg.printableArea;
      const leftPct = (pa.x / CFG.canvas.width) * 100;
      const topPct = (pa.y / CFG.canvas.height) * 100;
      const widthPct = (pa.width / CFG.canvas.width) * 100;
      const heightPct = (pa.height / CFG.canvas.height) * 100;

      dom.printableGuide.style.left = `${leftPct}%`;
      dom.printableGuide.style.top = `${topPct}%`;
      dom.printableGuide.style.width = `${widthPct}%`;
      dom.printableGuide.style.height = `${heightPct}%`;

      if (dom.guideTag) {
        dom.guideTag.textContent = pa.label || 'GÜVENLİ BASKI ALANI';
      }
    }

    renderColorSwatches();
    renderPlacementPills();
    renderViewToggles();
  }

  let showAllColors = false;

  // Profesyonel Renk Kartelası Dairelerini Oluştur (8 Renk + Genişletilebilir Tüm Renkler)
  function renderColorSwatches() {
    if (!dom.colorSwatchesWrap) return;
    const prod = getCurrentProductConfig();
    const colors = prod.supportedColors || [];

    state.colorId = normalizeColorId(state.colorId, colors);
    const activeColor = colors.find(c => c.id === state.colorId) || colors[0];

    if (dom.selectedColorName && activeColor) {
      dom.selectedColorName.textContent = activeColor.name;
    }

    dom.colorSwatchesWrap.innerHTML = '';

    // 8'den fazla renk varsa başlangıçta ilk 8 rengi göster veya "Tüm Renkler" tıklandığında genişlet
    const limit = (colors.length > 8 && !showAllColors) ? 8 : colors.length;
    const visibleColors = colors.slice(0, limit);

    visibleColors.forEach(c => {
      const swatch = document.createElement('button');
      swatch.type = 'button';
      const isActive = c.id === state.colorId;
      const light = isColorLight(c.hex);
      swatch.className = `color-swatch-btn color-swatch-item ${isActive ? 'active' : ''} ${light ? 'is-light' : ''}`;
      swatch.title = `${c.name} (${c.hex})`;
      swatch.setAttribute('aria-label', `${c.name} Kumaş Rengi`);
      swatch.setAttribute('data-color-id', c.id);
      swatch.setAttribute('data-color-name', c.name);
      swatch.setAttribute('data-color-hex', c.hex);
      swatch.style.backgroundColor = c.hex;

      swatch.addEventListener('click', () => {
        state.colorId = c.id;
        dom.colorSwatchesWrap.querySelectorAll('.color-swatch-btn, .color-swatch-item').forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
        if (dom.selectedColorName) dom.selectedColorName.textContent = c.name;
        updateMockupBase();
        showToast(`Kumaş rengi: ${c.name}`);
      });

      dom.colorSwatchesWrap.appendChild(swatch);
    });

    if (colors.length > 8) {
      const toggleBtn = document.createElement('button');
      toggleBtn.type = 'button';
      toggleBtn.className = 'btn-toggle-all-colors';
      toggleBtn.setAttribute('aria-label', showAllColors ? 'Daha az renk göster' : 'Tüm renkleri göster');
      toggleBtn.innerHTML = showAllColors 
        ? '<span>Daha Az</span>' 
        : `<span>+${colors.length - 8} Tüm Renkler</span>`;

      toggleBtn.addEventListener('click', () => {
        showAllColors = !showAllColors;
        renderColorSwatches();
      });

      dom.colorSwatchesWrap.appendChild(toggleBtn);
    }
  }

  // Görünüm Butonlarını Güncelle (Ön / Sırt)
  function renderViewToggles() {
    const prod = getCurrentProductConfig();
    const canToggleView = prod.supportedViews && prod.supportedViews.length > 1;

    if (dom.viewToggleWrap) {
      dom.viewToggleWrap.style.display = canToggleView ? 'block' : 'none';
    }

    dom.btnViewToggles.forEach(btn => {
      const v = btn.getAttribute('data-view');
      btn.classList.toggle('active', v === state.view);
    });
  }

  // Hazır Konum Butonları (Pills)
  function renderPlacementPills() {
    if (!dom.placementPillsRow) return;
    const viewCfg = getCurrentViewConfig();
    dom.placementPillsRow.innerHTML = '';

    if (!viewCfg || !viewCfg.positions) return;

    Object.keys(viewCfg.positions).forEach(posKey => {
      const pos = viewCfg.positions[posKey];
      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = `placement-pill ${pos.id === state.positionId ? 'active' : ''}`;
      pill.setAttribute('data-position', pos.id);
      pill.innerHTML = `<span>${pos.name}</span>`;

      pill.addEventListener('click', () => {
        history.push(state.transform);
        applyPlacementPreset(pos);
        dom.placementPillsRow.querySelectorAll('.placement-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        showToast(`Baskı konumu: ${pos.name}`);
      });

      dom.placementPillsRow.appendChild(pill);
    });
  }

  function applyPlacementPreset(pos) {
    state.positionId = pos.id;
    state.transform.x = pos.x;
    state.transform.y = pos.y;
    state.transform.scale = pos.scale;
    state.transform.rotation = pos.rotation || 0;

    syncSlidersFromTransform();
    renderArtwork();
  }

  // Tasarımı Sahne Üzerinde Çiz ve Responsive Ölçeklendir
  function renderArtwork() {
    if (!dom.artworkLayer || !dom.artworkImg) return;

    if (!state.image) {
      dom.artworkLayer.style.display = 'none';
      if (dom.emptyPrompt) dom.emptyPrompt.style.display = 'block';
      return;
    }

    dom.artworkLayer.style.display = 'flex';
    if (dom.emptyPrompt) dom.emptyPrompt.style.display = 'none';

    const stageW = CFG.canvas.width;
    const stageH = CFG.canvas.height;

    const leftPct = (state.transform.x / stageW) * 100;
    const topPct = (state.transform.y / stageH) * 100;

    // Taban referans genişlik: 220px / 600px = %36.6667 (Tüm ekran boyutlarında kusursuz ölçek)
    const widthPct = ((220 * state.transform.scale) / stageW) * 100;

    dom.artworkLayer.style.left = `${leftPct}%`;
    dom.artworkLayer.style.top = `${topPct}%`;
    dom.artworkLayer.style.width = `${widthPct}%`;
    dom.artworkLayer.style.transform = `translate(-50%, -50%) rotate(${state.transform.rotation}deg)`;

    dom.artworkLayer.className = `user-artwork-layer blend-${state.blendMode}`;
    if (state.isDragging) dom.artworkLayer.classList.add('is-dragging', 'is-active');
    if (state.isResizing) dom.artworkLayer.classList.add('is-resizing', 'is-active');
  }

  function syncSlidersFromTransform() {
    const scalePercent = Math.round(state.transform.scale * 100);
    if (dom.sliderScale) {
      dom.sliderScale.value = scalePercent;
      if (dom.valScale) dom.valScale.textContent = `%${scalePercent}`;
    }
    if (dom.quickScaleSlider) {
      dom.quickScaleSlider.value = scalePercent;
    }
    if (dom.sliderRotate) {
      dom.sliderRotate.value = state.transform.rotation;
      if (dom.valRotate) dom.valRotate.textContent = `${state.transform.rotation}°`;
    }
    if (dom.sliderX) {
      const offsetX = Math.round(state.transform.x - 300);
      dom.sliderX.value = offsetX;
      if (dom.valX) dom.valX.textContent = `${offsetX > 0 ? '+' : ''}${offsetX}px`;
    }
    if (dom.sliderY) {
      const offsetY = Math.round(state.transform.y - 340);
      dom.sliderY.value = offsetY;
      if (dom.valY) dom.valY.textContent = `${offsetY > 0 ? '+' : ''}${offsetY}px`;
    }
  }

  // Güvenli Akıllı Başlangıç Konumu: Yüklenen tasarımın en-boy oranına göre otomatik sığdırma ve ortalama
  function calculateSmartInitialTransform(imgWidth, imgHeight) {
    const bounds = getPrintableBounds();
    const aspectRatio = (imgWidth && imgHeight) ? (imgWidth / imgHeight) : 1;

    let targetScale = 0.95;
    // Yatay geniş tasarımlarda veya dikey yüksek tasarımlarda taşmayı önle
    if (aspectRatio > 1.8) {
      targetScale = 0.85;
    } else if (aspectRatio < 0.6) {
      targetScale = 0.75;
    }

    return {
      x: bounds.centerX,
      y: bounds.centerY,
      scale: targetScale,
      rotation: 0
    };
  }

  // Manyetik Hizalama Kılavuz Çizgileri
  function showSnapGuide(axis, coordPct) {
    if (axis === 'x' && dom.snapGuideX) {
      dom.snapGuideX.style.left = `${coordPct}%`;
      dom.snapGuideX.style.opacity = '1';
    } else if (axis === 'y' && dom.snapGuideY) {
      dom.snapGuideY.style.top = `${coordPct}%`;
      dom.snapGuideY.style.opacity = '1';
    }
  }

  function hideSnapGuides() {
    if (dom.snapGuideX) dom.snapGuideX.style.opacity = '0';
    if (dom.snapGuideY) dom.snapGuideY.style.opacity = '0';
  }

  // DOĞRUDAN ÜRÜN ÜZERİNDE TAŞIMA, BOYUTLANDIRMA VE MOBİL PINCH ETKİLEŞİMİ
  function setupDirectInteraction() {
    if (!dom.artworkLayer || !dom.stageFrame) return;

    // Resizing Tutamaç Olayı
    const handles = dom.artworkLayer.querySelectorAll('.artwork-corner-handle');
    handles.forEach(handle => {
      handle.addEventListener('pointerdown', (e) => {
        if (!state.image) return;
        e.preventDefault();
        e.stopPropagation();

        history.push(state.transform);
        state.isResizing = true;
        state.resizeCorner = handle.getAttribute('data-corner');
        dom.artworkLayer.classList.add('is-resizing', 'is-active');

        state.dragStart.pointerX = e.clientX;
        state.dragStart.pointerY = e.clientY;
        state.dragStart.initialScale = state.transform.scale;

        window.addEventListener('pointermove', onPointerMoveResize);
        window.addEventListener('pointerup', onPointerUpResize);
        window.addEventListener('pointercancel', onPointerUpResize);
      });
    });

    const onPointerMoveResize = (e) => {
      if (!state.isResizing) return;
      const rect = dom.stageFrame.getBoundingClientRect();
      const scaleFactorX = CFG.canvas.width / (rect.width || 600);
      const deltaX = (e.clientX - state.dragStart.pointerX) * scaleFactorX;

      // Tutamaç yönüne göre ölçek delta faktörü
      let delta = 0;
      if (state.resizeCorner === 'se' || state.resizeCorner === 'ne') {
        delta = deltaX / 200;
      } else {
        delta = -deltaX / 200;
      }

      let newScale = state.dragStart.initialScale + delta;
      newScale = Math.max(0.20, Math.min(2.0, parseFloat(newScale.toFixed(2))));
      state.transform.scale = newScale;

      syncSlidersFromTransform();
      renderArtwork();
    };

    const onPointerUpResize = () => {
      if (!state.isResizing) return;
      state.isResizing = false;
      state.resizeCorner = null;
      dom.artworkLayer.classList.remove('is-resizing');

      window.removeEventListener('pointermove', onPointerMoveResize);
      window.removeEventListener('pointerup', onPointerUpResize);
      window.removeEventListener('pointercancel', onPointerUpResize);
    };

    // Doğrudan Sürükleme (Drag)
    const onPointerDown = (e) => {
      if (!state.image || state.isResizing) return;
      e.preventDefault();

      history.push(state.transform);
      state.isDragging = true;
      dom.artworkLayer.classList.add('is-dragging', 'is-active');

      state.dragStart.pointerX = e.clientX;
      state.dragStart.pointerY = e.clientY;
      state.dragStart.initialX = state.transform.x;
      state.dragStart.initialY = state.transform.y;

      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerUp);
    };

    const onPointerMove = (e) => {
      if (!state.isDragging) return;

      const rect = dom.stageFrame.getBoundingClientRect();
      const scaleFactorX = CFG.canvas.width / rect.width;
      const scaleFactorY = CFG.canvas.height / rect.height;

      const deltaX = (e.clientX - state.dragStart.pointerX) * scaleFactorX;
      const deltaY = (e.clientY - state.dragStart.pointerY) * scaleFactorY;

      let newX = Math.round(state.dragStart.initialX + deltaX);
      let newY = Math.round(state.dragStart.initialY + deltaY);

      const bounds = getPrintableBounds();

      // Güvenli Sınır Kısıtlaması (Taşmayı önleme)
      const margin = 20;
      newX = Math.max(bounds.minX - margin, Math.min(bounds.maxX + margin, newX));
      newY = Math.max(bounds.minY - margin, Math.min(bounds.maxY + margin, newY));

      // Akıllı Manyetik Hizalama (Snap-to-center / Snap Tolerance: 7px)
      const snapTol = 7;
      let snappedX = false;
      let snappedY = false;

      if (Math.abs(newX - bounds.centerX) <= snapTol) {
        newX = bounds.centerX;
        snappedX = true;
        showSnapGuide('x', (bounds.centerX / CFG.canvas.width) * 100);
      } else {
        if (dom.snapGuideX) dom.snapGuideX.style.opacity = '0';
      }

      if (Math.abs(newY - bounds.centerY) <= snapTol) {
        newY = bounds.centerY;
        snappedY = true;
        showSnapGuide('y', (bounds.centerY / CFG.canvas.height) * 100);
      } else {
        if (dom.snapGuideY) dom.snapGuideY.style.opacity = '0';
      }

      state.transform.x = newX;
      state.transform.y = newY;

      syncSlidersFromTransform();
      renderArtwork();
    };

    const onPointerUp = () => {
      if (!state.isDragging) return;
      state.isDragging = false;
      dom.artworkLayer.classList.remove('is-dragging');
      hideSnapGuides();

      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };

    dom.artworkLayer.addEventListener('pointerdown', onPointerDown);

    // Mouse Wheel ile Hızlı Boyutlandırma
    dom.artworkLayer.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.05 : 0.05;
      let newScale = state.transform.scale + delta;
      newScale = Math.max(0.20, Math.min(2.0, parseFloat(newScale.toFixed(2))));
      state.transform.scale = newScale;
      syncSlidersFromTransform();
      renderArtwork();
    }, { passive: false });

    // Mobil İki Parmakla Pinch-to-Zoom (Sayfa Scrollunu Etkilemeden Yalnızca Görsel Boyutu)
    let initialDistance = 0;
    let initialScale = 1;

    dom.artworkLayer.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        initialDistance = dist;
        initialScale = state.transform.scale;
      }
    }, { passive: false });

    dom.artworkLayer.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2 && initialDistance > 0) {
        e.preventDefault();
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const ratio = dist / initialDistance;
        let newScale = initialScale * ratio;
        newScale = Math.max(0.20, Math.min(2.0, parseFloat(newScale.toFixed(2))));
        state.transform.scale = newScale;
        syncSlidersFromTransform();
        renderArtwork();
      }
    }, { passive: false });

    dom.artworkLayer.addEventListener('touchend', (e) => {
      if (e.touches.length < 2) {
        initialDistance = 0;
      }
    });
  }

  // Güvenli SVG Sanitizer (Zararlı Script ve Olayları Temizler)
  function sanitizeSvgString(svgText) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgText, 'image/svg+xml');

    // Hata kontrolü
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      throw new Error('Geçersiz SVG formatı');
    }

    // script etiketlerini ve on* olay dinleyicilerini kaldır
    doc.querySelectorAll('script').forEach(el => el.remove());
    const allElements = doc.querySelectorAll('*');
    allElements.forEach(el => {
      const attrs = Array.from(el.attributes);
      attrs.forEach(attr => {
        if (attr.name.toLowerCase().startsWith('on') || attr.value.toLowerCase().includes('javascript:')) {
          el.removeAttribute(attr.name);
        }
      });
    });

    return new XMLSerializer().serializeToString(doc);
  }

  // Kullanıcı Dosyası Yükleme İşlemi
  function handleFileUpload(file) {
    if (!file) return;

    const validExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.svg'];
    const fileName = file.name.toLowerCase();
    const isValidExt = validExtensions.some(ext => fileName.endsWith(ext));

    if (!isValidExt) {
      alert('Desteklenmeyen dosya formatı. Lütfen PNG, JPG, JPEG, WEBP veya SVG yükleyiniz.');
      return;
    }

    const maxBytes = (CFG.section.maxSizeMB || 25) * 1024 * 1024;
    if (file.size > maxBytes) {
      alert(`Dosya boyutu çok yüksek. Lütfen ${CFG.section.maxSizeMB || 25} MB altında bir dosya yükleyiniz.`);
      return;
    }

    if (fileName.endsWith('.svg')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const safeSvg = sanitizeSvgString(e.target.result);
          const blob = new Blob([safeSvg], { type: 'image/svg+xml' });
          const safeUrl = URL.createObjectURL(blob);
          loadArtworkFromSrc(safeUrl, file.name, (file.size / (1024 * 1024)).toFixed(2) + ' MB', true);
          showToast('Vektör SVG dosyanız güvenle yüklendi.');
        } catch (err) {
          alert('SVG dosyası işlenirken hata oluştu: ' + err.message);
        }
      };
      reader.readAsText(file);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        loadArtworkFromSrc(e.target.result, file.name, (file.size / (1024 * 1024)).toFixed(2) + ' MB', false);
        showToast('Tasarımınız başarıyla yüklendi.');
      };
      reader.readAsDataURL(file);
    }
  }

  // Görsel Kaynağından Yükleme ve Akıllı Başlangıç Konumlandırma
  function loadArtworkFromSrc(src, name = 'Özel Tasarım Dosyası', sizeText = '', isSvg = false) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      state.image = img;
      state.imageDataUrl = src;
      state.imageFileName = name;
      state.imageFileSize = sizeText;
      state.naturalWidth = img.naturalWidth || 600;
      state.naturalHeight = img.naturalHeight || 600;

      if (dom.artworkImg) {
        dom.artworkImg.src = src;
        dom.artworkImg.alt = name;
      }

      if (dom.activeFileBar) {
        dom.activeFileBar.style.display = 'flex';
        if (dom.activeFileName) dom.activeFileName.textContent = name;
        if (dom.activeFileSize) dom.activeFileSize.textContent = sizeText ? `(${sizeText})` : '';
        if (dom.activeFileThumb) dom.activeFileThumb.src = src;
      }

      // Akıllı Başlangıç Konumlandırma: Ürün baskı alanına otomatik sığdır ve ortala
      const initial = calculateSmartInitialTransform(state.naturalWidth, state.naturalHeight);
      state.transform.x = initial.x;
      state.transform.y = initial.y;
      state.transform.scale = initial.scale;
      state.transform.rotation = 0;

      history.push(state.transform);
      syncSlidersFromTransform();
      renderArtwork();
    };
    img.src = src;
  }

  function removeArtwork() {
    state.image = null;
    state.imageDataUrl = null;
    state.imageFileName = null;
    state.imageFileSize = null;
    state.activeSampleId = null;

    if (dom.artworkImg) dom.artworkImg.src = '';
    if (dom.activeFileBar) dom.activeFileBar.style.display = 'none';
    if (dom.fileInput) dom.fileInput.value = '';

    dom.sampleButtonsRow.querySelectorAll('.btn-sample-pick').forEach(b => b.classList.remove('active'));
    renderArtwork();
    showToast('Tasarım kaldırıldı.');
  }

  // Olay Dinleyicileri (Event Listeners)
  function attachEventListeners() {
    // 1. Dropzone Olayları
    if (dom.dropzone && dom.fileInput) {
      dom.dropzone.addEventListener('click', () => dom.fileInput.click());
      dom.fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          handleFileUpload(e.target.files[0]);
        }
      });

      ['dragenter', 'dragover'].forEach(evtName => {
        dom.dropzone.addEventListener(evtName, (e) => {
          e.preventDefault();
          dom.dropzone.classList.add('is-dragover');
        });
      });

      ['dragleave', 'drop'].forEach(evtName => {
        dom.dropzone.addEventListener(evtName, (e) => {
          e.preventDefault();
          dom.dropzone.classList.remove('is-dragover');
        });
      });

      dom.dropzone.addEventListener('drop', (e) => {
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
          handleFileUpload(e.dataTransfer.files[0]);
        }
      });
    }

    if (dom.btnRemoveFile) {
      dom.btnRemoveFile.addEventListener('click', removeArtwork);
    }

    // Örnek Tasarımları Aç / Kapat Toggle
    if (dom.btnToggleSamples && dom.sampleDesignsWrap) {
      dom.btnToggleSamples.addEventListener('click', () => {
        const isHidden = dom.sampleDesignsWrap.style.display === 'none' || dom.sampleDesignsWrap.hasAttribute('hidden');
        if (isHidden) {
          dom.sampleDesignsWrap.style.display = 'block';
          dom.sampleDesignsWrap.removeAttribute('hidden');
          dom.btnToggleSamples.classList.add('active');
          dom.btnToggleSamples.setAttribute('aria-expanded', 'true');
          const chevron = dom.btnToggleSamples.querySelector('.toggle-icon');
          if (chevron) chevron.textContent = '▲';
        } else {
          dom.sampleDesignsWrap.style.display = 'none';
          dom.sampleDesignsWrap.setAttribute('hidden', '');
          dom.btnToggleSamples.classList.remove('active');
          dom.btnToggleSamples.setAttribute('aria-expanded', 'false');
          const chevron = dom.btnToggleSamples.querySelector('.toggle-icon');
          if (chevron) chevron.textContent = '▾';
        }
      });
    }

    // 2. Örnek Tasarım Butonları
    if (dom.sampleButtonsRow && CFG.samples) {
      dom.sampleButtonsRow.innerHTML = '';
      CFG.samples.forEach(sample => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `btn-sample-pick ${sample.id === state.activeSampleId ? 'active' : ''}`;
        btn.innerHTML = `
          <div class="sample-card-preview">
            <img src="${sample.src}" alt="${sample.name}">
          </div>
          <span class="sample-card-title">${sample.name}</span>
        `;

        btn.addEventListener('click', () => {
          dom.sampleButtonsRow.querySelectorAll('.btn-sample-pick').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          state.activeSampleId = sample.id;
          loadArtworkFromSrc(sample.src, `${sample.name} (${sample.category})`);
          showToast(`Örnek yüklendi: ${sample.name}`);
        });

        dom.sampleButtonsRow.appendChild(btn);
      });
    }

    // 3. Ürün Kartı Seçimi
    dom.productCards.forEach(card => {
      card.addEventListener('click', () => {
        const pId = card.getAttribute('data-product');
        if (!CFG.products[pId]) return;

        state.productId = pId;
        const pCfg = CFG.products[pId];
        state.view = pCfg.defaultView || 'front';
        
        // Yeni ürün mevcut kumaş rengini destekliyorsa rengi koru, desteklemiyorsa varsayılan renge geç
        const isColorSupported = pCfg.supportedColors && pCfg.supportedColors.some(c => c.id === state.colorId);
        if (!isColorSupported) {
          state.colorId = pCfg.defaultColor || (pCfg.supportedColors ? pCfg.supportedColors[0].id : 'siyah');
        }

        const viewCfg = pCfg.views[state.view];
        if (viewCfg && viewCfg.defaultPosition && viewCfg.positions[viewCfg.defaultPosition]) {
          const defPos = viewCfg.positions[viewCfg.defaultPosition];
          state.positionId = defPos.id;
          state.transform.x = defPos.x;
          state.transform.y = defPos.y;
          state.transform.scale = defPos.scale;
          state.transform.rotation = defPos.rotation || 0;
        }

        dom.productCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');

        updateMockupBase();
        syncSlidersFromTransform();
        renderArtwork();
        showToast(`Ürün seçildi: ${pCfg.name}`);
      });
    });

    // 4. Görünüm (Ön / Sırt) Değiştirme
    dom.btnViewToggles.forEach(btn => {
      btn.addEventListener('click', () => {
        const v = btn.getAttribute('data-view');
        state.view = v;
        const viewCfg = getCurrentViewConfig();
        if (viewCfg && viewCfg.defaultPosition && viewCfg.positions[viewCfg.defaultPosition]) {
          const defPos = viewCfg.positions[viewCfg.defaultPosition];
          state.positionId = defPos.id;
          state.transform.x = defPos.x;
          state.transform.y = defPos.y;
          state.transform.scale = defPos.scale;
          state.transform.rotation = defPos.rotation || 0;
        }

        updateMockupBase();
        syncSlidersFromTransform();
        renderArtwork();
        showToast(`Görünüm: ${viewCfg ? viewCfg.label : v}`);
      });
    });

    // 5. Hızlı Boyut Kaydırıcısı (Ana Ekranda Sade Kontrol)
    if (dom.quickScaleSlider) {
      dom.quickScaleSlider.addEventListener('input', (e) => {
        state.transform.scale = parseFloat(e.target.value) / 100;
        syncSlidersFromTransform();
        renderArtwork();
      });
      dom.quickScaleSlider.addEventListener('change', () => {
        history.push(state.transform);
      });
    }

    // 6. Tek Tuşla Ortala
    if (dom.btnCenterArtwork) {
      dom.btnCenterArtwork.addEventListener('click', () => {
        history.push(state.transform);
        const bounds = getPrintableBounds();
        state.transform.x = bounds.centerX;
        state.transform.y = bounds.centerY;
        syncSlidersFromTransform();
        renderArtwork();
        showToast('Tasarım baskı alanında ortalandı 🎯');
      });
    }

    // 7. Geri Al (Undo) ve Yeniden Yap (Redo)
    if (dom.btnUndo) {
      dom.btnUndo.addEventListener('click', () => {
        const prev = history.undo();
        if (prev) {
          state.transform = { ...prev };
          syncSlidersFromTransform();
          renderArtwork();
          showToast('Son işlem geri alındı ↩️');
        }
      });
    }

    if (dom.btnRedo) {
      dom.btnRedo.addEventListener('click', () => {
        const next = history.redo();
        if (next) {
          state.transform = { ...next };
          syncSlidersFromTransform();
          renderArtwork();
          showToast('İşlem yinelendi ↪️');
        }
      });
    }

    // 8. Sıfırla (Yalnızca konumu ve dönüşümü varsayılana çeker, dosyayı SİLMEZ)
    const handleResetTransform = () => {
      history.push(state.transform);
      const viewCfg = getCurrentViewConfig();
      if (viewCfg && viewCfg.defaultPosition && viewCfg.positions[viewCfg.defaultPosition]) {
        applyPlacementPreset(viewCfg.positions[viewCfg.defaultPosition]);
      } else {
        const bounds = getPrintableBounds();
        state.transform.x = bounds.centerX;
        state.transform.y = bounds.centerY;
        state.transform.scale = 0.95;
        state.transform.rotation = 0;
        syncSlidersFromTransform();
        renderArtwork();
      }
      showToast('Baskı konumu sıfırlandı.');
    };

    if (dom.btnReset) dom.btnReset.addEventListener('click', handleResetTransform);
    if (dom.btnStageReset) dom.btnStageReset.addEventListener('click', handleResetTransform);

    // 9. Gelişmiş Ayarlar Akordeonu
    if (dom.advancedToggle && dom.advancedPanel) {
      dom.advancedToggle.addEventListener('click', () => {
        const isHidden = dom.advancedPanel.style.display === 'none' || dom.advancedPanel.hasAttribute('hidden');
        if (isHidden) {
          dom.advancedPanel.style.display = 'grid';
          dom.advancedPanel.removeAttribute('hidden');
          dom.advancedToggle.classList.add('active');
          dom.advancedToggle.querySelector('.accordion-arrow').textContent = '▲';
        } else {
          dom.advancedPanel.style.display = 'none';
          dom.advancedPanel.setAttribute('hidden', '');
          dom.advancedToggle.classList.remove('active');
          dom.advancedToggle.querySelector('.accordion-arrow').textContent = '▼';
        }
      });
    }

    // 10. İleri Düzey Sürgüler
    if (dom.sliderScale) {
      dom.sliderScale.addEventListener('input', (e) => {
        state.transform.scale = parseFloat(e.target.value) / 100;
        syncSlidersFromTransform();
        renderArtwork();
      });
    }

    if (dom.sliderRotate) {
      dom.sliderRotate.addEventListener('input', (e) => {
        state.transform.rotation = parseInt(e.target.value, 10);
        syncSlidersFromTransform();
        renderArtwork();
      });
    }

    if (dom.sliderX) {
      dom.sliderX.addEventListener('input', (e) => {
        const offsetX = parseInt(e.target.value, 10);
        state.transform.x = 300 + offsetX;
        syncSlidersFromTransform();
        renderArtwork();
      });
    }

    if (dom.sliderY) {
      dom.sliderY.addEventListener('input', (e) => {
        const offsetY = parseInt(e.target.value, 10);
        state.transform.y = 340 + offsetY;
        syncSlidersFromTransform();
        renderArtwork();
      });
    }

    // 11. Baskı Dokusu (DTF Canlı / Su Bazlı Tuşe)
    if (dom.btnBlendNormal && dom.btnBlendMultiply) {
      dom.btnBlendNormal.addEventListener('click', () => {
        state.blendMode = 'normal';
        dom.btnBlendNormal.classList.add('active');
        dom.btnBlendMultiply.classList.remove('active');
        renderArtwork();
        showToast('Doku: DTF Canlı (Örtücü Film)');
      });

      dom.btnBlendMultiply.addEventListener('click', () => {
        state.blendMode = 'multiply';
        dom.btnBlendMultiply.classList.add('active');
        dom.btnBlendNormal.classList.remove('active');
        renderArtwork();
        showToast('Doku: Su Bazlı Tuşe (Kumaşla Bütünleşik)');
      });
    }

    // 12. Baskı Kılavuzunu Göster/Gizle
    if (dom.btnToggleGuide && dom.printableGuide) {
      dom.btnToggleGuide.addEventListener('click', () => {
        state.showGuide = !state.showGuide;
        dom.printableGuide.style.display = state.showGuide ? 'block' : 'none';
        dom.btnToggleGuide.classList.toggle('active', state.showGuide);
        showToast(state.showGuide ? 'Kılavuz gösterildi' : 'Kılavuz gizlendi');
      });
    }

    // 13. "Bu Tasarımla Teklif İste" Butonu
    if (dom.btnQuote) {
      dom.btnQuote.addEventListener('click', () => {
        if (!state.image) {
          alert('Lütfen önce bir tasarım yükleyin veya örnek tasarımlardan birini seçin.');
          return;
        }

        const prod = getCurrentProductConfig();
        const viewCfg = getCurrentViewConfig();
        const colorObj = prod.supportedColors.find(c => c.id === state.colorId) || { name: state.colorId, hex: '' };
        const posObj = (viewCfg && viewCfg.positions && viewCfg.positions[state.positionId]) ? viewCfg.positions[state.positionId] : { name: 'Standart Baskı' };

        const previewData = {
          productId: state.productId,
          productName: prod.name,
          productCategory: prod.category,
          view: state.view === 'front' ? 'Ön' : 'Sırt',
          viewAngle: viewCfg.label,
          colorId: state.colorId,
          colorName: colorObj.name,
          colorHex: colorObj.hex,
          positionId: state.positionId,
          positionName: posObj.name,
          scalePercent: Math.round(state.transform.scale * 100),
          rotationDeg: state.transform.rotation,
          fileName: state.imageFileName || 'Önizleme Tasarımı',
          imageDataUrl: state.imageDataUrl,
          transform: { ...state.transform },
          blendMode: state.blendMode === 'normal' ? 'DTF Canlı Baskı' : 'Su Bazlı Ekolojik Tuşe',
          // Geriye dönük uyumluluk alanları:
          product_name: prod.name,
          product_category: prod.category,
          product_color: `${colorObj.name} (${colorObj.hex})`,
          view_angle: viewCfg.label,
          blend_mode: state.blendMode === 'normal' ? 'DTF Canlı Baskı' : 'Su Bazlı Ekolojik Tuşe',
          design_name: state.imageFileName || 'Önizleme Tasarımı'
        };

        try {
          sessionStorage.setItem('nizamlar_custom_preview', JSON.stringify(previewData));
        } catch (err) {
          console.warn('SessionStorage kayıt uyarısı:', err);
        }

        window.location.href = 'teklif-al/';
      });
    }

    // 14. "Önizlemeyi İndir (PNG)" Canvas Motoru
    if (dom.btnDownload) {
      dom.btnDownload.addEventListener('click', async () => {
        showToast('Yüksek çözünürlüklü önizleme hazırlanıyor...');
        try {
          await exportHighResMockupPng();
        } catch (err) {
          console.error('PNG export hatası:', err);
          alert('Önizleme görseli indirilirken bir sorun oluştu.');
        }
      });
    }

    // 15. "Önizlemeyi Paylaş" Düğmesi
    if (dom.btnShare) {
      dom.btnShare.addEventListener('click', async () => {
        const shareData = {
          title: 'Nizamlar Baskı — Canlı Baskı Önizlemesi',
          text: `${getCurrentProductConfig().name} için hazırladığım canlı baskı tasarım provası:`,
          url: `${window.location.origin}${window.location.pathname}#onizleme-${state.productId}-${state.view}`
        };

        if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
          try {
            await navigator.share(shareData);
            return;
          } catch (err) {
            // Kullanıcı iptal ettiğinde panoya kopyalamaya düş
          }
        }

        if (navigator.clipboard) {
          navigator.clipboard.writeText(shareData.url).then(() => {
            showToast('Önizleme bağlantısı panoya kopyalandı! 📋');
          });
        } else {
          showToast('Önizleme bağlantısı hazır.');
        }
      });
    }
  }

  // Yüksek Çözünürlüklü (2X Retina) Mockup PNG İndirme Motoru
  async function exportHighResMockupPng() {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 1360;
    const ctx = canvas.getContext('2d');

    const prod = getCurrentProductConfig();
    const viewCfg = getCurrentViewConfig();
    const activeColor = prod.supportedColors.find(c => c.id === state.colorId) || prod.supportedColors[0];

    // 1. Mockup Arka Plan Görselini Yükle ve Çiz
    const svgElement = dom.mockupSvgWrap ? dom.mockupSvgWrap.querySelector('svg') : null;
    let svgDataUrl = '';
    if (svgElement) {
      const svgStr = new XMLSerializer().serializeToString(svgElement);
      svgDataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr);
    } else if (dom.mockupBaseImg) {
      svgDataUrl = dom.mockupBaseImg.src;
    }

    const baseImg = new Image();
    baseImg.crossOrigin = 'anonymous';
    await new Promise((resolve, reject) => {
      baseImg.onload = resolve;
      baseImg.onerror = reject;
      baseImg.src = svgDataUrl;
    });

    ctx.drawImage(baseImg, 0, 0, canvas.width, canvas.height);

    // 2. Kullanıcı Tasarımı Varsa Üzerine Doğru Açı ve Koordinatla Bindir
    if (state.image) {
      ctx.save();
      const targetX = state.transform.x * 2;
      const targetY = state.transform.y * 2;

      ctx.translate(targetX, targetY);
      ctx.rotate((state.transform.rotation * Math.PI) / 180);

      const baseWidthPx = 440; // 220 * 2
      const drawWidth = baseWidthPx * state.transform.scale;
      const aspectRatio = state.image.naturalWidth / (state.image.naturalHeight || state.image.naturalWidth);
      const drawHeight = drawWidth / (aspectRatio || 1);

      if (state.blendMode === 'multiply') {
        ctx.globalCompositeOperation = 'multiply';
      }

      ctx.drawImage(state.image, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
      ctx.restore();
    }

    // 3. Marka Filigranı ve Bilgi Şeridi
    ctx.save();
    ctx.fillStyle = 'rgba(18, 19, 21, 0.88)';
    ctx.fillRect(0, canvas.height - 74, canvas.width, 74);

    ctx.font = '700 24px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#f3efe7';
    ctx.fillText('NİZAMLAR BASKI', 40, canvas.height - 30);

    ctx.font = '600 16px "JetBrains Mono", monospace';
    ctx.fillStyle = '#b29460';
    const prodName = prod.name || 'Tekstil';
    ctx.fillText(`CANLI BASKI PROVASI // ${prodName.toUpperCase()} — ${state.view === 'front' ? 'ÖN' : 'SIRT'} // KUMAŞ: ${activeColor.name.toUpperCase()}`, 275, canvas.height - 30);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#ded9cf';
    ctx.font = '16px "JetBrains Mono", monospace';
    ctx.fillText('nizamlarbaski.com', canvas.width - 40, canvas.height - 30);
    ctx.restore();

    // 4. İndirme Bağlantısı Tetikle
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    const cleanFileName = `nizamlar-baski-${state.productId}-${state.view}-${activeColor.id}-onizleme.png`;
    a.download = cleanFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    showToast('Önizleme PNG dosyası indirildi! 🎉');
  }

  function init() {
    cacheDom();
    if (!dom.section) return;

    updateMockupBase();
    setupDirectInteraction();
    attachEventListeners();

    if (CFG.samples && CFG.samples.length > 0) {
      const firstSample = CFG.samples[0];
      state.activeSampleId = firstSample.id;
      loadArtworkFromSrc(firstSample.src, `${firstSample.name} (${firstSample.category})`);
    }

    syncSlidersFromTransform();
    updateHistoryButtons();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
