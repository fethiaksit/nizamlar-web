-- ============================================================================
-- NİZAMLAR BASKI — KURUMSAL WEB VE CMS VERİTABANI ŞEMASI
-- Hedef Ortam: MySQL 5.7+ / 8.0+ / MariaDB 10.3+ (TürkTicaret cPanel Uyumlu)
-- Karakter Seti: utf8mb4 / Karşılaştırma: utf8mb4_unicode_ci
-- ============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------------------------------------------------------
-- 1. Site Genel Ayarları (Singleton)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `site_settings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `site_name` VARCHAR(255) NOT NULL DEFAULT 'Nizamlar Baskı',
  `tagline` VARCHAR(255) DEFAULT 'Tekstil Baskıda Renk, Kalite ve Güven',
  `company_legal_name` VARCHAR(255) DEFAULT 'Nizamlar Baskı Tekstil San. ve Tic. Ltd. Şti.',
  `contact_phone` VARCHAR(100) DEFAULT '+90 (212) 000 00 00',
  `contact_phone_raw` VARCHAR(50) DEFAULT '+902120000000',
  `contact_email` VARCHAR(150) DEFAULT 'info@nizamlarbaski.com',
  `working_hours` VARCHAR(150) DEFAULT 'Hafta İçi: 08:30 - 18:30',
  `contact_address` TEXT,
  `instagram_url` VARCHAR(255) DEFAULT 'https://instagram.com/nizamlarbaski',
  `linkedin_url` VARCHAR(255) DEFAULT 'https://linkedin.com/company/nizamlarbaski',
  `facebook_url` VARCHAR(255) DEFAULT 'https://facebook.com/nizamlarbaski',
  `youtube_url` VARCHAR(255) DEFAULT 'https://youtube.com/@nizamlarbaski',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 2. WhatsApp Ayarları (Singleton)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `whatsapp_settings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `whatsapp_number` VARCHAR(50) DEFAULT '+90 532 000 00 00',
  `is_active` TINYINT(1) DEFAULT 1,
  `button_text` VARCHAR(255) DEFAULT 'WhatsApp ile Hızlı Teklif Al',
  `floating_button_active` TINYINT(1) DEFAULT 1,
  `default_message` TEXT,
  `agent_name` VARCHAR(100) DEFAULT 'Nizamlar Müşteri Danışmanı',
  `display_pages` VARCHAR(100) DEFAULT 'all',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 3. Mockup Canlı Önizleme Stüdyosu Ayarları (Singleton)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `mockup_preview_settings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `is_active` TINYINT(1) DEFAULT 1,
  `section_tag` VARCHAR(100) DEFAULT 'İnteraktif Stüdyo',
  `section_title` VARCHAR(255) DEFAULT 'Tasarımını Yükle, Baskını Canlı Önizle',
  `section_desc` TEXT,
  `allowed_file_types` VARCHAR(255) DEFAULT 'PNG, JPG, JPEG, WEBP, SVG',
  `max_file_size_mb` INT DEFAULT 25,
  `default_product` VARCHAR(50) DEFAULT 'tisort',
  `config_json` LONGTEXT,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 4. Sayfalar (Pages)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `pages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `status` ENUM('published', 'draft') NOT NULL DEFAULT 'published',
  `slug` VARCHAR(100) NOT NULL UNIQUE,
  `page_name` VARCHAR(150) NOT NULL,
  `title` VARCHAR(255) DEFAULT NULL,
  `subtitle` TEXT DEFAULT NULL,
  `hero_title` TEXT DEFAULT NULL,
  `hero_subtitle` TEXT DEFAULT NULL,
  `hero_image` VARCHAR(255) DEFAULT NULL,
  `hero_video` VARCHAR(255) DEFAULT NULL,
  `hero_btn_text` VARCHAR(100) DEFAULT NULL,
  `hero_btn_link` VARCHAR(255) DEFAULT NULL,
  `sections_data` LONGTEXT DEFAULT NULL,
  `seo_title` VARCHAR(255) DEFAULT NULL,
  `seo_description` TEXT DEFAULT NULL,
  `seo_keywords` VARCHAR(255) DEFAULT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_pages_status_slug` (`status`, `slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 5. Hizmetler (Services)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `services` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `status` ENUM('published', 'draft') NOT NULL DEFAULT 'published',
  `sort` INT NOT NULL DEFAULT 0,
  `title` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(150) NOT NULL UNIQUE,
  `badge` VARCHAR(100) DEFAULT NULL,
  `capacity_info` VARCHAR(150) DEFAULT NULL,
  `short_desc` TEXT DEFAULT NULL,
  `content` LONGTEXT DEFAULT NULL,
  `cover_image` VARCHAR(255) DEFAULT NULL,
  `features` LONGTEXT DEFAULT NULL,
  `old_slugs` LONGTEXT DEFAULT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_services_status_sort` (`status`, `sort`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 6. Ürünler (Products)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `products` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `status` ENUM('published', 'draft') NOT NULL DEFAULT 'published',
  `sort` INT NOT NULL DEFAULT 0,
  `name` VARCHAR(255) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `cover_image` VARCHAR(255) DEFAULT NULL,
  `back_image` VARCHAR(255) DEFAULT NULL,
  `gallery_images` LONGTEXT DEFAULT NULL,
  `print_technique` VARCHAR(150) DEFAULT NULL,
  `pattern_type` VARCHAR(150) DEFAULT NULL,
  `fabric_details` VARCHAR(150) DEFAULT NULL,
  `video_url` VARCHAR(255) DEFAULT NULL,
  `featured` TINYINT(1) NOT NULL DEFAULT 0,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_products_status_sort` (`status`, `sort`),
  INDEX `idx_products_featured` (`featured`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 7. Makine Parkuru (Machines)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `machines` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `status` ENUM('published', 'draft') NOT NULL DEFAULT 'published',
  `sort` INT NOT NULL DEFAULT 0,
  `name` VARCHAR(255) NOT NULL,
  `brand_model` VARCHAR(150) DEFAULT NULL,
  `category` VARCHAR(100) DEFAULT NULL,
  `print_type` VARCHAR(150) DEFAULT NULL,
  `capacity` VARCHAR(150) DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  `specs` LONGTEXT DEFAULT NULL,
  `image` VARCHAR(255) DEFAULT NULL,
  `video_url` VARCHAR(255) DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_machines_status_sort` (`status`, `sort`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 8. Üretim Süreçleri (Production Processes)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `production_processes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `status` ENUM('published', 'draft') NOT NULL DEFAULT 'published',
  `sort` INT NOT NULL DEFAULT 0,
  `step_number` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `short_desc` TEXT DEFAULT NULL,
  `detail_text` TEXT DEFAULT NULL,
  `duration_info` VARCHAR(100) DEFAULT NULL,
  `image` VARCHAR(255) DEFAULT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_processes_status_sort` (`status`, `sort`, `step_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 9. Referanslar (References)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `references` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `status` ENUM('published', 'draft') NOT NULL DEFAULT 'published',
  `sort` INT NOT NULL DEFAULT 0,
  `company_name` VARCHAR(255) NOT NULL,
  `industry` VARCHAR(150) DEFAULT NULL,
  `logo` VARCHAR(255) DEFAULT NULL,
  `collaboration_type` VARCHAR(150) DEFAULT NULL,
  `featured` TINYINT(1) NOT NULL DEFAULT 0,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_references_status_sort` (`status`, `sort`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 10. Sertifikalar (Certificates)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `certificates` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `status` ENUM('published', 'draft') NOT NULL DEFAULT 'published',
  `sort` INT NOT NULL DEFAULT 0,
  `title` VARCHAR(255) NOT NULL,
  `organization` VARCHAR(150) DEFAULT NULL,
  `certificate_no` VARCHAR(100) DEFAULT NULL,
  `validity` VARCHAR(100) DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  `image` VARCHAR(255) DEFAULT NULL,
  `pdf_file` VARCHAR(255) DEFAULT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_certs_status_sort` (`status`, `sort`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 11. Blog Yazıları (Blog Posts)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `blog_posts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `status` ENUM('published', 'draft') NOT NULL DEFAULT 'published',
  `sort` INT NOT NULL DEFAULT 0,
  `title` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(150) NOT NULL UNIQUE,
  `category` VARCHAR(100) DEFAULT NULL,
  `author` VARCHAR(100) DEFAULT NULL,
  `read_time` VARCHAR(50) DEFAULT NULL,
  `published_date` DATE DEFAULT NULL,
  `summary` TEXT DEFAULT NULL,
  `content` LONGTEXT DEFAULT NULL,
  `cover_image` VARCHAR(255) DEFAULT NULL,
  `old_slugs` LONGTEXT DEFAULT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_blog_status_date` (`status`, `published_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 12. Video ve Animasyon Yapılandırması (Animations Config)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `animations_config` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `status` ENUM('published', 'draft') NOT NULL DEFAULT 'published',
  `key` VARCHAR(100) NOT NULL UNIQUE,
  `title` VARCHAR(255) NOT NULL,
  `target_page` VARCHAR(100) DEFAULT NULL,
  `video_url` VARCHAR(255) DEFAULT NULL,
  `mobile_video_url` VARCHAR(255) DEFAULT NULL,
  `poster_image` VARCHAR(255) DEFAULT NULL,
  `animation_type` VARCHAR(100) DEFAULT NULL,
  `animation_duration_ms` INT DEFAULT 1000,
  `autoplay` TINYINT(1) DEFAULT 1,
  `loop` TINYINT(1) DEFAULT 1,
  `muted` TINYINT(1) DEFAULT 1,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 13. Menü ve Footer Bağlantıları (Navigation Menus)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `navigation_menus` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `status` ENUM('published', 'draft') NOT NULL DEFAULT 'published',
  `sort` INT NOT NULL DEFAULT 0,
  `menu_location` VARCHAR(100) NOT NULL DEFAULT 'header',
  `title` VARCHAR(150) NOT NULL,
  `url` VARCHAR(255) NOT NULL,
  `badge` VARCHAR(50) DEFAULT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_nav_location_sort` (`menu_location`, `status`, `sort`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 14. SEO Ayarları (SEO Settings)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `seo_settings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `page_slug` VARCHAR(100) NOT NULL UNIQUE,
  `meta_title` VARCHAR(255) DEFAULT NULL,
  `meta_description` TEXT DEFAULT NULL,
  `meta_keywords` VARCHAR(255) DEFAULT NULL,
  `og_image` VARCHAR(255) DEFAULT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 15. URL Yönlendirmeleri (301 Redirects)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `url_redirects` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `from_path` VARCHAR(255) NOT NULL UNIQUE,
  `to_path` VARCHAR(255) NOT NULL,
  `status_code` INT NOT NULL DEFAULT 301,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 16. Teklif Talepleri (Quote Requests)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `quote_requests` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` ENUM('Yeni', 'İnceleniyor', 'Teklif Hazırlandı', 'Tamamlandı', 'İptal') NOT NULL DEFAULT 'Yeni',
  `customer_name` VARCHAR(150) NOT NULL,
  `company_name` VARCHAR(150) DEFAULT NULL,
  `phone` VARCHAR(50) DEFAULT NULL,
  `email` VARCHAR(150) DEFAULT NULL,
  `print_type` VARCHAR(120) DEFAULT NULL,
  `quantity` VARCHAR(100) DEFAULT NULL,
  `description` LONGTEXT DEFAULT NULL,
  `file_url` VARCHAR(255) DEFAULT NULL,
  `file_name` VARCHAR(255) DEFAULT NULL,
  `file_size` BIGINT DEFAULT 0,
  `mime_type` VARCHAR(100) DEFAULT NULL,
  `admin_notes` TEXT DEFAULT NULL,
  `source_ip_hash` VARCHAR(64) DEFAULT NULL,
  INDEX `idx_quote_status_date` (`status`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 17. İletişim Mesajları (Contact Messages)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `contact_messages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `received_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `name` VARCHAR(150) NOT NULL,
  `company` VARCHAR(150) DEFAULT NULL,
  `phone` VARCHAR(50) DEFAULT NULL,
  `email` VARCHAR(150) DEFAULT NULL,
  `subject` VARCHAR(150) NOT NULL,
  `message` LONGTEXT NOT NULL,
  `status` ENUM('new', 'read', 'replied') NOT NULL DEFAULT 'new',
  `email_status` ENUM('pending', 'sent', 'failed') NOT NULL DEFAULT 'pending',
  `admin_notes` TEXT DEFAULT NULL,
  `source_ip_hash` VARCHAR(64) DEFAULT NULL,
  INDEX `idx_contact_status_date` (`status`, `received_at`),
  INDEX `idx_contact_email_status` (`email_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 18. Yönetici Kullanıcıları (Admin Users)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `admin_users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(100) NOT NULL UNIQUE,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(150) NOT NULL,
  `role` VARCHAR(50) NOT NULL DEFAULT 'admin',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `last_login` DATETIME NULL DEFAULT NULL,
  `failed_logins` INT NOT NULL DEFAULT 0,
  `lockout_until` DATETIME NULL DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 19. Medya Kütüphanesi (Media Library)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `media_library` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `filename` VARCHAR(255) NOT NULL UNIQUE,
  `original_name` VARCHAR(255) NOT NULL,
  `file_path` VARCHAR(255) NOT NULL,
  `file_size` INT NOT NULL DEFAULT 0,
  `mime_type` VARCHAR(100) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 20. SMTP E-posta Ayarları (Singleton)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `smtp_settings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `host` VARCHAR(255) DEFAULT 'mail.nizamlarbaski.com',
  `port` INT DEFAULT 587,
  `encryption` VARCHAR(20) DEFAULT 'tls',
  `username` VARCHAR(255) DEFAULT '',
  `password` VARCHAR(255) DEFAULT '',
  `from_email` VARCHAR(255) DEFAULT 'info@nizamlarbaski.com',
  `from_name` VARCHAR(255) DEFAULT 'Nizamlar Baskı',
  `notification_email` VARCHAR(255) DEFAULT 'nizamlartekstill@gmail.com',
  `is_active` TINYINT(1) DEFAULT 0,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- VERİ TOHUMLAMA (SEED DATA)
-- ============================================================================

-- 1. Site Ayarları
INSERT INTO `site_settings` (`id`, `site_name`, `tagline`, `company_legal_name`, `contact_phone`, `contact_phone_raw`, `contact_email`, `working_hours`, `contact_address`, `instagram_url`, `linkedin_url`, `facebook_url`, `youtube_url`)
VALUES (
  1,
  'Nizamlar Baskı',
  'Tekstil Baskıda Renk, Kalite ve Güven',
  'Nizamlar Baskı Tekstil San. ve Tic. Ltd. Şti.',
  '+90 (212) 000 00 00',
  '+902120000000',
  'info@nizamlarbaski.com',
  'Hafta İçi: 08:30 - 18:30',
  'Organize Sanayi Bölgesi, Tekstilciler Sanayi Sitesi, İstanbul / Türkiye',
  'https://instagram.com/nizamlarbaski',
  'https://linkedin.com/company/nizamlarbaski',
  'https://facebook.com/nizamlarbaski',
  'https://youtube.com/@nizamlarbaski'
) ON DUPLICATE KEY UPDATE `site_name`=VALUES(`site_name`);

-- 2. WhatsApp Ayarları
INSERT INTO `whatsapp_settings` (`id`, `whatsapp_number`, `is_active`, `button_text`, `floating_button_active`, `default_message`, `agent_name`, `display_pages`)
VALUES (
  1,
  '+90 532 000 00 00',
  1,
  'WhatsApp ile Hızlı Teklif Al',
  1,
  'Merhaba Nizamlar Baskı, tekstil baskı çözümleriniz ve fiyat teklifi hakkında bilgi almak istiyorum.',
  'Nizamlar Müşteri Danışmanı',
  'all'
) ON DUPLICATE KEY UPDATE `whatsapp_number`=VALUES(`whatsapp_number`);

-- 3. Mockup Önizleme Ayarları
INSERT INTO `mockup_preview_settings` (`id`, `is_active`, `section_tag`, `section_title`, `section_desc`, `allowed_file_types`, `max_file_size_mb`, `default_product`)
VALUES (
  1,
  1,
  'İnteraktif Stüdyo',
  'Tasarımını Yükle, Baskını Canlı Önizle',
  'Kendi tasarım dosyanızı yükleyin; tişört, sweatshirt, hoodie, pantolon veya bez çanta üzerinde baskınızın nasıl görüneceğini anında inceleyin.',
  'PNG, JPG, JPEG, WEBP, SVG',
  25,
  'tisort'
) ON DUPLICATE KEY UPDATE `section_title`=VALUES(`section_title`);

-- 4. SMTP Ayarları
INSERT INTO `smtp_settings` (`id`, `host`, `port`, `encryption`, `username`, `password`, `from_email`, `from_name`, `notification_email`, `is_active`)
VALUES (
  1,
  'mail.nizamlarbaski.com',
  587,
  'tls',
  'info@nizamlarbaski.com',
  '',
  'info@nizamlarbaski.com',
  'Nizamlar Baskı',
  'nizamlartekstill@gmail.com',
  0
) ON DUPLICATE KEY UPDATE `host`=VALUES(`host`);

-- 5. Sayfalar (Pages)
INSERT INTO `pages` (`status`, `slug`, `page_name`, `title`, `subtitle`, `hero_title`, `hero_subtitle`, `hero_image`, `hero_video`, `hero_btn_text`, `hero_btn_link`, `sections_data`, `seo_title`, `seo_description`, `seo_keywords`)
VALUES
('published', 'home', 'Ana Sayfa', 'Endüstriyel Güç, Kusursuz Baskı Kalitesi', 'DTF baskı, serigrafi ve tişört baskıda son teknoloji makine parkuru, yüksek yıkama dayanımı ve sürdürülebilir üretim anlayışıyla tekstil sektörüne profesyonel çözümler sunuyoruz.', 'Tekstil Baskıda\n*Renk, Kalite* ve Güven.', 'Nizamlar Baskı; robotik serigrafi ahtapotları, yeni nesil DTF transfer hatları ve hassas fikse üniteleriyle hazır giyim ve kurumsal projelere canlı, yıkanmaya dayanıklı ve sürdürülebilir baskılar üretir.', 'assets/images/products/tee-back-streetwear.svg', 'assets/videos/production-loop.mp4', 'Fiyat Teklifi Al', 'teklif-al/', '{\"s1\":{\"tag\":\"Endüstriyel Parkur & Süreç Simülasyonu\",\"title\":\"DTF ve Transfer Baskı Nasıl Üretilir?\",\"desc\":\"Makinelerimiz yalnızca durağan ekipmanlar değildir. 6 adımlı üretim simülasyonumuzla film girişinden fiksaj presine kadar canlı üretim sürecini izleyin.\"},\"s2\":{\"tag\":\"Zengin Tekstil Koleksiyonu\",\"title\":\"Gerçekçi Baskı Detaylarıyla Üretim Örnekleri\",\"desc\":\"Tişörtten sweatshirt\'e, jogger\'dan kanvas bez çantaya kadar her üründe belirgin, dokulu ve yüksek kaliteli baskı uygulamaları.\"},\"s3\":{\"tag\":\"Uzmanlık Alanlarımız\",\"title\":\"Profesyonel Tekstil Baskı Çözümleri\",\"desc\":\"Her kumaş türüne, sipariş adedine ve desen detayına en uygun baskı teknolojisini belirliyor; yüksek yıkama dayanımı ve canlı renk garantisi sağlıyoruz.\"},\"s4\":{\"tag\":\"Canlı Üretim Sahnesi\",\"title\":\"İleri Teknoloji Tekstil Baskı Tesisimiz\",\"desc\":\"Hassas kalıp pozlamadan serigrafi rakle geçişlerine, DTF fırınlamadan kalite kontrol laboratuvarımıza kadar her adımda yüksek standart.\"},\"s5\":{\"tag\":\"Doğa Dostu İmalat\",\"title\":\"Sürdürülebilir Üretim & Uluslararası Standartlar\",\"desc\":\"Gelecek nesillere temiz izler bırakmak için üretim süreçlerimizde su bazlı ekolojik boyaları, enerji tasarruflu fırınları ve sertifikalı kalite süreçlerini benimsiyoruz.\"},\"s6\":{\"tag\":\"Güvenilir İş Birlikleri\",\"title\":\"Tekstil Sektöründe Güçlü Referanslar\",\"desc\":\"Hazır giyim ihracatçıları, yerel ve global giyim markaları ve kurumsal şirketler için kesintisiz baskı tedariki sağlıyoruz.\"}}', 'Nizamlar Baskı | Tekstil Baskıda Renk, Kalite ve Güven', 'Nizamlar Baskı; DTF baskı, serigrafi baskı, tişört ve konfeksiyon parça baskı alanlarında ileri teknoloji makine parkuruyla profesyonel çözümler sunar.', 'tekstil baskı, DTF baskı, serigrafi baskı, tişört baskı, emprime'),

('published', 'hakkimizda', 'Hakkımızda', 'Tekstilde 20 Yılı Aşkın Baskı ve İnovasyon Deneyimi', 'Nizamlar Baskı olarak modern teknolojiyi usta işçilikle harmanlıyor, yüksek kapasiteli üretim gücümüzle dünya markalarına güven veriyoruz.', 'Tekstilde Ustalık ve\n*Endüstriyel Üretim* Gücü', 'Nizamlar Baskı; yenilikçi teknolojileri, çevre dostu standartları ve uzman kadrosuyla tekstil sektörünün güvenilir parça baskı çözüm ortağıdır.', 'assets/images/machines/screen-print-carousel.svg', NULL, 'Tesisimizi Keşfedin', 'makine-parkurumuz/', '{\"s1\":{\"tag\":\"Tesis & Donanım\",\"title\":\"Tekstil Baskıda Uçtan Uca Departman Mimarisi\",\"desc\":\"Her proje, tesisimiz içindeki uzmanlaşmış birimlerin koordineli çalışmasıyla hayat bulur.\"}}', 'Hakkımızda | Nizamlar Baskı', 'Nizamlar Baskı kurumsal tarihi, misyonu, vizyonu ve endüstriyel tekstil baskı alanındaki uzmanlığı.', 'nizamlar baskı kurumsal, tekstil baskı firması, istanbul emprime atölyesi'),

('published', 'hizmetlerimiz', 'Hizmetlerimiz', 'Kapsamlı Tekstil Baskı ve Uygulama Hizmetleri', 'DTF transferden otomatik ahtapot serigrafiye, konfeksiyon parça baskıdan özel efektlere kadar her ihtiyaca özel çözümler.', 'Kapsamlı ve Endüstriyel\n*Tekstil Baskı* Çözümleri', 'DTF baskı, serigrafi emprime, parça tişört baskı ve özel kimyasal efektlerle markanızın tasarım vizyonunu kumaşa kusursuz aktarıyoruz.', 'assets/images/machines/dtf-printer-station.svg', NULL, 'Teklif Talep Edin', 'teklif-al/', '{\"s1\":{\"tag\":\"Karar Rehberi\",\"title\":\"Hangi Baskı Teknolojisi Projenize Uygun?\",\"desc\":\"Sipariş adediniz, deseninizin renk yapısı ve kumaş türünüze göre en verimli seçimi yapabilmeniz için karşılaştırma tablosu.\"}}', 'Hizmetlerimiz | Nizamlar Baskı', 'DTF baskı, serigrafi, parça baskı, su bazlı ve plastik baskı çözümleri.', 'dtf transfer, serigrafi, emprime baskı, parça baskı'),

('published', 'makine-parkurumuz', 'Makine Parkurumuz', 'Yüksek Kapasiteli Endüstriyel Makine Parkuru', 'Günde 50.000+ parça baskı kapasitesi, mikron düzeyinde renk doğruluğu ve son teknoloji otomasyon sistemleri.', 'Endüstriyel Teknoloji &\n*Gelişmiş Makine* Parkuru', 'Otomatik döner serigrafi ahtapotlarından yeni nesil rulo DTF sistemlerine ve hassas kalıphane pozlama ünitelerine kadar üretim altyapımız.', 'assets/images/machines/screen-print-carousel.svg', NULL, 'Kapasite Raporu İste', 'teklif-al/', '{\"s1\":{\"tag\":\"Donanım Altyapısı\",\"title\":\"Yüksek Hassasiyetli Üretim Hatları\",\"desc\":\"Tesisimizde kullanılan endüstriyel makineler düzenli olarak kalibre edilir; mikron düzeyinde renk hizalaması ve standart kalite sağlanır.\"}}', 'Makine Parkurumuz | Nizamlar Baskı', 'Son teknoloji DTF baskı makineleri, otomatik ahtapot serigrafi makineleri ve fikse tünelleri.', 'baskı makineleri, m&r serigrafi, kornit dtf, tekstil baskı makineleri'),

('published', 'uretim-surecleri', 'Üretim Süreçlerimiz', 'Tasarım Aşamasından Son Sevkiyata Kusursuz Süreç', 'Renk ayrımından fikseleme ve kalite kontrol kontrollerine kadar titizlikle yürütülen 6 aşamalı üretim protokolü.', 'Fikirden Kumaşa\n*7 Aşamalı* Üretim Disiplini', 'Beydur referanslı kurumsal süreç mimarimizde her baskı projesi, milimetrik hassasiyet ve uluslararası kalite kontrol aşamalarıyla hayata geçirilir.', 'assets/images/simulations/dtf-step-3.svg', NULL, 'Süreçleri İnceleyin', 'galeri/', '{}', 'Üretim Süreçleri | Nizamlar Baskı', 'Tekstil baskısında aşama aşama üretim kontrol protokolleri ve kalite testleri.', 'baskı süreci, renk ayrımı, fikseleme, yıkama testi'),

('published', 'galeri', 'Üretim Galerisi', 'Baskı Örneklerimiz ve Üretim Detayları', 'Farklı kumaş türleri, desen teknikleri ve özel efektlerle üretilmiş zengin portföyümüzü keşfedin.', 'Üretim Galerisi &\n*Uygulama* Örnekleri', 'DTF transfer detaylarından otomatik ahtapot serigrafi makinelerine, kumaş tuşesinden bitmiş konfeksiyon ürünlerine kadar atölyemizden canlı kareler.', 'assets/images/products/hoodie-graphic-streetwear.svg', NULL, 'Numune Talep Et', 'teklif-al/', '{}', 'Üretim & Ürün Galerisi | Nizamlar Baskı', 'Baskılı tekstil ürünleri galerisi. Yüksek çözünürlüklü detay fotoğrafları ve baskı teknikleri.', 'baskı örnekleri, tişört modelleri, hoodie baskı, kurumsal tekstil'),

('published', 'surdurulebilirlik', 'Sürdürülebilirlik', 'Geleceğe Saygılı, Doğa Dostu Tekstil Baskı', 'Su bazlı ekolojik boyalar, OEKO-TEX ve GOTS standartlarıyla sıfır atık hedefli sürdürülebilir üretim.', 'Geleceğe Sorumlu\n*Sürdürülebilir* Üretim Anlayışı', 'Tekstil baskıda çevreye duyarlı kimyasallar, enerji verimliliği ve sıfır atık ilkeleriyle doğaya saygılı bir üretim ekosistemi yönetiyoruz.', 'assets/images/certs/gots.svg', NULL, 'Sertifikalarımız', 'sertifikalarimiz/', '{\"s1\":{\"tag\":\"Politikamız\",\"title\":\"Sürdürülebilirlik İlkelerimiz\"}}', 'Sürdürülebilirlik | Nizamlar Baskı', 'Ekolojik tekstil baskı politikamız, GOTS ve OEKO-TEX sertifikasyonlarımız.', 'ekolojik baskı, su bazlı boya, gots tekstil, oeko-tex baskı'),

('published', 'sertifikalarimiz', 'Sertifikalarımız', 'Uluslararası Kalite Standartları ve Sertifikalar', 'Dünya standartlarında üretim ve güvenlik belgelerimizle şeffaf kalite güvencesi.', 'Uluslararası Kalite &\n*Sertifikasyon* Belgelerimiz', 'Tekstil baskı süreçlerimizin küresel standartlara, insan sağlığı normlarına ve ekolojik yeterliliklere tam uyumu belgelenmiştir.', 'assets/images/certs/oeko-tex.svg', NULL, 'Belgeleri İncele', '#belgeler', '{\"s1\":{\"tag\":\"Yeterlilik & Güvence\",\"title\":\"Küresel Standartlarda Üretim Belgeleri\",\"desc\":\"İhracatçı müşterilerimizin ve dünya markalarının talep ettiği ekolojik ve kalite yönetim sertifikalarımız.\"}}', 'Sertifikalarımız | Nizamlar Baskı', 'OEKO-TEX 100, GOTS, ISO 9001 ve ISO 14001 kalite sertifikalarımız.', 'oeko-tex 100, gots sertifikası, iso 9001 tekstil'),

('published', 'referanslarimiz', 'Referanslarımız', 'Güvenini Kazandığımız Değerli İş Ortaklarımız', 'Türkiye\'nin ve dünyanın önde gelen hazır giyim ve moda markalarına gururla hizmet veriyoruz.', 'Güvenle Büyüyen\n*Sektörel İş* Birliklerimiz', 'Tekstil ihracatının öncü üreticilerinden bağımsız hazır giyim tasarımcılarına kadar geniş bir müşteri portföyüne kesintisiz baskı hizmeti veriyoruz.', 'assets/images/products/sweat-oversize-back.svg', NULL, 'İş Ortağımız Olun', 'teklif-al/', '{\"s1\":{\"tag\":\"İş Ortaklarımız\",\"title\":\"Hizmet Verdiğimiz Sektörel Alanlar\",\"desc\":\"Gizlilik sözleşmelerimiz kapsamında iş ortaklarımızın koleksiyon tasarımlarını titizlikle koruyor, termin sürelerine sadakatle üretim yapıyoruz.\"}}', 'Referanslarımız | Nizamlar Baskı', 'Nizamlar Baskı kurumsal referansları, iş ortakları ve başarılı tekstil projeleri.', 'tekstil referansları, marka iş birlikleri'),

('published', 'blog', 'Blog', 'Tekstil Baskı Dünyasından Güncel Bilgiler', 'DTF baskı püf noktaları, serigrafi avantajları ve sektör trendlerini derlediğimiz içerikler.', 'Tekstil Baskı Dünyası &\n*Sektörel Teknik* Rehberler', 'Doğru baskı tekniği seçimi, ekolojik boya standartları, kumaş özellikleri ve endüstriyel üretim ipuçları.', 'assets/images/products/tee-multicolor-artistic.svg', NULL, 'Yazıları Keşfet', '#yazilar', '{}', 'Sektörel Blog | Nizamlar Baskı', 'Tekstil baskı teknolojileri, DTF vs serigrafi karşılaştırmaları ve teknik makaleler.', 'tekstil blog, dtf baskı rehberi, serigrafi ipuçları'),

('published', 'iletisim', 'İletişim', 'Bizimle İletişime Geçin', 'Tekstil baskı projeleriniz için teknik danışmanlarımızla hemen görüşün, üretim tesisimizi ziyaret edin.', 'Bizimle İletişime Geçin &\n*Atölyemizi* Ziyaret Edin', 'Tekstil baskı projeleriniz, numune talepleriniz ve teknik danışmanlık için uzman müşteri temsilcilerimiz hizmetinizdedir.', 'assets/images/logo-light.svg', NULL, 'WhatsApp ile Yazın', 'https://wa.me/905320000000', '{}', 'İletişim & Konum | Nizamlar Baskı', 'Nizamlar Baskı iletişim bilgileri, fabrika adresi, telefon ve e-posta.', 'nizamlar baskı iletişim, telefon, adres, fabrika'),

('published', 'teklif-al', 'Teklif Al', 'Projeniz İçin Hızlı ve Detaylı Fiyat Teklifi Alın', 'Baskı detaylarınızı girin, tasarım dosyanızı yükleyin; uzman ekibimiz en uygun maliyet analizini dakikalar içinde hazırlasın.', 'Baskı Projeniz İçin\n*Detaylı Teklif* Talep Formu', 'Teknik parametreleri belirleyin, tasarım dosyanızı yükleyin ve adetlerinizi belirtin. Satış ve üretim mühendislerimiz aynı gün içinde en uygun fiyat ve termin tablonuzu iletsin.', 'assets/images/products/tee-oversize-graphic.svg', NULL, 'Formu Doldurun', '#teklif-formu', '{}', 'Online Fiyat Teklifi Al | Nizamlar Baskı', 'Tekstil baskı fiyat teklifi formu. Tasarım yükleyin, anında teklif alın.', 'baskı teklifi al, tişört baskı fiyatları, toptan tekstil baskı teklifi')
ON DUPLICATE KEY UPDATE `page_name`=VALUES(`page_name`);

-- 6. Hizmetler (Services)
INSERT INTO `services` (`status`, `sort`, `title`, `slug`, `badge`, `capacity_info`, `short_desc`, `content`, `cover_image`, `features`)
VALUES
('published', 1, 'DTF Transfer Baskı', 'dtf-baski', 'Popüler & Esnek', 'Günlük 15.000+ Metre / 1440 DPI', 'Pamuk, polyester, koton-elastan ve her türlü kumaş zeminine kusursuz renk geçişi, yüksek esneklik ve yıkama dayanımı.', '<p>DTF (Direct to Film) baskı teknolojisi, tekstil baskı sektöründe devrim yaratan en modern dijital transfer yöntemidir. 1440 DPI çözünürlükte baskı kafaları sayesinde mikro detaylar, degrade tonlamalar ve 16 milyon renk tonu kumaşa mükemmel biçimde aktarılır.</p>', 'assets/images/machines/dtf-printer-station.svg', '["1440 DPI Ultra Yüksek Çözünürlük", "Her Kumaş Türüyle %100 Uyumlu", "60°C Yıkama ve Sürtünme Dayanımı", "Düşük ve Yüksek Adetlerde Hızlı Teslimat"]'),
('published', 2, 'Otomatik Serigrafi Baskı', 'serigrafi-baski', 'Yüksek Kapasite', 'Günlük 35.000+ Parça Baskı', 'M&R ve MHM otomatik ahtapot serigrafi parkurumuzla yüksek adetli ihracat ve kurumsal siparişlerde benzersiz maliyet avantajı.', '<p>Büyük ölçekli tekstil üretiminde tartışmasız lider olan serigrafi baskı, yüksek kapatıcılık ve uzun ömürlü renk canlılığı sunar. Su bazlı, plastik, aşındırma (discharge), kabartma (puff) ve sim efektleriyle sınırsız tasarım özgürlüğü sağlar.</p>', 'assets/images/machines/screen-print-carousel.svg', '["Otomatik 10 ve 12 Renk Ahtapot Makineler", "GOTS ve OEKO-TEX Uyumlu Ekolojik Boyalar", "Özel Efektler: Kabartma, Varak, Sim, Reflektif", "Endüstriyel Gazlı Fikse Tünelleri"]'),
('published', 3, 'Tişört & Tekstil Parça Baskı', 'tisort-baski', 'Hızlı Termin', 'Günlük 25.000+ Tişört', 'Oversize, slim fit, polo ve v-yaka tişörtlerde ön göğüs, sırt, kol ve paça bölgelerine özel parça baskı uygulamaları.', '<p>Markaların hazır giyim koleksiyonları ve kurumsal promosyon projeleri için optimize edilmiş tişört baskı hattımız, kumaşın dokusunu bozmadan nefes alan baskılar üretir.</p>', 'assets/images/products/tee-back-streetwear.svg', '["Nefes Alan Yumuşak Tuşe (Soft Handfeel)", "Dikiş Üstü ve Kenardan Kenara Baskı", "Ön / Sırt / Kol Kombinasyonları", "Paketleme ve Etiketleme Hizmeti"]'),
('published', 4, 'Konfeksiyon Parça Baskı (Emprime)', 'emprime-parca-baski', 'Endüstriyel Hassasiyet', 'Günde 40.000+ Parça', 'Kesilmiş kumaş panelleri üzerine dikiş öncesi mikron hassasiyetinde parça emprime baskı çözümleri.', '<p>Montaj öncesi kumaş parçalarına uygulanan emprime baskı, karmaşık giysi kalıplarında kusursuz desen yerleşimi sağlar.</p>', 'assets/images/simulations/dtf-step-4.svg', '["Lazer Hizalamalı Hassas Tablalar", "Kalıp Geometrisine Özel Pozlama", "Kapsamlı Kalite Kontrol Protokolü"]')
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`);

-- 7. Ürünler (Products)
INSERT INTO `products` (`status`, `sort`, `name`, `category`, `description`, `cover_image`, `back_image`, `print_technique`, `pattern_type`, `fabric_details`, `featured`)
VALUES
('published', 1, 'Oversize Streetwear Grafik Tişört', 'Tişört', 'Yüksek çözünürlüklü DTF transfer ve yumuşak tuşe baskı. 240 GSM kompakt penye pamuk kumaş üzerinde solmaya karşı ultra dayanıklı baskı.', 'assets/images/products/tee-oversize-graphic.svg', 'assets/images/products/tee-back-streetwear.svg', 'DTF Transfer Baskı', 'Vektörel & Tipografik Grafik', '%100 Kompakt Penye Pamuk (240 GSM)', 1),
('published', 2, 'Vintage Yıkamalı Sanatsal Tişört', 'Tişört', 'Asit yıkama efektli zemin üzerinde mikro degrade serigrafi baskı. Nefes alan su bazlı boyalar ile kumaşla bütünleşen doku.', 'assets/images/products/tee-front-vintage.svg', 'assets/images/products/tee-blank-cotton.svg', 'Su Bazlı Serigrafi', 'Foto-Gerçekçi Degrade', '%100 Organik Ring Pamuk (200 GSM)', 1),
('published', 3, 'Minimalist Göğüs Logo Tişört', 'Tişört', 'Yüksek keskinlikte mikro tipografi ve kabartma (puff) logo baskısı. Kurumsal koleksiyonlar için ideal zarif görünüm.', 'assets/images/products/tee-minimal-logo.svg', 'assets/images/products/tee-blank-cotton.svg', 'Mikro DTF & Kabartma', 'Tipografik & Logo', '%100 Penye Pamuk (180 GSM)', 1),
('published', 4, 'Çok Renkli İllüstrasyon Tişört', 'Tişört', '1440 DPI endüstriyel DTF teknolojisiyle basılmış 16 milyon renk derinliğine sahip sanatsal çizim uygulaması.', 'assets/images/products/tee-multicolor-artistic.svg', 'assets/images/products/tee-back-streetwear.svg', '1440 DPI DTF Baskı', 'Sanatsal İllüstrasyon', '%100 Pamuk Süprem (220 GSM)', 1),
('published', 5, 'Premium Fermuarlı Ağır Hoodie', 'Hoodie', '400 GSM üç iplik şardonlu kumaş üzerine sırt paneli geniş ebat serigrafi ve kolda reflektif baskı.', 'assets/images/products/hoodie-graphic-streetwear.svg', 'assets/images/products/sweat-oversize-back.svg', 'Ahtapot Serigrafi & Reflektif', 'Vektörel Grafik & Reflektif', 'Üç İplik Şardonlu %80 Pamuk / %20 Polyester (400 GSM)', 1),
('published', 6, 'Kanguru Cepli Streetwear Hoodie', 'Hoodie', 'Ön göğüs kabartma logo, kolda tipografik şerit ve sırtta yüksek kontrastlı endüstriyel baskı.', 'assets/images/products/sweat-front-artwork.svg', 'assets/images/products/sweat-oversize-back.svg', 'DTF & Kabartma (Puff)', 'Tipografik & Grafik', '%100 Pamuk Üç İplik (360 GSM)', 1),
('published', 7, 'Ton-Sür-Ton Premium Sweatshirt', 'Sweatshirt', 'Kumaş rengiyle monokrom uyumlu mat silikon baskı. Lüks hazır giyim standartlarında sofistike dokunuş.', 'assets/images/products/sweat-ton-sur-ton.svg', 'assets/images/products/sweat-blank-fleece.svg', 'Mat Silikon Serigrafi', 'Ton-Sür-Ton', '%100 Karbon Fırçalı Pamuk (320 GSM)', 0),
('published', 8, 'Oversize Sırt Baskılı Sweatshirt', 'Sweatshirt', 'Tüm sırtı kaplayan 50x70 cm mega format baskı. Yıkamada çatlama ve soyulma yapmayan elastik polimer transfer.', 'assets/images/products/sweat-oversize-back.svg', 'assets/images/products/sweat-front-artwork.svg', 'Mega Format DTF Transfer', 'Büyük Boy Sanatsal Grafik', 'İki İplik Diyagonal Pamuk (300 GSM)', 0),
('published', 9, 'Yan Paça Tipografik Jogger Eşofman', 'Eşofman', 'Yan dikiş üzerinden kesintisiz uzanan 70 cm boylamasına esnek serigrafi baskı.', 'assets/images/products/jogger-side-leg.svg', 'assets/images/products/jogger-blank.svg', 'Elastik Serigrafi', 'Tipografik Şerit', '%100 Penye Pamuk Eşofman Kumaşı (280 GSM)', 0),
('published', 10, 'Uyluk Baskılı Pamuklu Jogger Pantolon', 'Pantolon', 'Diz üstü uyluk bölgesine uygulanan aşınmaya ve sürtünmeye dayanıklı endüstriyel DTF baskı.', 'assets/images/products/jogger-graphic-thigh.svg', 'assets/images/products/jogger-blank.svg', 'Endüstriyel DTF', 'Mikro Grafik Logo', '%95 Pamuk / %5 Elastan Gabardin', 0),
('published', 11, 'Özel Tasarım Nefes Alan Spor Forma', 'Forma', 'Dry-fit mikro gözenekli kumaşlarda teri hapsetmeyen, kumaş liflerine nüfuz eden süblime ve nefes alan parça baskı.', 'assets/images/products/sports-jersey.svg', 'assets/images/products/tee-blank-cotton.svg', 'Dry-Fit Nefes Alan Transfer', 'Spor Takım & Numara', '%100 Mikro Polyester Dry-Touch (150 GSM)', 0),
('published', 12, 'Ağır Kanvas Bez Çanta (Tote Bag)', 'Diğer tekstil ürünleri', '320 GSM ham pamuk kanvas zemin üzerine çift vuruş opak serigrafi baskı.', 'assets/images/products/tote-bag-canvas.svg', 'assets/images/products/tote-bag-canvas.svg', 'Opak Serigrafi', 'İllüstrasyon & Tipografi', '%100 Ham Pamuk Kanvas (320 GSM)', 0)
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- 8. Makineler (Machines)
INSERT INTO `machines` (`status`, `sort`, `name`, `brand_model`, `category`, `print_type`, `capacity`, `description`, `image`, `specs`, `is_active`)
VALUES
('published', 1, 'Kornit Avalanche HD6 Endüstriyel Dijital / DTF Baskı İstasyonu', 'Kornit Avalanche HD6', 'Dijital & DTF Baskı', 'DTF & DTG Hibrit', 'Günde 3.500+ Parça / 1200 DPI', 'Endüstriyel 6 renkli (CMYK + Kırmızı + Yeşil) + Çift Beyaz su bazlı mürekkep mimarisi. Patentli Neopigment boyalarıyla en yüksek renk gamutunu sunar.', 'assets/images/machines/dtf-printer-station.svg', '{\"Baskı Alanı\":\"60 x 90 cm\",\"Maksimum Çözünürlük\":\"1200 x 1200 DPI\",\"Kafa Sayısı\":\"24 Fuji Dimatix Kafa\",\"Mürekkep\":\"Su Bazlı Ekolojik Pigment\"}', 1),
('published', 2, 'M&R Sportsman EXG 10 Renk Otomatik Ahtapot Serigrafi Makinesi', 'M&R Sportsman EXG 10/12', 'Otomatik Serigrafi', 'Serigrafi & Özel Efekt', 'Saatte 850 Parça / Günde 18.000 Parça', 'Amerikan M&R mühendisliğiyle üretilmiş, servo motorlu mikro kayıt hassasiyetine sahip yüksek hızlı otomatik serigrafi ahtapotu.', 'assets/images/machines/screen-print-carousel.svg', '{\"Renk Sayısı\":\"10 Renk / 12 İstasyon\",\"Maksimum Format\":\"51 x 51 cm\",\"Hız\":\"850 vuruş / saat\",\"Kayıt Hassasiyeti\":\"±0.02 mm Mikro Kayıt\"}', 1),
('published', 3, 'Brother GTX Pro Bulk Endüstriyel Parça Baskı Ünitesi', 'Brother GTX Pro Bulk', 'Dijital Parça Baskı', 'Direkt Kumaşa & Transfer', 'Günde 2.000 Parça', 'Sürekli mürekkep besleme sistemli, dahili beyaz sirkülasyonlu endüstriyel DTF ve parça baskı makinesi.', 'assets/images/machines/dtf-printer-station.svg', '{\"Baskı Alanı\":\"40 x 53 cm\",\"Kafa Teknolojisi\":\"Brother Industrial Piezo\",\"Yıkama Dayanımı\":\"ISO 105-C06 Standardı\"}', 1),
('published', 4, 'Monti Antonio Çift Tablalı Pnömatik Sıcak Transfer Pres İstasyonu', 'Monti Antonio Mod. 200', 'Fikse ve Transfer Presi', 'Termal Fikseleme', 'Saatte 600 Transfer', 'Dijital termostat kontrollü, 0-8 bar pnömatik hidrolik basınçlı çift tablalı endüstriyel transfer presi.', 'assets/images/machines/heat-press-station.svg', '{\"Tabla Ölçüsü\":\"50 x 70 cm\",\"Maksimum Sıcaklık\":\"230°C Homojen Isı\",\"Basınç\":\"0-8 Bar Pnömatik\"}', 1),
('published', 5, 'Chiossi e Cavazzuti Endüstriyel Gazlı / Konveksiyonel Fikse Tüneli', 'Chiossi e Cavazzuti DLE-10', 'Kurutma & Fikse Tüneli', 'Sürekli Kurutma', 'Saatte 1.500 Parça Fikseleme', 'Kumaş liflerinin derinliklerine kadar boyayı polimerize eden hava sirkülasyonlu, homojen ısı kontrollü fırın.', 'assets/images/simulations/dtf-step-5.svg', '{\"Tünel Uzunluğu\":\"8 Metre\",\"Bant Genişliği\":\"150 cm\",\"Hava Debisi\":\"Yüksek Debili Sirkülasyon\"}', 1)
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- 9. Üretim Süreçleri (Production Processes)
INSERT INTO `production_processes` (`status`, `sort`, `step_number`, `title`, `short_desc`, `detail_text`, `duration_info`, `image`)
VALUES
('published', 1, 1, 'Tasarım Analizi ve Renk Ayrımı', 'Vektör ve piksel tasarımlar kumaş türüne göre analiz edilir, Pantone ve CMYK kodları ayrıştırılır.', 'Müşteriden gelen artwork teknik ekibimizce rip yazılımına aktarılır. Tram açıları, mürekkep yoğunluğu ve astar tabakası hesaplanır.', '1-2 İş Saati', 'assets/images/simulations/dtf-step-1.svg'),
('published', 2, 2, 'Film & İpek Kalıp Hazırlığı', 'Baskı türüne göre 1440 DPI taşıyıcı PET film veya lazer pozlamalı ipek elek kalıpları hazırlanır.', 'Kalıpların ipek gerginliği newtonmetre ile ölçülür. DTF filmlerinde mikron hassasiyetinde antistatik kaplama kontrol edilir.', '2-3 İş Saati', 'assets/images/simulations/dtf-step-2.svg'),
('published', 3, 3, 'Yüksek Hassasiyetli Baskı Uygulama', 'Endüstriyel baskı istasyonlarında mikron düzeyinde kayıtla boya kumaşa veya transfer filmine aktarılır.', 'Çift piezo kafa teknolojisiyle renk ve opak beyaz astar milimetrik senkronla basılır.', 'Siparişe Göre', 'assets/images/simulations/dtf-step-3.svg'),
('published', 4, 4, 'Sıcak Tutkallama ve Kurutma', 'Baskılı yüzeye otomatik çalkalama ünitesinde sıcak eriyen polimer toz uygulanır ve kızılötesi fırınlanır.', 'Homojen tutkal tabakası kumaş lifleriyle boya arasında esnek ve kopmaz bir köprü kurar.', 'Gerçek Zamanlı', 'assets/images/simulations/dtf-step-4.svg'),
('published', 5, 5, 'Termal Fikseleme & Presleme', '160°C sıcaklık ve 6 bar basınç altında desen kumaş liflerine kalıcı olarak kilitlenir.', 'Pnömatik pres makineleri her santimetrekareye eşit basınç uygulayarak yıkama dayanımını garanti eder.', '15-20 Saniye/Parça', 'assets/images/simulations/dtf-step-5.svg'),
('published', 6, 6, 'Kalite Kontrol, Soyum & Paketleme', 'Soğuk soyumla taşıyıcı film ayrılır, optik spektrometre ile renk ve esneklik kontrolleri yapılıp sevk edilir.', 'Sürtünme testi, yıkama dayanımı simülasyonu ve ışık kabini kontrolünden geçen ürünler özenle paketlenir.', 'Final Aşaması', 'assets/images/simulations/dtf-step-6.svg')
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`);

-- 10. Referanslar (References)
INSERT INTO `references` (`status`, `sort`, `company_name`, `industry`, `logo`, `collaboration_type`, `featured`)
VALUES
('published', 1, 'Defacto Tekstil', 'Hazır Giyim & Moda', 'assets/images/logo.svg', 'Kurumsal DTF & Serigrafi Çözüm Ortaklığı', 1),
('published', 2, 'LC Waikiki', 'Perakende Moda', 'assets/images/logo.svg', 'Yüksek Hacimli Parça Baskı Üretimi', 1),
('published', 3, 'Koton', 'Hazır Giyim', 'assets/images/logo.svg', 'Trend Koleksiyon Parça Baskıları', 1),
('published', 4, 'Mavi Jeans', 'Denim & Streetwear', 'assets/images/logo.svg', 'Özel Seri Tişört ve Hoodie Baskıları', 1),
('published', 5, 'Colin\'s', 'Casual Giyim', 'assets/images/logo.svg', 'Serigrafi Parça Baskı', 1),
('published', 6, 'Sarar', 'Klasik & Casual Tekstil', 'assets/images/logo.svg', 'Hassas Mikro Logo Uygulamaları', 1),
('published', 7, 'Beymen Club', 'Lüks Hazır Giyim', 'assets/images/logo.svg', 'Yüksek Segment Mat Silikon Baskı', 1),
('published', 8, 'Network', 'Modern Tekstil', 'assets/images/logo.svg', 'Özel Kumaş Karışımlı Koleksiyonlar', 1)
ON DUPLICATE KEY UPDATE `company_name`=VALUES(`company_name`);

-- 11. Sertifikalar (Certificates)
INSERT INTO `certificates` (`status`, `sort`, `title`, `organization`, `certificate_no`, `validity`, `description`, `image`)
VALUES
('published', 1, 'OEKO-TEX Standard 100', 'OEKO-TEX Association', '21.HTR.00000', '2026 - 2027', 'Kullanılan tüm baskı kimyasalları, boyalar ve tutkalların zararlı maddeler içermediğini ve bebek tenine dahi zararsız olduğunu onaylar.', 'assets/images/certs/oeko-tex.svg'),
('published', 2, 'GOTS (Global Organic Textile Standard)', 'GOTS International Working Group', 'GOTS-TR-2026-88', '2026 - 2027', 'Organik tekstil ürünlerinde çevreye saygılı ve sosyal kriterlere uygun üretim sürecini tescil eder.', 'assets/images/certs/gots.svg'),
('published', 3, 'ISO 9001:2015 Kalite Yönetim Sistemi', 'TÜV Rheinland / TÜRKAK', 'ISO-9001-TR-9182', '2025 - 2028', 'Üretim süreçlerinde sürekli iyileştirme, sıfır hata toleransı ve müşteri memnuniyeti yönetim sistemini belgeler.', 'assets/images/certs/iso9001.svg'),
('published', 4, 'ISO 14001:2015 Çevre Yönetim Sistemi', 'TÜV Rheinland', 'ISO-14001-TR-4421', '2025 - 2028', 'Atık su geri kazanımı, enerji verimliliği ve çevreye sıfır kimyasal salınım ilkeleriyle üretim yapıldığını onaylar.', 'assets/images/certs/iso14001.svg')
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`);

-- 12. Blog Yazıları (Blog Posts)
INSERT INTO `blog_posts` (`status`, `sort`, `title`, `slug`, `category`, `author`, `read_time`, `published_date`, `summary`, `content`, `cover_image`)
VALUES
('published', 1, 'Tekstilde Sürdürülebilir Baskı Teknikleri ve Geleceğin Çevre Standartları', 'tekstilde-surdurulebilir-baski-teknikleri', 'Sürdürülebilirlik', 'Nizamlar Baskı Ar-Ge Ekibi', '6 Dakika', '2026-04-10', 'Geleneksel boyama ve baskı yöntemlerinin yerini alan su bazlı pigmentler, sıfır atık ilkeleri ve OEKO-TEX sertifikasyonunun tekstil ihracatındaki kritik önemi.', '<p>Tekstil endüstrisi, karbon ayak izini ve su tüketimini azaltmak amacıyla büyük bir dönüşüm geçirmektedir. Bu dönüşümün en önemli halkalarından birini baskı teknolojileri oluşturmaktadır.</p><p>Su bazlı boyalar ve solvent içermeyen DTF tutkalları, hem insan sağlığına tam uyum sağlamakta hem de doğaya sıfır toksik atık bırakmaktadır.</p>', 'assets/images/certs/gots.svg'),
('published', 2, 'DTF Baskı ve Serigrafi Karşılaştırması: Hangi Projede Hangi Teknik Tercih Edilmeli?', 'dtf-baski-ve-serigrafi-karsilastirmasi', 'Teknik Kılavuz', 'Teknik Üretim Direktörlüğü', '5 Dakika', '2026-03-22', 'Adet, renk sayısı, kumaş türü ve teslimat takvimine göre DTF transfer ile geleneksel serigrafi arasındaki maliyet ve performans analizi.', '<p>Tasarımcıların ve marka yöneticilerinin en sık karşılaştığı kararlardan biri baskı tekniği seçimidir. DTF baskı, çok renkli ve degrade içeren işlerde düşük adetlerde dahi kalıp maliyetsiz avantaj sağlarken; serigrafi 5.000 adet üzeri siparişlerde birim maliyet lideridir.</p>', 'assets/images/machines/dtf-printer-station.svg'),
('published', 3, 'Yüksek Adetli Kurumsal Tekstil Baskısında Maliyet ve Kalite Optimizasyonu', 'yuksek-adetli-kurumsal-tekstil-baskisi', 'Endüstriyel Üretim', 'Nizamlar Operasyon Departmanı', '7 Dakika', '2026-02-15', 'Büyük ölçekli üretim partilerinde renk standardizasyonu, numune onay süreci ve ihracat ambalajlama standartları.', '<p>Yıllık milyonlarca parça üreten küresel markalar için en kritik unsur her mağazada ve her sezonda aynı renk tonunun yakalanmasıdır. Lazer kayıt sistemleri ve spektrofotometre kontrolleriyle bu riskler sıfırlanır.</p>', 'assets/images/machines/screen-print-carousel.svg')
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`);

-- 13. Video ve Animasyonlar (Animations Config)
INSERT INTO `animations_config` (`status`, `key`, `title`, `target_page`, `video_url`, `mobile_video_url`, `poster_image`, `animation_type`, `animation_duration_ms`, `autoplay`, `loop`, `muted`)
VALUES
('published', 'hero_video', 'Ana Sayfa Hero Baskı Makinesi Videosu', 'Ana Sayfa', 'assets/videos/production-loop.mp4', 'assets/videos/production-loop.mp4', 'assets/images/products/tee-back-streetwear.svg', 'Fade', 800, 1, 1, 1),
('published', 'before_after_slider', 'İnteraktif Baskı Öncesi / Sonrası Karşılaştırma Efekti', 'Ana Sayfa & Galeri', NULL, NULL, NULL, 'Slide', 400, 0, 0, 1),
('published', 'print_reveal_effect', 'Lazer & Ragle Tarama Baskı Ortaya Çıkış Animasyonu', 'Tüm Sayfalar / Ürün Kartları', NULL, NULL, NULL, 'Product Print Reveal', 1200, 1, 0, 1),
('published', 'production_simulation', '6 Aşamalı İnteraktif Üretim Simülasyonu', 'Üretim Süreçleri', NULL, NULL, NULL, 'Mask Reveal', 600, 1, 1, 1)
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`);

-- 14. Menü Öğeleri (Navigation Menus)
INSERT INTO `navigation_menus` (`status`, `sort`, `menu_location`, `title`, `url`, `badge`)
VALUES
('published', 1, 'header', 'Hakkımızda', '/hakkimizda/', NULL),
('published', 2, 'header', 'Hizmetlerimiz', '/hizmetlerimiz/', NULL),
('published', 3, 'header', 'Makine Parkuru', '/makine-parkurumuz/', NULL),
('published', 4, 'header', 'Üretim Süreçleri', '/uretim-surecleri/', NULL),
('published', 5, 'header', 'Galeri', '/galeri/', NULL),
('published', 6, 'header', 'Referanslar', '/referanslarimiz/', NULL),
('published', 7, 'header', 'Sertifikalar', '/sertifikalarimiz/', NULL),
('published', 8, 'header', 'Sürdürülebilirlik', '/surdurulebilirlik/', NULL),
('published', 9, 'header', 'Blog', '/blog/', NULL),
('published', 10, 'header', 'İletişim', '/iletisim/', NULL),
('published', 11, 'header', 'Fiyat Teklifi Al', '/teklif-al/', 'Hızlı Teklif')
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`);

-- 15. SEO Ayarları (SEO Settings)
INSERT INTO `seo_settings` (`page_slug`, `meta_title`, `meta_description`, `meta_keywords`, `og_image`)
VALUES
('home', 'Nizamlar Baskı | Tekstil Baskıda Renk, Kalite ve Güven', 'Nizamlar Baskı; DTF baskı, serigrafi baskı, tişört ve konfeksiyon parça baskı alanlarında ileri teknoloji makine parkuruyla profesyonel çözümler sunar.', 'tekstil baskı, DTF baskı, serigrafi baskı, tişört baskı, emprime', 'assets/images/products/tee-back-streetwear.svg'),
('hakkimizda', 'Hakkımızda | Nizamlar Baskı', 'Nizamlar Baskı kurumsal tarihi, misyonu, vizyonu ve endüstriyel tekstil baskı alanındaki uzmanlığı.', 'nizamlar baskı kurumsal, tekstil baskı firması', 'assets/images/machines/screen-print-carousel.svg'),
('hizmetlerimiz', 'Hizmetlerimiz | Nizamlar Baskı', 'DTF baskı, serigrafi, parça baskı, su bazlı ve plastik baskı çözümleri.', 'dtf transfer, serigrafi, emprime baskı', 'assets/images/machines/dtf-printer-station.svg'),
('teklif-al', 'Online Fiyat Teklifi Al | Nizamlar Baskı', 'Tekstil baskı fiyat teklifi formu. Tasarım yükleyin, anında teklif alın.', 'baskı teklifi al, tişört baskı fiyatları', 'assets/images/products/tee-oversize-graphic.svg')
ON DUPLICATE KEY UPDATE `meta_title`=VALUES(`meta_title`);

SET FOREIGN_KEY_CHECKS = 1;
