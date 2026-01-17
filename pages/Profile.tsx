
import React, { useState } from 'react';
import { useApp } from '../App';
import { useNavigate } from 'react-router-dom';
import { User, Settings, MapPin, Bell, ShieldCheck, Heart, Plus, Trash2, CheckCircle2, Package, Tag, Info, ArrowRight, Loader2, KeyRound, X, Phone, User as UserIconAlt, AlertCircle } from 'lucide-react';
import { Notification, Address } from '../types';

const Profile: React.FC = () => {
  const { authState, wishlist } = useApp();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'info' | 'address' | 'notify' | 'security'>('info');

  // Address State Management
  const [addresses, setAddresses] = useState<Address[]>([
    { id: '1', name: 'Nhà riêng', phone: '0901234567', address: '123 Đường Kiến Trúc, Quận 1, TP. HCM', isDefault: true },
    { id: '2', name: 'Văn phòng', phone: '0901234567', address: '456 Đại lộ Thẩm Mỹ, Quận 7, TP. HCM', isDefault: false }
  ]);

  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addressFormData, setAddressFormData] = useState({ name: '', phone: '', address: '', isDefault: false });

  const [notifications] = useState<Notification[]>([
    { id: 'n1', title: 'Đơn hàng đang giao', content: 'Đơn hàng ORD-8231 của bạn đã rời kho và đang trên đường đến.', date: 'Hôm nay', type: 'order', isRead: false },
    { id: 'n2', title: 'Ưu đãi nội thất Xuân 2025', content: 'LuxDecor tặng bạn mã giảm giá 15% cho bộ sưu tập Sofa mới.', date: '2 ngày trước', type: 'promo', isRead: true },
    { id: 'n3', title: 'Cập nhật hệ thống', content: 'Chúng tôi vừa nâng cấp AI Designer để hỗ trợ bạn tốt hơn.', date: '1 tuần trước', type: 'system', isRead: true }
  ]);

  const [isUpdating, setIsUpdating] = useState(false);

  if (!authState.isAuthenticated) {
    return <div className="p-24 text-center">Vui lòng đăng nhập để xem thông tin.</div>;
  }

  const openAddressModal = (address?: Address) => {
    if (address) {
      setEditingAddress(address);
      setAddressFormData({ name: address.name, phone: address.phone, address: address.address, isDefault: address.isDefault });
    } else {
      setEditingAddress(null);
      setAddressFormData({ name: '', phone: '', address: '', isDefault: false });
    }
    setIsAddressModalOpen(true);
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAddress) {
      const updated = addresses.map(a => {
        if (a.id === editingAddress.id) {
          return { ...a, ...addressFormData };
        }
        // If the updated address is set as default, unset others
        if (addressFormData.isDefault && a.id !== editingAddress.id) {
          return { ...a, isDefault: false };
        }
        return a;
      });
      setAddresses(updated);
    } else {
      const newAddr: Address = {
        id: `ADDR-${Date.now()}`,
        ...addressFormData
      };
      let updated = [...addresses];
      // If this is the first address, it must be default
      if (updated.length === 0) {
        newAddr.isDefault = true;
      } else if (newAddr.isDefault) {
        updated = updated.map(a => ({ ...a, isDefault: false }));
      }
      setAddresses([...updated, newAddr]);
    }
    setIsAddressModalOpen(false);
  };

  const handleDeleteAddress = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) {
      const remaining = addresses.filter(a => a.id !== id);
      const deletedWasDefault = addresses.find(a => a.id === id)?.isDefault;
      
      // If we deleted the default one and there are still others, pick the first one as default
      if (deletedWasDefault && remaining.length > 0) {
        remaining[0].isDefault = true;
      }
      
      setAddresses(remaining);
    }
  };

  const handleClearAllAddresses = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ sổ địa chỉ?')) {
      setAddresses([]);
    }
  };

  const handleSetDefault = (id: string) => {
    setAddresses(addresses.map(a => ({
      ...a,
      isDefault: a.id === id
    })));
  };

  const renderTabContent = () => {
    switch(activeTab) {
      case 'info':
        return (
          <div className="space-y-8 animate-fade-in-up">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Họ và tên</label>
                <input type="text" defaultValue={authState.user?.name} className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 outline-none focus:ring-1 focus:ring-black text-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Email</label>
                <input type="email" defaultValue={authState.user?.email} className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 outline-none focus:ring-1 focus:ring-black text-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Số điện thoại</label>
                <input type="tel" defaultValue={authState.user?.phone} className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 outline-none focus:ring-1 focus:ring-black text-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Thành viên</label>
                <div className="w-full bg-black text-white rounded-2xl px-6 py-4 text-sm font-bold flex items-center justify-between">
                  <span>Hạng Gold</span>
                  <Tag size={16} />
                </div>
              </div>
            </div>
            <button 
              onClick={() => { setIsUpdating(true); setTimeout(() => setIsUpdating(false), 1000); }} 
              className="bg-black text-white px-10 py-4 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition flex items-center gap-2"
            >
              {isUpdating ? <Loader2 size={16} className="animate-spin" /> : 'Cập nhật thông tin'}
            </button>
          </div>
        );
      case 'address':
        return (
          <div className="space-y-6 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
              <h3 className="text-xl font-bold tracking-tight uppercase">Sổ địa chỉ ({addresses.length})</h3>
              <div className="flex items-center gap-4">
                {addresses.length > 0 && (
                  <button 
                    onClick={handleClearAllAddresses}
                    className="flex items-center gap-2 text-red-500 hover:text-red-700 px-4 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest transition border border-transparent hover:bg-red-50"
                  >
                    Xóa tất cả
                  </button>
                )}
                <button 
                  onClick={() => openAddressModal()}
                  className="flex items-center gap-2 bg-black text-white px-8 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest transition hover:bg-gray-800 shadow-lg"
                >
                  <Plus size={14} /> Thêm mới
                </button>
              </div>
            </div>
            
            {addresses.length > 0 ? (
              <div className="grid grid-cols-1 gap-6">
                {addresses.map(addr => (
                  <div key={addr.id} className={`p-8 rounded-[2.5rem] border-2 transition-all group/addr ${addr.isDefault ? 'bg-white border-black shadow-2xl scale-[1.02]' : 'bg-gray-50 border-transparent hover:border-gray-200'}`}>
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-2xl ${addr.isDefault ? 'bg-black text-white' : 'bg-white text-gray-400'}`}>
                          <MapPin size={20} />
                        </div>
                        <div>
                          <h4 className="font-bold uppercase tracking-tight text-lg">{addr.name}</h4>
                          {addr.isDefault && <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400">Địa chỉ giao hàng mặc định</span>}
                        </div>
                      </div>
                      <div className="flex gap-4 opacity-0 group-hover/addr:opacity-100 transition-opacity">
                        {!addr.isDefault && (
                          <button 
                            onClick={() => handleSetDefault(addr.id)}
                            className="text-[9px] font-bold uppercase tracking-widest text-gray-400 hover:text-black transition"
                          >
                            Đặt mặc định
                          </button>
                        )}
                        <button 
                          onClick={() => openAddressModal(addr)}
                          className="text-xs font-bold underline underline-offset-8 hover:text-gray-400 transition"
                        >
                          Sửa
                        </button>
                        <button 
                          onClick={() => handleDeleteAddress(addr.id)}
                          className="w-10 h-10 rounded-full bg-red-50 text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition"
                          title="Xóa địa chỉ"
                        >
                          <Trash2 size={16}/>
                        </button>
                      </div>
                    </div>
                    <div className="pl-14 space-y-3">
                      <div className="flex items-center gap-3 text-sm font-bold text-gray-700">
                        <Phone size={14} className="text-gray-300" />
                        <span>{addr.phone}</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <p className="text-sm text-gray-500 font-light leading-relaxed">{addr.address}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-24 text-center bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-100">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                  <AlertCircle className="text-gray-200" size={32} />
                </div>
                <h4 className="text-lg font-bold uppercase tracking-tight mb-2">Chưa có địa chỉ nào</h4>
                <p className="text-gray-400 text-sm font-light max-w-xs mx-auto mb-10">Vui lòng thêm địa chỉ giao hàng để quy trình đặt hàng diễn ra nhanh chóng hơn.</p>
                <button 
                  onClick={() => openAddressModal()}
                  className="bg-black text-white px-10 py-4 rounded-full text-[10px] font-bold uppercase tracking-widest transition hover:bg-gray-800 shadow-xl"
                >
                  Thêm địa chỉ ngay
                </button>
              </div>
            )}
          </div>
        );
      case 'notify':
        return (
          <div className="space-y-6 animate-fade-in-up">
            <h3 className="text-xl font-bold tracking-tight uppercase mb-8">Thông báo của bạn</h3>
            <div className="space-y-4">
              {notifications.map(n => (
                <div key={n.id} className={`flex gap-6 p-6 rounded-3xl border border-gray-100 hover:shadow-lg transition-all ${!n.isRead ? 'bg-gray-50 border-l-4 border-l-black' : 'bg-white'}`}>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${n.type === 'order' ? 'bg-blue-50 text-blue-500' : n.type === 'promo' ? 'bg-orange-50 text-orange-500' : 'bg-gray-100 text-gray-500'}`}>
                    {n.type === 'order' ? <Package size={20}/> : n.type === 'promo' ? <Tag size={20}/> : <Info size={20}/>}
                  </div>
                  <div className="flex-grow">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="font-bold text-sm uppercase tracking-tight">{n.title}</h4>
                      <span className="text-[10px] text-gray-300 font-bold uppercase">{n.date}</span>
                    </div>
                    <p className="text-sm text-gray-500 font-light">{n.content}</p>
                  </div>
                  <button className="self-center p-2 text-gray-300 hover:text-black transition"><ArrowRight size={16}/></button>
                </div>
              ))}
            </div>
          </div>
        );
      case 'security':
        return (
          <div className="max-w-xl animate-fade-in-up">
            <h3 className="text-xl font-bold tracking-tight uppercase mb-10 flex items-center gap-3">
              <KeyRound size={24} /> Bảo mật tài khoản
            </h3>
            <div className="space-y-8">
               <div className="p-8 bg-gray-50 rounded-[2rem] space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Mật khẩu hiện tại</label>
                    <input type="password" placeholder="••••••••" className="w-full bg-white border-none rounded-xl px-6 py-4 outline-none focus:ring-1 focus:ring-black text-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Mật khẩu mới</label>
                    <input type="password" placeholder="••••••••" className="w-full bg-white border-none rounded-xl px-6 py-4 outline-none focus:ring-1 focus:ring-black text-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Xác nhận mật khẩu</label>
                    <input type="password" placeholder="••••••••" className="w-full bg-white border-none rounded-xl px-6 py-4 outline-none focus:ring-1 focus:ring-black text-sm" />
                  </div>
               </div>
               <div className="flex items-center gap-6 p-6 bg-blue-50 text-blue-700 rounded-2xl">
                  <ShieldCheck size={24} />
                  <p className="text-xs font-bold uppercase tracking-wide">Mật khẩu nên chứa ít nhất 8 ký tự, bao gồm chữ cái và số.</p>
               </div>
               <button className="bg-black text-white px-10 py-4 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition">Đổi mật khẩu</button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 md:py-20">
      <div className="flex flex-col lg:flex-row gap-16">
        {/* Left Sidebar */}
        <div className="lg:w-80 space-y-12">
          <div className="text-center lg:text-left">
             <div className="w-32 h-32 rounded-[2.5rem] bg-gray-50 overflow-hidden flex items-center justify-center border-2 border-white shadow-2xl mx-auto lg:mx-0 mb-8 relative group">
                {authState.user?.avatar ? <img src={authState.user.avatar} className="w-full h-full object-cover" /> : <UserIconAlt size={48} className="text-gray-200" />}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                  <Settings className="text-white" size={24} />
                </div>
             </div>
             <h1 className="text-3xl font-bold tracking-tighter mb-2">{authState.user?.name}</h1>
             <p className="text-gray-400 font-light text-sm">{authState.user?.email}</p>
          </div>

          <div className="space-y-2">
            {[
              { id: 'info', icon: <User size={18}/>, title: 'Thông tin cá nhân' },
              { id: 'address', icon: <MapPin size={18}/>, title: 'Sổ địa chỉ' },
              { id: 'notify', icon: <Bell size={18}/>, title: 'Thông báo hệ thống' },
              { id: 'security', icon: <ShieldCheck size={18}/>, title: 'Bảo mật & Mật khẩu' }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center space-x-4 px-6 py-5 rounded-3xl text-sm font-bold uppercase tracking-wide transition-all ${activeTab === tab.id ? 'bg-black text-white shadow-xl' : 'text-gray-400 hover:bg-gray-50'}`}
              >
                {tab.icon}
                <span>{tab.title}</span>
              </button>
            ))}
          </div>

          <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100">
             <div className="flex items-center space-x-4 mb-6">
                <div className="p-3 bg-red-50 text-red-500 rounded-2xl"><Heart size={20} /></div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Yêu thích</p>
                  <p className="text-xl font-bold">{wishlist.length} món đồ</p>
                </div>
             </div>
             <button onClick={() => navigate('/wishlist')} className="w-full py-4 border-2 border-black rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-black hover:text-white transition">Xem danh sách</button>
          </div>
        </div>

        {/* Right Content */}
        <div className="flex-grow">
          <div className="bg-white rounded-[3.5rem] p-4 md:p-12 lg:min-h-[600px]">
             {renderTabContent()}
          </div>
        </div>
      </div>

      {/* Address Modal */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsAddressModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-lg rounded-[3rem] p-10 md:p-14 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
            <button 
              onClick={() => setIsAddressModalOpen(false)}
              className="absolute top-8 right-8 p-2 text-gray-400 hover:text-black transition"
            >
              <X size={24} />
            </button>
            <h3 className="text-2xl font-bold mb-10 tracking-tight uppercase">
              {editingAddress ? 'Cập nhật địa chỉ' : 'Thêm địa chỉ mới'}
            </h3>
            
            <form onSubmit={handleSaveAddress} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Tên gợi nhớ (Ví dụ: Nhà riêng, Công ty)</label>
                <input 
                  type="text" 
                  className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 outline-none focus:ring-1 focus:ring-black text-sm"
                  value={addressFormData.name}
                  onChange={(e) => setAddressFormData({...addressFormData, name: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Số điện thoại</label>
                <input 
                  type="tel" 
                  className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 outline-none focus:ring-1 focus:ring-black text-sm"
                  value={addressFormData.phone}
                  onChange={(e) => setAddressFormData({...addressFormData, phone: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Địa chỉ chi tiết</label>
                <textarea 
                  className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 h-28 outline-none focus:ring-1 focus:ring-black text-sm resize-none"
                  value={addressFormData.address}
                  onChange={(e) => setAddressFormData({...addressFormData, address: e.target.value})}
                  required
                />
              </div>
              <label className="flex items-center space-x-3 cursor-pointer p-2">
                <input 
                  type="checkbox" 
                  className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black"
                  checked={addressFormData.isDefault}
                  onChange={(e) => setAddressFormData({...addressFormData, isDefault: e.target.checked})}
                />
                <span className="text-xs font-bold uppercase tracking-widest text-gray-600">Đặt làm địa chỉ mặc định</span>
              </label>
              
              <div className="pt-6 flex gap-4">
                <button 
                  type="button"
                  onClick={() => setIsAddressModalOpen(false)}
                  className="flex-grow py-5 border-2 border-black rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-gray-50 transition"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit"
                  className="flex-grow bg-black text-white py-5 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-gray-800 transition shadow-xl"
                >
                  {editingAddress ? 'Cập nhật' : 'Lưu địa chỉ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
