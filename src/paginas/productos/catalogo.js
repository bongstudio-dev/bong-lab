/* Catálogo de productos: solapas Agro e Industrial, filtros del dock (dentro de un grupo las opciones suman; entre grupos se
   cruzan), buscador de la barra y chips de lo que está filtrando. Las tarjetas ya vienen en la página: solo se muestran u ocultan.
   La dirección guarda el estado: #industrial, #cultivo=Maíz&nutriente=Azufre, #q=texto. */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var plano = function (s) { return String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim(); };
  var GRUPOS = window.PR_GRUPOS || [];
  var tarjetas = Array.prototype.slice.call(document.querySelectorAll(".pr-tarjeta"));
  var filtros = $("pf-filters"), cuerpo = $("pf-fBody"), html = document.documentElement;
  var estado = { sec: "agro", q: "", sel: {} };
  GRUPOS.forEach(function (g) { estado.sel[g.id] = []; });
  var X = '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M2 2l6 6M8 2 2 8"/></svg>';
  var ICONO_Q = '<svg viewBox="0 0 24 24" aria-hidden="true" style="stroke-width:2.4;width:11px;height:11px"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></svg>';

  /* --- Estado inicial: la dirección y, en las vistas por cultivo o línea, el filtro de la vista. */
  function leerDireccion() {
    var p = {};
    location.hash.slice(1).split("&").forEach(function (par) {
      var i = par.indexOf("=");
      if (i < 0) { if (par) p[par] = true; return; }
      try { p[par.slice(0, i)] = decodeURIComponent(par.slice(i + 1)); } catch (e) {}
    });
    return p;
  }
  var dir = leerDireccion();
  var ini = window.PR_INICIAL || {};
  Object.keys(ini).forEach(function (g) { estado.sel[g] = ini[g].slice(); });
  GRUPOS.forEach(function (g) { if (typeof dir[g.id] === "string") estado.sel[g.id] = dir[g.id].split("|").filter(Boolean); });
  if (dir.industrial) estado.sec = "industrial";
  if (typeof dir.q === "string" && dir.en !== "sitio") estado.q = dir.q;

  function escribirDireccion() {
    var partes = [];
    if (estado.sec === "industrial") partes.push("industrial");
    GRUPOS.forEach(function (g) { if (estado.sel[g.id].length) partes.push(g.id + "=" + encodeURIComponent(estado.sel[g.id].join("|"))); });
    if (estado.q) partes.push("q=" + encodeURIComponent(estado.q));
    history.replaceState(null, "", partes.length ? "#" + partes.join("&") : location.pathname + location.search);
  }

  /* --- Filtrar. */
  function valores(t, g) { var v = t.dataset[g] || ""; return v ? v.split("|") : []; }
  function pasa(t, salvo) {
    if (t.dataset.sec !== estado.sec) return false;
    if (estado.q && t.dataset.buscar.indexOf(plano(estado.q)) < 0) return false;
    if (estado.sec !== "agro") return true;
    return GRUPOS.every(function (g) {
      if (g.id === salvo) return true;
      var s = estado.sel[g.id];
      if (!s.length) return true;
      var v = valores(t, g.id);
      return s.some(function (x) { return v.indexOf(x) >= 0; });
    });
  }
  function activos() { return GRUPOS.reduce(function (n, g) { return n + estado.sel[g.id].length; }, 0); }

  var primeraVez = true;
  function aplicar(animar) {
    var n = 0, i = 0;
    tarjetas.forEach(function (t) {
      var si = pasa(t);
      var antes = !t.hidden;
      t.hidden = !si;
      if (si) {
        n++;
        if (animar && !primeraVez) { t.classList.remove("pr-entra"); void t.offsetWidth; t.style.setProperty("--i", Math.min(i++, 12)); t.classList.add("pr-entra"); }
      }
    });
    primeraVez = false;
    var nombre = estado.sec === "agro" ? "Agro" : "Industrial";
    var filtrando = activos() > 0 || estado.q;
    $("pf-resultText").innerHTML = filtrando
      ? "<b>" + n + "</b> " + (n === 1 ? "producto" : "productos")
      : "Todos los productos de " + nombre + " · <b>" + n + "</b>";
    var c = $("pf-qCount"); if (c) c.textContent = n;
    // Chips de lo que está filtrando: se sacan tocándolos.
    var h = "";
    if (estado.q) h += '<button class="pf-chip" type="button" data-q="1">' + ICONO_Q + "“" + esc(estado.q) + "”" + X + "</button>";
    if (estado.sec === "agro") GRUPOS.forEach(function (g) {
      estado.sel[g.id].forEach(function (v) { h += '<button class="pf-chip" type="button" data-g="' + g.id + '" data-v="' + esc(v) + '">' + esc(v) + X + "</button>"; });
    });
    if (filtrando && (activos() + (estado.q ? 1 : 0)) > 1) h += '<button class="pf-activos__limpiar" type="button" data-todo="1">Limpiar</button>';
    $("pf-activos").innerHTML = h;
    // Vacío
    $("pf-empty").hidden = n > 0;
    if (!n) $("pf-emptyText").textContent = estado.q ? "No hay productos de " + nombre + " para “" + estado.q + "” con estos filtros." : "No hay productos que cumplan con todos estos filtros.";
    marcarFiltros(n);
    html.classList.toggle("pr-sin-filtros", estado.sec !== "agro");
    escribirDireccion();
    if (typeof despertar === "function") despertar(400);
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  /* --- Panel de filtros: pastillas con cuántos productos quedarían, grupos en acordeón y contadores. */
  function marcarFiltros(n) {
    GRUPOS.forEach(function (g) {
      var gr = document.querySelector('.pf-f-gr[data-grupo="' + g.id + '"]'), s = estado.sel[g.id];
      gr.querySelectorAll(".pf-f-gr__cuerpo .pf-pastilla[data-v]").forEach(function (b) {
        var v = b.dataset.v, si = s.indexOf(v) >= 0;
        b.setAttribute("aria-pressed", String(si));
        var cuantos = tarjetas.filter(function (t) { return pasa(t, g.id) && valores(t, g.id).indexOf(v) >= 0; }).length;
        b.querySelector(".pf-pastilla__n").textContent = cuantos;
        b.classList.toggle("pf-cero", !cuantos);
      });
      var num = gr.querySelector(".pf-f-n");
      num.hidden = !s.length; num.textContent = s.length;
      gr.querySelector(".pf-f-gr__res").textContent = s.length ? "" : "Todos";
      gr.querySelector(".pf-f-gr__activos").innerHTML = s.map(function (v) { return '<button class="pf-pastilla" type="button" aria-pressed="true" data-v="' + esc(v) + '">' + esc(v) + "</button>"; }).join("");
      var main = $("pf-fMain").querySelector('[data-abre="' + g.id + '"]');
      if (main) { var mn = main.querySelector(".pf-f-n"); mn.hidden = !s.length; mn.textContent = s.length; }
    });
    var total = activos();
    $("pf-fCount").hidden = !total; $("pf-fCount").textContent = total;
    $("pf-fClear").hidden = !total;
    $("pf-fTxt").textContent = filtros.classList.contains("pf-abierto") ? "Ver " + n + (n === 1 ? " producto" : " productos") : "Filtros";
  }
  // Fila de la barra: una pastilla por grupo, que abre el panel en ese grupo.
  $("pf-fMain").innerHTML = GRUPOS.map(function (g) {
    return '<button class="pf-pastilla pf-pastilla--todas" type="button" data-abre="' + g.id + '" aria-expanded="false">' + g.nombre + '<span class="pf-f-n" hidden>0</span></button>';
  }).join("");

  function grupoAbierto(id) {
    document.querySelectorAll(".pf-f-gr").forEach(function (gr) {
      var si = gr.dataset.grupo === id;
      gr.classList.toggle("pf-abierto", si);
      gr.querySelector(".pf-f-gr__cab").setAttribute("aria-expanded", String(si));
    });
    $("pf-fMain").querySelectorAll("[data-abre]").forEach(function (b) { b.setAttribute("aria-expanded", String(filtros.classList.contains("pf-abierto") && b.dataset.abre === id)); });
  }
  var abierto = null;
  function abrir(id) {
    if (!filtros.classList.contains("pf-abierto")) {
      filtros.classList.remove("pf-listo");
      filtros.classList.add("pf-abierto");
      $("pf-fToggle").setAttribute("aria-expanded", "true");
      grupoAbierto(id);
      cuerpo.style.height = "0px"; void cuerpo.offsetHeight;
      cuerpo.style.height = cuerpo.scrollHeight + "px";
      clearTimeout(abierto);
      abierto = setTimeout(function () { filtros.classList.add("pf-listo"); cuerpo.style.height = ""; }, 620);
    } else grupoAbierto(id);
    marcarFiltros(tarjetas.filter(function (t) { return !t.hidden; }).length);
  }
  function cerrar() {
    if (!filtros.classList.contains("pf-abierto")) return;
    clearTimeout(abierto);
    cuerpo.style.height = cuerpo.offsetHeight + "px";
    filtros.classList.remove("pf-listo"); void cuerpo.offsetHeight;
    filtros.classList.remove("pf-abierto");
    cuerpo.style.height = "0px";
    $("pf-fToggle").setAttribute("aria-expanded", "false");
    $("pf-fMain").querySelectorAll("[data-abre]").forEach(function (b) { b.setAttribute("aria-expanded", "false"); });
    abierto = setTimeout(function () { cuerpo.style.height = ""; }, 480);
    marcarFiltros(tarjetas.filter(function (t) { return !t.hidden; }).length);
  }
  function primerGrupo() { var a = document.querySelector(".pf-f-gr.pf-abierto"); return a ? a.dataset.grupo : GRUPOS[0].id; }
  $("pf-fToggle").addEventListener("click", function () { filtros.classList.contains("pf-abierto") ? cerrar() : abrir(primerGrupo()); });
  $("pf-fMain").addEventListener("click", function (e) {
    var b = e.target.closest("[data-abre]"); if (!b) return;
    if (filtros.classList.contains("pf-abierto") && b.getAttribute("aria-expanded") === "true") cerrar(); else abrir(b.dataset.abre);
  });
  $("pf-fGrupos").addEventListener("click", function (e) {
    var cab = e.target.closest(".pf-f-gr__cab"), gr = e.target.closest(".pf-f-gr");
    if (cab) { grupoAbierto(gr.classList.contains("pf-abierto") ? null : gr.dataset.grupo); return; }
    var b = e.target.closest(".pf-pastilla[data-v]"); if (!b || !gr) return;
    if (b.classList.contains("pf-cero") && b.getAttribute("aria-pressed") !== "true") return;
    var s = estado.sel[gr.dataset.grupo], i = s.indexOf(b.dataset.v);
    if (i >= 0) s.splice(i, 1); else s.push(b.dataset.v);
    aplicar(true);
  });
  $("pf-fClear").addEventListener("click", function () { GRUPOS.forEach(function (g) { estado.sel[g.id] = []; }); aplicar(true); });
  document.addEventListener("pointerdown", function (e) { if (filtros.classList.contains("pf-abierto") && !filtros.contains(e.target) && !$("pf-ancla").contains(e.target)) cerrar(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && filtros.classList.contains("pf-abierto")) { cerrar(); $("pf-fToggle").focus(); } });

  // Chips de la fila de resultados y botón del vacío.
  $("pf-activos").addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return;
    if (b.dataset.todo) { GRUPOS.forEach(function (g) { estado.sel[g.id] = []; }); limpiarQ(); }
    else if (b.dataset.q) limpiarQ();
    else { var s = estado.sel[b.dataset.g]; s.splice(s.indexOf(b.dataset.v), 1); }
    aplicar(true);
  });
  $("pf-emptyReset").addEventListener("click", function () { GRUPOS.forEach(function (g) { estado.sel[g.id] = []; }); limpiarQ(); aplicar(true); });

  /* --- Solapas Agro e Industrial. */
  var solapas = PFSolapas.armar($("pf-solapas"), function (id) {
    estado.sec = id; solapas.marcar(id, true); cerrar(); aplicar(true);
    var fila = document.querySelector(".pf-result-row");
    if (fila.getBoundingClientRect().top < 0) $("pf-hoja").scrollIntoView({ behavior: "smooth" });
  });
  solapas.marcar(estado.sec, false);

  /* --- Buscador de la barra: filtra en el lugar mientras se escribe (el interruptor de alcance.js lleva a todo el sitio). */
  var q = $("pf-q"), tq;
  function abrirBusca(si) {
    $("pf-busca").classList.toggle("pf-abierto", si);
    $("pf-nav").classList.toggle("pf-buscando", si);
    $("pf-goSearch").setAttribute("aria-expanded", String(si));
    q.tabIndex = si ? 0 : -1; $("pf-qClose").tabIndex = si ? 0 : -1;
    if (si) setTimeout(function () { q.focus(); }, 60);
  }
  function limpiarQ() { estado.q = ""; q.value = ""; abrirBusca(false); }
  q.addEventListener("input", function () { clearTimeout(tq); tq = setTimeout(function () { estado.q = q.value.trim(); aplicar(true); }, 120); });
  $("pf-qClose").addEventListener("click", function () { limpiarQ(); aplicar(true); $("pf-goSearch").focus(); });
  $("pf-goSearch").addEventListener("click", function () {
    if (!$("pf-busca").classList.contains("pf-abierto")) abrirBusca(true); else if (!q.value) abrirBusca(false); else q.focus();
  });
  q.addEventListener("blur", function () { setTimeout(function () { if (!q.value && document.activeElement !== q) abrirBusca(false); }, 180); });
  q.addEventListener("keydown", function (e) { if (e.key === "Escape") { limpiarQ(); aplicar(true); } });
  document.addEventListener("keydown", function (e) {
    if (e.key === "/" && document.activeElement !== q && !/^(input|textarea)$/i.test(document.activeElement.tagName)) { e.preventDefault(); abrirBusca(true); }
  });
  if (estado.q) { q.value = estado.q; abrirBusca(true); }

  /* --- El dock aparece cuando la hoja llega arriba (mientras se ve la cabecera, no hace falta). */
  var cab = $("pf-cab");
  function dockArriba() { filtros.classList.toggle("pf-arriba", $("pf-hoja").getBoundingClientRect().top > innerHeight * .55); }
  addEventListener("scroll", dockArriba, { passive: true }); dockArriba();

  /* --- Celular: el dock se compacta al bajar y vuelve al subir o al llegar al final (lo mismo que la Biblioteca; el estilo de
     .pf-chica está en base.css). Umbral de 8 px para que el rebote de Safari no lo haga titilar. Abierto nunca se compacta. */
  var yAntes = scrollY;
  addEventListener("scroll", function () {
    var y = scrollY, dy = y - yAntes;
    if (Math.abs(dy) < 8) return;
    yAntes = y;
    var alFinal = y + innerHeight >= html.scrollHeight - 4;
    if (!matchMedia("(max-width: 640px)").matches || filtros.classList.contains("pf-abierto")) { filtros.classList.remove("pf-chica"); return; }
    filtros.classList.toggle("pf-chica", dy > 0 && y > 40 && !alFinal);
  }, { passive: true });

  /* --- Ancla (la de la Biblioteca): aparece y se va junto con el dock, baja una pantalla o vuelve al principio del catálogo.
     Se mueve con resortes (tokens --ancla-*). Lo que decide si se ve se vuelve a medir en cada cuadro mientras algo cambia, y
     también cuando cambian los filtros o la solapa: si dependiera solo del scroll, al llegar con un filtro en la dirección o al
     pasar de Industrial a Agro sin mover la página quedaba escondida. */
  var ancla = $("pf-ancla"), aCuerpo = ancla.firstElementChild, flecha = aCuerpo.firstElementChild;
  var esMobile = matchMedia("(max-width: 640px)"), quieto = matchMedia("(prefers-reduced-motion: reduce)");
  var raiz = getComputedStyle(html);
  function tk(n) { return parseFloat(raiz.getPropertyValue("--" + n)); }
  var GAP = tk("ancla-gap"), APRETAR = tk("ancla-apretar"), BAJAR_P = tk("ancla-bajar"), CAMBIO = tk("ancla-cambio");
  function R(x, k, c) { return { x: x, v: 0, t: x, k: k, c: c }; }
  var M = { s: R(0, tk("ancla-aparecer-k"), tk("ancla-aparecer-c")), q: R(1, tk("ancla-apretar-k"), tk("ancla-apretar-c")), r: R(90, tk("ancla-giro-k"), tk("ancla-giro-c")) };
  function inicioLista() { return $("pf-hoja").offsetTop - 80; }
  function sube() { return scrollY > inicioLista() + innerHeight * CAMBIO; }
  function medir() {
    var hay = estado.sec === "agro" && !filtros.classList.contains("pf-arriba") && $("pf-empty").hidden;
    M.s.t = hay ? 1 : 0;
    var s = sube();
    M.r.t = s ? -90 : 90;
    ancla.setAttribute("aria-label", s ? "Volver al principio de los productos" : "Bajar");
    ancla.tabIndex = hay ? 0 : -1;
    if (!esMobile.matches) html.style.setProperty("--ancla-x", (filtros.getBoundingClientRect().right + GAP).toFixed(2) + "px");
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
  addEventListener("scroll", function () { despertar(200); }, { passive: true });
  addEventListener("resize", function () { despertar(700); });
  filtros.addEventListener("click", function () { despertar(900); });
  filtros.addEventListener("transitionend", function () { despertar(120); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { despertar(300); });
  addEventListener("load", function () { despertar(600); });
  ancla.addEventListener("pointerdown", function () { M.q.t = APRETAR; despertar(); });
  function soltarAncla() { M.q.t = 1; despertar(); }
  ancla.addEventListener("pointerup", soltarAncla);
  ancla.addEventListener("pointercancel", soltarAncla);
  ancla.addEventListener("pointerleave", soltarAncla);
  ancla.addEventListener("click", function () {
    cerrar();
    var suave = quieto.matches ? "auto" : "smooth";
    if (sube()) scrollTo({ top: inicioLista(), behavior: suave });
    else scrollBy({ top: Math.round(innerHeight * BAJAR_P), behavior: suave });
  });

  aplicar(false);
  // Llegando con un filtro o una búsqueda, la lista queda a la vista.
  if (activos() || estado.q || estado.sec !== "agro") requestAnimationFrame(function () { scrollTo({ top: $("pf-hoja").offsetTop - (cab ? 0 : 0) - 80 }); });
  addEventListener("hashchange", function () {
    var d = leerDireccion();
    if (typeof d.q === "string" && d.en !== "sitio") { estado.q = d.q; q.value = d.q; abrirBusca(true); aplicar(true); }
  });
})();
