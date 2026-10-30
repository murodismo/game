import { useEffect, useRef, useState } from 'react';
import { Fridge, OpenFridge } from './Fridge.jsx';

// Sardorning xonasi: oddiy 2D (SVG) rasm.
// Ikki joylashuv bor: keng ekran (kompyuter) va tik ekran (telefon). SVG "meet" bilan chiziladi,
// shuning uchun buyumlar hech qachon kesilmaydi; ortiqcha joyni devor va pol to'ldiradi.

export const LAYOUTS = {
  land: {
    y0: 0, w: 1600, h: 900, floorY: 650,
    feetX: 800, feetY: 760, sardorH: 470,
    wardrobe: 'translate(20 0)',
    window: 'translate(60 0)',
    bed: 'translate(-70 0)',
    rug: '',
    fridge: '',
    // javon ochilganda: Sardor javon yonida turadi, kamera shu sohaga yaqinlashadi
    wardrobeFeet: [520, 700],
    // karavotda yotganda: tana markazi va bo'yi; zzz buluti boshi tepasida
    bedSleep: { cx: 1192, cy: 532, h: 325 },
    zzz: [1365, 420, 1],
    zoomBox: [10, 110, 690, 740],
    // muzlatgich ochilganda: Sardor uning chap yonida turadi
    fridgeFeet: [1300, 700],
    fridgeZoom: [1180, 225, 1725, 735],
    labels: { size: 26, wardrobe: [220, 150], window: [620, 100], bed: [1194, 410], fridge: [1500, 250] },
    beam: '460,160 780,160 740,870 460,870 390,690',
    patch: '390,690 670,690 740,870 460,870',
    beamLines: [[530, 690, 600, 870], [432, 798, 712, 798]],
  },
  port: {
    // y0 < 0: tepada panel uchun bo'sh devor qoldiriladi (past telefonlarda derazani yopmasin)
    y0: -260, w: 900, h: 1860, floorY: 1150,
    feetX: 450, feetY: 1350, sardorH: 460,
    wardrobe: 'translate(2.56 650.2) scale(.78)',
    window: 'translate(-194 14.3) scale(1.15)',
    bed: 'translate(-191.96 692.6) scale(.72)',
    rug: 'translate(-270 666.8) scale(.9)',
    fridge: 'translate(-702 703) scale(.7)',
    wardrobeFeet: [405, 1250],
    bedSleep: { cx: 727, cy: 1072, h: 234 },
    zzz: [790, 960, 0.85],
    zoomBox: [5, 730, 545, 1275],
    // telefonda muzlatgich kattaroq ko'rinsin: Sardor ekrandan chetga chiqib turadi
    fridgeFeet: [620, 1250],
    fridgeZoom: [270, 855, 515, 1180],
    labels: { size: 40, wardrobe: [158, 765], window: [450, 610], bed: [718, 990], fridge: [348, 860] },
    beam: '266,190 634,190 470,1420 190,1420 120,1210',
    patch: '120,1210 400,1210 470,1420 190,1420',
    beamLines: [[260, 1210, 330, 1420], [162, 1336, 442, 1336]],
  },
};

// Ekran nisbatiga qarab joylashuvni tanlash
export function pickLayout(w, h) {
  return w / h < 1 ? 'port' : 'land';
}

function Planks({ L }) {
  const lines = [];
  for (let r = 0, y = L.floorY; y < L.y0 + L.h + 400; r++, y += 42) {
    lines.push(<line key={'h' + r} x1="-3000" y1={y} x2="5000" y2={y} />);
    for (let x = (r % 2) * 130 - 1000; x < L.w + 1000; x += 260) {
      lines.push(<line key={`v${r}-${x}`} x1={x} y1={y} x2={x} y2={y + 42} />);
    }
  }
  return <g stroke="#8a5534" strokeOpacity=".35" strokeWidth="2">{lines}</g>;
}

const onEnter = (fn) => (e) => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); }
};

