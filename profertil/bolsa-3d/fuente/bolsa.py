"""Bolsa base de fertilizante (fuelle lateral) para la web.

Se corre sin interfaz:
    blender -b --factory-startup --python bolsa.py -- ../bolsa.glb

Arma la malla por código (frente, fuelles, dorso y sellos), con un UV pensado
para que la etiqueta sea una sola imagen intercambiable (lienzo de
2288 x 3840 px, ver etiqueta.js):
    u 0-1536 px     frente (el dorso repite el frente)
    u 1536-2288 px  fuelle (los dos fuelles repiten la misma franja)
El arte se reparte por largo de superficie, como un film impreso: a lo ancho
según el largo de arco de cada fila y a lo alto según el largo de las
columnas, del sello de arriba a la base (una v por fila, filas derechas). Cada tramo usa el alto entero del
lienzo, sin relleno ni recorte, y su ancho en px sale de la proporción de la
superficie, así un cuadrado del arte queda cuadrado sobre la bolsa.
Con --medir imprime esa proporción y cuánto se aparta cada celda del cuadrado:
    blender -b --factory-startup --python bolsa.py -- ../bolsa.glb --medir
El sello de arriba lleva la primera fila del arte (el film impreso sigue\nadentro del sello); la tapa del fondo va con su propio material, sin etiqueta.
"""
import bpy, bmesh, math, sys

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
SALIDA = argv[0] if argv else "bolsa.glb"

# Medidas en metros, calcadas de las fotos de producto (silueta y etiqueta
# superpuestas a la foto en la misma cámara).
W = 0.40      # ancho del frente
D = 0.193     # ancho del fuelle desplegado
H = 0.928     # alto del cuerpo
SELLO = 0.012 # alto del sello de arriba
NF, NG, NV = 60, 26, 130   # divisiones: frente, fuelle, alto

# Fondo cerrado: el fuelle llega abierto hasta abajo y el film dobla hacia la
# base en un redondeo de alto FONDO_Z; el frente se mete FONDO_B y los
# costados FONDO_A. Una tapa plana cierra la base.
FONDO_Z, FONDO_A, FONDO_B = 0.065, 0.026, 0.071
# Arriba el fuelle se pliega hacia el sello desde ARRIBA_T antes del final.
ARRIBA_T, ARRIBA_EXP = 0.38, 0.94
# Hombro de la bolsa llena: ensancha frente (HOMBRO_A) y fuelle (HOMBRO_B)
# alrededor de la altura HOMBRO_T.
HOMBRO_A, HOMBRO_B, HOMBRO_T, HOMBRO_S = 0.06, 0.015, 0.49, 0.20

# Lienzo de la etiqueta en px (ver etiqueta.js). Cada tramo ocupa el lienzo
# entero de alto; el ancho de cada uno sale de la proporción de su superficie,
# así un cuadrado del arte queda cuadrado sobre la bolsa.
FRENTE_PX, FUELLE_PX, ALTO_PX = 1536, 752, 3840
U_FRENTE = FRENTE_PX / (FRENTE_PX + FUELLE_PX)
MEDIR = "--medir" in argv

def suave(x):
    x = min(1.0, max(0.0, x))
    return x * x * (3 - 2 * x)

def apertura(t):
    """Cuánto se abre el fuelle a cada altura (0 cerrado, 1 abierto)."""
    return suave((1 - t) / ARRIBA_T) ** ARRIBA_EXP

def fondo(t):
    """Cuánto se mete el film hacia la base (0 arriba del redondeo, 1 en el piso)."""
    q = max(0.0, 1 - t * H / FONDO_Z)
    return 1 - math.sqrt(max(0.0, 1 - q * q))

# ---------- pliegues del film ----------
# Cada cara se deforma a lo largo de su normal (hacia afuera +). Las medidas
# van en metros sobre la cara desplegada: x a lo ancho, z de abajo hacia arriba.
# Todo se apaga sobre las aristas para que el contorno no se mueva.

