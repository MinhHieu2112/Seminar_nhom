'use client';

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Minimal top nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
            S
          </div>
          <span className="font-semibold text-gray-900 text-lg">StudyPlan</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-4 py-2"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="text-sm font-medium bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center py-20">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-8 border border-blue-100">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          AI-powered study planning
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 leading-tight max-w-3xl mb-6">
          Plan smarter,{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
            study better
          </span>
        </h1>

        <p className="text-lg text-gray-500 max-w-xl mb-10 leading-relaxed">
          Set your goals, let AI break them into tasks, and automatically schedule your study sessions using the Pomodoro technique.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Link
            href="/register"
            className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300 transition-all text-sm"
          >
            Start for free →
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-3.5 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors text-sm"
          >
            Sign in
          </Link>
        </div>

        {/* Feature cards */}
        <div className="mt-20 grid sm:grid-cols-3 gap-5 max-w-3xl w-full text-left">
          {[
            {
              icon: '🎯',
              title: 'Set Goals',
              desc: 'Define learning goals with deadlines and let AI plan the details.',
            },
            {
              icon: '🤖',
              title: 'AI Task Breakdown',
              desc: 'Goals are automatically decomposed into manageable study tasks.',
            },
            {
              icon: '📅',
              title: 'Smart Scheduling',
              desc: 'Tasks are scheduled into your free slots using Pomodoro blocks.',
            },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-gray-50 border border-gray-100 rounded-2xl p-5 hover:border-blue-200 hover:bg-blue-50/30 transition-colors"
            >
              <span className="text-2xl">{f.icon}</span>
              <h3 className="mt-3 font-semibold text-gray-900 text-sm">{f.title}</h3>
              <p className="mt-1.5 text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="text-center py-6 text-xs text-gray-400 border-t border-gray-100">
        © 2026 StudyPlan · AI-powered study planning assistant
      </footer>
    </div>
  );
}