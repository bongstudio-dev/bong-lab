// Etiqueta de bolsa dibujada en un canvas a partir de los logos vectoriales.
// Una sola plantilla para todos los productos: cambian el color, el nombre y el logo.
//
// Lienzo de 2288 × 3840 px, pensado para el UV de bolsa.glb (fuente/bolsa.py):
//   x 0-1536     frente (el dorso repite el frente)
//   x 1536-2288  fuelle (los dos fuelles repiten esta franja)
//   y 0-3840     alto del cuerpo, del sello de arriba a la base
// 1 px vale lo mismo a lo ancho y a lo alto sobre la bolsa (3.8 px por mm en
// el frente, 3.9 en el fuelle): un cuadrado del arte queda cuadrado.

// Los textos van en Rotis Sans Serif, como en las bolsas impresas. No se usa la
// fuente: fuente/textos.py deja sus contornos en textos.js (TRAZOS).
import { TRAZOS } from "./textos.js";

export const ANCHO = 2288, ALTO = 3840, FRENTE = 1536;
const CX = FRENTE / 2;
// Media altura de mayúscula de la Rotis: centra un texto en vertical.
const MEDIA = 0.345;

const GRIS_FRANJA = "#8f9194";
const TEXTO = "#5f6164";
const FILM = "#f6f6f4";

const QUIMICO = "Fertilizante Químico Granulado";
const COMPUESTO = "Fertilizante Químico Compuesto Granulado";

// Colores de cada línea, tomados de las bolsas actuales.
export const PRODUCTOS = [
  { id: "ug", nombre: "Urea Granulada Argentina", color: "#0b5aa5", logo: "urea", ancho: 1180, sub: "Grado: 46-0-0", estela: true, pie: ["Industria", "Argentina"] },
  { id: "etp", nombre: "eNeTOTAL PLUS", color: "#f2e500", texto: "#3d4a2a", logo: "enetotal", ancho: 760, sub: "Grado: 46-0-0", pie: ["Industria", "Argentina"], pieColor: "#3d4a2a" },
  { id: "proterra", nombre: "Proterra", color: "#4f8128", linea: COMPUESTO, logo: "proterra", ancho: 1160, sub: "Mezcla Física", estela: true, pie: ["Industria", "Argentina"], lateral: "proterra" },
  { id: "proterra-ar", nombre: "Proterra AR", color: "#4f8128", linea: COMPUESTO, logo: "proterra-ar", ancho: 1180, sub: "Mezcla Física", estela: true, pie: ["Industria", "Argentina"], lateral: "proterra" },
  { id: "proterra-ds", nombre: "Proterra DS", color: "#4f8128", linea: COMPUESTO, logo: "proterra-ds", ancho: 1180, sub: "Mezcla Física", estela: true, pie: ["Industria", "Argentina"], lateral: "proterra" },
  { id: "proterra-zn", nombre: "Proterra Zn", color: "#4f8128", linea: COMPUESTO, logo: "proterra-zn", ancho: 1200, sub: "Mezcla Física", estela: true, pie: ["Industria", "Argentina"], lateral: "proterra" },
  { id: "proterra-s", nombre: "Proterra S", color: "#4f8128", linea: COMPUESTO, logo: "proterra-s", ancho: 1200, sub: "Mezcla Física", estela: true, pie: ["Industria", "Argentina"], lateral: "proterra" },
  { id: "fda", nombre: "Fosfato Diamónico", lineas: ["FOSFATO", "DIAMÓNICO"], color: "#1d5c2a" },
  { id: "map", nombre: "Fosfato Monoamónico", lineas: ["FOSFATO", "MONOAMÓNICO"], color: "#e1251b" },
  { id: "sps", nombre: "Superfosfato Simple", lineas: ["SUPERFOSFATO", "SIMPLE"], color: "#933a80" },
  { id: "spt", nombre: "Superfosfato Triple", lineas: ["SUPERFOSFATO", "TRIPLE"], color: "#5b6aaf" },
  { id: "sa", nombre: "Sulfato de Amonio", lineas: ["SULFATO DE AMONIO"], color: "#0d4f7d" },
  { id: "sc", nombre: "Sulfato de Calcio", lineas: ["SULFATO DE CALCIO"], color: "#8f861a" },
  { id: "kcl", nombre: "Cloruro de Potasio", lineas: ["CLORURO DE POTASIO"], color: "#1565b0", franja: GRIS_FRANJA, pie: ["50 kg"] },
  { id: "spm", nombre: "Sulfato de Potasio y Magnesio", lineas: ["SULFATO DE POTASIO", "Y MAGNESIO"], color: "#1565b0", franja: GRIS_FRANJA },
  { id: "sulfugran", nombre: "Sulfugran", lineas: ["SULFUGRAN"], color: "#1565b0", franja: GRIS_FRANJA },
  { id: "zincodur", nombre: "Zincodur", lineas: ["ZINCODUR"], color: "#1565b0", franja: GRIS_FRANJA },
];

