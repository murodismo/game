import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { api } from './api.js';
import { Puppet, SARDOR, dressUp } from './sardor.js';
import { Hit, BusStop, Building, Tree, Bush, StreetDefs } from './StreetPage.jsx';
import BusMenu from './BusMenu.jsx';
import WaiterPage from './WaiterPage.jsx';

// Sardor kadri va o'lchamlari ko'cha sahifasi bilan bir xil (oyog'i yo'lakda turadi)
const VIEW = { left: -0.95, right: 0.95, top: 3.85, bottom: -0.05 };
const FPS = 30;
const FEET_Y = 712;
const SARDOR_H = 132;
const SPEED = 130; // birlik/soniya
// Yurish manzillari (sahna x): restoran eshigi va avtobus bekati (bekat shifoxona oldidagi bilan bir joyda)
const DOOR_X = -10;
const STOP_X = 550;
// Sahnaning chap va o'ng chegarasi: tor ekranda kamera Sardorning ortidan yuradi
const LEFT = -470, RIGHT = 720;

function viewBox(w, h, pos) {
  const a = w / h;
  const W = Math.max(700, 640 * a);
  const H = Math.max(640, W / a);
  const cx = W >= RIGHT - LEFT ? (LEFT + RIGHT) / 2 : Math.min(RIGHT - W / 2, Math.max(LEFT + W / 2, pos));
  return { x: cx - W / 2, y: 880 - H, W, H };
}

// Restoran tashqarisi: g'isht devor, yo'l-yo'l soyabon, yozuvli peshtoq, katta derazalar va shisha eshik
function Restaurant() {
  const stripes = [];
  for (let i = 0; i < 14; i++) {
    const x = -290 + i * 40;
    stripes.push(<path key={i} d={`M${x} 500 h40 v34 q-20 14 -40 0 z`} fill={i % 2 ? '#fff4e6' : '#c0262d'} />);
  }
  const bricks = [];
  for (let row = 0; row < 9; row++)
    for (let i = 0; i < 12; i++) {
      const x = -300 + i * 48 + (row % 2) * 24, y = 430 + row * 30;
      if (x > 250) continue;
      bricks.push(<rect key={row + '-' + i} x={x} y={y} width={44} height={26} rx={2} fill="#b8573a" opacity=".35" />);
    }
  // derazadan ko'rinadigan stol va chiroq
  const table = (cx) => (
    <g>
      <line x1={cx} y1={560} x2={cx} y2={584} stroke="#5a4636" strokeWidth={2} />
      <path d={`M${cx - 16} 596 q16 -20 32 0 z`} fill="#f3c74f" />
      <ellipse cx={cx} cy={648} rx={34} ry={7} fill="#fff" />
      <rect x={cx - 3} y={650} width={6} height={30} fill="#6b4329" />
      <path d={`M${cx - 32} 650 q32 10 64 0 l-4 10 q-28 6 -56 0 z`} fill="#c0262d" opacity=".85" />
    </g>
  );
  return (
    <g>
      <ellipse cx={-20} cy={704} rx={300} ry={14} fill="#000" opacity=".15" />
      {/* yon devor (perspektiva) */}
      <polygon points="260,420 300,402 300,684 260,702" fill="#8f3f27" />
      {/* old devor */}
      <rect x={-300} y={420} width={560} height={282} fill="#d77a52" />
      {bricks}
      <rect x={-300} y={600} width={560} height={100} fill="url(#st-house-ao)" />
      <rect x={-306} y={684} width={572} height={18} fill="#b8ad99" />
      <rect x={-306} y={684} width={572} height={3} fill="#d7cdb9" />
      {/* tom karnizi */}
      <polygon points="-316,420 -276,398 316,398 276,420" fill="#9a4a2e" />
      <rect x={-316} y={410} width={592} height={16} fill="#7a3b22" />
      {/* peshtoq */}
      <rect x={-170} y={438} width={300} height={52} rx={10} fill="#2b2f36" />
      <rect x={-164} y={444} width={288} height={40} rx={7} fill="none" stroke="#ffd27a" strokeWidth={2} opacity=".6" />
      <text x={-20} y={473} textAnchor="middle" fontSize={28} fontWeight="800" fill="#ffd27a" fontFamily="system-ui, sans-serif" letterSpacing="3">RESTORAN</text>
      {/* soyabon */}
      <rect x={-296} y={494} width={572} height={10} rx={3} fill="#8e1c22" />
      {stripes}
      {/* derazalar */}
      {[-270, 70].map((x) => (
        <g key={x}>
          <rect x={x - 6} y={554} width={172} height={132} rx={4} fill="#fff4e6" />
          <rect x={x} y={560} width={160} height={120} fill="url(#st-glass)" />
          {table(x + 50)}
          {table(x + 120)}
          <polygon points={`${x},560 ${x + 54},560 ${x},620`} fill="#fff" opacity=".3" />
          <rect x={x + 77} y={560} width={6} height={120} fill="#fff4e6" />
        </g>
      ))}
      {/* shisha eshik */}
      <rect x={-56} y={564} width={92} height={124} rx={4} fill="#5f3a20" />
      <rect x={-50} y={570} width={38} height={114} fill="url(#st-glass)" />
      <rect x={-8} y={570} width={38} height={114} fill="url(#st-glass)" />
      <rect x={-18} y={620} width={4} height={22} rx={2} fill="#f3c623" />
      <rect x={-6} y={620} width={4} height={22} rx={2} fill="#f3c623" />
      {/* "Ochiq" belgisi */}
      <rect x={-44} y={578} width={46} height={18} rx={4} fill="#fff" />
      <text x={-21} y={591} textAnchor="middle" fontSize={11} fontWeight="800" fill="#2b8a3e" fontFamily="system-ui, sans-serif">OCHIQ</text>
      {/* eshik yonidagi gul tuvaklari */}
      {[-84, 64].map((x) => (
        <g key={x}>
          <path d={`M${x - 14} 672 h28 l-4 24 h-20 z`} fill="#7a4b2c" />
          <circle cx={x} cy={660} r={16} fill="url(#st-leaf)" />
          <circle cx={x - 8} cy={652} r={4} fill="#f08a24" />
          <circle cx={x + 6} cy={656} r={4} fill="#f3c623" />
        </g>
      ))}
    </g>
  );
}

