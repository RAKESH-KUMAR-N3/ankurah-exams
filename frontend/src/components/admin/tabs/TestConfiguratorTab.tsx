import React, { useState } from 'react';
import {
  Trash2, FileQuestion, Plus, Zap, BookOpen, Trophy, Eye, EyeOff,
  Clock, Award, RotateCcw, AlertTriangle, Upload, ChevronDown, ChevronUp,
  CheckSquare, Square, Layers, Sparkles, Check, Edit3
} from 'lucide-react';
import { Test, Subject, Chapter, SubjectWeightageConfig } from '../../../types';
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
  const { entranceExams, competitiveExams, studentTypes, tests, subjects, chapters, allPlans, refreshAdminData } = useAdminContext();
  const loading = false;
  const onRefresh = refreshAdminData;

  const [testCategoryTab, setTestCategoryTab] = useState<'entrance' | 'competitive'>('entrance');
  const [editingTestId, setEditingTestId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...DEFAULT_FORM });
  const [selectedSubjectChapters, setSelectedSubjectChapters] = useState<{ [subId: string]: { [chapId: string]: number } }>({});
  const [expandedSubjects, setExpandedSubjects] = useState<string[]>([]);
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
  // chapter question counts: { subjectId: { chapterId: count } }
  const [chapterQuestionCounts, setChapterQuestionCounts] = useState<{ [subId: string]: { [chapId: string]: number } }>({});
  const [loadingCounts, setLoadingCounts] = useState<{ [subId: string]: boolean }>({});

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
      return [];
    }
    const examIdStr = (selectedExam.id || selectedExam._id).toString();

    // 1. Match by exam.subjects array
    const explicitSubjectIds = new Set(
      (selectedExam.subjects || []).map((sub: any) => (sub?._id || sub?.id || sub).toString())
    );

    // 2. Match by plan IDs
    const relatedPlans = (allPlans || []).filter((p: any) => (p.examId?._id || p.examId)?.toString() === examIdStr);
    const relatedPlanIds = relatedPlans.map((p: any) => (p._id || p.id).toString());

    // 3. Match subjects
    const matched = tabSubjects.filter(s => {
      const sId = (s.id || (s as any)._id).toString();
      if (explicitSubjectIds.has(sId)) return true;

      const sExamIds = (s.examIds || []).map((id: any) => (id?._id || id?.id || id).toString());
      if (sExamIds.includes(examIdStr) || (s as any).examId?.toString() === examIdStr) return true;
      if (sExamIds.some((id: string) => relatedPlanIds.includes(id)) || relatedPlanIds.includes((s as any).examId?.toString())) return true;

      // Name keyword fallback
      const examNameLower = (selectedExam.name || '').toLowerCase();
      const subNameLower = (s.name || '').toLowerCase();
      if (examNameLower.includes('neet') && subNameLower.includes('neet')) return true;
      if (examNameLower.includes('tg') && subNameLower.includes('(tg)')) return true;
      if (examNameLower.includes('ap') && subNameLower.includes('(ap)')) return true;

      return false;
    });

    return matched;
  }, [selectedExam, tabSubjects, allPlans]);

  const tabSubjectIds = (tabSubjects || []).map((s: any) => (s.id || s._id).toString());

  // Calculate total configured questions across all subjects/chapters
  const builtSubjectConfigs: SubjectWeightageConfig[] = React.useMemo(() => {
    return Object.entries(selectedSubjectChapters)
      .map(([subId, chapMap]) => {
        const activeChaps = Object.entries(chapMap)
          .filter(([_, count]) => count > 0)
          .map(([chapId, count]) => ({ chapterId: chapId, questionCount: count }));
        const total = activeChaps.reduce((sum, c) => sum + c.questionCount, 0);
        return {
          subjectId: subId,
          chapters: activeChaps,
          totalQuestions: total
        };
      })
      .filter(sc => sc.chapters.length > 0);
  }, [selectedSubjectChapters]);

  const totalConfiguredQuestions = React.useMemo(() => {
    return builtSubjectConfigs.reduce((sum, sc) => sum + (sc.totalQuestions || 0), 0);
  }, [builtSubjectConfigs]);

  // Toggle Subject accordion + lazy-load chapter question counts
  const toggleExpandSubject = (subId: string) => {
    setExpandedSubjects(prev => {
      const isNowExpanded = !prev.includes(subId);
      if (isNowExpanded && !chapterQuestionCounts[subId]) {
        // Fetch chapter-wise question counts for this subject
        setLoadingCounts(lc => ({ ...lc, [subId]: true }));
        const token = localStorage.getItem('token');
        fetch(`${API_URL}/api/questions/chapter-counts?subjectId=${subId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(r => r.json())
          .then(data => {
            setChapterQuestionCounts(prev => ({ ...prev, [subId]: data.chapterCounts || {} }));
          })
          .catch(() => {})
          .finally(() => setLoadingCounts(lc => ({ ...lc, [subId]: false })));
      }
      return isNowExpanded ? [...prev, subId] : prev.filter(id => id !== subId);
    });
  };

  // Chapter weightage helpers
  const handleChapterToggle = (subId: string, chapId: string, defaultCount = 5) => {
    setSelectedSubjectChapters(prev => {
      const currentSub = prev[subId] || {};
      const currentCount = currentSub[chapId] || 0;
      const newSub = { ...currentSub };
      if (currentCount > 0) {
        delete newSub[chapId];
      } else {
        newSub[chapId] = defaultCount;
      }
      return { ...prev, [subId]: newSub };
    });
  };

  const handleChapterCountChange = (subId: string, chapId: string, count: number) => {
    setSelectedSubjectChapters(prev => {
      const currentSub = prev[subId] || {};
      return {
        ...prev,
        [subId]: {
          ...currentSub,
          [chapId]: Math.max(0, count)
        }
      };
    });
  };

  const handleSelectAllChaptersInSubject = (subId: string, countPerChap = 5) => {
    const subChapters = chapters.filter(c =>
      c.subjectId === subId || (c.subjectId as any)?._id === subId
    );
    const newMap: { [chapId: string]: number } = {};
    subChapters.forEach(c => {
      const cid = (c.id || (c as any)._id).toString();
      newMap[cid] = countPerChap;
    });
    setSelectedSubjectChapters(prev => ({
      ...prev,
      [subId]: newMap
    }));
  };

  const handleClearSubjectChapters = (subId: string) => {
    setSelectedSubjectChapters(prev => {
      const updated = { ...prev };
      delete updated[subId];
      return updated;
    });
  };

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
      setSelectedSubjectChapters({});
      setExpandedSubjects([]);
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
    setSelectedSubjectChapters({});
    
    // Auto expand all subjects for the chosen exam
    setTimeout(() => {
      const matchSubs = (exObj && Array.isArray(exObj.subjects) && exObj.subjects.length > 0)
        ? tabSubjects.filter(s => exObj.subjects.some((sub: any) => (sub?._id || sub?.id || sub).toString() === (s.id || (s as any)._id).toString()))
        : tabSubjects;
      setExpandedSubjects(matchSubs.map(s => (s.id || (s as any)._id).toString()));
    }, 50);
  };

  const handleStartEdit = (t: Test) => {
    const tid = (t as any)._id || t.id;
    setEditingTestId(tid);
    setError('');
    setSuccess('');

    // Determine category
    const tExams = Array.isArray((t as any).examIds)
      ? (t as any).examIds.map((e: any) => (e?._id || e?.id || e).toString())
      : [];
    const isComp = competitiveExamIds.some((id: string) => tExams.includes(id));
    setTestCategoryTab(isComp ? 'competitive' : 'entrance');

    const studentTypeIds = Array.isArray((t as any).studentTypeIds)
      ? (t as any).studentTypeIds.map((s: any) => (s?._id || s?.id || s).toString())
      : [];

    setForm({
      title: t.title || '',
      mode: 'dynamic',
      testType: t.testType || 'Chapter',
      examIds: tExams,
      studentTypeIds,
      subjectId: ((t.subjectId as any)?._id || t.subjectId || '').toString(),
      chapterId: ((t.chapterId as any)?._id || t.chapterId || '').toString(),
      targetDifficulty: t.targetDifficulty || 'Mixed',
      dynamicTotalQuestions: t.dynamicTotalQuestions || 30,
      duration: t.duration || 60,
      marksPerQuestion: t.marksPerQuestion ?? 4,
      negativeMarksPerQuestion: t.negativeMarksPerQuestion ?? 1,
      retakeLimit: t.retakeLimit ?? 0,
      instructions: t.instructions || '',
      csvFile: null,
    });

    // Populate subject configs
    const chapMap: { [subId: string]: { [chapId: string]: number } } = {};
    const expSubs: string[] = [];
    if (Array.isArray(t.subjectConfigs)) {
      t.subjectConfigs.forEach(sc => {
        const sId = (sc.subjectId?._id || sc.subjectId || '').toString();
        if (sId) {
          chapMap[sId] = {};
          expSubs.push(sId);
          (sc.chapters || []).forEach((c: any) => {
            const cId = (c.chapterId?._id || c.chapterId || '').toString();
            if (cId) {
              chapMap[sId][cId] = Number(c.questionCount) || 0;
            }
          });

          // Fetch chapter question counts from backend for this subject if not present
          const token = getToken();
          fetch(`${API_URL}/api/questions/chapter-counts?subjectId=${sId}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
            .then(r => r.json())
            .then(data => {
              setChapterQuestionCounts(prev => ({ ...prev, [sId]: data.chapterCounts || {} }));
            })
            .catch(() => {});
        }
      });
    }
    setSelectedSubjectChapters(chapMap);
    setExpandedSubjects(expSubs);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingTestId(null);
    setForm({ ...DEFAULT_FORM });
    setSelectedSubjectChapters({});
    setExpandedSubjects([]);
    setError('');
    setSuccess('');
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
        const hasMultiSubjectConfig = builtSubjectConfigs.length > 0;
        const totalQuestions = hasMultiSubjectConfig 
          ? totalConfiguredQuestions 
          : form.dynamicTotalQuestions;

        if (totalQuestions <= 0) {
          throw new Error('Please configure at least 1 question for this test.');
        }

        const body: any = {
          title: form.title,
          testType: builtSubjectConfigs.length > 1 ? 'Grand' : form.testType,
          examIds: form.examIds,
          studentTypeIds: form.studentTypeIds,
          isDynamic: true,
          dynamicTotalQuestions: totalQuestions,
          targetDifficulty: form.targetDifficulty,
          subjectConfigs: builtSubjectConfigs,
          duration: form.duration,
          marksPerQuestion: form.marksPerQuestion,
          negativeMarksPerQuestion: form.negativeMarksPerQuestion,
          retakeLimit: form.retakeLimit,
          isFullSyllabus: builtSubjectConfigs.length > 1,
          instructions: form.instructions,
        };

        if (!editingTestId) {
          body.status = 'Draft';
        }

        if (builtSubjectConfigs.length === 1) {
          body.subjectId = builtSubjectConfigs[0].subjectId;
        } else if (form.subjectId) {
          body.subjectId = form.subjectId;
        }

        const url = editingTestId ? `${API_URL}/api/tests/${editingTestId}` : `${API_URL}/api/tests`;
        const method = editingTestId ? 'PUT' : 'POST';

        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.message || (editingTestId ? 'Update failed' : 'Create failed'));
        }
      }

      setSuccess(editingTestId ? `✅ Test "${form.title}" updated successfully!` : '✅ Test created successfully! Status: Draft');
      setEditingTestId(null);
      setForm({ ...DEFAULT_FORM });
      setSelectedSubjectChapters({});
      setExpandedSubjects([]);
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
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              editingTestId ? 'bg-amber-100' : testCategoryTab === 'competitive' ? 'bg-blue-50' : 'bg-emerald-50'
            }`}>
              {editingTestId ? (
                <Edit3 size={18} className="text-amber-700" />
              ) : (
                <Plus size={18} className={testCategoryTab === 'competitive' ? 'text-blue-600' : 'text-emerald-600'} />
              )}
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800">
                {editingTestId
                  ? `Edit Test: ${form.title || 'Untitled Test'}`
                  : testCategoryTab === 'entrance' ? 'Create Entrance Exam Test' : 'Create Competitive Exam Test'}
              </h2>
              {editingTestId && (
                <p className="text-xs text-amber-700 font-bold">You are currently modifying an existing test configuration.</p>
              )}
            </div>
          </div>
          {editingTestId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              ✕ Cancel Edit
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">

          {/* Target Course / Exam Plan Selector */}
          <div className="p-4 rounded-2xl border transition-all bg-slate-50 border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-800">
                Select Target Course / Exam Plan *
              </label>
            </div>
            {targetExams && targetExams.length > 0 ? (
              <select
                value={form.examIds.length > 0 ? form.examIds[0] : ""}
                onChange={(e) => handleExamChange(e.target.value)}
                className={`w-full p-3 bg-white border rounded-xl text-slate-900 font-bold focus:outline-none text-xs cursor-pointer transition-colors shadow-2xs ${
                  form.examIds.length === 0 ? 'border-amber-300 focus:border-amber-500' : 'border-emerald-400 focus:border-emerald-600'
                }`}
                required
              >
                <option value="">-- Select Target Course / Exam Plan * --</option>
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
              <p className="text-xs text-slate-400">No {testCategoryTab} courses/plans found.</p>
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

          {/* Dynamic Test Options - Multi-Subject & Multi-Chapter Weightage */}
          {form.mode === 'dynamic' && (
            <div className="space-y-5 pt-2">
              
              {/* Difficulty & Global Quick Controls Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                    <Zap size={16} />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                      Multi-Subject & Chapter Weightage
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {selectedExam
                        ? `Course: ${selectedExam.name} (${filteredSubjects.length} Subjects)`
                        : 'Select a course above to configure subjects & chapters'
                      }
                    </p>
                  </div>
                </div>

                {filteredSubjects.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setExpandedSubjects(filteredSubjects.map(s => (s.id || (s as any)._id).toString()))}
                      className="px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl cursor-pointer shadow-2xs transition"
                    >
                      Expand All
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpandedSubjects([])}
                      className="px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl cursor-pointer shadow-2xs transition"
                    >
                      Collapse All
                    </button>

                    <div className="flex items-center gap-2 ml-2">
                      <label className="text-xs font-bold text-slate-600">Difficulty:</label>
                      <select
                        value={form.targetDifficulty}
                        onChange={e => setForm(f => ({ ...f, targetDifficulty: e.target.value }))}
                        className="p-1.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-blue-500 text-xs cursor-pointer shadow-2xs"
                      >
                        <option value="Mixed">Mixed</option>
                        <option value="Easy">Easy Only</option>
                        <option value="Medium">Medium Only</option>
                        <option value="Hard">Hard Only</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Subjects & Chapters List Accordion */}
              {!selectedExam ? (
                <div className="p-8 text-center bg-blue-50/50 border-2 border-dashed border-blue-200 rounded-2xl">
                  <BookOpen className="w-8 h-8 text-blue-500 mx-auto mb-2 opacity-80" />
                  <h4 className="text-sm font-bold text-slate-800 mb-1">Select a Target Course / Plan First</h4>
                  <p className="text-xs text-slate-500 font-medium max-w-md mx-auto">
                    Please choose a Course / Exam Plan from the dropdown above. Its subjects & chapters will then appear here.
                  </p>
                </div>
              ) : filteredSubjects.length === 0 ? (
                <div className="p-8 text-center bg-amber-50/60 border-2 border-dashed border-amber-200 rounded-2xl text-amber-800 font-bold text-xs">
                  No subjects linked to &quot;{selectedExam.name}&quot; yet. Please configure subjects in Subjects &amp; Chapters tab.
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredSubjects.map(sub => {
                    const subId = (sub.id || (sub as any)._id).toString();
                    const subChapters = chapters.filter(c =>
                      c.subjectId === subId || (c.subjectId as any)?._id === subId
                    );
                    const isExpanded = expandedSubjects.includes(subId);
                    const subChapConfig = selectedSubjectChapters[subId] || {};
                    const selectedChapsCount = Object.values(subChapConfig).filter(c => c > 0).length;
                    const subTotalQuestions = Object.values(subChapConfig).reduce((a, b) => a + (Number(b) || 0), 0);

                    return (
                      <div
                        key={subId}
                        className={`rounded-2xl border-2 transition-all overflow-hidden ${
                          subTotalQuestions > 0
                            ? 'border-emerald-300 bg-white shadow-xs'
                            : 'border-slate-200 bg-slate-50/70'
                        }`}
                      >
                        {/* Subject Card Header */}
                        <div
                          onClick={() => toggleExpandSubject(subId)}
                          className="p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 select-none"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                              subTotalQuestions > 0
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-200 text-slate-700'
                            }`}>
                              <Layers size={15} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-sm font-black text-slate-800">{sub.name}</h4>
                                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                  {subChapters.length} Chapters
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 font-medium">
                                {subTotalQuestions > 0
                                  ? `✓ ${subTotalQuestions} questions selected across ${selectedChapsCount} chapters`
                                  : 'No chapters selected yet'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                            {/* Quick buttons */}
                            <button
                              type="button"
                              onClick={() => handleSelectAllChaptersInSubject(subId, 5)}
                              className="hidden sm:inline-flex px-2.5 py-1 text-[10px] font-bold bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-800 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                              title="Set 5 questions for every chapter in this subject"
                            >
                              All (5 Qs)
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSelectAllChaptersInSubject(subId, 10)}
                              className="hidden sm:inline-flex px-2.5 py-1 text-[10px] font-bold bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-800 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                              title="Set 10 questions for every chapter in this subject"
                            >
                              All (10 Qs)
                            </button>
                            {subTotalQuestions > 0 && (
                              <button
                                type="button"
                                onClick={() => handleClearSubjectChapters(subId)}
                                className="px-2.5 py-1 text-[10px] font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                              >
                                Clear
                              </button>
                            )}

                            {/* Expand / Collapse Icon */}
                            <button
                              type="button"
                              onClick={() => toggleExpandSubject(subId)}
                              className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                            >
                              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </button>
                          </div>
                        </div>

                        {/* Expanded Chapter Selection Body */}
                        {isExpanded && (
                          <div className="border-t border-slate-200 p-4 bg-white space-y-3">
                            {subChapters.length === 0 ? (
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-amber-50/70 border border-amber-200">
                                <div>
                                  <p className="text-xs font-bold text-amber-900">
                                    No chapters created under this subject yet.
                                  </p>
                                  <p className="text-[11px] text-amber-700">
                                    You can assign questions directly to this subject:
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <label className="text-xs font-bold text-amber-900">Questions:</label>
                                  <input
                                    type="number"
                                    min={0}
                                    max={200}
                                    placeholder="e.g. 30"
                                    value={subChapConfig['direct'] || ''}
                                    onChange={e => handleChapterCountChange(subId, 'direct', parseInt(e.target.value) || 0)}
                                    className="w-20 p-2 bg-white border border-amber-300 rounded-xl text-xs font-black text-center text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
                                  />
                                </div>
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                {subChapters.map(chap => {
                                  const chapId = (chap.id || (chap as any)._id).toString();
                                  const count = subChapConfig[chapId] || 0;
                                  const isChecked = count > 0;
                                  const availableCount = chapterQuestionCounts[subId]?.[chapId];

                                  return (
                                    <div
                                      key={chapId}
                                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                                        isChecked
                                          ? 'border-emerald-300 bg-emerald-50/50'
                                          : 'border-slate-200 bg-slate-50/40 hover:bg-slate-50'
                                      }`}
                                    >
                                      <label
                                        className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer select-none"
                                        onClick={() => handleChapterToggle(subId, chapId, Math.min(5, availableCount || 5))}
                                      >
                                        <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                                          isChecked ? 'bg-emerald-600 text-white' : 'border border-slate-300 bg-white'
                                        }`}>
                                          {isChecked && <Check size={13} />}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <span className={`text-xs block truncate ${isChecked ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                                            {chap.name}
                                          </span>
                                          {loadingCounts[subId] ? (
                                            <span className="text-[10px] text-slate-400">Loading...</span>
                                          ) : availableCount !== undefined ? (
                                            <span className={`text-[10px] font-bold ${
                                              availableCount === 0 ? 'text-rose-500' : 'text-slate-500'
                                            }`}>
                                              {availableCount === 0 ? '⚠ No questions in DB' : `${availableCount} questions in DB`}
                                            </span>
                                          ) : null}
                                        </div>
                                      </label>

                                      {isChecked ? (
                                        <div className="flex flex-col items-end gap-0.5 shrink-0">
                                          <div className="flex items-center gap-1.5">
                                            <label className="text-[10px] font-bold text-emerald-800 uppercase">Qs:</label>
                                            <input
                                              type="number"
                                              min={1}
                                              max={availableCount !== undefined ? availableCount : 200}
                                              value={count}
                                              onChange={e => {
                                                const val = parseInt(e.target.value) || 0;
                                                const cap = availableCount !== undefined ? availableCount : 9999;
                                                handleChapterCountChange(subId, chapId, Math.min(val, cap));
                                              }}
                                              className="w-16 p-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-black text-center text-emerald-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
                                            />
                                          </div>
                                          {availableCount !== undefined && count > availableCount && (
                                            <span className="text-[9px] text-rose-600 font-bold">Max: {availableCount}</span>
                                          )}
                                        </div>
                                      ) : (
                                        <button
                                          type="button"
                                          disabled={availableCount === 0}
                                          onClick={() => handleChapterToggle(subId, chapId, Math.min(5, availableCount || 5))}
                                          className={`text-[10px] font-bold px-2 py-1 rounded transition-colors ${
                                            availableCount === 0
                                              ? 'text-slate-300 cursor-not-allowed'
                                              : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 cursor-pointer'
                                          }`}
                                        >
                                          {availableCount === 0 ? 'No Qs' : '+ Add'}
                                        </button>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Total Configured Summary Banner */}
              {totalConfiguredQuestions > 0 && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border-2 border-emerald-300 shadow-xs space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-emerald-600" />
                      <h4 className="text-xs font-black uppercase tracking-wider text-emerald-900">
                        Exam Configuration Summary
                      </h4>
                    </div>
                    <div className="px-3 py-1 bg-emerald-600 text-white rounded-xl text-xs font-black font-mono">
                      TOTAL: {totalConfiguredQuestions} QUESTIONS
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {builtSubjectConfigs.map((sc, i) => {
                      const subObj = subjects.find(s => (s.id || (s as any)._id).toString() === sc.subjectId);
                      return (
                        <span
                          key={i}
                          className="px-2.5 py-1 bg-white border border-emerald-200 text-emerald-800 rounded-lg text-[11px] font-bold shadow-2xs flex items-center gap-1.5"
                        >
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span>{subObj?.name || 'Subject'}:</span>
                          <span className="font-black text-slate-900">{sc.totalQuestions} Qs ({sc.chapters.length} chap)</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

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
            className={`w-full py-3.5 px-6 text-white rounded-xl font-black uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
              editingTestId
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-slate-900 hover:bg-slate-800'
            }`}
          >
            {saving ? (
              <><RotateCcw size={16} className="animate-spin" /> {editingTestId ? 'Saving Changes...' : 'Creating...'}</>
            ) : editingTestId ? (
              <><Edit3 size={16} /> 💾 Save Changes (Update Test)</>
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
                      <span className="flex items-center gap-1"><RotateCcw size={11} /> {t.retakeLimit === 0 ? '∞ retakes' : `${t.retakeLimit || 0} retake(s)`}</span>
                      {t.isDynamic && <span className="text-blue-500">⚡ {t.dynamicTotalQuestions}Q random</span>}
                      {t.isFullSyllabus && <span className="text-yellow-500">🏆 Grand Test</span>}
                    </div>
                    {/* Multi-subject configs preview badge */}
                    {Array.isArray(t.subjectConfigs) && t.subjectConfigs.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {t.subjectConfigs.map((sc, i) => {
                          const sObj = subjects.find(s => (s.id || (s as any)._id).toString() === (sc.subjectId?._id || sc.subjectId || '').toString());
                          const sName = sc.subjectId?.name || sObj?.name || 'Subject';
                          const qCount = sc.totalQuestions || sc.chapters?.reduce((acc: number, c: any) => acc + (c.questionCount || 0), 0);
                          return (
                            <span key={i} className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 rounded-md px-2 py-0.5 font-bold flex items-center gap-1">
                              📖 {sName}: {qCount} Qs ({sc.chapters?.length || 0} chap)
                            </span>
                          );
                        })}
                      </div>
                    )}
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
                    <div className="flex flex-wrap gap-1 mt-2 items-center">
                      {Array.isArray((t as any).examIds) && (t as any).examIds.length > 0 ? (
                        (t as any).examIds.map((eid: any, i: number) => {
                          const exName = allExams.find((ex: any) => (ex.id || ex._id).toString() === (eid?._id || eid?.id || eid).toString())?.name;
                          return exName ? (
                            <span key={i} className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2.5 py-0.5 font-bold flex items-center gap-1">
                              📘 {exName}
                            </span>
                          ) : null;
                        })
                      ) : (
                        <span className="text-[10px] text-red-600 font-bold bg-red-50 border border-red-200 rounded-full px-2 py-0.5">⚠ No course assigned</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Edit Test Button */}
                    <button
                      type="button"
                      onClick={() => handleStartEdit(t)}
                      title="Edit this test"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:border-blue-300 cursor-pointer shadow-2xs"
                    >
                      <Edit3 size={13} /> Edit
                    </button>

                    {/* Publish / Draft Toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(tid)}
                      disabled={isToggling}
                      title={isPublished ? 'Unpublish (set to Draft)' : 'Publish to students'}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                        isPublished
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                      } disabled:opacity-50 cursor-pointer shadow-2xs`}
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
                      type="button"
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
