/* ==========================================================================
   Novedades · refraccion: el cristal del Laboratorio de refraccion
   (profertil/refraccion) aplicado a la UI de Novedades.
   Safari no aplica filtros SVG en backdrop-filter, asi que la refraccion la
   hace WebGL, como en el laboratorio: un canvas fijo debajo de la UI dibuja
   el cristal de cada pieza (dock de filtros, barra, menu, lupa, flechas).
   Como WebGL no puede leer la pagina, lo que queda detras de cada pieza se
   redibuja en un canvas 2D (fondos, arte SVG y texto de tarjetas y placas)
   y ese dibujo es la textura que se refracta.
   ========================================================================== */
(function () {
  "use strict";
  var D = Math.min(1.5, window.devicePixelRatio || 1);

  /* --- Materiales: los cuatro del laboratorio, mas el original ---------- */
  var MATS = {
    cristal:    { str: 1.0, disp: 0.0,  frost: 0, bevel: 22, wob: 0, tint: 1.0 },
    liquido:    { str: 1.5, disp: 0.05, frost: 0, bevel: 30, wob: 1, tint: 0.8 },
    esmerilado: { str: 0.7, disp: 0.0,  frost: 6, bevel: 20, wob: 0, tint: 1.15 },
    prisma:     { str: 1.7, disp: 0.28, frost: 0, bevel: 34, wob: 0, tint: 0.6 }
  };
  var ORDEN = ["cristal", "liquido", "esmerilado", "prisma", "original"];
  var NOMBRE = { cristal: "Cristal", liquido: "Líquido", esmerilado: "Esmerilado", prisma: "Prisma", original: "Original" };

  /* --- Piezas de vidrio. tinte: color del vidrio y cuanto tiñe (0-1). --- */
  var TIZA = [1, 0.996, 0.937], AZUL = [0, 0.239, 0.647];
  function topSolida() { var t = document.getElementById("top"); return t && t.classList.contains("solid"); }
  var LENTES = [
    { sel: ".filters", tinte: TIZA, k: 0.62, brillo: 1 },
    { sel: ".top", tinte: AZUL, k: 0.82, brillo: 0.5, barra: true, si: topSolida },
    { sel: ".nav .menu", tinte: TIZA, k: 0.14, brillo: 1, si: function () { return !topSolida(); } },
    { sel: ".nav .menu-mobile", tinte: TIZA, k: 0.14, brillo: 1, si: function () { return !topSolida(); } },
    { sel: ".busca", tinte: TIZA, k: 0.16, brillo: 1, si: function (el) { return !topSolida() && !el.classList.contains("open"); } },
    { sel: ".busca-x", tinte: TIZA, k: 0.16, brillo: 1, si: function () { return !topSolida(); } },
    { sel: ".d-flecha", tinte: TIZA, k: 0.08, brillo: 1, si: function (el) { return !el.matches(":hover"); } }
  ];
  var MAX = 8;

  /* --- Lo que se redibuja detras. vivo: se mide en cada cuadro (se mueve
     por dentro); el resto se mide una vez, relativo a su raiz. ----------- */
  var RAICES = [
    { sel: ".dest", solo: true },
    { sel: ".dest .d-slide.vis", vivo: true },
    { sel: ".dest .d-nav", vivo: true },
    { sel: ".result-row" },
    { sel: ".grid .card" },
    { sel: ".empty" }
  ];

  /* --- WebGL ------------------------------------------------------------ */
  var cv = document.createElement("canvas");
  cv.id = "refr"; cv.setAttribute("aria-hidden", "true");
  var gl = cv.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: false });
  if (!gl) return;
  var VERT = "attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}";
  var FRAG = [
    "precision highp float;",
    "uniform sampler2D tex;uniform vec2 res;",
    "uniform vec4 L[8];uniform vec4 P[8];uniform vec4 C[8];",
    "uniform float n,str,disp,frost,bevel,wob,tint,time,dens;",
    "float sdRB(vec2 p,vec2 b,float r){vec2 q=abs(p)-b+r;return length(max(q,0.))+min(max(q.x,q.y),0.)-r;}",
    "vec3 T(vec2 p){return texture2D(tex,clamp(p/res,0.001,.999)).rgb;}",
    "void main(){",
    "  vec2 p=vec2(gl_FragCoord.x,res.y-gl_FragCoord.y);",
    "  float bd=1e9;vec4 bl=vec4(0.),bp=vec4(0.),bc=vec4(0.);",
    "  for(int i=0;i<8;i++){if(float(i)>=n)break;float d=sdRB(p-L[i].xy,L[i].zw,P[i].x);if(d<bd){bd=d;bl=L[i];bp=P[i];bc=C[i];}}",
    "  if(bd>1.5){gl_FragColor=vec4(0.);return;}",
    "  float d=bd+wob*sin(p.x*.018/dens+time*2.6)*sin(p.y*.021/dens+time*2.1)*3.*dens;",
    "  vec2 e=vec2(1.,0.);vec2 c=bl.xy,b=bl.zw;float r=bp.x;",
    "  vec2 g=vec2(sdRB(p+e.xy-c,b,r)-sdRB(p-e.xy-c,b,r),sdRB(p+e.yx-c,b,r)-sdRB(p-e.yx-c,b,r));",
    "  g=g/(length(g)+1e-5);",
    "  float bv=max(1.,min(bevel*dens,min(b.x,b.y)));",
    "  float edge=1.-clamp(-d/bv,0.,1.);",
    "  float h=sqrt(max(1.-edge*edge,.0025));",
    "  float slope=min(edge/h,6.);",
    "  vec2 off=-g*slope*str*bv*.35;",
    "  vec3 col;",
    "  if(frost>0.){vec3 acc=vec3(0.);float fr=frost*dens*2.5;",
    "    for(int i=0;i<8;i++){float an=float(i)*.785398;acc+=T(p+off+vec2(cos(an),sin(an))*fr*(1.+.5*mod(float(i),2.)));}",
    "    col=acc/8.;",
    "  }else{col=vec3(T(p+off*(1.+disp)).r,T(p+off).g,T(p+off*(1.-disp)).b);}",
    "  col=mix(col,bc.rgb,clamp(bc.a*tint,0.,1.));",
    "  vec2 Ld=normalize(vec2(-.55,-.85));",
    "  float rim=smoothstep(.55,1.,edge);",
    "  float spec=(pow(max(dot(g,Ld),0.),2.)*rim*.85+pow(max(dot(g,-Ld),0.),3.)*rim*.35)*bp.z;",
    "  col+=spec+smoothstep(.9,1.,edge)*.25*bp.z;",
    "  float a=smoothstep(.75,-.75,d)*bp.y;",
    "  gl_FragColor=vec4(min(col,1.)*a,a);",
    "}"
  ].join("\n");
  function sh(tipo, src) {
    var s = gl.createShader(tipo); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  var prog = gl.createProgram();
  try {
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  } catch (err) { console.warn("refraccion:", err); return; }
  gl.useProgram(prog);
  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  var aLoc = gl.getAttribLocation(prog, "a");
  gl.enableVertexAttribArray(aLoc); gl.vertexAttribPointer(aLoc, 2, gl.FLOAT, false, 0, 0);
  var U = {};
  ["tex", "res", "L", "P", "C", "n", "str", "disp", "frost", "bevel", "wob", "tint", "time", "dens"].forEach(function (k) {
    U[k] = gl.getUniformLocation(prog, k === "L" || k === "P" || k === "C" ? k + "[0]" : k);
  });
  var tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.uniform1i(U.tex, 0);

  var fondo = document.createElement("canvas");
  var cx = fondo.getContext("2d");
  var W = 0, H = 0;
  function medir() {
    var r = cv.getBoundingClientRect();
    W = r.width; H = r.height;
    cv.width = fondo.width = Math.max(1, Math.round(W * D));
    cv.height = fondo.height = Math.max(1, Math.round(H * D));
    gl.viewport(0, 0, cv.width, cv.height);
    cache = new WeakMap();
  }

  /* --- Redibujo de la pagina ------------------------------------------- */
  var cache = new WeakMap(), imgs = new WeakMap();
  function alfa(c) { var m = /rgba?\(([^)]+)\)/.exec(c); if (!m) return c === "transparent" ? 0 : 1; var p = m[1].split(/[ ,/]+/).filter(Boolean); return p.length > 3 ? parseFloat(p[3]) : 1; }
  function radio(cs, w, h) { return Math.min(parseFloat(cs.borderTopLeftRadius) || 0, w / 2, h / 2); }
  function fuente(cs) { return cs.fontStyle + " " + cs.fontWeight + " " + cs.fontSize + " " + cs.fontFamily; }
  var DEFS = {};
  function simbolo(id) { if (!(id in DEFS)) { var s = document.getElementById(id); DEFS[id] = s ? s.outerHTML : ""; } return DEFS[id]; }
  function imagen(el, w, h) {
    var c = imgs.get(el);
    if (c) return c.ok ? c.img : null;
    var cs = getComputedStyle(el), k = el.cloneNode(true);
    k.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    k.removeAttribute("class"); k.removeAttribute("style");
    var esc = Math.min(2, 2200 / Math.max(w, h, 1));
    k.setAttribute("width", Math.round(w * esc)); k.setAttribute("height", Math.round(h * esc));
    k.setAttribute("color", cs.color);
    if (!k.getAttribute("fill")) k.setAttribute("fill", cs.fill);
    if (cs.stroke && cs.stroke !== "none") { k.setAttribute("stroke", cs.stroke); k.setAttribute("stroke-width", cs.strokeWidth); }
    var s = k.outerHTML, ids = {}, defs = "";
    s.replace(/href="#([\w-]+)"/g, function (_, id) { ids[id] = 1; });
    Object.keys(ids).forEach(function (id) { defs += simbolo(id); });
    s = s.replace(/^<svg([^>]*)>/, "<svg$1><defs>" + defs + "</defs>");
    c = { img: new Image(), ok: false };
    c.img.onload = function () { c.ok = true; };
    c.img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(s);
    imgs.set(el, c);
    return null;
  }
  // Arma la lista de dibujo de una raiz: cajas con fondo, SVG y palabras.
  function recorrer(raiz, solo) {
    var R = raiz.getBoundingClientRect(), out = [], rg = document.createRange();
    function caja(el, cs) {
      var r = el.getBoundingClientRect();
      return { el: el, x: r.left - R.left, y: r.top - R.top, w: r.width, h: r.height, r: radio(cs, r.width, r.height) };
    }
    (function ir(el) {
      var cs = getComputedStyle(el);
      if (cs.display === "none" || cs.visibility === "hidden" || parseFloat(cs.opacity) < 0.05) return;
      if (el instanceof SVGSVGElement) { var s = caja(el, cs); s.k = "svg"; out.push(s); return; }
      if (alfa(cs.backgroundColor) > 0) { var b = caja(el, cs); b.k = "caja"; b.c = cs.backgroundColor; out.push(b); }
      if (solo) return;
      var corta = cs.overflow !== "visible" && parseFloat(cs.borderTopLeftRadius) > 0;
      if (corta) { var q = caja(el, cs); q.k = "corte"; out.push(q); }
      for (var n = el.firstChild; n; n = n.nextSibling) {
        if (n.nodeType === 1) ir(n);
        else if (n.nodeType === 3 && /\S/.test(n.data)) {
          var re = /\S+/g, m, f = fuente(cs), up = cs.textTransform === "uppercase", ls = cs.letterSpacing;
          while ((m = re.exec(n.data))) {
            rg.setStart(n, m.index); rg.setEnd(n, m.index + m[0].length);
            var bx = rg.getClientRects()[0];
            if (!bx || !bx.width) continue;
            out.push({ k: "txt", s: up ? m[0].toUpperCase() : m[0], x: bx.left - R.left, y: bx.top - R.top + bx.height / 2, f: f, c: cs.color, ls: ls });
          }
        }
      }
      if (corta) out.push({ k: "fin" });
    })(raiz);
    return out;
  }
  function dibujar(raiz, def, R) {
    var lista = cache.get(raiz);
    if (!lista || lista.w !== Math.round(R.width)) { lista = recorrer(raiz, def.solo); lista.w = Math.round(R.width); cache.set(raiz, lista); }
    for (var i = 0; i < lista.length; i++) {
      var it = lista[i], x = R.left + it.x, y = R.top + it.y, w = it.w, h = it.h;
      if (def.vivo && it.el) { var r = it.el.getBoundingClientRect(); x = r.left; y = r.top; w = r.width; h = r.height; }
      if (it.k === "caja") {
        cx.fillStyle = it.c; cx.beginPath();
        if (it.r > 0.5 && cx.roundRect) cx.roundRect(x, y, w, h, Math.min(it.r, w / 2, h / 2)); else cx.rect(x, y, w, h);
        cx.fill();
      } else if (it.k === "svg") {
        var im = imagen(it.el, w, h);
        if (im) cx.drawImage(im, x, y, w, h);
      } else if (it.k === "txt") {
        cx.font = it.f; cx.fillStyle = it.c;
        if ("letterSpacing" in cx) cx.letterSpacing = it.ls === "normal" ? "0px" : it.ls;
        cx.fillText(it.s, x, y);
      } else if (it.k === "corte") {
        cx.save(); cx.beginPath();
        if (cx.roundRect) cx.roundRect(x, y, w, h, Math.min(it.r, w / 2, h / 2)); else cx.rect(x, y, w, h);
        cx.clip();
      } else if (it.k === "fin") cx.restore();
    }
  }
  // Las mutaciones de la grilla y las placas invalidan lo medido.
  new MutationObserver(function (ms) {
    for (var i = 0; i < ms.length; i++) { var t = ms[i].target; if (t.closest && t.closest(".filters, .top")) continue; cache = new WeakMap(); return; }
  }).observe(document.body, { childList: true, subtree: true, characterData: true });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { cache = new WeakMap(); });

  /* --- Lentes ----------------------------------------------------------- */
  var suave = new WeakMap();
  function opacidad(el) {
    var o = 1;
    for (var e = el; e && e !== document.body; e = e.parentElement) {
      var cs = getComputedStyle(e);
      if (cs.display === "none" || cs.visibility === "hidden") return 0;
      o *= parseFloat(cs.opacity);
    }
    return o;
  }
  function juntar() {
    var out = [];
    LENTES.forEach(function (def) {
      document.querySelectorAll(def.sel).forEach(function (el) {
        var obj = def.si && !def.si(el) ? 0 : 1, s = suave.has(el) ? suave.get(el) : obj;
        s += (obj - s) * 0.25; if (Math.abs(obj - s) < 0.01) s = obj;
        suave.set(el, s);
        if (s <= 0.001 || out.length >= MAX) return;
        var a = opacidad(el) * s;
        if (a <= 0.01) return;
        var r = el.getBoundingClientRect();
        if (!r.width || !r.height || r.bottom < 0 || r.top > H || r.right < 0 || r.left > W) return;
        var y0 = def.barra ? r.top - 300 : r.top;
        out.push({ el: el, x: r.left, y: y0, w: r.width, h: r.bottom - y0, r: def.barra ? 0 : radio(getComputedStyle(el), r.width, r.height), a: a, def: def });
      });
    });
    return out;
  }

  /* --- Cuadro --------------------------------------------------------- */
  var modo = "cristal";
  try { var g = localStorage.getItem("novedades-vidrio"); if (ORDEN.indexOf(g) !== -1) modo = g; } catch (e) {}
  var q = /[?&]vidrio=([a-z]+)/.exec(location.search); if (q && ORDEN.indexOf(q[1]) !== -1) modo = q[1];
  var mat = Object.assign({}, MATS[modo === "original" ? "cristal" : modo]);
  var Lb = new Float32Array(MAX * 4), Pb = new Float32Array(MAX * 4), Cb = new Float32Array(MAX * 4);
  var t0 = performance.now(), limpio = false, bgBody = getComputedStyle(document.body).backgroundColor;

  function cuadro(now) {
    requestAnimationFrame(cuadro);
    if (modo === "original") { if (!limpio) { gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); limpio = true; } return; }
    var lentes = juntar();
    if (!lentes.length) { if (!limpio) { gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); limpio = true; } return; }
    limpio = false;
    var obj = MATS[modo];
    for (var k in mat) mat[k] += (obj[k] - mat[k]) * 0.12;

    // Zonas a redibujar: cada lente mas el margen que puede desplazar.
    var M = 70, zonas = lentes.map(function (l) { return { x: l.x - M, y: Math.max(-M, l.y - M), w: l.w + 2 * M, h: Math.min(H + M, l.y + l.h + M) - Math.max(-M, l.y - M) }; });
    cx.setTransform(D, 0, 0, D, 0, 0);
    cx.save(); cx.beginPath();
    zonas.forEach(function (z) { cx.rect(z.x, z.y, z.w, z.h); });
    cx.clip();
    cx.fillStyle = bgBody; cx.fillRect(0, 0, W, H);
    cx.textBaseline = "middle"; cx.textAlign = "left";
    RAICES.forEach(function (def) {
      document.querySelectorAll(def.sel).forEach(function (el) {
        var R = el.getBoundingClientRect();
        if (!R.width || R.bottom < 0 || R.top > H) return;
        for (var i = 0; i < zonas.length; i++) {
          var z = zonas[i];
          if (R.right > z.x && R.left < z.x + z.w && R.bottom > z.y && R.top < z.y + z.h) { dibujar(el, def, R); return; }
        }
      });
    });
    cx.restore();

    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, fondo);
    Lb.fill(0); Pb.fill(0); Cb.fill(0);
    lentes.forEach(function (l, i) {
      Lb.set([(l.x + l.w / 2) * D, (l.y + l.h / 2) * D, l.w / 2 * D, l.h / 2 * D], i * 4);
      Pb.set([l.r * D, l.a, l.def.brillo, 0], i * 4);
      Cb.set([l.def.tinte[0], l.def.tinte[1], l.def.tinte[2], l.def.k], i * 4);
    });
    gl.uniform4fv(U.L, Lb); gl.uniform4fv(U.P, Pb); gl.uniform4fv(U.C, Cb);
    gl.uniform1f(U.n, lentes.length);
    gl.uniform2f(U.res, cv.width, cv.height);
    gl.uniform1f(U.dens, D);
    gl.uniform1f(U.str, mat.str); gl.uniform1f(U.disp, mat.disp); gl.uniform1f(U.frost, mat.frost);
    gl.uniform1f(U.bevel, mat.bevel); gl.uniform1f(U.wob, mat.wob); gl.uniform1f(U.tint, mat.tint);
    gl.uniform1f(U.time, (now - t0) / 1000);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  /* --- Selector de material ------------------------------------------- */
  var btn = document.createElement("button");
  btn.type = "button"; btn.className = "vidrio";
  function marcar() {
    btn.innerHTML = "<span>Vidrio</span><b>" + NOMBRE[modo] + "</b>";
    btn.setAttribute("aria-label", "Material del vidrio: " + NOMBRE[modo] + ". Tocar para cambiar.");
    document.documentElement.classList.toggle("refr", modo !== "original");
    limpio = false;
  }
  btn.addEventListener("click", function () {
    modo = ORDEN[(ORDEN.indexOf(modo) + 1) % ORDEN.length];
    try { localStorage.setItem("novedades-vidrio", modo); } catch (e) {}
    marcar();
  });

  document.body.appendChild(cv);
  document.body.appendChild(btn);
  medir(); marcar();
  window.addEventListener("resize", medir);
  if (window.visualViewport) window.visualViewport.addEventListener("resize", medir);
  requestAnimationFrame(cuadro);
})();
