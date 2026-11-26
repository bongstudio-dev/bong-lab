/* Solapas: las secciones hermanas de una página (Inversores, Sala de prensa) como solapas que salen del borde de arriba de la
   hoja. Cambian el contenido en el lugar, sin cambiar de página. El CSS es la pieza "solapas" de base.css (variables --sol-*,
   que se ajustan en vivo en profertil/solapas-tweak/).

   PFSolapas.armar(nav, alElegir)
     nav: el <nav class="pf-solapas"> con su <span class="pf-solapas__ind"> y un botón por sección con data-solapa="id".
       Si el nav es role="tablist", cada botón es un role="tab": se marcan también aria-selected y el tabIndex, y las flechas
       del teclado pasan de una a otra.
     alElegir(id): lo que hace la página al tocar otra solapa (cambiar la lista o el panel y llamar a marcar).
     Devuelve { marcar(id, animar), ubicar() }.

   marcar(id, animar): elige la solapa. El papel (el indicador) viaja de la que se deja a la nueva; el fondo de cada solapa
     cambia con su demora (CSS). Sin animar (al cargar o al llegar con otra sección en la dirección) todo queda en su lugar
     desde el primer cuadro: ni el indicador viaja ni las solapas funden.
   El indicador se ubica por JS (ancho y posición de la elegida) y se vuelve a ubicar al cambiar el ancho o al cargar las fuentes. */
window.PFSolapas = (function () {
  function armar(nav, alElegir) {
    var ind = nav.querySelector(".pf-solapas__ind"), tabs = nav.getAttribute("role") === "tablist";
    function botones() { return Array.prototype.slice.call(nav.querySelectorAll(":scope > [data-solapa]")); }
    function elegida() { return nav.querySelector(':scope > [data-solapa][aria-pressed="true"]'); }
    /* La tinta: una copia de las solapas con el texto azul, dentro del papel y recortada por él. Se mueve al revés que el papel con la
       misma transición, así queda quieta sobre las solapas de verdad: el texto es azul justo donde hay papel y claro donde hay vidrio,
       al píxel, también a mitad de una letra mientras el papel viaja. Es solo dibujo: inerte y fuera del árbol de accesibilidad. */
    var ventana = document.createElement("span"), tinta = document.createElement("span");
    ventana.className = "pf-solapas__ventana"; tinta.className = "pf-solapas__tinta";
    ventana.setAttribute("aria-hidden", "true"); tinta.inert = true;
    botones().forEach(function (b) {
      var c = document.createElement("span");
      c.className = "pf-solapas__copia"; c.innerHTML = b.innerHTML;
      tinta.appendChild(c);
    });
    ventana.appendChild(tinta); ind.appendChild(ventana);
    function ubicar(animar) {
      var b = elegida();
      if (!b || !b.offsetWidth) return;
      if (!animar) ind.classList.add("pf-quieto");
      // Cada copia va exactamente encima de su solapa (medidas con decimales, desde el borde interno del nav, que es el origen del papel).
      var rn = nav.getBoundingClientRect(), x0 = rn.left + nav.clientLeft;
      tinta.style.width = nav.clientWidth + "px"; tinta.style.height = nav.clientHeight + "px";
      botones().forEach(function (o, i) {
        var r = o.getBoundingClientRect(), c = tinta.children[i];
        c.style.left = (r.left - x0) + "px"; c.style.width = r.width + "px";
      });
      tinta.style.transform = "translateX(" + (-b.offsetLeft) + "px)";
      ind.style.width = b.offsetWidth + "px";
      ind.style.transform = "translateX(" + b.offsetLeft + "px)";
      if (!animar) { void ind.offsetWidth; ind.classList.remove("pf-quieto"); }
    }
    function marcar(id, animar) {
      if (!animar) nav.classList.add("pf-quieto");
      botones().forEach(function (b) {
        var si = b.dataset.solapa === id;
        b.setAttribute("aria-pressed", String(si));
        if (tabs) { b.setAttribute("aria-selected", String(si)); b.tabIndex = si ? 0 : -1; }
      });
      ubicar(animar);
      if (!animar) { void nav.offsetWidth; nav.classList.remove("pf-quieto"); }
    }
    nav.addEventListener("click", function (e) {
      var b = e.target.closest("[data-solapa]");
      if (b && b !== elegida()) alElegir(b.dataset.solapa);
    });
    if (tabs) nav.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      var bs = botones(), i = bs.indexOf(elegida()) + (e.key === "ArrowRight" ? 1 : -1);
      var b = bs[(i + bs.length) % bs.length];
      alElegir(b.dataset.solapa); b.focus();
    });
    window.addEventListener("resize", function () { ubicar(false); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ubicar(false); });
    requestAnimationFrame(function () { ubicar(false); });
    return { marcar: marcar, ubicar: function () { ubicar(false); } };
  }
  return { armar: armar };
})();
