# Novedades · fuente

`../index.html` se genera desde esta carpeta. No editarlo a mano: tocar
`template.html` (o los datos) y regenerar.

- `template.html`: la página, con marcadores para datos, logos y foto.
- `notas.json`: las 471 notas de /noticias-recientes/, salidas del crawl del
  sitio actual (`urls.csv`, en Drive).
- `assets.json`: las 18 formas oficiales del sistema.
- `logo-blanco.svg`, `simbolo-color.svg`: exportados del Figma Master.
- La foto del header no se embebe: son `../campo.webp` (2560 px) y
  `../campo-m.webp` (1200 px, mobile), sacadas del original en
  `01 Profertil/Caso de Estudio/Animacion/Editables/Assets/Imagenes/`
  con `cwebp -q 70 -resize <ancho> 0`.

Regenerar la página:

```bash
python3 profertil/novedades/fuente/build.py
```

Rehacer `notas.json` desde el crawl:

```bash
URLS_CSV=/ruta/a/urls.csv python3 profertil/novedades/fuente/prep.py
```
