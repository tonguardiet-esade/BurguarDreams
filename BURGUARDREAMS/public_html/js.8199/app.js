function setHeroBg() {
  const heroBg = document.getElementById('hero-bg');
  if (!heroBg) return;
  const src =
    typeof absoluteAssetUrl === 'function'
      ? absoluteAssetUrl('assets/images/ui/hero-bg.jpg')
      : 'assets/images/ui/hero-bg.jpg';
  heroBg.style.backgroundImage = `url("${src}")`;
}

const navSectionMap = {
  'nav-hogar-btn': 'hogar',
  'nav-empresas-btn': 'empresas',
  'nav-faq-btn': 'faq',
  'nav-contact-btn': 'contacto',
};

function getHeaderOffset() {
  const header = document.querySelector('header');
  return header ? header.offsetHeight + 8 : 120;
}

function setActiveNav(sectionId) {
  document.querySelectorAll('.nav-link').forEach(link => {
    const id = link.id;
    link.classList.toggle('active-nav', navSectionMap[id] === sectionId);
  });
}

function scrollToSection(sectionId) {
  if (typeof closeMobileNav === 'function') closeMobileNav();

  const detailView = document.getElementById('detail-view');
  const onDetail = detailView && detailView.classList.contains('active');

  /* Desde ficha: misma transición fade → home → sección */
  if (onDetail) {
    if (
      typeof transitionToHome === 'function' &&
      !(typeof isPageTransitionBusy === 'function' && isPageTransitionBusy())
    ) {
      transitionToHome({ sectionId: sectionId });
      return;
    }
    if (typeof showHome === 'function') {
      showHome({ skipTransition: true, skipScroll: true });
    } else {
      detailView.classList.remove('active');
      document.getElementById('home-view').style.display = '';
      currentPropertyId = null;
      currentPropertySlug = null;
      const url = new URL(window.location.href);
      url.searchParams.delete('inmueble');
      url.searchParams.delete('p');
      history.replaceState(null, '', url.pathname + url.search);
      applyHomeSeo(getSeoLang());
    }
  }

  const section = document.getElementById(sectionId);
  if (!section) return;

  const top = section.getBoundingClientRect().top + window.scrollY - getHeaderOffset();
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top, behavior: prefersReduced ? 'auto' : 'smooth' });
  setActiveNav(sectionId);
  if (typeof resumeApartmentDeck === 'function' && sectionId === 'hogar') {
    resumeApartmentDeck();
  }
}

function initScrollSpy() {
  const sections = ['hogar', 'empresas', 'faq', 'contacto']
    .map(id => document.getElementById(id))
    .filter(Boolean);

  const observer = new IntersectionObserver(entries => {
    if (document.getElementById('detail-view').classList.contains('active')) return;
    const visible = entries
      .filter(e => e.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
    if (visible.length) setActiveNav(visible[0].target.id);
  }, {
    rootMargin: `-${getHeaderOffset()}px 0px -55% 0px`,
    threshold: [0, 0.15, 0.35, 0.55],
  });

  sections.forEach(section => observer.observe(section));
}

function renderFAQ() {
  const list = document.getElementById('faq-list');
  const items = faqs[currentLang] || faqs.es;
  list.innerHTML = items.map((f, i) => `
    <details class="faq-item" id="faq-${i}" data-reveal="${i % 2 === 0 ? 'left' : 'right'}">
      <summary class="faq-question" id="faq-btn-${i}">
        <span>${f.q}</span>
        <svg class="faq-chevron" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
          <path d="M3 6l5 5 5-5"/>
        </svg>
      </summary>
      <div class="faq-answer" id="faq-answer-${i}">${f.a}</div>
    </details>
  `).join('');
  if (typeof scheduleScrollReveal === 'function') scheduleScrollReveal();
}

function renderAboutSection() {
  const t = i18n[currentLang] || i18n.es;
  const title = document.getElementById('about-title');
  const p1 = document.getElementById('about-p1');
  const p2 = document.getElementById('about-p2');
  const p3 = document.getElementById('about-p3');
  if (title) title.textContent = t.about_title;
  if (p1) p1.textContent = t.about_p1;
  if (p2) p2.textContent = t.about_p2;
  if (p3) p3.textContent = t.about_p3;
}

function renderGuideSection() {
  const t = i18n[currentLang] || i18n.es;
  const title = document.getElementById('guide-title');
  const body = document.getElementById('guide-body');
  if (title) title.textContent = t.guide_title;
  if (body) body.innerHTML = t.guide_body_html;
}

const initialLang = initLangFromUrl();
if (initialLang) currentLang = initialLang;

renderGrid();
renderFAQ();
renderAboutSection();
renderGuideSection();
setHeroBg();
initPropertyFromUrl();
if (typeof initGuideWaves === 'function') initGuideWaves();
if (typeof initNavVariableFontHover === 'function') initNavVariableFontHover();
if (typeof initMomentumScroll === 'function') initMomentumScroll();
if (typeof initScrollProgress === 'function') initScrollProgress();

if (initialLang) {
  setLang(initialLang);
} else {
  renderLegalModals('es');
  updateWhatsAppLinks(null);
  if (!currentPropertyId) applyHomeSeo('es');
}

/* Tras i18n: partir textos corporate y enlazar scroll */
if (typeof initTextScrollAnimation === 'function') initTextScrollAnimation();

tryLoadAnalyticsFromConsent();
initScrollSpy();
if (typeof scheduleScrollReveal === 'function') scheduleScrollReveal();
function syncHeaderOffset() {
  if (typeof updateHeaderOffset === 'function') updateHeaderOffset();
  else document.documentElement.style.setProperty('--header-offset', getHeaderOffset() + 'px');
}
window.addEventListener('resize', syncHeaderOffset);
syncHeaderOffset();
