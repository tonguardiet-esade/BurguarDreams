const LAZY_IMAGE_MARGIN = '240px 0px';

function loadLazyImage(img) {
  const src = img.dataset.src;
  if (!src || img.dataset.loaded === 'true') return;
  img.src = src;
  img.removeAttribute('data-src');
  img.dataset.loaded = 'true';
}

function initLazyImages(root) {
  const scope = root || document;
  const images = scope.querySelectorAll('img[data-src]');
  if (!images.length) return;

  if (!('IntersectionObserver' in window)) {
    images.forEach(loadLazyImage);
    return;
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      loadLazyImage(entry.target);
      observer.unobserve(entry.target);
    });
  }, { rootMargin: LAZY_IMAGE_MARGIN });

  images.forEach(img => observer.observe(img));
}

function disconnectLazyImages(root) {
  if (!root) return;
  root.querySelectorAll('img[data-src]').forEach(img => {
    img.removeAttribute('data-src');
  });
}
