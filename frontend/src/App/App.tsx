
import React, { useState, useEffect, createContext, useContext } from 'react';
import { HashRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { Product, CartItem, User, Order, AuthState, DiscountCode } from '../../types';
import Home from '../Features/Home/Home';
import ProductList from '../Features/Products/ProductList';
import ProductDetail from '../Features/Products/ProductDetail';
import Cart from '../Features/Cart/Cart';
import Checkout from '../Features/Checkout/Checkout';
import Profile from '../Features/Profile/Profile';
import Orders from '../Features/Orders/Orders';
import Login from '../Features/Authentication/Login';
import Register from '../Features/Authentication/Register';
import ForgotPassword from '../Features/Authentication/ForgotPassword';
import Portfolio from '../Features/Portfolio/Portfolio';
import Services from '../Features/Service/Services';
import Wishlist from '../Features/Wishlist/Wishlist';
import { ShoppingBag, User as UserIcon, LogOut, Menu, X, Heart, Facebook, Instagram, Linkedin, Twitter } from 'lucide-react';

interface AppContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  wishlist: Product[];
  toggleWishlist: (product: Product) => void;
  isInWishlist: (id: string) => boolean;
  authState: AuthState;
  login: (user: User) => void;
  logout: () => void;
  orders: Order[];
  addOrder: (order: Order) => void;
  cancelOrder: (id: string) => void;
  appliedDiscount: DiscountCode | null;
  applyDiscount: (code: DiscountCode | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};

const Navbar = () => {
  const { cart, wishlist, authState, logout } = useApp();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'TRANG CHỦ', path: '/' },
    { name: 'SẢN PHẨM', path: '/products' },
    { name: 'DỊCH VỤ', path: '/services' },
    { name: 'DỰ ÁN', path: '/portfolio' },
    { name: 'ĐƠN HÀNG', path: '/orders' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold tracking-tighter">
              <span className="text-black">LUX</span><span className="text-gray-400">DECOR</span>
            </Link>
          </div>

          <div className="hidden md:flex space-x-8 items-center">
            {navLinks.map(link => (
              <Link 
                key={link.path}
                to={link.path} 
                className={`text-[11px] font-bold tracking-widest hover:text-gray-400 transition ${location.pathname === link.path ? 'text-black' : 'text-gray-400'}`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="flex items-center space-x-2 md:space-x-4">
            <Link to="/wishlist" className="relative p-2 text-gray-700 hover:text-red-500 transition">
              <Heart size={20} className={wishlist.length > 0 ? "fill-current text-red-500" : ""} />
              {wishlist.length > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </Link>
            <Link to="/cart" className="relative p-2 text-gray-700 hover:text-black transition">
              <ShoppingBag size={20} />
              {cart.length > 0 && (
                <span className="absolute top-0 right-0 bg-black text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </Link>
            {authState.isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <Link to="/profile" className="flex items-center space-x-2 text-sm font-medium">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border border-gray-100">
                    {authState.user?.avatar ? <img src={authState.user.avatar} className="w-full h-full object-cover" /> : <UserIcon size={16} />}
                  </div>
                </Link>
                <button onClick={logout} className="p-2 text-gray-500 hover:text-black transition">
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <Link to="/login" className="text-xs font-bold border-b-2 border-black pb-0.5">ĐĂNG NHẬP</Link>
            )}
            <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 py-6 px-4 shadow-xl space-y-4">
          {navLinks.map(link => (
            <Link key={link.path} to={link.path} onClick={() => setIsMenuOpen(false)} className="block text-lg font-bold tracking-tight">{link.name}</Link>
          ))}
          <Link to="/wishlist" onClick={() => setIsMenuOpen(false)} className="block text-lg font-bold tracking-tight text-red-500">DANH SÁCH YÊU THÍCH</Link>
        </div>
      )}
    </nav>
  );
};

export default function App() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [authState, setAuthState] = useState<AuthState>({ user: null, isAuthenticated: false });
  const [orders, setOrders] = useState<Order[]>([]);
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountCode | null>(null);

  const addToCart = (product: Product, quantity: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item);
      }
      return [...prev, { ...product, quantity }];
    });
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(item => item.id !== id));
  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item));
  };
  const clearCart = () => { setCart([]); setAppliedDiscount(null); };

  const toggleWishlist = (product: Product) => {
    setWishlist(prev => {
      const exists = prev.some(item => item.id === product.id);
      if (exists) {
        return prev.filter(item => item.id !== product.id);
      }
      return [...prev, product];
    });
  };

  const isInWishlist = (id: string) => wishlist.some(item => item.id === id);
  const login = (user: User) => setAuthState({ user, isAuthenticated: true });
  const logout = () => { 
    setAuthState({ user: null, isAuthenticated: false }); 
    setCart([]); 
    setWishlist([]); 
    setAppliedDiscount(null);
  };
  const addOrder = (order: Order) => setOrders(prev => [order, ...prev]);
  const cancelOrder = (id: string) => setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'cancelled' as any } : o));
  const applyDiscount = (code: DiscountCode | null) => setAppliedDiscount(code);

  return (
    <AppContext.Provider value={{ 
      cart, addToCart, removeFromCart, updateQuantity, clearCart, 
      wishlist, toggleWishlist, isInWishlist, authState, login, logout, 
      orders, addOrder, cancelOrder, appliedDiscount, applyDiscount 
    }}>
      <HashRouter>
        <div className="flex flex-col min-h-screen bg-white">
          <Navbar />
          <main className="flex-grow pt-20 bg-white">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/products" element={<ProductList />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/services" element={<Services />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
            </Routes>
          </main>
          <footer className="bg-white text-black py-12 border-t border-gray-100">
            <div className="max-w-7xl mx-auto px-8">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-10 mb-12">
                <div className="md:col-span-5">
                  <div className="mb-6">
                    <Link to="/" className="text-3xl font-bold tracking-tighter inline-block">
                      <span className="text-black">LUX</span><span className="text-gray-400">DECOR</span>
                    </Link>
                  </div>
                  <p className="text-gray-400 max-w-sm font-light leading-[1.8] text-sm mb-6">
                    Kiến tạo không gian sống đẳng cấp thông qua sự kết hợp của công nghệ và nghệ thuật.
                  </p>
                  <div className="flex space-x-4">
                    <a href="#" className="p-2.5 bg-gray-50 rounded-full hover:bg-black hover:text-white transition-all"><Facebook size={16} /></a>
                    <a href="#" className="p-2.5 bg-gray-50 rounded-full hover:bg-black hover:text-white transition-all"><Instagram size={16} /></a>
                    <a href="#" className="p-2.5 bg-gray-50 rounded-full hover:bg-black hover:text-white transition-all"><Linkedin size={16} /></a>
                    <a href="#" className="p-2.5 bg-gray-50 rounded-full hover:bg-black hover:text-white transition-all"><Twitter size={16} /></a>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-6">Liên kết</h3>
                  <ul className="space-y-3 text-xs tracking-wide">
                    <li><Link to="/products" className="hover:text-gray-400 transition-colors uppercase">Sản phẩm</Link></li>
                    <li><Link to="/services" className="hover:text-gray-400 transition-colors uppercase">Dịch vụ</Link></li>
                    <li><Link to="/portfolio" className="hover:text-gray-400 transition-colors uppercase">Dự án</Link></li>
                  </ul>
                </div>
                <div className="md:col-span-2">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-6">Hỗ trợ</h3>
                  <ul className="space-y-3 text-xs tracking-wide">
                    <li><a href="#" className="hover:text-gray-400 transition-colors uppercase">Vận chuyển</a></li>
                    <li><a href="#" className="hover:text-gray-400 transition-colors uppercase">Đổi trả</a></li>
                    <li><a href="#" className="hover:text-gray-400 transition-colors uppercase">Bảo mật</a></li>
                  </ul>
                </div>
                <div className="md:col-span-3">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-6">Kết nối</h3>
                  <div className="space-y-2">
                    <p className="text-xs tracking-wide uppercase">contact@luxdecor.vn</p>
                    <p className="text-xs tracking-wide uppercase">+84 123 456 789</p>
                    <p className="text-xs tracking-wide uppercase">123 Đồng Khởi, Quận 1, TP. HCM.</p>
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-50 flex flex-col md:flex-row justify-between items-center gap-6">
                <p className="text-xs font-bold text-gray-300 uppercase tracking-widest">© 2025 LuxDecor Architecture.</p>
                <div className="flex space-x-6">
                  <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">Global Design Standards</span>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </HashRouter>
    </AppContext.Provider>
  );
}
