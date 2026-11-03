import { useCallback, useEffect, useRef, useState } from 'react';
import { API_URL } from './config.js';

// Render bepul serveri ~15 daqiqa harakatsizlikdan keyin uxlaydi, uyg'onishi 30–60s oladi.
// Sahifa ochilganda /api/health'ga ping yuboriladi; javob kelguncha o'yin o'rniga loader ko'rinadi.
const ATTEMPT_TIMEOUT = 15000; // bitta so'rov uchun kutish
const RETRY_DELAY = 3000; // muvaffaqiyatsiz urinishdan keyingi pauza
const GIVE_UP_AFTER = 120000; // shundan keyin "Qayta urinish" tugmasi chiqadi
const SHOW_AFTER = 400; // lokalda server darhol javob bersa, loader miltillamasin
const EXPECTED = 60000; // progress chizig'i shu vaqtga mo'ljallangan

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function ping() {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ATTEMPT_TIMEOUT);
  try {
    const res = await fetch(`${API_URL}/api/health`, { cache: 'no-store', signal: ctrl.signal });
    // 502/503/504 — Render proksisi javob berdi, lekin server hali ko'tarilmagan
    return ![502, 503, 504].includes(res.status);
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

const TIPS = [
  "Sardor ko'zini ochyapti...",
  'Avtobuslar bekatga chiqmoqda...',
  "Do'konlar eshigini ochmoqda...",
  'Kuryerlar skuterini o\'t oldirmoqda...',
  'Oshxonada choynak qaynamoqda...',
];

export default function ServerGate({ children }) {
  const [status, setStatus] = useState('waking'); // waking | ready | failed
  const [visible, setVisible] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [run, setRun] = useState(0);
  const startRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    startRef.current = Date.now();
    setStatus('waking');
    setElapsed(0);
    const showTimer = setTimeout(() => setVisible(true), SHOW_AFTER);
    const tick = setInterval(() => setElapsed(Date.now() - startRef.current), 250);

    (async () => {
      while (!cancelled) {
        if (await ping()) {
          if (!cancelled) setStatus('ready');
          return;
        }
        if (Date.now() - startRef.current > GIVE_UP_AFTER) {
          if (!cancelled) setStatus('failed');
          return;
        }
        await sleep(RETRY_DELAY);
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(showTimer);
      clearInterval(tick);
    };
  }, [run]);

  const retry = useCallback(() => setRun((n) => n + 1), []);

  if (status === 'ready') return children;
  if (!visible && status === 'waking') return null;

  const secs = Math.floor(elapsed / 1000);
  // chiziq 60s da ~90% ga yetadi va to'lib qolmaydi
  const progress = status === 'failed' ? 100 : Math.round(100 * (1 - Math.exp(-2.3 * (elapsed / EXPECTED))));
  const tip = TIPS[Math.floor(secs / 6) % TIPS.length];
  const failed = status === 'failed';

  return (
    <div className="server-gate" role="status" aria-live="polite">
      <div className={`sg-card${failed ? ' failed' : ''}`}>
        <div className="sg-sun" aria-hidden="true">
          <span className="sg-ray" />
          <span className="sg-face">{failed ? '😴' : '☀️'}</span>
        </div>
        <h1>{failed ? 'Server javob bermadi' : "Shahar uyg'onmoqda"}</h1>
        {failed ? (
          <p className="sg-text">Internetni tekshirib, qaytadan urinib ko'ring.</p>
        ) : (
          <p className="sg-text">
            {secs < 5 ? 'Serverga ulanmoqda...' : tip}
          </p>
        )}
        <div className="sg-bar" aria-hidden="true">
          <span style={{ width: `${progress}%` }} />
        </div>
        {failed ? (
          <button type="button" onClick={retry}>Qayta urinish</button>
        ) : (
          <p className="sg-hint">
            {secs >= 5 ? `Birinchi ochilish 1 daqiqagacha olishi mumkin · ${secs}s` : ' '}
          </p>
        )}
      </div>
    </div>
  );
}
