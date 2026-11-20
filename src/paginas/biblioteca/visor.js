
(function () {
  "use strict";
  var DOCS = window.PF_DOCS;
  var A = /*__ASSETS__*/{};
  function $(id) { return document.getElementById(id); }
  function plano(s) { return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); }
  function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  var defs = $("pf-defs"), simbolos = "";
  Object.keys(A.formas).forEach(function (k) { simbolos += '<symbol id="pf-forma-' + k + '" viewBox="' + A.formas[k].vb + '">' + A.formas[k].d + "</symbol>"; });
  defs.insertAdjacentHTML("beforeend", simbolos);

/*__COMUN__*/

  var FLECHA_IZQ = '<svg class="pf-flecha" viewBox="0 0 24 24" aria-hidden="true"><path d="M17 12H7M11 8l-4 4 4 4"/></svg>';
  var FLECHA_DER = '<svg class="pf-flecha" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 12h10M13 8l4 4-4 4"/></svg>';
  var BAJAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v13M6 13l6 6 6-6"/></svg>';

  // Qué documento: el de esta página (su dirección es biblioteca/<id>/).
  var pedido = /*__DOC__*/"";
  var d = DOCS.filter(function (x) { return x.id === pedido; })[0];
  // Un link a un documento que no existe vuelve a la lista.
  if (pedido && !d) { location.replace("../"); return; }
  d = d || DOCS[0];
  var cat = POR[d.c];
  // Dónde leer el PDF: la copia de la maqueta (la original no se puede leer desde otro dominio). `l` es un nombre de
  // archivo de ../pdf/ o una dirección completa de un alojamiento que permita leerlo.
  function copia(x) { return !x.l ? null : /^https?:\/\//.test(x.l) ? x.l : "../pdf/" + encodeURIComponent(x.l); }
  var url = copia(d);
  // La Biblioteca es la lista de esta maqueta. Las hojas de seguridad y los informes para inversores tienen su propia página
  // (fuera de esta maqueta): el visor los abre igual, sin el link de vuelta a una lista.
  // Cada documento vuelve a su lista: la Biblioteca o Hojas de seguridad. Inversores todavía no tiene la suya en la maqueta.
  var LISTAS = {
    biblioteca: { href: "../", nombre: "Biblioteca", titulo: "Biblioteca Virtual Profertil", todos: "Ver toda la Biblioteca",
      alcance: { seccion: "documentos", nombre: "Biblioteca", en: "la Biblioteca" } },
    msds: { href: "../../hojas-de-seguridad/", nombre: "Hojas de seguridad", titulo: "Hojas de seguridad Profertil", todos: "Ver todas las hojas", mas: "Más hojas de seguridad",
      alcance: { seccion: "hojas", nombre: "Hojas", en: "las hojas de seguridad" } },
    gacetilla: { href: "../../sala-de-prensa/#gacetillas", nombre: "Sala de prensa", titulo: "Sala de prensa Profertil", todos: "Ver todas las gacetillas", mas: "Más gacetillas",
      alcance: { seccion: "prensa", nombre: "Prensa", en: "la Sala de prensa" } },
    aviso: { href: "../../sala-de-prensa/#gacetillas", nombre: "Sala de prensa", titulo: "Sala de prensa Profertil", todos: "Ver todas las gacetillas", mas: "Más avisos a la comunidad",
      alcance: { seccion: "prensa", nombre: "Prensa", en: "la Sala de prensa" } }
  };
  var enBiblioteca = !/^(msds|inversores|gacetilla|aviso)$/.test(d.c);
  var suLista = enBiblioteca ? LISTAS.biblioteca : LISTAS[d.c] || null;
  document.title = d.t + " · " + (suLista ? suLista.titulo : "Profertil");
  // El buscador de la barra sugiere primero la sección del documento abierto (../../buscador/alcance.js lo lee al iniciar).
  // Sin lista propia (inversores), busca en todo el sitio.
  window.PF_ALCANCE = suLista ? suLista.alcance : { seccion: "" };

  /* --- Cabecera y datos -------------------------------------------------------------- */
  $("pf-cabIn").innerHTML =
    (suLista ? '<a class="pf-v-volver" href="' + suLista.href + '">' + FLECHA_IZQ + suLista.nombre + "</a>" : "") + etq(d.c, d.y || "") +
    "<h1" + (d.t.length > 90 ? ' class="pf-largo"' : "") + ">" + esc(d.t) + "</h1>";
  var bajarHref = url || d.u;
  function datos(paginas) {
    $("pf-datos").innerHTML =
      '<a class="pf-boton pf-boton--verde pf-v-bajar" href="' + esc(bajarHref) + '"' + (url ? " download" : ' target="_blank" rel="noopener"') + ">" + BAJAR + 'Descargar<span class="pf-v-pdf">&nbsp;PDF</span></a>' +
      '<div class="pf-v-par">' +
      (paginas ? '<span class="pf-v-pags"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h7l5 5v13H7zM14 3v5h5"/></svg>' + paginas + (paginas === 1 ? " página" : " páginas") + "</span>" : "") +
      (paginas ? '<button class="pf-v-foco" id="pf-foco" type="button" aria-pressed="false" aria-label="Modo lectura" title="Modo lectura"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg></button>' : "") +
      "</div>" +
      '<button class="pf-v-copiar" id="pf-copiar" type="button" aria-label="Copiar el link" title="Copiar el link"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg></button>';
    if (paginas) $("pf-foco").addEventListener("click", function () { foco(!document.body.classList.contains("pf-foco")); });
    $("pf-copiar").addEventListener("click", function () {
      var ok = function () { avisar("Link copiado"); };
      if (navigator.clipboard) navigator.clipboard.writeText(location.href).then(ok, function () { avisar("No se pudo copiar"); });
      else avisar("No se pudo copiar");
    });
  }
  datos(0);

  var ta;
  function avisar(txt) { var a = $("pf-aviso"); a.textContent = txt; a.classList.add("pf-on"); clearTimeout(ta); ta = setTimeout(function () { a.classList.remove("pf-on"); }, 2000); }

  // Modo lectura: queda el documento. Se sale con el mismo botón, el de arriba o Esc, sin perder el punto de lectura.
  function foco(on) {
    var ref = paginas[Math.max(0, actual)], y = ref ? ref.el.getBoundingClientRect().top : 0;
    document.body.classList.toggle("pf-foco", on);
    $("pf-foco").setAttribute("aria-pressed", on);
    $("pf-focoSalir").hidden = !on;
    anchoCambio();
    if (ref) window.scrollBy(0, ref.el.getBoundingClientRect().top - y);
    // El foco del teclado acompaña: al entrar va al botón de salir (el que se apretó deja de verse) y al salir vuelve.
    (on ? $("pf-focoSalir") : $("pf-foco")).focus({ preventScroll: true });
    cuenta();
  }
  $("pf-focoSalir").addEventListener("click", function () { foco(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && document.body.classList.contains("pf-foco")) foco(false); });

  /* --- Documentos de la misma categoría ----------------------------------------------- */
  function fila(x) {
    var li = document.createElement("li");
    li.className = "pf-doc";
    var bajar = x.l ? 'href="' + esc(copia(x)) + '" download' : 'href="' + esc(x.u) + '" target="_blank" rel="noopener"';
    li.innerHTML = etq(x.c) + '<h3 class="pf-doc__t"><a href="../' + encodeURIComponent(x.id) + '/">' + esc(x.t) + "</a></h3>" +
      '<span class="pf-doc__y">' + (x.y || "") + "</span>" +
      '<a class="pf-doc__d" ' + bajar + ' aria-label="Descargar PDF: ' + esc(x.t) + '">' + BAJAR + "</a>";
    return li;
  }
  (function () {
    // Mismo año primero (si tiene), después los que tienen copia; el resto, por cercanía en el orden alfabético.
    var otros = DOCS.filter(function (x) { return x.c === d.c && x.id !== d.id; });
    var pos = DOCS.indexOf(d);
    otros.sort(function (a, b) {
      var pa = (d.y && a.y === d.y ? 0 : 2) + (a.l ? 0 : 1), pb = (d.y && b.y === d.y ? 0 : 2) + (b.l ? 0 : 1);
      if (pa !== pb) return pa - pb;
      return Math.abs(DOCS.indexOf(a) - pos) - Math.abs(DOCS.indexOf(b) - pos);
    });
    otros.slice(0, 4).forEach(function (x) { $("pf-rel").appendChild(fila(x)); });
    $("pf-sigueT").textContent = (suLista && suLista.mas) || "Más de " + cat.nombre.toLowerCase();
    if (suLista) { $("pf-sigueTodos").href = suLista.href; $("pf-sigueTodos").innerHTML = suLista.todos + " " + FLECHA_DER; }
    else $("pf-sigueTodos").hidden = true;
  })();

  /* --- Curva del punto: un resorte apenas subamortiguado, muestreado como linear(). --------- */
  (function () {
    if (!CSS.supports || !CSS.supports("transition-timing-function", "linear(0, 1)")) return;
    var k = 230, c = 25, x = 0, v = 0, dt = 1 / 1000, pts = [], t = 0;
    while (t < 2) {
      for (var i = 0; i < 16; i++) { v += (-k * (x - 1) - c * v) * dt; x += v * dt; t += dt; }
      pts.push(x.toFixed(4));
      if (Math.abs(x - 1) < .0015 && Math.abs(v) < .02) break;
    }
    pts[pts.length - 1] = "1";
    var raiz = document.documentElement.style;
    raiz.setProperty("--punto-curva", "linear(0, " + pts.join(", ") + ")");
    raiz.setProperty("--punto-dura", Math.round(t * 1000) + "ms");
  })();

  /* --- El documento ------------------------------------------------------------------------ */
  var paginas = [];   // { el, canvas, n, ratio, pdf, ancho }
  var actual = -1, pdfDoc = null, lib = null;

  function sinCopia(msg) {
    $("pf-doc").innerHTML = '<div class="pf-v-aviso"><p>' + msg + '</p><a class="pf-boton pf-boton--verde pf-v-bajar" href="' + esc(d.u) + '" target="_blank" rel="noopener">Abrir el PDF</a></div>';
    $("pf-visor").removeAttribute("aria-busy");
  }

  // Densidad con la que se dibuja una página: la de la pantalla (hasta 2x) y, si se agrandó con dos dedos y la página
  // está a la vista, también ese aumento (hasta 3x). Las que no se ven no lo pagan.
  var vv = window.visualViewport;
  function escala(p) {
    var e = Math.min(window.devicePixelRatio || 1, 2);
    if (vv && vv.scale > 1.05) {
      var r = p.el.getBoundingClientRect();
      if (r.bottom > vv.offsetTop && r.top < vv.offsetTop + vv.height) e *= Math.min(vv.scale, 3);
    }
    return Math.round(e * 100) / 100;
  }
  // Dibuja una página al ancho de su caja. El lienzo no pasa de 16 millones de píxeles (el tope de Safari en iPhone).
  function dibujar(p) {
    if (p.dibujando) return;
    var w = p.el.clientWidth; if (!w) return;
    var e = escala(p);
    if (p.hecha && p.ancho && Math.abs(p.ancho - w) < 24 && p.esc === e) return;
    p.dibujando = true;
    pdfDoc.getPage(p.n).then(function (pg) {
      var base = pg.getViewport({ scale: 1 });
      var s = (w * e) / base.width, area = base.width * base.height * s * s;
      if (area > 16e6) s *= Math.sqrt(16e6 / area);
      var vp = pg.getViewport({ scale: s });
      var c = document.createElement("canvas");
      c.width = Math.floor(vp.width); c.height = Math.floor(vp.height);
      return pg.render({ canvasContext: c.getContext("2d"), viewport: vp, canvas: c }).promise.then(function () {
        pg.cleanup();
        if (p.lejos) { c.width = c.height = 0; return; }   // se alejó mientras se dibujaba
        if (p.canvas) p.canvas.remove();
        p.canvas = c; p.el.insertBefore(c, p.el.firstChild);
        p.ancho = w; p.esc = e; p.hecha = true;
        p.el.classList.remove("pf-esqueleto"); void c.offsetWidth; p.el.classList.add("pf-lista");
      });
    }).catch(function () {}).then(function () {
      p.dibujando = false;
      // Si mientras se dibujaba cambió el ancho (zoom, ventana) o el aumento, se vuelve a dibujar.
      if (p.hecha && !p.lejos && p.el.clientWidth && (Math.abs(p.el.clientWidth - p.ancho) >= 24 || escala(p) !== p.esc)) dibujar(p);
    });
  }
  // Vuelve a dibujar las páginas cercanas a la pantalla (después de un cambio de ancho o de zoom).
  function redibujar() {
    paginas.forEach(function (p) {
      var r = p.el.getBoundingClientRect();
      if (r.top < innerHeight * 3 && r.bottom > -innerHeight * 2) dibujar(p);
    });
  }
  if (vv) { var tVv; vv.addEventListener("resize", function () { clearTimeout(tVv); tVv = setTimeout(redibujar, 220); }); }
  var vigia = "IntersectionObserver" in window ? new IntersectionObserver(function (en) {
    en.forEach(function (e) { if (e.isIntersecting) dibujar(e.target.__p); });
  }, { rootMargin: "1400px 0px" }) : null;
  // Las páginas que quedan lejos de la pantalla sueltan su dibujo (un documento largo no acumula cientos de imágenes
  // en memoria) y vuelven a dibujarse al acercarse.
  function soltar(p) {
    if (!p.canvas) return;
    p.canvas.width = p.canvas.height = 0; p.canvas.remove(); p.canvas = null;
    p.hecha = false; p.el.classList.remove("pf-lista"); p.el.classList.add("pf-esqueleto");
  }
  var lejos = vigia ? new IntersectionObserver(function (en) {
    en.forEach(function (e) { var p = e.target.__p; p.lejos = !e.isIntersecting; if (p.lejos) soltar(p); });
  }, { rootMargin: "5000px 0px" }) : null;

  /* --- Zoom ---------------------------------------------------------------------------------- */
  var NIVELES = [1, 1.25, 1.5, 2], nivel = 0;
  var CON_ZOOM = matchMedia("(hover: hover) and (pointer: fine)").matches;
  // Ancho de la columna del documento, leído de la grilla (no cambia con el zoom).
  function anchoBase() {
    var t = getComputedStyle($("pf-grilla")).gridTemplateColumns.split(" ").map(parseFloat);
    return t.length >= 3 ? t[1] : t[0];
  }
  // Ancho de las páginas según el zoom, y la escala de la capa de texto de cada una.
  function medidas() {
    var doc = $("pf-doc");
    if (NIVELES[nivel] > 1) doc.style.setProperty("--pw", Math.round(anchoBase() * NIVELES[nivel]) + "px");
    else doc.style.removeProperty("--pw");
    if (!paginas.length) return;
    var w = paginas[0].el.clientWidth;
    paginas.forEach(function (p) { if (p.w0) p.el.style.setProperty("--total-scale-factor", (w / p.w0).toFixed(5)); });
  }
  // Cambia el nivel sin perder el punto de lectura: la línea que estaba a 40% de la pantalla sigue ahí, y de costado
  // se conserva el centro.
  var tZoom;
  function zoom(i) {
    i = Math.max(0, Math.min(NIVELES.length - 1, i));
    if (i === nivel || !paginas.length) return;
    var doc = $("pf-doc"), ref = paginas[Math.max(0, actual)], y0 = innerHeight * 0.4;
    var r = ref.el.getBoundingClientRect(), fy = (y0 - r.top) / r.height;
    var fx = doc.scrollWidth > doc.clientWidth ? (doc.scrollLeft + doc.clientWidth / 2) / doc.scrollWidth : 0.5;
    nivel = i;
    document.body.classList.toggle("pf-zoom", NIVELES[i] > 1);
    medidas();
    r = ref.el.getBoundingClientRect();
    window.scrollBy(0, r.top + fy * r.height - y0);
    doc.scrollLeft = fx * doc.scrollWidth - doc.clientWidth / 2;
    botonesZoom();
    alScroll(); marcar(); cuenta();
    clearTimeout(tZoom); tZoom = setTimeout(redibujar, 120);
  }
  function botonesZoom() {
    $("pf-zNivel").textContent = Math.round(NIVELES[nivel] * 100) + "%";
    $("pf-zNivel").disabled = nivel === 0;
    $("pf-zMenos").disabled = nivel === 0;
    $("pf-zMas").disabled = nivel === NIVELES.length - 1;
  }
  botonesZoom();
  $("pf-zMenos").addEventListener("click", function () { zoom(nivel - 1); });
  $("pf-zMas").addEventListener("click", function () { zoom(nivel + 1); });
  $("pf-zNivel").addEventListener("click", function () { zoom(0); });
  // Cmd/Ctrl + y − (y 0 para volver al ancho) manejan el zoom del documento en vez del de la página.
  document.addEventListener("keydown", function (e) {
    if (!CON_ZOOM || !paginas.length || !(e.metaKey || e.ctrlKey) || e.altKey) return;
    var k = e.key;
    if (k === "+" || k === "=") zoom(nivel + 1);
    else if (k === "-" || k === "_") zoom(nivel - 1);
    else if (k === "0") zoom(0);
    else return;
    e.preventDefault();
  });

  var tAncho;
  function anchoCambio() { medidas(); clearTimeout(tAncho); tAncho = setTimeout(redibujar, 160); }
  window.addEventListener("resize", anchoCambio);

  /* --- Capa de texto -------------------------------------------------------------------------- */
  // Se arma una vez por página, de a una y en los ratos libres, empezando por la que se está leyendo. No se suelta al
  // alejarse (pesa poco) para que la búsqueda del navegador encuentre palabras en todo el documento.
  function textos() {
    if (!lib.TextLayer) return;
    var desde = Math.max(0, actual), orden = paginas.slice(desde).concat(paginas.slice(0, desde)), i = 0;
    var luego = window.requestIdleCallback || function (f) { setTimeout(f, 30); };
    (function sig() {
      var p = orden[i++]; if (!p) return;
      pdfDoc.getPage(p.n).then(function (pg) {
        return pg.getTextContent().then(function (tc) {
          if (!tc.items.length) return;
          var capa = document.createElement("div");
          capa.className = "textLayer";
          p.el.appendChild(capa);
          return new lib.TextLayer({ textContentSource: tc, container: capa, viewport: pg.getViewport({ scale: 1 }) }).render();
        });
      }).catch(function () {}).then(function () { luego(sig); });
    })();
  }

  function armar(pdf) {
    pdfDoc = pdf;
    var n = pdf.numPages;
    datos(n);
    $("pf-doc").innerHTML = "";
    for (var i = 1; i <= n; i++) {
      var el = document.createElement("div");
      el.className = "pf-v-pag pf-esqueleto"; el.id = "pf-p" + i;
      el.setAttribute("role", "group"); el.setAttribute("aria-label", "Página " + i + " de " + n);
      el.insertAdjacentHTML("beforeend", '<span class="pf-v-num" aria-hidden="true">' + i + " / " + n + "</span>");
      var p = { el: el, n: i, canvas: null }; el.__p = p; paginas.push(p);
      $("pf-doc").appendChild(el);
    }
    // La proporción de cada página, para reservar su lugar sin saltos (las páginas pueden tener tamaños distintos).
    var ratios = paginas.map(function (p) {
      return pdf.getPage(p.n).then(function (pg) { var v = pg.getViewport({ scale: 1 }); p.w0 = v.width; p.el.style.setProperty("--r", (v.width / v.height).toFixed(5)); });
    });
    paginas.forEach(function (p) { if (vigia) { vigia.observe(p.el); lejos.observe(p.el); } else dibujar(p); });
    indice(n);
    $("pf-visor").removeAttribute("aria-busy");
    Promise.all(ratios).then(function () { medidas(); alScroll(); irAHash(); marcar(); textos(); });
  }

  // Índice de páginas, a la izquierda: solo si el documento tiene más de una.
  function indice(n) {
    if (n < 2) return;
    var h = "<ol>";
    for (var i = 1; i <= n; i++) h += '<li><a href="#p-' + i + '" data-p="' + i + '">Página ' + i + "</a></li>";
    $("pf-indice").innerHTML = h + "</ol>";
    $("pf-indice").firstChild.insertAdjacentHTML("afterbegin", '<span class="pf-v-indice__punto" aria-hidden="true"></span>');
    $("pf-indice").hidden = false;
    $("pf-indice").addEventListener("click", function (e) {
      var a = e.target.closest("a"); if (!a) return;
      e.preventDefault(); ir(Number(a.dataset.p));
    });
  }
  function ir(n) {
    var p = paginas[n - 1]; if (!p) return;
    p.el.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    history.replaceState(null, "", "#p-" + n);
  }
  function irAHash() {
    var m = /^#p-(\d+)$/.exec(location.hash);
    if (m && paginas[Number(m[1]) - 1]) paginas[Number(m[1]) - 1].el.scrollIntoView({ behavior: "auto" });
  }
  function cuenta() {
    var c = $("pf-cuenta"), varias = paginas.length > 1;
    if (!paginas.length || (!varias && !CON_ZOOM)) { c.classList.remove("pf-on"); return; }
    var r = $("pf-doc").getBoundingClientRect();
    $("pf-cuentaN").textContent = (Math.max(0, actual) + 1) + " / " + paginas.length;
    c.classList.toggle("pf-una", !varias);
    var dentro = r.top < innerHeight * 0.5 && r.bottom > innerHeight * 0.6;
    // Si el foco del teclado está en la pastilla, no se esconde debajo.
    if (!dentro && c.contains(document.activeElement)) document.activeElement.blur();
    c.classList.toggle("pf-on", dentro);
  }
  function marcar() {
    if (!paginas.length) return;
    var act = 0, corte = innerHeight * 0.4;
    for (var i = 0; i < paginas.length; i++) { if (paginas[i].el.getBoundingClientRect().top < corte) act = i; else break; }
    var cambio = act !== actual;
    actual = act; cuenta();
    if (!cambio || $("pf-indice").hidden) return;
    var links = $("pf-indice").querySelectorAll("a");
    [].forEach.call(links, function (a, i) { a.classList.toggle("pf-on", i === act); });
    var a = links[act], ol = a.closest("ol");
    ol.style.setProperty("--y", Math.round(a.offsetTop + a.offsetHeight / 2 - 3.5) + "px");
    // En documentos largos el índice se desplaza para dejar a la vista la página activa.
    var ind = $("pf-indice"), top = a.offsetTop, bajo = top + a.offsetHeight;
    if (top < ind.scrollTop + 8) ind.scrollTo({ top: Math.max(0, top - 24), behavior: "smooth" });
    else if (bajo > ind.scrollTop + ind.clientHeight - 8) ind.scrollTo({ top: bajo - ind.clientHeight + 24, behavior: "smooth" });
  }
  // Progreso de lectura del documento (la línea de la barra).
  function alScroll() {
    var r = $("pf-doc").getBoundingClientRect();
    var ini = window.scrollY + r.top - 120, fin = window.scrollY + r.bottom - innerHeight;
    $("pf-progreso").style.setProperty("--p", Math.min(1, Math.max(0, (window.scrollY - ini) / Math.max(1, fin - ini))).toFixed(4));
  }
  window.addEventListener("scroll", function () { alScroll(); marcar(); }, { passive: true });

  /* --- Carga ------------------------------------------------------------------------------- */
  if (!url) {
    sinCopia("El PDF de este documento no está disponible en el sitio actual. Se puede probar abrirlo desde su dirección original.");
  } else {
    // Mientras llega, un lugar con la proporción de una hoja A4 y el brillo.
    $("pf-doc").innerHTML = '<div class="pf-v-pag pf-esqueleto"></div>';
    import("../vendor/pdf.min.mjs").then(function (m) {
      lib = m;
      lib.GlobalWorkerOptions.workerSrc = new URL("../vendor/pdf.worker.min.mjs", location.href).href;
      return lib.getDocument({ url: url }).promise;
    }).then(armar).catch(function () {
      sinCopia("No se pudo abrir el documento en la página. Se puede descargar o abrir desde su dirección original.");
    }).then(function () { alScroll(); });
  }
})();
