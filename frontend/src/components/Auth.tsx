import React, { useState } from 'react';
import { User, EntranceExam, CompetitiveExam } from '../types';
import { Sparkles, Shield, User as UserIcon, LogIn, Key, Mail, Check, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';

interface AuthProps {
  entranceExams: EntranceExam[];
  competitiveExams: CompetitiveExam[];
  onAuthSuccess: (user: User) => void;
  initialMode?: 'login' | 'register';
}

export default function Auth({ entranceExams, competitiveExams, onAuthSuccess, initialMode = 'login' }: AuthProps) {
  const [isRegistering, setIsRegistering] = useState(initialMode === 'register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  // Registration custom preferences
  const [selectedEntrances, setSelectedEntrances] = useState<string[]>([]);
  const [selectedCompetitives, setSelectedCompetitives] = useState<string[]>([]);
  const [studentType, setStudentType] = useState<'first_year' | 'second_year' | 'long_term' | ''>('');
  const [studyPlan, setStudyPlan] = useState<'quarterly' | 'half_yearly' | 'academic_year' | 'yearly' | ''>('');
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!email || !password) {
      setError('Please fill in all fields.');
      setLoading(false);
      return;
    }

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    try {
      if (isRegistering) {
        if (!name) {
          setError('Name is required during registration.');
          setLoading(false);
          return;
        }
        if (selectedEntrances.length === 0 && selectedCompetitives.length === 0) {
          setError('Please select at least one Entrance or Competitive Exam.');
          setLoading(false);
          return;
        }

        const res = await fetch(`${API_URL}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, role: 'student' }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Registration failed');

        localStorage.setItem('token', data.token);
        const mappedUser: User = {
          uid: data._id,
          name: data.name,
          email: data.email,
          role: data.role,
          selectedEntranceExams: selectedEntrances,
          selectedCompetitiveExams: selectedCompetitives,
          studentType: selectedEntrances.length > 0 ? (studentType || 'long_term') : '',
          studyPlan: studyPlan || 'yearly',
          streak: 1,
          lastActiveDate: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        };
        onAuthSuccess(mappedUser);
      } else {
        // Login flow — call backend API
        const res = await fetch(`${API_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Login failed');

        localStorage.setItem('token', data.token);
        const mappedUser: User = {
          uid: data._id,
          name: data.name,
          email: data.email,
          role: data.role,
          selectedEntranceExams: data.exams || [],
          selectedCompetitiveExams: [],
          studentType: data.studentType || '',
          studyPlan: 'yearly',
          streak: 1,
          lastActiveDate: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        };
        onAuthSuccess(mappedUser);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An authentication error occurred.');

    } finally {
      setLoading(false);
    }
  };



  const toggleExamSelection = (examId: string, isEntrance: boolean) => {
    if (isEntrance) {
      setSelectedEntrances(prev => 
        prev.includes(examId) ? prev.filter(id => id !== examId) : [...prev, examId]
      );
    } else {
      setSelectedCompetitives(prev => 
        prev.includes(examId) ? prev.filter(id => id !== examId) : [...prev, examId]
      );
    }
  };

  return (
    <div id="auth_container" className="min-h-screen flex items-center justify-center bg-zinc-50 py-12 px-4 sm:px-6 lg:px-8 geom-bg">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-geom border border-geom-border">
        
        {/* Brand Logo & Title */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-md bg-zinc-900 text-white mb-4 border border-zinc-850 shadow-geom-sm">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-extrabold tracking-tight text-zinc-900 uppercase">Ankurah Exams</h2>
          <p className="mt-1 text-xs text-zinc-500 font-medium">
            Professional Entrance & Competitive Exam Preparation
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-md bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-3">
            <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5 text-red-500" />
            <div>
              <p className="font-bold uppercase tracking-wider text-[10px]">Authentication Alert</p>
              <p className="mt-1 text-red-650 leading-relaxed font-semibold">{error}</p>
            </div>
          </div>
        )}


        {/* Auth form toggle */}
        <div className="flex bg-zinc-100 p-1 rounded-md border border-geom-border">
          <button 
            type="button"
            onClick={() => { setIsRegistering(false); setError(null); }}
            className={`flex-1 py-1.5 text-[10px] font-extrabold uppercase tracking-wider rounded-sm transition-all cursor-pointer ${!isRegistering ? 'bg-white text-zinc-900 shadow-geom-sm' : 'text-zinc-500 hover:text-zinc-900'}`}
          >
            Sign In
          </button>
          <button 
            type="button"
            onClick={() => { setIsRegistering(true); setError(null); }}
            className={`flex-1 py-1.5 text-[10px] font-extrabold uppercase tracking-wider rounded-sm transition-all cursor-pointer ${isRegistering ? 'bg-white text-zinc-900 shadow-geom-sm' : 'text-zinc-500 hover:text-zinc-900'}`}
          >
            Register Student
          </button>
        </div>

        {/* Primary Email Form */}
        <form onSubmit={handleEmailAuth} className="space-y-5">
          {isRegistering && (
            <div className="relative">
              <UserIcon className="absolute left-3 top-3 w-5 h-5 text-emerald-600" />
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name" 
                className="w-full pl-10 pr-4 py-3 bg-white border-2 border-slate-100 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium placeholder-slate-400"
                required
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-3 top-3 w-5 h-5 text-emerald-600" />
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address" 
              className="w-full pl-10 pr-4 py-3 bg-white border-2 border-slate-100 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium placeholder-slate-400"
              required
            />
          </div>

          <div className="relative">
            <Key className="absolute left-3 top-3 w-5 h-5 text-emerald-600" />
            <input 
              type={showPassword ? "text" : "password"}
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password" 
              className="w-full pl-10 pr-12 py-3 bg-white border-2 border-slate-100 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium placeholder-slate-400"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {/* Student preferences (ONLY on Registration) */}
          {isRegistering && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }} 
              className="space-y-4 pt-4 border-t border-geom-border"
            >
              {/* Select Entrance Exams */}
              <div>
                <span className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Select Entrance Exams</span>
                <div className="grid grid-cols-2 gap-2">
                  {entranceExams.map((exam) => {
                    const active = selectedEntrances.includes(exam.id);
                    return (
                      <button
                        type="button"
                        key={exam.id}
                        onClick={() => toggleExamSelection(exam.id, true)}
                        className={`flex items-center justify-between p-2.5 rounded-md border text-xs text-left font-bold transition-all cursor-pointer ${
                          active 
                            ? 'bg-zinc-900 border-zinc-950 text-white shadow-geom-sm' 
                            : 'bg-zinc-50 border-geom-border text-zinc-600 hover:bg-zinc-100'
                        }`}
                      >
                        {exam.name}
                        {active && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Select Competitive Exams */}
              <div>
                <span className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Select Competitive Exams</span>
                <div className="grid grid-cols-2 gap-2">
                  {competitiveExams.map((exam) => {
                    const active = selectedCompetitives.includes(exam.id);
                    return (
                      <button
                        type="button"
                        key={exam.id}
                        onClick={() => toggleExamSelection(exam.id, false)}
                        className={`flex items-center justify-between p-2.5 rounded-md border text-xs text-left font-bold transition-all cursor-pointer ${
                          active 
                            ? 'bg-zinc-900 border-zinc-950 text-white shadow-geom-sm' 
                            : 'bg-zinc-50 border-geom-border text-zinc-600 hover:bg-zinc-100'
                        }`}
                      >
                        {exam.name}
                        {active && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Only show student-type if entrance exams are selected */}
              {selectedEntrances.length > 0 && (
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Student Type</label>
                  <select
                    value={studentType}
                    onChange={(e) => setStudentType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-zinc-50 border border-geom-border rounded-md text-zinc-900 focus:outline-none focus:border-zinc-900 text-xs font-semibold"
                    required
                  >
                    <option value="">-- Select Student Type --</option>
                    <option value="first_year">Intermediate First Year</option>
                    <option value="second_year">Intermediate Second Year</option>
                    <option value="long_term">Long Term</option>
                  </select>
                </div>
              )}

              {/* Study Plan Selection */}
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Study Plan Option</label>
                <select
                  value={studyPlan}
                  onChange={(e) => setStudyPlan(e.target.value as any)}
                  className="w-full px-3 py-2 bg-zinc-50 border border-geom-border rounded-md text-zinc-900 focus:outline-none focus:border-zinc-900 text-xs font-semibold"
                  required
                >
                  <option value="">-- Select Study Plan --</option>
                  {selectedEntrances.length > 0 && studentType === 'first_year' && (
                    <>
                      <option value="quarterly">Quarterly</option>
                      <option value="half_yearly">Half-Yearly</option>
                      <option value="academic_year">Academic Year</option>
                    </>
                  )}
                  {selectedEntrances.length > 0 && studentType === 'second_year' && (
                    <>
                      <option value="quarterly">Quarterly</option>
                      <option value="half_yearly">Half-Yearly</option>
                      <option value="academic_year">Academic Year</option>
                    </>
                  )}
                  {studentType === 'long_term' && (
                    <option value="yearly">Yearly (Long Term)</option>
                  )}
                  {/* General defaults if none selected */}
                  {selectedEntrances.length === 0 && (
                    <>
                      <option value="quarterly">Quarterly</option>
                      <option value="half_yearly">Half-Yearly</option>
                      <option value="academic_year">Academic Year</option>
                      <option value="yearly">Yearly</option>
                    </>
                  )}
                </select>
              </div>
            </motion.div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold tracking-wide text-white bg-emerald-600 hover:bg-emerald-700 transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-emerald-500/30"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : isRegistering ? (
              <>
                <UserIcon className="w-5 h-5" />
                Complete Registration
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Sign In
              </>
            )}
          </button>
        </form>



      </div>
    </div>
  );
}
