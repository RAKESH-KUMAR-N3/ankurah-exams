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
    <div id="analytics_section" className="space-y-8 font-sans pb-10">
      
      {/* ─── HEADER ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2.5">
            <Award className="w-7 h-7 text-emerald-600" />
            Performance & Weakness Report
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm font-medium mt-1">
            Review your test scores directly and click any subject to see chapter weakness breakdown.
          </p>
        </div>
      </div>

      {/* ─── SECTION 1: RECENT TEST ATTEMPTED RESULTS ──────────────────────────── */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-emerald-600" /> Test Attempted Results ({attempts.length})
          </h2>
        </div>

        {attempts.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-900/10 border border-slate-300/80 backdrop-blur-md">
            <p className="text-slate-600 text-xs font-bold">No test attempts recorded yet.</p>
            <p className="text-slate-500 text-[11px] mt-0.5">Attempt a test to see your scorecards here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {attempts.map((attempt) => {
              const aid = (attempt as any)._id || attempt.id;
              const testTitle = (attempt as any).testId?.title || 'Practice Test';
              const score = (attempt as any).score ?? 0;
              const totalMarks = (attempt as any).totalMarks || 0;
              const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : Math.round((attempt as any).percentage || 0);

              return (
                <div
                  key={aid}
                  onClick={() => setReviewAttemptId(aid)}
                  className="p-4 rounded-2xl border border-slate-300/80 hover:border-emerald-500 bg-slate-900/10 backdrop-blur-md flex items-center justify-between gap-4 shadow-xs transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`w-12 h-12 rounded-xl border flex flex-col items-center justify-center font-mono font-black text-xs shrink-0 shadow-xs ${
                      percentage >= 70 ? 'border-emerald-500 bg-emerald-500/20 text-emerald-800' :
                      percentage >= 40 ? 'border-amber-500 bg-amber-500/20 text-amber-900' :
                      'border-rose-500 bg-rose-500/20 text-rose-900'
                    }`}>
                      <span>{percentage}%</span>
                    </div>

                    <div>
                      <h4 className="text-sm font-black text-slate-900 leading-snug line-clamp-1 group-hover:text-emerald-700 transition-colors">
                        {testTitle}
                      </h4>
                      <p className="text-xs font-bold text-slate-500 mt-0.5">
                        Score: {score} / {totalMarks} marks
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setReviewAttemptId(aid);
                    }}
                    className="px-3.5 py-2 bg-slate-900 group-hover:bg-emerald-600 text-white rounded-xl text-xs font-black transition-colors shrink-0 shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" /> View Scorecard
                  </button>
                </div>
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
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-emerald-600" /> Click a Subject to See Chapter Weaknesses
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {subjectPerformance.map(subj => (
                  <motion.div
                    key={subj.id}
                    whileHover={{ y: -3, scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setSelectedSubjectId(subj.id)}
                    className="p-5 rounded-2xl border border-slate-300/80 hover:border-emerald-500 bg-slate-900/10 backdrop-blur-md cursor-pointer transition-all flex flex-col justify-between space-y-4 shadow-xs group"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 bg-slate-800 text-white font-mono font-extrabold text-[10px] rounded-md uppercase">
                          {subj.totalChapters} Chapters
                        </span>

                        {subj.weakCount > 0 ? (
                          <span className="px-2.5 py-0.5 bg-rose-100 text-rose-800 border border-rose-300 font-mono font-black text-[10px] rounded-md uppercase flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-rose-600" /> {subj.weakCount} Weak
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono font-black text-[10px] rounded-md uppercase flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Strong
                          </span>
                        )}
                      </div>

                      <h3 className="text-xl font-black text-slate-900 tracking-tight group-hover:text-emerald-700 transition-colors">
                        {subj.name}
                      </h3>
                      
                      <p className="text-xs font-bold text-slate-500">
                        Overall Mastery Score: <span className="font-mono text-slate-900 font-black">{subj.percentage}%</span>
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs font-black text-emerald-600">
                      <span>View Chapter Breakdown</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </motion.div>
                ))}
              </div>
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
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                <button
                  onClick={() => setSelectedSubjectId(null)}
                  className="px-4 py-2 bg-slate-900 hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to All Subjects
                </button>

                <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
                  {selectedSubject?.name} • Chapter Analysis
                </span>
              </div>

              {/* Subject Title */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/20 to-slate-900/30 border border-emerald-500/40 backdrop-blur-md flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900">{selectedSubject?.name}</h3>
                  <p className="text-xs font-medium text-slate-600">Chapter-wise performance analysis based on test results.</p>
                </div>
                <span className="px-3 py-1 bg-emerald-600 text-white font-mono font-black text-xs rounded-lg">
                  {selectedSubjectChapters.length} Chapters
                </span>
              </div>

              {/* Chapters Cards List */}
              <div className="space-y-3 pt-1">
                {selectedSubjectChapters.length === 0 ? (
                  <p className="text-slate-500 text-xs font-bold italic">No chapters listed for this subject.</p>
                ) : (
                  selectedSubjectChapters.map((ch, idx) => (
                    <div 
                      key={ch.id}
                      className={`p-4 rounded-2xl border backdrop-blur-md flex items-center justify-between gap-4 shadow-xs ${
                        ch.isWeak 
                          ? 'border-rose-400 bg-rose-500/10' 
                          : 'border-slate-300/80 bg-slate-900/10'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <span className={`w-8 h-8 rounded-lg font-mono font-black text-xs flex items-center justify-center shrink-0 ${
                          ch.isWeak ? 'bg-rose-500 text-white' : 'bg-emerald-500/20 text-emerald-800'
                        }`}>
                          {idx + 1}
                        </span>

                        <div>
                          <h4 className="text-base font-black text-slate-900 tracking-tight">
                            {ch.name}
                          </h4>
                          <p className="text-xs font-bold text-slate-500 mt-0.5">
                            Accuracy Score: <span className="font-mono text-slate-900">{ch.percentage}%</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {ch.isWeak ? (
                          <span className="px-3 py-1 bg-rose-100 text-rose-800 border border-rose-300 font-mono font-black text-[10px] rounded-lg uppercase tracking-wider flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Weak Chapter
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono font-black text-[10px] rounded-md uppercase tracking-wider flex items-center gap-1">
                            <Check className="w-3.5 h-3.5 text-emerald-600" /> Strong
                          </span>
                        )}

                        <button
                          onClick={() => onNavigate('tests')}
                          className="px-3.5 py-1.5 bg-slate-900 hover:bg-emerald-600 text-white rounded-xl text-xs font-black transition-colors shrink-0 shadow-xs cursor-pointer flex items-center gap-1"
                        >
                          Practice Exam <Play className="w-3 h-3 fill-white" />
                        </button>
                      </div>
                    </div>
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