// Bosiladigan buyum: sichqoncha, klaviatura (Enter/Probel) va barmoq bilan ishlaydi
function Hotspot({ id, label, path, onOpen, disabled, children }) {
  return (
    <g className={'hotspot' + (disabled ? ' disabled' : '')} data-spot={id} role="button" tabIndex={disabled ? -1 : 0} aria-label={label}
      onClick={() => onOpen(path)} onKeyDown={onEnter(() => onOpen(path))}>
      <title>{label}</title>
      {children}
    </g>
  );
}

function Wardrobe() {
  return (
    <>
      <rect x="60" y="230" width="280" height="420" rx="6" fill="#9a643e" />
      <rect x="48" y="214" width="304" height="26" rx="5" fill="#835232" />
      <rect x="78" y="252" width="118" height="370" rx="4" fill="#b07548" />
      <rect x="204" y="252" width="118" height="370" rx="4" fill="#b07548" />
      <rect x="94" y="270" width="86" height="160" rx="4" fill="none" stroke="#93603b" strokeWidth="4" />
      <rect x="94" y="446" width="86" height="160" rx="4" fill="none" stroke="#93603b" strokeWidth="4" />
      <rect x="220" y="270" width="86" height="160" rx="4" fill="none" stroke="#93603b" strokeWidth="4" />
      <rect x="220" y="446" width="86" height="160" rx="4" fill="none" stroke="#93603b" strokeWidth="4" />
      <rect x="183" y="410" width="8" height="46" rx="4" fill="#f1d38a" />
      <rect x="209" y="410" width="8" height="46" rx="4" fill="#f1d38a" />
      <rect x="72" y="640" width="22" height="20" fill="#6e4329" />
      <rect x="306" y="640" width="22" height="20" fill="#6e4329" />
      <rect x="110" y="170" width="120" height="44" rx="4" fill="#d9b98a" />
      <line x1="110" y1="188" x2="230" y2="188" stroke="#c49f6f" strokeWidth="3" />
    </>
  );
}

/* ---- Ochiq kiyim javoni va ichidagi kiyimlar ---- */
const SLOTS = [118, 200, 282]; // har qatordagi 3 ta kiyimning markazi (x)

function ShirtArt({ cx, y, c, id }) {
  const d = `M${cx - 18} ${y} L${cx - 36} ${y + 12} L${cx - 29} ${y + 34} L${cx - 22} ${y + 30} L${cx - 22} ${y + 88} L${cx + 22} ${y + 88} L${cx + 22} ${y + 30} L${cx + 29} ${y + 34} L${cx + 36} ${y + 12} L${cx + 18} ${y} Q${cx} ${y + 12} ${cx - 18} ${y}Z`;
  return (
    <>
      <path d={`M${cx} ${y - 14} l0 -6 M${cx - 26} ${y + 4} L${cx} ${y - 12} L${cx + 26} ${y + 4}`} stroke="#d8d2c4" strokeWidth="3" fill="none" />
      <clipPath id={'shirt-' + id}><path d={d} /></clipPath>
      <path d={d} fill={c.shirt} stroke="rgba(0,0,0,.35)" strokeWidth="2" />
      <g clipPath={`url(#shirt-${id})`}>
        {c.pattern === 'stripes' && [y + 26, y + 46, y + 66].map((sy) => <rect key={sy} x={cx - 40} y={sy} width="80" height="8" fill={c.accent} />)}
        {c.pattern === 'star' && <polygon points={starPoints(cx, y + 50, 13)} fill={c.accent} />}
      </g>
    </>
  );
}

function starPoints(cx, cy, r) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r;
    pts.push(`${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr).toFixed(1)}`);
  }
  return pts.join(' ');
}

function PantsArt({ cx, y, c }) {
  return (
    <>
      <path d={`M${cx - 24} ${y} h48 l5 98 h-21 l-8 -62 l-8 62 h-21z`} fill={c.pants} stroke="rgba(0,0,0,.35)" strokeWidth="2" />
      <rect x={cx - 24} y={y} width="48" height="9" fill="rgba(0,0,0,.18)" />
    </>
  );
}

