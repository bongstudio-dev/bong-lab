/* Botón fijo: un llamado que acompaña el scroll (Sumate al equipo, Contacto). */
(function () {
  var SECCIONES = [
    { id: "productos", titulo: "Nutrientes para cada cultivo", texto: "Urea granulada y soluciones para el campo argentino, con recomendaciones por cultivo y zona.", boton: "Ver productos", foto: 1 },
    { id: "planta", titulo: "Una planta que mira hacia adelante", texto: "Producimos en Bahía Blanca con estándares internacionales de seguridad y cuidado del ambiente.", boton: "Visitá la planta", foto: 3 },
    { id: "equipo", titulo: "Hecho por personas", texto: "Más de novecientas personas trabajan en planta y oficinas. Buscamos gente que quiera crecer con nosotros.", boton: "Sumate al equipo", foto: 2 }
  ];
  var COLORES = { azul: ["#003DA5", "#FFFEEF"], verde: ["#2D8035", "#FFFEEF"], tiza: ["#FFFEEF", "#003DA5"], negro: ["#0A1E4A", "#FFFEEF"] };
  // La flecha corta del sistema (la misma de la portada del Lab).
  var FLECHA = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M7 12h10M13 8l4 4-4 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  Libreria.sumar({
    id: "boton-fijo", nombre: "Botón fijo", grupo: "Navegación", alto: 680,
    bajada: "Un llamado a la acción que acompaña el scroll y cambia según la sección.",
    nota: "Scrolleá dentro del escenario para verlo andar.",
    variantes: [["centro", "Centrado entre secciones"], ["abajo", "Pastilla abajo"], ["esquina", "Esquina que se abre"]],
    controles: [
      { id: "color", tipo: "seg", etiqueta: "Color", def: "azul", aplica: { attr: "data-color" }, opciones: [["azul", "Azul"], ["verde", "Verde"], ["tiza", "Tiza"], ["negro", "Tinta"]] },
      { id: "alto", tipo: "seg", etiqueta: "Tamaño (Web/Botón S · M · L)", def: 44, aplica: { var: "--alto", unidad: "px" }, opciones: [[40, "S 40"], [44, "M 44"], [48, "L 48"]] },
      { id: "borde", tipo: "rango", etiqueta: "Distancia al borde", unidad: "px", min: 12, max: 64, def: 24, aplica: { var: "--borde", unidad: "px" } },
      { id: "cambia", tipo: "interr", etiqueta: "El texto cambia con la sección", def: true }
    ],
    css: function () {
      return [
        ".bf { --alto: 44px; --borde: 24px; --curva: cubic-bezier(.22, 1, .36, 1); font: 400 16px/1.5 \"DM Sans\", \"Helvetica Neue\", Arial, sans-serif; color: #0A1E4A; }",
        Object.keys(COLORES).map(function (k) { return '.bf[data-color="' + k + '"] { --b-fondo: ' + COLORES[k][0] + '; --b-tinta: ' + COLORES[k][1] + '; }'; }).join("\n"),
        ".bf h1, .bf h2 { margin: 0; font-family: \"Familjen Grotesk\", \"Helvetica Neue\", Arial, sans-serif; font-weight: 500; letter-spacing: -.03em; line-height: 1; }",
        ".bf__hero { min-height: 92vh; display: flex; flex-direction: column; justify-content: flex-end; padding: 0 clamp(20px, 5vw, 64px) 56px; background: #003DA5; color: #FFFEEF; }",
        ".bf__hero h1 { font-size: clamp(44px, 8vw, 112px); max-width: 12ch; }",
        ".bf__sec { min-height: 90vh; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 32px; align-items: center; padding: 96px clamp(20px, 5vw, 64px); }",
        ".bf__sec h2 { font-size: clamp(32px, 4.4vw, 60px); margin-bottom: 18px; }",
        ".bf__sec p { margin: 0; max-width: 40ch; color: #44506E; }",
        ".bf__sec img { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; border-radius: 26px; display: block; }",
        ".bf__fin { padding: 120px clamp(20px, 5vw, 64px); background: #0A1E4A; color: #FFFEEF; }",
        "",
        "/* El botón */",
        ".bf-boton { display: inline-flex; align-items: center; gap: 10px; height: var(--alto); padding: 0 calc(var(--alto) * .45) 0 calc(var(--alto) * .5); border-radius: 999px;",
        "  background: var(--b-fondo); color: var(--b-tinta); font-size: calc(var(--alto) * .33); font-weight: 500; text-decoration: none; white-space: nowrap;",
        "  box-shadow: 0 10px 28px -12px rgba(10, 30, 74, .55); transition: transform .3s var(--curva), background .3s var(--curva); }",
        ".bf-boton:hover { transform: translateY(-2px); }",
        ".bf-boton:active { transform: scale(.97); }",
        ".bf-boton__txt { display: inline-grid; }",
        ".bf-boton__txt > span { grid-area: 1 / 1; transition: opacity .35s var(--curva), transform .45s var(--curva); }",
        ".bf-boton__txt > span:not(.ve) { opacity: 0; transform: translateY(60%); }",
        ".bf-boton__txt > span.fue { transform: translateY(-60%); }",
        "",
        "/* Centrado entre secciones: el botón queda pegado al centro mientras pasa su tramo. */",
        ".bf-tramo { height: 70vh; display: flex; justify-content: center; }",
        ".bf-tramo .bf-boton { position: sticky; top: calc(50% - var(--alto) / 2); }",
        "",
        "/* Pastilla abajo: fija, aparece al dejar el hero y se va al llegar al final. */",
        ".bf-fijo { position: fixed; z-index: 20; left: 50%; bottom: var(--borde); transform: translate(-50%, calc(100% + var(--borde) + 8px)); transition: transform .6s var(--curva); }",
        ".bf-fijo.ve { transform: translate(-50%, 0); }",
        "",
        "/* Esquina que se abre: un círculo con flecha que se abre en pastilla. */",
        ".bf-esq { position: fixed; z-index: 20; right: var(--borde); bottom: var(--borde); opacity: 0; transform: translateY(16px); transition: opacity .4s var(--curva), transform .5s var(--curva); }",
        ".bf-esq.ve { opacity: 1; transform: none; }",
        ".bf-esq .bf-boton { padding: 0; gap: 0; width: var(--alto); justify-content: flex-end; overflow: hidden; transition: width .55s var(--curva), padding .55s var(--curva); }",
        ".bf-esq .bf-boton svg { flex: none; width: var(--alto); }",
        ".bf-esq .bf-boton__txt { opacity: 0; transition: opacity .3s var(--curva); }",
        ".bf-esq.abierto .bf-boton, .bf-esq .bf-boton:hover { width: var(--ancho, 210px); padding-left: calc(var(--alto) * .5); }",
        ".bf-esq.abierto .bf-boton__txt, .bf-esq .bf-boton:hover .bf-boton__txt { opacity: 1; transition-delay: .12s; }",
        "",
        "@media (max-width: 760px) { .bf__sec { grid-template-columns: 1fr; padding: 64px 20px; } }",
        "@media (prefers-reduced-motion: reduce) { .bf * { transition-duration: .01ms !important; } }"
      ].join("\n");
    },
    html: function (s) {
      var v = s.variante;
      var etiquetas = s.cambia ? SECCIONES.map(function (x) { return x.boton; }) : ["Sumate al equipo"];
      var txt = '<span class="bf-boton__txt">' + etiquetas.map(function (t, i) { return '<span' + (i === 0 ? ' class="ve"' : '') + '>' + t + '</span>'; }).join("") + '</span>';
      var boton = function (t) { return '<a class="bf-boton" href="#">' + (t || txt) + FLECHA + '</a>'; };
      var h = '<div class="bf" data-c="boton-fijo">\n  <header class="bf__hero"><h1>Damos vida a la tierra</h1></header>\n';
      SECCIONES.forEach(function (x) {
        h += '  <section class="bf__sec" data-boton="' + x.boton + '"><div><h2>' + x.titulo + '</h2><p>' + x.texto + '</p></div><img src="../novedades/fotos/demo-' + x.foto + '.webp" alt=""></section>\n';
        if (v === "centro") h += '  <div class="bf-tramo">' + boton('<span class="bf-boton__txt"><span class="ve">' + (s.cambia ? x.boton : "Sumate al equipo") + '</span></span>') + '</div>\n';
      });
      h += '  <footer class="bf__fin"><h2>Final de la página</h2></footer>\n';
      if (v === "abajo") h += '  <div class="bf-fijo">' + boton() + '</div>\n';
      if (v === "esquina") h += '  <div class="bf-esq">' + boton() + '</div>\n';
      return h + '</div>';
    },
    js: function (s) {
      if (s.variante === "centro") return "";
      return [
        "(function () {",
        "  var raiz = document.querySelector('.bf'), caja = raiz.querySelector('.bf-fijo, .bf-esq');",
        "  var hero = raiz.querySelector('.bf__hero'), fin = raiz.querySelector('.bf__fin');",
        "  var partes = caja.querySelectorAll('.bf-boton__txt > span'), secs = raiz.querySelectorAll('[data-boton]');",
        "  var esquina = caja.classList.contains('bf-esq'), actual = 0, enHero = true, enFin = false;",
        "  function mostrar() { caja.classList.toggle('ve', !enHero && !enFin); }",
        "  // El texto cambia cuando una sección cruza la mitad de la pantalla.",
        "  function elegir(i) {",
        "    if (partes.length < 2 || i === actual) return;",
        "    var a = partes[actual], b = partes[i]; actual = i;",
        "    a.classList.remove('ve'); a.classList.add('fue');",
        "    b.classList.remove('fue'); void b.offsetWidth; b.classList.add('ve');",
        "  }",
        "  // La pastilla de la esquina se abre sola en la sección de equipo.",
        "  function medir() { var b = caja.querySelector('.bf-boton'); var t = partes[actual]; raiz.style.setProperty('--ancho', Math.ceil(t.scrollWidth + b.offsetHeight * 1.5) + 'px'); }",
        "  new IntersectionObserver(function (es) { enHero = es[0].isIntersecting; mostrar(); }, { threshold: 0.15 }).observe(hero);",
        "  new IntersectionObserver(function (es) { enFin = es[0].isIntersecting; mostrar(); }, { threshold: 0.4 }).observe(fin);",
        "  var mitad = new IntersectionObserver(function (es) {",
        "    es.forEach(function (e) {",
        "      if (!e.isIntersecting) return;",
        "      var i = Array.prototype.indexOf.call(secs, e.target);",
        "      elegir(i);",
        "      if (esquina) { medir(); caja.classList.toggle('abierto', i === secs.length - 1); }",
        "    });",
        "  }, { rootMargin: '-50% 0px -50% 0px' });",
        "  secs.forEach(function (x) { mitad.observe(x); });",
        "  if (esquina) medir();",
        "})();"
      ].join("\n");
    }
  });
})();
