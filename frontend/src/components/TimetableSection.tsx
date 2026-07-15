import React, { useState } from 'react';
import { User, Timetable, Subject, Chapter } from '../types';
import { Calendar, Clock, BookOpen, FileText, CheckCircle2, ChevronRight, Bookmark, ArrowRight } from 'lucide-react';

interface TimetableSectionProps {
  user: User;
  timetables: Timetable[];
  subjects: Subject[];
  chapters: Chapter[];
}

export default function TimetableSection({
  user,
  timetables,
  subjects,
  chapters
}: TimetableSectionProps) {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [completedTopics, setCompletedTopics] = useState<Record<string, boolean>>({});

  // Get matching timetables for this user's criteria:
  // User must have selected the exam, studentType, and studyPlan
  const filteredTimetables = timetables.filter(item => {
    // 1. Is the exam associated with student's chosen exams?
    const examMatch = (user.selectedEntranceExams || []).includes(item.examId) || 
                      (user.selectedCompetitiveExams || []).includes(item.examId);
    
    // 2. Is student type match? (Only enforce if entrance exam)
    const typeMatch = !item.studentType || item.studentType === user.studentType;

    // 3. Is study plan match?
    const planMatch = !item.studyPlan || item.studyPlan === user.studyPlan;

    return examMatch && typeMatch && planMatch;
  });

  // Sort timetables: today first, then future
  const sortedSchedules = [...filteredTimetables].sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  const handleToggleCompleted = (id: string) => {
    setCompletedTopics(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Group by date
  const groupedSchedules: Record<string, Timetable[]> = {};
  sortedSchedules.forEach(item => {
    if (!groupedSchedules[item.date]) {
      groupedSchedules[item.date] = [];
    }
    groupedSchedules[item.date].push(item);
  });

  // Format dates beautifully
  const formatFriendlyDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    if (dateStr === today) return 'Today';
    if (dateStr === tomorrow) return 'Tomorrow';
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div id="timetable_section" className="space-y-6 font-sans">
      
      {/* Welcome & Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-zinc-900" />
            Your Personalized Timetable
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Dynamic study plan custom tailored for your selected preparation tracks.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-50 text-zinc-800 text-xs font-semibold rounded-md border border-geom-border">
          <BookOpen className="w-4 h-4 text-zinc-900" />
          Plan Duration: <span className="uppercase text-zinc-950 ml-1 font-bold">{user.studyPlan || 'yearly'}</span>
        </div>
      </div>

      {filteredTimetables.length === 0 ? (
        <div className="bg-white rounded-lg border border-geom-border p-12 text-center shadow-geom">
          <Calendar className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
          <h3 className="font-bold text-zinc-800 text-base">No Daily Timetable Configured</h3>
          <p className="text-zinc-500 text-xs mt-1.5 max-w-md mx-auto leading-relaxed">
            Our academic designers haven't posted a timetable matching your exact criteria yet. Ask your Administrator to map subjects to your exams, student type (<span className="font-bold text-zinc-900">{user.studentType || 'Not Set'}</span>) and plan (<span className="font-bold text-zinc-900">{user.studyPlan || 'Not Set'}</span>)!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Timeline List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg border border-geom-border p-6 shadow-geom">
              <h3 className="font-bold text-zinc-900 text-base mb-6 pb-4 border-b border-geom-border">
                Academic Flow Chronology
              </h3>

              <div className="space-y-8 relative before:absolute before:top-2 before:bottom-2 before:left-[19px] before:w-[1px] before:bg-zinc-200">
                {Object.keys(groupedSchedules).map((dateStr) => (
                  <div key={dateStr} className="relative pl-12 space-y-4">
                    
                    {/* Square date tag */}
                    <div className="absolute left-0 top-1 w-9 h-9 bg-zinc-900 text-white rounded-md border border-zinc-800 flex items-center justify-center z-10 shrink-0 shadow-geom-sm">
                      <Calendar className="w-4.5 h-4.5 text-emerald-400" />
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                        {formatFriendlyDate(dateStr)}
                        <span className="text-xs text-zinc-400 font-normal">({dateStr})</span>
                      </h4>
                    </div>

                    <div className="space-y-4">
                      {groupedSchedules[dateStr].map((item) => {
                        const isDone = completedTopics[item.id];
                        const subjectObj = subjects.find(s => s.id === item.subjectId);
                        const chapterObj = chapters.find(c => c.id === item.chapterId);

                        return (
                          <div 
                            key={item.id} 
                            className={`p-5 rounded-lg border transition-all ${
                              isDone 
                                ? 'bg-zinc-50/50 border-geom-border opacity-70' 
                                : 'bg-white border-geom-border hover:border-zinc-300 shadow-geom'
                            }`}
                          >
                            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center pb-4 border-b border-geom-border mb-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="px-2 py-0.5 bg-zinc-900 text-white font-bold text-[9px] rounded-sm uppercase tracking-wider border border-zinc-800">
                                    {subjectObj?.name || 'General'}
                                  </span>
                                  {chapterObj && (
                                    <span className="px-2 py-0.5 bg-zinc-100 border border-geom-border text-zinc-600 text-[9px] font-bold rounded-sm uppercase tracking-wide">
                                      {chapterObj.name}
                                    </span>
                                  )}
                                  <span className="text-xs text-zinc-400 flex items-center gap-1 font-medium">
                                    <Clock className="w-3 h-3" /> Scheduled
                                  </span>
                                </div>
                                <h5 className={`font-bold text-sm mt-1.5 ${isDone ? 'line-through text-zinc-400' : 'text-zinc-900'}`}>
                                  {item.title}
                                </h5>
                              </div>

                              <button
                                onClick={() => handleToggleCompleted(item.id)}
                                className={`py-1.5 px-3 rounded-sm text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                                  isDone 
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                                    : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-850 text-white'
                                }`}
                              >
                                <CheckCircle2 className={`w-4 h-4 ${isDone ? 'fill-emerald-600 text-emerald-50' : ''}`} />
                                {isDone ? 'Completed' : 'Mark Done'}
                              </button>
                            </div>

                            {/* Schedule specifics */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                              <div className="space-y-1.5 p-3 rounded-md bg-zinc-50 border border-geom-border">
                                <span className="font-bold text-zinc-400 text-[10px] uppercase tracking-wider flex items-center gap-1">
                                  <BookOpen className="w-3.5 h-3.5 text-zinc-700" />
                                  Core Study Syllabus
                                </span>
                                <p className="text-zinc-600 leading-relaxed font-medium">
                                  {item.studyTopic}
                                </p>
                              </div>

                              <div className="space-y-3">
                                <div className="p-3 rounded-md bg-zinc-50 border border-geom-border flex items-center justify-between">
                                  <div>
                                    <span className="font-bold text-zinc-400 text-[9px] uppercase tracking-wider block">Practice Goal</span>
                                    <p className="text-zinc-800 font-bold mt-0.5">{item.practiceMCQsCount} Multiple Choice Questions</p>
                                  </div>
                                  <Bookmark className="w-4.5 h-4.5 text-zinc-900" />
                                </div>

                                {item.revisionTopic && (
                                  <div className="p-3 rounded-md bg-zinc-50 border border-geom-border flex items-center justify-between">
                                    <div>
                                      <span className="font-bold text-zinc-400 text-[9px] uppercase tracking-wider block">Revision Target</span>
                                      <p className="text-zinc-800 font-medium mt-0.5">{item.revisionTopic}</p>
                                    </div>
                                    <CheckCircle2 className="w-4.5 h-4.5 text-zinc-900" />
                                  </div>
                                )}
                              </div>
                            </div>

                            {item.assignment && (
                              <div className="mt-4 p-3 bg-zinc-50 rounded-md border border-geom-border flex items-center gap-2 text-xs">
                                <span className="px-1.5 py-0.5 bg-zinc-900 text-white border border-zinc-800 rounded-sm font-bold text-[8px] uppercase tracking-wider shrink-0">
                                  ASSIGNMENT
                                </span>
                                <span className="text-zinc-600 font-semibold">{item.assignment}</span>
                              </div>
                            )}

                          </div>
                        );
                      })}
                    </div>

                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right sidebar details */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-geom-border p-6 shadow-geom space-y-4">
              <h3 className="font-bold text-zinc-900 text-base">Preparation Summary</h3>
              
              <div className="p-4 rounded-md bg-zinc-50 border border-geom-border text-xs space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400 font-bold uppercase text-[9px] tracking-wider">Student Track</span>
                  <span className="font-bold text-zinc-800 uppercase text-[9px] bg-zinc-100 border border-geom-border py-0.5 px-2 rounded-sm">
                    {user.studentType === 'long_term' ? 'Long Term' : user.studentType || 'Not Selected'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400 font-bold uppercase text-[9px] tracking-wider">Total Milestones</span>
                  <span className="font-bold text-zinc-800 font-mono">{filteredTimetables.length} Days</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400 font-bold uppercase text-[9px] tracking-wider">Daily MCQs target</span>
                  <span className="font-bold text-zinc-800 font-mono">
                    {filteredTimetables.reduce((acc, curr) => acc + curr.practiceMCQsCount, 0)} Total
                  </span>
                </div>
              </div>

              <div className="p-5 bg-zinc-950 text-white border border-zinc-800 rounded-lg space-y-2 relative overflow-hidden geom-grid-pattern-dark">
                <h4 className="font-bold text-xs text-emerald-400 uppercase tracking-wider">Did you know?</h4>
                <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                  Students who follow their daily mapped study track and complete their scheduled MCQs increase their competitive percentile scores by up to 28%! Keep completing your tasks every day.
                </p>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
