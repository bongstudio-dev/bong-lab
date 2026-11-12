"""Arma el índice del buscador del sitio (../indice.json) con lo que ya existe en la maqueta.

  python3 profertil/buscador/fuente/indice.py            # documentos, notas y páginas (pide el mapa a la API)
  python3 profertil/buscador/fuente/indice.py --sin-red  # conserva las páginas del índice anterior

Cada tipo de contenido es un grupo con su nombre, su lista y sus ítems. Un ítem es [título, url, resumen]:
la url es relativa a profertil/ (la carpeta de la maqueta) o absoluta si apunta al sitio actual.
Para sumar un tipo nuevo: escribir una función que devuelva sus ítems y agregarla a GRUPOS, abajo.
"""
import json, os, sys, urllib.request

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.normpath(os.path.join(AQUI, '..', '..'))   # profertil/
SALIDA = os.path.join(AQUI, '..', 'indice.json')
API_MAPA = 'https://entregables.bongstudio.ar/api/arquitectura'
RESUMEN_MAX = 140


def leer(ruta):
    with open(os.path.join(RAIZ, ruta), encoding='utf-8') as f:
        return json.load(f)


def corto(s, n=RESUMEN_MAX):
    s = ' '.join((s or '').split())
    if len(s) <= n:
        return s
    return s[:n].rsplit(' ', 1)[0].rstrip(',.;') + '…'


# --- Documentos: los PDF de la biblioteca (biblioteca/fuente/docs.json) ---
CATEGORIAS = {'cereales': 'Cereales', 'oleaginosas': 'Oleaginosas', 'pasturas': 'Pasturas', 'industriales': 'Industriales',
              'msds': 'Hojas de seguridad', 'inversores': 'Inversores', 'biblioteca': 'Biblioteca'}


def documentos():
    docs = leer('biblioteca/fuente/docs.json')['docs']
    docs.sort(key=lambda d: d['t'].lower())
    return [[d['t'], 'biblioteca/ver/?d=' + d['id'], ' · '.join(x for x in [CATEGORIAS.get(d['c'], ''), d.get('y', '')] if x)]
            for d in docs]


# --- Notas de Novedades (novedades/fuente/notas.json), de la más reciente a la más vieja ---
TIPOS = {'institucional': 'Institucional', 'comercial': 'Comercial', 'somos': 'Somos Profertil', 'tecnico': 'Artículo técnico',
         'aviso': 'Aviso a la comunidad', 'financiera': 'Gacetilla financiera'}


# La sección de WordPress, si la hay, manda sobre el tipo (igual que en Novedades).
DESDE_WP = {'comunicacion-institucional': 'institucional', 'comunicacion-comercial': 'comercial', 'somos-profertil': 'somos'}


def notas():
    ns = leer('novedades/fuente/notas.json')
    ns.sort(key=lambda n: n.get('f', ''), reverse=True)
    out = []
    for n in ns:
        tp = DESDE_WP.get(n.get('s')) or n.get('tp')
        meta = ' · '.join(x for x in [TIPOS.get(tp, ''), (n.get('f') or '')[:4]] if x)
        bajada = corto(n.get('b') or '')
        out.append([n['t'], 'novedades/nota/?n=' + n['ar'], meta + (' · ' + bajada if bajada else '')])
    return out


# --- Páginas: los nodos de tipo "pagina" del mapa de arquitectura v0 ---
# Las que ya tienen maqueta llevan a ella; el resto, a su dirección del sitio actual.
EN_MAQUETA = {'Novedades': 'novedades/'}
RAICES_SIN_RUTA = {'Navegación principal'}   # el menú principal no se nombra como ruta


def paginas():
    pedido = urllib.request.Request(API_MAPA, headers={'User-Agent': 'Mozilla/5.0 (indice-buscador)', 'Accept': 'application/json'})
    with urllib.request.urlopen(pedido, timeout=20) as r:
        mapa = json.load(r)['doc']
    out = []

    def recorrer(n, ruta):
        if n.get('tipo') == 'pagina':
            url = EN_MAQUETA.get(n['nombre']) or (n.get('urls') or [''])[0]
            if url:
                out.append([n['nombre'], url, ' · '.join(ruta) or 'Menú principal'])
        sub = ruta if (not ruta and n['nombre'] in RAICES_SIN_RUTA) else ruta + [n['nombre']]
        for h in n.get('hijos', []):
            recorrer(h, sub)

    for r in mapa['roots']:
        recorrer(r, [])
    return out


# id, nombre del grupo, singular, plural, artículo del plural, lista con la búsqueda aplicada (vacío: el panel muestra todos), fuente
GRUPOS = [
    ('documentos', 'Biblioteca', 'documento', 'documentos', 'los', 'biblioteca/#q=', documentos),
    ('notas', 'Notas', 'nota', 'notas', 'las', 'novedades/#q=', notas),
    ('paginas', 'Páginas', 'página', 'páginas', 'las', '', paginas),
]


def main():
    sin_red = '--sin-red' in sys.argv
    previo = {}
    if os.path.exists(SALIDA):
        previo = {g['id']: g for g in json.load(open(SALIDA, encoding='utf-8'))['grupos']}
    grupos = []
    for gid, nombre, uno, varios, art, lista, fuente in GRUPOS:
        if sin_red and fuente is paginas:
            items = previo.get(gid, {}).get('items', [])
        else:
            items = fuente()
        grupos.append({'id': gid, 'nombre': nombre, 'uno': uno, 'varios': varios, 'art': art, 'lista': lista, 'items': items})
        print('%-11s %4d' % (gid, len(items)))
    with open(SALIDA, 'w', encoding='utf-8') as f:
        json.dump({'v': 1, 'grupos': grupos}, f, ensure_ascii=False, separators=(',', ':'))
    print('indice.json', os.path.getsize(SALIDA), 'bytes')


if __name__ == '__main__':
    main()
