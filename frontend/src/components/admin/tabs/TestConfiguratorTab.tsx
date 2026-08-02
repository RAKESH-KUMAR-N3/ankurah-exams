import React, { useState } from 'react';
import {
  Trash2, FileQuestion, Plus, Zap, BookOpen, Trophy, Eye, EyeOff,
  Clock, Award, RotateCcw, AlertTriangle, Upload
} from 'lucide-react';
import { Test, Subject, Chapter } from '../../../types';
import { useAdminContext } from '../../../context/AdminContext';
import { toggleTestStatus } from '../../../lib/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const getToken = () => localStorage.getItem('token');

interface TestConfiguratorTabProps {
  entranceExams: any[];
  competitiveExams: any[];
  studentTypes: any[];
  tests: Test[];
  subjects: Subject[];
  chapters: Chapter[];
  loading: boolean;
  onRefresh: () => void;
}

type TestMode = 'dynamic' | 'grand';

const DEFAULT_FORM = {
  title: '',
  mode: 'dynamic' as TestMode,
  testType: 'Chapter' as string,
  examIds: [] as string[],
  studentTypeIds: [] as string[],
  subjectId: '',
  chapterId: '',
  targetDifficulty: 'Mixed' as string,
  dynamicTotalQuestions: 30,
  duration: 60,
  marksPerQuestion: 4,
  negativeMarksPerQuestion: 1,
  retakeLimit: 0,
  instructions: '',
  csvFile: null as File | null,
};

