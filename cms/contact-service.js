'use strict';

/**
 * NİZAMLAR BASKI — İLETİŞİM FORMU SERVİSİ & E-POSTA BİLDİRİMİ
 *
 * 1. Ziyaretçi formu doldurur.
 * 2. Sunucu tarafı doğrulama, spam ve hız kontrolü yapılır.
 * 3. Mesaj Directus contact_messages koleksiyonuna kaydedilir (status='new', email_status='pending').
 * 4. Kayıt başarılıysa Resend API ile nizamlartekstill@gmail.com adresine profesyonel HTML e-posta bildirimi gönderilir.
 * 5. E-posta yanıtla (reply_to) başlığı müşterinin e-posta adresi olarak ayarlanır.
 * 6. Resend sonucuna göre veritabanındaki email_status ('sent' veya 'failed') güncellenir.
 * 7. E-posta gönderimi başarısız olsa dahi veritabanı kaydı korunur; kullanıcıya gerçek sonuç iletilir.
 */

const DEFAULT_RECIPIENT = 'nizamlartekstill@gmail.com';
const DEFAULT_FROM = 'Nizamlar Baskı <onboarding@resend.dev>';

const SUBJECTS = Object.freeze({
  dtf: 'DTF Baskı Talebi',
  serigrafi: 'Serigrafi (Emprime) Siparişi',
  tisort: 'Toptan Tişört & Parça Baskı',
  numune: 'Numune Talebi',
  diger: 'Diğer / Genel Bilgi'
});

const attempts = new Map();

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function clean(value, max = 500) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function validate(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'Geçersiz form verisi.' };
  }

  // Honeypot spam koruması (gizli alan)
  if (body.website) {
    return { spam: true };
  }

  const name = clean(body.name, 120);
  const company = clean(body.company, 160);
  const phone = clean(body.phone, 30);
  const email = clean(body.email, 250).toLowerCase();
  const rawSubject = clean(body.subject, 100);
  const message = clean(body.message, 5000);

  if (!name || name.length < 2) {
    return { error: 'Lütfen adınızı ve soyadınızı eksiksiz girin.' };
  }

  const digits = phone.replace(/\D/g, '');
  if (!phone || digits.length < 10 || !/^[+()\d\s-]{10,30}$/.test(phone)) {
    return { error: 'Lütfen geçerli bir telefon numarası girin (en az 10 hane).' };
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'Lütfen geçerli bir e-posta adresi girin.' };
  }

  let subject = SUBJECTS[rawSubject] || rawSubject;
  if (!subject || subject.length < 2) {
    subject = 'Genel İletişim Mesajı';
  }

  if (!message || message.length < 10) {
    return { error: 'Mesajınız çok kısa. Lütfen en az 10 karakter yazınız.' };
  }

  return {
    value: {
      name,
      company: company || '—',
      phone,
      email,
      subject,
      message,
      status: 'new',
      email_status: 'pending',
      received_at: new Date().toISOString()
    }
  };
}

function limit(ip, now = Date.now()) {
  const key = String(ip || 'unknown');
  const windowMs = 10 * 60 * 1000; // 10 dakika
  if (attempts.size > 2000) {
    for (const [k, v] of attempts) {
      if (now - v.first > windowMs) attempts.delete(k);
    }
  }
  let value = attempts.get(key);
  if (!value || now - value.first >= windowMs) {
    value = { first: now, count: 0 };
  }
  value.count++;
  attempts.set(key, value);
  return value.count <= 10;
}

