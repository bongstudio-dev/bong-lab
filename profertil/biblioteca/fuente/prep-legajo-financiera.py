#!/usr/bin/env python3
"""Datos de Situación financiera, Legajo impositivo, Gobierno societario y Títulos de deuda: lee esas páginas del sitio
actual y arma docs-financiera.json, docs-legajo.json, docs-gobierno.json y docs-deuda.json. Baja a ../pdf/ los PDF que falten (dos a la vez) y el zip del legajo a
../archivos/.

    python3 profertil/biblioteca/fuente/prep-legajo-financiera.py            # datos y descargas
    python3 profertil/biblioteca/fuente/prep-legajo-financiera.py --sin-bajar

Situación financiera: los balances anuales y trimestrales. Los que ya estaban en docs-inversores.json (porque el
sitio actual los publica también como página propia) conservan su id: el documento es el mismo.
Legajo impositivo: el legajo completo y las constancias nacionales y provinciales. El número que lleva cada
constancia en el sitio actual se repite entre las dos listas y entre versiones, por eso no va en el título; el
vencimiento sale del título y se muestra aparte.
"""
import html, json, re, subprocess, sys, unicodedata, urllib.parse
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

AQUI = Path(__file__).resolve().parent
PDF = AQUI.parent / "pdf"
ARCHIVOS = AQUI.parent / "archivos"
SITIO = "https://www.profertil.com.ar/index.php/"
UA = "Mozilla/5.0 (Macintosh) bong-lab"


def curl(url):
    url = urllib.parse.quote(url, safe=":/?=&%#~")  # algunos PDF traen acentos en el nombre
    r = subprocess.run(["curl", "-sfL", "--retry", "2", "--max-time", "600", "-A", UA, url], capture_output=True)
    if r.returncode:
        raise RuntimeError("curl %d: %s" % (r.returncode, url))
    return r.stdout


def bajar_texto(url):
    return curl(url).decode("utf-8", "replace")


def slug(s):
    s = unicodedata.normalize("NFD", s).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")


def links(trozo):
    for href, txt in re.findall(r'<a[^>]+href="([^"]+)"[^>]*>(.*?)</a>', trozo, re.S):
        yield href, html.unescape(re.sub(r"<[^>]+>", "", txt)).strip()


# --- Situación financiera --------------------------------------------------------------------------------------
MESES = {"marzo": 3, "junio": 6, "septiembre": 9, "diciembre": 12}


def financiera(inversores):
    s = bajar_texto(SITIO + "inversores-es/situacion-financiera-y-novedades")
    i = s.find("Balances Anuales")
    j = s.find("Balances Trimestrales", i)
    k = re.compile(r"<h6[^>]*>Balances anuales").search(s, j).start()  # segunda lista de anuales (2016-2020), repetida: se ignora
    # Los que el sitio publica como página propia se cruzan por la dirección de esa página o por el PDF.
    por_pagina = {d["s"].rstrip("/").split("/")[-1].lower(): d for d in inversores}
    por_pdf = {d["u"].split("/")[-1].lower(): d for d in inversores}
    docs = []

    def agregar(href, tipo, anio, fecha, titulo):
        base = href.rstrip("/").split("/")[-1].lower()
        previo = por_pdf.get(base) or por_pagina.get(base)
        if previo:
            d = {k2: previo[k2] for k2 in ("id", "u", "s", "l") if k2 in previo}
        else:
            d = {"id": "balance-" + (anio if tipo == "anual" else fecha), "u": href, "l": base}
        d.update({"t": titulo, "c": "inversores", "y": anio, "o": fecha, "e": {"tipo": [tipo], "anio": [anio]}})
        docs.append(d)

    for href, txt in links(s[i:j]):
        m = re.match(r"Balance (\d{4})$", txt)
        if m:
            agregar(href, "anual", m.group(1), m.group(1) + "-12-31", "Balance anual " + m.group(1))
    for href, txt in links(s[j:k]):
        m = re.match(r"(\d{1,2}) de (\w+) (\d{4})$", txt.strip())
        if not m or m.group(2).lower() not in MESES:
            continue
        dia, mes, anio = m.group(1), m.group(2).lower(), m.group(3)
        fecha = "%s-%02d-%02d" % (anio, MESES[mes], int(dia))
        agregar(href, "trimestral", anio, fecha, "Balance trimestral al %s de %s de %s" % (int(dia), mes, anio))
    docs.sort(key=lambda d: d["o"], reverse=True)
    vistos, unicos = set(), []
    for d in docs:
        if d["id"] not in vistos:
            vistos.add(d["id"]); unicos.append(d)
    return unicos


