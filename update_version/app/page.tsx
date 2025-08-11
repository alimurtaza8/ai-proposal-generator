'use client'

import Link from 'next/link'
import Image from 'next/image'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-dark-green">
      {/* Navigation */}
      <nav className="flex justify-between items-center p-6 lg:px-20">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-white">AI Proposal Generator</h1>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-gray-300 hover:text-accent-tan transition-colors font-semibold">
              Features
            </Link>
            <Link href="#about" className="text-gray-300 hover:text-accent-tan transition-colors font-semibold">
              About
            </Link>
            <Link href="#contact" className="text-gray-300 hover:text-accent-tan transition-colors font-semibold">
              Contact
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            <Link 
              href="/auth/signin"
              className="bg-accent-tan hover:bg-accent-tan-hover text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:-translate-y-1"
            >
              Sign In
            </Link>
            <Link 
              href="/auth/signup"
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:-translate-y-1"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="text-center py-20 px-6">
        <div className="max-w-4xl mx-auto slide-in-up">
          <h1 className="text-5xl lg:text-6xl font-black mb-6 text-white">
            AI Proposal Generator
          </h1>
          <p className="text-xl lg:text-2xl text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed">
            Generate intelligent proposals with AI assistance. Transform your RFP documents into professional, winning proposals in minutes.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link 
              href="/auth/signup"
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 hover:-translate-y-1 shadow-lg"
            >
              <i className="fas fa-rocket mr-2"></i>
              Get Started Free
            </Link>
            <Link 
              href="/auth/signin"
              className="bg-accent-tan hover:bg-accent-tan-hover text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 hover:-translate-y-1 shadow-lg"
            >
              <i className="fas fa-sign-in-alt mr-2"></i>
              Sign In
            </Link>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="bg-charcoal py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16 text-white">
            Powerful Features
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-dark-green rounded-xl hover:bg-opacity-80 transition-all duration-300">
              <div className="text-4xl text-accent-tan mb-4">
                <i className="fas fa-magic"></i>
              </div>
              <h3 className="text-xl font-bold mb-4 text-white">AI-Powered Generation</h3>
              <p className="text-gray-300">
                Advanced AI analyzes your RFP documents and generates comprehensive, tailored proposals automatically.
              </p>
            </div>
            
            <div className="text-center p-8 bg-dark-green rounded-xl hover:bg-opacity-80 transition-all duration-300">
              <div className="text-4xl text-green-500 mb-4">
                <i className="fas fa-file-word"></i>
              </div>
              <h3 className="text-xl font-bold mb-4 text-white">Professional Documents</h3>
              <p className="text-gray-300">
                Generate professional Word and PDF documents with custom logos and branding.
              </p>
            </div>
            
            <div className="text-center p-8 bg-dark-green rounded-xl hover:bg-opacity-80 transition-all duration-300">
              <div className="text-4xl text-blue-500 mb-4">
                <i className="fas fa-clock"></i>
              </div>
              <h3 className="text-xl font-bold mb-4 text-white">Fast & Efficient</h3>
              <p className="text-gray-300">
                Save hours of work. Generate complete proposals in minutes, not days.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-12 px-6 text-gray-400">
        <p className="mb-4">
          &copy; 2025 AI Proposal Generator. Powered by Maaz Mansoor
        </p>
        <div className="flex justify-center gap-6">
          <a 
            href="https://www.linkedin.com/in/maazomansoor/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-accent-tan transition-colors"
          >
            LinkedIn
          </a>
          <a 
            href="mailto:Maazmansoorb301@gmail.com"
            className="hover:text-accent-tan transition-colors"
          >
            Email
          </a>
        </div>
      </footer>
    </div>
  )
}