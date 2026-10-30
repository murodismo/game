import * as THREE from 'three';

/* ============ 1. SARDOR (ko'k futbolkali qahramon) ============ */
export const SARDOR = {
  name: 'Sardor', skin: '#f4cdb3', line: '#b9775f',
  hairC: '#2b2522', hairL: '#58504a', hairD: '#120e0d',
  eye: '#2a2522', eyeRy: 0.048, brow: '#2b2522',
  shirt: '#3e62b8', pattern: 'plain', accent: '#ffffff',
  pants: '#77848b', shoe: '#2d4a8e', sole: '#f3efe2', laces: true,
};

// Kiyimlar ro'yxati (backenddan) va tanlangan id'lar asosida qahramon ko'rinishi
export function dressUp(clothes, outfit) {
  const d = { ...SARDOR };
  for (const id of Object.values(outfit || {})) {
    const c = clothes.find((x) => x.id === id);
    if (c) Object.assign(d, c.colors);
  }
  return d;
}

/* ============ 2. CHIZISH YORDAMCHILARI (canvas) ============ */
const PPU = 220; // 1 birlik = 220 piksel
const LW = 0.022; // kontur qalinligi
function shade(hex, amt) { // amt <0 qoraytiradi, >0 oqartiradi
  const n = parseInt(hex.slice(1), 16);
  let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const t = amt < 0 ? 0 : 255, k = Math.abs(amt);
  r = Math.round(r + (t - r) * k); g = Math.round(g + (t - g) * k); b = Math.round(b + (t - b) * k);
  return `rgb(${r},${g},${b})`;
}
function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function fs(g, fill, stroke, lw = LW) { g.fillStyle = fill; g.fill(); g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); }
function ell(g, x, y, rx, ry, rot = 0) { g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); }
function line(g, pts, color, lw) {
  g.beginPath(); g.moveTo(pts[0], pts[1]);
  if (pts.length === 6) g.quadraticCurveTo(pts[2], pts[3], pts[4], pts[5]); else g.lineTo(pts[2], pts[3]);
  g.strokeStyle = color; g.lineWidth = lw; g.stroke();
}

