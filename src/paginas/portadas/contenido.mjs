// Portada de la esfera Sostenibilidad: el contenido que comparten sus tres versiones (Editorial, Inmersiva e Índice).
// Textos tomados del sitio actual y de las notas de Novedades; las notas y los documentos son los reales de la maqueta.
import { NOTAS, BIB } from "../../lib/datos.mjs";

// Rutas desde profertil/portadas/<version>/ hasta profertil/.
export const R = "../../";
const SP = R + "sala-de-prensa/fotos/";

export const FOTOS = {
  campo: SP + "profertil-en-el-campo/04.webp",
  trigo: SP + "profertil-en-el-campo/02.webp",
  suelo: SP + "profertil-en-el-campo/05.webp",
  torres: SP + "planta-ingeniero-white/14.webp",
  planta: SP + "planta-ingeniero-white/15.webp",
  aerea: SP + "planta-ingeniero-white/03.webp",
  urea: SP + "urea/03.webp",
  huerta: SP + "urea/06.webp",
  molino: SP + "vida-para-tierra/04.webp",
  manzanas: SP + "vida-para-tierra/05.webp",
  atardecer: SP + "vida-para-tierra/09.webp",
  arado: SP + "vida-para-tierra/14.webp",
  plantines: SP + "vida-para-tierra/16.webp",
  video: R + "componentes/media/pie-campo.mp4",
  poster: R + "componentes/media/pie-campo.jpg",
};

export const HERO = {
  titulo: "Sostenibilidad que se mide",
  bajada: "Hace 25 años nutrimos la tierra de forma sostenible, con datos verificables.",
};

// Apertura: 40 a 60 palabras.
export const APERTURA = "Cuidamos el suelo que produce los alimentos, a las personas que trabajan con nosotros y a la comunidad de Ingeniero White, donde está la planta. Medimos lo que hacemos, lo certificamos con normas internacionales y lo contamos cada año en un reporte que cualquiera puede leer.";

export const PREGUNTA = {
  p: "¿Qué es producir urea de forma sostenible?",
  r: "Es producir más alimento sobre la misma tierra y con menos emisiones. La huella de carbono de nuestra urea granulada, verificada por una auditoría independiente, es un 42% menor que el promedio internacional. Y la producimos en una planta que abre sus puertas a la comunidad desde el primer día.",
};

// Bloques numerados: título corto, 40 a 60 palabras y una foto.
export const BLOQUES = {
  gestion: { t: "Gestión certificada", foto: FOTOS.torres, alt: "Torres de la planta de Profertil en Ingeniero White, con un árbol en primer plano",
    p: "Trabajamos con un sistema integrado certificado en las normas ISO 9001, 14001, 45001 y 50001, que ordena calidad, ambiente, seguridad y energía. Adherimos a Cuidado Responsable del Medio Ambiente de la CIQyP y a Protect & Sustain de la IFA, el programa global de la industria de fertilizantes." },
  huella: { t: "Huella de carbono verificada", foto: FOTOS.urea, alt: "Gránulos de urea sobre fondo azul",
    p: "Una auditoría internacional e independiente verificó la huella de carbono de nuestra urea granulada, de la cuna a la puerta, bajo la norma ISO 14064-3. Resultó un 42% menor que el promedio de 59 estudios internacionales. También participamos del Programa Argentino de Carbono Neutro." },
  energia: { t: "Energía renovable", foto: FOTOS.molino, alt: "Molino de viento en el campo bajo un cielo azul",
    p: "El 66% de la electricidad que mueve la planta llega de fuentes renovables. La gestión de la energía está certificada en ISO 50001, y eso nos obliga a medir, bajar consumos y mejorar cada año la eficiencia de un proceso que usa gas natural como materia prima." },
  comunidad: { t: "Licencia social", foto: FOTOS.manzanas, alt: "Manos con manzanas recién cosechadas y la remera de Profertil",
    p: "Trabajamos con la comunidad en programas que dejen capacidad instalada. Desde 2015 la Mesa de Proyectos reúne a más de 20 organizaciones de Ingeniero White, que eligieron y concretaron murales, plazas, cartelería y el monumento de acceso. Creciendo en Comunidad acompaña a otras instituciones de la zona." },
  puertas: { t: "Puertas abiertas", foto: FOTOS.planta, alt: "Personas con casco recorren la planta junto a los tanques",
    p: "Desde 2001 abrimos la planta a estudiantes, docentes y vecinos. Ya la recorrieron más de 60.000 personas, que conocen el proceso, el muelle sobre el estuario y el silo de 150.000 toneladas. Con el Club de Huertas llevamos la fertilización a las huertas familiares y escolares." },
};

// Cifras clave: rótulo, número, qué cuenta y año (siempre visible).
export const CIFRAS = [
  ["Huella de carbono", "42%", "menos que el promedio internacional de la urea", "2026"],
  ["Energía", "66%", "de la electricidad de la planta es renovable", "2025"],
  ["Visitas a Planta", "60.000", "personas recorrieron la planta desde 2001", "2026"],
  ["Mesa de Proyectos", "+20", "organizaciones de Ingeniero White", "2025"],
];

