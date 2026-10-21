/**
 * NİZAMLAR BASKI — CANLI BASKI ÖNİZLEME MOTORU (INTERACTIVE MOCKUP ENGINE)
 * Kullanıcının kendi tasarım dosyasını yükleyip tişört, sweatshirt, hoodie,
 * pantolon ve çanta üzerinde anlık, sürükle-bırak ölçeklenebilir ve
 * teklif formuna aktarılabilir şekilde önizlemesini sağlar.
 */

(function () {
  'use strict';

  // Konfigürasyon referansı
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
    positionId: 'tam_on',
    image: null, // HTMLImageElement veya null
    imageDataUrl: null, // Base64 veya SVG URL
    imageFileName: null,
    imageFileSize: null,
    activeSampleId: null,
    transform: {
      x: 300,
      y: 330,
      scale: 0.95,
      rotation: 0
    },
    blendMode: 'normal', // 'normal' | 'multiply'
    showGuide: true,
    isDragging: false,
    dragStart: { pointerX: 0, pointerY: 0, initialX: 0, initialY: 0 }
  };

  // DOM Elemanları Önbelleği
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
      
      // Sürgüler & Ayarlar
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
      btnReset: document.querySelector('#btn-reset-adjustments'),
      
      // Viewport / Sahne
      stageFrame: document.querySelector('#mockup-stage-frame'),
      mockupBaseImg: document.querySelector('#mockup-base-img'),
      printableGuide: document.querySelector('#printable-guide-box'),
      guideTag: document.querySelector('#printable-guide-tag'),
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

  // Toast Bildirimi Göster
  function showToast(message, duration = 3000) {
    if (!dom.toast) return;
    dom.toastMsg.textContent = message;
    dom.toast.classList.add('show');
    clearTimeout(dom.toast._timer);
    dom.toast._timer = setTimeout(() => {
      dom.toast.classList.remove('show');
    }, duration);
  }

  // Directus CMS'ten Ayarları Dinamik Olarak Çekme
  async function hydrateFromCMS() {
    try {
      const res = await fetch('/items/mockup_preview_settings');
      if (res.ok) {
        const { data } = await res.json();
        if (data && data.is_active === false && dom.section) {
          dom.section.style.display = 'none';
          return;
        }
        if (data) {
          if (data.section_tag && dom.sectionTag) dom.sectionTag.innerHTML = `<span class="live-dot"></span> ${data.section_tag}`;
          if (data.section_title && dom.sectionTitle) dom.sectionTitle.textContent = data.section_title;
          if (data.section_desc && dom.sectionDesc) dom.sectionDesc.textContent = data.section_desc;
        }
      }
    } catch (e) {
      // Offline fallback
    }
  }

  // Seçili Ürün, Görünüm ve Renge Göre Sahne Mockup'ını Güncelle
  function updateMockupBase() {
    const p = CFG.products[state.productId];
    if (!p) return;

    // Görünüm geçerli mi?
    if (!p.supportedViews.includes(state.view)) {
      state.view = p.defaultView;
    }

    // Renk geçerli mi?
    const validColor = p.supportedColors.find(c => c.id === state.colorId);
    if (!validColor) {
      state.colorId = p.defaultColor;
    }

    const currentViewConfig = p.views[state.view];
    if (!currentViewConfig) return;

    // Mockup Görsel URL'i
    const mockupSrc = currentViewConfig.mockups[state.colorId] || currentViewConfig.mockups[p.defaultColor];
    if (dom.mockupBaseImg && dom.mockupBaseImg.getAttribute('src') !== mockupSrc) {
      dom.mockupBaseImg.style.opacity = '0.3';
      dom.mockupBaseImg.src = mockupSrc;
      dom.mockupBaseImg.onload = () => {
        dom.mockupBaseImg.style.opacity = '1';
      };
    }

    // Rozetleri güncelle
    if (dom.badgeProductName) dom.badgeProductName.textContent = p.name;
    if (dom.badgeSpec) dom.badgeSpec.textContent = p.spec;
    if (dom.badgeView) dom.badgeView.textContent = currentViewConfig.label;

    // Kılavuz Çerçevesini Güncelle
    updatePrintableGuide();

    // Görünüm Düğmelerini Göster / Gizle
    updateViewToggles(p);

    // Renk Düğmelerini Güncelle
    updateColorSwatches(p);

    // Konum Düğmelerini Güncelle
    updatePlacementPills(currentViewConfig);
  }

  // Baskı Kılavuz Çerçevesi (Printable Area Guide) Güncelle
  function updatePrintableGuide() {
    const p = CFG.products[state.productId];
    if (!p) return;
    const currentViewConfig = p.views[state.view];
    if (!currentViewConfig || !currentViewConfig.printableArea) return;

    const area = currentViewConfig.printableArea;
    const stageWidth = CFG.canvas.width;
    const stageHeight = CFG.canvas.height;

    const leftPct = (area.x / stageWidth) * 100;
    const topPct = (area.y / stageHeight) * 100;
    const widthPct = (area.width / stageWidth) * 100;
    const heightPct = (area.height / stageHeight) * 100;

    if (dom.printableGuide) {
      dom.printableGuide.style.left = `${leftPct}%`;
      dom.printableGuide.style.top = `${topPct}%`;
      dom.printableGuide.style.width = `${widthPct}%`;
      dom.printableGuide.style.height = `${heightPct}%`;
      dom.printableGuide.classList.toggle('guide-hidden', !state.showGuide);
    }

    if (dom.guideTag) {
      dom.guideTag.textContent = area.label || 'Baskı Alanı';
    }
  }

  // Görünüm Düğmelerini Güncelle (Ön / Sırt)
  function updateViewToggles(product) {
    if (!dom.viewToggleWrap) return;
    if (product.supportedViews.length <= 1) {
      dom.viewToggleWrap.style.display = 'none';
      return;
    }
    dom.viewToggleWrap.style.display = 'inline-flex';
    dom.btnViewToggles.forEach(btn => {
      const v = btn.getAttribute('data-view');
      btn.classList.toggle('active', v === state.view);
    });
  }

  // Kumaş Rengi Seçici Düğmelerini Güncelle
  function updateColorSwatches(product) {
    if (!dom.colorSwatchesWrap) return;
    dom.colorSwatchesWrap.innerHTML = '';

    product.supportedColors.forEach(c => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `color-swatch-btn ${c.id === state.colorId ? 'active' : ''}`;
      btn.style.backgroundColor = c.hex;
      btn.title = c.name;
      btn.setAttribute('aria-label', c.name);

      btn.addEventListener('click', () => {
        state.colorId = c.id;
        dom.colorSwatchesWrap.querySelectorAll('.color-swatch-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        updateMockupBase();
        showToast(`${product.name} rengi: ${c.name}`);
      });

      dom.colorSwatchesWrap.appendChild(btn);
    });
  }

  // Baskı Konumları Hızlı Seçici Hap Butonlarını Güncelle
  function updatePlacementPills(viewConfig) {
    if (!dom.placementPillsRow) return;
    dom.placementPillsRow.innerHTML = '';

    const positions = viewConfig.positions;
    if (!positions) return;

    // Eğer mevcut pozisyon yeni görünümde yoksa ilkini seç
    if (!positions[state.positionId]) {
      state.positionId = viewConfig.defaultPosition || Object.keys(positions)[0];
    }

    Object.values(positions).forEach(pos => {
      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = `placement-pill ${pos.id === state.positionId ? 'active' : ''}`;
      pill.innerHTML = `<span>${pos.name}</span> <small style="display:block; font-size:0.65rem; color:inherit; opacity:0.7;">${pos.desc}</small>`;

      pill.addEventListener('click', () => {
        applyPlacementPreset(pos);
        dom.placementPillsRow.querySelectorAll('.placement-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        showToast(`Konum seçildi: ${pos.name}`);
      });

      dom.placementPillsRow.appendChild(pill);
    });
  }

  // Hazır Konum Parametrelerini Uygula
  function applyPlacementPreset(pos) {
    state.positionId = pos.id;
    state.transform.x = pos.x;
    state.transform.y = pos.y;
    state.transform.scale = pos.scale;
    state.transform.rotation = pos.rotation || 0;

    syncSlidersFromTransform();
    renderArtwork();
  }

  // Tasarım Katmanını Sahne Üzerinde Çiz / Güncelle
  function renderArtwork() {
    if (!dom.artworkLayer || !dom.artworkImg) return;

    if (!state.image) {
      dom.artworkLayer.style.display = 'none';
      if (dom.emptyPrompt) dom.emptyPrompt.style.display = 'block';
      return;
    }

    dom.artworkLayer.style.display = 'flex';
    if (dom.emptyPrompt) dom.emptyPrompt.style.display = 'none';

    // 600x680 sahne koordinatına göre yüzde hesaplama
    const stageW = CFG.canvas.width;
    const stageH = CFG.canvas.height;

    const leftPct = (state.transform.x / stageW) * 100;
    const topPct = (state.transform.y / stageH) * 100;

    // Base genişlik: görselin doğal oranına göre yaklaşık 220px referans
    const baseWidthPx = 220;
    const actualWidthPx = baseWidthPx * state.transform.scale;

    dom.artworkLayer.style.left = `${leftPct}%`;
    dom.artworkLayer.style.top = `${topPct}%`;
    dom.artworkLayer.style.width = `${actualWidthPx}px`;
    dom.artworkLayer.style.transform = `translate(-50%, -50%) rotate(${state.transform.rotation}deg)`;

    // Blend Mode sınıfı
    dom.artworkLayer.className = `user-artwork-layer blend-${state.blendMode}`;
    if (state.isDragging) dom.artworkLayer.classList.add('is-dragging');
  }

  // Sürgü Değerlerini State'ten Güncelle
  function syncSlidersFromTransform() {
    if (dom.sliderScale) {
      dom.sliderScale.value = Math.round(state.transform.scale * 100);
      if (dom.valScale) dom.valScale.textContent = `%${dom.sliderScale.value}`;
    }
    if (dom.sliderRotate) {
      dom.sliderRotate.value = state.transform.rotation;
      if (dom.valRotate) dom.valRotate.textContent = `${state.transform.rotation}°`;
    }
    if (dom.sliderX) {
      // 300 merkez, offset -150..+150
      const offsetX = Math.round(state.transform.x - 300);
      dom.sliderX.value = offsetX;
      if (dom.valX) dom.valX.textContent = `${offsetX > 0 ? '+' : ''}${offsetX}px`;
    }
    if (dom.sliderY) {
      // 340 merkez, offset -180..+180
      const offsetY = Math.round(state.transform.y - 340);
      dom.sliderY.value = offsetY;
      if (dom.valY) dom.valY.textContent = `${offsetY > 0 ? '+' : ''}${offsetY}px`;
    }
  }

  // Kullanıcı Dosyası Yükleme İşlemi (File / Blob)
  function handleFileUpload(file) {
    if (!file) return;

    // Format doğrulaması
    const validExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.svg'];
    const fileName = file.name.toLowerCase();
    const isValidExt = validExtensions.some(ext => fileName.endsWith(ext));

    if (!isValidExt) {
      alert('Desteklenmeyen dosya formatı. Lütfen PNG, JPG, JPEG, WEBP veya SVG yükleyiniz.');
      return;
    }

    // Boyut doğrulaması (Maks. 25 MB)
    const maxBytes = (CFG.section.maxSizeMB || 25) * 1024 * 1024;
    if (file.size > maxBytes) {
      alert(`Dosya boyutu çok yüksek. Lütfen ${CFG.section.maxSizeMB || 25} MB altında bir dosya yükleyiniz.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      loadArtworkFromSrc(e.target.result, file.name, (file.size / (1024 * 1024)).toFixed(2) + ' MB');
      showToast('Tasarımınız başarıyla yüklendi! Üzerinde sürükleyerek dilediğiniz gibi konumlandırabilirsiniz.');
    };
    reader.onerror = () => {
      alert('Dosya okunurken bir hata oluştu.');
    };
    reader.readAsDataURL(file);
  }

  // Görsel Kaynağından Yükleme (DataURL veya SVG yolu)
  function loadArtworkFromSrc(src, name = 'Özel Tasarım Dosyası', sizeText = '') {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      state.image = img;
      state.imageDataUrl = src;
      state.imageFileName = name;
      state.imageFileSize = sizeText;

      if (dom.artworkImg) {
        dom.artworkImg.src = src;
        dom.artworkImg.alt = name;
      }

      // Dosya bilgi çubuğunu göster
      if (dom.activeFileBar) {
        dom.activeFileBar.style.display = 'flex';
        if (dom.activeFileName) dom.activeFileName.textContent = name;
        if (dom.activeFileSize) dom.activeFileSize.textContent = sizeText ? `(${sizeText})` : '';
        if (dom.activeFileThumb) dom.activeFileThumb.src = src;
      }

      renderArtwork();
    };
    img.src = src;
  }

  // Tasarım Dosyasını Kaldırma
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

  // Doğrudan Sahne Üzerinde Fare & Dokunmatik Sürükleme (Drag & Move)
  function setupDirectInteraction() {
    if (!dom.artworkLayer || !dom.stageFrame) return;

    const onPointerDown = (e) => {
      if (!state.image) return;
      e.preventDefault();
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

      // Yeni koordinatlar (600x680 alanı içinde sınırla)
      let newX = Math.round(state.dragStart.initialX + deltaX);
      let newY = Math.round(state.dragStart.initialY + deltaY);

      newX = Math.max(80, Math.min(520, newX));
      newY = Math.max(80, Math.min(600, newY));

      state.transform.x = newX;
      state.transform.y = newY;

      syncSlidersFromTransform();
      renderArtwork();
    };

    const onPointerUp = () => {
      if (!state.isDragging) return;
      state.isDragging = false;
      dom.artworkLayer.classList.remove('is-dragging');

      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };

    dom.artworkLayer.addEventListener('pointerdown', onPointerDown);

    // Mouse Wheel ile Hızlı Boyutlandırma (Görsel üzerindeyken)
    dom.artworkLayer.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.05 : 0.05;
      let newScale = state.transform.scale + delta;
      newScale = Math.max(0.2, Math.min(2.0, parseFloat(newScale.toFixed(2))));
      state.transform.scale = newScale;
      syncSlidersFromTransform();
      renderArtwork();
    }, { passive: false });
  }

  // Olay Dinleyicileri (Event Listeners)
  function attachEventListeners() {
    // 1. Dropzone Olayları
    if (dom.dropzone && dom.fileInput) {
      dom.dropzone.addEventListener('click', () => dom.fileInput.click());

      dom.fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
          handleFileUpload(e.target.files[0]);
        }
      });

      ['dragenter', 'dragover'].forEach(name => {
        dom.dropzone.addEventListener(name, (e) => {
          e.preventDefault();
          dom.dropzone.classList.add('dragover');
        });
      });

      ['dragleave', 'drop'].forEach(name => {
        dom.dropzone.addEventListener(name, (e) => {
          e.preventDefault();
          dom.dropzone.classList.remove('dragover');
        });
      });

      dom.dropzone.addEventListener('drop', (e) => {
        if (e.dataTransfer && e.dataTransfer.files.length > 0) {
          handleFileUpload(e.dataTransfer.files[0]);
        }
      });
    }

    if (dom.btnRemoveFile) {
      dom.btnRemoveFile.addEventListener('click', (e) => {
        e.stopPropagation();
        removeArtwork();
      });
    }

    // 2. Örnek Tasarım Butonları
    if (dom.sampleButtonsRow) {
      CFG.samples.forEach(sample => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn-sample-pick';
        btn.innerHTML = `<span>★</span> ${sample.name}`;
        btn.title = sample.category;

        btn.addEventListener('click', () => {
          state.activeSampleId = sample.id;
          dom.sampleButtonsRow.querySelectorAll('.btn-sample-pick').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');

          loadArtworkFromSrc(sample.src, `${sample.name} (${sample.category})`);
          if (sample.defaultScale) {
            state.transform.scale = sample.defaultScale;
            syncSlidersFromTransform();
          }
          showToast(`Örnek tasarım seçildi: ${sample.name}`);
        });

        dom.sampleButtonsRow.appendChild(btn);
      });
    }

    // 3. Ürün Kartları Seçimi
    dom.productCards.forEach(card => {
      card.addEventListener('click', () => {
        const pid = card.getAttribute('data-product');
        if (pid && CFG.products[pid]) {
          state.productId = pid;
          dom.productCards.forEach(c => c.classList.remove('active'));
          card.classList.add('active');

          // Ürünün varsayılan görünümünü al
          state.view = CFG.products[pid].defaultView || 'front';
          state.colorId = CFG.products[pid].defaultColor || 'anthracite';

          updateMockupBase();
          showToast(`Ürün seçildi: ${CFG.products[pid].name}`);
        }
      });
    });

    // 4. Ön / Sırt Görünüm Seçimi
    dom.btnViewToggles.forEach(btn => {
      btn.addEventListener('click', () => {
        const v = btn.getAttribute('data-view');
        if (v && v !== state.view) {
          state.view = v;
          dom.btnViewToggles.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          updateMockupBase();
          showToast(`Görünüm: ${v === 'front' ? 'Ön' : 'Sırt'}`);
        }
      });
    });

    // 5. Sürgü Ayarları
    if (dom.sliderScale) {
      dom.sliderScale.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        state.transform.scale = parseFloat((val / 100).toFixed(2));
        if (dom.valScale) dom.valScale.textContent = `%${val}`;
        renderArtwork();
      });
    }

    if (dom.sliderRotate) {
      dom.sliderRotate.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        state.transform.rotation = val;
        if (dom.valRotate) dom.valRotate.textContent = `${val}°`;
        renderArtwork();
      });
    }

    if (dom.sliderX) {
      dom.sliderX.addEventListener('input', (e) => {
        const offset = parseInt(e.target.value, 10);
        state.transform.x = 300 + offset;
        if (dom.valX) dom.valX.textContent = `${offset > 0 ? '+' : ''}${offset}px`;
        renderArtwork();
      });
    }

    if (dom.sliderY) {
      dom.sliderY.addEventListener('input', (e) => {
        const offset = parseInt(e.target.value, 10);
        state.transform.y = 340 + offset;
        if (dom.valY) dom.valY.textContent = `${offset > 0 ? '+' : ''}${offset}px`;
        renderArtwork();
      });
    }

    // 6. Efekt / Blend Mode Düğmeleri
    if (dom.btnBlendNormal && dom.btnBlendMultiply) {
      dom.btnBlendNormal.addEventListener('click', () => {
        state.blendMode = 'normal';
        dom.btnBlendNormal.classList.add('active');
        dom.btnBlendMultiply.classList.remove('active');
        renderArtwork();
        showToast('Baskı efekti: DTF Canlı Parlak');
      });

      dom.btnBlendMultiply.addEventListener('click', () => {
        state.blendMode = 'multiply';
        dom.btnBlendMultiply.classList.add('active');
        dom.btnBlendNormal.classList.remove('active');
        renderArtwork();
        showToast('Baskı efekti: Su Bazlı Doğal Tuşe');
      });
    }

    // 7. Sıfırla Düğmeleri
    const handleReset = () => {
      const p = CFG.products[state.productId];
      if (!p) return;
      const currentViewConfig = p.views[state.view];
      if (!currentViewConfig) return;

      const pos = currentViewConfig.positions[state.positionId] || Object.values(currentViewConfig.positions)[0];
      if (pos) {
        applyPlacementPreset(pos);
      } else {
        state.transform = { x: 300, y: 330, scale: 0.95, rotation: 0 };
        syncSlidersFromTransform();
        renderArtwork();
      }
      showToast('Konum ve ebatlar varsayılana sıfırlandı.');
    };

    if (dom.btnReset) dom.btnReset.addEventListener('click', handleReset);
    if (dom.btnStageReset) dom.btnStageReset.addEventListener('click', handleReset);

    // 8. Kılavuz Çizgisini Göster / Gizle
    if (dom.btnToggleGuide) {
      dom.btnToggleGuide.addEventListener('click', () => {
        state.showGuide = !state.showGuide;
        dom.btnToggleGuide.classList.toggle('active', state.showGuide);
        if (dom.printableGuide) dom.printableGuide.classList.toggle('guide-hidden', !state.showGuide);
        showToast(`Baskı kılavuzu: ${state.showGuide ? 'Açık' : 'Kapalı'}`);
      });
    }

    // 9. "Bu Tasarımla Teklif İste" CTA Entegrasyonu
    if (dom.btnQuote) {
      dom.btnQuote.addEventListener('click', (e) => {
        e.preventDefault();

        const p = CFG.products[state.productId];
        const vConfig = p.views[state.view];
        const posObj = vConfig && vConfig.positions ? vConfig.positions[state.positionId] : null;

        const previewData = {
          productId: state.productId,
          productName: p ? p.name : 'Tişört',
          view: state.view === 'front' ? 'Ön' : 'Sırt',
          colorName: (p.supportedColors.find(c => c.id === state.colorId) || {}).name || 'Antrasit Siyah',
          positionName: posObj ? posObj.name : 'Merkez Baskı',
          positionDesc: posObj ? posObj.desc : '',
          scalePercent: Math.round(state.transform.scale * 100),
          rotationDeg: state.transform.rotation,
          fileName: state.imageFileName || (state.image ? 'Örnek Tasarım' : 'Görsel Yüklenmedi'),
          hasCustomImage: !!state.image,
          imageDataUrl: state.imageDataUrl, // DataURL formatında teklif sayfasına aktarılır
          timestamp: Date.now()
        };

        // SessionStorage'a kaydet
        try {
          sessionStorage.setItem('nizamlar_custom_preview', JSON.stringify(previewData));
        } catch (err) {
          console.warn('SessionStorage kayıt uyarısı:', err);
        }

        // Teklif sayfasına yönlendir
        window.location.href = 'teklif-al/';
      });
    }

    // 10. "Önizlemeyi İndir (PNG)" Canvas Birleştirme Motoru
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

    // 11. "Önizlemeyi Paylaş" Düğmesi
    if (dom.btnShare) {
      dom.btnShare.addEventListener('click', () => {
        const shareUrl = `${window.location.origin}${window.location.pathname}#onizleme-${state.productId}-${state.view}`;
        if (navigator.clipboard) {
          navigator.clipboard.writeText(shareUrl).then(() => {
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

      // 600x680 -> 1200x1360 (2x Çarpan)
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
    ctx.fillStyle = 'rgba(18, 19, 21, 0.75)';
    ctx.fillRect(0, canvas.height - 70, canvas.width, 70);

    ctx.font = '600 24px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#f3efe7';
    ctx.fillText('NİZAMLAR BASKI', 40, canvas.height - 28);

    ctx.font = '500 18px "JetBrains Mono", monospace';
    ctx.fillStyle = '#b29460';
    const prodName = (CFG.products[state.productId] || {}).name || 'Tekstil';
    ctx.fillText(`CANLI BASKI PROVASI // ${prodName.toUpperCase()} — ${state.view === 'front' ? 'ÖN' : 'SIRT'} GÖRÜNÜM`, 300, canvas.height - 28);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#ded9cf';
    ctx.font = '16px "JetBrains Mono", monospace';
    ctx.fillText('nizamlarbaski.com', canvas.width - 40, canvas.height - 28);
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

  // Başlangıç Yükleme (Init)
  function init() {
    cacheDom();
    if (!dom.section) return;

    hydrateFromCMS();
    updateMockupBase();
    setupDirectInteraction();
    attachEventListeners();

    // İlk açılışta kullanıcının anında görebilmesi için ilk örnek tasarımı hazır yüklü başlat
    if (CFG.samples && CFG.samples.length > 0) {
      const firstSample = CFG.samples[0];
      state.activeSampleId = firstSample.id;
      loadArtworkFromSrc(firstSample.src, `${firstSample.name} (${firstSample.category})`);
    }

    syncSlidersFromTransform();
  }

  // DOMContentLoaded Kontrolü
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
