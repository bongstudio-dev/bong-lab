
(function () {
  "use strict";

  /* Datos reales de la Sala de prensa del sitio actual (prep-prensa.py → prensa.json):
     gacetillas (título y fecha del PDF, tipo, copia en ../biblioteca/pdf/ y foto si tiene), galerías de fotos, logos y contacto. */
  var P = /*__PRENSA__*/{};
  var A = /*__ASSETS__*/{};
  var $ = function (id) { return document.getElementById(id); };
  window.PF_CAMPO = { formas: A.formas, color: "azul", forma: "escudo", tema: ["escudo", "circulos", "urea"], cab: "pf-cab", main: "pf-hoja", columna: "pf-lista" };

  // Barra transparente al cargar; toma el azul apenas se baja, cuando la caja de la cabecera llega a la barra.
  var barraSolida = function () { var t = $("pf-top"); t.classList.toggle("pf-barra--solida", window.scrollY > 0 && $("pf-cab").getBoundingClientRect().top <= t.offsetHeight); };
  window.addEventListener("scroll", barraSolida, { passive: true });
  window.addEventListener("resize", barraSolida);
  barraSolida();

  PFBarraVista.alPixel($("pf-hoja"), $("pf-cab"));   // la fila empieza en un píxel entero (ver componentes/barra-vista.js)

  var defs = $("pf-defs"), simbolos = "";
  Object.keys(A.formas).forEach(function (k) { simbolos += '<symbol id="pf-forma-' + k + '" viewBox="' + A.formas[k].vb + '">' + A.formas[k].d + "</symbol>"; });
  defs.insertAdjacentHTML("beforeend", simbolos);

  /* Etiquetas: las de Novedades para esos tipos (Institucional → Gacetilla; Aviso a la comunidad). */
  var FAM = {
    azul: { bg: "#003DA5", fo: "#4086FF", tx: "#003DA5" },
    amarillo: { bg: "#EABA2C", fo: "#E57F19", tx: "#E57F19" }
  };
  var CATS = { gacetilla: { nombre: "Gacetilla", forma: "escudo", f: FAM.azul }, aviso: { nombre: "Aviso a la comunidad", corto: "Aviso comunidad", forma: "casco", f: FAM.amarillo } };
  function etq(id) {
    var x = CATS[id];
    return '<span class="pf-etiqueta" style="--eb:' + x.f.bg + ";--fo:" + x.f.fo + ";--tx:" + x.f.tx + '">' +
      '<svg class="pf-etiqueta__badge" viewBox="0 0 100 100" aria-hidden="true"><use href="#pf-badge-bg" width="100" height="100" fill="' + x.f.bg + '"/>' +
      '<use href="#pf-forma-' + x.forma + '" x="21" y="21" width="58" height="58" fill="' + x.f.fo + '"/></svg><span class="pf-etiqueta__rotulo">' + (x.corto ? '<span class="pf-etiqueta__largo">' + x.nombre + '</span><span class="pf-etiqueta__corto">' + x.corto + "</span>" : x.nombre) + "</span></span>";
  }

  function plano(s) { return String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function resaltar(texto, q) {
    if (!q) return esc(texto);
    var norm = "";
    for (var i = 0; i < texto.length; i++) norm += plano(texto[i]).charAt(0) || texto[i];
    var out = "", desde = 0, at;
    while ((at = norm.indexOf(q, desde)) !== -1) { out += esc(texto.slice(desde, at)) + "<mark>" + esc(texto.slice(at, at + q.length)) + "</mark>"; desde = at + q.length; }
    return out + esc(texto.slice(desde));
  }
  var MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  var MES_C = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  var BAJAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v13M6 13l6 6 6-6"/></svg>';
  var MAIL = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7 8 6 8-6"/></svg>';
  var TEL = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 3.5h3l1.5 4-2 1.3a11 11 0 0 0 6.1 6.1l1.3-2 4 1.5v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2z"/></svg>';

  /* --- Contacto ------------------------------------------------------------- */
  var COPIAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="3"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>';
  var PERS = P.contacto.personas;
  $("pf-personas").innerHTML = PERS.map(function (p) {
    var cara = p.foto ? '<img class="pf-persona__cara" src="' + esc(p.foto) + '" alt="" width="44" height="44" decoding="async">' : "";
    return '<li class="pf-persona">' + cara + '<div class="pf-persona__txt"><b>' + esc(p.nombre) + "</b><span>" + esc(p.cargo) + '</span><a href="mailto:' + esc(p.mail) + '">' + esc(p.mail) + "</a></div>" +
      '<button type="button" class="pf-copiar" data-copiar="' + esc(p.mail) + '" aria-label="Copiar el mail de ' + esc(p.nombre) + '">' + COPIAR + "</button></li>";
  }).join("");
  $("pf-ct-caras").innerHTML = PERS.filter(function (p) { return p.foto; }).map(function (p) { return '<img src="' + esc(p.foto) + '" alt="" width="28" height="28" decoding="async">'; }).join("");
  $("pf-ct-nombres").textContent = PERS.map(function (p) { return p.nombre; }).join(" y ").replace(/ y (?=.* y )/g, ", ");
  function dato(href, icono, texto, etiqueta) {
    return '<span class="pf-dato"><a href="' + href + '">' + icono + esc(texto) + '</a><button type="button" class="pf-copiar" data-copiar="' + esc(texto) + '" aria-label="Copiar ' + etiqueta + '">' + COPIAR + "</button></span>";
  }
  $("pf-area").innerHTML = dato("mailto:" + esc(P.contacto.mail), MAIL, P.contacto.mail, "el mail de prensa") +
    (P.contacto.telefono ? dato("tel:" + P.contacto.telefono.replace(/[^\d+]/g, ""), TEL, P.contacto.telefono, "el teléfono") : "");

  /* Copiar: aviso de la base (.pf-aviso). Si el navegador no deja copiar, el aviso muestra el dato para copiarlo a mano. */
  var aviso = document.createElement("div"); aviso.className = "pf-aviso"; aviso.setAttribute("role", "status"); document.body.appendChild(aviso);
  var avisoReloj;
  function avisar(t) { aviso.textContent = t; aviso.classList.add("pf-on"); clearTimeout(avisoReloj); avisoReloj = setTimeout(function () { aviso.classList.remove("pf-on"); }, 1800); }
  document.querySelector(".pf-contacto").addEventListener("click", function (e) {
    var b = e.target.closest("[data-copiar]"); if (!b) return;
    var t = b.getAttribute("data-copiar");
    var ok = function () { avisar(t.indexOf("@") > -1 ? "Mail copiado" : "Teléfono copiado"); };
    try { navigator.clipboard.writeText(t).then(ok, function () { avisar(t); }); } catch (err) { avisar(t); }
  });

  /* Desplegable del contacto: solo en el celular. En pantallas más anchas, abierto y el botón queda como título. */
  (function () {
    var cab = $("pf-ct-cab"), det = $("pf-ct-det"), mq = window.matchMedia("(max-width: 640px)");
    var corto = matchMedia("(prefers-reduced-motion: reduce)");
    function fin() { det.style.height = ""; }
    function poner(abre, animar) {
      cab.setAttribute("aria-expanded", String(abre));
      if (!animar || corto.matches) { det.hidden = !abre; fin(); return; }
      var desde = abre ? 0 : det.offsetHeight;
      det.hidden = false;
      var hasta = abre ? det.scrollHeight : 0;
      det.style.height = desde + "px"; det.offsetHeight; det.style.height = hasta + "px";
      var hecho = false, reloj;
      var listo = function (e) { if (hecho || (e && e.propertyName !== "height")) return; hecho = true; clearTimeout(reloj); det.removeEventListener("transitionend", listo); if (!abre) det.hidden = true; fin(); };
      det.addEventListener("transitionend", listo);
      reloj = setTimeout(listo, 450); /* por si la transición no corre (pestaña en segundo plano) */
    }
    function segunAncho() { cab.disabled = !mq.matches; poner(!mq.matches, false); }
    cab.addEventListener("click", function () { if (!cab.disabled) poner(cab.getAttribute("aria-expanded") !== "true", true); });
    if (mq.addEventListener) mq.addEventListener("change", segunAncho); else mq.addListener(segunAncho);
    segunAncho();
  })();

  /* --- Ítems de cada pestaña -------------------------------------------------- */
  var GAC = P.gacetillas.map(function (d, k) {
    var fecha = (d.dia ? d.dia + " de " : "") + MESES[d.m - 1] + " de " + d.y;
    return { k: k, d: d, t: d.t, fecha: fecha, corta: (d.dia ? d.dia + " " : "") + MES_C[d.m - 1] + " " + d.y,
      orden: d.f + "-" + ("0" + (d.dia || 0)).slice(-2), e: { tipo: [d.c], anio: [d.y] },
      buscable: plano([d.t, CATS[d.c].nombre, fecha].join(" ")) };
  }).sort(function (a, b) { return a.orden < b.orden ? 1 : a.orden > b.orden ? -1 : 0; });
  var FOTOS = [];
  P.galerias.forEach(function (g) {
    g.f.forEach(function (f, i) {
      FOTOS.push({ k: FOTOS.length, g: g, f: f, i: i + 1, de: g.f.length, e: { galeria: [g.id] }, buscable: plano(g.nombre + " foto") });
    });
  });
  var LOGOS = [];
  var NOMBRE_LOGO = { "Principal": "Principal", "Con Slogan": "Con slogan", "Monocromático": "Monocromático", "Simbolo": "Símbolo" };
  P.logos.forEach(function (g) {
    g.variantes.forEach(function (v) {
      var color = v.nombre.split(" ").pop();
      LOGOS.push({ k: LOGOS.length, nombre: NOMBRE_LOGO[g.nombre] || g.nombre, color: color, a: v.archivos, e: {},
        buscable: plano("logo " + g.nombre + " " + color) });
    });
  });

  var anios = []; GAC.forEach(function (x) { if (anios.indexOf(x.d.y) === -1) anios.push(x.d.y); });
  anios.sort().reverse();
  var TABS = {
    gacetillas: { items: GAC, uno: "gacetilla", varios: "gacetillas", todo: "Todas las gacetillas", grupos: [
      { id: "tipo", nombre: "Tipo", opciones: [{ id: "gacetilla", nombre: "Gacetilla", pc: "var(--azul)" }, { id: "aviso", nombre: "Aviso a la comunidad", pc: "var(--amarillo)" }] },
      { id: "anio", nombre: "Año", chip: true, opciones: anios.map(function (y) { return { id: y, nombre: y }; }) }
    ] },
    fotos: { items: FOTOS, uno: "foto", varios: "fotos", todo: "Todas las fotos", grupos: [
      { id: "galeria", nombre: "Galería", opciones: P.galerias.map(function (g) { return { id: g.id, nombre: g.nombre }; }) }
    ] },
    logos: { items: LOGOS, uno: "versión", varios: "versiones", todo: "Todas las versiones del logo", grupos: [] }
  };
  Object.keys(TABS).forEach(function (t) {
    TABS[t].sel = {};
    TABS[t].grupos.forEach(function (g) { TABS[t].sel[g.id] = {}; });
  });

  /* --- Estado y filtro (la regla de la Biblioteca: dentro de un grupo suman, entre grupos se cruzan) --------- */
  var tab = "gacetillas", q = "", lista = [];
  var esMobile = window.matchMedia("(max-width: 640px)");
  var quieto = matchMedia("(prefers-reduced-motion: reduce)");
  function T() { return TABS[tab]; }
  function activos(o) { return Object.keys(o).filter(function (k) { return o[k]; }); }
  function pasa(x, salvo) {
    var qq = plano(q.trim());
    if (qq && x.buscable.indexOf(qq) === -1) return false;
    var gs = T().grupos;
    for (var i = 0; i < gs.length; i++) {
      var g = gs[i].id; if (g === salvo) continue;
      var ks = activos(T().sel[g]);
      if (ks.length && !ks.some(function (k) { return (x.e[g] || []).indexOf(k) !== -1; })) return false;
    }
    return true;
  }

  /* --- Arte de miniatura: el de la Biblioteca (las Formas del sistema sobre un par de color distinto al de la etiqueta, figura sobre
     fondo). Es determinista: cada gacetilla siempre tiene el mismo. Las que traen foto usan la foto. */
  function rnd32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  var FORMAS_CAT = { gacetilla: ["escudo", "industria", "urea"], aviso: ["casco", "circulos", "sol"] };
  var PARES = { azul: ["#003DA5", "#4086FF"], verde: ["#2D8035", "#5EB53A"], amarillo: ["#EABA2C", "#E57F19"], naranja: ["#E57F19", "#8A4818"] };
  var PARES_CONTRA = { gacetilla: ["verde", "amarillo", "naranja"], aviso: ["azul", "verde"] };
  function usar(f, x, y, w, h, rot, color) {
    var cx = x + w / 2, cy = y + h / 2;
    return '<g transform="rotate(' + rot + " " + cx + " " + cy + ')"><use href="#pf-forma-' + f + '" x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + color + '"/></g>';
  }
  function arte(x) {
    var d = x.d;
    if (d.fm) return '<img src="' + esc(d.fm) + '" alt="" loading="lazy" decoding="async">';
    var W = 240, H = 240, r = rnd32(x.k * 7919 + 13);
    var op = PARES_CONTRA[d.c], par = PARES[op[x.k % op.length]];
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
      for (var yy = 0; yy < 2; yy++) for (var xx = 0; xx < 2; xx++) s += usar((xx + yy) % 2 ? f2 : f1, xx * cw + (cw - lado) / 2, yy * cw + (cw - lado) / 2, lado, lado, rots[(xx + yy * 3) % 4], fig);
    }
    return s + "</svg>";
  }

  /* --- Pintar ------------------------------------------------------------------ */
  // Vistas de las gacetillas (las de la Biblioteca) y tamaño de las fotos (el de Novedades); cada una se recuerda en este navegador.
  function leerVista(clave, ok, def) { var v = def; try { v = localStorage.getItem(clave) || def; } catch (e) {} return ok.indexOf(v) === -1 ? def : v; }
  var vista = leerVista("prensa-vista", ["compacta", "lista", "mini"], "lista");
  var tamFotos = leerVista("prensa-fotos-vista", ["chico", "medio", "grande"], "medio");
  // En escritorio no están las del medio: lista pasa a compacta y medianas a grandes (sin tocar lo guardado para el celular).
  function vistasDeEscritorio() {
    if (esMobile.matches) return false;
    var cambio = false;
    if (vista === "lista") { vista = "compacta"; cambio = true; }
    if (tamFotos === "medio") { tamFotos = "grande"; cambio = true; }
    return cambio;
  }
  vistasDeEscritorio();
  var sinEntrada = false;   // al cambiar de vista o de pestaña las filas nacen sin su entrada
  function filaGacetilla(x) {
    var d = x.d, qq = plano(q.trim());
    var bajar = d.l ? 'href="../biblioteca/pdf/' + encodeURIComponent(d.l) + '" download' : 'href="' + esc(d.u) + '" target="_blank" rel="noopener"';
    return '<li class="pf-doc' + (sinEntrada ? " pf-quieta" : "") + '" data-k="' + x.k + '">' + (vista === "mini" ? '<div class="pf-doc__arte">' + arte(x) + "</div>" : "") +
      etq(d.c).replace('class="pf-etiqueta"', 'class="pf-etiqueta" title="' + CATS[d.c].nombre + '"') +
      '<h2 class="pf-doc__t"' + (vista === "compacta" ? ' title="' + esc(x.t) + '"' : "") + '><a href="../biblioteca/' + encodeURIComponent(d.id) + '/">' + resaltar(x.t, qq) + "</a></h2>" +
      '<span class="pf-doc__y"><time datetime="' + d.f + (d.dia ? "-" + ("0" + d.dia).slice(-2) : "") + '" title="' + x.fecha + '">' + x.corta + "</time></span>" +
      '<a class="pf-doc__d" ' + bajar + ' aria-label="Descargar PDF: ' + esc(x.t) + '">' + BAJAR + "</a></li>";
  }
  function fotoSrc(x, grande) { return "fotos/" + x.g.id + "/" + x.f.n + (grande ? "" : "-mini") + ".webp"; }
  // Al cambiar de vista la foto no queda en gris mientras baja la grande: muestra la miniatura (ya cargada) y la cambia al llegar.
  function imgSrc(x) {
    var grande = $("pf-lista").clientWidth / nCols > 380;
    if (sinEntrada && grande) return ' src="' + fotoSrc(x, false) + '" data-grande="' + fotoSrc(x, true) + '"';
    return ' src="' + fotoSrc(x, grande) + '"';
  }
  function tileFoto(x, j) {
    var conGal = !activos(T().sel.galeria).length || activos(T().sel.galeria).length > 1;
    return '<li class="pf-fo' + (sinEntrada ? " pf-quieta" : "") + '" data-k="' + x.k + '"><button class="pf-fo__b" type="button" data-j="' + j + '" aria-label="Ver ' + esc(x.g.nombre) + ", foto " + x.i + " de " + x.de + '">' +
      '<img' + (sinEntrada ? ' class="pf-lista"' : "") + imgSrc(x) + ' width="' + x.f.mi[0] + '" height="' + x.f.mi[1] + '" loading="lazy" decoding="async" alt="' + esc(x.g.nombre) + ", foto " + x.i + '"></button>' +
      '<a class="pf-doc__d pf-fo__d" href="' + esc(x.f.u) + '" download target="_blank" rel="noopener" aria-label="Descargar la foto original">' + BAJAR + "</a>" +
      (conGal ? '<span class="pf-fo__g">' + esc(x.g.nombre) + "</span>" : "") + "</li>";
  }
  // Columnas según el ancho y el tamaño elegido, como las tarjetas de Novedades.
  function columnasFotos() {
    var w = $("pf-lista").clientWidth;
    if (w < 700) return { chico: 3, medio: 2, grande: 1 }[tamFotos];
    if (w < 1000) return { chico: 4, medio: 3, grande: 2 }[tamFotos];
    return { chico: 6, medio: 4, grande: 3 }[tamFotos];
  }
  var nCols = 0;
  function repartirFotos() {
    nCols = columnasFotos();
    var cols = [], alto = [];
    for (var c = 0; c < nCols; c++) { cols.push(""); alto.push(0); }
    lista.forEach(function (x, j) {
      var c = alto.indexOf(Math.min.apply(null, alto));
      cols[c] += tileFoto(x, j);
      alto[c] += x.f.mi[1] / x.f.mi[0] + 0.12;   // foto + el aire y el rótulo, en anchos de columna
    });
    $("pf-fotos").innerHTML = cols.map(function (h) { return '<ul class="pf-fotos__col">' + h + "</ul>"; }).join("");
  }
  // Solo con el panel de Fotos a la vista: durante el fundido de pestaña la lista todavía puede ser la de otra.
  window.addEventListener("resize", function () { if (!$("fotos").hidden && lista[0] && lista[0].f && columnasFotos() !== nCols) { repartirFotos(); listas(); } });
  function listas() {
    $("pf-fotos").querySelectorAll("img[data-grande]").forEach(function (im) {
      var g = new Image(); g.onload = function () { if (im.isConnected) im.src = g.src; }; g.src = im.dataset.grande; im.removeAttribute("data-grande");
    });
    $("pf-fotos").querySelectorAll("img").forEach(function (im) {
      if (im.complete) im.classList.add("pf-lista"); else im.addEventListener("load", function () { im.classList.add("pf-lista"); }, { once: true });
    });
  }
  function tarjetaLogo(x) {
    var ver = x.a.svg || x.a.png;
    var orden = ["svg", "png", "pdf"].filter(function (e) { return x.a[e]; });
    return '<li class="pf-logo"><div class="pf-logo__ver' + (x.color === "Blanco" ? " pf-sobre-azul" : "") + '"><img src="' + esc(ver) + '" alt="Logo de Profertil, ' + esc(x.nombre.toLowerCase()) + ", " + esc(x.color.toLowerCase()) + '" loading="lazy"></div>' +
      '<div class="pf-logo__t"><h3>' + esc(x.nombre) + "</h3><span>" + esc(x.color) + "</span></div>" +
      '<div class="pf-logo__d">' + orden.map(function (e) {
        return '<a class="pf-boton" href="' + esc(x.a[e]) + '" download aria-label="Descargar ' + esc(x.nombre + " " + x.color) + " en " + e.toUpperCase() + '">' + BAJAR + e.toUpperCase() + "</a>";
      }).join("") + "</div></li>";
  }
  function pintar() {
    var t = T();
    lista = t.items.filter(function (x) { return pasa(x); });
    if (tab === "gacetillas") { $("pf-docs").dataset.vista = vista; $("pf-docs").innerHTML = lista.map(filaGacetilla).join(""); }
    if (tab === "fotos") {
      repartirFotos(); listas();
    }
    if (tab === "logos") $("pf-logos").innerHTML = lista.map(tarjetaLogo).join("");
    $("pf-empty").hidden = lista.length > 0;
    $("pf-filters").classList.toggle("pf-vacio", !lista.length);
  }

  /* --- Filtros: el dock de la Biblioteca, armado con los grupos de la pestaña --------------------------- */
  var abierto = null;
  var CHEVRON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 15 6-6 6 6"/></svg>';
  var X = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2 2l8 8M10 2 2 10"/></svg>';
  function opcion(g, o) {
    var cls = g.chip ? "pf-chip" : "pf-pastilla", st = !g.chip ? ' style="--pc:' + (o.pc || "var(--azul)") + '"' : "";
    return '<button type="button" class="' + cls + '"' + st + ' data-f="op" data-g="' + g.id + '" data-v="' + o.id + '" aria-pressed="false">' +
      esc(o.nombre) + '<b class="' + (g.chip ? "pf-chip__n" : "pf-pastilla__n") + '"></b></button>';
  }
  // Con dos grupos o menos la barra queda solo con el botón Filtros y el panel los muestra todos abiertos (sin acordeón).
  function pocos() { return T().grupos.length <= 2; }
  function armarFiltros() {
    var gs = T().grupos;
    $("pf-filters").classList.toggle("pf-fuera", !gs.length);
    $("pf-filters").classList.toggle("pf-pocos", pocos());
    $("pf-fMain").innerHTML = pocos() ? "" : gs.map(function (g) {
      return '<button type="button" class="pf-pastilla pf-pastilla--todas" data-abrir="' + g.id + '" aria-expanded="false" aria-controls="pf-fBody">' + g.nombre + '<b class="pf-f-n" hidden></b></button>';
    }).join("");
    $("pf-fGrupos").innerHTML = gs.map(function (g) {
      var cab = '<span class="pf-f-label">' + g.nombre + '</span><b class="pf-f-n" hidden></b><span class="pf-f-gr__res"></span>';
      return '<section class="pf-f-gr" data-grupo="' + g.id + '">' +
        (pocos() ? '<div class="pf-f-gr__cab" data-grupo="' + g.id + '">' + cab + "</div>" :
        '<button type="button" class="pf-f-gr__cab" data-grupo="' + g.id + '" aria-expanded="false" aria-controls="pf-fg-' + g.id + '">' + cab + CHEVRON + "</button>") +
        '<div class="pf-f-gr__activos"></div>' +
        '<div class="pf-f-gr__cuerpo" id="pf-fg-' + g.id + '" role="group" aria-label="' + g.nombre + '"><div><div class="pf-f-gr__in"><div class="pf-f-row">' +
        g.opciones.map(function (o) { return opcion(g, o); }).join("") + "</div></div></div></div></section>";
    }).join("");
    abierto = null;
  }
  function nombreOp(g, v) { var gr = T().grupos.filter(function (x) { return x.id === g; })[0]; var o = gr.opciones.filter(function (x) { return x.id === v; })[0]; return o ? o.nombre : v; }
  function pintarFiltros() {
    T().grupos.forEach(function (g) {
      var cuenta = {};
      T().items.forEach(function (x) { if (!pasa(x, g.id)) return; (x.e[g.id] || []).forEach(function (v) { cuenta[v] = (cuenta[v] || 0) + 1; }); });
      var sel = T().sel[g.id], ks = activos(sel);
      var sec = document.querySelector('.pf-f-gr[data-grupo="' + g.id + '"]'); if (!sec) return;
      sec.querySelectorAll("[data-f='op']").forEach(function (b) {
        var v = b.dataset.v, n = cuenta[v] || 0, on = !!sel[v];
        b.setAttribute("aria-pressed", String(on));
        b.classList.toggle("pf-cero", !n);
        if (!n && !on) b.setAttribute("aria-disabled", "true"); else b.removeAttribute("aria-disabled");
        b.lastElementChild.textContent = n;
      });
      sec.querySelector(".pf-f-gr__res").textContent = ks.map(function (k) { return nombreOp(g.id, k); }).join(", ");
      var nb = sec.querySelector(".pf-f-gr__cab .pf-f-n"); nb.hidden = !ks.length; nb.textContent = ks.length;
      sec.querySelector(".pf-f-gr__activos").innerHTML = ks.map(function (k) {
        return opcion(g, g.opciones.filter(function (o) { return o.id === k; })[0]).replace('aria-pressed="false"', 'aria-pressed="true" aria-label="Quitar el filtro ' + esc(nombreOp(g.id, k)) + '"').replace(/<b class="[^"]*"><\/b>/, X);
      }).join("");
      var bb = document.querySelector('#pf-fMain [data-abrir="' + g.id + '"] .pf-f-n'); if (bb) { bb.hidden = !ks.length; bb.textContent = ks.length; }
    });
  }
  function nFiltros() { return T().grupos.reduce(function (s, g) { return s + activos(T().sel[g.id]).length; }, 0); }
  function resumen() {
    var t = T(), qq = q.trim(), nf = nFiltros();
    var txt = "<b>" + lista.length + "</b> " + (lista.length === 1 ? t.uno : t.varios);
    if (!qq && !nf) txt = t.todo + " · <b>" + lista.length + "</b>";
    $("pf-resultText").innerHTML = txt;
    $("pf-qCount").textContent = lista.length;
    var nsub = esMobile.matches || pocos() ? nf : 0;
    $("pf-fCount").hidden = nsub === 0; $("pf-fCount").textContent = nsub;
    $("pf-fTxt").textContent = esMobile.matches && $("pf-filters").classList.contains("pf-abierto") ? "Ver " + lista.length + " " + (lista.length === 1 ? t.uno : t.varios) : "Filtros";
    $("pf-fClear").hidden = nf === 0;
    var h = "";
    t.grupos.forEach(function (g) {
      activos(t.sel[g.id]).forEach(function (k) {
        var n = nombreOp(g.id, k);
        h += '<button type="button" class="pf-chip" aria-pressed="true" data-quitar="op" data-g="' + g.id + '" data-v="' + k + '" aria-label="Quitar el filtro ' + esc(n) + '">' + esc(n) + X + "</button>";
      });
    });
    if (qq) h += '<button type="button" class="pf-chip" aria-pressed="true" data-quitar="q" aria-label="Quitar la búsqueda">«' + esc(qq) + "»" + X + "</button>";
    if (h) h += '<button type="button" class="pf-activos__limpiar" data-quitar="todo">Limpiar todo</button>';
    $("pf-activos").innerHTML = h;
    $("pf-emptyText").textContent = qq ? "Nada coincide con «" + qq + "»" + (nf ? " con esos filtros" : "") + ". Probá con otra palabra o mirá las otras pestañas." : "Nada cumple esa combinación de filtros. Sacá alguno para ver más.";
  }
  // La dirección guarda la pestaña y lo elegido: #fotos&galeria=urea, #gacetillas&tipo=aviso&anio=2023&q=planta.
  var urlLista = false;
  function aUrl() {
    if (!urlLista) return;
    var p = [tab], qq = q.trim();
    T().grupos.forEach(function (g) { var ks = activos(T().sel[g.id]); if (ks.length) p.push(g.id + "=" + ks.join(",")); });
    if (qq) p.push("q=" + encodeURIComponent(qq));
    try { history.replaceState(null, "", "#" + p.join("&")); } catch (e) {}
  }
  /* Saltos de scroll que hace la página (cambio de vista, de pestaña o de filtro): no son del usuario, así que ni el dock ni la fila
     fija los leen como bajar o subir. Antes el dock se achicaba y agrandaba con cada cambio de vista. */
  var hastaSinDir = 0;
  function saltar(y) {
    hastaSinDir = performance.now() + 150;
    mostrarPest(true);
    window.scrollTo({ top: y, behavior: "instant" });
    if (enCel) vuelve.saltar();
  }
  function inicioLista() { return Math.max(0, $("pf-lista").getBoundingClientRect().top + window.scrollY - $("pf-top").offsetHeight + 2); }
  function aplicar() {
    var bajo = window.scrollY > inicioLista();
    pintar(); resumen(); pintarFiltros(); aUrl(); despertar(700);
    if (bajo) saltar(inicioLista());
  }
  $("pf-activos").addEventListener("click", function (e) {
    var b = e.target.closest("[data-quitar]"); if (!b) return;
    var t = b.dataset.quitar;
    if (t === "todo") { limpiar(); return; }
    if (t === "op") delete T().sel[b.dataset.g][b.dataset.v];
    else if (t === "q") { q = ""; $("pf-q").value = ""; }
    aplicar();
  });
  function limpiar() { T().grupos.forEach(function (g) { T().sel[g.id] = {}; }); q = ""; $("pf-q").value = ""; aplicar(); }
  $("pf-fClear").addEventListener("click", limpiar);
  $("pf-emptyReset").addEventListener("click", limpiar);

  /* --- Pestañas --------------------------------------------------------------- */
  function moverInd(seg, animar) {
    var ind = seg.querySelector(".pf-selector__ind"), b = seg.querySelector('button[aria-pressed="true"]');
    if (!b || !b.offsetWidth) return;
    if (!animar) ind.classList.add("pf-quieto");
    ind.style.width = b.offsetWidth + "px";
    ind.style.transform = "translateX(" + b.offsetLeft + "px)";
    if (!animar) { void ind.offsetWidth; ind.classList.remove("pf-quieto"); }
  }
  var pest = document.querySelector(".pf-pestanas");
  function marcarVistas(animar) {
    document.querySelectorAll(".pf-herramientas .pf-selector").forEach(function (sel) {
      sel.hidden = sel.dataset.para !== tab;
      var v = sel.classList.contains("pf-vista") ? vista : tamFotos;
      sel.querySelectorAll("[data-vista]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.vista === v)); });
      if (!sel.hidden) moverInd(sel, animar);
    });
  }
  /* Cambio de pestaña: el indicador viaja enseguida; lo de abajo se funde afuera (140 ms; el cambio espera 170), cambia sin verse (también el salto al
     principio de la lista, si se estaba más abajo) y entra fundiéndose y subiendo 12 px (300 y 460 ms). Un clic nuevo en el medio toma el último pedido. */
  var cambia = $("pf-cambia"), herr = $("pf-herr"), tCambio = 0;
  function selDe(t) { return herr.querySelector('.pf-selector[data-para="' + t + '"]'); }
  function irA(t, animar) {
    if (!TABS[t]) return;
    var viejo = herr.querySelector(".pf-selector:not([hidden])"), muda = !!(viejo && selDe(t));
    mostrarPest(true);
    if ($("pf-filters").classList.contains("pf-abierto")) abrirFiltros(false);
    tab = t;
    pest.querySelectorAll("[data-tab]").forEach(function (b) { var si = b.dataset.tab === t; b.setAttribute("aria-pressed", String(si)); b.setAttribute("aria-selected", String(si)); b.tabIndex = si ? 0 : -1; });
    moverInd(pest, animar);
    function cambiar() {
      Object.keys(TABS).forEach(function (k) { $(k).hidden = k !== tab; });
      var oi = viejo && viejo.querySelector(".pf-selector__ind"), w = oi && oi.style.width, tr = oi && oi.style.transform;
      marcarVistas(false);
      var nuevo = selDe(tab);
      if (muda && nuevo && nuevo !== viejo && animar && !quieto.matches) {   // la pastilla sale de donde estaba la de la otra pestaña
        var ni = nuevo.querySelector(".pf-selector__ind");
        ni.classList.add("pf-quieto"); ni.style.width = w; ni.style.transform = tr; void ni.offsetWidth; ni.classList.remove("pf-quieto");
        moverInd(nuevo, true);
      }
      armarFiltros(); abrirFiltros(false);
      sinEntrada = animar; aplicar(); sinEntrada = false;
      cambia.classList.remove("pf-oculto"); herr.classList.remove("pf-oculto", "pf-muda");
    }
    clearTimeout(tCambio);
    if (!animar || quieto.matches) { cambiar(); return; }
    cambia.classList.add("pf-oculto"); herr.classList.add(muda ? "pf-muda" : "pf-oculto");
    $("pf-filters").classList.add("pf-fuera");   // el dock se va y vuelve (o no, en Logos) con la pestaña nueva
    tCambio = setTimeout(cambiar, 170);
  }
  pest.addEventListener("click", function (e) { var b = e.target.closest("[data-tab]"); if (b && b.dataset.tab !== tab) irA(b.dataset.tab, true); });
  pest.addEventListener("keydown", function (e) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    var ks = Object.keys(TABS), i = ks.indexOf(tab) + (e.key === "ArrowRight" ? 1 : -1);
    i = (i + ks.length) % ks.length; irA(ks[i], true); $("pf-t-" + ks[i]).focus();
  });

  /* Cambiar de vista (la lógica de la Biblioteca): cada fila o foto visible se arma en su lugar nuevo y viaja desde donde estaba. Las
     filas cambian de forma (aparece la miniatura, se achica el título), así que además se funden desde 35%. Las que no se veían y ahora
     sí entran fundiéndose con un leve ascenso, escalonadas de a 30 ms, después de las que viajan. Solo se anima lo que queda a la
     vista. Si el principio de la lista está a la vista, la página no se mueve; si ya se bajó, la primera visible queda en su lugar. */
  function cambiarVista(cont, rehacer, escala) {
    // Lo que tapa arriba: la barra azul o, si está a la vista, la fila fija de pestañas.
    var tope = Math.max($("pf-top").offsetHeight, $("pf-pest").classList.contains("pf-escondida") ? 0 : $("pf-pest").getBoundingClientRect().bottom) + 8;
    var alto = window.innerHeight, ref = null, antes = {};
    cont.querySelectorAll("[data-k]").forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.bottom > tope && r.top < alto) { antes[el.dataset.k] = r; if (!ref) ref = { k: el.dataset.k, top: r.top }; }
    });
    if (cont.getBoundingClientRect().top >= tope) ref = null;
    var y = window.scrollY;
    cont.style.minHeight = cont.offsetHeight + "px";
    sinEntrada = true; rehacer(); sinEntrada = false;
    cont.style.minHeight = "";
    var el = ref && cont.querySelector('[data-k="' + ref.k + '"]');
    if (el) saltar(Math.max(0, window.scrollY + el.getBoundingClientRect().top - ref.top));
    else if (window.scrollY !== y) saltar(y);
    if (!cont.animate || quieto.matches) return;
    var curva = getComputedStyle(document.documentElement).getPropertyValue("--ease").trim() || "cubic-bezier(.22,1,.36,1)", nuevas = 0;
    cont.querySelectorAll("[data-k]").forEach(function (n) {
      var o = antes[n.dataset.k], r = n.getBoundingClientRect();
      if (r.bottom <= tope || r.top >= alto) { if (!o) return; }   // fuera de la vista: solo viaja la que venía de estar visible
      if (!o) {
        n.animate([{ opacity: 0, transform: "translateY(12px)" }, { opacity: 1, transform: "none" }],
          { duration: 420, delay: 80 + Math.min(nuevas++, 8) * 30, easing: curva, fill: "backwards" });
        return;
      }
      var dx = Math.round(o.left - r.left), dy = Math.round(o.top - r.top), s = escala && r.width ? o.width / r.width : 1;
      var desde = { transform: "translate(" + dx + "px," + dy + "px) scale(" + s + ")", transformOrigin: "0 0" }, hasta = { transform: "none", transformOrigin: "0 0" };
      if (!escala) { desde.opacity = .35; hasta.opacity = 1; }
      else if (!dx && !dy && s === 1) return;
      n.animate([desde, hasta], { duration: 420, easing: curva });
    });
  }
  document.querySelector(".pf-vista").addEventListener("click", function (e) {
    var b = e.target.closest("[data-vista]"); if (!b || b.dataset.vista === vista) return;
    vista = b.dataset.vista;
    try { localStorage.setItem("prensa-vista", vista); } catch (err) {}
    marcarVistas(true);
    cambiarVista($("pf-docs"), pintar, false);
  });
  document.querySelector(".pf-densidad").addEventListener("click", function (e) {
    var b = e.target.closest("[data-vista]"); if (!b || b.dataset.vista === tamFotos) return;
    tamFotos = b.dataset.vista;
    try { localStorage.setItem("prensa-fotos-vista", tamFotos); } catch (err) {}
    marcarVistas(true);
    cambiarVista($("pf-fotos"), function () { repartirFotos(); listas(); }, true);
  });

  /* Toda la fila de gacetilla es el enlace al visor (como en la Biblioteca). */
  $("pf-docs").addEventListener("click", function (e) {
    if (e.defaultPrevented || e.target.closest("a, button")) return;
    var li = e.target.closest(".pf-doc"), a = li && li.querySelector(".pf-doc__t a");
    if (!a) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey) window.open(a.href, "_blank", "noopener"); else a.click();
  });

  /* --- Visor de fotos: recorre las fotos de la lista filtrada -------------------------------------
     Al abrir, la foto crece desde su miniatura (FLIP con transform) mientras el fondo se funde; al cerrar vuelve a la miniatura si
     está a la vista (si no, se achica un poco y se funde). Entre fotos, la actual sale 48 px hacia un lado y la otra entra desde el
     opuesto; deslizando con el dedo la foto lo sigue y, pasados 50 px, sigue de largo. Mientras baja la grande se ve la miniatura,
     que ya está cargada. Solo transform y opacity, con la curva base. */
  var vf = $("pf-vf"), vfI = -1, vfTok = 0, desplazado = 0, cerrando = false;
  var curvaV = getComputedStyle(document.documentElement).getPropertyValue("--ease").trim() || "cubic-bezier(.22,1,.36,1)";
  function imgVf() {
    var img = $("pf-vfImg");
    if (!img) { img = document.createElement("img"); img.id = "pf-vfImg"; img.draggable = false; img.decoding = "async"; $("pf-vfEsc").prepend(img); }
    return img;
  }
  // Tamaño de la foto en el visor por su proporción, sin esperar a que cargue: el vuelo desde la miniatura necesita el lugar final.
  function medirVf() {
    var img = $("pf-vfImg"), x = lista[vfI], esc = $("pf-vfEsc");
    if (!img || !x || !vf.open) return;
    var cs = getComputedStyle(esc), w = esc.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight), h = esc.clientHeight;
    var k = Math.min(w / x.f.gr[0], h / x.f.gr[1]);
    img.style.width = Math.floor(x.f.gr[0] * k) + "px"; img.style.height = Math.floor(x.f.gr[1] * k) + "px";
  }
  window.addEventListener("resize", medirVf);
  function ponerFoto() {
    var x = lista[vfI], img = imgVf(), grande = fotoSrc(x, true), g = new Image();
    img.dataset.k = x.k; img.width = x.f.gr[0]; img.height = x.f.gr[1]; medirVf();
    img.alt = x.g.nombre + ", foto " + x.i;
    g.src = grande;
    if (g.complete) img.src = grande;
    else { img.src = fotoSrc(x, false); g.onload = function () { if (img.dataset.k === x.k) img.src = grande; }; }
    $("pf-vfT").innerHTML = "<b>" + esc(x.g.nombre) + "</b> · " + x.i + " de " + x.de;
    $("pf-vfBajar").href = x.f.u;
    var otra = new Image(); otra.src = fotoSrc(lista[(vfI + 1) % lista.length], true);
  }
  function verFoto(j, dir) {
    if (!lista.length || !lista[0].f) return;   // un toque durante el cambio de pestaña
    vfI = (j + lista.length) % lista.length;
    var img = imgVf(), dx = desplazado; desplazado = 0; img.style.transform = "";
    img.getAnimations().forEach(function (a) { a.cancel(); });
    if (!dir || quieto.matches || !img.animate) { ponerFoto(); return; }
    var tok = ++vfTok;
    var sale = img.animate([{ transform: "translateX(" + dx + "px)", opacity: 1 }, { transform: "translateX(" + (dx - dir * 48) + "px)", opacity: 0 }],
      { duration: 150, easing: "cubic-bezier(.4,0,1,1)", fill: "forwards" });
    sale.onfinish = function () {
      if (tok !== vfTok) return;
      ponerFoto(); sale.cancel();
      img.animate([{ transform: "translateX(" + dir * 48 + "px)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 360, easing: curvaV });
    };
  }
  function cromo() { return [vf.querySelector(".pf-vf__cab"), vf.querySelector(".pf-vf__pie"), $("pf-vfAnt"), $("pf-vfSig")]; }
  // La miniatura de la foto j, solo si está a la vista (si no, no hay de dónde salir ni adónde volver).
  function miniatura(j) {
    var b = $("pf-fotos").querySelector('.pf-fo__b[data-j="' + j + '"]'), r = b && b.getBoundingClientRect();
    return r && r.width && r.bottom > 0 && r.top < window.innerHeight ? r : null;
  }
  function haciaMini(r, img) {
    var f = img.getBoundingClientRect();
    return "translate(" + (r.left - f.left) + "px," + (r.top - f.top) + "px) scale(" + r.width / f.width + ")";
  }
  $("pf-fotos").addEventListener("click", function (e) {
    var b = e.target.closest(".pf-fo__b"); if (!b) return;
    vfTok++; cerrando = false;
    vf.getAnimations({ subtree: true }).forEach(function (a) { a.cancel(); });
    if (vf.showModal) vf.showModal(); else vf.setAttribute("open", "");
    verFoto(+b.dataset.j);
    $("pf-vfCerrar").focus();
    var img = imgVf();
    if (quieto.matches || !img.animate) return;
    var r = miniatura(vfI);
    vf.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: "ease", pseudoElement: "::before" });
    cromo().forEach(function (el) { el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, delay: 160, easing: "ease", fill: "backwards" }); });
    if (r) img.animate([{ transform: haciaMini(r, img), transformOrigin: "0 0" }, { transform: "none", transformOrigin: "0 0" }], { duration: 480, easing: curvaV });
    else img.animate([{ opacity: 0, transform: "scale(.96)" }, { opacity: 1, transform: "none" }], { duration: 360, easing: curvaV });
  });
  function cerrarFoto() {
    if (!vf.open || cerrando) return;
    var img = $("pf-vfImg");
    if (quieto.matches || !img || !img.animate) { vf.close ? vf.close() : vf.removeAttribute("open"); return; }
    cerrando = true; vfTok++;
    img.getAnimations().forEach(function (a) { a.cancel(); });
    img.style.transform = ""; desplazado = 0;
    var r = miniatura(vfI), dur = r ? 400 : 240;
    var a = r ? img.animate([{ transform: "none", transformOrigin: "0 0" }, { transform: haciaMini(r, img), transformOrigin: "0 0" }], { duration: dur, easing: curvaV, fill: "forwards" })
              : img.animate([{ opacity: 1 }, { opacity: 0, transform: "scale(.96)" }], { duration: dur, easing: "ease", fill: "forwards" });
    vf.animate([{ opacity: 1 }, { opacity: 0 }], { duration: dur, easing: "ease", fill: "forwards", pseudoElement: "::before" });
    cromo().forEach(function (el) { el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, easing: "ease", fill: "forwards" }); });
    a.onfinish = function () {
      if (!cerrando) return;
      cerrando = false;
      vf.close ? vf.close() : vf.removeAttribute("open");
      vf.getAnimations({ subtree: true }).forEach(function (x) { x.cancel(); });
    };
  }
  $("pf-vfCerrar").addEventListener("click", cerrarFoto);
  $("pf-vfAnt").addEventListener("click", function () { verFoto(vfI - 1, -1); });
  $("pf-vfSig").addEventListener("click", function () { verFoto(vfI + 1, 1); });
  vf.addEventListener("cancel", function (e) { e.preventDefault(); cerrarFoto(); });   // Esc, con la misma salida
  vf.addEventListener("close", function () {
    var t = $("pf-fotos").querySelector('[data-j="' + vfI + '"]'); if (t) t.focus({ preventScroll: true });
  });
  vf.addEventListener("keydown", function (e) {
    if (e.key === "ArrowLeft") verFoto(vfI - 1, -1);
    if (e.key === "ArrowRight") verFoto(vfI + 1, 1);
  });
  // Tocar el fondo (fuera de la foto y los botones) cierra; deslizar de costado arrastra la foto y, pasados 50 px, cambia.
  var x0 = null, t0 = null;
  $("pf-vfEsc").addEventListener("pointerdown", function (e) { if (cerrando) return; x0 = e.clientX; t0 = e.target; desplazado = 0; });
  $("pf-vfEsc").addEventListener("pointermove", function (e) {
    if (x0 === null || quieto.matches) return;
    var dx = e.clientX - x0;
    if (Math.abs(dx) < 6 && !desplazado) return;
    desplazado = dx; imgVf().style.transform = "translateX(" + dx + "px)";
  });
  function soltar(e, vale) {
    if (x0 === null) return;
    var dx = e.clientX - x0, img = imgVf(); x0 = null;
    if (vale && Math.abs(dx) > 50) { verFoto(vfI + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1); return; }
    if (desplazado && img.animate) img.animate([{ transform: "translateX(" + desplazado + "px)" }, { transform: "none" }], { duration: 300, easing: curvaV });
    img.style.transform = ""; desplazado = 0;
    if (vale && t0 === this && Math.abs(dx) < 6) cerrarFoto();
  }
  $("pf-vfEsc").addEventListener("pointerup", function (e) { soltar.call(this, e, true); });
  $("pf-vfEsc").addEventListener("pointercancel", function (e) { soltar.call(this, e, false); });

  /* --- Buscador en la lupa (filtra la pestaña abierta) ------------------------------------------ */
  esMobile.addEventListener("change", function () { resumen(); pintarFiltros(); });
  var tq;
  $("pf-q").addEventListener("input", function (e) { clearTimeout(tq); tq = setTimeout(function () { q = e.target.value; aplicar(); }, 120); });
  function cerrarBusca() { $("pf-q").value = ""; q = ""; aplicar(); abrirBusca(false); $("pf-goSearch").focus(); }
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
    if (!abierta) abrirBusca(true); else if (!$("pf-q").value) abrirBusca(false); else $("pf-q").focus();
  });
  $("pf-q").addEventListener("blur", function () { setTimeout(function () { if (!$("pf-q").value && document.activeElement !== $("pf-q")) abrirBusca(false); }, 180); });
  $("pf-q").addEventListener("keydown", function (e) { if (e.key === "Escape") cerrarBusca(); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "/" && !vf.open && document.activeElement !== $("pf-q") && !/^(input|textarea)$/i.test(document.activeElement.tagName)) { e.preventDefault(); abrirBusca(true); }
  });


  /* --- Dock de filtros (el de la Biblioteca) --------------------------------------------------- */
  /* Dirección del scroll del usuario: al bajar el dock se achica (celular) y la fila fija se esconde; al subir vuelven. */
  var yAntes = window.scrollY, pestEl = $("pf-pest");
  function mostrarPest(si) { if (!enCel) $("pf-pest").classList.toggle("pf-escondida", !si); }   // se llama también antes de esta línea (saltar, irA)
  // Dónde queda la fila fija: debajo de la barra azul (el mismo cálculo que el CSS de .pf-fija).
  function topFijo() { var v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--pf-barra-h")); return (isNaN(v) ? 76 : v) - 1; }
  function pestFija() { if (enCel) return vuelve.fija(); return $("pf-lista").getBoundingClientRect().top < topFijo() - 2; }
  /* La fila pasa a fixed cuando su hueco llega a la barra, y vuelve a su lugar cuando el hueco baja. El hueco guarda el alto (la página
     no se mueve) y le da a la fila su izquierda y su ancho. */
  var lugar = document.createElement("div");
  lugar.className = "pf-pest-lugar";
  pestEl.parentNode.insertBefore(lugar, pestEl);
  lugar.appendChild(pestEl);
  function fijarPest() {
    if (enCel) return;
    var r = lugar.getBoundingClientRect(), fija = r.top <= topFijo();
    if (fija) {
      lugar.style.height = pestEl.offsetHeight + "px";
      pestEl.style.left = r.left + "px"; pestEl.style.width = r.width + "px";
    }
    if (fija === pestEl.classList.contains("pf-fija")) return;
    pestEl.classList.toggle("pf-fija", fija);
    if (!fija) { lugar.style.height = ""; pestEl.style.left = pestEl.style.width = ""; mostrarPest(true); }
  }
  /* En escritorio, donde el navegador lo soporta, la fila no se fija por JS: va siempre fixed y la mueve el navegador atada al
     scroll (CSS .pf-atada). Fijada por JS llegaba un cuadro tarde y se trababa justo al esconderse. El JS solo mide dónde empieza (y0),
     dónde queda (debajo de la barra) y cuánto recorre. */
  var atada = !!(window.CSS && CSS.supports && CSS.supports("animation-timeline: scroll()"));
  function atarPest() {
    if (enCel) return;
    pestEl.classList.add("pf-atada");
    lugar.style.height = pestEl.offsetHeight + "px";
    var r = lugar.getBoundingClientRect(), y0 = r.top + window.scrollY, T = topFijo();
    pestEl.style.left = r.left + "px"; pestEl.style.width = r.width + "px";
    pestEl.style.setProperty("--herr-desde", y0 + "px");
    pestEl.style.setProperty("--herr-hasta", T + "px");
    pestEl.style.setProperty("--herr-recorrido", Math.max(0, y0 - T) + "px");
  }
  /* Celular: la barra de pestañas va con su caja y vuelve al subir (PFBarraVista, en componentes/barra-vista.js). Lo de arriba (atarPest, fijarPest)
     queda solo para escritorio. Al cruzar los 640 px (girar el teléfono, achicar la ventana) se pasa de un modo al otro. */
  var enCel = false, vuelveMarca = document.createElement("div");
  vuelveMarca.className = "pf-vuelve-marca";
  lugar.parentNode.insertBefore(vuelveMarca, lugar);
  var vuelve = PFBarraVista.queVuelve(pestEl, vuelveMarca, topFijo);
  function modoPest() {
    enCel = esMobile.matches;
    lugar.classList.toggle("pf-vuelve-libre", enCel);
    if (enCel) {
      pestEl.classList.remove("pf-atada", "pf-fija", "pf-escondida");
      lugar.style.height = pestEl.style.left = pestEl.style.width = "";
    } else {
      vuelve.apagar();
      if (atada) atarPest(); else fijarPest();
    }
  }
  modoPest();
  esMobile.addEventListener("change", modoPest);
  window.addEventListener("resize", function () { if (esMobile.matches !== enCel) modoPest(); });   // por si el aviso de la media query no llega
  if (atada) {
    atarPest();
    window.addEventListener("resize", atarPest);
    // Si algo de arriba cambia de alto (la cabecera, el contacto que se despliega, las fuentes) o la fila misma, se vuelve a medir.
    if (window.ResizeObserver) { var roPest = new ResizeObserver(function () { atarPest(); }); roPest.observe(document.body); roPest.observe(pestEl); }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(atarPest);
  } else {
    window.addEventListener("scroll", fijarPest, { passive: true });
    window.addEventListener("resize", fijarPest);
    if (window.ResizeObserver) new ResizeObserver(function () { if (pestEl.classList.contains("pf-fija")) lugar.style.height = pestEl.offsetHeight + "px"; fijarPest(); }).observe(pestEl);
    fijarPest();
  }
  pestEl.addEventListener("focusin", function () { mostrarPest(true); });
  window.addEventListener("scroll", function () {
    var y = window.scrollY;
    if (performance.now() < hastaSinDir) { yAntes = y; return; }
    var dy = y - yAntes;
    if (Math.abs(dy) < 8) return;
    yAntes = y;
    var f = $("pf-filters"), abiertos = f.classList.contains("pf-abierto");
    var alFinal = y + window.innerHeight >= document.documentElement.scrollHeight - 4;
    var baja = dy > 0 && !alFinal;
    if (!esMobile.matches || abiertos) f.classList.remove("pf-chica"); else f.classList.toggle("pf-chica", baja && y > 40);
    if (enCel) vuelve.mover(dy);
    else mostrarPest(!(baja && pestFija() && !abiertos && !$("pf-busca").classList.contains("pf-abierto")));
  }, { passive: true });
  function abrirGrupo(g) {
    abierto = g;
    document.querySelectorAll(".pf-f-gr").forEach(function (el) {
      var si = pocos() || el.dataset.grupo === g;
      el.classList.toggle("pf-abierto", si);
      if (!pocos()) el.querySelector(".pf-f-gr__cab").setAttribute("aria-expanded", String(si));
    });
    document.querySelectorAll("#pf-fMain [data-abrir]").forEach(function (b) {
      b.setAttribute("aria-expanded", String(b.dataset.abrir === g && $("pf-filters").classList.contains("pf-abierto")));
    });
  }
  /* Cambio de grupo del acordeón: el alto de cada cuerpo se anima con el resorte de --f-curva (k = 8,38), como en la Biblioteca.
     Acá los grupos son cortos (dos o seis opciones) y entran siempre en el panel: no hace falta sostener el scroll. */
  var acordeon = null;
  function resorte(u) { var k = 8.38; return u >= 1 ? 1 : (1 - (1 + k * u) * Math.exp(-k * u)) / (1 - (1 + k) * Math.exp(-k)); }
  function cortarAcordeon() {
    if (!acordeon) return;
    cancelAnimationFrame(acordeon.raf);
    acordeon.cuerpos.forEach(function (c) { c.style.height = c.style.gridTemplateRows = c.style.visibility = c.style.overflow = ""; });
    document.querySelectorAll(".pf-f-gr__activos").forEach(function (f) { f.style.display = ""; });
    acordeon = null;
  }
  function cambiarGrupo(g) {
    var dur = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--f-acordeon")) || 260;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { cortarAcordeon(); abrirGrupo(g); return; }
    var grupos = [].slice.call(document.querySelectorAll(".pf-f-gr"));
    var cuerpos = grupos.map(function (el) { return el.querySelector(".pf-f-gr__cuerpo"); });
    var desde = cuerpos.map(function (c) { return c.offsetHeight; });
    cortarAcordeon();
    cuerpos.forEach(function (c, i) { c.style.gridTemplateRows = "1fr"; c.style.visibility = "visible"; c.style.overflow = "hidden"; c.style.height = desde[i] + "px"; });
    var iAbre = g ? grupos.findIndex(function (el) { return el.dataset.grupo === g; }) : -1;
    var act = iAbre > -1 && !desde[iAbre] ? grupos[iAbre].querySelector(".pf-f-gr__activos").offsetHeight : 0;
    abrirGrupo(g);
    if (act) { desde[iAbre] = act; cuerpos[iAbre].style.height = act + "px"; }
    var hasta = grupos.map(function (el) { return el.classList.contains("pf-abierto") ? el.querySelector(".pf-f-gr__in").offsetHeight : 0; });
    grupos.forEach(function (el, i) {
      if (!desde[i] || hasta[i] || el.dataset.grupo === g) return;
      var fila = el.querySelector(".pf-f-gr__activos"), h = fila.offsetHeight;
      if (h) { fila.style.display = "none"; hasta[i] = h; }
    });
    var t0 = performance.now(), este = acordeon = { cuerpos: cuerpos };
    (function cuadro(now) {
      if (acordeon !== este) return;
      var u = Math.min(1, (now - t0) / dur), p = resorte(u);
      cuerpos.forEach(function (c, i) { c.style.height = (desde[i] + (hasta[i] - desde[i]) * p) + "px"; });
      if (u < 1) { este.raf = requestAnimationFrame(cuadro); return; }
      cortarAcordeon();
    })(t0);
  }
  $("pf-filters").addEventListener("click", function (e) {
    var ab = e.target.closest("[data-abrir]");
    if (ab) {
      var yaAbierto = $("pf-filters").classList.contains("pf-abierto");
      if (yaAbierto && abierto === ab.dataset.abrir) { abrirFiltros(false); return; }
      if (!yaAbierto) abrirFiltros(true, ab.dataset.abrir); else cambiarGrupo(ab.dataset.abrir);
      return;
    }
    var cab = e.target.closest("button.pf-f-gr__cab");
    if (cab) { cambiarGrupo(abierto === cab.dataset.grupo ? null : cab.dataset.grupo); return; }
    var b = e.target.closest("[data-f]"); if (!b) return;
    if (b.getAttribute("aria-disabled") === "true") return;
    var sel = T().sel[b.dataset.g], v = b.dataset.v;
    if (sel[v]) delete sel[v]; else sel[v] = true;
    aplicar();
  });
  var tListo;
  function abrirFiltros(si, grupo) {
    var f = $("pf-filters"), b = $("pf-fBody"), gr = $("pf-fGrupos");
    clearTimeout(tListo);
    cortarAcordeon();
    if (si && !f.classList.contains("pf-abierto")) f.style.setProperty("--f-w-cerrada", f.getBoundingClientRect().width + "px");
    var desde = b.offsetHeight, anchoAhora = b.firstElementChild.offsetWidth;
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
  function primerGrupo() {
    var gs = T().grupos;
    for (var i = 0; i < gs.length; i++) if (activos(T().sel[gs[i].id]).length) return gs[i].id;
    return gs.length ? gs[0].id : null;
  }

  /* --- Ancla (la de la Biblioteca): baja una pantalla o vuelve al principio de la pestaña ------------- */
  var ancla = $("pf-ancla"), cuerpo = ancla.firstElementChild, flecha = cuerpo.firstElementChild;
  var raiz = getComputedStyle(document.documentElement);
  function tk(n) { return parseFloat(raiz.getPropertyValue("--" + n)); }
  var GAP = tk("ancla-gap"), APRETAR = tk("ancla-apretar"), BAJAR_P = tk("ancla-bajar"), CAMBIO = tk("ancla-cambio");
  function R(x, k, c) { return { x: x, v: 0, t: x, k: k, c: c }; }
  var M = { s: R(0, tk("ancla-aparecer-k"), tk("ancla-aparecer-c")), q: R(1, tk("ancla-apretar-k"), tk("ancla-apretar-c")), r: R(90, tk("ancla-giro-k"), tk("ancla-giro-c")) };
  // La flecha de la cabecera (campo.js) se ve hasta los 40 px de scroll: mientras tanto, ni dock ni ancla.
  function conFlecha() { return window.scrollY <= 40; }
  function marcarFlecha() { $("pf-filters").classList.toggle("pf-arriba", conFlecha()); }
  window.addEventListener("scroll", marcarFlecha, { passive: true });
  marcarFlecha();
  function arriba() { return window.scrollY > inicioLista() + window.innerHeight * CAMBIO; }
  function medir() {
    var r = $("pf-filters").getBoundingClientRect(), sinDock = !T().grupos.length;
    M.s.t = !lista.length || sinDock || conFlecha() ? 0 : 1;
    var sube = arriba();
    M.r.t = sube ? -90 : 90;
    ancla.setAttribute("aria-label", sube ? "Volver al principio de la lista" : "Bajar");
    ancla.tabIndex = M.s.t ? 0 : -1;
    if (!esMobile.matches) document.documentElement.style.setProperty("--ancla-x", (r.right + GAP).toFixed(2) + "px");
  }
  function paso(s, dt) { var ac = -s.k * (s.x - s.t) - s.c * s.v; s.v += ac * dt; s.x += s.v * dt; }
  var tAntes = 0, corriendo = false, hastaT = 0;
  function enReposo() { for (var k in M) if (Math.abs(M[k].x - M[k].t) > 0.001 || Math.abs(M[k].v) > 0.001) return false; return true; }
  function anim(now) {
    var dt = tAntes ? Math.min(0.05, (now - tAntes) / 1000) : 0.016; tAntes = now;
    medir();
    if (quieto.matches) { for (var k in M) { M[k].x = M[k].t; M[k].v = 0; } }
    else { var n = Math.ceil(dt / 0.004); for (var j = 0; j < n; j++) for (var k2 in M) paso(M[k2], dt / n); }
    ancla.style.transform = "scale(" + (Math.max(0, M.s.x) * M.q.x).toFixed(4) + ")";
    flecha.style.transform = "rotate(" + M.r.x.toFixed(2) + "deg)";
    if (now < hastaT || !enReposo()) requestAnimationFrame(anim); else { corriendo = false; tAntes = 0; }
  }
  function despertar(ms) {
    hastaT = Math.max(hastaT, performance.now() + (ms || 0));
    if (!corriendo) { corriendo = true; requestAnimationFrame(anim); }
  }
  window.addEventListener("scroll", function () { despertar(200); }, { passive: true });
  window.addEventListener("resize", function () { despertar(700); moverInd(pest, false); if (vistasDeEscritorio()) pintar(); marcarVistas(false); });
  $("pf-filters").addEventListener("click", function () { despertar(900); });
  $("pf-filters").addEventListener("transitionend", function () { despertar(120); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { despertar(300); moverInd(pest, false); marcarVistas(false); });
  ancla.addEventListener("pointerdown", function () { M.q.t = APRETAR; despertar(); });
  function soltarAncla() { M.q.t = 1; despertar(); }
  ancla.addEventListener("pointerup", soltarAncla);
  ancla.addEventListener("pointercancel", soltarAncla);
  ancla.addEventListener("pointerleave", soltarAncla);
  ancla.addEventListener("click", function () {
    if (filtrosAbiertos()) abrirFiltros(false);
    var suave = quieto.matches ? "auto" : "smooth";
    if (arriba()) window.scrollTo({ top: inicioLista(), behavior: suave });
    else window.scrollBy({ top: Math.round(window.innerHeight * BAJAR_P), behavior: suave });
  });

  /* --- Dirección: #gacetillas | #fotos | #logos, con filtros y búsqueda (&anio=2023&tipo=aviso&galeria=urea&q=…).
     También las direcciones viejas: #videos (abre Fotos), #documentos (la pestaña vieja de logos) y #buscar. */
  var pedido = location.hash.slice(1).split("&"), primero = pedido[0], conBusca = primero === "buscar";
  var ALIAS = { videos: "fotos", documentos: "logos", "_fotos": "fotos", "_documentos": "logos", "_videos": "fotos", "_gacetillas-de-prensa": "gacetillas" };
  var inicial = TABS[primero] ? primero : ALIAS[primero] || "gacetillas";
  tab = inicial;
  pedido.forEach(function (par) {
    var i = par.indexOf("="); if (i < 1) return;
    var k = par.slice(0, i), v = par.slice(i + 1);
    try { v = decodeURIComponent(v); } catch (e) {}
    if (TABS[inicial].sel[k]) v.split(",").forEach(function (o) {
      var g = TABS[inicial].grupos.filter(function (x) { return x.id === k; })[0];
      if (g.opciones.some(function (x) { return x.id === o; })) TABS[inicial].sel[k][o] = true;
    });
    else if (k === "q" && v) { $("pf-q").value = q = v; conBusca = true; }
  });
  irA(inicial, false);
  urlLista = true;
  if (location.hash && !conBusca) aUrl();
  if (conBusca) abrirBusca(true);
  // Con una pestaña en la dirección se baja hasta ella cuando la página terminó de armarse (el campo cambia el alto de la cabecera).
  function bajarAPestana() { saltar(inicioLista()); }
  if (/^#(gacetillas|fotos|videos|logos|documentos|_)/.test(location.hash)) {
    if (document.readyState === "complete") requestAnimationFrame(bajarAPestana); else window.addEventListener("load", function () { requestAnimationFrame(bajarAPestana); }, { once: true });
  }
  despertar(900);
})();