# --- Legajo impositivo -----------------------------------------------------------------------------------------
# Títulos legibles para las constancias (los del sitio actual mezclan mayúsculas, abreviaturas y números de orden).
# La clave es el texto del sitio sin número ni vencimiento; la jurisdicción va aparte.
TITULOS = {
    "AFIP – Administración Federal de Ingresos Públicos": ("AFIP - Administración Federal de Ingresos Públicos", None),
    "Padron Web Profertil S.A": ("Padrón web Profertil S.A.", None),
    "CM05 2025 Profertil SA": ("CM05 2025 Profertil S.A.", None),
    "Acuse CM05 2025 Profertil SA": ("Acuse CM05 2025 Profertil S.A.", None),
    "RG 830 31-12-26": ("RG 830 al 31-12-2026", None),
    "Boletin Oficial Designación RG 18": ("Boletín Oficial, designación RG 18", None),
    "Constancia impo-expo": ("Constancia de importador y exportador", None),
    "RG2226 IVA – CNR": ("RG 2226 IVA - CNR", None),
    "Constancia Agente Percepcion Mendoza": ("Constancia de agente de percepción", "mendoza"),
    "Constancia Agente Ret-Perc Córdoba": ("Constancia de agente de retención y percepción", "cordoba"),
    "CONSTANCIA DE INSCRIPCION – INGRESOS BRUTOS API Sta Fe": ("Constancia de inscripción en Ingresos Brutos (API)", "santa-fe"),
    "INSCRIPCION AG.PERCEPCIÓN PROFERTIL S.A Sta Fe.": ("Inscripción como agente de percepción", "santa-fe"),
    "INSCRIPCION AG.RETENCION PROFERTIL S.A Sta Fe.": ("Inscripción como agente de retención", "santa-fe"),
    "Constancia Inscripcion Corrientes": ("Constancia de inscripción", "corrientes"),
    "Constancia No Percepción Catamarca": ("Constancia de no percepción", "catamarca"),
    "Constancia No Retención Catamarca": ("Constancia de no retención", "catamarca"),
    "Certificado no ret-perc Mendoza": ("Certificado de no retención y percepción", "mendoza"),
    "Constancia No Ret No Percep Misiones": ("Constancia de no retención y no percepción", "misiones"),
    "Constancia No Retención y Perc Tucuman": ("Constancia de no retención y percepción", "tucuman"),
    "Certificado de Exclusion de Corrientes –": ("Certificado de exclusión", "corrientes"),
    "Constancia Sgo del Estero Excluision de Retenciones y Percepciones": ("Constancia de exclusión de retenciones y percepciones", "santiago-del-estero"),
    "Constancia Salta Exclusion de Retenciones y Percepciones": ("Constancia de exclusión de retenciones y percepciones", "salta"),
    "Certificado de Exclusion de Rio Negro –": ("Certificado de exclusión", "rio-negro"),
    "Formosa – Certificado de Exclusion de Percepciones": ("Certificado de exclusión de percepciones", "formosa"),
    "Formosa – Certificado de Exclusion de Retencion": ("Certificado de exclusión de retención", "formosa"),
    "Formosa – Certificado de Exclusion de Puesto de control": ("Certificado de exclusión de puesto de control", "formosa"),
    "Formosa – Certificado de Exclusion de Retenciones": ("Certificado de exclusión de retenciones", "formosa"),
}
PROVINCIAS = {"catamarca": "Catamarca", "cordoba": "Córdoba", "corrientes": "Corrientes", "formosa": "Formosa", "mendoza": "Mendoza",
              "misiones": "Misiones", "rio-negro": "Río Negro", "salta": "Salta", "santa-fe": "Santa Fe",
              "santiago-del-estero": "Santiago del Estero", "tucuman": "Tucumán"}


