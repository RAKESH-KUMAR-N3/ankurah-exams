import React, { useState } from 'react';
import { 
  User, EntranceExam, CompetitiveExam, Subject, Chapter, 
  Question, Test, Timetable, StudyMaterial, Announcement, Notification 
} from '../types';
import { 
  Shield, Plus, Trash, Database, FileText, Calendar, BookOpen, 
  Check, AlertCircle, Trash2, Mail, Bell, RefreshCw, Volume2
} from 'lucide-react';

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
  const [examForm, setExamForm] = useState({ id: '', name: '', description: '', type: 'entrance' });
  const [subjectForm, setSubjectForm] = useState({ id: '', name: '', examId: '', description: '' });
  const [chapterForm, setChapterForm] = useState({ id: '', subjectId: '', name: '', description: '' });
  const [materialForm, setMaterialForm] = useState({ id: '', examId: '', subjectId: '', chapterId: '', type: 'pdf' as any, title: '', url: '', description: '' });
  const [timetableForm, setTimetableForm] = useState({ id: '', examId: '', studentType: 'long_term', studyPlan: 'yearly', subjectId: '', chapterId: '', date: '', title: '', studyTopic: '', practiceMCQsCount: 10, revisionTopic: '', assignment: '' });
  const [questionForm, setQuestionForm] = useState({ id: '', subjectId: '', chapterId: '', questionText: '', oA: '', oB: '', oC: '', oD: '', correctAnswerIndex: 0, difficulty: 'medium' as any, marks: 4, negativeMarks: 1, tags: '', explanation: '' });
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
    const cleanId = examForm.id.toLowerCase().replace(/\s+/g, '-');
    
    try {
      const res = await fetch(`${API_URL}/api/exams`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          id: cleanId,
          name: examForm.name,
          description: examForm.description,
          type: examForm.type
        })
      });
      if (!res.ok) throw new Error('Failed to create exam');
      setExamForm({ id: '', name: '', description: '', type: 'entrance' });
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
          questions: testForm.selectedQIds
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
              <span className="text-4xl font-black text-slate-800">{students.length}</span>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Question Bank</span>
              <span className="text-4xl font-black text-slate-800">{questions.length} <span className="text-xs font-semibold text-slate-400">items</span></span>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Study Catalog</span>
              <span className="text-4xl font-black text-slate-800">{materials.length} <span className="text-xs font-semibold text-slate-400">PDFs</span></span>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Schedules Mapped</span>
              <span className="text-4xl font-black text-slate-800">{timetables.length} <span className="text-xs font-semibold text-slate-400">Days</span></span>
            </div>
          </div>
        </>
      )}

      {/* --- SUBTAB PANELS --- */}
      <div className="grid grid-cols-1 gap-8 pt-4">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-800">Register New Academic Target</h3>
              <form onSubmit={handleCreateExam} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Target ID (e.g. jee-main)</label>
                  <input
                    type="text"
                    value={examForm.id}
                    onChange={(e) => setExamForm({ ...examForm, id: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Name</label>
                  <input
                    type="text"
                    value={examForm.name}
                    onChange={(e) => setExamForm({ ...examForm, name: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Description</label>
                  <textarea
                    value={examForm.description}
                    onChange={(e) => setExamForm({ ...examForm, description: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none h-20"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Exam Type</label>
                  <select
                    value={examForm.type}
                    onChange={(e) => setExamForm({ ...examForm, type: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none"
                  >
                    <option value="entrance">Entrance Test</option>
                    <option value="competitive">Competitive Exam</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="py-2 px-6 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-wider cursor-pointer"
                >
                  Create Target
                </button>
              </form>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-800">Active Target Profiles</h3>
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                <div>
                  <h4 className="font-bold text-xs uppercase text-slate-400 mb-2">Entrance Exams</h4>
                  {entranceExams.map(ex => (
                    <div key={ex.id} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-2xl mb-2 text-xs">
                      <span className="font-bold text-slate-800">{ex.name}</span>
                      <button onClick={() => handleDeleteExam(ex.id, 'entrance')} className="text-red-500 hover:text-red-700 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
                <div>
                  <h4 className="font-bold text-xs uppercase text-slate-400 mb-2">Competitive Exams</h4>
                  {competitiveExams.map(ex => (
                    <div key={ex.id} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-2xl mb-2 text-xs">
                      <span className="font-bold text-slate-800">{ex.name}</span>
                      <button onClick={() => handleDeleteExam(ex.id, 'competitive')} className="text-red-500 hover:text-red-700 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'subjects' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-800">Create Academic Subject</h3>
              <form onSubmit={handleCreateSubject} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Subject ID (e.g. organic-chemistry)</label>
                  <input
                    type="text"
                    value={subjectForm.id}
                    onChange={(e) => setSubjectForm({ ...subjectForm, id: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Name</label>
                  <input
                    type="text"
                    value={subjectForm.name}
                    onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none"
                    required
                  />
                </div>
                <div>
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
                <button
                  type="submit"
                  disabled={loading}
                  className="py-2 px-6 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-wider cursor-pointer"
                >
                  Create Subject
                </button>
              </form>

              <hr className="border-slate-100 my-6" />

              <h3 className="text-lg font-bold text-slate-800">Create Chapter Mapping</h3>
              <form onSubmit={handleCreateChapter} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Chapter ID (e.g. chemical-bonding)</label>
                  <input
                    type="text"
                    value={chapterForm.id}
                    onChange={(e) => setChapterForm({ ...chapterForm, id: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Name / Title</label>
                  <input
                    type="text"
                    value={chapterForm.name}
                    onChange={(e) => setChapterForm({ ...chapterForm, name: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none"
                    required
                  />
                </div>
                <div>
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
                <button
                  type="submit"
                  disabled={loading}
                  className="py-2 px-6 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-wider cursor-pointer"
                >
                  Create Chapter
                </button>
              </form>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-800">Academic Structure</h3>
              <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2">
                {subjects.map(sub => {
                  const subChapters = chapters.filter(c => c.subjectId === sub.id);
                  return (
                    <div key={sub.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-950 text-sm">{sub.name}</span>
                        <button onClick={() => handleDeleteSubject(sub.id)} className="text-red-500 hover:text-red-700 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                      </div>
                      <div className="pl-4 border-l border-slate-200 space-y-2">
                        {subChapters.map(ch => (
                          <div key={ch.id} className="flex justify-between items-center py-1">
                            <span className="font-semibold text-slate-700">{ch.name}</span>
                            <button onClick={() => handleDeleteChapter(ch.id)} className="text-red-500 hover:text-red-700 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
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

        {activeTab === 'tests' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-800">Publish Evaluation Test</h3>
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
                
                <div className="flex items-center gap-2 py-2">
                  <input type="checkbox" checked={testForm.isFullSyllabus} onChange={(e) => setTestForm({ ...testForm, isFullSyllabus: e.target.checked })} id="syllabus-mode" />
                  <label htmlFor="syllabus-mode" className="font-bold text-slate-600">This is a Full-Syllabus Grand Mock Test</label>
                </div>

                {!testForm.isFullSyllabus && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Subject</label>
                      <select value={testForm.subjectId} onChange={(e) => setTestForm({ ...testForm, subjectId: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none">
                        <option value="">Select Subject</option>
                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Chapter</label>
                      <select value={testForm.chapterId} onChange={(e) => setTestForm({ ...testForm, chapterId: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none">
                        <option value="">Select Chapter</option>
                        {chapters.filter(c => c.subjectId === testForm.subjectId).map(ch => <option key={ch.id} value={ch.id}>{ch.name}</option>)}
                      </select>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-slate-500 font-bold uppercase tracking-wider mb-2">Select Questions from Central Bank</label>
                  <div className="border border-slate-100 rounded-2xl max-h-[250px] overflow-y-auto p-3 space-y-2 bg-slate-50">
                    {questions.map(q => {
                      const isSelected = testForm.selectedQIds.includes(q.id);
                      return (
                        <div key={q.id} className="flex items-start gap-2 p-2 bg-white rounded border border-slate-100">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setTestForm({ ...testForm, selectedQIds: [...testForm.selectedQIds, q.id] });
                              } else {
                                setTestForm({ ...testForm, selectedQIds: testForm.selectedQIds.filter(id => id !== q.id) });
                              }
                            }}
                            className="mt-0.5"
                          />
                          <div>
                            <span className="font-bold text-slate-900 line-clamp-1">{q.questionText}</span>
                            <span className="text-[10px] uppercase font-bold text-emerald-600 block">Marks: {q.marks} | Difficulty: {q.difficulty}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button type="submit" disabled={loading} className="py-2 px-6 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-wider cursor-pointer">Publish Mock Test</button>
              </form>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-800">Active Academic Tests</h3>
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                {tests.map(t => (
                  <div key={t.id} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs">
                    <div>
                      <span className="font-bold text-slate-950 block">{t.title}</span>
                      <span className="text-xs text-slate-400 font-semibold uppercase">{t.type} - Duration: {t.duration} Mins - Questions: {t.questionIds.length}</span>
                    </div>
                    <button onClick={() => handleDeleteTest(t.id)} className="text-red-500 hover:text-red-700 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
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
