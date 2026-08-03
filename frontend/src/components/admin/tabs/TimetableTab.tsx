import React, { useState, useMemo } from 'react';
import { 
  Trash2, Calendar, BookOpen, Clock, CheckCircle2, AlertCircle, 
  Sparkles, Layers, PlusCircle, Edit2, Shield, Eye, Award, Check, X, RefreshCw, ChevronRight, Filter
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
    const rawPlans = [...allPlans, ...entranceExams, ...competitiveExams];
    const map = new Map<string, { id: string; name: string; subjects: any[]; examId?: string; allIds: string[] }>();
    
    rawPlans.forEach((p: any) => {
      const cleanName = (p.name || '').replace(/\s*Plan\s*$/i, '').trim();
      if (!cleanName) return;
      const key = cleanName.toLowerCase();
      const pId = String(p.id || p._id || '');
      const pExamId = p.examId ? String(typeof p.examId === 'object' ? p.examId._id || p.examId.id : p.examId) : '';
      const pSubs = Array.isArray(p.subjects) ? p.subjects : [];

      if (!map.has(key)) {
        const idList = [pId];
        if (pExamId && !idList.includes(pExamId)) idList.push(pExamId);
        map.set(key, {
          id: pId,
          name: cleanName,
          subjects: pSubs,
          examId: pExamId,
          allIds: idList
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
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [weekTitle, setWeekTitle] = useState<string>('Week 1');
  const [weekNumber, setWeekNumber] = useState<number>(1);

  // Default Date range: Today to +6 days
  const todayStr = new Date().toISOString().split('T')[0];
  const defaultEndStr = new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const [startDate, setStartDate] = useState<string>(todayStr);
  const [endDate, setEndDate] = useState<string>(defaultEndStr);

  // Subject -> Assigned Chapter mapping (subjectId -> chapterId)
  const [assignedChapterMap, setAssignedChapterMap] = useState<Record<string, string>>({});
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

  const handleSelectCourse = (cId: string) => {
    setSelectedCourseId(cId);
    setEditingTimetableId(null);
    setAssignedChapterMap({});

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
    setSelectedCourseId('');
    setWeekTitle('Week 1');
    setWeekNumber(1);
    setStartDate(todayStr);
    setEndDate(defaultEndStr);
    setAssignedChapterMap({});
    setSelectedWeekendExamId('');
  };

  // Edit an existing timetable schedule
  const handleEditTimetable = (t: Timetable) => {
    setEditingTimetableId(t._id || t.id);
    setSelectedCourseId(t.courseId || t.planId || t.examId || '');
    setWeekTitle(t.weekTitle || `Week ${t.weekNumber || 1}`);
    setWeekNumber(t.weekNumber || 1);
    setStartDate(t.startDate || todayStr);
    setEndDate(t.endDate || defaultEndStr);
    setSelectedWeekendExamId(t.weekendExamId || '');

    const map: Record<string, string> = {};
    if (Array.isArray(t.weeklyChapters)) {
      t.weeklyChapters.forEach(wc => {
        if (wc.subjectId && wc.chapterId) {
          map[wc.subjectId] = wc.chapterId;
        }
      });
    }
    setAssignedChapterMap(map);
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
        return {
          subjectId: subId,
          subjectName: sub.name,
          chapterId: chId,
          chapterName: chapObj ? (chapObj.name || (chapObj as any).title) : ''
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

  return (
    <div className="space-y-6 font-sans">
      {/* ── HEADER TITLE ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight uppercase flex items-center gap-2">
            <Calendar className="w-6 h-6 text-emerald-400" /> Academic Timetable Management
          </h2>
          <p className="text-slate-400 text-xs font-bold mt-1">
            Create course-wise weekly study roadmaps & weekend exam schedules for students.
          </p>
        </div>
        <button
          onClick={refreshAdminData}
          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer rounded-none self-start md:self-auto"
        >
          <RefreshCw className="w-4 h-4 text-emerald-400" /> Refresh Data
        </button>
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

      {/* ── MAIN WORKSPACE GRID: CREATE FORM (LEFT) vs PUBLISHED HISTORY (RIGHT) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ── LEFT PANEL: TIMETABLE FORM (7 COLS) ── */}
        <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-none shadow-2xl p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                {editingTimetableId ? 'Edit Weekly Schedule' : 'Create Weekly Schedule'}
              </h3>
            </div>
            {editingTimetableId && (
              <button
                onClick={resetForm}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-none text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3 h-3" /> Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSubmitTimetable} className="space-y-4">
            
            {/* 1. SELECT TARGET COURSE */}
            <div>
              <label className="block text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest mb-1.5">
                1. SELECT TARGET COURSE / PLAN <span className="text-rose-400">*</span>
              </label>
              <select
                value={selectedCourseId}
                onChange={(e) => handleSelectCourse(e.target.value)}
                required
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-none text-white font-black text-xs cursor-pointer focus:outline-none focus:border-emerald-400"
              >
                <option value="">-- Choose Target Course ({plansList.length} Courses) --</option>
                {plansList.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
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
                  {courseSubjects.length} Subjects
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
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {courseSubjects.map((sub: any) => {
                    const subId = String(sub.id || sub._id);
                    const subChapters = getSubjectChaptersSorted(subId);
                    const currentAssignedChap = assignedChapterMap[subId] || '';

                    return (
                      <div key={subId} className="p-2.5 bg-slate-900 border border-slate-800 rounded-none flex flex-col sm:flex-row sm:items-center justify-between gap-2">
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
                            <option value="">-- Choose Chapter ({subChapters.length} Chapters) --</option>
                            {subChapters.map((ch: any) => (
                              <option key={ch.id || ch._id} value={ch.id || ch._id}>
                                {ch.name || (ch as any).title}
                              </option>
                            ))}
                          </select>
                        </div>
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
            <button
              type="submit"
              disabled={loading || !selectedCourseId}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black text-xs font-black uppercase tracking-wider shadow-lg transition-all border border-emerald-400 cursor-pointer flex items-center justify-center gap-2 mt-4"
            >
              <PlusCircle className="w-4 h-4 stroke-[3]" />
              {editingTimetableId ? 'Update Weekly Schedule' : 'Publish Weekly Schedule'}
            </button>

          </form>
        </div>

        {/* ── RIGHT PANEL: PUBLISHED SCHEDULES HISTORY (5 COLS) ── */}
        <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-none shadow-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Published Schedules ({filteredTimetablesHistory.length})
              </h3>
            </div>
          </div>

          {/* Filter History by Course */}
          <div>
            <label className="block text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest mb-1">
              FILTER HISTORY BY COURSE
            </label>
            <select
              value={historyCourseFilter}
              onChange={(e) => setHistoryCourseFilter(e.target.value)}
              className="w-full p-2 bg-slate-900 border border-slate-700 rounded-none text-white font-bold text-xs cursor-pointer focus:outline-none focus:border-emerald-400"
            >
              <option value="all">All Published Courses ({timetables.length})</option>
              {plansList.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* History List */}
          {filteredTimetablesHistory.length === 0 ? (
            <div className="p-8 text-center bg-slate-900 border border-dashed border-slate-800 rounded-none text-slate-400 text-xs italic">
              No published timetables found for the selected course filter.
            </div>
          ) : (
            <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
              {filteredTimetablesHistory.map((t: Timetable) => {
                const tId = t._id || t.id;
                const isEditing = editingTimetableId === tId;

                return (
                  <div 
                    key={tId} 
                    className={`p-3.5 bg-slate-900 border transition-all ${
                      isEditing ? 'border-emerald-400 ring-1 ring-emerald-400' : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-800">
                      <div>
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[9px] font-mono font-black uppercase rounded-none inline-block mb-1">
                          {t.weekTitle || `Week ${t.weekNumber || 1}`}
                        </span>
                        <h4 className="text-xs font-black text-white uppercase">{t.courseName || 'Course Timetable'}</h4>
                        <span className="text-[10px] font-mono font-bold text-slate-400 block">
                          📅 {t.startDate} to {t.endDate}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleEditTimetable(t)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-none cursor-pointer border border-slate-700"
                          title="Edit Schedule"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteTimetable(tId)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-rose-400 rounded-none cursor-pointer border border-slate-700"
                          title="Delete Schedule"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Assigned Chapters List */}
                    <div className="pt-2 space-y-1">
                      <span className="text-[9px] font-mono font-black text-slate-400 uppercase block mb-1">ASSIGNED CHAPTERS:</span>
                      {Array.isArray(t.weeklyChapters) && t.weeklyChapters.length > 0 ? (
                        t.weeklyChapters.map((wc, idx) => (
                          <div key={idx} className="flex items-center justify-between text-[11px] bg-slate-950 px-2 py-1 border border-slate-800/80">
                            <span className="font-bold text-emerald-400 uppercase text-[10px]">{wc.subjectName}:</span>
                            <span className="font-bold text-white text-[10px] truncate max-w-[180px]">{wc.chapterName || 'General'}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-[10px] text-slate-400 italic">No chapter details specified.</p>
                      )}
                    </div>

                    {/* Linked Weekend Exam */}
                    {t.weekendExamTitle && (
                      <div className="mt-2 p-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-mono font-bold flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="truncate">Weekend Exam: {t.weekendExamTitle}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
