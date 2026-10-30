import { useState } from 'react';
import { useVitals, fmtLeft, STAGE_NAMES } from './vitals.js';

// Har sahifada ko'rinadigan ogohlantirish: energiya 20% ga tushsa "Uxlash kerak",
// kasal bo'lsa — dorixonaga borish kerakligi va keyingi bosqichgacha qolgan vaqt.
// Sardor vafot etsa butun ekranni o'lim oynasi yopadi.
export default function VitalsBar({ onLogout }) {
  const v = useVitals();
  const [small, setSmall] = useState(false); // bosilsa kichik belgiga aylanadi
  if (!v) return null;

  if (v.dead) {
    return (
      <div className="vitals-dead" role="alertdialog" aria-labelledby="vd-title">
        <div className="vitals-dead-card">
          <div className="vd-icon" aria-hidden="true">🕯️</div>
          <h1 id="vd-title">Sardor vafot etdi</h1>
          <p>U uzoq vaqt uxlamadi va kasalligini davolatmadi.</p>
          {/* TODO: o'yinga qayta kirish (respawn) tartibi keyin qo'shiladi */}
          <p className="vd-note">O'yinga qayta kirish tartibi tez orada qo'shiladi.</p>
          <button onClick={onLogout}>Chiqish</button>
        </div>
      </div>
    );
  }

  const tired = v.warn && !v.sleeping;
  if (!tired && !v.stage) return null;
  const left = v.nextInMs != null ? fmtLeft(v.nextInMs) : null;
  let title, text;
  if (v.stage) {
    title = `🤒 Sardor kasal · ${v.stage}-bosqich (${STAGE_NAMES[v.stage]})`;
    text = v.sleeping
      ? 'Uxlab turibdi, kasallik og\'irlashmaydi. Davolanish uchun dorixonaga boring.'
      : `Dorixonaga borib davolaning${v.curePrice ? ` (${v.curePrice} tanga)` : ''}. ` +
        (left ? (v.stage >= 3 ? `Davolanmasa ${left}dan keyin vafot etadi!` : `Davolanmasa ${left}dan keyin og'irlashadi.`) : '');
    if (tired) text += ' Uxlash ham kerak.';
  } else {
    title = `⚡ Energiya ${Math.round(v.energy)}% — uxlash kerak!`;
    text = `Uyga borib karavotda uxlang.${left ? ` Uxlamasa ${left}dan keyin kasal bo'ladi.` : ''}`;
  }
  const level = v.stage >= 2 ? 'danger' : v.stage ? 'sick' : 'tired';

  if (small) {
    return (
      <button className={'vitals-bar mini ' + level} onClick={() => setSmall(false)} aria-label={title}>
        {v.stage ? '🤒' : '⚡'}{left && !v.sleeping && <small>{left}</small>}
      </button>
    );
  }
  return (
    <div className={'vitals-bar ' + level} role="alert" onClick={() => setSmall(true)} title="Kichraytirish uchun bosing">
      <b>{title}</b>
      <span>{text}</span>
    </div>
  );
}
