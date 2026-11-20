# Bong Lab

Experimentos, prototipos y herramientas de Bong Studio, publicados con GitHub Pages.

Portada: https://bongstudio-dev.github.io/bong-lab/

## Cómo sumar un experimento

1. Creá una carpeta `/<cliente>/<experimento>/` y poné adentro el HTML como `index.html`. Si usa imágenes u otros archivos, van en la misma carpeta con rutas relativas.
2. En el `index.html` de la raíz, agregá un objeto al array `EXPERIMENTOS` (está al principio del archivo):

   ```js
   {
     titulo: "Nombre del experimento",
     cliente: "Cliente",
     descripcion: "Una línea que cuente qué es.",
     grupo: "Nombre de la carpeta de la portada",
     url: "cliente/experimento/",
   },
   ```

   `grupo` es la "carpeta" de la portada donde se muestra: solo agrupa visualmente y no cambia ninguna dirección. Si es un grupo nuevo, sumalo también a `ORDEN_GRUPOS` (define el orden).

3. Hacé commit y push a `main`. Se publica en unos minutos en `https://bongstudio-dev.github.io/bong-lab/<cliente>/<experimento>/`.

Para probarlo local: `npm install` (la primera vez) y `npm run dev`, y abrí http://localhost:4321/bong-lab/.

Los experimentos se publican tal cual, sin pasar por ningún paso de armado. Las páginas del sitio de Profertil
(Novedades, notas, Biblioteca, documentos, Hojas de seguridad y Sala de prensa) se arman con Astro desde `src/`:
ver `src/LEEME.md`. Al hacer push a `main`, GitHub Actions arma el sitio y lo publica.

---

BONG STUDIO · 2026 — Brutally Clear Branding — bongstudio.ar
