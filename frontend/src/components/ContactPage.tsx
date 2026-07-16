import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Send, CheckCircle2, Image as ImageIcon } from 'lucide-react';
import { motion } from 'motion/react';
import logo from '../assets/logo.png';

const BackgroundAnimations = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-400/20 rounded-full blur-[100px]"></div>
      <div className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] bg-teal-500/20 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] left-[20%] w-[400px] h-[400px] bg-green-400/10 rounded-full blur-[100px]"></div>
      <div className="absolute top-[-10%] left-[-5%] w-[45vw] h-[45vw] max-w-[600px] max-h-[600px] bg-teal-100/50 rounded-br-full blur-3xl mix-blend-overlay"></div>
      <div className="absolute top-[-5%] left-[-5%] w-[35vw] h-[35vw] max-w-[450px] max-h-[450px] bg-white/40 rounded-br-full blur-2xl"></div>
      <div className="absolute top-0 left-0 w-[25vw] h-[25vw] max-w-[300px] max-h-[300px] bg-yellow-100/30 rounded-br-full blur-xl"></div>
      <div className="absolute inset-0 flex justify-between px-8 md:px-24 lg:px-48 opacity-20">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-full w-[1px] bg-white relative overflow-hidden">
            <div
              className="absolute top-0 left-0 w-full h-48 bg-gradient-to-b from-transparent via-white to-transparent opacity-60"
              style={{
                animation: `scan-down ${5 + i * 1.5}s linear infinite`,
                animationDelay: `${i * 1}s`
              }}
            ></div>
          </div>
        ))}
      </div>
      {[...Array(14)].map((_, i) => {
        const size = Math.random() * 120 + 40;
        const leftPos = (i * (100 / 14)) + (Math.random() * 4 - 2);
        return (
          <div
            key={`circle-${i}`}
            className="absolute rounded-full bg-white"
            style={{
              width: size,
              height: size,
              left: `${leftPos}%`,
              bottom: '-20%',
              opacity: Math.random() * 0.1 + 0.04,
              animation: `float-up ${15 + Math.random() * 10}s linear infinite`,
              animationDelay: `${Math.random() * -15}s`
            }}
          />
        );
      })}
      {[...Array(30)].map((_, i) => (
        <div
          key={`star-${i}`}
          className="absolute rounded-full bg-white"
          style={{
            width: Math.random() * 3 + 1,
            height: Math.random() * 3 + 1,
            left: `${Math.random() * 100}%`,
            bottom: '-5%',
            animation: `float-up ${20 + Math.random() * 15}s linear infinite`,
            animationDelay: `${Math.random() * -20}s`,
            opacity: Math.random() * 0.4 + 0.1
          }}
        />
      ))}
    </div>
  );
};

