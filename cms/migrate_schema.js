/**
 * NİZAMLAR BASKI — NON-DESTRUCTIVE ŞEMA GÖÇÜ (idempotent)
 * Yalnızca EKSİK alanları ekler; hiçbir koleksiyonu/alanı/kaydı silmez veya değiştirmez.
 */
const { adminClient } = require('./lib/env');

const FIELDS = {
  navigation_menus: [
    { field: 'parent_id', type: 'integer', meta: { interface: 'input', note: 'Alt menü ise üst menü kaydının ID değeri (boş = üst seviye)', width: 'half' }, schema: { is_nullable: true } },
    { field: 'open_new_tab', type: 'boolean', meta: { interface: 'boolean', width: 'half' }, schema: { default_value: false } },
    { field: 'show_desktop', type: 'boolean', meta: { interface: 'boolean', width: 'half' }, schema: { default_value: true } },
    { field: 'show_mobile', type: 'boolean', meta: { interface: 'boolean', width: 'half' }, schema: { default_value: true } }
  ],
  site_settings: [
    { field: 'address_full', type: 'text', meta: { interface: 'input-multiline', note: 'İletişim sayfasındaki ayrıntılı adres' }, schema: { is_nullable: true } },
    { field: 'working_hours_detail', type: 'text', meta: { interface: 'input-multiline', note: 'İletişim sayfasındaki ayrıntılı çalışma saatleri' }, schema: { is_nullable: true } },
    { field: 'order_email', type: 'string', meta: { interface: 'input', note: 'İletişim sayfasındaki ikinci (sipariş) e-posta' }, schema: { is_nullable: true } }
  ],
  quote_requests: [
    { field: 'source_ip_hash', type: 'string', meta: { interface: 'input', readonly: true, note: 'Spam analizi için kısaltılmış IP özeti' }, schema: { is_nullable: true } }
  ]
};


// Medya kütüphanesi (directus_files) ile bağlı dosya alanları. Eski metin alanları (yol/URL) YERİNDE kalır ve
// geri dönüş (fallback) olarak kullanılır; yönetici medya kütüphanesinden seçince dosya alanı önceliklidir.
const FILE_LINKS = {
  products: ['cover_image_file', 'back_image_file'],
  pages: ['hero_image_file', 'hero_video_file'],
  services: ['cover_image_file'],
  machines: ['image_file'],
  production_processes: ['image_file'],
  references: ['logo_file'],
  certificates: ['image_file', 'pdf_document'],
  blog_posts: ['cover_image_file'],
  animations_config: ['poster_image_file', 'video_file']
};

async function main() {
  const { api } = await adminClient();
  for (const [col, fields] of Object.entries(FIELDS)) {
    const have = new Set((await api('GET', `/fields/${col}`)).map(f => f.field));
    for (const f of fields) {
      if (have.has(f.field)) { console.log(`↩️  ${col}.${f.field} zaten var`); continue; }
      await api('POST', `/fields/${col}`, f);
      console.log(`✨ eklendi: ${col}.${f.field}`);
    }
  }
  const rels = await api('GET', '/relations?limit=-1');
  for (const [col, names] of Object.entries(FILE_LINKS)) {
    const have = new Set((await api('GET', `/fields/${col}`)).map(f => f.field));
    for (const name of names) {
      const isImg = !/video|pdf/.test(name);
      if (!have.has(name)) {
        await api('POST', `/fields/${col}`, {
          field: name, type: 'uuid',
          meta: { interface: isImg ? 'file-image' : 'file', special: ['file'], width: 'half', note: 'Medya kütüphanesinden seçin (eski metin alanından önceliklidir)' },
          schema: { is_nullable: true }
        });
        console.log(`✨ eklendi: ${col}.${name}`);
      }
      if (!rels.find(r => r.collection === col && r.field === name)) {
        await api('POST', '/relations', { collection: col, field: name, related_collection: 'directus_files', schema: { on_delete: 'SET NULL' } });
        console.log(`🔗 ilişki: ${col}.${name} -> directus_files`);
      }
    }
  }
  console.log('✅ Şema göçü tamam (yıkıcı işlem yok).');
}
main().catch(e => { console.error('Hata:', e.message); process.exit(1); });
