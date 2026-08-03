import React, { useState, useEffect, useRef, useCallback } from 'react';
import { startExam, saveExamProgress, submitExam, reportTabSwitch, raiseDoubt, fetchAttemptDetails } from '../../lib/api';
import { Test, TestAttempt } from '../../types';
import {
  Clock, AlertTriangle, CheckCircle2, XCircle, ChevronLeft, ChevronRight,
  Maximize, Flag, Send, Trophy, MessageSquarePlus, RotateCcw, BookOpen, X
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
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-950 via-emerald-950/90 to-slate-900 flex items-center justify-center p-4 overflow-y-auto font-sans">
        <div className="w-full max-w-2xl bg-slate-900/80 backdrop-blur-xl border-2 border-emerald-500/80 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 text-white relative overflow-hidden my-auto">
          
          {/* Glowing Spine Accent */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600"></div>

          {/* Top Ribbon & Header */}
          <div className="flex items-center justify-between pb-4 border-b border-emerald-800/40 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 rounded-xl">
                <BookOpen className="w-6 h-6" />
              </span>
              <div>
                <span className="text-[10px] font-mono font-black uppercase text-emerald-400 tracking-widest block">
                  OFFICIAL MOCK EXAM BRIEFING
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {test.title}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-mono font-black text-xs rounded-lg uppercase tracking-wider">
                {test.testType || 'CHAPTER TEST'}
              </span>
              <span className="px-3 py-1 bg-amber-500/20 border border-amber-400/40 text-amber-300 font-mono font-black text-xs rounded-lg uppercase tracking-wider">
                {test.targetDifficulty || 'Mixed Level'}
              </span>
            </div>
          </div>

          {/* Specs Bar Grid (4 Sharp Cards) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                <Clock className="w-3 h-3 text-emerald-400" /> Duration
              </span>
              <span className="text-base font-black text-white font-mono">{test.duration || 60} Mins</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                <Flag className="w-3 h-3 text-emerald-400" /> Questions
              </span>
              <span className="text-base font-black text-white font-mono">{totalQuestions} Qs</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Marking
              </span>
              <span className="text-base font-black text-emerald-400 font-mono">+{(test as any).marksPerQuestion || 4} pts / Q</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                <XCircle className="w-3 h-3 text-rose-400" /> Negative
              </span>
              <span className="text-base font-black text-rose-400 font-mono">-{(test as any).negativeMarksPerQuestion || 1} wrong</span>
            </div>
          </div>

          {/* Academic Scope Breakdown (Subject, Chapter & Target Exam) */}
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 space-y-2.5">
            <h4 className="text-xs font-black uppercase text-emerald-400 tracking-wider flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-400" /> Academic Scope & Syllabus
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-0.5">
                <span className="text-[9px] font-mono text-slate-400 uppercase block">Target Exam</span>
                <span className="font-bold text-white line-clamp-1">{examName}</span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-0.5">
                <span className="text-[9px] font-mono text-slate-400 uppercase block">Subject Involved</span>
                <span className="font-bold text-emerald-300 line-clamp-1">{subjectName}</span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-0.5">
                <span className="text-[9px] font-mono text-slate-400 uppercase block">Chapter Covered</span>
                <span className="font-bold text-amber-300 line-clamp-1">{chapterName}</span>
              </div>
            </div>
          </div>

          {/* Instructions text if provided */}
          {test.instructions && (
            <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Special Instructions</span>
              <p className="text-xs text-slate-300 font-medium leading-relaxed">{test.instructions}</p>
            </div>
          )}

          {/* Exam Rules & Security Warnings */}
          <div className="space-y-2 pt-1">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Strict Anti-Cheating & Exam Regulations
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold text-slate-300">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/40 border border-slate-700/40">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Full screen mandatory during exam</span>
              </div>

              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/40 border border-slate-700/40">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>1st tab switch = Strike Warning</span>
              </div>

              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/40 border border-slate-700/40">
                <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>2nd tab switch = Auto Submit</span>
              </div>

              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/40 border border-slate-700/40">
                <Clock className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Auto-submits when time expires</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs font-bold">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
            <button 
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
            >
              ← Cancel & Exit
            </button>

            <button 
              onClick={handleStart} 
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-950 via-emerald-950/90 to-slate-900 flex items-center justify-center p-8 font-sans text-white">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-emerald-300 font-black text-base tracking-wider uppercase">Evaluating Scorecard & Performance Analysis...</p>
          </div>
        </div>
      );
    }

    if (!result) {
      return (
        <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-950 via-emerald-950/90 to-slate-900 flex items-center justify-center p-8 font-sans text-white">
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

    const currentReviewResp = resultResponses[reviewIndex] || {};
    const currentQ = typeof currentReviewResp.questionId === 'object' ? currentReviewResp.questionId : null;
    const isCorrect = !!currentReviewResp.isCorrect;
    const attempted = !!currentReviewResp.selectedOption;

    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-950 via-emerald-950/90 to-slate-900 flex flex-col font-sans text-white overflow-hidden">
        
        {/* TOP COMPACT SCORE & METRICS BAR */}
        <header className="px-4 py-3 bg-slate-900/90 border-b border-emerald-800/40 flex items-center justify-between shrink-0 shadow-lg backdrop-blur-md gap-4 flex-wrap">
          
          {/* Left: Test Info */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold shadow-xs">
              <Trophy className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <span className="text-[9px] font-mono font-black uppercase text-amber-400 tracking-widest block">
                CBT SCORECARD ANALYSIS
              </span>
              <h3 className="text-xs sm:text-sm font-black text-white truncate max-w-xs sm:max-w-md">
                {test?.title || result?.testId?.title || 'Practice Test'}
              </h3>
            </div>
          </div>

          {/* Center: Integrated Score & Breakdown Pills */}
          <div className="flex items-center gap-3 text-xs font-mono font-black">
            <div className="px-3 py-1 bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 rounded-lg flex items-center gap-2 shadow-xs">
              <span>SCORE: {netScore} / {maxMarks}</span>
              <span className="px-1.5 py-0.5 bg-emerald-600 text-white rounded text-[10px]">{percentage}%</span>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-[11px]">
              <span className="px-2 py-0.5 bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 rounded">
                ✓ {correctCount} Correct (+{gainedMarks})
              </span>
              <span className="px-2 py-0.5 bg-rose-950/80 border border-rose-500/40 text-rose-400 rounded">
                ✗ {wrongCount} Wrong (-{lostMarks})
              </span>
              <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-400 rounded">
                — {unattemptedCount} Skipped
              </span>
            </div>
          </div>

          {/* Right: Exit Action */}
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 border border-slate-700 shrink-0"
          >
            <X className="w-4 h-4" /> Return to Dashboard
          </button>
        </header>

        {/* MAIN VIEWPORT BODY (NO PAGE SCROLLBAR) */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          
          {/* Left Sidebar Question Review Palette */}
          <aside className="w-full md:w-64 bg-slate-900/80 border-b md:border-b-0 md:border-r border-slate-800 p-4 flex flex-col shrink-0 overflow-y-auto space-y-4 backdrop-blur-md">
            <h4 className="font-mono text-[10px] font-black uppercase tracking-wider text-slate-400">
              Question Palette ({totalCount})
            </h4>

            <div className="grid grid-cols-5 gap-2">
              {resultResponses.map((r: any, idx: number) => {
                const rCorrect = r.isCorrect;
                const rAttempted = !!r.selectedOption;
                const isActive = idx === reviewIndex;

                let pillStyle = 'bg-slate-800/60 border border-slate-700 text-slate-400';
                if (rCorrect) pillStyle = 'bg-emerald-600 border border-emerald-400 text-white font-black';
                else if (rAttempted) pillStyle = 'bg-rose-600 border border-rose-400 text-white font-black';

                if (isActive) {
                  pillStyle += ' ring-2 ring-emerald-400 scale-105 shadow-md shadow-emerald-500/30';
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

            <div className="pt-3 border-t border-slate-800/80 space-y-2 text-[11px] font-bold text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-emerald-500 shrink-0" /> Correct (+{marksPerQ})
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-rose-500 shrink-0" /> Incorrect (-{negMarksPerQ})
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-slate-700 shrink-0" /> Skipped (0)
              </div>
            </div>
          </aside>

          {/* Right Question Main Review Panel */}
          <main className="flex-1 flex flex-col min-h-0 bg-slate-950/40 p-4 sm:p-6 overflow-y-auto space-y-5">
            {currentQ ? (
              <div className="flex-1 space-y-5 max-w-4xl mx-auto w-full flex flex-col justify-between">
                
                <div className="space-y-4">
                  {/* Question Header & Status Badge */}
                  <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-black text-white text-base">Question {reviewIndex + 1} of {resultResponses.length}</span>
                      <span className={`text-xs font-mono font-black px-3 py-1 rounded-lg border uppercase tracking-wider ${
                        isCorrect ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                        attempted ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
                        'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {isCorrect ? `✓ Correct (+${marksPerQ} Marks)` : attempted ? `✗ Incorrect (-${negMarksPerQ} Mark)` : '— Skipped (0 Marks)'}
                      </span>
                    </div>

                    <button
                      onClick={() => setDoubtModal({ open: true, questionId: currentQ._id || currentQ.id, questionText: currentQ.content })}
                      className="px-3 py-1.5 bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 border border-purple-500/40 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <MessageSquarePlus className="w-3.5 h-3.5 text-purple-400" /> Raise a Doubt
                    </button>
                  </div>

                  {/* Question Text */}
                  <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-md">
                    <p className="text-sm sm:text-base font-bold text-white leading-relaxed">
                      {currentQ.content}
                    </p>
                  </div>

                  {/* Options List */}
                  <div className="space-y-2.5">
                    {(currentQ.options || []).map((opt: string, oi: number) => {
                      const isAnswerKey = opt === currentQ.correctAnswer;
                      const isStudentChoice = opt === currentReviewResp.selectedOption;
                      const letter = String.fromCharCode(65 + oi);

                      let containerStyle = 'bg-slate-900/70 border-slate-800 text-slate-300';
                      let letterStyle = 'bg-slate-800 text-slate-400';

                      if (isAnswerKey) {
                        containerStyle = 'bg-emerald-950/80 border-2 border-emerald-500 text-white font-bold shadow-md shadow-emerald-500/10';
                        letterStyle = 'bg-emerald-500 text-white';
                      } else if (isStudentChoice && !isAnswerKey) {
                        containerStyle = 'bg-rose-950/80 border-2 border-rose-500 text-white font-bold shadow-md shadow-rose-500/10';
                        letterStyle = 'bg-rose-600 text-white';
                      }

                      return (
                        <div
                          key={oi}
                          className={`p-3.5 rounded-xl border text-sm font-semibold flex items-center justify-between gap-4 transition-all ${containerStyle}`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`w-7 h-7 rounded-lg font-mono font-black text-xs flex items-center justify-center shrink-0 ${letterStyle}`}>
                              {letter}
                            </span>
                            <span className="leading-snug text-xs sm:text-sm">{opt}</span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {isAnswerKey && (
                              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Correct Answer
                              </span>
                            )}
                            {isStudentChoice && !isAnswerKey && (
                              <span className="text-xs font-bold text-rose-400 flex items-center gap-1">
                                <XCircle className="w-4 h-4 text-rose-400" /> Your Choice
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Solution / Explanation */}
                  {currentQ.explanation && (
                    <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 space-y-1">
                      <span className="text-[10px] font-mono font-black uppercase text-amber-400 tracking-wider block">
                        Detailed Solution & Explanation
                      </span>
                      <p className="text-xs text-amber-200 font-medium leading-relaxed">{currentQ.explanation}</p>
                    </div>
                  )}

                </div>

                {/* Bottom Nav Prev / Next */}
                <div className="pt-4 border-t border-slate-800 flex items-center justify-between shrink-0">
                  <button
                    onClick={() => setReviewIndex(i => Math.max(0, i - 1))}
                    disabled={reviewIndex === 0}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5"
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous Question
                  </button>

                  <span className="text-xs font-mono font-bold text-slate-400">
                    {reviewIndex + 1} / {resultResponses.length}
                  </span>

                  <button
                    onClick={() => setReviewIndex(i => Math.min(resultResponses.length - 1, i + 1))}
                    disabled={reviewIndex === resultResponses.length - 1}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5"
                  >
                    Next Question <ChevronRight className="w-4 h-4" />
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
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 text-white">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-base font-black">Raise a Doubt</h3>
                <button 
                  onClick={() => setDoubtModal({ open: false, questionId: '', questionText: '' })}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800 italic line-clamp-3">
                "{doubtModal.questionText}"
              </p>
              <textarea
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-medium"
                rows={4}
                placeholder="Describe your doubt about this question..."
                value={doubtContent}
                onChange={e => setDoubtContent(e.target.value)}
              />
              {doubtSent ? (
                <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Doubt submitted successfully!
                </div>
              ) : (
                <button 
                  className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md hover:from-emerald-500 hover:to-teal-500 transition-all cursor-pointer flex items-center justify-center gap-2"
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
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-950 via-emerald-950/80 to-slate-900 flex flex-col font-sans text-white overflow-hidden">
        
        {/* TOP BAR */}
        <header className="h-16 px-4 sm:px-6 bg-slate-900/90 border-b border-emerald-800/40 flex items-center justify-between shrink-0 shadow-lg backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center font-bold shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-black uppercase text-emerald-400 tracking-widest block">
                CBT ONLINE MOCK EXAM ENVIRONMENT
              </span>
              <h3 className="text-sm sm:text-base font-black text-white truncate max-w-xs sm:max-w-md">
                {test.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Real-time Timer */}
            <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 font-mono font-black text-sm shadow-md ${
              timeWarning 
                ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 animate-pulse' 
                : 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
            }`}>
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>{formatTime(timeLeft)}</span>
            </div>

            {/* Answer Progress Pill */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs font-mono font-bold">
              <span className="text-emerald-400">{answeredCount}</span> / <span>{total} Answered</span>
            </div>
          </div>
        </header>

        {/* MAIN EXAM BODY (Side Panel + Question Area) */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          
          {/* LEFT SIDEBAR: STYLISH CBT QUESTION PALETTE */}
          <aside className="w-full md:w-72 bg-slate-900/80 border-b md:border-b-0 md:border-r border-slate-800 p-4 flex flex-col shrink-0 overflow-y-auto space-y-4 backdrop-blur-md">
            
            {/* Palette Legend */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-mono font-black uppercase text-slate-400 tracking-wider">
                Question Status Legend
              </h4>

              <div className="grid grid-cols-2 gap-2 text-[11px] font-bold">
                <div className="flex items-center gap-2 p-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300">
                  <span className="w-3 h-3 rounded-md bg-emerald-500 shrink-0" />
                  <span>Answered ({answeredCount})</span>
                </div>

                <div className="flex items-center gap-2 p-1.5 rounded-lg bg-purple-950/60 border border-purple-500/40 text-purple-300">
                  <span className="w-3 h-3 rounded-md bg-purple-500 shrink-0" />
                  <span>Review ({reviewCount})</span>
                </div>

                <div className="flex items-center gap-2 p-1.5 rounded-lg bg-amber-950/60 border border-amber-500/40 text-amber-300">
                  <span className="w-3 h-3 rounded-md bg-amber-500 shrink-0" />
                  <span>Skipped ({unansweredCount})</span>
                </div>

                <div className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-800/60 border border-slate-700 text-slate-400">
                  <span className="w-3 h-3 rounded-md bg-slate-700 shrink-0" />
                  <span>Not Visited ({notVisitedCount})</span>
                </div>
              </div>
            </div>

            {/* Grid of Number Pills */}
            <div className="space-y-2 flex-1">
              <h4 className="text-[10px] font-mono font-black uppercase text-slate-400 tracking-wider">
                Question Palette ({total} Questions)
              </h4>

              <div className="grid grid-cols-5 gap-2">
                {attempt.responses.map((_: any, idx: number) => {
                  const qId = typeof attempt.responses[idx].questionId === 'object'
                    ? attempt.responses[idx].questionId._id
                    : attempt.responses[idx].questionId;
                  
                  const isCurrent = idx === currentIndex;
                  const isAns = !!responses[qId];
                  const isRev = !!markedForReview[qId];
                  const isVis = visitedQuestions.has(idx);

                  let colorStyle = 'bg-slate-800/60 border border-slate-700 text-slate-400';

                  if (isCurrent) {
                    colorStyle = 'ring-2 ring-emerald-400 bg-emerald-600 text-white font-black scale-105 shadow-md shadow-emerald-500/30';
                  } else if (isAns && isRev) {
                    colorStyle = 'bg-purple-600 border border-purple-400 text-white font-black';
                  } else if (isRev) {
                    colorStyle = 'bg-purple-950/80 border border-purple-500 text-purple-300 font-black';
                  } else if (isAns) {
                    colorStyle = 'bg-emerald-950/90 border border-emerald-500 text-emerald-400 font-black';
                  } else if (isVis) {
                    colorStyle = 'bg-amber-950/80 border border-amber-500/80 text-amber-300 font-black';
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
          </aside>

          {/* RIGHT AREA: QUESTION & OPTIONS DISPLAY */}
          <main className="flex-1 flex flex-col min-h-0 bg-slate-950/40 p-4 sm:p-6 overflow-y-auto space-y-6">
            
            {currentQ ? (
              <div className="flex-1 space-y-6 max-w-4xl mx-auto w-full flex flex-col justify-between">
                
                <div className="space-y-6">
                  {/* Question Header & Specs */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800 gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 font-mono font-black text-xs rounded-lg">
                        Question {currentIndex + 1} of {total}
                      </span>

                      {markedForReview[currentQId] && (
                        <span className="px-2.5 py-0.5 bg-purple-500/20 border border-purple-400/40 text-purple-300 font-mono font-bold text-[10px] rounded-md uppercase flex items-center gap-1">
                          ★ Marked for Review
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono font-bold">
                      <span className="text-emerald-400">+{(test as any).marksPerQuestion || 4} Marks</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-rose-400">-{(test as any).negativeMarksPerQuestion || 1} Neg</span>
                      <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded-md text-[10px] uppercase ml-1">
                        {currentQ.difficulty || 'Medium'}
                      </span>
                    </div>
                  </div>

                  {/* Question Content */}
                  <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-3">
                    <h3 className="text-base sm:text-lg font-black text-white leading-relaxed" id={`question-text-${currentIndex}`}>
                      {currentQ.content}
                    </h3>
                  </div>

                  {/* Multiple Choice Options List */}
                  <div className="space-y-3">
                    {(currentQ.options || []).map((opt: string, oi: number) => {
                      const isSelected = responses[currentQId] === opt;
                      const letter = String.fromCharCode(65 + oi);

                      return (
                        <div
                          key={oi}
                          id={`option-${currentIndex}-${oi}`}
                          onClick={() => handleSelectOption(currentQId, opt)}
                          className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 group ${
                            isSelected
                              ? 'bg-emerald-950/80 border-2 border-emerald-500 shadow-md shadow-emerald-500/10 text-white'
                              : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 text-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-3.5">
                            <span className={`w-8 h-8 rounded-lg font-mono font-black text-xs flex items-center justify-center shrink-0 transition-colors ${
                              isSelected 
                                ? 'bg-emerald-500 text-white' 
                                : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-white'
                            }`}>
                              {letter}
                            </span>
                            <span className="text-sm font-bold leading-snug">{opt}</span>
                          </div>

                          {isSelected && (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ─── BOTTOM ACTION BAR (PREVIOUS & NEXT PAKKA PAKKANA + SUBMIT) ─── */}
                <div className="pt-6 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  
                  {/* Previous & Next Side-by-Side (Pakka Pakkana) */}
                  <div className="flex items-center gap-2">
                    <button
                      id="prev-question-btn"
                      onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
                      disabled={currentIndex === 0}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5"
                    >
                      <ChevronLeft className="w-4 h-4" /> Previous
                    </button>

                    <button
                      id="next-question-btn"
                      onClick={() => setCurrentIndex(i => Math.min(total - 1, i + 1))}
                      disabled={currentIndex === total - 1}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5"
                    >
                      Next <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Middle Controls: Mark for Review & Clear Response */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleMarkAndNext}
                      className={`px-3.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                        markedForReview[currentQId]
                          ? 'bg-purple-600 text-white border border-purple-400 shadow-md'
                          : 'bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 border border-purple-500/40'
                      }`}
                    >
                      <Flag className="w-3.5 h-3.5" />
                      {markedForReview[currentQId] ? '★ Marked for Review' : 'Mark for Review & Next'}
                    </button>

                    {responses[currentQId] && (
                      <button
                        onClick={() => setResponses(prev => { const n = { ...prev }; delete n[currentQId]; return n; })}
                        className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 border border-slate-700"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-slate-400" /> Clear Choice
                      </button>
                    )}
                  </div>

                  {/* Right: FINISH & SUBMIT EXAM Button right next to options/next */}
                  <button
                    id="exam-submit-btn"
                    onClick={() => setShowConfirmModal(true)}
                    disabled={loading}
                    className="px-6 py-2.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white rounded-xl font-black uppercase tracking-wider text-xs shadow-lg transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
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
          <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-slate-900 border-2 border-emerald-500/80 rounded-2xl p-6 shadow-2xl space-y-5 text-white my-auto">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold shrink-0">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Confirm Exam Submission</h3>
                  <p className="text-xs text-slate-400 font-medium">Are you sure you want to finish and submit your exam now?</p>
                </div>
              </div>

              {/* Summary Stats Table */}
              <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-mono text-slate-500 block">Total Questions</span>
                  <span className="text-base font-mono font-black text-white">{total} Qs</span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-mono text-emerald-400 block">Answered</span>
                  <span className="text-base font-mono font-black text-emerald-400">{answeredCount} Qs</span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-mono text-purple-400 block">Marked for Review</span>
                  <span className="text-base font-mono font-black text-purple-400">{reviewCount} Qs</span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-mono text-amber-400 block">Unanswered / Skipped</span>
                  <span className="text-base font-mono font-black text-amber-400">{unansweredCount + notVisitedCount} Qs</span>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                >
                  ← Resume Exam
                </button>

                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    handleSubmit(false);
                  }}
                  disabled={loading}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-black uppercase tracking-wider text-xs shadow-lg transition-all cursor-pointer flex items-center gap-2"
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