function ShoesArt({ cx, y, c }) {
  return (
    <>
      {[-15, 15].map((dx) => (
        <g key={dx}>
          <rect x={cx + dx - 14} y={y} width="30" height="20" rx="10" fill={c.shoe} stroke="rgba(0,0,0,.35)" strokeWidth="2" />
          <rect x={cx + dx - 15} y={y + 17} width="32" height="7" rx="3.5" fill={c.sole} />
          {c.laces && <line x1={cx + dx - 2} y1={y + 6} x2={cx + dx + 8} y2={y + 8} stroke="#f5f2e8" strokeWidth="2.5" />}
        </g>
      ))}
    </>
  );
}

const ROWS = [
  { type: 'shirt', y: 284, h: 100, Art: ShirtArt },
  { type: 'pants', y: 408, h: 104, Art: PantsArt },
  { type: 'shoes', y: 570, h: 30, Art: ShoesArt },
];

const PER_PAGE = 3;
const SLIDE_MS = 420;

// Bitta sahifadagi kiyimlar: har qatorda shu turdagi 3 ta kiyim
function ClothesPage({ clothes, page, selected, onPick, active, className }) {
  return (
    <g className={className} pointerEvents={active ? undefined : 'none'} aria-hidden={active ? undefined : true}>
      {ROWS.map(({ type, y, h, Art }) =>
        clothes.filter((c) => c.type === type).slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE).map((c, i) => {
          const cx = SLOTS[i], on = selected[type] === c.id;
          return (
            <g key={c.id} className={'cloth' + (on ? ' on' : '')} role="button" tabIndex={active ? 0 : -1} aria-label={c.name} aria-pressed={on}
              onClick={() => onPick(c)} onKeyDown={onEnter(() => onPick(c))}>
              <title>{c.name}</title>
              <rect className="cloth-hit" x={cx - 40} y={y - 22} width="80" height={h + 30} rx="8" />
              <Art cx={cx} y={y} c={c.colors} id={c.id} />
            </g>
          );
        }),
      )}
    </g>
  );
}

// Javon tepasidagi kichik ekran: ‹ 2 / 5 ›
function PageScreen({ page, pages, onPage }) {
  const arrow = (dir, cx) => {
    const off = dir < 0 ? page === 0 : page >= pages - 1;
    return (
      <g className={'page-arrow' + (off ? ' off' : '')} role="button" tabIndex={off ? -1 : 0} aria-disabled={off}
        aria-label={dir < 0 ? 'Oldingi sahifa' : 'Keyingi sahifa'}
        onClick={() => !off && onPage(dir)} onKeyDown={onEnter(() => !off && onPage(dir))}>
        <circle className="page-arrow-hit" cx={cx} cy="217" r="22" />
        <circle className="page-arrow-btn" cx={cx} cy="217" r="14" />
        <path d={dir < 0 ? `M${cx + 3} 209 l-8 8 l8 8` : `M${cx - 3} 209 l8 8 l-8 8`} fill="none" stroke="#fdf3dc" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    );
  };
  return (
    <g>
      <rect x="108" y="194" width="184" height="46" rx="12" fill="#835232" />
      <rect x="150" y="201" width="100" height="32" rx="7" fill="#2a1d14" stroke="#4a3322" strokeWidth="2" />
      <rect x="153" y="204" width="94" height="10" rx="5" fill="rgba(255,210,122,.08)" />
      <text x="200" y="224" textAnchor="middle" className="page-text" aria-live="polite">{page + 1} / {pages}</text>
      {arrow(-1, 129)}
      {arrow(1, 271)}
    </g>
  );
}

