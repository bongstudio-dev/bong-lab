#!/usr/bin/env python3
"""Arma etiquetas.json: las etiquetas de la Biblioteca Virtual del sitio actual (cultivo, zona, año, nutriente) por documento.

La portada de la Biblioteca Virtual tiene una "Búsqueda por categoría": cada opción es un link a una página que
lista los documentos con esa etiqueta (con paginación). Este script lee la portada, toma los grupos y las opciones
en el orden en que el sitio las muestra, recorre cada página y cruza lo que lista con docs.json por dirección.
Las entradas que no son documentos de la Biblioteca (fichas de producto, noticias) se ignoran.

  python3 profertil/biblioteca/fuente/prep-etiquetas.py

Salida: etiquetas.json con
  grupos: [{id, nombre, opciones: [{id, nombre, sub?}]}]   en el orden de la portada
  docs:   {id_documento: {cultivo: [...], zona: [...], anio: [...], nutriente: [...]}}
  fuera:  entradas que son documentos pero no están en docs.json (para revisar)

El servidor corta si se le pide de a muchos: dos pedidos a la vez y reintento.
CACHE (variable de entorno) guarda el HTML bajado para no volver a pedirlo.
"""
import html, json, os, re, subprocess, sys, time, unicodedata
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import urlparse

AQUI = os.path.dirname(os.path.abspath(__file__))
PORTADA = 'https://www.profertil.com.ar/index.php/sostenibilidad/agricultura-sustentable/biblioteca-virtual'
CACHE = os.environ.get('CACHE', '')
SECCIONES_DOC = {'cereales', 'oleaginosas', 'pasturas', 'industriales', 'biblioteca', 'msds', 'inversores', 'inversores-es'}

# Los encabezados de la portada, tal como aparecen, y el grupo de filtro al que pertenecen.
# Cereales, Oleaginosas, Industriales y Pasturas son subtítulos del mismo bloque de cultivos;
# Provincia agrupa provincias con sus localidades.
GRUPOS = [('cultivo', 'Cultivo'), ('zona', 'Zona'), ('anio', 'Año'), ('nutriente', 'Nutriente')]
ENCABEZADO = {'CEREALES': 'cultivo', 'OLEAGINOSAS': 'cultivo', 'INDUSTRIALES': 'cultivo', 'PASTURAS': 'cultivo',
              'PROVINCIA': 'zona', 'AÑO': 'anio', 'NUTRIENTES': 'nutriente'}


def bajar(url):
    if CACHE:
        os.makedirs(CACHE, exist_ok=True)
        f = os.path.join(CACHE, re.sub(r'[^a-z0-9]+', '_', url.lower())[-150:] + '.html')
        if os.path.exists(f):
            return open(f, encoding='utf-8').read()
    for intento in range(4):
        r = subprocess.run(['curl', '-sL', '--max-time', '60', '-A', 'Mozilla/5.0', '-w', '\n%{http_code}', url],
                           capture_output=True, text=True, errors='replace')
        cuerpo, _, cod = r.stdout.rpartition('\n')
        if cod == '200' and len(cuerpo) > 2000:
            if CACHE:
                open(f, 'w', encoding='utf-8').write(cuerpo)
            return cuerpo
        if cod == '404':
            return ''
        time.sleep(2 + intento * 3)
    print('  no se pudo bajar', url, file=sys.stderr)
    return ''


