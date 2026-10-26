/* SEO / GEO: meta, canonical, hreflang, rutas de inmuebles, schema dinámico */
const SEO_LANGS = ['es', 'ca', 'en', 'fr', 'de', 'it'];
const OG_LOCALE = { es: 'es_ES', ca: 'ca_ES', en: 'en_US', fr: 'fr_FR', de: 'de_DE', it: 'it_IT' };

const PROP_SEO = {
  1: {
    es: { title: 'Apartamento amueblado Gran Via · Corporate housing Barcelona', desc: 'Piso amueblado en Gran Via (Eixample). Corporate housing flexible en Barcelona. Visita personalizada.' },
    ca: { title: 'Apartament moblat Gran Via · Corporate housing Barcelona', desc: 'Pis moblat a Gran Via (Eixample). Corporate housing flexible a Barcelona.' },
    en: { title: 'Furnished apartment Gran Via · Corporate housing Barcelona', desc: 'Furnished flat on Gran Via (Eixample). Flexible corporate housing in Barcelona.' },
    fr: { title: 'Appartement meublé Gran Via · Corporate housing Barcelone', desc: 'Appartement meublé Gran Via (Eixample). Corporate housing flexible à Barcelone.' },
    de: { title: 'Möblierte Wohnung Gran Via · Corporate Housing Barcelona', desc: 'Möblierte Wohnung an der Gran Via (Eixample). Flexibles Corporate Housing in Barcelona.' },
    it: { title: 'Appartamento arredato Gran Via · Corporate housing Barcellona', desc: 'Appartamento arredato in Gran Via (Eixample). Corporate housing flessibile a Barcellona.' },
  },
  2: {
    es: { title: 'Apartamento amueblado c/ València Eixample · Burguar Dreams', desc: 'Corporate housing en Eixample Izquierdo, c/ València. Amueblado, diseño moderno, sin permanencia.' },
    ca: { title: 'Apartament moblat c/ València Eixample · Burguar Dreams', desc: 'Corporate housing a l\'Eixample Esquerre. Moblat i sense permanència.' },
    en: { title: 'Furnished flat Valencia St Eixample · Burguar Dreams', desc: 'Corporate housing in Left Eixample. Furnished, modern, no long-term lease.' },
    fr: { title: 'Appartement meublé València Eixample · Burguar Dreams', desc: 'Corporate housing Eixample Gauche. Meublé, flexible.' },
    de: { title: 'Möblierte Wohnung València Eixample · Burguar Dreams', desc: 'Corporate Housing im linken Eixample. Möbliert und flexibel.' },
    it: { title: 'Appartamento arredato València Eixample · Burguar Dreams', desc: 'Corporate housing Eixample Sinistro. Arredato e flessibile.' },
  },
  3: {
    es: { title: 'Apartamento con patio Can Bruixa Les Corts · Barcelona', desc: 'Piso luminoso con patio privado en Les Corts. Alquiler amueblado de media duración en Barcelona.' },
    ca: { title: 'Apartament amb pati Can Bruixa Les Corts · Barcelona', desc: 'Pis lluminós amb pati privat a Les Corts. Lloguer moblat a Barcelona.' },
    en: { title: 'Flat with patio Can Bruixa Les Corts · Barcelona', desc: 'Bright apartment with private patio in Les Corts. Furnished medium-term rental.' },
    fr: { title: 'Appartement patio Can Bruixa Les Corts · Barcelone', desc: 'Appartement lumineux avec patio privé aux Corts. Location meublée.' },
    de: { title: 'Wohnung mit Patio Can Bruixa Les Corts · Barcelona', desc: 'Helle Wohnung mit privatem Patio in Les Corts. Möblierte Mittelfristmiete.' },
    it: { title: 'Appartamento con patio Can Bruixa Les Corts · Barcellona', desc: 'Appartamento luminoso con patio privato a Les Corts. Affitto arredato.' },
  },
  4: {
    es: { title: 'Apartamento 2 hab. Urgell · Distrito Francesc Macià', desc: 'Piso reformado de 2 habitaciones en Comte Urgell. Corporate housing cerca de Francesc Macià, Barcelona.' },
    ca: { title: 'Apartament 2 hab. Urgell · Francesc Macià Barcelona', desc: 'Pis reformat de 2 habitacions a Comte Urgell. Corporate housing zona Francesc Macià.' },
    en: { title: '2-bed flat Urgell · Francesc Macià district Barcelona', desc: 'Renovated 2-bedroom near Francesc Macià. Corporate housing, excellent transport.' },
    fr: { title: 'Appartement 2 ch. Urgell · Francesc Macià Barcelone', desc: 'Appartement rénové 2 chambres Comte Urgell. Corporate housing quartier financier.' },
    de: { title: '2-Zimmer-Wohnung Urgell · Francesc Macià Barcelona', desc: 'Renovierte 2-Zimmer-Wohnung Comte Urgell. Corporate Housing Finanzdistrikt.' },
    it: { title: 'Appartamento 2 camere Urgell · Francesc Macià Barcellona', desc: 'Appartamento ristrutturato 2 camere in Comte Urgell. Corporate housing.' },
  },
};

