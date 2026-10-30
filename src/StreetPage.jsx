import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { api } from './api.js';
import { Puppet, SARDOR, dressUp } from './sardor.js';
import BusMenu from './BusMenu.jsx';
import { byBus } from './travel.js';

// Sardor kadri (dunyo birliklarida), SardorStage bilan bir xil
const VIEW = { left: -0.95, right: 0.95, top: 3.85, bottom: -0.05 };
const FPS = 30;
// Sahna koordinatalari: yer sathi y=700, uy markazda chaproqda, Sardor uy yonida
const GROUND = 700;
const FEET = [90, 712];
// eshik o'yig'i 138 birlik: Sardor undan sal pastroq bo'lishi kerak
const SARDOR_H = 132;
// Yurish manzillari (sahna x): uy eshigi va avtobus bekati
const DOOR_X = -139;
const STOP_X = -425;
const SPEED = 130; // birlik/soniya

// Ekran o'lchamiga qarab ko'rinadigan soha: uy yaqindan, kamida 700 birlik eni (bekatdan Sardorgacha) va 640 birlik bo'yi
function viewBox(w, h) {
  const a = w / h;
  const W = Math.max(700, 640 * a);
  const H = Math.max(640, W / a);
  return { x: -222 - W / 2, y: 880 - H, W, H };
}

// Bosiladigan sahna qismi: sichqoncha bilan ham, klaviatura bilan ham ishlaydi
export function Hit({ label, onPress, children }) {
  return (
    <g className="street-hit" role="button" tabIndex={0} aria-label={label} onClick={onPress}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPress(); } }}>
      {children}
    </g>
  );
}

// Avtobus bekati: soyabon, shisha devor, skameyka va belgi
export function BusStop() {
  return (
    <g>
      <ellipse cx={-478} cy={740} rx={130} ry={8} fill="#000" opacity=".16" />
      {/* belgi ustuni */}
      <rect x={-616} y={430} width={7} height={310} rx={2} fill="url(#st-metal)" />
      <circle cx={-612} cy={430} r={26} fill="#fff" />
      <circle cx={-612} cy={430} r={22} fill="#2f7fd0" />
      <rect x={-626} y={418} width={28} height={20} rx={4} fill="#fff" />
      <rect x={-622} y={421} width={9} height={7} rx={1} fill="#2f7fd0" />
      <rect x={-611} y={421} width={9} height={7} rx={1} fill="#2f7fd0" />
      <circle cx={-620} cy={439} r={3} fill="#fff" /><circle cx={-604} cy={439} r={3} fill="#fff" />
      <rect x={-640} y={462} width={56} height={18} rx={3} fill="#2f7fd0" />
      <text x={-612} y={475} textAnchor="middle" fontSize={11} fontWeight={700} fill="#fff">BEKAT</text>
      {/* orqa shisha devor va reklama */}
      <rect x={-566} y={502} width={176} height={220} fill="url(#st-glass)" opacity=".45" />
      <rect x={-566} y={502} width={176} height={220} fill="none" stroke="#8d96a0" strokeWidth={3} />
      <rect x={-556} y={584} width={52} height={86} rx={2} fill="#ffcf5a" />
      <circle cx={-530} cy={612} r={14} fill="#ff7a59" />
      <rect x={-548} y={636} width={36} height={5} rx={2} fill="#fff" />
      <rect x={-548} y={646} width={26} height={5} rx={2} fill="#fff" opacity=".8" />
      <polygon points="-490,576 -460,576 -500,660 -510,660" fill="#fff" opacity=".25" />
      {/* skameyka */}
      <rect x={-532} y={694} width={8} height={36} fill="#6b7178" />
      <rect x={-436} y={694} width={8} height={36} fill="#6b7178" />
      <rect x={-544} y={686} width={128} height={10} rx={3} fill="url(#st-door)" />
      <rect x={-544} y={660} width={128} height={8} rx={3} fill="url(#st-door)" />
      {/* ustunlar */}
      <rect x={-574} y={486} width={9} height={252} rx={2} fill="url(#st-metal)" />
      <rect x={-392} y={486} width={9} height={252} rx={2} fill="url(#st-metal)" />
      {/* tom */}
      <polygon points="-592,490 -366,490 -376,472 -582,472" fill="#d9e3ea" />
      <rect x={-594} y={488} width={230} height={12} rx={2} fill="#2f7fd0" />
      <rect x={-594} y={498} width={230} height={4} fill="#000" opacity=".15" />
    </g>
  );
}

