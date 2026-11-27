"""Relieve del film de la bolsa: normal map repetible (se repite sin costura).

    blender -b --factory-startup --python relieve.py -- relieve.png 512
    cwebp -q 85 -m 6 -resize 256 256 relieve.png -o ../relieve.webp

En la ficha se repite 4 x 6 veces sobre la etiqueta (tejas de unos 15 cm) con normalScale 0.15.

Dos capas de ruido filtrado por frecuencia (FFT, asi el borde empalma solo):
arrugas largas, casi verticales, como el film estirado por el peso; y un granulado fino del plastico.
"""
import bpy, sys
import numpy as np

argv = sys.argv[sys.argv.index("--") + 1:]
SALIDA = argv[0]
N = int(argv[1]) if len(argv) > 1 else 512
rng = np.random.default_rng(int(argv[2]) if len(argv) > 2 else 7)

fx = np.fft.fftfreq(N)[None, :] * N
fy = np.fft.fftfreq(N)[:, None] * N

def capa(f0, ancho, estira_y, giro=0.0):
    """Ruido con energia alrededor de la frecuencia f0 (ciclos por tile); estira_y > 1 alarga en vertical."""
    c, s = np.cos(giro), np.sin(giro)
    u = c * fx - s * fy
    v = (s * fx + c * fy) * estira_y
    r = np.sqrt(u * u + v * v)
    filtro = np.exp(-((r - f0) / ancho) ** 2)
    filtro[0, 0] = 0
    ruido = rng.standard_normal((N, N)) + 1j * rng.standard_normal((N, N))
    h = np.real(np.fft.ifft2(np.fft.fft2(ruido.real) * filtro))
    return h / (np.abs(h).max() + 1e-9)

# Arrugas: crestas marcadas (valor absoluto = pliegue en V), largas en vertical.
arrugas = 1 - np.abs(capa(3.0, 2.0, 3.5, 0.12))
arrugas = arrugas ** 3
granulado = capa(70.0, 30.0, 1.0)
altura = 1.0 * arrugas + 0.06 * granulado

# Altura a normales (diferencias centrales con vuelta, para que empalme).
fuerza = 6.0
dx = (np.roll(altura, -1, 1) - np.roll(altura, 1, 1)) * 0.5 * fuerza
dy = (np.roll(altura, -1, 0) - np.roll(altura, 1, 0)) * 0.5 * fuerza
nz = np.ones_like(dx)
L = np.sqrt(dx * dx + dy * dy + nz * nz)
# Convencion OpenGL (la de three.js): verde hacia arriba.
rgb = np.stack([-dx / L, dy / L, nz / L], -1) * 0.5 + 0.5

img = bpy.data.images.new("relieve", N, N, alpha=False)
img.colorspace_settings.name = "Non-Color"
px = np.concatenate([rgb, np.ones((N, N, 1))], -1).astype(np.float32)
img.pixels.foreach_set(px.ravel())
img.filepath_raw = SALIDA
img.file_format = "PNG"
img.save()
print("relieve:", SALIDA, "inclinacion media", float(np.degrees(np.arctan(np.sqrt(dx*dx+dy*dy))).mean()))
