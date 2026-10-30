import * as THREE from 'three';
import { Puppet } from './sardor.js';

/* ============ Kuryer: forma, dubulg'a va skuter ============ */

// Kuryer formasi: to'q sariq futbolka va to'q shim (oyoq kiyim o'zinikida qoladi)
export const UNIFORM = { shirt: '#f08a24', pattern: 'plain', accent: '#ffffff', pants: '#2f3542' };

const PPU = 200;
function tex(W, H, draw) {
  const c = document.createElement('canvas');
  c.width = Math.ceil(W * PPU); c.height = Math.ceil(H * PPU);
  const g = c.getContext('2d'); g.scale(PPU, PPU); g.lineJoin = 'round'; g.lineCap = 'round';
  draw(g);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}
// Tekstura nuqtasi (px, py) guruh boshiga to'g'ri keladigan tekis bo'lak (sardor.js dagi kabi)
function plane(texture, W, H, px, py, order) {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(W, H),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, side: THREE.DoubleSide }),
  );
  m.position.set(W / 2 - px, py - H / 2, 0);
  m.renderOrder = order;
  return m;
}
function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function fs(g, fill, stroke, lw = 0.022) { g.fillStyle = fill; g.fill(); g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); }

/* ---- Dubulg'a (bosh teksturasi bilan bir xil o'lcham: 1.2 x 1.42) ---- */
function drawHelmet(g) {
  g.translate(0, 0.06);
  g.beginPath(); g.moveTo(0.12, 0.6);
  g.bezierCurveTo(0.06, -0.3, 1.14, -0.3, 1.08, 0.6);
  g.lineTo(1.0, 0.6); g.quadraticCurveTo(0.6, 0.5, 0.2, 0.6); g.closePath();
  fs(g, '#f08a24', '#9c4f10', 0.026);
  // yaltirash va o'rta chiziq
  g.beginPath(); g.moveTo(0.26, 0.3); g.quadraticCurveTo(0.36, 0.04, 0.56, 0.0);
  g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 0.045; g.stroke();
  g.beginPath(); g.moveTo(0.6, -0.07); g.lineTo(0.6, 0.53); g.strokeStyle = '#fff'; g.lineWidth = 0.05; g.stroke();
  // soyabon
  g.beginPath(); g.moveTo(0.16, 0.6); g.quadraticCurveTo(0.6, 0.5, 1.04, 0.6);
  g.quadraticCurveTo(1.12, 0.64, 1.04, 0.67); g.quadraticCurveTo(0.6, 0.58, 0.16, 0.67);
  g.quadraticCurveTo(0.08, 0.64, 0.16, 0.6); g.closePath(); fs(g, '#2f3542', '#161a20', 0.02);
}

/* ---- Futbolka ustidagi belgi va nur qaytaruvchi chiziq (tana teksturasi: 1.15 x 1.2) ---- */
function drawBadge(g) {
  g.fillStyle = 'rgba(255,255,255,.85)'; g.fillRect(0.15, 0.74, 0.86, 0.06);
  g.fillStyle = 'rgba(190,200,210,.9)'; g.fillRect(0.15, 0.785, 0.86, 0.015);
  g.beginPath(); g.arc(0.78, 0.42, 0.1, 0, Math.PI * 2); fs(g, '#fff', '#9c4f10', 0.016);
  // belgida kichik skuter
  g.strokeStyle = '#f08a24'; g.lineWidth = 0.022;
  g.beginPath(); g.arc(0.73, 0.47, 0.022, 0, Math.PI * 2); g.stroke();
  g.beginPath(); g.arc(0.83, 0.47, 0.022, 0, Math.PI * 2); g.stroke();
  g.beginPath(); g.moveTo(0.73, 0.45); g.lineTo(0.79, 0.45); g.lineTo(0.82, 0.37); g.lineTo(0.85, 0.37); g.stroke();
}

