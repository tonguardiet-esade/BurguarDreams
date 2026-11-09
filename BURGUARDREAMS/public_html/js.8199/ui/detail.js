// Keys that are mutually exclusive variants — only show the one the property has, hide the rest entirely
const HIDE_IF_ABSENT = new Set(['wifi', 'wifi_600']);
const DETAIL_GALLERY_EAGER = 4;

function shortPhotoTitle(alt, index, src) {
  const file = String(src || '').split('/').pop().split('?')[0];
  const base = file.replace(/\.[a-z]+$/i, '').replace(/\d+$/i, '');
  const roomMap = (typeof IMAGE_ROOM_ALTS !== 'undefined' && IMAGE_ROOM_ALTS[currentLang])
    || (typeof IMAGE_ROOM_ALTS !== 'undefined' && IMAGE_ROOM_ALTS.es)
    || null;
  if (roomMap && roomMap[base]) {
    const room = roomMap[base];
    return room.charAt(0).toUpperCase() + room.slice(1);
  }
  if (alt) {
    const cleaned = String(alt)
      .replace(/^[^,]+,\s*/u, '')
      .split(',')[0]
      .trim();
    if (cleaned && cleaned.length < 40) return cleaned;
  }
  const t = (typeof i18n !== 'undefined' && i18n[currentLang]) ? i18n[currentLang] : null;
  return ((t && t.detail_photo_n) || 'Foto {n}').replace('{n}', String(index + 1));
}

function renderAmenities(amenitySet) {
  return getAmenityGroups(currentLang).map((group, i) => {
    const items = group.items
      .filter(item => {
        if (HIDE_IF_ABSENT.has(item.key)) return amenitySet.has(item.key);
        return true;
      })
      .map(item => {
        const has = amenitySet.has(item.key);
        return `
        <li class="amenity-item ${has ? 'has' : 'has-not'}">
          <span class="amenity-icon">${has ? '✓' : '✕'}</span>
          <span>${item.label}</span>
        </li>`;
      }).join('');
    const side = i % 2 === 0 ? 'left' : 'right';
    return `
      <div class="amenity-group" data-reveal="${side}">
        <div class="amenity-group-title">${group.group}</div>
        <ul class="amenity-list">${items}</ul>
      </div>`;
  }).join('');
}

function renderSurroundings(groups) {
  if (!groups || !groups.length) return '';
  return groups.map((group, i) => {
    const items = (group.items || []).map(label => `
        <li class="amenity-item has">
          <span class="amenity-icon">✓</span>
          <span>${label}</span>
        </li>`).join('');
    const side = i % 2 === 0 ? 'left' : 'right';
    return `
      <div class="amenity-group" data-reveal="${side}">
        <div class="amenity-group-title">${group.group}</div>
        <ul class="amenity-list">${items}</ul>
      </div>`;
  }).join('');
}

function buildWhatsAppUrl(property) {
  const t = i18n[currentLang] || i18n.es;
  const text = property
    ? (t.wa_msg_property || t.wa_msg_general)
        .replace('{street}', property.street)
        .replace('{city}', property.city)
    : t.wa_msg_general;
  return `https://wa.me/34660688501?text=${encodeURIComponent(text)}`;
}

function buildCorporateWhatsAppUrl() {
  const t = i18n[currentLang] || i18n.es;
  const text = t.wa_msg_corporate || t.wa_msg_general;
  return `https://wa.me/34660688501?text=${encodeURIComponent(text)}`;
}

function updateWhatsAppLinks(property) {
  const url = buildWhatsAppUrl(property);
  const corpUrl = buildCorporateWhatsAppUrl();
  const sticky = document.getElementById('detail-sticky-wa');
  if (sticky) sticky.href = url;
  const contact = document.getElementById('contact-wa-link');
  if (contact) contact.href = url;
  const hero = document.getElementById('hero-cta-whatsapp');
  if (hero) hero.href = url;
  const headerWa = document.getElementById('wa-header-link');
  if (headerWa) headerWa.href = url;
  const corpWa = document.getElementById('corp-wa-link');
  if (corpWa) corpWa.href = corpUrl;
}

function pushPropertyUrl(p) {
  const url = new URL(propertyUrl(p));
  url.searchParams.set('lang', getSeoLang());
  if (usesPathPropertyRoutes()) {
    url.searchParams.delete('inmueble');
    url.searchParams.delete('p');
  } else {
    url.searchParams.set('inmueble', p.slug);
  }
  history.replaceState(null, '', url.pathname + url.search);
}

