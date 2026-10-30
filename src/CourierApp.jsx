import { useState } from 'react';
import { FoodIcon } from './Fridge.jsx';

// Kuryer ilovasi (telefonda, faqat smena paytida): buyurtmalar, garaj, skillar, dispetcher, profil.
// st — serverdagi holat (/api/courier), now — server vaqti (ms), act — so'rov yuborish: act(path, body)

const ORDER = ['foot', 'scooter', 'moped', 'car'];
// ichimliklarda nomi bir xil bo'lishi mumkin (Kola — butilka va banka), shuning uchun turi ham yoziladi
export const foodName = (f) => (f.kind === 'drink' ? `${f.name} (${f.subtype === 'can' ? 'banka' : 'butilka'})` : f.name);
// telefon ilovasi sahnani yopmay ochiq tura oladimi: keng ekran, yotiq telefon emas (bo'yi past)
export const roomyScreen = () => window.innerWidth > 720 && window.innerHeight > 500;
export const fmt = (s) => {
  s = Math.max(0, Math.ceil(s));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

export function Coin({ size = 14 }) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} aria-hidden="true" className="cr-coin">
      <circle cx="8" cy="8" r="7" fill="#f3c623" stroke="#b8860b" strokeWidth="1.5" />
      <circle cx="8" cy="8" r="3.5" fill="none" stroke="#b8860b" strokeWidth="1.2" />
    </svg>
  );
}

// Daraja halqasi: XP qancha to'lganini ko'rsatadi
export function LevelRing({ profile, size = 44 }) {
  const { xp, levelXp, nextXp, level } = profile;
  const k = nextXp ? (xp - levelXp) / (nextXp - levelXp) : 1;
  const r = 18, c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 44 44" width={size} height={size} className="cr-ring" role="img" aria-label={`${level}-daraja`}>
      <circle cx="22" cy="22" r={r} fill="#1d2836" stroke="rgba(255,255,255,.18)" strokeWidth="4" />
      <circle cx="22" cy="22" r={r} fill="none" stroke="#ffb44d" strokeWidth="4" strokeLinecap="round"
        strokeDasharray={`${c * k} ${c}`} transform="rotate(-90 22 22)" />
      <text x="22" y="27" textAnchor="middle" fontSize="15" fontWeight="800" fill="#fff">{level}</text>
    </svg>
  );
}

function Items({ lines, foods, max = 6 }) {
  const shown = lines.slice(0, max);
  return (
    <div className="cr-items">
      {shown.map((l) => foods[l.food] && (
        <span key={l.food} className="cr-item" title={foodName(foods[l.food])}>
          <FoodIcon food={foods[l.food]} />{l.qty > 1 && <b>×{l.qty}</b>}
        </span>
      ))}
      {lines.length > max && <span className="cr-more">+{lines.length - max}</span>}
    </div>
  );
}

