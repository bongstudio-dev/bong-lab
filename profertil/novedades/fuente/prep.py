import os
import csv, json, re, unicodedata, collections
rows = list(csv.DictReader(open(os.environ.get('URLS_CSV', 'urls.csv'), encoding='utf-8-sig')))
nr = [r for r in rows if '/noticias-recientes/' in r['url'] and r['idioma'] == 'es' and r['vista_wp'] == 'single-post']

def plano(s):
    return unicodedata.normalize('NFD', s).encode('ascii', 'ignore').decode().lower()

SIGLAS = ['AAPRESID','CREA','AACREA','INTA','UTN','UNS','MIT','IFA','YPF','CITA','ISO','SAP','CEADS','SEDRONAR','ONU','GO','BT','I+D','AACS','ASAGIR','NOA','JAT','SRA','CASAFE','FERTEC','IPNI','MPM','VC','AIA','UP','RSE','CFP','HAB','DIRCOMS','COVID-19','SD','APLA','AMCHAM','US$','N°']
NOMBRES = {'profertil':'Profertil','enetotal':'eNeTOTAL','proaire':'PROAIRE','prosuelos':'Prosuelos','maizar':'Maizar','fertilizar':'Fertilizar','argentina':'Argentina','bahia':'Bahía','blanca':'Blanca','ingeniero':'Ingeniero','white':'White','san':'San','nicolas':'Nicolás','sudoeste':'Sudoeste','bonaerense':'Bonaerense','triguero':'Triguero','maicero':'Maicero','depetris':'Depetris','cordoba':'Córdoba','tucuman':'Tucumán','necochea':'Necochea','plus':'PLUS','eikon':'Eikon','biosapiens':'Biosapiens','parana':'Paraná','general':'General','martin':'Martín','santa':'Santa','fe':'Fe','rosario':'Rosario','sudamerica':'Sudamérica','mercosur':'Mercosur','resiliar':'Resiliar','fundtv':'FundTV','ucrop.it':'Ucrop.it','sierra':'Sierra','leona':'Leona','balcarce':'Balcarce'}

def caso(t):
    t = re.sub(r'\s+', ' ', t).strip()
    letras = [c for c in t if c.isalpha()]
    mayus = sum(c.isupper() for c in letras) / max(len(letras), 1)
    if mayus > 0.6:
        out = []
        for i, w in enumerate(t.split(' ')):
            core = w.strip('“”"¡!¿?.,:;()–-')
            if core.upper() in SIGLAS or re.fullmatch(r'[ivxlIVXL]+', core or '-'):
                out.append(w.upper() if core else w); continue
            if False:
                out.append(w); continue
            lw = w.lower()
            key = plano(core)
            if key in NOMBRES:
                lw = lw.replace(core.lower(), NOMBRES[key])
            elif i == 0 or (out and out[-1].endswith(('.', ':', '?', '!'))):
                j = next((k for k, ch in enumerate(lw) if ch.isalpha()), 0)
                lw = lw[:j] + lw[j:j+1].upper() + lw[j+1:]
            out.append(lw)
        t = ' '.join(out)
        if t and not t[0].isupper():
            j = next((k for k, ch in enumerate(t) if ch.isalpha()), 0)
            t = t[:j] + t[j].upper() + t[j+1:]
    t = re.sub(r'PROFERTIL', 'Profertil', t)
    t = re.sub(r'\s+([.,:;])', r'\1', t)
    return t

def tiene(txt, *pal):
    return any(p in txt for p in pal)

def tipo(r, txt, sub):
    if tiene(txt, 'informa', 'informacion para la comunidad', 'informacion para la prensa', 'informacion a la comunidad', 'parada de planta', 'parada planta', 'arranque', 'puesta en marcha', 'corte general de energia', 'caldera auxiliar', 'temporal en bahia', 'covid', 'situacion en necochea', 'tareas de mantenimiento', 'novedades de nuestra planta', 'fin parada', 'gacetilla parada', 'gacetilla arranque', 'interrupcion de operaciones', 'informacion importante'):
        return 'aviso'
    if tiene(txt, 'obligaciones negociables', 'invierte 800', 'fuerte inversion', 'se posiciona en el mercado'):
        return 'financiera'
    if sub == 'comunicacion-comercial':
        return 'comercial'
    tecnico = tiene(txt, 'fertilizacion', 'nutricion', 'nutrientes', 'muestreo', 'analisis de suelo', 'nitrogen', 'azufre', 'boletin', 'bt 3', 'mpm', 'mejores practicas', 'verdeos', 'rotacion', 'rotar', 'microbiologia', 'manejo de pasturas', 'manejo nutricional', 'fertilizar para', 'claves para', 'estrategias de', 'secuestro de carbono', 'recarbonizacion', 'brechas de', 'erosion', 'perdida de nutrientes', 'degradacion', 'deterioro', 'que es lo urgente', 'tener problemas', 'pasturas', 'asegurar la nutricion', 'fertilidad de suelos', 'tecnologias en nutricion', 'fertilizacion foliar', 'trigo como cobertura', 'cuando y cuanto', 'agricultura por ambientes', 'charla tecnica', 'salud del suelo', 'pierde rendimientos', 'exportando fertilidad', 'suelos de tu campo', 'le pegan al suelo', 'por que nos inundamos', 'maiz tardio', 'entender para manejar', 'pensar en cantidad')
    evento = tiene(txt, 'congreso', 'jornada', 'simposio', 'seminario', 'mit ', 'mit de', 'ciclo mit', 'mit aplicacion', 'webinar', 'taller', 'a todo trigo', 'expo rural', 'expoagro', 'feria', 'videoconferencia', 'ciclo de vc', 'cumbre', 'reunion', 'encuentro', 'agrofer')
    if tecnico and not evento:
        return 'tecnico'
    if evento or tiene(txt, 'distribuidor', 'sucursal', 'red distribucion', 'lanzamiento', 'lanza ', 'lanzo', 'nuevo producto', 'nuevo fertilizante', 'premium', 'enetotal', 'proaire', 'solucion de urea', 'prosuelos', 'profertil go', 'visito nuestra', 'visitaron', 'visito la planta', 'visita de agroservicios', 'newsletter', 'fanpage', 'sorteo', 'promo mundial', 'facebook', 'software', 'triguero', 'maicero', 'ucrop', 'campana', 'la fina', 'excelencia tecnico', 'cerca tuyo', 'agrositio', 'dron', 'mercado', 'supply chain', 'logistica', 'web'):
        return 'comercial'
    if tecnico:
        return 'tecnico'
    return 'institucional'

