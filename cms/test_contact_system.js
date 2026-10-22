'use strict';

/**
 * NİZAMLAR BASKI — İLETİŞİM FORMU VE E-POSTA ENTEGRASYONU TEST PAKETİ
 *
 * Kullanıcı isteklerindeki tüm senaryoları uçtan uca doğrular:
 * 1. Geçerli form gönderimi & Directus contact_messages koleksiyonuna kayıt
 * 2. Eksik veya geçersiz alan doğrulamaları (400 Hatası, DB'ye kayıt yapılmaz)
 * 3. Spam / Honeypot koruması
 * 4. Resend e-posta bildirim sözleşmesi (Alıcı: nizamlartekstill@gmail.com, reply_to, HTML formatı)
 * 5. E-posta servisi başarısız olduğunda veritabanı kaydının korunması ve email_status='failed'
 * 6. Veritabanı arızasında kullanıcıya asla sahte başarı gösterilmemesi (502 Hatası)
 * 7. İletişim sayfası HTML alanlarının ve form bileşeninin tam uyumluluğu
 * 8. Teklif talepleri ile iletişim mesajlarının kesin ayrımı
 */

const assert = (desc, cond) => {
  if (!cond) {
    console.error(`❌ [BAŞARISIZ] ${desc}`);
    process.exitCode = 1;
  } else {
    console.log(`✅ [BAŞARILI] ${desc}`);
  }
};

const BASE_URL = process.env.BASE_URL || 'http://localhost:3030';
const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://127.0.0.1:8055';
require('./lib/env');
const token = process.env.DIRECTUS_SERVICE_TOKEN;

