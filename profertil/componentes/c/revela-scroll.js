/* Revelado con scroll: un texto que aparece por partes (palabras, letras o líneas) atado al scroll
   o al entrar en pantalla. Cuatro presets y todos sus valores ajustables. */
(function () {
  var TEXTO = "Cuando el campo crece, crece el país. Producimos el nitrógeno que nutre los cultivos con tecnología de vanguardia y cuidando la tierra que nos da vida.";
  var COLORES = { naranja: "var(--naranja)", azul: "var(--azul)", verde: "var(--verde)", celeste: "var(--celeste)", amarillo: "var(--amarillo)" };

  // Cada preset fija estos valores; los que no nombra vuelven a los de fábrica.
  var REVELADO = { resaltar: false, modo: "scroll", partir: "palabras", efecto: "aparece", paso: .05, duracion: .8, suavizado: 0, opacidad: .1, giro: 3, desplazamiento: 0, desenfoque: true, blur: 4 };

  function escapar(t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  Libreria.sumar({
    id: "revela-scroll", nombre: "Revelado con scroll", grupo: "Texto", alto: 680,
    bajada: "Un texto que aparece por partes, atado al scroll o al entrar en pantalla: de a palabras, letras o líneas, con cuatro efectos.",
    nota: "Scrolleá dentro del escenario. En modo Al entrar, Repetir lo vuelve a disparar.",
    tamano: "media", previa: .36, base: ["oculto"],
    variantes: [
      ["revelado", "Revelado", "Cada palabra sale de la transparencia y el desenfoque mientras se scrollea; el bloque entra inclinado y se endereza.", REVELADO],
      ["resaltado", "Resaltado", "Las palabras se encienden de a una con un color de acento que después se apaga al color del texto.", { resaltar: true, paso: .2, opacidad: .15, giro: 0, desenfoque: false }],
      ["sube", "Sube", "Al entrar en pantalla, cada línea sube desde atrás de su propia base, una después de la otra.", { modo: "entrar", partir: "lineas", efecto: "sube", paso: .12, duracion: .9, opacidad: 0, giro: 0, desenfoque: false }],
      ["voltea", "Voltea", "Letra por letra, cada una se para desde acostada siguiendo el scroll, con un leve suavizado.", { partir: "letras", efecto: "voltea", paso: .012, suavizado: .3, opacidad: 0, giro: 0, desenfoque: false }]
    ],
    controles: [
      { id: "txt", tipo: "texto", etiqueta: "Texto", def: TEXTO, desc: "El texto a revelar." },
      { id: "modo", tipo: "seg", etiqueta: "Modo", def: "scroll", opciones: [["scroll", "Scroll"], ["entrar", "Al entrar"]], desc: "Scroll: sigue la posición y vuelve si se vuelve. Al entrar: corre una vez cuando el texto aparece." },
      { id: "partir", tipo: "seg", etiqueta: "Partir por", def: "palabras", opciones: [["palabras", "Palabras"], ["letras", "Letras"], ["lineas", "Líneas"]], desc: "Qué es cada paso del revelado. Líneas agrupa las palabras de cada renglón y se rearma al cambiar el ancho." },
      { id: "efecto", tipo: "seg", etiqueta: "Efecto", def: "aparece", opciones: [["aparece", "Aparece"], ["sube", "Sube"], ["voltea", "Voltea"], ["crece", "Crece"]], desc: "Aparece: se aclara en el lugar. Sube: sale desde atrás de su base. Voltea: se para desde acostada. Crece: aparece desde chica." },
      { id: "resaltar", tipo: "interr", etiqueta: "Resaltado", def: false, desc: "Cada parte se enciende con el color de acento mientras aparece y después vuelve al color del texto." },
      { id: "color", tipo: "seg", etiqueta: "Color del resaltado", def: "naranja", opciones: [["naranja", "Naranja"], ["azul", "Azul"], ["verde", "Verde"], ["celeste", "Celeste"], ["amarillo", "Amarillo"]], desc: "Color de la paleta para el resaltado." },
      { id: "paso", tipo: "rango", etiqueta: "Escalonado", min: 0, max: .5, paso: .005, def: .05, desc: "Distancia entre una parte y la siguiente. Alto: de a una; bajo: una ola suave. En Al entrar, en segundos." },
      { id: "duracion", tipo: "rango", etiqueta: "Duración", unidad: "s", min: .2, max: 2, paso: .05, def: .8, desc: "Lo que tarda cada parte en aparecer. Solo en modo Al entrar." },
      { id: "suavizado", tipo: "rango", etiqueta: "Suavizado", unidad: "s", min: 0, max: 2, paso: .1, def: 0, desc: "Lo que tarda el revelado en alcanzar al scroll. 0 lo ata directo. Solo en modo Scroll." },
      { id: "opacidad", tipo: "rango", etiqueta: "Opacidad inicial", min: 0, max: 1, paso: .05, def: .1, desc: "Cuánto se ve cada parte antes de aparecer." },
      { id: "giro", tipo: "rango", etiqueta: "Giro inicial", unidad: "°", min: 0, max: 10, paso: 1, def: 3, desc: "Inclinación del bloque antes de enderezarse. 0 lo deja derecho." },
      { id: "desplazamiento", tipo: "rango", etiqueta: "Desplazamiento inicial", unidad: "px", min: 0, max: 60, paso: 1, def: 0, desc: "Cuánto más abajo arranca cada parte; sube a su lugar mientras aparece." },
      { id: "desenfoque", tipo: "interr", etiqueta: "Desenfoque", def: true, desc: "Cada parte arranca desenfocada y se aclara al aparecer." },
      { id: "blur", tipo: "rango", etiqueta: "Fuerza del desenfoque", unidad: "px", min: 0, max: 20, paso: 1, def: 4, desc: "Cuán desenfocadas arrancan las partes." },
      { id: "tam", tipo: "rango", etiqueta: "Tamaño", unidad: "px", min: 20, max: 96, def: 48, aplica: { var: "--tam", unidad: "px" }, desc: "Cuerpo del texto." },
      { id: "fondo", tipo: "seg", etiqueta: "Fondo", def: "tiza", aplica: { attr: "data-fondo" }, opciones: [["tiza", "Tiza"], ["azul", "Azul"]], desc: "Sobre tiza en tinta; sobre azul en tiza." }
    ],
    claves: [
      "Con el scroll, las partes aparecen desde que el bloque asoma (un 20% de su alto sobre el borde de abajo) hasta que su final llega al borde de abajo. Si se vuelve, se apagan.",
      "Al entrar, corre una sola vez con su duración y escalonado en segundos.",
      "El giro va de la inclinación inicial a 0 mientras el bloque cruza la pantalla, con el eje en el borde izquierdo.",
      "Solo mueve opacity, filter, transform y color. Usarlo una vez por página, en un manifiesto o frase de marca."
    ],
    accesibilidad: "El texto completo queda para lectores de pantalla en un span oculto; las partes animadas van con aria-hidden. Con movimiento reducido se muestra completo y quieto.",
    css: function () {
      return [
        ".pf-sr { --tam: 48px; overflow-x: clip; font: 400 var(--texto-cuerpo)/1.5 var(--f-body); }",
        ".pf-sr[data-fondo=\"tiza\"] { background: var(--bg); color: var(--ink); }",
        ".pf-sr[data-fondo=\"azul\"] { background: var(--azul); color: var(--tiza); }",
        Object.keys(COLORES).map(function (k) { return '.pf-sr[data-resalte="' + k + '"] { --sr-resalte: ' + COLORES[k] + '; }'; }).join("\n"),
        ".pf-sr__aire { display: flex; align-items: center; justify-content: center; height: 100vh; font-size: var(--texto-chico); opacity: .55; }",
        ".pf-sr__aire--fin { height: 60vh; }",
        ".pf-sr__bloque { padding: 0 clamp(20px, 6vw, 96px); }",
        ".pf-sr__t { margin: 0; max-width: 24ch; font: 500 var(--tam)/1.3 var(--f-display); letter-spacing: -.025em; text-wrap: pretty; }",
        ".pf-sr__w, .pf-sr__p { display: inline-block; }"
      ].join("\n");
    },
    html: function (s) {
      var t = String(s.txt || TEXTO).trim();
      var partes = t.split(/(\s+)/).map(function (w) {
        if (!w.trim()) return " ";
        var dentro = s.partir === "letras"
          ? Array.from(w).map(function (c) { return '<span class="pf-sr__p">' + escapar(c) + '</span>'; }).join("")
          : '<span class="pf-sr__p">' + escapar(w) + '</span>';
        return '<span class="pf-sr__w">' + dentro + '</span>';
      }).join("");
      return '<section class="pf-sr" data-c="revela-scroll" data-resalte="' + s.color + '">\n' +
        '  <div class="pf-sr__aire" aria-hidden="true">Scrolleá</div>\n' +
        '  <div class="pf-sr__bloque">\n' +
        '    <p class="pf-sr__t"><span class="pf-oculto">' + escapar(t) + '</span><span aria-hidden="true">' + partes + '</span></p>\n' +
        '  </div>\n' +
        '  <div class="pf-sr__aire pf-sr__aire--fin" aria-hidden="true"></div>\n</section>';
    },
    js: function (s) {
      var O = { modo: s.modo, partir: s.partir, efecto: s.efecto, resaltar: s.resaltar, paso: +s.paso, duracion: +s.duracion, suavizado: +s.suavizado,
        opacidad: +s.opacidad, giro: +s.giro, desplazamiento: +s.desplazamiento, blur: s.desenfoque ? +s.blur : 0 };
      return [
        "(function () {",
        "  var O = " + JSON.stringify(O) + ";",
        "  var raiz = document.querySelector('.pf-sr'), el = raiz.querySelector('.pf-sr__t');",
        "  var envs = [].slice.call(el.querySelectorAll('.pf-sr__w')), piezas = [].slice.call(el.querySelectorAll('.pf-sr__p'));",
        "  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;",
        "  function lim(x) { return Math.min(1, Math.max(0, x)); }",
        "  function suave(x) { return x * x * (3 - 2 * x); }",
        "  function sale(x) { return 1 - Math.pow(1 - x, 3); }",
        "  function atras(x, o) { var s = x - 1; return 1 + (o + 1) * s * s * s + o * s * s; }",
        "  // Resaltado: sube rápido al color de acento y vuelve despacio al color del texto.",
        "  function brillo(t) { return t <= 0 || t >= 1 ? 0 : t < .35 ? suave(t / .35) : 1 - suave((t - .35) / .65); }",
        "  var color = O.resaltar ? getComputedStyle(raiz).getPropertyValue('--sr-resalte').trim() : '';",
        "",
        "  // Dibuja una parte en su avance t (0 a 1).",
        "  function pintar(p, t) {",
        "    var rev = t, fun = t, mov = '';",
        "    if (O.efecto === 'sube') { rev = sale(t); fun = lim(rev * 1.25); if (rev < 1) mov = 'translateY(' + ((1 - rev) * 100).toFixed(2) + '%) translateY(' + ((1 - rev) * .2).toFixed(3) + 'em)'; }",
        "    else if (O.efecto === 'voltea') { rev = atras(t, 1.2); fun = lim(t * 2); if (t < 1) mov = 'perspective(6em) rotateX(' + ((1 - rev) * 90).toFixed(2) + 'deg)'; }",
        "    else if (O.efecto === 'crece') { rev = atras(t, 1.6); fun = lim(t * 1.6); if (t < 1) mov = 'scale(' + (.35 + .65 * rev).toFixed(4) + ')'; }",
        "    if (color) fun = Math.max(fun, lim(t / .35));",
        "    var asienta = lim(rev), baja = O.desplazamiento * (1 - asienta);",
        "    p.style.opacity = t >= 1 ? '' : (O.opacidad + (1 - O.opacidad) * fun).toFixed(3);",
        "    p.style.transform = [baja ? 'translateY(' + baja.toFixed(2) + 'px)' : '', mov].filter(Boolean).join(' ');",
        "    p.style.filter = O.blur && asienta < 1 ? 'blur(' + (O.blur * (1 - asienta)).toFixed(2) + 'px)' : '';",
        "    if (color) { var g = brillo(t); p.style.color = g > .002 ? 'color-mix(in srgb, ' + color + ' ' + (g * 100).toFixed(1) + '%, currentColor)' : ''; }",
        "  }",
        "",
        "  // Orden de cada parte: su posición, o su renglón si se parte por líneas.",
        "  var orden = piezas.map(function (_, i) { return i; }), cuenta = piezas.length, ultimo = [];",
        "  function medir() {",
        "    if (O.partir !== 'lineas') return;",
        "    var l = -1, top = -1e9;",
        "    envs.forEach(function (w, i) { var y = w.offsetTop; if (Math.abs(y - top) > 2) { l++; top = y; } orden[i] = l; });",
        "    cuenta = l + 1; ultimo = [];",
        "  }",
        "  var tramo = O.modo === 'entrar' ? Math.max(.05, O.duracion) : .5, paso = Math.max(0, O.paso), avance = 0;",
        "  function total() { return tramo + Math.max(0, cuenta - 1) * paso; }",
        "  function dibujar(p) {",
        "    avance = p; var at = p * total();",
        "    piezas.forEach(function (w, i) { var t = lim((at - orden[i] * paso) / tramo); if (t === ultimo[i]) return; ultimo[i] = t; pintar(w, t); });",
        "  }",
        "  function girar(q) { el.style.transform = O.giro ? 'rotate(' + (O.giro * (1 - q)).toFixed(3) + 'deg)' : ''; }",
        "",
        "  piezas.forEach(function (w) {",
        "    w.style.willChange = piezas.length > 80 ? '' : O.efecto === 'aparece' && !O.desplazamiento ? 'opacity' : 'opacity, transform';",
        "    if (O.efecto === 'voltea') w.style.transformOrigin = '50% 100%';",
        "  });",
        "  // Sube: cada palabra recorta lo que queda debajo de su base, así la parte sale desde atrás.",
        "  if (O.efecto === 'sube') envs.forEach(function (w) { w.style.clipPath = 'inset(-1em -1em -.15em -1em)'; });",
        "  el.style.transformOrigin = '0% 50%';",
        "  medir(); dibujar(0); girar(0);",
        "",
        "  if (O.modo === 'entrar') {",
        "    // Al entrar: corre una vez cuando el bloque asoma; el giro se endereza en 1,4 s como máximo.",
        "    var jugado = false;",
        "    var jugar = function () {",
        "      if (jugado) return; jugado = true;",
        "      var T = total(), TG = Math.min(T, 1.4), t0 = performance.now();",
        "      (function cuadro(ahora) {",
        "        var s = (ahora - t0) / 1000; dibujar(lim(s / T)); girar(sale(lim(s / TG)));",
        "        if (s < Math.max(T, TG)) requestAnimationFrame(cuadro);",
        "      })(t0);",
        "    };",
        "    var revisar = function () {",
        "      var r = el.getBoundingClientRect(), V = innerHeight, fondo = document.documentElement.scrollHeight - V - 1;",
        "      if (r.top <= V - .2 * Math.min(r.height, V) || scrollY >= fondo) jugar();",
        "    };",
        "    addEventListener('scroll', revisar, { passive: true }); revisar();",
        "    addEventListener('resize', function () { medir(); dibujar(avance); });",
        "  } else {",
        "    // Con el scroll: las partes van desde que el bloque asoma hasta que su final llega al borde de abajo.",
        "    var objetivo = function () {",
        "      var r = el.getBoundingClientRect(), h = r.height, V = innerHeight, ini = V - .2 * Math.min(h, V), fin = V - h;",
        "      return { p: lim((ini - r.top) / Math.max(1, ini - fin)), g: lim((V - r.top) / Math.max(1, h)) };",
        "    };",
        "    var p = 0, g = 0, corriendo = false, antes = 0;",
        "    // Suavizado: el avance persigue al scroll y lo alcanza en unos O.suavizado segundos.",
        "    var seguir = function (ahora) {",
        "      var dt = Math.min(.1, (ahora - antes) / 1000), o = objetivo(), k = 1 - Math.exp(-dt * 3 / O.suavizado); antes = ahora;",
        "      p += (o.p - p) * k; g += (o.g - g) * k;",
        "      if (Math.abs(o.p - p) < .0005 && Math.abs(o.g - g) < .0005) { p = o.p; g = o.g; corriendo = false; }",
        "      dibujar(p); girar(g);",
        "      if (corriendo) requestAnimationFrame(seguir);",
        "    };",
        "    var tic = function () {",
        "      if (!O.suavizado) { var o = objetivo(); dibujar(o.p); girar(o.g); return; }",
        "      if (!corriendo) { corriendo = true; antes = performance.now(); requestAnimationFrame(seguir); }",
        "    };",
        "    var pedido = false;",
        "    addEventListener('scroll', function () { if (!pedido) { pedido = true; requestAnimationFrame(function () { pedido = false; tic(); }); } }, { passive: true });",
        "    addEventListener('resize', function () { medir(); tic(); });",
        "    tic();",
        "  }",
        "  if (document.fonts) document.fonts.ready.then(function () { medir(); dibujar(avance); });",
        "})();"
      ].join("\n");
    }
  });
})();
