import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { api } from './api.js';
import { Puppet, SARDOR, dressUp } from './sardor.js';
import { Hit, BusStop, Building, Tree, Bush, StreetDefs } from './StreetPage.jsx';
import BusMenu from './BusMenu.jsx';
import { useVitals, fmtLeft, STAGE_NAMES } from './vitals.js';

// Sardor kadri va o'lchamlari ko'cha sahifasi bilan bir xil (oyog'i yo'lakda turadi)
const VIEW = { left: -0.95, right: 0.95, top: 3.85, bottom: -0.05 };
const FPS = 30;
const FEET_Y = 712;
const SARDOR_H = 132;
const SPEED = 130; // birlik/soniya
// Yurish manzillari (sahna x): shifoxona eshigi, dorixona eshigi va avtobus bekati
const HOSPITAL_X = -170;
const PHARMACY_X = 287;
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

// Shifoxona: oq bino, qizil xochlar, peshtoqda yozuv va shisha eshikli kirish
function Hospital() {
  const wins = [];
  for (let row = 0; row < 3; row++)
    for (let i = 0; i < 7; i++) {
      if (row === 2 && i > 1 && i < 5) continue; // pastki qatorda o'rtada kirish joyi
      const x = -370 + i * 60, y = 448 + row * 76;
      wins.push(
        <g key={row + '-' + i}>
          <rect x={x - 3} y={y - 3} width={46} height={56} rx={2} fill="#fff" />
          <rect x={x} y={y} width={40} height={50} fill="url(#st-glass)" />
          <polygon points={`${x},${y} ${x + 16},${y} ${x},${y + 22}`} fill="#fff" opacity=".35" />
          <rect x={x + 18} y={y} width={4} height={50} fill="#fff" />
        </g>,
      );
    }
  return (
    <g>
      <ellipse cx={-160} cy={704} rx={280} ry={14} fill="#000" opacity=".15" />
      {/* yon devor (perspektiva) */}
      <polygon points="60,362 104,340 104,678 60,700" fill="url(#hs-side)" />
      {[440, 516, 592].map((y) => (
        <polygon key={y} points={`72,${y - 6} 92,${y - 16} 92,${y + 30} 72,${y + 40}`} fill="#7fa9c9" opacity=".8" />
      ))}
      {/* old devor */}
      <rect x={-400} y={360} width={460} height={340} fill="url(#hs-wall)" />
      <rect x={-400} y={600} width={460} height={100} fill="url(#st-house-ao)" />
      <rect x={-406} y={684} width={472} height={18} fill="#b8ad99" />
      <rect x={-406} y={684} width={472} height={3} fill="#d7cdb9" />
      {/* tom parapeti */}
      <polygon points="-408,348 -364,326 112,326 68,348" fill="#c9d3dc" />
      <polygon points="68,348 112,326 112,342 68,364" fill="#b4c0cb" />
      <rect x={-408} y={348} width={476} height={16} rx={2} fill="#eef2f5" />
      <rect x={-400} y={364} width={460} height={8} fill="#d94b4b" />
      {/* yozuv va xochlar */}
      <rect x={-300} y={384} width={260} height={40} rx={6} fill="#fff" stroke="#d94b4b" strokeWidth={3} />
      <text x={-170} y={413} textAnchor="middle" fontSize={24} fontWeight={800} fill="#d94b4b" letterSpacing={2}>SHIFOXONA</text>
      {[-350, 10].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy={404} r={24} fill="#fff" stroke="#d94b4b" strokeWidth={3} />
          <rect x={cx - 6} y={388} width={12} height={32} rx={2} fill="#d94b4b" />
          <rect x={cx - 16} y={398} width={32} height={12} rx={2} fill="#d94b4b" />
        </g>
      ))}
      {wins}
      {/* kirish: shisha eshiklar va soyabon */}
      <rect x={-225} y={596} width={110} height={104} fill="#9aa7b3" />
      <rect x={-219} y={602} width={48} height={98} fill="url(#st-glass)" />
      <rect x={-169} y={602} width={48} height={98} fill="url(#st-glass)" />
      <polygon points="-219,602 -199,602 -219,640" fill="#fff" opacity=".35" />
      <rect x={-177} y={640} width={4} height={24} rx={2} fill="#6b7178" />
      <rect x={-167} y={640} width={4} height={24} rx={2} fill="#6b7178" />
      <rect x={-240} y={590} width={5} height={110} fill="url(#st-metal)" />
      <rect x={-105} y={590} width={5} height={110} fill="url(#st-metal)" />
      <polygon points="-250,592 -90,592 -100,572 -240,572" fill="#e35d5d" />
      <rect x={-250} y={590} width={160} height={7} fill="#c43f3f" />
      <rect x={-250} y={597} width={160} height={4} fill="#000" opacity=".15" />
      <rect x={-235} y={698} width={130} height={10} rx={2} fill="#bdb5a6" />
      <rect x={-235} y={698} width={130} height={3} rx={1} fill="#d9d2c4" />
    </g>
  );
}

