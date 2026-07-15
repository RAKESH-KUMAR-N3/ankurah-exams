import React, { useState } from 'react';
import { 
  User, EntranceExam, CompetitiveExam, Subject, Chapter, 
  Question, Test, Timetable, StudyMaterial, Announcement, Notification 
} from '../types';
import { 
  Shield, Plus, Trash, Database, FileText, Calendar, BookOpen, 
  Check, AlertCircle, Trash2, Mail, Bell, RefreshCw, Volume2
} from 'lucide-react';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

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
  onRefresh
}: AdminManagementProps) {
  const [activeSubTab, setActiveSubTab] = useState<'students' | 'exams' | 'subjects' | 'questions' | 'materials' | 'timetables' | 'tests' | 'announcements'>('students');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states for announcements and notifications
  const [announcementForm, setAnnouncementForm] = useState({ id: '', title: '', content: '', targetExams: [] as string[] });
  const [notificationForm, setNotificationForm] = useState({ id: '', studentId: '', title: '', message: '' });

  // Form states
  const [examForm, setExamForm] = useState({ id: '', name: '', description: '', type: 'entrance' });
  const [subjectForm, setSubjectForm] = useState({ id: '', name: '', examId: '', description: '' });
  const [chapterForm, setChapterForm] = useState({ id: '', subjectId: '', name: '', description: '' });
  const [materialForm, setMaterialForm] = useState({ id: '', examId: '', subjectId: '', chapterId: '', type: 'pdf' as any, title: '', url: '', description: '' });
  const [timetableForm, setTimetableForm] = useState({ id: '', examId: '', studentType: 'long_term', studyPlan: 'yearly', subjectId: '', chapterId: '', date: '', title: '', studyTopic: '', practiceMCQsCount: 10, revisionTopic: '', assignment: '' });
  const [questionForm, setQuestionForm] = useState({ id: '', subjectId: '', chapterId: '', questionText: '', oA: '', oB: '', oC: '', oD: '', correctAnswerIndex: 0, difficulty: 'medium' as any, marks: 4, negativeMarks: 1, tags: '' });
  const [testForm, setTestForm] = useState({ id: '', title: '', description: '', type: 'weekly' as any, duration: 15, totalMarks: 12, negativeMarking: true, isFullSyllabus: false, subjectId: '', chapterId: '', selectedQIds: [] as string[] });

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    onRefresh();
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // 1. Manage Exams
  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const collectionName = examForm.type === 'entrance' ? 'entranceExams' : 'competitiveExams';
    const cleanId = examForm.id.toLowerCase().replace(/\s+/g, '-');
    
    try {
      await setDoc(doc(db, collectionName, cleanId), {
        id: cleanId,
        name: examForm.name,
        description: examForm.description
      });
      setExamForm({ id: '', name: '', description: '', type: 'entrance' });
      showSuccess(`Successfully created ${examForm.type} exam!`);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, collectionName);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExam = async (id: string, type: 'entrance' | 'competitive') => {
    if (!window.confirm("Are you sure you want to delete this exam?")) return;
    const collectionName = type === 'entrance' ? 'entranceExams' : 'competitiveExams';
    try {
      await deleteDoc(doc(db, collectionName, id));
      showSuccess("Exam deleted successfully.");
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, collectionName);
    }
  };

  // 2. Manage Subjects & Chapters
  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const cleanId = subjectForm.id.toLowerCase().replace(/\s+/g, '-');
    try {
      await setDoc(doc(db, 'subjects', cleanId), {
        id: cleanId,
        name: subjectForm.name,
        examIds: [subjectForm.examId],
        description: subjectForm.description
      });
      setSubjectForm({ id: '', name: '', examId: '', description: '' });
      showSuccess("Subject registered successfully.");
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'subjects');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const cleanId = chapterForm.id.toLowerCase().replace(/\s+/g, '-');
    try {
      await setDoc(doc(db, 'chapters', cleanId), {
        id: cleanId,
        subjectId: chapterForm.subjectId,
        name: chapterForm.name,
        description: chapterForm.description
      });
      setChapterForm({ id: '', subjectId: '', name: '', description: '' });
      showSuccess("Chapter linked successfully.");
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'chapters');
    } finally {
      setLoading(false);
    }
  };

  // 3. Manage Study Materials
  const handleCreateMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const mId = materialForm.id || `mat-${Date.now()}`;
    try {
      await setDoc(doc(db, 'studyMaterials', mId), {
        id: mId,
        examId: materialForm.examId,
        subjectId: materialForm.subjectId,
        chapterId: materialForm.chapterId,
        type: materialForm.type,
        title: materialForm.title,
        url: materialForm.url,
        description: materialForm.description
      });
      setMaterialForm({ id: '', examId: '', subjectId: '', chapterId: '', type: 'pdf', title: '', url: '', description: '' });
      showSuccess("Study material posted!");
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'studyMaterials');
    } finally {
      setLoading(false);
    }
  };

  // 4. Manage Timetable Daily Slots
  const handleCreateTimetable = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const tId = timetableForm.id || `tt-${Date.now()}`;
    try {
      await setDoc(doc(db, 'timetables', tId), {
        ...timetableForm,
        id: tId,
        practiceMCQsCount: Number(timetableForm.practiceMCQsCount)
      });
      setTimetableForm({ id: '', examId: '', studentType: 'long_term', studyPlan: 'yearly', subjectId: '', chapterId: '', date: '', title: '', studyTopic: '', practiceMCQsCount: 10, revisionTopic: '', assignment: '' });
      showSuccess("Daily schedule timetabled successfully!");
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'timetables');
    } finally {
      setLoading(false);
    }
  };

  // 5. Manage Questions Bank
  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const qId = questionForm.id || `q-${Date.now()}`;
    const options = [questionForm.oA, questionForm.oB, questionForm.oC, questionForm.oD].filter(Boolean);
    
    if (options.length < 4) {
      alert("Please specify exactly 4 multiple choice option fields (A, B, C, D).");
      setLoading(false);
      return;
    }

    try {
      await setDoc(doc(db, 'questions', qId), {
        id: qId,
        subjectId: questionForm.subjectId,
        chapterId: questionForm.chapterId,
        questionText: questionForm.questionText,
        options,
        correctAnswerIndex: Number(questionForm.correctAnswerIndex),
        explanation: questionForm.explanation,
        difficulty: questionForm.difficulty,
        marks: Number(questionForm.marks),
        negativeMarks: Number(questionForm.negativeMarks),
        tags: questionForm.tags ? questionForm.tags.split(',').map(t => t.trim()) : []
      });
      setQuestionForm({ id: '', subjectId: '', chapterId: '', questionText: '', oA: '', oB: '', oC: '', oD: '', correctAnswerIndex: 0, difficulty: 'medium', marks: 4, negativeMarks: 1, tags: '' });
      showSuccess("Question item linked in Central Bank!");
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'questions');
    } finally {
      setLoading(false);
    }
  };

  // 6. Manage Mock Exams / Tests
  const handleCreateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const tId = testForm.id || `test-${Date.now()}`;
    
    if (testForm.selectedQIds.length === 0) {
      alert("Please tick at least one question from the Question Bank below to include in this test.");
      setLoading(false);
      return;
    }

    try {
      await setDoc(doc(db, 'tests', tId), {
        id: tId,
        title: testForm.title,
        description: testForm.description,
        type: testForm.type,
        duration: Number(testForm.duration),
        totalMarks: Number(testForm.totalMarks),
        negativeMarking: testForm.negativeMarking,
        isFullSyllabus: testForm.isFullSyllabus,
        subjectId: testForm.subjectId || null,
        chapterId: testForm.chapterId || null,
        questionIds: testForm.selectedQIds,
        createdAt: new Date().toISOString()
      });
      setTestForm({ id: '', title: '', description: '', type: 'weekly', duration: 15, totalMarks: 12, negativeMarking: true, isFullSyllabus: false, subjectId: '', chapterId: '', selectedQIds: [] });
      showSuccess("Mock exam posted!");
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'tests');
    } finally {
      setLoading(false);
    }
  };

  const toggleFormQSelection = (qId: string) => {
    setTestForm(prev => {
      const active = prev.selectedQIds.includes(qId);
      const updated = active 
        ? prev.selectedQIds.filter(id => id !== qId) 
        : [...prev.selectedQIds, qId];
      return {
        ...prev,
        selectedQIds: updated
      };
    });
  };

  const handleDeleteItem = async (collectionName: string, id: string) => {
    if (!window.confirm(`Are you sure you want to delete this item from ${collectionName}?`)) return;
    try {
      await deleteDoc(doc(db, collectionName, id));
      showSuccess("Item removed successfully.");
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, collectionName);
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const annId = announcementForm.id || `ann-${Date.now()}`;
    try {
      await setDoc(doc(db, 'announcements', annId), {
        id: annId,
        title: announcementForm.title,
        content: announcementForm.content,
        targetExams: announcementForm.targetExams,
        createdAt: new Date().toISOString()
      });
      setAnnouncementForm({ id: '', title: '', content: '', targetExams: [] });
      showSuccess("Bulletin broadcasted successfully.");
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'announcements');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!window.confirm("Are you sure you want to remove this bulletin?")) return;
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'announcements', id));
      showSuccess("Bulletin removed.");
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `announcements/${id}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const notifId = `notif-${Date.now()}`;
    try {
      await setDoc(doc(db, 'notifications', notifId), {
        id: notifId,
        userId: notificationForm.studentId,
        title: notificationForm.title,
        message: notificationForm.message,
        isRead: false,
        createdAt: new Date().toISOString()
      });
      setNotificationForm({ id: '', studentId: '', title: '', message: '' });
      showSuccess("Targeted student alert dispatched successfully.");
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'notifications');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="admin_management" className="space-y-6 font-sans">
      
      {/* Top Banner */}
      <div className="bg-zinc-950 rounded-lg p-6 text-white border border-zinc-900 shadow-geom flex flex-col md:flex-row md:items-center justify-between gap-6 geom-grid-pattern-dark">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-zinc-900 text-zinc-300 border border-zinc-800 rounded-sm text-[9px] uppercase font-extrabold tracking-wider">
            <Shield className="w-3 h-3 text-emerald-400" /> Security Level: System Admin
          </div>
          <h1 className="text-xl font-extrabold tracking-tight uppercase text-white">Academic Control Tower</h1>
          <p className="text-zinc-450 text-xs font-semibold leading-relaxed">
            Dynamically schedule lessons, append questions, post reference materials, and configure tests.
          </p>
        </div>
        <button 
          onClick={onRefresh}
          className="py-1.5 px-3.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-sm flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-white transition-all cursor-pointer shadow-geom-sm"
        >
          <RefreshCw className="w-4 h-4 text-emerald-400" /> Refresh Data
        </button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-md bg-zinc-50 border border-geom-border text-zinc-850 text-xs font-bold flex items-center gap-2.5 shadow-geom-sm">
          <Check className="w-4.5 h-4.5 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Aggregate Administrative Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-lg border border-geom-border shadow-geom text-center">
          <span className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider block mb-1.5">Students Registered</span>
          <span className="text-2xl font-bold text-zinc-900 font-mono tracking-tight">{students.length}</span>
        </div>
        <div className="bg-white p-5 rounded-lg border border-geom-border shadow-geom text-center">
          <span className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider block mb-1.5">Question Bank</span>
          <span className="text-2xl font-bold text-zinc-900 font-mono tracking-tight">{questions.length} items</span>
        </div>
        <div className="bg-white p-5 rounded-lg border border-geom-border shadow-geom text-center">
          <span className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider block mb-1.5">Study Catalog</span>
          <span className="text-2xl font-bold text-zinc-900 font-mono tracking-tight">{materials.length} PDFs</span>
        </div>
        <div className="bg-white p-5 rounded-lg border border-geom-border shadow-geom text-center">
          <span className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider block mb-1.5">Schedules mapped</span>
          <span className="text-2xl font-bold text-zinc-900 font-mono tracking-tight">{timetables.length} Days</span>
        </div>
      </div>

      {/* Internal Subtabs switcher */}
      <div className="bg-white p-1 rounded-md border border-geom-border shadow-geom flex flex-wrap gap-1">
        {[
          { id: 'students', label: 'Students' },
          { id: 'exams', label: 'Exams' },
          { id: 'subjects', label: 'Subjects & Chapters' },
          { id: 'questions', label: 'Question Bank' },
          { id: 'materials', label: 'Study Material' },
          { id: 'timetables', label: 'Timetable Scheduling' },
          { id: 'tests', label: 'Test Configurator' },
          { id: 'announcements', label: 'Broadcasts & Alerts' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`py-2 px-4 rounded-sm text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeSubTab === tab.id 
                ? 'bg-zinc-900 text-white shadow-geom-sm border border-zinc-900' 
                : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* --- SUBTAB PANELS --- */}

      {/* Tab: Student Registry */}
      {activeSubTab === 'students' && (
        <div className="bg-white rounded-lg border border-geom-border p-6 shadow-geom space-y-4">
          <h3 className="font-extrabold text-zinc-900 text-sm uppercase tracking-wider">Registered Student Roster</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-geom-border bg-zinc-50 text-zinc-500 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Full Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Student Year Type</th>
                  <th className="py-3 px-4">Study Plan Option</th>
                  <th className="py-3 px-4">Active Streak</th>
                  <th className="py-3 px-4 text-right">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-geom-border">
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-zinc-400 font-medium">
                      No student accounts registered yet.
                    </td>
                  </tr>
                ) : (
                  students.map(st => (
                    <tr key={st.uid} className="hover:bg-zinc-50/30 transition-all">
                      <td className="py-3 px-4 font-bold text-zinc-900">{st.name}</td>
                      <td className="py-3 px-4 text-zinc-500 font-medium">{st.email}</td>
                      <td className="py-3 px-4 font-semibold">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[9px] uppercase font-bold tracking-wider bg-zinc-50 border border-geom-border text-zinc-600">
                          {st.studentType ? st.studentType.replace('_', ' ') : 'N/A'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[9px] uppercase font-bold tracking-wider bg-zinc-50 border border-geom-border text-zinc-600">
                          {st.studyPlan || 'N/A'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-600">
                        {st.streak || 1} Days
                      </td>
                      <td className="py-3 px-4 text-right text-zinc-400 font-medium">
                        {st.createdAt ? new Date(st.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Dynamic Exams */}
      {activeSubTab === 'exams' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg border border-geom-border shadow-geom space-y-4 h-fit">
            <h3 className="font-extrabold text-zinc-900 text-xs uppercase tracking-wider">Add New Exam Tracker</h3>
            <form onSubmit={handleCreateExam} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Exam Type</label>
                <select
                  value={examForm.type}
                  onChange={(e) => setExamForm(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 bg-zinc-50 border border-geom-border rounded-md text-zinc-900 font-semibold focus:outline-none focus:border-zinc-950"
                >
                  <option value="entrance">Entrance Exam</option>
                  <option value="competitive">Competitive Exam</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Exam Code / ID</label>
                <input
                  type="text"
                  placeholder="e.g. jee-main"
                  value={examForm.id}
                  onChange={(e) => setExamForm(prev => ({ ...prev, id: e.target.value }))}
                  className="w-full px-3 py-2 bg-zinc-50 border border-geom-border rounded-md text-zinc-900 font-semibold focus:outline-none focus:border-zinc-950"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Display Name</label>
                <input
                  type="text"
                  placeholder="e.g. JEE Main"
                  value={examForm.name}
                  onChange={(e) => setExamForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-zinc-50 border border-geom-border rounded-md text-zinc-900 font-semibold focus:outline-none focus:border-zinc-950"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Description</label>
                <textarea
                  placeholder="Short brief of this examination syllabus..."
                  value={examForm.description}
                  onChange={(e) => setExamForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 bg-zinc-50 border border-geom-border rounded-md text-zinc-900 font-semibold focus:outline-none focus:border-zinc-950 h-20"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-850 text-white rounded-sm font-bold uppercase tracking-wider cursor-pointer border border-zinc-900 shadow-geom-sm text-xs"
              >
                {loading ? 'Creating...' : 'Register Exam'}
              </button>
            </form>
          </div>

          <div className="md:col-span-2 bg-white p-6 rounded-lg border border-geom-border shadow-geom space-y-5">
            <h3 className="font-extrabold text-zinc-900 text-sm uppercase tracking-wider">Active Exam Trackers</h3>
            
            <div className="space-y-5">
              <div>
                <h4 className="text-[9px] uppercase tracking-wider font-extrabold text-zinc-400 mb-2.5">Entrance Exams</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {entranceExams.map(exam => (
                    <div key={exam.id} className="p-3.5 bg-zinc-50 border border-geom-border rounded-md flex justify-between items-start hover:border-zinc-350 transition-all">
                      <div>
                        <h5 className="font-bold text-zinc-900 text-xs">{exam.name}</h5>
                        <p className="text-[10px] text-zinc-500 mt-1 font-medium">{exam.description}</p>
                      </div>
                      <button 
                        onClick={() => handleDeleteExam(exam.id, 'entrance')}
                        className="text-zinc-400 hover:text-red-600 p-1 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-geom-border">
                <h4 className="text-[9px] uppercase tracking-wider font-extrabold text-zinc-400 mb-2.5">Competitive Exams</h4>
                {competitiveExams.length === 0 ? (
                  <p className="text-xs text-zinc-400 font-medium">No dynamic competitive exams mapped.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {competitiveExams.map(exam => (
                      <div key={exam.id} className="p-3.5 bg-zinc-50 border border-geom-border rounded-md flex justify-between items-start hover:border-zinc-350 transition-all">
                        <div>
                          <h5 className="font-bold text-zinc-900 text-xs">{exam.name}</h5>
                          <p className="text-[10px] text-zinc-500 mt-1 font-medium">{exam.description}</p>
                        </div>
                        <button 
                          onClick={() => handleDeleteExam(exam.id, 'competitive')}
                          className="text-zinc-400 hover:text-red-600 p-1 cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Subjects & Chapters */}
      {activeSubTab === 'subjects' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Create Subject */}
          <div className="bg-white p-6 rounded-lg border border-geom-border shadow-geom space-y-4">
            <h3 className="font-extrabold text-zinc-900 text-xs uppercase tracking-wider">Add Subject</h3>
            <form onSubmit={handleCreateSubject} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Subject ID Code</label>
                <input
                  type="text"
                  placeholder="e.g. physics"
                  value={subjectForm.id}
                  onChange={(e) => setSubjectForm(prev => ({ ...prev, id: e.target.value }))}
                  className="w-full px-3 py-2 bg-zinc-50 border border-geom-border rounded-md text-zinc-900 font-semibold focus:outline-none focus:border-zinc-950"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Subject Name</label>
                <input
                  type="text"
                  placeholder="e.g. Physics"
                  value={subjectForm.name}
                  onChange={(e) => setSubjectForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-zinc-50 border border-geom-border rounded-md text-zinc-900 font-semibold focus:outline-none focus:border-zinc-950"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Map to Exam</label>
                <select
                  value={subjectForm.examId}
                  onChange={(e) => setSubjectForm(prev => ({ ...prev, examId: e.target.value }))}
                  className="w-full px-3 py-2 bg-zinc-50 border border-geom-border rounded-md text-zinc-900 font-semibold focus:outline-none focus:border-zinc-950"
                  required
                >
                  <option value="">-- Choose Exam --</option>
                  {[...entranceExams, ...competitiveExams].map(ex => (
                    <option key={ex.id} value={ex.id}>{ex.name}</option>
                  ))}
                </select>
              </div>
              <button 
                type="submit" 
                className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-850 text-white rounded-sm font-bold uppercase tracking-wider cursor-pointer border border-zinc-900 shadow-geom-sm text-xs"
              >
                Register Subject
              </button>
            </form>
          </div>

          {/* Create Chapter */}
          <div className="bg-white p-6 rounded-lg border border-geom-border shadow-geom space-y-4">
            <h3 className="font-extrabold text-zinc-900 text-xs uppercase tracking-wider">Add Chapter under Subject</h3>
            <form onSubmit={handleCreateChapter} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Parent Subject</label>
                <select
                  value={chapterForm.subjectId}
                  onChange={(e) => setChapterForm(prev => ({ ...prev, subjectId: e.target.value }))}
                  className="w-full px-3 py-2 bg-zinc-50 border border-geom-border rounded-md text-zinc-900 font-semibold focus:outline-none focus:border-zinc-950"
                  required
                >
                  <option value="">-- Choose Subject --</option>
                  {subjects.map(sub => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Chapter ID Code</label>
                <input
                  type="text"
                  placeholder="e.g. kinematics"
                  value={chapterForm.id}
                  onChange={(e) => setChapterForm(prev => ({ ...prev, id: e.target.value }))}
                  className="w-full px-3 py-2 bg-zinc-50 border border-geom-border rounded-md text-zinc-900 font-semibold focus:outline-none focus:border-zinc-950"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Chapter Name</label>
                <input
                  type="text"
                  placeholder="e.g. Kinematics"
                  value={chapterForm.name}
                  onChange={(e) => setChapterForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-zinc-50 border border-geom-border rounded-md text-zinc-900 font-semibold focus:outline-none focus:border-zinc-950"
                  required
                />
              </div>
              <button 
                type="submit" 
                className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-850 text-white rounded-sm font-bold uppercase tracking-wider cursor-pointer border border-zinc-900 shadow-geom-sm text-xs"
              >
                Register Chapter
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tab: Study Material */}
      {activeSubTab === 'materials' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg border border-geom-border shadow-geom space-y-4 h-fit">
            <h3 className="font-extrabold text-zinc-900 text-xs uppercase tracking-wider">Post Study Reference</h3>
            <form onSubmit={handleCreateMaterial} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Exam Track</label>
                <select
                  value={materialForm.examId}
                  onChange={(e) => setMaterialForm(prev => ({ ...prev, examId: e.target.value }))}
                  className="w-full px-3 py-2 bg-zinc-50 border border-geom-border rounded-md text-zinc-900 font-semibold focus:outline-none focus:border-zinc-950"
                  required
                >
                  <option value="">-- Choose Exam --</option>
                  {[...entranceExams, ...competitiveExams].map(ex => (
                    <option key={ex.id} value={ex.id}>{ex.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Subject</label>
                <select
                  value={materialForm.subjectId}
                  onChange={(e) => setMaterialForm(prev => ({ ...prev, subjectId: e.target.value }))}
                  className="w-full px-3 py-2 bg-zinc-50 border border-geom-border rounded-md text-zinc-900 font-semibold focus:outline-none focus:border-zinc-950"
                  required
                >
                  <option value="">-- Choose Subject --</option>
                  {subjects.map(sub => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Chapter</label>
                <select
                  value={materialForm.chapterId}
                  onChange={(e) => setMaterialForm(prev => ({ ...prev, chapterId: e.target.value }))}
                  className="w-full px-3 py-2 bg-zinc-50 border border-geom-border rounded-md text-zinc-900 font-semibold focus:outline-none focus:border-zinc-950"
                  required
                >
                  <option value="">-- Choose Chapter --</option>
                  {chapters.filter(c => !materialForm.subjectId || c.subjectId === materialForm.subjectId).map(ch => (
                    <option key={ch.id} value={ch.id}>{ch.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Format</label>
                <select
                  value={materialForm.type}
                  onChange={(e) => setMaterialForm(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full px-3 py-2 bg-zinc-50 border border-geom-border rounded-md text-zinc-900 font-semibold focus:outline-none focus:border-zinc-950"
                >
                  <option value="pdf">PDF Download</option>
                  <option value="notes">Quick Revision Notes</option>
                  <option value="link">Reference Web Link</option>
                  <option value="video">Video Lecture</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Title</label>
                <input
                  type="text"
                  placeholder="e.g. Kinematics Revision Sheet"
                  value={materialForm.title}
                  onChange={(e) => setMaterialForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 bg-zinc-50 border border-geom-border rounded-md text-zinc-900 font-semibold focus:outline-none focus:border-zinc-950"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">File or Reference URL</label>
                <input
                  type="text"
                  placeholder="https://example.com/material.pdf"
                  value={materialForm.url}
                  onChange={(e) => setMaterialForm(prev => ({ ...prev, url: e.target.value }))}
                  className="w-full px-3 py-2 bg-zinc-50 border border-geom-border rounded-md text-zinc-900 font-semibold focus:outline-none focus:border-zinc-950"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Description</label>
                <textarea
                  placeholder="Short brief of topics compiled..."
                  value={materialForm.description}
                  onChange={(e) => setMaterialForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 bg-zinc-50 border border-geom-border rounded-md text-zinc-900 font-semibold focus:outline-none focus:border-zinc-950 h-20"
                />
              </div>
              <button 
                type="submit" 
                className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-850 text-white rounded-sm font-bold uppercase tracking-wider cursor-pointer border border-zinc-900 shadow-geom-sm text-xs"
              >
                Publish Material
              </button>
            </form>
          </div>

          <div className="md:col-span-2 bg-white p-6 rounded-lg border border-geom-border shadow-geom space-y-4">
            <h3 className="font-extrabold text-zinc-900 text-sm uppercase tracking-wider">Study Catalog Lists</h3>
            <div className="space-y-3">
              {materials.length === 0 ? (
                <div className="p-8 text-center text-zinc-400 font-semibold">No materials posted yet.</div>
              ) : (
                materials.map(mat => (
                  <div key={mat.id} className="p-3.5 bg-zinc-50 border border-geom-border rounded-md flex justify-between items-center text-xs hover:border-zinc-350 transition-all">
                    <div>
                      <h5 className="font-bold text-zinc-900">{mat.title}</h5>
                      <span className="text-[10px] text-zinc-450 font-bold uppercase tracking-wider block mt-1">
                        Type: {mat.type.toUpperCase()} • Subject: {mat.subjectId}
                      </span>
                    </div>
                    <button 
                      onClick={() => handleDeleteItem('studyMaterials', mat.id)}
                      className="text-zinc-400 hover:text-red-650 cursor-pointer p-1 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Question Bank */}
      {activeSubTab === 'questions' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg border border-geom-border shadow-geom space-y-4 h-fit">
            <h3 className="font-extrabold text-zinc-900 text-xs uppercase tracking-wider">Add MCQ Item</h3>
            <form onSubmit={handleCreateQuestion} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Parent Subject</label>
                <select
                  value={questionForm.subjectId}
                  onChange={(e) => setQuestionForm(prev => ({ ...prev, subjectId: e.target.value }))}
                  className="w-full px-3 py-2 bg-zinc-50 border border-geom-border rounded-md text-zinc-900 font-semibold focus:outline-none focus:border-zinc-950"
                  required
                >
                  <option value="">-- Choose Subject --</option>
                  {subjects.map(sub => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Parent Chapter</label>
                <select
                  value={questionForm.chapterId}
                  onChange={(e) => setQuestionForm(prev => ({ ...prev, chapterId: e.target.value }))}
                  className="w-full px-3 py-2 bg-zinc-50 border border-geom-border rounded-md text-zinc-900 font-semibold focus:outline-none focus:border-zinc-950"
                  required
                >
                  <option value="">-- Choose Chapter --</option>
                  {chapters.filter(c => !questionForm.subjectId || c.subjectId === questionForm.subjectId).map(ch => (
                    <option key={ch.id} value={ch.id}>{ch.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Question Body</label>
                <textarea
                  placeholder="Enter standard question text..."
                  value={questionForm.questionText}
                  onChange={(e) => setQuestionForm(prev => ({ ...prev, questionText: e.target.value }))}
                  className="w-full px-3 py-2 bg-zinc-50 border border-geom-border rounded-md text-zinc-900 font-semibold focus:outline-none focus:border-zinc-950 h-20"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Option A</label>
                  <input type="text" placeholder="Option A" value={questionForm.oA} onChange={(e) => setQuestionForm(prev => ({ ...prev, oA: e.target.value }))} className="w-full px-3 py-2 bg-zinc-50 border border-geom-border rounded-md text-zinc-900 font-semibold focus:outline-none focus:border-zinc-950" required />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Option B</label>
                  <input type="text" placeholder="Option B" value={questionForm.oB} onChange={(e) => setQuestionForm(prev => ({ ...prev, oB: e.target.value }))} className="w-full px-3 py-2 bg-zinc-50 border border-geom-border rounded-md text-zinc-900 font-semibold focus:outline-none focus:border-zinc-950" required />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Option C</label>
                  <input type="text" placeholder="Option C" value={questionForm.oC} onChange={(e) => setQuestionForm(prev => ({ ...prev, oC: e.target.value }))} className="w-full px-3 py-2 bg-zinc-50 border border-geom-border rounded-md text-zinc-900 font-semibold focus:outline-none focus:border-zinc-950" required />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Option D</label>
                  <input type="text" placeholder="Option D" value={questionForm.oD} onChange={(e) => setQuestionForm(prev => ({ ...prev, oD: e.target.value }))} className="w-full px-3 py-2 bg-zinc-50 border border-geom-border rounded-md text-zinc-900 font-semibold focus:outline-none focus:border-zinc-950" required />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Correct Answer Index</label>
                <select
                  value={questionForm.correctAnswerIndex}
                  onChange={(e) => setQuestionForm(prev => ({ ...prev, correctAnswerIndex: Number(e.target.value) }))}
                  className="w-full px-3 py-2 bg-zinc-50 border border-geom-border rounded-md text-zinc-900 font-semibold focus:outline-none focus:border-zinc-950"
                >
                  <option value={0}>Option A</option>
                  <option value={1}>Option B</option>
                  <option value={2}>Option C</option>
                  <option value={3}>Option D</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Detailed Explanation</label>
                <textarea
                  placeholder="Write the formal derivation/solution justification..."
                  value={questionForm.explanation}
                  onChange={(e) => setQuestionForm(prev => ({ ...prev, explanation: e.target.value }))}
                  className="w-full px-3 py-2 bg-zinc-50 border border-geom-border rounded-md text-zinc-900 font-semibold focus:outline-none focus:border-zinc-950 h-20"
                />
              </div>
              <button 
                type="submit" 
                className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-850 text-white rounded-sm font-bold uppercase tracking-wider cursor-pointer border border-zinc-900 shadow-geom-sm text-xs"
              >
                Commit Question
              </button>
            </form>
          </div>

          <div className="md:col-span-2 bg-white p-6 rounded-lg border border-geom-border shadow-geom space-y-4">
            <h3 className="font-extrabold text-zinc-900 text-sm uppercase tracking-wider">Question Bank Matrix</h3>
            <div className="space-y-3">
              {questions.length === 0 ? (
                <div className="p-8 text-center text-zinc-400 font-semibold">No questions in the central bank yet.</div>
              ) : (
                questions.map(q => (
                  <div key={q.id} className="p-3.5 bg-zinc-50 border border-geom-border rounded-md flex justify-between items-start text-xs hover:border-zinc-350 transition-all">
                    <div className="space-y-1.5">
                      <span className="inline-flex items-center px-2 py-0.5 bg-zinc-900 text-zinc-100 font-bold text-[8px] rounded-sm uppercase tracking-wider">
                        {q.subjectId}
                      </span>
                      <p className="font-bold text-zinc-900 line-clamp-2 leading-relaxed">{q.questionText}</p>
                    </div>
                    <button 
                      onClick={() => handleDeleteItem('questions', q.id)}
                      className="text-zinc-400 hover:text-red-655 p-1 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Timetable Scheduling */}
      {activeSubTab === 'timetables' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg border border-geom-border shadow-geom space-y-4 h-fit">
            <h3 className="font-extrabold text-zinc-900 text-xs uppercase tracking-wider">Create Daily Study Slot</h3>
            <form onSubmit={handleCreateTimetable} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Target Exam</label>
                <select
                  value={timetableForm.examId}
                  onChange={(e) => setTimetableForm(prev => ({ ...prev, examId: e.target.value }))}
                  className="w-full px-3 py-2 bg-zinc-50 border border-geom-border rounded-md text-zinc-900 font-semibold focus:outline-none focus:border-zinc-950"
                  required
                >
                  <option value="">-- Choose Exam --</option>
                  {[...entranceExams, ...competitiveExams].map(ex => (
                    <option key={ex.id} value={ex.id}>{ex.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Student Year Track</label>
                  <select
                    value={timetableForm.studentType}
                    onChange={(e) => setTimetableForm(prev => ({ ...prev, studentType: e.target.value }))}
                    className="w-full px-3 py-2 bg-zinc-50 border border-geom-border rounded-md text-zinc-900 font-semibold focus:outline-none focus:border-zinc-950"
                  >
                    <option value="first_year">1st Year</option>
                    <option value="second_year">2nd Year</option>
                    <option value="long_term">Long Term</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Study Plan Duration</label>
                  <select
                    value={timetableForm.studyPlan}
                    onChange={(e) => setTimetableForm(prev => ({ ...prev, studyPlan: e.target.value }))}
                    className="w-full px-3 py-2 bg-zinc-50 border border-geom-border rounded-md text-zinc-900 font-semibold focus:outline-none focus:border-zinc-950"
                  >
                    <option value="quarterly">Quarterly</option>
                    <option value="half_yearly">Half Yearly</option>
                    <option value="academic_year">Academic Year</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Subject</label>
                  <select
                    value={timetableForm.subjectId}
                    onChange={(e) => setTimetableForm(prev => ({ ...prev, subjectId: e.target.value }))}
                    className="w-full px-3 py-2 bg-zinc-50 border border-geom-border rounded-md text-zinc-900 font-semibold focus:outline-none focus:border-zinc-950"
                    required
                  >
                    <option value="">-- Subject --</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Chapter</label>
                  <select
                    value={timetableForm.chapterId}
                    onChange={(e) => setTimetableForm(prev => ({ ...prev, chapterId: e.target.value }))}
                    className="w-full px-3 py-2 bg-zinc-50 border border-geom-border rounded-md text-zinc-900 font-semibold focus:outline-none focus:border-zinc-950"
                    required
                  >
                    <option value="">-- Chapter --</option>
                    {chapters.filter(c => !timetableForm.subjectId || c.subjectId === timetableForm.subjectId).map(ch => (
                      <option key={ch.id} value={ch.id}>{ch.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Execution Date</label>
                <input
                  type="date"
                  value={timetableForm.date}
                  onChange={(e) => setTimetableForm(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 bg-zinc-50 border border-geom-border rounded-md text-zinc-900 font-semibold focus:outline-none focus:border-zinc-950"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Schedule Slot Title</label>
                <input
                  type="text"
                  placeholder="e.g. Morning Kinematics Practice"
                  value={timetableForm.title}
                  onChange={(e) => setTimetableForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 bg-zinc-50 border border-geom-border rounded-md text-zinc-900 font-semibold focus:outline-none focus:border-zinc-950"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Study Material instructions</label>
                <textarea
                  placeholder="What topics should they study?"
                  value={timetableForm.studyTopic}
                  onChange={(e) => setTimetableForm(prev => ({ ...prev, studyTopic: e.target.value }))}
                  className="w-full px-3 py-2 bg-zinc-50 border border-geom-border rounded-md text-zinc-900 font-semibold focus:outline-none focus:border-zinc-950 h-20"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Practice MCQ Limit</label>
                  <input type="number" value={timetableForm.practiceMCQsCount} onChange={(e) => setTimetableForm(prev => ({ ...prev, practiceMCQsCount: Number(e.target.value) }))} className="w-full px-3 py-2 bg-zinc-50 border border-geom-border rounded-md text-zinc-900 font-semibold focus:outline-none focus:border-zinc-950" required />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Revision topic</label>
                  <input type="text" placeholder="Formula revision" value={timetableForm.revisionTopic} onChange={(e) => setTimetableForm(prev => ({ ...prev, revisionTopic: e.target.value }))} className="w-full px-3 py-2 bg-zinc-50 border border-geom-border rounded-md text-zinc-900 font-semibold focus:outline-none focus:border-zinc-950" />
                </div>
              </div>
              <button 
                type="submit" 
                className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-850 text-white rounded-sm font-bold uppercase tracking-wider cursor-pointer border border-zinc-900 shadow-geom-sm text-xs"
              >
                Commit Day Slot
              </button>
            </form>
          </div>

          <div className="md:col-span-2 bg-white p-6 rounded-lg border border-geom-border shadow-geom space-y-4">
            <h3 className="font-extrabold text-zinc-900 text-sm uppercase tracking-wider">Active Academic Schedules</h3>
            <div className="space-y-3">
              {timetables.length === 0 ? (
                <div className="p-8 text-center text-zinc-400 font-semibold">No daily schedules mapped yet.</div>
              ) : (
                timetables.map(tt => (
                  <div key={tt.id} className="p-3.5 bg-zinc-50 border border-geom-border rounded-md flex justify-between items-center text-xs hover:border-zinc-350 transition-all">
                    <div>
                      <h5 className="font-bold text-zinc-900">{tt.title}</h5>
                      <span className="text-[10px] text-zinc-450 font-bold uppercase tracking-wider block mt-1">
                        Date: {tt.date} • Exam: {tt.examId} • Study plan: {tt.studyPlan}
                      </span>
                    </div>
                    <button 
                      onClick={() => handleDeleteItem('timetables', tt.id)}
                      className="text-zinc-400 hover:text-red-655 cursor-pointer p-1 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Test Configurator */}
      {activeSubTab === 'tests' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg border border-geom-border shadow-geom space-y-4 h-fit">
            <h3 className="font-extrabold text-zinc-900 text-xs uppercase tracking-wider">Configure Mock Exam</h3>
            <form onSubmit={handleCreateTest} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Exam Title</label>
                <input
                  type="text"
                  placeholder="Weekly Test: Mechanics Mastery"
                  value={testForm.title}
                  onChange={(e) => setTestForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 bg-zinc-50 border border-geom-border rounded-md text-zinc-900 font-semibold focus:outline-none focus:border-zinc-950"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Brief Description</label>
                <textarea
                  placeholder="Testing guidelines and curriculum tested..."
                  value={testForm.description}
                  onChange={(e) => setTestForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 bg-zinc-50 border border-geom-border rounded-md text-zinc-900 font-semibold focus:outline-none focus:border-zinc-950 h-16"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Format Type</label>
                  <select
                    value={testForm.type}
                    onChange={(e) => setTestForm(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-zinc-50 border border-geom-border rounded-md text-zinc-900 font-semibold focus:outline-none focus:border-zinc-950"
                  >
                    <option value="weekly">Weekly Test</option>
                    <option value="monthly">Monthly Test</option>
                    <option value="practice">Practice Quiz</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Duration (min)</label>
                  <input type="number" value={testForm.duration} onChange={(e) => setTestForm(prev => ({ ...prev, duration: Number(e.target.value) }))} className="w-full px-3 py-2 bg-zinc-50 border border-geom-border rounded-md text-zinc-900 font-semibold focus:outline-none focus:border-zinc-950" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Total Max Marks</label>
                  <input type="number" value={testForm.totalMarks} onChange={(e) => setTestForm(prev => ({ ...prev, totalMarks: Number(e.target.value) }))} className="w-full px-3 py-2 bg-zinc-50 border border-geom-border rounded-md text-zinc-900 font-semibold focus:outline-none focus:border-zinc-950" required />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input type="checkbox" checked={testForm.negativeMarking} onChange={(e) => setTestForm(prev => ({ ...prev, negativeMarking: e.target.checked }))} className="rounded accent-zinc-900 w-4 h-4 cursor-pointer" />
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider cursor-pointer">Apply Negatives</label>
                </div>
              </div>
              <div className="p-3 bg-zinc-50 rounded-md border border-geom-border text-[11px] text-zinc-600 font-medium">
                <span className="font-extrabold text-zinc-900 block mb-1 uppercase tracking-wider text-[10px]">Selected Questions ({testForm.selectedQIds.length}):</span>
                {testForm.selectedQIds.length === 0 ? 'No questions linked. Tick questions in the panel beside.' : `Associated: ${testForm.selectedQIds.join(', ')}`}
              </div>
              <button 
                type="submit" 
                className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-850 text-white rounded-sm font-bold uppercase tracking-wider cursor-pointer border border-zinc-900 shadow-geom-sm text-xs"
              >
                Publish Mock Exam
              </button>
            </form>
          </div>

          <div className="md:col-span-2 bg-white p-6 rounded-lg border border-geom-border shadow-geom space-y-4">
            <h3 className="font-extrabold text-zinc-900 text-sm uppercase tracking-wider">Select Question bank Items to Pack in Test</h3>
            <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
              {questions.length === 0 ? (
                <div className="p-8 text-center text-zinc-400 font-semibold">No questions available in the question bank yet.</div>
              ) : (
                questions.map(q => {
                  const active = testForm.selectedQIds.includes(q.id);
                  return (
                    <div 
                      key={q.id} 
                      onClick={() => toggleFormQSelection(q.id)}
                      className={`p-3.5 rounded-md border transition-all cursor-pointer flex items-center justify-between text-xs ${
                        active 
                          ? 'bg-zinc-900 border-zinc-950 text-white' 
                          : 'bg-zinc-50 border-geom-border hover:bg-zinc-100 text-zinc-600'
                      }`}
                    >
                      <div className="space-y-1">
                        <span className={`font-bold text-[10px] uppercase tracking-wider ${active ? 'text-zinc-300' : 'text-zinc-800'}`}>
                          ID: {q.id} ({q.subjectId})
                        </span>
                        <p className={`line-clamp-1 leading-relaxed ${active ? 'text-zinc-100' : 'text-zinc-650'}`}>{q.questionText}</p>
                      </div>
                      {active ? (
                        <Check className="w-4.5 h-4.5 text-zinc-100" />
                      ) : (
                        <div className="w-4 h-4 rounded-sm border border-zinc-300 bg-white"></div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Announcements & Alerts */}
      {activeSubTab === 'announcements' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Form: Broadcast Announcement */}
            <div className="bg-white p-6 rounded-lg border border-geom-border shadow-geom space-y-4">
              <div>
                <h3 className="font-extrabold text-zinc-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Volume2 className="w-4.5 h-4.5 text-zinc-800" /> Broadcast Academic Bulletin
                </h3>
                <p className="text-zinc-500 text-[10px] mt-0.5">Post an announcement that appears on student dashboards.</p>
              </div>

              <form onSubmit={handleCreateAnnouncement} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Bulletin Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Mechanics Homework Deadline Extended"
                    value={announcementForm.title}
                    onChange={(e) => setAnnouncementForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 bg-zinc-50 border border-geom-border rounded-md text-zinc-900 font-semibold focus:outline-none focus:border-zinc-950"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Content Body</label>
                  <textarea
                    rows={4}
                    placeholder="Provide detailed instructions, updates, or hyperlinks..."
                    value={announcementForm.content}
                    onChange={(e) => setAnnouncementForm(prev => ({ ...prev, content: e.target.value }))}
                    className="w-full px-3 py-2 bg-zinc-50 border border-geom-border rounded-md text-zinc-900 font-semibold focus:outline-none focus:border-zinc-950"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Target Exams (Optional)</label>
                  <p className="text-[10px] text-zinc-450 mb-1.5">Leave empty to broadcast to all students, or select specific targets:</p>
                  <div className="grid grid-cols-2 gap-2 max-h-[120px] overflow-y-auto border border-geom-border p-2.5 rounded-md bg-zinc-50/50">
                    {[...entranceExams, ...competitiveExams].map(ex => {
                      const selected = announcementForm.targetExams.includes(ex.id);
                      return (
                        <div 
                          key={ex.id}
                          onClick={() => {
                            setAnnouncementForm(prev => {
                              const updated = prev.targetExams.includes(ex.id)
                                ? prev.targetExams.filter(id => id !== ex.id)
                                : [...prev.targetExams, ex.id];
                              return { ...prev, targetExams: updated };
                            });
                          }}
                          className={`p-1.5 rounded border text-[10px] font-bold cursor-pointer transition-all flex items-center justify-between ${
                            selected ? 'bg-zinc-900 text-white border-zinc-950' : 'bg-white border-geom-border hover:bg-zinc-100 text-zinc-600'
                          }`}
                        >
                          <span className="truncate">{ex.name}</span>
                          {selected && <Check className="w-3 h-3 text-white shrink-0" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-850 text-white rounded-sm font-bold uppercase tracking-wider cursor-pointer border border-zinc-900 shadow-geom-sm text-xs flex items-center justify-center gap-1.5"
                >
                  <Volume2 className="w-4 h-4" /> Broadcast Bulletin
                </button>
              </form>
            </div>

            {/* Form: Dispatch Personal Student Alert */}
            <div className="bg-white p-6 rounded-lg border border-geom-border shadow-geom space-y-4">
              <div>
                <h3 className="font-extrabold text-zinc-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Bell className="w-4.5 h-4.5 text-zinc-800" /> Dispatch Personal Student Alert
                </h3>
                <p className="text-zinc-500 text-[10px] mt-0.5">Send a target real-time notification alert directly to a specific student feed.</p>
              </div>

              <form onSubmit={handleCreateNotification} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Select Target Student</label>
                  <select
                    value={notificationForm.studentId}
                    onChange={(e) => setNotificationForm(prev => ({ ...prev, studentId: e.target.value }))}
                    className="w-full px-3 py-2 bg-zinc-50 border border-geom-border rounded-md text-zinc-900 font-semibold focus:outline-none focus:border-zinc-950"
                    required
                  >
                    <option value="">-- Choose Student --</option>
                    <option value="all">Broadcast Alert to All Registered Students</option>
                    {students.map(std => (
                      <option key={std.uid} value={std.uid}>{std.name} ({std.email})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Alert Subject Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Schedule Change: Maths Lesson"
                    value={notificationForm.title}
                    onChange={(e) => setNotificationForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 bg-zinc-50 border border-geom-border rounded-md text-zinc-900 font-semibold focus:outline-none focus:border-zinc-950"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Alert Message Body</label>
                  <textarea
                    rows={4}
                    placeholder="Write a clear, concise alert instruction..."
                    value={notificationForm.message}
                    onChange={(e) => setNotificationForm(prev => ({ ...prev, message: e.target.value }))}
                    className="w-full px-3 py-2 bg-zinc-50 border border-geom-border rounded-md text-zinc-900 font-semibold focus:outline-none focus:border-zinc-950"
                    required
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-850 text-white rounded-sm font-bold uppercase tracking-wider cursor-pointer border border-zinc-900 shadow-geom-sm text-xs flex items-center justify-center gap-1.5"
                >
                  <Bell className="w-4 h-4" /> Dispatch targeted Alert
                </button>
              </form>
            </div>

          </div>

          {/* Active Broadcasts Bulletin List */}
          <div className="bg-white p-6 rounded-lg border border-geom-border shadow-geom space-y-4">
            <h3 className="font-extrabold text-zinc-900 text-sm uppercase tracking-wider">Active Broadcasted Bulletins ({announcements.length})</h3>
            
            {announcements.length === 0 ? (
              <div className="text-center py-10 bg-zinc-50 border border-geom-border rounded-md text-xs font-semibold text-zinc-400">
                No bulletins published yet. Click above to broadcast.
              </div>
            ) : (
              <div className="space-y-3">
                {announcements.map((ann) => (
                  <div key={ann.id} className="p-4 rounded-md border border-geom-border bg-zinc-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono font-bold text-zinc-400">
                          ID: {ann.id}
                        </span>
                        <span className="text-[9px] text-zinc-400 font-semibold">• Published: {new Date(ann.createdAt).toLocaleString()}</span>
                        {ann.targetExams && ann.targetExams.length > 0 && (
                          <div className="flex gap-1 text-[8px] font-bold uppercase">
                            {ann.targetExams.map(exId => (
                              <span key={exId} className="px-1.5 py-0.5 bg-zinc-200 text-zinc-750 rounded-xs border border-zinc-300">
                                {exId}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <h4 className="font-bold text-zinc-900 text-sm">{ann.title}</h4>
                      <p className="text-zinc-650 leading-relaxed max-w-4xl">{ann.content}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteAnnouncement(ann.id)}
                      className="shrink-0 p-1.5 rounded-sm border border-geom-border bg-white hover:bg-rose-50 text-zinc-400 hover:text-red-600 transition-all cursor-pointer shadow-geom-sm"
                      title="Remove Bulletin"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