function tex(W, H, draw) {
  const c = document.createElement('canvas');
  c.width = Math.ceil(W * PPU); c.height = Math.ceil(H * PPU);
  const g = c.getContext('2d'); g.scale(PPU, PPU); g.lineJoin = 'round'; g.lineCap = 'round';
  draw(g);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

/* ---- Bosh (yuz, quloq, bo'yin, soch) ---- */
function drawHead(g, d) {
  g.translate(0, 0.06);
  const L = d.line;
  // bo'yin
  rr(g, 0.47, 1.0, 0.26, 0.42, 0.04); fs(g, d.skin, L);
  g.save(); rr(g, 0.47, 1.0, 0.26, 0.42, 0.04); g.clip(); ell(g, 0.6, 1.1, 0.2, 0.09); g.fillStyle = shade(d.skin, -0.18); g.fill(); g.restore();
  // quloqlar
  for (const x of [0.215, 0.985]) { ell(g, x, 0.75, 0.075, 0.11); fs(g, d.skin, L); line(g, [x + (x < 0.6 ? 0.02 : -0.02), 0.7, x + (x < 0.6 ? -0.015 : 0.015), 0.75, x + (x < 0.6 ? 0.02 : -0.02), 0.8], shade(d.skin, -0.25), 0.015); }
  // yuz
  g.beginPath(); g.moveTo(0.21, 0.6);
  g.bezierCurveTo(0.21, 0.2, 0.99, 0.2, 0.99, 0.6);
  g.bezierCurveTo(0.99, 0.98, 0.8, 1.15, 0.6, 1.15);
  g.bezierCurveTo(0.4, 1.15, 0.21, 0.98, 0.21, 0.6); g.closePath(); fs(g, d.skin, L);
  for (const x of [0.36, 0.84]) { ell(g, x, 0.93, 0.06, 0.032); g.fillStyle = 'rgba(235,110,100,.22)'; g.fill(); }
  // qosh
  line(g, [0.35, 0.67, 0.44, 0.6, 0.53, 0.655], d.brow, 0.04);
  line(g, [0.67, 0.655, 0.76, 0.6, 0.85, 0.67], d.brow, 0.04);
  // burun
  line(g, [0.585, 0.81, 0.55, 0.88, 0.61, 0.895], L, 0.017);
  // og'iz (ochiq tabassum)
  g.beginPath(); g.moveTo(0.48, 0.945); g.quadraticCurveTo(0.6, 0.92, 0.72, 0.945);
  g.quadraticCurveTo(0.69, 1.07, 0.6, 1.07); g.quadraticCurveTo(0.51, 1.07, 0.48, 0.945); g.closePath();
  g.fillStyle = '#b8433b'; g.fill();
  g.save(); g.clip(); g.fillStyle = '#fff'; g.fillRect(0.46, 0.9, 0.28, 0.052);
  ell(g, 0.6, 1.07, 0.08, 0.04); g.fillStyle = '#ef7f7a'; g.fill(); g.restore();
  g.strokeStyle = shade(d.skin, -0.55); g.lineWidth = 0.018; g.stroke();
  drawHair(g, d);
}

/* ---- Tikanli soch ---- */
function drawHair(g, d) {
  const p = [[0.19, 0.68], [0.17, 0.44], [0.2, 0.3], [0.12, 0.24], [0.27, 0.17], [0.24, 0.06], [0.4, 0.11], [0.47, -0.01], [0.56, 0.08], [0.68, 0], [0.74, 0.1], [0.89, 0.06], [0.9, 0.2], [1.04, 0.23], [1.0, 0.36], [1.04, 0.47], [1.01, 0.68], [0.97, 0.55], [0.9, 0.47], [0.85, 0.53], [0.78, 0.44], [0.68, 0.5], [0.61, 0.42], [0.53, 0.5], [0.45, 0.43], [0.37, 0.51], [0.31, 0.45], [0.25, 0.54]];
  g.beginPath(); g.moveTo(p[0][0], p[0][1]); for (const q of p.slice(1)) g.lineTo(q[0], q[1]); g.closePath(); fs(g, d.hairC, d.hairD, 0.024);
  for (const s of [[0.32, 0.2, 0.38, 0.3, 0.36, 0.4], [0.5, 0.12, 0.55, 0.25, 0.5, 0.36], [0.72, 0.14, 0.7, 0.26, 0.74, 0.36], [0.86, 0.22, 0.84, 0.3, 0.88, 0.38]]) line(g, s, d.hairL, 0.016);
}

/* ---- Ko'zlar (alohida qatlam: ochiq / yumuq) ---- */
function drawEyes(g, d, open) {
  for (const x of [0.15, 0.47]) {
    const y = 0.11;
    if (open) {
      ell(g, x, y, 0.082, d.eyeRy); g.fillStyle = '#fff'; g.fill(); g.strokeStyle = d.line; g.lineWidth = 0.014; g.stroke();
      g.save(); ell(g, x, y, 0.082, d.eyeRy); g.clip();
      ell(g, x, y + 0.005, 0.05, 0.05); g.fillStyle = d.eye; g.fill();
      ell(g, x, y + 0.005, 0.027, 0.027); g.fillStyle = '#120c0a'; g.fill();
      ell(g, x - 0.016, y - 0.016, 0.014, 0.014); g.fillStyle = '#fff'; g.fill();
      g.restore();
      g.beginPath(); g.ellipse(x, y, 0.084, d.eyeRy + 0.002, 0, Math.PI * 1.05, Math.PI * 1.95); g.strokeStyle = '#241815'; g.lineWidth = 0.024; g.stroke();
    } else {
      line(g, [x - 0.08, y, x, y + 0.045, x + 0.08, y], '#241815', 0.024);
    }
  }
}

/* ---- Tana (futbolka + shim beli) ---- */
function drawTorso(g, d) {
  const S = d.shirt, SD = shade(S, -0.5);
  rr(g, 0.2, 0.9, 0.75, 0.3, 0.06); fs(g, d.pants, shade(d.pants, -0.45));
  g.beginPath(); g.moveTo(0.38, 0.06);
  g.quadraticCurveTo(0.2, 0.08, 0.12, 0.17); g.quadraticCurveTo(0.13, 0.6, 0.17, 1.0);
  g.quadraticCurveTo(0.575, 1.06, 0.98, 1.0); g.quadraticCurveTo(1.02, 0.6, 1.03, 0.17);
  g.quadraticCurveTo(0.95, 0.08, 0.77, 0.06); g.quadraticCurveTo(0.575, 0.27, 0.38, 0.06); g.closePath();
  g.fillStyle = S; g.fill();
  g.save(); g.clip();
  g.fillStyle = shade(S, -0.16); g.fillRect(0.1, 0, 0.1, 1.1); g.fillRect(0.9, 0, 0.15, 1.1); g.fillRect(0, 0.9, 1.2, 0.2);
  line(g, [0.3, 0.35, 0.26, 0.55, 0.3, 0.75], shade(S, 0.25), 0.02);
  line(g, [0.86, 0.4, 0.84, 0.6, 0.87, 0.8], shade(S, -0.25), 0.016);
  line(g, [0.45, 0.92, 0.55, 0.86, 0.62, 0.95], shade(S, -0.25), 0.014);
  if (d.pattern === 'stripes') {
    g.fillStyle = d.accent;
    for (let y = 0.3; y < 1.0; y += 0.18) g.fillRect(0, y, 1.2, 0.07);
  }
  if (d.pattern === 'star') star(g, 0.575, 0.55, 0.17, d.accent, shade(d.accent, -0.35));
  g.restore();
  g.strokeStyle = SD; g.lineWidth = LW; g.stroke();
  line(g, [0.38, 0.07, 0.575, 0.285, 0.77, 0.07], shade(S, -0.12), 0.045);
  line(g, [0.38, 0.06, 0.575, 0.27, 0.77, 0.06], SD, 0.018);
}

function star(g, cx, cy, r, fill, stroke) {
  g.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5, rr2 = i % 2 ? r * 0.45 : r;
    g.lineTo(cx + Math.cos(a) * rr2, cy + Math.sin(a) * rr2);
  }
  g.closePath(); fs(g, fill, stroke, 0.016);
}

