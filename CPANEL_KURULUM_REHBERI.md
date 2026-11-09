# NİZAMLAR BASKI — TÜRKTiCARET CPANEL KURULUM VE GEÇİŞ REHBERİ

Bu rehber, **Nizamlar Baskı** kurumsal web sitesinin ve PHP + MySQL yönetim panelinin TürkTicaret Limitsiz Plus Hosting (cPanel) üzerinde sıfırdan veya AWS geçişiyle yayına alınması için gereken tüm adımları adım adım açıklar.

---

## 1. Hazırlık ve Önkoşullar

- **Hosting Paketi**: TürkTicaret Limitsiz Plus Hosting
- **Sunucu Yazılımı**: Apache 2.4+
- **PHP Sürümü**: PHP 8.1, 8.2, 8.3 veya 8.4
- **Gerekli PHP Eklentileri**: `pdo_mysql`, `mbstring`, `fileinfo`, `json`, `openssl`, `curl` (cPanel "Select PHP Version" ekranından varsayılan olarak etkindir).
- **Dağıtım Paketi**: `nizamlar-cpanel-deploy.zip`
- **Veritabanı Dosyası**: `database.sql`

---

## 2. Adım Adım Kurulum

### Adım 1: MySQL Veritabanı ve Kullanıcısı Oluşturma
1. TürkTicaret cPanel'e giriş yapın (`https://alanadiniz.com:2083`).
2. **Veritabanları (Databases)** bölümünden **MySQL® Veritabanı Sihirbazı**'nı (MySQL Database Wizard) açın.
3. Yeni bir veritabanı adı belirleyin (Örnek: `nizamlar_db`).
4. Güçlü bir veritabanı kullanıcısı ve şifresi oluşturun:
   - Kullanıcı: `nizamlar_user`
   - Şifre: *Güçlü bir parola üretin ve bir yere not edin.*
5. Kullanıcıya **Tüm İzinleri (ALL PRIVILEGES)** verin ve işlemi tamamlayın.

### Adım 2: Veritabanı Şemasını (SQL) İçe Aktarma
1. cPanel ana ekranından **phpMyAdmin**'i açın.
2. Sol menüden az önce oluşturduğunuz veritabanını (`nizamlar_db`) seçin.
3. Üst menüden **İçe Aktar (Import)** sekmesine tıklayın.
4. **Dosya Seç** butonuna tıklayarak dağıtım paketindeki `database.sql` dosyasını seçin.
5. Karakter kümesinin `utf8mb4` olduğunu kontrol edip **İçe Aktar (Go)** butonuna tıklayın.
6. 20 tablonun ve başlangıç verilerinin eksiksiz yüklendiğini teyit edin.

### Adım 3: Dosyaları cPanel'e Yükleme
1. cPanel ana ekranından **Dosya Yöneticisi (File Manager)** uygulamasını açın.
2. `public_html/` dizinine gidin.
3. Üst menüden **Yükle (Upload)** butonuna tıklayın ve `nizamlar-cpanel-deploy.zip` dosyasını yükleyin.
4. Yükleme tamamlandıktan sonra ZIP dosyasına sağ tıklayıp **Extract (Çıkart)** seçeneğini seçin (`public_html/` içine).
5. Klasör yapısının şu şekilde olduğunu doğrulayın:
   ```
   public_html/
   ├── .htaccess
   ├── index.html
   ├── 404.html
   ├── hakkimizda/
   ├── hizmetlerimiz/
   ├── blog/
   ├── makine-parkurumuz/
   ├── uretim-surecleri/
   ├── referanslarimiz/
   ├── sertifikalarimiz/
   ├── iletisim/
   ├── teklif-al/
   ├── assets/
   ├── admin/
   ├── api/
   ├── config/
   ├── uploads/
   └── storage/
   ```

### Adım 4: Veritabanı Bağlantısını Yapılandırma
`config/config.php` dosyasını Dosya Yöneticisi üzerinden sağ tıklayıp **Edit (Düzenle)** ile açın:
```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'cpanelkullanici_nizamlar_db');
define('DB_USER', 'cpanelkullanici_nizamlar_user');
define('DB_PASS', 'Veritabani_Sifreniz_Buraya');
```
*Not: cPanel ortamında veritabanı ve kullanıcı adlarının başına cPanel kullanıcı adı ön ek olarak gelir (örneğin: `nizaml5_db`). Bu tam adı yazdığınızdan emin olun.*

Dosyayı kaydedin.

### Adım 5: Klasör İzinlerini Doğrulama
Dosya yöneticisinde aşağıdaki klasör izinlerini kontrol edin:
- `uploads/` -> **755** (yazılabilir)
- `storage/` -> **755** (yazılabilir)
- `storage/quotes/` -> **755** (yazılabilir)
- `storage/logs/` -> **755** (yazılabilir)
- `.htaccess` -> **644**

### Adım 6: İlk Admin Kullanıcısını Oluşturma
1. Tarayıcınızda şu adresi açın:
   `https://nizamlarbaski.com/admin/install.php`
