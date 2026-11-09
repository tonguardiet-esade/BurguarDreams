/** Spotlight marrón radiante: posición en px, sin transición en el movimiento */
function initButtonGlow() {
  let activeBtn = null;

  function moveGlow(btn, clientX, clientY) {
    const rect = btn.getBoundingClientRect();
    btn.style.setProperty('--btn-x', `${clientX - rect.left}px`);
    btn.style.setProperty('--btn-y', `${clientY - rect.top}px`);
  }

  function setActive(btn) {
    if (activeBtn === btn) return;
    if (activeBtn) activeBtn.classList.remove('is-glow-active');
    activeBtn = btn;
    if (activeBtn) activeBtn.classList.add('is-glow-active');
  }

  function onPointerOverBtn(btn, clientX, clientY) {
    setActive(btn);
    moveGlow(btn, clientX, clientY);
  }

  document.body.addEventListener('mouseover', (e) => {
    const btn = e.target.closest('.btn-glow');
    if (!btn) return;
    onPointerOverBtn(btn, e.clientX, e.clientY);
  }, { passive: true });

  document.body.addEventListener('mousemove', (e) => {
    const btn = e.target.closest('.btn-glow');
    if (!btn) {
      if (activeBtn) {
        activeBtn.classList.remove('is-glow-active');
        activeBtn = null;
      }
      return;
    }
    onPointerOverBtn(btn, e.clientX, e.clientY);
  }, { passive: true });

  document.body.addEventListener('mouseout', (e) => {
    const btn = e.target.closest('.btn-glow');
    if (!btn || btn !== activeBtn) return;
    const to = e.relatedTarget;
    if (to && btn.contains(to)) return;
    btn.classList.remove('is-glow-active');
    activeBtn = null;
  });
}

initButtonGlow();
