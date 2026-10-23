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
      ["vida", "Vida para nuestra tierra", "Alto de pantalla completa con un video de campo en loop de fondo y un filtro negro parejo. La frase va abajo a la izquierda, a tamaño de título, y entra con el animador Ventana."]
    ],
    tamano: "media",
    claves: ["La línea ética va siempre en el pie, destacada, con su propio llamado.", "Los fondos de color son solo los del Master (azul, verde, terra, amarillo); sobre amarillo el texto va en azul.", "El logo va siempre completo: no se recorta ni se separa el símbolo de la palabra.", "Las columnas repiten el menú principal: si cambia la arquitectura, cambia el pie.", "Con trigo y Vida para nuestra tierra tienen parallax: el trigo y la foto se mueven a otra velocidad que la página mientras el pie entra en pantalla.", "Vida para nuestra tierra ocupa una pantalla entera. La frase va alineada a la izquierda junto a la línea ética, y entra con el animador Ventana, palabra por palabra.", "Nunca degradados sobre la foto (ni de color ni de tinta). Si hace falta contraste, un filtro negro parejo."],
    accesibilidad: "Es un <footer> con listas de links reales. El trigo es decorativo (aria-hidden); el video es decorativo, mudo y sin controles; la frase es texto real, legible por lectores y buscadores. Con movimiento reducido no hay parallax y el video queda quieto en el primer cuadro.",
    previo: '<div style="height:80vh;display:grid;place-items:center;color:var(--ink-3);font-size:var(--texto-chico)">Final de la página</div>',
    controles: [
      { id: "fondo", tipo: "seg", etiqueta: "Fondo", solo: ["institucional"], def: "azul", aplica: { attr: "data-fondo" }, opciones: [["azul", "Azul"], ["verde", "Verde"], ["terra", "Terra"], ["amarillo", "Amarillo"]], desc: "Color de fondo y tinta que va encima." },
      { id: "filtro", tipo: "rango", etiqueta: "Filtro negro", solo: ["vida"], unidad: "%", min: 0, max: 70, def: 26, aplica: { var: "--filtro" }, desc: "Negro parejo sobre toda la foto para que el texto en tiza se lea. Sin degradado." },
      { id: "frase", tipo: "rango", etiqueta: "Frase", solo: ["vida"], unidad: "px", min: 32, max: 140, def: 100, aplica: { var: "--frase", unidad: "px" }, desc: "Cuerpo de Vida para nuestra tierra. En pantallas chicas no pasa del 14% del ancho." },
      { id: "par", tipo: "rango", etiqueta: "Parallax", solo: ["trigo", "vida"], unidad: "%", min: 0, max: 40, def: 22, aplica: { var: "--par" }, desc: "Cuánto se corre el trigo o el video mientras entra el pie. En Vida, solo el video." },
      "---",
      { id: "radio", tipo: "rango", etiqueta: "Radio de arriba", unidad: "px", min: 0, max: 56, def: 26, aplica: { var: "--radio", unidad: "px" }, desc: "Radio de las esquinas de arriba." },
      { id: "logo", tipo: "rango", etiqueta: "Logo", unidad: "px", min: 80, max: 260, def: 150, aplica: { var: "--logo", unidad: "px" }, desc: "Ancho del logo completo." },
      { id: "etica", tipo: "interr", etiqueta: "Destacar la línea ética", def: true, desc: "Bloque destacado con el llamado a denunciar." }
    ],
    css: function () {
      return [
        ".pf-pie { --radio: var(--radio-tarjeta); --logo: 150px; --par: 22; --p: 1;",
        "  position: relative; overflow: hidden; border-radius: var(--radio) var(--radio) 0 0; font: 400 var(--texto-chico)/1.45 var(--f-body); }",
        Object.keys(FONDOS).map(function (k) { return '.pf-pie[data-fondo="' + k + '"] { --pie-fondo: ' + FONDOS[k][0] + '; --pie-tinta: ' + FONDOS[k][1] + '; }'; }).join("\n"),
        ".pf-pie a { color: inherit; text-decoration: none; opacity: .86; transition: opacity .2s; }",
        ".pf-pie a:hover { opacity: 1; text-decoration: underline; text-underline-offset: 3px; }",
        ".pf-pie ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }",
        ".pf-pie h3 { margin: 0 0 12px; font: 500 var(--texto-mini)/1 var(--f-body); letter-spacing: .08em; text-transform: uppercase; opacity: .6; }",
        ".pf-pie__in { position: relative; max-width: 1280px; margin: 0 auto; padding: clamp(40px, 6vw, 72px) clamp(20px, 4vw, 48px) 28px; }",
        ".pf-pie__logo { display: block; width: var(--logo); }",
        ".pf-pie__logo svg { display: block; width: 100%; height: auto; }",
        ".pf-pie__cols { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 24px; }",
        ".pf-pie__etica { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; padding: 18px 22px; border-radius: 18px; background: color-mix(in srgb, currentColor 9%, transparent); }",
        ".pf-pie__etica b { font: 500 var(--texto-subtitulo)/1.1 var(--f-display); letter-spacing: -.02em; }",
        ".pf-pie__etica span { display: block; margin-top: 4px; font-size: var(--texto-chico); opacity: .75; }",
        ".pf-pie__pill { display: inline-flex; align-items: center; height: 44px; padding: 0 20px; border-radius: 999px; background: var(--pie-tinta, var(--azul)); color: var(--pie-fondo, var(--tiza)) !important; opacity: 1 !important; font-weight: 500; text-decoration: none !important;  text-box: trim-both cap alphabetic; }",
        ".pf-pie__legal { display: flex; justify-content: space-between; gap: 12px 24px; flex-wrap: wrap; padding-top: 20px; border-top: 1px solid color-mix(in srgb, currentColor 18%, transparent); font-size: var(--texto-mini); opacity: .8; }",
        ".pf-pie__legal nav { display: flex; gap: 18px; flex-wrap: wrap; }",
        "",
        "/* Institucional: la base. */",
        '.pf-pie[data-variante="institucional"] { background: var(--pie-fondo); color: var(--pie-tinta); }',
        '.pf-pie[data-variante="institucional"] .pf-pie__in { display: grid; gap: 40px; }',
        '.pf-pie[data-variante="institucional"] .pf-pie__cab { display: flex; justify-content: space-between; align-items: flex-end; gap: 24px; flex-wrap: wrap; }',
        '.pf-pie[data-variante="institucional"] .pf-pie__cab p { margin: 12px 0 0; max-width: 34ch; font: 500 var(--texto-subtitulo)/1.15 var(--f-display); letter-spacing: -.02em; }',
        "",
        "/* Con trigo: el trigo del sistema en amarillo pleno ocupa la izquierda y sube más lento. El contenido va a la derecha. */",
        '.pf-pie[data-variante="trigo"] { background: var(--tiza); color: var(--ink); --pie-tinta: var(--azul); --pie-fondo: var(--tiza); }',
        '.pf-pie__trigo { position: absolute; left: clamp(-80px, -4vw, -24px); bottom: -8%; height: 112%; aspect-ratio: ' + FORMAS.trigo.vb.split(" ")[2] + ' / ' + FORMAS.trigo.vb.split(" ")[3] + '; color: var(--amarillo); pointer-events: none;',
        "  transform: translate3d(0, calc((1 - var(--p)) * var(--par) * 1%), 0); will-change: transform; }",
        '.pf-pie__trigo svg { display: block; width: 100%; height: 100%; }',
        '.pf-pie[data-variante="trigo"] .pf-pie__in { display: grid; grid-template-columns: minmax(0, .9fr) minmax(0, 2fr); column-gap: 48px; }',
        '.pf-pie[data-variante="trigo"] .pf-pie__der { grid-column: 2; display: grid; gap: 36px; }',
        '.pf-pie[data-variante="trigo"] .pf-pie__cab { display: flex; justify-content: space-between; align-items: flex-end; gap: 24px; flex-wrap: wrap; }',
        '.pf-pie[data-variante="trigo"] .pf-pie__logo { color: var(--azul); }',
        '.pf-pie[data-variante="trigo"] .pf-pie__cab p { margin: 12px 0 0; max-width: 28ch; font: 500 var(--texto-subtitulo)/1.2 var(--f-display); letter-spacing: -.02em; color: var(--azul); }',
        '.pf-pie[data-variante="trigo"] .pf-pie__etica { background: var(--bg); }',
        "",
        "/* Vida para nuestra tierra: una pantalla entera con la foto de fondo. Arriba logo y links; abajo, la frase a la izquierda",
        "   y la línea ética a la derecha; al final, los legales. Todo en tiza sobre la foto. */",
        '.pf-pie[data-variante="vida"] { --pie-tinta: var(--tiza); --pie-fondo: var(--azul); --filtro: 26; --frase: 100px;',
        '  overflow: clip; display: flex; flex-direction: column; min-height: 100vh; min-height: 100svh; color: var(--tiza); background: #000; isolation: isolate; }',
        '.pf-pie__foto { position: absolute; inset: 0; z-index: -1; overflow: hidden; }',
        "/* La foto es más alta que el pie y llega a su lugar cuando el pie terminó de entrar (--p = 1). */",
        '.pf-pie__foto img, .pf-pie__foto video { display: block; position: absolute; left: 0; top: 0; width: 100%; height: calc(100% + var(--par) * 2%); object-fit: cover; transform: translate3d(0, calc((var(--p) - 1) * var(--par) * 1%), 0); will-change: transform; }',
        "/* Contraste: un filtro negro parejo. Nunca degradados sobre la foto. */",
        '.pf-pie__foto::after { content: ""; position: absolute; inset: 0; background: rgb(0 0 0 / calc(var(--filtro) * 1%)); }',
        '.pf-pie[data-variante="vida"] .pf-pie__in { flex: 1; display: flex; flex-direction: column; gap: 28px; width: 100%; max-width: none; }',
        '.pf-pie__arriba { display: flex; justify-content: space-between; align-items: flex-start; gap: 32px 56px; flex-wrap: wrap; }',
        '.pf-pie[data-variante="vida"] .pf-pie__cols { flex: 1; max-width: 760px; }',
        '.pf-pie__abajo { margin-top: auto; display: flex; justify-content: space-between; align-items: flex-end; gap: 24px 48px; flex-wrap: wrap; }',
        '.pf-pie[data-variante="vida"] .pf-pie__etica { flex: 0 1 560px; backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); }',
        "/* La frase: tiza, a tamaño de título y alineada a la izquierda. */",
        '.pf-pie__vida { margin: 0; font: 500 min(var(--frase), 14vw)/.92 var(--f-display); letter-spacing: -.035em; color: var(--tiza); text-align: left; }',
        "/* Entra con el animador Ventana (animadores.css y animadores.js), palabra por palabra al aparecer en pantalla.",
        "   El animador rearma el texto por palabras: el ancho máximo es lo que corta en Vida para / nuestra tierra. */",
        '.pf-pie__vida { max-width: 6.6em; }',
        '.pf-pie[data-variante="vida"] .pf-pie__legal { border-top-color: color-mix(in srgb, var(--tiza) 30%, transparent); color: var(--tiza); }',
        "",
        "@media (max-width: 760px) {",
        "  .pf-pie__cols, .pf-pie[data-variante=\"vida\"] .pf-pie__cols { grid-template-columns: repeat(2, minmax(0, 1fr)); flex-basis: 100%; }",
        "  .pf-pie[data-variante=\"vida\"] .pf-pie__in { gap: 22px; }",
        "  .pf-pie[data-variante=\"trigo\"] .pf-pie__in { grid-template-columns: 1fr; } .pf-pie[data-variante=\"trigo\"] .pf-pie__der { grid-column: 1; padding-top: 34vw; }",
        "  .pf-pie__trigo { height: auto; width: 46vw; left: auto; right: -6vw; bottom: auto; top: -3vw; }",
        "}",
        "@media (prefers-reduced-motion: reduce) { .pf-pie { --p: 1 !important; } }"
      ].join("\n");
    },
    html: function (s) {
      var v = s.variante, logo = LOGO_BLANCO.replace("<svg", '<svg aria-hidden="true"');
      var cols = '  <div class="pf-pie__cols">\n' + COLUMNAS.map(function (c) {
        return '    <div><h3>' + c[0] + '</h3><ul>' + c[1].map(function (l) { return '<li><a href="#">' + l + '</a></li>'; }).join("") + '</ul></div>';
      }).join("\n") + '\n  </div>\n';
      var etica = s.etica
        ? '  <div class="pf-pie__etica"><div><b>Línea ética</b><span>Confidencial y anónima. Atiende un tercero independiente.</span></div><a class="pf-pie__pill" href="#">Hacer una denuncia</a></div>\n'
        : '';
      var legal = '  <div class="pf-pie__legal"><span>© 2026 Profertil S.A. Todos los derechos reservados.</span><nav><a href="#">Privacidad</a><a href="#">Términos de uso</a><a href="#">LinkedIn</a><a href="#">Instagram</a></nav></div>\n';
      var cab = '  <div class="pf-pie__cab"><div><a class="pf-pie__logo" href="#" aria-label="Profertil">' + logo + '</a><p>Vida para nuestra tierra</p></div><a class="pf-pie__pill" href="#">Contacto</a></div>\n';
      var h = '<footer class="pf-pie" data-c="footer">\n';
      if (v === "trigo") h += '<div class="pf-pie__trigo" aria-hidden="true">' + formaSVG("trigo") + '</div>\n';
      if (v === "vida") h += '<div class="pf-pie__foto" aria-hidden="true"><video autoplay muted loop playsinline preload="metadata" poster="media/pie-campo.jpg"><source src="media/pie-campo.mp4" type="video/mp4"></video></div>\n';
      h += '<div class="pf-pie__in">\n';
      if (v === "institucional") h += cab + cols + etica + legal;
      if (v === "trigo") h += ' <div class="pf-pie__der">\n' + cab + cols + etica + legal + ' </div>\n';
      if (v === "vida") h += '  <div class="pf-pie__arriba">\n  <a class="pf-pie__logo" href="#" aria-label="Profertil">' + logo + '</a>\n' + cols + '  </div>\n' +
        '  <div class="pf-pie__abajo">\n  <p class="pf-pie__vida" data-anim="ventana">Vida para nuestra tierra</p>\n' + etica + '  </div>\n' + legal;
      return h + '</div>\n</footer>';
    },
    js: function (s) {
      if (s.variante === "institucional") return "";
      return "(" + function () {
        // El pie avisa cuánto entró en pantalla (--p de 0 a 1): con eso se mueven el trigo, la foto y la frase.
        var pie = document.querySelector(".pf-pie"), pedido = false;
        // El video corre solo mientras el pie está en pantalla; con movimiento reducido queda quieto.
        var vid = pie.querySelector(".pf-pie__foto video"), quieto = matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (vid) {
          if (quieto) { vid.removeAttribute("autoplay"); vid.pause(); }
          else if ("IntersectionObserver" in window) new IntersectionObserver(function (e) { if (e[0].isIntersecting) vid.play().catch(function () {}); else vid.pause(); }).observe(pie);
        }
        if (quieto) return;
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
