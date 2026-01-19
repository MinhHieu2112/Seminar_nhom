
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { PRODUCTS } from '../../../constants';
import { ArrowRight, MessageSquare, ChevronLeft, ChevronRight, Heart, Sparkles, ShoppingBag } from 'lucide-react';
import AIAssistant from '../../Components/AIAssistant';
import { useApp } from '../../App/App';

const SLIDES = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6",
    tag: "NEW COLLECTION 2025",
    title: "KIẾN TẠO KHÔNG GIAN",
    desc: "Khám phá bộ sưu tập nội thất tinh tuyển, nơi nghệ thuật kiến trúc giao thoa cùng sự tiện nghi hiện đại."
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab",
    tag: "ARCHITECTURAL VISION 2025",
    title: "KIẾN TRÚC ĐƯƠNG ĐẠI",
    desc: "Tầm nhìn kiến trúc vượt thời gian, nơi những khối hình học gặp gỡ ánh sáng tự nhiên tạo nên kiệt tác."
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0",
    tag: "CURATED INTERIORS",
    title: "NỘI THẤT TINH HOA",
    desc: "Nâng tầm phong cách sống với những chi tiết thiết kế độc bản, mang hơi thở của sự sang trọng và tinh tế."
  }
];

const Home: React.FC = () => {
  const bestSellers = PRODUCTS.slice(0, 3);
  const [scrollY, setScrollY] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);
  const { toggleWishlist, isInWishlist, addToCart } = useApp();
  const autoPlayRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      window.requestAnimationFrame(() => {
        setScrollY(window.scrollY);
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    startAutoPlay();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      stopAutoPlay();
    };
  }, []);

  const startAutoPlay = () => {
    stopAutoPlay();
    autoPlayRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 6000);
  };

  const stopAutoPlay = () => {
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    startAutoPlay();
  };
  
  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
    startAutoPlay();
  };

  return (
    <div className="bg-white overflow-hidden">
      {/* Hero Section */}
      <section className="relative h-[90vh] flex items-center overflow-hidden bg-black">
        <div className="absolute inset-0 z-0">
          {SLIDES.map((slide, index) => {
            const isActive = index === currentSlide;
            return (
              <div 
                key={slide.id}
                className={`absolute inset-0 transition-opacity duration-[1200ms] ${isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}
              >
                <div 
                  className="absolute inset-0 will-change-transform"
                  style={{ transform: `translate3d(0, ${scrollY * 0.2}px, 0)` }}
                >
                  <img 
                    src={`${slide.image}?auto=format&fit=crop&q=80&w=2000`}
                    className={`w-full h-full object-cover opacity-50 transition-transform duration-[6000ms] ${isActive ? 'scale-110' : 'scale-100'}`} 
                    alt={slide.title} 
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-transparent"></div>
                </div>
                
                <div className="relative h-full flex items-center z-20">
                  <div className="max-w-7xl mx-auto px-6 w-full text-white">
                    <div className="max-w-4xl">
                      {isActive && (
                        <div className="overflow-hidden">
                          <span className="animate-fade-in-up text-[10px] font-bold uppercase tracking-[0.4em] mb-10 block text-white/30">
                            {slide.tag}
                          </span>
                          <div className="animate-fade-in-up delay-100 mb-12">
                            <h1 className="text-3xl md:text-5xl lg:text-7xl font-normal tracking-[0.1em] leading-tight uppercase">
                              {slide.title}
                            </h1>
                          </div>
                          <p className="animate-fade-in-up delay-300 text-sm md:text-base text-gray-400 mb-12 max-w-md font-light leading-relaxed">
                            {slide.desc}
                          </p>
                          <div className="animate-fade-in-up delay-500 flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-8">
                            <Link to="/products" className="group bg-white text-black px-12 py-4 rounded-full font-bold text-[10px] text-center hover:bg-gray-100 transition-all flex items-center justify-center space-x-3 w-full sm:w-auto">
                              <span className="uppercase tracking-[0.2em]">Bộ sưu tập</span>
                              <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform" />
                            </Link>
                            
                            <Link to="/portfolio" className="group bg-transparent border border-white/20 text-white px-12 py-4 rounded-full font-bold text-[10px] text-center hover:bg-white/10 transition-all flex items-center justify-center w-full sm:w-auto">
                              <span className="uppercase tracking-[0.2em]">Dự án tiêu biểu</span>
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="absolute bottom-12 right-12 z-40 flex space-x-4">
          <button onClick={prevSlide} className="p-4 border border-white/10 rounded-full text-white/40 hover:text-white hover:border-white transition-all bg-white/5 backdrop-blur-sm">
            <ChevronLeft size={20} />
          </button>
          <button onClick={nextSlide} className="p-4 border border-white/10 rounded-full text-white/40 hover:text-white hover:border-white transition-all bg-white/5 backdrop-blur-sm">
            <ChevronRight size={20} />
          </button>
        </div>
      </section>

      {/* Stats Section */}
      <section className="pt-12 pb-4 bg-white">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-8">
            <div className="text-center animate-fade-in-up">
              <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 tracking-tight">500+</h3>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">DỰ ÁN HOÀN THÀNH</p>
            </div>
            <div className="text-center animate-fade-in-up delay-100">
              <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 tracking-tight">25+</h3>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">GIẢI THƯỞNG THIẾT KẾ</p>
            </div>
            <div className="text-center animate-fade-in-up delay-200">
              <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 tracking-tight">40+</h3>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">ĐỐI TÁC CHIẾN LƯỢC</p>
            </div>
            <div className="text-center animate-fade-in-up delay-300">
              <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 tracking-tight">98%</h3>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">KHÁCH HÀNG HÀI LÒNG</p>
            </div>
          </div>
        </div>
      </section>

      {/* TOP BÁN CHẠY Section */}
      <section className="pt-12 pb-32 bg-white">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8 animate-fade-in-up">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-[0.5em] text-gray-300 mb-6 block">Most Wanted</span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-normal tracking-[0.15em] leading-tight uppercase">TOP BÁN CHẠY</h2>
            </div>
            <Link to="/products" className="text-[10px] font-bold uppercase tracking-widest border-b-2 border-black pb-2 hover:text-gray-400 hover:border-gray-200 transition-all">
              Xem tất cả sản phẩm
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {bestSellers.map((product, idx) => (
              <div key={product.id} className="group animate-fade-in-up" style={{ animationDelay: `${idx * 200}ms` }}>
                <div className="aspect-[4/5] rounded-[3rem] overflow-hidden bg-gray-50 mb-8 relative shadow-sm group-hover:shadow-2xl transition-all duration-700">
                  <Link to={`/product/${product.id}`}>
                    <img 
                      src={`${product.images[0]}?auto=format&fit=crop&q=80&w=800`} 
                      alt={product.name} 
                      className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110" 
                    />
                  </Link>
                  <button 
                    onClick={() => toggleWishlist(product)}
                    className="absolute top-8 right-8 p-3 bg-white/20 backdrop-blur-xl rounded-full text-white hover:bg-white hover:text-black transition-all z-20 border border-white/30"
                  >
                    <Heart size={18} className={isInWishlist(product.id) ? "fill-red-500 text-red-500 border-none" : ""} />
                  </button>
                  <div className="absolute inset-x-0 bottom-0 p-8 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                    <button 
                      onClick={() => addToCart(product, 1)}
                      className="w-full bg-white text-black py-4 rounded-full font-bold text-[10px] uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center space-x-3 hover:bg-black hover:text-white transition-colors"
                    >
                      <ShoppingBag size={14} />
                      <span>Thêm vào giỏ</span>
                    </button>
                  </div>
                </div>
                <div className="px-4 text-center">
                  <h3 className="font-bold text-lg mb-2 tracking-tight">{product.name}</h3>
                  <p className="text-gray-400 font-bold">{product.price.toLocaleString('vi-VN')}đ</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Section */}
      <section className="bg-black text-white py-32 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row items-center justify-between">
          <div className="max-w-2xl text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start space-x-4 mb-8">
              <Sparkles size={16} className="text-white/40" />
              <span className="text-[11px] font-bold uppercase tracking-[0.5em] text-white/20">AI Consultation</span>
            </div>
            <div className="mb-12">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-normal tracking-[0.15em] leading-tight uppercase whitespace-nowrap">TƯ VẤN KHÔNG GIAN</h2>
            </div>
            <p className="text-gray-500 mb-14 text-sm md:text-lg leading-relaxed font-light max-w-md mx-auto md:mx-0 tracking-wide">
              Nhận gợi ý thiết kế cá nhân hóa từ chuyên gia AI của LuxDecor ngay tức thì để nâng tầm giá trị ngôi nhà bạn.
            </p>
            <button 
              onClick={() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' })} 
              className="bg-white text-black px-12 py-5 rounded-full font-bold text-[10px] uppercase tracking-[0.3em] shadow-2xl flex items-center mx-auto md:mx-0 space-x-4 hover:scale-105 transition-transform"
            >
              <span>Trò chuyện ngay</span>
              <MessageSquare size={16} />
            </button>
          </div>
          <div className="md:w-1/2 flex justify-center md:justify-end mt-20 md:mt-0">
            <div className="w-full max-w-[450px] aspect-square rounded-[4rem] overflow-hidden relative border border-white/5 shadow-2xl group">
               <img 
                src="https://images.unsplash.com/photo-1600607687940-c524774d39f9?auto=format&fit=crop&q=80&w=1200" 
                alt="AI Design" 
                className="w-full h-full object-cover opacity-80 transition-transform duration-[10s] group-hover:scale-110" 
              />
               <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
            </div>
          </div>
        </div>
      </section>

      <AIAssistant />
    </div>
  );
};

export default Home;
