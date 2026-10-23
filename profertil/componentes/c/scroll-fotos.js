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
    id: "scroll-fotos", nombre: "Fotos a pantalla completa", grupo: "Scroll", alto: 680, base: ["etiqueta"],
    bajada: "Fotos a todo el ancho que se mueven con el scroll, con la etiqueta y el texto arriba, que entran por líneas.",
    nota: "Scrolleá dentro del escenario. Fotos y textos de ejemplo.",
    variantes: [
      ["paginas", "Como páginas", "La sección queda fija y las fotos pasan hacia arriba como páginas; cada imagen va más lenta que su panel. La de la referencia."],
      ["apiladas", "Apiladas", "Cada foto sube como una tarjeta y tapa a la anterior, que se achica y se oscurece. El texto va adentro de cada tarjeta, arriba, y viaja con ella."],
      ["expande", "Se expande", "La foto arranca como tarjeta con aire y radio y crece hasta el borde. Al irse vuelve a achicarse y se oscurece mientras sube la siguiente."]
    ],
    tamano: "ancha", previa: .22,
    claves: ["Como páginas: la etiqueta, el título y la bajada quedan fijos al medio a la izquierda; cuando entra la foto siguiente, el grupo de texto se va hacia arriba y entra el de la foto nueva. El que salió queda oculto (visibility) para que no asome ningún resto de letra.", "Apiladas: el texto vive adentro de cada tarjeta, arriba a la izquierda, y sube con ella.", "Se expande: la tarjeta crece mientras todavía está subiendo (entra rápido); al final vuelve a achicarse, se oscurece y el texto sale hacia arriba mientras la siguiente la tapa.", "La etiqueta es la del sistema: badge con la forma de la categoría, rótulo blanco.", "El texto entra por líneas (cortadas a mano) cuando el panel queda en pantalla.", "Como páginas: el panel se mueve el 100% y su imagen solo el 20%, por eso parece que la foto se queda y el marco se corre.", "Todo se calcula en un solo requestAnimationFrame por scroll y solo mueve transform y clip-path."],
    accesibilidad: "Con movimiento reducido las fotos quedan quietas y el texto aparece sin animar. Las fotos de demo no llevan texto alternativo: en el sitio lo necesitan.",
    controles: [
      { id: "intensidad", tipo: "rango", etiqueta: "Intensidad del parallax", unidad: "%", min: 0, max: 100, def: 80, aplica: { var: "--intensidad" }, desc: "Cuánto se queda la imagen mientras su panel se mueve (80 = va al 20% de la velocidad)." },
      { id: "oscuro", tipo: "rango", etiqueta: "Oscurecido de la foto", unidad: "%", min: 0, max: 70, def: 40, aplica: { var: "--oscuro" }, desc: "Degradé de arriba para que el texto se lea." },
      { id: "radio", tipo: "rango", etiqueta: "Radio de la tarjeta", solo: ["apiladas", "expande"], unidad: "px", min: 0, max: 48, def: 26, aplica: { var: "--radio", unidad: "px" }, desc: "Radio de la tarjeta mientras entra (Apiladas) o antes de expandirse (Se expande)." },
      { id: "etiqueta", tipo: "interr", etiqueta: "Etiqueta de la categoría", def: true, aplica: { attr: "data-etiqueta" }, desc: "La Etiqueta del sistema arriba del título." }
    ],
    css: function () {
      return [
        ".pf-sf { --intensidad: 80; --oscuro: 40; --radio: var(--radio-tarjeta); --curva: cubic-bezier(.22, 1, .36, 1);",
        "  font: 400 var(--texto-cuerpo)/1.5 var(--f-body); color: var(--tiza); }",
        ".pf-sf__intro, .pf-sf__fin { padding: 22vh clamp(20px, 5vw, 64px); color: var(--ink); }",
        ".pf-sf__intro h2, .pf-sf__fin h2 { margin: 0; font: 500 var(--texto-titulo)/1.04 var(--f-display); letter-spacing: -.03em; max-width: 16ch; }",
        ".pf-sf__panel { overflow: hidden; background: var(--ink); }",
        ".pf-sf__media { position: absolute; inset: 0; overflow: hidden; }",
        "/* La imagen es más alta que su panel en la misma medida en que se corre: así nunca queda una franja vacía. */",
        ".pf-sf__media img { position: absolute; left: 0; top: calc(var(--intensidad) * -.5%); width: 100%; height: calc(100% + var(--intensidad) * 1%); object-fit: cover; transform: translate3d(0, var(--y, 0px), 0); will-change: transform; }",
        ".pf-sf__media::after { content: \"\"; position: absolute; inset: 0; background: linear-gradient(to bottom, color-mix(in srgb, var(--ink) calc(var(--oscuro) / 100 * 100%), transparent), color-mix(in srgb, var(--ink) calc(var(--oscuro) / 400 * 100%), transparent) 55%, transparent); }",
        "/* El texto queda fijo al medio a la izquierda de la pantalla. */",
        ".pf-sf__txt { position: absolute; left: clamp(20px, 5vw, 64px); right: clamp(20px, 5vw, 64px); top: 50%; transform: translateY(-50%); display: grid; justify-items: start; gap: 16px; max-width: 760px; }",
        "/* Como páginas y Apiladas: los grupos de texto viven en una capa propia, encima de las fotos, y se reemplazan uno por otro. */",
        ".pf-sf__textos { position: absolute; inset: 0; z-index: 2; pointer-events: none; }",
        ".pf-sf__txt.pf-fue .pf-sf__linea > span, .pf-sf__panel.pf-fue .pf-sf__linea > span { transform: translateY(-130%); transition-delay: calc(var(--k, 0) * 40ms); }",
        ".pf-sf__txt.pf-fue .pf-etiqueta, .pf-sf__panel.pf-fue .pf-etiqueta { opacity: 0; transform: translateY(-8px); }",
        "/* Fuera de turno, el grupo se oculta del todo cuando termina de salir: así no asoma ningún resto de las letras (descendentes, tildes). */",
        ".pf-sf__textos .pf-sf__txt { visibility: hidden; transition: visibility 0s linear 1.1s; }",
        ".pf-sf__textos .pf-sf__txt.pf-en-vista { visibility: visible; transition-delay: 0s; }",
        ".pf-sf[data-etiqueta=\"false\"] .pf-etiqueta { display: none; }",
        ".pf-sf__txt h3 { margin: 0; font: 500 var(--texto-display)/1 var(--f-display); letter-spacing: -.035em; }",
        ".pf-sf__txt p { margin: 0; max-width: 40ch; font-size: var(--texto-destacado); opacity: .92; }",
        "/* La ventana de cada línea deja lugar para tildes y descendentes (padding) sin cambiar el interlineado (margen negativo). */",
        ".pf-sf__linea { display: block; overflow: clip; padding: .12em 0 .2em; margin: -.12em 0 -.2em; }",
        ".pf-sf__linea > span { display: block; transform: translateY(130%); transition: transform .9s var(--curva); transition-delay: calc(var(--k, 0) * 70ms); }",
        ".pf-sf__txt .pf-etiqueta { opacity: 0; transform: translateY(8px); transition: opacity .5s var(--curva), transform .7s var(--curva); }",
        ".pf-sf .pf-en-vista .pf-sf__linea > span, .pf-sf .pf-en-vista .pf-etiqueta { transform: none; opacity: 1; }",
        "",
        "/* Como páginas y Apiladas: la sección queda fija y los paneles se mueven adentro. */",
        ".pf-sf__fijo { position: relative; }",
        ".pf-sf__fijo-in { position: sticky; top: 0; height: 100vh; overflow: hidden; }",
        ".pf-sf__fijo .pf-sf__panel { position: absolute; inset: 0; transform: translate3d(0, var(--t, 100%), 0); will-change: transform; }",
        ".pf-sf__fijo .pf-sf__panel:first-child { --t: 0%; }",
        "",
        "/* Apiladas: la que sube es una tarjeta con radio arriba que se aplana al llegar; la de abajo se achica y se oscurece. El texto va adentro, arriba. */",
        ".pf-sf__fijo[data-modo=\"apiladas\"] .pf-sf__panel { transform: translate3d(0, var(--t, 100%), 0) scale(calc(1 - var(--c, 0) * .06)); transform-origin: 50% 0;",
        "  border-radius: calc((1 - var(--l, 1)) * var(--radio)) calc((1 - var(--l, 1)) * var(--radio)) 0 0; box-shadow: 0 -24px 60px -30px color-mix(in srgb, var(--ink) 55%, transparent); }",
        ".pf-sf__fijo[data-modo=\"apiladas\"] .pf-sf__panel::after { content: \"\"; position: absolute; inset: 0; z-index: 3; background: var(--ink); opacity: calc(var(--c, 0) * .55); pointer-events: none; }",
        ".pf-sf__txt--arriba { top: clamp(56px, 11vh, 120px); transform: none; z-index: 2; }",
        "",
        "/* Se expande: la foto arranca como tarjeta con aire y radio, y crece hasta el borde. */",
        "/* --f es cuánto le falta para el borde: 1 tarjeta, 0 pantalla entera. Entra rápido, se queda y al salir vuelve a la mitad. */",
        ".pf-sf__exp { position: relative; height: 220vh; }",
        ".pf-sf__exp-in { position: sticky; top: 0; height: 100vh; }",
        ".pf-sf__exp .pf-sf__panel { position: relative; width: 100%; height: 100%; transform: scale(calc(1 - var(--o, 0) * .06)); transform-origin: 50% 0;",
        "  clip-path: inset(calc(var(--f, 1) * 14vh) calc(var(--f, 1) * 16vw) round min(var(--radio), calc(var(--f, 1) * var(--radio) * 3))); }",
        ".pf-sf__exp .pf-sf__panel::after { content: \"\"; position: absolute; inset: 0; z-index: 3; background: var(--ink); opacity: calc(var(--o, 0) * .5); pointer-events: none; }",
        "/* La siguiente arranca 60vh antes: sube por encima de la anterior mientras esta se achica. */",
        ".pf-sf__exp + .pf-sf__exp { margin-top: -60vh; }",
        "",
        "@media (prefers-reduced-motion: reduce) { .pf-sf__media img, .pf-sf__panel { transform: none !important; } .pf-sf__panel::after { display: none; } .pf-sf__exp .pf-sf__panel { clip-path: none; } .pf-sf__linea > span, .pf-sf__txt .pf-etiqueta { transform: none !important; opacity: 1 !important; transition: none; } }"
      ].join("\n");
    },
    html: function (s) {
      var v = s.variante;
      function lineas(t) { return t.split(" | ").map(function (l, k) { return '<span class="pf-sf__linea"><span style="--k:' + k + '">' + l + '</span></span>'; }).join(""); }
      function panel(p, arriba) {
        return '<article class="pf-sf__panel">\n        <div class="pf-sf__media"><img src="../novedades/fotos/demo-' + p[3] + '.webp" alt=""></div>\n' +
          '        <div class="pf-sf__txt' + (arriba ? ' pf-sf__txt--arriba' : '') + '">' + SIS.etiqueta(p[0]) + '<h3>' + lineas(p[1]) + '</h3><p>' + lineas(p[2]) + '</p></div>\n      </article>';
      }
      var h = '<section class="pf-sf" data-c="scroll-fotos">\n  <div class="pf-sf__intro"><h2>Lo que hacemos, de cerca</h2></div>\n';
      // Como páginas: las fotos van solas y los textos en una capa aparte, fija.
      function soloFoto(p) { return '<article class="pf-sf__panel">\n        <div class="pf-sf__media"><img src="../novedades/fotos/demo-' + p[3] + '.webp" alt=""></div>\n      </article>'; }
      function texto(p) { return '<div class="pf-sf__txt">' + SIS.etiqueta(p[0]) + '<h3>' + lineas(p[1]) + '</h3><p>' + lineas(p[2]) + '</p></div>'; }
      // Como páginas: el texto en una capa fija aparte. Apiladas: el texto adentro de cada tarjeta, arriba.
      if (v === "paginas") h += '  <div class="pf-sf__fijo" data-modo="paginas" style="height: ' + (PANELES.length * 100) + 'vh">\n    <div class="pf-sf__fijo-in">\n      ' + PANELES.map(soloFoto).join("\n      ") +
        '\n      <div class="pf-sf__textos">\n        ' + PANELES.map(texto).join("\n        ") + '\n      </div>\n    </div>\n  </div>\n';
      if (v === "apiladas") h += '  <div class="pf-sf__fijo" data-modo="apiladas" style="height: ' + (PANELES.length * 100) + 'vh">\n    <div class="pf-sf__fijo-in">\n      ' + PANELES.map(function (p) { return panel(p, true); }).join("\n      ") + '\n    </div>\n  </div>\n';
      if (v === "expande") h += PANELES.map(function (p) { return '  <div class="pf-sf__exp">\n    <div class="pf-sf__exp-in">\n      ' + panel(p) + '\n    </div>\n  </div>\n'; }).join("");
      return h + '  <div class="pf-sf__fin"><h2>Sigue el resto de la página</h2></div>\n</section>';
    },
    js: function () {
      return "(" + function () {
        var raiz = document.querySelector(".pf-sf"), quieto = matchMedia("(prefers-reduced-motion: reduce)").matches;
        var fijo = raiz.querySelector(".pf-sf__fijo"), exps = [].slice.call(raiz.querySelectorAll(".pf-sf__exp"));
        var textos = [].slice.call(raiz.querySelectorAll(".pf-sf__textos .pf-sf__txt"));
        var paneles = [].slice.call(raiz.querySelectorAll(".pf-sf__panel"));
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
                // Apiladas: el que viene sube de abajo; el de abajo baja un poco, se achica y se oscurece mientras lo tapan (--c).
                t = d > 0 ? Math.min(1, d) * 100 : 0; y = d > 0 ? -Math.min(1, d) * 30 * k : Math.min(1, -d) * 30 * k;
                p.style.setProperty("--l", (1 - lim(d)).toFixed(4));
                p.style.setProperty("--c", lim(-d).toFixed(4));
                if (!quieto) p.classList.toggle("pf-en-vista", d < .5);
              }
              p.style.setProperty("--t", t.toFixed(2) + "%");
              p.querySelector(".pf-sf__media").style.setProperty("--y", (y * p.offsetHeight / 100).toFixed(1) + "px");
            });
            // El texto cambia cuando la foto nueva ya ocupa más de la mitad: el que sale se va hacia arriba.
            var activo = Math.round(a);
            textos.forEach(function (t, i) { t.classList.toggle("pf-en-vista", i === activo); t.classList.toggle("pf-fue", i < activo); });
          }
          exps.forEach(function (x) {
            // y: cuánto se scrolleó dentro del tramo; queda fija de 0 a fin.
            var r = x.getBoundingClientRect(), y = -r.top, fin = r.height - H;
            // Entra: crece desde que su borde de arriba pasa el 35% de la pantalla, en 0,6 pantallas (antes 0,8 y recién arriba de todo).
            var e = suave(lim((y + H * .35) / (H * .6)));
            // Sale: en las últimas 0,6 pantallas fijas vuelve a la mitad de la tarjeta, se achica y se oscurece.
            var o = suave(lim((y - (fin - H * .6)) / (H * .6)));
            var p = x.querySelector(".pf-sf__panel");
            p.style.setProperty("--f", Math.max(1 - e, o * .5).toFixed(4));
            p.style.setProperty("--o", o.toFixed(4));
            p.querySelector(".pf-sf__media").style.setProperty("--y", ((lim((H - r.top) / (r.height + H)) - .5) * 20 * k * p.offsetHeight / 100).toFixed(1) + "px");
            if (!quieto) { p.classList.toggle("pf-en-vista", e > .7 && o < .3); p.classList.toggle("pf-fue", o >= .3); }
          });
        }
        var pedido = false;
        function pedir() { if (!pedido) { pedido = true; requestAnimationFrame(function () { pedido = false; tic(); }); } }
        if (quieto) paneles.concat(textos).forEach(function (p) { p.classList.add("pf-en-vista"); });
        addEventListener("scroll", pedir, { passive: true }); addEventListener("resize", pedir); tic();
      }.toString() + ")();";
    }
  });
})();
