# Facturas Bong · Auditoría de UI y propuesta de editor in situ

Fecha: 11/11/2026. Alcance: [facturas.bongstudio.ar](https://facturas.bongstudio.ar).

**Fuente.** La auditoría se basa en la documentación de Notion: *Facturas Bong - app para facturar* y *Facturas Bong · Operación y carga de comprobantes*. El código (`~/Documents/Desarrollo/bong-facturas`) está solo en la Mac y no tiene repo en GitHub. La app en vivo está detrás de Cloudflare Access. Por eso no se tocó producción: el prototipo de este directorio es la propuesta funcional para portar a `public/`.

Prototipo: `bong/facturas-editor/index.html`. Usa datos de ejemplo, no datos reales del estudio.

---

## 1. Hallazgos

| # | Tema | Hoy (según la doc) | Problema | Severidad |
|---|------|--------------------|----------|-----------|
| 1 | Edición sobre la hoja | Clic en un valor de la hoja, se abre un cuadro, se cambia el dato y hay que tocar **Aplicar**. | Tres pasos para cambiar un número. El popup tapa la hoja y no se ve el resultado mientras se escribe. | Alta |
| 2 | Dos lugares para editar | Barra lateral con todos los campos más la hoja editable. | No queda claro cuál manda. La doc tiene que aclarar que los dos lados se actualizan. | Alta |
| 3 | Campos que no están en la hoja | "Para un campo que todavía no aparece en la hoja, usar la barra lateral." | Los campos vacíos desaparecen de la vista previa y no hay forma de agregarlos ahí. | Media |
| 4 | Ítems | Se agregan, quitan y reordenan desde la barra lateral. | Reordenar desde un formulario es lento. No hay arrastre ni acciones junto a la fila. | Media |
| 5 | Deshacer | No se menciona. | Con guardado automático, un error (borrar un ítem, pisar un perfil) no tiene vuelta atrás salvo el respaldo JSON. | Alta |
| 6 | Estado de guardado | "Esperar **Guardado**". | Si el indicador es chico o lejos del foco, se sale antes de tiempo. Falta aviso al cerrar con cambios sin guardar. | Media |
| 7 | Perfiles | Se guardan y reutilizan. | Al duplicar no queda claro qué perfil quedó elegido ni qué heredó la copia (la propia doc lo pide revisar). | Media |
| 8 | Celular | No documentado. | Una vista previa A4 al lado de una barra lateral no entra en 390 px. Probable doble scroll. | Media |
| 9 | Teclado | No documentado. | Para cargar varias facturas seguidas hace falta Tab entre campos, Enter para confirmar y Esc para descartar. | Baja |
| 10 | Home | Lista con búsqueda, resumen del año y selector de estado por fila. | El resumen usa solo la moneda más usada: lo facturado en otras monedas no aparece. | Media |
| 11 | Home | Estado por selector. | Un `<select>` por fila es lento para escanear. Mejor una pastilla de color que se cambia con un clic. | Baja |
| 12 | Vencimiento | No hay. | Sin fecha de vencimiento no se puede marcar "vencida" en la lista de por cobrar. | Media |

## 2. Propuesta: editor in situ estilo Framer

Todo lo que sale impreso se edita encima de la hoja, sin cuadros de diálogo.

- **Hover**: contorno azul fino y etiqueta con el nombre del campo ("Ítem 2 · Precio unitario").
- **Clic**: el texto queda editable ahí mismo, con contorno de selección. Lo que se escribe recalcula importes y total en vivo. No hay botón **Aplicar**.
- **Teclado**: `Tab` y `Shift+Tab` recorren los campos en orden de lectura. `Enter` confirma. En textos largos `Enter` hace salto de línea y `⌘Enter` confirma. `Esc` descarta lo escrito en ese campo.
- **Barra contextual** bajo la selección, sin tapar el campo:
  - Ítem: subir, bajar, duplicar, agregar debajo, quitar.
  - Moneda: USD, EUR, ARS e idioma ES/EN en la misma barra.
  - Fechas: selector nativo más atajos *Hoy*, *+15 días*, *+30 días* para el vencimiento.
- **Ítems**: manija a la izquierda de cada fila para arrastrar y reordenar, con línea de destino. Botón *Agregar ítem* al pie de la tabla, que no sale en el PDF.
- **Campos vacíos**: se ven en pantalla con un texto guía gris ("Condiciones, agradecimiento…") y no salen en el PDF. Así se resuelve el hallazgo 3 sin barra lateral.
- **Capas** (izquierda): la estructura de la hoja con los ítems por nombre. Un clic lleva al bloque y lo selecciona.
- **Inspector** (derecha): muestra solo lo del elemento seleccionado. Con nada seleccionado muestra el documento (número, fechas, moneda, idioma, total). Con un proveedor o cliente seleccionado ofrece los perfiles guardados y *Guardar como perfil*. Es un panel fijo, no un popup, y se sincroniza con la hoja en los dos sentidos.
- **Barra superior**: número y cliente con el total, estado en tres botones con color (Borrador, Enviada, Cobrada), indicador *Guardando… / Guardado*, zoom, deshacer y rehacer (`⌘Z`, `⇧⌘Z`) y *Descargar PDF*.
- **Celular**: las capas pasan a una tira de chips con un botón *Acercar*. El inspector queda anclado abajo, plegado, y se abre con la flecha. Se edita tocando el texto de la hoja.
- **PDF**: solo la hoja A4, sin contornos, manijas ni textos guía, con el nombre de archivo ya armado.

## 3. Cómo portarlo a `bong-facturas`

1. Copiar el CSS y el script del prototipo a `public/`. El modelo del prototipo (`numero`, `fecha`, `vencimiento`, `idioma`, `moneda`, `estado`, `emisor`, `cliente`, `items[{desc, detalle, cant, precio}]`, `pago`, `notas`) hay que mapearlo a los nombres reales de la ficha.
2. Reemplazar `guardar()` (hoy `localStorage`) por `PUT /api/facturas/<id>` con debounce de 500 ms. El cambio de estado va por `PATCH /api/facturas/<id>/estado`. Los perfiles van a `datos:emisores` y `datos:clientes`.
3. Si se agrega `vencimiento`, sumarlo a los metadatos del listado de KV para poder marcar facturas vencidas.
4. Quitar el popup de *Aplicar* y la duplicación de campos de la barra lateral actual: el inspector la reemplaza.
5. Probar con `npx wrangler dev --var LOCAL:1` en escritorio y en un celular real antes de `npx wrangler deploy`.

## 4. Pendientes para la home

- Resumen por moneda (una fila por USD, EUR y ARS) en lugar de solo la más usada.
- Estado como pastilla de color que se cambia con un clic. Filtros rápidos *Por cobrar*, *Vencidas* y *Cobradas*.
- Columna de vencimiento, con las vencidas en rojo arriba de todo.
- Atajo `N` para *Nueva factura* y `/` para buscar.
