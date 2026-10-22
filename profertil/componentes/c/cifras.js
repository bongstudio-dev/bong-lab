/* Cifras clave: tres o cuatro números con el año siempre visible. */
(function () {
  // 04 · Paleta del Master: Dominante, Complementario, Tercero, Tinta, Tinta tercero, y el texto sobre el Dominante.
  var PALETAS = {
    azul:     { dom: "#003DA5", comp: "#4086FF", ter: "#2D8035", tinta: "#003DA5", tinter: "#FFFEEF", sobre: "#FFFEEF" },
    verde:    { dom: "#2D8035", comp: "#5EB53A", ter: "#EABA2C", tinta: "#2D8035", tinter: "#2D8035", sobre: "#FFFEEF" },
    amarillo: { dom: "#EABA2C", comp: "#E57F19", ter: "#2D8035", tinta: "#E57F19", tinter: "#FFFEEF", sobre: "#003DA5" },
    naranja:  { dom: "#E57F19", comp: "#8A4818", ter: "#EABA2C", tinta: "#E57F19", tinter: "#E57F19", sobre: "#FFFEEF" }
  };
  var DATOS = [
    ["Producción", "128", "miles de toneladas por año"],
    ["Presencia", "24", "provincias con distribuidores"],
    ["Equipo", "900", "personas en planta y oficinas"],
    ["Cultivos", "12", "cultivos con recomendación"]
  ];

  Libreria.sumar({
    id: "cifras", nombre: "Cifras clave", grupo: "Datos", alto: "auto",
    bajada: "Tres o cuatro números que cuentan escala, con el año siempre visible.",
    nota: "El número cuenta con el animador cifra (animadores.css y animadores.js); sin ellos queda el valor final.",
    variantes: [["tarjeta", "Tarjeta"], ["color", "Sobre color"], ["tiza", "Sobre tiza"]],
    controles: [
      { id: "paleta", tipo: "seg", etiqueta: "Paleta", def: "azul", aplica: { attr: "data-paleta" }, opciones: [["azul", "Azul"], ["verde", "Verde"], ["amarillo", "Amarillo"], ["naranja", "Naranja"]] },
      { id: "comb", tipo: "seg", etiqueta: "Combinación del dato", def: "secundaria", aplica: { attr: "data-comb" }, opciones: [["secundaria", "Secundaria"], ["terciaria", "Terciaria"]] },
      { id: "cant", tipo: "seg", etiqueta: "Cantidad", def: 4, aplica: { var: "--cols" }, opciones: [[2, "2"], [3, "3"], [4, "4"]] },
      "---",
      { id: "num", tipo: "rango", etiqueta: "Número", unidad: "px", min: 32, max: 120, def: 64, aplica: { var: "--num", unidad: "px" } },
      { id: "pastilla", tipo: "rango", etiqueta: "Pastilla del año (S 22 · M 27 · L 32)", unidad: "px", min: 16, max: 40, def: 27, aplica: { var: "--pastilla", unidad: "px" } },
      { id: "radio", tipo: "rango", etiqueta: "Radio", unidad: "px", min: 0, max: 40, def: 26, aplica: { var: "--radio", unidad: "px" } },
      { id: "aire", tipo: "rango", etiqueta: "Separación", unidad: "px", min: 0, max: 48, def: 16, aplica: { var: "--aire", unidad: "px" } },
      { id: "anio", tipo: "texto", etiqueta: "Año", def: "2025", aplica: { texto: ".cifra__anio" } },
      "---",
      { id: "contar", tipo: "interr", etiqueta: "Contar al entrar", def: true },
      { id: "dur", tipo: "rango", etiqueta: "Duración del conteo", unidad: "ms", min: 400, max: 3000, paso: 100, def: 1400 }
    ],
    css: function () {
      return [
        ".cifras {",
        "  --num: 64px; --pastilla: 27px; --radio: 26px; --aire: 16px; --cols: 4;",
        "  --card: #FFFEEF; --linea: rgba(10, 30, 74, .1); --texto-2: #44506E;",
        "  container-type: inline-size; max-width: 1160px; margin: 0 auto;",
        "  font-family: \"DM Sans\", \"Helvetica Neue\", Arial, sans-serif;",
        "}",
        Object.keys(PALETAS).map(function (k) {
          var p = PALETAS[k];
          return '.cifras[data-paleta="' + k + '"] { --c-dom: ' + p.dom + '; --c-comp: ' + p.comp + '; --c-ter: ' + p.ter + '; --c-tinta: ' + p.tinta + '; --c-tinta-ter: ' + p.tinter + '; --c-sobre: ' + p.sobre + '; }';
        }).join("\n"),
        '.cifras[data-comb="secundaria"] { --c-dato: var(--c-comp); --c-dato-tinta: #FFFEEF; }',
        '.cifras[data-comb="terciaria"] { --c-dato: var(--c-ter); --c-dato-tinta: var(--c-tinta-ter); }',
        ".cifras__lista { display: grid; grid-template-columns: repeat(var(--cols), minmax(0, 1fr)); gap: var(--aire); }",
        ".cifras__lista > .cifra:nth-child(n + 5) { display: none; }",
        ".cifras[style*=\"--cols: 2\"] .cifra:nth-child(n + 3), .cifras[style*=\"--cols: 3\"] .cifra:nth-child(n + 4) { display: none; }",
        ".cifra { display: flex; flex-direction: column; gap: 12px; min-width: 0; color: var(--c-tinta); }",
        ".cifra__cab { display: flex; justify-content: space-between; align-items: center; gap: 8px; }",
        ".cifra__rotulo { font-size: 13px; line-height: 16px; color: var(--texto-2); }",
        ".cifra__anio { display: inline-flex; align-items: center; height: var(--pastilla); padding: 0 calc(var(--pastilla) * .37); border-radius: calc(var(--pastilla) * .32); background: var(--c-dato); color: var(--c-dato-tinta); font-size: calc(var(--pastilla) * .48); line-height: 1; white-space: nowrap; }",
        ".cifra__n { font: 500 var(--num)/1 \"Familjen Grotesk\", \"Helvetica Neue\", Arial, sans-serif; letter-spacing: -.047em; font-variant-numeric: tabular-nums; }",
        ".cifra__desc { margin: 0; font-size: 15px; line-height: 20px; color: var(--texto-2); }",
        "/* Tarjeta marfil */",
        '.cifras[data-variante="tarjeta"] .cifra { padding: 20px 22px 24px; border-radius: var(--radio); background: var(--card); }',
        "/* Sobre color: el fondo es el Dominante de la paleta */",
        '.cifras[data-variante="color"] .cifra { padding: 20px 22px 24px; border-radius: var(--radio); background: var(--c-dom); color: var(--c-sobre); }',
        '.cifras[data-variante="color"] .cifra__rotulo, .cifras[data-variante="color"] .cifra__desc { color: var(--c-sobre); }',
        "/* Sobre tiza: sin caja, línea fina arriba */",
        '.cifras[data-variante="tiza"] .cifra { padding: 16px 0 8px; border-top: 1px solid var(--linea); }',
        "/* Mobile: 2 por fila. Responde al ancho del componente. */",
        "@container (max-width: 720px) {",
        "  .cifras__lista { grid-template-columns: repeat(min(var(--cols), 2), minmax(0, 1fr)); gap: calc(var(--aire) * .56); }",
        "  .cifra { gap: 8px; } .cifra__n { font-size: calc(var(--num) * .69); }",
        "  .cifra__rotulo { font-size: 12px; } .cifra__desc { font-size: 13px; line-height: 17px; }",
        '  .cifras[data-variante="tarjeta"] .cifra, .cifras[data-variante="color"] .cifra { padding: 16px 16px 18px; border-radius: calc(var(--radio) * .77); }',
        "}"
      ].join("\n");
    },
    html: function (s) {
      return '<section class="cifras" data-c="cifras">\n  <div class="cifras__lista">\n' + DATOS.map(function (d) {
        return '    <article class="cifra">\n' +
          '      <div class="cifra__cab"><span class="cifra__rotulo">' + d[0] + '</span><span class="cifra__anio">' + s.anio + '</span></div>\n' +
          '      <strong class="cifra__n"' + (s.contar ? ' data-anim="cifra" data-dur="' + s.dur + '"' : '') + '>' + d[1] + '</strong>\n' +
          '      <p class="cifra__desc">' + d[2] + '</p>\n    </article>';
      }).join("\n") + '\n  </div>\n</section>';
    }
  });
})();
