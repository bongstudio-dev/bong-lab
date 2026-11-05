# Documentos · fuente

`../index.html` (lista) y `../ver/index.html` (visor) se generan desde esta carpeta. No editarlos a mano:
tocar `lista.html`, `visor.html` o los datos y regenerar.

```bash
python3 profertil/documentos/fuente/build.py
```

## Qué hay

- `lista.html`: la lista. Misma lógica que Novedades (barra, buscador en la lupa, filtros en el dock, ancla,
  transición entre páginas) con un encabezado chico y filas en vez de tarjetas: categoría, título, año y descarga.
  Toda la fila es el enlace al visor; el botón de descarga queda por encima.
  Tres vistas (selector de íconos, se recuerda en el navegador): compacta (una línea, solo el ícono de la categoría),
  lista y miniaturas (cuadrados con el arte de las Formas del sistema según la categoría, determinista por documento).
  Los filtros activos (categoría, año y búsqueda) aparecen como chips que se sacan de a uno.
- `visor.html`: la página de un documento, `ver/?d=<id>`. Título arriba a la izquierda y tres columnas: índice de
  páginas (el punto azul viaja con el resorte de la librería), el PDF con scroll continuo y los datos (descarga,
  cantidad de páginas, modo lectura, copiar el link). Cierra con documentos de la misma categoría y el pie.
  Las páginas se dibujan con pdf.js al ancho de la columna, solo las cercanas a la pantalla; cada una reserva su
  lugar con la proporción de su PDF y muestra el brillo de carga hasta que se dibuja.
- `docs.json`: los 668 documentos del sitio actual. Los arma `prep-docs.py` desde el crawl (`urls.csv`).
- `../vendor/`: pdf.js (Apache 2.0), versión legacy para que ande también en Safari viejos.
- `../pdf/`: copia de una muestra de 36 PDF, de todas las categorías.
- `transicion*.{css,js}`, `logo-blanco.svg`, `simbolo-color.svg`, `assets.json`: los mismos de Novedades. El
  `build.py` toma el logo animado de la transición del componente de la librería.

## Datos

Un documento es una página en español de las secciones de biblioteca (`/cereales/`, `/oleaginosas/`,
`/pasturas/`, `/industriales/`, `/msds/`, `/inversores/`, `/biblioteca/`) cuyo único contenido es un título y un
PDF. Salen 668 una vez sacados los repetidos entre ramas. La categoría es la sección que declara la URL.

- **Año:** el que dice el título (277 de 668). Si no lo dice, el de publicación salvo la carga masiva de 2020
  (617 de las 684 páginas están cargadas ese año). El resto queda sin año (391): la lista y el visor lo contemplan,
  y el filtro trae "Sin año".
- **Páginas y peso:** el crawl no los trae. El visor los lee del PDF al abrirlo.
- Hay 15 PDF que cuelgan de más de una página del sitio actual (algunos con títulos distintos); se conserva una
  entrada por título.
- Algunos PDF llegan con saltos de línea antes de `%PDF`. pdf.js lo tolera.

## La muestra de PDF

profertil.com.ar no manda cabeceras CORS, así que pdf.js no puede leer sus PDF desde otro dominio. La lista
muestra los 668, pero el visor dibuja solo los que tienen copia local (`l` en `docs.json`); para los demás
muestra un aviso con el botón que abre el PDF en su dirección original. Con el sitio nuevo en el mismo dominio no
hace falta nada de esto.

```bash
python3 profertil/documentos/fuente/prep-docs.py            # rehace docs.json (conserva las copias)
python3 profertil/documentos/fuente/prep-docs.py --bajar    # además baja una muestra nueva a ../pdf/
```

`URLS_CSV` apunta al `urls.csv` del relevamiento (por defecto, el de `~/Documents/Desarrollo/relevamiento-profertil`).
El servidor del sitio corta si se le pide de a muchos: `--bajar` usa dos pedidos a la vez y reintenta.

## Pendiente de diseño

- Zoom y búsqueda dentro del documento (hoy se ve al ancho de la columna; se puede descargar).
- Capa de texto para seleccionar y copiar desde el visor.
- Qué metadatos va a poder cargar el CMS por documento (hoy solo título, categoría y año): de eso depende si
  la fila puede mostrar tipo (boletín, ensayo, informe) o peso.
