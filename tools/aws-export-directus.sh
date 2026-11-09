#!/usr/bin/env bash
# ==============================================================================
# NİZAMLAR BASKI — CANLI AWS DIRECTUS VERİLERİNİ DIŞA AKTARMA BETİĞİ
# ==============================================================================
# Bu betik AWS EC2 üzerinde çalışan Directus ve PostgreSQL verilerini,
# medya dosyalarını ve koleksiyonları TürkTicaret cPanel MySQL'e aktarmak için
# JSON ve dosya formatında dışa aktarır.
#
# Kullanım:
#   chmod +x tools/aws-export-directus.sh
#   ./tools/aws-export-directus.sh [DIRECTUS_URL] [ADMIN_EMAIL] [ADMIN_PASSWORD]
# ==============================================================================

set -e

DIRECTUS_URL="${1:-http://localhost:8055}"
ADMIN_EMAIL="${2:-admin@nizamlarbaski.com}"
ADMIN_PASSWORD="${3:-}"

OUTPUT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/cms/export"
mkdir -p "$OUTPUT_DIR"

echo "=========================================================="
echo " NİZAMLAR BASKI — AWS DIRECTUS VERİ AKTARIM HAZIRLIĞI"
echo " Hedef URL: $DIRECTUS_URL"
echo " Çıktı Klasörü: $OUTPUT_DIR"
echo "=========================================================="

if [ -z "$ADMIN_PASSWORD" ]; then
  echo "Lütfen Directus yönetici şifresini girin:"
  read -s ADMIN_PASSWORD
fi

# 1. Giriş yap ve Token al
echo "🔑 Directus API girişi yapılıyor..."
AUTH_RES=$(curl -s -X POST "$DIRECTUS_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

TOKEN=$(echo "$AUTH_RES" | grep -o '"access_token":"[^"]*' | grep -o '[^"]*$')

if [ -z "$TOKEN" ]; then
  echo "❌ Giriş başarısız oldu! Dönen yanıt:"
  echo "$AUTH_RES"
  echo ""
  echo "Alternatif: PostgreSQL veritabanı yedeğini doğrudan almak için aşağıdaki komutu çalıştırabilirsiniz:"
  echo "  pg_dump -U postgres -d directus -F c -f $OUTPUT_DIR/directus_db.dump"
  exit 1
fi

echo "✅ Token başarıyla alındı."

# 2. Koleksiyonları Dışa Aktar
COLLECTIONS=(
  "site_settings"
  "whatsapp_settings"
  "mockup_preview_settings"
  "pages"
  "services"
  "products"
  "machines"
  "production_processes"
  "references"
  "certificates"
  "blog_posts"
  "animations_config"
  "navigation_menus"
  "quote_requests"
  "contact_messages"
  "directus_files"
)

for COL in "${COLLECTIONS[@]}"; do
  echo "📦 Aktarılıyor: $COL..."
  curl -s -X GET "$DIRECTUS_URL/items/$COL?limit=-1" \
    -H "Authorization: Bearer $TOKEN" \
    -o "$OUTPUT_DIR/$COL.json"
done

echo "🖼️ directus_files metaverisi alınıyor..."
curl -s -X GET "$DIRECTUS_URL/files?limit=-1" \
  -H "Authorization: Bearer $TOKEN" \
  -o "$OUTPUT_DIR/directus_files.json"

echo "=========================================================="
echo "✅ Dışa aktarma tamamlandı!"
echo "Dosyalar '$OUTPUT_DIR' klasörüne kaydedildi."
echo ""
echo "Şimdi aktarımı MySQL'e uygulamak için:"
echo "  php tools/migrate-directus.php"
echo "=========================================================="