def legajo():
    s = bajar_texto(SITIO + "uncategorized-es/legajo-impositivo")
    tabs = [m.start() for m in re.finditer(r"<h4[^>]*>(Legajo|Constancias Nacionales|Constancias Provinciales)</h4>", s)]
    # Las pestañas aparecen dos veces: en la barra de pestañas y como título de cada panel. Los paneles son las tres últimas.
    a, n, p = tabs[-3:]
    fin = s.find(".zip", p)
    zipurl = re.search(r'href="([^"]+\.zip)"', s[p:fin + 10]).group(1)
    docs, vistos = [], set()
    for zona, desde, hasta in (("legajo", a, n), ("nacional", n, p), ("provincial", p, fin)):
        for href, txt in links(s[desde:hasta]):
            if not href.lower().endswith(".pdf") or href in vistos:
                continue
            vistos.add(href)
            vto = None
            m = re.search(r"\s*Vto\.?\s*(\d{2})-(\d{2})-(\d{2,4})\s*$", txt)
            if m:
                anio = m.group(3) if len(m.group(3)) == 4 else "20" + m.group(3)
                vto = "%s-%s-%s" % (anio, m.group(2), m.group(1))
                txt = txt[:m.start()].strip()
            txt = re.sub(r"^\d+\.\s*", "", txt).strip()
            if zona == "legajo":
                m = re.search(r"(\d{2})-(\d{4})", txt)
                mes = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre",
                       "noviembre", "diciembre"][int(m.group(1)) - 1]
                titulo, prov = "Legajo impositivo completo, %s %s" % (mes, m.group(2)), None
            elif txt in TITULOS:
                titulo, prov = TITULOS[txt]
            else:
                sys.exit("Constancia nueva, sumala a TITULOS: %r" % txt)
            if prov:
                titulo += " - " + PROVINCIAS[prov]
            # Si la jurisdicción la dice el título, va provincial aunque el sitio la haya puesto en otra lista.
            alcance = "provincial" if prov else zona
            base = href.split("/")[-1]
            # El id, sin el número de orden del sitio ni la palabra legajo repetida.
            d = {"id": "legajo-" + re.sub(r"^(\d+-)?(legajo-)?", "", slug(base[:-4])), "t": titulo, "c": "impositivo", "y": "", "u": href, "l": base,
                 "e": {"alcance": [alcance]}}
            if prov:
                d["e"]["provincia"] = [prov]
            if vto:
                d["v"] = vto
                d["y"] = "Vence " + "/".join(reversed(vto.split("-")))
            docs.append(d)
    # Orden: el legajo, las nacionales como en el sitio y las provinciales por provincia, la de vencimiento más lejano primero.
    rango = {"legajo": 0, "nacional": 1, "provincial": 2}
    orden = sorted(range(len(docs)), key=lambda i: (
        rango[docs[i]["e"]["alcance"][0]],
        PROVINCIAS.get((docs[i]["e"].get("provincia") or [""])[0], "") if docs[i]["e"]["alcance"][0] == "provincial" else "",
        i if docs[i]["e"]["alcance"][0] != "provincial" else 0,
        "".join(chr(0x10FFFF - ord(c)) for c in docs[i].get("v", "")),
        docs[i]["t"]))
    docs = [docs[i] for i in orden]
    for i, d in enumerate(docs):
        d["o"] = "%03d" % i
    grupos = [
        {"id": "alcance", "nombre": "Alcance", "opciones": [{"id": "legajo", "nombre": "Legajo completo"},
                                                           {"id": "nacional", "nombre": "Nacional"},
                                                           {"id": "provincial", "nombre": "Provincial"}]},
        {"id": "provincia", "nombre": "Provincia", "opciones": [{"id": k, "nombre": v} for k, v in sorted(PROVINCIAS.items(), key=lambda x: x[1])]},
    ]
    return docs, grupos, zipurl


# --- Gobierno societario y Títulos de deuda ---------------------------------------------------------------------
def archivo(href):
    """Nombre de la copia local: sin acentos ni signos raros (los PDF de Moody's traen un acento agudo suelto)."""
    base = urllib.parse.unquote(href.rstrip("/").split("/")[-1])
    return slug(base[:-4]) + ".pdf" if base.lower().endswith(".pdf") else None


