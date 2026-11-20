/* Barra de vista: la fila de selectores de una lista (vista, orden, pestañas) que vuelve al subir y queda bajo la barra azul.
   La vista previa corre el mismo barra-vista.js que las páginas (Biblioteca, Hojas de seguridad, Novedades, Sala de prensa). */
(function () {
  var ICONOS = {
    lista: '<svg viewBox="0 0 15 15" aria-hidden="true"><rect x="0" y="0" width="4" height="4" rx="1.3"/><rect x="6" y="1" width="9" height="2" rx="1"/><rect x="0" y="5.5" width="4" height="4" rx="1.3"/><rect x="6" y="6.5" width="9" height="2" rx="1"/><rect x="0" y="11" width="4" height="4" rx="1.3"/><rect x="6" y="12" width="9" height="2" rx="1"/></svg>',
    mini: '<svg viewBox="0 0 15 15" aria-hidden="true"><rect x="0" y="0" width="6.5" height="6.5" rx="2.1"/><rect x="8.5" y="0" width="6.5" height="6.5" rx="2.1"/><rect x="0" y="8.5" width="6.5" height="6.5" rx="2.1"/><rect x="8.5" y="8.5" width="6.5" height="6.5" rx="2.1"/></svg>'
  };
  var TITULOS = ["Nutrición de cultivos en la región pampeana", "Eficiencia del nitrógeno en trigo", "Cuidado del suelo y rotaciones", "Fertilización de maíz tardío",
    "Agua y aire, informe anual", "Urea granulada, recomendaciones de uso", "Manejo de la fertilización en soja", "Ensayos de campo 2025"];

  Libreria.sumar({
    id: "barra-vista", nombre: "Barra de vista", grupo: "Scroll", alto: 680, previa: .5, tamano: "media", base: ["selector", "barra-vista"],
    bajada: "La fila de selectores de una lista (vista, orden, pestañas): en el celular va con su caja al bajar y vuelve desde atrás de la barra azul al subir.",
    nota: "Scrolleá dentro del escenario: bajá hasta perderla y subí un poco. Es el comportamiento del celular (hasta 640 px); en escritorio cada página la ata al scroll.",
    claves: [
      "En el celular nada que acompañe al scroll se mueve por código: la fila la mueve el navegador. En su lugar es contenido, pegada es sticky y suelta es relative con desplazamiento.",
      "Bajando, va con su caja como cualquier contenido y la tapa la barra azul, sin animación de salida.",
      "Subiendo, si su lugar ya quedó tapado, entra desde atrás de la barra (380 ms con la curva --ease y fundido de 260 ms) y queda pegada 9 px debajo.",
      "Si con la fila pegada se vuelve a bajar, se suelta donde está y se va con el scroll. Arriba de todo se suelta sola en su lugar.",
      "La caja que la contiene empieza en un píxel entero (PFBarraVista.alPixel). Con medio píxel, en el iPhone la fila pegada y la barra azul redondean distinto y la fila tiembla un píxel.",
      "Ningún ancestro de la fila recorta (overflow hidden o clip) con esquinas redondeadas: en el iPhone la fila pegada dentro de esa caja sube y baja un píxel mientras se scrollea. Si algo tiene que recortarse (filas que se deslizan al cambiar de vista), el recorte va en la lista, debajo de la fila.",
      "La página lee la dirección del scroll con un umbral de 8 px y llama a mover(dy). Los saltos que hace la página (filtrar, cambiar de vista) van por saltar(), que no anima.",
      "Va en componentes/barra-vista.js y en la pieza barra-vista de base.css: ninguna página la vuelve a escribir."
    ],
    accesibilidad: "Con movimiento reducido la fila queda pegada sin animar. Los selectores son grupos de botones con aria-pressed; la fila deja pasar los toques a la lista y solo los toman los selectores.",
    dependencias: ["componentes/barra-vista.js"],
    css: function () {
      return [
        ".pf-bv { font: 400 var(--texto-cuerpo)/1.5 var(--f-body); color: var(--ink); background: var(--tiza); }",
        "/* Barra azul de muestra: la de la página es la pieza barra. */",
        ".pf-bv-barra { position: fixed; inset: 0 0 auto; z-index: 50; height: 66px; background: var(--azul); }",
        ".pf-bv-cab { padding: 120px 16px 48px; }",
        ".pf-bv-cab h2 { margin: 0; max-width: 14ch; font: 600 var(--texto-titulo)/1.02 var(--f-display); letter-spacing: -.035em; color: var(--azul); }",
        ".pf-bv-hoja { min-height: 100vh; padding: 8px 16px 64px; background: var(--pf-papel, #fff); border-radius: var(--radio-tarjeta) var(--radio-tarjeta) 0 0; }",
        ".pf-bv-col { max-width: 560px; margin-inline: auto; }",
        "/* La fila: los dos selectores a lo ancho, sobre la lista y debajo de la barra azul. */",
        ".pf-bv-fila { position: relative; z-index: 20; display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-top: 26px; }",
        ".pf-bv-fila .pf-selector { background: linear-gradient(var(--line), var(--line)), var(--pf-papel, #fff); }",
        ".pf-bv-fila .pf-selector--iconos svg { width: 15px; height: 15px; fill: currentColor; }",
        ".pf-bv-cont { margin: 0; padding: 12px 0 16px; color: var(--ink-2); }",
        ".pf-bv-cont b { color: var(--azul); font-weight: 600; }",
        ".pf-bv-lista { margin: 0; padding: 0; list-style: none; }",
        ".pf-bv-lista li { padding: 18px 0; border-top: 1px solid var(--line); font: 500 1.1rem/1.2 var(--f-display); color: var(--azul); }",
        ".pf-bv-lista small { display: block; margin-top: 6px; font: 400 var(--texto-chico)/1.4 var(--f-body); color: var(--ink-3); }"
      ].join("\n");
    },
    html: function () {
      var filas = "";
      for (var i = 0; i < 24; i++) filas += '      <li>' + TITULOS[i % TITULOS.length] + '<small>Informe técnico · ' + (2025 - (i % 9)) + '</small></li>\n';
      return '<div class="pf-bv">\n' +
        '  <div class="pf-bv-barra" aria-hidden="true"></div>\n' +
        '  <header class="pf-bv-cab"><h2>Biblioteca Virtual</h2></header>\n' +
        '  <div class="pf-bv-hoja">\n    <div class="pf-bv-col">\n' +
        '    <div class="pf-vuelve-marca"></div>\n' +
        '    <div class="pf-bv-fila">\n' +
        '      <div class="pf-selector pf-selector--iconos" role="group" aria-label="Cómo se ven los documentos"><span class="pf-selector__ind" aria-hidden="true"></span>' +
        '<button type="button" aria-pressed="true" aria-label="Lista">' + ICONOS.lista + '</button><button type="button" aria-pressed="false" aria-label="Miniaturas">' + ICONOS.mini + '</button></div>\n' +
        '      <div class="pf-selector" role="group" aria-label="Orden"><span class="pf-selector__ind" aria-hidden="true"></span>' +
        '<button type="button" aria-pressed="true">A a Z</button><button type="button" aria-pressed="false">Por año</button></div>\n' +
        '    </div>\n' +
        '    <p class="pf-bv-cont"><b>128</b> documentos</p>\n' +
        '    <ul class="pf-bv-lista">\n' + filas + '    </ul>\n' +
        '    </div>\n  </div>\n</div>';
    },
    js: function () {
      return "(" + function () {
        // Indicador de cada selector: va bajo la opción elegida (en las páginas lo hace su moverInds).
        function ubicar(sel) {
          var b = sel.querySelector('[aria-pressed="true"]'), ind = sel.querySelector(".pf-selector__ind");
          ind.style.width = b.offsetWidth + "px"; ind.style.transform = "translateX(" + b.offsetLeft + "px)";
        }
        document.querySelectorAll(".pf-bv-fila .pf-selector").forEach(function (sel) {
          ubicar(sel);
          sel.addEventListener("click", function (e) {
            var b = e.target.closest("button"); if (!b) return;
            sel.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
            ubicar(sel);
          });
        });
        // La barra: el mismo archivo que usan las páginas.
        var s = document.createElement("script");
        s.src = "barra-vista.js";
        s.onload = function () {
          var barra = document.querySelector(".pf-bv-barra");
          PFBarraVista.alPixel(document.querySelector(".pf-bv-hoja"), document.querySelector(".pf-bv-cab"));
          var vuelve = PFBarraVista.queVuelve(document.querySelector(".pf-bv-fila"), document.querySelector(".pf-vuelve-marca"),
            function () { return barra.offsetHeight + 9; }, function () { return barra.offsetHeight; });
          var yAntes = scrollY;
          addEventListener("scroll", function () {
            var dy = scrollY - yAntes;
            if (Math.abs(dy) < 8) return;
            yAntes = scrollY;
            vuelve.mover(dy);
          }, { passive: true });
        };
        document.head.appendChild(s);
      }.toString() + ")();";
    }
  });
})();
