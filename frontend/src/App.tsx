import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import {
  fetchAdminDashboard, fetchStudentDashboard,
  fetchExams, fetchStudentTypes, fetchSubjects, fetchChapters, fetchQuestions,
  fetchTests, fetchTimetables, fetchNotifications,
  fetchStudentList, fetchMyProfile
} from './lib/api';
import { User, EntranceExam, CompetitiveExam, StudentType, Subject, Chapter, Question, Test, Timetable, TestAttempt, Announcement, Notification } from './types';
import Auth from './pages/public/Auth';
import LandingPage from './pages/public/LandingPage';
import StudentDashboard from './pages/student/StudentDashboard';
import AnalyticsSection from './components/admin/AnalyticsSection';
import TimetableSection from './components/student/TimetableSection';
import SyllabusSection from './components/student/SyllabusSection';
import TestSection from './components/student/TestSection';
import PlanStore from './pages/student/PlanStore';
import StudentDoubts from './components/student/StudentDoubts';
import AdminManagement from './pages/admin/AdminDashboard';
import { AdminProvider } from './context/AdminContext';
import AboutPage from './pages/public/AboutPage';
import EntranceExamsPage from './pages/public/EntranceExamsPage';
import CompetitiveExamsPage from './pages/public/CompetitiveExamsPage';
import ContactPage from './pages/public/ContactPage';
import StudentProfilePage from './pages/student/StudentProfilePage';
import ProfileModal from './components/student/ProfileModal';
import logo from './assets/logo.png';
import mobileLogo from './assets/mobile-logo.png';
import {
  Sparkles, Award, Calendar, BookOpen, FileText, Shield,
  LogOut, Menu, X, Flame, TrendingUp, HelpCircle, Users, LayoutDashboard, Layers, Database, Bell, Layout, MessageCircle, User as UserIcon
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getToken = () => localStorage.getItem('token');

// Map backend MongoDB doc to frontend User shape
const mapBackendUser = (data: any): User => ({
  uid: data._id,
  name: data.name,
  email: data.email,
  phone: data.phone || '',
  role: data.role,
  state: data.state || 'Both',
  selectedEntranceExams: data.exams || [],
  selectedCompetitiveExams: [],
  studentType: data.studentType || '',
  studyPlan: 'yearly',
  purchasedPlans: data.purchasedPlans || [],
  streak: 1,
  lastActiveDate: new Date().toISOString(),
  createdAt: data.createdAt || new Date().toISOString(),
});

// Map backend Exam to frontend EntranceExam/CompetitiveExam shape
const mapExam = (e: any): EntranceExam => ({ id: e._id, name: e.name, description: e.description || '', state: e.state || 'Both', allowedStudentTypes: e.allowedStudentTypes || [] });

// Map backend Subject to frontend Subject shape
const mapSubject = (s: any): Subject => ({
  id: s._id,
  name: s.name,
  examIds: s.examId ? [s.examId._id || s.examId] : [],
  applicableFor: s.applicableFor ? s.applicableFor.map((x: any) => x._id || x) : [],
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
  _id: q._id,
  id: q._id,
  categoryId: q.categoryId?._id || q.categoryId || '',
  subjectId: q.subjectId?._id || q.subjectId || '',
  chapterId: q.chapterId?._id || q.chapterId || '',
  content: q.content || q.questionText || '',
  options: q.options || [],
  correctAnswer: q.correctAnswer || '',
  explanation: q.explanation || '',
  difficulty: (q.difficulty || 'Medium') as 'Easy' | 'Medium' | 'Hard',
});

// Map backend Test to frontend Test
const mapTest = (t: any): Test => ({
  _id: t._id,
  id: t._id,
  title: t.title,
  categoryId: t.categoryId?._id || t.categoryId,
  examIds: Array.isArray(t.examIds) ? t.examIds.map((e: any) => e._id || e) : [],
  studentTypeIds: Array.isArray(t.studentTypeIds) ? t.studentTypeIds.map((s: any) => s._id || s) : [],
  testType: (t.testType || 'Chapter') as Test['testType'],
  isDynamic: t.isDynamic || false,
  subjectId: t.subjectId?._id || t.subjectId,
  chapterId: t.chapterId?._id || t.chapterId,
  dynamicTotalQuestions: t.dynamicTotalQuestions,
  targetDifficulty: t.targetDifficulty,
  subjectConfigs: t.subjectConfigs,
  questions: t.questions || [],
  duration: t.duration || 60,
  marksPerQuestion: t.marksPerQuestion ?? 4,
  negativeMarksPerQuestion: t.negativeMarksPerQuestion ?? 1,
  retakeLimit: t.retakeLimit ?? 0,
  isFullSyllabus: t.isFullSyllabus || false,
  status: t.status || 'Draft',
  instructions: t.instructions,
  createdAt: t.createdAt || new Date().toISOString(),
});

// Map backend Timetable to frontend Timetable
const mapTimetable = (t: any): Timetable => ({
  id: t._id || t.id,
  _id: t._id || t.id,
  courseId: t.courseId || (typeof t.examId === 'object' ? t.examId?._id || t.examId?.id : t.examId) || t.planId || '',
  courseName: t.courseName || '',
  weekTitle: t.weekTitle || `Week ${t.weekNumber || 1}`,
  weekNumber: Number(t.weekNumber) || 1,
  startDate: t.startDate || (t.date ? new Date(t.date).toISOString().split('T')[0] : ''),
  endDate: t.endDate || (t.date ? new Date(t.date).toISOString().split('T')[0] : ''),
  weeklyChapters: Array.isArray(t.weeklyChapters) ? t.weeklyChapters : [],
  weekendExamId: t.weekendExamId || '',
  weekendExamTitle: t.weekendExamTitle || '',
  status: t.status || 'published',

  planId: t.planId || (typeof t.examId === 'object' ? t.examId?._id || t.examId?.id : t.examId),
  examId: typeof t.examId === 'object' ? t.examId?._id || t.examId?.id : t.examId,
  studentType: t.studentType || (typeof t.studentTypeId === 'object' ? t.studentTypeId?._id || t.studentTypeId?.id : t.studentTypeId),
  studyPlan: t.studyPlan || 'yearly',
  subjectId: typeof t.subjectId === 'object' ? t.subjectId?._id || t.subjectId?.id : t.subjectId,
  chapterId: typeof t.chapterId === 'object' ? t.chapterId?._id || t.chapterId?.id : t.chapterId,
  date: t.date ? new Date(t.date).toISOString().split('T')[0] : '',
  title: t.studyTopic || t.title || '',
  studyTopic: t.studyTopic || t.title || '',
  practiceMCQsCount: parseInt(t.practiceMCQs || '0', 10) || 0,
  revisionTopic: t.revision || '',
  assignment: t.assignment,
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

// Map backend StudentType to frontend StudentType
const mapStudentType = (st: any): StudentType => ({
  id: st._id,
  name: st.name,
  state: st.state || 'AP',
});

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const navigate = useNavigate();
  const [authState, setAuthState] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // App-wide Academic Data
  const [entranceExams, setEntranceExams] = useState<EntranceExam[]>([]);
  const [competitiveExams, setCompetitiveExams] = useState<CompetitiveExam[]>([]);
  const [studentTypes, setStudentTypes] = useState<StudentType[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [timetables, setTimetables] = useState<Timetable[]>([]);

  const [attempts, setAttempts] = useState<TestAttempt[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [studentsList, setStudentsList] = useState<User[]>([]);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [themeMode, setThemeMode] = useState<'enterprise' | 'cyberpunk'>(() => {
    return (localStorage.getItem('ankurah_theme_mode') as any) || 'enterprise';
  });

  useEffect(() => {
    if (themeMode === 'enterprise') {
      document.body.classList.add('theme-enterprise');
    } else {
      document.body.classList.remove('theme-enterprise');
    }
  }, [themeMode]);

  const toggleThemeMode = () => {
    const nextMode = themeMode === 'enterprise' ? 'cyberpunk' : 'enterprise';
    setThemeMode(nextMode);
    localStorage.setItem('ankurah_theme_mode', nextMode);
  };

  // Admin Sidebar Menu State
  const DEFAULT_ADMIN_MENU = React.useMemo(() => [
    { id: 'admin_dashboard', label: 'Dashboard Overview', icon: Flame, color: 'text-emerald-300' },
    { id: 'admin_payments', label: 'Payments', icon: Database, color: 'text-emerald-350' },
    { id: 'admin_students', label: 'Students', icon: Users, color: 'text-emerald-350' },
    { id: 'admin_exams', label: 'Courses / Plans', icon: Award, color: 'text-emerald-300' },
    { id: 'admin_subjects', label: 'Subjects & Chapters', icon: Layers, color: 'text-emerald-300' },
    { id: 'admin_questions', label: 'Question Bank', icon: Database, color: 'text-emerald-300' },
    { id: 'admin_tests', label: 'Create Tests', icon: FileText, color: 'text-emerald-300' },
    { id: 'admin_timetables', label: 'Timetable', icon: Calendar, color: 'text-emerald-300' },
    { id: 'admin_doubts', label: 'Student Doubts', icon: HelpCircle, color: 'text-emerald-300' },
  ], []);

  const [adminMenu, setAdminMenu] = useState(() => {
    const saved = localStorage.getItem('ankurah_admin_menu_order');
    if (saved) {
      try {
        const order = JSON.parse(saved);
        const sorted = [...DEFAULT_ADMIN_MENU].sort((a, b) => {
          const idxA = order.indexOf(a.id);
          const idxB = order.indexOf(b.id);
          if (idxA === -1) return 1;
          if (idxB === -1) return -1;
          return idxA - idxB;
        });
        return sorted;
      } catch(e) {}
    }
    return DEFAULT_ADMIN_MENU;
  });

  const [draggedId, setDraggedId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => e.target && (e.target as HTMLElement).classList.add('opacity-50', 'bg-emerald-900/50'), 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedId(null);
    e.target && (e.target as HTMLElement).classList.remove('opacity-50', 'bg-emerald-900/50');
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;

    const oldIndex = adminMenu.findIndex(i => i.id === draggedId);
    const newIndex = adminMenu.findIndex(i => i.id === targetId);

    const newMenu = [...adminMenu];
    const [removed] = newMenu.splice(oldIndex, 1);
    newMenu.splice(newIndex, 0, removed);
    
    setAdminMenu(newMenu);
    localStorage.setItem('ankurah_admin_menu_order', JSON.stringify(newMenu.map(i => i.id)));
  };

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
        const mappedUser = mapBackendUser(data);
        setCurrentUser(mappedUser);
        setAuthState('authenticated');
        
        const currentPath = window.location.pathname;
        if (data.role === 'admin') {
          if (!currentPath.startsWith('/dashboard/admin_')) {
            navigate('/dashboard/admin_dashboard');
          }
        } else {
          if (!currentPath.startsWith('/dashboard/') || currentPath === '/dashboard' || currentPath === '/dashboard/') {
            navigate('/dashboard/dashboard');
          }
        }
      })
      .catch(() => {
        localStorage.removeItem('token');
        setAuthState('unauthenticated');
      });
  }, []);

  // ─── Load all data when authenticated ───────────────────────────────────────
  const loadAllData = useCallback(async (user: User) => {
    setIsDataLoading(true);
    try {
      if (user.role === 'admin') {
        // Admin fetches all data
        const [examsRes, studentTypesRes, subjectsRes, chaptersRes, questionsRes, testsRes, timetablesRes, notifsRes, studentsRes] = await Promise.allSettled([
          fetchExams({ limit: '1000' }),
          fetchStudentTypes({ limit: '1000' }),
          fetchSubjects({ limit: '1000' }),
          fetchChapters({ limit: '1000' }),
          fetchQuestions({ limit: '1000' }),
          fetchTests({ limit: '1000' }),

          fetchTimetables({ limit: '1000' }),
          fetchNotifications({ limit: '1000' }),
          fetchStudentList({ limit: '1000' }),
        ]);

        if (examsRes.status === 'fulfilled') {
          const all = Array.isArray(examsRes.value) ? examsRes.value : examsRes.value?.data || [];
          
          const isCompExam = (e: any) => {
            if (e.type) return e.type === 'competitive';
            if (e.categoryId?.name) return e.categoryId.name === 'Competitive Exams';
            return /sbi|po|clat|nda|bank|ssc|rrb|cat|upsc|gate|group|constable|si/i.test(e.name || '');
          };

          const entrance = all.filter((e: any) => !isCompExam(e));
          const competitive = all.filter((e: any) => isCompExam(e));

          setEntranceExams(entrance.map(mapExam));
          setCompetitiveExams(competitive.map(mapExam));
        }
        if (studentTypesRes.status === 'fulfilled') setStudentTypes((Array.isArray(studentTypesRes.value) ? studentTypesRes.value : studentTypesRes.value?.data || []).map(mapStudentType));
        if (subjectsRes.status === 'fulfilled') setSubjects((Array.isArray(subjectsRes.value) ? subjectsRes.value : subjectsRes.value?.data || []).map(mapSubject));
        if (chaptersRes.status === 'fulfilled') setChapters((Array.isArray(chaptersRes.value) ? chaptersRes.value : chaptersRes.value?.data || []).map(mapChapter));
        if (questionsRes.status === 'fulfilled') setQuestions((Array.isArray(questionsRes.value) ? questionsRes.value : questionsRes.value?.data || []).map(mapQuestion));
        if (testsRes.status === 'fulfilled') setTests((Array.isArray(testsRes.value) ? testsRes.value : testsRes.value?.data || []).map(mapTest));

        if (timetablesRes.status === 'fulfilled') setTimetables((Array.isArray(timetablesRes.value) ? timetablesRes.value : timetablesRes.value?.data || []).map(mapTimetable));
        if (notifsRes.status === 'fulfilled') setNotifications((Array.isArray(notifsRes.value) ? notifsRes.value : notifsRes.value?.data || []).map(mapNotification));
        if (studentsRes.status === 'fulfilled') {
          const studs = (Array.isArray(studentsRes.value) ? studentsRes.value : studentsRes.value?.data || []).map((u: any) => mapBackendUser(u));
          setStudentsList(studs);
        }
      } else {
        // Student fetches their personalized data
        const { fetchMySubjects, fetchMyChapters, fetchMyTimetables, fetchMyTests, fetchMyNotifications, fetchMyAttempts, fetchExams } = await import('./lib/api');
        const [examsRes, subjectsRes, chaptersRes, timetablesRes, testsRes, notifsRes, attemptsRes] = await Promise.allSettled([
          fetchExams({ limit: '1000' }),
          fetchMySubjects(),
          fetchMyChapters(),

          fetchMyTimetables(),
          fetchMyTests(),
          fetchMyNotifications(),
          fetchMyAttempts(),
        ]);

        if (examsRes.status === 'fulfilled') {
          const all = examsRes.value?.data || Array.isArray(examsRes.value) ? examsRes.value : [];
          const entrance = all.filter((e: any) => e.categoryId?.name === 'Entrance Exams' || e.type === 'entrance');
          const competitive = all.filter((e: any) => e.categoryId?.name === 'Competitive Exams' || e.type === 'competitive');
          setEntranceExams(entrance.map(mapExam));
          setCompetitiveExams(competitive.map(mapExam));
        }
        if (subjectsRes.status === 'fulfilled') setSubjects((subjectsRes.value || []).map(mapSubject));
        if (chaptersRes.status === 'fulfilled') setChapters((chaptersRes.value || []).map(mapChapter));

        if (timetablesRes.status === 'fulfilled') setTimetables((timetablesRes.value || []).map(mapTimetable));
        if (testsRes.status === 'fulfilled') setTests((testsRes.value || []).map(mapTest));
        if (notifsRes.status === 'fulfilled') setNotifications((notifsRes.value || []).map(mapNotification));
        if (attemptsRes.status === 'fulfilled') setAttempts(attemptsRes.value || []);
      }
    } catch (err) {
      console.error('Data load error:', err);
    } finally {
      setIsDataLoading(false);
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

    setAttempts([]);
    setNotifications([]);
    setStudentsList([]);
    navigate('/');
  };

  const handleForceAdminReload = () => {
    if (currentUser) loadAllData(currentUser);
  };

  // After purchase: re-fetch user profile first so purchasedPlans is up-to-date,
  // then reload all student data (subjects, tests, etc.)
  const handlePurchaseSuccess = async () => {
    try {
      const freshData = await fetchMyProfile();
      const freshUser = { ...mapBackendUser(freshData), purchasedPlans: freshData.purchasedPlans || [] };
      setCurrentUser(freshUser);
      await loadAllData(freshUser);
    } catch (err) {
      console.error('Failed to refresh after purchase:', err);
      if (currentUser) loadAllData(currentUser);
    }
  };

  const mainRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const pathParts = location.pathname.split('/');
  const activeTab = pathParts.length > 2 && pathParts[1] === 'dashboard'
    ? pathParts[2]
    : (currentUser?.role === 'admin' ? 'admin_dashboard' : 'dashboard');

  useEffect(() => {
    window.scrollTo(0, 0);
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [location.pathname]);

  const handleTabChange = (tab: string) => {
    navigate(`/dashboard/${tab}`);
    setSidebarOpen(false);
    window.scrollTo(0, 0);
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  };

  // ─── Render active view ──────────────────────────────────────────────────────
  const renderActiveView = () => {
    if (!currentUser) return null;

    switch (activeTab) {
      case 'dashboard':
        return (
          <StudentDashboard
            user={currentUser}
            attempts={attempts}
            timetables={timetables}
            availableTests={tests}
            subjects={subjects}
            announcements={announcements}
            notifications={notifications}
            onNavigate={(tab) => handleTabChange(tab)}
            onAttemptTest={() => handleTabChange('tests')}
          />
        );
      case 'store':
        return <PlanStore user={currentUser} onPurchaseSuccess={handlePurchaseSuccess} />;
      case 'timetable':
        return (
          <TimetableSection
            user={currentUser}
            timetables={timetables}
            subjects={subjects}
            chapters={chapters}
            availableTests={tests}
            onAttemptTest={() => handleTabChange('tests')}
          />
        );
      case 'subjects':
      case 'syllabus':
        return (
          <SyllabusSection
            user={currentUser}
            subjects={subjects}
            chapters={chapters}
            studentTypes={studentTypes}
            tests={tests}
          />
        );
      case 'doubts':
        return (
          <StudentDoubts 
            user={currentUser} 
            subjects={subjects}
            chapters={chapters}
            tests={tests}
            attempts={attempts}
          />
        );
      case 'tests':
        return (
          <TestSection
            user={currentUser}
            tests={tests}
            attempts={attempts}
            subjects={subjects}
            chapters={chapters}
            entranceExams={entranceExams}
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
      case 'profile':
        return (
          <StudentProfilePage
            user={currentUser}
            studentTypes={studentTypes}
            allPlans={entranceExams}
            onNavigateToStore={() => handleTabChange('store')}
            onSignOut={handleSignOut}
          />
        );
      case 'admin_dashboard':
      case 'admin_payments':
      case 'admin_students':
      case 'admin_student_types':
      case 'admin_exams':
      case 'admin_subjects':
      case 'admin_questions':
      case 'admin_timetables':
      case 'admin_tests':
      case 'admin_doubts':
        if (currentUser.role !== 'admin') {
          return <div className="text-red-600 font-bold">Unauthorized. Access Restricted to Admin.</div>;
        }
        return (
          <AdminManagement
            onRefresh={handleForceAdminReload}
            activeTab={activeTab.startsWith('admin_') ? activeTab.replace('admin_', '') : 'dashboard'}
            onNavigate={(tab) => handleTabChange(tab.startsWith('admin_') ? tab : `admin_${tab}`)}
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

  const dashboardShellContent = (
    <div className={`min-h-screen flex text-slate-900 font-sans ${themeMode === 'enterprise' ? 'theme-enterprise bg-[#FAFBFC]' : 'bg-geom-bg'}`}>

      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-950/20 backdrop-blur-xs z-30 lg:hidden"
        ></div>
      )}

      <aside className={`fixed lg:static top-0 bottom-0 left-0 w-64 text-white z-40 transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      } transition-transform duration-200 ease-in-out border-r flex flex-col justify-between shrink-0 ${
        themeMode === 'enterprise'
          ? 'bg-[#166534] border-emerald-800/40 shadow-sm'
          : 'bg-gradient-to-b from-emerald-900 via-emerald-950 to-slate-950 border-emerald-800/40'
      }`}>
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          <div className="relative flex items-center justify-center pb-6 border-b border-white/20 mt-2 mb-2">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] w-3/4 h-16 bg-white/20 blur-[30px] rounded-full pointer-events-none"></div>
            <img src={logo} alt="Ankurah Exams" className="w-48 object-contain relative z-10 drop-shadow-md" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
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
                  onClick={() => handleTabChange('store')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${activeTab === 'store' ? 'bg-white text-emerald-900 shadow-[0_4px_12px_rgba(16,185,129,0.15)]' : 'text-emerald-100/80 hover:text-white hover:bg-white/10'}`}
                >
                  <Sparkles className={`w-4 h-4 ${activeTab === 'store' ? 'text-emerald-600' : 'text-emerald-300'}`} /> Plans
                </button>
                <button
                  onClick={() => handleTabChange('timetable')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${activeTab === 'timetable' ? 'bg-white text-emerald-900 shadow-[0_4px_12px_rgba(16,185,129,0.15)]' : 'text-emerald-100/80 hover:text-white hover:bg-white/10'}`}
                >
                  <Calendar className={`w-4 h-4 ${activeTab === 'timetable' ? 'text-emerald-600' : 'text-emerald-300'}`} /> Time Table
                </button>
                <button
                  onClick={() => handleTabChange('subjects')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${activeTab === 'subjects' ? 'bg-white text-emerald-900 shadow-[0_4px_12px_rgba(16,185,129,0.15)]' : 'text-emerald-100/80 hover:text-white hover:bg-white/10'}`}
                >
                  <Layers className={`w-4 h-4 ${activeTab === 'subjects' ? 'text-emerald-600' : 'text-emerald-300'}`} /> Subject / Chapters
                </button>
                <button
                  onClick={() => handleTabChange('tests')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${activeTab === 'tests' ? 'bg-white text-emerald-900 shadow-[0_4px_12px_rgba(16,185,129,0.15)]' : 'text-emerald-100/80 hover:text-white hover:bg-white/10'}`}
                >
                  <FileText className={`w-4 h-4 ${activeTab === 'tests' ? 'text-emerald-600' : 'text-emerald-300'}`} /> Exams
                </button>
                <button
                  onClick={() => handleTabChange('doubts')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${activeTab === 'doubts' ? 'bg-white text-emerald-900 shadow-[0_4px_12px_rgba(16,185,129,0.15)]' : 'text-emerald-100/80 hover:text-white hover:bg-white/10'}`}
                >
                  <MessageCircle className={`w-4 h-4 ${activeTab === 'doubts' ? 'text-emerald-600' : 'text-emerald-300'}`} /> Doubts
                </button>
                <button
                  onClick={() => handleTabChange('analytics')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${activeTab === 'analytics' ? 'bg-white text-emerald-900 shadow-[0_4px_12px_rgba(16,185,129,0.15)]' : 'text-emerald-100/80 hover:text-white hover:bg-white/10'}`}
                >
                  <TrendingUp className={`w-4 h-4 ${activeTab === 'analytics' ? 'text-emerald-600' : 'text-emerald-300'}`} /> Performance
                </button>
              </>
            )}

            {isUserAdmin && (
              <div className="space-y-1">
                <div className="px-4 py-2 text-xs font-bold text-emerald-200/50 uppercase tracking-wider mb-2">Admin Menu</div>
                {adminMenu.map((item) => (
                  <button
                    key={item.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item.id)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => handleDragOver(e, item.id)}
                    onDrop={(e) => handleDrop(e, item.id)}
                    onClick={() => handleTabChange(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-xs font-semibold transition-all cursor-grab active:cursor-grabbing ${activeTab === item.id ? 'bg-white text-emerald-900 shadow-xs' : 'text-emerald-100/80 hover:text-white hover:bg-white/10'}`}
                  >
                    <item.icon className={`w-4 h-4 ${activeTab === item.id ? 'text-emerald-600' : 'text-emerald-300'}`} /> {item.label}
                  </button>
                ))}
              </div>
            )}
          </nav>
        </div>

      </aside>

      <div className={`flex-1 flex flex-col min-w-0 max-h-screen overflow-hidden ${isUserAdmin ? 'bg-[#070A11] text-slate-100' : ''}`}>

        {/* ── MOBILE HEADER (STUDENT & ADMIN) ─────────────────── */}
        <header className={`lg:hidden shrink-0 relative z-20 shadow-lg ${isUserAdmin ? 'bg-slate-950 border-b border-emerald-500/30' : 'bg-gradient-to-r from-emerald-950 to-emerald-900'}`}>
          <div className="flex items-center justify-between px-4 py-3">

            {/* Sidebar Toggle + Logo */}
            <div className="flex items-center gap-3">
              {isUserAdmin && (
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 rounded-xl bg-white/10 border border-white/20 text-white flex items-center justify-center cursor-pointer active:scale-95 transition-all"
                  title="Toggle Menu"
                >
                  <Menu className="w-5 h-5 text-emerald-400" />
                </button>
              )}

              <img
                src={mobileLogo}
                alt="Ankurah Exams"
                className="h-10 w-auto object-contain brightness-0 invert"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </div>

            {/* Profile + Theme Switcher + Logout */}
            <div className="flex items-center gap-2">
              {isUserAdmin && (
                <button
                  onClick={toggleThemeMode}
                  className={`px-2.5 py-1.5 rounded-xl text-[10px] font-mono font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer border ${
                    themeMode === 'enterprise'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}
                  title="Instant Theme Switcher (Enterprise Light vs Cyberpunk Dark)"
                >
                  {themeMode === 'enterprise' ? '🎓 Light' : '⚡ Dark'}
                </button>
              )}

              <button
                onClick={() => handleTabChange('profile')}
                className="w-9 h-9 rounded-xl bg-white/15 border border-white/30 text-white flex items-center justify-center active:scale-95 transition-all cursor-pointer"
                title="View My Profile"
              >
                <UserIcon className="w-4 h-4" />
              </button>
              <button
                onClick={handleSignOut}
                className="w-9 h-9 rounded-xl bg-rose-500 border border-rose-400/50 text-white flex items-center justify-center active:scale-95 transition-all cursor-pointer shadow-md"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* ── MOBILE SUB-NAV: STUDENT ── */}
        {isStudent && (
          <div className="lg:hidden shrink-0 bg-[#F7F7F8] px-4 py-2.5 z-10">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleTabChange('store')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all active:scale-95 cursor-pointer border shadow-sm ${
                  activeTab === 'store'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-emerald-100'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300 hover:text-emerald-700'
                }`}
              >
                <Sparkles className={`w-3.5 h-3.5 ${activeTab === 'store' ? 'text-white' : 'text-emerald-500'}`} /> Plans
              </button>
              <button
                onClick={() => handleTabChange('doubts')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all active:scale-95 cursor-pointer border shadow-sm ${
                  activeTab === 'doubts'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-emerald-100'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300 hover:text-emerald-700'
                }`}
              >
                <MessageCircle className={`w-3.5 h-3.5 ${activeTab === 'doubts' ? 'text-white' : 'text-emerald-500'}`} /> Doubts
              </button>
              <button
                onClick={() => handleTabChange('analytics')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all active:scale-95 cursor-pointer border shadow-sm ${
                  activeTab === 'analytics'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-emerald-100'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300 hover:text-emerald-700'
                }`}
              >
                <TrendingUp className={`w-3.5 h-3.5 ${activeTab === 'analytics' ? 'text-white' : 'text-emerald-500'}`} /> Performance
              </button>
            </div>
          </div>
        )}

        {/* ── MOBILE SUB-NAV: ADMIN (Horizontal Scrolling Pill Menu) ── */}
        {isUserAdmin && (
          <div className="lg:hidden shrink-0 bg-slate-950 border-b border-slate-800/80 px-3 py-2 z-10 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1.5 min-w-max">
              {adminMenu.map((item) => {
                const isActive = activeTab === item.id;
                const IconComp = item.icon;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer border ${
                      isActive
                        ? 'bg-emerald-500 text-black border-emerald-400 shadow-md'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
                    }`}
                  >
                    <IconComp className={`w-3.5 h-3.5 ${isActive ? 'text-black' : 'text-emerald-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── DESKTOP HEADER (hidden on mobile) ─────────────── */}
        <header className={`hidden lg:flex bg-transparent px-6 py-4 items-center justify-between shrink-0 relative z-20`}>
          <div className="flex items-center gap-4">
            {/* Header Title */}
            <div className="flex items-center gap-3">
              {isUserAdmin ? (
                <>
                  <h1 className="text-2xl sm:text-3xl font-black text-emerald-500 font-mono tracking-widest uppercase">
                    ADMIN
                  </h1>
                </>
              ) : (
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Welcome, <span className="text-emerald-700">{currentUser?.name}</span>
                </h1>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Switcher Toggle Button */}
            {isUserAdmin && (
              <button
                type="button"
                onClick={toggleThemeMode}
                className={`px-4 py-2.5 rounded-xl font-mono font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer border shadow-md active:scale-95 ${
                  themeMode === 'enterprise'
                    ? 'bg-emerald-900 text-emerald-200 border-emerald-700 hover:bg-emerald-800'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                }`}
                title="Instant Theme Switcher (Enterprise Light vs Cyberpunk Dark)"
              >
                {themeMode === 'enterprise' ? (
                  <>🎓 THEME: ENTERPRISE (LIGHT)</>
                ) : (
                  <>⚡ THEME: CYBERPUNK (DARK)</>
                )}
              </button>
            )}

            <button
              onClick={() => handleTabChange('profile')}
              className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-md border-2 border-emerald-400/40 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              title="View My Profile"
            >
              <UserIcon className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={handleSignOut}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
              title="Logout of Account"
            >
              <LogOut className="w-4 h-4 text-white" />
              <span>Logout</span>
            </button>
          </div>
        </header>

        <main
          ref={mainRef}
          className={`flex-grow overflow-y-auto p-4 md:p-6 max-w-7xl w-full mx-auto pb-24 lg:pb-6 ${
            isUserAdmin
              ? themeMode === 'enterprise'
                ? 'bg-[#FAFBFC] text-slate-900 font-sans'
                : 'geom-grid-pattern-dark bg-[#06090F] text-slate-100'
              : 'geom-grid-pattern'
          }`}
        >
          {renderActiveView()}
        </main>

        {/* ── MOBILE BOTTOM NAVIGATION BAR — PREMIUM ──────── */}
        {isStudent && (
          <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-100 shadow-[0_-8px_40px_rgba(0,0,0,0.12)]">
            <div className="grid grid-cols-4 h-[68px]">

              {/* Home */}
              <button
                onClick={() => handleTabChange('dashboard')}
                className="flex flex-col items-center justify-center gap-1 transition-all active:scale-90 cursor-pointer relative group"
              >
                {activeTab === 'dashboard' && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-[3px] rounded-b-full bg-gradient-to-r from-emerald-500 to-teal-400" />
                )}
                <div className={`w-11 h-8 rounded-2xl flex items-center justify-center transition-all duration-200 ${
                  activeTab === 'dashboard'
                    ? 'bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-200'
                    : 'group-hover:bg-emerald-50'
                }`}>
                  <Flame className={`w-5 h-5 transition-all ${
                    activeTab === 'dashboard' ? 'text-white fill-white' : 'text-slate-800'
                  }`} />
                </div>
                <span className={`text-[10px] font-black tracking-wide transition-all ${
                  activeTab === 'dashboard' ? 'text-emerald-600' : 'text-slate-800'
                }`}>Home</span>
              </button>

              {/* Timetable */}
              <button
                onClick={() => handleTabChange('timetable')}
                className="flex flex-col items-center justify-center gap-1 transition-all active:scale-90 cursor-pointer relative group"
              >
                {activeTab === 'timetable' && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-[3px] rounded-b-full bg-gradient-to-r from-emerald-500 to-teal-400" />
                )}
                <div className={`w-11 h-8 rounded-2xl flex items-center justify-center transition-all duration-200 ${
                  activeTab === 'timetable'
                    ? 'bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-200'
                    : 'group-hover:bg-emerald-50'
                }`}>
                  <Calendar className={`w-5 h-5 transition-all ${
                    activeTab === 'timetable' ? 'text-white' : 'text-slate-800'
                  }`} />
                </div>
                <span className={`text-[10px] font-black tracking-wide transition-all ${
                  activeTab === 'timetable' ? 'text-emerald-600' : 'text-slate-800'
                }`}>Timetable</span>
              </button>

              {/* Subjects */}
              <button
                onClick={() => handleTabChange('subjects')}
                className="flex flex-col items-center justify-center gap-1 transition-all active:scale-90 cursor-pointer relative group"
              >
                {(activeTab === 'subjects' || activeTab === 'syllabus') && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-[3px] rounded-b-full bg-gradient-to-r from-emerald-500 to-teal-400" />
                )}
                <div className={`w-11 h-8 rounded-2xl flex items-center justify-center transition-all duration-200 ${
                  activeTab === 'subjects' || activeTab === 'syllabus'
                    ? 'bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-200'
                    : 'group-hover:bg-emerald-50'
                }`}>
                  <Layers className={`w-5 h-5 transition-all ${
                    activeTab === 'subjects' || activeTab === 'syllabus' ? 'text-white' : 'text-slate-800'
                  }`} />
                </div>
                <span className={`text-[10px] font-black tracking-wide transition-all ${
                  activeTab === 'subjects' || activeTab === 'syllabus' ? 'text-emerald-600' : 'text-slate-800'
                }`}>Subjects</span>
              </button>

              {/* Exams */}
              <button
                onClick={() => handleTabChange('tests')}
                className="flex flex-col items-center justify-center gap-1 transition-all active:scale-90 cursor-pointer relative group"
              >
                {activeTab === 'tests' && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-[3px] rounded-b-full bg-gradient-to-r from-emerald-500 to-teal-400" />
                )}
                <div className={`w-11 h-8 rounded-2xl flex items-center justify-center transition-all duration-200 ${
                  activeTab === 'tests'
                    ? 'bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-200'
                    : 'group-hover:bg-emerald-50'
                }`}>
                  <FileText className={`w-5 h-5 transition-all ${
                    activeTab === 'tests' ? 'text-white' : 'text-slate-800'
                  }`} />
                </div>
                <span className={`text-[10px] font-black tracking-wide transition-all ${
                  activeTab === 'tests' ? 'text-emerald-600' : 'text-slate-800'
                }`}>Exams</span>
              </button>

            </div>
          </nav>
        )}

        {/* Profile Modal */}
        {currentUser && (
          <ProfileModal
            user={currentUser}
            studentTypes={studentTypes}
            allPlans={entranceExams}
            isOpen={isProfileOpen}
            onClose={() => setIsProfileOpen(false)}
            onNavigateToStore={() => handleTabChange('store')}
          />
        )}
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
          element={(authState === 'unauthenticated' || !currentUser) ? <Navigate to="/login" replace /> : (
            currentUser?.role === 'admin' ? (
              <AdminProvider>
                {dashboardShellContent}
              </AdminProvider>
            ) : dashboardShellContent
          )}
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
