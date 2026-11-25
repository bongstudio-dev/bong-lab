import { getCollection, type CollectionEntry } from "astro:content";
import vistas from "../../profertil/productos/fuente/vistas.json";

export type Producto = CollectionEntry<"productos">;
export type Vista = (typeof vistas)[number];
export { vistas };

// El prefijo de GitHub Pages también se aplica a los archivos que ya están en la Biblioteca.
export const sitio = (ruta: string) => import.meta.env.BASE_URL.replace(/\/$/, "") + "/profertil/" + ruta;
export const ficha = (id: string) => sitio("productos/" + id + "/");

export async function catalogo() {
  return (await getCollection("productos")).sort((a, b) => a.data.orden - b.data.orden);
}

export function resumenIndice({ data }: Producto) {
  return [...new Set([data.categoria, data.familia, ...data.cultivos].filter(Boolean))].join(" · ");
}

export const plano = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

// Un dato de la tabla de características por su etiqueta.
export function dato({ data }: Producto, etiqueta: string) {
  return data.caracteristicas.find(c => plano(c.etiqueta) === plano(etiqueta))?.valor || "";
}

// Nutrientes que aporta, leídos del dato "Elementos" (y del grado cuando falta).
const NUTRIENTES: [string, RegExp][] = [
  ["Nitrógeno", /nitr[oó]geno/i], ["Fósforo", /f[oó]sforo/i], ["Potasio", /potasio/i], ["Azufre", /azufre/i],
  ["Calcio", /calcio/i], ["Magnesio", /magnesio/i], ["Zinc", /zinc/i],
];
export const ORDEN_NUTRIENTES = NUTRIENTES.map(([n]) => n);
export function nutrientes(p: Producto) {
  const texto = dato(p, "Elementos");
  return NUTRIENTES.filter(([, re]) => re.test(texto)).map(([n]) => n);
}

// Forma física en dos valores: granulado o líquido.
export function forma(p: Producto) {
  const f = plano(dato(p, "Forma física") || dato(p, "Presentación"));
  return f.includes("liquido") ? "Líquido" : f.includes("granul") || f.includes("solido") ? "Granulado" : "";
}

// El grado en corto (46-0-0): el dato de la tarjeta.
export function grado(p: Producto) {
  return dato(p, "Grado").replace(/\s*[–-]\s*/g, "-").replace(/\s+/g, " ");
}

// Foto de campo de la cabecera de cada ficha: fotos de la Sala de prensa con cielo, elegidas por el primer cultivo.
const FOTOS = {
  trigo: "sala-de-prensa/fotos/profertil-en-el-campo/03.webp",
  verde: "sala-de-prensa/fotos/profertil-en-el-campo/04.webp",
  cosecha: "sala-de-prensa/fotos/profertil-en-el-campo/01.webp",
  maiz: "sala-de-prensa/fotos/vida-para-tierra/11.webp",
  surcos: "sala-de-prensa/fotos/vida-para-tierra/14.webp",
  frutales: "sala-de-prensa/fotos/vida-para-tierra/15.webp",
  planta: "sala-de-prensa/fotos/planta-ingeniero-white/03.webp",
};
export const FOTO_CATALOGO = FOTOS.verde;
export function foto(p: Producto) {
  if (p.data.categoria === "Industrial") return FOTOS.planta;
  const c = plano(p.data.cultivos[0] || "");
  if (/trigo|cebada/.test(c)) return FOTOS.trigo;
  if (/maiz|sorgo|cana/.test(c)) return FOTOS.maiz;
  if (/soja|arroz/.test(c)) return FOTOS.surcos;
  if (/durazn|naranj|manzan|tomate|cebolla/.test(c)) return FOTOS.frutales;
  return [FOTOS.verde, FOTOS.cosecha][p.data.orden % 2];
}
