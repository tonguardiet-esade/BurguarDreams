/**
 * Scroll progress — línea corta + % a la derecha.
 * Home + ficha de apartamento (detail-view).
 */
(function () {
  'use strict';

  function initScrollProgress() {
    var root = document.querySelector('#scroll-progress');
    var progressBar = document.querySelector('#progressBar');
    var progressBarContainer = document.querySelector('#progressBarContainer');
    var label = document.querySelector('#scroll-progress-label');
    if (!root || !progressBar || !progressBarContainer || !label) return;

    function isDetailVisible() {
      var detail = document.getElementById('detail-view');
      return Boolean(detail && detail.classList.contains('active'));
    }

    function isHomeVisible() {
      var home = document.getElementById('home-view');
      if (home && home.style.display === 'none') return false;
      return true;
    }

    function isProgressVisible() {
      return isDetailVisible() || isHomeVisible();
    }

    function updateContrast() {
      var midY = window.innerHeight * 0.5;
      var onHero = false;

      if (isDetailVisible()) {
        var detailHero = document.querySelector('#detail-view .detail-hero');
        if (detailHero) {
          var dr = detailHero.getBoundingClientRect();
          onHero = dr.top < midY && dr.bottom > midY;
        }
      } else {
        var hero = document.querySelector('.hero') || document.getElementById('inicio');
        if (hero) {
          var r = hero.getBoundingClientRect();
          onHero = r.top < midY && r.bottom > midY;
        }
      }

      root.classList.toggle('is-on-hero', onHero);
      root.classList.toggle('is-on-light', !onHero);
    }

    function update() {
      if (!isProgressVisible()) {
        root.hidden = true;
        return;
      }
      root.hidden = false;

      var totalPageHeight = document.documentElement.scrollHeight - window.innerHeight;
      var pct = 0;
      if (totalPageHeight > 0) {
        pct = (window.pageYOffset / totalPageHeight) * 100;
      }
      if (pct < 0) pct = 0;
      if (pct > 100) pct = 100;

      progressBar.style.height = pct + '%';
      label.textContent = Math.round(pct) + '%';
      updateContrast();
    }

    window.addEventListener('scroll', update, { capture: true, passive: true });

    var debounceResize;
    window.addEventListener('resize', function () {
      clearTimeout(debounceResize);
      debounceResize = setTimeout(update, 200);
    });

    progressBarContainer.addEventListener('click', function (e) {
      var rect = progressBarContainer.getBoundingClientRect();
      var ratio = (e.clientY - rect.top) / rect.height;
      if (ratio < 0) ratio = 0;
      if (ratio > 1) ratio = 1;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo({ top: ratio * max, behavior: 'smooth' });
    });

    var detail = document.getElementById('detail-view');
    if (detail && typeof MutationObserver !== 'undefined') {
      new MutationObserver(update).observe(detail, {
        attributes: true,
        attributeFilter: ['class'],
        childList: true,
        subtree: true,
      });
    }

    if (typeof ResizeObserver !== 'undefined') {
      var resizeObserver = new ResizeObserver(function () {
        update();
      });
      resizeObserver.observe(document.documentElement);
    }

    update();
  }

  window.initScrollProgress = initScrollProgress;
})();
