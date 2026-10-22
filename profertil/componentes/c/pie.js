/* Pie de página: tres variantes. */
(function () {
  var COLUMNAS = [
    ["Empresa", ["Quiénes somos", "Planta Bahía Blanca", "Sustentabilidad", "Compliance"]],
    ["Productos", ["Catálogo", "Por cultivo", "Fichas y hojas de seguridad", "Distribuidores"]],
    ["Novedades", ["Noticias", "Sala de prensa", "Inversores", "Biblioteca virtual"]],
    ["Contacto", ["Escribinos", "Trabajá con nosotros", "Proveedores", "Visitas a planta"]]
  ];
  // Fondos de color permitidos (Color y texto del Master) y el texto que va encima.
  var FONDOS = { azul: ["var(--azul)", "var(--tiza)"], verde: ["var(--verde)", "var(--tiza)"], terra: ["var(--terra)", "var(--tiza)"], amarillo: ["var(--amarillo)", "var(--azul)"] };

  Libreria.sumar({
    id: "footer", nombre: "Pie de página", grupo: "Navegación", alto: "auto", sangrado: true,
    bajada: "El cierre de todas las páginas: navegación, línea ética y datos legales. Tres variantes, de la más sobria a la más osada.",
    variantes: [
      ["institucional", "Institucional", "La base: fondo de color, logo y bajada arriba, cuatro columnas, línea ética y legales."],
      ["trigo", "Con trigo", "Fondo tiza y el trigo del sistema en amarillo pleno, a la izquierda, que sube más lento que la página."],
      ["vida", "Vida para nuestra tierra", "Alto de pantalla completa con la foto de fondo. La frase va abajo de todo, enorme y a todo el ancho, y nace desde el borde con el scroll."]
    ],
    tamano: "media",
    claves: ["La línea ética va siempre en el pie, destacada, con su propio llamado.", "Los fondos de color son solo los del Master (azul, verde, terra, amarillo); sobre amarillo el texto va en azul.", "El logo va siempre completo: no se recorta ni se separa el símbolo de la palabra.", "Las columnas repiten el menú principal: si cambia la arquitectura, cambia el pie.", "Con trigo y Vida para nuestra tierra tienen parallax: el trigo y la foto se mueven a otra velocidad que la página mientras el pie entra en pantalla.", "Vida para nuestra tierra ocupa una pantalla entera. La frase se ajusta sola al ancho (JS mide la línea más larga) y cada línea sube desde el borde de abajo atada al scroll, una después de la otra."],
    accesibilidad: "Es un <footer> con listas de links reales. El trigo es decorativo (aria-hidden); la frase con foto es texto real, legible por lectores y buscadores. Con movimiento reducido no hay parallax.",
    previo: '<div style="height:80vh;display:grid;place-items:center;color:var(--ink-3);font-size:13px">Final de la página</div>',
    controles: [
      { id: "fondo", tipo: "seg", etiqueta: "Fondo", solo: ["institucional", "vida"], def: "azul", aplica: { attr: "data-fondo" }, opciones: [["azul", "Azul"], ["verde", "Verde"], ["terra", "Terra"], ["amarillo", "Amarillo"]], desc: "Color de fondo y tinta que va encima. En Vida para nuestra tierra tiñe la foto arriba, detrás de los links." },
      { id: "par", tipo: "rango", etiqueta: "Parallax", solo: ["trigo", "vida"], unidad: "%", min: 0, max: 40, def: 22, aplica: { var: "--par" }, desc: "Cuánto se corre el trigo o la foto mientras entra el pie; en Vida, también cuánto sube la frase." },
      "---",
      { id: "radio", tipo: "rango", etiqueta: "Radio de arriba", unidad: "px", min: 0, max: 56, def: 26, aplica: { var: "--radio", unidad: "px" }, desc: "Radio de las esquinas de arriba." },
      { id: "logo", tipo: "rango", etiqueta: "Logo", unidad: "px", min: 80, max: 260, def: 150, aplica: { var: "--logo", unidad: "px" }, desc: "Ancho del logo completo." },
      { id: "etica", tipo: "interr", etiqueta: "Destacar la línea ética", def: true, desc: "Bloque destacado con el llamado a denunciar." }
    ],
    css: function () {
      return [
        ".pie { --radio: 26px; --logo: 150px; --par: 22; --p: 1; --f-d: \"Familjen Grotesk\", \"Helvetica Neue\", Arial, sans-serif;",
        "  position: relative; overflow: hidden; border-radius: var(--radio) var(--radio) 0 0; font: 400 14px/1.45 \"DM Sans\", \"Helvetica Neue\", Arial, sans-serif; }",
        Object.keys(FONDOS).map(function (k) { return '.pie[data-fondo="' + k + '"] { --pie-fondo: ' + FONDOS[k][0] + '; --pie-tinta: ' + FONDOS[k][1] + '; }'; }).join("\n"),
        ".pie a { color: inherit; text-decoration: none; opacity: .86; transition: opacity .2s; }",
        ".pie a:hover { opacity: 1; text-decoration: underline; text-underline-offset: 3px; }",
        ".pie ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }",
        ".pie h3 { margin: 0 0 12px; font: 500 12px/1 \"DM Sans\", sans-serif; letter-spacing: .08em; text-transform: uppercase; opacity: .6; }",
        ".pie__in { position: relative; max-width: 1280px; margin: 0 auto; padding: clamp(40px, 6vw, 72px) clamp(20px, 4vw, 48px) 28px; }",
        ".pie__logo { display: block; width: var(--logo); }",
        ".pie__logo svg { display: block; width: 100%; height: auto; }",
        ".pie__cols { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 24px; }",
        ".pie__etica { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; padding: 18px 22px; border-radius: 18px; background: color-mix(in srgb, currentColor 9%, transparent); }",
        ".pie__etica b { font: 500 20px/1.1 var(--f-d); letter-spacing: -.02em; }",
        ".pie__etica span { display: block; margin-top: 4px; font-size: 13px; opacity: .75; }",
        ".pie__pill { display: inline-flex; align-items: center; height: 44px; padding: 0 20px; border-radius: 999px; background: var(--pie-tinta, var(--azul)); color: var(--pie-fondo, var(--tiza)) !important; opacity: 1 !important; font-weight: 500; text-decoration: none !important;  text-box: trim-both cap alphabetic; }",
        ".pie__legal { display: flex; justify-content: space-between; gap: 12px 24px; flex-wrap: wrap; padding-top: 20px; border-top: 1px solid color-mix(in srgb, currentColor 18%, transparent); font-size: 12px; opacity: .8; }",
        ".pie__legal nav { display: flex; gap: 18px; flex-wrap: wrap; }",
        "",
        "/* Institucional: la base. */",
        '.pie[data-variante="institucional"] { background: var(--pie-fondo); color: var(--pie-tinta); }',
        '.pie[data-variante="institucional"] .pie__in { display: grid; gap: 40px; }',
        '.pie[data-variante="institucional"] .pie__cab { display: flex; justify-content: space-between; align-items: flex-end; gap: 24px; flex-wrap: wrap; }',
        '.pie[data-variante="institucional"] .pie__cab p { margin: 12px 0 0; max-width: 34ch; font: 500 22px/1.15 var(--f-d); letter-spacing: -.02em; }',
        "",
        "/* Con trigo: el trigo del sistema en amarillo pleno ocupa la izquierda y sube más lento. El contenido va a la derecha. */",
        '.pie[data-variante="trigo"] { background: var(--tiza); color: var(--ink); --pie-tinta: var(--azul); --pie-fondo: var(--tiza); }',
        '.pie__trigo { position: absolute; left: clamp(-80px, -4vw, -24px); bottom: -8%; height: 112%; aspect-ratio: ' + FORMAS.trigo.vb.split(" ")[2] + ' / ' + FORMAS.trigo.vb.split(" ")[3] + '; color: var(--amarillo); pointer-events: none;',
        "  transform: translate3d(0, calc((1 - var(--p)) * var(--par) * 1%), 0); will-change: transform; }",
        '.pie__trigo svg { display: block; width: 100%; height: 100%; }',
        '.pie[data-variante="trigo"] .pie__in { display: grid; grid-template-columns: minmax(0, .9fr) minmax(0, 2fr); column-gap: 48px; }',
        '.pie[data-variante="trigo"] .pie__der { grid-column: 2; display: grid; gap: 36px; }',
        '.pie[data-variante="trigo"] .pie__cab { display: flex; justify-content: space-between; align-items: flex-end; gap: 24px; flex-wrap: wrap; }',
        '.pie[data-variante="trigo"] .pie__logo { color: var(--azul); }',
        '.pie[data-variante="trigo"] .pie__cab p { margin: 12px 0 0; max-width: 28ch; font: 500 20px/1.2 var(--f-d); letter-spacing: -.02em; color: var(--azul); }',
        '.pie[data-variante="trigo"] .pie__etica { background: var(--bg); }',
        "",
        "/* Vida para nuestra tierra: una pantalla entera con la foto de fondo. Arriba logo, links y línea ética sobre el color del fondo;",
        "   abajo de todo la frase, a todo el ancho, que sube desde el borde con el scroll. */",
        '.pie[data-variante="vida"] { overflow: clip; display: flex; flex-direction: column; min-height: 100vh; min-height: 100svh; color: var(--pie-tinta); background: var(--ink); isolation: isolate; }',
        '.pie__foto { position: absolute; inset: 0; z-index: -1; overflow: hidden; }',
        "/* La foto es más alta que el pie y llega a su lugar cuando el pie terminó de entrar (--p = 1). */",
        '.pie__foto img { position: absolute; left: 0; top: 0; width: 100%; height: calc(100% + var(--par) * 2%); object-fit: cover; transform: translate3d(0, calc((var(--p) - 1) * var(--par) * 1%), 0); will-change: transform; }',
        "/* El color del fondo tiñe la foto arriba (donde van los links) y abajo la oscurece la tinta, para que la frase en tiza se lea. */",
        '.pie__foto::after { content: ""; position: absolute; inset: 0; background: linear-gradient(to bottom, color-mix(in srgb, var(--pie-fondo) 88%, transparent) 0%, color-mix(in srgb, var(--pie-fondo) 55%, transparent) 38%, transparent 62%, rgba(10, 30, 74, .55) 100%); }',
        '.pie[data-variante="vida"] .pie__in { flex: 1; display: flex; flex-direction: column; gap: 28px; width: 100%; max-width: none; padding-bottom: 0; }',
        '.pie__arriba { display: flex; justify-content: space-between; align-items: flex-start; gap: 32px 56px; flex-wrap: wrap; }',
        '.pie[data-variante="vida"] .pie__cols { flex: 1; max-width: 760px; }',
        '.pie[data-variante="vida"] .pie__etica { max-width: 760px; margin-left: auto; width: 100%; backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); }',
        '.pie[data-variante="vida"] .pie__legal { margin-top: auto; }',
        "/* La frase: tiza, pegada al borde de abajo de la pantalla (sticky) mientras el pie entra, y al final, al del pie. overflow: clip en el pie",
        "   (no hidden) para que sticky funcione. El tamaño lo pone el JS para que la línea más larga ocupe todo el ancho (15vw sin JS). */",
        '.pie__vida { position: sticky; bottom: 0; z-index: 1; margin: 0 0 -.02em; font: 500 15vw/.84 var(--f-d); letter-spacing: -.045em; color: var(--tiza); white-space: nowrap; }',
        "/* Cada línea en su ventana: sube desde abajo atada al scroll (--q: 0 cuando al pie le falta 0,7 pantalla para terminar, 1 al final), la segunda un poco después. El padding deja lugar a la p de para. */",
        '.pie__vida-l { display: block; overflow: clip; padding: .04em 0 .12em; margin-bottom: -.12em; }',
        '.pie__vida-l > span { display: inline-block; transform: translate3d(0, calc((1 - var(--v)) * (100% + var(--par) * 2%)), 0); will-change: transform; }',
        '.pie__vida-l:nth-child(1) > span { --v: clamp(0, calc(var(--q, 1) / .7), 1); }',
        '.pie__vida-l:nth-child(2) > span { --v: clamp(0, calc((var(--q, 1) - .2) / .7), 1); }',
        '.pie[data-variante="vida"] .pie__legal { border-top-color: color-mix(in srgb, var(--tiza) 30%, transparent); color: var(--tiza); }',
        "",
        "@media (max-width: 760px) {",
        "  .pie__cols, .pie[data-variante=\"vida\"] .pie__cols { grid-template-columns: repeat(2, minmax(0, 1fr)); flex-basis: 100%; }",
        "  .pie[data-variante=\"vida\"] .pie__in { gap: 22px; }",
        "  .pie[data-variante=\"trigo\"] .pie__in { grid-template-columns: 1fr; } .pie[data-variante=\"trigo\"] .pie__der { grid-column: 1; padding-top: 34vw; }",
        "  .pie__trigo { height: auto; width: 46vw; left: auto; right: -6vw; bottom: auto; top: -3vw; }",
        "}",
        "@media (prefers-reduced-motion: reduce) { .pie { --p: 1 !important; --q: 1 !important; } }"
      ].join("\n");
    },
    html: function (s) {
      var v = s.variante, logo = LOGO_BLANCO.replace("<svg", '<svg aria-hidden="true"');
      var cols = '  <div class="pie__cols">\n' + COLUMNAS.map(function (c) {
        return '    <div><h3>' + c[0] + '</h3><ul>' + c[1].map(function (l) { return '<li><a href="#">' + l + '</a></li>'; }).join("") + '</ul></div>';
      }).join("\n") + '\n  </div>\n';
      var etica = s.etica
        ? '  <div class="pie__etica"><div><b>Línea ética</b><span>Confidencial y anónima. Atiende un tercero independiente.</span></div><a class="pie__pill" href="#">Hacer una denuncia</a></div>\n'
        : '';
      var legal = '  <div class="pie__legal"><span>© 2026 Profertil S.A. Todos los derechos reservados.</span><nav><a href="#">Privacidad</a><a href="#">Términos de uso</a><a href="#">LinkedIn</a><a href="#">Instagram</a></nav></div>\n';
      var cab = '  <div class="pie__cab"><div><a class="pie__logo" href="#" aria-label="Profertil">' + logo + '</a><p>Nutrientes para el campo argentino, desde Bahía Blanca.</p></div><a class="pie__pill" href="#">Contacto</a></div>\n';
      var h = '<footer class="pie" data-c="footer">\n';
      if (v === "trigo") h += '<div class="pie__trigo" aria-hidden="true">' + formaSVG("trigo") + '</div>\n';
      if (v === "vida") h += '<div class="pie__foto" aria-hidden="true"><img src="../novedades/fotos/demo-1.webp" alt=""></div>\n';
      h += '<div class="pie__in">\n';
      if (v === "institucional") h += cab + cols + etica + legal;
      if (v === "trigo") h += ' <div class="pie__der">\n' + cab + cols + etica + legal + ' </div>\n';
      if (v === "vida") h += '  <div class="pie__arriba">\n  <a class="pie__logo" href="#" aria-label="Profertil">' + logo + '</a>\n' + cols + '  </div>\n' + etica + legal +
        '  <p class="pie__vida"><span class="pie__vida-l"><span>Vida para</span></span><span class="pie__vida-l"><span>nuestra tierra</span></span></p>\n';
      return h + '</div>\n</footer>';
    },
    js: function (s) {
      if (s.variante === "institucional") return "";
      return "(" + function () {
        // El pie avisa cuánto entró en pantalla (--p de 0 a 1): con eso se mueven el trigo, la foto y la frase.
        var pie = document.querySelector(".pie"), pedido = false, vida = pie.querySelector(".pie__vida");
        // La frase ocupa todo el ancho: se mide a 100 px y se lleva la línea más larga al ancho del pie.
        function ajustar() {
          if (!vida) return;
          vida.style.fontSize = "100px";
          var m = 0; vida.querySelectorAll(".pie__vida-l > span").forEach(function (l) { m = Math.max(m, l.offsetWidth); });
          if (m) vida.style.fontSize = (100 * vida.clientWidth / m * .995).toFixed(2) + "px";
        }
        ajustar(); addEventListener("resize", ajustar);
        if (document.fonts) document.fonts.ready.then(ajustar);
        if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        function tic() {
          pedido = false;
          var r = pie.getBoundingClientRect(), p = Math.min(1, Math.max(0, (innerHeight - r.top) / r.height));
          pie.style.setProperty("--p", p.toFixed(4));
          pie.style.setProperty("--q", Math.min(1, Math.max(0, 1 - (r.bottom - innerHeight) / (innerHeight * .7))).toFixed(4));
        }
        addEventListener("scroll", function () { if (!pedido) { pedido = true; requestAnimationFrame(tic); } }, { passive: true });
        addEventListener("resize", tic); tic();
      }.toString() + ")();";
    }
  });
})();
