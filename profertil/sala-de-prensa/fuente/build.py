"""Arma la Sala de prensa (../index.html) desde sala.html y prensa.json.

  python3 profertil/sala-de-prensa/fuente/build.py

Los datos salen de prep-prensa.py. La transición entre páginas, la cabecera con campo, los logos, las Formas y la firma
de Bong se toman de las mismas fuentes que la Biblioteca y Novedades. Las gacetillas abren en el visor de la Biblioteca:
si cambia prensa.json, correr también el build.py de la Biblioteca (lleva las gacetillas a su visor).
"""
import json, os, re, subprocess, sys
AQUI = os.path.dirname(os.path.abspath(__file__))
os.chdir(AQUI)
BIB = os.path.join(AQUI, '..', '..', 'biblioteca', 'fuente')
NOV = os.path.join(AQUI, '..', '..', 'novedades', 'fuente')
COMP = os.path.join(AQUI, '..', '..', 'componentes')


def leer(*p):
    return open(os.path.join(*p), encoding='utf-8').read()


def sym(f, i):
    v = leer(f); vb = re.search(r'viewBox="([^"]+)"', v).group(1)
    inner = re.sub(r'^.*?<svg[^>]*>|</svg>\s*$', '', v, flags=re.S).strip()
    return '<symbol id="%s" viewBox="%s">%s</symbol>' % (i, vb, inner)


def js(x):
    return json.dumps(x, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')


LOGOS = sym(os.path.join(BIB, 'logo-blanco.svg'), 'pf-logo-blanco') + sym(os.path.join(BIB, 'simbolo-color.svg'), 'pf-simbolo')
aj = json.loads(leer(BIB, 'assets.json')); aj.pop('iconos', None)

# Datos: lo que usa la página (sin el texto de los PDF, que solo sirvió para sacar títulos y fechas).
P = json.load(open('prensa.json', encoding='utf-8'))
for g in P['gacetillas']:
    g.pop('texto', None); g.pop('archivo', None)

# --- Transición entre páginas: la misma de la Biblioteca y Novedades ---
TR_CSS = leer(BIB, 'transicion.css'); TR_CAB = leer(BIB, 'transicion-cabeza.js'); TR_JS = leer(BIB, 'transicion.js')
TR_COMP = leer(COMP, 'c', 'transicion-navegacion.js')
LOGO_ANIMADO = json.loads(re.search(r'var LOGO_ANIMADO = ("(?:[^"\\]|\\.)*");', TR_COMP).group(1))
TR_CSS_COMP = subprocess.run(['node', '-e', '''
const vm = require("vm"), fs = require("fs"); let comp;
const ctx = { Libreria: { sumar: c => { comp = c; } } }; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(process.argv[1], "utf8"), ctx);
process.stdout.write(comp.css({}));
''', os.path.join(COMP, 'c', 'transicion-navegacion.js')], capture_output=True, text=True, check=True).stdout
anim = TR_CSS_COMP[TR_CSS_COMP.index('/* Persiana con logo animado'):TR_CSS_COMP.index('/* Fundido')]
anim = (anim.replace('.pf-tp__velo', '.pf-tr-velo').replace('.pf-entra .pf-la', '.pf-tr-velo.pf-entra .pf-la')
        .replace('var(--color)', 'var(--pf-tr-color)').replace('var(--pf-dur)', 'var(--pf-tr-dur)'))
TR_CSS = TR_CSS + '\n' + anim
TR_VELO = ('<div class="pf-tr-velo" id="pf-tr-velo" aria-hidden="true"><svg class="pf-tr-logo" viewBox="0 0 1458 1021"><use href="#pf-logo-blanco"/></svg>'
           + LOGO_ANIMADO + '</div>\n')

t = (leer('sala.html').replace('/*__LOGOS__*/', LOGOS).replace('/*__PRENSA__*/{}', js(P))
     .replace('/*__ASSETS__*/{}', js(aj)))
head, rest = t.split('</style>', 1)
doc = ('<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
       + head + '\n' + TR_CSS + '</style>\n<script>\n' + TR_CAB + '</script>\n</head>\n<body>\n' + TR_VELO + rest
       + '<script>\n' + TR_JS + '</script>\n</body>\n</html>\n')
# Cabecera con campo: el mismo campo de Formas de la Nota y la Biblioteca (novedades/fuente/campo.js), configurado con window.PF_CAMPO.
i = doc.rfind('</body>')
doc = doc[:i] + '<script>\n' + leer(NOV, 'campo.js') + '</script>\n' + doc[i:]

# --- Firma de Bong en el código (la misma de las otras piezas Profertil del Lab) ---
base = leer(AQUI, '..', '..', 'carrusel-fotos', 'index.html')
f = base[base.index('<!-- firma:bong'):base.index('-->', base.index('<!-- firma:bong')) + 3]
f = re.sub(r'      PROFERTIL · CARRUSEL DE FOTOS\n      [^\n]*\n',
           '      PROFERTIL · SALA DE PRENSA\n      Maqueta de la Sala de prensa: gacetillas, fotos, videos y logos reales del sitio actual.\n', f)
f = re.sub(r'      Prototipo del componente[^\n]*\n', '      Prototipo de la Sala de prensa para la web de Profertil.\n', f)
doc = doc.replace('<!DOCTYPE html>\n', '<!DOCTYPE html>\n' + f + '\n', 1)

sys.path.insert(0, os.path.join(COMP, 'fuente'))
from versionar import versionar
salida = os.path.join(AQUI, '..', 'index.html')
doc = versionar(doc, salida)
open(salida, 'w', encoding='utf-8').write(doc)
print('sala-de-prensa/index.html', os.path.getsize(salida))
