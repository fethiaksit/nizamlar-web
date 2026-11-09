# Nizamlar Baskı — Geliştirici & Ajan Kılavuzu

Bu belge, **Nizamlar Baskı** kurumsal web sitesi ve yönetim panelinin mimari yapısını, dosya hiyerarşisini, veritabanı şemasını ve geliştirme kurallarını özetler.

---

## 1. Mimari Genel Bakış

- **Site Amacı**: Tekstil parça baskı (DTF baskı, robotik serigrafi, emprime, tişört ve konfeksiyon baskısı) alanında kurumsal tanıtım, interaktif ürün/baskı stüdyosu, dinamik hizmet & blog sayfaları ve teklif toplama.
- **Frontend**: Semantik HTML5, CSS3 (özel değişkenler: lüks antrasit `#17181c`, gold `#d4af37`, sıcak kahve `#2e221b`), saf (Vanilla) JavaScript, GSAP animasyonları, interaktif Mockup Stüdyosu.
- **Backend**: Saf PHP 8.x (üretimde Composer, Node.js veya Docker bağımlılığı yoktur).
- **Veritabanı**: MySQL / MariaDB (yerel testlerde opsiyonel SQLite desteği mevcuttur).
- **Hosting Hedefi**: TürkTicaret Limitsiz Plus cPanel (Apache 2.4 + PHP 8.x + MySQL).
- **Yönetim Paneli**: `https://nizamlarbaski.com/admin/` (Özel geliştirilmiş, Türkçe, duyarlı ve minimal arayüz).

---

## 2. Dizin Yapısı

```
/
├── .htaccess                     # Apache yönlendirmeleri, HTTPS, güvenlik başlıkları, temiz URL'ler
├── database.sql                  # 20 tablolu tam MySQL şeması ve başlangıç seed verileri
├── index.html                    # Ana sayfa (Hero, Süreç Simülasyonu, Stüdyo, Ürünler, Hizmetler)
├── hakkimizda/index.html         # Kurumsal hakkımızda sayfası
├── hizmetlerimiz/                # Hizmetler dizini
│   ├── index.html                # Hizmetler listesi & teknoloji karşılaştırması
│   └── detail.php                # Dinamik hizmet detay sayfası (SSR + slug yönlendirme)
├── blog/                         # Blog dizini
│   ├── index.html                # Blog arşivi ve makale listesi
│   └── detail.php                # Dinamik blog makale sayfası (SSR + slug yönlendirme)
├── makine-parkurumuz/index.html  # Makine ve teknoloji parkuru sayfası
├── uretim-surecleri/index.html   # Üretim aşamaları ve kalite standartları
├── referanslarimiz/index.html    # Müşteri referansları ve marka portföyü
├── sertifikalarimiz/index.html   # Kalite & ekoloji belgeleri
├── iletisim/index.html           # İletişim bilgileri ve iletişim formu
├── teklif-al/index.html          # Fiyat teklif formu (dosya yükleme ve parametre seçimi)
├── assets/                       # Statik varlıklar (css, js, images, videos)
│   ├── css/                      # Stiller (main.css, studio.css, responsive.css vb.)
│   └── js/                       # İstemci kodları (main.js, cms-client.js, live-preview.js vb.)
├── config/                       # Çekirdek PHP yapılandırma ve kütüphaneleri
│   ├── config.php                # DB bilgileri, dizin sabitleri, ortam değişkenleri
│   ├── db.php                    # PDO veritabanı sürücüsü (MySQL / SQLite)
│   ├── auth.php                  # Oturum, parola ve CSRF yönetimi
│   ├── mailer.php                # Saf PHP SMTP ve mail() istemcisi
│   └── helpers.php               # XSS, girdi temizleme, rate limit, sihirli bayt doğrulaması
├── api/                          # REST API uç noktaları
│   ├── public.php                # CMS koleksiyonlarını JSON olarak sunan genel API
│   ├── quote.php                 # Teklif formu uç noktası (dosya denetimi, DB kaydı, SMTP bildirimi)
│   ├── contact.php               # İletişim formu uç noktası (honeypot, DB kaydı, SMTP bildirimi)
│   └── health.php                # Sistem sağlık durumu ve izin kontrolleri
├── admin/                        # Türkçe Yönetim Paneli
│   ├── index.php                 # Yönlendirici (login veya dashboard'a yönlendirir)
│   ├── install.php               # Tek seferlik ilk admin kurulum sihirbazı (kilitlenebilir)
│   ├── login.php / logout.php    # Güvenli giriş/çıkış ekranları (hız sınırlamalı)
│   ├── dashboard.php             # Özet metrikler, son teklifler ve mesajlar
│   ├── quotes.php                # Teklif talepleri yönetimi, durum güncelleme ve filtreleme
│   ├── quote-file.php            # Teklif dosyalarını yetkili ve güvenli indirme uç noktası
│   ├── messages.php              # İletişim mesajları ve e-posta yeniden deneme arayüzü
│   ├── pages.php                 # Sayfa başlıkları, hero alanları ve SEO yönetimi
│   ├── services.php              # Hizmet CRUD ekranı
│   ├── products.php              # Ürün katalog yönetimi
│   ├── blog.php                  # Blog makale yönetimi
│   ├── machines.php              # Makine parkuru yönetimi
│   ├── processes.php             # Üretim süreçleri yönetimi
│   ├── references.php            # Marka referansları yönetimi
│   ├── certificates.php          # Sertifika yönetimi
│   ├── media.php                 # Medya kütüphanesi (görsel/video yükleme, silme, URL kopyalama)
│   ├── settings.php              # Genel ayarlar, WhatsApp, Mockup Stüdyo ve SMTP test paneli
│   └── assets/                   # Admin CSS ve ikonları
├── storage/                      # Güvenli depolama alanı (.htaccess ile doğrudan web erişimi engelli)
│   ├── quotes/                   # Müşterilerin teklif için yüklediği tasarım dosyaları
│   └── logs/                     # Sistem ve hata kayıtları
├── uploads/                      # Genel medya dosyaları (admin tarafından yüklenen görseller)
└── tools/                        # Geliştirici ve taşıma araçları
    ├── migrate-directus.php      # AWS Directus/PostgreSQL -> MySQL idempotent aktarım betiği
    ├── aws-export-directus.sh    # AWS Directus verilerini dışa aktaran terminal betiği
    └── build_cpanel_package.sh   # cPanel için dağıtım ZIP paketi üreten betik
```

