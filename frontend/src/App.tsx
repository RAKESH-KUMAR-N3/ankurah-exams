import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import {
  fetchAdminDashboard, fetchStudentDashboard,
  fetchExams, fetchSubjects, fetchChapters, fetchQuestions,
  fetchTests, fetchStudyMaterials, fetchTimetables, fetchNotifications,
  fetchStudentList, fetchMyProfile
} from './lib/api';
import { User, EntranceExam, CompetitiveExam, Subject, Chapter, Question, Test, Timetable, StudyMaterial, TestAttempt, Announcement, Notification } from './types';
import Auth from './components/Auth';
import LandingPage from './components/LandingPage';
import StudentDashboard from './components/StudentDashboard';
import AnalyticsSection from './components/AnalyticsSection';
import TimetableSection from './components/TimetableSection';
import StudyMaterialSection from './components/StudyMaterialSection';
import TestSection from './components/TestSection';
import AdminManagement from './components/AdminManagement';
import AboutPage from './components/AboutPage';
import EntranceExamsPage from './components/EntranceExamsPage';
import CompetitiveExamsPage from './components/CompetitiveExamsPage';
import ContactPage from './components/ContactPage';
import logo from './assets/logo.png';
import {
  Sparkles, Award, Calendar, BookOpen, FileText, Shield,
  LogOut, Menu, X, Flame, TrendingUp, HelpCircle, Users, LayoutDashboard, Layers, Database, Bell, Layout
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getToken = () => localStorage.getItem('token');

// Map backend MongoDB doc to frontend User shape
const mapBackendUser = (data: any): User => ({
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
  createdAt: data.createdAt || new Date().toISOString(),
});

// Map backend Exam to frontend EntranceExam/CompetitiveExam shape
const mapExam = (e: any): EntranceExam => ({ id: e._id, name: e.name, description: '' });

// Map backend Subject to frontend Subject shape
const mapSubject = (s: any): Subject => ({
  id: s._id,
  name: s.name,
  examIds: s.examId ? [s.examId._id || s.examId] : [],
  description: '',
});

// Map backend Chapter to frontend Chapter
const mapChapter = (c: any): Chapter => ({
  id: c._id,
  subjectId: c.subjectId?._id || c.subjectId || '',
  name: c.title,
  description: '',
});

// Map backend Question to frontend Question
const mapQuestion = (q: any): Question => ({
  id: q._id,
  subjectId: q.subjectId || '',
  chapterId: q.chapterId || '',
  questionText: q.content,
  options: q.options || [],
  correctAnswerIndex: q.options ? q.options.indexOf(q.correctAnswer) : 0,
  explanation: q.explanation || '',
  difficulty: (q.difficulty?.toLowerCase() || 'medium') as 'easy' | 'medium' | 'hard',
  marks: q.marks || 1,
  negativeMarks: q.negativeMarks || 0,
});

// Map backend Test to frontend Test
const mapTest = (t: any): Test => ({
  id: t._id,
  title: t.title,
  description: t.instructions || '',
  type: (t.testType?.toLowerCase() || 'practice') as 'weekly' | 'monthly' | 'practice',
  duration: t.duration || 60,
  totalMarks: t.totalMarks || 0,
  negativeMarking: t.negativeMarking || false,
  isFullSyllabus: !t.subjectId,
  subjectId: t.subjectId?._id || t.subjectId,
  chapterId: t.chapterId?._id || t.chapterId,
  questionIds: t.questions || [],
  createdAt: t.createdAt || new Date().toISOString(),
});

// Map backend Timetable to frontend Timetable
const mapTimetable = (t: any): Timetable => ({
  id: t._id,
  examId: t.examId?._id || t.examId || '',
  studentType: t.studentTypeId || '',
  studyPlan: 'yearly',
  subjectId: t.subjectId?._id || t.subjectId || '',
  chapterId: t.chapterId?._id || t.chapterId || '',
  date: t.date ? new Date(t.date).toISOString().split('T')[0] : '',
  title: t.studyTopic,
  studyTopic: t.studyTopic,
  practiceMCQsCount: parseInt(t.practiceMCQs || '0', 10) || 0,
  revisionTopic: t.revision || '',
  assignment: t.assignment,
});

// Map backend StudyMaterial to frontend StudyMaterial
const mapMaterial = (m: any): StudyMaterial => ({
  id: m._id,
  examId: m.examId?._id || m.examId || '',
  subjectId: m.subjectId?._id || m.subjectId || '',
  chapterId: m.chapterId?._id || m.chapterId || '',
  type: (m.type === 'PDF' ? 'pdf' : m.type === 'Notes' ? 'notes' : m.type === 'Video URL' ? 'video' : 'link') as any,
  title: m.title,
  url: m.url,
  description: '',
});

// Map backend Notification to frontend Notification
const mapNotification = (n: any): Notification => ({
  id: n._id,
  userId: '',
  title: n.title,
  message: n.message,
  isRead: false,
  createdAt: n.createdAt || new Date().toISOString(),
});

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const navigate = useNavigate();
  const [authState, setAuthState] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // App-wide Academic Data
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
  const [studentsList, setStudentsList] = useState<User[]>([]);

  // Layout UI states
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ─── Check JWT on mount ──────────────────────────────────────────────────────
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setAuthState('unauthenticated');
      return;
    }
    // Validate token by fetching profile
    fetchMyProfile()
      .then((data: any) => {
        setCurrentUser(mapBackendUser(data));
        setAuthState('authenticated');
        if (data.role === 'admin') navigate('/dashboard/admin_dashboard');
        else navigate('/dashboard/dashboard');
      })
      .catch(() => {
        localStorage.removeItem('token');
        setAuthState('unauthenticated');
      });
  }, []);

  // ─── Load all data when authenticated ───────────────────────────────────────
  const loadAllData = useCallback(async (user: User) => {
    try {
      if (user.role === 'admin') {
        // Admin fetches all data
        const [examsRes, subjectsRes, chaptersRes, questionsRes, testsRes, materialsRes, timetablesRes, notifsRes, studentsRes] = await Promise.allSettled([
          fetchExams({ limit: '1000' }),
          fetchSubjects({ limit: '1000' }),
          fetchChapters({ limit: '1000' }),
          fetchQuestions({ limit: '1000' }),
          fetchTests({ limit: '1000' }),
          fetchStudyMaterials({ limit: '1000' }),
          fetchTimetables({ limit: '1000' }),
          fetchNotifications({ limit: '1000' }),
          fetchStudentList({ limit: '1000' }),
        ]);

        if (examsRes.status === 'fulfilled') {
          const all = examsRes.value?.data || [];
          setEntranceExams(all.map(mapExam));
          setCompetitiveExams(all.map(mapExam));
        }
        if (subjectsRes.status === 'fulfilled') setSubjects((subjectsRes.value?.data || []).map(mapSubject));
        if (chaptersRes.status === 'fulfilled') setChapters((chaptersRes.value?.data || []).map(mapChapter));
        if (questionsRes.status === 'fulfilled') setQuestions((questionsRes.value?.data || []).map(mapQuestion));
        if (testsRes.status === 'fulfilled') setTests((testsRes.value?.data || []).map(mapTest));
        if (materialsRes.status === 'fulfilled') setMaterials((materialsRes.value?.data || []).map(mapMaterial));
        if (timetablesRes.status === 'fulfilled') setTimetables((timetablesRes.value?.data || []).map(mapTimetable));
        if (notifsRes.status === 'fulfilled') setNotifications((notifsRes.value?.data || []).map(mapNotification));
        if (studentsRes.status === 'fulfilled') {
          const studs = (studentsRes.value?.data || []).map((u: any) => mapBackendUser(u));
          setStudentsList(studs);
        }
      } else {
        // Student fetches their personalized data
        const { fetchMySubjects, fetchMyChapters, fetchMyMaterials, fetchMyTimetables, fetchMyTests, fetchMyNotifications, fetchMyAttempts, fetchExams } = await import('./lib/api');
        const [examsRes, subjectsRes, chaptersRes, materialsRes, timetablesRes, testsRes, notifsRes] = await Promise.allSettled([
          fetchExams({ limit: '1000' }),
          fetchMySubjects(),
          fetchMyChapters(),
          fetchMyMaterials(),
          fetchMyTimetables(),
          fetchMyTests(),
          fetchMyNotifications(),
        ]);

        if (examsRes.status === 'fulfilled') {
          const all = examsRes.value?.data || [];
          setEntranceExams(all.map(mapExam));
          setCompetitiveExams(all.map(mapExam));
        }
        if (subjectsRes.status === 'fulfilled') setSubjects((subjectsRes.value || []).map(mapSubject));
        if (chaptersRes.status === 'fulfilled') setChapters((chaptersRes.value || []).map(mapChapter));
        if (materialsRes.status === 'fulfilled') setMaterials((materialsRes.value || []).map(mapMaterial));
        if (timetablesRes.status === 'fulfilled') setTimetables((timetablesRes.value || []).map(mapTimetable));
        if (testsRes.status === 'fulfilled') setTests((testsRes.value || []).map(mapTest));
        if (notifsRes.status === 'fulfilled') setNotifications((notifsRes.value || []).map(mapNotification));
      }
    } catch (err) {
      console.error('Data load error:', err);
    }
  }, []);

  useEffect(() => {
    if (authState === 'authenticated' && currentUser) {
      loadAllData(currentUser);
    }
  }, [authState, currentUser, loadAllData]);

  // ─── Auth handlers ───────────────────────────────────────────────────────────
  const handleAuthSuccess = (userData: User) => {
    setCurrentUser(userData);
    setAuthState('authenticated');
    if (userData.role === 'admin') navigate('/dashboard/admin_dashboard');
    else navigate('/dashboard/dashboard');
  };

  const handleSignOut = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
    setAuthState('unauthenticated');
    setEntranceExams([]);
    setCompetitiveExams([]);
    setSubjects([]);
    setChapters([]);
    setQuestions([]);
    setTests([]);
    setTimetables([]);
    setMaterials([]);
    setAttempts([]);
    setNotifications([]);
    setStudentsList([]);
    navigate('/');
  };

  const handleForceAdminReload = () => {
    if (currentUser) loadAllData(currentUser);
  };

  const location = useLocation();
  const pathParts = location.pathname.split('/');
  const activeTab = pathParts.length > 2 && pathParts[1] === 'dashboard' 
    ? pathParts[2] 
    : (currentUser?.role === 'admin' ? 'admin_dashboard' : 'dashboard');

  const handleTabChange = (tab: string) => {
    navigate(`/dashboard/${tab}`);
    setSidebarOpen(false);
  };

  // ─── Render active view ──────────────────────────────────────────────────────
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
            onNavigate={(tab) => handleTabChange(tab)}
            onAttemptTest={() => handleTabChange('tests')}
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
            onTestSubmitted={() => currentUser && loadAllData(currentUser)}
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
            onNavigate={(tab) => handleTabChange(tab)}
          />
        );
      case 'admin_dashboard':
      case 'admin_students':
      case 'admin_exams':
      case 'admin_subjects':
      case 'admin_questions':
      case 'admin_materials':
      case 'admin_timetables':
      case 'admin_tests':
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
            activeTab={activeTab.startsWith('admin_') ? activeTab.replace('admin_', '') : 'dashboard'}
          />
        );
      default:
        return <div className="text-slate-500">View not found.</div>;
    }
  };

  // ─── Loading screen ──────────────────────────────────────────────────────────
  if (authState === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-mono text-xs text-slate-400">Loading Academic Core Services...</p>
      </div>
    );
  }

  const authProps = {
    onAuthSuccess: handleAuthSuccess,
  };

  const isStudent = currentUser?.role === 'student';
  const isUserAdmin = currentUser?.role === 'admin';

  const DashboardShell = () => (
    <div className="min-h-screen flex bg-geom-bg text-slate-900 font-sans">

      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-950/20 backdrop-blur-xs z-30 lg:hidden"
        ></div>
      )}

      <aside className={`fixed lg:static top-0 bottom-0 left-0 w-64 bg-gradient-to-b from-emerald-900 via-emerald-950 to-slate-950 text-white z-40 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} transition-transform duration-200 ease-in-out border-r border-emerald-800/40 flex flex-col justify-between shrink-0`}>
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          <div className="flex items-center justify-center pb-6 border-b border-emerald-800/30 mt-2 mb-2 bg-white/95 shadow-[0_10px_25px_-5px_rgba(16,185,129,0.15)] rounded-2xl p-4 border border-emerald-500/20">
            <img src={logo} alt="Ankurah Exams" className="w-48 object-contain drop-shadow-sm" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          </div>

          <nav className="space-y-1 pt-2">
            {isStudent && (
              <>
                <button
                  onClick={() => handleTabChange('dashboard')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${activeTab === 'dashboard' ? 'bg-white text-emerald-900 shadow-[0_4px_12px_rgba(16,185,129,0.15)]' : 'text-emerald-100/80 hover:text-white hover:bg-white/10'}`}
                >
                  <Flame className={`w-4 h-4 ${activeTab === 'dashboard' ? 'text-emerald-600' : 'text-emerald-300'}`} /> Dashboard
                </button>
                <button
                  onClick={() => handleTabChange('timetable')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${activeTab === 'timetable' ? 'bg-white text-emerald-900 shadow-[0_4px_12px_rgba(16,185,129,0.15)]' : 'text-emerald-100/80 hover:text-white hover:bg-white/10'}`}
                >
                  <Calendar className={`w-4 h-4 ${activeTab === 'timetable' ? 'text-emerald-600' : 'text-emerald-300'}`} /> Study Timetable
                </button>
                <button
                  onClick={() => handleTabChange('study_materials')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${activeTab === 'study_materials' ? 'bg-white text-emerald-900 shadow-[0_4px_12px_rgba(16,185,129,0.15)]' : 'text-emerald-100/80 hover:text-white hover:bg-white/10'}`}
                >
                  <BookOpen className={`w-4 h-4 ${activeTab === 'study_materials' ? 'text-emerald-600' : 'text-emerald-300'}`} /> Study Materials
                </button>
                <button
                  onClick={() => handleTabChange('tests')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${activeTab === 'tests' ? 'bg-white text-emerald-900 shadow-[0_4px_12px_rgba(16,185,129,0.15)]' : 'text-emerald-100/80 hover:text-white hover:bg-white/10'}`}
                >
                  <FileText className={`w-4 h-4 ${activeTab === 'tests' ? 'text-emerald-600' : 'text-emerald-300'}`} /> Practice & Tests
                </button>
                <button
                  onClick={() => handleTabChange('analytics')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${activeTab === 'analytics' ? 'bg-white text-emerald-900 shadow-[0_4px_12px_rgba(16,185,129,0.15)]' : 'text-emerald-100/80 hover:text-white hover:bg-white/10'}`}
                >
                  <TrendingUp className={`w-4 h-4 ${activeTab === 'analytics' ? 'text-emerald-600' : 'text-emerald-300'}`} /> Deep Analytics
                </button>
              </>
            )}

            {isUserAdmin && (
              <div className="space-y-1">
                <div className="px-4 py-2 text-xs font-bold text-emerald-200/50 uppercase tracking-wider mb-2">Admin Menu</div>
                {[
                  { id: 'admin_dashboard', label: 'Dashboard Overview', icon: Flame, color: 'text-emerald-300' },
                  { id: 'admin_students', label: 'Students', icon: Users, color: 'text-emerald-350' },
                  { id: 'admin_exams', label: 'Exams', icon: Award, color: 'text-emerald-300' },
                  { id: 'admin_subjects', label: 'Subjects & Chapters', icon: Layers, color: 'text-emerald-300' },
                  { id: 'admin_questions', label: 'Question Bank', icon: Database, color: 'text-emerald-300' },
                  { id: 'admin_materials', label: 'Study Material', icon: BookOpen, color: 'text-emerald-300' },
                  { id: 'admin_timetables', label: 'Timetable', icon: Calendar, color: 'text-emerald-300' },
                  { id: 'admin_tests', label: 'Test Configurator', icon: LayoutDashboard, color: 'text-emerald-300' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${activeTab === item.id ? 'bg-white text-emerald-900 shadow-xs' : 'text-emerald-100/80 hover:text-white hover:bg-white/10'}`}
                  >
                    <item.icon className={`w-4 h-4 ${activeTab === item.id ? 'text-emerald-600' : 'text-emerald-300'}`} /> {item.label}
                  </button>
                ))}
              </div>
            )}
          </nav>
        </div>

        <div className="p-6 border-t border-emerald-800/30 shrink-0 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-emerald-800 border border-emerald-700/50 text-emerald-100 flex items-center justify-center font-bold text-xs uppercase shrink-0">
              {currentUser?.name?.substring(0, 2)}
            </div>
            <div className="min-w-0">
              <span className="font-bold text-xs text-emerald-50 block truncate leading-tight">{currentUser?.name}</span>
              <span className="text-[10px] text-emerald-300/60 block capitalize">{currentUser?.role} Account</span>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-emerald-800/30 hover:border-emerald-700/60 bg-emerald-950/40 text-emerald-250 hover:text-white text-xs font-bold transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 max-h-screen overflow-hidden">
        <header className="bg-white border-b border-slate-200/80 px-6 py-4 flex items-center justify-between shrink-0 relative z-20 shadow-xs">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-500 hover:text-slate-900 cursor-pointer"
            >
              <Menu className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-sm font-black text-slate-900 tracking-tight ml-2 lg:ml-0">
                {isStudent ? 'Academic Preparation Track' : 'Administrative Operations Panel'}
              </h1>
              <p className="text-[10px] font-bold text-emerald-600 tracking-wider uppercase ml-2 lg:ml-0 mt-0.5">
                {isStudent ? `Plan: ${currentUser?.studentType?.replace('_', ' ')}` : 'Full System Control'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {isUserAdmin && <span className="px-3.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-full hidden sm:block">SYSTEM ADMIN</span>}
            {isStudent && (
              <div className="flex items-center gap-1.5 py-1.5 px-3.5 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-200 shadow-xs">
                <Flame className="w-4 h-4 text-emerald-600 fill-emerald-50" />
                Streak: {currentUser?.streak || 1} Days
              </div>
            )}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center text-xs font-black uppercase shrink-0 shadow-xs">
              {currentUser?.name?.substring(0, 2)}
            </div>
          </div>
        </header>

        <main className="flex-grow overflow-y-auto p-6 md:p-8 max-w-7xl w-full mx-auto geom-grid-pattern">
          {renderActiveView()}
        </main>
      </div>

    </div>
  );

  return (
    <>
      <ScrollToTop />
      <Routes>
      <Route
        path="/"
        element={(authState === 'authenticated' && currentUser) ? <Navigate to="/dashboard" replace /> : <LandingPage />}
      />
      <Route
        path="/about"
        element={<AboutPage />}
      />
      <Route
        path="/entrance-exams"
        element={<EntranceExamsPage />}
      />
      <Route
        path="/competitive-exams"
        element={<CompetitiveExamsPage />}
      />
      <Route
        path="/contact"
        element={<ContactPage />}
      />
      <Route
        path="/login"
        element={(authState === 'authenticated' && currentUser) ? <Navigate to="/dashboard" replace /> : <Auth onAuthSuccess={handleAuthSuccess} initialMode="login" />}
      />
      <Route
        path="/register"
        element={(authState === 'authenticated' && currentUser) ? <Navigate to="/dashboard" replace /> : <Auth onAuthSuccess={handleAuthSuccess} initialMode="register" />}
      />
      <Route
        path="/dashboard/*"
        element={(authState === 'unauthenticated' || !currentUser) ? <Navigate to="/login" replace /> : <DashboardShell />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
}

// scroll reset helper
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
