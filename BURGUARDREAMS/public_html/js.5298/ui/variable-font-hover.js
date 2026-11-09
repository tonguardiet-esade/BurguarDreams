/**
 * Variable Font Hover — letras con stagger al hover (port vanilla).
 * Requiere fuente variable con eje wght (DM Sans variable).
 */
(function () {
  var instances = new WeakMap();

  function parseWght(settings) {
    var m = String(settings || '').match(/['"]wght['"]\s+(\d+)/i);
    return m ? Number(m[1]) : 400;
  }

  function staggerDelays(count, duration, from) {
    var delays = new Array(count);
    var i;
    if (from === 'last') {
      for (i = 0; i < count; i++) delays[i] = (count - 1 - i) * duration;
    } else if (from === 'center') {
      var mid = (count - 1) / 2;
      for (i = 0; i < count; i++) delays[i] = Math.abs(i - mid) * duration;
    } else if (typeof from === 'number') {
      for (i = 0; i < count; i++) delays[i] = Math.abs(i - from) * duration;
    } else {
      for (i = 0; i < count; i++) delays[i] = i * duration;
    }
    return delays;
  }

  function buildLetters(el, label, fromSettings) {
    el.textContent = '';
    var letters = [];
    for (var i = 0; i < label.length; i++) {
      var ch = label.charAt(i);
      var span = document.createElement('span');
      if (ch === ' ') {
        span.className = 'vf-space';
        span.innerHTML = '&nbsp;';
      } else {
        span.className = 'vf-letter';
        span.textContent = ch;
        span.style.fontVariationSettings = fromSettings;
        span.style.fontWeight = String(parseWght(fromSettings));
        letters.push(span);
      }
      el.appendChild(span);
    }
    return letters;
  }

  function applyState(letters, settings, delays, durationSec, timingFn) {
    var wght = parseWght(settings);
    var ease = timingFn || 'ease-out';
    for (var i = 0; i < letters.length; i++) {
      var letter = letters[i];
      letter.style.transitionDelay = (delays[i] || 0) + 's';
      letter.style.transitionDuration = durationSec + 's';
      letter.style.transitionTimingFunction = ease;
      letter.style.fontVariationSettings = settings;
      letter.style.fontWeight = String(wght);
    }
  }

  function initVariableFontHover(el, options) {
    if (!el) return null;
    options = options || {};
    var label = options.label != null ? String(options.label) : (el.textContent || '').trim();
    var from = options.fromFontVariationSettings || "'wght' 400";
    var to = options.toFontVariationSettings || "'wght' 800";
    var staggerDuration = options.staggerDuration != null ? options.staggerDuration : 0.02;
    var staggerFrom = options.staggerFrom || 'first';
    var hoverRoot = options.hoverRoot || el;
    var transitionSec = options.transitionDuration != null ? options.transitionDuration : 0.62;
    var timingFn = options.timingFunction || 'ease-out';

    el.classList.add('vf-hover');
    el.setAttribute('data-vf-label', label);
    var letters = buildLetters(el, label, from);
    var delaysIn = staggerDelays(letters.length, staggerDuration, staggerFrom);
    var delaysOut = staggerDelays(letters.length, staggerDuration * 0.7, staggerFrom);

    function onEnter() {
      applyState(letters, to, delaysIn, transitionSec, timingFn);
    }
    function onLeave() {
      applyState(letters, from, delaysOut, transitionSec * 0.85, timingFn);
    }

    hoverRoot.addEventListener('pointerenter', onEnter);
    hoverRoot.addEventListener('pointerleave', onLeave);
    hoverRoot.addEventListener('focus', onEnter);
    hoverRoot.addEventListener('blur', onLeave);

    var api = {
      el: el,
      setLabel: function (text) {
        label = String(text || '');
        el.setAttribute('data-vf-label', label);
        letters = buildLetters(el, label, from);
        delaysIn = staggerDelays(letters.length, staggerDuration, staggerFrom);
        delaysOut = staggerDelays(letters.length, staggerDuration * 0.7, staggerFrom);
      },
      destroy: function () {
        hoverRoot.removeEventListener('pointerenter', onEnter);
        hoverRoot.removeEventListener('pointerleave', onLeave);
        hoverRoot.removeEventListener('focus', onEnter);
        hoverRoot.removeEventListener('blur', onLeave);
        el.textContent = label;
        el.classList.remove('vf-hover');
        instances.delete(el);
      },
    };
    instances.set(el, api);
    return api;
  }

  function setVariableFontHoverLabel(el, text) {
    if (!el) return;
    var api = instances.get(el);
    if (api && api.setLabel) api.setLabel(text);
    else el.textContent = text;
  }

  function initNavVariableFontHover() {
    var configs = [
      { id: 'nav-hogar-btn', from: "'wght' 350", to: "'wght' 900", from2: 'first', nav: true },
      { id: 'nav-empresas-btn', from: "'wght' 300", to: "'wght' 900", from2: 'center', nav: true },
      { id: 'nav-faq-btn', from: "'wght' 350", to: "'wght' 950", from2: 'last', nav: true },
      { id: 'nav-contact-btn', from: "'wght' 350", to: "'wght' 900", from2: 'center', nav: true },
      {
        id: 'hero-cta-whatsapp-text',
        hoverRootId: 'hero-cta-whatsapp',
        from: "'wght' 400",
        to: "'wght' 900",
        from2: 'first',
      },
      {
        id: 'wa-header-text',
        hoverRootId: 'wa-header-link',
        from: "'wght' 400",
        to: "'wght' 900",
        from2: 'first',
      },
      {
        id: 'lang-label',
        hoverRootId: 'lang-btn',
        from: "'wght' 400",
        to: "'wght' 900",
        from2: 'center',
      },
      {
        id: 'corp-cta-text',
        hoverRootId: 'corp-wa-link',
        from: "'wght' 400",
        to: "'wght' 900",
        from2: 'first',
      },
      {
        id: 'corp-cta-form-text',
        hoverRootId: 'corp-form-btn',
        from: "'wght' 400",
        to: "'wght' 800",
        from2: 'center',
      },
      {
        id: 'faq-cta-btn-text',
        hoverRootId: 'faq-cta-btn',
        from: "'wght' 400",
        to: "'wght' 900",
        from2: 'first',
      },
      {
        id: 'contact-whatsapp-text',
        hoverRootId: 'contact-wa-link',
        from: "'wght' 400",
        to: "'wght' 900",
        from2: 'first',
      },
      {
        id: 'contact-form-btn-text',
        hoverRootId: 'contact-form-btn',
        from: "'wght' 400",
        to: "'wght' 900",
        from2: 'center',
      },
      {
        id: 'btn-interest-label',
        hoverRootId: 'btn-interest',
        from: "'wght' 400",
        to: "'wght' 900",
        from2: 'first',
      },
      {
        id: 'btn-send-text',
        hoverRootId: 'btn-send',
        from: "'wght' 400",
        to: "'wght' 900",
        from2: 'first',
      },
    ];
    configs.forEach(function (cfg) {
      var el = document.getElementById(cfg.id);
      if (!el) return;
      if (instances.get(el)) return;
      initVariableFontHover(el, {
        label: (el.textContent || '').trim(),
        fromFontVariationSettings: cfg.from,
        toFontVariationSettings: cfg.to,
        staggerDuration: cfg.nav ? 0.022 : 0.028,
        staggerFrom: cfg.from2,
        /* Nav: 0.2s más rápido + desaceleración (ease-out) */
        transitionDuration: cfg.nav ? 0.42 : 0.62,
        timingFunction: cfg.nav ? 'ease-out' : 'cubic-bezier(0.22, 1, 0.36, 1)',
        hoverRoot: cfg.hoverRootId
          ? document.getElementById(cfg.hoverRootId) || el
          : el,
      });
    });

    /* Opciones del desplegable de idiomas */
    var langOpts = document.querySelectorAll('.lang-option-label');
    var staggerCycle = ['first', 'center', 'last'];
    langOpts.forEach(function (labelEl, idx) {
      if (instances.get(labelEl)) return;
      var root = labelEl.closest('.lang-option') || labelEl;
      initVariableFontHover(labelEl, {
        label: (labelEl.textContent || '').trim(),
        fromFontVariationSettings: "'wght' 400",
        toFontVariationSettings: "'wght' 900",
        staggerDuration: 0.028,
        staggerFrom: staggerCycle[idx % staggerCycle.length],
        hoverRoot: root,
      });
    });
  }

  function initSaberMasVariableFontHover() {
    var buttons = document.querySelectorAll('.btn-saber');
    buttons.forEach(function (btn, idx) {
      var labelEl = btn.querySelector('.btn-saber-text');
      if (!labelEl || instances.get(labelEl)) return;
      initVariableFontHover(labelEl, {
        label: (labelEl.textContent || '').trim(),
        fromFontVariationSettings: "'wght' 400",
        toFontVariationSettings: "'wght' 900",
        staggerDuration: 0.028,
        staggerFrom: idx % 2 === 0 ? 'first' : 'center',
        hoverRoot: btn,
      });
    });
  }

  window.initVariableFontHover = initVariableFontHover;
  window.setVariableFontHoverLabel = setVariableFontHoverLabel;
  window.initNavVariableFontHover = initNavVariableFontHover;
  window.initSaberMasVariableFontHover = initSaberMasVariableFontHover;
})();
