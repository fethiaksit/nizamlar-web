# Nizamlar Baskı — Kurumsal Web Sitesi (`index.html`)

[Mindloop](https://hirael.com/embed/templates/mindloop) şablonunun modern ve premium yapısı (derin koyu zemin, `liquid-glass` cam yüzeyler, zarif serif-italic tipografi, tam ekran odaklı bölümler) temel alınarak; **Nizamlar Baskı** markası için **tekstil baskı, t-shirt üretimi, canlı video vitrini ve renkli mürekkep animasyonlarıyla** zenginleştirilmiş tek dosya mimarili kurumsal web sitesi.

---

## 🎨 Tasarım ve Görsel Kimlik
- **Tasarım Dili:** Yaratıcı baskı atölyesi + Profesyonel üretim tesisi enerjisi.
- **Renk Paleti:**
  - Derin Siyah / Antrasit Zemin: `#030306`, `#090A10`, `#10121C`
  - Canlı Baskı Renkleri (CMYK + Neon Spot):
    - **Cyan:** `#00F0FF`
    - **Magenta:** `#FF007F`
    - **Yellow:** `#FFD600`
    - **Mor:** `#9D4EDD`
    - **Turuncu:** `#FF5E00`
    - **Elektrik Mavi:** `#2962FF`
- **Tipografi:**
  - Modern Geometrik Sans: `Plus Jakarta Sans`
  - Mindloop Editoryal İtalik: `Instrument Serif` *(Örn: "Tekstil Baskıda Renk, Kalite ve Güven")*
  - Teknik Baskı & Kros Kodları: `JetBrains Mono`

---

## 🎬 Mindloop Büyük Baskı Üretim Vitrini (Video Alanı)
Mindloop'taki merkezi video bloğu (`mission.mp4`), Nizamlar Baskı için **özel baskı prodüksiyon vitrini** olarak yeniden tasarlandı:
- **Konum:** Sayfanın görsel merkezi olan **Hakkımızda** bölümünün girişinde, 960px genişliğinde, yuvarlatılmış köşeli (`rounded-3xl` / 28px) ve spektral CMYK aura (`print-video-aura`) ile sarılı.
- **Video Etiketi:**
  ```html
  <video id="production-main-video" class="print-video-element" autoplay loop muted playsinline preload="auto" data-editable="production-video-src">
    <source src="media/production-textile-print.mp4" type="video/mp4" />
  </video>
  ```
- **İçerik Teması:** T-shirt üzerine baskı uygulanması, renkli DTF transfer süreci, serigrafi rakle geçişleri, kumaşa renk oturma anı, fikse tünelinden çıkan ürünler ve yakın plan mürekkep detayları.
- **Canlı Prosedürel Fallback (Canvas):** Gerçek video dosyası yerelde henüz eklenmemişse veya yüklenirken arka planda kesintisiz çalışan, t-shirt silüeti üzerinde hareketli rakle, CMYK boya patlamaları ve canlı telemetri zaman kodları (`REC ● 00:0X:XX`) üreten yüksek performanslı Canvas simülasyonu.
- **Video İçi Kontroller:**
  - Canlı sahne etiketleri (T-Shirt Baskı, DTF Transfer, Serigrafi Rakle, Fikse Çıkışı)
  - Duraklat / Oynat butonu
  - Ses Açık / Sessiz butonu

---

## ⚡ Entegre Baskı Animasyonları
Sitede statik bir görünüm yerine üretim ve canlı renk hissi veren **10 farklı baskı animasyon sistemi** yer alır:

1. **Global Canlı Mürekkep & Pigment Akışı (`#ink-ambient-canvas`):** Arka planda organik akan CMYK renk dalgaları ve yükselen pigment partikülleri (GPU/Canvas).
2. **Hero Canlı T-Shirt Baskı Presi & Simülatörü (`#hero-tshirt-stage`):**
   - T-shirt üzerine inip kalkan ışıklı rakle (squeegee) ve termal pres barı.
   - 4 farklı baskı deseni geçişi (CMYK Dalga, DTF Neon, Serigrafi, Kurumsal).
   - **Katmanları Ayır (3D):** Serigrafi kalıplarını ve CMYK katmanlarını 3D açıyla birbirinden ayıran interaktif mod.
3. **Alternatif Slogan & Renk Döngüsü:**
   - *"Üretimde kalite, baskıda fark"*
   - *"Renklerin en güçlü hali"*
   - *"Tasarımdan baskıya profesyonel çözüm"*
   - *"Canlı renkler, güçlü baskılar"*
4. **Bölümler Arası Rakle & Renk Süpürme Şeritleri (`.print-divider`):** Her bölüm geçişinde soldan sağa boya süpüren hareketli rakle ve CMYK kros şeritleri.
5. **Kumaşa Renk Oturma & Lif Nüfuz Simülasyonu (`#fabric-ink-canvas`):** Kumaşın örgü dokusu içine mürekkebin tutunmasını canlandıran canlı canvas.
6. **Mindloop Word-by-Word Manifesto:** Scroll ettikçe kelime kelime ışıldayan ve renklenen manifesto metni.
7. **Hizmet Kartlarında Mouse Takipli Mürekkep Yayılımı & Mini Rakle:** Her kartın içinde DTF transfer, serigrafi ipek kalıp, t-shirt baskı ve özel efekt animasyonları.
8. **Baskı Makinesinden Çıkan Renkli T-Shirtler (Konveyör Bandı):** Üretim sürecinde pres ünitesinden kesintisiz çıkan renkli t-shirt konveyör akışı.
9. **İnteraktif Ham Kumaş vs. Baskılı T-Shirt Sürgüsü:** Kullanıcının sağa-sola kaydırarak baskı anını test ettiği karşılaştırma vitrini.
10. **Teklif Formunda Canlı T-Shirt Önizleme:** Formdan seçilen baskı tekniğine göre t-shirt üzerindeki baskı katmanının canlı değişimi.

---

## 📂 Sayfa Bölüm Yapısı (9 Bölüm)
1. **Hero (`#hero`):** Manşet, alternatif slogan barı, hızlı baskı seçim komut kutusu ve canlı t-shirt pres simülatörü.
2. **Hakkımızda (`#hakkimizda`):** Büyük üretim vitrini video alanı, kumaşa renk oturma sahnesi, scroll ile aydınlanan manifesto ve düzenlenebilir kurumsal göstergeler.
3. **Hizmetlerimiz (`#hizmetlerimiz`):** DTF Baskı, Serigrafi Baskı, Tshirt Baskı, Kurumsal Tekstil Baskı, Özel Sipariş Üretim, Numune ve Toplu Üretim (6 kart).
4. **Üretim Süreci (`#uretim-sureci`):** Canlı konveyör makine bandı + 6 adımlı iş akışı (Tasarım, Numune, Onay, Baskı, Kalite Kontrol, Teslimat).
5. **Neden Biz (`#neden-biz`):** Mindloop squircle (`rounded-[2rem]`) 4 canlı baskı rozeti (Canlı Renkler, Dayanım, Yumuşak Tuşe, Zamanında Teslimat).
6. **Üretim Galerisi (`#galeri`):** Baskı öncesi/sonrası rakle sürgüsü + 4 kategorili filtreleme + 6 adet canlı hover ışıklı galeri kartı.
7. **Referanslar (`#referanslar`):** Kayan marka bandı + 4 adet düzenlenebilir logo ve iş ortağı slotu.
8. **Teklif Al (`#teklif-al`):** Canlı t-shirt baskı önizleme kartı + hızlı teklif ve WhatsApp talep formu.
9. **İletişim (`#iletisim`):** Telefon, e-posta, açık adres, çalışma saatleri ve sabit WhatsApp hızlı erişim butonu.

---

## 🛠️ Düzenlenebilir Alanlar (`data-editable`)
Firma onaylı gerçek bilgiler geldiğinde doğrudan güncellenecek alanlar:
- `data-editable="production-video-src"`: Üretim vitrini video dosya yolu (`media/production-textile-print.mp4`)
- `data-editable="company-founded"`: Kuruluş yılı
- `data-editable="company-capacity"`: Günlük / aylık üretim kapasitesi
- `data-editable="company-facility"`: Atölye / tesis m² bilgisi
- `data-editable="company-standards"`: Kullanılan boya ve kalite sertifikaları
- `data-editable="gallery-1"` .. `gallery-6`: Gerçek ürün ve baskı fotoğrafları
- `data-editable="references-marquee"` & `ref-slot-1` .. `4`: Gerçek referans marka isimleri
- `data-editable="contact-phone"`, `contact-email`, `contact-address`, `contact-hours`, `whatsapp-phone`: İletişim bilgileri

---

## 🚀 Çalıştırma
Proje harici paket bağımlılığı veya build adımı gerektirmez:
```bash
python3 -m http.server 5500
```
Tarayıcıdan erişim: `http://localhost:5500`
