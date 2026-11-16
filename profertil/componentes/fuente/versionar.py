"""Marca de versión en los CSS y JS locales que carga una página generada.

GitHub Pages deja guardar cada archivo 10 minutos en el navegador. Si la página llega nueva y base.css o
tokens.css siguen guardados viejos, conviven dos versiones y algo se rompe (una variable que no existe anula
la transición entera, una franja que ya no va sigue ahí). Con ?v=<huella del contenido> en cada enlace, un
archivo que cambió tiene otra dirección y el navegador lo baja de nuevo; uno que no cambió sigue en caché.

Uso, al escribir la página ya armada:  html = versionar(html, ruta_de_la_pagina)
Si cambia base.css o tokens.css, hay que volver a correr el build de cada página que los usa.
"""
import hashlib, os, re

_ENLACE = re.compile(r'((?:href|src)=")([^"#?:]+\.(?:css|js))(?:\?v=[0-9a-f]+)?(")')


def versionar(html, ruta_pagina):
    carpeta = os.path.dirname(os.path.abspath(ruta_pagina))

    def marca(m):
        archivo = os.path.normpath(os.path.join(carpeta, m.group(2)))
        if not os.path.isfile(archivo):
            return m.group(0)
        huella = hashlib.md5(open(archivo, 'rb').read()).hexdigest()[:8]
        return m.group(1) + m.group(2) + '?v=' + huella + m.group(3)

    return _ENLACE.sub(marca, html)
