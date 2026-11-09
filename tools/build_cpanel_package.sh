#!/usr/bin/env bash
# ==============================================================================
# NİZAMLAR BASKI — TÜRKTiCARET CPANEL DAĞITIM PAKETİ OLUŞTURUCU
# ==============================================================================
# Node.js, Docker, Express veya Directus içermeyen, TürkTicaret cPanel Apache +
# PHP + MySQL ortamı için optimize edilmiş temiz web dağıtım paketini (ZIP) üretir.
#
# ÖNEMLİ:
# 1. ZIP, doğrudan public_html içine açılacak şekilde kök dosyaları içerir
#    (asla çift public_html/public_html klasörü OLUŞTURMAZ).
# 2. database.sql ve aktarım araçları (tools/) web kök dizini içine konulmaz,
#    böylece SQL dosyaları ve araçlar internete açık hâle gelmez.
# ==============================================================================

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_DIR="$ROOT_DIR/cpanel_build/web_root"
PACKAGE_NAME="nizamlar-cpanel-deploy.zip"

echo "📦 cPanel Dağıtım Paketi Hazırlanıyor..."
echo "📂 Proje Dizini: $ROOT_DIR"

# Eski derleme dizinini temizle
rm -rf "$ROOT_DIR/cpanel_build"
mkdir -p "$BUILD_DIR"

echo "📋 Web kök dizini dosyaları kopyalanıyor..."

# 1. Kök HTML ve Yapılandırma Dosyaları
cp "$ROOT_DIR/index.html" "$BUILD_DIR/"
if [ -f "$ROOT_DIR/404.html" ]; then cp "$ROOT_DIR/404.html" "$BUILD_DIR/"; fi
cp "$ROOT_DIR/.htaccess" "$BUILD_DIR/"

# 2. Sayfa Dizinleri
SECTIONS=("hakkimizda" "hizmetlerimiz" "blog" "makine-parkurumuz" "uretim-surecleri" "referanslarimiz" "sertifikalarimiz" "iletisim" "teklif-al")
for sec in "${SECTIONS[@]}"; do
  if [ -d "$ROOT_DIR/$sec" ]; then
    cp -r "$ROOT_DIR/$sec" "$BUILD_DIR/"
  fi
done

# 3. Statik Varlıklar (Assets: CSS, JS, Images, Videos, Fonts)
cp -r "$ROOT_DIR/assets" "$BUILD_DIR/"

# 4. PHP Çekirdek, API ve Türkçe Admin Paneli
cp -r "$ROOT_DIR/config" "$BUILD_DIR/"
cp -r "$ROOT_DIR/api" "$BUILD_DIR/"
cp -r "$ROOT_DIR/admin" "$BUILD_DIR/"

# 5. Entegrasyon Test Scripti (Admin yetkilendirmesiyle çalışır)
mkdir -p "$BUILD_DIR/tests"
cp "$ROOT_DIR/tests/cpanel_integration_test.php" "$BUILD_DIR/tests/"

# 6. Medya ve Depolama Dizinleri (Boş ve .htaccess ile tam korumalı)
mkdir -p "$BUILD_DIR/uploads"
if [ -f "$ROOT_DIR/uploads/.htaccess" ]; then
  cp "$ROOT_DIR/uploads/.htaccess" "$BUILD_DIR/uploads/"
fi

mkdir -p "$BUILD_DIR/storage/quotes"
mkdir -p "$BUILD_DIR/storage/logs"
if [ -f "$ROOT_DIR/storage/.htaccess" ]; then
  cp "$ROOT_DIR/storage/.htaccess" "$BUILD_DIR/storage/"
fi

# Kurulum kilidinin dağıtımda OLMADIĞINDAN emin ol (ilk kuruluma izin vermek için)
rm -f "$BUILD_DIR/storage/install.lock"

# 7. macOS metadata ve gereksiz dosyaları temizle
find "$BUILD_DIR" -name ".DS_Store" -delete
find "$BUILD_DIR" -name "._*" -delete

# 8. Web ZIP Sıkıştırma (Kök dizin dosyaları doğrudan arşiv kökündedir)
echo "🗜️ Web arşivi sıkıştırılıyor: $PACKAGE_NAME..."
cd "$BUILD_DIR"
rm -f "$ROOT_DIR/$PACKAGE_NAME"
zip -r -q "$ROOT_DIR/$PACKAGE_NAME" .

echo "=========================================================="
echo "✅ cPanel Dağıtım Paketi Başarıyla Üretildi!"
echo "📦 Web ZIP Paketi  : $ROOT_DIR/$PACKAGE_NAME"
echo "🗄️ Veritabanı Dosyası: $ROOT_DIR/database.sql (phpMyAdmin ile yüklenecek)"
echo "📖 Kurulum Rehberi  : $ROOT_DIR/CPANEL_KURULUM_REHBERI.md"
echo "⚙️ Çevre Şablonu    : $ROOT_DIR/.env.example"
echo "=========================================================="
ls -lh "$ROOT_DIR/$PACKAGE_NAME"
