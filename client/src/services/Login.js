import React, { useState } from 'react';
import { mockApi } from './services/mockApi';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await mockApi.login({ email, password });
      
      // Зберігаємо "токен" та роль у localStorage
      localStorage.setItem('token', response.data.access);
      localStorage.setItem('userRole', response.data.role);
      
      alert(`Вітаємо, ${response.data.full_name}! Роль: ${response.data.role}`);
      
      // Тут робимо редірект (через useNavigate у react-router-dom)
      // if (response.data.role === 'manager') navigate('/manager/dashboard');
      
    } catch (err) {
      alert(err.message || "Помилка входу");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <h2>Вхід у Learnyx</h2>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Пароль" required />
      <button type="submit" disabled={loading}>
        {loading ? 'Вхід...' : 'Увійти'}
      </button>
    </form>
  );
};

export default Login