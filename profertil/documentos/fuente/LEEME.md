# Documentos · fuente

`../index.html` (lista) y `../ver/index.html` (visor) se generan desde esta carpeta. No editarlos a mano:
tocar `lista.html`, `visor.html` o los datos y regenerar.

```bash
python3 profertil/documentos/fuente/build.py
```

## Qué hay

- `lista.html`: la Biblioteca Virtual, una sola página con filtros. Misma lógica que Novedades (barra, buscador en la
  lupa, filtros en el dock, ancla, transición entre páginas) con un encabezado chico y filas en vez de tarjetas:
  sección, título, año y descarga.
  Toda la fila es el enlace al visor; el botón de descarga queda por encima.
  Tres vistas (selector de íconos, se recuerda en el navegador): compacta (una línea, solo el ícono de la categoría),
  lista y miniaturas (cuadrados con el arte de las Formas del sistema según la categoría, determinista por documento).
  Los filtros activos (cultivo, zona, año, nutriente y búsqueda) aparecen como chips que se sacan de a uno.
  Ver "Filtros" abajo.
- Buscador: con el chip **En: Documentos** filtra la lista; sin el chip busca en todo el sitio. Es el componente
  compartido de `../../buscador/` (ver su `LEEME.md`), que se carga en el head de `lista.html`.
- `visor.html`: la página de un documento, `ver/?d=<id>`, para los 668 (Biblioteca, hojas de seguridad e
  inversores). En los de la Biblioteca, el link de vuelta va a la lista; en los otros no hay link de vuelta porque su
  página no está en esta maqueta. Título arriba a la izquierda y tres columnas: índice de
  páginas (el punto azul viaja con el resorte de la librería), el PDF con scroll continuo y los datos (descarga,
  cantidad de páginas, modo lectura, copiar el link). Cierra con documentos de la misma categoría y el pie.
  Las páginas se dibujan con pdf.js al ancho de la columna, solo las cercanas a la pantalla; cada una reserva su
  lugar con la proporción de su PDF y muestra el brillo de carga hasta que se dibuja.
- `docs.json`: los 627 documentos de la Biblioteca (secciones cereales, oleaginosas, pasturas, industriales y
  biblioteca). `docs-msds.json` (22 hojas de seguridad) y `docs-inversores.json` (19 informes) son de otras páginas
  del sitio nuevo: no van en la lista, pero el visor los abre igual. Los tres los arma `prep-docs.py` desde el crawl.
- `etiquetas.json`: las etiquetas de la Biblioteca Virtual del sitio actual por documento. Lo arma `prep-etiquetas.py`.
- `../vendor/`: pdf.js (Apache 2.0), versión legacy para que ande también en Safari viejos.
- `../pdf/`: copia de una muestra de 36 PDF, de todas las categorías.
- `transicion*.{css,js}`, `logo-blanco.svg`, `simbolo-color.svg`, `assets.json`: los mismos de Novedades. El
  `build.py` toma el logo animado de la transición del componente de la librería.

## Datos

```bash
python3 profertil/documentos/fuente/prep-docs.py        # docs.json, docs-msds.json, docs-inversores.json
python3 profertil/documentos/fuente/prep-etiquetas.py   # etiquetas.json (lee la Biblioteca Virtual del sitio actual)
python3 profertil/documentos/fuente/build.py            # ../index.html y ../ver/index.html
```

Un documento es una página en español de las secciones de biblioteca (`/cereales/`, `/oleaginosas/`,
`/pasturas/`, `/industriales/`, `/msds/`, `/inversores/`, `/biblioteca/`) cuyo único contenido es un título y un
PDF. Salen 668 una vez sacados los repetidos entre ramas. La sección es la que declara la URL: decide en qué archivo
va cada documento y qué etiqueta y arte lleva la fila, pero ya no es un filtro.

- **Año:** el que dice el título (277 de 668). Si no lo dice, el de publicación salvo la carga masiva de 2020
  (617 de las 684 páginas están cargadas ese año). El resto queda sin año: la fila no muestra año. Es el año que se ve
  en la fila y el que usa el orden "Por año"; el filtro de año es otro (ver abajo).
- **Páginas y peso:** el crawl no los trae. El visor los lee del PDF al abrirlo.
- Hay 15 PDF que cuelgan de más de una página del sitio actual (algunos con títulos distintos); se conserva una
  entrada por título.
