function renderGrid() {
  const t = i18n[currentLang] || i18n.es;
  const grid = document.getElementById('properties-grid');
  if (!grid) return;

  grid.className = 'apartment-deck';
  grid.innerHTML = properties.map((p) => `
    <article class="card apartment-deck-card" data-slug="${p.slug}">
      <div class="card-img-wrap">
        ${p.cardImage
          ? `<img src="${absoluteAssetUrl(p.cardImage)}" alt="${propertyImageAlt(p, p.cardImage, 0)}" class="card-img" loading="lazy" decoding="async" width="1800" height="1200" draggable="false">`
          : `<div class="card-placeholder">
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none" stroke="#C4B8A4" stroke-width="1.5">
                <rect x="8" y="24" width="48" height="32" rx="2"/>
                <path d="M8 24L32 6l24 18"/>
                <rect x="24" y="40" width="16" height="16"/>
              </svg>
             </div>`
        }
      </div>
      <div class="card-info">
        <span class="card-tag">${getPropText(p,'tag')}</span>
        <div class="card-city">${p.city}</div>
        <div class="card-street">${p.street}</div>
        <div class="card-footer">
          <div class="card-price">${p.price ? p.price + '€<span>' + getPropText(p,'priceUnit') + '</span>' : '<span style="font-size:0.78rem;font-family:var(--font-body);color:var(--warm-mid)">' + t.consult_price + '</span>'}</div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:0.5rem">
            ${!p.available ? `<span class="card-availability">📅 ${getPropText(p,'availableText')}</span>` : ''}
            <button type="button" class="btn-saber" data-open-property="${p.slug}">
              <span class="btn-saber-text">${t.btn_more}</span>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M2.5 6.5h8M7 3.5l3 3-3 3"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </article>
  `).join('');

  const copyTitle = document.getElementById('apartment-deck-copy-title');
  const copyBody = document.getElementById('apartment-deck-copy-body');
  if (copyTitle) copyTitle.textContent = t.deck_copy_title || 'Elige tu próximo hogar';
  if (copyBody) copyBody.textContent = t.deck_copy_body || t.section_sub || '';

  const hint = document.getElementById('apartment-deck-hint');
  if (hint) hint.textContent = t.deck_hint || 'Elige un apartamento';

  if (typeof scheduleScrollReveal === 'function') scheduleScrollReveal();
  if (typeof initApartmentDeck === 'function') initApartmentDeck();
  if (typeof initSaberMasVariableFontHover === 'function') initSaberMasVariableFontHover();
}
