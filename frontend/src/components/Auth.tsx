import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  signOut 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';
import { User, EntranceExam, CompetitiveExam } from '../types';
import { Sparkles, Shield, User as UserIcon, LogIn, Key, Mail, Check, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface AuthProps {
  entranceExams: EntranceExam[];
  competitiveExams: CompetitiveExam[];
  onAuthSuccess: (user: User) => void;
}

export default function Auth({ entranceExams, competitiveExams, onAuthSuccess }: AuthProps) {
  const [isRegistering, setIsRegistering] = useState(false);
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
  const [authInstructions, setAuthInstructions] = useState(false);

  const handleFetchUserProfile = async (uid: string, fallbackEmail: string, fallbackName: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        onAuthSuccess(userData);
      } else {
        // Create student profile if not exists
        const newUser: User = {
          uid,
          name: fallbackName || 'Student Account',
          email: fallbackEmail,
          role: 'student',
          selectedEntranceExams: selectedEntrances,
          selectedCompetitiveExams: selectedCompetitives,
          studentType: studentType || 'long_term',
          studyPlan: studyPlan || 'yearly',
          streak: 1,
          lastActiveDate: new Date().toISOString(),
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'users', uid), newUser);
        onAuthSuccess(newUser);
      }
    } catch (err: any) {
      console.error("Error reading or writing user profile:", err);
      setError(err.message || "Failed to set up user profile.");
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!email || !password) {
      setError("Please fill in all fields.");
      setLoading(false);
      return;
    }

    try {
      if (isRegistering) {
        if (!name) {
          setError("Name is required during registration.");
          setLoading(false);
          return;
        }
        if (selectedEntrances.length === 0 && selectedCompetitives.length === 0) {
          setError("Please select at least one Entrance or Competitive Exam.");
          setLoading(false);
          return;
        }
        
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        const newUser: User = {
          uid: credential.user.uid,
          name,
          email,
          role: 'student',
          selectedEntranceExams: selectedEntrances,
          selectedCompetitiveExams: selectedCompetitives,
          studentType: selectedEntrances.length > 0 ? (studentType || 'long_term') : '',
          studyPlan: studyPlan || 'yearly',
          streak: 1,
          lastActiveDate: new Date().toISOString(),
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'users', credential.user.uid), newUser);
        onAuthSuccess(newUser);
      } else {
        const credential = await signInWithEmailAndPassword(auth, email, password);
        await handleFetchUserProfile(credential.user.uid, credential.user.email || email, '');
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/operation-not-allowed') {
        setError("Email/Password Auth is not enabled yet in your Firebase console. Go to Auth > Sign-in method and enable it. Or use the Instant Developer Bypass login below!");
        setAuthInstructions(true);
      } else {
        setError(err.message || "An authentication error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await handleFetchUserProfile(
        result.user.uid, 
        result.user.email || '', 
        result.user.displayName || 'Google User'
      );
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Google Sign-In failed.");
    } finally {
      setLoading(false);
    }
  };

  // Developer Fast Access Bypass for testing / evaluation
  const handleFastBypass = async (role: 'student' | 'admin') => {
    setError(null);
    setLoading(true);
    // Use a deterministic UID for developer bypass, or a unique ID based on role
    const mockUid = role === 'admin' ? 'bypass-admin-id' : 'bypass-student-id';
    const mockEmail = role === 'admin' ? 'nrakeshkumar36@gmail.com' : 'student.demo@ankurah.com';
    const mockName = role === 'admin' ? 'Admin Developer' : 'Ankurah Student';

    try {
      // Look up if user exists in Firestore
      const userRef = doc(db, 'users', mockUid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        onAuthSuccess(userDoc.data() as User);
      } else {
        // Create full user object
        const bypassUser: User = {
          uid: mockUid,
          name: mockName,
          email: mockEmail,
          role,
          selectedEntranceExams: role === 'student' ? ['jee-main', 'neet'] : [],
          selectedCompetitiveExams: role === 'student' ? ['upsc-civils'] : [],
          studentType: role === 'student' ? 'long_term' : '',
          studyPlan: role === 'student' ? 'yearly' : '',
          streak: 5,
          lastActiveDate: new Date().toISOString(),
          createdAt: new Date().toISOString()
        };
        await setDoc(userRef, bypassUser);
        onAuthSuccess(bypassUser);
      }
    } catch (err: any) {
      console.error("Bypass login failed, falling back to local simulation:", err);
      // Fallback local memory login if connection or security rules are offline
      onAuthSuccess({
        uid: mockUid,
        name: mockName,
        email: mockEmail,
        role,
        selectedEntranceExams: role === 'student' ? ['jee-main', 'neet'] : [],
        selectedCompetitiveExams: role === 'student' ? ['upsc-civils'] : [],
        studentType: role === 'student' ? 'long_term' : '',
        studyPlan: role === 'student' ? 'yearly' : '',
        streak: 5,
        lastActiveDate: new Date().toISOString(),
        createdAt: new Date().toISOString()
      });
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

        {authInstructions && (
          <div className="p-4 rounded-md bg-zinc-50 border border-geom-border text-zinc-800 text-[11px] leading-relaxed space-y-2 font-medium">
            <p className="font-bold text-zinc-900 uppercase tracking-wider text-[10px]">Firebase Setup Helper:</p>
            <p>1. Open your Firebase Console at <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="underline font-bold">console.firebase.google.com</a>.</p>
            <p>2. Navigate to <strong>Authentication</strong> &gt; <strong>Sign-in method</strong>.</p>
            <p>3. Enable <strong>Email/Password</strong> provider.</p>
            <p>4. Or use Google Sign-in or the <strong>Instant Developer Access</strong> buttons below for direct testing.</p>
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
        <form onSubmit={handleEmailAuth} className="space-y-4">
          {isRegistering && (
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Full Name</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe" 
                  className="w-full px-3 py-2.5 bg-zinc-50 border border-geom-border rounded-md text-zinc-900 focus:outline-none focus:border-zinc-900 focus:bg-white transition-all text-xs font-semibold"
                  required
                />
                <UserIcon className="absolute right-3 top-3 w-4 h-4 text-zinc-400" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Email Address</label>
            <div className="relative">
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                placeholder="developer@ankurah.com" 
                className="w-full px-3 py-2.5 bg-zinc-50 border border-geom-border rounded-md text-zinc-900 focus:outline-none focus:border-zinc-900 focus:bg-white transition-all text-xs font-semibold"
                required
              />
              <Mail className="absolute right-3 top-3 w-4 h-4 text-zinc-400" />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Password</label>
            <div className="relative">
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                className="w-full px-3 py-2.5 bg-zinc-50 border border-geom-border rounded-md text-zinc-900 focus:outline-none focus:border-zinc-900 focus:bg-white transition-all text-xs font-semibold"
                required
              />
              <Key className="absolute right-3 top-3 w-4 h-4 text-zinc-400" />
            </div>
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
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-sm text-xs font-bold uppercase tracking-wider text-white bg-zinc-900 hover:bg-zinc-850 transition-all disabled:opacity-50 cursor-pointer shadow-geom border border-zinc-900"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : isRegistering ? (
              <>
                <UserIcon className="w-4 h-4" />
                Complete Registration
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Sign In with Password
              </>
            )}
          </button>
        </form>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-geom-border"></div>
          <span className="flex-shrink mx-4 text-zinc-400 text-[9px] font-bold uppercase tracking-wider">Or Continue With</span>
          <div className="flex-grow border-t border-geom-border"></div>
        </div>

        {/* Google sign-in */}
        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-sm border border-geom-border bg-white hover:bg-zinc-50 font-bold text-zinc-700 text-xs uppercase tracking-wider transition-all cursor-pointer shadow-geom-sm"
        >
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.61c-.29 1.5-.14 3.01-.84 4.02l3.41 2.64c2-1.84 3.56-4.55 3.56-8.51z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.41-2.64c-.9.6-2.11.95-3.55.95-3.08 0-5.7-2.08-6.63-4.88L2.87 18.06c2 3.97 6.11 6.64 10.13 6.64z"
            />
            <path
              fill="#FBBC05"
              d="M5.37 14.52a7.17 7.17 0 0 1 0-4.52l-3.5-2.72c-1.15 2.29-1.87 4.96-1.87 7.74s.72 5.45 1.87 7.74l3.5-2.74z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.96 1.19 15.24 0 12 0 7.97 0 3.86 2.67 1.87 6.64l3.5 2.72c.93-2.8 3.55-4.88 6.63-4.88z"
            />
          </svg>
          Google Cloud Identity
        </button>

        {/* Developer Bypass Area (Highly styled and helpful) */}
        <div className="pt-4 border-t border-geom-border mt-6">
          <div className="flex items-center gap-1.5 justify-center text-zinc-400 text-[10px] mb-3 font-bold uppercase tracking-wider">
            <Shield className="w-3.5 h-3.5 text-zinc-800" />
            Instant Developer Bypass Access
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleFastBypass('admin')}
              className="py-2.5 px-3 rounded-md border border-geom-border bg-zinc-50 hover:bg-zinc-100 text-zinc-800 font-bold text-xs transition-all flex flex-col items-center justify-center gap-1 cursor-pointer shadow-geom-sm"
            >
              <Shield className="w-4 h-4 text-zinc-850" />
              <span>Login as Admin</span>
              <span className="text-[9px] font-normal text-zinc-500 block">nrakeshkumar36@gmail.com</span>
            </button>
            <button
              type="button"
              onClick={() => handleFastBypass('student')}
              className="py-2.5 px-3 rounded-md border border-geom-border bg-zinc-50 hover:bg-zinc-100 text-zinc-800 font-bold text-xs transition-all flex flex-col items-center justify-center gap-1 cursor-pointer shadow-geom-sm"
            >
              <UserIcon className="w-4 h-4 text-zinc-800" />
              <span>Login as Student</span>
              <span className="text-[9px] font-normal text-zinc-500 block">student.demo@ankurah.com</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