/* ---- 3D xarita: qiya tekislik ustida yo'l, binolar va harakatlanuvchi belgi ---- */
// buyurtma id'siga qarab doim bir xil xarita
function seeded(n) {
  let x = n * 9301 + 49297;
  return () => ((x = (x * 9301 + 49297) % 233280) / 233280);
}
const PIN = { foot: '🚶', scooter: '🛵', moped: '🛵', car: '🚗' };
export function TripMap({ order, progress }) {
  const r = seeded(order.id);
  const A = [30, 150], B = [70 + r() * 40, 50 + r() * 50], C = [170 + r() * 30, 40 + r() * 100];
  const leg = order.phase === 'deliver' ? 1 : 0;
  const [p0, p1] = leg ? [B, C] : [A, B];
  const p = Math.min(1, Math.max(0, progress));
  const pos = [p0[0] + (p1[0] - p0[0]) * p, p0[1] + (p1[1] - p0[1]) * p];
  const blocks = Array.from({ length: 9 }, (_, i) => ({ x: 10 + (i % 3) * 75 + r() * 25, y: 15 + Math.floor(i / 3) * 60 + r() * 15, h: 8 + r() * 26 }));
  return (
    <div className="cr-map" aria-hidden="true">
      <div className="cr-map-plane">
        <svg viewBox="0 0 240 190" className="cr-map-svg">
          <rect width="240" height="190" fill="#e8efe3" />
          {[40, 100, 160].map((y) => <rect key={y} x="0" y={y} width="240" height="9" fill="#fff" />)}
          {[60, 130, 200].map((x) => <rect key={x} x={x} y="0" width="9" height="190" fill="#fff" />)}
          <path d={`M${A} L${B} L${C}`} fill="none" stroke="#c7d2dc" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          <path d={`M${p0} L${pos}`} fill="none" stroke="#f08a24" strokeWidth="5" strokeLinecap="round" />
          <circle cx={A[0]} cy={A[1]} r="6" fill="#3e62b8" />
          <circle cx={B[0]} cy={B[1]} r="7" fill="#22a39a" stroke="#fff" strokeWidth="2" />
          <circle cx={C[0]} cy={C[1]} r="7" fill="#d9473f" stroke="#fff" strokeWidth="2" />
        </svg>
        {blocks.map((b, i) => (
          <div key={i} className="cr-block" style={{ left: `${(b.x / 240) * 100}%`, top: `${(b.y / 190) * 100}%`, '--h': `${b.h}px` }}>
            <i /><i /><i />
          </div>
        ))}
        <div className="cr-pin" style={{ left: `${(pos[0] / 240) * 100}%`, top: `${(pos[1] / 190) * 100}%` }}>{PIN[order.vehicle] || '🛵'}</div>
      </div>
      <div className="cr-map-legend"><span className="d at-shop" />Do'kon <span className="d at-home" />Mijoz</div>
    </div>
  );
}

/* ---- Buyurtmalar ---- */
function ActiveOrder({ o, foods, now, act, busy }) {
  const left = o.acceptedAt / 1000 + o.timeLimit - now / 1000;
  const steps = [['shop', "Do'konga"], ['pick', 'Terish'], ['deliver', 'Mijozga']];
  const si = steps.findIndex((s) => s[0] === o.phase);
  const travel = o.phase === 'shop' ? (now - o.acceptedAt) / (o.toShop * 1000) : o.phase === 'deliver' ? (now - o.pickedAt) / (o.toCustomer * 1000) : 0;
  return (
    <div className="cr-active">
      <div className="cr-active-head">
        <div><b>{o.shop}</b><small>→ {o.customer}, {o.address}</small></div>
        <span className={'cr-timer' + (left < 15 ? ' low' : '')}>⏱ {fmt(left)}</span>
      </div>
      <ol className="cr-steps">
        {steps.map(([k, label], i) => <li key={k} className={i < si ? 'done' : i === si ? 'now' : ''}>{label}</li>)}
      </ol>
      {o.phase !== 'pick' && <TripMap order={o} progress={travel} />}
      {o.phase === 'pick' && <p className="cr-hint">Do'kondasiz: ro'yxatdagi mahsulotlarni javondan toping.</p>}
      <h4>Buyurtma ({o.items} ta mahsulot)</h4>
      <ul className="cr-lines">
        {o.lines.map((l) => foods[l.food] && (
          <li key={l.food}><FoodIcon food={foods[l.food]} /><span>{foodName(foods[l.food])}</span><b>×{l.qty}</b></li>
        ))}
      </ul>
      <div className="cr-pay"><span><Coin /> ~{o.reward}</span><span>✨ {o.xp} XP</span></div>
      <button className="cr-btn ghost" disabled={busy} onClick={() => act(`/orders/${o.id}/cancel`)}>Bekor qilish</button>
    </div>
  );
}