const cache = new Map();
function cargar(src) {
  if (!cache.has(src)) {
    cache.set(src, new Promise((ok, mal) => {
      const im = new Image();
      im.onload = () => ok(im);
      im.onerror = mal;
      im.src = src;
    }));
  }
  return cache.get(src);
}

// Dibuja una imagen centrada en (cx, cy) con el ancho dado y rotación en grados.
function poner(ctx, im, cx, cy, ancho, rot = 0) {
  const alto = ancho * (im.naturalHeight || im.height) / (im.naturalWidth || im.width);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot * Math.PI / 180);
  ctx.drawImage(im, -ancho / 2, -alto / 2, ancho, alto);
  ctx.restore();
  return alto;
}

// Textos de cada etiqueta, con su peso: 65 es Bold, 75 es Extra Bold.
function textosDe(p) {
  const nombre = p.logo ? [] : (p.lineas || [p.nombre.toUpperCase()]);
  const lateral = p.logo ? [] : [(p.lineas || [p.nombre]).join(" ").toUpperCase()];
  return [
    ["75", p.linea || QUIMICO],
    ...nombre.map(l => ["75", l]),
    ...(p.sub ? [["65", p.sub]] : []),
    ...(p.pie || []).map(l => ["75", l]),
    ...lateral.map(l => ["75", l]),
  ];
}
export const FRASES = [...new Map(PRODUCTOS.flatMap(textosDe).map(f => [f.join("|"), f])).values()];

const trazos = new Map();
function trazo(s, peso) {
  const t = TRAZOS[`${peso}|${s}`];
  if (!t) throw new Error(`Falta el texto "${s}" (${peso}): correr fuente/textos.py`);
  if (!trazos.has(t)) trazos.set(t, new Path2D(t[1]));
  return { ancho: t[0] / 1000, forma: trazos.get(t) };
}

// Ancho en px de un texto a un cuerpo dado.
function medir(s, px, peso = "65") {
  return trazo(s, peso).ancho * px;
}

function texto(ctx, s, x, y, px, { color = TEXTO, alin = "left", peso = "65", inclinar = false } = {}) {
  const t = trazo(s, peso);
  const w = t.ancho * px;
  ctx.save();
  ctx.translate(alin === "center" ? x - w / 2 : alin === "right" ? x - w : x, y);
  // La línea de producto va oblicua, como en la bolsa.
  if (inclinar) ctx.transform(1, 0, -0.2, 1, 0.07 * px, 0);
  ctx.scale(px / 1000, px / 1000);
  ctx.fillStyle = color;
  ctx.fill(t.forma);
  ctx.restore();
}

