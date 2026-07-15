import React, { useState } from 'react';
import { User, TestAttempt, Test, Subject, Chapter, Question } from '../types';
import { 
  Sparkles, Award, Target, Clock, ArrowUpRight, TrendingUp, CheckCircle, 
  HelpCircle, ChevronRight, BookOpen, AlertTriangle, BookMarked, HelpCircle as HelpIcon
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

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
  const [completedRecommendations, setCompletedRecommendations] = useState<Record<string, boolean>>({});

  // 1. Core Analytics Calculation
  const totalAttempts = attempts.length;

  // Initialize aggregated performance values
  // Mappings of ChapterID -> Array of scores achieved in questions belonging to this chapter
  const chapterScores: Record<string, { totalPoints: number; maxPoints: number }> = {};
  
  // Group attempts to calculate progress
  attempts.forEach(attempt => {
    const test = tests.find(t => t.id === attempt.testId);
    if (!test) return;

    // Check answers of the test
    test.questionIds.forEach(qId => {
      const question = questions.find(q => q.id === qId);
      if (!question) return;

      const chId = question.chapterId;
      if (!chapterScores[chId]) {
        chapterScores[chId] = { totalPoints: 0, maxPoints: 0 };
      }

      const selectedIndex = attempt.answers[qId];
      // Max score of this question
      chapterScores[chId].maxPoints += question.marks;
      
      if (selectedIndex === question.correctAnswerIndex) {
        // Correct
        chapterScores[chId].totalPoints += question.marks;
      } else if (selectedIndex !== undefined && selectedIndex !== -1) {
        // Wrong (apply negative marking if test has negative marking enabled)
        if (test.negativeMarking) {
          chapterScores[chId].totalPoints -= question.negativeMarks;
        }
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
      // Default placeholder if they haven't taken any questions for this chapter
      // We assign a default baseline based on default attempts, or 0 if none
      if (totalAttempts === 0) {
        // Mock baseline to populate visual charts if they have no attempts yet
        if (ch.id === 'kinematics') percentage = 90;
        else if (ch.id === 'rotation') percentage = 42;
        else if (ch.id === 'organic') percentage = 81;
        else if (ch.id === 'physical') percentage = 77;
        else if (ch.id === 'inorganic') percentage = 55;
        else if (ch.id === 'algebra') percentage = 94;
        else if (ch.id === 'calculus') percentage = 61;
      } else {
        percentage = 0;
      }
    }

    // Mastery classification
    let status: 'Mastered' | 'Good' | 'Needs Practice' | 'Weak' = 'Weak';
    let colorClass = 'text-red-700 bg-red-50 border-red-200';
    if (percentage >= 85) {
      status = 'Mastered';
      colorClass = 'text-emerald-700 bg-emerald-50 border-emerald-200';
    } else if (percentage >= 70) {
      status = 'Good';
      colorClass = 'text-blue-700 bg-blue-50 border-blue-200';
    } else if (percentage >= 50) {
      status = 'Needs Practice';
      colorClass = 'text-amber-700 bg-amber-50 border-amber-200';
    }

    return {
      ...ch,
      percentage,
      status,
      colorClass
    };
  });

  // Subject performance aggregates
  const subjectPerformance = subjects.map(sub => {
    const subChapters = chapterPerformance.filter(ch => ch.subjectId === sub.id);
    const avgPercentage = subChapters.length > 0
      ? Math.round(subChapters.reduce((acc, curr) => acc + curr.percentage, 0) / subChapters.length)
      : 0;

    return {
      ...sub,
      percentage: avgPercentage
    };
  });

  // 2. Generate Smart Recommendations based on Chapter Performance
  const recommendations: { id: string; type: 'revision' | 'practice' | 'notes'; title: string; desc: string; chapterId: string }[] = [];
  
  chapterPerformance.forEach(ch => {
    if (ch.percentage < 50) {
      recommendations.push({
        id: `rec-revise-${ch.id}`,
        type: 'revision',
        title: `Revise ${ch.name}`,
        desc: `Your current mastery is only ${ch.percentage}%. Revise the foundational formulas and derivations.`,
        chapterId: ch.id
      });
    } else if (ch.percentage < 70) {
      recommendations.push({
        id: `rec-practice-${ch.id}`,
        type: 'practice',
        title: `Attempt Practice Test on ${ch.name}`,
        desc: `Solve 15-20 hard MCQs to boost accuracy above 75%.`,
        chapterId: ch.id
      });
    } else if (ch.percentage < 85) {
      recommendations.push({
        id: `rec-notes-${ch.id}`,
        type: 'notes',
        title: `Read ${ch.name} Reference Notes`,
        desc: `Go over the quick revision notes and edge-case exceptions.`,
        chapterId: ch.id
      });
    }
  });

  // Limit recommendations to 4 for clean layout
  const activeRecommendations = recommendations.slice(0, 4);

  // Format Recharts data
  const chartData = subjectPerformance.map(sp => ({
    subject: sp.name,
    Score: sp.percentage
  }));

  const handleToggleRec = (id: string) => {
    setCompletedRecommendations(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div id="analytics_section" className="space-y-6">
      
      {/* Header Info */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-emerald-500 fill-emerald-100" />
          Academic Performance Analytics
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Detailed dynamic breakdown of your strengths, weaknesses, and personalized recommendations.
        </p>
      </div>

      {/* Aggregate Score Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-400 text-xs font-semibold uppercase block">Overall Mastery</span>
            <span className="text-2xl font-bold text-slate-800 font-mono">
              {subjectPerformance.length > 0 
                ? Math.round(subjectPerformance.reduce((acc, curr) => acc + curr.percentage, 0) / subjectPerformance.length)
                : 0}%
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-400 text-xs font-semibold uppercase block">Avg Accuracy</span>
            <span className="text-2xl font-bold text-slate-800 font-mono">
              {attempts.length > 0 
                ? Math.round(attempts.reduce((acc, curr) => acc + curr.accuracy, 0) / attempts.length)
                : 74}%
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-400 text-xs font-semibold uppercase block">Avg Time Per Q</span>
            <span className="text-2xl font-bold text-slate-800 font-mono">48s</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-400 text-xs font-semibold uppercase block">Improvement Rate</span>
            <span className="text-2xl font-bold text-emerald-600 font-mono">+12.4%</span>
          </div>
        </div>
      </div>

      {/* Recharts Grid and Smart AI Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recharts Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <h3 className="font-bold text-slate-800 text-base mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            Subject Wise Summary
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="subject" stroke="#94a3b8" tickLine={false} fontSize={12} />
                <YAxis stroke="#94a3b8" tickLine={false} fontSize={12} domain={[0, 100]} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ background: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff' }}
                />
                <Bar dataKey="Score" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Personalized Recommendations */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-base mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-500 fill-emerald-100" />
              AI Recommendations
            </h3>
            <p className="text-slate-400 text-xs mb-4">
              Real-time actionable checkpoints compiled from your test results:
            </p>

            <div className="space-y-3">
              {activeRecommendations.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs leading-relaxed">
                  <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  No alerts! Keep up the brilliant study consistency to maintain high ranks.
                </div>
              ) : (
                activeRecommendations.map(rec => {
                  const completed = completedRecommendations[rec.id];
                  return (
                    <div 
                      key={rec.id} 
                      onClick={() => handleToggleRec(rec.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex gap-3 items-start ${
                        completed 
                          ? 'bg-slate-50 border-slate-200 opacity-60' 
                          : rec.type === 'revision' 
                            ? 'bg-red-50/50 border-red-100 hover:border-red-200' 
                            : 'bg-emerald-50/50 border-emerald-100 hover:border-emerald-200'
                      }`}
                    >
                      <input 
                        type="checkbox" 
                        checked={!!completed}
                        onChange={() => {}} // toggled on div click
                        className="mt-1 accent-emerald-600 cursor-pointer rounded" 
                      />
                      <div className="space-y-0.5">
                        <span className={`text-xs font-bold block ${completed ? 'line-through text-slate-500' : 'text-slate-800'}`}>
                          {rec.title}
                        </span>
                        <p className="text-[11px] text-slate-500 leading-normal">{rec.desc}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-50 flex gap-2">
            <button 
              onClick={() => onNavigate('study_materials')}
              className="flex-1 py-2 text-center bg-slate-50 hover:bg-slate-100 rounded-xl text-[11px] font-semibold text-slate-600 transition-all border border-slate-100 cursor-pointer"
            >
              Study Notes
            </button>
            <button 
              onClick={() => onNavigate('tests')}
              className="flex-1 py-2 text-center bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[11px] font-semibold transition-all cursor-pointer"
            >
              Attempt Tests
            </button>
          </div>
        </div>

      </div>

      {/* Chapters Mastery Matrix */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <h3 className="font-bold text-slate-800 text-base mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-emerald-600" />
          Chapter Wise Mastery Details
        </h3>

        <div className="space-y-6">
          {subjects.map(subj => {
            const subChapters = chapterPerformance.filter(ch => ch.subjectId === subj.id);
            if (subChapters.length === 0) return null;

            return (
              <div key={subj.id} className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{subj.name}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {subChapters.map(ch => (
                    <div key={ch.id} className="p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-all bg-slate-50/30">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="font-semibold text-slate-800 text-sm">{ch.name}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${ch.colorClass}`}>
                          {ch.status}
                        </span>
                      </div>
                      
                      {/* Progress bar */}
                      <div className="relative pt-1 flex items-center gap-3">
                        <div className="overflow-hidden h-2 text-xs flex rounded-full bg-slate-100 flex-grow">
                          <div 
                            style={{ width: `${ch.percentage}%` }} 
                            className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center rounded-full transition-all duration-500 ${
                              ch.status === 'Mastered' 
                                ? 'bg-emerald-500' 
                                : ch.status === 'Good' 
                                  ? 'bg-blue-500' 
                                  : ch.status === 'Needs Practice' 
                                    ? 'bg-amber-500' 
                                    : 'bg-red-500'
                            }`}
                          ></div>
                        </div>
                        <span className="text-xs font-mono font-bold text-slate-500 shrink-0 min-w-[28px] text-right">
                          {ch.percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