const HOME_SEO = {
  es: { title: 'Corporate housing Barcelona para empresas | Burguar Dreams', desc: 'Apartamentos amueblados en Eixample para trabajadores y equipos. Sin permanencia, gestión centralizada. Consulta disponibilidad.' },
  ca: { title: 'Corporate housing Barcelona per a empreses | Burguar Dreams', desc: 'Apartaments moblats a l\'Eixample per a treballadors i equips. Sense permanència, gestió centralitzada. Consulta disponibilitat.' },
  en: { title: 'Corporate housing Barcelona for companies | Burguar Dreams', desc: 'Furnished Eixample apartments for employees and teams. No long lease, centralised management. Check availability.' },
  fr: { title: 'Corporate housing Barcelone pour entreprises | Burguar Dreams', desc: 'Appartements meublés Eixample pour équipes. Sans engagement long, gestion centralisée. Vérifier la disponibilité.' },
  de: { title: 'Corporate Housing Barcelona für Unternehmen | Burguar Dreams', desc: 'Möblierte Eixample-Wohnungen für Teams. Ohne Langzeitbindung, zentrale Verwaltung. Verfügbarkeit anfragen.' },
  it: { title: 'Corporate housing Barcellona per aziende | Burguar Dreams', desc: 'Appartamenti arredati Eixample per team. Senza permanenza lunga, gestione centralizzata. Verifica disponibilità.' },
};

function getSeoLang() {
  return currentLang || 'es';
}

function getCanonicalBase() {
  if (window.SITE_BASE_URL) return window.SITE_BASE_URL;
  if (location.protocol === 'file:') {
    return location.href.replace(/[^/]*$/, '');
  }
  const parts = location.pathname.split('/').filter(Boolean);
  /* Misma lógica que <base>: /Repo/ en GitHub Pages o /public_html/ con servidor local */
  if (parts.length && parts[0] !== 'apartamento' && parts[0] !== 'index.html') {
    return `${location.origin}/${parts[0]}/`;
  }
  return `${location.origin}/`;
}

/** Rutas /apartamento/{slug}/ solo en hosting (GitHub Pages + 404.html). En file:// o localhost usamos ?inmueble= */
function usesPathPropertyRoutes() {
  if (location.protocol === 'file:') return false;
  if (/^localhost$|^127\.0\.0\.1$/i.test(location.hostname)) return false;
  return true;
}

function findPropertyBySlug(slug) {
  if (!slug) return null;
  return properties.find(p => p.slug === slug) || null;
}

function resolvePropertySlugFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get('inmueble') || params.get('p');
  if (raw) {
    const bySlug = findPropertyBySlug(raw);
    if (bySlug) return bySlug.slug;
  }
  const parts = location.pathname.split('/').filter(Boolean);
  const aptIdx = parts.indexOf('apartamento');
  if (aptIdx >= 0 && parts[aptIdx + 1]) {
    const byPath = findPropertyBySlug(parts[aptIdx + 1]);
    if (byPath) return byPath.slug;
  }
  return null;
}

