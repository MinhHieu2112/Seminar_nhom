'use client';

import React from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';

// Dynamic import Lottie to prevent SSR hydration mismatches
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

// Helper load local JSON animation safely
import heroAnimationData from '../../public/lottie-hero.json';

export default function HomePage() {
  // Navigation Links
  const navLinks = [
    { name: 'Blog', href: '#blog' },
    { name: 'Giới thiệu', href: '#about' },
    { name: 'Cộng đồng', href: '#community' },
  ];

  return (
    <div className="min-h-screen bg-[#faf9ff] flex flex-col font-nunito selection:bg-violet-100/80 text-gray-800 antialiased overflow-x-hidden">
      {/* Top Minimalism Navbar */}
      <header className="w-full max-w-8xl mx-auto px-6 md:px-12 py-6 flex items-center justify-between sticky top-0 bg-[#faf9ff]/85 backdrop-blur-md z-50">
        <div className="flex items-center gap-10">
          {/* Logo / Brand */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-violet-400 via-indigo-300 to-pink-300 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-violet-100 group-hover:scale-105 transition-transform duration-300">
              S
            </div>
            <span className="font-poppins font-semibold text-lg text-gray-800 tracking-tight group-hover:text-violet-500 transition-colors">
              StudyPlan
            </span>
          </Link>

          {/* Nav Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="font-nunito font-semibold text-[15px] text-gray-400 hover:text-gray-700 transition-all duration-300 relative group py-1"
              >
                {link.name}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-violet-400 group-hover:w-full transition-all duration-300" />
              </Link>
            ))}
          </nav>
        </div>

        {/* Action Controls & Account buttons */}
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="font-nunito font-semibold text-[15px] text-gray-400 hover:text-violet-500 transition-colors px-4 py-2"
          >
            Đăng nhập
          </Link>
          <Link
            href="/register"
            className="font-nunito font-semibold text-[14px] bg-linear-to-r from-violet-500 to-indigo-400 hover:from-violet-600 hover:to-indigo-500 text-white px-6 py-2.5 rounded-full transition-all shadow-md shadow-violet-100 hover:shadow-lg hover:shadow-violet-200 hover:-translate-y-0.5"
          >
            Bắt đầu ngay
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col justify-center max-w-8xl mx-auto w-full px-6 md:px-12 py-6 md:py-10">
        
        {/* HERO SECTION - SPLIT-SCREEN LAYOUT */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* LEFT COLUMN: Premium Copywriting, Call to Action */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="lg:col-span-6 flex flex-col items-start text-left space-y-6"
          >

            {/* Premium Thin Elegant Heading */}
            <h1 className="font-poppins font-light text-5xl md:text-6xl xl:text-7xl text-gray-800 leading-[1.15] tracking-tight">
              Lập kế hoạch<br />
              <span className="font-light bg-linear-to-r from-violet-400 via-fuchsia-300 to-indigo-400 bg-clip-text text-transparent whitespace-nowrap">
                Kiến tạo tương lai
              </span>
            </h1>

            {/* Clean soft descriptive text */}
            <p className="font-nunito font-light text-lg md:text-xl text-gray-400 max-w-xl leading-relaxed">
              Lập kế hoạch, theo dõi tiến độ và cộng tác hiệu quả trong một nền tảng duy nhất giúp bạn đạt hiệu suất đỉnh cao.
            </p>

            {/* Premium Curved CTA Button with subtle hover micro-animations */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto pt-2">
              <Link
                href="/register"
                className="group relative inline-flex items-center justify-center font-poppins font-medium text-base bg-linear-to-r from-violet-500 to-indigo-400 hover:from-violet-600 hover:to-indigo-500 text-white px-8 py-4 rounded-full shadow-lg shadow-violet-100 hover:shadow-xl hover:shadow-violet-200 transition-all duration-300 hover:-translate-y-0.5 text-center overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Bắt đầu ngay
                  <svg
                    className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </span>
                <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </Link>

              <Link
                href="#features"
                className="font-poppins font-medium text-base text-gray-500 hover:text-violet-500 border border-gray-200 hover:border-violet-200 bg-white hover:bg-violet-50/30 px-8 py-4 rounded-full transition-all text-center"
              >
                Tìm hiểu thêm
              </Link>
            </div>
          </motion.div>

          {/* RIGHT COLUMN: Modern Vector / Lottie Illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
            className="lg:col-span-6 flex items-center justify-center relative w-full h-full min-h-64 md:min-h-96"
          >
            {/* Dynamic soft background gradient glow shapes behind animation */}
            <div className="absolute -top-10 -left-10 w-72 h-72 bg-violet-100/50 rounded-full blur-3xl -z-10 animate-pulse" />
            <div className="absolute -bottom-10 -right-10 w-72 h-72 bg-pink-100/40 rounded-full blur-3xl -z-10" />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-100/30 rounded-full blur-3xl -z-10" />

            {/* Lottie Animation Display */}
            <div className="w-full max-w-lg lg:max-w-xl xl:max-w-2xl px-4 select-none">
              <Lottie
                animationData={heroAnimationData}
                loop={true}
                autoplay={true}
                className="w-full h-auto drop-shadow-[0_20px_50px_rgba(167,139,250,0.08)]"
              />
            </div>

            {/* Floating UI Elements (Dribbble Glassmorphism Style) */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
              className="absolute top-12 left-4 md:-left-6 bg-white/80 backdrop-blur-md border border-white/60 shadow-lg shadow-violet-100/30 px-4 py-3 rounded-2xl hidden sm:flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center text-lg">🌸</div>
              <div>
                <p className="font-poppins font-semibold text-[13px] text-gray-700">Thiết kế sáng tạo</p>
                <p className="font-nunito text-[11px] text-gray-400">Pastel Color UI</p>
              </div>
            </motion.div>
          </motion.div>

        </section>

      </main>

      {/* Modern Wave Footer */}
      <footer className="w-full bg-[#f5f3ff] border-t border-violet-100/50 py-12 mt-auto">
        <div className="max-w-8xl mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-linear-to-tr from-violet-400 to-indigo-400 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-violet-100">
              S
            </div>
            <span className="font-poppins font-semibold text-sm text-gray-700 tracking-tight">
              StudyPlan
            </span>
          </div>

          <p className="font-nunito text-sm text-gray-400 text-center md:text-left">
            © {new Date().getFullYear()} StudyPlan. Bản quyền thuộc về đội ngũ sáng tạo.
          </p>

          <div className="flex items-center gap-6">
            <Link href="#" className="font-nunito text-sm text-gray-400 hover:text-violet-500 transition-colors">Điều khoản</Link>
            <Link href="#" className="font-nunito text-sm text-gray-400 hover:text-violet-500 transition-colors">Bảo mật</Link>
            <Link href="#" className="font-nunito text-sm text-gray-400 hover:text-violet-500 transition-colors">Liên hệ</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}