export default function ContactPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'About', path: '/about' },
    { label: 'Entrance Tests', path: '/entrance-exams' },
    { label: 'Competitive Exams', path: '/competitive-exams' },
    { label: 'Contact', path: '/contact' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setName('');
    setEmail('');
    setMessage('');
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fc] font-sans flex flex-col justify-between">
      <style>{`
        @keyframes scan-down {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
      `}</style>
      {/* Navigation Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out ${
          scrolled ? 'bg-white shadow-md py-2' : 'bg-white/95 backdrop-blur-md border-b border-slate-105 py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 cursor-pointer">
            <img src={logo} alt="Ankurah Exams Logo" className="w-36 md:w-40 object-contain" />
          </Link>

          <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-slate-650">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.path}
                className="hover:text-emerald-600 transition-colors duration-200 cursor-pointer font-bold text-[15px]"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link to="/login" className="text-slate-700 hover:bg-slate-100 text-[15px] font-extrabold transition-all px-4 py-2.5 rounded-full">
              Login
            </Link>
            <Link to="/register" className="bg-emerald-600 hover:bg-emerald-700 text-white text-[15px] font-extrabold py-2.5 px-7 rounded-full shadow-sm hover:shadow-md transition-all">
              Register
            </Link>
            {/* Mobile menu button */}
            <button
              className="lg:hidden p-2 rounded-lg transition-colors text-slate-700 hover:bg-slate-100"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Nav Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t bg-white border-slate-100">
            <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-left py-3 px-4 rounded-lg text-[15px] font-semibold transition-colors cursor-pointer text-slate-700 hover:bg-slate-55 hover:text-emerald-600"
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-2 pt-3 border-t border-slate-100/20 flex gap-3">
                <Link to="/login" className="flex-1 text-center py-2.5 px-4 rounded-full text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors">Login</Link>
                <Link to="/register" className="flex-1 text-center py-2.5 px-4 rounded-full text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">Register</Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-grow pt-24">
        {/* Hero Banner */}
        <section className="bg-gradient-to-br from-emerald-800 to-emerald-950 text-white py-20 px-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-emerald-400/10 blur-[80px] rounded-full translate-y-10"></div>
          <div className="max-w-4xl mx-auto text-center relative z-10 space-y-4">
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-6xl font-black tracking-tight"
            >
              Contact & Support
            </motion.h1>
            <p className="text-emerald-100 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
              Have questions about student registration, timetables, or syllabus tracks? Get in touch with our academic coordinators.
            </p>
          </div>
        </section>

        {/* Contact Form and Details */}
        <section className="py-20 max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Details & Image Slot */}
            <div className="lg:col-span-1 space-y-8">
              <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-8">
                <h3 className="text-2xl font-black text-slate-900">Academic Office</h3>
                <div className="space-y-4">
                  <div className="flex gap-3 text-slate-650">
                    <MapPin className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-sm font-bold">Ankurah Educational Society, Central Campus, Hyderabad, India</span>
                  </div>
                  <div className="flex gap-3 text-slate-650">
                    <Phone className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-sm font-bold">+91 98765 43210</span>
                  </div>
                  <div className="flex gap-3 text-slate-650">
                    <Mail className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-sm font-bold">support@ankurah.com</span>
                  </div>
                </div>
              </div>

              {/* Image Placeholder */}
              <div className="relative group overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 aspect-video flex flex-col items-center justify-center text-slate-400 p-6">
                <ImageIcon className="w-12 h-12 mb-3 text-slate-350" />
                <p className="text-sm font-bold uppercase tracking-wider">[ Campus Office Image ]</p>
                <p className="text-xs mt-1 text-slate-400">Resolution: 600 x 400 pixels</p>
              </div>
            </div>

            {/* Form */}
            <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
              <h3 className="text-2xl font-black text-slate-900">Send an Enquiry</h3>
              {submitted && (
                <div className="p-4 bg-emerald-50 border border-emerald-250 rounded-md text-emerald-805 text-sm font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Thank you! Your message has been received. Our coordinator will contact you shortly.</span>
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-slate-900 font-semibold focus:outline-none focus:border-emerald-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-slate-900 font-semibold focus:outline-none focus:border-emerald-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Message / Details</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-slate-900 font-semibold focus:outline-none focus:border-emerald-600 h-32 resize-none"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-655 hover:bg-emerald-700 text-white rounded-md font-extrabold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm text-sm"
                >
                  <Send className="w-4 h-4" /> Send Message
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative bg-gradient-to-br from-emerald-700 via-emerald-800 to-emerald-950 text-emerald-50 py-16 overflow-hidden">
        <BackgroundAnimations />
        <div className="absolute inset-0 bg-slate-950/40 z-0"></div>

        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-10 relative z-10">
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <img src={logo} alt="Ankurah Exams Logo" className="w-40 md:w-48 object-contain drop-shadow-lg" onError={(e) => { e.currentTarget.style.display = 'none' }} />
            </div>
            <p className="text-sm text-emerald-100/80 leading-relaxed font-medium">
              Empowering students to achieve their dreams with comprehensive preparation and analytics.
            </p>
          </div>

          <div className="flex flex-col gap-3 md:pl-10">
            <h4 className="text-white font-bold mb-2">Platform</h4>
            <Link to="/about" className="text-sm text-emerald-100/70 hover:text-white transition-colors">About</Link>
            <Link to="/entrance-exams" className="text-sm text-emerald-100/70 hover:text-white transition-colors">Entrance Exams</Link>
            <Link to="/competitive-exams" className="text-sm text-emerald-100/70 hover:text-white transition-colors">Competitive Exams</Link>
          </div>

          <div className="flex flex-col gap-3">
            <h4 className="text-white font-bold mb-2">Legal</h4>
            <a href="#" className="text-sm text-emerald-100/70 hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="text-sm text-emerald-100/70 hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="text-sm text-emerald-100/70 hover:text-white transition-colors">Cookie Policy</a>
          </div>

          <div className="flex flex-col gap-3">
            <h4 className="text-white font-bold mb-2">Contact</h4>
            <span className="text-sm text-emerald-100/70">support@ankurah.com</span>
            <span className="text-sm text-emerald-100/70">+91 98765 43210</span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-emerald-500/20 text-center text-sm text-emerald-200/50 relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>© {new Date().getFullYear()} Ankurah Exams. All rights reserved.</span>
          <span>Designed by <a href="https://webnappstudio.in/index.html" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 font-bold underline transition-colors">Web N App studio</a></span>
        </div>
      </footer>
    </div>
  );
}
