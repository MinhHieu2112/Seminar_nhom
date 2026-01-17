
import React, { useState } from 'react';
import { api } from '../api';
import { useApp } from '../App';
import { CheckCircle, ArrowRight, Loader2, Award, Clock, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

const Services: React.FC = () => {
  const { authState } = useApp();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    service_id: '1',
    area: '',
    budget: '',
    note: ''
  });

  const services = [
    { 
      id: '1', 
      name: 'Thiết kế Nội thất', 
      desc: 'Sáng tạo không gian sống hiện đại, tối ưu công năng và thẩm mỹ cá nhân hóa.',
      image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=800',
      features: ['3D Rendering', 'Moodboard', 'Lựa chọn vật liệu']
    },
    { 
      id: '2', 
      name: 'Kiến trúc & Xây dựng', 
      desc: 'Thiết kế kiến trúc trọn gói từ móng đến mái cho nhà phố, biệt thự và văn phòng.',
      image: 'https://images.unsplash.com/photo-1600585154340-be6199f7d009?auto=format&fit=crop&q=80&w=800',
      features: ['Xin phép xây dựng', 'Kết cấu & Điện nước', 'Giám sát tác giả']
    },
    { 
      id: '3', 
      name: 'Thi công Trọn gói', 
      desc: 'Đảm bảo chất lượng thi công và tiến độ cam kết với đội ngũ kỹ sư giàu kinh nghiệm.',
      image: 'https://images.unsplash.com/photo-1503387762-592dea58292b?auto=format&fit=crop&q=80&w=800',
      features: ['Báo giá minh bạch', 'Bảo hành 2 năm', 'Bàn giao chìa khóa trao tay']
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authState.isAuthenticated) return alert('Vui lòng đăng nhập để gửi yêu cầu!');
    
    setIsSubmitting(true);
    try {
      await api.services.request({
        user_id: authState.user!.id,
        service_id: formData.service_id,
        area: parseFloat(formData.area),
        budget: parseFloat(formData.budget),
        note: formData.note,
        status: 'new'
      });
      setIsSuccess(true);
    } catch (error) {
      setIsSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="max-w-xl mx-auto py-32 text-center px-4">
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8">
          <CheckCircle size={32} className="text-green-500" />
        </div>
        <h2 className="text-2xl font-bold mb-4 tracking-tight uppercase">Yêu cầu đã được gửi!</h2>
        <p className="text-gray-500 mb-8 font-light text-sm">Kiến trúc sư của LuxDecor sẽ liên hệ tư vấn và báo giá cho bạn trong vòng 24h.</p>
        <button onClick={() => setIsSuccess(false)} className="bg-black text-white px-8 py-3 rounded-full text-[11px] font-bold uppercase tracking-widest">Quay lại trang dịch vụ</button>
      </div>
    );
  }

  return (
    <div className="bg-white">
      {/* Hero Header - Matching Portfolio style, single line with refined tracking */}
      <section className="relative h-[75vh] flex items-center justify-center overflow-hidden mx-4 md:mx-8 my-8 rounded-[5rem] shadow-2xl">
        <img 
          src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=90&w=2000" 
          className="absolute inset-0 w-full h-full object-cover scale-110 opacity-70 animate-ken-burns"
          alt="Services Banner"
        />
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative text-center max-w-7xl mx-4 animate-fade-in-up">
           <span className="text-[11px] font-bold uppercase tracking-[0.6em] text-white/40 mb-12 block">Expert Solutions</span>
           <h1 className="text-3xl md:text-5xl lg:text-7xl font-normal tracking-[0.15em] leading-none text-white uppercase mb-14 whitespace-nowrap">
            DỊCH VỤ CHUYÊN NGHIỆP
           </h1>
           <p className="text-white/80 max-w-3xl mx-auto font-light text-sm md:text-xl leading-[2.2] tracking-wide">
            Kiến tạo giá trị vững bền thông qua quy trình thiết kế chuẩn mực và thực thi tinh xảo hàng đầu.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-24">
          <div className="lg:col-span-7 space-y-16">
            <div className="grid grid-cols-1 gap-14">
              {services.map((s, index) => (
                <div key={s.id} className="group flex flex-col md:flex-row gap-10 items-center bg-gray-50 rounded-[3rem] overflow-hidden p-10 hover:bg-white hover:shadow-2xl transition-all duration-700 border border-transparent hover:border-gray-100">
                  <div className="w-full md:w-2/5 aspect-[4/3] rounded-3xl overflow-hidden shadow-sm">
                    <img src={s.image} alt={s.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2s]" />
                  </div>
                  <div className="w-full md:w-3/5">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.4em] mb-4 block">Service 0{index + 1}</span>
                    <h3 className="text-2xl font-bold mb-4 tracking-tight uppercase">{s.name}</h3>
                    <p className="text-gray-500 text-sm font-light mb-8 leading-loose">{s.desc}</p>
                    <ul className="flex flex-wrap gap-3">
                      {s.features.map((f, i) => (
                        <li key={i} className="text-[9px] font-bold bg-white px-4 py-2 rounded-full border border-gray-100 uppercase tracking-widest">{f}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-8 py-16 border-y border-gray-100">
              <div className="text-center">
                <div className="flex justify-center mb-5 text-black"><Award size={28} strokeWidth={1.2} /></div>
                <h4 className="text-[11px] font-bold uppercase tracking-widest mb-1">Chất lượng</h4>
                <p className="text-[10px] text-gray-400">Chuẩn quốc tế</p>
              </div>
              <div className="text-center">
                <div className="flex justify-center mb-5 text-black"><Clock size={28} strokeWidth={1.2} /></div>
                <h4 className="text-[11px] font-bold uppercase tracking-widest mb-1">Tiến độ</h4>
                <p className="text-[10px] text-gray-400">Đúng cam kết</p>
              </div>
              <div className="text-center">
                <div className="flex justify-center mb-5 text-black"><Users size={28} strokeWidth={1.2} /></div>
                <h4 className="text-[11px] font-bold uppercase tracking-widest mb-1">Chuyên gia</h4>
                <p className="text-[10px] text-gray-400">Kinh nghiệm</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="bg-white border border-gray-100 rounded-[3rem] p-12 shadow-2xl sticky top-28">
              <h2 className="text-2xl font-bold mb-4 tracking-tight uppercase">Đăng ký tư vấn</h2>
              <p className="text-gray-400 text-sm font-light mb-12">Kiến trúc sư của chúng tôi sẽ liên hệ trong vòng 24h.</p>
              
              <form onSubmit={handleSubmit} className="space-y-8">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-4 ml-1">Dịch vụ quan tâm</label>
                  <select 
                    className="w-full bg-gray-50 border-none rounded-2xl px-6 py-5 text-xs outline-none focus:ring-1 focus:ring-black appearance-none"
                    value={formData.service_id}
                    onChange={(e) => setFormData({...formData, service_id: e.target.value})}
                  >
                    {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-5">
                  <input 
                    type="number" 
                    className="w-full bg-gray-50 border-none rounded-2xl px-6 py-5 text-xs outline-none focus:ring-1 focus:ring-black"
                    placeholder="Diện tích (m²)"
                    required
                    value={formData.area}
                    onChange={(e) => setFormData({...formData, area: e.target.value})}
                  />
                  <input 
                    type="number" 
                    className="w-full bg-gray-50 border-none rounded-2xl px-6 py-5 text-xs outline-none focus:ring-1 focus:ring-black"
                    placeholder="Ngân sách (VNĐ)"
                    required
                    value={formData.budget}
                    onChange={(e) => setFormData({...formData, budget: e.target.value})}
                  />
                </div>
                
                <textarea 
                  className="w-full bg-gray-50 border-none rounded-2xl px-6 py-5 text-xs h-40 resize-none outline-none focus:ring-1 focus:ring-black"
                  placeholder="Ghi chú yêu cầu cụ thể..."
                  value={formData.note}
                  onChange={(e) => setFormData({...formData, note: e.target.value})}
                />
                
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-black text-white py-5 rounded-full font-bold text-[11px] flex items-center justify-center space-x-4 hover:bg-gray-900 transition-all uppercase tracking-[0.2em] shadow-xl"
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <><span>Gửi đăng ký</span><ArrowRight size={20} /></>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Services;
