// Los datos de las páginas, leídos de los JSON que arman los scripts de preparación (prep-*.py) en cada fuente/.
import { leerJson } from "./sistema.mjs";

const plano = (t) => t.normalize("NFD").replace(/[^\x00-\x7f]/g, "").toLowerCase();

// --- Novedades: las 471 notas (novedades/fuente/notas.json, de prep.py y prep-cuerpos.py) ---
export const NOTAS = leerJson("profertil/novedades/fuente/notas.json");

// --- Biblioteca: docs.json con sus etiquetas del sitio actual (etiquetas.json, de prep-etiquetas.py) ---
export const BIB = leerJson("profertil/biblioteca/fuente/docs.json").docs;
// Hojas de seguridad: el nombre del producto, sin "MSDS" (la página ya lo dice) y con las siglas entre paréntesis en mayúscula.
export const MSDS = leerJson("profertil/biblioteca/fuente/docs-msds.json").docs.map((d) => ({
  ...d,
  t: d.t.replace(/\s*\bMSDS\b\s*/g, " ").trim().replace(/\(([a-z]{2,4})\)/g, (_, s) => "(" + s.toUpperCase() + ")"),
}));
// Situación financiera (docs-financiera.json) y Legajo impositivo (docs-legajo.json), de prep-legajo-financiera.py. `p` dice
// a qué lista vuelve cada documento desde su página. Los balances que el sitio actual también publica como página propia
// están en docs-inversores.json con el mismo id: se usa la versión de Situación financiera.
export const FINANCIERA = leerJson("profertil/biblioteca/fuente/docs-financiera.json").docs.map((d) => ({ ...d, p: "financiera" }));
const LEGAJO_JSON = leerJson("profertil/biblioteca/fuente/docs-legajo.json");
export const LEGAJO = LEGAJO_JSON.docs.map((d) => ({ ...d, p: "legajo" }));
export const LEGAJO_GRUPOS = LEGAJO_JSON.grupos;
export const LEGAJO_ZIP = LEGAJO_JSON.zip;
// Quiero ser proveedor (docs-proveedores.json, armado a mano desde la página del sitio nuevo): los tres documentos.
export const PROVEEDORES = leerJson("profertil/biblioteca/fuente/docs-proveedores.json").docs;
const EN_FINANCIERA = new Set(FINANCIERA.map((d) => d.id));
const INVERSORES = leerJson("profertil/biblioteca/fuente/docs-inversores.json").docs.filter((d) => !EN_FINANCIERA.has(d.id));

// Sala de prensa (sala-de-prensa/fuente/prensa.json, de prep-prensa.py). La página no lleva el texto de los PDF (solo
// sirvió para sacar títulos y fechas) ni la foto original (va la copia local, fm).
const PRENSA_JSON = leerJson("profertil/sala-de-prensa/fuente/prensa.json");
export const PRENSA = {
  ...PRENSA_JSON,
  gacetillas: PRENSA_JSON.gacetillas.map(({ texto, archivo, foto, ...g }) => g),
};
// Las gacetillas también abren en el visor de la Biblioteca.
const GACETILLAS = PRENSA_JSON.gacetillas.map((g) => ({ id: g.id, t: g.t, c: g.tipo, y: g.y, f: g.f, u: g.u, ...(g.l ? { l: g.l } : {}) }));

const ET = leerJson("profertil/biblioteca/fuente/etiquetas.json");
// El id de opción en los documentos es el slug; en la página va el id corto (sin el "-2" de WordPress).
const CORTO = Object.fromEntries(ET.grupos.flatMap((g) => g.opciones.map((op) => [op.slug, op.id])));
for (const d of BIB) {
  const e = ET.docs[d.id];
  if (e) d.e = Object.fromEntries(Object.entries(e).map(([g, vs]) => [g, vs.map((v) => CORTO[v] ?? v)]));
}
export const GRUPOS = ET.grupos.map((g) => ({
  id: g.id, nombre: g.nombre,
  opciones: g.opciones.map((op) => Object.fromEntries(["id", "nombre", "sub", "provincia"].filter((k) => k in op).map((k) => [k, op[k]]))),
}));

// Todos los documentos que abre el visor (Biblioteca, hojas de seguridad, inversores, balances, legajo, proveedores y gacetillas), en
// orden alfabético. En el visor no van las etiquetas ni el orden de la lista (e, o).
const VISOR = (d) => { const { e, o, ...x } = d; return x; };
export const DOCS_VISOR = [...BIB, ...MSDS, ...INVERSORES, ...FINANCIERA.map(VISOR), ...LEGAJO.map(VISOR), ...PROVEEDORES.map(VISOR), ...GACETILLAS]
  .map((d, i) => [plano(d.t), i, d]).sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : a[1] - b[1])).map((x) => x[2]);