function propertyUrl(propOrSlug) {
  const p = typeof propOrSlug === 'string'
    ? properties.find(x => x.slug === propOrSlug)
    : propOrSlug;
  if (!p) return getCanonicalBase();
  if (!usesPathPropertyRoutes()) {
    const base = getCanonicalBase();
    const entry = location.protocol === 'file:' ? 'index.html' : './';
    const url = new URL(entry, base.endsWith('/') ? base : `${base}/`);
    url.searchParams.set('inmueble', p.slug);
    return url.href.split('#')[0];
  }
  const path = `apartamento/${p.slug}/`;
  try {
    return new URL(path, getCanonicalBase()).href;
  } catch {
    return getCanonicalBase() + path;
  }
}

function getPropertySeo(p, lang) {
  const L = lang || getSeoLang();
  const pack = (PROP_SEO[p.id] || {})[L] || (PROP_SEO[p.id] || {}).es;
  return pack || { title: `${p.street} | Burguar Dreams`, desc: getPropText(p, 'description') };
}

function getPropertyH1(p) {
  return `${getPropText(p, 'tag')} — ${p.street}`;
}

function setMetaName(name, content) {
  let el = document.querySelector(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content || '');
}

function setMetaProperty(prop, content) {
  let el = document.querySelector(`meta[property="${prop}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', prop);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content || '');
}

function absoluteAssetUrl(relative) {
  if (!relative) return '';
  if (/^https?:\/\//i.test(relative)) return relative;
  const clean = String(relative).replace(/^\.\//, '');
  let url = getCanonicalBase() + clean;
  const ver = (typeof window !== 'undefined' && window.ASSET_VERSION) ? String(window.ASSET_VERSION) : '';
  if (ver) {
    url += (url.indexOf('?') >= 0 ? '&' : '?') + 'v=' + encodeURIComponent(ver);
  }
  return url;
}

/** Alias corto para plantillas: siempre con cache-bust. */
function assetUrl(relative) {
  return absoluteAssetUrl(relative);
}

function updateCanonical(href) {
  let link = document.getElementById('canonical-link');
  if (!link) {
    link = document.createElement('link');
    link.id = 'canonical-link';
    link.rel = 'canonical';
    document.head.appendChild(link);
  }
  link.href = href;
}

function syncHreflangLinks() {
  document.querySelectorAll('link[data-hreflang-dynamic]').forEach(el => el.remove());
  const slug = currentPropertySlug || resolvePropertySlugFromUrl();
  const p = slug ? properties.find(x => x.slug === slug) : null;
  const append = (hreflang, href) => {
    const link = document.createElement('link');
    link.rel = 'alternate';
    link.hreflang = hreflang;
    link.href = href;
    link.setAttribute('data-hreflang-dynamic', '1');
    document.head.appendChild(link);
  };
  SEO_LANGS.forEach(lang => {
    const url = new URL(p ? propertyUrl(p) : './', getCanonicalBase());
    url.searchParams.set('lang', lang);
    append(lang, url.href.split('#')[0]);
  });
  const defaultUrl = new URL(p ? propertyUrl(p) : './', getCanonicalBase()).href.split('#')[0];
  append('x-default', defaultUrl);
}

function updatePageMeta(opts) {
  const lang = opts.lang || getSeoLang();
  const title = opts.title || HOME_SEO.es.title;
  const description = opts.description || HOME_SEO.es.desc;
  const image = absoluteAssetUrl(opts.image || 'assets/images/properties/granvia/Cuina.jpg');
  const url = (opts.url || location.href).split('#')[0];

  document.title = title;
  setMetaName('description', description);
  setMetaProperty('og:type', opts.type || 'website');
  setMetaProperty('og:site_name', 'Burguar Dreams');
  setMetaProperty('og:title', title);
  setMetaProperty('og:description', description);
  setMetaProperty('og:url', url);
  setMetaProperty('og:image', image);
  setMetaProperty('og:locale', OG_LOCALE[lang] || 'es_ES');
  setMetaName('twitter:card', 'summary_large_image');
  setMetaName('twitter:title', title);
  setMetaName('twitter:description', description);
  setMetaName('twitter:image', image);
  updateCanonical(url);
  syncHreflangLinks(lang);
  updatePropertyJsonLd(opts.property || null, lang);
}

function applyHomeSeo(lang) {
  const L = lang || getSeoLang();
  const pack = HOME_SEO[L] || HOME_SEO.es;
  const homeUrl = new URL('./', getCanonicalBase()).href.split('#')[0];
  updatePageMeta({
    lang: L,
    title: pack.title,
    description: pack.desc,
    url: homeUrl,
    type: 'website',
    property: null,
  });
}

function formatPropertyPageTitle(title) {
  if (!title) return 'Burguar Dreams';
  return /Burguar\s*Dreams/i.test(title) ? title : `${title} | Burguar Dreams`;
}

function applyPropertySeo(p, lang) {
  const L = lang || getSeoLang();
  const pack = getPropertySeo(p, L);
  const pageUrl = propertyUrl(p).split('#')[0];
  updatePageMeta({
    lang: L,
    title: formatPropertyPageTitle(pack.title),
    description: pack.desc,
    image: p.mainImage || p.cardImage,
    url: pageUrl,
    type: 'website',
    property: p,
  });
}

function updatePropertyJsonLd(p, lang) {
  let el = document.getElementById('schema-property');
  if (!p) {
    if (el) el.remove();
    return;
  }
  if (!el) {
    el = document.createElement('script');
    el.type = 'application/ld+json';
    el.id = 'schema-property';
    document.head.appendChild(el);
  }
  const L = lang || 'es';
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Apartment',
    name: getPropertyH1(p),
    description: getPropText(p, 'description'),
    image: absoluteAssetUrl(p.mainImage || p.cardImage),
    url: propertyUrl(p),
    address: {
      '@type': 'PostalAddress',
      streetAddress: p.street,
      addressLocality: 'Barcelona',
      addressRegion: 'Cataluña',
      addressCountry: 'ES',
    },
    numberOfRooms: p.specs && p.specs[1] ? parseInt(p.specs[1].value, 10) || undefined : undefined,
    floorSize: p.specs && p.specs[0] ? { '@type': 'QuantitativeValue', value: p.specs[0].value, unitCode: 'MTK' } : undefined,
  };
  el.textContent = JSON.stringify(data);
}

const IMAGE_ROOM_ALTS = {
  es: { Cuina: 'cocina', Menjador: 'salón-comedor', Dormitori: 'dormitorio', Sofa: 'salón', Lavabo: 'baño', Pati: 'patio', Carrer: 'fachada', Edifici: 'edificio', Entrada: 'entrada', Escriptori: 'despacho', Pasadis: 'pasillo', Ducha: 'ducha', Plano: 'plano' },
  ca: { Cuina: 'cuina', Menjador: 'menjador', Dormitori: 'dormitori', Sofa: 'saló', Lavabo: 'lavabo', Pati: 'pati', Carrer: 'carrer', Edifici: 'edifici', Entrada: 'entrada', Escriptori: 'escriptori', Pasadis: 'passadís', Ducha: 'dutxa', Plano: 'pla' },
  en: { Cuina: 'kitchen', Menjador: 'dining room', Dormitori: 'bedroom', Sofa: 'living room', Lavabo: 'bathroom', Pati: 'patio', Carrer: 'street view', Edifici: 'building', Entrada: 'entrance', Escriptori: 'desk area', Pasadis: 'hallway', Ducha: 'shower', Plano: 'floor plan' },
};

function propertyImageAlt(p, src, index) {
  const lang = getSeoLang();
  const roomMap = IMAGE_ROOM_ALTS[lang] || IMAGE_ROOM_ALTS.es;
  const file = String(src || '').split('/').pop().split('?')[0];
  const base = file.replace(/\.[a-z]+$/i, '').replace(/\d+$/, '');
  const room = roomMap[base] || (index != null ? `foto ${index + 1}` : 'interior');
  return `${getPropText(p, 'tag')} ${room}, ${p.street}, Barcelona`;
}

function updateLangInUrl(lang) {
  const url = new URL(location.href);
  url.searchParams.set('lang', lang);
  history.replaceState(null, '', url.pathname + url.search);
}

function initLangFromUrl() {
  const lang = new URLSearchParams(location.search).get('lang');
  if (lang && i18n[lang]) {
    currentLang = lang;
    return lang;
  }
  return null;
}

function loadGoogleAnalytics() {
  const id = window.GA_MEASUREMENT_ID;
  if (!id || window.__gaLoaded) return;
  window.__gaLoaded = true;
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', id, { anonymize_ip: true });
}

function tryLoadAnalyticsFromConsent() {
  if (localStorage.getItem('burguar_cookie_consent') === 'accepted') loadGoogleAnalytics();
}
