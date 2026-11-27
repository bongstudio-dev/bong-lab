// Portadas de esfera: lo que comparten las tres versiones. La barra se vuelve azul al dejar atrás el hero con foto,
// la foto a pantalla completa se corre apenas con el scroll, el índice de las fotos que pasan marca la que está
// a la vista y los datos de contacto se copian con un toque.
(function () {
  var raiz = document.querySelector(".pf-po"), barra = document.getElementById("pf-top");
  var quieto = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hero = document.querySelector(".pf-po-hero--foto");
  var fotos = [].slice.call(document.querySelectorAll(".pf-po-foto"));
  var textos = [].slice.call(document.querySelectorAll(".pf-sf__textos .pf-sf__txt"));
  var indice = [].slice.call(document.querySelectorAll(".pf-po-sfi li"));

  function tic() {
    var H = innerHeight;
    if (hero && barra) barra.classList.toggle("pf-barra--solida", hero.getBoundingClientRect().bottom <= barra.offsetHeight);
    if (!quieto) fotos.forEach(function (f) {
      var r = f.getBoundingClientRect();
      if (r.bottom < 0 || r.top > H) return;
      var p = (H - r.top) / (H + r.height);   // 0 al entrar, 1 al salir
      f.querySelector("img").style.setProperty("--y", ((p - .5) * r.height * .1).toFixed(1) + "px");
    });
    if (indice.length) {
      var a = textos.findIndex(function (t) { return t.classList.contains("pf-en-vista"); });
      indice.forEach(function (li, i) { li.classList.toggle("pf-activa", i === a); });
    }
  }
  var pedido = false;
  function pedir() { if (!pedido) { pedido = true; requestAnimationFrame(function () { pedido = false; tic(); }); } }
  addEventListener("scroll", pedir, { passive: true });
  addEventListener("resize", pedir);
  tic();
  // El índice cambia cuando el componente marca el texto nuevo (después de su propio cálculo del cuadro).
  if (indice.length) textos.forEach(function (t) { new MutationObserver(pedir).observe(t, { attributes: true, attributeFilter: ["class"] }); });

  // Video del hero: quieto con movimiento reducido.
  var video = document.querySelector(".pf-po-hero--foto video");
  if (video && quieto) { video.removeAttribute("autoplay"); video.pause(); }

  // Copiar mail o teléfono, con el aviso de la base.
  if (raiz && raiz.querySelector("[data-copiar]")) {
    var aviso = document.createElement("div"); aviso.className = "pf-aviso"; aviso.setAttribute("role", "status"); document.body.appendChild(aviso);
    var reloj;
    var avisar = function (t) { aviso.textContent = t; aviso.classList.add("pf-on"); clearTimeout(reloj); reloj = setTimeout(function () { aviso.classList.remove("pf-on"); }, 1800); };
    raiz.addEventListener("click", function (e) {
      var b = e.target.closest("[data-copiar]"); if (!b) return;
      var t = b.getAttribute("data-copiar"), ok = function () { avisar(t.indexOf("@") > -1 ? "Mail copiado" : "Teléfono copiado"); };
      try { navigator.clipboard.writeText(t).then(ok, function () { avisar(t); }); } catch (err) { avisar(t); }
    });
  }
})();
