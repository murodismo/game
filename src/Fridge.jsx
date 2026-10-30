import { COLS, DOOR, DOOR_SLOTS, ROWS, canPlace, cellSlot, doorSlot, hasRoom, kindLabel } from './fridgeSlots.js';

// Muzlatgich: xonadagi yopiq ko'rinishi, ochiq ko'rinishi (javonlar va eshik) va pastdagi ovqatlar paneli.
// Koordinatalar xonaning keng (land) joylashuvida; telefonda RoomBackdrop transform bilan kichraytiradi.

const onEnter = (fn) => (e) => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); }
};

/* ---- Ovqat va ichimlik rasmlari: har biri o'z o'lchamidagi qutida, (0,0) — chap yuqori burchak ---- */
const SIZE = { big: [140, 52], small: [44, 44], bottle: [24, 68], can: [26, 40] };
export const sizeOf = (f) => SIZE[f.kind === 'drink' ? f.subtype : f.kind];

const ART = {
  cake: (c) => (
    <>
      <ellipse cx="70" cy="49" rx="68" ry="4" fill="#e8eef2" />
      <rect x="12" y="16" width="116" height="32" rx="4" fill={c.base} />
      <rect x="12" y="30" width="116" height="5" fill={c.cream} />
      <rect x="10" y="10" width="120" height="10" rx="5" fill={c.cream} />
      {[22, 44, 66, 88, 110].map((x) => <circle key={x} cx={x} cy="20" r="4" fill={c.cream} />)}
      {[30, 55, 80, 105].map((x) => <circle key={x} cx={x} cy="8" r="5" fill={c.berry} />)}
    </>
  ),
  watermelon: (c) => (
    <>
      <ellipse cx="70" cy="28" rx="64" ry="23" fill={c.rind} />
      <g fill="none" stroke={c.stripe} strokeWidth="4">
        <ellipse cx="70" cy="28" rx="46" ry="23" />
        <ellipse cx="70" cy="28" rx="22" ry="23" />
        <line x1="70" y1="5" x2="70" y2="51" />
      </g>
      <ellipse cx="44" cy="16" rx="18" ry="5" fill="#fff" opacity=".25" />
    </>
  ),
  pot: (c) => (
    <>
      <ellipse cx="70" cy="15" rx="56" ry="9" fill={c.food} />
      {[38, 52, 66, 80, 96].map((x, i) => <rect key={x} x={x} y={10 + (i % 2) * 5} width="9" height="3" rx="1.5" fill={c.bits} />)}
      <rect x="2" y="21" width="14" height="7" rx="3.5" fill={c.pot} />
      <rect x="124" y="21" width="14" height="7" rx="3.5" fill={c.pot} />
      <path d="M12 18 h116 q-4 30 -26 33 h-64 q-22 -3 -26 -33z" fill={c.pot} />
      <rect x="10" y="16" width="120" height="6" rx="3" fill="#6b717a" />
    </>
  ),
  fish: (c) => (
    <>
      <ellipse cx="70" cy="46" rx="66" ry="6" fill="#e8eef2" />
      <polygon points="106,28 134,12 130,28 134,44" fill={c.fin} />
      <path d="M50 14 q14 -10 30 -2 z" fill={c.fin} />
      <ellipse cx="62" cy="28" rx="50" ry="16" fill={c.body} />
      <path d="M34 16 q8 12 0 24" fill="none" stroke={c.fin} strokeWidth="3" />
      <circle cx="24" cy="24" r="4" fill="#fff" />
      <circle cx="23" cy="24" r="2" fill="#2a2a2a" />
    </>
  ),
  apple: (c) => (
    <>
      <path d="M22 13 l2 -9" stroke="#6b4a2b" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="31" cy="8" rx="7" ry="3.5" fill="#4f9a3a" transform="rotate(-25 31 8)" />
      <path d="M22 14 q-18 -6 -18 14 q0 16 12 16 q6 0 6 -2 q0 2 6 2 q12 0 12 -16 q0 -20 -18 -14z" fill={c.body} />
      <ellipse cx="13" cy="24" rx="3.5" ry="6" fill="#fff" opacity=".35" />
    </>
  ),
  tomato: (c) => (
    <>
      <ellipse cx="22" cy="29" rx="19" ry="14" fill={c.body} />
      <polygon points="22,12 25,17 32,16 27,20 29,25 22,21 15,25 17,20 12,16 19,17" fill="#3f8f3a" />
      <ellipse cx="13" cy="27" rx="3.5" ry="5" fill="#fff" opacity=".3" />
    </>
  ),
  cheese: (c) => (
    <>
      <polygon points="3,30 40,18 34,13" fill="#f7dc6b" />
      <polygon points="3,42 40,42 40,18 3,30" fill={c.body} />
      <circle cx="14" cy="36" r="3" fill="#d9a91a" />
      <circle cx="28" cy="31" r="4" fill="#d9a91a" />
      <circle cx="35" cy="38" r="2" fill="#d9a91a" />
    </>
  ),
  cup: (c) => (
    <>
      <path d="M8 13 h28 l-4 30 h-20z" fill={c.body} stroke="rgba(0,0,0,.15)" strokeWidth="1.5" />
      <rect x="9.5" y="23" width="25" height="9" fill={c.lid} opacity=".4" />
      <rect x="5" y="8" width="34" height="6" rx="2" fill={c.lid} />
    </>
  ),
  eggs: (c) => (
    <>
      {[9, 22, 35].map((x) => <ellipse key={x} cx={x} cy="22" rx="6.5" ry="8.5" fill={c.egg} stroke="#e2d6bf" strokeWidth="1.5" />)}
      <rect x="1" y="28" width="42" height="15" rx="3" fill={c.box} />
      <line x1="15.5" y1="30" x2="15.5" y2="41" stroke="rgba(0,0,0,.15)" strokeWidth="2" />
      <line x1="28.5" y1="30" x2="28.5" y2="41" stroke="rgba(0,0,0,.15)" strokeWidth="2" />
    </>
  ),
  carrot: (c) => (
    <>
      <path d="M36 21 l2 -13 M37 22 l8 -9 M35 21 l-5 -11" stroke="#4f9a3a" strokeWidth="3" strokeLinecap="round" />
      <path d="M3 41 Q16 32 32 21 Q42 19 40 30 Q22 38 3 41z" fill={c.body} />
      <path d="M18 33 l3 4 M26 27 l3 4" stroke="rgba(0,0,0,.2)" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  // aynigan ovqat: likopchadagi yashil-kulrang bo'lak, ustida pashsha va hid chiziqlari
  spoiled: (c) => (
    <>
      <ellipse cx="22" cy="40" rx="20" ry="4" fill="#e8eef2" />
      <path d="M6 39 q-2 -14 10 -16 q4 -8 12 -4 q10 0 10 12 q2 6 -2 8z" fill={c.body} />
      <circle cx="15" cy="31" r="3" fill="#6b7a3a" /><circle cx="27" cy="27" r="2.5" fill="#6b7a3a" />
      <path d="M12 16 q-3 -4 0 -8 q3 -4 0 -8 M24 14 q-3 -4 0 -7 q3 -4 0 -7" fill="none" stroke="#7b8a4a" strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="34" cy="10" rx="3" ry="2" fill={c.fly} />
      <ellipse cx="33" cy="7" rx="2.5" ry="1.5" fill="#cfe3ef" opacity=".9" />
      <ellipse cx="36" cy="7" rx="2.5" ry="1.5" fill="#cfe3ef" opacity=".9" />
    </>
  ),
  bottle: (c) => (
    <>
      <path d="M8 6 h8 v7 q8 5 8 13 v38 q0 4 -4 4 h-16 q-4 0 -4 -4 v-38 q0 -8 8 -13z" fill={c.liquid} stroke="rgba(0,0,0,.25)" strokeWidth="1.5" />
      <rect x="7" y="0" width="10" height="7" rx="1.5" fill={c.cap} />
      <rect x="0.75" y="34" width="22.5" height="14" fill={c.label} />
      <rect x="4" y="22" width="3" height="40" rx="1.5" fill="#fff" opacity=".35" />
    </>
  ),
  can: (c) => (
    <>
      <rect x="1" y="3" width="24" height="35" rx="3" fill={c.body} />
      <rect x="2" y="0" width="22" height="5" rx="2" fill="#cfd6dc" />
      <rect x="2" y="36" width="22" height="4" rx="2" fill="#b8c0c7" />
      <rect x="1" y="16" width="24" height="9" fill={c.band} />
      <rect x="5" y="6" width="3" height="28" rx="1.5" fill="#fff" opacity=".3" />
    </>
  ),
};

export function FoodArt({ food, x, y }) {
  const draw = ART[food.kind === 'drink' ? food.subtype : food.art.shape];
  return <g transform={`translate(${x} ${y})`}>{draw?.(food.art)}</g>;
}

// Paneldagi kichik rasm (o'lchami bir xil quti ichida)
export function FoodIcon({ food }) {
  const [w, h] = sizeOf(food);
  const s = Math.max(w, h) + 8;
  return (
    <svg viewBox={`${(w - s) / 2} ${(h - s) / 2} ${s} ${s}`} width="40" height="40" aria-hidden="true">
      <FoodArt food={food} x={0} y={0} />
    </svg>
  );
}

/* ---- Yopiq muzlatgich (xonada) ---- */
export function Fridge() {
  return (
    <>
      <rect x="1410" y="270" width="180" height="380" rx="14" fill="#d5dde2" />
      <rect x="1418" y="278" width="164" height="96" rx="9" fill="#f2f6f8" />
      <rect x="1418" y="382" width="164" height="258" rx="9" fill="#f2f6f8" />
      <rect x="1428" y="296" width="8" height="54" rx="4" fill="#9fb0bb" />
      <rect x="1428" y="398" width="8" height="90" rx="4" fill="#9fb0bb" />
      <rect x="1572" y="290" width="4" height="70" rx="2" fill="#fff" opacity=".8" />
      <rect x="1572" y="396" width="4" height="220" rx="2" fill="#fff" opacity=".8" />
      {/* magnitlar va eshikdagi rasmcha */}
      <circle cx="1540" cy="318" r="8" fill="#e7884d" />
      <circle cx="1514" cy="334" r="6" fill="#4f86c6" />
      <g transform="rotate(-4 1526 432)">
        <rect x="1498" y="410" width="56" height="44" rx="3" fill="#fff6c9" />
        <circle cx="1514" cy="426" r="6" fill="#f3c623" />
        <path d="M1504 448 l14 -12 l10 8 l8 -6 l12 10z" fill="#6fb257" />
      </g>
      <circle cx="1526" cy="412" r="4" fill="#d9534f" />
      <rect x="1424" y="648" width="20" height="12" fill="#6f7d86" />
      <rect x="1556" y="648" width="20" height="12" fill="#6f7d86" />
    </>
  );
}

/* ---- Ochiq muzlatgich: 4 qator javon (har birida 3 joy) va eshikda 3 ta javon ---- */
const IN_X = 1420, IN_W = 160, IN_Y = 384, ROW_H = 64;
const COL_W = IN_W / COLS;
const rowFloor = (r) => IN_Y + (r + 1) * ROW_H - 5; // javon oynasining usti
const DOOR_X = 1598, DOOR_SLOT_W = 34;
const DOOR_TOP = [390, 466, 556];
const DOOR_FLOOR = [456, 548, 636];

// Bitta joy: bo'sh bo'lsa va tanlangan ovqat sig'sa — yashil ramka, band bo'lsa — bosib olib tashlanadi
function Slot({ slot, food, target, chosen, label, x, y, w, h, onSlot, children }) {
  if (!food && !target) return null;
  const act = () => onSlot(slot);
  return (
    <g className={'fridge-slot' + (target ? ' target' : '') + (food ? ' filled' : '') + (chosen ? ' chosen' : '')} role="button" tabIndex={0}
      aria-label={label} onClick={act} onKeyDown={onEnter(act)}>
      <title>{label}</title>
      <rect className="fridge-hit" x={x} y={y} width={w} height={h} rx="6" />
      {children}
    </g>
  );
}

// chosen — bosilgan ovqatning joyi (yeyish yoki olib chiqish uchun)
export function OpenFridge({ byId = {}, items = {}, selected = null, chosen = null, onSlot }) {
  const pick = byId[selected];
  const put = pick ? `Shu yerga qo'yish: ${pick.name}` : '';
  const take = (f) => `Tanlash: ${f.name}`;

  const shelves = [];
  for (let r = 0; r < ROWS; r++) {
    const top = IN_Y + r * ROW_H + 3, floor = rowFloor(r);
    const big = byId[items[cellSlot(r, 0)]]?.kind === 'big' ? byId[items[cellSlot(r, 0)]] : null;
    if (big || canPlace(pick?.kind === 'big' ? pick : null, cellSlot(r, 0), items, byId)) {
      // katta ovqat: butun qator bitta joy
      const slot = cellSlot(r, 0);
      shelves.push(
        <Slot key={slot} slot={slot} chosen={chosen === slot} food={big} target={!big} label={big ? take(big) : put}
          x={IN_X + 3} y={top} w={IN_W - 6} h={floor - top + 2} onSlot={onSlot}>
          {big && <FoodArt food={big} x={IN_X + (IN_W - 140) / 2} y={floor - 53} />}
        </Slot>,
      );
      if (big) continue;
    }
    for (let c = 0; c < COLS; c++) {
      const slot = cellSlot(r, c), f = byId[items[slot]];
      const x = IN_X + c * COL_W;
      shelves.push(
        <Slot key={slot} slot={slot} chosen={chosen === slot} food={f} target={!f && pick?.kind === 'small' && canPlace(pick, slot, items, byId)}
          label={f ? take(f) : put} x={x + 2} y={top} w={COL_W - 4} h={floor - top + 2} onSlot={onSlot}>
          {f && <FoodArt food={f} x={x + (COL_W - 44) / 2} y={floor - 45} />}
        </Slot>,
      );
    }
  }

  const door = [];
  DOOR.forEach((type, d) => {
    for (let s = 0; s < DOOR_SLOTS; s++) {
      const slot = doorSlot(d, s), f = byId[items[slot]];
      const x = DOOR_X + s * DOOR_SLOT_W;
      const [w, h] = SIZE[type];
      door.push(
        <Slot key={slot} slot={slot} chosen={chosen === slot} food={f} target={!f && canPlace(pick, slot, items, byId)}
          label={f ? take(f) : put} x={x} y={DOOR_TOP[d]} w={DOOR_SLOT_W} h={DOOR_FLOOR[d] - DOOR_TOP[d] + 2} onSlot={onSlot}>
          {f && <FoodArt food={f} x={x + (DOOR_SLOT_W - w) / 2} y={DOOR_FLOOR[d] - h} />}
        </Slot>,
      );
    }
  });

  return (
    <>
      <rect x="1410" y="270" width="180" height="380" rx="14" fill="#d5dde2" />
      {/* muzlatkich (tepadagi) eshigi yopiq qoladi */}
      <rect x="1418" y="278" width="164" height="96" rx="9" fill="#f2f6f8" />
      <rect x="1428" y="296" width="8" height="54" rx="4" fill="#9fb0bb" />
      {/* ichki qism va chiroq */}
      <rect x="1418" y="382" width="164" height="258" rx="9" fill="#b9ccd8" />
      <rect x={IN_X} y={IN_Y} width={IN_W} height={ROWS * ROW_H - 2} rx="6" fill="#e6f2f8" />
      <ellipse cx="1500" cy="392" rx="62" ry="12" fill="#fffbe0" opacity=".9" />
      {[0, 1, 2].map((r) => (
        <rect key={r} x={IN_X} y={rowFloor(r)} width={IN_W} height="5" fill="#bfdbea" stroke="#94bcd2" strokeWidth="1.5" />
      ))}
      {shelves}
      {/* ochiq eshik (o'ng tomonga ochilgan), ichki tomonida ichimlik javonlari */}
      <polygon points="1590,380 1706,366 1706,656 1590,644" fill="#d5dde2" />
      <polygon points="1595,388 1701,376 1701,648 1595,638" fill="#eef3f6" />
      {door}
      <g pointerEvents="none">
        {DOOR_FLOOR.map((y) => (
          <rect key={y} x="1595" y={y - 16} width="106" height="18" rx="3" fill="rgba(186,218,236,.65)" stroke="#94bcd2" strokeWidth="2" />
        ))}
      </g>
      <rect x="1424" y="648" width="20" height="12" fill="#6f7d86" />
      <rect x="1556" y="648" width="20" height="12" fill="#6f7d86" />
    </>
  );
}

/* ---- Pastdagi panel: sotib olingan, hali muzlatgichga solinmagan ovqatlar ---- */
const minutesLeft = (at, now) => Math.max(0, Math.ceil((at - now) / 60000));

// groups — [{ food, count, spoilsAt }]: muzlatgichdan tashqaridagi ovqatlar, ovqat bo'yicha
// chosen — muzlatgichda bosilgan ovqat (food); satiety — to'qlik foizi
export function FridgePanel({ groups, byId, items, selected, now, onSelect, onDiscard, status, onClose, chosen, satiety, onEat, onTakeOut }) {
  const pick = byId[selected];
  const full = satiety != null && satiety >= 99.5;
  const spoiled = pick && pick.price == null;
  let hint = groups.length
    ? "Ovqatni tanlang va muzlatgichga qo'ying. Yeyish uchun muzlatgichdagi ovqatni bosing"
    : "Yeyish uchun muzlatgichdagi ovqatni bosing. Yangi ovqatni telefondagi Eats ilovasidan sotib oling";
  if (spoiled) hint = "Aynigan ovqatni muzlatgichga solib bo'lmaydi";
  else if (pick) {
    if (!hasRoom(pick, items, byId)) hint = `${pick.name} uchun joy qolmadi`;
    else if (pick.kind === 'big') hint = "Katta ovqat: bo'sh qatorni bosing";
    else if (pick.kind === 'small') hint = "Kichik ovqat: yashil joylardan birini bosing";
    else hint = `Eshikdagi ${pick.subtype === 'can' ? 'banka' : 'butilka'} javonini bosing`;
  }
  if (chosen) {
    const fill = chosen.kind === 'big' ? "qornini to'liq to'ydiradi" : chosen.kind === 'small' ? "+35% to'qlik" : "+30% to'qlik";
    hint = full ? `${chosen.name}: Sardorning qorni to'q` : `${chosen.name}: ${fill}`;
  }
  return (
    <div className="fridge-panel" role="region" aria-label="Muzlatgich">
      <div className="fridge-bar">
        <span className="hint" aria-live="polite">{status || hint}</span>
        {spoiled && !chosen && <button className="danger" onClick={() => onDiscard(selected)}>Tashlash</button>}
        {chosen && <button className="eat-btn" onClick={onEat} disabled={full}>Yeyish</button>}
        {chosen && <button className="secondary" onClick={onTakeOut}>Olib chiqish</button>}
        <button className="secondary" onClick={onClose}>Yopish</button>
      </div>
      {groups.length > 0 && (
        <div className="food-list">
          {groups.map(({ food, count, spoilsAt }) => {
            const f = byId[food];
            if (!f) return null;
            const left = spoilsAt != null ? minutesLeft(spoilsAt, now) : null;
            return (
              <button key={food} className={'food-btn' + (selected === food ? ' on' : '') + (f.price == null ? ' spoiled' : '')}
                aria-pressed={selected === food} onClick={() => onSelect(selected === food ? null : food)}>
                <FoodIcon food={f} />
                <span className="food-name">{f.name}</span>
                <span className={'food-kind' + (left != null && left <= 10 ? ' soon' : '')}>
                  {count > 1 ? `×${count} · ` : ''}{f.price == null ? 'aynigan' : left != null ? `${left} daq` : kindLabel(f)}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
