const COOKIE_CONSENT_KEY = 'burguar_cookie_consent';

function initCookieBanner() {
  const banner = document.getElementById('cookie-banner');
  if (!banner) return;

  const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
  if (!stored) banner.hidden = false;

  document.getElementById('cookie-accept-btn')?.addEventListener('click', () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    banner.hidden = true;
    if (typeof loadGoogleAnalytics === 'function') loadGoogleAnalytics();
  });

  document.getElementById('cookie-reject-btn')?.addEventListener('click', () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'rejected');
    banner.hidden = true;
  });

  document.getElementById('cookie-config-btn')?.addEventListener('click', () => {
    openCookiesModal();
  });
}

initCookieBanner();
