/**
 * Photo Strip — carril horizontal plano.
 * Arrastre fluido + costa ~1s ease-out (60 fps).
 */
(function () {
  'use strict';

  var COPIES = 3;
  var CLICK_SLOP = 12;
  var COAST_MS = 1100;
  var FOLLOW = 0.22; /* seguimiento suave del puntero (más alto = más directo) */
  var IDLE_LERP = 0.14; /* suavizado general hacia target */
  var RELEASE_BOOST = 2.4; /* amplifica inercia al soltar */

  var instances = [];

  function destroyPhotoStrip(root) {
    for (var i = instances.length - 1; i >= 0; i--) {
      if (instances[i].root === root || !root) {
        instances[i].destroy();
        instances.splice(i, 1);
      }
    }
  }

  /* ease-out quint: desacelera más tarde, se siente más fluido */
  function easeOutQuint(t) {
    var u = 1 - Math.min(1, Math.max(0, t));
    return 1 - u * u * u * u * u;
  }

  function initPhotoStrip(root, options) {
    if (!root) return null;
    destroyPhotoStrip(root);

    var items = (options && options.items) || [];
    var count = items.length;
    if (!count) return null;

    var onSelect = (options && options.onSelect) || null;

    root.classList.add('photo-strip');
    root.innerHTML =
      '<div class="photo-strip__viewport">' +
      '<div class="photo-strip__track"></div>' +
      '</div>';

    var viewport = root.querySelector('.photo-strip__viewport');
    var track = root.querySelector('.photo-strip__track');

    var slides = [];
    var c;
    var i;
    for (c = 0; c < COPIES; c++) {
      for (i = 0; i < count; i++) {
        var item = items[i];
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'photo-strip__slide';
        btn.setAttribute('data-index', String(i));
        btn.setAttribute('aria-label', item.title || item.text || '');
        var img = document.createElement('img');
        img.src = item.image;
        img.alt = item.title || item.text || '';
        img.draggable = false;
        img.decoding = 'async';
        img.loading = c === 1 && i < 3 ? 'eager' : 'lazy';
        btn.appendChild(img);
        track.appendChild(btn);
        slides.push(btn);
      }
    }

    var x = 0;
    var target = 0;
    var setWidth = 0;
    var raf = 0;
    var dragging = false;
    var dragMoved = false;
    var suppressClick = false;
    var pressSlide = null;
    var startPointer = 0;
    var pointerX = 0;
    var dragOriginX = 0;
    var lastPointer = 0;
    var lastT = 0;
    var velSamples = [];
    var coasting = false;
    var coastFrom = 0;
    var coastDist = 0;
    var coastStart = 0;
    var destroyed = false;
    var lastPaint = -1;

    function measure() {
      var a = slides[0];
      var b = slides[1];
      if (!a) return;
      var step = b ? b.offsetLeft - a.offsetLeft : a.offsetWidth;
      if (step <= 0) return;
      var prev = setWidth;
      setWidth = step * count;
      if (!prev && setWidth) {
        x = setWidth;
        target = setWidth;
      }
    }

    function wrapValues() {
      if (!setWidth) return;
      while (x < setWidth * 0.5) {
        x += setWidth;
        target += setWidth;
        coastFrom += setWidth;
        dragOriginX += setWidth;
      }
      while (x > setWidth * 1.5) {
        x -= setWidth;
        target -= setWidth;
        coastFrom -= setWidth;
        dragOriginX -= setWidth;
      }
    }

    function paint() {
      wrapValues();
      var px = Math.round(x * 100) / 100;
      if (px === lastPaint) return;
      lastPaint = px;
      track.style.transform = 'translate3d(' + -px + 'px,0,0)';
    }

    function pushVel(v) {
      if (!isFinite(v)) return;
      velSamples.push({ v: v, t: performance.now() });
      while (velSamples.length > 10) velSamples.shift();
      /* descarta muestras viejas (>80ms) */
      var now = performance.now();
      while (velSamples.length && now - velSamples[0].t > 80) {
        velSamples.shift();
      }
    }

    function releaseVel() {
      if (!velSamples.length) return 0;
      var now = performance.now();
      var sum = 0;
      var wSum = 0;
      for (var i = 0; i < velSamples.length; i++) {
        var age = now - velSamples[i].t;
        if (age > 90) continue;
        var w = 1 + (90 - age) / 30;
        sum += velSamples[i].v * w;
        wSum += w;
      }
      return wSum ? sum / wSum : 0;
    }

    function startCoast(velPxPerMs) {
      var v = velPxPerMs;
      if (!isFinite(v)) v = 0;
      /* easeOutQuint: s'(0) = 5*dist/duration → dist = v*dur/5 */
      var dist = (v * COAST_MS) / 5;
      dist *= RELEASE_BOOST;

      var maxDist = setWidth ? setWidth * 1.6 : 2400;
      if (dist > maxDist) dist = maxDist;
      if (dist < -maxDist) dist = -maxDist;

      if (Math.abs(dist) < 12) {
        coasting = false;
        target = x;
        return;
      }

      coastFrom = x;
      coastDist = dist;
      coastStart = performance.now();
      coasting = true;
      target = x + dist;
    }

    function draw(now) {
      if (destroyed) return;
      raf = requestAnimationFrame(draw);
      if (!setWidth) measure();

      if (dragging) {
        var want = dragOriginX - (pointerX - startPointer);
        target = want;
        x += (target - x) * FOLLOW;
      } else if (coasting) {
        var t = (now - coastStart) / COAST_MS;
        if (t >= 1) {
          x = coastFrom + coastDist;
          target = x;
          coasting = false;
        } else {
          x = coastFrom + coastDist * easeOutQuint(t);
          target = x;
        }
      } else {
        x += (target - x) * IDLE_LERP;
        if (Math.abs(target - x) < 0.15) x = target;
      }

      paint();
    }

    function openSlide(slide) {
      if (!slide || typeof onSelect !== 'function') return;
      var idx = Number(slide.getAttribute('data-index'));
      if (Number.isNaN(idx)) return;
      onSelect(idx, items[idx]);
    }

    function onPointerDown(e) {
      if (e.button != null && e.button !== 0) return;
      dragging = true;
      dragMoved = false;
      suppressClick = false;
      pressSlide = e.target.closest
        ? e.target.closest('.photo-strip__slide')
        : null;
      coasting = false;
      startPointer = e.clientX;
      pointerX = e.clientX;
      lastPointer = e.clientX;
      lastT = performance.now();
      dragOriginX = x;
      target = x;
      velSamples.length = 0;
      viewport.classList.add('is-dragging');
      try {
        viewport.setPointerCapture(e.pointerId);
      } catch (err) {}
    }

    function onPointerMove(e) {
      if (!dragging) return;
      var px = e.clientX;
      var now = performance.now();
      var dt = Math.max(now - lastT, 1);
      var dPointer = px - lastPointer;
      /* velocidad del carril = -velocidad del puntero */
      pushVel(-dPointer / dt);
      lastPointer = px;
      lastT = now;
      pointerX = px;
      if (Math.abs(px - startPointer) > CLICK_SLOP) dragMoved = true;
    }

    function release() {
      if (!dragging) return;
      dragging = false;
      viewport.classList.remove('is-dragging');
      if (!dragMoved) {
        target = x;
        /* Tap limpio: abrir lightbox aquí (más fiable que esperar al click) */
        if (pressSlide) {
          openSlide(pressSlide);
          suppressClick = true;
        }
        pressSlide = null;
        return;
      }
      /* Tras un swipe, anular el click fantasma del navegador */
      suppressClick = true;
      pressSlide = null;
      startCoast(releaseVel());
    }

    function onClick(e) {
      if (suppressClick || dragMoved) {
        e.preventDefault();
        e.stopPropagation();
        suppressClick = false;
        return;
      }
      var slide = e.target.closest
        ? e.target.closest('.photo-strip__slide')
        : null;
      if (!slide) return;
      e.preventDefault();
      openSlide(slide);
    }

    function onWheel(e) {
      if (e.ctrlKey) return;
      var dx = e.deltaX || 0;
      var dy = e.deltaY || 0;
      /* Rueda vertical o trackpad horizontal → mover el carril de fotos */
      var delta = Math.abs(dx) > Math.abs(dy) ? dx : dy;
      if (!delta) return;

      if (e.deltaMode === 1) delta *= 16;
      else if (e.deltaMode === 2) delta *= window.innerWidth * 0.35;

      e.preventDefault();
      e.stopPropagation();

      coasting = false;
      dragging = false;
      var step = setWidth && count ? setWidth / count : 280;
      /* Un “notch” de rueda ≈ media foto; trackpad más suave */
      target += delta * 0.85;
      /* Tope suave por evento para no saltar demasiado */
      var maxJump = step * 1.25;
      var jump = target - x;
      if (jump > maxJump) target = x + maxJump;
      if (jump < -maxJump) target = x - maxJump;
    }

    function onResize() {
      var old = setWidth;
      measure();
      if (old && setWidth && old !== setWidth) {
        var k = setWidth / old;
        x *= k;
        target *= k;
        dragOriginX *= k;
        coastFrom *= k;
        coastDist *= k;
      }
    }

    viewport.addEventListener('pointerdown', onPointerDown);
    viewport.addEventListener('pointermove', onPointerMove);
    viewport.addEventListener('pointerup', release);
    viewport.addEventListener('pointercancel', release);
    window.addEventListener('pointerup', release);
    viewport.addEventListener('click', onClick, true);
    viewport.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('resize', onResize);

    var ro = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(onResize);
      ro.observe(viewport);
    }

    measure();
    paint();
    raf = requestAnimationFrame(draw);

    var api = {
      root: root,
      destroy: function () {
        destroyed = true;
        cancelAnimationFrame(raf);
        viewport.removeEventListener('pointerdown', onPointerDown);
        viewport.removeEventListener('pointermove', onPointerMove);
        viewport.removeEventListener('pointerup', release);
        viewport.removeEventListener('pointercancel', release);
        window.removeEventListener('pointerup', release);
        viewport.removeEventListener('click', onClick, true);
        viewport.removeEventListener('wheel', onWheel);
        window.removeEventListener('resize', onResize);
        if (ro) ro.disconnect();
        root.classList.remove('photo-strip');
      },
    };
    instances.push(api);
    return api;
  }

  window.initPhotoStrip = initPhotoStrip;
  window.destroyPhotoStrip = destroyPhotoStrip;
})();