// Dorixona: kichik yashil bino, peshtoqda yozuv, vitrina ichida dori qutilari
function Pharmacy() {
  const boxes = [];
  [590, 620, 650].forEach((y, r) =>
    [142, 162, 182, 202].forEach((x, i) =>
      boxes.push(<rect key={y + '-' + x} x={x} y={y - 14} width={14} height={14} rx={2} fill={['#ff7a59', '#ffd23f', '#5fb8e8', '#fff'][(i + r) % 4]} />),
    ),
  );
  return (
    <g>
      <ellipse cx={240} cy={704} rx={140} ry={11} fill="#000" opacity=".15" />
      <polygon points="340,500 366,487 366,687 340,700" fill="url(#ph-side)" />
      <rect x={120} y={500} width={220} height={200} fill="url(#ph-wall)" />
      <rect x={120} y={620} width={220} height={80} fill="url(#st-house-ao)" />
      <rect x={116} y={686} width={228} height={16} fill="#b8ad99" />
      <rect x={116} y={686} width={228} height={3} fill="#d7cdb9" />
      {/* tom parapeti */}
      <polygon points="114,492 140,479 372,479 346,492" fill="#cfdcd1" />
      <polygon points="346,492 372,479 372,491 346,504" fill="#a9bfae" />
      <rect x={114} y={492} width={232} height={12} rx={2} fill="#eef5ef" />
      {/* yozuv */}
      <rect x={120} y={512} width={220} height={34} fill="#2f9e5b" />
      <circle cx={146} cy={529} r={13} fill="#fff" />
      <rect x={142} y={519} width={8} height={20} rx={1} fill="#2f9e5b" />
      <rect x={136} y={525} width={20} height={8} rx={1} fill="#2f9e5b" />
      <text x={248} y={536} textAnchor="middle" fontSize={20} fontWeight={800} fill="#fff" letterSpacing={1.5}>DORIXONA</text>
      {/* vitrina */}
      <polygon points="128,568 240,568 232,556 136,556" fill="#2f9e5b" />
      <rect x={128} y={566} width={112} height={4} fill="#000" opacity=".15" />
      <rect x={132} y={572} width={104} height={102} fill="#fff" />
      <rect x={136} y={576} width={96} height={94} fill="url(#st-glass)" />
      <g opacity=".9">{boxes}</g>
      {[590, 620, 650].map((y) => <rect key={y} x={136} y={y} width={96} height={3} fill="#fff" />)}
      <polygon points="136,576 166,576 136,620" fill="#fff" opacity=".3" />
      {/* eshik */}
      <rect x={252} y={572} width={70} height={128} rx={3} fill="#fff" />
      <rect x={258} y={578} width={58} height={122} fill="url(#st-glass)" />
      <rect x={283} y={600} width={8} height={22} rx={1} fill="#2f9e5b" />
      <rect x={276} y={607} width={22} height={8} rx={1} fill="#2f9e5b" />
      <rect x={306} y={632} width={4} height={24} rx={2} fill="#6b7178" />
      <rect x={248} y={698} width={78} height={9} rx={2} fill="#bdb5a6" />
    </g>
  );
}

