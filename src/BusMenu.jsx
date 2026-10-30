import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from './api.js';
import { PLACE_PATHS, travel } from './travel.js';

// Avtobus bekati menyusi: yo'nalishlar, "Ish" ichida ishlar, boshqa yo'nalishlar ichida joylar (hammasi backenddan).
// Har joyga avtobusda boriladi: Sardor manzilning tashqarisida, bekat yonida paydo bo'ladi (travel.js).
// onHome — ko'chada "Uy" tanlanganda (yo'q bo'lsa avtobusda ko'chaga borib uyga kiradi),
// here — Sardor hozir turgan joy (shu joy tanlansa menyu shunchaki yopiladi)
export default function BusMenu({ onClose, onHome, here }) {
  const navigate = useNavigate();
  const [menu, setMenu] = useState({ list: null }); // { list, view, jobs, places, title, soon, error }

  useEffect(() => {
    api('/destinations')
      .then((d) => setMenu((m) => ({ ...m, list: d.destinations })))
      .catch((err) => setMenu((m) => ({ ...m, error: err.message })));
  }, []);

  // Esc menyuni yopadi
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // "Uy" — Sardor uyga qaytadi; "Ish" — ishlar ro'yxati; qolganlarida joylar bo'lsa ro'yxati ochiladi
  function pick(dest) {
    if (dest.slug === 'home') return onHome ? onHome() : travel(navigate, 'home');
    if (dest.slug === 'work') return openJobs();
    setMenu((m) => ({ ...m, soon: null, error: null }));
    api(`/destinations/${dest.slug}/locations`)
      .then((d) => setMenu((m) => (d.locations.length
        ? { ...m, view: 'places', title: dest.name, places: d.locations }
        : { ...m, soon: dest.name })))
      .catch((err) => setMenu((m) => ({ ...m, error: err.message })));
  }

  function openJobs() {
    setMenu((m) => ({ ...m, view: 'jobs', jobs: null, soon: null, error: null }));
    api('/jobs')
      .then((d) => setMenu((m) => ({ ...m, jobs: d.jobs })))
      .catch((err) => setMenu((m) => ({ ...m, error: err.message })));
  }

  // Kuryer va Ofitsiant — o'z sahifasi bor; boshqa ishlar keyin qo'shiladi
  function pickJob(job) {
    if (job.slug === here) return onClose();
    if (job.slug === 'courier' || job.slug === 'waiter') return travel(navigate, job.slug);
    setMenu((m) => ({ ...m, soon: job.name }));
  }

  function pickPlace(place) {
    if (place.slug === here) return onClose();
    if (PLACE_PATHS[place.slug]) return travel(navigate, place.slug);
    setMenu((m) => ({ ...m, soon: place.name }));
  }

  const items = menu.view === 'jobs' ? menu.jobs : menu.view === 'places' ? menu.places : menu.list;
  const onItem = menu.view === 'jobs' ? pickJob : menu.view === 'places' ? pickPlace : pick;
  const title = menu.view === 'jobs' ? 'Ishlar' : menu.view === 'places' ? menu.title : 'Qayerga boramiz?';

  return (
    <div className="bus-overlay" onClick={onClose}>
      <div className="bus-menu" role="dialog" aria-modal="true" aria-labelledby="bus-title" onClick={(e) => e.stopPropagation()}>
        <button className="bus-close" aria-label="Yopish" onClick={onClose}>×</button>
        {menu.view && (
          <button className="bus-back" onClick={() => setMenu((m) => ({ ...m, view: null, soon: null, error: null }))}>‹ Orqaga</button>
        )}
        <h2 id="bus-title">{title}</h2>
        {menu.error && <p className="bus-note">{menu.error}</p>}
        {!items && !menu.error && <p className="bus-note">Yuklanmoqda...</p>}
        {items && (
          <div className="bus-grid" key={menu.view || 'main'}>
            {items.map((d, i) => (
              <button key={d.id} className="bus-dest" onClick={() => onItem(d)} autoFocus={i === 0}>
                <span className="bus-icon" aria-hidden="true">{d.icon}</span>
                {d.name}
              </button>
            ))}
          </div>
        )}
        {menu.soon && <p className="bus-note">{menu.soon}: tez orada ochiladi</p>}
      </div>
    </div>
  );
}
