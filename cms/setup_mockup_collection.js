/**
 * NİZAMLAR BASKI — DIRECTUS MOCKUP PREVIEW SETTINGS SETUP
 * Canlı baskı önizleme modülünün yönetim paneli ayarlarını Directus'a kaydeder
 * ve public okuma yetkisi verir.
 */

const DIRECTUS_URL = 'http://localhost:8055';
const ADMIN_EMAIL = 'admin@nizamlarbaski.com';
const ADMIN_PASSWORD = 'NizamlarAdmin2026!';

async function setupMockupCollection() {
  console.log('🚀 Directus Mockup Preview Koleksiyonu Kurulumu Başlatılıyor...');

  const loginRes = await fetch(`${DIRECTUS_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
  });

  if (!loginRes.ok) {
    throw new Error('Directus admin girişi başarısız: ' + (await loginRes.text()));
  }

  const { data: { access_token } } = await loginRes.json();
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${access_token}`
  };

  const collectionName = 'mockup_preview_settings';

  // 1. Koleksiyon var mı kontrol et
  const checkCol = await fetch(`${DIRECTUS_URL}/collections/${collectionName}`, { headers });
  if (checkCol.ok) {
    console.log(`ℹ️  ${collectionName} koleksiyonu zaten mevcut.`);
  } else {
    // Koleksiyonu oluştur
    const createColRes = await fetch(`${DIRECTUS_URL}/collections`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        collection: collectionName,
        meta: {
          collection: collectionName,
          icon: 'view_in_ar',
          note: 'Canlı Baskı Önizleme Modülü Ayarları & Koordinatları',
          singleton: true,
          translations: [{ language: 'tr-TR', translation: 'Canlı Baskı Önizleme Ayarları' }]
        },
        schema: {}
      })
    });
    console.log(`📦 Koleksiyon oluşturuldu: ${collectionName} (${createColRes.status})`);

    // Alanları ekle
    const fields = [
      { field: 'is_active', type: 'boolean', meta: { interface: 'boolean', options: { label: 'Önizleme Bölümü Aktif' }, width: 'half' }, schema: { default_value: true } },
      { field: 'section_tag', type: 'string', meta: { interface: 'input', options: { placeholder: 'İnteraktif Stüdyo' }, width: 'half' }, schema: { default_value: 'İnteraktif Stüdyo' } },
      { field: 'section_title', type: 'string', meta: { interface: 'input', options: { placeholder: 'Tasarımını Yükle, Baskını Canlı Önizle' }, width: 'full' }, schema: { default_value: 'Tasarımını Yükle, Baskını Canlı Önizle' } },
      { field: 'section_desc', type: 'text', meta: { interface: 'input-multiline', width: 'full' }, schema: { default_value: 'Kendi tasarım dosyanızı yükleyin; tişört, sweatshirt, hoodie, pantolon veya bez çanta üzerinde baskınızın nasıl görüneceğini anında inceleyin.' } },
      { field: 'allowed_file_types', type: 'string', meta: { interface: 'input', width: 'half' }, schema: { default_value: 'PNG, JPG, JPEG, WEBP, SVG' } },
      { field: 'max_file_size_mb', type: 'integer', meta: { interface: 'input', width: 'half' }, schema: { default_value: 25 } },
      { field: 'default_product', type: 'string', meta: { interface: 'select-dropdown', options: { choices: [{ text: 'Tişört', value: 'tisort' }, { text: 'Sweatshirt', value: 'sweatshirt' }, { text: 'Hoodie', value: 'hoodie' }, { text: 'Pantolon', value: 'pantolon' }, { text: 'Bez Çanta', value: 'canta' }] }, width: 'half' }, schema: { default_value: 'tisort' } },
      { field: 'config_json', type: 'json', meta: { interface: 'input-code', options: { language: 'json' }, width: 'full' }, schema: {} }
    ];

    for (const f of fields) {
      const fieldRes = await fetch(`${DIRECTUS_URL}/fields/${collectionName}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(f)
      });
      console.log(`  + Alan eklendi: ${f.field} (${fieldRes.status})`);
    }
  }

  // 2. Varsayılan veriyi ekle / güncelle
  const defaultPayload = {
    id: 1,
    is_active: true,
    section_tag: 'İnteraktif Stüdyo',
    section_title: 'Tasarımını Yükle, Baskını Canlı Önizle',
    section_desc: 'Kendi tasarım dosyanızı yükleyin; tişört, sweatshirt, hoodie, pantolon veya bez çanta üzerinde baskınızın nasıl görüneceğini anında inceleyin.',
    allowed_file_types: 'PNG, JPG, JPEG, WEBP, SVG',
    max_file_size_mb: 25,
    default_product: 'tisort'
  };

  const itemCheck = await fetch(`${DIRECTUS_URL}/items/${collectionName}/1`, { headers });
  if (itemCheck.ok) {
    await fetch(`${DIRECTUS_URL}/items/${collectionName}/1`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(defaultPayload)
    });
    console.log('✅ Singleton veri güncellendi.');
  } else {
    await fetch(`${DIRECTUS_URL}/items/${collectionName}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(defaultPayload)
    });
    console.log('✅ Singleton veri oluşturuldu.');
  }

  // 3. Public policy okuma izni ver
  const publicPolicyId = 'abf8a154-5b1c-4a46-ac9c-7300570f4f17';
  const permCheck = await fetch(`${DIRECTUS_URL}/permissions?filter[policy][_eq]=${publicPolicyId}&filter[collection][_eq]=${collectionName}&filter[action][_eq]=read`, { headers });
  const perms = (await permCheck.json()).data;
  if (!perms || perms.length === 0) {
    await fetch(`${DIRECTUS_URL}/permissions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        policy: publicPolicyId,
        collection: collectionName,
        action: 'read',
        permissions: {},
        fields: ['*']
      })
    });
    console.log(`🔓 Public read izni verildi: ${collectionName}`);
  } else {
    console.log(`ℹ️  Public read izni zaten mevcut: ${collectionName}`);
  }

  console.log('🎉 Mockup Directus yapılandırması başarıyla tamamlandı!');
}

setupMockupCollection().catch(err => {
  console.error('Mockup koleksiyon kurulum hatası:', err);
  process.exit(1);
});