function Offers({ st, foods, act, busy }) {
  const cur = ORDER.indexOf(st.profile.vehicle);
  const vName = (slug) => st.vehicles.find((v) => v.slug === slug);
  const dispatch = st.dispatcher;
  const freeSlots = dispatch ? dispatch.slots - dispatch.orders.length : 0;
  return (
    <>
      <div className="cr-row">
        <h3>Yangi buyurtmalar</h3>
        <button className="cr-icon-btn" disabled={busy} onClick={() => act('/offers/refresh')} aria-label="Yangilash">↻</button>
      </div>
      {!st.offers.length && <p className="cr-empty">Buyurtmalar yo'q</p>}
      {st.offers.map((o) => {
        const can = ORDER.indexOf(o.needs) <= cur;
        const v = vName(o.needs);
        return (
          <article key={o.id} className={'cr-offer' + (can ? '' : ' locked') + (o.size === 'big' ? ' big' : '')}>
            <div className="cr-offer-top">
              <div><b>{o.shop}</b><small>→ {o.customer}</small></div>
              <div className="cr-reward"><Coin size={16} />{o.reward}</div>
            </div>
            <div className="cr-meta">
              <span>📍 {o.km} km</span><span>📦 {o.items} ta</span><span>✨ {o.xp} XP</span>
              {o.size === 'big' && <span className="cr-tag">Katta</span>}
            </div>
            <Items lines={o.lines} foods={foods} />
            <div className="cr-offer-btns">
              {can
                ? <button className="cr-btn" disabled={busy || Boolean(st.active)} onClick={() => act(`/orders/${o.id}/accept`)}>Qabul qilish</button>
                : <span className="cr-need">🔒 {v.icon} {v.name} kerak{!v.open && ` (${v.level}-daraja)`}</span>}
              {dispatch && (
                <button className="cr-btn alt" disabled={busy || freeSlots <= 0} onClick={() => act(`/orders/${o.id}/dispatch`)}>Taqsimlash</button>
              )}
            </div>
          </article>
        );
      })}
    </>
  );
}

/* ---- Garaj ---- */
function Garage({ st, act, busy, coins }) {
  const best = { speed: 1 / 3, km: 8, items: 15 };
  return (
    <>
      <h3>Garaj</h3>
      <p className="cr-sub">Daraja oshgani sari yangi transport ochiladi. Ochilganini istalgan payt almashtirish mumkin.</p>
      {st.vehicles.map((v) => {
        const cur = st.profile.vehicle === v.slug;
        return (
          <article key={v.slug} className={'cr-car' + (cur ? ' cur' : '') + (v.open ? '' : ' locked')}>
            <div className="cr-car-icon"><span>{v.icon}</span></div>
            <div className="cr-car-body">
              <b>{v.name}</b>
              <div className="cr-stat"><span>Tezlik</span><i style={{ '--w': `${Math.min(1, 1 / v.secPerKm / best.speed) * 100}%` }} /></div>
              <div className="cr-stat"><span>Masofa</span><i style={{ '--w': `${(v.maxKm / best.km) * 100}%` }} /><em>{v.maxKm} km</em></div>
              <div className="cr-stat"><span>Sig'im</span><i style={{ '--w': `${Math.min(1, v.maxItems / best.items) * 100}%` }} /><em>{v.maxItems} ta</em></div>
              {v.big && <small>Katta buyurtmalarni oladi</small>}
            </div>
            <div className="cr-car-act">
              {cur ? <span className="cr-badge">Tanlangan</span>
                : !v.open ? <span className="cr-lock">🔒 {v.level}-daraja</span>
                : v.owned ? <button className="cr-btn" disabled={busy || Boolean(st.active)} onClick={() => act('/vehicle', { vehicle: v.slug })}>Tanlash</button>
                : <button className="cr-btn" disabled={busy || coins < v.price || Boolean(st.active)} onClick={() => act('/vehicle', { vehicle: v.slug })}><Coin />{v.price}</button>}
            </div>
          </article>
        );
      })}
    </>
  );
}

/* ---- Skillar ---- */
function Skills({ st, act, busy }) {
  const tiers = [...new Set(st.skills.map((s) => s.level))];
  const name = (slug) => st.skills.find((s) => s.slug === slug)?.name;
  return (
    <>
      <div className="cr-row">
        <h3>Skillar</h3>
        <span className={'cr-points' + (st.profile.skillPoints ? ' on' : '')}>Ochko: {st.profile.skillPoints}</span>
      </div>
      <p className="cr-sub">Har yangi daraja 1 ochko beradi. Faqat kuryer XP si bilan ochiladi.</p>
      <div className="cr-tree">
        {tiers.map((lv) => (
          <div key={lv} className={'cr-tier' + (st.profile.level >= lv ? ' open' : '')}>
            <span className="cr-tier-lv">{lv}</span>
            <div className="cr-tier-row">
              {st.skills.filter((s) => s.level === lv).map((s) => (
                <button key={s.slug} className={'cr-skill' + (s.owned ? ' owned' : s.can ? ' can' : '')}
                  disabled={busy || !s.can} onClick={() => act('/skills', { skill: s.slug })}
                  aria-label={`${s.name}: ${s.text}`}>
                  <span className="cr-skill-ic">{s.icon}</span>
                  <b>{s.name}</b>
                  <small>{s.text}</small>
                  {s.need && !s.owned && <small className="cr-skill-need">Avval: {name(s.need)}</small>}
                  {s.owned && <span className="cr-skill-ok">✓</span>}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ---- Dispetcher ---- */
function Dispatch({ st, act, busy, now }) {
  const d = st.dispatcher;
  if (!d) {
    const lv = st.skills.find((s) => s.slug === 'dispatcher').level;
    return (
      <div className="cr-teaser">
        <span>📡</span>
        <h3>Dispetcher</h3>
        <p>{lv}-darajada "Dispetcher" skillini oching: buyurtmalarni boshqa kuryerlarga taqsimlab, ulush va soatlik maosh olasiz.</p>
      </div>
    );
  }
  const ready = d.orders.filter((o) => o.ready).reduce((n, o) => n + o.paid, 0);
  return (
    <>
      <h3>Dispetcher</h3>
      <div className="cr-dsp">
        <div><small>Kuryerlar</small><b>{d.orders.length}/{d.slots}</b></div>
        <div><small>Ulush</small><b>{Math.round(d.share * 100)}%</b></div>
        <div><small>Maosh</small><b>{d.passive}/{d.passiveCap}</b></div>
      </div>
      <button className="cr-btn wide" disabled={busy || !(ready + d.passive)} onClick={() => act('/dispatch/claim')}>
        Daromadni olish: <Coin />{ready + d.passive}
      </button>
      <p className="cr-sub">"Buyurtmalar" bo'limida "Taqsimlash" ni bosing. Maosh soatiga {d.perHour} tangadan yig'iladi.</p>
      {d.orders.map((o) => {
        const k = Math.min(1, (now - o.acceptedAt) / (o.doneAt - o.acceptedAt));
        return (
          <div key={o.id} className="cr-npc">
            <span className="cr-npc-av">{o.npc[0]}</span>
            <div><b>{o.npc}</b><small>{o.shop} → {o.customer}</small>
              <div className="cr-bar"><i style={{ width: `${k * 100}%` }} /></div></div>
            <span className={o.ready ? 'cr-ready' : ''}>{o.ready ? 'Tayyor' : fmt((o.doneAt - now) / 1000)}<br /><Coin />{o.paid}</span>
          </div>
        );
      })}
    </>
  );
}

/* ---- Profil ---- */
function Profile({ st, onEnd }) {
  const p = st.profile;
  return (
    <>
      <div className="cr-prof">
        <LevelRing profile={p} size={64} />
        <div><b>{p.rank.name}</b><small>{p.xp} XP{p.nextXp && ` / ${p.nextXp}`}</small>
          {p.nextRank && <small>Keyingi unvon: {p.nextRank.name} ({p.nextRank.level}-daraja)</small>}</div>
      </div>
      <ol className="cr-ranks">
        {st.ranks.map((r) => (
          <li key={r.slug} className={r.open ? 'open' : ''}>
            <span>{r.open ? '✓' : r.level}</span><div><b>{r.name}</b><small>{r.note}</small></div>
          </li>
        ))}
      </ol>
      <div className="cr-dsp">
        <div><small>Buyurtmalar</small><b>{p.ordersDone}</b></div>
        <div><small>O'rtacha</small><b>{p.avgStars ?? '—'} ★</b></div>
        <div><small>Ishlangan</small><b>{p.earned}</b></div>
      </div>
      <p className="cr-sub">Haq koeffitsienti: ×{p.payMult}</p>
      {st.history.length > 0 && (
        <>
          <h4>Oxirgi buyurtmalar</h4>
          {st.history.map((o) => (
            <div key={o.id} className="cr-hist"><span>{o.customer}</span><span>{'★'.repeat(o.stars)}</span><span><Coin />{o.paid}</span></div>
          ))}
        </>
      )}
      <button className="cr-btn danger wide" onClick={onEnd}>⏻ Smenani yakunlash</button>
    </>
  );
}

const TABS = [['orders', '📋', 'Buyurtma'], ['garage', '🛵', 'Garaj'], ['skills', '🌟', 'Skillar'], ['dispatch', '📡', 'Dispetcher'], ['profile', '👤', 'Profil']];

// Smenani yakunlash: tasdiqlash oynasi. Buyurtma bajarilayotgan paytda yakunlab bo'lmaydi
function EndShift({ st, busy, onYes, onNo }) {
  return (
    <div className="cr-confirm" role="alertdialog" aria-labelledby="cr-end-title">
      <div className="cr-confirm-box">
        <span className="cr-confirm-ic" aria-hidden="true">🏁</span>
        <h3 id="cr-end-title">Smenani yakunlaysizmi?</h3>
        {st.active ? (
          <>
            <p>Sizda bajarilayotgan buyurtma bor. Avval uni yetkazing yoki "Bekor qilish" ni bosing.</p>
            <button className="cr-btn wide" onClick={onNo}>Tushunarli</button>
          </>
        ) : (
          <>
            <p>Sardor kuryer xizmatiga qaytadi va formani topshiradi. Shundan keyin uyga borishingiz mumkin. Ishlab topgan tangalaringiz balansda qoladi.</p>
            <button className="cr-btn danger wide" disabled={busy} onClick={onYes}>Ha, yakunlash</button>
            <button className="cr-btn ghost2 wide" onClick={onNo}>Ishni davom ettirish</button>
          </>
        )}
      </div>
    </div>
  );
}

export default function CourierApp({ st, foods, now, act, busy, coins, onEndShift }) {
  const [tab, setTab] = useState('orders');
  const [ending, setEnding] = useState(false);
  return (
    <div className="cr-app">
      <header className="cr-app-head">
        <LevelRing profile={st.profile} size={36} />
        <div className="cr-app-title"><b>Kuryer</b><small>{st.profile.rank.name}</small></div>
        <span className="cr-wallet"><Coin size={16} />{coins}</span>
      </header>
      <button className="cr-end" onClick={() => setEnding(true)}>⏻ Smenani yakunlash</button>
      {ending && <EndShift st={st} busy={busy} onNo={() => setEnding(false)} onYes={async () => { setEnding(false); await onEndShift(); }} />}
      <div className="cr-app-body">
        {tab === 'orders' && (st.active ? <ActiveOrder o={st.active} foods={foods} now={now} act={act} busy={busy} /> : <Offers st={st} foods={foods} act={act} busy={busy} />)}
        {tab === 'garage' && <Garage st={st} act={act} busy={busy} coins={coins} />}
        {tab === 'skills' && <Skills st={st} act={act} busy={busy} />}
        {tab === 'dispatch' && <Dispatch st={st} act={act} busy={busy} now={now} />}
        {tab === 'profile' && <Profile st={st} onEnd={() => setEnding(true)} />}
      </div>
      <nav className="cr-tabs">
        {TABS.map(([k, ic, label]) => (
          <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)} aria-pressed={tab === k}>
            <span aria-hidden="true">{ic}</span>{label}
            {k === 'skills' && st.profile.skillPoints > 0 && <i className="cr-dot" />}
          </button>
        ))}
      </nav>
    </div>
  );
}
