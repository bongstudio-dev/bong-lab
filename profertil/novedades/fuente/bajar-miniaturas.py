"""Miniaturas de las tarjetas de Novedades: copia local de la foto de cada nota.

Baja la foto principal de cada nota del sitio actual (la grande si hay), la
achica a WebP de 720 px de ancho y la guarda en ../fotos/mini/<ar>.webp. En
notas.json le suma a cada nota `mi`: [ancho, alto] de la miniatura, que la
tarjeta usa para reservar el lugar. Sin `mi`, la tarjeta usa el arte.

Se puede correr las veces que haga falta: solo baja lo que falta.

    python3 profertil/novedades/fuente/bajar-miniaturas.py
    npm run build      # rearma el sitio con las fotos nuevas
"""
import json, os, struct, subprocess, sys, tempfile, urllib.parse
from concurrent.futures import ThreadPoolExecutor

AQUI = os.path.dirname(os.path.abspath(__file__))
JSON = os.path.join(AQUI, 'notas.json')
CARPETA = os.path.join(AQUI, '..', 'fotos', 'mini')
ANCHO, CALIDAD = 720, 70


def medidas_webp(ruta):
    with open(ruta, 'rb') as f:
        d = f.read(30)
    if d[12:16] == b'VP8X':
        return 1 + int.from_bytes(d[24:27], 'little'), 1 + int.from_bytes(d[27:30], 'little')
    if d[12:16] == b'VP8L':
        b = int.from_bytes(d[21:25], 'little')
        return (b & 0x3FFF) + 1, ((b >> 14) & 0x3FFF) + 1
    w, h = struct.unpack('<HH', d[26:30])
    return w & 0x3FFF, h & 0x3FFF


def bajar(n):
    dest = os.path.join(CARPETA, n['ar'] + '.webp')
    if not os.path.exists(dest):
        url = (n.get('imgG') or n['img']).replace('http://', 'https://')
        ext = url.rsplit('.', 1)[-1].split('?')[0][:4]
        with tempfile.NamedTemporaryFile(suffix='.' + ext) as t:
            r = subprocess.run(['curl', '-sfL', '--max-time', '60', '-A', 'Mozilla/5.0', '-o', t.name,
                                urllib.parse.quote(url, safe=':/?=&%')])
            if r.returncode:
                return n['ar'], 'no bajo (curl %d)' % r.returncode
            # -resize con alto 0 respeta la proporcion; no agranda las chicas.
            w = subprocess.run(['sips', '-g', 'pixelWidth', t.name], capture_output=True, text=True).stdout
            ancho = int(w.split()[-1]) if w.split()[-1].isdigit() else ANCHO
            achicar = ['-resize', str(ANCHO), '0'] if ancho > ANCHO else []
            r = subprocess.run(['cwebp', '-quiet', '-q', str(CALIDAD), '-metadata', 'none', *achicar, t.name, '-o', dest],
                               stderr=subprocess.DEVNULL)
            if r.returncode:
                # GIF, BMP o JPG en CMYK: cwebp no los lee; pasan por PNG en RGB.
                png = t.name + '.png'
                subprocess.run(['sips', '-s', 'format', 'png', '-m', '/System/Library/ColorSync/Profiles/sRGB Profile.icc',
                                t.name, '--out', png], capture_output=True)
                r = subprocess.run(['cwebp', '-quiet', '-q', str(CALIDAD), '-metadata', 'none', *achicar, png, '-o', dest],
                                   stderr=subprocess.DEVNULL)
                if os.path.exists(png):
                    os.remove(png)
            if r.returncode:
                return n['ar'], 'no convirtio'
    n['mi'] = list(medidas_webp(dest))
    return n['ar'], None


def main():
    os.makedirs(CARPETA, exist_ok=True)
    notas = json.load(open(JSON, encoding='utf-8'))
    con_foto = [n for n in notas if n.get('img')]
    for n in notas:
        n.pop('mi', None)
    with ThreadPoolExecutor(8) as ex:
        fallas = [(a, e) for a, e in ex.map(bajar, con_foto) if e]
    json.dump(notas, open(JSON, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    peso = sum(os.path.getsize(os.path.join(CARPETA, f)) for f in os.listdir(CARPETA))
    print('miniaturas %d de %d notas con foto, %.1f MB' % (len(con_foto) - len(fallas), len(con_foto), peso / 1e6))
    for a, e in fallas:
        print('  falta', a, '-', e)


if __name__ == '__main__':
    main()
