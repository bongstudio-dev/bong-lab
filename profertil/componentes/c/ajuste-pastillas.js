/* Tweak de pastillas: la herramienta de ajuste de línea de base, como página del Lab dentro de la librería.
   Sirve para medir de a un píxel dónde caen nombre y número en la pastilla de filtro y copiar el CSS resultante. */
Libreria.sumar({
  id: "ajuste-pastillas", nombre: "Tweak de pastillas", grupo: "Controles", tipo: "pagina", src: "../pastillas-tweak/",
  alto: 900, tamano: "media",
  bajada: "Ajuste de a un píxel de la línea de base del nombre y el número en la pastilla de filtro: lupa con guías, lectura del aire arriba y abajo de la mayúscula y CSS listo para copiar.",
  claves: ["El aire se mide desde el alto de mayúscula del nombre (DM Sans), no desde la caja del texto.", "Con número, la pastilla alinea por línea de base: subir el nombre mueve los dos juntos; el número se corre aparte.", "Si alto y cuerpo tienen distinta paridad, el padding cae en medio píxel: la herramienta lo avisa."]
});
