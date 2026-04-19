'use client';

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8">
      <h1 className="text-4xl font-bold">StudyPlan</h1>
      <p className="text-gray-500">AI-powered study planning assistant</p>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="rounded-md bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 transition-colors"
        >
          Login
        </Link>
        <Link
          href="/register"
          className="rounded-md border border-gray-300 px-6 py-2 hover:bg-gray-50 transition-colors"
        >
          Register
        </Link>
      </div>
    </div>
  );
}
