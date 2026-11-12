# Buscador con alcance

El buscador de la barra (la lupa) busca por defecto dentro de la sección y se puede ampliar a todo el sitio.
Lo usan Documentos y Novedades con el mismo componente.

- `alcance.css` y `alcance.js`: el componente. Se suma al buscador que ya tiene la página (pieza "barra" de
  `../componentes/base.css`), sin reemplazarlo.
- `indice.json`: el índice de todo el sitio. Se genera, no se edita a mano.
- `fuente/indice.py`: el script que lo arma.

## Cómo funciona

- Al abrir el buscador aparece al final del campo un interruptor chico con dos opciones: **Documentos** (o
  **Novedades**) y **Todo el sitio**. La elegida va en el tono del chip; la otra, en texto gris.
- En la sección (por defecto), lo que se escribe filtra la lista de la página en el lugar, igual que siempre.
- En **Todo el sitio** abajo de la barra se abre un panel con los resultados por tipo (Documentos, Notas, Páginas),
  con el contador de cada grupo y los primeros cinco. "Ver los N" lleva a la lista de ese tipo con la búsqueda
  aplicada; si es la sección donde uno está, vuelve a la sección. Las páginas no tienen lista: el botón las
  despliega en el panel.
- Al cerrar el buscador vuelve a la sección.
- El campo no muestra contador: la lista de la página ya dice cuántos hay. Abierto mide 42 px de alto y hasta
  440 px de ancho.
- Si en la sección no hay resultados, el aviso de la página suma el botón **Buscar en todo el sitio (N)**.
- Teclado: `/` abre, Tab llega al interruptor, flechas izquierda y derecha cambian la opción, flecha abajo (o
  Enter) entra al panel, flechas arriba y abajo recorren los resultados y vuelven al campo, Esc cierra.
- La búsqueda no distingue tildes ni mayúsculas y usa la misma regla que las listas (el texto entero), así el
  número de "Ver los N" coincide con lo que muestra la lista.
- La dirección guarda el alcance amplio: `#en=sitio&q=texto` abre el buscador así al recargar.
- En celular el campo abierto ocupa el lugar del logo y "Todo el sitio" pasa a decir "Sitio".

## Sumarlo a una página

La página tiene que usar la barra con sus ids (`pf-busca`, `pf-q`, `pf-nav`, `pf-goSearch`, `pf-qClose`; el
aviso sin resultados, si lo hay, `pf-empty`). En el head, después de `base.css`:

```html
<link rel="stylesheet" href="../buscador/alcance.css">
<script src="../buscador/alcance.js" data-seccion="documentos" data-nombre="Documentos" defer></script>
```

`data-seccion` es el id del grupo del índice que corresponde a la página; `data-nombre`, el texto del chip.
En Documentos va en `documentos/fuente/lista.html` y en Novedades en `novedades/fuente/template.html`; después,
el `build.py` de cada una.

## El índice

```bash
python3 profertil/buscador/fuente/indice.py            # documentos, notas y páginas
python3 profertil/buscador/fuente/indice.py --sin-red  # sin pedir el mapa: conserva las páginas que ya había
```

Hay que correrlo cuando cambian `documentos/fuente/docs.json`, `novedades/fuente/notas.json` o el mapa de
arquitectura. Cada ítem es `[título, url, resumen]`, con la url relativa a `profertil/` (o absoluta si va al
sitio actual).

| Grupo | Sale de | Resumen | Lleva a |
|---|---|---|---|
| Documentos (668) | `documentos/fuente/docs.json` | categoría y año | `documentos/ver/?d=…` |
| Notas (471) | `novedades/fuente/notas.json` | tipo, año y bajada (hasta 140 letras) | `novedades/nota/?n=…` |
| Páginas (28) | mapa de arquitectura v0 (`/api/arquitectura`), solo nodos `pagina` | dónde está en el menú | la maqueta si existe (Novedades), si no la dirección del sitio actual |

Queda afuera: el texto completo de las notas (`novedades/notas/`) y de los PDF, los nodos del mapa que no son
página (registros, secciones, plantillas) y las notas de trabajo del mapa.

### Sumar un tipo de contenido

1. En `fuente/indice.py`, una función que devuelva la lista de `[título, url, resumen]`.
2. Sumarla a `GRUPOS` con su id, nombre, singular, plural, artículo ("los" o "las") y la dirección de su lista
   con la búsqueda aplicada (por ejemplo `'productos/#q='`). Si no tiene lista, `''`: el panel muestra todos.
3. Correr el script. El panel lo muestra solo, en el orden de `GRUPOS`.
4. Si la sección nueva tiene buscador, sumarle el componente con su `data-seccion`.
