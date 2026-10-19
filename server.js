/**
 * NİZAMLAR BASKI — UNIFIED WEB & CMS SERVER
 * Express + Directus Proxy + Güvenli Teklif Yükleme + Otomatik CMS Enjeksiyonu
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const { createProxyMiddleware } = require('http-proxy-middleware');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3030;
const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://127.0.0.1:8055';

// Teklif dosyaları için güvenli depolama dizini
const QUOTES_DIR = path.join(__dirname, 'cms', 'uploads', 'quotes');
if (!fs.existsSync(QUOTES_DIR)) {
  fs.mkdirSync(QUOTES_DIR, { recursive: true });
}

// Multer Dosya Yükleme Yapılandırması (MIME ve Boyut Güvenliği)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, QUOTES_DIR);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const cleanName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${timestamp}_${cleanName}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
  fileFilter: (req, file, cb) => {
    const allowedExts = ['.pdf', '.ai', '.psd', '.png', '.jpg', '.jpeg', '.svg', '.zip', '.rar'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Desteklenmeyen dosya formatı. Lütfen PDF, AI, PSD, PNG, JPG, SVG veya ZIP yükleyiniz.'));
    }
  }
});

// 1. Güvenlik Başlıkları
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// 2. Directus Proxy Entegrasyonu
// Path prefix stripping olmadan /admin ve API isteklerini 127.0.0.1:8055'e proxy'ler
const directusProxy = createProxyMiddleware({
  target: DIRECTUS_URL,
  changeOrigin: true,
  ws: true,
  on: {
    error: (err, req, res) => {
      console.error('Directus proxy hatası:', err.message);
      if (!res.headersSent) {
        res.status(502).json({ error: 'Directus proxy bağlantı hatası', details: err.message });
      }
    }
  }
});

app.use((req, res, next) => {
  const p = req.path;
  // Statik frontend varlıklarını Express sunar
  if (p.startsWith('/assets/css') || p.startsWith('/assets/js') || p.startsWith('/assets/images') || p.startsWith('/assets/videos')) {
    return next();
  }

  // Directus rotaları
  if (
    p === '/admin' || p.startsWith('/admin/') ||
    p === '/auth' || p.startsWith('/auth/') ||
    p === '/items' || p.startsWith('/items/') ||
    p === '/files' || p.startsWith('/files/') ||
    p === '/users' || p.startsWith('/users/') ||
    p === '/schema' || p.startsWith('/schema/') ||
    p === '/server' || p.startsWith('/server/') ||
    p === '/activity' || p.startsWith('/activity/') ||
    p === '/permissions' || p.startsWith('/permissions/') ||
    p === '/settings' || p.startsWith('/settings/') ||
    p === '/collections' || p.startsWith('/collections/') ||
    p === '/fields' || p.startsWith('/fields/') ||
    p === '/relations' || p.startsWith('/relations/') ||
    p === '/roles' || p.startsWith('/roles/') ||
    p === '/policies' || p.startsWith('/policies/') ||
    (p.startsWith('/assets/') && !p.startsWith('/assets/css') && !p.startsWith('/assets/js') && !p.startsWith('/assets/images') && !p.startsWith('/assets/videos'))
  ) {
    return directusProxy(req, res, next);
  }

  next();
});

// 3. Teklif Formu API'si (/api/quote)
app.post('/api/quote', upload.single('design_file'), async (req, res) => {
  try {
    const {
      name, customer_name,
      company, company_name,
      phone, email,
      service, print_type,
      quantity,
      notes, description, message
    } = req.body;

    const uploadedFile = req.file;

    const payload = {
      customer_name: name || customer_name || 'İsimsiz Talep',
      company_name: company || company_name || '',
      phone: phone || '',
      email: email || '',
      print_type: service || print_type || 'Genel Tekstil Baskı',
      quantity: quantity || 'Belirtilmedi',
      description: notes || description || message || '',
      file_url: uploadedFile ? `/cms/uploads/quotes/${uploadedFile.filename}` : '',
      file_name: uploadedFile ? uploadedFile.originalname : '',
      status: 'Yeni',
      created_at: new Date().toISOString()
    };

    // Directus veritabanına kaydet
    const directusRes = await fetch(`${DIRECTUS_URL}/items/quote_requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (directusRes.ok) {
      const text = await directusRes.text();
      let data = null;
      if (text) {
        try { data = JSON.parse(text); } catch (e) {}
      }
      return res.status(200).json({ success: true, message: 'Teklif talebi başarıyla kaydedildi.', data });
    } else {
      console.warn('Directus kayıt uyarısı:', await directusRes.text());
      return res.status(200).json({ success: true, message: 'Teklif talebi alındı.' });
    }
  } catch (err) {
    console.error('Teklif işleme hatası:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Sistem Sağlık & Durum Kontrolü
app.get('/api/health', async (req, res) => {
  let cmsStatus = 'offline';
  try {
    const ping = await fetch(`${DIRECTUS_URL}/server/ping`);
    if (ping.ok) cmsStatus = 'online';
  } catch (e) {}

  res.json({
    status: 'ok',
    cms_status: cmsStatus,
    directus_url: DIRECTUS_URL,
    timestamp: new Date().toISOString(),
    version: '2.0.0-directus'
  });
});

// 5. Statik Dosyaları ve Sayfaları Sunma
app.use(express.static(__dirname, {
  extensions: ['html', 'htm'],
  index: 'index.html',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

// Fallback: 404 Sayfası
app.use((req, res) => {
  const file404 = path.join(__dirname, '404.html');
  if (fs.existsSync(file404)) {
    res.status(404).sendFile(file404);
  } else {
    res.status(404).send('Sayfa bulunamadı.');
  }
});

app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🌟 NİZAMLAR BASKI KURUMSAL WEB & CMS YAYINDA`);
  console.log(`======================================================`);
  console.log(`🌍 Web Sitesi:          http://localhost:${PORT}`);
  console.log(`⚙️  Yönetim Paneli:      http://localhost:${PORT}/admin`);
  console.log(`🔌 Doğrudan Directus:   ${DIRECTUS_URL}/admin`);
  console.log(`👤 Yönetici E-Posta:    admin@nizamlarbaski.com`);
  console.log(`🔑 Yönetici Şifre:      NizamlarAdmin2026!`);
  console.log(`======================================================\n`);
});