// Uzoqdagi bino: old yuzi, soyadagi yon yuzi va derazalari (havo pardasi bilan och-ko'k)
export function Building({ x, w, h, base = 652, tone }) {
  const top = base - h, d = 16;
  const wins = [];
  for (let wy = top + 18; wy < base - 24; wy += 30)
    for (let wx = x + 12; wx < x + w - 16; wx += 26) wins.push(<rect key={wx + '-' + wy} x={wx} y={wy} width={12} height={16} rx={1} />);
  return (
    <g>
      <polygon points={`${x + w},${top} ${x + w + d},${top - 9} ${x + w + d},${base - 9} ${x + w},${base}`} fill={tone[1]} />
      <polygon points={`${x},${top} ${x + d},${top - 9} ${x + w + d},${top - 9} ${x + w},${top}`} fill={tone[2]} />
      <rect x={x} y={top} width={w} height={h} fill={tone[0]} />
      <g fill="#e9f4fb" opacity=".55">{wins}</g>
    </g>
  );
}

// Dumaloq daraxt: shox tojlari radial gradient bilan, chap-tepadan yorug'lik
export function Tree({ x, y, s = 1, far }) {
  const g = far ? 'url(#st-leaf-far)' : 'url(#st-leaf)';
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx={4} cy={2} rx={62} ry={10} fill="#000" opacity={far ? 0.08 : 0.18} />
      <path d="M-10 0 L-8 -120 Q0 -130 8 -120 L11 0 Z" fill={far ? '#8f7a68' : 'url(#st-bark)'} />
      <path d="M0 -95 L-26 -132 M2 -110 L28 -140" stroke={far ? '#8f7a68' : '#6f4a2f'} strokeWidth={7} strokeLinecap="round" />
      <circle cx={-42} cy={-140} r={46} fill={g} />
      <circle cx={44} cy={-145} r={48} fill={g} />
      <circle cx={0} cy={-190} r={60} fill={g} />
      <circle cx={-6} cy={-130} r={44} fill={g} />
      {!far && <ellipse cx={-22} cy={-212} rx={24} ry={14} fill="#bfe79a" opacity=".35" />}
    </g>
  );
}

export function Bush({ x, y, s = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx={0} cy={2} rx={46} ry={7} fill="#000" opacity=".16" />
      <circle cx={-24} cy={-16} r={22} fill="url(#st-leaf)" />
      <circle cx={22} cy={-15} r={23} fill="url(#st-leaf)" />
      <circle cx={0} cy={-26} r={27} fill="url(#st-leaf)" />
    </g>
  );
}

