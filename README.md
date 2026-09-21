# Bong Lab

Experimentos generativos de Bong Studio, publicados con GitHub Pages.

Portada: https://bongstudio-dev.github.io/bong-lab/

## Cómo sumar un experimento

1. Creá una carpeta `/<cliente>/<experimento>/` y poné adentro el HTML como `index.html`. Si usa imágenes u otros archivos, van en la misma carpeta con rutas relativas.
2. En el `index.html` de la raíz, agregá un objeto al array `EXPERIMENTOS` (está al principio del archivo):

   ```js
   {
     titulo: "Nombre del experimento",
     cliente: "Cliente",
     descripcion: "Una línea que cuente qué es.",
     url: "cliente/experimento/",
   },
   ```

3. Hacé commit y push a `main`. Pages lo publica en uno o dos minutos en `https://bongstudio-dev.github.io/bong-lab/<cliente>/<experimento>/`.

Para probarlo local, levantá un servidor desde la raíz (`python3 -m http.server 8777`) y abrí http://localhost:8777.

---

BONG STUDIO · 2026 — Brutally Clear Branding — bongstudio.ar
