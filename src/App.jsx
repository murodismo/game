import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { api, refresh, setAccessToken, logout as apiLogout } from './api.js';
import Home from './Home.jsx';
import StreetPage from './StreetPage.jsx';
import CourierPage from './CourierPage.jsx';
import WaiterLocation from './WaiterLocation.jsx';
import HospitalPage from './HospitalPage.jsx';
import { startHeartbeat } from './hunger.js';
import VitalsBar from './VitalsBar.jsx';

export default function App() {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  // Sahifa ochilganda: cookie'dagi refresh token orqali sessiyani tiklash
  useEffect(() => {
    localStorage.removeItem('token'); // eski versiyadan qolgan token
    refresh()
      .then((d) => setUser(d.user))
      .catch(() => {})
      .finally(() => setChecking(false));
  }, []);

  // Kirgan foydalanuvchi online ekanini serverga bildirib turadi (ochlik faqat online vaqtda kamayadi)
  useEffect(() => (user ? startHeartbeat() : undefined), [user]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api(`/${mode}`, {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      setAccessToken(data.accessToken);
      setUser(data.user);
      setPassword('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await apiLogout();
    setUser(null);
    navigate('/');
  }

  if (checking) {
    return <div className="card"><p>Yuklanmoqda...</p></div>;
  }

  // Kirgan foydalanuvchi uchun sahifalar; kirmagan bo'lsa pastdagi login formasi chiqadi
  if (user) {
    return (
      <>
      <Routes>
        <Route path="/" element={<Home user={user} onLogout={logout} />} />
        <Route path="/street" element={<StreetPage />} />
        <Route path="/work/courier" element={<CourierPage />} />
        <Route path="/work/waiter" element={<WaiterLocation />} />
        <Route path="/hospital" element={<HospitalPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {/* energiya va kasallik ogohlantirishi har sahifada ko'rinadi */}
      <VitalsBar onLogout={logout} />
      </>
    );
  }

  const isLogin = mode === 'login';
  return (
    <div className="card">
      <h1>{isLogin ? 'Kirish' : "Ro'yxatdan o'tish"}</h1>
      <form onSubmit={handleSubmit}>
        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          required
        />
        <input
          type="password"
          placeholder="Parol"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={isLogin ? 'current-password' : 'new-password'}
          required
        />
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Kuting...' : isLogin ? 'Kirish' : "Ro'yxatdan o'tish"}
        </button>
      </form>
      <p className="switch">
        {isLogin ? "Akkauntingiz yo'qmi? " : 'Akkauntingiz bormi? '}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setMode(isLogin ? 'register' : 'login');
            setError('');
          }}
        >
          {isLogin ? "Ro'yxatdan o'tish" : 'Kirish'}
        </a>
      </p>
    </div>
  );
}
