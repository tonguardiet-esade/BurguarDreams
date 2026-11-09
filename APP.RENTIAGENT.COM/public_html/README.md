# Intranet en app.rentiagent.com

Copia de **producción** (build estático Vite) desplegada en el subdominio **app.rentiagent.com** en Hostinger.

## Relación con el resto del repo

| Carpeta | Dónde vive en producción |
|---------|-------------------------|
| **`app-rentiagent/`** (esta) | Raíz del sitio **app.rentiagent.com** |
| **`intranet/`** | Legacy en **burguardreams.com/intranet** (redirige a app); no es la copia activa |
| **`api/`** | **burguardreams.com/api** y espejo **api.rentiagent.com** |

## Subir a Hostinger

1. Entra en la carpeta document root de **app.rentiagent.com** (p. ej. `public_html/app_rentiagent`).
2. Sube el **contenido** de esta carpeta (`index.html`, `.htaccess`, `assets/`, `fichas/`, `property-photos/`, favicons…).
3. No subas carpetas de backup tipo `assets.4264` (solo basura del panel).

## Código fuente React

Este directorio **no** incluye `src/`; es el artefacto compilado. El desarrollo puede hacerse en otra copia del proyecto y volver a generar `dist/` aquí.
