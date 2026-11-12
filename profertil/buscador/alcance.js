/* Buscador con alcance: se suma al buscador de la barra (pieza "barra" de base.css) de cualquier página.

   <link rel="stylesheet" href="../buscador/alcance.css">
   <script src="../buscador/alcance.js" data-seccion="documentos" data-nombre="Biblioteca" defer></script>

   data-seccion es el id del grupo del índice que corresponde a la página; data-nombre, cómo se nombra en el interruptor.
   La página conserva su buscador: con el interruptor en la sección, cada letra la filtra en el lugar como siempre.
   En "Todo el sitio" el componente toma el campo, busca en ../buscador/indice.json y muestra el panel por tipo.
   Usa los ids de la barra: pf-busca, pf-q, pf-nav, pf-goSearch, pf-qClose y, si está, pf-empty.
   La dirección guarda el alcance amplio: #en=sitio&q=texto.

   En una página sin lista (la Nota, el visor de la Biblioteca) va con data-modo="previa": el componente abre y
   cierra el buscador de la barra él mismo y, mientras se escribe, muestra en el panel una vista previa de la
   sección (o de todo el sitio con el interruptor). Enter o "Ver los N" llevan a la lista con la búsqueda hecha.
   <script src="../../buscador/alcance.js" data-seccion="notas" data-nombre="Novedades" data-modo="previa" defer></script>
   data-en es cómo se nombra la sección dentro de una frase, si lleva artículo ("la Biblioteca"). */
