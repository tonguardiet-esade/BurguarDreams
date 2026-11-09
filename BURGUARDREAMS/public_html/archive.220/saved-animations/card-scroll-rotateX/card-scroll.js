/**
 * Animación 3D al scroll por cada tarjeta de apartamento.
 * perspective() va en el propio transform para que body/overflow no la anulen.
 */
(function () {
  let cards = [];
  let ticking = false;
  let bound = false;

  function isMobile() {
    return window.innerWidth <= 768;
  }

  function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
  }

  function progressFor(el) {
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight || 1;
    const start = vh * 1.15;
    const end = vh * 0.2;
    return clamp((start - rect.top) / (start - end), 0, 1);
  }

  function applyCard(el, p) {
    const mobile = isMobile();
    const rotate = 28 * (1 - p);
    const scaleFrom = mobile ? 0.9 : 1.08;
    const scale = scaleFrom + (1 - scaleFrom) * p;
    const y = (1 - p) * (mobile ? 36 : 56);
    const shadowA = 0.1 + (1 - p) * 0.28;

    el.style.setProperty(
      'transform',
      'perspective(1200px) translateY(' +
        y.toFixed(1) +
        'px) rotateX(' +
        rotate.toFixed(2) +
        'deg) scale(' +
        scale.toFixed(4) +
        ')',
      'important'
    );
    el.style.setProperty(
      'box-shadow',
      '0 0 rgba(0,0,0,' +
        (shadowA * 0.35).toFixed(3) +
        '),0 12px 24px rgba(0,0,0,' +
        (shadowA * 0.3).toFixed(3) +
        '),0 36px 48px rgba(0,0,0,' +
        (shadowA * 0.22).toFixed(3) +
        '),0 72px 64px rgba(0,0,0,' +
        (shadowA * 0.12).toFixed(3) +
        ')',
      'important'
    );
  }

  function update() {
    ticking = false;
    for (let i = 0; i < cards.length; i++) {
      applyCard(cards[i], progressFor(cards[i]));
    }
  }

  function onScrollOrResize() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }

  function bind() {
    if (bound) return;
    bound = true;
    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize, { passive: true });
  }

  window.initCardScroll = function initCardScroll() {
    cards = Array.prototype.slice.call(
      document.querySelectorAll('#properties-grid .card-scroll')
    );
    if (!cards.length) return;
    bind();
    update();
  };
})();
