#!/usr/bin/env bash
# ==============================================================================
# NİZAMLAR BASKI — TÜRKTiCARET CPANEL DAĞITIM PAKETİ OLUŞTURUCU
# ==============================================================================
# Node.js, Docker, Express veya Directus içermeyen, cPanel Apache + PHP + MySQL
# ortamı için optimize edilmiş dağıtım paketini (ZIP) üretir.
# ==============================================================================

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_DIR="$ROOT_DIR/cpanel_build"
PACKAGE_NAME="nizamlar-cpanel-deploy.zip"

echo "📦 Dağıtım paketi oluşturuluyor..."
echo "📂 Kök Dizin: $ROOT_DIR"

# Eski derleme dizinini temizle
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR/public_html"

echo "📋 Dosyalar kopyalanıyor..."

# 1. Kök HTML ve Yapılandırma Dosyaları
cp "$ROOT_DIR/index.html" "$BUILD_DIR/public_html/"
if [ -f "$ROOT_DIR/404.html" ]; then cp "$ROOT_DIR/404.html" "$BUILD_DIR/public_html/"; fi
cp "$ROOT_DIR/.htaccess" "$BUILD_DIR/public_html/"

# 2. Sayfa Dizinleri
SECTIONS=("hakkimizda" "hizmetlerimiz" "blog" "makine-parkurumuz" "uretim-surecleri" "referanslarimiz" "sertifikalarimiz" "iletisim" "teklif-al")
for sec in "${SECTIONS[@]}"; do
  if [ -d "$ROOT_DIR/$sec" ]; then
    cp -r "$ROOT_DIR/$sec" "$BUILD_DIR/public_html/"
  fi
done

# 3. Statik Varlıklar (Assets)
cp -r "$ROOT_DIR/assets" "$BUILD_DIR/public_html/"

# 4. PHP Çekirdek & API & Admin
cp -r "$ROOT_DIR/config" "$BUILD_DIR/public_html/"
cp -r "$ROOT_DIR/api" "$BUILD_DIR/public_html/"
cp -r "$ROOT_DIR/admin" "$BUILD_DIR/public_html/"

# 5. Medya ve Depolama Dizinleri
mkdir -p "$BUILD_DIR/public_html/uploads"
if [ -f "$ROOT_DIR/uploads/.htaccess" ]; then
  cp "$ROOT_DIR/uploads/.htaccess" "$BUILD_DIR/public_html/uploads/"
fi

mkdir -p "$BUILD_DIR/public_html/storage/quotes"
mkdir -p "$BUILD_DIR/public_html/storage/logs"
if [ -f "$ROOT_DIR/storage/.htaccess" ]; then
  cp "$ROOT_DIR/storage/.htaccess" "$BUILD_DIR/public_html/storage/"
fi

# Kurulum kilidinin dağıtımda OLMADIĞINDAN emin ol (ilk kuruluma izin vermek için)
rm -f "$BUILD_DIR/public_html/storage/install.lock"

# 6. Kök Düzey Belgeler ve SQL Şeması
cp "$ROOT_DIR/database.sql" "$BUILD_DIR/"
cp "$ROOT_DIR/CPANEL_KURULUM_REHBERI.md" "$BUILD_DIR/"
mkdir -p "$BUILD_DIR/tools"
cp "$ROOT_DIR/tools/migrate-directus.php" "$BUILD_DIR/tools/"

# 7. macOS metadata ve gereksiz dosyaları temizle
find "$BUILD_DIR" -name ".DS_Store" -delete
find "$BUILD_DIR" -name "._*" -delete

echo "🗜️ ZIP arşivi sıkıştırılıyor: $PACKAGE_NAME..."
cd "$BUILD_DIR"
rm -f "$ROOT_DIR/$PACKAGE_NAME"
zip -r -q "$ROOT_DIR/$PACKAGE_NAME" .

echo "=========================================================="
echo "✅ Dağıtım paketi başarıyla üretildi!"
echo "Dosya: $ROOT_DIR/$PACKAGE_NAME"
ls -lh "$ROOT_DIR/$PACKAGE_NAME"
echo "=========================================================="
