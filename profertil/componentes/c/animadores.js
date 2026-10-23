/* Animadores de texto: la librería animadores.css + animadores.js del Bong Lab, uno por vez, con su ficha. */
(function () {
  // Las fichas del probador del Lab (profertil/animadores-texto): nombre, para qué, qué evitar y el texto de muestra.
  var FICHAS = [
    { id: "sube", nombre: "Sube", uso: "Titulares y hero. Es el de la home: el animador por defecto.", evitar: "Texto corrido largo.", txt: "Damos vida a la tierra" },
    { id: "ventana", nombre: "Ventana", uso: "Títulos grandes y aperturas de sección. Más editorial que Sube.", evitar: "Cuerpos chicos: el recorte se nota poco y suma ruido.", txt: "Producimos el nitrógeno del campo argentino" },
    { id: "desliza", nombre: "Desliza", uso: "Listas, menús y textos que acompañan algo que entra de costado.", evitar: "Titulares centrados.", txt: "Empresa · Sostenibilidad · Compliance" },
    { id: "enfoque", nombre: "Enfoque", uso: "Frases de marca y hero sobre foto: entra desde el desenfoque.", evitar: "Más de una vez por pantalla; el desenfoque cuesta más.", txt: "Más y mejores alimentos" },
    { id: "asoma", nombre: "Asoma", uso: "Subtítulos, bajadas y llamados cortos.", evitar: "Titulares de más de una línea.", txt: "Conocé nuestros productos" },
    { id: "funde", nombre: "Funde", uso: "Cuerpo de texto y todo lo que se lee: aparece sin moverse.", evitar: "Nada: es el piso seguro.", txt: "Con nuestro trabajo impulsamos el desarrollo de las comunidades donde operamos." },
    { id: "persiana", nombre: "Persiana", uso: "Párrafos destacados y citas: línea por línea, cada una en su ventana.", evitar: "Una sola línea (para eso, Ventana).", txt: "Aplicamos tecnología de vanguardia en cada eslabón de nuestra cadena para nutrir los cultivos de manera sustentable." },
    { id: "grano", nombre: "Grano", uso: "Palabras sueltas, eyebrows, títulos de una palabra.", evitar: "Frases largas: letra por letra se hace eterno.", txt: "Novedades" },
    { id: "cortina", nombre: "Cortina", uso: "Títulos de sección sobre color plano: se descubre de un lado al otro.", evitar: "Texto sobre foto.", txt: "Programas comunitarios" },
    { id: "maquina", nombre: "Máquina", uso: "Buscadores, placeholders y datos técnicos: letra a letra, sin movimiento.", evitar: "Titulares de marca.", txt: "Buscá: trigo, becas, urea" },
    { id: "enciende", nombre: "Enciende", uso: "Manifiestos y propósito: cada palabra se enciende al scrollear. Es el de la home.", evitar: "Más de uno por página.", txt: "Aplicamos tecnología de vanguardia en cada eslabón de nuestra cadena para producir fertilizantes que nutren los cultivos.", nota: "Se mueve con el scroll" },
    { id: "relevo", nombre: "Relevo", uso: "Hero con una palabra que cambia. Las opciones van en data-palabras.", evitar: "Más de cuatro opciones o frases largas en el hueco.", txt: "Nutrimos {}", palabras: "el trigo|el maíz|la soja|el girasol" },
    { id: "cifra", nombre: "Cifra", uso: "Números destacados: cuenta hasta el valor. Respeta prefijos y sufijos.", evitar: "Datos que hay que leer exactos al instante (precios, fechas).", txt: "60%" },
    { id: "marquesina", nombre: "Marquesina", uso: "Franjas de cierre o separadores: texto en loop, lineal y lento.", evitar: "Información necesaria: nadie la lee entera.", txt: "Trigo · Maíz · Soja · Girasol · Pasturas · Cebada ·" }
  ];
  function ficha(id) { return FICHAS.filter(function (f) { return f.id === id; })[0]; }

  Libreria.sumar({
    id: "animadores", nombre: "Animadores de texto", grupo: "Texto", alto: "auto",
    bajada: "Un solo juego de animaciones de texto para todo el sitio: 14 animadores con nombre, uso y valores fijos.",
    nota: "Se aplican con un atributo (data-anim) cargando animadores.css y animadores.js. Enciende se mueve con el scroll: acá queda quieto.",
    controles: [
      { id: "anim", tipo: "select", etiqueta: "Animador", def: "sube", opciones: FICHAS.map(function (f) { return [f.id, f.nombre, "Para: " + f.uso + " Evitar: " + f.evitar]; }), desc: "El valor de data-anim." },
      { id: "txt", tipo: "texto", etiqueta: "Texto (vacío = el de la ficha)", def: "", desc: "El texto a animar; en Relevo, {} marca el hueco." },
      { id: "tam", tipo: "rango", etiqueta: "Tamaño", unidad: "px", min: 16, max: 120, def: 64, aplica: { var: "--tam", unidad: "px" }, desc: "Cuerpo del texto de muestra." },
      { id: "vel", tipo: "seg", etiqueta: "Velocidad", def: 1, aplica: { var: "--ta-vel" }, opciones: [[1, "Normal"], [2, "0,5×"], [5, "0,2×"]], desc: "Para revisar la curva en cámara lenta (--ta-vel)." },
      { id: "fondo", tipo: "seg", etiqueta: "Fondo", def: "tiza", aplica: { attr: "data-fondo" }, opciones: [["tiza", "Tiza"], ["azul", "Azul"]], desc: "Sobre tiza en tinta; sobre azul en tiza." }
    ],
    claves: ["Cada animador tiene nombre, uso y valores fijos: no se inventa una animación distinta en cada página.", "Arrancan solos al entrar en pantalla; Repetir los vuelve a disparar.", "Solo mueven transform, opacity, filter y clip-path; nunca desde escala 0.", "Curva base del Master, cubic-bezier(.22, 1, .36, 1); escalonado de 18 a 90 ms entre partes.", "Se pueden pisar con atributos: data-por, data-desde, data-dur, data-paso, data-dist, data-disparo."],
    accesibilidad: "El texto real queda en aria-label y las partes animadas van con aria-hidden. Con movimiento reducido, todo entra con un fundido.",
    dependencias: ["animadores.css", "animadores.js"],
    css: function () {
      return [
        ".pf-anim { --tam: 64px; display: grid; place-items: center; min-height: 340px; padding: 40px; border-radius: var(--radio-tarjeta); text-align: center; }",
        ".pf-anim[data-fondo=\"tiza\"] { background: var(--card); color: var(--ink); }",
        ".pf-anim[data-fondo=\"azul\"] { background: var(--azul); color: var(--tiza); }",
        ".pf-anim__t { margin: 0; max-width: 18ch; font: 500 var(--tam)/1.04 var(--f-display); letter-spacing: -.035em; text-wrap: balance; }"
      ].join("\n");
    },
    html: function (s) {
      var f = ficha(s.anim), t = s.txt || f.txt;
      return '<div class="pf-anim" data-c="animadores">\n  <h2 class="pf-anim__t" data-anim="' + f.id + '"' + (f.palabras ? ' data-palabras="' + f.palabras + '"' : '') + '>' + t + '</h2>\n</div>';
    }
  });
})();
