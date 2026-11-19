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
- **Pestañas** con el Selector de `base.css`, fijas debajo de la barra al bajar. La fila no tiene fondo: queda solo la
  cápsula, con su tono hecho opaco para que se lea sobre fotos y miniaturas. En escritorio el selector de vistas de la
  pestaña va en la misma fila fija, a la derecha y con el mismo alto, en escritorio y en el celular. Las pestañas no
  llevan número (el total ya está en el contador). En el celular la cápsula de pestañas mide lo suyo, así no cambia de
  ancho entre pestañas, y el selector tiene tres opciones (en Fotos, chicas son 3 columnas). En escritorio, para que la
  fila ocupe menos, cada selector tiene dos: Gacetillas compacta y miniaturas, Fotos chicas y grandes (si estaba elegida
  la del medio, pasa a compacta o a grandes). Al bajar, la fila fija
  se esconde por detrás de la barra azul y al subir vuelve (como el dock, que se achica al bajar); en su lugar, con el panel
  de filtros o el buscador abiertos, se ve siempre.
- **Saltos de scroll propios:** el cambio de vista, de pestaña o de filtro reacomoda el scroll con `saltar()`, que no cuenta
  como scroll del usuario (antes el dock se achicaba y agrandaba con cada cambio de vista). El cambio de vista toma de
  referencia la primera fila visible debajo de la fila fija. Al cambiar de pestaña el indicador viaja y lo
  de abajo (resultado y panel) se funde afuera, cambia sin verse (también el salto al principio de la lista) y entra
  fundiéndose con un ascenso de 12 px (la curva base `--ease`, como el dock). El selector de vistas de la fila fija, entre
  Gacetillas y Fotos, no desaparece: la cápsula y su pastilla quedan como esqueleto, los íconos se funden y cambian y la
  pastilla viaja a la opción elegida de la otra pestaña (clase `pf-muda`). Hacia o desde Logos, que no tiene selector, se
  funde entero. Cada una con su ancla: `#gacetillas`, `#fotos`, `#logos`. Filtros y búsqueda en la dirección:
  `#gacetillas&tipo=aviso&anio=2023&q=planta`, `#fotos&galeria=urea`. Alias para redirigir las direcciones viejas:
  `#videos` (abre Fotos), `#documentos`, `#_fotos`, `#_documentos`, `#_videos`, `#_gacetillas-de-prensa`.
- **Dock con pocos grupos**: si la pestaña tiene dos grupos de filtros o menos (hoy todas), la barra no lleva una pastilla
  por grupo, queda solo el botón Filtros (el del celular, con el contador, pastilla entera y sin hover de fondo) y el panel muestra todos los grupos abiertos,
  sin acordeón. Con tres o más vuelve el dock de la Biblioteca tal cual.
- **Gacetillas**: la fila de documento de `base.css` con la fecha completa. Abren en el visor de la Biblioteca
  (`../biblioteca/ver/?d=prensa-...`), que vuelve a la Sala de prensa. Filtros Tipo (Gacetilla o Aviso a la comunidad,
  las mismas etiquetas que esos tipos en Novedades) y Año. Selector de vistas de la Biblioteca (compacta, lista,
  miniaturas; se recuerda en `prensa-vista`): en miniaturas va la foto de la gacetilla si tiene (8 de 47) y si no el arte
  de Formas de la Biblioteca. En miniaturas del celular la etiqueta de Aviso a la comunidad se
  abrevia «Aviso comunidad» (sobre el arte no entra entera); en el resto de las vistas y en escritorio va completa.
- **Fotos**: masonry por filas (cada foto a la columna más corta, por su proporción) con visor propio
  (flechas, Esc, deslizar, descarga del original). Filtro Galería. Selector de tamaño como el de Novedades (chicas,
  medianas, grandes: 6 y 3 columnas en escritorio (sin medianas), 3/2/1 en el celular; se recuerda en `prensa-fotos-vista`).
  Al cambiar, las fotos viajan a su lugar nuevo.
- **Cambio de vista (Gacetillas y Fotos):** solo se anima lo que queda a la vista. Lo que ya se veía viaja a su lugar nuevo
  (las gacetillas, que cambian de forma, además se funden desde 35%); lo que no se veía y ahora sí entra fundiéndose con un
  ascenso de 12 px, escalonado de a 30 ms (tope 8). Todo con `opacity` y `transform` (`el.animate()`), nada de layout animado,
  y nada con `prefers-reduced-motion`. Si la foto pasa a la versión grande, se ve la miniatura hasta que la grande carga.
- **Logos**: una tarjeta por versión con su vista previa y las descargas en SVG, PNG y PDF. Sin filtros ni selector
  (el dock no aparece).

## Datos (`prep-prensa.py` → `prensa.json`)

Lee el HTML guardado del relevamiento (`~/Documents/Desarrollo/relevamiento-profertil/data/html`, o `RELEVAMIENTO=`).

- **Título y fecha de cada gacetilla:** los del encabezado del PDF (`pdftotext`, primera página), porque el sitio no
  los trae. Los que vienen en mayúsculas se pasan a oración a mano (`TITULOS`), conservando siglas y nombres propios.
  Una (Simposio Fertilidad 2023) no dice el día: queda con mes y año.
- **Tipo:** Aviso a la comunidad si el PDF se titula "Información para la comunidad" o "Novedades de planta"; si no, Gacetilla.
- **PDF:** se guardan con las copias de la Biblioteca (`../../biblioteca/pdf/`), con su mismo criterio de nombre.
  `prep-docs.py` de la Biblioteca no los borra (los lee de `prensa.json`).
- **Foto de la gacetilla:** las 8 que traen foto se copian en `../fotos/gacetillas/<id>.webp` (720 px) y quedan en
  `fm`; el build no publica la dirección original.
- **Fotos:** el original de cada miniatura de las 6 galerías, sin repetidos (59). En `../fotos/<galería>/NN.webp`
  (2000 px) y `NN-mini.webp` (720 px). La descarga apunta al original del sitio.
- **Logos:** copia local en `../logos/`.

## Pendiente

- Confirmar con Profertil el teléfono de prensa. Videos salió de la página (el de YouTube ya no existe y los MP4 son
  institucionales viejos); si vuelve, se suma como pestaña o sección.
- Qué carga el CMS por gacetilla (título, fecha, tipo, foto): hoy el sitio solo tiene mes y PDF.
- Algunas galerías repiten la misma foto en distintos formatos (Planta Ingeniero White 1 en JPG, JPEG y PNG); se quitaron
  solo los repetidos exactos de dirección.
