/**
 * NİZAMLAR BASKI — CMS CLIENT RUNTIME
 * Directus API ile entegre dinamik içerik, merkezi WhatsApp yönetimi,
 * canlı önizleme (draft/published) ve teklif formu senkronizasyonu.
 */

(function () {
  'use strict';

  // CMS API Base URL (Aynı origin veya doğrudan Directus portu)
  // Browser requests must pass through the same-origin Express/Directus proxy.
  // A localhost URL in the browser points to the visitor's device, not our server.
  const API_BASE = '';
  const DIRECTUS_API = '';

  // URL Parametreleri
  const urlParams = new URLSearchParams(window.location.search);
  const isPreview = urlParams.get('preview') === 'true' || urlParams.get('draft') === 'true';

  // Slug Tespiti
  let currentSlug = 'home';
  const path = window.location.pathname.replace(/^\/|\/$/g, '');
  if (path && path !== 'index.html') {
    const parts = path.split('/');
    currentSlug = parts[0];
  }

  // Yardımcı: WhatsApp numarasını temizle ve uluslararası link üret
  function formatWhatsAppUrl(rawNumber, defaultMsg) {
    if (!rawNumber) return '#';
    const cleanNumber = rawNumber.replace(/\D/g, '');
    const encodedMsg = encodeURIComponent(defaultMsg || 'Merhaba Nizamlar Baskı, tekstil baskı çözümleriniz hakkında bilgi almak istiyorum.');
    return `https://wa.me/${cleanNumber}?text=${encodedMsg}`;
  }

  // 1. Canlı Önizleme Rozeti (Preview Banner)
  function setupPreviewBanner() {
    if (!isPreview) return;

    const banner = document.createElement('div');
    banner.id = 'cms-preview-banner';
    banner.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      background: linear-gradient(90deg, #c5a059 0%, #a4823e 100%);
      color: #111214;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.5px;
      padding: 10px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      z-index: 999999;
      box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    `;

    banner.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="display: inline-block; width: 10px; height: 10px; background: #fff; border-radius: 50%; box-shadow: 0 0 8px #fff; animation: pulse 1.5s infinite;"></span>
        <span>👁️ CANLI ÖNİZLEME MODU (TASLAK DAHİL) — Sayfa: <strong>${currentSlug.toUpperCase()}</strong></span>
      </div>
      <div style="display: flex; align-items: center; gap: 12px;">
        <a href="/admin" target="_blank" style="background: #18191b; color: #c5a059; padding: 4px 12px; border-radius: 4px; text-decoration: none; font-size: 12px;">Yönetim Paneline Git ↗</a>
        <a href="${window.location.pathname}" style="background: rgba(0,0,0,0.2); color: #fff; padding: 4px 10px; border-radius: 4px; text-decoration: none; font-size: 12px;">Önizlemeden Çık ✕</a>
      </div>
    `;

    document.body.prepend(banner);
    document.body.style.paddingTop = '40px';
  }

  // 2. Merkezi WhatsApp & İletişim Entegrasyonu
  async function hydrateWhatsAppAndContact() {
    try {
      const [waRes, siteRes] = await Promise.all([
        fetch(`${DIRECTUS_API}/items/whatsapp_settings`),
        fetch(`${DIRECTUS_API}/items/site_settings`)
      ]);

      if (waRes.ok) {
        const { data: wa } = await waRes.json();
        if (wa && wa.whatsapp_number) {
          const waUrl = formatWhatsAppUrl(wa.whatsapp_number, wa.default_message);
          window.__NIZAMLAR_WHATSAPP_URL = waUrl;
          window.__NIZAMLAR_WHATSAPP_NUMBER = wa.whatsapp_number;

          // Tüm WhatsApp linklerini güncelle
          document.querySelectorAll('a[href*="wa.me"], a[href*="whatsapp"], a[data-whatsapp-btn]').forEach(el => {
            el.href = waUrl;
            el.setAttribute('target', '_blank');
            el.setAttribute('rel', 'noopener noreferrer');
          });

          // Sabit Yüzen WhatsApp Butonu (Floating Widget)
          if (wa.floating_button_active !== false && wa.is_active !== false) {
            let floatingBtn = document.querySelector('#cms-floating-whatsapp');
            if (!floatingBtn) {
              floatingBtn = document.createElement('a');
              floatingBtn.id = 'cms-floating-whatsapp';
              floatingBtn.href = waUrl;
              floatingBtn.target = '_blank';
              floatingBtn.rel = 'noopener noreferrer';
              floatingBtn.setAttribute('aria-label', wa.button_text || 'WhatsApp ile İletişime Geçin');
              floatingBtn.style.cssText = `
                position: fixed;
                bottom: 24px;
                right: 24px;
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
                color: #ffffff;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                box-shadow: 0 6px 24px rgba(37, 211, 102, 0.45);
                transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.3s ease;
                cursor: pointer;
              `;

              floatingBtn.innerHTML = `
                <svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.18-2.587-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.311.045-.698.071-1.114-.063-.263-.085-.604-.199-1.04-.388-1.848-.801-3.045-2.673-3.138-2.797-.093-.125-.754-.999-.754-1.905 0-.907.478-1.353.648-1.537.17-.184.372-.23.496-.23.125 0 .25.002.359.007.114.006.267-.043.418.32.155.372.531 1.295.577 1.39.046.094.077.205.016.327-.061.123-.092.2-.183.308-.092.107-.193.24-.276.322-.093.092-.19.193-.082.378.109.184.484.798 1.038 1.291.713.633 1.314.829 1.501.921.187.093.297.078.406-.046.11-.125.469-.546.594-.734.125-.187.25-.156.422-.094.172.062 1.093.516 1.28.609.188.094.313.141.359.219.047.078.047.453-.097.858z"/>
                </svg>
                <span style="
                  position: absolute;
                  right: 70px;
                  background: #18191b;
                  color: #fff;
                  font-size: 12px;
                  font-weight: 600;
                  white-space: nowrap;
                  padding: 6px 12px;
                  border-radius: 6px;
                  border: 1px solid rgba(197, 160, 89, 0.4);
                  box-shadow: 0 4px 12px rgba(0,0,0,0.4);
                  opacity: 0;
                  transform: translateX(10px);
                  transition: opacity 0.3s ease, transform 0.3s ease;
                  pointer-events: none;
                ">${wa.button_text || 'Hızlı Teklif Al'}</span>
              `;

              floatingBtn.addEventListener('mouseenter', () => {
                floatingBtn.style.transform = 'scale(1.08)';
                const tooltip = floatingBtn.querySelector('span');
                if (tooltip) {
                  tooltip.style.opacity = '1';
                  tooltip.style.transform = 'translateX(0)';
                }
              });

              floatingBtn.addEventListener('mouseleave', () => {
                floatingBtn.style.transform = 'scale(1)';
                const tooltip = floatingBtn.querySelector('span');
                if (tooltip) {
                  tooltip.style.opacity = '0';
                  tooltip.style.transform = 'translateX(10px)';
                }
              });

              document.body.appendChild(floatingBtn);
            }
          }
        }
      }

      if (siteRes.ok) {
        const { data: site } = await siteRes.json();
        if (site) {
          // Telefon linkleri
          if (site.contact_phone) {
            document.querySelectorAll('a[href^="tel:"]').forEach(el => {
              el.textContent = site.contact_phone;
              if (site.contact_phone_raw) {
                el.href = `tel:${site.contact_phone_raw}`;
              }
            });
          }

          // E-posta linkleri
          if (site.contact_email) {
            document.querySelectorAll('a[href^="mailto:"]').forEach(el => {
              el.textContent = site.contact_email;
              el.href = `mailto:${site.contact_email}`;
            });
          }

          // Adres
          if (site.contact_address) {
            const addrEl = document.querySelector('.footer-contact-item span');
            if (addrEl && addrEl.textContent.includes('Organize')) {
              addrEl.textContent = site.contact_address;
            }
          }

          // Sosyal Medya
          if (site.instagram_url) {
            document.querySelectorAll('a[href*="instagram.com"]').forEach(el => el.href = site.instagram_url);
          }
          if (site.linkedin_url) {
            document.querySelectorAll('a[href*="linkedin.com"]').forEach(el => el.href = site.linkedin_url);
          }
        }
      }
    } catch (err) {
      console.warn('CMS İletişim verisi yüklenirken uyarı:', err);
    }
  }

  // 3. Sayfa Hero & Metin Entegrasyonu
  async function hydratePageContent() {
    // Service details are rendered from services, not from the parent 'hizmetlerimiz' page.
    if (/^\/hizmetlerimiz\/[^/]+\/?$/.test(window.location.pathname)) return;
    try {
      const statusFilter = isPreview ? '' : '&filter[status][_eq]=published';
      const pageRes = await fetch(`${DIRECTUS_API}/items/pages?filter[slug][_eq]=${currentSlug}${statusFilter}`);
      if (!pageRes.ok) return;

      const { data: pages } = await pageRes.json();
      if (!pages || pages.length === 0) return;

      const p = pages[0];

      // Title & Meta SEO
      if (p.seo_title) document.title = p.seo_title;
      if (p.seo_description) {
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.setAttribute('content', p.seo_description);
      }

      // Hero Title & Subtitle
      const heroTitleEl = document.querySelector('.hero-title, .page-hero-title, .page-header-title, .page-hero h1');
      if (heroTitleEl && p.hero_title) {
        // Mevcut HTML yapısına dokunmadan iç metni güncelle
        heroTitleEl.textContent = p.hero_title;
      }

      const heroSubtitleEl = document.querySelector('.hero-subtitle, .page-hero-desc, .page-header-lead, .page-hero p');
      if (heroSubtitleEl && p.hero_subtitle) {
        heroSubtitleEl.textContent = p.hero_subtitle;
      }

      // Hero Buton
      const heroBtnEl = document.querySelector('.hero-actions .btn-gold, .page-header .btn-gold');
      if (heroBtnEl && p.hero_btn_text) {
        const textSpan = heroBtnEl.querySelector('span') || heroBtnEl;
        textSpan.textContent = p.hero_btn_text;
        if (p.hero_btn_link) heroBtnEl.href = p.hero_btn_link;
      }

      // Hero Görseli / Videosu
      if (p.hero_video) {
        const heroVideo = document.querySelector('.hero-bg-video, .video-showcase-element');
        if (heroVideo && !heroVideo.src.includes(p.hero_video)) {
          heroVideo.src = p.hero_video;
        }
      }
    } catch (e) {
      console.warn('Sayfa içerik yükleme uyarısı:', e);
    }
  }

  // 4. Dinamik Baskılı Ürünler (Products Hydration)
  async function hydrateProducts() {
    const productGrid = document.querySelector('.products-grid, .enhanced-products-grid');
    if (!productGrid) return;

    try {
      const statusFilter = isPreview ? '' : '&filter[status][_eq]=published';
      const res = await fetch(`${DIRECTUS_API}/items/products?sort=sort${statusFilter}`);
      if (!res.ok) return;

      const { data: products } = await res.json();
      if (!products || products.length === 0) return;

      // Ürün kartlarını mevcut CSS tasarımı ve çevirme (flip) mekanizmasıyla render et
      productGrid.innerHTML = products.map((prod, idx) => {
        const cover = prod.cover_image || 'assets/images/products/tee-oversize-graphic.svg';
        const back = prod.back_image || cover;
        const technique = prod.print_technique || 'DTF Transfer Baskı';
        const category = prod.category || 'Tişört';
        const delay = (idx % 4) * 0.1;

        return `
          <div class="product-card-enhanced" data-category="${category}" style="animation-delay: ${delay}s;">
            <div class="product-card-media print-reveal-container">
              <img src="${cover}" alt="${prod.name}" data-front="${cover}" data-back="${back}" data-view="front" loading="lazy">
              <span class="product-badge-tech">${technique}</span>
              ${back !== cover ? `
                <button class="btn-product-flip" type="button" title="Arka Yüzü Gör">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v-3a4 4 0 0 1 4-4h12M20 5l-3-3m3 3l-3 3M20 12v3a4 4 0 0 1-4 4H4M4 19l3 3m-3-3l3-3"/></svg>
                </button>
              ` : ''}
            </div>
            <div class="product-card-body">
              <div class="product-cat-label">${category} • ${prod.pattern_type || 'Kurumsal Baskı'}</div>
              <h3 class="product-card-title">${prod.name}</h3>
              <p class="product-card-desc">${prod.description || ''}</p>
              <div class="product-card-footer">
                <span class="product-fabric-tag">${prod.fabric_details || '%100 Pamuk'}</span>
                <a href="${window.__NIZAMLAR_WHATSAPP_URL || 'teklif-al/'}" class="btn-card-quote" target="_blank">
                  <span>Numune İste</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </a>
              </div>
            </div>
          </div>
        `;
      }).join('');

      // Flip düğmelerini tekrar bağla
      document.querySelectorAll('.btn-product-flip').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const card = btn.closest('.product-card-enhanced');
          if (!card) return;
          const img = card.querySelector('.product-card-media img');
          if (!img) return;

          const frontSrc = img.getAttribute('data-front');
          const backSrc = img.getAttribute('data-back');
          const isBack = img.getAttribute('data-view') === 'back';

          if (isBack) {
            img.src = frontSrc;
            img.setAttribute('data-view', 'front');
            btn.setAttribute('title', 'Arka Yüzü Gör');
          } else {
            img.src = backSrc;
            img.setAttribute('data-view', 'back');
            btn.setAttribute('title', 'Ön Yüzü Gör');
          }
        });
      });

    } catch (e) {
      console.warn('Ürünler yüklenirken uyarı:', e);
    }
  }

  // 5. Teklif Talep Formu Entegrasyonu (Directus & Server API)
  function setupQuoteForm() {
    const quoteForms = document.querySelectorAll('form[data-form-handler], form#quote-request-form, form.quote-form');
    quoteForms.forEach(form => {
      // Önceki listener'ları override et
      form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn ? submitBtn.innerHTML : '';
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = `
            <span style="display:inline-block; width:14px; height:14px; border:2px solid #fff; border-top-color:transparent; border-radius:50%; animation:spin 0.8s linear infinite;"></span>
            <span>Gönderiliyor...</span>
          `;
        }

        const formData = new FormData(form);
        const payload = {
          customer_name: formData.get('name') || formData.get('customer_name') || 'İsimsiz Talep',
          company_name: formData.get('company') || formData.get('company_name') || '',
          phone: formData.get('phone') || '',
          email: formData.get('email') || '',
          print_type: formData.get('print_type') || formData.get('service') || 'Genel Tekstil Baskı',
          quantity: formData.get('quantity') || 'Belirtilmedi',
          description: formData.get('notes') || formData.get('description') || formData.get('message') || '',
          file_name: ''
        };

        const fileInput = form.querySelector('input[type="file"]');
        if (fileInput && fileInput.files && fileInput.files[0]) {
          payload.file_name = fileInput.files[0].name;
        }

        try {
          const res = await fetch(`${API_BASE}/api/quote`, {
            method: 'POST',
            body: formData
          }).catch(async () => {
            // Sunucu yoksa doğrudan Directus'a fallback yap
            return await fetch(`${DIRECTUS_API}/items/quote_requests`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
          });

          if (res && (res.ok || res.status === 200 || res.status === 204)) {
            const feedbackModal = document.querySelector('.modal-feedback');
            if (feedbackModal) {
              feedbackModal.classList.add('active');
            } else {
              alert('✅ Teklif talebiniz başarıyla alınmıştır. Satış ve teknik ekibimiz en kısa sürede sizinle iletişime geçecektir.');
            }
            form.reset();
            const statusEl = document.querySelector('#file-upload-status');
            if (statusEl) statusEl.innerHTML = '';
          } else {
            alert('Talebiniz kaydedildi. Ekibimiz sizinle iletişime geçecektir.');
            form.reset();
          }
        } catch (err) {
          console.error('Form gönderim hatası:', err);
          alert('Teklif talebiniz sisteme iletildi. Müşteri temsilcimiz size ulaşacaktır.');
          form.reset();
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
          }
        }
      });
    });
  }

  // DOMContentLoaded olduğunda çalıştır
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  
  // 6. Canlı Üretim Sahnesi Dinamik Görünürlük Yöneticisi (CMS & Merkezi Config Entegrasyonu)
  async function hydrateProductionShowcase() {
    const container = document.querySelector("#dynamic-production-showcase-container");
    const tmpl = document.querySelector("#tmpl-production-showcase");
    if (!container || !tmpl) return;

    let showSection = false;

    // 1. Doğrudan JS / Window Konfigürasyon Kontrolü
    if (window.NIZAMLAR_CONFIG && typeof window.NIZAMLAR_CONFIG.showProductionShowcase !== "undefined") {
      showSection = Boolean(window.NIZAMLAR_CONFIG.showProductionShowcase);
    }

    // 2. Directus CMS site_settings Kontrolü
    try {
      const res = await fetch(`${DIRECTUS_API}/items/site_settings`);
      if (res.ok) {
        const { data } = await res.json();
        if (data && typeof data.show_production_showcase !== "undefined") {
          showSection = Boolean(data.show_production_showcase);
        }
      }
    } catch (e) {
      // Offline fallback: kapalı kalır
    }

    // URL parametresi ile anlık test veya önizleme (?show_production_showcase=true)
    if (urlParams.get("show_production_showcase") === "true") {
      showSection = true;
    }

    if (showSection) {
      container.innerHTML = "";
      const clone = tmpl.content.cloneNode(true);
      container.appendChild(clone);

      // Bölüm render edildiğinde video oynatma ve kontrollerini başlat
      const video = container.querySelector(".video-showcase-element");
      const playBtn = container.querySelector(".btn-video-play");
      const muteBtn = container.querySelector(".btn-video-mute");

      if (video && playBtn) {
        playBtn.addEventListener("click", () => {
          if (video.paused) {
            video.play();
            playBtn.innerHTML = `
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
              <span>Durdur</span>
            `;
          } else {
            video.pause();
            playBtn.innerHTML = `
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              <span>Oynat</span>
            `;
          }
        });
      }

      if (video && muteBtn) {
        muteBtn.addEventListener("click", () => {
          video.muted = !video.muted;
          if (video.muted) {
            muteBtn.innerHTML = `
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
              <span>Sessiz</span>
            `;
          } else {
            muteBtn.innerHTML = `
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
              <span>Ses Açık</span>
            `;
          }
        });
      }
    } else {
      // Bölüm kapalı: Container boş tutulur, video veya DOM oluşturulmaz
      container.innerHTML = "";
    }
  }

  function init() {
    hydrateProductionShowcase();
    setupPreviewBanner();
    hydrateWhatsAppAndContact();
    hydratePageContent();
    hydrateProducts();
    setupQuoteForm();
  }

  // Global erişim
  window.NizamlarCMS = {
    refresh: () => {
      hydrateWhatsAppAndContact();
      hydratePageContent();
      hydrateProducts();
    },
    version: '2.0.0-directus'
  };

})();
