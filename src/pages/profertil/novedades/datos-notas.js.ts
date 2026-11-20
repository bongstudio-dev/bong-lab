// Todas las notas (para las relacionadas, el tipo y el arte de cada tarjeta), en un solo archivo que comparten las
// 471 páginas de nota: el navegador lo baja una vez.
import { NOTAS } from "../../../lib/datos.mjs";
import { js } from "../../../lib/sistema.mjs";

export function GET() {
  return new Response("window.PF_NOTAS = " + js(NOTAS) + ";\n", { headers: { "Content-Type": "text/javascript; charset=utf-8" } });
}
