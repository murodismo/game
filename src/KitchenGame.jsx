import { useEffect, useMemo, useState } from 'react';
import { fmt } from './CourierApp.jsx';
import { dishOf } from './WaiterApp.jsx';

// Ofitsiant mini-o'yinlari (kuryerning do'kon o'yiniga o'xshash):
// 1) TakeOrder — mehmon buyurtma aytadi, taomlar qisqa vaqt ko'rinadi: eslab qolish kerak.
// 2) KitchenGame — oshxona peshtaxtasidan o'sha taomlarni xotiradan patnisga yig'ish.
//    Ro'yxat ko'rinmaydi; bloknotga qarash va noto'g'ri patnis — xato (serverda sanaladi).

export function TakeOrder({ order, st, now, busy, onGo }) {
  const end = order.acceptedAt + order.memoMs;
  const left = Math.max(0, end - now);
  // yodlash vaqti tugasa, o'zi oshxonaga ketadi
  useEffect(() => { if (left <= 0 && !busy) onGo(); }, [left <= 0]);
  return (
    <div className="wt-take" role="dialog" aria-labelledby="wt-take-title">
      <div className="wt-bubble">
        <h2 id="wt-take-title">{order.mood} {order.guest} <small>{order.table}-stol</small></h2>
        <p>«Menga quyidagilarni olib keling:»</p>
        <ul className="wt-say">
          {order.lines.map((l) => {
            const d = dishOf(st, l.dish);
            return d && <li key={l.dish}><span aria-hidden="true">{d.icon}</span><b>{d.name}</b>{l.qty > 1 && <em>×{l.qty}</em>}</li>;
          })}
        </ul>
        <i className="wt-memo"><i style={{ width: `${(left / order.memoMs) * 100}%` }} /></i>
        <button className="cr-btn wide" disabled={busy} onClick={onGo}>Yodladim, oshxonaga →</button>
      </div>
    </div>
  );
}

// peshtaxtadagi taomlar: buyurtmadagilar + boshqalar, buyurtma id'siga qarab doim bir xil joylashuv
function counterFor(order, menu, count) {
  let x = order.id * 7919 + 17;
  const r = () => ((x = (x * 9301 + 49297) % 233280) / 233280);
  const want = order.lines.map((l) => l.dish);
  const others = menu.filter((d) => !want.includes(d.id)).sort(() => r() - 0.5).map((d) => d.id);
  return [...want, ...others].slice(0, Math.max(count, want.length)).sort(() => r() - 0.5);
}

export default function KitchenGame({ order, st, now, busy, act, onWrong }) {
  const counter = useMemo(() => counterFor(order, st.menu, st.profile.rank.dishes), [order.id, st.menu, st.profile.rank.dishes]);
  const [tray, setTray] = useState({}); // dish -> qty
  const [peek, setPeek] = useState(false);
  const [shake, setShake] = useState(false);
  const [msg, setMsg] = useState('');
  const left = order.acceptedAt / 1000 + order.timeLimit - now / 1000;
  const freeLeft = Math.max(0, st.profile.freePeeks - order.peeks);
  const count = Object.values(tray).reduce((n, q) => n + q, 0);

  const add = (id) => { setMsg(''); setTray((t) => ({ ...t, [id]: (t[id] || 0) + 1 })); };
  const drop = (id) => setTray((t) => {
    const n = { ...t, [id]: t[id] - 1 };
    if (!n[id]) delete n[id];
    return n;
  });

  async function openNotes() {
    const d = await act(`/orders/${order.id}/peek`);
    if (!d) return;
    setMsg(d.peek?.free ? 'Bepul qarash ishlatildi' : 'Bloknotga qaradingiz: +1 xato');
    setPeek(true);
    setTimeout(() => setPeek(false), 1800);
  }

  async function serve() {
    const d = await act(`/orders/${order.id}/pickup`, { tray: Object.entries(tray).map(([dish, qty]) => ({ dish: Number(dish), qty })) });
    if (!d) {
      setShake(true);
      setTimeout(() => setShake(false), 450);
      onWrong();
    }
  }

  return (
    <div className="shop-overlay" role="dialog" aria-modal="true" aria-labelledby="wt-kitchen-title">
      <div className="shop wt-kitchen">
        <header className="shop-head">
          <h2 id="wt-kitchen-title">👨‍🍳 Oshxona · {order.guest}</h2>
          <span className={'cr-timer' + (left < 10 ? ' low' : '')}>⏱ {fmt(left)}</span>
        </header>
        <div className="shop-main">
          <aside className="shop-list wt-notes" aria-label="Bloknot">
            <h3>📝 Bloknot</h3>
            {peek ? (
              <ul>
                {order.lines.map((l) => {
                  const d = dishOf(st, l.dish);
                  return d && <li key={l.dish}><span className="wt-ic">{d.icon}</span><span>{d.name}</span><b>×{l.qty}</b></li>;
                })}
              </ul>
            ) : (
              <>
                <p className="wt-notes-hint">Buyurtmani eslang: {order.items} ta taom edi.</p>
                <button className="cr-btn alt wide" disabled={busy} onClick={openNotes}>
                  Bloknotga qarash{freeLeft ? ' (bepul)' : ' (+1 xato)'}
                </button>
              </>
            )}
            <p className="shop-mist">Xatolar: {order.mistakes}{order.mistakes >= 1 && ' (−★)'}</p>
          </aside>
          <div className="shop-shelves">
            <div className="shop-rack wt-counter">
              {counter.map((id) => {
                const d = dishOf(st, id);
                return d && (
                  <button key={id} className="shop-prod wt-prod" onClick={() => add(id)} aria-label={d.name}>
                    <span className="shop-prod-3d wt-plate"><i aria-hidden="true">{d.icon}</i></span>
                    <small>{d.name}</small>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <footer className="shop-foot">
          <div className={'shop-basket wt-tray' + (shake ? ' no' : '')} aria-label="Patnis">
            <span className="shop-basket-ic" aria-hidden="true">🍽️</span>
            {Object.entries(tray).map(([id, q]) => (
              <button key={id} className="shop-in wt-in" onClick={() => drop(Number(id))} aria-label={`${dishOf(st, Number(id)).name}ni olib qo'yish`}>
                <i aria-hidden="true">{dishOf(st, Number(id)).icon}</i>{q > 1 && <b>×{q}</b>}
              </button>
            ))}
            {!count && <small>Patnis bo'sh: taomni bosing</small>}
          </div>
          <p className="shop-msg" aria-live="polite">{msg}</p>
          <button className="cr-btn" disabled={!count || busy} onClick={serve}>Zalga olib chiqish →</button>
        </footer>
      </div>
    </div>
  );
}
