/* Fondos generativos para las cabeceras: cuatro familias sobre el mismo motor WebGL (c/fondos-motor.js).
   Cada pieza muestra el fondo detrás de una tarjeta de cabecera, con la hoja que sube por encima al hacer scroll. */
(function () {
  var NOMBRES_FORMA = { barras: "Barras", c: "C", capas: "Capas", casco: "Casco", circulos: "Círculos", escudo: "Escudo", estrella: "Estrella", flor: "Flor", grafico: "Gráfico", hoja: "Hoja", industria: "Industria", lupa: "Lupa", ondas: "Ondas", plantas: "Plantas", sol: "Sol", suelo: "Suelo", trigo: "Trigo", urea: "Urea" };
  var FORMAS_OPC = Object.keys(NOMBRES_FORMA).map(function (k) { return [k, NOMBRES_FORMA[k]]; });
  var OPC_FORMA = [["varias", "Varias", "Cada celda o grupo con una Forma distinta, de las 18."]].concat(FORMAS_OPC);

  // Controles que comparten las cuatro familias
  function color() { return { id: "color", tipo: "seg", etiqueta: "Color", def: "azul", opciones: [["azul", "Azul"], ["verde", "Verde"], ["amarillo", "Amarillo"], ["terra", "Terra"]], desc: "Fondo, figura y acento: azul con celeste y verde, verde con verde claro y amarillo, amarillo con naranja y verde, terra con naranja y amarillo." }; }
  function forma(def) { return { id: "forma", tipo: "select", etiqueta: "Forma", def: def, opciones: OPC_FORMA, desc: "La Forma de las celdas." }; }
  function celda(def, min, max) { return { id: "celda", tipo: "rango", etiqueta: "Celda", unidad: "px", min: min, max: max, def: def, desc: "Lado de la celda en escritorio; en el celular es el 76%." }; }
  function acento(def) { return { id: "acento", tipo: "rango", etiqueta: "Formas en acento", unidad: "%", min: 0, max: 40, def: def, desc: "Qué parte de las Formas sale en el color de acento." }; }
  var CURSOR = { id: "cursor", tipo: "interr", etiqueta: "Reacción al cursor", def: true, desc: "El fondo responde al mouse (con el dedo, mientras se arrastra)." };
  var CLIC = { id: "clic", tipo: "interr", etiqueta: "Clic en el fondo", def: true, desc: "Un clic o un toque en el fondo dispara una reacción ahí." };

  var CSS = [
    ".pf-fondo { font-family: var(--f-body); color: var(--ink); }",
    ".pf-fondo__lienzo { position: fixed; inset: 0; width: 100%; height: 100lvh; z-index: 0; display: block; }",
    ".pf-fondo__cab { position: relative; z-index: 1; min-height: 74svh; padding: 24px 12px 96px; }",
    ".pf-fondo__tarjeta { display: flex; flex-direction: column; align-items: flex-start; gap: 14px; max-width: 1120px; margin: 0 auto; padding: 24px 20px 28px; border-radius: var(--radio-tarjeta); background: var(--bg); }",
    ".pf-fondo__volver { display: inline-flex; align-items: center; gap: 6px; color: var(--ink-2); font-size: var(--texto-chico); text-decoration: none; }",
    ".pf-fondo__volver svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }",
    ".pf-fondo__titulo { margin: 0; font: 500 var(--texto-titulo)/1.05 var(--f-display); letter-spacing: -.02em; color: var(--azul); text-wrap: balance; }",
    ".pf-fondo__bajada { margin: 0; max-width: 46ch; font-size: var(--texto-destacado); line-height: 1.45; color: var(--ink-2); }",
    ".pf-fondo__hoja { position: relative; z-index: 2; min-height: 100vh; padding: 24px 16px 120px; background: var(--bg); border-radius: var(--radio-tarjeta) var(--radio-tarjeta) 0 0; }",
    ".pf-fondo__hoja p { max-width: 700px; margin: 0 auto 20px; font-size: var(--texto-cuerpo); line-height: 1.6; color: var(--ink-2); }",
    "@media (min-width: 720px) {",
    "  .pf-fondo__cab { padding: 32px 24px 120px; }",
    "  .pf-fondo__tarjeta { padding: 40px 44px 44px; }",
    "  .pf-fondo__hoja { padding: 64px 24px 160px; }",
    "}"
  ].join("\n");

  function html(id, hoja) {
    return function () {
      return '<div class="pf-fondo" data-c="' + id + '">\n' +
        '  <canvas class="pf-fondo__lienzo" aria-hidden="true"></canvas>\n' +
        '  <header class="pf-fondo__cab">\n' +
        '    <div class="pf-fondo__tarjeta">\n' +
        '      <a class="pf-fondo__volver" href="#"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>Productos industriales</a>\n' +
        '      <h1 class="pf-fondo__titulo">Urea Pecuaria</h1>\n' +
        '      <p class="pf-fondo__bajada">Urea destinada a la nutrición de rumiantes.</p>\n' +
        '    </div>\n' +
        '  </header>\n' +
        '  <main class="pf-fondo__hoja" id="pf-fondo-hoja">\n' + hoja.map(function (t) { return '    <p>' + t + '</p>'; }).join("\n") + '\n  </main>\n</div>';
    };
  }
  // El código que corre: la configuración y el motor entero, sin dependencias aparte de formas.js.
  function js(cfg) {
    return "var PF_FONDO = " + JSON.stringify(cfg) + ";\nwindow.PFFondo = " + window.PFFondo.toString() + ";\n" +
      "PFFondo(document.querySelector(\".pf-fondo__lienzo\"), PF_FONDO);";
  }
  function base(s) {
    return { color: s.color, forma: s.forma, celda: +s.celda, acento: s.acento === undefined ? 8 : +s.acento, cursor: s.cursor !== false, clic: s.clic !== false,
      tapa: "pf-fondo-hoja", ignorar: "a, button, .pf-fondo__tarjeta, .pf-fondo__hoja" };
  }
  function extender(a, b) { Object.keys(b).forEach(function (k) { a[k] = b[k]; }); return a; }
  var ACC = "El fondo es decorativo (aria-hidden) y no recibe foco. Con movimiento reducido se dibuja quieto: un solo cuadro, sin estela ni ciclos, y el clic no hace nada. Sin WebGL 2 queda el color de fondo liso.";
  var COMUN = [
    "Colores: solo las combinaciones de campo del sistema. El fondo es azul, verde, amarillo o terra; la figura y el acento salen de su combinación.",
    "Las Formas son las 18 del sistema, dibujadas una vez en un atlas y leídas por el shader en cada celda. Sin sombras, sin degradados y sin desenfoque de movimiento.",
    "Cuando la hoja tapa la cabecera, el fondo deja de dibujar y se esconde."
  ];

  // ---------- 1 · Patrón (el motor del generador de patrones del kit de marca)
  Libreria.sumar({
    id: "fondo-patron", nombre: "Fondo de patrón", grupo: "Fondos", alto: 1000, previa: 0, mini: 1100, tamano: "ancha",
    bajada: "El patrón del generador del kit de marca (grilla, ladrillo o matriz) como fondo vivo de la cabecera.",
    nota: "Toma las reglas del generador: escala, ritmo horizontal y vertical, dirección por fila, desfase alternado y solapamiento. Lo nuevo es el movimiento y la reacción al cursor.",
    variantes: [
      ["onda", "Onda", "Ladrillo del generador. Las Formas respiran en una onda que cruza el campo.", { disposicion: "ladrillo", mov: "onda", celda: 30, ritmoX: 120, ritmoY: 110 }],
      ["grupos", "Grupos", "Mezcla con el campo de la Biblioteca: las Formas del patrón aparecen en grupos que crecen celda por celda y se deshacen.", { disposicion: "grilla", mov: "grupos", celda: 30, ritmoX: 110, ritmoY: 110, forma: "varias" }],
      ["giro", "Giro", "Grilla del generador. Cada Forma gira de a 90 grados, en una onda, como el ajuste de Dirección.", { disposicion: "grilla", mov: "giro", celda: 34, ritmoX: 120, ritmoY: 120 }],
      ["deriva", "Deriva", "Matriz del generador (bloques que a veces llevan una Forma grande). El patrón se desliza despacio.", { disposicion: "matriz", mov: "deriva", celda: 30, ritmoX: 110, ritmoY: 110 }]
    ],
    claves: [
      "Disposiciones del generador: Grilla, Ladrillo (filas pares e impares con su dirección y desfase) y Matriz (bloques de 2 x 2 que llevan una Forma grande en un 28% de los casos).",
      "Movimientos: Onda (escala), Giro (de a 90 grados con el mismo paso que el generador), Deriva (desplazamiento) y Grupos (el comportamiento del campo de la Biblioteca).",
      "Cursor: cerca del mouse las Formas intercambian figura y acento, salteadas y sin fundido.",
      "Clic (solo en Grupos): nace un grupo ahí."
    ].concat(COMUN),
    accesibilidad: ACC,
    controles: [
      { id: "disposicion", tipo: "seg", etiqueta: "Disposición", def: "ladrillo", opciones: [["grilla", "Grilla"], ["ladrillo", "Ladrillo"], ["matriz", "Matriz"]], desc: "Las tres del generador de patrones." },
      { id: "mov", tipo: "select", etiqueta: "Movimiento", def: "onda", opciones: [["quieto", "Quieto"], ["onda", "Onda", "Las Formas crecen y se achican en una onda."], ["giro", "Giro", "Giran de a 90 grados."], ["deriva", "Deriva", "El patrón se desliza."], ["grupos", "Grupos", "Aparecen en grupos, como el campo de la Biblioteca."]], desc: "Cómo se mueve el patrón." },
      color(), forma("urea"),
      "---",
      celda(30, 14, 80),
      { id: "ritmoX", tipo: "rango", etiqueta: "Ritmo horizontal", unidad: "%", min: 60, max: 200, def: 120, desc: "Separación entre columnas, como en el generador." },
      { id: "ritmoY", tipo: "rango", etiqueta: "Ritmo vertical", unidad: "%", min: 60, max: 200, def: 110, desc: "Separación entre filas." },
      { id: "solapamiento", tipo: "rango", etiqueta: "Solapamiento", unidad: "%", min: 0, max: 60, def: 30, desc: "Tamaño de la Forma dentro de su celda; desde 34% se pisan con las vecinas." },
      { id: "direccion", tipo: "seg", etiqueta: "Dirección", def: 1, opciones: [[0, "-90"], [1, "0"], [2, "90"], [3, "180"]], desc: "Giro de las Formas (en Ladrillo, de las filas pares)." },
      { id: "direccionImpar", tipo: "seg", etiqueta: "Dirección impar", def: 3, opciones: [[0, "-90"], [1, "0"], [2, "90"], [3, "180"]], desc: "Solo en Ladrillo: giro de las filas impares." },
      { id: "desfase", tipo: "rango", etiqueta: "Desfase alternado", unidad: "%", min: -60, max: 60, def: 0, desc: "Solo en Ladrillo: corrimiento de las filas impares." },
      { id: "semilla", tipo: "rango", etiqueta: "Semilla", min: 0, max: 100, def: 37, desc: "Solo en Matriz: qué bloques llevan Forma grande." },
      "---",
      { id: "velocidad", tipo: "rango", etiqueta: "Velocidad", unidad: "%", min: 0, max: 100, def: 40, desc: "Ritmo del movimiento." },
      { id: "angulo", tipo: "rango", etiqueta: "Ángulo", unidad: "°", min: 0, max: 360, def: 30, desc: "Hacia dónde viaja la onda, el giro o la deriva." },
      { id: "intensidad", tipo: "rango", etiqueta: "Intensidad", unidad: "%", min: 0, max: 100, def: 55, desc: "Onda: cuánto se achican. Giro: cuánto se desordena la ola." },
      { id: "grupos", tipo: "rango", etiqueta: "Grupos a la vez", min: 2, max: 12, def: 7, desc: "Solo en Grupos." },
      acento(8), CURSOR, CLIC
    ],
    css: function () { return CSS; },
    html: html("fondo-patron", [
      "El patrón queda fijo detrás de la página y esta hoja sube por encima al hacer scroll.",
      "Las reglas son las del generador de patrones del kit de marca. Con el mouse, las Formas cercanas intercambian figura y acento."
    ]),
    js: function (s) {
      return js(extender(base(s), { modo: "patron", disposicion: s.disposicion, mov: s.mov, ritmoX: +s.ritmoX, ritmoY: +s.ritmoY, solapamiento: +s.solapamiento,
        direccion: +s.direccion, direccionImpar: +s.direccionImpar, desfase: +s.desfase, semilla: +s.semilla, velocidad: +s.velocidad, angulo: +s.angulo,
        intensidad: +s.intensidad, grupos: +s.grupos }));
    }
  });

  // ---------- 2 · Grilla interactiva
  Libreria.sumar({
    id: "fondo-grilla", nombre: "Grilla interactiva", grupo: "Fondos", alto: 1000, previa: 0, mini: 1100, tamano: "ancha",
    bajada: "Grilla de puntos, Formas chicas o líneas. El cursor la ilumina y deja una estela de Formas que se apagan.",
    nota: "Cada celda tiene una energía que sube con el paso del cursor, un toque o la actividad al azar, y baja sola. Con energía, la celda muestra una Forma; recién encendida, en acento.",
    variantes: [
      ["puntos", "Puntos", "Grilla de puntos. El foco los agranda y la estela deja Formas.", { base: "puntos", celda: 28 }],
      ["formas", "Formas", "La grilla es de Formas chicas, que crecen con el foco y la estela.", { base: "formas", celda: 30, marca: 10 }],
      ["lineas", "Líneas", "Una cuadrícula de líneas finas; la estela enciende las celdas.", { base: "lineas", celda: 34 }]
    ],
    claves: [
      "Foco: alrededor del cursor la marca de base se agranda y toma más color, con un borde suave.",
      "Estela: las celdas que cruza el cursor encienden una Forma que se apaga sola. Recién encendida va en acento; al apagarse pasa a figura, sin fundido.",
      "Actividad: algunas celdas se encienden solas al azar, así el fondo vive también en el celular, sin cursor.",
      "Clic o toque: enciende una mancha de celdas alrededor."
    ].concat(COMUN),
    accesibilidad: ACC,
    controles: [
      { id: "base", tipo: "seg", etiqueta: "Base", def: "puntos", opciones: [["puntos", "Puntos"], ["formas", "Formas"], ["lineas", "Líneas"]], desc: "La marca de cada celda en reposo." },
      color(), forma("urea"),
      "---",
      celda(28, 16, 64),
      { id: "marca", tipo: "rango", etiqueta: "Marca de base", unidad: "%", min: 4, max: 20, def: 8, desc: "Tamaño del punto o de la Forma chica, en % de la celda." },
      { id: "actividad", tipo: "rango", etiqueta: "Actividad", unidad: "%", min: 0, max: 100, def: 24, desc: "Cuántas celdas se encienden solas." },
      { id: "estela", tipo: "rango", etiqueta: "Estela", unidad: "%", min: 0, max: 100, def: 56, desc: "Cuánto dura encendida una celda." },
      { id: "foco", tipo: "rango", etiqueta: "Radio del foco", unidad: "px", min: 60, max: 600, def: 260, desc: "Alcance de la luz del cursor." },
      { id: "fuerzaFoco", tipo: "rango", etiqueta: "Fuerza del foco", unidad: "%", min: 0, max: 100, def: 30, desc: "Cuánto cambia la grilla debajo del cursor." },
      CURSOR, CLIC
    ],
    css: function () { return CSS; },
    html: html("fondo-grilla", [
      "La grilla queda fija detrás de la página y esta hoja sube por encima al hacer scroll.",
      "Pasá el mouse por la cabecera: se enciende una estela de Formas que se apaga sola."
    ]),
    js: function (s) {
      return js(extender(base(s), { modo: "grilla", base: s.base, marca: +s.marca, actividad: +s.actividad, estela: +s.estela, foco: +s.foco, fuerzaFoco: +s.fuerzaFoco, acento: 1 }));
    }
  });

  // ---------- 3 · Dither con Formas
  Libreria.sumar({
    id: "fondo-dither", nombre: "Dither con Formas", grupo: "Fondos", alto: 1000, previa: 0, mini: 1100, tamano: "ancha",
    bajada: "Un degradé y un ruido lento convertidos en Formas con un tramado ordenado: cada píxel del dither es una Forma.",
    nota: "El valor de cada celda sale de mezclar un degradé (con su ángulo) y un ruido que se mueve. El tramado Bayer de 4 x 4 decide qué celdas se encienden; el cursor suma luz.",
    variantes: [
      ["binario", "Binario", "Forma o nada: el dither de un bit.", { tonos: "binario", celda: 16 }],
      ["tres", "Tres tonos", "Nada, figura y acento.", { tonos: "tres", celda: 18 }],
      ["escalonado", "Escalonado", "La Forma cambia de tamaño en cuatro pasos, como una trama de medio tono.", { tonos: "escalonado", celda: 20 }]
    ],
    claves: [
      "Tramado ordenado Bayer de 4 x 4 sobre la grilla: las celdas cambian de a una, sin fundidos.",
      "Ángulo: la dirección del degradé y hacia dónde viaja el ruido. Densidad: el tamaño de las manchas del ruido.",
      "Cursor: suma luz alrededor del mouse, así se encienden más Formas."
    ].concat(COMUN),
    accesibilidad: ACC,
    controles: [
      { id: "tonos", tipo: "seg", etiqueta: "Tonos", def: "binario", opciones: [["binario", "Binario"], ["tres", "Tres"], ["escalonado", "Escalonado"]], desc: "Cuántos niveles toma cada celda." },
      color(), forma("urea"),
      "---",
      celda(16, 8, 48),
      { id: "angulo", tipo: "rango", etiqueta: "Ángulo", unidad: "°", min: 0, max: 360, def: 11, desc: "Dirección del degradé." },
      { id: "densidad", tipo: "rango", etiqueta: "Densidad", unidad: "%", min: 0, max: 100, def: 15, desc: "Tamaño de las manchas: más densidad, manchas más chicas." },
      { id: "degrade", tipo: "rango", etiqueta: "Peso del degradé", unidad: "%", min: 0, max: 100, def: 45, desc: "0 es solo ruido; 100, solo degradé." },
      { id: "contraste", tipo: "rango", etiqueta: "Contraste", unidad: "%", min: 50, max: 250, def: 130, desc: "Separa más o menos las zonas llenas de las vacías." },
      { id: "velocidad", tipo: "rango", etiqueta: "Velocidad", unidad: "%", min: 0, max: 100, def: 40, desc: "Ritmo del ruido." },
      { id: "radioCursor", tipo: "rango", etiqueta: "Radio del cursor", unidad: "px", min: 40, max: 400, def: 160, desc: "Alcance de la luz del mouse." },
      CURSOR
    ],
    css: function () { return CSS; },
    html: html("fondo-dither", [
      "El dither queda fijo detrás de la página y esta hoja sube por encima al hacer scroll.",
      "Cada píxel del tramado es una Forma del sistema."
    ]),
    js: function (s) {
      return js(extender(base(s), { modo: "dither", tonos: s.tonos, angulo: +s.angulo, densidad: +s.densidad, degrade: +s.degrade, contraste: +s.contraste,
        velocidad: +s.velocidad, radioCursor: +s.radioCursor, acento: s.tonos === "tres" ? 1 : 0, clic: false }));
    }
  });

  // ---------- 4 · Píxeles que aparecen y se arman
  Libreria.sumar({
    id: "fondo-pixeles", nombre: "Píxeles que se arman", grupo: "Fondos", alto: 1000, previa: 0, mini: 1100, tamano: "ancha",
    bajada: "Las celdas aparecen de a una y arman una Forma grande, o llenan el fondo. Se quedan, se desarman y vuelve a empezar.",
    nota: "Cada celda tiene su demora: al azar, desde un punto o en un barrido. Al aparecer destella un instante en acento y pasa a figura, sin fundido.",
    variantes: [
      ["forma", "Arman una Forma", "Las celdas dentro de una Forma grande aparecen enteras; las de afuera, chicas. Cada ciclo nace desde otro punto.", { objetivo: "forma", origen: "punto", celda: 20 }],
      ["barrido", "Barrido", "La Forma grande se arma en un barrido que cambia de ángulo en cada ciclo.", { objetivo: "forma", origen: "barrido", celda: 18 }],
      ["llenar", "Llenan", "Sin Forma grande: las celdas llenan todo el fondo al azar y se van.", { objetivo: "llenar", origen: "azar", celda: 26, forma: "varias" }]
    ],
    claves: [
      "Ciclo: entran, se quedan quietas y salen al azar; después de una pausa corta, vuelve a empezar.",
      "Con Forma en Varias, cada ciclo arma la Forma siguiente.",
      "Clic o toque: el ciclo vuelve a empezar desde ese punto."
    ].concat(COMUN),
    accesibilidad: ACC,
    controles: [
      { id: "objetivo", tipo: "seg", etiqueta: "Qué arman", def: "forma", opciones: [["forma", "Forma grande"], ["llenar", "Llenan"]], desc: "Una Forma grande hecha de celdas, o todo el fondo." },
      { id: "origen", tipo: "seg", etiqueta: "Desde dónde", def: "punto", opciones: [["azar", "Azar"], ["punto", "Punto"], ["barrido", "Barrido"]], desc: "El orden en que aparecen las celdas." },
      color(), forma("urea"),
      { id: "formaGrande", tipo: "select", etiqueta: "Forma grande", def: "igual", opciones: [["igual", "La de las celdas", "La misma Forma de las celdas (en Varias, cambia en cada ciclo)."]].concat(FORMAS_OPC), desc: "La Forma que arman las celdas." },
      "---",
      celda(20, 10, 48),
      { id: "tamano", tipo: "rango", etiqueta: "Tamaño de la Forma grande", unidad: "%", min: 30, max: 140, def: 80, desc: "En % del alto del fondo." },
      { id: "posX", tipo: "rango", etiqueta: "Posición horizontal", unidad: "%", min: 0, max: 100, def: 70, desc: "Centro de la Forma grande." },
      { id: "posY", tipo: "rango", etiqueta: "Posición vertical", unidad: "%", min: 0, max: 100, def: 55, desc: "Centro de la Forma grande." },
      { id: "entrada", tipo: "rango", etiqueta: "Entrada", unidad: "ds", min: 5, max: 60, def: 22, desc: "Cuánto tardan en aparecer todas, en décimas de segundo." },
      { id: "quieto", tipo: "rango", etiqueta: "Quietas", unidad: "ds", min: 0, max: 120, def: 40, desc: "Cuánto se quedan armadas." },
      { id: "salida", tipo: "rango", etiqueta: "Salida", unidad: "ds", min: 3, max: 40, def: 12, desc: "Cuánto tardan en irse." },
      { id: "angulo", tipo: "rango", etiqueta: "Ángulo del barrido", unidad: "°", min: 0, max: 360, def: 20, desc: "Solo en Barrido: el del primer ciclo." },
      acento(10), CLIC
    ],
    css: function () { return CSS; },
    html: html("fondo-pixeles", [
      "El fondo queda fijo detrás de la página y esta hoja sube por encima al hacer scroll.",
      "Un toque en el fondo vuelve a armar la Forma desde ese punto."
    ]),
    js: function (s) {
      return js(extender(base(s), { modo: "pixeles", objetivo: s.objetivo, origen: s.origen, formaGrande: s.formaGrande, tamano: +s.tamano, posX: +s.posX, posY: +s.posY,
        entrada: +s.entrada, quieto: +s.quieto, salida: +s.salida, angulo: +s.angulo, cursor: false }));
    }
  });
})();
