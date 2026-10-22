'use strict';

/**
 * NİZAMLAR BASKI — İLETİŞİM MESAJLARI KOLEKSİYONU KURULUMU (idempotent)
 *
 * Güvenli, tekrarlanabilir göç scripti.
 * Kesinlikle cms:setup çalıştırmaz; mevcut veritabanını ve koleksiyonları korur.
 * contact_messages koleksiyonunu oluşturur veya eksik alanları tamamlar.
 * Yalnızca yöneticilere ve servis kullanıcısına yetki verir; ziyaretçilere (public) kapalıdır.
 */

const { adminClient } = require('./lib/env');

const fieldDefs = [
  { field: 'id', type: 'integer', schema: { is_primary_key: true, has_auto_increment: true }, meta: { hidden: true } },
  { field: 'name', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Ad Soyad' }] } },
  { field: 'company', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Firma / Marka' }] } },
  { field: 'phone', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'Telefon' }] } },
  { field: 'email', type: 'string', meta: { interface: 'input', width: 'half', translations: [{ language: 'tr-TR', translation: 'E-posta' }] } },
  { field: 'subject', type: 'string', meta: { interface: 'input', width: 'full', translations: [{ language: 'tr-TR', translation: 'Konu' }] } },
  { field: 'message', type: 'text', meta: { interface: 'textarea', width: 'full', translations: [{ language: 'tr-TR', translation: 'Mesaj' }] } },
  {
    field: 'status',
    type: 'string',
    schema: { default_value: 'new' },
    meta: {
      interface: 'select-dropdown',
      width: 'half',
      options: {
        choices: [
          { text: 'Yeni', value: 'new' },
          { text: 'Okundu', value: 'read' },
          { text: 'Yanıtlandı', value: 'replied' }
        ]
      },
      translations: [{ language: 'tr-TR', translation: 'Mesaj Durumu' }]
    }
  },
  {
    field: 'email_status',
    type: 'string',
    schema: { default_value: 'pending' },
    meta: {
      interface: 'select-dropdown',
      width: 'half',
      options: {
        choices: [
          { text: 'Bekliyor', value: 'pending' },
          { text: 'Gönderildi', value: 'sent' },
          { text: 'Başarısız', value: 'failed' }
        ]
      },
      translations: [{ language: 'tr-TR', translation: 'E-posta Bildirimi' }]
    }
  },
  {
    field: 'received_at',
    type: 'timestamp',
    schema: { default_value: 'NOW()' },
    meta: {
      interface: 'datetime',
      width: 'half',
      translations: [{ language: 'tr-TR', translation: 'Gönderim Zamanı' }]
    }
  }
];

async function run() {
  const { api } = await adminClient();

  const allCols = await api('GET', '/collections');
  const exists = Array.isArray(allCols) && allCols.some(c => c.collection === 'contact_messages');

  if (!exists) {
    const hasGroup = Array.isArray(allCols) && allCols.some(c => c.collection === 'grp_iletisim');
    const group = hasGroup ? 'grp_iletisim' : null;

    await api('POST', '/collections', {
      collection: 'contact_messages',
      schema: {},
      meta: {
        collection: 'contact_messages',
        icon: 'mark_email_unread',
        group,
        note: 'Web sitesi iletişim formu üzerinden gönderilen müşteri mesajları',
        translations: [{ language: 'tr-TR', translation: 'İletişim Mesajları' }]
      },
      fields: fieldDefs
    });
    console.log('✨ [contact_messages] Koleksiyonu başarıyla oluşturuldu.');
  } else {
    const fields = await api('GET', '/fields/contact_messages');
    const existing = new Set((fields || []).map(f => f.field));
    for (const field of fieldDefs) {
      if (existing.has(field.field) || field.field === 'id') continue;
      try {
        await api('POST', '/fields/contact_messages', field);
        console.log(`✨ [contact_messages] Eksik alan eklendi: ${field.field}`);
      } catch (err) {
        console.warn(`⚠️ [contact_messages] Alan ekleme uyarısı (${field.field}):`, err.message);
      }
    }
    console.log('↩️  [contact_messages] Koleksiyonu zaten mevcut; alanlar doğrulandı.');
  }

  // Servis Kullanıcısı Yetkileri (Express'in DIRECTUS_SERVICE_TOKEN ile mesaj kaydedebilmesi ve email_status güncelleyebilmesi için)
  const POLICY_NAME = 'Quote Intake (service)';
  let policy = (await api('GET', `/policies?filter[name][_eq]=${encodeURIComponent(POLICY_NAME)}`))[0];
  if (policy) {
    const perms = await api('GET', `/permissions?limit=-1&filter[policy][_eq]=${policy.id}&filter[collection][_eq]=contact_messages`);
    const actions = ['create', 'read', 'update'];
    for (const action of actions) {
      if (!perms.some(p => p.action === action)) {
        await api('POST', '/permissions', {
          policy: policy.id,
          collection: 'contact_messages',
          action,
          permissions: {},
          fields: ['*']
        });
        console.log(`🔐 Servis kullanıcısına contact_messages [${action}] izni verildi.`);
      }
    }
  }

  console.log('🔒 Güvenlik Kontrolü: contact_messages için public read/create erişimi VERİLMEDİ.');
  console.log('🎉 İletişim Mesajları kurulumu tamamlandı!');
}

if (require.main === module) {
  run().catch(err => {
    console.error('❌ Hata:', err.message);
    process.exit(1);
  });
}

module.exports = { fieldDefs, run };
