/**
 * Circular Gallery (vanilla) — port clean-room de circular-gallery-2 (OGL).
 * Galería horizontal curva con scroll/drag. Sin React.
 * Depende de OGL vía import dinámico (CDN).
 */
(function () {
  var OGL_URL = 'https://cdn.jsdelivr.net/npm/ogl@1.0.6/+esm';
  var oglPromise = null;
  var instances = [];

  function loadOgl() {
    if (!oglPromise) {
      oglPromise = import(OGL_URL).catch(function (err) {
        oglPromise = null;
        console.error('[CircularGallery] No se pudo cargar OGL', err);
        throw err;
      });
    }
    return oglPromise;
  }

  function debounce(func, wait) {
    var timeout;
    return function () {
      var ctx = this;
      var args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(function () {
        func.apply(ctx, args);
      }, wait);
    };
  }

  function lerp(p1, p2, t) {
    return p1 + (p2 - p1) * t;
  }

  function autoBind(instance) {
    var proto = Object.getPrototypeOf(instance);
    Object.getOwnPropertyNames(proto).forEach(function (key) {
      if (key !== 'constructor' && typeof instance[key] === 'function') {
        instance[key] = instance[key].bind(instance);
      }
    });
  }

  function createTextTexture(gl, Texture, text, font, color) {
    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');
    context.font = font;
    var metrics = context.measureText(text);
    var textWidth = Math.ceil(metrics.width);
    var textHeight = Math.ceil(parseInt(font, 10) * 1.2) || 36;
    canvas.width = textWidth + 20;
    canvas.height = textHeight + 20;
    context.font = font;
    context.fillStyle = color;
    context.textBaseline = 'middle';
    context.textAlign = 'center';
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillText(text, canvas.width / 2, canvas.height / 2);
    var texture = new Texture(gl, { generateMipmaps: false });
    texture.image = canvas;
    return { texture: texture, width: canvas.width, height: canvas.height };
  }

  function buildApp(ogl, container, options) {
    var Renderer = ogl.Renderer;
    var Camera = ogl.Camera;
    var Transform = ogl.Transform;
    var Plane = ogl.Plane;
    var Mesh = ogl.Mesh;
    var Program = ogl.Program;
    var Texture = ogl.Texture;

    function Title(opts) {
      autoBind(this);
      this.gl = opts.gl;
      this.plane = opts.plane;
      this.text = opts.text;
      this.textColor = opts.textColor;
      this.font = opts.font;
      this.createMesh();
    }
    Title.prototype.createMesh = function () {
      var packed = createTextTexture(
        this.gl,
        Texture,
        this.text,
        this.font,
        this.textColor
      );
      var geometry = new Plane(this.gl);
      var program = new Program(this.gl, {
        vertex:
          'attribute vec3 position;attribute vec2 uv;uniform mat4 modelViewMatrix;uniform mat4 projectionMatrix;varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
        fragment:
          'precision highp float;uniform sampler2D tMap;varying vec2 vUv;void main(){vec4 color=texture2D(tMap,vUv);if(color.a<0.1)discard;gl_FragColor=color;}',
        uniforms: { tMap: { value: packed.texture } },
        transparent: true,
      });
      this.mesh = new Mesh(this.gl, { geometry: geometry, program: program });
      var aspect = packed.width / packed.height;
      var textHeight = this.plane.scale.y * 0.15;
      var textWidth = textHeight * aspect;
      this.mesh.scale.set(textWidth, textHeight, 1);
      this.mesh.position.y =
        -this.plane.scale.y * 0.5 - textHeight * 0.5 - 0.05;
      this.mesh.setParent(this.plane);
    };

    function Media(opts) {
      this.geometry = opts.geometry;
      this.gl = opts.gl;
      this.image = opts.image;
      this.index = opts.index;
      this.length = opts.length;
      this.renderer = opts.renderer;
      this.scene = opts.scene;
      this.screen = opts.screen;
      this.text = opts.text;
      this.viewport = opts.viewport;
      this.bend = opts.bend;
      this.textColor = opts.textColor;
      this.borderRadius = opts.borderRadius || 0;
      this.font = opts.font;
      this.extra = 0;
      this.widthTotal = 0;
      this.width = 0;
      this.x = 0;
      this.scale = 1;
      this.padding = 2;
      this.speed = 0;
      this.isBefore = false;
      this.isAfter = false;
      this.createShader();
      this.createMesh();
      this.createTitle();
      this.onResize();
    }

    Media.prototype.createShader = function () {
      var self = this;
      var gl = this.gl;
      var texture = new Texture(gl, {
        generateMipmaps: false,
        minFilter: gl.LINEAR,
        magFilter: gl.LINEAR,
        wrapS: gl.CLAMP_TO_EDGE,
        wrapT: gl.CLAMP_TO_EDGE,
        anisotropy: 16,
      });
      this.program = new Program(this.gl, {
        depthTest: false,
        depthWrite: false,
        vertex:
          'precision highp float;attribute vec3 position;attribute vec2 uv;uniform mat4 modelViewMatrix;uniform mat4 projectionMatrix;uniform float uTime;uniform float uSpeed;varying vec2 vUv;void main(){vUv=uv;vec3 p=position;p.z=(sin(p.x*4.0+uTime)*1.5+cos(p.y*2.0+uTime)*1.5)*(0.1+uSpeed*0.5);gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);}',
        fragment:
          'precision highp float;uniform vec2 uImageSizes;uniform vec2 uPlaneSizes;uniform sampler2D tMap;uniform float uBorderRadius;varying vec2 vUv;float roundedBoxSDF(vec2 p,vec2 b,float r){vec2 d=abs(p)-b;return length(max(d,vec2(0.0)))+min(max(d.x,d.y),0.0)-r;}void main(){vec2 ratio=vec2(min((uPlaneSizes.x/uPlaneSizes.y)/(uImageSizes.x/uImageSizes.y),1.0),min((uPlaneSizes.y/uPlaneSizes.x)/(uImageSizes.y/uImageSizes.x),1.0));vec2 uv=vec2(vUv.x*ratio.x+(1.0-ratio.x)*0.5,vUv.y*ratio.y+(1.0-ratio.y)*0.5);vec4 color=texture2D(tMap,uv);float d=roundedBoxSDF(vUv-0.5,vec2(0.5-uBorderRadius),uBorderRadius);float edgeSmooth=0.001;float alpha=1.0-smoothstep(-edgeSmooth,edgeSmooth,d);gl_FragColor=vec4(color.rgb,alpha);}',
        uniforms: {
          tMap: { value: texture },
          uPlaneSizes: { value: [0, 0] },
          uImageSizes: { value: [0, 0] },
          uSpeed: { value: 0 },
          uTime: { value: 100 * Math.random() },
          uBorderRadius: { value: this.borderRadius },
        },
        transparent: true,
      });
      var img = new Image();
      img.crossOrigin = 'anonymous';
      img.decoding = 'sync';
      img.src = this.image;
      img.onload = function () {
        texture.image = img;
        texture.needsUpdate = true;
        self.program.uniforms.uImageSizes.value = [
          img.naturalWidth,
          img.naturalHeight,
        ];
      };
    };

    Media.prototype.createMesh = function () {
      this.plane = new Mesh(this.gl, {
        geometry: this.geometry,
        program: this.program,
      });
      this.plane.setParent(this.scene);
    };

    Media.prototype.createTitle = function () {
      this.title = new Title({
        gl: this.gl,
        plane: this.plane,
        text: this.text,
        textColor: this.textColor,
        font: this.font,
      });
    };

    Media.prototype.update = function (scroll, direction) {
      this.plane.position.x = this.x - scroll.current - this.extra;
      var x = this.plane.position.x;
      var H = this.viewport.width / 2;
      if (this.bend === 0) {
        this.plane.position.y = 0;
        this.plane.rotation.z = 0;
      } else {
        var B_abs = Math.abs(this.bend);
        var R = (H * H + B_abs * B_abs) / (2 * B_abs);
        var effectiveX = Math.min(Math.abs(x), H);
        var arc = R - Math.sqrt(Math.max(0, R * R - effectiveX * effectiveX));
        if (this.bend > 0) {
          this.plane.position.y = -arc;
          this.plane.rotation.z = -Math.sign(x) * Math.asin(effectiveX / R);
        } else {
          this.plane.position.y = arc;
          this.plane.rotation.z = Math.sign(x) * Math.asin(effectiveX / R);
        }
      }
      this.speed = scroll.current - scroll.last;
      this.program.uniforms.uTime.value += 0.04;
      this.program.uniforms.uSpeed.value = this.speed;
      var planeOffset = this.plane.scale.x / 2;
      var viewportOffset = this.viewport.width / 2;
      this.isBefore = this.plane.position.x + planeOffset < -viewportOffset;
      this.isAfter = this.plane.position.x - planeOffset > viewportOffset;
      if (direction === 'right' && this.isBefore) {
        this.extra -= this.widthTotal;
        this.isBefore = this.isAfter = false;
      }
      if (direction === 'left' && this.isAfter) {
        this.extra += this.widthTotal;
        this.isBefore = this.isAfter = false;
      }
    };

    Media.prototype.onResize = function (sizes) {
      sizes = sizes || {};
      if (sizes.screen) this.screen = sizes.screen;
      if (sizes.viewport) this.viewport = sizes.viewport;
      this.scale = this.screen.height / 1500;
      this.plane.scale.y =
        (this.viewport.height * (1100 * this.scale)) / this.screen.height;
      this.plane.scale.x =
        (this.viewport.width * (860 * this.scale)) / this.screen.width;
      this.program.uniforms.uPlaneSizes.value = [
        this.plane.scale.x,
        this.plane.scale.y,
      ];
      this.padding = 2;
      this.width = this.plane.scale.x + this.padding;
      this.widthTotal = this.width * this.length;
      this.x = this.width * this.index;
      if (this.title && this.title.mesh) {
        var aspect =
          this.title.mesh.scale.x / Math.max(this.title.mesh.scale.y, 0.001);
        var textHeight = this.plane.scale.y * 0.15;
        this.title.mesh.scale.set(textHeight * aspect, textHeight, 1);
        this.title.mesh.position.y =
          -this.plane.scale.y * 0.5 - textHeight * 0.5 - 0.05;
      }
    };

    function App(el, opts) {
      this.container = el;
      this.scrollSpeed = opts.scrollSpeed;
      this.scroll = {
        ease: opts.scrollEase,
        current: 0,
        target: 0,
        last: 0,
        position: 0,
      };
      this.onCheckDebounce = debounce(this.onCheck.bind(this), 200);
      this.items = opts.items || [];
      this.onSelect = opts.onSelect || null;
      this.bend = opts.bend;
      this.textColor = opts.textColor;
      this.borderRadius = opts.borderRadius;
      this.font = opts.font;
      this.isDown = false;
      this.start = 0;
      this.dragMoved = false;
      this.raf = 0;
      this.destroyed = false;
      autoBind(this);
      this.createRenderer();
      this.createCamera();
      this.createScene();
      this.onResize();
      this.createGeometry();
      this.createMedias();
      this.update();
      this.addEventListeners();
    }

    App.prototype.createRenderer = function () {
      var dpr = window.devicePixelRatio || 1;
      this.renderer = new Renderer({
        alpha: true,
        antialias: true,
        dpr: Math.min(Math.max(dpr, 1), 3),
        powerPreference: 'high-performance',
      });
      this.gl = this.renderer.gl;
      this.gl.clearColor(0, 0, 0, 0);
      this.gl.canvas.style.display = 'block';
      this.gl.canvas.style.width = '100%';
      this.gl.canvas.style.height = '100%';
      this.container.appendChild(this.gl.canvas);
    };

    App.prototype.createCamera = function () {
      this.camera = new Camera(this.gl);
      this.camera.fov = 45;
      this.camera.position.z = 20;
    };

    App.prototype.createScene = function () {
      this.scene = new Transform();
    };

    App.prototype.createGeometry = function () {
      this.planeGeometry = new Plane(this.gl, {
        heightSegments: 50,
        widthSegments: 100,
      });
    };

    App.prototype.createMedias = function () {
      var galleryItems = this.items.length
        ? this.items
        : [{ image: '', text: '' }];
      /* Duplicar para loop continuo (como el original) */
      this.mediasImages = galleryItems.concat(galleryItems);
      var self = this;
      this.medias = this.mediasImages.map(function (data, index) {
        return new Media({
          geometry: self.planeGeometry,
          gl: self.gl,
          image: data.image,
          index: index,
          length: self.mediasImages.length,
          renderer: self.renderer,
          scene: self.scene,
          screen: self.screen,
          text: data.text,
          viewport: self.viewport,
          bend: self.bend,
          textColor: self.textColor,
          borderRadius: self.borderRadius,
          font: self.font,
        });
      });
    };

    App.prototype.onTouchDown = function (e) {
      this.isDown = true;
      this.dragMoved = false;
      this.scroll.position = this.scroll.current;
      this.start = e.touches ? e.touches[0].clientX : e.clientX;
    };

    App.prototype.onTouchMove = function (e) {
      if (!this.isDown) return;
      var x = e.touches ? e.touches[0].clientX : e.clientX;
      var distance = (this.start - x) * (this.scrollSpeed * 0.025);
      if (Math.abs(this.start - x) > 6) this.dragMoved = true;
      this.scroll.target = this.scroll.position + distance;
    };

    App.prototype.onTouchUp = function () {
      this.isDown = false;
      this.onCheck();
    };

    App.prototype.onWheel = function (e) {
      var dx = e.deltaX || 0;
      var dy = e.deltaY || 0;
      /* Rueda vertical = scroll de página; no bloquear */
      if (Math.abs(dy) >= Math.abs(dx)) return;
      e.preventDefault();
      this.scroll.target +=
        (dx > 0 ? this.scrollSpeed : -this.scrollSpeed) * 0.2;
      this.onCheckDebounce();
    };

    App.prototype.onCheck = function () {
      if (!this.medias || !this.medias[0]) return;
      var width = this.medias[0].width;
      if (!width) return;
      var itemIndex = Math.round(Math.abs(this.scroll.target) / width);
      var item = width * itemIndex;
      this.scroll.target = this.scroll.target < 0 ? -item : item;
    };

    App.prototype.onClick = function () {
      if (this.dragMoved || typeof this.onSelect !== 'function') return;
      if (!this.medias || !this.medias.length) return;
      var best = null;
      var bestDist = Infinity;
      for (var i = 0; i < this.medias.length; i++) {
        var m = this.medias[i];
        var d = Math.abs(m.plane.position.x);
        if (d < bestDist) {
          bestDist = d;
          best = m;
        }
      }
      if (!best) return;
      var realIndex = best.index % this.items.length;
      this.onSelect(realIndex, this.items[realIndex]);
    };

    App.prototype.onResize = function () {
      this.screen = {
        width: this.container.clientWidth || 1,
        height: this.container.clientHeight || 1,
      };
      this.renderer.setSize(this.screen.width, this.screen.height);
      this.camera.perspective({
        aspect: this.screen.width / this.screen.height,
      });
      var fov = (this.camera.fov * Math.PI) / 180;
      var height = 2 * Math.tan(fov / 2) * this.camera.position.z;
      var width = height * this.camera.aspect;
      this.viewport = { width: width, height: height };
      if (this.medias) {
        var self = this;
        this.medias.forEach(function (media) {
          media.onResize({ screen: self.screen, viewport: self.viewport });
        });
      }
    };

    App.prototype.update = function () {
      if (this.destroyed) return;
      this.scroll.current = lerp(
        this.scroll.current,
        this.scroll.target,
        this.scroll.ease
      );
      var direction =
        this.scroll.current > this.scroll.last ? 'right' : 'left';
      if (this.medias) {
        var self = this;
        this.medias.forEach(function (media) {
          media.update(self.scroll, direction);
        });
      }
      this.renderer.render({ scene: this.scene, camera: this.camera });
      this.scroll.last = this.scroll.current;
      this.raf = window.requestAnimationFrame(this.update);
    };

    App.prototype.addEventListeners = function () {
      this.boundOnResize = this.onResize;
      this.boundOnWheel = this.onWheel;
      this.boundOnTouchDown = this.onTouchDown;
      this.boundOnTouchMove = this.onTouchMove;
      this.boundOnTouchUp = this.onTouchUp;
      this.boundOnClick = this.onClick;
      window.addEventListener('resize', this.boundOnResize);
      this.container.addEventListener('wheel', this.boundOnWheel, {
        passive: false,
      });
      this.container.addEventListener('mousedown', this.boundOnTouchDown);
      window.addEventListener('mousemove', this.boundOnTouchMove);
      window.addEventListener('mouseup', this.boundOnTouchUp);
      this.container.addEventListener('touchstart', this.boundOnTouchDown, {
        passive: true,
      });
      window.addEventListener('touchmove', this.boundOnTouchMove, {
        passive: true,
      });
      window.addEventListener('touchend', this.boundOnTouchUp);
      this.container.addEventListener('click', this.boundOnClick);
    };

    App.prototype.destroy = function () {
      this.destroyed = true;
      window.cancelAnimationFrame(this.raf);
      window.removeEventListener('resize', this.boundOnResize);
      this.container.removeEventListener('wheel', this.boundOnWheel);
      this.container.removeEventListener('mousedown', this.boundOnTouchDown);
      window.removeEventListener('mousemove', this.boundOnTouchMove);
      window.removeEventListener('mouseup', this.boundOnTouchUp);
      this.container.removeEventListener('touchstart', this.boundOnTouchDown);
      window.removeEventListener('touchmove', this.boundOnTouchMove);
      window.removeEventListener('touchend', this.boundOnTouchUp);
      this.container.removeEventListener('click', this.boundOnClick);
      if (
        this.renderer &&
        this.renderer.gl &&
        this.renderer.gl.canvas &&
        this.renderer.gl.canvas.parentNode
      ) {
        this.renderer.gl.canvas.parentNode.removeChild(this.renderer.gl.canvas);
      }
    };

    return new App(container, options);
  }

  function destroyCircularGallery(root) {
    for (var i = instances.length - 1; i >= 0; i--) {
      if (instances[i].root === root || !root) {
        if (instances[i].app) instances[i].app.destroy();
        instances.splice(i, 1);
      }
    }
    if (root) {
      root.innerHTML = '';
      root.classList.remove('circular-gallery');
    }
  }

  function initCircularGallery(root, options) {
    if (!root) return null;
    destroyCircularGallery(root);

    var items = (options && options.items) || [];
    if (!items.length) return null;

    root.classList.add('circular-gallery');
    root.innerHTML = '';
    var stage = document.createElement('div');
    stage.className = 'circular-gallery-stage';
    root.appendChild(stage);

    var computed = getComputedStyle(root);
    var textColor = computed.color || '#1c1c1c';
    var fontWeight = computed.fontWeight || '600';
    var fontSize = '28px';
    var fontFamily =
      computed.getPropertyValue('--font-display').trim() ||
      computed.fontFamily ||
      'serif';
    var font = fontWeight + ' ' + fontSize + ' ' + fontFamily;

    var normalized = items.map(function (it) {
      return {
        image: it.image,
        text: it.text || it.title || '',
        photoIndex: it.photoIndex,
      };
    });

    var record = { root: root, app: null };
    instances.push(record);

    loadOgl()
      .then(function (ogl) {
        if (!root.isConnected) return;
        /* Si se destruyó mientras cargaba */
        var still = instances.indexOf(record) !== -1;
        if (!still) return;
        record.app = buildApp(ogl, stage, {
          items: normalized,
          bend: (options && options.bend) != null ? options.bend : 3,
          borderRadius:
            (options && options.borderRadius) != null
              ? options.borderRadius
              : 0.05,
          scrollSpeed:
            (options && options.scrollSpeed) != null
              ? options.scrollSpeed
              : 2,
          scrollEase:
            (options && options.scrollEase) != null
              ? options.scrollEase
              : 0.02,
          textColor: textColor,
          font: font,
          onSelect: options && options.onSelect,
        });
      })
      .catch(function () {
        stage.innerHTML =
          '<p class="circular-gallery-fallback">No se pudo cargar la galería 3D.</p>';
      });

    return {
      root: root,
      destroy: function () {
        destroyCircularGallery(root);
      },
    };
  }

  window.initCircularGallery = initCircularGallery;
  window.destroyCircularGallery = destroyCircularGallery;
})();
