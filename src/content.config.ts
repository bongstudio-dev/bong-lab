import { defineCollection } from "astro:content";
import { file } from "astro/loaders";
import { z } from "astro/zod";

const productos = defineCollection({
  loader: file("profertil/productos/fuente/productos.json"),
  schema: z.object({
    nombre: z.string().min(1),
    categoria: z.enum(["Agro", "Industrial"]),
    familia: z.string(),
    fuente: z.url(),
    notaFuente: z.string().optional(),
    archivada: z.boolean().optional(),
    orden: z.number(),
    bajada: z.string(),
    imagen: z.string().nullable(),
    logo: z.string().nullable(),
    caracteristicas: z.array(z.object({ etiqueta: z.string(), valor: z.string() })),
    // Párrafos de la descripción. Además del texto corrido: subtítulo, término en negrita con su explicación, y lista (con viñetas o numerada).
    descripcion: z.array(z.union([
      z.string(),
      z.object({ subtitulo: z.string() }),
      z.object({ termino: z.string(), texto: z.string() }),
      z.object({ lista: z.array(z.union([z.string(), z.object({ termino: z.string(), texto: z.string() })])), numerada: z.boolean().optional() }),
    ])),
    recomendaciones: z.array(z.string()),
    cultivos: z.array(z.string()),
    documentos: z.array(z.object({ titulo: z.string(), ruta: z.string(), fuente: z.url(), tipo: z.string() })),
    galeria: z.array(z.object({ titulo: z.string(), ruta: z.string() })).default([]),
    // Tecnología y producción armada con el sistema (íconos de src/lib/iconos-arnox): reemplaza a la galería de imágenes del sitio actual.
    tecnologia: z.object({
      intro: z.string(),
      requisitos: z.array(z.object({ t: z.string(), b: z.string(), ic: z.string(), color: z.enum(["azul", "verde", "amarillo", "naranja"]) })),
      resultado: z.object({ t: z.string(), ic: z.string() }),
      calidad: z.array(z.object({ t: z.string(), ic: z.string() })),
      produccion: z.object({ cifra: z.string(), unidad: z.string(), t: z.string(), b: z.string(), ic: z.string() }),
    }).optional(),
    enlaces: z.array(z.object({ titulo: z.string(), url: z.union([z.url(), z.string().regex(/^productos\/[a-z0-9-]+\/$/)]), tipo: z.string() })),
  }),
});

export const collections = { productos };
