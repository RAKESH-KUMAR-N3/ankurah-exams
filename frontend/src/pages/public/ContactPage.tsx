import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Send, CheckCircle2, Image as ImageIcon } from 'lucide-react';
import { motion } from 'motion/react';
import logo from '../../assets/logo.png';

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
    <div className="min-h-screen font-sans selection:bg-emerald-500/30 bg-slate-50 flex flex-col justify-between">
      <style>{`
        @keyframes scan-down {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        @keyframes float-up {
          0% { transform: translateY(0); }
          100% { transform: translateY(-120vh); }
        }
      `}</style>
      {/* Navigation Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out ${scrolled
            ? 'bg-white shadow-md py-1.5 border-b border-slate-100/50'
            : 'bg-transparent py-5'
          }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between relative z-10">
          <Link to="/" className="flex items-center gap-3 cursor-pointer">
            <img
              src={logo}
              alt="Ankurah Exams Logo"
              className={`object-contain transition-all duration-300 ${scrolled ? 'w-32 md:w-36' : 'w-40 md:w-48'}`}
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
          </Link>

          <nav className={`hidden lg:flex items-center gap-8 text-sm font-semibold transition-colors duration-300 ${scrolled ? 'text-slate-650 hover:text-emerald-600' : 'text-white hover:text-emerald-300'}`}>
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.path}
                className={`hover:text-emerald-400 transition-colors duration-200 cursor-pointer font-semibold text-sm ${scrolled ? 'text-slate-600 hover:text-emerald-600' : 'text-white/90 hover:text-white'}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className={`text-[15px] font-bold transition-all px-4 py-2.5 rounded-full ${scrolled
                  ? 'text-slate-700 hover:bg-slate-100'
                  : 'text-white hover:bg-white/20'
                }`}
            >
              Login
            </Link>
            <Link
              to="/register"
              className={`text-[15px] font-bold py-2.5 px-7 rounded-full shadow-sm hover:shadow-md transition-all ${scrolled
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-white text-emerald-900 hover:bg-emerald-50'
                }`}
            >
              Register
            </Link>
            {/* Mobile menu button */}
            <button
              className={`lg:hidden p-2 rounded-lg transition-colors ${scrolled ? 'text-slate-700 hover:bg-slate-100' : 'text-white hover:bg-white/10'}`}
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
          <div className={`lg:hidden border-t ${scrolled ? 'bg-white border-slate-100' : 'bg-emerald-950/95 backdrop-blur-md border-white/10'}`}>
            <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-left py-3 px-4 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${scrolled ? 'text-slate-700 hover:bg-slate-50 hover:text-emerald-600' : 'text-white/90 hover:bg-white/10'}`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-2 pt-3 border-t border-slate-100/20 flex gap-3">
                <Link to="/login" className="flex-1 text-center py-2.5 px-4 rounded-full text-sm font-bold text-white bg-white/20 hover:bg-white/30 transition-colors">Login</Link>
                <Link to="/register" className="flex-1 text-center py-2.5 px-4 rounded-full text-sm font-bold bg-white text-emerald-900 hover:bg-emerald-50 transition-colors">Register</Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-grow">
        {/* Hero Banner */}
        <section className="relative flex flex-col items-center pt-32 md:pt-36 pb-12 overflow-hidden bg-gradient-to-br from-emerald-700 via-emerald-800 to-emerald-950 text-white text-center">
          <BackgroundAnimations />

          <div className="relative z-10 w-full max-w-7xl mx-auto px-6 flex flex-col items-center text-center space-y-4">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-2 text-white flex flex-wrap justify-center items-center gap-3">
              {"Contact & Support".split(" ").map((word, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, scale: 0.5, filter: "blur(8px)" }}
                  animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                  transition={{
                    duration: 0.6,
                    delay: index * 0.12,
                    ease: "easeOut"
                  }}
                  className="inline-block hover:text-emerald-300 transition-colors duration-300 cursor-default"
                >
                  {word}
                </motion.span>
              ))}
            </h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="text-emerald-100 text-base md:text-lg max-w-2xl mx-auto leading-relaxed font-medium"
            >
              Have questions about student registration, timetables, or syllabus tracks? Get in touch with our academic coordinators.
            </motion.p>
          </div>
        </section>

        {/* Contact Form and Details */}
        <section className="py-16 md:py-20 max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            
            {/* Details & Campus Info Card */}
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between space-y-8">
              <div className="space-y-6">
                <div className="inline-block p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                  <MapPin className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-extrabold text-slate-900">Academic Headquarters</h3>
                <p className="text-slate-600 text-sm leading-relaxed font-medium">
                  Have questions regarding online entrance test syllabus, registration fees, or timetable tracking? Reach out to our campus office.
                </p>
                <div className="space-y-4 pt-2 border-t border-slate-100">
                  <div className="flex items-start gap-3 text-slate-700">
                    <MapPin className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-sm font-semibold">Ankurah Educational Society, Central Campus, Hyderabad, TS, India</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-700">
                    <Phone className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span className="text-sm font-semibold">+91 98765 43210</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-700">
                    <Mail className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span className="text-sm font-semibold">support@ankurah.com</span>
                  </div>
                </div>
              </div>

              {/* Office Image */}
              <div className="relative group overflow-hidden rounded-xl border border-dashed border-slate-200 bg-slate-50 aspect-video flex flex-col items-center justify-center text-slate-400 p-4">
                <ImageIcon className="w-8 h-8 mb-2 text-slate-400" />
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">[ Campus Office Image ]</p>
              </div>
            </div>

            {/* Form */}
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between space-y-6">
              <div>
                <h3 className="text-2xl font-extrabold text-slate-900 mb-1">Send an Enquiry</h3>
                <p className="text-xs text-slate-500 font-medium">Fill out the form below and our coordinators will contact you.</p>
              </div>

              {submitted && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>Thank you! Your message has been received. Our team will get back to you shortly.</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 text-sm flex-grow flex flex-col justify-between">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Rakesh Kumar"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-emerald-600 focus:bg-white transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. rakesh@example.com"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-emerald-600 focus:bg-white transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Message / Query</label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="How can we help you?"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-emerald-600 focus:bg-white transition-colors h-28 resize-none"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg text-sm mt-2 cursor-pointer"
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
