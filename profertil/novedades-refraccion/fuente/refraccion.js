/* ==========================================================================
   Novedades · refraccion: el vidrio lo renderiza LiquidGlass
   (github.com/ybouane/liquidglass, v1.0.3, desde jsdelivr).
   La libreria captura con html-to-image a los hijos de su raiz: capturar la
   grilla entera (cientos de tarjetas) seria carisimo y en iPhone se pasa del
   tamaño maximo de canvas. Asi que la raiz es una capa fija con dos cosas:
   - un <canvas> invisible donde se redibuja (2D, solo cerca del vidrio) lo
     que hay detras: fondos, arte SVG y texto. La libreria dibuja los canvas
     directo, sin html-to-image.
   - un "molde" de vidrio por pieza de la UI (dock, barra, menu, lupa,
     flechas) que sigue su posicion. La pieza real queda arriba, con su
     contenido y un fondo de color translucido que tiñe el vidrio.
   ========================================================================== */
import { LiquidGlass } from "https://cdn.jsdelivr.net/npm/@ybouane/liquidglass@1.0.3/dist/index.js";

const D = Math.min(1.5, window.devicePixelRatio || 1);

/* --- Versiones: un vidrio claro y tres esmerilados. Opciones de la
   libreria; lo que no se nombra queda en su default. ------------------ */
const VERSIONES = {
  vidrio:   { nombre: "Vidrio",     cfg: { blurAmount: 0,    refraction: 0.6,  chromAberration: 0.03, edgeHighlight: 0.015, fresnel: 0.35, specular: 0 } },
  suave:    { nombre: "Esmerilado suave", cfg: { blurAmount: 0.12, refraction: 0.5,  chromAberration: 0.02, edgeHighlight: 0.02,  fresnel: 0.5,  specular: 0 } },
  frosted:  { nombre: "Esmerilado", cfg: { blurAmount: 0.25, refraction: 0.69, chromAberration: 0.05, edgeHighlight: 0.05,  fresnel: 1,    specular: 0 } },
  denso:    { nombre: "Esmerilado denso", cfg: { blurAmount: 0.45, refraction: 0.35, chromAberration: 0,    edgeHighlight: 0.02,  fresnel: 0.6,  specular: 0, saturation: 0.2, brightness: 0.04 } },
  original: { nombre: "Original" }
};
const ORDEN = Object.keys(VERSIONES);

/* --- Piezas de vidrio. z: profundidad del bisel (zRadius). ------------ */
const topSolida = () => document.getElementById("top").classList.contains("solid");
const PIEZAS = [
  { sel: ".filters", z: 28, sombra: 0.18 },
  { sel: ".top", z: 18, sombra: 0, barra: true, si: topSolida },
  { sel: ".nav .menu", z: 20, sombra: 0.12, si: () => !topSolida() },
  { sel: ".nav .menu-mobile", z: 18, sombra: 0.12, si: () => !topSolida() },
  { sel: ".busca", z: 20, sombra: 0.12, si: (el) => !topSolida() && !el.classList.contains("open") },
  { sel: ".busca-x", z: 20, sombra: 0.12, si: () => !topSolida() },
  { sel: ".d-flecha", z: 20, sombra: 0.12, si: (el) => !el.matches(":hover") }
];

/* --- Lo que se redibuja detras. vivo: se mide en cada cuadro (se mueve
   por dentro); el resto se mide una vez, relativo a su raiz. ----------- */
const RAICES = [
  { sel: ".dest", solo: true },
  { sel: ".dest .d-slide.vis", vivo: true },
  { sel: ".dest .d-nav", vivo: true },
  { sel: ".result-row" },
  { sel: ".grid .card" },
  { sel: ".empty" }
];

