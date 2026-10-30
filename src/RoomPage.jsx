import { useNavigate } from 'react-router-dom';

// Xonadagi buyum sahifasi (hozircha bo'sh qolip). Faqat tizimga kirganlar ko'radi.
export default function RoomPage({ title }) {
  const navigate = useNavigate();
  return (
    <div className="card">
      <h1>{title}</h1>
      <p>Bu sahifa hali tayyorlanmoqda.</p>
      <button onClick={() => navigate('/')}>Xonaga qaytish</button>
    </div>
  );
}
