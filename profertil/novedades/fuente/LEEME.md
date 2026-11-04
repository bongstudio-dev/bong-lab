# Novedades · fuente

`../index.html` se genera desde esta carpeta. No editarlo a mano: tocar
`template.html` (o los datos) y regenerar.

- `template.html`: la página, con marcadores para datos, logos y foto.
- `notas.json`: las 471 notas de /noticias-recientes/, salidas del crawl del
  sitio actual (`urls.csv`, en Drive).
- `assets.json`: las 18 formas oficiales del sistema.
- `tokens.json`: colores, escalas y tiempos de animacion. Salen del Figma
  Master. Desde el 23/10/2026 la pagina no arma su propio `:root`: carga
  `../componentes/tokens.css` (que sale de este archivo con
  `componentes/fuente/generar-tokens.py`) y `../componentes/base.css`, las
  piezas compartidas con la libreria de componentes (Barra, Selector,
  Pastilla, Chip, Etiqueta, Boton). Si cambia un token: exportar
  tokens.json, correr generar-tokens.py y despues build.py.
- Toda clase, id y animacion lleva el prefijo `pf-` (regla de todo el
  sistema web; ver arriba de `componentes/base.css`).
- `logo-blanco.svg`, `simbolo-color.svg`: exportados del Figma Master.
- El hero es un carrusel a pantalla completa con las 5 notas mas recientes.
  Para elegir otras, cargar sus rutas (`u`) en `DESTACADAS`, en
  `template.html`. Cada placa es la foto de la nota recortada como hoja entre
  dos Flores del sistema enormes (atras y adelante), con parallax: ver
  "Header de noticias · con foto" en el Figma Master. Los colores de cada
  placa estan en `PARES_DEST`.
- La foto de cada placa es la de la nota: primero la copia local `n.imgL`
  (`../fotos/notas/`, WebP), despues la grande del sitio actual `n.imgG` y la
  principal `n.img`. Si ninguna carga, va una foto de banco de
  `../fotos/demo-*.webp`. La placa recorta la foto en la hoja, asi que pide
  una foto sin texto encima. `prep-cuerpos.py` baja la foto de las notas
  cargadas en `DESTACADAS`.
- `../campo.webp` y `../campo-m.webp` (la foto de campo del header anterior,
  sacada de `01 Profertil/Caso de Estudio/Animacion/Editables/Assets/Imagenes/`
  con `cwebp -q 70 -resize <ancho> 0`) hoy no se usan.
