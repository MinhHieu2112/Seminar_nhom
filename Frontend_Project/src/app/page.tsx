import Link from 'next/link'
import { Search } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary to-primary-dark text-white py-16 md:py-24">
        <div className="container-max">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Master Programming with Codex
            </h1>
            <p className="text-lg md:text-xl mb-8 opacity-90">
              Learn from industry experts with interactive, hands-on coding courses
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/courses" className="btn-primary bg-white text-primary">
                Explore Courses
              </Link>
              <button className="btn-primary border border-white bg-transparent hover:bg-white hover:bg-opacity-10">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Access */}
      <section className="py-16">
        <div className="container-max">
          <h2 className="text-3xl font-bold mb-12 text-center">How it Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: '🎓',
                title: 'Choose a Course',
                description: 'Browse our curated collection of programming courses for all levels',
              },
              {
                icon: '📚',
                title: 'Learn at Your Pace',
                description: 'Watch video lessons, read documentation, and complete exercises',
              },
              {
                icon: '✅',
                title: 'Track Progress',
                description: 'Monitor your learning journey and earn certificates',
              },
            ].map((item, idx) => (
              <div key={idx} className="card p-6 text-center">
                <div className="text-5xl mb-4">{item.icon}</div>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-text-secondary">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Courses Preview */}
      <section className="py-16 bg-gray-50">
        <div className="container-max">
          <h2 className="text-3xl font-bold mb-4">Featured Courses</h2>
          <p className="text-text-secondary mb-12">
            Start learning today with our most popular courses
          </p>
          <div className="text-center">
            <Link href="/courses" className="btn-primary">
              View All Courses
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