2. Yönetici adınızı, kurumsal e-posta adresinizi ve en az 8 karakterlik güçlü bir parola belirleyin.
3. **"Kurulumu Tamamla ve İlk Yöneticiyi Oluştur"** butonuna tıklayın.
4. Kurulum sihirbazı güvenliğinizi sağlamak için otomatik olarak kilitlenecektir (`storage/install.lock`).
5. Açılan giriş ekranından yeni bilgilerinizle giriş yapın.

### Adım 7: SMTP E-posta Bildirimlerini Yapılandırma
1. Yönetim panelinde **Site Ayarları > SMTP & E-posta Bildirimleri** sekmesine geçin.
2. cPanel'de oluşturduğunuz kurumsal e-posta hesabının bilgilerini girin:
   - **SMTP Host**: `mail.nizamlarbaski.com`
   - **Port**: `587`
   - **Şifreleme**: `TLS`
   - **Kullanıcı Adı**: `info@nizamlarbaski.com`
   - **Şifre**: *E-posta şifreniz*
   - **Bildirim E-postası**: `nizamlartekstill@gmail.com` (veya tercih ettiğiniz adres)
3. **"Test E-postası Gönder"** butonuna basarak gelen kutunuza test mesajının ulaştığını teyit edin.

---

## 3. Doğrulama ve Canlı Yayına Alma Kontrol Listesi

| Kontrol Maddesi | Doğrulama Yöntemi | Durum |
| :--- | :--- | :---: |
| **HTTPS Yönlendirmesi** | `http://` ile girildiğinde `https://` protokolüne yönleniyor | [ ] |
| **Ana Sayfa & Animasyonlar** | DTF ve serigrafi simülasyonları, GSAP geçişleri akıcı | [ ] |
| **Mockup Stüdyo** | Tişört, sweatshirt önizleme ve renk seçimi çalışıyor | [ ] |
| **Hizmet & Blog Sayfaları** | `/hizmetlerimiz/dtf-baski/` ve `/blog/...` dinamik açılıyor | [ ] |
| **Admin Giriş / Çıkış** | `/admin/` giriş başarılı; çıkış yapınca oturum sonlanıyor | [ ] |
| **İletişim Formu** | Form doldurulduğunda MySQL'e kaydediliyor ve SMTP bildirimi gidiyor | [ ] |
| **Teklif Formu & Dosya** | PDF/PNG/PSD dosyası yükleniyor, veritabanına ve `storage/quotes/` içine yazılıyor | [ ] |
| **Güvenli Dosya İndirme** | Teklif dosyası yalnızca admin oturumundan indirilebiliyor; doğrudan URL engelli | [ ] |
| **İçerik Güncelleme** | Admin'den değiştirilen telefon/metin sitede anında güncelleniyor | [ ] |
| **Yetkisiz Erişim** | Gizli dizinler (`/config/`, `/storage/`, `/.env`) tarayıcıdan 403 Forbidden veriyor | [ ] |

---

## 4. AWS Sistemini Kapatmadan Önce Yapılacak Kontroller

AWS EC2, Directus ve PostgreSQL sunucularını sonlandırmadan (terminate etmeden) önce:

1. **DNS Yönlendirmesini Doğrulayın**:
   Alan adınızın `A` kaydının TürkTicaret cPanel sunucusunun IP adresine yönlendiğinden ve dünya genelinde yayıldığından emin olun (`nslookup nizamlarbaski.com`).
2. **SSL Sertifikasını Kontrol Edin**:
   cPanel Let's Encrypt / AutoSSL sertifikasının başarıyla kurulduğunu ve yeşil kilit simgesinin yandığını kontrol edin.
3. **AWS Veritabanı Tam Yedeğini Alın**:
   AWS EC2 üzerinde terminalden son PostgreSQL yedeğini alın:
   ```bash
   pg_dump -U postgres -d directus -F c -b -v -f /home/ubuntu/directus_final_backup.dump
   ```
4. **AWS Medya Klasörünü Arşivleyin**:
   ```bash
   tar -czvf /home/ubuntu/directus_uploads_final.tar.gz -C /path/to/cms uploads/
   ```
5. **Gözlem Süresi (48 Saat)**:
   DNS yönlendirmesinden sonra AWS sunucusunu kapatmak yerine 48 saat "Stop" (Durdurulmuş) durumunda bekletin.
6. Tüm formların ve sipariş akışlarının cPanel MySQL üzerinde sorunsuz aktığı onaylandıktan sonra AWS EC2 ve RDS kaynaklarını güvenle sonlandırın.

---

## 5. Geri Dönüş (Rollback) Planı

Olası bir acil durumda eski sisteme 5 dakikada geri dönebilmek için:
1. Alan adınızın DNS yönetim panelinden (TürkTicaret / Cloudflare / Route53) `A` kaydını tekrar eski **AWS EC2 IP adresine** yönlendirin.
2. TTL süresi düşük (örneğin 300 saniye) tutulduğunda trafik derhal eski AWS Directus sunucusuna geri akacaktır.
3. Bu süreçte cPanel'e gelen teklif veya iletişim kayıtları olursa, cPanel phpMyAdmin üzerinden `quote_requests` ve `contact_messages` tablolarını dışa aktarabilirsiniz.
