import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { api } from './api.js';
import { SARDOR, dressUp } from './sardor.js';
import { WaiterPuppet, UNIFORM } from './waiter.js';
import { Coin, LevelRing, fmt, roomyScreen } from './CourierApp.jsx';
import WaiterApp from './WaiterApp.jsx';
import KitchenGame, { TakeOrder } from './KitchenGame.jsx';
import './courier.css';
import './waiter.css';

// Restoran sahnasi (SVG viewBox 0 0 1000 600): pol sathi y=GROUND. Chapda oshxona, o'ngda zal (4 ta stol)
const GROUND = 505;
const UNIT = 50; // 1 dunyo birligi necha SVG birligi (Sardor bo'yi ~185)
const VIEW = { left: -2.0, right: 2.0, top: 3.95, bottom: -0.05 }; // Sardor atrofidagi kadr (dunyo birliklarida)
const FPS = 30;
const TABLE_X = [470, 610, 750, 890];
// Sardor qayerda turadi (SVG x)
const SPOT = { door: 350, kitchen: 255, table: (n) => TABLE_X[n - 1] - 72 };

// Oshxona: tarqatish oynasi, peshtaxta va oshpaz
function Kitchen() {
  return (
    <g>
      <rect x={0} y={GROUND - 330} width={300} height={330} fill="#e9dcc8" />
      {Array.from({ length: 6 }, (_, i) => Array.from({ length: 7 }, (_, j) => (
        <rect key={`${i}-${j}`} x={j * 44 + (i % 2) * 22 - 10} y={GROUND - 330 + i * 30} width={42} height={28} fill="#f4ede2" />
      )))}
      <rect x={20} y={GROUND - 318} width={260} height={40} rx={8} fill="#2b2f36" />
      <text x={150} y={GROUND - 291} textAnchor="middle" fontSize={22} fontWeight="700" fill="#ffd27a" fontFamily="system-ui, sans-serif">OSHXONA</text>
      {/* oshpaz */}
      <g transform={`translate(110 ${GROUND - 175})`}>
        <path d="M-26 -62 q-14 -30 10 -34 q6 -18 26 -10 q20 -8 24 10 q24 4 8 34 z" fill="#fff" stroke="#c9ced6" strokeWidth={3} />
        <rect x={-24} y={-64} width={48} height={12} fill="#fff" stroke="#c9ced6" strokeWidth={3} />
        <circle cx={0} cy={-32} r={22} fill="#e9b996" />
        <circle cx={-8} cy={-34} r={2.6} fill="#2a2522" /><circle cx={8} cy={-34} r={2.6} fill="#2a2522" />
        <path d="M-9 -24 q9 7 18 0" fill="none" stroke="#7a4b2c" strokeWidth={2.5} strokeLinecap="round" />
        <path d="M-12 -18 q12 6 24 0" fill="none" stroke="#3a2a20" strokeWidth={4} strokeLinecap="round" />
        <path d="M-34 -8 q34 -12 68 0 v60 h-68 z" fill="#fff" stroke="#c9ced6" strokeWidth={3} />
      </g>
      {/* peshtaxta */}
      <rect x={10} y={GROUND - 120} width={290} height={14} rx={4} fill="#c9ced6" />
      <rect x={18} y={GROUND - 106} width={274} height={106} fill="#9aa3ad" />
      {[0, 1, 2].map((i) => <rect key={i} x={30 + i * 90} y={GROUND - 92} width={76} height={80} rx={4} fill="#b6bec8" stroke="#87909a" strokeWidth={3} />)}
      {/* peshtaxtadagi tayyor taomlar */}
      {[60, 150, 240].map((x, i) => (
        <g key={x}>
          <ellipse cx={x} cy={GROUND - 122} rx={30} ry={7} fill="#fff" stroke="#c9ced6" strokeWidth={2} />
          <path d={`M${x - 20} ${GROUND - 124} q20 -${18 + i * 4} 40 0`} fill={['#e0a040', '#c8553d', '#7fbf62'][i]} />
        </g>
      ))}
      <rect x={300} y={GROUND - 330} width={10} height={330} fill="#b89b78" />
    </g>
  );
}

