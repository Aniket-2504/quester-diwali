/**
 * iQOO Diwali – procedural 3D models (no Blender / no .glb needed).
 * Written for modern three.js (r152+): `npm i three`.
 * Uses document.createElement('canvas') for textures, so run it in the BROWSER only
 * (Next.js: "use client" + dynamic import with ssr:false).
 *
 * API
 *   makeEnv(renderer)            -> environment texture (set scene.environment = it) – needed for shiny gold/glass
 *   addDefaultLights(scene)      -> basic lights tuned for these models
 *   createQLogo({color,depth})   -> THREE.Group, extruded iQOO "Q" (≈3.1 units wide), centred
 *   createGiftBox()              -> THREE.Group, the iQOO Diwali box (≈3.2 x 0.8 x 2.6, lid hinged at the back)
 *       box.userData.open(true|false)         open / close lid (animated)
 *       box.userData.isOpen()
 *       box.userData.update(dt)               CALL EVERY FRAME (dt in seconds) – animates lid + jars dropping in
 *       box.userData.slots                    6 Vector3 slot positions (box-local)
 *       box.userData.putJar(i,item,instant?)  put a jar in slot i (0-5); drops in unless instant=true
 *       box.userData.removeJar(i) / clearJars()
 *       box.userData.setSlotWorld(i)          -> world position of slot i (for fly-in animations)
 *   createJar(item)              -> THREE.Group, one jar (origin at its base, ~0.7 tall)
 *   ITEMS                        -> 10 default items {id,name,color}
 */
import * as THREE from 'three';

const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const tex = (c) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
const rnd = (a, b) => a + Math.random() * (b - a);
const GOLD = new THREE.MeshStandardMaterial({ color: 0xd9a92c, metalness: 1, roughness: 0.22 });
const IS_MOBILE = typeof window !== 'undefined' && window.innerWidth < 640;

/* ---------- iQOO wordmark, drawn from the logo geometry (logo box 1280 x 300) ---------- */
export function drawWordmark(c, x, y, s) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.beginPath(); c.rect(0, 0, 50, 48); c.rect(0, 97, 50, 201); c.fill();
  c.beginPath(); c.ellipse(305, 149, 155, 149, 0, 0, Math.PI / 2, true); c.ellipse(305, 149, 103, 101, 0, Math.PI / 2, 0, false); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(302, 180); c.lineTo(338, 146); c.lineTo(465, 268); c.lineTo(428, 302); c.closePath(); c.fill();
  [715, 1125].forEach((cx) => { c.beginPath(); c.ellipse(cx, 149, 155, 149, 0, 0, 6.2832); c.ellipse(cx, 149, 103, 101, 0, 0, 6.2832, true); c.fill('evenodd'); });
  c.restore();
}

