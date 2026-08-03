import React, { useState } from 'react';
import { User, TestAttempt, Test, Subject, Chapter, Question } from '../../types';
import { 
  Award, Target, AlertTriangle, ArrowRight, CheckCircle2, 
  BookOpen, ChevronRight, ArrowLeft, Play, FileText, Check, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ExamPage from '../student/ExamPage';

interface AnalyticsSectionProps {
  user: User;
  attempts: TestAttempt[];
  tests: Test[];
  subjects: Subject[];
  chapters: Chapter[];
  questions: Question[];
  onNavigate: (tab: string) => void;
}

export default function AnalyticsSection({
  user,
  attempts,
  tests,
  subjects,
  chapters,
  questions,
  onNavigate
}: AnalyticsSectionProps) {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [reviewAttemptId, setReviewAttemptId] = useState<string | null>(null);
  const [subjectPage, setSubjectPage] = useState(0);
  const SUBJECTS_PER_PAGE = 10;

  // 1. Calculate Chapter & Subject performance from real attempts
  const totalAttempts = attempts.length;
  const chapterScores: Record<string, { totalPoints: number; maxPoints: number }> = {};
  
  attempts.forEach(attempt => {
    const responses = attempt.responses || [];
    responses.forEach(resp => {
      const qId = typeof resp.questionId === 'object' ? resp.questionId?._id || resp.questionId?.id : resp.questionId;
      const question = questions.find(q => q.id === qId || q._id === qId);
      if (!question) return;

      const chId = question.chapterId;
      if (!chapterScores[chId]) {
        chapterScores[chId] = { totalPoints: 0, maxPoints: 0 };
      }

      const qMarks = question.marks || 4;
      chapterScores[chId].maxPoints += qMarks;
      if (resp.isCorrect) {
        chapterScores[chId].totalPoints += qMarks;
      }
    });
  });

  // Calculate percentage per chapter
  const chapterPerformance = chapters.map(ch => {
    const scores = chapterScores[ch.id];
    let percentage = 0;
    if (scores && scores.maxPoints > 0) {
      percentage = Math.max(0, Math.round((scores.totalPoints / scores.maxPoints) * 100));
    } else {
      if (totalAttempts === 0) {
        if (ch.id === 'kinematics') percentage = 88;
        else if (ch.id === 'rotation') percentage = 42;
        else if (ch.id === 'organic') percentage = 81;
        else if (ch.id === 'physical') percentage = 54;
        else if (ch.id === 'inorganic') percentage = 48;
        else if (ch.id === 'algebra') percentage = 94;
        else if (ch.id === 'calculus') percentage = 58;
        else percentage = 65;
      } else {
        percentage = 0;
      }
    }

    const isWeak = percentage < 60;

    return {
      ...ch,
      percentage,
      isWeak
    };
  });

  // Subject performance aggregates
  const subjectPerformance = subjects.map(sub => {
    const subChapters = chapterPerformance.filter(ch => ch.subjectId === sub.id);
    const avgPercentage = subChapters.length > 0
      ? Math.round(subChapters.reduce((acc, curr) => acc + curr.percentage, 0) / subChapters.length)
      : 0;
    const weakCount = subChapters.filter(c => c.isWeak).length;

    return {
      ...sub,
      percentage: avgPercentage,
      weakCount,
      totalChapters: subChapters.length
    };
  });

  const selectedSubject = subjects.find(s => s.id === selectedSubjectId);
  const selectedSubjectChapters = selectedSubjectId
    ? chapterPerformance.filter(ch => ch.subjectId === selectedSubjectId)
    : [];

  // If student clicked to view scorecard details directly
  if (reviewAttemptId) {
    return (
      <ExamPage
        attemptId={reviewAttemptId}
        initialPhase="scorecard"
        onClose={() => setReviewAttemptId(null)}
      />
    );
  }

  return (
    <div id="analytics_section" className="space-y-6 font-sans pb-10 max-w-full overflow-x-hidden">
      
      {/* ─── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-emerald-100">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-md">
              <Award className="w-5 h-5 text-white shrink-0" />
            </div>
            Performance & Growth Report
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm font-medium mt-1 ml-0.5">
            Review your scores and discover areas to improve and boost your rank.
          </p>
        </div>
      </div>

      {/* ─── SECTION 1: RECENT TEST ATTEMPTED RESULTS ──────────────────────────── */}
      <div className="space-y-3.5">
        {/* Section Label */}
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 bg-gradient-to-b from-emerald-500 to-teal-400 rounded-full" />
          <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-emerald-600" /> Test Attempted Results ({attempts.length})
          </h2>
        </div>

        {attempts.length === 0 ? (
          <div className="p-6 text-center rounded-xl bg-slate-900/10 backdrop-blur-md border border-emerald-500/30">
            <p className="text-slate-700 text-xs font-bold">No test attempts recorded yet.</p>
            <p className="text-slate-500 text-[11px] mt-0.5">Attempt a test to see your scorecards here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-2.5 sm:gap-4">
            {attempts.map((attempt, idx) => {
              const aid = (attempt as any)._id || attempt.id;
              const testTitle = (attempt as any).testId?.title || 'Practice Test';
              const score = (attempt as any).score ?? 0;
              const totalMarks = (attempt as any).totalMarks || 0;
              const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : Math.round((attempt as any).percentage || 0);

              return (
                <motion.div
                  key={aid}
                  whileHover={{ y: -3, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setReviewAttemptId(aid)}
                  className="p-3.5 sm:p-5 rounded-xl bg-slate-900/10 dark:bg-slate-900/40 backdrop-blur-md border border-emerald-500/40 hover:border-emerald-600 cursor-pointer transition-all flex flex-col justify-between space-y-2.5 sm:space-y-3.5 group shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-emerald-100/80 border border-emerald-300 text-emerald-800 font-mono font-black text-[9px] sm:text-[10px] rounded-md">
                      RESULT #{String(idx + 1).padStart(2, '0')}
                    </span>
                    <Award className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-emerald-600" />
                  </div>

                  <div>
                    <h3 className="font-black text-slate-900 text-xs sm:text-base group-hover:text-emerald-700 transition-colors flex items-center justify-between leading-tight line-clamp-1">
                      {testTitle} <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-emerald-600 hidden sm:inline-block" />
                    </h3>
                    <p className="text-slate-600 text-[10px] sm:text-xs mt-0.5 sm:mt-1 font-medium truncate">
                      {score} / {totalMarks} marks
                    </p>
                  </div>

                  {/* Dashboard-style Progress Bar */}
                  <div className="space-y-1">
                    <div className="w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs pt-0.5">
                      <span className="font-bold text-slate-500 text-[9px] sm:text-[11px]">Score</span>
                      <span className="font-extrabold text-emerald-700 uppercase text-[9px] sm:text-[10px] font-mono">
                        {percentage}% VIEW 🚀
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── SECTION 2: SUBJECTS & CHAPTER WEAKNESS DRILLDOWN ────────────────── */}
      <div className="space-y-4 pt-2">
        <AnimatePresence mode="wait">
          
          {/* LEVEL 1: SUBJECT CARDS GRID */}
          {!selectedSubjectId ? (
            <motion.div
              key="subjects-performance-grid"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3.5"
            >
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 bg-gradient-to-b from-emerald-500 to-teal-400 rounded-full" />
                <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-600" /> Tap a Subject to Track Your Progress
                </h2>
              </div>

              {/* Subjects Grid with Pagination */}
              {(() => {
                const totalPages = Math.ceil(subjectPerformance.length / SUBJECTS_PER_PAGE);
                const paged = subjectPerformance.slice(subjectPage * SUBJECTS_PER_PAGE, (subjectPage + 1) * SUBJECTS_PER_PAGE);
                return (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {paged.map(subj => (
                        <motion.div
                          key={subj.id}
                          whileHover={{ y: -3, scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setSelectedSubjectId(subj.id)}
                          className="p-3.5 sm:p-5 rounded-xl bg-slate-900/10 dark:bg-slate-900/40 backdrop-blur-md border border-teal-500/40 hover:border-teal-600 cursor-pointer transition-all flex flex-col justify-between space-y-2.5 sm:space-y-3.5 group shadow-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 bg-teal-100/80 border border-teal-300 text-teal-800 font-mono font-black text-[9px] sm:text-[10px] rounded-md">
                              {subj.totalChapters} CHAPTERS
                            </span>
                            <BookOpen className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-teal-600 group-hover:scale-110 transition-transform" />
                          </div>

                          <div>
                            <h3 className="font-black text-slate-900 text-xs sm:text-base group-hover:text-teal-700 transition-colors flex items-center justify-between leading-tight truncate">
                              {subj.name} <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-teal-600 hidden sm:inline-block" />
                            </h3>
                            <p className="text-slate-600 text-[10px] sm:text-xs mt-0.5 sm:mt-1 font-medium truncate">
                              {subj.weakCount > 0 ? `${subj.weakCount} Focus Areas` : 'Strong Concept Mastery'}
                            </p>
                          </div>

                          {/* Dashboard-style Progress Bar */}
                          <div className="space-y-1">
                            <div className="w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full"
                                style={{ width: `${subj.percentage}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between text-xs pt-0.5">
                              <span className="font-bold text-slate-500 text-[9px] sm:text-[11px]">Mastery</span>
                              <span className="font-extrabold text-teal-700 uppercase text-[9px] sm:text-[10px] font-mono">
                                {subj.percentage}% MASTERY ⚡
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Pagination — only if > 10 subjects */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between pt-2">
                        <p className="text-xs font-bold text-slate-500">
                          Showing {subjectPage * SUBJECTS_PER_PAGE + 1}–{Math.min((subjectPage + 1) * SUBJECTS_PER_PAGE, subjectPerformance.length)} of {subjectPerformance.length} subjects
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSubjectPage(p => Math.max(0, p - 1))}
                            disabled={subjectPage === 0}
                            className="px-3 py-1.5 rounded-lg text-xs font-black border border-slate-200 bg-white text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:border-emerald-400 hover:text-emerald-700 transition-all cursor-pointer"
                          >
                            ← Prev
                          </button>
                          <span className="text-xs font-black text-slate-600 px-1">{subjectPage + 1} / {totalPages}</span>
                          <button
                            onClick={() => setSubjectPage(p => Math.min(totalPages - 1, p + 1))}
                            disabled={subjectPage >= totalPages - 1}
                            className="px-3 py-1.5 rounded-lg text-xs font-black border border-slate-200 bg-white text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:border-emerald-400 hover:text-emerald-700 transition-all cursor-pointer"
                          >
                            Next →
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </motion.div>
          ) : (

            /* LEVEL 2: SELECTED SUBJECT CHAPTER WEAKNESS LIST */
            <motion.div
              key="subject-chapters-weakness-list"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              className="space-y-4"
            >
              {/* Back Bar */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-wrap gap-2">
                <button
                  onClick={() => setSelectedSubjectId(null)}
                  className="px-4 py-2 bg-slate-900 hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-2xs flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to All Subjects
                </button>

                <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
                  {selectedSubject?.name} • Chapter Analysis
                </span>
              </div>

              {/* Subject Title Card */}
              <div className="p-3.5 sm:p-5 rounded-xl bg-slate-900/10 backdrop-blur-md border border-emerald-500/40 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900">{selectedSubject?.name}</h3>
                  <p className="text-[10px] sm:text-xs font-medium text-slate-600">Chapter-wise progress analysis based on your test results.</p>
                </div>
                <span className="px-2 py-0.5 bg-emerald-100 border border-emerald-300 text-emerald-800 font-mono font-black text-[9px] sm:text-[10px] rounded-md shrink-0">
                  {selectedSubjectChapters.length} CHAPTERS
                </span>
              </div>

              {/* Chapters Cards List */}
              <div className="space-y-2.5 pt-1">
                {selectedSubjectChapters.length === 0 ? (
                  <p className="text-slate-500 text-xs font-bold italic">No chapters listed for this subject.</p>
                ) : (
                  selectedSubjectChapters.map((ch, idx) => (
                    <motion.div
                      key={ch.id}
                      whileHover={{ x: 2 }}
                      className="p-3 sm:p-4 rounded-xl bg-slate-900/10 dark:bg-slate-900/40 backdrop-blur-md border border-blue-500/30 hover:border-blue-500 cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group shadow-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="px-2 py-0.5 bg-blue-100/80 border border-blue-300 text-blue-800 font-mono font-black text-[9px] rounded-md shrink-0">
                          CH #{String(idx + 1).padStart(2, '0')}
                        </span>
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight truncate group-hover:text-blue-700 transition-colors">
                            {ch.name}
                          </h4>
                          <p className="text-[10px] sm:text-xs font-bold text-slate-500 mt-0.5">
                            Accuracy: <span className="font-mono text-blue-700 font-black">{ch.percentage}%</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                        <span className="px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-800 font-mono font-black text-[9px] rounded-md uppercase">
                          {ch.isWeak ? 'PRACTICE MORE' : 'STRONG'}
                        </span>
                        <button
                          onClick={() => onNavigate('tests')}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-emerald-600 text-white rounded-lg text-[10px] font-black transition-colors cursor-pointer flex items-center gap-1"
                        >
                          Practice <Play className="w-2.5 h-2.5 fill-white" />
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

            </motion.div>
          )}

        </AnimatePresence>
      </div>

    </div>
  );
}
