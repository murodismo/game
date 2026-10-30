import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from './api.js';
import { dressUp } from './sardor.js';
import SardorStage, { WALK_MS } from './SardorStage.jsx';
import ProfileMenu from './ProfileMenu.jsx';
import BottomMenu from './BottomMenu.jsx';
import { FridgePanel } from './Fridge.jsx';
import { canPlace } from './fridgeSlots.js';
import { setHunger, useHunger } from './hunger.js';

const REFRESH_MS = 30000; // ovqatlar aynishini va tangalarni vaqti-vaqti bilan serverdan yangilash

// Asosiy sahifa: Sardorning xonasi. Kiyim javoni va muzlatgich shu sahifaning o'zida ochiladi.
export default function Home({ user, onLogout }) {
  const navigate = useNavigate();
  const [clothes, setClothes] = useState([]);
  const [saved, setSaved] = useState(null); // backenddagi kiyim
  const [draft, setDraft] = useState(null); // javonda kiyib ko'rilayotgan kiyim
  const [mode, setMode] = useState('room');
  const [dark, setDark] = useState(false); // pardalar yopiq
  const [page, setPage] = useState(0); // javon sahifasi
  const [asleep, setAsleep] = useState(false); // Sardor karavotda (backendda saqlanadi)
  const [ready, setReady] = useState(false); // boshlang'ich ma'lumotlar yuklandimi
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [leaving, setLeaving] = useState(false); // Sardor ko'chaga chiqib ketyapti
  const [foods, setFoods] = useState([]); // ovqat va ichimliklar katalogi
  // sotib olingan ovqatlar va tangalar (backendda): items — [{ id, food, slot, spoilsAt }], slot null — muzlatgichdan tashqarida
  const [inv, setInv] = useState({ coins: 0, items: [], skew: 0, spoilMs: 3600000 });
  const [foodPick, setFoodPick] = useState(null); // paneldan tanlangan ovqat
  const [fridgeSel, setFridgeSel] = useState(null); // muzlatgichda bosilgan ovqat joyi (yeyish yoki olib chiqish uchun)
  const satiety = useHunger();
  const invRef = useRef(inv);
  const saveChain = useRef(Promise.resolve());
  const timers = useRef([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // Ko'cha: Sardor sekin yurib ekrandan chiqadi, keyin ko'cha sahifasi ochiladi.
  // Uxlayotgan bo'lsa, avval turib oladi.
  function goStreet() {
    if (leaving) return;
    const wake = asleep ? 800 : 0;
    if (asleep) sleep(false);
    setLeaving(true);
    timers.current.push(
      setTimeout(() => setLeaving('walk'), wake),
      setTimeout(() => navigate('/street'), wake + WALK_MS + 150),
    );
  }

  // Kuryer smenasi tugamaguncha uyga kirib bo'lmaydi: kuryer sahifasiga qaytaramiz
  useEffect(() => {
    api('/courier').then((d) => { if (d.profile?.onShift) navigate('/work/courier', { replace: true }); }).catch(() => {});
    api('/waiter').then((d) => { if (d.profile?.onShift) navigate('/work/waiter', { replace: true }); }).catch(() => {});
  }, []);

  // Kirishda kiyimlar ro'yxati va foydalanuvchining saqlangan kiyimi olinadi
  useEffect(() => {
    // holat olinmasa ham xona ochilaveradi (Sardor turgan holda)
    // muzlatgich ma'lumotlari olinmasa ham xona ochilaveradi
    Promise.all([
      api('/clothes'), api('/me/outfit'), api('/me/state').catch(() => ({ state: { sleeping: false } })),
      api('/foods').catch(() => ({ foods: [] })), api('/me/items').catch(() => null),
    ])
      .then(([c, o, s, f, m]) => {
        setClothes(c.clothes); setSaved(o.outfit); setAsleep(s.state.sleeping);
        setFoods(f.foods);
        if (m) applyInv(m);
      })
      .catch((err) => setStatus(err.message))
      .finally(() => setReady(true));
    // aynish serverda vaqt bo'yicha hisoblanadi, shuning uchun holatni vaqti-vaqti bilan qayta olamiz
    const t = setInterval(() => api('/me/items').then(applyInv).catch(() => {}), REFRESH_MS);
    return () => clearInterval(t);
  }, []);

  const open = mode === 'wardrobe';
  const zoomed = mode !== 'room'; // javon yoki muzlatgich ochiq
  const foodsById = useMemo(() => Object.fromEntries(foods.map((f) => [f.id, f])), [foods]);
  // muzlatgichdagilar: { slot: foodId }
  const fridge = useMemo(() => Object.fromEntries(inv.items.filter((i) => i.slot).map((i) => [i.slot, i.food])), [inv]);
  // muzlatgichdan tashqaridagilar ovqat bo'yicha guruhlanadi: [{ food, count, spoilsAt }] (eng tez aynaydigani bo'yicha)
  const outside = useMemo(() => {
    const groups = {};
    for (const i of inv.items) {
      if (i.slot) continue;
      const g = (groups[i.food] ||= { food: i.food, count: 0, spoilsAt: null });
      g.count++;
      if (i.spoilsAt != null && (g.spoilsAt == null || i.spoilsAt < g.spoilsAt)) g.spoilsAt = i.spoilsAt;
    }
    return Object.values(groups);
  }, [inv]);
  // tanlangan ovqat tashqarida qolmagan bo'lsa (hammasi joylandi), tanlov bekor bo'ladi
  const pickFood = outside.some((g) => g.food === foodPick && foodsById[g.food]?.price != null) ? foodPick : null;
  const current = open ? draft : saved;
  const look = useMemo(() => dressUp(clothes, current), [clothes, current]);

  // Javonda har sahifada har turdan 3 tadan kiyim
  const pages = useMemo(() => {
    const count = (t) => clothes.filter((c) => c.type === t).length;
    return Math.max(1, ...['shirt', 'pants', 'shoes'].map((t) => Math.ceil(count(t) / 3)));
  }, [clothes]);
  const turnPage = (dir) => setPage((p) => Math.min(pages - 1, Math.max(0, p + dir)));

  function openPlace(path) {
    if (path === '/wardrobe') {
      setDraft(saved);
      setStatus('');
      // javon kiyib turgan futbolka joylashgan sahifada ochiladi
      const i = clothes.filter((c) => c.type === 'shirt').findIndex((c) => c.id === saved?.shirt);
      setPage(i > 0 ? Math.floor(i / 3) : 0);
      if (asleep) sleep(false);
      setMode('wardrobe');
    } else if (path === '/fridge') {
      setFoodPick(null);
      setStatus('');
      if (asleep) sleep(false);
      setMode('fridge');
    } else if (path === '/bed') {
      sleep(!asleep);
    } else if (path === '/window') {
      setDark((v) => !v);
    } else {
      navigate(path);
    }
  }

  // Uxlash/uyg'onish darhol ko'rinadi, keyin backendga yuboriladi; xato bo'lsa qaytariladi
  async function sleep(value) {
    setAsleep(value);
    try {
      await api('/me/state', { method: 'PUT', body: JSON.stringify({ sleeping: value }) });
    } catch (err) {
      setAsleep(!value);
      setStatus(err.message);
    }
  }

  function close() {
    setMode('room');
    setStatus('');
    setFoodPick(null);
    setFridgeSel(null);
  }

  // Serverdan kelgan holat. skew — server va brauzer soatlari farqi (taymerlar uchun)
  function applyInv(d) {
    if (d.hunger) setHunger(d.hunger);
    setInvState({ coins: d.coins, items: d.items, skew: d.now - Date.now(), spoilMs: d.spoilMs });
  }

  function setInvState(next) {
    invRef.current = next;
    setInv(next);
  }

  // O'zgarish darhol ko'rinadi, so'rovlar navbat bilan yuboriladi; xato bo'lsa serverdagi holat qaytariladi
  // quiet — xato xonada ko'rsatilmaydi (masalan, telefon o'zi ko'rsatadi)
  function send(path, options, optimistic, quiet) {
    if (optimistic) setInvState(optimistic);
    setStatus('');
    const run = saveChain.current.then(() => api(path, options)).then(applyInv);
    saveChain.current = run.catch(async (err) => {
      if (!quiet) setStatus(err.message);
      const m = await api('/me/items').catch(() => null);
      if (m) applyInv(m);
    });
    return run;
  }

  // Muzlatgichdagi joy bosildi: band bo'lsa ovqat tanlanadi (panelda "Yeyish" / "Olib chiqish"),
  // bo'sh bo'lsa paneldan tanlangan ovqat qo'yiladi
  function fridgeSlot(slot) {
    const cur = invRef.current;
    const map = Object.fromEntries(cur.items.filter((i) => i.slot).map((i) => [i.slot, i.food]));
    if (map[slot] != null) {
      setFridgeSel((s) => (s === slot ? null : slot));
      setFoodPick(null);
      setStatus('');
      return;
    }
    let item, to;
    if (canPlace(foodsById[pickFood], slot, map, foodsById)) {
      // shu ovqatlardan eng tez aynaydiganini qo'yamiz
      item = cur.items.filter((i) => !i.slot && i.food === pickFood).sort((a, b) => a.spoilsAt - b.spoilsAt)[0];
      to = slot;
    }
    if (!item) return;
    const items = cur.items.map((i) => (i.id === item.id
      ? { ...i, slot: to, spoilsAt: to ? null : Date.now() + cur.skew + cur.spoilMs } : i));
    send(`/me/items/${item.id}`, { method: 'PUT', body: JSON.stringify({ slot: to }) }, { ...cur, items }).catch(() => {});
  }

  // Tanlangan ovqatni muzlatgichdan olib chiqish
  function takeOut() {
    const cur = invRef.current;
    const item = cur.items.find((i) => i.slot === fridgeSel);
    setFridgeSel(null);
    if (!item) return;
    const items = cur.items.map((i) => (i.id === item.id ? { ...i, slot: null, spoilsAt: Date.now() + cur.skew + cur.spoilMs } : i));
    send(`/me/items/${item.id}`, { method: 'PUT', body: JSON.stringify({ slot: null }) }, { ...cur, items }).catch(() => {});
  }

  // Tanlangan ovqatni yeyish: to'qlikni server hisoblaydi va qaytaradi
  function eat() {
    const cur = invRef.current;
    const item = cur.items.find((i) => i.slot === fridgeSel);
    setFridgeSel(null);
    if (!item) return;
    send(`/me/items/${item.id}/eat`, { method: 'POST' }, { ...cur, items: cur.items.filter((i) => i.id !== item.id) })
      .then(() => {}, () => {});
  }

  // Eats ilovasidan sotib olish; xato bo'lsa telefon ekranida ko'rsatiladi
  const buy = (food) => send('/shop/buy', { method: 'POST', body: JSON.stringify({ food }) }, null, true);

  // Aynigan ovqatni tashlash (bittasini)
  function discard(food) {
    const item = invRef.current.items.find((i) => !i.slot && i.food === food);
    if (item) send(`/me/items/${item.id}`, { method: 'DELETE' }).catch(() => {});
  }

  // Esc javon/muzlatgichni yopadi, chap/o'ng strelkalar javon sahifasini almashtiradi
  useEffect(() => {
    if (!zoomed) return;
    const onKey = (e) => {
      if (e.key === 'Escape') close();
      if (open && e.key === 'ArrowLeft') turnPage(-1);
      if (open && e.key === 'ArrowRight') turnPage(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [zoomed, open, pages]);

  async function save() {
    setSaving(true);
    setStatus('');
    try {
      const d = await api('/me/outfit', { method: 'PUT', body: JSON.stringify(draft) });
      setSaved(d.outfit);
      setStatus('Saqlandi');
    } catch (err) {
      setStatus(err.message);
    } finally {
      setSaving(false);
    }
  }

  const changed = open && saved && draft &&
    (draft.shirt !== saved.shirt || draft.pants !== saved.pants || draft.shoes !== saved.shoes);

  return (
    <div className="home">
      {ready && (
        <SardorStage
          onOpen={openPlace}
          mode={mode}
          dark={dark}
          asleep={asleep}
          leaving={leaving === 'walk'}
          look={look}
          wardrobe={{
            clothes,
            selected: draft || {},
            onPick: (c) => { setDraft((d) => ({ ...d, [c.type]: c.id })); setStatus(''); },
            page,
            pages,
            onPage: turnPage,
          }}
          fridge={{ byId: foodsById, items: fridge, selected: pickFood, chosen: fridgeSel, onSlot: fridgeSlot }}
        />
      )}
      {!leaving && <ProfileMenu username={user.username} onLogout={onLogout} coins={inv.coins} />}
      {!zoomed && status && <p className="toast error">{status}</p>}
      {/* javon yoki muzlatgich ochiqligida pastda uning paneli turadi, menyu yashiriladi */}
      {!zoomed && !leaving && (
        <BottomMenu onStreet={goStreet}
          shop={{ foods, coins: inv.coins, outside: outside.reduce((n, g) => n + g.count, 0), onBuy: buy }} />
      )}
      {mode === 'fridge' && (
        <FridgePanel groups={outside} byId={foodsById} items={fridge} selected={foodPick} now={Date.now() + inv.skew}
          onSelect={(id) => { setFoodPick(id); setFridgeSel(null); setStatus(''); }} onDiscard={discard} status={status} onClose={close}
          chosen={fridge[fridgeSel] != null ? foodsById[fridge[fridgeSel]] : null} satiety={satiety} onEat={eat} onTakeOut={takeOut} />
      )}
      {open && (
        <div className="wardrobe-panel" role="region" aria-label="Kiyim javoni">
          <span className="hint">{status || 'Kiyimni bosib, Sardorga kiygizing'}</span>
          {/* telefonda javondagi strelkalar kichik, shuning uchun bu yerda kattaroq nusxasi */}
          <div className="pager">
            <button className="pager-btn" onClick={() => turnPage(-1)} disabled={page === 0} aria-label="Oldingi sahifa">‹</button>
            <span>{page + 1}/{pages}</span>
            <button className="pager-btn" onClick={() => turnPage(1)} disabled={page >= pages - 1} aria-label="Keyingi sahifa">›</button>
          </div>
          <div className="actions">
            <button onClick={save} disabled={saving || !changed}>{saving ? 'Saqlanmoqda...' : 'Saqlash'}</button>
            <button className="secondary" onClick={close}>Yopish</button>
          </div>
        </div>
      )}
    </div>
  );
}
