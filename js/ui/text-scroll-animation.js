/**
 * Text Scroll Animation — ensamblado al scroll (vanilla).
 * Títulos: letras (por palabra, sin romper wrap).
 * Párrafos/CTA: bloque. Iconos/imagen: media.
 */
(function () {
  'use strict';

  var instances = [];
  var ticking = false;
  var listening = false;

  function clamp(n, a, b) {
    return Math.min(b, Math.max(a, n));
  }

  function easeOutCubic(t) {
    var u = 1 - t;
    return 1 - u * u * u;
  }

  function makeChar(ch) {
    var span = document.createElement('span');
    span.className = 'tsa-char' + (ch === ' ' ? ' is-space' : '');
    span.textContent = ch === ' ' ? '\u00a0' : ch;
    return span;
  }

  /** Solo targets de ESTA sección (no de un data-tsa-section anidado). */
  function ownedTargets(section, selector) {
    var all = section.querySelectorAll(selector);
    var out = [];
    for (var i = 0; i < all.length; i++) {
      var owner = all[i].closest('[data-tsa-section]');
      if (owner === section) out.push(all[i]);
    }
    return out;
  }

  /** Parte texto en palabras (nowrap) + letras, preservando <em> */
  function splitElement(el) {
    if (!el) return [];
    var vf = el.querySelectorAll('.vf-letter, .vf-space');
    if (vf.length) {
      el.classList.add('tsa-chars');
      var list = [];
      for (var v = 0; v < vf.length; v++) {
        vf[v].classList.add('tsa-char');
        if (vf[v].classList.contains('vf-space')) vf[v].classList.add('is-space');
        list.push(vf[v]);
      }
      return list;
    }

    el.classList.add('tsa-chars');
    var chars = [];
    var globalIndex = 0;

    function splitPlainText(text, parent) {
      var parts = text.split(/(\s+)/);
      for (var p = 0; p < parts.length; p++) {
        var part = parts[p];
        if (!part) continue;
        if (/^\s+$/.test(part)) {
          for (var s = 0; s < part.length; s++) {
            var sp = makeChar(' ');
            sp.setAttribute('data-i', String(globalIndex++));
            parent.appendChild(sp);
            chars.push(sp);
          }
        } else {
          var word = document.createElement('span');
          word.className = 'tsa-word';
          for (var c = 0; c < part.length; c++) {
            var ch = makeChar(part.charAt(c));
            ch.setAttribute('data-i', String(globalIndex++));
            word.appendChild(ch);
            chars.push(ch);
          }
          parent.appendChild(word);
        }
      }
    }

    function processNode(node, parent) {
      if (node.nodeType === 3) {
        splitPlainText(node.textContent || '', parent);
      } else if (node.nodeType === 1) {
        if (node.tagName === 'EM' || node.tagName === 'STRONG') {
          var wrap = document.createElement(node.tagName.toLowerCase());
          if (node.className) wrap.className = node.className;
          var kids = Array.prototype.slice.call(node.childNodes);
          for (var i = 0; i < kids.length; i++) processNode(kids[i], wrap);
          parent.appendChild(wrap);
        } else {
          var kids2 = Array.prototype.slice.call(node.childNodes);
          for (var j = 0; j < kids2.length; j++) processNode(kids2[j], parent);
        }
      }
    }

    var source = Array.prototype.slice.call(nodeChildSnapshot(el));
    el.textContent = '';
    for (var n = 0; n < source.length; n++) processNode(source[n], el);
    return chars;
  }

  function nodeChildSnapshot(el) {
    return Array.prototype.slice.call(el.childNodes);
  }

  /**
   * 0 = el bloque acaba de entrar por abajo
   * 1 = ya está bien en pantalla (ensamblado)
   * Rango amplio para que el scroll se note de verdad.
   */
  function sectionProgress(el) {
    var rect = el.getBoundingClientRect();
    var vh = window.innerHeight || 1;
    var start = vh * 0.95;
    var end = vh * 0.28;
    return clamp((start - rect.top) / Math.max(1, start - end), 0, 1);
  }

  function applyChars(chars, progress) {
    var t = progress >= 0.97 ? 1 : easeOutCubic(progress);
    var mobile = window.innerWidth <= 900;
    var center = (chars.length - 1) / 2;
    for (var i = 0; i < chars.length; i++) {
      var d = i - center;
      var mag = Math.min(Math.abs(d) * (mobile ? 6 : 14), mobile ? 14 : 36);
      var sign = d < 0 ? -1 : d > 0 ? 1 : 0;
      var x = sign * mag * (1 - t);
      var y = (mobile ? 10 : 18) * (1 - t) * (Math.abs(d) % 3 === 0 ? 1 : 0.55);
      chars[i].style.transform =
        t >= 1
          ? 'none'
          : 'translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0)';
      chars[i].style.opacity = String(0.45 + 0.55 * t);
    }
  }

  function applyMedia(el, progress) {
    var t = easeOutCubic(progress);
    var mobile = window.innerWidth <= 900;
    var x = (mobile ? 12 : 56) * (1 - t);
    var y = (mobile ? 10 : 22) * (1 - t);
    var scale = (mobile ? 0.96 : 0.88) + (mobile ? 0.04 : 0.12) * t;
    el.style.opacity = String(0.35 + 0.65 * t);
    el.style.transform =
      'translate3d(' +
      x.toFixed(2) +
      'px,' +
      y.toFixed(2) +
      'px,0) scale(' +
      scale.toFixed(4) +
      ')';
  }

  function applyIcon(el, progress, index) {
    var t = easeOutCubic(progress);
    var mobile = window.innerWidth <= 900;
    var dir = index % 2 === 0 ? -1 : 1;
    var x = dir * (mobile ? 8 : 28) * (1 - t);
    var y = (mobile ? 8 : 20) * (1 - t);
    var scale = (mobile ? 0.88 : 0.7) + (mobile ? 0.12 : 0.3) * t;
    el.style.opacity = String(0.3 + 0.7 * t);
    el.style.transform =
      'translate3d(' +
      x.toFixed(2) +
      'px,' +
      y.toFixed(2) +
      'px,0) scale(' +
      scale.toFixed(4) +
      ')';
  }

  function applyBlock(el, progress, fromX) {
    var t = easeOutCubic(progress);
    var mobile = window.innerWidth <= 900;
    var baseX = fromX != null ? fromX : -28;
    if (mobile) baseX = Math.max(-12, Math.min(12, baseX));
    var x = baseX * (1 - t);
    var y = (mobile ? 8 : 18) * (1 - t);
    el.style.opacity = String(clamp(0.3 + 0.7 * t, 0, 1));
    el.style.transform =
      'translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0)';
  }

  function paintAll() {
    for (var i = 0; i < instances.length; i++) {
      if (instances[i].paint) instances[i].paint();
    }
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      paintAll();
    });
  }

  function ensureListeners() {
    if (listening) return;
    listening = true;
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
  }

  function createInstance(section) {
    section.classList.add('tsa-section');
    var charGroups = [];
    var mediaEls = [];
    var iconEls = [];
    var blockEls = [];
    /* Features: progreso por tarjeta. Hero: progreso de la sección. */
    var perCard = section.classList.contains('corporate-features');

    var charTargets = ownedTargets(section, '[data-tsa="chars"]');
    for (var i = 0; i < charTargets.length; i++) {
      charGroups.push({
        el: charTargets[i],
        chars: splitElement(charTargets[i]),
        card: charTargets[i].closest('.corp-feature') || section,
      });
    }

    var mediaTargets = ownedTargets(section, '[data-tsa="media"]');
    for (var m = 0; m < mediaTargets.length; m++) {
      mediaTargets[m].classList.add('tsa-media');
      mediaEls.push(mediaTargets[m]);
    }

    var iconTargets = ownedTargets(section, '[data-tsa="icon"]');
    for (var ic = 0; ic < iconTargets.length; ic++) {
      iconTargets[ic].classList.add('tsa-icon');
      iconEls.push({
        el: iconTargets[ic],
        card: iconTargets[ic].closest('.corp-feature') || section,
        index: ic,
      });
    }

    var blockTargets = ownedTargets(section, '[data-tsa="block"]');
    for (var b = 0; b < blockTargets.length; b++) {
      blockTargets[b].classList.add('tsa-block');
      blockEls.push({
        el: blockTargets[b],
        fromX: b % 2 === 0 ? -40 : 40,
        card: blockTargets[b].closest('.corp-feature') || section,
      });
    }

    function paint() {
      var sectionP = sectionProgress(section);
      for (var g = 0; g < charGroups.length; g++) {
        var gp = perCard ? sectionProgress(charGroups[g].card) : sectionP;
        applyChars(charGroups[g].chars, gp);
      }
      for (var mi = 0; mi < mediaEls.length; mi++) {
        applyMedia(mediaEls[mi], sectionP);
      }
      for (var ii = 0; ii < iconEls.length; ii++) {
        var ip = perCard ? sectionProgress(iconEls[ii].card) : sectionP;
        applyIcon(iconEls[ii].el, ip, iconEls[ii].index);
      }
      for (var bi = 0; bi < blockEls.length; bi++) {
        var bp = perCard ? sectionProgress(blockEls[bi].card) : sectionP;
        applyBlock(blockEls[bi].el, bp, blockEls[bi].fromX);
      }
    }

    return {
      section: section,
      paint: paint,
      refresh: function () {
        charGroups = [];
        for (var k = 0; k < charTargets.length; k++) {
          charTargets[k].classList.remove('tsa-chars');
          charGroups.push({
            el: charTargets[k],
            chars: splitElement(charTargets[k]),
            card: charTargets[k].closest('.corp-feature') || section,
          });
        }
        paint();
      },
    };
  }

  function destroyAll() {
    instances = [];
  }

  function initTextScrollAnimation() {
    destroyAll();
    var sections = document.querySelectorAll('[data-tsa-section]');
    for (var i = 0; i < sections.length; i++) {
      instances.push(createInstance(sections[i]));
    }
    ensureListeners();
    paintAll();
  }

  function refreshTextScrollAnimation() {
    if (!instances.length) {
      initTextScrollAnimation();
      return;
    }
    for (var i = 0; i < instances.length; i++) {
      if (instances[i].refresh) instances[i].refresh();
    }
  }

  window.initTextScrollAnimation = initTextScrollAnimation;
  window.refreshTextScrollAnimation = refreshTextScrollAnimation;
})();
