/* ─── LEGAL MODALS i18n ─── */
const LEGAL_CLOSE_LABELS = {
  es: 'Cerrar', ca: 'Tancar', en: 'Close', fr: 'Fermer', de: 'Schließen', it: 'Chiudi'
};

const COOKIE_TH = {
  es: ['Cookie', 'Duración', 'Descripción'],
  ca: ['Cookie', 'Durada', 'Descripció'],
  en: ['Cookie', 'Duration', 'Description'],
  fr: ['Cookie', 'Durée', 'Description'],
  de: ['Cookie', 'Dauer', 'Beschreibung'],
  it: ['Cookie', 'Durata', 'Descrizione']
};

const BROWSER_HELP = {
  es: [
    ['Chrome', 'https://support.google.com/chrome/answer/95647?hl=es'],
    ['Safari', 'https://support.apple.com/es-es/guide/safari/sfri11471/mac'],
    ['Explorer / Edge', 'https://support.microsoft.com/es-es/microsoft-edge/eliminar-las-cookies-en-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09'],
    ['Firefox', 'https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-sitios-web-rastrear-preferencias']
  ],
  ca: [
    ['Chrome', 'https://support.google.com/chrome/answer/95647?hl=ca'],
    ['Safari', 'https://support.apple.com/ca-es/guide/safari/sfri11471/mac'],
    ['Explorer / Edge', 'https://support.microsoft.com/ca-es/microsoft-edge/delete-cookies'],
    ['Firefox', 'https://support.mozilla.org/ca/kb/enable-and-disable-cookies-website-preferences']
  ],
  en: [
    ['Chrome', 'https://support.google.com/chrome/answer/95647?hl=en'],
    ['Safari', 'https://support.apple.com/guide/safari/sfri11471/mac'],
    ['Explorer / Edge', 'https://support.microsoft.com/en-us/microsoft-edge/delete-cookies'],
    ['Firefox', 'https://support.mozilla.org/en-US/kb/enable-and-disable-cookies-website-preferences']
  ],
  fr: [
    ['Chrome', 'https://support.google.com/chrome/answer/95647?hl=fr'],
    ['Safari', 'https://support.apple.com/fr-fr/guide/safari/sfri11471/mac'],
    ['Explorer / Edge', 'https://support.microsoft.com/fr-fr/microsoft-edge/supprimer-les-cookies'],
    ['Firefox', 'https://support.mozilla.org/fr/kb/activer-desactiver-cookies']
  ],
  de: [
    ['Chrome', 'https://support.google.com/chrome/answer/95647?hl=de'],
    ['Safari', 'https://support.apple.com/de-de/guide/safari/sfri11471/mac'],
    ['Explorer / Edge', 'https://support.microsoft.com/de-de/microsoft-edge/cookies-loeschen'],
    ['Firefox', 'https://support.mozilla.org/de/kb/cookies-erlauben-und-ablehnen']
  ],
  it: [
    ['Chrome', 'https://support.google.com/chrome/answer/95647?hl=it'],
    ['Safari', 'https://support.apple.com/it-it/guide/safari/sfri11471/mac'],
    ['Explorer / Edge', 'https://support.microsoft.com/it-it/microsoft-edge/eliminare-i-cookie'],
    ['Firefox', 'https://support.mozilla.org/it/kb/Attivare%20e%20disattivare%20i%20cookie']
  ]
};

const GOOGLE_COOKIE_LINKS = {
  es: [
    ['Tipos de cookies de Google', 'https://www.google.es/intl/es/policies/technologies/types/'],
    ['Cookies publicitarias de Google', 'https://www.google.es/policies/technologies/ads/']
  ],
  ca: [
    ['Tipus de galetes de Google', 'https://www.google.es/intl/ca/policies/technologies/types/'],
    ['Galetes publicitàries de Google', 'https://www.google.es/intl/ca/policies/technologies/ads/']
  ],
  en: [
    ['Types of Google cookies', 'https://policies.google.com/technologies/types'],
    ['Google advertising cookies', 'https://policies.google.com/technologies/ads']
  ],
  fr: [
    ['Types de cookies Google', 'https://policies.google.com/technologies/types?hl=fr'],
    ['Cookies publicitaires Google', 'https://policies.google.com/technologies/ads?hl=fr']
  ],
  de: [
    ['Arten von Google-Cookies', 'https://policies.google.com/technologies/types?hl=de'],
    ['Google-Werbe-Cookies', 'https://policies.google.com/technologies/ads?hl=de']
  ],
  it: [
    ['Tipi di cookie di Google', 'https://policies.google.com/technologies/types?hl=it'],
    ['Cookie pubblicitari di Google', 'https://policies.google.com/technologies/ads?hl=it']
  ]
};

function renderSections(sections) {
  return sections.map(sec => {
    let html = sec.h ? `<h3>${sec.h}</h3>` : '';
    if (sec.h4) html += `<h4>${sec.h4}</h4>`;
    (sec.ps || []).forEach(p => { html += `<p>${p}</p>`; });
    if (sec.list) html += `<ul>${sec.list.map(i => `<li>${i}</li>`).join('')}</ul>`;
    return html;
  }).join('');
}

