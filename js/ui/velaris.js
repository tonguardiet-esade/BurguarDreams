/**
 * Velaris — fondo WebGL (simplex noise + gradients). Vanilla, sin React.
 */
(function () {
  var VERTEX = [
    'attribute vec2 position;',
    'varying vec2 vUv;',
    'void main() {',
    '  vUv = position * 0.5 + 0.5;',
    '  gl_Position = vec4(position, 0.0, 1.0);',
    '}',
  ].join('\n');

  var FRAGMENT = [
    'precision highp float;',
    'varying vec2 vUv;',
    'uniform vec2  u_resolution;',
    'uniform float u_time;',
    'uniform float u_grain;',
    'uniform vec3  u_colors[4];',
    'uniform vec3  u_bg;',
    '',
    'vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }',
    '',
    'float snoise(vec2 v){',
    '  const vec4 C = vec4(0.211324865405187, 0.366025403784439,',
    '           -0.577350269189626, 0.024390243902439);',
    '  vec2 i  = floor(v + dot(v, C.yy) );',
    '  vec2 x0 = v -   i + dot(i, C.xx);',
    '  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);',
    '  vec4 x12 = x0.xyxy + C.xxzz;',
    '  x12.xy -= i1;',
    '  i = mod(i, 289.0);',
    '  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))',
    '  + i.x + vec3(0.0, i1.x, 1.0 ));',
    '  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),',
    '    dot(x12.zw,x12.zw)), 0.0);',
    '  m = m*m ;',
    '  m = m*m ;',
    '  vec3 x = 2.0 * fract(p * C.www) - 1.0;',
    '  vec3 h = abs(x) - 0.5;',
    '  vec3 ox = floor(x + 0.5);',
    '  vec3 a0 = x - ox;',
    '  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );',
    '  vec3 g;',
    '  g.x  = a0.x  * x0.x  + h.x  * x0.y;',
    '  g.yz = a0.yz * x12.xz + h.yz * x12.yw;',
    '  return 130.0 * dot(m, g);',
    '}',
    '',
    'void main() {',
    '  vec2 uv = vUv;',
    '  float ratio = u_resolution.x / u_resolution.y;',
    '  vec2 p = uv - 0.5;',
    '  p.x *= ratio;',
    '  float t = u_time * 0.1;',
    '  float n1 = snoise(p * 0.4 + vec2(t * 0.2, -t * 0.3));',
    '  float n2 = snoise(p * 0.55 + vec2(-t * 0.15, t * 0.25) + n1 * 0.25);',
    '  float n3 = snoise(p * 0.75 + vec2(t * 0.1, -t * 0.2) + n2 * 0.2);',
    '  vec3 col = u_bg;',
    '  float dist = length(p) * 1.5;',
    '  float vignette = 1.0 - smoothstep(0.3, 1.2, dist);',
    '  col = mix(col, u_colors[0], smoothstep(-0.2, 0.5, n1) * 0.85);',
    '  col = mix(col, u_colors[1], smoothstep(-0.1, 0.6, n2) * 0.7);',
    '  col = mix(col, u_colors[2], smoothstep(-0.3, 0.4, n3) * 0.6);',
    '  col = mix(col, u_colors[3], smoothstep(0.0, 0.7, n1 * n2) * 0.5);',
    '  float glow = smoothstep(0.8, 0.0, dist) * 0.3;',
    '  col += u_colors[1] * glow;',
    '  col = mix(col * 0.2, col, vignette);',
    '  float grain = fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453 + u_time);',
    '  col += (grain - 0.5) * u_grain * 0.1;',
    '  gl_FragColor = vec4(col, 1.0);',
    '}',
  ].join('\n');

  var DEFAULT_COLORS = ['#F5D76E', '#E8C547', '#D4A017', '#000000'];
  var instances = [];

  function hexToRgb(hex) {
    var h = String(hex || '#000000').replace('#', '');
    if (h.length === 3) {
      h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    }
    return [
      parseInt(h.slice(0, 2), 16) / 255,
      parseInt(h.slice(2, 4), 16) / 255,
      parseInt(h.slice(4, 6), 16) / 255,
    ];
  }

  function destroyVelaris(root) {
    for (var i = instances.length - 1; i >= 0; i--) {
      if (instances[i].root === root || !root) {
        instances[i].destroy();
        instances.splice(i, 1);
      }
    }
    if (root) root.innerHTML = '';
  }

  function initVelaris(root, options) {
    if (!root) return null;
    destroyVelaris(root);

    options = options || {};
    var bg = options.bg || '#000000';
    var colors = (options.colors && options.colors.length
      ? options.colors
      : DEFAULT_COLORS
    ).slice(0, 4);
    while (colors.length < 4) colors.push('#000000');
    var speed = options.speed != null ? options.speed : 2.0;
    var grain = options.grain != null ? options.grain : 0.3;

    root.classList.add('velaris');
    root.innerHTML =
      '<canvas class="velaris-canvas" aria-hidden="true"></canvas>';

    var canvas = root.querySelector('.velaris-canvas');
    var gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: false,
      powerPreference: 'low-power',
    });
    if (!gl) {
      root.style.background = bg;
      root.classList.add('velaris-fallback');
      return null;
    }

    function createShader(type, src) {
      var s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    }

    var program = gl.createProgram();
    gl.attachShader(program, createShader(gl.VERTEX_SHADER, VERTEX));
    gl.attachShader(program, createShader(gl.FRAGMENT_SHADER, FRAGMENT));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      root.style.background = bg;
      root.classList.add('velaris-fallback');
      return null;
    }
    gl.useProgram(program);

    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    );

    var pos = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    var locs = {
      res: gl.getUniformLocation(program, 'u_resolution'),
      time: gl.getUniformLocation(program, 'u_time'),
      grain: gl.getUniformLocation(program, 'u_grain'),
      colors: [
        gl.getUniformLocation(program, 'u_colors[0]'),
        gl.getUniformLocation(program, 'u_colors[1]'),
        gl.getUniformLocation(program, 'u_colors[2]'),
        gl.getUniformLocation(program, 'u_colors[3]'),
      ],
      bg: gl.getUniformLocation(program, 'u_bg'),
    };

    var raf = 0;
    var destroyed = false;
    var visible = true;
    var io = null;
    var ro = null;
    var reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = Math.max(1, root.clientWidth || root.parentElement.clientWidth || 1);
      var h = Math.max(1, root.clientHeight || root.parentElement.clientHeight || 1);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      gl.viewport(0, 0, canvas.width, canvas.height);
    }

    function paint(t) {
      var bgRgb = hexToRgb(bg);
      gl.uniform2f(locs.res, canvas.width, canvas.height);
      gl.uniform1f(locs.time, (t || 0) * 0.001 * speed);
      gl.uniform1f(locs.grain, grain);
      gl.uniform3f(locs.bg, bgRgb[0], bgRgb[1], bgRgb[2]);
      for (var i = 0; i < 4; i++) {
        var rgb = hexToRgb(colors[i]);
        if (locs.colors[i]) {
          gl.uniform3f(locs.colors[i], rgb[0], rgb[1], rgb[2]);
        }
      }
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    function tick(t) {
      if (destroyed) return;
      if (!visible || reduced) {
        raf = 0;
        return;
      }
      paint(t);
      raf = requestAnimationFrame(tick);
    }

    function kick() {
      if (destroyed || reduced) return;
      if (raf) return;
      raf = requestAnimationFrame(tick);
    }

    function stop() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }

    resize();
    paint(0);

    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(function () {
        resize();
        if (visible && !reduced) kick();
      });
      ro.observe(root);
      if (root.parentElement) ro.observe(root.parentElement);
    } else {
      window.addEventListener('resize', resize);
    }

    /* Arrancar siempre; pausar solo fuera de vista */
    if (!reduced) {
      kick();
      if (typeof IntersectionObserver !== 'undefined') {
        var observeTarget = root.parentElement || root;
        io = new IntersectionObserver(
          function (entries) {
            visible = entries.some(function (e) {
              return e.isIntersecting;
            });
            if (visible) kick();
            else stop();
          },
          { threshold: 0, rootMargin: '40px' }
        );
        io.observe(observeTarget);
      }
    }

    var api = {
      root: root,
      destroy: function () {
        destroyed = true;
        stop();
        if (io) io.disconnect();
        if (ro) ro.disconnect();
        else window.removeEventListener('resize', resize);
      },
    };

    instances.push(api);
    return api;
  }

  function initApartmentDeckVelaris() {
    var host = document.getElementById('apartment-deck-velaris');
    if (!host) return null;
    return initVelaris(host, {
      bg: '#000000',
      colors: ['#F5D76E', '#E8C547', '#D4A017', '#000000'],
      speed: 2.0,
      grain: 0.3,
    });
  }

  window.initVelaris = initVelaris;
  window.destroyVelaris = destroyVelaris;
  window.initApartmentDeckVelaris = initApartmentDeckVelaris;
})();
