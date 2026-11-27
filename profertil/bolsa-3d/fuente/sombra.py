"""Sombra horneada de la bolsa: oclusión ambiental de bolsa.glb en un segundo UV, y la malla nueva que la lleva.

    blender -b --factory-startup --python sombra.py -- ../bolsa.glb ../bolsa-horneada.glb sombra.png
    cwebp -q 80 -m 6 -resize 512 512 sombra.png -o ../sombra.webp

El UV de la etiqueta se repite en dorso y fuelles, así que la sombra va a un UV propio ("Horneado",
TEXCOORD_1 en el GLB: en three.js, aoMap con channel = 1). Un piso entra en el horneado para oscurecer
la base donde apoya, pero no se exporta. La malla se guarda con 11 bits para los UV y 13 para las
posiciones: a la resolución de la piel web (1144 px) la etiqueta se corre medio píxel como mucho.
Argumentos opcionales después de la salida de la sombra: lado en px, bits de UV, nivel de Draco, bits de posición.
"""
import bpy, sys

argv = sys.argv[sys.argv.index("--") + 1:]
ENTRADA, SALIDA, AO = argv[0], argv[1], argv[2]
LADO = int(argv[3]) if len(argv) > 3 else 1024
Q_UV = int(argv[4]) if len(argv) > 4 else 11
NIVEL = int(argv[5]) if len(argv) > 5 else 7
Q_POS = int(argv[6]) if len(argv) > 6 else 13

for o in list(bpy.data.objects):
    bpy.data.objects.remove(o)
bpy.ops.import_scene.gltf(filepath=ENTRADA)
mallas = [o for o in bpy.context.scene.objects if o.type == "MESH"]
print("mallas:", [(o.name, len(o.data.polygons)) for o in mallas])

# Todo en una malla: un solo mapa de sombra.
bpy.ops.object.select_all(action="DESELECT")
for o in mallas:
    o.select_set(True)
bpy.context.view_layer.objects.active = mallas[0]
if len(mallas) > 1:
    bpy.ops.object.join()
bolsa = bpy.context.view_layer.objects.active
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
bolsa.name = "bolsa"

uv0 = bolsa.data.uv_layers[0].name
horneado = bolsa.data.uv_layers.new(name="Horneado")
bolsa.data.uv_layers.active = horneado
bpy.ops.object.mode_set(mode="EDIT")
bpy.ops.mesh.select_all(action="SELECT")
bpy.ops.uv.smart_project(angle_limit=1.15, island_margin=0.004, area_weight=0.0, scale_to_bounds=True)
bpy.ops.object.mode_set(mode="OBJECT")
# El de la etiqueta sigue siendo el que se ve.
bolsa.data.uv_layers[uv0].active_render = True

# Piso para que la base se oscurezca donde apoya.
bpy.ops.mesh.primitive_plane_add(size=4, location=(0, 0, bolsa.bound_box[0][2] - 0.0005))
piso = bpy.context.active_object

img = bpy.data.images.new("ao", LADO, LADO, alpha=False, float_buffer=False)
img.colorspace_settings.name = "Non-Color"
for m in bolsa.data.materials:
    m.use_nodes = True
    n = m.node_tree.nodes.new("ShaderNodeTexImage")
    n.image = img
    m.node_tree.nodes.active = n

esc = bpy.context.scene
esc.render.engine = "CYCLES"
esc.cycles.device = "CPU"
esc.cycles.samples = 256
esc.world = esc.world or bpy.data.worlds.new("w")
esc.render.bake.margin = 8
esc.render.bake.use_selected_to_active = False
bpy.ops.object.select_all(action="DESELECT")
bolsa.select_set(True)
bpy.context.view_layer.objects.active = bolsa
# Distancia corta: pliegues, fuelle y base, no la bolsa entera.
esc.world.light_settings.distance = 0.12
bpy.ops.object.bake(type="AO")
img.filepath_raw = AO
img.file_format = "PNG"
img.save()
print("AO:", AO)

# Sacar los nodos de horneado y el piso antes de exportar.
for m in bolsa.data.materials:
    for n in [n for n in m.node_tree.nodes if n.type == "TEX_IMAGE"]:
        m.node_tree.nodes.remove(n)
bpy.data.objects.remove(piso)

bpy.ops.object.select_all(action="DESELECT")
bolsa.select_set(True)
bpy.ops.export_scene.gltf(
    filepath=SALIDA, export_format="GLB", use_selection=True, export_yup=True,
    export_normals=True, export_texcoords=True, export_materials="EXPORT",
    export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=NIVEL,
    export_draco_position_quantization=Q_POS, export_draco_normal_quantization=10,
    export_draco_texcoord_quantization=Q_UV,
)
print("GLB:", SALIDA)
