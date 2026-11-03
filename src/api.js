// Access token faqat xotirada saqlanadi (localStorage emas).
// Refresh token httpOnly cookie'da, uni brauzer o'zi yuboradi.
import { setVitals } from './vitals.js';
import { API_URL } from './config.js';

let accessToken = null;
let refreshPromise = null;

export function setAccessToken(token) {
  accessToken = token;
}

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}/api${path}`, {
    ...options,
    // backend boshqa domenda bo'lsa (Render), cookie yuborilishi uchun 'include' kerak
    credentials: API_URL ? 'include' : 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      ...options.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

// Bir vaqtda bir nechta so'rov 401 olsa ham, faqat bitta /refresh yuboriladi
export function refresh() {
  if (!refreshPromise) {
    refreshPromise = request('/refresh', { method: 'POST' })
      .then(({ res, data }) => {
        if (!res.ok) {
          accessToken = null;
          throw new Error(data.error || 'Sessiya tugagan');
        }
        accessToken = data.accessToken;
        return data;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

export async function api(path, options = {}) {
  let { res, data } = await request(path, options);

  // Access token muddati tugagan bo'lsa: yangilab, so'rovni qayta yuboramiz
  if (res.status === 401 && data.code === 'TOKEN_EXPIRED') {
    await refresh();
    ({ res, data } = await request(path, options));
  }

  // server o'lim yoki kasallik holatini qaytarsa (masalan DEAD), darhol ko'rsatiladi
  if (data.vitals) setVitals(data.vitals);
  if (!res.ok) throw new Error(data.error || 'Xatolik');
  return data;
}

export async function logout() {
  await request('/logout', { method: 'POST' }).catch(() => {});
  accessToken = null;
}