def cresta(d, w):
    return math.exp(-(d / w) ** 2)

def a_segmento(x, z, x0, z0, x1, z1):
    """Distancia del punto al segmento y posición a lo largo (0-1)."""
    dx, dz = x1 - x0, z1 - z0
    k = max(0.0, min(1.0, ((x - x0) * dx + (z - z0) * dz) / (dx * dx + dz * dz)))
    return math.hypot(x - (x0 + k * dx), z - (z0 + k * dz)), k

def arruga(x, z, x0, z0, x1, z1, alto, ancho):
    """Una arruga recta que se afina hacia las puntas."""
    d, k = a_segmento(x, z, x0, z0, x1, z1)
    return alto * cresta(d, ancho) * math.sin(math.pi * k) ** 0.5

def ondas(x, z, fase):
    """Ondulación del film: dos frecuencias largas, nada de ruido fino."""
    return (0.6 * math.sin(2 * math.pi * (x / 0.23 + z / 0.37) + fase)
            + 0.4 * math.sin(2 * math.pi * (-x / 0.17 + z / 0.29) + 1.7 * fase))

def pliegues_cara(s, t, ancho, lado):
    """Frente (lado 0) y dorso (lado 1). s va de una arista a la otra."""
    x, z = s * ancho, t * H
    borde = math.sin(math.pi * s) ** 0.6
    d = 0.0026 * ondas(x, z, 0.9 + 2.3 * lado)
    # tensiones que bajan en diagonal desde las puntas del sello
    d += arruga(x, z, 0.02, H - 0.01, 0.11, H - 0.17, 0.0040, 0.011)
    d += arruga(x, z, ancho - 0.02, H - 0.01, ancho - 0.12, H - 0.15, 0.0034, 0.011)
    # alguna arruga larga y suave en el cuerpo
    if lado == 0:
        d += arruga(x, z, 0.06, 0.30, 0.20, 0.17, 0.0030, 0.016)
        d += arruga(x, z, 0.28, 0.62, 0.36, 0.42, -0.0026, 0.016)
    else:
        d += arruga(x, z, 0.30, 0.28, 0.16, 0.12, 0.0030, 0.016)
    # el borde de abajo ondula donde el film dobla hacia la base
    abajo = math.exp(-z / 0.035)
    d += 0.0040 * abajo * math.sin(2 * math.pi * x / 0.066 + 1.3 * lado)
    d *= borde
    # esquinas de abajo pellizcadas: un filo corto que sube desde la esquina
    for e0, sg in ((0.0, 1), (ancho, -1)):
        d += arruga(x, z, e0, 0.004, e0 + sg * 0.05, 0.075, 0.0038, 0.007) * min(1.0, abs(x - e0) / 0.012)
    return d

def pliegues_fuelle(s, t, lado):
    """s = 0 en la arista del frente, 1 en la del dorso."""
    x, z = s * D, t * H
    borde = math.sin(math.pi * s) ** 0.6
    d = 0.0022 * ondas(x, z, 2.1 + 1.9 * lado)
    # arriba el fuelle se pliega hacia el sello: un filo desde cada punta del sello
    d += arruga(x, z, 0.004, H - 0.004, 0.085, H - 0.21, 0.0050, 0.009)
    d += arruga(x, z, D - 0.004, H - 0.004, D - 0.08, H - 0.19, 0.0040, 0.009)
    # pliegue marcado que cruza el fuelle cerca de la base, con su valle debajo
    zc = 0.050 + 0.016 * (s - 0.5) * (1 if lado == 0 else -1)
    d += 0.0065 * cresta(z - zc, 0.006) - 0.0040 * cresta(z - zc + 0.014, 0.008)
    # un segundo quiebre corto y en diagonal más abajo
    d += arruga(x, z, 0.03, 0.012, 0.13, 0.030, 0.0045, 0.006)
    d *= borde
    return d

