import React from 'react';
import { motion } from 'motion/react';
import { BookOpen, Award, TrendingUp, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.png'; // Make sure this path matches the user's logo location

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-emerald-500/30">
      {/* Navigation Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="Ankurah Exams Logo" className="w-24 h-24 object-contain" onError={(e) => { e.currentTarget.style.display = 'none' }} />
          </Link>
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <Link to="/about" className="hover:text-emerald-600 transition-colors">About</Link>
            <Link to="/exams" className="hover:text-emerald-600 transition-colors">Exams</Link>
            <Link to="/features" className="hover:text-emerald-600 transition-colors">Features</Link>
            <Link to="/contact" className="hover:text-emerald-600 transition-colors">Contact</Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link 
              to="/login"
              className="text-sm font-bold text-slate-700 hover:text-emerald-600 transition-colors px-2 cursor-pointer"
            >
              Log In
            </Link>
            <Link 
              to="/register"
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold py-2.5 px-6 rounded-full shadow-sm hover:shadow-md transition-all cursor-pointer"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mt-10 md:mt-20">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Elevate Your Preparation
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-6xl font-extrabold text-slate-900 leading-tight tracking-tight mb-6"
          >
            Master Your Exams with <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">Confidence.</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-slate-600 mb-10 leading-relaxed max-w-2xl"
          >
            Ankurah Exams is your ultimate companion for JEE, NEET, and UPSC preparation. Get access to tailored study plans, comprehensive question banks, and deep analytics.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
          >
            <Link 
              to="/register"
              className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 px-8 rounded-full shadow-lg hover:shadow-xl transition-all cursor-pointer"
            >
              Start Learning Now <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>

        {/* Feature Highlights */}
        <div id="features" className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-32">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-6">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Structured Materials</h3>
            <p className="text-slate-600 leading-relaxed">Access chapter-wise notes, PDFs, and video lectures carefully curated by top educators.</p>
          </div>
          
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Mock Tests & Practice</h3>
            <p className="text-slate-600 leading-relaxed">Simulate real exam environments with timed mock tests, negative marking, and detailed solutions.</p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-6">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Deep Analytics</h3>
            <p className="text-slate-600 leading-relaxed">Identify your weak spots with advanced analytics, accuracy metrics, and time-taken reports.</p>
          </div>
        </div>

        {/* About / Supported Exams */}
        <div id="exams" className="mt-32 mb-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Exams We Cover</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">We provide comprehensive preparation modules for top entrance and competitive exams.</p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
            {['JEE Main', 'JEE Advanced', 'NEET UG', 'AP EAPCET', 'TG EAPCET', 'UPSC Civils', 'SSC CGL'].map(exam => (
              <div key={exam} className="flex items-center gap-2 bg-white border border-slate-200 px-6 py-3 rounded-full shadow-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span className="font-bold text-slate-700">{exam}</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer id="contact" className="bg-slate-950 text-slate-300 py-16 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <img src={logo} alt="Ankurah Exams Logo" className="w-24 h-24 object-contain brightness-0 invert opacity-90" onError={(e) => { e.currentTarget.style.display = 'none' }} />
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Empowering students to achieve their dreams with comprehensive preparation and analytics.
            </p>
          </div>
          
          <div className="flex flex-col gap-3">
            <h4 className="text-white font-bold mb-2">Platform</h4>
            <a href="#features" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">Features</a>
            <a href="#exams" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">Exams Supported</a>
            <a href="#pricing" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">Pricing</a>
          </div>

          <div className="flex flex-col gap-3">
            <h4 className="text-white font-bold mb-2">Legal</h4>
            <a href="#" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">Privacy Policy</a>
            <a href="#" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">Terms of Service</a>
            <a href="#" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">Cookie Policy</a>
          </div>

          <div className="flex flex-col gap-3">
            <h4 className="text-white font-bold mb-2">Contact</h4>
            <span className="text-sm text-slate-400">support@ankurah.com</span>
            <span className="text-sm text-slate-400">+91 98765 43210</span>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-slate-800 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} Ankurah Exams. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
