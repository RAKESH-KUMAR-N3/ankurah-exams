import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  EntranceExam, CompetitiveExam, StudentType, Subject, Chapter, 
  Question, Test, Timetable, Announcement, Notification, User 
} from '../types';
import { 
  fetchExams, fetchStudentTypes, fetchSubjects, fetchChapters, 
  fetchQuestions, fetchTests, fetchTimetables, fetchNotifications, fetchStudentList, fetchAdminDashboard, fetchPlans, fetchTransactions 
} from '../lib/api';

interface AdminContextType {
  entranceExams: EntranceExam[];
  competitiveExams: CompetitiveExam[];
  studentTypes: StudentType[];
  subjects: Subject[];
  chapters: Chapter[];
  questions: Question[];
  tests: Test[];
  timetables: Timetable[];
  announcements: Announcement[];
  notifications: Notification[];
  students: User[];
  allPlans: any[];
  allTransactions: any[];
  dashboardStats: any;
  isDataLoading: boolean;
  refreshAdminData: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | null>(null);

export const useAdminContext = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdminContext must be used within an AdminProvider');
  }
  return context;
};

// Map helpers
const mapStudentType = (st: any): StudentType => ({
  id: st._id,
  name: st.name,
  state: st.state || 'AP',
});
const mapExam = (e: any): any => ({ id: e._id || e.id, name: e.name, description: e.description, type: e.type || e.categoryId?.name, categoryId: e.categoryId, state: e.state || 'Both', allowedStudentTypes: e.allowedStudentTypes || [], subjects: e.subjects || [], validityMonths: e.validityMonths || 12 });
const mapSubject = (s: any): Subject => ({ id: s._id || s.id, name: s.name, subjectCategory: s.subjectCategory || 'entrance', examIds: s.examIds || (s.examId ? [typeof s.examId === 'string' ? s.examId : s.examId._id || s.examId.id] : []), applicableFor: s.applicableFor || [], description: s.description || '' });
const mapChapter = (c: any): Chapter => ({ id: c._id || c.id, subjectId: c.subjectId?._id || c.subjectId?.id || c.subjectId, name: c.name || c.title || '', description: c.description || '' });
const mapQuestion = (q: any): Question => ({ id: q._id || q.id, subjectId: q.subjectId?._id || q.subjectId?.id || q.subjectId, chapterId: q.chapterId?._id || q.chapterId?.id || q.chapterId, content: q.content, options: q.options || [], correctAnswer: q.correctAnswer, difficulty: q.difficulty || 'medium', marks: q.marks || 4, negativeMarks: q.negativeMarks || 1, explanation: q.explanation || '' });
const mapTest = (t: any): Test => ({ id: t._id || t.id, title: t.title, testType: t.testType || 'Chapter', duration: t.duration || 15, subjectId: t.subjectId, chapterId: t.chapterId, questions: t.questions || [], isDynamic: t.isDynamic, examIds: t.examIds, studentTypeIds: t.studentTypeIds, marksPerQuestion: t.marksPerQuestion, negativeMarksPerQuestion: t.negativeMarksPerQuestion, status: t.status });
const mapTimetable = (t: any): Timetable => ({ id: t._id || t.id, examId: t.examId, studentType: t.studentType, studyPlan: t.studyPlan, subjectId: t.subjectId, chapterId: t.chapterId, date: t.date, title: t.title, studyTopic: t.studyTopic, practiceMCQsCount: t.practiceMCQsCount, revisionTopic: t.revisionTopic, assignment: t.assignment });
const mapNotification = (n: any): Notification => ({ id: n._id || n.id, userId: n.userId || n.studentId, title: n.title, message: n.message, isRead: n.isRead, createdAt: n.createdAt });
const mapBackendUser = (u: any): User => ({ uid: u._id, name: u.name, email: u.email, phone: u.phone, role: u.role, state: u.state, selectedEntranceExams: u.selectedEntranceExams, selectedCompetitiveExams: u.selectedCompetitiveExams, studentType: u.studentType, studyPlan: u.studyPlan, purchasedPlans: u.purchasedPlans || [], streak: u.streak || 0, lastActiveDate: u.lastActiveDate, createdAt: u.createdAt });

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [entranceExams, setEntranceExams] = useState<EntranceExam[]>([]);
  const [competitiveExams, setCompetitiveExams] = useState<CompetitiveExam[]>([]);
  const [studentTypes, setStudentTypes] = useState<StudentType[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  
  // Dashboard specific data
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [allPlans, setAllPlans] = useState<any[]>([]);
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  
  const [isDataLoading, setIsDataLoading] = useState(true);

  const refreshAdminData = useCallback(async () => {
    setIsDataLoading(true);
    let pending = 12;
    
    // Failsafe: Don't show loading spinners for more than 3 seconds globally
    const timeoutId = setTimeout(() => {
      setIsDataLoading(false);
    }, 3000);

    const checkDone = () => {
      pending--;
      if (pending === 0) {
        clearTimeout(timeoutId);
        setIsDataLoading(false);
      }
    };

    fetchExams({ limit: '1000' }).then(res => {
      const all = Array.isArray(res) ? res : res?.data || [];
      const isCompExam = (e: any) => {
        if (e.type) return e.type === 'competitive';
        if (e.categoryId?.name) return e.categoryId.name === 'Competitive Exams';
        return /sbi|po|clat|nda|bank|ssc|rrb|cat|upsc|gate|group|constable|si/i.test(e.name || '');
      };
      const entrance = all.filter((e: any) => !isCompExam(e));
      const competitive = all.filter((e: any) => isCompExam(e));
      setEntranceExams(entrance.map(mapExam));
      setCompetitiveExams(competitive.map(mapExam));
    }).catch(console.error).finally(checkDone);

    fetchStudentTypes({ limit: '1000' }).then(res => setStudentTypes((Array.isArray(res) ? res : res?.data || []).map(mapStudentType))).catch(console.error).finally(checkDone);
    fetchSubjects({ limit: '1000' }).then(res => setSubjects((Array.isArray(res) ? res : res?.data || []).map(mapSubject))).catch(console.error).finally(checkDone);
    fetchChapters({ limit: '1000' }).then(res => setChapters((Array.isArray(res) ? res : res?.data || []).map(mapChapter))).catch(console.error).finally(checkDone);
    fetchQuestions({ limit: '1000' }).then(res => setQuestions((Array.isArray(res) ? res : res?.data || []).map(mapQuestion))).catch(console.error).finally(checkDone);
    fetchTests({ limit: '1000' }).then(res => setTests((Array.isArray(res) ? res : res?.data || []).map(mapTest))).catch(console.error).finally(checkDone);
    fetchTimetables({ limit: '1000' }).then(res => setTimetables((Array.isArray(res) ? res : res?.data || []).map(mapTimetable))).catch(console.error).finally(checkDone);
    fetchNotifications({ limit: '1000' }).then(res => setNotifications((Array.isArray(res) ? res : res?.data || []).map(mapNotification))).catch(console.error).finally(checkDone);
    fetchStudentList({ limit: '1000' }).then(res => setStudents((Array.isArray(res) ? res : res?.data || []).map(mapBackendUser))).catch(console.error).finally(checkDone);
    fetchAdminDashboard().then(res => setDashboardStats(res)).catch(console.error).finally(checkDone);
    fetchPlans({ limit: '1000' }).then(res => setAllPlans(Array.isArray(res) ? res : res?.data || [])).catch(console.error).finally(checkDone);
    fetchTransactions({ limit: '1000' }).then(res => setAllTransactions(res || [])).catch(console.error).finally(checkDone);

  }, []);

  useEffect(() => {
    refreshAdminData();
  }, [refreshAdminData]);

  return (
    <AdminContext.Provider value={{
      entranceExams, competitiveExams, studentTypes, subjects, chapters,
      questions, tests, timetables, announcements, notifications, students,
      allPlans, allTransactions, dashboardStats, isDataLoading, refreshAdminData
    }}>
      {children}
    </AdminContext.Provider>
  );
};
