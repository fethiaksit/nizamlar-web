/**
 * Ortak ortam / Directus yardımcıları. Sırlar yalnızca .env veya ortam değişkenlerinden okunur.
 * Bağımlılık eklememek için minimal .env ayrıştırıcı içerir.
 */
const fs = require('fs');
const path = require('path');

function loadDotEnv(file = path.join(__dirname, '..', '..', '.env')) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!m || line.trim().startsWith('#')) continue;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (process.env[m[1]] === undefined) process.env[m[1]] = v;
  }
}
loadDotEnv();

function required(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`❌ Eksik ortam değişkeni: ${name} (.env dosyasını kontrol edin; bkz. .env.example)`);
    process.exit(1);
  }
  return v;
}

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://127.0.0.1:8055';

async function adminLogin() {
  const res = await fetch(`${DIRECTUS_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: required('ADMIN_EMAIL'), password: required('ADMIN_PASSWORD') })
  });
  if (!res.ok) throw new Error(`Directus admin girişi başarısız (HTTP ${res.status})`);
  const { data } = await res.json();
  return data.access_token;
}

/** Yetkili Directus istemcisi: api(method, path, body) -> data (hata durumunda fırlatır). */
async function adminClient() {
  const token = await adminLogin();
  const api = async (method, p, body) => {
    const res = await fetch(`${DIRECTUS_URL}${p}`, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    const text = await res.text();
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch (e) { /* düz metin */ }
    if (!res.ok) {
      const err = new Error(`${method} ${p} -> HTTP ${res.status} ${json && json.errors ? json.errors[0].message : text.slice(0, 200)}`);
      err.status = res.status;
      throw err;
    }
    return json ? json.data : null;
  };
  return { api, token };
}

module.exports = { DIRECTUS_URL, required, adminLogin, adminClient, loadDotEnv };
