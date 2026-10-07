"""Arma ../index.html desde template.html.

No duplica el sistema: tokens, formas, logos y notas salen de la fuente de
Novedades (../../novedades/fuente), que a su vez sale del Figma Master.
"""
import base64, json, os, re

AQUI = os.path.dirname(os.path.abspath(__file__))
NOV = os.path.join(AQUI, '..', '..', 'novedades', 'fuente')
def lee(*p): return open(os.path.join(*p), encoding='utf-8').read()

t = lee(AQUI, 'template.html')

# Tokens del Master
tk = json.loads(lee(NOV, 'tokens.json'))['tokens']
t = t.replace('/*__TOKENS__*/', '\n  '.join('--%s: %s; /* %s */' % (k, v['valor'], v['figma']) for k, v in tk.items()))

# Logos como <symbol>
def sym(f, i):
    v = lee(NOV, f); vb = re.search(r'viewBox="([^"]+)"', v).group(1)
    inner = re.sub(r'^.*?<svg[^>]*>|</svg>\s*$', '', v, flags=re.S).strip()
    return '<symbol id="%s" viewBox="%s">%s</symbol>' % (i, vb, inner)
FORMAS = json.loads(lee(NOV, 'assets.json'))['formas']
simbolos = sym('logo-blanco.svg', 'logo-blanco') + sym('simbolo-color.svg', 'simbolo')
simbolos += ''.join('<symbol id="f-%s" viewBox="%s">%s</symbol>' % (k, f['vb'], f['d']) for k, f in FORMAS.items())
t = t.replace('<!--__SIMBOLOS__-->', simbolos)

# Mascaras: cada forma como SVG en data URI, para mask-image (sin canvas ni WebGL)
def mascara(k):
    f = FORMAS[k]
    svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="%s">%s</svg>' % (f['vb'], f['d'])
    return "url('data:image/svg+xml;base64,%s')" % base64.b64encode(svg.encode()).decode()
t = re.sub(r'/\*__MASCARA:(\w+)__\*/', lambda m: mascara(m.group(1)), t)

# Formas del rio (franja de comunidad): las 18, dos veces para que el loop no tenga costura
rio = ''.join('<svg class="rf" viewBox="%s" aria-hidden="true"><use href="#f-%s"/></svg>' % (f['vb'], k) for k, f in FORMAS.items())
t = t.replace('<!--__RIO__-->', '<div class="rio-tira">%s</div><div class="rio-tira" aria-hidden="true">%s</div>' % (rio, rio))

# Ultimas tres notas (las mismas de Novedades)
FAM = {'azul': ('#003DA5', '#4086FF', '#003DA5'), 'verde': ('#2D8035', '#5EB53A', '#2D8035'),
       'amarillo': ('#EABA2C', '#E57F19', '#E57F19'), 'naranja': ('#E57F19', '#8A4818', '#E57F19')}
def fam(n, inv=False):
    bg, fo, tx = FAM[n]
    return (fo, bg, tx) if inv else (bg, fo, tx)
TIPOS = {'institucional': ('Institucional', 'escudo', fam('azul')), 'comercial': ('Comercial', 'barras', fam('naranja')),
         'somos': ('Somos Profertil', 'circulos', fam('verde', True)), 'tecnico': ('Artículo técnico', 'lupa', fam('verde')),
         'aviso': ('Aviso a la comunidad', 'casco', fam('amarillo')), 'financiera': ('Gacetilla financiera', 'grafico', fam('azul', True))}
DESDE_WP = {'comunicacion-institucional': 'institucional', 'comunicacion-comercial': 'comercial', 'somos-profertil': 'somos'}
MESES = 'enero febrero marzo abril mayo junio julio agosto septiembre octubre noviembre diciembre'.split()
def etq(nombre, forma, f, dato=None, flecha=False):
    bg, fo, tx = f
    h = '<span class="etq" style="--eb:%s;--fo:%s;--tx:%s">' % (bg, fo, tx)
    h += '<svg class="bd" viewBox="0 0 100 100" aria-hidden="true"><use href="#badge-bg" width="100" height="100" fill="%s"/><use href="#f-%s" x="21" y="21" width="58" height="58" fill="%s"/></svg>' % (bg, forma, fo)
    h += '<span class="lb">%s</span>' % nombre
    if dato: h += '<span class="dt">%s</span>' % dato
    if flecha: h += '<span class="fl"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 8v10H8"/></svg></span>'
    return h + '</span>'
t = re.sub(r'<!--__ETQ:(\w+):(\w+):(\w+)(:inv)?:([^>]*?)__-->', lambda m: etq(m.group(5), m.group(2), fam(m.group(3), bool(m.group(4))), flecha=True), t)

notas = json.loads(lee(NOV, 'notas.json'))
notas = sorted([n for n in notas if n['f']], key=lambda n: n['f'])[-3:][::-1]
tarjetas = ''
for i, n in enumerate(notas):
    tp = DESDE_WP.get(n['s'], n['tp'])
    nombre, forma, f = TIPOS[tp]
    y, m, d = n['f'].split('-')
    dato = '%d de %s %s' % (int(d), MESES[int(m) - 1], y)
    tarjetas += ('<a class="nota" style="--i:%d" href="../novedades/">%s<h3>%s</h3><span class="leer">Leer la nota'
                 '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span></a>') % (
        i, etq(nombre, forma, f, dato), n['t'])
t = t.replace('<!--__NOTAS__-->', tarjetas)

head, rest = t.split('</style>', 1)
doc = ('<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="UTF-8">\n'
       '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
       '<meta name="theme-color" content="#003DA5">\n'
       + head + '</style>\n</head>\n<body>\n' + rest + '</body>\n</html>\n')
open(os.path.join(AQUI, '..', 'index.html'), 'w', encoding='utf-8').write(doc)
print(len(doc))
