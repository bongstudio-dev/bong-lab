"""Copia fija de las notas del sitio actual, con texto y fotos.

Lee el HTML guardado por el relevamiento (crawl del sitio actual) y:
  1. suma a notas.json, en cada nota: img (foto principal), fs (fotos de la
     cabecera), et (etiquetas), ca (categorias), lg (lugar), id (archivo);
  2. escribe ../notas/<id>.json con el cuerpo limpio de cada nota.

El cuerpo queda como HTML de pocas etiquetas (p, h2-h4, listas, citas,
negrita, cursiva, links, imagenes con epigrafe, tablas y videos embebidos),
sin clases ni estilos del theme, listo para pintarse con el sistema.

Correr despues de prep.py:
  CRAWL=/ruta/a/relevamiento-profertil/data python3 prep-cuerpos.py
"""
import gzip, hashlib, html, json, os, re, urllib.parse
from html.parser import HTMLParser

AQUI = os.path.dirname(os.path.abspath(__file__))
CRAWL = os.environ.get('CRAWL', os.path.expanduser('~/Documents/Desarrollo/relevamiento-profertil/data'))
SALIDA = os.path.join(AQUI, '..', 'notas')
BASE = 'https://www.profertil.com.ar/index.php/'


def archivo(url):
    return os.path.join(CRAWL, 'html', hashlib.sha1(url.encode()).hexdigest()[:16] + '.html.gz')


def nombres_de_taxonomia():
    """slug -> nombre, desde las paginas /tag/ y /category/ del crawl."""
    tags, cats = {}, {}
    for l in open(os.path.join(CRAWL, 'paginas.jsonl'), encoding='utf-8'):
        d = json.loads(l)
        m = re.search(r'/(tag|category)/([^?]+)', d['url'])
        if m and d.get('h1'):
            slug = m.group(2).strip('/').split('/')[-1]  # las categorias van anidadas
            (tags if m.group(1) == 'tag' else cats)[slug] = d['h1'].strip()
    return tags, cats


# ---------- arbol minimo ----------
class Nodo:
    def __init__(self, tag, attrs=None, padre=None):
        self.tag, self.attrs, self.padre, self.hijos = tag, dict(attrs or []), padre, []


VACIAS = {'img', 'br', 'hr', 'input', 'meta', 'link', 'source', 'iframe', 'wbr'}


