import json, os
AQUI = os.path.dirname(os.path.abspath(__file__))
os.chdir(AQUI)
t=open('template.html').read()
# Tokens y piezas compartidas: la página carga ../componentes/tokens.css (sale de tokens.json, exportado
# del Figma Master, con componentes/fuente/generar-tokens.py) y ../componentes/base.css.
import re
def sym(f,i):
    v=open(f).read(); vb=re.search(r'viewBox="([^"]+)"',v).group(1)
    inner=re.sub(r'^.*?<svg[^>]*>|</svg>\s*$','',v,flags=re.S).strip()
    return '<symbol id="%s" viewBox="%s">%s</symbol>'%(i,vb,inner)
t=t.replace('/*__LOGOS__*/', sym('logo-blanco.svg','pf-logo-blanco')+sym('simbolo-color.svg','pf-simbolo'))
aj=json.loads(open('assets.json').read()); aj.pop('iconos',None)
n=open('notas.json').read().replace('</','<\\/')
a=json.dumps(aj,ensure_ascii=False,separators=(',',':')).replace('</','<\\/')
t=t.replace('/*__NOTAS__*/[]',n).replace('/*__ASSETS__*/{}',a)
head,rest=t.split('</style>',1)
doc='<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'+head+'</style>\n</head>\n<body>\n'+rest+'</body>\n</html>\n'
open(os.path.join(AQUI,'..','index.html'),'w').write(doc)
print(len(t))
