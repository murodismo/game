import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from './api.js';
import { FoodIcon } from './Fridge.jsx';
import { kindLabel } from './fridgeSlots.js';

const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
    <rect x="6" y="2" width="12" height="20" rx="3" fill="none" stroke="currentColor" strokeWidth="2" />
    <line x1="10" y1="18" x2="14" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const StreetIcon = () => (
  <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21h18" />
    <path d="M5 21V11l5-4 5 4v10" />
    <path d="M9 21v-5h2v5" />
    <circle cx="18.5" cy="9" r="2.5" />
    <path d="M18.5 11.5V21" />
  </svg>
);

const Coin = () => (
  <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" className="coin">
    <circle cx="8" cy="8" r="7" fill="#f3c623" stroke="#b8860b" strokeWidth="1.5" />
    <circle cx="8" cy="8" r="3.5" fill="none" stroke="#b8860b" strokeWidth="1.2" />
  </svg>
);

// Eats ilovasi belgisi: to'q sariq kvadratda vilka va qoshiq
const EatsIcon = () => (
  <svg viewBox="0 0 48 48" width="52" height="52" aria-hidden="true">
    <rect width="48" height="48" rx="12" fill="#e8743a" />
    <path d="M17 11 v10 q0 4 3 5 v12 M14 11 v8 M20 11 v8" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
    <path d="M31 38 V26 q-4 -2 -4 -8 q0 -7 4 -7 q4 0 4 7 q0 6 -4 8" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Kuryer ilovasi belgisi: to'q sariq kvadratda skuter (faqat kuryer smenasida ko'rinadi)
const CourierIcon = () => (
  <svg viewBox="0 0 48 48" width="52" height="52" aria-hidden="true">
    <rect width="48" height="48" rx="12" fill="#22a39a" />
    <circle cx="15" cy="33" r="5" fill="none" stroke="#fff" strokeWidth="2.6" />
    <circle cx="34" cy="33" r="5" fill="none" stroke="#fff" strokeWidth="2.6" />
    <path d="M15 33 h12 l5 -15 h5 M11 22 h10 v7" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Ofitsiant ilovasi belgisi: qizil kvadratda qopqoqli taom (faqat ofitsiant smenasida ko'rinadi)
const WaiterIcon = () => (
  <svg viewBox="0 0 48 48" width="52" height="52" aria-hidden="true">
    <rect width="48" height="48" rx="12" fill="#c0262d" />
    <path d="M11 32 q0 -14 13 -14 q13 0 13 14 z" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinejoin="round" />
    <path d="M8 35 h32 M24 18 v-3" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
  </svg>
);

// Eats: ovqat va ichimlik do'koni. Sotib olingan narsa muzlatgichdan tashqarida turadi,
// 1 soat ichida muzlatgichga solinmasa aynib qoladi.
function EatsApp({ shop, onBack }) {
  const [msg, setMsg] = useState(null); // { text, error }
  const [busy, setBusy] = useState(null);
  const groups = [
    ['Katta ovqatlar', (f) => f.kind === 'big'],
    ['Kichik ovqatlar', (f) => f.kind === 'small'],
    ['Ichimliklar', (f) => f.kind === 'drink'],
  ];
  async function buy(f) {
    setBusy(f.id);
    try {
      await shop.onBuy(f.id);
      setMsg({ text: `${f.name} sotib olindi. 1 soat ichida muzlatgichga soling!` });
    } catch (err) {
      setMsg({ text: err.message, error: true });
    } finally {
      setBusy(null);
    }
  }
  return (
    <div className="eats">
      <div className="eats-head">
        <button className="eats-back" onClick={onBack} aria-label="Orqaga">‹</button>
        <b>Eats</b>
        <span className="eats-coins" aria-label={`${shop.coins} tanga`}><Coin />{shop.coins}</span>
      </div>
      {msg && <p className={'eats-msg' + (msg.error ? ' error' : '')} aria-live="polite">{msg.text}</p>}
      <div className="eats-list">
        {groups.map(([title, test]) => (
          <section key={title}>
            <h3>{title}</h3>
            {shop.foods.filter((f) => f.price != null && test(f)).map((f) => (
              <div key={f.id} className="eats-item">
                <FoodIcon food={f} />
                <span className="eats-name">{f.name}<small>{kindLabel(f)}</small></span>
                <button onClick={() => buy(f)} disabled={busy != null || shop.coins < f.price} aria-label={`${f.name}: ${f.price} tangaga sotib olish`}>
                  <Coin />{f.price}
                </button>
              </div>
            ))}
          </section>
        ))}
        {!shop.foods.length && <p className="phone-empty">Do'kon yuklanmadi. Serverni qayta ishga tushiring.</p>}
      </div>
      {shop.outside > 0 && <p className="eats-foot">Muzlatgichga solinmagan: {shop.outside} ta</p>}
    </div>
  );
}

// Telefon oynasi: o'ng tomondan chiqadi. Bosh ekranda ilovalar (hozircha Eats)
function PhonePanel({ onClose, shop }) {
  const navigate = useNavigate();
  const [app, setApp] = useState(null);
  const [courier, setCourier] = useState(false); // kuryer smenasidami (Kuryer ilovasi faqat shunda ko'rinadi)
  const [waiter, setWaiter] = useState(false); // ofitsiant smenasidami (Ofitsiant ilovasi faqat shunda ko'rinadi)
  const ref = useRef(null);
  useEffect(() => {
    api('/courier').then((d) => setCourier(Boolean(d.profile?.onShift))).catch(() => {});
    api('/waiter').then((d) => setWaiter(Boolean(d.profile?.onShift))).catch(() => {});
  }, []);
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    const onDown = (e) => { if (!ref.current.contains(e.target) && !e.target.closest('.bottom-menu')) onClose(); };
    window.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [onClose]);
  const time = new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
  return (
    <div className="phone" ref={ref} role="dialog" aria-label="Telefon">
      <div className="phone-screen">
        <div className="phone-status"><span>{time}</span><button className="phone-close" onClick={onClose} aria-label="Yopish">×</button></div>
        {app === 'eats' ? (
          <EatsApp shop={shop} onBack={() => setApp(null)} />
        ) : (
          <div className="phone-apps">
            <button className="phone-app" onClick={() => setApp('eats')}><EatsIcon /><span>Eats</span></button>
            {courier && <button className="phone-app" onClick={() => navigate('/work/courier')}><CourierIcon /><span>Kuryer</span></button>}
            {waiter && <button className="phone-app" onClick={() => navigate('/work/waiter')}><WaiterIcon /><span>Ofitsiant</span></button>}
          </div>
        )}
        <div className="phone-home" />
      </div>
    </div>
  );
}

// Pastki menyu: hozircha Telefon va Ko'cha. shop — Eats ilovasi uchun: { foods, coins, outside, onBuy }
const NO_SHOP = { foods: [], coins: 0, outside: 0, onBuy: async () => {} };

export default function BottomMenu({ onStreet, shop = NO_SHOP }) {
  const navigate = useNavigate();
  const [phone, setPhone] = useState(false);
  return (
    <>
      {phone && <PhonePanel onClose={() => setPhone(false)} shop={shop} />}
      <nav className="bottom-menu" aria-label="Menyu">
        <button onClick={() => (onStreet ? onStreet() : navigate('/street'))}>
          <StreetIcon /><span>Ko'cha</span>
        </button>
        <button className={phone ? 'on' : ''} onClick={() => setPhone((v) => !v)} aria-pressed={phone}>
          <PhoneIcon /><span>Telefon</span>
        </button>
      </nav>
    </>
  );
}
