import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
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
import {
  Sparkles, Award, Calendar, BookOpen, FileText, Shield,
  LogOut, Menu, X, Flame, TrendingUp, HelpCircle
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
  const [activeTab, setActiveTab] = useState<string>('dashboard');
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
        if (data.role === 'admin') setActiveTab('admin_panel');
        else setActiveTab('dashboard');
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
    if (userData.role === 'admin') setActiveTab('admin_panel');
    else setActiveTab('dashboard');
    navigate('/dashboard');
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
            onNavigate={(tab) => setActiveTab(tab)}
            onAttemptTest={() => setActiveTab('tests')}
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
    entranceExams: entranceExams.length > 0 ? entranceExams : [
      { id: 'tg-eapcet', name: 'TG EAPCET', description: '' },
      { id: 'ap-eapcet', name: 'AP EAPCET', description: '' },
      { id: 'neet', name: 'NEET', description: '' },
      { id: 'jee-main', name: 'JEE Main', description: '' },
      { id: 'jee-advanced', name: 'JEE Advanced', description: '' },
    ],
    competitiveExams: competitiveExams.length > 0 ? competitiveExams : [
      { id: 'upsc-civils', name: 'Civil Services (UPSC)', description: '' },
      { id: 'ssc-cgl', name: 'SSC CGL', description: '' },
    ],
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

      <aside className={`fixed lg:static top-0 bottom-0 left-0 w-64 bg-geom-dark text-white z-40 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-x lg:translate-x-0'} transition-transform duration-200 ease-in-out border-r border-zinc-800 flex flex-col justify-between shrink-0 geom-grid-pattern-dark`}>
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-zinc-800">
            <div className="w-9 h-9 rounded-md bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight block">Ankurah Exams</span>
              <span className="text-[10px] text-zinc-500 font-semibold block uppercase tracking-wider">Academic Core</span>
            </div>
          </div>

          <nav className="space-y-1 pt-2">
            {isStudent && (
              <>
                <button
                  onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${activeTab === 'dashboard' ? 'bg-zinc-800 text-white shadow-xs' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'}`}
                >
                  <Flame className="w-4 h-4 text-emerald-500" /> Dashboard
                </button>
                <button
                  onClick={() => { setActiveTab('timetable'); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${activeTab === 'timetable' ? 'bg-zinc-800 text-white shadow-xs' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'}`}
                >
                  <Calendar className="w-4 h-4 text-blue-500" /> Study Timetable
                </button>
                <button
                  onClick={() => { setActiveTab('study_materials'); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${activeTab === 'study_materials' ? 'bg-zinc-800 text-white shadow-xs' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'}`}
                >
                  <BookOpen className="w-4 h-4 text-purple-500" /> Study Materials
                </button>
                <button
                  onClick={() => { setActiveTab('tests'); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${activeTab === 'tests' ? 'bg-zinc-800 text-white shadow-xs' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'}`}
                >
                  <FileText className="w-4 h-4 text-amber-500" /> Practice & Tests
                </button>
                <button
                  onClick={() => { setActiveTab('analytics'); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${activeTab === 'analytics' ? 'bg-zinc-800 text-white shadow-xs' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'}`}
                >
                  <TrendingUp className="w-4 h-4 text-indigo-500" /> Deep Analytics
                </button>
              </>
            )}

            {isUserAdmin && (
              <button
                onClick={() => { setActiveTab('admin_panel'); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${activeTab === 'admin_panel' ? 'bg-zinc-800 text-white shadow-xs' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'}`}
              >
                <Shield className="w-4 h-4 text-rose-500" /> Admin Control
              </button>
            )}
          </nav>
        </div>

        <div className="p-6 border-t border-zinc-800 shrink-0 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-300 flex items-center justify-center font-bold text-xs uppercase shrink-0">
              {currentUser?.name.substring(0, 2)}
            </div>
            <div className="min-w-0">
              <span className="font-bold text-xs text-zinc-200 block truncate leading-tight">{currentUser?.name}</span>
              <span className="text-[10px] text-zinc-500 block capitalize">{currentUser?.role} Account</span>
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

      <div className="flex-grow flex flex-col min-w-0 min-h-screen">
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
                Streak: {currentUser?.streak || 1} Days
              </div>
            )}
            <div className="w-8 h-8 rounded-md bg-zinc-100 border border-geom-border flex items-center justify-center text-xs font-bold text-zinc-700 uppercase shrink-0">
              {currentUser?.name.substring(0, 2)}
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
    <Routes>
      <Route
        path="/"
        element={(authState === 'authenticated' && currentUser) ? <Navigate to="/dashboard" replace /> : <LandingPage />}
      />
      <Route
        path="/login"
        element={(authState === 'authenticated' && currentUser) ? <Navigate to="/dashboard" replace /> : <Auth {...authProps} initialMode="login" />}
      />
      <Route
        path="/register"
        element={(authState === 'authenticated' && currentUser) ? <Navigate to="/dashboard" replace /> : <Auth {...authProps} initialMode="register" />}
      />
      <Route
        path="/dashboard"
        element={(authState === 'unauthenticated' || !currentUser) ? <Navigate to="/login" replace /> : <DashboardShell />}
      />
      <Route path="/about" element={<div className="min-h-screen bg-slate-50 flex items-center justify-center text-2xl font-bold text-slate-700">About Page (Under Construction)</div>} />
      <Route path="/exams" element={<div className="min-h-screen bg-slate-50 flex items-center justify-center text-2xl font-bold text-slate-700">Exams Page (Under Construction)</div>} />
      <Route path="/features" element={<div className="min-h-screen bg-slate-50 flex items-center justify-center text-2xl font-bold text-slate-700">Features Page (Under Construction)</div>} />
      <Route path="/contact" element={<div className="min-h-screen bg-slate-50 flex items-center justify-center text-2xl font-bold text-slate-700">Contact Page (Under Construction)</div>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
