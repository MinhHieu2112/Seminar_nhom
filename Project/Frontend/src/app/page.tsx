'use client';

import Link from 'next/link';

export default function HomePage() {
  const features = [
    { icon: '🎯', title: 'Thiết Lập Mục Tiêu', desc: 'Xác định mục tiêu học tập rõ ràng và để AI vạch ra chi tiết.' },
    { icon: '🤖', title: 'AI Phân Tách Nhiệm Vụ', desc: 'Tự động chia nhỏ mục tiêu lớn thành các nhiệm vụ dễ quản lý.' },
    { icon: '📅', title: 'Lên Lịch Thông Minh', desc: 'Tự động xếp lịch vào thời gian rảnh với phương pháp Pomodoro.' },
    { icon: '📊', title: 'Phân Tích Tiến Độ', desc: 'Theo dõi chi tiết quá trình học tập và đánh giá hiệu suất.' },
    { icon: '⏰', title: 'Tập Trung Cao Độ', desc: 'Đồng hồ Pomodoro tích hợp giúp bạn luôn giữ sự tập trung.' },
  ];

  // Nhân đôi mảng để tạo hiệu ứng cuộn vô tận mượt mà
  const carouselItems = [...features, ...features];

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-gray-800 selection:bg-green-100">
      <style>{`
        @keyframes slide {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .carousel-track {
          display: flex;
          width: 200%;
          animation: slide 25s linear infinite;
        }
        .carousel-track:hover {
          animation-play-state: paused;
        }
        .green-gradient-text {
          background: linear-gradient(to right, #2e7d32, #4caf50);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      `}</style>

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#4caf50] flex items-center justify-center text-white font-bold text-lg shadow-sm">
            S
          </div>
          <span className="font-bold text-gray-900 text-xl tracking-tight">StudyPlan</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-semibold text-gray-600 hover:text-[#4caf50] transition-colors"
          >
            Đăng nhập
          </Link>
          <Link
            href="/register"
            className="text-sm font-semibold bg-[#4caf50] text-white px-5 py-2.5 rounded-lg hover:bg-[#43a047] transition-all shadow-md shadow-green-200"
          >
            Bắt đầu ngay
          </Link>
        </div>
      </header>

      {/* Body */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Hero Section */}
        <section className="flex flex-col items-center justify-center px-4 text-center py-20 sm:py-28">
          <div className="inline-flex items-center gap-2 bg-[#e8f5e9] text-[#2e7d32] text-xs font-bold px-3 py-1.5 rounded-full mb-8 border border-[#c8e6c9]">
            <span className="w-2 h-2 rounded-full bg-[#4caf50] animate-pulse" />
            AI-Powered Study Planning
          </div>

          <h1 className="text-5xl sm:text-7xl font-extrabold text-gray-900 leading-tight max-w-4xl mb-6 tracking-tight">
            Lên kế hoạch thông minh,<br/>
            <span className="green-gradient-text">học tập hiệu quả hơn</span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-500 max-w-2xl mb-10 leading-relaxed">
            Đặt ra mục tiêu, để AI tự động chia nhỏ thành các nhiệm vụ và sắp xếp lịch học hoàn hảo cho bạn bằng phương pháp Pomodoro.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto px-4">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-4 bg-[#4caf50] text-white font-bold rounded-xl shadow-lg shadow-green-200 hover:shadow-xl hover:shadow-green-300 hover:-translate-y-0.5 transition-all text-base"
            >
              Trải nghiệm miễn phí
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 bg-white border-2 border-gray-200 text-gray-700 font-bold rounded-xl hover:border-[#4caf50] hover:text-[#4caf50] transition-all text-base"
            >
              Đăng nhập tài khoản
            </Link>
          </div>
        </section>

        {/* Carousel Section (Ảnh động trượt qua lại) */}
        <section className="py-12 bg-gray-50 border-y border-gray-100 relative overflow-hidden flex flex-col items-center">
          {/* Gradients tạo hiệu ứng mờ 2 bên */}
          <div className="absolute inset-y-0 left-0 w-16 sm:w-32 bg-gradient-to-r from-gray-50 to-transparent z-10 pointer-events-none"></div>
          <div className="absolute inset-y-0 right-0 w-16 sm:w-32 bg-gradient-to-l from-gray-50 to-transparent z-10 pointer-events-none"></div>
          
          <div className="w-full overflow-hidden">
            <div className="carousel-track gap-6 px-6">
              {carouselItems.map((f, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-72 sm:w-80 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-[#a5d6a7] transition-all cursor-default"
                >
                  <div className="w-12 h-12 bg-[#e8f5e9] rounded-xl flex items-center justify-center text-2xl mb-4">
                    {f.icon}
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg mb-2">{f.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white py-12">
        <div className="max-w-6xl mx-auto px-6 flex flex-col items-center gap-6">
          <div className="w-10 h-10 rounded-xl bg-[#4caf50] flex items-center justify-center text-white font-bold text-xl opacity-90 shadow-sm">
            S
          </div>
          <p className="text-sm text-gray-400 text-center font-medium">
            © {new Date().getFullYear()} StudyPlan.<br/>Nền tảng hỗ trợ học tập tích hợp AI thông minh.
          </p>
          <div className="flex gap-6 mt-2">
            <Link href="#" className="text-sm text-gray-400 hover:text-[#4caf50] transition-colors">Điều khoản</Link>
            <Link href="#" className="text-sm text-gray-400 hover:text-[#4caf50] transition-colors">Bảo mật</Link>
            <Link href="#" className="text-sm text-gray-400 hover:text-[#4caf50] transition-colors">Liên hệ</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}