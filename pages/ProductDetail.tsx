
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useApp } from '../App';
import { Minus, Plus, ShoppingCart, Shield, Truck, Star, Send, User, Heart, CheckCircle2, Loader2 } from 'lucide-react';
import { Product, Review } from '../types';

const ProductDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, authState, toggleWishlist, isInWishlist } = useApp();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'desc' | 'reviews'>('desc');
  const [selectedImgIndex, setSelectedImgIndex] = useState(0);
  
  const [newComment, setNewComment] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const data = await api.products.getById(id);
        if (data) {
          setProduct(data);
          setReviews(data.reviews || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
    window.scrollTo(0, 0);
  }, [id]);

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-gray-200" size={40} /></div>;
  if (!product) return <div className="p-24 text-center">Sản phẩm không tồn tại</div>;

  const variantsInfo = [
    { label: "Bản Tiêu Chuẩn", suffix: "", priceMod: 0 },
    { label: "Premium Edition", suffix: " (Cao cấp)", priceMod: 500000 },
    { label: "Limited Dark Mode", suffix: " (Đặc biệt)", priceMod: 1200000 },
  ];

  const currentVariant = variantsInfo[selectedImgIndex % variantsInfo.length];
  const displayedPrice = product.price + currentVariant.priceMod;

  const handleAddToCart = () => {
    const productWithVariant = {
      ...product,
      name: `${product.name} - ${currentVariant.label}`,
      price: displayedPrice
    };
    addToCart(productWithVariant, quantity);
    navigate('/cart');
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authState.isAuthenticated) {
      alert('Vui lòng đăng nhập để gửi đánh giá!');
      navigate('/login');
      return;
    }
    setIsSubmittingReview(true);
    try {
      const reviewData = {
        user_name: authState.user?.name || 'Khách hàng',
        rating: newRating,
        comment: newComment,
        avatar: authState.user?.avatar
      };
      // Fix: Added authState.user!.id as the second argument to match api definition
      const savedReview = await api.reviews.add(product.id, authState.user!.id, reviewData);
      setReviews(prev => [savedReview, ...prev]);
      setNewComment('');
      setNewRating(5);
    } catch (e) {
      alert('Không thể gửi đánh giá lúc này.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 md:py-24">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-24">
        {/* Gallery Section */}
        <div className="space-y-6">
          <div className="aspect-[4/5] rounded-[3rem] overflow-hidden bg-gray-50 shadow-sm relative group">
            <img 
              key={selectedImgIndex}
              src={`${product.images[selectedImgIndex % product.images.length]}?auto=format&fit=crop&q=85&w=1200`} 
              alt={product.name} 
              className="w-full h-full object-cover transition-all duration-700 animate-in fade-in zoom-in-95" 
            />
            <button 
              onClick={() => toggleWishlist(product)}
              className="absolute top-8 right-8 p-4 bg-white/20 backdrop-blur-xl rounded-full text-white hover:bg-white hover:text-black transition-all z-20 shadow-2xl border border-white/30"
            >
              <Heart size={24} className={isInWishlist(product.id) ? "fill-red-500 text-red-500 border-none" : ""} />
            </button>
            <div className="absolute bottom-8 left-8 bg-black/60 backdrop-blur-md text-white px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/10">
              Mẫu: {currentVariant.label}
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-4 px-2">
            {product.images.map((img, i) => {
              const isActive = selectedImgIndex === i;
              return (
                <div 
                  key={i} 
                  onClick={() => setSelectedImgIndex(i)}
                  className={`aspect-square rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 border-2 ${isActive ? 'border-black scale-105 shadow-lg' : 'border-transparent opacity-50 hover:opacity-100'}`}
                >
                  <img src={`${img}?auto=format&fit=crop&q=60&w=300`} alt="thumb" className="w-full h-full object-cover" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Info Section */}
        <div className="flex flex-col justify-center">
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">{product.category}</span>
              <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-black">SKU: {product.sku}</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tighter leading-tight">
              {product.name}
              <span className="text-gray-300 ml-3 font-light">{currentVariant.suffix}</span>
            </h1>

            <div className="flex items-center space-x-4 mb-8">
              <div className="flex text-black">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} fill={i < Math.floor(product.rating || 4.5) ? "currentColor" : "none"} stroke="currentColor" />
                ))}
              </div>
              <span className="text-xs font-bold tracking-widest text-gray-400 uppercase">{reviews.length} Đánh giá</span>
            </div>

            <div className="flex items-baseline space-x-4 mb-10">
              <p className="text-4xl font-bold tracking-tighter">{displayedPrice.toLocaleString('vi-VN')}đ</p>
              {currentVariant.priceMod > 0 && (
                <span className="text-sm font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full uppercase tracking-widest">
                  +{currentVariant.priceMod.toLocaleString('vi-VN')}đ tùy chọn
                </span>
              )}
            </div>
          </div>

          <div className="mb-12 p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">Mô tả chi tiết</h3>
            <p className="text-gray-600 leading-relaxed font-light text-sm">{product.description}</p>
            <div className="grid grid-cols-2 gap-6 mt-8 pt-8 border-t border-gray-200/50">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-300 mb-1">Chất liệu</p>
                <p className="text-xs font-bold">{product.material}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-300 mb-1">Kích thước</p>
                <p className="text-xs font-bold">{product.dimension}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4 mb-10">
            <div className="flex items-center bg-gray-100 rounded-full px-5 py-3">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-1 hover:text-black transition text-gray-400"><Minus size={16}/></button>
              <span className="mx-8 font-bold text-lg">{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} className="p-1 hover:text-black transition text-gray-400"><Plus size={16}/></button>
            </div>
            <button onClick={handleAddToCart} className="flex-grow bg-black text-white h-16 rounded-full font-bold text-[11px] uppercase tracking-[0.2em] flex items-center justify-center space-x-3 hover:bg-gray-800 transition shadow-2xl active:scale-95">
              <ShoppingCart size={18} />
              <span>Thêm vào giỏ hàng</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="flex items-center space-x-4 p-5 bg-white border border-gray-100 rounded-3xl shadow-sm">
                <div className="p-2 bg-gray-50 rounded-xl"><Shield size={18} className="text-gray-400" /></div>
                <div><p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Bảo hành</p><p className="text-[10px] font-bold">2 Năm chính hãng</p></div>
             </div>
             <div className="flex items-center space-x-4 p-5 bg-white border border-gray-100 rounded-3xl shadow-sm">
                <div className="p-2 bg-gray-50 rounded-xl"><Truck size={18} className="text-gray-400" /></div>
                <div><p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Giao hàng</p><p className="text-[10px] font-bold">Miễn phí toàn quốc</p></div>
             </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="mt-24">
        <div className="flex space-x-12 mb-12 border-b border-gray-100">
          <button onClick={() => setActiveTab('desc')} className={`pb-6 text-[11px] font-bold tracking-[0.3em] uppercase relative ${activeTab === 'desc' ? 'text-black' : 'text-gray-300'}`}>
            Thông số kỹ thuật {activeTab === 'desc' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-black" />}
          </button>
          <button onClick={() => setActiveTab('reviews')} className={`pb-6 text-[11px] font-bold tracking-[0.3em] uppercase relative ${activeTab === 'reviews' ? 'text-black' : 'text-gray-300'}`}>
            Đánh giá ({reviews.length}) {activeTab === 'reviews' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-black" />}
          </button>
        </div>
        
        <div className="animate-in fade-in duration-700">
           {activeTab === 'desc' ? (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-20 max-w-5xl">
                <div className="space-y-8">
                   <p className="text-gray-500 font-light leading-loose text-lg">Mỗi sản phẩm tại LuxDecor không chỉ là nội thất, đó là một tác phẩm nghệ thuật kiến trúc thu nhỏ.</p>
                   <ul className="space-y-4">
                      {['Khung gỗ tự nhiên bền bỉ', 'Vải bọc chống thấm', 'Thiết kế chuẩn công thái học'].map((item, i) => (
                        <li key={i} className="flex items-center space-x-3 text-sm font-semibold"><CheckCircle2 size={16} className="text-black" /><span>{item}</span></li>
                      ))}
                   </ul>
                </div>
                <div className="bg-gray-50 rounded-[3rem] p-10 space-y-6">
                   <div className="flex justify-between py-4 border-b border-gray-200">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Trọng lượng</span>
                      <span className="text-sm font-bold">{product.weight} kg</span>
                   </div>
                   <div className="flex justify-between py-4 border-b border-gray-200">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Vật liệu</span>
                      <span className="text-sm font-bold">{product.material}</span>
                   </div>
                </div>
             </div>
           ) : (
             <div className="max-w-4xl space-y-12">
                <form onSubmit={handleSubmitReview} className="bg-gray-50 p-10 rounded-[3rem] border border-gray-100">
                  <h4 className="text-xl font-bold mb-8 tracking-tight uppercase">Viết đánh giá</h4>
                  <div className="flex space-x-2 mb-8">
                    {[1,2,3,4,5].map(star => (
                      <button key={star} type="button" onClick={() => setNewRating(star)} className={`p-1 transition-colors ${newRating >= star ? 'text-black' : 'text-gray-200'}`}>
                        <Star size={24} fill={newRating >= star ? "currentColor" : "none"} />
                      </button>
                    ))}
                  </div>
                  <textarea className="w-full bg-white border border-gray-200 rounded-3xl px-8 py-6 text-sm h-40 outline-none focus:ring-1 focus:ring-black mb-8" placeholder="Chia sẻ trải nghiệm..." value={newComment} onChange={(e) => setNewComment(e.target.value)} required />
                  <button type="submit" disabled={isSubmittingReview} className="bg-black text-white px-12 py-5 rounded-full font-bold text-[11px] uppercase tracking-widest flex items-center space-x-3 disabled:opacity-50">
                    {isSubmittingReview ? <Loader2 size={18} className="animate-spin" /> : <><span>Gửi đánh giá</span><Send size={16} /></>}
                  </button>
                </form>

                <div className="space-y-10 pt-8">
                  {reviews.map((rev) => (
                    <div key={rev.id} className="flex space-x-8 animate-fade-in-up">
                      <div className="w-16 h-16 rounded-full bg-gray-100 flex-shrink-0 flex items-center justify-center overflow-hidden border border-gray-50">
                        {rev.avatar ? <img src={rev.avatar} className="w-full h-full object-cover" /> : <User size={24} className="text-gray-300" />}
                      </div>
                      <div className="flex-grow">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h5 className="font-bold text-lg mb-1">{rev.user_name}</h5>
                            <div className="flex text-black space-x-1">{[...Array(5)].map((_, i) => (<Star key={i} size={10} fill={i < rev.rating ? "currentColor" : "none"} stroke="currentColor" />))}</div>
                          </div>
                          <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">{rev.date}</span>
                        </div>
                        <p className="text-gray-500 font-light text-sm">{rev.comment}</p>
                      </div>
                    </div>
                  ))}
                </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
