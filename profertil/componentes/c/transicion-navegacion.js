/* Transiciones de página: qué pasa entre que se toca un link y aparece la página nueva. */
(function () {
  var COLORES = { azul: "var(--azul)", verde: "var(--verde)", amarillo: "var(--amarillo)", terra: "var(--terra)" };
  var CURVAS = { base: "cubic-bezier(.22, 1, .36, 1)", fuerte: "cubic-bezier(.67, 0, .24, .99)" };
  // Logo por piezas para la persiana animada: la espiga va dos veces, en el color del texto afuera de la P
  // y en el color del paño adentro (recortada por la P), así se lee igual que el logo blanco calado.
  var LOGO_ANIMADO = "<svg class=\"pf-la\" viewBox=\"0 0 1427 999\" xmlns=\"http://www.w3.org/2000/svg\" fill=\"currentColor\"><defs><clipPath id=\"pf-la-recorte\"><path class=\"pf-la__p\" d=\"M761.433 0H435.224V661.016H670.712V428.16L669.81 426.92C699.26 441.128 730.177 449.021 765.043 449.021C889.163 449.021 989.7 348.55 989.7 224.623C989.7 100.697 889.05 0 764.931 0H761.32\"/></clipPath></defs><g class=\"pf-la__espiga\"><path class=\"pf-la__tallo\" d=\"M770.092 305.145H762.306V339.425C700.134 345.063 684.562 384.079 681.29 410.691C678.018 384.079 662.447 345.063 600.274 339.425V305.145H592.488V345.627C591.811 366.037 596.325 425.914 670.345 434.709V661.137H690.768V434.935C766.143 426.703 770.543 366.149 769.866 345.739V305.257L770.092 305.145Z\"/><path class=\"pf-la__h2\" d=\"M770.089 211.646H762.303V245.926C700.13 251.564 684.559 290.58 681.287 317.192C678.015 290.58 662.443 251.564 600.271 245.926V211.646H592.485V252.241C591.808 273.553 596.66 338.279 681.174 342.226C765.688 338.279 770.653 273.553 769.863 252.241V211.646H770.089Z\"/><path class=\"pf-la__h1\" d=\"M770.089 90.9953H762.303V152.225C700.13 157.864 684.559 196.88 681.287 223.492C678.015 196.992 662.443 157.864 600.271 152.225V90.9953H592.485V158.427C591.808 179.74 596.66 244.465 681.174 248.412C765.688 244.465 770.653 179.74 769.863 158.427V90.9953H770.089Z\"/><path class=\"pf-la__grano\" d=\"M685.235 45.7817V0H677.562V45.4434C663.571 59.3132 620.58 111.184 681.511 172.076C681.511 172.076 751.695 116.709 685.235 45.7817Z\"/></g><path class=\"pf-la__p\" d=\"M761.433 0H435.224V661.016H670.712V428.16L669.81 426.92C699.26 441.128 730.177 449.021 765.043 449.021C889.163 449.021 989.7 348.55 989.7 224.623C989.7 100.697 889.05 0 764.931 0H761.32\"/><g class=\"pf-la__espiga pf-la__calada\" clip-path=\"url(#pf-la-recorte)\"><path class=\"pf-la__tallo\" d=\"M770.092 305.145H762.306V339.425C700.134 345.063 684.562 384.079 681.29 410.691C678.018 384.079 662.447 345.063 600.274 339.425V305.145H592.488V345.627C591.811 366.037 596.325 425.914 670.345 434.709V661.137H690.768V434.935C766.143 426.703 770.543 366.149 769.866 345.739V305.257L770.092 305.145Z\"/><path class=\"pf-la__h2\" d=\"M770.089 211.646H762.303V245.926C700.13 251.564 684.559 290.58 681.287 317.192C678.015 290.58 662.443 251.564 600.271 245.926V211.646H592.485V252.241C591.808 273.553 596.66 338.279 681.174 342.226C765.688 338.279 770.653 273.553 769.863 252.241V211.646H770.089Z\"/><path class=\"pf-la__h1\" d=\"M770.089 90.9953H762.303V152.225C700.13 157.864 684.559 196.88 681.287 223.492C678.015 196.992 662.443 157.864 600.271 152.225V90.9953H592.485V158.427C591.808 179.74 596.66 244.465 681.174 248.412C765.688 244.465 770.653 179.74 769.863 158.427V90.9953H770.089Z\"/><path class=\"pf-la__grano\" d=\"M685.235 45.7817V0H677.562V45.4434C663.571 59.3132 620.58 111.184 681.511 172.076C681.511 172.076 751.695 116.709 685.235 45.7817Z\"/></g><g class=\"pf-la__letras\"><path style=\"--i:0\" d=\"M75.8257 770.847C116.221 770.847 147.025 792.159 147.025 829.822C147.025 867.485 113.739 893.195 78.6466 893.195C70.861 893.195 63.0753 892.18 55.9666 888.459C82.7087 886.767 111.595 868.951 111.595 836.588C111.595 806.931 92.2998 795.091 67.4759 795.091C60.0287 795.091 52.8072 795.768 45.6986 797.121V949.238C45.6986 968.069 45.36 981.601 61.8341 991.75V992.764H0V991.75C15.9099 985.66 13.9917 960.74 13.9917 945.517V818.433C13.9917 803.21 15.9099 778.628 0.338508 771.975V770.96H75.9386L75.8257 770.847Z\"/><path style=\"--i:1\" d=\"M293.04 945.517L248.244 884.512C273.745 878.085 297.666 854.856 297.666 825.199C297.666 795.542 274.986 770.847 233.35 770.847H159.329V771.862C175.239 778.177 172.983 802.872 172.983 818.32V945.404C172.983 960.627 175.126 985.548 159.329 991.637V992.652H218.681V991.637C202.771 985.548 204.689 960.965 204.689 945.404V892.969H221.615L240.797 924.881L278.71 975.737C288.075 988.141 298.23 992.652 314.704 992.652H343.252C325.537 980.473 305.903 962.995 292.927 945.404L293.04 945.517ZM224.774 871.883H204.689V794.415C211.798 793.061 218.681 792.047 225.903 791.708C246.777 790.693 266.072 804.902 266.072 829.258C266.072 855.194 247.454 868.162 224.887 871.995L224.774 871.883Z\"/><path style=\"--i:2\" d=\"M550.878 879.443C550.878 948.228 498.297 998.182 436.463 998.182C374.629 998.182 322.95 950.371 322.95 881.134C322.95 817.085 374.29 763.41 439.622 765.102C504.954 764.763 550.878 818.664 550.878 879.443ZM358.38 878.09C358.38 925.338 389.185 973.825 438.043 973.825C486.901 973.825 515.448 936.388 515.448 886.209C515.448 836.029 486.562 789.458 437.366 789.458C388.169 789.458 358.38 827.234 358.38 878.09Z\"/><path style=\"--i:3\" d=\"M605.388 945.513C605.388 960.736 602.905 985.318 618.364 991.746V992.761H559.576V991.746C575.486 985.656 573.568 960.736 573.568 945.513V818.429C573.568 802.868 575.373 778.286 559.576 771.971V770.956H659.098C664.401 770.956 669.704 771.633 673.766 769.265H674.669V808.393H673.766C664.062 796.666 651.425 795.2 637.095 795.2C626.15 795.2 615.317 795.538 605.388 797.568V860.377H642.624C645.896 860.377 660.79 860.377 669.366 860.603C673.089 860.603 676.249 859.249 676.249 859.249C676.249 859.249 670.945 874.247 655.261 879.547C635.289 886.312 605.501 884.621 605.501 884.621V945.626L605.388 945.513Z\"/><path style=\"--i:4\" d=\"M742.781 968.291H782.274C802.81 970.546 824.249 963.442 839.82 948.558H840.723L826.731 992.761H697.083V991.746C712.88 985.656 711.074 960.736 711.074 945.513V818.429C711.074 802.868 712.992 778.286 697.083 771.971V770.956H796.604C801.907 770.956 807.098 771.633 811.16 769.265H812.062V808.732H811.16C801.569 796.666 788.818 795.2 774.488 795.2C763.656 795.2 752.711 795.538 742.781 797.568V860.377H796.717C801.681 860.377 811.385 859.475 811.385 859.475C811.385 859.475 811.837 874.585 799.876 880.336C790.962 884.621 763.204 884.621 753.5 884.621H742.781V968.404V968.291Z\"/><path style=\"--i:5\" d=\"M991.521 945.517L946.838 884.512C972.226 878.085 996.26 854.856 996.26 825.199C996.26 795.542 973.58 770.847 931.944 770.847H857.923V771.862C873.72 778.177 871.689 802.872 871.689 818.32V945.404C871.689 960.627 873.72 985.548 857.923 991.637V992.652H917.388V991.637C901.478 985.548 903.396 960.965 903.396 945.404V892.969H920.209L939.504 924.881L977.417 975.737C986.669 988.141 997.05 992.652 1013.41 992.652H1042.07C1024.36 980.473 1004.72 962.995 991.634 945.404L991.521 945.517ZM923.368 871.883H903.284V794.415C910.392 793.061 917.275 792.047 924.384 791.708C945.258 790.693 964.441 804.902 964.441 829.258C964.441 855.194 945.823 868.162 923.368 871.995V871.883Z\"/><path style=\"--i:6\" d=\"M1121.37 948.907C1121.37 968.189 1120.92 981.27 1137.5 991.757V992.772H1075.89V991.757C1091.47 985.329 1089.66 960.747 1089.66 945.524V795.099H1062.24C1048.81 795.099 1034.82 798.82 1025.23 808.63H1024.33L1035.16 768.487H1036.18C1039.9 770.178 1043.96 770.178 1047.91 770.855H1171.8C1177.11 770.855 1187.04 770.855 1187.04 770.855C1187.04 770.855 1181.17 785.626 1168.31 791.716C1159.39 796.001 1142.35 795.211 1132.09 795.211H1121.37V949.02V948.907Z\"/><path style=\"--i:7\" d=\"M1213.57 818.438C1213.57 802.877 1215.71 778.295 1199.8 771.98V770.965H1258.93V771.98C1243.36 778.295 1245.27 803.328 1245.27 818.438V945.522C1245.27 960.745 1243.36 985.327 1258.93 991.755V992.77H1199.8V991.755C1215.37 985.665 1213.57 960.745 1213.57 945.522V818.438Z\"/><path style=\"--i:8\" d=\"M1370.5 968.507C1391.6 969.86 1410 962.193 1425.45 947.984H1426.47L1410.22 992.864H1282.49V991.849C1298.4 985.76 1296.48 960.839 1296.48 945.616V818.533C1296.48 802.971 1298.29 778.389 1282.49 772.075V771.06H1341.84V772.075C1326.05 778.389 1328.19 803.423 1328.19 818.533V968.395H1370.5V968.507Z\"/></g></svg>";
  var PAGINAS = [
    // Cada página de muestra lleva solo el nombre de su sección del menú: nada de frases inventadas.
    ["inicio", "Home", "Home", "", 1],
    ["empresa", "Empresa", "Empresa", "", 4],
    ["productos", "Productos y Servicios", "Productos y Servicios", "", 2],
    ["novedades", "Novedades", "Novedades", "", 3]
  ];

  Libreria.sumar({
    id: "transicion-pagina", nombre: "Transiciones de página", grupo: "Transiciones", alto: 680, base: ["barra"],
    bajada: "El paso entre páginas: una persiana de color con el logo o un fundido.",
    nota: "Tocá el menú de arriba, adentro del escenario, para pasar de página.",
    variantes: [["persiana", "Persiana con logo", "Un paño de color sube con el logo en el medio, cambia la página y el paño sigue de largo."], ["animada", "Persiana con logo animado", "Mientras sube el paño el logo se arma: brota la espiga, la P crece desde el pie del tallo y suben las letras. La página cambia cuando el logo termina de armarse."], ["fundido", "Fundido", "La página vieja se va hacia arriba y la nueva sube. Usa View Transitions si el navegador las tiene."]],
    tamano: "media",
    claves: ["Dos tramos de la misma duración: tapar y destapar; la página cambia en el medio.", "Mientras corre una transición no se puede disparar otra.", "Curva fuerte por defecto (la de los filtros de Novedades): arranca lenta y frena suave."],
    accesibilidad: "Con movimiento reducido la página cambia directo, sin paño. El menú marca la página actual con aria-current.",
    controles: [
      { id: "color", tipo: "seg", etiqueta: "Color", solo: ["persiana", "animada"], def: "azul", aplica: { attr: "data-color" }, opciones: [["azul", "Azul"], ["verde", "Verde"], ["amarillo", "Amarillo"], ["terra", "Terra"]], desc: "Color del paño." },
      { id: "dur", tipo: "rango", etiqueta: "Duración de cada tramo", unidad: "ms", min: 300, max: 1400, paso: 20, def: 700, aplica: { var: "--pf-dur", unidad: "ms" }, desc: "Duración de cada tramo." },
      { id: "ladur", tipo: "rango", etiqueta: "Duración del logo", unidad: "ms", solo: ["animada"], min: 700, max: 1600, paso: 50, def: 1100, aplica: { var: "--pf-la-dur", unidad: "ms" }, desc: "Cuánto tarda el logo en armarse. La página cambia cuando termina." },
      { id: "curva", tipo: "seg", etiqueta: "Curva", def: "fuerte", aplica: { attr: "data-curva" }, opciones: [["base", "Base"], ["fuerte", "Fuerte (filtros)"]], desc: "Curva base del Master o la de los filtros." }
    ],
    css: function () {
      return [
        ".pf-tp { --pf-dur: 700ms; font: 400 var(--texto-cuerpo)/1.5 var(--f-body); color: var(--ink); min-height: 100vh; }",
        Object.keys(COLORES).map(function (k) { return '.pf-tp[data-color="' + k + '"] { --color: ' + COLORES[k] + '; }'; }).join("\n"),
        Object.keys(CURVAS).map(function (k) { return '.pf-tp[data-curva="' + k + '"] { --pf-curva: ' + CURVAS[k] + '; }'; }).join("\n"),
        "/* La barra es la del sistema: pieza \"barra\" de base.css. */",
        ".pf-tp__pagina { min-height: 100vh; padding: 140px clamp(20px, 6vw, 96px) 64px; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 40px; align-items: end; }",
        ".pf-tp__pagina h1 { margin: 0 0 16px; font: 500 var(--texto-display)/.98 var(--f-display); letter-spacing: -.04em; }",
        ".pf-tp__pagina p { margin: 0; max-width: 36ch; font-size: var(--texto-destacado); color: var(--ink-2); }",
        ".pf-tp__pagina img { width: 100%; aspect-ratio: 4 / 5; max-height: 62vh; object-fit: cover; border-radius: var(--radio-tarjeta); }",
        "",
        "/* Persiana con logo: el paño sube, el logo aparece en el medio, cambia la página y el paño sigue de largo. */",
        ".pf-tp__velo { position: fixed; inset: 0; z-index: 60; display: grid; place-items: center; background: var(--color); color: var(--tiza); pointer-events: none; transform: translateY(100%); }",
        ".pf-tp[data-color=\"amarillo\"] .pf-tp__velo { color: var(--azul); }",
        ".pf-tp__velo svg { width: min(28vw, 180px); height: auto; opacity: 0; transform: translateY(14px); }",
        ".pf-tp__velo.pf-entra { transition: transform var(--pf-dur) var(--pf-curva); transform: none; }",
        ".pf-tp__velo.pf-entra svg { transition: opacity calc(var(--pf-dur) * .6) var(--pf-curva) calc(var(--pf-dur) * .45), transform calc(var(--pf-dur) * .8) var(--pf-curva) calc(var(--pf-dur) * .45); opacity: 1; transform: none; }",
        ".pf-tp__velo.pf-sale { transition: transform var(--pf-dur) var(--pf-curva); transform: translateY(-100%); }",
        ".pf-tp__velo.pf-sale svg { opacity: 1; transform: none; }",
        "",
        "/* Persiana con logo animado. Arranca antes de que el logo entre en pantalla, así el brote ya está creciendo cuando se ve,",
        "   y dura --pf-la-dur; la página cambia cuando termina.",
        "   Solo transform, clip-path y opacity: lo dibuja la placa de video, sin recalcular la página. */",
        ".pf-tp__velo svg.pf-la, .pf-tp__velo.pf-entra svg.pf-la { opacity: 1; transform: none; transition: none; }",
        ".pf-la { --t: var(--pf-la-dur, 1100ms); --t0: calc(var(--pf-dur) * .2); overflow: visible; }",
        ".pf-la__calada { fill: var(--color); }",
        ".pf-la path { transform-box: view-box; }",
        ".pf-la__p, .pf-la__tallo { transform-origin: 680px 661px; }",
        ".pf-la__h2 { transform-origin: 681px 342px; }",
        ".pf-la__h1 { transform-origin: 681px 248px; }",
        ".pf-la__grano { transform-origin: 681px 172px; }",
        "@keyframes pf-la-crece { from { transform: scale(0); } }",
        "@keyframes pf-la-hoja { from { transform: scale(var(--desde)); } }",
        "@keyframes pf-la-destapa { from { clip-path: inset(100% 0 0 0); } }",
        "@keyframes pf-la-sube { from { transform: translateY(33px); } }",
        "@keyframes pf-la-aparece { from { opacity: 0; } }",
        ".pf-entra .pf-la__tallo { animation: pf-la-crece calc(var(--t) * .31) cubic-bezier(.72, 0, .4, 1) var(--t0) backwards; }",
        ".pf-entra .pf-la__p { animation: pf-la-crece calc(var(--t) * .38) cubic-bezier(.83, 0, .18, 1) calc(var(--t0) + var(--t) * .07) backwards; }",
        ".pf-entra .pf-la__h2 { --desde: .76; animation: pf-la-hoja calc(var(--t) * .63) cubic-bezier(.03, 0, .02, 1) calc(var(--t0) + var(--t) * .24) backwards, pf-la-destapa calc(var(--t) * .64) cubic-bezier(.09, 0, .04, 1) calc(var(--t0) + var(--t) * .24) backwards; }",
        ".pf-entra .pf-la__h1 { --desde: .57; animation: pf-la-hoja calc(var(--t) * .64) cubic-bezier(.03, 0, .02, 1) calc(var(--t0) + var(--t) * .27) backwards, pf-la-destapa calc(var(--t) * .63) cubic-bezier(.09, 0, .04, 1) calc(var(--t0) + var(--t) * .29) backwards; }",
        ".pf-entra .pf-la__grano { --desde: .58; animation: pf-la-hoja calc(var(--t) * .68) cubic-bezier(.03, 0, .02, 1) calc(var(--t0) + var(--t) * .32) backwards, pf-la-destapa calc(var(--t) * .6) cubic-bezier(.09, 0, .04, 1) calc(var(--t0) + var(--t) * .32) backwards; }",
        ".pf-entra .pf-la__letras path { --d: calc(var(--t0) + var(--t) * (.2 + var(--i) * .039)); animation: pf-la-sube calc(var(--t) * .36) cubic-bezier(.17, 0, .03, 1) var(--d) backwards, pf-la-aparece 1ms var(--d) backwards; }",
        "",
        "/* Fundido: la página vieja se va hacia arriba y la nueva sube desde abajo (View Transitions si el navegador las tiene). */",
        "::view-transition-old(root) { animation: pf-tp-sale calc(var(--pf-dur, 700ms) * .7) var(--pf-curva, ease) both; }",
        "::view-transition-new(root) { animation: pf-tp-entra var(--pf-dur, 700ms) var(--pf-curva, ease) calc(var(--pf-dur, 700ms) * .25) both; }",
        "@keyframes pf-tp-sale { to { opacity: 0; transform: translateY(-24px); } }",
        "@keyframes pf-tp-entra { from { opacity: 0; transform: translateY(40px); } }",
        ".pf-tp__pagina.pf-entra { animation: pf-tp-entra var(--pf-dur) var(--pf-curva) both; }",
        "",
        "@media (max-width: 760px) { .pf-tp__pagina { grid-template-columns: 1fr; padding-top: 110px; } }",
        "@media (prefers-reduced-motion: reduce) { .pf-tp__velo { display: none; } ::view-transition-old(root), ::view-transition-new(root) { animation: none; } }"
      ].join("\n");
    },
    html: function (s) {
      var h = '<div class="pf-tp" data-c="transicion-pagina">\n' +
        '  ' + SIS.barra(PAGINAS.map(function (p) { return [p[0], p[1]]; }), PAGINAS[0][0]) + '\n' +
        '  <main class="pf-tp__pagina" id="pf-tp-pagina"></main>\n';
      if (s.variante === "persiana") h += '  <div class="pf-tp__velo" aria-hidden="true">' + LOGO_BLANCO + '</div>\n';
      if (s.variante === "animada") h += '  <div class="pf-tp__velo" aria-hidden="true">' + LOGO_ANIMADO + '</div>\n';
      h += '  <template id="pf-tp-paginas">' + PAGINAS.map(function (p) {
        return '<section data-p="' + p[0] + '"><div><h1>' + p[2] + '</h1>' + (p[3] ? '<p>' + p[3] + '</p>' : '') + '</div><img src="../novedades/fotos/demo-' + p[4] + '.webp" alt=""></section>';
      }).join("") + '</template>\n';
      return h + '</div>';
    },
    js: function (s) {
      return [
        "(function () {",
        "  var raiz = document.querySelector('.pf-tp'), pagina = document.getElementById('pf-tp-pagina'), molde = document.getElementById('pf-tp-paginas');",
        "  var velo = raiz.querySelector('.pf-tp__velo'), quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;",
        "  var ocupado = false;",
        "  function dur() { return parseFloat(getComputedStyle(raiz).getPropertyValue('--pf-dur')) || 700; }",
        "  function poner(id) {",
        "    var sec = molde.content.querySelector('[data-p=\"' + id + '\"]');",
        "    pagina.innerHTML = sec.innerHTML; scrollTo(0, 0);",
        "    raiz.querySelectorAll('[data-ir]').forEach(function (b) { b.toggleAttribute('aria-current', b.dataset.ir === id); if (b.dataset.ir === id) b.setAttribute('aria-current', 'page'); });",
        "  }",
        "  function espera(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }",
        "  async function ir(id) {",
        "    if (ocupado) return; ocupado = true; var d = dur();",
        "    if (quieto) { poner(id); ocupado = false; return; }",
        "    if (velo) {",
        "      // Persiana: entra (d), se queda con el logo un momento, cambia la página y sale (d).",
        "      // Con el logo animado la página espera a que el logo termine de armarse.",
        "      var la = velo.querySelector('.pf-la'), sostiene = la ? d * .2 + (parseFloat(getComputedStyle(la).getPropertyValue('--pf-la-dur')) || 1100) : d + d * .45;",
        "      velo.className = 'pf-tp__velo pf-entra'; await espera(sostiene);",
        "      poner(id); velo.className = 'pf-tp__velo pf-sale'; await espera(d);",
        "      velo.className = 'pf-tp__velo';",
        "    } else if (document.startViewTransition) {",
        "      // Los pseudo-elementos de la transición cuelgan de <html>: les pasamos la duración y la curva ahí.",
        "      var cs = getComputedStyle(raiz), h = document.documentElement.style;",
        "      h.setProperty('--pf-dur', d + 'ms'); h.setProperty('--pf-curva', cs.getPropertyValue('--pf-curva'));",
        "      await document.startViewTransition(function () { poner(id); }).finished;",
        "    } else { poner(id); pagina.classList.remove('pf-entra'); void pagina.offsetWidth; pagina.classList.add('pf-entra'); }",
        "    ocupado = false;",
        "  }",
        "  raiz.querySelector('.pf-barra__menu').addEventListener('click', function (e) {",
        "    var b = e.target.closest('[data-ir]'); if (b && !b.hasAttribute('aria-current')) ir(b.dataset.ir);",
        "  });",
        "  poner('inicio');",
        "})();"
      ].join("\n");
    }
  });
})();
