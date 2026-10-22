/**
 * NİZAMLAR BASKI — CENTRALIZED NAVBAR & HEADER SYSTEM
 * Tüm sayfalarda (%100 tutarlı) Header, Navigasyon, Dropdownlar,
 * Mobil Çekmece ve Canlı Önizleme bağlantısını dinamik ve kusursuz yönetir.
 */

(function () {
  'use strict';

  // Sayfa dizin derinliğini tespit et (Örn: '/' -> 0, '/galeri/' -> 1, '/hizmetlerimiz/dtf-baski/' -> 2)
  function getDepthPrefix() {
    const p = window.location.pathname.replace(/^\/|\/$/g, '');
    if (!p || p === 'index.html') return '';
    const parts = p.split('/').filter(x => x && x !== 'index.html');
    return '../'.repeat(parts.length);
  }

  const prefix = getDepthPrefix();
  const currentPath = window.location.pathname.replace(/\/index\.html$/, '/');

  // Merkezi URL Yardımcı Fonksiyonu
  window.getServiceUrl = function (slug) {
    if (!slug) return prefix ? `${prefix}hizmetlerimiz/` : '/hizmetlerimiz/';
    return `${prefix ? prefix : '/'}hizmetlerimiz/${encodeURIComponent(slug)}/`;
  };

  // Menü Veri Modeli (Tek Merkezden Yönetim)
  const NAV_CONFIG = [
    { label: 'Ana Sayfa', href: prefix ? prefix : './', id: 'home' },
    {
      label: 'Kurumsal',
      href: `${prefix}hakkimizda/`,
      id: 'kurumsal',
      dropdown: [
        { label: 'Hakkımızda', href: `${prefix}hakkimizda/` },
        { label: 'Sürdürülebilirlik', href: `${prefix}surdurulebilirlik/` },
        { label: 'Sertifikalarımız', href: `${prefix}sertifikalarimiz/` }
      ]
    },
    {
      label: 'Hizmetlerimiz',
      href: `${prefix}hizmetlerimiz/`,
      id: 'hizmetler',
      dropdown: [
        { label: 'Tüm Hizmetler', href: `${prefix}hizmetlerimiz/` },
        { label: 'DTF Baskı', href: `${prefix}hizmetlerimiz/dtf-baski/`, tag: 'Popüler' },
        { label: 'Emprime Baskı', href: `${prefix}hizmetlerimiz/emprime-baski/` },
        { label: 'Tişört Baskı', href: `${prefix}hizmetlerimiz/tisort-baski/` },
        { label: 'Konfeksiyon Parça Baskı', href: `${prefix}hizmetlerimiz/emprime-parca-baski/` }
      ]
    },
    {
      label: 'Üretim',
      href: `${prefix}uretim-surecleri/`,
      id: 'uretim',
      dropdown: [
        { label: 'Üretim Süreçleri', href: `${prefix}uretim-surecleri/` },
        { label: 'Makine Parkurumuz', href: `${prefix}makine-parkurumuz/` }
      ]
    },
    { label: 'Galeri', href: `${prefix}galeri/`, id: 'galeri' },
    { label: 'Referanslar', href: `${prefix}referanslarimiz/`, id: 'referanslar' },
    { label: 'Blog', href: `${prefix}blog/`, id: 'blog' },
    { label: 'İletişim', href: `${prefix}iletisim/`, id: 'iletisim' }
  ];

  function renderNavbar() {
    const siteHeader = document.querySelector('.site-header');
    if (!siteHeader) return;

    // Header HTML Şablonunu İnşa Et
    const headerContainer = siteHeader.querySelector('.header-container');
    if (!headerContainer) return;

    let navMenuHtml = '';
    NAV_CONFIG.forEach(item => {
      const isDropdown = item.dropdown && item.dropdown.length > 0;

      // Aktiflik Tespiti
      let isActive = false;
      if (item.id === 'home') {
        isActive = (currentPath === '/' || currentPath.endsWith('/index.html') || currentPath === '');
      } else {
        const itemClean = item.href.replace(/^\.\.\/|^\.\//, '').replace(/\/$/, '');
        if (itemClean && currentPath.includes(itemClean)) {
          isActive = true;
        }
      }

      navMenuHtml += `
        <div class="nav-item ${isActive ? 'active' : ''}">
          <a href="${item.href}" class="nav-link ${isActive ? 'active' : ''}">
            ${item.label}
            ${isDropdown ? '<svg class="nav-chevron" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z"/></svg>' : ''}
          </a>
          ${isDropdown ? `
            <ul class="dropdown-menu">
              ${item.dropdown.map(sub => {
                const isSubActive = currentPath.includes(sub.href.replace(/^\.\.\/|^\.\//, '').replace(/\/$/, ''));
                return `
                  <li class="dropdown-item">
                    <a href="${sub.href}" class="dropdown-link ${isSubActive ? 'active' : ''}">${sub.label}${sub.tag ? ` <span class="dropdown-tag">${sub.tag}</span>` : ''}</a>
                  </li>
                `;
              }).join('')}
            </ul>
          ` : ''}
        </div>
      `;
    });

    headerContainer.innerHTML = `
      <a href="${prefix ? prefix : './'}" class="header-logo" aria-label="Nizamlar Baskı Anasayfa">
        <img src="${prefix}assets/images/logo-light.svg" alt="Nizamlar Baskı Logo" width="220" height="42">
      </a>

      <nav class="nav-menu" aria-label="Ana Menü">
        ${navMenuHtml}
      </nav>

      <div class="header-actions">
        <a href="${prefix}teklif-al/" class="btn btn-gold btn-header-quote">Teklif Al</a>
        <button class="mobile-toggle" aria-label="Menüyü Aç/Kapat">
          <span class="hamburger-box">
            <span class="hamburger-line"></span>
            <span class="hamburger-line"></span>
            <span class="hamburger-line"></span>
          </span>
        </button>
      </div>
    `;

    // Mobil Menü Çekmecesini Senkronize Et
    renderMobileDrawer();
    initNavEvents();
  }

  function renderMobileDrawer() {
    let mobileDrawer = document.querySelector('.mobile-drawer');
    let mobileBackdrop = document.querySelector('.mobile-backdrop');

    if (!mobileDrawer) {
      mobileDrawer = document.createElement('aside');
      mobileDrawer.className = 'mobile-drawer';
      mobileDrawer.setAttribute('aria-label', 'Mobil Menü');
      document.body.appendChild(mobileDrawer);
    }

    if (!mobileBackdrop) {
      mobileBackdrop = document.createElement('div');
      mobileBackdrop.className = 'mobile-backdrop';
      document.body.appendChild(mobileBackdrop);
    }

    let mobileNavHtml = '';
    NAV_CONFIG.forEach(item => {
      const isDropdown = item.dropdown && item.dropdown.length > 0;

      let isActive = false;
      if (item.id === 'home') {
        isActive = (currentPath === '/' || currentPath.endsWith('/index.html') || currentPath === '');
      } else {
        const itemClean = item.href.replace(/^\.\.\/|^\.\//, '').replace(/\/$/, '');
        if (itemClean && currentPath.includes(itemClean)) {
          isActive = true;
        }
      }

      if (isDropdown) {
        mobileNavHtml += `
          <li class="mobile-nav-item-has-submenu">
            <span class="mobile-nav-link mobile-nav-accordion-header">
              <span>${item.label}</span>
              <svg class="nav-chevron" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z"/></svg>
            </span>
            <ul class="mobile-submenu">
              ${item.dropdown.map(sub => {
                const isSubActive = currentPath.includes(sub.href.replace(/^\.\.\/|^\.\//, '').replace(/\/$/, ''));
                return `
                  <li>
                    <a href="${sub.href}" class="mobile-submenu-link ${isSubActive ? 'active' : ''}">${sub.label}</a>
                  </li>
                `;
              }).join('')}
            </ul>
          </li>
        `;
      } else {
        mobileNavHtml += `
          <li>
            <a href="${item.href}" class="mobile-nav-link ${isActive ? 'active' : ''}">
              ${item.label}
            </a>
          </li>
        `;
      }
    });

    mobileDrawer.innerHTML = `
      <div>
        <div style="margin-bottom: 2rem;">
          <a href="${prefix ? prefix : './'}">
            <img src="${prefix}assets/images/logo-light.svg" alt="Nizamlar Baskı" width="180">
          </a>
        </div>
        <ul class="mobile-nav-list">
          ${mobileNavHtml}
        </ul>
      </div>
      <div class="mobile-drawer-footer">
        <a href="${prefix}teklif-al/" class="btn btn-gold" style="width: 100%;">Fiyat Teklifi Al</a>
        <div class="mobile-contact-line"><span data-cms-site="contact_address" data-cms-prefix="📍 ">📍 İstanbul / Türkiye</span></div>
        <div class="mobile-contact-line"><span data-cms-site="contact_email" data-cms-prefix="✉️ ">✉️ info@nizamlarbaski.com</span></div>
      </div>
    `;
  }

  function initNavEvents() {
    const siteHeader = document.querySelector('.site-header');
    if (siteHeader) {
      const handleScroll = () => {
        if (window.scrollY > 30) {
          siteHeader.classList.add('header-scrolled');
        } else {
          siteHeader.classList.remove('header-scrolled');
        }
      };
      window.addEventListener('scroll', handleScroll, { passive: true });
      handleScroll();
    }

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

      mobileToggle.onclick = () => {
        if (mobileDrawer.classList.contains('active')) {
          closeMenu();
        } else {
          openMenu();
        }
      };

      mobileBackdrop.onclick = closeMenu;

      // Mobil menüdeki linke tıklandığında menüyü kapat
      mobileDrawer.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', closeMenu);
      });

      // Mobil akordeon aç/kapa
      mobileDrawer.querySelectorAll('.mobile-nav-accordion-header').forEach(header => {
        header.addEventListener('click', () => {
          const parent = header.closest('.mobile-nav-item-has-submenu');
          if (parent) {
            parent.classList.toggle('expanded');
          }
        });
      });
    }
  }

  async function syncServicesWithCms() {
    try {
      const res = await fetch('/api/public/services');
      if (!res.ok) return;
      const json = await res.json();
      const list = json.data;
      if (!Array.isArray(list) || !list.length) return;

      const published = list.filter(s => s.status === 'published' && s.title && s.slug);
      published.sort((a, b) => (a.sort ?? 999) - (b.sort ?? 999) || (a.id - b.id));

      const hizmetlerItem = NAV_CONFIG.find(item => item.id === 'hizmetler');
      if (hizmetlerItem) {
        hizmetlerItem.dropdown = [
          { label: 'Tüm Hizmetler', href: `${prefix}hizmetlerimiz/` },
          ...published.map(s => ({
            label: s.title,
            href: `${prefix}hizmetlerimiz/${encodeURIComponent(s.slug)}/`,
            tag: s.badge && s.badge.toLowerCase().includes('popüler') ? 'Popüler' : undefined
          }))
        ];
        renderNavbar();
      }

      // Footer hizmet linklerini de senkronize et
      document.querySelectorAll('.footer-links').forEach(ul => {
        const isServicesColumn = Array.from(ul.querySelectorAll('a')).some(a => a.href.includes('/hizmetlerimiz/'));
        if (isServicesColumn) {
          ul.innerHTML = published.map(s => `
            <li><a href="${prefix}hizmetlerimiz/${encodeURIComponent(s.slug)}/" class="footer-link">${s.title}</a></li>
          `).join('') + `<li><a href="${prefix}hizmetlerimiz/" class="footer-link">Tüm Baskı Çözümleri</a></li>`;
        }
      });
    } catch (e) {
      // Offline fallback
    }
  }

  function init() {
    renderNavbar();
    syncServicesWithCms();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.NizamlarNavbar = {
    refresh: renderNavbar,
    sync: syncServicesWithCms,
    version: '2.2.0'
  };
})();
