import React, { useState, useEffect } from 'react';
import { User, Test, TestAttempt } from '../../types';
import {
  FileText, Clock, Award, Play, CheckCircle, ChevronLeft,
  Zap, Trophy, BookOpen, RefreshCw, Filter, Eye, RotateCcw
} from 'lucide-react';
import ExamPage from './ExamPage';
import Leaderboard from './Leaderboard';
import { fetchMyAttempts } from '../../lib/api';

interface TestSectionProps {
  user: User;
  tests: Test[];
  attempts: TestAttempt[];
  subjects?: any[];
  chapters?: any[];
  entranceExams?: any[];
  onTestSubmitted: (result: any) => void;
}

const getAttemptTestId = (a: any): string => {
  if (!a) return '';
  if (typeof a.testId === 'object' && a.testId !== null) {
    return (a.testId as any)._id || (a.testId as any).id || '';
  }
  return a.testId ? String(a.testId) : '';
};

export default function TestSection({ 
  user, 
  tests, 
  attempts: initialAttempts, 
  subjects = [], 
  chapters = [], 
  entranceExams = [], 
  onTestSubmitted 
}: TestSectionProps) {
  const [activeExam, setActiveExam] = useState<Test | null>(null);
  const [reviewAttemptId, setReviewAttemptId] = useState<string | null>(null);
  const [attempts, setAttempts] = useState<TestAttempt[]>(initialAttempts);
  const [tab, setTab] = useState<'available' | 'history' | 'leaderboard'>('available');
  const [filterType, setFilterType] = useState<string>('all');
  const [loadingAttempts, setLoadingAttempts] = useState(false);

  // Sync when initialAttempts prop updates
  useEffect(() => {
    if (initialAttempts) {
      setAttempts(initialAttempts);
    }
  }, [initialAttempts]);

  // Refresh attempts from server
  const refreshAttempts = async () => {
    setLoadingAttempts(true);
    try {
      const data = await fetchMyAttempts();
      setAttempts(data);
    } catch {}
    setLoadingAttempts(false);
  };

  useEffect(() => {
    refreshAttempts();
  }, [tab]);

  const [submittedResult, setSubmittedResult] = useState<any>(null);

  const handleExamComplete = (result: any) => {
    setSubmittedResult(result);
    try {
      onTestSubmitted(result);
    } catch (err) {
      console.warn('onTestSubmitted background notification error:', err);
    }
    refreshAttempts();
  };

  const handleCloseExam = () => {
    setActiveExam(null);
    setReviewAttemptId(null);
    setSubmittedResult(null);
    setTab('history');
    refreshAttempts();
  };

  // Build lookup: testId → latest attempt
  const attemptByTestId: Record<string, TestAttempt> = {};
  attempts.forEach(a => {
    const tid = getAttemptTestId(a);
    if (tid && (!attemptByTestId[tid] || new Date(a.submittedAt || (a as any).createdAt || '').getTime() > new Date(attemptByTestId[tid].submittedAt || (attemptByTestId[tid] as any).createdAt || '').getTime())) {
      attemptByTestId[tid] = a;
    }
  });

  // Check retake eligibility
  const canAttempt = (test: Test) => {
    const tid = (test as any)._id || test.id;
    const testAttempts = attempts.filter(a => getAttemptTestId(a) === tid);
    const retakeLimit = test.retakeLimit ?? 0;
    if (retakeLimit === 0) return true; // unlimited
    return testAttempts.length < retakeLimit;
  };

  const publishedTests = tests.filter(t => t.status === 'Published');
  const filteredTests = filterType === 'all'
    ? publishedTests
    : publishedTests.filter(t => (t.testType || '').toLowerCase() === filterType.toLowerCase());

  const testTypes = [...new Set(publishedTests.map(t => t.testType).filter(Boolean))];

  const getTypeIcon = (t: Test) =>
    t.isDynamic ? <Zap size={14} className="text-blue-500" /> :
    t.isFullSyllabus ? <Trophy size={14} className="text-yellow-500" /> :
    <BookOpen size={14} className="text-emerald-500" />;

  // ── If reviewing a completed exam ──
  if (reviewAttemptId) {
    return (
      <ExamPage
        attemptId={reviewAttemptId}
        initialPhase="scorecard"
        onClose={handleCloseExam}
      />
    );
  }

  // ── If exam is active, show ExamPage fullscreen ──
  if (activeExam) {
    return (
      <ExamPage
        test={activeExam}
        subjects={subjects}
        chapters={chapters}
        entranceExams={entranceExams}
        onClose={handleCloseExam}
        onComplete={handleExamComplete}
      />
    );
  }

  return (
    <div id="test_section" className="space-y-6 font-sans pb-10">

      {/* Header & Sub-tabs Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Award className="w-7 h-7 text-emerald-600 animate-spin" style={{ animationDuration: '10s' }} />
            Test Center & Exam Suite
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm font-medium mt-1">
            Attempt chapter mock tests, review full scorecards & track your leaderboard position.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 bg-slate-200/70 backdrop-blur-md rounded-xl border border-slate-300/80 shrink-0 self-start md:self-auto shadow-xs">
          <button
            onClick={() => setTab('available')}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              tab === 'available'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Available Tests ({filteredTests.length})
          </button>

          <button
            onClick={() => setTab('history')}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              tab === 'history'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-700 hover:text-emerald-700'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" /> My Results ({attempts.length})
          </button>

          <button
            onClick={() => setTab('leaderboard')}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              tab === 'leaderboard'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-700 hover:text-amber-700'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" /> Leaderboard
          </button>
        </div>
      </div>

      {/* ══════════ AVAILABLE TESTS ══════════ */}
      {tab === 'available' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          {testTypes.length > 0 && (
            <div className="flex items-center justify-between gap-3 border-b border-slate-200/80 pb-3 flex-wrap">
              <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-emerald-600" /> Filter Test Types
              </span>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1 rounded-md text-xs font-extrabold transition-all cursor-pointer ${
                    filterType === 'all'
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All ({publishedTests.length})
                </button>
                {testTypes.map(type => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type || '')}
                    className={`px-3 py-1 rounded-md text-xs font-extrabold transition-all cursor-pointer capitalize ${
                      filterType === type
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredTests.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-900/10 border border-slate-300/80 backdrop-blur-md space-y-2">
              <FileText className="w-10 h-10 mx-auto text-slate-400 opacity-60" />
              <p className="font-black text-sm text-slate-700">No tests published yet.</p>
              <p className="text-xs text-slate-500 font-medium">Check back later or subscribe to a plan to unlock tests.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredTests.map(test => {
                const tid = (test as any)._id || test.id;
                const latestAttempt = attemptByTestId[tid];
                const eligible = canAttempt(test);
                const attemptCount = attempts.filter(a => getAttemptTestId(a) === tid).length;
                const percentage = latestAttempt ? Math.round((latestAttempt as any).percentage || 0) : null;

                return (
                  <div
                    key={tid}
                    id={`test-card-${tid}`}
                    className="p-5 rounded-2xl border border-slate-300/80 hover:border-emerald-500 bg-slate-900/10 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-5 transition-all shadow-xs hover:shadow-md group relative overflow-hidden"
                  >
                    {/* Icon + Main Details */}
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-700 flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                        {getTypeIcon(test)}
                      </div>

                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-black text-slate-900 tracking-tight">
                            {test.title}
                          </h3>

                          <span className="px-2.5 py-0.5 bg-slate-800 text-white font-mono font-extrabold text-[9px] rounded-md uppercase tracking-wider">
                            {test.testType || 'CHAPTER TEST'}
                          </span>

                          {percentage !== null && (
                            <span className={`px-2 py-0.5 font-mono font-black text-[10px] rounded-md border flex items-center gap-1 uppercase tracking-wider ${
                              percentage >= 70
                                ? "bg-emerald-100 border-emerald-300 text-emerald-800"
                                : percentage >= 40
                                ? "bg-amber-100 border-amber-300 text-amber-900"
                                : "bg-rose-100 border-rose-300 text-rose-800"
                            }`}>
                              📊 Last Score: {percentage}%
                            </span>
                          )}
                        </div>

                        {test.instructions && (
                          <p className="text-xs text-slate-600 font-medium line-clamp-1">
                            {test.instructions}
                          </p>
                        )}

                        {/* Specs row */}
                        <div className="flex flex-wrap gap-4 text-xs font-extrabold text-slate-500 pt-1">
                          <span className="flex items-center gap-1.5 text-slate-700">
                            <Clock className="w-3.5 h-3.5 text-emerald-600" /> {test.duration} mins
                          </span>

                          <span className="flex items-center gap-1.5 text-slate-700">
                            <Award className="w-3.5 h-3.5 text-emerald-600" /> +{test.marksPerQuestion ?? 4} pts / -{test.negativeMarksPerQuestion ?? 1} wrong
                          </span>

                          {test.isDynamic && (
                            <span className="text-blue-600 flex items-center gap-1">
                              <Zap className="w-3.5 h-3.5" /> {test.dynamicTotalQuestions} Qs Random
                            </span>
                          )}

                          {attemptCount > 0 && (
                            <span className="text-slate-500 font-bold">
                              Attempted {attemptCount}x {test.retakeLimit ? `/ ${test.retakeLimit} max` : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2.5 shrink-0">
                      {latestAttempt && (
                        <button
                          id={`view-review-${tid}`}
                          onClick={() => setReviewAttemptId((latestAttempt as any)._id || latestAttempt.id)}
                          className="px-4 py-2.5 bg-slate-200/80 hover:bg-slate-300 text-slate-800 font-black rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View Scorecard
                        </button>
                      )}

                      {!eligible ? (
                        <span className="text-xs font-black text-slate-400 bg-slate-100 border border-slate-300 px-4 py-2.5 rounded-xl">
                          Max Retakes Reached
                        </span>
                      ) : (
                        <button
                          id={`start-exam-${tid}`}
                          onClick={() => setActiveExam(test)}
                          className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md flex items-center gap-1.5 group"
                        >
                          {latestAttempt ? (
                            <>
                              <RotateCcw className="w-3.5 h-3.5" />
                              Retake Exam
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5 fill-white" />
                              Start Exam
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════ MY RESULTS HISTORY ══════════ */}
      {tab === 'history' && (
        <div className="space-y-4">
          {attempts.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-900/10 border border-slate-300/80 backdrop-blur-md space-y-2">
              <CheckCircle className="w-10 h-10 mx-auto text-slate-400 opacity-60" />
              <p className="font-black text-sm text-slate-700">No results recorded yet.</p>
              <p className="text-xs text-slate-500 font-medium">Attempt your first test to see your scorecards and analytics here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {[...attempts].sort((a, b) =>
                new Date(b.submittedAt || '').getTime() - new Date(a.submittedAt || '').getTime()
              ).map(attempt => {
                const aid = (attempt as any)._id || attempt.id;
                const testTitle = (attempt as any).testId?.title || 
                  tests.find(t => ((t as any)._id || t.id) === attempt.testId)?.title ||
                  'Test';
                const score = (attempt as any).score ?? 0;
                const totalMarks = (attempt as any).totalMarks || 0;
                const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : Math.round((attempt as any).percentage || 0);
                const status = (attempt as any).status || 'Completed';
                const isForced = status === 'Force-Submitted';

                return (
                  <div
                    key={aid}
                    onClick={() => setReviewAttemptId(aid)}
                    className="p-4 rounded-2xl border border-slate-300/80 hover:border-emerald-500 bg-slate-900/10 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all cursor-pointer shadow-xs hover:shadow-md group"
                  >
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      {/* Score Badge Ring */}
                      <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 border-2 font-mono font-black text-sm shadow-xs ${
                        percentage >= 70 ? 'border-emerald-500 bg-emerald-500/20 text-emerald-700' :
                        percentage >= 40 ? 'border-amber-500 bg-amber-500/20 text-amber-800' :
                        'border-rose-500 bg-rose-500/20 text-rose-800'
                      }`}>
                        <span>{percentage}%</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-base font-black text-slate-900 line-clamp-1 group-hover:text-emerald-700 transition-colors">
                          {testTitle}
                        </h4>
                        <div className="flex flex-wrap gap-3 mt-1 text-xs font-bold text-slate-500">
                          <span className="text-slate-800">{score} / {totalMarks} marks</span>
                          <span>{new Date(attempt.submittedAt || '').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          {isForced && (
                            <span className="text-rose-600 font-black">⚠ Auto-Submitted</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 justify-between sm:justify-end">
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg border uppercase tracking-wider shrink-0 ${
                        isForced ? 'bg-rose-100 text-rose-800 border-rose-300' :
                        'bg-emerald-100 text-emerald-800 border-emerald-300'
                      }`}>
                        {isForced ? 'Force-Submitted' : 'Completed'}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); setReviewAttemptId(aid); }}
                        className="px-4 py-2 bg-slate-900 group-hover:bg-emerald-600 text-white rounded-xl text-xs font-black transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Review
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════ LEADERBOARD ══════════ */}
      {tab === 'leaderboard' && (
        <div>
          <Leaderboard currentUserId={user.uid} />
        </div>
      )}
    </div>
  );
}
