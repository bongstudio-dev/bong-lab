"""Pasa los textos de las etiquetas a trazos vectoriales.

Las bolsas usan Rotis Sans Serif, una fuente comercial que no se publica.
Este script corre en una máquina que tiene la fuente instalada y deja en
textos.js solo los contornos de las frases que usan las etiquetas, ya
compuestas (con su interletrado), listos para dibujar con Path2D.

Uso, desde profertil/bolsa-3d:
  python3 fuente/textos.py RUTA/Rotis-65.ttf [RUTA/Rotis-75.ttf]

Necesita fonttools y uharfbuzz (pip install fonttools uharfbuzz) y node,
que lee la lista de frases de etiqueta.js. Sin la 75, el peso negro sale
de la 65 hasta que esté disponible.
"""
import json
import subprocess
import sys
from pathlib import Path

import uharfbuzz as hb
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

AQUI = Path(__file__).resolve().parent.parent


def frases():
    js = "import('./etiqueta.js').then(m => console.log(JSON.stringify(m.FRASES)))"
    sal = subprocess.run(["node", "--input-type=module", "-e", js], cwd=AQUI, capture_output=True, text=True, check=True)
    return json.loads(sal.stdout)


class Cara:
    def __init__(self, ruta):
        self.tt = TTFont(ruta)
        self.glifos = self.tt.getGlyphSet()
        self.upm = self.tt["head"].unitsPerEm
        self.hb = hb.Font(hb.Face(Path(ruta).read_bytes()))
        self.orden = self.tt.getGlyphOrder()

    def componer(self, s):
        buf = hb.Buffer()
        buf.add_str(s)
        buf.guess_segment_properties()
        hb.shape(self.hb, buf, {"kern": True, "liga": False})
        pen = SVGPathPen(self.glifos, ntos=lambda v: f"{v:.1f}".rstrip("0").rstrip("."))
        x = 0
        k = 1000 / self.upm
        for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
            nombre = self.orden[info.codepoint]
            # Unidades a 1000 por eme, eje y hacia abajo como en el canvas.
            t = TransformPen(pen, (k, 0, 0, -k, (x + pos.x_offset) * k, -pos.y_offset * k))
            self.glifos[nombre].draw(t)
            x += pos.x_advance
        return round(x * k, 1), pen.getCommands()


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    caras = {"65": Cara(sys.argv[1])}
    caras["75"] = Cara(sys.argv[2]) if len(sys.argv) > 2 else caras["65"]
    salida = {}
    for peso, s in frases():
        salida[f"{peso}|{s}"] = caras[peso].componer(s)
    cuerpo = ",\n".join(f"  {json.dumps(k, ensure_ascii=False)}: [{w}, {json.dumps(d)}]" for k, (w, d) in sorted(salida.items()))
    (AQUI / "textos.js").write_text(
        "// Generado por fuente/textos.py: contornos de los textos de las etiquetas.\n"
        "// Cada frase: [ancho, trazo SVG] a 1000 unidades por eme, línea de base en y 0.\n"
        f"export const TRAZOS = {{\n{cuerpo}\n}};\n",
        encoding="utf-8",
    )
    print(f"{len(salida)} frases en textos.js")


if __name__ == "__main__":
    main()