function initPropertyFromUrl() {
  const slug = resolvePropertySlugFromUrl();
  if (!slug) return;
  showDetail(slug, { skipUrlUpdate: true });
  const p = properties.find(x => x.slug === slug);
  if (p) pushPropertyUrl(p);
}

function showDetail(slug, options = {}) {
  const p = properties.find(x => x.slug === slug);
  if (!p) return;
  currentPropertyId = p.id;
  currentPropertySlug = slug;

  const detailView = document.getElementById('detail-view');
  if (typeof resetRevealIn === 'function') resetRevealIn(detailView);

  if (!options.skipUrlUpdate) pushPropertyUrl(p);

  const allPhotosArr = [p.mainImage, ...(p.extraPhotos || []), ...(p.floorPlan ? [p.floorPlan] : [])]
    .filter(Boolean)
    .map(src => absoluteAssetUrl(src));
  const heroAlt = propertyImageAlt(p, p.mainImage, 0);

  const wrap = document.getElementById('detail-hero-img-wrap');
  wrap.innerHTML = p.mainImage
    ? `<img src="${absoluteAssetUrl(p.mainImage)}" alt="${heroAlt}" class="detail-hero-img" fetchpriority="high" decoding="async" onclick="openLightbox(currentAllPhotos, 0)">`
    : `<div class="detail-hero-placeholder"><svg width="80" height="80" viewBox="0 0 80 80" fill="none" stroke="#C4B8A4" stroke-width="1.5"><rect x="10" y="30" width="60" height="40" rx="2"/><path d="M10 30L40 8l30 22"/><rect x="30" y="50" width="20" height="20"/></svg></div>`;
  const heroImg = wrap.querySelector('.detail-hero-img');
  if (heroImg && p.heroImagePosition) {
    heroImg.style.objectPosition = p.heroImagePosition;
  }

  window.currentAllPhotos = allPhotosArr;

  const sl = getSpecLabels();

  document.getElementById('d-tag').textContent = getPropText(p, 'tag');
  document.getElementById('d-title').textContent = getPropertyH1(p);
  document.getElementById('d-address').textContent = p.street;
  document.getElementById('d-price').innerHTML = p.price
    ? `${p.price}€<sub>${getPropText(p,'priceUnit')}</sub>`
    : `<span style="font-size:1.2rem;font-family:var(--font-body);font-weight:300;color:var(--warm-mid)">${(i18n[currentLang]||i18n.es).consult_price}</span>`;

  const badge = document.getElementById('d-availability');
  badge.textContent = getPropText(p, 'availableText');
  badge.className = 'availability-badge ' + (p.available ? 'available' : 'unavailable');

  const specsData = [
    { label: sl.superficie,   value: p.specs[0].value, unit: p.specs[0].unit },
    { label: sl.habitaciones, value: p.specs[1].value, unit: p.specs[1].unit || sl.dorm },
    { label: sl.banos,        value: p.specs[2].value, unit: sl.bano },
    { label: sl.planta,       value: p.specs[3].value, unit: p.specs[3].unit },
  ];
  document.getElementById('d-specs').innerHTML = specsData.map((s, i) => `
    <div class="spec-item" data-reveal="${i % 2 === 0 ? 'left' : 'right'}">
      <span class="spec-label">${s.label}</span>
      <span class="spec-value">${s.value} <span class="spec-unit">${s.unit}</span></span>
    </div>
  `).join('');

  document.getElementById('d-description').textContent = getPropText(p, 'description');

  document.getElementById('d-amenities').innerHTML = renderAmenities(p.amenities);

  const surroundingsSection = document.getElementById('surroundings-section');
  const surroundingsEl = document.getElementById('d-surroundings');
  const surroundingsTitle = document.getElementById('detail-surroundings-h3');
  const surroundingsGroups = typeof getPropertySurroundings === 'function'
    ? getPropertySurroundings(p.slug, currentLang)
    : null;
  if (surroundingsSection && surroundingsEl) {
    if (surroundingsGroups && surroundingsGroups.length) {
      const t = i18n[currentLang] || i18n.es;
      if (surroundingsTitle) surroundingsTitle.textContent = t.detail_surroundings || 'Entorno y servicios cercanos';
      surroundingsSection.hidden = false;
      surroundingsSection.removeAttribute('hidden');
      surroundingsEl.innerHTML = renderSurroundings(surroundingsGroups);
    } else {
      surroundingsSection.hidden = true;
      surroundingsEl.innerHTML = '';
    }
  }

  const videoWrap = document.getElementById('d-video');
  if (videoWrap) {
    if (typeof destroyVideoPlayer === 'function') destroyVideoPlayer(videoWrap);
    if (p.video) {
      const videoSrc = absoluteAssetUrl(p.video);
      const poster = p.mainImage ? absoluteAssetUrl(p.mainImage) : '';
      const t = (typeof i18n !== 'undefined' && i18n[currentLang]) ? i18n[currentLang] : null;
      const videoTitle = (t && t.detail_video) || 'Vídeo';
      videoWrap.hidden = false;
      videoWrap.removeAttribute('hidden');
      if (typeof initVideoPlayer === 'function') {
        initVideoPlayer(videoWrap, {
          src: videoSrc,
          poster,
          title: videoTitle,
          label: videoTitle,
        });
      } else {
        videoWrap.innerHTML = `
          <h3 class="detail-video-title">${videoTitle}</h3>
          <video class="vp-video" controls playsinline preload="metadata"${poster ? ` poster="${poster}"` : ''} aria-label="${videoTitle}">
            <source src="${videoSrc}" type="video/mp4">
          </video>`;
      }
    } else {
      videoWrap.hidden = true;
      videoWrap.innerHTML = '';
    }
  }

  const floorPlanWrap = document.getElementById('d-floorplan');
  const floorPlanImg = document.getElementById('d-floorplan-img');
  const floorPlanPdfWrap = document.getElementById('d-floorplan-pdf-wrap');
  const floorPlanPdfLink = document.getElementById('d-floorplan-pdf-link');
  if (floorPlanWrap && floorPlanImg) {
    if (p.floorPlan || p.floorPlanPdf) {
      const planIndex = p.floorPlan ? allPhotosArr.indexOf(absoluteAssetUrl(p.floorPlan)) : -1;
      floorPlanWrap.hidden = false;
      if (p.floorPlan) {
        const planAlt = propertyImageAlt(p, p.floorPlan, planIndex);
        floorPlanImg.innerHTML = `
          <img src="${absoluteAssetUrl(p.floorPlan)}" alt="${planAlt}" class="detail-floorplan-img" loading="lazy" decoding="async" style="cursor:zoom-in" onclick="openLightbox(currentAllPhotos, ${planIndex})">`;
      } else {
        floorPlanImg.innerHTML = '';
      }
      if (floorPlanPdfWrap && floorPlanPdfLink) {
        if (p.floorPlanPdf) {
          floorPlanPdfWrap.hidden = false;
          floorPlanPdfLink.href = absoluteAssetUrl(p.floorPlanPdf);
        } else {
          floorPlanPdfWrap.hidden = true;
          floorPlanPdfLink.removeAttribute('href');
        }
      }
    } else {
      floorPlanWrap.hidden = true;
      floorPlanImg.innerHTML = '';
      if (floorPlanPdfWrap && floorPlanPdfLink) {
        floorPlanPdfWrap.hidden = true;
        floorPlanPdfLink.removeAttribute('href');
      }
    }
  }

  const photos = (p.extraPhotos || []).filter(Boolean);
  const photoGrid = document.getElementById('d-photos');
  const galleryHint = document.getElementById('d-gallery-hint');
  const galleryHintGif = document.getElementById('detail-gallery-hint-gif');
  const galleryViewport = document.getElementById('d-gallery-viewport');
  disconnectLazyImages(photoGrid);
  if (typeof destroyCircularGallery === 'function') destroyCircularGallery(photoGrid);
  if (typeof destroyWorksWheel === 'function') destroyWorksWheel(photoGrid);
  if (typeof destroyPhotoStrip === 'function') destroyPhotoStrip(photoGrid);
  if (typeof destroyCoverflowGallery === 'function') destroyCoverflowGallery(photoGrid);

  if (photos.length) {
    const items = photos.map((src, i) => {
      const alt = propertyImageAlt(p, src, i + 1);
      const title = shortPhotoTitle(alt, i, src);
      return {
        text: title,
        title,
        image: absoluteAssetUrl(src),
        photoIndex: i + 1,
      };
    });
    photoGrid.className = 'coverflow-host';
    photoGrid.innerHTML = '';
    if (galleryViewport) galleryViewport.classList.add('is-gallery');
    if (galleryHint) galleryHint.hidden = false;
    if (galleryHintGif && typeof absoluteAssetUrl === 'function') {
      galleryHintGif.src = absoluteAssetUrl('assets/images/ui/tap-hint.gif');
    }
    if (typeof initCoverflowGallery === 'function') {
      initCoverflowGallery(photoGrid, {
        items,
        onSelect: (idx) => {
          if (typeof openLightbox === 'function') {
            openLightbox(window.currentAllPhotos, idx + 1);
          }
        },
      });
    }
  } else {
    if (galleryHint) galleryHint.hidden = true;
    if (galleryViewport) galleryViewport.classList.remove('is-gallery');
    photoGrid.className = 'detail-photos';
    photoGrid.innerHTML = [0,1,2].map((_, i) => `
      <div class="detail-photo" data-reveal="${i % 2 === 0 ? 'left' : 'right'}"><div class="detail-photo-placeholder">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="#C4B8A4" stroke-width="1.2">
          <rect x="5" y="8" width="30" height="24" rx="2"/><circle cx="15" cy="16" r="3"/>
          <path d="M5 26l8-6 6 5 5-4 11 7"/>
        </svg>
      </div></div>
    `).join('');
  }

  updateWhatsAppLinks(p);
  if (typeof updateModalTitle === 'function') updateModalTitle();
  applyPropertySeo(p, getSeoLang());

  document.getElementById('home-view').style.display = 'none';
  detailView.classList.add('active');
  if (options.fromTransition) {
    detailView.classList.add('pt-enter');
    window.setTimeout(function () {
      detailView.classList.remove('pt-enter');
    }, 700);
  }
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!options.skipScroll) {
    window.scrollTo({ top: 0, behavior: prefersReduced || options.fromTransition ? 'auto' : 'smooth' });
  } else {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }
  if (typeof scheduleScrollReveal === 'function') scheduleScrollReveal();
}

