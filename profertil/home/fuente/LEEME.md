# Home · fuente

`../index.html` se genera desde esta carpeta. No editarlo a mano: tocar
`template.html` y regenerar.

```bash
python3 profertil/home/fuente/build.py
```

No tiene datos propios. Tokens (colores, botones, etiquetas, curvas), las 18
formas, los logos y las notas salen de `../../novedades/fuente/`, que sale del
Figma Master. Las fotos son las de banco de `../../novedades/fotos/`.

Las formas recortan las fotos con `mask-image` (cada forma como SVG en data
URI, lo arma `build.py`). Todo el movimiento es `transform` u `opacity` en
animaciones CSS: el relevo del hero por tiempo, y el parallax, el texto del
propósito y la entrada de las tarjetas atados al scroll (`animation-timeline`).
El único JS parte los textos en palabras y cambia el estado de la barra.
