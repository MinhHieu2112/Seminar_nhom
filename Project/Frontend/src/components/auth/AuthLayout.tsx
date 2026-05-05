import React from 'react';
import Link from 'next/link';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="auth-page">
      {/* Decorative Shapes */}
      <div className="auth-shape auth-shape--asterisk" aria-hidden="true">
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M100 10 L100 190 M10 100 L190 100 M25.1 25.1 L174.9 174.9 M174.9 25.1 L25.1 174.9"
            stroke="#8BC34A"
            strokeWidth="38"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div className="auth-shape auth-shape--blob" aria-hidden="true">
        <svg viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M150 30 C190 20, 250 60, 260 100 C270 140, 240 190, 200 220 C160 250, 100 260, 70 230 C40 200, 30 150, 50 110 C70 70, 110 40, 150 30Z"
            fill="#F8A8C8"
            opacity="0.85"
          />
        </svg>
      </div>

      {/* Main Content */}
      <div className="auth-container">
        {/* Logo */}
        <div className="auth-logo">
          <svg width="52" height="52" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="52" height="52" rx="12" fill="#00AA45" />
            <text x="26" y="36" textAnchor="middle" fontSize="28" fontWeight="bold" fill="white" fontFamily="Arial">S</text>
          </svg>
        </div>

        {children}

        {/* Footer */}
        <div className="auth-footer">
          <span>© 2026 StudyPlan. All rights reserved.</span>
          <div className="auth-footer-links">
            <Link href="#">Bảo mật</Link>
            <Link href="#">Điều khoản</Link>
            <Link href="#">Quyền riêng tư</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
