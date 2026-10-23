/* Piezas del sistema que usan varios componentes: la Etiqueta (componente Etiqueta del Master, manual p. 64)
   y la barra de navegación (Web/Barra navegación). Acá solo se arma su HTML: el CSS vive en base.css
   (piezas "etiqueta" y "barra") y los colores salen de tokens.css. */
(function () {
  // Familias de color de las etiquetas (04 · Paleta): fondo del badge, forma y texto. Invertida = fondo y forma cruzados.
  function fam(n, inv) {
    var bg = "var(--fam-" + n + ")", fo = "var(--fam-" + n + "-comp)";
    return { bg: inv ? fo : bg, fo: inv ? bg : fo, tx: "var(--fam-" + n + "-tinta)" };
  }
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
      return '<span class="pf-etiqueta" style="--fo: ' + x.f.fo + '; --tx: ' + x.f.tx + '">' +
        '<svg class="pf-etiqueta__badge" viewBox="0 0 100 100" aria-hidden="true"><g style="fill: ' + x.f.bg + '">' + BADGE + '</g><svg x="21" y="21" width="58" height="58" viewBox="' + f.vb + '" style="fill: ' + x.f.fo + '">' + f.d + '</svg></svg>' +
        '<span class="pf-etiqueta__rotulo">' + x.nombre + '</span>' + (dato != null ? '<span class="pf-etiqueta__dato">' + dato + '</span>' : '') + '</span>';
    },
    /* Barra de navegación (Web/Barra navegación): logo, menú en cápsula de vidrio y lupa. */
    barra: function (items, actual) {
      return '<header class="pf-barra"><nav class="pf-barra__nav" aria-label="Sitio">' +
        '<a class="pf-barra__logo" href="#" aria-label="Profertil">' + LOGO_BLANCO.replace("<svg", '<svg aria-hidden="true"') + '</a>' +
        '<div class="pf-barra__menu">' + items.map(function (it) {
          return '<button type="button" data-ir="' + it[0] + '"' + (it[0] === actual ? ' aria-current="page"' : '') + '>' + it[1] + '</button>'; }).join("") + '</div>' +
        '<span class="pf-barra__lupa" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></svg></span>' +
        '</nav></header>';
    }
  };
})();