def seccion(t):
    g = apertura(t)
    hombro = math.exp(-((t - HOMBRO_T) / HOMBRO_S) ** 2)
    # Junto al sello de arriba el frente y el dorso se aplastan uno contra otro.
    almohada = suave((1 - t) / 0.06)
    a = W / 2 * (1 - 0.03 * g) * (1 + HOMBRO_A * hombro)    # el frente se cierra apenas al llenarse
    b = max(0.003, D / 2 * g * (1 + HOMBRO_B * hombro)) * almohada  # medio espesor de la bolsa
    b = max(b, 0.0012)
    # El fuelle que no se abre queda plegado en V hacia adentro.
    hundir = math.sqrt(max(0.0, (D / 2) ** 2 - b ** 2)) * almohada
    f = fondo(t)
    a -= FONDO_A * f
    b = max(b - FONDO_B * f, 0.004)
    panza = (0.012 + 0.016 * g) * almohada * (1 - f)   # comba del frente
    gpanza = 0.006 * g * (1 - f)
    pts = []  # (x, y, u)
    # frente: y = -b (mira a -Y), x de -a a +a
    for i in range(NF):
        s = i / NF
        x = -a + 2 * a * s
        y = -b - panza * math.sin(math.pi * s) ** 0.55 - pliegues_cara(s, t, 2 * a, 0)
        pts.append((x, y, s * U_FRENTE))
    def pliegue(s):
        v = 1 - abs(2 * s - 1)          # 0 en los bordes, 1 en el pliegue
        return v ** 1.15
    # fuelle derecho: x = +a, y de -b a +b
    for i in range(NG):
        s = i / NG
        x = a + gpanza * math.sin(math.pi * s) - hundir * pliegue(s) + pliegues_fuelle(s, t, 0)
        y = -b + 2 * b * s
        pts.append((x, y, U_FRENTE + s * (1 - U_FRENTE)))
    # dorso: y = +b, x de +a a -a
    for i in range(NF):
        s = i / NF
        x = a - 2 * a * s
        y = b + panza * math.sin(math.pi * s) ** 0.55 + pliegues_cara(s, t, 2 * a, 1)
        pts.append((x, y, s * U_FRENTE))
    # fuelle izquierdo: x = -a, y de +b a -b
    for i in range(NG):
        s = i / NG
        x = -a - gpanza * math.sin(math.pi * s) + hundir * pliegue(s) - pliegues_fuelle(1 - s, t, 1)
        y = b - 2 * b * s
        pts.append((x, y, U_FRENTE + s * (1 - U_FRENTE)))
    return pts

bpy.ops.wm.read_factory_settings(use_empty=True)

def material(nombre, color, rugosidad):
    m = bpy.data.materials.new(nombre)
    m.use_nodes = True
    p = next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    p.inputs["Base Color"].default_value = color
    p.inputs["Roughness"].default_value = rugosidad
    return m

m_etq = material("etiqueta", (1, 1, 1, 1), 0.42)
m_sello = material("sello", (0.92, 0.93, 0.94, 1), 0.5)

# ---------- cuerpo ----------
bm = bmesh.new()
uv = bm.loops.layers.uv.new("UVMap")
# filas parejas, más densas en los 12 cm de abajo (redondeo del fondo y pliegues)
alturas = sorted(set([round(j / NV, 5) for j in range(NV + 1)] + [round(0.004 * k / H, 5) for k in range(30)]))
filas = []
for t in alturas:
    filas.append([(bm.verts.new((x, y, t * H)), u) for (x, y, u) in seccion(t)])
N = len(filas[0])
NR = len(alturas)

# Tramos de cada fila: (primer índice, cantidad, u inicial, u final)
TRAMOS = ((0, NF, 0.0, U_FRENTE), (NF, NG, U_FRENTE, 1.0),
          (NF + NG, NF, 0.0, U_FRENTE), (2 * NF + NG, NG, U_FRENTE, 1.0))
def tramo_de(i):
    for k, (i0, n, _, _) in enumerate(TRAMOS):
        if i0 <= i < i0 + n:
            return k

