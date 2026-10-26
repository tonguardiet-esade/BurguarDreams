function navToggleLabel(open) {
  const t = i18n[currentLang] || i18n.es;
  return open ? t.nav_close : t.nav_open;
}

function updateHeaderOffset() {
  const header = document.querySelector('header');
  if (header) {
    document.documentElement.style.setProperty('--header-offset', header.offsetHeight + 8 + 'px');
  }
}

function closeMobileNav() {
  const header = document.getElementById('main-header');
  const toggle = document.getElementById('nav-toggle');
  if (!header || !toggle) return;
  header.classList.remove('nav-open');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', navToggleLabel(false));
  document.body.classList.remove('nav-menu-open');
  updateHeaderOffset();
}

function toggleMobileNav() {
  const header = document.getElementById('main-header');
  const toggle = document.getElementById('nav-toggle');
  if (!header || !toggle) return;
  const open = !header.classList.contains('nav-open');
  header.classList.toggle('nav-open', open);
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', navToggleLabel(open));
  document.body.classList.toggle('nav-menu-open', open);
  requestAnimationFrame(updateHeaderOffset);
}

function initMobileNav() {
  const toggle = document.getElementById('nav-toggle');
  if (!toggle) return;

  toggle.addEventListener('click', e => {
    e.stopPropagation();
    toggleMobileNav();
  });

  document.getElementById('header-nav')?.addEventListener('click', e => {
    if (e.target.closest('.nav-link')) closeMobileNav();
  });

  document.addEventListener('click', e => {
    const header = document.getElementById('main-header');
    if (!header?.classList.contains('nav-open')) return;
    if (header.contains(e.target)) return;
    closeMobileNav();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeMobileNav();
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 900) closeMobileNav();
  });
}

initMobileNav();
