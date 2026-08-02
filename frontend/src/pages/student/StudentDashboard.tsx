import React, { useState } from 'react';
import { User, Timetable, Test, TestAttempt, Subject, Announcement, Notification } from '../../types';
import { 
  Flame, Award, Calendar, BookOpen, Clock, FileText, CheckCircle2, 
  TrendingUp, AlertCircle, ArrowRight, BookMarked, Brain, Bell, Volume2, Check, Sparkles,
  Zap, Target, Layers, ArrowUpRight, Compass, HelpCircle, ChevronRight, Activity, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface StudentDashboardProps {
  user: User;
  timetables: Timetable[];
  availableTests: Test[];
  attempts: TestAttempt[];
  subjects: Subject[];
  announcements?: Announcement[];
  notifications?: Notification[];
  onNavigate: (tab: string) => void;
  onAttemptTest: (test: Test) => void;
}

export default function StudentDashboard({ 
  user, 
  timetables, 
  availableTests, 
  attempts, 
  subjects,
  announcements = [],
  notifications = [],
  onNavigate,
  onAttemptTest 
}: StudentDashboardProps) {
  
  // 1. Get current date timetables
  const todayStr = new Date().toISOString().split('T')[0];
  const todayTimetables = timetables.filter(t => t.date === todayStr);

  // 2. Identify pending tests (tests that haven't been attempted yet)
  const attemptedTestIds = attempts.map(a => a.testId);
  const pendingTests = availableTests.filter(t => !attemptedTestIds.includes(t.id));

  // 3. Compute Stats
  const completedTestsCount = attempts.length;
  const getAttemptPct = (a: any) => (a.totalMarks && a.totalMarks > 0) ? Math.round((a.score / a.totalMarks) * 100) : 0;
  const averageScore = completedTestsCount > 0 
    ? Math.round(attempts.reduce((acc, curr) => acc + getAttemptPct(curr), 0) / completedTestsCount)
    : 0;
  
  const highestScore = completedTestsCount > 0
    ? Math.max(...attempts.map(a => getAttemptPct(a)))
    : 0;

  const syllabusProgress = completedTestsCount > 0 ? Math.min(18 + completedTestsCount * 10, 96) : 20;

  // Filter announcements for this student
  const relevantAnnouncements = announcements.filter(ann => {
    if (!ann.targetExams || ann.targetExams.length === 0) return true;
    const userExams = [...(user.selectedEntranceExams || []), ...(user.selectedCompetitiveExams || [])];
    return ann.targetExams.some(id => userExams.includes(id));
  });

  // Filter notifications for this student
  const studentNotifications = notifications.filter(n => n.userId === user.uid || n.userId === 'all' || !n.userId);

  const handleMarkAsRead = async (notifId: string) => {
    const token = localStorage.getItem('token');
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/notifications/${notifId}/read`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
  };

  // Format chart data from attempts
  const chartData = attempts
    .sort((a, b) => new Date(a.submittedAt || '').getTime() - new Date(b.submittedAt || '').getTime())
    .map((attempt, index) => {
      const test = availableTests.find(t => t.id === attempt.testId);
      return {
        name: `Test ${index + 1}`,
        title: test ? test.title.substring(0, 15) + '...' : `Attempt ${index + 1}`,
        score: getAttemptPct(attempt)
      };
    });

  const defaultChartData = [
    { name: 'Diagnostic', score: 50 },
    { name: 'Practice 1', score: 65 },
    { name: 'Weekly 1', score: 78 },
    { name: 'Practice 2', score: 88 }
  ];

  // Time of day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div id="student_dashboard" className="space-y-8 font-sans pb-10">
      
      {/* ─── 1. HERO COMMAND HUB BANNER ─────────────────────────────────────────── */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 text-white p-7 md:p-10 border border-emerald-500/30 shadow-[0_20px_50px_rgba(6,78,59,0.3)]"
      >
        {/* Decorative Ambient Aura Glows */}
        <div className="absolute top-[-30%] right-[-10%] w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
        <div className="absolute bottom-[-40%] left-[-10%] w-[450px] h-[450px] bg-teal-400/15 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          
          {/* Welcome Text & Status Tag */}
          <div className="space-y-3.5 max-w-2xl">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-3.5 py-1 bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 rounded-full text-xs font-black tracking-widest uppercase flex items-center gap-1.5 backdrop-blur-md shadow-inner">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                Student Command Hub
              </span>

              {user.purchasedPlans && user.purchasedPlans.length > 0 ? (
                <span className="px-3 py-1 bg-teal-500/20 border border-teal-400/30 text-teal-200 rounded-full text-[11px] font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-300" /> Active Plan Enrolled
                </span>
              ) : (
                <span className="px-3 py-1 bg-amber-500/20 border border-amber-400/30 text-amber-200 rounded-full text-[11px] font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Free Explorer Mode
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
              {getGreeting()}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-emerald-400">{user.name}</span> 👋
            </h1>

            <p className="text-emerald-100/80 text-sm sm:text-base leading-relaxed font-medium">
              {user.purchasedPlans && user.purchasedPlans.length > 0 
                ? 'Your learning streak is live! Tackle today\'s practice sessions & mock tests to climb the leaderboard.'
                : 'Subscribe to a course plan to unlock full mock tests, grand evaluations, and chapter-wise study materials.'}
            </p>

            <div className="pt-2 flex items-center gap-3 flex-wrap">
              <button 
                onClick={() => onNavigate('tests')}
                className="px-6 py-3 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 hover:from-emerald-300 hover:to-teal-200 text-slate-950 rounded-xl font-black text-xs uppercase tracking-wider shadow-[0_10px_25px_rgba(16,185,129,0.4)] transition-all transform hover:-translate-y-0.5 cursor-pointer flex items-center gap-2"
              >
                <Zap className="w-4 h-4 text-slate-950 fill-slate-950" /> Start Practice Test
              </button>

              <button 
                onClick={() => onNavigate('timetable')}
                className="px-5 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl font-bold text-xs uppercase tracking-wider backdrop-blur-md transition-all cursor-pointer flex items-center gap-2"
              >
                <Calendar className="w-4 h-4 text-emerald-300" /> Today's Schedule
              </button>
            </div>
          </div>

          {/* Floating High-Impact Stat Pills */}
          <div className="grid grid-cols-3 lg:flex lg:flex-col gap-3 shrink-0">
            
            {/* Streak Chip */}
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="p-4 bg-slate-900/80 border border-emerald-500/30 rounded-2xl text-center backdrop-blur-xl shadow-lg relative overflow-hidden group min-w-[120px]"
            >
              <div className="absolute top-0 right-0 w-12 h-12 bg-amber-500/10 rounded-full blur-md group-hover:bg-amber-500/20 transition-all"></div>
              <Flame className="w-5 h-5 text-amber-400 mx-auto mb-1 animate-bounce" />
              <span className="block text-2xl md:text-3xl font-black text-white font-mono">{user.streak || 1}</span>
              <span className="text-[10px] font-black text-amber-300/80 uppercase tracking-widest block mt-0.5">Day Streak</span>
            </motion.div>

            {/* Avg Score Chip */}
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="p-4 bg-slate-900/80 border border-emerald-500/30 rounded-2xl text-center backdrop-blur-xl shadow-lg relative overflow-hidden group min-w-[120px]"
            >
              <div className="absolute top-0 right-0 w-12 h-12 bg-emerald-500/10 rounded-full blur-md group-hover:bg-emerald-500/20 transition-all"></div>
              <Target className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
              <span className="block text-2xl md:text-3xl font-black text-white font-mono">{averageScore}%</span>
              <span className="text-[10px] font-black text-emerald-300/80 uppercase tracking-widest block mt-0.5">Avg Score</span>
            </motion.div>

            {/* Completed Tests Chip */}
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="p-4 bg-slate-900/80 border border-emerald-500/30 rounded-2xl text-center backdrop-blur-xl shadow-lg relative overflow-hidden group min-w-[120px]"
            >
              <div className="absolute top-0 right-0 w-12 h-12 bg-teal-500/10 rounded-full blur-md group-hover:bg-teal-500/20 transition-all"></div>
              <Award className="w-5 h-5 text-teal-300 mx-auto mb-1" />
              <span className="block text-2xl md:text-3xl font-black text-white font-mono">{completedTestsCount}</span>
              <span className="text-[10px] font-black text-teal-300/80 uppercase tracking-widest block mt-0.5">Exams Done</span>
            </motion.div>

          </div>

        </div>
      </motion.div>

      {/* ─── 2. QUICK WORKSPACE LAUNCHPAD (6 Glass Feature Cards) ──────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Compass className="w-4 h-4 text-emerald-600" /> Academic Workspace Launchpad
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          
          {[
            { id: 'timetable', title: 'Timetable', desc: 'Daily Schedule', icon: Calendar, color: 'emerald', badge: todayTimetables.length > 0 ? `${todayTimetables.length} Today` : null },
            { id: 'tests', title: 'Test Center', desc: 'Mock Exams', icon: FileText, color: 'teal', badge: pendingTests.length > 0 ? `${pendingTests.length} Pending` : null },
            { id: 'subjects', title: 'Syllabus', desc: 'Chapters & Notes', icon: BookOpen, color: 'blue', badge: null },
            { id: 'doubts', title: 'Ask Doubts', desc: 'Expert Help', icon: Brain, color: 'purple', badge: null },
            { id: 'analytics', title: 'Analytics', desc: 'Rank & Performance', icon: TrendingUp, color: 'amber', badge: null },
            { id: 'store', title: 'Plan Store', desc: 'Enroll Courses', icon: Sparkles, color: 'rose', badge: null },
          ].map((item, idx) => {
            const IconComponent = item.icon;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                whileHover={{ y: -4, scale: 1.02 }}
                onClick={() => onNavigate(item.id)}
                className="group relative p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-emerald-500/50 shadow-sm hover:shadow-xl transition-all cursor-pointer overflow-hidden flex flex-col justify-between"
              >
                {item.badge && (
                  <span className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-emerald-100 text-emerald-800 font-extrabold text-[9px] rounded-md tracking-wider">
                    {item.badge}
                  </span>
                )}

                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 flex items-center justify-center transition-colors mb-3">
                  <IconComponent className="w-5 h-5 text-emerald-600 group-hover:text-white transition-colors" />
                </div>

                <div>
                  <h4 className="font-black text-slate-900 text-sm group-hover:text-emerald-700 transition-colors flex items-center gap-1">
                    {item.title} <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h4>
                  <p className="text-slate-400 text-[11px] font-medium leading-tight mt-0.5">{item.desc}</p>
                </div>
              </motion.div>
            );
          })}

        </div>
      </div>

      {/* ─── 3. MAIN DASHBOARD CONTENT GRID ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT 2 COLUMNS: Today's Schedule + Pending Evaluations + Bulletins */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* A) TODAY'S FOCUS & STUDY SCHEDULE */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-extrabold text-slate-900 text-lg sm:text-xl">Today's Mission Schedule</h2>
                  <p className="text-slate-400 text-xs font-semibold">Your daily mapped study targets and MCQ goals</p>
                </div>
              </div>
              
              <button 
                onClick={() => onNavigate('timetable')}
                className="text-emerald-600 hover:text-emerald-800 text-xs font-extrabold flex items-center gap-1 cursor-pointer transition-all bg-emerald-50 hover:bg-emerald-100 px-3.5 py-2 rounded-xl border border-emerald-200/60"
              >
                Full Timetable <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {todayTimetables.length === 0 ? (
              <div className="text-center py-10 px-4 bg-gradient-to-br from-slate-50 to-emerald-50/20 rounded-2xl border border-dashed border-slate-200">
                <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mx-auto mb-3 shadow-xs">
                  <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                </div>
                <h4 className="text-slate-900 font-extrabold text-base">No Schedule Mapped For Today</h4>
                <p className="text-slate-500 text-xs max-w-sm mx-auto mt-1 font-medium leading-relaxed">
                  You're all caught up! Use this time to revise previous chapters or take practice tests.
                </p>
                <button 
                  onClick={() => onNavigate('tests')}
                  className="mt-4 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Browse Practice Tests
                </button>
              </div>
            ) : (
              <div className="space-y-3.5">
                {todayTimetables.map((item) => {
                  const subjectObj = subjects.find(s => s.id === item.subjectId);
                  return (
                    <div key={item.id} className="p-5 rounded-2xl border border-slate-200/90 hover:border-emerald-500/50 hover:shadow-md transition-all bg-gradient-to-r from-slate-50/60 via-white to-slate-50/40 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-200 font-black text-[10px] rounded-lg tracking-wider uppercase">
                            {subjectObj ? subjectObj.name : 'General'}
                          </span>
                          <span className="text-slate-400 text-xs flex items-center gap-1 font-semibold">
                            <Clock className="w-3.5 h-3.5 text-slate-400" /> 1-2 Hours Target
                          </span>
                        </div>
                        <h3 className="font-black text-slate-900 text-base sm:text-lg">{item.title}</h3>
                        <p className="text-slate-600 text-xs sm:text-sm font-medium leading-relaxed">{item.studyTopic}</p>
                        {item.revisionTopic && (
                          <div className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200/60">
                            <span>Revision:</span> {item.revisionTopic}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3 shrink-0 bg-white p-3.5 rounded-xl border border-slate-200 text-sm shadow-xs">
                        <div className="text-right">
                          <span className="block font-black text-emerald-700 text-lg font-mono">{item.practiceMCQsCount}</span>
                          <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">MCQ Target</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* B) PENDING EVALUATIONS & MOCK EXAMS */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-teal-50 text-teal-700 border border-teal-100">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-extrabold text-slate-900 text-lg sm:text-xl">Pending Evaluations</h2>
                  <p className="text-slate-400 text-xs font-semibold">Available tests ready for your attempt</p>
                </div>
              </div>

              <button 
                onClick={() => onNavigate('tests')}
                className="text-teal-600 hover:text-teal-800 text-xs font-extrabold flex items-center gap-1 cursor-pointer transition-all bg-teal-50 hover:bg-teal-100 px-3.5 py-2 rounded-xl border border-teal-200/60"
              >
                Test Portal <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {pendingTests.length === 0 ? (
              <div className="text-center py-10 px-4 bg-gradient-to-br from-slate-50 to-teal-50/20 rounded-2xl border border-dashed border-slate-200">
                <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mx-auto mb-3 shadow-xs">
                  <Award className="w-7 h-7 text-teal-500" />
                </div>
                <h4 className="text-slate-900 font-extrabold text-base">You Are All Caught Up!</h4>
                <p className="text-slate-500 text-xs max-w-sm mx-auto mt-1 font-medium leading-relaxed">
                  Great work completing all available evaluations. Check back soon for new grand tests.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {pendingTests.slice(0, 4).map((test) => (
                  <motion.div 
                    key={test.id} 
                    whileHover={{ y: -3 }}
                    className="p-5 rounded-2xl border border-slate-200 hover:border-teal-500/50 hover:shadow-lg bg-gradient-to-b from-white to-slate-50/50 flex flex-col justify-between space-y-4 transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="px-2.5 py-0.5 bg-teal-100 text-teal-800 border border-teal-200 font-black text-[10px] rounded-md uppercase tracking-wider">
                          {test.testType || 'Practice'}
                        </span>
                        <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> {test.duration} mins
                        </span>
                      </div>
                      <h3 className="font-black text-slate-900 text-base line-clamp-1">{test.title}</h3>
                      <p className="text-slate-500 text-xs mt-1 line-clamp-2 leading-relaxed font-medium">
                        {test.instructions || 'Standard assessment examination'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <span className="text-xs font-extrabold text-slate-700">{test.questions?.length || 'MCQ'} Questions</span>
                      <button 
                        onClick={() => onAttemptTest(test)}
                        className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold cursor-pointer transition-all shadow-sm flex items-center gap-1.5"
                      >
                        Start Test <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* C) ACADEMIC BULLETINS & ANNOUNCEMENTS */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-100">
                <Volume2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-extrabold text-slate-900 text-lg sm:text-xl">Academic Bulletins</h2>
                <p className="text-slate-400 text-xs font-semibold">Official updates & coordinator notifications</p>
              </div>
            </div>

            {relevantAnnouncements.length === 0 ? (
              <div className="text-center py-6 bg-slate-50/50 rounded-2xl border border-slate-200 text-xs text-slate-400 font-bold">
                No active announcements for your target exam tracks.
              </div>
            ) : (
              <div className="space-y-3.5">
                {relevantAnnouncements.map((ann) => (
                  <div key={ann.id} className="p-4.5 rounded-2xl border border-slate-200/80 bg-gradient-to-r from-slate-50 via-white to-slate-50 relative">
                    <div className="flex items-center justify-between gap-4 flex-wrap mb-1.5">
                      <h4 className="font-black text-slate-900 text-sm sm:text-base">{ann.title}</h4>
                      <span className="text-[10px] font-mono font-bold text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                        {new Date(ann.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-slate-600 text-xs leading-relaxed font-medium">{ann.content}</p>
                    {ann.targetExams && ann.targetExams.length > 0 && (
                      <div className="mt-2.5 flex gap-1.5 flex-wrap">
                        {ann.targetExams.map(exId => (
                          <span key={exId} className="px-2 py-0.5 bg-slate-900 text-emerald-300 font-bold text-[9px] rounded-md uppercase tracking-wider">
                            {exId}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>

        </div>

        {/* RIGHT 1 COLUMN: Performance Chart + Syllabus Tracker + Alerts */}
        <div className="space-y-6">
          
          {/* A) PERFORMANCE RANK GROWTH CHART */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-extrabold text-slate-900 text-lg">Performance Trend</h3>
                </div>
                <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 font-black text-[10px] rounded-full uppercase">
                  {averageScore}% Avg
                </span>
              </div>
              <p className="text-slate-400 text-xs font-medium">Estimated rank growth percentile across evaluations</p>
            </div>

            <div className="h-44 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData.length > 0 ? chartData : defaultChartData}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} fontWeight="bold" tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} fontWeight="bold" tickLine={false} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ background: '#0f172a', borderRadius: '12px', border: '1px solid #10b981', color: '#fff' }}
                    labelStyle={{ fontWeight: 'black', fontSize: '11px', color: '#34d399' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="score" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-center">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider">Highest Score</span>
                <span className="text-base font-black text-emerald-600 font-mono">{highestScore}%</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider">Evaluations</span>
                <span className="text-base font-black text-slate-900 font-mono">{completedTestsCount}</span>
              </div>
            </div>

            <button 
              onClick={() => onNavigate('analytics')}
              className="w-full text-center py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer mt-4 uppercase tracking-wider flex items-center justify-center gap-1.5"
            >
              Chapter Mastery Breakdown <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
            </button>
          </motion.div>

          {/* B) SYLLABUS PROGRESS VISUALIZER */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                <Brain className="w-5 h-5 text-emerald-600" /> Syllabus Progress
              </h3>
              <span className="text-sm font-black text-emerald-600 font-mono">{syllabusProgress}%</span>
            </div>
            
            <div className="overflow-hidden h-3.5 rounded-full bg-slate-100 border border-slate-200 p-0.5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${syllabusProgress}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 shadow-sm"
              ></motion.div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div 
                onClick={() => onNavigate('subjects')}
                className="p-3 bg-slate-50 hover:bg-emerald-50/60 border border-slate-200/80 hover:border-emerald-400 rounded-xl text-center cursor-pointer transition-all group"
              >
                <BookOpen className="w-4 h-4 text-emerald-600 mx-auto mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-black text-slate-700 block uppercase tracking-wider">Subjects</span>
              </div>
              <div 
                onClick={() => onNavigate('timetable')}
                className="p-3 bg-slate-50 hover:bg-emerald-50/60 border border-slate-200/80 hover:border-emerald-400 rounded-xl text-center cursor-pointer transition-all group"
              >
                <Calendar className="w-4 h-4 text-emerald-600 mx-auto mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-black text-slate-700 block uppercase tracking-wider">Timetable</span>
              </div>
              <div 
                onClick={() => onNavigate('study_materials')}
                className="p-3 bg-slate-50 hover:bg-emerald-50/60 border border-slate-200/80 hover:border-emerald-400 rounded-xl text-center cursor-pointer transition-all group"
              >
                <BookMarked className="w-4 h-4 text-emerald-600 mx-auto mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-black text-slate-700 block uppercase tracking-wider">Notes</span>
              </div>
              <div 
                onClick={() => onNavigate('tests')}
                className="p-3 bg-slate-50 hover:bg-emerald-50/60 border border-slate-200/80 hover:border-emerald-400 rounded-xl text-center cursor-pointer transition-all group"
              >
                <Award className="w-4 h-4 text-emerald-600 mx-auto mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-black text-slate-700 block uppercase tracking-wider">Exams</span>
              </div>
            </div>
          </motion.div>

          {/* C) COORDINATOR ALERTS & NOTIFICATIONS */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">Alerts & Notices</h3>
              </div>
              {studentNotifications.filter(n => !n.isRead).length > 0 && (
                <span className="px-2 py-0.5 bg-emerald-600 text-white font-mono font-black text-[10px] rounded-full">
                  {studentNotifications.filter(n => !n.isRead).length} New
                </span>
              )}
            </div>

            {studentNotifications.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs font-bold bg-slate-50 rounded-2xl border border-slate-200">
                No active coordinator alerts.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[240px] overflow-y-auto pr-1">
                {studentNotifications.map((notif) => (
                  <div 
                    key={notif.id} 
                    className={`p-3.5 rounded-xl border text-xs transition-all ${
                      notif.isRead 
                        ? 'bg-slate-50/50 border-slate-200 text-slate-500' 
                        : 'bg-gradient-to-r from-emerald-50/40 to-white border-emerald-400/60 shadow-xs text-slate-900 font-bold'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <span className="font-black text-xs block text-slate-900">{notif.title}</span>
                      {!notif.isRead && (
                        <button 
                          onClick={() => handleMarkAsRead(notif.id)}
                          title="Mark as read"
                          className="p-1 rounded-md bg-emerald-100 hover:bg-emerald-600 hover:text-white text-emerald-800 cursor-pointer transition-colors"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed font-medium">{notif.message}</p>
                    <span className="text-[9px] font-mono font-semibold text-slate-400 block mt-1.5 uppercase">
                      {new Date(notif.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

        </div>

      </div>

    </div>
  );
}

