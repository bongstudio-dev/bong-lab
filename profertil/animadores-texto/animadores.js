/* ==========================================================================
   Animadores de texto · Bong Studio
   Parte el texto (por letra, palabra, linea o bloque), le pone a cada parte
   su indice (--k) y lo dispara al entrar en pantalla. El movimiento lo hace
   animadores.css. Uso: <h2 data-anim="ventana">Texto</h2>
   Atributos para pisar el animador: data-por, data-desde, data-dur,
   data-paso, data-dist, data-disparo (vista | carga | manual).
   ========================================================================== */
(function () {
  var PRESETS = {
    sube:       { efecto: "mueve",      por: "palabra", desde: "abajo", dur: 640,  paso: 45, dist: "0.35em" },
    ventana:    { efecto: "ventana",    por: "palabra", desde: "abajo", dur: 760,  paso: 60 },
    persiana:   { efecto: "ventana",    por: "linea",   desde: "abajo", dur: 820,  paso: 90 },
    grano:      { efecto: "mueve",      por: "letra",   desde: "abajo", dur: 520,  paso: 18, dist: "0.25em" },
    desliza:    { efecto: "mueve",      por: "palabra", desde: "izq",   dur: 600,  paso: 40, dist: "0.5em" },
    enfoque:    { efecto: "desenfoca",  por: "palabra", desde: "abajo", dur: 760,  paso: 55, dist: "0.12em" },
    asoma:      { efecto: "escala",     por: "palabra", desde: "abajo", dur: 520,  paso: 35 },
    cortina:    { efecto: "cortina",    por: "bloque",  desde: "izq",   dur: 900,  paso: 0 },
    maquina:    { efecto: "escribe",    por: "letra",   desde: "abajo", dur: 10,   paso: 28 },
    funde:      { efecto: "funde",      por: "palabra", desde: "abajo", dur: 500,  paso: 30 },
    enciende:   { efecto: "enciende",   por: "palabra", desde: "abajo", dur: 0,    paso: 0 },
    relevo:     { efecto: "relevo",     intervalo: 2400 },
    cifra:      { efecto: "cifra",      dur: 1400 },
    marquesina: { efecto: "marquesina", dur: 26000 }
  };
  var DIR = {
    abajo:  { dx: 0, dy: 1, vx: "0%", vy: "105%", clip: "inset(100% 0 0 0)" },
    arriba: { dx: 0, dy: -1, vx: "0%", vy: "-105%", clip: "inset(0 0 100% 0)" },
    izq:    { dx: -1, dy: 0, vx: "-105%", vy: "0%", clip: "inset(0 100% 0 0)" },
    der:    { dx: 1, dy: 0, vx: "105%", vy: "0%", clip: "inset(0 0 0 100%)" }
  };
  var reducido = matchMedia("(prefers-reduced-motion: reduce)");

  function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function u(txt, k) { return '<span class="ta-u"><span class="ta-i" style="--k:' + k + '">' + esc(txt) + "</span></span>"; }
  function vel() { return parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--ta-vel")) || 1; }

  // Lee el animador (preset + atributos que lo pisan).
  function config(el) {
    var p = PRESETS[el.dataset.anim] || PRESETS.sube, c = {};
    for (var k in p) c[k] = p[k];
    ["efecto", "por", "desde", "dist", "disparo"].forEach(function (a) { if (el.dataset[a]) c[a] = el.dataset[a]; });
    ["dur", "paso", "intervalo"].forEach(function (a) { if (el.dataset[a]) c[a] = parseFloat(el.dataset[a]); });
    c.disparo = c.disparo || "vista";
    return c;
  }

  function partir(el, c, texto) {
    var palabras = texto.split(/\s+/), k = 0, h;
    if (c.por === "letra") {
      h = palabras.map(function (w) {
        return '<span class="ta-w">' + Array.from(w).map(function (ch) { return u(ch, k++); }).join("") + "</span>";
      }).join(" ");
    } else if (c.por === "bloque") {
      h = u(texto, 0);
    } else {
      h = palabras.map(function (w) { return u(w, k++); }).join(" ");
    }
    el.innerHTML = '<span aria-hidden="true">' + h + "</span>";
    if (c.por === "linea") {
      // Agrupa las palabras ya puestas segun la linea en la que cayeron.
      // (se mide con las palabras en linea: el bloque por linea se pone despues)
      el.classList.remove("ta-por-linea");
      var lineas = [], top = null;
      el.querySelectorAll(".ta-u").forEach(function (s) {
        var t = Math.round(s.offsetTop);
        if (t !== top) { lineas.push([]); top = t; }
        lineas[lineas.length - 1].push(s.textContent);
      });
      el.innerHTML = '<span aria-hidden="true">' + lineas.map(function (l, i) { return u(l.join(" "), i); }).join("") + "</span>";
      el.classList.add("ta-por-linea");
    }
  }

  function relevo(el, c, texto) {
    var lista = (el.dataset.palabras || "").split("|").filter(Boolean);
    var partes = texto.split("{}");
    el.innerHTML = '<span aria-hidden="true">' + esc(partes[0]) + '<span class="ta-relevo">' +
      lista.map(function (w, i) { return '<span class="' + (i ? "" : "ve") + '">' + esc(w) + "</span>"; }).join("") +
      "</span>" + esc(partes[1] || "") + "</span>";
    var i = 0, spans = el.querySelectorAll(".ta-relevo > span");
    function paso() {
      var a = spans[i]; i = (i + 1) % spans.length; var b = spans[i];
      a.classList.remove("ve"); a.classList.add("fue");
      b.classList.remove("fue"); void b.offsetWidth; b.classList.add("ve");
      el._ta = setTimeout(paso, c.intervalo * vel());
    }
    el._taArranca = function () { clearTimeout(el._ta); el._ta = setTimeout(paso, c.intervalo * vel()); };
  }

  function cifra(el, c, texto) {
    var m = texto.match(/\d[\d.]*(,\d+)?/);
    el.innerHTML = '<span aria-hidden="true">' + esc(texto) + "</span>";
    if (!m) return;
    var dec = m[1] ? m[1].length - 1 : 0;
    var fin = parseFloat(m[0].replace(/\./g, "").replace(",", "."));
    var antes = texto.slice(0, m.index), despues = texto.slice(m.index + m[0].length), span = el.firstChild;
    function fmt(n) { return antes + n.toLocaleString("es-AR", { minimumFractionDigits: dec, maximumFractionDigits: dec }) + despues; }
    span.textContent = fmt(0);
    el._taArranca = function () {
      if (reducido.matches) { span.textContent = fmt(fin); return; }
      var t0 = performance.now(), dur = c.dur * vel();
      cancelAnimationFrame(el._ta);
      (function tic(t) {
        var x = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - x, 3);
        span.textContent = fmt(fin * e);
        if (x < 1) el._ta = requestAnimationFrame(tic);
      })(t0);
    };
  }

  function montar(el) {
    var c = config(el);
    if (el.dataset.taTexto == null) el.dataset.taTexto = el.textContent.trim().replace(/\s+/g, " ");
    var texto = el.dataset.taTexto;
    clearTimeout(el._ta); cancelAnimationFrame(el._ta); el._taArranca = null;
    el.setAttribute("aria-label", texto.replace("{}", (el.dataset.palabras || "").split("|")[0]));
    el.className = el.className.replace(/\bta(-\S+)?\b/g, "").trim() + " ta ta-e-" + c.efecto + " ta-por-" + (c.por || "bloque");
    var d = DIR[c.desde] || DIR.abajo, dist = c.dist || "0.35em";
    el.style.setProperty("--dur", c.dur + "ms");
    el.style.setProperty("--paso", (c.paso || 0) + "ms");
    el.style.setProperty("--dx", "calc(" + d.dx + " * " + dist + ")");
    el.style.setProperty("--dy", "calc(" + d.dy + " * " + dist + ")");
    el.style.setProperty("--vx", d.vx); el.style.setProperty("--vy", d.vy);
    el.style.setProperty("--clip", d.clip);
    if (c.efecto === "relevo") relevo(el, c, texto);
    else if (c.efecto === "cifra") cifra(el, c, texto);
    else if (c.efecto === "marquesina") el.innerHTML = '<span class="ta-tira">' + esc(texto) + '</span><span class="ta-tira" aria-hidden="true">' + esc(texto) + "</span>";
    else partir(el, c, texto);
    el._taPor = c.por;
    return c;
  }

  function disparar(el) {
    el.classList.add("ta-on");
    if (el._taArranca) el._taArranca();
  }

  var mira = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { mira.unobserve(e.target); disparar(e.target); } });
  }, { threshold: 0.2 });

  function iniciar(el) {
    var c = montar(el);
    if (c.disparo === "carga") requestAnimationFrame(function () { disparar(el); });
    else if (c.disparo === "vista") mira.observe(el);
  }
  function repetir(el) { mira.unobserve(el); montar(el); void el.offsetWidth; requestAnimationFrame(function () { disparar(el); }); }

  // Las lineas dependen del ancho: si cambia, se vuelven a armar sin animar.
  var ancho = innerWidth, tR;
  addEventListener("resize", function () {
    clearTimeout(tR);
    tR = setTimeout(function () {
      if (innerWidth === ancho) return; ancho = innerWidth;
      document.querySelectorAll(".ta-por-linea.ta-on").forEach(function (el) { montar(el); el.classList.add("ta-on", "ta-fin"); });
    }, 200);
  });

  window.Animadores = { PRESETS: PRESETS, montar: montar, repetir: repetir, disparar: disparar, iniciar: iniciar };
  // Con <html data-ta-manual> la pagina los arranca sola (lo usa el probador).
  function todos() { if (document.documentElement.hasAttribute("data-ta-manual")) return; document.querySelectorAll("[data-anim]").forEach(iniciar); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { document.fonts.ready.then(todos); });
  else document.fonts.ready.then(todos);
})();
