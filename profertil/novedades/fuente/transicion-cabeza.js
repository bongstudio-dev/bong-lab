/* Corre en el head, antes de pintar: si se llega desde otra página con la persiana,
   la deja tapando para que siga de largo. */
(function () {
  var llega = null;
  try { llega = sessionStorage.getItem("pf-tr-llega"); sessionStorage.removeItem("pf-tr-llega"); } catch (e) {}
  if (llega && !matchMedia("(prefers-reduced-motion: reduce)").matches) document.documentElement.classList.add("pf-tr-tapa");
})();
