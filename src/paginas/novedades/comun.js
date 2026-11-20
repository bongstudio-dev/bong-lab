  // Formas e iconos oficiales a <symbol>, una sola vez.
  var defs = document.getElementById("pf-defs");
  var simbolos = "";
  Object.keys(A.formas).forEach(function (k) { simbolos += '<symbol id="pf-forma-' + k + '" viewBox="' + A.formas[k].vb + '">' + A.formas[k].d + "</symbol>"; });
  defs.insertAdjacentHTML("beforeend", simbolos);

  /* --- Taxonomia ---------------------------------------------------------
     Tipos: las cinco categorias de la plantilla Nota del tablero de
     auditoria B1. El arte de la tarjeta usa un par de color canonico del
     generador de patrones de otra familia. Cultivo va como subcategoria. */
  // Familias del componente Etiqueta: fondo del badge, forma y texto.
  // La invertida da vuelta fondo y forma; el dato usa la forma de fondo.
  var FAM = {
    azul: { bg: "#003DA5", fo: "#4086FF", tx: "#003DA5" },
    verde: { bg: "#2D8035", fo: "#5EB53A", tx: "#2D8035" },
    amarillo: { bg: "#EABA2C", fo: "#E57F19", tx: "#E57F19" },
    naranja: { bg: "#E57F19", fo: "#8A4818", tx: "#E57F19" }
  };
  function fam(nombre, inv) { var f = FAM[nombre]; return inv ? { bg: f.fo, fo: f.bg, tx: f.tx } : f; }
  var TIPOS = [
    { id: "institucional", nombre: "Institucional", forma: "escudo", f: fam("azul") },
    { id: "comercial", nombre: "Comercial", forma: "barras", f: fam("naranja") },
    { id: "somos", nombre: "Somos Profertil", corto: "Somos", forma: "circulos", f: fam("verde", true) },
    { id: "tecnico", nombre: "Artículo técnico", corto: "Técnico", forma: "lupa", f: fam("verde") },
    { id: "aviso", nombre: "Aviso a la comunidad", corto: "Aviso", forma: "casco", f: fam("amarillo") },
    { id: "financiera", nombre: "Gacetilla financiera", corto: "Financiera", forma: "grafico", f: fam("azul", true) }
  ];
  var CULTIVOS = [
    { id: "trigo", nombre: "Trigo", forma: "trigo" }, { id: "maiz", nombre: "Maíz", forma: "hoja" },
    { id: "soja", nombre: "Soja", forma: "capas" }, { id: "girasol", nombre: "Girasol", forma: "flor" },
    { id: "pasturas", nombre: "Pasturas", forma: "ondas" }, { id: "cebada-arroz", nombre: "Cebada, arroz y otros", forma: "estrella" }
  ];
  CULTIVOS.forEach(function (c) { c.f = fam("verde", true); c.c = "#5EB53A"; });
  var POR = {};
  TIPOS.concat(CULTIVOS).forEach(function (x) { POR[x.id] = x; });

  var MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  var MC = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  function fecha(f, larga) {
    if (!f) return "Sin fecha";
    var p = f.split("-");
    var m = Number(p[1]) - 1;
    return larga ? Number(p[2]) + " de " + MESES[m] + " de " + p[0] : Number(p[2]) + " " + MC[m] + " " + p[0];
  }

  // Fecha para el dato de la etiqueta: "30 de junio 2026".
  function fechaDato(f) { return f ? fecha(f, true).replace(/ de (\d{4})$/, " $1") : ""; }

  function plano(s) { return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); }
  function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function resaltar(texto, q) {
    if (!q) return esc(texto);
    var norm = "";
    for (var i = 0; i < texto.length; i++) norm += plano(texto[i]).charAt(0) || texto[i];
    var out = "", desde = 0, at;
    while ((at = norm.indexOf(q, desde)) !== -1) {
      out += esc(texto.slice(desde, at)) + "<mark>" + esc(texto.slice(at, at + q.length)) + "</mark>";
      desde = at + q.length;
    }
    return out + esc(texto.slice(desde));
  }

  // Una sola categorizacion: donde WordPress ya tiene categoria, manda esa
  // (es la del cliente); el resto queda con el tipo de nota de la plantilla.
  var DESDE_WP = { "comunicacion-institucional": "institucional", "comunicacion-comercial": "comercial", "somos-profertil": "somos" };
  NOTAS.forEach(function (n, k) {
    n.id = k;
    if (DESDE_WP[n.s]) n.tp = DESDE_WP[n.s];
    n.anio = n.f ? n.f.slice(0, 4) : "";
    n.buscable = plano([n.t, n.b, n.u.replace(/-/g, " "), POR[n.tp].nombre].join(" "));
  });

  /* --- Arte de tarjeta -----------------------------------------------------
     Sin fotos (el sitio actual no se puede bajar desde aca): composiciones
     con las 18 formas oficiales sobre el par de color del tipo de nota, figura
     sobre fondo, como en el generador de patrones. */
  function rnd32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  var FORMA_TEMA = {
    trigo: ["trigo"], maiz: ["plantas", "trigo"], soja: ["hoja", "plantas"], girasol: ["sol", "flor"], pasturas: ["plantas", "hoja"], "cebada-arroz": ["trigo", "plantas"],
    aviso: ["casco", "escudo", "ondas"], financiera: ["grafico", "barras"], tecnico: ["lupa", "suelo", "capas"], somos: ["circulos", "flor", "c", "estrella"],
    suelos: ["suelo", "capas", "ondas", "hoja"], alimentos: ["trigo", "hoja", "plantas", "flor"], energia: ["sol", "industria", "urea", "c"], comunidades: ["circulos", "flor", "c", "estrella"]
  };
  function formasDe(n) {
    var l = [];
    n.c.forEach(function (c) { l = l.concat(FORMA_TEMA[c]); });
    if (n.tp !== "institucional" && n.tp !== "comercial") l = l.concat(FORMA_TEMA[n.tp]);
    if (!l.length) l = l.concat(FORMA_TEMA[n.p[0]]);
    return l;
  }
  var PARES = { azul: ["#003DA5", "#4086FF"], verde: ["#2D8035", "#5EB53A"], amarillo: ["#EABA2C", "#E57F19"], naranja: ["#E57F19", "#8A4818"] };
  var PARES_CONTRA = {
    institucional: ["verde", "amarillo", "naranja"], financiera: ["verde", "amarillo", "naranja"], somos: ["azul", "amarillo", "naranja"],
    tecnico: ["azul", "amarillo", "naranja"], comercial: ["azul", "verde"], aviso: ["azul", "verde"]
  };
  function usar(f, x, y, w, h, rot, color) {
    var cx = x + w / 2, cy = y + h / 2;
    return '<g transform="rotate(' + rot + " " + cx + " " + cy + ')"><use href="#pf-forma-' + f + '" x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + color + '"/></g>';
  }
  function arte(n, W, H, semilla) {
    var r = rnd32(semilla);
    // El par sale de una familia distinta a la del tipo, para que la etiqueta
    // principal (badge y dato en el color del tipo) no se pierda sobre el arte.
    var opciones = PARES_CONTRA[n.tp];
    var par = PARES[opciones[n.id % opciones.length]];
    var inv = r() < 0.3;
    var fig = inv ? par[1] : par[0], fondo = inv ? par[0] : par[1];
    var fs = formasDe(n);
    var f1 = fs[Math.floor(r() * fs.length)];
    var f2 = fs[Math.floor(r() * fs.length)];
    var s = '<svg viewBox="0 0 ' + W + " " + H + '" aria-hidden="true"><rect width="' + W + '" height="' + H + '" fill="' + fondo + '"/>';
    var modo = r();
    var rots = [0, 90, 180, 270];
    if (modo < 0.42) {
      // Una forma grande que se sale del cuadro, como la hoja del concepto web.
      var t = Math.max(W, H) * (1.05 + r() * 0.35);
      s += usar(f1, W - t * (0.62 + r() * 0.2), H - t * (0.66 + r() * 0.2), t, t, rots[Math.floor(r() * 4)], fig);
    } else if (modo < 0.72) {
      // Dos formas enfrentadas.
      var m = Math.min(W / 2, H) * 0.92;
      s += usar(f1, W / 2 - m - 4, (H - m) / 2, m, m, rots[Math.floor(r() * 4)], fig);
      s += usar(f2, W / 2 + 4, (H - m) / 2, m, m, rots[Math.floor(r() * 4)], fig);
    } else {
      // Grilla: la logica del patron.
      var cols = W > H ? 3 : 2, filas = Math.max(1, Math.round(cols * H / W));
      var cw = W / cols, ch = H / filas, lado = Math.min(cw, ch) * 0.82;
      for (var y = 0; y < filas; y++) for (var x = 0; x < cols; x++) {
        var f = (x + y) % 2 ? f2 : f1;
        s += usar(f, x * cw + (cw - lado) / 2, y * ch + (ch - lado) / 2, lado, lado, rots[(x + y * 3) % 4], fig);
      }
    }
    return s + "</svg>";
  }
  var PROP = [[4, 3], [1, 1], [3, 4], [4, 3], [5, 4]];

  function badge(x) {
    return '<svg class="pf-etiqueta__badge" viewBox="0 0 100 100" aria-hidden="true"><use href="#pf-badge-bg" width="100" height="100" fill="' + x.f.bg + '"/>' +
      '<use href="#pf-forma-' + x.forma + '" x="21" y="21" width="58" height="58" fill="' + x.f.fo + '"/></svg>';
  }
  var FLECHA = '<span class="pf-etiqueta__flecha"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 8v10H8"/></svg></span>';
  function vars(x) { return "--eb:" + x.f.bg + ";--fo:" + x.f.fo + ";--tx:" + x.f.tx; }
  // o = { dato, flecha, cls, tag, attrs }
  function etq(id, o) {
    o = o || {};
    var x = POR[id], tag = o.tag || "span";
    return "<" + tag + ' class="pf-etiqueta ' + (o.cls || "") + '" style="' + vars(x) + '"' + (o.attrs || "") + ">" + badge(x) +
      '<span class="pf-etiqueta__rotulo">' + (x.corto ? '<span class="pf-etiqueta__completo">' + x.nombre + '</span><span class="pf-etiqueta__corto">' + x.corto + "</span>" : x.nombre) + "</span>" + (o.dato != null ? '<span class="pf-etiqueta__dato">' + o.dato + "</span>" : "") + (o.flecha ? FLECHA : "") + "</" + tag + ">";
  }

