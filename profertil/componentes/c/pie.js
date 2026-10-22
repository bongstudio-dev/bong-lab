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
      ["vida", "Vida para nuestra tierra", "El logo centrado y la frase a todo el ancho abajo, con una foto que se ve a través de las letras y se mueve con el scroll."]
    ],
    tamano: "media",
    claves: ["La línea ética va siempre en el pie, destacada, con su propio llamado.", "Los fondos de color son solo los del Master (azul, verde, terra, amarillo); sobre amarillo el texto va en azul.", "El logo va siempre completo: no se recorta ni se separa el símbolo de la palabra.", "Las columnas repiten el menú principal: si cambia la arquitectura, cambia el pie.", "Con trigo y Vida para nuestra tierra tienen parallax: el trigo y la foto se mueven a otra velocidad que la página mientras el pie entra en pantalla."],
    accesibilidad: "Es un <footer> con listas de links reales. El trigo es decorativo (aria-hidden); la frase con foto es texto real, legible por lectores y buscadores. Con movimiento reducido no hay parallax.",
    previo: '<div style="height:80vh;display:grid;place-items:center;color:var(--ink-3);font-size:13px">Final de la página</div>',
    controles: [
      { id: "fondo", tipo: "seg", etiqueta: "Fondo (Institucional y Vida)", def: "azul", aplica: { attr: "data-fondo" }, opciones: [["azul", "Azul"], ["verde", "Verde"], ["terra", "Terra"], ["amarillo", "Amarillo"]], desc: "Color de fondo y tinta que va encima." },
      { id: "par", tipo: "rango", etiqueta: "Parallax (Con trigo y Vida)", unidad: "%", min: 0, max: 40, def: 22, aplica: { var: "--par" }, desc: "Cuánto se corre el trigo o la foto mientras entra el pie." },
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
        ".pie__pill { display: inline-flex; align-items: center; height: 44px; padding: 0 20px; border-radius: 999px; background: var(--pie-tinta, var(--azul)); color: var(--pie-fondo, var(--tiza)) !important; opacity: 1 !important; font-weight: 500; text-decoration: none !important; }",
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
        "/* Vida para nuestra tierra: logo centrado, links en una fila y la frase a todo el ancho; la foto se ve por adentro de las letras. */",
        '.pie[data-variante="vida"] { background: var(--pie-fondo); color: var(--pie-tinta); text-align: center; }',
        '.pie[data-variante="vida"] .pie__in { display: grid; justify-items: center; gap: 36px; padding-bottom: 20px; }',
        '.pie[data-variante="vida"] .pie__cols { grid-template-columns: repeat(4, max-content); gap: 20px 56px; text-align: left; }',
        '.pie[data-variante="vida"] .pie__etica { width: 100%; max-width: 760px; text-align: left; }',
        '.pie__vida { display: block; width: 100%; margin: 8px 0 0; font: 500 clamp(44px, 8.4vw, 150px)/.92 var(--f-d); letter-spacing: -.04em; text-wrap: balance;',
        "  color: transparent; background: url(../novedades/fotos/demo-1.webp) center calc(50% + (1 - var(--p)) * var(--par) * 2%) / cover; -webkit-background-clip: text; background-clip: text; }",
        '.pie[data-variante="vida"] .pie__legal { width: 100%; }',
        "",
        "@media (max-width: 760px) {",
        "  .pie__cols, .pie[data-variante=\"vida\"] .pie__cols { grid-template-columns: repeat(2, minmax(0, 1fr)); }",
        "  .pie[data-variante=\"trigo\"] .pie__in { grid-template-columns: 1fr; } .pie[data-variante=\"trigo\"] .pie__der { grid-column: 1; padding-top: 34vw; }",
        "  .pie__trigo { height: auto; width: 46vw; left: auto; right: -6vw; bottom: auto; top: -3vw; }",
        "}",
        "@media (prefers-reduced-motion: reduce) { .pie { --p: 1 !important; } }"
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
      h += '<div class="pie__in">\n';
      if (v === "institucional") h += cab + cols + etica + legal;
      if (v === "trigo") h += ' <div class="pie__der">\n' + cab + cols + etica + legal + ' </div>\n';
      if (v === "vida") h += '  <a class="pie__logo" href="#" aria-label="Profertil">' + logo + '</a>\n' + cols + etica + '  <p class="pie__vida">Vida para nuestra tierra</p>\n' + legal;
      return h + '</div>\n</footer>';
    },
    js: function (s) {
      if (s.variante === "institucional") return "";
      return "(" + function () {
        // El pie avisa cuánto entró en pantalla (--p de 0 a 1): con eso se mueven el trigo y la foto.
        var pie = document.querySelector(".pie"), pedido = false;
        if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        function tic() {
          pedido = false;
          var r = pie.getBoundingClientRect(), p = Math.min(1, Math.max(0, (innerHeight - r.top) / r.height));
          pie.style.setProperty("--p", p.toFixed(4));
        }
        addEventListener("scroll", function () { if (!pedido) { pedido = true; requestAnimationFrame(tic); } }, { passive: true });
        addEventListener("resize", tic); tic();
      }.toString() + ")();";
    }
  });
})();
