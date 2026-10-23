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

# Escala tipográfica web. PROPUESTA (23/10/2026): el Master todavía no tiene variables de texto.
# Sale de unificar los tamaños que ya usaban los componentes (display 76-96, títulos 48-60, etc.).
# Cuando se carguen en el Master (06 · Web), pasan a tokens.json y esta lista se borra.
ESCALA = [
    ("texto-display", "clamp(36px, 6vw, 88px)", "Títulos de apertura y hero"),
    ("texto-titulo", "clamp(28px, 4.2vw, 52px)", "Títulos de sección"),
    ("texto-subtitulo", "22px", "Títulos de tarjeta, columna o diálogo"),
    ("texto-destacado", "18px", "Bajadas y párrafos destacados"),
    ("texto-cuerpo", "16px", "Texto corrido"),
    ("texto-chico", "14px", "Botones, menús, notas y datos"),
    ("texto-mini", "12px", "Rótulos, legales y eyebrows"),
]
# Radios y sombras que repetían todos los componentes (Novedades es la referencia).
FORMA = [
    ("radio-tarjeta", "26px", "Tarjetas, paneles y diálogos"),
    ("radio-media", "19px", "Foto dentro de una tarjeta"),
    ("radio-control", "13px", "Botones y campos (UI/Botón)"),
    ("radio-aviso", "16px", "Avisos y filas"),
    ("sombra-tarjeta", "0 1px 2px rgba(10, 30, 74, 0.06), 0 12px 28px -16px rgba(10, 30, 74, 0.28)", "Tarjeta en reposo"),
    ("sombra-flotante", "0 24px 60px -24px rgba(10, 30, 74, 0.5)", "Docks, menús y paneles que flotan"),
    ("sombra-control", "0 1px 3px rgba(10, 30, 74, 0.12)", "Indicador del Selector y botones elevados"),
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
    l.append("  /* Escala tipográfica web: PROPUESTA, todavía no está en el Master */")
    for nombre, valor, uso in ESCALA:
        l.append(f"  --{nombre}: {valor};  /* {uso} */")
    l.append("  /* Radios y sombras */")
    for nombre, valor, uso in FORMA:
        l.append(f"  --{nombre}: {valor};  /* {uso} */")
    l.append("}")
    SALIDA.write_text("\n".join(l) + "\n", encoding="utf-8")
    print(f"{SALIDA.name}: {len(datos['tokens']) + len(SEMANTICOS)} tokens, {len(FAMILIAS)} familias, {len(CATEGORIAS)} categorías")


if __name__ == "__main__":
    main()