/* ---- Yelka (yeng + bilak boshi) ---- */
function drawUpperArm(g, d, side) {
  rr(g, 0.085, 0.2, 0.17, 0.44, 0.08); fs(g, d.skin, d.line);
  g.beginPath(); g.moveTo(0.03, 0.12); g.quadraticCurveTo(0.03, 0, 0.17, 0); g.quadraticCurveTo(0.31, 0, 0.31, 0.12);
  g.lineTo(0.3, 0.37); g.quadraticCurveTo(0.17, 0.41, 0.04, 0.37); g.closePath();
  g.fillStyle = d.shirt; g.fill();
  g.save(); g.clip(); g.fillStyle = shade(d.shirt, -0.18); g.fillRect(side < 0 ? 0 : 0.22, 0, 0.12, 0.5);
  if (d.pattern === 'stripes') { g.fillStyle = d.accent; g.fillRect(0, 0.12, 0.4, 0.07); g.fillRect(0, 0.3, 0.4, 0.07); }
  g.restore();
  g.strokeStyle = shade(d.shirt, -0.5); g.lineWidth = LW; g.stroke();
  line(g, [0.05, 0.33, 0.17, 0.36, 0.29, 0.33], shade(d.shirt, -0.3), 0.014);
}

/* ---- Bilak + kaft ---- */
function drawForearm(g, d, side) {
  rr(g, 0.075, 0, 0.15, 0.43, 0.07); fs(g, d.skin, d.line);
  const tx = side < 0 ? 0.235 : 0.065;
  ell(g, tx, 0.45, 0.035, 0.075, side * -0.4); fs(g, d.skin, d.line);
  rr(g, 0.055, 0.39, 0.19, 0.2, 0.085); fs(g, d.skin, d.line);
  for (const x of [0.11, 0.15, 0.19]) line(g, [x, 0.53, x, 0.585], shade(d.skin, -0.3), 0.012);
  line(g, [0.09, 0.1, 0.09, 0.3], shade(d.skin, 0.25), 0.016);
}

/* ---- Son ---- */
function drawThigh(g, d, side) {
  rr(g, 0.04, 0, 0.34, 0.84, 0.09); g.fillStyle = d.pants; g.fill();
  g.save(); g.clip(); g.fillStyle = shade(d.pants, -0.18); g.fillRect(side < 0 ? 0.02 : 0.3, 0, 0.1, 0.9);
  line(g, [0.12, 0.55, 0.2, 0.6, 0.28, 0.52], shade(d.pants, -0.3), 0.016);
  line(g, [0.14, 0.1, 0.15, 0.3, 0.13, 0.45], shade(d.pants, 0.18), 0.016); g.restore();
  g.strokeStyle = shade(d.pants, -0.45); g.lineWidth = LW; g.stroke();
}