function renderHtmlEmail(item) {
  const formattedDate = new Date().toLocaleString('tr-TR', {
    timeZone: 'Europe/Istanbul',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const escapedName = escapeHtml(item.name);
  const escapedCompany = escapeHtml(item.company || '—');
  const escapedPhone = escapeHtml(item.phone);
  const escapedEmail = escapeHtml(item.email);
  const escapedSubject = escapeHtml(item.subject);
  const formattedMessage = escapeHtml(item.message).replace(/\r?\n/g, '<br>');

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <title>Nizamlar Baskı — Yeni İletişim Mesajı</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f6f5f0; margin: 0; padding: 24px; color: #1c1d20;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #e5e0d8; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    
    <!-- Başlık / Marka -->
    <div style="background-color: #1a1a1c; padding: 24px 28px; border-bottom: 3px solid #c5a059;">
      <h1 style="margin: 0; font-size: 20px; color: #ffffff; font-weight: 700; letter-spacing: 0.5px;">
        NİZAMLAR BASKI
      </h1>
      <p style="margin: 4px 0 0 0; color: #c5a059; font-size: 13px; font-weight: 500;">
        Yeni İletişim Formu Mesajı
      </p>
    </div>

    <!-- Gövde -->
    <div style="padding: 28px;">
      <p style="margin-top: 0; font-size: 15px; color: #444; line-height: 1.5;">
        Web sitesi iletişim formu üzerinden yeni bir müşteri mesajı alındı:
      </p>

      <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
        <tr style="border-bottom: 1px solid #f0eee8;">
          <td style="padding: 10px 0; color: #777; width: 140px; font-weight: 600;">Ad Soyad:</td>
          <td style="padding: 10px 0; color: #111; font-weight: 700;">${escapedName}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f0eee8;">
          <td style="padding: 10px 0; color: #777; font-weight: 600;">Firma / Marka:</td>
          <td style="padding: 10px 0; color: #111;">${escapedCompany}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f0eee8;">
          <td style="padding: 10px 0; color: #777; font-weight: 600;">Telefon:</td>
          <td style="padding: 10px 0;"><a href="tel:${escapedPhone}" style="color: #c5a059; text-decoration: none; font-weight: 600;">${escapedPhone}</a></td>
        </tr>
        <tr style="border-bottom: 1px solid #f0eee8;">
          <td style="padding: 10px 0; color: #777; font-weight: 600;">E-posta:</td>
          <td style="padding: 10px 0;"><a href="mailto:${escapedEmail}" style="color: #c5a059; text-decoration: none; font-weight: 600;">${escapedEmail}</a></td>
        </tr>
        <tr style="border-bottom: 1px solid #f0eee8;">
          <td style="padding: 10px 0; color: #777; font-weight: 600;">Konu:</td>
          <td style="padding: 10px 0; color: #111; font-weight: 600;">${escapedSubject}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #777; font-weight: 600;">Tarih:</td>
          <td style="padding: 10px 0; color: #555;">${formattedDate}</td>
        </tr>
      </table>

      <!-- Mesaj Alanı -->
      <div style="margin-top: 24px;">
        <div style="font-size: 13px; font-weight: 700; color: #777; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
          Mesaj İçeriği:
        </div>
        <div style="background-color: #faf8f5; border: 1px solid #ede8e1; border-left: 4px solid #c5a059; border-radius: 4px; padding: 16px 18px; font-size: 14px; line-height: 1.6; color: #222;">
          ${formattedMessage}
        </div>
      </div>

      <!-- Doğrudan Yanıtla Uyarısı -->
      <div style="margin-top: 24px; padding: 12px 16px; background-color: #f2f7f4; border-radius: 6px; border: 1px solid #d5e8dc; font-size: 13px; color: #1d6b42;">
        💡 <strong>Müşteriye Yanıt:</strong> Bu e-postaya "Yanıtla / Reply" butonuna basarak doğrudan <strong>${escapedEmail}</strong> adresine cevap verebilirsiniz.
      </div>
    </div>

    <!-- Alt Bilgi -->
    <div style="background-color: #fbfaf8; border-top: 1px solid #ede8e1; padding: 16px 28px; text-align: center; font-size: 12px; color: #888;">
      Bu bildirim <strong>nizamlarbaski.com</strong> kurumsal web sitesi üzerinden iletilmiştir.
    </div>
  </div>
</body>
</html>`;
}

async function sendNotification(item, id, config, fetcher = fetch) {
  const key = config.resendKey || process.env.RESEND_API_KEY;
  if (!key) {
    return { ok: false, reason: 'RESEND_API_KEY yapılandırılmamış' };
  }

  const recipient = config.mailTo || process.env.CONTACT_NOTIFICATION_EMAIL || DEFAULT_RECIPIENT;
  const mailFrom = config.mailFrom || process.env.RESEND_FROM || DEFAULT_FROM;
  const html = renderHtmlEmail(item);

  const res = await fetcher('https://api.resend.com/emails', {
    method: 'POST',
    signal: AbortSignal.timeout(10000),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    },
    body: JSON.stringify({
      from: mailFrom,
      to: [recipient],
      reply_to: item.email,
      subject: 'Nizamlar Baskı | Yeni İletişim Mesajı',
      html
    })
  });

  if (!res.ok) {
    const errorBody = await res.text().catch(() => '');
    throw new Error(`Resend HTTP ${res.status}: ${errorBody.slice(0, 300)}`);
  }

  const result = await res.json().catch(() => ({}));
  return { ok: true, id: result.id };
}

function createContactHandler(config, fetcher = fetch, logger = console) {
  return async function handleContact(req, res) {
    res.setHeader('Cache-Control', 'no-store');

    // Hız sınırlaması
    if (!limit(req.ip)) {
      return res.status(429).json({
        success: false,
        message: 'Çok fazla mesaj denemesi yapıldı. Lütfen birkaç dakika sonra tekrar deneyin.'
      });
    }

    const parsed = validate(req.body);
    if (parsed.spam) {
      // Honeypot tetiklendiğinde botu yanıltmak için sessizce 200 dön
      return res.status(200).json({ success: true, saved: false });
    }

    if (parsed.error) {
      return res.status(400).json({ success: false, message: parsed.error });
    }

    const directusUrl = config.directusUrl || process.env.DIRECTUS_URL || 'http://127.0.0.1:8055';
    const directusToken = config.directusToken || process.env.DIRECTUS_SERVICE_TOKEN;

    if (!directusToken) {
      logger.error('İletişim API: DIRECTUS_SERVICE_TOKEN tanımlı değil');
      return res.status(503).json({
        success: false,
        message: 'Mesaj servisi şu anda yapılandırılmamış. Lütfen telefon veya WhatsApp ile ulaşın.'
      });
    }

    const item = parsed.value;
    let savedId = null;

    // 1. Directus veritabanına kaydet
    try {
      const saveRes = await fetcher(new URL('/items/contact_messages', directusUrl), {
        method: 'POST',
        signal: AbortSignal.timeout(8000),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${directusToken}`
        },
        body: JSON.stringify(item)
      });

      if (!saveRes.ok) {
        const body = await saveRes.text().catch(() => '');
        logger.error(`Directus contact save failed (HTTP ${saveRes.status}):`, body.slice(0, 200));
        return res.status(502).json({
          success: false,
          saved: false,
          message: 'Mesajınız veritabanına kaydedilemedi. Lütfen tekrar deneyin veya telefonla arayın.'
        });
      }

      const saveJson = await saveRes.json().catch(() => ({}));
      savedId = saveJson && saveJson.data && saveJson.data.id;
      if (savedId == null) {
        throw new Error('Directus kayıt ID dönmedi.');
      }
    } catch (err) {
      logger.error('İletişim mesajı kayıt hatası:', err.message);
      return res.status(502).json({
        success: false,
        saved: false,
        message: 'Mesajınız kaydedilemedi. Lütfen tekrar deneyin veya telefonla ulaşın.'
      });
    }

    // 2. Resend e-posta bildirimi gönder (Başarısız olsa bile veritabanı kaydı korunur)
    let emailStatus = 'pending';
    let emailSuccess = false;
    try {
      const emailResult = await sendNotification(item, savedId, config, fetcher);
      if (emailResult.ok) {
        emailStatus = 'sent';
        emailSuccess = true;
      } else {
        emailStatus = 'failed';
        logger.warn('E-posta bildirimi atlandı:', emailResult.reason);
      }
    } catch (err) {
      emailStatus = 'failed';
      logger.error(`E-posta bildirim hatası (Mesaj ID: ${savedId}):`, err.message);
    }

    // 3. Veritabanındaki email_status alanını güncelle
    try {
      await fetcher(new URL(`/items/contact_messages/${encodeURIComponent(savedId)}`, directusUrl), {
        method: 'PATCH',
        signal: AbortSignal.timeout(6000),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${directusToken}`
        },
        body: JSON.stringify({ email_status: emailStatus })
      });
    } catch (err) {
      logger.warn(`Mesaj ID ${savedId} email_status güncellenemedi:`, err.message);
    }

    return res.status(201).json({
      success: true,
      saved: true,
      id: savedId,
      notification_sent: emailSuccess,
      message: 'Mesajınız başarıyla kaydedildi. En kısa sürede sizinle iletişime geçilecektir.'
    });
  };
}

module.exports = {
  createContactHandler,
  sendNotification,
  validate,
  renderHtmlEmail,
  escapeHtml,
  DEFAULT_RECIPIENT,
  DEFAULT_FROM
};
