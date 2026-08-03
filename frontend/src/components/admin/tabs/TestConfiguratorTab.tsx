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

  const [testCategoryTab, setTestCategoryTab] = useState<'all' | 'entrance' | 'competitive'>('all');
  const [editingTestId, setEditingTestId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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
    if (testCategoryTab === 'all') return true;

    const tExams = Array.isArray((t as any).examIds) ? (t as any).examIds.map((e: any) => (e?._id || e?.id || e).toString()) : [];
    const isCompetitiveTest = competitiveExamIds.some((id: string) => tExams.includes(id));

    if (testCategoryTab === 'competitive') {
      return isCompetitiveTest;
    } else if (testCategoryTab === 'entrance') {
      return !isCompetitiveTest;
    }
    return true;
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
    setShowCreateModal(true);
  };

  const handleCancelEdit = () => {
    setEditingTestId(null);
    setShowCreateModal(false);
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
      setShowCreateModal(false);
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

  const isEnterprise = (localStorage.getItem('ankurah_theme_mode') || 'enterprise') === 'enterprise';

  return (
    <div className={`space-y-6 w-full ${isEnterprise ? 'font-sans text-slate-900' : 'font-sans'}`}>
      {/* Toast Notifications */}
      {error && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 shadow-lg ${
          isEnterprise
            ? 'bg-rose-50 text-rose-800 border-rose-200'
            : 'bg-rose-950/80 text-rose-300 border-rose-700/50'
        }`}>
          <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600" />
          <span className="font-bold text-xs">{error}</span>
        </div>
      )}
      {success && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 shadow-lg ${
          isEnterprise
            ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
            : 'bg-emerald-950/80 text-emerald-300 border-emerald-700/50'
        }`}>
          <Check className="w-5 h-5 shrink-0 text-emerald-600" />
          <span className="font-bold text-xs">{success}</span>
        </div>
      )}

      {/* ── 1. CONTROL BAR: CATEGORY TABS, FILTERS & + CREATE NEW TEST BUTTON ── */}
      <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-3 sm:p-4 rounded-xl shadow-sm border ${
        isEnterprise
          ? 'bg-white border-gray-200'
          : 'bg-slate-950 border-slate-800/80'
      }`}>
        
        {/* Category Tabs */}
        <div className={`flex items-center overflow-x-auto w-full sm:w-auto p-1 rounded-xl no-scrollbar border ${
          isEnterprise ? 'bg-gray-100 border-gray-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <button
            type="button"
            onClick={() => setTestCategoryTab('all')}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 font-black text-[11px] sm:text-xs uppercase tracking-wider cursor-pointer border rounded-lg transition-all whitespace-nowrap ${
              testCategoryTab === 'all'
                ? isEnterprise ? 'bg-[#166534] text-white border-[#166534] shadow-xs' : 'bg-emerald-500 text-black border-emerald-400 shadow-md'
                : isEnterprise ? 'text-gray-600 border-transparent hover:text-gray-900' : 'text-slate-400 border-transparent hover:text-white'
            }`}
          >
            ALL TESTS ({tests.length})
          </button>
          <button
            type="button"
            onClick={() => setTestCategoryTab('entrance')}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 font-black text-[11px] sm:text-xs uppercase tracking-wider cursor-pointer border rounded-lg transition-all whitespace-nowrap ${
              testCategoryTab === 'entrance'
                ? isEnterprise ? 'bg-[#166534] text-white border-[#166534] shadow-xs' : 'bg-emerald-500 text-black border-emerald-400 shadow-md'
                : isEnterprise ? 'text-gray-600 border-transparent hover:text-gray-900' : 'text-slate-400 border-transparent hover:text-white'
            }`}
          >
            🎓 ENTRANCE ({tests.filter(t => !competitiveExamIds.some((id: string) => (t.examIds || []).map((e: any) => (e?._id || e?.id || e).toString()).includes(id))).length})
          </button>
          <button
            type="button"
            onClick={() => setTestCategoryTab('competitive')}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 font-black text-[11px] sm:text-xs uppercase tracking-wider cursor-pointer border rounded-lg transition-all whitespace-nowrap ${
              testCategoryTab === 'competitive'
                ? isEnterprise ? 'bg-cyan-700 text-white border-cyan-700 shadow-xs' : 'bg-cyan-500 text-black border-cyan-400 shadow-md'
                : isEnterprise ? 'text-gray-600 border-transparent hover:text-gray-900' : 'text-slate-400 border-transparent hover:text-white'
            }`}
          >
            🏆 COMPETITIVE ({tests.filter(t => competitiveExamIds.some((id: string) => (t.examIds || []).map((e: any) => (e?._id || e?.id || e).toString()).includes(id))).length})
          </button>
        </div>

        {/* Right Side: Course Filter & + CREATE NEW TEST Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <select
            value={filterExamId}
            onChange={(e) => setFilterExamId(e.target.value)}
            className={`px-3 py-2 text-[11px] sm:text-xs font-black uppercase focus:outline-none cursor-pointer rounded-xl flex-1 sm:w-auto border ${
              isEnterprise
                ? 'bg-white border-gray-300 text-gray-900 focus:border-[#166534]'
                : 'bg-slate-900 border-slate-700 text-emerald-400 focus:border-emerald-400'
            }`}
          >
            <option value="all">🎓 ALL COURSES / PLANS ({allExams.length})</option>
            {allExams.map((ex: any) => {
              const exId = (ex.id || ex._id).toString();
              return (
                <option key={exId} value={exId}>
                  🎓 {ex.name}
                </option>
              );
            })}
          </select>

          <button
            type="button"
            onClick={() => {
              handleCancelEdit();
              setShowCreateModal(true);
            }}
            className={`px-4 py-2 font-black uppercase tracking-wider text-xs rounded-xl shadow-sm cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 transition-all shrink-0 w-full sm:w-auto ${
              isEnterprise
                ? 'bg-[#166534] hover:bg-[#14532d] text-white border border-[#166534]'
                : 'bg-emerald-500 hover:bg-emerald-400 text-black border border-emerald-400 shadow-lg'
            }`}
          >
            <Plus size={16} className="stroke-[3]" /> + CREATE NEW TEST
          </button>
        </div>

      </div>

      {/* ── 2. MAIN CONTENT: ALL CREATED TESTS LIST AT THE TOP ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <FileQuestion className={`w-5 h-5 ${isEnterprise ? 'text-[#166534]' : 'text-emerald-400'}`} />
            <h2 className={`text-base font-black uppercase tracking-wider ${isEnterprise ? 'text-gray-900 font-heading' : 'text-white'}`}>
              ALL CREATED TESTS ({filteredTests.length})
            </h2>
          </div>
        </div>

        {filteredTests.length === 0 ? (
          <div className={`p-12 text-center rounded-xl border shadow-sm ${
            isEnterprise
              ? 'bg-white border-gray-200 text-gray-500'
              : 'bg-slate-950/80 geom-grid-pattern-dark border-2 border-slate-800 text-slate-400 shadow-xl'
          }`}>
            <FileQuestion size={44} className={`mx-auto mb-3 ${isEnterprise ? 'text-gray-400' : 'text-slate-600'}`} />
            <h3 className={`text-sm font-black uppercase tracking-wider ${isEnterprise ? 'text-gray-800 font-heading' : 'text-white'}`}>
              No tests created yet
            </h3>
            <p className={`text-xs font-bold mt-1 max-w-sm mx-auto ${isEnterprise ? 'text-gray-500' : 'text-slate-400'}`}>
              Click the <strong className={isEnterprise ? 'text-[#166534]' : 'text-emerald-400'}>+ CREATE NEW TEST</strong> button above to configure your first exam!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3.5">
            {filteredTests.map((t) => {
              const tid = (t as any)._id || t.id;
              const isPublished = t.status === 'Published';
              const isToggling = togglingId === tid;
              const isDeleting = deletingId === tid;

              return (
                <div
                  key={tid}
                  className={`p-4 sm:p-5 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group ${
                    isEnterprise
                      ? 'bg-white border-gray-200 hover:border-emerald-600/50 shadow-sm'
                      : 'bg-slate-950/80 geom-grid-pattern-dark border-2 border-emerald-500/40 hover:border-emerald-400/80 shadow-[0_0_20px_rgba(16,185,129,0.12)]'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className={`p-2.5 rounded-xl border shrink-0 mt-0.5 ${
                      isEnterprise
                        ? 'bg-emerald-50 border-emerald-200 text-[#166534]'
                        : 'bg-slate-900 border-slate-800 text-emerald-400'
                    }`}>
                      {getTypeIcon(t)}
                    </div>

                    <div className="min-w-0 space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={`font-extrabold text-sm sm:text-base tracking-wide transition-colors ${
                          isEnterprise
                            ? 'text-gray-900 font-heading group-hover:text-[#166534]'
                            : 'text-white group-hover:text-emerald-400'
                        }`}>
                          {t.title}
                        </h3>
                        <span
                          className={`px-2.5 py-0.5 text-[10px] font-mono font-black uppercase tracking-wider rounded-md border ${
                            isPublished
                              ? isEnterprise
                                ? 'bg-emerald-50 text-[#166534] border-emerald-200'
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : isEnterprise
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          }`}
                        >
                          {t.status || 'Draft'}
                        </span>
                        <span className={`px-2 py-0.5 text-[10px] font-mono font-bold border rounded-md uppercase ${
                          isEnterprise
                            ? 'bg-gray-100 text-gray-700 border-gray-200'
                            : 'bg-slate-900 text-slate-300 border-slate-800'
                        }`}>
                          {t.testType}
                        </span>
                      </div>

                      {/* Test Metrics Badges */}
                      <div className={`flex flex-wrap items-center gap-3 text-xs font-mono ${
                        isEnterprise ? 'text-gray-600 font-sans font-medium' : 'text-slate-300'
                      }`}>
                        <span className="flex items-center gap-1">
                          <Clock size={13} className={isEnterprise ? 'text-[#166534]' : 'text-emerald-400'} /> {t.duration} Mins
                        </span>
                        <span className="flex items-center gap-1">
                          <Award size={13} className={isEnterprise ? 'text-[#166534]' : 'text-emerald-400'} /> {t.marksPerQuestion ?? 4} pts/Q
                        </span>
                        <span className="flex items-center gap-1">
                          <RotateCcw size={13} className={isEnterprise ? 'text-gray-400' : 'text-slate-400'} />{' '}
                          {t.retakeLimit === 0 ? '∞ Retakes' : `${t.retakeLimit || 0} Retake(s)`}
                        </span>
                        {t.isDynamic && <span className={`font-bold ${isEnterprise ? 'text-[#166534]' : 'text-emerald-400'}`}>⚡ {t.dynamicTotalQuestions} Qs Random</span>}
                        {t.isFullSyllabus && <span className={`font-bold ${isEnterprise ? 'text-cyan-700' : 'text-cyan-400'}`}>🏆 Grand Test</span>}
                      </div>

                      {/* Subject Configurations Preview */}
                      {Array.isArray(t.subjectConfigs) && t.subjectConfigs.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {t.subjectConfigs.map((sc, i) => {
                            const sObj = subjects.find(
                              (s) => (s.id || (s as any)._id).toString() === (sc.subjectId?._id || sc.subjectId || '').toString()
                            );
                            const sName = sc.subjectId?.name || sObj?.name || 'Subject';
                            const qCount =
                              sc.totalQuestions ||
                              sc.chapters?.reduce((acc: number, c: any) => acc + (c.questionCount || 0), 0);
                            return (
                              <span
                                key={i}
                                className={`text-[10px] border rounded-md px-2 py-0.5 font-bold flex items-center gap-1 ${
                                  isEnterprise
                                    ? 'bg-emerald-50 text-[#166534] border-emerald-200'
                                    : 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80 font-mono'
                                }`}
                              >
                                📖 {sName}: {qCount} Qs ({sc.chapters?.length || 0} chap)
                              </span>
                            );
                          })}
                        </div>
                      )}

                      {/* Course / Exam Badges */}
                      <div className="flex flex-wrap gap-1.5 pt-1 items-center">
                        {Array.isArray((t as any).examIds) && (t as any).examIds.length > 0 ? (
                          (t as any).examIds.map((eid: any, i: number) => {
                            const exName = allExams.find(
                              (ex: any) => (ex.id || ex._id).toString() === (eid?._id || eid?.id || eid).toString()
                            )?.name;
                            return exName ? (
                              <span
                                key={i}
                                className={`text-[10px] border rounded-md px-2.5 py-0.5 font-bold flex items-center gap-1 ${
                                  isEnterprise
                                    ? 'bg-gray-100 text-gray-800 border-gray-300'
                                    : 'bg-slate-900 text-emerald-400 border-slate-700'
                                }`}
                              >
                                📘 {exName}
                              </span>
                            ) : null;
                          })
                        ) : (
                          <span className={`text-[10px] font-bold rounded-md px-2 py-0.5 border ${
                            isEnterprise
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-rose-950/40 text-rose-400 border-rose-800/50'
                          }`}>
                            ⚠ No Course Assigned
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Buttons */}
                  <div className={`flex items-center gap-2 shrink-0 justify-end pt-2 md:pt-0 border-t md:border-t-0 ${
                    isEnterprise ? 'border-gray-200' : 'border-slate-800/80'
                  }`}>
                    <button
                      type="button"
                      onClick={() => handleStartEdit(t)}
                      className={`px-3.5 py-1.5 border rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                        isEnterprise
                          ? 'bg-white hover:bg-gray-50 text-gray-800 border-gray-300 shadow-xs'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border-slate-700'
                      }`}
                    >
                      <Edit3 size={13} /> Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleStatus(tid)}
                      disabled={isToggling}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 border cursor-pointer ${
                        isPublished
                          ? isEnterprise
                            ? 'bg-emerald-50 text-[#166534] border-emerald-300 hover:bg-emerald-600 hover:text-white'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500 hover:text-black'
                          : isEnterprise
                            ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-500 hover:text-white'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500 hover:text-black'
                      }`}
                    >
                      {isToggling ? (
                        <RotateCcw size={13} className="animate-spin" />
                      ) : isPublished ? (
                        <><Eye size={13} /> Published</>
                      ) : (
                        <><EyeOff size={13} /> Draft</>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(tid)}
                      disabled={isDeleting}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        isEnterprise
                          ? 'text-gray-400 hover:text-rose-600 hover:bg-rose-50'
                          : 'text-slate-500 hover:text-rose-400 hover:bg-slate-900'
                      }`}
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

      {/* ── 3. TEST CREATION / EDIT MODAL (100% FULL SCREEN FIXED VIEW WITH INDEPENDENT SCROLL) ── */}
      {showCreateModal && (
        <div className={`fixed inset-0 z-50 flex flex-col overflow-hidden ${
          isEnterprise
            ? 'bg-[#FAFBFC] text-gray-900 font-sans'
            : 'bg-slate-950 geom-grid-pattern-dark text-white'
        }`}>
          {/* Fullscreen Modal Header */}
          <div className={`px-6 py-3.5 border-b flex items-center justify-between shrink-0 shadow-sm z-10 ${
            isEnterprise
              ? 'bg-white border-gray-200'
              : 'bg-emerald-950/60 border-emerald-500/40'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl border ${
                isEnterprise
                  ? 'bg-emerald-50 text-[#166534] border-emerald-200'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              }`}>
                {editingTestId ? <Edit3 size={20} /> : <Plus size={20} className="stroke-[3]" />}
              </div>
              <div>
                <h2 className={`text-base font-black uppercase tracking-wider ${isEnterprise ? 'text-gray-900 font-heading' : 'text-white'}`}>
                  {editingTestId ? `EDIT TEST: ${form.title || 'UNTITLED TEST'}` : 'CREATE NEW TEST CONFIGURATION'}
                </h2>
                <p className={`text-xs font-bold ${isEnterprise ? 'text-gray-500' : 'text-slate-400'}`}>
                  Configure target course, multi-subject weightages, duration, and test rules.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCancelEdit}
              className={`px-4 py-2 border rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs ${
                isEnterprise
                  ? 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
              }`}
            >
                        {/* Modal Form Body — 2 Column Layout with Independent Scrolling */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-hidden p-4 sm:p-6">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 h-full items-start">
              
              {/* LEFT COLUMN (Cols 1-5): Primary Form Controls (Independent Scroll) */}
              <div className="lg:col-span-5 space-y-4 overflow-y-auto max-h-[calc(100vh-140px)] pr-2 no-scrollbar">
                
                {/* Target Course Selector */}
                <div className={`p-4 rounded-xl border space-y-2 shadow-xs ${
                  isEnterprise ? 'bg-white border-gray-200' : 'bg-slate-900/90 border-slate-800'
                }`}>
                  <label className={`block text-xs font-mono font-black uppercase tracking-widest ${
                    isEnterprise ? 'text-[#166534] font-heading' : 'text-emerald-400'
                  }`}>
                    1. SELECT TARGET COURSE / EXAM PLAN *
                  </label>
                  {allExams && allExams.length > 0 ? (
                    <select
                      value={form.examIds.length > 0 ? form.examIds[0] : ''}
                      onChange={(e) => handleExamChange(e.target.value)}
                      className={`w-full p-3 rounded-xl border text-xs font-bold focus:outline-none cursor-pointer ${
                        isEnterprise
                          ? 'bg-gray-50 border-gray-300 text-gray-900 focus:border-[#166534]'
                          : 'bg-slate-950 border-slate-700 text-white focus:border-emerald-400'
                      }`}
                      required
                    >
                      <option value="">-- Select Target Course / Exam Plan * --</option>
                      {allExams.map((ex: any) => {
                        const exId = (ex.id || ex._id).toString();
                        return (
                          <option key={exId} value={exId}>
                            🎓 {ex.name}
                          </option>
                        );
                      })}
                    </select>
                  ) : (
                    <p className={`text-xs font-bold ${isEnterprise ? 'text-gray-500' : 'text-slate-400'}`}>No active courses/plans found.</p>
                  )}
                </div>

                {/* Test Mode Toggle */}
                <div className={`p-4 rounded-xl border space-y-2 shadow-xs ${
                  isEnterprise ? 'bg-white border-gray-200' : 'bg-slate-900/90 border-slate-800'
                }`}>
                  <label className={`block text-xs font-mono font-black uppercase tracking-widest mb-1 ${
                    isEnterprise ? 'text-gray-700 font-heading' : 'text-slate-400'
                  }`}>
                    2. TEST MODE
                  </label>
                  <div className="flex gap-2.5">
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, mode: 'dynamic', testType: 'Chapter' }))}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-xl border-2 font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
                        form.mode === 'dynamic'
                          ? isEnterprise
                            ? 'border-[#166534] bg-emerald-50 text-[#166534] shadow-xs'
                            : 'border-emerald-500 bg-emerald-950/80 text-emerald-300 shadow-md'
                          : isEnterprise
                            ? 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
                            : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <Zap size={16} /> Dynamic / Chapter Test
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, mode: 'grand', testType: 'Grand', isFullSyllabus: true }))}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-xl border-2 font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
                        form.mode === 'grand'
                          ? isEnterprise
                            ? 'border-cyan-700 bg-cyan-50 text-cyan-800 shadow-xs'
                            : 'border-cyan-500 bg-cyan-950/80 text-cyan-300 shadow-md'
                          : isEnterprise
                            ? 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
                            : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <Trophy size={16} /> Grand Test (CSV)
                    </button>
                  </div>
                </div>

                {/* Test Title */}
                <div className={`p-4 rounded-xl border space-y-2 shadow-xs ${
                  isEnterprise ? 'bg-white border-gray-200' : 'bg-slate-900/90 border-slate-800'
                }`}>
                  <label className={`block text-xs font-mono font-black uppercase tracking-widest ${
                    isEnterprise ? 'text-gray-700 font-heading' : 'text-slate-400'
                  }`}>
                    3. TEST TITLE *
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    className={`w-full p-3 border rounded-xl font-bold text-xs focus:outline-none ${
                      isEnterprise
                        ? 'bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-[#166534]'
                        : 'bg-slate-950 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-400'
                    }`}
                    placeholder="e.g. Botany 1st Year - Chapter 1 Test"
                    required
                  />
                </div>

                {/* Grand Test CSV Upload (if mode === 'grand') */}
                {form.mode === 'grand' && (
                  <div className={`p-4 rounded-xl border space-y-3 shadow-xs ${
                    isEnterprise ? 'bg-cyan-50 border-cyan-200' : 'bg-cyan-950/40 border-cyan-800/80'
                  }`}>
                    <h4 className={`text-xs font-black flex items-center gap-2 uppercase tracking-wider ${
                      isEnterprise ? 'text-cyan-800 font-heading' : 'text-cyan-400'
                    }`}>
                      <Trophy size={15} /> Grand Test — CSV Upload
                    </h4>
                    <label className="block">
                      <div className={`flex items-center gap-2 px-4 py-3 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                        isEnterprise
                          ? 'bg-white border-cyan-300 hover:border-cyan-600'
                          : 'bg-slate-900 border-cyan-500/40 hover:border-cyan-400'
                      }`}>
                        <Upload size={18} className={isEnterprise ? 'text-cyan-700' : 'text-cyan-400'} />
                        <span className={`text-xs font-bold ${isEnterprise ? 'text-gray-800' : 'text-slate-300'}`}>
                          {form.csvFile ? `📄 ${form.csvFile.name}` : 'Click to upload CSV question file'}
                        </span>
                      </div>
                      <input
                        type="file"
                        accept=".csv"
                        className="hidden"
                        onChange={(e) => setForm((f) => ({ ...f, csvFile: e.target.files?.[0] || null }))}
                      />
                    </label>
                  </div>
                )}

                {/* Test Parameters Grid (Duration, Marks, Negative, Retakes) */}
                <div className={`p-4 rounded-xl border space-y-2 shadow-xs ${
                  isEnterprise ? 'bg-white border-gray-200' : 'bg-slate-900/90 border-slate-800'
                }`}>
                  <label className={`block text-xs font-mono font-black uppercase tracking-widest mb-1 ${
                    isEnterprise ? 'text-gray-700 font-heading' : 'text-slate-400'
                  }`}>
                    4. TEST PARAMETERS & RULES
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={`block text-[10px] font-mono font-black uppercase tracking-widest mb-1 ${
                        isEnterprise ? 'text-gray-500' : 'text-slate-400'
                      }`}>
                        DURATION (MINS)
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={form.duration}
                        onChange={(e) => setForm((f) => ({ ...f, duration: Number(e.target.value) }))}
                        className={`w-full p-2.5 border rounded-xl font-mono font-bold text-xs focus:outline-none ${
                          isEnterprise
                            ? 'bg-gray-50 border-gray-300 text-gray-900 focus:border-[#166534]'
                            : 'bg-slate-950 border-slate-700 text-white focus:border-emerald-400'
                        }`}
                        required
                      />
                    </div>
                    <div>
                      <label className={`block text-[10px] font-mono font-black uppercase tracking-widest mb-1 ${
                        isEnterprise ? 'text-gray-500' : 'text-slate-400'
                      }`}>
                        MARKS / Q
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={0.5}
                        value={form.marksPerQuestion}
                        onChange={(e) => setForm((f) => ({ ...f, marksPerQuestion: Number(e.target.value) }))}
                        className={`w-full p-2.5 border rounded-xl font-mono font-bold text-xs focus:outline-none ${
                          isEnterprise
                            ? 'bg-gray-50 border-gray-300 text-gray-900 focus:border-[#166534]'
                            : 'bg-slate-950 border-slate-700 text-white focus:border-emerald-400'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-[10px] font-mono font-black uppercase tracking-widest mb-1 ${
                        isEnterprise ? 'text-gray-500' : 'text-slate-400'
                      }`}>
                        NEGATIVE MARKS
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={0.25}
                        value={form.negativeMarksPerQuestion}
                        onChange={(e) => setForm((f) => ({ ...f, negativeMarksPerQuestion: Number(e.target.value) }))}
                        className={`w-full p-2.5 border rounded-xl font-mono font-bold text-xs focus:outline-none ${
                          isEnterprise
                            ? 'bg-gray-50 border-gray-300 text-gray-900 focus:border-[#166534]'
                            : 'bg-slate-950 border-slate-700 text-white focus:border-emerald-400'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-[10px] font-mono font-black uppercase tracking-widest mb-1 ${
                        isEnterprise ? 'text-gray-500' : 'text-slate-400'
                      }`}>
                        RETAKE LIMIT (0=∞)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={form.retakeLimit}
                        onChange={(e) => setForm((f) => ({ ...f, retakeLimit: Number(e.target.value) }))}
                        className={`w-full p-2.5 border rounded-xl font-mono font-bold text-xs focus:outline-none ${
                          isEnterprise
                            ? 'bg-gray-50 border-gray-300 text-gray-900 focus:border-[#166534]'
                            : 'bg-slate-950 border-slate-700 text-white focus:border-emerald-400'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Proctoring Notice */}
                <div className={`flex items-start gap-2 text-xs border rounded-xl p-3 shadow-xs ${
                  isEnterprise
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                    : 'bg-emerald-950/40 text-emerald-300 border-emerald-800/80'
                }`}>
                  <AlertTriangle size={15} className={`mt-0.5 shrink-0 ${isEnterprise ? 'text-[#166534]' : 'text-emerald-400'}`} />
                  <p>
                    <strong>Proctoring Enabled:</strong> Students are forced into fullscreen mode during test.
                  </p>
                </div>

                {/* Submit Buttons Row */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className={`px-5 py-3 border rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
                      isEnterprise
                        ? 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving || loading}
                    className={`px-8 py-3 font-black text-xs uppercase tracking-wider rounded-xl shadow-sm transition-all cursor-pointer border flex items-center gap-2 active:scale-95 disabled:opacity-50 ${
                      isEnterprise
                        ? 'bg-[#166534] hover:bg-[#14532d] text-white border-[#166534]'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-black border-emerald-400 shadow-lg'
                    }`}
                  >
                    {saving ? (
                      <><RotateCcw size={16} className="animate-spin" /> Saving...</>
                    ) : editingTestId ? (
                      <><Edit3 size={16} /> Save Changes (Update Test)</>
                    ) : (
                      <><Plus size={16} className="stroke-[3]" /> Create Dynamic Test (Draft)</>
                    )}
                  </button>
                </div>

              </div>

              {/* RIGHT COLUMN (Cols 6-12): Multi-Subject & Chapter Weightage (INDEPENDENT INTERNAL SCROLL) */}
              <div className="lg:col-span-7 h-full flex flex-col overflow-hidden">
                {form.mode === 'dynamic' && (
                  <div className={`p-4 sm:p-5 rounded-xl border flex flex-col h-full max-h-[calc(100vh-140px)] shadow-xs ${
                    isEnterprise ? 'bg-white border-gray-200' : 'bg-slate-900/90 border-slate-800'
                  }`}>
                    
                    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b shrink-0 ${
                      isEnterprise ? 'border-gray-200' : 'border-slate-800'
                    }`}>
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-lg border ${
                          isEnterprise
                            ? 'bg-emerald-50 text-[#166534] border-emerald-200'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                          <Zap size={16} />
                        </div>
                        <div>
                          <h3 className={`text-xs font-black uppercase tracking-wider ${
                            isEnterprise ? 'text-gray-900 font-heading' : 'text-white'
                          }`}>
                            5. MULTI-SUBJECT & CHAPTER WEIGHTAGE
                          </h3>
                          <p className={`text-[11px] font-bold mt-0.5 ${
                            isEnterprise ? 'text-gray-500' : 'text-slate-400'
                          }`}>
                            {selectedExam
                              ? `Course: ${selectedExam.name} (${filteredSubjects.length} Subjects)`
                              : 'Select a target course on the left to configure subjects & chapters'}
                          </p>
                        </div>
                      </div>

                      {filteredSubjects.length > 0 && (
                        <div className="flex items-center gap-2">
                          <label className={`text-xs font-mono font-bold ${isEnterprise ? 'text-gray-600' : 'text-slate-400'}`}>Difficulty:</label>
                          <select
                            value={form.targetDifficulty}
                            onChange={(e) => setForm((f) => ({ ...f, targetDifficulty: e.target.value }))}
                            className={`p-1.5 border rounded-lg font-bold text-xs focus:outline-none ${
                              isEnterprise
                                ? 'bg-gray-50 border-gray-300 text-gray-900 focus:border-[#166534]'
                                : 'bg-slate-950 border-slate-700 text-emerald-400 focus:border-emerald-400'
                            }`}
                          >
                            <option value="Mixed">Mixed</option>
                            <option value="Easy">Easy Only</option>
                            <option value="Medium">Medium Only</option>
                            <option value="Hard">Hard Only</option>
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Subjects & Chapters List Accordion Container (Only right column scrolls internally!) */}
                    <div className="flex-1 overflow-y-auto pr-1.5 space-y-3 mt-3">
                      {!selectedExam ? (
                        <div className={`p-12 text-center border border-dashed rounded-xl space-y-2 ${
                          isEnterprise ? 'bg-gray-50 border-gray-300 text-gray-500' : 'bg-slate-950/60 border-slate-800'
                        }`}>
                          <BookOpen className={`w-8 h-8 mx-auto ${isEnterprise ? 'text-gray-400' : 'text-slate-600'}`} />
                          <h4 className={`text-xs font-black uppercase tracking-wider ${isEnterprise ? 'text-gray-800 font-heading' : 'text-white'}`}>Select a Target Course First</h4>
                          <p className={`text-[11px] font-bold max-w-sm mx-auto ${isEnterprise ? 'text-gray-500' : 'text-slate-400'}`}>
                            Please choose a Course / Exam Plan from the dropdown on the left. Its subjects & chapters will appear here.
                          </p>
                        </div>
                      ) : filteredSubjects.length === 0 ? (
                        <div className="p-8 text-center bg-amber-50 border border-dashed border-amber-300 rounded-xl text-amber-900 font-bold text-xs">
                          No subjects linked to &quot;{selectedExam.name}&quot; yet. Please configure subjects in Subjects &amp; Chapters tab.
                        </div>
                      ) : (
                        filteredSubjects.map((sub) => {
                          const subId = (sub.id || (sub as any)._id).toString();
                          const subChapters = chapters.filter(
                            (c) => c.subjectId === subId || (c.subjectId as any)?._id === subId
                          );
                          const isExpanded = expandedSubjects.includes(subId);
                          const subChapConfig = selectedSubjectChapters[subId] || {};
                          const subTotalQuestions = Object.values(subChapConfig).reduce((a, b) => a + (Number(b) || 0), 0);

                          return (
                            <div
                              key={subId}
                              className={`rounded-xl border transition-all overflow-hidden ${
                                subTotalQuestions > 0
                                  ? isEnterprise ? 'border-emerald-400 bg-white shadow-xs' : 'border-emerald-500/60 bg-slate-950'
                                  : isEnterprise ? 'border-gray-200 bg-gray-50/50' : 'border-slate-800 bg-slate-950/60'
                              }`}
                            >
                              <div
                                onClick={() =>
                                  setExpandedSubjects((prev) =>
                                    isExpanded ? prev.filter((id) => id !== subId) : [...prev, subId]
                                  )
                                }
                                className={`p-3 flex items-center justify-between cursor-pointer select-none transition-colors ${
                                  isEnterprise ? 'bg-white hover:bg-gray-50' : 'bg-slate-900/90 hover:bg-slate-900'
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <BookOpen className={`w-4 h-4 ${isEnterprise ? 'text-[#166534]' : 'text-emerald-400'}`} />
                                  <span className={`font-extrabold text-xs uppercase tracking-wide ${
                                    isEnterprise ? 'text-gray-900 font-heading' : 'text-white'
                                  }`}>
                                    {sub.name}
                                  </span>
                                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                                    isEnterprise ? 'bg-gray-100 text-gray-600 border-gray-200' : 'bg-slate-950 text-slate-400 border-slate-800'
                                  }`}>
                                    {subChapters.length} Chapters
                                  </span>
                                </div>

                                <div className="flex items-center gap-3">
                                  {subTotalQuestions > 0 && (
                                    <span className={`px-2.5 py-0.5 border font-mono font-bold text-xs rounded-md ${
                                      isEnterprise
                                        ? 'bg-emerald-50 text-[#166534] border-emerald-300'
                                        : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                    }`}>
                                      {subTotalQuestions} Qs Selected
                                    </span>
                                  )}
                                  {isExpanded ? (
                                    <ChevronUp className={`w-4 h-4 ${isEnterprise ? 'text-[#166534]' : 'text-emerald-400'}`} />
                                  ) : (
                                    <ChevronDown className={`w-4 h-4 ${isEnterprise ? 'text-gray-400' : 'text-slate-400'}`} />
                                  )}
                                </div>
                              </div>

                              {/* Chapter Weightage Rows (Rendered in Compact 2-Column Grid!) */}
                              {isExpanded && (
                                <div className={`p-3 border-t grid grid-cols-1 sm:grid-cols-2 gap-2 ${
                                  isEnterprise ? 'bg-gray-50 border-gray-200' : 'bg-slate-950 border-slate-800/80'
                                }`}>
                                  {subChapters.map((chap) => {
                                    const chapId = (chap.id || (chap as any)._id).toString();
                                    const curVal = subChapConfig[chapId] || 0;
                                    const availCount = chapterQuestionCounts[subId]?.[chapId] ?? (chap.questionCount || 15);

                                    return (
                                      <div
                                        key={chapId}
                                        className={`flex items-center justify-between gap-2 p-2 rounded-lg border ${
                                          isEnterprise
                                            ? 'bg-white border-gray-200 shadow-2xs'
                                            : 'bg-slate-900/80 border-slate-800'
                                        }`}
                                      >
                                        <div className="min-w-0 flex-1">
                                          <h5 className={`font-extrabold text-[11px] truncate ${
                                            isEnterprise ? 'text-gray-800 font-heading' : 'text-slate-200'
                                          }`}>{chap.name}</h5>
                                          <span className={`text-[9px] font-mono font-bold ${
                                            isEnterprise ? 'text-gray-500' : 'text-slate-400'
                                          }`}>
                                            DB: <strong className={isEnterprise ? 'text-[#166534]' : 'text-emerald-400'}>{availCount}</strong> Qs
                                          </span>
                                        </div>

                                        <div className="flex items-center gap-1.5 shrink-0">
                                          <label className={`text-[9px] font-mono font-bold uppercase ${
                                            isEnterprise ? 'text-gray-500' : 'text-slate-400'
                                          }`}>
                                            Qs:
                                          </label>
                                          <input
                                            type="number"
                                            min={0}
                                            max={availCount}
                                            value={curVal}
                                            onChange={(e) =>
                                              handleSubjectChapterQuestionChange(subId, chapId, Number(e.target.value))
                                            }
                                            className={`w-14 p-1 border rounded-md font-mono font-bold text-xs text-center focus:outline-none ${
                                              isEnterprise
                                                ? 'bg-white border-gray-300 text-gray-900 focus:border-[#166534]'
                                                : 'bg-slate-950 border-emerald-500/40 text-emerald-400 focus:border-emerald-400'
                                            }`}
                                          />
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

            </div>
          </form>
        </div>
      )}
    </div>
  );
}
