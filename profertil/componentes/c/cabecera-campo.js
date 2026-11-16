/* Cabecera con campo: tarjeta con el título sobre un campo fijo de Formas que crecen en grupos.
   La página sube por encima al hacer scroll. Es la cabecera de la Nota de Novedades. */
(function () {
  var CATS = [["institucional", "Institucional"], ["financiera", "Gacetilla financiera"], ["somos", "Somos Profertil"], ["tecnico", "Artículo técnico"], ["aviso", "Aviso a la comunidad"], ["comercial", "Comercial"]];
  // Color del campo de cada categoría: el de la familia de su etiqueta.
  var COLOR_CAT = { institucional: "azul", financiera: "azul", somos: "verde", tecnico: "verde", aviso: "amarillo", comercial: "terra" };
  var NOMBRES_FORMA = { barras: "Barras", c: "C", capas: "Capas", casco: "Casco", circulos: "Círculos", escudo: "Escudo", estrella: "Estrella", flor: "Flor", grafico: "Gráfico", hoja: "Hoja", industria: "Industria", lupa: "Lupa", ondas: "Ondas", plantas: "Plantas", sol: "Sol", suelo: "Suelo", trigo: "Trigo", urea: "Urea" };
  var OPC_FORMA = [["categoria", "De la categoría", "La Forma del badge de la etiqueta."], ["varias", "Varias", "Cada grupo con una Forma distinta, de las 18."]]
    .concat(Object.keys(NOMBRES_FORMA).map(function (k) { return [k, NOMBRES_FORMA[k]]; }));
  var TEXTO = [
    "La nota sigue acá abajo. El campo queda fijo detrás de la página y esta hoja sube por encima al hacer scroll; cuando la tapa del todo, el campo deja de animar.",
    "Con el mouse, solo reaccionan las Formas en color de acento: cerca del cursor pasan al color de figura, salteadas y sin un borde que se lea. Un clic en el campo hace nacer un grupo en ese lugar.",
    "Cada grupo es de una sola Forma, crece celda por celda desde un punto, queda quieto entre 2,5 y 5 segundos y se deshace mientras nacen otros."
  ];

  Libreria.sumar({
    id: "cabecera-campo", nombre: "Cabecera con campo", grupo: "Medios", alto: 1100, previa: 0, mini: 1100, tamano: "ancha",
    base: ["etiqueta"],
    bajada: "Tarjeta con el título sobre un campo de Formas que crecen en grupos. La página sube por encima al hacer scroll.",
    nota: "Es la cabecera de la Nota de Novedades. El campo es un canvas fijo detrás de la página; la tarjeta y el resto del contenido van encima.",
    claves: [
      "El color del campo es el de la familia de la etiqueta de la categoría: azul para Institucional y Financiera, verde para Somos Profertil y Artículo técnico, amarillo para Aviso, terra para Comercial.",
      "Cada fondo lleva su figura y su acento: azul con celeste y amarillo, verde con verde claro y amarillo, amarillo con naranja y azul, terra con naranja y amarillo.",
      "Por defecto todo el campo usa la Forma de la categoría, la misma del badge de la etiqueta.",
      "Cada Forma ocupa el 72% de su celda. Nacen hasta 7 grupos a la vez; cada uno crece celda por celda, queda quieto entre 2,5 y 5 segundos y se deshace.",
      "Los grupos nacen sobre todo en la franja visible, entre la tarjeta y el final de la cabecera.",
      "Cursor: solo reaccionan las Formas en color de acento, que pasan al color de figura cerca del mouse. Cada Forma cambia o no, sin fundido, y el cursor se lee a saltos (cada 60 ms).",
      "Clic o toque en el campo: nace un grupo ahí. Hasta 5 por encima de los grupos de siempre; si se pasa, el grupo quieto más viejo se deshace.",
      "Cuando la página tapa la cabecera, el campo deja de animar y se esconde.",
      "Tarjeta: en desktop 700 de ancho en la columna central; en mobile de lado a lado con 12 a los costados. La hoja de abajo va de borde a borde con las esquinas de arriba redondeadas."
    ],
    accesibilidad: "El campo es decorativo (aria-hidden) y no recibe foco. Con movimiento reducido queda quieto y el clic no hace nada. El título es un h1 real dentro de la tarjeta.",
    controles: [
      { id: "cat", tipo: "select", etiqueta: "Categoría", def: "institucional", opciones: CATS, desc: "La etiqueta de la tarjeta. Con Color y Forma en automático, también define el campo." },
      { id: "color", tipo: "seg", etiqueta: "Color", def: "auto", opciones: [["auto", "Auto"], ["azul", "Azul"], ["verde", "Verde"], ["amarillo", "Amarillo"], ["terra", "Terra"]], desc: "Fondo, figura y acento del campo. Auto toma el de la categoría." },
      { id: "forma", tipo: "select", etiqueta: "Forma", def: "categoria", opciones: OPC_FORMA, desc: "La Forma de los grupos." },
      "---",
      { id: "titulo", tipo: "texto", etiqueta: "Título", def: "¡Ya está disponible nuestro Reporte de Sostenibilidad 2025!", aplica: { texto: ".pf-cc__titulo" }, desc: "Título de la nota." },
      { id: "anio", tipo: "texto", etiqueta: "Año", def: "2026", desc: "El dato de la etiqueta." },
      "---",
      { id: "alto", tipo: "rango", etiqueta: "Alto de la cabecera", unidad: "%", min: 40, max: 100, def: 70, aplica: { var: "--alto", unidad: "svh" }, desc: "Alto del campo, en % de la pantalla." },
      { id: "celda", tipo: "rango", etiqueta: "Celda", unidad: "px", min: 20, max: 56, def: 34, desc: "Lado de la celda de la grilla en desktop; en mobile es el 76%." },
      { id: "grupos", tipo: "rango", etiqueta: "Grupos a la vez", min: 2, max: 14, def: 7, desc: "Cuántos grupos crecen al mismo tiempo." },
      { id: "acento", tipo: "rango", etiqueta: "Formas en acento", unidad: "%", min: 0, max: 30, def: 8, desc: "Qué parte de las Formas sale en el color de acento." },
      "---",
      { id: "cursor", tipo: "interr", etiqueta: "Reacción al cursor", def: true, desc: "Las Formas de acento pasan a figura cerca del mouse." },
      { id: "clic", tipo: "interr", etiqueta: "Clic hace nacer grupos", def: true, desc: "Un clic o un toque en el campo hace nacer un grupo ahí." }
    ],
    css: function () {
      return [
        ".pf-cc { --alto: 70svh; font-family: var(--f-body); color: var(--ink); }",
        ".pf-cc__campo { position: fixed; inset: 0; width: 100%; height: 100lvh; z-index: 0; display: block; pointer-events: none; }",
        ".pf-cc__cab { position: relative; z-index: 1; min-height: var(--alto); padding: 24px 12px 88px; }",
        ".pf-cc__tarjeta { display: flex; flex-direction: column; gap: 16px; max-width: 700px; margin: 0 auto; padding: 22px 20px 26px; border-radius: var(--radio-tarjeta); background: var(--bg); }",
        ".pf-cc__arriba { display: flex; flex-direction: column; align-items: flex-start; gap: 10px; }",
        ".pf-cc__volver { display: inline-flex; align-items: center; gap: 6px; color: var(--ink-2); font-size: var(--texto-chico); text-decoration: none; }",
        ".pf-cc__volver svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }",
        ".pf-cc .pf-etiqueta__rotulo { outline: 1px solid var(--line); outline-offset: -1px; }",
        ".pf-cc__titulo { margin: 0; font: 500 var(--texto-titulo)/1.08 var(--f-display); letter-spacing: -.02em; color: var(--azul); text-wrap: balance; }",
        ".pf-cc__seguir { position: absolute; left: 50%; bottom: 24px; translate: -50% 0; width: 44px; height: 44px; border-radius: 50%; background: var(--bg); color: var(--ink); display: grid; place-items: center; transition: opacity 300ms ease; }",
        ".pf-cc__seguir svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }",
        ".pf-cc.pf-bajo .pf-cc__seguir { opacity: 0; }",
        ".pf-cc__hoja { position: relative; z-index: 2; min-height: 100vh; padding: 16px 16px 120px; background: var(--bg); border-radius: var(--radio-tarjeta) var(--radio-tarjeta) 0 0; }",
        ".pf-cc__hoja p { max-width: 700px; margin: 0 auto 20px; font-size: var(--texto-cuerpo); line-height: 1.6; color: var(--ink-2); }",
        ".pf-cc__hoja p:first-child { margin-top: 24px; font-size: var(--texto-destacado); color: var(--ink); }",
        "@media (min-width: 720px) {",
        "  .pf-cc__cab { padding: 24px 24px 96px; }",
        "  .pf-cc__tarjeta { padding: 32px 36px 36px; }",
        "  .pf-cc__hoja { padding: 64px 24px 160px; }",
        "}"
      ].join("\n");
    },
    html: function (s) {
      return '<div class="pf-cc" data-c="cabecera-campo">\n' +
        '  <canvas class="pf-cc__campo" aria-hidden="true"></canvas>\n' +
        '  <header class="pf-cc__cab">\n' +
        '    <div class="pf-cc__tarjeta">\n' +
        '      <div class="pf-cc__arriba">\n' +
        '        <a class="pf-cc__volver" href="#"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>Novedades</a>\n' +
        '        ' + SIS.etiqueta(s.cat, s.anio) + '\n' +
        '      </div>\n' +
        '      <h1 class="pf-cc__titulo">' + s.titulo + '</h1>\n' +
        '    </div>\n' +
        '    <span class="pf-cc__seguir" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 5v14M6 13l6 6 6-6"/></svg></span>\n' +
        '  </header>\n' +
        '  <main class="pf-cc__hoja">\n' + TEXTO.map(function (t) { return '    <p>' + t + '</p>'; }).join("\n") + '\n  </main>\n</div>';
    },
    js: function (s) {
      var cfg = {
        color: s.color === "auto" ? COLOR_CAT[s.cat] : s.color,
        forma: s.forma, deCat: SIS.CATEGORIAS[s.cat].forma,
        celda: +s.celda, grupos: +s.grupos, acento: +s.acento / 100, cursor: !!s.cursor, clic: !!s.clic
      };
      return "var PF_CC = " + JSON.stringify(cfg) + ";\n(" + function () {
        var C = PF_CC, raiz = document.querySelector(".pf-cc"), cv = raiz.querySelector(".pf-cc__campo");
        var cab = raiz.querySelector(".pf-cc__cab"), tarjeta = raiz.querySelector(".pf-cc__tarjeta");
        var tk = getComputedStyle(document.documentElement), t = function (n) { return tk.getPropertyValue(n).trim(); };
        // Paleta: fondo, figura y acento, desde tokens.css.
        var PAL = {
          azul: [t("--azul"), t("--celeste"), t("--amarillo")],
          verde: [t("--verde"), t("--verde-claro"), t("--amarillo")],
          amarillo: [t("--amarillo"), t("--naranja"), t("--azul")],
          terra: [t("--terra"), t("--naranja"), t("--amarillo")]
        }[C.color];
        var fondo = PAL[0], figura = PAL[1], acento = PAL[2];
        var TODAS = Object.keys(FORMAS).filter(function (k) { return FORMAS[k].vb && FORMAS[k].d && k !== "logo"; });
        function unaForma() {
          if (C.forma === "varias") return TODAS[Math.floor(Math.random() * TODAS.length)];
          return FORMAS[C.forma] ? C.forma : C.deCat;
        }
        var cache = {}, prop = {};
        TODAS.forEach(function (k) { var v = FORMAS[k].vb.split(/\s+/); prop[k] = +v[2] / +v[3]; });
        function tenida(k, color) {
          var c = k + color; if (cache[c]) return cache[c];
          var im = new Image();
          im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + FORMAS[k].vb + '" fill="' + color + '">' + FORMAS[k].d + "</svg>");
          return (cache[c] = im);
        }
        TODAS.forEach(function (k) { tenida(k, figura); tenida(k, acento); });

        var ctx = cv.getContext("2d"), dpr = Math.min(window.devicePixelRatio || 1, 2);
        var reducir = matchMedia("(prefers-reduced-motion: reduce)").matches;
        var W, H, CELDA, cols, filas, grilla, grupos = [], sembrado = false, activo = true;
        var VEC = [[1, 0], [-1, 0], [0, 1], [0, -1]];
        function azar(a, b) { return a + Math.random() * (b - a); }
        function idx(x, y) { return y * cols + x; }
        function medir() {
          W = innerWidth; H = Math.max(innerHeight, document.documentElement.clientHeight);
          cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.height = H + "px";
          CELDA = Math.round(W < 720 ? C.celda * 0.76 : C.celda);
          cols = Math.ceil(W / CELDA) + 1; filas = Math.ceil(H / CELDA) + 1;
          grilla = new Array(cols * filas).fill(null); grupos = []; sembrado = false;
        }
        // Donde conviene que nazcan: entre la tarjeta y el final de la cabecera.
        function zona() {
          var a = tarjeta.getBoundingClientRect(), b = cab.getBoundingClientRect();
          var z = { y0: Math.floor((a.bottom + 8) / CELDA), y1: Math.min(filas - 1, Math.floor(b.bottom / CELDA)) };
          return z.y1 - z.y0 < 3 ? { y0: 0, y1: filas - 1 } : z;
        }
        function grupo(borde, ahora, rapido) {
          var g = { forma: unaForma(), celdas: [], borde: borde, meta: Math.floor(rapido ? azar(10, 20) : azar(8, 26)),
            estado: "crece", proximo: ahora, ritmo: rapido ? azar(40, 70) : azar(70, 140), espera: azar(2500, 5000) };
          grupos.push(g); return g;
        }
        function nuevoGrupo(ahora) {
          var z = zona();
          for (var i = 0; i < 30; i++) {
            var x = Math.floor(azar(0, cols - 1));
            var y = Math.random() < 0.25 ? Math.floor(azar(0, filas - 1)) : Math.floor(azar(z.y0, z.y1));
            if (!grilla[idx(x, y)]) return grupo([[x, y]], ahora);
          }
        }
        function paso(g, ahora) {
          if (ahora < g.proximo) return;
          g.proximo = ahora + g.ritmo;
          if (g.estado === "crece") {
            while (g.borde.length) {
              var p = g.borde.splice(Math.floor(Math.random() * g.borde.length), 1)[0];
              if (p[0] < 0 || p[1] < 0 || p[0] >= cols || p[1] >= filas || grilla[idx(p[0], p[1])]) continue;
              var c = { x: p[0], y: p[1], nace: ahora, muere: 0, forma: g.forma, color: Math.random() < C.acento ? acento : figura, v: Math.random() };
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
        function sembrar() {
          var t0 = performance.now();
          for (var i = 0; i < C.grupos; i++) {
            var g = nuevoGrupo(t0); if (!g) continue;
            var k = Math.floor(g.meta * azar(0.4, 1));
            for (var j = 0; j < k; j++) { g.proximo = 0; g.estado = "crece"; paso(g, t0 - 1000); }
            g.estado = g.celdas.length >= g.meta ? "quieto" : "crece";
            g.celdas.forEach(function (c) { c.nace = t0 - 1000; });
            g.proximo = t0 + (g.estado === "quieto" ? g.espera * azar(0.3, 1) : azar(0, 2000));
          }
          sembrado = true;
        }
        // Cursor: solo las Formas de acento, salteadas y sin borde; el cursor se lee a saltos.
        var raton = null, muestra = null, ultima = 0, PICO = 0.95, CURVA = 2, ALCANCE = 0.6, PASO = 60;
        if (C.cursor) {
          addEventListener("pointermove", function (e) { if (e.pointerType === "mouse") { raton = { x: e.clientX, y: e.clientY }; if (reducir) { muestra = raton; dibujar(performance.now()); } } }, { passive: true });
          document.documentElement.addEventListener("pointerleave", function () { raton = null; if (reducir) { muestra = null; dibujar(performance.now()); } });
        }
        function cambia(c, D) {
          if (!muestra || c.color !== acento) return false;
          var d = Math.hypot(c.x * CELDA + CELDA / 2 - muestra.x, c.y * CELDA + CELDA / 2 - muestra.y);
          return c.v < PICO * Math.pow(Math.max(0, 1 - d / D), CURVA);
        }
        function suave(x) { return 1 - Math.pow(1 - x, 3); }
        function dibujar(ahora) {
          if (!reducir && ahora - ultima >= PASO) { muestra = raton; ultima = ahora; }
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx.fillStyle = fondo; ctx.fillRect(0, 0, W, H);
          var lado = CELDA * 0.72, D = Math.min(W, H) * ALCANCE;
          for (var k = 0; k < grilla.length; k++) {
            var c = grilla[k]; if (!c) continue;
            var s = c.muere ? 1 - suave(Math.min(1, (ahora - c.muere) / 300)) : suave(Math.min(1, (ahora - c.nace) / 260));
            var im = tenida(c.forma, cambia(c, D) ? figura : c.color);
            if (s <= 0 || !im.complete) continue;
            var r = prop[c.forma], w = r >= 1 ? lado : lado * r, h = r >= 1 ? lado / r : lado;
            ctx.drawImage(im, c.x * CELDA + (CELDA - w * s) / 2, c.y * CELDA + (CELDA - h * s) / 2, w * s, h * s);
          }
        }
        function cuadro(ahora) {
          if (!sembrado) sembrar();
          if (activo) {
            while (grupos.length < C.grupos && nuevoGrupo(ahora + azar(0, 1500))) {}
            grupos.forEach(function (g) { paso(g, ahora); });
            grupos = grupos.filter(function (g) { return g.estado !== "fin"; });
            dibujar(ahora);
          }
          if (!reducir) requestAnimationFrame(cuadro);
        }
        // Clic: nace un grupo en ese lugar (fuera de la tarjeta y los enlaces).
        if (C.clic) cab.addEventListener("click", function (e) {
          if (reducir || !W || e.target.closest(".pf-cc__tarjeta, a, button")) return;
          var cx = Math.floor(e.clientX / CELDA), cy = Math.floor(e.clientY / CELDA), borde = [];
          for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
            var x = cx + dx, y = cy + dy;
            if (x >= 0 && y >= 0 && x < cols && y < filas && !grilla[idx(x, y)]) borde.push([x, y]);
          }
          if (!borde.length) return;
          if (grupos.length >= C.grupos + 5) { var viejo = grupos.filter(function (g) { return g.estado === "quieto"; })[0]; if (viejo) { viejo.estado = "decrece"; viejo.proximo = 0; } }
          grupo(borde, performance.now(), true);
        });
        // Ahorro: cuando la página tapa la cabecera, el campo deja de animar y se esconde.
        addEventListener("scroll", function () { raiz.classList.toggle("pf-bajo", scrollY > 40); }, { passive: true });
        new IntersectionObserver(function (e) { activo = e[0].isIntersecting; cv.style.visibility = activo ? "" : "hidden"; }).observe(cab);
        var ancho = innerWidth;
        addEventListener("resize", function () { if (innerWidth !== ancho) { ancho = innerWidth; medir(); } });
        medir();
        if (reducir) setTimeout(function () { sembrar(); dibujar(performance.now()); }, 300);
        else requestAnimationFrame(cuadro);
      } + ")();";
    }
  });
})();
