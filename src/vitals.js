import { useEffect, useState } from 'react';
import { api } from './api.js';

// Energiya va kasallik: hamma narsa serverda hisoblanadi (server/vitals.js), bu yerda faqat ko'rsatiladi.
// Holat heartbeat javobidan (hunger.js) va dorixonadan keladi.
let state = null;
let polledAt = 0; // bosqich almashadigan payt serverdan qayta so'raladi (heartbeatni kutmasdan) // { energy, stage, dead, warn, sleeping, nextInMs, ..., at } — at: olingan vaqt (brauzer soati)
const listeners = new Set();

export function setVitals(v) {
  if (!v) return;
  state = { ...v, at: Date.now() };
  listeners.forEach((fn) => fn(state));
}

export function clearVitals() {
  state = null;
}

// Hozirgi holat. Heartbeatlar orasida energiya va qolgan vaqt silliq o'zgarib boradi (faqat ko'rinish uchun).
export function useVitals() {
  const [v, setV] = useState(state);
  const [, tick] = useState(0);
  useEffect(() => {
    listeners.add(setV);
    setV(state);
    const t = setInterval(() => tick((n) => n + 1), 1000);
    return () => { listeners.delete(setV); clearInterval(t); };
  }, []);
  if (!v) return null;
  if (v.dead) return v;
  const dt = Math.min(Date.now() - v.at, 60000);
  const energy = v.sleeping
    ? Math.min(100, v.energy + dt * 100 / v.sleepMs)
    : Math.max(0, v.energy - dt * 100 / v.energyMs);
  // uxlayotganda kasallik soati to'xtaydi
  const nextInMs = v.nextInMs == null ? null : v.sleeping ? v.nextInMs : Math.max(0, v.nextInMs - dt);
  if (nextInMs === 0 && Date.now() - polledAt > 3000) {
    polledAt = Date.now();
    api('/me/vitals').catch(() => {}); // javobni api.js o'zi setVitals ga beradi
  }
  return { ...v, energy, nextInMs };
}

// "1 soat 23 daqiqa", "4 daqiqa", "35 soniya"
export function fmtLeft(ms) {
  const s = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  if (h) return `${h} soat${m ? ` ${m} daqiqa` : ''}`;
  if (m) return `${m} daqiqa`;
  return `${s} soniya`;
}

export const STAGE_NAMES = ['Sog\'', 'Yengil kasal', 'Kasal', "Og'ir kasal"];
