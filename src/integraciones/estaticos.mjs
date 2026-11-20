// Archivos que se publican tal cual, sin pasar por Astro: la portada del Lab, los experimentos, la librería de
// componentes (con tokens.css, base.css, formas.js y barra-vista.js), el buscador, los PDF y las fotos.
// Mantienen su carpeta y su dirección: lo que está en profertil/formas/ se publica en /bong-lab/profertil/formas/.
//
// - En el build se copian a dist/ después de que Astro escribe sus páginas. Si un archivo choca con una página de
//   Astro, el build se frena (por ejemplo, una nota con el mismo nombre que una carpeta).
// - Después se marca la versión de los CSS y JS locales que cargan las páginas de Astro (?v=<huella>), para que
//   la caché del navegador nunca mezcle una página nueva con un base.css viejo.
// - En `astro dev` se sirven desde su carpeta.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(fileURLToPath(new URL("../../", import.meta.url)));
const ENTRADAS = ["index.html", "favicon.svg", "profertil"];
// Fuentes (plantillas de datos, scripts de preparación) y archivos de trabajo: no se publican.
const FUERA = (nombre) => nombre === "fuente" || nombre === ".DS_Store" || nombre.endsWith(".py") || nombre === "node_modules";

function* recorrer(rel) {
  const abs = path.join(RAIZ, rel);
  const st = fs.statSync(abs, { throwIfNoEntry: false });
  if (!st) return;
  if (st.isDirectory()) {
    for (const n of fs.readdirSync(abs).sort()) if (!FUERA(n)) yield* recorrer(path.join(rel, n));
  } else yield rel;
}

function archivosDe(dir) {
  const out = [];
  (function r(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      e.isDirectory() ? r(p) : out.push(p);
    }
  })(dir);
  return out;
}

const ENLACE = /((?:href|src)=")([^"#?:]+\.(?:css|js))(?:\?v=[0-9a-f]+)?(")/g;
function versionar(html, carpeta) {
  return html.replace(ENLACE, (todo, a, url, b) => {
    const archivo = path.resolve(carpeta, url);
    if (!fs.existsSync(archivo)) return todo;
    const huella = crypto.createHash("md5").update(fs.readFileSync(archivo)).digest("hex").slice(0, 8);
    return a + url + "?v=" + huella + b;
  });
}

const TIPOS = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml",
  ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif",
  ".pdf": "application/pdf", ".mp4": "video/mp4", ".woff2": "font/woff2", ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8", ".glb": "model/gltf-binary",
};

export default function estaticos() {
  let base = "/";
  return {
    name: "bong-lab-estaticos",
    hooks: {
      "astro:config:done": ({ config }) => { base = config.base.replace(/\/?$/, "/"); },
      "astro:server:setup": ({ server }) => {
        server.middlewares.use((req, res, next) => {
          const url = decodeURIComponent((req.url || "").split(/[?#]/)[0]);
          if (!url.startsWith(base)) return next();
          let rel = url.slice(base.length);
          if (rel.split("/").some((p) => p === ".." || (p && FUERA(p)))) return next();
          if (rel === "" || rel.endsWith("/")) rel += "index.html";
          if (!ENTRADAS.some((e) => rel === e || rel.startsWith(e + "/"))) return next();
          const abs = path.join(RAIZ, rel);
          if (!fs.statSync(abs, { throwIfNoEntry: false })?.isFile()) {
            if (fs.statSync(path.join(RAIZ, rel), { throwIfNoEntry: false })?.isDirectory()) {
              res.statusCode = 301; res.setHeader("Location", url + "/"); return res.end();
            }
            return next();
          }
          res.setHeader("Content-Type", TIPOS[path.extname(abs).toLowerCase()] || "application/octet-stream");
          res.setHeader("Cache-Control", "no-store");
          fs.createReadStream(abs).pipe(res);
        });
      },
      "astro:build:done": ({ dir, logger }) => {
        const dist = fileURLToPath(dir);
        const deAstro = archivosDe(dist).filter((f) => f.endsWith(".html"));
        let n = 0, choques = [];
        for (const e of ENTRADAS) for (const rel of recorrer(e)) {
          const destino = path.join(dist, rel);
          if (fs.existsSync(destino)) { choques.push(rel); continue; }
          fs.mkdirSync(path.dirname(destino), { recursive: true });
          fs.copyFileSync(path.join(RAIZ, rel), destino, fs.constants.COPYFILE_FICLONE);
          n++;
        }
        if (choques.length) throw new Error("Estos archivos chocan con páginas de Astro:\n  " + choques.join("\n  "));
        for (const f of deAstro) fs.writeFileSync(f, versionar(fs.readFileSync(f, "utf8"), path.dirname(f)));
        logger.info(n + " archivos estáticos copiados; " + deAstro.length + " páginas versionadas.");
      },
    },
  };
}
