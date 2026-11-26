// Etiqueta de bolsa dibujada en un canvas a partir de los logos vectoriales.
// Una sola plantilla para todos los productos: cambian el color, el nombre y el logo.
//
// Lienzo de 2048 × 3072 px, pensado para el UV de bolsa.glb:
//   x 0-1536     frente (el dorso repite el frente)
//   x 1536-2048  fuelle (los dos fuelles repiten esta franja)
//   y 0-3072     alto del cuerpo, de arriba hacia abajo

export const ANCHO = 2048, ALTO = 3072, FRENTE = 1536;

const GRIS_FRANJA = "#8f9194";
const TEXTO = "#5f6164";
const FILM = "#f6f6f4";
const FUENTE = '"Roboto Condensed", "Arial Narrow", sans-serif';

const QUIMICO = "Fertilizante Químico Granulado";
const COMPUESTO = "Fertilizante Químico Compuesto Granulado";

// Colores de cada línea, tomados de las bolsas actuales.
export const PRODUCTOS = [
  { id: "ug", nombre: "Urea Granulada Argentina", color: "#0b5aa5", logo: "urea", ancho: 1180, sub: "Grado: 46-0-0", estela: true, pie: ["Industria", "Argentina"] },
  { id: "etp", nombre: "eNeTOTAL PLUS", color: "#f2e500", texto: "#3d4a2a", logo: "enetotal", ancho: 760, sub: "Grado: 46-0-0", pie: ["Industria", "Argentina"], pieColor: "#3d4a2a" },
  { id: "proterra", nombre: "Proterra", color: "#4f8128", linea: COMPUESTO, logo: "proterra", ancho: 1160, sub: "Mezcla Física", estela: true, pie: ["Industria", "Argentina"] },
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

let fuentesListas = null;
function fuentes(base) {
  if (!fuentesListas) {
    const caras = [
      new FontFace("Roboto Condensed", `url(${base}fuentes/roboto-condensed-700-normal.woff2)`, { weight: "700", style: "normal" }),
      new FontFace("Roboto Condensed", `url(${base}fuentes/roboto-condensed-700-italic.woff2)`, { weight: "700", style: "italic" }),
    ];
    fuentesListas = Promise.all(caras.map(f => f.load().then(c => document.fonts.add(c))));
  }
  return fuentesListas;
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

function texto(ctx, s, x, y, px, { color = TEXTO, alin = "left", italica = false } = {}) {
  ctx.font = `${italica ? "italic " : ""}700 ${px}px ${FUENTE}`;
  ctx.fillStyle = color;
  ctx.textAlign = alin;
  ctx.textBaseline = "alphabetic";
  ctx.fillText(s, x, y);
}

export async function dibujar(canvas, p, base = "./") {
  await fuentes(base);
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
  texto(ctx, p.linea || QUIMICO, FRENTE / 2, 192, p.linea ? 92 : 104, { color: p.texto && !p.franja ? p.texto : "#ffffff", alin: "center", italica: true });

  // Nombre o logo de la marca
  let y = 430;
  if (im.marca) {
    const h = p.ancho * im.marca.naturalHeight / im.marca.naturalWidth;
    const cy = 300 + h / 2 + 60;
    poner(ctx, im.marca, FRENTE / 2 + 20, cy, p.ancho);
    y = cy + h / 2 + 120;
  } else {
    const lineas = p.lineas || [p.nombre.toUpperCase()];
    const px = lineas.some(l => l.length > 14) ? 170 : 196;
    lineas.forEach((l, i) => texto(ctx, l, 236, 520 + i * px * 1.02, px));
    y = 520 + (lineas.length - 1) * px * 1.02 + 150;
  }
  if (p.sub) {
    texto(ctx, p.sub, FRENTE / 2 + 20, y, 96, { alin: "center", color: "#8a8c8f" });
    y += 90;
  }

  // Logo Profertil con lema
  const logoY = Math.max(y + 80, 920);
  poner(ctx, im.profertil, FRENTE / 2 + 40, logoY + 270, 740);

  // Estela gris sobre el arco (Urea y Proterra)
  const cx = 950, cy = 2700, r = 740;
  if (p.estela) {
    const g = ctx.createLinearGradient(260, 0, 1536, 0);
    g.addColorStop(0, "rgba(190,192,195,0)");
    g.addColorStop(0.55, "rgba(190,192,195,.55)");
    g.addColorStop(1, "rgba(175,177,180,.9)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx + 70, cy - 90, r + 120, 0, Math.PI * 2);
    ctx.arc(cx, cy, r + 4, 0, Math.PI * 2, true);
    ctx.fill("evenodd");
  }

  // Arco de color
  ctx.fillStyle = p.color;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  if (p.pie) {
    const col = p.pieColor || "#ffffff";
    if (p.pie.length === 1) texto(ctx, p.pie[0], 1240, 2860, 150, { color: col, alin: "center" });
    else p.pie.forEach((l, i) => texto(ctx, l, 860, 2700 + i * 108, 100, { color: col, alin: "center" }));
  }
  ctx.restore();

  // ---------- fuelle ----------
  const fx = FRENTE + (ANCHO - FRENTE) / 2;
  poner(ctx, im.simbolo, fx, 560, 470, 90);

  const marcaLateral = im.lateral || (p.logo === "urea" ? im.marca : null);
  if (marcaLateral) {
    poner(ctx, marcaLateral, fx, 1520, 1050, 90);
  } else if (p.logo === "enetotal") {
    poner(ctx, im.marca, fx, 1500, 640, 90);
  } else {
    ctx.fillStyle = p.color;
    ctx.fillRect(FRENTE + 96, 1060, 30, 1080);
    ctx.save();
    ctx.translate(fx + 20, 1100);
    ctx.rotate(Math.PI / 2);
    const nombre = (p.lineas || [p.nombre]).join(" ").toUpperCase();
    const px = Math.min(118, 1000 / (nombre.length * 0.47));
    texto(ctx, nombre, 0, px * 0.36, px);
    ctx.restore();
  }
  return canvas;
}