function Scene({ x, onRestaurant, onStop }) {
  const dash = [];
  for (let x = -2000; x < 2000; x += 170) dash.push(<rect key={x} x={x} y={834} width={95} height={9} rx={3} fill="#e9e6da" opacity=".85" />);
  const slabs = [];
  for (let x = -2000; x < 2000; x += 72) slabs.push(<line key={x} x1={x} y1={703} x2={x - 14} y2={742} stroke="#b3ad9f" strokeWidth={2} opacity=".7" />);
  return (
    <>
      <StreetDefs />
      {/* osmon, quyosh, bulutlar */}
      <rect x={-3000} y={-3000} width={6000} height={3700} fill="url(#sky)" />
      <circle cx={-330} cy={300} r={110} fill="url(#st-sun)" />
      <circle cx={-330} cy={300} r={34} fill="#fff6d0" />
      <g transform="translate(300 100)"><g fill="url(#st-cloud)" opacity=".95" className="cloud">
        <ellipse cx={-180} cy={160} rx={85} ry={24} /><ellipse cx={-145} cy={138} rx={48} ry={32} /><ellipse cx={-210} cy={146} rx={36} ry={24} /><ellipse cx={-100} cy={154} rx={34} ry={20} />
      </g></g>

      {/* uzoq tepaliklar va binolar */}
      <path d="M-3000 560 Q-1400 470 -620 540 Q-200 480 250 530 Q700 470 1200 520 Q2200 480 3000 540 V700 H-3000 Z" fill="url(#st-hill-far)" />
      <path d="M-3000 610 Q-1500 560 -500 600 Q100 565 700 595 Q1600 560 3000 600 V700 H-3000 Z" fill="url(#st-hill)" />
      <Building x={-700} w={160} h={190} tone={['#c4d4e2', '#a4b9cc', '#d6e2ec']} />
      <Building x={-520} w={120} h={140} tone={['#b8cfe0', '#9db7cb', '#cddde9']} />
      <Building x={760} w={160} h={170} tone={['#bfd2e2', '#a2b8cb', '#d3e0eb']} />
      <Building x={950} w={200} h={130} tone={['#b6cbdc', '#9ab2c6', '#cbdbe7']} />
      <Tree x={-430} y={655} s={0.5} far />
      <Tree x={480} y={656} s={0.55} far />
      <rect x={-3000} y={640} width={6000} height={62} fill="url(#st-grass)" />
      <Tree x={-390} y={702} s={0.75} />
      <Tree x={400} y={702} s={0.7} />

      <Hit label="Restoranga kirish" onPress={onRestaurant}><Restaurant /></Hit>
      <Bush x={330} y={702} s={0.6} />

      {/* yo'lak, bekat va yo'l */}
      <rect x={-3000} y={700} width={6000} height={44} fill="url(#st-walk)" />
      {slabs}
      <Hit label="Avtobus bekati" onPress={onStop}>
        <g transform="translate(640 706) scale(.8) translate(366 -740)">
          <BusStop />
        </g>
      </Hit>
      <rect x={-3000} y={742} width={6000} height={4} fill="#ece8de" />
      <rect x={-3000} y={746} width={6000} height={12} fill="#9a958a" />
      <rect x={-3000} y={758} width={6000} height={10} fill="#000" opacity=".25" />
      <rect x={-3000} y={758} width={6000} height={400} fill="url(#st-road)" />
      <rect x={-3000} y={768} width={6000} height={4} fill="#000" opacity=".12" />
      {dash}
      <ellipse cx={x} cy={FEET_Y + 2} rx={SARDOR_H * 0.23} ry={SARDOR_H * 0.043} fill="url(#st-shade)" />
    </>
  );
}

