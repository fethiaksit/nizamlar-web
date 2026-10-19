/**
 * NİZAMLAR BASKI — PUBLIC PERMISSIONS CONFIGURATION
 * Ziyaretçilerin yayınlanmış içerikleri okumasına ve
 * teklif formu göndermesine izin verir (talepleri okuma yetkisi kesinlikle verilmez).
 */

const DIRECTUS_URL = 'http://localhost:8055';
const ADMIN_EMAIL = 'admin@nizamlarbaski.com';
const ADMIN_PASSWORD = 'NizamlarAdmin2026!';

async function setPermissions() {
  const loginRes = await fetch(`${DIRECTUS_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
  });

  const { data: { access_token } } = await loginRes.json();
  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${access_token}` };

  const publicPolicyId = 'abf8a154-5b1c-4a46-ac9c-7300570f4f17';

  const readCollections = [
    'site_settings',
    'whatsapp_settings',
    'pages',
    'products',
    'services',
    'machines',
    'production_processes',
    'references',
    'certificates',
    'blog_posts',
    'animations_config',
    'navigation_menus',
    'seo_settings',
    'directus_files'
  ];

  // Mevcut izinleri kontrol et
  const existingRes = await fetch(`${DIRECTUS_URL}/permissions?filter[policy][_eq]=${publicPolicyId}&limit=100`, { headers });
  const existingPerms = (await existingRes.json()).data;

  for (const col of readCollections) {
    const found = existingPerms.find(p => p.collection === col && p.action === 'read');
    if (!found) {
      const res = await fetch(`${DIRECTUS_URL}/permissions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          policy: publicPolicyId,
          collection: col,
          action: 'read',
          permissions: {},
          fields: ['*']
        })
      });
      console.log(`🔓 Okuma yetkisi verildi: ${col} (${res.status})`);
    } else {
      console.log(`ℹ️  Zaten yetkili: ${col}`);
    }
  }

  // Quote Requests CREATE yetkisi
  const quoteFound = existingPerms.find(p => p.collection === 'quote_requests' && p.action === 'create');
  if (!quoteFound) {
    const res = await fetch(`${DIRECTUS_URL}/permissions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        policy: publicPolicyId,
        collection: 'quote_requests',
        action: 'create',
        permissions: {},
        fields: ['*']
      })
    });
    console.log(`📝 Teklif formu oluşturma yetkisi verildi: quote_requests (${res.status})`);
  } else {
    console.log('ℹ️  Quote requests oluşturma yetkisi zaten mevcut.');
  }

  console.log('✅ Bütün public yetkilendirmeler tamamlandı!');
}

setPermissions().catch(err => {
  console.error('Hata:', err);
  process.exit(1);
});
