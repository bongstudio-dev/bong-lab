"""Baja del mapa de arquitectura las páginas que suma el buscador del sitio (paginas.json).

  python3 profertil/buscador/fuente/indice.py

El índice completo (../indice.json, con documentos, hojas, gacetillas, notas y páginas) se arma en el build del sitio
(src/pages/profertil/buscador/indice.json.ts) con los mismos datos que las páginas. Este script solo trae del mapa los
nodos de tipo "pagina": correrlo cuando cambia el mapa de arquitectura y después volver a armar el sitio.
Cada ítem es [título, url, resumen]: la url es relativa a profertil/ si la página ya tiene maqueta, o la del sitio actual.
"""
import json, os, urllib.request

AQUI = os.path.dirname(os.path.abspath(__file__))
SALIDA = os.path.join(AQUI, 'paginas.json')
API_MAPA = 'https://entregables.bongstudio.ar/api/arquitectura'

# Las que ya tienen maqueta llevan a ella; el resto, a su dirección del sitio actual.
EN_MAQUETA = {'Novedades': 'novedades/', 'Sala de prensa': 'sala-de-prensa/'}
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


if __name__ == '__main__':
    items = paginas()
    with open(SALIDA, 'w', encoding='utf-8') as f:
        json.dump({'items': items}, f, ensure_ascii=False, indent=1)
    print('paginas.json', len(items), 'páginas')
