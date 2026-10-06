# Arma ../index.html: la pagina de Novedades ya generada (profertil/novedades)
# con la capa de refraccion encima. Correr despues de cada build de Novedades
# para que la rama siga a la original.
import os
AQUI = os.path.dirname(os.path.abspath(__file__))
base = open(os.path.join(AQUI, '..', '..', 'novedades', 'index.html')).read()
css = open(os.path.join(AQUI, 'refraccion.css')).read()
js = open(os.path.join(AQUI, 'refraccion.js')).read()
assert base.count('</head>') == 1 and base.count('</body>') == 1
base = base.replace('<title>Novedades Profertil</title>', '<title>Novedades Profertil · refracción</title>')
base = base.replace('</head>', '<style>\n' + css + '</style>\n</head>')
base = base.replace('</body>', '<script type="module">\n' + js + '</script>\n</body>')
open(os.path.join(AQUI, '..', 'index.html'), 'w').write(base)
print(len(base))