/* ---------- textures ---------- */
function marble() {
  const size = IS_MOBILE ? 512 : 1024;
  const sizeH = IS_MOBILE ? 256 : 512;
  const c = cv(size, sizeH), g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, size, sizeH);
  gr.addColorStop(0, '#a9c0cf'); gr.addColorStop(.5, '#86a5bb'); gr.addColorStop(1, '#b7c4c9'); g.fillStyle = gr; g.fillRect(0, 0, size, sizeH);
  const veinCount = IS_MOBILE ? 30 : 60;
  for (let i = 0; i < veinCount; i++) {
    const x = rnd(0, size), y = rnd(0, sizeH), r = rnd(40, 160), b = g.createRadialGradient(x, y, 0, x, y, r);
    b.addColorStop(0, Math.random() < .5 ? 'rgba(255,255,255,.16)' : 'rgba(60,95,130,.18)'); b.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = b; g.fillRect(x - r, y - r, 2 * r, 2 * r);
  }
  g.shadowColor = 'rgba(255,200,60,.8)'; g.shadowBlur = 6;
  const lineCount = IS_MOBILE ? 8 : 16;
  for (let k = 0; k < lineCount; k++) {
    let x = rnd(0, size), y = rnd(0, sizeH), a = rnd(0, 6.28);
    g.beginPath(); g.moveTo(x, y); g.lineWidth = rnd(1, 5); g.strokeStyle = '#dcae3c';
    for (let i = 0; i < 45; i++) { a += rnd(-.9, .9); x += Math.cos(a) * rnd(8, 22); y += Math.sin(a) * rnd(8, 22); g.lineTo(x, y); }
    g.stroke();
  }
  return c;
}
function velvet() {
  const c = cv(256, 256), g = c.getContext('2d'); g.fillStyle = '#1630a8'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 7000; i++) { g.fillStyle = Math.random() < .5 ? 'rgba(255,255,255,.07)' : 'rgba(0,0,20,.12)'; g.fillRect(rnd(0, 256), rnd(0, 256), 1.5, 1.5); }
  return c;
}
function lidArt() { // gold iQOO text on the lid top
  const c = cv(1024, 832), g = c.getContext('2d'); g.fillStyle = '#e6bf5a'; drawWordmark(g, 110, 360, .38); return c;
}
function innerArt(greeting = ['WISHES YOU A', 'HAPPY DIWALI']) { // inside of the lid
  const c = cv(1024, 832), g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 832);
  gr.addColorStop(0, '#1d34a0'); gr.addColorStop(1, '#101e66'); g.fillStyle = gr; g.fillRect(0, 0, 1024, 832);
  g.fillStyle = g.strokeStyle = '#e6bf5a'; drawWordmark(g, 302, 250, .328);
  [110, 914].forEach((x) => { g.lineWidth = 2; g.beginPath(); g.moveTo(x, 40); g.lineTo(x, 470); g.stroke(); for (let y = 100; y < 460; y += 75) { g.beginPath(); g.arc(x, y, 9, 0, 6.28); g.fill(); } });
  g.beginPath(); g.moveTo(330, 410); g.lineTo(694, 410); g.stroke();
  g.textAlign = 'center'; g.font = '500 34px Georgia,serif'; g.letterSpacing = '10px'; g.fillText(greeting[0], 512, 490);
  g.font = '700 58px Georgia,serif'; g.letterSpacing = '4px'; g.fillText(greeting[1], 512, 580);
  return c;
}
function labelArt(name) {
  const c = cv(256, 256), g = c.getContext('2d'); g.fillStyle = '#1b4fa8'; g.fillRect(0, 0, 256, 256);
  g.strokeStyle = g.fillStyle = '#e6bf5a'; g.lineWidth = 3; [120, 110].forEach((r) => { g.beginPath(); g.arc(128, 128, r, 0, 6.28); g.stroke(); });
  g.setLineDash([2, 8]); g.beginPath(); g.arc(128, 128, 98, 0, 6.28); g.stroke(); g.setLineDash([]);
  drawWordmark(g, 102, 62, .04);
  g.textAlign = 'center'; g.font = '700 25px Georgia,serif';
  const w = name.toUpperCase().split(' '), lines = w.length > 1 ? [w[0], w.slice(1).join(' ')] : [w[0]];
  lines.forEach((t, i) => g.fillText(t, 128, 128 + i * 30 - (lines.length - 1) * 8 + 10));
  return c;
}

/* ---------- environment + lights ---------- */
const envCache = new WeakMap();
export function makeEnv(renderer) {
  if (renderer && envCache.has(renderer)) {
    return envCache.get(renderer);
  }
  const sphereSegs = IS_MOBILE ? 16 : 32;
  const s = new THREE.Scene(), c = cv(8, 256), g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, '#cfd8ff'); gr.addColorStop(.5, '#3a3550'); gr.addColorStop(1, '#15131c'); g.fillStyle = gr; g.fillRect(0, 0, 8, 256);
  const skyTex = new THREE.CanvasTexture(c); skyTex.colorSpace = THREE.SRGBColorSpace;
  s.add(new THREE.Mesh(new THREE.SphereGeometry(50, sphereSegs, sphereSegs / 2), new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide })));
  const m = new THREE.MeshBasicMaterial({ color: 0xffffff });
  [[0, 20, 0, 30, 1, 10], [-30, 8, 10, 1, 12, 30], [30, 8, -10, 1, 12, 30]].forEach((a) => { const b = new THREE.Mesh(new THREE.BoxGeometry(a[3], a[4], a[5]), m); b.position.set(a[0], a[1], a[2]); s.add(b); });
  const p = new THREE.PMREMGenerator(renderer), t = p.fromScene(s, .04).texture; p.dispose();
  if (renderer) envCache.set(renderer, t);
  return t;
}
export function addDefaultLights(scene) {
  scene.add(new THREE.HemisphereLight(0xffffff, 0x443322, 1.2));
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(4, 6, 5); scene.add(key);
}

