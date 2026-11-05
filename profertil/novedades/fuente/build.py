import json, os
AQUI = os.path.dirname(os.path.abspath(__file__))
os.chdir(AQUI)
t=open('template.html').read()
# Tokens y piezas compartidas: la página carga ../componentes/tokens.css (sale de tokens.json, exportado
# del Figma Master, con componentes/fuente/generar-tokens.py) y ../componentes/base.css.
import re, subprocess
def sym(f,i):
    v=open(f).read(); vb=re.search(r'viewBox="([^"]+)"',v).group(1)
    inner=re.sub(r'^.*?<svg[^>]*>|</svg>\s*$','',v,flags=re.S).strip()
    return '<symbol id="%s" viewBox="%s">%s</symbol>'%(i,vb,inner)
t=t.replace('/*__LOGOS__*/', sym('logo-blanco.svg','pf-logo-blanco')+sym('simbolo-color.svg','pf-simbolo'))
aj=json.loads(open('assets.json').read()); aj.pop('iconos',None)
n=open('notas.json').read().replace('</','<\\/')
a=json.dumps(aj,ensure_ascii=False,separators=(',',':')).replace('</','<\\/')
t=t.replace('/*__NOTAS__*/[]',n).replace('/*__ASSETS__*/{}',a)
# Transición entre páginas (componente "Transiciones de página" de la librería) y su panel:
# el CSS y el script del head van antes de pintar; el paño, al principio del body.
TR_CSS = open('transicion.css', encoding='utf-8').read()
TR_CAB = open('transicion-cabeza.js', encoding='utf-8').read()
TR_JS = open('transicion.js', encoding='utf-8').read()
# La variante "Persiana con logo animado": el logo por piezas y su animación se toman del componente
# (componentes/c/transicion-navegacion.js) y se adaptan a las clases de acá.
TR_COMP = open(os.path.join(AQUI, '..', '..', 'componentes', 'c', 'transicion-navegacion.js'), encoding='utf-8').read()
LOGO_ANIMADO = json.loads(re.search(r'var LOGO_ANIMADO = ("(?:[^"\\]|\\.)*");', TR_COMP).group(1))
TR_CSS_COMP = subprocess.run(['node', '-e', '''
const vm = require("vm"), fs = require("fs"); let comp;
const ctx = { Libreria: { sumar: c => { comp = c; } } }; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(process.argv[1], "utf8"), ctx);
process.stdout.write(comp.css({}));
''', os.path.join(AQUI, '..', '..', 'componentes', 'c', 'transicion-navegacion.js')], capture_output=True, text=True, check=True).stdout
anim = TR_CSS_COMP[TR_CSS_COMP.index('/* Persiana con logo animado'):TR_CSS_COMP.index('/* Fundido')]
anim = (anim.replace('.pf-tp__velo', '.pf-tr-velo').replace('.pf-entra .pf-la', '.pf-tr-velo.pf-entra .pf-la')
        .replace('var(--color)', 'var(--pf-tr-color)').replace('var(--pf-dur)', 'var(--pf-tr-dur)'))
TR_CSS = TR_CSS + '\n' + anim
TR_VELO = ('<div class="pf-tr-velo" id="pf-tr-velo" aria-hidden="true"><svg class="pf-tr-logo" viewBox="0 0 1458 1021"><use href="#pf-logo-blanco"/></svg>'
           + LOGO_ANIMADO + '</div>\n')
def armar(head, rest):
    return ('<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
            + head + '\n' + TR_CSS + '</style>\n<script>\n' + TR_CAB + '</script>\n</head>\n<body>\n' + TR_VELO + rest
            + '<script>\n' + TR_JS + '</script>\n</body>\n</html>\n')

head,rest=t.split('</style>',1)
doc=armar(head,rest)
open(os.path.join(AQUI,'..','index.html'),'w').write(doc)
print(len(t))

# --- Firma de Bong en el código (la misma de las otras piezas Profertil del Lab) ---
def firma(nombre, que, contexto):
    base = open(os.path.join(AQUI, '..', '..', 'carrusel-fotos', 'index.html'), encoding='utf-8').read()
    f = base[base.index('<!-- firma:bong'):base.index('-->', base.index('<!-- firma:bong')) + 3]
    f = re.sub(r'      PROFERTIL · CARRUSEL DE FOTOS\n      [^\n]*\n', '      %s\n      %s\n' % (nombre, que), f)
    f = re.sub(r'      Prototipo del componente[^\n]*\n', '      %s\n' % contexto, f)
    return f

def firmar(ruta, nombre, que, contexto):
    s = open(ruta, encoding='utf-8').read()
    s = re.sub(r'\n?<!-- firma:bong.*?-->\n?', '\n', s, flags=re.S)
    s = s.replace('<!DOCTYPE html>\n', '<!DOCTYPE html>\n' + firma(nombre, que, contexto) + '\n', 1)
    open(ruta, 'w', encoding='utf-8').write(s)

firmar(os.path.join(AQUI, '..', 'index.html'), 'PROFERTIL · NOVEDADES',
       'Maqueta del archivo de notas: las notas reales del sitio actual.',
       'Prototipo de la sección Novedades para la web de Profertil.')

# --- Página de Nota: ../nota/index.html ---
# Comparte con Novedades el bloque entre @comun y @fin-comun de template.html (tipos, etiquetas,
# arte de tarjeta), los logos, las formas y notas.json. El texto de cada nota lo lee de ../notas/.
import subprocess
comun = re.search(r'  /\* @comun.*?\*/\n(.*?)  /\* @fin-comun \*/', t, re.S).group(1)
# El pie es el componente "Pie de página" de la librería, variante Institucional sobre azul.
PIE = r'''
const vm = require("vm"), fs = require("fs"), path = require("path");
const dir = process.argv[1]; let comp;
const ctx = { window: {}, Libreria: { sumar: c => { comp = c; } }, console };
ctx.window = ctx; vm.createContext(ctx);
for (const f of ["formas.js", "c/pie.js"]) vm.runInContext(fs.readFileSync(path.join(dir, f), "utf8"), ctx);
const s = { variante: "institucional", fondo: "azul", etica: true };
const html = comp.html(s).replace('<footer class="pf-pie"', '<footer class="pf-pie" data-variante="institucional" data-fondo="azul"');
process.stdout.write(JSON.stringify({ html, css: comp.css(s) }));
'''
pie = json.loads(subprocess.run(['node', '-e', PIE, os.path.join(AQUI, '..', '..', 'componentes')], capture_output=True, text=True, check=True).stdout)
aj2 = json.loads(open('assets.json').read())
nt = open('nota.html', encoding='utf-8').read()
nt = nt.replace('/*__COMUN__*/', comun).replace('/*__LOGOS__*/', sym('logo-blanco.svg', 'pf-logo-blanco') + sym('simbolo-color.svg', 'pf-simbolo'))
nt = nt.replace('/*__NOTAS__*/[]', n).replace('/*__ASSETS__*/{}', json.dumps(aj2, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/'))
nt = nt.replace('/*__PIE_CSS__*/', pie['css']).replace('/*__PIE_HTML__*/', pie['html'])
head, rest = nt.split('</style>', 1)
doc = armar(head, rest)
os.makedirs(os.path.join(AQUI, '..', 'nota'), exist_ok=True)
salida = os.path.join(AQUI, '..', 'nota', 'index.html')
open(salida, 'w', encoding='utf-8').write(doc)
firmar(salida, 'PROFERTIL · NOTA', 'Plantilla de nota de Novedades, con las notas reales del sitio actual.',
       'Prototipo de la página de nota para la web de Profertil.')
print('nota', len(doc))
