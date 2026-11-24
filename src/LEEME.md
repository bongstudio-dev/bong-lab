# Sitio de Profertil · Astro

Las páginas del sitio de la maqueta (Novedades, cada nota, la Biblioteca, cada documento, Hojas de seguridad y Sala de
prensa) se arman con [Astro](https://astro.build) desde esta carpeta. Lo publicado sigue siendo HTML y CSS, con los
mismos scripts de siempre: Astro no suma librerías al navegador.

Todo lo demás del Lab (portada, experimentos, tweaks, landings, la librería de componentes, los PDF y las fotos) se
publica tal cual desde su carpeta, sin pasar por Astro.

## Probar y publicar

```bash
npm install          # la primera vez
npm run dev          # servidor local en http://localhost:4321/bong-lab/ (sirve también lo estático)
npm run build        # arma el sitio entero en dist/
npm run preview      # sirve dist/ como queda publicado
```

`astro dev` corre en segundo plano: `npx astro dev stop` lo para y `npx astro dev logs` muestra lo que pasa.

Al hacer push a `main`, GitHub Actions arma el sitio y lo publica en Pages (`.github/workflows/publicar.yml`). El paso
frena si el sitio pasa de 950 MB (Pages admite hasta 1 GB; hoy pesa unos 650 MB, 457 MB son los PDF).

## Direcciones

| Página | Dirección | Sale de |
|---|---|---|
| Novedades | `profertil/novedades/` | `pages/profertil/novedades/index.astro` |
| Una nota | `profertil/novedades/<nota>/` (471) | `pages/profertil/novedades/[nota].astro` |
| Biblioteca | `profertil/biblioteca/` | `pages/profertil/biblioteca/index.astro` |
| Un documento | `profertil/biblioteca/<id>/` (715) | `pages/profertil/biblioteca/[doc].astro` |
| Hojas de seguridad | `profertil/hojas-de-seguridad/` | `pages/profertil/hojas-de-seguridad/index.astro` |
| Situación financiera | `profertil/situacion-financiera/` | `pages/profertil/situacion-financiera/index.astro` |
| Gobierno societario | `profertil/gobierno-societario/` | `pages/profertil/gobierno-societario/index.astro` |
| Títulos de deuda | `profertil/titulos-de-deuda/` | `pages/profertil/titulos-de-deuda/index.astro` |
| Legajo impositivo | `profertil/legajo-impositivo/` | `pages/profertil/legajo-impositivo/index.astro` |
| Proveedores | `profertil/proveedores/` | `pages/profertil/proveedores/index.astro` |
| Sala de prensa | `profertil/sala-de-prensa/` | `pages/profertil/sala-de-prensa/index.astro` |
| Índice del buscador | `profertil/buscador/indice.json` | `pages/profertil/buscador/indice.json.ts` |

`<nota>` es el `ar` de cada nota de `notas.json` y `<id>`, el `id` de cada documento. Las direcciones de antes siguen
andando: `novedades/nota/?n=<nota>` y `biblioteca/ver/?d=<id>` llevan a la nueva conservando el resto de la consulta y
el `#` (las arman `nota/index.astro` y `ver/index.astro` con `componentes/Redireccion.astro`). También `documentos/` y
`novedades/nota-campo/`, que siguen como archivos estáticos.

El build se frena si una página choca con un archivo estático (por ejemplo, una nota con el mismo nombre que una
carpeta de `novedades/`, como `fotos` o `notas`).

## Qué hay en cada carpeta

- `pages/`: una página por dirección. Lee los datos y arma la página con los componentes.
- `componentes/`: las piezas comunes.
  - `Pagina.astro`: el layout. Firma de Bong en el código, `<head>` común, la transición entre páginas (Persiana con
    logo animado), la cabecera con campo si la lleva y el pie.
  - `Cabeza.astro`: título, descripción, fuentes, `tokens.css`, `base.css` y el buscador con alcance.
  - `Barra.astro`, `Dock.astro` (filtros), `Ancla.astro`, `Pie.astro`, `Simbolos.astro` (logos y badge para `<use>`).
  - `Lista.astro`: la plantilla de lista de documentos (Biblioteca, Hojas de seguridad, Situación financiera, Legajo
    impositivo y Proveedores).
  - `Redireccion.astro`: lleva de una dirección vieja con parámetro a la nueva.
- `paginas/`: el CSS y el script propios de cada página (`novedades/`, `biblioteca/`, `sala-de-prensa/`). Los datos
  entran por marcas del tipo `/*__NOTAS__*/[]`, que la página reemplaza al armarse (`armar()` de `lib/sistema.mjs`;
  si falta una marca, el build se frena). `comun.js` es el bloque que comparten dos páginas (Novedades y nota;
  Biblioteca y documento).
- `compartido/`: logos, Formas (`assets.json`), la transición entre páginas (`transicion/novedades/`, con el panel de
  ajuste apagado, y `transicion/biblioteca/`, fija) y la cabecera con campo (`campo/`).
- `lib/`: lo que corre al armar. `sistema.mjs` (rutas, logos, transición y pie tomados de la librería de componentes),
  `datos.mjs` (lee los JSON de cada `fuente/`) y `firma.mjs`.
- `integraciones/estaticos.mjs`: publica lo estático tal cual y marca la versión (`?v=<huella>`) de los CSS y JS
  locales que cargan las páginas, para que la caché del navegador nunca mezcle una página nueva con un `base.css` viejo.

## Lo que no cambió

- `profertil/componentes/tokens.css` y `base.css` siguen en su lugar: los leen las páginas, la librería y
  `pastillas-tweak`. `tokens.css` sale de `componentes/fuente/generar-tokens.py`.
- `profertil/componentes/barra-vista.js` (la barra de vista de las listas) y `profertil/buscador/alcance.js` son
  archivos estáticos que cargan las páginas.
- El pie y la transición se toman de la librería al armar (`c/pie.js` y `c/transicion-navegacion.js`): un ajuste en la
  librería llega a las páginas en el próximo build.
- Los datos los siguen armando los `prep-*.py` de cada `fuente/` y `bajar-miniaturas.py`. Después de correrlos,
  `npm run build`.

## Por qué cada nota y cada documento comparten un archivo de datos

Cada página de nota necesita la lista de todas las notas (para elegir las relacionadas) y cada página de documento la de
todos los documentos. Si cada una la llevara adentro, el sitio pasaría de 1 GB. Van en `novedades/datos-notas.js` y
`biblioteca/datos-docs.js`, que el navegador baja una vez y reusa.