(function () {
  "use strict";
  var yo = document.currentScript;
  var SECCION = yo.dataset.seccion || "", NOMBRE = yo.dataset.nombre || "esta sección";
  var PREVIA = yo.dataset.modo === "previa";
  var EN = yo.dataset.en || NOMBRE; // cómo se nombra en una frase: "en la Biblioteca", "en Novedades"
  var BASE = new URL("../", yo.src);
  var POR_GRUPO = 5;
  var FLECHA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 12h10M13 8l4 4-4 4"/></svg>';

  function $(id) { return document.getElementById(id); }
  function plano(s) { return String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  // La misma regla que las listas de cada sección: el texto entero, sin tildes ni mayúsculas. Así "ver los N"
  // lleva a una lista con los mismos N.
  function terminos(q) { var t = plano(String(q).trim()); return t ? [t] : []; }

  // Marca cada término sin importar tildes ni mayúsculas, sobre el texto original.
  function resaltar(texto, ts) {
    if (!ts.length) return esc(texto);
    var norm = "", i, j;
    for (i = 0; i < texto.length; i++) norm += plano(texto[i]).charAt(0) || texto[i];
    var marca = new Array(texto.length);
    ts.forEach(function (t) {
      var at = 0;
      while ((at = norm.indexOf(t, at)) !== -1) { for (j = at; j < at + t.length; j++) marca[j] = true; at += t.length; }
    });
    var out = "", dentro = false;
    for (i = 0; i < texto.length; i++) {
      if (marca[i] && !dentro) { out += "<mark>"; dentro = true; }
      if (!marca[i] && dentro) { out += "</mark>"; dentro = false; }
      out += esc(texto[i]);
    }
    return out + (dentro ? "</mark>" : "");
  }

  function iniciar() {
    var caja = $("pf-busca"), input = $("pf-q"), nav = $("pf-nav"), lupa = $("pf-goSearch"), cerrar = $("pf-qClose"), vacio = $("pf-empty");
    if (!caja || !input || !cerrar) return;
    var amplio = false, indice = null, cargando = null, fallo = false, abiertos = {}, t;
    var placeholder = input.placeholder;

    /* --- Piezas ---------------------------------------------------------------------------------------- */
    // Interruptor de alcance al final del campo: la sección (por defecto) o todo el sitio.
    var sw = document.createElement("div");
    sw.className = "pf-alc__sw";
    sw.setAttribute("role", "group");
    sw.setAttribute("aria-label", "Dónde buscar");
    sw.innerHTML = '<button type="button" data-alc-sw="seccion" aria-pressed="true">' + esc(NOMBRE) + "</button>" +
      '<button type="button" data-alc-sw="sitio" aria-pressed="false" aria-label="Todo el sitio"><span class="pf-alc__largo">Todo el sitio</span><span class="pf-alc__corto" aria-hidden="true">Sitio</span></button>';
    var swBtns = sw.querySelectorAll("button");
    function swTab(n) { swBtns.forEach(function (b) { b.tabIndex = n; }); }
    swTab(caja.classList.contains("pf-abierto") ? 0 : -1);
    var cuentaCampo = $("pf-qCount");
    caja.insertBefore(sw, cuentaCampo && cuentaCampo.parentNode === caja ? cuentaCampo : null);
    function swPintar() {
      swBtns[0].setAttribute("aria-pressed", !amplio); swBtns[1].setAttribute("aria-pressed", amplio);
      sw.classList.toggle("pf-alc__sw--sitio", amplio);
    }

    var panel = document.createElement("div");
    panel.className = "pf-alc__panel";
    panel.id = "pf-alc-panel";
    panel.setAttribute("role", "region");
    panel.setAttribute("aria-label", "Resultados en todo el sitio");
    panel.hidden = true;
    cerrar.parentNode.insertBefore(panel, cerrar.nextSibling);

    var velo = document.createElement("div");
    velo.className = "pf-alc__velo";
    velo.hidden = true;
    document.body.appendChild(velo);

    var vivo = document.createElement("p");
    vivo.className = "pf-oculto";
    vivo.setAttribute("aria-live", "polite");
    document.body.appendChild(vivo);

    var ampliarVacio = null;
    if (vacio) {
      ampliarVacio = document.createElement("button");
      ampliarVacio.type = "button";
      ampliarVacio.className = "pf-boton pf-alc__ampliar";
      ampliarVacio.hidden = true;
      vacio.appendChild(ampliarVacio);
    }

    /* --- Índice ------------------------------------------------------------------------------------------ */
    function cargar() {
      if (indice || cargando) return cargando;
      cargando = fetch(new URL("buscador/indice.json", BASE)).then(function (r) {
        if (!r.ok) throw new Error(r.status);
        return r.json();
      }).then(function (d) {
        d.grupos.forEach(function (g) {
          g.items = g.items.map(function (it) {
            var tt = plano(it[0]);
            return { t: it[0], u: new URL(it[1], BASE).href, r: it[2] || "", nt: tt, nh: tt + " " + plano(it[2] || "") };
          });
        });
        indice = d;
        pintar(); vacioActual();
      }).catch(function () { fallo = true; cargando = null; pintar(); });
      return cargando;
    }

    function buscar(q) {
      var b = terminos(q)[0] || "";
      return indice.grupos.map(function (g) {
        var hall = [];
        g.items.forEach(function (it, k) {
          if (it.nh.indexOf(b) === -1) return;
          var p = it.nt.indexOf(b) === 0 ? 0 : it.nt.indexOf(b) !== -1 ? 1 : 2;
          hall.push({ it: it, p: p, k: k });
        });
        hall.sort(function (a, b) { return a.p - b.p || a.k - b.k; });
        return { g: g, items: hall.map(function (h) { return h.it; }) };
      });
    }

    /* --- Panel ---------------------------------------------------------------------------------------- */
    // El panel aparece recién cuando hay algo escrito: vacío no tiene nada para mostrar.
    function mostrarPanel(si) {
      si = si && (amplio || PREVIA) && !!input.value.trim();
      panel.hidden = !si;
      velo.hidden = !si;
    }

    // La lista de una sección con la búsqueda hecha (en todo el sitio, la de la sección con el alcance amplio).
    function urlResultados(q) {
      var g = indice && indice.grupos.filter(function (x) { return x.id === SECCION; })[0];
      if (!g || !g.lista) return null;
      var lista = g.lista.split("#")[0];
      return new URL(amplio ? lista + "#en=sitio&q=" + encodeURIComponent(q) : g.lista + encodeURIComponent(q), BASE).href;
    }

    function pintar() {
      if (!amplio && !PREVIA) return;
      var q = input.value.trim(), ts = terminos(q);
      var volver = ""; // volver a la sección es el interruptor del campo
      mostrarPanel(!!ts.length);
      if (!ts.length) { panel.innerHTML = ""; vivo.textContent = ""; return; }
      if (!indice) {
        panel.innerHTML = '<div class="pf-alc__cab"><p class="pf-alc__titulo">En todo el sitio</p>' + volver + "</div>" +
          '<p class="pf-alc__nada">' + (fallo ? "No se pudo cargar el buscador del sitio. Probá de nuevo en un momento." : "Buscando…") + "</p>";
        if (!fallo) cargar();
        return;
      }
      var res = buscar(q), total = 0, h = "";
      if (!amplio) res = res.filter(function (r) { return r.g.id === SECCION; });
      res.forEach(function (r) {
        var n = r.items.length; total += n;
        if (!n) return;
        var g = r.g, todos = !!abiertos[g.id], vis = todos ? r.items : r.items.slice(0, POR_GRUPO);
        // Con un solo grupo (la sección en la vista previa) el título del grupo repetiría el de la cabecera.
        h += '<section class="pf-alc__grupo" aria-label="' + esc(g.nombre) + '">' + (amplio || !PREVIA ? '<h2 class="pf-alc__g">' + esc(g.nombre) + '<span class="pf-alc__n">' + n + "</span></h2>" : "") + "<ul class=\"pf-alc__lista\">";
        vis.forEach(function (it) {
          h += '<li><a class="pf-alc__item" href="' + esc(it.u) + '"><span class="pf-alc__t">' + resaltar(it.t, ts) + "</span>" +
            (it.r ? '<span class="pf-alc__r">' + resaltar(it.r, ts) + "</span>" : "") + "</a></li>";
        });
        h += "</ul>";
        if (n > POR_GRUPO) {
          var texto = "Ver " + g.art + " " + n + " " + g.varios;
          if (g.id === SECCION) { if (!PREVIA) h += '<button type="button" class="pf-alc__ver" data-alc="seccion">' + texto + FLECHA + "</button>"; } // en la vista previa lo lleva el pie
          else if (g.lista) h += '<a class="pf-alc__ver" href="' + esc(new URL(g.lista + encodeURIComponent(q), BASE).href) + '">' + texto + FLECHA + "</a>";
          else h += '<button type="button" class="pf-alc__ver" data-alc="todos" data-g="' + g.id + '" aria-expanded="' + todos + '">' + (todos ? "Ver menos" : texto) + FLECHA + "</button>";
        }
        h += "</section>";
      });
      var donde = amplio ? "todo el sitio" : EN;
      var cab = '<div class="pf-alc__cab"><p class="pf-alc__titulo">En ' + esc(donde) + (total ? " · <b>" + total + "</b> " + (total === 1 ? "resultado" : "resultados") : "") + "</p>" + volver + "</div>";
      if (!total) h = '<p class="pf-alc__nada">No encontramos nada con <b>«' + esc(q) + '»</b> en ' + (amplio ? "el sitio" : esc(EN)) + ". " +
        (amplio ? "Probá con menos palabras o con otra forma de decirlo." : 'Probá con otra palabra o <button type="button" class="pf-alc__en-sitio" data-alc="sitio">buscá en todo el sitio</button>.') + "</p>";
      // Vista previa: abajo, la lista de la sección (o la del sitio) con todos los resultados.
      var ir = PREVIA && total ? urlResultados(q) : null;
      var gs = res.length === 1 ? res[0].g : null;
      if (ir) h += '<a class="pf-alc__todos" href="' + esc(ir) + '">' + (gs ? "Ver " + (total === 1 ? (gs.art === "las" ? "la " : "el ") + gs.uno : gs.art + " " + total + " " + gs.varios) + " en " + esc(EN) : "Ver todos los resultados") + FLECHA + "</a>";
      panel.setAttribute("aria-label", "Resultados en " + donde);
      panel.innerHTML = cab + h;
      vivo.textContent = total ? total + (total === 1 ? " resultado" : " resultados") + " en " + donde : "Sin resultados en " + donde;
    }

    /* --- Alcance ------------------------------------------------------------------------------------- */
    function aHash() {
      if (PREVIA) return; // la página de lectura conserva su dirección
      var q = input.value.trim();
      try { history.replaceState(null, "", amplio ? "#en=sitio" + (q ? "&q=" + encodeURIComponent(q) : "") : location.pathname + location.search); } catch (e) {}
    }

    function ampliar() {
      if (amplio) return;
      amplio = true;
      swPintar();
      caja.classList.add("pf-alc--amplio");
      input.placeholder = "Buscá en todo el sitio";
      input.focus();
      mostrarPanel(true);
      cargar(); pintar(); aHash();
    }

    function restringir(enfocar) {
      if (!amplio) return;
      amplio = false;
      abiertos = {};
      swPintar();
      caja.classList.remove("pf-alc--amplio");
      input.placeholder = placeholder;
      mostrarPanel(false);
      vivo.textContent = "";
      if (PREVIA) pintar();
      aHash();
      // La página vuelve a filtrar su lista con lo escrito.
      input.dispatchEvent(new Event("input", { bubbles: true }));
      if (enfocar !== false) input.focus();
    }

    // Con el alcance amplio la página no recibe lo que se escribe: su lista queda como estaba.
    window.addEventListener("input", function (e) {
      if (e.target !== input || !(amplio || PREVIA)) return;
      e.stopImmediatePropagation();
      clearTimeout(t);
      t = setTimeout(function () { pintar(); aHash(); }, 80);
    }, true);

    // Pasar del campo al interruptor o al panel no cuenta como salir del buscador.
    window.addEventListener("blur", function (e) {
      if (e.target !== input) return;
      var r = e.relatedTarget;
      if (r && (caja.contains(r) || panel.contains(r))) e.stopImmediatePropagation();
    }, true);
    // Y salir desde el interruptor o el panel sí: la página cierra el buscador si quedó vacío.
    function salida(e) {
      var r = e.relatedTarget;
      if (r && (caja.contains(r) || panel.contains(r) || r === cerrar)) return;
      if (r) mostrarPanel(false);
      if (!input.value) input.dispatchEvent(new FocusEvent("blur", { relatedTarget: r }));
    }
    sw.addEventListener("focusout", salida);
    panel.addEventListener("focusout", salida);
    input.addEventListener("focus", function () { if (amplio) mostrarPanel(true); });

    sw.addEventListener("click", function (e) {
      var b = e.target.closest("[data-alc-sw]"); if (!b) return;
      if (b.dataset.alcSw === "sitio") ampliar(); else restringir();
    });
    sw.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault(); var b = swBtns[e.key === "ArrowLeft" ? 0 : 1]; b.click(); b.focus();
      } else if (e.key === "Escape") { e.preventDefault(); cerrar.click(); }
    });

    function enfocables() { return Array.prototype.slice.call(panel.querySelectorAll("a, button")); }
    input.addEventListener("keydown", function (e) {
      if (PREVIA && e.key === "Enter") {
        var q = input.value.trim(); if (!q) return;
        e.preventDefault();
        (indice ? Promise.resolve() : cargar() || Promise.resolve()).then(function () { var u = urlResultados(q); if (u) location.href = u; });
        return;
      }
      if (!amplio && !PREVIA) return;
      if ((e.key === "ArrowDown" || (e.key === "Enter" && !PREVIA)) && !panel.hidden) {
        var f = enfocables().filter(function (x) { return !x.classList.contains("pf-alc__volver"); });
        if (f.length) { e.preventDefault(); f[0].focus(); }
      }
    });
    panel.addEventListener("keydown", function (e) {
      var f = enfocables(), i = f.indexOf(document.activeElement);
      if (e.key === "ArrowDown" && i > -1) { e.preventDefault(); (f[i + 1] || f[i]).focus(); }
      else if (e.key === "ArrowUp" && i > -1) { e.preventDefault(); if (i > 0 && !f[i - 1].classList.contains("pf-alc__volver")) f[i - 1].focus(); else input.focus(); }
      else if (e.key === "Escape") { e.preventDefault(); cerrar.click(); }
    });
    panel.addEventListener("click", function (e) {
      var b = e.target.closest("[data-alc]"); if (!b) return;
      if (b.dataset.alc === "seccion") restringir();
      else if (b.dataset.alc === "sitio") ampliar();
      else if (b.dataset.alc === "todos") {
        abiertos[b.dataset.g] = !abiertos[b.dataset.g];
        pintar();
        var nb = panel.querySelector('[data-g="' + b.dataset.g + '"]'); if (nb) nb.focus();
      }
    });
    velo.addEventListener("click", function () { cerrar.click(); });

    // Al cerrar el buscador vuelve el alcance de la sección; al abrirlo se trae el índice.
    new MutationObserver(function () {
      var abierta = caja.classList.contains("pf-abierto");
      swTab(abierta ? 0 : -1);
      if (abierta) cargar();
      else if (amplio) restringir(false);
    }).observe(caja, { attributes: true, attributeFilter: ["class"] });

    /* --- Modo previa: el componente abre y cierra el buscador de la barra --------------------------------- */
    if (PREVIA && lupa) {
      var abrirB = function (si) {
        caja.classList.toggle("pf-abierto", si);
        if (nav) nav.classList.toggle("pf-buscando", si);
        lupa.setAttribute("aria-expanded", String(si));
        input.tabIndex = si ? 0 : -1;
        cerrar.tabIndex = si ? 0 : -1;
        if (si) setTimeout(function () { input.focus(); }, 60);
      };
      var cerrarB = function () { input.value = ""; mostrarPanel(false); panel.innerHTML = ""; abrirB(false); lupa.focus(); };
      cerrar.addEventListener("click", cerrarB);
      lupa.addEventListener("click", function () {
        if (!caja.classList.contains("pf-abierto")) abrirB(true);
        else if (!input.value) abrirB(false);
        else input.focus();
      });
      input.addEventListener("keydown", function (e) { if (e.key === "Escape") { e.preventDefault(); cerrarB(); } });
      input.addEventListener("blur", function () {
        setTimeout(function () { var a = document.activeElement; if (!input.value && a !== input && !caja.contains(a) && !panel.contains(a)) abrirB(false); }, 180);
      });
      document.addEventListener("keydown", function (e) {
        if (e.key === "/" && document.activeElement !== input && !/^(input|textarea)$/i.test(document.activeElement.tagName)) { e.preventDefault(); abrirB(true); }
      });
    }

    /* --- Sin resultados en la sección: ofrecer todo el sitio ------------------------------------------- */
    function vacioActual() {
      if (!ampliarVacio) return;
      var q = input.value.trim();
      if (!q || amplio || vacio.hidden) { ampliarVacio.hidden = true; return; }
      var n = 0;
      if (indice) buscar(q).forEach(function (r) { n += r.items.length; });
      ampliarVacio.textContent = indice && n ? "Buscar en todo el sitio (" + n + ")" : "Buscar en todo el sitio";
      ampliarVacio.hidden = false;
    }
    if (vacio) {
      new MutationObserver(vacioActual).observe(vacio, { attributes: true, attributeFilter: ["hidden"] });
      input.addEventListener("input", function () { setTimeout(vacioActual, 160); });
      ampliarVacio.addEventListener("click", function () {
        if (!caja.classList.contains("pf-abierto")) lupa.click();
        ampliar();
      });
    }

    /* --- Dirección: #en=sitio&q=texto abre el buscador en todo el sitio --------------------------------- */
    var p = {};
    location.hash.slice(1).split("&").forEach(function (par) {
      var i = par.indexOf("="); if (i < 1) return;
      try { p[par.slice(0, i)] = decodeURIComponent(par.slice(i + 1)); } catch (e) {}
    });
    if (caja.classList.contains("pf-abierto")) cargar();
    vacioActual();
    if (p.en === "sitio") {
      if (!caja.classList.contains("pf-abierto") && lupa) lupa.click();
      if (p.q) input.value = p.q;
      ampliar();
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();
})();
