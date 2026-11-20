
(function () {
  "use strict";
  var NOTAS = window.PF_NOTAS;
  var A = /*__ASSETS__*/{};
  function $(id) { return document.getElementById(id); }

/*__COMUN__*/

  var FLECHA_IZQ = '<svg class="pf-flecha" viewBox="0 0 24 24" aria-hidden="true"><path d="M17 12H7M11 8l-4 4 4 4"/></svg>';

  // Qué nota: la de esta página (su dirección es novedades/<archivo>/).
  var pedida = /*__NOTA__*/"";
  var n = NOTAS.filter(function (x) { return x.ar === pedida; })[0] || NOTAS[NOTAS.length - 1];
  // Lo mínimo que necesita una variante de la página (por ejemplo, la cabecera con campo) para leer la nota y el sistema.
  window.PF_NOTA = { n: n, formas: A.formas, formasDe: formasDe, PARES_CONTRA: PARES_CONTRA };

  function url(x) { return "../" + encodeURIComponent(x.ar) + "/"; }
  function lectura(w) { return Math.max(1, Math.round(w / 200)) + " min de lectura"; }
  var ICO_CAL = A.iconos && A.iconos.calendario ? '<svg viewBox="' + A.iconos.calendario.vb + '" aria-hidden="true">' + A.iconos.calendario.d + "</svg>" : "";

  function cabecera(d) {
    var h = '<a class="pf-n-volver" href="../">' + FLECHA_IZQ + "Novedades</a>";
    h += etq(n.tp, { dato: n.anio });
    if (d.ante) h += '<p class="pf-n-ante">' + esc(d.ante) + "</p>";
    h += "<h1" + (n.t.length > 80 ? ' class="pf-largo"' : "") + ">" + esc(n.t) + "</h1>";
    if (d.b) h += '<p class="pf-n-bajada">' + esc(d.b) + "</p>";
    $("pf-cabIn").innerHTML = h;
    // El título toma el color del texto de la etiqueta (el del tipo de nota), así acompaña al campo de la cabecera.
    var e = $("pf-cabIn").querySelector(".pf-etiqueta"), tx = e && e.style.getPropertyValue("--tx").trim();
    $("pf-cabIn").style.setProperty("--pf-titulo", tx || "var(--azul)");
    document.title = n.t + " · Novedades Profertil";
  }

  // Carga de una imagen dentro de su caja: brillo mientras llega, fundido al llegar.
  function cargar(img, caja, alFallar) {
    caja.classList.add("pf-esqueleto"); img.classList.add("pf-carga");
    function ok() { img.classList.add("pf-lista"); caja.classList.remove("pf-esqueleto"); }
    if (img.complete && img.naturalWidth) ok();
    else {
      img.addEventListener("load", ok);
      img.addEventListener("error", function () { caja.classList.remove("pf-esqueleto"); if (alFallar) alFallar(); });
    }
  }
  // Tamaño desde el nombre del archivo de WordPress (foto-1536x1024.jpg), para reservar el lugar antes de que llegue.
  function medidas(u) { var m = /-(\d{2,5})x(\d{2,5})\.(?:jpe?g|png|webp|gif)/i.exec(u || ""); return m ? [+m[1], +m[2]] : null; }

  var conFoto = false;
  function foto(d) {
    var src = d.imgG || d.img;
    if (!src || conFoto) return;
    conFoto = true;
    var fig = $("pf-foto"), hoja = $("pf-fotoHoja"), img = new Image(), md = medidas(src);
    $("pf-grilla").classList.add("pf-con-foto");
    img.alt = ""; img.decoding = "async"; img.fetchPriority = "high";
    // El lugar se reserva con la proporción de la foto (3:2 si el nombre no la dice).
    hoja.style.aspectRatio = md ? md[0] + " / " + md[1] : "3 / 2";
    hoja.appendChild(img);
    fig.hidden = false;
    img.addEventListener("load", function () { hoja.style.aspectRatio = ""; });
    cargar(img, hoja, function () { fig.hidden = true; $("pf-grilla").classList.remove("pf-con-foto"); });
    img.src = src;
  }

  function baseFoto(u) { return (u || "").split("/").pop().toLowerCase().replace(/\.(jpe?g|png|webp|gif)$/, "").replace(/(-\d+x\d+|-scaled|-e\d{9,})+$/, ""); }
  function cuerpo(d) {
    var t = $("pf-texto");
    if (!d.cuerpo) { t.innerHTML = '<p class="pf-n-vacio">Esta nota no tiene texto en el sitio actual.</p>'; return; }
    t.innerHTML = d.cuerpo;
    // La foto de la cabecera no se repite en el cuerpo (en cualquier tamaño: -800x450, -scaled...).
    var arriba = baseFoto(d.imgG || d.img);
    [].forEach.call(t.querySelectorAll("figure img"), function (im) { if (arriba && baseFoto(im.getAttribute("src")) === arriba) im.closest("figure").remove(); });
    [].forEach.call(t.querySelectorAll("table"), function (tb) { var w = document.createElement("div"); w.className = "pf-n-tabla"; tb.parentNode.insertBefore(w, tb); w.appendChild(tb); });
    // Cada foto del cuerpo va en una caja con su proporción (ancho y alto del HTML) y carga con brillo.
    // Si ya no existe en el sitio actual, sale.
    [].forEach.call(t.querySelectorAll("figure img"), function (im) {
      var w = +im.getAttribute("width"), h = +im.getAttribute("height"), caja = document.createElement("span");
      caja.className = "pf-n-imgcaja";
      if (w && h) caja.style.aspectRatio = w + " / " + h;
      im.parentNode.insertBefore(caja, im); caja.appendChild(im);
      cargar(im, caja, function () { var f = caja.closest("figure"); if (f) f.remove(); });
    });
  }

  // Datos, a la derecha de la foto: rótulo y valor por fila.
  var RELOJ = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>';
  var OJO = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.8"/></svg>';
  function datos(d) {
    // Sin rótulos: la fecha, el tiempo de lectura en un chip, compartir y el modo lectura.
    var h = '<p class="pf-n-fecha"><span class="pf-n-fecha__larga">' + fecha(n.f, true) + '</span><span class="pf-n-fecha__corta">' + fecha(n.f) + "</span></p>" +
      '<div class="pf-n-par"><span class="pf-n-tiempo">' + RELOJ + Math.max(1, Math.round(n.w / 200)) + " min</span>" +
      '<button class="pf-n-foco" type="button" id="pf-foco" aria-pressed="false" aria-label="Modo lectura" title="Modo lectura">' + OJO + "</button></div>";
    var aqui = encodeURIComponent(location.href), ttl = encodeURIComponent(n.t);
    h += '<div class="pf-n-compartir">' +
      '<button type="button" id="pf-copiar" aria-label="Copiar el link"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg></button>' +
      '<a href="https://api.whatsapp.com/send?text=' + ttl + "%20" + aqui + '" target="_blank" rel="noopener" aria-label="Compartir por WhatsApp"><svg class="pf-relleno" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5a9.5 9.5 0 0 0-8.2 14.3L2.5 21.5l4.8-1.3A9.5 9.5 0 1 0 12 2.5Zm0 17.2c-1.5 0-2.9-.4-4.1-1.1l-.3-.2-2.9.8.8-2.8-.2-.3A7.7 7.7 0 1 1 12 19.7Zm4.3-5.8c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1a6.3 6.3 0 0 1-3.1-2.7c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.7-1.7c-.2-.5-.4-.4-.5-.4h-.5a.9.9 0 0 0-.7.3 2.8 2.8 0 0 0-.9 2.1 4.9 4.9 0 0 0 1 2.6 11.2 11.2 0 0 0 4.3 3.8c1.6.7 2.2.7 3 .6.5-.1 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1l-.5-.3Z"/></svg></a>' +
      '<a href="https://www.linkedin.com/sharing/share-offsite/?url=' + aqui + '" target="_blank" rel="noopener" aria-label="Compartir en LinkedIn"><svg class="pf-relleno" viewBox="0 0 24 24" aria-hidden="true"><path d="M5.3 8.6h3v10.1h-3V8.6Zm1.5-4.9a1.8 1.8 0 1 1 0 3.5 1.8 1.8 0 0 1 0-3.5Zm3.4 4.9h2.9v1.4c.4-.8 1.4-1.6 2.9-1.6 3.1 0 3.7 2 3.7 4.7v5.6h-3v-5c0-1.2 0-2.7-1.6-2.7s-1.9 1.3-1.9 2.6v5.1h-3V8.6Z"/></svg></a>' +
      '<a href="mailto:?subject=' + ttl + "&body=" + aqui + '" aria-label="Compartir por mail"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5.5" width="17" height="13" rx="3"/><path d="m4.5 7.5 7.5 5.5 7.5-5.5"/></svg></a>' +
      "</div>";
    $("pf-datos").innerHTML = h;
    $("pf-foco").addEventListener("click", function () { foco(!document.body.classList.contains("pf-foco")); });
    $("pf-copiar").addEventListener("click", function () {
      var ok = function () { avisar("Link copiado"); };
      if (navigator.clipboard) navigator.clipboard.writeText(location.href).then(ok, function () { avisar("No se pudo copiar"); });
      else avisar("No se pudo copiar");
    });
  }
  // Curva del punto: un resorte apenas subamortiguado (pasa un poquito y vuelve), muestreado como linear().
  (function () {
    if (!CSS.supports || !CSS.supports("transition-timing-function", "linear(0, 1)")) return;
    var k = 230, c = 25, x = 0, v = 0, dt = 1 / 1000, pts = [], t = 0;
    while (t < 2) {
      for (var i = 0; i < 16; i++) { v += (-k * (x - 1) - c * v) * dt; x += v * dt; t += dt; }
      pts.push(x.toFixed(4));
      if (Math.abs(x - 1) < .0015 && Math.abs(v) < .02) break;
    }
    pts[pts.length - 1] = "1";
    var raiz = document.documentElement.style;
    raiz.setProperty("--punto-curva", "linear(0, " + pts.join(", ") + ")");
    raiz.setProperty("--punto-dura", Math.round(t * 1000) + "ms");
  })();

  // Índice, a la izquierda: solo si la nota tiene dos subtítulos o más.
  var titulos = [];
  function indice() {
    // En el sitio actual muchos h4 no son subtítulos: firmas ("Por ..."), fuentes o la primera frase en negrita.
    titulos = [].slice.call($("pf-texto").querySelectorAll("h2, h3, h4")).filter(function (t) {
      var x = t.textContent.trim();
      return x.length > 3 && x.length <= 80 && !/^(por|fuente|prensa|foto)\b/i.test(x) && !/\.(com|ar)\b/i.test(x);
    });
    if (titulos.length < 2) { titulos = []; return; }
    $("pf-indice").innerHTML = "<ol>" + titulos.map(function (t, i) {
      t.id = "pf-s" + (i + 1);
      return '<li><a href="#' + t.id + '">' + esc(t.textContent) + "</a></li>";
    }).join("") + '</ol>';
    $("pf-indice").firstChild.insertAdjacentHTML("afterbegin", '<span class="pf-n-indice__punto" aria-hidden="true"></span>');
    $("pf-indice").hidden = false;
    // Al tocar una sección, baja suave hasta ella.
    $("pf-indice").addEventListener("click", function (e) {
      var a = e.target.closest("a"); if (!a) return;
      var t = document.getElementById(a.hash.slice(1)); if (!t) return;
      e.preventDefault();
      t.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
      history.replaceState(null, "", a.hash);
    });
  }

  // Modo lectura: quedan el título, la foto y el texto. Se sale con el mismo botón, el de arriba o Esc.
  function foco(on) {
    var y = $("pf-texto").getBoundingClientRect().top;
    document.body.classList.toggle("pf-foco", on);
    $("pf-foco").setAttribute("aria-pressed", on);
    $("pf-focoSalir").hidden = !on;
    // Mantiene el punto de lectura al cambiar.
    window.scrollBy(0, $("pf-texto").getBoundingClientRect().top - y);
  }
  $("pf-focoSalir").addEventListener("click", function () { foco(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && document.body.classList.contains("pf-foco")) foco(false); });

  var ta;
  function avisar(txt) { var a = $("pf-aviso"); a.textContent = txt; a.classList.add("pf-on"); clearTimeout(ta); ta = setTimeout(function () { a.classList.remove("pf-on"); }, 2000); }

  // Tarjeta: la de Novedades sin el fondo. Foto de la nota 4:3 (si no tiene, el arte) con la etiqueta y el año adentro; fecha y título abajo.
  function mini(x) {
    var img = x.mi ? "../fotos/mini/" + encodeURIComponent(x.ar) + ".webp" : x.imgL ? "../" + x.imgL : x.img;
    var m = img ? '<img src="' + esc(img) + '" alt="" loading="lazy" decoding="async">' : arte(x, 240, 180, x.id * 7919 + 13);
    return '<a class="pf-n-mini" href="' + url(x) + '"><div class="pf-n-mini__img">' + m + etq(x.tp, { dato: x.anio }) + "</div>" +
      '<div class="pf-n-mini__txt"><p class="pf-when">' + fecha(x.f) + '</p><p class="pf-ttl">' + esc(x.t) + "</p></div></a>";
  }

  // Relacionadas: comparten temas de WordPress, cultivo, pilar o tipo; a igual puntaje, la más cercana en el tiempo.
  function relacionadas() {
    var et = n.et || [];
    var t0 = Date.parse(n.f || "2000-01-01");
    return NOTAS.filter(function (x) { return x !== n; }).map(function (x) {
      var s = 0;
      (x.et || []).forEach(function (e) { if (et.indexOf(e) !== -1) s += 3; });
      x.c.forEach(function (c) { if (n.c.indexOf(c) !== -1) s += 2; });
      x.p.forEach(function (p) { if (n.p.indexOf(p) !== -1) s += 1; });
      if (x.tp === n.tp) s += 1.5;
      return { x: x, s: s - Math.abs(Date.parse(x.f || "2000-01-01") - t0) / 3.15e11 };
    }).sort(function (a, b) { return b.s - a.s; }).slice(0, 3).map(function (r) { return r.x; });
  }

  // Flechas de las relacionadas: aparecen solo si la fila se desliza; cada toque corre una tarjeta.
  function flechas() {
    var f = $("pf-rel"), ant = $("pf-relAnt"), sig = $("pf-relSig");
    function ver() {
      var max = f.scrollWidth - f.clientWidth;
      ant.hidden = f.scrollLeft < 4;
      sig.hidden = max < 4 || f.scrollLeft > max - 4;
      var im = f.querySelector(".pf-n-mini__img");
      if (im) f.parentNode.style.setProperty("--mitad", Math.round(im.offsetHeight / 2) + "px");
    }
    function correr(dir) {
      var c = f.querySelector(".pf-n-mini");
      if (c) f.scrollBy({ left: dir * (c.offsetWidth + parseFloat(getComputedStyle(f).columnGap || 12)), behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    }
    ant.addEventListener("click", function () { correr(-1); });
    sig.addEventListener("click", function () { correr(1); });
    f.addEventListener("scroll", ver, { passive: true });
    window.addEventListener("resize", ver);
    ver();
  }

  function seguir() {
    $("pf-rel").innerHTML = relacionadas().map(mini).join("");
    [].forEach.call($("pf-rel").querySelectorAll(".pf-n-mini__img img"), function (im) { cargar(im, im.parentNode); });
    flechas();
  }

  // La barra toma el azul al terminar la cabecera; la línea de abajo sigue la lectura del cuerpo.
  function alScroll() {
    var t = $("pf-texto"), ini = t.offsetTop - window.innerHeight * 0.4, fin = t.offsetTop + t.offsetHeight - window.innerHeight * 0.6;
    $("pf-progreso").style.setProperty("--p", Math.min(1, Math.max(0, (window.scrollY - ini) / Math.max(1, fin - ini))).toFixed(4));
  }
  function marcar() {
    if (!titulos.length) return;
    var act = 0;
    titulos.forEach(function (t, i) { if (t.getBoundingClientRect().top < 160) act = i; });
    var links = $("pf-indice").querySelectorAll("a");
    [].forEach.call(links, function (a, i) { a.classList.toggle("pf-on", i === act); });
    // El punto se centra en la primera línea del ítem activo.
    var a = links[act], ol = a.closest("ol");
    ol.style.setProperty("--y", Math.round(a.getBoundingClientRect().top - ol.getBoundingClientRect().top + parseFloat(getComputedStyle(a).lineHeight) / 2 - 3.5) + "px");
  }
  window.addEventListener("scroll", function () { alScroll(); marcar(); }, { passive: true });
  // Barra transparente sobre la cabecera al cargar, así se ve entero el color del campo. Toma el azul apenas se baja:
  // cuando la caja del título llega a la barra (el azul baja deslizándose, ver la pieza barra en base.css).
  function barraSolida() {
    var t = document.getElementById("pf-top"), m = document.getElementById("pf-cabIn");
    t.classList.toggle("pf-barra--solida", !m || (window.scrollY > 0 && m.getBoundingClientRect().top <= t.offsetHeight));
  }
  window.addEventListener("scroll", barraSolida, { passive: true });
  window.addEventListener("resize", barraSolida);
  window.addEventListener("load", barraSolida);
  requestAnimationFrame(barraSolida);
  window.addEventListener("resize", alScroll);

  var base = { ante: "", b: n.b, lg: n.lg, img: n.img, imgG: n.imgG, et: n.et };
  cabecera(base); foto(base); seguir(); alScroll();
  fetch("../notas/" + encodeURIComponent(n.ar) + ".json")
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (d) { cabecera(d); datos(d); foto(d); cuerpo(d); indice(); })
    .catch(function () { datos(base); foto(base); $("pf-texto").innerHTML = '<p class="pf-n-vacio">No se pudo cargar el texto de esta nota.</p>'; })
    .then(function () { $("pf-nota").removeAttribute("aria-busy"); alScroll(); marcar(); });
})();
