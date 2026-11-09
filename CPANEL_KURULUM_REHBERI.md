# NİZAMLAR BASKI — TÜRKTiCARET CPANEL KURULUM VE GEÇİŞ REHBERİ

Bu rehber, **Nizamlar Baskı** kurumsal web sitesinin ve PHP + MySQL yönetim panelinin TürkTicaret Limitsiz Plus Hosting (cPanel) üzerinde sıfırdan veya AWS geçişiyle yayına alınması için gereken tüm adımları adım adım açıklar.

---

## 1. Dağıtım Dosyaları ve Mimarisi

Dağıtım için hazırlanan dosyalar birbirinden izole edilmiştir:

1. **`nizamlar-cpanel-deploy.zip`**: Sitenin web kök dizini (HTML, CSS, JS, API, Admin ve PHP çekirdeği) arşivini içerir. **Doğrudan `public_html/` içine açılacak şekilde paketlenmiştir; arşiv içinde fazladan `public_html` klasörü bulunmaz (çift `public_html/public_html` hatası oluşmaz).**
2. **`database.sql`**: 20 ilişkisel tablodan ve başlangıç verilerinden oluşan veritabanı şemasıdır. Güvenlik nedeniyle web ZIP'i içine **konulmamıştır**; bilgisayarınızdan doğrudan cPanel phpMyAdmin ile içe aktarılır.
3. **`.env.example`**: Üretim ortam değişkenleri şablonudur.
4. **`tools/` (Geliştirici & Göç Araçları)**: Canlı AWS Directus verilerini dışa/içe aktaran ve medya bütünlüğünü doğrulayan araçlardır; web üzerinden erişilebilir dizinde barındırılmaz.

---

## 2. Adım Adım Kurulum

### Adım 1: MySQL Veritabanı ve Kullanıcısı Oluşturma
1. TürkTicaret cPanel'e giriş yapın (`https://alanadiniz.com:2083`).
2. **Veritabanları (Databases)** bölümünden **MySQL® Veritabanı Sihirbazı**'nı (MySQL Database Wizard) açın.
3. Yeni bir veritabanı adı belirleyin (Örnek: `nizamlar_db`).
4. Güçlü bir veritabanı kullanıcısı ve şifresi oluşturun:
   - Kullanıcı: `nizamlar_user`
   - Şifre: *Rastgele ve güçlü bir parola belirleyip bir yere kaydedin.*
5. Kullanıcıya **Tüm İzinleri (ALL PRIVILEGES)** verip işlemi tamamlayın.

### Adım 2: Veritabanı Şemasını (SQL) İçe Aktarma
1. cPanel ana ekranından **phpMyAdmin**'i açın.
2. Sol menüden yeni oluşturduğunuz veritabanını (`cpanelkullanici_nizamlar_db`) seçin.
3. Üst menüden **İçe Aktar (Import)** sekmesine tıklayın.
4. **Dosya Seç** butonuna tıklayarak projedeki `database.sql` dosyasını seçin.
5. Karakter kümesinin `utf8mb4` olduğunu kontrol edip **İçe Aktar (Go)** butonuna tıklayın.
6. 20 tablonun ve başlangıç tohumlama verilerinin eksiksiz yüklendiğini teyit edin.

### Adım 3: Dosyaları cPanel `public_html` İçine Yükleme
1. cPanel ana ekranından **Dosya Yöneticisi (File Manager)** uygulamasını açın.
2. `public_html/` dizinine girin.
3. Üst menüden **Yükle (Upload)** butonuna tıklayın ve `nizamlar-cpanel-deploy.zip` dosyasını yükleyin.
4. Yükleme tamamlandıktan sonra ZIP dosyasına sağ tıklayıp **Extract (Çıkart)** seçeneğini seçin (`public_html/` yoluna).
5. **ÖNEMLİ KONTROL**: Dosyalar doğrudan `public_html/` içine çıkmalıdır:
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
   ├── tests/
   ├── uploads/
   └── storage/
   ```
   *(Eğer `public_html/public_html` oluşmamışsa işlem doğrudur).*

### Adım 4: Güvenli Çevre Yapılandırması (`.env`)
Sistem, şifreleri kod içine yazmak yerine çevre değişkenlerinden okur. İki güvenli yöntem desteklenir:

**Önerilen Yöntem (En Güvenli — public_html Dışında)**:
1. Dosya Yöneticisinde bir üst dizine çıkın (`/home/cpanelkullanici/`).
2. Bu dizinde yeni bir dosya oluşturup adını `.env` yapın.
3. İçeriğini aşağıdaki gibi doldurun:
   ```ini
   DB_DRIVER=mysql
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=cpanelkullanici_nizamlar_db
   DB_USER=cpanelkullanici_nizamlar_user
   DB_PASS=Veritabani_Guclu_Sifreniz
   APP_SECRET=
   CONTACT_NOTIFICATION_EMAIL=nizamlartekstill@gmail.com
   ```
   *Not: `APP_SECRET` alanını boş bırakırsanız sistem `storage/app_secret.key` içinde otomatik 256-bit benzersiz rastgele anahtar üretecektir.*

**Alternatif Yöntem**:
`.env` dosyasını `public_html/.env` olarak oluşturabilirsiniz. `.htaccess` dosyamız bu dosyaya web üzerinden erişimi otomatik olarak `403 Forbidden` ile engeller.

### Adım 5: Klasör İzinleri Kontrolü
cPanel Dosya Yöneticisinde aşağıdaki izinlerin doğruluğunu teyit edin:
- `uploads/` -> **755** (yazılabilir)
- `storage/` -> **755** (yazılabilir)
- `storage/quotes/` -> **755** (yazılabilir)
- `storage/logs/` -> **755** (yazılabilir)
- `.htaccess` -> **644**

### Adım 6: Canlı Ortam Entegrasyon Testini Çalıştırma
Sistemi canlıya açmadan önce sunucu ortamını test edin:
- cPanel Terminal (SSH) üzerinden:
  ```bash
  php public_html/tests/cpanel_integration_test.php
  ```
- Bu test PHP sürümünü, MySQL bağlantısını, 20 tablonun varlığını, dizin yazma izinlerini ve `.htaccess` güvenlik bariyerini otomatik olarak sınar.

### Adım 7: İlk Yönetici (Admin) Hesabını Oluşturma
1. Tarayıcınızda kurulum sihirbazını açın:
   `https://nizamlarbaski.com/admin/install.php`
