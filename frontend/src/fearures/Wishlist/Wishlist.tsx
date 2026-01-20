
import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../app/App';
import { Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';

const Wishlist: React.FC = () => {
  const { wishlist, toggleWishlist, addToCart } = useApp();

  if (wishlist.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8">
          <Heart size={32} className="text-gray-200" />
        </div>
        <h2 className="text-3xl font-bold mb-4 tracking-tighter uppercase">Danh sách trống</h2>
        <p className="text-gray-500 mb-10 max-w-sm mx-auto font-light">Hãy lưu lại những món đồ nội thất bạn yêu thích để dễ dàng tìm lại sau này.</p>
        <Link to="/products" className="inline-flex items-center space-x-3 bg-black text-white px-10 py-4 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-gray-800 transition">
          <span>Khám phá ngay</span>
          <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-bold tracking-tighter uppercase mb-4">Danh sách yêu thích</h1>
        <p className="text-gray-400 text-sm font-light">Bạn đang quan tâm đến {wishlist.length} sản phẩm tinh tuyển.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
        {wishlist.map(product => {
          const baseImageUrl = product.images[0].split('?')[0];
          return (
            <div key={product.id} className="group border border-gray-100 rounded-[2.5rem] overflow-hidden bg-white hover:shadow-2xl transition duration-500">
              <div className="aspect-[4/5] relative overflow-hidden bg-gray-50">
                <Link to={`/product/${product.id}`}>
                  <img 
                    src={`${baseImageUrl}?auto=format&fit=crop&q=75&w=600`} 
                    alt={product.name} 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
                    loading="lazy"
                    decoding="async"
                  />
                </Link>
                <button 
                  onClick={() => toggleWishlist(product)}
                  className="absolute top-6 right-6 p-3 bg-white text-red-500 rounded-full shadow-lg hover:scale-110 transition active:scale-95"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              
              <div className="p-8">
                <div className="mb-6">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 block">{product.category}</span>
                  <Link to={`/product/${product.id}`}>
                    <h3 className="text-xl font-bold mb-2 group-hover:text-gray-600 transition">{product.name}</h3>
                  </Link>
                  <p className="text-xl font-bold text-black">{product.price.toLocaleString('vi-VN')}đ</p>
                </div>
                
                <div className="flex space-x-3">
                  <button 
                    onClick={() => addToCart(product, 1)}
                    className="flex-grow bg-black text-white py-4 rounded-full font-bold text-[10px] uppercase tracking-widest flex items-center justify-center space-x-2 hover:bg-gray-800 transition active:scale-95"
                  >
                    <ShoppingBag size={14} />
                    <span>Thêm vào giỏ</span>
                  </button>
                  <Link 
                    to={`/product/${product.id}`}
                    className="w-14 h-14 bg-gray-50 text-black rounded-full flex items-center justify-center border border-gray-100 hover:bg-gray-100 transition"
                  >
                    <ArrowRight size={18} />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Wishlist;
