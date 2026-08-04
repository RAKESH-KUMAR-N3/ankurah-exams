import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User } from '../../types';
import { Mail, Key, Eye, EyeOff, AlertCircle, ArrowRight, UserPlus, CheckCircle2, ArrowLeft, Phone, GraduationCap, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import logo from '../../assets/logo.png';

interface AuthProps {
  onAuthSuccess: (user: User) => void;
  initialMode?: 'login' | 'register';
}

const API_URL = import.meta.env.VITE_API_URL || `http://${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}:5000`;

// Animated background blobs & particles
const AnimatedBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none bg-gradient-to-br from-emerald-950 via-slate-950 to-emerald-950">
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
    <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-[120px]"></div>
    <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-teal-500/20 rounded-full blur-[140px]"></div>
    <div className="absolute top-[30%] right-[20%] w-[350px] h-[350px] bg-emerald-400/10 rounded-full blur-[100px]"></div>

    <div className="absolute inset-0 flex justify-between px-8 md:px-24 opacity-15">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-full w-[1px] bg-emerald-400 relative overflow-hidden">
          <div
            className="absolute top-0 left-0 w-full h-48 bg-gradient-to-b from-transparent via-emerald-300 to-transparent opacity-80"
            style={{
              animation: `scan-down ${6 + i * 2}s linear infinite`,
              animationDelay: `${i * 1.2}s`
            }}
          ></div>
        </div>
      ))}
    </div>

    {[...Array(12)].map((_, i) => {
      const size = Math.random() * 80 + 30;
      return (
        <div
          key={`particle-${i}`}
          className="absolute rounded-full bg-emerald-400"
          style={{
            width: size,
            height: size,
            left: `${(i * 8.3) + Math.random() * 4}%`,
            bottom: '-20%',
            opacity: Math.random() * 0.08 + 0.03,
            animation: `float-up ${18 + Math.random() * 10}s linear infinite`,
            animationDelay: `${Math.random() * -15}s`
          }}
        />
      );
    })}
  </div>
);

