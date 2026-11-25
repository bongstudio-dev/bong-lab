
(function () {
  "use strict";

  /* Datos reales: los documentos (título + PDF) de la Biblioteca Virtual del sitio actual, del crawl (urls.csv). Por documento:
     id, título (t), sección de la URL (c, solo para la etiqueta y el arte), año del título (y), PDF original (u), copia local (l, el nombre
     del archivo en pdf/) y las etiquetas del sitio actual (e): {cultivo, zona, anio, nutriente}, cada una una lista de ids de opción.
     GRUPOS son los cuatro grupos con sus opciones en el orden de la portada de la Biblioteca Virtual. */
  var DOCS = /*__DOCS__*/[];
  var GRUPOS = /*__GRUPOS__*/[];
  var A = /*__ASSETS__*/{};
  /* La misma plantilla arma otras listas de documentos (src/componentes/Lista.astro): Hojas de seguridad pasa acá dónde están el visor y los PDF,
     cómo se nombran sus documentos y el campo de su cabecera. Vacío, es la Biblioteca. */
  var PAG = /*__PAG__*/{};
  var BASE = PAG.base || "";
  var NOMBRE_TODO = PAG.todo || "Toda la Biblioteca", UNO = PAG.uno || "documento", VARIOS = PAG.varios || "documentos";
  /* Secciones (PAG.secciones): una página con varias listas, como Inversores (Situación financiera, Gobierno societario y Títulos de
     deuda). Se cambia con el selector de la fila de herramientas, como las vistas: sin cambiar de página. Cada sección trae sus
     documentos, sus grupos de filtros, cómo se nombran sus documentos y su orden. */
  var SECCIONES = PAG.secciones || [], seccion = null;
  /* Una sección puede ser de tarjetas (s.tarjetas, Proveedores): accesos en lugar de documentos (el formulario, los PDF, los
     portales). No tiene filtros ni vistas; el buscador filtra las tarjetas. TARJ son las de la sección elegida, null si es una lista. */
  var TARJ = null, tarjLista = [];
  function usarSeccion(s) {
    seccion = s;
    DOCS = s.docs || []; GRUPOS = s.grupos || []; TARJ = s.tarjetas || null;
    document.documentElement.classList.toggle("pf-con-tarjetas", !!TARJ);
    NOMBRE_TODO = s.todo; UNO = s.uno; VARIOS = s.varios;
    PAG.orden = s.orden; PAG.desc = s.desc;
  }
  if (SECCIONES.length) usarSeccion(SECCIONES[0]);
  var $ = function (id) { return document.getElementById(id); };
  /* Cabecera con campo (campo.js): el color y la Forma del badge de la sección, como en la Nota. */
  var CAMPO = PAG.campo || { color: "azul", forma: "lupa", tema: ["lupa", "suelo", "capas"] };
  window.PF_CAMPO = { formas: A.formas, color: CAMPO.color, forma: CAMPO.forma, tema: CAMPO.tema, cab: "pf-cab", main: "pf-hoja", columna: "pf-lista" };

  /* Barra transparente sobre la cabecera: toma el azul cuando termina el campo, como en Novedades. */
  // Barra transparente al cargar; toma el azul apenas se baja, cuando la caja de la cabecera llega a la barra.
  var barraSolida = function () { var t = $("pf-top"); t.classList.toggle("pf-barra--solida", window.scrollY > 0 && $("pf-cab").getBoundingClientRect().top <= t.offsetHeight); };
  window.addEventListener("scroll", barraSolida, { passive: true });
  window.addEventListener("resize", barraSolida);
  barraSolida();

  var defs = $("pf-defs"), simbolos = "";
  Object.keys(A.formas).forEach(function (k) { simbolos += '<symbol id="pf-forma-' + k + '" viewBox="' + A.formas[k].vb + '">' + A.formas[k].d + "</symbol>"; });
  defs.insertAdjacentHTML("beforeend", simbolos);

  /* @comun: etiquetas por categoría (la pieza Etiqueta del Master). */
/*__COMUN__*/  /* @fin-comun */

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
  function prepararDocs() {
    DOCS.forEach(function (d, k) {
      d.k = k;
      d.n = plano(d.t);
      d.buscable = plano([d.t, POR[d.c].nombre, d.y].join(" "));
    });
  }
  prepararDocs();

  /* --- Estado ------------------------------------------------------------- */
  var SIN = "sin";   // la opción "Sin clasificar" de cada grupo: documentos sin etiqueta en ese grupo
  var sel = {};
  GRUPOS.forEach(function (g) { sel[g.id] = {}; });
  var estado = { q: "", sel: sel, orden: "az" };
  var despertar = function () {};   // lo define la Ancla, más abajo
  var lista = [], pintadas = 0, TANDA = 60;
  var docs = $("pf-docs");
  var esMobile = window.matchMedia("(max-width: 640px)");
  function activos(o) { return Object.keys(o).filter(function (k) { return o[k]; }); }
  function etiquetas(d, g) { return (d.e && d.e[g]) || []; }
  function tiene(d, g, v) { var vs = etiquetas(d, g); return v === SIN ? !vs.length : vs.indexOf(v) !== -1; }
  // Dentro de un grupo alcanza con una opción (o); entre grupos tienen que cumplirse todos (y). "salvo" deja afuera un grupo, para contar sus opciones.
  function pasa(d, salvo) {
    var q = plano(estado.q.trim());
    if (q && d.buscable.indexOf(q) === -1) return false;
    for (var i = 0; i < GRUPOS.length; i++) {
      var g = GRUPOS[i].id; if (g === salvo) continue;
      var ks = activos(estado.sel[g]);
      if (ks.length && !ks.some(function (k) { return tiene(d, g, k); })) return false;
    }
    return true;
  }
  function filtrar() {
    lista = DOCS.filter(function (d) { return pasa(d); });
    if (TARJ) { var qt = plano(estado.q.trim()); tarjLista = TARJ.filter(function (x) { return !qt || plano([x.t, x.b || "", x.ir || ""].join(" ")).indexOf(qt) !== -1; }); }
    // Orden propio de la página (PAG.orden = "o"): el que trae cada documento en `o`, sin selector. Situación financiera va
    // del más reciente al más viejo (PAG.desc) y el Legajo impositivo como el legajo (el completo, nacionales y provincias).
    if (PAG.orden === "o") lista.sort(function (a, b) { return (a.o < b.o ? -1 : a.o > b.o ? 1 : 0) * (PAG.desc ? -1 : 1); });
    else if (estado.orden === "anio") lista.sort(function (a, b) {
      if (a.y !== b.y) { if (!a.y) return 1; if (!b.y) return -1; return a.y < b.y ? 1 : -1; }
      return a.n < b.n ? -1 : a.n > b.n ? 1 : 0;
    });
    else lista.sort(function (a, b) { return a.n < b.n ? -1 : a.n > b.n ? 1 : 0; });
  }

  /* --- Arte de miniatura: las Formas del sistema sobre un par de color distinto al de la categoría, figura sobre fondo
     (la misma lógica que las tarjetas de Novedades). Es determinista: cada documento siempre tiene el mismo. */
  function rnd32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  var FORMAS_CAT = {
    cereales: ["trigo", "plantas"], oleaginosas: ["capas", "hoja", "flor"], pasturas: ["ondas", "plantas", "hoja"], industriales: ["industria", "urea", "sol"],
    msds: ["casco", "escudo"], inversores: ["grafico", "barras"], biblioteca: ["lupa", "suelo", "capas"], impositivo: ["escudo", "circulos"],
    proveedores: ["industria", "capas"]
  };
  var PARES = { azul: ["#003DA5", "#4086FF"], verde: ["#2D8035", "#5EB53A"], amarillo: ["#EABA2C", "#E57F19"], naranja: ["#E57F19", "#8A4818"] };
  var PARES_CONTRA = {
    cereales: ["azul", "amarillo", "naranja"], oleaginosas: ["azul", "verde"], pasturas: ["azul", "amarillo", "naranja"], industriales: ["azul", "verde"],
    msds: ["azul", "verde", "naranja"], inversores: ["verde", "amarillo", "naranja"], biblioteca: ["verde", "amarillo", "naranja"],
    impositivo: ["azul", "verde", "amarillo"], proveedores: ["azul", "verde"]
  };
  function usar(f, x, y, w, h, rot, color) {
    var cx = x + w / 2, cy = y + h / 2;
    return '<g transform="rotate(' + rot + " " + cx + " " + cy + ')"><use href="#pf-forma-' + f + '" x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + color + '"/></g>';
  }
  function arte(d) {
    var W = 240, H = 240, r = rnd32(d.k * 7919 + 13);
    var op = PARES_CONTRA[d.c], par = PARES[op[d.k % op.length]];
    var inv = r() < 0.3, fig = inv ? par[1] : par[0], fondo = inv ? par[0] : par[1];
    var fs = FORMAS_CAT[d.c], f1 = fs[Math.floor(r() * fs.length)], f2 = fs[Math.floor(r() * fs.length)];
    var s = '<svg viewBox="0 0 ' + W + " " + H + '" aria-hidden="true"><rect width="' + W + '" height="' + H + '" fill="' + fondo + '"/>';
    var modo = r(), rots = [0, 90, 180, 270];
    if (modo < 0.45) {
      var t = W * (1.05 + r() * 0.35);
      s += usar(f1, W - t * (0.62 + r() * 0.2), H - t * (0.66 + r() * 0.2), t, t, rots[Math.floor(r() * 4)], fig);
    } else if (modo < 0.75) {
      var m = W / 2 * 0.92;
      s += usar(f1, W / 2 - m - 4, (H - m) / 2, m, m, rots[Math.floor(r() * 4)], fig);
      s += usar(f2, W / 2 + 4, (H - m) / 2, m, m, rots[Math.floor(r() * 4)], fig);
    } else {
      var cw = W / 2, lado = cw * 0.82;
      for (var y = 0; y < 2; y++) for (var x = 0; x < 2; x++) s += usar((x + y) % 2 ? f2 : f1, x * cw + (cw - lado) / 2, y * cw + (cw - lado) / 2, lado, lado, rots[(x + y * 3) % 4], fig);
    }
    return s + "</svg>";
  }

  /* --- Filas ---------------------------------------------------------------- */
  var BAJAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v13M6 13l6 6 6-6"/></svg>';
  var vista = "lista";
  try { vista = localStorage.getItem("documentos-vista") || "lista"; } catch (e) {}
  if (["compacta", "lista", "mini"].indexOf(vista) === -1) vista = "lista";
  var sinEntrada = false;
  /* Al cambiar de sección la lista es otra: las filas de la primera tanda entran una detrás de otra (pf-entra-sec, con su orden en
     --i). Al filtrar o al bajar se mantiene el fundido quieto de siempre. */
  var entradaSeccion = false;
  function fila(d, i) {
    var q = plano(estado.q.trim());
    var li = document.createElement("li");
    li.className = "pf-doc" + (sinEntrada ? " pf-quieta" : entradaSeccion ? " pf-entra-sec" : "");
    if (entradaSeccion && !sinEntrada) li.style.setProperty("--i", Math.min(i || 0, 14));
    li.dataset.k = d.k;
    var bajar = d.l ? 'href="' + esc(/^https?:\/\//.test(d.l) ? d.l : BASE + "pdf/" + encodeURIComponent(d.l)) + '" download' : 'href="' + esc(d.u) + '" target="_blank" rel="noopener"';
    li.innerHTML = (vista === "mini" ? '<div class="pf-doc__arte">' + arte(d) + "</div>" : "") + etq(d.c, vista === "mini" ? "" : "").replace('class="pf-etiqueta"', 'class="pf-etiqueta" title="' + POR[d.c].nombre + '"') +
      '<h2 class="pf-doc__t"' + (vista === "compacta" ? ' title="' + esc(d.t) + '"' : "") + '><a href="' + BASE + encodeURIComponent(d.id) + '/">' + resaltar(d.t, q) + "</a></h2>" +
      '<span class="pf-doc__y">' + (d.y || "") + "</span>" +
      '<a class="pf-doc__d" ' + bajar + ' aria-label="Descargar PDF: ' + esc(d.t) + '">' + BAJAR + "</a>";
    return li;
  }
  /* Tarjetas (secciones de accesos): el arte de Formas de las miniaturas arriba, la etiqueta, el título, la bajada y lo que hace al
     final. Toda la tarjeta es el enlace; la de un PDF lleva al visor y suma la descarga. "pronto" no es enlace: queda apagada. */
  var IR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 12h10M13 8l4 4-4 4"/></svg>';
  var AFUERA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 16 16 8M9 8h7v7"/></svg>';
  var TIPOS = {
    form: { nombre: "Alta", forma: "industria", f: fam("amarillo") },
    doc: { nombre: "Documento", forma: "escudo", f: fam("azul") },
    portal: { nombre: "Portal", forma: "capas", f: fam("verde") },
    pronto: { nombre: "Próximamente", forma: "sol", f: fam("naranja", true) }
  };
  function tarjeta(x, i, q) {
    var li = document.createElement("li"), tipo = TIPOS[x.tipo] || TIPOS.portal, pronto = x.tipo === "pronto";
    li.className = "pf-acc pf-acc--" + x.tipo + (entradaSeccion ? " pf-entra-sec" : "");
    if (entradaSeccion) li.style.setProperty("--i", i);
    var href = x.tipo === "doc" ? BASE + encodeURIComponent(x.id) + "/" : x.href;
    var fuera = x.tipo === "form" || x.tipo === "portal";
    var dentro = '<span class="pf-acc__arte">' + arte({ c: "proveedores", k: x.k != null ? x.k : i + 3 }).replace("<svg ", '<svg preserveAspectRatio="xMidYMid slice" ') + "</span>" +
      '<span class="pf-acc__txt">' + '<span class="pf-etiqueta" style="' + vars(tipo) + '">' + badge(tipo) + '<span class="pf-etiqueta__rotulo">' + tipo.nombre + "</span></span>" +
      '<span class="pf-acc__t">' + resaltar(x.t, q) + "</span>" + (x.b ? '<span class="pf-acc__b">' + resaltar(x.b, q) + "</span>" : "") + "</span>" +
      (pronto ? '<span class="pf-acc__pie"></span>' : '<span class="pf-acc__ir">' + esc(x.ir || "Acceder") + (fuera ? AFUERA : IR) + "</span>");
    li.innerHTML = pronto ? '<div class="pf-acc__a" aria-disabled="true">' + dentro + "</div>"
      : '<a class="pf-acc__a" href="' + esc(href) + '"' + (fuera ? ' target="_blank" rel="noopener"' : "") + ">" + dentro + "</a>" +
        (x.tipo === "doc" && x.l ? '<a class="pf-doc__d pf-acc__d" href="' + esc(BASE + "pdf/" + encodeURIComponent(x.l)) + '" download aria-label="Descargar PDF: ' + esc(x.t) + '">' + BAJAR + "</a>" : "");
    return li;
  }
  function pintarTarjetas() {
    var ul = $("pf-tarjetas"); if (!ul) return;
    var q = plano(estado.q.trim()), f = document.createDocumentFragment();
    ul.innerHTML = "";
    if (TARJ) tarjLista.forEach(function (x, i) { f.appendChild(tarjeta(x, i, q)); });
    ul.appendChild(f);
  }
  function pintarIntro() {
    var el = $("pf-sec-intro"); if (!el) return;
    var s = seccion || {}, h = s.intro ? "<p>" + esc(s.intro) + "</p>" : "";
    if (s.accion) h += '<a class="pf-boton' + (s.accion.verde ? " pf-boton--verde" : "") + '" href="' + esc(s.accion.href) + '"' + (s.accion.descarga ? " download" : "") + ">" + (s.accion.descarga ? BAJAR : "") + esc(s.accion.texto) + "</a>";
    el.innerHTML = h; el.hidden = !h;
  }
  function cuantos() { return TARJ ? tarjLista.length : lista.length; }
  function pintarTanda() {
    var hasta = Math.min(pintadas + TANDA, lista.length), f = document.createDocumentFragment();
    for (var i = pintadas; i < hasta; i++) f.appendChild(fila(lista[i], i));
    docs.appendChild(f);
    pintadas = hasta;
  }
  function repintar(mantener) {
    // Al cambiar de vista se mantiene lo ya cargado (si no, la lista se acorta de golpe y se pierde el lugar).
    var objetivo = mantener ? Math.max(pintadas, TANDA) : TANDA;
    // Mientras se rehace, la lista queda vacía un instante: Safari mide ahí, ve una página corta y recorta el scroll (sin anclaje de
    // scroll, no lo recupera). La lista guarda su alto hasta terminar y el scroll vuelve a donde estaba.
    var y = window.scrollY;
    docs.style.minHeight = docs.offsetHeight + "px";
    docs.dataset.vista = vista;
    docs.innerHTML = ""; pintadas = 0;
    while (pintadas < Math.min(objetivo, lista.length)) pintarTanda();
    pintarTarjetas();
    $("pf-empty").hidden = cuantos() > 0;
    $("pf-filters").classList.toggle("pf-vacio", !lista.length);
    docs.style.minHeight = "";
    entradaSeccion = false;
    if (window.scrollY !== y) saltar(y);
  }

  /* --- Filtros ------------------------------------------------------------
     Las opciones salen de la portada de la Biblioteca Virtual, en su orden. Las que no tienen ningún documento en la Biblioteca no se
     muestran; al final de cada grupo va "Sin clasificar". El panel se arma una vez y después solo se actualiza (estado, conteos y
     atenuadas), así el acordeón no pierde su animación ni el teclado su lugar. */
  var NOMBRE = {}, TOTAL = {}, POR_G = {};
  function prepararGrupos() {
  NOMBRE = {}; TOTAL = {}; POR_G = {};
  GRUPOS.forEach(function (g) {
    NOMBRE[g.id] = { sin: "Sin clasificar" }; TOTAL[g.id] = {};
    g.opciones.forEach(function (o) { NOMBRE[g.id][o.id] = o.nombre; });
    DOCS.forEach(function (d) {
      var vs = etiquetas(d, g.id);
      if (!vs.length) TOTAL[g.id][SIN] = (TOTAL[g.id][SIN] || 0) + 1;
      vs.forEach(function (v) { TOTAL[g.id][v] = (TOTAL[g.id][v] || 0) + 1; });
    });
    g.visibles = g.opciones.filter(function (o) { return TOTAL[g.id][o.id]; });
  });
  GRUPOS.forEach(function (g) { POR_G[g.id] = g; });
  // Sin grupos (Gobierno societario) no hay dock ni ancla: la página lo sabe por esta clase.
  document.documentElement.classList.toggle("pf-sin-filtros", !GRUPOS.length);
  }
  prepararGrupos();
  // Fuera de su grupo (chips y avisos) un nutriente se lee con su nombre de grupo: "S" solo no dice nada.
  function nombreOp(g, v) { return v === SIN ? POR_G[g].nombre + " sin clasificar" : (g === "nutriente" ? "Nutriente " : "") + NOMBRE[g][v]; }
  var abierto = null;   // el grupo abierto del acordeón
  var CHEVRON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 15 6-6 6 6"/></svg>';

  function opcion(g, o, extra) {
    // Año usa el chip de año del sistema; los demás grupos, la pastilla de filtro (cultivo en verde, zona y nutriente en azul).
    var chip = g.id === "anio";
    var cls = chip ? "pf-chip" : "pf-pastilla", st = !chip && g.id === "cultivo" ? ' style="--pc:var(--verde)"' : "";
    return '<button type="button" class="' + cls + (extra ? " " + extra : "") + '"' + st + ' data-f="op" data-g="' + g.id + '" data-v="' + o.id + '" aria-pressed="false">' +
      esc(o.nombre) + '<b class="' + (chip ? "pf-chip__n" : "pf-pastilla__n") + '"></b></button>';
  }
  function armarFiltros() {
    // Sin pastilla "Todos": que no haya filtros ya se ve en que ninguna pastilla lleva contador, y para sacarlos
    // están "Limpiar todo" arriba de la lista y "Limpiar filtros" en el panel.
    $("pf-fMain").innerHTML = GRUPOS.map(function (g) {
        return '<button type="button" class="pf-pastilla pf-pastilla--todas" data-abrir="' + g.id + '" aria-expanded="false" aria-controls="pf-fBody">' + g.nombre + '<b class="pf-f-n" hidden></b></button>';
      }).join("");
    $("pf-fGrupos").innerHTML = GRUPOS.map(function (g) {
      var h = "", subs = [], por = {};
      g.visibles.forEach(function (o) { var k = o.sub || ""; if (!por[k]) { por[k] = []; subs.push(k); } por[k].push(o); });
      subs.forEach(function (k) {
        var ops = por[k];
        if (g.id === "zona") {
          // La provincia va primero, separada de sus localidades.
          h += '<div class="pf-f-row">' + ops.map(function (o) { return opcion(g, o, o.provincia ? "pf-f-prov" : ""); }).join("") + "</div>";
        } else {
          h += '<div class="pf-f-sub">' + (k ? '<p class="pf-f-sub__t">' + esc(k) + "</p>" : "") + '<div class="pf-f-row">' + ops.map(function (o) { return opcion(g, o); }).join("") + "</div></div>";
        }
      });
      // Un grupo puede no tener "Sin clasificar" (g.sin === false): en el Legajo, Provincia no aplica a las nacionales.
      if (TOTAL[g.id][SIN] && g.sin !== false) h += '<div class="pf-f-row">' + opcion(g, { id: SIN, nombre: "Sin clasificar" }) + "</div>";
      return '<section class="pf-f-gr" data-grupo="' + g.id + '">' +
        '<button type="button" class="pf-f-gr__cab" data-grupo="' + g.id + '" aria-expanded="false" aria-controls="pf-fg-' + g.id + '">' +
        '<span class="pf-f-label">' + g.nombre + '</span><b class="pf-f-n" hidden></b><span class="pf-f-gr__res"></span>' + CHEVRON + "</button>" +
        '<div class="pf-f-gr__activos"></div>' +
        '<div class="pf-f-gr__cuerpo" id="pf-fg-' + g.id + '" role="group" aria-label="' + g.nombre + '"><div><div class="pf-f-gr__in">' + h + "</div></div></div></section>";
    }).join("");
  }
  /* Cambio de grupo animado, cuadro a cuadro. Tres reglas:
     1. El encabezado que se toca no se escapa. Si el grupo que se cierra está arriba, el encabezado subiría de golpe
        todo su alto y quedaría fuera de la vista. Acá el scroll del panel lo acompaña: se queda donde estaba o, si el
        grupo no entra abajo, sube con el mismo resorte lo justo para mostrar lo más posible.
     2. Solo se anima lo que se ve. Un grupo más alto que el panel (Zona, 1.360 px en un celular) crece hasta el borde
        de abajo y el resto aparece al final, fuera de la vista. Así la velocidad no depende del largo del grupo.
     3. Se puede interrumpir: cada cambio arranca de los altos que hay en pantalla en ese momento.
     El resorte es el mismo de --f-curva (k = 8,38 es su respuesta de 0,45 s llevada a 0-1). Dura --f-acordeon más
     un poco según el recorrido visible, sin pasar --f-abrir. */
  var acordeon = null;
  function resorte(u) { var k = 8.38; return u >= 1 ? 1 : (1 - (1 + k * u) * Math.exp(-k * u)) / (1 - (1 + k) * Math.exp(-k)); }
  function cortarAcordeon() {
    if (!acordeon) return;
    cancelAnimationFrame(acordeon.raf);
    acordeon.cuerpos.forEach(function (c) { c.style.height = c.style.gridTemplateRows = c.style.visibility = c.style.overflow = c.firstElementChild.style.cssText = ""; });
    var rr = document.getElementById("pf-fRelleno"); if (rr) rr.style.height = "";
    document.querySelectorAll(".pf-f-gr__activos").forEach(function (f) { f.style.display = ""; });
    acordeon = null;
  }
  // Con Zona abierta y bajada hasta el fondo, al cerrarla queda menos contenido del que hace falta para sostener el encabezado
  // tocado en su lugar: el scroll se topaba, todo saltaba de golpe en el primer cuadro y Safari mostraba el tramo vacío.
  // Un relleno al final del panel cubre lo que falta en el primer cuadro y se va achicando con el avance (p): el panel se
  // encoge parejo durante el cambio, sin salto al empezar ni al terminar.
  function sostener(sc, want, p, este) {
    var r = document.getElementById("pf-fRelleno");
    if (!r) { r = document.createElement("div"); r.id = "pf-fRelleno"; r.setAttribute("aria-hidden", "true"); sc.appendChild(r); }
    var falta = want - (sc.scrollHeight - r.offsetHeight - sc.clientHeight);
    if (este.falta == null) este.falta = Math.max(0, Math.ceil(falta));
    r.style.height = Math.max(0, Math.min(falta, este.falta * (1 - p))) + "px";
    sc.scrollTop = want;
  }
  function cambiarGrupo(g, ancla) {
    var sc = $("pf-fBody");
    var dur = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--f-acordeon")) || 260;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { cortarAcordeon(); abrirGrupo(g); return; }
    var grupos = [].slice.call(document.querySelectorAll(".pf-f-gr"));
    var cuerpos = grupos.map(function (el) { return el.querySelector(".pf-f-gr__cuerpo"); });
    var desde = cuerpos.map(function (c) { return c.offsetHeight; });
    if (acordeon) cancelAnimationFrame(acordeon.raf);
    ancla = ancla || (g && document.querySelector('.pf-f-gr[data-grupo="' + g + '"] .pf-f-gr__cab'));
    var arriba = function () { return ancla.getBoundingClientRect().top - sc.getBoundingClientRect().top; };
    var y0 = ancla ? arriba() : 0;
    // Altos fijos en lo que se ve ahora; recién después cambia el estado (las flechas y el fundido siguen en CSS).
    cuerpos.forEach(function (c, i) { c.style.gridTemplateRows = "1fr"; c.style.visibility = "visible"; c.style.overflow = "hidden"; c.style.height = desde[i] + "px"; });
    // Lo que no se ve de los grupos que se cierran se saca ya, sin que nada cambie en pantalla: lo de abajo del borde,
    // y lo de arriba compensando el scroll y pegando el contenido abajo (así lo visible queda quieto). Si no, un grupo
    // largo como Zona gasta la mitad del tiempo cerrando lo que no se ve y después cierra lo visible de golpe.
    var scR = sc.getBoundingClientRect();
    cuerpos.forEach(function (c, i) {
      if (!desde[i] || grupos[i].dataset.grupo === g) return;
      var r = c.getBoundingClientRect();
      var fueraArriba = Math.max(0, Math.min(desde[i], scR.top - r.top, sc.scrollTop));
      var fueraAbajo = Math.max(0, Math.min(desde[i] - fueraArriba, r.bottom - scR.bottom));
      if (!fueraArriba && !fueraAbajo) return;
      desde[i] -= fueraArriba + fueraAbajo;
      c.style.height = desde[i] + "px";
      if (fueraArriba) { var dentro = c.firstElementChild.style; dentro.display = "flex"; dentro.flexDirection = "column"; dentro.justifyContent = "flex-end"; sc.scrollTop -= fueraArriba; }
    });
    // Cerrado, el grupo muestra lo elegido (__activos) y al abrirse esa fila desaparece: el cuerpo arranca con su alto en vez
    // de 0, así el contenido no se achica de golpe en el primer cuadro (dejaba un vacío abajo del panel).
    var iAbre = g ? grupos.findIndex(function (el) { return el.dataset.grupo === g; }) : -1;
    var act = iAbre > -1 && !desde[iAbre] ? grupos[iAbre].querySelector(".pf-f-gr__activos").offsetHeight : 0;
    abrirGrupo(g);
    if (act) { desde[iAbre] = act; cuerpos[iAbre].style.height = act + "px"; }
    var hasta = grupos.map(function (el) { return el.classList.contains("pf-abierto") ? el.querySelector(".pf-f-gr__in").offsetHeight : 0; });
    // Al revés, el que se cierra termina en el alto de su fila de elegidos: la fila queda oculta mientras dura el cambio y
    // aparece al final en el mismo lugar (si no, aparecía de golpe y el panel saltaba antes de achicarse).
    grupos.forEach(function (el, i) {
      if (!desde[i] || hasta[i] || el.dataset.grupo === g) return;
      var fila = el.querySelector(".pf-f-gr__activos"), h = fila.offsetHeight;
      if (h) { fila.style.display = "none"; hasta[i] = h; }
    });
    // Lo que se ve del panel cuando llega a su alto máximo (con los grupos cerrados es más bajo y crece con ellos).
    // El max-height del panel es un porcentaje (calc(100% - 110px)) y el navegador lo devuelve sin resolver: se mide
    // poniéndolo como alto de una caja fija vacía.
    var fil = $("pf-filters"), regla = document.createElement("div");
    regla.style.cssText = "position:fixed;top:0;left:0;width:0;visibility:hidden;height:" + getComputedStyle(fil).maxHeight;
    document.body.appendChild(regla); var maxF = regla.offsetHeight; regla.remove();
    var vista = maxF ? sc.clientHeight + Math.max(0, maxF - fil.offsetHeight) : Infinity;
    var alto = ancla ? ancla.offsetHeight : 0;
    var abre = g ? grupos.findIndex(function (el) { return el.dataset.grupo === g; }) : -1;
    // Sube solo si arriba se cierra algo (si no, el encabezado no se mueve y el grupo abre debajo).
    var cierraArriba = abre > -1 && desde.some(function (h, i) { return i < abre && h > 0; });
    var yFin = y0;
    if (ancla && cierraArriba && ancla.dataset.grupo === g) {
      // Con el scroll en 0 el encabezado no puede quedar más abajo de su lugar en la lista: el destino se acota ahí.
      // Si no, el scroll toca el tope a mitad de camino y el encabezado cambia de ritmo de golpe.
      var yMax = arriba() + sc.scrollTop;
      for (var k = 0; k < abre; k++) yMax -= desde[k] - hasta[k];
      yFin = Math.min(yMax, Math.max(0, Math.min(y0, vista - alto - hasta[abre])));
    }
    var tope = Math.max(0, vista - Math.max(0, yFin) - alto);
    var meta = hasta.map(function (h, i) { return h > desde[i] ? Math.min(h, Math.max(desde[i], tope)) : h; });
    // El tiempo crece un poco con lo que se recorre a la vista (hasta el del panel): un cambio chico es rápido y uno
    // largo no tira los primeros cuadros a 100 px cada uno.
    var recorrido = Math.abs(y0 - yFin);
    meta.forEach(function (m, i) { recorrido = Math.max(recorrido, Math.abs(Math.min(m, vista, innerHeight) - Math.min(desde[i], vista, innerHeight))); });
    var tope_dur = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--f-abrir")) || 600;
    dur = Math.min(tope_dur, dur + recorrido * 0.4);
    // El fundido del contenido (CSS) acompaña el tiempo real del cambio: al cerrar se va en el primer 60 %, al abrir
    // aparece en todo el recorrido. Con un tiempo fijo, un grupo largo quedaba como una franja vacía que se achica.
    cuerpos.forEach(function (c, i) {
      c.firstElementChild.getAnimations().forEach(function (a) { a.effect.updateTiming({ duration: Math.round(hasta[i] > 0 ? dur : dur * 0.6) }); });
    });
    var t0 = performance.now();
    var este = acordeon = { cuerpos: cuerpos };
    (function cuadro(now) {
      if (acordeon !== este) return; // lo reemplazó otro cambio
      var u = Math.min(1, (now - t0) / dur), p = resorte(u);
      cuerpos.forEach(function (c, i) { c.style.height = (desde[i] + (meta[i] - desde[i]) * p) + "px"; });
      if (ancla) sostener(sc, sc.scrollTop + arriba() - (y0 + (yFin - y0) * p), p, este);
      if (u < 1) { este.raf = requestAnimationFrame(cuadro); return; }
      cortarAcordeon();
      if (ancla) sc.scrollTop += arriba() - yFin;
    })(t0);
  }
  function abrirGrupo(g) {
    abierto = g;
    document.querySelectorAll(".pf-f-gr").forEach(function (el) {
      var si = el.dataset.grupo === g;
      el.classList.toggle("pf-abierto", si);
      el.querySelector(".pf-f-gr__cab").setAttribute("aria-expanded", String(si));
    });
    document.querySelectorAll("#pf-fMain [data-abrir]").forEach(function (b) {
      b.setAttribute("aria-expanded", String(b.dataset.abrir === g && $("pf-filters").classList.contains("pf-abierto")));
    });
  }
  function pintarFiltros() {
    GRUPOS.forEach(function (g) {
      // Conteo de cada opción con los demás grupos y la búsqueda aplicados: lo que quedaría si se la suma.
      var cuenta = {};
      DOCS.forEach(function (d) {
        if (!pasa(d, g.id)) return;
        var vs = etiquetas(d, g.id);
        if (!vs.length) cuenta[SIN] = (cuenta[SIN] || 0) + 1;
        vs.forEach(function (v) { cuenta[v] = (cuenta[v] || 0) + 1; });
      });
      var ks = activos(estado.sel[g.id]);
      var sec = document.querySelector('.pf-f-gr[data-grupo="' + g.id + '"]');
      sec.querySelectorAll("[data-f='op']").forEach(function (b) {
        var v = b.dataset.v, n = cuenta[v] || 0, on = !!estado.sel[g.id][v];
        b.setAttribute("aria-pressed", String(on));
        b.classList.toggle("pf-cero", !n);
        if (!n && !on) b.setAttribute("aria-disabled", "true"); else b.removeAttribute("aria-disabled");
        b.lastElementChild.textContent = n;
      });
      // Cerrado, el grupo muestra lo elegido: en el resumen y como pastillas que se sacan tocándolas.
      var nombres = ks.map(function (k) { return k === SIN ? "Sin clasificar" : NOMBRE[g.id][k]; });
      sec.querySelector(".pf-f-gr__res").textContent = nombres.join(", ");
      var nb = sec.querySelector(".pf-f-gr__cab .pf-f-n"); nb.hidden = !ks.length; nb.textContent = ks.length;
      sec.querySelector(".pf-f-gr__activos").innerHTML = ks.map(function (k) {
        var o = { id: k, nombre: k === SIN ? "Sin clasificar" : NOMBRE[g.id][k] };
        return opcion(g, o).replace('aria-pressed="false"', 'aria-pressed="true" aria-label="Quitar el filtro ' + esc(nombreOp(g.id, k)) + '"').replace(/<b class="[^"]*"><\/b>/, X);
      }).join("");
      var bb = document.querySelector('#pf-fMain [data-abrir="' + g.id + '"] .pf-f-n'); bb.hidden = !ks.length; bb.textContent = ks.length;
    });
  }
  function nFiltros() { return GRUPOS.reduce(function (s, g) { return s + activos(estado.sel[g.id]).length; }, 0); }
  function resumen() {
    var q = estado.q.trim();
    var nf = nFiltros();
    var n = cuantos();
    var t = "<b>" + n + "</b> " + (n === 1 ? UNO : VARIOS);
    if (!q && !nf) t = NOMBRE_TODO + " · <b>" + n + "</b>";
    $("pf-resultText").innerHTML = t;
    $("pf-qCount").textContent = n;
    // En el celular el botón del dock dice cuántos filtros hay; abierto, muestra el resultado y cierra el panel.
    var nsub = esMobile.matches ? nf : 0;
    $("pf-fCount").hidden = nsub === 0; $("pf-fCount").textContent = nsub;
    $("pf-fTxt").textContent = esMobile.matches && $("pf-filters").classList.contains("pf-abierto")
      ? "Ver " + lista.length + " " + (lista.length === 1 ? UNO : VARIOS) : "Filtros";
    $("pf-fClear").hidden = nf === 0;
    activosChips(q);
    $("pf-emptyText").textContent = q
      ? "Nada coincide con «" + q + "»" + (nf ? " con esos filtros" : "") + ". Probá con otra palabra" + (GRUPOS.length ? " o limpiá los filtros." : ".")
      : "Ningún documento cumple esa combinación de filtros. Sacá alguno para ver más.";
  }
  // La selección vive en la dirección (#cultivo=…&zona=…&anio=…&nutriente=…&q=…&orden=anio): se puede compartir, y al volver del
  // visor la lista está como se dejó.
  var urlLista = false;
  function aUrl() {
    if (!urlLista) return;
    var p = seccion && seccion !== SECCIONES[0] ? [seccion.id] : [], q = estado.q.trim();
    GRUPOS.forEach(function (g) { var ks = activos(estado.sel[g.id]); if (ks.length) p.push(g.id + "=" + ks.join(",")); });
    if (q) p.push("q=" + encodeURIComponent(q));
    if (estado.orden === "anio") p.push("orden=anio");
    try { history.replaceState(null, "", p.length ? "#" + p.join("&") : location.pathname + location.search); } catch (e) {}
    // Los enlaces de la barra y del pie que apuntan a esta misma página no se tocan; el título sí dice la sección.
    if (seccion) document.title = seccion.nombre + " · " + PAG.titulo;
  }
  function aplicar() {
    // Con la lista más corta el scroll quedaría pegado al final: se vuelve al principio de los resultados.
    var bajo = window.scrollY > inicioLista();
    filtrar(); resumen(); pintarFiltros(); repintar(); aUrl(); despertar(700);
    if (bajo) saltar(inicioLista());
  }

  /* --- Chips de filtros activos --------------------------------------------------- */
  var X = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2 2l8 8M10 2 2 10"/></svg>';
  function activosChips(q) {
    var h = "";
    GRUPOS.forEach(function (g) {
      activos(estado.sel[g.id]).forEach(function (k) {
        var n = nombreOp(g.id, k);
        h += '<button type="button" class="pf-chip" aria-pressed="true" data-quitar="op" data-g="' + g.id + '" data-v="' + k + '" aria-label="Quitar el filtro ' + esc(n) + '">' + esc(n) + X + "</button>";
      });
    });
    if (q) h += '<button type="button" class="pf-chip" aria-pressed="true" data-quitar="q" aria-label="Quitar la búsqueda">«' + esc(q) + "»" + X + "</button>";
    if (h) h += '<button type="button" class="pf-activos__limpiar" data-quitar="todo">Limpiar todo</button>';
    $("pf-activos").innerHTML = h;
  }
  $("pf-activos").addEventListener("click", function (e) {
    var b = e.target.closest("[data-quitar]"); if (!b) return;
    var t = b.dataset.quitar;
    if (t === "todo") { limpiar(); return; }
    if (t === "op") delete estado.sel[b.dataset.g][b.dataset.v];
    else if (t === "q") { estado.q = ""; $("pf-q").value = ""; }
    aplicar();
  });

  /* --- Selector (indicador) -------------------------------------------------- */
  function moverInd(seg, animar) {
    var ind = seg.querySelector(".pf-selector__ind"), b = seg.querySelector('button[aria-pressed="true"]');
    if (!b || !b.offsetWidth) return;
    if (!animar) ind.classList.add("pf-quieto");
    ind.style.width = b.offsetWidth + "px";
    ind.style.transform = "translateX(" + b.offsetLeft + "px)";
    if (!animar) { void ind.offsetWidth; ind.classList.remove("pf-quieto"); }
  }
  function moverInds() { document.querySelectorAll(".pf-selector").forEach(function (s) { moverInd(s, false); }); }
  function ordenar(o) {
    estado.orden = o;
    $("pf-sortAz").setAttribute("aria-pressed", String(o === "az")); $("pf-sortAnio").setAttribute("aria-pressed", String(o === "anio"));
    moverInd(document.querySelector(".pf-selector.pf-orden"), true); aplicar();
  }
  function marcarVista(animar) {
    document.querySelectorAll(".pf-selector.pf-vista button").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.vista === vista)); });
    moverInd(document.querySelector(".pf-selector.pf-vista"), animar);
  }
  // Toda la tarjeta o fila es el enlace: un clic en cualquier parte (arte, etiqueta, año, espacios) abre el documento, sin depender de que el
  // enlace del título la cubra. Con Cmd/Ctrl/Mayús se abre en otra pestaña. El botón de descarga y el título siguen siendo lo que son.
  docs.addEventListener("click", function (e) {
    if (e.defaultPrevented || e.target.closest("a, button")) return;
    var li = e.target.closest(".pf-doc"), a = li && li.querySelector(".pf-doc__t a");
    if (!a) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey) window.open(a.href, "_blank", "noopener"); else a.click();
  });
  // Cambiar de vista: cada fila visible se arma en su lugar nuevo y se desliza desde donde estaba (solo traslación, sin estirarse ni
  // copias de la lista vieja). Las filas que no se veían antes aparecen directo en su lugar.
  document.querySelector(".pf-selector.pf-vista").addEventListener("click", function (e) {
    var b = e.target.closest("[data-vista]"); if (!b || b.dataset.vista === vista) return;
    vista = b.dataset.vista;
    try { localStorage.setItem("documentos-vista", vista); } catch (err) {}
    marcarVista(true);
    // Lo que tapa arriba: la barra azul o, si está a la vista, la fila fija de selectores.
    var tope = Math.max($("pf-top").offsetHeight, herrFija() && !herr.classList.contains("pf-escondida") ? herr.getBoundingClientRect().bottom : 0) + 8, alto = window.innerHeight, filas = docs.children, ref = null, antes = {};
    for (var i = 0; i < filas.length; i++) {
      var r = filas[i].getBoundingClientRect();
      if (r.bottom > tope && r.top < alto) { antes[filas[i].dataset.k] = r; if (!ref) ref = { k: filas[i].dataset.k, top: r.top }; }
    }
    // Lo que queda quieto: si el principio de la lista está a la vista, la página no se mueve (cada vista arranca unos px más arriba o
    // más abajo, y seguir a la primera fila corría el encabezado y el campo). Solo cuando ya se bajó dentro de la lista se mantiene en su
    // lugar la primera fila visible.
    if (docs.getBoundingClientRect().top >= tope) ref = null;
    sinEntrada = true; repintar(true); sinEntrada = false;
    var el = ref && docs.querySelector('[data-k="' + ref.k + '"]');
    if (el) saltar(Math.max(0, window.scrollY + el.getBoundingClientRect().top - ref.top));
    if (!docs.animate || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var nuevas = docs.children;
    for (var j = 0; j < nuevas.length; j++) {
      var o = antes[nuevas[j].dataset.k]; if (!o) continue;
      var n = nuevas[j].getBoundingClientRect(), dx = o.left - n.left, dy = o.top - n.top;
      if (!dx && !dy) continue;
      nuevas[j].animate([{ transform: "translate(" + dx + "px," + dy + "px)" }, { transform: "none" }], { duration: 380, easing: "cubic-bezier(.2,.8,.2,1)" });
    }
  });
  marcarVista(false);
  /* Cambiar de sección: otra lista en el mismo lugar. Se conservan la vista y la búsqueda; los filtros no (cada sección tiene los
     suyos). Si se estaba dentro de la lista, se vuelve a su principio. Las secciones son solapas que salen del borde de la hoja
     (la pieza "solapas" de base.css y componentes/solapas.js). */
  var solapas = $("pf-solapas") && PFSolapas.armar($("pf-solapas"), function (id) { if (irSeccion(id, true)) aplicar(); });
  function marcarSeccion(animar) { if (solapas) solapas.marcar(seccion.id, animar); }
  function irSeccion(id, animar) {
    var s = SECCIONES.filter(function (x) { return x.id === id; })[0];
    if (!s || s === seccion) return false;
    if (filtrosAbiertos()) abrirFiltros(false);
    usarSeccion(s); prepararDocs(); prepararGrupos();
    estado.sel = {}; GRUPOS.forEach(function (g) { estado.sel[g.id] = {}; });
    abierto = null;
    armarFiltros();
    pintarIntro();
    marcarSeccion(animar);
    entradaSeccion = !!animar;
    return true;
  }
  $("pf-sortAz").addEventListener("click", function () { ordenar("az"); });
  $("pf-sortAnio").addEventListener("click", function () { ordenar("anio"); });

  /* --- Buscador en la lupa ---------------------------------------------------- */
  esMobile.addEventListener("change", function () { resumen(); pintarFiltros(); });
  var tq;
  $("pf-q").addEventListener("input", function (e) { clearTimeout(tq); tq = setTimeout(function () { estado.q = e.target.value; aplicar(); }, 120); });
  function cerrarBusca() { $("pf-q").value = ""; estado.q = ""; aplicar(); abrirBusca(false); $("pf-goSearch").focus(); }
  $("pf-qClose").addEventListener("click", cerrarBusca);
  function abrirBusca(si) {
    $("pf-busca").classList.toggle("pf-abierto", si);
    $("pf-nav").classList.toggle("pf-buscando", si);
    $("pf-goSearch").setAttribute("aria-expanded", String(si));
    $("pf-q").tabIndex = si ? 0 : -1;
    $("pf-qClose").tabIndex = si ? 0 : -1;
    if (si) setTimeout(function () { $("pf-q").focus(); }, 60);
  }
  $("pf-goSearch").addEventListener("click", function () {
    var abierta = $("pf-busca").classList.contains("pf-abierto");
    if (!abierta) abrirBusca(true);
    else if (!$("pf-q").value) abrirBusca(false);
    else $("pf-q").focus();
  });
  $("pf-q").addEventListener("blur", function () { setTimeout(function () { if (!$("pf-q").value && document.activeElement !== $("pf-q")) abrirBusca(false); }, 180); });
  $("pf-q").addEventListener("keydown", function (e) { if (e.key === "Escape") cerrarBusca(); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "/" && document.activeElement !== $("pf-q") && !/^(input|textarea)$/i.test(document.activeElement.tagName)) { e.preventDefault(); abrirBusca(true); }
  });


  /* --- Selectores fijos (la lógica de la Sala de prensa) --------------------------------------------- */
  // La fila pasa a fixed cuando llega a la barra y vuelve a su lugar cuando baja. El hueco guarda su tamaño (la página no se mueve) y le
  // da a la fila su izquierda y su ancho.
  var herr = document.querySelector(".pf-herramientas"), herrLugar = document.createElement("div");
  herrLugar.className = "pf-herr-lugar";
  herr.parentNode.insertBefore(herrLugar, herr);
  function topFijo() { var v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--pf-barra-h")); return (isNaN(v) ? 76 : v) + 9; }
  var atada = !!(window.CSS && CSS.supports && CSS.supports("animation-timeline: scroll()")), recorrido = 0, anchoAntes = -1;
  function herrFija() { return enCel ? vuelve.fija() : atada ? window.scrollY >= recorrido - 1 : herr.classList.contains("pf-fija"); }
  /* En escritorio, donde el navegador lo soporta, la fila no se fija por JS: va siempre fixed y la mueve el navegador atada al
     scroll (CSS .pf-atada). Fijada por JS llegaba un cuadro tarde y se trababa justo al esconderse. El JS solo mide dónde empieza (y0),
     dónde queda (debajo de la barra) y cuánto recorre. */
  function atar() {
    if (enCel) return;
    if (anchoAntes !== window.innerWidth) {   // el tamaño natural de la fila solo cambia con el ancho de la ventana
      herr.classList.remove("pf-atada"); herrLugar.classList.remove("pf-activo"); herr.style.left = herr.style.width = "";
      var n = herr.getBoundingClientRect();
      herrLugar.style.width = n.width + "px"; herrLugar.style.height = n.height + "px";
      herrLugar.classList.add("pf-activo"); herr.classList.add("pf-atada");
      anchoAntes = window.innerWidth;
    }
    var r = herrLugar.getBoundingClientRect(), y0 = r.top + window.scrollY, T = topFijo();
    recorrido = Math.max(0, y0 - T);
    herr.style.left = r.left + "px"; herr.style.width = r.width + "px";
    herr.style.setProperty("--herr-desde", y0 + "px");
    herr.style.setProperty("--herr-hasta", T + "px");
    herr.style.setProperty("--herr-recorrido", recorrido + "px");
  }
  function mostrarHerr(si) { if (!enCel) herr.classList.toggle("pf-escondida", !si); }
  function soltarHerr() {
    herr.classList.remove("pf-fija"); herrLugar.classList.remove("pf-activo");
    herrLugar.style.width = herrLugar.style.height = herr.style.left = herr.style.width = "";
    mostrarHerr(true);
  }
  function fijarHerr() {
    if (enCel) return;
    var fija = herrFija(), r = (fija ? herrLugar : herr).getBoundingClientRect(), debe = r.top <= topFijo();
    if (debe === fija) return;
    if (!debe) { soltarHerr(); return; }
    herrLugar.style.width = r.width + "px"; herrLugar.style.height = r.height + "px"; herrLugar.classList.add("pf-activo");
    herr.style.left = r.left + "px"; herr.style.width = r.width + "px"; herr.classList.add("pf-fija");
  }
  /* Celular: la barra de vista va con su caja y vuelve al subir (PFBarraVista, en componentes/barra-vista.js). Lo de arriba (atar, fijarHerr) queda
     solo para escritorio. Al cruzar los 640 px (girar el teléfono, achicar la ventana) se pasa de un modo al otro. */
  var enCel = false, vuelveMarca = document.createElement("div"), filaResultado = document.querySelector(".pf-result-row");
  vuelveMarca.className = "pf-vuelve-marca";
  var vuelve = PFBarraVista.queVuelve(herr, vuelveMarca, topFijo);
  PFBarraVista.alPixel($("pf-hoja"), document.querySelector(".pf-campo-cab"));
  function modoHerr() {
    enCel = esMobile.matches;
    if (enCel) {
      herr.classList.remove("pf-atada", "pf-fija", "pf-escondida"); herrLugar.classList.remove("pf-activo");
      herrLugar.style.width = herrLugar.style.height = herr.style.left = herr.style.width = "";
      filaResultado.parentNode.insertBefore(vuelveMarca, filaResultado); filaResultado.parentNode.insertBefore(herr, filaResultado);
    } else {
      vuelve.apagar();
      if (vuelveMarca.parentNode) vuelveMarca.remove();
      filaResultado.insertBefore(herrLugar, null); filaResultado.insertBefore(herr, null);
      anchoAntes = -1;
      if (atada) atar(); else fijarHerr();
    }
  }
  modoHerr();
  esMobile.addEventListener("change", modoHerr);
  window.addEventListener("resize", function () { if (esMobile.matches !== enCel) modoHerr(); });   // por si el aviso de la media query no llega
  if (atada) {
    atar();
    window.addEventListener("resize", atar);
    // Si algo de arriba cambia de alto (la cabecera, la lista que crece, las fuentes), se vuelve a medir dónde empieza.
    if (window.ResizeObserver) new ResizeObserver(function () { atar(); }).observe(document.body);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { anchoAntes = -1; atar(); });
  } else {
    window.addEventListener("scroll", fijarHerr, { passive: true });
    window.addEventListener("resize", function () { if (herrFija()) soltarHerr(); fijarHerr(); });
    fijarHerr();
  }
  herr.addEventListener("focusin", function () { mostrarHerr(true); });
  // Saltos de scroll que hace la página (filtrar, cambiar de vista): no son del usuario, así que ni el dock ni la fila los leen como bajar o
  // subir (si no, al cambiar de vista la fila se escondía y el dock se achicaba).
  var hastaSinDir = 0;
  function saltar(y) {
    hastaSinDir = performance.now() + 150;
    mostrarHerr(true);
    window.scrollTo({ top: y, behavior: "instant" });
    if (enCel) vuelve.saltar();
  }

  /* --- Dock de filtros ---------------------------------------------------------- */
  // Mobile: el dock se achica al bajar y vuelve al subir (umbral para que el rebote no lo haga titilar).
  // La fila de selectores se esconde al bajar (solo cuando ya está fija) y vuelve al subir, con la misma lectura de dirección.
  var yAntes = window.scrollY;
  window.addEventListener("scroll", function () {
    var y = window.scrollY;
    if (performance.now() < hastaSinDir) { yAntes = y; return; }
    var dy = y - yAntes;
    if (Math.abs(dy) < 8) return;
    yAntes = y;
    var f = $("pf-filters"), abiertos = f.classList.contains("pf-abierto");
    var alFinal = y + window.innerHeight >= document.documentElement.scrollHeight - 4;
    if (enCel) vuelve.mover(dy);
    else mostrarHerr(!(dy > 0 && !alFinal && herrFija() && !abiertos && !$("pf-busca").classList.contains("pf-abierto")));
    if (!esMobile.matches || abiertos) { f.classList.remove("pf-chica"); return; }
    f.classList.toggle("pf-chica", dy > 0 && y > 40 && !alFinal);
  }, { passive: true });
  $("pf-filters").addEventListener("click", function (e) {
    var ab = e.target.closest("[data-abrir]");
    if (ab) {
      // Desde la barra: abre el panel en ese grupo; si ya estaba abierto ahí, lo cierra.
      var yaAbierto = $("pf-filters").classList.contains("pf-abierto");
      if (yaAbierto && abierto === ab.dataset.abrir) { abrirFiltros(false); return; }
      if (!yaAbierto) abrirFiltros(true, ab.dataset.abrir); else cambiarGrupo(ab.dataset.abrir);
      return;
    }
    var cab = e.target.closest(".pf-f-gr__cab");
    if (cab) { cambiarGrupo(abierto === cab.dataset.grupo ? null : cab.dataset.grupo, cab); return; }
    var b = e.target.closest("[data-f]"); if (!b) return;
    if (b.getAttribute("aria-disabled") === "true") return;
    var g = b.dataset.g, v = b.dataset.v;
    if (estado.sel[g][v]) delete estado.sel[g][v]; else estado.sel[g][v] = true;
    aplicar();
  });
  function limpiar() { GRUPOS.forEach(function (g) { estado.sel[g.id] = {}; }); estado.q = ""; $("pf-q").value = ""; aplicar(); }
  $("pf-fClear").addEventListener("click", limpiar);
  $("pf-emptyReset").addEventListener("click", limpiar);
  // El panel anima su alto en px: se mide el alto final (con el ancho final, sin transiciones y sin pintar),
  // se arranca desde el actual y al terminar queda en auto con scroll (.listo).
  var tListo;
  function abrirFiltros(si, grupo) {
    var f = $("pf-filters"), b = $("pf-fBody"), gr = $("pf-fGrupos");
    clearTimeout(tListo);
    cortarAcordeon();
    // Desktop: el min-width anima desde el ancho que tiene la barra cerrada (con o sin contadores en las pastillas).
    if (si && !f.classList.contains("pf-abierto")) f.style.setProperty("--f-w-cerrada", f.getBoundingClientRect().width + "px");
    var desde = b.offsetHeight, anchoAhora = b.firstElementChild.offsetWidth;
    // Cerrar lo que ya está cerrado (al cargar) no anima: si no, el ida y vuelta de la medición hace que la barra
    // se achique de 680 a su ancho cerrado al entrar a la página.
    var yaCerrada = !si && !f.classList.contains("pf-abierto");
    f.style.transition = b.style.transition = "none";
    f.classList.remove("pf-listo");
    f.classList.toggle("pf-abierto", si);
    b.style.height = "";
    // El grupo que va a quedar abierto se abre recién acá, con el contenido ya fijo al ancho del panel abierto y sin su propia
    // animación: el panel llega con su alto final. Si se abría antes, con el dock cerrado o compacto (104 px en el celular),
    // los chips se acomodaban en una columna angosta y Safari en iPhone se quedaba con el alto de esa fila del grupo: la
    // primera vez quedaba un hueco debajo de los chips que se iba al cerrar y volver a abrir.
    var hasta = 0, ancho = anchoAhora;
    if (si) {
      f.classList.add("pf-listo");
      ancho = b.clientWidth;
      b.firstElementChild.style.width = ancho + "px";
      gr.classList.add("pf-quieto");
      abrirGrupo(grupo || abierto || primerGrupo());
      // Con barras de scroll clásicas el grupo abierto puede sumar la barra: se vuelve a tomar el ancho.
      if (b.clientWidth !== ancho) { ancho = b.clientWidth; b.firstElementChild.style.width = ancho + "px"; }
      hasta = b.offsetHeight;
    }
    b.firstElementChild.style.width = ancho + "px";
    f.classList.remove("pf-listo");
    f.classList.toggle("pf-abierto", !si);
    b.style.height = desde + "px";
    void f.offsetWidth;
    if (!yaCerrada) f.style.transition = b.style.transition = "";
    f.classList.toggle("pf-abierto", si);
    b.style.height = hasta + "px";
    if (yaCerrada) { void f.offsetWidth; f.style.transition = b.style.transition = ""; }
    $("pf-fToggle").setAttribute("aria-expanded", String(si));
    gr.classList.remove("pf-quieto");
    abrirGrupo(abierto);
    resumen();
    var dur = parseFloat(getComputedStyle(document.documentElement).getPropertyValue(si ? "--f-abrir" : "--f-cerrar")) || 420;
    tListo = setTimeout(terminar, dur + 60);
  }
  function terminar() {
    var f = $("pf-filters");
    clearTimeout(tListo);
    $("pf-fBody").style.height = "";
    $("pf-fBody").firstElementChild.style.width = "";
    if (f.classList.contains("pf-abierto")) f.classList.add("pf-listo");
  }
  $("pf-fBody").addEventListener("transitionend", function (e) { if (e.target === this && e.propertyName === "height") terminar(); });
  $("pf-fToggle").addEventListener("click", function () { abrirFiltros(!$("pf-filters").classList.contains("pf-abierto")); });
  // Se cierra con el botón de la barra, con Escape y tocando afuera. El toque de afuera solo cierra: el clic que le sigue se descarta
  // para no abrir de rebote el documento que estaba debajo (el ancla queda afuera de esto: cierra y además baja).
  function filtrosAbiertos() { return $("pf-filters").classList.contains("pf-abierto"); }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && filtrosAbiertos() && !$("pf-busca").classList.contains("pf-abierto")) { abrirFiltros(false); $("pf-fToggle").focus(); }
  });
  var tCerroAfuera = -1e9;
  document.addEventListener("pointerdown", function (e) {
    if (!filtrosAbiertos() || $("pf-filters").contains(e.target) || $("pf-ancla").contains(e.target)) return;
    tCerroAfuera = performance.now();
    abrirFiltros(false);
  }, true);
  document.addEventListener("click", function (e) {
    if (performance.now() - tCerroAfuera > 700) return;
    tCerroAfuera = -1e9;
    e.preventDefault(); e.stopPropagation();
  }, true);
  // Al abrir el panel queda abierto el primer grupo con filtros elegidos; si no hay ninguno, Cultivo.
  function primerGrupo() {
    for (var i = 0; i < GRUPOS.length; i++) if (activos(estado.sel[GRUPOS[i].id]).length) return GRUPOS[i].id;
    return GRUPOS.length ? GRUPOS[0].id : null;
  }
  armarFiltros();
  abrirFiltros(false);

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (en) { if (en[0].isIntersecting && pintadas < lista.length) pintarTanda(); }, { rootMargin: "900px 0px" }).observe($("pf-sentinel"));
  } else { TANDA = 2000; }
  window.addEventListener("resize", moverInds);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(moverInds);
  moverInds();

  /* --- Ancla ----------------------------------------------------------------
     Una sola acción que cambia de sentido: arriba de la lista apunta abajo y baja una pantalla; más abajo
     apunta arriba y vuelve al principio de la lista. El rebote vive solo en el giro de la flecha. */
  var ancla = $("pf-ancla"), cuerpo = ancla.firstElementChild, flecha = cuerpo.firstElementChild;
  var quieto = matchMedia("(prefers-reduced-motion: reduce)");
  var raiz = getComputedStyle(document.documentElement);
  function tk(n) { return parseFloat(raiz.getPropertyValue("--" + n)); }
  var GAP = tk("ancla-gap"), APRETAR = tk("ancla-apretar"), BAJAR_P = tk("ancla-bajar"), CAMBIO = tk("ancla-cambio");
  function R(x, k, c) { return { x: x, v: 0, t: x, k: k, c: c }; }
  var M = {
    s: R(0, tk("ancla-aparecer-k"), tk("ancla-aparecer-c")),
    q: R(1, tk("ancla-apretar-k"), tk("ancla-apretar-c")),
    r: R(90, tk("ancla-giro-k"), tk("ancla-giro-c"))
  };
  function inicioLista() { return Math.max(0, document.querySelector("main").getBoundingClientRect().top + window.scrollY - $("pf-top").offsetHeight - 8); }
  // La flecha de la cabecera (campo.js) se ve hasta los 40 px de scroll: mientras tanto, ni dock ni ancla.
  function conFlecha() { return window.scrollY <= 40; }
  function marcarFlecha() { $("pf-filters").classList.toggle("pf-arriba", conFlecha()); }
  window.addEventListener("scroll", marcarFlecha, { passive: true });
  marcarFlecha();
  function arriba() { return window.scrollY > inicioLista() + window.innerHeight * CAMBIO; }
  function medir() {
    var r = $("pf-filters").getBoundingClientRect();
    M.s.t = !lista.length || conFlecha() ? 0 : 1;
    var sube = arriba();
    M.r.t = sube ? -90 : 90;
    ancla.setAttribute("aria-label", sube ? "Volver al principio de la lista" : "Bajar");
    ancla.tabIndex = M.s.t ? 0 : -1;
    if (!esMobile.matches) document.documentElement.style.setProperty("--ancla-x", (r.right + GAP).toFixed(2) + "px");
  }
  function paso(s, dt) { var ac = -s.k * (s.x - s.t) - s.c * s.v; s.v += ac * dt; s.x += s.v * dt; }
  // El bucle corre solo mientras algo se mueve: se duerme cuando los resortes llegaron y lo despiertan el scroll, el tamaño de la
  // ventana, los filtros (el dock cambia de ancho) y el dedo. En reposo la página no mide ni pinta nada.
  var tAntes = 0, corriendo = false, hasta = 0;
  function enReposo() { for (var k in M) if (Math.abs(M[k].x - M[k].t) > 0.001 || Math.abs(M[k].v) > 0.001) return false; return true; }
  function anim(now) {
    var dt = tAntes ? Math.min(0.05, (now - tAntes) / 1000) : 0.016; tAntes = now;
    medir();
    if (quieto.matches) { for (var k in M) { M[k].x = M[k].t; M[k].v = 0; } }
    else { var n = Math.ceil(dt / 0.004); for (var j = 0; j < n; j++) for (var k2 in M) paso(M[k2], dt / n); }
    ancla.style.transform = "scale(" + (Math.max(0, M.s.x) * M.q.x).toFixed(4) + ")";
    flecha.style.transform = "rotate(" + M.r.x.toFixed(2) + "deg)";
    if (now < hasta || !enReposo()) requestAnimationFrame(anim);
    else { corriendo = false; tAntes = 0; }
  }
  despertar = function (ms) {
    hasta = Math.max(hasta, performance.now() + (ms || 0));
    if (!corriendo) { corriendo = true; requestAnimationFrame(anim); }
  };
  despertar(900);
  window.addEventListener("scroll", function () { despertar(200); }, { passive: true });
  window.addEventListener("resize", function () { despertar(700); });
  $("pf-filters").addEventListener("click", function () { despertar(900); });
  $("pf-filters").addEventListener("transitionend", function () { despertar(120); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { despertar(300); });
  ancla.addEventListener("pointerdown", function () { M.q.t = APRETAR; despertar(); });
  function soltarAncla() { M.q.t = 1; despertar(); }
  ancla.addEventListener("pointerup", soltarAncla);
  ancla.addEventListener("pointercancel", soltarAncla);
  ancla.addEventListener("pointerleave", soltarAncla);
  ancla.addEventListener("click", function () {
    if ($("pf-filters").classList.contains("pf-abierto")) abrirFiltros(false);
    var suave = quieto.matches ? "auto" : "smooth";
    if (arriba()) window.scrollTo({ top: inicioLista(), behavior: suave });
    else window.scrollBy({ top: Math.round(window.innerHeight * BAJAR_P), behavior: suave });
  });

  // La dirección trae la selección: #buscar abre el buscador; #cultivo=avena, #zona=pergamino,balcarce, #anio=2011, #nutriente=n,
  // #q=texto y #orden=anio se pueden combinar con &. Una opción que no existe se ignora.
  var pedido = location.hash.slice(1), conBusca = pedido === "buscar";
  // Con secciones, la que se pide va sola al principio (#titulos-de-deuda&q=moody) y se elige antes que los filtros.
  var conSeccion = false;
  pedido.split("&").forEach(function (par) { if (par.indexOf("=") < 0 && irSeccion(par, false) !== undefined) conSeccion = SECCIONES.some(function (s) { return s.id === par; }) || conSeccion; });
  // Una búsqueda que llega sin sección (desde el buscador del sitio) abre la primera sección donde encuentra algo.
  var qPedida = (pedido.match(/(?:^|&)q=([^&]*)/) || [])[1];
  if (SECCIONES.length && !conSeccion && qPedida) {
    var qp = ""; try { qp = plano(decodeURIComponent(qPedida).trim()); } catch (e) {}
    var con = SECCIONES.filter(function (s) {
      return (s.docs || []).some(function (d) { return plano([d.t, POR[d.c].nombre, d.y].join(" ")).indexOf(qp) !== -1; }) ||
        (s.tarjetas || []).some(function (x) { return plano([x.t, x.b || ""].join(" ")).indexOf(qp) !== -1; });
    })[0];
    if (con) irSeccion(con.id, false);
  }
  marcarSeccion(false);
  pintarIntro();
  pedido.split("&").forEach(function (par) {
    var i = par.indexOf("="); if (i < 1) return;
    var k = par.slice(0, i), v = par.slice(i + 1);
    try { v = decodeURIComponent(v); } catch (e) {}
    if (POR_G[k]) v.split(",").forEach(function (o) { if (o === SIN ? TOTAL[k][SIN] : NOMBRE[k][o] && TOTAL[k][o]) estado.sel[k][o] = true; });
    else if (k === "q" && v) { $("pf-q").value = estado.q = v; conBusca = true; }
    else if (k === "orden" && v === "anio") estado.orden = "anio";
  });
  if (estado.orden === "anio") { $("pf-sortAz").setAttribute("aria-pressed", "false"); $("pf-sortAnio").setAttribute("aria-pressed", "true"); moverInds(); }
  aplicar();
  urlLista = true;
  if (conBusca) abrirBusca(true);
})();
