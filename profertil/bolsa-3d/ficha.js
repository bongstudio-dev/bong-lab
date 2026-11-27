// Bolsa 3D en la ficha de producto.
// Se dibuja encima de la foto de la bolsa con la misma cámara que la foto (ángulo, lente y encuadre),
// así que cuando el primer cuadro está listo la foto se cambia por la bolsa sin que nada se mueva.
// Mientras tanto se ve la foto. Se puede girar arrastrando unos grados a cada lado; al soltar vuelve
// adentro del límite si se pasó. Quieta, se mece despacio unos grados (solo mientras se ve en pantalla y
// sin movimiento reducido). Al bajar por la página gira hacia el frente, siguiendo el scroll con un poco de
// inercia (en el iPhone el scroll llega a saltos mientras cambia la barra del navegador y así no se notan).
// Fuera de eso, solo se dibuja cuando algo cambia.
//
// Uso: import { montar } from ".../bolsa-3d/ficha.js"; montar(figura, { glb, piel });
//   figura: el <figure> que contiene la <img> de la bolsa.
//   glb: bolsa.glb; piel: etiqueta liviana (web/<id>.webp, 1144 x 1920, proporción 2288:3840).

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/+esm";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/loaders/GLTFLoader.js/+esm";
import { DRACOLoader } from "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/loaders/DRACOLoader.js/+esm";
import { RoomEnvironment } from "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/environments/RoomEnvironment.js/+esm";

export const DRACO = "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/libs/draco/gltf/";

// Cámara calcada de la foto de producto (600 x 457 px): giro 31.96°, cámara a 0.523 m de alto y 1.406 m
// del eje, distancia focal de 554 px, mira 2.33° hacia abajo, centro óptico corrido (-7.4, -1.2) px.
const FOTO = { w: 600, h: 457, giro: 31.959, alto: 0.5233, dist: 1.4057, focal: 554.0951, baja: 2.3331, ox: -7.3875, oy: -1.2485 };
// Cuánto se puede girar a cada lado (grados) y cuánto se estira al pasarse.
const LIMITE = 30, ELASTICO = 10;
// Vaivén en reposo: amplitud (grados), un ida y vuelta cada PERIODO segundos, arranca a los ESPERA segundos de soltar.
const VAIVEN = 7, PERIODO = 7, ESPERA = 2.5;
// Entrada: la bolsa llega más grande y girada, y se asienta en su lugar (escala y giro con la misma curva).
const ENTRADA = { segundos: 1.6, escala: 1.22, giro: 45 };
const CENTRO_Y = 0.47; // mitad del alto de la bolsa: la escala de la entrada se hace alrededor de ese punto
// Scroll: la bolsa gira GIRO grados (negativo = hacia el frente, de cara a la cámara) en los primeros RECORRIDO px,
// o antes si la figura sale de pantalla antes (termina cuando bajó el 60 % de la figura). Lo sigue con un retardo de
// INERCIA segundos.
const SCROLL = { recorrido: 400, giro: -25, inercia: 0.14 };

