/* Corre en el head, antes de pintar: lee la transición elegida, deja las variables
   puestas y, si se llega desde otra página con la persiana, la deja tapando. */
(function () {
  var d = document.documentElement, c = null, llega = null;
  try { c = JSON.parse(localStorage.getItem("pf-transicion") || "null"); } catch (e) {}
  c = Object.assign({ v: "persiana", color: "azul", dur: 700, la: 1100, curva: "fuerte" }, c || {});
  var CURVAS = { base: "cubic-bezier(.22, 1, .36, 1)", fuerte: "cubic-bezier(.67, 0, .24, .99)" };
  d.style.setProperty("--pf-tr-dur", c.dur + "ms");
  d.style.setProperty("--pf-tr-curva", CURVAS[c.curva] || CURVAS.fuerte);
  d.style.setProperty("--pf-tr-color", "var(--" + c.color + ")");
  d.setAttribute("data-tr-color", c.color);
  d.setAttribute("data-tr-v", c.v);
  d.style.setProperty("--pf-tr-la", c.la + "ms");
  var vt = !!window.CSSViewTransitionRule;
  if (c.v === "fundido" && vt) {
    var s = document.createElement("style"); s.id = "pf-tr-vt"; s.textContent = "@view-transition { navigation: auto; }";
    document.head.appendChild(s);
  }
  try { llega = sessionStorage.getItem("pf-tr-llega"); sessionStorage.removeItem("pf-tr-llega"); } catch (e) {}
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
    if (llega === c.v && (c.v === "persiana" || c.v === "animada")) d.classList.add("pf-tr-tapa");
    if (llega === "fundido" && c.v === "fundido" && !vt) d.classList.add("pf-tr-llega");
  }
  window.PF_TR = { c: c, vt: vt, curvas: CURVAS };
})();