/* ---- Skuter va moped (yon tomondan, oldi o'ngda). Tekstura 3.1 x 2.3, boshi (1.0, 2.3) — yer va o'rindiq ostidagi nuqta ---- */
const SC = { W: 3.1, H: 2.3, ox: 1.0, oy: 2.3 };
const SCOOTER = { body: '#f08a24', dark: '#b85f12', trim: '#fff6e8' };
const MOPED = { body: '#22a39a', dark: '#12665f', trim: '#e9fffb', shield: true };
function drawScooter(g, c) {
  const BODY = c.body, BODY_D = c.dark, TRIM = c.trim;
  g.translate(SC.ox, SC.oy); g.scale(1, -1); // endi y tepaga o'sadi, (0,0) — yer, o'rindiq tagida
  // yuk qutisi (orqa tokchada)
  g.save(); g.scale(1, -1);
  rr(g, -0.98, -1.86, 0.62, 0.6, 0.05); fs(g, '#f08a24', '#8f4a0e', 0.024);
  rr(g, -0.98, -1.86, 0.62, 0.12, 0.05); g.fillStyle = '#d4731a'; g.fill();
  g.beginPath(); g.arc(-0.67, -1.53, 0.11, 0, Math.PI * 2); fs(g, '#fff', '#8f4a0e', 0.016);
  g.fillStyle = '#f08a24'; g.font = 'bold 0.14px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('K', -0.67, -1.525);
  g.restore();
  // tokcha
  g.beginPath(); g.moveTo(-0.95, 1.24); g.lineTo(-0.25, 1.24); g.strokeStyle = '#3a3f47'; g.lineWidth = 0.05; g.stroke();
  // orqa qanot va korpus
  g.beginPath();
  g.moveTo(-0.95, 0.55); g.quadraticCurveTo(-0.98, 1.0, -0.6, 1.08);
  g.lineTo(0.35, 1.04); g.quadraticCurveTo(0.45, 0.7, 0.42, 0.42);
  g.lineTo(-0.2, 0.42); g.quadraticCurveTo(-0.55, 0.78, -0.95, 0.55); g.closePath();
  fs(g, BODY, BODY_D, 0.026);
  g.beginPath(); g.moveTo(-0.85, 0.82); g.quadraticCurveTo(-0.4, 0.95, 0.3, 0.9); g.strokeStyle = TRIM; g.lineWidth = 0.04; g.stroke();
  // o'rindiq
  g.beginPath(); g.moveTo(-0.62, 1.06); g.quadraticCurveTo(-0.55, 1.18, -0.3, 1.16);
  g.lineTo(0.32, 1.12); g.quadraticCurveTo(0.42, 1.1, 0.4, 1.03); g.lineTo(-0.6, 1.03); g.closePath();
  fs(g, '#2b2f36', '#14171b', 0.022);
  // oyoq qo'yadigan joy (pol)
  rr(g, 0.3, 0.3, 0.8, 0.13, 0.05); fs(g, '#3a3f47', '#1d2025', 0.022);
  // old ustun va qalqon
  g.beginPath();
  g.moveTo(1.02, 0.3); g.quadraticCurveTo(1.22, 0.9, 1.25, 1.62);
  g.lineTo(1.45, 1.62); g.quadraticCurveTo(1.5, 0.95, 1.32, 0.42); g.closePath();
  fs(g, BODY, BODY_D, 0.026);
  g.beginPath(); g.moveTo(1.14, 0.55); g.quadraticCurveTo(1.3, 1.0, 1.32, 1.5); g.strokeStyle = TRIM; g.lineWidth = 0.035; g.stroke();
  // old qanot
  g.beginPath(); g.moveTo(1.12, 0.46); g.quadraticCurveTo(1.45, 0.66, 1.78, 0.42); g.lineTo(1.7, 0.38); g.quadraticCurveTo(1.45, 0.56, 1.18, 0.4); g.closePath();
  fs(g, BODY, BODY_D, 0.02);
  // vilka
  g.beginPath(); g.moveTo(1.35, 0.5); g.lineTo(1.48, 0.3); g.strokeStyle = '#7d8791'; g.lineWidth = 0.06; g.stroke();
  // rul va fara
  g.beginPath(); g.moveTo(1.3, 1.62); g.lineTo(1.36, 1.76); g.strokeStyle = '#3a3f47'; g.lineWidth = 0.06; g.stroke();
  g.beginPath(); g.moveTo(1.08, 1.8); g.lineTo(1.5, 1.74); g.strokeStyle = '#2b2f36'; g.lineWidth = 0.07; g.stroke();
  rr(g, 1.36, 1.5, 0.2, 0.14, 0.06); fs(g, '#fff3b0', '#8f7a2a', 0.018);
  // ko'zgu
  g.beginPath(); g.moveTo(1.4, 1.78); g.lineTo(1.46, 1.98); g.strokeStyle = '#3a3f47'; g.lineWidth = 0.025; g.stroke();
  g.beginPath(); g.ellipse(1.48, 2.02, 0.07, 0.045, 0.3, 0, Math.PI * 2); fs(g, '#cfe6f7', '#3a3f47', 0.018);
  // orqa chiroq
  rr(g, -1.0, 0.7, 0.08, 0.12, 0.03); fs(g, '#e5413b', '#8f1f1b', 0.015);
  // elektromoped: shamol oynasi va chaqmoq belgisi
  if (c.shield) {
    g.beginPath(); g.moveTo(1.26, 1.66); g.quadraticCurveTo(1.2, 2.1, 1.32, 2.36); g.lineTo(1.44, 2.3); g.quadraticCurveTo(1.38, 2.0, 1.44, 1.66); g.closePath();
    fs(g, 'rgba(190,230,255,.55)', '#3a3f47', 0.018);
    g.beginPath(); g.moveTo(-0.2, 0.84); g.lineTo(-0.32, 0.64); g.lineTo(-0.24, 0.64); g.lineTo(-0.32, 0.48); g.lineTo(-0.12, 0.7); g.lineTo(-0.2, 0.7); g.closePath();
    fs(g, '#ffe14d', '#8f7a2a', 0.012);
  }
}

