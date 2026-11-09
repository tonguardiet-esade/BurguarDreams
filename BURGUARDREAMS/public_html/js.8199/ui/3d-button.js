(function () {
  'use strict';

  function buildCharSpans(text) {
    var frag = document.createDocumentFragment();
    var chars = String(text || '').split('');
    var i = 0;
    var letterIndex = 0;
    while (i < chars.length) {
      var ch = chars[i];
      if (ch === ' ') {
        i += 1;
        continue;
      }
      letterIndex += 1;
      var span = document.createElement('span');
      span.setAttribute('data-label', ch);
      span.style.setProperty('--i', String(letterIndex));
      span.textContent = ch;
      if (i > 0 && chars[i - 1] === ' ') {
        span.classList.add('bd-3d-btn__gap');
      }
      frag.appendChild(span);
      i += 1;
    }
    return frag;
  }

  function setBd3dButtonLabels(btn, label1, label2) {
    if (!btn) return;
    var state1 = btn.querySelector('.bd-3d-btn__char--1');
    var state2 = btn.querySelector('.bd-3d-btn__char--2');
    var sizer = btn.querySelector('.bd-3d-btn__sizer');
    if (state1) {
      state1.textContent = '';
      state1.appendChild(buildCharSpans(label1));
    }
    if (state2) {
      state2.textContent = '';
      state2.appendChild(buildCharSpans(label2));
    }
    if (sizer) sizer.textContent = label1 || '';
    var aria = label1;
    if (label2) aria += ' / ' + label2;
    btn.setAttribute('aria-label', aria);
    syncBd3dBtnHeight();
  }

  /** Iguala altura y tipografía al CTA verde de WhatsApp */
  function syncBd3dBtnHeight() {
    var wa = document.getElementById('hero-cta-whatsapp');
    var btn = document.getElementById('hero-cta-form');
    if (!wa || !btn) return;

    var cs = window.getComputedStyle(wa);
    var h = wa.getBoundingClientRect().height;
    if (h > 0) {
      btn.style.height = Math.round(h * 1000) / 1000 + 'px';
      btn.style.minHeight = btn.style.height;
    }
    btn.style.fontFamily = cs.fontFamily;
    btn.style.fontSize = cs.fontSize;
    btn.style.fontWeight = cs.fontWeight;
    btn.style.letterSpacing = cs.letterSpacing;
    btn.style.textTransform = cs.textTransform;
    btn.style.lineHeight = cs.lineHeight;
    btn.style.borderRadius = cs.borderRadius;
    /* Más ancho que el CTA verde; solo igualamos padding vertical */
    btn.style.paddingTop = cs.paddingTop;
    btn.style.paddingBottom = cs.paddingBottom;
    btn.style.paddingLeft = '2.25rem';
    btn.style.paddingRight = '2.25rem';
  }

  function bindHeightSync() {
    var run = function () {
      requestAnimationFrame(function () {
        syncBd3dBtnHeight();
        requestAnimationFrame(syncBd3dBtnHeight);
      });
    };
    run();
    window.addEventListener('resize', run);
    window.addEventListener('load', run);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(run);
    }
    if (typeof ResizeObserver !== 'undefined') {
      var wa = document.getElementById('hero-cta-whatsapp');
      if (wa) {
        var ro = new ResizeObserver(run);
        ro.observe(wa);
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindHeightSync);
  } else {
    bindHeightSync();
  }

  window.setBd3dButtonLabels = setBd3dButtonLabels;
  window.syncBd3dBtnHeight = syncBd3dBtnHeight;
})();
