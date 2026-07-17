import React, { useState } from 'react';
import {
  User, EntranceExam, CompetitiveExam, Subject, Chapter,
  Question, Test, Timetable, StudyMaterial, Announcement, Notification
} from '../types';
import {
  Shield, Plus, Trash, Database, FileText, Calendar, BookOpen,
  Check, AlertCircle, Trash2, Mail, Edit2, Award, Bell, RefreshCw, Volume2, TrendingUp, DollarSign
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend
} from 'recharts';
import { fetchAdminDashboard, fetchTransactions, fetchPlans } from '../lib/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const getToken = () => localStorage.getItem('token');
const authHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` });

interface AdminManagementProps {
  user: User;
  students: User[];
  entranceExams: EntranceExam[];
  competitiveExams: CompetitiveExam[];
  subjects: Subject[];
  chapters: Chapter[];
  questions: Question[];
  tests: Test[];
  timetables: Timetable[];
  materials: StudyMaterial[];
  announcements: Announcement[];
  onRefresh: () => void;
  activeTab: string;
}

export default function AdminManagement({
  user,
  students,
  entranceExams,
  competitiveExams,
  subjects,
  chapters,
  questions,
  tests,
  timetables,
  materials,
  announcements,
  onRefresh,
  activeTab
}: AdminManagementProps) {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states for announcements and notifications
  const [announcementForm, setAnnouncementForm] = useState({ id: '', title: '', content: '', targetExams: [] as string[] });
  const [notificationForm, setNotificationForm] = useState({ id: '', studentId: '', title: '', message: '' });

  // Form states
  const [examForm, setExamForm] = useState({ id: '', name: '', description: '', type: 'entrance', price: '' });
  const [subjectForm, setSubjectForm] = useState({ id: '', name: '', examId: '', description: '' });
  const [chapterForm, setChapterForm] = useState({ id: '', subjectId: '', name: '', description: '' });
  const [materialForm, setMaterialForm] = useState({ id: '', examId: '', subjectId: '', chapterId: '', type: 'pdf' as any, title: '', url: '', description: '' });
  const [timetableForm, setTimetableForm] = useState({ id: '', examId: '', studentType: 'long_term', studyPlan: 'yearly', subjectId: '', chapterId: '', date: '', title: '', studyTopic: '', practiceMCQsCount: 10, revisionTopic: '', assignment: '' });
  const [questionForm, setQuestionForm] = useState({ id: '', subjectId: '', chapterId: '', questionText: '', oA: '', oB: '', oC: '', oD: '', correctAnswerIndex: 0, difficulty: 'medium' as any, marks: 4, negativeMarks: 1, tags: '', explanation: '' });
  const [testForm, setTestForm] = useState({ id: '', title: '', description: '', type: 'weekly' as any, duration: 15, totalMarks: 12, negativeMarking: true, isFullSyllabus: false, subjectId: '', chapterId: '', selectedQIds: [] as string[] });

  // Dashboard, Plans, Transactions state
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [allPlans, setAllPlans] = useState<any[]>([]);
  const [allTransactions, setAllTransactions] = useState<any[]>([]);

  // Multi-level navigation state for Exams & Plans tab
  const [selectedExamCategory, setSelectedExamCategory] = useState<'entrance' | 'competitive' | null>(null);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);

  // Fetch admin-specific data on mount or refresh
  React.useEffect(() => {
    const loadAdminData = async () => {
      try {
        const [dashRes, planRes, txnRes] = await Promise.allSettled([
          fetchAdminDashboard(),
          fetchPlans({ limit: '1000' }),
          fetchTransactions({ limit: '1000' })
        ]);

        if (dashRes.status === 'fulfilled') setDashboardStats(dashRes.value);
        if (planRes.status === 'fulfilled') setAllPlans(planRes.value?.data || []);
        if (txnRes.status === 'fulfilled') setAllTransactions(txnRes.value || []);
      } catch (err) {
        console.error("Failed to load admin specific data", err);
      }
    };
    loadAdminData();
  }, [activeTab]); // Refetch when tab changes to keep it fresh

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    onRefresh();
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // 1. Manage Exams
  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const cleanId = examForm.id.toLowerCase().replace(/\s+/g, '-');

    try {
      const res = await fetch(`${API_URL}/api/exams`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          id: cleanId,
          name: examForm.name,
          description: examForm.description,
          type: examForm.type,
          price: examForm.price
        })
      });
      if (!res.ok) throw new Error('Failed to create exam');
      setExamForm({ id: '', name: '', description: '', type: 'entrance', price: '' });
      showSuccess(`Successfully created ${examForm.type} exam!`);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExam = async (id: string, type: 'entrance' | 'competitive') => {
    if (!window.confirm("Are you sure you want to delete this exam?")) return;
    try {
      const res = await fetch(`${API_URL}/api/exams/${id}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      if (!res.ok) throw new Error('Failed to delete exam');
      showSuccess("Exam deleted successfully.");
    } catch (err: any) {
      alert(err.message);
    }
  };

  // 2. Manage Subjects & Chapters
  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const cleanId = subjectForm.id.toLowerCase().replace(/\s+/g, '-');
    try {
      const res = await fetch(`${API_URL}/api/subjects`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          id: cleanId,
          name: subjectForm.name,
          examId: subjectForm.examId,
          description: subjectForm.description
        })
      });
      if (!res.ok) throw new Error('Failed to create subject');
      setSubjectForm({ id: '', name: '', examId: '', description: '' });
      showSuccess("Subject created and mapped successfully!");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubject = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this subject?")) return;
    try {
      const res = await fetch(`${API_URL}/api/subjects/${id}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      if (!res.ok) throw new Error('Failed to delete subject');
      showSuccess("Subject deleted successfully.");
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const cleanId = chapterForm.id.toLowerCase().replace(/\s+/g, '-');
    try {
      const res = await fetch(`${API_URL}/api/chapters`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          id: cleanId,
          subjectId: chapterForm.subjectId,
          title: chapterForm.name,
          description: chapterForm.description
        })
      });
      if (!res.ok) throw new Error('Failed to create chapter');
      setChapterForm({ id: '', subjectId: '', name: '', description: '' });
      showSuccess("Chapter created successfully!");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChapter = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this chapter?")) return;
    try {
      const res = await fetch(`${API_URL}/api/chapters/${id}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      if (!res.ok) throw new Error('Failed to delete chapter');
      showSuccess("Chapter deleted successfully.");
    } catch (err: any) {
      alert(err.message);
    }
  };

  // 3. Manage Study Materials
  const handleCreateMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const cleanId = materialForm.id.toLowerCase().replace(/\s+/g, '-');
    try {
      const res = await fetch(`${API_URL}/api/study-materials`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          id: cleanId,
          examId: materialForm.examId,
          subjectId: materialForm.subjectId,
          chapterId: materialForm.chapterId,
          type: materialForm.type === 'pdf' ? 'PDF' : materialForm.type === 'notes' ? 'Notes' : 'Video URL',
          title: materialForm.title,
          url: materialForm.url
        })
      });
      if (!res.ok) throw new Error('Failed to create study material');
      setMaterialForm({ id: '', examId: '', subjectId: '', chapterId: '', type: 'pdf', title: '', url: '', description: '' });
      showSuccess("Study resource linked to academic vault!");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this study material?")) return;
    try {
      const res = await fetch(`${API_URL}/api/study-materials/${id}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      if (!res.ok) throw new Error('Failed to delete study material');
      showSuccess("Study material deleted successfully.");
    } catch (err: any) {
      alert(err.message);
    }
  };

  // 4. Manage Timetable Slots
  const handleCreateTimetable = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const cleanId = timetableForm.id.toLowerCase().replace(/\s+/g, '-');
    try {
      const res = await fetch(`${API_URL}/api/timetables`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          id: cleanId,
          examId: timetableForm.examId,
          studentTypeId: timetableForm.studentType,
          subjectId: timetableForm.subjectId,
          chapterId: timetableForm.chapterId,
          date: timetableForm.date,
          studyTopic: timetableForm.title,
          practiceMCQs: timetableForm.practiceMCQsCount.toString(),
          revision: timetableForm.revisionTopic,
          assignment: timetableForm.assignment
        })
      });
      if (!res.ok) throw new Error('Failed to create timetable');
      setTimetableForm({ id: '', examId: '', studentType: 'long_term', studyPlan: 'yearly', subjectId: '', chapterId: '', date: '', title: '', studyTopic: '', practiceMCQsCount: 10, revisionTopic: '', assignment: '' });
      showSuccess("Timetable schedule published successfully!");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTimetable = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this timetable entry?")) return;
    try {
      const res = await fetch(`${API_URL}/api/timetables/${id}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      if (!res.ok) throw new Error('Failed to delete timetable entry');
      showSuccess("Timetable slot deleted successfully.");
    } catch (err: any) {
      alert(err.message);
    }
  };

  // 5. Manage Questions Central Bank
  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const options = [questionForm.oA, questionForm.oB, questionForm.oC, questionForm.oD].filter(Boolean);
    const correctAnswer = options[questionForm.correctAnswerIndex] || '';

    try {
      const res = await fetch(`${API_URL}/api/questions`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          content: questionForm.questionText,
          options,
          correctAnswer,
          explanation: questionForm.explanation,
          difficulty: questionForm.difficulty.toUpperCase(),
          marks: questionForm.marks,
          negativeMarks: questionForm.negativeMarks,
          subjectId: questionForm.subjectId,
          chapterId: questionForm.chapterId
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create question');
      setQuestionForm({ id: '', subjectId: '', chapterId: '', questionText: '', oA: '', oB: '', oC: '', oD: '', correctAnswerIndex: 0, difficulty: 'medium', marks: 4, negativeMarks: 1, tags: '', explanation: '' });
      showSuccess('Question item linked in Central Bank!');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 6. Manage Tests
  const handleCreateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const cleanId = testForm.id.toLowerCase().replace(/\s+/g, '-');
    try {
      const targetExam = [...entranceExams, ...competitiveExams].find(ex => ex.id === selectedExamId);
      const res = await fetch(`${API_URL}/api/tests`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          id: cleanId,
          title: testForm.title,
          instructions: testForm.description,
          testType: testForm.type.toUpperCase(),
          duration: testForm.duration,
          totalMarks: testForm.totalMarks,
          negativeMarking: testForm.negativeMarking,
          subjectId: testForm.isFullSyllabus ? undefined : testForm.subjectId,
          chapterId: testForm.isFullSyllabus ? undefined : testForm.chapterId,
          questions: testForm.selectedQIds,
          examId: targetExam?._id, // Send MongoDB ObjectId of the selected exam
          categoryId: targetExam?.categoryId // Send category mapping
        })
      });
      if (!res.ok) throw new Error('Failed to create test');
      setTestForm({ id: '', title: '', description: '', type: 'weekly', duration: 15, totalMarks: 12, negativeMarking: true, isFullSyllabus: false, subjectId: '', chapterId: '', selectedQIds: [] });
      showSuccess("Academic Evaluation Test published!");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTest = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this test?")) return;
    try {
      const res = await fetch(`${API_URL}/api/tests/${id}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      if (!res.ok) throw new Error('Failed to delete test');
      showSuccess("Evaluation test deleted successfully.");
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/notifications`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          userId: notificationForm.studentId || 'all',
          title: notificationForm.title,
          message: notificationForm.message
        })
      });
      if (!res.ok) throw new Error('Failed to send notification');
      setNotificationForm({ id: '', studentId: '', title: '', message: '' });
      showSuccess("Broadcast Notification dispatched to device channels!");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8 space-y-8">

      {activeTab === 'dashboard' && (
        <>
          {/* Header Info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-6 gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Shield className="w-6 h-6 text-emerald-600" />
                Academic Management Console
              </h2>
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mt-1">Configure curriculum structure, question bank, timetables, and assessments.</p>
            </div>

            {successMsg && (
              <div className="flex items-center gap-2 py-2 px-4 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-100 animate-pulse">
                <Check className="w-4 h-4 text-emerald-600" />
                {successMsg}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Students Registered</span>
              <span className="text-4xl font-black text-slate-800">{dashboardStats?.totalStudents || students.length}</span>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-emerald-500 shadow-[0_4px_20px_rgba(16,185,129,0.1)] flex flex-col items-center justify-center text-center relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-16 h-16 bg-emerald-500 rounded-full opacity-10"></div>
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-2 flex items-center gap-1"><DollarSign className="w-3 h-3" /> Total Revenue</span>
              <span className="text-4xl font-black text-emerald-700">₹{dashboardStats?.totalRevenue || 0}</span>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Question Bank</span>
              <span className="text-4xl font-black text-slate-800">{dashboardStats?.totalQuestions || questions.length} <span className="text-xs font-semibold text-slate-400">items</span></span>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Study Catalog</span>
              <span className="text-4xl font-black text-slate-800">{dashboardStats?.totalMaterials || materials.length} <span className="text-xs font-semibold text-slate-400">PDFs</span></span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" /> Project Progress
              </h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboardStats?.projectProgressData || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                    <YAxis yAxisId="left" orientation="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <RechartsTooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                    <Bar yAxisId="left" dataKey="students" name="Students" fill="#0f172a" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    <Bar yAxisId="right" dataKey="revenue" name="Revenue (₹)" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-600" /> Recent Transactions
              </h3>
              <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {dashboardStats?.last5Transactions?.map((txn: any) => (
                  <div key={txn._id} className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-xs text-slate-900 line-clamp-1">{txn.studentId?.name || 'Unknown Student'}</span>
                      <span className="font-black text-emerald-600 text-xs shrink-0">₹{txn.amount}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-500 font-semibold truncate pr-2">{txn.planId?.name || 'Unknown Plan'}</span>
                      <span className={`px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${txn.status === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {txn.status}
                      </span>
                    </div>
                  </div>
                ))}
                {(!dashboardStats?.last5Transactions || dashboardStats.last5Transactions.length === 0) && (
                  <div className="text-center text-xs text-slate-400 py-10 font-semibold">No recent transactions</div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* --- SUBTAB PANELS --- */}
      <div className="grid grid-cols-1 gap-8 pt-4">
        {activeTab === 'payments' && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-800">Student Transaction History</h3>
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase">
                    <th className="p-4">Transaction ID</th>
                    <th className="p-4">Student</th>
                    <th className="p-4">Plan & Exam</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {allTransactions.map((txn: any) => (
                    <tr key={txn._id} className="border-b border-slate-100 hover:bg-slate-50 font-semibold text-slate-700">
                      <td className="p-4 font-mono text-emerald-600">{txn.transactionId}</td>
                      <td className="p-4 font-bold text-slate-900">{txn.studentId?.name}<br /><span className="text-xs font-normal text-slate-500">{txn.studentId?.email}</span></td>
                      <td className="p-4 text-slate-700">{txn.planId?.name}<br /><span className="text-[10px] uppercase text-emerald-500 font-bold">Exam ID: {txn.planId?.examId}</span></td>
                      <td className="p-4 font-black text-slate-800">₹{txn.amount}</td>
                      <td className="p-4">{new Date(txn.createdAt).toLocaleDateString()}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${txn.status === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {txn.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {allTransactions.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-400 font-semibold">No transactions found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'students' && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-800">Enrolled Students Database</h3>
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase">
                    <th className="p-4">Name</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Track Type</th>
                    <th className="p-4">Registered On</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.uid} className="border-b border-slate-100 hover:bg-slate-50 font-semibold text-slate-700">
                      <td className="p-4 font-bold text-slate-900">{student.name}</td>
                      <td className="p-4">{student.email}</td>
                      <td className="p-4 capitalize">{student.studentType || 'N/A'}</td>
                      <td className="p-4">{new Date(student.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

                {activeTab === 'exams' && (
          <div className="flex flex-col gap-6 w-full">
            {!selectedExamCategory ? (
              <div className="flex flex-col items-center justify-center min-h-[400px] gap-8">
                <h2 className="text-2xl font-black text-slate-800">Select Exam Category</h2>
                <div className="flex gap-6">
                  <button
                    onClick={() => setSelectedExamCategory('entrance')}
                    className="px-8 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:border-emerald-500 transition-all flex flex-col items-center gap-3 cursor-pointer group"
                  >
                    <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                      <FileText className="w-6 h-6 text-emerald-600" />
                    </div>
                    <span className="font-bold text-slate-800 group-hover:text-emerald-700">Entrance Tests</span>
                  </button>
                  <button
                    onClick={() => setSelectedExamCategory('competitive')}
                    className="px-8 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-500 transition-all flex flex-col items-center gap-3 cursor-pointer group"
                  >
                    <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                      <Award className="w-6 h-6 text-blue-600" />
                    </div>
                    <span className="font-bold text-slate-800 group-hover:text-blue-700">Competitive Exams</span>
                  </button>
                </div>
              </div>
            ) : selectedExamCategory && !selectedExamId ? (
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
                  <button onClick={() => setSelectedExamCategory(null)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors">
                    <span className="text-lg leading-none">&larr;</span> Back
                  </button>
                  <h2 className="text-xl font-black text-slate-800">
                    {selectedExamCategory === 'entrance' ? 'Entrance Tests' : 'Competitive Exams'}
                  </h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-800">Register New Exam</h3>
                    <form onSubmit={handleCreateExam} className="space-y-4 text-xs">
                      <div>
                        <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Exam ID (e.g. jee-main)</label>
                        <input type="text" value={examForm.id} onChange={(e) => setExamForm({ ...examForm, id: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none" required />
                      </div>
                      <div>
                        <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Name</label>
                        <input type="text" value={examForm.name} onChange={(e) => setExamForm({ ...examForm, name: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none" required />
                      </div>
                      <div>
                        <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Description</label>
                        <textarea value={examForm.description} onChange={(e) => setExamForm({ ...examForm, description: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none h-20" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Exam Type</label>
                          <select value={examForm.type} onChange={(e) => setExamForm({ ...examForm, type: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none" disabled>
                            <option value={selectedExamCategory}>{selectedExamCategory === 'entrance' ? 'Entrance Test' : 'Competitive Exam'}</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Plan Fee (₹)</label>
                          <input type="number" placeholder="e.g. 15000" value={examForm.price} onChange={(e) => setExamForm({ ...examForm, price: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none" required />
                        </div>
                      </div>
                      <button type="submit" disabled={loading} className="py-2 px-6 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-wider cursor-pointer hover:bg-slate-800 transition-colors">
                        Publish Exam
                      </button>
                    </form>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-800">Active Exams</h3>
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                      {(selectedExamCategory === 'entrance' ? entranceExams : competitiveExams).map(ex => (
                        <div key={ex.id} className="flex flex-col p-4 bg-white border border-slate-200 rounded-2xl mb-3 text-xs shadow-sm hover:border-emerald-300 transition-colors cursor-pointer" onClick={() => setSelectedExamId(ex.id)}>
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-bold text-slate-800 text-sm">{ex.name}</span>
                            <div className="flex gap-2">
                               <button onClick={(e) => { e.stopPropagation(); /* edit logic */ }} className="text-blue-500 hover:text-blue-700 cursor-pointer p-1"><Edit2 className="w-4 h-4" /></button>
                               <button onClick={(e) => { e.stopPropagation(); handleDeleteExam(ex.id, selectedExamCategory); }} className="text-red-500 hover:text-red-700 cursor-pointer p-1"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </div>
                          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 mt-2">
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="font-bold text-slate-500 uppercase tracking-wider">Associated Plan Fee</span>
                              <span className="font-black text-slate-800 text-xs">
                                ₹{allPlans.find(p => p.examId === ex.id || p.examId?._id === ex.id)?.price || 0}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
                  <button onClick={() => setSelectedExamId(null)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors">
                    <span className="text-lg leading-none">&larr;</span> Back to Exams
                  </button>
                  <h2 className="text-xl font-black text-slate-800">
                    Test Configurator: {([...entranceExams, ...competitiveExams].find(e => e.id === selectedExamId)?.name)}
                  </h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-800">Create New Test</h3>
                    <form onSubmit={handleCreateTest} className="space-y-4 text-xs">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Test ID</label>
                          <input type="text" value={testForm.id} onChange={(e) => setTestForm({ ...testForm, id: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none" required />
                        </div>
                        <div>
                          <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Title</label>
                          <input type="text" value={testForm.title} onChange={(e) => setTestForm({ ...testForm, title: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none" required />
                        </div>
                      </div>
                      <div>
                        <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Instructions / Description</label>
                        <textarea value={testForm.description} onChange={(e) => setTestForm({ ...testForm, description: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none h-20" />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Duration (Mins)</label>
                          <input type="number" value={testForm.duration} onChange={(e) => setTestForm({ ...testForm, duration: parseInt(e.target.value, 10) })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Total Marks</label>
                          <input type="number" value={testForm.totalMarks} onChange={(e) => setTestForm({ ...testForm, totalMarks: parseInt(e.target.value, 10) })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Type</label>
                          <select value={testForm.type} onChange={(e) => setTestForm({ ...testForm, type: e.target.value as any })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none">
                            <option value="weekly">Weekly Mock</option>
                            <option value="monthly">Monthly Mock</option>
                            <option value="practice">Practice Quiz</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                        <input type="checkbox" id="isFullSyllabus" checked={testForm.isFullSyllabus} onChange={(e) => setTestForm({ ...testForm, isFullSyllabus: e.target.checked })} className="w-4 h-4 text-emerald-600 rounded" />
                        <label htmlFor="isFullSyllabus" className="text-slate-700 font-bold">Full Syllabus Grand Test?</label>
                      </div>
                      {!testForm.isFullSyllabus && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Target Subject</label>
                            <select value={testForm.subjectId} onChange={(e) => setTestForm({ ...testForm, subjectId: e.target.value, chapterId: '' })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none">
                              <option value="">Select Subject...</option>
                              {subjects.filter(s => s.examIds?.some((id: any) => id === selectedExamId || id?._id === selectedExamId)).map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Target Chapter</label>
                            <select value={testForm.chapterId} onChange={(e) => setTestForm({ ...testForm, chapterId: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none" disabled={!testForm.subjectId}>
                              <option value="">All Chapters / General</option>
                              {chapters.filter(c => (c.subjectId as any) === testForm.subjectId || (c.subjectId as any)?._id === testForm.subjectId).map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}
                      <button type="submit" disabled={loading} className="py-2 px-6 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-wider cursor-pointer hover:bg-slate-800 transition-colors mt-2">
                        Create Test
                      </button>
                    </form>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-800">Existing Tests for this Exam</h3>
                    <div className="space-y-3 max-h-[500px] overflow-y-auto">
                      {tests.filter(t => t.examId === selectedExamId || t.examId?._id === selectedExamId).length === 0 ? (
                        <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                           <span className="text-slate-400 font-bold">No tests created yet.</span>
                        </div>
                      ) : tests.filter(t => t.examId === selectedExamId || t.examId?._id === selectedExamId).map(t => (
                        <div key={t.id} className="p-4 bg-white border border-slate-200 rounded-2xl flex flex-col gap-2">
                          <div className="flex justify-between items-start">
                             <div>
                               <span className="text-xs font-bold px-2 py-1 bg-emerald-50 text-emerald-600 rounded-md uppercase tracking-wider">{t.type || 'PRACTICE'}</span>
                               <h4 className="font-bold text-slate-800 mt-1">{t.title}</h4>
                             </div>
                             <button onClick={() => handleDeleteTest(t.id)} className="text-red-500 hover:text-red-700 p-1"><Trash2 className="w-4 h-4" /></button>
                          </div>
                          <div className="flex gap-4 text-[10px] font-bold text-slate-500 mt-2 border-t border-slate-50 pt-2">
                             <span>{t.duration} MINS</span>
                             <span>{t.totalMarks} MARKS</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}



        {activeTab === 'subjects' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 flex flex-col gap-6">

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Create Subject</h3>
                <form onSubmit={handleCreateSubject} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="md:col-span-2">
                    <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Map to Target Exam</label>
                    <select
                      value={subjectForm.examId}
                      onChange={(e) => setSubjectForm({ ...subjectForm, examId: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none"
                      required
                    >
                      <option value="">Select Target Exam</option>
                      {[...entranceExams, ...competitiveExams].map(ex => (
                        <option key={ex.id} value={ex.id}>{ex.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Subject ID</label>
                    <input
                      type="text"
                      placeholder="e.g. physics"
                      value={subjectForm.id}
                      onChange={(e) => setSubjectForm({ ...subjectForm, id: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Subject Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Physics"
                      value={subjectForm.name}
                      onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none"
                      required
                    />
                  </div>
                  <div className="md:col-span-2 pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="py-2.5 px-6 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold uppercase tracking-wider cursor-pointer w-full transition-colors"
                    >
                      Create Subject
                    </button>
                  </div>
                </form>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Create Chapter</h3>
                <form onSubmit={handleCreateChapter} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="md:col-span-2">
                    <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Belongs to Subject</label>
                    <select
                      value={chapterForm.subjectId}
                      onChange={(e) => setChapterForm({ ...chapterForm, subjectId: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none"
                      required
                    >
                      <option value="">Select Subject</option>
                      {subjects.map(sub => (
                        <option key={sub.id} value={sub.id}>{sub.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Chapter ID</label>
                    <input
                      type="text"
                      placeholder="e.g. kinematics"
                      value={chapterForm.id}
                      onChange={(e) => setChapterForm({ ...chapterForm, id: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Chapter Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Kinematics"
                      value={chapterForm.name}
                      onChange={(e) => setChapterForm({ ...chapterForm, name: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none"
                      required
                    />
                  </div>
                  <div className="md:col-span-2 pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="py-2.5 px-6 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold uppercase tracking-wider cursor-pointer w-full transition-colors"
                    >
                      Create Chapter
                    </button>
                  </div>
                </form>
              </div>

            </div>

            <div className="lg:col-span-5 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-600" /> Academic Structure
              </h3>
              <div className="flex-1 overflow-y-auto pr-2 space-y-4 max-h-[600px]">
                {subjects.map(sub => {
                  const subChapters = chapters.filter(c => c.subjectId === sub.id);
                  return (
                    <div key={sub.id} className="p-4 bg-white border border-slate-100 shadow-sm rounded-xl text-xs space-y-3">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                        <span className="font-black text-slate-800 text-sm">{sub.name}</span>
                        <button onClick={() => handleDeleteSubject(sub.id)} className="text-red-500 hover:text-red-700 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                      </div>
                      <div className="space-y-1">
                        {subChapters.length > 0 ? subChapters.map(ch => (
                          <div key={ch.id} className="flex justify-between items-center py-1.5 px-2 hover:bg-slate-50 rounded-lg">
                            <span className="font-semibold text-slate-600 truncate mr-2">{ch.name}</span>
                            <button onClick={() => handleDeleteChapter(ch.id)} className="text-red-400 hover:text-red-600 cursor-pointer shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        )) : (
                          <span className="text-slate-400 font-semibold px-2">No chapters added.</span>
                        )}
                      </div>
                    </div>
                  );
                })}
                {subjects.length === 0 && (
                  <div className="text-center text-slate-400 font-semibold py-10">No subjects mapped yet.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'questions' && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-800">Central Question Bank Management</h3>
            <form onSubmit={handleCreateQuestion} className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <div className="space-y-4">
                <div>
                  <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Subject</label>
                  <select
                    value={questionForm.subjectId}
                    onChange={(e) => setQuestionForm({ ...questionForm, subjectId: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none"
                    required
                  >
                    <option value="">Select Subject</option>
                    {subjects.map(sub => (
                      <option key={sub.id} value={sub.id}>{sub.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Chapter</label>
                  <select
                    value={questionForm.chapterId}
                    onChange={(e) => setQuestionForm({ ...questionForm, chapterId: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none"
                    required
                  >
                    <option value="">Select Chapter</option>
                    {chapters.filter(c => c.subjectId === questionForm.subjectId).map(ch => (
                      <option key={ch.id} value={ch.id}>{ch.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Question Content</label>
                  <textarea
                    value={questionForm.questionText}
                    onChange={(e) => setQuestionForm({ ...questionForm, questionText: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none h-24"
                    placeholder="Enter mathematical equations, chemical formulae or reasoning prompt..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Answer Explanation</label>
                  <textarea
                    value={questionForm.explanation}
                    onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none h-20"
                    placeholder="Explain why correct answer index is right..."
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Option A</label>
                    <input type="text" value={questionForm.oA} onChange={(e) => setQuestionForm({ ...questionForm, oA: e.target.value })} className="w-full p-2.5 bg-white border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none" required />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Option B</label>
                    <input type="text" value={questionForm.oB} onChange={(e) => setQuestionForm({ ...questionForm, oB: e.target.value })} className="w-full p-2.5 bg-white border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none" required />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Option C</label>
                    <input type="text" value={questionForm.oC} onChange={(e) => setQuestionForm({ ...questionForm, oC: e.target.value })} className="w-full p-2.5 bg-white border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none" required />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Option D</label>
                    <input type="text" value={questionForm.oD} onChange={(e) => setQuestionForm({ ...questionForm, oD: e.target.value })} className="w-full p-2.5 bg-white border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none" required />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Correct Index (0-3)</label>
                    <select
                      value={questionForm.correctAnswerIndex}
                      onChange={(e) => setQuestionForm({ ...questionForm, correctAnswerIndex: parseInt(e.target.value, 10) })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none"
                    >
                      <option value={0}>Option A (0)</option>
                      <option value={1}>Option B (1)</option>
                      <option value={2}>Option C (2)</option>
                      <option value={3}>Option D (3)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Difficulty</label>
                    <select
                      value={questionForm.difficulty}
                      onChange={(e) => setQuestionForm({ ...questionForm, difficulty: e.target.value as any })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Allot Marks</label>
                    <input type="number" value={questionForm.marks} onChange={(e) => setQuestionForm({ ...questionForm, marks: parseInt(e.target.value, 10) })} className="w-full p-2.5 bg-white border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold uppercase tracking-wider cursor-pointer"
                >
                  Link to Question Bank
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'materials' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-800">Publish Study Resource</h3>
              <form onSubmit={handleCreateMaterial} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Resource ID</label>
                  <input type="text" value={materialForm.id} onChange={(e) => setMaterialForm({ ...materialForm, id: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none" required />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Title</label>
                  <input type="text" value={materialForm.title} onChange={(e) => setMaterialForm({ ...materialForm, title: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none" required />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Resource URL (e.g. PDF/Video URL)</label>
                  <input type="text" value={materialForm.url} onChange={(e) => setMaterialForm({ ...materialForm, url: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none" required />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Exam Type</label>
                    <select value={materialForm.examId} onChange={(e) => setMaterialForm({ ...materialForm, examId: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none" required>
                      <option value="">Select Exam</option>
                      {[...entranceExams, ...competitiveExams].map(ex => (
                        <option key={ex.id} value={ex.id}>{ex.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Subject</label>
                    <select value={materialForm.subjectId} onChange={(e) => setMaterialForm({ ...materialForm, subjectId: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none" required>
                      <option value="">Select Subject</option>
                      {subjects.map(sub => (
                        <option key={sub.id} value={sub.id}>{sub.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Chapter</label>
                    <select value={materialForm.chapterId} onChange={(e) => setMaterialForm({ ...materialForm, chapterId: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none" required>
                      <option value="">Select Chapter</option>
                      {chapters.filter(c => c.subjectId === materialForm.subjectId).map(ch => (
                        <option key={ch.id} value={ch.id}>{ch.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Resource Type</label>
                  <select value={materialForm.type} onChange={(e) => setMaterialForm({ ...materialForm, type: e.target.value as any })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none">
                    <option value="pdf">PDF File</option>
                    <option value="notes">Text Notes</option>
                    <option value="video">Video Reference</option>
                  </select>
                </div>
                <button type="submit" disabled={loading} className="py-2 px-6 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-wider cursor-pointer">Publish Resource</button>
              </form>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-800">Linked Study Resources</h3>
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                {materials.map(mat => (
                  <div key={mat.id} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs">
                    <div>
                      <span className="font-bold block text-slate-950">{mat.title}</span>
                      <span className="text-xs text-slate-400 uppercase font-semibold">{mat.type} - {mat.url.substring(0, 40)}...</span>
                    </div>
                    <button onClick={() => handleDeleteMaterial(mat.id)} className="text-red-500 hover:text-red-700 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'timetables' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-800">Define Academic Daily Slot</h3>
              <form onSubmit={handleCreateTimetable} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Slot ID</label>
                    <input type="text" value={timetableForm.id} onChange={(e) => setTimetableForm({ ...timetableForm, id: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none" required />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Date</label>
                    <input type="date" value={timetableForm.date} onChange={(e) => setTimetableForm({ ...timetableForm, date: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none" required />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Target Exam</label>
                    <select value={timetableForm.examId} onChange={(e) => setTimetableForm({ ...timetableForm, examId: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none" required>
                      <option value="">Select Exam</option>
                      {[...entranceExams, ...competitiveExams].map(ex => (
                        <option key={ex.id} value={ex.id}>{ex.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Student Track</label>
                    <select value={timetableForm.studentType} onChange={(e) => setTimetableForm({ ...timetableForm, studentType: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none" required>
                      <option value="long_term">Long Term</option>
                      <option value="regular_11">Senior Intermediate</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Subject</label>
                    <select value={timetableForm.subjectId} onChange={(e) => setTimetableForm({ ...timetableForm, subjectId: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none" required>
                      <option value="">Select Subject</option>
                      {subjects.map(sub => (
                        <option key={sub.id} value={sub.id}>{sub.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Study Topic Title</label>
                  <input type="text" value={timetableForm.title} onChange={(e) => setTimetableForm({ ...timetableForm, title: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none" placeholder="e.g. Friction and laws of motion practice" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Practice MCQ Target</label>
                    <input type="number" value={timetableForm.practiceMCQsCount} onChange={(e) => setTimetableForm({ ...timetableForm, practiceMCQsCount: parseInt(e.target.value, 10) })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Revision Topic</label>
                    <input type="text" value={timetableForm.revisionTopic} onChange={(e) => setTimetableForm({ ...timetableForm, revisionTopic: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none" placeholder="e.g. kinematics basics" />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="py-2 px-6 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-wider cursor-pointer">Publish Daily Slot</button>
              </form>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-800">Published Schedule Entries</h3>
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                {timetables.map(tb => (
                  <div key={tb.id} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs">
                    <div>
                      <span className="font-bold text-slate-950 block">{tb.studyTopic}</span>
                      <span className="text-xs text-slate-400 font-semibold uppercase">{tb.date} - MCQs: {tb.practiceMCQsCount}</span>
                    </div>
                    <button onClick={() => handleDeleteTimetable(tb.id)} className="text-red-500 hover:text-red-700 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        
        {activeTab === 'announcements' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-800">Broadcast Device Notification</h3>
              <form onSubmit={handleSendNotification} className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <div>
                  <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Target Student</label>
                  <select
                    value={notificationForm.studentId}
                    onChange={(e) => setNotificationForm({ ...notificationForm, studentId: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none"
                  >
                    <option value="">Broadcast to All Students</option>
                    {students.map(s => (
                      <option key={s.uid} value={s.uid}>{s.name} ({s.email})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Alert Title</label>
                  <input
                    type="text"
                    value={notificationForm.title}
                    onChange={(e) => setNotificationForm({ ...notificationForm, title: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none"
                    placeholder="e.g. Schedule Maintenance or Timetable Changed"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Alert Message</label>
                  <textarea
                    value={notificationForm.message}
                    onChange={(e) => setNotificationForm({ ...notificationForm, message: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none h-24"
                    placeholder="Detail text to show in notification center..."
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-wider cursor-pointer"
                >
                  Send Push Notification
                </button>
              </form>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-800">Academic Board Broadcasting</h3>
              <p className="text-slate-500">Coordinate notification feeds linked to system devices.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
