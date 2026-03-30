'use client'

import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="bg-white border-b border-border sticky top-0 z-50">
      <div className="container-max">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
            Codex
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-text-primary hover:text-primary transition-colors">
              Home
            </Link>
            <Link href="/courses" className="text-text-primary hover:text-primary transition-colors">
              Courses
            </Link>
            <a href="#about" className="text-text-primary hover:text-primary transition-colors">
              About
            </a>
            <button className="btn-primary">Sign In</button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pb-4 space-y-2 border-t border-border">
            <Link href="/" className="block px-4 py-2 hover:bg-gray-100 rounded">
              Home
            </Link>
            <Link href="/courses" className="block px-4 py-2 hover:bg-gray-100 rounded">
              Courses
            </Link>
            <a href="#about" className="block px-4 py-2 hover:bg-gray-100 rounded">
              About
            </a>
            <button className="btn-primary w-full mt-2">Sign In</button>
          </div>
        )}
      </div>
    </nav>
  )
}
