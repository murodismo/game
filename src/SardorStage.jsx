import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Puppet, SARDOR } from './sardor.js';
import RoomBackdrop, { LAYOUTS, pickLayout } from './RoomBackdrop.jsx';

// Sardor kadri (dunyo birliklarida): oyoq tagi y=0, soch uchi ~3.7
const VIEW = { left: -0.95, right: 0.95, top: 3.85, bottom: -0.05 };
const FPS = 30;
const PANEL = { wardrobe: 96, fridge: 170 }; // javon/muzlatgich ochiq bo'lganda pastdagi panel uchun joy (px)
const SIDE_PANEL = 324; // telefon yotiq holatda muzlatgich paneli o'ngda turadi (px), styles.css bilan bir xil

// Xona 2D (SVG), ustida faqat Sardor kichik shaffof canvasda chiziladi.
// mode: 'room' | 'wardrobe' | 'fridge' (javon yoki muzlatgich ochiq, kamera yaqinlashgan). look — Sardorning kiyimi (dressUp natijasi).
// dark — pardalar yopiq, xona qorong'i.
// asleep — Sardor karavotda uxlayapti.
// leaving — Sardor ko'chaga chiqyapti: sekin yurib o'ng chetdan chiqib ketadi (WALK_MS).
export const WALK_MS = 3500;
export default function SardorStage({ onOpen, mode = 'room', dark = false, asleep = false, leaving = false, look = SARDOR, wardrobe, fridge }) {
  const wrapRef = useRef(null);
  const zoomRef = useRef(null);
  const canvasRef = useRef(null);
  const puppetRef = useRef(null);
  const layoutRef = useRef(null);
  const modeRef = useRef(mode);
  const asleepRef = useRef(asleep);
  const leavingRef = useRef(leaving);
  const [layout, setLayout] = useState(() => pickLayout(window.innerWidth, window.innerHeight));

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'low-power' });
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(VIEW.left, VIEW.right, VIEW.top, VIEW.bottom, -10, 10);
    const sardor = new Puppet(look);
    puppetRef.current = sardor;
    scene.add(sardor.root);

    // SVG "xMidYMax meet" bilan qanday joylashsa, canvasni ham xuddi shunday joylaymiz.
    // Javon ochiq bo'lsa, butun sahna CSS transform bilan javon sohasiga kattalashtiriladi.
    function resize() {
      const w = wrap.clientWidth, h = wrap.clientHeight;
      const key = pickLayout(w, h);
      setLayout(key);
      const L = LAYOUTS[key];
      const mode = modeRef.current;
      // ochiq buyum: Sardor qayerda turadi va kamera qaysi sohaga yaqinlashadi
      const spot = mode === 'wardrobe' ? [L.wardrobeFeet, L.zoomBox] : mode === 'fridge' ? [L.fridgeFeet, L.fridgeZoom] : null;
      const k = Math.min(w / L.w, h / L.h);
      const ox = (w - L.w * k) / 2, oy = h - L.h * k - L.y0 * k; // layout -> ekran: x*k+ox, y*k+oy
      const aspect = (VIEW.right - VIEW.left) / (VIEW.top - VIEW.bottom);
      let ch, cw;
      if (asleepRef.current) {
        // karavotda yotadi: canvas 90° buriladi, boshi yostiq tomonda
        const B = L.bedSleep;
        ch = B.h * k; cw = ch * aspect;
        Object.assign(canvas.style, {
          width: cw + 'px', height: ch + 'px',
          left: B.cx * k + ox - cw / 2 + 'px',
          top: B.cy * k + oy - ch / 2 + 'px',
          transform: 'rotate(90deg)',
        });
      } else {
        const [fx, fy] = spot ? spot[0] : [L.feetX, L.feetY];
        ch = L.sardorH * k; cw = ch * aspect;
        const left = fx * k + ox - cw / 2;
        Object.assign(canvas.style, {
          width: cw + 'px', height: ch + 'px',
          left: left + 'px',
          top: fy * k + oy - ch * VIEW.top / (VIEW.top - VIEW.bottom) + 'px',
          // chiqib ketayotganda: o'ng chetdan to'liq chiqquncha siljiydi
          transform: leavingRef.current ? `translateX(${w - left + 10}px)` : 'none',
          transition: leavingRef.current ? `transform ${WALK_MS}ms linear` : '',
        });
      }

      let z = 1, tx = 0, ty = 0;
      if (spot) {
        const [x0, y0, x1, y1] = spot[1];
        // telefon yotiq bo'lsa (bo'yi past) muzlatgich paneli pastda emas, o'ngda
        const side = mode === 'fridge' && h <= 500 && w > h ? SIDE_PANEL : 0;
        const bw = (x1 - x0) * k, bh = (y1 - y0) * k, availW = w - side, availH = h - (side ? 0 : PANEL[mode]);
        z = Math.min(availW * 0.94 / bw, availH * 0.96 / bh, 3);
        tx = (availW - bw * z) / 2 - (x0 * k + ox) * z;
        ty = (availH - bh * z) / 2 - (y0 * k + oy) * z;
      }
      zoomRef.current.style.transform = `translate(${tx}px, ${ty}px) scale(${z})`;
      // kattalashganda ham Sardor xira bo'lmasin
      renderer.setPixelRatio(Math.min(dpr * z, 3));
      renderer.setSize(cw, ch, false);
    }
    layoutRef.current = resize;
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    resize();

    // 30 kadr/s yetarli: animatsiya sekin, kompyuterga yuk kam bo'ladi
    let raf, last = performance.now(), acc = 0, time = 0;
    function frame(now) {
      raf = requestAnimationFrame(frame);
      acc += Math.min(0.1, (now - last) / 1000);
      last = now;
      if (acc < 1 / FPS) return;
      time += acc;
      sardor.update(acc, time);
      acc = 0;
      renderer.render(scene, camera);
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      sardor.dispose();
      renderer.dispose();
      puppetRef.current = null;
    };
  }, []);

  // javon ochilishi/yopilishi: joylashuvni qayta hisoblaymiz (CSS transition silliq o'tkazadi)
  useEffect(() => {
    modeRef.current = mode;
    layoutRef.current?.();
  }, [mode]);

  useEffect(() => {
    asleepRef.current = asleep;
    if (puppetRef.current) puppetRef.current.sleeping = asleep;
    layoutRef.current?.();
  }, [asleep]);

  useEffect(() => {
    leavingRef.current = leaving;
    if (puppetRef.current) puppetRef.current.walking = leaving;
    layoutRef.current?.();
  }, [leaving]);

  // kiyim almashtirilganda faqat kerakli teksturalar qayta chiziladi
  useEffect(() => {
    puppetRef.current?.setOutfit(look);
  }, [look]);

  return (
    <div className={'stage' + (leaving ? ' leaving' : '')} ref={wrapRef}>
      <div className="zoom" ref={zoomRef}>
        <RoomBackdrop layout={layout} onOpen={onOpen} mode={mode} dark={dark} asleep={asleep} wardrobe={wardrobe} fridge={fridge} />
        <canvas className="sardor" ref={canvasRef} aria-label="Sardor o'z xonasida turibdi" role="img" />
      </div>
      {/* qorong'ilik: xona va Sardor ustidan yarim shaffof qatlam, bosishlarga xalaqit bermaydi */}
      <div className={'night' + (dark ? ' on' : '')} />
    </div>
  );
}
