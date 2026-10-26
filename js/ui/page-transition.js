/**
 * Transición home ↔ ficha: fade 0 → 100% opacidad con desaceleración (~60fps).
 */
(function () {
  'use strict';

  /* +1s respecto a la versión anterior (~1.14s → ~2.2s) */
  var FADE_IN = 1050;
  var FADE_OUT = 1150;
  var busy = false;
  var root = null;
  var timers = [];

  function clearTimers() {
    timers.forEach(function (id) {
      clearTimeout(id);
    });
    timers = [];
  }

  function later(fn, ms) {
    var id = setTimeout(fn, ms);
    timers.push(id);
    return id;
  }

  function ensureDom() {
    if (root) return;
    root = document.createElement('div');
    root.className = 'pt-root';
    root.setAttribute('aria-hidden', 'true');
    root.innerHTML = '<div class="pt-veil"></div>';
    document.body.appendChild(root);
  }

  function lockScroll(on) {
    document.documentElement.classList.toggle('pt-lock', !!on);
    document.body.classList.toggle('pt-lock', !!on);
  }

  function reflow(el) {
    void el.offsetWidth;
  }

  function resetClasses() {
    if (!root) return;
    root.classList.remove('is-active', 'is-veil-in', 'is-veil-out');
  }

  function finishCleanup() {
    clearTimers();
    resetClasses();
    lockScroll(false);
    busy = false;
  }

  function runFade(onSwap, onDone) {
    busy = true;
    clearTimers();
    ensureDom();
    lockScroll(true);
    resetClasses();

    root.classList.add('is-active');
    reflow(root);

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        root.classList.add('is-veil-in');
      });
    });

    later(function () {
      if (typeof onSwap === 'function') onSwap();
      root.classList.remove('is-veil-in');
      reflow(root);
      root.classList.add('is-veil-out');
    }, FADE_IN);

    later(function () {
      finishCleanup();
      if (typeof onDone === 'function') onDone();
    }, FADE_IN + FADE_OUT);

    later(finishCleanup, FADE_IN + FADE_OUT + 500);
  }

  /**
   * @param {string} slug
   * @param {Element=} fromEl
   */
  function transitionToDetail(slug, fromEl) {
    if (!slug) return;
    if (busy) finishCleanup();
    if (typeof showDetail !== 'function') return;

    runFade(
      function () {
        showDetail(slug, { skipScroll: true, fromTransition: true });
      },
      function () {
        if (typeof scheduleScrollReveal === 'function') scheduleScrollReveal();
      }
    );
  }

  function headerOffset() {
    var header = document.querySelector('header');
    return header ? header.offsetHeight + 8 : 120;
  }

  function jumpToSection(sectionId) {
    /* Liberar overflow un instante para que el scroll se aplique de verdad */
    document.documentElement.classList.remove('pt-lock');
    document.body.classList.remove('pt-lock');

    if (!sectionId) {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    } else {
      var section = document.getElementById(sectionId);
      if (!section) {
        window.scrollTo(0, 0);
      } else {
        var top =
          section.getBoundingClientRect().top + window.scrollY - headerOffset();
        top = Math.max(0, Math.round(top));
        window.scrollTo(0, top);
        document.documentElement.scrollTop = top;
        document.body.scrollTop = top;
        if (typeof setActiveNav === 'function') setActiveNav(sectionId);
        if (sectionId === 'hogar' && typeof resumeApartmentDeck === 'function') {
          resumeApartmentDeck();
        }
      }
    }

    document.documentElement.classList.add('pt-lock');
    document.body.classList.add('pt-lock');
  }

  function transitionToHome(options) {
    options = options || {};
    if (busy) finishCleanup();
    if (typeof showHome !== 'function') return false;

    var sectionId = options.sectionId || null;

    runFade(
      function () {
        showHome({ fromTransition: true, skipScroll: true });
        /* Posicionar YA bajo el velo opaco → al revelar estás en la sección */
        jumpToSection(sectionId);
        void document.body.offsetHeight;
        jumpToSection(sectionId);
      },
      function () {
        if (typeof scheduleScrollReveal === 'function') scheduleScrollReveal();
        if (
          sectionId === 'hogar' &&
          typeof resumeApartmentDeck === 'function'
        ) {
          resumeApartmentDeck();
        }
      }
    );
    return false;
  }

  window.transitionToDetail = transitionToDetail;
  window.transitionToHome = transitionToHome;
  window.isPageTransitionBusy = function () {
    return busy;
  };
})();
