import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { api } from './api.js';
import { SARDOR, dressUp } from './sardor.js';
import { CourierPuppet, Vehicle, SEATS, UNIFORM } from './courier.js';
import CourierApp, { Coin, LevelRing, fmt, roomyScreen } from './CourierApp.jsx';
import ShopGame from './ShopGame.jsx';
import BusMenu from './BusMenu.jsx';
import { BusStop } from './StreetPage.jsx';
import './courier.css';

// Sahna (SVG viewBox 0 0 1000 600): yo'l sathi y=GROUND, Sardor va transport x=CENTER da
const GROUND = 505;
const CENTER = 430;
const UNIT = 50; // 1 dunyo birligi necha SVG birligi (Sardor bo'yi ~185)
// Kadr (dunyo birliklarida): mashina eng keng transport
const VIEW = { left: -2.0, right: 2.5, top: 3.95, bottom: -0.05 };
const FPS = 30;
// har transport uchun g'ildirak tezligi va fon siljish tezligi (soniya)
const MOTION = {
  foot: { wheel: 0, far: 70, road: 1.4 },
  scooter: { wheel: 3, far: 30, road: 0.5 },
  moped: { wheel: 3.6, far: 24, road: 0.4 },
  car: { wheel: 4.2, far: 18, road: 0.32 },
};

// Uzoqdagi binolar (bitta 1000 birlik bo'lak, yurganda takrorlanib siljiydi)
function Skyline() {
  const blocks = [[20, 150, '#b8cfe0'], [190, 210, '#c4d4e2'], [330, 120, '#bfd2e2'], [470, 180, '#b6cbdc'], [640, 240, '#c4d4e2'], [800, 140, '#b8cfe0'], [900, 200, '#bfd2e2']];
  return (
    <>
      {blocks.map(([x, h, c]) => (
        <g key={x}>
          <rect x={x} y={GROUND - 60 - h} width={120} height={h} fill={c} />
          <rect x={x + 120} y={GROUND - 60 - h + 8} width={14} height={h - 8} fill="#000" opacity=".08" />
          {Array.from({ length: Math.floor(h / 40) }, (_, i) => (
            <g key={i} fill="#e4f0f8" opacity=".8">
              <rect x={x + 18} y={GROUND - 45 - h + i * 40} width={22} height={16} />
              <rect x={x + 50} y={GROUND - 45 - h + i * 40} width={22} height={16} />
              <rect x={x + 82} y={GROUND - 45 - h + i * 40} width={22} height={16} />
            </g>
          ))}
        </g>
      ))}
      {[110, 420, 760].map((x) => (
        <g key={x}>
          <rect x={x - 5} y={GROUND - 110} width={10} height={55} fill="#7a5236" />
          <circle cx={x} cy={GROUND - 125} r={34} fill="#5d9f45" />
          <circle cx={x - 12} cy={GROUND - 135} r={16} fill="#7fbf62" />
        </g>
      ))}
    </>
  );
}

// avtobus bekati deponing chap tomonida (sahna x koordinatasi) va Sardorning bekatgacha yurish vaqti
const STOP_X = 200;
const STOP_WALK = 1400;

// Kuryer xizmati binosi
function Depot() {
  return (
    <g>
      <rect x={560} y={GROUND - 250} width={360} height={190} fill="#fbecd0" />
      <polygon points={`920,${GROUND - 250} 950,${GROUND - 265} 950,${GROUND - 72} 920,${GROUND - 60}`} fill="#d9c39b" />
      <rect x={550} y={GROUND - 262} width={380} height={18} rx={4} fill="#f08a24" />
      <rect x={600} y={GROUND - 238} width={280} height={40} rx={8} fill="#fff" stroke="#f08a24" strokeWidth={4} />
      <text x={740} y={GROUND - 210} textAnchor="middle" fontSize={24} fontWeight="700" fill="#b85f12" fontFamily="system-ui, sans-serif">KURYER XIZMATI</text>
      <rect x={600} y={GROUND - 180} width={150} height={120} fill="#8a929b" />
      {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={600} y={GROUND - 176 + i * 20} width={150} height={3} fill="#6b737c" />)}
      <rect x={780} y={GROUND - 180} width={110} height={70} rx={4} fill="#9fcdf0" stroke="#fff" strokeWidth={5} />
      <rect x={560} y={GROUND - 64} width={360} height={6} fill="#000" opacity=".12" />
    </g>
  );
}

