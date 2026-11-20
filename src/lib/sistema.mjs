// Lo que comparten todas las páginas del sitio al armarse: rutas, lectura de datos, logos, la transición entre páginas
// y el pie. Todo corre en el build (Node); nada de esto viaja al navegador salvo el HTML que produce.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

// La raíz del repo: Astro corre desde ahí (el código del build se empaqueta en otra carpeta, así que no sirve import.meta.url).
export const RAIZ = process.cwd();
const COMPARTIDO = path.join(RAIZ, "src", "compartido");
const COMP = path.join(RAIZ, "profertil", "componentes");

export const leer = (...p) => fs.readFileSync(path.join(RAIZ, ...p), "utf8");
export const leerJson = (...p) => JSON.parse(leer(...p));
const compartido = (f) => fs.readFileSync(path.join(COMPARTIDO, f), "utf8");

// JSON para meter dentro de un <script>: sin "</" que corte la etiqueta.
export const js = (x) => JSON.stringify(x).replace(/<\//g, "<\\/");

// Los logos oficiales (exportados del Figma Master) como <symbol> para usar con <use href="#...">.
function simbolo(archivo, id) {
  const v = compartido(archivo);
  const vb = /viewBox="([^"]+)"/.exec(v)[1];
  const adentro = v.replace(/^[\s\S]*?<svg[^>]*>|<\/svg>\s*$/g, "").trim();
  return `<symbol id="${id}" viewBox="${vb}">${adentro}</symbol>`;
}
export const LOGOS = simbolo("logo-blanco.svg", "pf-logo-blanco") + simbolo("simbolo-color.svg", "pf-simbolo");

// Las 18 Formas del sistema y los íconos. Las listas no usan los íconos: van sin ellos.
export function assets({ iconos = false } = {}) {
  const a = JSON.parse(compartido("assets.json"));
  if (!iconos) delete a.iconos;
  return a;
}

// Corre un componente de la librería (profertil/componentes/c/*.js) en Node y devuelve lo que registra.
function componente(archivos) {
  let comp;
  const ctx = { Libreria: { sumar: (c) => { comp = c; } }, console };
  ctx.window = ctx;
  vm.createContext(ctx);
  for (const f of archivos) vm.runInContext(fs.readFileSync(path.join(COMP, f), "utf8"), ctx);
  return comp;
}

// --- Transición entre páginas: el componente "Transiciones de página" de la librería, Persiana con logo animado ---
// Dos variantes: la de Novedades y sus notas (con el panel de ajuste, hoy apagado) y la del resto de las páginas (fija).
// La animación del logo armado se toma del componente, adaptada a las clases de acá.
const TR_COMP = componente(["c/transicion-navegacion.js"]);
const TR_FUENTE = fs.readFileSync(path.join(COMP, "c", "transicion-navegacion.js"), "utf8");
const LOGO_ANIMADO = JSON.parse(/var LOGO_ANIMADO = ("(?:[^"\\]|\\.)*");/.exec(TR_FUENTE)[1]);
const TR_ANIM = (() => {
  const css = TR_COMP.css({});
  return css.slice(css.indexOf("/* Persiana con logo animado"), css.indexOf("/* Fundido"))
    .replaceAll(".pf-tp__velo", ".pf-tr-velo").replaceAll(".pf-entra .pf-la", ".pf-tr-velo.pf-entra .pf-la")
    .replaceAll("var(--color)", "var(--pf-tr-color)").replaceAll("var(--pf-dur)", "var(--pf-tr-dur)");
})();
export function transicion(variante) {
  const d = `transicion/${variante}`;
  return {
    css: compartido(`${d}/transicion.css`) + "\n" + TR_ANIM,
    cabeza: compartido(`${d}/transicion-cabeza.js`),
    js: compartido(`${d}/transicion.js`),
    velo: '<div class="pf-tr-velo" id="pf-tr-velo" aria-hidden="true"><svg class="pf-tr-logo" viewBox="0 0 1458 1021"><use href="#pf-logo-blanco"/></svg>'
      + LOGO_ANIMADO + "</div>\n",
  };
}

// --- Cabecera con campo de Formas (Nota, Biblioteca, Hojas de seguridad, Sala de prensa) ---
export const CAMPO = { css: compartido("campo/campo.css"), js: compartido("campo/campo.js") };

// --- Pie del sitio: el componente "Pie de página" de la librería (c/pie.js), Institucional sobre azul con la línea ética ---
const PIE_COMP = componente(["formas.js", "c/pie.js"]);
const PIE_S = { variante: "institucional", fondo: "azul", etica: true };
export const PIE = {
  html: PIE_COMP.html(PIE_S).replace('<footer class="pf-pie"', '<footer class="pf-pie" data-variante="institucional" data-fondo="azul"'),
  css: PIE_COMP.css(PIE_S),
};

// Arma el script de una página: su archivo de src/paginas con los datos puestos en sus marcas (/*__NOMBRE__*/...).
// Si una marca no está, el build se frena: así un cambio en el script no deja una página sin datos.
export function armar(codigo, reemplazos) {
  for (const [marca, valor] of Object.entries(reemplazos)) {
    if (!codigo.includes(marca)) throw new Error("Falta la marca " + marca);
    codigo = codigo.split(marca).join(valor);
  }
  return codigo;
}