export default function Auth({ onAuthSuccess, initialMode = 'login' }: AuthProps) {
  const navigate = useNavigate();
  const [view, setView] = useState<'login' | 'register' | 'forgot-password'>(initialMode === 'register' ? 'register' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  
  const [studentType, setStudentType] = useState('');

  // Sync mode with URL
  useEffect(() => {
    setView(initialMode === 'register' ? 'register' : 'login');
    setError(null);
  }, [initialMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (view === 'forgot-password') {
        if (!email.trim()) {
          setError('Please enter your email address.');
          setLoading(false);
          return;
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
        setResetSent(true);
        setLoading(false);
        return;
      }

      if (view === 'register') {
        if (!name.trim()) { setError('Please enter your full name.'); setLoading(false); return; }
        if (!mobile.trim() || mobile.length < 10) { setError('Please enter a valid mobile number.'); setLoading(false); return; }
        if (password.length < 6) { setError('Password must be at least 6 characters.'); setLoading(false); return; }

        const payload: any = {
          name: name.trim(), 
          email: email.trim(), 
          password, 
          phone: mobile.trim(), 
          role: 'student',
        };
        if (studentType) payload.studentType = studentType;

        const res = await fetch(`${API_URL}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error((data.details && data.details.length > 0 ? data.details.join(', ') : data.message) || 'Registration failed.');

        localStorage.setItem('token', data.token);
        const user: User = { uid: data._id, name: data.name, email: data.email, phone: data.phone || mobile.trim(), role: data.role, state: data.state || 'Both', selectedEntranceExams: [], selectedCompetitiveExams: [], studentType: studentType as any, studyPlan: 'yearly', streak: 1, lastActiveDate: new Date().toISOString(), createdAt: new Date().toISOString() };
        onAuthSuccess(user);
      } else {
        const res = await fetch(`${API_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Invalid email or password.');

        localStorage.setItem('token', data.token);
        const user: User = { uid: data._id, name: data.name, email: data.email, phone: data.phone || '', role: data.role, state: data.state || 'Both', selectedEntranceExams: data.exams || [], selectedCompetitiveExams: [], studentType: data.studentType || '', studyPlan: 'yearly', streak: 1, lastActiveDate: new Date().toISOString(), createdAt: new Date().toISOString() };
        onAuthSuccess(user);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (mode: 'login' | 'register' | 'forgot-password') => {
    setView(mode);
    setError(null);
    setResetSent(false);
    setEmail('');
    setPassword('');
    setName('');
    setMobile('');
    setStudentType('');
    if (mode === 'register') navigate('/register', { replace: true });
    else if (mode === 'login') navigate('/login', { replace: true });
  };

  const inputClasses = "w-full pl-11 pr-4 py-3 sm:py-3.5 md:py-2.5 bg-slate-900/90 border border-emerald-500/30 rounded-xl text-white text-sm font-medium transition-all focus:bg-slate-900 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/20 shadow-[0_4px_20px_rgba(0,0,0,0.4)] outline-none placeholder:text-slate-400";
  const iconClasses = "absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-200";

  return (
    <div className="min-h-screen relative flex flex-col justify-center items-center p-4 sm:p-6 md:p-6 font-sans selection:bg-emerald-500/30 text-white bg-gradient-to-b from-emerald-950 via-slate-950 to-emerald-950">
      <AnimatedBackground />

      <div className="relative z-10 w-full max-w-md mx-auto flex flex-col justify-center min-h-[85vh] md:min-h-0 py-4 md:py-6 gap-3">

        {/* Top Branding Section with HIGHLY ELEVATED LOGO BADGE */}
        <div className="flex flex-col items-center pt-1 md:pt-0 pb-3 md:pb-1">
          <Link to="/" className="group relative mb-3 cursor-pointer flex flex-col items-center">
            {/* Same approach as admin sidebar: soft white blur halo BEHIND logo, no box */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] w-3/4 h-16 bg-white/60 blur-[30px] rounded-full pointer-events-none"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-52 h-28 bg-emerald-300/15 rounded-full blur-2xl pointer-events-none animate-pulse"></div>

            {/* Raw logo image — just like admin sidebar, NO wrapper box */}
            <img
              src={logo}
              alt="Ankurah Exams"
              className="w-52 sm:w-60 md:w-48 object-contain relative z-10 drop-shadow-[0_4px_18px_rgba(255,255,255,0.25)] transform group-hover:scale-105 transition-transform duration-300"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </Link>

          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="text-center mt-1"
            >
              <h2 className="text-xl sm:text-2xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-emerald-100 to-emerald-300 tracking-tight">
                {view === 'register' ? 'Create an Account' : view === 'forgot-password' ? 'Reset Password' : 'Welcome Back'}
              </h2>
              <p className="text-emerald-200/80 text-xs sm:text-sm mt-1 font-medium">
                {view === 'register'
                  ? 'Start your exam preparation journey today'
                  : view === 'forgot-password'
                  ? 'Enter your email to receive a secure reset link'
                  : 'Sign in to continue your preparation'}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Middle Section: Form Fields Seamlessly Integrated */}
        <div className="w-full my-auto md:my-0 py-1 md:py-0">
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 12 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="overflow-hidden"
              >
                <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/40 flex items-start gap-3 backdrop-blur-md shadow-lg">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-red-200 text-xs sm:text-sm font-semibold leading-relaxed">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3 md:gap-2.5">
            {view === 'forgot-password' && resetSent ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="p-6 rounded-xl bg-emerald-950/80 border border-emerald-500/40 backdrop-blur-xl flex flex-col items-center justify-center gap-4 text-center my-4 shadow-xl"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center mb-1">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                </div>
                <p className="text-emerald-200 text-xs sm:text-sm font-semibold leading-relaxed">
                  Reset link sent to <span className="text-white font-bold">{email}</span>. <br/>Please check your inbox.
                </p>
                <button type="button" onClick={() => switchMode('login')} className="mt-2 px-6 py-3 bg-emerald-400 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg transition-colors cursor-pointer">
                  Return to Sign In
                </button>
              </motion.div>
            ) : (
              <>
                <div className="flex flex-col gap-3 md:gap-2.5">
                  <AnimatePresence initial={false}>
                    {view === 'register' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}
                        className="overflow-hidden relative"
                      >
                        <div className="relative">
                          <UserPlus className={`${iconClasses} ${focusedField === 'name' ? 'text-emerald-300' : 'text-slate-400'}`} />
                          <input id="auth_name" type="text" value={name} onChange={(e) => setName(e.target.value)} onFocus={() => setFocusedField('name')} onBlur={() => setFocusedField(null)} placeholder="Full Name" className={inputClasses} required autoComplete="name" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.div layout className="relative">
                    <Mail className={`${iconClasses} ${focusedField === 'email' ? 'text-emerald-300' : 'text-slate-400'}`} />
                    <input id="auth_email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField(null)} placeholder="Email Address" className={inputClasses} required autoComplete="email" />
                  </motion.div>

                  <AnimatePresence initial={false}>
                    {view === 'register' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}
                        className="overflow-hidden relative"
                      >
                        <div className="relative">
                          <Phone className={`${iconClasses} ${focusedField === 'mobile' ? 'text-emerald-300' : 'text-slate-400'}`} />
                          <input id="auth_mobile" type="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} onFocus={() => setFocusedField('mobile')} onBlur={() => setFocusedField(null)} placeholder="Mobile Number" className={inputClasses} required minLength={10} maxLength={15} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence initial={false}>
                    {view !== 'forgot-password' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}
                        className="overflow-hidden relative"
                      >
                        <div className="relative">
                          <Key className={`${iconClasses} ${focusedField === 'password' ? 'text-emerald-300' : 'text-slate-400'}`} />
                          <input id="auth_password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} onFocus={() => setFocusedField('password')} onBlur={() => setFocusedField(null)} placeholder={view === 'register' ? 'Password (min 6 chars)' : 'Password'} style={{ paddingRight: '44px' }} className={inputClasses} required autoComplete={view === 'register' ? 'new-password' : 'current-password'} />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-300 transition-colors cursor-pointer">
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <AnimatePresence>
                  {view === 'login' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-end pt-0.5">
                      <button type="button" onClick={() => switchMode('forgot-password')} className="text-xs font-bold text-emerald-300 hover:text-white transition-colors cursor-pointer">
                        Forgot Password?
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.div layout className="pt-1.5 flex justify-center">
                  <button
                    id="auth_submit"
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 md:py-2.5 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 hover:from-emerald-300 hover:to-teal-200 text-slate-950 font-black text-sm sm:text-base uppercase tracking-wider rounded-xl shadow-[0_12px_35px_rgba(16,185,129,0.4)] active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? (
                      <span className="w-5 h-5 border-2 border-slate-950/40 border-t-slate-950 rounded-full animate-spin" />
                    ) : view === 'register' ? (
                      <>Create Account <ArrowRight className="w-5 h-5" /></>
                    ) : view === 'forgot-password' ? (
                      <>Send Reset Link <ArrowRight className="w-5 h-5" /></>
                    ) : (
                      <>Sign In <ArrowRight className="w-5 h-5" /></>
                    )}
                  </button>
                </motion.div>
              </>
            )}
          </form>
        </div>

        {/* Bottom Switch Links */}
        {!resetSent && (
          <motion.div layout className="text-center pt-3 md:pt-2 pb-1 border-t border-emerald-500/20 mt-2 md:mt-1">
            <p className="text-xs sm:text-sm font-medium text-emerald-200/80">
              {view === 'register' ? (
                <>
                  Already have an account?{' '}
                  <button type="button" onClick={() => switchMode('login')} className="text-emerald-400 font-black hover:text-emerald-300 transition-colors cursor-pointer underline underline-offset-4 ml-1 drop-shadow-[0_0_6px_rgba(52,211,153,0.6)]">Sign In</button>
                </>
              ) : view === 'login' ? (
                <>
                  Don't have an account?{' '}
                  <button type="button" onClick={() => switchMode('register')} className="text-emerald-400 font-black hover:text-emerald-300 transition-colors cursor-pointer underline underline-offset-4 ml-1 drop-shadow-[0_0_6px_rgba(52,211,153,0.6)]">Register Free</button>
                </>
              ) : (
                <button type="button" onClick={() => switchMode('login')} className="text-emerald-200 font-bold hover:text-white transition-colors flex items-center justify-center gap-1.5 mx-auto cursor-pointer">
                  <ArrowLeft className="w-4 h-4" /> Back to Sign In
                </button>
              )}
            </p>
          </motion.div>
        )}

      </div>
    </div>
  );
}