export default function TestConfiguratorTab() {
  const { entranceExams, competitiveExams, studentTypes, tests, subjects, chapters, refreshAdminData } = useAdminContext();
  const loading = false;
  const onRefresh = refreshAdminData;

  const [testCategoryTab, setTestCategoryTab] = useState<'entrance' | 'competitive'>('entrance');
  const [form, setForm] = useState({ ...DEFAULT_FORM });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filterExamId, setFilterExamId] = useState<string>('all');
  const [filterGroupId, setFilterGroupId] = useState<string>('all');
  const [editingExamsForId, setEditingExamsForId] = useState<string | null>(null);
  const [editExamIds, setEditExamIds] = useState<string[]>([]);
  const [savingExams, setSavingExams] = useState(false);

  const allExams = [...(entranceExams || []), ...(competitiveExams || [])];

  // Helper for competitive subject identification
  const competitiveExamIds = (competitiveExams || []).map((e: any) => e.id || e._id);
  const isCompSubject = (s: any) => {
    if (s.subjectCategory) return s.subjectCategory === 'competitive';
    const examId = s.examId?._id || s.examId || s.examId?.id;
    if (examId && competitiveExamIds.includes(examId)) return true;
    return /general|knowledge|gk|reasoning|aptitude|current affairs|banking|clat|nda/i.test(s.name || '');
  };

  const targetExams = testCategoryTab === 'entrance' ? (entranceExams || []) : (competitiveExams || []);
  const targetExamIds = (targetExams || []).map((e: any) => (e.id || e._id).toString());

  const tabSubjects = subjects.filter((s: any) =>
    testCategoryTab === 'competitive' ? isCompSubject(s) : !isCompSubject(s)
  );

  // Find currently selected exam
  const selectedExam = form.examIds.length > 0
    ? allExams.find((e: any) => (e.id || e._id).toString() === form.examIds[0])
    : null;

  // Filter subjects based on selected Course / Exam
  const filteredSubjects = React.useMemo(() => {
    if (!selectedExam) {
      return tabSubjects;
    }
    // 1. If selected exam has explicit subjects configured
    if (selectedExam.subjects && Array.isArray(selectedExam.subjects) && selectedExam.subjects.length > 0) {
      const subjectIdSet = new Set(
        selectedExam.subjects.map((sub: any) => (sub?._id || sub?.id || sub).toString())
      );
      const matched = tabSubjects.filter(s => subjectIdSet.has((s.id || (s as any)._id).toString()));
      if (matched.length > 0) return matched;
    }
    // 2. If exam has state (AP/TG), filter subjects by state tag in name or state field
    if (selectedExam.state && selectedExam.state !== 'Both') {
      const stateMatches = tabSubjects.filter(s =>
        s.name.includes(`(${selectedExam.state})`) || (s as any).state === selectedExam.state
      );
      if (stateMatches.length > 0) return stateMatches;
    }
    return tabSubjects;
  }, [selectedExam, tabSubjects]);

  const filteredChapters = chapters.filter(c =>
    !form.subjectId || (c.subjectId === form.subjectId || (c.subjectId as any)?._id === form.subjectId)
  );

  const tabSubjectIds = (tabSubjects || []).map((s: any) => (s.id || s._id).toString());

  // Filter tests matching the selected tab and optional course / group filters
  const categoryTests = tests.filter(t => {
    const tExams = Array.isArray((t as any).examIds) ? (t as any).examIds.map((e: any) => (e?._id || e?.id || e).toString()) : [];
    const tSubId = (((t.subjectId as any)?._id || t.subjectId || '')).toString();
    const matchesExam = tExams.some((id: string) => targetExamIds.includes(id));
    const matchesSubject = tSubId && tabSubjectIds.includes(tSubId);
    return matchesExam || matchesSubject || (testCategoryTab === 'entrance' && tExams.length === 0 && !tSubId);
  });

  const filteredTests = categoryTests.filter(t => {
    const tExams = Array.isArray((t as any).examIds) ? (t as any).examIds.map((e: any) => (e?._id || e?.id || e).toString()) : [];
    const matchesCourse = filterExamId === 'all' || tExams.includes(filterExamId);
    return matchesCourse;
  });

  const handleExamChange = (examId: string) => {
    if (!examId) {
      setForm(prev => ({
        ...prev,
        examIds: [],
        studentTypeIds: [],
        subjectId: '',
        chapterId: '',
      }));
      return;
    }

    const exObj = allExams.find((e: any) => (e.id || e._id).toString() === examId);
    const newStudentTypeIds: string[] = [];
    if (exObj && Array.isArray(exObj.allowedStudentTypes)) {
      exObj.allowedStudentTypes.forEach((typeObjOrId: any) => {
        const stId = typeof typeObjOrId === 'string' ? typeObjOrId : (typeObjOrId._id || typeObjOrId.id);
        if (stId && !newStudentTypeIds.includes(stId)) {
          newStudentTypeIds.push(stId);
        }
      });
    }

    setForm(prev => ({
      ...prev,
      examIds: [examId],
      studentTypeIds: newStudentTypeIds,
      subjectId: '',
      chapterId: '',
    }));
  };

  const handleSaveExamIds = async (testId: string) => {
    setSavingExams(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/tests/${testId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ examIds: editExamIds }),
      });
      if (!res.ok) throw new Error('Failed to update');
      setEditingExamsForId(null);
      onRefresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSavingExams(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (form.examIds.length === 0) {
      setError('Please assign the test to at least one Course/Exam.');
      return;
    }

    setSaving(true);

    try {
      const token = getToken();

      if (form.mode === 'grand') {
        if (!form.csvFile) throw new Error('Please upload a CSV file');
        const fd = new FormData();
        fd.append('title', form.title);
        fd.append('duration', String(form.duration));
        fd.append('marksPerQuestion', String(form.marksPerQuestion));
        fd.append('negativeMarksPerQuestion', String(form.negativeMarksPerQuestion));
        fd.append('retakeLimit', String(form.retakeLimit));
        fd.append('instructions', form.instructions);
        form.studentTypeIds.forEach(id => fd.append('studentTypeIds', id));
        form.examIds.forEach(id => fd.append('examIds', id));
        fd.append('file', form.csvFile);

        const res = await fetch(`${API_URL}/api/tests/grand-test-upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.message || 'Upload failed');
        }
      } else {
        const body: any = {
          title: form.title,
          testType: form.testType,
          examIds: form.examIds,
          studentTypeIds: form.studentTypeIds,
          isDynamic: true,
          dynamicTotalQuestions: form.dynamicTotalQuestions,
          targetDifficulty: form.targetDifficulty,
          duration: form.duration,
          marksPerQuestion: form.marksPerQuestion,
          negativeMarksPerQuestion: form.negativeMarksPerQuestion,
          retakeLimit: form.retakeLimit,
          isFullSyllabus: false,
          instructions: form.instructions,
          status: 'Draft',
        };
        if (form.subjectId) body.subjectId = form.subjectId;
        if (form.chapterId) body.chapterId = form.chapterId;

        const res = await fetch(`${API_URL}/api/tests`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.message || 'Create failed');
        }
      }

      setSuccess('✅ Test created successfully! Status: Draft');
      setForm({ ...DEFAULT_FORM });
      onRefresh();
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (testId: string) => {
    setTogglingId(testId);
    try {
      await toggleTestStatus(testId);
      onRefresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (testId: string) => {
    if (!confirm('Delete this test? This cannot be undone.')) return;
    setDeletingId(testId);
    try {
      const token = getToken();
      await fetch(`${API_URL}/api/tests/${testId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      onRefresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusColor = (status?: string) =>
    status === 'Published'
      ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
      : 'bg-amber-100 text-amber-700 border-amber-200';

  const getTypeIcon = (t: Test) =>
    t.isDynamic ? <Zap size={14} className="text-blue-500" /> :
    t.isFullSyllabus ? <Trophy size={14} className="text-yellow-500" /> :
    <BookOpen size={14} className="text-emerald-500" />;

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* ── TOP LEVEL CATEGORY TAB SWITCHER ── */}
      <div className="flex gap-2 border-b border-slate-200 pb-0">
        <button
          type="button"
          onClick={() => {
            setTestCategoryTab('entrance');
            setForm(f => ({ ...f, subjectId: '', chapterId: '', examIds: [], studentTypeIds: [] }));
          }}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-sm rounded-t-xl transition-all border-b-2 ${
            testCategoryTab === 'entrance'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          🎓 Entrance Exam Tests
        </button>
        <button
          type="button"
          onClick={() => {
            setTestCategoryTab('competitive');
            setForm(f => ({ ...f, subjectId: '', chapterId: '', examIds: [], studentTypeIds: [] }));
          }}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-sm rounded-t-xl transition-all border-b-2 ${
            testCategoryTab === 'competitive'
              ? 'border-blue-600 text-blue-700 bg-blue-50'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          🏆 Competitive Exam Tests
        </button>
      </div>

      {/* ── CREATE TEST FORM ──────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${testCategoryTab === 'competitive' ? 'bg-blue-50' : 'bg-emerald-50'}`}>
              <Plus size={18} className={testCategoryTab === 'competitive' ? 'text-blue-600' : 'text-emerald-600'} />
            </div>
            <h2 className="text-lg font-black text-slate-800">
              {testCategoryTab === 'entrance' ? 'Create Entrance Exam Test' : 'Create Competitive Exam Test'}
            </h2>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">

          {/* Select Course / Plan - MANDATORY */}
          <div className={`p-4 rounded-2xl border-2 transition-all ${
            form.examIds.length === 0
              ? 'border-red-300 bg-red-50'
              : 'border-emerald-300 bg-emerald-50'
          }`}>
            <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${
              form.examIds.length === 0 ? 'text-red-600' : 'text-emerald-700'
            }`}>
              {form.examIds.length === 0 ? '⚠' : '✓'} Select Course / Plan ({testCategoryTab === 'entrance' ? 'Entrance' : 'Competitive'})
              <span className="text-red-500 ml-0.5">*</span>
              <span className="ml-2 normal-case font-normal text-slate-500">
                {form.examIds.length === 0
                  ? '(Required! Select the Course/Plan this test belongs to)'
                  : `(Course selected: ${selectedExam?.name || '1 Plan'}) ✓`
                }
              </span>
            </label>
            {targetExams && targetExams.length > 0 ? (
              <select
                value={form.examIds.length > 0 ? form.examIds[0] : ""}
                onChange={(e) => handleExamChange(e.target.value)}
                className={`w-full p-3 bg-white border rounded-xl text-slate-900 font-semibold focus:outline-none text-xs cursor-pointer transition-colors ${
                  form.examIds.length === 0 
                    ? 'border-red-300 focus:border-red-500' 
                    : 'border-emerald-300 focus:border-emerald-500'
                }`}
                required
              >
                <option value="">-- Select a Course / Plan --</option>
                {targetExams.map((ex: any) => {
                  const exId = (ex.id || ex._id).toString();
                  return (
                    <option key={exId} value={exId}>
                      {ex.name}
                    </option>
                  );
                })}
              </select>
            ) : (
              <p className="text-xs text-slate-400">No {testCategoryTab} courses/plans found. Create courses in Courses / Plans first.</p>
            )}
          </div>

          {/* Mode Toggle */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, mode: 'dynamic', testType: 'Chapter' }))}
              className={`flex-1 flex items-center gap-2 py-3 px-4 rounded-xl border-2 font-bold text-sm transition-all ${
                form.mode === 'dynamic'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-slate-200 text-slate-500 hover:border-slate-300'
              }`}
            >
              <Zap size={18} /> {testCategoryTab === 'entrance' ? 'Dynamic / Chapter Test' : 'Dynamic Test'}
            </button>
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, mode: 'grand', testType: 'Grand', isFullSyllabus: true }))}
              className={`flex-1 flex items-center gap-2 py-3 px-4 rounded-xl border-2 font-bold text-sm transition-all ${
                form.mode === 'grand'
                  ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                  : 'border-slate-200 text-slate-500 hover:border-slate-300'
              }`}
            >
              <Trophy size={18} /> Grand Test (CSV)
            </button>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Test Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-emerald-400 transition"
              placeholder={testCategoryTab === 'entrance' ? 'e.g. Botany 1st Year - Chapter 1 Test' : 'e.g. SBI PO Mock Test 1 – General Awareness'}
              required
            />
          </div>

          {/* Dynamic Test Options */}
          {form.mode === 'dynamic' && (
            <div className="space-y-4 pt-2">
              <div className={`grid grid-cols-1 ${testCategoryTab === 'entrance' ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4`}>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Subject {selectedExam ? `(${filteredSubjects.length} available)` : ''}
                  </label>
                  <select
                    value={form.subjectId}
                    onChange={e => setForm(f => ({ ...f, subjectId: e.target.value, chapterId: '' }))}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-emerald-400 text-xs cursor-pointer disabled:opacity-50 disabled:bg-slate-100"
                    disabled={form.examIds.length === 0}
                  >
                    <option value="">
                      {form.examIds.length === 0 
                        ? '-- Select Course / Plan First --' 
                        : filteredSubjects.length === 0 
                          ? 'No subjects linked' 
                          : 'All Subjects (in this Course)'}
                    </option>
                    {filteredSubjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                {testCategoryTab === 'entrance' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Chapter</label>
                    <select
                      value={form.chapterId}
                      onChange={e => setForm(f => ({ ...f, chapterId: e.target.value }))}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-emerald-400 text-xs cursor-pointer disabled:opacity-50 disabled:bg-slate-100"
                      disabled={!form.subjectId}
                    >
                      <option value="">{form.subjectId ? 'All Chapters' : 'Select a Subject first'}</option>
                      {filteredChapters.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Difficulty</label>
                  <select
                    value={form.targetDifficulty}
                    onChange={e => setForm(f => ({ ...f, targetDifficulty: e.target.value }))}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-emerald-400 text-xs cursor-pointer"
                  >
                    <option value="Mixed">Mixed</option>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Number of Questions *</label>
                <input
                  type="number"
                  min={1}
                  value={form.dynamicTotalQuestions}
                  onChange={e => setForm(f => ({ ...f, dynamicTotalQuestions: Number(e.target.value) }))}
                  className="w-full md:w-48 p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-emerald-400 text-xs"
                  required
                />
              </div>
            </div>
          )}

          {/* Duration + Marks Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Duration (mins) *</label>
              <input
                type="number"
                min={1}
                value={form.duration}
                onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-emerald-400"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Marks / Question</label>
              <input
                type="number"
                min={0}
                step={0.5}
                value={form.marksPerQuestion}
                onChange={e => setForm(f => ({ ...f, marksPerQuestion: Number(e.target.value) }))}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-emerald-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Negative Marks</label>
              <input
                type="number"
                min={0}
                step={0.25}
                value={form.negativeMarksPerQuestion}
                onChange={e => setForm(f => ({ ...f, negativeMarksPerQuestion: Number(e.target.value) }))}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-emerald-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Retake Limit
                <span className="ml-1 normal-case font-normal text-slate-400">(0=∞)</span>
              </label>
              <input
                type="number"
                min={0}
                value={form.retakeLimit}
                onChange={e => setForm(f => ({ ...f, retakeLimit: Number(e.target.value) }))}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-emerald-400"
              />
            </div>
          </div>

          {/* Grand Test CSV Upload */}
          {form.mode === 'grand' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5 space-y-4">
              <h4 className="text-sm font-black text-yellow-700 flex items-center gap-2">
                <Trophy size={16} /> Grand Test — CSV Upload
              </h4>

              <div className="text-xs text-yellow-600 bg-yellow-100 rounded-lg p-3">
                <p className="font-bold mb-1">📋 CSV Format:</p>
                <code className="block">content, optionA, optionB, optionC, optionD, correctAnswer, subjectId, chapterId, difficulty, explanation</code>
              </div>
              <label className="block">
                <div className="flex items-center gap-2 px-4 py-3 bg-white border-2 border-dashed border-yellow-300 rounded-xl cursor-pointer hover:border-yellow-500 transition-colors">
                  <Upload size={18} className="text-yellow-500" />
                  <span className="text-sm font-bold text-slate-600">
                    {form.csvFile ? `📄 ${form.csvFile.name}` : 'Click to upload CSV file'}
                  </span>
                </div>
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={e => setForm(f => ({ ...f, csvFile: e.target.files?.[0] || null }))}
                  required={form.mode === 'grand'}
                />
              </label>
            </div>
          )}

          {/* Instructions */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Instructions (Optional)</label>
            <textarea
              value={form.instructions}
              onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))}
              rows={3}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-400 resize-none"
              placeholder="Any special instructions for students..."
            />
          </div>

          {/* Anti-cheat notice */}
          <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
            <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
            <p>
              <strong>Proctoring is enabled by default:</strong> Students are forced into fullscreen.
              1st tab switch → warning. 2nd tab switch → exam auto-submitted.
            </p>
          </div>

          {/* Error / Success */}
          {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
          {success && <p className="text-sm text-emerald-600 font-medium">{success}</p>}

          {/* Submit */}
          <button
            type="submit"
            disabled={saving || loading}
            className="w-full py-3 px-6 bg-slate-900 text-white rounded-xl font-black uppercase tracking-wider hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            {saving ? (
              <><RotateCcw size={16} className="animate-spin" /> Creating...</>
            ) : (
              <><Plus size={16} /> Create {form.mode === 'grand' ? 'Grand' : 'Dynamic'} Test (as Draft)</>
            )}
          </button>
        </form>
      </div>

      {/* ── TESTS LIST ────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
              <FileQuestion size={18} className="text-slate-600" />
            </div>
            <h2 className="text-lg font-black text-slate-800">All Tests</h2>
            <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{filteredTests.length}</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter by Course / Plan */}
            <select
              value={filterExamId}
              onChange={e => setFilterExamId(e.target.value)}
              className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
            >
              <option value="all">All Courses / Plans</option>
              {targetExams && targetExams.map((ex: any) => {
                const exId = (ex.id || ex._id).toString();
                return (
                  <option key={exId} value={exId}>{ex.name}</option>
                );
              })}
            </select>
          </div>
        </div>

        {filteredTests.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <FileQuestion size={40} className="mx-auto mb-3 opacity-40" />
            <p className="font-bold">No tests found. Create one above!</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredTests.map(t => {
              const tid = (t as any)._id || t.id;
              const isPublished = t.status === 'Published';
              const isToggling = togglingId === tid;
              const isDeleting = deletingId === tid;

              return (
                <div key={tid} className="px-6 py-4 flex items-start gap-4 hover:bg-slate-50 transition-colors">
                  {/* Type icon */}
                  <div className="mt-1">{getTypeIcon(t)}</div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-slate-800">{t.title}</h4>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider ${getStatusColor(t.status)}`}>
                        {t.status || 'Draft'}
                      </span>
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full uppercase">
                        {t.testType}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-1.5 text-[11px] text-slate-500 font-medium">
                      <span className="flex items-center gap-1"><Clock size={11} /> {t.duration} mins</span>
                      <span className="flex items-center gap-1"><Award size={11} /> {t.marksPerQuestion ?? 4} pts/Q</span>
                      <span className="flex items-center gap-1"><RotateCcw size={11} /> {t.retakeLimit === 0 ? '∞ retakes' : `${t.retakeLimit} retake(s)`}</span>
                      {t.isDynamic && <span className="text-blue-500">⚡ {t.dynamicTotalQuestions}Q random</span>}
                      {t.isFullSyllabus && <span className="text-yellow-500">🏆 Grand Test</span>}
                    </div>
                    {/* Assigned student groups */}
                    {Array.isArray((t as any).studentTypeIds) && (t as any).studentTypeIds.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {(t as any).studentTypeIds.map((sid: any, i: number) => {
                          const st = studentTypes?.find((s: any) => (s.id || s._id) === (sid?._id || sid));
                          const stName = st?.name;
                          const stState = st?.state;
                          return stName ? (
                            <span key={i} className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5 font-bold flex items-center gap-1">
                              {stName} {stState && <span className="text-[8px] opacity-75 bg-emerald-200 text-emerald-800 px-1 rounded">{stState}</span>}
                            </span>
                          ) : null;
                        })}
                      </div>
                    )}

                    {/* Assigned courses/exams */}
                    {editingExamsForId === tid ? (
                      <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
                        <p className="text-[10px] font-black text-blue-700 uppercase tracking-wider">Select Courses (click to toggle):</p>
                        <div className="flex flex-wrap gap-1.5">
                          {allExams.map((ex: any) => {
                            const exId = ex.id || ex._id;
                            const sel = editExamIds.includes(exId);
                            return (
                              <button
                                key={exId}
                                type="button"
                                onClick={() => setEditExamIds(prev => sel ? prev.filter(x => x !== exId) : [...prev, exId])}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                                  sel ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400'
                                }`}
                              >
                                {sel && '✓ '}{ex.name}
                              </button>
                            );
                          })}
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleSaveExamIds(tid)}
                            disabled={savingExams || editExamIds.length === 0}
                            className="px-3 py-1.5 bg-blue-600 text-white text-[11px] font-black rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                          >
                            {savingExams ? <RotateCcw size={11} className="animate-spin" /> : '✓'} Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingExamsForId(null)}
                            className="px-3 py-1.5 bg-slate-200 text-slate-600 text-[11px] font-bold rounded-lg hover:bg-slate-300 cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1 mt-1.5 items-center">
                        {Array.isArray((t as any).examIds) && (t as any).examIds.length > 0 ? (
                          (t as any).examIds.map((eid: any, i: number) => {
                            const exName = allExams.find((ex: any) => (ex.id || ex._id) === (eid?._id || eid))?.name;
                            return exName ? (
                              <span key={i} className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2 py-0.5 font-bold">
                                📘 {exName}
                              </span>
                            ) : null;
                          })
                        ) : (
                          <span className="text-[10px] text-red-600 font-bold bg-red-50 border border-red-200 rounded-full px-2 py-0.5">⚠ No courses assigned – students can't see this!</span>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            const currentExamIds = Array.isArray((t as any).examIds)
                              ? (t as any).examIds.map((e: any) => e?._id || e)
                              : [];
                            setEditExamIds(currentExamIds);
                            setEditingExamsForId(tid);
                          }}
                          className="text-[10px] text-blue-600 hover:text-blue-800 font-bold underline ml-1 cursor-pointer"
                        >
                          {Array.isArray((t as any).examIds) && (t as any).examIds.length > 0 ? 'Edit Courses' : '+ Assign Courses'}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Publish / Draft Toggle */}
                    <button
                      onClick={() => handleToggleStatus(tid)}
                      disabled={isToggling}
                      title={isPublished ? 'Unpublish (set to Draft)' : 'Publish to students'}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                        isPublished
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                      } disabled:opacity-50 cursor-pointer`}
                    >
                      {isToggling ? (
                        <RotateCcw size={13} className="animate-spin" />
                      ) : isPublished ? (
                        <><Eye size={13} /> Published</>
                      ) : (
                        <><EyeOff size={13} /> Draft</>
                      )}
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(tid)}
                      disabled={isDeleting}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                      title="Delete test"
                    >
                      {isDeleting ? <RotateCcw size={15} className="animate-spin" /> : <Trash2 size={15} />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
