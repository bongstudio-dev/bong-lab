# Novedades · fuente

`../index.html` se genera desde esta carpeta. No editarlo a mano: tocar
`template.html` (o los datos) y regenerar.

- `template.html`: la página, con marcadores para datos, logos y foto.
- `notas.json`: las 471 notas de /noticias-recientes/, salidas del crawl del
  sitio actual (`urls.csv`, en Drive).
- `assets.json`: las 18 formas oficiales del sistema.
- `logo-blanco.svg`, `simbolo-color.svg`: exportados del Figma Master.
- El hero es un carrusel a pantalla completa con las 5 notas mas recientes.
  Para elegir otras, cargar sus rutas (`u`) en `DESTACADAS`, en
  `template.html`. El fondo de cada placa es arte de formas hasta que haya
  fotos de las notas.
- `../campo.webp` y `../campo-m.webp` (la foto de campo del header anterior,
  sacada de `01 Profertil/Caso de Estudio/Animacion/Editables/Assets/Imagenes/`
  con `cwebp -q 70 -resize <ancho> 0`) hoy no se usan.

Regenerar la página:

```bash
python3 profertil/novedades/fuente/build.py
```

Rehacer `notas.json` desde el crawl:

```bash
URLS_CSV=/ruta/a/urls.csv python3 profertil/novedades/fuente/prep.py
```
