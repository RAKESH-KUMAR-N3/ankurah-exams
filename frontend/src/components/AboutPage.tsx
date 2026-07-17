import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Award, TrendingUp, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import logo from '../assets/logo.png';
import cardsBg from '../assets/cards-bg.jpg';
import aboutImg from '../assets/about-img.png';
import cardsBgImg from '../assets/cards-bg-img.png';

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

export default function AboutPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
        @keyframes float-bob {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.4; transform: scaleY(0.8); }
          50% { opacity: 1; transform: scaleY(1); }
        }
        .heading-float {
          animation: float-bob 3.5s ease-in-out infinite;
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
              {"About Ankurah Exams".split(" ").map((word, index) => (
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
              Delivering a specialized prep engine designed to systematically scale conceptual clarity, rigorous evaluation, and predictive analytics.
            </motion.p>
          </div>
        </section>

        {/* Academic Mission Section */}
        <section className="py-12 bg-white relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] bg-emerald-50/40 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              {/* Left Column: Clean Blended Infographic Image (about-img.png) */}
              <motion.div
                initial={{ opacity: 0, x: -40, scale: 0.98 }}
                whileInView={{ opacity: 1, x: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="lg:col-span-6 flex justify-center items-center overflow-hidden"
              >
                <img
                  src={aboutImg}
                  alt="Our Academic Mission Infographic"
                  className="w-full max-h-[400px] object-contain object-center select-none pointer-events-none"
                />
              </motion.div>

              {/* Center: Animated Vertical Divider */}
              <motion.div
                initial={{ opacity: 0, scaleY: 0 }}
                whileInView={{ opacity: 1, scaleY: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
                className="hidden lg:flex lg:col-span-1 flex-col items-center justify-center gap-3 self-stretch py-4"
              >
                <div className="w-px flex-1 bg-gradient-to-b from-transparent via-emerald-300 to-transparent"
                  style={{ animation: 'pulse-glow 2.5s ease-in-out infinite' }}
                ></div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]"
                  style={{ animation: 'pulse-glow 2s ease-in-out infinite' }}
                ></div>
                <div className="w-px flex-1 bg-gradient-to-b from-transparent via-emerald-300 to-transparent"
                  style={{ animation: 'pulse-glow 2.5s ease-in-out infinite 0.5s' }}
                ></div>
              </motion.div>

              {/* Right Column: Glassmorphic Mission Text Card */}
              <motion.div
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="lg:col-span-5 bg-gradient-to-br from-slate-50 to-white p-8 md:p-10 rounded-3xl border border-slate-100 shadow-[0_15px_40px_rgba(0,0,0,0.015)] space-y-6 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl"></div>
                
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="inline-flex items-center gap-3 px-4 py-2 bg-emerald-50 rounded-full text-emerald-700 font-bold text-xs border border-emerald-100 uppercase tracking-wider"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Our Core Philosophy
                </motion.div>

                {/* Animated Float Heading */}
                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-wide leading-tight heading-float">
                  {"Our Academic Mission".split(" ").map((word, index) => (
                    <motion.span
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.5,
                        delay: 0.3 + index * 0.1,
                        ease: "easeOut"
                      }}
                      className="inline-block mr-2"
                    >
                      {word}
                    </motion.span>
                  ))}
                </h2>

                <p className="text-slate-605 text-sm md:text-[15px] leading-relaxed font-semibold">
                  Ankurah Exams was created to eliminate the chaos of unorganized study files and scattered question papers. We provide a clean, state-of-the-art testing platform tailored specifically for intermediate students and aspirants targeting elite engineering, medical, and banking colleges.
                </p>
                <p className="text-slate-500 text-sm md:text-[15px] leading-relaxed font-medium">
                  Our core strategy centers on continuous feedback: giving students a personalized daily schedule, matching reference sheets, and immediately grading simulated mock tests with instant accuracy metrics.
                </p>
              </motion.div>

            </div>
          </div>
        </section>

        {/* Key Metrics Stats Counter Section (Green/Teal Gradient with cards-bg-img.png) */}
        <section className="py-10 bg-slate-50 border-y border-slate-100/80">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { value: "10,000+", label: "Practice MCQs", desc: "Chapter-wise curated bank", icon: <BookOpen className="w-6 h-6 text-white" /> },
                { value: "99.8%", label: "Accuracy Target", desc: "In-depth speed analytics", icon: <TrendingUp className="w-6 h-6 text-white" /> },
                { value: "24/7", label: "Mentor Support", desc: "For doubt resolutions", icon: <ShieldCheck className="w-6 h-6 text-white" /> },
                { value: "5+", label: "Elite Exam Tracks", desc: "JEE, NEET, and Banking", icon: <Award className="w-6 h-6 text-white" /> }
              ].map((stat, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ y: -6, scale: 1.02 }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="relative p-6 rounded-2xl overflow-hidden border border-emerald-500/20 text-white shadow-md flex flex-col justify-between min-h-[160px] group transition-all duration-300"
                  style={{
                    backgroundImage: `linear-gradient(to bottom right, rgba(4, 120, 87, 0.95), rgba(13, 148, 136, 0.95)), url(${cardsBgImg})`,
                    backgroundSize: '100px auto',
                    backgroundRepeat: 'repeat',
                    backgroundPosition: 'center'
                  }}
                >
                  {/* Subtle hover overlay to intensify the color */}
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 to-teal-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  
                  <div className="space-y-4 relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 text-white flex items-center justify-center border border-white/20 group-hover:bg-white group-hover:text-emerald-700 transition-all duration-300 shadow-inner">
                      {stat.icon}
                    </div>
                    <div className="space-y-2">
                      <div className="text-3xl font-black text-white group-hover:text-emerald-50 transition-colors duration-300">
                        {stat.value}
                      </div>
                      <div className="font-extrabold text-emerald-100 text-[15px] tracking-tight">
                        {stat.label}
                      </div>
                    </div>
                  </div>
                  <div className="text-emerald-200/70 text-xs font-semibold mt-4 relative z-10">
                    {stat.desc}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Pillars / Dynamic Cards Grid Section */}
        <section className="py-12 max-w-7xl mx-auto px-6 space-y-10">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-full text-emerald-700 font-bold text-xs border border-emerald-100 uppercase tracking-wider">
              Features
            </div>
            <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              Our Core Platform Pillars
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Personalized Timetables",
                desc: "Get your custom academic schedule mapped to daily revision intervals, syllabus slots, and goals.",
                icon: <BookOpen className="w-12 h-12" />,
                gradient: "from-emerald-500/10 to-teal-500/10 hover:border-emerald-500"
              },
              {
                title: "Grand Mock Assessments",
                desc: "Simulate exact competitive test centers with automated negative marking evaluations.",
                icon: <Award className="w-12 h-12" />,
                gradient: "from-teal-500/10 to-cyan-500/10 hover:border-teal-500"
              },
              {
                title: "Granular Analytics",
                desc: "Inspect chapter mastery, accuracy percentages, and timing logs after every assessment.",
                icon: <TrendingUp className="w-12 h-12" />,
                gradient: "from-emerald-500/10 to-green-500/10 hover:border-emerald-500"
              }
            ].map((card, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.15, ease: "easeOut" }}
                whileHover={{ y: -8, scale: 1.02 }}
                className={`bg-white p-7 border border-slate-100 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.02)] relative group overflow-hidden cursor-pointer transition-all duration-300 ${card.gradient}`}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0">
                  <img src={cardsBg} alt="Bg" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-emerald-800/90 mix-blend-multiply"></div>
                  <div className="absolute inset-0 bg-gradient-to-b from-emerald-700/80 to-emerald-900/95"></div>
                </div>

                <div className="relative z-10 space-y-5">
                  <div className="relative z-10 text-emerald-700 group-hover:text-white transition-colors duration-500 transform group-hover:scale-110 origin-left">
                    {card.icon}
                  </div>
                  <h3 className="text-2xl font-extrabold text-slate-900 group-hover:text-white transition-colors duration-500">
                    {card.title}
                  </h3>
                  <p className="text-slate-600 group-hover:text-emerald-50 text-sm leading-relaxed font-semibold transition-colors duration-500">
                    {card.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Banner-Style Methodology (Learning Flywheel) Section */}
        <section className="py-10 max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-800 to-emerald-950 text-white p-8 md:p-10 shadow-xl border border-emerald-500/10"
          >
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-40">
              <div className="absolute top-[-50%] left-[-20%] w-[600px] h-[600px] bg-emerald-400/20 rounded-full blur-[100px]"></div>
              <div className="absolute bottom-[-50%] right-[-20%] w-[600px] h-[600px] bg-teal-400/20 rounded-full blur-[100px]"></div>
            </div>

            <div className="relative z-10 space-y-8">
              {/* Banner Header */}
              <div className="text-center space-y-3">
                <span className="px-3 py-1 bg-emerald-500/20 rounded-full text-emerald-300 font-bold text-xs uppercase tracking-wider border border-emerald-500/30">
                  Methodology
                </span>
                <h3 className="text-2xl md:text-3xl font-black tracking-wide text-white uppercase">
                  The Ankurah Learning Flywheel
                </h3>
                <p className="text-emerald-100/80 text-sm max-w-xl mx-auto font-medium">
                  Our systematic, circular preparation approach ensures continuous progress and measurable results.
                </p>
              </div>

              {/* Horizontal Timeline Steps */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-4 items-center">
                
                {/* Step 1 */}
                <div className="lg:col-span-1 space-y-3 text-center lg:text-left group">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-bold text-lg shadow-md mx-auto lg:mx-0 transition-transform group-hover:-translate-y-1 duration-300 border border-emerald-400/30">
                    1
                  </div>
                  <h4 className="font-extrabold text-white text-base transition-colors group-hover:text-emerald-300">Personalized Scheduling</h4>
                  <p className="text-emerald-100/70 text-xs leading-relaxed font-semibold">
                    Daily slots aligned with your academic year generated by our system coordinators to maintain consistency.
                  </p>
                </div>

                {/* Arrow 1 */}
                <div className="hidden lg:flex lg:col-span-1 justify-center">
                  <div className="h-0.5 w-16 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full opacity-60"></div>
                </div>

                {/* Step 2 */}
                <div className="lg:col-span-1 space-y-3 text-center lg:text-left group">
                  <div className="w-12 h-12 rounded-2xl bg-teal-500 text-white flex items-center justify-center font-bold text-lg shadow-md mx-auto lg:mx-0 transition-transform group-hover:-translate-y-1 duration-300 border border-teal-400/30">
                    2
                  </div>
                  <h4 className="font-extrabold text-white text-base transition-colors group-hover:text-teal-300">Targeted Practice</h4>
                  <p className="text-emerald-100/70 text-xs leading-relaxed font-semibold">
                    Solve customized daily MCQ goals mapped directly to chapter-specific sub-topics in Physics, Chemistry, Math, and Biology.
                  </p>
                </div>

                {/* Arrow 2 */}
                <div className="hidden lg:flex lg:col-span-1 justify-center">
                  <div className="h-0.5 w-16 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full opacity-60"></div>
                </div>

                {/* Step 3 */}
                <div className="lg:col-span-1 space-y-3 text-center lg:text-left group">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-bold text-lg shadow-md mx-auto lg:mx-0 transition-transform group-hover:-translate-y-1 duration-300 border border-emerald-400/30">
                    3
                  </div>
                  <h4 className="font-extrabold text-white text-base transition-colors group-hover:text-emerald-300">Actionable Insights</h4>
                  <p className="text-emerald-100/70 text-xs leading-relaxed font-semibold">
                    Analyze accuracy metrics, time-taken curves, and detailed chapter-wise mastery progress to systematically eliminate weak zones.
                  </p>
                </div>

              </div>
            </div>
          </motion.div>
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
