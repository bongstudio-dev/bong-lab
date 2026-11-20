/* Tweak de piezas: la herramienta de ajuste óptico, como página del Lab dentro de la librería.
   Muestra todas las piezas con texto de base.css, mide dónde cae la mayúscula en cada caja y da el CSS de lo que cambió. */
Libreria.sumar({
  id: "ajuste-piezas", nombre: "Tweak de piezas", grupo: "Controles", tipo: "pagina", src: "../pastillas-tweak/",
  alto: 900, tamano: "media",
  bajada: "Ajuste óptico de a un píxel de todas las piezas con texto: pastillas, chips, botones, etiquetas y selector. Vista conjunta del centrado, lupa con guías y CSS de lo que cambió, con el archivo donde va.",
  claves: ["El aire se mide desde el alto de mayúscula de cada texto (DM Sans o Familjen, según la pieza), no desde la caja del texto.", "Lo publicado se lee de la página ya dibujada: si base.css cambia, la herramienta parte de lo nuevo.", "Subir el texto en una caja de alto fijo se escribe como aire de abajo (o de arriba para bajarlo): el doble de lo que se mueve.", "Con número, la pastilla alinea por línea de base: el número se corre aparte."]
});
