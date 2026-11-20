"""Pie del sitio: un solo archivo, componentes/pie-sitio.js, que cargan todas las páginas.

Sale del componente "Pie de página" de la librería (c/pie.js), variante Institucional sobre azul con la
línea ética. Para ajustar el pie: tocar c/pie.js (o los datos de abajo) y correr

    python3 profertil/componentes/fuente/pie-sitio.py

Eso reescribe pie-sitio.js y actualiza la marca ?v= en cada página que lo carga, así que el cambio llega a
todas sin volver a correr sus builds. Las páginas lo cargan donde va el pie:

    <script src="../componentes/pie-sitio.js"></script>

(sin defer: el script se reemplaza a sí mismo por el pie, en el lugar donde está).
"""
import hashlib, json, os, re, subprocess

AQUI = os.path.dirname(os.path.abspath(__file__))
COMP = os.path.normpath(os.path.join(AQUI, '..'))
PROFERTIL = os.path.normpath(os.path.join(COMP, '..'))
SALIDA = os.path.join(COMP, 'pie-sitio.js')

# Enlaces del pie que ya tienen página en el Lab (relativos a profertil/). El resto queda como texto, sin enlace.
ENLACES = {
    'Noticias': 'novedades/',
    'Sala de prensa': 'sala-de-prensa/',
    'Biblioteca virtual': 'biblioteca/',
    'Fichas y hojas de seguridad': 'hojas-de-seguridad/',
}

NODE = r'''
const vm = require("vm"), fs = require("fs"), path = require("path");
const dir = process.argv[1]; let comp;
const ctx = { window: {}, Libreria: { sumar: c => { comp = c; } }, console };
ctx.window = ctx; vm.createContext(ctx);
for (const f of ["formas.js", "c/pie.js"]) vm.runInContext(fs.readFileSync(path.join(dir, f), "utf8"), ctx);
const s = { variante: "institucional", fondo: "azul", etica: true };
const html = comp.html(s).replace('<footer class="pf-pie"', '<footer class="pf-pie" data-variante="institucional" data-fondo="azul"');
process.stdout.write(JSON.stringify({ html, css: comp.css(s) }));
'''

pie = json.loads(subprocess.run(['node', '-e', NODE, COMP], capture_output=True, text=True, check=True).stdout)

js = '''/* Pie del sitio: el mismo en todas las páginas.
   Generado por componentes/fuente/pie-sitio.py desde la librería (c/pie.js, Institucional sobre azul): no editar a mano. */
(function () {
  var CSS = %s;
  var HTML = %s;
  var ENLACES = %s;
  var yo = document.currentScript;
  if (!document.getElementById("pf-pie-css")) {
    var st = document.createElement("style"); st.id = "pf-pie-css"; st.textContent = CSS; document.head.appendChild(st);
  }
  var t = document.createElement("template"); t.innerHTML = HTML;
  var aca = location.pathname.replace(/index\\.html$/, "");
  t.content.querySelectorAll("a").forEach(function (a) {
    var r = ENLACES[a.textContent.trim()];
    // Solo se enlaza lo que ya tiene página; el resto queda como texto, con la misma clase.
    if (!r) { var sp = document.createElement("span"); if (a.className) sp.className = a.className; sp.append.apply(sp, a.childNodes); a.replaceWith(sp); return; }
    var u = new URL("../" + r, yo.src); a.href = u.pathname;
    if (aca === u.pathname) a.setAttribute("aria-current", "page");
  });
  var pie = t.content.querySelector(".pf-pie");
  yo.replaceWith(t.content);
  // Con el pie a la vista, el dock de filtros y el ancla se retiran (la regla está en base.css).
  if (pie && "IntersectionObserver" in window) new IntersectionObserver(function (en) {
    document.documentElement.classList.toggle("pf-en-pie", en[0].isIntersecting);
  }, { rootMargin: "0px 0px -40px 0px" }).observe(pie);
})();
''' % (json.dumps(pie['css'], ensure_ascii=False), json.dumps(pie['html'], ensure_ascii=False).replace('</', '<\\/'),
       json.dumps(ENLACES, ensure_ascii=False))
open(SALIDA, 'w', encoding='utf-8').write(js)
huella = hashlib.md5(js.encode('utf-8')).hexdigest()[:8]
print('pie-sitio.js', len(js), 'bytes, v=' + huella)

# La marca ?v= de cada página que lo carga (ver versionar.py), para que nadie se quede con el pie viejo en caché.
ENLACE = re.compile(r'(src="[^"]*componentes/pie-sitio\.js)(?:\?v=[0-9a-f]+)?(")')
for raiz, carpetas, archivos in os.walk(PROFERTIL):
    carpetas[:] = [c for c in carpetas if c != 'fuente']  # las plantillas las versiona su build
    for a in archivos:
        if not a.endswith('.html'):
            continue
        ruta = os.path.join(raiz, a)
        s = open(ruta, encoding='utf-8').read()
        if 'pie-sitio.js' not in s:
            continue
        n = ENLACE.sub(lambda m: m.group(1) + '?v=' + huella + m.group(2), s)
        if n != s:
            open(ruta, 'w', encoding='utf-8').write(n)
            print('  ', os.path.relpath(ruta, PROFERTIL))
