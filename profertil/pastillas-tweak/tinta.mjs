// Medición por tinta, Chrome contra Safari (WebKit), de todas las piezas del tweak.
// Captura la pantalla a 4x y mide arriba/abajo de la primera letra (mayúscula o cifra) de cada caja.
// Uso: con el Lab servido en :8790, desde una carpeta con playwright instalado:
//   npm i playwright && npx playwright install webkit chromium-headless-shell
//   node tinta.mjs ['css de prueba'] [url]

import { webkit, chromium } from "playwright";
const url = process.argv[3] || "http://localhost:8790/profertil/pastillas-tweak/";
const css = process.argv[2] || "";
const DPR = 4, res = {};
for (const [n, t] of [["chrome", chromium], ["webkit", webkit]]) {
  const b = await t.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: DPR });
  await p.goto(url + "?r=" + Math.random()); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(1500);
  if (css) { await p.addStyleTag({ content: css }); await p.waitForTimeout(500); }
  const N = await p.locator(".tw-real [data-m]").count(), out = [];
  for (let k = 0; k < N; k++) {
    const info = await p.evaluate((k) => {
      const c = document.querySelectorAll(".tw-real [data-m]")[k]; c.scrollIntoView({ block: "center" });
      const w = document.createTreeWalker(c, NodeFilter.SHOW_TEXT); let t; while ((t = w.nextNode()) && !t.nodeValue.trim());
      const i = t.nodeValue.search(/\S/); const r = document.createRange(); r.setStart(t, i); r.setEnd(t, i + 1);
      const g = r.getBoundingClientRect(), bb = c.getBoundingClientRect();
      return { pz: c.closest(".pieza").querySelector("h2").textContent, m: c.dataset.m, ch: t.nodeValue[i], fs: getComputedStyle(t.parentElement).fontSize, b: [bb.left, bb.top, bb.width, bb.height], g: [g.left, g.width] };
    }, k);
    await p.waitForTimeout(80);
    const png = (await p.screenshot()).toString("base64");
    const tinta = await p.evaluate(async ({ src, info, DPR }) => {
      const im = new Image(); im.src = "data:image/png;base64," + src; await im.decode();
      const cv = document.createElement("canvas"); cv.width = im.width; cv.height = im.height; const x = cv.getContext("2d"); x.drawImage(im, 0, 0);
      const d = x.getImageData(0, 0, im.width, im.height).data;
      const px = (i, j) => { const k = (j * im.width + i) * 4; return [d[k], d[k + 1], d[k + 2]]; };
      const y0 = Math.round(info.b[1] * DPR), y1 = Math.round((info.b[1] + info.b[3]) * DPR);
      const x0 = Math.round(info.g[0] * DPR) + 2, x1 = Math.round((info.g[0] + info.g[1]) * DPR) - 2;
      const fondo = px(Math.round(info.g[0] * DPR) - 3 * DPR, Math.round((y0 + y1) / 2));
      let top = -1, bot = -1;
      for (let j = y0 + DPR; j < y1 - DPR; j++) for (let i = x0; i < x1; i++) {
        const q = px(i, j); if (Math.abs(q[0] - fondo[0]) + Math.abs(q[1] - fondo[1]) + Math.abs(q[2] - fondo[2]) > 160) { if (top < 0) top = j; bot = j; break; }
      }
      return [(top - y0) / DPR, (y1 - 1 - bot) / DPR];
    }, { src: png, info, DPR });
    out.push({ ...info, arr: tinta[0], ab: tinta[1] });
  }
  res[n] = out; await b.close();
}
const f = (a) => `${a.arr.toFixed(2)} / ${a.ab.toFixed(2)}  (${(a.arr - a.ab >= 0 ? "+" : "") + (a.arr - a.ab).toFixed(2)})`;
console.log("pieza | muestra | letra y cuerpo | Chrome arriba / abajo (dif) | Safari arriba / abajo (dif)");
res.chrome.forEach((c, i) => console.log(`${c.pz} | ${c.m} | ${c.ch} ${parseFloat(c.fs).toFixed(2)} | ${f(c)} | ${f(res.webkit[i])}`));