# a lo ancho: largo de arco acumulado de cada tramo, fila por fila
s_fila = []      # s_fila[j][k][m] = 0-1 dentro del tramo k, m = 0..n
anchos = [[] for _ in TRAMOS]
for fila in filas:
    por_tramo = []
    for k, (i0, n, _, _) in enumerate(TRAMOS):
        acum = [0.0]
        for m in range(n):
            p0 = fila[(i0 + m) % N][0].co
            p1 = fila[(i0 + m + 1) % N][0].co
            acum.append(acum[-1] + (p1 - p0).length)
        anchos[k].append(acum[-1])
        por_tramo.append([a / acum[-1] for a in acum])
    s_fila.append(por_tramo)

# a lo alto: largo acumulado de cada columna desde el sello de arriba
desde_arriba = [[0.0] * N for _ in range(NR)]
for j in range(NR - 2, -1, -1):
    for i in range(N):
        desde_arriba[j][i] = desde_arriba[j + 1][i] + (filas[j + 1][i][0].co - filas[j][i][0].co).length

def mediana(xs):
    xs = sorted(xs)
    return xs[len(xs) // 2]

# a lo alto, una sola v por fila y tramo: el promedio del largo de cada columna
# desde el sello, relativo al largo total de esa columna. Así las filas del
# arte quedan derechas aunque una columna sea más larga que otra (el pliegue
# en V del fuelle alarga la del centro) y el arte llega justo del sello a la base.
v_fila = []
for k, (i0, n, _, _) in enumerate(TRAMOS):
    cols = [(i0 + m) % N for m in range(n + 1)]
    v_fila.append([1 - sum(desde_arriba[j][i] / desde_arriba[0][i] for i in cols) / len(cols) for j in range(NR)])

def uv_de(j, i, k, m):
    """UV del vértice (fila j, columna i) visto desde el tramo k, posición m.
    u: largo de arco dentro del tramo; v: largo desde el sello (por fila)."""
    i0, n, u0, u1 = TRAMOS[k]
    uu = u0 + (u1 - u0) * s_fila[j][k][m]
    return (uu, v_fila[k][j])

for j in range(NR - 1):
    for i in range(N):
        k = tramo_de(i)
        m = i - TRAMOS[k][0]
        i1 = (i + 1) % N
        a, b = filas[j][i][0], filas[j][i1][0]
        c, d = filas[j + 1][i1][0], filas[j + 1][i][0]
        cara = bm.faces.new((a, b, c, d))
        esquinas = (uv_de(j, i, k, m), uv_de(j, i1, k, m + 1),
                    uv_de(j + 1, i1, k, m + 1), uv_de(j + 1, i, k, m))
        for lp, q in zip(cara.loops, esquinas):
            lp[uv].uv = q
if MEDIR:
    # Proporción de la superficie de cada tramo y lienzo que le corresponde.
    LARGO = [mediana([desde_arriba[0][TRAMOS[k][0] + m] for m in range(TRAMOS[k][1])]) for k in range(4)]
    for k, nombre in enumerate(("frente", "fuelle der", "dorso", "fuelle izq")):
        an = mediana(anchos[k])
        print("%s: ancho %.4f m, largo %.4f m -> %d px de ancho para %d de alto (%.2f px/mm)" % (
            nombre, an, LARGO[k], round(ALTO_PX * an / LARGO[k]), ALTO_PX, ALTO_PX / LARGO[k] / 1000))
    # Celda sobre la bolsa: ancho / alto de un cuadrado del lienzo, cara por cara.
    TOT = FRENTE_PX + FUELLE_PX
    def stats(zona):
        for k, nombre in enumerate(("frente", "fuelle der", "dorso", "fuelle izq")):
            i0, n, u0, u1 = TRAMOS[k]
            rs = []
            for j in range(NR - 1):
                z = filas[j][0][0].co.z
                if not zona(z):
                    continue
                for m in range(n):
                    i, i1 = (i0 + m) % N, (i0 + m + 1) % N
                    pa, pb, pd = filas[j][i][0].co, filas[j][i1][0].co, filas[j + 1][i][0].co
                    ua, ub = uv_de(j, i, k, m), uv_de(j, i1, k, m + 1)
                    ud = uv_de(j + 1, i, k, m)
                    h = (pb - pa).length / max(1e-9, abs(ub[0] - ua[0]) * TOT)
                    v = (pd - pa).length / max(1e-9, abs(ud[1] - ua[1]) * ALTO_PX)
                    rs.append((h / v, (pb - pa).length * (pd - pa).length))
            rs.sort()
            tot = sum(w for _, w in rs); acc = 0; q = {}
            for r, w in rs:
                acc += w
                for p in (0.05, 0.5, 0.95):
                    if p not in q and acc >= p * tot:
                        q[p] = r
            print("  %-10s celda ancho/alto  p5 %.3f  mediana %.3f  p95 %.3f" % (nombre, q[0.05], q[0.5], q[0.95]))
    print("toda la superficie:"); stats(lambda z: True)
    print("cuerpo (sin los 8 cm de abajo ni los 8 de arriba):"); stats(lambda z: 0.08 < z < H - 0.08)
# tapa del fondo (el sello de abajo queda doblado debajo, no se ve)
tapa = bm.faces.new([v for v, _ in filas[0]][::-1])
tapa.material_index = 1
for lp in tapa.loops:
    lp[uv].uv = (0.5, 0.5)
cuerpo = bpy.data.meshes.new("cuerpo")
bm.to_mesh(cuerpo); bm.free()
cuerpo.materials.append(m_etq)
cuerpo.materials.append(m_sello)
for p in cuerpo.polygons:
    p.use_smooth = True
ob = bpy.data.objects.new("bolsa", cuerpo)
bpy.context.scene.collection.objects.link(ob)

# ---------- sellos ----------
def sello(z0, z1, a):
    bm = bmesh.new()
    uvl = bm.loops.layers.uv.new("UVMap")
    nx, nz = 48, 8
    g = 0.0012
    vs = []
    for j in range(nz + 1):
        z = z0 + (z1 - z0) * j / nz
        fila = []
        for i in range(nx + 1):
            x = -a + 2 * a * i / nx
            # estrías del termosellado
            e = 0.0006 * math.sin((z - z0) / 0.0035 * 2 * math.pi)
            fila.append((bm.verts.new((x, -g - e, z)), bm.verts.new((x, g + e, z))))
        vs.append(fila)
    for j in range(nz):
        for i in range(nx):
            for lado in (0, 1):
                q = (vs[j][i][lado], vs[j][i + 1][lado], vs[j + 1][i + 1][lado], vs[j + 1][i][lado])
                f = bm.faces.new(q if lado else q[::-1])
                # el film impreso sigue dentro del sello: toma la primera fila del arte
                for lp in f.loops:
                    s = (lp.vert.co.x + a) / (2 * a)
                    lp[uvl].uv = ((s if lado == 0 else 1 - s) * U_FRENTE, 1 - 0.5 / ALTO_PX)  # v de Blender: 1 es arriba
    bm.normal_update()
    me = bpy.data.meshes.new("sello")
    bm.to_mesh(me); bm.free()
    me.materials.append(m_etq)
    for p in me.polygons:
        p.use_smooth = True
    return me

a_sello = W / 2 * 0.995
for nombre, z0, z1 in (("sello_arriba", H - 0.0015, H + SELLO),):
    o = bpy.data.objects.new(nombre, sello(z0, z1, a_sello))
    o.parent = ob
    bpy.context.scene.collection.objects.link(o)


bpy.ops.object.select_all(action="SELECT")
bpy.ops.export_scene.gltf(
    filepath=SALIDA,
    export_format="GLB",
    use_selection=True,
    export_yup=True,
    export_normals=True,
    export_texcoords=True,
    export_materials="EXPORT",
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=7,
    export_draco_position_quantization=14,
    export_draco_normal_quantization=10,
    export_draco_texcoord_quantization=12,
)
print("GLB:", SALIDA)
