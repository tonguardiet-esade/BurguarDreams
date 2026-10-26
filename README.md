# Burguar Dreams

Sitio web estático de corporate housing en Barcelona. Cuatro propiedades, formulario de contacto con Supabase e i18n en 6 idiomas.

## Estructura

```
BurguarDreams/
├── index.html              # HTML estructural
├── css/
│   ├── variables.css       # Tokens de diseño y keyframes
│   ├── layout.css          # Base y responsive global
│   ├── components.css      # Header, cards, modals, footer, lightbox
│   └── pages.css           # Hero, detail, corporate, FAQ, contacto
├── js/
│   ├── config.js           # Supabase (claves anon; versionado para el deploy)
│   ├── config.example.js   # Copia de referencia de config.js
│   ├── data/
│   │   ├── properties.js   # 4 propiedades + traducciones de campos
│   │   ├── i18n.js         # Traducciones UI
│   │   ├── faqs.js         # Preguntas frecuentes
│   │   └── amenities.js    # Etiquetas de equipamiento
│   ├── legal/
│   │   └── legal-i18n.js   # Modales legales (aviso, privacidad, cookies)
│   ├── ui/
│   │   ├── grid.js         # Tarjetas de propiedades
│   │   ├── detail.js       # Vista detalle
│   │   ├── modal.js        # Modales y scroll lock
│   │   ├── lightbox.js     # Galería fullscreen
│   │   └── i18n.js         # setLang, toggleLang
│   ├── api/
│   │   └── submit-form.js  # Envío a Supabase
│   └── app.js              # Init, scroll spy, FAQ
├── assets/images/properties/
│   ├── granvia/
│   ├── valencia/
│   ├── bruixa/
│   └── urgell/
└── scripts/
    ├── generate_config.py
    └── build_legal_translations.py  # Opcional: genera JSON legal
```

## Setup

1. Copia las variables de entorno:

   ```bash
   cp .env.example .env
   ```

2. Edita `.env` con tu `SUPABASE_URL` y `SUPABASE_KEY`.

3. Genera la configuración de Supabase (opcional si editas `js/config.js` a mano):

   ```bash
   python3 scripts/generate_config.py
   ```

4. **Deploy (GitHub Pages):** `js/config.js` debe estar en el repo con tu `SUPABASE_URL` y la clave **anon/publicable** (no la service role). Haz commit y push de ese archivo tras configurarlo.

5. **Formulario → tabla `solicitudes`:** en [SQL Editor](https://supabase.com/dashboard/project/vtwyqhxfuiwjvzgptecb/sql/new), ejecuta [`supabase/fix-urgente.sql`](supabase/fix-urgente.sql) y luego [`supabase/validate-solicitudes.sql`](supabase/validate-solicitudes.sql) (validación RLS en servidor). Sin el primero el insert falla con `schema "net" does not exist` (400).

   Comprobar: `python3 scripts/apply_supabase_fix.py` (debe terminar con HTTP 201).

6. **Email al enviar el formulario:** trigger SQL `pg_net` → Edge Function `resend-email`. Con `SUPABASE_ANON_KEY` en `.env`:

   ```bash
   python3 scripts/setup_resend_email.py
   ```

   Con `SUPABASE_ACCESS_TOKEN` en `.env` aplica trigger, desactiva Verify JWT y redespliega la función. Sin token, pega [`supabase/.trigger-ready.sql`](supabase/.trigger-ready.sql) en [SQL Editor](https://supabase.com/dashboard/project/vtwyqhxfuiwjvzgptecb/sql/new). Error 401: [`supabase/RESEND-401.md`](supabase/RESEND-401.md).

7. Sirve el sitio con un servidor HTTP estático (no abras carpetas `apartamento/…` en el Finder; Safari falla con `file://`):

   ```bash
   python3 -m http.server 8080
   ```

   Abre http://localhost:8080 (o `index.html` por doble clic: los enlaces de apartamentos usan `?inmueble=slug` en local).

## SEO, GEO y analítica

- `robots.txt` y `sitemap.xml` en la raíz (actualizar URLs si cambias de dominio).
- `llms.txt` para motores de IA generativos.
- URLs de inmuebles: `/apartamento/{slug}/` → redirigen a `/?inmueble={slug}` (`404.html` en GitHub Pages; `_redirects` en Netlify).
- Google Analytics 4: define `window.GA_MEASUREMENT_ID = "G-XXXXXXXX"` en `js/config.js`; solo se carga si el usuario acepta cookies.
- [Google Search Console](https://search.google.com/search-console): verifica el dominio y envía el sitemap.
- **Dominio propio (recomendado):** configura CNAME en GitHub Pages y sustituye `https://kaoutaracceleralia.github.io/BurguarDreams/` en `sitemap.xml`, `robots.txt`, `llms.txt` y el JSON-LD de `index.html`.

## Scripts opcionales

**Traducciones legales (JSON):** el runtime usa `js/legal/legal-i18n.js`. Para regenerar un JSON desde los módulos Python:

```bash
python3 scripts/build_legal_translations.py
```

Esto crea `_legal_translations.json` en la raíz. Integrarlo al runtime queda como mejora futura.

## Mapa de dependencias JS

Los scripts se cargan en orden clásico (sin ES modules) para mantener los `onclick` inline del HTML. Estado compartido: `currentLang`, `currentPropertyId`, `properties`, `i18n`, `db`.
