/* Controles, botones y avisos del sistema web de Profertil.
   Salen de dos páginas ya aprobadas: Novedades (Master, ◈ Componentes UI) y la herramienta
   de Arquitectura. El código es el de esas páginas, ordenado para usarse solo. */
(function () {
  var T = "--tiza: #FFFEEF; --tinta: #0A1E4A; --tinta-2: #44506E; --azul: #003DA5; --linea: rgba(10, 30, 74, .1);" +
    " --f-d: \"Familjen Grotesk\", \"Helvetica Neue\", Arial, sans-serif; --f-b: \"DM Sans\", \"Helvetica Neue\", Arial, sans-serif;";
  // El JS de cada control se escribe como función real y se copia tal cual.
  function fuente(fn) { return "(" + fn.toString() + ")();"; }
  var CAT = [["Institucional", "#003DA5"], ["Comercial", "#E57F19"], ["Somos Profertil", "#5EB53A"], ["Artículo técnico", "#2D8035"], ["Aviso a la comunidad", "#EABA2C"], ["Gacetilla financiera", "#4086FF"]];
  var ANIOS = [["2026", 12], ["2025", 12], ["2024", 10], ["2023", 7], ["2022", 14], ["2021", 40]];

  /* ------------------------------------------------------------------ Selector */
  var IC_VISTA = {
    chico: '<svg viewBox="0 0 15 15" aria-hidden="true"><path d="M1 1h3v3H1zM6 1h3v3H6zM11 1h3v3h-3zM1 6h3v3H1zM6 6h3v3H6zM11 6h3v3h-3zM1 11h3v3H1zM6 11h3v3H6zM11 11h3v3h-3z"/></svg>',
    medio: '<svg viewBox="0 0 15 15" aria-hidden="true"><path d="M1 1h5.5v5.5H1zM8.5 1H14v5.5H8.5zM1 8.5h5.5V14H1zM8.5 8.5H14V14H8.5z"/></svg>',
    grande: '<svg viewBox="0 0 15 15" aria-hidden="true"><rect x="1" y="1" width="13" height="13" rx="2.5"/></svg>'
  };
  Libreria.sumar({
    id: "selector", nombre: "Selector", grupo: "Controles", alto: "auto", mini: 560,
    bajada: "Opciones de una sola elección en una cápsula, con un indicador marfil que se desliza a la elegida.",
    variantes: [["texto", "Texto", "Orden de la grilla en Novedades: más recientes o más antiguas."], ["iconos", "Íconos", "Tamaño de las tarjetas: chico, medio y grande. En mobile no hay chico."]],
    controles: [
      { id: "t", tipo: "rango", etiqueta: "Duración del deslizamiento", unidad: "ms", min: 160, max: 800, paso: 20, def: 420, aplica: { var: "--t", unidad: "ms" }, desc: "Web/Movimiento/Vista del Master." }
    ],
    claves: ["Siempre hay una opción elegida; el indicador se ubica sobre ella con JS (ancho y posición del botón).", "Al cambiar, el indicador se desliza en 420 ms con la curva de la vista: cubic-bezier(.67, 0, .24, .99).", "La elegida va en azul y en 500; las demás en tinta secundaria.", "Al cargar, el indicador aparece en su lugar sin animarse."],
    accesibilidad: "Botones reales con aria-pressed dentro de un grupo con nombre. Con movimiento reducido el indicador salta sin deslizarse.",
    css: function () {
      return [
        ".selector { " + T + " --t: 420ms; --curva: cubic-bezier(.67, 0, .24, .99); display: flex; justify-content: center; font-family: var(--f-b); }",
        ".seg { position: relative; isolation: isolate; display: inline-flex; padding: 3px; border-radius: 999px; background: var(--linea); }",
        ".seg-ind { position: absolute; z-index: -1; top: 3px; left: 0; bottom: 3px; width: 0; border-radius: 999px; background: var(--tiza);",
        "  box-shadow: 0 1px 3px rgba(10, 30, 74, .12); pointer-events: none; transition: transform var(--t) var(--curva), width var(--t) var(--curva); }",
        ".seg-ind.quieto { transition: none; }",
        ".seg button { border: 0; background: transparent; cursor: pointer; padding: 6px 13px; border-radius: 999px; font: inherit; font-size: .86rem; color: var(--tinta-2); transition: color 240ms ease; }",
        ".seg button[aria-pressed=\"true\"] { color: var(--azul); font-weight: 500; }",
        ".seg.iconos button { display: grid; place-items: center; padding: 6px 11px; }",
        ".seg.iconos svg { width: 15px; height: 15px; fill: currentColor; }",
        "@media (max-width: 640px) { .seg.iconos [data-v=\"chico\"] { display: none; } }",
        "@media (prefers-reduced-motion: reduce) { .seg-ind { transition: none; } }"
      ].join("\n");
    },
    html: function (s) {
      var op = s.variante === "iconos"
        ? [["chico", IC_VISTA.chico, "Tarjetas chicas"], ["medio", IC_VISTA.medio, "Tarjetas medianas"], ["grande", IC_VISTA.grande, "Tarjetas grandes"]]
        : [["recientes", "Más recientes"], ["antiguas", "Más antiguas"]];
      var elegida = s.variante === "iconos" ? "medio" : "recientes";
      return '<div class="selector" data-c="selector">\n  <div class="seg' + (s.variante === "iconos" ? ' iconos' : '') + '" role="group" aria-label="' + (s.variante === "iconos" ? 'Tamaño de las tarjetas' : 'Orden') + '">\n    <span class="seg-ind" aria-hidden="true"></span>\n' +
        op.map(function (o) { return '    <button type="button" data-v="' + o[0] + '" aria-pressed="' + (o[0] === elegida) + '"' + (o[2] ? ' aria-label="' + o[2] + '"' : '') + '>' + o[1] + '</button>'; }).join("\n") + '\n  </div>\n</div>';
    },
    js: function () {
      return fuente(function () {
        // Lleva el indicador al botón elegido; sin animar la primera vez.
        function mover(seg, animar) {
          var ind = seg.querySelector(".seg-ind"), b = seg.querySelector('button[aria-pressed="true"]');
          if (!b || !b.offsetWidth) return;
          if (!animar) ind.classList.add("quieto");
          ind.style.width = b.offsetWidth + "px";
          ind.style.transform = "translateX(" + b.offsetLeft + "px)";
          if (!animar) { void ind.offsetWidth; ind.classList.remove("quieto"); }
        }
        document.querySelectorAll(".seg").forEach(function (seg) {
          mover(seg, false);
          seg.addEventListener("click", function (e) {
            var b = e.target.closest("button"); if (!b) return;
            seg.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
            mover(seg, true);
          });
        });
        addEventListener("resize", function () { document.querySelectorAll(".seg").forEach(function (s) { mover(s, false); }); });
        document.fonts && document.fonts.ready.then(function () { document.querySelectorAll(".seg").forEach(function (s) { mover(s, false); }); });
      });
    }
  });

  /* ------------------------------------------------------------------ Pastilla de filtro */
  Libreria.sumar({
    id: "pastilla-filtro", nombre: "Pastilla de filtro", grupo: "Controles", alto: "auto", mini: 560,
    bajada: "Las pastillas de los filtros: una categoría por vez, o varios años con su cantidad.",
    variantes: [["categoria", "Categoría", "Una sola por vez. El color sale de la familia de la categoría; Todas sin elegir es transparente."], ["anio", "Año con cantidad", "Se pueden elegir varios. El número dice cuántas notas cumplen los otros filtros."]],
    controles: [
      { id: "h", tipo: "rango", etiqueta: "Alto", unidad: "px", min: 22, max: 40, def: 32, aplica: { var: "--h", unidad: "px" }, desc: "El radio, el texto y el aire escalan con el alto (22 en las tarjetas, 32 en el panel)." }
    ],
    claves: ["Sin elegir: el color de la categoría al 16% sobre blanco, con el texto en el color pleno.", "Elegida: el color pleno con el texto en tiza.", "Radio 32% del alto: es una pastilla de filtro, no un botón redondo.", "En Categoría se elige una por vez; en Año, varias."],
    accesibilidad: "Botones con aria-pressed. El número va como texto real después del año.",
    css: function () {
      return [
        ".pastillas { " + T + " --h: 32px; display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; max-width: 620px; margin: 0 auto; }",
        ".sub { display: inline-flex; align-items: center; gap: 6px; flex: none; height: var(--h); padding: 0 calc(var(--h) * .42); border: 0; border-radius: calc(var(--h) * .32);",
        "  background: color-mix(in srgb, var(--c) 16%, #fff); color: var(--c); font: 500 calc(var(--h) * .5)/1 var(--f-b); white-space: nowrap; cursor: pointer; transition: background 160ms ease, color 160ms ease; }",
        "@media (hover: hover) and (pointer: fine) { .sub:hover { background: color-mix(in srgb, var(--c) 28%, #fff); } }",
        ".sub[aria-pressed=\"true\"] { background: var(--c); color: var(--tiza); }",
        ".sub.todas { --c: var(--tinta); background: transparent; }",
        ".sub.todas[aria-pressed=\"true\"] { background: var(--tinta); }",
        ".sub .n { font-weight: 400; opacity: .7; font-variant-numeric: tabular-nums; }",
        ".sub-anio { --c: var(--azul); font-variant-numeric: tabular-nums; }"
      ].join("\n");
    },
    html: function (s) {
      var b;
      if (s.variante === "anio") b = ANIOS.map(function (a, i) { return '  <button type="button" class="sub sub-anio" aria-pressed="' + (i === 1) + '">' + a[0] + ' <b class="n">' + a[1] + '</b></button>'; });
      else b = ['  <button type="button" class="sub todas" aria-pressed="false">Todas</button>'].concat(CAT.map(function (c, i) { return '  <button type="button" class="sub" style="--c: ' + c[1] + '" aria-pressed="' + (i === 0) + '">' + c[0] + '</button>'; }));
      return '<div class="pastillas" data-c="pastilla-filtro" role="group" aria-label="' + (s.variante === "anio" ? 'Años' : 'Categoría') + '">\n' + b.join("\n") + '\n</div>';
    },
    js: function (s) {
      return "var VARIOS = " + (s.variante === "anio") + ";\n" + fuente(function () {
        var caja = document.querySelector(".pastillas");
        caja.addEventListener("click", function (e) {
          var b = e.target.closest(".sub"); if (!b) return;
          if (VARIOS) { b.setAttribute("aria-pressed", String(b.getAttribute("aria-pressed") !== "true")); return; }
          caja.querySelectorAll(".sub").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
        });
      });
    }
  });

  /* ------------------------------------------------------------------ Interruptor */
  Libreria.sumar({
    id: "interruptor", nombre: "Interruptor", grupo: "Controles", alto: "auto", mini: 560,
    bajada: "Prendido o apagado, solo o en una fila con su texto. Es UI/Toggle del Master.",
    variantes: [["solo", "Solo", "El interruptor suelto, para barras y paneles."], ["fila", "Fila con texto", "Título, descripción y el interruptor a la derecha (UI/Fila toggle)."]],
    controles: [
      { id: "on", tipo: "interr", etiqueta: "Arranca prendido", def: true, desc: "Estado inicial (aria-checked)." }
    ],
    claves: ["56 × 32, píldora de radio 16, perilla de 26 con 3 de aire.", "Prendido en verde de marca, apagado en gris.", "Toda la fila es el control: se toca el texto o el interruptor."],
    accesibilidad: "Botón con role=\"switch\" y aria-checked; el texto de la fila es su nombre.",
    css: function () {
      return [
        ".interruptor { " + T + " display: flex; justify-content: center; font-family: var(--f-b); }",
        ".tg { position: relative; flex: none; width: 56px; height: 32px; padding: 0; border: 0; border-radius: 16px; background: #D9D9D9; cursor: pointer; transition: background 200ms ease; }",
        ".tg::after { content: \"\"; position: absolute; top: 3px; left: 3px; width: 26px; height: 26px; border-radius: 50%; background: #fff; box-shadow: 0 1px 3px rgba(10, 30, 74, .2); transition: transform 240ms cubic-bezier(.22, 1, .36, 1); }",
        ".tg[aria-checked=\"true\"] { background: #2D8035; }",
        ".tg[aria-checked=\"true\"]::after { transform: translateX(24px); }",
        ".fila-tg { display: flex; align-items: center; justify-content: space-between; gap: 24px; width: min(420px, 100%); padding: 18px 18px 18px 20px; border: 0; border-radius: 16px; background: #fff; text-align: left; cursor: pointer; font: inherit; color: var(--tinta); }",
        ".fila-tg b { display: block; font-weight: 500; }",
        ".fila-tg span { display: block; font-size: 13px; color: var(--tinta-2); }",
        "@media (prefers-reduced-motion: reduce) { .tg, .tg::after { transition: none; } }"
      ].join("\n");
    },
    html: function (s) {
      if (s.variante === "fila") return '<div class="interruptor" data-c="interruptor">\n  <button type="button" class="fila-tg" role="switch" aria-checked="' + s.on + '"><span><b>Avisos por mail</b><span>Te escribimos cuando hay una novedad.</span></span><span class="tg" aria-hidden="true"></span></button>\n</div>';
      return '<div class="interruptor" data-c="interruptor">\n  <button type="button" class="tg" role="switch" aria-checked="' + s.on + '" aria-label="Avisos por mail"></button>\n</div>';
    },
    js: function () {
      return fuente(function () {
        document.querySelectorAll('[role="switch"]').forEach(function (b) {
          var tg = b.classList.contains("tg") ? b : b.querySelector(".tg");
          var pintar = function () { if (tg !== b) tg.setAttribute("aria-checked", b.getAttribute("aria-checked")); };
          pintar();
          b.addEventListener("click", function () { b.setAttribute("aria-checked", String(b.getAttribute("aria-checked") !== "true")); pintar(); });
        });
      });
    }
  });

  /* ------------------------------------------------------------------ Desplegable de pastillas */
  var TIPOS = [["pagina", "Página", "#003DA5"], ["plantilla", "Plantilla", "#2D8035"], ["seccion", "Sección", "#4086FF"], ["registros", "Registros", "#E57F19"], ["arte", "Arte", "#8A4818"]];
  Libreria.sumar({
    id: "desplegable", nombre: "Desplegable de pastillas", grupo: "Controles", alto: "auto", mini: 560,
    bajada: "Un select hecho con pastillas: la elegida con su flecha, y al tocarla se abre el resto en un contenedor gris.",
    controles: [
      { id: "h", tipo: "rango", etiqueta: "Alto de la pastilla", unidad: "px", min: 24, max: 40, def: 30, aplica: { var: "--h", unidad: "px" }, desc: "Alto de la elegida y de las opciones." }
    ],
    claves: ["Reemplaza al select nativo: Marcos lo pidió así porque el nativo desconecta.", "Se comporta como un select: tiene value y dispara change.", "Se cierra al elegir, con Escape o tocando afuera; las flechas del teclado recorren las opciones.", "La elegida lleva un aro de tinta dentro del contenedor."],
    accesibilidad: "Botón con aria-haspopup=\"listbox\" y aria-expanded; las opciones son role=\"option\" con aria-selected.",
    css: function () {
      return [
        ".desplegable { " + T + " --h: 30px; --ease: cubic-bezier(.22, 1, .36, 1); display: flex; justify-content: center; align-items: flex-start; min-height: 180px; font-family: var(--f-b); }",
        ".pl { display: inline-flex; align-items: center; flex: none; height: var(--h); padding: 0 calc(var(--h) * .47) 2px; border-radius: 999px; background: var(--c); color: var(--tiza); font: 400 calc(var(--h) * .47)/1 var(--f-d); white-space: nowrap; }",
        ".psel { position: relative; }",
        ".psel-b { display: inline-flex; border: 0; background: none; padding: 0; border-radius: 999px; cursor: pointer; }",
        ".psel-b .pl { gap: 5px; padding-right: calc(var(--h) * .3); }",
        ".psel-b svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; margin-top: 2px; transition: transform 300ms var(--ease); }",
        ".psel-b[aria-expanded=\"true\"] svg { transform: rotate(180deg); }",
        ".psel-m { position: absolute; top: calc(100% + 6px); left: 0; z-index: 20; display: flex; flex-wrap: wrap; gap: 6px; width: max-content; max-width: 300px; padding: 8px; background: #E4E5DE; border-radius: 20px; box-shadow: 0 24px 60px -24px rgba(10, 30, 74, .5); animation: psel-in 240ms var(--ease); }",
        ".psel-m[hidden] { display: none; }",
        ".psel-m button { border: 0; background: none; padding: 0; border-radius: 999px; cursor: pointer; transition: transform 180ms var(--ease); }",
        ".psel-m [aria-selected=\"true\"] .pl { box-shadow: 0 0 0 2px #E4E5DE, 0 0 0 4px var(--tinta); }",
        "@media (hover: hover) and (pointer: fine) { .psel-m button:hover { transform: translateY(-1px); } }",
        "@keyframes psel-in { from { opacity: 0; transform: translateY(-6px); } }",
        "@media (prefers-reduced-motion: reduce) { .psel-m { animation: none; } }"
      ].join("\n");
    },
    html: function () {
      var chev = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
      return '<div class="desplegable" data-c="desplegable">\n  <span id="et-tipo" hidden>Tipo</span>\n  <div class="psel" data-value="pagina">\n' +
        '    <button type="button" class="psel-b" aria-haspopup="listbox" aria-expanded="false" aria-labelledby="et-tipo"><span class="pl" style="--c: #003DA5">Página' + chev + '</span></button>\n' +
        '    <div class="psel-m" role="listbox" aria-labelledby="et-tipo" hidden>' + TIPOS.map(function (t, i) {
          return '<button type="button" role="option" data-v="' + t[0] + '" aria-selected="' + (i === 0) + '"><span class="pl" style="--c: ' + t[2] + '">' + t[1] + '</span></button>'; }).join("") + '</div>\n  </div>\n</div>';
    },
    js: function () {
      return fuente(function () {
        document.querySelectorAll(".psel").forEach(function (x) {
          var b = x.querySelector(".psel-b"), m = x.querySelector(".psel-m");
          function abrir(si) { b.setAttribute("aria-expanded", String(si)); m.hidden = !si; if (si) m.querySelector('[aria-selected="true"]').focus(); }
          b.addEventListener("click", function () { abrir(m.hidden); });
          m.addEventListener("click", function (e) {
            var o = e.target.closest("[data-v]"); if (!o) return;
            m.querySelectorAll("[data-v]").forEach(function (y) { y.setAttribute("aria-selected", String(y === o)); });
            var pl = o.querySelector(".pl"), cab = b.querySelector(".pl");
            cab.style.setProperty("--c", pl.style.getPropertyValue("--c")); cab.firstChild.textContent = pl.textContent;
            x.dataset.value = o.dataset.v; abrir(false); b.focus(); x.dispatchEvent(new Event("change", { bubbles: true }));
          });
          x.addEventListener("keydown", function (e) {
            if (m.hidden) return;
            if (e.key === "Escape") { abrir(false); b.focus(); return; }
            if (/^Arrow/.test(e.key)) { e.preventDefault(); var os = [].slice.call(m.querySelectorAll("[data-v]")), i = os.indexOf(document.activeElement); os[(i + (/Right|Down/.test(e.key) ? 1 : -1) + os.length) % os.length].focus(); }
          });
          document.addEventListener("click", function (e) { if (!x.contains(e.target)) abrir(false); });
        });
      });
    }
  });

  /* ------------------------------------------------------------------ Botón sobre color */
  var FLECHA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  Libreria.sumar({
    id: "boton-nota", nombre: "Botón sobre color", grupo: "Controles", alto: "auto", mini: 560,
    bajada: "Píldora tiza con texto azul y flecha, para llamados sobre color o foto. Es Web/Botón nota del Master.",
    variantes: [["azul", "Sobre azul", "Sobre el azul de marca, como en los headers."], ["foto", "Sobre foto", "Sobre una foto con degradé, como en las destacadas de Novedades."]],
    controles: [
      { id: "alto", tipo: "seg", etiqueta: "Tamaño", def: 48, aplica: { var: "--alto", unidad: "px" }, opciones: [[48, "L 48"], [44, "M 44"]], desc: "L en desktop, M en mobile (Web/Botón del Master)." },
      { id: "txt", tipo: "texto", etiqueta: "Texto", def: "Leer la nota", aplica: { texto: ".cta__txt" }, desc: "El llamado: un verbo y lo que se abre." }
    ],
    claves: ["Distinto de UI/Botón: este va sobre color o foto, nunca sobre tiza.", "Hover: el fondo pasa a blanco y la flecha avanza 3 px.", "Texto en Familjen Grotesk 500; la flecha es la del sistema."],
    accesibilidad: "Es un <a> o un <button> con su texto; la flecha va con aria-hidden.",
    css: function () {
      return [
        ".boton-nota { " + T + " --alto: 48px; display: grid; place-items: center; min-height: 260px; border-radius: 26px; overflow: hidden; position: relative; }",
        ".boton-nota[data-variante=\"azul\"] { background: var(--azul); }",
        ".boton-nota[data-variante=\"foto\"] { background: url(../novedades/fotos/demo-1.webp) center / cover; }",
        ".boton-nota[data-variante=\"foto\"]::before { content: \"\"; position: absolute; inset: 0; background: linear-gradient(to top, rgba(10, 30, 74, .6), transparent); }",
        ".cta { position: relative; display: inline-flex; align-items: center; gap: 10px; height: var(--alto); padding: 0 22px 0 24px; border: 0; border-radius: 999px; background: var(--tiza); color: var(--azul);",
        "  font: 500 calc(var(--alto) * .333)/1 var(--f-d); text-decoration: none; cursor: pointer; transition: background 200ms ease; }",
        ".cta svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; transition: transform 260ms cubic-bezier(.22, 1, .36, 1); }",
        "@media (hover: hover) and (pointer: fine) { .cta:hover { background: #fff; } .cta:hover svg { transform: translateX(3px); } }",
        ".cta:active { background: #fff; }"
      ].join("\n");
    },
    html: function (s) { return '<div class="boton-nota" data-c="boton-nota">\n  <a class="cta" href="#"><span class="cta__txt">' + s.txt + '</span>' + FLECHA + '</a>\n</div>'; }
  });

  /* ------------------------------------------------------------------ Grupo de herramientas */
  var HERR = [
    ["Expandir todo", '<path class="l" d="M8 4h8M8 20h8M12 7v10M9 14l3 3 3-3M9 10l3-3 3 3"/>'],
    ["Plegar todo", '<path class="l" d="M8 4h8M8 20h8M12 4v6M12 14v6M9 7l3 3 3-3M9 17l3-3 3 3"/>'],
    ["Deshacer", '<path class="l" d="M9 7L5 11l4 4M5 11h9a5 5 0 0 1 0 10h-2"/>'],
    ["Exportar", '<path class="l" d="M12 4v11M8 11l4 4 4-4M5 19h14"/>']
  ];
  Libreria.sumar({
    id: "herramientas", nombre: "Grupo de herramientas", grupo: "Controles", alto: "auto", mini: 560,
    bajada: "Botones de ícono agrupados en la misma cápsula del Selector. Agrupan por fondo, no por separador.",
    claves: ["La cápsula es la del Selector: fondo de línea y 3 de aire.", "Hover: el botón toma la tarjeta marfil con sombra y el ícono pasa a azul.", "Deshabilitado al 35%.", "Íconos de 16 en grilla de 24, trazo 2,6."],
    accesibilidad: "Cada botón lleva aria-label y title con su acción; el grupo es role=\"toolbar\".",
    css: function () {
      return [
        ".herramientas { " + T + " display: flex; justify-content: center; }",
        ".grp { display: inline-flex; gap: 2px; padding: 3px; border-radius: 999px; background: var(--linea); }",
        ".ib { width: 32px; height: 30px; border: 0; border-radius: 999px; background: transparent; color: var(--tinta-2); display: grid; place-items: center; padding: 0; cursor: pointer; transition: background 180ms ease, color 180ms ease, box-shadow 180ms ease; }",
        ".ib svg { width: 16px; height: 16px; }",
        ".ib svg .l { fill: none; stroke: currentColor; stroke-width: 2.6; stroke-linecap: round; stroke-linejoin: round; }",
        "@media (hover: hover) and (pointer: fine) { .ib:hover:not(:disabled) { background: var(--tiza); color: var(--azul); box-shadow: 0 1px 3px rgba(10, 30, 74, .12); } }",
        ".ib:active:not(:disabled) { background: var(--tiza); color: var(--azul); }",
        ".ib:disabled { opacity: .35; cursor: default; }"
      ].join("\n");
    },
    html: function () {
      return '<div class="herramientas" data-c="herramientas">\n  <div class="grp" role="toolbar" aria-label="Herramientas">\n' + HERR.map(function (h, i) {
        return '    <button type="button" class="ib" aria-label="' + h[0] + '" title="' + h[0] + '"' + (i === 2 ? ' disabled' : '') + '><svg viewBox="0 0 24 24" aria-hidden="true">' + h[1] + '</svg></button>'; }).join("\n") + '\n  </div>\n</div>';
    }
  });

  /* ------------------------------------------------------------------ Buscador */
  Libreria.sumar({
    id: "buscador", nombre: "Buscador", grupo: "Navegación", alto: "auto", mini: 720,
    bajada: "Una lupa en un círculo de vidrio que se abre hacia la izquierda en un campo con el conteo de resultados.",
    controles: [
      { id: "ancho", tipo: "rango", etiqueta: "Ancho abierto", unidad: "px", min: 280, max: 560, paso: 10, def: 480, aplica: { var: "--ancho", unidad: "px" }, desc: "480 en desktop; en mobile, el ancho disponible." },
      { id: "t", tipo: "rango", etiqueta: "Duración", unidad: "ms", min: 200, max: 800, paso: 20, def: 420, aplica: { var: "--t", unidad: "ms" }, desc: "Web/Movimiento/Buscador." }
    ],
    claves: ["Cerrado: lupa de 48 en vidrio sobre la barra azul.", "Abierto: campo tiza hacia la izquierda y, en el lugar de la lupa, un círculo igual con la X: se cierra donde se abrió.", "La X cierra y borra la búsqueda, igual que Escape.", "El conteo dice cuántos resultados coinciden mientras se escribe.", "El atajo / abre el buscador desde cualquier lugar."],
    accesibilidad: "Campo type=\"search\" con su label; lupa y X con aria-label. El conteo va en aria-live.",
    css: function () {
      return [
        ".buscador { " + T + " --ancho: 480px; --t: 420ms; --ease: cubic-bezier(.22, 1, .36, 1); position: relative; height: 80px; display: flex; align-items: center; padding: 0 16px; border-radius: 999px; background: rgba(0, 61, 165, .94); font-family: var(--f-b); }",
        ".busca { position: absolute; right: 16px; top: 50%; transform: translateY(-50%); display: flex; align-items: center; width: 48px; height: 48px; border-radius: 999px; overflow: hidden;",
        "  background: rgba(255, 254, 239, .16); border: 1px solid rgba(255, 254, 239, .24); backdrop-filter: blur(14px);",
        "  transition: width var(--t) var(--ease), right var(--t) var(--ease), background 220ms ease, border-color 220ms ease; }",
        ".busca.open { right: 72px; width: min(var(--ancho), calc(100% - 104px)); background: var(--tiza); border-color: #fff; box-shadow: 0 12px 28px -16px rgba(10, 30, 74, .4); }",
        ".lupa { width: 46px; height: 46px; flex: none; border: 0; border-radius: 999px; background: transparent; color: var(--tiza); cursor: pointer; display: grid; place-items: center; }",
        ".busca.open .lupa { color: var(--azul); }",
        ".lupa svg, .busca-x svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; }",
        ".busca input { flex: 1; min-width: 0; border: 0; outline: none; background: transparent; font: 400 1.04rem/1 var(--f-d); color: var(--tinta); padding: 0 4px; opacity: 0; transition: opacity 200ms ease; }",
        ".busca.open input { opacity: 1; }",
        ".busca input::-webkit-search-cancel-button { display: none; }",
        ".q-count { flex: none; margin-right: 5px; padding: 6px 10px; border-radius: 999px; background: #fff; color: var(--tinta-2); font-size: .8rem; font-variant-numeric: tabular-nums; }",
        ".busca:not(.open) .q-count { display: none; }",
        ".busca-x { position: absolute; right: 16px; top: 50%; width: 48px; height: 48px; border-radius: 999px; border: 1px solid rgba(255, 254, 239, .24); background: rgba(255, 254, 239, .16); color: var(--tiza); display: grid; place-items: center; cursor: pointer;",
        "  opacity: 0; visibility: hidden; transform: translateY(-50%) scale(.8); transition: opacity 200ms ease, transform var(--t) var(--ease), visibility 0s linear var(--t); }",
        ".buscador.buscando .busca-x { opacity: 1; visibility: visible; transform: translateY(-50%); transition: opacity 220ms ease 120ms, transform var(--t) var(--ease), background 200ms ease; }",
        "@media (hover: hover) and (pointer: fine) { .busca-x:hover { background: var(--tiza); color: var(--azul); } }",
        ".oculto { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }"
      ].join("\n");
    },
    html: function () {
      return '<div class="buscador" data-c="buscador">\n  <div class="busca">\n' +
        '    <button type="button" class="lupa" aria-label="Buscar" aria-expanded="false"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></svg></button>\n' +
        '    <label class="oculto" for="q">Buscar</label><input id="q" type="search" placeholder="Buscá: trigo, becas…" autocomplete="off" tabindex="-1">\n' +
        '    <span class="q-count" aria-live="polite">471</span>\n  </div>\n' +
        '  <button type="button" class="busca-x" aria-label="Cerrar y borrar la búsqueda" tabindex="-1"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button>\n</div>';
    },
    js: function () {
      return fuente(function () {
        var raiz = document.querySelector(".buscador"), caja = raiz.querySelector(".busca"), lupa = caja.querySelector(".lupa");
        var q = caja.querySelector("input"), cuenta = caja.querySelector(".q-count"), x = raiz.querySelector(".busca-x");
        // Resultados de ejemplo: en el sitio, el conteo sale del listado real.
        var TOTAL = 471, PALABRAS = { trigo: 20, maiz: 31, becas: 9, planta: 64, urea: 47 };
        function abrir(si) {
          caja.classList.toggle("open", si); raiz.classList.toggle("buscando", si);
          lupa.setAttribute("aria-expanded", String(si)); q.tabIndex = x.tabIndex = si ? 0 : -1;
          if (si) setTimeout(function () { q.focus(); }, 60); else { q.value = ""; contar(); lupa.focus(); }
        }
        function contar() {
          var v = q.value.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
          cuenta.textContent = !v ? TOTAL : (PALABRAS[v] != null ? PALABRAS[v] : Math.max(0, 12 - v.length * 2));
        }
        lupa.addEventListener("click", function () { if (!caja.classList.contains("open")) abrir(true); });
        x.addEventListener("click", function () { abrir(false); });
        q.addEventListener("input", contar);
        document.addEventListener("keydown", function (e) {
          if (e.key === "Escape" && caja.classList.contains("open")) abrir(false);
          if (e.key === "/" && document.activeElement !== q) { e.preventDefault(); abrir(true); }
        });
      });
    }
  });

  /* ------------------------------------------------------------------ Confirmación */
  Libreria.sumar({
    id: "confirmacion", nombre: "Confirmación", grupo: "Avisos", alto: "auto", mini: 640,
    bajada: "El modal propio para confirmar una acción, en lugar del confirm() del navegador.",
    variantes: [["alerta", "Alerta", "Para lo que borra o no tiene vuelta: el botón va en naranja."], ["principal", "Principal", "Para lo que crea o cambia: el botón va en azul."]],
    claves: ["Nunca confirm() nativo: Marcos pidió el propio porque el nativo desconecta.", "El título dice la acción; el texto dice qué pasa y si se puede deshacer.", "El foco arranca en Cancelar.", "Escape o tocar afuera cancela."],
    accesibilidad: "Es un <dialog> abierto con showModal(): atrapa el foco y el lector lo anuncia con su título.",
    css: function () {
      return [
        ".confirmacion { " + T + " display: grid; place-items: center; min-height: 280px; font-family: var(--f-b); }",
        ".confirmacion > button { height: 40px; padding: 0 18px; border: 1px solid var(--linea); border-radius: 13px; background: var(--tiza); color: var(--tinta); font: 500 .92rem/1 var(--f-b); cursor: pointer; }",
        "dialog { border: 0; border-radius: 26px; background: var(--tiza); color: var(--tinta); padding: 26px; max-width: 460px; width: 92vw; box-shadow: 0 30px 80px -30px rgba(10, 30, 74, .6); font-family: var(--f-b); }",
        "dialog::backdrop { background: rgba(10, 30, 74, .5); }",
        "dialog h2 { margin: 0 0 6px; font: 500 1.4rem/1.15 var(--f-d); letter-spacing: -.02em; color: var(--azul); }",
        "dialog p { margin: 0 0 18px; color: var(--tinta-2); line-height: 1.45; }",
        ".fila-dlg { display: flex; justify-content: flex-end; gap: 8px; }",
        ".btn { height: 40px; padding: 0 16px; border-radius: 13px; border: 1px solid var(--linea); background: var(--tiza); color: var(--tinta); font: 500 .92rem/1 var(--f-b); cursor: pointer; transition: background 220ms ease; }",
        ".btn:active { background: #E9E7D6; }",
        ".btn.prim { background: var(--azul); border-color: var(--azul); color: var(--tiza); }",
        ".btn.alerta { background: #E57F19; border-color: #E57F19; color: var(--tiza); }"
      ].join("\n");
    },
    html: function (s) {
      var a = s.variante === "alerta";
      return '<div class="confirmacion" data-c="confirmacion">\n  <button type="button" id="abrir">' + (a ? 'Borrar el mapa' : 'Duplicar el mapa') + '</button>\n' +
        '  <dialog id="dlg" aria-labelledby="dlgTit">\n    <h2 id="dlgTit">' + (a ? '¿Borrar este mapa?' : '¿Duplicar este mapa?') + '</h2>\n' +
        '    <p>' + (a ? 'Se archiva con la fecha de hoy y se puede recuperar a mano. Nadie más lo va a ver en la lista.' : 'Se crea una copia que podés editar. El original queda como está.') + '</p>\n' +
        '    <div class="fila-dlg"><button type="button" class="btn" id="no">Cancelar</button><button type="button" class="btn ' + (a ? 'alerta' : 'prim') + '" id="si">' + (a ? 'Borrar' : 'Duplicar') + '</button></div>\n  </dialog>\n</div>';
    },
    js: function () {
      return fuente(function () {
        var d = document.getElementById("dlg");
        // Devuelve una promesa: true si se confirmó.
        function confirmar() {
          return new Promise(function (res) {
            var fin = function (ok) { document.getElementById("si").onclick = document.getElementById("no").onclick = d.onclose = null; if (d.open) d.close(); res(ok); };
            document.getElementById("si").onclick = function () { fin(true); };
            document.getElementById("no").onclick = function () { fin(false); };
            d.onclose = function () { fin(false); };
            d.addEventListener("click", function (e) { if (e.target === d) fin(false); }, { once: true });
            d.showModal(); document.getElementById("no").focus();
          });
        }
        document.getElementById("abrir").addEventListener("click", function () { confirmar(); });
        confirmar();
      });
    }
  });

  /* ------------------------------------------------------------------ Aviso */
  Libreria.sumar({
    id: "aviso", nombre: "Aviso", grupo: "Avisos", alto: "auto", mini: 640,
    bajada: "Un mensaje corto abajo al centro que se va solo, con una acción opcional para deshacer.",
    variantes: [["texto", "Solo texto", "Confirma que algo pasó: Guardado, Copiado."], ["accion", "Con acción", "Ofrece deshacer lo que se acaba de hacer."]],
    controles: [
      { id: "dura", tipo: "rango", etiqueta: "Tiempo en pantalla", unidad: "ms", min: 2000, max: 8000, paso: 200, def: 3800, desc: "Cuánto queda antes de irse solo." }
    ],
    claves: ["Tinta con texto tiza, radio 16, abajo al centro y por encima del dock.", "Entra subiendo 20 px y se va solo a los 3,8 s.", "La acción es un botón tiza chico a la derecha; con acción, conviene dejarlo más tiempo."],
    accesibilidad: "Va en role=\"status\" con aria-live=\"polite\": el lector lo lee sin interrumpir.",
    css: function () {
      return [
        ".aviso { " + T + " --ease: cubic-bezier(.22, 1, .36, 1); position: relative; display: grid; place-items: center; min-height: 260px; font-family: var(--f-b); }",
        ".aviso > button { height: 40px; padding: 0 18px; border: 1px solid var(--linea); border-radius: 13px; background: var(--tiza); color: var(--tinta); font: 500 .92rem/1 var(--f-b); cursor: pointer; }",
        ".toast { position: fixed; left: 50%; bottom: 32px; transform: translateX(-50%) translateY(20px); opacity: 0; pointer-events: none; display: flex; align-items: center; gap: 10px;",
        "  background: var(--tinta); color: var(--tiza); padding: 12px 18px; border-radius: 16px; font-size: .92rem; max-width: 92vw; box-shadow: 0 12px 28px -16px rgba(10, 30, 74, .5); transition: opacity .25s var(--ease), transform .25s var(--ease); }",
        ".toast.on { opacity: 1; transform: translateX(-50%); pointer-events: auto; }",
        ".toast .btn { height: 32px; padding: 0 14px; border: 0; border-radius: 13px; background: var(--tiza); color: var(--tinta); font: 500 .86rem/1 var(--f-b); cursor: pointer; }",
        "@media (prefers-reduced-motion: reduce) { .toast { transition: opacity .2s linear; transform: translateX(-50%); } }"
      ].join("\n");
    },
    html: function (s) {
      return '<div class="aviso" data-c="aviso">\n  <button type="button" id="mostrar">' + (s.variante === "accion" ? 'Borrar la fila' : 'Guardar') + '</button>\n' +
        '  <div class="toast" role="status" aria-live="polite"><span class="toast__txt"></span>' + (s.variante === "accion" ? '<button type="button" class="btn">Deshacer</button>' : '') + '</div>\n</div>';
    },
    js: function (s) {
      return "var DURA = " + s.dura + ", TEXTO = " + JSON.stringify(s.variante === "accion" ? "Se borró la fila." : "Guardado.") + ";\n" + fuente(function () {
        var t = document.querySelector(".toast"), txt = t.querySelector(".toast__txt"), tt;
        function aviso(msg) { txt.textContent = msg; t.classList.add("on"); clearTimeout(tt); tt = setTimeout(function () { t.classList.remove("on"); }, DURA); }
        document.getElementById("mostrar").addEventListener("click", function () { aviso(TEXTO); });
        var des = t.querySelector(".btn"); if (des) des.addEventListener("click", function () { t.classList.remove("on"); setTimeout(function () { aviso("Volvió la fila."); }, 260); });
        setTimeout(function () { aviso(TEXTO); }, 400);
      });
    }
  });

  /* ------------------------------------------------------------------ Estado de guardado */
  var ESTADOS = [["guardado", "Guardado"], ["guardando", "Guardando…"], ["singuardar", "Sin guardar"], ["error", "No se pudo guardar"], ["lectura", "Solo lectura"]];
  Libreria.sumar({
    id: "estado-guardado", nombre: "Estado de guardado", grupo: "Avisos", alto: "auto", mini: 640,
    bajada: "Una pastilla de vidrio en la barra que dice si lo que hiciste está guardado, con un punto de color.",
    controles: [
      { id: "e", tipo: "seg", etiqueta: "Estado", def: "guardado", aplica: { attr: "data-estado" }, opciones: ESTADOS.map(function (x) { return [x[0], x[1].replace("…", "")]; }), desc: "Cada estado tiene su punto y su texto." }
    ],
    claves: ["Verde claro: guardado. Amarillo: guardando o con cambios sin guardar. Naranja: error o conflicto. Tiza apagada: solo lectura.", "El texto nombra el estado, no la acción.", "Va en la barra azul, al lado del botón de editar."],
    accesibilidad: "role=\"status\": el lector anuncia cada cambio de estado. El color nunca va solo: siempre lo acompaña el texto.",
    css: function () {
      return [
        ".estado-guardado { " + T + " display: grid; place-items: center; height: 96px; border-radius: 999px; background: rgba(0, 61, 165, .94); font-family: var(--f-b); }",
        ".eg { height: 40px; display: inline-flex; align-items: center; gap: 8px; padding: 0 16px; border-radius: 999px; font-size: .84rem; font-weight: 500;",
        "  background: rgba(255, 254, 239, .16); border: 1px solid rgba(255, 254, 239, .24); color: var(--tiza); backdrop-filter: blur(14px); }",
        ".eg .punto { width: 8px; height: 8px; border-radius: 50%; background: #5EB53A; transition: background .2s ease; }",
        ".eg [data-e] { display: none; }",
        ESTADOS.map(function (x) { return '[data-estado="' + x[0] + '"] .eg [data-e="' + x[0] + '"] { display: inline; }'; }).join("\n"),
        '[data-estado="guardando"] .punto, [data-estado="singuardar"] .punto { background: #EABA2C; }',
        '[data-estado="error"] .punto { background: #E57F19; }',
        '[data-estado="lectura"] .punto { background: rgba(255, 254, 239, .55); }'
      ].join("\n");
    },
    html: function () {
      return '<div class="estado-guardado" data-c="estado-guardado">\n  <span class="eg" role="status"><span class="punto" aria-hidden="true"></span>' +
        ESTADOS.map(function (x) { return '<span data-e="' + x[0] + '">' + x[1] + '</span>'; }).join("") + '</span>\n</div>';
    }
  });
})();
