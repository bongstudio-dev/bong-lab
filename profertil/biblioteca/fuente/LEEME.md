# Documentos · fuente

`../index.html` (lista) y `../ver/index.html` (visor) se generan desde esta carpeta. No editarlos a mano:
tocar `lista.html`, `visor.html` o los datos y regenerar.

```bash
python3 profertil/biblioteca/fuente/build.py
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
- `../pdf/`: copia de todos los PDF (ver "Los PDF" abajo).
- `transicion*.{css,js}`, `logo-blanco.svg`, `simbolo-color.svg`, `assets.json`: los mismos de Novedades. El
  `build.py` toma el logo animado de la transición del componente de la librería.

## Datos

```bash
python3 profertil/biblioteca/fuente/prep-docs.py        # docs.json, docs-msds.json, docs-inversores.json
python3 profertil/biblioteca/fuente/prep-etiquetas.py   # etiquetas.json (lee la Biblioteca Virtual del sitio actual)
python3 profertil/biblioteca/fuente/build.py            # ../index.html y ../ver/index.html
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
  entrada por título. Entre los 668 quedan 4 PDF compartidos por 10 documentos: se guardan una sola vez.
- Algunos PDF llegan con saltos de línea antes de `%PDF`. pdf.js lo tolera; el chequeo de `prep-docs.py` mira el primer KB.

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
| Cultivo | 456 | 171 |
| Zona | 374 | 253 |
| Año | 57 | 570 |
| Nutriente | 610 | 17 |
| Alguna | 621 | 6 |

- Los links de la portada usan `/sustentabilidad/`, que para Arroz, Maíz, Soja y Caña de azúcar redirige a la página de
  productos. El script reemplaza esa ruta por `/sostenibilidad/`, que es la que lista los documentos de cada opción.
  Quedan sin documentos solo 2020 (su página no lista documentos), y Algodón, Té y Yerba mate figuran en la portada sin link.
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

## Los PDF

profertil.com.ar no manda cabeceras CORS, así que pdf.js no puede leer sus PDF desde otro dominio. Por eso la maqueta
trae una copia de cada uno en `../pdf/` y el visor lee esa copia. Con el sitio nuevo en el mismo dominio no hace falta.

- 668 documentos, 662 direcciones de PDF distintas, unos 450 MB en total (noviembre de 2026). El más pesado, 35 MB;
  la mitad pesa menos de 320 KB. Se guardan tal como vienen, sin recomprimir.
- Un archivo por dirección: si un PDF cuelga de varios documentos, todos apuntan al mismo. El nombre sale de la
  dirección (minúsculas, sin acentos ni caracteres raros, hasta 80 caracteres; si dos chocan, `-2`, `-3`).
- `l` en los tres `.json` es ese nombre. El visor y la lista también aceptan en `l` una dirección completa (`https://...`),
  por si alguna vez los PDF se alojan aparte en un lugar que permita leerlos.
- Sin `l` (el original da error), el visor muestra un aviso con el botón que abre la dirección original. Hoy son 2,
  los dos de Inversores: `Estatuto.pdf` y el poder de administración de 2022, que dan 404 en el sitio actual.

```bash
python3 profertil/biblioteca/fuente/prep-docs.py            # rehace los tres .json y marca `l` según lo que hay en ../pdf/
python3 profertil/biblioteca/fuente/prep-docs.py --bajar    # además baja los que falten
```

`--bajar` conserva lo ya bajado, baja de a dos pedidos (el servidor corta si se le pide de a muchos) con reintentos,
guarda solo lo que llegó entero y es PDF, borra de `../pdf/` lo que ya no corresponde a ningún documento y lista los
fallos al final. `URLS_CSV` apunta al `urls.csv` del relevamiento (por defecto, el de
`~/Documents/Desarrollo/relevamiento-profertil`).

## Pendiente de diseño

- Zoom y búsqueda dentro del documento (hoy se ve al ancho de la columna; se puede descargar).
- Capa de texto para seleccionar y copiar desde el visor.
- Qué metadatos va a poder cargar el CMS por documento (hoy título, sección, año y las etiquetas del sitio actual): de eso depende si
  la fila puede mostrar tipo (boletín, ensayo, informe) o peso.
