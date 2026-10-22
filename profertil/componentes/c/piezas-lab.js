/* Piezas del Lab que ya son una página propia: se ven acá adentro, sin salir de la librería. */
Libreria.sumar({ id: "carrusel-fotos", tipo: "pagina", src: "../carrusel-fotos/", nombre: "Carrusel de fotos", grupo: "Medios", tamano: "media",
  bajada: "Galería a todo el ancho con loop, parallax en cada foto y una pastilla que sigue al cursor.",
  claves: ["Una sola posición suavizada por la que pasa también el arrastre, con inercia al soltar.", "Sin encastre: queda donde frena. Flechas y toque en la foto vecina sí centran.", "La foto es más ancha que su marco: ese sobrante es el parallax."] });
Libreria.sumar({ id: "animadores", tipo: "pagina", src: "../animadores-texto/", nombre: "Animadores de texto", grupo: "Texto",
  bajada: "Las 14 animaciones de texto con nombre y valores fijos, con su probador.",
  claves: ["Se aplican con un solo atributo (data-anim) y arrancan solas al entrar en pantalla.", "Solo mueven transform, opacity, filter y clip-path; nunca desde escala 0.", "Con movimiento reducido todo entra con un fundido."] });
Libreria.sumar({ id: "novedades", tipo: "pagina", src: "../novedades/", nombre: "Novedades", grupo: "Páginas", tamano: "ancha",
  bajada: "La página de noticias completa: destacadas, buscador, filtros por categoría y año, y detalle." });
