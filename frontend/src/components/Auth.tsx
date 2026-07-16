import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User } from '../types';
import { Mail, Key, Eye, EyeOff, AlertCircle, ArrowRight, UserPlus, CheckCircle2, ArrowLeft, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import logo from '../assets/logo.png';

interface AuthProps {
  onAuthSuccess: (user: User) => void;
  initialMode?: 'login' | 'register';
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Animated background blobs
const AnimatedBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none bg-slate-950">
    <motion.div
      animate={{
        scale: [1, 1.2, 1],
        x: [0, 100, 0],
        y: [0, 50, 0],
      }}
      transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
      className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-emerald-600/30 rounded-full blur-[120px]"
    />
    <motion.div
      animate={{
        scale: [1, 1.5, 1],
        x: [0, -100, 0],
        y: [0, -50, 0],
      }}
      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-teal-600/20 rounded-full blur-[120px]"
    />
    <motion.div
      animate={{
        scale: [1, 1.3, 1],
        x: [0, 50, 0],
        y: [0, 100, 0],
      }}
      transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
      className="absolute top-[20%] right-[10%] w-[40vw] h-[40vw] bg-indigo-500/20 rounded-full blur-[100px]"
    />
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

        const res = await fetch(`${API_URL}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name.trim(), email: email.trim(), password, phone: mobile.trim(), role: 'student' }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Registration failed.');

        localStorage.setItem('token', data.token);
        const user: User = { uid: data._id, name: data.name, email: data.email, role: data.role, selectedEntranceExams: [], selectedCompetitiveExams: [], studentType: '', studyPlan: 'yearly', streak: 1, lastActiveDate: new Date().toISOString(), createdAt: new Date().toISOString() };
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
        const user: User = { uid: data._id, name: data.name, email: data.email, role: data.role, selectedEntranceExams: data.exams || [], selectedCompetitiveExams: [], studentType: data.studentType || '', studyPlan: 'yearly', streak: 1, lastActiveDate: new Date().toISOString(), createdAt: new Date().toISOString() };
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
    if (mode === 'register') navigate('/register', { replace: true });
    else if (mode === 'login') navigate('/login', { replace: true });
  };

  const inputClasses = "w-full pl-11 pr-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 text-sm font-medium transition-all focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none placeholder:text-slate-400";
  const iconClasses = "absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-200";

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden font-sans selection:bg-emerald-500/30">
      <AnimatedBackground />

      <motion.div
        layout
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className={`relative z-10 w-full transition-all duration-500 ${view === 'register' ? 'max-w-[650px]' : 'max-w-[440px]'}`}
      >
        <div className="bg-white/95 backdrop-blur-2xl rounded-xl p-6 sm:p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] border border-white/60">
          
          <div className="flex flex-col items-center mb-8">
            <Link to="/" className="mb-6 block cursor-pointer transition-transform hover:scale-105">
              <img src={logo} alt="Ankurah Exams" className="w-44 sm:w-48 object-contain drop-shadow-sm" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            </Link>

            <AnimatePresence mode="wait">
              <motion.div
                key={view}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="text-center"
              >
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                  {view === 'register' ? 'Create an Account' : view === 'forgot-password' ? 'Reset Password' : 'Welcome Back'}
                </h2>
                <p className="text-slate-500 text-sm mt-2 font-medium">
                  {view === 'register'
                    ? 'Start your exam preparation journey today'
                    : view === 'forgot-password'
                    ? 'Enter your email to receive a secure reset link'
                    : 'Sign in to continue your preparation'}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 20 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="overflow-hidden"
              >
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-red-700 text-sm font-semibold leading-relaxed">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {view === 'forgot-password' && resetSent ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="p-6 rounded-2xl bg-emerald-50 border border-emerald-100 flex flex-col items-center justify-center gap-4 text-center mb-4"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-2">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>
                <p className="text-emerald-800 text-sm font-semibold leading-relaxed">
                  Reset link sent to <span className="text-emerald-900 font-bold">{email}</span>. <br/>Please check your inbox.
                </p>
                <button type="button" onClick={() => switchMode('login')} className="mt-4 px-6 py-2 bg-emerald-600 text-white rounded-full text-sm font-bold shadow-md hover:bg-emerald-700 transition-colors">
                  Return to Sign In
                </button>
              </motion.div>
            ) : (
              <>
                <div className={`grid grid-cols-1 ${view === 'register' ? 'sm:grid-cols-2' : ''} gap-4`}>
                  <AnimatePresence initial={false}>
                    {view === 'register' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}
                        className="overflow-hidden relative"
                      >
                        <div className="relative">
                          <UserPlus className={`${iconClasses} ${focusedField === 'name' ? 'text-emerald-500' : 'text-slate-400'}`} />
                          <input id="auth_name" type="text" value={name} onChange={(e) => setName(e.target.value)} onFocus={() => setFocusedField('name')} onBlur={() => setFocusedField(null)} placeholder="Full Name" className={inputClasses} required autoComplete="name" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.div layout className="relative">
                    <Mail className={`${iconClasses} ${focusedField === 'email' ? 'text-emerald-500' : 'text-slate-400'}`} />
                    <input id="auth_email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField(null)} placeholder="Email Address" className={inputClasses} required autoComplete="email" />
                  </motion.div>

                  <AnimatePresence initial={false}>
                    {view === 'register' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}
                        className="overflow-hidden relative"
                      >
                        <div className="relative">
                          <Phone className={`${iconClasses} ${focusedField === 'mobile' ? 'text-emerald-500' : 'text-slate-400'}`} />
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
                          <Key className={`${iconClasses} ${focusedField === 'password' ? 'text-emerald-500' : 'text-slate-400'}`} />
                          <input id="auth_password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} onFocus={() => setFocusedField('password')} onBlur={() => setFocusedField(null)} placeholder={view === 'register' ? 'Password (min 6 chars)' : 'Password'} style={{ paddingRight: '44px' }} className={inputClasses} required autoComplete={view === 'register' ? 'new-password' : 'current-password'} />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <AnimatePresence>
                  {view === 'login' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-end pt-1">
                      <button type="button" onClick={() => switchMode('forgot-password')} className="text-[13px] font-bold text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer">
                        Forgot Password?
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.div layout className="pt-4 flex justify-center">
                  <button
                    id="auth_submit"
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-[280px] flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl font-bold text-sm shadow-[0_8px_20px_rgba(16,185,129,0.3)] hover:shadow-[0_12px_25px_rgba(16,185,129,0.4)] hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : view === 'register' ? (
                      <>Create Account <ArrowRight className="w-4.5 h-4.5" /></>
                    ) : view === 'forgot-password' ? (
                      <>Send Reset Link <ArrowRight className="w-4.5 h-4.5" /></>
                    ) : (
                      <>Sign In <ArrowRight className="w-4.5 h-4.5" /></>
                    )}
                  </button>
                </motion.div>
              </>
            )}
          </form>

          {!resetSent && (
            <motion.div layout className="text-center mt-8 pt-6 border-t border-slate-100">
              <p className="text-sm font-medium text-slate-500">
                {view === 'register' ? (
                  <>
                    Already have an account?{' '}
                    <button type="button" onClick={() => switchMode('login')} className="text-emerald-600 font-bold hover:text-emerald-700 transition-colors">Sign In</button>
                  </>
                ) : view === 'login' ? (
                  <>
                    Don't have an account?{' '}
                    <button type="button" onClick={() => switchMode('register')} className="text-emerald-600 font-bold hover:text-emerald-700 transition-colors">Register Free</button>
                  </>
                ) : (
                  <button type="button" onClick={() => switchMode('login')} className="text-slate-500 font-bold hover:text-emerald-600 transition-colors flex items-center justify-center gap-1.5 mx-auto">
                    <ArrowLeft className="w-4 h-4" /> Back to Sign In
                  </button>
                )}
              </p>
            </motion.div>
          )}

        </div>
      </motion.div>
    </div>
  );
}
