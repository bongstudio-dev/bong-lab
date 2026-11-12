#!/usr/bin/env python3
"""Arma docs.json: los documentos (título + PDF) del sitio actual de Profertil, desde el crawl.

Entrada: urls.csv del relevamiento (URLS_CSV, por defecto el del repo de relevamiento).
Salida:  tres archivos, uno por página del sitio nuevo, y con --bajar copias de una muestra en ../pdf/.
  docs.json             la Biblioteca Virtual (cereales, oleaginosas, pasturas, industriales, biblioteca)
  docs-msds.json        las hojas de seguridad
  docs-inversores.json  los informes para inversores

Qué es un documento acá: una página en español de las secciones de biblioteca, cuyo único
contenido es un título y un PDF colgado (cantidad_descargas = 1). La categoría es la sección
que declara la URL; no se inventa ninguna otra.

  python3 profertil/documentos/fuente/prep-docs.py            # solo los tres .json
  python3 profertil/documentos/fuente/prep-docs.py --bajar    # además baja la muestra de PDF
"""
import csv, json, os, re, subprocess, sys, time, unicodedata
from urllib.parse import urlparse, unquote
from concurrent.futures import ThreadPoolExecutor

AQUI = os.path.dirname(os.path.abspath(__file__))
URLS = os.environ.get('URLS_CSV', os.path.expanduser('~/Documents/Desarrollo/relevamiento-profertil/output/urls.csv'))

# Sección de la URL -> categoría. "inversores-es" es el mismo menú de Inversores en otra rama.
SECCIONES = {
    'cereales': 'cereales', 'oleaginosas': 'oleaginosas', 'pasturas': 'pasturas', 'industriales': 'industriales',
    'msds': 'msds', 'inversores': 'inversores', 'inversores-es': 'inversores', 'biblioteca': 'biblioteca',
}
# Cada página del sitio nuevo con su archivo de datos. Lo que no es msds ni inversores es Biblioteca.
ARCHIVOS = {'msds': 'docs-msds.json', 'inversores': 'docs-inversores.json'}
BIBLIOTECA = 'docs.json'
SIGLAS = ['MSDS', 'UAN', 'CNV', 'NPK', 'PDF', 'INTA', 'BT', 'ETP', 'MPM', 'II', 'III', 'IV', 'VI', 'VII', 'VIII', 'IX', 'XI', 'XII', 'CFP', 'ISO', 'CO2', 'N', 'P', 'S', 'K', 'US$']


def limpiar(t):
    t = re.sub(r'\s+', ' ', t).strip()
    t = re.sub(r'\s*-\s*Profertil$', '', t, flags=re.I).strip()
    letras = [c for c in t if c.isalpha()]
    if letras and sum(c.isupper() for c in letras) / len(letras) > 0.6:
        t = t.lower()
        t = t[:1].upper() + t[1:]
        t = re.sub(r'\b(' + '|'.join(re.escape(s) for s in SIGLAS) + r')\b', lambda m: m.group(1).upper(), t, flags=re.I)
        t = re.sub(r'\bprofertil\b', 'Profertil', t, flags=re.I)
        t = re.sub(r'\benetotal\b', 'eNeTOTAL', t, flags=re.I)
    return t


def anio_de(titulo, fecha):
    """Año del documento: el que dice su título; si no, el de publicación salvo la carga masiva de 2020."""
    m = re.findall(r'(?<!\d)(19[89]\d|20[0-2]\d)(?!\d)', titulo)
    if m:
        return m[-1]
    if fecha and fecha[:4] not in ('', '2020'):
        return fecha[:4]
    return ''


def plano(s):
    return unicodedata.normalize('NFD', s).encode('ascii', 'ignore').decode().lower()


