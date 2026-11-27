"""Entorno de estudio para los reflejos de la bolsa: un HDRI equirectangular achicado a 128 x 64.

    blender -b --factory-startup --python estudio.py -- estudio_1k.hdr ../estudio.hdr 128 64

El material de la bolsa no tiene barniz y su brillo es difuso: con 128 x 64 alcanza (23 KB comprimido).
"""
import bpy, sys
a = sys.argv[sys.argv.index("--") + 1:]
img = bpy.data.images.load(a[0])
img.scale(int(a[2]), int(a[3]))
img.filepath_raw = a[1]
img.file_format = "HDR"
img.save()
print("estudio:", a[1], img.size[:])
