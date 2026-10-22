/* Botón fijo: "Sumate a nuestro equipo" viaja sobre la foto y queda quieto en el centro mientras ella pasa. */
(function () {
  var FLECHA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

  Libreria.sumar({
    id: "boton-fijo", nombre: "Botón fijo", grupo: "Navegación", alto: 680, previa: .45,
    bajada: "Sumate a nuestro equipo: entra con la foto, queda quieto en el centro mientras la foto pasa y se va con ella.",
    nota: "Scrolleá dentro del escenario. La foto es de demo.",
    controles: [
      { id: "alto", tipo: "seg", etiqueta: "Tamaño", def: 48, aplica: { var: "--alto", unidad: "px" }, opciones: [[48, "L 48"], [44, "M 44"]], desc: "L en desktop, M en mobile (escala Web/Botón)." },
      { id: "color", tipo: "seg", etiqueta: "Color", def: "tiza", aplica: { attr: "data-color" }, opciones: [["tiza", "Tiza"], ["azul", "Azul"]], desc: "Tiza con texto azul (Botón sobre color) o azul con texto tiza." },
      { id: "tramo", tipo: "rango", etiqueta: "Largo de la foto", unidad: "vh", min: 120, max: 260, paso: 10, def: 180, desc: "Cuánto scroll dura la foto y, con ella, el botón quieto." }
    ],
    claves: ["Se usa una sola vez y para una sola cosa: Sumate a nuestro equipo.", "El botón vive adentro de la sección de la foto con position: sticky: no necesita JS.", "Queda centrado en la pantalla mientras la foto la cruza; al terminar la foto, se va con ella.", "Es el Botón sobre color del sistema: píldora sin sombra, flecha que avanza 3 px en hover."],
    accesibilidad: "Es un link real con su texto; la flecha va con aria-hidden. No hay animación que respetar: el movimiento es el del scroll.",
    css: function () {
      return [
        ".bf { --alto: 48px; --curva: cubic-bezier(.22, 1, .36, 1); font: 400 16px/1.5 \"DM Sans\", \"Helvetica Neue\", Arial, sans-serif; color: var(--ink); }",
        ".bf h2 { margin: 0; font: 500 clamp(32px, 4.4vw, 60px)/1 \"Familjen Grotesk\", \"Helvetica Neue\", Arial, sans-serif; letter-spacing: -.035em; max-width: 14ch; }",
        ".bf__sec { padding: 18vh clamp(20px, 6vw, 96px); }",
        ".bf__sec p { margin: 18px 0 0; max-width: 42ch; color: var(--ink-2); }",
        "",
        "/* La foto ocupa todo el ancho; el botón va pegado al centro de la pantalla mientras ella pasa. */",
        ".bf__foto { position: relative; display: flex; justify-content: center; }",
        ".bf__foto img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }",
        ".bf__foto::before { content: \"\"; position: absolute; inset: 0; z-index: 1; background: rgba(10, 30, 74, .18); }",
        ".bf-boton { position: sticky; top: calc(50% - var(--alto) / 2); z-index: 2; align-self: flex-start; margin: calc(50vh - var(--alto) / 2) 0;",
        "  display: inline-flex; align-items: center; gap: 10px; height: var(--alto); padding: 0 22px 0 24px; border-radius: 999px;",
        "  font: 500 calc(var(--alto) * .333)/1 \"Familjen Grotesk\", \"Helvetica Neue\", Arial, sans-serif; text-decoration: none; white-space: nowrap; transition: background 200ms ease, color 200ms ease; }",
        ".bf[data-color=\"tiza\"] .bf-boton { background: var(--tiza); color: var(--azul); }",
        ".bf[data-color=\"azul\"] .bf-boton { background: var(--azul); color: var(--tiza); }",
        ".bf-boton svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; transition: transform 260ms var(--curva); }",
        "@media (hover: hover) and (pointer: fine) { .bf[data-color=\"tiza\"] .bf-boton:hover { background: #fff; } .bf-boton:hover svg { transform: translateX(3px); } }"
      ].join("\n");
    },
    html: function (s) {
      return '<div class="bf" data-c="boton-fijo">\n' +
        '  <section class="bf__sec"><h2>Hecho por personas</h2><p>Trabajamos en planta y en oficinas, con oficios muy distintos. Buscamos gente que quiera crecer con nosotros.</p></section>\n' +
        '  <section class="bf__foto" style="height: ' + s.tramo + 'vh">\n    <img src="../novedades/fotos/demo-2.webp" alt="">\n' +
        '    <a class="bf-boton" href="#">Sumate a nuestro equipo' + FLECHA + '</a>\n  </section>\n' +
        '  <section class="bf__sec"><h2>Sigue el resto de la página</h2></section>\n</div>';
    }
  });
})();