/* ---------- 3D iQOO "Q" (hero logo) ---------- */
export function createQLogo({ color = 0xf2b31e, depth = 0.5 } = {}) {
  const R = 1.55, r = 1.04, bevel = 0.035;
  const ring = new THREE.Shape();
  ring.absarc(0, 0, R, 0, Math.PI * 1.5, false); ring.lineTo(0, -r); ring.absarc(0, 0, r, Math.PI * 1.5, 0, true); ring.closePath();
  const L = 1.76, W = 0.5, bar = new THREE.Shape();
  bar.moveTo(-L / 2, -W / 2); bar.lineTo(L / 2, -W / 2); bar.lineTo(L / 2, W / 2); bar.lineTo(-L / 2, W / 2); bar.closePath();
  const curveSegs = IS_MOBILE ? 48 : 96;
  const opts = { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: IS_MOBILE ? 2 : 4, curveSegments: curveSegs };
  const mat = new THREE.MeshPhysicalMaterial({ color, metalness: .35, roughness: .32, clearcoat: .8, clearcoatRoughness: .2 });
  const a = new THREE.Mesh(new THREE.ExtrudeGeometry(ring, opts), mat);
  const b = new THREE.Mesh(new THREE.ExtrudeGeometry(bar, opts), mat);
  b.position.set(0.775, -0.76, 0); b.rotation.z = -Math.PI / 4;
  const g = new THREE.Group(); g.add(a, b);
  const c = new THREE.Box3().setFromObject(g).getCenter(new THREE.Vector3()); a.position.sub(c); b.position.sub(c);
  g.userData.material = mat; return g;
}

/* ---------- jars ---------- */
export const ITEMS = [
  { id: 'cashew', name: 'Roasted Cashews', color: 0xe3c288 }, { id: 'kaju', name: 'Kaju Katli', color: 0xefe6cf },
  { id: 'ladoo', name: 'Motichoor Ladoo', color: 0xf0a22e }, { id: 'cran', name: 'Masala Cranberry', color: 0xa3162b },
  { id: 'kiwi', name: 'Dried Kiwi', color: 0x6f9a2a }, { id: 'mocha', name: 'Mocha Cashews', color: 0x6b4129 },
  { id: 'chikki', name: 'Almond Chikki', color: 0xc98a3c }, { id: 'soan', name: 'Soan Papdi', color: 0xf3d27a },
  { id: 'pan', name: 'Pan Shot', color: 0x2f6b3a }, { id: 'mix', name: 'Dry Fruit Mix', color: 0xb98a5a },
];
export function createJar(it) {
  const j = new THREE.Group();
  const segs = IS_MOBILE ? 20 : 40;
  const lidSegs = IS_MOBILE ? 24 : 48;
  const fillCount = IS_MOBILE ? 35 : 70;
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(.36, .36, .55, segs), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: .22, roughness: .05, clearcoat: 1, depthWrite: false }));
  glass.position.y = .275; glass.renderOrder = 2;
  const base = new THREE.Mesh(new THREE.CylinderGeometry(.3, .3, .4, segs), new THREE.MeshStandardMaterial({ color: new THREE.Color(it.color).multiplyScalar(.6), roughness: .9 }));
  base.position.y = .23;
  const fill = new THREE.InstancedMesh(new THREE.SphereGeometry(.065, IS_MOBILE ? 6 : 10, IS_MOBILE ? 5 : 8), new THREE.MeshStandardMaterial({ color: it.color, roughness: .75 }), fillCount), m = new THREE.Matrix4();
  for (let i = 0; i < fillCount; i++) { const a = rnd(0, 6.28), r = Math.sqrt(Math.random()) * .27; m.makeScale(rnd(.8, 1.3), rnd(.7, 1.1), rnd(.8, 1.3)); m.setPosition(Math.cos(a) * r, rnd(.06, .42), Math.sin(a) * r); fill.setMatrixAt(i, m); }
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(.385, .385, .14, lidSegs), GOLD); lid.position.y = .62;
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(.4, .4, .03, lidSegs), GOLD); ring.position.y = .56;
  const lab = new THREE.Mesh(new THREE.CircleGeometry(.33, lidSegs), new THREE.MeshStandardMaterial({ map: tex(labelArt(it.name)), roughness: .4, metalness: .2 }));
  lab.rotation.x = -Math.PI / 2; lab.position.y = .692;
  j.add(base, fill, glass, lid, ring, lab); j.userData.item = it; return j;
}

