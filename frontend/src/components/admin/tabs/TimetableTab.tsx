import React, { useState, useMemo } from 'react';
import { 
  Trash2, Calendar, BookOpen, Clock, CheckCircle2, AlertCircle, 
  Sparkles, Layers, PlusCircle, Edit2, Shield, Eye, Award, Check, X, RefreshCw, ChevronRight, Filter,
  FileText, Image as ImageIcon, Paperclip, File, Upload, Loader2
} from 'lucide-react';
import { Timetable, Subject, Chapter, Test } from '../../../types';
import { useAdminContext } from '../../../context/AdminContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const getToken = () => localStorage.getItem('token');
const authHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` });

export default function TimetableTab() {
  const { entranceExams, competitiveExams, subjects, chapters, tests, allPlans, timetables, refreshAdminData } = useAdminContext();
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Deduplicate and extract unique real courses created by Admin - sorted Alphabetically A to Z
  const plansList = useMemo(() => {
    const rawPlans = [
      ...entranceExams.map((e: any) => ({ ...e, category: 'entrance' })),
      ...competitiveExams.map((e: any) => ({ ...e, category: 'competitive' })),
      ...allPlans.map((p: any) => ({ 
        ...p, 
        category: p.type === 'competitive' || /sbi|po|clat|nda|bank|ssc|rrb|cat|upsc|gate|group|constable|si/i.test(p.name || '') ? 'competitive' : 'entrance' 
      }))
    ];
    const map = new Map<string, { id: string; name: string; subjects: any[]; examId?: string; allIds: string[]; category: 'entrance' | 'competitive' }>();
    
    rawPlans.forEach((p: any) => {
      const cleanName = (p.name || '').replace(/\s*Plan\s*$/i, '').trim();
      if (!cleanName) return;
      const key = cleanName.toLowerCase();
      const pId = String(p.id || p._id || '');
      const pExamId = p.examId ? String(typeof p.examId === 'object' ? p.examId._id || p.examId.id : p.examId) : '';
      const pSubs = Array.isArray(p.subjects) ? p.subjects : [];
      const cat = p.category || 'entrance';

      if (!map.has(key)) {
        const idList = [pId];
        if (pExamId && !idList.includes(pExamId)) idList.push(pExamId);
        map.set(key, {
          id: pId,
          name: cleanName,
          subjects: pSubs,
          examId: pExamId,
          allIds: idList,
          category: cat
        });
      } else {
        const existing = map.get(key)!;
        if (!existing.allIds.includes(pId)) existing.allIds.push(pId);
        if (pExamId && !existing.allIds.includes(pExamId)) existing.allIds.push(pExamId);
        if (pSubs.length > 0) {
          const mergedSubs = [...existing.subjects];
          pSubs.forEach((sub: any) => {
            const subId = String(typeof sub === 'string' ? sub : (sub._id || sub.id || ''));
            if (subId && !mergedSubs.some(s => String(typeof s === 'string' ? s : (s._id || s.id || '')) === subId)) {
              mergedSubs.push(sub);
            }
          });
          existing.subjects = mergedSubs;
        }
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
  }, [allPlans, entranceExams, competitiveExams]);

  // Form State
  const [editingTimetableId, setEditingTimetableId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'entrance' | 'competitive'>('entrance');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [weekTitle, setWeekTitle] = useState<string>('Week 1');
  const [weekNumber, setWeekNumber] = useState<number>(1);

  // Filter plans list by selected category
  const filteredCategoryCourses = useMemo(() => {
    return plansList.filter(p => p.category === selectedCategory);
  }, [plansList, selectedCategory]);

  // Default Date range: Today to +6 days
  const todayStr = new Date().toISOString().split('T')[0];
  const defaultEndStr = new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const [startDate, setStartDate] = useState<string>(todayStr);
  const [endDate, setEndDate] = useState<string>(defaultEndStr);

  // Subject -> Assigned Chapter mapping (subjectId -> chapterId)
  const [assignedChapterMap, setAssignedChapterMap] = useState<Record<string, string>>({});
  // Subject -> Preparation Topics mapping (subjectId -> string)
  const [assignedTopicsMap, setAssignedTopicsMap] = useState<Record<string, string>>({});
  // Subject -> Attachment mapping (subjectId -> { url: string, type: 'image' | 'pdf' | 'none' })
  const [assignedAttachmentMap, setAssignedAttachmentMap] = useState<Record<string, { url: string; type: 'image' | 'pdf' | 'none' }>>({});
  const [uploadingSubjectId, setUploadingSubjectId] = useState<string | null>(null);

  const [selectedWeekendExamId, setSelectedWeekendExamId] = useState<string>('');

  // Right-side History Filter
  const [historyCourseFilter, setHistoryCourseFilter] = useState<string>('all');

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

  // Upload file for a specific subject
  const handleFileUpload = async (subjectId: string, file: File) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);

    setUploadingSubjectId(subjectId);
    try {
      const res = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');
      const fileUrl = await res.text();
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const isPdf = ext === 'pdf';
      const isImg = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
      const attachmentType: 'image' | 'pdf' | 'none' = isPdf ? 'pdf' : isImg ? 'image' : 'none';

      setAssignedAttachmentMap(prev => ({
        ...prev,
        [subjectId]: { url: fileUrl, type: attachmentType }
      }));
      showSuccess(`File uploaded for subject successfully.`);
    } catch (err: any) {
      showError(err.message || 'Failed to upload file.');
    } finally {
      setUploadingSubjectId(null);
    }
  };

  // Subjects belonging STRICTLY to the selected course as configured in Courses/Plans
  const courseSubjects = useMemo(() => {
    if (!selectedCourseId) return [];
    const courseObj = plansList.find(p => p.id === selectedCourseId || (p.allIds && p.allIds.includes(selectedCourseId)));
    if (!courseObj) return [];

    const targetIds = courseObj.allIds || [String(selectedCourseId)];

    return subjects.filter((s: any) => {
      const sId = String(s.id || s._id || '');
      const sExamId = s.examId ? String(typeof s.examId === 'object' ? s.examId._id || s.examId.id : s.examId) : '';
      const sExamIds = Array.isArray(s.examIds) ? s.examIds.map((e: any) => String(typeof e === 'object' ? e._id || e.id : e)) : [];
      const sApplicable = Array.isArray(s.applicableFor) ? s.applicableFor.map((a: any) => String(typeof a === 'object' ? a._id || a.id : a)) : [];

      // 1. Direct match by Subject's assigned examId / examIds / applicableFor
      const matchedByExamId = targetIds.some(tId => tId && (sExamId === tId || sExamIds.includes(tId) || sApplicable.includes(tId)));

      // 2. Direct match by Course/Exam's included subjects array
      let matchedByCourseSubjects = false;
      if (Array.isArray(courseObj.subjects)) {
        matchedByCourseSubjects = courseObj.subjects.some((sub: any) => {
          const subId = String(typeof sub === 'string' ? sub : (sub._id || sub.id || ''));
          return subId && (subId === sId);
        });
      }

      return matchedByExamId || matchedByCourseSubjects;
    }).sort((a: any, b: any) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
  }, [selectedCourseId, plansList, subjects]);

  // Helper to get chapters for a subject sorted numerically by syllabus order (Chapter 1, 2, 3...)
  const getSubjectChaptersSorted = (subjectId: string) => {
    const list = chapters.filter((ch: any) => {
      const cSubId = String(ch.subjectId?._id || ch.subjectId?.id || ch.subjectId || '');
      return cSubId === String(subjectId);
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
      if (numA !== null && numB !== null) return numA - numB;
      return 0;
    });
  };

  const handleSelectCategory = (cat: 'entrance' | 'competitive') => {
    setSelectedCategory(cat);
    setSelectedCourseId('');
    setAssignedChapterMap({});
    setAssignedTopicsMap({});
    setAssignedAttachmentMap({});
  };

  const handleSelectCourse = (cId: string) => {
    setSelectedCourseId(cId);
    setEditingTimetableId(null);
    setAssignedChapterMap({});
    setAssignedTopicsMap({});
    setAssignedAttachmentMap({});

    // Auto calculate next week number for this course
    if (cId) {
      const courseTimetables = timetables.filter(t => t.courseId === cId || t.planId === cId || t.examId === cId);
      const nextNum = courseTimetables.length + 1;
      setWeekNumber(nextNum);
      setWeekTitle(`Week ${nextNum}`);
    }
  };

  // Reset form
  const resetForm = () => {
    setEditingTimetableId(null);
    setSelectedCategory('entrance');
    setSelectedCourseId('');
    setWeekTitle('Week 1');
    setWeekNumber(1);
    setStartDate(todayStr);
    setEndDate(defaultEndStr);
    setAssignedChapterMap({});
    setAssignedTopicsMap({});
    setAssignedAttachmentMap({});
    setSelectedWeekendExamId('');
    setIsModalOpen(false);
  };

  // Edit an existing timetable schedule
  const handleEditTimetable = (t: Timetable) => {
    const targetCId = t.courseId || t.planId || t.examId || '';
    const matchedCourse = plansList.find(p => p.id === targetCId || (p.allIds && p.allIds.includes(targetCId)));
    if (matchedCourse && matchedCourse.category) {
      setSelectedCategory(matchedCourse.category);
    }

    setEditingTimetableId(t._id || t.id);
    setSelectedCourseId(targetCId);
    setWeekTitle(t.weekTitle || `Week ${t.weekNumber || 1}`);
    setWeekNumber(t.weekNumber || 1);
    setStartDate(t.startDate || todayStr);
    setEndDate(t.endDate || defaultEndStr);
    setSelectedWeekendExamId(t.weekendExamId || '');

    const cMap: Record<string, string> = {};
    const tMap: Record<string, string> = {};
    const aMap: Record<string, { url: string; type: 'image' | 'pdf' | 'none' }> = {};

    if (Array.isArray(t.weeklyChapters)) {
      t.weeklyChapters.forEach(wc => {
        if (wc.subjectId && wc.chapterId) {
          cMap[wc.subjectId] = wc.chapterId;
        }
        if (wc.subjectId && wc.topicsText) {
          tMap[wc.subjectId] = wc.topicsText;
        }
        if (wc.subjectId && wc.attachmentUrl) {
          aMap[wc.subjectId] = {
            url: wc.attachmentUrl,
            type: wc.attachmentType || 'none'
          };
        }
      });
    }
    setAssignedChapterMap(cMap);
    setAssignedTopicsMap(tMap);
    setAssignedAttachmentMap(aMap);
  };

  // Save/Publish Timetable Schedule
  const handleSubmitTimetable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId) {
      showError("Please select a target Course / Plan.");
      return;
    }

    if (courseSubjects.length === 0) {
      showError("No subjects found for the selected course.");
      return;
    }

    // Build weekly chapters payload — only include subjects that have a chapter selected
    const weeklyChapters = courseSubjects
      .map((sub: any) => {
        const subId = String(sub.id || sub._id);
        const chId = assignedChapterMap[subId] || '';
        const chapObj = chapters.find((c: any) => String(c.id || c._id) === chId);
        const topicsText = assignedTopicsMap[subId] || '';
        const attach = assignedAttachmentMap[subId] || { url: '', type: 'none' };

        return {
          subjectId: subId,
          subjectName: sub.name,
          chapterId: chId,
          chapterName: chapObj ? (chapObj.name || (chapObj as any).title) : '',
          topicsText,
          attachmentUrl: attach.url || '',
          attachmentType: attach.type || 'none'
        };
      })
      .filter(wc => wc.chapterId && wc.chapterId.trim() !== '');

    const courseObj = plansList.find(p => p.id === selectedCourseId);
    const linkedTest = tests.find((t: any) => String(t.id || t._id) === selectedWeekendExamId);

    const payload = {
      courseId: selectedCourseId,
      courseName: courseObj?.name || 'Selected Course',
      weekTitle,
      weekNumber: Number(weekNumber) || 1,
      startDate,
      endDate,
      weeklyChapters,
      weekendExamId: selectedWeekendExamId || '',
      weekendExamTitle: linkedTest ? (linkedTest.title || (linkedTest as any).name || '') : '',
      status: 'published'
    };

    setLoading(true);
    try {
      const url = editingTimetableId 
        ? `${API_URL}/api/timetables/${editingTimetableId}`
        : `${API_URL}/api/timetables`;
      const method = editingTimetableId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        showSuccess(editingTimetableId ? "Weekly timetable updated successfully!" : "Weekly timetable published successfully!");
        resetForm();
      } else {
        showError(data.message || "Failed to save timetable schedule.");
      }
    } catch (err: any) {
      showError(err.message || "Server connection error.");
    } finally {
      setLoading(false);
    }
  };

  // Delete Timetable Schedule
  const handleDeleteTimetable = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this timetable schedule?")) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/timetables/${id}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      if (res.ok) {
        showSuccess("Timetable schedule removed successfully.");
      } else {
        showError("Failed to remove timetable schedule.");
      }
    } catch (err: any) {
      showError("Server connection error.");
    } finally {
      setLoading(false);
    }
  };

  // Filter published timetables for right panel history
  const filteredTimetablesHistory = useMemo(() => {
    return timetables
      .filter((t: any) => {
        if (historyCourseFilter === 'all') return true;
        return (t.courseId || t.planId || t.examId) === historyCourseFilter;
      })
      .sort((a: any, b: any) => (a.weekNumber || 1) - (b.weekNumber || 1));
  }, [timetables, historyCourseFilter]);

  // Modal & Expand State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  const toggleExpandCard = (id: string) => {
    setExpandedCardId(prev => prev === id ? null : id);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (t: Timetable) => {
    handleEditTimetable(t);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* ── HEADER TITLE & ACTIONS ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight uppercase flex items-center gap-2">
            <Calendar className="w-6 h-6 text-emerald-400" /> Academic Timetable Management
          </h2>
          <p className="text-slate-400 text-xs font-bold mt-1">
            Create and manage course-wise weekly study roadmaps & weekend exam schedules.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer border border-emerald-400 shadow-lg active:scale-95"
          >
            <PlusCircle className="w-4 h-4 stroke-[3]" /> Add New Timetable
          </button>
          <button
            onClick={refreshAdminData}
            className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer rounded-none"
          >
            <RefreshCw className="w-4 h-4 text-emerald-400" /> Refresh
          </button>
        </div>
      </div>

      {/* ── ALERTS ── */}
      {successMsg && (
        <div className="bg-emerald-950 border border-emerald-500/40 text-emerald-300 p-3.5 rounded-none flex items-center gap-3 text-xs font-black">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="bg-rose-950 border border-rose-500/40 text-rose-300 p-3.5 rounded-none flex items-center gap-3 text-xs font-black">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ── FILTER & PUBLISHED TIMETABLES LIST VIEW ── */}
      <div className="bg-slate-950 border border-slate-800 rounded-none shadow-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              Published Weekly Timetables ({filteredTimetablesHistory.length})
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest">
              Filter Course:
            </span>
            <select
              value={historyCourseFilter}
              onChange={(e) => setHistoryCourseFilter(e.target.value)}
              className="p-2 bg-slate-900 border border-slate-700 rounded-none text-white font-bold text-xs cursor-pointer focus:outline-none focus:border-emerald-400 min-w-[200px]"
            >
              <option value="all">All Published Courses ({timetables.length})</option>
              {plansList.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Timetables Grid/List */}
        {filteredTimetablesHistory.length === 0 ? (
          <div className="p-12 text-center bg-slate-900 border border-dashed border-slate-800 rounded-none text-slate-400 text-xs font-bold space-y-3">
            <Calendar className="w-10 h-10 text-slate-600 mx-auto" />
            <p>No published timetables found for the selected course filter.</p>
            <button
              onClick={openCreateModal}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" /> Create First Timetable
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTimetablesHistory.map((t: Timetable) => {
              const tId = t._id || t.id;
              const isExpanded = expandedCardId === tId;

              return (
                <div 
                  key={tId} 
                  className="bg-slate-900 border border-slate-800 rounded-none overflow-hidden hover:border-slate-700 transition-colors"
                >
                  {/* Summary Bar */}
                  <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border-b border-slate-800">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-mono font-black uppercase rounded-none">
                          {t.weekTitle || `Week ${t.weekNumber || 1}`}
                        </span>
                        {t.courseName && (
                          <span className="px-2.5 py-0.5 bg-slate-800 text-slate-300 text-[10px] font-mono font-black uppercase rounded-none">
                            {t.courseName}
                          </span>
                        )}
                        {t.weekendExamTitle && (
                          <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[9px] font-mono font-black uppercase flex items-center gap-1">
                            <Award className="w-3 h-3" /> Weekend Exam Included
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-400 block pt-0.5">
                        📅 Schedule Duration: {t.startDate} to {t.endDate} • {t.weeklyChapters?.length || 0} Assigned Subjects
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => toggleExpandCard(tId)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-mono font-black uppercase tracking-wider rounded-none cursor-pointer border border-slate-700 flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        {isExpanded ? 'Hide Details' : 'View Full Details'}
                      </button>
                      <button
                        onClick={() => openEditModal(t)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-none cursor-pointer border border-slate-700"
                        title="Edit Schedule"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTimetable(tId)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-rose-400 rounded-none cursor-pointer border border-slate-700"
                        title="Delete Schedule"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Full Details View */}
                  {isExpanded && (
                    <div className="p-5 bg-slate-950 space-y-4 border-t border-slate-800">
                      <h4 className="text-xs font-mono font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                        <Layers className="w-4 h-4" /> SUBJECT-WISE & CHAPTER-WISE PREPARATION DETAILS
                      </h4>

                      {Array.isArray(t.weeklyChapters) && t.weeklyChapters.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {t.weeklyChapters.map((wc, idx) => (
                            <div key={idx} className="p-4 bg-slate-900 border border-slate-800 rounded-none space-y-2">
                              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                                <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase">
                                  SUBJECT {idx + 1}
                                </span>
                                <span className="text-[10px] font-mono font-black text-white uppercase px-2 py-0.5 bg-slate-950 border border-slate-800">
                                  {wc.subjectName}
                                </span>
                              </div>

                              <div>
                                <span className="text-[9px] font-mono text-slate-400 block font-bold">ASSIGNED CHAPTER:</span>
                                <p className="text-sm font-black text-white tracking-wide">
                                  {wc.chapterName || 'General Chapter'}
                                </p>
                              </div>

                              {wc.topicsText && (
                                <div className="pt-2 border-t border-slate-800">
                                  <span className="text-[9px] font-mono text-emerald-400 font-bold uppercase flex items-center gap-1 mb-1">
                                    <FileText className="w-3 h-3" /> Topics to Prepare:
                                  </span>
                                  <p className="text-xs text-slate-300 font-medium whitespace-pre-line bg-slate-950 p-2 border border-slate-800 leading-relaxed">
                                    {wc.topicsText}
                                  </p>
                                </div>
                              )}

                              {wc.attachmentUrl && (
                                <div className="pt-2 border-t border-slate-800">
                                  <a
                                    href={wc.attachmentUrl.startsWith('http') ? wc.attachmentUrl : `${API_URL}${wc.attachmentUrl}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-full py-1.5 bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-500/40 text-indigo-300 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5"
                                  >
                                    {wc.attachmentType === 'pdf' ? (
                                      <File className="w-3.5 h-3.5 text-rose-400" />
                                    ) : (
                                      <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                                    )}
                                    View Attached {wc.attachmentType === 'pdf' ? 'PDF Material' : 'Image Material'}
                                  </a>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">No subject details specified.</p>
                      )}

                      {/* Linked Weekend Exam */}
                      {t.weekendExamTitle && (
                        <div className="p-3 bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Award className="w-4 h-4 text-amber-400 shrink-0" />
                            <span>Linked Sunday Weekend Exam: <strong>{t.weekendExamTitle}</strong></span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── CREATE / EDIT TIMETABLE MODAL ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-950 border border-slate-800 rounded-none shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 space-y-5 my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-black text-white uppercase tracking-wider">
                  {editingTimetableId ? 'Edit Weekly Schedule' : 'Create Weekly Timetable'}
                </h3>
              </div>
              <button
                onClick={resetForm}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitTimetable} className="space-y-4">
              
              {/* 1. SELECT COURSE CATEGORY & TARGET COURSE */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest mb-1.5">
                    1A. COURSE CATEGORY <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => handleSelectCategory(e.target.value as 'entrance' | 'competitive')}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-none text-white font-black text-xs cursor-pointer focus:outline-none focus:border-emerald-400"
                  >
                    <option value="entrance">🎓 Entrance Exams</option>
                    <option value="competitive">🏆 Competitive Exams</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest mb-1.5">
                    1B. TARGET COURSE / PLAN <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={selectedCourseId}
                    onChange={(e) => handleSelectCourse(e.target.value)}
                    required
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-none text-white font-black text-xs cursor-pointer focus:outline-none focus:border-emerald-400"
                  >
                    <option value="">-- Choose Course ({filteredCategoryCourses.length} Available) --</option>
                    {filteredCategoryCourses.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 2. WEEK DETAILS & DATE RANGE */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest mb-1">
                    WEEK TITLE
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Week 1"
                    value={weekTitle}
                    onChange={(e) => setWeekTitle(e.target.value)}
                    required
                    className="w-full p-2 bg-slate-900 border border-slate-700 rounded-none text-xs font-bold text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest mb-1">
                    START DATE
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full p-2 bg-slate-900 border border-slate-700 rounded-none text-xs font-bold text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest mb-1">
                    END DATE
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                    className="w-full p-2 bg-slate-900 border border-slate-700 rounded-none text-xs font-bold text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              {/* 3. ASSIGN CHAPTERS PER SUBJECT (DYNAMIC) */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <label className="text-[10px] font-mono font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" /> 3. ASSIGN WEEKLY CHAPTERS FOR EACH SUBJECT
                  </label>
                  <span className="text-[10px] font-mono text-slate-400 font-bold">
                    {courseSubjects.length} Subjects Available
                  </span>
                </div>

                {!selectedCourseId ? (
                  <div className="p-6 text-center bg-slate-900 border border-dashed border-slate-800 rounded-none text-slate-400 text-xs font-bold">
                    👈 Select a Course above to assign its subjects & chapters.
                  </div>
                ) : courseSubjects.length === 0 ? (
                  <div className="p-6 text-center bg-slate-900 border border-dashed border-slate-800 rounded-none text-slate-400 text-xs font-bold">
                    No subjects found for this course. Please assign subjects to this course in Subjects & Chapters tab.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                    {courseSubjects.map((sub: any) => {
                      const subId = String(sub.id || sub._id);
                      const subChapters = getSubjectChaptersSorted(subId);
                      const currentAssignedChap = assignedChapterMap[subId] || '';
                      const currentTopics = assignedTopicsMap[subId] || '';
                      const currentAttachment = assignedAttachmentMap[subId] || { url: '', type: 'none' };
                      const isUploading = uploadingSubjectId === subId;

                      return (
                        <div key={subId} className="p-3 bg-slate-900 border border-slate-800 rounded-none space-y-2.5">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="min-w-0 sm:w-2/5">
                              <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase block">SUBJECT</span>
                              <span className="text-xs font-black text-white truncate block uppercase">{sub.name}</span>
                            </div>

                            <div className="sm:w-3/5">
                              <select
                                value={currentAssignedChap}
                                onChange={(e) => setAssignedChapterMap({ ...assignedChapterMap, [subId]: e.target.value })}
                                className="w-full p-2 bg-slate-950 border border-slate-700 rounded-none text-white font-bold text-xs cursor-pointer focus:outline-none focus:border-emerald-400"
                              >
                                <option value="">-- Skip / No Chapter This Week --</option>
                                {subChapters.map((ch: any) => (
                                  <option key={ch.id || ch._id} value={ch.id || ch._id}>
                                    {ch.name || (ch as any).title}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* Optional Preparation Topics & Upload Material (shown if chapter is selected) */}
                          {currentAssignedChap && (
                            <div className="pt-2 border-t border-slate-800/80 space-y-2 text-xs">
                              <div>
                                <label className="block text-[9px] font-mono font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                                  <FileText className="w-3 h-3 text-emerald-400" /> Preparation Topics / Notes (Manual Text)
                                </label>
                                <textarea
                                  rows={2}
                                  placeholder="e.g. Prepare Newton's Laws, Solve Exercise 1-10..."
                                  value={currentTopics}
                                  onChange={(e) => setAssignedTopicsMap({ ...assignedTopicsMap, [subId]: e.target.value })}
                                  className="w-full p-2 bg-slate-950 border border-slate-800 text-white rounded-none text-xs font-medium focus:outline-none focus:border-emerald-400"
                                />
                              </div>

                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <label className="text-[9px] font-mono font-bold text-slate-400 uppercase flex items-center gap-1">
                                    <Paperclip className="w-3 h-3 text-indigo-400" /> Upload Image / PDF
                                  </label>
                                  <label className="px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-indigo-300 text-[10px] font-black uppercase tracking-wider cursor-pointer flex items-center gap-1">
                                    {isUploading ? (
                                      <>
                                        <Loader2 className="w-3 h-3 animate-spin text-indigo-400" /> Uploading...
                                      </>
                                    ) : (
                                      <>
                                        <Upload className="w-3 h-3 text-indigo-400" /> Choose File
                                      </>
                                    )}
                                    <input
                                      type="file"
                                      accept="image/*,.pdf"
                                      className="hidden"
                                      disabled={isUploading}
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleFileUpload(subId, file);
                                      }}
                                    />
                                  </label>
                                </div>

                                {currentAttachment.url && (
                                  <div className="flex items-center gap-2 bg-slate-950 px-2 py-1 border border-slate-800">
                                    <span className="text-[10px] font-mono text-indigo-300 flex items-center gap-1">
                                      {currentAttachment.type === 'pdf' ? (
                                        <File className="w-3 h-3 text-rose-400" />
                                      ) : (
                                        <ImageIcon className="w-3 h-3 text-emerald-400" />
                                      )}
                                      Attached Material
                                    </span>
                                    <a
                                      href={currentAttachment.url.startsWith('http') ? currentAttachment.url : `${API_URL}${currentAttachment.url}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-[9px] text-emerald-400 underline font-bold"
                                    >
                                      View
                                    </a>
                                    <button
                                      type="button"
                                      onClick={() => setAssignedAttachmentMap({
                                        ...assignedAttachmentMap,
                                        [subId]: { url: '', type: 'none' }
                                      })}
                                      className="text-rose-400 hover:text-rose-300 text-[10px] font-black"
                                    >
                                      ×
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 4. LINK SUNDAY WEEKEND EXAM */}
              <div className="pt-2">
                <label className="block text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-amber-400" /> 4. LINK SUNDAY WEEKEND EXAM (OPTIONAL)
                </label>
                <select
                  value={selectedWeekendExamId}
                  onChange={(e) => setSelectedWeekendExamId(e.target.value)}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-none text-white font-bold text-xs cursor-pointer focus:outline-none focus:border-amber-400"
                >
                  <option value="">-- No Exam Linked (Study Schedule Only) --</option>
                  {tests.map((t: any) => (
                    <option key={t.id || t._id} value={t.id || t._id}>
                      🏆 {t.title || t.name} ({t.testType || 'Exam'})
                    </option>
                  ))}
                </select>
              </div>

              {/* SUBMIT BUTTON */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-black uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !selectedCourseId}
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black text-xs font-black uppercase tracking-wider shadow-lg transition-all border border-emerald-400 cursor-pointer flex items-center gap-2"
                >
                  <PlusCircle className="w-4 h-4 stroke-[3]" />
                  {editingTimetableId ? 'Update Weekly Schedule' : 'Publish Weekly Schedule'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
