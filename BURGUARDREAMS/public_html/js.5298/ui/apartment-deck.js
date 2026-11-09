/**
 * Mazo 3D apartamentos — animación automática al entrar en la sección.
 * 0 = juntas / lejos · 1 = grandes en fila.
 * Ya no depende de rueda ni drag: IntersectionObserver dispara 0→1.
 */
(function () {
  var FROM_BASE = [
    { x: -14, y: -14, z: 0, scale: 0.18 },
    { x: 14, y: -14, z: 0, scale: 0.18 },
    { x: -14, y: 14, z: 0, scale: 0.18 },
    { x: 14, y: 14, z: 0, scale: 0.18 },
  ];

  var DURATION_MS = 1600;
  var progress = 0;
  var raf = 0;
  var bound = false;
  var rootEl = null;
  var deckEl = null;
  var cardEls = [];
  var copyEl = null;
  var titleEl = null;
  var cachedLayout = null;
  var cachedLayoutW = 0;
  var cachedLayoutH = 0;
  var animating = false;
  var animFrom = 0;
  var animTo = 0;
  var animStart = 0;
  var io = null;
  var reduced = false;

  function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
  }

  function lerp(a, b, p) {
    return a + (b - a) * p;
  }

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function isMobile() {
    return window.innerWidth <= 768;
  }

  function cardBaseSize() {
    if (cardEls[0] && cardEls[0].offsetWidth) {
      return {
        w: cardEls[0].offsetWidth,
        h: cardEls[0].offsetHeight || cardEls[0].offsetWidth * 1.28,
      };
    }
    return isMobile() ? { w: 320, h: 390 } : { w: 560, h: 500 };
  }

  function getLayout() {
    var sceneW = rootEl ? rootEl.clientWidth : window.innerWidth || 1200;
    var sceneH = rootEl ? rootEl.clientHeight : window.innerHeight || 800;
    if (
      cachedLayout &&
      Math.abs(cachedLayoutW - sceneW) < 2 &&
      Math.abs(cachedLayoutH - sceneH) < 2
    ) {
      return cachedLayout;
    }

    var n = Math.max(1, cardEls.length || 4);
    var mobile = isMobile();
    /* Móvil: 1 columna (una debajo de otra). PC: 2×2 */
    var cols = mobile ? 1 : 2;
    var rows = Math.ceil(n / cols);
    var base = cardBaseSize();
    var padX = mobile ? 12 : 16;
    var padY = mobile ? 20 : 24;
    var gapX = mobile ? 12 : 20;
    var gapY = mobile ? 18 : 20;
    var availW = Math.max(80, sceneW - padX * 2);
    var availH = Math.max(80, sceneH - padY * 2);

    var scaleW = (availW - (cols - 1) * gapX) / (cols * base.w);
    var scaleH = (availH - (rows - 1) * gapY) / (rows * base.h);
    var maxScale = Math.min(scaleW, scaleH);
    maxScale = Math.min(maxScale, mobile ? 1.08 : 1.65);

    var visualW = base.w * maxScale;
    var visualH = base.h * maxScale;
    var stepX = visualW + gapX;
    var stepY = visualH + gapY;
    var gridW = cols * visualW + (cols - 1) * gapX;
    var gridH = rows * visualH + (rows - 1) * gapY;
    var originX = -gridW / 2 + visualW / 2;
    var originY = -gridH / 2 + visualH / 2;

    var layout = [];
    for (var i = 0; i < n; i++) {
      var col = i % cols;
      var row = (i / cols) | 0;
      var from = FROM_BASE[i] || FROM_BASE[FROM_BASE.length - 1];
      layout.push({
        from: from,
        to: {
          x: originX + col * stepX,
          y: originY + row * stepY,
          z: 0,
          scale: maxScale,
        },
      });
    }

    cachedLayout = layout;
    cachedLayoutW = sceneW;
    cachedLayoutH = sceneH;
    return layout;
  }

  function clearMobileTransforms() {
    for (var i = 0; i < cardEls.length; i++) {
      var el = cardEls[i];
      if (!el) continue;
      el.style.transform = '';
      el.style.zIndex = '';
    }
    if (deckEl) deckEl.style.transform = '';
    if (titleEl) {
      titleEl.style.opacity = '';
      titleEl.style.transform = '';
    }
    if (copyEl) {
      copyEl.style.opacity = '';
      copyEl.style.transform = '';
    }
    if (rootEl) {
      rootEl.style.setProperty('--deck-progress', '1');
      rootEl.classList.add('is-stacked', 'is-open', 'is-mobile-stack');
    }
  }

  function render(p) {
    /* Móvil: CSS en columna a ancho completo; no aplicar transforms del mazo */
    if (isMobile()) {
      progress = 1;
      clearMobileTransforms();
      return;
    }

    if (rootEl) rootEl.classList.remove('is-mobile-stack');

    progress = p;
    var layout = getLayout();
    var n = cardEls.length;

    for (var i = 0; i < n; i++) {
      var el = cardEls[i];
      var motion = layout[i] || layout[layout.length - 1];
      if (!el || !motion) continue;

      var stagger = i * 0.045;
      var cp = clamp((p - stagger) / Math.max(0.001, 1 - stagger * 0.85), 0, 1);
      var eased = easeInOutCubic(cp);

      var x = lerp(motion.from.x, motion.to.x, eased);
      var y = lerp(motion.from.y, motion.to.y, eased);
      var z = lerp(motion.from.z, motion.to.z, eased);
      var fromScale = motion.from.scale != null ? motion.from.scale : 0.2;
      var scale = lerp(fromScale, motion.to.scale, eased);

      el.style.transform =
        'translate3d(' +
        x.toFixed(1) +
        'px,' +
        y.toFixed(1) +
        'px,' +
        z.toFixed(1) +
        'px) scale(' +
        scale.toFixed(4) +
        ')';
      if (!el.classList.contains('is-front')) {
        el.style.zIndex = String(200 + i);
      }
    }

    if (titleEl) {
      var fade = clamp((p - 0.35) / 0.4, 0, 1);
      titleEl.style.opacity = String(1 - fade * 0.35);
      titleEl.style.transform = 'translate3d(0,' + (-fade * 12).toFixed(1) + 'px,0)';
    }

    if (copyEl) {
      var copyP = clamp((p - 0.72) / 0.28, 0, 1);
      var copyEase = 1 - Math.pow(1 - copyP, 3);
      copyEl.style.opacity = String(copyP);
      copyEl.style.transform =
        'translate3d(-50%,' + lerp(36, 0, copyEase).toFixed(1) + 'px,0)';
      copyEl.setAttribute('aria-hidden', copyP < 0.2 ? 'true' : 'false');
    }

    if (deckEl) {
      deckEl.style.transform =
        'translate3d(0,' + (8 * (1 - p)).toFixed(1) + 'px,0)';
    }

    if (rootEl) {
      rootEl.style.setProperty('--deck-progress', String(p.toFixed(4)));
      rootEl.classList.toggle('is-stacked', p > 0.72);
      rootEl.classList.toggle('is-open', p > 0.95);
    }
  }

  function tick(now) {
    raf = 0;
    var home = document.getElementById('home-view');
    if (home && home.style.display === 'none') {
      animating = false;
      return;
    }

    if (!animating) {
      render(progress);
      return;
    }

    var t = (now - animStart) / DURATION_MS;
    if (t >= 1) {
      progress = animTo;
      animating = false;
      render(progress);
      return;
    }

    progress = lerp(animFrom, animTo, easeOutCubic(clamp(t, 0, 1)));
    render(progress);
    raf = requestAnimationFrame(tick);
  }

  function kickDeck() {
    if (!raf) raf = requestAnimationFrame(tick);
  }

  function animateTo(to) {
    to = clamp(to, 0, 1);
    if (isMobile() || reduced) {
      animating = false;
      progress = isMobile() ? 1 : to;
      render(progress);
      return;
    }
    if (Math.abs(progress - to) < 0.001) {
      progress = to;
      render(progress);
      return;
    }
    animFrom = progress;
    animTo = to;
    animStart = performance.now();
    animating = true;
    kickDeck();
  }

  function openDeck() {
    animateTo(1);
  }

  function resetDeck() {
    animating = false;
    progress = isMobile() ? 1 : 0;
    render(progress);
  }

  function openApartmentFromDeck(slug, fromEl) {
    if (!slug) return;
    if (typeof isPageTransitionBusy === 'function' && isPageTransitionBusy()) return;
    if (typeof transitionToDetail === 'function') {
      transitionToDetail(slug, fromEl || null);
      return;
    }
    if (typeof showDetail === 'function') {
      showDetail(slug);
      return;
    }
    if (typeof propertyUrl === 'function') {
      window.location.href = propertyUrl(slug);
    }
  }

  function onCardClick(e) {
    var openBtn = e.target.closest && e.target.closest('[data-open-property]');
    var card = e.target.closest && e.target.closest('.apartment-deck-card[data-slug]');
    if (!openBtn && !card) return;

    e.preventDefault();
    e.stopPropagation();
    var slug =
      (openBtn && openBtn.getAttribute('data-open-property')) ||
      (card && card.getAttribute('data-slug'));
    openApartmentFromDeck(slug, openBtn || card);
  }

  function onCardPointerEnter(e) {
    var card = e.currentTarget;
    if (!card) return;
    card.classList.add('is-front');
    card.style.zIndex = '900';
  }

  function onCardPointerLeave(e) {
    var card = e.currentTarget;
    if (!card) return;
    card.classList.remove('is-front');
    /* Restaurar z según profundidad actual */
    render(progress);
  }

  function onIntersect(entries) {
    entries.forEach(function (entry) {
      var rect = entry.boundingClientRect;
      var vh = window.innerHeight || 1;
      /*
       * Observamos #hogar (incluye título + escena). Si solo mirábamos la
       * escena (~900px), con umbral alto nunca “abría” y solo se veían sparkles.
       */
      var entered =
        entry.isIntersecting ||
        (rect.top < vh * 0.88 && rect.bottom > vh * 0.12);

      if (entered) {
        openDeck();
      } else if (rect.top >= vh * 0.92) {
        resetDeck();
      } else if (rect.bottom <= 0) {
        if (progress < 1) {
          progress = 1;
          render(1);
        }
      }
    });
  }

  function collect() {
    rootEl = document.getElementById('apartment-deck-scene');
    deckEl = document.getElementById('properties-grid');
    if (!rootEl || !deckEl) return false;
    cardEls = Array.prototype.slice.call(
      deckEl.querySelectorAll('.apartment-deck-card')
    );
    copyEl = rootEl.querySelector('.apartment-deck-copy');
    titleEl = document.querySelector('#hogar .section-label');
    return cardEls.length > 0;
  }

  function unbindCards() {
    cardEls.forEach(function (card) {
      card.removeEventListener('pointerenter', onCardPointerEnter);
      card.removeEventListener('pointerleave', onCardPointerLeave);
    });
  }

  function bind() {
    reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!bound) {
      bound = true;
      window.addEventListener('resize', function () {
        cachedLayout = null;
        cachedLayoutW = 0;
        cachedLayoutH = 0;
        if (isMobile()) {
          animating = false;
          progress = 1;
        }
        render(progress);
      });
      deckEl.addEventListener('click', onCardClick, true);
    }

    unbindCards();
    cardEls.forEach(function (card) {
      card.addEventListener('pointerenter', onCardPointerEnter);
      card.addEventListener('pointerleave', onCardPointerLeave);
    });

    if (typeof IntersectionObserver !== 'undefined') {
      if (io) io.disconnect();
      io = new IntersectionObserver(onIntersect, {
        root: null,
        threshold: [0, 0.05, 0.12, 0.25, 0.4],
        rootMargin: '8% 0px -4% 0px',
      });
      /* Solo #hogar: observar escena + hogar a la vez podía resetear el mazo */
      var target = document.getElementById('hogar') || rootEl;
      io.observe(target);
    } else {
      openDeck();
    }
  }

  window.initApartmentDeck = function initApartmentDeck() {
    if (!collect()) return;
    deckEl.classList.add('apartment-deck');
    rootEl.classList.add('is-autoplay');
    rootEl.classList.remove('is-dragging');
    cachedLayout = null;
    cachedLayoutW = 0;
    cachedLayoutH = 0;
    bind();
    if (isMobile()) {
      progress = 1;
      animating = false;
      render(1);
      return;
    }
    progress = 0;
    animating = false;
    render(0);

    /* Si ya está en vista al cargar (ancla #hogar), abrir */
    var probe = document.getElementById('hogar') || rootEl;
    var rect = probe.getBoundingClientRect();
    var vh = window.innerHeight || 1;
    if (rect.top < vh * 0.88 && rect.bottom > vh * 0.12) {
      openDeck();
    }
  };

  window.resumeApartmentDeck = function resumeApartmentDeck() {
    if (!rootEl) return;
    var probe = document.getElementById('hogar') || rootEl;
    var rect = probe.getBoundingClientRect();
    var vh = window.innerHeight || 1;
    if (rect.top < vh * 0.88 && rect.bottom > vh * 0.12) {
      openDeck();
    } else if (rect.top >= vh * 0.88) {
      resetDeck();
    }
  };
})();
