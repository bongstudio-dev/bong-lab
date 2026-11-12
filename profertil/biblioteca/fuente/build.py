"""Arma la lista (../index.html) y el visor (../ver/index.html) desde lista.html y visor.html.

  python3 profertil/biblioteca/fuente/build.py

Los datos salen de docs.json, docs-msds.json y docs-inversores.json (prep-docs.py) y de etiquetas.json
(prep-etiquetas.py). La transición entre páginas, el pie y la firma de Bong
se toman de las mismas fuentes que Novedades.
"""
import json, os, re, subprocess, unicodedata
AQUI = os.path.dirname(os.path.abspath(__file__))
os.chdir(AQUI)
NOV = os.path.join(AQUI, '..', '..', 'novedades', 'fuente')
COMP = os.path.join(AQUI, '..', '..', 'componentes')

def sym(f, i):
    v = open(f).read(); vb = re.search(r'viewBox="([^"]+)"', v).group(1)
    inner = re.sub(r'^.*?<svg[^>]*>|</svg>\s*$', '', v, flags=re.S).strip()
    return '<symbol id="%s" viewBox="%s">%s</symbol>' % (i, vb, inner)
LOGOS = sym('logo-blanco.svg', 'pf-logo-blanco') + sym('simbolo-color.svg', 'pf-simbolo')

def js(x):
    return json.dumps(x, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')

# Biblioteca (docs.json) con sus etiquetas del sitio actual (etiquetas.json, de prep-etiquetas.py). Las hojas de seguridad
# y los informes para inversores tienen su propia página: no van en la lista, pero el visor los abre igual.
BIB = json.load(open('docs.json', encoding='utf-8'))['docs']
OTROS = json.load(open('docs-msds.json', encoding='utf-8'))['docs'] + json.load(open('docs-inversores.json', encoding='utf-8'))['docs']
ET = json.load(open('etiquetas.json', encoding='utf-8'))
# El id de opción en los documentos es el slug; en la página va el id corto (sin el "-2" de WordPress).
CORTO = {op['slug']: op['id'] for g in ET['grupos'] for op in g['opciones']}
for d in BIB:
    e = ET['docs'].get(d['id'])
    if e:
        d['e'] = {g: [CORTO.get(v, v) for v in vs] for g, vs in e.items()}
GRUPOS = [{'id': g['id'], 'nombre': g['nombre'],
           'opciones': [{k: op[k] for k in ('id', 'nombre', 'sub', 'provincia') if k in op} for op in g['opciones']]}
          for g in ET['grupos']]
docs = js(BIB)
grupos = js(GRUPOS)
plano = lambda t: unicodedata.normalize('NFD', t).encode('ascii', 'ignore').decode().lower()
docs_visor = js(sorted(BIB + OTROS, key=lambda d: plano(d['t'])))
aj = json.loads(open('assets.json').read()); aj.pop('iconos', None)
assets = json.dumps(aj, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')

# --- Transición entre páginas: la misma de Novedades (componente "Transiciones de página"), con su panel ---
TR_CSS = open('transicion.css', encoding='utf-8').read()
TR_CAB = open('transicion-cabeza.js', encoding='utf-8').read()
TR_JS = open('transicion.js', encoding='utf-8').read()
TR_COMP = open(os.path.join(COMP, 'c', 'transicion-navegacion.js'), encoding='utf-8').read()
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

def armar(head, rest):
    return ('<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
            + head + '\n' + TR_CSS + '</style>\n<script>\n' + TR_CAB + '</script>\n</head>\n<body>\n' + TR_VELO + rest
            + '<script>\n' + TR_JS + '</script>\n</body>\n</html>\n')

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

# --- Lista: ../index.html ---
lista = open('lista.html', encoding='utf-8').read()
comun = re.search(r'  /\* @comun.*?\*/\n(.*?)  /\* @fin-comun \*/', lista, re.S).group(1)
t = (lista.replace('/*__LOGOS__*/', LOGOS).replace('/*__DOCS__*/[]', docs).replace('/*__GRUPOS__*/[]', grupos)
     .replace('/*__ASSETS__*/{}', assets))
head, rest = t.split('</style>', 1)
salida = os.path.join(AQUI, '..', 'index.html')
open(salida, 'w', encoding='utf-8').write(armar(head, rest))
firmar(salida, 'PROFERTIL · BIBLIOTECA VIRTUAL', 'Maqueta de la Biblioteca Virtual: los PDF reales del sitio actual, con sus etiquetas.',
       'Prototipo de la Biblioteca Virtual para la web de Profertil.')
print('lista', os.path.getsize(salida))

# --- Visor: ../ver/index.html ---
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
pie = json.loads(subprocess.run(['node', '-e', PIE, COMP], capture_output=True, text=True, check=True).stdout)
badge = [l for l in lista.split('\n') if 'id="pf-badge-bg"' in l][0].strip()
v = open('visor.html', encoding='utf-8').read()
v = (v.replace('/*__COMUN__*/', comun).replace('/*__LOGOS__*/', LOGOS).replace('/*__BADGE__*/', badge)
      .replace('/*__DOCS__*/[]', docs_visor).replace('/*__ASSETS__*/{}', assets)
      .replace('/*__PIE_CSS__*/', pie['css']).replace('/*__PIE_HTML__*/', pie['html']))
head, rest = v.split('</style>', 1)
os.makedirs(os.path.join(AQUI, '..', 'ver'), exist_ok=True)
salida = os.path.join(AQUI, '..', 'ver', 'index.html')
open(salida, 'w', encoding='utf-8').write(armar(head, rest))
firmar(salida, 'PROFERTIL · VISOR DE LA BIBLIOTECA', 'Plantilla de documento con visor de PDF, sobre documentos reales del sitio actual.',
       'Prototipo de la página de documento para la web de Profertil.')
print('visor', os.path.getsize(salida))
