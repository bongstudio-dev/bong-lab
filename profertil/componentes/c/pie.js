/* Pie de página: tres variantes. */
(function () {
  var COLUMNAS = [
    ["Empresa", ["Quiénes somos", "Planta Bahía Blanca", "Sustentabilidad", "Compliance"]],
    ["Productos", ["Catálogo", "Por cultivo", "Fichas y hojas de seguridad", "Distribuidores"]],
    ["Novedades", ["Noticias", "Sala de prensa", "Inversores", "Biblioteca virtual"]],
    ["Contacto", ["Escribinos", "Trabajá con nosotros", "Proveedores", "Visitas a planta"]]
  ];
  // Fondos de color permitidos (Color y texto del Master) y el texto que va encima.
  var FONDOS = { azul: ["var(--azul)", "var(--tiza)"], verde: ["var(--verde)", "var(--tiza)"], terra: ["var(--terra)", "var(--tiza)"], amarillo: ["var(--amarillo)", "var(--azul)"] };

  /* Formas que caen: corre en la página (se copia con toString). Matter.js hace la física; la silueta de cada
     forma sale de muestrear sus trazos SVG y poly-decomp la parte en piezas convexas para que apilen justo.
     O = { cantidad, tamano }. */
  function FISICA(O) {
    var pie = document.querySelector(".pf-pie"), lienzo = pie.querySelector(".pf-pie__fisica"), ctx = lienzo.getContext("2d");
    var quieto = matchMedia("(prefers-reduced-motion: reduce)").matches;
    var css = getComputedStyle(document.documentElement);
    var PALETA = ["--azul", "--celeste", "--verde", "--verde-claro", "--amarillo", "--naranja", "--terra"].map(function (v) { return css.getPropertyValue(v).trim(); });
    function cargar(src) { return new Promise(function (ok, mal) { var s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = mal; document.head.appendChild(s); }); }
    cargar("https://cdnjs.cloudflare.com/ajax/libs/matter-js/0.20.0/matter.min.js")
      .then(function () { return cargar("https://cdn.jsdelivr.net/npm/poly-decomp@0.3.0/build/decomp.min.js"); })
      .then(arrancar);

    // Silueta de cada forma: puntos a lo largo de sus trazos, separados en contornos; los huecos no cuentan.
    function area(c) { var a = 0; for (var i = 0, j = c.length - 1; i < c.length; j = i++) a += (c[j].x + c[i].x) * (c[j].y - c[i].y); return Math.abs(a / 2); }
    function dentro(p, c) { var r = false; for (var i = 0, j = c.length - 1; i < c.length; j = i++) { var a = c[i], b = c[j]; if ((a.y > p.y) !== (b.y > p.y) && p.x < (b.x - a.x) * (p.y - a.y) / (b.y - a.y) + a.x) r = !r; } return r; }
    function plantillas() {
      var NS = "http://www.w3.org/2000/svg", svg = document.createElementNS(NS, "svg"), lista = [];
      svg.setAttribute("style", "position:absolute;width:0;height:0;visibility:hidden"); document.body.appendChild(svg);
      Object.keys(FORMAS).forEach(function (n) {
        var f = FORMAS[n], vb = f.vb.split(" ").map(Number), lado = Math.max(vb[2], vb[3]), g = document.createElementNS(NS, "g"), camino = new Path2D(), cs = [];
        g.innerHTML = f.d; svg.appendChild(g);
        g.querySelectorAll("path").forEach(function (p) {
          camino.addPath(new Path2D(p.getAttribute("d")));
          var L = p.getTotalLength(), k = Math.max(24, Math.min(180, Math.round(L / 5))), salto = lado * .04, c = [], prev = null;
          for (var i = 0; i < k; i++) {
            var q = p.getPointAtLength(L * i / k), pt = { x: q.x, y: q.y };
            if (prev && Math.hypot(pt.x - prev.x, pt.y - prev.y) > salto) { if (c.length > 2) cs.push(c); c = []; }
            if (!prev || Math.hypot(pt.x - prev.x, pt.y - prev.y) > .5) c.push(pt);
            prev = pt;
          }
          if (c.length > 2) cs.push(c);
        });
        cs = cs.filter(function (c) { return area(c) > lado * lado * .002; });
        var solidos = cs.filter(function (c) { return !cs.some(function (o) { return o !== c && area(o) > area(c) && dentro(c[0], o); }); });
        lista.push({ nombre: n, lado: lado, camino: camino, regla: /evenodd/.test(f.d) ? "evenodd" : "nonzero", solidos: solidos });
      });
      svg.remove();
      return lista;
    }

    function arrancar() {
      var M = Matter; M.Common.setDecomp(window.decomp);
      var T = plantillas(), engine = M.Engine.create({ enableSleeping: true, positionIterations: 12, velocityIterations: 8 }), mundo = engine.world;
      var W = 0, H = 0, lado = 0, paredes = [], cuerpos = [], cola = [], dpr = Math.min(2, devicePixelRatio || 1);

      function medir() {
        var r = pie.getBoundingClientRect(); W = r.width; H = r.height;
        lienzo.width = Math.round(W * dpr); lienzo.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        lado = Math.min(O.tamano, W * .3);
        if (paredes.length) M.Composite.remove(mundo, paredes);
        var g = 400, o = { isStatic: true, friction: .6 };
        paredes = [M.Bodies.rectangle(W / 2, H + g / 2, W + 2 * g, g, o), M.Bodies.rectangle(-g / 2, H / 2 - H, g, H * 4, o),
          M.Bodies.rectangle(W + g / 2, H / 2 - H, g, H * 4, o), M.Bodies.rectangle(W / 2, -lado * 5 - g / 2, W + 2 * g, g, o)];
        M.Composite.add(mundo, paredes);
        cuerpos.forEach(function (b) { if (b.position.x > W - 10 || b.position.y > H - 10) { M.Sleeping.set(b, false); M.Body.setPosition(b, { x: Math.min(b.position.x, W - lado / 2), y: Math.min(b.position.y, H - lado / 2) }); } });
      }

      // Contorno simplificado (Douglas-Peucker) para no partir en cien piezas lo que se dibuja con diez.
      function simplificar(p, eps) {
        if (p.length < 3) return p;
        var a = p[0], b = p[p.length - 1], m = 0, k = 0, dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1;
        for (var i = 1; i < p.length - 1; i++) { var d = Math.abs(dy * p[i].x - dx * p[i].y + b.x * a.y - b.y * a.x) / L; if (d > m) { m = d; k = i; } }
        if (m <= eps) return [a, b];
        return simplificar(p.slice(0, k + 1), eps).slice(0, -1).concat(simplificar(p.slice(k), eps));
      }
      // Piezas convexas de un contorno, en sus coordenadas reales; si no se puede partir, su envolvente.
      function piezas(c) {
        // Contorno cerrado: se parte en el punto más lejano del primero y se simplifica cada mitad.
        var k = 0, m = 0; c.forEach(function (p, i) { var d = Math.hypot(p.x - c[0].x, p.y - c[0].y); if (d > m) { m = d; k = i; } });
        var q = simplificar(c.slice(0, k + 1), .6).slice(0, -1).concat(simplificar(c.slice(k).concat([c[0]]), .6).slice(0, -1));
        if (q.length < 3) q = c;
        var P = q.map(function (p) { return [p.x, p.y]; }), D = window.decomp, out = [];
        try { D.makeCCW(P); D.removeCollinearPoints(P, .02); D.removeDuplicatePoints(P, .01); if (P.length > 2 && D.isSimple(P)) out = D.quickDecomp(P); } catch (e) { out = []; }
        if (!out.length) return [M.Vertices.hull(q)];
        return out.map(function (r) { return r.map(function (p) { return { x: p[0], y: p[1] }; }); })
          .filter(function (r) { return r.length > 2 && M.Vertices.area(r) > 2; });
      }
      // Cuerpo de una forma: todas sus piezas, cada una donde está en el dibujo (Matter recentra las que se le pasan sueltas).
      function crear(t, x, y) {
        var s = lado / t.lado, op = { friction: .5, frictionStatic: .8, restitution: .05, density: .002, slop: .02, sleepThreshold: 40 }, partes = [];
        t.solidos.forEach(function (c) {
          piezas(c.map(function (p) { return { x: p.x * s, y: p.y * s }; })).forEach(function (v) {
            v = M.Vertices.clockwiseSort(v);
            partes.push(M.Body.create(M.Common.extend({ position: M.Vertices.centre(v), vertices: v }, op)));
          });
        });
        var b = partes.length > 1 ? M.Body.create(M.Common.extend({ parts: partes }, op)) : partes[0];
        b.pf = { t: t, s: s, cx: b.position.x, cy: b.position.y };   // el centro de masa, en coordenadas del dibujo
        M.Body.setPosition(b, { x: x, y: y }); M.Body.setAngle(b, (Math.random() - .5) * 1.6); M.Body.setAngularVelocity(b, (Math.random() - .5) * .06);
        return b;
      }

      // Color: distinto de las formas de arriba de la pila donde va a caer; si igual se toca con una del mismo color, cambia la que se mueve.
      function elegir(evitar) { var libres = PALETA.filter(function (c) { return evitar.indexOf(c) < 0; }); return (libres.length ? libres : PALETA)[Math.floor(Math.random() * (libres.length || PALETA.length))]; }
      function vecinos(b) {
        var c = []; engine.pairs.list.forEach(function (p) {
          if (!p.isActive) return; var a = p.bodyA.parent, d = p.bodyB.parent;
          if (a === b && d.pf) c.push(d.pf.color); else if (d === b && a.pf) c.push(a.pf.color);
        }); return c;
      }
      M.Events.on(engine, "collisionStart collisionActive", function (ev) {
        ev.pairs.forEach(function (p) {
          var a = p.bodyA.parent, b = p.bodyB.parent;
          if (a === b || !a.pf || !b.pf || a.pf.color !== b.pf.color) return;
          var m = (b === agarrada || (a !== agarrada && b.speed >= a.speed)) ? b : a;
          m.pf.color = elegir(vecinos(m).concat(m.pf.color));
        });
      });

      var orden = [];
      function soltar() {
        if (!orden.length) orden = T.slice().sort(function () { return Math.random() - .5; });
        // Nace solo donde no hay otra forma (si no, espera al cuadro siguiente).
        var y0 = -lado * (.7 + Math.random()), x = null;
        for (var i = 0; i < 8 && x === null; i++) {
          var xi = lado / 2 + 4 + Math.random() * Math.max(1, W - lado - 8);
          if (!M.Query.region(cuerpos, { min: { x: xi - lado * .6, y: y0 - lado * .6 }, max: { x: xi + lado * .6, y: y0 + lado * .6 } }).length) x = xi;
        }
        if (x === null) return false;
        var t = orden.pop();
        var debajo = cuerpos.filter(function (b) { return b.bounds.max.x > x - lado / 2 && b.bounds.min.x < x + lado / 2; })
          .sort(function (a, b) { return a.bounds.min.y - b.bounds.min.y; }).slice(0, 3).map(function (b) { return b.pf.color; });
        var b = crear(t, x, y0);
        b.pf.color = elegir(debajo.concat(cuerpos.length ? cuerpos[cuerpos.length - 1].pf.color : []));
        cuerpos.push(b); M.Composite.add(mundo, b);
        return true;
      }

      function dibujar() {
        ctx.clearRect(0, 0, W, H);
        cuerpos.forEach(function (b) {
          var f = b.pf; ctx.save(); ctx.translate(b.position.x, b.position.y); ctx.rotate(b.angle); ctx.translate(-f.cx, -f.cy); ctx.scale(f.s, f.s);
          ctx.fillStyle = f.color; ctx.fill(f.t.camino, f.t.regla); ctx.restore();
        });
      }

      // Agarrar y tirar: el lienzo no recibe clics; el pie mira si debajo del puntero hay una forma.
      var agarre = null, agarrada = null, raton = { x: 0, y: 0 };
      function punto(e) { var r = lienzo.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
      function tocada(p) { return M.Query.point(cuerpos, p)[0]; }
      pie.addEventListener("pointerdown", function (e) {
        if (e.button) return; var p = punto(e), b = tocada(p); if (!b) return;
        e.preventDefault(); raton.x = p.x; raton.y = p.y; agarrada = b; M.Sleeping.set(b, false);
        agarre = M.Constraint.create({ pointA: raton, bodyB: b, pointB: { x: p.x - b.position.x, y: p.y - b.position.y }, stiffness: .2, damping: .1, length: 0 });
        M.Composite.add(mundo, agarre); pie.setPointerCapture(e.pointerId); pie.classList.add("pf-agarra"); seguir();
      });
      pie.addEventListener("pointermove", function (e) {
        var p = punto(e);
        if (agarre) { raton.x = p.x; raton.y = p.y; M.Sleeping.set(agarrada, false); return; }
        if (e.pointerType === "mouse") pie.style.cursor = tocada(p) ? "grab" : "";
      });
      function largar() { if (!agarre) return; M.Composite.remove(mundo, agarre); agarre = agarrada = null; pie.classList.remove("pf-agarra"); }
      pie.addEventListener("pointerup", largar); pie.addEventListener("pointercancel", largar);
      pie.addEventListener("touchstart", function (e) { if (tocada(punto(e.touches[0]))) e.preventDefault(); }, { passive: false });

      // Paso fijo de 60 por segundo, solo con el pie en pantalla.
      var visible = false, corre = false, ultimo = 0, resto = 0, dt = 1000 / 60, proxima = 0;
      function cuadro(t) {
        if (!visible) { corre = false; return; }
        resto = Math.min(resto + (t - ultimo), dt * 3); ultimo = t;
        if (cola.length && t >= proxima && soltar()) { cola.pop(); proxima = t + 70; }
        while (resto >= dt) {
          // Dos pasos por cuadro y un tope de velocidad: así las piezas finas (ondas, rayos del sol) no se atraviesan.
          for (var h = 0; h < 2; h++) {
            M.Engine.update(engine, dt / 2);
            cuerpos.forEach(function (b) { var v = M.Body.getVelocity(b), r = Math.hypot(v.x, v.y); if (r > 22) M.Body.setVelocity(b, { x: v.x * 22 / r, y: v.y * 22 / r }); });
          }
          resto -= dt;
        }
        dibujar(); requestAnimationFrame(cuadro);
      }
      function seguir() { if (!corre && visible) { corre = true; ultimo = performance.now(); requestAnimationFrame(cuadro); } }

      pie.pfFisica = { engine: engine, cuerpos: cuerpos };   // para revisar desde la consola
      medir();
      var n = Math.max(4, Math.round(O.cantidad * (W * H) / (1440 * 900))), empezo = false;
      if (quieto) { for (var i = 0, intentos = 0; i < n && intentos < n * 40; intentos++) { if (soltar()) i++; for (var k = 0; k < 6; k++) M.Engine.update(engine, dt); } for (var j = 0; j < 900; j++) M.Engine.update(engine, dt); dibujar(); empezo = true; }
      new IntersectionObserver(function (es) {
        visible = es[0].isIntersecting;
        if (visible && !empezo && es[0].intersectionRatio >= .3) { empezo = true; for (var i = 0; i < n; i++) cola.push(1); }
        seguir();
      }, { threshold: [0, .3] }).observe(pie);
      var tR; new ResizeObserver(function () { clearTimeout(tR); tR = setTimeout(function () { medir(); dibujar(); }, 120); }).observe(pie);
    }
  }

  Libreria.sumar({
    id: "footer", nombre: "Pie de página", grupo: "Navegación", alto: "auto", sangrado: true,
    bajada: "El cierre de todas las páginas: navegación, línea ética y datos legales. Tres variantes, de la más sobria a la más osada, y una cuarta experimental.",
    variantes: [
      ["institucional", "Institucional", "La base: fondo de color, logo y bajada arriba, cuatro columnas, línea ética y legales."],
      ["trigo", "Con trigo", "Fondo tiza y el trigo del sistema en amarillo pleno, a la izquierda, que sube más lento que la página."],
      ["vida", "Vida para nuestra tierra", "Alto de pantalla completa con un video de campo en loop de fondo y un filtro negro parejo. La frase va abajo a la izquierda, a tamaño de título, y entra con el animador Ventana."],
      ["formas", "Formas que caen", "Experimento. Alto de pantalla completa en marfil: arriba logo, links y línea ética; abajo caen las formas del sistema con física, se apilan hasta la mitad y se pueden agarrar y tirar."]
    ],
    tamano: "media",
    claves: ["La línea ética va siempre en el pie, destacada, con su propio llamado.", "Los fondos de color son solo los del Master (azul, verde, terra, amarillo); sobre amarillo el texto va en azul.", "El logo va siempre completo: no se recorta ni se separa el símbolo de la palabra.", "Las columnas repiten el menú principal: si cambia la arquitectura, cambia el pie.", "Con trigo y Vida para nuestra tierra tienen parallax: el trigo y la foto se mueven a otra velocidad que la página mientras el pie entra en pantalla.", "Vida para nuestra tierra ocupa una pantalla entera. La frase va alineada a la izquierda junto a la línea ética, y entra con el animador Ventana, palabra por palabra.", "Nunca degradados sobre la foto (ni de color ni de tinta). Si hace falta contraste, un filtro negro parejo.", "Formas que caen es un experimento: las 18 formas del Master en los 7 colores de marca, sin dos del mismo color tocándose (si se tocan, la que se mueve cambia de color). Arrancan a caer cuando el pie entra en pantalla."],
    accesibilidad: "Es un <footer> con listas de links reales. El trigo es decorativo (aria-hidden); el video es decorativo, mudo y sin controles; la frase es texto real, legible por lectores y buscadores. Con movimiento reducido no hay parallax y el video queda quieto en el primer cuadro. En Formas que caen el lienzo es decorativo (aria-hidden) y deja pasar los clics a los links; con movimiento reducido las formas aparecen ya apiladas.",
    dependencias: ["en Formas que caen, Matter.js 0.20 y poly-decomp 0.3 desde CDN, y formas.js"],
    previo: '<div style="height:80vh;display:grid;place-items:center;color:var(--ink-3);font-size:var(--texto-chico)">Final de la página</div>',
    controles: [
      { id: "fondo", tipo: "seg", etiqueta: "Fondo", solo: ["institucional"], def: "azul", aplica: { attr: "data-fondo" }, opciones: [["azul", "Azul"], ["verde", "Verde"], ["terra", "Terra"], ["amarillo", "Amarillo"]], desc: "Color de fondo y tinta que va encima." },
      { id: "filtro", tipo: "rango", etiqueta: "Filtro negro", solo: ["vida"], unidad: "%", min: 0, max: 70, def: 26, aplica: { var: "--filtro" }, desc: "Negro parejo sobre toda la foto para que el texto en tiza se lea. Sin degradado." },
      { id: "frase", tipo: "rango", etiqueta: "Frase", solo: ["vida"], unidad: "px", min: 32, max: 200, def: 140, aplica: { var: "--frase", unidad: "px" }, desc: "Cuerpo de Vida para nuestra tierra. En pantallas chicas no pasa del 14% del ancho." },
      { id: "par", tipo: "rango", etiqueta: "Parallax", solo: ["trigo", "vida"], unidad: "%", min: 0, max: 40, def: 22, aplica: { var: "--par" }, desc: "Cuánto se corre el trigo o el video mientras entra el pie. En Vida, solo el video." },
      { id: "cantidad", tipo: "rango", etiqueta: "Cantidad", solo: ["formas"], unidad: "formas", min: 8, max: 160, def: 44, desc: "Cuántas formas caen en un pie de 1440 × 900. En otros tamaños se ajusta al área, para que llenen lo mismo." },
      { id: "tamano", tipo: "rango", etiqueta: "Tamaño", solo: ["formas"], unidad: "px", min: 48, max: 280, def: 130, desc: "Lado de cada forma. En pantallas chicas no pasa del 30% del ancho." },
      "---",
      { id: "radio", tipo: "rango", etiqueta: "Radio de arriba", unidad: "px", min: 0, max: 56, def: 26, aplica: { var: "--radio", unidad: "px" }, desc: "Radio de las esquinas de arriba." },
      { id: "logo", tipo: "rango", etiqueta: "Logo", unidad: "px", min: 80, max: 260, def: 150, aplica: { var: "--logo", unidad: "px" }, desc: "Ancho del logo completo." },
      { id: "etica", tipo: "interr", etiqueta: "Destacar la línea ética", def: true, desc: "Bloque destacado con el llamado a denunciar." }
    ],
    css: function () {
      return [
        ".pf-pie { --radio: var(--radio-tarjeta); --logo: 150px; --par: 22; --p: 1;",
        "  position: relative; overflow: hidden; border-radius: var(--radio) var(--radio) 0 0; font: 400 var(--texto-chico)/1.45 var(--f-body); }",
        Object.keys(FONDOS).map(function (k) { return '.pf-pie[data-fondo="' + k + '"] { --pie-fondo: ' + FONDOS[k][0] + '; --pie-tinta: ' + FONDOS[k][1] + '; }'; }).join("\n"),
        ".pf-pie a { color: inherit; text-decoration: none; opacity: .86; transition: opacity .2s; }",
        ".pf-pie a:hover { opacity: 1; text-decoration: underline; text-underline-offset: 3px; }",
        ".pf-pie ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }",
        ".pf-pie h3 { margin: 0 0 12px; font: 500 var(--texto-mini)/1 var(--f-body); letter-spacing: .08em; text-transform: uppercase; opacity: .6; }",
        ".pf-pie__in { position: relative; max-width: 1280px; margin: 0 auto; padding: clamp(40px, 6vw, 72px) clamp(20px, 4vw, 48px) 28px; }",
        ".pf-pie__logo { display: block; width: var(--logo); }",
        ".pf-pie__logo svg { display: block; width: 100%; height: auto; }",
        ".pf-pie__cols { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 24px; }",
        ".pf-pie__etica { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; padding: 18px 22px; border-radius: 18px; background: color-mix(in srgb, currentColor 9%, transparent); }",
        ".pf-pie__etica b { font: 500 var(--texto-subtitulo)/1.1 var(--f-display); letter-spacing: -.02em; }",
        ".pf-pie__etica span { display: block; margin-top: 4px; font-size: var(--texto-chico); opacity: .75; }",
        ".pf-pie__pill { display: inline-flex; align-items: center; height: 44px; padding: 0 20px; border-radius: 999px; background: var(--pie-tinta, var(--azul)); color: var(--pie-fondo, var(--tiza)) !important; opacity: 1 !important; font-weight: 500; text-decoration: none !important;  text-box: trim-both cap alphabetic; }",
        ".pf-pie__legal { display: flex; justify-content: space-between; gap: 12px 24px; flex-wrap: wrap; padding-top: 20px; border-top: 1px solid color-mix(in srgb, currentColor 18%, transparent); font-size: var(--texto-mini); opacity: .8; }",
        ".pf-pie__legal nav { display: flex; gap: 18px; flex-wrap: wrap; }",
        "",
        "/* Institucional: la base. */",
        '.pf-pie[data-variante="institucional"] { background: var(--pie-fondo); color: var(--pie-tinta); }',
        '.pf-pie[data-variante="institucional"] .pf-pie__in { display: grid; gap: 40px; }',
        '.pf-pie[data-variante="institucional"] .pf-pie__cab { display: flex; justify-content: space-between; align-items: flex-end; gap: 24px; flex-wrap: wrap; }',
        '.pf-pie[data-variante="institucional"] .pf-pie__cab p { margin: 12px 0 0; max-width: 34ch; font: 500 var(--texto-subtitulo)/1.15 var(--f-display); letter-spacing: -.02em; }',
        "",
        "/* Con trigo: el trigo del sistema en amarillo pleno ocupa la izquierda y sube más lento. El contenido va a la derecha. */",
        '.pf-pie[data-variante="trigo"] { background: var(--tiza); color: var(--ink); --pie-tinta: var(--azul); --pie-fondo: var(--tiza); }',
        '.pf-pie__trigo { position: absolute; left: clamp(-80px, -4vw, -24px); bottom: -8%; height: 112%; aspect-ratio: ' + FORMAS.trigo.vb.split(" ")[2] + ' / ' + FORMAS.trigo.vb.split(" ")[3] + '; color: var(--amarillo); pointer-events: none;',
        "  transform: translate3d(0, calc((1 - var(--p)) * var(--par) * 1%), 0); will-change: transform; }",
        '.pf-pie__trigo svg { display: block; width: 100%; height: 100%; }',
        '.pf-pie[data-variante="trigo"] .pf-pie__in { display: grid; grid-template-columns: minmax(0, .9fr) minmax(0, 2fr); column-gap: 48px; }',
        '.pf-pie[data-variante="trigo"] .pf-pie__der { grid-column: 2; display: grid; gap: 36px; }',
        '.pf-pie[data-variante="trigo"] .pf-pie__cab { display: flex; justify-content: space-between; align-items: flex-end; gap: 24px; flex-wrap: wrap; }',
        '.pf-pie[data-variante="trigo"] .pf-pie__logo { color: var(--azul); }',
        '.pf-pie[data-variante="trigo"] .pf-pie__cab p { margin: 12px 0 0; max-width: 28ch; font: 500 var(--texto-subtitulo)/1.2 var(--f-display); letter-spacing: -.02em; color: var(--azul); }',
        '.pf-pie[data-variante="trigo"] .pf-pie__etica { background: var(--bg); }',
        "",
        "/* Vida para nuestra tierra: una pantalla entera con la foto de fondo. Arriba logo y links; abajo, la frase a la izquierda",
        "   y la línea ética a la derecha; al final, los legales. Todo en tiza sobre la foto. */",
        '.pf-pie[data-variante="vida"] { --pie-tinta: var(--tiza); --pie-fondo: var(--azul); --filtro: 26; --frase: 100px;',
        '  overflow: clip; display: flex; flex-direction: column; min-height: 100vh; min-height: 100svh; color: var(--tiza); background: #000; isolation: isolate; }',
        '.pf-pie__foto { position: absolute; inset: 0; z-index: -1; overflow: hidden; }',
        "/* La foto es más alta que el pie y llega a su lugar cuando el pie terminó de entrar (--p = 1). */",
        '.pf-pie__foto img, .pf-pie__foto video { display: block; position: absolute; left: 0; top: 0; width: 100%; height: calc(100% + var(--par) * 2%); object-fit: cover; transform: translate3d(0, calc((var(--p) - 1) * var(--par) * 1%), 0); will-change: transform; }',
        "/* Contraste: un filtro negro parejo. Nunca degradados sobre la foto. */",
        '.pf-pie__foto::after { content: ""; position: absolute; inset: 0; background: rgb(0 0 0 / calc(var(--filtro) * 1%)); }',
        '.pf-pie[data-variante="vida"] .pf-pie__in { flex: 1; display: flex; flex-direction: column; gap: 28px; width: 100%; max-width: none; }',
        '.pf-pie__arriba { display: flex; justify-content: space-between; align-items: flex-start; gap: 32px 56px; flex-wrap: wrap; }',
        '.pf-pie[data-variante="vida"] .pf-pie__cols { flex: 1; max-width: 760px; }',
        '.pf-pie__abajo { margin-top: auto; display: flex; justify-content: space-between; align-items: flex-end; gap: 24px 48px; flex-wrap: wrap; }',
        '.pf-pie[data-variante="vida"] .pf-pie__etica { flex: 0 1 560px; backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); }',
        "/* La frase: tiza, a tamaño de título y alineada a la izquierda. */",
        '.pf-pie__vida { margin: 0; font: 500 min(var(--frase), 14vw)/.92 var(--f-display); letter-spacing: -.035em; color: var(--tiza); text-align: left; }',
        "/* Entra con el animador Ventana (animadores.css y animadores.js), palabra por palabra al aparecer en pantalla.",
        "   El animador rearma el texto por palabras: el ancho máximo es lo que corta en Vida para / nuestra tierra. */",
        '.pf-pie__vida { max-width: 6.6em; }',
        '.pf-pie[data-variante="vida"] .pf-pie__legal { border-top-color: color-mix(in srgb, var(--tiza) 30%, transparent); color: var(--tiza); }',
        "",
        "/* Formas que caen (experimento): marfil, contenido arriba y la mitad de abajo libre para las formas.",
        "   El lienzo va encima de todo pero deja pasar los clics: el JS decide si se agarró una forma. */",
        '.pf-pie[data-variante="formas"] { --pie-tinta: var(--azul); --pie-fondo: var(--tiza); min-height: 100vh; min-height: 100svh; background: var(--tiza); color: var(--azul); }',
        '.pf-pie[data-variante="formas"] .pf-pie__in { display: grid; gap: 28px; max-width: none; }',
        '.pf-pie[data-variante="formas"] .pf-pie__cols { flex: 1; max-width: 760px; }',
        '.pf-pie[data-variante="formas"] .pf-pie__etica { max-width: 760px; width: 100%; margin-left: auto; }',
        "/* Los legales van pegados abajo, por encima de las formas. */",
        '.pf-pie[data-variante="formas"] .pf-pie__legal { position: absolute; z-index: 3; left: clamp(20px, 4vw, 48px); right: clamp(20px, 4vw, 48px); bottom: 20px; padding-top: 0; border-top: 0; opacity: 1; }',
        '.pf-pie__fisica { position: absolute; inset: 0; z-index: 2; width: 100%; height: 100%; pointer-events: none; }',
        '.pf-pie.pf-agarra, .pf-pie.pf-agarra * { cursor: grabbing !important; user-select: none; }',
        "",
        "@media (max-width: 760px) {",
        "  .pf-pie__cols, .pf-pie[data-variante=\"vida\"] .pf-pie__cols { grid-template-columns: repeat(2, minmax(0, 1fr)); flex-basis: 100%; }",
        "  .pf-pie[data-variante=\"vida\"] .pf-pie__in { gap: 22px; }",
        "  .pf-pie[data-variante=\"trigo\"] .pf-pie__in { grid-template-columns: 1fr; } .pf-pie[data-variante=\"trigo\"] .pf-pie__der { grid-column: 1; padding-top: 34vw; }",
        "  .pf-pie__trigo { height: auto; width: 46vw; left: auto; right: -6vw; bottom: auto; top: -3vw; }",
        "}",
        "@media (prefers-reduced-motion: reduce) { .pf-pie { --p: 1 !important; } }"
      ].join("\n");
    },
    html: function (s) {
      var v = s.variante, logo = LOGO_BLANCO.replace("<svg", '<svg aria-hidden="true"');
      var cols = '  <div class="pf-pie__cols">\n' + COLUMNAS.map(function (c) {
        return '    <div><h3>' + c[0] + '</h3><ul>' + c[1].map(function (l) { return '<li><a href="#">' + l + '</a></li>'; }).join("") + '</ul></div>';
      }).join("\n") + '\n  </div>\n';
      var etica = s.etica
        ? '  <div class="pf-pie__etica"><div><b>Línea ética</b><span>Confidencial y anónima. Atiende un tercero independiente.</span></div><a class="pf-pie__pill" href="#">Hacer una denuncia</a></div>\n'
        : '';
      var legal = '  <div class="pf-pie__legal"><span>© 2026 Profertil S.A. Todos los derechos reservados.</span><nav><a href="#">Privacidad</a><a href="#">Términos de uso</a><a href="#">LinkedIn</a><a href="#">Instagram</a></nav></div>\n';
      var cab = '  <div class="pf-pie__cab"><div><a class="pf-pie__logo" href="#" aria-label="Profertil">' + logo + '</a></div><a class="pf-pie__pill" href="#">Contacto</a></div>\n';
      var h = '<footer class="pf-pie" data-c="footer">\n';
      if (v === "trigo") h += '<div class="pf-pie__trigo" aria-hidden="true">' + formaSVG("trigo") + '</div>\n';
      if (v === "vida") h += '<div class="pf-pie__foto" aria-hidden="true"><video autoplay muted loop playsinline preload="metadata" poster="media/pie-campo.jpg"><source src="media/pie-campo.mp4" type="video/mp4"></video></div>\n';
      h += '<div class="pf-pie__in">\n';
      if (v === "institucional") h += cab + cols + etica + legal;
      if (v === "trigo") h += ' <div class="pf-pie__der">\n' + cab + cols + etica + legal + ' </div>\n';
      if (v === "vida") h += '  <div class="pf-pie__arriba">\n  <a class="pf-pie__logo" href="#" aria-label="Profertil">' + logo + '</a>\n' + cols + '  </div>\n' +
        '  <div class="pf-pie__abajo">\n  <p class="pf-pie__vida" data-anim="ventana">Vida para nuestra tierra</p>\n' + etica + '  </div>\n' + legal;
      if (v === "formas") h += '  <div class="pf-pie__arriba">\n  <a class="pf-pie__logo" href="#" aria-label="Profertil">' + logo + '</a>\n' + cols + '  </div>\n' + etica;
      h += '</div>\n';
      if (v === "formas") h += '<canvas class="pf-pie__fisica" aria-hidden="true"></canvas>\n' + legal;
      return h + '</footer>';
    },
    js: function (s) {
      if (s.variante === "institucional") return "";
      if (s.variante === "formas") return "(" + FISICA.toString() + ")(" + JSON.stringify({ cantidad: +s.cantidad, tamano: +s.tamano }) + ");";
      return "(" + function () {
        // El pie avisa cuánto entró en pantalla (--p de 0 a 1): con eso se mueven el trigo, la foto y la frase.
        var pie = document.querySelector(".pf-pie"), pedido = false;
        // El video corre solo mientras el pie está en pantalla; con movimiento reducido queda quieto.
        var vid = pie.querySelector(".pf-pie__foto video"), quieto = matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (vid) {
          if (quieto) { vid.removeAttribute("autoplay"); vid.pause(); }
          else if ("IntersectionObserver" in window) new IntersectionObserver(function (e) { if (e[0].isIntersecting) vid.play().catch(function () {}); else vid.pause(); }).observe(pie);
        }
        if (quieto) return;
        function tic() {
          pedido = false;
          var r = pie.getBoundingClientRect(), p = Math.min(1, Math.max(0, (innerHeight - r.top) / r.height));
          pie.style.setProperty("--p", p.toFixed(4));
        }
        addEventListener("scroll", function () { if (!pedido) { pedido = true; requestAnimationFrame(tic); } }, { passive: true });
        addEventListener("resize", tic); tic();
      }.toString() + ")();";
    }
  });
})();
