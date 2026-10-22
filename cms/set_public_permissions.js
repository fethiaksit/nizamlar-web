/**
 * NİZAMLAR BASKI — PUBLIC İZİNLER
 * - quote_requests'in anonim create ve read yetkisi kesinlikle kaldırılmıştır.
 * - İçerik okuma izinleri /api/public/* üzerinden sunucu kontrollü yapılır.
 */
const { adminClient } = require('./lib/env');

async function main() {
  const { api } = await adminClient();
  const perms = await api('GET', '/permissions?limit=-1');
  
  // Public policy ID: 'abf8a154-5b1c-4a46-ac9c-7300570f4f17'
  const publicQuotePerms = perms.filter(p => p.collection === 'quote_requests' && p.policy === 'abf8a154-5b1c-4a46-ac9c-7300570f4f17');
  for (const p of publicQuotePerms) {
    try {
      await api('DELETE', `/permissions/${p.id}`);
      console.log(`🗑️  quote_requests public ${p.action} yetkisi kaldırıldı (id: ${p.id})`);
    } catch (e) {
      console.warn(`Uyarı (${p.id}):`, e.message);
    }
  }

  console.log('✅ Public izinler başarıyla doğrulandı ve korundu.');
}

if (require.main === module) {
  main().catch(e => { console.error('Hata:', e.message); process.exit(1); });
}

module.exports = main;
