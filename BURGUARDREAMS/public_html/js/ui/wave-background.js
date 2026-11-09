/**
 * Wave background (vanilla) — port de wave-background / Waves (simplex-noise).
 * Capas de líneas animadas + reacción al cursor. Sin React.
 */
(function () {
  var SIMPLEX_URL = 'https://cdn.jsdelivr.net/npm/simplex-noise@4.0.3/+esm';
  var noisePromise = null;
  var instances = [];

  function loadNoise() {
    if (!noisePromise) {
      noisePromise = import(SIMPLEX_URL)
        .then(function (mod) {
          return mod.createNoise2D || (mod.default && mod.default.createNoise2D);
        })
        .catch(function (err) {
          noisePromise = null;
          console.error('[Waves] No se pudo cargar simplex-noise', err);
          throw err;
        });
    }
    return noisePromise;
  }

  function destroyWaves(root) {
    for (var i = instances.length - 1; i >= 0; i--) {
      if (instances[i].root === root || !root) {
        instances[i].destroy();
        instances.splice(i, 1);
      }
    }
    if (root) root.innerHTML = '';
  }

  function initWaves(root, options) {
    if (!root) return null;
    destroyWaves(root);

    options = options || {};
    var strokeColor = options.strokeColor || '#ffffff';
    var backgroundColor = options.backgroundColor || '#000000';
    var pointerSize = options.pointerSize != null ? options.pointerSize : 0.5;
    var interactive = options.interactive !== false;

    root.classList.add('waves-component');
    root.style.backgroundColor = backgroundColor;
    root.style.setProperty('--x', '-0.5rem');
    root.style.setProperty('--y', '50%');
    root.innerHTML =
      '<svg class="waves-svg js-svg" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"></svg>';
    if (interactive) {
      root.innerHTML +=
        '<div class="waves-pointer-dot" style="width:' +
        pointerSize +
        'rem;height:' +
        pointerSize +
        'rem;background:' +
        strokeColor +
        '"></div>';
    }

    var svg = root.querySelector('.waves-svg');
    var dot = root.querySelector('.waves-pointer-dot');

    var mouse = {
      x: -10,
      y: 0,
      lx: 0,
      ly: 0,
      sx: 0,
      sy: 0,
      v: 0,
      vs: 0,
      a: 0,
      set: false,
    };
    var paths = [];
    var lines = [];
    var noise = null;
    var raf = 0;
    var bounding = null;
    var destroyed = false;
    var visible = true;
    var io = null;

    function setSize() {
      bounding = root.getBoundingClientRect();
      var width = bounding.width;
      var height = bounding.height;
      if (width < 2 || height < 2) return;
      svg.setAttribute('width', String(width));
      svg.setAttribute('height', String(height));
      svg.style.width = width + 'px';
      svg.style.height = height + 'px';
    }

    function setLines() {
      if (!bounding) return;
      var width = bounding.width;
      var height = bounding.height;
      lines = [];
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      paths = [];

      var xGap = 8;
      var yGap = 8;
      var oWidth = width + 200;
      var oHeight = height + 30;
      var totalLines = Math.ceil(oWidth / xGap);
      var totalPoints = Math.ceil(oHeight / yGap);
      var xStart = (width - xGap * totalLines) / 2;
      var yStart = (height - yGap * totalPoints) / 2;

      for (var i = 0; i < totalLines; i++) {
        var points = [];
        for (var j = 0; j < totalPoints; j++) {
          points.push({
            x: xStart + xGap * i,
            y: yStart + yGap * j,
            wave: { x: 0, y: 0 },
            cursor: { x: 0, y: 0, vx: 0, vy: 0 },
          });
        }
        var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', strokeColor);
        path.setAttribute('stroke-width', '1.35');
        path.setAttribute('class', 'waves-line');
        svg.appendChild(path);
        paths.push(path);
        lines.push(points);
      }
    }

    function updateMousePosition(clientX, clientY) {
      if (!bounding) return;
      /* Rect viewport-relative → usar clientX/Y */
      mouse.x = clientX - bounding.left;
      mouse.y = clientY - bounding.top;
      if (!mouse.set) {
        mouse.sx = mouse.x;
        mouse.sy = mouse.y;
        mouse.lx = mouse.x;
        mouse.ly = mouse.y;
        mouse.set = true;
      }
      root.style.setProperty('--x', mouse.sx + 'px');
      root.style.setProperty('--y', mouse.sy + 'px');
    }

    function onResize() {
      setSize();
      setLines();
    }

    function onMouseMove(e) {
      if (!visible) return;
      /* Actualizar bounding por si hay scroll */
      bounding = root.getBoundingClientRect();
      updateMousePosition(e.clientX, e.clientY);
    }

    function onTouchMove(e) {
      if (!e.touches || !e.touches[0]) return;
      bounding = root.getBoundingClientRect();
      updateMousePosition(e.touches[0].clientX, e.touches[0].clientY);
    }

    function movePoints(time) {
      if (!noise) return;
      for (var li = 0; li < lines.length; li++) {
        var points = lines[li];
        for (var pi = 0; pi < points.length; pi++) {
          var p = points[pi];
          var move =
            noise((p.x + time * 0.008) * 0.003, (p.y + time * 0.003) * 0.002) * 8;
          p.wave.x = Math.cos(move) * 12;
          p.wave.y = Math.sin(move) * 6;

          if (!interactive) continue;

          var dx = p.x - mouse.sx;
          var dy = p.y - mouse.sy;
          var d = Math.hypot(dx, dy);
          var l = Math.max(175, mouse.vs);
          if (d < l) {
            var s = 1 - d / l;
            var f = Math.cos(d * 0.001) * s;
            p.cursor.vx += Math.cos(mouse.a) * f * l * mouse.vs * 0.00035;
            p.cursor.vy += Math.sin(mouse.a) * f * l * mouse.vs * 0.00035;
          }
          p.cursor.vx += (0 - p.cursor.x) * 0.01;
          p.cursor.vy += (0 - p.cursor.y) * 0.01;
          p.cursor.vx *= 0.95;
          p.cursor.vy *= 0.95;
          p.cursor.x += p.cursor.vx;
          p.cursor.y += p.cursor.vy;
          p.cursor.x = Math.min(50, Math.max(-50, p.cursor.x));
          p.cursor.y = Math.min(50, Math.max(-50, p.cursor.y));
        }
      }
    }

    function moved(point, withCursorForce) {
      var useCursor = interactive && withCursorForce;
      return {
        x: point.x + point.wave.x + (useCursor ? point.cursor.x : 0),
        y: point.y + point.wave.y + (useCursor ? point.cursor.y : 0),
      };
    }

    function drawLines() {
      for (var lIndex = 0; lIndex < lines.length; lIndex++) {
        var points = lines[lIndex];
        if (points.length < 2 || !paths[lIndex]) continue;
        var first = moved(points[0], false);
        var d = 'M ' + first.x + ' ' + first.y;
        for (var i = 1; i < points.length; i++) {
          var cur = moved(points[i], true);
          d += 'L ' + cur.x + ' ' + cur.y;
        }
        paths[lIndex].setAttribute('d', d);
      }
    }

    function tick(time) {
      if (destroyed) return;
      if (!visible) {
        raf = 0;
        return;
      }

      if (interactive) {
        mouse.sx += (mouse.x - mouse.sx) * 0.1;
        mouse.sy += (mouse.y - mouse.sy) * 0.1;

        var dx = mouse.x - mouse.lx;
        var dy = mouse.y - mouse.ly;
        var dist = Math.hypot(dx, dy);
        mouse.v = dist;
        mouse.vs += (dist - mouse.vs) * 0.1;
        mouse.vs = Math.min(100, mouse.vs);
        mouse.lx = mouse.x;
        mouse.ly = mouse.y;
        mouse.a = Math.atan2(dy, dx);

        root.style.setProperty('--x', mouse.sx + 'px');
        root.style.setProperty('--y', mouse.sy + 'px');
      }

      movePoints(time);
      drawLines();
      raf = requestAnimationFrame(tick);
    }

    function kick() {
      if (destroyed || raf || !visible) return;
      raf = requestAnimationFrame(tick);
    }

    function setStroke(color) {
      strokeColor = color;
      for (var i = 0; i < paths.length; i++) {
        paths[i].setAttribute('stroke', color);
      }
      if (dot) dot.style.background = color;
    }

    function setBackground(color) {
      backgroundColor = color;
      root.style.backgroundColor = color;
    }

    var api = {
      root: root,
      setStroke: setStroke,
      setBackground: setBackground,
      destroy: function () {
        destroyed = true;
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        window.removeEventListener('resize', onResize);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('touchmove', onTouchMove);
        if (io) io.disconnect();
      },
    };

    loadNoise()
      .then(function (createNoise2D) {
        if (destroyed || typeof createNoise2D !== 'function') return;
        noise = createNoise2D();
        setSize();
        setLines();
        window.addEventListener('resize', onResize);
        if (interactive) {
          window.addEventListener('mousemove', onMouseMove);
          window.addEventListener('touchmove', onTouchMove, { passive: true });
        }

        if (typeof IntersectionObserver !== 'undefined') {
          io = new IntersectionObserver(
            function (entries) {
              visible = entries.some(function (e) {
                return e.isIntersecting;
              });
              if (visible) kick();
            },
            { threshold: 0.05 }
          );
          io.observe(root);
        }
        kick();
      })
      .catch(function () {
        root.classList.add('waves-fallback');
      });

    instances.push(api);
    return api;
  }

  function guideWaveColors() {
    return {
      strokeColor: '#B8955C',
      backgroundColor: 'transparent',
      pointerSize: 0.5,
      interactive: false,
    };
  }

  function initGuideWaves() {
    var host = document.getElementById('guide-waves');
    if (!host) return null;
    return initWaves(host, guideWaveColors());
  }

  window.initWaves = initWaves;
  window.destroyWaves = destroyWaves;
  window.initGuideWaves = initGuideWaves;
})();