export async function montar(figura, { glb, piel }) {
  const foto = figura.querySelector("img");
  if (!foto) return;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;
  const lienzo = renderer.domElement;
  lienzo.className = "pr-bolsa3d";
  lienzo.setAttribute("aria-hidden", "true");

  const escena = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  escena.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  escena.environmentIntensity = 0.55;
  pmrem.dispose();
  // Luz principal arriba a la izquierda, un poco de frente, y un recorte frío desde atrás a la derecha.
  const clave = new THREE.DirectionalLight(0xffffff, 2.1);
  clave.position.set(-1.1, 3.2, 1.5);
  escena.add(clave);
  const recorte = new THREE.DirectionalLight(0xe8f0ff, 0.9);
  recorte.position.set(2.2, 1.4, -1.8);
  escena.add(recorte);

  // Cámara de la foto, en coordenadas de three (y arriba, la bolsa mira a +z).
  const g = THREE.MathUtils.degToRad(FOTO.giro), b = THREE.MathUtils.degToRad(FOTO.baja);
  const camara = new THREE.PerspectiveCamera(2 * Math.atan(FOTO.h / 2 / FOTO.focal) * 180 / Math.PI, FOTO.w / FOTO.h, 0.05, 20);
  camara.position.set(-FOTO.dist * Math.sin(g), FOTO.alto, FOTO.dist * Math.cos(g));
  camara.lookAt(camara.position.clone().add(new THREE.Vector3(Math.sin(g) * Math.cos(b), -Math.sin(b), -Math.cos(g) * Math.cos(b))));

  // Malla, piel y decodificador en paralelo.
  const draco = new DRACOLoader().setDecoderPath(DRACO);
  const cargador = new GLTFLoader().setDRACOLoader(draco);
  const [gltf, mapa] = await Promise.all([
    cargador.loadAsync(glb),
    fetch(piel).then(r => r.blob()).then(bl => createImageBitmap(bl, { colorSpaceConversion: "none" })),
  ]);
  draco.dispose();

  const textura = new THREE.Texture(mapa);
  textura.colorSpace = THREE.SRGBColorSpace;
  textura.flipY = false;
  textura.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  textura.needsUpdate = true;
  const etiqueta = new THREE.MeshPhysicalMaterial({ map: textura, roughness: 0.42, clearcoat: 0.45, clearcoatRoughness: 0.28 });
  const tapa = new THREE.MeshPhysicalMaterial({ color: 0xeceeef, roughness: 0.5, clearcoat: 0.3, clearcoatRoughness: 0.35 });
  const bolsa = gltf.scene;
  bolsa.traverse(o => { if (o.isMesh) o.material = o.material.name === "etiqueta" ? etiqueta : tapa; });
  escena.add(bolsa);

  // El lienzo tapa la figura entera; la foto ocupa un rectángulo adentro (object-fit: contain con padding).
  // La cámara se corre para que ese rectángulo coincida con el encuadre de la foto.
  function medir() {
    const W = figura.clientWidth, H = figura.clientHeight;
    if (!W || !H) return;
    const cs = getComputedStyle(foto);
    const pl = parseFloat(cs.paddingLeft), pr = parseFloat(cs.paddingRight), pt = parseFloat(cs.paddingTop), pb = parseFloat(cs.paddingBottom);
    const cw = foto.clientWidth - pl - pr, ch = foto.clientHeight - pt - pb;
    const s = (cs.objectFit === "cover" ? Math.max : Math.min)(cw / FOTO.w, ch / FOTO.h);
    const rw = FOTO.w * s, rh = FOTO.h * s;
    const rx = foto.offsetLeft + pl + (cw - rw) / 2, ry = foto.offsetTop + pt + (ch - rh) / 2;
    const caja = figura.getBoundingClientRect();
    recorrido = THREE.MathUtils.clamp(caja.top + scrollY + 0.6 * H, 120, SCROLL.recorrido);
    renderer.setSize(W, H, false);
    camara.setViewOffset(rw, rh, -rx - FOTO.ox * s, -ry - FOTO.oy * s, W, H);
    pedir();
  }

  // ---------- giro ----------
  let giro = 0, objetivo = 0, arrastre = null, cuadro = 0;
  // Vaivén: amplitud actual (sube de a poco), fase y desde cuándo está quieta.
  const quieto = matchMedia("(prefers-reduced-motion: reduce)");
  let amp = 0, fase = 0, antes = 0, quietaDesde = Infinity, enPantalla = true;
  // Entrada: 0 al empezar, 1 al terminar (sin movimiento reducido arranca terminada).
  let entradaDesde = 0, entrada = quieto.matches ? 1 : 0;
  // Giro por scroll: lo que pide la posición de la página y lo que lleva la bolsa (lo sigue con inercia).
  let desp = 0, recorrido = SCROLL.recorrido;
  const metaScroll = () => quieto.matches ? 0
    : THREE.MathUtils.degToRad(SCROLL.giro) * THREE.MathUtils.clamp(scrollY / recorrido, 0, 1);
  function entrar(p) {
    const e = 1 - Math.pow(1 - p, 3);
    const k = 1 + (ENTRADA.escala - 1) * (1 - e);
    bolsa.scale.setScalar(k);
    bolsa.position.y = CENTRO_Y * (1 - k);
    return THREE.MathUtils.degToRad(ENTRADA.giro) * (1 - e);
  }
  const meciendo = () => !quieto.matches && enPantalla && !document.hidden && !arrastre;
  const lim = THREE.MathUtils.degToRad(LIMITE), ela = THREE.MathUtils.degToRad(ELASTICO);
  // Pasado el límite el giro se frena: cuanto más se pasa, menos avanza (nunca más de ELASTICO grados).
  const frenar = (a) => {
    const fuera = Math.abs(a) - lim;
    return fuera <= 0 ? a : Math.sign(a) * (lim + ela * (1 - Math.exp(-fuera / ela)));
  };
  function dibujar(ahora) {
    cuadro = 0;
    const dt = Math.min(0.05, antes ? (ahora - antes) / 1000 : 0);
    antes = ahora;
    let vaiven = 0, llegada = 0;
    // Primer cuadro (dt 0): toma la posición de la página sin animar, por si se entra con la página ya bajada.
    const ms = metaScroll();
    desp = dt ? desp + (ms - desp) * (1 - Math.exp(-dt / SCROLL.inercia)) : ms;
    const girando = Math.abs(ms - desp) > 1e-4;
    if (girando) pedir(); else desp = ms;
    if (entrada < 1) {
      entrada = THREE.MathUtils.clamp((ahora - entradaDesde) / (ENTRADA.segundos * 1000), 0, 1);
      llegada = entrar(entrada);
      if (entrada < 1) pedir(); else quietaDesde = ahora;
    }
    if (!arrastre) {
      const meta = THREE.MathUtils.clamp(objetivo, -lim, lim);
      objetivo = meta;
      giro += (meta - giro) * 0.18;
      if (Math.abs(meta - giro) > 1e-4) pedir(); else giro = meta;
      // Mientras gira por el scroll el vaivén se apaga de a poco y vuelve a esperar.
      if (girando) quietaDesde = ahora;
      const mecer = meciendo() && ahora - quietaDesde > ESPERA * 1000;
      amp = THREE.MathUtils.clamp(amp + (mecer ? dt / 1.5 : -dt / 0.4), 0, 1);
      if (amp > 0) {
        fase += dt * 2 * Math.PI / PERIODO;
        // El vaivén va de ida y vuelta alrededor de donde quedó, sin pasarse del límite.
        vaiven = amp * THREE.MathUtils.degToRad(VAIVEN) * Math.sin(fase);
        vaiven = THREE.MathUtils.clamp(giro + vaiven, -lim, lim) - giro;
        pedir();
      } else if (meciendo()) pedir();
    }
    bolsa.rotation.y = (arrastre ? frenar(objetivo) : giro + vaiven + llegada) + desp;
    renderer.render(escena, camara);
  }
  function pedir() { if (!cuadro) cuadro = requestAnimationFrame(dibujar); }

  lienzo.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 || entrada < 1) return;
    // Lo que se había mecido pasa a ser el giro, así no salta al agarrarla.
    objetivo = giro = bolsa.rotation.y - desp; amp = 0; fase = 0;
    arrastre = { x: e.clientX, desde: objetivo, id: e.pointerId };
    lienzo.setPointerCapture(e.pointerId);
    lienzo.classList.add("pr-bolsa3d--mano");
  });
  lienzo.addEventListener("pointermove", (e) => {
    if (!arrastre || e.pointerId !== arrastre.id) return;
    // Un ancho de figura de arrastre son unos 90 grados.
    objetivo = arrastre.desde + (e.clientX - arrastre.x) / figura.clientWidth * Math.PI / 2;
    giro = frenar(objetivo);
    pedir();
  });
  const soltar = (e) => {
    if (!arrastre || e.pointerId !== arrastre.id) return;
    objetivo = giro = frenar(objetivo);
    arrastre = null;
    quietaDesde = performance.now();
    lienzo.classList.remove("pr-bolsa3d--mano");
    pedir();
  };
  lienzo.addEventListener("pointerup", soltar);
  lienzo.addEventListener("pointercancel", soltar);

  // Primer cuadro: se sube todo a la GPU y se dibuja con el lienzo todavía oculto; recién entonces se cambia la foto.
  figura.appendChild(lienzo);
  medir();
  renderer.compile(escena, camara);
  cancelAnimationFrame(cuadro); cuadro = 0;
  // El dibujo y el cambio de clase van en el mismo paso: el navegador los muestra juntos en el próximo cuadro.
  // El primer cuadro ya es el comienzo de la entrada.
  entradaDesde = performance.now();
  desp = metaScroll();
  bolsa.rotation.y = (entrada < 1 ? entrar(0) : 0) + desp;
  if (entrada >= 1) quietaDesde = entradaDesde;
  renderer.render(escena, camara);
  figura.classList.add("pr-ficha-cab__arte--3d");
  performance.mark("bolsa3d-lista");
  pedir();

  new ResizeObserver(medir).observe(figura);
  addEventListener("scroll", pedir, { passive: true });
  // El vaivén solo corre mientras la bolsa se ve.
  new IntersectionObserver(([e]) => { enPantalla = e.isIntersecting; antes = 0; pedir(); }).observe(figura);
  document.addEventListener("visibilitychange", () => { antes = 0; pedir(); });
  quieto.addEventListener?.("change", pedir);
  // Al irse de la página se libera la GPU (si la página queda guardada para volver atrás, se conserva).
  addEventListener("pagehide", (e) => {
    if (e.persisted) return;
    renderer.dispose(); textura.dispose(); mapa.close?.();
    renderer.forceContextLoss();
  });
}