// Do'kon peshtoqi (buyurtmadagi do'kon nomi bilan)
function Shop({ name }) {
  return (
    <g>
      <rect x={580} y={GROUND - 240} width={330} height={180} fill="#f4f1ea" />
      <polygon points={`910,${GROUND - 240} 940,${GROUND - 255} 940,${GROUND - 72} 910,${GROUND - 60}`} fill="#cfc8b8" />
      <rect x={570} y={GROUND - 252} width={350} height={44} rx={6} fill="#22a39a" />
      <text x={745} y={GROUND - 223} textAnchor="middle" fontSize={22} fontWeight="700" fill="#fff" fontFamily="system-ui, sans-serif">{name}</text>
      {/* soyabon */}
      {Array.from({ length: 10 }, (_, i) => (
        <path key={i} d={`M${580 + i * 33} ${GROUND - 208} h33 v18 q-16.5 12 -33 0 z`} fill={i % 2 ? '#fff' : '#d9473f'} />
      ))}
      <rect x={600} y={GROUND - 175} width={140} height={100} fill="#bfe3f7" stroke="#fff" strokeWidth={5} />
      {[0, 1, 2].map((i) => <rect key={i} x={606} y={GROUND - 160 + i * 30} width={128} height={4} fill="#9aa3ad" />)}
      {[0, 1, 2, 3, 4, 5].map((i) => <circle key={i} cx={620 + i * 20} cy={GROUND - 166 + (i % 3) * 30} r={6} fill={['#d9473f', '#f3c623', '#8cc63f'][i % 3]} />)}
      <rect x={770} y={GROUND - 170} width={90} height={110} fill="#8fc4e6" stroke="#fff" strokeWidth={5} />
      <rect x={812} y={GROUND - 170} width={5} height={110} fill="#fff" />
    </g>
  );
}

// Mijozning uyi
function House() {
  return (
    <g>
      <rect x={600} y={GROUND - 200} width={260} height={140} fill="#fbe3c8" />
      <polygon points={`585,${GROUND - 198} 730,${GROUND - 290} 875,${GROUND - 198}`} fill="#a8432f" />
      <rect x={705} y={GROUND - 150} width={55} height={90} rx={3} fill="#7a4b2c" />
      <circle cx={750} cy={GROUND - 105} r={4} fill="#f3c74f" />
      {[625, 790].map((x) => <rect key={x} x={x} y={GROUND - 170} width={50} height={45} fill="#9fcdf0" stroke="#fff" strokeWidth={4} />)}
      <rect x={600} y={GROUND - 64} width={260} height={6} fill="#000" opacity=".12" />
    </g>
  );
}

