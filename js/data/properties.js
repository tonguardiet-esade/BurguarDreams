const PROP_I18N = {
  tag: {
    es:'Apartamento', ca:'Apartament', en:'Apartment', fr:'Appartement', de:'Wohnung', it:'Appartamento'
  },
  priceUnit: {
    es:'/mes', ca:'/mes', en:'/month', fr:'/mois', de:'/Monat', it:'/mese'
  },
  available_yes: {
    es:'Disponible ahora', ca:'Disponible ara', en:'Available now', fr:'Disponible maintenant', de:'Sofort verfügbar', it:'Disponibile ora'
  },
  spec_superficie: { es:'Superficie', ca:'Superfície', en:'Floor area', fr:'Surface', de:'Fläche', it:'Superficie' },
  spec_habitaciones:{ es:'Habitaciones', ca:'Habitacions', en:'Bedrooms', fr:'Chambres', de:'Schlafzimmer', it:'Camere' },
  spec_banos:      { es:'Baños', ca:'Banys', en:'Bathrooms', fr:'Salles de bain', de:'Badezimmer', it:'Bagni' },
  spec_planta:     { es:'Planta', ca:'Planta', en:'Floor', fr:'Étage', de:'Etage', it:'Piano' },
  spec_dorm:       { es:'dorm.', ca:'dorm.', en:'bed.', fr:'ch.', de:'Zi.', it:'cam.' },
  spec_bano:       { es:'baño', ca:'bany', en:'bath.', fr:'sdb.', de:'Bad', it:'bagno' },
};

// Disponible el DATE — prefix per language
const AVAIL_PREFIX = {
  es:'Disponible el ', ca:'Disponible el ', en:'Available from ', fr:'Disponible le ', de:'Verfügbar ab ', it:'Disponibile dal '
};