/* ---- Mashina (yon tomondan). Tekstura 4.4 x 3.0, boshi (2.0, 3.0). Deraza teshigidan Sardor ko'rinadi ---- */
const CAR = { W: 4.4, H: 3.0, ox: 2.0, oy: 3.0 };
function carWindow(g) {
  g.beginPath(); g.moveTo(-1.05, 1.6); g.lineTo(1.25, 1.6); g.lineTo(0.8, 2.56); g.lineTo(-0.97, 2.56); g.closePath();
}
function drawCar(g) {
  g.translate(CAR.ox, CAR.oy); g.scale(1, -1);
  // tag qismi (g'ildiraklar orasida): Sardorning beli korpus ostidan ko'rinmasin
  rr(g, -0.7, 0.18, 1.8, 0.3, 0.06); fs(g, '#3a3f47', '#1d2025', 0.02);
  // korpus
  g.beginPath();
  g.moveTo(-1.85, 0.45); g.lineTo(-1.85, 1.35); g.quadraticCurveTo(-1.8, 1.55, -1.45, 1.58);
  g.lineTo(-1.2, 2.6); g.quadraticCurveTo(-1.15, 2.72, -0.95, 2.72);
  g.lineTo(0.95, 2.72); g.quadraticCurveTo(1.05, 2.72, 1.12, 2.62);
  g.lineTo(1.62, 1.62); g.quadraticCurveTo(2.25, 1.55, 2.32, 1.2);
  g.lineTo(2.32, 0.55); g.quadraticCurveTo(2.3, 0.4, 2.1, 0.4);
  g.lineTo(-1.6, 0.4); g.quadraticCurveTo(-1.85, 0.4, -1.85, 0.45); g.closePath();
  fs(g, '#f08a24', '#a35410', 0.03);
  // pastki soya va chiziq
  g.save(); g.clip();
  g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(-2, 0.3, 4.5, 0.32);
  g.fillStyle = '#fff6e8'; g.fillRect(-2, 1.08, 4.5, 0.08);
  g.restore();
  // g'ildirak o'yiqlari
  for (const x of [-1.15, 1.55]) { g.beginPath(); g.arc(x, 0.4, 0.5, 0, Math.PI); g.fillStyle = '#2b2f36'; g.fill(); }
  // eshik chizig'i va tutqich
  g.beginPath(); g.moveTo(0.25, 0.55); g.lineTo(0.25, 1.58); g.strokeStyle = '#a35410'; g.lineWidth = 0.025; g.stroke();
  rr(g, -0.15, 1.3, 0.24, 0.07, 0.03); fs(g, '#fff6e8', '#a35410', 0.012);
  // deraza: teshik (Sardor ko'rinsin) + oyna yaltirashi
  g.save(); carWindow(g); g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000'; g.fill(); g.restore();
  carWindow(g); g.fillStyle = 'rgba(190,225,255,.18)'; g.fill(); g.strokeStyle = '#2b2f36'; g.lineWidth = 0.07; g.stroke();
  g.beginPath(); g.moveTo(0.95, 2.3); g.lineTo(1.1, 1.95); g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 0.05; g.stroke();
  // faralar
  rr(g, 2.12, 1.05, 0.2, 0.16, 0.06); fs(g, '#fff3b0', '#8f7a2a', 0.015);
  rr(g, -1.88, 1.0, 0.08, 0.2, 0.03); fs(g, '#e5413b', '#8f1f1b', 0.015);
  // tomdagi kuryer belgisi
  rr(g, -0.5, 2.72, 0.9, 0.24, 0.06); fs(g, '#fff', '#a35410', 0.02);
  g.save(); g.scale(1, -1); g.fillStyle = '#f08a24'; g.font = 'bold 0.17px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('KURYER', -0.05, -2.84); g.restore();
}
// mashina ichi (Sardor orqasida): o'rindiq suyanchig'i va rul
function drawCarInside(g) {
  g.translate(CAR.ox, CAR.oy); g.scale(1, -1);
  carWindow(g); g.fillStyle = '#3b4250'; g.fill();
  rr(g, -0.75, 1.5, 0.4, 0.95, 0.12); fs(g, '#23272f', '#14171b', 0.02);
  g.beginPath(); g.moveTo(0.95, 1.6); g.lineTo(0.75, 2.0); g.strokeStyle = '#14171b'; g.lineWidth = 0.08; g.stroke();
}

