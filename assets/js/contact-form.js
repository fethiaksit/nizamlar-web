/**
 * NİZAMLAR BASKI — İLETİŞİM FORMU YÖNETİCİSİ
 *
 * Form verilerini /api/contact uç noktasına iletir.
 * Sunucu tarafında veritabanına kaydedildiğinde (saved === true) başarılı geribildirim gösterir.
 * Hata veya kayıt başarısızlığında asla sahte başarı modalı açmaz; hatayı açıkça gösterir.
 */

(function () {
  'use strict';

  function initContactForm() {
    const form = document.querySelector('form[data-contact-form]');
    if (!form || form.dataset.contactBound === '1') return;
    form.dataset.contactBound = '1';

    // 1. Spam Honeypot Alanı (İnsanlar görmez)
    if (!form.querySelector('input[name="website"]')) {
      const hp = document.createElement('input');
      hp.type = 'text';
      hp.name = 'website';
      hp.tabIndex = -1;
      hp.autocomplete = 'off';
      hp.setAttribute('aria-hidden', 'true');
      hp.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;';
      form.appendChild(hp);
    }

    // 2. Hata & Durum Mesaj Kutusu
    let statusBox = form.querySelector('.contact-form-status');
    if (!statusBox) {
      statusBox = document.createElement('div');
      statusBox.className = 'contact-form-status';
      statusBox.setAttribute('role', 'alert');
      statusBox.style.cssText = 'display:none;margin:1rem 0;padding:0.9rem 1.1rem;border-radius:6px;font-size:0.92rem;line-height:1.5;';
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn && submitBtn.parentNode) {
        submitBtn.parentNode.insertBefore(statusBox, submitBtn);
      } else {
        form.appendChild(statusBox);
      }
    }

    const showMessage = (msg, isSuccess = false) => {
      statusBox.textContent = msg;
      statusBox.style.display = 'block';
      if (isSuccess) {
        statusBox.style.backgroundColor = '#f2f7f4';
        statusBox.style.color = '#1d6b42';
        statusBox.style.border = '1px solid #c2e0ce';
      } else {
        statusBox.style.backgroundColor = '#fdf2f2';
        statusBox.style.color = '#b42318';
        statusBox.style.border = '1px solid #fecdca';
      }
      statusBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };

    const hideMessage = () => {
      statusBox.style.display = 'none';
      statusBox.textContent = '';
    };

    const submitBtn = form.querySelector('button[type="submit"]');
    const modal = document.querySelector('.modal-feedback');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideMessage();

      // HTML5 Doğrulama
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const nameInput = form.querySelector('[name="name"]');
      const phoneInput = form.querySelector('[name="phone"]');
      const emailInput = form.querySelector('[name="email"]');
      const subjectInput = form.querySelector('[name="subject"]');
      const messageInput = form.querySelector('[name="message"]');
      const hpInput = form.querySelector('[name="website"]');

      const payload = {
        name: (nameInput ? nameInput.value : '').trim(),
        company: (form.querySelector('[name="company"]')?.value || '').trim(),
        phone: (phoneInput ? phoneInput.value : '').trim(),
        email: (emailInput ? emailInput.value : '').trim(),
        subject: (subjectInput ? subjectInput.value : '').trim(),
        message: (messageInput ? messageInput.value : '').trim(),
        website: hpInput ? hpInput.value : ''
      };

      // Ön uç hızlı doğrulamaları
      if (payload.name.length < 2) {
        return showMessage('Lütfen adınızı ve soyadınızı eksiksiz giriniz.');
      }
      const digits = payload.phone.replace(/\D/g, '');
      if (digits.length < 10) {
        return showMessage('Lütfen geçerli bir telefon numarası giriniz (en az 10 hane).');
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
        return showMessage('Lütfen geçerli bir e-posta adresi giriniz.');
      }
      if (!payload.subject) {
        return showMessage('Lütfen mesajınız için bir konu seçiniz.');
      }
      if (payload.message.length < 10) {
        return showMessage('Lütfen en az 10 karakterlik bir mesaj yazınız.');
      }

      // Çift gönderimi engelle
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.dataset.originalHtml = submitBtn.innerHTML;
        submitBtn.innerHTML = `<span>Gönderiliyor...</span><svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite;"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>`;
      }

      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const json = await res.json().catch(() => null);

        if (res.ok && json && json.success && json.saved === true) {
          form.reset();
          showMessage(json.message || 'Mesajınız başarıyla kaydedildi. En kısa sürede sizinle iletişime geçeceğiz.', true);

          if (modal) {
            const heading = modal.querySelector('.modal-feedback-box h3');
            const desc = modal.querySelector('.modal-feedback-box p');
            if (heading) heading.textContent = 'Mesajınız Alındı';
            if (desc) desc.textContent = 'İletişim mesajınız başarıyla kaydedilmiştir. Müşteri temsilcilerimiz en kısa sürede sizinle iletişime geçecektir.';
            modal.classList.add('active');
          }
        } else {
          const errText = (json && json.message) || (json && json.error) || `Mesajınız iletilemedi (HTTP ${res.status}). Lütfen tekrar deneyin.`;
          showMessage(errText, false);
        }
      } catch (err) {
        console.error('İletişim formu bağlantı hatası:', err);
        showMessage('Bağlantı hatası: Mesajınız iletilemedi. Lütfen internet bağlantınızı kontrol edin veya bizi telefonla arayın.', false);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          if (submitBtn.dataset.originalHtml) {
            submitBtn.innerHTML = submitBtn.dataset.originalHtml;
          }
        }
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initContactForm);
  } else {
    initContactForm();
  }
})();
