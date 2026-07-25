import React, { useState } from 'react';
import {
  User, EntranceExam, CompetitiveExam, StudentType, Subject, Chapter,
  Question, Test, Timetable, StudyMaterial, Announcement, Notification
} from '../../types';
import {
  Shield, Plus, Trash, Database, FileText, Calendar, BookOpen, Users,
  Check, AlertCircle, Trash2, Mail, Edit2, Award, Bell, RefreshCw, Volume2, TrendingUp, DollarSign
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend
} from 'recharts';
import DashboardOverviewTab from '../../components/admin/tabs/DashboardOverviewTab';
import StudentsTab from '../../components/admin/tabs/StudentsTab';
import PaymentsTab from '../../components/admin/tabs/PaymentsTab';
import StudentGroupsTab from '../../components/admin/tabs/StudentGroupsTab';
import SubjectsAndChaptersTab from '../../components/admin/tabs/SubjectsAndChaptersTab';
import ExamsAndPlansTab from '../../components/admin/tabs/ExamsAndPlansTab';
import TestConfiguratorTab from '../../components/admin/tabs/TestConfiguratorTab';
import QuestionBankTab from '../../components/admin/tabs/QuestionBankTab';
import StudyMaterialTab from '../../components/admin/tabs/StudyMaterialTab';
import TimetableTab from '../../components/admin/tabs/TimetableTab';
import AnnouncementsTab from '../../components/admin/tabs/AnnouncementsTab';
import { fetchAdminDashboard, fetchTransactions, fetchPlans } from '../../lib/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const getToken = () => localStorage.getItem('token');
const authHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` });

interface AdminManagementProps {
  user: User;
  students: User[];
  entranceExams: EntranceExam[];
  competitiveExams: CompetitiveExam[];
  studentTypes: StudentType[];
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
  studentTypes,
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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states for announcements and notifications
  const [announcementForm, setAnnouncementForm] = useState({ id: '', title: '', content: '', targetExams: [] as string[] });
  const [notificationForm, setNotificationForm] = useState({ id: '', studentId: '', title: '', message: '' });

  // Form states
  const [examForm, setExamForm] = useState<{ id: string; name: string; description: string; type: string; price: string; allowedStudentTypes: string[] }>({ id: '', name: '', description: '', type: 'entrance', price: '', allowedStudentTypes: [] });
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [studentTypeForm, setStudentTypeForm] = useState({ name: '' });
  const [editingStudentTypeId, setEditingStudentTypeId] = useState<string | null>(null);
  const [subjectForm, setSubjectForm] = useState({ id: '', name: '', examId: '', applicableFor: [] as string[], description: '' });
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [chapterForm, setChapterForm] = useState(() => {
    const savedGroup = sessionStorage.getItem('ankurah_chapter_group');
    const savedSubject = sessionStorage.getItem('ankurah_chapter_subject');
    return { id: '', examId: '', studentTypeId: savedGroup || '', subjectId: savedSubject || '', name: '', description: '' };
  });
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [materialForm, setMaterialForm] = useState({ id: '', examId: '', studentTypeId: '', subjectId: '', chapterId: '', type: 'PDF' as any, title: '', url: '', file: null as File | null, description: '' });
  const [timetableForm, setTimetableForm] = useState({ id: '', examId: '', studentType: 'long_term', studyPlan: 'yearly', subjectId: '', chapterId: '', date: '', title: '', studyTopic: '', practiceMCQsCount: 10, revisionTopic: '', assignment: '' });
  const [questionForm, setQuestionForm] = useState({ id: '', subjectId: '', chapterId: '', questionText: '', oA: '', oB: '', oC: '', oD: '', correctAnswerIndex: 0, difficulty: 'medium' as any, marks: 4, negativeMarks: 1, tags: '', explanation: '' });
  const [testForm, setTestForm] = useState({ id: '', title: '', description: '', type: 'weekly' as any, duration: 15, totalMarks: 12, negativeMarking: true, isFullSyllabus: false, subjectId: '', chapterId: '', selectedQIds: [] as string[], isDynamic: false, dynamicTotalQuestions: 10, csvFile: null as File | null });

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
        if (planRes.status === 'fulfilled') setAllPlans(Array.isArray(planRes.value) ? planRes.value : planRes.value?.data || []);
        if (txnRes.status === 'fulfilled') setAllTransactions(txnRes.value || []);
      } catch (err) {
        console.error("Failed to load admin specific data", err);
      }
    };
    loadAdminData();
  }, [activeTab]); // Refetch when tab changes to keep it fresh

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setErrorMsg(null);
    onRefresh();
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // Forcefully retain the group selection due to React <select> DOM sync bugs on data refresh
  React.useEffect(() => {
    if (subjectForm.applicableFor.length > 0 && studentTypes.length > 0) {
      // If the DOM lost sync but we have a value, React will re-apply it on next tick
      setSubjectForm(prev => ({ ...prev })); 
    }
    if (chapterForm.studentTypeId && studentTypes.length > 0) {
      setChapterForm(prev => ({ ...prev }));
    }
  }, [studentTypes]);

  React.useEffect(() => {
    if (chapterForm.subjectId && subjects.length > 0) {
      setChapterForm(prev => ({ ...prev }));
    }
  }, [subjects]);

  React.useEffect(() => {
    if (chapterForm.studentTypeId) sessionStorage.setItem('ankurah_chapter_group', chapterForm.studentTypeId);
    else sessionStorage.removeItem('ankurah_chapter_group');

    if (chapterForm.subjectId) sessionStorage.setItem('ankurah_chapter_subject', chapterForm.subjectId);
    else sessionStorage.removeItem('ankurah_chapter_subject');
  }, [chapterForm.studentTypeId, chapterForm.subjectId]);

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setSuccessMsg(null);
    setTimeout(() => setErrorMsg(null), 5000);
  };

  // 1. Manage Exams
  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const cleanId = examForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const examType = selectedExamCategory || examForm.type || 'entrance';

    try {
      let res;
      if (editingExamId) {
        res = await fetch(`${API_URL}/api/exams/${editingExamId}`, {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify({
            id: editingExamId,
            type: examType,
            description: examForm.description,
            name: examForm.name,
            allowedStudentTypes: examForm.allowedStudentTypes,
            price: examForm.price
          })
        });
      } else {
        res = await fetch(`${API_URL}/api/exams`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({
            id: cleanId,
            name: examForm.name,
            description: examForm.description,
            type: examType,
            price: examForm.price,
            allowedStudentTypes: examForm.allowedStudentTypes
          })
        });
      }
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || (editingExamId ? 'Failed to update exam' : 'Failed to create exam'));
      }
      setExamForm({ id: '', name: '', description: '', type: examType, price: '', allowedStudentTypes: [] });
      setEditingExamId(null);
      
      // Refetch plans and trigger full app data refresh
      fetchPlans({ limit: '1000' }).then(planRes => setAllPlans(Array.isArray(planRes) ? planRes : planRes?.data || [])).catch(console.error);
      onRefresh();
      
      showSuccess(editingExamId ? 'Exam updated successfully!' : `Successfully created ${examType} exam!`);
    } catch (err: any) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditExamClick = (ex: any) => {
    const fee = allPlans.find((p: any) => String(p.examId) === String(ex.id) || String(p.examId?._id) === String(ex.id))?.price || '';
    setExamForm({
      id: ex.id,
      name: ex.name,
      description: ex.description || '',
      type: selectedExamCategory || 'entrance',
      price: fee.toString(),
      allowedStudentTypes: ex.allowedStudentTypes?.map((st: any) => typeof st === 'string' ? st : st._id || st.id) || []
    });
    setEditingExamId(ex.id);
  };

  const handleDeleteExam = async (id: string, type: 'entrance' | 'competitive') => {
    if (!window.confirm("Are you sure you want to delete this exam?")) return;
    try {
      const res = await fetch(`${API_URL}/api/exams/${id}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      if (!res.ok) throw new Error('Failed to delete exam');
      onRefresh();
      showSuccess("Exam deleted successfully.");
    } catch (err: any) {
      showError(err.message);
    }
  };

  // 1.5 Manage Student Types
  const handleEditStudentTypeClick = (st: StudentType) => {
    setStudentTypeForm({ name: st.name });
    setEditingStudentTypeId(st.id);
  };

  const handleCreateStudentType = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let res;
      if (editingStudentTypeId) {
        res = await fetch(`${API_URL}/api/student-types/${editingStudentTypeId}`, {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify({ name: studentTypeForm.name })
        });
      } else {
        res = await fetch(`${API_URL}/api/student-types`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ name: studentTypeForm.name })
        });
      }
      if (!res.ok) throw new Error(editingStudentTypeId ? 'Failed to update student group' : 'Failed to create student group');
      setStudentTypeForm({ name: '' });
      setEditingStudentTypeId(null);
      showSuccess(editingStudentTypeId ? "Student group updated successfully!" : `Successfully created ${studentTypeForm.name}!`);
    } catch (err: any) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudentType = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this student group?")) return;
    try {
      const res = await fetch(`${API_URL}/api/student-types/${id}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      if (!res.ok) throw new Error('Failed to delete student group');
      showSuccess("Student group deleted successfully.");
    } catch (err: any) {
      showError(err.message);
    }
  };

  // 2. Manage Subjects & Chapters
  const handleEditSubjectClick = (sub: Subject) => {
    setSubjectForm({
      id: sub.id,
      name: sub.name,
      examId: sub.examIds?.[0] || '',
      applicableFor: sub.applicableFor?.map((a: any) => a._id || a.id || a) || [],
      description: sub.description || ''
    });
    setEditingSubjectId(sub.id);
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: any = {
        name: subjectForm.name,
        subjectCategory: (subjectForm as any).subjectCategory || 'entrance',
        applicableFor: []
      };
      if (subjectForm.examId && subjectForm.examId.trim()) {
        payload.examId = subjectForm.examId.trim();
      }
      
      let res;
      if (editingSubjectId) {
        res = await fetch(`${API_URL}/api/subjects/${editingSubjectId}`, {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`${API_URL}/api/subjects`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify(payload)
        });
      }
      
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || (editingSubjectId ? 'Failed to update subject' : 'Failed to create subject'));
      }
      
      setSubjectForm({ id: '', name: '', examId: '', applicableFor: [], description: '' });
      setEditingSubjectId(null);
      onRefresh();
      showSuccess(editingSubjectId ? "Subject updated successfully!" : "Subject created successfully!");
    } catch (err: any) {
      showError(err.message);
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
      onRefresh();
      showSuccess("Subject deleted successfully.");
    } catch (err: any) {
      showError(err.message);
    }
  };

  const handleCreateChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let res;
      if (editingChapterId) {
        res = await fetch(`${API_URL}/api/chapters/${editingChapterId}`, {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify({
            title: chapterForm.name,
            subjectId: chapterForm.subjectId
          })
        });
      } else {
        res = await fetch(`${API_URL}/api/chapters`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({
            title: chapterForm.name,
            subjectId: chapterForm.subjectId
          })
        });
      }
      if (!res.ok) throw new Error(editingChapterId ? 'Failed to update chapter' : 'Failed to create chapter');
      setChapterForm(prev => ({ ...prev, id: '', name: '', description: '' }));
      setEditingChapterId(null);
      showSuccess(editingChapterId ? "Chapter updated successfully!" : "Chapter created successfully!");
    } catch (err: any) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditChapterClick = (ch: any) => {
    setChapterForm({
      id: ch.id,
      examId: '',
      studentTypeId: '',
      subjectId: ch.subjectId,
      name: ch.name,
      description: ''
    });
    setEditingChapterId(ch.id);
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
      showError(err.message);
    }
  };

  // 3. Manage Study Materials
  const handleCreateMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Automatically determine the examId from the selected subject or fallback to first available exam
    const selectedSubject = subjects.find((s: any) => s.id === materialForm.subjectId);
    const inferredExamId = selectedSubject?.examIds?.[0] || entranceExams?.[0]?.id || competitiveExams?.[0]?.id;

    let finalUrl = materialForm.url;

    try {
      if (materialForm.file) {
        const formData = new FormData();
        formData.append('file', materialForm.file);
        const uploadRes = await fetch(`${API_URL}/api/upload`, {
          method: 'POST',
          body: formData
        });
        if (!uploadRes.ok) throw new Error('File upload failed');
        finalUrl = await uploadRes.text();
      }

      const res = await fetch(`${API_URL}/api/study-materials`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          examId: inferredExamId,
          studentTypeId: materialForm.studentTypeId || undefined,
          subjectId: materialForm.subjectId,
          chapterId: materialForm.chapterId,
          type: 'PDF',
          title: materialForm.file?.name || materialForm.title || 'Untitled',
          url: finalUrl
        })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to create study material');
      }
      setMaterialForm(prev => ({ ...prev, title: '', url: '', file: null, description: '' }));
      showSuccess("Study resource linked to academic vault!");
    } catch (err: any) {
      showError(err.message);
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
      showError(err.message);
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
      setTimetableForm(prev => ({ ...prev, id: '', title: '', studyTopic: '', revisionTopic: '', assignment: '' }));
      showSuccess("Timetable schedule published successfully!");
    } catch (err: any) {
      showError(err.message);
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
      showError(err.message);
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
      setQuestionForm(prev => ({ ...prev, id: '', questionText: '', oA: '', oB: '', oC: '', oD: '', correctAnswerIndex: 0, explanation: '' }));
      showSuccess('Question item linked in Central Bank!');
    } catch (err: any) {
      showError(err.message);
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
      
      // Check if it's a Grand Test CSV Upload
      if (testForm.isFullSyllabus && testForm.csvFile) {
        const formData = new FormData();
        formData.append('file', testForm.csvFile);
        formData.append('title', testForm.title);
        formData.append('testType', testForm.type.toUpperCase());
        formData.append('duration', testForm.duration.toString());
        formData.append('totalMarks', testForm.totalMarks.toString());
        formData.append('instructions', testForm.description);
        formData.append('negativeMarking', testForm.negativeMarking.toString());
        if (targetExam?._id) formData.append('examId', targetExam._id);
        if (targetExam?.categoryId) formData.append('categoryId', targetExam.categoryId);
        
        const res = await fetch(`${API_URL}/api/tests/grand-test-upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          body: formData
        });
        if (!res.ok) throw new Error('Failed to create Grand Test via CSV');
      } else {
        // Standard or Dynamic Test
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
            examId: targetExam?._id,
            categoryId: targetExam?.categoryId,
            isDynamic: testForm.isDynamic,
            dynamicTotalQuestions: testForm.isDynamic ? testForm.dynamicTotalQuestions : undefined
          })
        });
        if (!res.ok) throw new Error('Failed to create test');
      }
      
      setTestForm(prev => ({ ...prev, id: '', title: '', description: '', selectedQIds: [], csvFile: null }));
      showSuccess("Academic Evaluation Test published!");
    } catch (err: any) {
      showError(err.message);
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
      showError(err.message);
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
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8 space-y-8">

      {activeTab === 'dashboard' && (
        <DashboardOverviewTab 
          dashboardStats={dashboardStats} 
          students={students} 
          questions={questions} 
          materials={materials}
          successMsg={successMsg}
          errorMsg={errorMsg}
        />
      )}

      {/* --- SUBTAB PANELS --- */}
      <div className="grid grid-cols-1 gap-8 pt-4">
        {activeTab === 'payments' && <PaymentsTab allTransactions={allTransactions} />}
        {activeTab === 'students' && <StudentsTab students={students} studentTypes={studentTypes} allPlans={allPlans} />}

                {activeTab === 'exams' && (
          <ExamsAndPlansTab
            selectedExamCategory={selectedExamCategory}
            setSelectedExamCategory={setSelectedExamCategory}
            selectedExamId={selectedExamId}
            setSelectedExamId={setSelectedExamId}
            entranceExams={entranceExams}
            competitiveExams={competitiveExams}
            examForm={examForm}
            setExamForm={setExamForm}
            handleCreateExam={handleCreateExam}
            handleDeleteExam={handleDeleteExam}
            allPlans={allPlans}
            studentTypes={studentTypes}
            loading={loading}
            editingExamId={editingExamId}
            setEditingExamId={setEditingExamId}
            handleEditExamClick={handleEditExamClick}
          />
        )}

        {activeTab === 'tests' && (
          <TestConfiguratorTab
            entranceExams={entranceExams}
            competitiveExams={competitiveExams}
            studentTypes={studentTypes}
            tests={tests}
            subjects={subjects}
            chapters={chapters}
            loading={loading}
            onRefresh={onRefresh}
          />
        )}



        {activeTab === 'student_types' && (
          <StudentGroupsTab
            studentTypes={studentTypes}
            studentTypeForm={studentTypeForm}
            setStudentTypeForm={setStudentTypeForm}
            editingStudentTypeId={editingStudentTypeId}
            setEditingStudentTypeId={setEditingStudentTypeId}
            handleCreateStudentType={handleCreateStudentType}
            handleDeleteStudentType={handleDeleteStudentType}
            handleEditStudentTypeClick={handleEditStudentTypeClick}
            loading={loading}
          />
        )}

        {activeTab === 'subjects' && (
          <SubjectsAndChaptersTab
            studentTypes={studentTypes}
            subjects={subjects}
            chapters={chapters}
            entranceExams={entranceExams}
            competitiveExams={competitiveExams}
            subjectForm={subjectForm}
            setSubjectForm={setSubjectForm}
            chapterForm={chapterForm}
            setChapterForm={setChapterForm}
            handleCreateSubject={handleCreateSubject}
            handleCreateChapter={handleCreateChapter}
            handleEditSubjectClick={handleEditSubjectClick}
            handleDeleteSubject={handleDeleteSubject}
            handleDeleteChapter={handleDeleteChapter}
            handleEditChapterClick={handleEditChapterClick}
            editingSubjectId={editingSubjectId}
            setEditingSubjectId={setEditingSubjectId}
            editingChapterId={editingChapterId}
            setEditingChapterId={setEditingChapterId}
            loading={loading}
          />
        )}

        {activeTab === 'questions' && (
          <QuestionBankTab
            subjects={subjects}
            chapters={chapters}
            competitiveExams={competitiveExams}
            questionForm={questionForm}
            setQuestionForm={setQuestionForm}
            handleCreateQuestion={handleCreateQuestion}
            loading={loading}
          />
        )}

        {activeTab === 'materials' && (
          <StudyMaterialTab
            materialForm={materialForm}
            setMaterialForm={setMaterialForm}
            handleCreateMaterial={handleCreateMaterial}
            handleDeleteMaterial={handleDeleteMaterial}
            studentTypes={studentTypes}
            entranceExams={entranceExams}
            competitiveExams={competitiveExams}
            subjects={subjects}
            chapters={chapters}
            materials={materials}
            loading={loading}
          />
        )}

        {activeTab === 'timetables' && (
          <TimetableTab
            timetableForm={timetableForm}
            setTimetableForm={setTimetableForm}
            handleCreateTimetable={handleCreateTimetable}
            handleDeleteTimetable={handleDeleteTimetable}
            entranceExams={entranceExams}
            competitiveExams={competitiveExams}
            subjects={subjects}
            timetables={timetables}
            loading={loading}
          />
        )}

        
        {activeTab === 'announcements' && (
          <AnnouncementsTab
            notificationForm={notificationForm}
            setNotificationForm={setNotificationForm}
            handleSendNotification={handleSendNotification}
            students={students}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
}
