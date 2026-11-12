#!/usr/bin/env python3
"""Arma docs.json: los documentos (título + PDF) del sitio actual de Profertil, desde el crawl.

Entrada: urls.csv del relevamiento (URLS_CSV, por defecto el del repo de relevamiento).
Salida:  tres archivos, uno por página del sitio nuevo, y con --bajar la copia de todos los PDF en ../pdf/.
  docs.json             la Biblioteca Virtual (cereales, oleaginosas, pasturas, industriales, biblioteca)
  docs-msds.json        las hojas de seguridad
  docs-inversores.json  los informes para inversores

Qué es un documento acá: una página en español de las secciones de biblioteca, cuyo único
contenido es un título y un PDF colgado (cantidad_descargas = 1). La categoría es la sección
que declara la URL; no se inventa ninguna otra.

  python3 profertil/biblioteca/fuente/prep-docs.py            # solo los tres .json
  python3 profertil/biblioteca/fuente/prep-docs.py --bajar    # además baja los PDF que falten (conserva los ya bajados)
"""
import csv, json, os, re, subprocess, sys, time, unicodedata
from urllib.parse import urlparse, unquote
from concurrent.futures import ThreadPoolExecutor

AQUI = os.path.dirname(os.path.abspath(__file__))
CARPETA = os.path.join(AQUI, '..', 'pdf')
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

    # Copia local de cada PDF: profertil.com.ar no manda cabeceras CORS y pdf.js no puede leer PDF de otro dominio.
    # Un archivo por dirección de PDF, aunque cuelgue de varias páginas.
    nombres = nombres_locales(docs)
    if '--bajar' in sys.argv:
        bajar_todos(nombres)
    for d in docs:
        d.pop('l', None)
        if valido(os.path.join(CARPETA, nombres[d['u']])):
            d['l'] = nombres[d['u']]
    print(sum(1 for d in docs if d.get('l')), 'documentos con copia local,', len({d['u'] for d in docs if d.get('l')}), 'PDF')

    partes = {BIBLIOTECA: []}
    for f in ARCHIVOS.values():
        partes[f] = []
    for d in docs:
        partes[ARCHIVOS.get(d['c'], BIBLIOTECA)].append(d)
    for f, lst in partes.items():
        json.dump({'docs': lst}, open(os.path.join(AQUI, f), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
        print('  %-22s %d' % (f, len(lst)))


def nombres_locales(docs):
    """Nombre de archivo de cada PDF: el de su dirección, en minúsculas y sin caracteres raros.
    Si dos direcciones distintas dan el mismo nombre, la segunda lleva -2, la tercera -3, y así."""
    nombres, usados = {}, set()
    for u in sorted({d['u'] for d in docs}):
        partes = [q for q in urlparse(u).path.split('/') if q]
        base = re.sub(r'[^a-z0-9._-]+', '-', plano(unquote(partes[-1]))).strip('-.')
        base = re.sub(r'\.pdf$', '', base)[:80] or 'documento'
        n, k = base + '.pdf', 1
        while n in usados:
            k += 1
            n = '%s-%d.pdf' % (base, k)
        usados.add(n)
        nombres[u] = n
    return nombres


def valido(ruta):
    # Algunos PDF del sitio llegan con saltos de línea antes de %PDF: se mira el primer KB.
    if not os.path.exists(ruta):
        return False
    with open(ruta, 'rb') as f:
        return b'%PDF-' in f.read(1024)


def bajar(u, dest):
    """Baja un PDF a un archivo temporal y lo deja solo si llegó entero y es PDF. Tres intentos."""
    tmp = dest + '.parcial'
    for i in range(3):
        r = subprocess.run(['curl', '-sfL', '--retry', '2', '--max-time', '600', '-o', tmp, u], capture_output=True, text=True)
        if r.returncode == 0 and valido(tmp):
            os.replace(tmp, dest)
            return 'ok'
        if os.path.exists(tmp):
            os.remove(tmp)
        if r.returncode == 22:   # el servidor respondió con error (404, por ejemplo): no tiene sentido insistir
            return 'error del servidor'
        time.sleep(3 * (i + 1))
    return 'no se pudo bajar (código %d)' % r.returncode if r.returncode else 'no es un PDF'


def bajar_todos(nombres):
    """Conserva lo ya bajado; baja el resto con dos pedidos a la vez (el servidor corta si se le pide de a muchos)."""
    os.makedirs(CARPETA, exist_ok=True)
    faltan = [(u, n) for u, n in nombres.items() if not valido(os.path.join(CARPETA, n))]
    print(len(nombres) - len(faltan), 'PDF ya estaban;', len(faltan), 'por bajar')
    hechos = [0]

    def uno(par):
        u, n = par
        res = bajar(u, os.path.join(CARPETA, n))
        hechos[0] += 1
        if hechos[0] % 25 == 0:
            print('  ', hechos[0], 'de', len(faltan), flush=True)
        return u, res

    with ThreadPoolExecutor(2) as ex:
        fallos = [(u, r) for u, r in ex.map(uno, faltan) if r != 'ok']
    # Copias que ya no corresponden a ningún documento.
    sobran = set(os.listdir(CARPETA)) - set(nombres.values())
    for n in sobran:
        os.remove(os.path.join(CARPETA, n))
    if sobran:
        print(len(sobran), 'archivos sobrantes borrados')
    print(len(fallos), 'fallos')
    for u, r in fallos:
        print('   ', r, u)


if __name__ == '__main__':
    main()