- El dock de filtros tiene al lado el **ancla**: un circulo azul con una
  flecha, separado del dock 5 px y con su mismo alto (tambien cuando el dock
  se compacta al bajar). Va pegado abajo como el dock y en mobile se compacta
  con su misma transicion, asi Safari los mueve juntos al mostrar u ocultar su
  barra (si el JS lo ubicara desde arriba, llegaria un cuadro tarde y
  saltaria). Es la accion principal de la barra: al principio de la lista
  apunta abajo y baja 80% de pantalla; pasada media pantalla desde el principio de la lista apunta
  arriba y vuelve al principio de la lista (no al carrusel, donde el dock se
  esconde). Con el panel de filtros abierto, primero lo cierra. Aparece y se
  va junto con el dock. El rebote vive solo en el giro de la flecha (resorte
  k 150, c 13,5: se pasa ~22° y se acomoda en 0,75 s); el circulo no rebota
  (aparece con k 220, c 29,7 y al apretarlo baja a 92% con k 600, c 49).
  Todos esos valores son tokens `--ancla-*` (variables `Web/Ancla/*`,
  `Web/Resorte/Ancla *` y `Web/Proporción/Ancla *` en 06 · Web). Codigo: "Ancla"
  en `template.html` (CSS y JS). Documentado en el Figma Master, pagina
  "▤ Novedades · Web": seccion "Ancla" del Doc (despues de "Dock de
  filtros") y componente interactivo `Web/Ancla` (seccion Filtros), con sus
  estados y transiciones; esta puesto en los prototipos de Novedades.

## Página de Nota

`../nota/index.html` es la plantilla de una nota: `nota/?n=<ar>` (sin
parámetro, la más reciente). Sale de `nota.html` con el mismo `build.py`, que
le copia de `template.html` el bloque entre `@comun` y `@fin-comun` (tipos,
etiquetas, arte de tarjeta), y le suma notas.json, las formas, el logo y el
pie de la librería (componente Pie de página, variante Institucional, que
`build.py` arma con node desde `../../componentes/c/pie.js`). El texto de cada
nota lo lee al abrir de `../notas/<ar>.json`.

- Cabecera de color por tipo de nota (solo fondos del Master: azul, verde,
  terra) con dos Flores del sistema, etiqueta con fecha, antetítulo, título,
  bajada, lugar y tiempo de lectura.
- Foto principal entera, sin recorte, con esquinas de hoja, montada sobre el
  borde de la cabecera. Una foto chica no se estira más de 1,5 veces. Si la
  nota no tiene foto, la cabecera cierra antes y sigue el texto.
- Cuerpo a una columna de lectura; al costado (fijo al bajar) los datos, los
  temas (etiquetas de WordPress, cada una lleva a Novedades con esa búsqueda:
  `../#q=tema`), compartir y "Ver la nota original".
- Nota anterior y siguiente (por fecha) y tres relacionadas: comparten temas,
  cultivo, pilar o tipo; a igual puntaje, la más cercana en el tiempo.
- Sin sombras: las cajas se separan del fondo por el color.

Regenerar la página:

```bash
python3 profertil/novedades/fuente/build.py
```

Rehacer `notas.json` desde el crawl:

```bash
URLS_CSV=/ruta/a/urls.csv python3 profertil/novedades/fuente/prep.py
```

Despues, sumarle texto y fotos de cada nota (lee el HTML guardado por el crawl,
`relevamiento-profertil/data`):

```bash
CRAWL=/ruta/a/relevamiento-profertil/data python3 profertil/novedades/fuente/prep-cuerpos.py
```

Agrega a cada nota de `notas.json`: `img` (foto principal), `imgG` (la mas
grande, si la principal es una miniatura), `imgL` (copia local, solo las 5 del
header), `et` (etiquetas de WordPress), `ca` (categorias), `lg` (lugar) y `ar`
(nombre de su archivo). Y escribe `../notas/<ar>.json` con la nota completa:
antetitulo, bajada, fecha y hora, fotos y el cuerpo como HTML limpio (p,
subtitulos, listas, citas, links, fotos con epigrafe, tablas y videos), sin
clases ni estilos del theme actual. Es una copia fija del sitio, no se
conecta en vivo. `SIN_FOTOS=1` saltea la bajada de fotos.

## Tokens: Figma manda

Los valores del sistema (colores, alto de etiqueta y boton, tiempos y curvas
de animacion) viven en las variables del Figma Master
(`broRXp9etWG4y2IjFyCC3V`), colecciones `01 · Primitivas` y `06 · Web`. Cada
variable que usa la web tiene cargado su nombre de CSS en el code syntax
(`var(--etq-m)`, `var(--f-abrir)`...). La web no escribe esos valores: los toma
de `tokens.json`.

Para cambiar un valor:

1. Cambiarlo en la variable de Figma (o crear una nueva con su code syntax WEB).
2. Correr `exportar-tokens.figma.js` sobre el archivo (se corre con
   `use_figma`; tambien sirve la consola de un plugin de desarrollo) y guardar
   lo que devuelve en `tokens.json`, en `tokens`.
3. Regenerar con `build.py`.

Si el exportador informa `conflictos`, dos variables usan el mismo nombre de
CSS con valores distintos: se corrige en Figma antes de exportar.
