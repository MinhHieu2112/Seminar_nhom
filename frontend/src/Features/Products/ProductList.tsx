
import React, { useState, useEffect, useMemo } from 'react';
import { Product } from '../../../types';
import { api } from '../../../api';
import { Link } from 'react-router-dom';
import { Search, Loader2, SlidersHorizontal, Heart, ShoppingBag, ChevronLeft, ChevronRight } from 'lucide-react';
import { PRODUCTS, CATEGORIES } from '../../../constants';
import { useApp } from '../../App/App';

const MATERIALS = ['Tất cả', 'Gỗ', 'Kim loại', 'Vải', 'Đá', 'Da'];

const ProductList: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const { toggleWishlist, isInWishlist, addToCart } = useApp();
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [selectedMaterial, setSelectedMaterial] = useState('Tất cả');
  const [maxPrice, setMaxPrice] = useState<number>(30000000);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await api.products.getAll();
        setProducts(data.length > 0 ? data : PRODUCTS as any);
      } catch (e) {
        setProducts(PRODUCTS as any);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, maxPrice, selectedMaterial]);

  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            p.sku?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'Tất cả' || p.category === selectedCategory || p.category_id === selectedCategory;
      const matchesPrice = p.price <= maxPrice;
      const matchesMaterial = selectedMaterial === 'Tất cả' || p.material.toLowerCase().includes(selectedMaterial.toLowerCase());
      
      return matchesSearch && matchesCategory && matchesPrice && matchesMaterial;
    });
  }, [products, searchQuery, selectedCategory, maxPrice, selectedMaterial]);

  // Paginated data
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage]);

  const clearAllFilters = () => {
    setSelectedCategory('Tất cả');
    setSelectedMaterial('Tất cả');
    setMaxPrice(30000000);
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const gridElement = document.getElementById('product-grid');
    if (gridElement) {
      gridElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (loading) return (
    <div className="h-screen bg-white flex items-center justify-center">
      <Loader2 className="animate-spin text-gray-200" size={40} />
    </div>
  );

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-16 md:py-24">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8">
          <div className="animate-fade-in-up">
            <h1 className="text-3xl md:text-5xl font-normal mb-6 tracking-[0.1em] uppercase">BỘ SƯU TẬP NỘI THẤT</h1>
            <p className="text-gray-400 font-light max-w-lg leading-relaxed text-sm md:text-base">
              Mỗi thiết kế là một kiệt tác kiến trúc, mang đến sự tinh tế và đẳng cấp cho không gian sống hiện đại của bạn.
            </p>
          </div>
          
          <div className="flex w-full md:w-auto items-center gap-4 animate-fade-in-up delay-100">
            <div className="relative flex-grow md:w-80">
              <input 
                type="text" 
                placeholder="Tìm sản phẩm..." 
                className="w-full pl-6 pr-12 py-4 bg-gray-50 border border-gray-100 rounded-full text-sm focus:ring-1 focus:ring-black outline-none transition-all placeholder:text-gray-300"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
            </div>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`p-4 rounded-full border transition-all flex items-center justify-center ${showFilters ? 'bg-black text-white border-black' : 'bg-white text-black border-gray-100 hover:border-black shadow-sm'}`}
            >
              <SlidersHorizontal size={20} />
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Filters Sidebar */}
          <div className={`${showFilters ? 'block' : 'hidden'} lg:w-64 flex-shrink-0 space-y-12 animate-in fade-in slide-in-from-left-4 duration-500`}>
            {/* Category Filter */}
            <div>
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Danh mục</h3>
                <button onClick={clearAllFilters} className="text-[10px] text-black hover:text-gray-400 font-bold uppercase tracking-widest transition underline underline-offset-4">Xóa lọc</button>
              </div>
              <div className="space-y-1">
                {CATEGORIES.map(cat => (
                  <button 
                    key={cat} 
                    onClick={() => setSelectedCategory(cat)} 
                    className={`block w-full text-left px-5 py-3.5 rounded-2xl text-xs font-semibold tracking-wide transition-all ${selectedCategory === cat ? 'bg-black text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Material Filter */}
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-8">Chất liệu</h3>
              <div className="flex flex-wrap gap-2">
                {MATERIALS.map(mat => (
                  <button 
                    key={mat} 
                    onClick={() => setSelectedMaterial(mat)} 
                    className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all ${selectedMaterial === mat ? 'bg-black text-white border-black' : 'bg-white text-gray-400 border-gray-100 hover:border-black hover:text-black'}`}
                  >
                    {mat}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Filter */}
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-8">Giá tối đa</h3>
              <div className="px-2">
                <input type="range" min="0" max="30000000" step="1000000" className="w-full h-1 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-black" value={maxPrice} onChange={(e) => setMaxPrice(parseInt(e.target.value))} />
                <div className="flex justify-between mt-6 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                  <span>0đ</span>
                  <span className="text-black font-extrabold">{maxPrice.toLocaleString('vi-VN')}đ</span>
                </div>
              </div>
            </div>
          </div>

          {/* Product Grid & Pagination Container */}
          <div className="flex-grow" id="product-grid">
            {paginatedItems.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-10 gap-y-16">
                  {paginatedItems.map((product, idx) => {
                    const baseImageUrl = (product.images?.[0] || (product as any).image).split('?')[0];
                    return (
                      <div key={product.id} className="group flex flex-col animate-fade-in-up" style={{ animationDelay: `${idx * 100}ms` }}>
                        <div className="aspect-[4/5] overflow-hidden rounded-[3rem] bg-gray-50 mb-8 relative shadow-sm group-hover:shadow-2xl transition-all duration-700">
                          <Link to={`/product/${product.id}`} className="block w-full h-full">
                            <img 
                              src={`${baseImageUrl}?auto=format&fit=crop&q=80&w=800`}
                              alt={product.name} 
                              className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110" 
                              loading="lazy"
                            />
                          </Link>
                          
                          <button 
                            onClick={() => toggleWishlist(product)}
                            className="absolute top-8 right-8 p-3.5 bg-white/20 backdrop-blur-xl rounded-full text-white hover:bg-white hover:text-black transition-all z-20 shadow-xl border border-white/30"
                          >
                            <Heart size={18} className={isInWishlist(product.id) ? "fill-red-500 text-red-500 border-none" : "transition-transform group-active:scale-90"} />
                          </button>

                          <div className="absolute inset-x-0 bottom-0 p-8 translate-y-full group-hover:translate-y-0 transition-transform duration-500 z-10">
                            <button 
                              onClick={() => addToCart(product, 1)}
                              className="w-full bg-white text-black py-4 rounded-full font-bold text-[10px] uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center space-x-3 hover:bg-black hover:text-white transition-colors"
                            >
                              <ShoppingBag size={14} />
                              <span>Thêm nhanh</span>
                            </button>
                          </div>

                          {product.discount > 0 && (
                            <div className="absolute top-8 left-8 bg-black text-white text-[9px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                              -{product.discount}%
                            </div>
                          )}
                        </div>

                        <div className="px-4">
                          <div className="flex justify-between items-start mb-2">
                             <Link to={`/product/${product.id}`} className="flex-grow">
                                <h3 className="font-bold text-lg tracking-tight group-hover:text-gray-400 transition-colors duration-300 line-clamp-1">{product.name}</h3>
                             </Link>
                             <p className="font-bold text-lg text-black ml-4 whitespace-nowrap">{product.price.toLocaleString('vi-VN')}đ</p>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.2em]">{product.category}</p>
                            <span className="text-[9px] font-bold text-gray-200 tracking-widest uppercase">{product.material.split(',')[0]}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {totalPages > 1 && (
                  <div className="mt-24 flex items-center justify-center space-x-3">
                    <button 
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-4 rounded-full border border-gray-100 text-gray-400 hover:text-black hover:border-black disabled:opacity-30 disabled:pointer-events-none transition-all"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    
                    <div className="flex items-center space-x-2">
                      {[...Array(totalPages)].map((_, i) => (
                        <button
                          key={i}
                          onClick={() => handlePageChange(i + 1)}
                          className={`w-12 h-12 rounded-full text-xs font-bold transition-all ${
                            currentPage === i + 1 
                              ? 'bg-black text-white shadow-xl scale-110' 
                              : 'bg-white text-gray-400 border border-gray-50 hover:border-black hover:text-black'
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>

                    <button 
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="p-4 rounded-full border border-gray-100 text-gray-400 hover:text-black hover:border-black disabled:opacity-30 disabled:pointer-events-none transition-all"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="h-96 flex flex-col items-center justify-center text-center space-y-8 animate-fade-in-up">
                 <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center shadow-inner">
                    <Search className="text-gray-200" size={32} />
                 </div>
                 <div className="max-w-xs">
                    <h3 className="text-xl font-bold mb-3 tracking-tight">KHÔNG TÌM THẤY SẢN PHẨM</h3>
                    <p className="text-gray-400 font-light text-sm leading-relaxed">Hãy thử thay đổi từ khóa tìm kiếm hoặc điều chỉnh lại các tiêu chí lọc.</p>
                 </div>
                 <button onClick={clearAllFilters} className="px-12 py-4 bg-black text-white rounded-full text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-gray-800 transition shadow-xl">Xóa tất cả bộ lọc</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductList;
