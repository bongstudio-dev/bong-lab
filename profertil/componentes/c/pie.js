/* Pie de página: tres variantes y tres experimentos. */
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
        var f = FORMAS[n], vb = f.vb.split(" ").map(Number), lado = Math.max(vb[2], vb[3]), g = document.createElementNS(NS, "g"), caminos = [], cs = [];
        g.innerHTML = f.d; svg.appendChild(g);
        g.querySelectorAll("path").forEach(function (p) {
          // Cada trazo se pinta solo, como en el SVG: juntos en un camino, los que se pisan en sentido contrario se anulan.
          caminos.push(new Path2D(p.getAttribute("d")));
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
        lista.push({ nombre: n, lado: lado, caminos: caminos, regla: /evenodd/.test(f.d) ? "evenodd" : "nonzero", solidos: solidos });
      });
      svg.remove();
      return lista;
    }

    function arrancar() {
      var M = Matter; M.Common.setDecomp(window.decomp);
      var T = plantillas(), engine = M.Engine.create({ enableSleeping: true, positionIterations: 8, velocityIterations: 6 }), mundo = engine.world;
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
        // Las que quedaron afuera o cruzando una pared no se empujan adentro (quedarían encimadas): salen y vuelven a caer en un lugar libre.
        for (var i = cuerpos.length - 1; i >= 0; i--) {
          var c = cuerpos[i];
          if (c !== agarrada && (c.bounds.max.x > W || c.bounds.min.x < 0 || c.bounds.max.y > H)) { M.Composite.remove(mundo, c); cuerpos.splice(i, 1); cola.push(1); }
        }
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
        var q = simplificar(c.slice(0, k + 1), 1.2).slice(0, -1).concat(simplificar(c.slice(k).concat([c[0]]), 1.2).slice(0, -1));
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
          ctx.fillStyle = f.color; f.t.caminos.forEach(function (c) { ctx.fill(c, f.t.regla); }); ctx.restore();
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
        dibujar();
        // Si ya no cae nada, nadie arrastra y todas duermen, el ciclo se apaga: sin costo con la pila quieta.
        if (!agarre && !cola.length && cuerpos.every(function (b) { return b.isSleeping; })) { corre = false; return; }
        requestAnimationFrame(cuadro);
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
      // Al cambiar el tamaño el lienzo se mide en el acto (si espera, el navegador lo estira) y las formas se despiertan para reacomodarse.
      new ResizeObserver(function () { medir(); cuerpos.forEach(function (b) { M.Sleeping.set(b, false); }); dibujar(); seguir(); }).observe(pie);
    }
  }

  /* Flores (experimento): una banda de mosaicos al pie. Cada mosaico es un par secundario del Master (fondo y
     forma, 70/30) y corre su propio programa en loop: ocho movimientos agrupados en seis familias (rotación,
     tira, salto, corte, órbita y morph), todos con una sola forma a la vez. Cada programa tiene su tiempo, sus formas y sus pasos con pausa; después de
     unos compases el mosaico cambia: otro programa con una transición (barras, silueta de forma, empuje o diagonal)
     o, a veces, otro par del Master (por las rutas que siempre dejan a la vista un par o una terciaria).
     Dos mosaicos vecinos nunca comparten un color: antes de cambiar se mira lo que usan (y lo que van a usar) los
     cuatro de al lado. Curvas, duración y pesos se ajustan en vivo: window.pfVivo(O) los recibe sin reiniciar.
     O = { tamano, tempo, repeticiones, duracion, giro, curvaEntra, curvaCambio, pColor, pRot, pTira, pSalto, pCorte, pOrbita, pMorph }. */
  function FLORES(O) {
    var pie = document.querySelector(".pf-pie"), banda = pie.querySelector(".pf-pie__flores"), lienzo = banda.querySelector("canvas"), ctx = lienzo.getContext("2d");
    var quieto = matchMedia("(prefers-reduced-motion: reduce)").matches, css = getComputedStyle(document.documentElement);
    var TINTA = {};
    function color(v) { return TINTA[v] || (TINTA[v] = css.getPropertyValue("--" + v).trim()); }

    // Pares secundarios con fondo permitido (Color y texto: solo azul, verde, amarillo y terra llevan fondo de color).
    var PARES = { azul: "celeste", verde: "verde-claro", amarillo: "naranja", terra: "naranja" };
    /* Cambios de par por cobertura: el color nuevo entra por encima. En cada momento los colores a la vista son un
       par o una terciaria: azul→verde pasa por Azul/Celeste/Verde; verde→amarillo por Verde/Verde Claro/Amarillo;
       amarillo→verde por Amarillo/Naranja/Verde; con terra, primero se vacía o se pasa por el naranja que comparte
       con amarillo, así terra y amarillo nunca se tocan. "vaciar" saca la forma antes de cubrir. */
    var RUTAS = {
      "azul>verde": ["cubrir:verde"], "verde>azul": ["vaciar", "cubrir:azul"],
      "verde>amarillo": ["cubrir:amarillo"], "amarillo>verde": ["cubrir:verde"],
      "verde>terra": ["vaciar", "cubrir:terra"], "terra>verde": ["vaciar", "cubrir:verde"],
      "amarillo>terra": ["cubrir:naranja", "cubrir:terra"], "terra>amarillo": ["cubrir:naranja", "cubrir:amarillo"]
    };
    var FAM = { rot: ["reloj", "carta"], tira: ["tira"], salto: ["salto"], corte: ["rebanadas", "barrido"], orbita: ["orbita"], morph: ["morph"] };
    var MASCARAS = ["barras", "iris", "empuje", "diag"];

    // Curvas de Web/Movimiento, leídas de tokens.css.
    function bezier(v) {
      var n = v.match(/-?[\d.]+/g).map(Number), x1 = n[0], y1 = n[1], x2 = n[2], y2 = n[3];
      function b(t, a, c) { return 3 * a * t * (1 - t) * (1 - t) + 3 * c * t * t * (1 - t) + t * t * t; }
      return function (x) {
        if (x <= 0) return 0; if (x >= 1) return 1;
        var lo = 0, hi = 1, t = x;
        for (var i = 0; i < 24; i++) { if (b(t, x1, x2) < x) lo = t; else hi = t; t = (lo + hi) / 2; }
        return b(t, y1, y2);
      };
    }
    var CURVAS = { base: "ease", vista: "curva-vista", compacto: "f-chica-curva", carrusel: "carrusel-curva" };
    function curva(n) { var v = color(CURVAS[n] || "ease"); return bezier(/cubic-bezier/.test(v) ? v : "cubic-bezier(.22,1,.36,1)"); }
    var ENTRA, CAMBIO, GIRO;
    function ajustar() { ENTRA = curva(O.curvaEntra); CAMBIO = curva(O.curvaCambio); GIRO = O.giro * Math.PI / 180; }
    ajustar();

    /* Cada forma centrada y llevada a un cuadrado de lado 1. De cada una se mide cuánto llena (para el 70/30), cuánto
       radio macizo tiene en el centro (para cubrir el mosaico creciendo) y sus contornos como puntos (para el morph). */
    var T = {}, NS = "http://www.w3.org/2000/svg", svg = document.createElementNS(NS, "svg"), R = 96, P = 120;
    svg.setAttribute("style", "position:absolute;width:0;height:0;visibility:hidden"); document.body.appendChild(svg);
    var prueba = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
    prueba.canvas.width = prueba.canvas.height = R;
    function contornos(f) {
      var vb = f.vb.split(" ").map(Number), lado = Math.max(vb[2], vb[3]), lista = [];
      f.d.replace(/ d="([^"]+)"/g, function (_, d) {
        d.split(/(?=M)/).forEach(function (sub) {
          var p = document.createElementNS(NS, "path"); p.setAttribute("d", sub); svg.appendChild(p);
          var largo = p.getTotalLength(), pts = [];
          for (var i = 0; i < P; i++) { var q = p.getPointAtLength(largo * i / P); pts.push([(q.x - vb[2] / 2) / lado, (q.y - vb[3] / 2) / lado]); }
          svg.removeChild(p);
          if (largo > 0) lista.push(pts);
        });
      });
      return lista;
    }
    function area(c) { var a = 0; for (var i = 0, j = c.length - 1; i < c.length; j = i++) a += (c[j][0] + c[i][0]) * (c[j][1] - c[i][1]); return a / 2; }
    function adentro(p, c) { var r = false; for (var i = 0, j = c.length - 1; i < c.length; j = i++) { var a = c[i], b = c[j]; if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0]) r = !r; } return r; }
    // El morph pinta todos los contornos juntos con nonzero: los macizos van en un sentido y los huecos en el otro,
    // así los que se pisan suman en vez de anularse.
    function orientar(aros, evenodd) {
      return aros.map(function (c) {
        var hueco = evenodd && aros.some(function (o) { return o !== c && Math.abs(area(o)) > Math.abs(area(c)) && adentro(c[0], o); });
        return (area(c) > 0) === !hueco ? c : c.slice().reverse();
      });
    }
    Object.keys(FORMAS).forEach(function (n) {
      var f = FORMAS[n], vb = f.vb.split(" ").map(Number), lado = Math.max(vb[2], vb[3]), m = new DOMMatrix().scale(1 / lado).translate(-vb[2] / 2, -vb[3] / 2), cs = [], u = new Path2D();
      // Un camino por trazo, como en el SVG: juntos, los que se pisan en sentido contrario se anulan (pasaba en Círculos).
      f.d.replace(/ d="([^"]+)"/g, function (_, d) { var c = new Path2D(); c.addPath(new Path2D(d), m); cs.push(c); u.addPath(c); });
      T[n] = { caminos: cs, unido: u, regla: /evenodd/.test(f.d) ? "evenodd" : "nonzero", aros: orientar(contornos(f), /evenodd/.test(f.d)) };
    });
    var circ = new Path2D(), aro = []; circ.arc(0, 0, .5, 0, Math.PI * 2);
    for (var i = 0; i < P; i++) aro.push([.5 * Math.cos(2 * Math.PI * i / P - Math.PI / 2), .5 * Math.sin(2 * Math.PI * i / P - Math.PI / 2)]);
    T.circulo = { caminos: [circ], unido: circ, regla: "nonzero", aros: orientar([aro], false) };
    svg.remove();
    Object.keys(T).forEach(function (n) {
      prueba.setTransform(1, 0, 0, 1, 0, 0); prueba.clearRect(0, 0, R, R); prueba.setTransform(R, 0, 0, R, R / 2, R / 2);
      T[n].caminos.forEach(function (c) { prueba.fill(c, T[n].regla); });
      var px = prueba.getImageData(0, 0, R, R).data, lleno = 0, macizo = R;
      for (var y = 0; y < R; y++) for (var x = 0; x < R; x++) {
        var a = px[(y * R + x) * 4 + 3] > 127;
        if (a) lleno++; else macizo = Math.min(macizo, Math.hypot(x + .5 - R / 2, y + .5 - R / 2));
      }
      T[n].llena = lleno / (R * R); T[n].macizo = macizo / R;
      // Los aros de mayor a menor, para que el morph empareje el contorno grande con el grande.
      T[n].aros.sort(function (a, b) { return Math.abs(area(b)) - Math.abs(area(a)); });
    });
    var LISTA = Object.keys(T).filter(function (n) { return T[n].llena >= .25; });
    var CUBREN = Object.keys(T).filter(function (n) { return T[n].macizo >= .1; });

    // Morph: se emparejan los contornos por tamaño; el que sobra nace o muere en un punto. Cada par se alinea por el
    // arranque que menos recorre.
    function centro(c) { var x = 0, y = 0; c.forEach(function (p) { x += p[0]; y += p[1]; }); return [x / c.length, y / c.length]; }
    function emparejar(a, b) {
      var n = Math.max(a.length, b.length), pares = [];
      for (var k = 0; k < n; k++) {
        var x = a[k], y = b[k];
        if (!x) { var c = centro(y); x = y.map(function () { return c; }); }
        if (!y) { var d = centro(x); y = x.map(function () { return d; }); }
        if ((area(x) > 0) !== (area(y) > 0) && area(x) && area(y)) y = y.slice().reverse();
        var mejor = 0, menor = Infinity;
        for (var o = 0; o < P; o += 2) { var s = 0; for (var i = 0; i < P; i += 4) { var p = x[i], q = y[(i + o) % P]; s += (p[0] - q[0]) * (p[0] - q[0]) + (p[1] - q[1]) * (p[1] - q[1]); } if (s < menor) { menor = s; mejor = o; } }
        pares.push([x, y.slice(mejor).concat(y.slice(0, mejor))]);
      }
      return pares;
    }
    function caminoMorph(pares, k) {
      var c = new Path2D();
      pares.forEach(function (pq) {
        pq[0].forEach(function (p, i) { var q = pq[1][i], x = p[0] + (q[0] - p[0]) * k, y = p[1] + (q[1] - p[1]) * k; if (i) c.lineTo(x, y); else c.moveTo(x, y); });
        c.closePath();
      });
      return c;
    }

    function azar(a) { return a[Math.floor(Math.random() * a.length)]; }
    function mezclar(a) { var b = a.slice(); for (var i = b.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = b[i]; b[i] = b[j]; b[j] = t; } return b; }
    function sortear(pesos) {
      var total = 0, k; for (k in pesos) total += pesos[k];
      if (total <= 0) return null;
      var r = Math.random() * total; for (k in pesos) { r -= pesos[k]; if (r < 0) return k; }
      return k;
    }

    var W = 0, H = 0, ancho = 0, alto = 0, cols = 0, filas = 0, mos = [], dpr = Math.min(2, devicePixelRatio || 1);
    // Lado de una forma para que ocupe esa proporción del mosaico.
    function tam(n, prop) { return Math.min(Math.sqrt(prop * ancho * alto / T[n].llena), .92 * Math.min(ancho, alto)); }
    function forma(n, col, x, y, s, rot, kx, ky) {
      ctx.save(); ctx.translate(x, y); if (rot) ctx.rotate(rot);
      ctx.scale(s * (kx == null ? 1 : kx), s * (ky == null ? 1 : ky)); ctx.fillStyle = color(col);
      T[n].caminos.forEach(function (k) { ctx.fill(k, T[n].regla); }); ctx.restore();
    }

    /* Los programas. Cada uno es una función de su fase (compases transcurridos): en cada compás hay una pausa y un
       paso con la curva de cambio, así todo se mueve a tirones suaves y se repite sin costura. */
    function pos(p, desfase) {
      var c = p.fase - (desfase || 0); if (c < 0) c = 0;
      var k = Math.floor(c), u = c - k;
      return k + (u < p.hold ? 0 : CAMBIO((u - p.hold) / (1 - p.hold)));
    }
    var PROGS = {
      // Una forma que se achica y crece girando; cambia de forma cuando está más chica.
      reloj: function (p) {
        var q = pos(p), s = .5 - .5 * Math.cos(Math.PI * q), n = p.fs[Math.floor((q + 1) / 2) % p.fs.length];
        forma(n, p.c1, 0, 0, tam(n, .42) + (tam(n, .06) - tam(n, .42)) * s, p.sg * GIRO * q);
      },
      // Una moneda que da vuelta y muestra la otra forma por el dorso.
      carta: function (p) {
        var q = pos(p), f = Math.max(Math.abs(Math.cos(Math.PI * q)), .001), n = p.fs[Math.floor(q + .5) % 2];
        forma(n, p.c1, 0, 0, tam(n, .36), 0, p.vert ? 1 : f, p.vert ? f : 1);
      },
      // Una marquesina de una sola forma: cruza el mosaico de lado a lado y, cuando sale, entra la siguiente.
      tira: function (p) {
        var q = pos(p), sp = (p.vert ? alto : ancho) * 1.5, N = p.fs.length, off = q * sp * p.sg;
        var j0 = Math.floor((off - sp) / sp), j1 = Math.ceil((off + sp) / sp);
        for (var j = j0; j <= j1; j++) {
          var d = j * sp - off, n = p.fs[((j % N) + N) % N];
          if (Math.abs(d) < sp) forma(n, p.c1, p.vert ? 0 : d, p.vert ? d : 0, tam(n, .3), p.sg * GIRO * .5 * d / sp);
        }
      },
      // Una forma que salta de una esquina a otra del mosaico; en el salto se estira y gira.
      salto: function (p) {
        var q = pos(p), j = Math.floor(q), e = q - j, a = p.pts[j % 4], b = p.pts[(j + 1) % 4], n = p.fs[0];
        var x = (a[0] + (b[0] - a[0]) * e) * ancho, y = (a[1] + (b[1] - a[1]) * e) * alto;
        forma(n, p.c1, x, y, tam(n, .2) * (1 + .4 * Math.sin(Math.PI * e)), p.sg * GIRO * q);
      },
      // Una forma cortada en bandas que se desplazan fuera de fase y vuelven a alinearse.
      rebanadas: function (p) {
        var n = p.fs[0], s = tam(n, .6), nb = p.nb, amp = s * .55;
        for (var i = 0; i < nb; i++) {
          var e = .5 - .5 * Math.cos(Math.PI * pos(p, i * p.esc * .6)), b0 = -s / 2 + s * i / nb, bh = s / nb, off = amp * (i % 2 ? -1 : 1) * e;
          ctx.save(); ctx.beginPath();
          if (p.vert) ctx.rect(b0 - .5, -alto, bh + 1, alto * 2); else ctx.rect(-ancho, b0 - .5, ancho * 2, bh + 1);
          ctx.clip(); forma(n, p.c1, p.vert ? 0 : off, p.vert ? off : 0, s, 0); ctx.restore();
        }
      },
      // Una línea barre el mosaico: deja ver la forma y, al compás siguiente, la borra por el mismo lado. Después viene otra.
      barrido: function (p) {
        var q = pos(p), j = Math.floor(q), e = q - j, n = p.fs[Math.floor(j / 2) % p.fs.length], s = tam(n, .5), Rr = s * .7, ang = p.ang + p.sg * Math.floor(j / 2) * Math.PI / 2, borde = -Rr + 2 * Rr * e;
        ctx.save(); ctx.rotate(ang); ctx.beginPath();
        if (j % 2 === 0) ctx.rect(-4 * Rr, -2 * Rr, 4 * Rr + borde, 4 * Rr); else ctx.rect(borde, -2 * Rr, 4 * Rr, 4 * Rr);
        ctx.clip(); ctx.rotate(-ang); forma(n, p.c1, 0, 0, s, 0); ctx.restore();
      },
      // Una forma que da vueltas alrededor del centro, con una parada por compás.
      orbita: function (p) {
        var q = pos(p), n = p.fs[0], th = p.ang + p.sg * q * 2 * Math.PI / p.est, rr = .24 * Math.min(ancho, alto);
        forma(n, p.c1, Math.cos(th) * rr, Math.sin(th) * rr, tam(n, .22), -p.sg * GIRO * .5 * q);
      },
      // Una forma que se transforma en la siguiente de una cadena de tres.
      morph: function (p) {
        var q = pos(p), j = Math.floor(q), e = q - j, i = j % p.fs.length, a = p.fs[i], b = p.fs[(i + 1) % p.fs.length], s = tam(a, .36) + (tam(b, .36) - tam(a, .36)) * e;
        ctx.save(); ctx.scale(s, s); ctx.fillStyle = color(p.c1); ctx.fill(caminoMorph(p.pares[i], e), "nonzero"); ctx.restore();
      }
    };

    // Un programa nuevo: su tiempo, sus formas y los parámetros propios de cada movimiento.
    function crear(tipo, fam) {
      var p = { tipo: tipo, fase: 0, fk: .8 + Math.random() * .5, hold: .3 + Math.random() * .3, sg: Math.random() < .5 ? 1 : -1, vert: Math.random() < .5,
        bg: fam, c1: PARES[fam], esc: .08 + Math.random() * .14, nb: 4 + Math.floor(Math.random() * 4), est: 3 + Math.floor(Math.random() * 2),
        ang: Math.floor(Math.random() * 4) * Math.PI / 4 };
      p.fs = mezclar(LISTA).slice(0, 3);
      p.pts = mezclar([[-.22, -.22], [.22, -.22], [.22, .22], [-.22, .22]]);
      if (tipo === "morph") p.pares = p.fs.map(function (n, i) { return emparejar(T[n].aros, T[p.fs[(i + 1) % p.fs.length]].aros); });
      return p;
    }
    function tipoNuevo(actual) {
      var pesos = { rot: O.pRot, tira: O.pTira, salto: O.pSalto, corte: O.pCorte, orbita: O.pOrbita, morph: O.pMorph };
      if (actual) { var resto = 0; for (var k in pesos) if (k !== actual) resto += pesos[k]; if (resto > 0) pesos[actual] = 0; }
      var f = sortear(pesos) || "rot", t = azar(FAM[f]); return { fam: f, tipo: t };
    }
    function pal(fam) { return [fam, PARES[fam]]; }
    function palEstado(e) { return e.fam ? pal(e.fam) : [e.bg]; }

    // Los cuatro mosaicos de al lado: los colores que usan ahora y los que van a usar.
    function ocupadosVecinos(i) {
      var c = i % cols, f = Math.floor(i / cols), v = [];
      [[c - 1, f], [c + 1, f], [c, f - 1], [c, f + 1]].forEach(function (q) {
        var m = q[0] >= 0 && q[0] < cols && q[1] >= 0 && q[1] < filas && mos[q[1] * cols + q[0]];
        if (m) v = v.concat(m.ocupa);
      });
      return v;
    }
    function libre(colores, cerca) { return colores.every(function (c) { return cerca.indexOf(c) < 0; }); }

    function vida(p) { return p.fk * O.tempo * O.repeticiones * (.8 + Math.random() * .5); }
    function nuevo(i, t) {
      var cerca = ocupadosVecinos(i), fams = Object.keys(PARES), ok = fams.filter(function (f) { return libre(pal(f), cerca); });
      var fam = azar(ok.length ? ok : fams), n = tipoNuevo(null);
      var prog = crear(n.tipo, fam); prog.fase = Math.random() * 4; prog.fam = n.fam;
      mos[i] = { estado: { bg: fam, fam: fam, prog: prog }, tr: null, cola: [], ocupa: pal(fam), cambioEn: quieto ? Infinity : t + Math.random() * vida(prog) };
    }

    // Elige el cambio siguiente y arma la cola de transiciones: cada una lleva de un estado (fondo + programa) al siguiente.
    function planear(m, i, t) {
      var cerca = ocupadosVecinos(i), E = m.estado, fam = E.fam, cola = [], ocupa = m.ocupa.slice();
      var choca = !libre(m.ocupa, cerca), opciones = [];
      if (fam && (choca || Math.random() * 100 < O.pColor)) {
        Object.keys(PARES).forEach(function (f2) {
          if (f2 === fam || !libre(pal(f2), cerca)) return;
          var ruta = RUTAS[fam + ">" + f2];
          var inter = ruta ? ruta.filter(function (s) { return /^cubrir/.test(s); }).map(function (s) { return s.split(":")[1]; }) : [];
          if (ruta && libre(inter, cerca)) { opciones.push({ f: f2, ruta: ruta }); opciones.push({ f: f2, ruta: ruta }); }
          opciones.push({ f: f2, ruta: ["carta"] });
        });
      }
      if (opciones.length) {
        var o = azar(opciones), n = tipoNuevo(null), prog = crear(n.tipo, o.f); prog.fam = n.fam;
        var bg = E.bg, fa = fam;
        if (o.ruta[0] === "carta") cola.push({ mascara: "carta", hacia: { bg: o.f, fam: o.f, prog: prog } });
        else {
          o.ruta.forEach(function (s) {
            if (s === "vaciar") cola.push({ mascara: azar(["barras", "iris", "diag"]), hacia: { bg: bg, fam: fa, prog: null } });
            else { bg = s.split(":")[1]; fa = bg === o.f ? o.f : null; ocupa.push(bg); cola.push({ mascara: azar(MASCARAS), hacia: { bg: bg, fam: fa, prog: null } }); }
          });
          cola.push({ mascara: azar(MASCARAS), hacia: { bg: o.f, fam: o.f, prog: prog } });
        }
        ocupa = ocupa.concat(pal(o.f));
      } else {
        // Otro movimiento en el mismo par: primero sale la forma y después entra la siguiente, así nunca hay dos a la vez.
        var n2 = tipoNuevo(E.prog && E.prog.fam), p2 = crear(n2.tipo, fam || "azul"); p2.fam = n2.fam;
        if (E.prog) cola.push({ mascara: azar(["barras", "iris", "diag", "empuje"]), hacia: { bg: E.bg, fam: fam, prog: null } });
        cola.push({ mascara: azar(MASCARAS), hacia: { bg: E.bg, fam: fam, prog: fam ? p2 : null } });
      }
      m.cola = cola; m.ocupa = ocupa; m.cambioEn = Infinity; siguiente(m, t);
    }
    function siguiente(m, t) {
      var s = m.cola.shift();
      if (!s) { m.tr = null; m.ocupa = palEstado(m.estado); m.cambioEn = t + (m.estado.prog ? vida(m.estado.prog) : O.tempo * 2); return; }
      var tr = { mascara: s.mascara, hacia: s.hacia, t: t, dur: O.duracion * (s.mascara === "iris" ? 1.3 : s.mascara === "carta" ? 1.1 : 1.15) };
      if (s.mascara === "barras") { tr.n = 4 + Math.floor(Math.random() * 3); tr.vert = Math.random() < .5; tr.sg = Math.random() < .5 ? 1 : -1; }
      if (s.mascara === "iris") { tr.f = azar(CUBREN); tr.esc = Math.hypot(ancho, alto) / 2 / T[tr.f].macizo; }
      if (s.mascara === "empuje") { var d = azar([[1, 0], [-1, 0], [0, 1], [0, -1]]); tr.dx = d[0]; tr.dy = d[1]; }
      if (s.mascara === "diag") tr.ang = Math.floor(Math.random() * 8) * Math.PI / 4;
      if (s.hacia.prog) s.hacia.prog.fase = 0;
      m.tr = tr;
    }
    function avanzar(m, i, t) {
      if (m.tr) { if (t - m.tr.t >= m.tr.dur) { m.estado = m.tr.hacia; m.tr = null; siguiente(m, t); } }
      else if (m.cola.length) siguiente(m, t);
      else if (t >= m.cambioEn) planear(m, i, t);
    }
    // Sin movimiento: el cambio se aplica de una.
    function saltar(m, i) {
      planear(m, i, 0);
      if (m.tr) { m.estado = m.tr.hacia; m.tr = null; }
      m.cola.forEach(function (s) { m.estado = s.hacia; }); m.cola = []; m.ocupa = palEstado(m.estado); m.cambioEn = Infinity;
    }

    function medir() {
      var r = banda.getBoundingClientRect(); W = r.width; H = r.height;
      // Columnas y filas justas para llenar la banda: el mosaico queda casi cuadrado.
      var c2 = Math.max(2, Math.round(W / O.tamano)), a2 = W / c2, f2 = Math.max(1, Math.round(H / a2));
      var igual = c2 === cols && f2 === filas && mos.length === c2 * f2;
      cols = c2; ancho = a2; filas = f2; alto = H / filas;
      lienzo.width = Math.round(W * dpr); lienzo.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!igual) { var ahora = performance.now(); mos = []; for (var i = 0; i < cols * filas; i++) nuevo(i, ahora); }
    }

    function estadoDib(S) {
      ctx.fillStyle = color(S.bg); ctx.fillRect(-ancho / 2 - .5, -alto / 2 - .5, ancho + 1, alto + 1);
      if (S.prog) PROGS[S.prog.tipo](S.prog);
    }
    // Una transición muestra el estado viejo y deja ver el nuevo a través de una máscara que se abre.
    function transicion(m) {
      var tr = m.tr, A = m.estado, B = tr.hacia, k = Math.min(1, Math.max(0, (performance.now() - tr.t) / tr.dur)), e = (B.prog ? ENTRA : CAMBIO)(k);
      if (tr.mascara === "empuje") {
        ctx.save(); ctx.translate(-tr.dx * ancho * e, -tr.dy * alto * e); estadoDib(A); ctx.restore();
        ctx.save(); ctx.translate(tr.dx * ancho * (1 - e), tr.dy * alto * (1 - e)); estadoDib(B); ctx.restore(); return;
      }
      if (tr.mascara === "carta") {
        ctx.save(); ctx.scale(Math.max(Math.abs(Math.cos(Math.PI * e)), .001), 1); estadoDib(e < .5 ? A : B); ctx.restore(); return;
      }
      estadoDib(A); ctx.save();
      if (tr.mascara === "barras") {
        var n = tr.n, bw = (tr.vert ? ancho : alto) / n, esc = .35;
        ctx.beginPath();
        for (var b = 0; b < n; b++) {
          var eb = Math.min(1, Math.max(0, (e - (tr.sg > 0 ? b : n - 1 - b) * esc / n) / (1 - esc * (n - 1) / n))), w = (bw + 1) * eb, x0 = (tr.vert ? -ancho / 2 : -alto / 2) + b * bw - .5;
          if (tr.vert) ctx.rect(x0, -alto / 2 - .5, w, alto + 1); else ctx.rect(-ancho / 2 - .5, x0, ancho + 1, w);
        }
        ctx.clip();
      } else if (tr.mascara === "iris") {
        var c = new Path2D(); c.addPath(T[tr.f].unido, new DOMMatrix().rotateSelf(-GIRO * 180 / Math.PI * (1 - e)).scaleSelf(tr.esc * e)); ctx.clip(c, T[tr.f].regla);
      } else {
        var Rr = Math.hypot(ancho, alto) / 2, r = new Path2D(), c3 = new Path2D(); r.rect(-2 * Rr, -2 * Rr, 2 * Rr + (-Rr + 2 * Rr * e), 4 * Rr);
        c3.addPath(r, new DOMMatrix().rotateSelf(tr.ang * 180 / Math.PI)); ctx.clip(c3);
      }
      estadoDib(B); ctx.restore();
    }
    function dibujar() {
      ctx.clearRect(0, 0, W, H);
      mos.forEach(function (m, i) {
        var x = (i % cols) * ancho, y = Math.floor(i / cols) * alto;
        ctx.save(); ctx.beginPath(); ctx.rect(x, y, ancho + .5, alto + .5); ctx.clip();
        ctx.translate(x + ancho / 2, y + alto / 2);
        if (m.tr) transicion(m); else estadoDib(m.estado);
        ctx.restore();
      });
    }

    var visible = false, corre = false, ultimo = 0;
    function cuadro(t) {
      if (!visible) { corre = false; return; }
      var dt = Math.min(100, t - ultimo); ultimo = t;
      mos.forEach(function (m, i) {
        avanzar(m, i, t);
        [m.estado.prog, m.tr && m.tr.hacia.prog].forEach(function (p) { if (p) p.fase += dt / (p.fk * O.tempo); });
      });
      dibujar(); requestAnimationFrame(cuadro);
    }
    function seguir() { if (!corre && visible && !quieto) { corre = true; ultimo = performance.now(); requestAnimationFrame(cuadro); } }

    // Pasar el puntero o tocar un mosaico quieto lo hace cambiar.
    function tocar(e) {
      var r = lienzo.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      if (y < 0 || x < 0 || x >= W || y >= H) return;
      var i = Math.floor(y / alto) * cols + Math.floor(x / ancho), m = mos[i];
      if (!m || m.tr || m.cola.length) return;
      if (quieto) { saltar(m, i); dibujar(); } else planear(m, i, performance.now());
    }
    lienzo.addEventListener("pointermove", function (e) { if (e.pointerType === "mouse") tocar(e); });
    lienzo.addEventListener("pointerdown", tocar);

    /* Ajustes en vivo: la librería los manda sin recargar. Tempo, giro, curvas y duración se notan en el acto;
       tamaño rearma la grilla; los pesos y las repeticiones hacen que los mosaicos quietos vuelvan a elegir pronto. */
    window.pfVivo = function (N) {
      var antes = O; O = N; ajustar();
      if (N.tamano !== antes.tamano) medir();
      var cambioPesos = ["pColor", "pRot", "pTira", "pSalto", "pCorte", "pOrbita", "pMorph", "repeticiones"].some(function (k) { return N[k] !== antes[k]; });
      if (cambioPesos && !quieto) { var t = performance.now(); mos.forEach(function (m) { if (!m.tr && !m.cola.length) m.cambioEn = Math.min(m.cambioEn, t + 250 + Math.random() * 900); }); }
      if (quieto) dibujar();
    };

    medir(); dibujar();
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; seguir(); }).observe(banda);
    new ResizeObserver(function () { medir(); dibujar(); }).observe(banda);
  }

  /* Urea (experimento): un grano de urea cae sobre el campo y se parte en dos; cada mitad, en dos; y así hasta
     cubrirlo. Cada división pasa por la Forma Urea del sistema: del grano sale un brote más chico, crece y se separa
     de un salto. Los granos se acomodan siempre en un bloque parejo, uno por surco y fila, y la cámara se aleja a
     medida que se multiplican. Al final cada grano se hunde y brota; el viento los mece, el puntero los aparta y,
     después de un rato (o con un clic), el campo se recoge y cae otro grano.
     O = { divisiones, velocidad, viento, pausa }. */
  function UREA(O) {
    var pie = document.querySelector(".pf-pie"), banda = pie.querySelector(".pf-pie__urea"), lienzo = banda.querySelector("canvas"), ctx = lienzo.getContext("2d");
    var quieto = matchMedia("(prefers-reduced-motion: reduce)").matches, raiz = getComputedStyle(document.documentElement);

    // Curvas de Web/Movimiento, leídas de tokens.css.
    function bezier(v) {
      var n = v.match(/-?[\d.]+/g).map(Number), x1 = n[0], y1 = n[1], x2 = n[2], y2 = n[3];
      function b(t, a, c) { return 3 * a * t * (1 - t) * (1 - t) + 3 * c * t * t * (1 - t) + t * t * t; }
      return function (x) {
        if (x <= 0) return 0; if (x >= 1) return 1;
        var lo = 0, hi = 1, t = x;
        for (var i = 0; i < 24; i++) { if (b(t, x1, x2) < x) lo = t; else hi = t; t = (lo + hi) / 2; }
        return b(t, y1, y2);
      };
    }
    function curva(nombre, resp) { var v = raiz.getPropertyValue(nombre).trim(); return bezier(/cubic-bezier/.test(v) ? v : resp); }
    var BASE = curva("--ease", "cubic-bezier(.22,1,.36,1)"), VISTA = curva("--curva-vista", "cubic-bezier(.67,0,.24,.99)");
    function lim(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
    function suave(v) { v = lim(v); return v * v * (3 - 2 * v); }

    // Colores del campo: salen del CSS (--u-*) y se releen si cambia data-campo.
    var C = {};
    function colores() { var s = getComputedStyle(pie); ["surco", "grano", "brote"].forEach(function (k) { C[k] = s.getPropertyValue("--u-" + k).trim(); }); }
    colores();

    /* El mundo: el suelo es y = 0 y la separación entre surcos vale 1. El grano mide lo mismo siempre;
       lo que cambia es la distancia de la cámara. */
    var RG = .22, BROTE = .5, HOJA = .26, CAE = 1150, ESPERA = 300, BROTA = 2100, VUELVE = 1700;
    var P0 = 18 * Math.PI / 180, P1 = 44 * Math.PI / 180;
    var W = 0, H = 0, dpr = 1, F = 1, cy = 0, cols = 1, filas = 1, pasos = [], durs = [], dist = [], d0 = 1, dFin = 1, tzFin = 0, brotes = [];

    // Divisiones: cada paso duplica el bloque a lo ancho o a lo hondo, hasta llegar a cols × filas.
    function armar() {
      var G = O.divisiones, n = Math.pow(2, G), ancho = W >= H;
      cols = Math.pow(2, ancho ? Math.ceil(G / 2) : Math.floor(G / 2)); filas = n / cols;
      pasos = []; durs = [];
      var w = 1, h = 1;
      for (var g = 0; g < G; g++) {
        var ex = w / cols, ez = h / filas, enX = ex < ez || (ex === ez && ancho);
        pasos.push({ w: w, h: h, x: enX }); if (enX) w *= 2; else h *= 2;
        durs.push(220 + 680 * Math.pow(.75, g));
      }
      pasos.push({ w: w, h: h });
      // Cada grano brota con un retraso según la distancia al centro: el campo verdea de adentro hacia afuera.
      brotes = [];
      for (var j = 0; j < filas; j++) for (var i = 0; i < cols; i++) {
        var x = i - cols / 2 + .5, z = j - filas / 2 + .5, rn = Math.min(1, Math.hypot(x / cols, z / filas) * 1.42);
        brotes.push({ x: x, z: z, rn: rn, dl: rn * 750 + Math.random() * 260, b: 0, fase: Math.random() * 6.28 });
      }
      encuadre();
    }
    // Encuadre: el primer grano grande al centro; al final, el campo entero de lado a lado.
    function encuadre() {
      F = Math.max(W, H) * .85; cy = H * .48;
      d0 = F * RG / (Math.min(W, H) * .085);
      dFin = F * cols / (1.08 * W); tzFin = -filas * .14;
      dist = pasos.map(function (p, g) {
        var pt = P0 + (P1 - P0) * g / (pasos.length - 1);
        return Math.min(dFin, Math.max(d0, F * (p.w + 1.2) / (.62 * W), F * (p.h + 1.2) * Math.sin(pt) / (.5 * H)));
      });
      dist[dist.length - 1] = dFin;
      for (var g = 1; g < dist.length; g++) dist[g] = Math.max(dist[g], dist[g - 1]);
    }
    function medir() {
      var w = banda.clientWidth, h = banda.clientHeight; if (!w || !h) return;
      var cambia = (w >= h) !== (W >= H);
      W = w; H = h; dpr = Math.min(2, devicePixelRatio || 1);
      lienzo.width = Math.round(W * dpr); lienzo.height = Math.round(H * dpr);
      if (cambia || !pasos.length) armar(); else encuadre();
    }

    // Cámara: mira a (0, 0, tz) desde una distancia D, con una inclinación y un giro lento.
    var K = { px: 0, py: 0, pz: 0, fx: 0, fy: 0, fz: 0, rx: 0, rz: 0, ux: 0, uy: 0, uz: 0 };
    function camara(D, incl, tz, giro) {
      var cp = Math.cos(incl), sp = Math.sin(incl), cg = Math.cos(giro), sg = Math.sin(giro);
      K.fx = sg * cp; K.fy = -sp; K.fz = cg * cp;
      K.rx = cg; K.rz = -sg;
      K.ux = K.fy * K.rz; K.uy = K.fz * K.rx - K.fx * K.rz; K.uz = -K.fy * K.rx;
      K.px = -D * K.fx; K.py = -D * K.fy; K.pz = tz - D * K.fz;
    }
    var S = { x: 0, y: 0, k: 0 };
    function proy(x, y, z) {
      var vx = x - K.px, vy = y - K.py, vz = z - K.pz, zc = vx * K.fx + vy * K.fy + vz * K.fz;
      if (zc < .25) return false;
      S.k = F / zc; S.x = W / 2 + (vx * K.rx + vz * K.rz) * S.k; S.y = cy - (vx * K.ux + vy * K.uy + vz * K.uz) * S.k;
      return true;
    }

    /* Puente entre dos círculos (metaball): es el cuello de la Forma Urea. Se afina a medida que se alejan
       y se corta solo cuando ya es un punto, así la separación no salta. */
    function puente(x1, y1, r1, x2, y2, r2) {
      var d = Math.hypot(x2 - x1, y2 - y1), suma = r1 + r2, max = suma + r2 * 1.6;
      if (r1 < .5 || r2 < .5 || d >= max || d <= Math.abs(r1 - r2)) return;
      var v = .5 * (1 - lim((d - suma) / (max - suma))), u1 = 0, u2 = 0;
      if (v < .1) return;
      if (d < suma) { u1 = Math.acos((r1 * r1 + d * d - r2 * r2) / (2 * r1 * d)); u2 = Math.acos((r2 * r2 + d * d - r1 * r1) / (2 * r2 * d)); }
      var a = Math.atan2(y2 - y1, x2 - x1), ms = Math.acos((r1 - r2) / d);
      var a1 = a + u1 + (ms - u1) * v, a2 = a - u1 - (ms - u1) * v, a3 = a + Math.PI - u2 - (Math.PI - u2 - ms) * v, a4 = a - Math.PI + u2 + (Math.PI - u2 - ms) * v;
      var p1x = x1 + Math.cos(a1) * r1, p1y = y1 + Math.sin(a1) * r1, p2x = x1 + Math.cos(a2) * r1, p2y = y1 + Math.sin(a2) * r1;
      var p3x = x2 + Math.cos(a3) * r2, p3y = y2 + Math.sin(a3) * r2, p4x = x2 + Math.cos(a4) * r2, p4y = y2 + Math.sin(a4) * r2;
      var e = Math.min(1.2, Math.hypot(p1x - p3x, p1y - p3y) / suma) * Math.min(1, d * 2 / suma), h1 = r1 * e, h2 = r2 * e, q = Math.PI / 2;
      ctx.moveTo(p1x, p1y);
      ctx.bezierCurveTo(p1x + Math.cos(a1 - q) * h1, p1y + Math.sin(a1 - q) * h1, p3x + Math.cos(a3 + q) * h2, p3y + Math.sin(a3 + q) * h2, p3x, p3y);
      ctx.lineTo(p4x, p4y);
      ctx.bezierCurveTo(p4x + Math.cos(a4 - q) * h2, p4y + Math.sin(a4 - q) * h2, p2x + Math.cos(a2 + q) * h1, p2y + Math.sin(a2 + q) * h1, p2x, p2y);
      ctx.closePath();
    }

    // Estado del ciclo. El tiempo de animación corre a la velocidad elegida; el campo crecido y el viento, a tiempo real.
    var fase = "nada", tf = 0, tReal = 0, dSal = 1, pSal = P1, zSal = 0, puntero = null, visible = false, corre = false, ultimo = 0, empezo = false;
    function ir(f) { fase = f; tf = 0; }

    function dibujar() {
      if (!W) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      var G = pasos.length - 1, D, incl, tz, k = -1, u = 0, crece = 0;
      // Dónde está la cámara según la fase.
      if (fase === "nada" || fase === "cae") { D = dist[0]; incl = P0; tz = 0; }
      else if (fase === "parte") {
        var t = tf; k = 0; while (k < G - 1 && t >= durs[k]) { t -= durs[k]; k++; }
        u = lim(t / durs[k]);
        var gc = k + suave(u); crece = gc / G;
        D = Math.exp(Math.log(dist[k]) + (Math.log(dist[k + 1]) - Math.log(dist[k])) * suave(u));
        incl = P0 + (P1 - P0) * suave(crece); tz = tzFin * suave(crece);
      } else if (fase === "vuelve") {
        var r = VISTA(tf / VUELVE); crece = 1 - r;
        D = Math.exp(Math.log(dSal) + (Math.log(dist[0]) - Math.log(dSal)) * r);
        incl = pSal + (P0 - pSal) * r; tz = zSal * (1 - r);
      } else { D = dFin * (1 + .05 * suave((fase === "campo" ? tf + BROTA : tf) / (BROTA + O.pausa))); incl = P1; tz = tzFin; crece = 1; }
      camara(D, incl, tz, quieto ? 0 : .09 * Math.sin(tReal * .00013));
      dSal = D; pSal = incl; zSal = tz;

      // Surcos: todo el campo apenas marcado, y más presente donde ya llegaron los granos.
      var bloque = fase === "parte" ? pasos[k] : (fase === "nada" || fase === "cae") ? { w: 0, h: 0 } : pasos[G];
      var rx = fase === "parte" ? (pasos[k].w + (pasos[k + 1].w - pasos[k].w) * suave(u)) / 2 + .5 : bloque.w / 2 + .5;
      var rz = fase === "parte" ? (pasos[k].h + (pasos[k + 1].h - pasos[k].h) * suave(u)) / 2 + .5 : bloque.h / 2 + .5;
      if (fase === "cae") { var imp = lim((tf - CAE * .49) / 500); rx = rz = imp * 1.2; }
      if (fase === "vuelve") { rx = cols / 2 * crece; rz = filas / 2 * crece; }
      ctx.lineWidth = 1; ctx.strokeStyle = C.surco;
      [[cols / 2, filas / 2, .16], [Math.min(rx, cols / 2), Math.min(rz, filas / 2), .5]].forEach(function (c) {
        if (c[0] <= 0 || c[1] <= 0) return;
        ctx.globalAlpha = c[2]; ctx.beginPath();
        for (var i = 0; i < cols; i++) {
          var x = i - cols / 2 + .5; if (Math.abs(x) > c[0]) continue;
          // El tramo se corta antes del plano de la cámara.
          var za = -c[1], zb = c[1], zm = K.pz + .3 / Math.max(.05, K.fz);
          if (zb < zm) continue; if (za < zm) za = zm;
          if (proy(x, 0, za)) { ctx.moveTo(S.x, S.y); if (proy(x, 0, zb)) ctx.lineTo(S.x, S.y); }
        }
        ctx.stroke();
      });
      ctx.globalAlpha = 1;

      // Granos.
      ctx.fillStyle = C.grano;
      if (fase === "cae") {
        var s = lim(tf / CAE) * 2.05, e = .38, y;
        if (s < 1) y = 1 - s * s; else if ((s -= 1) < 2 * e) y = s * (2 * e - s); else { s -= 2 * e; y = s < 2 * e * e ? s * (2 * e * e - s) : 0; }
        // Onda en el suelo al primer golpe.
        var o = (tf - CAE * .49) / 900;
        if (o > 0 && o < 1) {
          ctx.globalAlpha = .55 * (1 - o); ctx.strokeStyle = C.grano; ctx.lineWidth = 1.5; ctx.beginPath();
          for (var a = 0; a <= 48; a++) { var an = a / 48 * Math.PI * 2, rr = RG + BASE(o) * 2.6; if (proy(Math.cos(an) * rr, 0, Math.sin(an) * rr)) ctx[a ? "lineTo" : "moveTo"](S.x, S.y); }
          ctx.stroke(); ctx.globalAlpha = 1;
        }
        if (proy(0, RG + y * 3.2, 0)) { ctx.beginPath(); ctx.arc(S.x, S.y, RG * S.k, 0, 6.2832); ctx.fill(); }
      } else if (fase === "parte") {
        var p = pasos[k], cir = new Path2D(), brote = u < .4 ? BASE(u / .4) : 1, v = VISTA((u - .4) / .6);
        ctx.beginPath();
        for (var j = 0; j < p.h; j++) for (var i = 0; i < p.w; i++) {
          var px = i - p.w / 2 + .5, pz = j - p.h / 2 + .5, ax, az, bx, bz, dx = 0, dz = 0;
          if (p.x) { var c1 = 2 * i - p.w + .5, c2 = c1 + 1, afuera = Math.abs(c2) > Math.abs(c1); ax = afuera ? c1 : c2; bx = afuera ? c2 : c1; az = bz = pz; dx = bx > ax ? 1 : -1; }
          else { var c3 = 2 * j - p.h + .5, c4 = c3 + 1, afz = Math.abs(c4) > Math.abs(c3); az = afz ? c3 : c4; bz = afz ? c4 : c3; ax = bx = px; dz = bz > az ? 1 : -1; }
          // Brote: sale del grano como en la Forma Urea (52% del radio, a 1,19 radios del centro).
          var ox = px + dx * RG * 1.19 * brote, oz = pz + dz * RG * 1.19 * brote;
          var gx = px + (ax - px) * v, gz = pz + (az - pz) * v, hx = ox + (bx - ox) * v, hz = oz + (bz - oz) * v;
          var salto = Math.sin(Math.PI * v) * (.25 + .16 * Math.hypot(bx - px, bz - pz)), rb = RG * (.52 + .48 * v) * brote;
          if (!proy(gx, RG + salto, gz)) continue;
          var x1 = S.x, y1 = S.y, r1 = RG * S.k;
          if (!proy(hx, rb + salto, hz)) continue;
          var x2 = S.x, y2 = S.y, r2 = rb * S.k;
          if ((x1 < -60 && x2 < -60) || (x1 > W + 60 && x2 > W + 60) || (y1 > H + 60 && y2 > H + 60)) continue;
          cir.moveTo(x1 + r1, y1); cir.arc(x1, y1, r1, 0, 6.2832);
          if (r2 > .3) { cir.moveTo(x2 + r2, y2); cir.arc(x2, y2, r2, 0, 6.2832); }
          puente(x1, y1, r1, x2, y2, r2);
        }
        ctx.fill(); ctx.fill(cir);
      }

      // Brotes: cada grano se hunde y en su lugar sale un plantín de dos hojas.
      if (fase === "brota" || fase === "campo" || fase === "vuelve") dibujarBrotes();
    }

    function dibujarBrotes() {
      var granos = new Path2D(), tallos = new Path2D(), hojas = new Path2D(), pp = null;
      if (puntero && !quieto) {
        // Dónde toca el puntero en el suelo.
        var sx = (puntero.x - W / 2) / F, sy = -(puntero.y - cy) / F;
        var dx = K.fx + K.rx * sx + K.ux * sy, dy = K.fy + K.uy * sy, dz = K.fz + K.rz * sx + K.uz * sy;
        if (dy < -.01) { var t = -K.py / dy; pp = { x: K.px + dx * t, z: K.pz + dz * t }; }
      }
      var vi = O.viento / 100, ola = (tReal * .0042) % (cols + filas + 24) - 12 - (cols + filas) / 2;
      for (var n = 0; n < brotes.length; n++) {
        var b = brotes[n], gr = 1, ho = 1, hund = 1;
        if (fase === "brota") { var s = tf - b.dl; hund = BASE(s / 380); gr = BASE((s - 150) / 900); ho = BASE((s - 420) / 760); }
        else if (fase === "vuelve") { var s2 = tf - (1 - b.rn) * 450; gr = ho = 1 - VISTA(s2 / 560); }
        if (!proy(b.x, 0, b.z)) continue;
        var bx = S.x, by = S.y, k = S.k;
        if (bx < -80 || bx > W + 80 || by > H + 120 || by < -40) continue;
        // El grano que todavía no terminó de hundirse.
        if (hund < 1) { var rr = RG * (1 - hund); if (proy(b.x, rr, b.z)) { granos.moveTo(S.x + rr * S.k, S.y); granos.arc(S.x, S.y, rr * S.k, 0, 6.2832); } }
        if (gr <= 0) continue;
        // Viento: una oscilación por brote más una racha que cruza el campo; el puntero los aparta.
        var meta = 0;
        if (!quieto) {
          var racha = Math.exp(-Math.pow(b.x * .8 + b.z * .45 - ola, 2) / 10);
          meta = vi * (.16 * Math.sin(tReal * .0019 + b.fase + b.x * .3) + .5 * racha);
          if (pp) { var ddx = b.x - pp.x, ddz = b.z - pp.z, dd = Math.hypot(ddx, ddz); if (dd < 2.4) meta += (ddx >= 0 ? 1 : -1) * Math.pow(1 - dd / 2.4, 2) * .95; }
        }
        b.b += (meta - b.b) * .12;
        var a = b.b, h = BROTE * gr * k, sa = Math.sin(a), ca = Math.cos(a);
        var tx = bx + sa * h, ty = by - ca * h, mx = bx + Math.sin(a * .35) * h * .55, my = by - h * .55;
        var w0 = Math.max(.6, .05 * k * gr), w1 = Math.max(.4, .025 * k * gr);
        // Tallo: un trazo relleno que se afina, curvado hacia donde se dobla.
        tallos.moveTo(bx - w0, by);
        tallos.quadraticCurveTo(mx - (w0 + w1) / 2 * Math.cos(a * .5), my - (w0 + w1) / 2 * Math.sin(a * .5), tx - w1 * ca, ty - w1 * sa);
        tallos.lineTo(tx + w1 * ca, ty + w1 * sa);
        tallos.quadraticCurveTo(mx + (w0 + w1) / 2 * Math.cos(a * .5), my + (w0 + w1) / 2 * Math.sin(a * .5), bx + w0, by);
        tallos.closePath();
        // Dos hojas que se abren en V desde la punta.
        if (ho > 0) [-1, 1].forEach(function (l) {
          var an = a + l * (.18 + .78 * ho), L = HOJA * k * ho, ww = L * .36, ds = Math.sin(an), dc = -Math.cos(an), ex = tx + ds * L, ey = ty + dc * L;
          hojas.moveTo(tx, ty);
          hojas.quadraticCurveTo(tx + ds * L * .5 - dc * ww, ty + dc * L * .5 + ds * ww, ex, ey);
          hojas.quadraticCurveTo(tx + ds * L * .5 + dc * ww, ty + dc * L * .5 - ds * ww, tx, ty);
        });
      }
      ctx.fillStyle = C.grano; ctx.fill(granos);
      ctx.fillStyle = C.brote; ctx.fill(tallos); ctx.fill(hojas);
    }

    function avanzar(dt) {
      var da = dt * O.velocidad / 100; tReal += dt;
      if (fase === "cae") { tf += da; if (tf >= CAE + ESPERA) ir("parte"); }
      else if (fase === "parte") { tf += da; var tot = durs.reduce(function (a, b) { return a + b; }, 0); if (tf >= tot) ir("brota"); }
      else if (fase === "brota") { tf += da; if (tf >= BROTA) ir("campo"); }
      else if (fase === "campo") { tf += dt; if (tf >= O.pausa) ir("vuelve"); }
      else if (fase === "vuelve") { tf += da; if (tf >= VUELVE) { brotes.forEach(function (b) { b.b = 0; }); ir("cae"); } }
    }
    function cuadro(t) {
      if (!visible) { corre = false; return; }
      var dt = Math.min(64, t - ultimo); ultimo = t;
      avanzar(dt); dibujar(); requestAnimationFrame(cuadro);
    }
    function seguir() { if (!corre && visible && !quieto && empezo) { corre = true; ultimo = performance.now(); requestAnimationFrame(cuadro); } }

    // Puntero: aparta los brotes. Un clic con el campo crecido lo hace volver a empezar.
    lienzo.addEventListener("pointermove", function (e) { var r = lienzo.getBoundingClientRect(); puntero = { x: e.clientX - r.left, y: e.clientY - r.top }; });
    lienzo.addEventListener("pointerleave", function () { puntero = null; });
    lienzo.addEventListener("click", function () { if (fase === "campo") ir("vuelve"); });
    new MutationObserver(function () { colores(); if (!corre) dibujar(); }).observe(pie, { attributes: true, attributeFilter: ["data-campo"] });

    // Ajustes en vivo: la librería los manda sin recargar. Cambiar las divisiones rearma el campo y empieza de nuevo.
    window.pfVivo = function (N) {
      var antes = O; O = N;
      if (N.divisiones !== antes.divisiones) { armar(); if (quieto) ir("campo"); else if (empezo) ir("cae"); }
      if (!corre) dibujar();
    };

    medir();
    // Con movimiento reducido el campo aparece ya crecido y quieto.
    if (quieto) { ir("campo"); dibujar(); }
    else dibujar();
    new IntersectionObserver(function (es) {
      visible = es[0].isIntersecting;
      if (visible && !empezo && !quieto && es[0].intersectionRatio >= .3) { empezo = true; ir("cae"); }
      seguir();
    }, { threshold: [0, .3] }).observe(banda);
    new ResizeObserver(function () { medir(); dibujar(); }).observe(banda);
  }

  // Los ajustes de Flores tal como los lee FLORES. La librería también los manda en vivo (vivo) sin recargar la vista.
  function opcionesFlores(s) {
    return { tamano: +s.mosaico, tempo: +s.tempo, repeticiones: +s.repeticiones, duracion: +s.duracion, giro: +s.giro, curvaEntra: s.curvaEntra, curvaCambio: s.curvaCambio,
      pColor: +s.pColor, pRot: +s.pRot, pTira: +s.pTira, pSalto: +s.pSalto, pCorte: +s.pCorte, pOrbita: +s.pOrbita, pMorph: +s.pMorph };
  }

  // Los ajustes de Urea tal como los lee UREA; también van en vivo.
  function opcionesUrea(s) { return { divisiones: +s.divisiones, velocidad: +s.velocidad, viento: +s.viento, pausa: +s.pausa * 1000 }; }
  // La línea ética cambia el HTML: si se prende o se apaga, la vista se rearma en vez de ir en vivo.
  var eticaCargada;

  Libreria.sumar({
    id: "footer", nombre: "Pie de página", grupo: "Navegación", alto: "auto", sangrado: true,
    bajada: "El cierre de todas las páginas: navegación, línea ética y datos legales. Tres variantes, de la más sobria a la más osada, y tres experimentales.",
    variantes: [
      ["institucional", "Institucional", "La base: fondo de color, logo y bajada arriba, cuatro columnas, línea ética y legales."],
      ["trigo", "Con trigo", "Fondo tiza y el trigo del sistema en amarillo pleno, a la izquierda, que sube más lento que la página."],
      ["vida", "Vida para nuestra tierra", "Alto de pantalla completa con un video de campo en loop de fondo y un filtro negro parejo. La frase va abajo a la izquierda, a tamaño de título, y entra con el animador Ventana."],
      ["formas", "Formas que caen", "Experimento. Alto de pantalla completa en marfil: arriba logo, links y línea ética; abajo caen las formas del sistema con física, se apilan hasta la mitad y se pueden agarrar y tirar."],
      ["flores", "Flores", "Experimento. Alto de pantalla completa en marfil: arriba logo, links y línea ética; abajo una banda de mosaicos, cada uno un par secundario del Master: fondo y forma en 70/30. Cada mosaico muestra una sola forma a la vez y corre su propio loop (rotación, tira, salto, corte, órbita o morph); cada tanto la forma sale y entra otro movimiento, o cambia el par de colores. Dos mosaicos vecinos nunca comparten un color. Al pasar el puntero o tocar, cambian en el acto."],
      ["urea", "Urea", "Experimento. Alto de pantalla completa en azul: arriba logo, links y línea ética; abajo cae un grano de urea sobre el campo y se parte en dos, cada mitad en dos, hasta dejar uno por surco y fila. Cada división pasa por la Forma Urea: del grano sale un brote más chico que crece y se separa. Después los granos se hunden y brotan, el viento los mece y el puntero los aparta."]
    ],
    tamano: "media",
    vivo: function (s) {
      if (s.etica !== eticaCargada) return null;
      return s.variante === "flores" ? opcionesFlores(s) : s.variante === "urea" ? opcionesUrea(s) : null;
    },
    claves: ["La línea ética va siempre en el pie, con su propio llamado, en una sola línea discreta.", "Los fondos de color son solo los del Master (azul, verde, terra, amarillo); sobre amarillo el texto va en azul.", "El logo va siempre completo: no se recorta ni se separa el símbolo de la palabra.", "Las columnas repiten el menú principal: si cambia la arquitectura, cambia el pie.", "Con trigo y Vida para nuestra tierra tienen parallax: el trigo y la foto se mueven a otra velocidad que la página mientras el pie entra en pantalla.", "Vida para nuestra tierra ocupa una pantalla entera. La frase va alineada a la izquierda junto a la línea ética, y entra con el animador Ventana, palabra por palabra.", "Nunca degradados sobre la foto (ni de color ni de tinta). Si hace falta contraste, un filtro negro parejo.", "Formas que caen es un experimento: las 18 formas del Master en los 7 colores de marca, sin dos del mismo color tocándose (si se tocan, la que se mueve cambia de color). Arrancan a caer cuando el pie entra en pantalla.", "Flores es un experimento: cada mosaico es un par secundario del Master (fondo y forma, 70/30) con su propio programa en loop. Un tercer color solo aparece si forma una terciaria. Dos mosaicos vecinos nunca comparten un color, ni siquiera mientras cambian.", "Los cambios de par pasan siempre por rutas que dejan a la vista un par o una terciaria; terra y amarillo no se tocan nunca porque comparten el naranja.", "Urea es un experimento: el grano va en tiza, como la urea, y se divide pasando por la Forma Urea del sistema. Los granos se acomodan siempre en un bloque parejo, uno por surco; la cámara se aleja a medida que se multiplican y cada división dura un poco menos que la anterior."],
    accesibilidad: "Es un <footer> con listas de links reales. El trigo es decorativo (aria-hidden); el video es decorativo, mudo y sin controles; la frase es texto real, legible por lectores y buscadores. Con movimiento reducido no hay parallax y el video queda quieto en el primer cuadro. En Formas que caen el lienzo es decorativo (aria-hidden) y deja pasar los clics a los links; con movimiento reducido las formas aparecen ya apiladas. En Flores el lienzo también es decorativo; con movimiento reducido los mosaicos quedan quietos y solo cambian al tocarlos, sin animación. En Urea el lienzo es decorativo; con movimiento reducido el campo aparece ya crecido y quieto.",
    dependencias: ["en Formas que caen, Matter.js 0.20 y poly-decomp 0.3 desde CDN, y formas.js"],
    previo: '<div style="height:80vh;display:grid;place-items:center;color:var(--ink-3);font-size:var(--texto-chico)">Final de la página</div>',
    controles: [
      { id: "fondo", tipo: "seg", etiqueta: "Fondo", solo: ["institucional"], def: "azul", aplica: { attr: "data-fondo" }, opciones: [["azul", "Azul"], ["verde", "Verde"], ["terra", "Terra"], ["amarillo", "Amarillo"]], desc: "Color de fondo y tinta que va encima." },
      { id: "filtro", tipo: "rango", etiqueta: "Filtro negro", solo: ["vida"], unidad: "%", min: 0, max: 70, def: 26, aplica: { var: "--filtro" }, desc: "Negro parejo sobre toda la foto para que el texto en tiza se lea. Sin degradado." },
      { id: "frase", tipo: "rango", etiqueta: "Frase", solo: ["vida"], unidad: "px", min: 32, max: 200, def: 140, aplica: { var: "--frase", unidad: "px" }, desc: "Cuerpo de Vida para nuestra tierra. En pantallas chicas no pasa del 14% del ancho." },
      { id: "par", tipo: "rango", etiqueta: "Parallax", solo: ["trigo", "vida"], unidad: "%", min: 0, max: 40, def: 22, aplica: { var: "--par" }, desc: "Cuánto se corre el trigo o el video mientras entra el pie. En Vida, solo el video." },
      { id: "cantidad", tipo: "rango", etiqueta: "Cantidad", solo: ["formas"], unidad: "formas", min: 6, max: 120, def: 28, desc: "Cuántas formas caen en un pie de 1440 × 900. En otros tamaños se ajusta al área, para que llenen lo mismo." },
      { id: "tamano", tipo: "rango", etiqueta: "Tamaño", solo: ["formas"], unidad: "px", min: 48, max: 280, def: 160, desc: "Lado de cada forma. En pantallas chicas no pasa del 30% del ancho." },
      { id: "mosaico", tipo: "rango", etiqueta: "Mosaico", solo: ["flores"], unidad: "px", min: 100, max: 480, def: 240, desc: "Lado aproximado de cada mosaico. Se ajusta para que entren justos en el ancho y en el alto de la banda, que llena todo lo que queda debajo del contenido." },
      { id: "tempo", tipo: "rango", etiqueta: "Tempo", solo: ["flores"], unidad: "ms", min: 800, max: 6000, paso: 100, def: 2400, desc: "Lo que dura un compás de cada mosaico: una pausa y un paso. Cada uno va a su propio tiempo, un poco más rápido o más lento." },
      { id: "repeticiones", tipo: "rango", etiqueta: "Repeticiones", solo: ["flores"], unidad: "compases", min: 1, max: 12, def: 4, desc: "Cuántos compases se repite un movimiento antes de que el mosaico cambie a otro." },
      { id: "duracion", tipo: "rango", etiqueta: "Transición", solo: ["flores"], unidad: "ms", min: 300, max: 2000, paso: 50, def: 900, desc: "Lo que tarda el cambio de un movimiento a otro: barras, silueta de forma, empuje o diagonal." },
      { id: "giro", tipo: "rango", etiqueta: "Giro", solo: ["flores"], unidad: "°", min: 0, max: 360, paso: 15, def: 90, desc: "Cuánto gira una forma por compás en los movimientos que giran, y al abrirse la silueta de una transición. En 0 no gira." },
      { id: "curvaEntra", tipo: "select", etiqueta: "Curva de entrada", solo: ["flores"], def: "base", opciones: [["base", "Base", "Web/Movimiento/Curva base: arranca rápido y frena largo."], ["vista", "Vista", "Curva vista: sale y llega suave, pareja en los dos extremos."], ["compacto", "Compacto", "Curva compacto: arranque seco, frenada corta."], ["carrusel", "Carrusel", "Curva carrusel: ida y vuelta marcada, más pesada."]], desc: "Curva con la que entra un movimiento nuevo sobre el mosaico." },
      { id: "curvaCambio", tipo: "select", etiqueta: "Curva de cambio", solo: ["flores"], def: "vista", opciones: [["base", "Base", "Web/Movimiento/Curva base: arranca rápido y frena largo."], ["vista", "Vista", "Curva vista: sale y llega suave, pareja en los dos extremos."], ["compacto", "Compacto", "Curva compacto: arranque seco, frenada corta."], ["carrusel", "Carrusel", "Curva carrusel: ida y vuelta marcada, más pesada."]], desc: "Curva de los pasos de cada movimiento y de las transiciones que vacían o cubren." },
      { id: "pColor", tipo: "rango", etiqueta: "Cambio de par", solo: ["flores"], unidad: "%", min: 0, max: 100, def: 25, desc: "Qué tan seguido un mosaico cambia de par de colores en vez de solo de movimiento. Siempre queda a la vista un par o una terciaria, y nunca el mismo color que un vecino." },
      { id: "pRot", tipo: "rango", etiqueta: "Rotación", solo: ["flores"], unidad: "%", min: 0, max: 100, def: 20, desc: "Peso de la familia: una forma que se achica y crece girando, o una moneda que da vuelta y muestra otra." },
      { id: "pTira", tipo: "rango", etiqueta: "Tira", solo: ["flores"], unidad: "%", min: 0, max: 100, def: 20, desc: "Peso de la familia: una forma cruza el mosaico de lado a lado y, cuando sale, entra la siguiente." },
      { id: "pSalto", tipo: "rango", etiqueta: "Salto", solo: ["flores"], unidad: "%", min: 0, max: 100, def: 20, desc: "Peso de la familia: una forma que salta de una esquina a otra del mosaico, estirándose y girando en el salto." },
      { id: "pCorte", tipo: "rango", etiqueta: "Corte", solo: ["flores"], unidad: "%", min: 0, max: 100, def: 20, desc: "Peso de la familia: una forma cortada en bandas que se desplazan fuera de fase, o una línea que barre el mosaico y deja ver la forma y después la borra." },
      { id: "pOrbita", tipo: "rango", etiqueta: "Órbita", solo: ["flores"], unidad: "%", min: 0, max: 100, def: 20, desc: "Peso de la familia: una forma que da vueltas alrededor del centro del mosaico, con una parada por compás." },
      { id: "pMorph", tipo: "rango", etiqueta: "Morph", solo: ["flores"], unidad: "%", min: 0, max: 100, def: 20, desc: "Peso de la familia: una forma que se transforma en otra, en cadena de tres." },
      { id: "campo", tipo: "seg", etiqueta: "Campo", solo: ["urea"], def: "azul", aplica: { attr: "data-campo" }, opciones: [["azul", "Azul"], ["verde", "Verde"]], desc: "Azul: terciaria Azul, Celeste y Verde (fondo, surcos y brotes). Verde: secundaria Verde y Verde Claro. Los granos van siempre en tiza, como la urea." },
      { id: "divisiones", tipo: "rango", etiqueta: "Divisiones", solo: ["urea"], unidad: "veces", min: 6, max: 12, def: 10, desc: "Cuántas veces se parte el grano. Con 10 quedan 1024 granos, uno por surco y fila. Cambiarlo rearma el campo y empieza de nuevo." },
      { id: "velocidad", tipo: "rango", etiqueta: "Velocidad", solo: ["urea"], unidad: "%", min: 50, max: 200, paso: 10, def: 100, desc: "Ritmo de la caída, las divisiones y el brote. Cada división tarda un poco menos que la anterior, así la multiplicación acelera." },
      { id: "viento", tipo: "rango", etiqueta: "Viento", solo: ["urea"], unidad: "%", min: 0, max: 100, def: 40, desc: "Cuánto se mecen los brotes con la racha que cruza el campo. El puntero los aparta igual, haya viento o no." },
      { id: "pausa", tipo: "rango", etiqueta: "Campo crecido", solo: ["urea"], unidad: "s", min: 2, max: 20, def: 6, desc: "Cuánto se queda el campo crecido antes de recogerse y dejar caer otro grano. Un clic sobre el campo lo adelanta." },
      "---",
      { id: "radio", tipo: "rango", etiqueta: "Radio de arriba", unidad: "px", min: 0, max: 56, def: 26, aplica: { var: "--radio", unidad: "px" }, desc: "Radio de las esquinas de arriba." },
      { id: "logo", tipo: "rango", etiqueta: "Logo", unidad: "px", min: 80, max: 260, def: 150, aplica: { var: "--logo", unidad: "px" }, desc: "Ancho del logo completo." },
      { id: "etica", tipo: "interr", etiqueta: "Línea ética", def: true, desc: "Una línea con el llamado a denunciar." }
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
        "/* Línea ética: una línea discreta, sin caja, con su llamado en un botón chico de contorno. */",
        ".pf-pie__etica { display: flex; align-items: center; gap: 6px 14px; flex-wrap: wrap; font-size: var(--texto-chico); }",
        ".pf-pie__etica > div { display: flex; align-items: baseline; gap: 4px 10px; flex-wrap: wrap; }",
        ".pf-pie__etica b { font-weight: 500; }",
        ".pf-pie__etica span { opacity: .7; }",
        ".pf-pie__etica .pf-pie__pill { height: 28px; padding: 0 12px; background: transparent; color: inherit !important; border: 1px solid color-mix(in srgb, currentColor 40%, transparent); font-size: var(--texto-mini); }",
        ".pf-pie__pill { display: inline-flex; align-items: center; height: 34px; padding: 0 16px; border-radius: 999px; background: var(--pie-tinta, var(--azul)); color: var(--pie-fondo, var(--tiza)) !important; opacity: 1 !important; font-weight: 500; text-decoration: none !important;  text-box: trim-both cap alphabetic; }",
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
        '.pf-pie[data-variante="vida"] .pf-pie__etica { flex: 0 1 auto; }',
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
        '.pf-pie[data-variante="formas"] .pf-pie__etica, .pf-pie[data-variante="flores"] .pf-pie__etica { justify-content: flex-end; }',
        "/* Los legales van pegados abajo, por encima de las formas. */",
        '.pf-pie[data-variante="formas"] .pf-pie__legal { position: absolute; z-index: 3; left: clamp(20px, 4vw, 48px); right: clamp(20px, 4vw, 48px); bottom: 20px; padding-top: 0; border-top: 0; opacity: 1; }',
        '.pf-pie__fisica { position: absolute; inset: 0; z-index: 2; width: 100%; height: 100%; pointer-events: none; }',
        '.pf-pie.pf-agarra, .pf-pie.pf-agarra * { cursor: grabbing !important; user-select: none; }',
        "",
        "/* Flores (experimento): marfil, el contenido arriba y la banda de mosaicos llena lo que queda hasta abajo. */",
        '.pf-pie[data-variante="flores"] { --pie-tinta: var(--azul); --pie-fondo: var(--tiza); display: flex; flex-direction: column; min-height: 100vh; min-height: 100svh; background: var(--tiza); color: var(--azul); }',
        '.pf-pie[data-variante="flores"] .pf-pie__in { display: grid; gap: 28px; width: 100%; max-width: none; }',
        '.pf-pie[data-variante="flores"] .pf-pie__cols { flex: 1; max-width: 760px; }',
        '.pf-pie__flores { position: relative; flex: 1; min-height: 200px; }',
        '.pf-pie__flores canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }',
        "",
        "/* Urea (experimento): fondo de color, el contenido arriba y el campo llena lo que queda hasta abajo.",
        "   Los colores del campo van en variables: el lienzo los lee de acá. */",
        '.pf-pie[data-variante="urea"] { --u-fondo: var(--azul); --u-surco: var(--celeste); --u-grano: var(--tiza); --u-brote: var(--verde);',
        '  --pie-tinta: var(--tiza); --pie-fondo: var(--u-fondo); display: flex; flex-direction: column; min-height: 100vh; min-height: 100svh; background: var(--u-fondo); color: var(--tiza); }',
        '.pf-pie[data-variante="urea"][data-campo="verde"] { --u-fondo: var(--verde); --u-surco: var(--verde-claro); --u-brote: var(--verde-claro); }',
        '.pf-pie[data-variante="urea"] .pf-pie__in { display: grid; gap: 28px; width: 100%; max-width: none; }',
        '.pf-pie[data-variante="urea"] .pf-pie__cols { flex: 1; max-width: 760px; }',
        '.pf-pie[data-variante="urea"] .pf-pie__etica { justify-content: flex-end; }',
        '.pf-pie__urea { position: relative; flex: 1; min-height: 320px; }',
        '.pf-pie__urea canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }',
        "",
        "@media (max-width: 760px) {",
        "  .pf-pie__cols, .pf-pie[data-variante] .pf-pie__cols { grid-template-columns: repeat(2, minmax(0, 1fr)); flex-basis: 100%; }",
        "  .pf-pie[data-variante=\"vida\"] .pf-pie__in { gap: 22px; }",
        "  .pf-pie[data-variante=\"trigo\"] .pf-pie__in { grid-template-columns: 1fr; } .pf-pie[data-variante=\"trigo\"] .pf-pie__der { grid-column: 1; padding-top: 34vw; }",
        "  .pf-pie__trigo { height: auto; width: 46vw; left: auto; right: -6vw; bottom: auto; top: -3vw; }",
        "}",
        "@media (prefers-reduced-motion: reduce) { .pf-pie { --p: 1 !important; } }"
      ].join("\n");
    },
    html: function (s) {
      eticaCargada = s.etica;
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
      if (v === "flores" || v === "urea") h += '  <div class="pf-pie__arriba">\n  <a class="pf-pie__logo" href="#" aria-label="Profertil">' + logo + '</a>\n' + cols + '  </div>\n' + etica + legal;
      h += '</div>\n';
      if (v === "flores") h += '<div class="pf-pie__flores" aria-hidden="true"><canvas></canvas></div>\n';
      if (v === "urea") h += '<div class="pf-pie__urea" aria-hidden="true"><canvas></canvas></div>\n';
      if (v === "formas") h += '<canvas class="pf-pie__fisica" aria-hidden="true"></canvas>\n' + legal;
      return h + '</footer>';
    },
    js: function (s) {
      if (s.variante === "institucional") return "";
      if (s.variante === "urea") return "(" + UREA.toString() + ")(" + JSON.stringify(opcionesUrea(s)) + ");";
      if (s.variante === "flores") return "(" + FLORES.toString() + ")(" + JSON.stringify(opcionesFlores(s)) + ");";
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
