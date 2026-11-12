/* Transición entre Novedades, la Biblioteca y sus páginas. En la Biblioteca va fija, sin panel para elegirla:
   usa la que dejó la cabeza (la misma que Novedades, así entrar y salir coinciden). */
(function () {
  var d = document.documentElement, T = window.PF_TR, c = T.c;
  var quieto = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var velo = document.getElementById("pf-tr-velo");
  function esPersiana() { return c.v === "persiana" || c.v === "animada"; }
  // Cuánto se queda tapando antes de cambiar: con el logo animado, hasta que termina de armarse.
  function sostiene() { return c.v === "animada" ? c.dur * .2 + c.la : c.dur * 1.45; }
  var ocupado = false;
  function espera(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  /* Llegada: la persiana sigue de largo; el fundido sin View Transitions termina de subir. */
  function llegar() {
    if (d.classList.contains("pf-tr-tapa")) {
      requestAnimationFrame(function () { requestAnimationFrame(function () {
        velo.className = "pf-tr-velo pf-sale"; d.classList.remove("pf-tr-tapa");
        setTimeout(function () { velo.className = "pf-tr-velo"; }, c.dur + 40);
      }); });
    }
    if (d.classList.contains("pf-tr-llega")) setTimeout(function () { d.classList.remove("pf-tr-llega"); }, c.dur + 40);
  }
  llegar();

  /* Salida: se tapa (o se funde) y recién ahí se cambia de página. */
  async function tapar() {
    if (esPersiana()) { velo.className = "pf-tr-velo pf-entra"; await espera(sostiene()); }
    else { d.classList.add("pf-tr-fuera"); await espera(c.dur * .7); }
  }
  document.addEventListener("click", function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest("a[href]");
    if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
    var u = new URL(a.href, location.href);
    if (u.origin !== location.origin || !/\/(novedades|biblioteca)\//.test(u.pathname)) return;
    if (u.pathname === location.pathname && u.search === location.search) return;
    if (c.v === "ninguna" || quieto || ocupado) return;
    if (c.v === "fundido" && T.vt) return;
    e.preventDefault(); ocupado = true;
    tapar().then(function () {
      try { sessionStorage.setItem("pf-tr-llega", c.v); } catch (err) {}
      location.href = u.href;
    });
  });
  // Al volver con el botón del navegador la página puede venir congelada tal cual quedó.
  addEventListener("pageshow", function (e) {
    if (!e.persisted) return;
    ocupado = false; velo.className = "pf-tr-velo"; d.classList.remove("pf-tr-fuera", "pf-tr-llega", "pf-tr-tapa");
  });

})();