/* --- Capa raiz ---------------------------------------------------------- */
const capa = document.createElement("div");
capa.id = "lg"; capa.setAttribute("aria-hidden", "true");
const fondo = document.createElement("canvas");
fondo.id = "lg-fondo";
const cx = fondo.getContext("2d");
capa.appendChild(fondo);
// Un molde por elemento real (las flechas son dos).
const moldes = [];
PIEZAS.forEach((def) => document.querySelectorAll(def.sel).forEach((el) => {
  const m = document.createElement("div");
  m.className = "lg-molde";
  capa.appendChild(m);
  moldes.push({ def, el, m, s: 0, firma: "" });
}));
document.body.appendChild(capa);

let W = 0, H = 0;
function medir() {
  W = capa.clientWidth; H = capa.clientHeight;
  fondo.width = Math.max(1, Math.round(W * D));
  fondo.height = Math.max(1, Math.round(H * D));
  cache = new WeakMap();
  sucio = true;
}

/* --- Redibujo de la pagina ------------------------------------------- */
var imgs = new WeakMap();
function alfa(c) { var m = /rgba?\(([^)]+)\)/.exec(c); if (!m) return c === "transparent" ? 0 : 1; var p = m[1].split(/[ ,/]+/).filter(Boolean); return p.length > 3 ? parseFloat(p[3]) : 1; }
function radio(cs, w, h) { return Math.min(parseFloat(cs.borderTopLeftRadius) || 0, w / 2, h / 2); }
function fuente(cs) { return cs.fontStyle + " " + cs.fontWeight + " " + cs.fontSize + " " + cs.fontFamily; }
var DEFS = {};
function simbolo(id) { if (!(id in DEFS)) { var s = document.getElementById(id); DEFS[id] = s ? s.outerHTML : ""; } return DEFS[id]; }
function imagen(el, w, h) {
  var c = imgs.get(el);
  if (c) return c.ok ? c.img : null;
  var cs = getComputedStyle(el), k = el.cloneNode(true);
  k.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  k.removeAttribute("class"); k.removeAttribute("style");
  var esc = Math.min(2, 2200 / Math.max(w, h, 1));
  k.setAttribute("width", Math.round(w * esc)); k.setAttribute("height", Math.round(h * esc));
  k.setAttribute("color", cs.color);
  if (!k.getAttribute("fill")) k.setAttribute("fill", cs.fill);
  if (cs.stroke && cs.stroke !== "none") { k.setAttribute("stroke", cs.stroke); k.setAttribute("stroke-width", cs.strokeWidth); }
  var s = k.outerHTML, ids = {}, defs = "";
  s.replace(/href="#([\w-]+)"/g, function (_, id) { ids[id] = 1; });
  Object.keys(ids).forEach(function (id) { defs += simbolo(id); });
  s = s.replace(/^<svg([^>]*)>/, "<svg$1><defs>" + defs + "</defs>");
  c = { img: new Image(), ok: false };
  c.img.onload = function () { c.ok = true; };
  c.img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(s);
  imgs.set(el, c);
  return null;
}
// Arma la lista de dibujo de una raiz: cajas con fondo, SVG y palabras.
function recorrer(raiz, solo) {
  var R = raiz.getBoundingClientRect(), out = [], rg = document.createRange();
  function caja(el, cs) {
    var r = el.getBoundingClientRect();
    return { el: el, x: r.left - R.left, y: r.top - R.top, w: r.width, h: r.height, r: radio(cs, r.width, r.height) };
  }
  (function ir(el) {
    var cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden" || parseFloat(cs.opacity) < 0.05) return;
    if (el instanceof SVGSVGElement) { var s = caja(el, cs); s.k = "svg"; out.push(s); return; }
    if (alfa(cs.backgroundColor) > 0) { var b = caja(el, cs); b.k = "caja"; b.c = cs.backgroundColor; out.push(b); }
    if (solo) return;
    var corta = cs.overflow !== "visible" && parseFloat(cs.borderTopLeftRadius) > 0;
    if (corta) { var q = caja(el, cs); q.k = "corte"; out.push(q); }
    for (var n = el.firstChild; n; n = n.nextSibling) {
      if (n.nodeType === 1) ir(n);
      else if (n.nodeType === 3 && /\S/.test(n.data)) {
        var re = /\S+/g, m, f = fuente(cs), up = cs.textTransform === "uppercase", ls = cs.letterSpacing;
        while ((m = re.exec(n.data))) {
          rg.setStart(n, m.index); rg.setEnd(n, m.index + m[0].length);
          var bx = rg.getClientRects()[0];
          if (!bx || !bx.width) continue;
          out.push({ k: "txt", s: up ? m[0].toUpperCase() : m[0], x: bx.left - R.left, y: bx.top - R.top + bx.height / 2, f: f, c: cs.color, ls: ls });
        }
      }
    }
    if (corta) out.push({ k: "fin" });
  })(raiz);
  return out;
}
function dibujar(raiz, def, R) {
  var lista = cache.get(raiz);
  if (!lista || lista.w !== Math.round(R.width)) { lista = recorrer(raiz, def.solo); lista.w = Math.round(R.width); cache.set(raiz, lista); }
  for (var i = 0; i < lista.length; i++) {
    var it = lista[i], x = R.left + it.x, y = R.top + it.y, w = it.w, h = it.h;
    if (def.vivo && it.el) { var r = it.el.getBoundingClientRect(); x = r.left; y = r.top; w = r.width; h = r.height; }
    if (it.k === "caja") {
      cx.fillStyle = it.c; cx.beginPath();
      if (it.r > 0.5 && cx.roundRect) cx.roundRect(x, y, w, h, Math.min(it.r, w / 2, h / 2)); else cx.rect(x, y, w, h);
      cx.fill();
    } else if (it.k === "svg") {
      var im = imagen(it.el, w, h);
      if (im) cx.drawImage(im, x, y, w, h);
    } else if (it.k === "txt") {
      cx.font = it.f; cx.fillStyle = it.c;
      if ("letterSpacing" in cx) cx.letterSpacing = it.ls === "normal" ? "0px" : it.ls;
      cx.fillText(it.s, x, y);
    } else if (it.k === "corte") {
      cx.save(); cx.beginPath();
      if (cx.roundRect) cx.roundRect(x, y, w, h, Math.min(it.r, w / 2, h / 2)); else cx.rect(x, y, w, h);
      cx.clip();
    } else if (it.k === "fin") cx.restore();
  }
}