// Cita: 20 a 35 palabras.
export const CITA = {
  t: "El cambio climático obliga a repensar nuestra manera de producir y consumir alimentos. Es un cambio de comportamiento que toda la sociedad debe asumir para lograr un desarrollo integral sostenible de nuestra Tierra.",
  quien: "Mario Suffriti", cargo: "Gerente comercial de Profertil",
};

// Afirmación: 6 a 12 palabras.
export const FRASE = "Producir más alimentos cuidando la tierra que los hace posibles.";
export const MARQUESINA = "Nutrir la tierra de forma sostenible";

export const CARRUSEL = [
  [FOTOS.trigo, "Productora en un campo de trigo"],
  [FOTOS.plantines, "Plantines en bandejas de cultivo"],
  [FOTOS.huerta, "Mano sobre una huerta de lechugas"],
  [FOTOS.atardecer, "Campo sembrado al atardecer"],
  [FOTOS.suelo, "Mano que toma tierra del suelo"],
];

// Accesos a las páginas de la esfera (Tarjeta de acceso): nombre, qué hay, Forma del sistema y si sale del sitio.
export const ACCESOS = [
  { t: "Certificaciones", d: "Normas ISO, Cuidado Responsable y huella de carbono verificada.", forma: "escudo", href: "#" },
  { t: "Cuidado ambiental", d: "Energía, agua, emisiones y residuos de la planta.", forma: "hoja", href: "#" },
  { t: "Comunidad", d: "Programas que dejan capacidad instalada en Ingeniero White.", forma: "circulos", href: "#" },
  { t: "Club de Huertas", d: "Fertilizante y acompañamiento para huertas familiares y escolares.", forma: "plantas", href: "#" },
  { t: "Visitas a Planta", d: "Recorré la planta de urea granulada más importante de Latinoamérica.", forma: "industria", href: "#" },
  { t: "Reporte de Sostenibilidad", d: "Quince ediciones con el desempeño ambiental, social y económico.", forma: "grafico", href: "https://rs.profertil.com.ar/", externo: true },
];

// Notas de Novedades sobre sostenibilidad y comunidad (las reales de la maqueta).
const NOTAS_ELEGIDAS = [
  "la-urea-granulada-de-profertil-obtiene-la-verificacion-de-su-huella-de-carbono",
  "profertil-recibio-a-su-visitante-numero-60-000",
  "la-mesa-de-proyectos-celebra-su-10-aniversario",
];
const MC = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const fecha = (f) => { const p = f.split("-"); return Number(p[2]) + " " + MC[Number(p[1]) - 1] + " " + p[0]; };
export const NOTAS_SOS = NOTAS_ELEGIDAS.map((ar) => {
  const n = NOTAS.find((x) => x.ar === ar);
  if (!n) throw new Error("No está la nota " + ar);
  return { t: n.t, tp: n.tp, anio: n.f.slice(0, 4), fecha: fecha(n.f), href: R + "novedades/" + encodeURIComponent(n.ar) + "/",
    img: R + "novedades/fotos/mini/" + encodeURIComponent(n.ar) + ".webp", ratio: n.mi ? (n.mi[0] / n.mi[1]).toFixed(4) : "1.5" };
});

// Documentos de la Biblioteca sobre ambiente y sostenibilidad.
const DOCS_ELEGIDOS = [
  "https-www-profertil-com-ar-wp-content-uploads-2021-05-gestion_ambiental_2018-pdf",
  "sistemas-productivos-sostenibles",
  "https-www-profertil-com-ar-wp-content-uploads-2024-12-bt-40-secuestro-de-carbono-pdf",
  "boletin-29-bis-fertilizantes-estabilizados-eun-y-cuidado-del-medioambiente",
];
export const DOCS_SOS = DOCS_ELEGIDOS.map((id) => {
  const d = BIB.find((x) => x.id === id);
  if (!d) throw new Error("No está el documento " + id);
  return { id: d.id, t: d.t, c: d.c, y: d.y, u: d.u, href: R + "biblioteca/" + encodeURIComponent(d.id) + "/" };
});

// Contactos por área (los mails publicados en el sitio actual).
export const CONTACTOS = [
  { area: "Prensa", d: "Gacetillas, fotos y entrevistas.", mail: "prensa@profertil.com.ar", tel: "+54 9 291 459-8000" },
  { area: "Visitas a Planta", d: "Escuelas, instituciones y vecinos que quieran recorrer la planta.", mail: "visitas@profertil.com.ar" },
  { area: "Becas Educar para Transformar", d: "Inscripciones y consultas sobre el programa de becas.", mail: "becas@profertil.com.ar" },
];

export const CIERRE = { frase: "Todo el detalle, en el Reporte de Sostenibilidad 2025.", boton: "Leer el reporte", href: "https://rs.profertil.com.ar/" };
export const VISITA = { frase: "Vení a conocer cómo trabajamos.", boton: "Pedí tu visita", href: "mailto:visitas@profertil.com.ar" };
