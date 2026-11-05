/* Transición entre Novedades y las Notas, más el panel para elegirla. */
(function () {
  var d = document.documentElement, T = window.PF_TR, c = T.c;
  var quieto = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var velo = document.getElementById("pf-tr-velo");
  var NOMBRES = { persiana: "Persiana", animada: "Persiana animada", fundido: "Fundido", ninguna: "Ninguna" };
  function esPersiana() { return c.v === "persiana" || c.v === "animada"; }
  // Cuánto se queda tapando antes de cambiar: con el logo animado, hasta que termina de armarse.
  function sostiene() { return c.v === "animada" ? c.dur * .2 + c.la : c.dur * 1.45; }
  var ocupado = false;
  function espera(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function guardar() { try { localStorage.setItem("pf-transicion", JSON.stringify(c)); } catch (e) {} }

  function aplicar() {
    d.style.setProperty("--pf-tr-dur", c.dur + "ms");
    d.style.setProperty("--pf-tr-curva", T.curvas[c.curva]);
    d.style.setProperty("--pf-tr-color", "var(--" + c.color + ")");
    d.setAttribute("data-tr-color", c.color);
    d.setAttribute("data-tr-v", c.v);
    d.style.setProperty("--pf-tr-la", c.la + "ms");
    // El fundido entre páginas lo hace el navegador: hay que avisarle en las dos.
    var s = document.getElementById("pf-tr-vt");
    if (c.v === "fundido" && T.vt && !s) {
      s = document.createElement("style"); s.id = "pf-tr-vt"; s.textContent = "@view-transition { navigation: auto; }";
      document.head.appendChild(s);
    } else if (c.v !== "fundido" && s) s.remove();
  }

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
    if (u.origin !== location.origin || !/\/novedades\//.test(u.pathname)) return;
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

  /* Probar sin cambiar de página. */
  async function probar() {
    if (ocupado || c.v === "ninguna" || quieto) return; ocupado = true;
    if (esPersiana()) {
      velo.className = "pf-tr-velo pf-entra"; await espera(sostiene());
      velo.className = "pf-tr-velo pf-sale"; await espera(c.dur);
      velo.className = "pf-tr-velo";
    } else {
      d.classList.add("pf-tr-fuera"); await espera(c.dur * .7);
      d.classList.remove("pf-tr-fuera"); d.classList.add("pf-tr-llega"); await espera(c.dur);
      d.classList.remove("pf-tr-llega");
    }
    ocupado = false;
  }

  /* Panel. */
  var ICONO = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v6H4V5Zm0 8h16v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6Z" opacity=".45"/><path fill="currentColor" d="M4 11h16v2H4z"/></svg>';
  function seg(id, ops) {
    return '<div class="pf-tr-seg" data-k="' + id + '">' + ops.map(function (o) {
      return '<button type="button" data-v="' + o[0] + '"' + (o[2] ? ' class="pf-tr-punto" style="--c: var(--' + o[0] + ')" aria-label="' + o[1] + '"' : '') + ">" + (o[2] ? "" : o[1]) + "</button>";
    }).join("") + "</div>";
  }
  var p = document.createElement("div");
  p.className = "pf-tr-panel";
  p.innerHTML =
    '<button type="button" class="pf-tr-abrir" aria-expanded="false" aria-controls="pf-tr-caja">' + ICONO + '<span id="pf-tr-nombre"></span></button>' +
    '<div class="pf-tr-caja" id="pf-tr-caja" role="group" aria-label="Transición entre páginas" hidden>' +
      '<div class="pf-tr-fila"><span>Transición</span>' + seg("v", [["persiana", "Persiana"], ["animada", "Animada"], ["fundido", "Fundido"], ["ninguna", "Ninguna"]]) + "</div>" +
      '<div class="pf-tr-fila" data-solo="persiana animada"><span>Color</span>' + seg("color", [["azul", "Azul", 1], ["verde", "Verde", 1], ["amarillo", "Amarillo", 1], ["terra", "Terra", 1]]) + "</div>" +
      '<label class="pf-tr-fila" data-solo="persiana animada fundido"><span>Duración <output id="pf-tr-dur"></output></span><input type="range" min="300" max="1400" step="20" id="pf-tr-rango"></label>' +
      '<label class="pf-tr-fila" data-solo="animada"><span>Logo <output id="pf-tr-la"></output></span><input type="range" min="700" max="1600" step="50" id="pf-tr-rango-la"></label>' +
      '<div class="pf-tr-fila" data-solo="persiana animada fundido"><span>Curva</span>' + seg("curva", [["base", "Base"], ["fuerte", "Fuerte"]]) + "</div>" +
      '<button type="button" class="pf-tr-probar" data-solo="persiana animada fundido">Probar</button>' +
    "</div>";
  document.body.appendChild(p);
  var caja = p.querySelector(".pf-tr-caja"), abrir = p.querySelector(".pf-tr-abrir"), rango = p.querySelector("#pf-tr-rango"), rangoLa = p.querySelector("#pf-tr-rango-la");

  function pintar() {
    document.getElementById("pf-tr-nombre").textContent = NOMBRES[c.v];
    p.querySelectorAll(".pf-tr-seg").forEach(function (g) {
      g.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.v === c[g.dataset.k]); });
    });
    p.querySelectorAll("[data-solo]").forEach(function (el) { el.hidden = el.dataset.solo.split(" ").indexOf(c.v) < 0; });
    rango.value = c.dur; document.getElementById("pf-tr-dur").textContent = c.dur + " ms";
    rangoLa.value = c.la; document.getElementById("pf-tr-la").textContent = c.la + " ms";
  }
  pintar();

  function mostrar(si) { caja.hidden = !si; abrir.setAttribute("aria-expanded", si); }
  abrir.addEventListener("click", function () { mostrar(caja.hidden); });
  p.addEventListener("click", function (e) {
    var b = e.target.closest(".pf-tr-seg button"); if (!b) return;
    c[b.parentNode.dataset.k] = b.dataset.v; aplicar(); guardar(); pintar();
  });
  rango.addEventListener("input", function () { c.dur = +rango.value; aplicar(); guardar(); pintar(); });
  rangoLa.addEventListener("input", function () { c.la = +rangoLa.value; aplicar(); guardar(); pintar(); });
  p.querySelector(".pf-tr-probar").addEventListener("click", probar);
  document.addEventListener("click", function (e) { if (!caja.hidden && !p.contains(e.target)) mostrar(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !caja.hidden) { mostrar(false); abrir.focus(); } });
})();
