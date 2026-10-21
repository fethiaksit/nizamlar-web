/**
 * NİZAMLAR BASKI — CANLI BASKI ÖNİZLEME KONFİGÜRASYONU
 * Mockup modelleri, baskı koordinatları, ürün renkleri ve önceden tanımlı baskı alanları.
 * Directus CMS ve statik JavaScript konfigürasyonuyla %100 uyumludur.
 */

window.NIZAMLAR_MOCKUP_CONFIG = {
  section: {
    tag: 'İnteraktif Stüdyo',
    title: 'Tasarımını Yükle, Baskını Canlı Önizle',
    desc: 'Kendi tasarım dosyanızı yükleyin; tişört, sweatshirt, hoodie, pantolon veya bez çanta üzerinde baskınızın nasıl görüneceğini anında inceleyin.',
    allowedTypesText: 'PNG, JPG, JPEG, WEBP, SVG',
    maxSizeMB: 25,
    tip: 'En iyi sonuç için şeffaf arka planlı PNG dosyası yükleyin.'
  },

  canvas: {
    width: 600,
    height: 680,
    aspectRatio: 600 / 680
  },

  samples: [
    {
      id: 'monogram',
      name: 'Nizamlar Atelier',
      category: 'Kurumsal Altın Varak',
      src: 'assets/images/samples/sample-monogram.svg',
      defaultScale: 0.75
    },
    {
      id: 'streetwear',
      name: 'Streetwear Cyber',
      category: '1440 DPI DTF Renkli',
      src: 'assets/images/samples/sample-streetwear.svg',
      defaultScale: 0.85
    },
    {
      id: 'vintage',
      name: 'Varsity 84',
      category: 'Vintage Serigrafi',
      src: 'assets/images/samples/sample-vintage.svg',
      defaultScale: 0.70
    }
  ],

  products: {
    tisort: {
      id: 'tisort',
      name: 'Tişört',
      category: 'Konfeksiyon & Parça',
      spec: '240 GSM Penye Pamuk',
      defaultView: 'front',
      supportedViews: ['front', 'back'],
      defaultColor: 'anthracite',
      supportedColors: [
        { id: 'anthracite', name: 'Antrasit Siyah', hex: '#222325' },
        { id: 'cream', name: 'Krem / Ham Pamuk', hex: '#f3efe7' }
      ],
      views: {
        front: {
          label: 'Ön Görünüm',
          mockups: {
            anthracite: 'assets/images/products/tee-blank-cotton.svg',
            cream: 'assets/images/products/tee-blank-cream.svg'
          },
          printableArea: {
            x: 185,
            y: 145,
            width: 230,
            height: 410,
            label: 'Ön Baskı Alanı (Maks. 38x48 cm)'
          },
          positions: {
            gogus: {
              id: 'gogus',
              name: 'Sol Göğüs (Cep)',
              x: 245,
              y: 205,
              scale: 0.42,
              rotation: 0,
              desc: '10 x 10 cm Arma / Logo'
            },
            tam_on: {
              id: 'tam_on',
              name: 'Tam Ön (A4 / A3)',
              x: 300,
              y: 330,
              scale: 0.95,
              rotation: 0,
              desc: 'Geniş Göğüs Formatı'
            },
            orta_gogus: {
              id: 'orta_gogus',
              name: 'Göğüs Orta',
              x: 300,
              y: 240,
              scale: 0.70,
              rotation: 0,
              desc: '20 x 20 cm Kare / Yazı'
            }
          },
          defaultPosition: 'tam_on'
        },
        back: {
          label: 'Sırt Görünümü',
          mockups: {
            anthracite: 'assets/images/products/tee-blank-back.svg',
            cream: 'assets/images/products/tee-blank-cream-back.svg'
          },
          printableArea: {
            x: 185,
            y: 135,
            width: 230,
            height: 420,
            label: 'Sırt Baskı Alanı (Maks. 40x50 cm)'
          },
          positions: {
            sirt_tam: {
              id: 'sirt_tam',
              name: 'Büyük Sırt (A3+)',
              x: 300,
              y: 310,
              scale: 1.15,
              rotation: 0,
              desc: '32 x 45 cm Mega Sırt Baskı'
            },
            ense_logo: {
              id: 'ense_logo',
              name: 'Ense Altı Mikro Logo',
              x: 300,
              y: 160,
              scale: 0.35,
              rotation: 0,
              desc: '8 x 6 cm Ense Baskısı'
            }
          },
          defaultPosition: 'sirt_tam'
        }
      }
    },

    sweatshirt: {
      id: 'sweatshirt',
      name: 'Sweatshirt',
      category: 'Bisiklet Yaka Ağır Fleece',
      spec: '380 GSM Şardonlu Kumaş',
      defaultView: 'front',
      supportedViews: ['front'],
      defaultColor: 'anthracite',
      supportedColors: [
        { id: 'anthracite', name: 'Antrasit Siyah', hex: '#222325' },
        { id: 'cream', name: 'Krem / Doğal Taş', hex: '#ded9cf' }
      ],
      views: {
        front: {
          label: 'Ön Görünüm',
          mockups: {
            anthracite: 'assets/images/products/sweat-blank-fleece.svg',
            cream: 'assets/images/products/sweat-blank-cream.svg'
          },
          printableArea: {
            x: 180,
            y: 155,
            width: 240,
            height: 400,
            label: 'Sweat Göğüs Alanı (Maks. 38x45 cm)'
          },
          positions: {
            tam_on: {
              id: 'tam_on',
              name: 'Tam Ön Baskı',
              x: 300,
              y: 330,
              scale: 0.95,
              rotation: 0,
              desc: 'Geniş Sanatsal Artwork'
            },
            gogus: {
              id: 'gogus',
              name: 'Sol Göğüs',
              x: 245,
              y: 215,
              scale: 0.42,
              rotation: 0,
              desc: 'Klasik Minimal Logo'
            },
            orta_gogus: {
              id: 'orta_gogus',
              name: 'Göğüs Orta',
              x: 300,
              y: 250,
              scale: 0.72,
              rotation: 0,
              desc: 'Tipografik Göğüs Şeridi'
            }
          },
          defaultPosition: 'tam_on'
        }
      }
    },

    hoodie: {
      id: 'hoodie',
      name: 'Hoodie',
      category: 'Kapüşonlu & Kanguru Cep',
      spec: '400 GSM Ağır Sokak Modası',
      defaultView: 'front',
      supportedViews: ['front'],
      defaultColor: 'anthracite',
      supportedColors: [
        { id: 'anthracite', name: 'Antrasit Siyah', hex: '#222325' },
        { id: 'cream', name: 'Krem / Ham Taş', hex: '#ded9cf' }
      ],
      views: {
        front: {
          label: 'Ön Görünüm',
          mockups: {
            anthracite: 'assets/images/products/hoodie-blank.svg',
            cream: 'assets/images/products/hoodie-blank-cream.svg'
          },
          printableArea: {
            x: 195,
            y: 175,
            width: 210,
            height: 250,
            label: 'Cep Üstü Baskı Alanı (28x32 cm)'
          },
          positions: {
            cep_ustu: {
              id: 'cep_ustu',
              name: 'Cep Üstü Göğüs (A4)',
              x: 300,
              y: 295,
              scale: 0.85,
              rotation: 0,
              desc: 'Kanguru Cep Üzeri Yerleşim'
            },
            sol_gogus: {
              id: 'sol_gogus',
              name: 'Sol Göğüs Logo',
              x: 245,
              y: 220,
              scale: 0.40,
              rotation: 0,
              desc: '10x10 cm Minimal Logo'
            }
          },
          defaultPosition: 'cep_ustu'
        }
      }
    },

    pantolon: {
      id: 'pantolon',
      name: 'Pantolon / Eşofman',
      category: 'Jogger & Parça Kumaş',
      spec: '%100 Pamuk 3 İplik',
      defaultView: 'front',
      supportedViews: ['front'],
      defaultColor: 'anthracite',
      supportedColors: [
        { id: 'anthracite', name: 'Antrasit Siyah', hex: '#222325' },
        { id: 'cream', name: 'Krem / Kemik', hex: '#ded9cf' }
      ],
      views: {
        front: {
          label: 'Ön Görünüm',
          mockups: {
            anthracite: 'assets/images/products/jogger-blank.svg',
            cream: 'assets/images/products/jogger-blank-cream.svg'
          },
          printableArea: {
            x: 180,
            y: 110,
            width: 240,
            height: 500,
            label: 'Bacak Baskı Alanı (60x20 cm)'
          },
          positions: {
            yan_paca: {
              id: 'yan_paca',
              name: 'Sol Yan Paça Şerit',
              x: 215,
              y: 380,
              scale: 0.65,
              rotation: 0,
              desc: 'Dikey Boyuna Tipografi'
            },
            ust_uyluk: {
              id: 'ust_uyluk',
              name: 'Üst Cep / Uyluk',
              x: 240,
              y: 185,
              scale: 0.45,
              rotation: 0,
              desc: '12 x 12 cm Amblem / Logo'
            },
            sag_paca: {
              id: 'sag_paca',
              name: 'Sağ Yan Paça',
              x: 385,
              y: 380,
              scale: 0.65,
              rotation: 0,
              desc: 'Sağ Bacak Dikey Baskı'
            }
          },
          defaultPosition: 'yan_paca'
        }
      }
    },

    canta: {
      id: 'canta',
      name: 'Bez Çanta',
      category: 'Ham Pamuk Kanvas Tote',
      spec: '320 GSM Ağır Dayanıklı Dokuma',
      defaultView: 'front',
      supportedViews: ['front'],
      defaultColor: 'cream',
      supportedColors: [
        { id: 'cream', name: 'Doğal Ham Bez', hex: '#f3efe7' },
        { id: 'anthracite', name: 'Siyah Kanvas', hex: '#222325' }
      ],
      views: {
        front: {
          label: 'Ön Gövde',
          mockups: {
            cream: 'assets/images/products/tote-bag-blank.svg',
            anthracite: 'assets/images/products/tote-bag-black.svg'
          },
          printableArea: {
            x: 180,
            y: 230,
            width: 240,
            height: 330,
            label: 'Çanta Ön Yüzü (28x35 cm)'
          },
          positions: {
            orta: {
              id: 'orta',
              name: 'Orta Gövde (A4)',
              x: 300,
              y: 380,
              scale: 0.88,
              rotation: 0,
              desc: 'Dengeli Merkez Baskı'
            },
            tam_format: {
              id: 'tam_format',
              name: 'Büyük Format (A3)',
              x: 300,
              y: 375,
              scale: 1.12,
              rotation: 0,
              desc: 'Tüm Yüzeyi Kaplayan Sanatsal Baskı'
            }
          },
          defaultPosition: 'orta'
        }
      }
    }
  }
};
