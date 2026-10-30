import * as THREE from 'three';
import { Puppet } from './sardor.js';

/* ============ Ofitsiant: forma, kapalak galstuk va patnis ============ */

// Ofitsiant formasi: oq ko'ylak va qora shim (oyoq kiyim o'zinikida qoladi)
export const UNIFORM = { shirt: '#fbfbf8', pattern: 'plain', accent: '#1d2026', pants: '#23262d' };

const PPU = 200;
function tex(W, H, draw) {
  const c = document.createElement('canvas');
  c.width = Math.ceil(W * PPU); c.height = Math.ceil(H * PPU);
  const g = c.getContext('2d'); g.scale(PPU, PPU); g.lineJoin = 'round'; g.lineCap = 'round';
  draw(g);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}
// Tekstura nuqtasi (px, py) guruh boshiga to'g'ri keladigan tekis bo'lak (courier.js dagi kabi)
function plane(texture, W, H, px, py, order) {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(W, H),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, side: THREE.DoubleSide }),
  );
  m.position.set(W / 2 - px, py - H / 2, 0);
  m.renderOrder = order;
  return m;
}
function fs(g, fill, stroke, lw = 0.02) { g.fillStyle = fill; g.fill(); g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); }

// Kapalak galstuk (0.36 x 0.2)
function drawBowTie(g) {
  g.beginPath(); g.moveTo(0.18, 0.1); g.lineTo(0.03, 0.02); g.quadraticCurveTo(0, 0.1, 0.03, 0.18); g.closePath();
  fs(g, '#c0262d', '#6e1015');
  g.beginPath(); g.moveTo(0.18, 0.1); g.lineTo(0.33, 0.02); g.quadraticCurveTo(0.36, 0.1, 0.33, 0.18); g.closePath();
  fs(g, '#c0262d', '#6e1015');
  g.beginPath(); g.arc(0.18, 0.1, 0.04, 0, Math.PI * 2); fs(g, '#e0434a', '#6e1015');
}

// Fartuk (tana teksturasi: 1.15 x 1.2) — belning pastki qismida
function drawApron(g) {
  g.beginPath(); g.moveTo(0.22, 0.86); g.lineTo(0.93, 0.86); g.lineTo(0.9, 1.2); g.lineTo(0.25, 1.2); g.closePath();
  fs(g, '#2b2f36', '#14171b', 0.018);
  g.fillStyle = '#c0262d'; g.fillRect(0.2, 0.84, 0.75, 0.04);
}

// Patnis yon tomondan: tekis likopcha ustida qopqoqli taom (1.0 x 0.5, boshi — patnis o'rtasi tagida)
function drawTray(g) {
  g.beginPath(); g.ellipse(0.5, 0.44, 0.48, 0.05, 0, 0, Math.PI * 2); fs(g, '#c9ced6', '#6b7380', 0.018);
  g.beginPath(); g.moveTo(0.2, 0.42); g.quadraticCurveTo(0.22, 0.08, 0.5, 0.08); g.quadraticCurveTo(0.78, 0.08, 0.8, 0.42); g.closePath();
  fs(g, '#e4e8ee', '#7c8592', 0.02);
  g.beginPath(); g.moveTo(0.3, 0.32); g.quadraticCurveTo(0.33, 0.16, 0.48, 0.14); g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 0.03; g.stroke();
  g.beginPath(); g.arc(0.5, 0.06, 0.04, 0, Math.PI * 2); fs(g, '#c9ced6', '#7c8592', 0.016);
}

/* ---- Sardor + ofitsiant anjomlari ---- */
export class WaiterPuppet extends Puppet {
  constructor(d) {
    super(d);
    this.bow = plane(tex(0.36, 0.2, drawBowTie), 0.36, 0.2, 0.18, 0.1, 14.6);
    this.bow.position.y += 0.86;
    this.torso.add(this.bow);
    this.apron = plane(tex(1.15, 1.2, drawApron), 1.15, 1.2, 0.575, 1.02, 14.5);
    this.torso.add(this.apron);
    // patnis o'ng qo'l kaftida (tana koordinatalarida)
    this.tray = plane(tex(1.0, 0.5, drawTray), 1.0, 0.5, 0.5, 0.46, 17.5);
    this.tray.position.x += 1.08; this.tray.position.y += 0.56;
    this.torso.add(this.tray);
    this.carrying = false;
    this.setGear(false);
  }

  // Forma anjomlari (galstuk, fartuk) faqat smena paytida
  setGear(on) {
    this.bow.visible = on;
    this.apron.visible = on;
  }

  update(dt, t) {
    super.update(dt, t);
    this.tray.visible = this.carrying;
    if (!this.carrying) return;
    // patnis ko'tarilgan qo'l: yelka oldinga, bilak gorizontal
    const b = Math.sin(t * 2.1);
    this.sh[1].rotation.set(0, 0, 0.4 + 0.01 * b);
    this.el[1].rotation.set(0, 0, 1.4);
  }
}
