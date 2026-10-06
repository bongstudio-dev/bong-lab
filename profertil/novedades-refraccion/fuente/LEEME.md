# Novedades · refracción

Rama de prueba de `profertil/novedades` con vidrio en la UI: dock de
filtros, barra azul, menú, lupa y flechas del carrusel. La original no se
toca.

- El vidrio lo renderiza **LiquidGlass** (github.com/ybouane/liquidglass,
  v1.0.3, importado de jsdelivr), con sus opciones (`blurAmount`,
  `refraction`, `edgeHighlight`, `fresnel`...).
- La librería captura con html-to-image a los hijos de su raíz. Capturar la
  grilla entera sería carísimo y en iPhone se pasa del tamaño máximo de
  canvas, así que la raíz es una capa fija (`#lg`) con un `<canvas>`
  invisible donde se redibuja en 2D, solo cerca del vidrio, lo que hay
  detrás (fondos, arte SVG y texto), y un molde por pieza de la UI que sigue
  su posición. Se redibuja solo al scrollear o al moverse algo; con el
  carrusel a la vista, a unos 12 cuadros por segundo.
- El botón "Vidrio" (arriba a la izquierda) pasa por las versiones: Vidrio
  (claro, bordes casi sin brillo), Esmerilado suave, Esmerilado (el preset
  "Frosted" de la librería), Esmerilado denso y Original. También
  `?vidrio=vidrio|suave|frosted|denso|original`.
- La primera versión (motor WebGL propio con los cuatro materiales del
  laboratorio) quedó descartada; está en el historial de git.
- `../index.html` se genera: es `../../novedades/index.html` con
  `refraccion.css` y `refraccion.js` inyectados. No editarlo a mano.

Regenerar (después de cada build de Novedades, para que la rama la siga):

```bash
python3 profertil/novedades/fuente/build.py
python3 profertil/novedades-refraccion/fuente/build.py
```
