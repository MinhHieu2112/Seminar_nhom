'use client';

import React, { useState } from 'react';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';

interface AuthSlidingFormProps {
  initialMode?: 'login' | 'register';
}

export function AuthSlidingForm({ initialMode = 'login' }: AuthSlidingFormProps) {
  const [isSignUp, setIsSignUp] = useState(initialMode === 'register');

  const handleToggle = () => {
    setIsSignUp(!isSignUp);
  };

  return (
    <div className="auth-sliding-wrapper">
      <div className={`as-container ${isSignUp ? 'right-panel-active' : ''}`} id="as-container">
        {/* Sign Up Form */}
        <div className="as-form-container as-sign-up-container">
            <div className="as-form-content">
                <RegisterForm isSliding={true} />
                <div className="as-mobile-toggle" onClick={handleToggle}>
                    Đã có tài khoản? <span>Đăng nhập</span>
                </div>
            </div>
        </div>

        {/* Sign In Form */}
        <div className="as-form-container as-sign-in-container">
            <div className="as-form-content">
                <LoginForm isSliding={true} />
                <div className="as-mobile-toggle" onClick={handleToggle}>
                    Chưa có tài khoản? <span>Đăng ký</span>
                </div>
            </div>
        </div>

        {/* Overlay */}
        <div className="as-overlay-container">
          <div className="as-overlay">
            <div className="as-overlay-panel as-overlay-left">
              <h1 className="as-overlay-title">Chào mừng trở lại!</h1>
              <p className="as-overlay-text">
                Để tiếp tục kết nối với chúng tôi, vui lòng đăng nhập bằng tài khoản của bạn
              </p>
              <button className="as-btn-ghost" id="signIn" onClick={handleToggle}>
                Đăng nhập
              </button>
            </div>
            <div className="as-overlay-panel as-overlay-right">
              <h1 className="as-overlay-title">Xin chào!</h1>
              <p className="as-overlay-text">
                Nhập thông tin cá nhân của bạn để bắt đầu hành trình cùng chúng tôi
              </p>
              <button className="as-btn-ghost" id="signUp" onClick={handleToggle}>
                Đăng ký
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