// Ko'cha sahnalarining umumiy gradientlari (ko'cha va shifoxona sahifalari)
export function StreetDefs() {
  return (
    <defs>
      <linearGradient id="sky" gradientUnits="userSpaceOnUse" x1="0" y1="-300" x2="0" y2="700">
        <stop offset="0" stopColor="#4f97d6" />
        <stop offset=".55" stopColor="#9fd0f2" />
        <stop offset="1" stopColor="#fbe9cf" />
      </linearGradient>
      <radialGradient id="st-sun">
        <stop offset="0" stopColor="#fff8dc" />
        <stop offset=".35" stopColor="#ffe9a3" />
        <stop offset="1" stopColor="#ffe9a3" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="st-cloud" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fff" />
        <stop offset="1" stopColor="#d6e4f0" />
      </linearGradient>
      <linearGradient id="st-hill-far" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#a9c8d8" />
        <stop offset="1" stopColor="#c9dde3" />
      </linearGradient>
      <linearGradient id="st-hill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#8fbf8a" />
        <stop offset="1" stopColor="#a9cfa0" />
      </linearGradient>
      <linearGradient id="st-grass" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#7fbf62" />
        <stop offset="1" stopColor="#5d9f45" />
      </linearGradient>
      <radialGradient id="st-leaf" cx=".35" cy=".3" r=".75">
        <stop offset="0" stopColor="#8fd16c" />
        <stop offset=".6" stopColor="#4f9a3f" />
        <stop offset="1" stopColor="#2f6b2a" />
      </radialGradient>
      <radialGradient id="st-leaf-far" cx=".35" cy=".3" r=".75">
        <stop offset="0" stopColor="#a9cf9a" />
        <stop offset="1" stopColor="#6f9e72" />
      </radialGradient>
      <linearGradient id="st-bark" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#a0704a" />
        <stop offset="1" stopColor="#5e3d26" />
      </linearGradient>
      <linearGradient id="st-wall" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#fbecd0" />
        <stop offset="1" stopColor="#e8cfa2" />
      </linearGradient>
      <linearGradient id="st-wall-side" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#cdb084" />
        <stop offset="1" stopColor="#b89a6e" />
      </linearGradient>
      <linearGradient id="st-roof" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#d4664c" />
        <stop offset="1" stopColor="#a8432f" />
      </linearGradient>
      <linearGradient id="st-roof-side" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#b54a35" />
        <stop offset="1" stopColor="#7f3122" />
      </linearGradient>
      <pattern id="st-tiles" width="34" height="18" patternUnits="userSpaceOnUse">
        <path d="M0 17.5 H34 M17 0 V18" stroke="#000" strokeOpacity=".12" strokeWidth="2" fill="none" />
      </pattern>
      <linearGradient id="st-glass" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#e4f4ff" />
        <stop offset=".5" stopColor="#9fcdf0" />
        <stop offset="1" stopColor="#6fa6d4" />
      </linearGradient>
      <linearGradient id="st-door" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#8e5833" />
        <stop offset="1" stopColor="#5f3a20" />
      </linearGradient>
      <linearGradient id="st-walk" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ddd8cb" />
        <stop offset="1" stopColor="#c7c1b2" />
      </linearGradient>
      <linearGradient id="st-road" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#4a5058" />
        <stop offset=".4" stopColor="#5a6069" />
        <stop offset="1" stopColor="#3f444b" />
      </linearGradient>
      <linearGradient id="st-house-ao" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#000" stopOpacity="0" />
        <stop offset="1" stopColor="#000" stopOpacity=".18" />
      </linearGradient>
      <linearGradient id="st-metal" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#c3cbd3" />
        <stop offset="1" stopColor="#7d8791" />
      </linearGradient>
      <radialGradient id="st-shade">
        <stop offset="0" stopColor="#000" stopOpacity=".28" />
        <stop offset="1" stopColor="#000" stopOpacity="0" />
      </radialGradient>
    </defs>
  );
}

