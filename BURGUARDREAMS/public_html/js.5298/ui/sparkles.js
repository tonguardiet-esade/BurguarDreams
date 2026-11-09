/**
 * Sparkles — glow + puntitos arriba; copia girada 180° abajo.
 * Fondo detrás de #properties-grid.
 */
(function () {
  var api = null;

  function makeLayer(stageEl) {
    var canvas = stageEl.querySelector('.sparkles-canvas');
    if (!canvas) return null;
    var ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return null;

    var particles = [];
    var w = 0;
    var h = 0;
    var dpr = 1;

    function particleCount() {
      var area = Math.max(1, (w * h) / (400 * 400));
      return Math.min(2200, Math.max(400, Math.round(1200 * area * 0.35)));
    }

    function seed() {
      var n = particleCount();
      particles = [];
      for (var i = 0; i < n; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: 0.8 + Math.random() * 1.2,
          a: 0.15 + Math.random() * 0.85,
          da: (Math.random() > 0.5 ? 1 : -1) * (0.014 + Math.random() * 0.032),
          vx: (Math.random() - 0.5) * 0.28,
          vy: (Math.random() - 0.5) * 0.28,
        });
      }
    }

    function resize() {
      var rect = stageEl.getBoundingClientRect();
      w = Math.max(2, Math.round(rect.width));
      h = Math.max(2, Math.round(rect.height));
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }

    function tick() {
      if (w < 2 || h < 2) return;
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.a += p.da;
        if (p.a >= 1) {
          p.a = 1;
          p.da *= -1;
        } else if (p.a <= 0.1) {
          p.a = 0.1;
          p.da *= -1;
        }
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;
        ctx.beginPath();
        ctx.fillStyle = 'rgba(255,255,255,' + p.a + ')';
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    return { resize: resize, tick: tick, el: stageEl };
  }

  function initApartmentDeckSparkles() {
    var host = document.getElementById('apartment-deck-sparkles');
    var scene = document.getElementById('apartment-deck-scene');
    if (!host || !scene) return null;
    if (api && api.destroy) api.destroy();

    host.className = 'apartment-deck-sparkles sparkles-host';
    host.setAttribute('aria-hidden', 'true');
    host.style.cssText =
      'position:absolute;inset:0;z-index:1;width:100%;height:100%;' +
      'pointer-events:none;overflow:hidden;background:transparent;';

    host.innerHTML =
      '<div class="sparkles-preview">' +
      '<div class="sparkles-preview-stage sparkles-preview-stage--top">' +
      '<canvas class="sparkles-canvas" aria-hidden="true"></canvas>' +
      '<div class="sparkles-mask" aria-hidden="true"></div>' +
      '</div>' +
      '<div class="sparkles-preview-stage sparkles-preview-stage--bottom">' +
      '<canvas class="sparkles-canvas" aria-hidden="true"></canvas>' +
      '<div class="sparkles-mask" aria-hidden="true"></div>' +
      '</div>' +
      '</div>';

    var stageEls = host.querySelectorAll('.sparkles-preview-stage');
    var layers = [];
    for (var i = 0; i < stageEls.length; i++) {
      var layer = makeLayer(stageEls[i]);
      if (layer) layers.push(layer);
    }
    if (!layers.length) return null;

    var raf = 0;
    var destroyed = false;

    function resizeAll() {
      for (var i = 0; i < layers.length; i++) layers[i].resize();
    }

    function frame() {
      if (destroyed) return;
      raf = requestAnimationFrame(frame);
      for (var i = 0; i < layers.length; i++) layers[i].tick();
    }

    resizeAll();
    requestAnimationFrame(function () {
      resizeAll();
      if (!raf) frame();
    });
    setTimeout(function () {
      if (!destroyed) resizeAll();
    }, 300);

    window.addEventListener('resize', resizeAll);
    var ro = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(resizeAll);
      for (var j = 0; j < layers.length; j++) ro.observe(layers[j].el);
      ro.observe(scene);
    }

    api = {
      destroy: function () {
        destroyed = true;
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        window.removeEventListener('resize', resizeAll);
        if (ro) ro.disconnect();
        host.innerHTML = '';
        api = null;
      },
    };
    return api;
  }

  window.initApartmentDeckSparkles = initApartmentDeckSparkles;
})();
