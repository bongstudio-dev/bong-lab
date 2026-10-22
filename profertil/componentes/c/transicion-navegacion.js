/* Transiciones de página: qué pasa entre que se toca un link y aparece la página nueva. */
(function () {
  var COLORES = { azul: "var(--azul)", verde: "var(--verde)", amarillo: "var(--amarillo)", terra: "var(--terra)" };
  var CURVAS = { base: "cubic-bezier(.22, 1, .36, 1)", fuerte: "cubic-bezier(.67, 0, .24, .99)" };
  var PAGINAS = [
    // Cada página de muestra lleva solo el nombre de su sección del menú: nada de frases inventadas.
    ["inicio", "Home", "Home", "", 1],
    ["empresa", "Empresa", "Empresa", "", 4],
    ["productos", "Productos y Servicios", "Productos y Servicios", "", 2],
    ["novedades", "Novedades", "Novedades", "", 3]
  ];

  Libreria.sumar({
    id: "transicion-pagina", nombre: "Transiciones de página", grupo: "Transiciones", alto: 680,
    bajada: "El paso entre páginas: una persiana de color con el logo, una forma que crece o un fundido.",
    nota: "Tocá el menú de arriba, adentro del escenario, para pasar de página.",
    variantes: [["persiana", "Persiana con logo", "Un paño de color sube con el logo en el medio, cambia la página y el paño sigue de largo."], ["forma", "Forma que crece", "Una forma oficial sale del punto donde se tocó y cubre la pantalla."], ["fundido", "Fundido", "La página vieja se va hacia arriba y la nueva sube. Usa View Transitions si el navegador las tiene."]],
    tamano: "media",
    claves: ["Dos tramos de la misma duración: tapar y destapar; la página cambia en el medio.", "Mientras corre una transición no se puede disparar otra.", "La forma calcula su tamaño para cubrir la esquina más lejana al dedo.", "Curva fuerte por defecto (la de los filtros de Novedades): arranca lenta y frena suave."],
    accesibilidad: "Con movimiento reducido la página cambia directo, sin paño ni forma. El menú marca la página actual con aria-current.",
    controles: [
      { id: "color", tipo: "seg", etiqueta: "Color", solo: ["persiana", "forma"], def: "azul", aplica: { attr: "data-color" }, opciones: [["azul", "Azul"], ["verde", "Verde"], ["amarillo", "Amarillo"], ["terra", "Terra"]], desc: "Color del paño o de la forma." },
      { id: "dur", tipo: "rango", etiqueta: "Duración de cada tramo", unidad: "ms", min: 300, max: 1400, paso: 20, def: 700, aplica: { var: "--dur", unidad: "ms" }, desc: "Duración de cada tramo." },
      { id: "curva", tipo: "seg", etiqueta: "Curva", def: "fuerte", aplica: { attr: "data-curva" }, opciones: [["base", "Base"], ["fuerte", "Fuerte (filtros)"]], desc: "Curva base del Master o la de los filtros." },
      { id: "forma", tipo: "select", etiqueta: "Forma", solo: ["forma"], def: "flor", opciones: Object.keys(FORMAS).map(function (k) { return [k, k.charAt(0).toUpperCase() + k.slice(1)]; }), desc: "Forma que crece." }
    ],
    css: function () {
      return [
        ".tp { --dur: 700ms; --f-d: \"Familjen Grotesk\", \"Helvetica Neue\", Arial, sans-serif; font: 400 16px/1.5 \"DM Sans\", \"Helvetica Neue\", Arial, sans-serif; color: var(--ink); min-height: 100vh; }",
        Object.keys(COLORES).map(function (k) { return '.tp[data-color="' + k + '"] { --color: ' + COLORES[k] + '; }'; }).join("\n"),
        Object.keys(CURVAS).map(function (k) { return '.tp[data-curva="' + k + '"] { --curva: ' + CURVAS[k] + '; }'; }).join("\n"),
        "/* La barra es la del sistema (Web/Barra navegación). */",
        SIS.barraCSS,
        ".tp__pagina { min-height: 100vh; padding: 140px clamp(20px, 6vw, 96px) 64px; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 40px; align-items: end; }",
        ".tp__pagina h1 { margin: 0 0 16px; font: 500 clamp(40px, 6.4vw, 96px)/.98 var(--f-d); letter-spacing: -.04em; }",
        ".tp__pagina p { margin: 0; max-width: 36ch; font-size: 18px; color: var(--ink-2); }",
        ".tp__pagina img { width: 100%; aspect-ratio: 4 / 5; max-height: 62vh; object-fit: cover; border-radius: 26px; }",
        "",
        "/* Persiana con logo: el paño sube, el logo aparece en el medio, cambia la página y el paño sigue de largo. */",
        ".tp__velo { position: fixed; inset: 0; z-index: 60; display: grid; place-items: center; background: var(--color); color: var(--tiza); pointer-events: none; transform: translateY(100%); }",
        ".tp[data-color=\"amarillo\"] .tp__velo { color: var(--azul); }",
        ".tp__velo svg { width: min(28vw, 180px); height: auto; opacity: 0; transform: translateY(14px); }",
        ".tp__velo.entra { transition: transform var(--dur) var(--curva); transform: none; }",
        ".tp__velo.entra svg { transition: opacity calc(var(--dur) * .6) var(--curva) calc(var(--dur) * .45), transform calc(var(--dur) * .8) var(--curva) calc(var(--dur) * .45); opacity: 1; transform: none; }",
        ".tp__velo.sale { transition: transform var(--dur) var(--curva); transform: translateY(-100%); }",
        ".tp__velo.sale svg { opacity: 1; transform: none; }",
        "",
        "/* Forma que crece: la forma sale del punto donde se tocó y cubre la pantalla. */",
        ".tp__forma { position: fixed; z-index: 60; left: 0; top: 0; width: 120px; height: 120px; margin: -60px 0 0 -60px; color: var(--color); pointer-events: none; transform: translate(var(--x), var(--y)) scale(0.01); opacity: 0; }",
        ".tp__forma svg { display: block; width: 100%; height: 100%; }",
        ".tp__forma.entra { opacity: 1; transform: translate(var(--x), var(--y)) scale(var(--s)) rotate(20deg); transition: transform var(--dur) var(--curva); }",
        ".tp__forma.sale { opacity: 0; transform: translate(var(--x), var(--y)) scale(var(--s)) rotate(20deg); transition: opacity calc(var(--dur) * .7) ease; }",
        "",
        "/* Fundido: la página vieja se va hacia arriba y la nueva sube desde abajo (View Transitions si el navegador las tiene). */",
        "::view-transition-old(root) { animation: tp-sale calc(var(--dur, 700ms) * .7) var(--curva, ease) both; }",
        "::view-transition-new(root) { animation: tp-entra var(--dur, 700ms) var(--curva, ease) calc(var(--dur, 700ms) * .25) both; }",
        "@keyframes tp-sale { to { opacity: 0; transform: translateY(-24px); } }",
        "@keyframes tp-entra { from { opacity: 0; transform: translateY(40px); } }",
        ".tp__pagina.entra { animation: tp-entra var(--dur) var(--curva) both; }",
        "",
        "@media (max-width: 760px) { .tp__pagina { grid-template-columns: 1fr; padding-top: 110px; } }",
        "@media (prefers-reduced-motion: reduce) { .tp__velo, .tp__forma { display: none; } ::view-transition-old(root), ::view-transition-new(root) { animation: none; } }"
      ].join("\n");
    },
    html: function (s) {
      var h = '<div class="tp" data-c="transicion-pagina">\n' +
        '  ' + SIS.barra(PAGINAS.map(function (p) { return [p[0], p[1]]; }), PAGINAS[0][0]) + '\n' +
        '  <main class="tp__pagina" id="tp-pagina"></main>\n';
      if (s.variante === "persiana") h += '  <div class="tp__velo" aria-hidden="true">' + LOGO_BLANCO + '</div>\n';
      if (s.variante === "forma") h += '  <div class="tp__forma" aria-hidden="true">' + formaSVG(s.forma) + '</div>\n';
      h += '  <template id="tp-paginas">' + PAGINAS.map(function (p) {
        return '<section data-p="' + p[0] + '"><div><h1>' + p[2] + '</h1>' + (p[3] ? '<p>' + p[3] + '</p>' : '') + '</div><img src="../novedades/fotos/demo-' + p[4] + '.webp" alt=""></section>';
      }).join("") + '</template>\n';
      return h + '</div>';
    },
    js: function (s) {
      return [
        "(function () {",
        "  var raiz = document.querySelector('.tp'), pagina = document.getElementById('tp-pagina'), molde = document.getElementById('tp-paginas');",
        "  var velo = raiz.querySelector('.tp__velo'), forma = raiz.querySelector('.tp__forma'), quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;",
        "  var ocupado = false;",
        "  function dur() { return parseFloat(getComputedStyle(raiz).getPropertyValue('--dur')) || 700; }",
        "  function poner(id) {",
        "    var sec = molde.content.querySelector('[data-p=\"' + id + '\"]');",
        "    pagina.innerHTML = sec.innerHTML; scrollTo(0, 0);",
        "    raiz.querySelectorAll('[data-ir]').forEach(function (b) { b.toggleAttribute('aria-current', b.dataset.ir === id); if (b.dataset.ir === id) b.setAttribute('aria-current', 'page'); });",
        "  }",
        "  function espera(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }",
        "  async function ir(id, e) {",
        "    if (ocupado) return; ocupado = true; var d = dur();",
        "    if (quieto) { poner(id); ocupado = false; return; }",
        "    if (velo) {",
        "      // Persiana: entra (d), se queda con el logo un momento, cambia la página y sale (d).",
        "      velo.className = 'tp__velo entra'; await espera(d + d * .45);",
        "      poner(id); velo.className = 'tp__velo sale'; await espera(d);",
        "      velo.className = 'tp__velo';",
        "    } else if (forma) {",
        "      // Forma: crece desde el dedo hasta tapar la esquina más lejana.",
        "      var x = e.clientX, y = e.clientY, lejos = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));",
        "      forma.style.setProperty('--x', x + 'px'); forma.style.setProperty('--y', y + 'px'); forma.style.setProperty('--s', (lejos / 60 * 1.6).toFixed(2));",
        "      forma.className = 'tp__forma'; void forma.offsetWidth; forma.className = 'tp__forma entra'; await espera(d);",
        "      poner(id); forma.className = 'tp__forma sale'; await espera(d * .7);",
        "      forma.className = 'tp__forma';",
        "    } else if (document.startViewTransition) {",
        "      // Los pseudo-elementos de la transición cuelgan de <html>: les pasamos la duración y la curva ahí.",
        "      var cs = getComputedStyle(raiz), h = document.documentElement.style;",
        "      h.setProperty('--dur', d + 'ms'); h.setProperty('--curva', cs.getPropertyValue('--curva'));",
        "      await document.startViewTransition(function () { poner(id); }).finished;",
        "    } else { poner(id); pagina.classList.remove('entra'); void pagina.offsetWidth; pagina.classList.add('entra'); }",
        "    ocupado = false;",
        "  }",
        "  raiz.querySelector('.nav .menu').addEventListener('click', function (e) {",
        "    var b = e.target.closest('[data-ir]'); if (b && !b.hasAttribute('aria-current')) ir(b.dataset.ir, e);",
        "  });",
        "  poner('inicio');",
        "})();"
      ].join("\n");
    }
  });
})();
