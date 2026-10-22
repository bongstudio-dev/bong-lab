/* Pie de página: tres variantes. */
(function () {
  var COLUMNAS = [
    ["Empresa", ["Quiénes somos", "Planta Bahía Blanca", "Sustentabilidad", "Compliance"]],
    ["Productos", ["Catálogo", "Por cultivo", "Fichas y hojas de seguridad", "Distribuidores"]],
    ["Novedades", ["Noticias", "Sala de prensa", "Inversores", "Biblioteca virtual"]],
    ["Contacto", ["Escribinos", "Trabajá con nosotros", "Proveedores", "Visitas a planta"]]
  ];
  // Fondos de color permitidos (Color y texto del Master) y el texto que va encima.
  var FONDOS = { azul: ["#003DA5", "#FFFEEF"], verde: ["#2D8035", "#FFFEEF"], terra: ["#8A4818", "#FFFEEF"], amarillo: ["#EABA2C", "#003DA5"] };

  Libreria.sumar({
    id: "footer", nombre: "Pie de página", grupo: "Navegación", alto: "auto", sangrado: true,
    bajada: "El cierre de todas las páginas: navegación, línea ética y datos legales.",
    variantes: [["institucional", "Institucional", "Fondo de color, logo y bajada arriba, cuatro columnas y legales."], ["forma", "Con forma", "Fondo tiza y una forma oficial grande que asoma detrás de los links."], ["firma", "Logo de firma", "Links en una fila y la palabra PROFERTIL a todo el ancho como cierre."]],
    tamano: "media",
    claves: ["La línea ética va siempre en el pie, destacada, con su propio llamado.", "Los fondos de color son solo los que permite el Master (azul, verde, terra, amarillo); sobre amarillo el texto va en azul.", "Las columnas repiten el menú principal: si cambia la arquitectura, cambia el pie.", "El radio de arriba separa el pie del contenido como una pieza aparte."],
    accesibilidad: "Es un <footer> con listas de links reales. El logo de firma lleva aria-label con el nombre de la marca.",
    previo: '<div style="height:46vh;display:grid;place-items:center;color:#737D96;font-size:13px">Final de la página</div>',
    controles: [
      { id: "fondo", tipo: "seg", etiqueta: "Fondo (Institucional y Logo de firma)", def: "azul", aplica: { attr: "data-fondo" }, opciones: [["azul", "Azul"], ["verde", "Verde"], ["terra", "Terra"], ["amarillo", "Amarillo"]], desc: "Color de fondo y tinta que va encima." },
      { id: "forma", tipo: "select", etiqueta: "Forma (Con forma)", def: "flor", opciones: Object.keys(FORMAS).map(function (k) { return [k, k.charAt(0).toUpperCase() + k.slice(1)]; }), desc: "Forma oficial que asoma detrás." },
      "---",
      { id: "radio", tipo: "rango", etiqueta: "Radio de arriba", unidad: "px", min: 0, max: 56, def: 26, aplica: { var: "--radio", unidad: "px" }, desc: "Radio de las esquinas de arriba." },
      { id: "logo", tipo: "rango", etiqueta: "Logo", unidad: "px", min: 80, max: 260, def: 150, aplica: { var: "--logo", unidad: "px" }, desc: "Ancho del logo (Institucional y Con forma)." },
      { id: "etica", tipo: "interr", etiqueta: "Destacar la línea ética", def: true, desc: "Bloque destacado con el llamado a denunciar." }
    ],
    css: function () {
      return [
        ".pie { --radio: 26px; --logo: 150px; --f-d: \"Familjen Grotesk\", \"Helvetica Neue\", Arial, sans-serif;",
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
        ".pie__pill { display: inline-flex; align-items: center; height: 44px; padding: 0 20px; border-radius: 999px; background: var(--pie-tinta, #003DA5); color: var(--pie-fondo, #FFFEEF) !important; opacity: 1 !important; font-weight: 500; text-decoration: none !important; }",
        ".pie__legal { display: flex; justify-content: space-between; gap: 12px 24px; flex-wrap: wrap; padding-top: 20px; border-top: 1px solid color-mix(in srgb, currentColor 18%, transparent); font-size: 12px; opacity: .8; }",
        ".pie__legal nav { display: flex; gap: 18px; flex-wrap: wrap; }",
        "",
        "/* Institucional: fondo de color, logo y bajada arriba, columnas, línea ética y legales. */",
        '.pie[data-variante="institucional"] { background: var(--pie-fondo); color: var(--pie-tinta); }',
        '.pie[data-variante="institucional"] .pie__in { display: grid; gap: 40px; }',
        '.pie[data-variante="institucional"] .pie__cab { display: flex; justify-content: space-between; align-items: flex-end; gap: 24px; flex-wrap: wrap; }',
        '.pie[data-variante="institucional"] .pie__cab p { margin: 12px 0 0; max-width: 34ch; font: 500 22px/1.15 var(--f-d); letter-spacing: -.02em; }',
        "",
        "/* Con forma: fondo tiza, tinta azul y una forma oficial grande que asoma a la derecha. */",
        '.pie[data-variante="forma"] { background: #FFFEEF; color: #0A1E4A; --pie-tinta: #003DA5; --pie-fondo: #FFFEEF; }',
        '.pie[data-variante="forma"] .pie__in { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 2fr); gap: 40px 48px; }',
        '.pie[data-variante="forma"] .pie__logo { color: #003DA5; }',
        '.pie[data-variante="forma"] .pie__cab p { margin: 14px 0 22px; max-width: 26ch; color: #44506E; }',
        '.pie[data-variante="forma"] .pie__cols { grid-template-columns: repeat(2, minmax(0, 1fr)); position: relative; z-index: 1; }',
        '.pie[data-variante="forma"] .pie__etica, .pie[data-variante="forma"] .pie__legal { grid-column: 1 / -1; position: relative; z-index: 1; }',
        '.pie[data-variante="forma"] .pie__etica { background: #E9E7D6; }',
        '.pie__forma { position: absolute; right: -6%; top: -18%; width: min(48vw, 560px); color: #003DA5; opacity: .1; pointer-events: none; }',
        '.pie__forma svg { display: block; width: 100%; height: auto; }',
        "",
        "/* Logo de firma: links en una fila y el logo a todo el ancho como cierre. */",
        '.pie[data-variante="firma"] { background: var(--pie-fondo); color: var(--pie-tinta); }',
        '.pie[data-variante="firma"] .pie__in { display: grid; gap: 32px; }',
        '.pie[data-variante="firma"] .pie__cols { grid-template-columns: repeat(4, max-content); justify-content: space-between; }',
        '.pie[data-variante="firma"] .pie__cols h3 { margin-bottom: 8px; }',
        '.pie[data-variante="firma"] .pie__cols li:nth-child(n + 3) { display: none; }',
        '.pie[data-variante="firma"] .pie__grande { display: block; width: 100%; padding: 8px 0 12px; }',
        '.pie[data-variante="firma"] .pie__grande svg { display: block; width: 100%; height: auto; }',
        '.pie[data-variante="firma"] .pie__etica { background: none; padding: 0; border-radius: 0; }',
        "",
        "@media (max-width: 760px) {",
        "  .pie__cols, .pie[data-variante=\"forma\"] .pie__in, .pie[data-variante=\"forma\"] .pie__cols { grid-template-columns: repeat(2, minmax(0, 1fr)); }",
        "  .pie[data-variante=\"forma\"] .pie__cab, .pie[data-variante=\"forma\"] .pie__cols { grid-column: 1 / -1; }",
        "  .pie[data-variante=\"firma\"] .pie__cols { grid-template-columns: repeat(2, minmax(0, 1fr)); justify-content: stretch; }",
        "  .pie__forma { width: 80vw; top: -6%; }",
        "}"
      ].join("\n");
    },
    html: function (s) {
      var v = s.variante, logo = LOGO_BLANCO;
      var cols = '  <div class="pie__cols">\n' + COLUMNAS.map(function (c) {
        return '    <div><h3>' + c[0] + '</h3><ul>' + c[1].map(function (l) { return '<li><a href="#">' + l + '</a></li>'; }).join("") + '</ul></div>';
      }).join("\n") + '\n  </div>\n';
      var etica = s.etica
        ? '  <div class="pie__etica"><div><b>Línea ética</b><span>Confidencial y anónima. Atiende un tercero independiente.</span></div><a class="pie__pill" href="#">Hacer una denuncia</a></div>\n'
        : '';
      var legal = '  <div class="pie__legal"><span>© 2026 Profertil S.A. Todos los derechos reservados.</span><nav><a href="#">Privacidad</a><a href="#">Términos de uso</a><a href="#">LinkedIn</a><a href="#">Instagram</a></nav></div>\n';
      var h = '<footer class="pie" data-c="footer">\n';
      if (v === "forma") h += '<div class="pie__forma" aria-hidden="true">' + formaSVG(s.forma) + '</div>\n';
      h += '<div class="pie__in">\n';
      if (v === "institucional") h += '  <div class="pie__cab"><div><span class="pie__logo">' + logo + '</span><p>Nutrientes para el campo argentino, desde Bahía Blanca.</p></div><a class="pie__pill" href="#">Contacto</a></div>\n' + cols + etica + legal;
      if (v === "forma") h += '  <div class="pie__cab"><span class="pie__logo">' + logo + '</span><p>Nutrientes para el campo argentino, desde Bahía Blanca.</p><a class="pie__pill" href="#">Contacto</a></div>\n' + cols + etica + legal;
      // Logo de firma: solo la palabra, recortando el viewBox del logo (el símbolo queda afuera).
      if (v === "firma") h += cols + etica + legal + '  <span class="pie__grande" aria-label="Profertil">' + logo.replace(/viewBox="[^"]+"/, 'viewBox="0 778 1458 246"') + '</span>\n';
      return h + '</div>\n</footer>';
    }
  });
})();