function showHome(options = {}) {
  if (typeof closeMobileNav === 'function') closeMobileNav();
  /* Transición animada al volver (salvo si ya venimos de ella) */
  if (
    !options.fromTransition &&
    !options.skipTransition &&
    typeof transitionToHome === 'function' &&
    !(typeof isPageTransitionBusy === 'function' && isPageTransitionBusy()) &&
    document.getElementById('detail-view') &&
    document.getElementById('detail-view').classList.contains('active')
  ) {
    return transitionToHome();
  }
  const photoGrid = document.getElementById('d-photos');
  if (photoGrid && typeof destroyCircularGallery === 'function') destroyCircularGallery(photoGrid);
  if (photoGrid && typeof destroyWorksWheel === 'function') destroyWorksWheel(photoGrid);
  if (photoGrid && typeof destroyPhotoStrip === 'function') destroyPhotoStrip(photoGrid);
  if (photoGrid && typeof destroyCoverflowGallery === 'function') destroyCoverflowGallery(photoGrid);
  const videoWrap = document.getElementById('d-video');
  if (videoWrap && typeof destroyVideoPlayer === 'function') destroyVideoPlayer(videoWrap);
  document.getElementById('detail-view').classList.remove('active', 'pt-enter');
  document.getElementById('home-view').style.display = '';
  currentPropertyId = null;
  currentPropertySlug = null;
  updateWhatsAppLinks(null);
  if (typeof updateModalTitle === 'function') updateModalTitle();
  const url = new URL(location.href);
  url.searchParams.delete('inmueble');
  url.searchParams.delete('p');
  if (/\/apartamento\/[^/]+\/?$/.test(url.pathname)) {
    const base = getCanonicalBase();
    const home = new URL('./', base.endsWith('/') ? base : base + '/');
    home.search = url.search;
    history.replaceState(null, '', home.pathname + home.search);
  } else {
    history.replaceState(null, '', url.pathname + url.search);
  }
  applyHomeSeo(getSeoLang());
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!options.skipScroll) {
    window.scrollTo({ top: 0, behavior: prefersReduced || options.fromTransition ? 'auto' : 'smooth' });
  }
  setActiveNav('hogar');
  if (typeof resumeApartmentDeck === 'function') resumeApartmentDeck();
  if (typeof scheduleScrollReveal === 'function') scheduleScrollReveal();
  return false;
}
