import { useMemo, useState } from 'react';
import { FoodIcon } from './Fridge.jsx';
import { fmt, foodName } from './CourierApp.jsx';

// Do'kon mini-o'yini: buyurtma ro'yxatidagi mahsulotlarni javondan topib savatga solish.
// Ro'yxatda yo'q mahsulot bosilsa — xato (3 ta xato 1 yulduz kamaytiradi).
// hint — "Yaxshi xotira" skilli: kerakli mahsulotlar yorishib turadi.
const SLOTS = 15;

function shelfFor(order, catalog) {
  // buyurtma id'siga qarab doim bir xil joylashuv
  let x = order.id * 7919 + 13;
  const r = () => ((x = (x * 9301 + 49297) % 233280) / 233280);
  const want = order.lines.map((l) => l.food);
  const others = catalog.filter((f) => f.price != null && !want.includes(f.id)).sort(() => r() - 0.5);
  const list = [...want, ...others.map((f) => f.id)].slice(0, Math.max(SLOTS, want.length));
  return list.sort(() => r() - 0.5);
}

export default function ShopGame({ order, foods, catalog, now, hint, busy, onDone }) {
  const shelf = useMemo(() => shelfFor(order, catalog), [order.id, catalog]);
  const [basket, setBasket] = useState({}); // food -> qty
  const [mistakes, setMistakes] = useState(0);
  const [shake, setShake] = useState(null);
  const [msg, setMsg] = useState('');
  const want = Object.fromEntries(order.lines.map((l) => [l.food, l.qty]));
  const complete = order.lines.every((l) => basket[l.food] === l.qty);
  const left = order.acceptedAt / 1000 + order.timeLimit - now / 1000;

  function take(id) {
    if (!want[id]) {
      setMistakes((m) => m + 1);
      setShake(id);
      setMsg(`${foodName(foods[id])} ro'yxatda yo'q`);
      setTimeout(() => setShake(null), 400);
      return;
    }
    if ((basket[id] || 0) >= want[id]) { setMsg(`${foodName(foods[id])} yetarli`); return; }
    setMsg('');
    setBasket((b) => ({ ...b, [id]: (b[id] || 0) + 1 }));
  }
  function drop(id) {
    setBasket((b) => {
      const n = { ...b, [id]: b[id] - 1 };
      if (!n[id]) delete n[id];
      return n;
    });
  }

  return (
    <div className="shop-overlay" role="dialog" aria-modal="true" aria-labelledby="shop-title">
      <div className="shop">
        <header className="shop-head">
          <h2 id="shop-title">🏪 {order.shop}</h2>
          <span className={'cr-timer' + (left < 15 ? ' low' : '')}>⏱ {fmt(left)}</span>
        </header>
        <div className="shop-main">
          <aside className="shop-list" aria-label="Buyurtma ro'yxati">
            <h3>Ro'yxat</h3>
            <ul>
              {order.lines.map((l) => {
                const got = basket[l.food] || 0;
                return (
                  <li key={l.food} className={got === l.qty ? 'ok' : ''}>
                    <span className="shop-check">{got === l.qty ? '✓' : ''}</span>
                    <span>{foods[l.food] && foodName(foods[l.food])}</span>
                    <b>{got}/{l.qty}</b>
                  </li>
                );
              })}
            </ul>
            <p className="shop-mist">Xatolar: {mistakes}{mistakes >= 3 && ' (−1 ★)'}</p>
          </aside>
          <div className="shop-shelves">
            <div className="shop-rack">
              {shelf.map((id) => foods[id] && (
                <button key={id} className={'shop-prod' + (shake === id ? ' no' : '') + (hint && want[id] && (basket[id] || 0) < want[id] ? ' hint' : '')}
                  onClick={() => take(id)} aria-label={foodName(foods[id])}>
                  <span className="shop-prod-3d"><FoodIcon food={foods[id]} /></span>
                  <small>{foodName(foods[id])}</small>
                </button>
              ))}
            </div>
          </div>
        </div>
        <footer className="shop-foot">
          <div className="shop-basket" aria-label="Savat">
            <span className="shop-basket-ic" aria-hidden="true">🧺</span>
            {Object.entries(basket).map(([id, q]) => (
              <button key={id} className="shop-in" onClick={() => drop(Number(id))} aria-label={`${foodName(foods[id])}ni olib tashlash`}>
                <FoodIcon food={foods[id]} />{q > 1 && <b>×{q}</b>}
              </button>
            ))}
            {!Object.keys(basket).length && <small>Savat bo'sh</small>}
          </div>
          <p className="shop-msg" aria-live="polite">{msg}</p>
          <button className="cr-btn" disabled={!complete || busy}
            onClick={() => onDone(Object.entries(basket).map(([food, qty]) => ({ food: Number(food), qty })), mistakes)}>
            Kassaga →
          </button>
        </footer>
      </div>
    </div>
  );
}
