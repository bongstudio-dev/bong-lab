// Componentes de la librería (profertil/componentes/c/*.js) para usar en las páginas del sitio, armados en el build.
// Cada componente registra su CSS, su HTML de muestra y su JS con Libreria.sumar(); acá se corren en Node (como
// sistema.mjs hace con el pie y la transición) y se toman su CSS y su JS tal cual, con los valores de fábrica de sus
// controles, la variante elegida y los ajustes que pida la página. El HTML lo escribe cada página con el mismo marcado
// del componente y su contenido real.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { RAIZ } from "./sistema.mjs";

const COMP = path.join(RAIZ, "profertil", "componentes");
const ARCHIVOS = ["formas.js", "c/sistema.js", "c/cifras.js", "c/carrusel.js", "c/scroll-fotos.js", "c/revela-scroll.js",
  "c/lista-valores.js", "c/boton-fijo.js", "c/fondos-motor.js", "c/fondos.js"];

const ctx = { console, Libreria: { lista: [], sumar(c) { this.lista.push(c); } } };
ctx.window = ctx;
vm.createContext(ctx);
for (const f of ARCHIVOS) vm.runInContext(fs.readFileSync(path.join(COMP, f), "utf8"), ctx, { filename: f });
const LISTA = ctx.Libreria.lista;
const FORMAS = vm.runInContext("FORMAS", ctx);

// Los valores de un componente: los de fábrica, los de la variante y los que pida la página.
function valores(c, variante, ajustes) {
  const s = {};
  if (c.variantes) {
    const v = variante ? c.variantes.find((x) => x[0] === variante) : c.variantes[0];
    if (!v) throw new Error(`${c.id}: no hay variante ${variante}`);
    s.variante = v[0];
  }
  for (const k of c.controles || []) if (k !== "---") s[k.id] = k.def;
  const preset = c.variantes && c.variantes.find((x) => x[0] === s.variante)?.[3];
  return Object.assign(s, preset || {}, ajustes || {});
}

// Atributos y variables que el componente aplica sobre su raíz (lo mismo que hace la librería en su vista previa).
function atributos(c, s) {
  let attrs = s.variante ? ` data-variante="${s.variante}"` : "";
  const vars = [];
  for (const k of c.controles || []) {
    if (!k.aplica) continue;
    if (k.aplica.attr) attrs += ` ${k.aplica.attr}="${s[k.id]}"`;
    if (k.aplica.var) vars.push(`${k.aplica.var}: ${s[k.id]}${k.aplica.unidad || ""}`);
  }
  return { attrs, style: vars.join("; ") };
}

/** Un componente de la librería: { css, js, attrs, style, s }. */
export function pieza(id, { variante, ...ajustes } = {}) {
  const c = LISTA.find((x) => x.id === id);
  if (!c) throw new Error("No está el componente " + id);
  const s = valores(c, variante, ajustes);
  const a = atributos(c, s);
  // El HTML de muestra con los atributos puestos: sirve tal cual en los componentes cuyo texto es un ajuste (Revelado con scroll).
  const html = () => c.html(s).replace(/data-c="([^"]+)"/, `data-c="$1"${a.attrs}${a.style ? ` style="${a.style}"` : ""}`);
  return { css: c.css(s), js: c.js ? c.js(s) : "", s, html, ...a };
}

/** Un fondo generativo (c/fondos.js) atado a un lienzo por id. `tapa` es el id de lo que lo tapa al subir (o null). */
export function fondo(id, lienzo, { variante, tapa = null, ...ajustes } = {}) {
  const p = pieza(id, { variante, ...ajustes });
  const js = p.js
    .replace('document.querySelector(".pf-fondo__lienzo")', `document.getElementById(${JSON.stringify(lienzo)})`)
    .replace('"tapa":"pf-fondo-hoja"', `"tapa":${JSON.stringify(tapa)}`)
    .replace(/"ignorar":"[^"]*"/, '"ignorar":"a, button, h1, h2, p"');
  return { ...p, js: "(function () {\n" + js + "\n})();" };
}

// --- Etiqueta (componente Etiqueta del Master): badge con la Forma sobre su familia, rótulo y dato opcional ---
const FAM = (n, inv) => {
  const bg = `var(--fam-${n})`, fo = `var(--fam-${n}-comp)`;
  return { bg: inv ? fo : bg, fo: inv ? bg : fo, tx: `var(--fam-${n}-tinta)` };
};
const BADGE = '<path d="M32 0H68C76.49 0 84.63 3.37 90.63 9.37C96.63 15.37 100 23.51 100 32V68C100 76.49 96.63 84.63 90.63 90.63C84.63 96.63 76.49 100 68 100H32C23.51 100 15.37 96.63 9.37 90.63C3.37 84.63 0 76.49 0 68V32C0 23.51 3.37 15.37 9.37 9.37C15.37 3.37 23.51 0 32 0Z"/>';
export const CATEGORIAS = {
  // Novedades
  institucional: { nombre: "Institucional", forma: "escudo", f: FAM("azul") },
  comercial: { nombre: "Comercial", forma: "barras", f: FAM("naranja") },
  aviso: { nombre: "Aviso a la comunidad", forma: "casco", f: FAM("amarillo") },
  tecnico: { nombre: "Artículo técnico", forma: "lupa", f: FAM("verde") },
  // Biblioteca
  cereales: { nombre: "Cereales", forma: "trigo", f: FAM("verde", true) },
  biblioteca: { nombre: "Biblioteca", forma: "lupa", f: FAM("azul") },
  gacetilla: { nombre: "Gacetilla", forma: "escudo", f: FAM("azul") },
};
export function etiqueta(cat, dato) {
  const x = CATEGORIAS[cat], f = FORMAS[x.forma];
  return `<span class="pf-etiqueta" style="--fo: ${x.f.fo}; --tx: ${x.f.tx}"><svg class="pf-etiqueta__badge" viewBox="0 0 100 100" aria-hidden="true"><g style="fill: ${x.f.bg}">${BADGE}</g><svg x="21" y="21" width="58" height="58" viewBox="${f.vb}" style="fill: ${x.f.fo}">${f.d}</svg></svg><span class="pf-etiqueta__rotulo">${x.nombre}</span>${dato != null ? `<span class="pf-etiqueta__dato">${dato}</span>` : ""}</span>`;
}

/** Una Forma del sistema como SVG suelto (para íconos de acceso). */
export function forma(nombre, clase = "") {
  const f = FORMAS[nombre];
  return `<svg class="${clase}" viewBox="${f.vb}" aria-hidden="true">${f.d}</svg>`;
}

// Los animadores de texto (profertil/animadores-texto): se cargan desde su carpeta, como la librería.
export const ANIMADORES = { css: "animadores-texto/animadores.css", js: "animadores-texto/animadores.js" };
