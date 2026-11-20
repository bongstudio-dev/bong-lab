// Bong Lab: el sitio se publica en GitHub Pages bajo /bong-lab/.
// Las páginas del sitio de Profertil (Novedades, notas, Biblioteca, documentos, Hojas de seguridad, Sala de prensa)
// las arma Astro desde src/. Todo lo demás (portada, experimentos, librería de componentes, PDF, fotos) se publica
// tal cual desde su carpeta: ver src/integraciones/estaticos.mjs.
import { defineConfig } from "astro/config";
import estaticos from "./src/integraciones/estaticos.mjs";

export default defineConfig({
  site: "https://bongstudio-dev.github.io",
  base: "/bong-lab",
  trailingSlash: "always",
  build: { format: "directory", inlineStylesheets: "never" },
  // El HTML sale con sus espacios tal cual: el espacio entre etiquetas cuenta en piezas en línea.
  compressHTML: false,
  devToolbar: { enabled: false },
  integrations: [estaticos()],
});
