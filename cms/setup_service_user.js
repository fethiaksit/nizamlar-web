/**
 * NİZAMLAR BASKI — WEB SİTESİ SERVİS KULLANICISI (idempotent)
 * Express'in içeriği okuması ve teklifleri kaydetmesi için SADECE içerik okuma + quote_requests oluşturma yetkisi olan,
 * admin paneline giremeyen bir kullanıcı + statik token üretir. Token .env içine yazılır (ekrana basılmaz).
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { adminClient } = require('./lib/env');

const EMAIL = 'quote-intake@service.nizamlarbaski.com';
const POLICY_NAME = 'Quote Intake (service)';
const ENV_FILE = path.join(__dirname, '..', '.env');

function setEnv(key, value) {
  let s = fs.existsSync(ENV_FILE) ? fs.readFileSync(ENV_FILE, 'utf8') : '';
  const re = new RegExp(`^${key}=.*$`, 'm');
  s = re.test(s) ? s.replace(re, `${key}=${value}`) : s + (s.endsWith('\n') || !s ? '' : '\n') + `${key}=${value}\n`;
  fs.writeFileSync(ENV_FILE, s, { mode: 0o600 });
}

async function main() {
  const { api } = await adminClient();

  let policy = (await api('GET', `/policies?filter[name][_eq]=${encodeURIComponent(POLICY_NAME)}`))[0];
  if (!policy) policy = await api('POST', '/policies', { name: POLICY_NAME, icon: 'verified_user', admin_access: false, app_access: false, description: 'Web sitesi sunucusu: içerik okuma + teklif kaydı oluşturma. Admin/dosya/silme yetkisi YOK.' });

  const perms = await api('GET', `/permissions?limit=-1&filter[policy][_eq]=${policy.id}`);
  const READ = ['site_settings', 'whatsapp_settings', 'seo_settings', 'mockup_preview_settings', 'pages', 'products', 'services',
    'machines', 'production_processes', 'references', 'certificates', 'blog_posts', 'animations_config', 'navigation_menus'];
  const want = [['quote_requests', 'create'], ...READ.map(c => [c, 'read'])];
  for (const [collection, action] of want) {
    if (perms.find(p => p.collection === collection && p.action === action)) continue;
    await api('POST', '/permissions', { policy: policy.id, collection, action, permissions: {}, fields: ['*'] });
  }

  let user = (await api('GET', `/users?filter[email][_eq]=${EMAIL}&fields=id`))[0];
  const token = crypto.randomBytes(32).toString('hex');
  if (!user) {
    user = await api('POST', '/users', { email: EMAIL, password: crypto.randomBytes(24).toString('hex'), first_name: 'Quote', last_name: 'Intake', token, status: 'active' });
    await api('POST', '/access', { user: user.id, policy: policy.id });
    setEnv('DIRECTUS_SERVICE_TOKEN', token);
    console.log('✨ Servis kullanıcısı oluşturuldu; token .env içine yazıldı.');
  } else if (!process.env.DIRECTUS_SERVICE_TOKEN || process.argv.includes('--rotate')) {
    await api('PATCH', `/users/${user.id}`, { token });
    setEnv('DIRECTUS_SERVICE_TOKEN', token);
    console.log('🔁 Servis token yenilendi ve .env içine yazıldı.');
  } else {
    console.log('↩️  Servis kullanıcısı zaten var (token değişmedi).');
  }

  console.log('✅ Servis kullanıcısı hazır. Express\'i yeniden başlatın.');
}
main().catch(e => { console.error('Hata:', e.message); process.exit(1); });
