# Sala de prensa · fuente

`../index.html` se genera desde esta carpeta. No editarlo a mano: tocar `sala.html` o los datos y regenerar.

```bash
python3 profertil/sala-de-prensa/fuente/prep-prensa.py --bajar   # prensa.json, PDF, fotos y logos (solo baja lo que falta)
python3 profertil/sala-de-prensa/fuente/build.py                 # ../index.html
python3 profertil/biblioteca/fuente/build.py                     # el visor de la Biblioteca, que abre las gacetillas
python3 profertil/buscador/fuente/indice.py                      # el índice del buscador (grupo Gacetillas)
```

## Cómo funciona hoy en el sitio actual

No es una página con pestañas: son páginas sueltas que repiten la misma cabecera (portada, bienvenida y una fila de
"pestañas" que son links a otras direcciones) y el contacto al pie.

- **Gacetillas de prensa** lleva a `/gacetillas-de-prensa-2022`, que está vacía. Las de 2021 (26) y 2023 (21) existen
  pero ninguna pestaña llega a ellas. Cada gacetilla es un mes y un botón "Descarga" al PDF, sin título.
- **Fotos** muestra 4 galerías. Oficinas de Buenos Aires y Profertil en el campo existen y no están enlazadas.
- **Documentos** lleva a `/inversores/documentos`, otra sección. No tiene documentos: son los logos
  (Principal, Con slogan, Monocromático y Símbolo, en PDF, PNG y SVG). `/sala-de-prensa/documentos` es una copia igual.
- **Videos** aparece solo en algunas páginas y lleva a `/inversores/videos`: un video de YouTube, dos MP4 para bajar y
  el canal. El video de YouTube ya no existe (el oEmbed da 404, noviembre de 2026).
- El teléfono de contacto no es el mismo en todas las páginas (8000 y 8084). Se tomó el de la página de Fotos.
- `/category/sala-de-prensa` es el archivo de noticias de WordPress: va a Novedades (decisión de arquitectura).

## Qué hace esta página

Una sola página con la lógica de la Biblioteca y Novedades: cabecera con campo (azul, Forma escudo, la del badge de
Gacetilla), hoja de borde a borde, buscador en la lupa, filtros en el dock y ancla.

- **Contacto de prensa** dentro de la tarjeta de la cabecera, siempre a la vista (a la derecha en escritorio ancho).
- **Pestañas** con el Selector de `base.css`, fijas debajo de la barra al bajar. Cada una con su ancla: `#gacetillas`,
  `#fotos`, `#logos`. Filtros y búsqueda en la dirección: `#gacetillas&tipo=aviso&anio=2023&q=planta`, `#fotos&galeria=urea`.
  Alias para redirigir las direcciones viejas: `#videos` (abre Fotos y baja a Videos), `#documentos`, `#_fotos`,
  `#_documentos`, `#_videos`, `#_gacetillas-de-prensa`.
- **Gacetillas**: la fila de documento de `base.css` con la fecha completa. Abren en el visor de la Biblioteca
  (`../biblioteca/ver/?d=prensa-...`), que vuelve a la Sala de prensa. Filtros Tipo (Gacetilla o Aviso a la comunidad,
  las mismas etiquetas que esos tipos en Novedades) y Año.
- **Fotos y videos**: masonry por filas (cada foto a la columna más corta, por su proporción) con visor propio
  (flechas, Esc, deslizar, descarga del original). Filtro Galería. Al final, Videos: como no hay video de YouTube vigente,
  el primer MP4 se ve en la página; los dos MP4 se descargan y el canal se abre afuera.
- **Logos**: una tarjeta por versión con su vista previa y las descargas en SVG, PNG y PDF. Sin filtros (el dock no aparece).

## Datos (`prep-prensa.py` → `prensa.json`)

Lee el HTML guardado del relevamiento (`~/Documents/Desarrollo/relevamiento-profertil/data/html`, o `RELEVAMIENTO=`).

- **Título y fecha de cada gacetilla:** los del encabezado del PDF (`pdftotext`, primera página), porque el sitio no
  los trae. Los que vienen en mayúsculas se pasan a oración a mano (`TITULOS`), conservando siglas y nombres propios.
  Una (Simposio Fertilidad 2023) no dice el día: queda con mes y año.
- **Tipo:** Aviso a la comunidad si el PDF se titula "Información para la comunidad" o "Novedades de planta"; si no, Gacetilla.
- **PDF:** se guardan con las copias de la Biblioteca (`../../biblioteca/pdf/`), con su mismo criterio de nombre.
  `prep-docs.py` de la Biblioteca no los borra (los lee de `prensa.json`).
- **Fotos:** el original de cada miniatura de las 6 galerías, sin repetidos (59). En `../fotos/<galería>/NN.webp`
  (2000 px) y `NN-mini.webp` (720 px). La descarga apunta al original del sitio.
- **Logos:** copia local en `../logos/`.

## Pendiente

- Confirmar con Profertil el teléfono de prensa y si el video institucional de YouTube se vuelve a subir.
- Qué carga el CMS por gacetilla (título, fecha, tipo, foto): hoy el sitio solo tiene mes y PDF.
- Algunas galerías repiten la misma foto en distintos formatos (Planta Ingeniero White 1 en JPG, JPEG y PNG); se quitaron
  solo los repetidos exactos de dirección.