def main():
    filas = list(csv.DictReader(open(URLS, encoding='utf-8-sig')))
    docs, vistos = [], set()
    for x in filas:
        if x['status_code'] != '200' or x['idioma'] != 'es' or x['tiene_descargas'] != 'si' or x['cantidad_descargas'] != '1':
            continue
        p = [q for q in urlparse(x['url']).path.split('/') if q]
        if p and p[0] == 'index.php':
            p = p[1:]
        if not p or p[0] not in SECCIONES:
            continue
        pdf = x['descargas'].strip()
        slug = p[-1]
        i = slug
        if i in vistos:
            i = p[0] + '-' + slug
        vistos.add(i)
        t = limpiar(x['title'])
        docs.append({
            'id': i, 't': t, 'c': SECCIONES[p[0]], 'y': anio_de(t, x['fecha_publicacion']),
            'f': x['fecha_publicacion'], 'u': pdf, 's': x['url'],
        })
    # Una misma página puede aparecer en dos ramas (Inversores): se queda una sola, por PDF + título.
    unicos, clave = [], set()
    for d in docs:
        k = (d['u'], plano(d['t']))
        if k in clave:
            continue
        clave.add(k)
        unicos.append(d)
    docs = sorted(unicos, key=lambda d: plano(d['t']))
    print(len(docs), 'documentos')

    # Muestra local: se necesita porque profertil.com.ar no manda cabeceras CORS y pdf.js no puede leer PDF de otro dominio.
    if '--bajar' in sys.argv:
        muestra = elegir_muestra(docs)
        carpeta = os.path.join(AQUI, '..', 'pdf')
        os.makedirs(carpeta, exist_ok=True)
        for d in muestra:
            dest = os.path.join(carpeta, d['id'][:80] + '.pdf')
            if not os.path.exists(dest):
                subprocess.run(['curl', '-sL', '--max-time', '60', '-o', dest, d['u']], check=False)
            # Algunos PDF del sitio llegan con saltos de línea antes de %PDF: los lectores lo toleran.
            ok = os.path.exists(dest) and b'%PDF-' in open(dest, 'rb').read(1024)
            if ok:
                for e in docs:
                    if e['id'] == d['id']:
                        e['l'] = d['id'][:80] + '.pdf'
            elif os.path.exists(dest):
                os.remove(dest)
        print(sum(1 for d in docs if d.get('l')), 'copias locales')
    else:
        # Conserva las copias locales ya bajadas, estén en el archivo que estén.
        l = {}
        for f in [BIBLIOTECA] + list(ARCHIVOS.values()):
            previo = os.path.join(AQUI, f)
            if os.path.exists(previo):
                l.update({d['id']: d['l'] for d in json.load(open(previo, encoding='utf-8'))['docs'] if d.get('l')})
        for d in docs:
            if d['id'] in l:
                d['l'] = l[d['id']]

    partes = {BIBLIOTECA: []}
    for f in ARCHIVOS.values():
        partes[f] = []
    for d in docs:
        partes[ARCHIVOS.get(d['c'], BIBLIOTECA)].append(d)
    for f, lst in partes.items():
        json.dump({'docs': lst}, open(os.path.join(AQUI, f), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
        print('  %-22s %d' % (f, len(lst)))


def peso(url):
    # Pocos pedidos a la vez y un reintento: el servidor corta si se le pide de a muchos.
    for _ in range(2):
        r = subprocess.run(['curl', '-sIL', '--max-time', '20', url], capture_output=True, text=True).stdout
        m = re.findall(r'(?im)^content-length:\s*(\d+)', r)
        if m:
            return int(m[-1])
        time.sleep(1.5)
    return 0


def elegir_muestra(docs):
    """~36 documentos que cubran categorías y años, sin PDF de más de 3,5 MB."""
    import random
    random.seed(7)
    por = {}
    for d in docs:
        por.setdefault(d['c'], []).append(d)
    cupo = {'cereales': 12, 'oleaginosas': 6, 'pasturas': 4, 'industriales': 3, 'msds': 4, 'inversores': 5, 'biblioteca': 2}
    cand = []
    for c, n in cupo.items():
        lst = por.get(c, [])
        random.shuffle(lst)
        cand += lst[:n * 3]
    with ThreadPoolExecutor(2) as ex:
        pesos = list(ex.map(lambda d: peso(d['u']), cand))
    res, cuenta = [], {}
    for d, p in zip(cand, pesos):
        if p == 0 or p > 3_500_000:
            continue
        if cuenta.get(d['c'], 0) >= cupo[d['c']]:
            continue
        cuenta[d['c']] = cuenta.get(d['c'], 0) + 1
        res.append(d)
    return res


if __name__ == '__main__':
    main()
