let lightboxPhotos = [];
let lightboxIndex = 0;

function openLightbox(photos, index) {
  lightboxPhotos = photos;
  lightboxIndex = index;
  updateLightbox();
  document.getElementById('lightbox').classList.add('active');
  updateBodyScrollLock();
}

function preloadLightboxIndex(index) {
  const src = lightboxPhotos[index];
  if (!src) return;
  const img = new Image();
  img.src = src;
}

function updateLightbox() {
  const imgEl = document.getElementById('lightbox-img');
  imgEl.src = lightboxPhotos[lightboxIndex];
  imgEl.decoding = 'async';
  document.getElementById('lightbox-counter').textContent = `${lightboxIndex + 1} / ${lightboxPhotos.length}`;
  preloadLightboxIndex((lightboxIndex + 1) % lightboxPhotos.length);
  preloadLightboxIndex((lightboxIndex - 1 + lightboxPhotos.length) % lightboxPhotos.length);
}

function lightboxNav(dir) {
  lightboxIndex = (lightboxIndex + dir + lightboxPhotos.length) % lightboxPhotos.length;
  updateLightbox();
}

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('active');
  updateBodyScrollLock();
}

function closeLightboxOnBg(e) {
  if (e.target === document.getElementById('lightbox')) closeLightbox();
}

document.addEventListener('keydown', e => {
  if (document.getElementById('lightbox').classList.contains('active')) {
    if (e.key === 'ArrowLeft') lightboxNav(-1);
    if (e.key === 'ArrowRight') lightboxNav(1);
    if (e.key === 'Escape') closeLightbox();
  }
});