PIL = {
  'suelos': ('suelo', 'fertiliz', 'nutri', 'nitrogen', 'azufre', 'muestreo', 'prosuelos', 'mpm', 'boletin', 'bt 3', 'carbono', 'erosion', 'rotacion', 'rotar', 'micronutri', 'mejores practicas', 'verdeos', 'pasturas', 'fertilidad', 'enetotal', 'tierra'),
  'alimentos': ('aliment', 'hambre', 'trigo', 'maiz', 'soja', 'girasol', 'cebada', 'arroz', 'cosecha', 'cultivo', 'campana', 'cereal', 'agricultura familiar', 'la fina', 'rendimiento', 'rindes', 'triguer', 'maicer', 'citricultura', 'cebolla', 'ganader', 'agricultura'),
  'energia': ('energia', 'eolica', 'renovable', 'ypf luz', 'iso 50', 'emision', 'emisiones', 'huella', 'caldera', 'urea', 'planta de amoniaco', 'amoniaco', 'megaplanta', 'ampliar su planta', 'produccion', 'proaire', 'diesel', 'parada', 'arranque', 'puesta en marcha', 'medioambiente', 'medio ambiente', 'packaging', 'inaugur', 'almacenaje', 'logistica', 'terminal', 'planta sobre', 'protect & sustain', 'certificacion'),
  'comunidades': ('comunidad', 'vecinos', 'escuela', 'becas', 'educar', 'donacion', 'hospital', 'club', 'huerta', 'visitas a planta', 'visitante', 'ingeniero white', 'utn', 'uns', 'convenio', 'rse', 'mesa de proyectos', 'arboles', 'reverdecer', 'anfiteatro', 'laboratorios', 'oficios', 'robotica', 'reyes', 'maraton', 'solidagro', 'solidaria', 'jovenes', 'juventud', 'padrinazgo', 'practicas profesionalizantes', 'espacio verde', 'parque', 'prevencion de riesgos', 'experiencia up', 'foro ecumenico', 'pacto global', 'reporte', 'sustentab', 'sostenib', 'etica', 'aniversario', 'podcast', 'tierra de historias', 'sedronar', 'monumento', 'informa', 'informacion'),
}
CUL = {
  'trigo': ('trigo', 'triguer', 'la fina', 'cultivos de invierno', 'cultivos invernales', 'cosecha fina', 'cereal'),
  'maiz': ('maiz', 'maicer', 'gruesa'),
  'soja': ('soja',),
  'girasol': ('girasol',),
  'pasturas': ('pastura', 'verdeo', 'forraj', 'ganader'),
  'cebada-arroz': ('cebada', 'arroz', 'citric', 'cebolla'),
}

notas = []
for r in nr:
    titulo = caso(r['h1'] or r['title'].replace(' - Profertil', ''))
    path = r['url'].split('/index.php/')[1]
    resto = path.split('noticias-recientes/', 1)[1]
    sub = resto.split('/')[0] if '/' in resto else ''
    txt = ' ' + plano(titulo + ' ' + resto.replace('-', ' ')) + ' '
    tp = tipo(r, txt, sub)
    pil = [k for k, ws in PIL.items() if any(w in txt for w in ws)]
    cul = [k for k, ws in CUL.items() if any(w in txt for w in ws)]
    if not pil:
        pil = {'aviso': ['comunidades'], 'financiera': ['energia'], 'tecnico': ['suelos'], 'comercial': ['alimentos'], 'institucional': ['comunidades']}[tp]
    bj = r['meta_description'].strip()
    if bj.startswith('Somos Profertil y con nuestro trabajo') or not bj:
        bj = ''
    notas.append({
        't': titulo, 'f': r['fecha_publicacion'] or '', 'u': path, 'w': int(r['palabras_contenido'] or 0),
        'i': int(r['cantidad_imagenes'] or 0), 'v': 1 if r['tiene_video'] == 'si' else 0,
        'tp': tp, 'p': pil[:3], 'c': cul, 'b': bj, 's': sub,
    })

notas.sort(key=lambda n: (n['f'] or '0000', n['t']))
print(len(notas))
print(collections.Counter(n['tp'] for n in notas))
print(collections.Counter(p for n in notas for p in n['p']))
print(collections.Counter(c for n in notas for c in n['c']))
print(sum(1 for n in notas if not n['f']))
json.dump(notas, open('notas.json', 'w'), ensure_ascii=False, separators=(',', ':'))
for tp in ['aviso','financiera','tecnico','comercial','institucional']:
    print('==', tp, [n['t'][:50] for n in notas if n['tp']==tp][:12])
print([n['t'] for n in notas if n['t'] != n['t'] and False])
import random; random.seed(3)
print([n['t'] for n in random.sample(notas, 25)])