// Zaldagi stol: mehmon (bo'lsa), stol raqami, ochiq/yopiq
function Table({ n, x, open, guest, served, eating, pick, onPick }) {
  return (
    <g className={'wt-table' + (open ? '' : ' closed') + (pick ? ' pick' : '')} role={pick ? 'button' : undefined}
      tabIndex={pick ? 0 : undefined} aria-label={pick ? `${n}-stol` : undefined}
      onClick={pick ? () => onPick(n) : undefined} onKeyDown={pick ? (e) => (e.key === 'Enter' || e.key === ' ') && onPick(n) : undefined}>
      {/* stul (orqada) */}
      <rect x={x + 22} y={GROUND - 150} width={12} height={150} rx={4} fill="#7a4b2c" />
      <rect x={x + 10} y={GROUND - 72} width={52} height={10} rx={3} fill="#8c5a36" />
      {guest && (
        <g className="wt-guest">
          <path d={`M${x + 6} ${GROUND - 70} q0 -52 30 -52 q30 0 30 52 z`} fill={guest.shirt} />
          <circle cx={x + 36} cy={GROUND - 142} r={20} fill={guest.skin} />
          <path d={`M${x + 16} ${GROUND - 148} q20 -24 40 0 q-4 -8 -20 -10 q-16 2 -20 10`} fill={guest.hair} />
          <circle cx={x + 30} cy={GROUND - 143} r={2.4} fill="#2a2522" /><circle cx={x + 42} cy={GROUND - 143} r={2.4} fill="#2a2522" />
          <path d={`M${x + 30} ${GROUND - 133} q6 4 12 0`} fill="none" stroke="#7a4b2c" strokeWidth={2} strokeLinecap="round" />
        </g>
      )}
      {/* stol */}
      <ellipse cx={x} cy={GROUND - 92} rx={62} ry={12} fill={open ? '#fff' : '#e6e1d8'} stroke="#d6cfc2" strokeWidth={2} />
      <path d={`M${x - 62} ${GROUND - 92} v14 q62 16 124 0 v-14`} fill={open ? '#f3efe7' : '#ddd6ca'} />
      <path d={`M${x - 58} ${GROUND - 80} q58 14 116 0 l-6 16 q-52 10 -104 0 z`} fill="#c0262d" opacity={open ? 0.9 : 0.35} />
      <rect x={x - 5} y={GROUND - 78} width={10} height={70} fill="#6b4329" />
      <ellipse cx={x} cy={GROUND - 6} rx={30} ry={6} fill="#6b4329" />
      {served && (
        <g>
          <ellipse cx={x - 14} cy={GROUND - 97} rx={20} ry={5} fill="#fff" stroke="#c9ced6" strokeWidth={2} />
          <path d={`M${x - 30} ${GROUND - 99} q16 -16 32 0`} fill="#e0a040" />
        </g>
      )}
      {/* mehmon ovqat yeyapti: qoshiq likopchadan og'izga borib keladi */}
      {eating && (
        <g transform={`translate(${x - 10} ${GROUND - 104})`}>
          <g className="wt-spoon">
            <circle r={6} fill={guest?.skin || '#e9b996'} />
            <path d="M-2 -2 l-12 -6" stroke="#9aa3ad" strokeWidth={3} strokeLinecap="round" />
            <ellipse cx={-15} cy={-8} rx={5} ry={3} fill="#c9ced6" />
          </g>
        </g>
      )}
      {/* stol raqami */}
      <g transform={`translate(${x - 18} ${GROUND - 128})`}>
        <rect width={26} height={26} rx={6} fill={open ? '#2b2f36' : '#9aa3ad'} />
        <text x={13} y={19} textAnchor="middle" fontSize={17} fontWeight="800" fill="#fff" fontFamily="system-ui, sans-serif">{n}</text>
      </g>
      {!open && <text x={x} y={GROUND - 30} textAnchor="middle" fontSize={13} fontWeight="700" fill="#6b7780" fontFamily="system-ui, sans-serif">🔒 yopiq</text>}
      {pick && <ellipse className="wt-ring" cx={x} cy={GROUND - 4} rx={80} ry={12} />}
    </g>
  );
}

