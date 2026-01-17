
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../App';
import { api } from '../api';
import { Loader2, ArrowLeft } from 'lucide-react';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useApp();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert('Mật khẩu xác nhận không khớp!');
      return;
    }

    setIsLoading(true);
    try {
      const user = await api.auth.register(formData);
      login(user);
      navigate('/');
    } catch (error) {
      alert('Đăng ký thất bại. Vui lòng kiểm tra lại thông tin!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700">
        <Link to="/login" className="inline-flex items-center text-xs font-bold text-gray-400 hover:text-black transition mb-8 uppercase tracking-widest">
          <ArrowLeft size={16} className="mr-2" />
          Quay lại đăng nhập
        </Link>
        
        <div className="mb-10">
          <h1 className="text-4xl font-bold tracking-tighter mb-3">Tạo tài khoản mới</h1>
          <p className="text-gray-400 font-light">Gia nhập cộng đồng LuxDecor để nhận các ưu đãi thiết kế đặc quyền.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-2 ml-1">Họ và tên</label>
            <input 
              type="text" 
              className="w-full bg-white border border-gray-200 rounded-2xl px-6 py-4 focus:ring-1 focus:ring-black focus:border-black transition-all outline-none text-sm placeholder:text-gray-300"
              placeholder="Nguyễn Văn A"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-2 ml-1">Email</label>
            <input 
              type="email" 
              className="w-full bg-white border border-gray-200 rounded-2xl px-6 py-4 focus:ring-1 focus:ring-black focus:border-black transition-all outline-none text-sm placeholder:text-gray-300"
              placeholder="example@gmail.com"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-2 ml-1">Số điện thoại</label>
            <input 
              type="tel" 
              className="w-full bg-white border border-gray-200 rounded-2xl px-6 py-4 focus:ring-1 focus:ring-black focus:border-black transition-all outline-none text-sm placeholder:text-gray-300"
              placeholder="0123 456 789"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-2 ml-1">Mật khẩu</label>
              <input 
                type="password" 
                className="w-full bg-white border border-gray-200 rounded-2xl px-6 py-4 focus:ring-1 focus:ring-black focus:border-black transition-all outline-none text-sm placeholder:text-gray-300"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-2 ml-1">Xác nhận</label>
              <input 
                type="password" 
                className="w-full bg-white border border-gray-200 rounded-2xl px-6 py-4 focus:ring-1 focus:ring-black focus:border-black transition-all outline-none text-sm placeholder:text-gray-300"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                required
              />
            </div>
          </div>
          
          <div className="pt-4">
            <p className="text-[10px] text-gray-400 leading-relaxed mb-6">
              Bằng việc đăng ký, bạn đồng ý với các <a href="#" className="underline text-black font-bold">Điều khoản dịch vụ</a> và <a href="#" className="underline text-black font-bold">Chính sách bảo mật</a> của LuxDecor.
            </p>
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-black text-white py-5 rounded-full font-bold hover:bg-gray-800 transition active:scale-[0.98] flex items-center justify-center"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : 'Đăng ký tài khoản'}
            </button>
          </div>
        </form>

        <p className="text-center text-sm text-gray-400 mt-10">
          Đã có tài khoản? <Link to="/login" className="text-black font-bold underline hover:text-gray-600 transition">Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
