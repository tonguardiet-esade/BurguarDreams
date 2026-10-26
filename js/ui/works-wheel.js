/**
 * Works Wheel (vanilla) — rueda/tambor 3D para galería de fotos.
 * Adaptación clean-room del comportamiento WorksWheel (un solo número `turn`).
 * turn=0 anillo · turn=1 tambor con ítem 0 delante · enteros siguientes = siguiente foto.
 */
(function () {
  var CARD_H = 0.38;
  var CARD_MAX_W = 0.34;
  var CARD_RATIO = 1.45;
  var STEP = 40;
  var DRUM = 2.22;
  var LENS = 2.7;
  var RING_R = 1.14;
  var BOW = 1.82;
  var TITLE = 0.124;
  var INDEX = 0.04;
  var CULL = 1.6;
  var WHEEL_UNITS = 280;
  var DRAG_UNITS = 220;
  var SETTLE = 100;
  var EASE = 0.18;

  function clamp(v, lo, hi) {
    return Math.min(hi, Math.max(lo, v));
  }
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  function rad(deg) {
    return (deg * Math.PI) / 180;
  }
  function bowAt(drumDeg, bow) {
    return -bow * (1 - Math.cos(rad(drumDeg)));
  }
  function place(ringDeg, drumDeg, ringR, drumR, bow, m) {
    return (
      'translateX(' +
      m * bowAt(drumDeg, bow) +
      'px) rotateZ(' +
      (1 - m) * ringDeg +
      'deg) translateY(' +
      -(1 - m) * ringR +
      'px) rotateX(' +
      m * drumDeg +
      'deg) translateZ(' +
      m * drumR +
      'px)'
    );
  }

  var instances = [];

  function destroyWorksWheel(root) {
    for (var i = instances.length - 1; i >= 0; i--) {
      if (instances[i].root === root || !root) {
        instances[i].destroy();
        instances.splice(i, 1);
      }
    }
  }

  function initWorksWheel(root, options) {
    if (!root) return null;
    destroyWorksWheel(root);

    var items = options.items || [];
    var count = items.length;
    if (!count) return null;

    var label = options.label || '';
    var action = options.action || '';
    var onSelect = options.onSelect || null;
    var last = Math.max(count - 1, 0);
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    root.classList.add('works-wheel');
    root.innerHTML =
      '<div class="works-wheel-stage" tabindex="0" role="listbox" aria-label="' +
      escapeHtml(label) +
      '">' +
      '<div class="works-wheel-core">' +
      items
        .map(function (item, i) {
          return (
            '<button type="button" class="works-wheel-card" role="option" id="works-wheel-card-' +
            i +
            '" data-index="' +
            i +
            '" aria-selected="' +
            (i === 0 ? 'true' : 'false') +
            '">' +
            '<span class="works-wheel-face">' +
            '<img src="' +
            item.image +
            '" alt="' +
            escapeHtml(item.title || '') +
            '" draggable="false" loading="' +
            (i < 3 ? 'eager' : 'lazy') +
            '" decoding="async">' +
            (action
              ? '<span class="works-wheel-action"><svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 9 9 3M4 3h5v5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
                escapeHtml(action) +
                '</span>'
              : '') +
            '</span></button>'
          );
        })
        .join('') +
      '</div></div>' +
      '<div class="works-wheel-ring-label">' +
      escapeHtml(label) +
      '</div>' +
      '<div class="works-wheel-front-title" aria-live="polite"></div>' +
      '<ol class="works-wheel-index">' +
      items
        .map(function (item, i) {
          return (
            '<li><button type="button" data-jump="' +
            i +
            '">' +
            escapeHtml(item.title || String(i + 1)) +
            '</button></li>'
          );
        })
        .join('') +
      '</ol>';

    var stageEl = root.querySelector('.works-wheel-stage');
    var wheelEl = root.querySelector('.works-wheel-core');
    var labelEl = root.querySelector('.works-wheel-ring-label');
    var titleEl = root.querySelector('.works-wheel-front-title');
    var cardEls = Array.prototype.slice.call(root.querySelectorAll('.works-wheel-card'));
    var indexBtns = Array.prototype.slice.call(root.querySelectorAll('[data-jump]'));

    var turn = 0;
    var target = 0;
    var active = 0;
    var stage = { w: 0, h: 0 };
    var metrics = null;
    var raf = 0;
    var settling = 0;
    var dragY = null;
    var destroyed = false;

    function escapeHtml(s) {
      return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    function computeMetrics() {
      var w = stage.w;
      var h = stage.h;
      var cardW = Math.min(h * CARD_H * CARD_RATIO, w * CARD_MAX_W);
      var cardH = cardW / CARD_RATIO;
      var drumR = cardH * DRUM;
      var ringR = cardH * RING_R;
      var ringScale = count
        ? clamp((((2 * Math.PI * ringR) / count) * 0.82) / (cardW || 1), 0.16, 1)
        : 1;
      metrics = {
        cardW: cardW,
        cardH: cardH,
        ringR: ringR,
        ringScale: ringScale,
        drumR: drumR,
        bow: cardH * BOW,
        depth: cardH * LENS,
        title: cardH * TITLE,
        index: cardH * INDEX,
      };
      stageEl.style.perspective = metrics.depth + 'px';
      if (labelEl) labelEl.style.fontSize = metrics.title + 'px';
      if (titleEl) titleEl.style.fontSize = metrics.title + 'px';
      root.querySelector('.works-wheel-index').style.fontSize = metrics.index + 'px';
      cardEls.forEach(function (card) {
        card.style.width = metrics.cardW + 'px';
        card.style.height = metrics.cardH + 'px';
        card.style.marginLeft = -metrics.cardW / 2 + 'px';
        card.style.marginTop = -metrics.cardH / 2 + 'px';
      });
    }

    function setActive(near) {
      if (near === active) return;
      active = near;
      if (titleEl) titleEl.textContent = items[active] ? items[active].title : '';
      cardEls.forEach(function (card, i) {
        card.setAttribute('aria-selected', i === active ? 'true' : 'false');
      });
      indexBtns.forEach(function (btn, i) {
        btn.classList.toggle('is-active', i === active);
      });
      stageEl.setAttribute('aria-activedescendant', 'works-wheel-card-' + active);
    }

    function to(next) {
      target = clamp(next, 0, last + 1);
    }

    function draw() {
      if (destroyed) return;
      raf = requestAnimationFrame(draw);
      if (!metrics || !stage.h) return;

      var gap = target - turn;
      if (Math.abs(gap) < 0.0005) turn = target;
      else turn += gap * (reduced ? 1 : EASE);

      var t = turn;
      var m = clamp(t, 0, 1);
      var pos = Math.max(0, t - 1);
      var ringR = metrics.ringR;
      var drumR = metrics.drumR;
      var bow = metrics.bow;
      var ringScale = metrics.ringScale;

      wheelEl.style.transform = 'translateZ(' + -m * drumR + 'px)';

      for (var i = 0; i < count; i++) {
        var d = i - pos;
        var drumDeg = d * STEP;
        var card = cardEls[i];
        if (!card) continue;
        card.style.transform = place(d * (360 / count), drumDeg, ringR, drumR, bow, m);
        card.style.opacity = m > 0.5 && Math.abs(d) > CULL ? '0' : '1';
        card.style.zIndex = String(Math.round(100 - Math.abs(d) * 2));
        var face = card.firstElementChild;
        if (face) face.style.transform = 'scale(' + lerp(ringScale, 1, m) + ')';
      }

      if (labelEl) labelEl.style.opacity = String(1 - m);
      if (titleEl) titleEl.style.opacity = String(m);
      setActive(clamp(Math.round(pos), 0, last));
    }

    function onWheel(e) {
      var next = target + e.deltaY / WHEEL_UNITS;
      if (next > 0 && next < last + 1) e.preventDefault();
      to(next);
      window.clearTimeout(settling);
      settling = window.setTimeout(function () {
        to(Math.round(target));
      }, SETTLE);
    }

    function onPointerDown(e) {
      if (e.button != null && e.button !== 0) return;
      dragY = e.clientY;
      try {
        stageEl.setPointerCapture(e.pointerId);
      } catch (err) {}
    }
    function onPointerMove(e) {
      if (dragY === null) return;
      to(target + (dragY - e.clientY) / DRAG_UNITS);
      dragY = e.clientY;
    }
    function onPointerUp() {
      dragY = null;
      if (target > 1) to(Math.round(target));
    }
    function onKeyDown(e) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        to(Math.round(target) + 1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        to(Math.round(target) - 1);
      }
    }
    function onCardClick(e) {
      var card = e.target.closest('.works-wheel-card');
      if (!card) return;
      var idx = Number(card.getAttribute('data-index'));
      if (Number.isNaN(idx)) return;
      if (Math.abs(turn - (idx + 1)) > 0.35) {
        to(idx + 1);
        return;
      }
      if (typeof onSelect === 'function') onSelect(idx, items[idx]);
    }
    function onIndexClick(e) {
      var btn = e.target.closest('[data-jump]');
      if (!btn) return;
      to(Number(btn.getAttribute('data-jump')) + 1);
    }

    function readSize() {
      stage.w = stageEl.clientWidth;
      stage.h = stageEl.clientHeight;
      computeMetrics();
    }

    var ro = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(readSize);
      ro.observe(stageEl);
    }
    window.addEventListener('resize', readSize);

    stageEl.addEventListener('wheel', onWheel, { passive: false });
    stageEl.addEventListener('pointerdown', onPointerDown);
    stageEl.addEventListener('pointermove', onPointerMove);
    stageEl.addEventListener('pointerup', onPointerUp);
    stageEl.addEventListener('pointercancel', onPointerUp);
    stageEl.addEventListener('keydown', onKeyDown);
    root.addEventListener('click', onCardClick);
    root.addEventListener('click', onIndexClick);

    readSize();
    if (titleEl) titleEl.textContent = items[0] ? items[0].title : '';
    raf = requestAnimationFrame(draw);

    var api = {
      root: root,
      to: to,
      destroy: function () {
        destroyed = true;
        cancelAnimationFrame(raf);
        window.clearTimeout(settling);
        window.removeEventListener('resize', readSize);
        if (ro) ro.disconnect();
        stageEl.removeEventListener('wheel', onWheel);
        stageEl.removeEventListener('pointerdown', onPointerDown);
        stageEl.removeEventListener('pointermove', onPointerMove);
        stageEl.removeEventListener('pointerup', onPointerUp);
        stageEl.removeEventListener('pointercancel', onPointerUp);
        stageEl.removeEventListener('keydown', onKeyDown);
        root.removeEventListener('click', onCardClick);
        root.removeEventListener('click', onIndexClick);
      },
    };
    instances.push(api);
    return api;
  }

  window.initWorksWheel = initWorksWheel;
  window.destroyWorksWheel = destroyWorksWheel;
})();
