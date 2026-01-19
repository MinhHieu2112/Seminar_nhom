
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../App/App';
import { Trash2, Minus, Plus, ArrowLeft, Ticket, Check, X } from 'lucide-react';
import { DISCOUNT_CODES } from '../../../constants';

const Cart: React.FC = () => {
  const { cart, removeFromCart, updateQuantity, appliedDiscount, applyDiscount } = useApp();
  const navigate = useNavigate();
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  const discountAmount = appliedDiscount 
    ? (appliedDiscount.type === 'percent' ? (subtotal * appliedDiscount.value / 100) : appliedDiscount.value)
    : 0;
    
  const total = subtotal - discountAmount;

  const handleApplyCoupon = () => {
    const found = DISCOUNT_CODES.find(c => c.code === couponInput.toUpperCase());
    if (found) {
      applyDiscount(found);
      setCouponError('');
      setCouponInput('');
    } else {
      setCouponError('Mã giảm giá không hợp lệ hoặc đã hết hạn.');
    }
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <h2 className="text-3xl font-bold mb-6">Giỏ hàng của bạn đang trống</h2>
        <p className="text-gray-500 mb-10">Hãy bắt đầu mua sắm để lấp đầy không gian sống của bạn.</p>
        <Link to="/products" className="inline-block bg-black text-white px-10 py-4 rounded-full font-bold">Xem sản phẩm</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex items-center space-x-2 mb-12">
        <Link to="/products" className="text-gray-400 hover:text-black transition"><ArrowLeft size={20}/></Link>
        <h1 className="text-3xl font-bold tracking-tighter">Giỏ hàng ({cart.length})</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          {cart.map(item => (
            <div key={item.id} className="flex space-x-6 pb-8 border-b border-gray-100 last:border-0">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0">
                <img src={item.images[0]} className="w-full h-full object-cover" alt={item.name} />
              </div>
              <div className="flex-grow flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg mb-1">{item.name}</h3>
                    <p className="text-sm text-gray-400">{item.category}</p>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-red-500 transition"><Trash2 size={20}/></button>
                </div>
                <div className="flex justify-between items-center mt-4">
                  <div className="flex items-center bg-gray-50 rounded-full px-3 py-1">
                    <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:text-black transition"><Minus size={14}/></button>
                    <span className="mx-4 font-bold text-sm">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:text-black transition"><Plus size={14}/></button>
                  </div>
                  <p className="font-bold">{(item.price * item.quantity).toLocaleString('vi-VN')}đ</p>
                </div>
              </div>
            </div>
          ))}

          {/* Discount Section */}
          <div className="pt-8">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
              <Ticket size={14} /> Mã giảm giá
            </h3>
            <div className="flex gap-4">
              <div className="relative flex-grow">
                <input 
                  type="text" 
                  placeholder="LUXNEW, NHAMOI..." 
                  className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 focus:ring-1 focus:ring-black outline-none transition-all uppercase"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                />
              </div>
              <button 
                onClick={handleApplyCoupon}
                className="bg-black text-white px-8 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-gray-800 transition shadow-lg"
              >
                Áp dụng
              </button>
            </div>
            {couponError && <p className="text-red-500 text-[10px] mt-3 font-bold uppercase ml-1 tracking-wider">{couponError}</p>}
            
            {appliedDiscount && (
              <div className="mt-6 flex items-center justify-between bg-green-50 border border-green-100 p-4 rounded-2xl animate-fade-in-up">
                <div className="flex items-center gap-3">
                  <div className="bg-green-500 text-white p-1 rounded-full"><Check size={12} /></div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-green-600">Đã áp dụng mã: {appliedDiscount.code}</p>
                    <p className="text-[11px] font-bold text-green-700">Giảm {appliedDiscount.type === 'percent' ? `${appliedDiscount.value}%` : `${appliedDiscount.value.toLocaleString('vi-VN')}đ`}</p>
                  </div>
                </div>
                <button onClick={() => applyDiscount(null)} className="text-gray-400 hover:text-red-500 transition"><X size={16}/></button>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-gray-50 rounded-3xl p-8 sticky top-28">
            <h2 className="text-xl font-bold mb-8">Tổng quan đơn hàng</h2>
            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-gray-500">
                <span>Tạm tính</span>
                <span>{subtotal.toLocaleString('vi-VN')}đ</span>
              </div>
              {appliedDiscount && (
                <div className="flex justify-between text-green-600 font-bold">
                  <span>Giảm giá</span>
                  <span>-{discountAmount.toLocaleString('vi-VN')}đ</span>
                </div>
              )}
              <div className="flex justify-between text-gray-500">
                <span>Vận chuyển</span>
                <span className="text-black font-medium">Miễn phí</span>
              </div>
              <div className="pt-4 border-t border-gray-200 flex justify-between text-lg font-bold">
                <span>Tổng cộng</span>
                <span>{total.toLocaleString('vi-VN')}đ</span>
              </div>
            </div>
            <button 
              onClick={() => navigate('/checkout')}
              className="w-full bg-black text-white py-4 rounded-full font-bold hover:bg-gray-800 transition"
            >
              Thanh toán ngay
            </button>
            <p className="text-center text-[10px] text-gray-400 mt-6 uppercase tracking-widest font-bold">An toàn & Bảo mật tuyệt đối</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
