/**
 * Burguar Dreams — controlador de tema día/noche
 *
 * API pública (window.BurguarTheme):
 *   get()           → 'light' | 'dark'
 *   set(theme)      → aplica y guarda
 *   toggle()        → alterna (fade fluido ~2s)
 *   bind(root?)     → conecta botones [data-theme-toggle]
 *
 * Evento: document 'themechange' → { detail: { theme } }
 */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'burguar-theme';
  var ATTR = 'data-theme';
  var MQ_DARK = '(prefers-color-scheme: dark)';
  var VT_CLASS = 'theme-vt';
  var themeVtBusy = false;

  var LABELS = {
    light: {
      es: 'Activar modo oscuro',
      en: 'Switch to dark mode',
    },
    dark: {
      es: 'Activar modo claro',
      en: 'Switch to light mode',
    },
  };

  function systemTheme() {
    try {
      return global.matchMedia(MQ_DARK).matches ? 'dark' : 'light';
    } catch (e) {
      return 'light';
    }
  }

  function readStored() {
    try {
      var v = localStorage.getItem(STORAGE_KEY);
      return v === 'light' || v === 'dark' ? v : null;
    } catch (e) {
      return null;
    }
  }

  function writeStored(theme) {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {
      /* private mode / quota — ignore */
    }
  }

  function normalize(theme) {
    return theme === 'dark' ? 'dark' : 'light';
  }

  function currentLang() {
    var lang =
      (global.currentLang && String(global.currentLang).slice(0, 2)) ||
      (document.documentElement.lang || 'es').slice(0, 2);
    return lang === 'en' ? 'en' : 'es';
  }

  function prefersReducedMotion() {
    try {
      return global.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (e) {
      return false;
    }
  }

  function get() {
    var fromDom = document.documentElement.getAttribute(ATTR);
    if (fromDom === 'light' || fromDom === 'dark') return fromDom;
    return readStored() || systemTheme();
  }

  function updateToggleUI(theme) {
    var label =
      (LABELS[theme] && LABELS[theme][currentLang()]) || LABELS[theme].es;
    var isDark = theme === 'dark';
    var buttons = document.querySelectorAll('[data-theme-toggle]');
    for (var i = 0; i < buttons.length; i++) {
      var btn = buttons[i];
      btn.setAttribute('aria-label', label);
      btn.setAttribute('title', label);
      btn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
      btn.setAttribute('aria-checked', isDark ? 'true' : 'false');
    }
  }

  function applyTheme(next, opts) {
    document.documentElement.setAttribute(ATTR, next);
    if (opts.persist !== false) writeStored(next);
    updateToggleUI(next);
    try {
      document.dispatchEvent(
        new CustomEvent('themechange', { detail: { theme: next } })
      );
    } catch (e) {
      /* IE-era — ignore */
    }
    return next;
  }

  function clearThemeVt() {
    themeVtBusy = false;
    document.documentElement.classList.remove(VT_CLASS);
  }

  function set(theme, options) {
    var next = normalize(theme);
    var opts = options || {};
    var current = get();

    if (next === current && document.documentElement.getAttribute(ATTR) === next) {
      if (opts.persist !== false) writeStored(next);
      updateToggleUI(next);
      return next;
    }

    /* Crossfade en GPU (View Transitions) — mucho más fluido que animar N nodos */
    if (
      opts.animate &&
      !themeVtBusy &&
      typeof document.startViewTransition === 'function'
    ) {
      themeVtBusy = true;
      document.documentElement.classList.add(VT_CLASS);
      try {
        var vt = document.startViewTransition(function () {
          applyTheme(next, opts);
        });
        if (vt && vt.finished && typeof vt.finished.then === 'function') {
          vt.finished.then(clearThemeVt, clearThemeVt);
        } else {
          global.setTimeout(clearThemeVt, 2100);
        }
        return next;
      } catch (e) {
        clearThemeVt();
        return applyTheme(next, opts);
      }
    }

    return applyTheme(next, opts);
  }

  function toggle() {
    return set(get() === 'dark' ? 'light' : 'dark', { animate: true });
  }

  function burstParticles(btn) {
    if (!btn || prefersReducedMotion()) return;
    var host = btn.querySelector('.theme-toggle__particles');
    if (!host) return;

    host.innerHTML = '';
    var count = 3;
    for (var i = 0; i < count; i++) {
      var wrap = document.createElement('span');
      wrap.className = 'theme-toggle__particle';
      var ring = document.createElement('span');
      ring.className = 'theme-toggle__particle-ring';
      ring.style.animationDelay = i * 0.1 + 's';
      ring.style.animationDuration = 0.6 + i * 0.1 + 's';
      wrap.appendChild(ring);
      host.appendChild(wrap);
    }

    window.clearTimeout(btn._particleTimer);
    btn._particleTimer = window.setTimeout(function () {
      host.innerHTML = '';
    }, 1100);
  }

  function onToggleClick(event) {
    event.preventDefault();
    burstParticles(event.currentTarget);
    toggle();
  }

  function bind(root) {
    var scope = root && root.querySelectorAll ? root : document;
    var buttons = scope.querySelectorAll('[data-theme-toggle]');
    for (var i = 0; i < buttons.length; i++) {
      var btn = buttons[i];
      if (btn.getAttribute('data-theme-bound') === '1') continue;
      btn.setAttribute('data-theme-bound', '1');
      btn.addEventListener('click', onToggleClick);
    }
    updateToggleUI(get());
  }

  function init() {
    var stored = readStored();
    set(stored || systemTheme(), { persist: !!stored, animate: false });

    try {
      var mq = global.matchMedia(MQ_DARK);
      var onChange = function () {
        if (readStored()) return;
        set(systemTheme(), { persist: false, animate: false });
      };
      if (typeof mq.addEventListener === 'function') {
        mq.addEventListener('change', onChange);
      } else if (typeof mq.addListener === 'function') {
        mq.addListener(onChange);
      }
    } catch (e) {
      /* ignore */
    }

    function afterBind() {
      bind(document);
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', afterBind);
    } else {
      afterBind();
    }
  }

  global.BurguarTheme = {
    get: get,
    set: set,
    toggle: toggle,
    bind: bind,
    STORAGE_KEY: STORAGE_KEY,
  };

  init();
})(typeof window !== 'undefined' ? window : this);
