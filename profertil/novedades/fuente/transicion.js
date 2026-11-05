/* Persiana entre Novedades y las Notas: tapa, cambia de página y en la nueva sigue de largo. */
(function () {
  var d = document.documentElement, velo = document.getElementById("pf-tr-velo");
  var quieto = matchMedia("(prefers-reduced-motion: reduce)").matches, ocupado = false;
  function dur() { return parseFloat(getComputedStyle(d).getPropertyValue("--pf-tr-dur")) || 700; }

  if (d.classList.contains("pf-tr-tapa")) {
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      velo.className = "pf-tr-velo pf-sale"; d.classList.remove("pf-tr-tapa");
      setTimeout(function () { velo.className = "pf-tr-velo"; }, dur() + 40);
    }); });
  }

  document.addEventListener("click", function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest("a[href]");
    if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
    var u = new URL(a.href, location.href);
    if (u.origin !== location.origin || !/\/novedades\//.test(u.pathname)) return;
    if (u.pathname === location.pathname && u.search === location.search) return;
    if (quieto || ocupado) return;
    e.preventDefault(); ocupado = true;
    velo.className = "pf-tr-velo pf-entra";
    setTimeout(function () {
      try { sessionStorage.setItem("pf-tr-llega", "1"); } catch (err) {}
      location.href = u.href;
    }, dur() * 1.45);
  });

  // Al volver con el botón del navegador la página puede venir congelada tal cual quedó.
  addEventListener("pageshow", function (e) {
    if (e.persisted) { ocupado = false; velo.className = "pf-tr-velo"; d.classList.remove("pf-tr-tapa"); }
  });
})();
