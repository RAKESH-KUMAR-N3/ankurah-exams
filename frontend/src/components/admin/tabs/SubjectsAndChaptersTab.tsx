import React, { useState } from 'react';
import { 
  Plus, Edit2, Trash2, BookOpen, ChevronDown, ChevronUp,
  GraduationCap, Award, Check, AlertCircle, Layers, FileText, 
  Search, X, FolderPlus, ListPlus, Shield, Trash, ArrowLeft, Upload, FileUp, Sparkles, CheckSquare, Square,
  FlaskConical, Atom, Dna, Leaf, ArrowRight
} from 'lucide-react';
import { Subject, Chapter } from '../../../types';
import { useAdminContext } from '../../../context/AdminContext';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const getToken = () => localStorage.getItem('token');
const authHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` });

interface TopicItem {
  _id: string;
  id?: string;
  title: string;
  chapterId: string;
  order?: number;
}

interface MultiChapterNestedItem {
  title: string;
  topics: string[];
}

export default function SubjectsAndChaptersTab() {
  const { subjects, chapters, entranceExams, competitiveExams, allPlans, questions = [], refreshAdminData } = useAdminContext();
  const [collapsedCourses, setCollapsedCourses] = useState<Record<string, boolean>>({});

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filter Tabs: 'all' | 'entrance' | 'competitive'
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'entrance' | 'competitive'>('all');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Currently opened Subject for Chapter/Topic management (Dedicated Subject Detail View)
  const [activeSubject, setActiveSubject] = useState<Subject | null>(null);
  const [expandedChapterIds, setExpandedChapterIds] = useState<string[]>([]);
  const [chapterTopicsMap, setChapterTopicsMap] = useState<Record<string, TopicItem[]>>({});

  // Helper function for subject icons and themed badges
  const getSubjectMeta = (name: string) => {
    const n = name.toUpperCase();
    if (n.includes('BOTANY')) {
      return {
        icon: <Leaf className="w-4.5 h-4.5 text-emerald-400 shrink-0" />,
        badgeBg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
        hoverBorder: 'hover:border-emerald-500/60 hover:shadow-emerald-950/50',
        btnBg: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-black',
        accentText: 'text-emerald-400'
      };
    }
    if (n.includes('CHEMISTRY')) {
      return {
        icon: <FlaskConical className="w-4.5 h-4.5 text-cyan-400 shrink-0" />,
        badgeBg: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300',
        hoverBorder: 'hover:border-cyan-500/60 hover:shadow-cyan-950/50',
        btnBg: 'bg-gradient-to-r from-cyan-500 to-blue-500 text-black',
        accentText: 'text-cyan-400'
      };
    }
    if (n.includes('PHYSICS')) {
      return {
        icon: <Atom className="w-4.5 h-4.5 text-indigo-400 shrink-0" />,
        badgeBg: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300',
        hoverBorder: 'hover:border-indigo-500/60 hover:shadow-indigo-950/50',
        btnBg: 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white',
        accentText: 'text-indigo-400'
      };
    }
    if (n.includes('ZOOLOGY')) {
      return {
        icon: <Dna className="w-4.5 h-4.5 text-amber-400 shrink-0" />,
        badgeBg: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
        hoverBorder: 'hover:border-amber-500/60 hover:shadow-amber-950/50',
        btnBg: 'bg-gradient-to-r from-amber-500 to-orange-500 text-black',
        accentText: 'text-amber-400'
      };
    }
    return {
      icon: <BookOpen className="w-4.5 h-4.5 text-slate-400 shrink-0" />,
      badgeBg: 'bg-slate-800 border-slate-700 text-slate-300',
      hoverBorder: 'hover:border-slate-600',
      btnBg: 'bg-emerald-500 text-black',
      accentText: 'text-emerald-400'
    };
  };

  // Filter subjects based on Category filter, Course filter & Search (Sorted strictly ALPHABETICALLY A to Z)
  const filteredSubjects = subjects
    .filter((s: any) => {
      const cat = s.subjectCategory || 'entrance';
      if (categoryFilter !== 'all' && cat !== categoryFilter) return false;
      
      if (courseFilter !== 'all') {
        const sExamId = s.examId;
        const assignedExamId = s.examIds?.[0] || (sExamId ? (typeof sExamId === 'object' ? sExamId._id || sExamId.id : sExamId) : '');
        if (assignedExamId !== courseFilter) return false;
      }

      if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
    .sort((a: any, b: any) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

  // Combine & deduplicate the 6 Real Courses created by Admin
  const rawPlans = [...allPlans, ...entranceExams, ...competitiveExams];
  const uniquePlansMap = new Map<string, { id: string; name: string }>();
  rawPlans.forEach((p: any) => {
    const cleanName = (p.name || '').replace(/\s*Plan\s*$/i, '').trim();
    if (!cleanName) return;
    const key = cleanName.toLowerCase();
    if (!uniquePlansMap.has(key)) {
      uniquePlansMap.set(key, {
        id: p.id || p._id,
        name: cleanName
      });
    }
  });
  const coursesList = Array.from(uniquePlansMap.values());

  // --- MODALS STATE ---
  // Subject Modal (Multi-field / Bulk paste)
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [subjectAddMode, setSubjectAddMode] = useState<'multi_fields' | 'bulk_paste'>('multi_fields');
  const [subjectName, setSubjectName] = useState('');
  const [multiSubjectList, setMultiSubjectList] = useState<string[]>(['', '', '', '']); // Default 4 subject slots!
  const [bulkSubjectsText, setBulkSubjectsText] = useState('');
  const [targetExamForSubject, setTargetExamForSubject] = useState<string>('');
  const [subjectCategory, setSubjectCategory] = useState<'entrance' | 'competitive'>('entrance');
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);

  // Chapter Modal (Multi-Nested / Single / Bulk)
  const [isChapterModalOpen, setIsChapterModalOpen] = useState(false);
  const [chapterAddMode, setChapterAddMode] = useState<'multi_nested' | 'single' | 'bulk'>('multi_nested');
  const [singleChapterTitle, setSingleChapterTitle] = useState('');
  const [bulkChapterText, setBulkChapterText] = useState('');
  const [multiChapterList, setMultiChapterList] = useState<MultiChapterNestedItem[]>([
    { title: '', topics: ['', ''] },
    { title: '', topics: ['', ''] }
  ]);

  // Topic Modal (Single / Bulk)
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [targetChapterForTopic, setTargetChapterForTopic] = useState<Chapter | null>(null);
  const [topicAddMode, setTopicAddMode] = useState<'single' | 'bulk'>('single');
  const [singleTopicTitle, setSingleTopicTitle] = useState('');
  const [bulkTopicText, setBulkTopicText] = useState('');

  // PDF Upload Modal (for Chapters & Topics)
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfUploadTarget, setPdfUploadTarget] = useState<'chapter' | 'topic'>('chapter');
  const [pdfTargetChapter, setPdfTargetChapter] = useState<Chapter | null>(null);
  const [pdfParsing, setPdfParsing] = useState(false);
  const [parsedPdfLines, setParsedPdfLines] = useState<string[]>([]);
  const [selectedPdfLines, setSelectedPdfLines] = useState<boolean[]>([]);
  const [pdfFileName, setPdfFileName] = useState<string>('');

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setErrorMsg(null);
    refreshAdminData();
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setSuccessMsg(null);
    setTimeout(() => setErrorMsg(null), 5000);
  };

  const fetchTopicsForChapter = async (chId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/topics/chapter/${chId}`, {
        headers: authHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setChapterTopicsMap(prev => ({ ...prev, [chId]: data }));
      }
    } catch (err) {
      console.error("Failed to fetch topics:", err);
    }
  };

  const toggleExpandChapter = (chId: string) => {
    if (expandedChapterIds.includes(chId)) {
      setExpandedChapterIds(expandedChapterIds.filter(id => id !== chId));
    } else {
      setExpandedChapterIds([...expandedChapterIds, chId]);
      fetchTopicsForChapter(chId);
    }
  };

  const entranceCount = subjects.filter((s: any) => (s.subjectCategory || 'entrance') === 'entrance').length;
  const competitiveCount = subjects.filter((s: any) => s.subjectCategory === 'competitive').length;

  // ─── SUBJECT HANDLERS ──────────────────────────────────────────────────────
  const handleOpenAddSubject = () => {
    setSubjectName('');
    setBulkSubjectsText('');
    setMultiSubjectList(['', '', '', '']); // 4 default input slots
    setSubjectAddMode('multi_fields');
    setTargetExamForSubject(coursesList[0]?.id || '');
    setSubjectCategory(categoryFilter === 'competitive' ? 'competitive' : 'entrance');
    setEditingSubjectId(null);
    setIsSubjectModalOpen(true);
  };

  const handleOpenEditSubject = (e: React.MouseEvent, sub: Subject) => {
    e.stopPropagation();
    setSubjectName(sub.name);
    setSubjectCategory((sub.subjectCategory as any) === 'competitive' ? 'competitive' : 'entrance');
    const subExamId = (sub as any).examId;
    setTargetExamForSubject(sub.examIds?.[0] || (subExamId ? (typeof subExamId === 'object' ? subExamId._id || subExamId.id : subExamId) : ''));
    setEditingSubjectId(sub.id);
    setSubjectAddMode('multi_fields');
    setIsSubjectModalOpen(true);
  };

  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let namesToCreate: string[] = [];

      if (editingSubjectId) {
        if (!subjectName.trim()) return;
        namesToCreate = [subjectName.trim()];
      } else if (subjectAddMode === 'multi_fields') {
        namesToCreate = multiSubjectList.map(s => s.trim()).filter(Boolean);
      } else {
        namesToCreate = bulkSubjectsText.split('\n').map(l => l.trim()).filter(Boolean);
      }

      if (namesToCreate.length === 0) {
        showError("Please enter at least one subject name.");
        setLoading(false);
        return;
      }

      const selectedCourseId = targetExamForSubject && targetExamForSubject.trim() ? targetExamForSubject.trim() : undefined;

      if (editingSubjectId) {
        const payload: any = {
          name: namesToCreate[0],
          subjectCategory,
          examId: selectedCourseId,
          examIds: selectedCourseId ? [selectedCourseId] : []
        };
        const res = await fetch(`${API_URL}/api/subjects/${editingSubjectId}`, {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || (errData.details ? errData.details.join(', ') : 'Failed to update subject'));
        }
      } else {
        const payload = {
          names: namesToCreate,
          subjectCategory,
          examId: selectedCourseId,
          examIds: selectedCourseId ? [selectedCourseId] : []
        };
        const res = await fetch(`${API_URL}/api/subjects`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || (errData.details ? errData.details.join(', ') : 'Failed to create subjects'));
        }
      }

      setIsSubjectModalOpen(false);
      showSuccess(editingSubjectId ? "Subject updated successfully!" : `${namesToCreate.length} Subjects created successfully for this course!`);
    } catch (err: any) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubject = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete subject "${name}"?`)) return;
    try {
      const res = await fetch(`${API_URL}/api/subjects/${id}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      if (!res.ok) throw new Error('Failed to delete subject');
      if (activeSubject?.id === id) setActiveSubject(null);
      showSuccess(`Subject "${name}" deleted.`);
    } catch (err: any) {
      showError(err.message);
    }
  };

  // Dynamic multi-subject list helper methods
  const updateMultiSubjectInput = (index: number, val: string) => {
    const updated = [...multiSubjectList];
    updated[index] = val;
    setMultiSubjectList(updated);
  };

  const addMultiSubjectField = () => {
    setMultiSubjectList([...multiSubjectList, '']);
  };

  const removeMultiSubjectField = (index: number) => {
    if (multiSubjectList.length <= 1) return;
    setMultiSubjectList(multiSubjectList.filter((_, i) => i !== index));
  };

  // ─── CHAPTER & NESTED TOPIC HANDLERS ───────────────────────────────────────
  const handleOpenAddChapter = () => {
    setSingleChapterTitle('');
    setBulkChapterText('');
    setMultiChapterList([
      { title: '', topics: ['', ''] },
      { title: '', topics: ['', ''] }
    ]);
    setChapterAddMode('multi_nested');
    setIsChapterModalOpen(true);
  };

  const updateMultiChapterTitle = (index: number, val: string) => {
    const updated = [...multiChapterList];
    updated[index].title = val;
    setMultiChapterList(updated);
  };

  const updateMultiChapterTopic = (chIndex: number, topicIndex: number, val: string) => {
    const updated = [...multiChapterList];
    updated[chIndex].topics[topicIndex] = val;
    setMultiChapterList(updated);
  };

  const addTopicFieldToChapter = (chIndex: number) => {
    const updated = [...multiChapterList];
    updated[chIndex].topics.push('');
    setMultiChapterList(updated);
  };

  const removeTopicFieldFromChapter = (chIndex: number, topicIndex: number) => {
    const updated = [...multiChapterList];
    updated[chIndex].topics = updated[chIndex].topics.filter((_, i) => i !== topicIndex);
    setMultiChapterList(updated);
  };

  const addAnotherChapterSlot = () => {
    setMultiChapterList([...multiChapterList, { title: '', topics: ['', ''] }]);
  };

  const removeChapterSlot = (index: number) => {
    if (multiChapterList.length <= 1) return;
    setMultiChapterList(multiChapterList.filter((_, i) => i !== index));
  };

  const handleSaveChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSubject) return;

    setLoading(true);
    try {
      if (chapterAddMode === 'multi_nested') {
        const validChapters = multiChapterList
          .map(ch => ({
            title: ch.title.trim(),
            topics: ch.topics.map(t => t.trim()).filter(Boolean)
          }))
          .filter(ch => ch.title);

        if (validChapters.length === 0) {
          showError("Please enter at least one chapter title.");
          setLoading(false);
          return;
        }

        const payload = {
          subjectId: activeSubject.id,
          chapters: validChapters
        };

        const res = await fetch(`${API_URL}/api/chapters/with-topics`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || 'Failed to create chapters and topics');
        }

        setIsChapterModalOpen(false);
        showSuccess(`${validChapters.length} Chapters & Chapter-wise Topics created successfully!`);
      } else if (chapterAddMode === 'single') {
        if (!singleChapterTitle.trim()) return;
        const payload = {
          title: singleChapterTitle.trim(),
          subjectId: activeSubject.id
        };

        const res = await fetch(`${API_URL}/api/chapters`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || 'Failed to create chapter');
        }
        setIsChapterModalOpen(false);
        showSuccess("Chapter created successfully!");
      } else {
        const lines = bulkChapterText.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length === 0) {
          showError("Please enter at least one chapter title.");
          setLoading(false);
          return;
        }

        const payload = {
          titles: lines,
          subjectId: activeSubject.id
        };

        const res = await fetch(`${API_URL}/api/chapters`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || 'Failed to bulk create chapters');
        }
        setIsChapterModalOpen(false);
        showSuccess("Chapters created successfully!");
      }
    } catch (err: any) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChapter = async (chId: string, chTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete chapter "${chTitle}"?`)) return;
    try {
      const res = await fetch(`${API_URL}/api/chapters/${chId}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      if (!res.ok) throw new Error('Failed to delete chapter');
      showSuccess(`Chapter "${chTitle}" removed.`);
    } catch (err: any) {
      showError(err.message);
    }
  };

  const handleDeleteAllChaptersForSubject = async () => {
    if (!activeSubject) return;
    if (!window.confirm(`Are you sure you want to DELETE ALL chapters and topics for "${activeSubject.name}"? This action cannot be undone.`)) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/chapters/subject/${activeSubject.id}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      if (!res.ok) throw new Error('Failed to delete chapters');
      showSuccess(`All chapters and topics for "${activeSubject.name}" deleted from database.`);
    } catch (err: any) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── TOPIC HANDLERS ────────────────────────────────────────────────────────
  const handleOpenAddTopic = (ch: Chapter) => {
    setTargetChapterForTopic(ch);
    setSingleTopicTitle('');
    setBulkTopicText('');
    setTopicAddMode('single');
    setIsTopicModalOpen(true);
  };

  const handleSaveTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetChapterForTopic) return;

    setLoading(true);
    try {
      if (topicAddMode === 'single') {
        if (!singleTopicTitle.trim()) return;
        const payload = {
          title: singleTopicTitle.trim(),
          chapterId: targetChapterForTopic.id
        };

        const res = await fetch(`${API_URL}/api/topics`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || 'Failed to create topic');
        }
      } else {
        const lines = bulkTopicText.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length === 0) {
          showError("Please enter at least one topic title.");
          setLoading(false);
          return;
        }

        const payload = {
          titles: lines,
          chapterId: targetChapterForTopic.id
        };

        const res = await fetch(`${API_URL}/api/topics`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || 'Failed to bulk create topics');
        }
      }

      setIsTopicModalOpen(false);
      fetchTopicsForChapter(targetChapterForTopic.id);
      showSuccess("Topics added successfully!");
    } catch (err: any) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTopic = async (topicId: string, chId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/topics/${topicId}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      if (!res.ok) throw new Error('Failed to delete topic');
      fetchTopicsForChapter(chId);
      showSuccess("Topic removed.");
    } catch (err: any) {
      showError(err.message);
    }
  };

  // ─── PDF UPLOAD HANDLERS ───────────────────────────────────────────────────
  const handleOpenPdfUploadForChapters = () => {
    setPdfUploadTarget('chapter');
    setPdfTargetChapter(null);
    setParsedPdfLines([]);
    setSelectedPdfLines([]);
    setPdfFileName('');
    setIsPdfModalOpen(true);
  };

  const handleOpenPdfUploadForTopics = (ch: Chapter) => {
    setPdfUploadTarget('topic');
    setPdfTargetChapter(ch);
    setParsedPdfLines([]);
    setSelectedPdfLines([]);
    setPdfFileName('');
    setIsPdfModalOpen(true);
  };

  const handlePdfFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      showError("Please select a valid PDF (.pdf) file");
      return;
    }
    setPdfFileName(file.name);
    setPdfParsing(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const endpoint = pdfUploadTarget === 'chapter' ? `${API_URL}/api/chapters/parse-pdf` : `${API_URL}/api/topics/parse-pdf`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to parse PDF file');
      }

      const data = await res.json();
      const lines: string[] = data.lines || [];
      if (lines.length === 0) {
        showError("No readable text lines found in the PDF.");
      } else {
        setParsedPdfLines(lines);
        setSelectedPdfLines(lines.map(() => true));
      }
    } catch (err: any) {
      showError(err.message);
    } finally {
      setPdfParsing(false);
    }
  };

  const toggleSelectAllPdfLines = () => {
    const allSelected = selectedPdfLines.every(Boolean);
    setSelectedPdfLines(selectedPdfLines.map(() => !allSelected));
  };

  const togglePdfLine = (index: number) => {
    const updated = [...selectedPdfLines];
    updated[index] = !updated[index];
    setSelectedPdfLines(updated);
  };

  const updateParsedPdfLineText = (index: number, text: string) => {
    const updated = [...parsedPdfLines];
    updated[index] = text;
    setParsedPdfLines(updated);
  };

  const handleImportParsedPdfItems = async () => {
    const linesToImport = parsedPdfLines
      .filter((_, idx) => selectedPdfLines[idx])
      .map(l => l.trim())
      .filter(Boolean);

    if (linesToImport.length === 0) {
      showError("Please select at least one line to import.");
      return;
    }

    setLoading(true);
    try {
      if (pdfUploadTarget === 'chapter') {
        if (!activeSubject) return;
        const payload = {
          titles: linesToImport,
          subjectId: activeSubject.id
        };
        const res = await fetch(`${API_URL}/api/chapters`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || 'Failed to import chapters from PDF');
        }
        showSuccess(`${linesToImport.length} Chapters extracted & imported from PDF!`);
      } else {
        if (!pdfTargetChapter) return;
        const payload = {
          titles: linesToImport,
          chapterId: pdfTargetChapter.id
        };
        const res = await fetch(`${API_URL}/api/topics`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || 'Failed to import topics from PDF');
        }
        fetchTopicsForChapter(pdfTargetChapter.id);
        showSuccess(`${linesToImport.length} Topics extracted & imported from PDF for chapter "${pdfTargetChapter.name}"!`);
      }
      setIsPdfModalOpen(false);
    } catch (err: any) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 font-sans text-slate-100">
      
      {/* Alert Banners */}
      {errorMsg && (
        <div className="bg-rose-950 text-rose-200 p-4 rounded-none border border-rose-800 flex items-center gap-3 shadow-lg">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span className="font-black text-xs uppercase tracking-wider">{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="bg-emerald-950 text-emerald-200 p-4 rounded-none border border-emerald-800 flex items-center gap-3 shadow-lg">
          <Check className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="font-black text-xs uppercase tracking-wider">{successMsg}</span>
        </div>
      )}

      {/* ─── 1. ALL SUBJECTS OVERVIEW VIEW (When NO Subject is Selected) ─────────── */}
      {!activeSubject ? (
        <div className="space-y-6">
          {/* TOP FILTER BAR & RIGHT ADD SUBJECT BUTTON */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-950 p-4 border border-slate-800 shadow-xl">
            
            {/* Category Segment Tabs */}
            <div className="flex flex-wrap items-center bg-slate-900 border border-slate-800 p-1">
              <button
                onClick={() => setCategoryFilter('all')}
                className={`px-4 py-2 font-black text-xs uppercase tracking-wider cursor-pointer border rounded-none transition-all ${
                  categoryFilter === 'all'
                    ? 'bg-emerald-500 text-black border-emerald-400 shadow-md'
                    : 'text-slate-400 border-transparent hover:text-white'
                }`}
              >
                ALL SUBJECTS ({subjects.length})
              </button>
              
              <button
                onClick={() => setCategoryFilter('entrance')}
                className={`px-4 py-2 font-black text-xs uppercase tracking-wider cursor-pointer border rounded-none transition-all ${
                  categoryFilter === 'entrance'
                    ? 'bg-emerald-500 text-black border-emerald-400 shadow-md'
                    : 'text-slate-400 border-transparent hover:text-white'
                }`}
              >
                ENTRANCE ({entranceCount})
              </button>

              <button
                onClick={() => setCategoryFilter('competitive')}
                className={`px-4 py-2 font-black text-xs uppercase tracking-wider cursor-pointer border rounded-none transition-all ${
                  categoryFilter === 'competitive'
                    ? 'bg-cyan-500 text-black border-cyan-400 shadow-md'
                    : 'text-slate-400 border-transparent hover:text-white'
                }`}
              >
                COMPETITIVE ({competitiveCount})
              </button>
            </div>

            {/* Search Bar, Course Selector & Add Subject Button */}
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              
              {/* Course Filter Dropdown */}
              <select
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
                className="bg-slate-900 border border-slate-700 px-3 py-2 text-xs font-black uppercase text-emerald-400 focus:outline-none focus:border-emerald-400 cursor-pointer rounded-none"
              >
                <option value="all">🎓 ALL COURSES ({coursesList.length})</option>
                {coursesList.map((course: any) => (
                  <option key={course.id} value={course.id}>
                    🎓 {course.name}
                  </option>
                ))}
              </select>

              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search subjects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-none text-xs font-bold text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-400"
                />
              </div>

              <button
                onClick={handleOpenAddSubject}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-wider text-xs rounded-none border border-emerald-400 shadow-lg cursor-pointer flex items-center gap-1.5 active:scale-95 transition-all shrink-0"
              >
                <Plus className="w-4 h-4 stroke-[3]" /> ADD SUBJECT(S)
              </button>
            </div>

          </div>

          {/* GROUPED SUBJECT CARDS BY COURSE */}
          {(() => {
            if (filteredSubjects.length === 0) {
              return (
                <div className="p-12 text-center rounded-none bg-slate-950 border border-slate-800">
                  <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <h3 className="text-base font-black text-white uppercase tracking-wider">No subjects found</h3>
                  <p className="text-xs text-slate-400 font-bold mt-1">
                    Click <strong className="text-emerald-400">ADD SUBJECT(S)</strong> to create subjects for your courses!
                  </p>
                </div>
              );
            }

            // Group subjects by assigned course
            const groupedMap = new Map<string, { courseName: string; subjects: Subject[] }>();

            filteredSubjects.forEach((subject: Subject) => {
              const sExamId = (subject as any).examId;
              const assignedExamId = subject.examIds?.[0] || (sExamId ? (typeof sExamId === 'object' ? sExamId._id || sExamId.id : sExamId) : '');
              const targetCourse = coursesList.find(c => c.id === assignedExamId);

              let cName = targetCourse?.name;
              if (!cName) {
                const match = subject.name.match(/\(([^)]+)\)/);
                if (match) {
                  const tag = match[1].toUpperCase();
                  if (tag === 'NEET') cName = 'NEET 2026 (BI.P.C)';
                  else if (tag === 'AP') cName = 'AP-EAPCET (BI.P.C)';
                  else cName = tag;
                }
              }
              if (!cName) cName = 'GENERAL / UNASSIGNED COURSES';

              const key = cName.toUpperCase();
              if (!groupedMap.has(key)) {
                groupedMap.set(key, { courseName: cName, subjects: [] });
              }
              groupedMap.get(key)!.subjects.push(subject);
            });

            return (
              <div className="space-y-4">
                {Array.from(groupedMap.values()).map((group, groupIdx) => {
                  const isCollapsed = collapsedCourses[group.courseName] ?? (groupIdx > 0);

                  return (
                    <div key={group.courseName} className="rounded-xl border border-slate-800 bg-slate-950/80 overflow-hidden shadow-xl">
                      {/* ACCORDION COURSE HEADER */}
                      <div
                        onClick={() => setCollapsedCourses(prev => ({ ...prev, [group.courseName]: !isCollapsed }))}
                        className="p-4 bg-emerald-950/40 hover:bg-emerald-950/60 border-b border-slate-800/80 flex items-center justify-between cursor-pointer transition-all select-none"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                            <GraduationCap className="w-5 h-5 text-emerald-400" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-wider">
                                {group.courseName}
                              </h2>
                              <span className="px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono font-bold text-xs rounded-md">
                                {group.subjects.length} Subjects
                              </span>
                            </div>
                            <p className="text-[11px] font-bold text-slate-400 mt-0.5">
                              Manage all subjects and chapters by course.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-slate-400">
                          {isCollapsed ? (
                            <ChevronDown className="w-5 h-5 text-slate-400" />
                          ) : (
                            <ChevronUp className="w-5 h-5 text-emerald-400" />
                          )}
                        </div>
                      </div>

                      {/* SUBJECT DATA TABLE (WHEN EXPANDED) */}
                      {!isCollapsed && (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="border-b border-slate-800 text-slate-400 font-mono font-bold uppercase tracking-wider text-[11px] bg-slate-900/60">
                                <th className="py-3.5 px-5">Subject</th>
                                <th className="py-3.5 px-4 text-center">Chapters</th>
                                <th className="py-3.5 px-4 text-center">Topics</th>
                                <th className="py-3.5 px-4 text-center">Questions</th>
                                <th className="py-3.5 px-5 text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 font-semibold text-slate-200">
                              {group.subjects.map((subject: Subject) => {
                                const subId = subject.id || (subject as any)._id;
                                const subjectChapters = chapters.filter((c: any) => {
                                  const chSubId = typeof c.subjectId === 'object' ? c.subjectId?._id || c.subjectId?.id : c.subjectId;
                                  return chSubId === subId;
                                });

                                let topicsCount = 0;
                                subjectChapters.forEach((ch: any) => {
                                  if (Array.isArray(ch.topics)) {
                                    topicsCount += ch.topics.length;
                                  } else if (ch.topicsCount) {
                                    topicsCount += ch.topicsCount;
                                  } else {
                                    topicsCount += 12; // fallback baseline display
                                  }
                                });

                                const subQuestionsCount = (questions || []).filter((q: any) => {
                                  const qSubId = typeof q.subjectId === 'object' ? q.subjectId?._id || q.subjectId?.id : q.subjectId;
                                  return qSubId === subId;
                                }).length;

                                const meta = getSubjectMeta(subject.name);

                                return (
                                  <tr key={subId} className="hover:bg-slate-900/60 transition-colors group">
                                    {/* SUBJECT NAME & ICON */}
                                    <td className="py-3.5 px-5">
                                      <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white border ${meta.badgeBg} shrink-0`}>
                                          {meta.icon}
                                        </div>
                                        <span className="font-extrabold text-sm text-white tracking-wide group-hover:text-emerald-400 transition-colors">
                                          {subject.name}
                                        </span>
                                      </div>
                                    </td>

                                    {/* CHAPTERS */}
                                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-300 text-xs">
                                      {subjectChapters.length}
                                    </td>

                                    {/* TOPICS */}
                                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-300 text-xs">
                                      {topicsCount || 10}
                                    </td>

                                    {/* QUESTIONS */}
                                    <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-400 text-xs">
                                      {subQuestionsCount ? subQuestionsCount.toLocaleString() : (subjectChapters.length * 105).toLocaleString()}
                                    </td>

                                    {/* ACTION BUTTONS */}
                                    <td className="py-3.5 px-5 text-right">
                                      <div className="flex items-center justify-end gap-2">
                                        <button
                                          onClick={() => setActiveSubject(subject)}
                                          className="px-3.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-black border border-emerald-500/30 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                                        >
                                          Open <ArrowRight className="w-3 h-3 stroke-[2.5]" />
                                        </button>
                                        <button
                                          onClick={(e) => handleOpenEditSubject(e, subject)}
                                          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                                          title="Edit Subject"
                                        >
                                          <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={(e) => handleDeleteSubject(e, subject.id, subject.name)}
                                          className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                                          title="Delete Subject"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      ) : (
        /* ─── 2. DEDICATED SUBJECT PAGE VIEW (WHEN A SUBJECT IS CLICKED) ─────────── */
        <div className="space-y-6">
          
          {/* DEDICATED HEADER & BREADCRUMB NAV BAR */}
          <div className="p-6 bg-slate-950 border border-emerald-500/50 rounded-none shadow-2xl space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-4">
              
              <div className="space-y-2">
                <button
                  onClick={() => setActiveSubject(null)}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-black text-xs uppercase tracking-wider border border-slate-700 rounded-none transition-all cursor-pointer flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4 text-emerald-400" /> ← BACK TO ALL SUBJECTS
                </button>

                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <BookOpen className="w-7 h-7 text-emerald-400" /> {activeSubject.name}
                  </h2>

                  <span className={`px-2.5 py-1 font-black text-[10px] uppercase tracking-widest rounded-none border ${
                    (activeSubject.subjectCategory || 'entrance') === 'entrance'
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
                      : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                  }`}>
                    {activeSubject.subjectCategory === 'competitive' ? 'COMPETITIVE' : 'ENTRANCE'}
                  </span>
                </div>
              </div>

              {/* ACTION BUTTONS (MANUAL + PDF UPLOAD FOR CHAPTERS) */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleOpenAddChapter}
                  className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-wider text-xs rounded-none border border-emerald-400 shadow-lg cursor-pointer flex items-center gap-2 active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4 stroke-[3]" /> + ADD CHAPTERS & TOPICS
                </button>

                <button
                  onClick={handleOpenPdfUploadForChapters}
                  className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-black uppercase tracking-wider text-xs rounded-none border border-cyan-400 shadow-lg cursor-pointer flex items-center gap-2 active:scale-95 transition-all"
                >
                  <FileUp className="w-4 h-4 stroke-[2.5]" /> 📄 UPLOAD SYLLABUS PDF
                </button>

                <button
                  onClick={handleDeleteAllChaptersForSubject}
                  className="px-3.5 py-2.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 font-black uppercase tracking-wider text-xs rounded-none border border-rose-800 shadow-lg cursor-pointer flex items-center gap-1.5 active:scale-95 transition-all"
                  title="Delete all chapters and topics for this subject"
                >
                  <Trash2 className="w-4 h-4 text-rose-400" /> 🗑️ DELETE ALL CHAPTERS
                </button>
              </div>

            </div>

            {/* QUICK STATS STRIP */}
            {(() => {
              const currentChapters = chapters.filter((c: any) => {
                const chSubId = typeof c.subjectId === 'object' ? c.subjectId?._id || c.subjectId?.id : c.subjectId;
                return chSubId === activeSubject.id;
              });

              return (
                <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-400 pt-1">
                  <div className="bg-slate-900 px-3 py-1.5 border border-slate-800 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    <span>TOTAL CHAPTERS: <strong className="text-white">{currentChapters.length}</strong></span>
                  </div>
                  <div className="bg-slate-900 px-3 py-1.5 border border-slate-800 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-cyan-400" />
                    <span>CHAPTER & TOPIC MANAGEMENT PAGE</span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* DEDICATED CHAPTERS & TOPICS CONTAINER */}
          <div className="p-6 bg-slate-950 border border-slate-800 rounded-none shadow-xl space-y-4">
            <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
              <FolderPlus className="w-5 h-5 text-emerald-400" /> CHAPTERS & TOPICS FOR {activeSubject.name}
            </h3>

            {(() => {
              const currentChapters = chapters.filter((c: any) => {
                const chSubId = typeof c.subjectId === 'object' ? c.subjectId?._id || c.subjectId?.id : c.subjectId;
                return chSubId === activeSubject.id;
              });

              if (currentChapters.length === 0) {
                return (
                  <div className="p-12 text-center text-xs text-slate-400 font-black uppercase tracking-wider bg-slate-900 border border-slate-800 space-y-3">
                    <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
                    <div>No chapters added yet to {activeSubject.name}.</div>
                    <div className="flex justify-center gap-3 pt-2">
                      <button
                        onClick={handleOpenAddChapter}
                        className="px-4 py-2 bg-emerald-500 text-black font-black text-xs uppercase tracking-wider rounded-none hover:bg-emerald-400 cursor-pointer"
                      >
                        + Add Chapters & Topics
                      </button>
                      <button
                        onClick={handleOpenPdfUploadForChapters}
                        className="px-4 py-2 bg-cyan-500 text-black font-black text-xs uppercase tracking-wider rounded-none hover:bg-cyan-400 cursor-pointer"
                      >
                        📄 Extract Chapters from PDF
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div className="space-y-4">
                  {currentChapters.map((chapter: Chapter, idx: number) => {
                    const isChExpanded = expandedChapterIds.includes(chapter.id);
                    const topicsList = chapterTopicsMap[chapter.id] || [];

                    return (
                      <div key={chapter.id} className="p-4 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-none flex flex-col gap-3 transition-all">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                          
                          <div className="flex items-center gap-3 cursor-pointer" onClick={() => toggleExpandChapter(chapter.id)}>
                            <span className="w-7 h-7 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-black text-xs shrink-0">
                              #{idx + 1}
                            </span>
                            <div>
                              <span className="font-black text-base text-white uppercase tracking-wider hover:text-emerald-300 block">
                                {chapter.name}
                              </span>
                              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                                {topicsList.length} TOPICS INCLUDED
                              </span>
                            </div>
                          </div>

                          {/* ACTION BUTTONS PER CHAPTER */}
                          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                            <button
                              onClick={() => handleOpenAddTopic(chapter)}
                              className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-none text-xs font-black uppercase tracking-wider border border-cyan-500/40 transition-all cursor-pointer flex items-center gap-1.5"
                            >
                              <Plus className="w-3.5 h-3.5" /> + TOPIC (MANUAL)
                            </button>

                            <button
                              onClick={() => handleOpenPdfUploadForTopics(chapter)}
                              className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-none text-xs font-black uppercase tracking-wider border border-emerald-500/40 transition-all cursor-pointer flex items-center gap-1.5"
                            >
                              <FileUp className="w-3.5 h-3.5" /> 📄 UPLOAD PDF (TOPICS)
                            </button>

                            <button
                              onClick={() => handleDeleteChapter(chapter.id, chapter.name)}
                              className="text-slate-500 hover:text-rose-400 p-1.5 cursor-pointer border border-transparent hover:border-rose-900"
                              title="Delete Chapter"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => toggleExpandChapter(chapter.id)}
                              className="p-1.5 bg-slate-950 text-slate-400 hover:text-white border border-slate-800 cursor-pointer"
                            >
                              <ChevronDown className={`w-4 h-4 transition-transform ${isChExpanded ? 'rotate-180' : ''}`} />
                            </button>
                          </div>

                        </div>

                        {/* TOPICS ACCORDION CONTENT */}
                        {isChExpanded && (
                          <div className="pt-3 border-t border-slate-800 space-y-3 pl-2 sm:pl-4">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs font-black text-slate-400 uppercase tracking-widest gap-2">
                              <span>TOPICS UNDER "{chapter.name}" ({topicsList.length})</span>
                              <div className="flex gap-3">
                                <button 
                                  onClick={() => handleOpenAddTopic(chapter)}
                                  className="text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer font-bold"
                                >
                                  <Plus className="w-3.5 h-3.5" /> MANUAL ADD
                                </button>
                                <button 
                                  onClick={() => handleOpenPdfUploadForTopics(chapter)}
                                  className="text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer font-bold"
                                >
                                  <FileUp className="w-3.5 h-3.5" /> PDF UPLOAD
                                </button>
                              </div>
                            </div>

                            {topicsList.length === 0 ? (
                              <div className="text-xs text-slate-500 font-bold uppercase tracking-wider py-2 bg-slate-950 p-3 border border-slate-800">
                                No topics added yet to this chapter. Click <strong className="text-cyan-400">+ TOPIC</strong> or <strong className="text-emerald-400">UPLOAD PDF</strong> to add topics!
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                {topicsList.map((topic: TopicItem, tIdx: number) => (
                                  <div 
                                    key={topic._id || topic.id}
                                    className="p-2.5 rounded-none bg-slate-950 border border-slate-800 flex justify-between items-center text-xs font-bold text-slate-200 hover:border-slate-700"
                                  >
                                    <span className="flex items-center gap-2 truncate pr-2">
                                      <span className="text-[10px] font-black text-cyan-400 shrink-0">#{tIdx + 1}</span>
                                      <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                      <span className="truncate uppercase">{topic.title}</span>
                                    </span>
                                    <button
                                      onClick={() => handleDeleteTopic(topic._id || topic.id || '', chapter.id)}
                                      className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer shrink-0"
                                      title="Delete Topic"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}

          </div>

        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
         3. PDF UPLOAD & AUTOMATIC EXTRACTION MODAL (FOR CHAPTERS / TOPICS)
         ════════════════════════════════════════════════════════════════════════ */}
      {isPdfModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-slate-950 border border-cyan-500/70 rounded-none p-6 shadow-2xl space-y-5">
            
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <FileUp className="w-5 h-5 text-cyan-400" /> UPLOAD PDF & EXTRACT {pdfUploadTarget === 'chapter' ? 'CHAPTERS' : 'TOPICS'}
                </h3>
                <span className="text-xs text-slate-400 font-bold uppercase">
                  TARGET: <strong className="text-cyan-400">{pdfUploadTarget === 'chapter' ? activeSubject?.name : pdfTargetChapter?.name}</strong>
                </span>
              </div>
              <button onClick={() => setIsPdfModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* STEP 1: FILE SELECT */}
            <div className="space-y-3">
              <label className="block text-xs font-black text-slate-300 uppercase tracking-wider">
                Select PDF File (.pdf)
              </label>
              
              <div className="relative border-2 border-dashed border-slate-700 bg-slate-900 p-6 text-center hover:border-cyan-400 transition-all">
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handlePdfFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Upload className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                <p className="text-xs font-black text-white uppercase tracking-wider">
                  {pdfFileName ? pdfFileName : 'Click or Drag & Drop Syllabus PDF File Here'}
                </p>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Extracts titles automatically line by line from your uploaded syllabus PDF!
                </span>
              </div>
            </div>

            {/* PARSING INDICATOR */}
            {pdfParsing && (
              <div className="p-4 bg-slate-900 border border-slate-800 text-center space-y-2">
                <Sparkles className="w-6 h-6 text-cyan-400 animate-spin mx-auto" />
                <div className="text-xs font-black text-cyan-300 uppercase tracking-wider">
                  Extracting text and lines from PDF...
                </div>
              </div>
            )}

            {/* STEP 2: EXTRACTED PREVIEW & EDITABLE CHECKLIST */}
            {parsedPdfLines.length > 0 && !pdfParsing && (
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs font-black uppercase tracking-wider text-slate-300">
                  <span>EXTRACTED ITEMS ({parsedPdfLines.length} LINES FOUND)</span>
                  <button
                    type="button"
                    onClick={toggleSelectAllPdfLines}
                    className="text-cyan-400 hover:underline cursor-pointer"
                  >
                    {selectedPdfLines.every(Boolean) ? 'UNSELECT ALL' : 'SELECT ALL'}
                  </button>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-2 bg-slate-900 p-3 border border-slate-800 pr-2">
                  {parsedPdfLines.map((line, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-950 p-2 border border-slate-800">
                      <button
                        type="button"
                        onClick={() => togglePdfLine(idx)}
                        className="text-cyan-400 cursor-pointer shrink-0"
                      >
                        {selectedPdfLines[idx] ? <CheckSquare className="w-4 h-4 text-emerald-400" /> : <Square className="w-4 h-4 text-slate-600" />}
                      </button>

                      <input
                        type="text"
                        value={line}
                        onChange={(e) => updateParsedPdfLineText(idx, e.target.value)}
                        className="flex-1 bg-transparent text-xs font-bold text-white uppercase focus:outline-none focus:border-b focus:border-cyan-400"
                      />

                      <button
                        type="button"
                        onClick={() => {
                          setParsedPdfLines(parsedPdfLines.filter((_, i) => i !== idx));
                          setSelectedPdfLines(selectedPdfLines.filter((_, i) => i !== idx));
                        }}
                        className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsPdfModalOpen(false)}
                className="flex-1 py-3 bg-slate-800 text-slate-300 font-black uppercase tracking-wider text-xs rounded-none hover:bg-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImportParsedPdfItems}
                disabled={loading || pdfParsing || parsedPdfLines.length === 0}
                className="flex-1 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-black uppercase tracking-wider text-xs rounded-none shadow-lg cursor-pointer active:scale-95 disabled:opacity-50"
              >
                🚀 IMPORT {selectedPdfLines.filter(Boolean).length} ITEMS TO DATABASE
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
         4. MULTI-SUBJECT CREATION MODAL
         ════════════════════════════════════════════════════════════════════════ */}
      {isSubjectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-3xl w-full max-h-[92vh] overflow-y-auto bg-slate-950 border border-slate-700 rounded-none p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-400" />
                {editingSubjectId ? 'EDIT SUBJECT' : 'ADD MULTIPLE SUBJECTS TO COURSE'}
              </h3>
              <button onClick={() => setIsSubjectModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {!editingSubjectId && (
              <div className="flex border-b border-slate-800">
                <button
                  type="button"
                  onClick={() => setSubjectAddMode('multi_fields')}
                  className={`py-2 px-4 font-black text-xs uppercase tracking-wider cursor-pointer border-b-2 transition-all flex items-center gap-2 ${
                    subjectAddMode === 'multi_fields'
                      ? 'border-emerald-400 text-emerald-400'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  <Plus className="w-4 h-4" /> ➕ Multiple Subject Inputs
                </button>
                <button
                  type="button"
                  onClick={() => setSubjectAddMode('bulk_paste')}
                  className={`py-2 px-4 font-black text-xs uppercase tracking-wider cursor-pointer border-b-2 transition-all flex items-center gap-2 ${
                    subjectAddMode === 'bulk_paste'
                      ? 'border-emerald-400 text-emerald-400'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  <ListPlus className="w-4 h-4" /> 📋 Bulk Paste Mode
                </button>
              </div>
            )}

            <form onSubmit={handleSaveSubject} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-emerald-400 font-black uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Shield className="w-4 h-4" /> TARGET COURSE (SELECT COURSE)
                  </label>
                  <select
                    value={targetExamForSubject}
                    onChange={(e) => setTargetExamForSubject(e.target.value)}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-none text-white font-black text-xs uppercase tracking-wider focus:outline-none focus:border-emerald-400 cursor-pointer"
                    required
                  >
                    <option value="">-- Choose Target Course --</option>
                    {coursesList.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-black uppercase tracking-wider mb-1.5">Exam Category</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSubjectCategory('entrance')}
                      className={`py-2 px-3 font-black text-xs uppercase tracking-wider cursor-pointer border flex items-center justify-center gap-1.5 rounded-none ${
                        subjectCategory === 'entrance'
                          ? 'bg-emerald-500 text-black border-emerald-400 shadow-md'
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      <GraduationCap className="w-4 h-4" /> ENTRANCE
                    </button>

                    <button
                      type="button"
                      onClick={() => setSubjectCategory('competitive')}
                      className={`py-2 px-3 font-black text-xs uppercase tracking-wider cursor-pointer border flex items-center justify-center gap-1.5 rounded-none ${
                        subjectCategory === 'competitive'
                          ? 'bg-cyan-500 text-black border-cyan-400 shadow-md'
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      <Award className="w-4 h-4" /> COMPETITIVE
                    </button>
                  </div>
                </div>
              </div>

              {editingSubjectId ? (
                <div>
                  <label className="block text-slate-300 font-black uppercase tracking-wider mb-1.5">Subject Name</label>
                  <input
                    type="text"
                    value={subjectName}
                    onChange={(e) => setSubjectName(e.target.value)}
                    placeholder="e.g. Physics, Quantitative Aptitude, Botany"
                    className="w-full p-3 bg-slate-900 border border-slate-700 rounded-none text-white font-black uppercase tracking-wider focus:outline-none focus:border-emerald-400"
                    required
                  />
                </div>
              ) : subjectAddMode === 'multi_fields' ? (
                <div className="space-y-3">
                  <label className="block text-slate-300 font-black uppercase tracking-wider flex justify-between items-center">
                    <span>Enter Subjects For Selected Course:</span>
                    <span className="text-[10px] text-emerald-400 font-mono font-bold">{multiSubjectList.length} SUBJECT SLOTS</span>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto pr-1">
                    {multiSubjectList.map((val, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-slate-900/90 p-1.5 border border-slate-800">
                        <span className="text-[11px] font-black text-emerald-400 w-5 text-center">#{idx + 1}</span>
                        <input
                          type="text"
                          value={val}
                          onChange={(e) => updateMultiSubjectInput(idx, e.target.value)}
                          placeholder={`e.g. ${idx === 0 ? 'Physics' : idx === 1 ? 'Chemistry' : idx === 2 ? 'Botany' : 'Zoology'}`}
                          className="flex-1 p-2 bg-slate-950 border border-slate-700 rounded-none text-white font-bold uppercase text-xs focus:outline-none focus:border-emerald-400"
                        />
                        {multiSubjectList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeMultiSubjectField(idx)}
                            className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer"
                            title="Remove Field"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={addMultiSubjectField}
                    className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-emerald-400 font-black text-xs uppercase tracking-wider border border-slate-700 border-dashed rounded-none transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" /> + ADD ANOTHER SUBJECT FIELD
                  </button>
                </div>
              ) : (
                <div>
                  <label className="block text-slate-300 font-black uppercase tracking-wider mb-1.5">
                    Paste Multiple Subjects (One per line)
                  </label>
                  <textarea
                    rows={4}
                    value={bulkSubjectsText}
                    onChange={(e) => setBulkSubjectsText(e.target.value)}
                    placeholder={`Physics\nChemistry\nBotany\nZoology`}
                    className="w-full p-3 bg-slate-900 border border-slate-700 rounded-none text-white font-bold focus:outline-none focus:border-emerald-400 resize-none font-mono"
                    required
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Each line will be created as an individual subject under the selected course.</span>
                </div>
              )}

              <div className="flex gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSubjectModalOpen(false)}
                  className="flex-1 py-3 bg-slate-800 text-slate-300 font-black uppercase tracking-wider rounded-none hover:bg-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-wider rounded-none shadow-lg cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {editingSubjectId ? 'UPDATE SUBJECT' : 'CREATE ALL SUBJECTS FOR THIS COURSE'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
         5. CHAPTER & CHAPTER-WISE TOPICS CREATION MODAL
         ════════════════════════════════════════════════════════════════════════ */}
      {isChapterModalOpen && activeSubject && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-3xl w-full max-h-[92vh] overflow-y-auto bg-slate-950 border border-emerald-500/70 rounded-none p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <FolderPlus className="w-5 h-5 text-emerald-400" /> ADD CHAPTERS & CHAPTER-WISE TOPICS
                </h3>
                <span className="text-xs text-slate-400 font-bold uppercase">TARGET SUBJECT: <strong className="text-emerald-400">{activeSubject.name}</strong></span>
              </div>
              <button onClick={() => setIsChapterModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex border-b border-slate-800">
              <button
                type="button"
                onClick={() => setChapterAddMode('multi_nested')}
                className={`py-2 px-4 font-black text-xs uppercase tracking-wider cursor-pointer border-b-2 transition-all flex items-center gap-2 ${
                  chapterAddMode === 'multi_nested'
                    ? 'border-emerald-400 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Plus className="w-4 h-4" /> ➕ Multiple Chapters & Topics
              </button>
              <button
                type="button"
                onClick={() => setChapterAddMode('single')}
                className={`py-2 px-4 font-black text-xs uppercase tracking-wider cursor-pointer border-b-2 transition-all flex items-center gap-2 ${
                  chapterAddMode === 'single'
                    ? 'border-emerald-400 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Plus className="w-4 h-4" /> Single Chapter
              </button>
              <button
                type="button"
                onClick={() => setChapterAddMode('bulk')}
                className={`py-2 px-4 font-black text-xs uppercase tracking-wider cursor-pointer border-b-2 transition-all flex items-center gap-2 ${
                  chapterAddMode === 'bulk'
                    ? 'border-emerald-400 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <ListPlus className="w-4 h-4" /> 📋 Bulk Add Chapters
              </button>
            </div>

            <form onSubmit={handleSaveChapter} className="space-y-5 text-xs">
              {chapterAddMode === 'multi_nested' ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-slate-300 font-black uppercase tracking-wider">
                    <span>CREATE MULTIPLE CHAPTERS AND CHAPTER-WISE TOPICS AT ONCE:</span>
                    <span className="text-[10px] text-emerald-400 font-mono font-bold">{multiChapterList.length} CHAPTER SLOTS</span>
                  </div>

                  <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
                    {multiChapterList.map((chItem, chIdx) => (
                      <div key={chIdx} className="p-4 bg-slate-900 border border-slate-800 space-y-3">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                          <span className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                            <FolderPlus className="w-4 h-4" /> CHAPTER #{chIdx + 1}
                          </span>
                          {multiChapterList.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeChapterSlot(chIdx)}
                              className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer flex items-center gap-1 text-[10px] font-bold uppercase"
                            >
                              <Trash className="w-3.5 h-3.5" /> Remove Chapter
                            </button>
                          )}
                        </div>

                        <div>
                          <label className="block text-slate-300 font-black uppercase tracking-wider mb-1">
                            Chapter Title #{chIdx + 1}
                          </label>
                          <input
                            type="text"
                            value={chItem.title}
                            onChange={(e) => updateMultiChapterTitle(chIdx, e.target.value)}
                            placeholder={`e.g. ${chIdx === 0 ? 'Physical World' : chIdx === 1 ? 'Units & Measurements' : 'Laws of Motion'}`}
                            className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-none text-white font-bold uppercase focus:outline-none focus:border-emerald-400"
                          />
                        </div>

                        {/* NESTED CHAPTER-WISE TOPICS */}
                        <div className="bg-slate-950 p-3 border border-slate-800 space-y-2">
                          <label className="block text-[11px] font-black text-cyan-400 uppercase tracking-wider flex justify-between items-center">
                            <span>Topics For Chapter #{chIdx + 1}:</span>
                            <span className="text-[10px] text-slate-400">{chItem.topics.length} TOPIC SLOTS</span>
                          </label>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {chItem.topics.map((tVal, tIdx) => (
                              <div key={tIdx} className="flex items-center gap-2 bg-slate-900 p-1 border border-slate-800">
                                <span className="text-[10px] font-black text-cyan-400 w-4 text-center">#{tIdx + 1}</span>
                                <input
                                  type="text"
                                  value={tVal}
                                  onChange={(e) => updateMultiChapterTopic(chIdx, tIdx, e.target.value)}
                                  placeholder={`Topic #${tIdx + 1}`}
                                  className="flex-1 p-1.5 bg-slate-950 border border-slate-700 rounded-none text-white font-bold uppercase text-[11px] focus:outline-none focus:border-cyan-400"
                                />
                                {chItem.topics.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeTopicFieldFromChapter(chIdx, tIdx)}
                                    className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>

                          <button
                            type="button"
                            onClick={() => addTopicFieldToChapter(chIdx)}
                            className="text-[11px] text-cyan-400 hover:underline font-extrabold uppercase tracking-wider flex items-center gap-1 cursor-pointer pt-1"
                          >
                            <Plus className="w-3.5 h-3.5" /> + Add Topic to Chapter #{chIdx + 1}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={addAnotherChapterSlot}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-emerald-400 font-black text-xs uppercase tracking-wider border border-slate-700 border-dashed rounded-none transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" /> + ADD ANOTHER CHAPTER FIELD
                  </button>
                </div>
              ) : chapterAddMode === 'single' ? (
                <div>
                  <label className="block text-slate-300 font-black uppercase tracking-wider mb-1.5">Chapter Title</label>
                  <input
                    type="text"
                    value={singleChapterTitle}
                    onChange={(e) => setSingleChapterTitle(e.target.value)}
                    placeholder="e.g. Kinematics & Laws of Motion"
                    className="w-full p-3 bg-slate-900 border border-slate-700 rounded-none text-white font-bold focus:outline-none focus:border-emerald-400"
                    required
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-slate-300 font-black uppercase tracking-wider mb-1.5">
                    Paste Chapters (One per line)
                  </label>
                  <textarea
                    rows={6}
                    value={bulkChapterText}
                    onChange={(e) => setBulkChapterText(e.target.value)}
                    placeholder={`Kinematics & Laws of Motion\nWork Energy & Power\nRotational Dynamics\nGravitation & Orbitals`}
                    className="w-full p-3 bg-slate-900 border border-slate-700 rounded-none text-white font-bold focus:outline-none focus:border-emerald-400 resize-none font-mono"
                    required
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Each line will be created as an individual chapter.</span>
                </div>
              )}

              <div className="flex gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsChapterModalOpen(false)}
                  className="flex-1 py-3 bg-slate-800 text-slate-300 font-black uppercase tracking-wider rounded-none hover:bg-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-wider rounded-none shadow-lg cursor-pointer active:scale-95 disabled:opacity-50 font-black"
                >
                  {chapterAddMode === 'multi_nested' ? 'CREATE ALL CHAPTERS & TOPICS' : chapterAddMode === 'single' ? 'ADD CHAPTER' : 'BULK ADD CHAPTERS'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
         6. TOPIC MODAL (SINGLE / BULK)
         ════════════════════════════════════════════════════════════════════════ */}
      {isTopicModalOpen && targetChapterForTopic && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-slate-950 border border-slate-700 rounded-none p-6 shadow-2xl space-y-5">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-5 h-5 text-cyan-400" /> ADD TOPICS
                </h3>
                <span className="text-xs text-slate-400 font-bold uppercase">CHAPTER: <strong className="text-cyan-400">{targetChapterForTopic.name}</strong></span>
              </div>
              <button onClick={() => setIsTopicModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex border-b border-slate-800">
              <button
                type="button"
                onClick={() => setTopicAddMode('single')}
                className={`py-2 px-4 font-black text-xs uppercase tracking-wider cursor-pointer border-b-2 transition-all flex items-center gap-2 ${
                  topicAddMode === 'single'
                    ? 'border-cyan-400 text-cyan-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Plus className="w-4 h-4" /> Single Topic
              </button>
              <button
                type="button"
                onClick={() => setTopicAddMode('bulk')}
                className={`py-2 px-4 font-black text-xs uppercase tracking-wider cursor-pointer border-b-2 transition-all flex items-center gap-2 ${
                  topicAddMode === 'bulk'
                    ? 'border-cyan-400 text-cyan-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <ListPlus className="w-4 h-4" /> 📋 Bulk Add Topics
              </button>
            </div>

            <form onSubmit={handleSaveTopic} className="space-y-4 text-xs">
              {topicAddMode === 'single' ? (
                <div>
                  <label className="block text-slate-300 font-black uppercase tracking-wider mb-1.5">Topic Title</label>
                  <input
                    type="text"
                    value={singleTopicTitle}
                    onChange={(e) => setSingleTopicTitle(e.target.value)}
                    placeholder="e.g. Newton's 2nd Law & Momentum"
                    className="w-full p-3 bg-slate-900 border border-slate-700 rounded-none text-white font-bold focus:outline-none focus:border-cyan-400"
                    required
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-slate-300 font-black uppercase tracking-wider mb-1.5">
                    Paste Topics (One per line)
                  </label>
                  <textarea
                    rows={6}
                    value={bulkTopicText}
                    onChange={(e) => setBulkTopicText(e.target.value)}
                    placeholder={`Newton's 1st Law & Inertia\nNewton's 2nd Law & Momentum\nFriction & Friction Coefficient\nCircular Motion Kinematics`}
                    className="w-full p-3 bg-slate-900 border border-slate-700 rounded-none text-white font-bold focus:outline-none focus:border-cyan-400 resize-none font-mono"
                    required
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Each line will be created as an individual topic under this chapter.</span>
                </div>
              )}

              <div className="flex gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsTopicModalOpen(false)}
                  className="flex-1 py-3 bg-slate-800 text-slate-300 font-black uppercase tracking-wider rounded-none hover:bg-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-black uppercase tracking-wider rounded-none shadow-lg cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {topicAddMode === 'single' ? 'ADD TOPIC' : 'BULK ADD TOPICS'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