function OpenWardrobe({ clothes, selected, onPick, page = 0, pages = 1, onPage }) {
  // sahifa almashganda eski sahifa chiqib ketadi, yangisi kirib keladi
  const prev = useRef(page);
  const [slide, setSlide] = useState(null); // { from, dir }
  useEffect(() => {
    if (prev.current === page) return;
    setSlide({ from: prev.current, dir: page > prev.current ? 'next' : 'prev' });
    prev.current = page;
    const t = setTimeout(() => setSlide(null), SLIDE_MS);
    return () => clearTimeout(t);
  }, [page]);

  return (
    <>
      <rect x="60" y="166" width="280" height="484" rx="6" fill="#9a643e" />
      <rect x="48" y="150" width="304" height="26" rx="5" fill="#835232" />
      <rect x="78" y="186" width="244" height="436" rx="4" fill="#5e3d27" />
      <PageScreen page={page} pages={pages} onPage={onPage} />
      <rect x="78" y="246" width="244" height="6" fill="#835232" />
      <rect x="84" y="270" width="232" height="6" rx="3" fill="#c9b18a" />
      <rect x="78" y="520" width="244" height="10" fill="#835232" />
      <rect x="72" y="640" width="22" height="20" fill="#6e4329" />
      <rect x="306" y="640" width="22" height="20" fill="#6e4329" />
      {/* ochiq eshiklar */}
      <polygon points="78,186 22,170 22,640 78,622" fill="#b07548" stroke="#93603b" strokeWidth="3" />
      <polygon points="322,186 378,170 378,640 322,622" fill="#b07548" stroke="#93603b" strokeWidth="3" />
      <rect x="64" y="410" width="6" height="40" rx="3" fill="#f1d38a" />
      <rect x="330" y="410" width="6" height="40" rx="3" fill="#f1d38a" />
      <g clipPath="url(#wardrobe-inside)">
        {slide && (
          <ClothesPage key={'p' + slide.from} clothes={clothes} page={slide.from} selected={selected} onPick={onPick}
            active={false} className={'page-out ' + slide.dir} />
        )}
        <ClothesPage key={'p' + page} clothes={clothes} page={page} selected={selected} onPick={onPick}
          active className={slide ? 'page-in ' + slide.dir : ''} />
      </g>
    </>
  );
}

// Oq bulut ichida sariq "Z z z" — harflar navbat bilan ko'tarilib, so'nadi
function ZzzBubble({ x, y, s }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} className="zzz" pointerEvents="none">
      <circle cx="-62" cy="78" r="7" fill="#fff" />
      <circle cx="-44" cy="58" r="11" fill="#fff" />
      <g className="zzz-cloud">
        <g fill="#fff" stroke="#d8dde6" strokeWidth="3">
          <circle cx="-30" cy="6" r="30" /><circle cx="6" cy="-12" r="36" /><circle cx="44" cy="2" r="30" /><circle cx="10" cy="22" r="28" />
        </g>
        <g fill="#fff"><circle cx="-30" cy="6" r="27" /><circle cx="6" cy="-12" r="33" /><circle cx="44" cy="2" r="27" /><circle cx="10" cy="22" r="25" /></g>
        <g className="zzz-letters" fill="#f3c623" stroke="#b8860b" strokeWidth="1.5" fontWeight="800" fontFamily="system-ui, sans-serif">
          <text x="-34" y="22" fontSize="30">Z</text>
          <text x="0" y="6" fontSize="24">z</text>
          <text x="28" y="-8" fontSize="19">z</text>
        </g>
      </g>
    </g>
  );
}

