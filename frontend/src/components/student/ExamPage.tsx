import React, { useState, useEffect, useRef, useCallback } from 'react';
import { startExam, saveExamProgress, submitExam, reportTabSwitch, raiseDoubt, fetchAttemptDetails } from '../../lib/api';
import { Test, TestAttempt } from '../../types';
import {
  Clock, AlertTriangle, CheckCircle2, XCircle, ChevronLeft, ChevronRight,
  Maximize, Flag, Send, Trophy, MessageSquarePlus, RotateCcw, BookOpen, X,
  Layers, Bookmark, BarChart2
} from 'lucide-react';

interface ExamPageProps {
  test?: Test;
  attemptId?: string;
  initialPhase?: ExamPhase;
  subjects?: any[];
  chapters?: any[];
  entranceExams?: any[];
  onClose: () => void;
  onComplete?: (result: any) => void;
}

type ExamPhase = 'start' | 'running' | 'warning' | 'force_submitted' | 'scorecard';

export default function ExamPage({ 
  test, 
  attemptId, 
  initialPhase, 
  subjects = [], 
  chapters = [], 
  entranceExams = [], 
  onClose, 
  onComplete 
}: ExamPageProps) {
  const testId = test ? ((test as any)._id || test.id) : '';
  const [phase, setPhase] = useState<ExamPhase>(initialPhase || 'start');
  const [attempt, setAttempt] = useState<any>(null);
  const [responses, setResponses] = useState<Record<string, string>>({}); // questionId → selectedOption
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(((test?.duration) || 60) * 60); // seconds
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({});
  const [visitedQuestions, setVisitedQuestions] = useState<Set<number>>(new Set([0]));
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showMobilePalette, setShowMobilePalette] = useState(false);
  const [showMobileReviewPalette, setShowMobileReviewPalette] = useState(false);

  // Derive Subject sections from attempt.responses
  const subjectSections = React.useMemo(() => {
    if (!attempt?.responses || attempt.responses.length === 0) return [];
    
    const secMap = new Map<string, {
      subjectId: string;
      subjectName: string;
      questionIndices: number[];
    }>();

    attempt.responses.forEach((resp: any, idx: number) => {
      const q = typeof resp.questionId === 'object' ? resp.questionId : null;
      const subObj = q?.subjectId;
      const rawSubId = (typeof subObj === 'object' ? (subObj?._id || subObj?.id) : subObj) || (test?.subjectId?._id || test?.subjectId) || 'general';
      const subIdStr = rawSubId ? rawSubId.toString() : 'general';

      let subName = typeof subObj === 'object' ? subObj?.name : null;
      if (!subName) {
        const found = (subjects || []).find((s: any) => (s.id || s._id || '').toString() === subIdStr);
        subName = found?.name || (test?.isFullSyllabus ? `Section ${secMap.size + 1}` : 'General Subject');
      }

      if (!secMap.has(subIdStr)) {
        secMap.set(subIdStr, {
          subjectId: subIdStr,
          subjectName: subName || 'General Subject',
          questionIndices: [idx]
        });
      } else {
        secMap.get(subIdStr)!.questionIndices.push(idx);
      }
    });

    return Array.from(secMap.values()).map(sec => ({
      subjectId: sec.subjectId,
      subjectName: sec.subjectName,
      startIndex: sec.questionIndices[0],
      endIndex: sec.questionIndices[sec.questionIndices.length - 1],
      questionCount: sec.questionIndices.length,
      questionIndices: sec.questionIndices,
    }));
  }, [attempt, subjects, test]);

  // Current active subject section
  const currentSection = React.useMemo(() => {
    if (!subjectSections || subjectSections.length === 0) return null;
    return subjectSections.find(s => s.questionIndices.includes(currentIndex)) || subjectSections[0];
  }, [subjectSections, currentIndex]);

  useEffect(() => {
    if (phase === 'running') {
      setVisitedQuestions(prev => new Set(prev).add(currentIndex));
    }
  }, [currentIndex, phase]);

  // Load scorecard review directly if attemptId is provided
  useEffect(() => {
    if (attemptId && initialPhase === 'scorecard') {
      setLoading(true);
      fetchAttemptDetails(attemptId)
        .then(data => {
          setResult(data);
          setPhase('scorecard');
        })
        .catch(err => setError(err.message || 'Failed to load test review details'))
        .finally(() => setLoading(false));
    }
  }, [attemptId, initialPhase]);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);

  // Doubt modal
  const [doubtModal, setDoubtModal] = useState<{ open: boolean; questionId: string; questionText: string }>({ open: false, questionId: '', questionText: '' });
  const [doubtContent, setDoubtContent] = useState('');
  const [doubtSent, setDoubtSent] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);

  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoSaveRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isSubmittingRef = useRef<boolean>(false);

  const questions: any[] = attempt?.responses?.map((r: any) => r.questionId) || [];

  // ── Fullscreen helpers ──────────────────────────────────────────────────
  const enterFullscreen = () => {
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen();
    else if ((el as any).webkitRequestFullscreen) (el as any).webkitRequestFullscreen();
  };

  const isFullscreen = () =>
    !!(document.fullscreenElement || (document as any).webkitFullscreenElement);

  // ── Start exam ──────────────────────────────────────────────────────────
  const handleStart = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await startExam(testId);
      setAttempt(data);
      startTimeRef.current = Date.now();
      setTimeLeft((test.duration || 60) * 60);
      setPhase('running');
      enterFullscreen();
    } catch (e: any) {
      setError(e.message || 'Failed to start exam');
    } finally {
      setLoading(false);
    }
  };

  // ── Timer ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'running') return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current!);
  }, [phase]);

  // ── Auto-save every 30s ─────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'running' || !attempt || isSubmittingRef.current) return;

    autoSaveRef.current = setInterval(() => {
      if (isSubmittingRef.current) return;
      const responseArray = buildResponseArray();
      saveExamProgress(attempt._id, responseArray).catch(() => {});
    }, 30000);

    return () => clearInterval(autoSaveRef.current!);
  }, [phase, attempt, responses]);

  // ── Tab / visibility change detection ──────────────────────────────────
  useEffect(() => {
    if (phase !== 'running') return;

    const handleVisibilityChange = async () => {
      if (isSubmittingRef.current) return;
      if (document.hidden && attempt) {
        try {
          const res = await reportTabSwitch(attempt._id);
          if (isSubmittingRef.current) return;
          setTabSwitchCount(res.tabSwitchCount);
          if (res.autoSubmitted) {
            clearInterval(timerRef.current!);
            clearInterval(autoSaveRef.current!);
            setResult(res.result);
            setPhase('force_submitted');
          } else {
            setPhase('warning');
          }
        } catch {}
      }
    };

    const handleFullscreenChange = async () => {
      if (isSubmittingRef.current) return;
      if (!isFullscreen() && phase === 'running' && attempt) {
        try {
          const res = await reportTabSwitch(attempt._id);
          if (isSubmittingRef.current) return;
          setTabSwitchCount(res.tabSwitchCount);
          if (res.autoSubmitted) {
            clearInterval(timerRef.current!);
            clearInterval(autoSaveRef.current!);
            setResult(res.result);
            setPhase('force_submitted');
          } else {
            setPhase('warning');
          }
        } catch {}
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, [phase, attempt]);

  const buildResponseArray = useCallback(() => {
    return (attempt?.responses || []).map((r: any) => ({
      questionId: typeof r.questionId === 'object' ? r.questionId._id : r.questionId,
      selectedOption: responses[typeof r.questionId === 'object' ? r.questionId._id : r.questionId] || null,
    }));
  }, [attempt, responses]);

  // ── Submit ──────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async (isAuto = false) => {
    if (!attempt || phase === 'scorecard' || phase === 'force_submitted' || isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    clearInterval(timerRef.current!);
    clearInterval(autoSaveRef.current!);

    setLoading(true);
    setError('');
    try {
      // Save final responses first
      const responseArray = buildResponseArray();
      try {
        await saveExamProgress(attempt._id, responseArray);
      } catch (saveErr) {
        console.warn('Auto-save progress before submit notice:', saveErr);
      }

      const timeTaken = Math.floor((Date.now() - (startTimeRef.current || Date.now())) / 1000);
      const data = await submitExam(attempt._id, timeTaken);
      
      const evalResult = data.result || data;
      setResult(evalResult);
      setPhase('scorecard');
      setLoading(false);
      onComplete?.(evalResult);

      // Exit fullscreen
      if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
    } catch (e: any) {
      console.error('Submit error:', e);
      setError(e.message || 'Submit failed');
      setLoading(false);
      isSubmittingRef.current = false;
    }
  }, [attempt, phase, buildResponseArray, onComplete]);

  const handleResumeAfterWarning = () => {
    setPhase('running');
    enterFullscreen();
  };

  const handleSelectOption = (questionId: string, option: string) => {
    setResponses(prev => ({ ...prev, [questionId]: option }));
  };

  const handleRaiseDoubt = async () => {
    if (!doubtContent.trim() || !doubtModal.questionId) return;
    try {
      await raiseDoubt({
        testId: testId,
        testAttemptId: result?._id,
        questionId: doubtModal.questionId,
        content: doubtContent,
      });
      setDoubtSent(true);
      setTimeout(() => {
        setDoubtModal({ open: false, questionId: '', questionText: '' });
        setDoubtContent('');
        setDoubtSent(false);
      }, 1500);
    } catch (e: any) {
      setError(e.message);
    }
  };

  // ── Format time ─────────────────────────────────────────────────────────
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const timeWarning = timeLeft <= 300; // last 5 minutes

  // ── Scorecard stats ─────────────────────────────────────────────────────
  const scorecardStats = (() => {
    if (!result) return null;
    const responses = result.responses || [];
    const correct = responses.filter((r: any) => r.isCorrect).length;
    const wrong = responses.filter((r: any) => !r.isCorrect && r.selectedOption).length;
    const unattempted = responses.filter((r: any) => !r.selectedOption).length;
    const total = responses.length;
    const score = result.score ?? 0;
    const marksPerQ = (test as any)?.marksPerQuestion ?? (result?.testId?.marksPerQuestion ?? 4);
    const totalMarks = result.totalMarks || (total * marksPerQ) || 100;
    const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;
    return { correct, wrong, unattempted, total, score, totalMarks, percentage };
  })();

  // ════════════════════════════════════════════════════════════
  //  RENDER — Start Screen (Pre-Exam Detailed Briefing)
  // ════════════════════════════════════════════════════════════
  if (phase === 'start') {
    // Dynamic Subject Name Resolution
    const getSubjectName = () => {
      if (typeof (test as any)?.subjectId === 'object' && (test as any)?.subjectId?.name) {
        return (test as any).subjectId.name;
      }
      const sId = (test?.subjectId || (test as any)?.subjectName || '').toString();
      const matched = subjects.find(s => (s.id || s._id || '').toString() === sId);
      if (matched) return matched.name;
      if (test?.isFullSyllabus) return 'All Core Subjects (Grand Test)';
      return sId && sId.length < 20 ? sId : 'General Academic';
    };

    // Dynamic Chapter Name Resolution
    const getChapterName = () => {
      if (typeof test?.chapterId === 'object' && ((test.chapterId as any)?.title || (test.chapterId as any)?.name)) {
        return (test.chapterId as any).title || (test.chapterId as any).name;
      }
      const cId = (test?.chapterId || (test as any)?.chapterName || '').toString();
      const matched = chapters.find(c => (c.id || c._id || '').toString() === cId);
      if (matched) return matched.name || matched.title;
      if (test?.isFullSyllabus) return 'Full Course Syllabus';
      return cId && cId.length < 20 ? cId : 'Chapter Practice';
    };

    // Dynamic Target Exam Name Resolution
    const getExamName = () => {
      if (Array.isArray(test?.examIds) && test.examIds.length > 0) {
        const firstExam = test.examIds[0];
        if (typeof firstExam === 'object' && firstExam?.name) return firstExam.name;
        const exId = (firstExam || '').toString();
        const matched = entranceExams.find(e => (e.id || e._id || '').toString() === exId);
        if (matched) return matched.name;
      }
      return 'NEET / EAMCET Exam';
    };

    const subjectName = getSubjectName();
    const chapterName = getChapterName();
    const examName = getExamName();
    const totalQuestions = test?.questions?.length || test?.dynamicTotalQuestions || 30;

    return (
      <div className="fixed inset-0 z-[100] bg-slate-900/75 backdrop-blur-md flex items-center justify-center p-3 pb-24 sm:p-4 overflow-y-auto font-sans">
        <div className="w-full max-w-2xl bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-8 shadow-2xl space-y-5 text-slate-900 relative overflow-hidden my-auto">
          
          {/* Glowing Spine Accent */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600"></div>

          {/* Top Ribbon & Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl shadow-xs">
                <BookOpen className="w-6 h-6" />
              </span>
              <div>
                <span className="text-[10px] font-mono font-black uppercase text-emerald-700 tracking-widest block">
                  OFFICIAL MOCK EXAM BRIEFING
                </span>
                <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
                  {test.title}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-slate-100 border border-slate-200 text-slate-800 font-mono font-black text-xs rounded-lg uppercase tracking-wider">
                {test.testType || 'CHAPTER TEST'}
              </span>
              <span className="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-900 font-mono font-black text-xs rounded-lg uppercase tracking-wider">
                {test.targetDifficulty || 'Mixed Level'}
              </span>
            </div>
          </div>

          {/* Specs Bar Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 shadow-2xs">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1">
                <Clock className="w-3 h-3 text-emerald-600" /> Duration
              </span>
              <span className="text-sm sm:text-base font-black text-slate-900 font-mono">{test.duration || 60} Mins</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 shadow-2xs">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1">
                <Flag className="w-3 h-3 text-emerald-600" /> Questions
              </span>
              <span className="text-sm sm:text-base font-black text-slate-900 font-mono">{totalQuestions} Qs</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 shadow-2xs">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Marking
              </span>
              <span className="text-sm sm:text-base font-black text-emerald-700 font-mono">+{(test as any).marksPerQuestion || 4} pts / Q</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 shadow-2xs">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1">
                <XCircle className="w-3 h-3 text-rose-600" /> Negative
              </span>
              <span className="text-sm sm:text-base font-black text-rose-700 font-mono">-{(test as any).negativeMarksPerQuestion || 1} wrong</span>
            </div>
          </div>

          {/* Academic Scope Breakdown */}
          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-3 shadow-2xs">
            <h4 className="text-xs font-black uppercase text-emerald-900 tracking-wider flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-600" /> Academic Scope & Syllabus
            </h4>

            {Array.isArray(test?.subjectConfigs) && test.subjectConfigs.length > 0 ? (
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-emerald-800 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Multi-Subject Competitive Exam ({test.subjectConfigs.length} Subjects)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {test.subjectConfigs.map((sc, sci) => {
                    const sObj = subjects.find(s => (s.id || (s as any)._id).toString() === (sc.subjectId?._id || sc.subjectId || '').toString());
                    const sName = sc.subjectId?.name || sObj?.name || `Subject ${sci + 1}`;
                    const chapCount = sc.chapters?.length || 0;
                    const qCount = sc.totalQuestions || sc.chapters?.reduce((acc: number, c: any) => acc + (c.questionCount || 0), 0);
                    return (
                      <div key={sci} className="p-2.5 rounded-lg bg-white border border-emerald-200/90 shadow-2xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-slate-900 text-xs flex items-center gap-1">
                            📖 {sName}
                          </span>
                          <span className="text-[10px] font-mono font-black px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                            {qCount} Qs
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium">
                          {chapCount} Chapter{chapCount !== 1 ? 's' : ''} configured
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="p-3 rounded-lg bg-white border border-emerald-200/80 space-y-0.5 shadow-2xs">
                  <span className="text-[9px] font-mono font-bold text-slate-500 uppercase block">Target Exam</span>
                  <span className="font-black text-slate-900 line-clamp-1">{examName}</span>
                </div>

                <div className="p-3 rounded-lg bg-white border border-emerald-200/80 space-y-0.5 shadow-2xs">
                  <span className="text-[9px] font-mono font-bold text-slate-500 uppercase block">Subject Involved</span>
                  <span className="font-black text-emerald-800 line-clamp-1">{subjectName}</span>
                </div>

                <div className="p-3 rounded-lg bg-white border border-emerald-200/80 space-y-0.5 shadow-2xs">
                  <span className="text-[9px] font-mono font-bold text-slate-500 uppercase block">Chapter Covered</span>
                  <span className="font-black text-amber-800 line-clamp-1">{chapterName}</span>
                </div>
              </div>
            )}
          </div>

          {/* Instructions text if provided */}
          {test.instructions && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">Special Instructions</span>
              <p className="text-xs text-slate-700 font-medium leading-relaxed">{test.instructions}</p>
            </div>
          )}

          {/* Exam Rules & Security Warnings */}
          <div className="space-y-2 pt-1">
            <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Strict Anti-Cheating & Exam Regulations
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-bold text-slate-700">
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Full screen mandatory during exam</span>
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>1st tab switch = Strike Warning</span>
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>2nd tab switch = Auto Submit</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button 
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer border border-slate-200"
            >
              ← Cancel & Exit
            </button>

            <button 
              onClick={handleStart} 
              disabled={loading}
              className="px-5 py-2.5 sm:px-6 sm:py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Starting Exam Environment...' : '🚀 START OFFICIAL EXAM NOW'}
            </button>
          </div>

        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════
  //  RENDER — Warning Screen (1st tab switch)
  // ════════════════════════════════════════════════════════════
  if (phase === 'warning') {
    return (
      <div className="exam-page warning-screen">
        <div className="warning-card">
          <AlertTriangle size={64} className="warning-icon" />
          <h2>⚠️ Warning!</h2>
          <p>You switched tabs or exited fullscreen.</p>
          <p className="warning-note">One more offense will <strong>automatically submit</strong> your exam!</p>
          <button className="exam-btn-primary" onClick={handleResumeAfterWarning}>
            <Maximize size={16} /> Return to Exam (Fullscreen)
          </button>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════
  //  RENDER — Force Submitted Screen
  // ════════════════════════════════════════════════════════════
  if (phase === 'force_submitted') {
    return (
      <div className="exam-page force-submit-screen">
        <div className="force-submit-card">
          <XCircle size={64} className="text-red-400" />
          <h2>Exam Auto-Submitted</h2>
          <p>Your exam was automatically submitted due to repeated tab switching.</p>
          {result && (
            <div className="quick-score">
              <span>Score: {result.score} / {result.totalMarks}</span>
            </div>
          )}
          <button className="exam-btn-primary" onClick={() => setPhase('scorecard')}>View Scorecard</button>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════
  //  RENDER — Scorecard & Full Analysis (Dark Emerald Glass Theme)
  // ════════════════════════════════════════════════════════════
  if (phase === 'scorecard') {
    if (loading && !result) {
      return (
        <div className="fixed inset-0 z-[100] bg-gradient-to-br from-slate-950 via-emerald-950/90 to-slate-900 flex items-center justify-center p-8 font-sans text-white">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-emerald-300 font-black text-base tracking-wider uppercase">Evaluating Scorecard & Performance Analysis...</p>
          </div>
        </div>
      );
    }

    if (!result) {
      return (
        <div className="fixed inset-0 z-[100] bg-gradient-to-br from-slate-950 via-emerald-950/90 to-slate-900 flex items-center justify-center p-8 font-sans text-white">
          <div className="text-center space-y-4 max-w-md bg-slate-900/90 p-6 rounded-2xl border border-slate-800 shadow-2xl backdrop-blur-xl">
            <XCircle className="w-12 h-12 text-rose-500 mx-auto" />
            <h3 className="font-black text-white text-lg">Unable to load scorecard</h3>
            <p className="text-slate-400 text-xs">{error || 'Test result could not be retrieved.'}</p>
            <button className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer" onClick={onClose}>
              Back to Tests
            </button>
          </div>
        </div>
      );
    }

    const marksPerQ = (test as any)?.marksPerQuestion ?? (result?.testId?.marksPerQuestion ?? 4);
    const negMarksPerQ = (test as any)?.negativeMarksPerQuestion ?? (result?.testId?.negativeMarksPerQuestion ?? 1);

    const resultResponses = result.responses || [];
    const correctCount = result.correctAnswers ?? resultResponses.filter((r: any) => r.isCorrect).length;
    const wrongCount = result.wrongAnswers ?? resultResponses.filter((r: any) => r.selectedOption && !r.isCorrect).length;
    const unattemptedCount = result.unattempted ?? resultResponses.filter((r: any) => !r.selectedOption).length;
    const totalCount = result.totalQuestions ?? resultResponses.length;

    const gainedMarks = correctCount * marksPerQ;
    const lostMarks = wrongCount * negMarksPerQ;
    const netScore = result.score ?? Math.max(0, gainedMarks - lostMarks);
    const maxMarks = result.totalMarks || (totalCount * marksPerQ) || 120;
    const percentage = maxMarks > 0 ? Math.round((netScore / maxMarks) * 100) : 0;

    const scorecardSubjectBreakdown = (() => {
      const map = new Map<string, {
        subjectName: string;
        total: number;
        correct: number;
        wrong: number;
        unattempted: number;
        score: number;
        maxMarks: number;
      }>();

      resultResponses.forEach((r: any) => {
        const q = typeof r.questionId === 'object' ? r.questionId : null;
        const subObj = q?.subjectId;
        const rawSubId = (typeof subObj === 'object' ? (subObj?._id || subObj?.id) : subObj) || 'general';
        const subIdStr = rawSubId ? rawSubId.toString() : 'general';

        let subName = typeof subObj === 'object' ? subObj?.name : null;
        if (!subName) {
          const found = (subjects || []).find((s: any) => (s.id || s._id || '').toString() === subIdStr);
          subName = found?.name || 'Subject';
        }

        if (!map.has(subIdStr)) {
          map.set(subIdStr, {
            subjectName: subName || 'General',
            total: 0,
            correct: 0,
            wrong: 0,
            unattempted: 0,
            score: 0,
            maxMarks: 0,
          });
        }

        const entry = map.get(subIdStr)!;
        entry.total += 1;
        entry.maxMarks += marksPerQ;
        if (r.isCorrect) {
          entry.correct += 1;
          entry.score += marksPerQ;
        } else if (r.selectedOption) {
          entry.wrong += 1;
          entry.score -= negMarksPerQ;
        } else {
          entry.unattempted += 1;
        }
      });

      return Array.from(map.values());
    })();

    const currentReviewResp = resultResponses[reviewIndex] || {};
    const currentQ = typeof currentReviewResp.questionId === 'object' ? currentReviewResp.questionId : null;
    const isCorrect = !!currentReviewResp.isCorrect;
    const attempted = !!currentReviewResp.selectedOption;

    const currentQSubName = (() => {
      if (!currentQ) return '';
      const subObj = currentQ.subjectId;
      if (typeof subObj === 'object' && subObj?.name) return subObj.name;
      const match = (subjects || []).find((s: any) => (s.id || s._id || '').toString() === (subObj || '').toString());
      return match?.name || '';
    })();

    const currentQChapName = (() => {
      if (!currentQ) return '';
      const chapObj = currentQ.chapterId;
      if (typeof chapObj === 'object' && (chapObj?.title || chapObj?.name)) return chapObj.title || chapObj.name;
      const match = (chapters || []).find((c: any) => (c.id || c._id || '').toString() === (chapObj || '').toString());
      return match?.title || match?.name || '';
    })();

    return (
      <div className="fixed inset-0 z-[100] bg-slate-50 flex flex-col font-sans text-slate-900 overflow-hidden">
        
        {/* TOP COMPACT SCORE & METRICS BAR */}
        <header className="p-3 bg-white border-b border-slate-200 shrink-0 shadow-2xs space-y-2.5">
          {/* Top Row: Icon + Scorecard Analysis + Exit Button Top Right */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center font-bold shadow-2xs shrink-0">
                <Trophy className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] font-mono font-black uppercase text-amber-700 tracking-widest block leading-tight">
                  SCORECARD ANALYSIS
                </span>
                <h3 className="text-xs font-black text-slate-900 truncate max-w-[180px] sm:max-w-md">
                  {test?.title || result?.testId?.title || 'Practice Test'}
                </h3>
              </div>
            </div>

            {/* Exit Action Top Right */}
            <button
              onClick={onClose}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 border border-slate-200 shrink-0"
            >
              <X className="w-3.5 h-3.5" /> <span>EXIT</span>
            </button>
          </div>

          {/* Row 2: Marks Score Pill, Palette Drawer Button, and Correct/Wrong Breakdown */}
          <div className="flex items-center justify-between gap-2 text-xs font-mono font-black flex-wrap">
            <div className="flex items-center gap-2">
              <div className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center gap-1.5 shadow-2xs">
                <span>SCORE: {netScore} / {maxMarks}</span>
                <span className="px-1.5 py-0.2 bg-emerald-600 text-white rounded text-[10px]">{percentage}%</span>
              </div>

              {/* Mobile Question Palette Toggle */}
              <button
                onClick={() => setShowMobileReviewPalette(true)}
                className="md:hidden px-2 py-1 bg-slate-100 border border-slate-200 text-slate-800 rounded-lg text-[11px] font-mono font-bold flex items-center gap-1 cursor-pointer hover:bg-slate-200"
              >
                <span>Palette ({reviewIndex + 1}/{totalCount})</span>
                <span className="text-[10px]">▾</span>
              </button>
            </div>

            {/* Correct, Wrong & Skipped Breakdown Pills */}
            <div className="flex items-center gap-1.5 text-[10px] flex-wrap">
              <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded font-bold">
                ✓ {correctCount} Correct (+{gainedMarks})
              </span>
              <span className="px-2 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 rounded font-bold">
                ✗ {wrongCount} Wrong (-{lostMarks})
              </span>
              <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 rounded font-bold">
                — {unattemptedCount} Skipped
              </span>
            </div>
          </div>

          {/* Subject-Wise Performance Breakdown Strip */}
          {scorecardSubjectBreakdown.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-0.5 border-t border-slate-100">
              <span className="text-[10px] font-mono font-bold uppercase text-slate-400 shrink-0 flex items-center gap-1">
                <BarChart2 className="w-3 h-3 text-emerald-600" /> Subject Breakdown:
              </span>
              {scorecardSubjectBreakdown.map((sb, sbi) => {
                const subPct = sb.maxMarks > 0 ? Math.round((Math.max(0, sb.score) / sb.maxMarks) * 100) : 0;
                return (
                  <div key={sbi} className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1.5 shrink-0">
                    <span className="text-slate-800 font-bold">{sb.subjectName}:</span>
                    <span className="text-emerald-700">{sb.correct}/{sb.total}</span>
                    <span className="text-slate-400">({sb.score} pts • {subPct}%)</span>
                  </div>
                );
              })}
            </div>
          )}
        </header>

        {/* MAIN VIEWPORT BODY (NO PAGE SCROLLBAR) */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          
          {/* Left Sidebar Question Review Palette (Desktop Only) */}
          <aside className="hidden md:flex md:w-64 bg-white border-r border-slate-200 p-4 flex-col shrink-0 overflow-y-auto space-y-4 shadow-2xs">
            <h4 className="font-mono text-[10px] font-black uppercase tracking-wider text-slate-500">
              Question Palette ({totalCount})
            </h4>

            <div className="grid grid-cols-5 gap-2">
              {resultResponses.map((r: any, idx: number) => {
                const rCorrect = r.isCorrect;
                const rAttempted = !!r.selectedOption;
                const isActive = idx === reviewIndex;

                let pillStyle = 'bg-slate-100 border border-slate-200 text-slate-600';
                if (rCorrect) pillStyle = 'bg-emerald-600 border border-emerald-500 text-white font-black';
                else if (rAttempted) pillStyle = 'bg-rose-600 border border-rose-500 text-white font-black';

                if (isActive) {
                  pillStyle += ' ring-2 ring-emerald-500 scale-105 shadow-sm';
                }

                return (
                  <button
                    key={idx}
                    onClick={() => setReviewIndex(idx)}
                    className={`w-9 h-9 rounded-xl font-mono text-xs transition-all cursor-pointer flex items-center justify-center ${pillStyle}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-200 space-y-2 text-[11px] font-bold text-slate-600">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-emerald-600 shrink-0" /> Correct (+{marksPerQ})
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-rose-600 shrink-0" /> Incorrect (-{negMarksPerQ})
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-slate-300 shrink-0" /> Skipped (0)
              </div>
            </div>
          </aside>

          {/* Mobile Review Palette Drawer Overlay */}
          {showMobileReviewPalette && (
            <div className="fixed inset-0 z-[110] bg-slate-900/40 backdrop-blur-sm flex flex-col justify-end sm:justify-center p-3 sm:p-4 md:hidden">
              <div className="w-full max-w-lg bg-white border border-slate-200 rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl space-y-4 text-slate-900 max-h-[85vh] overflow-y-auto my-auto">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-600" />
                    <h3 className="text-sm font-black text-slate-900">Question Palette ({totalCount})</h3>
                  </div>
                  <button
                    onClick={() => setShowMobileReviewPalette(false)}
                    className="p-1 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-900 cursor-pointer border border-slate-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {resultResponses.map((r: any, idx: number) => {
                    const rCorrect = r.isCorrect;
                    const rAttempted = !!r.selectedOption;
                    const isActive = idx === reviewIndex;

                    let pillStyle = 'bg-slate-100 border border-slate-200 text-slate-600';
                    if (rCorrect) pillStyle = 'bg-emerald-600 border border-emerald-500 text-white font-black';
                    else if (rAttempted) pillStyle = 'bg-rose-600 border border-rose-500 text-white font-black';

                    if (isActive) {
                      pillStyle += ' ring-2 ring-emerald-500 scale-105 shadow-sm';
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          setReviewIndex(idx);
                          setShowMobileReviewPalette(false);
                        }}
                        className={`h-10 rounded-xl font-mono text-xs transition-all cursor-pointer flex items-center justify-center ${pillStyle}`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-3 border-t border-slate-200 space-y-2 text-[11px] font-bold text-slate-600">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-md bg-emerald-600 shrink-0" /> Correct (+{marksPerQ})
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-md bg-rose-600 shrink-0" /> Incorrect (-{negMarksPerQ})
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-md bg-slate-300 shrink-0" /> Skipped (0)
                  </div>
                </div>
              </div>
            </div>
          )}


          {/* Right Question Main Review Panel */}
          <main className="flex-1 flex flex-col min-h-0 bg-slate-50 p-2.5 sm:p-6 overflow-y-auto space-y-3">
            {currentQ ? (
              <div className="space-y-3 max-w-4xl mx-auto w-full flex flex-col justify-start sm:justify-between">
                
                <div className="space-y-3">
                  {/* Question Header & Status Badge */}
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-black text-slate-900 text-xs sm:text-sm">Question {reviewIndex + 1} of {resultResponses.length}</span>
                      
                      {currentQSubName && (
                        <span className="px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-800 font-mono font-bold text-[10px] rounded-md flex items-center gap-1">
                          <Bookmark className="w-2.5 h-2.5 text-blue-600" /> {currentQSubName}
                        </span>
                      )}

                      {currentQChapName && (
                        <span className="hidden sm:inline-flex px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 font-mono text-[10px] font-bold rounded-md">
                          📖 {currentQChapName}
                        </span>
                      )}

                      <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-md border uppercase tracking-wider ${
                        isCorrect ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                        attempted ? 'bg-rose-50 text-rose-800 border-rose-300' :
                        'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {isCorrect ? `✓ Correct (+${marksPerQ})` : attempted ? `✗ Incorrect (-${negMarksPerQ})` : '— Skipped (0)'}
                      </span>
                    </div>

                    <button
                      onClick={() => setDoubtModal({ open: true, questionId: currentQ._id || currentQ.id, questionText: currentQ.content })}
                      className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-[10px] font-black transition-all cursor-pointer flex items-center gap-1 shrink-0"
                    >
                      <MessageSquarePlus className="w-3 h-3 text-indigo-600" /> Raise Doubt
                    </button>
                  </div>

                  {/* Question Text */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/10 border border-slate-300/80 backdrop-blur-md shadow-xs">
                    <p className="text-sm sm:text-base font-black text-slate-900 leading-relaxed">
                      {currentQ.content}
                    </p>
                  </div>

                  {/* Options List */}
                  <div className="space-y-2.5">
                    {(currentQ.options || []).map((opt: string, oi: number) => {
                      const isAnswerKey = opt === currentQ.correctAnswer;
                      const isStudentChoice = opt === currentReviewResp.selectedOption;
                      const letter = String.fromCharCode(65 + oi);

                      let containerStyle = 'bg-slate-900/10 border-slate-300/80 backdrop-blur-md text-slate-800 hover:border-slate-400';
                      let letterStyle = 'bg-slate-800 text-white font-mono font-black';

                      if (isAnswerKey) {
                        containerStyle = 'bg-emerald-500/20 border-2 border-emerald-500 text-emerald-950 font-black shadow-xs';
                        letterStyle = 'bg-emerald-600 text-white';
                      } else if (isStudentChoice && !isAnswerKey) {
                        containerStyle = 'bg-rose-500/20 border-2 border-rose-500 text-rose-950 font-black shadow-xs';
                        letterStyle = 'bg-rose-600 text-white';
                      }

                      return (
                        <div
                          key={oi}
                          className={`p-3.5 sm:p-4 rounded-2xl border text-xs sm:text-sm font-bold flex items-center justify-between gap-3 transition-all ${containerStyle}`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl text-xs flex items-center justify-center shrink-0 ${letterStyle}`}>
                              {letter}
                            </span>
                            <span className="leading-snug text-xs sm:text-sm">{opt}</span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {isAnswerKey && (
                              <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-300 flex items-center gap-1 uppercase tracking-wider">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Correct
                              </span>
                            )}
                            {isStudentChoice && !isAnswerKey && (
                              <span className="text-[10px] font-black text-rose-800 bg-rose-100 px-2 py-0.5 rounded-lg border border-rose-300 flex items-center gap-1 uppercase tracking-wider">
                                <XCircle className="w-3.5 h-3.5 text-rose-600" /> Your Choice
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Solution / Explanation */}
                  {currentQ.explanation && (
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/15 via-amber-900/10 to-slate-900/20 border-2 border-amber-400/80 backdrop-blur-md space-y-1 shadow-xs">
                      <span className="text-[10px] font-mono font-black uppercase text-amber-900 tracking-wider block">
                        Detailed Solution & Explanation
                      </span>
                      <p className="text-xs text-slate-800 font-bold leading-relaxed">{currentQ.explanation}</p>
                    </div>
                  )}

                </div>

                {/* Bottom Nav Prev / Next */}
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between shrink-0 bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                  <button
                    onClick={() => setReviewIndex(i => Math.max(0, i - 1))}
                    disabled={reviewIndex === 0}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-black uppercase tracking-wider transition-all disabled:opacity-40 border border-slate-200 cursor-pointer flex items-center gap-1"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Previous Question</span><span className="sm:hidden">Prev</span>
                  </button>

                  <span className="text-xs font-mono font-bold text-slate-600">
                    {reviewIndex + 1} / {resultResponses.length}
                  </span>

                  <button
                    onClick={() => setReviewIndex(i => Math.min(resultResponses.length - 1, i + 1))}
                    disabled={reviewIndex === resultResponses.length - 1}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1 shadow-sm"
                  >
                    <span className="hidden sm:inline">Next Question</span><span className="sm:hidden">Next</span> <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            ) : (


              <div className="p-6 text-slate-400 text-xs font-bold">No question data available for review.</div>
            )}
          </main>

        </div>

        {/* Doubt Modal Overlay */}
        {doubtModal.open && (
          <div className="fixed inset-0 z-[110] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4 text-slate-900">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h3 className="text-base font-black text-slate-900">Raise a Doubt</h3>
                <button 
                  onClick={() => setDoubtModal({ open: false, questionId: '', questionText: '' })}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-900 cursor-pointer border border-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 italic line-clamp-3">
                "{doubtModal.questionText}"
              </p>
              <textarea
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-medium shadow-2xs"
                rows={4}
                placeholder="Describe your doubt about this question..."
                value={doubtContent}
                onChange={e => setDoubtContent(e.target.value)}
              />
              {doubtSent ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Doubt submitted successfully!
                </div>
              ) : (
                <button 
                  className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md hover:from-emerald-700 hover:to-teal-700 transition-all cursor-pointer flex items-center justify-center gap-2"
                  onClick={handleRaiseDoubt}
                >
                  <Send className="w-4 h-4" /> Submit Doubt
                </button>
              )}
            </div>
          </div>
        )}


      </div>
    );
  }

  // ════════════════════════════════════════════════════════════
  //  RENDER — Running Exam
  // ════════════════════════════════════════════════════════════
  if (phase === 'running' && attempt) {
    const currentResp = attempt.responses[currentIndex];
    const currentQId = typeof currentResp?.questionId === 'object'
      ? currentResp.questionId._id
      : currentResp?.questionId;
    const currentQ = typeof currentResp?.questionId === 'object' ? currentResp.questionId : null;
    const total = attempt.responses.length;

    // CBT Counts
    const answeredCount = Object.keys(responses).filter(k => responses[k]).length;
    const reviewCount = Object.keys(markedForReview).filter(k => markedForReview[k]).length;
    const visitedCount = visitedQuestions.size;
    const unansweredCount = Math.max(0, visitedCount - answeredCount);
    const notVisitedCount = Math.max(0, total - visitedCount);

    const handleMarkAndNext = () => {
      if (currentQId) {
        setMarkedForReview(prev => ({ ...prev, [currentQId]: !prev[currentQId] }));
      }
      if (currentIndex < total - 1) {
        setCurrentIndex(currentIndex + 1);
      }
    };

    return (
      <div className="fixed inset-0 z-[100] bg-slate-50 flex flex-col font-sans text-slate-900 overflow-hidden">
        
        {/* TOP BAR */}
        <header className="h-14 sm:h-16 px-4 sm:px-6 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold shadow-xs">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
            </div>
            <div>
              <span className="text-[9px] font-mono font-black uppercase text-emerald-700 tracking-widest block">
                CBT ONLINE MOCK EXAM
              </span>
              <h3 className="text-xs sm:text-base font-black text-slate-900 truncate max-w-[160px] sm:max-w-md">
                {test.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Mobile Question Palette Toggle */}
            <button
              onClick={() => setShowMobilePalette(true)}
              className="md:hidden px-2.5 py-1.5 bg-slate-100 border border-slate-200 text-slate-800 rounded-xl text-xs font-mono font-bold flex items-center gap-1 cursor-pointer hover:bg-slate-200"
            >
              <span>Questions ({currentIndex + 1}/{total})</span>
              <span className="text-[10px]">▾</span>
            </button>

            {/* Real-time Timer */}
            <div className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border flex items-center gap-1.5 sm:gap-2 font-mono font-black text-xs sm:text-sm shadow-xs ${
              timeWarning 
                ? 'bg-rose-50 border-rose-200 text-rose-700 animate-pulse' 
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}>
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
              <span>{formatTime(timeLeft)}</span>
            </div>

            {/* Answer Progress Pill */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-700">
              <span className="text-emerald-700 font-bold">{answeredCount}</span> / <span>{total} Answered</span>
            </div>
          </div>
        </header>

        {/* SUBJECT SECTION NAVIGATION TABS (NTA / CBT COMPETITIVE STYLE) */}
        {subjectSections.length > 1 && (
          <div className="bg-slate-100/90 border-b border-slate-200 px-4 sm:px-6 py-2 flex items-center gap-2 overflow-x-auto shrink-0 shadow-2xs">
            <span className="text-[10px] font-mono font-black uppercase text-slate-500 tracking-wider flex items-center gap-1 shrink-0 mr-1">
              <Layers className="w-3.5 h-3.5 text-emerald-600" /> Sections:
            </span>
            {subjectSections.map((sec) => {
              const isActive = currentSection?.subjectId === sec.subjectId;
              const secAns = sec.questionIndices.filter(i => {
                const qId = typeof attempt.responses[i]?.questionId === 'object'
                  ? attempt.responses[i].questionId._id
                  : attempt.responses[i]?.questionId;
                return !!responses[qId];
              }).length;

              return (
                <button
                  key={sec.subjectId}
                  onClick={() => setCurrentIndex(sec.startIndex)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer border shrink-0 ${
                    isActive
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-2 ring-emerald-400/40'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <span>{sec.subjectName}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                    isActive ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {secAns}/{sec.questionCount}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* MAIN EXAM BODY (Side Panel + Question Area) */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          
          {/* LEFT SIDEBAR: STYLISH CBT QUESTION PALETTE (Desktop Only) */}
          <aside className="hidden md:flex md:w-72 bg-white border-r border-slate-200 p-4 flex-col shrink-0 overflow-y-auto space-y-4 shadow-2xs">
            
            {/* Palette Legend */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-mono font-black uppercase text-slate-500 tracking-wider">
                Question Status Legend
              </h4>

              <div className="grid grid-cols-2 gap-2 text-[11px] font-bold">
                <div className="flex items-center gap-2 p-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800">
                  <span className="w-3 h-3 rounded-md bg-emerald-600 shrink-0" />
                  <span>Answered ({answeredCount})</span>
                </div>

                <div className="flex items-center gap-2 p-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-800">
                  <span className="w-3 h-3 rounded-md bg-indigo-600 shrink-0" />
                  <span>Review ({reviewCount})</span>
                </div>

                <div className="flex items-center gap-2 p-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
                  <span className="w-3 h-3 rounded-md bg-amber-500 shrink-0" />
                  <span>Skipped ({unansweredCount})</span>
                </div>

                <div className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-600">
                  <span className="w-3 h-3 rounded-md bg-slate-300 shrink-0" />
                  <span>Not Visited ({notVisitedCount})</span>
                </div>
              </div>
            </div>

            {/* Grid of Number Pills (Subject-wise if multi-subject) */}
            <div className="space-y-3 flex-1">
              <h4 className="text-[10px] font-mono font-black uppercase text-slate-500 tracking-wider">
                Question Palette ({total} Questions)
              </h4>

              {subjectSections.length > 1 ? (
                <div className="space-y-4">
                  {subjectSections.map((sec) => {
                    const isCurrentSec = currentSection?.subjectId === sec.subjectId;
                    return (
                      <div key={sec.subjectId} className="space-y-1.5">
                        <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                          <span className={`text-[11px] font-black flex items-center gap-1 ${
                            isCurrentSec ? 'text-emerald-700' : 'text-slate-600'
                          }`}>
                            <Bookmark className="w-3 h-3 text-emerald-600" /> {sec.subjectName}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            ({sec.questionCount} Qs)
                          </span>
                        </div>
                        <div className="grid grid-cols-5 gap-1.5">
                          {sec.questionIndices.map((idx) => {
                            const qId = typeof attempt.responses[idx].questionId === 'object'
                              ? attempt.responses[idx].questionId._id
                              : attempt.responses[idx].questionId;
                            
                            const isCurrent = idx === currentIndex;
                            const isAns = !!responses[qId];
                            const isRev = !!markedForReview[qId];
                            const isVis = visitedQuestions.has(idx);

                            let colorStyle = 'bg-slate-100 border border-slate-200 text-slate-600';
                            if (isCurrent) {
                              colorStyle = 'ring-2 ring-emerald-500 bg-emerald-600 text-white font-black scale-105 shadow-sm';
                            } else if (isAns && isRev) {
                              colorStyle = 'bg-indigo-600 border border-indigo-500 text-white font-black';
                            } else if (isRev) {
                              colorStyle = 'bg-indigo-50 border border-indigo-300 text-indigo-800 font-black';
                            } else if (isAns) {
                              colorStyle = 'bg-emerald-100 border border-emerald-300 text-emerald-800 font-black';
                            } else if (isVis) {
                              colorStyle = 'bg-amber-100 border border-amber-300 text-amber-800 font-black';
                            }

                            return (
                              <button
                                key={idx}
                                id={`nav-q-${idx}`}
                                onClick={() => setCurrentIndex(idx)}
                                className={`w-9 h-9 rounded-xl font-mono text-xs transition-all cursor-pointer flex items-center justify-center ${colorStyle}`}
                                title={`Question ${idx + 1}`}
                              >
                                {idx + 1}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-5 gap-2">
                  {attempt.responses.map((_: any, idx: number) => {
                    const qId = typeof attempt.responses[idx].questionId === 'object'
                      ? attempt.responses[idx].questionId._id
                      : attempt.responses[idx].questionId;
                    
                    const isCurrent = idx === currentIndex;
                    const isAns = !!responses[qId];
                    const isRev = !!markedForReview[qId];
                    const isVis = visitedQuestions.has(idx);

                    let colorStyle = 'bg-slate-100 border border-slate-200 text-slate-600';
                    if (isCurrent) {
                      colorStyle = 'ring-2 ring-emerald-500 bg-emerald-600 text-white font-black scale-105 shadow-sm';
                    } else if (isAns && isRev) {
                      colorStyle = 'bg-indigo-600 border border-indigo-500 text-white font-black';
                    } else if (isRev) {
                      colorStyle = 'bg-indigo-50 border border-indigo-300 text-indigo-800 font-black';
                    } else if (isAns) {
                      colorStyle = 'bg-emerald-100 border border-emerald-300 text-emerald-800 font-black';
                    } else if (isVis) {
                      colorStyle = 'bg-amber-100 border border-amber-300 text-amber-800 font-black';
                    }

                    return (
                      <button
                        key={idx}
                        id={`nav-q-${idx}`}
                        onClick={() => setCurrentIndex(idx)}
                        className={`w-9 h-9 rounded-xl font-mono text-xs transition-all cursor-pointer flex items-center justify-center ${colorStyle}`}
                        title={`Question ${idx + 1}`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </aside>

          {/* MOBILE PALETTE DRAWER OVERLAY */}
          {showMobilePalette && (
            <div className="fixed inset-0 z-[110] bg-slate-900/40 backdrop-blur-sm flex flex-col justify-end sm:justify-center p-3 sm:p-4 md:hidden">
              <div className="w-full max-w-lg bg-white border border-slate-200 rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl space-y-4 text-slate-900 max-h-[85vh] overflow-y-auto my-auto">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-sm font-black text-slate-900">Question Palette ({total} Questions)</h3>
                  </div>
                  <button
                    onClick={() => setShowMobilePalette(false)}
                    className="p-1 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-900 cursor-pointer border border-slate-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-bold">
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800">
                    <span className="w-3 h-3 rounded-md bg-emerald-600 shrink-0" />
                    <span>Answered ({answeredCount})</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-800">
                    <span className="w-3 h-3 rounded-md bg-indigo-600 shrink-0" />
                    <span>Review ({reviewCount})</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
                    <span className="w-3 h-3 rounded-md bg-amber-500 shrink-0" />
                    <span>Skipped ({unansweredCount})</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-600">
                    <span className="w-3 h-3 rounded-md bg-slate-300 shrink-0" />
                    <span>Not Visited ({notVisitedCount})</span>
                  </div>
                </div>

                <div className="pt-2 max-h-[50vh] overflow-y-auto space-y-4">
                  {subjectSections.length > 1 ? (
                    subjectSections.map((sec) => (
                      <div key={sec.subjectId} className="space-y-2">
                        <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                          <span className="text-xs font-black text-slate-800 flex items-center gap-1">
                            <Bookmark className="w-3 h-3 text-emerald-600" /> {sec.subjectName}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            ({sec.questionCount} Qs)
                          </span>
                        </div>
                        <div className="grid grid-cols-5 gap-2">
                          {sec.questionIndices.map((idx) => {
                            const qId = typeof attempt.responses[idx].questionId === 'object'
                              ? attempt.responses[idx].questionId._id
                              : attempt.responses[idx].questionId;

                            const isCurrent = idx === currentIndex;
                            const isAns = !!responses[qId];
                            const isRev = !!markedForReview[qId];
                            const isVis = visitedQuestions.has(idx);

                            let colorStyle = 'bg-slate-100 border border-slate-200 text-slate-600';
                            if (isCurrent) {
                              colorStyle = 'ring-2 ring-emerald-500 bg-emerald-600 text-white font-black scale-105 shadow-sm';
                            } else if (isAns && isRev) {
                              colorStyle = 'bg-indigo-600 border border-indigo-500 text-white font-black';
                            } else if (isRev) {
                              colorStyle = 'bg-indigo-50 border border-indigo-300 text-indigo-800 font-black';
                            } else if (isAns) {
                              colorStyle = 'bg-emerald-100 border border-emerald-300 text-emerald-800 font-black';
                            } else if (isVis) {
                              colorStyle = 'bg-amber-100 border border-amber-300 text-amber-800 font-black';
                            }

                            return (
                              <button
                                key={idx}
                                onClick={() => {
                                  setCurrentIndex(idx);
                                  setShowMobilePalette(false);
                                }}
                                className={`h-10 rounded-xl font-mono text-xs transition-all cursor-pointer flex items-center justify-center ${colorStyle}`}
                              >
                                {idx + 1}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="grid grid-cols-5 gap-2">
                      {attempt.responses.map((_: any, idx: number) => {
                        const qId = typeof attempt.responses[idx].questionId === 'object'
                          ? attempt.responses[idx].questionId._id
                          : attempt.responses[idx].questionId;

                        const isCurrent = idx === currentIndex;
                        const isAns = !!responses[qId];
                        const isRev = !!markedForReview[qId];
                        const isVis = visitedQuestions.has(idx);

                        let colorStyle = 'bg-slate-100 border border-slate-200 text-slate-600';
                        if (isCurrent) {
                          colorStyle = 'ring-2 ring-emerald-500 bg-emerald-600 text-white font-black scale-105 shadow-sm';
                        } else if (isAns && isRev) {
                          colorStyle = 'bg-indigo-600 border border-indigo-500 text-white font-black';
                        } else if (isRev) {
                          colorStyle = 'bg-indigo-50 border border-indigo-300 text-indigo-800 font-black';
                        } else if (isAns) {
                          colorStyle = 'bg-emerald-100 border border-emerald-300 text-emerald-800 font-black';
                        } else if (isVis) {
                          colorStyle = 'bg-amber-100 border border-amber-300 text-amber-800 font-black';
                        }

                        return (
                          <button
                            key={idx}
                            onClick={() => {
                              setCurrentIndex(idx);
                              setShowMobilePalette(false);
                            }}
                            className={`h-10 rounded-xl font-mono text-xs transition-all cursor-pointer flex items-center justify-center ${colorStyle}`}
                          >
                            {idx + 1}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* RIGHT AREA: QUESTION & OPTIONS DISPLAY */}
          <main className="flex-1 flex flex-col min-h-0 bg-slate-50 p-3.5 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6">
            
            {currentQ ? (
              <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto w-full flex flex-col justify-start sm:justify-between">
                
                <div className="space-y-4 sm:space-y-6">
                  {/* Question Header & Specs */}
                  <div className="space-y-2 pb-2.5 border-b border-slate-200">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 font-mono font-black text-xs rounded-lg">
                          Q{currentIndex + 1} / {total}
                        </span>

                        {currentSection && subjectSections.length > 1 && (
                          <span className="px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-800 font-mono font-bold text-xs rounded-lg flex items-center gap-1">
                            <Bookmark className="w-3 h-3 text-blue-600" />
                            {currentSection.subjectName} (Q{currentSection.questionIndices.indexOf(currentIndex) + 1}/{currentSection.questionCount})
                          </span>
                        )}

                        {currentQ?.chapterId && (
                          <span className="hidden sm:inline-flex px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 font-mono text-[10px] font-bold rounded-md">
                            📖 {(typeof currentQ.chapterId === 'object' ? (currentQ.chapterId.title || currentQ.chapterId.name) : currentQ.chapterId)}
                          </span>
                        )}

                        {markedForReview[currentQId] && (
                          <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 font-mono font-bold text-[10px] rounded-md uppercase flex items-center gap-1">
                            ★ Review
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs font-mono font-bold">
                        <span className="text-emerald-700">+{(test as any).marksPerQuestion || 4} Marks</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-rose-600">-{(test as any).negativeMarksPerQuestion || 1} Neg</span>
                        <span className="hidden sm:inline-block px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-[10px] uppercase ml-1">
                          {currentQ.difficulty || 'Medium'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Question Content */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/10 border border-slate-300/80 backdrop-blur-md shadow-xs space-y-3">
                    <h3 className="text-sm sm:text-lg font-black text-slate-900 leading-relaxed" id={`question-text-${currentIndex}`}>
                      {currentQ.content}
                    </h3>
                  </div>

                  {/* Multiple Choice Options List */}
                  <div className="space-y-2.5 sm:space-y-3">
                    {(currentQ.options || []).map((opt: string, oi: number) => {
                      const isSelected = responses[currentQId] === opt;
                      const letter = String.fromCharCode(65 + oi);

                      return (
                        <div
                          key={oi}
                          id={`option-${currentIndex}-${oi}`}
                          onClick={() => handleSelectOption(currentQId, opt)}
                          className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 group ${
                            isSelected
                              ? 'bg-emerald-500/20 border-2 border-emerald-500 shadow-md text-emerald-950 font-black'
                              : 'bg-slate-900/10 border-slate-300/80 backdrop-blur-md hover:border-emerald-500 text-slate-900 font-bold'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl font-mono font-black text-xs flex items-center justify-center shrink-0 transition-colors ${
                              isSelected 
                                ? 'bg-emerald-600 text-white' 
                                : 'bg-slate-800 text-white group-hover:bg-emerald-600'
                            }`}>
                              {letter}
                            </span>
                            <span className="text-xs sm:text-sm font-bold leading-snug">{opt}</span>
                          </div>

                          {isSelected && (
                            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ─── BOTTOM ACTION BAR ─── */}
                <div className="pt-3 sm:pt-4 border-t border-slate-200 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 shrink-0">
                  
                  {/* Controls Row 1 on Mobile: Prev, Next, Mark & Clear */}
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      id="prev-question-btn"
                      onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
                      disabled={currentIndex === 0}
                      className="flex-1 sm:flex-initial px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-black uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1 border border-slate-200"
                    >
                      <ChevronLeft className="w-4 h-4" /> <span className="hidden sm:inline">Previous</span><span className="sm:hidden">Prev</span>
                    </button>

                    <button
                      id="next-question-btn"
                      onClick={() => setCurrentIndex(i => Math.min(total - 1, i + 1))}
                      disabled={currentIndex === total - 1}
                      className="flex-1 sm:flex-initial px-3.5 sm:px-5 py-2 sm:py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1"
                    >
                      Next <ChevronRight className="w-4 h-4" />
                    </button>

                    <button
                      onClick={handleMarkAndNext}
                      className={`flex-1 sm:flex-initial px-2.5 sm:px-3.5 py-2 sm:py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        markedForReview[currentQId]
                          ? 'bg-indigo-600 text-white border border-indigo-500 shadow-sm'
                          : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                      }`}
                    >
                      <Flag className="w-3.5 h-3.5" />
                      {markedForReview[currentQId] ? '★ Marked' : 'Review'}
                    </button>

                    {responses[currentQId] && (
                      <button
                        onClick={() => setResponses(prev => { const n = { ...prev }; delete n[currentQId]; return n; })}
                        className="px-2.5 py-2 sm:py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 border border-slate-200"
                        title="Clear Response"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                      </button>
                    )}
                  </div>

                  {/* Submit Exam Button */}
                  <button
                    id="exam-submit-btn"
                    onClick={() => setShowConfirmModal(true)}
                    disabled={loading}
                    className="w-full sm:w-auto px-5 py-2 sm:py-2.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white rounded-xl font-black uppercase tracking-wider text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" /> {loading ? 'Submitting...' : 'Finish & Submit Exam 🏁'}
                  </button>

                </div>




              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 font-bold">Loading question data...</div>
            )}

          </main>

        </div>

        {/* SUBMISSION CONFIRMATION MODAL OVERLAY */}
        {showConfirmModal && (
          <div className="fixed inset-0 z-[110] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-5 text-slate-900 my-auto">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center font-bold shrink-0">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Confirm Exam Submission</h3>
                  <p className="text-xs text-slate-500 font-medium">Are you sure you want to finish and submit your exam now?</p>
                </div>
              </div>

              {/* Summary Stats Table */}
              <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-mono text-slate-500 block">Total Questions</span>
                  <span className="text-base font-mono font-black text-slate-900">{total} Qs</span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-mono text-emerald-700 block">Answered</span>
                  <span className="text-base font-mono font-black text-emerald-700">{answeredCount} Qs</span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-mono text-indigo-700 block">Marked for Review</span>
                  <span className="text-base font-mono font-black text-indigo-700">{reviewCount} Qs</span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-mono text-amber-700 block">Unanswered / Skipped</span>
                  <span className="text-base font-mono font-black text-amber-700">{unansweredCount + notVisitedCount} Qs</span>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition-all border border-slate-200 cursor-pointer"
                >
                  ← Resume Exam
                </button>

                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    handleSubmit(false);
                  }}
                  disabled={loading}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-black uppercase tracking-wider text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" /> Yes, Final Submit Exam
                </button>
              </div>
            </div>
          </div>
        )}


        {error && <div className="p-3 bg-rose-600 text-white font-bold text-xs text-center">{error}</div>}
      </div>
    );
  }

  return null;
}
