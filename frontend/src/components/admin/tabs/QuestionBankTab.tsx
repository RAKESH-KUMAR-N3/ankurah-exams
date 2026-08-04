import React, { useState, useEffect } from 'react';
import { Subject, Chapter } from '../../../types';
import { useAdminContext } from '../../../context/AdminContext';
import { 
  Edit2, Trash2, HelpCircle, CheckCircle2, Search, RefreshCw, 
  BookOpen, ChevronDown, ChevronRight, PlusCircle, Layers, Award,
  Upload, X, Filter, Sparkles, FolderOpen, AlertCircle
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function QuestionBankTab() {
  const { subjects, chapters, entranceExams, competitiveExams, refreshAdminData } = useAdminContext();
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Tab State: Entrance vs Competitive
  const [qTab, setQTab] = useState<'entrance' | 'competitive'>('entrance');
  
  // Current courses list & competitive exam IDs
  const currentCourses = qTab === 'entrance' ? entranceExams : competitiveExams;
  const compExamIds = (competitiveExams || []).map((e: any) => String(e.id || e._id));

  // Hierarchy Filters: Cascading Selection Flow (Course -> Subject -> Chapter)
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('');
  const [selectedChapterFilter, setSelectedChapterFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Expandable States
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});

  // Active View Modes
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'single' | 'bulk'>('single');
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  // Single Question Form State
  const [questionForm, setQuestionForm] = useState({ 
    id: '', 
    subjectId: '', 
    chapterId: '', 
    questionText: '', 
    oA: '', 
    oB: '', 
    oC: '', 
    oD: '', 
    correctAnswerIndex: 0, 
    difficulty: 'Medium', 
    marks: 4, 
    negativeMarks: 1, 
    explanation: '' 
  });

  // Bulk Upload Form State
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [bulkSubjectId, setBulkSubjectId] = useState('');
  const [bulkChapterId, setBulkChapterId] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);

  // Questions Data State
  const [allQuestions, setAllQuestions] = useState<any[]>([]);
  const [listLoading, setListLoading] = useState(false);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setErrorMsg(null);
    refreshAdminData();
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setSuccessMsg(null);
    setTimeout(() => setErrorMsg(null), 4000);
  };

  // Fetch all questions from API
  const fetchQuestions = async () => {
    setListLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/questions`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (res.ok) {
        setAllQuestions(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch questions:', err);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [qTab]);

  // All subjects for the active tab (entrance or competitive) - sorted Alphabetically A to Z
  const allTabSubjects = React.useMemo(() => {
    return subjects
      .filter((s: any) => {
        const sExamId = s.examId ? String(typeof s.examId === 'object' ? s.examId._id || s.examId.id : s.examId) : '';
        const sExamIds = Array.isArray(s.examIds) ? s.examIds.map((e: any) => String(typeof e === 'object' ? e._id || e.id : e)) : [];
        let isComp = s.subjectCategory === 'competitive';
        if (!s.subjectCategory) {
          if (sExamId && compExamIds.includes(sExamId)) isComp = true;
          else if (sExamIds.some(eid => compExamIds.includes(eid))) isComp = true;
          else isComp = /general|knowledge|gk|reasoning|aptitude|current affairs|banking|clat|nda/i.test(s.name || '');
        }
        return qTab === 'competitive' ? isComp : !isComp;
      })
      .sort((a: any, b: any) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
  }, [subjects, qTab, compExamIds]);

  // Subjects available for Dropdown 2 (Filtered by selectedCourseFilter) - sorted Alphabetically A to Z
  const availableCourseSubjects = React.useMemo(() => {
    if (!selectedCourseFilter) return [];
    
    const course = currentCourses.find((c: any) => String(c.id || c._id) === selectedCourseFilter);
    const targetCId = String(selectedCourseFilter);

    return allTabSubjects.filter((s: any) => {
      const sId = String(s.id || s._id || '');
      const sMongoId = String(s._id || s.id || '');
      const sExamId = s.examId ? String(typeof s.examId === 'object' ? s.examId._id || s.examId.id : s.examId) : '';
      const sExamIds = Array.isArray(s.examIds) ? s.examIds.map((e: any) => String(typeof e === 'object' ? e._id || e.id : e)) : [];

      const matchedByExamId = sExamId === targetCId || sExamIds.includes(targetCId);

      let matchedByCourseSubjects = false;
      if (course && Array.isArray(course.subjects)) {
        matchedByCourseSubjects = course.subjects.some((sub: any) => {
          const subId = String(typeof sub === 'string' ? sub : (sub._id || sub.id || ''));
          return subId === sId || subId === sMongoId;
        });
      }

      let matchedByKeyword = false;
      if (course && course.name) {
        const cNameLower = course.name.toLowerCase();
        const sNameLower = (s.name || '').toLowerCase();
        if (cNameLower.includes('neet') && sNameLower.includes('neet')) matchedByKeyword = true;
        else if ((cNameLower.includes('eapcet') || cNameLower.includes('tg') || cNameLower.includes('ap')) && (sNameLower.includes('tg') || sNameLower.includes('ap') || sNameLower.includes('eapcet'))) matchedByKeyword = true;
        else if (cNameLower.includes('jee') && sNameLower.includes('jee')) matchedByKeyword = true;
      }

      return matchedByExamId || matchedByCourseSubjects || matchedByKeyword;
    }).sort((a: any, b: any) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
  }, [selectedCourseFilter, currentCourses, allTabSubjects]);

  // Chapters available for Dropdown 3 (Filtered by selectedSubjectFilter) - Number / Syllabus Order (Chapter 1, 2, 3...)
  const availableSubjectChapters = React.useMemo(() => {
    if (!selectedSubjectFilter) return [];
    const list = chapters.filter((ch: any) => {
      const cSubId = String(ch.subjectId?._id || ch.subjectId?.id || ch.subjectId || '');
      const targetSubId = String(selectedSubjectFilter);
      return cSubId === targetSubId;
    });

    return [...list].sort((a: any, b: any) => {
      if (typeof a.chapterNumber === 'number' && typeof b.chapterNumber === 'number') {
        return a.chapterNumber - b.chapterNumber;
      }
      const extractNum = (str: string) => {
        const match = (str || '').match(/(?:chapter\s*|ch\s*|\b)(\d+)/i);
        return match ? parseInt(match[1], 10) : null;
      };
      const numA = extractNum(a.name || a.title);
      const numB = extractNum(b.name || b.title);
      if (numA !== null && numB !== null) {
        return numA - numB;
      }
      return 0; // Preserve creation / syllabus insertion order
    });
  }, [selectedSubjectFilter, chapters]);

  // Active Subject to render questions for
  const currentSubjects = React.useMemo(() => {
    if (!selectedCourseFilter || !selectedSubjectFilter) return [];

    return availableCourseSubjects.filter((s: any) => {
      const sId = String(s.id || s._id || '');
      const sMongoId = String(s._id || s.id || '');
      const targetSubId = String(selectedSubjectFilter);
      return sId === targetSubId || sMongoId === targetSubId || s.name === selectedSubjectFilter;
    });
  }, [selectedCourseFilter, selectedSubjectFilter, availableCourseSubjects]);

  const resetSingleForm = () => {
    setQuestionForm({
      id: '',
      subjectId: '',
      chapterId: '',
      questionText: '',
      oA: '',
      oB: '',
      oC: '',
      oD: '',
      correctAnswerIndex: 0,
      difficulty: 'Medium',
      marks: 4,
      negativeMarks: 1,
      explanation: ''
    });
    setEditingQuestionId(null);
  };

  const handleOpenAddModal = (subjectId?: string, chapterId?: string) => {
    resetSingleForm();
    if (subjectId) {
      setQuestionForm(prev => ({ ...prev, subjectId, chapterId: chapterId || '' }));
    }
    setModalMode('single');
    setIsModalOpen(true);
  };

  const handleOpenBulkModal = (subjectId?: string) => {
    setBulkSubjectId(subjectId || '');
    setBulkChapterId('');
    setCsvFile(null);
    setModalMode('bulk');
    setIsModalOpen(true);
  };

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionForm.subjectId) {
      showError('Please select a Subject');
      return;
    }
    if (!questionForm.questionText.trim()) {
      showError('Please enter Question Content');
      return;
    }
    const options = [questionForm.oA?.trim(), questionForm.oB?.trim(), questionForm.oC?.trim(), questionForm.oD?.trim()].filter(Boolean) as string[];
    if (options.length < 2) {
      showError('Please enter at least Option A and Option B');
      return;
    }
    const correctAnswer = options[questionForm.correctAnswerIndex] || options[0] || '';

    setLoading(true);
    try {
      const payload = {
        content: questionForm.questionText.trim(),
        options,
        correctAnswer,
        explanation: questionForm.explanation ? questionForm.explanation.trim() : '',
        difficulty: questionForm.difficulty,
        marks: questionForm.marks || 4,
        negativeMarks: questionForm.negativeMarks || 1,
        subjectId: questionForm.subjectId,
        chapterId: questionForm.chapterId || undefined
      };

      let res;
      if (editingQuestionId) {
        res = await fetch(`${API_URL}/api/questions/${editingQuestionId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`${API_URL}/api/questions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
          body: JSON.stringify(payload)
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save question');

      // Auto expand subject and chapter
      if (questionForm.subjectId) {
        setExpandedSubjects(prev => ({ ...prev, [questionForm.subjectId]: true }));
        if (questionForm.chapterId) {
          setExpandedChapters(prev => ({ ...prev, [questionForm.chapterId]: true }));
        }
      }

      setIsModalOpen(false);
      resetSingleForm();
      showSuccess(editingQuestionId ? 'Question updated successfully!' : 'Question added to Question Bank!');
      fetchQuestions();
    } catch (err: any) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile || !bulkSubjectId) {
      showError('Please select a subject and upload a CSV file.');
      return;
    }

    const formData = new FormData();
    formData.append('file', csvFile);
    formData.append('subjectId', bulkSubjectId);
    if (bulkChapterId) formData.append('chapterId', bulkChapterId);

    setBulkLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/questions/bulk-upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Bulk upload failed');
      
      setIsModalOpen(false);
      setCsvFile(null);
      setExpandedSubjects(prev => ({ ...prev, [bulkSubjectId]: true }));
      showSuccess(`🎉 Success! ${data.count} questions uploaded to Question Bank.`);
      fetchQuestions();
    } catch (err: any) {
      showError(err.message);
    } finally {
      setBulkLoading(false);
    }
  };

  const handleEditClick = (q: any) => {
    const qId = q._id || q.id;
    setEditingQuestionId(qId);
    const options = q.options || [];
    let correctIdx = 0;
    if (q.correctAnswer) {
      if (q.correctAnswer.includes('Option A') || q.correctAnswer === options[0]) correctIdx = 0;
      else if (q.correctAnswer.includes('Option B') || q.correctAnswer === options[1]) correctIdx = 1;
      else if (q.correctAnswer.includes('Option C') || q.correctAnswer === options[2]) correctIdx = 2;
      else if (q.correctAnswer.includes('Option D') || q.correctAnswer === options[3]) correctIdx = 3;
    }
    const subId = q.subjectId?._id || q.subjectId || '';

    setQuestionForm({
      id: qId,
      subjectId: subId,
      chapterId: q.chapterId?._id || q.chapterId || '',
      questionText: q.content || q.questionText || '',
      oA: options[0] || '',
      oB: options[1] || '',
      oC: options[2] || '',
      oD: options[3] || '',
      correctAnswerIndex: correctIdx,
      difficulty: q.difficulty || 'Medium',
      marks: q.marks || 4,
      negativeMarks: q.negativeMarks || 1,
      explanation: q.explanation || ''
    });
    setModalMode('single');
    setIsModalOpen(true);
  };

  const handleDeleteQuestion = async (qId: string) => {
    if (!window.confirm("Are you sure you want to delete this question?")) return;
    try {
      const res = await fetch(`${API_URL}/api/questions/${qId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error('Failed to delete question');
      showSuccess("Question deleted successfully.");
      fetchQuestions();
    } catch (err: any) {
      showError(err.message);
    }
  };

  const toggleSubjectExpand = (subId: string) => {
    setExpandedSubjects(prev => ({ ...prev, [subId]: !prev[subId] }));
  };

  const toggleChapterExpand = (chapId: string) => {
    setExpandedChapters(prev => ({ ...prev, [chapId]: !prev[chapId] }));
  };

  return (
    <div className="space-y-6 w-full font-sans">
      {/* Toast Notifications */}
      {errorMsg && (
        <div className="bg-rose-50 text-rose-700 p-4 rounded-xl border border-rose-200 flex items-center gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="font-bold text-xs">{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl border border-emerald-200 flex items-center gap-3 shadow-xs">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
          <span className="font-bold text-xs">{successMsg}</span>
        </div>
      )}

      {/* ── COMPACT ULTRA-EFFICIENT CONTROL PANEL ── */}
      <div className="p-3 sm:p-4 bg-slate-950/60 geom-grid-pattern-dark border-2 border-emerald-500/40 rounded-xl sm:rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.12)] space-y-2.5">
        {/* Row 1: Category Toggle Switch & Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-800/80">
          <div className="flex items-center overflow-x-auto bg-slate-900 p-1 border border-slate-800 rounded-xl no-scrollbar w-full sm:w-auto">
            <button
              onClick={() => {
                setQTab('entrance');
                setSelectedCourseFilter('');
                setSelectedSubjectFilter('');
                setSelectedChapterFilter('all');
              }}
              className={`px-3 py-1.5 text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer border rounded-lg whitespace-nowrap ${
                qTab === 'entrance'
                  ? 'bg-emerald-500 text-black border-emerald-400 shadow-md'
                  : 'text-slate-400 border-transparent hover:text-white'
              }`}
            >
              🎓 ENTRANCE ({entranceExams.length})
            </button>
            <button
              onClick={() => {
                setQTab('competitive');
                setSelectedCourseFilter('');
                setSelectedSubjectFilter('');
                setSelectedChapterFilter('all');
              }}
              className={`px-3 py-1.5 text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer border rounded-lg whitespace-nowrap ${
                qTab === 'competitive'
                  ? 'bg-cyan-500 text-black border-cyan-400 shadow-md'
                  : 'text-slate-400 border-transparent hover:text-white'
              }`}
            >
              🏆 COMPETITIVE ({competitiveExams.length})
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0 justify-end w-full sm:w-auto">
            <button
              onClick={fetchQuestions}
              className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 transition-colors cursor-pointer rounded-lg"
              title="Refresh Question Bank"
            >
              <RefreshCw className={`w-4 h-4 ${listLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => handleOpenBulkModal()}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer rounded-lg"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-400" /> BULK CSV
            </button>
            <button
              onClick={() => handleOpenAddModal()}
              className="px-3 sm:px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black text-[11px] sm:text-xs font-black uppercase tracking-wider shadow-md transition-all flex items-center gap-1.5 cursor-pointer border border-emerald-400 active:scale-95 rounded-lg"
            >
              <PlusCircle className="w-3.5 h-3.5 stroke-[3]" /> + ADD QUESTION
            </button>
          </div>
        </div>

        {/* Row 2: 4-Column Cascading Filter Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {/* 1. SELECT COURSE */}
          <div>
            <label className="block text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest mb-1">
              1. SELECT COURSE / PLAN
            </label>
            <select
              value={selectedCourseFilter}
              onChange={(e) => {
                setSelectedCourseFilter(e.target.value);
                setSelectedSubjectFilter('');
                setSelectedChapterFilter('all');
              }}
              className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold text-xs cursor-pointer focus:outline-none focus:border-emerald-400"
            >
              <option value="">-- Choose Course ({currentCourses.length}) --</option>
              {currentCourses.map((c: any) => (
                <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* 2. SELECT SUBJECT */}
          <div>
            <label className="block text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest mb-1">
              2. SELECT SUBJECT
            </label>
            <select
              value={selectedSubjectFilter}
              disabled={!selectedCourseFilter}
              onChange={(e) => {
                setSelectedSubjectFilter(e.target.value);
                setSelectedChapterFilter('all');
              }}
              className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold text-xs cursor-pointer focus:outline-none focus:border-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <option value="">
                {!selectedCourseFilter ? '-- Select Course First --' : `-- Choose Subject (${availableCourseSubjects.length}) --`}
              </option>
              {availableCourseSubjects.map((s: any) => (
                <option key={s.id || s._id} value={s.id || s._id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* 3. SELECT CHAPTER */}
          <div>
            <label className="block text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest mb-1">
              3. SELECT CHAPTER
            </label>
            <select
              value={selectedChapterFilter}
              disabled={!selectedSubjectFilter}
              onChange={(e) => setSelectedChapterFilter(e.target.value)}
              className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold text-xs cursor-pointer focus:outline-none focus:border-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <option value="all">
                {!selectedSubjectFilter ? '-- Select Subject First --' : `All Chapters in Subject (${availableSubjectChapters.length})`}
              </option>
              {availableSubjectChapters.map((ch: any) => (
                <option key={ch.id || ch._id} value={ch.id || ch._id}>{ch.name}</option>
              ))}
            </select>
          </div>

          {/* 4. SEARCH QUESTIONS */}
          <div>
            <label className="block text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest mb-1">
              4. SEARCH QUESTION TEXT
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search text..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-7 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-400"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── QUESTION DISPLAY TREE (CASCADING WORKFLOW STEP-BY-STEP GUIDANCE) ── */}
      <div className="space-y-4">
        {listLoading ? (
          <div className="p-8 text-center bg-slate-950 border border-slate-800 rounded-none text-slate-400 font-bold animate-pulse text-xs">
            Loading questions database...
          </div>
        ) : !selectedCourseFilter ? (
          <div className="p-8 text-center bg-slate-950 border border-slate-800 rounded-none space-y-2">
            <BookOpen className="w-10 h-10 mx-auto text-emerald-400" />
            <h4 className="text-sm font-black text-white uppercase tracking-wider">Step 1: Select a Course / Plan</h4>
            <p className="text-slate-400 text-xs font-bold">Please select a course from dropdown #1 above to view its included subjects.</p>
          </div>
        ) : !selectedSubjectFilter ? (
          <div className="p-8 text-center bg-slate-950 border border-slate-800 rounded-none space-y-2">
            <Layers className="w-10 h-10 mx-auto text-emerald-400" />
            <h4 className="text-sm font-black text-white uppercase tracking-wider">Step 2: Select a Subject</h4>
            <p className="text-slate-400 text-xs font-bold">Please select a subject from dropdown #2 above to view its chapters and questions.</p>
          </div>
        ) : currentSubjects.length === 0 ? (
          <div className="p-8 text-center bg-slate-950 border border-dashed border-slate-800 rounded-none space-y-2">
            <HelpCircle className="w-10 h-10 mx-auto text-slate-600" />
            <p className="font-bold text-slate-300 text-xs">No questions found for the selected subject.</p>
            <p className="text-slate-400 text-[11px]">Click "+ ADD QUESTION" above to create questions for this subject.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {currentSubjects.map((sub: Subject) => {
              const subId = sub.id || (sub as any)._id;
              const isSubExpanded = expandedSubjects[subId] ?? true;

              // Get all chapters for this subject (sorted by numerical syllabus order: Chapter 1, 2, 3...)
              const subChapters = [...chapters.filter((ch: any) => {
                const cSubId = ch.subjectId?._id || ch.subjectId?.id || ch.subjectId;
                return cSubId === subId;
              })].sort((a: any, b: any) => {
                if (typeof a.chapterNumber === 'number' && typeof b.chapterNumber === 'number') {
                  return a.chapterNumber - b.chapterNumber;
                }
                const extractNum = (str: string) => {
                  const match = (str || '').match(/(?:chapter\s*|ch\s*|\b)(\d+)/i);
                  return match ? parseInt(match[1], 10) : null;
                };
                const numA = extractNum(a.name || a.title);
                const numB = extractNum(b.name || b.title);
                if (numA !== null && numB !== null) {
                  return numA - numB;
                }
                return 0; // Preserve creation / syllabus insertion order
              });

              // Get all questions belonging to this subject & selected chapter
              const subQuestions = allQuestions.filter((q: any) => {
                const qSubId = String(q.subjectId?._id || q.subjectId?.id || q.subjectId || '');
                const targetSubId = String(sub.id || (sub as any)._id || '');
                const targetSubMongoId = String((sub as any)._id || sub.id || '');
                const matchesSub = qSubId === targetSubId || qSubId === targetSubMongoId || qSubId === sub.name || (q.subjectId?.name && q.subjectId.name === sub.name);

                let matchesChapter = true;
                if (selectedChapterFilter !== 'all') {
                  const qChId = String(q.chapterId?._id || q.chapterId?.id || q.chapterId || '');
                  const targetChId = String(selectedChapterFilter);
                  const selChapterObj = availableSubjectChapters.find((ch: any) => String(ch.id || ch._id) === targetChId);
                  const selChapterTitle = (selChapterObj?.name || (selChapterObj as any)?.title || '').toLowerCase();

                  const qChTitle = String(q.chapterId?.title || q.chapterId?.name || '').toLowerCase();

                  matchesChapter = qChId === targetChId || (qChTitle && selChapterTitle && qChTitle === selChapterTitle);
                }

                const matchesSearch = !searchTerm || (q.content || '').toLowerCase().includes(searchTerm.toLowerCase());
                return matchesSub && matchesChapter && matchesSearch;
              });

              // Filter chapters to display
              const displayChapters = selectedChapterFilter !== 'all'
                ? subChapters.filter((ch: any) => String(ch.id || ch._id) === selectedChapterFilter || ch.name === selectedChapterFilter)
                : subChapters;

              return (
                <div key={subId} className="bg-slate-950 border border-slate-800 rounded-none shadow-2xl overflow-hidden">
                  {/* LEVEL 1: SUBJECT HEADER */}
                  <div
                    onClick={() => toggleSubjectExpand(subId)}
                    className="p-4 bg-slate-900 text-white flex items-center justify-between cursor-pointer hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {isSubExpanded ? <ChevronDown className="w-5 h-5 text-emerald-400 shrink-0" /> : <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />}
                      <div className="min-w-0">
                        <span className="text-[9px] font-mono font-bold uppercase text-emerald-400 tracking-wider block">
                          SUBJECT
                        </span>
                        <h4 className="text-base font-black tracking-tight truncate">{sub.name}</h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-mono font-black text-xs rounded-none">
                        {subChapters.length} Chapters
                      </span>
                      <span className="px-3 py-1 bg-white/10 border border-white/20 text-white font-mono font-black text-xs rounded-none">
                        {subQuestions.length} Questions
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenAddModal(subId);
                        }}
                        className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-black rounded-none text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer border border-emerald-400"
                      >
                        <PlusCircle className="w-3.5 h-3.5 stroke-[3]" /> + ADD Q
                      </button>
                    </div>
                  </div>

                  {/* LEVEL 2: CHAPTER-WISE EXPANDABLE SECTIONS */}
                  {isSubExpanded && (
                    <div className="p-4 bg-slate-900 space-y-4">
                      {subQuestions.length === 0 ? (
                        <div className="p-6 text-center bg-slate-950 border border-dashed border-slate-800 rounded-none text-slate-400 text-xs italic">
                          No questions found for {sub.name}. Click "+ ADD Q" above to create questions.
                        </div>
                      ) : (
                        <>
                          {/* CHAPTER GROUPS */}
                          {displayChapters.map((ch: any) => {
                            const chId = ch.id || ch._id;
                            const isChExpanded = expandedChapters[chId] ?? true;

                            // Filter questions for this chapter
                            const chQuestions = subQuestions.filter((q: any) => {
                              const qChId = String(q.chapterId?._id || q.chapterId?.id || q.chapterId || '');
                              const targetChId = String(ch.id || ch._id || '');
                              return qChId === targetChId || (q.chapterId?.name && q.chapterId.name === ch.name);
                            });

                            if (chQuestions.length === 0 && searchTerm) return null;

                            return (
                              <div key={chId} className="border border-slate-800 rounded-none bg-slate-950 overflow-hidden shadow-xl">
                                {/* Chapter Title Bar */}
                                <div
                                  onClick={() => toggleChapterExpand(chId)}
                                  className="p-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-800/80 transition-colors"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    {isChExpanded ? <ChevronDown className="w-4 h-4 text-emerald-400" /> : <ChevronRight className="w-4 h-4 text-emerald-400" />}
                                    <FolderOpen className="w-4 h-4 text-emerald-400 shrink-0" />
                                    <h5 className="font-black text-white text-xs sm:text-sm truncate uppercase tracking-wider">
                                      Chapter: {ch.name}
                                    </h5>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="px-2.5 py-0.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-mono font-black text-[10px] rounded-none">
                                      {chQuestions.length} Questions
                                    </span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenAddModal(subId, chId);
                                      }}
                                      className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-black rounded-none text-[10px] font-black uppercase tracking-wider transition-colors flex items-center gap-1 cursor-pointer border border-emerald-400"
                                    >
                                      <PlusCircle className="w-3 h-3 stroke-[3]" /> + ADD Q
                                    </button>
                                  </div>
                                </div>

                                {/* Chapter Questions List */}
                                {isChExpanded && (
                                  <div className="p-3 space-y-3 bg-slate-950">
                                    {chQuestions.length === 0 ? (
                                      <p className="text-slate-400 text-xs italic p-2 text-center">No questions added to this chapter yet.</p>
                                    ) : (
                                      chQuestions.map((q: any, qIdx: number) => (
                                        <QuestionCard
                                          key={q._id || q.id || qIdx}
                                          q={q}
                                          index={qIdx + 1}
                                          onEdit={() => handleEditClick(q)}
                                          onDelete={() => handleDeleteQuestion(q._id || q.id)}
                                        />
                                      ))
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}

                          {/* UNCATEGORIZED / GENERAL QUESTIONS (No chapter specified or unmatched) */}
                          {(() => {
                            const matchedChapterIds = subChapters.map((ch: any) => String(ch.id || ch._id));
                            const unassignedQuestions = subQuestions.filter((q: any) => {
                              const qChId = String(q.chapterId?._id || q.chapterId?.id || q.chapterId || '');
                              return !qChId || !matchedChapterIds.includes(qChId);
                            });

                            if (unassignedQuestions.length === 0) return null;

                            return (
                              <div className="border border-slate-800 rounded-none bg-slate-950 overflow-hidden shadow-xl">
                                <div className="p-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <HelpCircle className="w-4 h-4 text-emerald-400" />
                                    <h5 className="font-black text-white text-xs sm:text-sm uppercase tracking-wider">
                                      General / Unassigned Chapter Questions
                                    </h5>
                                  </div>
                                  <span className="px-2.5 py-0.5 bg-slate-800 border border-slate-700 text-emerald-400 font-mono font-black text-[10px] rounded-none">
                                    {unassignedQuestions.length} Questions
                                  </span>
                                </div>

                                <div className="p-3 space-y-3 bg-slate-950">
                                  {unassignedQuestions.map((q: any, qIdx: number) => (
                                    <QuestionCard
                                      key={q._id || q.id || qIdx}
                                      q={q}
                                      index={qIdx + 1}
                                      onEdit={() => handleEditClick(q)}
                                      onDelete={() => handleDeleteQuestion(q._id || q.id)}
                                    />
                                  ))}
                                </div>
                              </div>
                            );
                          })()}
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── MODAL: CREATE / EDIT QUESTION OR BULK CSV UPLOAD ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto font-sans">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl w-full max-w-2xl space-y-4 text-slate-900 relative my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold">
                  {modalMode === 'single' ? <BookOpen className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {modalMode === 'bulk' ? 'Bulk Upload Questions (CSV)' : editingQuestionId ? 'Edit Question' : 'Add Single Question'}
                  </h3>
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                    Category: {qTab === 'entrance' ? 'Entrance Test' : 'Competitive Exam'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => { setIsModalOpen(false); resetSingleForm(); }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode 1: Single Question Form */}
            {modalMode === 'single' ? (
              <form onSubmit={handleSingleSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-bold uppercase tracking-wider mb-1">Subject</label>
                    <select
                      value={questionForm.subjectId}
                      onChange={(e) => setQuestionForm({ ...questionForm, subjectId: e.target.value, chapterId: '' })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer"
                      required
                    >
                      <option value="">Select Subject</option>
                      {currentSubjects.map((sub: Subject) => (
                        <option key={sub.id || (sub as any)._id} value={sub.id || (sub as any)._id}>{sub.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold uppercase tracking-wider mb-1">Chapter (Optional)</label>
                    <select
                      value={questionForm.chapterId}
                      onChange={(e) => setQuestionForm({ ...questionForm, chapterId: e.target.value })}
                      disabled={!questionForm.subjectId}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer disabled:opacity-50 disabled:bg-slate-100"
                    >
                      <option value="">{questionForm.subjectId ? 'Select Chapter' : 'Select Subject first'}</option>
                      {questionForm.subjectId && chapters
                        .filter((c: any) => {
                          const cSubId = c.subjectId?._id || c.subjectId?.id || c.subjectId;
                          return cSubId === questionForm.subjectId;
                        })
                        .map((ch: any) => (
                          <option key={ch.id || ch._id} value={ch.id || ch._id}>{ch.name}</option>
                        ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold uppercase tracking-wider mb-1">Question Text</label>
                  <textarea
                    value={questionForm.questionText}
                    onChange={(e) => setQuestionForm({ ...questionForm, questionText: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-emerald-500 h-24"
                    placeholder="Enter question text here..."
                    required
                  />
                </div>

                {/* Options Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-bold uppercase tracking-wider mb-1">Option A</label>
                    <input type="text" value={questionForm.oA} onChange={(e) => setQuestionForm({ ...questionForm, oA: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold" required placeholder="Option A" />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold uppercase tracking-wider mb-1">Option B</label>
                    <input type="text" value={questionForm.oB} onChange={(e) => setQuestionForm({ ...questionForm, oB: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold" required placeholder="Option B" />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold uppercase tracking-wider mb-1">Option C</label>
                    <input type="text" value={questionForm.oC} onChange={(e) => setQuestionForm({ ...questionForm, oC: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold" required placeholder="Option C" />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold uppercase tracking-wider mb-1">Option D</label>
                    <input type="text" value={questionForm.oD} onChange={(e) => setQuestionForm({ ...questionForm, oD: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold" required placeholder="Option D" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-bold uppercase tracking-wider mb-1">Correct Option</label>
                    <select
                      value={questionForm.correctAnswerIndex}
                      onChange={(e) => setQuestionForm({ ...questionForm, correctAnswerIndex: parseInt(e.target.value, 10) })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold"
                    >
                      <option value={0}>Option A</option>
                      <option value={1}>Option B</option>
                      <option value={2}>Option C</option>
                      <option value={3}>Option D</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold uppercase tracking-wider mb-1">Difficulty</label>
                    <select
                      value={questionForm.difficulty}
                      onChange={(e) => setQuestionForm({ ...questionForm, difficulty: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold uppercase tracking-wider mb-1">Answer Explanation (Optional)</label>
                  <textarea
                    value={questionForm.explanation}
                    onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none h-16"
                    placeholder="Explain why the correct answer is right..."
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => { setIsModalOpen(false); resetSingleForm(); }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer border border-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : editingQuestionId ? 'Update Question' : 'Save Question'}
                  </button>
                </div>
              </form>
            ) : (
              /* Mode 2: Bulk CSV Upload Form */
              <form onSubmit={handleBulkUploadSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-bold uppercase tracking-wider mb-1">Subject</label>
                    <select
                      value={bulkSubjectId}
                      onChange={(e) => { setBulkSubjectId(e.target.value); setBulkChapterId(''); }}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none cursor-pointer"
                      required
                    >
                      <option value="">Select Subject</option>
                      {currentSubjects.map((sub: Subject) => (
                        <option key={sub.id || (sub as any)._id} value={sub.id || (sub as any)._id}>{sub.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold uppercase tracking-wider mb-1">Chapter (Optional)</label>
                    <select
                      value={bulkChapterId}
                      onChange={(e) => setBulkChapterId(e.target.value)}
                      disabled={!bulkSubjectId}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none cursor-pointer disabled:opacity-50 disabled:bg-slate-100"
                    >
                      <option value="">{bulkSubjectId ? 'Select Chapter' : 'Select Subject first'}</option>
                      {bulkSubjectId && chapters
                        .filter((c: any) => {
                          const cSubId = c.subjectId?._id || c.subjectId?.id || c.subjectId;
                          return cSubId === bulkSubjectId;
                        })
                        .map((ch: any) => (
                          <option key={ch.id || ch._id} value={ch.id || ch._id}>{ch.name}</option>
                        ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold uppercase tracking-wider mb-1">Select CSV File</label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold text-xs cursor-pointer"
                    required
                  />
                  <p className="text-[10px] text-slate-500 mt-2 font-medium">
                    CSV Format Headers: <code>Question, Option A, Option B, Option C, Option D, Correct Answer, Explanation, Difficulty</code>
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => { setIsModalOpen(false); setCsvFile(null); }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer border border-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={bulkLoading || !csvFile}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    {bulkLoading ? 'Uploading...' : 'Start Bulk Upload'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── REUSABLE QUESTION CARD COMPONENT ──
function QuestionCard({ q, index, onEdit, onDelete }: { q: any; index: number; onEdit: () => void; onDelete: () => void }) {
  const options = q.options || [];

  return (
    <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-3 shadow-2xs hover:border-emerald-400 transition-all group">
      <div className="flex justify-between items-start gap-3">
        <div className="flex items-start gap-2 min-w-0">
          <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-800 font-mono font-black text-[11px] flex items-center justify-center shrink-0 border border-emerald-200">
            Q{index}
          </span>
          <div className="min-w-0">
            <h6 className="font-black text-slate-900 text-xs sm:text-sm leading-relaxed">{q.content}</h6>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-black uppercase border ${
            (q.difficulty || 'medium').toLowerCase() === 'easy' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
            (q.difficulty || 'medium').toLowerCase() === 'hard' ? 'bg-rose-50 text-rose-700 border-rose-200' :
            'bg-amber-50 text-amber-800 border-amber-200'
          }`}>
            {q.difficulty || 'Medium'}
          </span>
          <button
            onClick={onEdit}
            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-200 cursor-pointer"
            title="Edit Question"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200 cursor-pointer"
            title="Delete Question"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Options Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
        {options.map((opt: string, oIdx: number) => {
          const letter = String.fromCharCode(65 + oIdx); // 'A', 'B', 'C', 'D'
          const optLabel = `Option ${letter}`;
          const normalizedAnswer = (q.correctAnswer || '').toString().trim();

          const isCorrect =
            normalizedAnswer.toUpperCase() === letter ||
            normalizedAnswer.toLowerCase() === optLabel.toLowerCase() ||
            normalizedAnswer === opt ||
            normalizedAnswer === String(oIdx) ||
            normalizedAnswer.toUpperCase().startsWith(letter + '.') ||
            normalizedAnswer.toUpperCase().startsWith(letter + ')');

          return (
            <div
              key={oIdx}
              className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-between gap-2 transition-all ${
                isCorrect 
                  ? 'bg-emerald-100/80 border-emerald-500 text-emerald-950 font-black shadow-xs ring-1 ring-emerald-400/30' 
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 pr-1">
                <span className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center shrink-0 font-mono ${
                  isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {letter}
                </span>
                <span className="truncate">{opt}</span>
              </div>
              {isCorrect && (
                <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-black text-[10px] uppercase tracking-wider shrink-0 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Correct
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Explanation */}
      {q.explanation && (
        <div className="text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-600 font-medium">
          💡 <strong>Explanation:</strong> {q.explanation}
        </div>
      )}
    </div>
  );
}