2. Ad soyad, e-posta, kullanıcı adı ve en az 8 karakterli güçlü yönetici şifrenizi girin.
3. **"Hesabı Oluştur ve Paneli Başlat"** butonuna tıklayın.
4. Hesap oluşturulduğunda sistem güvenlik amacıyla kurulum sihirbazını kalıcı olarak kilitler (`storage/install.lock`).
5. Otomatik olarak Türkçe yönetim paneline yönlendirileceksiniz.

### Adım 8: SMTP E-posta Bildirimlerini Yapılandırma
1. Yönetim panelinde **Site Ayarları > SMTP & E-posta Bildirimleri** sekmesini açın.
2. TürkTicaret cPanel üzerinde açtığınız kurumsal e-posta bilgilerini girin:
   - **Host**: `mail.nizamlarbaski.com`
   - **Port**: `587` (TLS) veya `465` (SSL)
   - **Kullanıcı Adı**: `info@nizamlarbaski.com`
   - **Şifre**: *E-posta şifreniz*
   - **Bildirim E-postası**: `nizamlartekstill@gmail.com`
3. **"Test E-postası Gönder"** butonuna basarak gelen kutunuza bildirim geldiğini onaylayın.

---

## 3. Directus Veri Aktarımı ve Medya Bütünlüğü Doğrulaması

AWS üzerindeki canlı Directus verilerinizi MySQL'e aktarmak istediğinizde:

1. **AWS Directus'tan JSON Verilerini İndirin**:
   AWS sunucusunda `tools/aws-export-directus.sh` betiğini çalıştırın veya Directus API üzerinden koleksiyonları `cms/export/` klasörüne JSON olarak kaydedin.
2. **Medya Klasörünü Alın**:
   AWS EC2 üzerindeki `cms/uploads/` içeriğini cPanel sunucunuzun `public_html/uploads/` dizinine kopyalayın.
3. **Aktarımı ve Doğrulamayı Çalıştırın**:
   ```bash
   php tools/migrate-directus.php
   ```
4. **Sadece Medya Bütünlüğünü Denetlemek İçin**:
   ```bash
   php tools/migrate-directus.php --verify-only
   ```
   Bu komut tüm tablolardaki görsel/dosya yollarını tarar ve eksik veya kırık dosya olup olmadığını tablo hâlinde raporlar.

---

## 4. Canlı AWS Sistemini Kapatmadan Önceki Kontroller

AWS EC2 sunucusunu kapatmadan önce sırasıyla:
1. Alan adı DNS `A` kaydının TürkTicaret cPanel sunucusunun IP adresine yönlendirildiğini doğrulayın (`nslookup nizamlarbaski.com`).
2. cPanel üzerinde SSL (HTTPS) sertifikasının aktif olduğunu kontrol edin.
3. `https://nizamlarbaski.com/admin/install.php` üzerinden yönetici hesabını oluşturup kilitlendiğini teyit edin.
4. Yönetim panelinden bir test içeriği güncelleyin ve sitede anında yansıdığını teyit edin.
5. İletişim ve teklif formlarını dosya ekleyerek gönderin; hem MySQL veritabanına kaydedildiğini hem de SMTP bildirim e-postasının geldiğini onaylayın.
6. AWS EC2 üzerindeki son PostgreSQL yedeğini (`pg_dump`) ve `cms/uploads/` arşivini yerel bilgisayarınıza indirin.
7. AWS EC2 sunucusunu doğrudan silmek yerine 48 saat "Stop" (Durdurulmuş) durumunda bekletin. Her şeyin sorunsuz işlediğinden emin olduktan sonra AWS kaynaklarını sonlandırın.

---

## 5. Geri Dönüş (Rollback) Planı

Olası bir acil durumda eski sisteme 5 dakikada geri dönebilmek için:
1. Alan adınızın DNS yönetim panelinden `A` kaydını tekrar eski **AWS EC2 IP adresine** yönlendirin.
2. TTL süresi düşük (300 saniye) tutulduğunda trafik derhal eski AWS Directus sunucusuna geri dönecektir.
3. Bu süreçte cPanel'e gelen teklif veya iletişim kayıtları olursa, cPanel phpMyAdmin üzerinden `quote_requests` ve `contact_messages` tablolarını dışa aktarabilirsiniz.