// mehmon ko'rinishi ismiga qarab doim bir xil
const SHIRTS = ['#d9473f', '#4f86c6', '#2b8a3e', '#9c5bd1', '#f08a24', '#22a39a'];
const HAIRS = ['#2b2522', '#5a3a22', '#120e0d', '#7a5236'];
function guestLook(name) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return { shirt: SHIRTS[h % SHIRTS.length], hair: HAIRS[(h >> 3) % HAIRS.length], skin: ['#f4cdb3', '#e9b996', '#d9a37f'][(h >> 5) % 3] };
}

// Restoran ichkarisi. onExit — Sardor restorandan tashqariga chiqadi (WaiterLocation)
export default function WaiterPage({ onExit }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const sardorRef = useRef(null);
  const timers = useRef([]);
  const [box, setBox] = useState({ w: 1, h: 1 });
  const [st, setSt] = useState(null); // serverdagi ofitsiant holati
  const [skew, setSkew] = useState(0); // server vaqti - mahalliy vaqt
  const [now, setNow] = useState(Date.now());
  const [look, setLook] = useState(SARDOR);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const [result, setResult] = useState(null); // stolga yetkazish natijasi
  const [phone, setPhone] = useState(roomyScreen());
  const [error, setError] = useState('');
  const [target, setTarget] = useState(null); // serve paytida Sardor qaysi stolga ketyapti
  const [tried, setTried] = useState(null); // shu stolga allaqachon olib borildi (noto'g'ri bo'lib chiqdi)
  const [walk, setWalk] = useState({ x: SPOT.door, moving: false, left: false, dur: 0 });
  const [kitchenReady, setKitchenReady] = useState(false); // Sardor oshxonaga yetib keldi
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  /* ---- Three.js: Sardor ---- */
  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(VIEW.left, VIEW.right, VIEW.top, VIEW.bottom, -10, 10);
    const sardor = new WaiterPuppet(SARDOR);
    scene.add(sardor.root);
    sardorRef.current = sardor;

    function resize() {
      const w = wrap.clientWidth, h = wrap.clientHeight;
      setBox({ w, h });
      const k = Math.max(w / 1000, h / 600);
      renderer.setSize((VIEW.right - VIEW.left) * UNIT * k, (VIEW.top - VIEW.bottom) * UNIT * k, false);
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
      sardorRef.current = null;
    };
  }, []);

  /* ---- Ma'lumotlar ---- */
  function apply(d) {
    setSkew(d.now - Date.now());
    setNow(d.now);
    setSt(d);
  }
  const reload = () => api('/waiter').then(apply).catch(() => {});
  useEffect(() => {
    Promise.all([api('/waiter'), api('/clothes').catch(() => null), api('/me/outfit').catch(() => null)])
      .then(([w, cl, o]) => {
        if (cl && o) setLook(dressUp(cl.clothes, o.outfit));
        apply(w);
      })
      .catch((err) => setError(err.message));
  }, []);

  // so'rov: /api/waiter + path. Javobda doim yangi holat keladi
  async function act(path, body) {
    setBusy(true);
    try {
      const d = await api('/waiter' + path, { method: 'POST', body: JSON.stringify(body || {}) });
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
    timers.current.push(setTimeout(() => setToast((t) => (t && Date.now() - t.at >= 2900 ? null : t)), 3000));
  }

  const a = st?.active;
  const hired = Boolean(st?.hired);
  const onShift = hired && st.profile.onShift;
  // taymer: buyurtma yoki kutayotgan mehmonlar bor paytda soat yuradi
  useEffect(() => {
    if (!onShift) return;
    const id = setInterval(() => setNow(Date.now() + skew), 250);
    return () => clearInterval(id);
  }, [onShift, skew]);

  // yangi mehmon kelish vaqti bo'lganda holat qayta olinadi (mehmon ketgach 10–15 soniyada keladi)
  const nextGuestAt = st?.nextGuestAt;
  const guestPollRef = useRef(0);
  useEffect(() => {
    if (!onShift || !nextGuestAt || now < nextGuestAt || busy || Date.now() - guestPollRef.current < 1000) return;
    guestPollRef.current = Date.now();
    reload();
  }, [now, nextGuestAt, onShift, busy]);

  // tor ekranda telefon zalni yopib qo'ymasin: mehmon gapirganda va patnis tayyor bo'lganda telefon yopiladi
  useEffect(() => {
    if ((a?.phase === 'take' || a?.phase === 'serve') && !roomyScreen()) setPhone(false);
  }, [a?.phase]);

  /* ---- Sardor qayerda ---- */
  const spotX = !a ? (result ? SPOT.table(result.table) : SPOT.door)
    : a.phase === 'take' ? SPOT.table(a.table)
    : a.phase === 'kitchen' ? SPOT.kitchen
    : target ? SPOT.table(target) : SPOT.kitchen;
  // patnis tayyor bo'lmasa stol tanlovi tozalanadi
  useEffect(() => { if (a?.phase !== 'serve') { setTarget(null); setTried(null); } }, [a?.phase, a?.id]);
  const [lastX, setLastX] = useState(null);
  useEffect(() => {
    if (lastX === spotX) return;
    const from = lastX ?? spotX;
    setLastX(spotX);
    const dist = Math.abs(spotX - from);
    if (!dist) { setWalk({ x: spotX, moving: false, left: false, dur: 0 }); return; }
    const dur = Math.min(1.6, 0.4 + dist / 450);
    setWalk({ x: spotX, moving: true, left: spotX < from, dur });
    timers.current.push(setTimeout(() => setWalk((w) => (w.x === spotX ? { ...w, moving: false } : w)), dur * 1000));
  }, [spotX]);

  // oshxona o'yini Sardor oshxonaga yetib kelgach ochiladi
  useEffect(() => {
    if (a?.phase !== 'kitchen') { setKitchenReady(false); return; }
    if (!walk.moving && walk.x === SPOT.kitchen) setKitchenReady(true);
  }, [a?.phase, walk.moving, walk.x]);

  // serve: kerakli stolga yetib kelganda serverga yuboriladi
  useEffect(() => {
    if (!a || a.phase !== 'serve' || !target || target === tried || walk.moving || walk.x !== SPOT.table(target)) return;
    setTried(target);
    act(`/orders/${a.id}/serve`, { table: target }).then((d) => { if (!d) reload(); });
  }, [a?.phase, target, tried, walk.moving, walk.x]);

  // forma faqat smena paytida, patnis — taomni olib ketayotganda
  useEffect(() => {
    sardorRef.current?.setOutfit(onShift ? { ...look, ...UNIFORM } : look);
    sardorRef.current?.setGear(onShift);
  }, [look, onShift]);
  useEffect(() => {
    const s = sardorRef.current;
    if (!s) return;
    s.walking = walk.moving;
    s.carrying = a?.phase === 'serve';
  }, [walk.moving, a?.phase]);

  async function endShift() {
    const d = await act('/shift', { on: false });
    if (!d) return;
    setPhone(false);
    setResult(null);
    say('Smena yakunlandi. Forma topshirildi — endi uyga borishingiz mumkin');
    // ish tugagach Sardor doim tashqariga chiqadi
    timers.current.push(setTimeout(onExit, 1800));
  }

  function leave() {
    if (onShift) return say("Avval smenani yakunlang: telefonda «Smenani yakunlash»", true);
    onExit();
  }

  // zaldagi stolni bosish: mehmonga xizmat qilish (taklif) yoki patnisni olib borish (serve)
  function onTable(n) {
    if (!a) {
      const o = st.offers.find((x) => x.table === n);
      if (o) act(`/orders/${o.id}/accept`);
      return;
    }
    if (a.phase !== 'serve' || busy || walk.moving) return;
    if (n === tried) return say(`${n}-stol bu taomni buyurtma qilmagan`, true);
    setTarget(n);
  }

  /* ---- Kamera: tor ekranda sahna Sardorga ergashadi ---- */
  const k = Math.max(box.w / 1000, box.h / 600);
  const worldW = 1000 * k;
  const tables = st?.profile?.tables || 1;
  const serving = a?.phase === 'serve' && !walk.moving && (!target || target === tried);
  // stol tanlash paytida kamera zalga qaraydi
  const focus = worldW <= box.w ? 500 : serving ? (TABLE_X[0] + TABLE_X[tables - 1]) / 2 : walk.x;
  const offset = Math.min(0, Math.max(box.w - worldW, box.w / 2 - focus * k));
  const guests = Object.fromEntries((st?.offers || []).map((o) => [o.table, o]));
  if (a) guests[a.table] = a;
  const left = a ? a.acceptedAt / 1000 + a.timeLimit - now / 1000 : 0;

  return (
    <div className={'courier waiter' + (phone && onShift ? ' phone-open' : '')} ref={wrapRef}>
      <div className="wt-world" style={{ width: worldW, height: 600 * k, transform: `translateX(${offset}px)`, transitionDuration: `${walk.dur || 0.6}s` }}>
        <svg className="courier-scene" viewBox="0 0 1000 600">
          <rect x={0} y={0} width={1000} height={600} fill="#f6e6cf" />
          {/* devor: bezak chizig'i, derazalar, chiroqlar */}
          <rect x={300} y={GROUND - 170} width={700} height={170} fill="#c9a27e" />
          <rect x={300} y={GROUND - 176} width={700} height={8} fill="#8c5a36" />
          {[430, 640, 850].map((x) => (
            <g key={x}>
              <rect x={x - 60} y={GROUND - 390} width={120} height={160} rx={60} fill="#9fd3f5" stroke="#fff" strokeWidth={8} />
              <rect x={x - 3} y={GROUND - 388} width={6} height={156} fill="#fff" />
              <line x1={x} y1={0} x2={x} y2={GROUND - 440} stroke="#5a4636" strokeWidth={3} />
              <path d={`M${x - 26} ${GROUND - 420} q26 -30 52 0 z`} fill="#f3c74f" />
              <ellipse cx={x} cy={GROUND - 412} rx={30} ry={10} fill="#fff1b8" opacity=".6" />
            </g>
          ))}
          <rect x={360} y={GROUND - 460} width={280} height={44} rx={10} fill="#c0262d" />
          <text x={500} y={GROUND - 430} textAnchor="middle" fontSize={24} fontWeight="800" fill="#fff" fontFamily="system-ui, sans-serif">«LAZZAT» RESTORANI</text>
          <Kitchen />
          {/* pol */}
          <rect x={0} y={GROUND} width={1000} height={100} fill="#8c5a36" />
          {Array.from({ length: 11 }, (_, i) => <rect key={i} x={i * 100 - 20} y={GROUND} width={4} height={100} fill="#6b4329" />)}
          <rect x={0} y={GROUND} width={1000} height={6} fill="#6b4329" />
          {TABLE_X.map((x, i) => {
            const n = i + 1;
            const g = guests[n];
            // taom keltirilgan mehmon 3–5 soniya stolda o'tirib ovqat yeydi, keyin ketadi
            const eater = !g && (st?.eating || []).find((e) => e.table === n && e.eatUntil > now);
            return (
              <Table key={n} n={n} x={x} open={n <= tables} guest={g ? guestLook(g.guest) : eater ? guestLook(eater.guest) : null}
                served={Boolean(eater)} eating={Boolean(eater)} pick={onShift && n <= tables && (serving || (!a && Boolean(g)))} onPick={onTable} />
            );
          })}
          {/* kutayotgan mehmonlar ustida belgi; xizmat qilinayotgan stol belgisi oshxonaga ketgach yo'qoladi */}
          {/* belgi joyi translate bilan, tebranish esa ichki guruhda (CSS animatsiya SVG transform ni bosib ketmasin) */}
          {onShift && Object.values(guests).map((g) => (g.status === 'offer' || (g.status === 'active' && g.phase === 'take')) && (
            <g key={g.id} transform={`translate(${TABLE_X[g.table - 1] + 36} ${GROUND - 190})`}>
              <g className="wt-wave">
                <circle r={17} fill="#fff" stroke="#e0d6c6" strokeWidth={2} />
                <text y={6} textAnchor="middle" fontSize={18}>{g.status === 'offer' ? '🙋' : '💬'}</text>
              </g>
            </g>
          ))}
          {onShift && (st?.eating || []).filter((e) => e.eatUntil > now && !guests[e.table]).map((e) => (
            <g key={e.id} transform={`translate(${TABLE_X[e.table - 1] + 36} ${GROUND - 190})`}>
              <g className="wt-wave">
                <circle r={17} fill="#fff" stroke="#e0d6c6" strokeWidth={2} />
                <text y={6} textAnchor="middle" fontSize={18}>😋</text>
              </g>
            </g>
          ))}
        </svg>
        <canvas className={'sardor wt-sardor' + (walk.left ? ' flip' : '')} ref={canvasRef} role="img" aria-label="Sardor — ofitsiant"
          style={{
            left: (walk.x + VIEW.left * UNIT) * k, top: (GROUND - VIEW.top * UNIT) * k,
            width: (VIEW.right - VIEW.left) * UNIT * k, height: (VIEW.top - VIEW.bottom) * UNIT * k,
            transitionDuration: `${walk.dur}s`,
          }} />
      </div>

      {/* yuqori panel: orqaga, balans, daraja */}
      <div className="cr-hud">
        <button className="street-back courier-back" onClick={leave} aria-disabled={onShift}>{onShift ? '🔒 Tashqariga' : 'Tashqariga'}</button>
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

      {/* buyurtma holati (telefon yopiq bo'lsa ham ko'rinadi) */}
      {a && (
        <div className="cr-trip" role="status">
          <span>{a.phase === 'take' ? `💬 ${a.table}-stol buyurtma beryapti` : a.phase === 'kitchen' ? '👨‍🍳 Oshxonada' : serving ? '🍽️ Qaysi stol edi? Stolni bosing' : `🍽️ ${target}-stolga`}</span>
          <span className={'cr-timer' + (left < 10 ? ' low' : '')}>⏱ {fmt(left)}</span>
          {serving && (
            <span className="wt-pick" role="group" aria-label="Stolni tanlang">
              {Array.from({ length: tables }, (_, i) => (
                <button key={i} className={'wt-pick-btn' + (i + 1 === tried ? ' no' : '')} disabled={busy} onClick={() => onTable(i + 1)}>{i + 1}</button>
              ))}
            </span>
          )}
        </div>
      )}

      {/* ishga kirish / smena kartasi */}
      {st && (!hired || !onShift) && (
        <div className="courier-card wt-card">
          {!hired ? (
            <>
              <h2>🍽️ «Lazzat» restorani</h2>
              <p>Yangi ofitsiant bo'lib boshlaysiz: mehmon buyurtmasini eslab qoling, oshxonadan to'g'ri taomlarni yig'ing va to'g'ri stolga olib boring. Tez va xatosiz ishlasangiz — ko'proq choychaqa va XP.</p>
              <p className="cr-note">Darajalar: Yangi ofitsiant → Tajribali → Bosh ofitsiant → Administrator → Restoran menejeri</p>
              <button onClick={() => act('/hire')} disabled={busy} autoFocus>Ishga kirish</button>
            </>
          ) : (
            <>
              <div className="cr-card-lv"><LevelRing profile={st.profile} size={48} /><div><h2>{st.profile.rank.name}</h2><p>{st.profile.xp} XP · {st.profile.ordersDone} ta buyurtma</p></div></div>
              <p>Smena boshlansa, telefoningizda Ofitsiant ilovasi ochiladi va zalga mehmonlar keladi. Smena paytida uyga borib bo'lmaydi: ishni tugatish uchun ilovada «Smenani yakunlash» ni bosing.</p>
              <button onClick={async () => { if (await act('/shift', { on: true })) setPhone(roomyScreen()); }} disabled={busy} autoFocus>Smenani boshlash</button>
            </>
          )}
        </div>
      )}
      {error && <div className="courier-card"><p className="error">{error}</p></div>}

      {/* telefon: Ofitsiant ilovasi faqat smenada */}
      {onShift && (
        <>
          <button className={'cr-phone-btn' + (phone ? ' on' : '')} onClick={() => setPhone((v) => !v)} aria-pressed={phone} aria-label="Telefon">
            📱{a && !phone && <i className="cr-dot" />}
          </button>
          {phone && (
            <div className="cr-phone" role="dialog" aria-label="Telefon: Ofitsiant ilovasi">
              <div className="cr-phone-notch" />
              <WaiterApp st={st} now={now} act={act} busy={busy} onEndShift={endShift} />
            </div>
          )}
        </>
      )}

      {a?.phase === 'take' && !walk.moving && (
        <TakeOrder order={a} st={st} now={now} busy={busy} onGo={() => act(`/orders/${a.id}/kitchen`)} />
      )}
      {a?.phase === 'kitchen' && kitchenReady && (
        <KitchenGame order={a} st={st} now={now} busy={busy} act={act} onWrong={reload} />
      )}

      {result && !walk.moving && (
        <div className="cr-result-overlay">
          <div className="cr-result" role="dialog" aria-modal="true" aria-labelledby="wt-res-title">
            <h2 id="wt-res-title">{result.late ? 'Kechikib keltirildi' : 'Yoqimli ishtaha!'}</h2>
            <p className="wt-res-sub">{result.guest} · {result.table}-stol{result.mistakes ? ` · ${result.mistakes} ta xato` : ' · xatosiz'}</p>
            <div className="cr-stars" aria-label={`${result.stars} yulduz`}>
              {[1, 2, 3, 4, 5].map((i) => <span key={i} className={i <= result.stars ? 'on' : ''} style={{ animationDelay: `${i * 0.12}s` }}>★</span>)}
            </div>
            <div className="cr-gains">
              <div><span className="cr-coin3d"><Coin size={28} /></span><b>+{result.paid}</b><small>{result.tip ? `shu jumladan ${result.tip} choychaqa` : 'tanga'}</small></div>
              <div><span className="cr-xp3d">✨</span><b>+{result.xp}</b><small>ofitsiant XP</small></div>
            </div>
            {result.levelUp && (
              <div className="cr-levelup">
                <b>🎉 {result.levelUp.level}-daraja!</b>
                <span>Yangi unvon: {result.levelUp.rank.name}</span>
                <span>{result.levelUp.rank.note}</span>
              </div>
            )}
            <button className="cr-btn wide" onClick={() => setResult(null)} autoFocus>Davom etish</button>
          </div>
        </div>
      )}

      {toast && <div className={'cr-toast' + (toast.bad ? ' bad' : '')} role="status">{toast.text}</div>}
    </div>
  );
}