export default function CourierPage() {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const sardorRef = useRef(null);
  const vehicleRef = useRef(null);
  const motionRef = useRef({ wheel: 0, moving: false });
  const triedRef = useRef(0);
  const firstRef = useRef(true);
  const [box, setBox] = useState({ w: 1, h: 1 });
  const [st, setSt] = useState(null); // serverdagi kuryer holati
  const [skew, setSkew] = useState(0); // server vaqti - mahalliy vaqt
  const [now, setNow] = useState(Date.now());
  const [catalog, setCatalog] = useState([]); // ovqatlar katalogi (buyurtmadagi mahsulotlar)
  const [look, setLook] = useState(SARDOR);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const [result, setResult] = useState(null); // yetkazish natijasi (yulduz, tanga, XP, yangi daraja)
  const [phone, setPhone] = useState(roomyScreen());
  const [stop, setStop] = useState(null); // bekat: null | 'going' | 'menu' | 'back'
  const stopTimer = useRef(0);
  const [error, setError] = useState('');
  const foods = useMemo(() => Object.fromEntries(catalog.map((f) => [f.id, f])), [catalog]);

  /* ---- Three.js: Sardor va transport ---- */
  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    const camera = new THREE.OrthographicCamera(VIEW.left, VIEW.right, VIEW.top, VIEW.bottom, -10, 10);
    const sardor = new CourierPuppet(SARDOR);
    scene.add(sardor.root);
    sardorRef.current = sardor;

    // SVG "xMidYMax slice" bilan chiziladi; canvasni sahna koordinatalariga moslaymiz
    function resize() {
      const w = wrap.clientWidth, h = wrap.clientHeight;
      setBox({ w, h });
      const k = Math.max(w / 1000, h / 600);
      const x0 = (w - 1000 * k) / 2, y0 = h - 600 * k;
      const u = UNIT * k;
      const cw = (VIEW.right - VIEW.left) * u, ch = (VIEW.top - VIEW.bottom) * u;
      Object.assign(canvas.style, {
        width: cw + 'px', height: ch + 'px',
        left: x0 + CENTER * k + VIEW.left * u + 'px',
        top: y0 + GROUND * k - VIEW.top * u + 'px',
      });
      renderer.setSize(cw, ch, false);
    }
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    resize();

    let raf, last = performance.now(), acc = 0, time = 0;
    function frame(t) {
      raf = requestAnimationFrame(frame);
      acc += Math.min(0.1, (t - last) / 1000);
      last = t;
      if (acc < 1 / FPS) return;
      time += acc;
      const m = motionRef.current;
      sardor.riding = m.moving;
      vehicleRef.current?.update(acc, time, m.moving ? m.wheel : 0);
      sardor.update(acc, time);
      sardor.instant = false;
      acc = 0;
      renderer.render(scene, camera);
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      sardor.dispose();
      vehicleRef.current?.dispose();
      vehicleRef.current = null;
      renderer.dispose();
      sardorRef.current = null;
    };
  }, []);

  /* ---- Ma'lumotlar ---- */
  function apply(d) {
    setSkew(d.now - Date.now());
    setNow(d.now);
    setSt(d);
  }
  useEffect(() => {
    Promise.all([api('/courier'), api('/foods').catch(() => ({ foods: [] })), api('/clothes').catch(() => null), api('/me/outfit').catch(() => null)])
      .then(([c, f, cl, o]) => {
        setCatalog(f.foods);
        if (cl && o) setLook(dressUp(cl.clothes, o.outfit));
        apply(c);
      })
      .catch((err) => setError(err.message));
  }, []);

  // so'rov: /api/courier + path. Javobda doim yangi holat keladi
  async function act(path, body) {
    setBusy(true);
    try {
      const d = await api('/courier' + path, { method: 'POST', body: JSON.stringify(body || {}) });
      apply(d);
      if (d.result) setResult(d.result);
      if (d.claimed) say(`+${d.claimed} tanga olindi`);
      return d;
    } catch (err) {
      say(err.message, true);
      return null;
    } finally {
      setBusy(false);
    }
  }
  function say(text, bad) {
    setToast({ text, bad, at: Date.now() });
    setTimeout(() => setToast((t) => (t && Date.now() - t.at >= 2900 ? null : t)), 3000);
  }

  const a = st?.active;
  // taymerlar: buyurtma yoki dispetcher bor paytda soat yuradi
  useEffect(() => {
    if (!a && !st?.dispatcher) return;
    const id = setInterval(() => setNow(Date.now() + skew), 250);
    return () => clearInterval(id);
  }, [a, st?.dispatcher, skew]);

  // yo'l vaqti tugaganda: do'konga yetib keldi / mijozga yetkazdi (server tekshiradi)
  useEffect(() => {
    if (!a || busy || Date.now() - triedRef.current < 1000) return;
    if (a.phase === 'shop' && now >= a.acceptedAt + a.toShop * 1000) {
      triedRef.current = Date.now();
      act(`/orders/${a.id}/arrive`);
    } else if (a.phase === 'deliver' && now >= a.pickedAt + a.toCustomer * 1000) {
      triedRef.current = Date.now();
      act(`/orders/${a.id}/deliver`);
    }
  }, [now, a, busy]);

  /* ---- Sahna holati ---- */
  const hired = Boolean(st?.hired);
  const kind = hired ? (a?.vehicle || st.profile.vehicle) : 'foot';
  const traveling = Boolean(a && (a.phase === 'shop' || a.phase === 'deliver'));
  const [returning, setReturning] = useState(false); // smena tugadi: Sardor kuryer xizmatiga qaytyapti
  // Sardor qayerda: buyurtmadan keyin mijoz uyida qoladi, smena tugaganda kuryer xizmatiga qaytadi
  const here = returning ? 'road' : hired && st.profile.location === 'house' ? 'house' : 'depot';
  const scene = result ? 'house' : a?.phase === 'pick' ? 'shop' : traveling ? 'road' : here;
  // yo'l qayerdan boshlandi (o'sha joy chapga siljib ketadi)
  const from = returning ? 'house' : a?.phase === 'deliver' ? 'shop' : hired ? st.profile.location : 'depot';
  const moving = traveling || Boolean(returning);
  const progress = !a ? 0 : a.phase === 'shop' ? (now - a.acceptedAt) / (a.toShop * 1000)
    : a.phase === 'deliver' ? (now - a.pickedAt) / (a.toCustomer * 1000) : 0;

  // transport almashsa — yangi model
  useEffect(() => {
    const scene3 = sceneRef.current;
    if (!scene3 || !st) return;
    vehicleRef.current?.dispose();
    if (vehicleRef.current) scene3.remove(vehicleRef.current.root);
    vehicleRef.current = kind === 'foot' ? null : new Vehicle(kind);
    if (vehicleRef.current) scene3.add(vehicleRef.current.root);
  }, [kind, Boolean(st)]);

  // forma: kuryer bo'lgach to'q sariq forma
  // forma faqat smena paytida (smena tugagach kuryer xizmatida topshiriladi)
  const working = hired && (st.profile.onShift || Boolean(returning));
  useEffect(() => {
    sardorRef.current?.setOutfit(working ? { ...look, ...UNIFORM } : look);
  }, [look, working]);

  // holat: transportda o'tiradi, do'konda/uyda yonida turadi, piyoda yuradi
  useEffect(() => {
    const s = sardorRef.current;
    if (!s || !st) return;
    const sit = working && kind !== 'foot' && scene !== 'shop' && scene !== 'house';
    s.seatY = SEATS[kind] || SEATS.scooter;
    s.seatTarget = sit ? 1 : 0;
    if (firstRef.current) { s.seat = s.seatTarget; s.instant = true; firstRef.current = false; }
    s.walking = (kind === 'foot' && moving) || stop === 'going' || stop === 'back';
    s.setLegs(!(sit && kind === 'car'));
    s.setGear(working, { helmet: working && (kind === 'scooter' || kind === 'moped'), bag: working && kind === 'foot' });
    vehicleRef.current?.setFront(sit);
    motionRef.current = { wheel: MOTION[kind].wheel, moving };
    // bekatga piyoda boradi: transport depoda qoladi
    if (vehicleRef.current) vehicleRef.current.root.visible = !stop;
  }, [st, kind, scene, moving, working, stop]);

  // bekatga borganda chapga qaraydi (canvas markazi Sardordan o'ngroqda, shuning uchun siljitib aks ettiramiz)
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const u = UNIT * Math.max(box.w / 1000, box.h / 600);
    c.style.transform = stop === 'going' ? `translateX(${(VIEW.left + VIEW.right) * -u}px) scaleX(-1)` : '';
  }, [stop, box]);
  useEffect(() => () => clearTimeout(stopTimer.current), []);

  // Avtobus bekati: smena paytida yopiq, aks holda Sardor bekatga yurib boradi va menyu ochiladi
  function goStop() {
    if (stop || returning) return;
    if (hired && st.profile.onShift) return say("Avval smenani yakunlang: telefonda «Smenani yakunlash»", true);
    setStop('going');
    clearTimeout(stopTimer.current);
    stopTimer.current = setTimeout(() => setStop('menu'), STOP_WALK);
  }
  function closeStop() {
    setStop('back');
    clearTimeout(stopTimer.current);
    stopTimer.current = setTimeout(() => setStop(null), STOP_WALK);
  }

  // Smenani yakunlash: uydan bo'lsa Sardor kuryer xizmatiga yo'l oladi
  async function endShift() {
    const wasHouse = st.profile.location === 'house';
    const d = await act('/shift', { on: false });
    if (!d) return;
    setPhone(false);
    if (wasHouse) {
      setReturning(true);
      setTimeout(() => { setReturning(false); say("Smena yakunlandi. Endi uyga borishingiz mumkin"); }, 3500);
    } else say("Smena yakunlandi. Endi uyga borishingiz mumkin");
  }

  async function pickup(picked, mistakes) {
    await act(`/orders/${a.id}/pickup`, { picked, mistakes });
  }

  const tall = box.h > box.w;
  const atStop = stop === 'going' || stop === 'menu';
  const stopDx = atStop ? STOP_X - CENTER : 0;
  const m = MOTION[kind];
  const hasHint = st?.skills?.some((s) => s.slug === 'memory' && s.owned);
  return (
    <div className={`courier scene-${scene} from-${from}` + (moving ? ' moving' : '') + (phone && hired && st.profile.onShift ? ' phone-open' : '')} ref={wrapRef}
      style={{ '--far': `${m.far}s`, '--road': `${m.road}s` }}>
      <svg className="courier-scene" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
        <defs>
          <linearGradient id="cr-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#8fd0ff" />
            <stop offset="1" stopColor="#dff3ff" />
          </linearGradient>
          {/* bekat (ko'cha sahifasidagi BusStop) uchun ranglar */}
          <linearGradient id="st-glass" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#e4f4ff" />
            <stop offset=".5" stopColor="#9fcdf0" />
            <stop offset="1" stopColor="#6fa6d4" />
          </linearGradient>
          <linearGradient id="st-door" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#8e5833" />
            <stop offset="1" stopColor="#5f3a20" />
          </linearGradient>
          <linearGradient id="st-metal" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#c3cbd3" />
            <stop offset="1" stopColor="#7d8791" />
          </linearGradient>
        </defs>
        <rect x={-2000} y={-2000} width={5000} height={2600} fill="url(#cr-sky)" />
        <circle cx={160} cy={110} r={44} fill="#fff1b8" />
        <g className="cr-far">
          {[-1000, 0, 1000, 2000].map((x) => <g key={x} transform={`translate(${x} 0)`}><Skyline /></g>)}
        </g>
        <rect x={-2000} y={GROUND - 64} width={5000} height={40} fill="#7fbf62" />
        <g className="cr-set cr-depot">
          <Depot />
          <g className="cr-stop" onClick={goStop}>
            <g transform={`translate(${STOP_X} ${GROUND - 14}) scale(.75) translate(478 -740)`}><BusStop /></g>
          </g>
        </g>
        <g className="cr-set cr-shop">{a && <Shop name={a.shop} />}</g>
        <g className="cr-set cr-house"><g transform="translate(-60 0)"><House /></g></g>
        <rect x={-2000} y={GROUND - 26} width={5000} height={26} fill="#ddd8cb" />
        <rect x={-2000} y={GROUND} width={5000} height={8} fill="#9a958a" />
        <rect x={-2000} y={GROUND + 8} width={5000} height={400} fill="#4f555d" />
        <g className="cr-road">
          {Array.from({ length: 30 }, (_, i) => <rect key={i} x={-1000 + i * 100} y={GROUND + 50} width={50} height={8} rx={3} fill="#f3efe2" />)}
        </g>
        <ellipse className="cr-shade" style={{ transform: `translateX(${stopDx}px)` }} cx={CENTER + 10} cy={GROUND + 2} rx={stop ? 45 : kind === 'car' ? 120 : 90} ry={7} fill="#000" opacity=".22" />
      </svg>
      <div className="cr-walker" style={{ transform: `translateX(${stopDx * Math.max(box.w / 1000, box.h / 600)}px)` }}>
        <canvas className="sardor courier-sardor" ref={canvasRef} role="img" aria-label="Sardor — kuryer" />
      </div>

      {/* yuqori panel: bekatga, balans, daraja. Kuryer xizmati bitta ekranli joy: boshqa joyga faqat bekat orqali ketiladi */}
      <div className="cr-hud">
        <button className="street-back courier-back" onClick={goStop} aria-disabled={hired && st.profile.onShift}>{hired && st.profile.onShift ? '🔒 Bekatga' : '🚏 Bekatga'}</button>
        {st && (
          <div className="cr-hud-right">
            <span className="cr-pill" key={st.coins} aria-label={`Balans: ${st.coins} tanga`}><span className="cr-coin3d"><Coin size={20} /></span>{st.coins}</span>
            {hired && (
              <span className="cr-pill cr-lv">
                <LevelRing profile={st.profile} size={32} />
                <span><b>{st.profile.rank.name}</b>
                  <i className="cr-xpbar"><i style={{ width: `${st.profile.nextXp ? ((st.profile.xp - st.profile.levelXp) / (st.profile.nextXp - st.profile.levelXp)) * 100 : 100}%` }} /></i>
                </span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* yo'l holati (telefon yopiq bo'lsa ham ko'rinadi) */}
      {traveling && (
        <div className="cr-trip" role="status">
          <span>{a.phase === 'shop' ? `🏪 ${a.shop} ga` : `🏠 ${a.customer} ga`}</span>
          <i className="cr-bar"><i style={{ width: `${Math.min(1, progress) * 100}%` }} /></i>
          <span className={'cr-timer' + (a.acceptedAt / 1000 + a.timeLimit - now / 1000 < 15 ? ' low' : '')}>⏱ {fmt(a.acceptedAt / 1000 + a.timeLimit - now / 1000)}</span>
        </div>
      )}

      {/* ishga kirish / smena kartasi */}
      {st && !returning && !stop && (!hired || !st.profile.onShift) && (
        <div className={'courier-card' + (tall ? ' tall' : '')}>
          {!hired ? (
            <>
              <h2>🛵 Kuryer xizmati</h2>
              <p>Piyoda kuryer bo'lib boshlaysiz. Buyurtmalarni yetkazib XP to'plang: skuter, moped va mashina ochiladi, 8-darajada dispetcher bo'lasiz.</p>
              {st.hadScooter && <p className="cr-note">Skuteringiz saqlangan: Skuter kuryer (2-daraja) bo'lib boshlaysiz.</p>}
              <button onClick={() => act('/hire')} disabled={busy} autoFocus>Ishga kirish</button>
              <button className="cr-to-stop" onClick={goStop}>🚏 Avtobus bekatiga</button>
            </>
          ) : (
            <>
              <div className="cr-card-lv"><LevelRing profile={st.profile} size={48} /><div><h2>{st.profile.rank.name}</h2><p>{st.profile.xp} XP · {st.profile.ordersDone} ta buyurtma</p></div></div>
              <p>Smena boshlansa, telefoningizda Kuryer ilovasi ochiladi va buyurtmalar keladi. Smena paytida uyga borib bo'lmaydi: ishni tugatish uchun ilovada «Smenani yakunlash» ni bosing. Uyga avtobus bekati orqali qaytasiz.</p>
              <button onClick={async () => { if (await act('/shift', { on: true })) setPhone(true); }} disabled={busy} autoFocus>Smenani boshlash</button>
              <button className="cr-to-stop" onClick={goStop}>🚏 Avtobus bekatiga</button>
            </>
          )}
        </div>
      )}
      {error && <div className="courier-card"><p className="error">{error}</p></div>}

      {/* telefon: Kuryer ilovasi faqat smenada */}
      {hired && st.profile.onShift && (
        <>
          <button className={'cr-phone-btn' + (phone ? ' on' : '')} onClick={() => setPhone((v) => !v)} aria-pressed={phone} aria-label="Telefon">
            📱{a && !phone && <i className="cr-dot" />}
          </button>
          {phone && (
            <div className="cr-phone" role="dialog" aria-label="Telefon: Kuryer ilovasi">
              <div className="cr-phone-notch" />
              <CourierApp st={st} foods={foods} now={now} act={act} busy={busy} coins={st.coins} onEndShift={endShift} />
            </div>
          )}
        </>
      )}

      {a?.phase === 'pick' && catalog.length > 0 && (
        <ShopGame order={a} foods={foods} catalog={catalog} now={now} hint={hasHint} busy={busy} onDone={pickup} />
      )}

      {result && (
        <div className="cr-result-overlay">
          <div className="cr-result" role="dialog" aria-modal="true" aria-labelledby="cr-res-title">
            <h2 id="cr-res-title">{result.late ? 'Kechikib yetkazildi' : 'Buyurtma yetkazildi!'}</h2>
            <div className="cr-stars" aria-label={`${result.stars} yulduz`}>
              {[1, 2, 3, 4, 5].map((i) => <span key={i} className={i <= result.stars ? 'on' : ''} style={{ animationDelay: `${i * 0.12}s` }}>★</span>)}
            </div>
            <div className="cr-gains">
              <div><span className="cr-coin3d"><Coin size={28} /></span><b>+{result.paid}</b><small>{result.tip ? `shu jumladan ${result.tip} choychaqa` : 'tanga'}</small></div>
              <div><span className="cr-xp3d">✨</span><b>+{result.xp}</b><small>kuryer XP</small></div>
            </div>
            {result.levelUp && (
              <div className="cr-levelup">
                <b>🎉 {result.levelUp.level}-daraja!</b>
                {result.levelUp.rank && <span>Yangi unvon: {result.levelUp.rank.name}</span>}
                {result.levelUp.vehicles.length > 0 && <span>Ochildi: {result.levelUp.vehicles.join(', ')} (Garaj)</span>}
                <span>+1 skill ochkosi{result.levelUp.skills.length > 0 && `: ${result.levelUp.skills.join(', ')}`}</span>
              </div>
            )}
            <button className="cr-btn wide" onClick={() => setResult(null)} autoFocus>Davom etish</button>
          </div>
        </div>
      )}

      {stop === 'menu' && <BusMenu onClose={closeStop} here="courier" />}

      {toast && <div className={'cr-toast' + (toast.bad ? ' bad' : '')} role="status">{toast.text}</div>}
    </div>
  );
}
