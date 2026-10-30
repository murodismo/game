import { useEffect, useState } from 'react';
import { api } from './api.js';
import { setVitals, clearVitals } from './vitals.js';

// Ochlik: to'qlik foizi serverda hisoblanadi, bu yerda faqat ko'rsatiladi.
// Kirgan foydalanuvchi har 30 soniyada "online" ekanini serverga bildiradi (heartbeat).
const BEAT_MS = 30000;

let state = null; // { satiety, fullMs, at } — at: serverdan olingan vaqt (brauzer soati)
const listeners = new Set();

export function setHunger(h) {
  if (!h) return;
  state = { ...h, at: Date.now() };
  listeners.forEach((fn) => fn(state));
}

function beat() {
  // sahifa yashirin bo'lsa (boshqa tab) yubormaymiz: server bu vaqtni offline deb hisoblaydi
  if (document.visibilityState === 'hidden') return;
  api('/me/heartbeat', { method: 'POST' }).then((d) => { setHunger(d.hunger); setVitals(d.vitals); }).catch(() => {});
}

// App kirgan foydalanuvchi uchun chaqiradi; qaytgan funksiya to'xtatadi
export function startHeartbeat() {
  beat();
  const t = setInterval(beat, BEAT_MS);
  const onShow = () => document.visibilityState === 'visible' && beat();
  document.addEventListener('visibilitychange', onShow);
  return () => {
    clearInterval(t);
    document.removeEventListener('visibilitychange', onShow);
    state = null;
    clearVitals();
  };
}

// Hozirgi to'qlik (%). Heartbeatlar orasida ko'rsatkich silliq kamayib boradi (faqat ko'rinish uchun).
export function useHunger() {
  const [h, setH] = useState(state);
  const [, tick] = useState(0);
  useEffect(() => {
    listeners.add(setH);
    setH(state);
    const t = setInterval(() => tick((n) => n + 1), 5000);
    return () => { listeners.delete(setH); clearInterval(t); };
  }, []);
  if (!h) return null;
  const drained = Math.min(Date.now() - h.at, BEAT_MS * 2) * 100 / h.fullMs;
  return Math.max(0, h.satiety - drained);
}
