# Novedades · fuente

`../index.html` se genera desde esta carpeta. No editarlo a mano: tocar
`template.html` (o los datos) y regenerar.

- `template.html`: la página, con marcadores para datos, logos y foto.
- `notas.json`: las 471 notas de /noticias-recientes/, salidas del crawl del
  sitio actual (`urls.csv`, en Drive).
- `assets.json`: las 18 formas oficiales del sistema.
- `tokens.json`: colores, escalas y tiempos de animacion. Salen del Figma
  Master; `build.py` arma con eso el `:root` de la pagina.
- `logo-blanco.svg`, `simbolo-color.svg`: exportados del Figma Master.
- El hero es un carrusel a pantalla completa con las 5 notas mas recientes.
  Para elegir otras, cargar sus rutas (`u`) en `DESTACADAS`, en
  `template.html`. Cada placa es la foto de la nota recortada como hoja entre
  dos Flores del sistema enormes (atras y adelante), con parallax: ver
  "Header de noticias · con foto" en el Figma Master. Los colores de cada
  placa estan en `PARES_DEST`.
- La foto sale de `n.img` (URL absoluta de la foto principal en el sitio
  actual). Todavia no esta en `notas.json`: hay que sumarla en `prep.py` desde
  el crawl. Mientras, cada placa usa una foto de banco de la marca de
  `../fotos/demo-*.webp` (sacadas de la maqueta de mascaras, WebP q72).
- `../campo.webp` y `../campo-m.webp` (la foto de campo del header anterior,
  sacada de `01 Profertil/Caso de Estudio/Animacion/Editables/Assets/Imagenes/`
  con `cwebp -q 70 -resize <ancho> 0`) hoy no se usan.
- El dock de filtros tiene al lado el **ancla**: un circulo azul con una
  flecha, separado del dock 5 px y con su mismo alto (tambien cuando el dock
  se compacta al bajar). Es la accion principal de la barra, como la flecha
  de bongstudio.ar: al principio de la lista apunta abajo y baja 80% de
  pantalla; pasada media pantalla desde el principio de la lista apunta
  arriba y vuelve al principio de la lista (no al carrusel, donde el dock se
  esconde). Con el panel de filtros abierto, primero lo cierra. Aparece y se
  va junto con el dock. El rebote vive solo en el giro de la flecha (resorte
  k 150, c 13,5: se pasa ~22° y se acomoda en 0,75 s); el circulo no rebota
  (aparece con k 220, c 29,7 y al apretarlo baja a 92% con k 600, c 49).
  Todos esos valores son tokens `--ancla-*` (variables `Web/Ancla/*`,
  `Web/Resorte/Ancla *` y `Web/Proporción/Ancla *` en 06 · Web). Codigo: "Ancla"
  en `template.html` (CSS y JS). Documentado en el Figma Master, pagina
  "▤ Novedades · Web", seccion "Ancla" del Doc (despues de "Dock de filtros").

Regenerar la página:

```bash
python3 profertil/novedades/fuente/build.py
```

Rehacer `notas.json` desde el crawl:

```bash
URLS_CSV=/ruta/a/urls.csv python3 profertil/novedades/fuente/prep.py
```

## Tokens: Figma manda

Los valores del sistema (colores, alto de etiqueta y boton, tiempos y curvas
de animacion) viven en las variables del Figma Master
(`broRXp9etWG4y2IjFyCC3V`), colecciones `01 · Primitivas` y `06 · Web`. Cada
variable que usa la web tiene cargado su nombre de CSS en el code syntax
(`var(--etq-m)`, `var(--f-abrir)`...). La web no escribe esos valores: los toma
de `tokens.json`.

Para cambiar un valor:

1. Cambiarlo en la variable de Figma (o crear una nueva con su code syntax WEB).
2. Correr `exportar-tokens.figma.js` sobre el archivo (Claude lo corre con
   `use_figma`; tambien sirve la consola de un plugin de desarrollo) y guardar
   lo que devuelve en `tokens.json`, en `tokens`.
3. Regenerar con `build.py`.

Si el exportador informa `conflictos`, dos variables usan el mismo nombre de
CSS con valores distintos: se corrige en Figma antes de exportar.
