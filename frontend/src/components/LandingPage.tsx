import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { BookOpen, Award, TrendingUp, CheckCircle2, ShieldCheck, Calculator, Cpu, Activity, Microscope, Atom, Globe, Briefcase, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';
import heroImage from '../assets/hero-image.png';
import cardsBg from '../assets/cards-bg.jpg';

const TYPE_PHRASES = [
  "Ace Your Next Exam.",
  "Secure Your Top Rank.",
  "Master Every Subject.",
  "Crack Entrance Tests.",
  "Unlock Your Potential."
];

// Helper Typewriter component that loops exactly 5 times and takes ~6 seconds total
const TypewriterEffect = () => {
  const [text, setText] = useState('');
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    if (isFinished) return;

    if (phraseIndex >= TYPE_PHRASES.length) {
      setIsFinished(true);
      return;
    }

    const currentPhrase = TYPE_PHRASES[phraseIndex];
    let timeout: NodeJS.Timeout;

    if (isDeleting) {
      if (text.length === 0) {
        setIsDeleting(false);
        setPhraseIndex((prev) => prev + 1);
        timeout = setTimeout(() => { }, 400);
      } else {
        timeout = setTimeout(() => {
          setText(currentPhrase.substring(0, text.length - 1));
        }, 30);
      }
    } else {
      if (text.length === currentPhrase.length) {
        timeout = setTimeout(() => {
          if (phraseIndex < TYPE_PHRASES.length - 1) {
            setIsDeleting(true);
          } else {
            setIsFinished(true);
          }
        }, 1200);
      } else {
        timeout = setTimeout(() => {
          setText(currentPhrase.substring(0, text.length + 1));
        }, 60);
      }
    }

    return () => clearTimeout(timeout);
  }, [text, isDeleting, phraseIndex, isFinished]);

  return (
    <span className="inline-flex items-center min-h-[1.2em]">
      {isFinished ? TYPE_PHRASES[TYPE_PHRASES.length - 1] : text}
      {!isFinished && (
        <span className="inline-block w-1 h-[0.9em] bg-emerald-300 ml-1 animate-pulse"></span>
      )}
    </span>
  );
};

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

const FEATURES = [
  {
    title: "Structured Materials",
    desc: "Access chapter-wise notes, PDFs, and video lectures carefully curated by top educators. No confusing options.",
    icon: <BookOpen className="w-10 h-10" />
  },
  {
    title: "Mock Tests & Practice",
    desc: "Simulate real exam environments with timed mock tests, negative marking, and detailed solutions.",
    icon: <Award className="w-10 h-10" />
  },
  {
    title: "Deep Analytics",
    desc: "Identify your weak spots with advanced analytics, accuracy metrics, and time-taken reports.",
    icon: <TrendingUp className="w-10 h-10" />
  }
];
const ENTRANCE_EXAMS = [
  { name: 'JEE Main', desc: 'Engineering Entrance', icon: <Calculator className="w-5 h-5" /> },
  { name: 'JEE Advanced', desc: 'IIT Entrance', icon: <Cpu className="w-5 h-5" /> },
  { name: 'NEET UG', desc: 'Medical Entrance', icon: <Activity className="w-5 h-5" /> },
  { name: 'AP EAPCET', desc: 'AP State Engineering/Medical', icon: <Microscope className="w-5 h-5" /> },
  { name: 'TG EAPCET', desc: 'TG State Engineering/Medical', icon: <Atom className="w-5 h-5" /> }
];

const COMPETITIVE_EXAMS = [
  { name: 'SBI PO', desc: 'Probationary Officer Exam', icon: <Briefcase className="w-5 h-5" /> },
  { name: 'SBI Clerk', desc: 'Junior Associates Exam', icon: <BookOpen className="w-5 h-5" /> }
];

