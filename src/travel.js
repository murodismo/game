// Lokatsiyalar qoidasi (har yangi joy shunga amal qiladi):
// 1. Har lokatsiyaning TASHQI ko'rinishi bor (majburiy), unda avtobus bekati turadi.
//    ICHKI qismi ixtiyoriy (uy, restoran). Bitta ekranli joy ham bo'lishi mumkin (kuryer xizmati).
// 2. Avtobusda kelgan Sardor har doim manzilning tashqarisida, bekat yonida paydo bo'ladi,
//    ichkariga o'sha yerdan yurib kiradi.
// 3. Ish tugagach Sardor ichkaridan tashqariga chiqadi; boshqa joyga faqat bekat orqali ketadi.

// Har joyning tashqi ko'rinishi qaysi sahifada (uy tashqarisi — ko'cha)
export const PLACE_PATHS = {
  home: '/street',
  courier: '/work/courier',
  waiter: '/work/waiter',
  hospital: '/hospital',
};

// Avtobusda boshqa joyga borish. Uy tanlansa Sardor ko'chadagi bekatda tushib, uyga yurib kiradi
export function travel(navigate, place) {
  navigate(PLACE_PATHS[place], { state: { arrive: 'bus', enter: place === 'home' } });
}

// Sahifa avtobusdan tushgan holda ochildimi (location.state)
export const byBus = (location) => location.state?.arrive === 'bus';
