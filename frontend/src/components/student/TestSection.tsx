import React, { useState, useEffect } from 'react';
import { User, Test, TestAttempt } from '../../types';
import {
  FileText, Clock, Award, Play, CheckCircle, ChevronLeft,
  Zap, Trophy, BookOpen, RefreshCw, Filter, Eye
} from 'lucide-react';
import ExamPage from './ExamPage';
import Leaderboard from './Leaderboard';
import { fetchMyAttempts } from '../../lib/api';

interface TestSectionProps {
  user: User;
  tests: Test[];
  attempts: TestAttempt[];
  onTestSubmitted: (result: any) => void;
}

export default function TestSection({ user, tests, attempts: initialAttempts, onTestSubmitted }: TestSectionProps) {
  const [activeExam, setActiveExam] = useState<Test | null>(null);
  const [reviewAttemptId, setReviewAttemptId] = useState<string | null>(null);
  const [attempts, setAttempts] = useState<TestAttempt[]>(initialAttempts);
  const [tab, setTab] = useState<'available' | 'history' | 'leaderboard'>('available');
  const [filterType, setFilterType] = useState<string>('all');
  const [loadingAttempts, setLoadingAttempts] = useState(false);

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
    const tid = a.testId as string;
    if (!attemptByTestId[tid] || new Date(a.submittedAt || '') > new Date(attemptByTestId[tid].submittedAt || '')) {
      attemptByTestId[tid] = a;
    }
  });

  // Check retake eligibility
  const canAttempt = (test: Test) => {
    const tid = (test as any)._id || test.id;
    const testAttempts = attempts.filter(a => a.testId === tid);
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
        onClose={handleCloseExam}
        onComplete={handleExamComplete}
      />
    );
  }

  return (
    <div id="test_section" className="space-y-6 font-sans">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
          <Award className="w-6 h-6 text-zinc-900" />
          Test Center
        </h1>
        <p className="text-zinc-500 text-sm mt-1">
          Take exams, view scorecards and track your rank on the leaderboard.
        </p>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {(['available', 'history', 'leaderboard'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all capitalize ${
              tab === t
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t === 'available' ? 'Available Tests' : t === 'history' ? 'My Results' : '🏆 Leaderboard'}
          </button>
        ))}
      </div>

      {/* ══════════ AVAILABLE TESTS ══════════ */}
      {tab === 'available' && (
        <div className="space-y-4">
          {/* Filter */}
          {testTypes.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Filter size={14} className="text-slate-400" />
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${filterType === 'all' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-400'}`}
              >
                All
              </button>
              {testTypes.map(type => (
                <button
                  key={type}
                  onClick={() => setFilterType(type || '')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${filterType === type ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-400'}`}
                >
                  {type}
                </button>
              ))}
            </div>
          )}

          {filteredTests.length === 0 ? (
            <div className="text-center py-16 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <FileText size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-bold">No tests published yet.</p>
              <p className="text-xs mt-1">Check back later or contact your admin.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredTests.map(test => {
                const tid = (test as any)._id || test.id;
                const latestAttempt = attemptByTestId[tid];
                const eligible = canAttempt(test);
                const attemptCount = attempts.filter(a => a.testId === tid).length;

                return (
                  <div
                    key={tid}
                    id={`test-card-${tid}`}
                    className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col md:flex-row md:items-center gap-4 hover:border-slate-300 hover:shadow-sm transition-all"
                  >
                    {/* Icon + Info */}
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-0.5">{getTypeIcon(test)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h4 className="font-bold text-slate-800">{test.title}</h4>
                          <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full uppercase">
                            {test.testType}
                          </span>
                          {latestAttempt && (
                            <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                              Last: {Math.round((latestAttempt as any).percentage || 0)}%
                            </span>
                          )}
                        </div>
                        {test.instructions && (
                          <p className="text-xs text-slate-500 line-clamp-1 mb-2">{test.instructions}</p>
                        )}
                        <div className="flex flex-wrap gap-3 text-[11px] text-slate-500 font-medium">
                          <span className="flex items-center gap-1"><Clock size={11} /> {test.duration} min</span>
                          <span className="flex items-center gap-1"><Award size={11} /> {test.marksPerQuestion ?? 4} pts/Q · -{test.negativeMarksPerQuestion ?? 1} wrong</span>
                          {test.isDynamic && <span className="text-blue-500">⚡ {test.dynamicTotalQuestions}Q random</span>}
                          {test.isFullSyllabus && <span className="text-yellow-600">🏆 Grand Test</span>}
                          {attemptCount > 0 && (
                            <span className="text-slate-400">
                              Attempted {attemptCount}x
                              {test.retakeLimit ? ` / ${test.retakeLimit} max` : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!eligible ? (
                        <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg">
                          Max Retakes Reached
                        </span>
                      ) : (
                        <button
                          id={`start-exam-${tid}`}
                          onClick={() => setActiveExam(test)}
                          className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all"
                        >
                          <Play size={13} className="fill-white" />
                          {latestAttempt ? 'Retake' : 'Start Exam'}
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
            <div className="text-center py-16 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <CheckCircle size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-bold">No results yet.</p>
              <p className="text-xs mt-1">Take your first test to see your scorecard here!</p>
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
                    className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      {/* Score Circle */}
                      <div className={`w-14 h-14 rounded-full flex flex-col items-center justify-center flex-shrink-0 border-2 ${
                        percentage >= 70 ? 'border-emerald-400 bg-emerald-50 text-emerald-700' :
                        percentage >= 40 ? 'border-amber-400 bg-amber-50 text-amber-700' :
                        'border-red-400 bg-red-50 text-red-700'
                      }`}>
                        <span className="font-black text-sm">{percentage}%</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-800 text-sm line-clamp-1 group-hover:text-emerald-600 transition-colors">{testTitle}</h4>
                        <div className="flex flex-wrap gap-3 mt-1 text-[11px] text-slate-500">
                          <span className="font-bold text-slate-700">{score} / {totalMarks} marks</span>
                          <span>{new Date(attempt.submittedAt || '').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          {isForced && (
                            <span className="text-red-500 font-bold">⚠ Auto-Submitted</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 justify-between sm:justify-end">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${
                        isForced ? 'bg-red-50 text-red-600 border-red-200' :
                        'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {isForced ? 'Force-Submitted' : 'Completed'}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); setReviewAttemptId(aid); }}
                        className="px-3.5 py-1.5 bg-slate-900 group-hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
                      >
                        <Eye size={14} /> View Review
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
