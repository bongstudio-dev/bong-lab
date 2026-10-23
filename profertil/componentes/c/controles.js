/* Controles, botones y avisos del sistema web de Profertil.
   Salen de dos páginas ya aprobadas: Novedades (Master, ◈ Componentes UI) y la herramienta
   de Arquitectura. Las piezas que se repiten (Selector, Pastilla, Chip, Interruptor, Botón, Botón sobre color)
   viven en base.css: acá cada componente suma solo lo propio. Todo con prefijo pf- y valores de tokens.css. */
(function () {
  // El JS de cada control se escribe como función real y se copia tal cual.
  function fuente(fn) { return "(" + fn.toString() + ")();"; }
  // Las categorías de Novedades con su color de familia (tokens.css: --cat-*).
  var CAT = [["Institucional", "institucional"], ["Comercial", "comercial"], ["Somos Profertil", "somos"], ["Artículo técnico", "tecnico"], ["Aviso a la comunidad", "aviso"], ["Gacetilla financiera", "financiera"]];
  var ANIOS = [["2026", 12], ["2025", 12], ["2024", 10], ["2023", 7], ["2022", 14], ["2021", 40]];

  /* ------------------------------------------------------------------ Selector */
  var IC_VISTA = {
    chico: '<svg viewBox="0 0 15 15" aria-hidden="true"><path d="M1 1h3v3H1zM6 1h3v3H6zM11 1h3v3h-3zM1 6h3v3H1zM6 6h3v3H6zM11 6h3v3h-3zM1 11h3v3H1zM6 11h3v3H6zM11 11h3v3h-3z"/></svg>',
    medio: '<svg viewBox="0 0 15 15" aria-hidden="true"><path d="M1 1h5.5v5.5H1zM8.5 1H14v5.5H8.5zM1 8.5h5.5V14H1zM8.5 8.5H14V14H8.5z"/></svg>',
    grande: '<svg viewBox="0 0 15 15" aria-hidden="true"><rect x="1" y="1" width="13" height="13" rx="2.5"/></svg>'
  };
  Libreria.sumar({
    id: "selector", nombre: "Selector", grupo: "Controles", alto: "auto", mini: 560, base: ["selector"],
    bajada: "Opciones de una sola elección en una cápsula, con un indicador marfil que se desliza a la elegida.",
    variantes: [["texto", "Texto", "Orden de la grilla en Novedades: más recientes o más antiguas."], ["iconos", "Íconos", "Tamaño de las tarjetas: chico, medio y grande. En mobile no hay chico."]],
    controles: [
      { id: "t", tipo: "rango", etiqueta: "Duración del deslizamiento", unidad: "ms", min: 160, max: 800, paso: 20, def: 420, aplica: { var: "--pf-t", unidad: "ms" }, desc: "Web/Movimiento/Vista del Master (--t-vista)." }
    ],
    claves: ["Siempre hay una opción elegida; el indicador se ubica sobre ella con JS (ancho y posición del botón).", "Al cambiar, el indicador se desliza en 420 ms con la curva de la vista: cubic-bezier(.67, 0, .24, .99).", "La elegida va en azul y en 500; las demás en tinta secundaria.", "Al cargar, el indicador aparece en su lugar sin animarse."],
    accesibilidad: "Botones reales con aria-pressed dentro de un grupo con nombre. Con movimiento reducido el indicador salta sin deslizarse.",
    css: function () {
      return [
        ".pf-selector-muestra { display: flex; justify-content: center; }",
        "@media (max-width: 640px) { .pf-selector--iconos [data-v=\"chico\"] { display: none; } }"
      ].join("\n");
    },
    html: function (s) {
      var ic = s.variante === "iconos";
      var op = ic
        ? [["chico", IC_VISTA.chico, "Tarjetas chicas"], ["medio", IC_VISTA.medio, "Tarjetas medianas"], ["grande", IC_VISTA.grande, "Tarjetas grandes"]]
        : [["recientes", "Más recientes"], ["antiguas", "Más antiguas"]];
      var elegida = ic ? "medio" : "recientes";
      return '<div class="pf-selector-muestra" data-c="selector">\n  <div class="pf-selector' + (ic ? ' pf-selector--iconos' : '') + '" role="group" aria-label="' + (ic ? 'Tamaño de las tarjetas' : 'Orden') + '">\n    <span class="pf-selector__ind" aria-hidden="true"></span>\n' +
        op.map(function (o) { return '    <button type="button" data-v="' + o[0] + '" aria-pressed="' + (o[0] === elegida) + '"' + (o[2] ? ' aria-label="' + o[2] + '"' : '') + '>' + o[1] + '</button>'; }).join("\n") + '\n  </div>\n</div>';
    },
    js: function () {
      return fuente(function () {
        // Lleva el indicador al botón elegido; sin animar la primera vez.
        function mover(sel, animar) {
          var ind = sel.querySelector(".pf-selector__ind"), b = sel.querySelector('button[aria-pressed="true"]');
          if (!b || !b.offsetWidth) return;
          if (!animar) ind.classList.add("pf-quieto");
          ind.style.width = b.offsetWidth + "px";
          ind.style.transform = "translateX(" + b.offsetLeft + "px)";
          if (!animar) { void ind.offsetWidth; ind.classList.remove("pf-quieto"); }
        }
        var todos = function () { return document.querySelectorAll(".pf-selector"); };
        todos().forEach(function (sel) {
          mover(sel, false);
          sel.addEventListener("click", function (e) {
            var b = e.target.closest("button"); if (!b) return;
            sel.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
            mover(sel, true);
          });
        });
        addEventListener("resize", function () { todos().forEach(function (s) { mover(s, false); }); });
        document.fonts && document.fonts.ready.then(function () { todos().forEach(function (s) { mover(s, false); }); });
      });
    }
  });

  /* ------------------------------------------------------------------ Pastilla de filtro */
  Libreria.sumar({
    id: "pastilla-filtro", nombre: "Pastilla de filtro", grupo: "Controles", alto: "auto", mini: 560, base: ["pastilla", "chip"],
    bajada: "Las pastillas de los filtros, como en el Master y en Novedades: la de categoría y el chip de año con su cantidad.",
    variantes: [
      ["categoria", "Categoría", "Web/Pastilla filtro: redonda, rellena con el color de la familia y texto tiza. La elegida va en tinta. Todas sin elegir es transparente. Una por vez."],
      ["anio", "Año con cantidad", "Web/Chip año: radio 32% del alto, azul tenue con texto azul; el elegido, azul con texto tiza. Se pueden elegir varios."]
    ],
    claves: ["Categoría: alto 30, radio 15 (la mitad del alto), Familjen Grotesk Regular 14, 14 de aire a cada lado.", "Categoría elegida: Web/Activo (tinta) con Texto sobre color (tiza), sin aro. Hover: el color de la familia con 14% de tinta.", "Año: alto 32, radio 32% del alto, DM Sans Medium 16; Web/Chip fondo, Web/Chip texto y Web/Chip activo.", "El número del año dice cuántas notas cumplen los otros filtros.", "Todos los colores salen de tokens.css: no hay ningún color suelto."],
    accesibilidad: "Botones con aria-pressed dentro de un grupo con nombre. El número va como texto real después del año.",
    css: function () {
      return ".pf-pastillas { display: flex; flex-wrap: wrap; justify-content: center; gap: 7px; max-width: 640px; margin: 0 auto; }";
    },
    html: function (s) {
      var b;
      if (s.variante === "anio") b = ANIOS.map(function (a, i) { return '  <button type="button" class="pf-chip" aria-pressed="' + (i === 1) + '">' + a[0] + ' <b class="pf-chip__n">' + a[1] + '</b></button>'; });
      else b = ['  <button type="button" class="pf-pastilla pf-pastilla--todas" aria-pressed="false">Todas</button>'].concat(CAT.map(function (c, i) { return '  <button type="button" class="pf-pastilla" style="--pc: var(--cat-' + c[1] + ')" aria-pressed="' + (i === 0) + '">' + c[0] + '</button>'; }));
      return '<div class="pf-pastillas" data-c="pastilla-filtro" role="group" aria-label="' + (s.variante === "anio" ? 'Años' : 'Categoría') + '">\n' + b.join("\n") + '\n</div>';
    },
    js: function (s) {
      return "var VARIOS = " + (s.variante === "anio") + ";\n" + fuente(function () {
        var caja = document.querySelector(".pf-pastillas");
        caja.addEventListener("click", function (e) {
          var b = e.target.closest("button"); if (!b) return;
          if (VARIOS) { b.setAttribute("aria-pressed", String(b.getAttribute("aria-pressed") !== "true")); return; }
          caja.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
        });
      });
    }
  });

  /* ------------------------------------------------------------------ Interruptor */
  Libreria.sumar({
    id: "interruptor", nombre: "Interruptor", grupo: "Controles", alto: "auto", mini: 560, base: ["interruptor"],
    bajada: "Prendido o apagado, solo o en una fila con su texto. Es UI/Toggle del Master.",
    variantes: [["solo", "Solo", "El interruptor suelto, para barras y paneles."], ["fila", "Fila con texto", "Título, descripción y el interruptor a la derecha (UI/Fila toggle)."]],
    controles: [
      { id: "on", tipo: "interr", etiqueta: "Arranca prendido", def: true, desc: "Estado inicial (aria-checked)." }
    ],
    claves: ["56 × 32, píldora de radio 16, perilla de 26 con 3 de aire.", "Prendido en verde de marca, apagado en gris.", "Toda la fila es el control: se toca el texto o el interruptor."],
    accesibilidad: "Botón con role=\"switch\" y aria-checked; el texto de la fila es su nombre.",
    css: function () { return ".pf-interruptor-muestra { display: flex; justify-content: center; }"; },
    html: function (s) {
      if (s.variante === "fila") return '<div class="pf-interruptor-muestra" data-c="interruptor">\n  <button type="button" class="pf-fila-interruptor" role="switch" aria-checked="' + s.on + '"><span><b>Avisos por mail</b><span>Te escribimos cuando hay una novedad.</span></span><span class="pf-interruptor" aria-hidden="true"></span></button>\n</div>';
      return '<div class="pf-interruptor-muestra" data-c="interruptor">\n  <button type="button" class="pf-interruptor" role="switch" aria-checked="' + s.on + '" aria-label="Avisos por mail"></button>\n</div>';
    },
    js: function () {
      return fuente(function () {
        document.querySelectorAll('[role="switch"]').forEach(function (b) {
          var tg = b.classList.contains("pf-interruptor") ? b : b.querySelector(".pf-interruptor");
          var pintar = function () { if (tg !== b) tg.setAttribute("aria-checked", b.getAttribute("aria-checked")); };
          pintar();
          b.addEventListener("click", function () { b.setAttribute("aria-checked", String(b.getAttribute("aria-checked") !== "true")); pintar(); });
        });
      });
    }
  });

  /* ------------------------------------------------------------------ Desplegable de pastillas */
  var TIPOS = [["pagina", "Página", "var(--azul)"], ["plantilla", "Plantilla", "var(--verde)"], ["seccion", "Sección", "var(--celeste)"], ["registros", "Registros", "var(--naranja)"], ["arte", "Arte", "var(--terra)"]];
  Libreria.sumar({
    id: "desplegable", nombre: "Desplegable de pastillas", grupo: "Controles", alto: "auto", mini: 560,
    bajada: "Un select hecho con pastillas: la elegida con su flecha, y al tocarla se abre el resto en un contenedor gris.",
    controles: [
      { id: "h", tipo: "rango", etiqueta: "Alto de la pastilla", unidad: "px", min: 24, max: 40, def: 30, aplica: { var: "--h", unidad: "px" }, desc: "Alto de la elegida y de las opciones." }
    ],
    claves: ["Reemplaza al select del navegador para que el control hable el mismo lenguaje que el resto del sistema.", "Se comporta como un select: tiene value y dispara change.", "Se cierra al elegir, con Escape o tocando afuera; las flechas del teclado recorren las opciones.", "La elegida lleva un aro de tinta dentro del contenedor."],
    accesibilidad: "Botón con aria-haspopup=\"listbox\" y aria-expanded; las opciones son role=\"option\" con aria-selected.",
    css: function () {
      return [
        ".pf-desplegable-muestra { --h: 30px; display: flex; justify-content: center; align-items: flex-start; min-height: 180px; font-family: var(--f-body); }",
        "/* El gris del contenedor: tinta al 11% sobre tiza. */",
        ".pf-desplegable { --pf-contenedor: color-mix(in srgb, var(--ink) 11%, var(--tiza)); position: relative; }",
        ".pf-desplegable__pastilla { display: inline-flex; align-items: center; flex: none; height: var(--h); padding: 0 calc(var(--h) * .47); border-radius: 999px; background: var(--c); color: var(--tiza); font: 400 calc(var(--h) * .47)/1 var(--f-display); white-space: nowrap; text-box: trim-both cap alphabetic; }",
        ".pf-desplegable__boton { display: inline-flex; border: 0; background: none; padding: 0; border-radius: 999px; cursor: pointer; }",
        ".pf-desplegable__boton .pf-desplegable__pastilla { gap: 5px; padding-right: calc(var(--h) * .3); }",
        ".pf-desplegable__boton svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; margin-top: 2px; transition: transform 300ms var(--ease); }",
        ".pf-desplegable__boton[aria-expanded=\"true\"] svg { transform: rotate(180deg); }",
        ".pf-desplegable__menu { position: absolute; top: calc(100% + 6px); left: 0; z-index: 20; display: flex; flex-wrap: wrap; gap: 6px; width: max-content; max-width: 300px; padding: 8px; background: var(--pf-contenedor); border-radius: 20px; box-shadow: var(--sombra-flotante); animation: pf-desplegable-entra 240ms var(--ease); }",
        ".pf-desplegable__menu[hidden] { display: none; }",
        ".pf-desplegable__menu button { border: 0; background: none; padding: 0; border-radius: 999px; cursor: pointer; transition: transform 180ms var(--ease); }",
        ".pf-desplegable__menu [aria-selected=\"true\"] .pf-desplegable__pastilla { box-shadow: 0 0 0 2px var(--pf-contenedor), 0 0 0 4px var(--ink); }",
        "@media (hover: hover) and (pointer: fine) { .pf-desplegable__menu button:hover { transform: translateY(-1px); } }",
        "@keyframes pf-desplegable-entra { from { opacity: 0; transform: translateY(-6px); } }",
        "@media (prefers-reduced-motion: reduce) { .pf-desplegable__menu { animation: none; } }"
      ].join("\n");
    },
    html: function () {
      var chev = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
      return '<div class="pf-desplegable-muestra" data-c="desplegable">\n  <span id="pf-desplegable-et" hidden>Tipo</span>\n  <div class="pf-desplegable" data-value="pagina">\n' +
        '    <button type="button" class="pf-desplegable__boton" aria-haspopup="listbox" aria-expanded="false" aria-labelledby="pf-desplegable-et"><span class="pf-desplegable__pastilla" style="--c: var(--azul)">Página' + chev + '</span></button>\n' +
        '    <div class="pf-desplegable__menu" role="listbox" aria-labelledby="pf-desplegable-et" hidden>' + TIPOS.map(function (t, i) {
          return '<button type="button" role="option" data-v="' + t[0] + '" aria-selected="' + (i === 0) + '"><span class="pf-desplegable__pastilla" style="--c: ' + t[2] + '">' + t[1] + '</span></button>'; }).join("") + '</div>\n  </div>\n</div>';
    },
    js: function () {
      return fuente(function () {
        document.querySelectorAll(".pf-desplegable").forEach(function (x) {
          var b = x.querySelector(".pf-desplegable__boton"), m = x.querySelector(".pf-desplegable__menu");
          function abrir(si) { b.setAttribute("aria-expanded", String(si)); m.hidden = !si; if (si) m.querySelector('[aria-selected="true"]').focus(); }
          b.addEventListener("click", function () { abrir(m.hidden); });
          m.addEventListener("click", function (e) {
            var o = e.target.closest("[data-v]"); if (!o) return;
            m.querySelectorAll("[data-v]").forEach(function (y) { y.setAttribute("aria-selected", String(y === o)); });
            var pl = o.querySelector(".pf-desplegable__pastilla"), cab = b.querySelector(".pf-desplegable__pastilla");
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
    id: "boton-nota", nombre: "Botón sobre color", grupo: "Controles", alto: "auto", mini: 560, base: ["boton-color"],
    bajada: "Píldora tiza con texto azul y flecha, para llamados sobre color o foto. Es Web/Botón nota del Master.",
    variantes: [["azul", "Sobre azul", "Sobre el azul de marca, como en los headers."], ["foto", "Sobre foto", "Sobre una foto con degradé, como en las destacadas de Novedades."]],
    controles: [
      { id: "alto", tipo: "seg", etiqueta: "Tamaño", def: 48, aplica: { var: "--alto", unidad: "px" }, opciones: [[48, "L 48"], [44, "M 44"]], desc: "L en desktop, M en mobile (Web/Botón del Master)." },
      { id: "txt", tipo: "texto", etiqueta: "Texto", def: "Leer la nota", aplica: { texto: ".pf-boton-color__txt" }, desc: "El llamado: un verbo y lo que se abre." }
    ],
    claves: ["Distinto de UI/Botón: este va sobre color o foto, nunca sobre tiza.", "Hover: el fondo pasa a blanco y la flecha avanza 3 px.", "Texto en Familjen Grotesk 500; la flecha es la del sistema."],
    accesibilidad: "Es un <a> o un <button> con su texto; la flecha va con aria-hidden.",
    css: function () {
      return [
        ".pf-boton-nota { display: grid; place-items: center; min-height: 260px; border-radius: var(--radio-tarjeta); overflow: hidden; position: relative; }",
        ".pf-boton-nota[data-variante=\"azul\"] { background: var(--azul); }",
        ".pf-boton-nota[data-variante=\"foto\"] { background: url(../novedades/fotos/demo-1.webp) center / cover; }",
        ".pf-boton-nota[data-variante=\"foto\"]::before { content: \"\"; position: absolute; inset: 0; background: linear-gradient(to top, color-mix(in srgb, var(--ink) 60%, transparent), transparent); }"
      ].join("\n");
    },
    html: function (s) { return '<div class="pf-boton-nota" data-c="boton-nota">\n  <a class="pf-boton-color" href="#"><span class="pf-boton-color__txt">' + s.txt + '</span>' + FLECHA + '</a>\n</div>'; }
  });

  /* ------------------------------------------------------------------ Grupo de herramientas */
  var HERR = [
    ["Expandir todo", '<path d="M8 4h8M8 20h8M12 7v10M9 14l3 3 3-3M9 10l3-3 3 3"/>'],
    ["Plegar todo", '<path d="M8 4h8M8 20h8M12 4v6M12 14v6M9 7l3 3 3-3M9 17l3-3 3 3"/>'],
    ["Deshacer", '<path d="M9 7L5 11l4 4M5 11h9a5 5 0 0 1 0 10h-2"/>'],
    ["Exportar", '<path d="M12 4v11M8 11l4 4 4-4M5 19h14"/>']
  ];
  Libreria.sumar({
    id: "herramientas", nombre: "Grupo de herramientas", grupo: "Controles", alto: "auto", mini: 560,
    bajada: "Botones de ícono agrupados en la misma cápsula del Selector. Agrupan por fondo, no por separador.",
    claves: ["La cápsula es la del Selector: fondo de línea y 3 de aire.", "Hover: el botón toma la tarjeta marfil con sombra y el ícono pasa a azul.", "Deshabilitado al 35%.", "Íconos de 16 en grilla de 24, trazo 2,6."],
    accesibilidad: "Cada botón lleva aria-label y title con su acción; el grupo es role=\"toolbar\".",
    css: function () {
      return [
        ".pf-herramientas { display: flex; justify-content: center; }",
        ".pf-herramientas__grupo { display: inline-flex; gap: 2px; padding: 3px; border-radius: 999px; background: var(--line); }",
        ".pf-herramientas__boton { width: 32px; height: 30px; border: 0; border-radius: 999px; background: transparent; color: var(--ink-2); display: grid; place-items: center; padding: 0; cursor: pointer; transition: background 180ms ease, color 180ms ease, box-shadow 180ms ease; }",
        ".pf-herramientas__boton svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 2.6; stroke-linecap: round; stroke-linejoin: round; }",
        "@media (hover: hover) and (pointer: fine) { .pf-herramientas__boton:hover:not(:disabled) { background: var(--tiza); color: var(--azul); box-shadow: var(--sombra-control); } }",
        ".pf-herramientas__boton:active:not(:disabled) { background: var(--tiza); color: var(--azul); }",
        ".pf-herramientas__boton:disabled { opacity: .35; cursor: default; }"
      ].join("\n");
    },
    html: function () {
      return '<div class="pf-herramientas" data-c="herramientas">\n  <div class="pf-herramientas__grupo" role="toolbar" aria-label="Herramientas">\n' + HERR.map(function (h, i) {
        return '    <button type="button" class="pf-herramientas__boton" aria-label="' + h[0] + '" title="' + h[0] + '"' + (i === 2 ? ' disabled' : '') + '><svg viewBox="0 0 24 24" aria-hidden="true">' + h[1] + '</svg></button>'; }).join("\n") + '\n  </div>\n</div>';
    }
  });

  /* ------------------------------------------------------------------ Confirmación */
  Libreria.sumar({
    id: "confirmacion", nombre: "Confirmación", grupo: "Avisos", alto: "auto", mini: 640, base: ["boton"],
    bajada: "El modal propio para confirmar una acción, en lugar del confirm() del navegador.",
    variantes: [["alerta", "Alerta", "Para lo que borra o no tiene vuelta: el botón va en naranja."], ["principal", "Principal", "Para lo que crea o cambia: el botón va en azul."]],
    claves: ["Reemplaza al confirm() del navegador para que la confirmación hable el mismo lenguaje que el resto del sistema.", "El título dice la acción; el texto dice qué pasa y si se puede deshacer.", "El foco arranca en Cancelar.", "Escape o tocar afuera cancela."],
    accesibilidad: "Es un <dialog> abierto con showModal(): atrapa el foco y el lector lo anuncia con su título.",
    css: function () {
      return [
        ".pf-confirmacion { display: grid; place-items: center; min-height: 280px; font-family: var(--f-body); }",
        ".pf-dialogo { border: 0; border-radius: var(--radio-tarjeta); background: var(--tiza); color: var(--ink); padding: 26px; max-width: 460px; width: 92vw; box-shadow: 0 30px 80px -30px color-mix(in srgb, var(--ink) 60%, transparent); font: 400 var(--texto-cuerpo)/1.45 var(--f-body); }",
        ".pf-dialogo::backdrop { background: color-mix(in srgb, var(--ink) 50%, transparent); }",
        ".pf-dialogo__tit { margin: 0 0 6px; font: 500 var(--texto-subtitulo)/1.15 var(--f-display); letter-spacing: -.02em; color: var(--titulo); }",
        ".pf-dialogo__txt { margin: 0 0 18px; color: var(--ink-2); }",
        ".pf-dialogo__acciones { display: flex; justify-content: flex-end; gap: 8px; }"
      ].join("\n");
    },
    html: function (s) {
      var a = s.variante === "alerta";
      return '<div class="pf-confirmacion" data-c="confirmacion">\n  <button type="button" class="pf-boton" id="pf-dlg-abrir">' + (a ? 'Borrar el mapa' : 'Duplicar el mapa') + '</button>\n' +
        '  <dialog class="pf-dialogo" id="pf-dlg" aria-labelledby="pf-dlg-tit">\n    <h2 class="pf-dialogo__tit" id="pf-dlg-tit">' + (a ? '¿Borrar este mapa?' : '¿Duplicar este mapa?') + '</h2>\n' +
        '    <p class="pf-dialogo__txt">' + (a ? 'Se archiva con la fecha de hoy y se puede recuperar a mano. Nadie más lo va a ver en la lista.' : 'Se crea una copia que podés editar. El original queda como está.') + '</p>\n' +
        '    <div class="pf-dialogo__acciones"><button type="button" class="pf-boton" id="pf-dlg-no">Cancelar</button><button type="button" class="pf-boton ' + (a ? 'pf-boton--alerta' : 'pf-boton--principal') + '" id="pf-dlg-si">' + (a ? 'Borrar' : 'Duplicar') + '</button></div>\n  </dialog>\n</div>';
    },
    js: function () {
      return fuente(function () {
        var d = document.getElementById("pf-dlg"), si = document.getElementById("pf-dlg-si"), no = document.getElementById("pf-dlg-no");
        // Devuelve una promesa: true si se confirmó.
        function confirmar() {
          return new Promise(function (res) {
            var fin = function (ok) { si.onclick = no.onclick = d.onclose = null; if (d.open) d.close(); res(ok); };
            si.onclick = function () { fin(true); };
            no.onclick = function () { fin(false); };
            d.onclose = function () { fin(false); };
            d.addEventListener("click", function (e) { if (e.target === d) fin(false); }, { once: true });
            d.showModal(); no.focus();
          });
        }
        document.getElementById("pf-dlg-abrir").addEventListener("click", function () { confirmar(); });
        confirmar();
      });
    }
  });

  /* ------------------------------------------------------------------ Aviso */
  Libreria.sumar({
    id: "aviso", nombre: "Aviso", grupo: "Avisos", alto: "auto", mini: 640, base: ["boton"],
    bajada: "Un mensaje corto abajo al centro que se va solo, con una acción opcional para deshacer.",
    variantes: [["texto", "Solo texto", "Confirma que algo pasó: Guardado, Copiado."], ["accion", "Con acción", "Ofrece deshacer lo que se acaba de hacer."]],
    controles: [
      { id: "dura", tipo: "rango", etiqueta: "Tiempo en pantalla", unidad: "ms", min: 2000, max: 8000, paso: 200, def: 3800, desc: "Cuánto queda antes de irse solo." }
    ],
    claves: ["Tinta con texto tiza, radio 16, abajo al centro y por encima del dock.", "Entra subiendo 20 px y se va solo a los 3,8 s.", "La acción es un botón tiza chico a la derecha; con acción, conviene dejarlo más tiempo."],
    accesibilidad: "Va en role=\"status\" con aria-live=\"polite\": el lector lo lee sin interrumpir.",
    css: function () {
      return [
        ".pf-aviso { position: relative; display: grid; place-items: center; min-height: 260px; font-family: var(--f-body); }",
        ".pf-aviso__caja { position: fixed; left: 50%; bottom: 32px; transform: translateX(-50%) translateY(20px); opacity: 0; pointer-events: none; display: flex; align-items: center; gap: 10px;",
        "  background: var(--ink); color: var(--tiza); padding: 12px 18px; border-radius: var(--radio-aviso); font-size: var(--texto-chico); max-width: 92vw; box-shadow: 0 12px 28px -16px color-mix(in srgb, var(--ink) 50%, transparent); transition: opacity .25s var(--ease), transform .25s var(--ease); }",
        ".pf-aviso__caja.pf-visible { opacity: 1; transform: translateX(-50%); pointer-events: auto; }",
        "@media (prefers-reduced-motion: reduce) { .pf-aviso__caja { transition: opacity .2s linear; transform: translateX(-50%); } }"
      ].join("\n");
    },
    html: function (s) {
      return '<div class="pf-aviso" data-c="aviso">\n  <button type="button" class="pf-boton" id="pf-aviso-mostrar">' + (s.variante === "accion" ? 'Borrar la fila' : 'Guardar') + '</button>\n' +
        '  <div class="pf-aviso__caja" role="status" aria-live="polite"><span class="pf-aviso__txt"></span>' + (s.variante === "accion" ? '<button type="button" class="pf-boton pf-boton--chico">Deshacer</button>' : '') + '</div>\n</div>';
    },
    js: function (s) {
      return "var DURA = " + s.dura + ", TEXTO = " + JSON.stringify(s.variante === "accion" ? "Se borró la fila." : "Guardado.") + ";\n" + fuente(function () {
        var t = document.querySelector(".pf-aviso__caja"), txt = t.querySelector(".pf-aviso__txt"), tt;
        function aviso(msg) { txt.textContent = msg; t.classList.add("pf-visible"); clearTimeout(tt); tt = setTimeout(function () { t.classList.remove("pf-visible"); }, DURA); }
        document.getElementById("pf-aviso-mostrar").addEventListener("click", function () { aviso(TEXTO); });
        var des = t.querySelector(".pf-boton"); if (des) des.addEventListener("click", function () { t.classList.remove("pf-visible"); setTimeout(function () { aviso("Volvió la fila."); }, 260); });
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
        ".pf-estado-guardado { display: grid; place-items: center; height: 96px; border-radius: 999px; background: var(--barra); font-family: var(--f-body); }",
        ".pf-estado { height: 40px; display: inline-flex; align-items: center; gap: 8px; padding: 0 16px; border-radius: 999px; font-size: var(--texto-chico); font-weight: 500;",
        "  background: var(--foto-boton); border: 1px solid var(--foto-borde); color: var(--tiza); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); text-box: trim-both cap alphabetic; }",
        ".pf-estado__punto { width: 8px; height: 8px; border-radius: 50%; background: var(--verde-claro); transition: background .2s ease; }",
        ".pf-estado [data-e] { display: none; }",
        ESTADOS.map(function (x) { return '[data-estado="' + x[0] + '"] .pf-estado [data-e="' + x[0] + '"] { display: inline; }'; }).join("\n"),
        '[data-estado="guardando"] .pf-estado__punto, [data-estado="singuardar"] .pf-estado__punto { background: var(--amarillo); }',
        '[data-estado="error"] .pf-estado__punto { background: var(--naranja); }',
        '[data-estado="lectura"] .pf-estado__punto { background: color-mix(in srgb, var(--tiza) 55%, transparent); }'
      ].join("\n");
    },
    html: function () {
      return '<div class="pf-estado-guardado" data-c="estado-guardado">\n  <span class="pf-estado" role="status"><span class="pf-estado__punto" aria-hidden="true"></span>' +
        ESTADOS.map(function (x) { return '<span data-e="' + x[0] + '">' + x[1] + '</span>'; }).join("") + '</span>\n</div>';
    }
  });
})();
