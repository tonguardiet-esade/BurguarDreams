/**
 * Coverflow Gallery — carrusel 3D (centro grande, laterales rotadas/escaladas).
 * Sustituye el photo-strip de arrastre horizontal en la ficha.
 */
(function () {
  'use strict';

  var MAX_VISIBLE = 4.25; /* centro + 4 por lado = 9 visibles */
  var SWIPE_PX = 48;
  var instances = [];

  function clamp(n, lo, hi) {
    return Math.min(hi, Math.max(lo, n));
  }

  function shortestDelta(from, to, len) {
    var d = ((to - from) % len + len) % len;
    if (d > len / 2) d -= len;
    return d;
  }

  function destroyCoverflowGallery(root) {
    for (var i = instances.length - 1; i >= 0; i--) {
      if (instances[i].root === root || !root) {
        instances[i].destroy();
        instances.splice(i, 1);
      }
    }
  }

  function readCssPx(el, name, fallback) {
    var raw = getComputedStyle(el).getPropertyValue(name).trim();
    var n = parseFloat(raw);
    return isFinite(n) ? n : fallback;
  }

  function initCoverflowGallery(root, options) {
    if (!root) return null;
    destroyCoverflowGallery(root);

    var items = (options && options.items) || [];
    var count = items.length;
    if (!count) return null;

    var onSelect = (options && options.onSelect) || null;

    root.classList.add('coverflow');
    root.innerHTML =
      '<div class="coverflow__stage" tabindex="0" role="listbox" aria-label="Galería de fotos">' +
      '<div class="coverflow__world"></div>' +
      '<button type="button" class="coverflow__nav coverflow__nav--prev" aria-label="Anterior">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>' +
      '</button>' +
      '<button type="button" class="coverflow__nav coverflow__nav--next" aria-label="Siguiente">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>' +
      '</button>' +
      '<ol class="coverflow__dots"></ol>' +
      '</div>';

    var stage = root.querySelector('.coverflow__stage');
    var world = root.querySelector('.coverflow__world');
    var prevBtn = root.querySelector('.coverflow__nav--prev');
    var nextBtn = root.querySelector('.coverflow__nav--next');
    var dotsEl = root.querySelector('.coverflow__dots');

    var cards = [];
    var dots = [];
    var i;
    for (i = 0; i < count; i++) {
      var item = items[i];
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'coverflow__card';
      btn.setAttribute('role', 'option');
      btn.setAttribute('data-index', String(i));
      btn.setAttribute('aria-label', item.title || item.text || 'Foto ' + (i + 1));
      var img = document.createElement('img');
      img.src = item.image;
      img.alt = item.title || item.text || '';
      img.draggable = false;
      img.decoding = 'async';
      img.loading = i < 3 ? 'eager' : 'lazy';
      btn.appendChild(img);
      world.appendChild(btn);
      cards.push(btn);

      var dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'coverflow__dot';
      dot.setAttribute('aria-label', 'Ir a foto ' + (i + 1));
      dot.setAttribute('data-index', String(i));
      dotsEl.appendChild(dot);
      dots.push(dot);
    }

    var active = 0; /* índice lógico / destino */
    var pending = 0; /* destino aunque la animación no haya acabado */
    var displayCenter = 0; /* posición visual (float) */
    var dragOffset = 0;
    var dragging = false;
    var dragMoved = false;
    var startX = 0;
    var lastX = 0;
    var pointerId = null;
    var destroyed = false;
    var ro = null;
    var animToken = 0;
    var animating = false;
    var ANIM_MS = 1100;
    var pressCard = null;
    var suppressClick = false;

    function easeOutCubic(t) {
      return 1 - Math.pow(1 - t, 3);
    }

    function modIndex(n) {
      return ((n % count) + count) % count;
    }

    /* Delta más corto entre dos posiciones (pueden ser float) */
    function shortestDeltaF(from, to) {
      var d = to - from;
      d = d - count * Math.round(d / count);
      return d;
    }

    function metrics() {
      var cardW = (cards[0] && cards[0].offsetWidth) || 320;
      /* Ancho real del detail-body (crema), no solo el stage interno */
      var body = root.closest('.detail-body');
      var spanW =
        (body && body.clientWidth) ||
        (stage && stage.clientWidth) ||
        root.clientWidth ||
        800;
      var maxOff = Math.floor(MAX_VISIBLE); /* 4 */
      /*
       * Separación agresiva: el centro de ±4 pasa del borde
       * para compensar el foreshortening 3D y llenar el detail-body.
       */
      var overshoot = cardW * 0.42;
      var gap =
        maxOff > 0 ? (spanW / 2 + overshoot) / maxOff : cardW * 0.55;
      var gapRatio = gap / cardW;
      root.style.setProperty('--cf-gap-ratio', String(gapRatio.toFixed(4)));
      return {
        cardW: cardW,
        gap: gap,
        depth: readCssPx(root, '--cf-depth', 100),
        rotate: readCssPx(root, '--cf-rotate', 15),
        sideScale: readCssPx(root, '--cf-side-scale', 1),
        sideY: readCssPx(root, '--cf-side-y', 0),
        activeY: readCssPx(root, '--cf-active-y', 0),
      };
    }

    function paintCenter(center) {
      displayCenter = center;
      var m = metrics();
      var park = MAX_VISIBLE + 1.1;
      var dotIdx = modIndex(Math.round(pending));

      for (i = 0; i < count; i++) {
        var el = cards[i];
        var raw = i - center;
        var off = shortestDelta(0, raw, count);
        if (count <= 1) off = 0;

        var abs = Math.abs(off);
        var visualOff = clamp(off, -park, park);
        var absVis = Math.abs(visualOff);

        var rot = -visualOff * m.rotate;
        var scale = m.sideScale;
        var x = visualOff * m.gap;
        var y = absVis < 0.001 ? m.activeY : m.sideY;
        var z = -absVis * m.depth;
        var edgeFade = clamp((MAX_VISIBLE + 0.25 - absVis) / 1.05, 0, 1);
        var baseOp = clamp(1 - Math.max(0, absVis - 1) * 0.1, 0.72, 1);
        var opacity = baseOp * edgeFade;
        var zIndex = String(Math.round(100 - absVis * 18));

        el.style.opacity = String(opacity);
        el.style.zIndex = zIndex;
        el.style.visibility = 'visible';
        el.style.pointerEvents = opacity < 0.05 || abs > 1.2 ? 'none' : 'auto';
        el.style.transform =
          'translate3d(' +
          x.toFixed(2) +
          'px,' +
          y.toFixed(2) +
          'px,' +
          z.toFixed(2) +
          'px) rotateY(' +
          rot.toFixed(2) +
          'deg) scale(' +
          scale.toFixed(4) +
          ')';

        el.classList.toggle('is-active', abs < 0.35);
        el.classList.toggle('is-side', abs >= 0.35 && abs < 1.15);
        el.classList.toggle('is-far', abs >= 1.15);
        el.setAttribute('aria-selected', abs < 0.35 ? 'true' : 'false');
      }

      for (i = 0; i < dots.length; i++) {
        dots[i].classList.toggle('is-active', i === dotIdx);
      }
    }

    function paint(frac) {
      paintCenter(active + (frac || 0));
    }

    function cancelAnim() {
      animToken += 1;
      animating = false;
      stage.classList.remove('is-animating');
    }

    function goTo(index, instant) {
      if (count <= 0) return;
      var target = modIndex(index);
      pending = target;
      dragOffset = 0;
      stage.classList.remove('is-dragging');

      var from = displayCenter;
      var delta = shortestDeltaF(from, target);

      if (instant || Math.abs(delta) < 0.001) {
        cancelAnim();
        active = target;
        pending = target;
        paintCenter(target);
        return;
      }

      var token = ++animToken;
      var t0 = performance.now();
      animating = true;
      stage.classList.add('is-animating');

      function frame(now) {
        if (token !== animToken || destroyed) return;
        var t = Math.min(1, (now - t0) / ANIM_MS);
        var eased = easeOutCubic(t);
        paintCenter(from + delta * eased);
        if (t < 1) {
          window.requestAnimationFrame(frame);
        } else {
          active = target;
          pending = target;
          animating = false;
          stage.classList.remove('is-animating');
          paintCenter(target);
        }
      }
      window.requestAnimationFrame(frame);
    }

    function next() {
      goTo(pending + 1);
    }
    function prev() {
      goTo(pending - 1);
    }

    function onNavClick(e) {
      e.preventDefault();
      e.stopPropagation();
      if (e.currentTarget === prevBtn) prev();
      else next();
    }

    function onDotClick(e) {
      var idx = Number(e.currentTarget.getAttribute('data-index'));
      if (!isNaN(idx)) goTo(idx);
    }

    function openCard(idx) {
      if (isNaN(idx) || idx < 0 || idx >= count) return;
      if (idx === pending || idx === modIndex(Math.round(displayCenter))) {
        active = idx;
        pending = idx;
        if (onSelect) onSelect(idx);
        return;
      }
      goTo(idx);
    }

    function onCardClick(e) {
      if (suppressClick || dragMoved) {
        e.preventDefault();
        e.stopPropagation();
        suppressClick = false;
        return;
      }
      var idx = Number(e.currentTarget.getAttribute('data-index'));
      openCard(idx);
    }

    function onPointerDown(e) {
      if (e.button != null && e.button !== 0) return;
      if (e.target.closest && e.target.closest('.coverflow__nav, .coverflow__dot')) {
        pressCard = null;
        return;
      }
      cancelAnim();
      active = pending;
      displayCenter = pending;
      dragging = true;
      dragMoved = false;
      suppressClick = false;
      pointerId = e.pointerId;
      startX = e.clientX;
      lastX = e.clientX;
      pressCard = e.target.closest ? e.target.closest('.coverflow__card') : null;
      stage.classList.add('is-dragging');
      try {
        stage.setPointerCapture(pointerId);
      } catch (err) {}
    }

    function onPointerMove(e) {
      if (!dragging || (pointerId != null && e.pointerId !== pointerId)) return;
      lastX = e.clientX;
      var dx = lastX - startX;
      if (Math.abs(dx) > 6) dragMoved = true;
      var m = metrics();
      var frac = clamp(-dx / Math.max(m.gap * 1.15, 80), -1.15, 1.15);
      dragOffset = frac;
      paint(frac);
    }

    function onPointerUp(e) {
      if (!dragging || (pointerId != null && e.pointerId !== pointerId)) return;
      dragging = false;
      stage.classList.remove('is-dragging');
      try {
        stage.releasePointerCapture(pointerId);
      } catch (err) {}
      pointerId = null;

      var dx = lastX - startX;
      if (!dragMoved && pressCard) {
        var idx = Number(pressCard.getAttribute('data-index'));
        pressCard = null;
        dragOffset = 0;
        paintCenter(active);
        openCard(idx);
        suppressClick = true;
        return;
      }

      pressCard = null;
      if (Math.abs(dx) >= SWIPE_PX) {
        suppressClick = true;
        if (dx < 0) next();
        else prev();
      } else {
        var snapDelta = dragOffset;
        dragOffset = 0;
        suppressClick = true;
        if (Math.abs(snapDelta) < 0.02) {
          paintCenter(active);
        } else {
          goTo(active);
        }
      }
      window.setTimeout(function () {
        dragMoved = false;
        suppressClick = false;
      }, 80);
    }

    function onKey(e) {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        next();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prev();
      } else if (e.key === 'Enter' || e.key === ' ') {
        if (document.activeElement && document.activeElement.classList.contains('coverflow__card')) {
          return;
        }
        e.preventDefault();
        if (onSelect) onSelect(pending);
      }
    }

    function onResize() {
      paintCenter(dragging ? active + dragOffset : displayCenter);
    }

    prevBtn.addEventListener('click', onNavClick);
    nextBtn.addEventListener('click', onNavClick);
    for (i = 0; i < cards.length; i++) {
      cards[i].addEventListener('click', onCardClick);
    }
    for (i = 0; i < dots.length; i++) {
      dots[i].addEventListener('click', onDotClick);
    }
    stage.addEventListener('pointerdown', onPointerDown);
    stage.addEventListener('pointermove', onPointerMove);
    stage.addEventListener('pointerup', onPointerUp);
    stage.addEventListener('pointercancel', onPointerUp);
    stage.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(onResize);
      ro.observe(root);
    }

    paintCenter(0);

    var api = {
      root: root,
      goTo: goTo,
      next: next,
      prev: prev,
      destroy: function () {
        if (destroyed) return;
        destroyed = true;
        cancelAnim();
        prevBtn.removeEventListener('click', onNavClick);
        nextBtn.removeEventListener('click', onNavClick);
        for (i = 0; i < cards.length; i++) {
          cards[i].removeEventListener('click', onCardClick);
        }
        for (i = 0; i < dots.length; i++) {
          dots[i].removeEventListener('click', onDotClick);
        }
        stage.removeEventListener('pointerdown', onPointerDown);
        stage.removeEventListener('pointermove', onPointerMove);
        stage.removeEventListener('pointerup', onPointerUp);
        stage.removeEventListener('pointercancel', onPointerUp);
        stage.removeEventListener('keydown', onKey);
        window.removeEventListener('resize', onResize);
        if (ro) ro.disconnect();
        root.classList.remove('coverflow');
        root.innerHTML = '';
      },
    };
    instances.push(api);
    return api;
  }

  window.initCoverflowGallery = initCoverflowGallery;
  window.destroyCoverflowGallery = destroyCoverflowGallery;
})();
