# Animadores de texto

Un juego único de animaciones de texto para todas las páginas de Bong (primero
Profertil). Cada animador tiene nombre, uso y valores fijos, para no inventar
una animación distinta en cada página.

- `animadores.css` y `animadores.js`: la librería. Sin dependencias.
- `index.html`: el probador. Cada animador con su ficha, a distintos tamaños,
  fondos y velocidades (0,2x para revisar la curva en cámara lenta), más un
  laboratorio para combinar efecto, unidad y dirección.

Levantar (abierto como `file://` no cargan las fuentes):

```bash
python3 -m http.server 8791
```

## Uso en una página

```html
<link rel="stylesheet" href="animadores.css">
<script src="animadores.js" defer></script>

<h1 data-anim="sube">Damos vida a la tierra</h1>
<p data-anim="persiana">Párrafo destacado…</p>
<h1 data-anim="relevo" data-palabras="el trigo|el maíz|la soja">Nutrimos {}</h1>
<strong data-anim="cifra">60%</strong>
```

Arrancan solos al entrar en pantalla. Atributos para pisar el animador:
`data-por` (letra, palabra, linea, bloque), `data-desde` (abajo, arriba, izq,
der), `data-dur`, `data-paso` (ms entre partes), `data-dist`, `data-disparo`
(vista, carga, manual). Desde JS: `Animadores.repetir(el)`.

## Animadores

| Nombre | Para |
|---|---|
| sube | Titulares y hero (el de la home) |
| ventana | Títulos grandes, aperturas de sección |
| desliza | Listas, menús, textos que entran de costado |
| enfoque | Frases de marca, hero sobre foto |
| asoma | Subtítulos, bajadas, llamados cortos |
| funde | Cuerpo de texto (el piso seguro) |
| persiana | Párrafos destacados y citas, línea por línea |
| grano | Palabras sueltas, letra por letra |
| cortina | Títulos de sección sobre color plano |
| maquina | Buscadores y datos técnicos |
| enciende | Manifiesto o propósito, atado al scroll |
| relevo | Hero con una palabra que cambia |
| cifra | Números que cuentan hasta su valor |
| marquesina | Franjas en loop |

Reglas (skill `animate`): solo `transform`, `opacity`, `filter` y `clip-path`;
nunca desde escala 0; curva base del Master `cubic-bezier(0.22, 1, 0.36, 1)`;
escalonado de 18 a 90 ms; con movimiento reducido todo entra fundido.

Publicado en Bong Lab (07/10/2026): https://bongstudio-dev.github.io/bong-lab/profertil/animadores-texto/
