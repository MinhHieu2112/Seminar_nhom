
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2, CheckCircle } from 'lucide-react';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Mocking API call
    setTimeout(() => {
      setIsLoading(false);
      setIsSent(true);
    }, 1500);
  };

  if (isSent) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center animate-in fade-in zoom-in-95 duration-700">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center">
              <CheckCircle size={40} className="text-green-500" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tighter mb-4">Đã gửi yêu cầu!</h1>
          <p className="text-gray-500 font-light mb-8 leading-relaxed">
            Chúng tôi đã gửi một liên kết đặt lại mật khẩu đến email <strong>{email}</strong>. Vui lòng kiểm tra hộp thư đến (hoặc thư rác) của bạn.
          </p>
          <Link 
            to="/login" 
            className="inline-block bg-black text-white px-10 py-4 rounded-full font-bold hover:bg-gray-800 transition"
          >
            Quay lại đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700">
        <Link to="/login" className="inline-flex items-center text-xs font-bold text-gray-400 hover:text-black transition mb-8 uppercase tracking-widest">
          <ArrowLeft size={16} className="mr-2" />
          Quay lại đăng nhập
        </Link>

        <div className="mb-10">
          <h1 className="text-4xl font-bold tracking-tighter mb-3">Quên mật khẩu?</h1>
          <p className="text-gray-400 font-light">Nhập email đã đăng ký của bạn để nhận liên kết khôi phục mật khẩu.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-2 ml-1">Email đăng ký</label>
            <input 
              type="email" 
              className="w-full bg-white border border-gray-200 rounded-2xl px-6 py-4 focus:ring-1 focus:ring-black focus:border-black transition-all outline-none text-sm placeholder:text-gray-300"
              placeholder="example@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <button 
            type="submit" 
            disabled={isLoading || !email}
            className="w-full bg-black text-white py-5 rounded-full font-bold hover:bg-gray-800 transition active:scale-[0.98] flex items-center justify-center disabled:bg-gray-400"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : 'Gửi yêu cầu khôi phục'}
          </button>
        </form>

        <div className="mt-12 pt-8 border-t border-gray-50 text-center">
          <p className="text-xs text-gray-400 italic">
            "Sự riêng tư và bảo mật thông tin khách hàng là ưu tiên hàng đầu của chúng tôi."
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