def previo_o_nuevo(href, inversores, prefijo):
    """Lo que el sitio ya publica como página propia conserva su id (docs-inversores.json); el resto, uno nuevo."""
    por_pagina = {d["s"].rstrip("/").split("/")[-1].lower(): d for d in inversores}
    por_pdf = {d["u"].split("/")[-1].lower(): d for d in inversores}
    base = href.rstrip("/").split("/")[-1].lower()
    previo = por_pdf.get(base) or por_pagina.get(base)
    if previo:
        return {k: previo[k] for k in ("id", "u", "s", "l") if k in previo}
    return {"id": prefijo + slug(archivo(href)[:-4]), "u": href, "l": archivo(href)}


def gobierno(inversores):
    s = bajar_texto(SITIO + "inversores-es/gobierno-societario")
    i = re.compile(r"<h6[^>]*>Composici").search(s).start()
    j = s.find("CONTACTO", i)
    trozo = s[i:j]
    docs = []
    # "Grupo Económico" figura como texto sin enlace; el sitio lo publica como página propia (la declaración de
    # beneficiario final), que se suma con ese título.
    if re.search(r">\s*Grupo Econ[oó]mico\s*<", trozo):
        g = next(d for d in inversores if d["id"] == "grupo-economico")
        docs.append({k: g[k] for k in ("id", "u", "s", "l") if k in g} | {"t": "Composición accionaria: grupo económico"})
    for href, txt in links(trozo):
        if href.lower().endswith(".pdf"):
            d = previo_o_nuevo(href, inversores, "gobierno-")
            d["t"] = "Estatuto" if txt.lower().startswith("estatuto") else txt
            docs.append(d)
    for k, d in enumerate(docs):
        d.update({"c": "inversores", "y": "", "o": "%03d" % k})
    return docs


ROMANOS = {"I": "1", "II": "2", "III": "3"}
MES_N = {m: i + 1 for i, m in enumerate(["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto",
                                         "septiembre", "octubre", "noviembre", "diciembre"])}


def deuda(inversores):
    s = bajar_texto(SITIO + "inversores-es/titulos-de-deuda")
    i = re.compile(r"<h6[^>]*>Calificaciones de Riesgo").search(s).start()
    j = s.find("CONTACTO", i)
    docs, vistos = [], set()
    # Cada bloque es un acordeón (h4) con su lista de enlaces; el h6 de arriba es la sección.
    partes = re.split(r"(<h[46][^>]*>.*?</h[46]>)", s[i:j], flags=re.S)
    seccion = bloque = ""
    for parte in partes:
        m = re.match(r"<h([46])[^>]*>(.*?)</h[46]>", parte, re.S)
        if m:
            texto = html.unescape(re.sub(r"<[^>]+>", "", m.group(2))).strip()
            if m.group(1) == "6":
                seccion = texto
            else:
                bloque = texto
            continue
        # Un mismo enlace partido en dos (<a>Calificación</a><a> Moody's - Diciembre 2023</a>) se junta.
        pares = []
        for href, txt in links(parte):
            if pares and pares[-1][0] == href:
                pares[-1] = (href, (pares[-1][1] + " " + txt).strip())
            else:
                pares.append((href, txt))
        for href, txt in pares:
            if href in vistos:
                continue
            vistos.add(href)
            txt = re.sub(r"\s+", " ", txt.replace("\u2019", "'")).replace(" – ", " - ").strip()
            d = previo_o_nuevo(href, inversores, "deuda-")
            e, anio = {}, ""
            if seccion.lower().startswith("calificaciones"):
                e["tipo"] = ["calificacion"]
                e["calificadora"] = ["moodys" if "moody" in bloque.lower() else "fix"]
                m2 = re.search(r"- (\w+) (\d{4})$", txt)
                anio = m2.group(2)
                orden = "1-%s-%02d" % (9999 - int(anio), 12 - MES_N[m2.group(1).lower()])
                titulo = txt
            elif "prospecto" in bloque.lower():
                e["tipo"] = ["prospecto"]
                anio = re.search(r"\d{4}", txt).group(0)
                orden = "0-%s" % (9999 - int(anio))
                titulo = "Prospecto del Programa Global de ON " + anio
            else:
                clase = bloque.split()[-1]
                e["tipo"] = ["emision"]
                e["clase"] = ["clase-" + ROMANOS[clase]]
                base = txt.split(" - ")[0].strip()
                base = base[0] + base[1:].lower()  # "Suplemento de Precio" -> "Suplemento de precio"
                if base.lower().startswith("calificaci"):
                    base = "Calificación"
                titulo = "%s - Clase %s" % (base, clase)
                orden = "2-%s-%d" % (ROMANOS[clase], len(docs))
            if anio:
                e["anio"] = [anio]
            d.update({"t": titulo, "c": "inversores", "y": anio, "o": orden, "e": e})
            docs.append(d)
    docs.sort(key=lambda d: d["o"])
    for k, d in enumerate(docs):
        d["o"] = "%03d" % k
    anios = sorted({a for d in docs for a in d["e"].get("anio", [])}, reverse=True)
    grupos = [
        {"id": "tipo", "nombre": "Tipo", "opciones": [{"id": "prospecto", "nombre": "Prospectos"},
                                                     {"id": "calificacion", "nombre": "Calificaciones de riesgo"},
                                                     {"id": "emision", "nombre": "Emisiones"}]},
        {"id": "calificadora", "nombre": "Calificadora", "opciones": [{"id": "moodys", "nombre": "Moody's"},
                                                                     {"id": "fix", "nombre": "Fix SCR"}]},
        {"id": "clase", "nombre": "Emisión", "opciones": [{"id": "clase-" + n, "nombre": "Clase " + r} for r, n in ROMANOS.items()]},
        {"id": "anio", "nombre": "Año", "opciones": [{"id": a, "nombre": a} for a in anios]},
    ]
    return docs, grupos


