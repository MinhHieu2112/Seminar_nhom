
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../App';
import { api } from '../api';
import { Loader2 } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useApp();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const user = await api.auth.login({ email, password });
      login(user);
      navigate('/');
    } catch (error) {
      alert('Đăng nhập thất bại. Vui lòng thử lại!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold tracking-tighter mb-3">Chào mừng trở lại</h1>
          <p className="text-gray-400 font-light">Đăng nhập để khám phá thế giới nội thất LuxDecor</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-2 ml-1">Email</label>
            <input 
              type="email" 
              className="w-full bg-white border border-gray-200 rounded-2xl px-6 py-4 focus:ring-1 focus:ring-black focus:border-black transition-all outline-none text-sm placeholder:text-gray-300"
              placeholder="example@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-2 ml-1">Mật khẩu</label>
            <input 
              type="password" 
              className="w-full bg-white border border-gray-200 rounded-2xl px-6 py-4 focus:ring-1 focus:ring-black focus:border-black transition-all outline-none text-sm placeholder:text-gray-300"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="flex items-center justify-between text-[11px] py-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black" />
              <span className="text-gray-500 font-medium">Ghi nhớ đăng nhập</span>
            </label>
            <Link to="/forgot-password" title="Khôi phục mật khẩu" className="text-black font-bold hover:underline transition">Quên mật khẩu?</Link>
          </div>
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-black text-white py-5 rounded-full font-bold hover:bg-gray-800 transition active:scale-[0.98] flex items-center justify-center"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : 'Đăng nhập'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-10">
          Chưa có tài khoản? <Link to="/register" className="text-black font-bold underline hover:text-gray-600 transition">Đăng ký ngay</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