const PROP_DESCRIPTIONS = {
  1: {
    es:'Apartamento muy luminoso en pleno Eixample. Muy bien comunicado, con vistas a La Monumental y a 10 minutos de la Barceloneta.',
    ca:'Apartament molt lluminós al cor de l\'Eixample. Molt ben comunicat, amb vistes a La Monumental i a 10 minuts de la Barceloneta.',
    en:'Very bright apartment in the heart of the Eixample. Excellent transport links, views of La Monumental and 10 minutes from Barceloneta.',
    fr:'Appartement très lumineux au cœur de l\'Eixample. Très bien desservi, avec vue sur La Monumental et à 10 minutes de la Barceloneta.',
    de:'Sehr helle Wohnung im Herzen des Eixample. Beste Verkehrsanbindung, Blick auf La Monumental, 10 Minuten von der Barceloneta.',
    it:'Appartamento molto luminoso nel cuore dell\'Eixample. Ottimi collegamenti, vista su La Monumental e a 10 minuti dalla Barceloneta.',
  },
  2: {
    es:'Apartamento en pleno corazón del Eixample Izquierdo. Diseño muy moderno con acabados de alta calidad. Zona Premium con todos los servicios a pie de calle.',
    ca:'Apartament al cor de l\'Eixample Esquerre. Disseny molt modern amb acabats d\'alta qualitat. Zona Premium amb tots els serveis a peu de carrer.',
    en:'Apartment in the heart of the Left Eixample. Very modern design with high-quality finishes. Premium area with all services right at your door.',
    fr:'Appartement au cœur de l\'Eixample Gauche. Design très moderne avec des finitions haut de gamme. Zone Premium avec tous les services à pied de rue.',
    de:'Wohnung im Herzen des linken Eixample. Sehr modernes Design mit hochwertigen Oberflächen. Premium-Lage mit allen Dienstleistungen direkt vor der Tür.',
    it:'Appartamento nel cuore dell\'Eixample Sinistro. Design molto moderno con finiture di alta qualità. Zona Premium con tutti i servizi a portata di mano.',
  },
  3: {
    es:'Precioso piso muy luminoso con patio privado en Barcelona. Distribución ideal, con amplio salón, cocina independiente y habitaciones bien separadas. Comunidad tranquila.',
    ca:'Precioso pis molt lluminós amb pati privat a Barcelona. Distribució ideal, amb àmplia sala d\'estar, cuina independent i habitacions ben separades. Comunitat tranquil·la.',
    en:'Beautiful, very bright flat with private courtyard in Barcelona. Ideal layout with spacious living room, separate kitchen and well-divided bedrooms. Quiet building.',
    fr:'Bel appartement très lumineux avec patio privé à Barcelone. Distribution idéale avec grand salon, cuisine indépendante et chambres bien séparées. Immeuble calme.',
    de:'Wunderschöne, sehr helle Wohnung mit privatem Innenhof in Barcelona. Ideale Raumaufteilung mit großem Wohnzimmer, separater Küche und gut getrennten Schlafzimmern. Ruhiges Gebäude.',
    it:'Bellissimo appartamento molto luminoso con patio privato a Barcellona. Distribuzione ideale con ampio soggiorno, cucina separata e camere ben divise. Condominio tranquillo.',
  },
  4: {
    es:'Recién reformado y luminoso con 2 habitaciones con patio japonés exterior y cocina completamente equipada. Zona muy céntrica muy bien comunicada con metro, TRAM y Bus en el Distrito Financiero Francesc Macià de Barcelona.',
    ca:'Recentment reformat i lluminós amb 2 habitacions, pati japonès exterior i cuina completament equipada. Zona molt cèntrica amb metro, TRAM i Bus al Districte Financer Francesc Macià de Barcelona.',
    en:'Newly renovated and bright 2-bedroom apartment with Japanese exterior courtyard and fully equipped kitchen. Very central location with excellent metro, tram and bus links in Barcelona\'s Francesc Macià financial district.',
    fr:'Récemment rénové et lumineux, 2 chambres avec patio japonais extérieur et cuisine entièrement équipée. Très bien situé avec métro, tram et bus dans le quartier financier Francesc Macià de Barcelone.',
    de:'Frisch renovierte, helle 2-Zimmer-Wohnung mit japanischem Außenhof und vollausgestatteter Küche. Sehr zentrale Lage mit U-Bahn, Tram und Bus im Finanzdistrikt Francesc Macià in Barcelona.',
    it:'Recentemente ristrutturato e luminoso, 2 camere con patio giapponese esterno e cucina completamente attrezzata. Zona centralissima con metro, tram e bus nel distretto finanziario Francesc Macià di Barcellona.',
  },
};

// Availability date (the date part stays the same, only the prefix is translated)
const AVAIL_DATES = {
  1: '03/09/2027',
  2: '15/08/2027',
  3: '13/06/2027',
  4: '01/06/2027',
};

function parseAvailDate(dateStr) {
  if (!dateStr) return Infinity;
  const m = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return Infinity;
  return new Date(+m[3], +m[2] - 1, +m[1]).getTime();
}

function availabilitySortKey(p) {
  if (p.available) return -Infinity;
  return parseAvailDate(AVAIL_DATES[p.id]);
}

function getPropText(p, field) {
  const lang = currentLang;
  if (field === 'tag')       return PROP_I18N.tag[lang]       || PROP_I18N.tag.es;
  if (field === 'priceUnit') return PROP_I18N.priceUnit[lang] || PROP_I18N.priceUnit.es;
  if (field === 'description') return (PROP_DESCRIPTIONS[p.id] || {})[lang] || (PROP_DESCRIPTIONS[p.id] || {}).es || '';
  if (field === 'availableText') {
    if (p.available) return PROP_I18N.available_yes[lang] || PROP_I18N.available_yes.es;
    const prefix = AVAIL_PREFIX[lang] || AVAIL_PREFIX.es;
    return prefix + (AVAIL_DATES[p.id] || '');
  }
  return '';
}

