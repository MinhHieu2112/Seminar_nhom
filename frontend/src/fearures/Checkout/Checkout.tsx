
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../app/App';
import { api } from '../../../api';
import { CreditCard, Truck, Loader2, CheckCircle2 } from 'lucide-react';
import { OrderStatus } from '../../types/types';

const Checkout: React.FC = () => {
  const { cart, authState, clearCart, addOrder } = useApp();
  const navigate = useNavigate();
  const [method, setMethod] = useState<'cod' | 'online'>('cod');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [address, setAddress] = useState('');

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handlePlaceOrder = async () => {
    if (!authState.isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!address.trim()) {
      alert('Vui lòng nhập địa chỉ giao hàng');
      return;
    }

    setIsProcessing(true);
    try {
      const order = await api.orders.create({
        user_id: authState.user!.id,
        total: subtotal,
        address: address,
        items: cart
      });

      addOrder(order);
      setIsSuccess(true);
      setTimeout(() => {
        clearCart();
        navigate('/orders');
      }, 3000);
    } catch (error) {
      alert('Đặt hàng thất bại, vui lòng thử lại.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="max-w-xl mx-auto px-4 py-32 text-center">
        <div className="mb-6 flex justify-center text-green-500">
          <CheckCircle2 size={80} className="animate-bounce" />
        </div>
        <h2 className="text-3xl font-bold mb-4 uppercase tracking-tighter">Đặt hàng thành công!</h2>
        <p className="text-gray-500 mb-2">Đơn hàng của bạn đã được ghi nhận vào hệ thống.</p>
        <p className="text-sm text-gray-400">Đang chuyển hướng về lịch sử đơn hàng...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-12 tracking-tighter uppercase">Thanh toán</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        <div className="animate-fade-in-up">
          <div className="mb-12">
            <h2 className="text-lg font-bold mb-8 flex items-center space-x-3">
              <span className="w-8 h-8 bg-black text-white text-xs flex items-center justify-center rounded-full">01</span>
              <span>THÔNG TIN GIAO HÀNG</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-1 md:col-span-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 block ml-1">Người nhận</label>
                <input type="text" className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 focus:ring-1 focus:ring-black outline-none" defaultValue={authState.user?.name || ''} />
              </div>
              <div className="col-span-1 md:col-span-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 block ml-1">Địa chỉ chi tiết</label>
                <textarea 
                  placeholder="Số nhà, tên đường, phường/xã..." 
                  className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 h-32 focus:ring-1 focus:ring-black outline-none"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                ></textarea>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-bold mb-8 flex items-center space-x-3">
              <span className="w-8 h-8 bg-black text-white text-xs flex items-center justify-center rounded-full">02</span>
              <span>PHƯƠNG THỨC THANH TOÁN</span>
            </h2>
            <div className="space-y-4">
              <div 
                onClick={() => setMethod('cod')}
                className={`flex items-center justify-between p-8 rounded-3xl cursor-pointer border-2 transition-all ${method === 'cod' ? 'border-black bg-white shadow-xl' : 'border-transparent bg-gray-50'}`}
              >
                <div className="flex items-center space-x-5">
                  <div className="p-3 bg-gray-100 rounded-2xl"><Truck size={24} /></div>
                  <div>
                    <h3 className="font-bold text-sm uppercase tracking-tight">Thanh toán khi nhận hàng</h3>
                    <p className="text-xs text-gray-400">COD - Giao hàng và thu tiền tận nơi</p>
                  </div>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${method === 'cod' ? 'border-black' : 'border-gray-200'}`}>
                  {method === 'cod' && <div className="w-3 h-3 bg-black rounded-full" />}
                </div>
              </div>

              <div 
                onClick={() => setMethod('online')}
                className={`flex items-center justify-between p-8 rounded-3xl cursor-pointer border-2 transition-all ${method === 'online' ? 'border-black bg-white shadow-xl' : 'border-transparent bg-gray-50'}`}
              >
                <div className="flex items-center space-x-5">
                  <div className="p-3 bg-gray-100 rounded-2xl"><CreditCard size={24} /></div>
                  <div>
                    <h3 className="font-bold text-sm uppercase tracking-tight">Chuyển khoản trực tuyến</h3>
                    <p className="text-xs text-gray-400">MoMo, VNPay, Napas...</p>
                  </div>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${method === 'online' ? 'border-black' : 'border-gray-200'}`}>
                  {method === 'online' && <div className="w-3 h-3 bg-black rounded-full" />}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="animate-fade-in-up delay-200">
          <div className="bg-gray-50 rounded-[3rem] p-12 border border-gray-100 sticky top-28 shadow-sm">
            <h2 className="text-xl font-bold mb-10 tracking-tight uppercase">Tóm tắt đơn hàng</h2>
            <div className="space-y-6 mb-10 overflow-y-auto max-h-[400px] pr-4 custom-scrollbar">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between items-center group">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-white rounded-2xl overflow-hidden flex-shrink-0 border border-gray-100">
                      <img src={item.images[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt={item.name} />
                    </div>
                    <div>
                      <p className="text-sm font-bold tracking-tight line-clamp-1">{item.name}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">SL: {item.quantity}</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold">{(item.price * item.quantity).toLocaleString('vi-VN')}đ</p>
                </div>
              ))}
            </div>
            
            <div className="pt-8 border-t border-gray-200 space-y-4">
               <div className="flex justify-between text-gray-400 text-xs font-bold uppercase tracking-widest">
                <span>Tạm tính</span>
                <span>{subtotal.toLocaleString('vi-VN')}đ</span>
              </div>
              <div className="flex justify-between text-gray-400 text-xs font-bold uppercase tracking-widest">
                <span>Vận chuyển</span>
                <span className="text-green-500">Miễn phí</span>
              </div>
              <div className="flex justify-between text-2xl font-bold pt-4">
                <span className="tracking-tighter uppercase">Tổng tiền</span>
                <span>{subtotal.toLocaleString('vi-VN')}đ</span>
              </div>
              <button 
                onClick={handlePlaceOrder}
                disabled={isProcessing}
                className="w-full bg-black text-white h-16 rounded-full font-bold uppercase tracking-[0.2em] text-[11px] hover:bg-gray-800 transition-all mt-8 flex items-center justify-center space-x-3 shadow-2xl active:scale-95 disabled:opacity-50"
              >
                {isProcessing ? <Loader2 className="animate-spin" /> : <span>Xác nhận đặt hàng</span>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