class Arbol(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.raiz = self.act = Nodo('#raiz')

    def handle_starttag(self, tag, attrs):
        n = Nodo(tag, [(k, v or '') for k, v in attrs], self.act)
        self.act.hijos.append(n)
        if tag not in VACIAS:
            self.act = n

    def handle_startendtag(self, tag, attrs):
        self.act.hijos.append(Nodo(tag, [(k, v or '') for k, v in attrs], self.act))

    def handle_endtag(self, tag):
        n = self.act
        while n is not self.raiz and n.tag != tag:
            n = n.padre
        if n is not self.raiz:
            self.act = n.padre

    def handle_data(self, data):
        self.act.hijos.append(data)


def buscar(n, pred):
    if isinstance(n, str):
        return None
    if pred(n):
        return n
    for h in n.hijos:
        r = buscar(h, pred)
        if r:
            return r


def clases(n):
    return (n.attrs.get('class') or '').split()


def texto(n):
    if isinstance(n, str):
        return n
    return ''.join(texto(h) for h in n.hijos)


# ---------- limpieza ----------
BLOQUE = {'p', 'h2', 'h3', 'h4', 'ul', 'ol', 'blockquote', 'figure', 'table', 'iframe', 'img', 'hr'}
TRANSPARENTE = {'div', 'span', 'section', 'font', 'center', 'article', 'u', 'small', 'big', 'label', 'sup', 'sub', 'mark', 'abbr', 'time'}
FUERA = {'script', 'style', 'noscript', 'form', 'button', 'svg', 'input', 'select', 'textarea', 'nav'}
RENOMBRE = {'b': 'strong', 'i': 'em', 'h1': 'h2', 'h5': 'h4', 'h6': 'h4', 'dl': 'ul'}


def mejor_src(n):
    """La version mas grande hasta 1600 px de ancho."""
    src = n.attrs.get('src') or n.attrs.get('data-src') or ''
    mejor, ancho = src, 0
    for parte in (n.attrs.get('srcset') or '').split(','):
        p = parte.strip().split(' ')
        if len(p) == 2 and p[1].endswith('w'):
            w = int(p[1][:-1] or 0)
            if ancho < w <= 1600:
                mejor, ancho = p[0], w
    return mejor


def es_foto(url):
    return bool(re.search(r'\.(jpe?g|png|webp|gif)(\?|$)', url or '', re.I))


def video(src):
    src = src or ''
    m = re.search(r'(?:youtube(?:-nocookie)?\.com/(?:embed/|watch\?v=)|youtu\.be/)([\w-]{11})', src)
    if m:
        return 'https://www.youtube-nocookie.com/embed/' + m.group(1)
    m = re.search(r'vimeo\.com/(?:video/)?(\d+)', src)
    if m:
        return 'https://player.vimeo.com/video/' + m.group(1)
    return ''


def todas(n, tag):
    out = []
    if isinstance(n, str):
        return out
    for h in n.hijos:
        if not isinstance(h, str):
            if h.tag == tag:
                out.append(h)
            out.extend(todas(h, tag))
    return out


def ancho_de(art, url):
    for im in todas(art, 'img'):
        if base_foto(mejor_src(im)) == base_foto(url) and (im.attrs.get('width') or '').isdigit():
            return int(im.attrs['width'])
    return 0


def esc(s):
    return html.escape(s, quote=True)


def limpiar(nodos):
    """Devuelve una lista de piezas: ('txt', str) inline o ('blq', html) bloque."""
    out = []
    for n in nodos:
        if isinstance(n, str):
            if n:
                out.append(('txt', esc(re.sub(r'\s+', ' ', n))))
            continue
        tag = RENOMBRE.get(n.tag, n.tag)
        if tag in FUERA or 'screen-reader-text' in clases(n) or 'fusion-sharing-box' in clases(n):
            continue
        if tag == 'img':
            src = mejor_src(n)
            if src and 'logo' not in src.lower():
                w, h = n.attrs.get('width', ''), n.attrs.get('height', '')
                dim = (' width="%s" height="%s"' % (esc(w), esc(h))) if w.isdigit() and h.isdigit() else ''
                out.append(('blq', '<figure><img src="%s" alt="%s"%s loading="lazy"></figure>' % (esc(src), esc(n.attrs.get('alt', '')), dim)))
            continue
        if tag == 'iframe':
            v = video(n.attrs.get('src') or n.attrs.get('data-src'))
            if v:
                out.append(('blq', '<figure class="video"><iframe src="%s" loading="lazy" allowfullscreen></iframe></figure>' % esc(v)))
            continue
        if tag == 'br':
            out.append(('txt', '<br>'))
            continue
        if tag == 'hr':
            continue
        if tag == 'a':
            href = n.attrs.get('href', '')
            dentro = limpiar(n.hijos)
            if any(k == 'blq' for k, _ in dentro) or es_foto(href):
                out.extend(dentro)  # link que envuelve una foto: queda la foto
                continue
            v = video(href)
            if v and not texto(n).strip():
                out.append(('blq', '<figure class="video"><iframe src="%s" loading="lazy" allowfullscreen></iframe></figure>' % esc(v)))
                continue
            inner = ''.join(h for _, h in dentro)
            if not inner.strip():
                continue
            if href.startswith(('http', 'mailto:', '/')):
                href = href.replace('http://', 'https://')
                out.append(('txt', '<a href="%s" target="_blank" rel="noopener">%s</a>' % (esc(href), inner)))
            else:
                out.append(('txt', inner))
            continue
        if tag in ('strong', 'em'):
            dentro = limpiar(n.hijos)
            if any(k == 'blq' for k, _ in dentro):
                out.extend(dentro)
                continue
            inner = ''.join(h for _, h in dentro)
            if inner.strip():
                out.append(('txt', '<%s>%s</%s>' % (tag, inner, tag)))
            elif inner:
                out.append(('txt', ' '))
            continue
        if tag in ('ul', 'ol'):
            items = []
            for li in n.hijos:
                if isinstance(li, str):
                    continue
                cont = ''.join(h for _, h in limpiar(li.hijos)).strip()
                if re.sub(r'<br>|\s|&nbsp;', '', cont):
                    items.append('<li>%s</li>' % cont)
            if items:
                out.append(('blq', '<%s>%s</%s>' % (tag, ''.join(items), tag)))
            continue
        if tag in ('table',):
            filas = []
            def recorrer(m):
                for h in m.hijos:
                    if isinstance(h, str):
                        continue
                    if h.tag == 'tr':
                        celdas = []
                        for c in h.hijos:
                            if not isinstance(c, str) and c.tag in ('td', 'th'):
                                celdas.append('<%s>%s</%s>' % (c.tag, ''.join(x for _, x in limpiar(c.hijos)).strip(), c.tag))
                        if celdas:
                            filas.append('<tr>%s</tr>' % ''.join(celdas))
                    else:
                        recorrer(h)
            recorrer(n)
            if filas:
                out.append(('blq', '<table>%s</table>' % ''.join(filas)))
            continue
        if tag == 'figure':
            dentro = limpiar([h for h in n.hijos if isinstance(h, str) or h.tag != 'figcaption'])
            cap = buscar(n, lambda m: m.tag == 'figcaption')
            fotos = [h for k, h in dentro if k == 'blq']
            if fotos and cap is not None and texto(cap).strip():
                fotos[-1] = fotos[-1].replace('</figure>', '<figcaption>%s</figcaption></figure>' % esc(texto(cap).strip()), 1)
            out.extend(('blq', f) for f in fotos)
            continue
        if tag in ('p', 'h2', 'h3', 'h4', 'blockquote', 'td', 'th', 'li', 'dt', 'dd') or tag in TRANSPARENTE or tag not in BLOQUE:
            dentro = limpiar(n.hijos)
            if tag in ('p', 'h2', 'h3', 'h4', 'blockquote'):
                out.extend(agrupar(dentro, tag))
            elif tag in ('div', 'section', 'article', 'center', 'dd', 'dt'):
                out.extend(agrupar(dentro, 'p'))
            else:
                out.extend(dentro)
    return out


def agrupar(piezas, envoltorio):
    """Junta lo inline seguido en un bloque <envoltorio>; deja los bloques sueltos."""
    out, run = [], []

    def cerrar():
        s = ''.join(run).strip()
        s = re.sub(r'^(<br>\s*)+|(\s*<br>)+$', '', s).strip()
        if re.sub(r'<[^>]+>|&nbsp;|\s', '', s):
            out.append(('blq', '<%s>%s</%s>' % (envoltorio, s, envoltorio)))
        run.clear()

    for k, h in piezas:
        if k == 'txt':
            run.append(h)
        else:
            cerrar()
            out.append((k, h))
    cerrar()
    return out


def base_foto(url):
    """La misma foto en cualquier tamano: sin -800x450, -scaled ni -e123."""
    f = (url or '').split('/')[-1].lower()
    f = re.sub(r'\.(jpe?g|png|webp|gif)$', '', f)
    return re.sub(r'(-\d+x\d+|-scaled|-e\d{9,})+$', '', f)


def cuerpo_html(post, titulo, foto):
    bloques = [h for _, h in agrupar(limpiar(post.hijos), 'p')]
    # Arriba suelen venir "26 de enero del 2026 | Ingeniero White", un antetitulo
    # (h4 corto) y el titulo repetido: salen del cuerpo y van como datos.
    lugar, ante = '', ''
    plano = lambda s: re.sub(r'\W+', ' ', html.unescape(re.sub(r'<[^>]+>', '', s))).strip().lower()
    tp = plano(titulo)
    for _ in range(4):
        if not bloques:
            break
        b = bloques[0]
        t = html.unescape(re.sub(r'<[^>]+>', '', b)).strip()
        pb = plano(b)
        if re.match(r'^\d{1,2}\s+de\s+\w+', t, re.I) and len(t) < 120 and not b.startswith('<p'):
            if '|' in t:
                lugar = t.split('|', 1)[1].strip()
            bloques.pop(0)
        elif re.match(r'^\d{1,2}\s+de\s+\w+.{0,40}\|', t, re.I) and len(t) < 120:
            lugar = t.split('|', 1)[1].strip()
            bloques.pop(0)
        elif pb == tp or (len(tp) > 20 and pb.startswith(tp[:40])) or (len(pb) > 20 and tp.startswith(pb[:40])):
            bloques.pop(0)
        elif not ante and re.match(r'<h[34]>', b) and len(t) < 140 and any(plano(x) == tp or tp.startswith(plano(x)[:40]) for x in bloques[1:3]):
            ante = t  # antetitulo: solo si despues viene el titulo repetido
            bloques.pop(0)
        else:
            break
    # La foto principal ya va en la cabecera: no se repite en el cuerpo.
    bf = base_foto(foto)
    if bf:
        bloques = [b for b in bloques if not (b.startswith('<figure><img') and base_foto(re.search(r'src="([^"]+)"', b).group(1)) == bf)]
    return '\n'.join(bloques), lugar, ante


def bajar_destacadas(notas, cuantas=5):
    """Copia local (WebP) de la foto de las notas del header, para que la
    maqueta no dependa del servidor del sitio actual."""
    import subprocess, tempfile
    carpeta = os.path.join(AQUI, '..', 'fotos', 'notas')
    os.makedirs(carpeta, exist_ok=True)
    for n in [n for n in notas if n.get('img')][-cuantas:]:
        dest = os.path.join(carpeta, n['ar'] + '.webp')
        if not os.path.exists(dest):
            url = n.get('imgG') or n['img']
            with tempfile.NamedTemporaryFile(suffix='.' + url.rsplit('.', 1)[-1]) as t:
                subprocess.run(['curl', '-sfL', '-A', 'Mozilla/5.0', '-o', t.name, urllib.parse.quote(url, safe=':/')], check=True)
                subprocess.run(['cwebp', '-quiet', '-q', '72', '-resize', '1600', '0', t.name, '-o', dest], check=True)
        n['imgL'] = '../novedades/fotos/notas/' + n['ar'] + '.webp'


def main():
    tags, cats = nombres_de_taxonomia()
    ruta = os.path.join(AQUI, 'notas.json')
    notas = json.load(open(ruta, encoding='utf-8'))
    os.makedirs(SALIDA, exist_ok=True)
    sin_html = 0
    for n in notas:
        url = BASE + n['u']
        p = archivo(url)
        if not os.path.exists(p):
            p = archivo(url + '/')
        if not os.path.exists(p):
            sin_html += 1
            continue
        doc = gzip.open(p).read().decode('utf-8', 'ignore')
        a = Arbol()
        a.feed(doc)
        art = buscar(a.raiz, lambda m: m.tag == 'article')
        if art is None:
            sin_html += 1
            continue
        cl = clases(art)
        n['et'] = [tags.get(c[4:], c[4:].replace('-', ' ')) for c in cl if c.startswith('tag-')]
        n['ca'] = [cats.get(c[9:], c[9:].replace('-', ' ')) for c in cl if c.startswith('category-') and c not in ('category-noticias-recientes', 'category-uncategorized')]
        # Foto principal: la cabecera del post (slideshow de Avada) o og:image.
        cab = buscar(art, lambda m: 'post-slideshow' in clases(m))
        fotos = []
        if cab is not None:
            def juntar(m):
                for h in m.hijos:
                    if isinstance(h, str):
                        continue
                    if h.tag == 'a' and es_foto(h.attrs.get('href')):
                        fotos.append(h.attrs['href'])
                    elif h.tag == 'img' and not fotos[-1:]:
                        fotos.append(mejor_src(h))
                    else:
                        juntar(h)
            juntar(cab)
        og = re.search(r'<meta property="og:image" content="([^"]+)"', doc)
        if not fotos and og:
            fotos = [og.group(1)]
        fotos = list(dict.fromkeys(f.replace('http://', 'https://') for f in fotos if f))
        if fotos:
            n['img'] = fotos[0]
        # Para el header a pantalla completa: la foto mas grande entre la principal
        # y las del cuerpo (la principal suele ser una miniatura de 400 px).
        grande, ancho = n.get('img', ''), ancho_de(art, n.get('img', ''))
        post0 = buscar(art, lambda m: 'post-content' in clases(m))
        for im in todas(post0, 'img') if post0 is not None else []:
            src = mejor_src(im)
            w = int(re.search(r'-(\d+)x\d+\.', src).group(1)) if re.search(r'-(\d+)x\d+\.', src) else int(im.attrs.get('width') or 0)
            if 'logo' not in src.lower() and w > ancho * 1.4 and w >= 900:
                grande, ancho = src, w
                break
        if grande and grande != n.get('img'):
            n['imgG'] = grande
        if len(fotos) > 1:
            n['fs'] = fotos
        post = buscar(art, lambda m: 'post-content' in clases(m))
        cuerpo, lugar, ante = cuerpo_html(post, n['t'], n.get('img')) if post is not None else ('', '', '')
        if lugar:
            n['lg'] = lugar
        n['ar'] = re.sub(r'[^a-z0-9-]+', '--', n['u'].split('noticias-recientes/', 1)[1].strip('/').lower())[:120]
        hora = re.search(r'article:published_time" content="([^"]+)"', doc)
        json.dump({
            'u': n['u'], 't': n['t'], 'f': n['f'], 'h': hora.group(1) if hora else '',
            'lg': lugar, 'ante': ante, 'b': n.get('b', ''), 'img': n.get('img', ''), 'imgG': n.get('imgG', ''), 'fs': fotos,
            'et': n['et'], 'ca': n['ca'], 'cuerpo': cuerpo,
        }, open(os.path.join(SALIDA, n['ar'] + '.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    if os.environ.get('SIN_FOTOS') != '1':
        bajar_destacadas(notas)
    json.dump(notas, open(ruta, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    print('notas', len(notas), '| sin html', sin_html,
          '| con foto', sum(1 for n in notas if n.get('img')),
          '| con etiquetas', sum(1 for n in notas if n.get('et')),
          '| con lugar', sum(1 for n in notas if n.get('lg')))


if __name__ == '__main__':
    main()