function getSpecLabels() {
  const lang = currentLang;
  return {
    superficie:   PROP_I18N.spec_superficie[lang]    || PROP_I18N.spec_superficie.es,
    habitaciones: PROP_I18N.spec_habitaciones[lang]  || PROP_I18N.spec_habitaciones.es,
    banos:        PROP_I18N.spec_banos[lang]          || PROP_I18N.spec_banos.es,
    planta:       PROP_I18N.spec_planta[lang]         || PROP_I18N.spec_planta.es,
    dorm:         PROP_I18N.spec_dorm[lang]           || PROP_I18N.spec_dorm.es,
    bano:         PROP_I18N.spec_bano[lang]           || PROP_I18N.spec_bano.es,
  };
}

/* ─── PROPERTIES DATA ─── */
const properties = [
  {
    id: 1,
    slug: 'gran-via',
    city: 'Barcelona',
    street: 'Gran Via de les Corts Catalanes',
    tag: 'Apartamento', price: '', priceUnit: '/mes',
    available: false, availableText: 'Disponible el 03/09/2027',
    description: 'Apartamento muy luminoso en pleno Eixample. Muy bien comunicado, con vistas a La Monumental y a 10 minutos de la Barceloneta.',
    amenities: new Set(['amueblado','equipado','ac','calefaccion','wifi','tv','lavadora','secadora','tendedero','plancha','aspiradora','kit_limpieza','cafetera','microondas','nevera','horno','vitroceramica','tostadora','lavavajillas','secador_pelo','papel_wc','sabanas','toallas','ascensor','portero_auto']),
    specs: [
      { label: 'Superficie', value: '56', unit: 'm²' },
      { label: 'Habitaciones', value: '1', unit: 'dorm.' },
      { label: 'Baños', value: '1', unit: 'baño' },
      { label: 'Planta', value: '1ª', unit: '' }
    ],
    cardImage: './assets/images/properties/granvia/Cuina.jpg',
    mainImage: './assets/images/properties/granvia/Cuina.jpg',
    video: './assets/videos/GranViaVideo.mp4',
    floorPlan: './assets/images/properties/granvia/Plano.png',
    extraPhotos: [
      './assets/images/properties/granvia/Cuina.jpg','./assets/images/properties/granvia/Cuina2.jpg',
      './assets/images/properties/granvia/Cuina3.jpg','./assets/images/properties/granvia/Cuina4.jpg',
      './assets/images/properties/granvia/Cuina5.jpg','./assets/images/properties/granvia/Habitacio.jpg',
      './assets/images/properties/granvia/Habitacio2.jpg','./assets/images/properties/granvia/Menjador.jpg',
      './assets/images/properties/granvia/Menjador2.jpg','./assets/images/properties/granvia/Menjador3.jpg',
      './assets/images/properties/granvia/Menjador4.jpg','./assets/images/properties/granvia/Sofa.jpg',
      './assets/images/properties/granvia/Sofa2.jpg','./assets/images/properties/granvia/Carrer.jpg',
      './assets/images/properties/granvia/Carrer2.jpg','./assets/images/properties/granvia/Lavabo.jpg',
      './assets/images/properties/granvia/Lavabo2.jpg'
    ]
  },
  {
    id: 2,
    slug: 'valencia-eixample',
    city: 'Barcelona',
    street: 'Eixample c/ València',
    tag: 'Apartamento', price: '', priceUnit: '/mes',
    available: false, availableText: 'Disponible el 15/08/2027',
    description: 'Apartamento en pleno corazón del Eixample Izquierdo. Diseño muy moderno con acabados de alta calidad. Zona Premium con todos los servicios a pie de calle.',
    amenities: new Set(['amueblado','equipado','ac','calefaccion','wifi','tv','lavadora','secadora','tendedero','plancha','aspiradora','kit_limpieza','cafetera','microondas','nevera','horno','vitroceramica','tostadora','lavavajillas','secador_pelo','papel_wc','sabanas','toallas','sofa_cama','despacho','ascensor','portero_auto']),
    specs: [
      { label: 'Superficie', value: '55', unit: 'm²' },
      { label: 'Habitaciones', value: '1', unit: 'dorm.' },
      { label: 'Baños', value: '1', unit: 'baño' },
      { label: 'Planta', value: '1ª', unit: '' }
    ],
    cardImage: './assets/images/properties/valencia/Sofa4.jpg',
    mainImage: './assets/images/properties/valencia/Sofa4.jpg',
    video: './assets/videos/ValenciaVideo.mp4',
    floorPlan: './assets/images/properties/valencia/Plano.png',
    floorPlanPdf: './assets/images/properties/valencia/Plano.pdf',
    extraPhotos: [
      './assets/images/properties/valencia/Mejador.jpg','./assets/images/properties/valencia/Sofa.jpg',
      './assets/images/properties/valencia/Sofa2.jpg','./assets/images/properties/valencia/Sofa3.jpg',
      './assets/images/properties/valencia/Sofa4.jpg','./assets/images/properties/valencia/Cuina.jpg',
      './assets/images/properties/valencia/Cuina2.jpg','./assets/images/properties/valencia/Cuina3.jpg',
      './assets/images/properties/valencia/Cuina4.jpg','./assets/images/properties/valencia/Cuina5.jpg',
      './assets/images/properties/valencia/Cuina6.jpg','./assets/images/properties/valencia/Dormitori.jpg',
      './assets/images/properties/valencia/Dormitori2.jpg','./assets/images/properties/valencia/Dormitori3.jpg',
      './assets/images/properties/valencia/Dormitori4.jpg','./assets/images/properties/valencia/Dormitori5.jpg',
      './assets/images/properties/valencia/Lavabo.jpg','./assets/images/properties/valencia/Lavabo2.jpg',
      './assets/images/properties/valencia/Ducha.jpg','./assets/images/properties/valencia/Entrada.jpg',
      './assets/images/properties/valencia/Entrada2.jpg','./assets/images/properties/valencia/Edifici.jpg'
    ]
  },
  {
    id: 3,
    slug: 'can-bruixa',
    city: 'Barcelona',
    street: 'Les Corts Can Bruixa',
    tag: 'Apartamento', price: '', priceUnit: '/mes',
    available: false, availableText: 'Disponible el 13/06/2027',
    description: 'Precioso piso muy luminoso con patio privado en Barcelona. Distribución ideal, con amplio salón, cocina independiente y habitaciones bien separadas. Comunidad tranquila.',
    amenities: new Set(['amueblado','equipado','ac','calefaccion','wifi_600','tv','lavadora','secadora','tendedero','plancha','aspiradora','kit_limpieza','cafetera','microondas','nevera','horno','vitroceramica','tostadora','lavavajillas','secador_pelo','papel_wc','sabanas','toallas','patio_japones','despacho','ascensor','portero_auto']),
    specs: [
      { label: 'Superficie', value: '70', unit: 'm²' },
      { label: 'Habitaciones', value: '2', unit: '1 dorm. + 1 estudi' },
      { label: 'Baños', value: '1', unit: 'baño' },
      { label: 'Planta', value: '1ª', unit: '' }
    ],
    cardImage: './assets/images/properties/bruixa/Menjador6.jpg',
    mainImage: './assets/images/properties/bruixa/Menjador6.jpg',
    video: './assets/videos/CanBruixaVideo.mp4',
    floorPlan: './assets/images/properties/bruixa/Plano.png',
    extraPhotos: [
      './assets/images/properties/bruixa/Menjador.jpg','./assets/images/properties/bruixa/Menjador2.jpg',
      './assets/images/properties/bruixa/Menjador3.jpg','./assets/images/properties/bruixa/Menjador4.jpg',
      './assets/images/properties/bruixa/Menjador5.jpg','./assets/images/properties/bruixa/Menjador6.jpg',
      './assets/images/properties/bruixa/Sofa.jpg','./assets/images/properties/bruixa/Sofa2.jpg',
      './assets/images/properties/bruixa/Cuina.jpg',
      './assets/images/properties/bruixa/Menjador7.png','./assets/images/properties/bruixa/Menjador8.png',
      './assets/images/properties/bruixa/Menjador9.png',
      './assets/images/properties/bruixa/Dormitori2.jpg','./assets/images/properties/bruixa/Dormitori3.jpg',
      './assets/images/properties/bruixa/Lavabo.jpg','./assets/images/properties/bruixa/Lavabo2.jpg',
      './assets/images/properties/bruixa/Pati.jpg','./assets/images/properties/bruixa/Carrer.jpg',
      './assets/images/properties/bruixa/Escriptori.jpg','./assets/images/properties/bruixa/Edifici.jpg'
    ]
  },
  {
    id: 4,
    slug: 'urgell-francesc-macia',
    city: 'Barcelona',
    street: 'Francesc Macià — Comte Urgell',
    tag: 'Apartamento', price: '', priceUnit: '/mes',
    available: false, availableText: 'Disponible el 01/06/2027',
    description: 'Recién reformado y luminoso con 2 habitaciones con patio japonés exterior y cocina completamente equipada. Zona muy céntrica muy bien comunicada con metro, TRAM, Bus y en zona neurálgica del Distrito Financiero Francesc Macià de Barcelona.',
    amenities: new Set([
      'amueblado','equipado',
      'wifi','ac','calefaccion','tv',
      'lavadora','secadora','tendedero','aspiradora','plancha','kit_limpieza',
      'cafetera','lavavajillas','microondas','nevera','horno','vitroceramica','tostadora',
      'sabanas','toallas',
      'secador_pelo','papel_wc',
      'patio_japones',
      'ascensor','portero_auto','portero'
    ]),
    specs: [
      { label: 'Superficie', value: '80', unit: 'm²' },
      { label: 'Habitaciones', value: '2', unit: 'dorm.' },
      { label: 'Baños', value: '1', unit: 'baño' },
      { label: 'Planta', value: '-1', unit: '' }
    ],
    cardImage: './assets/images/properties/urgell/Sofa.jpg',
    mainImage: './assets/images/properties/urgell/Sofa.jpg',
    video: './assets/videos/UrgellVideo.mp4',
    floorPlan: './assets/images/properties/urgell/Plano.png',
    heroImagePosition: 'center center',
    extraPhotos: [
      './assets/images/properties/urgell/Sofa.jpg','./assets/images/properties/urgell/Sofa2.jpg',
      './assets/images/properties/urgell/Menjador.jpg','./assets/images/properties/urgell/Menjador2.jpg',
      './assets/images/properties/urgell/Pasadis.jpg','./assets/images/properties/urgell/Pasadis2.jpg',
      './assets/images/properties/urgell/Pasadis3.jpg','./assets/images/properties/urgell/Cuina.jpg',
      './assets/images/properties/urgell/Cuina2.jpg','./assets/images/properties/urgell/Cuina3.jpg',
      './assets/images/properties/urgell/Dormitori.jpg','./assets/images/properties/urgell/Dormitori2.jpg',
      './assets/images/properties/urgell/Dormitori3.jpg','./assets/images/properties/urgell/Dormitori4.jpg',
      './assets/images/properties/urgell/Entrada.jpg','./assets/images/properties/urgell/Lavabo.jpg',
      './assets/images/properties/urgell/Pati.jpg','./assets/images/properties/urgell/Pati2.jpg',
      './assets/images/properties/urgell/Carrer2.jpg','./assets/images/properties/urgell/Carrer.jpg',
      './assets/images/properties/urgell/Edifici2.jpg'
    ]
  }
];

properties.sort((a, b) => availabilitySortKey(a) - availabilitySortKey(b));
