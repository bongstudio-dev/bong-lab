// Firma de Bong Studio en el código: el comentario que va justo después del <!DOCTYPE html> de cada página.
// Se adaptan el nombre, la línea de qué es y el contexto; el resto es fijo (logo, saludo, créditos y contacto).
export function firma({ nombre, que, contexto }) {
  return `<!-- firma:bong

      ##########         #########
      ###########      #############
      ############   #################
      ###########   ###################
      ##########    ###################
      ############  ###################
      #############  #################
      #############   ###############
      ############      ###########

                            #####
      ##     ######     ##########
      ####   ######   ###########
      #####  ######  ###########
      #############  ##########
      #############  ###################
      #############  ##################
      #############   #################
      #############     #############
      #############        #######

      ${nombre}
      ${que}

      Hola. Si estás leyendo esto, te gusta ver cómo están hechas las cosas.
      A nosotros también.

      Diseño y desarrollo: Bong Studio
      Estudio de branding. Córdoba, Argentina. Desde 2019.
      ${contexto}

      CRÉDITOS
      María Lopez / Brand Designer
      Marcos Cousseau / Creative Director

      CONTACTO
      https://bongstudio.ar

      BONG STUDIO · 2026 — Brutally Clear Branding — bongstudio.ar
-->`;
}
