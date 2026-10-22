/* Fotos a pantalla completa con el scroll: como páginas con parallax, apiladas o que se expanden. */
(function () {
  var PANELES = [
    // [categoría del sistema de etiquetas, título, bajada, foto]. Las líneas se cortan con " | ": cada una entra por separado.
    ["tecnico", "Nutrientes para cada | etapa del cultivo", "Recomendaciones por zona, cultivo | y momento de aplicación.", 1],
    ["institucional", "Producimos en | Bahía Blanca", "Una planta que trabaja | todos los días del año.", 3],
    ["somos", "Un equipo | que crece", "Personas en planta y oficinas, | con oficios muy distintos.", 2],
    ["aviso", "Cerca de quienes | nos rodean", "Programas con escuelas, huertas | y organizaciones locales.", 4]
  ];

  Libreria.sumar({
    id: "scroll-fotos", nombre: "Fotos a pantalla completa", grupo: "Scroll", alto: 680,
    bajada: "Fotos a todo el ancho que se mueven con el scroll, con la etiqueta y el texto arriba, que entran por líneas.",
    nota: "Scrolleá dentro del escenario. Fotos y textos de ejemplo.",
    variantes: [
      ["paginas", "Como páginas", "La sección queda fija y las fotos pasan hacia arriba como páginas; cada imagen va más lenta que su panel. La de la referencia."],
      ["apiladas", "Apiladas", "Cada foto sube y tapa a la anterior, que baja un poco."],
      ["expande", "Se expande", "La foto arranca como tarjeta con aire y radio y crece hasta el borde."]
    ],
    tamano: "ancha", previa: .22,
    claves: ["Cada foto ocupa la pantalla entera; la etiqueta, el título y la bajada van arriba a la izquierda, así no los tapa la foto siguiente.", "La etiqueta es la del sistema: badge con la forma de la categoría, rótulo blanco.", "El texto entra por líneas (cortadas a mano) cuando el panel queda en pantalla.", "Como páginas: el panel se mueve el 100% y su imagen solo el 20%, por eso parece que la foto se queda y el marco se corre.", "Todo se calcula en un solo requestAnimationFrame por scroll y solo mueve transform y clip-path."],
    accesibilidad: "Con movimiento reducido las fotos quedan quietas y el texto aparece sin animar. Las fotos de demo no llevan texto alternativo: en el sitio lo necesitan.",
    controles: [
      { id: "intensidad", tipo: "rango", etiqueta: "Intensidad del parallax", unidad: "%", min: 0, max: 100, def: 80, aplica: { var: "--intensidad" }, desc: "Cuánto se queda la imagen mientras su panel se mueve (80 = va al 20% de la velocidad)." },
      { id: "oscuro", tipo: "rango", etiqueta: "Oscurecido de la foto", unidad: "%", min: 0, max: 70, def: 40, aplica: { var: "--oscuro" }, desc: "Degradé de arriba para que el texto se lea." },
      { id: "radio", tipo: "rango", etiqueta: "Radio en reposo (Se expande)", unidad: "px", min: 0, max: 48, def: 26, aplica: { var: "--radio", unidad: "px" }, desc: "Radio de la tarjeta antes de expandirse." },
      { id: "etiqueta", tipo: "interr", etiqueta: "Etiqueta de la categoría", def: true, aplica: { attr: "data-etiqueta" }, desc: "La Etiqueta del sistema arriba del título." }
    ],
    css: function () {
      return [
        ".sf { --intensidad: 80; --oscuro: 40; --radio: 26px; --curva: cubic-bezier(.22, 1, .36, 1); --f-d: \"Familjen Grotesk\", \"Helvetica Neue\", Arial, sans-serif;",
        "  font: 400 16px/1.5 \"DM Sans\", \"Helvetica Neue\", Arial, sans-serif; color: var(--tiza); }",
        SIS.etiquetaCSS,
        ".sf__intro, .sf__fin { padding: 22vh clamp(20px, 5vw, 64px); color: var(--ink); }",
        ".sf__intro h2, .sf__fin h2 { margin: 0; font: 500 clamp(28px, 4vw, 52px)/1.04 var(--f-d); letter-spacing: -.03em; max-width: 16ch; }",
        ".sf__panel { overflow: hidden; background: var(--ink); }",
        ".sf__media { position: absolute; inset: 0; overflow: hidden; }",
        "/* La imagen es más alta que su panel en la misma medida en que se corre: así nunca queda una franja vacía. */",
        ".sf__media img { position: absolute; left: 0; top: calc(var(--intensidad) * -.5%); width: 100%; height: calc(100% + var(--intensidad) * 1%); object-fit: cover; transform: translate3d(0, var(--y, 0px), 0); will-change: transform; }",
        ".sf__media::after { content: \"\"; position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(10, 30, 74, calc(var(--oscuro) / 100)), rgba(10, 30, 74, calc(var(--oscuro) / 400)) 55%, transparent); }",
        "/* El texto va arriba: con la foto siguiente entrando desde abajo, así se lee hasta el final. */",
        ".sf__txt { position: absolute; left: clamp(20px, 5vw, 64px); right: clamp(20px, 5vw, 64px); top: clamp(28px, 9vh, 96px); display: grid; justify-items: start; gap: 16px; max-width: 760px; }",
        ".sf[data-etiqueta=\"false\"] .etq { display: none; }",
        ".sf__txt h3 { margin: 0; font: 500 clamp(34px, 5.4vw, 76px)/1 var(--f-d); letter-spacing: -.035em; }",
        ".sf__txt p { margin: 0; max-width: 40ch; font-size: 17px; opacity: .92; }",
        ".sf__linea { display: block; overflow: clip; padding-bottom: .08em; }",
        ".sf__linea > span { display: block; transform: translateY(105%); transition: transform .9s var(--curva); transition-delay: calc(var(--k, 0) * 70ms); }",
        ".sf__txt .etq { opacity: 0; transform: translateY(8px); transition: opacity .5s var(--curva), transform .7s var(--curva); }",
        ".sf .en-vista .sf__linea > span, .sf .en-vista .etq { transform: none; opacity: 1; }",
        "",
        "/* Como páginas y Apiladas: la sección queda fija y los paneles se mueven adentro. */",
        ".sf__fijo { position: relative; }",
        ".sf__fijo-in { position: sticky; top: 0; height: 100vh; overflow: hidden; }",
        ".sf__fijo .sf__panel { position: absolute; inset: 0; transform: translate3d(0, var(--t, 100%), 0); will-change: transform; }",
        ".sf__fijo .sf__panel:first-child { --t: 0%; }",
        "",
        "/* Se expande: la foto arranca como tarjeta con aire y radio, y crece hasta el borde. */",
        ".sf__exp { position: relative; height: 200vh; }",
        ".sf__exp-in { position: sticky; top: 0; height: 100vh; }",
        ".sf__exp .sf__panel { position: relative; width: 100%; height: 100%; clip-path: inset(calc((1 - var(--e, 0)) * 14vh) calc((1 - var(--e, 0)) * 16vw) round calc((1 - var(--e, 0)) * var(--radio))); }",
        ".sf__exp + .sf__exp { margin-top: -30vh; }",
        "",
        "@media (prefers-reduced-motion: reduce) { .sf__media img { transform: none !important; } .sf__linea > span, .sf__txt .etq { transform: none !important; opacity: 1 !important; transition: none; } }"
      ].join("\n");
    },
    html: function (s) {
      var v = s.variante;
      function lineas(t) { return t.split(" | ").map(function (l, k) { return '<span class="sf__linea"><span style="--k:' + k + '">' + l + '</span></span>'; }).join(""); }
      function panel(p) {
        return '<article class="sf__panel">\n        <div class="sf__media"><img src="../novedades/fotos/demo-' + p[3] + '.webp" alt=""></div>\n' +
          '        <div class="sf__txt">' + SIS.etiqueta(p[0]) + '<h3>' + lineas(p[1]) + '</h3><p>' + lineas(p[2]) + '</p></div>\n      </article>';
      }
      var h = '<section class="sf" data-c="scroll-fotos">\n  <div class="sf__intro"><h2>Lo que hacemos, de cerca</h2></div>\n';
      if (v === "paginas" || v === "apiladas") h += '  <div class="sf__fijo" data-modo="' + v + '" style="height: ' + (PANELES.length * 100) + 'vh">\n    <div class="sf__fijo-in">\n      ' + PANELES.map(panel).join("\n      ") + '\n    </div>\n  </div>\n';
      if (v === "expande") h += PANELES.map(function (p) { return '  <div class="sf__exp">\n    <div class="sf__exp-in">\n      ' + panel(p) + '\n    </div>\n  </div>\n'; }).join("");
      return h + '  <div class="sf__fin"><h2>Sigue el resto de la página</h2></div>\n</section>';
    },
    js: function () {
      return "(" + function () {
        var raiz = document.querySelector(".sf"), quieto = matchMedia("(prefers-reduced-motion: reduce)").matches;
        var fijo = raiz.querySelector(".sf__fijo"), exps = [].slice.call(raiz.querySelectorAll(".sf__exp"));
        var paneles = [].slice.call(raiz.querySelectorAll(".sf__panel"));
        function lim(x) { return Math.min(1, Math.max(0, x)); }
        function suave(x) { return 1 - Math.pow(1 - x, 3); }
        function intensidad() { return (parseFloat(getComputedStyle(raiz).getPropertyValue("--intensidad")) || 0) / 100; }
        function tic() {
          var H = innerHeight, k = intensidad();
          if (fijo) {
            // a = cuántas fotos pasaron (0 a n-1). Cada panel se ubica respecto de a.
            var r = fijo.getBoundingClientRect(), a = lim(-r.top / (r.height - H)) * (paneles.length - 1), paginas = fijo.dataset.modo === "paginas";
            paneles.forEach(function (p, i) {
              var d = i - a, t, y;
              if (paginas) {
                // Como páginas: todos se mueven juntos; la imagen contrarresta el k% del movimiento.
                t = d * 100; y = -d * 100 * k;
              } else {
                // Apiladas: el que viene sube de abajo; el de abajo baja un poco mientras lo tapan.
                t = d > 0 ? Math.min(1, d) * 100 : 0; y = d > 0 ? -Math.min(1, d) * 30 * k : Math.min(1, -d) * 30 * k;
              }
              p.style.setProperty("--t", t.toFixed(2) + "%");
              p.querySelector(".sf__media").style.setProperty("--y", (y * p.offsetHeight / 100).toFixed(1) + "px");
              p.classList.toggle("en-vista", Math.abs(d) < .35);
            });
          }
          exps.forEach(function (x) {
            var r = x.getBoundingClientRect(), e = suave(lim(-r.top / (H * .8)));
            var p = x.querySelector(".sf__panel"); p.style.setProperty("--e", e.toFixed(4));
            p.querySelector(".sf__media").style.setProperty("--y", ((lim((H - r.top) / (r.height + H)) - .5) * 20 * k * p.offsetHeight / 100).toFixed(1) + "px");
            p.classList.toggle("en-vista", e > .85);
          });
        }
        var pedido = false;
        function pedir() { if (!pedido) { pedido = true; requestAnimationFrame(function () { pedido = false; tic(); }); } }
        if (quieto) paneles.forEach(function (p) { p.classList.add("en-vista"); });
        addEventListener("scroll", pedir, { passive: true }); addEventListener("resize", pedir); tic();
      }.toString() + ")();";
    }
  });
})();
