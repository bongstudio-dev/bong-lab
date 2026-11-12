/* Buscador con alcance: se suma al buscador de la barra (pieza "barra" de base.css) de cualquier página.

   <link rel="stylesheet" href="../buscador/alcance.css">
   <script src="../buscador/alcance.js" data-seccion="documentos" data-nombre="Documentos" defer></script>

   data-seccion es el id del grupo del índice que corresponde a la página; data-nombre, cómo se nombra en el chip.
   La página conserva su buscador: con el chip puesto, cada letra la filtra en el lugar como siempre. Sin el chip
   el componente toma el campo, busca en ../buscador/indice.json y muestra el panel por tipo.
   Usa los ids de la barra: pf-busca, pf-q, pf-nav, pf-goSearch, pf-qClose y, si está, pf-empty.
   La dirección guarda el alcance amplio: #en=sitio&q=texto. */
(function () {
  "use strict";
  var yo = document.currentScript;
  var SECCION = yo.dataset.seccion || "", NOMBRE = yo.dataset.nombre || "esta sección";
  var BASE = new URL("../", yo.src);
  var POR_GRUPO = 5;
  var X = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2 2l8 8M10 2 2 10"/></svg>';
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
    var chip = document.createElement("button");
    chip.type = "button";
    chip.className = "pf-chip pf-alc__chip";
    chip.setAttribute("aria-pressed", "true");
    chip.setAttribute("aria-label", "Buscando solo en " + NOMBRE + ". Quitar para buscar en todo el sitio");
    chip.innerHTML = '<span><span class="pf-alc__en">En: </span>' + esc(NOMBRE) + "</span>" + X;
    chip.tabIndex = caja.classList.contains("pf-abierto") ? 0 : -1;
    caja.insertBefore(chip, input);

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
    function mostrarPanel(si) {
      panel.hidden = !si;
      velo.hidden = !si;
    }

    function pintar() {
      if (!amplio) return;
      var q = input.value.trim(), ts = terminos(q);
      var volver = '<button type="button" class="pf-alc__volver" data-alc="seccion">Buscar solo en ' + esc(NOMBRE) + "</button>";
      if (!ts.length) {
        panel.innerHTML = '<div class="pf-alc__cab"><p class="pf-alc__titulo">En todo el sitio</p>' + volver + "</div>" +
          '<p class="pf-alc__nada">Escribí para buscar en documentos, notas y páginas.</p>';
        vivo.textContent = "";
        return;
      }
      if (!indice) {
        panel.innerHTML = '<div class="pf-alc__cab"><p class="pf-alc__titulo">En todo el sitio</p>' + volver + "</div>" +
          '<p class="pf-alc__nada">' + (fallo ? "No se pudo cargar el buscador del sitio. Probá de nuevo en un momento." : "Buscando…") + "</p>";
        if (!fallo) cargar();
        return;
      }
      var res = buscar(q), total = 0, h = "";
      res.forEach(function (r) {
        var n = r.items.length; total += n;
        if (!n) return;
        var g = r.g, todos = !!abiertos[g.id], vis = todos ? r.items : r.items.slice(0, POR_GRUPO);
        h += '<section class="pf-alc__grupo" aria-label="' + esc(g.nombre) + '"><h2 class="pf-alc__g">' + esc(g.nombre) + '<span class="pf-alc__n">' + n + "</span></h2><ul class=\"pf-alc__lista\">";
        vis.forEach(function (it) {
          h += '<li><a class="pf-alc__item" href="' + esc(it.u) + '"><span class="pf-alc__t">' + resaltar(it.t, ts) + "</span>" +
            (it.r ? '<span class="pf-alc__r">' + resaltar(it.r, ts) + "</span>" : "") + "</a></li>";
        });
        h += "</ul>";
        if (n > POR_GRUPO) {
          var texto = "Ver " + g.art + " " + n + " " + g.varios;
          if (g.id === SECCION) h += '<button type="button" class="pf-alc__ver" data-alc="seccion">' + texto + FLECHA + "</button>";
          else if (g.lista) h += '<a class="pf-alc__ver" href="' + esc(new URL(g.lista + encodeURIComponent(q), BASE).href) + '">' + texto + FLECHA + "</a>";
          else h += '<button type="button" class="pf-alc__ver" data-alc="todos" data-g="' + g.id + '" aria-expanded="' + todos + '">' + (todos ? "Ver menos" : texto) + FLECHA + "</button>";
        }
        h += "</section>";
      });
      var cab = '<div class="pf-alc__cab"><p class="pf-alc__titulo">En todo el sitio' + (total ? " · <b>" + total + "</b> " + (total === 1 ? "resultado" : "resultados") : "") + "</p>" + volver + "</div>";
      if (!total) h = '<p class="pf-alc__nada">No encontramos nada con <b>«' + esc(q) + '»</b> en el sitio. Probá con menos palabras o con otra forma de decirlo.</p>';
      panel.innerHTML = cab + h;
      vivo.textContent = total ? total + (total === 1 ? " resultado" : " resultados") + " en todo el sitio" : "Sin resultados en todo el sitio";
    }

    /* --- Alcance ------------------------------------------------------------------------------------- */
    function aHash() {
      var q = input.value.trim();
      try { history.replaceState(null, "", amplio ? "#en=sitio" + (q ? "&q=" + encodeURIComponent(q) : "") : location.pathname + location.search); } catch (e) {}
    }

    function ampliar() {
      if (amplio) return;
      amplio = true;
      chip.hidden = true;
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
      chip.hidden = false;
      caja.classList.remove("pf-alc--amplio");
      input.placeholder = placeholder;
      mostrarPanel(false);
      vivo.textContent = "";
      aHash();
      // La página vuelve a filtrar su lista con lo escrito.
      input.dispatchEvent(new Event("input", { bubbles: true }));
      if (enfocar !== false) input.focus();
    }

    // Con el alcance amplio la página no recibe lo que se escribe: su lista queda como estaba.
    window.addEventListener("input", function (e) {
      if (e.target !== input || !amplio) return;
      e.stopImmediatePropagation();
      clearTimeout(t);
      t = setTimeout(function () { pintar(); aHash(); }, 80);
    }, true);

    // Pasar del campo al chip o al panel no cuenta como salir del buscador.
    window.addEventListener("blur", function (e) {
      if (e.target !== input) return;
      var r = e.relatedTarget;
      if (r && (caja.contains(r) || panel.contains(r))) e.stopImmediatePropagation();
    }, true);
    // Y salir desde el chip o el panel sí: la página cierra el buscador si quedó vacío.
    function salida(e) {
      var r = e.relatedTarget;
      if (r && (caja.contains(r) || panel.contains(r) || r === cerrar)) return;
      if (r) mostrarPanel(false);
      if (!input.value) input.dispatchEvent(new FocusEvent("blur", { relatedTarget: r }));
    }
    chip.addEventListener("focusout", salida);
    panel.addEventListener("focusout", salida);
    input.addEventListener("focus", function () { if (amplio) mostrarPanel(true); });

    chip.addEventListener("click", ampliar);
    chip.addEventListener("keydown", function (e) {
      if (e.key === "Backspace" || e.key === "Delete") { e.preventDefault(); ampliar(); }
      else if (e.key === "ArrowRight") { e.preventDefault(); input.focus(); }
      else if (e.key === "Escape") { e.preventDefault(); cerrar.click(); }
    });

    function enfocables() { return Array.prototype.slice.call(panel.querySelectorAll("a, button")); }
    input.addEventListener("keydown", function (e) {
      if (e.key === "Backspace" && !amplio && input.selectionStart === 0 && input.selectionEnd === 0) { e.preventDefault(); ampliar(); return; }
      if (!amplio) return;
      if ((e.key === "ArrowDown" || e.key === "Enter") && !panel.hidden) {
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
      chip.tabIndex = abierta ? 0 : -1;
      if (abierta) cargar();
      else if (amplio) restringir(false);
    }).observe(caja, { attributes: true, attributeFilter: ["class"] });

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
