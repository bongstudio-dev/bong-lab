/* Atracción: bolitas del mismo tamaño que un punto atrae y el cursor aparta (o atrae). Física propia
   (Verlet + grilla, sin librerías): con radios iguales los choques se resuelven en una grilla de celdas
   del tamaño de una bolita, y con la escena quieta y nadie tocando la animación se apaga sola. */
(function () {
  var COLORES = [["marca", "Marca"], ["tiza", "Tiza"], ["celeste", "Celeste"], ["verde-claro", "Verde claro"], ["amarillo", "Amarillo"], ["naranja", "Naranja"], ["azul", "Azul"]];

  /* Corre en la página. O = { n, d, modo, cursor, atr, fuerza, campo, roce, fondo, color }.
     Unidades por cuadro de 60 fps: las fuerzas son px/cuadro², el roce es lo que se pierde de velocidad por cuadro. */
  function ATRAER(O) {
    var raiz = document.querySelector(".pf-atr"), lienzo = raiz.querySelector("canvas"), ctx = lienzo.getContext("2d");
    var quieto = matchMedia("(prefers-reduced-motion: reduce)").matches, css = getComputedStyle(raiz);
    var MARCA = ["azul", "celeste", "verde", "verde-claro", "amarillo", "naranja", "terra", "tiza"];
    var S = 3, PASO = 1000 / 60;
    var W = 0, H = 0, dpr = 1, r = 0, n = 0, X, Y, PX, PY, C, tintas = [];
    var cab, sig, cols = 0, filas = 0;
    var pun = { x: 0, y: 0, activo: false };
    var corriendo = false, visible = false, calma = 0, antes = 0, resto = 0;

    function tinta(v) { return css.getPropertyValue("--" + v).trim(); }
    // Marca reparte parejo los colores de marca que no son el del fondo.
    function colores() {
      raiz.setAttribute("data-fondo", O.fondo);
      var lista = O.color === "marca" ? MARCA.filter(function (c) { return c !== O.fondo; }) : [O.color];
      tintas = lista.map(tinta);
      for (var i = 0; i < n; i++) C[i] = i % tintas.length;
    }
    function grilla() {
      var c = 2 * r; cols = Math.ceil(W / c) + 1; filas = Math.ceil(H / c) + 1;
      cab = new Int32Array(cols * filas); sig = new Int32Array(n);
    }
    // Cantidad con tope: nunca más de la mitad del área cubierta, así siempre hay lugar para moverse.
    function armar() {
      r = O.d / 2;
      n = Math.max(1, Math.min(O.n, Math.floor(.5 * W * H / (Math.PI * r * r))));
      X = new Float32Array(n); Y = new Float32Array(n); PX = new Float32Array(n); PY = new Float32Array(n); C = new Uint8Array(n);
      for (var i = 0; i < n; i++) {
        X[i] = r + Math.random() * Math.max(0, W - 2 * r);
        Y[i] = r + Math.random() * Math.max(0, (O.modo === "gravedad" ? .6 : 1) * H - 2 * r);
      }
      grilla(); colores();
      // Separa las que nacieron encimadas sin darles velocidad.
      for (var k = 0; k < 12; k++) { choques(); paredes(); }
      PX.set(X); PY.set(Y); calma = 0;
    }
    function medir() {
      var w = raiz.clientWidth, h = raiz.clientHeight;
      if (!w || !h) return;
      dpr = Math.min(2, devicePixelRatio || 1);
      lienzo.width = Math.round(w * dpr); lienzo.height = Math.round(h * dpr);
      if (X && W && H) {
        var sx = w / W, sy = h / H;
        for (var i = 0; i < n; i++) { X[i] *= sx; PX[i] *= sx; Y[i] *= sy; PY[i] *= sy; }
        W = w; H = h; grilla();
      } else { W = w; H = h; armar(); }
    }

    function mover(h) {
      var amort = Math.pow(1 - O.roce, h), h2 = h * h;
      var cx = W / 2, cy = H / 2, k = O.atr * 5e-5, g = O.atr * .012, tope = 1.6;
      var R = O.campo, fc = O.fuerza * .04 * (O.cursor === "atrae" ? 1 : -1);
      for (var i = 0; i < n; i++) {
        var vx = (X[i] - PX[i]) * amort, vy = (Y[i] - PY[i]) * amort, ax, ay;
        PX[i] = X[i]; PY[i] = Y[i];
        if (O.modo === "gravedad") { ax = 0; ay = g; }
        else {
          // Atracción proporcional a la distancia al punto, con tope para que las lejanas no lleguen disparadas.
          ax = (cx - X[i]) * k; ay = (cy - Y[i]) * k;
          var m = Math.sqrt(ax * ax + ay * ay); if (m > tope) { ax *= tope / m; ay *= tope / m; }
        }
        if (pun.activo) {
          // El cursor empuja (o tira) dentro de su campo, más fuerte cuanto más cerca.
          var dx = pun.x - X[i], dy = pun.y - Y[i], d = Math.sqrt(dx * dx + dy * dy);
          if (d < R && d > .01) { var f = fc * (1 - d / R) / d; ax += dx * f; ay += dy * f; }
        }
        X[i] += vx + ax * h2; Y[i] += vy + ay * h2;
      }
    }
    // Choques entre bolitas iguales: cada par encimado se separa a medias sobre la línea que une sus centros.
    function choques() {
      var D = 2 * r, D2 = D * D, i, j;
      cab.fill(-1);
      for (i = 0; i < n; i++) {
        var gx = Math.min(cols - 1, Math.max(0, (X[i] / D) | 0)), gy = Math.min(filas - 1, Math.max(0, (Y[i] / D) | 0)), c = gy * cols + gx;
        sig[i] = cab[c]; cab[c] = i;
      }
      for (i = 0; i < n; i++) {
        var ix = Math.min(cols - 1, Math.max(0, (X[i] / D) | 0)), iy = Math.min(filas - 1, Math.max(0, (Y[i] / D) | 0));
        for (var ny = Math.max(0, iy - 1); ny <= Math.min(filas - 1, iy + 1); ny++) {
          for (var nx = Math.max(0, ix - 1); nx <= Math.min(cols - 1, ix + 1); nx++) {
            for (j = cab[ny * cols + nx]; j !== -1; j = sig[j]) {
              if (j <= i) continue;
              var dx = X[j] - X[i], dy = Y[j] - Y[i], d2 = dx * dx + dy * dy;
              if (d2 >= D2) continue;
              if (d2 < 1e-6) { dx = Math.random() - .5; dy = Math.random() - .5; d2 = dx * dx + dy * dy; }
              var d = Math.sqrt(d2), p = (D - d) / d * .5;
              X[i] -= dx * p; Y[i] -= dy * p; X[j] += dx * p; Y[j] += dy * p;
            }
          }
        }
      }
    }
    // Paredes: al chocar se iguala la posición anterior en ese eje, si no la bolita sigue empujando contra el borde.
    function paredes() {
      for (var i = 0; i < n; i++) {
        if (X[i] < r) { X[i] = r; PX[i] = r; } else if (X[i] > W - r) { X[i] = W - r; PX[i] = X[i]; }
        if (Y[i] < r) { Y[i] = r; PY[i] = r; } else if (Y[i] > H - r) { Y[i] = H - r; PY[i] = Y[i]; }
      }
    }
    function paso() {
      for (var s = 0; s < S; s++) { mover(1 / S); choques(); paredes(); choques(); paredes(); }
    }

    function dibujar() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      for (var c = 0; c < tintas.length; c++) {
        ctx.fillStyle = tintas[c]; ctx.beginPath();
        for (var i = 0; i < n; i++) if (C[i] === c) { ctx.moveTo(X[i] + r, Y[i]); ctx.arc(X[i], Y[i], r, 0, 6.2832); }
        ctx.fill();
      }
    }
    // La calma se mide por lo que se movió la que más se movió: con un segundo quieto y sin cursor, se apaga.
    function movida() {
      var m = 0;
      for (var i = 0; i < n; i++) { var dx = X[i] - PX[i], dy = Y[i] - PY[i], q = dx * dx + dy * dy; if (q > m) m = q; }
      return Math.sqrt(m) * S;
    }
    function cuadro(t) {
      if (!corriendo) return;
      resto += Math.min(100, t - antes); antes = t;
      var hechos = 0;
      while (resto >= PASO && hechos < 3) { paso(); resto -= PASO; hechos++; }
      if (hechos === 3) resto = 0;
      dibujar();
      calma = !pun.activo && movida() < .04 ? calma + hechos : 0;
      if (calma > 60 || !visible) { corriendo = false; return; }
      requestAnimationFrame(cuadro);
    }
    function despertar() {
      calma = 0;
      if (quieto) { asentar(); return; }
      if (corriendo || !visible || !n) return;
      corriendo = true; antes = performance.now(); resto = PASO; requestAnimationFrame(cuadro);
    }
    // Movimiento reducido: se calcula la escena ya asentada y se dibuja quieta.
    function asentar() { for (var k = 0; k < 400; k++) paso(); PX.set(X); PY.set(Y); dibujar(); }

    function donde(e) {
      var b = raiz.getBoundingClientRect();
      pun.x = e.clientX - b.left; pun.y = e.clientY - b.top; pun.activo = true;
      if (!quieto) despertar();
    }
    function suelta() { pun.activo = false; if (!quieto) despertar(); }
    raiz.addEventListener("pointermove", donde);
    raiz.addEventListener("pointerdown", donde);
    raiz.addEventListener("pointerleave", suelta);
    raiz.addEventListener("pointerup", function (e) { if (e.pointerType !== "mouse") suelta(); });
    raiz.addEventListener("pointercancel", suelta);

    // Ajustes en vivo: cantidad y tamaño rearman la escena; lo demás se nota en el acto.
    window.pfVivo = function (N) {
      var a = O; O = N;
      if (N.n !== a.n || N.d !== a.d || N.modo !== a.modo) armar();
      else if (N.fondo !== a.fondo || N.color !== a.color) colores();
      dibujar(); despertar();
    };

    medir();
    if (quieto) asentar(); else dibujar();
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; despertar(); }).observe(raiz);
    new ResizeObserver(function () { medir(); dibujar(); despertar(); }).observe(raiz);
  }

  function opciones(s) {
    return { n: +s.cantidad, d: +s.diametro, modo: s.modo, cursor: s.cursor, atr: +s.atraccion, fuerza: +s.fuerza, campo: +s.campo, roce: +s.roce / 100, fondo: s.fondo, color: s.color };
  }

  Libreria.sumar({
    id: "atraccion", nombre: "Atracción", grupo: "Física", alto: "auto",
    bajada: "Bolitas del mismo tamaño que se juntan en un punto y se apartan al paso del cursor. Para un bloque de marca o el fondo de una sección.",
    nota: "Pasá el cursor por el escenario. En el celular, tocá y arrastrá.",
    tamano: "ancha",
    variantes: [
      ["centro", "Centro", "Las bolitas se juntan en el centro y el cursor abre un hueco al pasar; al irse, se vuelven a cerrar.", { modo: "centro", cursor: "aparta" }],
      ["iman", "Imán", "La atracción al centro es suave y el cursor las tira hacia él: lo siguen como un enjambre.", { modo: "centro", cursor: "atrae", atraccion: 12, fuerza: 40 }],
      ["gravedad", "Gravedad", "Caen y se apilan en el piso; el cursor las levanta y las desparrama.", { modo: "gravedad", cursor: "aparta", fuerza: 70 }]
    ],
    controles: [
      { id: "modo", tipo: "seg", etiqueta: "Atraídas hacia", def: "centro", opciones: [["centro", "El centro"], ["gravedad", "El piso"]], desc: "El centro: un punto las junta con más fuerza cuanto más lejos están. El piso: caen como con gravedad." },
      { id: "cursor", tipo: "seg", etiqueta: "El cursor", def: "aparta", opciones: [["aparta", "Aparta"], ["atrae", "Atrae"]], desc: "Qué hace el cursor con las bolitas que entran en su campo." },
      "---",
      { id: "cantidad", tipo: "rango", etiqueta: "Cantidad", min: 10, max: 400, paso: 1, def: 90, desc: "Cuántas bolitas. Tiene tope: nunca cubren más de la mitad del escenario." },
      { id: "diametro", tipo: "rango", etiqueta: "Diámetro", unidad: "px", min: 12, max: 140, paso: 1, def: 56, desc: "Todas iguales. Al cambiarlo la escena se rearma." },
      { id: "atraccion", tipo: "rango", etiqueta: "Atracción", min: 0, max: 100, paso: 1, def: 40, desc: "Fuerza del punto (o de la gravedad). En 0 quedan sueltas." },
      { id: "fuerza", tipo: "rango", etiqueta: "Fuerza del cursor", min: 0, max: 100, paso: 1, def: 50, desc: "Cuánto empuja o tira el cursor en el centro de su campo; se apaga hacia el borde." },
      { id: "campo", tipo: "rango", etiqueta: "Radio del campo", unidad: "px", min: 40, max: 480, paso: 5, def: 180, desc: "Hasta dónde llega el cursor." },
      { id: "roce", tipo: "rango", etiqueta: "Roce", unidad: "%", min: 1, max: 20, paso: .5, def: 5, desc: "Velocidad que pierden por cuadro. Bajo: flotan y tardan en frenar. Alto: espesas." },
      "---",
      { id: "fondo", tipo: "seg", etiqueta: "Fondo", def: "azul", opciones: [["azul", "Azul"], ["verde", "Verde"], ["terra", "Terra"], ["amarillo", "Amarillo"], ["claro", "Claro"]], desc: "Fondos de color del Master, o el fondo claro de la web." },
      { id: "color", tipo: "select", etiqueta: "Bolitas", def: "marca", opciones: COLORES, desc: "Marca reparte parejo los colores de marca menos el del fondo." },
      { id: "alto", tipo: "rango", etiqueta: "Alto", unidad: "px", min: 280, max: 900, paso: 10, def: 560, aplica: { var: "--alto", unidad: "px" }, desc: "Alto del bloque. La escena se reacomoda al cambiar." }
    ],
    vivo: opciones,
    claves: [
      "Todas las bolitas tienen el mismo diámetro: los choques se resuelven en una grilla de celdas de una bolita, liviano aun con cientos.",
      "La cantidad tiene tope según el área (la mitad cubierta como máximo), así en el celular no se llena ni se traba.",
      "La animación corre solo con el bloque en pantalla, y se apaga sola con la escena quieta y sin cursor; vuelve con el primer movimiento.",
      "Al cambiar el ancho, las bolitas se reubican en proporción: no se rearma ni salta.",
      "En el celular el bloque deja scrollear la página en vertical: el dedo empuja al tocar y al arrastrar de costado.",
      "Fondos solo del Master (azul, verde, terra, amarillo) o el claro de la web. Sin sombras ni brillos en las bolitas."
    ],
    accesibilidad: "Es decorativo: el lienzo va con aria-hidden y no recibe foco. Con movimiento reducido se dibuja la escena ya asentada y quieta.",
    css: function () {
      return [
        ".pf-atr { --alto: 560px; position: relative; height: var(--alto); overflow: hidden; touch-action: pan-y; background: var(--pf-atr-fondo); }",
        '.pf-atr[data-fondo="azul"] { --pf-atr-fondo: var(--azul); }',
        '.pf-atr[data-fondo="verde"] { --pf-atr-fondo: var(--verde); }',
        '.pf-atr[data-fondo="terra"] { --pf-atr-fondo: var(--terra); }',
        '.pf-atr[data-fondo="amarillo"] { --pf-atr-fondo: var(--amarillo); }',
        '.pf-atr[data-fondo="claro"] { --pf-atr-fondo: var(--bg); }',
        ".pf-atr__lienzo { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }"
      ].join("\n");
    },
    html: function (s) {
      return '<section class="pf-atr" data-c="atraccion" data-fondo="' + s.fondo + '">\n' +
        '  <canvas class="pf-atr__lienzo" aria-hidden="true"></canvas>\n</section>';
    },
    js: function (s) { return "(" + ATRAER.toString() + ")(" + JSON.stringify(opciones(s)) + ");"; }
  });
})();
