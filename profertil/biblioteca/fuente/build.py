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
MSDS = json.load(open('docs-msds.json', encoding='utf-8'))['docs']
OTROS = MSDS + json.load(open('docs-inversores.json', encoding='utf-8'))['docs']
# Hojas de seguridad: el nombre del producto, sin "MSDS" (la página ya lo dice) y con las siglas entre paréntesis en mayúscula.
for d in MSDS:
    t = re.sub(r'\s*\bMSDS\b\s*', ' ', d['t']).strip()
    d['t'] = re.sub(r'\(([a-z]{2,4})\)', lambda m: '(' + m.group(1).upper() + ')', t)
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

import sys
sys.path.insert(0, os.path.join(AQUI, '..', '..', 'componentes', 'fuente'))
from versionar import versionar


def firmar(ruta, nombre, que, contexto):
    s = open(ruta, encoding='utf-8').read()
    s = re.sub(r'\n?<!-- firma:bong.*?-->\n?', '\n', s, flags=re.S)
    s = s.replace('<!DOCTYPE html>\n', '<!DOCTYPE html>\n' + firma(nombre, que, contexto) + '\n', 1)
    s = versionar(s, ruta)  # ?v= en los CSS y JS locales, para que la caché nunca mezcle versiones
    open(ruta, 'w', encoding='utf-8').write(s)

# --- Listas: la Biblioteca (../index.html) y Hojas de seguridad (../../hojas-de-seguridad/index.html), la misma plantilla ---
lista = open('lista.html', encoding='utf-8').read()
comun = re.search(r'  /\* @comun.*?\*/\n(.*?)  /\* @fin-comun \*/', lista, re.S).group(1)

def hacer_lista(salida, datos, grupos_js, pag='{}', textos=(), css='', firma_args=()):
    t = (lista.replace('/*__LOGOS__*/', LOGOS).replace('/*__DOCS__*/[]', datos).replace('/*__GRUPOS__*/[]', grupos_js)
         .replace('/*__ASSETS__*/{}', assets).replace('/*__PAG__*/{}', pag))
    for a, b in textos:
        assert a in t, a
        t = t.replace(a, b)
    head, rest = t.split('</style>', 1)
    doc = armar(head + css, rest)
    # Cabecera con campo: el mismo campo de Formas de la Nota (novedades/fuente/campo.js), configurado con window.PF_CAMPO.
    i = doc.rfind('</body>')
    doc = doc[:i] + '<script>\n' + open(os.path.join(NOV, 'campo.js'), encoding='utf-8').read() + '</script>\n' + doc[i:]
    os.makedirs(os.path.dirname(salida), exist_ok=True)
    open(salida, 'w', encoding='utf-8').write(doc)
    firmar(salida, *firma_args)
    print(os.path.relpath(salida, os.path.join(AQUI, '..', '..')), os.path.getsize(salida))

hacer_lista(os.path.join(AQUI, '..', 'index.html'), docs, grupos,
            firma_args=('PROFERTIL · BIBLIOTECA VIRTUAL', 'Maqueta de la Biblioteca Virtual: los PDF reales del sitio actual, con sus etiquetas.',
                        'Prototipo de la Biblioteca Virtual para la web de Profertil.'))

# Hojas de seguridad: 22 documentos, uno por producto. Sin filtros (cultivo, zona y nutriente no aplican) ni orden por año
# (no tienen); el visor y los PDF son los de la Biblioteca. La fila es el ícono, el producto y la descarga.
HOJAS_PAG = js({'base': '../biblioteca/', 'todo': 'Todas las hojas de seguridad', 'uno': 'hoja', 'varios': 'hojas',
                'campo': {'color': 'amarillo', 'forma': 'casco', 'tema': ['casco', 'escudo']}})
HOJAS_TEXTOS = [
    ('<title>Biblioteca Virtual Profertil</title>', '<title>Hojas de seguridad Profertil</title>'),
    ('<meta name="description" content="Maqueta de la Biblioteca Virtual de profertil.com.ar sobre el concepto web del manual de marca: los boletines y ensayos reales del sitio actual, con buscador, filtros por cultivo, zona, año y nutriente, y visor de PDF.">',
     '<meta name="description" content="Maqueta de Hojas de seguridad de profertil.com.ar sobre el concepto web del manual de marca: las fichas de datos de seguridad reales de cada producto, con buscador y visor de PDF.">'),
    ('data-seccion="documentos" data-nombre="Biblioteca" data-en="la Biblioteca"', 'data-seccion="hojas" data-nombre="Hojas" data-en="las hojas de seguridad"'),
    ('href="#pf-lista">Ir a la Biblioteca</a>', 'href="#pf-lista">Ir a las hojas de seguridad</a>'),
    ('aria-label="Buscar en la Biblioteca" aria-expanded', 'aria-label="Buscar un producto" aria-expanded'),
    ('placeholder="Buscá: soja, boletín, urea…" aria-label="Buscar en la Biblioteca"', 'placeholder="Buscá un producto: urea, UAN…" aria-label="Buscar un producto"'),
    ('<h1>Biblioteca Virtual</h1>', '<h1>Hojas de seguridad</h1>'),
    ('<p>Accedé a investigaciones sobre nutrición de cultivos, eficiencia de nutrientes y cuidado del suelo, agua y aire, elaboradas por Investigación y Desarrollo de Profertil, instituciones técnicas y especialistas de trayectoria.</p>',
     '<p>La ficha de datos de seguridad de cada producto de Profertil, para transportarlo, almacenarlo y usarlo de forma segura y saber cómo actuar ante una emergencia.</p>'),
    ('id="pf-emptyReset" type="button">Ver toda la Biblioteca</button>', 'id="pf-emptyReset" type="button">Ver todas las hojas</button>'),
]
HOJAS_CSS = """
/* Hojas de seguridad: sin filtros, ancla ni orden por año. La fila es el ícono, el producto y la descarga: el rótulo de la
   etiqueta y el año sobran (todas son hojas de seguridad y ninguna tiene año). */
.pf-filters, .pf-ancla, .pf-orden { display: none; }
.pf-docs[data-vista="lista"] .pf-doc { grid-template-columns: 34px minmax(0, 1fr) 36px; }
.pf-docs[data-vista="lista"] .pf-etiqueta__rotulo, .pf-docs[data-vista="lista"] .pf-doc__y { display: none; }
@media (max-width: 640px) {
  .pf-docs[data-vista="lista"] .pf-doc { grid-template-columns: 30px minmax(0, 1fr) 36px; row-gap: 0; }
  .pf-docs[data-vista="lista"] .pf-doc .pf-etiqueta, .pf-docs[data-vista="lista"] .pf-doc__t, .pf-docs[data-vista="lista"] .pf-doc__d { grid-row: 1; }
  .pf-docs[data-vista="lista"] .pf-doc .pf-etiqueta { grid-column: 1; }
  .pf-docs[data-vista="lista"] .pf-doc__t { grid-column: 2; }
  .pf-docs[data-vista="lista"] .pf-doc__d { grid-column: 3; align-self: center; }
}
"""
hacer_lista(os.path.join(AQUI, '..', '..', 'hojas-de-seguridad', 'index.html'), js(MSDS), '[]', HOJAS_PAG, HOJAS_TEXTOS, HOJAS_CSS,
            ('PROFERTIL · HOJAS DE SEGURIDAD', 'Maqueta de Hojas de seguridad: las fichas reales de cada producto del sitio actual.',
             'Prototipo de la página de Hojas de seguridad para la web de Profertil.'))

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
