import React from 'react';
import { User, Timetable, Test, TestAttempt, Subject, Announcement, Notification } from '../types';
import { 
  Flame, Award, Calendar, BookOpen, Clock, FileText, CheckCircle2, 
  TrendingUp, AlertCircle, ArrowRight, BookMarked, Brain, Bell, Volume2, Check
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

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
    try {
      await updateDoc(doc(db, 'notifications', notifId), { isRead: true });
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
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
      <div className="bg-zinc-950 rounded-lg p-6 md:p-8 text-white relative overflow-hidden border border-zinc-800 shadow-geom geom-grid-pattern-dark">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-zinc-900 text-emerald-400 rounded-sm text-[10px] font-bold mb-3 border border-zinc-800 uppercase tracking-wider">
              <Flame className="w-3.5 h-3.5 fill-emerald-400/20" />
              {user.streak || 1} Day Study Streak!
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Welcome back, {user.name}!</h1>
            <p className="mt-2 text-zinc-400 text-xs md:text-sm max-w-xl leading-relaxed">
              Your customized plan for <span className="text-white font-semibold">{user.studentType === 'long_term' ? 'JEE/NEET Long Term' : user.studentType === 'first_year' ? 'Intermediate 1st Year' : 'Intermediate 2nd Year'}</span> (Academic Plan: <span className="capitalize text-emerald-400 font-semibold">{user.studyPlan || 'yearly'}</span>) is fully active. Let's conquer today's schedule!
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <div className="p-4 bg-zinc-900/50 rounded-md border border-zinc-800/80 text-center min-w-[110px]">
              <span className="block text-2xl font-bold font-mono text-emerald-400">{user.streak || 1}</span>
              <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider">Streak Days</span>
            </div>
            <div className="p-4 bg-zinc-900/50 rounded-md border border-zinc-800/80 text-center min-w-[110px]">
              <span className="block text-2xl font-bold font-mono text-blue-400">{averageScore}%</span>
              <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider">Avg. Score</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left major, right side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Timetable, Tests, Progress */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Today's Timetable */}
          <div className="bg-white rounded-lg border border-geom-border p-6 shadow-geom">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-geom-border">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-5 h-5 text-zinc-900" />
                <h2 className="font-bold text-zinc-900 text-base">Today's Study Schedule</h2>
              </div>
              <button 
                onClick={() => onNavigate('timetable')}
                className="text-zinc-900 hover:text-zinc-700 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all"
              >
                View Full Timetable <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {todayTimetables.length === 0 ? (
              <div className="text-center py-10 bg-zinc-50 rounded-md border border-geom-border">
                <BookOpen className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
                <p className="text-zinc-600 text-xs font-semibold">No schedule mapped for today.</p>
                <p className="text-zinc-400 text-[11px] mt-1">Enjoy your day or catch up on study materials!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayTimetables.map((item) => {
                  const subjectObj = subjects.find(s => s.id === item.subjectId);
                  return (
                    <div key={item.id} className="p-4 rounded-md border border-geom-border hover:border-zinc-350 transition-all bg-zinc-50/50 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-zinc-100 text-zinc-800 border border-geom-border font-bold text-[9px] rounded-sm tracking-wider uppercase">
                            {subjectObj ? subjectObj.name : 'General'}
                          </span>
                          <span className="text-zinc-400 text-xs flex items-center gap-1 font-medium">
                            <Clock className="w-3 h-3" /> 1-2 Hours
                          </span>
                        </div>
                        <h3 className="font-bold text-zinc-900 text-sm">{item.title}</h3>
                        <p className="text-zinc-500 text-xs line-clamp-2 leading-relaxed">{item.studyTopic}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 bg-white p-2.5 rounded-sm border border-geom-border text-xs">
                        <div className="text-right">
                          <span className="block font-bold text-zinc-900">{item.practiceMCQsCount} MCQs</span>
                          <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Solve Goal</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Upcoming Available Tests */}
          <div className="bg-white rounded-lg border border-geom-border p-6 shadow-geom">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-geom-border">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-zinc-900" />
                <h2 className="font-bold text-zinc-900 text-base">Pending Evaluations</h2>
              </div>
              <button 
                onClick={() => onNavigate('tests')}
                className="text-zinc-900 hover:text-zinc-700 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all"
              >
                Go to Test Center <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {pendingTests.length === 0 ? (
              <div className="text-center py-10 bg-zinc-50 rounded-md border border-geom-border">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-zinc-700 text-xs font-semibold">You are all caught up!</p>
                <p className="text-zinc-400 text-[11px] mt-1">Excellent job completing all scheduled exams.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingTests.slice(0, 4).map((test) => (
                  <div key={test.id} className="p-4 rounded-md border border-geom-border hover:border-zinc-350 hover:shadow-geom-md bg-white flex flex-col justify-between space-y-4 transition-all">
                    <div>
                      <span className="px-2 py-0.5 bg-zinc-100 text-zinc-800 border border-geom-border font-bold text-[9px] rounded-sm uppercase tracking-wider">
                        {test.type} Test
                      </span>
                      <h3 className="font-bold text-zinc-900 text-sm mt-2 line-clamp-1">{test.title}</h3>
                      <p className="text-zinc-500 text-xs mt-1 line-clamp-2 leading-relaxed">{test.description}</p>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-geom-border text-xs text-zinc-500">
                      <span className="font-medium">{test.duration} mins • {test.totalMarks} Marks</span>
                      <button 
                        onClick={() => onAttemptTest(test)}
                        className="py-1.5 px-3 bg-zinc-900 hover:bg-zinc-850 text-white rounded-sm font-semibold cursor-pointer transition-all"
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
          <div className="bg-white rounded-lg border border-geom-border p-6 shadow-geom">
            <div className="flex items-center gap-2.5 mb-4 pb-4 border-b border-geom-border">
              <Volume2 className="w-5 h-5 text-zinc-900" />
              <h2 className="font-bold text-zinc-900 text-base">Academic Bulletins & Announcements</h2>
            </div>

            {relevantAnnouncements.length === 0 ? (
              <div className="text-center py-8 bg-zinc-50 rounded-md border border-geom-border text-xs text-zinc-400 font-semibold">
                No active announcements for your mapped exam tracks.
              </div>
            ) : (
              <div className="space-y-4">
                {relevantAnnouncements.map((ann) => (
                  <div key={ann.id} className="p-4 rounded-md border border-geom-border bg-zinc-50/40 relative overflow-hidden">
                    <div className="flex items-center justify-between gap-4 flex-wrap mb-1.5">
                      <h4 className="font-extrabold text-zinc-900 text-xs sm:text-sm">{ann.title}</h4>
                      <span className="text-[9px] font-mono font-bold text-zinc-400 bg-white border border-geom-border px-1.5 py-0.5 rounded-sm">
                        {new Date(ann.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-zinc-650 text-xs leading-relaxed">{ann.content}</p>
                    {ann.targetExams && ann.targetExams.length > 0 && (
                      <div className="mt-2.5 flex gap-1.5 flex-wrap">
                        {ann.targetExams.map(exId => (
                          <span key={exId} className="px-1.5 py-0.5 bg-zinc-900 text-white font-bold text-[8px] rounded-xs uppercase tracking-wider">
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
          <div className="bg-white rounded-lg border border-geom-border p-6 shadow-geom flex flex-col justify-between min-h-[320px]">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4.5 h-4.5 text-zinc-900" />
                <h3 className="font-bold text-zinc-900 text-base">Performance Trend</h3>
              </div>
              <p className="text-zinc-400 text-[11px] font-medium leading-normal">Score percentage across chronological test attempts</p>
            </div>

            <div className="h-40 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData.length > 0 ? chartData : defaultChartData}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#18181B" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#18181B" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#E5E5E5" />
                  <XAxis dataKey="name" stroke="#888888" fontSize={9} tickLine={false} />
                  <YAxis stroke="#888888" fontSize={9} tickLine={false} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ background: '#18181B', borderRadius: '4px', border: '1px solid #27272A', color: '#fff' }}
                    labelStyle={{ fontWeight: 'bold', fontSize: '10px', color: '#10b981' }}
                    itemStyle={{ fontSize: '11px' }}
                  />
                  <Area type="monotone" dataKey="score" stroke="#18181B" strokeWidth={2} fillOpacity={1} fill="url(#colorScore)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <button 
              onClick={() => onNavigate('analytics')}
              className="w-full text-center py-2 bg-zinc-50 hover:bg-zinc-100 rounded-sm border border-geom-border text-xs font-bold text-zinc-700 transition-all cursor-pointer mt-3"
            >
              Analyze Chapters Mastery
            </button>
          </div>

          {/* Quick Academic Progress card */}
          <div className="bg-white rounded-lg border border-geom-border p-6 shadow-geom space-y-4">
            <h3 className="font-bold text-zinc-900 text-base flex items-center gap-2">
              <Brain className="w-5 h-5 text-zinc-900" />
              Syllabus Completion
            </h3>
            
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-[9px] font-bold inline-block py-0.5 px-2 uppercase rounded-sm text-zinc-800 bg-zinc-100 border border-geom-border tracking-wider">
                    Syllabus Progress
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-extrabold text-zinc-900 font-mono">
                    {syllabusProgress}%
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-2.5 mb-4 text-xs flex rounded-sm bg-zinc-100 border border-geom-border">
                <div style={{ width: `${syllabusProgress}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-zinc-900 transition-all duration-500"></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div 
                onClick={() => onNavigate('study_materials')}
                className="p-3 bg-zinc-50 hover:bg-zinc-100 border border-geom-border rounded-sm text-center cursor-pointer transition-all"
              >
                <BookMarked className="w-4 h-4 text-zinc-900 mx-auto mb-1" />
                <span className="text-[10px] font-bold text-zinc-700 block uppercase tracking-wider">Notes & PDF</span>
              </div>
              <div 
                onClick={() => onNavigate('tests')}
                className="p-3 bg-zinc-50 hover:bg-zinc-100 border border-geom-border rounded-sm text-center cursor-pointer transition-all"
              >
                <Award className="w-4 h-4 text-zinc-900 mx-auto mb-1" />
                <span className="text-[10px] font-bold text-zinc-700 block uppercase tracking-wider">Practice Exam</span>
              </div>
            </div>
          </div>

          {/* Personal Notifications & Alerts */}
          <div className="bg-white rounded-lg border border-geom-border p-6 shadow-geom space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-geom-border">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-zinc-900" />
                <h3 className="font-bold text-zinc-900 text-sm">Alerts & Notifications</h3>
              </div>
              {studentNotifications.filter(n => !n.isRead).length > 0 && (
                <span className="px-2 py-0.5 bg-zinc-900 text-white font-mono font-extrabold text-[9px] rounded-full">
                  {studentNotifications.filter(n => !n.isRead).length} New
                </span>
              )}
            </div>

            {studentNotifications.length === 0 ? (
              <div className="text-center py-6 text-zinc-400 text-xs font-semibold bg-zinc-50 rounded-md border border-geom-border">
                No active notifications or coordinator alerts.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                {studentNotifications.map((notif) => (
                  <div 
                    key={notif.id} 
                    className={`p-3 rounded-md border text-xs transition-all ${
                      notif.isRead 
                        ? 'bg-zinc-50/50 border-geom-border text-zinc-450' 
                        : 'bg-white border-amber-250 shadow-geom-sm text-zinc-900 font-medium'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <span className="font-bold text-[11px] leading-tight block">{notif.title}</span>
                      {!notif.isRead && (
                        <button 
                          onClick={() => handleMarkAsRead(notif.id)}
                          title="Mark as read"
                          className="p-0.5 rounded-sm bg-zinc-100 hover:bg-zinc-900 hover:text-white text-zinc-500 cursor-pointer transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="text-zinc-500 text-[11px] leading-relaxed">{notif.message}</p>
                    <span className="text-[8px] font-mono font-semibold text-zinc-400 block mt-1.5 uppercase">
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
