# Animación guardada: card-scroll (rotateX al scroll)

Guardada el 2026-09-23 para poder restaurarla.

## Qué hacía
Cada tarjeta de apartamento se inclinaba (rotateX) y escalaba al hacer scroll por la página.

## Cómo restaurar
1. Copiar `card-scroll.js` → `js/ui/card-scroll.js`
2. Copiar `card-scroll.css` → `css/card-scroll.css`
3. En `index.html`: enlace CSS + script `card-scroll.js`
4. En `js/ui/grid.js`: clases `card-scroll` / `card-scroll-stage` + `initCardScroll()`
5. Subir `ASSET_VERSION`
