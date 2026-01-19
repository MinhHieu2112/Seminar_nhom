
import React from 'react';
import { useApp } from '../../App/App';
import { Package, ChevronRight, XCircle, ShoppingBag, Loader2 } from 'lucide-react';
import { OrderStatus } from '../../../types';
import { Link } from 'react-router-dom';

const Orders: React.FC = () => {
  const { orders, cancelOrder } = useApp();

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-20">
        <div className="mb-16 animate-fade-in-up">
          <h1 className="text-4xl font-bold tracking-tighter mb-4">Lịch sử đơn hàng</h1>
          <p className="text-gray-400 font-light">Quản lý và theo dõi hành trình của những món đồ nội thất bạn đã chọn.</p>
        </div>

        {orders.length === 0 ? (
          <div className="bg-gray-50 rounded-[2.5rem] p-16 md:p-24 text-center animate-fade-in-up border border-gray-100">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm">
              <Package className="text-gray-200" size={32} />
            </div>
            <h2 className="text-2xl font-bold mb-4 tracking-tight">Chưa có đơn hàng nào</h2>
            <p className="text-gray-400 mb-10 max-w-xs mx-auto font-light leading-relaxed">
              Bạn chưa thực hiện đơn hàng nào. Hãy bắt đầu kiến tạo không gian ngay hôm nay!
            </p>
            <Link to="/products" className="inline-flex items-center space-x-3 bg-black text-white px-10 py-4 rounded-full font-bold text-[11px] uppercase tracking-widest hover:bg-gray-800 transition active:scale-95">
              <ShoppingBag size={16} />
              <span>Khám phá sản phẩm</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-10">
            {orders.map((order, idx) => (
              <div key={order.id} className="bg-white border border-gray-100 rounded-[2.5rem] p-8 md:p-10 hover:shadow-2xl hover:border-transparent transition-all duration-500 animate-fade-in-up" style={{ animationDelay: `${idx * 100}ms` }}>
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 pb-8 border-b border-gray-50 gap-6">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-300 mb-2">Mã đơn hàng</p>
                    <p className="text-xl font-bold tracking-tight">{order.id}</p>
                  </div>
                  <div className="flex items-center space-x-12">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-300 mb-2">Ngày đặt</p>
                      <p className="text-sm font-semibold">{order.date}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-300 mb-2">Trạng thái</p>
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full border ${
                        order.status === OrderStatus.CANCELLED ? 'border-red-100 bg-red-50 text-red-500' : 
                        order.status === OrderStatus.COMPLETED ? 'border-green-100 bg-green-50 text-green-500' : 
                        'border-blue-100 bg-blue-50 text-blue-500'
                      }`}>
                        {order.status === OrderStatus.PENDING ? 'Đang xử lý' : 
                         order.status === OrderStatus.CANCELLED ? 'Đã hủy' : 
                         order.status === OrderStatus.COMPLETED ? 'Hoàn thành' : order.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-6 mb-10">
                  {order.items?.map(item => (
                    <div key={item.id} className="flex items-center justify-between group">
                      <div className="flex items-center space-x-6">
                        <div className="w-16 h-16 rounded-2xl bg-gray-50 overflow-hidden border border-gray-50">
                          <img src={item.images[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={item.name} />
                        </div>
                        <div>
                          <p className="text-sm font-bold tracking-tight mb-1">{item.name}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Số lượng: {item.quantity}</p>
                        </div>
                      </div>
                      <p className="text-sm font-bold">{item.price.toLocaleString('vi-VN')}đ</p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between pt-8 border-t border-gray-50 gap-6">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-300 mb-2">Tổng thanh toán</p>
                    <p className="text-2xl font-bold tracking-tighter text-black">{(order.total || 0).toLocaleString('vi-VN')}đ</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    {order.status === OrderStatus.PENDING && (
                      <button 
                        onClick={() => cancelOrder(order.id)}
                        className="flex items-center space-x-2 text-red-500 text-[11px] font-bold uppercase tracking-widest border border-red-100 px-8 py-4 rounded-full hover:bg-red-50 transition active:scale-95"
                      >
                        <XCircle size={16} />
                        <span>Hủy đơn</span>
                      </button>
                    )}
                    <button className="bg-black text-white text-[11px] font-bold uppercase tracking-widest px-10 py-4 rounded-full hover:bg-gray-800 transition active:scale-95 flex items-center space-x-2 shadow-xl">
                      <span>Chi tiết</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
