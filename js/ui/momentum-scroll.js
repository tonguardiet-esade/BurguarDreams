/**
 * Momentum scroll — al soltar la rueda/touchpad, la página sigue un poco y frena suave.
 * Touchpad (deltaMode 0): más sensible + parte del delta al instante (PCs lentos).
 * Rueda de ratón: boost moderado. FRICTION sin cambiar.
 */
(function () {
  var velocity = 0;
  var raf = 0;
  var FRICTION = 0.92;
  /* Touchpad: casi 1:1 + empujón; rueda: un poco más suave */
  var BOOST_TRACKPAD = 0.95;
  var BOOST_WHEEL = 0.52;
  var DIRECT_TRACKPAD = 0.7; /* % del delta aplicado al instante */
  var DIRECT_WHEEL = 0.28;
  var MAX_V = 160;
  var STOP = 0.28;
  var active = false;

  function isEditable(el) {
    if (!el || el === document.body || el === document.documentElement) return false;
    var tag = (el.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
    if (el.isContentEditable) return true;
    return false;
  }

  function canScrollY(el) {
    if (!el || el === document.body || el === document.documentElement) return false;
    var style = window.getComputedStyle(el);
    var oy = style.overflowY;
    if (oy !== 'auto' && oy !== 'scroll' && oy !== 'overlay') return false;
    return el.scrollHeight > el.clientHeight + 1;
  }

  function hasRoom(el, deltaY) {
    if (deltaY > 0) return el.scrollTop + el.clientHeight < el.scrollHeight - 1;
    if (deltaY < 0) return el.scrollTop > 0;
    return false;
  }

  function nestedScrollable(target, deltaY) {
    var el = target;
    while (el && el !== document.body && el !== document.documentElement) {
      if (isEditable(el)) return true;
      if (canScrollY(el) && hasRoom(el, deltaY)) return true;
      el = el.parentElement;
    }
    return false;
  }

  function maxScrollY() {
    var doc = document.documentElement;
    var body = document.body;
    var h = Math.max(
      doc.scrollHeight || 0,
      body ? body.scrollHeight : 0
    );
    return Math.max(0, h - window.innerHeight);
  }

  function applyScroll(dy) {
    var y = window.scrollY || window.pageYOffset || 0;
    var next = Math.max(0, Math.min(maxScrollY(), y + dy));
    if (Math.abs(next - y) < 0.01) {
      velocity = 0;
      return false;
    }
    window.scrollTo({ top: next, left: 0, behavior: 'auto' });
    return true;
  }

  function tick() {
    if (Math.abs(velocity) < STOP) {
      velocity = 0;
      raf = 0;
      return;
    }
    applyScroll(velocity);
    velocity *= FRICTION;
    raf = requestAnimationFrame(tick);
  }

  function isPhotoGallery(target) {
    var el = target;
    while (el && el !== document.body && el !== document.documentElement) {
      if (
        el.classList &&
        (el.classList.contains('photo-strip') ||
          el.classList.contains('photo-strip__viewport') ||
          el.classList.contains('photo-strip__track') ||
          el.classList.contains('photo-strip__slide') ||
          el.classList.contains('photo-strip-host') ||
          el.classList.contains('coverflow') ||
          el.classList.contains('coverflow-host') ||
          el.classList.contains('coverflow__stage') ||
          el.classList.contains('coverflow__card'))
      ) {
        return true;
      }
      el = el.parentElement;
    }
    return false;
  }

  function onWheel(e) {
    if (e.ctrlKey) return;
    if (document.body.classList.contains('nav-menu-open')) return;
    if (document.documentElement.classList.contains('is-intro')) return;
    if (document.body.style.overflow === 'hidden') return;
    if (isPhotoGallery(e.target)) return;

    var dx = e.deltaX || 0;
    var dy = e.deltaY || 0;
    if (Math.abs(dy) < Math.abs(dx)) return;
    if (!dy) return;
    if (nestedScrollable(e.target, dy)) return;

    var delta = dy;
    if (e.deltaMode === 1) delta *= 16;
    else if (e.deltaMode === 2) delta *= window.innerHeight;

    /* deltaMode 0 = píxeles → touchpad / precision scroll */
    var isTrackpad = e.deltaMode === 0;
    var boost = isTrackpad ? BOOST_TRACKPAD : BOOST_WHEEL;
    var direct = isTrackpad ? DIRECT_TRACKPAD : DIRECT_WHEEL;

    e.preventDefault();

    /* Respuesta inmediata (evita scroll “pesado” en touchpads lentos) */
    applyScroll(delta * direct);
    velocity += delta * boost;
    if (velocity > MAX_V) velocity = MAX_V;
    if (velocity < -MAX_V) velocity = -MAX_V;

    if (!raf) raf = requestAnimationFrame(tick);
  }

  function initMomentumScroll() {
    if (active) return;
    active = true;
    window.addEventListener('wheel', onWheel, { passive: false, capture: true });
  }

  window.initMomentumScroll = initMomentumScroll;
})();