def descargar(url, destino):
    if destino.exists() and destino.stat().st_size > 0:
        return "ya estaba"
    try:
        datos = curl(url)
    except RuntimeError as e:
        return str(e)
    if destino.suffix == ".pdf" and b"%PDF-" not in datos[:1024]:
        return "NO ES PDF"
    destino.write_bytes(datos)
    return "%d KB" % (len(datos) // 1024)


def main():
    inversores = json.loads((AQUI / "docs-inversores.json").read_text())["docs"]
    fin = financiera(inversores)
    leg, grupos, zipurl = legajo()
    gob = gobierno(inversores)
    deu, grupos_deuda = deuda(inversores)
    zipnombre = zipurl.split("/")[-1].lower()
    print("Situación financiera: %d · Legajo impositivo: %d · Gobierno societario: %d · Títulos de deuda: %d"
          % (len(fin), len(leg), len(gob), len(deu)))
    if "--sin-bajar" not in sys.argv:
        bajar_todo(fin + gob + deu, leg, zipurl, zipnombre)
    # Sin copia (el PDF original da error), el documento queda sin `l`: la fila y el visor llevan al original con aviso.
    for d in fin + leg + gob + deu:
        if d.get("l") and not (PDF / d["l"]).exists():
            print("  sin copia:", d["id"], d["u"])
            del d["l"]
    (AQUI / "docs-financiera.json").write_text(json.dumps({"docs": fin}, ensure_ascii=False, indent=1) + "\n")
    (AQUI / "docs-legajo.json").write_text(json.dumps({"docs": leg, "grupos": grupos, "zip": {"u": zipurl, "l": zipnombre}},
                                                      ensure_ascii=False, indent=1) + "\n")
    (AQUI / "docs-gobierno.json").write_text(json.dumps({"docs": gob}, ensure_ascii=False, indent=1) + "\n")
    (AQUI / "docs-deuda.json").write_text(json.dumps({"docs": deu, "grupos": grupos_deuda}, ensure_ascii=False, indent=1) + "\n")


def bajar_todo(fin, leg, zipurl, zipnombre):
    ARCHIVOS.mkdir(exist_ok=True)
    tareas = [(d["u"], PDF / d["l"]) for d in fin + leg if d.get("l")] + [(zipurl, ARCHIVOS / zipnombre)]
    with ThreadPoolExecutor(2) as ex:  # el servidor corta con muchos pedidos a la vez
        for (u, dest), r in zip(tareas, ex.map(lambda t: descargar(*t), tareas)):
            if r != "ya estaba":
                print(" ", dest.name, r)


if __name__ == "__main__":
    main()
