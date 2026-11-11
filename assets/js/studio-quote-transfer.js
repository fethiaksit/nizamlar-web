/**
 * Teklif akışında mockup PNG ve kullanıcının orijinal tasarımını
 * sayfalar arasında güvenli şekilde taşı. Veriler IndexedDB'dedir;
 * sessionStorage yalnızca küçük metaveri taşır.
 */
(function () {
  'use strict';
  const DB_NAME = 'nizamlar-studio-quote-v1';
  const STORE = 'pending';
  const KEY = 'latest';

  function openDb() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) return reject(new Error('Tarayıcı dosya depolamasını desteklemiyor.'));
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || new Error('Tasarım depolaması açılamadı.'));
      req.onblocked = () => reject(new Error('Tasarım depolaması başka bir sekme tarafından engelleniyor.'));
    });
  }

  async function transaction(mode, action) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const request = action(tx.objectStore(STORE));
      let value;
      request.onsuccess = () => { value = request.result; };
      request.onerror = () => reject(request.error || new Error('Tasarım depolama hatası.'));
      tx.oncomplete = () => { db.close(); resolve(value); };
      tx.onerror = () => { db.close(); reject(tx.error || new Error('Tasarım işlemi başarısız.')); };
      tx.onabort = () => { db.close(); reject(tx.error || new Error('Tasarım işlemi iptal edildi.')); };
    });
  }

  async function save(previewBlob, originalFile) {
    if (!(previewBlob instanceof Blob) || previewBlob.type !== 'image/png' || !previewBlob.size) {
      throw new Error('Ürün önizlemesi PNG olarak oluşturulamadı.');
    }
    if (previewBlob.size > 25 * 1024 * 1024) {
      throw new Error('Önizleme 25 MB sınırını aşıyor.');
    }
    if (originalFile && (!(originalFile instanceof Blob) || originalFile.size > 25 * 1024 * 1024)) {
      throw new Error('Orijinal tasarım dosyası 25 MB sınırını aşıyor.');
    }
    await transaction('readwrite', store => store.put({
      previewBlob,
      originalFile: originalFile || null,
      savedAt: Date.now()
    }, KEY));
  }

  async function load() {
    const saved = await transaction('readonly', store => store.get(KEY)) || null;
    // 24 saati aşan yarım kalmış müşteri tasarımları tekliflere taşınmaz.
    if (saved && Date.now() - saved.savedAt > 24 * 60 * 60 * 1000) {
      await clear();
      return null;
    }
    return saved;
  }

  async function clear() {
    await transaction('readwrite', store => store.delete(KEY));
  }

  window.NizamlarStudioTransfer = { save, load, clear };
})();
