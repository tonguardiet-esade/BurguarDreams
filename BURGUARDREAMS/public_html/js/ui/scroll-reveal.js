const REVEAL_SELECTOR = '[data-reveal]';

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

let revealObserver = null;

function markAllVisible() {
  document.querySelectorAll(REVEAL_SELECTOR).forEach(el => {
    el.classList.add('reveal-visible');
  });
}

function isRevealable(el) {
  const detailView = document.getElementById('detail-view');
  const homeView = document.getElementById('home-view');
  if (detailView && detailView.contains(el) && !detailView.classList.contains('active')) {
    return false;
  }
  if (homeView && homeView.contains(el) && homeView.style.display === 'none') {
    return false;
  }
  return true;
}

function resetRevealIn(root) {
  if (!root) return;
  root.querySelectorAll(REVEAL_SELECTOR).forEach(el => {
    el.classList.remove('reveal-visible');
    if (revealObserver) revealObserver.unobserve(el);
  });
}

function observeRevealElements() {
  if (!revealObserver) return;
  document.querySelectorAll(REVEAL_SELECTOR).forEach(el => {
    if (!el.classList.contains('reveal-visible') && isRevealable(el)) {
      revealObserver.observe(el);
    }
  });
}

function scheduleScrollReveal() {
  requestAnimationFrame(() => {
    requestAnimationFrame(refreshScrollReveal);
  });
}

function initScrollReveal() {
  if (prefersReducedMotion()) {
    markAllVisible();
    return;
  }

  revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('reveal-visible');
      revealObserver.unobserve(entry.target);
    });
  }, {
    root: null,
    rootMargin: '0px 0px -6% 0px',
    threshold: 0.12,
  });

  observeRevealElements();
}

function refreshScrollReveal() {
  if (prefersReducedMotion()) {
    markAllVisible();
    return;
  }
  observeRevealElements();
}

initScrollReveal();
