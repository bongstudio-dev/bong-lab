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
    descripcion: z.array(z.string()),
    recomendaciones: z.array(z.string()),
    cultivos: z.array(z.string()),
    documentos: z.array(z.object({ titulo: z.string(), ruta: z.string(), fuente: z.url(), tipo: z.string() })),
    galeria: z.array(z.object({ titulo: z.string(), ruta: z.string() })).default([]),
    enlaces: z.array(z.object({ titulo: z.string(), url: z.union([z.url(), z.string().regex(/^productos\/[a-z0-9-]+\/$/)]), tipo: z.string() })),
  }),
});

export const collections = { productos };
