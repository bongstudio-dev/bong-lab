  var FAM = {
    azul: { bg: "#003DA5", fo: "#4086FF", tx: "#003DA5" },
    verde: { bg: "#2D8035", fo: "#5EB53A", tx: "#2D8035" },
    amarillo: { bg: "#EABA2C", fo: "#E57F19", tx: "#E57F19" },
    naranja: { bg: "#E57F19", fo: "#8A4818", tx: "#E57F19" }
  };
  function fam(nombre, inv) { var f = FAM[nombre]; return inv ? { bg: f.fo, fo: f.bg, tx: f.tx } : f; }
  var CATS = [
    { id: "cereales", nombre: "Cereales", forma: "trigo", f: fam("verde", true) },
    { id: "oleaginosas", nombre: "Oleaginosas", forma: "capas", f: fam("amarillo") },
    { id: "pasturas", nombre: "Pasturas", forma: "ondas", f: fam("verde") },
    { id: "industriales", nombre: "Industriales", forma: "industria", f: fam("naranja") },
    { id: "msds", nombre: "MSDS", forma: "casco", f: fam("amarillo", true) },
    { id: "inversores", nombre: "Inversores", forma: "grafico", f: fam("azul", true) },
    { id: "biblioteca", nombre: "Biblioteca", forma: "lupa", f: fam("azul") },
    // Legajo impositivo: el legajo y las constancias nacionales y provinciales.
    { id: "impositivo", nombre: "Impositivo", forma: "escudo", f: fam("naranja", true) },
    // Sala de prensa: las mismas etiquetas que esos tipos de nota en Novedades (Institucional y Aviso a la comunidad).
    { id: "gacetilla", nombre: "Gacetilla", forma: "escudo", f: fam("azul") },
    { id: "aviso", nombre: "Aviso a la comunidad", forma: "casco", f: fam("amarillo") },
    // Quiero ser proveedor: la documentación para proveedores.
    { id: "proveedores", nombre: "Proveedores", forma: "industria", f: fam("amarillo") }
  ];
  var POR = {};
  CATS.forEach(function (x) { POR[x.id] = x; });
  function badge(x) {
    return '<svg class="pf-etiqueta__badge" viewBox="0 0 100 100" aria-hidden="true"><use href="#pf-badge-bg" width="100" height="100" fill="' + x.f.bg + '"/>' +
      '<use href="#pf-forma-' + x.forma + '" x="21" y="21" width="58" height="58" fill="' + x.f.fo + '"/></svg>';
  }
  function vars(x) { return "--eb:" + x.f.bg + ";--fo:" + x.f.fo + ";--tx:" + x.f.tx; }
  function etq(id, dato) {
    var x = POR[id];
    return '<span class="pf-etiqueta" style="' + vars(x) + '">' + badge(x) + '<span class="pf-etiqueta__rotulo">' + x.nombre + "</span>" + (dato ? '<span class="pf-etiqueta__dato">' + dato + "</span>" : "") + "</span>";
  }