- Algunos PDF llegan con saltos de línea antes de `%PDF`. pdf.js lo tolera.

## Etiquetas

La portada de la Biblioteca Virtual del sitio actual tiene una "Búsqueda por categoría" con 78 links: cada uno es una
página que lista los documentos con esa etiqueta, con paginación. `prep-etiquetas.py` lee la portada, toma los grupos
y las opciones en su orden, recorre todas las páginas (dos pedidos a la vez, con reintento; `CACHE=<carpeta>` guarda
el HTML para no volver a pedirlo) y cruza cada entrada con los documentos por dirección. Las fichas de producto y
las noticias que aparecen en esas páginas se ignoran.

Los grupos salen de los encabezados de la portada:

- **Cultivo**: los bloques Cereales, Oleaginosas, Industriales y Pasturas, con sus cultivos.
- **Zona**: el bloque Provincia. Cada provincia tiene "Todas las localidades de..." (la provincia entera) y sus localidades.
- **Año**: 2010 a 2020.
- **Nutriente**: K, Micro, N, NP, NPK, NPKS, NPS, NS, P, PS, S, Suelos.

Resultado sobre los 627 documentos (noviembre de 2026):

| Grupo | Con etiqueta | Sin clasificar |
|---|---|---|
| Cultivo | 76 | 551 |
| Zona | 374 | 253 |
| Año | 57 | 570 |
| Nutriente | 610 | 17 |
| Alguna | 614 | 13 |

- Arroz, Maíz, Soja y Caña de azúcar no llevan a la Biblioteca: redirigen a la página de productos para ese cultivo.
  Quedan sin documentos y la página no las muestra, igual que 2020 (su página no lista documentos). Algodón, Té y Yerba
  mate figuran en la portada sin link.
- El link de P en la portada apunta a su segunda página; el script empieza siempre por la primera.
- Dos entradas que listan las páginas de etiqueta no están entre los documentos (tienen más de un PDF): quedan en
  `fuera` dentro de `etiquetas.json`.
- El año de la etiqueta y el del título no siempre coinciden (36 de 57 coinciden). El filtro usa el de la etiqueta.

## Filtros

- Cuatro grupos en el orden de la portada, en acordeón: un grupo abierto por vez; cerrado, muestra lo elegido (en el
  resumen y como pastillas que se sacan tocándolas). En la barra del dock, en desktop, cada grupo abre el panel en él.
- Dentro de un grupo las opciones suman (o); entre grupos se cruzan (y). Cada opción muestra cuántos documentos
  quedarían al sumarla; las que darían 0 se atenúan y no responden.
- Cultivo, zona y nutriente usan la pastilla de filtro (cultivo en verde); año, el chip de año.
- Al final de cada grupo, "Sin clasificar": los documentos sin etiqueta en ese grupo.
- La selección vive en la dirección: `#cultivo=avena&zona=pergamino,balcarce&anio=2011&nutriente=n&q=urea&orden=anio`.
- En el celular el botón del dock abierto dice cuántos documentos quedan ("Ver 24 documentos") y cierra el panel.

## La muestra de PDF

profertil.com.ar no manda cabeceras CORS, así que pdf.js no puede leer sus PDF desde otro dominio. La lista
muestra los 627 de la Biblioteca, pero el visor dibuja solo los que tienen copia local (`l` en `docs.json`); para los demás
muestra un aviso con el botón que abre el PDF en su dirección original. Con el sitio nuevo en el mismo dominio no
hace falta nada de esto.

```bash
python3 profertil/documentos/fuente/prep-docs.py            # rehace los tres .json (conserva las copias)
python3 profertil/documentos/fuente/prep-docs.py --bajar    # además baja una muestra nueva a ../pdf/
```

`URLS_CSV` apunta al `urls.csv` del relevamiento (por defecto, el de `~/Documents/Desarrollo/relevamiento-profertil`).
El servidor del sitio corta si se le pide de a muchos: `--bajar` usa dos pedidos a la vez y reintenta.

## Pendiente de diseño

- Zoom y búsqueda dentro del documento (hoy se ve al ancho de la columna; se puede descargar).
- Capa de texto para seleccionar y copiar desde el visor.
- Qué metadatos va a poder cargar el CMS por documento (hoy título, sección, año y las etiquetas del sitio actual): de eso depende si
  la fila puede mostrar tipo (boletín, ensayo, informe) o peso.
