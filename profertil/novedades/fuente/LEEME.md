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

Desde Novedades se llega por enlace directo: cada tarjeta de la grilla y el
botón "Leer la nota" del header llevan a `nota/?n=<ar>`. Las 471 notas tienen
su página.

`../nota/index.html` es la plantilla de una nota: `nota/?n=<ar>` (sin
parámetro, la más reciente). Sale de `nota.html` con el mismo `build.py`, que
le copia de `template.html` el bloque entre `@comun` y `@fin-comun` (tipos,
etiquetas, arte de tarjeta), y le suma notas.json, las formas, el logo y el
pie de la librería (componente Pie de página, variante Institucional, que
`build.py` arma con node desde `../../componentes/c/pie.js`). El texto de cada
nota lo lee al abrir de `../notas/<ar>.json`.

- Sobria, sobre el fondo y sin cabecera de color. Arriba, a la izquierda y
  alineados con la foto: vuelta a
  Novedades, la etiqueta del tipo con el año (la etiqueta completa, con forma,
  va solo junto al título), antetítulo, título y bajada.
- Abajo, tres columnas. Al centro la foto principal, entera, sin recorte, con
  radio, siempre al ancho de la columna aunque sea chica (igual que las fotos
  del cuerpo). A la izquierda el
  índice de secciones de la nota (sin numerar), fijo al bajar: un punto azul viaja con resorte
  (la misma curva de la librería de componentes) hasta la sección que se está
  leyendo, y tocar una sección baja suave hasta ella. Se arma solo con los
  subtítulos del texto (h2, h3 y h4), sin marcar nada en el CMS; aparece solo
  si hay dos o más (muchos h4 del sitio actual son firmas o fuentes y se
  descartan). Sin índice, esa columna queda como aire. A la derecha, sin
  rótulos: la fecha; el tiempo de lectura y el botón de modo lectura (solo el
  ícono), pegados y en azul; y compartir. Sin foto, el texto sube a esa fila.
- Carga de imágenes: la foto principal, las del cuerpo y las de las tarjetas
  reservan su lugar con la proporción de la foto (la principal la lee del nombre
  del archivo de WordPress, `-1536x1024`; las del cuerpo, del ancho y alto del
  HTML; si no la hay, 3:2) y muestran un brillo que pasa mientras llegan. Al
  llegar, la foto aparece con un fundido y la página no salta.
- Modo lectura: deja solo título, foto y texto; se sale con el mismo botón, el
  de arriba a la derecha o Esc, sin perder el punto de lectura.
- Hasta 1100 px de ancho queda una columna: título, foto, datos y texto; el
  índice se va. En celular los datos van en una sola línea, con la fecha corta.
- Cierra con tres relacionadas y nada más: la tarjeta de Novedades sin el
  fondo, para que pese menos. La foto de la nota en 4:3 (si no tiene, el arte
  de Novedades) con la etiqueta y el año adentro,
  arriba a la izquierda, y abajo la fecha y el título; en celular,
  una fila que se desliza con encastre. Cuando no entran, aparecen flechas
  redondas centradas en la foto que corren de a una tarjeta. Comparten temas, cultivo, pilar o tipo; a igual puntaje,
  la más cercana en el tiempo.
- Sin sombras.

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

## Transición entre páginas

Entre Novedades y cada Nota (y de una Nota a otra) corre el componente "Transiciones de página" de la librería. La elegida es Persiana con logo: azul, 700 ms por tramo, curva Fuerte. Vive en tres archivos que `build.py` mete en las dos páginas:

- `transicion.css`: el paño, el fundido y el panel.
- `transicion-cabeza.js`: va en el head, antes de pintar. Lee la elección, pone las variables y, si se llega con la persiana, deja el paño tapando para que siga de largo.
- `transicion.js`: intercepta los links internos de Novedades, tapa y recién ahí cambia de página. Arma el panel.

El panel (abajo a la izquierda) permite ajustar la variante (Persiana, Fundido o Ninguna), el color del paño, la duración y la curva. Lo que se cambia queda guardado en el navegador de quien prueba; sin tocarlo, corre la Persiana. Con movimiento reducido no hay transición.

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