// Las mutaciones de la grilla y las placas invalidan lo medido.
new MutationObserver((ms) => {
  for (const m of ms) { const t = m.target; if (t.closest && t.closest(".filters, .top, #lg")) continue; cache = new WeakMap(); sucio = true; return; }
}).observe(document.body, { childList: true, subtree: true, characterData: true });

function opacidad(el) {
  let o = 1;
  for (let e = el; e && e !== document.body; e = e.parentElement) {
    const cs = getComputedStyle(e);
    if (cs.display === "none" || cs.visibility === "hidden") return 0;
    o *= parseFloat(cs.opacity);
  }
  return o;
}

/* --- Cuadro: mover moldes y redibujar el fondo solo si hace falta ----- */
let modo = "frosted";
try { const g = localStorage.getItem("novedades-vidrio-lg"); if (ORDEN.includes(g)) modo = g; } catch (e) {}
const q = /[?&]vidrio=([a-z]+)/.exec(location.search); if (q && ORDEN.includes(q[1])) modo = q[1];

let sucio = true, ultimoY = -1, ultimoHero = 0, lg = null;
function cfgDe(o) {
  return JSON.stringify(Object.assign({}, VERSIONES[modo].cfg || {}, { cornerRadius: o.r, zRadius: Math.min(o.def.z, o.r || o.def.z), shadowOpacity: o.def.sombra, shadowSpread: 10 }));
}
function cuadro(now) {
  requestAnimationFrame(cuadro);
  if (modo === "original") return;
  const zonas = [];
  let mueve = false;
  for (const o of moldes) {
    const obj = o.def.si && !o.def.si(o.el) ? 0 : 1;
    o.s += (obj - o.s) * 0.25; if (Math.abs(obj - o.s) < 0.01) o.s = obj;
    const a = o.s * opacidad(o.el);
    const r = o.el.getBoundingClientRect();
    const vis = a > 0.01 && r.width > 0 && r.bottom > 0 && r.top < H;
    const y0 = r.top;
    const rad = o.def.barra ? 0 : Math.round(Math.min(parseFloat(getComputedStyle(o.el).borderTopLeftRadius) || 0, r.width / 2, r.height / 2));
    o.r = rad;
    const firma = vis ? [Math.round(r.left), Math.round(y0), Math.round(r.width), Math.round(r.bottom - y0), a.toFixed(2)].join() : "x";
    if (firma !== o.firma) {
      o.firma = firma; mueve = true;
      const st = o.m.style;
      if (vis) {
        st.display = "block"; st.left = r.left + "px"; st.top = y0 + "px";
        st.width = r.width + "px"; st.height = (r.bottom - y0) + "px"; st.opacity = a;
      } else st.display = "none";
    }
    const cfg = cfgDe(o);
    if (o.m.dataset.config !== cfg) o.m.dataset.config = cfg;
    if (vis) zonas.push({ x: r.left - 70, y: Math.max(-70, y0 - 70), w: r.width + 140, h: r.bottom - Math.max(-70, y0 - 70) + 70 });
  }
  // El carrusel se mueve solo: con el hero a la vista se redibuja a ~12 fps.
  const hero = document.querySelector(".dest").getBoundingClientRect().bottom > 0;
  if (hero && now - ultimoHero > 80) { ultimoHero = now; sucio = true; }
  if (window.scrollY !== ultimoY) { ultimoY = window.scrollY; sucio = true; }
  if (!(sucio || mueve) || !zonas.length || !lg) return;
  sucio = false;

  cx.setTransform(D, 0, 0, D, 0, 0);
  cx.save(); cx.beginPath();
  zonas.forEach((z) => cx.rect(z.x, z.y, z.w, z.h));
  cx.clip();
  cx.fillStyle = bgBody; cx.fillRect(0, 0, W, H);
  cx.textBaseline = "middle"; cx.textAlign = "left";
  RAICES.forEach((def) => document.querySelectorAll(def.sel).forEach((el) => {
    const R = el.getBoundingClientRect();
    if (!R.width || R.bottom < 0 || R.top > H) return;
    if (zonas.some((z) => R.right > z.x && R.left < z.x + z.w && R.bottom > z.y && R.top < z.y + z.h)) dibujar(el, def, R);
  }));
  cx.restore();
  lg.markChanged(fondo);
}