function Window({ closed }) {
  return (
    <>
      <rect x="400" y="150" width="320" height="300" fill="url(#sky)" />
      <g fill="#fff" opacity=".95">
        <circle cx="460" cy="210" r="26" /><circle cx="495" cy="198" r="32" /><circle cx="530" cy="212" r="24" />
        <circle cx="640" cy="260" r="18" /><circle cx="662" cy="252" r="22" />
      </g>
      <g clipPath="url(#glass)">
        <ellipse cx="470" cy="455" rx="150" ry="40" fill="#86c46a" />
        <ellipse cx="660" cy="460" rx="130" ry="38" fill="#6fb257" />
      </g>
      <g fill="none" stroke="#fdfbf6" strokeWidth="14">
        <rect x="400" y="150" width="320" height="300" />
        <line x1="560" y1="150" x2="560" y2="450" />
        <line x1="400" y1="270" x2="720" y2="270" />
      </g>
      <rect x="380" y="448" width="360" height="16" rx="4" fill="#fdfbf6" />
      {/* pardalar */}
      <rect x="350" y="118" width="420" height="8" rx="4" fill="#8a6a50" />
      {/* yopilganda har bir parda derazaning yarmigacha cho'ziladi (CSS scaleX) */}
      <g className={'curtain left' + (closed ? ' closed' : '')}>
        <path d="M352 126 h56 v346 q-28 12 -56 0z" fill="#6f9fd6" />
        <g stroke="#5a88c0" strokeWidth="3"><line x1="372" y1="130" x2="372" y2="468" /><line x1="390" y1="130" x2="390" y2="468" /></g>
      </g>
      <g className={'curtain right' + (closed ? ' closed' : '')}>
        <path d="M712 126 h56 v346 q-28 12 -56 0z" fill="#6f9fd6" />
        <g stroke="#5a88c0" strokeWidth="3"><line x1="732" y1="130" x2="732" y2="468" /><line x1="750" y1="130" x2="750" y2="468" /></g>
      </g>
    </>
  );
}

function Bed() {
  return (
    <>
      <rect x="1440" y="430" width="28" height="240" rx="8" fill="#8f5b37" />
      <rect x="1060" y="540" width="26" height="130" rx="8" fill="#8f5b37" />
      <rect x="1070" y="580" width="390" height="56" rx="8" fill="#a86d43" />
      <rect x="1080" y="540" width="370" height="46" rx="14" fill="#fbfaf5" />
      <ellipse cx="1385" cy="534" rx="58" ry="22" fill="#ffffff" stroke="#e6e2d6" strokeWidth="3" />
      <path d="M1076 540 h252 q12 0 12 12 v52 h-264z" fill="#e7884d" />
      <rect x="1076" y="560" width="264" height="10" fill="#f3d36b" />
      <rect x="1080" y="636" width="20" height="34" fill="#7a4b2c" />
      <rect x="1430" y="636" width="20" height="34" fill="#7a4b2c" />
    </>
  );
}

function Rug() {
  return (
    <>
      <ellipse cx="800" cy="768" rx="250" ry="62" fill="#5b7fc4" />
      <ellipse cx="800" cy="768" rx="220" ry="50" fill="#e9e1cf" />
      <ellipse cx="800" cy="768" rx="200" ry="44" fill="#5b7fc4" />
      <ellipse cx="800" cy="768" rx="140" ry="30" fill="#f0c34a" />
      <ellipse cx="800" cy="768" rx="118" ry="24" fill="#5b7fc4" />
    </>
  );
}

