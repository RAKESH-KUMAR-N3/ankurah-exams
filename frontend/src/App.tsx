import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { User, EntranceExam, CompetitiveExam, Subject, Chapter, Question, Test, Timetable, StudyMaterial, TestAttempt, Announcement, Notification } from './types';
import { seedDatabaseIfEmpty } from './lib/defaultData';
import Auth from './components/Auth';
import StudentDashboard from './components/StudentDashboard';
import AnalyticsSection from './components/AnalyticsSection';
import TimetableSection from './components/TimetableSection';
import StudyMaterialSection from './components/StudyMaterialSection';
import TestSection from './components/TestSection';
import AdminManagement from './components/AdminManagement';
import { 
  Sparkles, Award, Calendar, BookOpen, FileText, Shield, 
  LogOut, Menu, X, Flame, TrendingUp, HelpCircle 
} from 'lucide-react';

export default function App() {
  const [authState, setAuthState] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // App-wide Academic Data (Live synced from Firestore)
  const [entranceExams, setEntranceExams] = useState<EntranceExam[]>([]);
  const [competitiveExams, setCompetitiveExams] = useState<CompetitiveExam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [attempts, setAttempts] = useState<TestAttempt[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Admin-only metrics
  const [studentsList, setStudentsList] = useState<User[]>([]);

  // Layout UI states
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // 1. Initial database seeding & global authentication state listener
  useEffect(() => {
    // Run automated seeding first if empty
    seedDatabaseIfEmpty();

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Authenticated
        // Get user profile detail from Firestore
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userSnapshot = await getDoc(userDocRef);

        if (userSnapshot.exists()) {
          const userData = userSnapshot.data() as User;
          setCurrentUser(userData);
          setAuthState('authenticated');
          
          // Set appropriate initial tab based on role
          if (userData.role === 'admin') {
            setActiveTab('admin_panel');
          } else {
            setActiveTab('dashboard');
          }
        } else {
          // If Firestore is slow or mapping didn't complete, try bypass/Google defaults
          const defaultUser: User = {
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || 'Ankurah Scholar',
            email: firebaseUser.email || '',
            role: 'student',
            selectedEntranceExams: ['jee-main', 'neet'],
            selectedCompetitiveExams: [],
            studentType: 'long_term',
            studyPlan: 'yearly',
            streak: 1,
            lastActiveDate: new Date().toISOString(),
            createdAt: new Date().toISOString()
          };
          setCurrentUser(defaultUser);
          setAuthState('authenticated');
          setActiveTab('dashboard');
        }
      } else {
        // Logged out
        setCurrentUser(null);
        setAuthState('unauthenticated');
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // 2. Setup onSnapshot dynamic database synchronizations ONLY if authenticated
  useEffect(() => {
    if (authState !== 'authenticated' || !currentUser) return;

    // Define subscriptions
    const unsubEntrance = onSnapshot(collection(db, 'entranceExams'), (snap) => {
      const exams: EntranceExam[] = [];
      snap.forEach(doc => exams.push(doc.data() as EntranceExam));
      setEntranceExams(exams);
    });

    const unsubCompetitive = onSnapshot(collection(db, 'competitiveExams'), (snap) => {
      const exams: CompetitiveExam[] = [];
      snap.forEach(doc => exams.push(doc.data() as CompetitiveExam));
      setCompetitiveExams(exams);
    });

    const unsubSubjects = onSnapshot(collection(db, 'subjects'), (snap) => {
      const subs: Subject[] = [];
      snap.forEach(doc => subs.push(doc.data() as Subject));
      setSubjects(subs);
    });

    const unsubChapters = onSnapshot(collection(db, 'chapters'), (snap) => {
      const chs: Chapter[] = [];
      snap.forEach(doc => chs.push(doc.data() as Chapter));
      setChapters(chs);
    });

    const unsubQuestions = onSnapshot(collection(db, 'questions'), (snap) => {
      const qs: Question[] = [];
      snap.forEach(doc => qs.push(doc.data() as Question));
      setQuestions(qs);
    });

    const unsubTests = onSnapshot(collection(db, 'tests'), (snap) => {
      const ts: Test[] = [];
      snap.forEach(doc => ts.push(doc.data() as Test));
      setTests(ts);
    });

    const unsubTimetables = onSnapshot(collection(db, 'timetables'), (snap) => {
      const tts: Timetable[] = [];
      snap.forEach(doc => tts.push(doc.data() as Timetable));
      setTimetables(tts);
    });

    const unsubMaterials = onSnapshot(collection(db, 'studyMaterials'), (snap) => {
      const mats: StudyMaterial[] = [];
      snap.forEach(doc => mats.push(doc.data() as StudyMaterial));
      setMaterials(mats);
    });

    // Sync attempts (students only see their own, admins see all)
    const unsubAttempts = onSnapshot(collection(db, 'testAttempts'), (snap) => {
      const atts: TestAttempt[] = [];
      snap.forEach(doc => {
        const attempt = doc.data() as TestAttempt;
        if (currentUser.role === 'admin' || attempt.userId === currentUser.uid) {
          atts.push(attempt);
        }
      });
      setAttempts(atts);
    });

    const unsubAnnouncements = onSnapshot(collection(db, 'announcements'), (snap) => {
      const anns: Announcement[] = [];
      snap.forEach(doc => anns.push(doc.data() as Announcement));
      anns.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setAnnouncements(anns);
    });

    const unsubNotifications = onSnapshot(collection(db, 'notifications'), (snap) => {
      const nots: Notification[] = [];
      snap.forEach(doc => nots.push(doc.data() as Notification));
      nots.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setNotifications(nots);
    });

    // Admin specific listener for students list
    let unsubUsers = () => {};
    if (currentUser.role === 'admin') {
      unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
        const list: User[] = [];
        snap.forEach(doc => {
          const u = doc.data() as User;
          if (u.role === 'student') {
            list.push(u);
          }
        });
        setStudentsList(list);
      });
    }

    // Clean up connections on unmount/logout
    return () => {
      unsubEntrance();
      unsubCompetitive();
      unsubSubjects();
      unsubChapters();
      unsubQuestions();
      unsubTests();
      unsubTimetables();
      unsubMaterials();
      unsubAttempts();
      unsubAnnouncements();
      unsubNotifications();
      unsubUsers();
    };
  }, [authState, currentUser]);

  const handleAuthSuccess = (userData: User) => {
    setCurrentUser(userData);
    setAuthState('authenticated');
    if (userData.role === 'admin') {
      setActiveTab('admin_panel');
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setAuthState('unauthenticated');
      setCurrentUser(null);
    } catch (err) {
      console.error("Sign-out error:", err);
    }
  };

  // Force sync / reload action triggered by admin
  const handleForceAdminReload = () => {
    onSnapshot(collection(db, 'users'), (snap) => {
      const list: User[] = [];
      snap.forEach(doc => {
        const u = doc.data() as User;
        if (u.role === 'student') list.push(u);
      });
      setStudentsList(list);
    });
  };

  // Render view controller based on tab selection
  const renderActiveView = () => {
    if (!currentUser) return null;

    switch (activeTab) {
      case 'dashboard':
        return (
          <StudentDashboard 
            user={currentUser}
            timetables={timetables}
            availableTests={tests}
            attempts={attempts}
            subjects={subjects}
            announcements={announcements}
            notifications={notifications}
            onNavigate={(tab) => setActiveTab(tab)}
            onAttemptTest={(test) => {
              setActiveTab('tests');
              // TestSection internal state is managed by its own props
            }}
          />
        );
      case 'timetable':
        return (
          <TimetableSection 
            user={currentUser}
            timetables={timetables}
            subjects={subjects}
            chapters={chapters}
          />
        );
      case 'study_materials':
        return (
          <StudyMaterialSection 
            user={currentUser}
            materials={materials}
            subjects={subjects}
            chapters={chapters}
          />
        );
      case 'tests':
        return (
          <TestSection 
            user={currentUser}
            tests={tests}
            questions={questions}
            attempts={attempts}
            subjects={subjects}
            onTestSubmitted={() => {}} // Dynamic refresh handled via onSnapshot
          />
        );
      case 'analytics':
        return (
          <AnalyticsSection 
            user={currentUser}
            attempts={attempts}
            tests={tests}
            subjects={subjects}
            chapters={chapters}
            questions={questions}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        );
      case 'admin_panel':
        if (currentUser.role !== 'admin') {
          return <div className="text-red-600 font-bold">Unauthorized. Access Restricted to Admin.</div>;
        }
        return (
          <AdminManagement 
            user={currentUser}
            students={studentsList}
            entranceExams={entranceExams}
            competitiveExams={competitiveExams}
            subjects={subjects}
            chapters={chapters}
            questions={questions}
            tests={tests}
            timetables={timetables}
            materials={materials}
            announcements={announcements}
            onRefresh={handleForceAdminReload}
          />
        );
      default:
        return <div className="text-slate-500">View not found.</div>;
    }
  };

  // --- VISUAL LAYOUTS ---

  // 1. Loading screen
  if (authState === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-mono text-xs text-slate-400">Loading Academic Core Services...</p>
      </div>
    );
  }

  // 2. Unauthenticated registration/login screen
  if (authState === 'unauthenticated' || !currentUser) {
    return (
      <Auth 
        entranceExams={entranceExams.length > 0 ? entranceExams : [
          { id: 'tg-eapcet', name: 'TG EAPCET', description: '' },
          { id: 'ap-eapcet', name: 'AP EAPCET', description: '' },
          { id: 'neet', name: 'NEET', description: '' },
          { id: 'jee-main', name: 'JEE Main', description: '' },
          { id: 'jee-advanced', name: 'JEE Advanced', description: '' }
        ]}
        competitiveExams={competitiveExams.length > 0 ? competitiveExams : [
          { id: 'upsc-civils', name: 'Civil Services (UPSC)', description: '' },
          { id: 'ssc-cgl', name: 'SSC CGL', description: '' }
        ]}
        onAuthSuccess={handleAuthSuccess}
      />
    );
  }

  // 3. Fully logged-in dynamic Dashboard Shell (Student/Admin Layout)
  const isStudent = currentUser.role === 'student';
  const isUserAdmin = currentUser.role === 'admin';

  return (
    <div className="min-h-screen flex bg-geom-bg text-slate-900 font-sans">
      
      {/* Mobile Sidebar overlay Toggle */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-950/20 backdrop-blur-xs z-30 lg:hidden"
        ></div>
      )}

      {/* Sidebar navigation panel */}
      <aside className={`fixed lg:static top-0 bottom-0 left-0 w-64 bg-geom-dark text-white z-40 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-x lg:translate-x-0'} transition-transform duration-200 ease-in-out border-r border-zinc-800 flex flex-col justify-between shrink-0 geom-grid-pattern-dark`}>
        <div className="p-6 space-y-6">
          
          {/* Logo / Title */}
          <div className="flex items-center gap-3 pb-4 border-b border-zinc-800">
            <div className="w-9 h-9 rounded-md bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight block">Ankurah Exams</span>
              <span className="text-[10px] text-zinc-500 font-semibold block uppercase tracking-wider">Academic Core</span>
            </div>
          </div>

          {/* Nav Items list */}
          <nav className="space-y-1 pt-2">
            {isStudent && (
              <>
                <button
                  onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'dashboard' ? 'bg-zinc-800 text-white shadow-xs' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                  }`}
                >
                  <Flame className="w-4 h-4 text-emerald-500" /> Dashboard
                </button>
                <button
                  onClick={() => { setActiveTab('timetable'); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'timetable' ? 'bg-zinc-800 text-white shadow-xs' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                  }`}
                >
                  <Calendar className="w-4 h-4 text-blue-500" /> Study Timetable
                </button>
                <button
                  onClick={() => { setActiveTab('study_materials'); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'study_materials' ? 'bg-zinc-800 text-white shadow-xs' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                  }`}
                >
                  <BookOpen className="w-4 h-4 text-purple-500" /> Study Materials
                </button>
                <button
                  onClick={() => { setActiveTab('tests'); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'tests' ? 'bg-zinc-800 text-white shadow-xs' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                  }`}
                >
                  <FileText className="w-4 h-4 text-amber-500" /> Practice & Tests
                </button>
                <button
                  onClick={() => { setActiveTab('analytics'); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'analytics' ? 'bg-zinc-800 text-white shadow-xs' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                  }`}
                >
                  <TrendingUp className="w-4 h-4 text-indigo-500" /> Deep Analytics
                </button>
              </>
            )}

            {isUserAdmin && (
              <button
                onClick={() => { setActiveTab('admin_panel'); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'admin_panel' ? 'bg-zinc-800 text-white shadow-xs' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <Shield className="w-4 h-4 text-rose-500" /> Admin Control
              </button>
            )}
          </nav>
        </div>

        {/* User profile bottom bar */}
        <div className="p-6 border-t border-zinc-800 shrink-0 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-300 flex items-center justify-center font-bold text-xs uppercase shrink-0">
              {currentUser.name.substring(0, 2)}
            </div>
            <div className="min-w-0">
              <span className="font-bold text-xs text-zinc-200 block truncate leading-tight">{currentUser.name}</span>
              <span className="text-[10px] text-zinc-500 block capitalize">{currentUser.role} Account</span>
            </div>
          </div>
          
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-md border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-white text-xs font-semibold transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Layout body */}
      <div className="flex-grow flex flex-col min-w-0 min-h-screen">
        {/* Top Header */}
        <header className="h-16 px-6 bg-white border-b border-geom-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-500 hover:text-slate-900 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider hidden sm:inline">
              Preparation Track: {isStudent ? 'Entrance & Competitive Focus' : 'System Administration'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {isStudent && (
              <div className="flex items-center gap-1.5 py-1 px-3 bg-white text-emerald-800 text-xs font-semibold rounded-md border border-geom-border shadow-geom-sm">
                <Flame className="w-4 h-4 text-emerald-600 fill-emerald-50" />
                Streak: {currentUser.streak || 1} Days
              </div>
            )}
            <div className="w-8 h-8 rounded-md bg-zinc-100 border border-geom-border flex items-center justify-center text-xs font-bold text-zinc-700 uppercase shrink-0">
              {currentUser.name.substring(0, 2)}
            </div>
          </div>
        </header>

        {/* Major Scrollable Section */}
        <main className="flex-grow overflow-y-auto p-6 md:p-8 max-w-7xl w-full mx-auto geom-grid-pattern">
          {renderActiveView()}
        </main>
      </div>

    </div>
  );
}