/* --- Selector de version -------------------------------------------- */
const btn = document.createElement("button");
btn.type = "button"; btn.className = "vidrio";
function marcar() {
  btn.innerHTML = "<span>Vidrio</span><b>" + VERSIONES[modo].nombre + "</b>";
  btn.setAttribute("aria-label", "Versión del vidrio: " + VERSIONES[modo].nombre + ". Tocar para cambiar.");
  document.documentElement.classList.toggle("refr", modo !== "original");
  if (modo !== "original" && !W) medir();
  sucio = true;
}
btn.addEventListener("click", () => {
  modo = ORDEN[(ORDEN.indexOf(modo) + 1) % ORDEN.length];
  try { localStorage.setItem("novedades-vidrio-lg", modo); } catch (e) {}
  marcar();
});
document.body.appendChild(btn);

const bgBody = getComputedStyle(document.body).backgroundColor;
let cache = new WeakMap();
marcar(); medir();
window.addEventListener("resize", medir);
// Primer cuadro antes del init, para que los moldes ya esten en su lugar.
cuadro(performance.now());
if (document.fonts && document.fonts.ready) await document.fonts.ready;
cache = new WeakMap();
lg = await LiquidGlass.init({ root: capa, glassElements: capa.querySelectorAll(".lg-molde") });
sucio = true;