export async function dibujar(canvas, p, base = "./") {
  const logos = { profertil: cargar(base + "logos/profertil-slogan.svg"), simbolo: cargar(base + "logos/profertil.svg") };
  if (p.logo) logos.marca = cargar(`${base}logos/${p.logo}.svg`);
  if (p.lateral) logos.lateral = cargar(`${base}logos/${p.lateral}.svg`);
  const im = Object.fromEntries(await Promise.all(Object.entries(logos).map(async ([k, v]) => [k, await v])));

  canvas.width = ANCHO;
  canvas.height = ALTO;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = FILM;
  ctx.fillRect(0, 0, ANCHO, ALTO);

  // ---------- frente ----------
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, FRENTE, ALTO);
  ctx.clip();

  // Franja superior con la línea de producto
  const franja = p.franja || p.color;
  ctx.fillStyle = franja;
  ctx.fillRect(0, 70, FRENTE, 170);
  // La línea ocupa como mucho el 92% del frente: la versión "Compuesto" baja de cuerpo.
  const linea = p.linea || QUIMICO;
  const cuerpo = Math.min(104, 104 * FRENTE * 0.92 / medir(linea, 104, "75"));
  texto(ctx, linea, CX, 155 + cuerpo * MEDIA, cuerpo, { color: p.texto && !p.franja ? p.texto : "#ffffff", alin: "center", inclinar: true, peso: "75" });

  // Nombre o logo de la marca, centrado en el frente
  let y = 430;
  if (im.marca) {
    const h = p.ancho * im.marca.naturalHeight / im.marca.naturalWidth;
    const cy = 300 + h / 2 + 60;
    poner(ctx, im.marca, CX, cy, p.ancho);
    y = cy + h / 2 + 120;
  } else {
    const lineas = p.lineas || [p.nombre.toUpperCase()];
    // Cuerpo fijo mientras entre en el 84% del frente; los nombres largos bajan.
    const ancho = Math.max(...lineas.map(l => medir(l, 1, "75")));
    const px = Math.min(196, FRENTE * 0.84 / ancho);
    lineas.forEach((l, i) => texto(ctx, l, CX, 520 + i * px * 1.04, px, { alin: "center", peso: "75" }));
    y = 520 + (lineas.length - 1) * px * 1.04 + 150;
  }
  if (p.sub) {
    texto(ctx, p.sub, CX, y, 96, { alin: "center", color: "#8a8c8f" });
    y += 90;
  }

  // Logo Profertil con lema
  const logoY = Math.max(y + 80, 920);
  poner(ctx, im.profertil, CX, logoY + 270, 740);

  // Círculo de color, centrado en el frente, que sale por el pie de la bolsa
  const cy = 2720, r = 720;
  // Estela gris que acompaña al círculo por arriba (Urea y Proterra): una media luna
  // más gruesa en el centro, que se apaga hacia los costados.
  if (p.estela) {
    const g = ctx.createLinearGradient(CX - r - 120, 0, CX + r + 120, 0);
    g.addColorStop(0, "rgba(190,192,195,0)");
    g.addColorStop(0.3, "rgba(186,188,191,.6)");
    g.addColorStop(0.7, "rgba(178,180,183,.85)");
    g.addColorStop(1, "rgba(190,192,195,.2)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(CX, cy - 120, r + 90, 0, Math.PI * 2);
    ctx.arc(CX, cy, r + 4, 0, Math.PI * 2, true);
    ctx.fill("evenodd");
  }
  ctx.fillStyle = p.color;
  ctx.beginPath();
  ctx.arc(CX, cy, r, 0, Math.PI * 2);
  ctx.fill();

  if (p.pie) {
    const col = p.pieColor || "#ffffff";
    if (p.pie.length === 1) texto(ctx, p.pie[0], CX, 2800, 150, { color: col, alin: "center", peso: "75" });
    else p.pie.forEach((l, i) => texto(ctx, l, CX, 2700 + i * 112, 104, { color: col, alin: "center", peso: "75" }));
  }
  ctx.restore();

  // ---------- fuelle ----------
  // Arriba el fuelle se pliega hacia adentro: el contenido va de la mitad para abajo.
  const fx = FRENTE + (ANCHO - FRENTE) / 2;
  poner(ctx, im.simbolo, fx, 900, 420, 90);

  const marcaLateral = im.lateral || (p.logo === "urea" ? im.marca : null);
  if (marcaLateral) {
    poner(ctx, marcaLateral, fx, 1800, 1050, 90);
  } else if (p.logo === "enetotal") {
    poner(ctx, im.marca, fx, 1780, 640, 90);
  } else {
    ctx.fillStyle = p.color;
    ctx.fillRect(FRENTE + 96, 1300, 30, 1080);
    ctx.save();
    ctx.translate(fx + 20, 1340);
    ctx.rotate(Math.PI / 2);
    const nombre = (p.lineas || [p.nombre]).join(" ").toUpperCase();
    const px = Math.min(118, 1000 / medir(nombre, 1, "75"));
    texto(ctx, nombre, 0, px * MEDIA, px, { peso: "75" });
    ctx.restore();
  }
  return canvas;
}
