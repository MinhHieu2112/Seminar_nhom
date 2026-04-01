'use client';

import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  Code2, 
  BookOpen, 
  Trophy, 
  Users, 
  Zap, 
  Sparkles,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

export default function LandingPage() {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: <Code2 className="w-6 h-6" />,
      title: 'Interactive Coding',
      description: 'Practice with hands-on exercises in our built-in code editor with real-time feedback.'
    },
    {
      icon: <BookOpen className="w-6 h-6" />,
      title: 'Structured Courses',
      description: 'Learn with carefully designed curricula from beginner to advanced levels.'
    },
    {
      icon: <Trophy className="w-6 h-6" />,
      title: 'Gamified Learning',
      description: 'Earn points, unlock achievements, and track your progress with streaks.'
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Community Forum',
      description: 'Connect with fellow learners, ask questions, and share your knowledge.'
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'AI-Powered',
      description: 'Get personalized hints and explanations powered by AI when you are stuck.'
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: 'Mini Projects',
      description: 'Apply your skills with real-world projects and build your portfolio.'
    }
  ];

  const benefits = [
    '100+ coding exercises and challenges',
    'Interactive lessons with instant feedback',
    'Track your progress with detailed analytics',
    'Community support and peer learning',
    'Free to start, premium features available'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center">
                <span className="text-xl font-bold text-white">C</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Codex
              </span>
            </div>
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <Link href="/dashboard">
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                    Go to Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/auth/sign-in">
                    <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/auth/sign-up">
                    <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 text-purple-700 text-sm font-medium mb-8">
              <Sparkles className="w-4 h-4" />
              <span>AI-Powered Learning Platform</span>
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight mb-6">
              Master Programming with{' '}
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Codex
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Interactive courses, hands-on exercises, and AI-powered feedback. 
              Start your coding journey today and join thousands of learners worldwide.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {isAuthenticated ? (
                <Link href="/dashboard">
                  <Button size="lg" className="h-14 px-8 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl shadow-lg shadow-purple-200 hover:shadow-xl hover:shadow-purple-300 transition-all">
                    Continue Learning
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/auth/sign-up">
                    <Button size="lg" className="h-14 px-8 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl shadow-lg shadow-purple-200 hover:shadow-xl hover:shadow-purple-300 transition-all">
                      Start Learning Free
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </Link>
                  <Link href="/courses">
                    <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl">
                      Explore Courses
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y border-gray-100 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-gray-900">10K+</div>
              <div className="text-gray-500 mt-1">Active Learners</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-gray-900">100+</div>
              <div className="text-gray-500 mt-1">Coding Exercises</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-gray-900">50+</div>
              <div className="text-gray-500 mt-1">Video Lessons</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-gray-900">95%</div>
              <div className="text-gray-500 mt-1">Success Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Learn to Code
              </span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our platform provides all the tools and resources you need to become a proficient programmer.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group p-8 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg hover:border-purple-200 transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center text-purple-600 mb-6 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-500 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Why Choose{' '}
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Codex?
                </span>
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                We believe everyone can learn to code. Our platform is designed to make programming 
                accessible, engaging, and effective for learners at all levels.
              </p>
              <ul className="space-y-4">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-200 to-purple-200 rounded-3xl blur-3xl opacity-30" />
              <div className="relative bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                      JD
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">John Doe</div>
                      <div className="text-sm text-gray-500">Completed Python Basics</div>
                    </div>
                    <div className="ml-auto text-green-500 font-semibold">+150 XP</div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center text-white font-bold">
                      JS
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Jane Smith</div>
                      <div className="text-sm text-gray-500">5 day streak!</div>
                    </div>
                    <div className="ml-auto text-orange-500 font-semibold">🔥 5</div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center text-white font-bold">
                      MK
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Mike King</div>
                      <div className="text-sm text-gray-500">Solved Hard Exercise</div>
                    </div>
                    <div className="ml-auto text-purple-500 font-semibold">+50 XP</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white text-center p-12 sm:p-16">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.1%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-20" />
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 relative z-10">
              Ready to Start Your Coding Journey?
            </h2>
            <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto relative z-10">
              Join thousands of learners who are already mastering programming with Codex. 
              It&apos;s free to get started!
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
              {isAuthenticated ? (
                <Link href="/dashboard">
                  <Button size="lg" className="h-14 px-8 text-lg bg-white text-purple-600 hover:bg-gray-100 rounded-xl shadow-lg">
                    Continue Learning
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/auth/sign-up">
                    <Button size="lg" className="h-14 px-8 text-lg bg-white text-purple-600 hover:bg-gray-100 rounded-xl shadow-lg">
                      Get Started Free
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </Link>
                  <Link href="/auth/sign-in">
                    <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-2 border-white text-white hover:bg-white/10 rounded-xl">
                      I Already Have an Account
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center">
                <span className="text-sm font-bold text-white">C</span>
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Codex
              </span>
            </div>
            <p className="text-gray-500 text-sm">
              © 2025 Codex. All rights reserved. Master programming with AI-powered learning.
            </p>
            <div className="flex items-center gap-6">
              <Link href="/terms" className="text-gray-500 hover:text-gray-700 text-sm">Terms</Link>
              <Link href="/privacy" className="text-gray-500 hover:text-gray-700 text-sm">Privacy</Link>
              <Link href="/contact" className="text-gray-500 hover:text-gray-700 text-sm">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