---

## 3. Güvenlik Kuralları

1. **Doğrudan Web Erişimi Yasağı**:
   - `storage/` klasörüne web üzerinden doğrudan erişilemez; içindeki tasarım dosyaları yalnızca `admin/quote-file.php` aracılığıyla doğrulanmış admin oturumuyla indirilebilir.
   - `uploads/` klasöründe `.htaccess` ile PHP ve betik çalıştırma (`SetHandler none`, `php_flag engine off`) tamamen devre dışı bırakılmıştır.
2. **Form Doğrulama**:
   - Asla veritabanına kaydedilmeden sahte başarı modalı gösterilmez.
   - Teklif ve iletişim formlarında honeypot ve hız sınırlaması (Rate Limiting) uygulanır.
   - Dosya yüklemelerinde uzantı, MIME ve sihirli bayt (magic bytes) doğrulaması zorunludur.
3. **Admin Kimlik Doğrulama**:
   - Parolalar `password_hash(..., PASSWORD_DEFAULT)` ile saklanır.
   - Brute-force saldırılarına karşı IP bazlı hız sınırlaması bulunur.
   - Tüm POST işlemlerinde CSRF token doğrulaması zorunludur.

---

## 4. Git Çalışma Düzeni

- Göç çalışmaları `feat/cpanel-php-mysql-migration` dalında yürütülür.
- Kullanıcı onayı olmadan doğrudan `main` dalına merge yapılmaz.
- `.env` ve veritabanı şifreleri repoya eklenmez; `config.php` varsayılanları veya ortam değişkenleri kullanılır.
