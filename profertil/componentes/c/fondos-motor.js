/* Fondos generativos con Formas: un solo motor WebGL para cuatro familias de fondo.
     patron   el motor del generador de patrones del kit de marca (grilla, ladrillo, matriz) con movimiento
     grilla   grilla de puntos o Formas con foco y estela al cursor
     dither   un campo continuo convertido en Formas con un tramado ordenado (Bayer 4x4)
     pixeles  celdas que aparecen y arman una Forma grande, o llenan el fondo
   Las 18 Formas del sistema (window.FORMAS, de formas.js) se dibujan una vez en un atlas y el shader las lee
   por celda: no hay librerías y todo el dibujo es propio.
   Uso: PFFondo(canvas, { modo, color, forma, celda, ... }). El canvas toma el tamaño de su caja en CSS. */
window.PFFondo = function PFFondo(cv, C) {
  "use strict";
  C = C || {};
  var PALETAS = {
    azul:     ["#003DA5", "#4086FF", "#2D8035"],
    verde:    ["#2D8035", "#5EB53A", "#EABA2C"],
    amarillo: ["#EABA2C", "#E57F19", "#2D8035"],
    terra:    ["#8A4818", "#E57F19", "#EABA2C"]
  };
  var pal = PALETAS[C.color] || PALETAS.azul;
  var FORMAS = window.FORMAS || {};
  var NOMBRES = Object.keys(FORMAS).filter(function (k) { return k !== "logo" && FORMAS[k].vb && FORMAS[k].d; });
  var MODOS = { patron: 0, grilla: 1, dither: 2, pixeles: 3 };
  var modo = MODOS[C.modo] || 0;
  var reducir = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var GRUPOS_MAX = 12;

  function hex(h) { return [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255]; }
  function num(v, d) { v = +v; return isFinite(v) ? v : d; }
  function azar(a, b) { return a + Math.random() * (b - a); }
  function indiceForma(k) { var i = NOMBRES.indexOf(k); return i < 0 ? 0 : i; }
  var variasFormas = C.forma === "varias";
  var formaFija = variasFormas ? 0 : indiceForma(C.forma || "urea");

  cv.style.background = pal[0];
  var gl = cv.getContext("webgl2", { antialias: false, alpha: false, premultipliedAlpha: false, powerPreference: "low-power" });
  if (!gl) return { destruir: function () {} }; // sin WebGL2 queda el color de fondo

  // --- Atlas: 6 x 3 celdas de 192 px, cada Forma centrada al 90% de su celda.
  var AC = 6, AF = 3, AL = 192, AJUSTE = 0.9;
  var atlas = gl.createTexture(), atlasListo = false;
  (function () {
    var lienzo = document.createElement("canvas"); lienzo.width = AC * AL; lienzo.height = AF * AL;
    var c2 = lienzo.getContext("2d"), faltan = NOMBRES.length;
    if (!faltan) return;
    NOMBRES.forEach(function (k, i) {
      var vb = FORMAS[k].vb.split(/\s+/).map(Number), im = new Image();
      im.onload = function () {
        var esc = AL * AJUSTE / Math.max(vb[2], vb[3]), w = vb[2] * esc, h = vb[3] * esc;
        c2.drawImage(im, (i % AC) * AL + (AL - w) / 2, Math.floor(i / AC) * AL + (AL - h) / 2, w, h);
        if (--faltan === 0) {
          gl.bindTexture(gl.TEXTURE_2D, atlas);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, lienzo);
          gl.generateMipmap(gl.TEXTURE_2D);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          atlasListo = true; pedir();
        }
      };
      im.onerror = function () { faltan--; };
      im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + FORMAS[k].vb + '" width="' + vb[2] + '" height="' + vb[3] + '" fill="#fff">' + FORMAS[k].d + "</svg>");
    });
  })();

  // --- Energía por celda (grilla): una textura chica que el script actualiza cada cuadro.
  var energia = gl.createTexture(), EN = null, enCols = 0, enFilas = 0;

  // --- Shaders
  var VS = "#version 300 es\nin vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }";
  var FS = [
    "#version 300 es",
    "precision highp float;",
    "uniform sampler2D uAtlas, uEn;",
    "uniform vec2 uRes;",
    "uniform float uDpr, uT, uCelda, uModo, uForma, uVarias, uN, uAcentoP, uHayAcento;",
    "uniform vec3 uFondo, uFigura, uAcento, uRaton;",
    "uniform vec4 uA, uB, uD;",          // parámetros por modo
    "uniform vec4 uG[" + GRUPOS_MAX + "], uG2[" + GRUPOS_MAX + "];",
    "uniform float uNG;",
    "out vec4 o;",
    "const float AC = 6., AF = 3., AJ = " + AJUSTE.toFixed(2) + ";",
    "float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }",
    "mat2 rot(float a){ float c = cos(a), s = sin(a); return mat2(c, s, -s, c); }",
    "float suave(float x){ x = clamp(x, 0., 1.); return 1. - pow(1. - x, 3.); }",
    // Forma i en coordenadas q de su caja ([-.5,.5], y hacia abajo); tam = lado de la caja en px de pantalla.
    "float forma(float i, vec2 q, float tam){",
    "  vec2 a = q * AJ; if (abs(a.x) > .5 || abs(a.y) > .5 || tam < .5) return 0.;",
    "  vec2 uv = (vec2(mod(i, AC), floor(i / AC)) + a + .5) / vec2(AC, AF);",
    "  float k = AJ / (tam * uDpr);",
    "  return textureGrad(uAtlas, uv, vec2(k / AC, 0.), vec2(0., k / AF)).a;",
    "}",
    "float idForma(vec2 c){ return uVarias > .5 ? floor(h21(c + 7.31) * uN) : uForma; }",
    "vec3 pinta(vec3 base, vec3 col, float a){ return mix(base, col, clamp(a, 0., 1.)); }",
    // Cursor: cambia de color salteado y sin fundido; casi todas debajo del mouse, menos al alejarse.
    "bool tocada(vec2 centro, vec2 c, float alcance){",
    "  if (uRaton.z < .5) return false;",
    "  float d = length(centro - uRaton.xy) / alcance;",
    "  return h21(c + 3.7) < .95 * pow(max(0., 1. - d), 2.);",
    "}",
    "vec3 colorCelda(vec2 c, vec2 centro, float alcance){",
    "  bool ac = uHayAcento > .5 && h21(c + 1.9) < uAcentoP;",
    "  if (uHayAcento > .5 && tocada(centro, c, alcance)) ac = !ac;",
    "  return ac ? uAcento : uFigura;",
    "}",

    // ---------- 0 · Patrón ----------
    // uA: ritmoX, ritmoY, cobertura, disposición (0 grilla, 1 ladrillo, 2 matriz)
    // uB: giro (grilla / par), giro impar, desfase, movimiento (0 quieto, 1 deriva, 2 onda, 3 giro, 4 grupos)
    // uD: velocidad, ángulo del movimiento, semilla, intensidad
    "float visGrupo(vec2 c, out float fid){",
    "  float v = 0.; fid = -1.;",
    "  for (int k = 0; k < " + GRUPOS_MAX + "; k++){",
    "    if (float(k) >= uNG) break;",
    "    vec4 g = uG[k], g2 = uG2[k];",
    "    float d = length(c - g.xy) + h21(c + g.xy * .13) * 1.6;",
    "    if (d > g2.x) continue;",
    "    float nace = g.z + d / g2.z, muere = g.w + (g2.x - d) / (g2.z * 1.4);",
    "    float s = suave((uT - nace) / .26) * (1. - suave((uT - muere) / .3));",
    "    if (s > v){ v = s; fid = g2.y; }",
    "  }",
    "  return v;",
    "}",
    "vec3 patronCelda(vec3 col, vec2 P, vec2 c, vec2 centro, float tam, float giro, float alcance){",
    "  float s = 1., g = giro, fid = idForma(c);",
    "  float mov = uB.w;",
    "  if (mov > 1.5 && mov < 2.5){",            // onda: las Formas respiran en una onda que cruza el campo
    "    vec2 dir = vec2(cos(uD.y), sin(uD.y));",
    "    float w = .5 + .5 * sin(dot(centro, dir) / (uCelda * 4.) - uT * uD.x * 1.6);",
    "    s = 1. - uD.w * w;",
    "  } else if (mov > 2.5 && mov < 3.5){",     // giro: cada Forma gira de a 90 grados, en una onda
    "    vec2 dir = vec2(cos(uD.y), sin(uD.y));",
    "    float f = uT * uD.x * .5 - dot(centro, dir) / (uCelda * 9.) + h21(c + 5.) * .25 * uD.w;",
    "    g += 1.5707963 * (floor(f) + suave(fract(f) * 3.));",
    "  } else if (mov > 3.5){",                  // grupos: crecen celda por celda, como el campo de la Biblioteca
    "    float gid; s = visGrupo(c, gid); if (gid >= 0.) fid = gid;",
    "  }",
    "  float t = tam * s; if (t < .5) return col;",
    "  vec2 q = rot(-g) * (P - centro) / t;",
    "  return pinta(col, colorCelda(c, centro, alcance), forma(fid, q, t));",
    "}",
    "vec3 patron(vec2 P){",
    "  vec3 col = uFondo;",
    "  float cw = uCelda * uA.x, ch = uCelda * uA.y, cob = uA.z, disp = uA.w;",
    "  float alcance = min(uRes.x, uRes.y) / uDpr * .45;",
    "  if (uB.w > .5 && uB.w < 1.5) P += vec2(cos(uD.y), sin(uD.y)) * uT * uD.x * 18.;",
    "  if (disp < 1.5){",
    "    float fila = floor(P.y / ch);",
    "    for (int dy = -1; dy <= 1; dy++){",
    "      float r = fila + float(dy);",
    "      bool impar = mod(r, 2.) > .5;",
    "      float corre = (disp > .5 && impar) ? cw * (.5 + uB.z * .5) : 0.;",
    "      float giro = disp > .5 ? (impar ? uB.y : uB.x) : uB.x;",
    "      float colu = floor((P.x - corre) / cw);",
    "      for (int dx = -1; dx <= 1; dx++){",
    "        vec2 c = vec2(colu + float(dx), r);",
    "        vec2 centro = vec2(c.x * cw + corre + cw * .5, r * ch + ch * .5);",
    "        col = patronCelda(col, P, c, centro, min(cw, ch) * cob, giro, alcance);",
    "      }",
    "    }",
    "  } else {",                                 // matriz: bloques de 2 x 2 que a veces llevan una Forma grande
    "    vec2 sb = floor(P / vec2(cw, ch) / 2.);",
    "    for (int dy = -1; dy <= 1; dy++) for (int dx = -1; dx <= 1; dx++){",
    "      vec2 b = sb + vec2(dx, dy);",
    "      bool grande = h21(b * 1.31 + uD.z) > .72;",
    "      if (grande){",
    "        vec2 centro = (b * 2. + 1.) * vec2(cw, ch);",
    "        col = patronCelda(col, P, b * 2., centro, min(cw, ch) * 2. * cob * .96, uB.x, alcance);",
    "      } else if (dx == 0 && dy == 0){",
    "        for (int j = 0; j < 4; j++){",
    "          vec2 c = b * 2. + vec2(mod(float(j), 2.), floor(float(j) / 2.));",
    "          col = patronCelda(col, P, c, (c + .5) * vec2(cw, ch), min(cw, ch) * cob, uB.x, alcance);",
    "        }",
    "      }",
    "    }",
    "  }",
    "  return col;",
    "}",

    // ---------- 1 · Grilla interactiva ----------
    // uA: base (0 puntos, 1 Formas, 2 líneas), radio del foco (px), fuerza del foco, tamaño de la marca de base
    "vec3 grilla(vec2 P){",
    "  vec3 col = uFondo;",
    "  vec2 c = floor(P / uCelda), centro = (c + .5) * uCelda;",
    "  float foco = uRaton.z > .5 ? (1. - smoothstep(0., uA.y, length(centro - uRaton.xy))) * uA.z : 0.;",
    "  float e = texelFetch(uEn, ivec2(c), 0).r;",
    "  vec3 tenue = mix(uFondo, uFigura, .34 + .66 * foco);",
    "  vec2 l = P - centro;",
    "  if (uA.x < .5){",
    "    float r = uCelda * uA.w * (1. + foco * .8);",
    "    col = pinta(col, tenue, clamp(r - length(l) + .5, 0., 1.));",
    "  } else if (uA.x < 1.5){",
    "    float t = uCelda * uA.w * 2.2 * (1. + foco * .6);",
    "    col = pinta(col, tenue, forma(idForma(c), l / t, t));",
    "  } else {",
    "    vec2 b = abs(l) - uCelda * .5;",
    "    float linea = 1. - clamp(min(abs(b.x), abs(b.y)) * uDpr - .5, 0., 1.);",
    "    col = pinta(col, tenue, linea * .7);",
    "  }",
    "  if (e > .02){",
    "    float t = uCelda * .8 * suave(e * 1.6);",
    "    vec3 cc = (uHayAcento > .5 && e > .62) ? uAcento : uFigura;",
    "    col = pinta(col, cc, forma(idForma(c), l / t, t));",
    "  }",
    "  return col;",
    "}",

    // ---------- 2 · Dither con Formas ----------
    // uA: tonos (0 binario, 1 tres tonos, 2 escalonado), ángulo, densidad del ruido, peso del degradé
    // uB: velocidad, radio del cursor (px), contraste, -
    "float bayer(vec2 c){",
    "  vec2 m = mod(c, 4.); int i = int(m.x) + int(m.y) * 4;",
    "  int b[16] = int[16](0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5);",
    "  return (float(b[i]) + .5) / 16.;",
    "}",
    "float ruido(vec2 p){",
    "  vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);",
    "  return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y);",
    "}",
    "float fbm(vec2 p){ float v = 0., a = .5; for (int k = 0; k < 4; k++){ v += a * ruido(p); p = p * 2.03 + 17.1; a *= .5; } return v; }",
    "vec3 dither(vec2 P){",
    "  vec3 col = uFondo;",
    "  vec2 c = floor(P / uCelda), centro = (c + .5) * uCelda, res = uRes / uDpr;",
    "  vec2 dir = vec2(cos(uA.y), sin(uA.y));",
    "  vec2 uv = centro / max(res.x, res.y);",
    "  float g = dot(centro / res - .5, dir) + .5;",
    "  float n = fbm(uv * uA.z * 10. + dir * uT * uB.x * .12 + vec2(0., uT * uB.x * .03));",
    "  float v = mix(n, g, uA.w);",
    "  v = (v - .5) * uB.z + .5;",
    "  if (uRaton.z > .5){ float d = length(centro - uRaton.xy) / uB.y; v += .55 * exp(-d * d); }",
    "  float th = bayer(c);",
    "  vec2 l = P - centro; float fid = idForma(c);",
    "  if (uA.x < .5){",
    "    if (v > th) col = pinta(col, uFigura, forma(fid, l / (uCelda * .86), uCelda * .86));",
    "  } else if (uA.x < 1.5){",
    "    float nivel = floor(clamp(v, 0., .999) * 2. + th);",
    "    vec3 cc = (nivel > 1.5 && uHayAcento > .5) ? uAcento : uFigura;",
    "    if (nivel > .5) col = pinta(col, cc, forma(fid, l / (uCelda * .86), uCelda * .86));",
    "  } else {",
    "    float nivel = floor(clamp(v, 0., .999) * 3. + th);",
    "    float t = uCelda * (nivel < .5 ? 0. : nivel < 1.5 ? .38 : nivel < 2.5 ? .62 : .88);",
    "    col = pinta(col, uFigura, forma(fid, l / max(t, 1.), t));",
    "  }",
    "  return col;",
    "}",

    // ---------- 3 · Píxeles que aparecen y se arman ----------
    // uA: objetivo (0 Forma grande, 1 llenar), entrada (s), quieto (s), salida (s)
    // uB: origen (0 azar, 1 desde un punto, 2 barrido), origen x, origen y (px), ángulo del barrido
    // uD: Forma grande (índice), centro x (0-1), centro y (0-1), tamaño (0-1 del alto)
    "vec3 pixeles(vec2 P){",
    "  vec3 col = uFondo;",
    "  vec2 c = floor(P / uCelda), centro = (c + .5) * uCelda, res = uRes / uDpr;",
    "  float h = h21(c + 2.2), demora;",
    "  if (uB.x < .5) demora = h;",
    "  else if (uB.x < 1.5) demora = clamp(length(centro - uB.yz) / length(res) * 1.3, 0., 1.) * .82 + h * .18;",
    "  else { vec2 dir = vec2(cos(uB.w), sin(uB.w)); demora = clamp(dot(centro / res - .5, dir) + .5, 0., 1.) * .78 + h * .22; }",
    "  float entra = demora * uA.y, sale = uA.y + uA.z + h21(c + 9.4) * uA.w;",
    "  float s = suave((uT - entra) / .22) * (1. - suave((uT - sale) / .2));",
    "  if (s <= 0.) return col;",
    "  bool destello = uT - entra < .14 && uHayAcento > .5;",
    "  vec2 l = P - centro; float fid = idForma(c);",
    "  float t; vec3 cc;",
    "  if (uA.x < .5){",
    "    float lado = uD.w * res.y; vec2 gc = uD.yz * res;",
    "    float dentro = forma(uD.x, (centro - gc) / lado, 1e4);",
    "    t = uCelda * (dentro > .5 ? .86 : .3) * s;",
    "    cc = destello ? uAcento : uFigura;",
    "  } else {",
    "    t = uCelda * .86 * s;",
    "    bool ac = uHayAcento > .5 && h21(c + 1.9) < uAcentoP;",
    "    cc = (destello || ac) ? uAcento : uFigura;",
    "  }",
    "  return pinta(col, cc, forma(fid, l / max(t, 1.), t));",
    "}",

    "void main(){",
    "  vec2 P = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uDpr;",
    "  vec3 col = uModo < .5 ? patron(P) : uModo < 1.5 ? grilla(P) : uModo < 2.5 ? dither(P) : pixeles(P);",
    "  o = vec4(col, 1.);",
    "}"
  ].join("\n");

  function sombreador(tipo, src) {
    var s = gl.createShader(tipo); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.error(gl.getShaderInfoLog(s)); return null; }
    return s;
  }
  var prog = gl.createProgram(), vs = sombreador(gl.VERTEX_SHADER, VS), fs = sombreador(gl.FRAGMENT_SHADER, FS);
  if (!vs || !fs) return { destruir: function () {} };
  gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { console.error(gl.getProgramInfoLog(prog)); return { destruir: function () {} }; }
  gl.useProgram(prog);
  var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var lp = gl.getAttribLocation(prog, "p"); gl.enableVertexAttribArray(lp); gl.vertexAttribPointer(lp, 2, gl.FLOAT, false, 0, 0);
  var U = {};
  ["uAtlas", "uEn", "uRes", "uDpr", "uT", "uCelda", "uModo", "uForma", "uVarias", "uN", "uAcentoP", "uHayAcento", "uFondo", "uFigura", "uAcento", "uRaton", "uA", "uB", "uD", "uG", "uG2", "uNG"]
    .forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });
  gl.uniform1i(U.uAtlas, 0); gl.uniform1i(U.uEn, 1);
  gl.uniform3fv(U.uFondo, hex(pal[0])); gl.uniform3fv(U.uFigura, hex(pal[1])); gl.uniform3fv(U.uAcento, hex(pal[2]));
  gl.uniform1f(U.uModo, modo); gl.uniform1f(U.uN, NOMBRES.length); gl.uniform1f(U.uForma, formaFija); gl.uniform1f(U.uVarias, variasFormas ? 1 : 0);
  gl.uniform1f(U.uAcentoP, num(C.acento, 8) / 100); gl.uniform1f(U.uHayAcento, C.acento === 0 ? 0 : 1);

  var RAD = Math.PI / 180;
  // Parámetros fijos de cada modo
  if (modo === 0) {
    var DISP = { grilla: 0, ladrillo: 1, matriz: 2 }, MOV = { quieto: 0, deriva: 1, onda: 2, giro: 3, grupos: 4 };
    var GIROS = [-90, 0, 90, 180];
    var movP = MOV[C.mov] || 0;
    gl.uniform4f(U.uA, num(C.ritmoX, 110) / 100, num(C.ritmoY, 110) / 100, 0.68 + num(C.solapamiento, 30) / 100 * 0.95, DISP[C.disposicion] || 0);
    gl.uniform4f(U.uB, (GIROS[num(C.direccion, 1)] || 0) * RAD, (GIROS[num(C.direccionImpar, 1)] || 0) * RAD, num(C.desfase, 0) / 100, movP);
    gl.uniform4f(U.uD, num(C.velocidad, 50) / 100, num(C.angulo, 30) * RAD, num(C.semilla, 37), num(C.intensidad, 60) / 100);
  } else if (modo === 1) {
    gl.uniform4f(U.uA, { puntos: 0, formas: 1, lineas: 2 }[C.base] || 0, num(C.foco, 260), num(C.fuerzaFoco, 100) / 100, num(C.marca, 9) / 100);
  } else if (modo === 2) {
    gl.uniform4f(U.uA, { binario: 0, tres: 1, escalonado: 2 }[C.tonos] || 0, num(C.angulo, 11) * RAD, num(C.densidad, 15) / 100 * 2 + 0.05, num(C.degrade, 45) / 100);
    gl.uniform4f(U.uB, num(C.velocidad, 40) / 100, num(C.radioCursor, 160), num(C.contraste, 120) / 100, 0);
  }

  // --- Medidas
  var dpr = Math.min(window.devicePixelRatio || 1, 2), W = 0, H = 0, CELDA = 30;
  function medir() {
    var w = cv.clientWidth || innerWidth, h = cv.clientHeight || innerHeight;
    if (w === W && Math.abs(h - H) < 2) return;
    W = w; H = h;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    gl.viewport(0, 0, cv.width, cv.height);
    gl.uniform2f(U.uRes, cv.width, cv.height); gl.uniform1f(U.uDpr, dpr);
    CELDA = Math.max(6, Math.round(num(C.celda, 34) * (W < 720 ? 0.76 : 1)));
    gl.uniform1f(U.uCelda, CELDA);
    if (modo === 1) prepararEnergia();
    if (modo === 0 && movP === 4) sembrarGrupos();
    pedir();
  }

  // --- Cursor: posición dentro del canvas. Con el dedo, solo mientras arrastra.
  var raton = null;
  function dentro(e) {
    var r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    return x >= 0 && y >= 0 && x <= r.width && y <= r.height ? { x: x, y: y } : null;
  }
  var IGNORAR = C.ignorar || "a, button, input, select, textarea, label, summary, [role=button]";
  function mueve(e) {
    if (C.cursor === false) return;
    var p = dentro(e), antes = raton; raton = p;
    if (modo === 1 && p) estela(antes || p, p);
    pedir();
  }
  function sale() { raton = null; pedir(); }
  function toca(e) {
    if (C.clic === false || reducir) return;
    if (e.target && e.target.closest && e.target.closest(IGNORAR)) return;
    var p = dentro(e); if (!p) return;
    var t = ahora();
    if (modo === 0 && movP === 4) nuevoGrupo(t, Math.floor(p.x / CELDA), Math.floor(p.y / CELDA), true);
    if (modo === 1) explosion(p);
    if (modo === 3) { ciclo.inicio = t; ciclo.origen = p; ciclo.porToque = true; ciclo.n++; }
    pedir();
  }
  addEventListener("pointermove", mueve, { passive: true });
  addEventListener("pointerdown", mueve, { passive: true });
  addEventListener("click", toca);
  document.documentElement.addEventListener("pointerleave", sale);
  addEventListener("pointercancel", sale);
  addEventListener("pointerup", function (e) { if (e.pointerType !== "mouse") sale(); });

  // --- Grilla: energía por celda (estela, toques y actividad al azar)
  function prepararEnergia() {
    enCols = Math.ceil(W / CELDA) + 1; enFilas = Math.ceil(H / CELDA) + 1;
    EN = new Float32Array(enCols * enFilas);
    if (reducir) for (var i = 0; i < EN.length; i++) if (Math.random() < num(C.actividad, 24) / 100 * 0.25) EN[i] = azar(0.3, 1);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, energia);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    subirEnergia(); gl.activeTexture(gl.TEXTURE0);
  }
  var bytes = null;
  function subirEnergia() {
    if (!bytes || bytes.length !== EN.length) bytes = new Uint8Array(EN.length);
    for (var i = 0; i < EN.length; i++) bytes[i] = Math.min(255, EN[i] * 255) | 0;
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, energia);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, enCols, enFilas, 0, gl.RED, gl.UNSIGNED_BYTE, bytes);
    gl.activeTexture(gl.TEXTURE0);
  }
  function marcar(cx, cy, v) {
    if (cx < 0 || cy < 0 || cx >= enCols || cy >= enFilas) return;
    var i = cy * enCols + cx; if (EN[i] < v) EN[i] = v;
  }
  function estela(a, b) {
    if (reducir || !EN || C.estela === 0) return;
    var d = Math.hypot(b.x - a.x, b.y - a.y), pasos = Math.max(1, Math.ceil(d / (CELDA * 0.5)));
    for (var k = 0; k <= pasos; k++) {
      var x = a.x + (b.x - a.x) * k / pasos, y = a.y + (b.y - a.y) * k / pasos;
      marcar(Math.floor(x / CELDA), Math.floor(y / CELDA), 1);
      if (Math.random() < 0.35) marcar(Math.floor(x / CELDA) + (Math.random() < 0.5 ? -1 : 1), Math.floor(y / CELDA) + (Math.random() < 0.5 ? -1 : 1), azar(0.5, 0.9));
    }
  }
  function explosion(p) {
    var cx = Math.floor(p.x / CELDA), cy = Math.floor(p.y / CELDA);
    for (var dy = -3; dy <= 3; dy++) for (var dx = -3; dx <= 3; dx++) {
      var d = Math.hypot(dx, dy); if (d <= 3.2 && Math.random() < 1.1 - d / 3.2) marcar(cx + dx, cy + dy, 1 - d / 5);
    }
  }
  function pasoEnergia(dt) {
    var vida = 0.12 + num(C.estela, 56) / 100 * 2.4;              // segundos hasta apagarse
    var baja = dt / vida, act = num(C.actividad, 24) / 100;
    for (var i = 0; i < EN.length; i++) if (EN[i] > 0) EN[i] = Math.max(0, EN[i] - baja);
    var nuevos = act * EN.length * dt * 0.35;
    while (nuevos > 0) { if (Math.random() < nuevos) { var j = (Math.random() * EN.length) | 0; EN[j] = Math.max(EN[j], azar(0.45, 1)); } nuevos -= 1; }
    subirEnergia();
  }

  // --- Patrón con grupos: crecen desde un punto, quedan quietos y se deshacen (el campo de la Biblioteca)
  var grupos = [];
  function nuevoGrupo(t, cx, cy, toque) {
    if (grupos.length >= GRUPOS_MAX) {
      var viejo = -1, m = Infinity;
      grupos.forEach(function (g, i) { if (g.muere < m) { m = g.muere; viejo = i; } });
      grupos.splice(viejo, 1);
    }
    var cw = CELDA * num(C.ritmoX, 110) / 100, ch = CELDA * num(C.ritmoY, 110) / 100;
    if (cx === undefined) {
      cx = Math.floor(azar(0, W / cw)); cy = Math.floor(Math.random() < 0.7 ? azar(H * 0.35 / ch, H / ch) : azar(0, H / ch));
    }
    var radio = toque ? azar(2.2, 3.4) : azar(1.8, 3.6), ritmo = toque ? azar(14, 22) : azar(7, 13);
    var nace = t, crece = radio / ritmo;
    grupos.push({ x: cx, y: cy, nace: nace, muere: reducir ? 1e9 : nace + crece + azar(2.5, 5), radio: radio + 1.6, ritmo: ritmo,
      forma: variasFormas ? Math.floor(Math.random() * NOMBRES.length) : formaFija });
  }
  function sembrarGrupos() {
    grupos = []; var n = num(C.grupos, 7), t = ahora();
    for (var i = 0; i < n; i++) nuevoGrupo(reducir ? t - 10 : t + azar(0, 1.6));
  }
  function pasoGrupos(t) {
    grupos = grupos.filter(function (g) { return t < g.muere + g.radio / (g.ritmo * 1.4) + 0.4; });
    while (grupos.length < num(C.grupos, 7)) nuevoGrupo(t + azar(0, 1.2));
    var a = new Float32Array(GRUPOS_MAX * 4), b = new Float32Array(GRUPOS_MAX * 4);
    grupos.forEach(function (g, i) { a.set([g.x, g.y, g.nace, g.muere], i * 4); b.set([g.radio, g.forma, g.ritmo, 0], i * 4); });
    gl.uniform4fv(U.uG, a); gl.uniform4fv(U.uG2, b); gl.uniform1f(U.uNG, grupos.length);
  }

  // --- Píxeles: ciclos de armar, quedarse y desarmar
  var ciclo = { inicio: 0, n: 0, origen: null, porToque: false };
  var ORIG = { azar: 0, punto: 1, barrido: 2 };
  function pasoPixeles(t) {
    var entra = num(C.entrada, 22) / 10, quieto = num(C.quieto, 40) / 10, salida = num(C.salida, 12) / 10;
    var total = entra + quieto + salida + 0.8;
    if (!reducir && t - ciclo.inicio > total) { ciclo.inicio = t; ciclo.n++; ciclo.origen = null; ciclo.porToque = false; }
    var origen = ciclo.porToque ? 1 : (ORIG[C.origen] || 0);
    var o = ciclo.origen || { x: W * (0.25 + 0.5 * ((ciclo.n * 0.618) % 1)), y: H * 0.6 };
    gl.uniform4f(U.uA, C.objetivo === "llenar" ? 1 : 0, entra, quieto, salida);
    gl.uniform4f(U.uB, origen, o.x, o.y, (num(C.angulo, 20) + ciclo.n * 47) * RAD);
    var grande = variasFormas ? (formaFija + ciclo.n) % NOMBRES.length : formaFija;
    if (C.formaGrande && C.formaGrande !== "igual") grande = indiceForma(C.formaGrande);
    gl.uniform4f(U.uD, grande, num(C.posX, 70) / 100, num(C.posY, 55) / 100, num(C.tamano, 80) / 100);
    return reducir ? entra + quieto * 0.5 : t - ciclo.inicio;
  }

  // --- Cuadro
  var t0 = performance.now(), ultimo = 0, pendiente = false, vivo = true, visible = true, tapa = C.tapa ? document.getElementById(C.tapa) : null;
  function ahora() { return (performance.now() - t0) / 1000; }
  function pedir() { if (!pendiente && vivo) { pendiente = true; requestAnimationFrame(cuadro); } }
  function tapado() {
    if (window.PF_PAUSA) return true;
    return tapa ? tapa.getBoundingClientRect().top <= 0 : false;
  }
  function cuadro() {
    pendiente = false; if (!vivo) return;
    var t = ahora(), dt = Math.min(0.05, t - ultimo); ultimo = t;
    var oculto = tapado();
    if (oculto !== !visible) { visible = !oculto; cv.style.visibility = visible ? "" : "hidden"; }
    if (!visible) { if (!reducir) setTimeout(pedir, 200); return; }
    var tu = reducir ? 0 : t;
    if (modo === 1 && EN) { if (!reducir) pasoEnergia(dt); }
    if (modo === 0 && movP === 4) { pasoGrupos(t); tu = t; }
    if (modo === 3) tu = pasoPixeles(t);
    gl.uniform1f(U.uT, tu);
    gl.uniform3f(U.uRaton, raton ? raton.x : -1e4, raton ? raton.y : -1e4, raton ? 1 : 0);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, atlas);
    if (atlasListo) gl.drawArrays(gl.TRIANGLES, 0, 3);
    else { gl.clearColor.apply(gl, hex(pal[0]).concat(1)); gl.clear(gl.COLOR_BUFFER_BIT); }
    if (!reducir) pedir();
  }
  var ro = new ResizeObserver(medir); ro.observe(cv);
  if (tapa) addEventListener("scroll", pedir, { passive: true });
  medir();
  return {
    destruir: function () {
      vivo = false; ro.disconnect();
      removeEventListener("pointermove", mueve); removeEventListener("pointerdown", mueve); removeEventListener("click", toca);
      document.documentElement.removeEventListener("pointerleave", sale);
      var ext = gl.getExtension("WEBGL_lose_context"); if (ext) ext.loseContext();
    }
  };
};
