/* Lista de valores: palabras grandes, la activa se enciende y al costado va su texto. */
(function () {
  var VALORES = [
    ["Seguridad", "Cuidamos a las personas antes que cualquier otro resultado. Ninguna tarea es tan urgente como para hacerla de forma insegura."],
    ["Integridad", "Hacemos lo que decimos. Actuamos con transparencia frente a la comunidad, los clientes y los accionistas."],
    ["Compromiso", "Con el campo argentino y con Bahía Blanca: producimos cerca de quienes usan lo que hacemos."],
    ["Innovación", "Buscamos mejores formas de nutrir los suelos, con datos, ensayos y trabajo conjunto con los productores."],
    ["Sustentabilidad", "Medimos y reducimos nuestro impacto, y lo contamos con datos verificables cada año."]
  ];
  var ACENTOS = { azul: "#003DA5", verde: "#2D8035", naranja: "#E57F19", tinta: "#0A1E4A" };

  Libreria.sumar({
    id: "lista-valores", nombre: "Lista de valores", grupo: "Listas", alto: 680,
    bajada: "Palabras grandes en lista: la activa se enciende, al costado su texto y una marca que dice dónde estás.",
    nota: "Scrolleá dentro del escenario. Los valores y sus textos son de ejemplo.",
    variantes: [["palabras", "Palabras fijas"], ["filas", "Filas que se abren"], ["columna", "Índice al costado"]],
    controles: [
      { id: "acento", tipo: "seg", etiqueta: "Color activo", def: "tinta", aplica: { attr: "data-acento" }, opciones: [["tinta", "Tinta"], ["azul", "Azul"], ["verde", "Verde"], ["naranja", "Naranja"]] },
      { id: "tam", tipo: "rango", etiqueta: "Tamaño de la palabra", unidad: "px", min: 40, max: 160, def: 96, aplica: { var: "--tam", unidad: "px" } },
      { id: "apagado", tipo: "rango", etiqueta: "Opacidad de las apagadas", unidad: "", min: 0.05, max: 0.5, paso: 0.01, def: 0.15, aplica: { var: "--apagado" } },
      { id: "regla", tipo: "interr", etiqueta: "Indicador de posición", def: true, aplica: { attr: "data-regla" } }
    ],
    css: function () {
      return [
        ".lv { --tam: 96px; --apagado: .15; --curva: cubic-bezier(.22, 1, .36, 1); --f-d: \"Familjen Grotesk\", \"Helvetica Neue\", Arial, sans-serif;",
        "  font: 400 16px/1.5 \"DM Sans\", \"Helvetica Neue\", Arial, sans-serif; color: #0A1E4A; }",
        Object.keys(ACENTOS).map(function (k) { return '.lv[data-acento="' + k + '"] { --acento: ' + ACENTOS[k] + '; }'; }).join("\n"),
        ".lv__intro, .lv__fin { padding: 18vh clamp(20px, 5vw, 64px); }",
        ".lv__intro h2, .lv__fin h2 { margin: 0; font: 500 clamp(28px, 4vw, 48px)/1.05 var(--f-d); letter-spacing: -.03em; max-width: 18ch; }",
        ".lv__palabra { font: 500 min(var(--tam), 8.4vw)/1.02 var(--f-d); white-space: nowrap; letter-spacing: -.045em; color: var(--acento); opacity: var(--apagado); transition: opacity .5s var(--curva), color .5s var(--curva); }",
        ".lv .activa .lv__palabra, .lv__palabra.activa { opacity: 1; }",
        ".lv[data-regla=\"false\"] .lv__regla, .lv[data-regla=\"false\"] .lv__barra, .lv[data-regla=\"false\"] .lv__marca { display: none; }",
        "",
        "/* Palabras fijas: la sección queda quieta y el scroll va encendiendo una palabra por vez. */",
        ".lv__pin { position: relative; }",
        ".lv__pin-in { position: sticky; top: 0; height: 100vh; display: grid; grid-template-columns: max-content minmax(220px, 1fr); align-items: center; gap: clamp(24px, 4vw, 64px); padding: 0 clamp(48px, 8vw, 140px); }",
        ".lv__pin-in ol { list-style: none; margin: 0; padding: 0; }",
        ".lv__textos { position: relative; min-height: 8em; }",
        ".lv__textos p { position: absolute; inset: 0 auto auto 0; margin: 0; max-width: 34ch; font-size: 17px; opacity: 0; transform: translateY(12px); transition: opacity .45s var(--curva), transform .6s var(--curva); }",
        ".lv__textos p.activa { opacity: 1; transform: none; }",
        "/* La regla: rayitas a los dos costados y una marca que baja con el scroll. */",
        ".lv__regla { position: absolute; top: 12vh; bottom: 12vh; width: 14px; background: repeating-linear-gradient(to bottom, rgba(10, 30, 74, .28) 0 1px, transparent 1px 9px); }",
        ".lv__regla--izq { left: clamp(14px, 2.4vw, 32px); } .lv__regla--der { right: clamp(14px, 2.4vw, 32px); }",
        ".lv__regla::after { content: \"\"; position: absolute; left: -4px; width: 22px; height: 2px; top: calc(var(--p, 0) * 100%); background: var(--acento); transition: top .12s linear; }",
        "",
        "/* Filas que se abren: cada valor es una fila; la que cruza el centro se abre. */",
        ".lv__filas { position: relative; list-style: none; margin: 0; padding: 0 clamp(20px, 5vw, 64px) 0 clamp(48px, 8vw, 120px); }",
        ".lv__fila { display: grid; grid-template-columns: 3.2em minmax(0, 1fr); column-gap: 16px; padding: 22px 0; border-top: 1px solid rgba(10, 30, 74, .12); }",
        ".lv__fila:last-child { border-bottom: 1px solid rgba(10, 30, 74, .12); }",
        ".lv__num { padding-top: .6em; font-size: 13px; color: #737D96; font-variant-numeric: tabular-nums; }",
        ".lv__fila .lv__palabra { font-size: min(calc(var(--tam) * .78), 7vw); }",
        ".lv__abre { grid-column: 2; display: grid; grid-template-rows: 0fr; transition: grid-template-rows .6s var(--curva); }",
        ".lv__abre > p { overflow: hidden; margin: 0; max-width: 46ch; font-size: 17px; color: #44506E; opacity: 0; transition: opacity .4s var(--curva); }",
        ".lv__fila.activa .lv__abre { grid-template-rows: 1fr; }",
        ".lv__fila.activa .lv__abre > p { opacity: 1; padding-top: 12px; transition-delay: .1s; }",
        ".lv__barra { position: absolute; left: clamp(20px, 3.4vw, 48px); top: 0; bottom: 0; width: 2px; background: rgba(10, 30, 74, .1); }",
        ".lv__barra::after { content: \"\"; position: absolute; inset: 0 0 auto; height: calc(var(--p, 0) * 100%); background: var(--acento); }",
        "",
        "/* Índice al costado: la lista chica queda fija a la izquierda y una marca señala la activa. */",
        ".lv__dos { display: grid; grid-template-columns: minmax(180px, 1fr) minmax(0, 2.4fr); gap: 48px; padding: 0 clamp(20px, 5vw, 64px); }",
        ".lv__indice { position: sticky; top: 0; height: 100vh; display: flex; align-items: center; }",
        ".lv__indice ol { position: relative; list-style: none; margin: 0; padding: 0 0 0 20px; display: grid; gap: 4px; }",
        ".lv__indice li { font: 500 17px/1.6 var(--f-d); letter-spacing: -.01em; color: var(--acento); opacity: .4; transition: opacity .4s var(--curva); }",
        ".lv__indice li.activa { opacity: 1; }",
        ".lv__marca { position: absolute; left: 0; top: 0; width: 3px; height: 1.6em; border-radius: 3px; background: var(--acento); font-size: 17px; transform: translateY(calc(var(--i, 0) * (100% + 4px))); transition: transform .55s var(--curva); }",
        ".lv__bloque { min-height: 90vh; display: flex; flex-direction: column; justify-content: center; gap: 18px; padding: 10vh 0; }",
        ".lv__bloque .lv__palabra { opacity: 1; }",
        ".lv__bloque p { margin: 0; max-width: 44ch; font-size: 18px; color: #44506E; }",
        ".lv__bloque img { width: 100%; max-width: 640px; aspect-ratio: 16 / 9; object-fit: cover; border-radius: 26px; }",
        "",
        "@media (max-width: 760px) {",
        "  .lv { --tam: 56px !important; }",
        "  .lv__pin-in { grid-template-columns: 1fr; align-content: center; gap: 24px; padding: 0 40px; }",
        "  .lv__textos { min-height: 7.5em; }",
        "  .lv__dos { grid-template-columns: 1fr; } .lv__indice { position: sticky; top: 0; height: auto; z-index: 2; padding: 12px 0; background: #E9E7D6; }",
        "  .lv__indice ol { grid-auto-flow: column; overflow-x: auto; gap: 16px; padding: 0 0 6px; } .lv__marca { display: none; }",
        "}",
        "@media (prefers-reduced-motion: reduce) { .lv * { transition-duration: .01ms !important; } }"
      ].join("\n");
    },
    html: function (s) {
      var v = s.variante, h = '<section class="lv" data-c="lista-valores">\n  <div class="lv__intro"><h2>Lo que nos guía todos los días</h2></div>\n';
      if (v === "palabras") {
        h += '  <div class="lv__pin" style="height: ' + (VALORES.length * 70 + 100) + 'vh">\n    <div class="lv__pin-in">\n' +
          '      <span class="lv__regla lv__regla--izq" aria-hidden="true"></span><span class="lv__regla lv__regla--der" aria-hidden="true"></span>\n' +
          '      <ol>' + VALORES.map(function (x, i) { return '<li class="lv__palabra' + (i ? '' : ' activa') + '">' + x[0] + '</li>'; }).join("") + '</ol>\n' +
          '      <div class="lv__textos">' + VALORES.map(function (x, i) { return '<p' + (i ? '' : ' class="activa"') + '>' + x[1] + '</p>'; }).join("") + '</div>\n' +
          '    </div>\n  </div>\n';
      } else if (v === "filas") {
        h += '  <ol class="lv__filas">\n    <span class="lv__barra" aria-hidden="true"></span>\n' + VALORES.map(function (x, i) {
          return '    <li class="lv__fila"><span class="lv__num">0' + (i + 1) + '</span><span class="lv__palabra">' + x[0] + '</span><div class="lv__abre"><p>' + x[1] + '</p></div></li>';
        }).join("\n") + '\n  </ol>\n';
      } else {
        h += '  <div class="lv__dos">\n    <nav class="lv__indice"><ol><span class="lv__marca" aria-hidden="true"></span>' + VALORES.map(function (x, i) { return '<li' + (i ? '' : ' class="activa"') + '>' + x[0] + '</li>'; }).join("") + '</ol></nav>\n' +
          '    <div>' + VALORES.map(function (x, i) {
            return '\n      <article class="lv__bloque"><h3 class="lv__palabra" style="margin:0">' + x[0] + '</h3><p>' + x[1] + '</p><img src="../novedades/fotos/demo-' + (i + 1) + '.webp" alt=""></article>';
          }).join("") + '\n    </div>\n  </div>\n';
      }
      return h + '  <div class="lv__fin"><h2>Sigue el resto de la página</h2></div>\n</section>';
    },
    js: function (s) {
      return [
        "(function () {",
        "  var raiz = document.querySelector('.lv');",
        "  function marcar(lista, i) { lista.forEach(function (e, j) { e.classList.toggle('activa', i === j); }); }",
        "  var pin = raiz.querySelector('.lv__pin'), filas = raiz.querySelector('.lv__filas'), dos = raiz.querySelector('.lv__dos');",
        "  if (pin) {",
        "    // Palabras fijas: el avance dentro de la sección decide qué palabra se enciende.",
        "    var pals = [].slice.call(pin.querySelectorAll('.lv__palabra')), txts = [].slice.call(pin.querySelectorAll('.lv__textos p')), ultimo = -1;",
        "    var tic = function () {",
        "      var r = pin.getBoundingClientRect(), p = Math.min(1, Math.max(0, -r.top / (r.height - innerHeight)));",
        "      pin.style.setProperty('--p', p.toFixed(4));",
        "      var i = Math.min(pals.length - 1, Math.floor(p * pals.length));",
        "      if (i !== ultimo) { ultimo = i; marcar(pals, i); marcar(txts, i); }",
        "    };",
        "    addEventListener('scroll', tic, { passive: true }); addEventListener('resize', tic); tic();",
        "  }",
        "  if (filas) {",
        "    // Filas: se abre la que cruza la mitad de la pantalla; la barra avanza con la lista.",
        "    var fs = [].slice.call(filas.querySelectorAll('.lv__fila'));",
        "    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) marcar(fs, fs.indexOf(e.target)); }); }, { rootMargin: '-45% 0px -55% 0px' });",
        "    fs.forEach(function (f) { io.observe(f); }); marcar(fs, 0);",
        "    var tic2 = function () { var r = filas.getBoundingClientRect(), p = Math.min(1, Math.max(0, (innerHeight / 2 - r.top) / r.height)); filas.style.setProperty('--p', p.toFixed(4)); };",
        "    addEventListener('scroll', tic2, { passive: true }); tic2();",
        "  }",
        "  if (dos) {",
        "    // Índice al costado: el bloque que cruza la mitad marca su nombre en el índice.",
        "    var items = [].slice.call(dos.querySelectorAll('.lv__indice li')), bloques = [].slice.call(dos.querySelectorAll('.lv__bloque')), marca = dos.querySelector('.lv__marca');",
        "    var io2 = new IntersectionObserver(function (es) { es.forEach(function (e) { if (!e.isIntersecting) return; var i = bloques.indexOf(e.target); marcar(items, i); marca.style.setProperty('--i', i); }); }, { rootMargin: '-50% 0px -50% 0px' });",
        "    bloques.forEach(function (b) { io2.observe(b); });",
        "    items.forEach(function (it, i) { it.style.cursor = 'pointer'; it.addEventListener('click', function () { bloques[i].scrollIntoView({ behavior: 'smooth', block: 'center' }); }); });",
        "  }",
        "})();"
      ].join("\n");
    }
  });
})();
