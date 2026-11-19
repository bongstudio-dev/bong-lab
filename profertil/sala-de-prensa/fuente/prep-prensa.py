"""Arma prensa.json con el contenido real de la Sala de prensa del sitio actual, leído del HTML del relevamiento.

  python3 profertil/sala-de-prensa/fuente/prep-prensa.py           # solo los datos
  python3 profertil/sala-de-prensa/fuente/prep-prensa.py --bajar   # además baja PDF, fotos y logos que falten

Qué toma (todo de las páginas /sala-de-prensa/ en español):
- Gacetillas: las de 2021 y 2023 (la de 2022 está vacía). Cada una es un mes, un PDF y a veces una foto.
  El PDF se guarda con las copias de la Biblioteca (../../biblioteca/pdf/) para que las abra su visor; la foto, si tiene,
  en ../fotos/gacetillas/ (720 px) para la vista de miniaturas.
- Fotos: las 6 galerías (4 enlazadas desde Fotos y 2 que no lo están), con la foto original de cada miniatura.
- Logos: las variantes de la pestaña Documentos, en PDF, PNG y SVG.
- Contacto de prensa.
"""
import gzip, hashlib, json, os, re, subprocess, sys, tempfile, unicodedata
from html.parser import HTMLParser
from urllib.parse import unquote, urlparse

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.join(AQUI, '..')
PDF_DIR = os.path.join(AQUI, '..', '..', 'biblioteca', 'pdf')
REL = os.environ.get('RELEVAMIENTO', os.path.expanduser('~/Documents/Desarrollo/relevamiento-profertil'))
HTML = os.path.join(REL, 'data', 'html')
B = 'https://www.profertil.com.ar/index.php/'
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36'


class Tokens(HTMLParser):
    """Lo que hay dentro de #main, en orden: textos de encabezados y párrafos, links, imágenes e iframes."""
    def __init__(self):
        super().__init__(); self.on = False; self.out = []; self.cur = None; self.txt = ''; self.skip = 0

    def handle_starttag(self, t, a):
        a = dict(a)
        if not self.on and a.get('id') == 'main': self.on = True
        if not self.on: return
        if t in ('script', 'style', 'noscript'): self.skip += 1
        if t in ('h1', 'h2', 'h3', 'h4', 'h5', 'p', 'a'):
            self.flush(); self.cur = (t, a.get('href') or ''); self.txt = ''
        if t == 'img': self.out.append(('img', a.get('data-orig-src') or a.get('src') or '', a.get('alt') or ''))
        if t == 'iframe': self.out.append(('iframe', a.get('src') or a.get('data-src') or '', ''))

    def handle_endtag(self, t):
        if not self.on: return
        if t in ('script', 'style', 'noscript'): self.skip -= 1
        if t in ('h1', 'h2', 'h3', 'h4', 'h5', 'p', 'a'): self.flush()
        if t == 'main': self.flush(); self.on = False

    def handle_data(self, d):
        if self.on and not self.skip and self.cur: self.txt += d

    def flush(self):
        if self.cur:
            t, h = self.cur
            self.out.append((t, h, ' '.join(self.txt.split())))
        self.cur = None; self.txt = ''


def tokens(path):
    u = B + path
    f = os.path.join(HTML, hashlib.sha1(u.encode()).hexdigest()[:16] + '.html.gz')
    p = Tokens(); p.feed(gzip.open(f).read().decode('utf-8', 'ignore'))
    return p.out


def plano(t):
    return unicodedata.normalize('NFD', t).encode('ascii', 'ignore').decode().lower()


def local_pdf(url):
    """El mismo nombre que usa prep-docs.py de la Biblioteca para su copia de un PDF."""
    base = re.sub(r'[^a-z0-9._-]+', '-', plano(unquote(urlparse(url).path.split('/')[-1]))).strip('-.')
    return (re.sub(r'\.pdf$', '', base)[:80] or 'documento') + '.pdf'


MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']


def gacetillas():
    out = []
    for anio in ('2021', '2023'):
        mes = None
        for t, h, x in tokens('sala-de-prensa/gacetillas-de-prensa-' + anio):
            if t == 'h5' and re.match(r'^[A-Za-zé]+ \d{4}$', x):
                m, a = x.lower().split()
                mes = (a, MESES.index(m) + 1)
                out.append({'mes': mes, 'pdf': None, 'foto': None})
            elif t == 'a' and out and mes and h.lower().endswith('.pdf') and not out[-1]['pdf']:
                out[-1]['pdf'] = h
            elif t == 'a' and out and mes and re.search(r'\.(jpe?g|png)$', h, re.I) and not out[-1]['foto']:
                out[-1]['foto'] = h
    docs = []
    for i, g in enumerate(out):
        a, m = g['mes']
        nombre = unquote(urlparse(g['pdf']).path.split('/')[-1])
        docs.append({
            'id': 'prensa-' + re.sub(r'\.pdf$', '', local_pdf(g['pdf'])),
            'archivo': nombre,
            'c': 'prensa', 'y': a, 'm': m, 'f': '%s-%02d' % (a, m),
            'u': g['pdf'], 'l': local_pdf(g['pdf']), 'foto': g['foto'],
        })
    return docs


GALERIAS = [
    ('planta-ingeniero-white', 'Planta Ingeniero White'),
    ('terminales-norte', 'Terminales Norte'),
    ('urea-salaprensa', 'Urea'),
    ('vida-para-tierra-sala-prensa', 'Vida para nuestra tierra'),
    ('oficinas-de-buenos-aires', 'Oficinas de Buenos Aires'),
    ('profertil-en-el-campo', 'Profertil en el campo'),
]
ENLAZADAS = {'planta-ingeniero-white', 'terminales-norte', 'urea-salaprensa', 'vida-para-tierra-sala-prensa'}


def galerias():
    gal = []
    for slug, nombre in GALERIAS:
        fotos = []
        for t, src, alt in tokens('sala-de-prensa/' + slug):
            if t != 'img' or '/wp-content/uploads/' not in src or 'portada.jpg' in src or 'Web-300x300' in src or 'Sala-de-prensa-300x300' in src:
                continue
            full = re.sub(r'-\d+x\d+(\.\w+)$', r'\1', src)
            if full.startswith('/'): full = 'https://www.profertil.com.ar' + full
            full = re.sub(r'^https?://[^/]+', 'https://www.profertil.com.ar', full)
            if full not in fotos: fotos.append(full)
        gal.append({'id': re.sub(r'-?sala-?prensa|-salaprensa', '', slug), 'slug': slug, 'nombre': nombre,
                    'enlazada': slug in ENLAZADAS, 'fotos': fotos})
    return gal


def logos():
    grupos, cur = [], None
    for t, h, x in tokens('sala-de-prensa/documentos'):
        if t == 'h4' and x:
            cur = next((g for g in grupos if g['nombre'] == x), None)
            if not cur:
                cur = {'nombre': x, 'variantes': []}; grupos.append(cur)
        elif t == 'a' and cur is not None and re.search(r'\.(pdf|png|svg)$', h, re.I):
            m = re.match(r'(.*?) \((pdf|png|svg)\)$', x)
            nombre = m.group(1) if m else x
            v = next((v for v in cur['variantes'] if v['nombre'] == nombre), None)
            if not v:
                v = {'nombre': nombre, 'archivos': {}}; cur['variantes'].append(v)
            v['archivos'][h.rsplit('.', 1)[1].lower()] = h
    return [g for g in grupos if g['variantes']]


