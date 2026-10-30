// Muzlatgich tuzilishi va joylashtirish qoidalari (server/index.js dagi checkFridge bilan bir xil).
// Javonda 4 qator, har qatorda 3 joy: katta ovqat butun qatorni oladi, kichik ovqat bitta joyni.
// Eshikda 3 ta javon: yuqorisi bankalar uchun, pastki ikkitasi butilkalar uchun.
export const ROWS = 4;
export const COLS = 3;
export const DOOR = ['can', 'bottle', 'bottle'];
export const DOOR_SLOTS = 3;

export const cellSlot = (row, col) => `r${row}c${col}`;
export const doorSlot = (shelf, pos) => `d${shelf}s${pos}`;

// items — { slot: foodId }, byId — { foodId: food }
export function rowHasBig(items, byId, row) {
  return byId[items[cellSlot(row, 0)]]?.kind === 'big';
}

export function rowEmpty(items, row) {
  for (let c = 0; c < COLS; c++) if (items[cellSlot(row, c)] != null) return false;
  return true;
}

// Tanlangan ovqatni shu joyga qo'yish mumkinmi
export function canPlace(food, slot, items, byId) {
  if (!food || items[slot] != null) return false;
  let m;
  if ((m = /^r(\d)c(\d)$/.exec(slot))) {
    const row = Number(m[1]), col = Number(m[2]);
    if (food.kind === 'big') return col === 0 && rowEmpty(items, row);
    if (food.kind === 'small') return !rowHasBig(items, byId, row);
    return false;
  }
  if ((m = /^d(\d)s(\d)$/.exec(slot))) {
    return food.kind === 'drink' && food.subtype === DOOR[Number(m[1])];
  }
  return false;
}

// Bo'sh joy bormi (panelda "joy yo'q" belgisini ko'rsatish uchun)
export function hasRoom(food, items, byId) {
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (canPlace(food, cellSlot(r, c), items, byId)) return true;
  for (let d = 0; d < DOOR.length; d++) for (let s = 0; s < DOOR_SLOTS; s++) if (canPlace(food, doorSlot(d, s), items, byId)) return true;
  return false;
}

export const kindLabel = (f) =>
  f.kind === 'big' ? 'katta' : f.kind === 'small' ? 'kichik' : f.subtype === 'can' ? 'banka' : 'butilka';
