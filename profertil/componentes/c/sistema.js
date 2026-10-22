/* Piezas del sistema que usan varios componentes, con el código de Novedades:
   la Etiqueta (componente Etiqueta del Master, manual p. 64) y la barra de navegación
   (Web/Barra navegación). Los componentes las insertan en su HTML y su CSS. */
(function () {
  // Familias de color de las etiquetas: fondo del badge, forma y texto.
  var FAM = {
    azul: { bg: "#003DA5", fo: "#4086FF", tx: "#003DA5" },
    verde: { bg: "#2D8035", fo: "#5EB53A", tx: "#2D8035" },
    amarillo: { bg: "#EABA2C", fo: "#E57F19", tx: "#E57F19" },
    naranja: { bg: "#E57F19", fo: "#8A4818", tx: "#E57F19" }
  };
  function fam(n, inv) { var f = FAM[n]; return inv ? { bg: f.fo, fo: f.bg, tx: f.tx } : f; }
  // Las categorías de Novedades, cada una con su forma y su familia.
  var CATEGORIAS = {
    institucional: { nombre: "Institucional", forma: "escudo", f: fam("azul") },
    comercial: { nombre: "Comercial", forma: "barras", f: fam("naranja") },
    somos: { nombre: "Somos Profertil", forma: "circulos", f: fam("verde", true) },
    tecnico: { nombre: "Artículo técnico", forma: "lupa", f: fam("verde") },
    aviso: { nombre: "Aviso a la comunidad", forma: "casco", f: fam("amarillo") },
    financiera: { nombre: "Gacetilla financiera", forma: "grafico", f: fam("azul", true) },
    trigo: { nombre: "Trigo", forma: "trigo", f: fam("verde", true) }
  };
  var BADGE = '<path d="M32 0H68C76.49 0 84.63 3.37 90.63 9.37C96.63 15.37 100 23.51 100 32V68C100 76.49 96.63 84.63 90.63 90.63C84.63 96.63 76.49 100 68 100H32C23.51 100 15.37 96.63 9.37 90.63C3.37 84.63 0 76.49 0 68V32C0 23.51 3.37 15.37 9.37 9.37C15.37 3.37 23.51 0 32 0Z"/>';

  window.SIS = {
    CATEGORIAS: CATEGORIAS,
    /* Etiqueta: badge (forma sobre el color de la familia) + rótulo blanco + dato opcional. */
    etiqueta: function (id, dato) {
      var x = CATEGORIAS[id], f = FORMAS[x.forma];
      return '<span class="etq" style="--fo: ' + x.f.fo + '; --tx: ' + x.f.tx + '">' +
        '<svg class="bd" viewBox="0 0 100 100" aria-hidden="true"><g fill="' + x.f.bg + '">' + BADGE + '</g><svg x="21" y="21" width="58" height="58" viewBox="' + f.vb + '" fill="' + x.f.fo + '">' + f.d + '</svg></svg>' +
        '<span class="lb">' + x.nombre + '</span>' + (dato != null ? '<span class="dt">' + dato + '</span>' : '') + '</span>';
    },
    etiquetaCSS: [
      "/* Etiqueta del sistema (Master, manual p. 64): radio 32% del alto, texto al 48%. S 22 / M 27 / L 32. */",
      ".etq { --s: 27px; display: inline-flex; align-items: stretch; gap: calc(var(--s) * .06); height: var(--s); flex: none; font-family: \"Familjen Grotesk\", \"Helvetica Neue\", Arial, sans-serif; font-weight: 400; }",
      ".etq .bd { width: var(--s); height: var(--s); flex: none; display: block; }",
      ".etq .lb, .etq .dt { display: inline-flex; align-items: center; padding: 0 calc(var(--s) * .36); border-radius: calc(var(--s) * .32); font-size: calc(var(--s) * .48); line-height: 1; white-space: nowrap;  text-box: trim-both cap alphabetic; }",
      ".etq .lb { background: #fff; color: var(--tx); }",
      ".etq .dt { background: var(--fo); color: #FFFEEF; font-variant-numeric: tabular-nums; }"
    ].join("\n"),

    /* Barra de navegación (Web/Barra navegación): logo, menú en cápsula de vidrio y lupa. */
    barra: function (items, actual) {
      return '<header class="top solid"><nav class="nav" aria-label="Sitio">' +
        '<a class="logo" href="#" aria-label="Profertil">' + LOGO_BLANCO.replace("<svg", '<svg aria-hidden="true"') + '</a>' +
        '<div class="menu">' + items.map(function (it) {
          return '<button type="button" data-ir="' + it[0] + '"' + (it[0] === actual ? ' aria-current="page"' : '') + '>' + it[1] + '</button>'; }).join("") + '</div>' +
        '<span class="lupa" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></svg></span>' +
        '</nav></header>';
    },
    barraCSS: [
      "/* Barra de navegación del sistema (Web/Barra navegación, la de Novedades). */",
      ".top { position: fixed; inset: 0 0 auto; z-index: 50; }",
      ".top.solid { background: rgba(0, 61, 165, .94); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); }",
      ".nav { position: relative; display: flex; align-items: center; gap: 14px; height: 76px; padding: 0 clamp(16px, 4vw, 48px); }",
      ".nav .logo { display: block; flex: none; color: #FFFEEF; line-height: 0; }",
      ".nav .logo svg { width: 74px; height: auto; }",
      ".nav .menu { display: flex; gap: 2px; margin: 0 auto; padding: 7px; border-radius: 999px; background: rgba(255, 254, 239, .14); border: 1px solid rgba(255, 254, 239, .22); backdrop-filter: blur(14px); }",
      ".nav .menu button { padding: 7px 14px; border: 0; border-radius: 999px; background: none; font: inherit; font-size: .82rem; white-space: nowrap; color: rgba(255, 254, 239, .9); cursor: pointer; transition: background 200ms ease, color 200ms ease; }",
      ".nav .menu button[aria-current] { background: #FFFEEF; color: #003DA5; font-weight: 500; }",
      ".nav .lupa { width: 48px; height: 48px; flex: none; display: grid; place-items: center; border-radius: 999px; background: rgba(255, 254, 239, .16); border: 1px solid rgba(255, 254, 239, .24); color: #FFFEEF; }",
      ".nav .lupa svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; }",
      "@media (max-width: 760px) { .nav .menu button { padding: 7px 9px; font-size: .76rem; } .nav .logo svg { width: 56px; } .nav .lupa { display: none; } }"
    ].join("\n")
  };
})();
