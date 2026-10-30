import { useEffect, useRef, useState } from 'react';
import { api } from './api.js';
import { useHunger } from './hunger.js';
import { useVitals, fmtLeft, STAGE_NAMES } from './vitals.js';

const Coin = () => (
  <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" className="coin">
    <circle cx="8" cy="8" r="7" fill="#f3c623" stroke="#b8860b" strokeWidth="1.5" />
    <circle cx="8" cy="8" r="3.5" fill="none" stroke="#b8860b" strokeWidth="1.2" />
  </svg>
);

// Vilka va qoshiq: to'qlik belgisi
const HungerIcon = () => (
  <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <path d="M4 2 v4 q0 2 1.5 2 V14 M2.5 2 v3 M5.5 2 v3" />
    <path d="M11.5 14 V9 q-2 -1 -2 -3.5 Q9.5 2 11.5 2 q2 0 2 3.5 q0 2.5 -2 3.5" />
  </svg>
);

// Chaqmoq: energiya belgisi
const EnergyIcon = () => (
  <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" fill="currentColor">
    <path d="M9.5 1 L3 9 h4.2 L6.2 15 L13 6.6 H8.6 Z" />
  </svg>
);

// O'ng yuqoridagi profil tugmasi: balans doim ko'rinadi. Menyuda — balans, kuryer darajasi va "Chiqish".
// coins — sahifadagi balans (Eats xaridlaridan keyin ham to'g'ri bo'lishi uchun), berilmasa serverdan olinadi
export default function ProfileMenu({ username, onLogout, coins }) {
  const [open, setOpen] = useState(false);
  const [info, setInfo] = useState(null); // /api/courier: tangalar va kuryer profili
  const [waiter, setWaiter] = useState(null); // /api/waiter: ofitsiant profili
  const ref = useRef(null);

  useEffect(() => {
    api('/courier').then(setInfo).catch(() => {});
    api('/waiter').then(setWaiter).catch(() => {});
  }, [open, coins]);

  // tashqariga bosilganda yoki Esc bosilganda menyu yopiladi
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (!ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const balance = coins ?? info?.coins;
  const satiety = useHunger();
  const full = satiety == null ? null : Math.round(satiety);
  const level = full == null ? '' : full > 50 ? 'ok' : full > 20 ? 'low' : 'empty';
  const vitals = useVitals();
  const energy = vitals ? Math.round(vitals.energy) : null;
  const eLevel = energy == null ? '' : energy > 50 ? 'ok' : energy > 20 ? 'low' : 'empty';
  const p = info?.profile;
  const k = p ? (p.nextXp ? (p.xp - p.levelXp) / (p.nextXp - p.levelXp) : 1) : 0;
  return (
    <div className="profile" ref={ref}>
      <button className="profile-btn" onClick={() => setOpen((v) => !v)} aria-haspopup="menu" aria-expanded={open}>
        <span className="avatar">{username[0].toUpperCase()}</span>
        <span className="profile-name">{username}</span>
        {balance != null && <span className="profile-coins" aria-label={`Balans: ${balance} tanga`}><Coin />{balance}</span>}
        {full != null && (
          <span className={'profile-hunger ' + level} title={`To'qlik: ${full}%`} aria-label={`To'qlik: ${full}%`}>
            <HungerIcon /><span className="hunger-bar"><i style={{ width: `${full}%` }} /></span>
          </span>
        )}
        {energy != null && (
          <span className={'profile-hunger energy ' + eLevel} title={`Energiya: ${energy}%`} aria-label={`Energiya: ${energy}%`}>
            <EnergyIcon /><span className="hunger-bar"><i style={{ width: `${energy}%` }} /></span>
          </span>
        )}
        {vitals?.stage > 0 && <span className="profile-sick" title={`Kasal: ${vitals.stage}-bosqich`} aria-label={`Kasal: ${vitals.stage}-bosqich`}>🤒</span>}
      </button>
      {open && (
        <div className="profile-menu" role="menu">
          <div className="pm-row">
            <small>Balans</small>
            <b><Coin /> {balance ?? '…'} tanga</b>
          </div>
          {full != null && (
            <div className="pm-row">
              <small>To'qlik</small>
              <b>{full}%{full <= 20 ? ' · Sardor och!' : ''}</b>
              <span className={'pm-hunger ' + level}><i style={{ width: `${full}%` }} /></span>
              <small>Muzlatgichdagi ovqatni yeb, qornini to'ydiring</small>
            </div>
          )}
          {energy != null && (
            <div className="pm-row">
              <small>Energiya</small>
              <b>{energy}%{vitals.sleeping ? ' · uxlayapti' : energy <= vitals.warnAt ? ' · uxlash kerak!' : ''}</b>
              <span className={'pm-hunger energy ' + eLevel}><i style={{ width: `${energy}%` }} /></span>
              <small>Uyda karavotda uxlab, energiyani tiklang</small>
            </div>
          )}
          {vitals && (
            <div className="pm-row">
              <small>Sog'liq</small>
              <b className={vitals.stage ? 'pm-sick' : ''}>{vitals.stage ? `${STAGE_NAMES[vitals.stage]} · ${vitals.stage}-bosqich` : STAGE_NAMES[0]}</b>
              {vitals.stage > 0 && (
                <small>
                  Dorixonada davolaning ({vitals.curePrice} tanga)
                  {vitals.nextInMs != null && !vitals.sleeping && ` · ${fmtLeft(vitals.nextInMs)}dan keyin ${vitals.stage >= 3 ? 'vafot etadi' : "og'irlashadi"}`}
                </small>
              )}
              {!vitals.stage && vitals.warn && vitals.nextInMs != null && !vitals.sleeping && (
                <small>Uxlamasa {fmtLeft(vitals.nextInMs)}dan keyin kasal bo'ladi</small>
              )}
            </div>
          )}
          <div className="pm-row">
            <small>Kuryer</small>
            {p ? (
              <>
                <b>{p.level}-daraja · {p.rank.name}</b>
                <span className="pm-xp"><i style={{ width: `${k * 100}%` }} /></span>
                <small>{p.xp} XP{p.nextXp ? ` / ${p.nextXp}` : ''} · {p.ordersDone} ta buyurtma{p.onShift ? ' · smenada' : ''}</small>
              </>
            ) : <b>{info ? 'Hali ishga kirmagan' : '…'}</b>}
          </div>
          {waiter?.hired && (
            <div className="pm-row">
              <small>Ofitsiant</small>
              <b>{waiter.profile.level}-daraja · {waiter.profile.rank.name}</b>
              <span className="pm-xp"><i style={{ width: `${(waiter.profile.nextXp ? (waiter.profile.xp - waiter.profile.levelXp) / (waiter.profile.nextXp - waiter.profile.levelXp) : 1) * 100}%` }} /></span>
              <small>{waiter.profile.xp} XP{waiter.profile.nextXp ? ` / ${waiter.profile.nextXp}` : ''} · {waiter.profile.ordersDone} ta buyurtma{waiter.profile.onShift ? ' · smenada' : ''}</small>
            </div>
          )}
          <button role="menuitem" onClick={onLogout}>Chiqish</button>
        </div>
      )}
    </div>
  );
}
