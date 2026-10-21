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
    colorId: 'anthracite',
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
      sampleButtonsRow: document.querySelector('#sample-buttons-row'),

      // Ürün & Seçenekler
      productCards: document.querySelectorAll('.product-pick-card'),
      viewToggleWrap: document.querySelector('#view-toggle-wrap'),
      btnViewToggles: document.querySelectorAll('.btn-view-toggle'),
      colorSwatchesWrap: document.querySelector('#color-swatches-wrap'),
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

  // Taban Mockup Görselini Güncelle
  function updateMockupBase() {
    const prod = getCurrentProductConfig();
    const viewCfg = getCurrentViewConfig();
    if (!viewCfg) return;

    let imgSrc = viewCfg.mockups[state.colorId] || Object.values(viewCfg.mockups)[0];
    if (dom.mockupBaseImg) {
      dom.mockupBaseImg.src = imgSrc;
      dom.mockupBaseImg.alt = `${prod.name} ${viewCfg.label} - Nizamlar Baskı`;
    }

    // Üst Rozetleri Güncelle
    if (dom.badgeProductName) dom.badgeProductName.textContent = prod.name;
    if (dom.badgeSpec) dom.badgeSpec.textContent = prod.spec;
    if (dom.badgeView) dom.badgeView.textContent = viewCfg.label;

    // Baskı Kılavuz Alanını Konumlandır
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

  // Renk Dairelerini Oluştur
  function renderColorSwatches() {
    if (!dom.colorSwatchesWrap) return;
    const prod = getCurrentProductConfig();
    dom.colorSwatchesWrap.innerHTML = '';

    prod.supportedColors.forEach(c => {
      const swatch = document.createElement('button');
      swatch.type = 'button';
      swatch.className = `color-swatch-item ${c.id === state.colorId ? 'active' : ''}`;
      swatch.title = c.name;
      swatch.setAttribute('aria-label', `${c.name} Renk`);
      swatch.style.backgroundColor = c.hex;

      if (c.hex.toLowerCase() === '#f3efe7' || c.hex.toLowerCase() === '#ded9cf') {
        swatch.classList.add('is-light');
      }

      swatch.addEventListener('click', () => {
        state.colorId = c.id;
        dom.colorSwatchesWrap.querySelectorAll('.color-swatch-item').forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
        updateMockupBase();
        showToast(`Kumaş rengi: ${c.name}`);
      });

      dom.colorSwatchesWrap.appendChild(swatch);
    });
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

    // 220px taban referans genişlik
    const baseWidthPx = 220;
    const actualWidthPx = Math.round(baseWidthPx * state.transform.scale);

    dom.artworkLayer.style.left = `${leftPct}%`;
    dom.artworkLayer.style.top = `${topPct}%`;
    dom.artworkLayer.style.width = `${actualWidthPx}px`;
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
      const deltaX = e.clientX - state.dragStart.pointerX;
      const deltaY = e.clientY - state.dragStart.pointerY;

      // Tutamaç yönüne göre ölçek delta faktörü
      let delta = 0;
      if (state.resizeCorner === 'se' || state.resizeCorner === 'ne') {
        delta = deltaX / 140;
      } else {
        delta = -deltaX / 140;
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
        state.colorId = pCfg.defaultColor || 'anthracite';

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
        const colorObj = prod.supportedColors.find(c => c.id === state.colorId) || { name: state.colorId };

        const previewData = {
          product_name: prod.name,
          product_category: prod.category,
          product_color: colorObj.name,
          view_angle: viewCfg.label,
          transform: { ...state.transform },
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

    // 1. Mockup Arka Plan Görselini Yükle ve Çiz
    const baseImg = new Image();
    baseImg.crossOrigin = 'anonymous';
    await new Promise((resolve, reject) => {
      baseImg.onload = resolve;
      baseImg.onerror = reject;
      baseImg.src = dom.mockupBaseImg.src;
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
    ctx.fillStyle = 'rgba(18, 19, 21, 0.85)';
    ctx.fillRect(0, canvas.height - 74, canvas.width, 74);

    ctx.font = '700 24px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#f3efe7';
    ctx.fillText('NİZAMLAR BASKI', 40, canvas.height - 30);

    ctx.font = '600 17px "JetBrains Mono", monospace';
    ctx.fillStyle = '#b29460';
    const prodName = getCurrentProductConfig().name || 'Tekstil';
    ctx.fillText(`CANLI BASKI PROVASI // ${prodName.toUpperCase()} — ${state.view === 'front' ? 'ÖN' : 'SIRT'} GÖRÜNÜM`, 290, canvas.height - 30);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#ded9cf';
    ctx.font = '16px "JetBrains Mono", monospace';
    ctx.fillText('nizamlarbaski.com', canvas.width - 40, canvas.height - 30);
    ctx.restore();

    // 4. İndirme Bağlantısı Tetikle
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    const cleanFileName = `nizamlar-baski-${state.productId}-${state.view}-onizleme.png`;
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
