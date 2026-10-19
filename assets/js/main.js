/**
 * NİZAMLAR BASKI — CORE JAVASCRIPT
 * Header scroll, mobil menü, Before/After Slider,
 * Canlı Baskı Reveal ve İnteraktif Makine Simülasyon Sistemleri
 * (Tarayıcı doğal kaydırma davranışı tam korunmuştur)
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Header Scroll Efekti (Pasif listener - kaydırma akışını etkilemez)
  const siteHeader = document.querySelector('.site-header');
  if (siteHeader) {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        siteHeader.classList.add('header-scrolled');
      } else {
        siteHeader.classList.remove('header-scrolled');
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
  }

  // 2. Mobil Menü Çekmecesi (Drawer)
  const mobileToggle = document.querySelector('.mobile-toggle');
  const mobileDrawer = document.querySelector('.mobile-drawer');
  const mobileBackdrop = document.querySelector('.mobile-backdrop');

  if (mobileToggle && mobileDrawer && mobileBackdrop) {
    const openMenu = () => {
      mobileToggle.classList.add('active');
      mobileDrawer.classList.add('active');
      mobileBackdrop.classList.add('active');
      document.body.style.overflow = 'hidden';
    };

    const closeMenu = () => {
      mobileToggle.classList.remove('active');
      mobileDrawer.classList.remove('active');
      mobileBackdrop.classList.remove('active');
      document.body.style.overflow = '';
    };

    mobileToggle.addEventListener('click', () => {
      if (mobileDrawer.classList.contains('active')) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    mobileBackdrop.addEventListener('click', closeMenu);
  }

  // 3. Aktif Menü Linki İşaretleme
  const currentPath = window.location.pathname.replace(/\/index\.html$/, '/');
  const navLinks = document.querySelectorAll('.nav-link, .dropdown-link, .mobile-nav-link, .mobile-submenu-link');
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;
    const cleanHref = href.replace(/\/index\.html$/, '/');
    if (currentPath === cleanHref || (cleanHref !== '/' && cleanHref !== './' && currentPath.startsWith(cleanHref))) {
      link.classList.add('active');
      const parentDropdown = link.closest('.nav-item');
      if (parentDropdown) {
        parentDropdown.classList.add('active');
      }
    }
  });

  // 4. Doğal ve Anında İçerik Görünümü (Gecikmeli Scroll Reveal Kaldırıldı)
  document.querySelectorAll('[data-reveal]').forEach(el => el.classList.add('is-revealed'));

  // 5. Video Showcase Kontrolleri (Play/Pause & Sound)
  const videoElements = document.querySelectorAll('.video-showcase-element');
  videoElements.forEach(video => {
    const container = video.closest('.video-showcase-frame');
    if (!container) return;

    const playBtn = container.querySelector('.btn-video-play');
    const muteBtn = container.querySelector('.btn-video-mute');

    if (playBtn) {
      playBtn.addEventListener('click', () => {
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

    if (muteBtn) {
      muteBtn.addEventListener('click', () => {
        video.muted = !video.muted;
        muteBtn.innerHTML = video.muted ? `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
          <span>Sessiz</span>
        ` : `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
          <span>Ses Açık</span>
        `;
      });
    }
  });

  // 6. Akordeon (SSS)
  const accordionHeaders = document.querySelectorAll('.accordion-header');
  accordionHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const parent = header.closest('.accordion-item');
      const isAlreadyActive = parent.classList.contains('active');

      const container = parent.closest('.faq-accordion');
      if (container) {
        container.querySelectorAll('.accordion-item').forEach(item => item.classList.remove('active'));
      }

      if (!isAlreadyActive) {
        parent.classList.add('active');
      }
    });
  });

  // 7. BEFORE / AFTER ETKİLEŞİMLİ KARŞILAŞTIRMA SLIDER'I
  const initBeforeAfterSliders = () => {
    const sliders = document.querySelectorAll('.before-after-wrapper');
    sliders.forEach(slider => {
      const overlayWrap = slider.querySelector('.before-after-overlay-wrap');
      const handle = slider.querySelector('.before-after-handle');
      if (!overlayWrap || !handle) return;

      let isDragging = false;

      const setPosition = (clientX) => {
        const rect = slider.getBoundingClientRect();
        let posX = clientX - rect.left;
        if (posX < 0) posX = 0;
        if (posX > rect.width) posX = rect.width;
        const percentage = (posX / rect.width) * 100;

        overlayWrap.style.width = `${percentage}%`;
        handle.style.left = `${percentage}%`;
      };

      // Mouse Olayları
      slider.addEventListener('mousedown', (e) => {
        isDragging = true;
        setPosition(e.clientX);
      });

      window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        setPosition(e.clientX);
      });

      window.addEventListener('mouseup', () => {
        isDragging = false;
      });

      // Dokunmatik (Mobil / Tablet) Olayları
      slider.addEventListener('touchstart', (e) => {
        isDragging = true;
        if (e.touches && e.touches[0]) {
          setPosition(e.touches[0].clientX);
        }
      }, { passive: true });

      window.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        if (e.touches && e.touches[0]) {
          setPosition(e.touches[0].clientX);
        }
      }, { passive: true });

      window.addEventListener('touchend', () => {
        isDragging = false;
      });
    });
  };
  initBeforeAfterSliders();

  // 8. BASKI REVEAL ANİMASYON TETİKLEYİCİSİ (Laser / Squeegee Wipe)
  const initPrintRevealCards = () => {
    const revealCards = document.querySelectorAll('.print-reveal-container');
    revealCards.forEach(card => {
      const triggerAnim = () => {
        if (card.classList.contains('animating')) return;
        card.classList.add('animating');
        setTimeout(() => {
          card.classList.remove('animating');
        }, 3200);
      };

      card.addEventListener('mouseenter', triggerAnim);
      card.addEventListener('click', triggerAnim);
    });
  };
  initPrintRevealCards();

  // 9. ETKİLEŞİMLİ MAKİNE ÜRETİM SİMÜLASYONU
  const initMachineSimulators = () => {
    const simBoxes = document.querySelectorAll('.machine-simulation-box');
    simBoxes.forEach(sim => {
      const stepBtns = sim.querySelectorAll('.sim-step-btn');
      const stages = sim.querySelectorAll('.sim-stage-content');
      const descElement = sim.querySelector('.sim-step-desc');
      const playBtn = sim.querySelector('.btn-sim-play');

      let currentStep = 0;
      let autoplayInterval = null;
      let isPlaying = true;

      const descriptions = [
        "1. Baskı filmi makineye besleniyor, taşıyıcı PET film vakumlu tablaya kilitleniyor.",
        "2. Çift endüstriyel piezo baskı kafası 1440 DPI hassasiyetle mikro püskürtme yapıyor.",
        "3. CMYK renkli desen ve opak beyaz alt astar katmanı milimetrik senkronla oluşuyor.",
        "4. Yaş boya üzerine otomatik çalkalama ile sıcak transfer tutkal tozu serpiliyor ve fırınlanıyor.",
        "5. Hazırlanan transfer filmi 160°C pnömatik pres altında kumaş liflerine aktarılıyor.",
        "6. Soğuk soyum işlemiyle taşıyıcı film ayrılıyor ve yüksek yıkama dayanımlı baskılı ürün tamamlanıyor."
      ];

      const activateStep = (index) => {
        currentStep = index;
        stepBtns.forEach((btn, idx) => {
          btn.classList.toggle('active', idx === index);
        });
        stages.forEach((st, idx) => {
          st.classList.toggle('active', idx === index);
        });
        if (descElement && descriptions[index]) {
          descElement.innerHTML = `<strong>ADIM 0${index + 1}:</strong> ${descriptions[index]}`;
        }
      };

      stepBtns.forEach((btn, idx) => {
        btn.addEventListener('click', () => {
          activateStep(idx);
          if (autoplayInterval) clearInterval(autoplayInterval);
          if (playBtn) playBtn.textContent = 'Oynat ▶';
          isPlaying = false;
        });
      });

      // Otomatik İlerleme
      const startAutoplay = () => {
        if (autoplayInterval) clearInterval(autoplayInterval);
        autoplayInterval = setInterval(() => {
          let next = (currentStep + 1) % stepBtns.length;
          activateStep(next);
        }, 3500);
      };

      if (playBtn) {
        playBtn.addEventListener('click', () => {
          if (isPlaying) {
            clearInterval(autoplayInterval);
            playBtn.textContent = 'Oynat ▶';
            isPlaying = false;
          } else {
            startAutoplay();
            playBtn.textContent = 'Durdur ⏸';
            isPlaying = true;
          }
        });
      }

      // Intersection Observer ile görünür olduğunda otomatik başlat, ekran dışındayken durdur (Performans)
      if ('IntersectionObserver' in window) {
        const simObserver = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              if (isPlaying && !autoplayInterval) startAutoplay();
            } else {
              if (autoplayInterval) {
                clearInterval(autoplayInterval);
                autoplayInterval = null;
              }
            }
          });
        }, { threshold: 0.2 });
        simObserver.observe(sim);
      } else {
        startAutoplay();
      }
    });
  };
  initMachineSimulators();

  // 10. ÜRÜN ÖN / ARKA GÖRÜNÜM DÖNDÜRME DESTEĞİ
  const initProductViewFlip = () => {
    const flipButtons = document.querySelectorAll('.btn-product-flip');
    flipButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const card = btn.closest('.product-card-enhanced');
        if (!card) return;

        const img = card.querySelector('.product-card-media img');
        if (!img) return;

        const frontSrc = img.getAttribute('data-front');
        const backSrc = img.getAttribute('data-back');
        if (!frontSrc || !backSrc) return;

        const isCurrentlyBack = img.getAttribute('data-view') === 'back';
        if (isCurrentlyBack) {
          img.src = frontSrc;
          img.setAttribute('data-view', 'front');
          btn.setAttribute('title', 'Sırt Baskısını Göster');
        } else {
          img.src = backSrc;
          img.setAttribute('data-view', 'back');
          btn.setAttribute('title', 'Ön Baskıyı Göster');
        }
      });
    });
  };
  initProductViewFlip();

  // 11. Üretim Galerisi Filtreleme & Lightbox
  const filterBtns = document.querySelectorAll('.filter-btn');
  const galleryItems = document.querySelectorAll('.gallery-item');
  const lightboxModal = document.querySelector('.lightbox-modal');
  const lightboxImg = document.querySelector('.lightbox-img');
  const lightboxClose = document.querySelector('.lightbox-close');

  if (filterBtns.length > 0 && galleryItems.length > 0) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filter = btn.getAttribute('data-filter');
        galleryItems.forEach(item => {
          const category = item.getAttribute('data-category');
          if (filter === 'all' || category === filter) {
            item.style.display = 'block';
          } else {
            item.style.display = 'none';
          }
        });
      });
    });
  }

  if (lightboxModal && lightboxImg) {
    galleryItems.forEach(item => {
      item.addEventListener('click', () => {
        const img = item.querySelector('img');
        if (img) {
          lightboxImg.src = img.src;
          lightboxImg.alt = img.alt || 'Nizamlar Baskı Galeri';
          lightboxModal.classList.add('active');
          document.body.style.overflow = 'hidden';
        }
      });
    });

    const closeLightbox = () => {
      lightboxModal.classList.remove('active');
      document.body.style.overflow = '';
    };

    if (lightboxClose) {
      lightboxClose.addEventListener('click', closeLightbox);
    }
    lightboxModal.addEventListener('click', (e) => {
      if (e.target === lightboxModal) closeLightbox();
    });
  }

  // 12. Dosya Yükleme Alanı Önizleme
  const fileInput = document.querySelector('#design-file-input');
  const fileDropzone = document.querySelector('.file-upload-dropzone');
  const fileStatus = document.querySelector('#file-upload-status');

  if (fileInput && fileDropzone && fileStatus) {
    fileDropzone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0];
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        fileStatus.innerHTML = `<strong>Seçilen Dosya:</strong> ${file.name} (${fileSizeMB} MB)`;
        fileStatus.style.color = 'var(--c-gold)';
      }
    });

    ['dragenter', 'dragover'].forEach(evtName => {
      fileDropzone.addEventListener(evtName, (e) => {
        e.preventDefault();
        fileDropzone.style.borderColor = 'var(--c-gold)';
      }, false);
    });

    ['dragleave', 'drop'].forEach(evtName => {
      fileDropzone.addEventListener(evtName, (e) => {
        e.preventDefault();
        fileDropzone.style.borderColor = '';
      }, false);
    });

    fileDropzone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;
      if (files.length > 0) {
        fileInput.files = files;
        const file = files[0];
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        fileStatus.innerHTML = `<strong>Seçilen Dosya:</strong> ${file.name} (${fileSizeMB} MB)`;
        fileStatus.style.color = 'var(--c-gold)';
      }
    });
  }

  // 13. Form Gönderim & Doğrulama (İletişim ve Teklif Al)
  const forms = document.querySelectorAll('form[data-form-handler]');
  const feedbackModal = document.querySelector('.modal-feedback');
  const feedbackCloseBtn = document.querySelector('.modal-feedback-close');

  forms.forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const requiredInputs = form.querySelectorAll('[required]');
      let isValid = true;

      requiredInputs.forEach(input => {
        if (!input.value.trim()) {
          isValid = false;
          input.style.borderColor = '#c53030';
        } else {
          input.style.borderColor = '';
        }
      });

      if (!isValid) {
        alert('Lütfen zorunlu alanları doldurunuz.');
        return;
      }

      if (feedbackModal) {
        feedbackModal.classList.add('active');
        form.reset();
        if (fileStatus) fileStatus.innerHTML = '';
      } else {
        alert('Talebiniz kaydedilmiştir. Müşteri temsilcimiz sizinle iletişime geçecektir.');
        form.reset();
      }
    });
  });

  if (feedbackCloseBtn && feedbackModal) {
    feedbackCloseBtn.addEventListener('click', () => {
      feedbackModal.classList.remove('active');
    });
    feedbackModal.addEventListener('click', (e) => {
      if (e.target === feedbackModal) {
        feedbackModal.classList.remove('active');
      }
    });
  }
});