def contacto():
    toks = tokens('sala-de-prensa/profertil')
    personas, tel, mail = [], None, None
    for i, (t, h, x) in enumerate(toks):
        if t == 'h3' and x and x != 'Contacto':
            personas.append({'nombre': x, 'cargo': '', 'mail': ''})
        elif t == 'p' and personas and not personas[-1]['cargo']:
            m = re.search(r'[\w.]+@profertil\.com\.ar', x)
            personas[-1]['cargo'] = x.replace(m.group(0), '').strip() if m else x
            if m: personas[-1]['mail'] = m.group(0)
        elif t == 'a' and h.startswith('mailto:') and personas and not personas[-1]['mail'] and 'prensa@' not in h:
            personas[-1]['mail'] = h[7:]
    for t, h, x in tokens('sala-de-prensa/fotos'):
        if t == 'a' and h.lower().startswith('tel:'): tel = x
        if t == 'a' and h.startswith('mailto:prensa'): mail = h[7:]
    # Tildes que faltan en el sitio actual.
    for p in personas:
        p['cargo'] = p['cargo'].replace('Lider', 'Líder').replace('Comunicacion ', 'Comunicación ')
        # Foto de la persona: la misma del sitio actual pero en color (allá viene con el verde aplicado sobre la imagen),
        # recortada a la cara, 144 px. Vive en fotos/contacto/<usuario del mail>.webp.
        f = 'fotos/contacto/%s.webp' % p['mail'].split('@')[0]
        if os.path.exists(os.path.join(RAIZ, f)): p['foto'] = f
    bienvenida = next(x for t, h, x in toks if t == 'p' and x.startswith('Te damos'))
    return {'personas': personas, 'telefono': tel, 'mail': mail, 'bienvenida': bienvenida}


# --- Títulos y fechas ----------------------------------------------------------------------------
# El sitio actual no les pone título: solo el mes y el botón Descarga. El título es el que trae cada PDF en su primera línea, tal cual,
# pasado a oración cuando viene en mayúsculas (las siglas y los nombres propios se conservan). La fecha es la del encabezado del PDF.
TITULOS = {
    'BALANCE-2021-23-diciembre.pdf': 'Balance del 2021: un año de crecimiento para la agricultura argentina y también para Profertil',
    'Gacetilla-La-nutricion-del-maiz-27-octubre-2021.pdf': 'Las claves para una nutrición eficiente del maíz que genere mayor rendimiento',
    'Padrinazgo-UTN-29-septiembre-2021.pdf': 'Por decimotercer año Profertil firma el Convenio de Padrinazgo con la Facultad Regional Bahía Blanca de la Universidad Tecnológica Nacional',
    'Gacetilla-Lanzamiento-de-la-campana-8-septiembre-2021-.pdf': 'Arranca la nueva campaña gruesa y la inversión en tecnología tendrá un rol fundamental',
    'Gacetilla-Reporte-Sustentabilidad-2020-31-agosto-2021.pdf': 'Profertil presenta su Reporte de Sustentabilidad 2020',
    'Gacetilla-Congreso-de-AAPRESID-18-agosto-2021.pdf': 'Cuidar el suelo, eje del Congreso de AAPRESID y también del uso sustentable de los fertilizantes',
    'Gacetilla-Muvin-14-julio-2021.pdf': 'La digitalización ya impulsa un nuevo paradigma en el negocio de fertilizantes en la Argentina',
    'Gacetilla-dia-Mundial-del-Medio-Ambiente-2-junio-2021.pdf': 'Día Mundial del Medio Ambiente: la importancia de cuidar un recurso clave como el suelo',
    'Gacetilla-Educar-para-Transformar-19-mayo-2021.pdf': 'Educar para Transformar: el programa de becas de Profertil ya tiene su selección 2021',
    'Gacetilla-Maizar-PROFERTIL-19-mayo-2020.pdf': 'En el Congreso de Maizar, con las tecnologías que impulsan el maíz y la sustentabilidad',
    'Gacetilla-El-trigo-arranca-con-viento-a-favor-29-abril-2021.pdf': 'Con buena humedad y altos precios, se viene con fuerza la siembra de trigo',
    'Dia-Internacional-de-los-Fertilizantes.pdf': 'Los fertilizantes, un recurso estratégico para la alimentación mundial y para la sostenibilidad del sistema productivo',
    'Profertil-dice-presente-en-AAPRESID-.pdf': 'Profertil dice presente en AAPRESID para conversar sobre huella de carbono en la siembra directa',
    'DIA-DEL-MEDIOAMBIENTE.pdf': 'Día del Medioambiente: Profertil reafirma su compromiso histórico con el cuidado de los recursos naturales',
    'PROFERTIL-DESTACA-EL-ROL-DE-ARGENTINA-EN-LA-INDUSTRIA-MUNDIAL-DE-LOS-FERTILIZANTES.pdf': 'Profertil destaca el rol de Argentina en la industria mundial de los fertilizantes',
    'PROFERTIL-PARTICIPA-DEL-SIMPOSIO-FERTILIDAD-2023.pdf': 'Profertil participa del Simposio Fertilidad 2023',
    'ALZBETA-KLEIN-VISITO-PROFERTIL.pdf': 'Alzbeta Klein, CEO de la Asociación Internacional de Fertilizantes, visitó Profertil',
}
DIAS = {'Padrinazgo-UTN-29-septiembre-2021.pdf': 29}
MES_RE = '|'.join(['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'])


