# Novedades · refracción

Rama de prueba de `profertil/novedades` con el cristal del Laboratorio de
refracción (`profertil/refraccion`) en la UI: dock de filtros, barra azul,
menú, lupa y flechas del carrusel. La original no se toca.

- `../index.html` se genera: es `../../novedades/index.html` con
  `refraccion.css` y `refraccion.js` inyectados. No editarlo a mano.
- Safari (y todo navegador de iPhone) no aplica filtros SVG en
  `backdrop-filter`, así que la refracción la hace WebGL, como en el
  laboratorio. WebGL no puede leer la página: lo que queda detrás de cada
  pieza (fondos, arte SVG y texto de tarjetas y placas) se redibuja en un
  canvas 2D y eso es lo que se refracta.
- El botón "Vidrio" (arriba a la izquierda) pasa por Cristal, Líquido,
  Esmerilado, Prisma y Original (sin refracción). También `?vidrio=prisma`.

Regenerar (después de cada build de Novedades, para que la rama la siga):

```bash
python3 profertil/novedades/fuente/build.py
python3 profertil/novedades-refraccion/fuente/build.py
```
