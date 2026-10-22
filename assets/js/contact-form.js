'use strict';

// Only the contact page owns this form's submit handler.
// We never show a success modal unless the backend confirmed a Directus save.
(function () {
  const form = document.querySelector('form[data-contact-form]');
  if (!form) return;

  const submit = form.querySelector('button[type="submit"]');
  const messageEl = document.createElement('p');
  messageEl.setAttribute('role', 'status');
  messageEl.setAttribute('aria-live', 'polite');
  messageEl.style.marginTop = '1rem';
  messageEl.style.fontSize = '0.95rem';
  form.appendChild(messageEl);
  const modal = document.querySelector('.modal-feedback');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    if (submit.disabled) return;

    messageEl.textContent = '';
    submit.disabled = true;
    const savedLabel = submit.innerHTML;
    submit.textContent = 'Gönderiliyor...';
    try {
      const input = new FormData(form);
      const payload = {
        name: input.get('name'),
        company: input.get('company'),
        phone: input.get('phone'),
        email: input.get('email'),
        subject: input.get('subject'),
        message: input.get('message'),
        website: input.get('website') || ''
      };
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result || result.saved !== true) {
        const error = new Error(result && result.message || 'Mesajınız kaydedilemedi. Lütfen tekrar deneyin.');
        throw error;
      }
      form.reset();
      messageEl.textContent = 'Mesajınız başarıyla kaydedildi.';
      messageEl.style.color = '#1d6b42';
      if (modal) {
        const text = modal.querySelector('.modal-feedback-box p');
        if (text) text.textContent = 'Mesajınız kaydedildi. Ekibimiz en kısa sürede size geri dönüş yapacaktır.';
        modal.classList.add('active');
      }
    } catch (error) {
      messageEl.textContent = error.message || 'Bağlantı hatası. Lütfen daha sonra tekrar deneyin.';
      messageEl.style.color = '#b42318';
    } finally {
      submit.disabled = false;
      submit.innerHTML = savedLabel;
    }
  });
})();