def titular(d):
    t = d.get('texto', '')
    m = re.search(r'(Bah[ií]a Blanca|Ingeniero White|Rosario)[,.]?\s*(?:(?:lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)\s+)?(\d{1,2})\s+de\s+(' + MES_RE + ')', t, re.I)
    tit = re.sub(r'\s*PROFERTIL informa a (sus vecinos|la comunidad)\s*$', '', t[:m.start()].strip() if m else '').rstrip('.')
    if tit.isupper(): tit = tit[0] + tit[1:].lower()
    d['c'] = None
    d['t'] = TITULOS.get(d['archivo']) or tit or d['archivo']
    dia = DIAS.get(d['archivo']) or (int(m.group(2)) if m and MESES[d['m'] - 1] == m.group(3).lower() else None)
    if dia: d['dia'] = dia
    # Tipo (el de la etiqueta, como en Novedades), por lo que dice el propio PDF: los avisos a los vecinos sobre la planta llevan "Información para la comunidad" o "Novedades de planta".
    d['tipo'] = 'aviso' if re.match(r'(informaci[oó]n para la comunidad|novedades de planta)', d['t'], re.I) else 'gacetilla'
    d['c'] = d['tipo']


# --- Bajar -------------------------------------------------------------------------------------------
def curl(url, dest):
    tmp = dest + '.parte'
    r = subprocess.run(['curl', '-sSfL', '--retry', '3', '-A', UA, '-o', tmp, url])
    if r.returncode == 0 and os.path.getsize(tmp) > 0:
        os.replace(tmp, dest); return True
    if os.path.exists(tmp): os.remove(tmp)
    print('  falla', url); return False


def webp(src, dest, ancho, q=82):
    w = int(subprocess.run(['sips', '-g', 'pixelWidth', src], capture_output=True, text=True).stdout.split()[-1])
    achicar = ['-resize', str(ancho), '0'] if w > ancho else []
    r = subprocess.run(['cwebp', '-quiet', '-q', str(q), '-metadata', 'none', *achicar, src, '-o', dest])
    if r.returncode:
        png = src + '.png'
        subprocess.run(['sips', '-s', 'format', 'png', src, '--out', png], capture_output=True)
        subprocess.run(['cwebp', '-quiet', '-q', str(q), '-metadata', 'none', *achicar, png, '-o', dest], check=True)
        os.remove(png)


