"""Genera componentes/tokens.css: los tokens del sistema web de Profertil en un solo CSS.

Fuente: novedades/fuente/tokens.json (exportado del Figma Master, colecciones 01 · Primitivas
y 06 · Web, con el code syntax WEB de cada variable) más los semánticos de 06 · Web cuyo code
syntax es un alias o una expresión (Chip, Activo, Texto sobre color, Sobre foto) y las familias
de las etiquetas (04 · Paleta). Si cambia algo, se cambia en Figma, se vuelve a exportar
tokens.json y se corre este script:  python3 fuente/generar-tokens.py
"""
import json
from pathlib import Path

AQUI = Path(__file__).resolve().parent
TOKENS = AQUI.parent.parent / "novedades" / "fuente" / "tokens.json"
SALIDA = AQUI.parent / "tokens.css"

# 06 · Web: variables cuyo code syntax WEB apunta a otra o es una expresión (leídas del Master el 22/10/2026).
SEMANTICOS = [
    ("titulo", "var(--azul)", "Web/Título"),
    ("activo", "var(--ink)", "Web/Activo"),
    ("sobre-color", "var(--tiza)", "Web/Texto sobre color"),
    ("chip-fondo", "color-mix(in srgb, var(--azul) 16%, #fff)", "Web/Chip fondo"),
    ("chip-texto", "var(--azul)", "Web/Chip texto"),
    ("chip-activo", "var(--azul)", "Web/Chip activo"),
    ("borde-vidrio", "rgba(255, 255, 255, 0.92)", "Web/Borde vidrio"),
    ("foto-fondo", "rgba(255, 254, 239, 0.14)", "Web/Sobre foto/Fondo"),
    ("foto-boton", "rgba(255, 254, 239, 0.16)", "Web/Sobre foto/Botón"),
    ("foto-borde", "rgba(255, 254, 239, 0.22)", "Web/Sobre foto/Borde"),
    ("foto-texto", "rgba(255, 254, 239, 0.9)", "Web/Sobre foto/Texto"),
]

# 04 · Paleta: Dominante, Complementario y Tinta de cada familia. Las etiquetas y las pastillas de
# filtro usan estas (con "invertida" = dominante y complementario cruzados).
FAMILIAS = {
    "azul": ("var(--azul)", "var(--celeste)", "var(--azul)"),
    "verde": ("var(--verde)", "var(--verde-claro)", "var(--verde)"),
    "amarillo": ("var(--amarillo)", "var(--naranja)", "var(--naranja)"),
    "naranja": ("var(--naranja)", "var(--terra)", "var(--naranja)"),
}
# Las categorías de Novedades: familia y si va invertida (manual p. 64-66).
CATEGORIAS = [
    ("institucional", "azul", False), ("comercial", "naranja", False), ("somos", "verde", True),
    ("tecnico", "verde", False), ("aviso", "amarillo", False), ("financiera", "azul", True),
]

FUENTES = [
    ("f-display", '"Familjen Grotesk", "Helvetica Neue", Arial, sans-serif'),
    ("f-body", '"DM Sans", "Helvetica Neue", Arial, sans-serif'),
]


def main():
    datos = json.loads(TOKENS.read_text(encoding="utf-8"))
    l = ["/* Tokens del sistema web de Profertil. GENERADO por fuente/generar-tokens.py: no editar a mano.",
         "   Origen: Figma Master broRXp9etWG4y2IjFyCC3V (01 · Primitivas, 04 · Paleta, 06 · Web). */",
         ":root {"]
    l.append("  /* 01 · Primitivas y 06 · Web (tokens.json) */")
    for nombre, t in datos["tokens"].items():
        l.append(f"  --{nombre}: {t['valor']};  /* {t['figma']} */")
    l.append("  /* 06 · Web: semánticos */")
    for nombre, valor, figma in SEMANTICOS:
        l.append(f"  --{nombre}: {valor};  /* {figma} */")
    l.append("  /* 04 · Paleta: familias (fondo, forma o complementario, tinta) */")
    for fam, (bg, fo, tx) in FAMILIAS.items():
        l.append(f"  --fam-{fam}: {bg}; --fam-{fam}-comp: {fo}; --fam-{fam}-tinta: {tx};")
    l.append("  /* Categorías de Novedades: color de la pastilla (--cat-x), de la forma del badge (--cat-x-forma) y del texto de la etiqueta (--cat-x-tinta) */")
    for cat, fam, inv in CATEGORIAS:
        bg, fo, tx = FAMILIAS[fam]
        if inv:
            bg, fo = fo, bg
        l.append(f"  --cat-{cat}: {bg}; --cat-{cat}-forma: {fo}; --cat-{cat}-tinta: {tx};")
    l.append("  /* Tipografía */")
    for nombre, valor in FUENTES:
        l.append(f"  --{nombre}: {valor};")
    l.append("}")
    SALIDA.write_text("\n".join(l) + "\n", encoding="utf-8")
    print(f"{SALIDA.name}: {len(datos['tokens']) + len(SEMANTICOS)} tokens, {len(FAMILIAS)} familias, {len(CATEGORIAS)} categorías")


if __name__ == "__main__":
    main()
