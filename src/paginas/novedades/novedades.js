
(function () {
  "use strict";

  /* ---------------------------------------------------------------------
     Datos reales: las 471 notas de /noticias-recientes/ del crawl del sitio
     actual (urls.csv, agosto 2026). Por nota: titulo (t), fecha (f), ruta
     (u), palabras (w), imagenes (i), video (v), bajada propia si tiene (b)
     y subcategoria de WordPress (s). Tipo (tp) y cultivos (c)
     salen de una clasificacion por palabras clave sobre titulo y URL:
     es una propuesta para mostrar, no una carga editorial revisada.
     --------------------------------------------------------------------- */
  var NOTAS = /*__NOTAS__*/[];
  var A = /*__ASSETS__*/{};

  /* @comun: este bloque (hasta @fin-comun) lo usa también la página de Nota: está en comun.js y Astro lo suma a las dos. */
/*__COMUN__*/  /* @fin-comun */

  /* --- Estado ------------------------------------------------------------- */
  var estado = { q: "", tipos: {}, anios: {}, orden: "new" };
  var lista = [];
  var pintadas = 0;
  var TANDA = 30;
  var $ = function (id) { return document.getElementById(id); };
  var grid = $("pf-grid");
  var esMobile = window.matchMedia("(max-width: 640px)");
  function activos(o) { return Object.keys(o).filter(function (k) { return o[k]; }); }

  function pasa(n, salvo) {
    var q = plano(estado.q.trim());
    if (q && n.buscable.indexOf(q) === -1) return false;
    var ts = activos(estado.tipos), as = activos(estado.anios);
    if (salvo !== "tipo" && ts.length && ts.indexOf(n.tp) === -1) return false;
    if (salvo !== "anio" && as.length && as.indexOf(n.anio) === -1) return false;
    return true;
  }
  function filtrar() {
    lista = NOTAS.filter(function (n) { return pasa(n); });
    if (estado.orden === "new") lista.reverse();
  }

  /* --- Masonry ------------------------------------------------------------ */
  var cols = [];
  // Columnas segun el ancho y el tamaño elegido (chico, medio, grande).
  // Medio es el automatico de siempre; en mobile no hay chico.
  var vista = "medio";
  try { vista = localStorage.getItem("novedades-vista") || "medio"; } catch (e) {}
  function cuantasCols() {
    var w = grid.clientWidth;
    if (w < 700) return vista === "grande" ? 1 : 2;
    if (w < 1020) return { chico: 4, medio: 3, grande: 2 }[vista];
    if (w < 1260) return { chico: 5, medio: 4, grande: 3 }[vista];
    return { chico: 6, medio: 5, grande: 3 }[vista];
  }
  // Lleva el indicador del selector al boton elegido. Sin animar: aparece ahi.
  function moverInd(seg, animar) {
    var ind = seg.querySelector(".pf-selector__ind"), b = seg.querySelector('button[aria-pressed="true"]');
    if (!b || !b.offsetWidth) return;
    if (!animar) ind.classList.add("pf-quieto");
    ind.style.width = b.offsetWidth + "px";
    ind.style.transform = "translateX(" + b.offsetLeft + "px)";
    if (!animar) { void ind.offsetWidth; ind.classList.remove("pf-quieto"); }
  }
  function moverInds() { document.querySelectorAll(".pf-selector").forEach(function (s) { moverInd(s, false); }); }
  function marcarVista(animar) {
    document.querySelectorAll(".pf-selector.pf-vista button").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.vista === vista)); });
    moverInd(document.querySelector(".pf-selector.pf-vista"), animar);
  }

  function armarCols() {
    grid.innerHTML = ""; cols = [];
    for (var i = 0, n = cuantasCols(); i < n; i++) { var c = document.createElement("div"); c.className = "pf-gcol"; grid.appendChild(c); cols.push(c); }
  }
  // Miniatura local de la foto de la nota (fuente/bajar-miniaturas.py); n.mi = [ancho, alto].
  function fotoMini(n) {
    var r = Math.min(Math.max(n.mi[0] / n.mi[1], 3 / 4), 16 / 9);
    return '<img src="fotos/mini/' + encodeURIComponent(n.ar) + '.webp" alt="" loading="lazy" decoding="async" style="aspect-ratio:' + r.toFixed(4) + '">';
  }
  function conArte(n) { return n.v || ((n.id * 2654435761) >>> 0) % 100 < 46; }

  function tarjeta(n, idx) {
    var q = plano(estado.q.trim());
    // Cada tarjeta es un enlace a su página de Nota.
    var b = document.createElement("a");
    b.href = encodeURIComponent(n.ar) + "/"; b.className = "pf-card"; b.dataset.idx = idx; b.dataset.id = n.id;
    var when = '<p class="pf-when"><b>' + fecha(n.f) + "</b></p>";
    var h;
    if (conArte(n)) {
      var pr = PROP[n.id % PROP.length];
      h = '<div class="pf-media">' + (n.mi ? fotoMini(n) : arte(n, pr[0] * 60, pr[1] * 60, n.id * 7919 + 13)) + etq(n.tp, { dato: n.anio }) +
        (n.v ? '<span class="pf-play"><svg viewBox="0 0 12 14"><path d="M0 0l12 7-12 7Z"/></svg></span>' : "") + "</div>" +
        '<div class="pf-meta">' + when + '<p class="pf-ttl">' + resaltar(n.t, q) + "</p></div>";
    } else {
      h = '<div class="pf-lead">' + etq(n.tp, { dato: n.anio }) + "<h3>" + resaltar(n.t, q) + '</h3></div><div class="pf-meta">' + when + "</div>";
    }
    b.innerHTML = h;
    var im = b.querySelector(".pf-media > img");
    if (im) {
      var lista = function () { im.classList.add("pf-lista"); };
      if (im.complete && im.naturalWidth) lista(); else im.addEventListener("load", lista);
      // Si la foto no carga, vuelve el arte.
      im.addEventListener("error", function () { var pr = PROP[n.id % PROP.length]; im.outerHTML = arte(n, pr[0] * 60, pr[1] * 60, n.id * 7919 + 13); });
    }
    b.setAttribute("aria-label", n.t + ". " + POR[n.tp].nombre + ", " + fecha(n.f, true));
    return b;
  }
  // Cada tarjeta se arma una sola vez y se reusa al cambiar de vista o de
  // filtro: la foto ya cargada no se vuelve a decodificar ni a fundir. Si
  // cambia la búsqueda se rehacen, porque el título lleva el resaltado.
  var hechas = {}, hechasQ = null;
  function tarjetaDe(n, idx) {
    var q = estado.q.trim();
    if (q !== hechasQ) { hechas = {}; hechasQ = q; }
    var b = hechas[n.id] || (hechas[n.id] = tarjeta(n, idx));
    b.dataset.idx = idx;
    return b;
  }
  // Masonry por tandas. Las tarjetas nuevas se miden todas juntas en una
  // columna invisible del mismo ancho y se reparten con esas alturas: el
  // navegador hace una sola cuenta por tanda y no una por tarjeta.
  function pintarTanda() {
    var hasta = Math.min(pintadas + TANDA, lista.length);
    if (hasta <= pintadas) return;
    var nuevas = [];
    for (var i = pintadas; i < hasta; i++) nuevas.push(tarjetaDe(lista[i], i));
    var alto = cols.map(function (c) { return c.offsetHeight; });
    var cuantas = cols.map(function (c) { return c.childElementCount; });
    var med = document.createElement("div");
    med.className = "pf-gcol pf-medidor"; med.style.width = cols[0].offsetWidth + "px";
    nuevas.forEach(function (b) { med.appendChild(b); });
    grid.appendChild(med);
    var gap = parseFloat(getComputedStyle(med).rowGap) || 0;
    var hs = nuevas.map(function (b) { return b.offsetHeight; });
    grid.removeChild(med);
    var destino = cols.map(function () { return document.createDocumentFragment(); });
    nuevas.forEach(function (b, k) {
      var c = 0;
      for (var j = 1; j < cols.length; j++) if (alto[j] < alto[c]) c = j;
      alto[c] += (cuantas[c] ? gap : 0) + hs[k]; cuantas[c]++;
      destino[c].appendChild(b);
    });
    cols.forEach(function (c, j) { c.appendChild(destino[j]); });
    pintadas = hasta;
  }
  // Rehace la grilla sin mover la página. Mientras se arma, la grilla queda
  // vacía un instante: Safari mide ahí, ve una página corta y recorta el
  // scroll (sin anclaje de scroll, no lo recupera). Por eso la grilla guarda
  // su alto hasta terminar y el scroll vuelve a donde estaba.
  function repintar(mantener) {
    var objetivo = mantener ? Math.max(pintadas, TANDA) : TANDA;
    var y = window.scrollY;
    grid.style.minHeight = grid.offsetHeight + "px";
    armarCols(); pintadas = 0;
    while (pintadas < Math.min(objetivo, lista.length)) pintarTanda();
    $("pf-empty").hidden = lista.length > 0;
    grid.style.minHeight = "";
    if (window.scrollY !== y) saltar(y);
  }

  /* --- Años ----------------------------------------------------------------- */
  var ANIOS = [];
  var PRINCIPALES = TIPOS.map(function (x) {
    return { id: x.id, n: NOTAS.filter(function (n) { return n.tp === x.id; }).length };
  }).sort(function (a, b) { return b.n - a.n; }).slice(0, 3).map(function (x) { return x.id; });
  NOTAS.forEach(function (n) { if (n.anio && ANIOS.indexOf(n.anio) === -1) ANIOS.push(n.anio); });
  ANIOS.sort().reverse();

  /* --- Filtros ------------------------------------------------------------ */
  function contar(campo, v) {
    return NOTAS.reduce(function (s, n) {
      if (!pasa(n, campo)) return s;
      var ok = campo === "tipo" ? n.tp === v : n.anio === v;
      return s + (ok ? 1 : 0);
    }, 0);
  }
  function pintarFiltros() {
    var ninguno = !activos(estado.tipos).length;
    var todas = '<button type="button" class="pf-pastilla pf-pastilla--todas" data-f="todas" aria-pressed="' + ninguno + '">Todas</button>';
    function pill(x) {
      return '<button type="button" class="pf-pastilla" style="--pc:' + x.f.bg + '" data-f="tipo" data-v="' + x.id + '" aria-pressed="' + !!estado.tipos[x.id] + '">' + x.nombre + "</button>";
    }
    // Barra: "Todas" y las tres categorias con mas notas (mas la activa, si es
    // otra). Panel: todas, en desktop y en mobile.
    var barra = TIPOS.filter(function (x) { return PRINCIPALES.indexOf(x.id) !== -1 || estado.tipos[x.id]; });
    $("pf-fTipos").innerHTML = todas + barra.map(pill).join("");
    $("pf-fTiposTodas").innerHTML = todas + TIPOS.map(pill).join("");
    $("pf-fAnios").innerHTML = ANIOS.map(function (a) {
      return '<button type="button" class="pf-chip" data-f="anio" data-v="' + a + '" aria-pressed="' + !!estado.anios[a] + '">' + a + '<b class="pf-chip__n">' + contar("anio", a) + "</b></button>";
    }).join("");
  }
  function resumen() {
    var partes = [];
    [[estado.tipos, TIPOS]].forEach(function (g) {
      var a = activos(g[0]).map(function (k) { return POR[k].nombre; });
      if (a.length) partes.push(a.join(", "));
    });
    var as = activos(estado.anios).sort();
    if (as.length) partes.push(as.join(", "));
    var q = estado.q.trim();
    var t = "<b>" + lista.length + "</b> " + (lista.length === 1 ? "nota" : "notas");
    if (q) t += " con «" + esc(q) + "»";
    if (partes.length) t += " · " + esc(partes.join(" · "));
    if (!q && !partes.length) t = "Todas las notas · <b>" + lista.length + "</b>";
    $("pf-resultText").innerHTML = t;
    $("pf-qCount").textContent = lista.length;
    var nf = activos(estado.tipos).length + as.length;
    var nsub = esMobile.matches ? nf : as.length;
    $("pf-fCount").hidden = nsub === 0; $("pf-fCount").textContent = nsub;
    $("pf-fClear").hidden = nf === 0;
    $("pf-emptyText").textContent = q
      ? "Ninguna nota coincide con «" + q + "»" + (nf ? " con esos filtros" : "") + ". Probá con otra palabra o limpiá los filtros."
      : "Ninguna nota cumple esa combinación de filtros. Sacá alguno para ver más.";
  }
  function aplicar() { filtrar(); resumen(); pintarFiltros(); repintar(false); }

  /* --- Eventos -------------------------------------------------------------- */
  esMobile.addEventListener("change", function () { resumen(); pintarFiltros(); });
  var tq;
  $("pf-q").addEventListener("input", function (e) { clearTimeout(tq); tq = setTimeout(function () { estado.q = e.target.value; aplicar(); }, 120); });
  // La X cierra el buscador y borra la busqueda (como Escape).
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
    if (e.key === "/" && document.activeElement !== $("pf-q")) { e.preventDefault(); abrirBusca(true); }
  });
  // La barra toma el azul cuando termina el carrusel.
  function barraSolida() { $("pf-top").classList.toggle("pf-barra--solida", window.scrollY > $("pf-dest").offsetHeight - 80); }
  window.addEventListener("scroll", barraSolida, { passive: true });
  // Mobile: el dock de filtros se achica al bajar y vuelve al subir. Umbral de
  // unos px para que el rebote del scroll no lo haga titilar.
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


  /* --- Selectores fijos (la lógica de la Sala de prensa) --------------------------------------------- */
  // La fila pasa a fixed cuando llega a la barra y vuelve a su lugar cuando baja. El hueco guarda su tamaño (la página no se mueve) y le
  // da a la fila su izquierda y su ancho.
  var herr = document.querySelector(".pf-herramientas"), herrLugar = document.createElement("div");
  herrLugar.className = "pf-herr-lugar";
  herr.parentNode.insertBefore(herrLugar, herr);
  // Acá no hay --pf-barra-h (lo arma el campo de la cabecera, que Novedades no tiene): se mide la barra.
  function topFijo() { return $("pf-top").offsetHeight + 9; }
  var atada = !!(window.CSS && CSS.supports && CSS.supports("animation-timeline: scroll()")), recorrido = 0, anchoAntes = -1;
  function herrFija() { return enCel ? vuelve.fija() : atada ? window.scrollY >= recorrido - 1 : herr.classList.contains("pf-fija"); }
  /* En escritorio, donde el navegador lo soporta, la fila no se fija por JS: va siempre fixed y la mueve el navegador atada al
     scroll (CSS .pf-atada). Acá el carrusel tiene ocupada la página y el JS llegaba un cuadro tarde: la fila se pasaba de largo bajo la
     barra y volvía de un salto. El JS solo mide dónde empieza (y0), dónde queda (debajo de la barra) y cuánto recorre. */
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
  function mostrarHerr(si) { if (herr && !enCel) herr.classList.toggle("pf-escondida", !si); }
  function soltarHerr() {
    herr.classList.remove("pf-fija"); herrLugar.classList.remove("pf-activo");
    herrLugar.style.width = herrLugar.style.height = herr.style.left = herr.style.width = herr.style.top = "";
    mostrarHerr(true);
  }
  function fijarHerr() {
    if (enCel) return;
    var fija = herrFija(), r = (fija ? herrLugar : herr).getBoundingClientRect(), debe = r.top <= topFijo();
    if (debe === fija) return;
    if (!debe) { soltarHerr(); return; }
    herrLugar.style.width = r.width + "px"; herrLugar.style.height = r.height + "px"; herrLugar.classList.add("pf-activo");
    herr.style.left = r.left + "px"; herr.style.width = r.width + "px"; herr.style.top = topFijo() + "px"; herr.classList.add("pf-fija");
  }
  /* Celular: la barra de vista va con su caja y vuelve al subir (PFBarraVista, en componentes/barra-vista.js). Lo de arriba (atar, fijarHerr) queda
     solo para escritorio. Al cruzar los 640 px (girar el teléfono, achicar la ventana) se pasa de un modo al otro. */
  var enCel = false, vuelveMarca = document.createElement("div"), filaResultado = document.querySelector(".pf-result-row");
  vuelveMarca.className = "pf-vuelve-marca";
  var vuelve = PFBarraVista.queVuelve(herr, vuelveMarca, topFijo);
  PFBarraVista.alPixel(document.querySelector("main"), $("pf-dest"));
  function modoHerr() {
    enCel = esMobile.matches;
    filaResultado.classList.toggle("pf-vuelve-sin", enCel);
    if (enCel) {
      herr.classList.remove("pf-atada", "pf-fija", "pf-escondida"); herrLugar.classList.remove("pf-activo");
      herrLugar.style.width = herrLugar.style.height = herr.style.left = herr.style.width = herr.style.top = "";
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
    // Si algo de arriba cambia de alto (el carrusel, la grilla que crece, las fuentes), se vuelve a medir dónde empieza.
    if (window.ResizeObserver) new ResizeObserver(function () { atar(); }).observe(document.body);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { anchoAntes = -1; atar(); });
  } else {
    window.addEventListener("scroll", fijarHerr, { passive: true });
    window.addEventListener("resize", function () { if (herrFija()) soltarHerr(); fijarHerr(); });
    fijarHerr();
  }
  herr.addEventListener("focusin", function () { mostrarHerr(true); });
  // Saltos de scroll que hace la página (rehacer la grilla, ir a la lista): no son del usuario, así que ni el dock ni la fila los leen
  // como bajar o subir.
  var hastaSinDir = 0;
  function saltar(y) {
    hastaSinDir = performance.now() + 150;
    mostrarHerr(true);
    window.scrollTo({ top: y, behavior: "instant" });
    if (enCel) vuelve.saltar();
  }
  barraSolida();
  $("pf-filters").addEventListener("click", function (e) {
    var b = e.target.closest("[data-f]"); if (!b) return;
    if (b.dataset.f === "todas") { estado.tipos = {}; aplicar(); return; }
    // Categoria: una sola a la vez (tocar la activa vuelve a "Todas"). Año: varios.
    if (b.dataset.f === "tipo") { var on = !estado.tipos[b.dataset.v]; estado.tipos = {}; if (on) estado.tipos[b.dataset.v] = true; }
    else estado.anios[b.dataset.v] = !estado.anios[b.dataset.v];
    aplicar();
  });
  function limpiar() { estado.tipos = {}; estado.anios = {}; estado.q = ""; $("pf-q").value = ""; aplicar(); }
  $("pf-fClear").addEventListener("click", limpiar);
  $("pf-emptyReset").addEventListener("click", limpiar);
  // El panel anima su alto en px: se mide el alto final (con el ancho final,
  // sin transiciones y sin pintar), se arranca desde el actual y al terminar
  // queda en auto con scroll (.listo). Mientras dura, el contenido queda fijo
  // en el ancho final: si no, en mobile las pastillas se reacomodan cuadro a
  // cuadro mientras el panel se ensancha y la animacion se ve sucia.
  var tListo;
  function abrirFiltros(si) {
    var f = $("pf-filters"), b = $("pf-fBody");
    clearTimeout(tListo);
    var desde = b.offsetHeight, anchoAhora = b.firstElementChild.offsetWidth;
    f.style.transition = b.style.transition = "none";
    f.classList.remove("pf-listo");
    f.classList.toggle("pf-abierto", si);
    b.style.height = "";
    var hasta = si ? (f.classList.add("pf-listo"), b.offsetHeight) : 0;
    var ancho = si ? b.clientWidth : anchoAhora;
    b.firstElementChild.style.width = ancho + "px";
    f.classList.remove("pf-listo");
    f.classList.toggle("pf-abierto", !si);
    b.style.height = desde + "px";
    void f.offsetWidth;
    f.style.transition = b.style.transition = "";
    f.classList.toggle("pf-abierto", si);
    b.style.height = hasta + "px";
    $("pf-fToggle").setAttribute("aria-expanded", String(si));
    // Respaldo del transitionend (sin animacion, p. ej. con movimiento reducido).
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
  // Se cierra con el botón de la barra, con Escape y tocando afuera (como en la Biblioteca). El toque de afuera solo cierra: el clic
  // que le sigue se descarta para no abrir de rebote la nota que estaba debajo (el ancla queda afuera: cierra y además baja).
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
  abrirFiltros(false);
  function ordenar(o) { estado.orden = o; $("pf-sortNew").setAttribute("aria-pressed", String(o === "new")); $("pf-sortOld").setAttribute("aria-pressed", String(o === "old")); moverInd(document.querySelector(".pf-selector.pf-orden"), true); aplicar(); }
  $("pf-sortNew").addEventListener("click", function () { ordenar("new"); });
  $("pf-sortOld").addEventListener("click", function () { ordenar("old"); });
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (en) { if (en[0].isIntersecting && pintadas < lista.length) pintarTanda(); }, { rootMargin: "900px 0px" }).observe($("pf-sentinel"));
  } else { TANDA = 1000; }
  function enPantalla() {
    var h = window.innerHeight, out = [];
    grid.querySelectorAll(".pf-card").forEach(function (b) { var r = b.getBoundingClientRect(); if (r.bottom > 0 && r.top < h) out.push(b); });
    return out;
  }
  function nombrar(tarjetas, si) { tarjetas.forEach(function (b) { b.style.viewTransitionName = si ? "pf-nota-" + b.dataset.id : ""; }); }
  var nCols = cuantasCols();
  window.addEventListener("resize", function () { moverInds(); var n = cuantasCols(); if (n !== nCols) { nCols = n; repintar(true); } });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(moverInds);
  document.querySelector(".pf-selector.pf-vista").addEventListener("click", function (e) {
    var b = e.target.closest("[data-vista]"); if (!b || b.dataset.vista === vista) return;
    vista = b.dataset.vista;
    try { localStorage.setItem("novedades-vista", vista); } catch (err) {}
    var n = cuantasCols(), cambia = n !== nCols;
    nCols = n;
    // Las tarjetas viajan a su lugar nuevo (View Transitions) y el indicador
    // viaja con ellas; sin soporte, el indicador se desliza y la grilla cambia directo.
    if (cambia && document.startViewTransition && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // Viajan solo las tarjetas que se ven: las que estaban en pantalla y las
      // que entran. El resto cambia de golpe fuera de vista. Con todas
      // nombradas, el navegador fotografiaba cientos de tarjetas en cada cambio.
      var raiz = document.documentElement; raiz.classList.add("pf-vt-vista");
      var nombradas = enPantalla();
      nombrar(nombradas, true);
      document.startViewTransition(function () {
        marcarVista(false); repintar(true);
        var nuevas = enPantalla(); nombrar(nuevas, true); nombradas = nombradas.concat(nuevas);
      }).finished.finally(function () { raiz.classList.remove("pf-vt-vista"); nombrar(nombradas, false); });
    }
    else { marcarVista(true); if (cambia) repintar(true); }
  });
  // En mobile no hay chico: si estaba elegido, se ve como medio.
  if (vista === "chico" && matchMedia("(max-width: 640px)").matches) vista = "medio";
  marcarVista(false);
  moverInds();

  /* --- Ancla --------------------------------------------------------------
     Una sola accion que cambia de sentido.
     Arriba de la lista apunta abajo y baja una pantalla; mas abajo apunta
     arriba y vuelve al principio de la lista (no al carrusel: ahi el dock se
     esconde, y al volver al principio de las notas quedan a mano el orden y
     los filtros). El rebote vive solo en el giro de la flecha; el circulo
     sigue al dock sin rebote y aparece y se aplasta con resortes amortiguados. */
  var ancla = $("pf-ancla"), cuerpo = ancla.firstElementChild, flecha = cuerpo.firstElementChild;
  var quieto = matchMedia("(prefers-reduced-motion: reduce)");
  // Resortes: masa 1, rigidez k, amortiguacion c. c = 2*raiz(k) no rebota.
  // Los valores son tokens del Figma Master (06 · Web, Web/Resorte/* y
  // Web/Proporción/*): tokens.css los pone en :root y aca se leen.
  var raiz = getComputedStyle(document.documentElement);
  function tk(n) { return parseFloat(raiz.getPropertyValue("--" + n)); }
  var GAP = tk("ancla-gap"), APRETAR = tk("ancla-apretar"), BAJAR = tk("ancla-bajar"), CAMBIO = tk("ancla-cambio");
  function R(x, k, c) { return { x: x, v: 0, t: x, k: k, c: c }; }
  var M = {
    s: R(0, tk("ancla-aparecer-k"), tk("ancla-aparecer-c")), // aparece y se va con el dock, sin rebote
    q: R(1, tk("ancla-apretar-k"), tk("ancla-apretar-c")),   // aplaste al apretar, sin rebote
    r: R(90, tk("ancla-giro-k"), tk("ancla-giro-c"))          // giro: el unico que rebota
  };
  function inicioLista() { return Math.max(0, document.querySelector("main").offsetTop - $("pf-top").offsetHeight - 8); }
  function arriba() { return window.scrollY > inicioLista() + window.innerHeight * CAMBIO; }
  function medir() {
    var f = $("pf-filters"), r = f.getBoundingClientRect();
    var fuera = f.classList.contains("pf-fuera");
    M.s.t = fuera || !lista.length ? 0 : 1;
    var sube = arriba();
    M.r.t = sube ? -90 : 90;
    ancla.setAttribute("aria-label", sube ? "Volver al principio de las notas" : "Bajar");
    ancla.tabIndex = M.s.t ? 0 : -1;
    // Desktop: la x sale del dock (en mobile la pone el CSS).
    if (!esMobile.matches) document.documentElement.style.setProperty("--ancla-x", (r.right + GAP).toFixed(2) + "px");
  }
  function paso(s, dt) { var ac = -s.k * (s.x - s.t) - s.c * s.v; s.v += ac * dt; s.x += s.v * dt; }
  var tAntes = performance.now();
  function anim(now) {
    var dt = Math.min(0.05, (now - tAntes) / 1000); tAntes = now;
    medir();
    if (quieto.matches) { for (var k in M) { M[k].x = M[k].t; M[k].v = 0; } }
    else { var n = Math.ceil(dt / 0.004); for (var j = 0; j < n; j++) for (var k2 in M) paso(M[k2], dt / n); }
    var s = Math.max(0, M.s.x) * M.q.x;
    ancla.style.transform = "scale(" + s.toFixed(4) + ")";
    flecha.style.transform = "rotate(" + M.r.x.toFixed(2) + "deg)";
    requestAnimationFrame(anim);
  }
  requestAnimationFrame(anim);

  ancla.addEventListener("pointerdown", function () { M.q.t = APRETAR; });
  function soltarAncla() { M.q.t = 1; }
  ancla.addEventListener("pointerup", soltarAncla);
  ancla.addEventListener("pointercancel", soltarAncla);
  ancla.addEventListener("pointerleave", soltarAncla);
  ancla.addEventListener("click", function () {
    if ($("pf-filters").classList.contains("pf-abierto")) abrirFiltros(false);
    var suave = quieto.matches ? "auto" : "smooth";
    if (arriba()) window.scrollTo({ top: inicioLista(), behavior: suave });
    else window.scrollBy({ top: Math.round(window.innerHeight * BAJAR), behavior: suave });
  });

  /* --- Destacadas ---------------------------------------------------------------
     Cinco notas a pantalla completa. Por defecto, las mas recientes; si
     DESTACADAS trae rutas (n.u), mandan esas, en ese orden. */
  var DESTACADAS = [
    "noticias-recientes/profertil-recibio-a-su-visitante-numero-60-000",
    "noticias-recientes/donacion-al-cfp-n401-que-fortalece-la-formacion-en-oficios",
    "noticias-recientes/somos-profertil/nueva-edicion-del-programa-de-becas-educar-para-transformar",
    "noticias-recientes/profertil-fue-reconocida-con-3-premios-dircoms",
    "noticias-recientes/laboratorios-quimica"
  ];
  var dest = DESTACADAS.length
    ? DESTACADAS.map(function (u) { return NOTAS.filter(function (n) { return n.u === u; })[0]; }).filter(Boolean)
    : NOTAS.slice(-5).reverse();
  // Colores de cada placa: fondo, Flor de atras y Flor de adelante. Fondos
  // oscuros de la paleta (el texto tiza va encima) y flores en dos colores
  // vivos, como la historia de Practicas Profesionales (azul, verde, celeste).
  var PARES_DEST = [
    ["#2D8035", "#5EB53A", "#4086FF"],
    ["#003DA5", "#2D8035", "#4086FF"],
    ["#8A4818", "#E57F19", "#EABA2C"],
    ["#2D8035", "#EABA2C", "#5EB53A"],
    ["#003DA5", "#4086FF", "#EABA2C"]
  ];
  // Foto: la de la nota. Primero la copia local (n.imgL), despues la grande del
  // sitio actual (n.imgG) y la principal (n.img); si ninguna carga, una de banco.
  var FOTOS_DEMO = [1, 2, 3, 4, 5].map(function (i) { return "../novedades/fotos/demo-" + i + ".webp"; });
  function flor() {
    return '<svg viewBox="' + A.formas.flor.vb + '" aria-hidden="true"><use href="#pf-forma-flor" fill="currentColor"/></svg>';
  }
  function escena(n, k) {
    var demo = FOTOS_DEMO[k % FOTOS_DEMO.length];
    return '<div class="pf-d-esc">' +
      '<div class="pf-d-capa pf-d-atras"><div class="pf-d-desliz">' + flor() + "</div></div>" +
      '<div class="pf-d-capa pf-d-foto"><div class="pf-d-desliz"><div class="pf-d-recorte"><img class="pf-carga" src="' + esc(n.imgL || n.imgG || n.img || demo) + '" data-demo="' + demo + '" alt="" decoding="async"' + (k ? ' loading="lazy"' : "") + "></div></div></div>" +
      '<div class="pf-d-capa pf-d-frente"><div class="pf-d-desliz">' + flor() + "</div></div></div>";
  }
  var FLECHA_CTA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  $("pf-dSlides").innerHTML = dest.map(function (n, k) {
    var c = PARES_DEST[k % PARES_DEST.length];
    return '<article class="pf-d-slide" role="group" aria-roledescription="nota" aria-label="' + (k + 1) + " de " + dest.length + '" inert style="--fondo:' + c[0] + ";--atras:" + c[1] + ";--frente:" + c[2] + '">' +
      '<div class="pf-d-art">' + escena(n, k) + "</div>" +
      '<div class="pf-d-txt"><div class="pf-wrap"><div class="pf-d-in">' +
      '<div class="pf-d-kick">' + etq(n.tp, { dato: fechaDato(n.f) }) + "</div>" +
      "<h2" + (n.t.length > 80 ? ' class="pf-largo"' : "") + ">" + esc(n.t) + "</h2>" +
      (n.b ? '<p class="pf-d-bajada">' + esc(n.b) + "</p>" : "") +
      '<a class="pf-d-cta" href="' + encodeURIComponent(n.ar) + '/">Leer la nota ' + FLECHA_CTA + "</a>" +
      "</div></div></div></article>";
  }).join("");
  $("pf-dSegs").style.setProperty("--n", dest.length);
  $("pf-dSegs").innerHTML = dest.map(function (n, k) {
    return '<button class="pf-d-seg" type="button" data-k="' + k + '" aria-label="Ver destacada ' + (k + 1) + ": " + esc(n.t) + '">' +
      '<span class="pf-d-bar"><i></i></span></button>';
  }).join("");
  // Las fotos aparecen con un fundido al cargar; si la de la nota falla, va la de prueba.
  [].forEach.call($("pf-dSlides").querySelectorAll(".pf-d-foto img"), function (img) {
    function lista() { img.classList.remove("pf-carga"); }
    if (img.complete && img.naturalWidth) lista();
    img.addEventListener("load", lista);
    img.addEventListener("error", function () { if (img.getAttribute("src") !== img.dataset.demo) img.src = img.dataset.demo; });
  });
  var slides = $("pf-dSlides").children, segs = $("pf-dSegs").children, dk = -1;
  var barras = [].map.call(segs, function (s) { return s.querySelector(".pf-d-bar i"); });
  // Tiempos del carrusel: salen de los tokens (--carrusel-*), como el resto.
  var raiz = getComputedStyle(document.documentElement);
  var DURA = parseFloat(raiz.getPropertyValue("--carrusel-dura")) || 7000;
  var PASE = parseFloat(raiz.getPropertyValue("--carrusel-pase")) || 700;
  var CURVA = raiz.getPropertyValue("--carrusel-curva").trim() || "cubic-bezier(0.65, 0, 0.25, 1)";
  var dEl = $("pf-dest"), motivos = {}, pausado = false;
  function pausa(motivo, si) {
    motivos[motivo] = si;
    pausado = Object.keys(motivos).some(function (m) { return motivos[m]; });
  }
  function rot(k) { return (k + dest.length) % dest.length; }
  // Pone la placa i en f anchos de pantalla (0 en el centro, 1 a la derecha).
  // Las capas de adentro leen --sx y --tr para moverse a su propia velocidad.
  // tr (opcional) reemplaza la transicion del pase: la usa el dedo al soltar.
  function poner(i, f, animar, tr) {
    tr = animar ? (tr || "transform " + PASE + "ms " + CURVA) : "none";
    var s = slides[i].style;
    slides[i]._g = (slides[i]._g || 0) + 1; // cada movimiento nuevo invalida los "esconder" pendientes
    s.transition = tr;
    s.transform = "translateX(" + f * 100 + "%)";
    s.setProperty("--sx", f);
    s.setProperty("--tr", tr);
  }
  // Pasa a la nota k. dir: 1 entra por la derecha, -1 por la izquierda.
  // yaPuesta: la placa nueva ya esta donde la dejo el dedo.
  function irA(k, dir, yaPuesta, tr) {
    k = rot(k);
    var viejo = dk;
    transcurrido = 0;
    if (k === viejo) { poner(k, 0, true, tr); return; }
    dir = dir || (k > viejo ? 1 : -1);
    for (var i = 0; i < slides.length; i++) if (i !== viejo && i !== k) slides[i].classList.remove("pf-vis");
    if (!yaPuesta) poner(k, dir, false);
    slides[k].classList.add("pf-vis");
    void slides[k].offsetWidth;
    poner(k, 0, viejo >= 0, tr);
    slides[k].classList.add("pf-on"); slides[k].inert = false;
    if (viejo >= 0) {
      poner(viejo, -dir, true, tr);
      slides[viejo].classList.remove("pf-on"); slides[viejo].inert = true;
      var g = slides[viejo]._g, T = tr ? parseFloat(tr.split(" ")[1]) : PASE;
      setTimeout(function () { if (viejo !== dk && !arrastre && slides[viejo]._g === g) slides[viejo].classList.remove("pf-vis"); }, T + 40);
    }
    for (var j = 0; j < segs.length; j++) {
      segs[j].classList.toggle("pf-on", j === k);
      if (j === k) segs[j].setAttribute("aria-current", "true"); else segs[j].removeAttribute("aria-current");
    }
    dk = k;
  }
  // Barras como en las stories: las anteriores llenas, la actual llenandose.
  // Las mueve el JS, asi andan aunque el sistema tenga reducido el movimiento.
  var transcurrido = 0, ultimo = 0;
  function tic(t) {
    var d = ultimo ? Math.min(t - ultimo, 100) : 0;
    ultimo = t;
    if (!pausado && !arrastre) {
      transcurrido += d;
      if (transcurrido >= DURA) irA(dk + 1, 1);
    }
    for (var i = 0; i < barras.length; i++) {
      var p = i < dk ? 1 : i > dk ? 0 : Math.min(1, transcurrido / DURA);
      barras[i].style.transform = "scaleX(" + p + ")";
    }
    requestAnimationFrame(tic);
  }
  $("pf-dSegs").addEventListener("click", function (e) { var b = e.target.closest(".pf-d-seg"); if (b) irA(Number(b.dataset.k)); });
  $("pf-dPrev").addEventListener("click", function () { irA(dk - 1, -1); });
  $("pf-dNext").addEventListener("click", function () { irA(dk + 1, 1); });
  dEl.addEventListener("focusin", function (e) { if (e.target.matches(":focus-visible")) pausa("foco", true); });
  dEl.addEventListener("focusout", function (e) { if (!dEl.contains(e.relatedTarget)) pausa("foco", false); });
  dEl.addEventListener("keydown", function (e) {
    if (e.key === "ArrowLeft") irA(dk - 1, -1);
    if (e.key === "ArrowRight") irA(dk + 1, 1);
  });

  /* Gestos de stories sobre las placas (no sobre botones ni indicadores):
     toque corto a la derecha pasa y a la izquierda vuelve; mantener apretado
     pausa; en touch, arrastrar de costado mueve la placa con el dedo.
     El dedo manda: si toca a mitad de un pase, la placa queda donde estaba
     (no salta) y sigue desde ahi. Al soltar, la placa sale con la velocidad
     que traia el dedo y frena suave: la curva arranca con esa pendiente y la
     duracion depende de lo que falta recorrer. Asi no hay un corte entre el
     arrastre y la animacion. */
  var arrastre = null;
  // Donde esta la placa i ahora (en anchos de pantalla), aunque este animando.
  function dondeEsta(i) {
    var m = getComputedStyle(slides[i]).transform;
    if (!m || m === "none") return 0;
    return new DOMMatrixReadOnly(m).m41 / dEl.clientWidth;
  }
  dEl.addEventListener("pointerdown", function (e) {
    if (e.button > 0 || e.target.closest("button, a, .pf-d-nav")) return;
    var a = arrastre = { x0: e.clientX, y0: e.clientY, t0: Date.now(), dx: 0, mueve: false, vecino: -1, base: 0, agarro: false, muestras: [], touch: e.pointerType !== "mouse" };
    pausa("toque", true);
    if (!a.touch) return;
    // Congela el pase si estaba en marcha: la placa actual y la que la acompaña.
    var p = dondeEsta(dk);
    if (Math.abs(p) > 0.002) {
      a.agarro = true; a.base = p;
      for (var i = 0; i < slides.length; i++) {
        if (i === dk || !slides[i].classList.contains("pf-vis")) continue;
        poner(i, dondeEsta(i), false); a.vecino = i;
      }
      poner(dk, p, false);
    }
  });
  dEl.addEventListener("pointermove", function (e) {
    var a = arrastre; if (!a || !a.touch) return;
    a.dx = e.clientX - a.x0;
    if (!a.mueve) {
      if (Math.abs(a.dx) < 8 && !a.agarro) return;
      if (!a.agarro && Math.abs(e.clientY - a.y0) > Math.abs(a.dx)) { soltar(e, true); return; }
      if (Math.abs(a.dx) < 1) return;
      a.mueve = true;
      // Sin salto: el recorrido cuenta desde donde se decidio que es arrastre.
      a.x0 = e.clientX; a.dx = 0;
      try { dEl.setPointerCapture(e.pointerId); } catch (err) {}
    }
    var t = performance.now();
    a.muestras.push([t, e.clientX]);
    while (a.muestras.length > 2 && t - a.muestras[0][0] > 100) a.muestras.shift();
    var f = a.base + a.dx / dEl.clientWidth;
    var dir = f < 0 ? 1 : -1, v = rot(dk + dir);
    if (a.vecino !== v && a.vecino !== -1 && a.vecino !== dk) slides[a.vecino].classList.remove("pf-vis");
    a.vecino = v; a.dir = dir;
    poner(dk, f, false);
    if (v !== dk) { slides[v].classList.add("pf-vis"); poner(v, f + dir, false); }
  });
  // Velocidad del dedo en los ultimos 100 ms (px por ms; positiva hacia la derecha).
  function velocidad(a) {
    var m = a.muestras; if (m.length < 2) return 0;
    var u = m[m.length - 1], p = m[0];
    if (performance.now() - u[0] > 80) return 0; // se quedo quieto antes de soltar
    return (u[1] - p[1]) / Math.max(1, u[0] - p[0]);
  }
  // Transicion que continua el movimiento del dedo: d = px que faltan, v = px/ms a favor.
  function salida(d, v) {
    var w = dEl.clientWidth;
    var T = Math.round(Math.max(260, Math.min(PASE, PASE * Math.sqrt(d / w) * 1.1)));
    var x1 = 0.3, y1 = d > 1 ? Math.min(1, Math.max(0, v) * T / d * x1) : 0;
    return { T: T, tr: "transform " + T + "ms cubic-bezier(" + x1 + ", " + y1.toFixed(3) + ", 0.25, 1)" };
  }
  function soltar(e, cancelar) {
    var a = arrastre; if (!a) return;
    arrastre = null;
    pausa("toque", false);
    var w = dEl.clientWidth;
    if (!a.mueve) {
      if (a.agarro) {
        // Lo toco a mitad del pase y no lo movio: si fue un toque corto pasa
        // o vuelve como siempre; si no, el pase sigue desde donde quedo.
        if (!cancelar && Date.now() - a.t0 < 300) { if (e.clientX < w * 0.3) irA(dk - 1, -1); else irA(dk + 1, 1); return; }
        a.mueve = true; a.dx = 0;
      } else {
        if (cancelar) return;
        // Toque corto: pasa o vuelve. Mantenido: solo fue una pausa.
        if (Date.now() - a.t0 < 300) { if (e.clientX < w * 0.3) irA(dk - 1, -1); else irA(dk + 1, 1); }
        return;
      }
    }
    var vel = cancelar ? 0 : velocidad(a);
    var f = a.base + a.dx / w;
    // A donde va: un tiron rapido o mas de un 20% de recorrido en una direccion
    // pasa a la vecina de ese lado; si no, vuelve a la actual.
    var rapido = Math.abs(vel) > 0.5, lejos = Math.abs(a.dx) > w * 0.2;
    var hacia = rapido ? (vel < 0 ? 1 : -1) : a.dx < 0 ? 1 : -1;
    var pasa = !cancelar && (rapido || lejos) && (hacia === 1 ? f < 0 : f > 0);
    if (pasa) {
      var s1 = salida(Math.abs(f + hacia) * w, -hacia * vel);
      var k = rot(dk + hacia);
      if (a.vecino !== k && a.vecino !== -1 && a.vecino !== dk) slides[a.vecino].classList.remove("pf-vis");
      if (k !== dk) { slides[k].classList.add("pf-vis"); poner(k, f + hacia, false); }
      irA(k, hacia, true, s1.tr);
      return;
    }
    var s2 = salida(Math.abs(f) * w, f > 0 ? -vel : vel);
    poner(dk, 0, true, s2.tr);
    if (a.vecino !== -1 && a.vecino !== dk) {
      var d = f < 0 ? 1 : -1;
      poner(a.vecino, d, true, s2.tr);
      var vv = a.vecino, g = slides[vv]._g;
      setTimeout(function () { if (vv !== dk && !arrastre && slides[vv]._g === g) slides[vv].classList.remove("pf-vis"); }, s2.T + 40);
    }
  }
  dEl.addEventListener("pointerup", function (e) { soltar(e, false); });
  dEl.addEventListener("pointercancel", function (e) { soltar(e, true); });
  // Fuera de vista el carrusel se frena y el dock de filtros vuelve.
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (en) {
      var r = en[0].intersectionRatio;
      pausa("vista", r < 0.25);
      var tapa = en[0].isIntersecting && r > 0.4;
      if (tapa && $("pf-filters").classList.contains("pf-abierto")) abrirFiltros(false);
      $("pf-filters").classList.toggle("pf-fuera", tapa);
    }, { threshold: [0, 0.25, 0.4, 0.6, 1] }).observe(dEl);
  }
  irA(0);
  requestAnimationFrame(tic);

  aplicar();

  // Desde la página de Nota: #q=texto abre el buscador con esa búsqueda y baja a la lista; #buscar (la lupa de la
  // Nota) abre el buscador vacío, listo para escribir, con la lista a la vista.
  var pedido = decodeURIComponent(location.hash.slice(1));
  if (pedido.indexOf("q=") === 0 && pedido.length > 2) {
    $("pf-q").value = estado.q = pedido.slice(2);
    aplicar(); abrirBusca(true);
    saltar(inicioLista());
  } else if (pedido === "buscar") {
    abrirBusca(true);
    saltar(inicioLista());
  }
})();
