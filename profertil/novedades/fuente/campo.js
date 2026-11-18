/* Cabecera con campo (Nota y Biblioteca): el campo generativo detrás de la cabecera.
   Grilla de Formas que crecen en grupos (una Forma por grupo), se quedan quietas
   un rato y se deshacen mientras nacen otras. En la Nota el color sale del tipo de nota
   (el de su etiqueta) y la Forma, de su categoría; otras páginas los pasan en window.PF_CAMPO. */
(function () {
  "use strict";
  // Configuración: la página puede pasar window.PF_CAMPO (la Biblioteca); la Nota la arma desde su nota (PF_NOTA).
  //   formas: las Formas del sistema · color: azul|verde|amarillo|naranja · forma: la del badge · tema: Formas para el modo "varias"
  //   cab: id de la tarjeta · main: id del contenido que sube encima · columna: id de la columna a la que se alinea la tarjeta (escritorio)
  var Q = new URLSearchParams(location.search);
  var P = window.PF_CAMPO || (function () {
    var N = window.PF_NOTA; if (!N) return null;
    var n = N.n, tema = [];
    // Automático: el color de la etiqueta del tipo de nota (la familia del componente Etiqueta).
    var FAMILIA = { institucional: "azul", financiera: "azul", somos: "verde", tecnico: "verde", aviso: "amarillo", comercial: "naranja" };
    // Modo "una": todo el campo con la forma de la categoría (la del badge de la etiqueta).
    var FORMA_TIPO = { institucional: "escudo", comercial: "barras", somos: "circulos", tecnico: "lupa", aviso: "casco", financiera: "grafico" };
    try { tema = N.formasDe(n) || []; } catch (e) {}
    return { formas: N.formas, color: FAMILIA[n.tp], forma: FORMA_TIPO[n.tp], tema: tema, cab: "pf-cab", main: "pf-nota", columna: "pf-texto" };
  })();
  if (!P) return;

  // --- Paleta: fondo, figura y acento. El fondo es siempre azul, verde, amarillo o terra.
  var PALETAS = {
    azul:     { fondo: "#003DA5", figura: "#4086FF", acento: "#EABA2C" },
    verde:    { fondo: "#2D8035", figura: "#5EB53A", acento: "#EABA2C" },
    amarillo: { fondo: "#EABA2C", figura: "#E57F19", acento: "#2D8035" },
    naranja:  { fondo: "#8A4818", figura: "#E57F19", acento: "#EABA2C" }
  };
  var pedida = Q.get("p");
  // ?p=azul|verde|amarillo|naranja fuerza otro color (solo para probar).
  var paleta = PALETAS[PALETAS[pedida] ? pedida : (PALETAS[P.color] ? P.color : "azul")];

  // --- Formas: las del tema pesan más; el resto aparece de vez en cuando.
  var TODAS = Object.keys(P.formas);
  var TEMA = (P.tema || []).filter(function (f) { return P.formas[f]; });
  if (!TEMA.length) TEMA = TODAS;
  var DEL_TIPO = P.formas[P.forma] ? P.forma : TEMA[0];
  // Por defecto "una"; ?formas=varias vuelve a la mezcla.
  var modoFormas = Q.get("formas") === "varias" ? "varias" : "una";
  function unaForma() { if (modoFormas === "una") return DEL_TIPO; return Math.random() < 0.7 ? TEMA[Math.floor(Math.random() * TEMA.length)] : TODAS[Math.floor(Math.random() * TODAS.length)]; }

  var cache = {}, prop = {};
  TODAS.forEach(function (k) { var v = P.formas[k].vb.split(/\s+/); prop[k] = +v[2] / +v[3]; });
  function tenida(k, color) {
    var c = k + color;
    if (cache[c]) return cache[c];
    var im = new Image();
    im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + P.formas[k].vb + '" fill="' + color + '">' + P.formas[k].d + "</svg>");
    return (cache[c] = im);
  }
  TODAS.forEach(function (k) { tenida(k, paleta.figura); tenida(k, paleta.acento); });

  // --- Armado: la cabecera sale de la grilla y pasa a una tarjeta sobre el campo.
  var cv = document.createElement("canvas");
  cv.id = "pf-campo"; cv.setAttribute("aria-hidden", "true");
  document.body.insertBefore(cv, document.body.firstChild);
  var main = document.getElementById(P.main), cab = document.getElementById(P.cab);
  var papel = getComputedStyle(document.body).backgroundColor;
  document.documentElement.style.setProperty("--pf-papel", papel === "rgba(0, 0, 0, 0)" ? "#fff" : papel);
  var sec = document.createElement("section");
  sec.className = "pf-campo-cab";
  sec.appendChild(cab);
  sec.insertAdjacentHTML("beforeend", '<span class="pf-campo-seguir" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 5v14M6 13l6 6 6-6"/></svg></span>');
  main.parentNode.insertBefore(sec, main);
  // Alto de la cabecera: 70% de la pantalla. Para probar otro, ?alto=60 (de 40 a 100).
  var alto = +Q.get("alto") || 70;
  document.documentElement.style.setProperty("--pf-campo-alto", Math.max(40, Math.min(100, Math.round(alto))) + "svh");

  // Escritorio: la tarjeta toma el ancho y la posición de la columna central (la del texto).
  function alinear() {
    var t = P.columna && document.getElementById(P.columna);
    if (!t || window.innerWidth < 720) { cab.style.width = ""; cab.style.marginLeft = ""; return; }
    var r = t.getBoundingClientRect(), s = sec.getBoundingClientRect();
    if (!r.width) return;
    cab.style.width = r.width + "px";
    cab.style.marginLeft = (r.left - s.left - parseFloat(getComputedStyle(sec).paddingLeft)) + "px";
  }

  function barra() { var b = document.getElementById("pf-top"); if (b) document.documentElement.style.setProperty("--pf-barra-h", b.offsetHeight + "px"); }
  barra();

  // --- Campo
  var ctx = cv.getContext("2d");
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var reducir = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var W, H, CELDA, cols, filas, grilla, grupos = [], sembrado = false;
  var VEC = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  function azar(a, b) { return a + Math.random() * (b - a); }
  function idx(x, y) { return y * cols + x; }

  function medir() {
    W = window.innerWidth; H = Math.max(window.innerHeight, document.documentElement.clientHeight);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.height = H + "px";
    CELDA = W < 720 ? 26 : 34;
    cols = Math.ceil(W / CELDA) + 1; filas = Math.ceil(H / CELDA) + 1;
    grilla = new Array(cols * filas).fill(null);
    grupos = []; sembrado = false;
  }
  // Donde conviene que nazcan: entre la tarjeta y el final de la cabecera (se mide cada vez: la tarjeta cambia de alto al llegar el texto).
  function zona() {
    var t = cab.getBoundingClientRect(), c = sec.getBoundingClientRect();
    var z = { y0: Math.floor((t.bottom + 8) / CELDA), y1: Math.min(filas - 1, Math.floor(c.bottom / CELDA)) };
    return z.y1 - z.y0 < 3 ? { y0: 0, y1: filas - 1 } : z;
  }
  function nuevoGrupo(ahora) {
    var z = zona();
    for (var i = 0; i < 30; i++) {
      var x = Math.floor(azar(0, cols - 1));
      var y = Math.random() < 0.25 ? Math.floor(azar(0, filas - 1)) : Math.floor(azar(z.y0, z.y1));
      if (grilla[idx(x, y)]) continue;
      grupos.push({ forma: unaForma(), celdas: [], borde: [[x, y]], meta: Math.floor(azar(8, 26)),
        estado: "crece", proximo: ahora, ritmo: azar(70, 140), espera: azar(2500, 5000) });
      return grupos[grupos.length - 1];
    }
  }
  function paso(g, ahora) {
    if (ahora < g.proximo) return;
    g.proximo = ahora + g.ritmo;
    if (g.estado === "crece") {
      while (g.borde.length) {
        var p = g.borde.splice(Math.floor(Math.random() * g.borde.length), 1)[0];
        if (p[0] < 0 || p[1] < 0 || p[0] >= cols || p[1] >= filas || grilla[idx(p[0], p[1])]) continue;
        var c = { x: p[0], y: p[1], nace: ahora, muere: 0, forma: g.forma, color: Math.random() < 0.08 ? paleta.acento : paleta.figura, v: Math.random() };
        grilla[idx(p[0], p[1])] = c; g.celdas.push(c);
        VEC.forEach(function (v) { g.borde.push([p[0] + v[0], p[1] + v[1]]); });
        break;
      }
      if (g.celdas.length >= g.meta || !g.borde.length) { g.estado = "quieto"; g.proximo = ahora + g.espera; }
    } else if (g.estado === "quieto") {
      g.estado = "decrece";
    } else if (g.estado === "decrece") {
      var m = g.celdas.shift();
      if (m) { m.muere = ahora; setTimeout(function () { if (grilla[idx(m.x, m.y)] === m) grilla[idx(m.x, m.y)] = null; }, 320); }
      if (!g.celdas.length) g.estado = "fin";
    }
  }
  var MAX = 7;
  function sembrar() {
    var t = performance.now();
    for (var i = 0; i < MAX; i++) {
      var g = nuevoGrupo(t); if (!g) continue;
      var k = Math.floor(g.meta * azar(0.4, 1));
      for (var j = 0; j < k; j++) { g.proximo = 0; g.estado = "crece"; paso(g, t - 1000); }
      g.estado = g.celdas.length >= g.meta ? "quieto" : "crece";
      g.celdas.forEach(function (c) { c.nace = t - 1000; });
      g.proximo = t + (g.estado === "quieto" ? g.espera * azar(0.3, 1) : azar(0, 2000));
    }
    sembrado = true;
  }
  function suave(t) { return 1 - Math.pow(1 - t, 3); }

  // Cursor: solo reaccionan las Formas en color de acento; el resto no se mueve. Cada una tiene un valor fijo
  // al azar (v) y el cursor sube la chance de que pase al color de figura: casi todas debajo del mouse, menos
  // a medida que se alejan, sin borde. Cada Forma cambia o no, sin fundido, y el cursor se lee a saltos (cada 60 ms).
  // PICO: cuántas cambian debajo del mouse. ALCANCE: hasta dónde llega, en fracción del lado corto de la pantalla.
  var raton = null, muestra = null, ultima = 0;
  var PICO = 0.95, CURVA = 2, ALCANCE = 0.6, PASO_CURSOR = 60;
  addEventListener("pointermove", function (e) {
    if (e.pointerType !== "mouse") return;
    raton = { x: e.clientX, y: e.clientY };
    if (reducir && W) { muestra = raton; dibujar(performance.now()); }
  }, { passive: true });
  document.documentElement.addEventListener("pointerleave", function () { raton = null; if (reducir && W) { muestra = null; dibujar(performance.now()); } });
  function cambia(c, D) {
    if (!muestra || c.color !== paleta.acento) return false;
    var d = Math.hypot(c.x * CELDA + CELDA / 2 - muestra.x, c.y * CELDA + CELDA / 2 - muestra.y);
    return c.v < PICO * Math.pow(Math.max(0, 1 - d / D), CURVA);
  }
  function otro(color) { return color === paleta.acento ? paleta.figura : paleta.acento; }
  function dibujar(ahora) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = paleta.fondo; ctx.fillRect(0, 0, W, H);
    if (!reducir && ahora - ultima >= PASO_CURSOR) { muestra = raton; ultima = ahora; }
    var lado = CELDA * 0.72, D = Math.min(W, H) * ALCANCE;
    for (var k = 0; k < grilla.length; k++) {
      var c = grilla[k]; if (!c) continue;
      var s = c.muere ? 1 - suave(Math.min(1, (ahora - c.muere) / 300)) : suave(Math.min(1, (ahora - c.nace) / 260));
      var im = tenida(c.forma, c.color);
      if (s <= 0 || !im.complete) continue;
      var r = prop[c.forma], w = r >= 1 ? lado : lado * r, h = r >= 1 ? lado / r : lado;
      var x = c.x * CELDA + (CELDA - w * s) / 2, y = c.y * CELDA + (CELDA - h * s) / 2;
      if (cambia(c, D)) { var im2 = tenida(c.forma, otro(c.color)); if (im2.complete) im = im2; }
      ctx.drawImage(im, x, y, w * s, h * s);
    }
  }
  var activo = true;
  function cuadro(ahora) {
    if (!sembrado) sembrar();
    if (activo) {
      while (grupos.length < MAX && nuevoGrupo(ahora + azar(0, 1500))) {}
      grupos.forEach(function (g) { paso(g, ahora); });
      grupos = grupos.filter(function (g) { return g.estado !== "fin"; });
      dibujar(ahora);
    }
    if (!reducir) requestAnimationFrame(cuadro);
  }

  // Clic (o toque) en el campo: nace un grupo ahí mismo, que crece un poco más rápido. Hasta 5 por encima
  // de los 7 de siempre; si se pasa, el grupo quieto más viejo empieza a deshacerse. No cuenta sobre la tarjeta.
  var EXTRA = 5;
  sec.addEventListener("click", function (e) {
    if (reducir || !W || e.target.closest("#" + P.cab + ", a, button")) return;
    var cx = Math.floor(e.clientX / CELDA), cy = Math.floor(e.clientY / CELDA), borde = [];
    for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
      var x = cx + dx, y = cy + dy;
      if (x >= 0 && y >= 0 && x < cols && y < filas && !grilla[idx(x, y)]) borde.push([x, y]);
    }
    if (!borde.length) return;
    if (grupos.length >= MAX + EXTRA) {
      var viejo = grupos.filter(function (g) { return g.estado === "quieto"; })[0];
      if (viejo) { viejo.estado = "decrece"; viejo.proximo = 0; }
    }
    var ahora = performance.now();
    grupos.push({ forma: unaForma(), celdas: [], borde: borde, meta: Math.floor(azar(10, 20)),
      estado: "crece", proximo: ahora, ritmo: azar(40, 70), espera: azar(2500, 5000) });
  });

  // Ahorro: cuando el texto tapa la cabecera, el campo deja de animar.
  addEventListener("scroll", function () { document.body.classList.toggle("pf-campo-bajo", scrollY > 40); }, { passive: true });
  // Fuera de pantalla también se esconde, para que no asome debajo del pie.
  new IntersectionObserver(function (e) { activo = e[0].isIntersecting; cv.style.visibility = activo ? "" : "hidden"; }).observe(sec);
  var ancho = window.innerWidth;
  addEventListener("resize", function () {
    barra(); alinear();
    if (window.innerWidth === ancho) return; // en celular la barra del navegador cambia el alto: no reiniciar
    ancho = window.innerWidth; medir();
  });

  alinear();
  if (document.fonts) document.fonts.ready.then(alinear);
  addEventListener("load", alinear);
  medir();
  if (reducir) setTimeout(function () { sembrar(); dibujar(performance.now()); }, 300);
  else requestAnimationFrame(cuadro);
})();