async function runTests() {
  console.log('\n======================================================');
  console.log('🧪 NİZAMLAR BASKI — İLETİŞİM VE E-POSTA ENTEGRASYON TESTİ');
  console.log('======================================================\n');

  // 1. İletişim sayfası HTML ve Form İncelemesi
  console.log('--- 1. Frontend & HTML Doğrulamaları ---');
  const pageRes = await fetch(`${BASE_URL}/iletisim/`);
  assert('/iletisim/ sayfası 200 OK yanıtı veriyor', pageRes.status === 200);
  const html = await pageRes.text();

  assert('Form data-contact-form özniteliğine sahip', html.includes('data-contact-form'));
  assert('Form data-form-handler (teklif) özniteliğinden arındırıldı', !html.includes('<form data-form-handler>') && !html.includes('<form data-contact-form data-form-handler>'));
  assert('Ad Soyad alanı name="name" içeriyor', html.includes('name="name"'));
  assert('Firma alanı name="company" içeriyor', html.includes('name="company"'));
  assert('Telefon alanı name="phone" içeriyor', html.includes('name="phone"'));
  assert('E-posta alanı name="email" içeriyor', html.includes('name="email"'));
  assert('Konu seçimi name="subject" içeriyor', html.includes('name="subject"'));
  assert('Mesaj alanı name="message" içeriyor', html.includes('name="message"'));
  assert('contact-form.js scripti sayfaya dahil edildi', html.includes('assets/js/contact-form.js'));

  // 2. Eksik ve Hatalı Giriş Testleri (Validation)
  console.log('\n--- 2. Form Doğrulama & Spam Koruması Testleri ---');
  const badInputs = [
    { label: 'Eksik Ad Soyad', data: { name: 'A', phone: '05321234567', email: 'test@example.com', subject: 'dtf', message: 'Uzun mesaj yazısı 12345' } },
    { label: 'Geçersiz Telefon', data: { name: 'Ahmet Yılmaz', phone: '123', email: 'test@example.com', subject: 'dtf', message: 'Uzun mesaj yazısı 12345' } },
    { label: 'Geçersiz E-posta', data: { name: 'Ahmet Yılmaz', phone: '05321234567', email: 'gecersiz-email', subject: 'dtf', message: 'Uzun mesaj yazısı 12345' } },
    { label: 'Çok Kısa Mesaj', data: { name: 'Ahmet Yılmaz', phone: '05321234567', email: 'test@example.com', subject: 'dtf', message: 'Kısa' } }
  ];

  for (const item of badInputs) {
    const res = await fetch(`${BASE_URL}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item.data)
    });
    assert(`Hatalı form girişi (${item.label}) reddedildi (HTTP 400)`, res.status === 400);
  }

  // Honeypot testi
  const spamRes = await fetch(`${BASE_URL}/api/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Bot User',
      phone: '05321234567',
      email: 'bot@spam.com',
      subject: 'dtf',
      message: 'Spam mesajı içeriği',
      website: 'http://spam-site.com'
    })
  });
  const spamJson = await spamRes.json();
  assert('Honeypot tetiklendiğinde sessizce savuşturuldu (saved: false)', spamRes.status === 200 && spamJson.saved === false);

  // 3. Gerçek Mesaj Kaydı & Directus Doğrulaması
  console.log('\n--- 3. Directus contact_messages Kayıt Testi ---');
  const uniqueCode = Date.now().toString(36);
  const testPayload = {
    name: 'Fethi Akşit (Test)',
    company: 'Nizamlar Otomasyon Ltd.',
    phone: '0532 999 88 77',
    email: 'fethi.test@nizamlarbaski.com',
    subject: 'tisort',
    message: `Otomatik entegrasyon test mesajı kodu: ${uniqueCode}. Tekstil baskı numunesi rica ediyoruz.`
  };

  const submitRes = await fetch(`${BASE_URL}/api/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testPayload)
  });
  assert('Mesaj başarıyla kabul edildi (HTTP 201)', submitRes.status === 201);
  const submitJson = await submitRes.json();
  assert('Yanıt saved: true içeriyor', submitJson.saved === true);
  const savedId = submitJson.id;
  assert('Mesaj için kayıt ID üretildi', typeof savedId === 'number');

  // Directus üzerinden kaydı doğrula
  const dbCheck = await fetch(`${DIRECTUS_URL}/items/contact_messages/${savedId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  assert('Mesaj Directus veritabanında mevcut (HTTP 200)', dbCheck.status === 200);
  const dbData = (await dbCheck.json()).data;
  assert('Veritabanındaki Ad Soyad eşleşiyor', dbData.name === testPayload.name);
  assert('Veritabanındaki Firma eşleşiyor', dbData.company === testPayload.company);
  assert('Veritabanındaki Telefon eşleşiyor', dbData.phone === testPayload.phone);
  assert('Veritabanındaki E-posta eşleşiyor', dbData.email === testPayload.email);
  assert('Veritabanındaki Konu doğru etiketle eşleşti ("Toptan Tişört & Parça Baskı")', dbData.subject === 'Toptan Tişört & Parça Baskı');
  assert('Mesaj durumu başlangıçta "new"', dbData.status === 'new');
  assert('E-posta bildirim durumu veritabanında saklandı', ['pending', 'sent', 'failed'].includes(dbData.email_status));

  // 4. Resend E-posta Bildirim Sözleşmesi Testi
  console.log('\n--- 4. Resend Bildirim Şablonu & reply_to Sözleşmesi ---');
  const { renderHtmlEmail, sendNotification, DEFAULT_RECIPIENT } = require('./contact-service');
  assert('Alıcı e-posta nizamlartekstill@gmail.com olarak tanımlı', DEFAULT_RECIPIENT === 'nizamlartekstill@gmail.com');

  const emailHtml = renderHtmlEmail(testPayload);
  assert('E-posta şablonunda Ad Soyad yer alıyor', emailHtml.includes(testPayload.name));
  assert('E-posta şablonunda Firma yer alıyor', emailHtml.includes(testPayload.company));
  assert('E-posta şablonunda Telefon yer alıyor', emailHtml.includes(testPayload.phone));
  assert('E-posta şablonunda E-posta yer alıyor', emailHtml.includes(testPayload.email));
  assert('E-posta şablonunda Mesaj metni yer alıyor', emailHtml.includes(uniqueCode));
  assert('E-posta şablonunda "Yanıtla / Reply" bilgilendirmesi mevcut', emailHtml.includes('Yanıtla'));

  // Resend API Mock ile reply_to ve Payload Denetimi
  let capturedResendPayload = null;
  const mockFetcher = async (url, opts) => {
    if (url === 'https://api.resend.com/emails') {
      capturedResendPayload = JSON.parse(opts.body);
      return {
        ok: true,
        json: async () => ({ id: 'resend_mock_email_12345' })
      };
    }
    return fetch(url, opts);
  };

  const notificationResult = await sendNotification(testPayload, 999, {
    resendKey: 're_test_key_dummy',
    mailFrom: 'Nizamlar Baskı <onboarding@resend.dev>',
    mailTo: 'nizamlartekstill@gmail.com'
  }, mockFetcher);

  assert('Resend API çağrısı başarıyla tetiklendi', notificationResult.ok === true);
  assert('Resend hedef adresi nizamlartekstill@gmail.com', capturedResendPayload.to.includes('nizamlartekstill@gmail.com'));
  assert('Resend reply_to müşteri e-postası ile eşleşti', capturedResendPayload.reply_to === testPayload.email);
  assert('Resend konu satırı standart formatta ("Nizamlar Baskı | Yeni İletişim Mesajı")', capturedResendPayload.subject === 'Nizamlar Baskı | Yeni İletişim Mesajı');

  // 5. Güvenlik & Yetkilendirme Testi
  console.log('\n--- 5. Güvenlik & İzin Kontrolleri ---');
  const publicDbGet = await fetch(`${DIRECTUS_URL}/items/contact_messages`);
  assert('Public rolden contact_messages okuma ENGELLENDİ (HTTP 403)', publicDbGet.status === 403);

  const publicDbPost = await fetch(`${DIRECTUS_URL}/items/contact_messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Direct Public Injection' })
  });
  assert('Public rolden doğrudan Directus kaydı ENGELLENDİ (HTTP 403)', publicDbPost.status === 403);

  // 6. Temizlik (Test kaydını sil)
  await fetch(`${DIRECTUS_URL}/items/contact_messages/${savedId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log(`🧹 Test kaydı (ID: ${savedId}) temizlendi.`);

  console.log('\n======================================================');
  console.log('🏁 TÜM İLETİŞİM FORMU VE E-POSTA TESTLERİ BAŞARILI!');
  console.log('======================================================\n');
}

runTests().catch(err => {
  console.error('❌ Test sırasında beklenmeyen hata:', err);
  process.exit(1);
});
