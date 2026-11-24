// Índice del buscador de todo el sitio (lo lee profertil/buscador/alcance.js). Se arma en el build con los mismos datos
// que las páginas, así cada ítem lleva a su dirección: biblioteca/<id>/ y novedades/<nota>/.
// Cada grupo es un tipo de contenido; un ítem es [título, url, resumen], con la url relativa a profertil/ (o absoluta si
// va al sitio actual). Las páginas salen del mapa de arquitectura: las baja profertil/buscador/fuente/indice.py a
// paginas.json. Para sumar un tipo nuevo: una función que devuelva sus ítems y una entrada en GRUPOS.
import { leerJson } from "../../../lib/sistema.mjs";
import { BIB, MSDS, FINANCIERA, LEGAJO } from "../../../lib/datos.mjs";

const RESUMEN_MAX = 140;
const orden = (f) => (a, b) => { const x = f(a), y = f(b); return x < y ? -1 : x > y ? 1 : 0; };
function corto(s, n = RESUMEN_MAX) {
  s = (s || "").split(/\s+/).filter(Boolean).join(" ");
  if ([...s].length <= n) return s;
  const c = [...s].slice(0, n).join("");
  const i = c.lastIndexOf(" ");
  return (i >= 0 ? c.slice(0, i) : c).replace(/[,.;]+$/, "") + "…";
}

// --- Documentos de la Biblioteca ---
const CATEGORIAS = { cereales: "Cereales", oleaginosas: "Oleaginosas", pasturas: "Pasturas", industriales: "Industriales", msds: "Hojas de seguridad", inversores: "Inversores", biblioteca: "Biblioteca" };
const documentos = () => [...BIB].sort(orden((d) => d.t.toLowerCase()))
  .map((d) => [d.t, "biblioteca/" + d.id + "/", [CATEGORIAS[d.c] || "", d.y || ""].filter(Boolean).join(" · ")]);

// --- Hojas de seguridad: una por producto, con el mismo nombre que su lista ---
const hojas = () => MSDS.map((d) => [d.t, "biblioteca/" + d.id + "/", "Hoja de seguridad"]).sort(orden((x) => x[0].toLowerCase()));

// --- Balances de Situación financiera, del más reciente al más viejo ---
const balances = () => [...FINANCIERA].sort((a, b) => (a.o < b.o ? 1 : -1))
  .map((d) => [d.t, "biblioteca/" + d.id + "/", d.e.tipo[0] === "anual" ? "Balance anual" : "Balance trimestral"]);

// --- Legajo impositivo, en el orden del legajo ---
const ALCANCE = { legajo: "Legajo impositivo", nacional: "Constancia nacional", provincial: "Constancia provincial" };
const legajo = () => [...LEGAJO].sort((a, b) => (a.o < b.o ? -1 : 1))
  .map((d) => [d.t, "biblioteca/" + d.id + "/", [ALCANCE[d.e.alcance[0]], d.y].filter(Boolean).join(" · ")]);

// --- Gacetillas de la Sala de prensa, de la más reciente a la más vieja ---
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const gacetillas = () => [...leerJson("profertil/sala-de-prensa/fuente/prensa.json").gacetillas]
  .sort((a, b) => (a.f < b.f ? 1 : a.f > b.f ? -1 : (b.dia || 0) - (a.dia || 0)))
  .map((d) => [d.t, "biblioteca/" + d.id + "/", (d.tipo === "aviso" ? "Aviso a la comunidad" : "Gacetilla") + " · " + MESES[d.m - 1] + " " + d.y]);

// --- Notas de Novedades, de la más reciente a la más vieja. La sección de WordPress, si la hay, manda sobre el tipo ---
const TIPOS = { institucional: "Institucional", comercial: "Comercial", somos: "Somos Profertil", tecnico: "Artículo técnico", aviso: "Aviso a la comunidad", financiera: "Gacetilla financiera" };
const DESDE_WP = { "comunicacion-institucional": "institucional", "comunicacion-comercial": "comercial", "somos-profertil": "somos" };
const notas = () => [...leerJson("profertil/novedades/fuente/notas.json")].sort((a, b) => ((b.f || "") > (a.f || "") ? 1 : (b.f || "") < (a.f || "") ? -1 : 0))
  .map((n) => {
    const meta = [TIPOS[DESDE_WP[n.s] || n.tp] || "", (n.f || "").slice(0, 4)].filter(Boolean).join(" · ");
    const bajada = corto(n.b || "");
    return [n.t, "novedades/" + n.ar + "/", meta + (bajada ? " · " + bajada : "")];
  });

// --- Páginas del mapa de arquitectura (paginas.json, de indice.py) ---
const paginas = () => leerJson("profertil/buscador/fuente/paginas.json").items;

// id, nombre del grupo, singular, plural, artículo del plural, lista con la búsqueda aplicada (vacío: el panel muestra todos), ítems
const GRUPOS = [
  ["documentos", "Biblioteca", "documento", "documentos", "los", "biblioteca/#q=", documentos],
  ["hojas", "Hojas de seguridad", "hoja", "hojas", "las", "hojas-de-seguridad/#q=", hojas],
  ["financiera", "Balances", "balance", "balances", "los", "situacion-financiera/#q=", balances],
  ["legajo", "Legajo impositivo", "documento", "documentos", "los", "legajo-impositivo/#q=", legajo],
  ["prensa", "Gacetillas", "gacetilla", "gacetillas", "las", "sala-de-prensa/#gacetillas&q=", gacetillas],
  ["notas", "Notas", "nota", "notas", "las", "novedades/#q=", notas],
  ["paginas", "Páginas", "página", "páginas", "las", "", paginas],
];

export function GET() {
  const grupos = GRUPOS.map(([id, nombre, uno, varios, art, lista, items]) => ({ id, nombre, uno, varios, art, lista, items: items() }));
  return new Response(JSON.stringify({ v: 1, grupos }), { headers: { "Content-Type": "application/json; charset=utf-8" } });
}
