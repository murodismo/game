import * as THREE from 'three';

/* ============ ODDIY XONA: pol, devorlar, deraza, karavot, javon, quyosh nuri ============ */
// Xona o'lchamlari: x -6..6, z -4..4, balandlik 5. Deraza orqa devorda (z = -4).
const W = 12, D = 8, H = 5;
const BACK = -D / 2;
const WIN = { x0: -4.2, x1: -1.6, y0: 1.5, y1: 3.7 }; // deraza teshigi
const SUN_DIR = new THREE.Vector3(0.32, -0.62, 0.72).normalize(); // nur yo'nalishi (tashqaridan ichkariga)

function canvasTex(w, h, draw, repeat) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  return t;
}

// yog'och pol taxtalari
function floorTex() {
  return canvasTex(512, 512, (g, w, h) => {
    const rows = 8, rh = h / rows;
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let r = 0; r < rows; r++) {
      let x = -rnd() * 200;
      while (x < w) {
        const len = 180 + rnd() * 160;
        const l = 58 + rnd() * 10;
        g.fillStyle = `hsl(30, 45%, ${l}%)`;
        g.fillRect(x, r * rh, len, rh);
        g.strokeStyle = 'rgba(90,55,30,.18)'; g.lineWidth = 1;
        for (let k = 0; k < 4; k++) {
          const y = r * rh + 6 + rnd() * (rh - 12);
          g.beginPath(); g.moveTo(x + 4, y); g.bezierCurveTo(x + len * 0.3, y + 3, x + len * 0.6, y - 3, x + len - 4, y); g.stroke();
        }
        g.fillStyle = 'rgba(80,45,20,.55)'; g.fillRect(x, r * rh, 2, rh);
        x += len;
      }
      g.fillStyle = 'rgba(80,45,20,.45)'; g.fillRect(0, r * rh, w, 2);
    }
  }, [3, 4.5]);
}

// devor: yengil vertikal chiziqli gulqog'oz
function wallTex() {
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#f3e6cf'; g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 32) { g.fillStyle = 'rgba(214,190,150,.35)'; g.fillRect(x, 0, 10, h); }
    g.fillStyle = 'rgba(214,170,120,.35)';
    for (let y = 16; y < h; y += 64) for (let x = 21; x < w; x += 64) { g.beginPath(); g.arc(x, y, 3, 0, Math.PI * 2); g.fill(); }
  }, [6, 2.5]);
}

// derazadan ko'rinadigan osmon
function skyTex() {
  return canvasTex(256, 256, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#7cc4f2'); gr.addColorStop(0.75, '#d9f0ff'); gr.addColorStop(1, '#fff6d8');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,255,255,.9)';
    for (const [x, y, r] of [[60, 70, 22], [85, 62, 28], [112, 72, 20], [190, 120, 16], [208, 112, 20]]) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = '#86c46a'; g.beginPath(); g.ellipse(70, h, 140, 40, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#6fb257'; g.beginPath(); g.ellipse(220, h + 6, 120, 38, 0, 0, Math.PI * 2); g.fill();
  });
}

function box(w, h, d, mat, x, y, z, parent) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true;
  parent.add(m);
  return m;
}
const std = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, ...extra });

