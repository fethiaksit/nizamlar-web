#!/usr/bin/env bash
# Nizamlar Baskı: canlı sitedeki menu/CMS değişikliklerini KORUYARAK iki dosyalı teklif fix'i.
# Usage: bash deploy_quote_preview.sh --check | --apply
set -euo pipefail
umask 077

MODE="${1:---check}"
if [[ "$MODE" != "--check" && "$MODE" != "--apply" ]]; then
  echo "Kullanim: bash $0 --check veya --apply" >&2; exit 2
fi
for bin in curl diff3 php mktemp tar; do
  command -v "$bin" >/dev/null || { echo "Eksik komut: $bin" >&2; exit 1; }
done

ROOT="$HOME/public_html"
[[ -f "$ROOT/api/quote.php" && -f "$ROOT/assets/js/cms-client.js" ]] || {
  echo "Canli site klasoru bulunamadi: $ROOT" >&2; exit 1;
}
BASE='https://raw.githubusercontent.com/fethiaksit/nizamlar-web/69efe7d91ff77bca8b70ad65c865728ca6c99b5e'
NEW='https://raw.githubusercontent.com/fethiaksit/nizamlar-web/02cbf0683ee9411f63879294953409c42b6d5cc3'
WORK=$(mktemp -d "$HOME/.quote-merge.XXXXXXXX")
trap 'rm -rf "$WORK"' EXIT

FILES=(
  api/quote.php
  admin/quotes.php
  admin/quote-file.php
  config/helpers.php
  assets/js/live-preview.js
  assets/js/main.js
  assets/js/cms-client.js
  index.html
  teklif-al/index.html
)
ADDED=(assets/js/studio-quote-transfer.js tools/migrate_quote_previews.php)
echo "=== 3-YONLU BIRLESTIRME KONTROLU ==="

cat > "$WORK/patch-quote-html.php" <<'PHP'
<?php
// Live quote form patch: retain the custom navigation/header and all page content.
declare(strict_types=1);
$source = file_get_contents($argv[1]);
if ($source === false) { fwrite(STDERR, "Canli teklif sayfasi okunamadi.\n"); exit(1); }
if (strpos($source, 'studio-quote-transfer.js') !== false) {
    fwrite(STDERR, "Teklif sayfasinda modul zaten var; beklenmeyen durum.\n"); exit(1);
}
$main = '~<script\\b[^>]*\\bsrc=["\\\'][^"\\\']*assets/js/main\\.js(?:\\?[^"\\\']*)?["\\\'][^>]*>\\s*</script>~i';
$cms = '~<script\\b[^>]*\\bsrc=["\\\'][^"\\\']*assets/js/cms-client\\.js(?:\\?[^"\\\']*)?["\\\'][^>]*>\\s*</script>~i';
$count = 0;
$source = preg_replace($main,
    '<script src="/assets/js/studio-quote-transfer.js?v=quote-preview-1111"></script>' . "\n" .
    '<script src="/assets/js/main.js?v=quote-preview-1111"></script>',
    $source, 1, $count
);
if ($source === null || $count !== 1) {
    fwrite(STDERR, "Canli teklif sayfasinda main.js etiketi tekil degil.\n"); exit(1);
}
$count = 0;
$source = preg_replace($cms,
    '<script src="/assets/js/cms-client.js?v=quote-preview-1111"></script>',
    $source, 1, $count
);
if ($source === null || $count !== 1) {
    fwrite(STDERR, "Canli teklif sayfasinda cms-client.js etiketi tekil degil.\n"); exit(1);
}
if (file_put_contents($argv[2], $source) === false) {
    fwrite(STDERR, "Teklif HTML patch dosyasi yazilamadi.\n"); exit(1);
}
echo "OK: teklif sayfasi scriptleri eklendi (canli menu korundu).\n";
PHP
php -l "$WORK/patch-quote-html.php"

