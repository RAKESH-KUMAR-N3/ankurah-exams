import React, { useState } from 'react';
import { User, Timetable, Test, TestAttempt, Subject, Announcement, Notification } from '../../types';
import { 
  Flame, Award, Calendar, BookOpen, Clock, FileText, CheckCircle2, 
  TrendingUp, AlertCircle, ArrowRight, BookMarked, Brain, Bell, Volume2, Check, Sparkles,
  Zap, Target, Layers, ArrowUpRight, Compass, HelpCircle, ChevronRight, Activity, ShieldCheck,
  PieChart as PieChartIcon, BarChart2, Milestone, Route
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

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

  // Helper for human-readable plan name
  const getReadablePlanName = (planId?: string) => {
    if (!planId) return 'Enrolled Course Plan';
    if (/^[0-9a-fA-F]{24}$/.test(planId)) return 'Active Course Plan';
    return planId;
  };

  // 3. Check Purchased Plan & Student State
  const hasPurchasedPlan = Boolean(user.purchasedPlans && user.purchasedPlans.length > 0);
  const activePlanObj = hasPurchasedPlan ? user.purchasedPlans![0] : null;
  const activePlanName = activePlanObj ? getReadablePlanName(activePlanObj.planId) : 'Free Explorer Mode';

  // 4. Compute Real Student Performance Stats from Attempts
  const completedAttempts = attempts.filter(a => a.status === 'Completed' || a.score !== undefined);
  const completedTestsCount = completedAttempts.length;
  const getAttemptPct = (a: any) => (a.totalMarks && a.totalMarks > 0) ? Math.round((a.score / a.totalMarks) * 100) : 0;
  
  const averageScore = completedTestsCount > 0 
    ? Math.round(completedAttempts.reduce((acc, curr) => acc + getAttemptPct(curr), 0) / completedTestsCount)
    : 0;
  
  const highestScore = completedTestsCount > 0
    ? Math.max(...completedAttempts.map(a => getAttemptPct(a)))
    : 0;

  const syllabusProgress = completedTestsCount > 0 
    ? Math.min(20 + completedTestsCount * 12, 98) 
    : (hasPurchasedPlan ? 25 : 15);

  // 5. Dynamic Roadmap & Pillar Data for Charts
  const roadmapPieData = [
    { name: 'Course Plan', value: hasPurchasedPlan ? 100 : 25, color: '#10b981' },
    { name: 'Daily Timetable', value: todayTimetables.length > 0 ? 85 : 40, color: '#14b8a6' },
    { name: 'Syllabus Coverage', value: syllabusProgress, color: '#3b82f6' },
    { name: 'Exam Marks Avg', value: averageScore > 0 ? averageScore : (completedTestsCount > 0 ? 30 : 20), color: '#f59e0b' }
  ];

  const roadmapBarData = [
    { name: 'Plan Status', target: 100, achieved: hasPurchasedPlan ? 100 : 25 },
    { name: 'Timetable Goal', target: 100, achieved: todayTimetables.length > 0 ? 85 : 40 },
    { name: 'Syllabus Progress', target: 100, achieved: syllabusProgress },
    { name: 'Exam Score Avg', target: 100, achieved: averageScore > 0 ? averageScore : 20 }
  ];

  // Filter announcements & notifications
  const relevantAnnouncements = announcements.filter(ann => {
    if (!ann.targetExams || ann.targetExams.length === 0) return true;
    const userExams = [...(user.selectedEntranceExams || []), ...(user.selectedCompetitiveExams || [])];
    return ann.targetExams.some(id => userExams.includes(id));
  });

  const studentNotifications = notifications.filter(n => n.userId === user.uid || n.userId === 'all' || !n.userId);

  const containerVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.97 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.7,
        staggerChildren: 0.12,
        ease: [0.16, 1, 0.3, 1] as any
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5 } }
  };

  return (
    <div id="student_dashboard" className="space-y-8 font-sans pb-10">
      
      {/* ─── 1. HIGH-IMPACT ANIMATED ACADEMIC ROADMAP ─────────────────────────────── */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 space-y-8 bg-transparent"
      >

        {/* FREE EXPLORER BANNER WITH PULSING GLOW (Shown if No Plan Purchased) */}
        {!hasPurchasedPlan && (
          <motion.div 
            variants={itemVariants}
            whileHover={{ scale: 1.015, y: -2 }}
            animate={{ boxShadow: ['0 0 0px rgba(245,158,11,0)', '0 0 25px rgba(245,158,11,0.25)', '0 0 0px rgba(245,158,11,0)'] }}
            transition={{ repeat: Infinity, duration: 4 }}
            className="hidden md:flex p-4 rounded-xl bg-amber-500/15 border border-amber-400/50 backdrop-blur-md items-center justify-between gap-4 flex-wrap shadow-none"
          >
            <div className="flex items-center gap-3">
              <motion.div 
                animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 3 }}
                className="w-10 h-10 rounded-lg bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-600 shrink-0"
              >
                <Sparkles className="w-5 h-5" />
              </motion.div>
              <div>
                <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                  Free Explorer Mode — Unlock Full Academic Roadmap
                </h4>
                <p className="text-slate-600 text-xs font-medium mt-0.5">
                  Subscribe to an official course plan to access full chapter mock tests, daily timetables & performance tracking.
                </p>
              </div>
            </div>

            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onNavigate('store')}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer shrink-0 flex items-center gap-1.5"
            >
              Browse Plans <ArrowRight className="w-4 h-4 animate-pulse" />
            </motion.button>
          </motion.div>
        )}

        {/* Roadmap Title & Live Dynamic Stat Chips */}
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-200/80">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-3.5 py-1 bg-emerald-100/90 border border-emerald-300/80 text-emerald-800 rounded-lg text-xs font-black tracking-widest uppercase flex items-center gap-1.5 shadow-xs">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 10, ease: "linear" }}>
                  <Compass className="w-3.5 h-3.5 text-emerald-600" />
                </motion.div>
                Preparation Success Journey
              </span>

              {hasPurchasedPlan ? (
                <span className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-[11px] font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Plan Enrolled: <strong className="text-slate-900">{activePlanName}</strong>
                </span>
              ) : (
                <span className="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-[11px] font-bold flex items-center gap-1">
                  <motion.div animate={{ y: [0, -3, 0], scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                    <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  </motion.div>
                  {user.streak || 1} Day Streak
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-slate-900 flex items-center gap-3">
              Preparation Progress Roadmap
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm max-w-2xl font-medium leading-relaxed">
              {hasPurchasedPlan 
                ? `Live performance milestones tailored to your enrolled plan (${activePlanName}).` 
                : 'Showing baseline diagnostic milestones. Enroll in a course plan to record full exam progress.'}
            </p>
          </div>

          {/* Single Row 3-Columns Stat Chips on Mobile */}
          <div className="grid grid-cols-3 gap-2 w-full lg:w-auto shrink-0">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              animate={{ y: [0, -3, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="p-2 sm:px-4.5 sm:py-3 bg-white/70 border border-emerald-400/60 hover:border-emerald-500 rounded-xl text-center backdrop-blur-xs transition-all shadow-xs flex flex-col items-center justify-center min-w-0"
            >
              <span className="block text-lg sm:text-2xl font-black font-mono text-emerald-600 leading-tight">{syllabusProgress}%</span>
              <span className="text-[9px] sm:text-[10px] font-extrabold text-slate-500 uppercase tracking-tight block truncate w-full">Syllabus</span>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.05 }}
              animate={{ y: [0, -3, 0] }}
              transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut", delay: 0.3 }}
              className="p-2 sm:px-4.5 sm:py-3 bg-white/70 border border-teal-400/60 hover:border-teal-500 rounded-xl text-center backdrop-blur-xs transition-all shadow-xs flex flex-col items-center justify-center min-w-0"
            >
              <span className="block text-lg sm:text-2xl font-black font-mono text-teal-600 leading-tight">{averageScore}%</span>
              <span className="text-[9px] sm:text-[10px] font-extrabold text-slate-500 uppercase tracking-tight block truncate w-full">Avg Score</span>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.05 }}
              animate={{ y: [0, -3, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 0.6 }}
              className="p-2 sm:px-4.5 sm:py-3 bg-white/70 border border-amber-400/60 hover:border-amber-500 rounded-xl text-center backdrop-blur-xs transition-all shadow-xs flex flex-col items-center justify-center min-w-0"
            >
              <span className="block text-lg sm:text-2xl font-black font-mono text-amber-500 leading-tight">{completedTestsCount}</span>
              <span className="text-[9px] sm:text-[10px] font-extrabold text-slate-500 uppercase tracking-tight block truncate w-full font-mono">Completed</span>
            </motion.div>
          </div>
        </div>

        {/* 4 DYNAMIC STAGE NODES — 2 IN A ROW ON MOBILE (grid-cols-2) */}
        <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          
          {/* Stage 01: Course Plan */}
          <motion.div
            variants={itemVariants}
            animate={{ y: [0, -4, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            whileHover={{ y: -6, scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onNavigate('store')}
            className={`p-3.5 sm:p-5 rounded-xl bg-slate-900/10 dark:bg-slate-900/40 backdrop-blur-md border cursor-pointer transition-all flex flex-col justify-between space-y-2.5 sm:space-y-3.5 group ${
              hasPurchasedPlan 
                ? 'border-emerald-500/40 hover:border-emerald-600' 
                : 'border-amber-500/40 hover:border-amber-600'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 bg-emerald-100/80 border border-emerald-300 text-emerald-800 font-mono font-black text-[9px] sm:text-[10px] rounded-md">
                STAGE 01
              </span>
              <motion.div animate={{ rotate: [0, 20, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
                <Sparkles className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${hasPurchasedPlan ? 'text-emerald-600' : 'text-amber-600'}`} />
              </motion.div>
            </div>

            <div>
              <h3 className="font-black text-slate-900 text-xs sm:text-base group-hover:text-emerald-700 transition-colors flex items-center justify-between leading-tight">
                Course Plan <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-emerald-600 hidden sm:inline-block" />
              </h3>
              <p className="text-slate-600 text-[10px] sm:text-xs mt-0.5 sm:mt-1 font-medium truncate">
                {hasPurchasedPlan ? activePlanName : 'No Plan Enrolled'}
              </p>
            </div>

            {/* Animated Progress Bar */}
            <div className="space-y-1">
              <div className="w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: hasPurchasedPlan ? '100%' : '25%' }}
                  transition={{ duration: 1.2, delay: 0.2, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                />
              </div>
              <div className="flex items-center justify-between text-xs pt-0.5">
                <span className="font-bold text-slate-500 text-[9px] sm:text-[11px]">Status</span>
                <span className={`font-extrabold uppercase text-[9px] sm:text-[10px] ${hasPurchasedPlan ? 'text-emerald-600' : 'text-amber-600 animate-pulse'}`}>
                  {hasPurchasedPlan ? 'ENROLLED ⚡' : 'BUY PLAN 🚀'}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Stage 02: Time Tables */}
          <motion.div
            variants={itemVariants}
            animate={{ y: [0, -4, 0] }}
            transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut", delay: 0.3 }}
            whileHover={{ y: -6, scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onNavigate('timetable')}
            className="p-3.5 sm:p-5 rounded-xl bg-slate-900/10 dark:bg-slate-900/40 backdrop-blur-md border border-teal-500/40 hover:border-teal-600 cursor-pointer transition-all flex flex-col justify-between space-y-2.5 sm:space-y-3.5 group"
          >
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 bg-teal-100/80 border border-teal-300 text-teal-800 font-mono font-black text-[9px] sm:text-[10px] rounded-md">
                STAGE 02
              </span>
              <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ repeat: Infinity, duration: 2.5 }}>
                <Calendar className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-teal-600" />
              </motion.div>
            </div>

            <div>
              <h3 className="font-black text-slate-900 text-xs sm:text-base group-hover:text-teal-700 transition-colors flex items-center justify-between leading-tight">
                Daily Timetable <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-teal-600 hidden sm:inline-block" />
              </h3>
              <p className="text-slate-600 text-[10px] sm:text-xs mt-0.5 sm:mt-1 font-medium truncate">
                {todayTimetables.length > 0 ? `${todayTimetables.length} Timetable Slots` : 'Daily Schedule Target'}
              </p>
            </div>

            {/* Animated Progress Bar */}
            <div className="space-y-1">
              <div className="w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: todayTimetables.length > 0 ? '85%' : '40%' }}
                  transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full"
                />
              </div>
              <div className="flex items-center justify-between text-xs pt-0.5">
                <span className="font-bold text-slate-500 text-[9px] sm:text-[11px]">MCQs Goal</span>
                <span className="font-extrabold text-teal-700 uppercase text-[9px] sm:text-[10px] font-mono truncate">
                  {todayTimetables.length > 0 ? `${todayTimetables.reduce((acc, t) => acc + (t.practiceMCQsCount || 0), 0)} MCQs` : 'View Today'}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Stage 03: Subject Chapters */}
          <motion.div
            variants={itemVariants}
            animate={{ y: [0, -4, 0] }}
            transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 0.6 }}
            whileHover={{ y: -6, scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onNavigate('subjects')}
            className="p-3.5 sm:p-5 rounded-xl bg-slate-900/10 dark:bg-slate-900/40 backdrop-blur-md border border-blue-500/40 hover:border-blue-600 cursor-pointer transition-all flex flex-col justify-between space-y-2.5 sm:space-y-3.5 group"
          >
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 bg-blue-100/80 border border-blue-300 text-blue-800 font-mono font-black text-[9px] sm:text-[10px] rounded-md">
                STAGE 03
              </span>
              <BookOpen className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-blue-600 group-hover:scale-110 transition-transform" />
            </div>

            <div>
              <h3 className="font-black text-slate-900 text-xs sm:text-base group-hover:text-blue-700 transition-colors flex items-center justify-between leading-tight">
                Subject Chapters <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-blue-600 hidden sm:inline-block" />
              </h3>
              <p className="text-slate-600 text-[10px] sm:text-xs mt-0.5 sm:mt-1 font-medium truncate">
                {subjects.length > 0 ? `${subjects.length} Subjects Mapped` : 'Syllabus Coverage'}
              </p>
            </div>

            {/* Animated Progress Bar */}
            <div className="space-y-1">
              <div className="w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${syllabusProgress}%` }}
                  transition={{ duration: 1.2, delay: 0.4, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-400 rounded-full"
                />
              </div>
              <div className="flex items-center justify-between text-xs pt-0.5">
                <span className="font-bold text-slate-500 text-[9px] sm:text-[11px]">Coverage</span>
                <span className="font-extrabold text-blue-700 font-mono text-[9px] sm:text-[11px]">{syllabusProgress}%</span>
              </div>
            </div>
          </motion.div>

          {/* Stage 04: Exams & Mocks */}
          <motion.div
            variants={itemVariants}
            animate={{ y: [0, -4, 0] }}
            transition={{ repeat: Infinity, duration: 5.5, ease: "easeInOut", delay: 0.9 }}
            whileHover={{ y: -6, scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onNavigate('tests')}
            className="p-3.5 sm:p-5 rounded-xl bg-slate-900/10 dark:bg-slate-900/40 backdrop-blur-md border border-amber-500/40 hover:border-amber-600 cursor-pointer transition-all flex flex-col justify-between space-y-2.5 sm:space-y-3.5 group"
          >
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 bg-amber-100/80 border border-amber-300 text-amber-800 font-mono font-black text-[9px] sm:text-[10px] rounded-md">
                STAGE 04
              </span>
              <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
                <Award className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-amber-600" />
              </motion.div>
            </div>

            <div>
              <h3 className="font-black text-slate-900 text-xs sm:text-base group-hover:text-amber-700 transition-colors flex items-center justify-between leading-tight">
                Exams & Mocks <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-amber-600 hidden sm:inline-block" />
              </h3>
              <p className="text-slate-600 text-[10px] sm:text-xs mt-0.5 sm:mt-1 font-medium truncate">
                {pendingTests.length > 0 ? `${pendingTests.length} Pending` : 'Evaluations Done'}
              </p>
            </div>

            {/* Animated Progress Bar */}
            <div className="space-y-1">
              <div className="w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${averageScore > 0 ? averageScore : 25}%` }}
                  transition={{ duration: 1.2, delay: 0.5, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-400 rounded-full"
                />
              </div>
              <div className="flex items-center justify-between text-xs pt-0.5">
                <span className="font-bold text-slate-500 text-[9px] sm:text-[11px]">Performance</span>
                <span className="font-extrabold text-amber-700 font-mono text-[9px] sm:text-[11px] truncate">
                  {completedTestsCount > 0 ? `${averageScore}% Avg` : '0 Done'}
                </span>
              </div>
            </div>
          </motion.div>

        </div>

        {/* DUAL REAL-TIME CHARTS WITH ANIMATED DRAW-IN */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-slate-200/80">
          
          {/* PIE / DONUT CHART */}
          <motion.div 
            variants={itemVariants} 
            whileHover={{ scale: 1.015 }}
            className="bg-slate-900/10 dark:bg-slate-900/40 backdrop-blur-md rounded-xl p-5 border border-slate-300/80 flex flex-col justify-between shadow-none transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-emerald-600" />
                <h4 className="font-black text-sm text-slate-900">Preparation Pillar Balance</h4>
              </div>
              <span className="text-[10px] font-bold text-slate-600 bg-slate-200/60 border border-slate-300 px-2.5 py-0.5 rounded-md">
                {hasPurchasedPlan ? 'Live Plan Track' : 'Explorer Mode'}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
              <div className="h-48 w-48 relative shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={roadmapPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={74}
                      paddingAngle={5}
                      dataKey="value"
                      isAnimationActive={true}
                      animationDuration={1400}
                      animationEasing="ease-out"
                    >
                      {roadmapPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" strokeWidth={0} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ background: '#0f172a', borderRadius: '10px', border: '1px solid #10b981', color: '#fff', fontSize: '11px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Donut Center Readout */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.5, type: "spring" }}
                    className="text-2xl font-black text-emerald-700 font-mono"
                  >
                    {syllabusProgress}%
                  </motion.span>
                  <span className="text-[9px] font-bold uppercase text-slate-500 tracking-wider">Overall</span>
                </div>
              </div>

              <div className="space-y-2.5 w-full">
                {roadmapPieData.map((item, idx) => (
                  <motion.div 
                    key={item.name} 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 + idx * 0.1 }}
                    className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-100/60 border border-slate-200/80 hover:border-emerald-400 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                      <span className="font-bold text-slate-800">{item.name}</span>
                    </div>
                    <span className="font-black font-mono text-slate-900">{item.value}%</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* BAR CHART */}
          <motion.div 
            variants={itemVariants} 
            whileHover={{ scale: 1.015 }}
            className="bg-slate-900/10 dark:bg-slate-900/40 backdrop-blur-md rounded-xl p-5 border border-slate-300/80 flex flex-col justify-between shadow-none transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-teal-600" />
                <h4 className="font-black text-sm text-slate-900">Student Milestone Realization</h4>
              </div>
              <span className="text-[10px] font-bold text-teal-800 bg-teal-100/80 px-2 py-0.5 rounded-md border border-teal-300">
                Target vs Achieved
              </span>
            </div>

            <div className="h-48 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roadmapBarData} barGap={6}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" />
                  <XAxis dataKey="name" stroke="#475569" fontSize={10} fontWeight="bold" tickLine={false} />
                  <YAxis stroke="#475569" fontSize={10} fontWeight="bold" tickLine={false} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ background: '#0f172a', borderRadius: '10px', border: '1px solid #14b8a6', color: '#fff', fontSize: '11px' }}
                  />
                  <Bar dataKey="achieved" name="Achieved %" fill="#10b981" radius={[4, 4, 0, 0]} isAnimationActive={true} animationDuration={1400} />
                  <Bar dataKey="target" name="Target %" fill="#94a3b8" radius={[4, 4, 0, 0]} isAnimationActive={true} animationDuration={1400} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

        </div>

      </motion.div>

    </div>
  );
}

