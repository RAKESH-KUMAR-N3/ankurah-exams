import React from 'react';
import { User, Timetable, Test, TestAttempt, Subject, Announcement, Notification } from '../types';
import { 
  Flame, Award, Calendar, BookOpen, Clock, FileText, CheckCircle2, 
  TrendingUp, AlertCircle, ArrowRight, BookMarked, Brain, Bell, Volume2, Check
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface StudentDashboardProps {
  user: User;
  timetables: Timetable[];
  availableTests: Test[];
  attempts: TestAttempt[];
  subjects: Subject[];
  announcements: Announcement[];
  notifications: Notification[];
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
  const averageScore = completedTestsCount > 0 
    ? Math.round(attempts.reduce((acc, curr) => acc + curr.percentage, 0) / completedTestsCount)
    : 0;
  
  // Calculate general progress (dummy for visuals or derived from completed timetables/tests)
  const syllabusProgress = completedTestsCount > 0 ? Math.min(15 + completedTestsCount * 12, 95) : 15;

  // Filter announcements for this student
  const relevantAnnouncements = announcements.filter(ann => {
    if (!ann.targetExams || ann.targetExams.length === 0) return true;
    const userExams = [...(user.selectedEntranceExams || []), ...(user.selectedCompetitiveExams || [])];
    return ann.targetExams.some(id => userExams.includes(id));
  });

  // Filter notifications for this student
  const studentNotifications = notifications.filter(n => n.userId === user.uid || n.userId === 'all' || !n.userId);

  const handleMarkAsRead = async (notifId: string) => {
    // Mark as read via backend (non-critical, fire and forget)
    const token = localStorage.getItem('token');
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/notifications/${notifId}/read`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
  };

  // 4. Format chart data from attempts
  const chartData = attempts
    .sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime())
    .map((attempt, index) => {
      const test = availableTests.find(t => t.id === attempt.testId);
      return {
        name: `Test ${index + 1}`,
        title: test ? test.title.substring(0, 15) + '...' : `Attempt ${index + 1}`,
        score: Math.round(attempt.percentage)
      };
    });

  // Default values if no chart data
  const defaultChartData = [
    { name: 'Diagnostic', score: 45 },
    { name: 'Practice 1', score: 60 },
    { name: 'Weekly 1', score: 72 },
    { name: 'Practice 2', score: 85 }
  ];

  return (
    <div id="student_dashboard" className="space-y-6 font-sans">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 rounded-2xl p-8 text-white relative overflow-hidden border border-emerald-700/30 shadow-[0_15px_30px_-5px_rgba(16,185,129,0.25)]">
        {/* Subtle decorative circles */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-750/40 text-emerald-300 rounded-lg text-xs font-bold mb-4 border border-emerald-500/30 uppercase tracking-wider">
              <Flame className="w-4 h-4 fill-emerald-400" />
              {user.streak || 1} Day Study Streak!
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white">Welcome back, {user.name}!</h1>
            <p className="mt-3 text-emerald-100/90 text-sm md:text-base max-w-xl leading-relaxed font-semibold">
              Your customized plan for <span className="text-white font-bold">{user.studentType === 'long_term' ? 'JEE/NEET Long Term' : user.studentType === 'first_year' ? 'Intermediate 1st Year' : 'Intermediate 2nd Year'}</span> (Academic Plan: <span className="capitalize text-emerald-300 font-bold">{user.studyPlan || 'yearly'}</span>) is fully active. Let's conquer today's schedule!
            </p>
          </div>
          <div className="flex gap-4 shrink-0">
            <div className="p-6 bg-white/10 rounded-2xl border border-white/20 text-center min-w-[140px] backdrop-blur-md shadow-inner">
              <span className="block text-5xl md:text-6xl font-black font-mono text-white tracking-tight">{user.streak || 1}</span>
              <span className="text-xs text-emerald-100 uppercase font-black tracking-wider block mt-1">Streak Days</span>
            </div>
            <div className="p-6 bg-white/10 rounded-2xl border border-white/20 text-center min-w-[140px] backdrop-blur-md shadow-inner">
              <span className="block text-5xl md:text-6xl font-black font-mono text-white tracking-tight">{averageScore}%</span>
              <span className="text-xs text-emerald-100 uppercase font-black tracking-wider block mt-1">Avg. Score</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left major, right side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Timetable, Tests, Progress */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Today's Timetable */}
          <div className="bg-white rounded-2xl border border-geom-border p-6 md:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-geom-border">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-6 h-6 text-emerald-600" />
                <h2 className="font-extrabold text-zinc-900 text-xl">Today's Study Schedule</h2>
              </div>
              <button 
                onClick={() => onNavigate('timetable')}
                className="text-emerald-600 hover:text-emerald-700 text-sm font-extrabold flex items-center gap-1 cursor-pointer transition-all"
              >
                View Full Timetable <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {todayTimetables.length === 0 ? (
              <div className="text-center py-12 bg-zinc-50/50 rounded-2xl border border-geom-border">
                <BookOpen className="w-10 h-10 text-zinc-400 mx-auto mb-3" />
                <p className="text-zinc-700 text-sm font-bold">No schedule mapped for today.</p>
                <p className="text-zinc-500 text-xs font-medium mt-1">Enjoy your day or catch up on study materials!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {todayTimetables.map((item) => {
                  const subjectObj = subjects.find(s => s.id === item.subjectId);
                  return (
                    <div key={item.id} className="p-5 rounded-2xl border border-geom-border hover:border-emerald-500/40 hover:shadow-xs transition-all bg-zinc-50/30 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 font-extrabold text-[11px] rounded-lg tracking-wider uppercase">
                            {subjectObj ? subjectObj.name : 'General'}
                          </span>
                          <span className="text-zinc-500 text-xs flex items-center gap-1 font-bold">
                            <Clock className="w-3.5 h-3.5" /> 1-2 Hours
                          </span>
                        </div>
                        <h3 className="font-extrabold text-zinc-900 text-base md:text-lg">{item.title}</h3>
                        <p className="text-zinc-650 text-sm leading-relaxed">{item.studyTopic}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 bg-white p-3.5 rounded-xl border border-geom-border text-sm">
                        <div className="text-right">
                          <span className="block font-black text-emerald-700 text-base">{item.practiceMCQsCount} MCQs</span>
                          <span className="text-[10px] text-zinc-450 font-black uppercase tracking-wider">Solve Goal</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Upcoming Available Tests */}
          <div className="bg-white rounded-2xl border border-geom-border p-6 md:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-geom-border">
              <div className="flex items-center gap-2.5">
                <FileText className="w-6 h-6 text-emerald-600" />
                <h2 className="font-extrabold text-zinc-900 text-xl">Pending Evaluations</h2>
              </div>
              <button 
                onClick={() => onNavigate('tests')}
                className="text-emerald-600 hover:text-emerald-700 text-sm font-extrabold flex items-center gap-1 cursor-pointer transition-all"
              >
                Go to Test Center <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {pendingTests.length === 0 ? (
              <div className="text-center py-12 bg-zinc-50/50 rounded-2xl border border-geom-border">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                <p className="text-zinc-700 text-sm font-bold">You are all caught up!</p>
                <p className="text-zinc-500 text-xs font-medium mt-1">Excellent job completing all scheduled exams.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingTests.slice(0, 4).map((test) => (
                  <div key={test.id} className="p-5 rounded-2xl border border-geom-border hover:border-emerald-500/40 hover:shadow-md bg-white flex flex-col justify-between space-y-4 transition-all">
                    <div>
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 font-extrabold text-[11px] rounded-lg uppercase tracking-wider">
                        {test.type} Test
                      </span>
                      <h3 className="font-black text-zinc-900 text-base md:text-lg mt-3 line-clamp-1">{test.title}</h3>
                      <p className="text-zinc-650 text-sm mt-1.5 line-clamp-2 leading-relaxed">{test.description}</p>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-geom-border text-sm text-zinc-500">
                      <span className="font-bold text-zinc-700">{test.duration} mins • {test.totalMarks} Marks</span>
                      <button 
                        onClick={() => onAttemptTest(test)}
                        className="py-2 px-4.5 bg-emerald-600 hover:bg-emerald-750 text-white rounded-xl font-bold cursor-pointer transition-all shadow-sm"
                      >
                        Start Test
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Academic Bulletins & Announcements */}
          <div className="bg-white rounded-2xl border border-geom-border p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-geom-border">
              <Volume2 className="w-6 h-6 text-emerald-600" />
              <h2 className="font-extrabold text-zinc-900 text-xl">Academic Bulletins & Announcements</h2>
            </div>

            {relevantAnnouncements.length === 0 ? (
              <div className="text-center py-8 bg-zinc-50 rounded-2xl border border-geom-border text-sm text-zinc-400 font-bold">
                No active announcements for your mapped exam tracks.
              </div>
            ) : (
              <div className="space-y-4">
                {relevantAnnouncements.map((ann) => (
                  <div key={ann.id} className="p-5 rounded-2xl border border-geom-border bg-zinc-50/40 relative overflow-hidden">
                    <div className="flex items-center justify-between gap-4 flex-wrap mb-2">
                      <h4 className="font-black text-zinc-900 text-sm sm:text-base">{ann.title}</h4>
                      <span className="text-[10px] font-mono font-black text-emerald-700 bg-white border border-geom-border px-2 py-0.5 rounded-lg">
                        {new Date(ann.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-zinc-650 text-sm leading-relaxed">{ann.content}</p>
                    {ann.targetExams && ann.targetExams.length > 0 && (
                      <div className="mt-3 flex gap-2 flex-wrap">
                        {ann.targetExams.map(exId => (
                          <span key={exId} className="px-2 py-0.5 bg-emerald-600 text-white font-extrabold text-[9px] rounded-md uppercase tracking-wider">
                            {exId}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right 1 Col: Score chart, Streak, Quick Links */}
        <div className="space-y-6">
          
          {/* Performance Trend chart */}
          <div className="bg-white rounded-2xl border border-geom-border p-6 md:p-8 shadow-sm flex flex-col justify-between min-h-[340px]">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-zinc-900 text-xl">Performance Trend</h3>
              </div>
              <p className="text-zinc-500 text-sm font-semibold leading-normal">Score percentage across chronological test attempts</p>
            </div>

            <div className="h-44 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData.length > 0 ? chartData : defaultChartData}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#E5E5E5" />
                  <XAxis dataKey="name" stroke="#888888" fontSize={10} fontWeight="bold" tickLine={false} />
                  <YAxis stroke="#888888" fontSize={10} fontWeight="bold" tickLine={false} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ background: '#064e3b', borderRadius: '12px', border: '1px solid #047857', color: '#fff' }}
                    labelStyle={{ fontWeight: 'black', fontSize: '11px', color: '#34d399' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="score" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <button 
              onClick={() => onNavigate('analytics')}
              className="w-full text-center py-3 bg-zinc-55 hover:bg-zinc-100 rounded-xl border border-geom-border text-xs font-black text-zinc-700 transition-all cursor-pointer mt-4 uppercase tracking-wider"
            >
              Analyze Chapters Mastery
            </button>
          </div>

          {/* Quick Academic Progress card */}
          <div className="bg-white rounded-2xl border border-geom-border p-6 md:p-8 shadow-sm space-y-4">
            <h3 className="font-extrabold text-zinc-900 text-xl flex items-center gap-2">
              <Brain className="w-5 h-5 text-emerald-600" />
              Syllabus Completion
            </h3>
            
            <div className="relative pt-1">
              <div className="flex mb-3 items-center justify-between">
                <div>
                  <span className="text-[10px] font-black inline-block py-1 px-2.5 uppercase rounded-lg text-emerald-700 bg-emerald-50 border border-emerald-100 tracking-wider">
                    Syllabus Progress
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-emerald-600 font-mono">
                    {syllabusProgress}%
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-3 mb-4 text-xs flex rounded-lg bg-zinc-100 border border-geom-border">
                <div style={{ width: `${syllabusProgress}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-emerald-600 transition-all duration-500"></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div 
                onClick={() => onNavigate('study_materials')}
                className="p-4 bg-zinc-50 hover:bg-zinc-100 border border-geom-border rounded-xl text-center cursor-pointer transition-all"
              >
                <BookMarked className="w-5 h-5 text-emerald-600 mx-auto mb-1.5" />
                <span className="text-[11px] font-black text-zinc-700 block uppercase tracking-wider">Notes & PDF</span>
              </div>
              <div 
                onClick={() => onNavigate('tests')}
                className="p-4 bg-zinc-50 hover:bg-zinc-100 border border-geom-border rounded-xl text-center cursor-pointer transition-all"
              >
                <Award className="w-5 h-5 text-emerald-600 mx-auto mb-1.5" />
                <span className="text-[11px] font-black text-zinc-700 block uppercase tracking-wider">Practice Exam</span>
              </div>
            </div>
          </div>

          {/* Personal Notifications & Alerts */}
          <div className="bg-white rounded-2xl border border-geom-border p-6 md:p-8 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-geom-border">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-zinc-900 text-lg">Alerts & Notifications</h3>
              </div>
              {studentNotifications.filter(n => !n.isRead).length > 0 && (
                <span className="px-2 py-0.5 bg-emerald-600 text-white font-mono font-extrabold text-[10px] rounded-full">
                  {studentNotifications.filter(n => !n.isRead).length} New
                </span>
              )}
            </div>

            {studentNotifications.length === 0 ? (
              <div className="text-center py-6 text-zinc-400 text-sm font-bold bg-zinc-50 rounded-2xl border border-geom-border">
                No coordinator alerts.
              </div>
            ) : (
              <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                {studentNotifications.map((notif) => (
                  <div 
                    key={notif.id} 
                    className={`p-4 rounded-xl border text-xs transition-all ${
                      notif.isRead 
                        ? 'bg-zinc-50/50 border-geom-border text-zinc-450' 
                        : 'bg-white border-emerald-500/35 shadow-xs text-zinc-900 font-bold'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2 mb-1.5">
                      <span className="font-black text-xs leading-tight block text-slate-800">{notif.title}</span>
                      {!notif.isRead && (
                        <button 
                          onClick={() => handleMarkAsRead(notif.id)}
                          title="Mark as read"
                          className="p-1 rounded-md bg-emerald-50 hover:bg-emerald-650 hover:text-white text-emerald-700 cursor-pointer transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="text-zinc-500 text-xs leading-relaxed">{notif.message}</p>
                    <span className="text-[9px] font-mono font-semibold text-zinc-400 block mt-2 uppercase">
                      {new Date(notif.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • {new Date(notif.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
