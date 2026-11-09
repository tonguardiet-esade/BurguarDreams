/**
 * Intro de entrada — desactivada (carga directa de la web).
 */
(function (global) {
  'use strict';

  function cleanup() {
    document.documentElement.classList.remove('is-intro');
    ['bd-mask-white', 'bd-mask-black', 'bd-intro-brand'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el && el.parentNode) el.parentNode.removeChild(el);
    });
    var page = document.getElementById('bd-page');
    if (page) {
      page.style.transform = '';
      page.style.willChange = '';
      page.style.zIndex = '';
    }
  }

  global.BurguarIntro = { play: cleanup };
  cleanup();
})(typeof window !== 'undefined' ? window : this);