/* ---- Piyoda kuryerning termo-sumkasi (tana orqasida) ---- */
function drawBag(g) {
  rr(g, 0.02, 0.02, 0.6, 0.7, 0.07); fs(g, '#f08a24', '#8f4a0e', 0.024);
  rr(g, 0.02, 0.02, 0.6, 0.12, 0.06); g.fillStyle = '#d4731a'; g.fill();
  g.beginPath(); g.arc(0.32, 0.42, 0.11, 0, Math.PI * 2); fs(g, '#fff', '#8f4a0e', 0.016);
}

const WHEEL_R = 0.3;
function drawWheel(g) {
  const r = WHEEL_R;
  g.translate(r + 0.02, r + 0.02);
  g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); fs(g, '#23262b', '#0f1114', 0.02);
  g.beginPath(); g.arc(0, 0, r * 0.58, 0, Math.PI * 2); fs(g, '#c3cbd3', '#5d666f', 0.018);
  // parraklar: aylanishi ko'rinib tursin
  g.strokeStyle = '#7d8791'; g.lineWidth = 0.03;
  for (let i = 0; i < 5; i++) {
    const a = (i * Math.PI * 2) / 5;
    g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55); g.stroke();
  }
  g.beginPath(); g.arc(0, 0, r * 0.14, 0, Math.PI * 2); fs(g, '#5d666f', '#2f353b', 0.012);
}

// Transport: 'scooter' | 'moped' | 'car'. seatY — o'rindiq balandligi (yerdan)
export const SEATS = { scooter: 1.05, moped: 1.05, car: 0.5 };
export class Vehicle {
  constructor(kind) {
    const root = this.root = new THREE.Group();
    const r = kind === 'car' ? 0.4 : WHEEL_R;
    this.r = r;
    if (kind === 'car') {
      // korpus Sardordan oldinda (oyoqlari ko'rinmaydi), ichki qism orqada
      root.add(plane(tex(CAR.W, CAR.H, drawCarInside), CAR.W, CAR.H, CAR.ox, CAR.oy, 3));
      this.body = plane(tex(CAR.W, CAR.H, drawCar), CAR.W, CAR.H, CAR.ox, CAR.oy, 30);
      root.add(this.body);
    } else {
      // korpus odam orqasida (renderOrder < 10), g'ildiraklar korpus ostida
      root.add(plane(tex(SC.W, SC.H, (g) => drawScooter(g, kind === 'moped' ? MOPED : SCOOTER)), SC.W, SC.H, SC.ox, SC.oy, 5));
    }
    const size = r * 2 + 0.04;
    const wt = this.wheelTex = tex(size, size, (g) => { g.scale(r / WHEEL_R, r / WHEEL_R); drawWheel(g); });
    this.wheels = (kind === 'car' ? [-1.15, 1.55] : [-0.62, 1.48]).map((x) => {
      const w = new THREE.Group(); w.position.set(x, r, 0);
      w.add(plane(wt, size, size, r + 0.02, r + 0.02, kind === 'car' ? 31 : 4));
      root.add(w);
      return w;
    });
  }
  // Sardor mashina yonida turganda korpus uning orqasida bo'ladi
  setFront(front) {
    if (!this.body) return;
    this.body.renderOrder = front ? 30 : 3;
    for (const w of this.wheels) w.children[0].renderOrder = front ? 31 : 4;
  }
  // speed — birlik/soniya: g'ildiraklar shunga qarab aylanadi
  update(dt, t, speed) {
    for (const w of this.wheels) w.rotation.z -= (speed * dt) / this.r;
    this.root.position.y = speed ? 0.008 * Math.sin(t * 23) : 0;
  }
  dispose() {
    this.root.traverse((m) => {
      if (!m.isMesh) return;
      m.geometry.dispose();
      if (m.material.map !== this.wheelTex) m.material.map?.dispose();
      m.material.dispose();
    });
    this.wheelTex.dispose();
  }
}