/* ---- Boldir + oyoq kiyim ---- */
function drawShin(g, d, side) {
  g.beginPath(); g.moveTo(0.05, 0); g.lineTo(0.37, 0); g.lineTo(0.355, 0.7); g.lineTo(0.065, 0.7); g.closePath();
  g.fillStyle = d.pants; g.fill();
  g.save(); g.clip(); g.fillStyle = shade(d.pants, -0.18); g.fillRect(side < 0 ? 0.02 : 0.29, 0, 0.1, 0.8);
  line(g, [0.12, 0.2, 0.2, 0.26, 0.28, 0.2], shade(d.pants, -0.3), 0.016); g.restore();
  g.strokeStyle = shade(d.pants, -0.45); g.lineWidth = LW; g.stroke();
  const ox = side * 0.03;
  rr(g, 0.03 + ox, 0.62, 0.36, 0.21, 0.1); fs(g, d.shoe, shade(d.shoe, -0.45));
  rr(g, 0.02 + ox, 0.79, 0.38, 0.09, 0.045); fs(g, d.sole, shade(d.shoe, -0.45));
  if (d.laces) for (const y of [0.67, 0.71, 0.75]) line(g, [0.15 + ox, y, 0.27 + ox, y + 0.02], '#f5f2e8', 0.018);
  line(g, [0.08 + ox, 0.68, 0.12 + ox, 0.66], 'rgba(255,255,255,.45)', 0.02);
}

/* ============ 3. BO'G'IMLI PERSONAJ (cut-out puppet), faqat turish holati ============ */
const HIP = 1.6;
function part(texture, W, H, px, py, layer) {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(W, H),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, side: THREE.DoubleSide }),
  );
  m.position.set(W / 2 - px, py - H / 2, 0);
  m.renderOrder = 10 + layer;
  return m;
}

export class Puppet {
  constructor(d) {
    this.d = d;
    this.blinkT = 1 + Math.random() * 2; this.blinking = false;
    const root = this.root = new THREE.Group();
    const body = this.body = new THREE.Group(); root.add(body);
    const hips = new THREE.Group(); hips.position.y = HIP; body.add(hips);
    this.torso = new THREE.Group(); hips.add(this.torso);
    this.torsoMesh = part(tex(1.15, 1.2, (g) => drawTorso(g, d)), 1.15, 1.2, 0.575, 1.02, 4);
    this.torso.add(this.torsoMesh);
    this.neck = new THREE.Group(); this.neck.position.y = 0.92; this.torso.add(this.neck);
    this.neck.add(part(tex(1.2, 1.42, (g) => drawHead(g, d)), 1.2, 1.42, 0.6, 1.18, 3));
    this.eyeOpen = tex(0.62, 0.22, (g) => drawEyes(g, d, true));
    this.eyeShut = tex(0.62, 0.22, (g) => drawEyes(g, d, false));
    this.eyes = part(this.eyeOpen, 0.62, 0.22, 0.31, 0.11, 5);
    this.eyes.position.y = 1.18 - (0.77 + 0.06);
    this.neck.add(this.eyes);
    this.sh = []; this.el = []; this.hip = []; this.kn = [];
    this.armMesh = []; this.thighMesh = []; this.shinMesh = [];
    [-1, 1].forEach((s, k) => {
      const sh = new THREE.Group(); sh.position.set(s * 0.43, 0.86, 0); this.torso.add(sh);
      this.armMesh[k] = part(tex(0.34, 0.62, (g) => drawUpperArm(g, d, s)), 0.34, 0.62, 0.17, 0.07, 6);
      sh.add(this.armMesh[k]);
      const el = new THREE.Group(); el.position.y = -0.5; sh.add(el);
      el.add(part(tex(0.3, 0.62, (g) => drawForearm(g, d, s)), 0.3, 0.62, 0.15, 0.04, 7));
      const th = new THREE.Group(); th.position.set(s * 0.2, 0, 0); hips.add(th);
      this.thighMesh[k] = part(tex(0.42, 0.84, (g) => drawThigh(g, d, s)), 0.42, 0.84, 0.21, 0.08, 1);
      th.add(this.thighMesh[k]);
      const kn = new THREE.Group(); kn.position.y = -0.72; th.add(kn); this.kn[k] = kn;
      this.shinMesh[k] = part(tex(0.42, 0.9, (g) => drawShin(g, d, s)), 0.42, 0.9, 0.21, 0.04, 2);
      kn.add(this.shinMesh[k]);
      this.sh[k] = sh; this.el[k] = el; this.hip[k] = th;
    });
  }