for rel in "${FILES[@]}"; do
  [[ -f "$ROOT/$rel" ]] || { echo "Canli dosya eksik: $rel" >&2; exit 1; }
  mkdir -p "$WORK/base/$(dirname "$rel")" "$WORK/new/$(dirname "$rel")" "$WORK/merged/$(dirname "$rel")"
  curl --fail --location --silent --show-error --retry 2 --max-time 45 "$BASE/$rel" -o "$WORK/base/$rel"
  curl --fail --location --silent --show-error --retry 2 --max-time 45 "$NEW/$rel" -o "$WORK/new/$rel"
  case "$rel" in
    assets/js/live-preview.js) EXPECT='NizamlarStudioTransfer' ;;
    assets/js/cms-client.js) EXPECT='preview_file' ;;
    index.html|teklif-al/index.html) EXPECT='studio-quote-transfer.js' ;;
    api/quote.php) EXPECT='preview_file_url' ;;
    *) EXPECT='' ;;
  esac
  if [[ -n "$EXPECT" ]] && ! grep -Fq "$EXPECT" "$WORK/new/$rel"; then
    echo "HATA: GitHub yeni surumunda beklenen kod yok: $rel ($EXPECT)" >&2
    echo "Bu kontrol basarisizken kurulum yapilmaz." >&2
    exit 1
  fi
  if [[ "$rel" == "teklif-al/index.html" ]]; then
    # Canli sayfanin (ozellikle menunun) tum HTML yapisini KORU.
    # Yeni ozellik icin sadece 3 script etiketini hedefli duzenle.
    php "$WORK/patch-quote-html.php" "$ROOT/$rel" "$WORK/merged/$rel"
  elif ! diff3 -m "$ROOT/$rel" "$WORK/base/$rel" "$WORK/new/$rel" > "$WORK/merged/$rel"; then
    echo "BIRLESTIRME CAKISMASI: $rel - hicbir canli dosya degismedi." >&2
    exit 1
  fi
  if [[ -n "$EXPECT" ]] && ! grep -Fq "$EXPECT" "$WORK/merged/$rel"; then
    echo "HATA: Birlesim yeni kodu korumadi: $rel ($EXPECT)" >&2
    echo "YENI KOD satirlari:"
    grep -Fn "$EXPECT" "$WORK/new/$rel" | head -3 || :
    echo "Canli siteye dokunulmadi." >&2
    exit 1
  fi
  echo "OK: $rel"
done

for rel in "${ADDED[@]}"; do
  [[ ! -e "$ROOT/$rel" ]] || { echo "Yeni dosya zaten mevcut: $rel; durduruldu." >&2; exit 1; }
  mkdir -p "$WORK/merged/$(dirname "$rel")"
  curl --fail --location --silent --show-error --retry 2 --max-time 45 "$NEW/$rel" -o "$WORK/merged/$rel"
  [[ -s "$WORK/merged/$rel" ]] || { echo "Indirilemedi: $rel" >&2; exit 1; }
  echo "YENI: $rel"
done

echo "=== PHP SÖZDIZIMI TESTLERI ==="
for rel in api/quote.php admin/quotes.php admin/quote-file.php config/helpers.php tools/migrate_quote_previews.php; do
  php -l "$WORK/merged/$rel"
done

echo "=== JS MODULU KONTROLU ==="
grep -q 'NizamlarStudioTransfer' "$WORK/merged/assets/js/live-preview.js"
grep -q 'preview_file' "$WORK/merged/assets/js/cms-client.js"
grep -q 'studio-quote-transfer.js' "$WORK/merged/index.html"
grep -q 'studio-quote-transfer.js' "$WORK/merged/teklif-al/index.html"
grep -q 'preview_file_url' "$WORK/merged/api/quote.php"
echo "OK"

if [[ "$MODE" == "--check" ]]; then
  echo "ON KONTROL BASARILI. Canli site degistirilmedi."
  echo "Uygulamak icin: bash $0 --apply"
  exit 0
fi

BACKUP="$HOME/nizamlar-quote-rollback/$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP/files"
chmod 700 "$HOME/nizamlar-quote-rollback" "$BACKUP" "$BACKUP/files"

echo "=== DOSYA YEDEGI ==="
for rel in "${FILES[@]}"; do
  mkdir -p "$BACKUP/files/$(dirname "$rel")"
  cp -p "$ROOT/$rel" "$BACKUP/files/$rel"
done
echo "Yedek: $BACKUP"

# Önce sadece ekleyici DB değişikliği: mevcut teklif verileri değişmez.
echo "=== GUVENLI VERITABANI GENISLETME ==="
mkdir -p "$ROOT/tools"
install -m 0644 "$WORK/merged/tools/migrate_quote_previews.php" "$ROOT/tools/migrate_quote_previews.php"
php "$ROOT/tools/migrate_quote_previews.php"

echo "=== CANLI DOSYALARA UYGULAMA ==="
# Kod ve helper önce, HTML en son: kullanıcı yeni akışı yalnızca hazır olduktan sonra görür.
for rel in "${FILES[@]}" "${ADDED[@]}"; do
  if [[ "$rel" == "tools/migrate_quote_previews.php" ]]; then continue; fi
  dest="$ROOT/$rel"
  mkdir -p "$(dirname "$dest")"
  install -m 0644 "$WORK/merged/$rel" "$dest.quote-next"
  mv -f "$dest.quote-next" "$dest"
  echo "OK: $rel"
done

echo "BASARILI. Rollback dosyalari: $BACKUP/files"
echo "ONEMLI: Veritabani alanlari ekleyici oldugu icin eski kod da calismaya devam eder."
echo "Yeni ozelligi gercek musteri verileriyle degil, test teklif ile dogrulayin."
