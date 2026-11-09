function updateModalTitle() {
  const t = i18n[currentLang] || i18n.es;
  const el = document.getElementById('modal-title-text');
  if (!el) return;
  if (currentPropertySlug) {
    const p = properties.find(x => x.slug === currentPropertySlug);
    if (p && t.modal_title_property) {
      el.textContent = t.modal_title_property.replace('{street}', p.street);
      return;
    }
  }
  el.textContent = t.modal_title;
}

function openModal() {
  document.getElementById('modal-overlay').classList.add('active');
  document.getElementById('modal-form').classList.remove('hidden');
  document.getElementById('modal-success').classList.remove('active');
  const privacy = document.getElementById('f-privacidad');
  if (privacy) privacy.checked = false;
  if (typeof clearFormErrors === 'function') clearFormErrors();
  updateModalTitle();
  updateBodyScrollLock();
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('active');
  updateBodyScrollLock();
}

function handleOverlayClick(e) {
  if (e.target === document.getElementById('modal-overlay')) closeModal();
}

function openLegalModal() {
  document.getElementById('legal-modal-overlay').classList.add('active');
  updateBodyScrollLock();
}

function closeLegalModal() {
  document.getElementById('legal-modal-overlay').classList.remove('active');
  updateBodyScrollLock();
}

function handleLegalOverlayClick(e) {
  if (e.target === document.getElementById('legal-modal-overlay')) closeLegalModal();
}

function openPrivacyModal() {
  document.getElementById('privacy-modal-overlay').classList.add('active');
  updateBodyScrollLock();
}

function closePrivacyModal() {
  document.getElementById('privacy-modal-overlay').classList.remove('active');
  updateBodyScrollLock();
}

function handlePrivacyOverlayClick(e) {
  if (e.target === document.getElementById('privacy-modal-overlay')) closePrivacyModal();
}

function openCookiesModal() {
  document.getElementById('cookies-modal-overlay').classList.add('active');
  updateBodyScrollLock();
}

function closeCookiesModal() {
  document.getElementById('cookies-modal-overlay').classList.remove('active');
  updateBodyScrollLock();
}

function handleCookiesOverlayClick(e) {
  if (e.target === document.getElementById('cookies-modal-overlay')) closeCookiesModal();
}

function updateBodyScrollLock() {
  const locked =
    document.getElementById('modal-overlay').classList.contains('active') ||
    document.getElementById('legal-modal-overlay').classList.contains('active') ||
    document.getElementById('privacy-modal-overlay').classList.contains('active') ||
    document.getElementById('cookies-modal-overlay').classList.contains('active') ||
    document.getElementById('lightbox').classList.contains('active');
  document.body.style.overflow = locked ? 'hidden' : '';
}

document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (document.getElementById('cookies-modal-overlay').classList.contains('active')) closeCookiesModal();
  else if (document.getElementById('privacy-modal-overlay').classList.contains('active')) closePrivacyModal();
  else if (document.getElementById('legal-modal-overlay').classList.contains('active')) closeLegalModal();
  else if (document.getElementById('modal-overlay').classList.contains('active')) closeModal();
});
