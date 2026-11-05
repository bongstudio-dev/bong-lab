/* Revelado con scroll: un párrafo que se enciende palabra por palabra mientras se scrollea,
   saliendo de la transparencia, el desenfoque y un leve giro. Todo atado al scroll: si se vuelve, vuelve. */
(function () {
  var TEXTO = "Cuando el campo crece, crece el país. Producimos el nitrógeno que nutre los cultivos con tecnología de vanguardia y cuidando la tierra que nos da vida.";

  Libreria.sumar({
    id: "revela-scroll", nombre: "Revelado con scroll", grupo: "Texto", alto: 680,
    bajada: "Un párrafo que aparece palabra por palabra con el scroll: cada una sale de la transparencia y el desenfoque, y el bloque se endereza.",
    nota: "Scrolleá dentro del escenario.",
    tamano: "media", previa: .36,
    controles: [
      { id: "txt", tipo: "texto", etiqueta: "Texto", def: TEXTO, desc: "El párrafo a revelar. Se parte en palabras." },
      { id: "desenfoque", tipo: "interr", etiqueta: "Desenfoque", def: true, aplica: { attr: "data-desenfoque" }, desc: "Cada palabra entra desde el desenfoque." },
      { id: "opacidad", tipo: "rango", etiqueta: "Opacidad inicial", min: 0, max: 1, paso: .05, def: .1, aplica: { var: "--sr-opacidad" }, desc: "Cuánto se ve cada palabra antes de encenderse." },
      { id: "giro", tipo: "rango", etiqueta: "Giro inicial", unidad: "°", min: 0, max: 10, paso: .5, def: 3, aplica: { var: "--sr-giro", unidad: "deg" }, desc: "Inclinación del bloque al entrar; llega a 0 cuando termina de pasar." },
      { id: "blur", tipo: "rango", etiqueta: "Fuerza del desenfoque", unidad: "px", min: 0, max: 15, paso: 1, def: 4, aplica: { var: "--sr-blur", unidad: "px" }, desc: "Desenfoque de las palabras que todavía no se encendieron." },
      { id: "paso", tipo: "rango", etiqueta: "Escalonado", min: .01, max: .15, paso: .01, def: .05, aplica: { var: "--sr-paso" }, desc: "Distancia entre una palabra y la siguiente. Más alto, más ola." },
      { id: "tam", tipo: "rango", etiqueta: "Tamaño", unidad: "px", min: 20, max: 96, def: 48, aplica: { var: "--tam", unidad: "px" }, desc: "Cuerpo del texto." },
      { id: "fondo", tipo: "seg", etiqueta: "Fondo", def: "tiza", aplica: { attr: "data-fondo" }, opciones: [["tiza", "Tiza"], ["azul", "Azul"]], desc: "Sobre tiza en tinta; sobre azul en tiza." }
    ],
    claves: [
      "Está atado al scroll: no corre solo. Si se vuelve para atrás, las palabras se apagan.",
      "Las palabras se encienden desde que el bloque asoma (20% arriba del borde de abajo) hasta que su final llega al borde de abajo. Si el bloque es corto, el tramo dura como mínimo el 40% del alto de pantalla.",
      "El giro va de la inclinación inicial a 0 en el mismo tramo, con el eje en el borde izquierdo.",
      "Solo mueve opacity, filter y transform. Usarlo una vez por página, en un manifiesto o frase de marca."
    ],
    accesibilidad: "El texto es texto real, partido en palabras: los lectores de pantalla lo leen entero. Con movimiento reducido se muestra completo y quieto.",
    css: function () {
      return [
        ".pf-sr { --tam: 48px; --sr-opacidad: .1; --sr-giro: 3deg; --sr-blur: 4px; --sr-paso: .05; overflow-x: clip; font: 400 var(--texto-cuerpo)/1.5 var(--f-body); }",
        ".pf-sr[data-fondo=\"tiza\"] { background: var(--bg); color: var(--ink); }",
        ".pf-sr[data-fondo=\"azul\"] { background: var(--azul); color: var(--tiza); }",
        ".pf-sr__aire { display: flex; align-items: center; justify-content: center; height: 100vh; font-size: var(--texto-chico); opacity: .55; }",
        ".pf-sr__aire--fin { height: 60vh; }",
        ".pf-sr__bloque { padding: 0 clamp(20px, 6vw, 96px); transform-origin: 0% 50%; will-change: transform; }",
        ".pf-sr__t { margin: 0; max-width: 24ch; font: 500 var(--tam)/1.3 var(--f-display); letter-spacing: -.025em; text-wrap: pretty; }",
        ".pf-sr__p { display: inline-block; will-change: opacity, filter; }",
        "@media (prefers-reduced-motion: reduce) { .pf-sr__bloque, .pf-sr__p { transform: none !important; opacity: 1 !important; filter: none !important; } }"
      ].join("\n");
    },
    html: function (s) {
      var palabras = String(s.txt || TEXTO).trim().split(/\s+/).map(function (w) {
        return '<span class="pf-sr__p">' + w.replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }) + '</span>';
      }).join(" ");
      return '<section class="pf-sr" data-c="revela-scroll">\n' +
        '  <div class="pf-sr__aire" aria-hidden="true">Scrolleá</div>\n' +
        '  <div class="pf-sr__bloque">\n    <p class="pf-sr__t">' + palabras + '</p>\n  </div>\n' +
        '  <div class="pf-sr__aire pf-sr__aire--fin" aria-hidden="true"></div>\n</section>';
    },
    js: function () {
      return [
        "(function () {",
        "  var raiz = document.querySelector('.pf-sr'), bloque = raiz.querySelector('.pf-sr__bloque');",
        "  var palabras = [].slice.call(raiz.querySelectorAll('.pf-sr__p'));",
        "  var quieto = matchMedia('(prefers-reduced-motion: reduce)');",
        "  function lim(x) { return Math.min(1, Math.max(0, x)); }",
        "  // Los ajustes viven en variables CSS de .pf-sr: se pueden cambiar en vivo sin tocar el script.",
        "  function leer(n, d) { var v = parseFloat(getComputedStyle(raiz).getPropertyValue(n)); return isNaN(v) ? d : v; }",
        "  function tic() {",
        "    if (quieto.matches) return;",
        "    var H = innerHeight, r = bloque.getBoundingClientRect();",
        "    var base = leer('--sr-opacidad', .1), giro = leer('--sr-giro', 3), blur = leer('--sr-blur', 4), paso = leer('--sr-paso', .05);",
        "    var conBlur = raiz.getAttribute('data-desenfoque') !== 'false';",
        "    // Giro: de la inclinación inicial a 0 entre que el bloque asoma abajo y su final llega al borde de abajo.",
        "    // Con un bloque corto los tramos se estiran: el de las palabras dura como mínimo el 40% del alto de pantalla.",
        "    var pg = lim((H - r.top) / Math.max(r.height, H * .6));",
        "    bloque.style.transform = 'rotate(' + (giro * (1 - pg)).toFixed(3) + 'deg)';",
        "    // Palabras: arrancan con el bloque al 20% sobre el borde de abajo y terminan con su final en el borde.",
        "    // Cada una dura 0,5 del tramo y la siguiente arranca 'paso' después.",
        "    var pw = lim((H * .8 - r.top) / Math.max(r.height - H * .2, H * .4));",
        "    var n = palabras.length, D = .5, T = D + paso * (n - 1);",
        "    palabras.forEach(function (w, i) {",
        "      var q = lim((pw * T - paso * i) / D);",
        "      w.style.opacity = (base + (1 - base) * q).toFixed(3);",
        "      w.style.filter = conBlur && q < 1 ? 'blur(' + (blur * (1 - q)).toFixed(2) + 'px)' : '';",
        "    });",
        "  }",
        "  var pedido = false;",
        "  function pedir() { if (!pedido) { pedido = true; requestAnimationFrame(function () { pedido = false; tic(); }); } }",
        "  addEventListener('scroll', pedir, { passive: true });",
        "  addEventListener('resize', pedir);",
        "  // Si cambian los ajustes (atributos o variables), se vuelve a dibujar en el acto.",
        "  new MutationObserver(pedir).observe(raiz, { attributes: true });",
        "  tic();",
        "})();"
      ].join("\n");
    }
  });
})();