/* ---- Sardor + kuryer anjomlari + o'tirish holati ---- */
const lerp = (a, b, k) => a + (b - a) * k;
const HIP = 1.6;

export class CourierPuppet extends Puppet {
  constructor(d) {
    super(d);
    this.seat = 0; // 0 — turibdi, 1 — skuterda o'tiribdi (oraliq qiymatlar — o'tirish harakati)
    this.seatTarget = 0;
    this.riding = false;
    this.seatY = SEATS.scooter;
    this.bag = plane(tex(0.64, 0.74, drawBag), 0.64, 0.74, 0.85, 0.05, 9);
    this.bag.position.y += 0.95;
    this.torso.add(this.bag);
    this.helmet = plane(tex(1.2, 1.42, drawHelmet), 1.2, 1.42, 0.6, 1.18, 15.5);
    this.badge = plane(tex(1.15, 1.2, drawBadge), 1.15, 1.2, 0.575, 1.02, 14.5);
    this.neck.add(this.helmet);
    this.torso.add(this.badge);
    this.setGear(false);
  }

  // Kuryer anjomlari ko'rinadimi: belgi — formada, dubulg'a — skuter/mopedda, sumka — piyoda
  // Mashinada oyoqlar ko'rinmaydi (korpus ostidan chiqib qolmasin)
  setLegs(visible) {
    for (const m of [...this.thighMesh, ...this.shinMesh]) m.visible = visible;
  }

  setGear(on, { helmet = on, bag = false } = {}) {
    this.helmet.visible = helmet;
    this.badge.visible = on;
    this.bag.visible = bag;
  }

  update(dt, t) {
    super.update(dt, t); // turish holati, ko'z qirpish
    this.seat += Math.sign(this.seatTarget - this.seat) * Math.min(Math.abs(this.seatTarget - this.seat), dt / 0.6);
    const k = this.seat * this.seat * (3 - 2 * this.seat); // silliq o'tish
    if (!k) { this.body.position.x = 0; return; }
    const b = this.riding ? Math.sin(t * 11) : Math.sin(t * 2.1);
    // sakrab o'rindiqqa chiqadi: o'rtada sal yuqoriga ko'tariladi
    const hop = this.instant ? 0 : 0.25 * Math.sin(Math.PI * k);
    this.root.rotation.y = lerp(0, 0.28, k);
    this.body.position.y = lerp(0, this.seatY - HIP + (this.riding ? 0.012 * b : 0.006 * b), k) + hop;
    this.body.position.x = lerp(0, -0.12, k);
    this.body.scale.set(1, 1, 1);
    this.torso.rotation.z = lerp(this.torso.rotation.z, -0.14 + 0.01 * b, k);
    this.neck.rotation.z = lerp(this.neck.rotation.z, 0.12 + (this.riding ? 0.02 * Math.sin(t * 1.7) : 0), k);
    // sonlar oldinga (gorizontal), boldirlar pastga — oyoqlar polda
    this.hip[0].rotation.z = lerp(this.hip[0].rotation.z, 1.42, k);
    this.hip[1].rotation.z = lerp(this.hip[1].rotation.z, 1.5, k);
    this.kn[0].rotation.z = lerp(0, -1.38, k);
    this.kn[1].rotation.z = lerp(0, -1.5, k);
    // qo'llar rulda
    this.sh[0].rotation.z = lerp(this.sh[0].rotation.z, 1.12 + 0.02 * b, k);
    this.sh[1].rotation.z = lerp(this.sh[1].rotation.z, 1.22 + 0.02 * b, k);
    this.el[0].rotation.z = lerp(this.el[0].rotation.z, 0.35, k);
    this.el[1].rotation.z = lerp(this.el[1].rotation.z, 0.3, k);
    this.sh[0].rotation.x = this.sh[1].rotation.x = 0;
    this.el[0].rotation.x = this.el[1].rotation.x = 0;
  }
}