  // Kiyimni almashtirish: faqat futbolka, shim va oyoq kiyim teksturalari qayta chiziladi
  setOutfit(d) {
    this.d = d;
    const swap = (mesh, W, H, draw) => {
      mesh.material.map.dispose();
      mesh.material.map = tex(W, H, draw);
    };
    swap(this.torsoMesh, 1.15, 1.2, (g) => drawTorso(g, d));
    [-1, 1].forEach((s, k) => {
      swap(this.armMesh[k], 0.34, 0.62, (g) => drawUpperArm(g, d, s));
      swap(this.thighMesh[k], 0.42, 0.84, (g) => drawThigh(g, d, s));
      swap(this.shinMesh[k], 0.42, 0.9, (g) => drawShin(g, d, s));
    });
  }

  // Yurish: oyoqlar va qo'llar navbatma-navbat tebranadi, tana sal sakraydi
  walk(t) {
    const p = t * Math.PI * 2 * 1.3, s = Math.sin(p);
    this.root.rotation.y = 0.3; // sal yon tomonga burilgan
    this.body.scale.set(1, 1, 1);
    this.body.position.y = 0.05 * Math.abs(Math.cos(p));
    this.torso.rotation.set(0, 0, -0.04);
    this.neck.rotation.set(0, 0, 0.03 * Math.sin(p * 2));
    this.hip[0].rotation.set(0, 0, 0.32 * s);
    this.hip[1].rotation.set(0, 0, -0.32 * s);
    this.kn[0].rotation.set(0, 0, -0.35 * Math.max(0, -s));
    this.kn[1].rotation.set(0, 0, -0.35 * Math.max(0, s));
    this.sh[0].rotation.set(0, 0, -0.08 - 0.3 * s);
    this.sh[1].rotation.set(0, 0, 0.08 - 0.3 * s);
    this.el[0].rotation.set(0, 0, 0.15);
    this.el[1].rotation.set(0, 0, 0.15);
  }

  // Turish (idle): yengil nafas olish, bosh va qo'llar sekin tebranadi, ko'z qirpiladi
  update(dt, t) {
    // uxlayotganda: ko'zlar yumuq, faqat sekin nafas olish
    if (this.sleeping) {
      this.eyes.material.map = this.eyeShut;
      const b = Math.sin(t * 1.3);
      this.body.scale.set(1, 1 + 0.01 * b, 1 + 0.01 * b);
      this.torso.rotation.set(0, 0, 0);
      this.neck.rotation.set(0, 0, 0.05);
      this.sh[0].rotation.set(0, 0, -0.06); this.sh[1].rotation.set(0, 0, 0.06);
      this.el[0].rotation.set(0, 0, 0.03); this.el[1].rotation.set(0, 0, -0.03);
      this.hip[0].rotation.set(0, 0, -0.02); this.hip[1].rotation.set(0, 0, 0.02);
      return;
    }
    if (this.eyes.material.map === this.eyeShut && !this.blinking) this.eyes.material.map = this.eyeOpen;
    this.blinkT -= dt;
    if (this.blinkT <= 0) {
      this.blinking = !this.blinking;
      this.eyes.material.map = this.blinking ? this.eyeShut : this.eyeOpen;
      this.blinkT = this.blinking ? 0.12 : 2 + Math.random() * 3.5;
    }
    if (this.walking) return this.walk(t);
    this.root.rotation.y = 0;
    this.body.position.y = 0;
    this.kn[0].rotation.set(0, 0, 0); this.kn[1].rotation.set(0, 0, 0);
    const b = Math.sin(t * 2.1), w = Math.sin(t * 0.5);
    this.body.scale.set(1 - 0.006 * b, 1 + 0.014 * b, 1);
    this.torso.rotation.set(0, 0, 0.025 * Math.sin(t * 0.6) - 0.02 * w);
    this.neck.rotation.set(0.04 * Math.sin(t * 1.1), 0, 0.07 * Math.sin(t * 0.8));
    this.sh[0].rotation.set(0.06 * Math.sin(t * 0.9), 0, -0.1 - 0.03 * b);
    this.sh[1].rotation.set(0.06 * Math.sin(t * 0.9 + 1), 0, 0.1 + 0.03 * b);
    this.el[0].rotation.set(-0.08, 0, 0.06);
    this.el[1].rotation.set(-0.08, 0, -0.06);
    this.hip[0].rotation.set(0, 0, -0.03 + 0.02 * w);
    this.hip[1].rotation.set(0, 0, 0.03 + 0.02 * w);
  }

  dispose() {
    this.root.traverse((m) => {
      if (!m.isMesh) return;
      m.geometry.dispose();
      m.material.map?.dispose();
      m.material.dispose();
    });
    this.eyeOpen.dispose(); this.eyeShut.dispose();
  }
}