// Restoran oldi (tashqi ko'rinish): Sardor avtobusdan tushsa bekatda, restorandan chiqsa eshik oldida turadi.
// Restoran bosilsa eshikka yurib ichkariga kiradi, bekatdan yana yo'nalishlar menyusi ochiladi
function RestaurantOutside({ startX, onEnter }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const puppetRef = useRef(null);
  const posRef = useRef(startX);
  const goRef = useRef(null); // { x, done } — qayerga yuryapti va yetib borganda nima bo'ladi
  const [box, setBox] = useState(() => viewBox(window.innerWidth, window.innerHeight, startX));
  const [posX, setPosX] = useState(startX);
  const [menu, setMenu] = useState(false);
  const [entering, setEntering] = useState(false);
  const [clothes, setClothes] = useState([]);
  const [outfit, setOutfit] = useState(null);
  const look = useMemo(() => (outfit ? dressUp(clothes, outfit) : SARDOR), [clothes, outfit]);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  useEffect(() => {
    Promise.all([api('/clothes'), api('/me/outfit')])
      .then(([c, o]) => { setClothes(c.clothes); setOutfit(o.outfit); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(VIEW.left, VIEW.right, VIEW.top, VIEW.bottom, -10, 10);
    const sardor = new Puppet(look);
    puppetRef.current = sardor;
    scene.add(sardor.root);

    // canvas sahna koordinatalariga moslanadi; kamera siljisa SVG kadri ham yangilanadi
    let b = viewBox(wrap.clientWidth, wrap.clientHeight, posRef.current), cw = 0;
    function place() {
      const w = wrap.clientWidth;
      const nb = viewBox(w, wrap.clientHeight, posRef.current);
      if (nb.x !== b.x) { b = nb; setBox(nb); }
      canvas.style.left = (posRef.current - b.x) * (w / b.W) - cw / 2 + 'px';
    }
    function resize() {
      const w = wrap.clientWidth, h = wrap.clientHeight;
      b = viewBox(w, h, posRef.current);
      setBox(b);
      const k = w / b.W;
      const ch = SARDOR_H * k;
      cw = ch * (VIEW.right - VIEW.left) / (VIEW.top - VIEW.bottom);
      Object.assign(canvas.style, {
        width: cw + 'px', height: ch + 'px',
        top: (FEET_Y - b.y) * k - ch * VIEW.top / (VIEW.top - VIEW.bottom) + 'px',
      });
      place();
      renderer.setSize(cw, ch, false);
    }
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    resize();

    let raf, last = performance.now(), acc = 0, time = 0;
    function frame(now) {
      raf = requestAnimationFrame(frame);
      acc += Math.min(0.1, (now - last) / 1000);
      last = now;
      if (acc < 1 / FPS) return;
      time += acc;
      const go = goRef.current;
      if (go) {
        const d = go.x - posRef.current, step = SPEED * acc;
        sardor.walking = true;
        canvas.style.transform = d < 0 ? 'scaleX(-1)' : '';
        if (Math.abs(d) <= step) {
          posRef.current = go.x;
          goRef.current = null;
          sardor.walking = false;
          canvas.style.transform = '';
          go.done?.();
        } else posRef.current += Math.sign(d) * step;
        place();
        setPosX(posRef.current);
      }
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

  useEffect(() => {
    puppetRef.current?.setOutfit(look);
  }, [look]);

  function walkTo(x, done) {
    if (entering) return;
    setMenu(false);
    goRef.current = { x, done };
  }

  // Restoran: eshikka yurib boradi, sekin yo'qoladi va ichkarisi ochiladi
  function enter() {
    walkTo(DOOR_X, () => {
      setEntering(true);
      if (canvasRef.current) canvasRef.current.style.opacity = '0';
      timer.current = setTimeout(onEnter, 450);
    });
  }

  return (
    <div className={'street' + (entering ? ' entering' : '')} ref={wrapRef}>
      <svg className="street-scene" viewBox={`${box.x} ${box.y} ${box.W} ${box.H}`} preserveAspectRatio="xMidYMax slice">
        <Scene x={posX} onRestaurant={enter} onStop={() => walkTo(STOP_X, () => setMenu(true))} />
      </svg>
      <canvas className="sardor street-sardor" ref={canvasRef} aria-label="Sardor restoran oldida turibdi" role="img" />
      {menu && <BusMenu here="waiter" onClose={() => setMenu(false)} />}
    </div>
  );
}

// Ofitsiant ishi lokatsiyasi: tashqarisi (restoran oldi, bekat bilan) va ichkarisi (zal va oshxona).
// Smenada bo'lsa to'g'ri ichkarida ochiladi; smena tugagach yoki chiqib ketilsa Sardor eshik oldida paydo bo'ladi
export default function WaiterLocation() {
  const [view, setView] = useState(null); // 'outside' | 'inside'
  const [startX, setStartX] = useState(STOP_X);
  useEffect(() => {
    api('/waiter')
      .then((d) => setView(d.hired && d.profile?.onShift ? 'inside' : 'outside'))
      .catch(() => setView('outside'));
  }, []);

  if (!view) return null;
  if (view === 'inside') return <WaiterPage onExit={() => { setStartX(DOOR_X); setView('outside'); }} />;
  return <RestaurantOutside key={startX} startX={startX} onEnter={() => setView('inside')} />;
}