function Scene({ x, onHospital, onPharmacy, onStop }) {
  const dash = [];
  for (let x = -2000; x < 2000; x += 170) dash.push(<rect key={x} x={x} y={834} width={95} height={9} rx={3} fill="#e9e6da" opacity=".85" />);
  const slabs = [];
  for (let x = -2000; x < 2000; x += 72) slabs.push(<line key={x} x1={x} y1={703} x2={x - 14} y2={742} stroke="#b3ad9f" strokeWidth={2} opacity=".7" />);
  return (
    <>
      <StreetDefs />
      <defs>
        <linearGradient id="hs-wall" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f7f9fb" />
          <stop offset="1" stopColor="#dbe3ea" />
        </linearGradient>
        <linearGradient id="hs-side" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#c4cfd9" />
          <stop offset="1" stopColor="#aab8c4" />
        </linearGradient>
        <linearGradient id="ph-wall" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f1f8f1" />
          <stop offset="1" stopColor="#d3e6d6" />
        </linearGradient>
        <linearGradient id="ph-side" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#b9d1bd" />
          <stop offset="1" stopColor="#9fbaa4" />
        </linearGradient>
      </defs>

      {/* osmon, quyosh, bulutlar */}
      <rect x={-3000} y={-3000} width={6000} height={3700} fill="url(#sky)" />
      <circle cx={250} cy={330} r={110} fill="url(#st-sun)" />
      <circle cx={250} cy={330} r={34} fill="#fff6d0" />
      <g transform="translate(-120 120)"><g fill="url(#st-cloud)" opacity=".95" className="cloud">
        <ellipse cx={-180} cy={160} rx={85} ry={24} /><ellipse cx={-145} cy={138} rx={48} ry={32} /><ellipse cx={-210} cy={146} rx={36} ry={24} /><ellipse cx={-100} cy={154} rx={34} ry={20} />
      </g></g>
      <g transform="translate(200 40)"><g fill="url(#st-cloud)" opacity=".85" className="cloud slow">
        <ellipse cx={250} cy={260} rx={62} ry={17} /><ellipse cx={275} cy={244} rx={36} ry={22} /><ellipse cx={230} cy={250} rx={26} ry={16} />
      </g></g>

      {/* uzoq tepaliklar va binolar */}
      <path d="M-3000 560 Q-1400 470 -620 540 Q-200 480 250 530 Q700 470 1200 520 Q2200 480 3000 540 V700 H-3000 Z" fill="url(#st-hill-far)" />
      <path d="M-3000 610 Q-1500 560 -500 600 Q100 565 700 595 Q1600 560 3000 600 V700 H-3000 Z" fill="url(#st-hill)" />
      <Building x={-760} w={150} h={170} tone={['#b8cfe0', '#9db7cb', '#cddde9']} />
      <Building x={-590} w={120} h={120} tone={['#c4d4e2', '#a4b9cc', '#d6e2ec']} />
      <Building x={760} w={160} h={190} tone={['#bfd2e2', '#a2b8cb', '#d3e0eb']} />
      <Building x={950} w={200} h={130} tone={['#b6cbdc', '#9ab2c6', '#cbdbe7']} />
      <Tree x={-520} y={655} s={0.5} far />
      <Tree x={480} y={656} s={0.5} far />
      <Tree x={820} y={655} s={0.6} far />
      <rect x={-3000} y={640} width={6000} height={62} fill="url(#st-grass)" />
      <Tree x={396} y={702} s={0.75} />

      <Hit label="Shifoxona" onPress={onHospital}><Hospital /></Hit>
      <Hit label="Dorixona" onPress={onPharmacy}><Pharmacy /></Hit>
      <Bush x={-440} y={702} s={0.85} />
      <Bush x={92} y={702} s={0.6} />

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

// Dorixona oynasi: kasal bo'lsa dori sotib olib davolanadi (narx va davolash serverda)
function PharmacyPanel({ onClose }) {
  const v = useVitals();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null); // { ok, text }

  useEffect(() => { api('/me/vitals').catch(() => {}); }, []); // eng yangi holat (api o'zi saqlaydi)

  async function cure() {
    setBusy(true);
    setMsg(null);
    try {
      const d = await api('/pharmacy/cure', { method: 'POST' });
      setMsg({ ok: true, text: `Sardor davolandi! ${d.paid} tanga to'landi, balans: ${d.coins} tanga.` });
    } catch (err) {
      setMsg({ ok: false, text: err.message });
    } finally {
      setBusy(false);
    }
  }

  const sick = v?.stage > 0;
  return (
    <div className="pharmacy-card" role="dialog" aria-label="Dorixona">
      <h2>💊 Dorixona</h2>
      {!v ? <p>Yuklanmoqda...</p> : sick ? (
        <p>
          Sardor kasal: <b>{STAGE_NAMES[v.stage]} ({v.stage}-bosqich)</b>.
          {v.nextInMs != null && ` Davolanmasa ${fmtLeft(v.nextInMs)}dan keyin ${v.stage >= 3 ? 'vafot etadi' : "og'irlashadi"}.`}
          {' '}Dori narxi: <b>{v.curePrice} tanga</b>.
        </p>
      ) : (
        <p>{msg?.ok ? '' : "Sardor sog', dori kerak emas."}</p>
      )}
      {v?.warn && <p>⚡ Energiya kam ({Math.round(v.energy)}%). Dori charchoqni ketkazmaydi — uyga borib uxlang, aks holda yana kasal bo'ladi.</p>}
      {msg && <p className={msg.ok ? 'ph-ok' : 'ph-err'} role="status">{msg.text}</p>}
      <div className="actions">
        {sick && <button className="ph-cure" onClick={cure} disabled={busy}>{busy ? 'Kuting...' : `Davolanish · ${v.curePrice} tanga`}</button>}
        <button className="secondary" onClick={onClose}>Yopish</button>
      </div>
    </div>
  );
}

// Shifoxona oldi: Sardor avtobusdan tushib bekatda turibdi. Shifoxona va dorixonaga yurib boradi
// (shifoxona ichkarisi hali yo'q, dorixonada kasallik davolanadi), bekatdan yana yo'nalishlar menyusi ochiladi
export default function HospitalPage() {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const puppetRef = useRef(null);
  const posRef = useRef(STOP_X);
  const goRef = useRef(null); // { x, done } — qayerga yuryapti va yetib borganda nima bo'ladi
  const [box, setBox] = useState(() => viewBox(window.innerWidth, window.innerHeight, STOP_X));
  const [posX, setPosX] = useState(STOP_X);
  const [menu, setMenu] = useState(false);
  const [note, setNote] = useState(null);
  const [pharmacy, setPharmacy] = useState(false); // dorixona oynasi ochiq
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
    setMenu(false);
    setNote(null);
    setPharmacy(false);
    goRef.current = { x, done };
  }

  function showNote(text) {
    setNote(text);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setNote(null), 3500);
  }

  return (
    <div className="street" ref={wrapRef}>
      <svg className="street-scene" viewBox={`${box.x} ${box.y} ${box.W} ${box.H}`} preserveAspectRatio="xMidYMax slice">
        <Scene
          x={posX}
          onHospital={() => walkTo(HOSPITAL_X, () => showNote("Shifoxona: davolanish tez orada qo'shiladi"))}
          onPharmacy={() => walkTo(PHARMACY_X, () => setPharmacy(true))}
          onStop={() => walkTo(STOP_X, () => setMenu(true))}
        />
      </svg>
      <canvas className="sardor street-sardor" ref={canvasRef} aria-label="Sardor shifoxona oldida turibdi" role="img" />
      {note && <div className="street-blocked" role="status">{note}</div>}
      {pharmacy && <PharmacyPanel onClose={() => setPharmacy(false)} />}
      {menu && <BusMenu here="hospital" onClose={() => setMenu(false)} />}
    </div>
  );
}
