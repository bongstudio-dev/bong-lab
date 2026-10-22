/* Transiciones de sección: cómo se pasa de un bloque al siguiente con el scroll. */
(function () {
  var COLORES = { azul: "#003DA5", verde: "#2D8035", amarillo: "#EABA2C", terra: "#8A4818" };

  Libreria.sumar({
    id: "transicion-seccion", nombre: "Transiciones de sección", grupo: "Transiciones", alto: 680,
    bajada: "El paso de una sección a la otra: por una forma del sistema, con una cortina de color o apilando.",
    nota: "Scrolleá dentro del escenario. La máscara con forma sale de las pruebas de máscaras del Lab, resuelta solo con CSS.",
    variantes: [["forma", "Por una forma", "La sección siguiente aparece adentro de una forma oficial que crece hasta cubrir todo."], ["cortina", "Cortina de color", "Un paño del color de la paleta sube, tapa y se retira destapando la siguiente."], ["apila", "Se apila", "La siguiente sube con las esquinas redondeadas y la anterior se achica y oscurece atrás."]],
    tamano: "media", previa: .32,
    claves: ["La transición está atada al scroll: si se vuelve para atrás, vuelve.", "La máscara es una forma del sistema como mask-image de CSS (sin WebGL), centrada.", "La forma crece con una curva lenta al principio para que se lea su silueta antes de cubrir.", "El texto de la sección nueva entra recién cuando la forma ya cubrió todo."],
    accesibilidad: "Con movimiento reducido no hay máscara: la sección siguiente aparece entera.",
    controles: [
      { id: "forma", tipo: "select", etiqueta: "Forma (Por una forma)", def: "flor", opciones: Object.keys(FORMAS).map(function (k) { return [k, k.charAt(0).toUpperCase() + k.slice(1)]; }), desc: "Forma oficial de la máscara." },
      { id: "color", tipo: "seg", etiqueta: "Color (Cortina)", def: "azul", aplica: { attr: "data-color" }, opciones: [["azul", "Azul"], ["verde", "Verde"], ["amarillo", "Amarillo"], ["terra", "Terra"]], desc: "Color del paño." },
      { id: "radio", tipo: "rango", etiqueta: "Radio (Se apila)", unidad: "px", min: 0, max: 64, def: 32, aplica: { var: "--radio", unidad: "px" }, desc: "Radio de las esquinas de la sección que sube." },
      { id: "tramo", tipo: "rango", etiqueta: "Largo del tramo", unidad: "vh", min: 120, max: 320, paso: 10, def: 200, desc: "Cuánto scroll dura la transición." }
    ],
    css: function (s) {
      return [
        ".ts { --radio: 32px; --curva: cubic-bezier(.22, 1, .36, 1); --f-d: \"Familjen Grotesk\", \"Helvetica Neue\", Arial, sans-serif; font: 400 16px/1.5 \"DM Sans\", \"Helvetica Neue\", Arial, sans-serif; color: #0A1E4A; }",
        Object.keys(COLORES).map(function (k) { return '.ts[data-color="' + k + '"] { --cortina: ' + COLORES[k] + '; }'; }).join("\n"),
        ".ts h2 { margin: 0; font: 500 clamp(36px, 6vw, 88px)/1 var(--f-d); letter-spacing: -.04em; max-width: 12ch; }",
        ".ts p { margin: 16px 0 0; max-width: 40ch; font-size: 17px; }",
        ".ts__a, .ts__b { position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: center; padding: 0 clamp(20px, 6vw, 96px); }",
        ".ts__a { background: #E9E7D6; }",
        ".ts__b { color: #FFFEEF; }",
        ".ts__b img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: -1; }",
        ".ts__b::before { content: \"\"; position: absolute; inset: 0; z-index: -1; background: linear-gradient(to top, rgba(10, 30, 74, .55), transparent 70%); }",
        ".ts__b > :not(img) { position: relative; }",
        ".ts__tramo { position: relative; }",
        ".ts__fijo { position: sticky; top: 0; height: 100vh; overflow: hidden; isolation: isolate; }",
        ".ts__sigue { padding: 18vh clamp(20px, 6vw, 96px); background: #FFFEEF; }",
        "",
        "/* Por una forma: la sección siguiente aparece adentro de una forma oficial que crece hasta cubrir todo. */",
        ".ts__mascara { position: absolute; inset: 0; isolation: isolate;",
        "  -webkit-mask: var(--forma) center / calc(var(--m, 0) * 900%) no-repeat; mask: var(--forma) center / calc(var(--m, 0) * 900%) no-repeat; }",
        ".ts__mascara .ts__b { opacity: 1; }",
        ".ts__mascara .ts__b > :not(img) { opacity: var(--txt, 0); transform: translateY(calc((1 - var(--txt, 0)) * 24px)); }",
        "",
        "/* Cortina de color: un paño del color de la paleta sube, tapa y se va revelando la siguiente. */",
        ".ts__panio { position: absolute; inset: 0; background: var(--cortina); clip-path: inset(calc((1 - var(--sube, 0)) * 100%) 0 calc(var(--baja, 0) * 100%) 0); z-index: 2; }",
        ".ts__cortina .ts__b { clip-path: inset(calc((1 - var(--sube, 0)) * 100%) 0 0 0); }",
        "",
        "/* Se apila: la siguiente sube con las esquinas redondeadas y la anterior se achica atrás. */",
        ".ts__apila .ts__a { position: sticky; top: 0; height: 100vh; transform: scale(calc(1 - var(--q, 0) * .08)); transform-origin: 50% 0; filter: brightness(calc(1 - var(--q, 0) * .35)); }",
        ".ts__apila .ts__b { position: relative; inset: auto; height: 100vh; overflow: hidden; border-radius: calc((1 - var(--q, 0)) * var(--radio)) calc((1 - var(--q, 0)) * var(--radio)) 0 0; box-shadow: 0 -30px 60px -30px rgba(10, 30, 74, .5); isolation: isolate; z-index: 1; }",
        "",
        "@media (prefers-reduced-motion: reduce) { .ts__mascara { -webkit-mask: none; mask: none; } }"
      ].join("\n");
    },
    html: function (s) {
      var v = s.variante;
      var a = '<div class="ts__a"><h2>Una sección termina</h2><p>Lo que viene ocupa la pantalla con el scroll, sin cortes.</p></div>';
      var b = '<div class="ts__b"><img src="../novedades/fotos/demo-1.webp" alt=""><h2>Y empieza la siguiente</h2><p>La transición acompaña el gesto: si volvés para atrás, vuelve.</p></div>';
      var h = '<section class="ts" data-c="transicion-seccion">\n';
      if (v === "forma") h += '  <div class="ts__tramo" style="height: ' + s.tramo + 'vh"><div class="ts__fijo">\n    ' + a + '\n    <div class="ts__mascara" style="--forma: ' + formaURI(s.forma).replace(/"/g, "'") + '">\n      ' + b + '\n    </div>\n  </div></div>\n';
      if (v === "cortina") h += '  <div class="ts__tramo ts__cortina" style="height: ' + s.tramo + 'vh"><div class="ts__fijo">\n    ' + a + '\n    ' + b + '\n    <div class="ts__panio" aria-hidden="true"></div>\n  </div></div>\n';
      if (v === "apila") h += '  <div class="ts__apila">\n    ' + a + '\n    ' + b + '\n  </div>\n';
      return h + '  <div class="ts__sigue"><h2>Sigue el resto</h2></div>\n</section>';
    },
    js: function (s) {
      return [
        "(function () {",
        "  var raiz = document.querySelector('.ts'), tramo = raiz.querySelector('.ts__tramo'), apila = raiz.querySelector('.ts__apila');",
        "  function lim(x) { return Math.min(1, Math.max(0, x)); }",
        "  function suave(x) { return x * x * (3 - 2 * x); }",
        "  function tic() {",
        "    var H = innerHeight;",
        "    if (tramo) {",
        "      var r = tramo.getBoundingClientRect(), p = lim(-r.top / (r.height - H));",
        "      // Por una forma: la máscara crece en el primer 80% del tramo; el texto entra al final.",
        "      tramo.style.setProperty('--m', Math.pow(lim(p / .8), 2.2).toFixed(4));",
        "      tramo.style.setProperty('--txt', lim((p - .7) / .25).toFixed(4));",
        "      // Cortina: sube en la primera mitad y se retira en la segunda, destapando la siguiente.",
        "      tramo.style.setProperty('--sube', suave(lim(p / .45)).toFixed(4));",
        "      tramo.style.setProperty('--baja', suave(lim((p - .5) / .45)).toFixed(4));",
        "    }",
        "    if (apila) {",
        "      // Se apila: el avance va de 0 (la siguiente asoma abajo) a 1 (la tapó del todo).",
        "      var b = apila.querySelector('.ts__b').getBoundingClientRect();",
        "      apila.style.setProperty('--q', lim(1 - b.top / H).toFixed(4));",
        "    }",
        "  }",
        "  var pedido = false;",
        "  addEventListener('scroll', function () { if (!pedido) { pedido = true; requestAnimationFrame(function () { pedido = false; tic(); }); } }, { passive: true });",
        "  addEventListener('resize', tic); tic();",
        "})();"
      ].join("\n");
    }
  });
})();
