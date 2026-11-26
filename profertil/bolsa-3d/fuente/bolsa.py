"""Bolsa base de fertilizante (fuelle lateral) para la web.

Se corre sin interfaz:
    blender -b --factory-startup --python bolsa.py -- ../bolsa.glb

Arma la malla por código (frente, fuelles, dorso y sellos), con un UV pensado
para que la etiqueta sea una sola imagen intercambiable:
    u 0.00-0.75  frente (el dorso repite el frente)
    u 0.75-1.00  fuelle (los dos fuelles repiten la misma franja)
    v 0-1        alto del cuerpo, de abajo hacia arriba
Los sellos de arriba y abajo llevan su propio material, sin etiqueta.
"""
import bpy, bmesh, math, sys

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
SALIDA = argv[0] if argv else "bolsa.glb"

# Medidas en metros, calcadas de las fotos de producto: el frente mide unas
# 2,4 veces su ancho de alto y el fuelle abierto, la mitad del frente.
W = 0.40      # ancho del frente
D = 0.21      # ancho del fuelle desplegado
H = 0.92      # alto del cuerpo
SELLO = 0.012 # alto de cada sello
NF, NG, NV = 44, 18, 110   # divisiones: frente, fuelle, alto

U_FRENTE = 0.75

def suave(x):
    x = min(1.0, max(0.0, x))
    return x * x * (3 - 2 * x)

def apertura(t):
    """Cuánto se abre el fuelle a cada altura (0 cerrado, 1 abierto).
    Como en la bolsa llena: abajo se cierra en un tramo corto, arriba el fuelle
    se va plegando hacia adentro desde la mitad hasta el sello."""
    abajo = suave(t / 0.09) ** 0.55
    arriba = suave((1 - t) / 0.50) ** 0.75
    return abajo * arriba

def arruga(s, t, lado):
    """Ondulación suave del film: pocas frecuencias, nada de ruido fino."""
    return math.sin(t * 19.0 + s * 3.1 + lado) * 0.5 + math.sin(t * 7.3 - s * 5.7 + lado * 2.0) * 0.5

def seccion(t):
    g = apertura(t)
    # Junto a los sellos el frente y el dorso se aplastan uno contra otro.
    almohada = suave(t / 0.035) * suave((1 - t) / 0.06)
    a = W / 2 * (1 - 0.03 * g)                    # el frente se cierra apenas al llenarse
    b = max(0.003, D / 2 * g) * almohada          # medio espesor de la bolsa
    b = max(b, 0.0012)
    # El fuelle que no se abre queda plegado en V hacia adentro.
    hundir = math.sqrt(max(0.0, (D / 2) ** 2 - b ** 2)) * almohada
    panza = (0.012 + 0.016 * g) * almohada        # comba del frente, mayor en la mitad baja
    gpanza = 0.006 * g
    pts = []  # (x, y, u)
    # frente: y = -b (mira a -Y), x de -a a +a
    for i in range(NF):
        s = i / NF
        x = -a + 2 * a * s
        y = -b - panza * math.sin(math.pi * s) ** 0.55 - 0.0016 * g * arruga(s, t, 0)
        pts.append((x, y, s * U_FRENTE))
    def pliegue(s):
        v = 1 - abs(2 * s - 1)          # 0 en los bordes, 1 en el pliegue
        return v ** 1.15
    # fuelle derecho: x = +a, y de -b a +b
    for i in range(NG):
        s = i / NG
        x = a + gpanza * math.sin(math.pi * s) - hundir * pliegue(s)
        y = -b + 2 * b * s
        pts.append((x, y, U_FRENTE + s * (1 - U_FRENTE)))
    # dorso: y = +b, x de +a a -a
    for i in range(NF):
        s = i / NF
        x = a - 2 * a * s
        y = b + panza * math.sin(math.pi * s) ** 0.55 + 0.0016 * g * arruga(s, t, 1.7)
        pts.append((x, y, s * U_FRENTE))
    # fuelle izquierdo: x = -a, y de +b a -b
    for i in range(NG):
        s = i / NG
        x = -a - gpanza * math.sin(math.pi * s) + hundir * pliegue(s)
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
filas = []
for j in range(NV + 1):
    t = j / NV
    z = t * H
    filas.append([(bm.verts.new((x, y, z)), u) for (x, y, u) in seccion(t)])
N = len(filas[0])
for j in range(NV):
    v0, v1 = j / NV, (j + 1) / NV
    for i in range(N):
        k = (i + 1) % N
        a, ua = filas[j][i]
        b, ub = filas[j][k]
        c, uc = filas[j + 1][k]
        d, ud = filas[j + 1][i]
        # costura: al cerrar cada tramo, la u del vértice siguiente se toma como fin de tramo
        if ub < ua:
            ub = uc = U_FRENTE if ua < U_FRENTE else 1.0
        if ub == 0 and ua > 0:
            ub = uc = U_FRENTE
        cara = bm.faces.new((a, b, c, d))
        for lp, (uu, vv) in zip(cara.loops, ((ua, v0), (ub, v0), (uc, v1), (ud, v1))):
            lp[uv].uv = (uu, vv)
cuerpo = bpy.data.meshes.new("cuerpo")
bm.to_mesh(cuerpo); bm.free()
cuerpo.materials.append(m_etq)
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
                for lp in f.loops:
                    lp[uvl].uv = (0.5, 0.5)
    bm.normal_update()
    me = bpy.data.meshes.new("sello")
    bm.to_mesh(me); bm.free()
    me.materials.append(m_sello)
    for p in me.polygons:
        p.use_smooth = True
    return me

a_sello = W / 2 * 0.995
for nombre, z0, z1 in (("sello_abajo", -SELLO, 0.0015), ("sello_arriba", H - 0.0015, H + SELLO)):
    o = bpy.data.objects.new(nombre, sello(z0, z1, a_sello))
    o.parent = ob
    bpy.context.scene.collection.objects.link(o)

# apoyar en el piso y centrar
ob.location = (0, 0, SELLO)

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