const smoothScroll = (id: string) => {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [startTyping, setStartTyping] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setStartTyping(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const headingLetters = "Our Premium Features".split("");

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'About', path: '/about' },
    { label: 'Entrance Tests', path: '/entrance-exams' },
    { label: 'Competitive Exams', path: '/competitive-exams' },
    { label: 'Contact', path: '/contact' },
  ];

  return (
    <div className="min-h-screen font-sans selection:bg-emerald-500/30 bg-slate-50">

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
        id="hero"
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out ${scrolled
            ? 'bg-white shadow-sm py-1.5'
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

          <nav className={`hidden lg:flex items-center gap-8 text-sm font-semibold transition-colors duration-300 ${scrolled ? 'text-slate-600' : 'text-white/90'}`}>
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.path}
                className={`hover:text-emerald-400 transition-colors duration-200 cursor-pointer font-semibold text-sm ${scrolled ? 'text-slate-600 hover:text-emerald-600' : 'text-white/90'}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className={`text-sm font-bold transition-all px-4 py-2.5 rounded-full ${scrolled
                  ? 'text-slate-700 hover:bg-slate-100'
                  : 'text-white hover:bg-white/20'
                }`}
            >
              Login
            </Link>
            <Link
              to="/register"
              className={`text-sm font-bold py-2.5 px-7 rounded-full shadow-sm hover:shadow-md transition-all ${scrolled
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
          <div className={`lg:hidden border-t ${scrolled ? 'bg-white border-slate-100' : 'bg-emerald-900/95 backdrop-blur-md border-white/10'}`}>
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

      {/* Hero Section */}
      <section className="relative flex flex-col items-center pt-32 md:pt-40 pb-0 overflow-hidden bg-gradient-to-br from-emerald-700 via-emerald-800 to-emerald-950">
        <BackgroundAnimations />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 flex flex-col items-center text-center">

          <div className="flex flex-col items-center justify-center w-full">
            <motion.h1
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight mb-2"
            >
              Proven Pathways to
            </motion.h1>

            <div className="text-2xl md:text-4xl lg:text-5xl font-extrabold text-emerald-200 mt-2 h-[1.5em] flex items-center justify-center">
              {startTyping && <TypewriterEffect />}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 250 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
            className="w-full max-w-3xl relative z-30 flex justify-center mt-12 mb-0"
          >
            <div className="absolute inset-0 bg-emerald-400 blur-3xl opacity-20 rounded-full translate-y-20"></div>
            <img
              src={heroImage}
              alt="Ankurah Exams Dashboard Preview"
              className="relative z-30 w-full h-auto drop-shadow-2xl mx-auto"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </motion.div>
        </div>
      </section>

      {/* Features Section - Exact Match to User Screenshots with Theme Colors */}
      <section id="features" className="py-24 bg-[#f8f9fc] overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-6 relative z-10">

          <div className="text-center mb-16">
            {/* Animated Alphabet Heading with Icons and continuous scroll animation */}
            <h2 className="text-3xl md:text-4xl font-extrabold text-emerald-700 mb-4 flex flex-wrap justify-center items-center overflow-hidden gap-4">
              <motion.div
                initial={{ rotate: -180, opacity: 0, scale: 0 }}
                whileInView={{ rotate: 0, opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, type: "spring" }}
                viewport={{ once: false }}
              >
                <BookOpen className="w-8 h-8 text-emerald-500" />
              </motion.div>

              <div className="flex flex-wrap justify-center">
                {headingLetters.map((char, index) => (
                  <motion.span
                    key={index}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false }}
                    transition={{
                      duration: 0.6,
                      delay: index * 0.05,
                      type: "spring",
                      stiffness: 150
                    }}
                    className={`inline-block hover:text-emerald-400 transition-colors duration-200 cursor-default hover:-translate-y-2 ${char === ' ' ? 'w-2' : ''}`}
                  >
                    {char}
                  </motion.span>
                ))}
              </div>

              <motion.div
                initial={{ rotate: 180, opacity: 0, scale: 0 }}
                whileInView={{ rotate: 0, opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, type: "spring" }}
                viewport={{ once: false }}
              >
                <Award className="w-8 h-8 text-emerald-500" />
              </motion.div>
            </h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="text-lg text-slate-600 max-w-2xl mx-auto"
            >
              The smartest way to prepare. Master your syllabus with tailored mock tests.
            </motion.p>
          </div>

          {/* Clean 3-Column Cards with Hover Background image */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {FEATURES.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.6 + (idx * 0.2), ease: "easeOut" }}
                className="relative bg-white p-10 md:p-12 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-2xl transition-shadow duration-500 flex flex-col group overflow-hidden cursor-pointer rounded-sm"
              >
                {/* Background Image Overlay that fades in on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0">
                  <img src={cardsBg} alt="Background pattern" className="w-full h-full object-cover" />
                  {/* Theme color overlay (Emerald instead of Red) to match project theme */}
                  <div className="absolute inset-0 bg-emerald-600/90 mix-blend-multiply"></div>
                  <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/80 to-emerald-700/90"></div>
                </div>

                <div className="relative z-10">
                  {/* Icon */}
                  <div className="mb-6 text-emerald-700 group-hover:text-white transition-colors duration-500 transform group-hover:scale-110 origin-left">
                    {feature.icon}
                  </div>

                  {/* Title */}
                  <h3 className="text-2xl font-bold text-slate-900 group-hover:text-white transition-colors duration-500 mb-4">
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p className="text-slate-500 group-hover:text-emerald-50 transition-colors duration-500 leading-relaxed font-medium">
                    {feature.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </section>

      {/* About / Supported Exams */}
      <section id="exams" className="py-24 bg-white border-t border-slate-100 relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-50/50 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-teal-50/50 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/3 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 text-center mb-16 relative z-10">

          {/* Unique animated word-by-word heading */}
          <h2 className="text-3xl md:text-4xl font-extrabold text-emerald-800 mb-4 flex flex-wrap justify-center items-center gap-3">
            <motion.div
              initial={{ opacity: 0, x: -30, scale: 0.5 }}
              whileInView={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 0.6, type: "spring" }}
              viewport={{ once: false }}
            >
              <ShieldCheck className="w-8 h-8 text-emerald-500" />
            </motion.div>

            <div className="flex flex-wrap justify-center gap-3">
              {"Explore Your Options".split(" ").map((word, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, scale: 0.5, filter: "blur(8px)" }}
                  whileInView={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                  viewport={{ once: false, amount: 0.5 }}
                  transition={{
                    duration: 0.6,
                    delay: index * 0.2,
                    ease: "easeOut"
                  }}
                  className="inline-block hover:text-emerald-500 transition-colors duration-300 cursor-default"
                >
                  {word}
                </motion.span>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, x: 30, scale: 0.5 }}
              whileInView={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 0.6, type: "spring" }}
              viewport={{ once: false }}
            >
              <Award className="w-8 h-8 text-emerald-500" />
            </motion.div>
          </h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-lg text-slate-600 max-w-2xl mx-auto"
          >
            We provide comprehensive preparation modules tailored for the most competitive exams.
          </motion.p>
        </div>

        {/* Two Categories Layout */}
        <div className="max-w-7xl mx-auto px-6 relative z-10 space-y-12">

          {/* Entrance Tests Block - Green Dotted Border */}
          <div className="p-8 rounded-3xl border-2 border-dashed border-emerald-500 bg-white/40 backdrop-blur-sm">
            <div className="text-center md:text-left mb-10">
              <div className="inline-flex items-center gap-3 px-4 py-2 bg-emerald-50 rounded-full text-emerald-700 font-bold text-sm mb-4 border border-emerald-100">
                <Microscope className="w-4 h-4" />
                Category 1
              </div>
              <h3 className="text-3xl md:text-4xl font-black text-slate-900">Entrance Tests</h3>
              <p className="text-slate-500 font-medium mt-3 text-lg">Secure your seat in top engineering and medical colleges.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {ENTRANCE_EXAMS.map((exam, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                  key={exam.name} 
                  className="relative group overflow-hidden rounded-3xl bg-slate-900 h-52 flex flex-col justify-end p-5 cursor-pointer shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-slate-900/60 to-slate-900 opacity-90 z-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="absolute -right-4 -top-4 w-24 h-24 text-white/5 z-0 transform group-hover:scale-125 group-hover:rotate-12 transition-all duration-700 flex items-center justify-center">
                    {React.cloneElement(exam.icon, { className: 'w-20 h-20' })}
                  </div>
                  <div className="relative z-10 translate-y-6 group-hover:translate-y-0 transition-transform duration-500 ease-out">
                    <div className="w-10 h-10 rounded-[10px] bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3 border border-emerald-500/30 group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-500">
                      {React.cloneElement(exam.icon, { className: 'w-5 h-5' })}
                    </div>
                    <h4 className="text-base font-bold text-white mb-1 leading-tight">{exam.name}</h4>
                    <p className="text-emerald-100/60 text-[12px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 line-clamp-2">
                      {exam.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Competitive Exams Block - White Dotted Border with Green BG */}
          <div className="p-8 rounded-3xl border-2 border-dashed border-white bg-gradient-to-br from-emerald-800 to-emerald-950 text-white shadow-2xl relative overflow-hidden">
            {/* Background Animations Overlay inside block */}
            <div className="absolute inset-0 bg-emerald-400/5 blur-[80px] rounded-full translate-y-10 pointer-events-none"></div>
            
            <div className="relative z-10 text-center md:text-left mb-10 flex flex-col md:items-end">
              <div className="inline-flex items-center gap-3 px-4 py-2 bg-emerald-500/20 rounded-full text-emerald-300 font-bold text-sm mb-4 border border-emerald-500/30">
                <Briefcase className="w-4 h-4" />
                Category 2
              </div>
              <h3 className="text-3xl md:text-4xl font-black text-white md:text-right">Competitive Exams</h3>
              <p className="text-emerald-100/80 font-medium mt-3 text-lg md:text-right">Crack top banking and government sector examinations.</p>
            </div>

            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 lg:justify-end">
              {COMPETITIVE_EXAMS.map((exam, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                  key={exam.name} 
                  className="relative group overflow-hidden rounded-3xl bg-white h-52 flex flex-col justify-end p-5 cursor-pointer shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-slate-100"
                >
                  {/* Opposite Hover: transitions from clean light to a dark emerald/teal gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-white to-slate-50 opacity-100 z-0 group-hover:opacity-0 transition-opacity duration-500"></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-teal-950 via-teal-900/60 to-teal-900 opacity-0 group-hover:opacity-95 z-0 transition-opacity duration-500"></div>
                  
                  <div className="absolute -left-4 -top-4 w-24 h-24 text-slate-200 group-hover:text-white/5 z-0 transform group-hover:scale-125 group-hover:-rotate-12 transition-all duration-700 flex items-center justify-center">
                    {React.cloneElement(exam.icon, { className: 'w-20 h-20' })}
                  </div>
                  
                  <div className="relative z-10 translate-y-6 group-hover:translate-y-0 transition-transform duration-500 ease-out md:text-right md:flex md:flex-col md:items-end">
                    <div className="w-10 h-10 rounded-[10px] bg-teal-50 text-teal-600 flex items-center justify-center mb-3 border border-teal-100 group-hover:bg-teal-500 group-hover:text-white group-hover:border-teal-500 transition-all duration-500">
                      {React.cloneElement(exam.icon, { className: 'w-5 h-5' })}
                    </div>
                    <h4 className="text-base font-bold text-slate-800 group-hover:text-white mb-1 leading-tight transition-colors duration-300">{exam.name}</h4>
                    <p className="text-slate-500 group-hover:text-teal-100/60 text-[12px] opacity-0 group-hover:opacity-100 transition-all duration-500 delay-100 line-clamp-2">
                      {exam.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Layout matched to user reference */}
      <section className="py-24 bg-slate-50 relative border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-6">
          <div className="bg-gradient-to-r from-emerald-400 to-teal-400 rounded-2xl p-10 md:p-12 relative overflow-hidden shadow-[0_20px_50px_rgba(52,211,153,0.25)] min-h-[320px] flex flex-col justify-between">
            
            {/* Floating semi-transparent squares */}
            <div className="absolute top-8 left-8 w-64 h-64 bg-white/10 rounded-lg backdrop-blur-[2px] pointer-events-none"></div>
            <div className="absolute top-32 left-64 w-40 h-40 bg-white/10 rounded-lg backdrop-blur-[2px] pointer-events-none"></div>
            <div className="absolute top-24 right-[45%] w-10 h-10 bg-white/20 rounded-md backdrop-blur-sm pointer-events-none"></div>
            <div className="absolute top-12 right-12 w-32 h-32 bg-white/10 rounded-lg backdrop-blur-[2px] pointer-events-none z-0"></div>
            <div className="absolute top-8 right-24 w-20 h-20 bg-white/20 rounded-lg backdrop-blur-sm pointer-events-none z-0"></div>
            <div className="absolute bottom-12 right-[40%] w-14 h-14 bg-white/20 rounded-lg backdrop-blur-sm pointer-events-none"></div>
            <div className="absolute bottom-10 left-10 w-16 h-16 bg-white/10 rounded-lg backdrop-blur-sm pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row justify-between h-full min-h-[240px] gap-10">
              {/* Left side: Brand top, Button bottom */}
              <div className="flex flex-col justify-between items-start h-full gap-16 md:gap-0">
                <div className="flex items-center gap-2 text-white">
                  <span className="text-2xl font-light tracking-wide">Ankurah</span>
                  <span className="text-2xl font-bold tracking-wide">Exams</span>
                </div>
                
                <button className="bg-white hover:bg-slate-50 text-emerald-500 px-8 py-3 rounded-full font-bold uppercase tracking-wider text-sm shadow-md transition-transform hover:-translate-y-1">
                  Get Started
                </button>
              </div>
              
              {/* Right side: Large Text, small text, line */}
              <div className="flex flex-col items-start md:items-end text-left md:text-right justify-center max-w-lg mt-auto mb-auto">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-white mb-4 tracking-tight">
                  Accelerate <span className="font-semibold">Preparation</span>
                </h2>
                <p className="text-white/90 text-sm md:text-[15px] mb-8 leading-relaxed font-medium">
                  Join the thousands of students already achieving their dreams with our structured materials and deep analytics. Your journey starts here.
                </p>
                <div className="w-12 h-[3px] bg-white rounded-full"></div>
              </div>
            </div>
            
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="relative bg-gradient-to-br from-emerald-700 via-emerald-800 to-emerald-950 text-emerald-50 py-16 overflow-hidden">
        {/* Same background animations as Hero */}
        <BackgroundAnimations />
        
        {/* Subtle dark overlay for readability */}
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
            <a href="#features" className="text-sm text-emerald-100/70 hover:text-white transition-colors">Features</a>
            <a href="#exams" className="text-sm text-emerald-100/70 hover:text-white transition-colors">Exams Supported</a>
            <a href="#pricing" className="text-sm text-emerald-100/70 hover:text-white transition-colors">Pricing</a>
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