export function buildRoom(scene) {
  const room = new THREE.Group();
  scene.add(room);

  /* --- yorug'lik --- */
  scene.add(new THREE.HemisphereLight(0xfff4e0, 0x8a6a50, 0.55));
  const fill = new THREE.PointLight(0xffe2b8, 6, 14, 1.6); // xona ichidagi iliq aks nur
  fill.position.set(0.5, 3.2, 2.5);
  scene.add(fill);

  const sun = new THREE.DirectionalLight(0xfff0c8, 4.2);
  const winC = new THREE.Vector3((WIN.x0 + WIN.x1) / 2, (WIN.y0 + WIN.y1) / 2, BACK);
  sun.position.copy(winC).addScaledVector(SUN_DIR, -10);
  sun.target.position.copy(winC).addScaledVector(SUN_DIR, 4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 0.5, far: 30 });
  sun.shadow.bias = -0.0005;
  sun.shadow.normalBias = 0.02;
  sun.shadow.radius = 3;
  scene.add(sun, sun.target);

  /* --- pol, devorlar, shift --- */
  // pol, yon devor va shift kamera ortigacha davom etadi (pastda bo'shliq qolmasin)
  const EXT = 10;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D + EXT), std(0xffffff, { map: floorTex(), roughness: 0.7 }));
  floor.rotation.x = -Math.PI / 2; floor.position.z = EXT / 2; floor.receiveShadow = true; room.add(floor);

  const wallMat = std(0xffffff, { map: wallTex(), side: THREE.DoubleSide, shadowSide: THREE.DoubleSide });
  const T = 0.2; // devor qalinligi
  // orqa devor: deraza teshigi atrofida 4 bo'lak
  const bw = (x0, x1, y0, y1) => box(x1 - x0, y1 - y0, T, wallMat, (x0 + x1) / 2, (y0 + y1) / 2, BACK - T / 2, room);
  bw(-W / 2, WIN.x0, 0, H);
  bw(WIN.x1, W / 2, 0, H);
  bw(WIN.x0, WIN.x1, 0, WIN.y0);
  bw(WIN.x0, WIN.x1, WIN.y1, H);
  // yon devorlar va shift
  box(T, H, D + EXT + T, wallMat, -W / 2 - T / 2, H / 2, (EXT - T) / 2, room);
  box(T, H, D + EXT + T, wallMat, W / 2 + T / 2, H / 2, (EXT - T) / 2, room);
  box(W + 2 * T, T, D + EXT + T, std(0xfaf3e6, { shadowSide: THREE.DoubleSide }), 0, H + T / 2, (EXT - T) / 2, room);
  // plintus
  const trim = std(0xb98b62);
  box(W, 0.18, 0.05, trim, 0, 0.09, BACK + 0.025, room);
  box(0.05, 0.18, D + EXT, trim, -W / 2 + 0.025, 0.09, EXT / 2, room);
  box(0.05, 0.18, D + EXT, trim, W / 2 - 0.025, 0.09, EXT / 2, room);

  /* --- deraza --- */
  const frame = std(0xffffff, { roughness: 0.5 });
  const fw = 0.12, wx = (WIN.x0 + WIN.x1) / 2, wy = (WIN.y0 + WIN.y1) / 2;
  const ww = WIN.x1 - WIN.x0, wh = WIN.y1 - WIN.y0;
  box(ww + 2 * fw, fw, 0.3, frame, wx, WIN.y1 + fw / 2, BACK, room);
  box(ww + 2 * fw, fw, 0.3, frame, wx, WIN.y0 - fw / 2, BACK, room);
  box(fw, wh, 0.3, frame, WIN.x0 - fw / 2, wy, BACK, room);
  box(fw, wh, 0.3, frame, WIN.x1 + fw / 2, wy, BACK, room);
  box(0.07, wh, 0.08, frame, wx, wy, BACK - 0.05, room); // o'rta ustun
  box(ww, 0.07, 0.08, frame, wx, wy + 0.25, BACK - 0.05, room); // ko'ndalang
  box(ww + 0.5, 0.08, 0.36, frame, wx, WIN.y0 - 0.12, BACK + 0.12, room); // tokcha
  // tashqaridagi osmon
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(ww * 2.4, wh * 2), new THREE.MeshBasicMaterial({ map: skyTex() }));
  sky.position.set(wx, wy, BACK - 1.6);
  room.add(sky);
  // pardalar
  const curtain = std(0x6f9fd6, { side: THREE.DoubleSide });
  for (const s of [-1, 1]) {
    const c = box(0.45, wh + 0.7, 0.06, curtain, wx + s * (ww / 2 + 0.35), wy + 0.05, BACK + 0.22, room);
    c.castShadow = false;
  }
  box(ww + 1.6, 0.05, 0.05, std(0x8a6a50), wx, WIN.y1 + 0.42, BACK + 0.22, room); // parda tayoqchasi

  /* --- karavot (1 kishilik), orqa devor bo'ylab o'ngda --- */
  const bed = new THREE.Group(); bed.position.set(3.4, 0, BACK + 0.8); bed.scale.setScalar(1.25); room.add(bed);
  const wood = std(0xa86d43);
  const BL = 3.0, BWd = 1.2;
  box(BL, 0.35, BWd, wood, 0, 0.32, 0, bed); // asos
  for (const x of [-BL / 2 + 0.08, BL / 2 - 0.08]) for (const z of [-BWd / 2 + 0.08, BWd / 2 - 0.08]) box(0.12, 0.2, 0.12, wood, x, 0.1, z, bed);
  box(0.12, 1.15, BWd + 0.06, wood, BL / 2 + 0.02, 0.58, 0, bed); // bosh tomoni
  box(0.12, 0.75, BWd + 0.06, wood, -BL / 2 - 0.02, 0.38, 0, bed); // oyoq tomoni
  box(BL - 0.1, 0.24, BWd - 0.06, std(0xfbfaf5), 0, 0.6, 0, bed); // matras
  box(BL * 0.66, 0.08, BWd + 0.02, std(0xe7884d), -BL * 0.15, 0.75, 0, bed); // ko'rpa
  box(0.04, 0.42, BWd + 0.02, std(0xe7884d), -BL / 2 + 0.03, 0.55, 0, bed).position.set(-BL / 2 + 0.06, 0.55, 0);
  box(BL * 0.66, 0.02, 0.06, std(0xf3d36b), -BL * 0.15, 0.8, 0.1, bed); // ko'rpa naqshi
  const pillow = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.62, 6, 12), std(0xffffff));
  pillow.rotation.x = Math.PI / 2; pillow.scale.set(1, 1, 0.62);
  pillow.position.set(BL / 2 - 0.42, 0.82, 0); pillow.castShadow = true;
  bed.add(pillow);

  /* --- kichik javon, chap devor yonida --- */
  const shelf = new THREE.Group(); shelf.position.set(-W / 2 + 0.4, 0, -1.2); shelf.rotation.y = Math.PI / 2; shelf.scale.setScalar(1.25); room.add(shelf);
  const sw = 1.3, sh = 1.9, sd = 0.45, st = 0.06;
  const swood = std(0x8f5b37);
  box(st, sh, sd, swood, -sw / 2, sh / 2, 0, shelf);
  box(st, sh, sd, swood, sw / 2, sh / 2, 0, shelf);
  box(sw, sh, 0.03, std(0x7a4b2c), 0, sh / 2, -sd / 2 + 0.015, shelf);
  const levels = [0.05, 0.65, 1.25, sh - st / 2];
  for (const y of levels) box(sw + st, st, sd, swood, 0, y, 0, shelf);
  let seed = 3; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const bookCols = [0x3e62b8, 0xe7884d, 0x0f8584, 0xf0c34a, 0xc0504d, 0x6a5aa8, 0x4f9d48];
  for (const y of levels.slice(0, 2)) {
    let x = -sw / 2 + 0.06;
    while (x < sw / 2 - 0.3) {
      const bwid = 0.07 + rnd() * 0.07, bh = 0.38 + rnd() * 0.15;
      box(bwid, bh, 0.3, std(bookCols[Math.floor(rnd() * bookCols.length)]), x + bwid / 2, y + st / 2 + bh / 2, 0.02, shelf);
      x += bwid + 0.01;
    }
  }
  // yuqori tokchada: koptok va kichik gul
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.17, 20, 14), std(0xf2f2f2, { roughness: 0.6 }));
  ball.position.set(-0.3, levels[2] + st / 2 + 0.17, 0); ball.castShadow = true; shelf.add(ball);
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.09, 0.2, 16), std(0xc5683d));
  pot.position.set(0.35, levels[3] + st / 2 + 0.1, 0); pot.castShadow = true; shelf.add(pot);
  const leafM = std(0x5aa84c, { flatShading: true });
  for (const [px, py, r] of [[0, 0.3, 0.16], [0.1, 0.22, 0.11], [-0.1, 0.24, 0.12]]) {
    const l = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), leafM);
    l.position.set(0.35 + px, levels[3] + st / 2 + py, 0); l.castShadow = true; shelf.add(l);
  }

  /* --- gilam --- */
  const rug = new THREE.Mesh(new THREE.CircleGeometry(1.5, 48), new THREE.MeshStandardMaterial({
    map: canvasTex(256, 256, (g, w) => {
      const c = w / 2;
      for (const [r, col] of [[128, '#5b7fc4'], [112, '#e9e1cf'], [100, '#5b7fc4'], [70, '#f0c34a'], [58, '#5b7fc4']]) {
        g.fillStyle = col; g.beginPath(); g.arc(c, c, r, 0, Math.PI * 2); g.fill();
      }
    }),
    roughness: 1,
  }));
  rug.rotation.x = -Math.PI / 2; rug.scale.set(1.25, 0.8, 1); rug.position.set(0, 0.006, 0.6); rug.receiveShadow = true;
  room.add(rug);

  /* --- quyosh nuri hajmi (nur ustunlari) va chang zarralari --- */
  // deraza burchaklaridan polga tushgan nuqtalar
  const corners = [[WIN.x0, WIN.y0], [WIN.x1, WIN.y0], [WIN.x1, WIN.y1], [WIN.x0, WIN.y1]].map(([x, y]) => new THREE.Vector3(x, y, BACK));
  const onFloor = corners.map((p) => p.clone().addScaledVector(SUN_DIR, -p.y / SUN_DIR.y));
  const pos = [], col = [];
  const top = [255 / 255, 236 / 255, 190 / 255];
  for (let i = 0; i < 4; i++) {
    const a = corners[i], b = corners[(i + 1) % 4], c = onFloor[(i + 1) % 4], d = onFloor[i];
    for (const [p, al] of [[a, 0.22], [b, 0.22], [c, 0], [a, 0.22], [c, 0], [d, 0]]) {
      pos.push(p.x, p.y, p.z); col.push(...top, al);
    }
  }
  const beamGeo = new THREE.BufferGeometry();
  beamGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  beamGeo.setAttribute('color', new THREE.Float32BufferAttribute(col, 4));
  const beamMat = new THREE.MeshBasicMaterial({
    vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
  });
  const beam = new THREE.Mesh(beamGeo, beamMat);
  beam.renderOrder = 50;
  room.add(beam);

  // chang zarralari nur ichida suzadi
  const N = 160, dust = new Float32Array(N * 3), dustSeed = [];
  const spr = canvasTex(32, 32, (g) => {
    const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16);
    gr.addColorStop(0, 'rgba(255,245,220,1)'); gr.addColorStop(1, 'rgba(255,245,220,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 32, 32);
  });
  for (let i = 0; i < N; i++) dustSeed.push([rnd(), rnd(), rnd(), rnd() * 6.28]);
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dust, 3));
  const dustPts = new THREE.Points(dustGeo, new THREE.PointsMaterial({
    map: spr, size: 0.05, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  dustPts.renderOrder = 51;
  room.add(dustPts);

  function placeDust(t) {
    for (let i = 0; i < N; i++) {
      const [u, v, s, ph] = dustSeed[i];
      // derazadagi nuqta -> nur bo'ylab ichkariga
      const p = new THREE.Vector3(
        THREE.MathUtils.lerp(WIN.x0, WIN.x1, u) + 0.06 * Math.sin(t * 0.3 + ph),
        THREE.MathUtils.lerp(WIN.y0, WIN.y1, v) + 0.08 * Math.sin(t * 0.2 + ph * 2),
        BACK,
      );
      const len = -p.y / SUN_DIR.y;
      p.addScaledVector(SUN_DIR, len * (0.05 + 0.9 * ((s + t * 0.012) % 1)));
      dust[i * 3] = p.x; dust[i * 3 + 1] = p.y; dust[i * 3 + 2] = p.z;
    }
    dustGeo.attributes.position.needsUpdate = true;
  }
  placeDust(0);

  return {
    update(dt, t) {
      placeDust(t);
      beamMat.opacity = 0.9 + 0.1 * Math.sin(t * 0.7);
    },
  };
}
