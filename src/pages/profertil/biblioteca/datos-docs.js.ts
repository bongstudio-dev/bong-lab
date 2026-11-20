// Todos los documentos que abre la página de documento (para "Más de la Biblioteca" y el buscador de la barra), en un
// solo archivo que comparten las 715 páginas: el navegador lo baja una vez.
import { DOCS_VISOR } from "../../../lib/datos.mjs";
import { js } from "../../../lib/sistema.mjs";

export function GET() {
  return new Response("window.PF_DOCS = " + js(DOCS_VISOR) + ";\n", { headers: { "Content-Type": "text/javascript; charset=utf-8" } });
}
