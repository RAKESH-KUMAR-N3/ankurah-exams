import React, { useState, useMemo } from 'react';
import { User, Timetable, Subject, Chapter, Test } from '../../types';
import { 
  Calendar, BookOpen, Clock, Award, ChevronDown, ChevronRight, 
  Sparkles, CheckCircle2, Flame, Layers, ArrowRight, Shield, PlayCircle, History
} from 'lucide-react';

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

  const toggleBacklogExpand = (id: string) => {
    setExpandedBacklogs(prev => ({ ...prev, [id]: !prev[id] }));
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
        <div className="space-y-6">
          
          {/* ── 1. CURRENT ACTIVE WEEK SPOTLIGHT ── */}
          {currentWeek && (
            <div className="bg-slate-950 border-2 border-emerald-500/60 rounded-none shadow-2xl overflow-hidden relative">
              <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 p-4 border-b border-emerald-500/40 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-emerald-500 text-black font-black text-xs uppercase tracking-wider rounded-none flex items-center gap-1.5 shadow-md">
                    <Flame className="w-4 h-4 fill-black" /> CURRENT ACTIVE WEEK
                  </span>
                  <div>
                    <h2 className="text-lg font-black text-white uppercase tracking-tight">
                      {currentWeek.weekTitle || `Week ${currentWeek.weekNumber || 1}`}
                    </h2>
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      📅 {currentWeek.startDate} to {currentWeek.endDate}
                    </span>
                  </div>
                </div>

                {currentWeek.courseName && (
                  <span className="px-3 py-1 bg-slate-900 border border-slate-700 text-slate-300 font-mono font-bold text-xs rounded-none">
                    {currentWeek.courseName}
                  </span>
                )}
              </div>

              {/* Weekly Assigned Chapters Grid */}
              <div className="p-5 space-y-4">
                <h4 className="text-xs font-mono font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" /> WEEKLY SUBJECT STUDY CHAPTERS
                </h4>

                {Array.isArray(currentWeek.weeklyChapters) && currentWeek.weeklyChapters.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {currentWeek.weeklyChapters.map((wc, idx) => (
                      <div key={idx} className="p-3.5 bg-slate-900 border border-slate-800 rounded-none space-y-1.5 hover:border-emerald-500/50 transition-colors">
                        <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider block">
                          SUBJECT {idx + 1}
                        </span>
                        <h5 className="font-black text-white text-xs uppercase truncate">{wc.subjectName}</h5>
                        <div className="pt-1.5 border-t border-slate-800">
                          <span className="text-[9px] font-mono text-slate-400 block font-bold">ASSIGNED CHAPTER:</span>
                          <p className="text-xs font-extrabold text-emerald-300 tracking-wide line-clamp-2">
                            {wc.chapterName || 'General Chapter'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 text-xs italic">No subject chapters assigned for this week yet.</p>
                )}

                {/* SUNDAY WEEKEND EXAM BANNER */}
                {currentWeek.weekendExamTitle ? (
                  <div className="p-4 bg-amber-950/60 border border-amber-500/50 rounded-none flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-none bg-amber-500/20 border border-amber-400 text-amber-400 flex items-center justify-center shrink-0">
                        <Award className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-[10px] font-mono font-black text-amber-400 uppercase tracking-wider block">
                          SUNDAY WEEKEND EXAM
                        </span>
                        <h4 className="text-sm font-black text-white uppercase">{currentWeek.weekendExamTitle}</h4>
                        <p className="text-[11px] text-amber-200/80 font-bold">Cumulative exam covering all assigned chapters above.</p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        const linkedTest = getTimetableTest(currentWeek);
                        if (linkedTest && onAttemptTest) {
                          onAttemptTest(linkedTest);
                        } else {
                          alert(`Weekend Exam: ${currentWeek.weekendExamTitle}. Go to Exams & Mocks tab to attempt.`);
                        }
                      }}
                      className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer border border-amber-400 shrink-0 shadow-lg active:scale-95"
                    >
                      <PlayCircle className="w-4 h-4 stroke-[3]" /> Take Weekend Exam
                    </button>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-none text-slate-400 text-xs font-mono font-bold flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-400" /> Study schedule active. Complete assigned chapters above before weekend.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── 2. PREVIOUS WEEKS & BACKLOGS (FOR LATE JOINERS) ── */}
          {previousWeeks.length > 0 && (
            <div className="bg-slate-950 border border-slate-800 rounded-none shadow-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">
                    Previous Weeks & Backlogs ({previousWeeks.length})
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase">
                  Late Joiner Access Allowed
                </span>
              </div>

              <p className="text-slate-400 text-xs font-bold">
                Joined late? You can access all previous weekly study roadmaps below and attempt past weekend exams anytime to complete your backlogs.
              </p>

              <div className="space-y-3">
                {previousWeeks.map((pw: Timetable) => {
                  const pwId = pw._id || pw.id;
                  const isExpanded = expandedBacklogs[pwId] ?? false;

                  return (
                    <div key={pwId} className="border border-slate-800 rounded-none bg-slate-900 overflow-hidden">
                      <div 
                        onClick={() => toggleBacklogExpand(pwId)}
                        className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-800/80 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {isExpanded ? <ChevronDown className="w-4 h-4 text-emerald-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                          <div>
                            <h4 className="text-xs font-black text-white uppercase">{pw.weekTitle || `Week ${pw.weekNumber || 1}`}</h4>
                            <span className="text-[10px] font-mono text-slate-400 font-bold block">
                              📅 {pw.startDate} to {pw.endDate}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {pw.weekendExamTitle && (
                            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[9px] font-mono font-black uppercase">
                              Exam Included
                            </span>
                          )}
                          <span className="text-xs font-mono font-bold text-emerald-400">
                            {isExpanded ? 'Hide Details' : 'View Backlog'}
                          </span>
                        </div>
                      </div>

                      {/* Expanded Backlog Content */}
                      {isExpanded && (
                        <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-3">
                          <span className="text-[10px] font-mono font-black text-slate-400 uppercase block">
                            ASSIGNED CHAPTERS IN THIS WEEK:
                          </span>
                          {Array.isArray(pw.weeklyChapters) && pw.weeklyChapters.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {pw.weeklyChapters.map((wc, idx) => (
                                <div key={idx} className="p-2.5 bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                                  <span className="font-black text-emerald-400 uppercase text-[11px]">{wc.subjectName}:</span>
                                  <span className="font-bold text-white text-[11px] truncate max-w-[200px]">{wc.chapterName}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 italic">No chapters listed.</p>
                          )}

                          {pw.weekendExamTitle && (
                            <div className="pt-2 flex items-center justify-between bg-slate-900 p-3 border border-amber-500/30">
                              <span className="text-xs font-bold text-amber-300 uppercase">🏆 {pw.weekendExamTitle}</span>
                              <button
                                onClick={() => {
                                  const linkedTest = getTimetableTest(pw);
                                  if (linkedTest && onAttemptTest) {
                                    onAttemptTest(linkedTest);
                                  } else {
                                    alert(`Past Exam: ${pw.weekendExamTitle}. Go to Exams & Mocks tab to attempt.`);
                                  }
                                }}
                                className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-black text-xs font-black uppercase tracking-wider cursor-pointer border border-amber-400"
                              >
                                Practice Past Test
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── 3. UPCOMING WEEKS PREVIEW ── */}
          {upcomingWeeks.length > 0 && (
            <div className="bg-slate-950 border border-slate-800 rounded-none p-5 space-y-3">
              <h3 className="text-xs font-mono font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" /> UPCOMING WEEKS PREVIEW ({upcomingWeeks.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {upcomingWeeks.map((uw: Timetable) => (
                  <div key={uw._id || uw.id} className="p-3 bg-slate-900 border border-slate-800 opacity-70">
                    <h4 className="text-xs font-black text-white uppercase">{uw.weekTitle || `Week ${uw.weekNumber || 1}`}</h4>
                    <span className="text-[10px] font-mono text-slate-400 block font-bold">
                      Starts: {uw.startDate}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
