import React, { useState, useMemo } from 'react';
import { User, Timetable, Subject, Chapter, Test } from '../../types';
import { 
  Calendar, BookOpen, Clock, Award, ChevronDown, ChevronRight, 
  Sparkles, CheckCircle2, Flame, Layers, ArrowRight, Shield, PlayCircle, History,
  FileText, File, Image as ImageIcon, Paperclip, ExternalLink
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface TimetableSectionProps {
  user: User;
  timetables: Timetable[];
  subjects: Subject[];
  chapters: Chapter[];
  availableTests?: Test[];
  onAttemptTest?: (test: Test) => void;
}

export default function TimetableSection({
  user,
  timetables,
  subjects,
  chapters,
  availableTests = [],
  onAttemptTest
}: TimetableSectionProps) {
  const [expandedBacklogs, setExpandedBacklogs] = useState<Record<string, boolean>>({});

  // Determine user's course names & IDs
  // Backend already returns timetables filtered for this student's purchased plans.
  // Just sort by weekNumber ascending (Week 1, Week 2, Week 3...)
  const courseTimetables = useMemo(() => {
    return [...timetables].sort((a: any, b: any) => (a.weekNumber || 1) - (b.weekNumber || 1));
  }, [timetables]);


  // Identify Current Active Week vs Previous Weeks vs Future Weeks
  const todayStr = new Date().toISOString().split('T')[0];

  const { currentWeek, previousWeeks, upcomingWeeks } = useMemo(() => {
    if (courseTimetables.length === 0) {
      return { currentWeek: null, previousWeeks: [], upcomingWeeks: [] };
    }

    // Find week matching today's date range, or fallback to latest week
    let active = courseTimetables.find(t => {
      if (!t.startDate || !t.endDate) return false;
      return todayStr >= t.startDate && todayStr <= t.endDate;
    });

    if (!active) {
      active = courseTimetables[courseTimetables.length - 1]; // Fallback to latest
    }

    const prev = courseTimetables.filter(t => (t._id || t.id) !== (active?._id || active?.id) && (t.weekNumber || 1) < (active?.weekNumber || 1));
    const upcoming = courseTimetables.filter(t => (t._id || t.id) !== (active?._id || active?.id) && (t.weekNumber || 1) > (active?.weekNumber || 1));

    return { currentWeek: active, previousWeeks: prev, upcomingWeeks: upcoming };
  }, [courseTimetables, todayStr]);

  // Track expanded weeks (timetableId -> boolean)
  const [expandedWeeks, setExpandedWeeks] = useState<Record<string, boolean>>({});

  const toggleWeekExpand = (id: string) => {
    setExpandedWeeks(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Find linked test object for a timetable schedule
  const getTimetableTest = (t: Timetable) => {
    if (!t.weekendExamId) return null;
    return availableTests.find((test: any) => String(test.id || test._id) === String(t.weekendExamId));
  };

  return (
    <div id="timetable_section" className="space-y-6 font-sans">
      
      {/* ── HEADER TITLE & COURSE BADGE ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 font-mono font-black text-xs uppercase tracking-widest mb-1">
            <Sparkles className="w-4 h-4" /> Academic Study Roadmap
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase flex items-center gap-2">
            <Calendar className="w-7 h-7 text-emerald-400" />
            Your Course Timetable
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1 font-bold">
            Weekly subject-wise chapter goals and weekend exams tailored to your enrolled plan.
          </p>
        </div>

        {user.purchasedPlans && user.purchasedPlans.length > 0 && (
          <div className="px-3.5 py-2 bg-slate-950 border border-emerald-500/40 text-emerald-300 text-xs font-black uppercase tracking-wider rounded-none shrink-0 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            Enrolled Course Active
          </div>
        )}
      </div>

      {courseTimetables.length === 0 ? (
        <div className="bg-slate-950 rounded-none border border-slate-800 p-12 text-center shadow-2xl space-y-3">
          <Calendar className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="font-black text-white text-base uppercase">No Timetable Schedules Published Yet</h3>
          <p className="text-slate-400 text-xs max-w-md mx-auto font-bold leading-relaxed">
            Your course academic schedules will appear here once published by your course administrators. Check back soon!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-mono font-black text-slate-400 uppercase tracking-widest">
              Weekly Timetable Schedules ({courseTimetables.length})
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase">
              Click any week to view subject & chapter details
            </span>
          </div>

          {courseTimetables.map((t: Timetable) => {
            const tId = t._id || t.id;
            const isActive = currentWeek && (currentWeek._id || currentWeek.id) === tId;
            // Active week default open unless toggled off
            const isExpanded = expandedWeeks[tId] ?? isActive;

            return (
              <div 
                key={tId}
                className={`bg-slate-950 border transition-all rounded-none overflow-hidden ${
                  isActive ? 'border-emerald-500/80 shadow-2xl ring-1 ring-emerald-500/50' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Summary Header Bar */}
                <div 
                  onClick={() => toggleWeekExpand(tId)}
                  className="p-4 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer hover:bg-slate-800/80 transition-colors"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      {isActive && (
                        <span className="px-2.5 py-0.5 bg-emerald-500 text-black font-black text-[10px] uppercase tracking-wider rounded-none flex items-center gap-1">
                          <Flame className="w-3.5 h-3.5 fill-black" /> Current Active Week
                        </span>
                      )}
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
                          <Award className="w-3 h-3" /> Weekend Exam
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs font-mono">
                      <span className="font-bold text-slate-300">📅 {t.startDate} to {t.endDate}</span>
                      <span className="text-slate-500">•</span>
                      <span className="font-bold text-emerald-400">{t.weeklyChapters?.length || 0} Subjects Assigned</span>
                    </div>

                    {/* Quick Subject Summary Chips */}
                    {Array.isArray(t.weeklyChapters) && t.weeklyChapters.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {t.weeklyChapters.map((wc, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-slate-950 border border-slate-800 text-[10px] font-bold text-slate-300 rounded-none">
                            <span className="text-emerald-400">{wc.subjectName}:</span> {wc.chapterName || 'General'}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                    <button
                      type="button"
                      className="px-3.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-mono font-black uppercase tracking-wider rounded-none flex items-center gap-1.5 transition-all"
                    >
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      {isExpanded ? 'Hide Details' : 'Open Study Roadmap'}
                    </button>
                  </div>
                </div>

                {/* Expanded Detailed View (Subject-wise, Chapter-wise, Topics & Attachments) */}
                {isExpanded && (
                  <div className="p-5 bg-slate-950 space-y-5 border-t border-slate-800">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                      <h4 className="text-xs font-mono font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                        <Layers className="w-4 h-4" /> WEEKLY SUBJECT STUDY CHAPTERS & TOPICS
                      </h4>
                    </div>

                    {Array.isArray(t.weeklyChapters) && t.weeklyChapters.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {t.weeklyChapters.map((wc, idx) => (
                          <div key={idx} className="p-4 bg-slate-900 border border-slate-800 rounded-none space-y-3 hover:border-emerald-500/50 transition-colors flex flex-col justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                                <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
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
                                <div className="pt-2 border-t border-slate-800/80">
                                  <span className="text-[9px] font-mono text-emerald-400 font-bold uppercase flex items-center gap-1 mb-1">
                                    <FileText className="w-3.5 h-3.5" /> Preparation Topics / Notes:
                                  </span>
                                  <p className="text-xs text-slate-300 font-medium whitespace-pre-line leading-relaxed bg-slate-950 p-2.5 border border-slate-800">
                                    {wc.topicsText}
                                  </p>
                                </div>
                              )}
                            </div>

                            {wc.attachmentUrl && (
                              <div className="pt-2 border-t border-slate-800">
                                <a
                                  href={wc.attachmentUrl.startsWith('http') ? wc.attachmentUrl : `${API_URL}${wc.attachmentUrl}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="w-full py-2 bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-500/40 text-indigo-300 text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                                >
                                  {wc.attachmentType === 'pdf' ? (
                                    <File className="w-3.5 h-3.5 text-rose-400" />
                                  ) : (
                                    <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                                  )}
                                  View Attached {wc.attachmentType === 'pdf' ? 'PDF Study Material' : 'Image Material'} <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-400 text-xs italic">No subject chapters assigned for this week yet.</p>
                    )}

                    {/* SUNDAY WEEKEND EXAM BANNER */}
                    {t.weekendExamTitle && (
                      <div className="p-4 bg-amber-950/60 border border-amber-500/50 rounded-none flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-none bg-amber-500/20 border border-amber-400 text-amber-400 flex items-center justify-center shrink-0">
                            <Award className="w-6 h-6" />
                          </div>
                          <div>
                            <span className="text-[10px] font-mono font-black text-amber-400 uppercase tracking-wider block">
                              SUNDAY WEEKEND EXAM
                            </span>
                            <h4 className="text-sm font-black text-white uppercase">{t.weekendExamTitle}</h4>
                            <p className="text-[11px] text-amber-200/80 font-bold">Cumulative exam covering all assigned chapters above.</p>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            const linkedTest = getTimetableTest(t);
                            if (linkedTest && onAttemptTest) {
                              onAttemptTest(linkedTest);
                            } else {
                              alert(`Weekend Exam: ${t.weekendExamTitle}. Go to Exams & Mocks tab to attempt.`);
                            }
                          }}
                          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer border border-amber-400 shrink-0 shadow-lg active:scale-95"
                        >
                          <PlayCircle className="w-4 h-4 stroke-[3]" /> Take Weekend Exam
                        </button>
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
  );
}