function Street({ x, onHouse, onStop }) {
  const dash = [];
  for (let x = -2000; x < 2000; x += 170) dash.push(<rect key={x} x={x} y={834} width={95} height={9} rx={3} fill="#e9e6da" opacity=".85" />);
  const slabs = [];
  for (let x = -2000; x < 2000; x += 72) slabs.push(<line key={x} x1={x} y1={703} x2={x - 14} y2={742} stroke="#b3ad9f" strokeWidth={2} opacity=".7" />);
  const fence = [];
  for (let x = 330; x < 2000; x += 26) fence.push(<rect key={x} x={x} y={650} width={10} height={44} rx={3} />);
  for (let x = -330; x > -2000; x -= 26) fence.push(<rect key={x} x={x} y={650} width={10} height={44} rx={3} />);
  return (
    <>
      <StreetDefs />

      {/* osmon, quyosh, bulutlar */}
      <rect x={-3000} y={-3000} width={6000} height={3700} fill="url(#sky)" />
      <circle cx={240} cy={320} r={110} fill="url(#st-sun)" />
      <circle cx={240} cy={320} r={34} fill="#fff6d0" />
      <g transform="translate(-300 170)"><g fill="url(#st-cloud)" opacity=".95" className="cloud">
        <ellipse cx={-180} cy={160} rx={85} ry={24} /><ellipse cx={-145} cy={138} rx={48} ry={32} /><ellipse cx={-210} cy={146} rx={36} ry={24} /><ellipse cx={-100} cy={154} rx={34} ry={20} />
      </g></g>
      <g transform="translate(-280 70)"><g fill="url(#st-cloud)" opacity=".85" className="cloud slow">
        <ellipse cx={250} cy={260} rx={62} ry={17} /><ellipse cx={275} cy={244} rx={36} ry={22} /><ellipse cx={230} cy={250} rx={26} ry={16} />
      </g></g>

      {/* uzoq tepaliklar (ikki qatlam, havo pardasi bilan) */}
      <path d="M-3000 560 Q-1400 470 -620 540 Q-200 480 250 530 Q700 470 1200 520 Q2200 480 3000 540 V700 H-3000 Z" fill="url(#st-hill-far)" />
      <path d="M-3000 610 Q-1500 560 -500 600 Q100 565 700 595 Q1600 560 3000 600 V700 H-3000 Z" fill="url(#st-hill)" />

      {/* uzoqdagi binolar */}
      <Building x={-930} w={170} h={150} tone={['#b8cfe0', '#9db7cb', '#cddde9']} />
      <Building x={-730} w={120} h={205} tone={['#c4d4e2', '#a4b9cc', '#d6e2ec']} />
      <Building x={430} w={140} h={175} tone={['#bfd2e2', '#a2b8cb', '#d3e0eb']} />
      <Building x={610} w={200} h={130} tone={['#b6cbdc', '#9ab2c6', '#cbdbe7']} />

      {/* orqa qatordagi daraxtlar */}
      <Tree x={-560} y={655} s={0.55} far />
      <Tree x={-410} y={658} s={0.45} far />
      <Tree x={560} y={656} s={0.5} far />
      <Tree x={880} y={655} s={0.6} far />

      {/* maysa va qo'shni hovli panjarasi */}
      <rect x={-3000} y={640} width={6000} height={62} fill="url(#st-grass)" />
      <g fill="#f4efe4" stroke="#cfc6b4" strokeWidth={1.5}>
        <rect x={-2000} y={662} width={1670} height={7} rx={2} />
        <rect x={330} y={662} width={1670} height={7} rx={2} />
        {fence}
      </g>

      {/* katta daraxt */}
      <Tree x={303} y={702} s={1.05} />

      {/* Sardorning uyi (bosilsa Sardor ichkariga kiradi) */}
      <Hit label="Uyga kirish" onPress={onHouse}>
        {/* yerga tushgan yumshoq soya */}
        <ellipse cx={-120} cy={704} rx={230} ry={14} fill="#000" opacity=".15" />
        {/* yon devor (perspektiva) */}
        <polygon points="10,412 62,388 62,676 10,700" fill="url(#st-wall-side)" />
        <polygon points="24,464 48,453 48,505 24,516" fill="#7fa9c9" opacity=".85" />
        {/* old devor */}
        <rect x={-290} y={410} width={300} height={290} fill="url(#st-wall)" />
        <rect x={-290} y={600} width={300} height={100} fill="url(#st-house-ao)" />
        <rect x={-296} y={684} width={312} height={18} fill="#b8ad99" />
        <rect x={-296} y={684} width={312} height={3} fill="#d7cdb9" />
        {/* tom: yon qiyalik va old peshtoq */}
        <polygon points="-140,284 -88,260 92,390 40,415" fill="url(#st-roof-side)" />
        <polygon points="-140,284 -88,260 92,390 40,415" fill="url(#st-tiles)" />
        {/* mo'ri */}
        <polygon points="-40,300 -28,294 -28,330 -40,336" fill="#7d3a2d" />
        <rect x={-72} y={300} width={32} height={60} fill="#a9503e" />
        <rect x={-78} y={292} width={44} height={10} rx={2} fill="#8a3f31" />
        <polygon points="-325,418 -140,282 45,418" fill="url(#st-roof)" />
        <polygon points="-290,410 -140,300 10,410" fill="#f6e3bf" />
        <polygon points="-290,410 -140,300 10,410" fill="url(#st-house-ao)" opacity=".5" />
        <polyline points="-325,418 -140,282 45,418" fill="none" stroke="#8a3626" strokeWidth={9} strokeLinejoin="round" strokeLinecap="round" />
        <rect x={-290} y={412} width={300} height={10} fill="#000" opacity=".12" />
        {/* peshtoqdagi dumaloq deraza */}
        <circle cx={-140} cy={368} r={24} fill="#fff" />
        <circle cx={-140} cy={368} r={19} fill="url(#st-glass)" />
        <path d="M-152 360 Q-146 352 -136 352" stroke="#fff" strokeWidth={4} strokeLinecap="round" opacity=".7" fill="none" />
        {/* eshik: rom, panellar, soyabon */}
        <rect x={-184} y={552} width={90} height={150} rx={4} fill="#f8f1e2" />
        <rect x={-175} y={562} width={72} height={138} rx={3} fill="url(#st-door)" />
        <rect x={-166} y={574} width={22} height={48} rx={2} fill="#000" opacity=".14" />
        <rect x={-134} y={574} width={22} height={48} rx={2} fill="#000" opacity=".14" />
        <rect x={-166} y={634} width={22} height={52} rx={2} fill="#000" opacity=".14" />
        <rect x={-134} y={634} width={22} height={52} rx={2} fill="#000" opacity=".14" />
        <circle cx={-113} cy={636} r={5} fill="#f3c74f" />
        <circle cx={-114.5} cy={634.5} r={1.8} fill="#fff6c8" />
        <polygon points="-200,548 -78,548 -88,530 -190,530" fill="url(#st-roof)" />
        <rect x={-200} y={548} width={122} height={6} fill="#000" opacity=".15" />
        <rect x={-196} y={698} width={114} height={10} rx={2} fill="#bdb5a6" />
        <rect x={-196} y={698} width={114} height={3} rx={1} fill="#d9d2c4" />
        {/* derazalar: oyna, akslar, panjara, qopqoqlar, tokcha */}
        {[-262, -55].map((x) => (
          <g key={x}>
            <rect x={x - 18} y={466} width={14} height={72} rx={2} fill="#6f9c78" />
            <rect x={x + 68} y={466} width={14} height={72} rx={2} fill="#5d8a66" />
            <rect x={x - 4} y={462} width={72} height={80} rx={3} fill="#fff" />
            <rect x={x} y={466} width={64} height={72} fill="url(#st-glass)" />
            <polygon points={`${x},${466} ${x + 26},${466} ${x},${500}`} fill="#fff" opacity=".35" />
            <rect x={x + 30} y={466} width={4} height={72} fill="#fff" />
            <rect x={x} y={500} width={64} height={4} fill="#fff" />
            <rect x={x - 8} y={540} width={80} height={8} rx={2} fill="#e6dcc8" />
            <rect x={x - 8} y={546} width={80} height={3} fill="#000" opacity=".12" />
            {/* gul qutisi */}
            <rect x={x} y={548} width={64} height={14} rx={2} fill="#9a5434" />
            {[6, 20, 34, 48, 60].map((dx, i) => (
              <g key={dx}>
                <circle cx={x + dx} cy={546 - (i % 2) * 4} r={6} fill="#5fa04b" />
                <circle cx={x + dx + 2} cy={542 - (i % 2) * 4} r={4.5} fill={i % 2 ? '#ff7aa2' : '#ffd23f'} />
              </g>
            ))}
          </g>
        ))}
      </Hit>
      <Bush x={-305} y={702} s={0.9} />
      <Bush x={-20} y={702} s={0.75} />

      {/* yo'lak, bordyur va yo'l */}
      <rect x={-3000} y={700} width={6000} height={44} fill="url(#st-walk)" />
      {slabs}
      <Hit label="Avtobus bekati" onPress={onStop}>
        {/* bekat yo'lakning orqa qismida turadi, Sardor uning oldida yerda turishi uchun */}
        <g transform="translate(-335 706) scale(.8) translate(366 -740)">
          <BusStop />
        </g>
      </Hit>
      <rect x={-3000} y={742} width={6000} height={4} fill="#ece8de" />
      <rect x={-3000} y={746} width={6000} height={12} fill="#9a958a" />
      <rect x={-3000} y={758} width={6000} height={10} fill="#000" opacity=".25" />
      <rect x={-3000} y={758} width={6000} height={400} fill="url(#st-road)" />
      <rect x={-3000} y={768} width={6000} height={4} fill="#000" opacity=".12" />
      {dash}
      <ellipse cx={x} cy={FEET[1] + 2} rx={SARDOR_H * 0.23} ry={SARDOR_H * 0.043} fill="url(#st-shade)" />
    </>
  );
}

