import json, os
AQUI = os.path.dirname(os.path.abspath(__file__))
os.chdir(AQUI)
t=open('template.html').read()
# Tokens: el :root sale de tokens.json (exportado de las variables del Figma Master).
tk=json.load(open('tokens.json'))['tokens']
lineas='\n  '.join('--%s: %s; /* %s */'%(k,v['valor'],v['figma']) for k,v in tk.items())
assert '/*__TOKENS__*/' in t
t=t.replace('/*__TOKENS__*/', lineas)
import re
def sym(f,i):
    v=open(f).read(); vb=re.search(r'viewBox="([^"]+)"',v).group(1)
    inner=re.sub(r'^.*?<svg[^>]*>|</svg>\s*$','',v,flags=re.S).strip()
    return '<symbol id="%s" viewBox="%s">%s</symbol>'%(i,vb,inner)
t=t.replace('/*__LOGOS__*/', sym('logo-blanco.svg','logo-blanco')+sym('simbolo-color.svg','simbolo'))
aj=json.loads(open('assets.json').read()); aj.pop('iconos',None)
n=open('notas.json').read().replace('</','<\\/')
a=json.dumps(aj,ensure_ascii=False,separators=(',',':')).replace('</','<\\/')
t=t.replace('/*__NOTAS__*/[]',n).replace('/*__ASSETS__*/{}',a)
head,rest=t.split('</style>',1)
doc='<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'+head+'</style>\n</head>\n<body>\n'+rest+'</body>\n</html>\n'
open(os.path.join(AQUI,'..','index.html'),'w').write(doc)
print(len(t))
