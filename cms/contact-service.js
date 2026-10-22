'use strict';

// Contact submissions are persisted privately by the server, never by the public browser.
// Email failure never makes a previously saved message disappear.
const DEFAULT_RECIPIENT = 'nizamlartekstill@gmail.com';
const SUBJECTS = Object.freeze({
  dtf: 'DTF Baskı Talebi',
  serigrafi: 'Serigrafi (Emprime) Siparişi',
  tisort: 'Toptan Tişört & Parça Baskı',
  numune: 'Numune Talebi',
  diger: 'Diğer / Genel Bilgi'
});
const attempts = new Map();

function escapeHtml(value) {
  return String(value == null ? '' : value).replace(/&/g, '&amp;')
    .replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function clean(value, max) {
  return typeof value === 'string' ? value.trim().slice(0, max + 1) : '';
}
function validate(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { error: 'Geçersiz form verisi.' };
  if (body.website) return { spam: true };
  const name = clean(body.name, 120);
  const company = clean(body.company, 160);
  const phone = clean(body.phone, 30);
  const email = clean(body.email, 250).toLowerCase();
  const subject = clean(body.subject, 40);
  const message = clean(body.message, 5000);
  if (name.length < 2 || name.length > 120) return { error: 'Ad soyad alanını kontrol edin.' };
  if (company.length > 160) return { error: 'Firma adı çok uzun.' };
  if (!/^[+()\d\s-]{10,30}$/.test(phone) || phone.replace(/\D/g, '').length < 10)
    return { error: 'Telefon numarasını kontrol edin.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 250)
    return { error: 'E-posta adresini kontrol edin.' };
  if (!Object.hasOwn(SUBJECTS, subject)) return { error: 'Bir konu seçin.' };
  if (message.length < 10 || message.length > 5000) return { error: 'Mesaj en az 10, en fazla 5000 karakter olmalı.' };
  return { value: { name, company, phone, email, subject: SUBJECTS[subject], message, status: 'new',
    email_status: 'pending', received_at: new Date().toISOString() } };
}

function limit(ip, now = Date.now()) {
  const key = String(ip || 'unknown');
  const windowMs = 10 * 60 * 1000;
  if (attempts.size > 2000) {
    for (const [k, v] of attempts) if (now - v.first > windowMs) attempts.delete(k);
  }
  let value = attempts.get(key);
  if (!value || now - value.first >= windowMs) value = { first: now, count: 0 };
  value.count++;
  attempts.set(key, value);
  return value.count <= 5;
}

async function directusRequest(url, token, route, options = {}, fetcher = fetch) {
  return fetcher(new URL(route, url), {
    ...options,
    signal: AbortSignal.timeout(8000),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token,
      ...(options.headers || {})
    }
  });
}

async function sendNotification(item, id, config, fetcher = fetch) {
  if (!config.resendKey || !config.mailFrom) return false;
  const recipient = config.mailTo || DEFAULT_RECIPIENT;
  const rows = [
    ['Ad Soyad', item.name], ['Firma', item.company || '—'], ['Telefon', item.phone],
    ['E-posta', item.email], ['Konu', item.subject], ['Mesaj', item.message]
  ];
  const body = rows.map(([label, value]) => '<p><strong>' + escapeHtml(label) +
    ':</strong> ' + escapeHtml(value).replace(/\n/g, '<br>') + '</p>').join('\n');
  const res = await fetcher('https://api.resend.com/emails', {
    method: 'POST',
    signal: AbortSignal.timeout(8000),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + config.resendKey,
      'Idempotency-Key': 'contact/' + id
    },
    body: JSON.stringify({
      from: config.mailFrom,
      to: [recipient],
      reply_to: item.email,
      subject: 'Yeni İletişim Mesajı: ' + item.subject,
      html: '<h2>Nizamlar Baskı — Yeni İletişim Mesajı</h2>' + body
    })
  });
  if (!res.ok) throw new Error('Resend returned HTTP ' + res.status);
  const result = await res.json();
  return Boolean(result.id);
}

function createContactHandler(config, fetcher = fetch, logger = console) {
  return async function handleContact(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    // This basic in-memory limiter is a second layer; use a shared rate limiter in production clusters.
    if (!limit(req.ip)) return res.status(429).json({ success: false, message: 'Çok fazla istek. Biraz sonra tekrar deneyin.' });

    const parsed = validate(req.body);
    if (parsed.spam) return res.status(200).json({ success: true });
    if (parsed.error) return res.status(400).json({ success: false, message: parsed.error });
    if (!config.directusToken) {
      logger.error('Contact API: CONTACT_DIRECTUS_TOKEN is missing');
      return res.status(503).json({ success: false, message: 'Mesaj servisi yapılandırılmamış.' });
    }

    const item = parsed.value;
    let id;
    try {
      const saved = await directusRequest(config.directusUrl, config.directusToken,
        '/items/contact_messages', { method: 'POST', body: JSON.stringify(item) }, fetcher);
      if (!saved.ok) {
        logger.error('Contact save failed. HTTP', saved.status);
        return res.status(502).json({ success: false, message: 'Mesaj kaydedilemedi. Lütfen tekrar deneyin.' });
      }
      const result = await saved.json();
      id = result && result.data && result.data.id;
      if (id == null) throw new Error('Directus did not return a contact id');
    } catch (err) {
      logger.error('Contact save failed:', err.message);
      return res.status(502).json({ success: false, message: 'Mesaj kaydedilemedi. Lütfen tekrar deneyin.' });
    }

    let emailed = false;
    try {
      emailed = await sendNotification(item, id, config, fetcher);
    } catch (err) {
      logger.error('Contact notification failed for saved ID ' + id + ':', err.message);
    }

    // Persist whether the notification was accepted by the email provider.
    try {
      const updated = await directusRequest(config.directusUrl, config.directusToken,
        '/items/contact_messages/' + encodeURIComponent(id), {
          method: 'PATCH', body: JSON.stringify({
            email_status: emailed ? 'sent' : 'pending'
          })
        }, fetcher);
      if (!updated.ok) logger.error('Contact notification status update failed. HTTP', updated.status);
    } catch (err) {
      logger.error('Contact notification status update failed:', err.message);
    }

    return res.status(201).json({
      success: true, saved: true, notification_sent: emailed,
      message: 'Mesajınız kaydedildi. En kısa sürede size dönüş yapacağız.'
    });
  };
}

module.exports = {
  createContactHandler,
  sendNotification,
  validate,
  escapeHtml,
  DEFAULT_RECIPIENT
};