def medidas(ruta):
    o = subprocess.run(['sips', '-g', 'pixelWidth', '-g', 'pixelHeight', ruta], capture_output=True, text=True).stdout
    return [int(re.search(r'pixelWidth: (\d+)', o).group(1)), int(re.search(r'pixelHeight: (\d+)', o).group(1))]


def main():
    bajar = '--bajar' in sys.argv
    datos = {'gacetillas': gacetillas(), 'galerias': galerias(), 'logos': logos(), 'contacto': contacto()}
    if bajar:
        for d in datos['gacetillas']:
            dest = os.path.join(PDF_DIR, d['l'])
            if not os.path.exists(dest): curl(d['u'], dest)
            # La foto que acompaña a algunas gacetillas: copia chica para la vista de miniaturas.
            mini = os.path.join(RAIZ, 'fotos', 'gacetillas', d['id'] + '.webp')
            if d['foto'] and not os.path.exists(mini):
                os.makedirs(os.path.dirname(mini), exist_ok=True)
                with tempfile.TemporaryDirectory() as td:
                    t = os.path.join(td, 'f' + os.path.splitext(urlparse(d['foto']).path)[1])
                    if curl(d['foto'], t): webp(t, mini, 720, 78)
        for g in datos['galerias']:
            carpeta = os.path.join(RAIZ, 'fotos', g['id']); os.makedirs(carpeta, exist_ok=True)
            for i, u in enumerate(g['fotos'], 1):
                grande, mini = os.path.join(carpeta, '%02d.webp' % i), os.path.join(carpeta, '%02d-mini.webp' % i)
                if os.path.exists(grande) and os.path.exists(mini): continue
                with tempfile.TemporaryDirectory() as td:
                    t = os.path.join(td, 'f' + os.path.splitext(urlparse(u).path)[1])
                    if curl(u, t):
                        webp(t, grande, 2000); webp(t, mini, 720, 78)
        for gr in datos['logos']:
            for v in gr['variantes']:
                for ext, u in v['archivos'].items():
                    dest = os.path.join(RAIZ, 'logos', unquote(urlparse(u).path.split('/')[-1]))
                    os.makedirs(os.path.dirname(dest), exist_ok=True)
                    if not os.path.exists(dest): curl(u, dest)
    # Lo que quedó en disco: copias locales y medidas de las fotos.
    for d in datos['gacetillas']:
        if not os.path.exists(os.path.join(PDF_DIR, d['l'])): d.pop('l')
        else:
            txt = subprocess.run(['pdftotext', '-l', '1', '-layout', os.path.join(PDF_DIR, d['l']), '-'], capture_output=True, text=True).stdout
            d['texto'] = ' '.join(txt.split())[:600]
        titular(d)
        if os.path.exists(os.path.join(RAIZ, 'fotos', 'gacetillas', d['id'] + '.webp')): d['fm'] = 'fotos/gacetillas/' + d['id'] + '.webp'
    for g in datos['galerias']:
        g['f'] = []
        for i, u in enumerate(g['fotos'], 1):
            mini = os.path.join(RAIZ, 'fotos', g['id'], '%02d-mini.webp' % i)
            if os.path.exists(mini):
                g['f'].append({'n': '%02d' % i, 'u': u, 'mi': medidas(mini), 'gr': medidas(mini.replace('-mini', ''))})
        del g['fotos']
    for gr in datos['logos']:
        for v in gr['variantes']:
            v['archivos'] = {ext: ('logos/' + unquote(urlparse(u).path.split('/')[-1])) if os.path.exists(os.path.join(RAIZ, 'logos', unquote(urlparse(u).path.split('/')[-1]))) else u
                             for ext, u in v['archivos'].items()}
    json.dump(datos, open(os.path.join(AQUI, 'prensa.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('gacetillas', len(datos['gacetillas']), '· fotos', sum(len(g['f']) for g in datos['galerias']),
          '· logos', sum(len(g['variantes']) for g in datos['logos']), '· con foto', sum(1 for d in datos['gacetillas'] if d.get('fm')))


main()
