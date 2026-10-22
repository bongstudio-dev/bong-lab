/* Fotos a pantalla completa con el scroll: apiladas, que se expanden o con parallax. */
(function () {
  var PANELES = [
    // Las líneas del título y la bajada se cortan con " | ": cada una entra por separado.
    ["Campo", "Nutrientes para cada | etapa del cultivo", "Recomendaciones por zona, cultivo | y momento de aplicación.", 1],
    ["Planta", "Producimos en | Bahía Blanca", "Una planta que trabaja | todos los días del año.", 3],
    ["Personas", "Un equipo | que crece", "Personas en planta y oficinas, | con oficios muy distintos.", 2],
    ["Comunidad", "Cerca de quienes | nos rodean", "Programas con escuelas, huertas | y organizaciones locales.", 4]
  ];

  Libreria.sumar({
    id: "scroll-fotos", nombre: "Fotos a pantalla completa", grupo: "Scroll", alto: 680,
    bajada: "Fotos a todo el ancho que se mueven con el scroll, con el texto que entra por líneas.",
    nota: "Scrolleá dentro del escenario. Fotos y textos de ejemplo.",
    variantes: [["apiladas", "Apiladas"], ["expande", "Se expande"], ["parallax", "Parallax"]],
    controles: [
      { id: "intensidad", tipo: "rango", etiqueta: "Intensidad del parallax", unidad: "%", min: 0, max: 40, def: 20, aplica: { var: "--intensidad" } },
      { id: "oscuro", tipo: "rango", etiqueta: "Oscurecido de la foto", unidad: "%", min: 0, max: 70, def: 35, aplica: { var: "--oscuro" } },
      { id: "radio", tipo: "rango", etiqueta: "Radio en reposo", unidad: "px", min: 0, max: 48, def: 26, aplica: { var: "--radio", unidad: "px" } },
      { id: "etiqueta", tipo: "interr", etiqueta: "Pastilla con la categoría", def: true, aplica: { attr: "data-etiqueta" } }
    ],
    css: function () {
      return [
        ".sf { --intensidad: 20; --oscuro: 35; --radio: 26px; --curva: cubic-bezier(.22, 1, .36, 1); --f-d: \"Familjen Grotesk\", \"Helvetica Neue\", Arial, sans-serif;",
        "  font: 400 16px/1.5 \"DM Sans\", \"Helvetica Neue\", Arial, sans-serif; color: #FFFEEF; }",
        ".sf__intro, .sf__fin { padding: 22vh clamp(20px, 5vw, 64px); color: #0A1E4A; }",
        ".sf__intro h2, .sf__fin h2 { margin: 0; font: 500 clamp(28px, 4vw, 52px)/1.04 var(--f-d); letter-spacing: -.03em; max-width: 16ch; }",
        ".sf__media { position: absolute; inset: 0; overflow: hidden; }",
        ".sf__media img { position: absolute; left: 0; top: 50%; width: 100%; height: calc(100% + var(--intensidad) * 2%); object-fit: cover; transform: translate3d(0, calc(-50% + var(--y, 0) * var(--intensidad) * 1%), 0); will-change: transform; }",
        ".sf__media::after { content: \"\"; position: absolute; inset: 0; background: linear-gradient(to top, rgba(10, 30, 74, calc(var(--oscuro) / 100)), rgba(10, 30, 74, calc(var(--oscuro) / 300)) 60%, transparent); }",
        ".sf__txt { position: absolute; left: clamp(20px, 5vw, 64px); right: clamp(20px, 5vw, 64px); bottom: clamp(28px, 7vh, 72px); display: grid; gap: 14px; max-width: 760px; }",
        ".sf__pill { justify-self: start; display: inline-flex; align-items: center; height: 30px; padding: 0 14px; border-radius: 999px; background: rgba(255, 254, 239, .92); color: #003DA5; font-size: 13px; font-weight: 500; }",
        ".sf[data-etiqueta=\"false\"] .sf__pill { display: none; }",
        ".sf__txt h3 { margin: 0; font: 500 clamp(34px, 5.4vw, 76px)/1 var(--f-d); letter-spacing: -.035em; }",
        ".sf__txt p { margin: 0; max-width: 40ch; font-size: 17px; opacity: .9; }",
        "/* Las líneas del texto entran de abajo cuando su panel queda en pantalla. */",
        ".sf__linea { display: block; overflow: clip; padding-bottom: .08em; }",
        ".sf__linea > span { display: block; transform: translateY(105%); transition: transform .9s var(--curva); transition-delay: calc(var(--k, 0) * 70ms); }",
        ".sf .en-vista .sf__linea > span { transform: none; }",
        "",
        "/* Apiladas: la sección queda fija y cada foto sube y tapa a la anterior. */",
        ".sf__pila { position: relative; }",
        ".sf__pila-in { position: sticky; top: 0; height: 100vh; overflow: hidden; }",
        ".sf__pila .sf__panel { position: absolute; inset: 0; overflow: hidden; transform: translate3d(0, calc(var(--t, 1) * 100%), 0); will-change: transform; }",
        ".sf__pila .sf__panel:first-child { --t: 0; }",
        "",
        "/* Se expande: la foto arranca como tarjeta con aire y radio, y crece hasta el borde. */",
        ".sf__exp { position: relative; height: 200vh; }",
        ".sf__exp-in { position: sticky; top: 0; height: 100vh; display: grid; place-items: center; }",
        ".sf__exp .sf__panel { position: relative; width: 100%; height: 100%; overflow: hidden; clip-path: inset(calc((1 - var(--e, 0)) * 14vh) calc((1 - var(--e, 0)) * 16vw) round calc((1 - var(--e, 0)) * var(--radio))); }",
        ".sf__exp + .sf__exp { margin-top: -30vh; }",
        "",
        "/* Parallax: las fotos pasan con el scroll natural y la imagen va más lenta que la página. */",
        ".sf__para .sf__panel { position: relative; height: 100vh; overflow: hidden; }",
        ".sf__para .sf__panel + .sf__panel { margin-top: 12px; }",
        "",
        "@media (prefers-reduced-motion: reduce) { .sf__media img { transform: translate(0, -50%) !important; } .sf__linea > span { transform: none !important; transition: none; } }"
      ].join("\n");
    },
    html: function (s) {
      var v = s.variante;
      function lineas(t) { return t.split(" | ").map(function (l, k) { return '<span class="sf__linea"><span style="--k:' + k + '">' + l + '</span></span>'; }).join(""); }
      function panel(p, i) {
        return '<article class="sf__panel">\n        <div class="sf__media"><img src="../novedades/fotos/demo-' + p[3] + '.webp" alt=""></div>\n' +
          '        <div class="sf__txt"><span class="sf__pill">' + p[0] + '</span><h3>' + lineas(p[1]) + '</h3><p>' + lineas(p[2]) + '</p></div>\n      </article>';
      }
      var h = '<section class="sf" data-c="scroll-fotos">\n  <div class="sf__intro"><h2>Lo que hacemos, de cerca</h2></div>\n';
      if (v === "apiladas") h += '  <div class="sf__pila" style="height: ' + (PANELES.length * 100 + 40) + 'vh">\n    <div class="sf__pila-in">\n      ' + PANELES.map(panel).join("\n      ") + '\n    </div>\n  </div>\n';
      if (v === "expande") h += PANELES.map(function (p, i) { return '  <div class="sf__exp">\n    <div class="sf__exp-in">\n      ' + panel(p, i) + '\n    </div>\n  </div>\n'; }).join("");
      if (v === "parallax") h += '  <div class="sf__para">\n      ' + PANELES.map(panel).join("\n      ") + '\n  </div>\n';
      return h + '  <div class="sf__fin"><h2>Sigue el resto de la página</h2></div>\n</section>';
    },
    js: function (s) {
      return [
        "(function () {",
        "  var raiz = document.querySelector('.sf'), quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;",
        "  var paneles = [].slice.call(raiz.querySelectorAll('.sf__panel'));",
        "  var pila = raiz.querySelector('.sf__pila'), exps = [].slice.call(raiz.querySelectorAll('.sf__exp'));",
        "  function lim(x) { return Math.min(1, Math.max(0, x)); }",
        "  function suave(x) { return 1 - Math.pow(1 - x, 3); }",
        "  // El texto de cada panel entra cuando el panel ya ocupa casi toda la pantalla.",
        "  function vista(p, on) { p.classList.toggle('en-vista', on); }",
        "  function tic() {",
        "    var H = innerHeight;",
        "    if (pila) {",
        "      // Apiladas: el avance dentro de la pila reparte un tramo de pantalla para cada foto.",
        "      var r = pila.getBoundingClientRect(), avance = -r.top / H;",
        "      paneles.forEach(function (p, i) {",
        "        var t = i === 0 ? 0 : 1 - lim(avance - (i - 1));",
        "        p.style.setProperty('--t', t.toFixed(4));",
        "        // La foto de abajo baja un poco mientras la tapan: el contra-movimiento da profundidad.",
        "        var tapa = i < paneles.length - 1 ? lim(avance - i) : 0;",
        "        p.querySelector('.sf__media').style.setProperty('--y', (t > 0 ? -t : tapa).toFixed(4));",
        "        vista(p, t < .2 && tapa < .8);",
        "      });",
        "    }",
        "    exps.forEach(function (x) {",
        "      // Se expande: la tarjeta crece hasta el borde en la primera mitad del tramo.",
        "      var r = x.getBoundingClientRect(), e = suave(lim(-r.top / (H * .8)));",
        "      var p = x.querySelector('.sf__panel'); p.style.setProperty('--e', e.toFixed(4));",
        "      p.querySelector('.sf__media').style.setProperty('--y', (lim((H - r.top) / (r.height + H)) * 2 - 1).toFixed(4));",
        "      vista(p, e > .85);",
        "    });",
        "    if (!pila && !exps.length) paneles.forEach(function (p) {",
        "      // Parallax: la imagen se corre según dónde está el panel en la pantalla (-1 arriba, 1 abajo).",
        "      var r = p.getBoundingClientRect(), y = ((r.top + r.height / 2) - H / 2) / (H / 2 + r.height / 2);",
        "      p.querySelector('.sf__media').style.setProperty('--y', Math.max(-1, Math.min(1, -y)).toFixed(4));",
        "      vista(p, r.top < H * .5 && r.bottom > H * .5);",
        "    });",
        "  }",
        "  var pedido = false;",
        "  function pedir() { if (!pedido) { pedido = true; requestAnimationFrame(function () { pedido = false; tic(); }); } }",
        "  if (quieto) paneles.forEach(function (p) { vista(p, true); });",
        "  addEventListener('scroll', pedir, { passive: true }); addEventListener('resize', pedir); tic();",
        "})();"
      ].join("\n");
    }
  });
})();
