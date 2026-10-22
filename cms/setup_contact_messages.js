'use strict';

// Safe, idempotent migration. Never run cms:setup for contact messages:
// that command deletes and recreates pre-existing collections.
const base = process.env.DIRECTUS_URL || 'http://127.0.0.1:8055';

async function authHeaders() {
  let token = process.env.DIRECTUS_ADMIN_TOKEN;
  if (!token) {
    if (!process.env.DIRECTUS_ADMIN_EMAIL || !process.env.DIRECTUS_ADMIN_PASSWORD) {
      throw new Error('Set DIRECTUS_ADMIN_TOKEN or DIRECTUS_ADMIN_EMAIL and DIRECTUS_ADMIN_PASSWORD in environment.');
    }
    const result = await fetch(new URL('/auth/login', base), {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: process.env.DIRECTUS_ADMIN_EMAIL,
        password: process.env.DIRECTUS_ADMIN_PASSWORD })
    });
    if (!result.ok) throw new Error('Directus admin login failed: HTTP ' + result.status);
    token = (await result.json()).data?.access_token;
  }
  if (!token) throw new Error('Missing Directus admin token.');
  return { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' };
}

const fieldDefs = [
  { field: 'id', type: 'integer', schema: { is_primary_key: true, has_auto_increment: true }, meta: { hidden: true } },
  { field: 'name', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Ad Soyad' }] } },
  { field: 'company', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Firma / Marka' }] } },
  { field: 'phone', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Telefon' }] } },
  { field: 'email', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'E-posta' }] } },
  { field: 'subject', type: 'string', meta: { interface: 'input', width: 'full', translations: [{ language: 'tr-TR', translation: 'Konu' }] } },
  { field: 'message', type: 'text', meta: { interface: 'textarea', width: 'full', translations: [{ language: 'tr-TR', translation: 'Mesaj' }] } },
  { field: 'status', type: 'string', meta: { interface: 'select-dropdown', width: 'half', options: { choices: [
    { text: 'Yeni', value: 'new' }, { text: 'Okundu', value: 'read' }, { text: 'Yanıtlandı', value: 'replied' }
  ] }, translations: [{ language: 'tr-TR', translation: 'Mesaj Durumu' }] } },
  { field: 'received_at', type: 'timestamp', meta: { interface: 'datetime', width: 'half', translations: [{ language: 'tr-TR', translation: 'Alınma Zamanı' }] } },
  { field: 'email_status', type: 'string', meta: { interface: 'select-dropdown', width: 'half', options: { choices: [
    { text: 'Beklemede', value: 'pending' }, { text: 'Gönderildi', value: 'sent' }
  ] }, translations: [{ language: 'tr-TR', translation: 'E-posta Bildirimi' }] } }
];

async function run() {
  const headers = await authHeaders();
  const request = async (path, opts = {}) => {
    const res = await fetch(new URL(path, base), { ...opts, headers });
    if (res.ok) return res.json().catch(() => ({}));
    const body = (await res.text()).slice(0, 300);
    const error = new Error('Directus ' + opts.method?.toUpperCase() + ' ' + path +
      ': HTTP ' + res.status + ' ' + body);
    error.status = res.status;
    throw error;
  };

  let exists = false;
  try {
    await request('/collections/contact_messages');
    exists = true;
  } catch (err) {
    if (err.status !== 404) throw err;
  }

  if (!exists) {
    let group = null;
    try { await request('/collections/grp_iletisim'); group = 'grp_iletisim'; }
    catch (e) { if (e.status !== 404) throw e; }
    await request('/collections', {
      method: 'POST',
      body: JSON.stringify({
        collection: 'contact_messages', schema: {},
        meta: {
          collection: 'contact_messages', icon: 'mark_email_unread',
          group, note: 'Yalnızca yöneticilerin erişebildiği iletişim talepleri',
          translations: [{ language: 'tr-TR', translation: 'İletişim Mesajları' }]
        },
        fields: fieldDefs
      })
    });
    console.log('İletişim Mesajları koleksiyonu oluşturuldu.');
  } else {
    const result = await request('/fields/contact_messages');
    const existing = new Set((result.data || []).map(item => item.field));
    for (const field of fieldDefs) {
      if (existing.has(field.field)) continue;
      if (field.field === 'id') continue;
      await request('/fields/contact_messages', { method: 'POST', body: JSON.stringify(field) });
      console.log('Eksik alan eklendi:', field.field);
    }
    console.log('İletişim Mesajları koleksiyonu mevcut; eksik alanlar kontrol edildi.');
  }
  console.log('Güvenlik: Public read/create izinleri VERİLMEDİ. Mesaj ekleme backend token ile yapılır.');
}

if (require.main === module) run().catch(err => { console.error(err.message); process.exitCode = 1; });
module.exports = { fieldDefs, run };