// mode: 'room' | 'wardrobe' | 'fridge'
// wardrobe — javon ma'lumotlari: { clothes, selected, onPick, page, pages, onPage }
// fridge — muzlatgich ma'lumotlari: { byId, items, selected, onSlot }
export default function RoomBackdrop({ layout = 'land', onOpen, mode = 'room', dark = false, asleep = false, wardrobe = {}, fridge = {} }) {
  const open = mode !== 'room';
  const L = LAYOUTS[layout];
  const lb = L.labels;
  const feet = mode === 'wardrobe' ? L.wardrobeFeet : mode === 'fridge' ? L.fridgeFeet : [L.feetX, L.feetY];
  return (
    <svg className={'room' + (open ? ' zoomed' : '')} viewBox={`0 ${L.y0} ${L.w} ${L.h}`} preserveAspectRatio="xMidYMax meet">
      <defs>
        <pattern id="wallpaper" width="60" height="60" patternUnits="userSpaceOnUse">
          <rect width="60" height="60" fill="#f3e6cf" />
          <rect width="18" height="60" fill="#ecdcbf" />
          <circle cx="39" cy="30" r="3.5" fill="#e2c9a2" />
        </pattern>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7cc4f2" />
          <stop offset=".8" stopColor="#d9f0ff" />
          <stop offset="1" stopColor="#fff6d8" />
        </linearGradient>
        <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff3c4" stopOpacity=".55" />
          <stop offset="1" stopColor="#fff3c4" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="patch" cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#ffe9a8" stopOpacity=".75" />
          <stop offset="1" stopColor="#ffe9a8" stopOpacity=".35" />
        </radialGradient>
        <radialGradient id="shade" cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#3a2414" stopOpacity=".35" />
          <stop offset="1" stopColor="#3a2414" stopOpacity="0" />
        </radialGradient>
        <clipPath id="wardrobe-inside"><rect x="78" y="252" width="244" height="370" /></clipPath>
        <clipPath id="glass"><rect x="400" y="150" width="320" height="300" /></clipPath>
      </defs>

      {/* devor va pol (ekran qanchalik keng/baland bo'lsa ham to'ldiradi) */}
      <rect x="-3000" y="-3000" width="8000" height={3000 + L.floorY} fill="url(#wallpaper)" />
      <rect x="-3000" y={L.floorY} width="8000" height="3000" fill="#c88e62" />
      <Planks L={L} />
      <rect x="-3000" y={L.floorY - 20} width="8000" height="22" fill="#a7744e" />
      <rect x="-3000" y={L.floorY - 20} width="8000" height="4" fill="#c79770" />

      <Hotspot id="window" label={dark ? 'Pardani ochish' : 'Pardani yopish'} path="/window" onOpen={onOpen} disabled={open}>
        <g transform={L.window}><Window closed={dark} /></g>
      </Hotspot>
      {mode === 'wardrobe' ? (
        <g transform={L.wardrobe}><OpenWardrobe {...wardrobe} /></g>
      ) : (
        <Hotspot id="wardrobe" label="Kiyim javoni" path="/wardrobe" onOpen={onOpen} disabled={open}>
          <g transform={L.wardrobe}><Wardrobe /></g>
        </Hotspot>
      )}
      <Hotspot id="bed" label={asleep ? "Sardorni uyg'otish" : 'Sardorni uxlatish'} path="/bed" onOpen={onOpen} disabled={open}>
        <g transform={L.bed}><Bed /></g>
      </Hotspot>
      {mode === 'fridge' ? (
        <g transform={L.fridge}><OpenFridge {...fridge} /></g>
      ) : (
        <Hotspot id="fridge" label="Muzlatgich" path="/fridge" onOpen={onOpen} disabled={open}>
          <g transform={L.fridge}><Fridge /></g>
        </Hotspot>
      )}

      <g transform={L.rug}><Rug /></g>

      {/* derazadan tushgan quyosh nuri (bosishga xalaqit bermaydi) */}
      <g pointerEvents="none" className={'sunlight' + (dark ? ' off' : '')}>
        <polygon points={L.beam} fill="url(#beam)" />
        <polygon points={L.patch} fill="url(#patch)" />
        <g stroke="#c98d5c" strokeOpacity=".55" strokeWidth="10">
          {L.beamLines.map(([x1, y1, x2, y2], i) => <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />)}
        </g>
        <ellipse className={'sardor-shade' + (asleep ? ' hidden' : '')} cx={feet[0]} cy={feet[1] + 2} rx={L.sardorH * 0.23} ry={L.sardorH * 0.043} fill="url(#shade)" />
      </g>

      {asleep && <ZzzBubble x={L.zzz[0]} y={L.zzz[1]} s={L.zzz[2]} />}

      {/* buyum nomlari eng ustida (nur ostida qolib ketmasin) */}
      <g pointerEvents="none" fontSize={lb.size} textAnchor="middle" display={open ? 'none' : undefined}>
        {[['window', 'Deraza'], ['wardrobe', 'Kiyim javoni'], ['fridge', 'Muzlatgich'], ...(asleep ? [] : [['bed', 'Karavot']])].map(([id, text]) => (
          <text key={id} className={`hotspot-label label-${id}`} x={lb[id][0]} y={lb[id][1]}>{text}</text>
        ))}
      </g>
    </svg>
  );
}
