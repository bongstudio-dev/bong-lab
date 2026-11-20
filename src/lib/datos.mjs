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
const INVERSORES = leerJson("profertil/biblioteca/fuente/docs-inversores.json").docs;

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

// Todos los documentos que abre el visor (Biblioteca, hojas de seguridad, inversores y gacetillas), en orden alfabético.
export const DOCS_VISOR = [...BIB, ...MSDS, ...INVERSORES, ...GACETILLAS]
  .map((d, i) => [plano(d.t), i, d]).sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : a[1] - b[1])).map((x) => x[2]);
