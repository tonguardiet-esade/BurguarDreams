/**
 * Container Scroll → cada article.apartment-deck-card (cara interna).
 * rotateX + scale al scrollear #hogar. No toca momentum-scroll ni el layout del mazo.
 */
(function () {
  'use strict';

  var root = null;
  var track = null;
  var header = null;
  var faces = [];
  var ticking = false;
  var mobile = false;
  var bound = false;

  function clamp(n, a, b) {
    return Math.min(b, Math.max(a, n));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function checkMobile() {
    mobile = window.innerWidth <= 768;
  }

  function collect() {
    root = document.querySelector('[data-csa]');
    if (!root) return false;
    track = document.getElementById('apartment-deck-scene') || root;
    header = root.querySelector('[data-csa-header]');
    faces = Array.prototype.slice.call(
      document.querySelectorAll('.apartment-deck-card [data-csa-card], .apartment-deck-card-face')
    );
    return faces.length > 0;
  }

  /** 0 = sección entrando · 1 = ya centrada / pasada */
  function scrollProgress() {
    if (!track) return 0;
    var rect = track.getBoundingClientRect();
    var vh = window.innerHeight || 1;
    var start = vh * 0.92;
    var end = vh * 0.22;
    return clamp((start - rect.top) / Math.max(1, start - end), 0, 1);
  }

  function paint() {
    var p = scrollProgress();
    var scaleFrom = mobile ? 0.78 : 1.05;
    var scaleTo = mobile ? 0.95 : 1;

    for (var i = 0; i < faces.length; i++) {
      var stagger = i * 0.06;
      var cp = clamp((p - stagger) / Math.max(0.001, 1 - stagger * 0.7), 0, 1);
      var rotate = lerp(20, 0, cp);
      var scale = lerp(scaleFrom, scaleTo, cp);
      faces[i].style.transform =
        'rotateX(' + rotate.toFixed(2) + 'deg) scale(' + scale.toFixed(4) + ')';
    }

    if (header) {
      var headerY = lerp(0, -48, p);
      header.style.transform = 'translate3d(0,' + headerY.toFixed(1) + 'px,0)';
    }
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      paint();
    });
  }

  function ensureListeners() {
    if (bound) return;
    bound = true;
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener(
      'resize',
      function () {
        checkMobile();
        paint();
      },
      { passive: true }
    );
  }

  function initContainerScrollAnimation() {
    checkMobile();
    if (!collect()) return;
    ensureListeners();
    paint();
  }

  function refreshContainerScrollAnimation() {
    checkMobile();
    if (!collect()) return;
    ensureListeners();
    paint();
  }

  window.initContainerScrollAnimation = initContainerScrollAnimation;
  window.refreshContainerScrollAnimation = refreshContainerScrollAnimation;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initContainerScrollAnimation);
  } else {
    initContainerScrollAnimation();
  }
})();