// Ko'cha sahifasi — uyning tashqi ko'rinishi. Uydan chiqqan Sardor uy oldida, avtobusda kelgan Sardor
// bekat yonida paydo bo'ladi. Uy bosilsa eshikka yurib ichkariga kiradi, bekat bosilsa bekatga yurib boradi.
export default function StreetPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [arrival] = useState(() => (byBus(location) ? { x: STOP_X, enter: location.state.enter } : { x: FEET[0] }));
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const puppetRef = useRef(null);
  const posRef = useRef(arrival.x); // Sardorning hozirgi joyi (sahna x)
  const goRef = useRef(null); // { x, done } — qayerga yuryapti va yetib borganda nima bo'ladi
  const placeRef = useRef(null);
  const [box, setBox] = useState(() => viewBox(window.innerWidth, window.innerHeight));
  const [posX, setPosX] = useState(arrival.x);
  const [entering, setEntering] = useState(false);
  const [menu, setMenu] = useState(false); // bekat menyusi ochiqmi
  const [clothes, setClothes] = useState([]);
  const [outfit, setOutfit] = useState(null);
  const look = useMemo(() => (outfit ? dressUp(clothes, outfit) : SARDOR), [clothes, outfit]);
  const timers = useRef([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // kuryer smenasidami: smena tugamaguncha uyga kirib bo'lmaydi
  const [onShift, setOnShift] = useState(false);
  const [blocked, setBlocked] = useState(false);
  useEffect(() => {
    api('/courier').then((d) => { if (d.profile?.onShift) setOnShift('courier'); }).catch(() => {});
    api('/waiter').then((d) => { if (d.profile?.onShift) setOnShift('waiter'); }).catch(() => {});
  }, []);

  // saqlangan kiyim (olinmasa Sardor oddiy kiyimida turadi)
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

    // SVG "xMidYMid" bilan to'liq ekranga chiziladi; canvasni sahna koordinatalariga moslaymiz
    let b = viewBox(wrap.clientWidth, wrap.clientHeight), cw = 0, ch = 0;
    function place() {
      const k = wrap.clientWidth / b.W;
      canvas.style.left = (posRef.current - b.x) * k - cw / 2 + 'px';
    }
    placeRef.current = place;
    function resize() {
      const w = wrap.clientWidth, h = wrap.clientHeight;
      b = viewBox(w, h);
      setBox(b);
      const k = w / b.W;
      ch = SARDOR_H * k; cw = ch * (VIEW.right - VIEW.left) / (VIEW.top - VIEW.bottom);
      Object.assign(canvas.style, {
        width: cw + 'px', height: ch + 'px',
        top: (FEET[1] - b.y) * k - ch * VIEW.top / (VIEW.top - VIEW.bottom) + 'px',
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
      // yurish: manzilga qarab siljiydi, chapga yursa ko'zgudagidek aylantiriladi
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
      placeRef.current = null;
    };
  }, []);

  useEffect(() => {
    puppetRef.current?.setOutfit(look);
  }, [look]);

  // Uy: eshikka yurib boradi, sekin yo'qoladi va xona ochiladi
  function goHome() {
    if (entering) return;
    if (onShift) {
      setMenu(false);
      setBlocked(true);
      timers.current.push(setTimeout(() => setBlocked(false), 3500));
      return;
    }
    setEntering(true);
    setMenu(false);
    goRef.current = {
      x: DOOR_X,
      done: () => {
        if (canvasRef.current) canvasRef.current.style.opacity = '0';
        timers.current.push(setTimeout(() => navigate('/'), 450));
      },
    };
  }

  // Avtobusda "Uy"ga kelgan bo'lsa: bekatdan uyga yurib kiradi. Holat tozalanadi (yangilansa qayta yurmaydi)
  useEffect(() => {
    if (!byBus(location)) return;
    navigate(location.pathname, { replace: true, state: null });
    if (arrival.enter) timers.current.push(setTimeout(goHome, 400));
  }, []);

  // Bekat: Sardor bekatga yurib boradi, keyin yo'nalishlar menyusi ochiladi
  function goStop() {
    if (entering) return;
    setMenu(false);
    goRef.current = {
      x: STOP_X,
      done: () => setMenu(true),
    };
  }

  return (
    <div className={'street' + (entering ? ' entering' : '')} ref={wrapRef}>
      <svg className="street-scene" viewBox={`${box.x} ${box.y} ${box.W} ${box.H}`} preserveAspectRatio="xMidYMax slice">
        <Street x={posX} onHouse={goHome} onStop={goStop} />
      </svg>
      <canvas className="sardor street-sardor" ref={canvasRef} aria-label="Sardor ko'chada turibdi" role="img" />
      <button className="street-back" onClick={goHome}>Xonaga qaytish</button>
      {blocked && (
        <div className="street-blocked" role="alert">
          Siz {onShift === 'waiter' ? 'ofitsiant' : 'kuryer'} smenasidasiz. Uyga borish uchun avval smenani yakunlang.
          <button onClick={() => navigate(onShift === 'waiter' ? '/work/waiter' : '/work/courier')}>{onShift === 'waiter' ? 'Ofitsiant ilovasiga' : 'Kuryer ilovasiga'}</button>
        </div>
      )}
      {menu && <BusMenu onClose={() => setMenu(false)} onHome={goHome} />}
    </div>
  );
}
