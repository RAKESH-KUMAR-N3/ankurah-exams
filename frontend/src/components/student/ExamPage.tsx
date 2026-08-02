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
  onClose: () => void;
  onComplete?: (result: any) => void;
}

type ExamPhase = 'start' | 'running' | 'warning' | 'force_submitted' | 'scorecard';

export default function ExamPage({ test, attemptId, initialPhase, onClose, onComplete }: ExamPageProps) {
  const testId = test ? ((test as any)._id || test.id) : '';
  const [phase, setPhase] = useState<ExamPhase>(initialPhase || 'start');
  const [attempt, setAttempt] = useState<any>(null);
  const [responses, setResponses] = useState<Record<string, string>>({}); // questionId → selectedOption
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(((test?.duration) || 60) * 60); // seconds
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);

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
    if (phase !== 'running' || !attempt) return;

    autoSaveRef.current = setInterval(() => {
      const responseArray = buildResponseArray();
      saveExamProgress(attempt._id, responseArray).catch(() => {});
    }, 30000);

    return () => clearInterval(autoSaveRef.current!);
  }, [phase, attempt, responses]);

  // ── Tab / visibility change detection ──────────────────────────────────
  useEffect(() => {
    if (phase !== 'running') return;

    const handleVisibilityChange = async () => {
      if (document.hidden && attempt) {
        try {
          const res = await reportTabSwitch(attempt._id);
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
      if (!isFullscreen() && phase === 'running' && attempt) {
        try {
          const res = await reportTabSwitch(attempt._id);
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
    if (!attempt || phase === 'scorecard' || phase === 'force_submitted') return;
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
  //  RENDER — Start Screen
  // ════════════════════════════════════════════════════════════
  if (phase === 'start') {
    return (
      <div className="exam-page start-screen">
        <div className="exam-start-card">
          <div className="exam-start-icon">
            <BookOpen size={48} />
          </div>
          <h1 className="exam-start-title">{test.title}</h1>
          <div className="exam-start-meta">
            <span><Clock size={16} /> {test.duration} minutes</span>
            <span><Flag size={16} /> {(test as any).marksPerQuestion || 4} marks/question</span>
            <span><XCircle size={16} /> -{(test as any).negativeMarksPerQuestion || 1} wrong</span>
          </div>
          {test.instructions && (
            <div className="exam-instructions">
              <h3>Instructions</h3>
              <p>{test.instructions}</p>
            </div>
          )}
          <div className="exam-rules">
            <div className="rule-item"><AlertTriangle size={16} className="text-amber-400" /> Exam will go fullscreen</div>
            <div className="rule-item"><AlertTriangle size={16} className="text-amber-400" /> 1st tab switch → Warning</div>
            <div className="rule-item"><AlertTriangle size={16} className="text-red-400" /> 2nd tab switch → Auto submit</div>
            <div className="rule-item"><Clock size={16} className="text-blue-400" /> Auto-submits when time is up</div>
            <div className="rule-item"><XCircle size={16} className="text-red-400" /> No pause or resume allowed</div>
          </div>
          {error && <p className="exam-error">{error}</p>}
          <div className="exam-start-actions">
            <button className="exam-btn-secondary" onClick={onClose}>Cancel</button>
            <button className="exam-btn-primary" onClick={handleStart} disabled={loading}>
              {loading ? 'Starting...' : '🚀 Start Exam'}
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
  //  RENDER — Scorecard
  // ════════════════════════════════════════════════════════════
  if (phase === 'scorecard') {
    if (loading && !result) {
      return (
        <div className="exam-page scorecard-screen flex items-center justify-center p-8">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-slate-600 font-bold text-base">Loading scorecard & analysis...</p>
          </div>
        </div>
      );
    }

    if (!result) {
      return (
        <div className="exam-page scorecard-screen flex items-center justify-center p-8">
          <div className="text-center space-y-4 max-w-md bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <XCircle size={48} className="text-red-500 mx-auto" />
            <h3 className="font-bold text-slate-800 text-lg">Unable to load scorecard</h3>
            <p className="text-slate-500 text-sm">{error || 'Test result could not be retrieved.'}</p>
            <button className="exam-btn-primary mx-auto" onClick={onClose}>Back to Tests</button>
          </div>
        </div>
      );
    }

    const stats = scorecardStats || { correct: 0, wrong: 0, unattempted: 0, total: 0, score: 0, totalMarks: 0, percentage: 0 };
    const resultResponses = result.responses || [];
    const currentReviewResp = resultResponses[reviewIndex] || {};
    const currentQ = typeof currentReviewResp.questionId === 'object' ? currentReviewResp.questionId : null;
    const isCorrect = !!currentReviewResp.isCorrect;
    const attempted = !!currentReviewResp.selectedOption;

    return (
      <div className="exam-page scorecard-screen">
        <div className="scorecard-container max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <div className="scorecard-header">
            <div className="scorecard-title-row">
              <Trophy size={32} className="text-yellow-400" />
              <h1>Scorecard & Analysis</h1>
              <button className="scorecard-close" onClick={onClose}><X size={20} /></button>
            </div>
            <p className="scorecard-test-title">{test?.title || result?.testId?.title || 'Test'}</p>
          </div>

          {/* Score Summary */}
          <div className="scorecard-summary">
            <div className="score-circle">
              <div className="score-circle-inner">
                <span className="score-big">{stats.percentage}%</span>
                <span className="score-sub">{stats.score}/{stats.totalMarks}</span>
              </div>
            </div>
            <div className="score-stats">
              <div className="stat-box correct"><CheckCircle2 size={20} /><span>{stats.correct}</span><label>Correct</label></div>
              <div className="stat-box wrong"><XCircle size={20} /><span>{stats.wrong}</span><label>Wrong</label></div>
              <div className="stat-box unattempted"><Flag size={20} /><span>{stats.unattempted}</span><label>Skipped</label></div>
              <div className="stat-box total"><BookOpen size={20} /><span>{stats.total}</span><label>Total</label></div>
            </div>
          </div>

          {/* Question Review Section — Exam UI Palette Layout */}
          <div className="exam-body bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="exam-question-panel flex flex-col md:flex-row min-h-[500px]">
              
              {/* Question Navigator (sidebar palette) */}
              <div className="exam-navigator w-full md:w-64 border-r border-slate-200 p-4 bg-slate-50 shrink-0">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-3">Question Palette</h4>
                <div className="grid grid-cols-5 gap-2">
                  {resultResponses.map((r: any, idx: number) => {
                    const rCorrect = r.isCorrect;
                    const rAttempted = !!r.selectedOption;
                    const isActive = idx === reviewIndex;

                    return (
                      <button
                        key={idx}
                        onClick={() => setReviewIndex(idx)}
                        className={`w-9 h-9 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                          isActive ? 'ring-2 ring-slate-900 ring-offset-1 scale-105 z-10' : ''
                        } ${
                          rCorrect ? 'bg-emerald-500 text-white border-emerald-600' :
                          rAttempted ? 'bg-red-500 text-white border-red-600' :
                          'bg-slate-200 text-slate-700 border-slate-300'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200 space-y-2 text-[11px] text-slate-600 font-semibold">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-md bg-emerald-500 inline-block" /> Correct
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-md bg-red-500 inline-block" /> Wrong / Incorrect
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-md bg-slate-300 inline-block" /> Skipped / Unattempted
                  </div>
                </div>
              </div>

              {/* Current Question Main View */}
              <div className="exam-question-main flex-grow p-6 flex flex-col justify-between space-y-6">
                {currentQ ? (
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-900 text-base">Question {reviewIndex + 1} of {resultResponses.length}</span>
                        <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border ${
                          isCorrect ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          attempted ? 'bg-red-50 text-red-700 border-red-200' :
                          'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {isCorrect ? '✓ Correct (+4)' : attempted ? '✗ Wrong (-1)' : '— Skipped (0)'}
                        </span>
                        {currentQ.difficulty && (
                          <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md uppercase">
                            {currentQ.difficulty}
                          </span>
                        )}
                      </div>

                      <button
                        className="py-1.5 px-3 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        onClick={() => setDoubtModal({ open: true, questionId: currentQ._id, questionText: currentQ.content })}
                      >
                        <MessageSquarePlus size={15} /> Raise Doubt
                      </button>
                    </div>

                    {/* Question Content */}
                    <p className="text-sm md:text-base font-semibold text-slate-800 leading-relaxed">
                      {currentQ.content}
                    </p>

                    {/* Options */}
                    <div className="space-y-2.5 pt-2">
                      {(currentQ.options || []).map((opt: string, oi: number) => {
                        const isAnswerKey = opt === currentQ.correctAnswer;
                        const isStudentChoice = opt === currentReviewResp.selectedOption;

                        return (
                          <div
                            key={oi}
                            className={`p-3.5 rounded-xl border text-xs md:text-sm font-semibold flex items-center justify-between transition-all ${
                              isAnswerKey
                                ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold shadow-xs'
                                : isStudentChoice && !isAnswerKey
                                ? 'bg-red-50 border-red-400 text-red-950 font-bold'
                                : 'bg-slate-50 border-slate-200 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                                isAnswerKey ? 'bg-emerald-600 text-white' :
                                isStudentChoice ? 'bg-red-600 text-white' :
                                'bg-slate-200 text-slate-700'
                              }`}>
                                {String.fromCharCode(65 + oi)}
                              </span>
                              <span>{opt}</span>
                            </div>

                            <div className="flex items-center gap-2">
                              {isAnswerKey && (
                                <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                                  <CheckCircle2 size={16} /> Correct Answer
                                </span>
                              )}
                              {isStudentChoice && !isAnswerKey && (
                                <span className="text-xs font-bold text-red-600 flex items-center gap-1">
                                  <XCircle size={16} /> Your Choice
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    {currentQ.explanation && (
                      <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-950 space-y-1 mt-4">
                        <strong className="block font-bold text-amber-900 uppercase tracking-wider text-[10px]">Solution / Explanation:</strong>
                        <p className="leading-relaxed">{currentQ.explanation}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4 py-6">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <span className="font-bold text-slate-800 text-sm">Question {reviewIndex + 1} of {resultResponses.length}</span>
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                        isCorrect ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        attempted ? 'bg-red-50 text-red-700 border-red-200' :
                        'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {isCorrect ? '✓ Correct' : attempted ? '✗ Wrong' : '— Skipped'}
                      </span>
                    </div>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                      <p className="text-slate-700"><strong>Selected Answer:</strong> {currentReviewResp.selectedOption || 'None (Skipped)'}</p>
                    </div>
                  </div>
                )}

                {/* Bottom Navigation (Prev / Next) */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <button
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    onClick={() => setReviewIndex(i => Math.max(0, i - 1))}
                    disabled={reviewIndex === 0}
                  >
                    <ChevronLeft size={16} /> Previous Question
                  </button>

                  <span className="text-xs font-bold text-slate-400">
                    {reviewIndex + 1} / {resultResponses.length}
                  </span>

                  <button
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    onClick={() => setReviewIndex(i => Math.min(resultResponses.length - 1, i + 1))}
                    disabled={reviewIndex === resultResponses.length - 1}
                  >
                    Next Question <ChevronRight size={16} />
                  </button>
                </div>

              </div>

            </div>
          </div>
        </div>

        {/* Doubt Modal */}
        {doubtModal.open && (
          <div className="doubt-modal-overlay">
            <div className="doubt-modal">
              <div className="doubt-modal-header">
                <h3>Raise a Doubt</h3>
                <button onClick={() => setDoubtModal({ open: false, questionId: '', questionText: '' })}><X size={18} /></button>
              </div>
              <p className="doubt-question-preview">{doubtModal.questionText}</p>
              <textarea
                className="doubt-textarea"
                rows={4}
                placeholder="Describe your doubt about this question..."
                value={doubtContent}
                onChange={e => setDoubtContent(e.target.value)}
              />
              {doubtSent ? (
                <p className="doubt-sent"><CheckCircle2 size={16} /> Doubt submitted!</p>
              ) : (
                <button className="exam-btn-primary" onClick={handleRaiseDoubt}>
                  <Send size={16} /> Submit Doubt
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
    const answered = Object.keys(responses).filter(k => responses[k]).length;

    return (
      <div className="exam-page running-screen" id="exam-running-container">
        {/* Top Bar */}
        <div className="exam-topbar">
          <div className="exam-title-bar">
            <BookOpen size={18} />
            <span>{test.title}</span>
          </div>
          <div className={`exam-timer ${timeWarning ? 'timer-warning' : ''}`}>
            <Clock size={16} />
            <span>{formatTime(timeLeft)}</span>
          </div>
          <div className="exam-progress-bar-wrap">
            <div className="exam-q-counter">{answered}/{total} answered</div>
          </div>
          <button
            id="exam-submit-btn"
            className="exam-submit-top"
            onClick={() => handleSubmit(false)}
            disabled={loading}
          >
            <Send size={16} /> Submit
          </button>
        </div>

        <div className="exam-body">
          {/* Question Panel */}
          <div className="exam-question-panel">
            {/* Question Navigator (sidebar) */}
            <div className="exam-navigator">
              <h4>Questions</h4>
              <div className="nav-grid">
                {attempt.responses.map((_: any, idx: number) => {
                  const qId = typeof attempt.responses[idx].questionId === 'object'
                    ? attempt.responses[idx].questionId._id
                    : attempt.responses[idx].questionId;
                  const isAnswered = !!responses[qId];
                  return (
                    <button
                      key={idx}
                      id={`nav-q-${idx}`}
                      className={`nav-q-btn ${idx === currentIndex ? 'active' : ''} ${isAnswered ? 'answered' : ''}`}
                      onClick={() => setCurrentIndex(idx)}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Current Question */}
            <div className="exam-question-main">
              {currentQ ? (
                <>
                  <div className="question-header">
                    <span className="question-number">Question {currentIndex + 1} of {total}</span>
                    <span className={`difficulty-badge diff-${currentQ.difficulty?.toLowerCase()}`}>{currentQ.difficulty}</span>
                  </div>
                  <p className="question-text" id={`question-text-${currentIndex}`}>{currentQ.content}</p>
                  <div className="options-list">
                    {(currentQ.options || []).map((opt: string, oi: number) => (
                      <button
                        key={oi}
                        id={`option-${currentIndex}-${oi}`}
                        className={`option-btn ${responses[currentQId] === opt ? 'option-selected' : ''}`}
                        onClick={() => handleSelectOption(currentQId, opt)}
                      >
                        <span className="option-label">{String.fromCharCode(65 + oi)}</span>
                        <span className="option-text">{opt}</span>
                        {responses[currentQId] === opt && <CheckCircle2 size={16} className="option-check" />}
                      </button>
                    ))}
                  </div>
                  {responses[currentQId] && (
                    <button
                      className="clear-response-btn"
                      onClick={() => setResponses(prev => { const n = { ...prev }; delete n[currentQId]; return n; })}
                    >
                      <RotateCcw size={14} /> Clear Response
                    </button>
                  )}
                </>
              ) : (
                <div className="loading-question">Loading question...</div>
              )}

              {/* Navigation */}
              <div className="question-nav">
                <button
                  id="prev-question-btn"
                  className="nav-btn"
                  onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
                  disabled={currentIndex === 0}
                >
                  <ChevronLeft size={16} /> Previous
                </button>
                <button
                  id="next-question-btn"
                  className="nav-btn"
                  onClick={() => setCurrentIndex(i => Math.min(total - 1, i + 1))}
                  disabled={currentIndex === total - 1}
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {error && <div className="exam-error-toast">{error}</div>}
      </div>
    );
  }

  return null;
}
