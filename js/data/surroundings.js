/**
 * Entorno y servicios cercanos por inmueble.
 * Cada ítem tiene traducciones; getPropertySurroundings(slug, lang) resuelve el idioma.
 */
const SURROUNDINGS_GROUP_I18N = {
  transport: {
    es: 'Transporte público',
    ca: 'Transport públic',
    en: 'Public transport',
    fr: 'Transports en commun',
    de: 'Öffentliche Verkehrsmittel',
    it: 'Trasporto pubblico',
  },
  business: {
    es: 'Entorno empresarial',
    ca: 'Entorn empresarial',
    en: 'Business area',
    fr: 'Environnement d\'affaires',
    de: 'Geschäftsumfeld',
    it: 'Area business',
  },
  dining: {
    es: 'Restauración y cafeterías',
    ca: 'Restauració i cafeteries',
    en: 'Dining & cafés',
    fr: 'Restauration et cafés',
    de: 'Gastronomie & Cafés',
    it: 'Ristorazione e caffè',
  },
  shopping: {
    es: 'Compras y servicios',
    ca: 'Compres i serveis',
    en: 'Shopping & services',
    fr: 'Commerces et services',
    de: 'Einkaufen & Services',
    it: 'Shopping e servizi',
  },
  health: {
    es: 'Salud y bienestar',
    ca: 'Salut i benestar',
    en: 'Health & wellness',
    fr: 'Santé et bien-être',
    de: 'Gesundheit & Wellness',
    it: 'Salute e benessere',
  },
  leisure_culture: {
    es: 'Ocio y cultura',
    ca: 'Oci i cultura',
    en: 'Leisure & culture',
    fr: 'Loisirs et culture',
    de: 'Freizeit & Kultur',
    it: 'Svago e cultura',
  },
  leisure_green: {
    es: 'Ocio y zonas verdes',
    ca: 'Oci i zones verdes',
    en: 'Leisure & green spaces',
    fr: 'Loisirs et espaces verts',
    de: 'Freizeit & Grünflächen',
    it: 'Svago e aree verdi',
  },
};

function tItem(es, ca, en, fr, de, it) {
  return { es, ca, en, fr, de, it };
}

