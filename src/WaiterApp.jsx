import { useState } from 'react';
import { Coin, LevelRing, fmt } from './CourierApp.jsx';

// Ofitsiant ilovasi (telefonda, faqat smena paytida): stollar, darajalar, menejer, profil.
// st — serverdagi holat (/api/waiter), now — server vaqti (ms), act — so'rov yuborish: act(path, body)

export const dishOf = (st, id) => st.menu.find((d) => d.id === id);

export function Dishes({ st, lines }) {
  return (
    <div className="cr-items">
      {lines.map((l) => {
        const d = dishOf(st, l.dish);
        return d && (
          <span key={l.dish} className="cr-item wt-dish" title={d.name}>
            <i aria-hidden="true">{d.icon}</i>{l.qty > 1 && <b>×{l.qty}</b>}
          </span>
        );
      })}
    </div>
  );
}

const PHASES = [['take', 'Buyurtma'], ['kitchen', 'Oshxona'], ['serve', 'Stolga']];

function ActiveOrder({ o, st, now, act, busy }) {
  const left = o.acceptedAt / 1000 + o.timeLimit - now / 1000;
  const si = PHASES.findIndex((s) => s[0] === o.phase);
  return (
    <div className="cr-active">
      <div className="cr-active-head">
        {/* oshxonaga ketgach stol raqami va taomlar yashiriladi: Sardor ularni eslab qolishi kerak */}
        <div><b>{o.phase === 'take' ? `${o.table}-stol · ${o.guest}` : `${o.guest}`}</b><small>{o.items} ta taom</small></div>
        <span className={'cr-timer' + (left < 10 ? ' low' : '')}>⏱ {fmt(left)}</span>
      </div>
      <ol className="cr-steps">
        {PHASES.map(([k, label], i) => <li key={k} className={i < si ? 'done' : i === si ? 'now' : ''}>{label}</li>)}
      </ol>
      {o.phase === 'take' && <p className="cr-hint">Mehmon buyurtma aytyapti: taomlarni eslab qoling!</p>}
      {o.phase === 'kitchen' && <p className="cr-hint">Oshxonadasiz: buyurtmadagi taomlarni patnisga yig'ing. Bloknotga qarash — xato hisoblanadi{st.profile.freePeeks ? ' (1 marta bepul)' : ''}.</p>}
      {o.phase === 'serve' && <p className="cr-hint">Patnis tayyor. Qaysi stol buyurtma bergan edi? Zalda o'sha stolni bosing.</p>}
      {o.phase === 'take' && <Dishes st={st} lines={o.lines} />}
      <div className="cr-pay"><span><Coin /> ~{o.reward}</span><span>✨ {o.xp} XP</span><span>❌ {o.mistakes}</span></div>
      <button className="cr-btn ghost" disabled={busy} onClick={() => act(`/orders/${o.id}/cancel`)}>Bekor qilish</button>
    </div>
  );
}

function Tables({ st, now, act, busy }) {
  return (
    <>
      <div className="cr-row">
        <h3>Zal: {st.profile.tables} ta stol</h3>
        <button className="cr-icon-btn" disabled={busy} onClick={() => act('/offers/refresh')} aria-label="Yangi mehmonlar">↻</button>
      </div>
      <p className="cr-sub">Mehmonni tanlang: Sardor stolga boradi va buyurtmani eshitadi.</p>
      {!st.offers.length && <p className="cr-empty">{st.nextGuestAt ? `Yangi mehmon kelyapti… ${fmt((st.nextGuestAt - now) / 1000)}` : "Hozircha mehmon yo'q"}</p>}
      {st.offers.map((o) => (
        <article key={o.id} className="cr-offer">
          <div className="cr-offer-top">
            <div><b>{o.mood} {o.table}-stol · {o.guest}</b><small>Kutyapti: {fmt((o.expiresAt - now) / 1000)}</small></div>
            <div className="cr-reward"><Coin size={16} />{o.reward}</div>
          </div>
          <div className="cr-meta"><span>🍽️ {o.items} ta taom</span><span>✨ {o.xp} XP</span></div>
          <div className="cr-offer-btns">
            <button className="cr-btn" disabled={busy || Boolean(st.active)} onClick={() => act(`/orders/${o.id}/accept`)}>Xizmat qilish</button>
          </div>
        </article>
      ))}
    </>
  );
}

function Ranks({ st }) {
  return (
    <>
      <h3>Darajalar</h3>
      <p className="cr-sub">XP faqat ofitsiantlikdan yig'iladi. Har daraja — yangi unvon, ko'proq stol va choychaqa.</p>
      <ol className="cr-ranks">
        {st.ranks.map((r) => (
          <li key={r.slug} className={r.open ? 'open' : ''}>
            <span>{r.open ? '✓' : r.level}</span>
            <div><b>{r.name}</b><small>{r.note}{r.level > 1 && ` · ${r.xp} XP`}</small></div>
          </li>
        ))}
      </ol>
    </>
  );
}

function Manager({ st, act, busy }) {
  const m = st.manager;
  if (!m) {
    return (
      <div className="cr-teaser">
        <span>💼</span>
        <h3>Restoran menejeri</h3>
        <p>5-darajada restoran menejeri bo'lasiz: soatiga 15 tanga passiv daromad yig'iladi (8 soatgacha), choychaqa 2 baravar.</p>
      </div>
    );
  }
  return (
    <>
      <h3>Menejer</h3>
      <div className="cr-dsp">
        <div><small>Yig'ildi</small><b>{m.passive}</b></div>
        <div><small>Soatiga</small><b>{m.perHour}</b></div>
        <div><small>Chegara</small><b>{m.cap}</b></div>
      </div>
      <button className="cr-btn wide" disabled={busy || !m.passive} onClick={() => act('/manager/claim')}>
        Daromadni olish: <Coin />{m.passive}
      </button>
      <p className="cr-sub">Restoran siz yo'qligingizda ham ishlaydi: daromad soatiga {m.perHour} tangadan yig'iladi.</p>
    </>
  );
}

function Profile({ st, onEnd }) {
  const p = st.profile;
  return (
    <>
      <div className="cr-prof">
        <LevelRing profile={p} size={64} />
        <div><b>{p.rank.name}</b><small>{p.xp} XP{p.nextXp && ` / ${p.nextXp}`}</small>
          {p.nextRank && <small>Keyingi unvon: {p.nextRank.name} ({p.nextRank.level}-daraja)</small>}</div>
      </div>
      <div className="cr-dsp">
        <div><small>Buyurtmalar</small><b>{p.ordersDone}</b></div>
        <div><small>O'rtacha</small><b>{p.avgStars ?? '—'} ★</b></div>
        <div><small>Choychaqa</small><b>{p.tips}</b></div>
      </div>
      <p className="cr-sub">Jami ishlangan: {p.earned} tanga · haq koeffitsienti ×{p.payMult}</p>
      {st.history.length > 0 && (
        <>
          <h4>Oxirgi buyurtmalar</h4>
          {st.history.map((o) => (
            <div key={o.id} className="cr-hist"><span>{o.table}-stol · {o.guest}</span><span>{'★'.repeat(o.stars)}</span><span><Coin />{o.paid}</span></div>
          ))}
        </>
      )}
      <button className="cr-btn danger wide" onClick={onEnd}>⏻ Smenani yakunlash</button>
    </>
  );
}

const TABS = [['tables', '🍽️', 'Stollar'], ['ranks', '🏅', 'Darajalar'], ['manager', '💼', 'Menejer'], ['profile', '👤', 'Profil']];

function EndShift({ st, busy, onYes, onNo }) {
  return (
    <div className="cr-confirm" role="alertdialog" aria-labelledby="wt-end-title">
      <div className="cr-confirm-box">
        <span className="cr-confirm-ic" aria-hidden="true">🏁</span>
        <h3 id="wt-end-title">Smenani yakunlaysizmi?</h3>
        {st.active ? (
          <>
            <p>Sizda tugallanmagan buyurtma bor. Avval uni stolga olib boring yoki "Bekor qilish" ni bosing.</p>
            <button className="cr-btn wide" onClick={onNo}>Tushunarli</button>
          </>
        ) : (
          <>
            <p>Sardor formani topshiradi va restoran eshigiga qaytadi. Shundan keyin uyga borishingiz mumkin. Ishlab topgan tangalaringiz balansda qoladi.</p>
            <button className="cr-btn danger wide" disabled={busy} onClick={onYes}>Ha, yakunlash</button>
            <button className="cr-btn ghost2 wide" onClick={onNo}>Ishni davom ettirish</button>
          </>
        )}
      </div>
    </div>
  );
}

export default function WaiterApp({ st, now, act, busy, onEndShift }) {
  const [tab, setTab] = useState('tables');
  const [ending, setEnding] = useState(false);
  return (
    <div className="cr-app wt-app">
      <header className="cr-app-head">
        <LevelRing profile={st.profile} size={36} />
        <div className="cr-app-title"><b>Ofitsiant</b><small>{st.profile.rank.name}</small></div>
        <span className="cr-wallet"><Coin size={16} />{st.coins}</span>
      </header>
      <button className="cr-end" onClick={() => setEnding(true)}>⏻ Smenani yakunlash</button>
      {ending && <EndShift st={st} busy={busy} onNo={() => setEnding(false)} onYes={async () => { setEnding(false); await onEndShift(); }} />}
      <div className="cr-app-body">
        {tab === 'tables' && (st.active ? <ActiveOrder o={st.active} st={st} now={now} act={act} busy={busy} /> : <Tables st={st} now={now} act={act} busy={busy} />)}
        {tab === 'ranks' && <Ranks st={st} />}
        {tab === 'manager' && <Manager st={st} act={act} busy={busy} />}
        {tab === 'profile' && <Profile st={st} onEnd={() => setEnding(true)} />}
      </div>
      <nav className="cr-tabs wt-tabs">
        {TABS.map(([k, ic, label]) => (
          <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)} aria-pressed={tab === k}>
            <span aria-hidden="true">{ic}</span>{label}
          </button>
        ))}
      </nav>
    </div>
  );
}
