// Backend manzili .env'dan olinadi (VITE_API_URL). Bo'sh bo'lsa — nisbiy yo'l,
// lokalda vite proxy /api'ni localhost:4000 ga yo'naltiradi.
export const API_URL = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');