const PROPERTY_SURROUNDINGS_RAW = {
  'gran-via': [
    {
      group: 'transport',
      items: [
        tItem('Metro Monumental (L2) · 3–5 min', 'Metro Monumental (L2) · 3–5 min', 'Monumental metro (L2) · 3–5 min walk', 'Métro Monumental (L2) · 3–5 min', 'U-Bahn Monumental (L2) · 3–5 Min.', 'Metro Monumental (L2) · 3–5 min'),
        tItem('Metro Glòries (L1) · 7–9 min', 'Metro Glòries (L1) · 7–9 min', 'Glòries metro (L1) · 7–9 min walk', 'Métro Glòries (L1) · 7–9 min', 'U-Bahn Glòries (L1) · 7–9 Min.', 'Metro Glòries (L1) · 7–9 min'),
        tItem('Metro Encants (L2) · 8–10 min', 'Metro Encants (L2) · 8–10 min', 'Encants metro (L2) · 8–10 min walk', 'Métro Encants (L2) · 8–10 min', 'U-Bahn Encants (L2) · 8–10 Min.', 'Metro Encants (L2) · 8–10 min'),
        tItem('Tranvía en Glòries (Trambesòs)', 'Tramvia a Glòries (Trambesòs)', 'Tram at Glòries (Trambesòs)', 'Tramway à Glòries (Trambesòs)', 'Straßenbahn an Glòries (Trambesòs)', 'Tram a Glòries (Trambesòs)'),
        tItem('Autobuses urbanos · H12 por Gran Via', 'Autobusos urbans · H12 per Gran Via', 'City buses · H12 along Gran Via', 'Bus urbains · H12 sur la Gran Via', 'Stadtbusse · H12 entlang der Gran Via', 'Autobus urbani · H12 sulla Gran Via'),
        tItem('Carriles bici y Bicing', 'Carrils bici i Bicing', 'Bike lanes and Bicing', 'Pistes cyclables et Bicing', 'Radwege und Bicing', 'Piste ciclabili e Bicing'),
        tItem('Acceso rápido a Diagonal, Aragó y C-31', 'Accés ràpid a Diagonal, Aragó i C-31', 'Quick access to Diagonal, Aragó and C-31', 'Accès rapide à Diagonal, Aragó et C-31', 'Schneller Zugang zu Diagonal, Aragó und C-31', 'Accesso rapido a Diagonal, Aragó e C-31'),
      ],
    },
    {
      group: 'business',
      items: [
        tItem('Distrito 22@ · empresas tech y startups', 'Districte 22@ · empreses tech i startups', '22@ district · tech firms and startups', 'District 22@ · entreprises tech et startups', '22@-Viertel · Tech-Firmen und Start-ups', 'Distretto 22@ · aziende tech e startup'),
        tItem('Torre Glòries y entorno corporativo', 'Torre Glòries i entorn corporatiu', 'Torre Glòries and corporate surroundings', 'Torre Glòries et environnement corporate', 'Torre Glòries und Unternehmensumfeld', 'Torre Glòries e area corporate'),
        tItem('Oficinas nuevas en Glòries, Diagonal y Poblenou', 'Oficines noves a Glòries, Diagonal i Poblenou', 'New offices in Glòries, Diagonal and Poblenou', 'Nouveaux bureaux à Glòries, Diagonal et Poblenou', 'Neue Büros in Glòries, Diagonal und Poblenou', 'Nuovi uffici a Glòries, Diagonal e Poblenou'),
        tItem('Monumento · oficinas en Gran Via 764', 'Monumento · oficines a Gran Via 764', 'Monumento · offices at Gran Via 764', 'Monumento · bureaux au Gran Via 764', 'Monumento · Büros an der Gran Via 764', 'Monumento · uffici in Gran Via 764'),
        tItem('Conexión a Passeig de Gràcia y Catalunya', 'Connexió a Passeig de Gràcia i Catalunya', 'Link to Passeig de Gràcia and Catalunya', 'Lien vers Passeig de Gràcia et Catalunya', 'Anbindung an Passeig de Gràcia und Catalunya', 'Collegamento a Passeig de Gràcia e Catalunya'),
        tItem('Coworkings en Eixample, Glòries y Poblenou', 'Coworkings a l\'Eixample, Glòries i Poblenou', 'Coworking spaces in Eixample, Glòries and Poblenou', 'Coworkings à l\'Eixample, Glòries et Poblenou', 'Coworking-Spaces in Eixample, Glòries und Poblenou', 'Coworking a Eixample, Glòries e Poblenou'),
      ],
    },
    {
      group: 'dining',
      items: [
        tItem('Cafeterías y restaurantes en Fort Pienc y Monumental', 'Cafeteries i restaurants a Fort Pienc i Monumental', 'Cafés and restaurants in Fort Pienc and Monumental', 'Cafés et restaurants à Fort Pienc et Monumental', 'Cafés und Restaurants in Fort Pienc und Monumental', 'Caffè e ristoranti a Fort Pienc e Monumental'),
        tItem('Oferta en Encants y Sagrada Família', 'Oferta a Encants i Sagrada Família', 'Options around Encants and Sagrada Família', 'Offre autour d\'Encants et Sagrada Família', 'Angebot bei Encants und Sagrada Família', 'Offerta vicino a Encants e Sagrada Família'),
        tItem('Restauración profesional en Glòries y 22@', 'Restauració professional a Glòries i 22@', 'Business-oriented dining in Glòries and 22@', 'Restauration pro à Glòries et 22@', 'Business-Gastronomie in Glòries und 22@', 'Ristorazione business a Glòries e 22@'),
        tItem('Desayuno, menú diario y cena a pie', 'Esmorzar, menú diari i sopar a peu', 'Breakfast, lunch menus and dinner within walking distance', 'Petit-déj., menus du jour et dîners à pied', 'Frühstück, Tagesmenüs und Abendessen zu Fuß', 'Colazione, menù del giorno e cena a piedi'),
        tItem('Westfield Glòries · restaurantes y cafeterías', 'Westfield Glòries · restaurants i cafeteries', 'Westfield Glòries · restaurants and cafés', 'Westfield Glòries · restaurants et cafés', 'Westfield Glòries · Restaurants und Cafés', 'Westfield Glòries · ristoranti e caffè'),
        tItem('Rambla del Poblenou en pocos minutos', 'Rambla del Poblenou en pocs minuts', 'Rambla del Poblenou within minutes', 'Rambla del Poblenou en quelques minutes', 'Rambla del Poblenou in wenigen Minuten', 'Rambla del Poblenou in pochi minuti'),
      ],
    },
    {
      group: 'shopping',
      items: [
        tItem('Westfield Glòries', 'Westfield Glòries', 'Westfield Glòries', 'Westfield Glòries', 'Westfield Glòries', 'Westfield Glòries'),
        tItem('Mercat dels Encants · Castillejos 158', 'Mercat dels Encants · Castillejos 158', 'Encants Market · Castillejos 158', 'Marché des Encants · Castillejos 158', 'Encants-Markt · Castillejos 158', 'Mercato Encants · Castillejos 158'),
        tItem('Supermercados, farmacias y comercios de proximidad', 'Supermercats, farmàcies i comerços de proximitat', 'Supermarkets, pharmacies and local shops', 'Supermarchés, pharmacies et commerces de proximité', 'Supermärkte, Apotheken und lokale Geschäfte', 'Supermercati, farmacie e negozi di vicinato'),
        tItem('Ejes València, Aragó y Sagrada Família', 'Eixos València, Aragó i Sagrada Família', 'València, Aragó and Sagrada Família shopping streets', 'Axes València, Aragó et Sagrada Família', 'Achsen València, Aragó und Sagrada Família', 'Assi València, Aragó e Sagrada Família'),
        tItem('Rambla del Poblenou a pocos minutos', 'Rambla del Poblenou a pocs minuts', 'Rambla del Poblenou a few minutes away', 'Rambla del Poblenou à quelques minutes', 'Rambla del Poblenou wenige Minuten entfernt', 'Rambla del Poblenou a pochi minuti'),
        tItem('Necesidades diarias resolubles a pie', 'Necessitats diàries resolubles a peu', 'Daily needs within walking distance', 'Besoins quotidiens à pied', 'Täglicher Bedarf zu Fuß erledigbar', 'Esigenze quotidiane a piedi'),
      ],
    },
    {
      group: 'health',
      items: [
        tItem('Farmacias y centros médicos cercanos', 'Farmàcies i centres mèdics propers', 'Nearby pharmacies and medical centres', 'Pharmacies et centres médicaux à proximité', 'Apotheken und Arztzentren in der Nähe', 'Farmacie e centri medici vicini'),
        tItem('Atención primaria en Fort Pienc y Sagrada Família', 'Atenció primària a Fort Pienc i Sagrada Família', 'Primary care in Fort Pienc and Sagrada Família', 'Soins primaires à Fort Pienc et Sagrada Família', 'Grundversorgung in Fort Pienc und Sagrada Família', 'Cure primarie a Fort Pienc e Sagrada Família'),
        tItem('Gimnasios, yoga y pilates en la zona', 'Gimnasos, ioga i pilates a la zona', 'Gyms, yoga and pilates nearby', 'Salles de sport, yoga et pilates dans le quartier', 'Fitnessstudios, Yoga und Pilates in der Nähe', 'Palestre, yoga e pilates in zona'),
        tItem('Parque de les Glòries', 'Parc de les Glòries', 'Parc de les Glòries', 'Parc de les Glòries', 'Parc de les Glòries', 'Parc de les Glòries'),
        tItem('Acceso a playas en bici o transporte público', 'Accés a les platges en bici o transport públic', 'Beach access by bike or public transport', 'Accès aux plages à vélo ou en transports', 'Strandzugang per Rad oder ÖPNV', 'Accesso alle spiagge in bici o mezzi pubblici'),
      ],
    },
    {
      group: 'leisure_culture',
      items: [
        tItem('Plaza de toros Monumental · al lado', 'Plaça de toros Monumental · al costat', 'Monumental bullring · next door', 'Arènes Monumental · à côté', 'Stierkampfarena Monumental · direkt daneben', 'Plaza de toros Monumental · accanto'),
        tItem('Sagrada Família · 12–15 min andando', 'Sagrada Família · 12–15 min a peu', 'Sagrada Família · 12–15 min walk', 'Sagrada Família · 12–15 min à pied', 'Sagrada Família · 12–15 Min. zu Fuß', 'Sagrada Família · 12–15 min a piedi'),
        tItem('Disseny Hub Barcelona (Glòries)', 'Disseny Hub Barcelona (Glòries)', 'Disseny Hub Barcelona (Glòries)', 'Disseny Hub Barcelona (Glòries)', 'Disseny Hub Barcelona (Glòries)', 'Disseny Hub Barcelona (Glòries)'),
        tItem('Mirador Torre Glòries', 'Mirador Torre Glòries', 'Torre Glòries viewpoint', 'Belvédère Torre Glòries', 'Aussichtspunkt Torre Glòries', 'Belvedere Torre Glòries'),
        tItem('L’Auditori y Teatre Nacional · 10–15 min', 'L’Auditori i Teatre Nacional · 10–15 min', 'L’Auditori and National Theatre · 10–15 min', 'L’Auditori et Théâtre National · 10–15 min', 'L’Auditori und Nationaltheater · 10–15 Min.', 'L’Auditori e Teatro Nazionale · 10–15 min'),
        tItem('Mercat dels Encants', 'Mercat dels Encants', 'Encants Market', 'Marché des Encants', 'Encants-Markt', 'Mercato Encants'),
        tItem('Parque Glòries, Poblenou y playas', 'Parc Glòries, Poblenou i platges', 'Glòries park, Poblenou and beaches', 'Parc Glòries, Poblenou et plages', 'Glòries-Park, Poblenou und Strände', 'Parco Glòries, Poblenou e spiagge'),
        tItem('Arc de Triomf y centro histórico', 'Arc de Triomf i centre històric', 'Arc de Triomf and historic centre', 'Arc de Triomphe et centre historique', 'Arc de Triomf und historisches Zentrum', 'Arc de Triomf e centro storico'),
      ],
    },
  ],

  'urgell-francesc-macia': [
    {
      group: 'transport',
      items: [
        tItem('TRAM', 'TRAM', 'TRAM', 'TRAM', 'TRAM', 'TRAM'),
        tItem('Metro Hospital Clínic', 'Metro Hospital Clínic', 'Hospital Clínic metro', 'Métro Hospital Clínic', 'U-Bahn Hospital Clínic', 'Metro Hospital Clínic'),
        tItem('Metro Entença', 'Metro Entença', 'Entença metro', 'Métro Entença', 'U-Bahn Entença', 'Metro Entença'),
        tItem('Red de autobuses urbanos', 'Xarxa d\'autobusos urbans', 'City bus network', 'Réseau de bus urbains', 'Stadtbusnetz', 'Rete di autobus urbani'),
        tItem('Acceso directo a Avenida Diagonal', 'Accés directe a l\'Avinguda Diagonal', 'Direct access to Avinguda Diagonal', 'Accès direct à l\'Avenida Diagonal', 'Direkter Zugang zur Avenida Diagonal', 'Accesso diretto all\'Avenida Diagonal'),
        tItem('Conexión rápida con Estación de Sants', 'Connexió ràpida amb l\'Estació de Sants', 'Quick link to Sants Station', 'Lien rapide avec la gare de Sants', 'Schnelle Verbindung zum Bahnhof Sants', 'Collegamento rapido con la stazione di Sants'),
        tItem('Fácil acceso al Aeropuerto de Barcelona', 'Fàcil accés a l\'Aeroport de Barcelona', 'Easy access to Barcelona Airport', 'Accès facile à l\'aéroport de Barcelone', 'Einfacher Zugang zum Flughafen Barcelona', 'Facile accesso all\'aeroporto di Barcellona'),
      ],
    },
    {
      group: 'business',
      items: [
        tItem('Oficinas corporativas', 'Oficines corporatives', 'Corporate offices', 'Bureaux d\'entreprise', 'Unternehmensbüros', 'Uffici corporate'),
        tItem('Consultoras internacionales', 'Consultores internacionals', 'International consultancies', 'Cabinets de conseil internationaux', 'Internationale Beratungen', 'Società di consulenza internazionali'),
        tItem('Centros de negocios', 'Centres de negocis', 'Business centres', 'Centres d\'affaires', 'Business-Center', 'Centri business'),
        tItem('Coworkings', 'Coworkings', 'Coworking spaces', 'Coworkings', 'Coworking-Spaces', 'Coworking'),
        tItem('Clínicas privadas', 'Clíniques privades', 'Private clinics', 'Cliniques privées', 'Privatkliniken', 'Cliniche private'),
        tItem('Despachos profesionales', 'Despatxos professionals', 'Professional offices', 'Cabinets professionnels', 'Anwalts- und Praxisräume', 'Studi professionali'),
      ],
    },
    {
      group: 'dining',
      items: [
        tItem('Restaurantes mediterráneos', 'Restaurants mediterranis', 'Mediterranean restaurants', 'Restaurants méditerranéens', 'Mediterrane Restaurants', 'Ristoranti mediterranei'),
        tItem('Restaurantes internacionales', 'Restaurants internacionals', 'International restaurants', 'Restaurants internationaux', 'Internationale Restaurants', 'Ristoranti internazionali'),
        tItem('Cafeterías de especialidad', 'Cafeteries d\'especialitat', 'Specialty coffee shops', 'Cafés de spécialité', 'Specialty-Cafés', 'Caffè specialty'),
        tItem('Panaderías artesanas', 'Fleques artesanes', 'Artisan bakeries', 'Boulangeries artisanales', 'Handwerksbäckereien', 'Panifici artigianali'),
        tItem('Opciones healthy', 'Opcions healthy', 'Healthy options', 'Options healthy', 'Gesunde Optionen', 'Opzioni healthy'),
        tItem('Servicios de delivery', 'Serveis de delivery', 'Delivery services', 'Services de livraison', 'Lieferdienste', 'Servizi di delivery'),
      ],
    },
    {
      group: 'shopping',
      items: [
        tItem('Mercadona', 'Mercadona', 'Mercadona', 'Mercadona', 'Mercadona', 'Mercadona'),
        tItem('Carrefour Express', 'Carrefour Express', 'Carrefour Express', 'Carrefour Express', 'Carrefour Express', 'Carrefour Express'),
        tItem('Condis', 'Condis', 'Condis', 'Condis', 'Condis', 'Condis'),
        tItem('Caprabo', 'Caprabo', 'Caprabo', 'Caprabo', 'Caprabo', 'Caprabo'),
        tItem('Aldi', 'Aldi', 'Aldi', 'Aldi', 'Aldi', 'Aldi'),
        tItem('Lidl', 'Lidl', 'Lidl', 'Lidl', 'Lidl', 'Lidl'),
        tItem('Farmacias', 'Farmàcies', 'Pharmacies', 'Pharmacies', 'Apotheken', 'Farmacie'),
        tItem('Gimnasios', 'Gimnasos', 'Gyms', 'Salles de sport', 'Fitnessstudios', 'Palestre'),
        tItem('Lavanderías', 'Bugaderies', 'Laundries', 'Laveries', 'Wäschereien', 'Lavanderie'),
        tItem('Bancos', 'Bancs', 'Banks', 'Banques', 'Banken', 'Banche'),
        tItem('Comercios de proximidad', 'Comerços de proximitat', 'Local shops', 'Commerces de proximité', 'Lokale Geschäfte', 'Negozi di vicinato'),
      ],
    },
    {
      group: 'health',
      items: [
        tItem('Hospital Clínic', 'Hospital Clínic', 'Hospital Clínic', 'Hospital Clínic', 'Hospital Clínic', 'Hospital Clínic'),
        tItem('Clínicas privadas', 'Clíniques privades', 'Private clinics', 'Cliniques privées', 'Privatkliniken', 'Cliniche private'),
        tItem('Centros médicos especializados', 'Centres mèdics especialitzats', 'Specialist medical centres', 'Centres médicaux spécialisés', 'Fachmedizinische Zentren', 'Centri medici specialistici'),
        tItem('Centros de fisioterapia', 'Centres de fisioteràpia', 'Physiotherapy centres', 'Centres de physiothérapie', 'Physiotherapiezentren', 'Centri di fisioterapia'),
        tItem('Farmacias de guardia', 'Farmàcies de guàrdia', 'On-duty pharmacies', 'Pharmacies de garde', 'Notapotheken', 'Farmacie di turno'),
      ],
    },
    {
      group: 'leisure_green',
      items: [
        tItem('Jardines de Francesc Macià', 'Jardins de Francesc Macià', 'Francesc Macià Gardens', 'Jardins de Francesc Macià', 'Francesc-Macià-Gärten', 'Giardini Francesc Macià'),
        tItem('Turó Park', 'Turó Park', 'Turó Park', 'Turó Park', 'Turó Park', 'Turó Park'),
        tItem('Avenida Diagonal', 'Avinguda Diagonal', 'Avinguda Diagonal', 'Avenida Diagonal', 'Avenida Diagonal', 'Avenida Diagonal'),
        tItem('Centro Comercial L\'Illa Diagonal', 'Centre Comercial L\'Illa Diagonal', 'L\'Illa Diagonal shopping centre', 'Centre commercial L\'Illa Diagonal', 'Einkaufszentrum L\'Illa Diagonal', 'Centro commerciale L\'Illa Diagonal'),
      ],
    },
  ],

  'can-bruixa': [
    {
      group: 'transport',
      items: [
        tItem('Metro Plaça del Centre', 'Metro Plaça del Centre', 'Plaça del Centre metro', 'Métro Plaça del Centre', 'U-Bahn Plaça del Centre', 'Metro Plaça del Centre'),
        tItem('Metro Les Corts', 'Metro Les Corts', 'Les Corts metro', 'Métro Les Corts', 'U-Bahn Les Corts', 'Metro Les Corts'),
        tItem('Metro Sants Estació', 'Metro Sants Estació', 'Sants Estació metro', 'Métro Sants Estació', 'U-Bahn Sants Estació', 'Metro Sants Estació'),
        tItem('Estación de Sants', 'Estació de Sants', 'Sants Station', 'Gare de Sants', 'Bahnhof Sants', 'Stazione di Sants'),
        tItem('Red de autobuses urbanos', 'Xarxa d\'autobusos urbans', 'City bus network', 'Réseau de bus urbains', 'Stadtbusnetz', 'Rete di autobus urbani'),
        tItem('Acceso rápido a Diagonal', 'Accés ràpid a Diagonal', 'Quick access to Diagonal', 'Accès rapide à Diagonal', 'Schneller Zugang zur Diagonal', 'Accesso rapido a Diagonal'),
        tItem('Acceso rápido al aeropuerto', 'Accés ràpid a l\'aeroport', 'Quick access to the airport', 'Accès rapide à l\'aéroport', 'Schneller Zugang zum Flughafen', 'Accesso rapido all\'aeroporto'),
      ],
    },
    {
      group: 'business',
      items: [
        tItem('Distrito financiero de Les Corts', 'Districte financer de Les Corts', 'Les Corts financial district', 'Quartier financier de Les Corts', 'Finanzviertel Les Corts', 'Distretto finanziario di Les Corts'),
        tItem('Oficinas corporativas', 'Oficines corporatives', 'Corporate offices', 'Bureaux d\'entreprise', 'Unternehmensbüros', 'Uffici corporate'),
        tItem('Consultoras', 'Consultores', 'Consultancies', 'Cabinets de conseil', 'Beratungsunternehmen', 'Società di consulenza'),
        tItem('Centros médicos', 'Centres mèdics', 'Medical centres', 'Centres médicaux', 'Medizinische Zentren', 'Centri medici'),
        tItem('Coworkings', 'Coworkings', 'Coworking spaces', 'Coworkings', 'Coworking-Spaces', 'Coworking'),
        tItem('Empresas tecnológicas', 'Empreses tecnològiques', 'Tech companies', 'Entreprises technologiques', 'Technologieunternehmen', 'Aziende tecnologiche'),
      ],
    },
    {
      group: 'dining',
      items: [
        tItem('Restaurantes mediterráneos', 'Restaurants mediterranis', 'Mediterranean restaurants', 'Restaurants méditerranéens', 'Mediterrane Restaurants', 'Ristoranti mediterranei'),
        tItem('Restaurantes internacionales', 'Restaurants internacionals', 'International restaurants', 'Restaurants internationaux', 'Internationale Restaurants', 'Ristoranti internazionali'),
        tItem('Cafeterías de especialidad', 'Cafeteries d\'especialitat', 'Specialty coffee shops', 'Cafés de spécialité', 'Specialty-Cafés', 'Caffè specialty'),
        tItem('Panaderías artesanas', 'Fleques artesanes', 'Artisan bakeries', 'Boulangeries artisanales', 'Handwerksbäckereien', 'Panifici artigianali'),
        tItem('Servicios de delivery', 'Serveis de delivery', 'Delivery services', 'Services de livraison', 'Lieferdienste', 'Servizi di delivery'),
      ],
    },
    {
      group: 'shopping',
      items: [
        tItem('Lidl', 'Lidl', 'Lidl', 'Lidl', 'Lidl', 'Lidl'),
        tItem('Mercadona', 'Mercadona', 'Mercadona', 'Mercadona', 'Mercadona', 'Mercadona'),
        tItem('Carrefour Express', 'Carrefour Express', 'Carrefour Express', 'Carrefour Express', 'Carrefour Express', 'Carrefour Express'),
        tItem('Caprabo', 'Caprabo', 'Caprabo', 'Caprabo', 'Caprabo', 'Caprabo'),
        tItem('Farmacias', 'Farmàcies', 'Pharmacies', 'Pharmacies', 'Apotheken', 'Farmacie'),
        tItem('Bancos', 'Bancs', 'Banks', 'Banques', 'Banken', 'Banche'),
        tItem('Gimnasios', 'Gimnasos', 'Gyms', 'Salles de sport', 'Fitnessstudios', 'Palestre'),
        tItem('Comercios de proximidad', 'Comerços de proximitat', 'Local shops', 'Commerces de proximité', 'Lokale Geschäfte', 'Negozi di vicinato'),
      ],
    },
    {
      group: 'health',
      items: [
        tItem('Hospital Universitari Dexeus', 'Hospital Universitari Dexeus', 'Dexeus University Hospital', 'Hôpital universitaire Dexeus', 'Universitätsklinikum Dexeus', 'Ospedale universitario Dexeus'),
        tItem('Hospital de Barcelona', 'Hospital de Barcelona', 'Hospital de Barcelona', 'Hôpital de Barcelone', 'Hospital de Barcelona', 'Hospital de Barcelona'),
        tItem('Centros médicos privados', 'Centres mèdics privats', 'Private medical centres', 'Centres médicaux privés', 'Private medizinische Zentren', 'Centri medici privati'),
        tItem('Farmacias', 'Farmàcies', 'Pharmacies', 'Pharmacies', 'Apotheken', 'Farmacie'),
      ],
    },
    {
      group: 'leisure_green',
      items: [
        tItem('Jardins de Can Bruixa', 'Jardins de Can Bruixa', 'Can Bruixa Gardens', 'Jardins de Can Bruixa', 'Can-Bruixa-Gärten', 'Giardini Can Bruixa'),
        tItem('Camp Nou / Spotify Camp Nou', 'Camp Nou / Spotify Camp Nou', 'Camp Nou / Spotify Camp Nou', 'Camp Nou / Spotify Camp Nou', 'Camp Nou / Spotify Camp Nou', 'Camp Nou / Spotify Camp Nou'),
        tItem('L\'Illa Diagonal', 'L\'Illa Diagonal', 'L\'Illa Diagonal', 'L\'Illa Diagonal', 'L\'Illa Diagonal', 'L\'Illa Diagonal'),
        tItem('Jardines de la Maternitat', 'Jardins de la Maternitat', 'Maternitat Gardens', 'Jardins de la Maternitat', 'Maternitat-Gärten', 'Giardini de la Maternitat'),
      ],
    },
  ],

  'valencia-eixample': [
    {
      group: 'transport',
      items: [
        tItem('Metro Hospital Clínic', 'Metro Hospital Clínic', 'Hospital Clínic metro', 'Métro Hospital Clínic', 'U-Bahn Hospital Clínic', 'Metro Hospital Clínic'),
        tItem('Metro Urgell', 'Metro Urgell', 'Urgell metro', 'Métro Urgell', 'U-Bahn Urgell', 'Metro Urgell'),
        tItem('Metro Universitat', 'Metro Universitat', 'Universitat metro', 'Métro Universitat', 'U-Bahn Universitat', 'Metro Universitat'),
        tItem('Red de autobuses urbanos', 'Xarxa d\'autobusos urbans', 'City bus network', 'Réseau de bus urbains', 'Stadtbusnetz', 'Rete di autobus urbani'),
        tItem('Acceso rápido a Gran Via', 'Accés ràpid a Gran Via', 'Quick access to Gran Via', 'Accès rapide à la Gran Via', 'Schneller Zugang zur Gran Via', 'Accesso rapido alla Gran Via'),
        tItem('Acceso rápido a Passeig de Gràcia', 'Accés ràpid a Passeig de Gràcia', 'Quick access to Passeig de Gràcia', 'Accès rapide au Passeig de Gràcia', 'Schneller Zugang zum Passeig de Gràcia', 'Accesso rapido a Passeig de Gràcia'),
        tItem('Conexión sencilla con Estació de Sants', 'Connexió senzilla amb l\'Estació de Sants', 'Easy link to Sants Station', 'Lien simple avec la gare de Sants', 'Einfache Verbindung zum Bahnhof Sants', 'Collegamento semplice con la stazione di Sants'),
      ],
    },
    {
      group: 'business',
      items: [
        tItem('Oficinas corporativas', 'Oficines corporatives', 'Corporate offices', 'Bureaux d\'entreprise', 'Unternehmensbüros', 'Uffici corporate'),
        tItem('Coworkings', 'Coworkings', 'Coworking spaces', 'Coworkings', 'Coworking-Spaces', 'Coworking'),
        tItem('Consultoras', 'Consultores', 'Consultancies', 'Cabinets de conseil', 'Beratungsunternehmen', 'Società di consulenza'),
        tItem('Despachos profesionales', 'Despatxos professionals', 'Professional offices', 'Cabinets professionnels', 'Anwalts- und Praxisräume', 'Studi professionali'),
        tItem('Clínicas privadas', 'Clíniques privades', 'Private clinics', 'Cliniques privées', 'Privatkliniken', 'Cliniche private'),
        tItem('Centros de negocios', 'Centres de negocis', 'Business centres', 'Centres d\'affaires', 'Business-Center', 'Centri business'),
      ],
    },
    {
      group: 'dining',
      items: [
        tItem('Restaurantes mediterráneos', 'Restaurants mediterranis', 'Mediterranean restaurants', 'Restaurants méditerranéens', 'Mediterrane Restaurants', 'Ristoranti mediterranei'),
        tItem('Restaurantes internacionales', 'Restaurants internacionals', 'International restaurants', 'Restaurants internationaux', 'Internationale Restaurants', 'Ristoranti internazionali'),
        tItem('Cafeterías de especialidad', 'Cafeteries d\'especialitat', 'Specialty coffee shops', 'Cafés de spécialité', 'Specialty-Cafés', 'Caffè specialty'),
        tItem('Panaderías artesanas', 'Fleques artesanes', 'Artisan bakeries', 'Boulangeries artisanales', 'Handwerksbäckereien', 'Panifici artigianali'),
        tItem('Opciones healthy', 'Opcions healthy', 'Healthy options', 'Options healthy', 'Gesunde Optionen', 'Opzioni healthy'),
        tItem('Servicios de delivery', 'Serveis de delivery', 'Delivery services', 'Services de livraison', 'Lieferdienste', 'Servizi di delivery'),
      ],
    },
    {
      group: 'shopping',
      items: [
        tItem('Mercadona', 'Mercadona', 'Mercadona', 'Mercadona', 'Mercadona', 'Mercadona'),
        tItem('Carrefour Express', 'Carrefour Express', 'Carrefour Express', 'Carrefour Express', 'Carrefour Express', 'Carrefour Express'),
        tItem('Caprabo', 'Caprabo', 'Caprabo', 'Caprabo', 'Caprabo', 'Caprabo'),
        tItem('Farmacias', 'Farmàcies', 'Pharmacies', 'Pharmacies', 'Apotheken', 'Farmacie'),
        tItem('Bancos', 'Bancs', 'Banks', 'Banques', 'Banken', 'Banche'),
        tItem('Gimnasios', 'Gimnasos', 'Gyms', 'Salles de sport', 'Fitnessstudios', 'Palestre'),
        tItem('Centros de estética', 'Centres d\'estètica', 'Beauty centres', 'Centres d\'esthétique', 'Kosmetikstudios', 'Centri estetici'),
        tItem('Comercios de proximidad', 'Comerços de proximitat', 'Local shops', 'Commerces de proximité', 'Lokale Geschäfte', 'Negozi di vicinato'),
      ],
    },
    {
      group: 'health',
      items: [
        tItem('Hospital Clínic', 'Hospital Clínic', 'Hospital Clínic', 'Hospital Clínic', 'Hospital Clínic', 'Hospital Clínic'),
        tItem('Clínicas privadas', 'Clíniques privades', 'Private clinics', 'Cliniques privées', 'Privatkliniken', 'Cliniche private'),
        tItem('Centros médicos especializados', 'Centres mèdics especialitzats', 'Specialist medical centres', 'Centres médicaux spécialisés', 'Fachmedizinische Zentren', 'Centri medici specialistici'),
        tItem('Farmacias de guardia', 'Farmàcies de guàrdia', 'On-duty pharmacies', 'Pharmacies de garde', 'Notapotheken', 'Farmacie di turno'),
        tItem('Centros de fisioterapia', 'Centres de fisioteràpia', 'Physiotherapy centres', 'Centres de physiothérapie', 'Physiotherapiezentren', 'Centri di fisioterapia'),
      ],
    },
    {
      group: 'leisure_culture',
      items: [
        tItem('Passeig de Gràcia', 'Passeig de Gràcia', 'Passeig de Gràcia', 'Passeig de Gràcia', 'Passeig de Gràcia', 'Passeig de Gràcia'),
        tItem('Rambla Catalunya', 'Rambla Catalunya', 'Rambla Catalunya', 'Rambla Catalunya', 'Rambla Catalunya', 'Rambla Catalunya'),
        tItem('Plaça Universitat', 'Plaça Universitat', 'Plaça Universitat', 'Plaça Universitat', 'Plaça Universitat', 'Plaça Universitat'),
        tItem('Plaça Catalunya', 'Plaça Catalunya', 'Plaça Catalunya', 'Plaça Catalunya', 'Plaça Catalunya', 'Plaça Catalunya'),
        tItem('Casa Batlló', 'Casa Batlló', 'Casa Batlló', 'Casa Batlló', 'Casa Batlló', 'Casa Batlló'),
        tItem('La Pedrera', 'La Pedrera', 'La Pedrera', 'La Pedrera', 'La Pedrera', 'La Pedrera'),
      ],
    },
  ],
};

function pickLangText(map, lang) {
  if (!map) return '';
  return map[lang] || map.es || '';
}

function getPropertySurroundings(slug, lang) {
  const raw = PROPERTY_SURROUNDINGS_RAW[slug];
  if (!raw) return null;
  const L = lang || 'es';
  return raw.map(function (g) {
    return {
      group: pickLangText(SURROUNDINGS_GROUP_I18N[g.group], L) || g.group,
      items: (g.items || []).map(function (item) {
        return pickLangText(item, L);
      }),
    };
  });
}