def texto(s):
    return html.unescape(re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', s))).strip()


def leer_portada():
    s = bajar(PORTADA)
    i = s.find('Búsqueda por categoría')
    j = s.find('SEDES', i)
    s = s[i:j]
    opciones = {g: [] for g, _ in GRUPOS}
    grupo, sub = None, None
    # Recorre encabezados y links en orden.
    for m in re.finditer(r'<h([4-5])[^>]*>(.*?)</h\1>|<a [^>]*href="([^"]*biblioteca-virtual/[^"]*)"[^>]*>(.*?)</a>', s, re.S):
        if m.group(1):
            t = texto(m.group(2))
            if m.group(1) == '5':
                clave = next((k for k in ENCABEZADO if t.upper().startswith(k) or k in t.upper()), None)
                if clave:
                    grupo = ENCABEZADO[clave]
                    sub = t.title() if grupo == 'cultivo' else None
            elif m.group(1) == '4' and grupo == 'zona':
                sub = t
            continue
        if not grupo:
            continue
        url, nombre = m.group(3), texto(m.group(4))
        slug = [p for p in urlparse(url).path.split('/') if p]
        slug = slug[slug.index('biblioteca-virtual') + 1]
        # El id es el slug sin el "-2" que WordPress agrega cuando el nombre ya existe (2015-2, girasol-2).
        oid = re.sub(r'-2$', '', slug)
        if nombre.startswith('Todas las localidades de '):
            nombre = nombre[len('Todas las localidades de '):]
            op = {'id': oid, 'slug': slug, 'nombre': nombre, 'url': url, 'provincia': True}
        else:
            op = {'id': oid, 'slug': slug, 'nombre': nombre, 'url': url}
        if sub:
            op['sub'] = sub
        opciones[grupo].append(op)
    return opciones


def ruta(url):
    p = [q for q in urlparse(url).path.split('/') if q]
    if p and p[0] == 'index.php':
        p = p[1:]
    return '/'.join(p)


def entradas(op):
    """Las entradas (h2/h3 con link) de la página de una opción y sus páginas siguientes."""
    url, vistas, res = op['url'], set(), []
    # El link de la portada a veces ya trae /page/N/ (P apunta a la segunda página): se empieza por la primera.
    url = re.sub(r'/page/\d+/?$', '/', url)
    # Los links de la portada usan /sustentabilidad/, que para Maíz, Soja, Arroz y Caña redirige a páginas de productos.
    # La ruta /sostenibilidad/ es la que lista los documentos de cada opción.
    url = url.replace('/sustentabilidad/', '/sostenibilidad/')
    while url and url not in vistas:
        vistas.add(url)
        s = bajar(url)
        if not s:
            break
        for m in re.finditer(r'<h[23][^>]*>\s*<a [^>]*href="([^"]+)"', s):
            res.append(m.group(1))
        n = re.search(r'rel="next" href="([^"]+)"', s)
        url = n.group(1) if n else None
    return res


def main():
    # Se cruza contra los tres archivos: si una opción listara una hoja de seguridad o un informe, se ve en el reporte.
    docs = []
    for f in ('docs.json', 'docs-msds.json', 'docs-inversores.json'):
        if os.path.exists(os.path.join(AQUI, f)):
            docs += json.load(open(os.path.join(AQUI, f), encoding='utf-8'))['docs']
    por_ruta = {ruta(d['s']): d['id'] for d in docs}
    por_slug = {}
    for d in docs:
        por_slug.setdefault(ruta(d['s']).split('/')[-1], []).append(d['id'])

    opciones = leer_portada()
    todas = [(g, op) for g, _ in GRUPOS for op in opciones[g]]
    print(len(todas), 'opciones en la portada:', {g: len(opciones[g]) for g, _ in GRUPOS})
    with ThreadPoolExecutor(2) as ex:
        listas = list(ex.map(lambda x: entradas(x[1]), todas))

    etiquetas, fuera, otras = {}, {}, 0
    for (g, op), lst in zip(todas, listas):
        n = 0
        for u in dict.fromkeys(lst):
            r = ruta(u)
            if r.split('/')[0] not in SECCIONES_DOC:
                otras += 1
                continue
            i = por_ruta.get(r)
            if not i:
                cand = por_slug.get(r.split('/')[-1], [])
                i = cand[0] if len(cand) == 1 else None
            if not i:
                fuera.setdefault(u, []).append(op['id'])
                continue
            e = etiquetas.setdefault(i, {})
            if op['id'] not in e.setdefault(g, []):
                e[g].append(op['id'])
            n += 1
        op['n'] = n
        print('  %-10s %-28s %4d' % (g, op['id'], n))

    for g, _ in GRUPOS:
        for op in opciones[g]:
            op.pop('url', None)
    out = {
        'fuente': PORTADA,
        'grupos': [{'id': g, 'nombre': nombre, 'opciones': opciones[g]} for g, nombre in GRUPOS],
        'docs': dict(sorted(etiquetas.items())),
        'fuera': fuera,
    }
    json.dump(out, open(os.path.join(AQUI, 'etiquetas.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    bib = [d for d in docs if d['c'] not in ('msds', 'inversores')]
    print(len(bib), 'documentos en la Biblioteca;', sum(1 for d in bib if d['id'] in etiquetas), 'con alguna etiqueta')
    for g, _ in GRUPOS:
        print('  %-10s %d con etiqueta, %d sin clasificar' % (g, sum(1 for d in bib if etiquetas.get(d['id'], {}).get(g)),
                                                       sum(1 for d in bib if not etiquetas.get(d['id'], {}).get(g))))
    print(len(etiquetas), 'documentos con alguna etiqueta;', len(fuera), 'entradas de documento sin par en docs.json;',
          otras, 'entradas que no son documentos')


if __name__ == '__main__':
    main()