/* ---------- gift box ---------- */
export function createGiftBox({ greeting } = {}) {
  const W = 3.2, D = 2.6, H = .8, T = .08, B = THREE.BoxGeometry, g = new THREE.Group();
  const add = (geo, m, x, y, z, p = g) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); p.add(o); return o; };
  const mm = new THREE.MeshPhysicalMaterial({ map: tex(marble()), roughness: .3, metalness: .05, clearcoat: 1, clearcoatRoughness: .15 });
  add(new B(W, T, D), mm, 0, T / 2, 0);
  add(new B(W, H, T), mm, 0, H / 2, D / 2 - T / 2); add(new B(W, H, T), mm, 0, H / 2, -D / 2 + T / 2);
  add(new B(T, H, D - 2 * T), mm, W / 2 - T / 2, H / 2, 0); add(new B(T, H, D - 2 * T), mm, -W / 2 + T / 2, H / 2, 0);
  const satin = new THREE.MeshPhysicalMaterial({ color: 0xcfc46e, roughness: .35, sheen: 1, sheenColor: new THREE.Color(0xfff2a0), side: THREE.BackSide });
  add(new B(W - 2 * T - .01, H - T, D - 2 * T - .01), satin, 0, (H + T) / 2 + .004, 0);

  const pv = new THREE.Group(); pv.position.set(0, H, -D / 2); g.add(pv); // lid hinge at the back
  const vt = tex(velvet()); vt.wrapS = vt.wrapT = THREE.RepeatWrapping; vt.repeat.set(6, 5);
  add(new B(W + .1, .18, D + .1), new THREE.MeshPhysicalMaterial({ map: vt, roughness: 1, sheen: 1, sheenColor: new THREE.Color(0x6f8cff) }), 0, .09, D / 2, pv);
  const top = new THREE.Mesh(new THREE.PlaneGeometry(W + .1, D + .1), new THREE.MeshStandardMaterial({ map: tex(lidArt()), transparent: true, metalness: .9, roughness: .3 }));
  top.rotation.x = -Math.PI / 2; top.position.set(0, .183, D / 2); pv.add(top);
  [1.0, 1.25].forEach((x) => add(new B(.1, .004, D + .1), GOLD, x, .182, D / 2, pv));
  const inner = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshStandardMaterial({ map: tex(innerArt(greeting)), roughness: .45, metalness: .1 }));
  inner.rotation.x = Math.PI / 2; inner.position.set(0, -.002, D / 2); pv.add(inner);

  const pts = [[-.42, .62, .02], [-.42, .4, .1], [-.3, .26, .17], [.3, .26, .17], [.42, .4, .1], [.42, .62, .02]].map((p) => new THREE.Vector3(...p));
  add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, .04, 12), GOLD, 0, 0, D / 2);
  [-.42, .42].forEach((x) => add(new B(.2, .12, .06), GOLD, x, .64, D / 2 + .03));
  add(new B(.16, .2, .07), GOLD, 0, H - .08, D / 2 + .04);

  const slots = [-.95, 0, .95].flatMap((x) => [-.55, .55].map((z) => new THREE.Vector3(x, T, z)));
  const jars = new Map(), drops = [];
  let cur = 0, target = 0;
  g.userData = {
    slots,
    open: (o) => { target = o ? 1 : 0; },
    isOpen: () => target === 1,
    setSlotWorld: (i) => g.localToWorld(slots[i].clone()),
    putJar: (i, item, instant = false) => {
      g.userData.removeJar(i);
      const s = slots[i], j = createJar(item);
      j.position.set(s.x, instant ? s.y : 3, s.z); g.add(j); jars.set(i, j);
      if (!instant) drops.push({ j, to: s.y });
      return j;
    },
    removeJar: (i) => { const j = jars.get(i); if (j) { g.remove(j); jars.delete(i); const k = drops.findIndex((d) => d.j === j); if (k > -1) drops.splice(k, 1); } },
    clearJars: () => { [...jars.keys()].forEach((i) => g.userData.removeJar(i)); },
    update: (dt) => {
      cur += (target - cur) * Math.min(1, dt * 7.5); pv.rotation.x = -cur * 1.95;
      for (let k = drops.length - 1; k >= 0; k--) {
        const d = drops[k]; d.j.position.y += (d.to - d.j.position.y) * Math.min(1, dt * 9.5);
        if (Math.abs(d.to - d.j.position.y) < .002) { d.j.position.y = d.to; drops.splice(k, 1); }
      }
    },
  };
  return g;
}
