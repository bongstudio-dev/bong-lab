/* Barra de vista: la fila de selectores (vista, orden, pestañas) que queda bajo la barra azul en las listas.
   La usan Biblioteca, Hojas de seguridad, Novedades y Sala de prensa. El CSS está en base.css ("Barra de vista").

   En el celular nada que acompañe al scroll se mueve por código: la fila la mueve el navegador. En su lugar es contenido; pegada
   es sticky; suelta es relative con desplazamiento. En el iPhone, mientras la barra del navegador cambia de alto, la página recibe
   la posición del scroll cada ~100 ms: lo que se ubica según ese número llega tarde y salta.

   PFBarraVista.queVuelve(fila, marca, topFila, barraAbajo)
     - Bajando, la fila va con su caja como cualquier contenido y la tapa la barra azul: no se esconde con animación.
     - Subiendo, si su lugar ya quedó tapado, entra desde atrás de la barra (380 ms con la curva --ease y fundido de 260 ms) y
       queda sticky debajo. Si su lugar todavía se ve, no se toca: baja sola con la caja.
     - Si se vuelve a bajar con la fila pegada, se suelta donde está y se va con el scroll.
     - Arriba de todo, el sticky se suelta solo en su lugar.
     fila: la barra. marca: un div de alto 0 (.pf-vuelve-marca) justo antes, que dice dónde está su lugar.
     topFila(): dónde queda pegada. barraAbajo(): el borde de abajo de la barra azul (si no se pasa, se mide #pf-top).
     Devuelve { mover(dy), saltar(), fija(), apagar() }: mover lo llama el listener de dirección del scroll de la página.

   PFBarraVista.alPixel(caja, cabecera)
     La caja que contiene la fila empieza en un píxel entero. Una cabecera de alto fraccionario (alto en svh, título de cuerpo
     fluido) deja la lista en, por ejemplo, 568,39 px; en el iPhone, mientras se scrollea, la fila pegada y la barra azul
     redondean distinto y la fila sube y baja un píxel. La caja baja lo que falta para llegar al entero (menos de 1 px) y se
     vuelve a medir si la cabecera cambia de alto.

   Ningún ancestro de la fila recorta (overflow hidden o clip) con esquinas redondeadas: en el iPhone la fila pegada dentro de una
   caja así sube y baja un píxel mientras se scrollea. Si hace falta recortar lo que se desliza al cambiar de vista, el recorte va en
   la lista, debajo de la fila (.pf-docs en la Biblioteca, .pf-panel en la Sala). */
window.PFBarraVista = (function () {
  var CURVA = "cubic-bezier(.22, 1, .36, 1)";   // --ease

  function bajoBarra() { var b = document.getElementById("pf-top"); return b ? b.offsetHeight : 0; }

  function queVuelve(fila, marca, topFila, barraAbajo) {
    barraAbajo = barraAbajo || bajoBarra;
    fila.classList.add("pf-vuelve");
    var estado = "lugar", entrada = null, fundido = null;   // lugar | fija | suelta
    function limpiar() {
      if (entrada) { entrada.cancel(); entrada = null; }
      if (fundido) { fundido.cancel(); fundido = null; }
      fila.classList.remove("pf-vuelve--fija", "pf-vuelve--suelta"); fila.style.removeProperty("--vuelve-top");
      estado = "lugar";
    }
    function fijar(animar) {
      var r = fila.getBoundingClientRect(), t = topFila(), b = barraAbajo(), h = fila.offsetHeight, oculta = r.bottom <= b;
      var desde = oculta ? b - t - h - 9 : r.top - t;   // tapada: arranca entera detrás de la barra; a la vista: desde donde está
      limpiar(); fila.style.setProperty("--vuelve-pega", t + "px"); fila.classList.add("pf-vuelve--fija"); estado = "fija";
      if (!animar || !fila.animate || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      entrada = fila.animate([{ transform: "translateY(" + desde + "px)" }, { transform: "none" }], { duration: 380, easing: CURVA });
      if (oculta) fundido = fila.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, easing: "ease" });
    }
    function soltar() {
      var r = fila.getBoundingClientRect().top, s = marca.getBoundingClientRect().top;
      limpiar(); fila.style.setProperty("--vuelve-top", (r - s) + "px"); fila.classList.add("pf-vuelve--suelta"); estado = "suelta";
    }
    return {
      fija: function () { return estado === "fija"; },
      // dy: el sentido del gesto (la página lee la dirección con un umbral de 8 px).
      mover: function (dy) {
        var s = marca.getBoundingClientRect().top;
        if (s >= topFila()) { if (estado !== "lugar") limpiar(); return; }
        if (dy > 0) { if (estado === "fija") soltar(); return; }
        if (estado === "fija") return;
        if (s + fila.offsetHeight > barraAbajo()) return;
        fijar(true);
      },
      // Saltos de scroll que hace la página (filtrar, cambiar de vista): la fila queda a la vista, sin animar.
      saltar: function () { if (marca.getBoundingClientRect().top >= topFila()) limpiar(); else if (estado !== "fija") fijar(false); },
      apagar: limpiar
    };
  }

  function alPixel(caja, cabecera) {
    caja.classList.add("pf-al-pixel");
    function medir() {
      var ya = parseFloat(caja.style.getPropertyValue("--pf-ajuste")) || 0;
      var top = caja.getBoundingClientRect().top + window.scrollY - ya, aj = Math.ceil(top - 0.001) - top;
      aj = aj < 0.01 ? 0 : Math.round(aj * 64) / 64;   // el navegador ubica en 1/64 de píxel: así cae justo en el entero
      if (Math.abs(aj - ya) > 0.001) caja.style.setProperty("--pf-ajuste", aj + "px");
    }
    if (window.ResizeObserver && cabecera) new ResizeObserver(medir).observe(cabecera);
    window.addEventListener("resize", medir);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(medir);
    medir();
    return medir;
  }

  return { queVuelve: queVuelve, alPixel: alPixel, bajoBarra: bajoBarra };
})();
