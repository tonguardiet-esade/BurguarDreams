/**
 * Video Player (vanilla) — port del video-player React (controles custom + animación).
 * Sin React/framer-motion/lucide: SVG inline + CSS transitions.
 * El vídeo conserva su proporción nativa (sin recorte).
 */
(function () {
  var instances = [];

  function formatTime(seconds) {
    if (!isFinite(seconds) || seconds < 0) return '0:00';
    var minutes = Math.floor(seconds / 60);
    var remaining = Math.floor(seconds % 60);
    return minutes + ':' + String(remaining).padStart(2, '0');
  }

  function iconPlay() {
    return '<svg class="vp-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>';
  }
  function iconPause() {
    return '<svg class="vp-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>';
  }
  function iconVolHigh() {
    return '<svg class="vp-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3 10v4h4l5 5V5L7 10H3zm13.5 2c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>';
  }
  function iconVolLow() {
    return '<svg class="vp-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3 10v4h4l5 5V5L7 10H3zm13.5 2c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>';
  }
  function iconVolMute() {
    return '<svg class="vp-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v4h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4 9.91 6.09 12 8.18V4z"/></svg>';
  }
  function iconFullscreen() {
    return '<svg class="vp-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>';
  }
  function iconFullscreenExit() {
    return '<svg class="vp-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>';
  }

  function destroyVideoPlayer(root) {
    for (var i = instances.length - 1; i >= 0; i--) {
      if (instances[i].root === root || !root) {
        if (instances[i].cleanup) instances[i].cleanup();
        instances.splice(i, 1);
      }
    }
  }

  function initVideoPlayer(root, options) {
    if (!root) return null;
    destroyVideoPlayer(root);

    var src = (options && options.src) || '';
    if (!src) return null;

    var poster = (options && options.poster) || '';
    var label = (options && options.label) || 'Vídeo';
    var title = (options && options.title) || label;

    root.classList.add('detail-video');
    root.innerHTML =
      '<h3 class="detail-video-title">' +
      title.replace(/</g, '&lt;') +
      '</h3>' +
      '<div class="vp-shell" tabindex="0">' +
      '<video class="vp-video" playsinline preload="metadata" aria-label="' +
      label.replace(/"/g, '&quot;') +
      '"' +
      (poster ? ' poster="' + poster.replace(/"/g, '&quot;') + '"' : '') +
      '>' +
      '<source src="' +
      src.replace(/"/g, '&quot;') +
      '" type="video/mp4">' +
      '</video>' +
      '<div class="vp-controls">' +
      '<div class="vp-progress-row">' +
      '<span class="vp-time vp-time-current">0:00</span>' +
      '<div class="vp-slider vp-progress" role="slider" aria-label="Progreso" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div class="vp-slider-fill"></div></div>' +
      '<span class="vp-time vp-time-duration">0:00</span>' +
      '</div>' +
      '<div class="vp-toolbar">' +
      '<div class="vp-toolbar-left">' +
      '<button type="button" class="vp-btn vp-play" aria-label="Reproducir">' +
      iconPlay() +
      '</button>' +
      '<div class="vp-volume">' +
      '<button type="button" class="vp-btn vp-mute" aria-label="Silenciar">' +
      iconVolHigh() +
      '</button>' +
      '<div class="vp-slider vp-vol-slider" role="slider" aria-label="Volumen" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100"><div class="vp-slider-fill"></div></div>' +
      '</div>' +
      '</div>' +
      '<div class="vp-speeds">' +
      [0.5, 1, 1.5, 2]
        .map(function (s) {
          return (
            '<button type="button" class="vp-btn vp-speed' +
            (s === 1 ? ' is-active' : '') +
            '" data-speed="' +
            s +
            '">' +
            s +
            'x</button>'
          );
        })
        .join('') +
      '<button type="button" class="vp-btn vp-fullscreen" aria-label="Pantalla completa">' +
      iconFullscreen() +
      '</button>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '</div>';

    var shell = root.querySelector('.vp-shell');
    var video = root.querySelector('.vp-video');
    var controls = root.querySelector('.vp-controls');
    var playBtn = root.querySelector('.vp-play');
    var muteBtn = root.querySelector('.vp-mute');
    var fsBtn = root.querySelector('.vp-fullscreen');
    var progressEl = root.querySelector('.vp-progress');
    var progressFill = progressEl.querySelector('.vp-slider-fill');
    var volEl = root.querySelector('.vp-vol-slider');
    var volFill = volEl.querySelector('.vp-slider-fill');
    var timeCurrent = root.querySelector('.vp-time-current');
    var timeDuration = root.querySelector('.vp-time-duration');
    var speedBtns = Array.prototype.slice.call(root.querySelectorAll('.vp-speed'));

    var isPlaying = false;
    var volume = 1;
    var isMuted = false;
    var playbackSpeed = 1;
    var showControls = false;
    var hideTimer = 0;
    var scrubbing = false;

    function setControlsVisible(on) {
      if (showControls === on) return;
      showControls = on;
      window.clearTimeout(hideTimer);
      if (on) {
        controls.classList.add('is-visible');
      } else {
        controls.classList.remove('is-visible');
      }
    }

    function onEnter() {
      setControlsVisible(true);
    }
    function onLeave() {
      /* Solo ocultar si está reproduciendo; si está en pausa, dejar controles */
      if (!video.paused) setControlsVisible(false);
    }

    function updatePlayUi() {
      playBtn.innerHTML = isPlaying ? iconPause() : iconPlay();
      playBtn.setAttribute('aria-label', isPlaying ? 'Pausar' : 'Reproducir');
      shell.classList.toggle('is-playing', isPlaying);
    }

    function updateMuteUi() {
      if (isMuted || volume === 0) muteBtn.innerHTML = iconVolMute();
      else if (volume > 0.5) muteBtn.innerHTML = iconVolHigh();
      else muteBtn.innerHTML = iconVolLow();
      muteBtn.setAttribute('aria-label', isMuted || volume === 0 ? 'Activar sonido' : 'Silenciar');
      volFill.style.width = (isMuted ? 0 : volume * 100) + '%';
      volEl.setAttribute('aria-valuenow', String(Math.round((isMuted ? 0 : volume) * 100)));
    }

    function togglePlay() {
      if (!video) return;
      if (video.paused) {
        var p = video.play();
        if (p && p.catch) p.catch(function () {});
      } else {
        video.pause();
      }
    }

    function onPlay() {
      isPlaying = true;
      updatePlayUi();
    }
    function onPause() {
      isPlaying = false;
      updatePlayUi();
    }

    function onTimeUpdate() {
      if (scrubbing || !video.duration) return;
      var pct = (video.currentTime / video.duration) * 100;
      if (!isFinite(pct)) pct = 0;
      progressFill.style.width = pct + '%';
      progressEl.setAttribute('aria-valuenow', String(Math.round(pct)));
      timeCurrent.textContent = formatTime(video.currentTime);
      timeDuration.textContent = formatTime(video.duration);
    }

    function onLoadedMeta() {
      timeDuration.textContent = formatTime(video.duration);
    }

    function seekFromEvent(e, el, apply) {
      var rect = el.getBoundingClientRect();
      var clientX = e.touches ? e.touches[0].clientX : e.clientX;
      var pct = ((clientX - rect.left) / rect.width) * 100;
      pct = Math.min(100, Math.max(0, pct));
      apply(pct);
    }

    function seekProgress(pct) {
      if (!video.duration || !isFinite(video.duration)) return;
      video.currentTime = (pct / 100) * video.duration;
      progressFill.style.width = pct + '%';
      progressEl.setAttribute('aria-valuenow', String(Math.round(pct)));
      timeCurrent.textContent = formatTime(video.currentTime);
    }

    function setVolumePct(pct) {
      volume = Math.min(100, Math.max(0, pct)) / 100;
      isMuted = volume === 0;
      video.volume = volume;
      video.muted = isMuted;
      updateMuteUi();
    }

    function toggleMute() {
      if (isMuted || volume === 0) {
        isMuted = false;
        volume = volume || 1;
        video.muted = false;
        video.volume = volume;
      } else {
        isMuted = true;
        video.muted = true;
      }
      updateMuteUi();
    }

    function setSpeed(speed) {
      playbackSpeed = speed;
      video.playbackRate = speed;
      speedBtns.forEach(function (btn) {
        btn.classList.toggle('is-active', Number(btn.getAttribute('data-speed')) === speed);
      });
    }

    function isFullscreen() {
      return (
        document.fullscreenElement === shell ||
        document.webkitFullscreenElement === shell
      );
    }

    function updateFsUi() {
      var on = isFullscreen();
      fsBtn.innerHTML = on ? iconFullscreenExit() : iconFullscreen();
      fsBtn.setAttribute('aria-label', on ? 'Salir de pantalla completa' : 'Pantalla completa');
      shell.classList.toggle('is-fullscreen', on);
    }

    function toggleFullscreen() {
      if (isFullscreen()) {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        return;
      }
      if (shell.requestFullscreen) {
        shell.requestFullscreen().catch(function () {});
      } else if (shell.webkitRequestFullscreen) {
        shell.webkitRequestFullscreen();
      } else if (video.requestFullscreen) {
        video.requestFullscreen().catch(function () {});
      } else if (video.webkitRequestFullscreen) {
        video.webkitRequestFullscreen();
      }
    }

    function bindSlider(el, onPct) {
      function start(e) {
        e.preventDefault();
        scrubbing = el === progressEl;
        seekFromEvent(e, el, onPct);
        window.addEventListener('mousemove', move);
        window.addEventListener('mouseup', end);
        window.addEventListener('touchmove', move, { passive: false });
        window.addEventListener('touchend', end);
      }
      function move(e) {
        e.preventDefault();
        seekFromEvent(e, el, onPct);
      }
      function end() {
        scrubbing = false;
        window.removeEventListener('mousemove', move);
        window.removeEventListener('mouseup', end);
        window.removeEventListener('touchmove', move);
        window.removeEventListener('touchend', end);
      }
      el.addEventListener('mousedown', start);
      el.addEventListener('touchstart', start, { passive: false });
    }

    playBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      togglePlay();
    });
    muteBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      toggleMute();
    });
    fsBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      toggleFullscreen();
    });
    video.addEventListener('click', togglePlay);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('loadedmetadata', onLoadedMeta);
    video.addEventListener('ended', onPause);

    speedBtns.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        setSpeed(Number(btn.getAttribute('data-speed')));
      });
    });

    bindSlider(progressEl, seekProgress);
    bindSlider(volEl, setVolumePct);

    shell.addEventListener('mouseenter', onEnter);
    shell.addEventListener('mouseleave', onLeave);
    shell.addEventListener('focusin', onEnter);
    shell.addEventListener('touchstart', function () {
      setControlsVisible(true);
    }, { passive: true });

    shell.addEventListener('keydown', function (e) {
      if (e.key === ' ' || e.key === 'k') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'm') {
        toggleMute();
      } else if (e.key === 'f') {
        e.preventDefault();
        toggleFullscreen();
      }
    });

    document.addEventListener('fullscreenchange', updateFsUi);
    document.addEventListener('webkitfullscreenchange', updateFsUi);

    /* Controles visibles al inicio */
    showControls = false;
    setControlsVisible(true);
    updatePlayUi();
    updateMuteUi();
    requestAnimationFrame(function () {
      shell.classList.add('is-ready');
    });

    var api = {
      root: root,
      cleanup: function () {
        window.clearTimeout(hideTimer);
        document.removeEventListener('fullscreenchange', updateFsUi);
        document.removeEventListener('webkitfullscreenchange', updateFsUi);
        video.pause();
      },
    };
    instances.push(api);
    return api;
  }

  window.initVideoPlayer = initVideoPlayer;
  window.destroyVideoPlayer = destroyVideoPlayer;
})();