function renderCookieTables(lang, tables) {
  const th = COOKIE_TH[lang] || COOKIE_TH.es;
  return tables.map(tbl => `
    <h4>${tbl.h4}</h4>
    <p>${tbl.desc}</p>
    <table class="cookie-table">
      <thead><tr>${th.map(h => `<th>${h}</th>`).join('')}</tr></thead>
      <tbody>${tbl.rows.map(r => `<tr><td><code>${r[0]}</code></td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}</tbody>
    </table>
  `).join('');
}

function getCookieTables(lang) {
  const d = {
    es: { y: '1 año', h: '1 hora', s: 'Sesión', d: '1 día', m6: '6 meses', ym: '1 año 1 mes', min: '1 minuto' },
    ca: { y: '1 any', h: '1 hora', s: 'Sessió', d: '1 dia', m6: '6 mesos', ym: '1 any 1 mes', min: '1 minut' },
    en: { y: '1 year', h: '1 hour', s: 'Session', d: '1 day', m6: '6 months', ym: '1 year 1 month', min: '1 minute' },
    fr: { y: '1 an', h: '1 heure', s: 'Session', d: '1 jour', m6: '6 mois', ym: '1 an 1 mois', min: '1 minute' },
    de: { y: '1 Jahr', h: '1 Stunde', s: 'Sitzung', d: '1 Tag', m6: '6 Monate', ym: '1 Jahr 1 Monat', min: '1 Minute' },
    it: { y: '1 anno', h: '1 ora', s: 'Sessione', d: '1 giorno', m6: '6 mesi', ym: '1 anno 1 mese', min: '1 minuto' }
  };
  const t = d[lang] || d.es;
  const desc = {
    es: {
      cy: 'Recuerda las preferencias de consentimiento de cookies del usuario para que se respeten en visitas posteriores. No recoge ni almacena información personal.',
      cf: 'Establecida por Cloudflare para respaldar la gestión de bots.',
      cru: 'Utilizada por Cloudflare para identificar tráfico web de confianza.',
      lid: 'LinkedIn la establece para facilitar la selección del centro de datos.',
      lig: 'LinkedIn la establece para almacenar el consentimiento del visitante respecto al uso de cookies no esenciales.',
      ga: 'Google Analytics la establece para calcular datos de visitantes, sesiones y campañas. Almacena la información de forma anónima.',
      gast: 'Google Analytics la utiliza para almacenar y contabilizar las visitas a la página.',
      gid: 'Google Analytics la establece para almacenar información sobre el uso del sitio web y generar informes de rendimiento.',
      gat: 'Google Analytics la establece para realizar un seguimiento del comportamiento del usuario.',
      bc: 'LinkedIn la establece para reconocer los identificadores del navegador.',
      ysc: 'YouTube la establece para hacer seguimiento de las visualizaciones de vídeos incrustados.',
      v1: 'YouTube la establece para medir el ancho de banda y determinar la interfaz del reproductor.',
      vp: 'YouTube la establece para almacenar el estado del consentimiento de cookies del usuario.'
    },
    ca: {
      cy: 'Recorda les preferències de consentiment de galetes de l\'usuari perquè es respectin en visites posteriors. No recull ni emmagatzema informació personal.',
      cf: 'Establerta per Cloudflare per donar suport a la gestió de bots.',
      cru: 'Utilitzada per Cloudflare per identificar trànsit web de confiança.',
      lid: 'LinkedIn l\'estableix per facilitar la selecció del centre de dades.',
      lig: 'LinkedIn l\'estableix per emmagatzemar el consentiment del visitant respecte a l\'ús de galetes no essencials.',
      ga: 'Google Analytics l\'estableix per calcular dades de visitants, sessions i campanyes. Emmagatzema la informació de forma anònima.',
      gast: 'Google Analytics la utilitza per emmagatzemar i comptabilitzar les visites a la pàgina.',
      gid: 'Google Analytics l\'estableix per emmagatzemar informació sobre l\'ús del lloc web i generar informes de rendiment.',
      gat: 'Google Analytics l\'estableix per fer un seguiment del comportament de l\'usuari.',
      bc: 'LinkedIn l\'estableix per reconèixer els identificadors del navegador.',
      ysc: 'YouTube l\'estableix per fer seguiment de les visualitzacions de vídeos incrustats.',
      v1: 'YouTube l\'estableix per mesurar l\'ample de banda i determinar la interfície del reproductor.',
      vp: 'YouTube l\'estableix per emmagatzemar l\'estat del consentiment de galetes de l\'usuari.'
    },
    en: {
      cy: 'Remembers the user\'s cookie consent preferences for subsequent visits. Does not collect or store personal information.',
      cf: 'Set by Cloudflare to support bot management.',
      cru: 'Used by Cloudflare to identify trusted web traffic.',
      lid: 'Set by LinkedIn to facilitate data centre selection.',
      lig: 'Set by LinkedIn to store visitor consent regarding non-essential cookies.',
      ga: 'Set by Google Analytics to calculate visitor, session and campaign data. Stores information anonymously.',
      gast: 'Used by Google Analytics to store and count page visits.',
      gid: 'Set by Google Analytics to store website usage information and generate performance reports.',
      gat: 'Set by Google Analytics to track user behaviour.',
      bc: 'Set by LinkedIn to recognise browser identifiers.',
      ysc: 'Set by YouTube to track views of embedded videos.',
      v1: 'Set by YouTube to measure bandwidth and determine the player interface.',
      vp: 'Set by YouTube to store the user\'s cookie consent status.'
    },
    fr: {
      cy: 'Mémorise les préférences de consentement aux cookies de l\'utilisateur pour les visites ultérieures. Ne collecte ni ne stocke d\'informations personnelles.',
      cf: 'Définie par Cloudflare pour la gestion des bots.',
      cru: 'Utilisée par Cloudflare pour identifier le trafic web de confiance.',
      lid: 'Définie par LinkedIn pour faciliter la sélection du centre de données.',
      lig: 'Définie par LinkedIn pour stocker le consentement du visiteur concernant les cookies non essentiels.',
      ga: 'Définie par Google Analytics pour calculer les données de visiteurs, sessions et campagnes. Stocke les informations de manière anonyme.',
      gast: 'Utilisée par Google Analytics pour stocker et comptabiliser les visites de pages.',
      gid: 'Définie par Google Analytics pour stocker les informations d\'utilisation du site et générer des rapports de performance.',
      gat: 'Définie par Google Analytics pour suivre le comportement des utilisateurs.',
      bc: 'Définie par LinkedIn pour reconnaître les identifiants du navigateur.',
      ysc: 'Définie par YouTube pour suivre les vues des vidéos intégrées.',
      v1: 'Définie par YouTube pour mesurer la bande passante et déterminer l\'interface du lecteur.',
      vp: 'Définie par YouTube pour stocker l\'état du consentement aux cookies de l\'utilisateur.'
    },
    de: {
      cy: 'Speichert die Cookie-Einwilligungspräferenzen des Nutzers für spätere Besuche. Erfasst oder speichert keine personenbezogenen Daten.',
      cf: 'Von Cloudflare gesetzt zur Bot-Verwaltung.',
      cru: 'Von Cloudflare verwendet, um vertrauenswürdigen Webverkehr zu identifizieren.',
      lid: 'Von LinkedIn gesetzt zur Auswahl des Rechenzentrums.',
      lig: 'Von LinkedIn gesetzt zur Speicherung der Einwilligung des Besuchers zu nicht wesentlichen Cookies.',
      ga: 'Von Google Analytics gesetzt zur Berechnung von Besucher-, Sitzungs- und Kampagnendaten. Speichert Informationen anonym.',
      gast: 'Von Google Analytics verwendet zur Speicherung und Zählung von Seitenaufrufen.',
      gid: 'Von Google Analytics gesetzt zur Speicherung von Nutzungsinformationen und Erstellung von Leistungsberichten.',
      gat: 'Von Google Analytics gesetzt zur Verfolgung des Nutzerverhaltens.',
      bc: 'Von LinkedIn gesetzt zur Erkennung von Browser-Identifikatoren.',
      ysc: 'Von YouTube gesetzt zur Verfolgung von Aufrufen eingebetteter Videos.',
      v1: 'Von YouTube gesetzt zur Messung der Bandbreite und Bestimmung der Player-Oberfläche.',
      vp: 'Von YouTube gesetzt zur Speicherung des Cookie-Einwilligungsstatus des Nutzers.'
    },
    it: {
      cy: 'Memorizza le preferenze di consenso ai cookie dell\'utente per le visite successive. Non raccoglie né memorizza informazioni personali.',
      cf: 'Impostato da Cloudflare per la gestione dei bot.',
      cru: 'Utilizzato da Cloudflare per identificare il traffico web affidabile.',
      lid: 'Impostato da LinkedIn per facilitare la selezione del data center.',
      lig: 'Impostato da LinkedIn per memorizzare il consenso del visitatore riguardo ai cookie non essenziali.',
      ga: 'Impostato da Google Analytics per calcolare dati su visitatori, sessioni e campagne. Memorizza le informazioni in modo anonimo.',
      gast: 'Utilizzato da Google Analytics per memorizzare e contare le visite alle pagine.',
      gid: 'Impostato da Google Analytics per memorizzare informazioni sull\'uso del sito e generare report sulle prestazioni.',
      gat: 'Impostato da Google Analytics per tracciare il comportamento dell\'utente.',
      bc: 'Impostato da LinkedIn per riconoscere gli identificatori del browser.',
      ysc: 'Impostato da YouTube per tracciare le visualizzazioni dei video incorporati.',
      v1: 'Impostato da YouTube per misurare la larghezza di banda e determinare l\'interfaccia del player.',
      vp: 'Impostato da YouTube per memorizzare lo stato del consenso ai cookie dell\'utente.'
    }
  };
  const x = desc[lang] || desc.es;
  const h4 = {
    es: { nec: 'Necesarias', fun: 'Funcionales', ana: 'Analíticas', adv: 'Publicitarias' },
    ca: { nec: 'Necessàries', fun: 'Funcionals', ana: 'Analítiques', adv: 'Publicitàries' },
    en: { nec: 'Necessary', fun: 'Functional', ana: 'Analytics', adv: 'Advertising' },
    fr: { nec: 'Nécessaires', fun: 'Fonctionnelles', ana: 'Analytiques', adv: 'Publicitaires' },
    de: { nec: 'Notwendige', fun: 'Funktionale', ana: 'Analytische', adv: 'Werbe-' },
    it: { nec: 'Necessarie', fun: 'Funzionali', ana: 'Analitiche', adv: 'Pubblicitarie' }
  };
  const h = h4[lang] || h4.es;
  const td = {
    es: {
      nec: 'Las cookies necesarias son cruciales para las funciones básicas del sitio web y este no funcionará de la forma prevista sin ellas. No almacenan ningún dato de identificación personal.',
      fun: 'Las cookies funcionales ayudan a realizar ciertas funcionalidades, como compartir contenido en redes sociales u otras características de terceros.',
      ana: 'Las cookies analíticas se utilizan para comprender cómo interactúan los visitantes con el sitio web, proporcionando información sobre número de visitantes, porcentaje de rebote, fuente de tráfico, etc.',
      adv: 'Las cookies publicitarias se utilizan para ofrecer anuncios personalizados basados en las páginas visitadas anteriormente y para analizar la efectividad de las campañas publicitarias.'
    },
    ca: {
      nec: 'Les galetes necessàries són crucials per a les funcions bàsiques del lloc web i aquest no funcionarà com s\'espera sense elles. No emmagatzemen cap dada d\'identificació personal.',
      fun: 'Les galetes funcionals ajuden a realitzar certes funcionalitats, com compartir contingut a xarxes socials o altres característiques de tercers.',
      ana: 'Les galetes analítiques s\'utilitzen per comprendre com interactuen els visitants amb el lloc web, proporcionant informació sobre el nombre de visitants, percentatge de rebot, font de trànsit, etc.',
      adv: 'Les galetes publicitàries s\'utilitzen per oferir anuncis personalitzats basats en les pàgines visitades anteriorment i per analitzar l\'efectivitat de les campanyes publicitàries.'
    },
    en: {
      nec: 'Necessary cookies are crucial for the basic functions of the website and it will not work as intended without them. They do not store any personally identifiable data.',
      fun: 'Functional cookies help perform certain functionalities such as sharing content on social networks or other third-party features.',
      ana: 'Analytics cookies are used to understand how visitors interact with the website, providing information on number of visitors, bounce rate, traffic source, etc.',
      adv: 'Advertising cookies are used to deliver personalised ads based on previously visited pages and to analyse the effectiveness of advertising campaigns.'
    },
    fr: {
      nec: 'Les cookies nécessaires sont essentiels aux fonctions de base du site web et celui-ci ne fonctionnera pas comme prévu sans eux. Ils ne stockent aucune donnée d\'identification personnelle.',
      fun: 'Les cookies fonctionnels aident à réaliser certaines fonctionnalités, comme le partage de contenu sur les réseaux sociaux ou d\'autres fonctionnalités tierces.',
      ana: 'Les cookies analytiques sont utilisés pour comprendre comment les visiteurs interagissent avec le site web, en fournissant des informations sur le nombre de visiteurs, le taux de rebond, la source de trafic, etc.',
      adv: 'Les cookies publicitaires sont utilisés pour proposer des annonces personnalisées basées sur les pages précédemment visitées et pour analyser l\'efficacité des campagnes publicitaires.'
    },
    de: {
      nec: 'Notwendige Cookies sind für die Grundfunktionen der Website unerlässlich und ohne sie funktioniert die Website nicht wie vorgesehen. Sie speichern keine personenbezogenen Daten.',
      fun: 'Funktionale Cookies helfen bei bestimmten Funktionen, wie dem Teilen von Inhalten in sozialen Netzwerken oder anderen Funktionen von Drittanbietern.',
      ana: 'Analytische Cookies werden verwendet, um zu verstehen, wie Besucher mit der Website interagieren, und liefern Informationen über Besucherzahlen, Absprungrate, Traffic-Quelle usw.',
      adv: 'Werbe-Cookies werden verwendet, um personalisierte Anzeigen basierend auf zuvor besuchten Seiten anzuzeigen und die Wirksamkeit von Werbekampagnen zu analysieren.'
    },
    it: {
      nec: 'I cookie necessari sono fondamentali per le funzioni di base del sito web e senza di essi non funzionerà come previsto. Non memorizzano dati di identificazione personale.',
      fun: 'I cookie funzionali aiutano a svolgere determinate funzionalità, come la condivisione di contenuti sui social network o altre funzionalità di terze parti.',
      ana: 'I cookie analitici vengono utilizzati per capire come i visitatori interagiscono con il sito web, fornendo informazioni sul numero di visitatori, percentuale di rimbalzo, fonte di traffico, ecc.',
      adv: 'I cookie pubblicitari vengono utilizzati per offrire annunci personalizzati in base alle pagine visitate in precedenza e per analizzare l\'efficacia delle campagne pubblicitarie.'
    }
  };
  const tdL = td[lang] || td.es;
  return [
    { h4: h.nec, desc: tdL.nec, rows: [
      ['cookieyes-consent', t.y, x.cy],
      ['__cf_bm', t.h, x.cf],
      ['__cfruid', t.s, x.cru]
    ]},
    { h4: h.fun, desc: tdL.fun, rows: [
      ['lidc', t.d, x.lid],
      ['li_gc', t.m6, x.lig]
    ]},
    { h4: h.ana, desc: tdL.ana, rows: [
      ['_ga', t.ym, x.ga],
      ['ga*', t.ym, x.gast],
      ['_gid', t.d, x.gid],
      ['_gat_UA-*', t.min, x.gat]
    ]},
    { h4: h.adv, desc: tdL.adv, rows: [
      ['bcookie', t.y, x.bc],
      ['YSC', t.s, x.ysc],
      ['VISITOR_INFO1_LIVE', t.m6, x.v1],
      ['VISITOR_PRIVACY_METADATA', t.m6, x.vp]
    ]}
  ];
}


/* ─── LEGAL NOTICE ─── */
const LEGAL_TEXT = {
  es: {
    title: "AVISO LEGAL",
    sections: [
      {
        h: "Datos de identificación",
        ps: [
          "Usted está visitando el sitio web de Burguar Dreams, propiedad de Burguar Dreams S.L., con domicilio social en C/ Can Bruixa, 16, 1ª planta 1º, 08028 Barcelona, España, con NIF n.º B67209502, inscrita en el Registro Mercantil de Barcelona [DATOS REGISTRO MERCANTIL] (que en dicho documento se denomina «Burguar Dreams»).",
          "Esta actividad no está sujeta a ningún régimen de autorización administrativa previa.",
          "Puede ponerse en contacto con Burguar Dreams por cualquiera de los siguientes medios:"
        ],
        list: [
          "Teléfono / WhatsApp: 660 68 85 01",
          "Correo electrónico: burguardreams@gmail.com"
        ]
      },
      {
        h: "Alojamiento web",
        ps: [
          "Los datos de alojamiento web serán facilitados en cuanto estén disponibles."
        ]
      },
      {
        h: "Usuarios",
        ps: [
          "Estas condiciones (en adelante, Aviso Legal) tienen por objeto regular el uso del sitio web de Burguar Dreams que pone a disposición del público.",
          "El acceso y/o uso de este sitio web le atribuye la condición de USUARIO, quien acepta, desde dicho acceso y/o uso, las condiciones generales de uso aquí reflejadas. Estas condiciones serán aplicables independientemente de las condiciones generales de contratación que pudieran ser obligatorias."
        ]
      },
      {
        h: "Uso del portal",
        ps: [
          "Burguar Dreams proporciona acceso a información, servicios y datos (en adelante, \"los contenidos\") en Internet pertenecientes a Burguar Dreams S.L. o a sus licenciantes, a los que el USUARIO puede tener acceso.",
          "El USUARIO asume la responsabilidad del uso del sitio web. Esta responsabilidad se extiende al registro necesario para acceder a determinados servicios o contenidos. En dicho registro, el USUARIO deberá proporcionar información veraz y lícita. Como resultado de este registro, se le podrá asignar una contraseña, de la cual será responsable, comprometiéndose a hacer un uso diligente y confidencial de la misma.",
          "El USUARIO se compromete a hacer un uso adecuado de los contenidos y servicios que Burguar Dreams ofrece a través de su sitio web y, en particular, a no utilizarlos para:"
        ],
        list: [
          "Participar en actividades ilícitas, ilegales o contrarias a la buena fe y al orden público.",
          "Difundir contenido o propaganda de carácter racista, xenófobo, pornográfico ilegal, que promueva el terrorismo o viole los derechos humanos.",
          "Causar daños a los sistemas físicos y lógicos de Burguar Dreams, sus proveedores o terceros, o introducir virus informáticos o cualquier otro elemento dañino.",
          "Intentar acceder a cuentas de otros usuarios o manipular sus mensajes.",
          "Utilizar el sitio web con fines comerciales, políticos o publicitarios no autorizados, incluido el envío de correos electrónicos no solicitados."
        ],
        ps2: [
          "Burguar Dreams se reserva el derecho de retirar todos los comentarios y contribuciones que atenten contra la dignidad de la persona, que sean discriminatorios, xenófobos, racistas, pornográficos, que amenacen el orden o la seguridad pública, o que no sean adecuados para su publicación. En ningún caso, Burguar Dreams se responsabilizará de las opiniones expresadas por los usuarios a través de foros, chats u otras herramientas de participación."
        ]
      },
      {
        h: "Protección de datos",
        ps: [
          "Todo lo relacionado con la política de protección de datos está contenido en el documento de Política de Privacidad, disponible en el sitio web."
        ]
      },
      {
        h: "Propiedad intelectual e industrial",
        ps: [
          "Burguar Dreams S.L. es titular de todos los derechos de propiedad intelectual e industrial de su sitio web, así como de los elementos contenidos en el mismo (a título enunciativo: imágenes, fotografías, textos, marcas, logotipos, combinaciones de colores, estructura y diseño, software, etc.), propiedad de Burguar Dreams S.L. o de sus licenciantes.",
          "Todos los derechos reservados. De conformidad con lo dispuesto en la Ley de Propiedad Intelectual, queda expresamente prohibida la reproducción, distribución y comunicación pública de la totalidad o parte de los contenidos de este sitio web con fines comerciales, en cualquier soporte y por cualquier medio técnico, sin la autorización expresa de Burguar Dreams S.L.",
          "El USUARIO se compromete a respetar los derechos de propiedad intelectual e industrial de Burguar Dreams. Podrá visualizar los elementos del sitio web e imprimirlos, copiarlos o almacenarlos única y exclusivamente para uso personal y privado."
        ]
      },
      {
        h: "Exclusión de garantías y responsabilidad",
        ps: [
          "El USUARIO reconoce que el uso del sitio web, sus contenidos y servicios se realiza bajo su exclusiva responsabilidad. En particular, Burguar Dreams no asume responsabilidad en los siguientes ámbitos:"
        ],
        list: [
          "La disponibilidad, calidad o interoperabilidad del sitio web, sus servicios y contenidos.",
          "La infracción de la legislación vigente por parte del USUARIO o de terceros, especialmente en materia de propiedad intelectual o industrial.",
          "La existencia de códigos maliciosos o elementos dañinos que pudieran afectar al sistema informático del USUARIO.",
          "El acceso fraudulento a contenidos o servicios por parte de terceros no autorizados.",
          "La exactitud, veracidad o utilidad de los contenidos ofrecidos. Burguar Dreams empleará todos los medios razonables para proporcionar información actualizada y fiable.",
          "Daños causados a los equipos informáticos del USUARIO o derivados de fallos en las redes de telecomunicaciones.",
          "Daños derivados de caso fortuito o fuerza mayor."
        ]
      },
      {
        h: "Modificación de este aviso legal",
        ps: [
          "Burguar Dreams se reserva el derecho de realizar, sin previo aviso, las modificaciones que considere oportunas en el sitio web, pudiendo cambiar, eliminar o añadir tanto los contenidos y servicios como la forma en que se presentan.",
          "La validez de las condiciones aquí reflejadas dependerá de su publicación y estarán vigentes hasta que sean modificadas por otras debidamente publicadas."
        ]
      },
      {
        h: "Política de enlaces",
        ps: [
          "En caso de que el sitio web incluya enlaces o hipervínculos a otros sitios web, Burguar Dreams no ejercerá ningún tipo de control sobre dichos sitios ni sus contenidos. En ningún caso Burguar Dreams asumirá responsabilidad alguna por el contenido de los enlaces a sitios web de terceros, ni garantizará su disponibilidad, calidad, fiabilidad o exactitud. La inclusión de estas conexiones externas no implicará ningún tipo de asociación, fusión ni participación con las entidades enlazadas."
        ]
      },
      {
        h: "Derecho de exclusión",
        ps: [
          "Burguar Dreams se reserva el derecho de denegar o retirar el acceso al sitio web y/o a los servicios ofrecidos sin previo aviso, a petición propia o de un tercero, a aquellos usuarios que no cumplan con el contenido de este Aviso Legal."
        ]
      },
      {
        h: "Generalidades",
        ps: [
          "Burguar Dreams perseguirá el incumplimiento de estas condiciones, así como cualquier uso indebido del sitio web, ejerciendo todas las acciones civiles y penales que le correspondan por ley."
        ]
      },
      {
        h: "Ley aplicable y jurisdicción",
        ps: [
          "La relación entre Burguar Dreams y el USUARIO se regirá por la normativa española vigente. Todas las controversias y reclamaciones derivadas de este Aviso Legal serán resueltas por los juzgados y tribunales de la ciudad de Barcelona."
        ]
      }
    ]
  },
  ca: {
    title: "AVÍS LEGAL",
    sections: [
      {
        h: "Dades d'identificació",
        ps: [
          "Esteu visitant el lloc web de Burguar Dreams, propietat de Burguar Dreams S.L., amb domicili social al C/ Can Bruixa, 16, 1ª planta 1º, 08028 Barcelona, Espanya, amb NIF núm. B67209502, inscrita al Registre Mercantil de Barcelona [DADES REGISTRE MERCANTIL] (que en dit document es denomina «Burguar Dreams»).",
          "Aquesta activitat no està subjecta a cap règim d'autorització administrativa prèvia.",
          "Podeu posar-vos en contacte amb Burguar Dreams per qualsevol dels mitjans següents:"
        ],
        list: [
          "Telèfon / WhatsApp: 660 68 85 01",
          "Correu electrònic: burguardreams@gmail.com"
        ]
      },
      {
        h: "Allotjament web",
        ps: [
          "Les dades d'allotjament web seran facilitades tan aviat com estiguin disponibles."
        ]
      },
      {
        h: "Usuaris",
        ps: [
          "Aquestes condicions (d'ara endavant, Avís Legal) tenen per objecte regular l'ús del lloc web de Burguar Dreams que posa a disposició del públic.",
          "L'accés i/o ús d'aquest lloc web li atribueix la condició d'USUARI, qui accepta, des d'aquest accés i/o ús, les condicions generals d'ús aquí reflectides. Aquestes condicions seran aplicables independentment de les condicions generals de contractació que poguessin ser obligatòries."
        ]
      },
      {
        h: "Ús del portal",
        ps: [
          "Burguar Dreams proporciona accés a informació, serveis i dades (d'ara endavant, \"els continguts\") a Internet pertanyents a Burguar Dreams S.L. o als seus llicenciants, als quals l'USUARI pot tenir accés.",
          "L'USUARI assumeix la responsabilitat de l'ús del lloc web. Aquesta responsabilitat s'estén al registre necessari per accedir a determinats serveis o continguts. En dit registre, l'USUARI haurà de proporcionar informació verídica i lícita. Com a resultat d'aquest registre, se li podrà assignar una contrasenya, de la qual serà responsable, comprometent-se a fer-ne un ús diligent i confidencial.",
          "L'USUARI es compromet a fer un ús adequat dels continguts i serveis que Burguar Dreams ofereix a través del seu lloc web i, en particular, a no utilitzar-los per a:"
        ],
        list: [
          "Participar en activitats il·lícites, il·legals o contràries a la bona fe i a l'ordre públic.",
          "Difondre contingut o propaganda de caràcter racista, xenòfob, pornogràfic il·legal, que promogui el terrorisme o vulneri els drets humans.",
          "Causar danys als sistemes físics i lògics de Burguar Dreams, els seus proveïdors o tercers, o introduir virus informàtics o qualsevol altre element nociu.",
          "Intentar accedir a comptes d'altres usuaris o manipular els seus missatges.",
          "Utilitzar el lloc web amb finalitats comercials, polítiques o publicitàries no autoritzades, inclòs l'enviament de correus electrònics no sol·licitats."
        ],
        ps2: [
          "Burguar Dreams es reserva el dret de retirar tots els comentaris i contribucions que atemptin contra la dignitat de la persona, que siguin discriminatoris, xenòfobs, racistes, pornogràfics, que amenacin l'ordre o la seguretat pública, o que no siguin adequats per a la seva publicació. En cap cas, Burguar Dreams es responsabilitzarà de les opinions expressades pels usuaris a través de fòrums, xats o altres eines de participació."
        ]
      },
      {
        h: "Protecció de dades",
        ps: [
          "Tot el relacionat amb la política de protecció de dades està contingut en el document de Política de Privacitat, disponible al lloc web."
        ]
      },
      {
        h: "Propietat intel·lectual i industrial",
        ps: [
          "Burguar Dreams S.L. és titular de tots els drets de propietat intel·lectual i industrial del seu lloc web, així com dels elements continguts en el mateix (a títol enunciatiu: imatges, fotografies, textos, marques, logotips, combinacions de colors, estructura i disseny, programari, etc.), propietat de Burguar Dreams S.L. o dels seus llicenciants.",
          "Tots els drets reservats. D'acord amb el que disposa la Llei de Propietat Intel·lectual, queda expressament prohibida la reproducció, distribució i comunicació pública de la totalitat o part dels continguts d'aquest lloc web amb finalitats comercials, en qualsevol suport i per qualsevol mitjà tècnic, sense l'autorització expressa de Burguar Dreams S.L.",
          "L'USUARI es compromet a respectar els drets de propietat intel·lectual i industrial de Burguar Dreams. Podrà visualitzar els elements del lloc web i imprimir-los, copiar-los o emmagatzemar-los única i exclusivament per a ús personal i privat."
        ]
      },
      {
        h: "Exclusió de garanties i responsabilitat",
        ps: [
          "L'USUARI reconeix que l'ús del lloc web, els seus continguts i serveis es realitza sota la seva exclusiva responsabilitat. En particular, Burguar Dreams no assumeix responsabilitat en els àmbits següents:"
        ],
        list: [
          "La disponibilitat, qualitat o interoperabilitat del lloc web, els seus serveis i continguts.",
          "La infracció de la legislació vigent per part de l'USUARI o de tercers, especialment en matèria de propietat intel·lectual o industrial.",
          "L'existència de codis maliciosos o elements nocius que poguessin afectar el sistema informàtic de l'USUARI.",
          "L'accés fraudulent a continguts o serveis per part de tercers no autoritzats.",
          "L'exactitud, veracitat o utilitat dels continguts oferts. Burguar Dreams emprarà tots els mitjans raonables per proporcionar informació actualitzada i fiable.",
          "Danys causats als equips informàtics de l'USUARI o derivats de fallades en les xarxes de telecomunicacions.",
          "Danys derivats de cas fortuït o força major."
        ]
      },
      {
        h: "Modificació d'aquest avís legal",
        ps: [
          "Burguar Dreams es reserva el dret de realitzar, sense avís previ, les modificacions que consideri oportunes al lloc web, podent canviar, eliminar o afegir tant els continguts i serveis com la forma en què es presenten.",
          "La validesa de les condicions aquí reflectides dependrà de la seva publicació i estaran vigents fins que siguin modificades per altres degudament publicades."
        ]
      },
      {
        h: "Política d'enllaços",
        ps: [
          "En cas que el lloc web inclogui enllaços o hipervíncols a altres llocs web, Burguar Dreams no exercirà cap tipus de control sobre aquests llocs ni els seus continguts. En cap cas Burguar Dreams assumirà responsabilitat alguna pel contingut dels enllaços a llocs web de tercers, ni garantirà la seva disponibilitat, qualitat, fiabilitat o exactitud. La inclusió d'aquestes connexions externes no implicarà cap tipus d'associació, fusió ni participació amb les entitats enllaçades."
        ]
      },
      {
        h: "Dret d'exclusió",
        ps: [
          "Burguar Dreams es reserva el dret de denegar o retirar l'accés al lloc web i/o als serveis oferts sense avís previ, a petició pròpia o d'un tercer, als usuaris que no compleixin el contingut d'aquest Avís Legal."
        ]
      },
      {
        h: "Generalitats",
        ps: [
          "Burguar Dreams perseguirà l'incompliment d'aquestes condicions, així com qualsevol ús indegut del lloc web, exercint totes les accions civils i penals que li corresponguin per llei."
        ]
      },
      {
        h: "Llei aplicable i jurisdicció",
        ps: [
          "La relació entre Burguar Dreams i l'USUARI es regirà per la normativa espanyola vigent. Totes les controvèrsies i reclamacions derivades d'aquest Avís Legal seran resoltes pels jutjats i tribunals de la ciutat de Barcelona."
        ]
      }
    ]
  },
  en: {
    title: "LEGAL NOTICE",
    sections: [
      {
        h: "Identification details",
        ps: [
          "You are visiting the website of Burguar Dreams, owned by Burguar Dreams S.L., with registered office at C/ Can Bruixa, 16, 1ª planta 1º, 08028 Barcelona, Spain, with Tax ID No. B67209502, registered in the Commercial Register of Barcelona [COMMERCIAL REGISTER DETAILS] (referred to in said document as «Burguar Dreams»).",
          "This activity is not subject to any prior administrative authorisation regime.",
          "You may contact Burguar Dreams through any of the following means:"
        ],
        list: [
          "Phone / WhatsApp: 660 68 85 01",
          "Email: burguardreams@gmail.com"
        ]
      },
      {
        h: "Web hosting",
        ps: [
          "Web hosting details will be provided as soon as they become available."
        ]
      },
      {
        h: "Users",
        ps: [
          "These conditions (hereinafter, Legal Notice) are intended to regulate the use of the Burguar Dreams website made available to the public.",
          "Access to and/or use of this website attributes the status of USER, who accepts, from such access and/or use, the general conditions of use reflected herein. These conditions shall apply regardless of any mandatory general contracting conditions."
        ]
      },
      {
        h: "Use of the portal",
        ps: [
          "Burguar Dreams provides access to information, services and data (hereinafter, \"the contents\") on the Internet belonging to Burguar Dreams S.L. or its licensors, to which the USER may have access.",
          "The USER assumes responsibility for the use of the website. This responsibility extends to the registration required to access certain services or content. In such registration, the USER must provide truthful and lawful information. As a result of this registration, a password may be assigned, for which the USER shall be responsible, undertaking to use it diligently and confidentially.",
          "The USER undertakes to make appropriate use of the contents and services that Burguar Dreams offers through its website and, in particular, not to use them to:"
        ],
        list: [
          "Engage in illicit, illegal activities or activities contrary to good faith and public order.",
          "Disseminate racist, xenophobic, illegal pornographic content or propaganda that promotes terrorism or violates human rights.",
          "Cause damage to the physical and logical systems of Burguar Dreams, its suppliers or third parties, or introduce computer viruses or any other harmful element.",
          "Attempt to access other users' accounts or manipulate their messages.",
          "Use the website for unauthorised commercial, political or advertising purposes, including sending unsolicited emails."
        ],
        ps2: [
          "Burguar Dreams reserves the right to remove all comments and contributions that violate personal dignity, that are discriminatory, xenophobic, racist, pornographic, that threaten public order or safety, or that are unsuitable for publication. Under no circumstances shall Burguar Dreams be held responsible for opinions expressed by users through forums, chats or other participation tools."
        ]
      },
      {
        h: "Data protection",
        ps: [
          "All matters relating to the data protection policy are contained in the Privacy Policy document, available on the website."
        ]
      },
      {
        h: "Intellectual and industrial property",
        ps: [
          "Burguar Dreams S.L. holds all intellectual and industrial property rights to its website, as well as to the elements contained therein (including but not limited to: images, photographs, texts, trademarks, logos, colour combinations, structure and design, software, etc.), owned by Burguar Dreams S.L. or its licensors.",
          "All rights reserved. In accordance with the provisions of the Intellectual Property Law, the reproduction, distribution and public communication of all or part of the contents of this website for commercial purposes, on any medium and by any technical means, without the express authorisation of Burguar Dreams S.L., is expressly prohibited.",
          "The USER undertakes to respect the intellectual and industrial property rights of Burguar Dreams. The USER may view the elements of the website and print, copy or store them solely and exclusively for personal and private use."
        ]
      },
      {
        h: "Disclaimer of warranties and liability",
        ps: [
          "The USER acknowledges that use of the website, its contents and services is at their sole responsibility. In particular, Burguar Dreams assumes no liability in the following areas:"
        ],
        list: [
          "The availability, quality or interoperability of the website, its services and contents.",
          "Infringement of applicable legislation by the USER or third parties, particularly in matters of intellectual or industrial property.",
          "The existence of malicious codes or harmful elements that could affect the USER's computer system.",
          "Fraudulent access to contents or services by unauthorised third parties.",
          "The accuracy, truthfulness or usefulness of the contents offered. Burguar Dreams will use all reasonable means to provide up-to-date and reliable information.",
          "Damage caused to the USER's computer equipment or arising from failures in telecommunications networks.",
          "Damage arising from force majeure or unforeseeable circumstances."
        ]
      },
      {
        h: "Amendment of this legal notice",
        ps: [
          "Burguar Dreams reserves the right to make, without prior notice, such modifications as it deems appropriate to the website, and may change, remove or add both contents and services and the manner in which they are presented.",
          "The validity of the conditions reflected herein shall depend on their publication and shall remain in force until amended by others duly published."
        ]
      },
      {
        h: "Link policy",
        ps: [
          "Should the website include links or hyperlinks to other websites, Burguar Dreams shall exercise no control over such sites or their contents. Under no circumstances shall Burguar Dreams assume any liability for the content of links to third-party websites, nor guarantee their availability, quality, reliability or accuracy. The inclusion of these external connections shall not imply any association, merger or participation with the linked entities."
        ]
      },
      {
        h: "Right of exclusion",
        ps: [
          "Burguar Dreams reserves the right to deny or withdraw access to the website and/or the services offered without prior notice, on its own initiative or at the request of a third party, to those users who fail to comply with the content of this Legal Notice."
        ]
      },
      {
        h: "General provisions",
        ps: [
          "Burguar Dreams shall pursue any breach of these conditions, as well as any improper use of the website, exercising all civil and criminal actions available under the law."
        ]
      },
      {
        h: "Applicable law and jurisdiction",
        ps: [
          "The relationship between Burguar Dreams and the USER shall be governed by current Spanish legislation. All disputes and claims arising from this Legal Notice shall be resolved by the courts and tribunals of the city of Barcelona."
        ]
      }
    ]
  },
  fr: {
    title: "MENTIONS LÉGALES",
    sections: [
      {
        h: "Données d'identification",
        ps: [
          "Vous visitez le site web de Burguar Dreams, propriété de Burguar Dreams S.L., dont le siège social est situé C/ Can Bruixa, 16, 1ª planta 1º, 08028 Barcelona, Espagne, avec le NIF nº B67209502, inscrite au Registre du Commerce de Barcelone [DONNÉES REGISTRE DU COMMERCE] (désignée dans ledit document « Burguar Dreams »).",
          "Cette activité n'est soumise à aucun régime d'autorisation administrative préalable.",
          "Vous pouvez contacter Burguar Dreams par l'un des moyens suivants :"
        ],
        list: [
          "Téléphone / WhatsApp : 660 68 85 01",
          "Courriel : burguardreams@gmail.com"
        ]
      },
      {
        h: "Hébergement web",
        ps: [
          "Les données d'hébergement web seront communiquées dès qu'elles seront disponibles."
        ]
      },
      {
        h: "Utilisateurs",
        ps: [
          "Les présentes conditions (ci-après, Mentions Légales) ont pour objet de réglementer l'utilisation du site web de Burguar Dreams mis à la disposition du public.",
          "L'accès et/ou l'utilisation de ce site web vous confère la qualité d'UTILISATEUR, qui accepte, dès ledit accès et/ou utilisation, les conditions générales d'utilisation ici reflétées. Ces conditions seront applicables indépendamment des conditions générales de contractualisation qui pourraient être obligatoires."
        ]
      },
      {
        h: "Utilisation du portail",
        ps: [
          "Burguar Dreams fournit l'accès à des informations, services et données (ci-après, « les contenus ») sur Internet appartenant à Burguar Dreams S.L. ou à ses concédants de licence, auxquels l'UTILISATEUR peut avoir accès.",
          "L'UTILISATEUR assume la responsabilité de l'utilisation du site web. Cette responsabilité s'étend à l'inscription nécessaire pour accéder à certains services ou contenus. Lors de cette inscription, l'UTILISATEUR devra fournir des informations véridiques et licites. À la suite de cette inscription, un mot de passe pourra lui être attribué, dont il sera responsable, s'engageant à en faire un usage diligent et confidentiel.",
          "L'UTILISATEUR s'engage à faire un usage approprié des contenus et services que Burguar Dreams propose via son site web et, en particulier, à ne pas les utiliser pour :"
        ],
        list: [
          "Participer à des activités illicites, illégales ou contraires à la bonne foi et à l'ordre public.",
          "Diffuser des contenus ou propagande à caractère raciste, xénophobe, pornographique illégal, promouvant le terrorisme ou violant les droits de l'homme.",
          "Causer des dommages aux systèmes physiques et logiques de Burguar Dreams, de ses fournisseurs ou de tiers, ou introduire des virus informatiques ou tout autre élément nuisible.",
          "Tenter d'accéder aux comptes d'autres utilisateurs ou de manipuler leurs messages.",
          "Utiliser le site web à des fins commerciales, politiques ou publicitaires non autorisées, y compris l'envoi de courriels non sollicités."
        ],
        ps2: [
          "Burguar Dreams se réserve le droit de retirer tous les commentaires et contributions portant atteinte à la dignité de la personne, discriminatoires, xénophobes, racistes, pornographiques, menaçant l'ordre ou la sécurité publics, ou inadaptés à la publication. En aucun cas, Burguar Dreams ne sera responsable des opinions exprimées par les utilisateurs via des forums, chats ou autres outils de participation."
        ]
      },
      {
        h: "Protection des données",
        ps: [
          "Tout ce qui concerne la politique de protection des données est contenu dans le document Politique de Confidentialité, disponible sur le site web."
        ]
      },
      {
        h: "Propriété intellectuelle et industrielle",
        ps: [
          "Burguar Dreams S.L. est titulaire de tous les droits de propriété intellectuelle et industrielle de son site web, ainsi que des éléments qui y sont contenus (à titre indicatif : images, photographies, textes, marques, logos, combinaisons de couleurs, structure et design, logiciels, etc.), propriété de Burguar Dreams S.L. ou de ses concédants de licence.",
          "Tous droits réservés. Conformément aux dispositions de la loi sur la propriété intellectuelle, la reproduction, la distribution et la communication publique de tout ou partie des contenus de ce site web à des fins commerciales, sur tout support et par tout moyen technique, sans l'autorisation expresse de Burguar Dreams S.L., est expressément interdite.",
          "L'UTILISATEUR s'engage à respecter les droits de propriété intellectuelle et industrielle de Burguar Dreams. Il pourra visualiser les éléments du site web et les imprimer, les copier ou les stocker uniquement et exclusivement pour un usage personnel et privé."
        ]
      },
      {
        h: "Exclusion de garanties et responsabilité",
        ps: [
          "L'UTILISATEUR reconnaît que l'utilisation du site web, de ses contenus et services s'effectue sous sa seule responsabilité. En particulier, Burguar Dreams n'assume aucune responsabilité dans les domaines suivants :"
        ],
        list: [
          "La disponibilité, la qualité ou l'interopérabilité du site web, de ses services et contenus.",
          "La violation de la législation en vigueur par l'UTILISATEUR ou des tiers, notamment en matière de propriété intellectuelle ou industrielle.",
          "L'existence de codes malveillants ou d'éléments nuisibles pouvant affecter le système informatique de l'UTILISATEUR.",
          "L'accès frauduleux à des contenus ou services par des tiers non autorisés.",
          "L'exactitude, la véracité ou l'utilité des contenus proposés. Burguar Dreams emploiera tous les moyens raisonnables pour fournir des informations actualisées et fiables.",
          "Les dommages causés aux équipements informatiques de l'UTILISATEUR ou résultant de défaillances des réseaux de télécommunications.",
          "Les dommages résultant de cas fortuit ou de force majeure."
        ]
      },
      {
        h: "Modification des présentes mentions légales",
        ps: [
          "Burguar Dreams se réserve le droit d'effectuer, sans préavis, les modifications qu'elle juge opportunes sur le site web, pouvant changer, supprimer ou ajouter tant les contenus et services que la manière dont ils sont présentés.",
          "La validité des conditions ici reflétées dépendra de leur publication et restera en vigueur jusqu'à leur modification par d'autres dûment publiées."
        ]
      },
      {
        h: "Politique de liens",
        ps: [
          "Si le site web inclut des liens ou hyperliens vers d'autres sites web, Burguar Dreams n'exercera aucun contrôle sur ces sites ni sur leurs contenus. En aucun cas Burguar Dreams n'assumera de responsabilité quant au contenu des liens vers des sites web de tiers, ni ne garantira leur disponibilité, qualité, fiabilité ou exactitude. L'inclusion de ces connexions externes n'impliquera aucune association, fusion ni participation avec les entités liées."
        ]
      },
      {
        h: "Droit d'exclusion",
        ps: [
          "Burguar Dreams se réserve le droit de refuser ou de retirer l'accès au site web et/ou aux services proposés sans préavis, de sa propre initiative ou à la demande d'un tiers, aux utilisateurs ne respectant pas le contenu des présentes Mentions Légales."
        ]
      },
      {
        h: "Dispositions générales",
        ps: [
          "Burguar Dreams poursuivra le non-respect de ces conditions, ainsi que tout usage abusif du site web, en exerçant toutes les actions civiles et pénales qui lui incombent en vertu de la loi."
        ]
      },
      {
        h: "Loi applicable et juridiction",
        ps: [
          "La relation entre Burguar Dreams et l'UTILISATEUR sera régie par la législation espagnole en vigueur. Toutes les controverses et réclamations découlant des présentes Mentions Légales seront résolues par les tribunaux de la ville de Barcelone."
        ]
      }
    ]
  },
  de: {
    title: "IMPRESSUM",
    sections: [
      {
        h: "Identifikationsdaten",
        ps: [
          "Sie besuchen die Website von Burguar Dreams, Eigentum der Burguar Dreams S.L., mit Sitz in C/ Can Bruixa, 16, 1ª planta 1º, 08028 Barcelona, Spanien, mit Steuernummer B67209502, eingetragen im Handelsregister von Barcelona [HANDELSREGISTERDATEN] (in diesem Dokument als «Burguar Dreams» bezeichnet).",
          "Diese Tätigkeit unterliegt keinem Regime der vorherigen behördlichen Genehmigung.",
          "Sie können Burguar Dreams über folgende Wege kontaktieren:"
        ],
        list: [
          "Telefon / WhatsApp: 660 68 85 01",
          "E-Mail: burguardreams@gmail.com"
        ]
      },
      {
        h: "Webhosting",
        ps: [
          "Die Webhosting-Daten werden bereitgestellt, sobald sie verfügbar sind."
        ]
      },
      {
        h: "Nutzer",
        ps: [
          "Diese Bedingungen (im Folgenden Impressum) dienen der Regelung der Nutzung der Website von Burguar Dreams, die der Öffentlichkeit zur Verfügung gestellt wird.",
          "Der Zugriff auf und/oder die Nutzung dieser Website verleiht Ihnen die Eigenschaft als NUTZER, der ab diesem Zugriff und/oder dieser Nutzung die hier wiedergegebenen allgemeinen Nutzungsbedingungen akzeptiert. Diese Bedingungen gelten unabhängig von allgemeinen Vertragsbedingungen, die verbindlich sein könnten."
        ]
      },
      {
        h: "Nutzung des Portals",
        ps: [
          "Burguar Dreams bietet Zugang zu Informationen, Diensten und Daten (im Folgenden „die Inhalte\") im Internet, die Burguar Dreams S.L. oder deren Lizenzgebern gehören und auf die der NUTZER zugreifen kann.",
          "Der NUTZER übernimmt die Verantwortung für die Nutzung der Website. Diese Verantwortung erstreckt sich auf die für den Zugang zu bestimmten Diensten oder Inhalten erforderliche Registrierung. Bei dieser Registrierung muss der NUTZER wahrheitsgemäße und rechtmäßige Informationen angeben. Im Rahmen dieser Registrierung kann ein Passwort zugewiesen werden, für das der NUTZER verantwortlich ist und das er sorgfältig und vertraulich nutzen wird.",
          "Der NUTZER verpflichtet sich, die Inhalte und Dienste, die Burguar Dreams über seine Website anbietet, angemessen zu nutzen und insbesondere diese nicht zu verwenden, um:"
        ],
        list: [
          "An rechtswidrigen, illegalen oder gegen Treu und Glauben und die öffentliche Ordnung verstoßenden Aktivitäten teilzunehmen.",
          "Rassistische, fremdenfeindliche, illegale pornografische Inhalte oder Propaganda zu verbreiten, die Terrorismus fördern oder Menschenrechte verletzen.",
          "Schäden an physischen und logischen Systemen von Burguar Dreams, deren Anbietern oder Dritten zu verursachen oder Computerviren oder andere schädliche Elemente einzuführen.",
          "Auf Konten anderer Nutzer zuzugreifen oder deren Nachrichten zu manipulieren.",
          "Die Website für nicht autorisierte kommerzielle, politische oder werbliche Zwecke zu nutzen, einschließlich des Versands unerwünschter E-Mails."
        ],
        ps2: [
          "Burguar Dreams behält sich das Recht vor, alle Kommentare und Beiträge zu entfernen, die gegen die Würde der Person verstoßen, diskriminierend, fremdenfeindlich, rassistisch oder pornografisch sind, die öffentliche Ordnung oder Sicherheit bedrohen oder für die Veröffentlichung ungeeignet sind. Burguar Dreams haftet in keinem Fall für Meinungen, die Nutzer über Foren, Chats oder andere Beteiligungsinstrumente äußern."
        ]
      },
      {
        h: "Datenschutz",
        ps: [
          "Alles, was die Datenschutzrichtlinie betrifft, ist im Dokument Datenschutzerklärung enthalten, das auf der Website verfügbar ist."
        ]
      },
      {
        h: "Geistiges und gewerbliches Eigentum",
        ps: [
          "Burguar Dreams S.L. ist Inhaberin aller Rechte des geistigen und gewerblichen Eigentums an ihrer Website sowie an den darin enthaltenen Elementen (beispielhaft: Bilder, Fotografien, Texte, Marken, Logos, Farbkombinationen, Struktur und Design, Software usw.), Eigentum von Burguar Dreams S.L. oder deren Lizenzgebern.",
          "Alle Rechte vorbehalten. Gemäß den Bestimmungen des Urheberrechtsgesetzes ist die Vervielfältigung, Verbreitung und öffentliche Wiedergabe ganz oder teilweise der Inhalte dieser Website zu kommerziellen Zwecken auf jedem Medium und mit jedem technischen Verfahren ohne ausdrückliche Genehmigung von Burguar Dreams S.L. ausdrücklich untersagt.",
          "Der NUTZER verpflichtet sich, die Rechte des geistigen und gewerblichen Eigentums von Burguar Dreams zu respektieren. Er darf die Elemente der Website ansehen und ausschließlich für den persönlichen und privaten Gebrauch ausdrucken, kopieren oder speichern."
        ]
      },
      {
        h: "Ausschluss von Garantien und Haftung",
        ps: [
          "Der NUTZER erkennt an, dass die Nutzung der Website, ihrer Inhalte und Dienste in seiner alleinigen Verantwortung erfolgt. Insbesondere übernimmt Burguar Dreams keine Haftung in folgenden Bereichen:"
        ],
        list: [
          "Die Verfügbarkeit, Qualität oder Interoperabilität der Website, ihrer Dienste und Inhalte.",
          "Die Verletzung geltender Gesetze durch den NUTZER oder Dritte, insbesondere im Bereich des geistigen oder gewerblichen Eigentums.",
          "Das Vorhandensein bösartiger Codes oder schädlicher Elemente, die das Computersystem des NUTZERS beeinträchtigen könnten.",
          "Den betrügerischen Zugang zu Inhalten oder Diensten durch nicht autorisierte Dritte.",
          "Die Genauigkeit, Wahrhaftigkeit oder Nützlichkeit der angebotenen Inhalte. Burguar Dreams wird alle angemessenen Mittel einsetzen, um aktuelle und zuverlässige Informationen bereitzustellen.",
          "Schäden an der Computerausrüstung des NUTZERS oder infolge von Ausfällen in Telekommunikationsnetzen.",
          "Schäden infolge höherer Gewalt oder unvorhersehbarer Umstände."
        ]
      },
      {
        h: "Änderung dieses Impressums",
        ps: [
          "Burguar Dreams behält sich das Recht vor, ohne vorherige Ankündigung die Änderungen vorzunehmen, die sie für angemessen hält, und sowohl Inhalte und Dienste als auch deren Darstellung zu ändern, zu entfernen oder hinzuzufügen.",
          "Die Gültigkeit der hier wiedergegebenen Bedingungen hängt von ihrer Veröffentlichung ab und bleibt in Kraft, bis sie durch andere ordnungsgemäß veröffentlichte Bedingungen geändert werden."
        ]
      },
      {
        h: "Link-Richtlinie",
        ps: [
          "Falls die Website Links oder Hyperlinks zu anderen Websites enthält, übt Burguar Dreams keine Kontrolle über diese Websites oder deren Inhalte aus. Burguar Dreams übernimmt in keinem Fall Haftung für den Inhalt von Links zu Websites Dritter und garantiert weder deren Verfügbarkeit, Qualität, Zuverlässigkeit noch Genauigkeit. Die Aufnahme dieser externen Verbindungen impliziert keine Art von Assoziation, Fusion oder Beteiligung an den verlinkten Unternehmen."
        ]
      },
      {
        h: "Ausschlussrecht",
        ps: [
          "Burguar Dreams behält sich das Recht vor, den Zugang zur Website und/oder zu den angebotenen Diensten ohne vorherige Ankündigung, auf eigene Initiative oder auf Anfrage eines Dritten, Nutzern zu verweigern oder zu entziehen, die den Inhalt dieses Impressums nicht einhalten."
        ]
      },
      {
        h: "Allgemeines",
        ps: [
          "Burguar Dreams wird Verstöße gegen diese Bedingungen sowie jede missbräuchliche Nutzung der Website verfolgen und alle ihr gesetzlich zustehenden zivil- und strafrechtlichen Maßnahmen ergreifen."
        ]
      },
      {
        h: "Anwendbares Recht und Gerichtsstand",
        ps: [
          "Das Verhältnis zwischen Burguar Dreams und dem NUTZER unterliegt dem geltenden spanischen Recht. Alle Streitigkeiten und Ansprüche aus diesem Impressum werden von den Gerichten der Stadt Barcelona entschieden."
        ]
      }
    ]
  },
  it: {
    title: "NOTE LEGALI",
    sections: [
      {
        h: "Dati identificativi",
        ps: [
          "State visitando il sito web di Burguar Dreams, di proprietà di Burguar Dreams S.L., con sede legale in C/ Can Bruixa, 16, 1ª planta 1º, 08028 Barcelona, Spagna, con P. IVA n. B67209502, iscritta nel Registro delle Imprese di Barcellona [DATI REGISTRO DELLE IMPRESE] (indicata in detto documento come «Burguar Dreams»).",
          "Questa attività non è soggetta ad alcun regime di autorizzazione amministrativa preventiva.",
          "Potete contattare Burguar Dreams tramite uno dei seguenti mezzi:"
        ],
        list: [
          "Telefono / WhatsApp: 660 68 85 01",
          "Email: burguardreams@gmail.com"
        ]
      },
      {
        h: "Hosting web",
        ps: [
          "I dati di hosting web saranno forniti non appena disponibili."
        ]
      },
      {
        h: "Utenti",
        ps: [
          "Le presenti condizioni (di seguito, Note Legali) hanno lo scopo di regolamentare l'uso del sito web di Burguar Dreams reso disponibile al pubblico.",
          "L'accesso e/o l'uso di questo sito web attribuisce la qualifica di UTENTE, che accetta, fin da detto accesso e/o uso, le condizioni generali di utilizzo qui riportate. Tali condizioni saranno applicabili indipendentemente dalle condizioni generali di contrattazione che potrebbero essere obbligatorie."
        ]
      },
      {
        h: "Uso del portale",
        ps: [
          "Burguar Dreams fornisce l'accesso a informazioni, servizi e dati (di seguito, «i contenuti») su Internet appartenenti a Burguar Dreams S.L. o ai suoi licenzianti, a cui l'UTENTE può accedere.",
          "L'UTENTE assume la responsabilità dell'uso del sito web. Tale responsabilità si estende alla registrazione necessaria per accedere a determinati servizi o contenuti. In detta registrazione, l'UTENTE dovrà fornire informazioni veritiere e lecite. A seguito di questa registrazione, potrà essere assegnata una password, di cui sarà responsabile, impegnandosi a farne un uso diligente e confidenziale.",
          "L'UTENTE si impegna a fare un uso appropriato dei contenuti e dei servizi che Burguar Dreams offre tramite il proprio sito web e, in particolare, a non utilizzarli per:"
        ],
        list: [
          "Partecipare ad attività illecite, illegali o contrarie alla buona fede e all'ordine pubblico.",
          "Diffondere contenuti o propaganda di carattere razzista, xenofobo, pornografico illegale, che promuova il terrorismo o violi i diritti umani.",
          "Causare danni ai sistemi fisici e logici di Burguar Dreams, dei suoi fornitori o di terzi, o introdurre virus informatici o qualsiasi altro elemento dannoso.",
          "Tentare di accedere agli account di altri utenti o manipolarne i messaggi.",
          "Utilizzare il sito web per finalità commerciali, politiche o pubblicitarie non autorizzate, incluso l'invio di email non richieste."
        ],
        ps2: [
          "Burguar Dreams si riserva il diritto di rimuovere tutti i commenti e i contributi che ledono la dignità della persona, che siano discriminatori, xenofobi, razzisti, pornografici, che minaccino l'ordine o la sicurezza pubblica, o che non siano idonei alla pubblicazione. In nessun caso Burguar Dreams sarà responsabile delle opinioni espresse dagli utenti tramite forum, chat o altri strumenti di partecipazione."
        ]
      },
      {
        h: "Protezione dei dati",
        ps: [
          "Tutto ciò che riguarda la politica di protezione dei dati è contenuto nel documento Informativa sulla Privacy, disponibile sul sito web."
        ]
      },
      {
        h: "Proprietà intellettuale e industriale",
        ps: [
          "Burguar Dreams S.L. è titolare di tutti i diritti di proprietà intellettuale e industriale del proprio sito web, nonché degli elementi in esso contenuti (a titolo esemplificativo: immagini, fotografie, testi, marchi, loghi, combinazioni di colori, struttura e design, software, ecc.), di proprietà di Burguar Dreams S.L. o dei suoi licenzianti.",
          "Tutti i diritti riservati. Conformemente a quanto disposto dalla Legge sulla Proprietà Intellettuale, è espressamente vietata la riproduzione, distribuzione e comunicazione al pubblico, totale o parziale, dei contenuti di questo sito web a fini commerciali, su qualsiasi supporto e con qualsiasi mezzo tecnico, senza l'autorizzazione espressa di Burguar Dreams S.L.",
          "L'UTENTE si impegna a rispettare i diritti di proprietà intellettuale e industriale di Burguar Dreams. Potrà visualizzare gli elementi del sito web e stamparli, copiarli o archiviarli unicamente ed esclusivamente per uso personale e privato."
        ]
      },
      {
        h: "Esclusione di garanzie e responsabilità",
        ps: [
          "L'UTENTE riconosce che l'uso del sito web, dei suoi contenuti e servizi avviene sotto la propria esclusiva responsabilità. In particolare, Burguar Dreams non assume responsabilità nei seguenti ambiti:"
        ],
        list: [
          "La disponibilità, qualità o interoperabilità del sito web, dei suoi servizi e contenuti.",
          "La violazione della legislazione vigente da parte dell'UTENTE o di terzi, in particolare in materia di proprietà intellettuale o industriale.",
          "L'esistenza di codici maligni o elementi dannosi che potrebbero influire sul sistema informatico dell'UTENTE.",
          "L'accesso fraudolento a contenuti o servizi da parte di terzi non autorizzati.",
          "L'accuratezza, veridicità o utilità dei contenuti offerti. Burguar Dreams impiegherà tutti i mezzi ragionevoli per fornire informazioni aggiornate e affidabili.",
          "Danni causati alle apparecchiature informatiche dell'UTENTE o derivanti da guasti nelle reti di telecomunicazione.",
          "Danni derivanti da caso fortuito o forza maggiore."
        ]
      },
      {
        h: "Modifica delle presenti note legali",
        ps: [
          "Burguar Dreams si riserva il diritto di apportare, senza preavviso, le modifiche che ritenga opportune al sito web, potendo cambiare, eliminare o aggiungere sia i contenuti e servizi sia la forma in cui vengono presentati.",
          "La validità delle condizioni qui riportate dipenderà dalla loro pubblicazione e resteranno in vigore fino a quando non saranno modificate da altre debitamente pubblicate."
        ]
      },
      {
        h: "Politica sui link",
        ps: [
          "Qualora il sito web includa link o collegamenti ipertestuali ad altri siti web, Burguar Dreams non eserciterà alcun controllo su tali siti né sui loro contenuti. In nessun caso Burguar Dreams assumerà responsabilità per il contenuto dei link a siti web di terzi, né garantirà la loro disponibilità, qualità, affidabilità o accuratezza. L'inclusione di tali collegamenti esterni non implicherà alcun tipo di associazione, fusione o partecipazione con le entità collegate."
        ]
      },
      {
        h: "Diritto di esclusione",
        ps: [
          "Burguar Dreams si riserva il diritto di negare o revocare l'accesso al sito web e/o ai servizi offerti senza preavviso, su propria iniziativa o su richiesta di terzi, agli utenti che non rispettino il contenuto delle presenti Note Legali."
        ]
      },
      {
        h: "Disposizioni generali",
        ps: [
          "Burguar Dreams perseguirà il mancato rispetto di queste condizioni, nonché qualsiasi uso improprio del sito web, esercitando tutte le azioni civili e penali previste dalla legge."
        ]
      },
      {
        h: "Legge applicabile e giurisdizione",
        ps: [
          "Il rapporto tra Burguar Dreams e l'UTENTE sarà regolato dalla normativa spagnola vigente. Tutte le controversie e i reclami derivanti dalle presenti Note Legali saranno risolti dai tribunali della città di Barcellona."
        ]
      }
    ]
  }
};

/* ─── PRIVACY POLICY ─── */
const PRIVACY_TEXT = {
  es: {
    title: "POLÍTICA DE PRIVACIDAD",
    sections: [
      {
        ps: [
          "Burguar Dreams S.L., con el fin de proteger los derechos individuales y ser transparente con el Usuario, ha establecido una política que incluye todos los tratamientos de datos, las finalidades perseguidas, la legitimidad de los mismos y los instrumentos disponibles para que el Usuario pueda ejercer sus derechos.",
          "La navegación por este sitio web implica la aceptación total de las siguientes disposiciones. Se acepta el uso de cookies. Si no está de acuerdo, envíe un correo electrónico a <a href=\"mailto:burguardreams@gmail.com\">burguardreams@gmail.com</a>.",
          "La versión actualizada de esta política de privacidad es la única aplicable durante el tiempo que se utilice el sitio web, hasta que no exista otra versión que la reemplace.",
          "Para obtener información adicional sobre la protección de datos personales, le invitamos a consultar la página web de la <a href=\"https://www.aepd.es\" target=\"_blank\" rel=\"noopener noreferrer\">AEPD (Agencia Española de Protección de Datos)</a>."
        ]
      },
      {
        h: "Recopilación de datos",
        ps: [
          "Sus datos son recopilados por Burguar Dreams S.L.",
          "Los datos personales son toda información relativa a una persona física identificada o identificable. Se entiende por persona identificable aquella que puede ser identificada, directa o indirectamente, especialmente mediante un nombre, un número de identificación (DNI, NIF, NIE, pasaporte) o uno o varios elementos específicos de su identidad física, fisiológica, genética, psíquica, económica, cultural o social.",
          "Los datos que generalmente se recopilarán son: nombre y apellidos, dirección, correo electrónico, número de teléfono, fecha de nacimiento y situación laboral e ingresos, en el contexto de solicitudes de información sobre alquiler de apartamentos. Se podrán recopilar otros tipos de datos, informando al usuario en cada caso."
        ]
      },
      {
        h: "¿Con qué finalidad se tratan sus datos personales?",
        ps: [
          "La finalidad del tratamiento de los datos personales que se puedan recabar es su uso principal por parte de Burguar Dreams S.L. para la gestión de su relación con usted, para poder ofrecerle apartamentos y servicios acordes a sus necesidades, para mejorar su experiencia como usuario y para tramitar sus solicitudes de información o reserva. No se tomarán decisiones automatizadas basadas en su perfil.",
          "Los datos facilitados se conservarán mientras se mantenga la relación comercial, siempre que el interesado no solicite su supresión, o durante los años necesarios para cumplir con las obligaciones legales."
        ]
      },
      {
        h: "¿Cuál es la legitimidad del tratamiento de sus datos?",
        ps: [
          "La base legal para el tratamiento de sus datos personales es:"
        ],
        list: [
          "El interés legítimo de Burguar Dreams S.L.",
          "El consentimiento del usuario o cliente para el tratamiento de sus datos."
        ]
      },
      {
        h: "¿A qué destinatarios se comunicarán los datos?",
        ps: [
          "Los datos personales del Usuario podrán ser comunicados eventualmente a terceros relacionados con Burguar Dreams S.L. por contrato para la realización de tareas necesarias para la gestión de su solicitud, sin necesidad de autorización expresa.",
          "También cuando fuera necesario comunicarse con las autoridades en caso de que el Usuario hubiera realizado acciones contrarias a la Ley o infringido el contenido del Aviso Legal.",
          "Los datos personales del Usuario no serán transferidos a terceros países ni a organizaciones internacionales, salvo que el Usuario sea debidamente informado de dicha transferencia, sus condiciones y destinatario.",
          "Cuando determinados datos sean obligatorios para acceder a funcionalidades específicas del sitio web, Burguar Dreams S.L. indicará este carácter obligatorio en el momento de la recogida."
        ]
      },
      {
        h: "Cookies",
        ps: [
          "Al navegar por este sitio web, las cookies de Burguar Dreams S.L. y/o de terceros pueden instalarse en su dispositivo. Durante la primera navegación, aparecerá un banner informativo sobre el uso de cookies.",
          "Al continuar la navegación, el Usuario se considerará informado y habrá aceptado el uso de dichas cookies. El consentimiento otorgado tendrá una validez de trece meses.",
          "Para obtener más información, consulte nuestra Política de Cookies."
        ]
      },
      {
        h: "Derechos del usuario",
        ps: [
          "Se informa al usuario de la posibilidad de ejercer sus derechos de acceso, rectificación, cancelación y oposición. Asimismo, toda persona tiene derecho a la limitación del tratamiento de sus datos personales, a la supresión de los datos transmitidos al responsable del tratamiento y a la portabilidad de sus datos.",
          "El usuario tiene la posibilidad de presentar una reclamación ante la <a href=\"https://www.aepd.es\" target=\"_blank\" rel=\"noopener noreferrer\">AEPD (Agencia Española de Protección de Datos)</a> cuando no haya obtenido una solución satisfactoria en el ejercicio de sus derechos.",
          "Salvo que el Usuario se oponga, mediante el envío de un correo electrónico a <a href=\"mailto:burguardreams@gmail.com\">burguardreams@gmail.com</a>, sus datos podrán ser utilizados para enviarle información sobre apartamentos y servicios de Burguar Dreams S.L.",
          "Los datos facilitados se conservarán mientras se mantenga la relación comercial o durante los años necesarios para cumplir con las obligaciones legales.",
          "El Usuario es responsable de que la información proporcionada a través de este sitio web sea veraz, respondiendo de la exactitud de todos los datos comunicados y manteniéndolos actualizados para reflejar su situación real.",
          "Esta información será almacenada y gestionada con la debida confidencialidad, aplicando las medidas de seguridad informática necesarias para evitar el acceso o uso indebido de sus datos, su manipulación, deterioro o pérdida.",
          "Sin embargo, el Usuario debe tener en cuenta que la seguridad de los sistemas informáticos nunca es absoluta. Al proporcionar datos personales en línea, dicha información puede ser recopilada sin su consentimiento y procesada por terceros no autorizados. Burguar Dreams S.L. declina cualquier responsabilidad por las consecuencias de dichos actos si el Usuario publicó la información voluntariamente.",
          "Podrá ejercer estos derechos mediante solicitud escrita dirigida a:",
          "<strong>Burguar Dreams S.L.</strong><br>C/ Can Bruixa, 16, 1ª planta 1º<br>08028 Barcelona",
          "O por correo electrónico a: <a href=\"mailto:burguardreams@gmail.com\">burguardreams@gmail.com</a>, adjuntando copia del DNI o documento equivalente.",
          "Estas solicitudes serán atendidas en el plazo de un mes, prorrogable a dos meses si la complejidad o el número de solicitudes así lo requiere, sin perjuicio de la obligación de conservar determinados datos en los plazos legales.",
          "Asimismo, los usuarios que lo soliciten tienen la posibilidad de organizar el destino de sus datos tras su fallecimiento."
        ]
      }
    ]
  },
  ca: {
    title: "POLÍTICA DE PRIVACITAT",
    sections: [
      {
        ps: [
          "Burguar Dreams S.L., amb la finalitat de protegir els drets individuals i ser transparent amb l'Usuari, ha establert una política que inclou tots els tractaments de dades, les finalitats perseguides, la legitimació d'aquests i els instruments disponibles perquè l'Usuari pugui exercir els seus drets.",
          "La navegació per aquest lloc web implica l'acceptació total de les disposicions següents. S'accepta l'ús de galetes. Si no hi esteu d'acord, envieu un correu electrònic a <a href=\"mailto:burguardreams@gmail.com\">burguardreams@gmail.com</a>.",
          "La versió actualitzada d'aquesta política de privacitat és l'única aplicable durant el temps que s'utilitzi el lloc web, fins que no n'existeixi una altra versió que la substitueixi.",
          "Per obtenir informació addicional sobre la protecció de dades personals, us convidem a consultar la pàgina web de l'<a href=\"https://www.aepd.es\" target=\"_blank\" rel=\"noopener noreferrer\">AEPD (Agència Espanyola de Protecció de Dades)</a>."
        ]
      },
      {
        h: "Recollida de dades",
        ps: [
          "Les vostres dades són recollides per Burguar Dreams S.L.",
          "Les dades personals són tota informació relativa a una persona física identificada o identificable. S'entén per persona identificable aquella que pot ser identificada, directa o indirectament, especialment mitjançant un nom, un número d'identificació (DNI, NIF, NIE, passaport) o un o diversos elements específics de la seva identitat física, fisiològica, genètica, psíquica, econòmica, cultural o social.",
          "Les dades que generalment es recolliran són: nom i cognoms, adreça, correu electrònic, número de telèfon, data de naixement i situació laboral i ingressos, en el context de sol·licituds d'informació sobre lloguer d'apartaments. Es podran recollir altres tipus de dades, informant l'usuari en cada cas."
        ]
      },
      {
        h: "Amb quina finalitat es tracten les vostres dades personals?",
        ps: [
          "La finalitat del tractament de les dades personals que es puguin recaptar és el seu ús principal per part de Burguar Dreams S.L. per a la gestió de la vostra relació amb vosaltres, per poder oferir-vos apartaments i serveis acords a les vostres necessitats, per millorar la vostra experiència com a usuari i per tramitar les vostres sol·licituds d'informació o reserva. No es prendran decisions automatitzades basades en el vostre perfil.",
          "Les dades facilitades es conservaran mentre es mantingui la relació comercial, sempre que l'interessat no sol·liciti la seva supressió, o durant els anys necessaris per complir amb les obligacions legals."
        ]
      },
      {
        h: "Quina és la legitimació del tractament de les vostres dades?",
        ps: [
          "La base legal per al tractament de les vostres dades personals és:"
        ],
        list: [
          "L'interès legítim de Burguar Dreams S.L.",
          "El consentiment de l'usuari o client per al tractament de les seves dades."
        ]
      },
      {
        h: "A quins destinataris es comunicaran les dades?",
        ps: [
          "Les dades personals de l'Usuari podran ser comunicades eventualment a tercers relacionats amb Burguar Dreams S.L. per contracte per a la realització de tasques necessàries per a la gestió de la seva sol·licitud, sense necessitat d'autorització expressa.",
          "També quan calgués comunicar-se amb les autoritats en cas que l'Usuari hagués realitzat accions contràries a la Llei o infringit el contingut de l'Avís Legal.",
          "Les dades personals de l'Usuari no seran transferides a tercers països ni a organitzacions internacionals, llevat que l'Usuari sigui degudament informat d'aquesta transferència, les seves condicions i destinatari.",
          "Quan determinades dades siguin obligatòries per accedir a funcionalitats específiques del lloc web, Burguar Dreams S.L. indicarà aquest caràcter obligatori en el moment de la recollida."
        ]
      },
      {
        h: "Galetes",
        ps: [
          "En navegar per aquest lloc web, les galetes de Burguar Dreams S.L. i/o de tercers poden instal·lar-se al vostre dispositiu. Durant la primera navegació, apareixerà un banner informatiu sobre l'ús de galetes.",
          "En continuar la navegació, l'Usuari es considerarà informat i haurà acceptat l'ús d'aquestes galetes. El consentiment atorgat tindrà una validesa de tretze mesos.",
          "Per obtenir més informació, consulteu la nostra Política de Galetes."
        ]
      },
      {
        h: "Drets de l'usuari",
        ps: [
          "S'informa l'usuari de la possibilitat d'exercir els seus drets d'accés, rectificació, cancel·lació i oposició. Així mateix, tota persona té dret a la limitació del tractament de les seves dades personals, a la supressió de les dades transmeses al responsable del tractament i a la portabilitat de les seves dades.",
          "L'usuari té la possibilitat de presentar una reclamació davant l'<a href=\"https://www.aepd.es\" target=\"_blank\" rel=\"noopener noreferrer\">AEPD (Agència Espanyola de Protecció de Dades)</a> quan no hagi obtingut una solució satisfactòria en l'exercici dels seus drets.",
          "Llevat que l'Usuari s'oposi, mitjançant l'enviament d'un correu electrònic a <a href=\"mailto:burguardreams@gmail.com\">burguardreams@gmail.com</a>, les seves dades podran ser utilitzades per enviar-li informació sobre apartaments i serveis de Burguar Dreams S.L.",
          "Les dades facilitades es conservaran mentre es mantingui la relació comercial o durant els anys necessaris per complir amb les obligacions legals.",
          "L'Usuari és responsable que la informació proporcionada a través d'aquest lloc web sigui verídica, responent de l'exactitud de totes les dades comunicades i mantenint-les actualitzades per reflectir la seva situació real.",
          "Aquesta informació serà emmagatzemada i gestionada amb la deguda confidencialitat, aplicant les mesures de seguretat informàtica necessàries per evitar l'accés o ús indegut de les seves dades, la seva manipulació, deteriorament o pèrdua.",
          "Tanmateix, l'Usuari ha de tenir en compte que la seguretat dels sistemes informàtics mai és absoluta. En proporcionar dades personals en línia, aquesta informació pot ser recollida sense el seu consentiment i processada per tercers no autoritzats. Burguar Dreams S.L. declina qualsevol responsabilitat per les conseqüències d'aquests actes si l'Usuari va publicar la informació voluntàriament.",
          "Podrà exercir aquests drets mitjançant sol·licitud escrita dirigida a:",
          "<strong>Burguar Dreams S.L.</strong><br>C/ Can Bruixa, 16, 1ª planta 1º<br>08028 Barcelona",
          "O per correu electrònic a: <a href=\"mailto:burguardreams@gmail.com\">burguardreams@gmail.com</a>, adjuntant còpia del DNI o document equivalent.",
          "Aquestes sol·licituds seran ateses en el termini d'un mes, prorrogable a dos mesos si la complexitat o el nombre de sol·licituds ho requereixen, sense perjudici de l'obligació de conservar determinades dades en els terminis legals.",
          "Així mateix, els usuaris que ho sol·licitin tenen la possibilitat d'organitzar el destí de les seves dades després del seu defunció."
        ]
      }
    ]
  },
  en: {
    title: "PRIVACY POLICY",
    sections: [
      {
        ps: [
          "Burguar Dreams S.L., in order to protect individual rights and be transparent with the User, has established a policy that includes all data processing activities, the purposes pursued, their legal basis and the instruments available for the User to exercise their rights.",
          "Browsing this website implies full acceptance of the following provisions. The use of cookies is accepted. If you do not agree, please send an email to <a href=\"mailto:burguardreams@gmail.com\">burguardreams@gmail.com</a>.",
          "The updated version of this privacy policy is the only one applicable for as long as the website is used, until another version replaces it.",
          "For additional information on personal data protection, we invite you to visit the website of the <a href=\"https://www.aepd.es\" target=\"_blank\" rel=\"noopener noreferrer\">AEPD (Spanish Data Protection Agency)</a>."
        ]
      },
      {
        h: "Data collection",
        ps: [
          "Your data is collected by Burguar Dreams S.L.",
          "Personal data is any information relating to an identified or identifiable natural person. An identifiable person is one who can be identified, directly or indirectly, in particular by reference to a name, an identification number (ID card, tax ID, foreigner ID, passport) or one or more specific elements of their physical, physiological, genetic, mental, economic, cultural or social identity.",
          "The data generally collected includes: name and surname, address, email, telephone number, date of birth and employment status and income, in the context of requests for information about apartment rentals. Other types of data may be collected, informing the user in each case."
        ]
      },
      {
        h: "For what purpose are your personal data processed?",
        ps: [
          "The purpose of processing personal data that may be collected is primarily for Burguar Dreams S.L. to manage its relationship with you, to offer apartments and services suited to your needs, to improve your user experience and to process your information or booking requests. No automated decisions will be made based on your profile.",
          "The data provided will be retained for as long as the commercial relationship is maintained, provided the data subject does not request its deletion, or for the years necessary to comply with legal obligations."
        ]
      },
      {
        h: "What is the legal basis for processing your data?",
        ps: [
          "The legal basis for processing your personal data is:"
        ],
        list: [
          "The legitimate interest of Burguar Dreams S.L.",
          "The consent of the user or client for the processing of their data."
        ]
      },
      {
        h: "To whom will the data be disclosed?",
        ps: [
          "The User's personal data may eventually be disclosed to third parties related to Burguar Dreams S.L. by contract for the performance of tasks necessary for the management of their request, without the need for express authorisation.",
          "Also when it is necessary to communicate with the authorities in the event that the User has carried out actions contrary to the Law or infringed the content of the Legal Notice.",
          "The User's personal data will not be transferred to third countries or international organisations, unless the User is duly informed of such transfer, its conditions and recipient.",
          "When certain data is mandatory to access specific functionalities of the website, Burguar Dreams S.L. will indicate this mandatory nature at the time of collection."
        ]
      },
      {
        h: "Cookies",
        ps: [
          "When browsing this website, cookies from Burguar Dreams S.L. and/or third parties may be installed on your device. During the first visit, an informative banner about the use of cookies will appear.",
          "By continuing to browse, the User shall be deemed informed and to have accepted the use of such cookies. The consent given shall be valid for thirteen months.",
          "For more information, please see our Cookie Policy."
        ]
      },
      {
        h: "User rights",
        ps: [
          "The user is informed of the possibility of exercising their rights of access, rectification, erasure and objection. Likewise, every person has the right to restriction of processing of their personal data, to erasure of data transmitted to the data controller and to data portability.",
          "The user has the possibility of filing a complaint with the <a href=\"https://www.aepd.es\" target=\"_blank\" rel=\"noopener noreferrer\">AEPD (Spanish Data Protection Agency)</a> when they have not obtained a satisfactory solution in the exercise of their rights.",
          "Unless the User objects, by sending an email to <a href=\"mailto:burguardreams@gmail.com\">burguardreams@gmail.com</a>, their data may be used to send them information about apartments and services of Burguar Dreams S.L.",
          "The data provided will be retained for as long as the commercial relationship is maintained or for the years necessary to comply with legal obligations.",
          "The User is responsible for ensuring that the information provided through this website is truthful, answering for the accuracy of all data communicated and keeping it updated to reflect their actual situation.",
          "This information will be stored and managed with due confidentiality, applying the necessary IT security measures to prevent unauthorised access or use of their data, its manipulation, deterioration or loss.",
          "However, the User should bear in mind that the security of computer systems is never absolute. When providing personal data online, such information may be collected without their consent and processed by unauthorised third parties. Burguar Dreams S.L. disclaims any liability for the consequences of such acts if the User published the information voluntarily.",
          "You may exercise these rights by written request addressed to:",
          "<strong>Burguar Dreams S.L.</strong><br>C/ Can Bruixa, 16, 1ª planta 1º<br>08028 Barcelona",
          "Or by email to: <a href=\"mailto:burguardreams@gmail.com\">burguardreams@gmail.com</a>, attaching a copy of your ID card or equivalent document.",
          "These requests will be answered within one month, extendable to two months if the complexity or number of requests so requires, without prejudice to the obligation to retain certain data for the legal periods.",
          "Likewise, users who so request have the possibility of organising the destination of their data after their death."
        ]
      }
    ]
  },
  fr: {
    title: "POLITIQUE DE CONFIDENTIALITÉ",
    sections: [
      {
        ps: [
          "Burguar Dreams S.L., afin de protéger les droits individuels et d'être transparente avec l'Utilisateur, a établi une politique qui inclut tous les traitements de données, les finalités poursuivies, leur légitimité et les instruments disponibles pour que l'Utilisateur puisse exercer ses droits.",
          "La navigation sur ce site web implique l'acceptation totale des dispositions suivantes. L'utilisation de cookies est acceptée. Si vous n'êtes pas d'accord, veuillez envoyer un courriel à <a href=\"mailto:burguardreams@gmail.com\">burguardreams@gmail.com</a>.",
          "La version actualisée de cette politique de confidentialité est la seule applicable pendant toute la durée d'utilisation du site web, jusqu'à ce qu'une autre version la remplace.",
          "Pour obtenir des informations complémentaires sur la protection des données personnelles, nous vous invitons à consulter le site web de l'<a href=\"https://www.aepd.es\" target=\"_blank\" rel=\"noopener noreferrer\">AEPD (Agence espagnole de protection des données)</a>."
        ]
      },
      {
        h: "Collecte de données",
        ps: [
          "Vos données sont collectées par Burguar Dreams S.L.",
          "Les données personnelles sont toute information relative à une personne physique identifiée ou identifiable. On entend par personne identifiable celle qui peut être identifiée, directement ou indirectement, notamment par un nom, un numéro d'identification (DNI, NIF, NIE, passeport) ou un ou plusieurs éléments spécifiques de son identité physique, physiologique, génétique, psychique, économique, culturelle ou sociale.",
          "Les données généralement collectées sont : nom et prénom, adresse, courriel, numéro de téléphone, date de naissance et situation professionnelle et revenus, dans le cadre de demandes d'information sur la location d'appartements. D'autres types de données pourront être collectés, l'utilisateur étant informé dans chaque cas."
        ]
      },
      {
        h: "À quelle fin vos données personnelles sont-elles traitées ?",
        ps: [
          "La finalité du traitement des données personnelles pouvant être collectées est leur utilisation principale par Burguar Dreams S.L. pour la gestion de votre relation avec vous, afin de vous proposer des appartements et des services adaptés à vos besoins, pour améliorer votre expérience en tant qu'utilisateur et pour traiter vos demandes d'information ou de réservation. Aucune décision automatisée ne sera prise sur la base de votre profil.",
          "Les données fournies seront conservées tant que la relation commerciale est maintenue, pourvu que l'intéressé ne demande pas leur suppression, ou pendant les années nécessaires pour respecter les obligations légales."
        ]
      },
      {
        h: "Quelle est la base légale du traitement de vos données ?",
        ps: [
          "La base légale du traitement de vos données personnelles est :"
        ],
        list: [
          "L'intérêt légitime de Burguar Dreams S.L.",
          "Le consentement de l'utilisateur ou du client pour le traitement de ses données."
        ]
      },
      {
        h: "À quels destinataires les données seront-elles communiquées ?",
        ps: [
          "Les données personnelles de l'Utilisateur pourront éventuellement être communiquées à des tiers liés à Burguar Dreams S.L. par contrat pour la réalisation de tâches nécessaires à la gestion de sa demande, sans nécessité d'autorisation expresse.",
          "Également lorsqu'il serait nécessaire de communiquer avec les autorités dans le cas où l'Utilisateur aurait réalisé des actions contraires à la Loi ou enfreint le contenu des Mentions Légales.",
          "Les données personnelles de l'Utilisateur ne seront pas transférées vers des pays tiers ni vers des organisations internationales, sauf si l'Utilisateur est dûment informé de ce transfert, de ses conditions et de son destinataire.",
          "Lorsque certaines données sont obligatoires pour accéder à des fonctionnalités spécifiques du site web, Burguar Dreams S.L. indiquera ce caractère obligatoire au moment de la collecte."
        ]
      },
      {
        h: "Cookies",
        ps: [
          "En naviguant sur ce site web, des cookies de Burguar Dreams S.L. et/ou de tiers peuvent être installés sur votre appareil. Lors de la première navigation, une bannière informative sur l'utilisation des cookies apparaîtra.",
          "En poursuivant la navigation, l'Utilisateur sera considéré comme informé et comme ayant accepté l'utilisation de ces cookies. Le consentement accordé aura une validité de treize mois.",
          "Pour plus d'informations, consultez notre Politique de Cookies."
        ]
      },
      {
        h: "Droits de l'utilisateur",
        ps: [
          "L'utilisateur est informé de la possibilité d'exercer ses droits d'accès, de rectification, d'effacement et d'opposition. De même, toute personne a le droit à la limitation du traitement de ses données personnelles, à l'effacement des données transmises au responsable du traitement et à la portabilité de ses données.",
          "L'utilisateur a la possibilité de déposer une réclamation auprès de l'<a href=\"https://www.aepd.es\" target=\"_blank\" rel=\"noopener noreferrer\">AEPD (Agence espagnole de protection des données)</a> lorsqu'il n'a pas obtenu de solution satisfaisante dans l'exercice de ses droits.",
          "Sauf opposition de l'Utilisateur, par l'envoi d'un courriel à <a href=\"mailto:burguardreams@gmail.com\">burguardreams@gmail.com</a>, ses données pourront être utilisées pour lui envoyer des informations sur les appartements et services de Burguar Dreams S.L.",
          "Les données fournies seront conservées tant que la relation commerciale est maintenue ou pendant les années nécessaires pour respecter les obligations légales.",
          "L'Utilisateur est responsable du fait que les informations fournies via ce site web soient véridiques, répondant de l'exactitude de toutes les données communiquées et les maintenant à jour pour refléter sa situation réelle.",
          "Ces informations seront stockées et gérées avec la due confidentialité, en appliquant les mesures de sécurité informatique nécessaires pour éviter l'accès ou l'utilisation abusive de ses données, leur manipulation, détérioration ou perte.",
          "Toutefois, l'Utilisateur doit tenir compte du fait que la sécurité des systèmes informatiques n'est jamais absolue. En fournissant des données personnelles en ligne, ces informations peuvent être collectées sans son consentement et traitées par des tiers non autorisés. Burguar Dreams S.L. décline toute responsabilité pour les conséquences de tels actes si l'Utilisateur a publié les informations volontairement.",
          "Vous pourrez exercer ces droits par demande écrite adressée à :",
          "<strong>Burguar Dreams S.L.</strong><br>C/ Can Bruixa, 16, 1ª planta 1º<br>08028 Barcelona",
          "Ou par courriel à : <a href=\"mailto:burguardreams@gmail.com\">burguardreams@gmail.com</a>, en joignant une copie de la carte d'identité ou document équivalent.",
          "Ces demandes seront traitées dans un délai d'un mois, prorogeable à deux mois si la complexité ou le nombre de demandes l'exige, sans préjudice de l'obligation de conserver certaines données pendant les délais légaux.",
          "De même, les utilisateurs qui le demandent ont la possibilité d'organiser le sort de leurs données après leur décès."
        ]
      }
    ]
  },
  de: {
    title: "DATENSCHUTZERKLÄRUNG",
    sections: [
      {
        ps: [
          "Burguar Dreams S.L. hat zum Schutz der individuellen Rechte und zur Transparenz gegenüber dem Nutzer eine Richtlinie erstellt, die alle Datenverarbeitungen, die verfolgten Zwecke, deren Rechtsgrundlage und die dem Nutzer zur Verfügung stehenden Instrumente zur Ausübung seiner Rechte umfasst.",
          "Das Surfen auf dieser Website impliziert die vollständige Annahme der folgenden Bestimmungen. Die Verwendung von Cookies wird akzeptiert. Wenn Sie nicht einverstanden sind, senden Sie bitte eine E-Mail an <a href=\"mailto:burguardreams@gmail.com\">burguardreams@gmail.com</a>.",
          "Die aktualisierte Version dieser Datenschutzerklärung ist die einzige anwendbare Version für die Dauer der Nutzung der Website, bis eine andere Version sie ersetzt.",
          "Für weitere Informationen zum Schutz personenbezogener Daten laden wir Sie ein, die Website der <a href=\"https://www.aepd.es\" target=\"_blank\" rel=\"noopener noreferrer\">AEPD (Spanische Datenschutzbehörde)</a> zu besuchen."
        ]
      },
      {
        h: "Datenerhebung",
        ps: [
          "Ihre Daten werden von Burguar Dreams S.L. erhoben.",
          "Personenbezogene Daten sind alle Informationen, die sich auf eine identifizierte oder identifizierbare natürliche Person beziehen. Als identifizierbar gilt eine Person, die direkt oder indirekt identifiziert werden kann, insbesondere mittels eines Namens, einer Identifikationsnummer (Personalausweis, Steuernummer, Ausländerausweis, Reisepass) oder eines oder mehrerer spezifischer Merkmale ihrer physischen, physiologischen, genetischen, psychischen, wirtschaftlichen, kulturellen oder sozialen Identität.",
          "Die in der Regel erhobenen Daten sind: Name und Nachname, Adresse, E-Mail, Telefonnummer, Geburtsdatum sowie Beschäftigungsstatus und Einkommen im Rahmen von Anfragen zu Apartmentvermietungen. Es können weitere Datentypen erhoben werden, wobei der Nutzer in jedem Fall informiert wird."
        ]
      },
      {
        h: "Zu welchem Zweck werden Ihre personenbezogenen Daten verarbeitet?",
        ps: [
          "Der Zweck der Verarbeitung der erhobenen personenbezogenen Daten ist deren vorrangige Nutzung durch Burguar Dreams S.L. zur Verwaltung Ihrer Beziehung zu Ihnen, um Ihnen Apartments und Dienstleistungen entsprechend Ihrer Bedürfnisse anzubieten, Ihre Nutzererfahrung zu verbessern und Ihre Informations- oder Buchungsanfragen zu bearbeiten. Es werden keine automatisierten Entscheidungen auf Grundlage Ihres Profils getroffen.",
          "Die bereitgestellten Daten werden aufbewahrt, solange die Geschäftsbeziehung besteht, sofern die betroffene Person nicht deren Löschung verlangt, oder für die zur Erfüllung gesetzlicher Verpflichtungen erforderlichen Jahre."
        ]
      },
      {
        h: "Was ist die Rechtsgrundlage für die Verarbeitung Ihrer Daten?",
        ps: [
          "Die Rechtsgrundlage für die Verarbeitung Ihrer personenbezogenen Daten ist:"
        ],
        list: [
          "Das berechtigte Interesse von Burguar Dreams S.L.",
          "Die Einwilligung des Nutzers oder Kunden zur Verarbeitung seiner Daten."
        ]
      },
      {
        h: "An welche Empfänger werden die Daten weitergegeben?",
        ps: [
          "Die personenbezogenen Daten des Nutzers können gegebenenfalls an Dritte weitergegeben werden, die vertraglich mit Burguar Dreams S.L. verbunden sind, zur Durchführung der für die Bearbeitung seiner Anfrage erforderlichen Aufgaben, ohne dass eine ausdrückliche Genehmigung erforderlich ist.",
          "Ebenso wenn es erforderlich ist, sich an die Behörden zu wenden, falls der Nutzer Handlungen vorgenommen hat, die gegen das Gesetz verstoßen, oder den Inhalt des Impressums verletzt hat.",
          "Die personenbezogenen Daten des Nutzers werden nicht an Drittländer oder internationale Organisationen übermittelt, es sei denn, der Nutzer wird ordnungsgemäß über diese Übermittlung, deren Bedingungen und Empfänger informiert.",
          "Wenn bestimmte Daten für den Zugang zu spezifischen Funktionen der Website obligatorisch sind, weist Burguar Dreams S.L. auf diesen obligatorischen Charakter zum Zeitpunkt der Erhebung hin."
        ]
      },
      {
        h: "Cookies",
        ps: [
          "Beim Surfen auf dieser Website können Cookies von Burguar Dreams S.L. und/oder Dritten auf Ihrem Gerät installiert werden. Beim ersten Besuch erscheint ein informatives Banner über die Verwendung von Cookies.",
          "Durch Fortsetzen des Surfens gilt der Nutzer als informiert und als Einverständnis mit der Verwendung dieser Cookies. Die erteilte Einwilligung gilt dreizehn Monate.",
          "Weitere Informationen finden Sie in unserer Cookie-Richtlinie."
        ]
      },
      {
        h: "Rechte des Nutzers",
        ps: [
          "Der Nutzer wird über die Möglichkeit informiert, seine Rechte auf Auskunft, Berichtigung, Löschung und Widerspruch auszuüben. Ebenso hat jede Person das Recht auf Einschränkung der Verarbeitung ihrer personenbezogenen Daten, auf Löschung der an den Verantwortlichen übermittelten Daten und auf Datenübertragbarkeit.",
          "Der Nutzer hat die Möglichkeit, eine Beschwerde bei der <a href=\"https://www.aepd.es\" target=\"_blank\" rel=\"noopener noreferrer\">AEPD (Spanische Datenschutzbehörde)</a> einzureichen, wenn er bei der Ausübung seiner Rechte keine zufriedenstellende Lösung erhalten hat.",
          "Sofern der Nutzer nicht widerspricht, indem er eine E-Mail an <a href=\"mailto:burguardreams@gmail.com\">burguardreams@gmail.com</a> sendet, können seine Daten verwendet werden, um ihm Informationen über Apartments und Dienstleistungen von Burguar Dreams S.L. zu senden.",
          "Die bereitgestellten Daten werden aufbewahrt, solange die Geschäftsbeziehung besteht oder für die zur Erfüllung gesetzlicher Verpflichtungen erforderlichen Jahre.",
          "Der Nutzer ist dafür verantwortlich, dass die über diese Website bereitgestellten Informationen wahrheitsgemäß sind, haftet für die Richtigkeit aller mitgeteilten Daten und hält diese aktuell, um seine tatsächliche Situation widerzuspiegeln.",
          "Diese Informationen werden vertraulich gespeichert und verwaltet, wobei die erforderlichen IT-Sicherheitsmaßnahmen angewendet werden, um unbefugten Zugriff oder Missbrauch der Daten, deren Manipulation, Verschlechterung oder Verlust zu verhindern.",
          "Der Nutzer muss jedoch berücksichtigen, dass die Sicherheit von Computersystemen niemals absolut ist. Bei der Online-Bereitstellung personenbezogener Daten können diese ohne seine Einwilligung erhoben und von unbefugten Dritten verarbeitet werden. Burguar Dreams S.L. lehnt jede Haftung für die Folgen solcher Handlungen ab, wenn der Nutzer die Informationen freiwillig veröffentlicht hat.",
          "Sie können diese Rechte durch schriftlichen Antrag an folgende Adresse ausüben:",
          "<strong>Burguar Dreams S.L.</strong><br>C/ Can Bruixa, 16, 1ª planta 1º<br>08028 Barcelona",
          "Oder per E-Mail an: <a href=\"mailto:burguardreams@gmail.com\">burguardreams@gmail.com</a>, unter Beifügung einer Kopie des Personalausweises oder eines gleichwertigen Dokuments.",
          "Diese Anträge werden innerhalb eines Monats bearbeitet, verlängerbar auf zwei Monate, wenn die Komplexität oder Anzahl der Anträge dies erfordert, unbeschadet der Verpflichtung, bestimmte Daten für die gesetzlichen Fristen aufzubewahren.",
          "Ebenso haben Nutzer, die dies wünschen, die Möglichkeit, den Bestimmungsort ihrer Daten nach ihrem Tod zu regeln."
        ]
      }
    ]
  },
  it: {
    title: "INFORMATIVA SULLA PRIVACY",
    sections: [
      {
        ps: [
          "Burguar Dreams S.L., al fine di proteggere i diritti individuali e di essere trasparente con l'Utente, ha stabilito una politica che include tutti i trattamenti dei dati, le finalità perseguite, la loro legittimità e gli strumenti disponibili affinché l'Utente possa esercitare i propri diritti.",
          "La navigazione su questo sito web implica l'accettazione totale delle seguenti disposizioni. Si accetta l'uso dei cookie. Se non siete d'accordo, inviate un'email a <a href=\"mailto:burguardreams@gmail.com\">burguardreams@gmail.com</a>.",
          "La versione aggiornata di questa informativa sulla privacy è l'unica applicabile per tutto il tempo in cui si utilizza il sito web, fino a quando non ne esista un'altra versione che la sostituisca.",
          "Per ulteriori informazioni sulla protezione dei dati personali, vi invitiamo a consultare il sito web dell'<a href=\"https://www.aepd.es\" target=\"_blank\" rel=\"noopener noreferrer\">AEPD (Agenzia spagnola per la protezione dei dati)</a>."
        ]
      },
      {
        h: "Raccolta dei dati",
        ps: [
          "I vostri dati sono raccolti da Burguar Dreams S.L.",
          "I dati personali sono qualsiasi informazione relativa a una persona fisica identificata o identificabile. Si intende per persona identificabile colui che può essere identificato, direttamente o indirettamente, in particolare mediante un nome, un numero di identificazione (carta d'identità, codice fiscale, permesso di soggiorno, passaporto) o uno o più elementi specifici della sua identità fisica, fisiologica, genetica, psichica, economica, culturale o sociale.",
          "I dati generalmente raccolti sono: nome e cognome, indirizzo, email, numero di telefono, data di nascita e situazione lavorativa e reddito, nel contesto di richieste di informazioni sul noleggio di appartamenti. Potranno essere raccolti altri tipi di dati, informando l'utente in ogni caso."
        ]
      },
      {
        h: "Per quale finalità vengono trattati i vostri dati personali?",
        ps: [
          "La finalità del trattamento dei dati personali che possono essere raccolti è il loro uso principale da parte di Burguar Dreams S.L. per la gestione del rapporto con voi, per potervi offrire appartamenti e servizi conformi alle vostre esigenze, per migliorare la vostra esperienza come utente e per gestire le vostre richieste di informazioni o prenotazione. Non verranno prese decisioni automatizzate basate sul vostro profilo.",
          "I dati forniti saranno conservati finché si mantiene il rapporto commerciale, sempre che l'interessato non ne richieda la cancellazione, o per gli anni necessari a adempiere agli obblighi legali."
        ]
      },
      {
        h: "Qual è la base giuridica del trattamento dei vostri dati?",
        ps: [
          "La base giuridica per il trattamento dei vostri dati personali è:"
        ],
        list: [
          "Il legittimo interesse di Burguar Dreams S.L.",
          "Il consenso dell'utente o del cliente per il trattamento dei propri dati."
        ]
      },
      {
        h: "A quali destinatari saranno comunicati i dati?",
        ps: [
          "I dati personali dell'Utente potranno essere comunicati eventualmente a terzi collegati a Burguar Dreams S.L. per contratto per lo svolgimento di compiti necessari alla gestione della sua richiesta, senza necessità di autorizzazione espressa.",
          "Anche quando fosse necessario comunicare con le autorità nel caso in cui l'Utente avesse compiuto azioni contrarie alla Legge o violato il contenuto delle Note Legali.",
          "I dati personali dell'Utente non saranno trasferiti a paesi terzi né a organizzazioni internazionali, salvo che l'Utente sia debitamente informato di tale trasferimento, delle sue condizioni e del destinatario.",
          "Quando determinati dati siano obbligatori per accedere a funzionalità specifiche del sito web, Burguar Dreams S.L. indicherà questo carattere obbligatorio al momento della raccolta."
        ]
      },
      {
        h: "Cookie",
        ps: [
          "Navigando su questo sito web, i cookie di Burguar Dreams S.L. e/o di terzi possono essere installati sul vostro dispositivo. Durante la prima navigazione, apparirà un banner informativo sull'uso dei cookie.",
          "Continuando la navigazione, l'Utente sarà considerato informato e avrà accettato l'uso di tali cookie. Il consenso prestato avrà validità di tredici mesi.",
          "Per maggiori informazioni, consultate la nostra Informativa sui Cookie."
        ]
      },
      {
        h: "Diritti dell'utente",
        ps: [
          "Si informa l'utente della possibilità di esercitare i propri diritti di accesso, rettifica, cancellazione e opposizione. Inoltre, ogni persona ha diritto alla limitazione del trattamento dei propri dati personali, alla cancellazione dei dati trasmessi al titolare del trattamento e alla portabilità dei propri dati.",
          "L'utente ha la possibilità di presentare un reclamo presso l'<a href=\"https://www.aepd.es\" target=\"_blank\" rel=\"noopener noreferrer\">AEPD (Agenzia spagnola per la protezione dei dati)</a> quando non abbia ottenuto una soluzione soddisfacente nell'esercizio dei propri diritti.",
          "Salvo che l'Utente si opponga, inviando un'email a <a href=\"mailto:burguardreams@gmail.com\">burguardreams@gmail.com</a>, i suoi dati potranno essere utilizzati per inviargli informazioni su appartamenti e servizi di Burguar Dreams S.L.",
          "I dati forniti saranno conservati finché si mantiene il rapporto commerciale o per gli anni necessari a adempiere agli obblighi legali.",
          "L'Utente è responsabile del fatto che le informazioni fornite tramite questo sito web siano veritiere, rispondendo dell'accuratezza di tutti i dati comunicati e mantenendoli aggiornati per riflettere la propria situazione reale.",
          "Queste informazioni saranno archiviate e gestite con la dovuta riservatezza, applicando le misure di sicurezza informatica necessarie per evitare l'accesso o l'uso indebito dei dati, la loro manipolazione, deterioramento o perdita.",
          "Tuttavia, l'Utente deve tenere presente che la sicurezza dei sistemi informatici non è mai assoluta. Fornendo dati personali online, tali informazioni possono essere raccolte senza il suo consenso e trattate da terzi non autorizzati. Burguar Dreams S.L. declina ogni responsabilità per le conseguenze di tali atti se l'Utente ha pubblicato le informazioni volontariamente.",
          "Potrete esercitare questi diritti mediante richiesta scritta indirizzata a:",
          "<strong>Burguar Dreams S.L.</strong><br>C/ Can Bruixa, 16, 1ª planta 1º<br>08028 Barcelona",
          "O via email a: <a href=\"mailto:burguardreams@gmail.com\">burguardreams@gmail.com</a>, allegando copia del documento d'identità o documento equivalente.",
          "Tali richieste saranno evase entro un mese, prorogabile a due mesi se la complessità o il numero di richieste lo richiedono, senza pregiudizio dell'obbligo di conservare determinati dati nei termini legali.",
          "Inoltre, gli utenti che lo richiedano hanno la possibilità di organizzare la destinazione dei propri dati dopo il decesso."
        ]
      }
    ]
  }
};

/* ─── COOKIES POLICY (sections 1-6) ─── */
const COOKIES_SECTIONS = {
  es: {
    title: "POLÍTICA DE COOKIES",
    sections: [
      {
        h: "1. Uso de cookies",
        ps: [
          "El sitio web de Burguar Dreams (el Sitio Web), propiedad de Burguar Dreams S.L., utiliza cookies. Una cookie es un archivo que se descarga en tu ordenador al acceder a determinadas páginas web. Las cookies permiten a un sitio web, entre otras cosas, almacenar y recuperar información sobre los hábitos de navegación del usuario o de su ordenador y, según la información que contengan y la forma en que utilice su ordenador, pueden utilizarse para reconocer al usuario. Además, mejoran la experiencia de navegación, ya que permiten al sitio web ofrecer al usuario información que pueda ser de su interés en función del uso que haga del contenido del sitio web."
        ]
      },
      {
        h: "2. Consentimiento",
        ps: [
          "Las cookies que utilizamos no almacenan ningún dato personal ni ningún tipo de información que pueda identificarle, a menos que desee registrarse voluntariamente para utilizar los servicios que ponemos a su disposición o para recibir información sobre apartamentos y servicios de su interés. Al navegar por primera vez, aparecerá un banner que explica el uso de cookies."
        ]
      },
      {
        h: "3. Tipos y finalidad de las cookies",
        ps: [
          "Las cookies, según su permanencia, se pueden clasificar de la siguiente manera:"
        ],
        list: [
          "<strong>Cookies de sesión:</strong> caducan cuando el usuario cierra el navegador.",
          "<strong>Cookies persistentes:</strong> caducan cuando se cumple la finalidad para la que se utilizan o cuando se eliminan manualmente."
        ],
        ps2: [
          "En nuestro sitio web utilizamos diferentes tipos de cookies para mejorar la experiencia de nuestros usuarios.",
          "Las <strong>cookies necesarias</strong> son imprescindibles para habilitar las funciones básicas del sitio, como la gestión de sus preferencias de consentimiento. Estas cookies no almacenan ningún dato que permita identificarle personalmente.",
          "Las <strong>cookies funcionales</strong> ayudan a realizar ciertas funciones, como compartir contenido en redes sociales u otras funciones de terceros.",
          "Las <strong>cookies analíticas</strong> se utilizan para comprender cómo interactúan los visitantes con el sitio web, proporcionando información sobre métricas como el número de visitantes, la tasa de rebote, la fuente de tráfico, etc.",
          "Las <strong>cookies publicitarias</strong> se utilizan para ofrecer a los visitantes anuncios personalizados basados en las páginas que han visitado anteriormente y para analizar la eficacia de las campañas publicitarias."
        ]
      },
      {
        h: "4. Cómo bloquear o eliminar las cookies instaladas",
        ps: [
          "Puedes permitir, bloquear o eliminar las cookies instaladas en tu ordenador configurando las opciones de tu navegador. Encontrarás información sobre cómo hacerlo en los siguientes enlaces:"
        ],
        list: [
          "<a href=\"https://support.google.com/chrome/answer/95647?hl=es\" target=\"_blank\" rel=\"noopener noreferrer\">Chrome</a>",
          "<a href=\"https://support.apple.com/es-es/guide/safari/sfri11471/mac\" target=\"_blank\" rel=\"noopener noreferrer\">Safari</a>",
          "<a href=\"https://support.microsoft.com/es-es/microsoft-edge/eliminar-las-cookies-en-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09\" target=\"_blank\" rel=\"noopener noreferrer\">Explorer / Edge</a>",
          "<a href=\"https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-sitios-web-rastrear-preferencias\" target=\"_blank\" rel=\"noopener noreferrer\">Firefox</a>"
        ],
        ps2: [
          "Todo lo relacionado con las cookies de Google, tanto analíticas como publicitarias, puede consultarse en:<ul><li><a href=\"https://www.google.es/intl/es/policies/technologies/types/\" target=\"_blank\" rel=\"noopener noreferrer\">Tipos de cookies de Google</a></li><li><a href=\"https://www.google.es/policies/technologies/ads/\" target=\"_blank\" rel=\"noopener noreferrer\">Cookies publicitarias de Google</a></li></ul>",
          "Sin embargo, le informamos de la posibilidad de que la desactivación de una cookie pueda impedir o dificultar la navegación o la prestación de los servicios ofrecidos en el sitio web."
        ]
      },
      {
        h: "5. Modificaciones",
        ps: [
          "Las cookies de este sitio web o esta política pueden actualizarse, por lo que le recomendamos que las revise periódicamente."
        ]
      },
      {
        h: "6. Lista de cookies"
      }
    ]
  },
  ca: {
    title: "POLÍTICA DE GALETES",
    sections: [
      {
        h: "1. Ús de galetes",
        ps: [
          "El lloc web de Burguar Dreams (el Lloc Web), propietat de Burguar Dreams S.L., utilitza galetes. Una galeta és un fitxer que es descarrega al vostre ordinador en accedir a determinades pàgines web. Les galetes permeten a un lloc web, entre altres coses, emmagatzemar i recuperar informació sobre els hàbits de navegació de l'usuari o del seu ordinador i, segons la informació que continguin i la forma en què utilitzi el seu ordinador, es poden utilitzar per reconèixer l'usuari. A més, milloren l'experiència de navegació, ja que permeten al lloc web oferir a l'usuari informació que pugui ser del seu interès en funció de l'ús que faci del contingut del lloc web."
        ]
      },
      {
        h: "2. Consentiment",
        ps: [
          "Les galetes que utilitzem no emmagatzemen cap dada personal ni cap tipus d'informació que pugui identificar-vos, llevat que desitgeu registrar-vos voluntàriament per utilitzar els serveis que posem a la vostra disposició o per rebre informació sobre apartaments i serveis del vostre interès. En navegar per primera vegada, apareixerà un banner que explica l'ús de galetes."
        ]
      },
      {
        h: "3. Tipus i finalitat de les galetes",
        ps: [
          "Les galetes, segons la seva permanència, es poden classificar de la manera següent:"
        ],
        list: [
          "<strong>Galetes de sessió:</strong> caduquen quan l'usuari tanca el navegador.",
          "<strong>Galetes persistents:</strong> caduquen quan es compleix la finalitat per a la qual s'utilitzen o quan s'eliminen manualment."
        ],
        ps2: [
          "Al nostre lloc web utilitzem diferents tipus de galetes per millorar l'experiència dels nostres usuaris.",
          "Les <strong>galetes necessàries</strong> són imprescindibles per habilitar les funcions bàsiques del lloc, com la gestió de les vostres preferències de consentiment. Aquestes galetes no emmagatzemen cap dada que permeti identificar-vos personalment.",
          "Les <strong>galetes funcionals</strong> ajuden a realitzar certes funcions, com compartir contingut a xarxes socials o altres funcions de tercers.",
          "Les <strong>galetes analítiques</strong> s'utilitzen per comprendre com interactuen els visitants amb el lloc web, proporcionant informació sobre mètriques com el nombre de visitants, la taxa de rebot, la font de trànsit, etc.",
          "Les <strong>galetes publicitàries</strong> s'utilitzen per oferir als visitants anuncis personalitzats basats en les pàgines que han visitat anteriorment i per analitzar l'eficàcia de les campanyes publicitàries."
        ]
      },
      {
        h: "4. Com bloquejar o eliminar les galetes instal·lades",
        ps: [
          "Pots permetre, bloquejar o eliminar les galetes instal·lades al teu ordinador configurant les opcions del teu navegador. Trobaràs informació sobre com fer-ho als enllaços següents:"
        ],
        list: [
          "<a href=\"https://support.google.com/chrome/answer/95647?hl=ca\" target=\"_blank\" rel=\"noopener noreferrer\">Chrome</a>",
          "<a href=\"https://support.apple.com/ca-es/guide/safari/sfri11471/mac\" target=\"_blank\" rel=\"noopener noreferrer\">Safari</a>",
          "<a href=\"https://support.microsoft.com/ca-es/microsoft-edge/delete-cookies\" target=\"_blank\" rel=\"noopener noreferrer\">Explorer / Edge</a>",
          "<a href=\"https://support.mozilla.org/ca/kb/enable-and-disable-cookies-website-preferences\" target=\"_blank\" rel=\"noopener noreferrer\">Firefox</a>"
        ],
        ps2: [
          "Tot el relacionat amb les galetes de Google, tant analítiques com publicitàries, es pot consultar a:<ul><li><a href=\"https://www.google.es/intl/ca/policies/technologies/types/\" target=\"_blank\" rel=\"noopener noreferrer\">Tipus de galetes de Google</a></li><li><a href=\"https://www.google.es/intl/ca/policies/technologies/ads/\" target=\"_blank\" rel=\"noopener noreferrer\">Galetes publicitàries de Google</a></li></ul>",
          "Tanmateix, l'informem de la possibilitat que la desactivació d'una galeta pugui impedir o dificultar la navegació o la prestació dels serveis oferts al lloc web."
        ]
      },
      {
        h: "5. Modificacions",
        ps: [
          "Les galetes d'aquest lloc web o aquesta política poden actualitzar-se, per la qual cosa us recomanem que les reviseu periòdicament."
        ]
      },
      {
        h: "6. Llista de galetes"
      }
    ]
  },
  en: {
    title: "COOKIE POLICY",
    sections: [
      {
        h: "1. Use of cookies",
        ps: [
          "The Burguar Dreams website (the Website), owned by Burguar Dreams S.L., uses cookies. A cookie is a file that is downloaded to your computer when you access certain web pages. Cookies allow a website, among other things, to store and retrieve information about the browsing habits of the user or their computer and, depending on the information they contain and the way the computer is used, they may be used to recognise the user. They also improve the browsing experience, as they allow the website to offer the user information that may be of interest based on their use of the website content."
        ]
      },
      {
        h: "2. Consent",
        ps: [
          "The cookies we use do not store any personal data or any type of information that can identify you, unless you voluntarily register to use the services we make available to you or to receive information about apartments and services of interest to you. When browsing for the first time, a banner explaining the use of cookies will appear."
        ]
      },
      {
        h: "3. Types and purpose of cookies",
        ps: [
          "Cookies, depending on their duration, can be classified as follows:"
        ],
        list: [
          "<strong>Session cookies:</strong> expire when the user closes the browser.",
          "<strong>Persistent cookies:</strong> expire when the purpose for which they are used is fulfilled or when they are manually deleted."
        ],
        ps2: [
          "On our website we use different types of cookies to improve our users' experience.",
          "The <strong>necessary cookies</strong> are essential to enable the basic functions of the site, such as managing your consent preferences. These cookies do not store any data that allows you to be personally identified.",
          "The <strong>functional cookies</strong> help perform certain functions, such as sharing content on social networks or other third-party features.",
          "The <strong>analytics cookies</strong> are used to understand how visitors interact with the website, providing information on metrics such as number of visitors, bounce rate, traffic source, etc.",
          "The <strong>advertising cookies</strong> are used to offer visitors personalised ads based on pages they have previously visited and to analyse the effectiveness of advertising campaigns."
        ]
      },
      {
        h: "4. How to block or delete installed cookies",
        ps: [
          "You can allow, block or delete cookies installed on your computer by configuring your browser options. You will find information on how to do this at the following links:"
        ],
        list: [
          "<a href=\"https://support.google.com/chrome/answer/95647?hl=en\" target=\"_blank\" rel=\"noopener noreferrer\">Chrome</a>",
          "<a href=\"https://support.apple.com/guide/safari/sfri11471/mac\" target=\"_blank\" rel=\"noopener noreferrer\">Safari</a>",
          "<a href=\"https://support.microsoft.com/en-us/microsoft-edge/delete-cookies\" target=\"_blank\" rel=\"noopener noreferrer\">Explorer / Edge</a>",
          "<a href=\"https://support.mozilla.org/en-US/kb/enable-and-disable-cookies-website-preferences\" target=\"_blank\" rel=\"noopener noreferrer\">Firefox</a>"
        ],
        ps2: [
          "All information regarding Google cookies, both analytics and advertising, can be found at:<ul><li><a href=\"https://policies.google.com/technologies/types\" target=\"_blank\" rel=\"noopener noreferrer\">Types of Google cookies</a></li><li><a href=\"https://policies.google.com/technologies/ads\" target=\"_blank\" rel=\"noopener noreferrer\">Google advertising cookies</a></li></ul>",
          "However, please note that disabling a cookie may prevent or hinder browsing or the provision of services offered on the website."
        ]
      },
      {
        h: "5. Amendments",
        ps: [
          "The cookies on this website or this policy may be updated, so we recommend that you review them periodically."
        ]
      },
      {
        h: "6. Cookie list"
      }
    ]
  },
  fr: {
    title: "POLITIQUE DE COOKIES",
    sections: [
      {
        h: "1. Utilisation des cookies",
        ps: [
          "Le site web de Burguar Dreams (le Site Web), propriété de Burguar Dreams S.L., utilise des cookies. Un cookie est un fichier qui se télécharge sur votre ordinateur lorsque vous accédez à certaines pages web. Les cookies permettent à un site web, entre autres, de stocker et de récupérer des informations sur les habitudes de navigation de l'utilisateur ou de son ordinateur et, selon les informations qu'ils contiennent et la façon dont l'ordinateur est utilisé, peuvent servir à reconnaître l'utilisateur. De plus, ils améliorent l'expérience de navigation, car ils permettent au site web d'offrir à l'utilisateur des informations susceptibles de l'intéresser en fonction de son utilisation du contenu du site."
        ]
      },
      {
        h: "2. Consentement",
        ps: [
          "Les cookies que nous utilisons ne stockent aucune donnée personnelle ni aucun type d'information permettant de vous identifier, sauf si vous souhaitez vous inscrire volontairement pour utiliser les services que nous mettons à votre disposition ou pour recevoir des informations sur des appartements et services correspondant à vos intérêts. Lors de la première navigation, une bannière expliquant l'utilisation des cookies apparaîtra."
        ]
      },
      {
        h: "3. Types et finalité des cookies",
        ps: [
          "Les cookies, selon leur durée, peuvent être classés de la manière suivante :"
        ],
        list: [
          "<strong>Cookies de session :</strong> expirent lorsque l'utilisateur ferme le navigateur.",
          "<strong>Cookies persistants :</strong> expirent lorsque la finalité pour laquelle ils sont utilisés est atteinte ou lorsqu'ils sont supprimés manuellement."
        ],
        ps2: [
          "Sur notre site web, nous utilisons différents types de cookies pour améliorer l'expérience de nos utilisateurs.",
          "Les <strong>cookies nécessaires</strong> sont indispensables pour activer les fonctions de base du site, comme la gestion de vos préférences de consentement. Ces cookies ne stockent aucune donnée permettant de vous identifier personnellement.",
          "Les <strong>cookies fonctionnels</strong> aident à réaliser certaines fonctions, comme le partage de contenu sur les réseaux sociaux ou d'autres fonctionnalités tierces.",
          "Les <strong>cookies analytiques</strong> sont utilisés pour comprendre comment les visiteurs interagissent avec le site web, en fournissant des informations sur des métriques telles que le nombre de visiteurs, le taux de rebond, la source de trafic, etc.",
          "Les <strong>cookies publicitaires</strong> sont utilisés pour proposer aux visiteurs des annonces personnalisées basées sur les pages qu'ils ont visitées précédemment et pour analyser l'efficacité des campagnes publicitaires."
        ]
      },
      {
        h: "4. Comment bloquer ou supprimer les cookies installés",
        ps: [
          "Vous pouvez autoriser, bloquer ou supprimer les cookies installés sur votre ordinateur en configurant les options de votre navigateur. Vous trouverez des informations à ce sujet aux liens suivants :"
        ],
        list: [
          "<a href=\"https://support.google.com/chrome/answer/95647?hl=fr\" target=\"_blank\" rel=\"noopener noreferrer\">Chrome</a>",
          "<a href=\"https://support.apple.com/fr-fr/guide/safari/sfri11471/mac\" target=\"_blank\" rel=\"noopener noreferrer\">Safari</a>",
          "<a href=\"https://support.microsoft.com/fr-fr/microsoft-edge/supprimer-les-cookies\" target=\"_blank\" rel=\"noopener noreferrer\">Explorer / Edge</a>",
          "<a href=\"https://support.mozilla.org/fr/kb/activer-desactiver-cookies\" target=\"_blank\" rel=\"noopener noreferrer\">Firefox</a>"
        ],
        ps2: [
          "Toutes les informations relatives aux cookies Google, analytiques et publicitaires, sont disponibles sur :<ul><li><a href=\"https://policies.google.com/technologies/types?hl=fr\" target=\"_blank\" rel=\"noopener noreferrer\">Types de cookies Google</a></li><li><a href=\"https://policies.google.com/technologies/ads?hl=fr\" target=\"_blank\" rel=\"noopener noreferrer\">Cookies publicitaires Google</a></li></ul>",
          "Toutefois, nous vous informons que la désactivation d'un cookie peut empêcher ou entraver la navigation ou la fourniture des services proposés sur le site web."
        ]
      },
      {
        h: "5. Modifications",
        ps: [
          "Les cookies de ce site web ou cette politique peuvent être mis à jour ; nous vous recommandons donc de les consulter périodiquement."
        ]
      },
      {
        h: "6. Liste des cookies"
      }
    ]
  },
  de: {
    title: "COOKIE-RICHTLINIE",
    sections: [
      {
        h: "1. Verwendung von Cookies",
        ps: [
          "Die Website von Burguar Dreams (die Website), Eigentum der Burguar Dreams S.L., verwendet Cookies. Ein Cookie ist eine Datei, die auf Ihren Computer heruntergeladen wird, wenn Sie auf bestimmte Webseiten zugreifen. Cookies ermöglichen es einer Website unter anderem, Informationen über die Surfgewohnheiten des Nutzers oder seines Computers zu speichern und abzurufen und können, je nach den enthaltenen Informationen und der Art der Computernutzung, zur Erkennung des Nutzers verwendet werden. Darüber hinaus verbessern sie das Surferlebnis, da sie es der Website ermöglichen, dem Nutzer Informationen anzubieten, die je nach Nutzung der Website-Inhalte für ihn von Interesse sein können."
        ]
      },
      {
        h: "2. Einwilligung",
        ps: [
          "Die von uns verwendeten Cookies speichern keine personenbezogenen Daten oder Informationen, die Sie identifizieren könnten, es sei denn, Sie registrieren sich freiwillig, um die von uns angebotenen Dienste zu nutzen oder Informationen über Apartments und Dienstleistungen zu erhalten, die Sie interessieren. Beim ersten Besuch erscheint ein Banner, das die Verwendung von Cookies erklärt."
        ]
      },
      {
        h: "3. Arten und Zweck der Cookies",
        ps: [
          "Cookies können je nach Dauer wie folgt eingeteilt werden:"
        ],
        list: [
          "<strong>Sitzungs-Cookies:</strong> laufen ab, wenn der Nutzer den Browser schließt.",
          "<strong>Dauerhafte Cookies:</strong> laufen ab, wenn der Zweck, für den sie verwendet werden, erfüllt ist, oder wenn sie manuell gelöscht werden."
        ],
        ps2: [
          "Auf unserer Website verwenden wir verschiedene Arten von Cookies, um das Erlebnis unserer Nutzer zu verbessern.",
          "Die <strong>notwendigen Cookies</strong> sind unerlässlich, um die Grundfunktionen der Website zu aktivieren, wie die Verwaltung Ihrer Einwilligungspräferenzen. Diese Cookies speichern keine Daten, die eine persönliche Identifizierung ermöglichen.",
          "Die <strong>funktionalen Cookies</strong> helfen bei bestimmten Funktionen, wie dem Teilen von Inhalten in sozialen Netzwerken oder anderen Funktionen Dritter.",
          "Die <strong>analytischen Cookies</strong> werden verwendet, um zu verstehen, wie Besucher mit der Website interagieren, und liefern Informationen zu Kennzahlen wie Besucherzahl, Absprungrate, Traffic-Quelle usw.",
          "Die <strong>Werbe-Cookies</strong> werden verwendet, um Besuchern personalisierte Anzeigen basierend auf zuvor besuchten Seiten anzuzeigen und die Wirksamkeit von Werbekampagnen zu analysieren."
        ]
      },
      {
        h: "4. Wie installierte Cookies blockiert oder gelöscht werden",
        ps: [
          "Sie können installierte Cookies zulassen, blockieren oder löschen, indem Sie die Optionen Ihres Browsers konfigurieren. Informationen dazu finden Sie unter folgenden Links:"
        ],
        list: [
          "<a href=\"https://support.google.com/chrome/answer/95647?hl=de\" target=\"_blank\" rel=\"noopener noreferrer\">Chrome</a>",
          "<a href=\"https://support.apple.com/de-de/guide/safari/sfri11471/mac\" target=\"_blank\" rel=\"noopener noreferrer\">Safari</a>",
          "<a href=\"https://support.microsoft.com/de-de/microsoft-edge/cookies-loeschen\" target=\"_blank\" rel=\"noopener noreferrer\">Explorer / Edge</a>",
          "<a href=\"https://support.mozilla.org/de/kb/cookies-erlauben-und-ablehnen\" target=\"_blank\" rel=\"noopener noreferrer\">Firefox</a>"
        ],
        ps2: [
          "Alle Informationen zu Google-Cookies, sowohl analytische als auch Werbe-Cookies, finden Sie unter:<ul><li><a href=\"https://policies.google.com/technologies/types?hl=de\" target=\"_blank\" rel=\"noopener noreferrer\">Arten von Google-Cookies</a></li><li><a href=\"https://policies.google.com/technologies/ads?hl=de\" target=\"_blank\" rel=\"noopener noreferrer\">Google-Werbe-Cookies</a></li></ul>",
          "Bitte beachten Sie jedoch, dass die Deaktivierung eines Cookies die Navigation oder die Bereitstellung der auf der Website angebotenen Dienste verhindern oder erschweren kann."
        ]
      },
      {
        h: "5. Änderungen",
        ps: [
          "Die Cookies dieser Website oder diese Richtlinie können aktualisiert werden; wir empfehlen daher, sie regelmäßig zu überprüfen."
        ]
      },
      {
        h: "6. Cookie-Liste"
      }
    ]
  },
  it: {
    title: "INFORMATIVA SUI COOKIE",
    sections: [
      {
        h: "1. Uso dei cookie",
        ps: [
          "Il sito web di Burguar Dreams (il Sito Web), di proprietà di Burguar Dreams S.L., utilizza i cookie. Un cookie è un file che viene scaricato sul vostro computer quando accedete a determinate pagine web. I cookie consentono a un sito web, tra l'altro, di memorizzare e recuperare informazioni sulle abitudini di navigazione dell'utente o del suo computer e, a seconda delle informazioni che contengono e del modo in cui viene utilizzato il computer, possono essere utilizzati per riconoscere l'utente. Inoltre, migliorano l'esperienza di navigazione, poiché permettono al sito web di offrire all'utente informazioni che possono essere di suo interesse in base all'uso che fa dei contenuti del sito."
        ]
      },
      {
        h: "2. Consenso",
        ps: [
          "I cookie che utilizziamo non memorizzano dati personali né alcun tipo di informazione che possa identificarvi, a meno che non desideriate registrarvi volontariamente per utilizzare i servizi che mettiamo a vostra disposizione o per ricevere informazioni su appartamenti e servizi di vostro interesse. Durante la prima navigazione, apparirà un banner che spiega l'uso dei cookie."
        ]
      },
      {
        h: "3. Tipi e finalità dei cookie",
        ps: [
          "I cookie, in base alla loro durata, possono essere classificati come segue:"
        ],
        list: [
          "<strong>Cookie di sessione:</strong> scadono quando l'utente chiude il browser.",
          "<strong>Cookie persistenti:</strong> scadono quando viene raggiunta la finalità per cui sono utilizzati o quando vengono eliminati manualmente."
        ],
        ps2: [
          "Sul nostro sito web utilizziamo diversi tipi di cookie per migliorare l'esperienza dei nostri utenti.",
          "I <strong>cookie necessari</strong> sono indispensabili per abilitare le funzioni di base del sito, come la gestione delle vostre preferenze di consenso. Questi cookie non memorizzano dati che permettano di identificarvi personalmente.",
          "I <strong>cookie funzionali</strong> aiutano a svolgere determinate funzioni, come la condivisione di contenuti sui social network o altre funzionalità di terze parti.",
          "I <strong>cookie analitici</strong> vengono utilizzati per capire come i visitatori interagiscono con il sito web, fornendo informazioni su metriche come il numero di visitatori, la percentuale di rimbalzo, la fonte di traffico, ecc.",
          "I <strong>cookie pubblicitari</strong> vengono utilizzati per offrire ai visitatori annunci personalizzati basati sulle pagine visitate in precedenza e per analizzare l'efficacia delle campagne pubblicitarie."
        ]
      },
      {
        h: "4. Come bloccare o eliminare i cookie installati",
        ps: [
          "Puoi consentire, bloccare o eliminare i cookie installati sul tuo computer configurando le opzioni del browser. Troverai informazioni su come farlo ai seguenti link:"
        ],
        list: [
          "<a href=\"https://support.google.com/chrome/answer/95647?hl=it\" target=\"_blank\" rel=\"noopener noreferrer\">Chrome</a>",
          "<a href=\"https://support.apple.com/it-it/guide/safari/sfri11471/mac\" target=\"_blank\" rel=\"noopener noreferrer\">Safari</a>",
          "<a href=\"https://support.microsoft.com/it-it/microsoft-edge/eliminare-i-cookie\" target=\"_blank\" rel=\"noopener noreferrer\">Explorer / Edge</a>",
          "<a href=\"https://support.mozilla.org/it/kb/Attivare%20e%20disattivare%20i%20cookie\" target=\"_blank\" rel=\"noopener noreferrer\">Firefox</a>"
        ],
        ps2: [
          "Tutte le informazioni relative ai cookie di Google, sia analitici che pubblicitari, sono disponibili su:<ul><li><a href=\"https://policies.google.com/technologies/types?hl=it\" target=\"_blank\" rel=\"noopener noreferrer\">Tipi di cookie di Google</a></li><li><a href=\"https://policies.google.com/technologies/ads?hl=it\" target=\"_blank\" rel=\"noopener noreferrer\">Cookie pubblicitari di Google</a></li></ul>",
          "Tuttavia, la informiamo che la disattivazione di un cookie può impedire o rendere difficile la navigazione o la prestazione dei servizi offerti sul sito web."
        ]
      },
      {
        h: "5. Modifiche",
        ps: [
          "I cookie di questo sito web o la presente informativa possono essere aggiornati; vi consigliamo pertanto di consultarli periodicamente."
        ]
      },
      {
        h: "6. Elenco dei cookie"
      }
    ]
  }
};


function renderLegalSections(sections) {
  return sections.map(sec => {
    let html = sec.h ? `<h3>${sec.h}</h3>` : '';
    (sec.ps || []).forEach(p => { html += `<p>${p}</p>`; });
    if (sec.list) html += `<ul>${sec.list.map(i => `<li>${i}</li>`).join('')}</ul>`;
    (sec.ps2 || []).forEach(p => { html += `<p>${p}</p>`; });
    return html;
  }).join('');
}

function buildLegalHtml(lang) {
  const data = LEGAL_TEXT[lang] || LEGAL_TEXT.es;
  return `<h2 id="legal-modal-title">${data.title}</h2>` + renderLegalSections(data.sections);
}

function buildPrivacyHtml(lang) {
  const data = PRIVACY_TEXT[lang] || PRIVACY_TEXT.es;
  return `<h2 id="privacy-modal-title">${data.title}</h2>` + renderLegalSections(data.sections);
}

function buildCookiesHtml(lang) {
  const data = COOKIES_SECTIONS[lang] || COOKIES_SECTIONS.es;
  let html = `<h2 id="cookies-modal-title">${data.title}</h2>` + renderLegalSections(data.sections);
  html += renderCookieTables(lang, getCookieTables(lang));
  return html;
}

function renderLegalModals(lang) {
  lang = lang || (typeof currentLang !== 'undefined' ? currentLang : 'es');
  const legalBody = document.getElementById('legal-modal-body');
  const privacyBody = document.getElementById('privacy-modal-body');
  const cookiesBody = document.getElementById('cookies-modal-body');
  if (!legalBody) return;
  legalBody.innerHTML = buildLegalHtml(lang);
  privacyBody.innerHTML = buildPrivacyHtml(lang);
  cookiesBody.innerHTML = buildCookiesHtml(lang);
  const closeLabel = LEGAL_CLOSE_LABELS[lang] || LEGAL_CLOSE_LABELS.es;
  ['legal-modal-close', 'privacy-modal-close', 'cookies-modal-close'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.setAttribute('aria-label', closeLabel);
  });
  document.documentElement.lang = lang;
}
