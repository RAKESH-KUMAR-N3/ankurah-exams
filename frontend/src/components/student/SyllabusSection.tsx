import React, { useState } from 'react';
import { User, Subject, Chapter, Topic, Test } from '../../types';
import { 
  BookOpen, 
  ChevronRight, 
  FileText, 
  CheckCircle, 
  ArrowLeft, 
  Sparkles, 
  Layers, 
  Atom, 
  FlaskConical, 
  Leaf, 
  Dna, 
  Calculator, 
  GraduationCap,
  Play
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getApiUrl } from '../../lib/api';

const API_URL = getApiUrl();
const getToken = () => localStorage.getItem('token');
const authHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` });

interface SyllabusSectionProps {
  user: User;
  subjects: Subject[];
  chapters: Chapter[];
  tests: Test[];
  studentTypes: any[];
}

export default function SyllabusSection({ user, subjects, chapters, tests }: SyllabusSectionProps) {
  const navigate = useNavigate();
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [topics, setTopics] = useState<Record<string, Topic[]>>({});
  const [loadingTopics, setLoadingTopics] = useState<Record<string, boolean>>({});

  // Automatically scroll to top whenever subject or chapter selection changes
  React.useEffect(() => {
    window.scrollTo(0, 0);
    const mainEl = document.querySelector('main');
    if (mainEl) mainEl.scrollTop = 0;
  }, [selectedSubjectId, selectedChapterId]);

  const handleChapterClick = async (chapterId: string) => {
    setSelectedChapterId(chapterId);
    window.scrollTo(0, 0);
    const mainEl = document.querySelector('main');
    if (mainEl) mainEl.scrollTop = 0;

    if (!topics[chapterId]) {
      setLoadingTopics(prev => ({ ...prev, [chapterId]: true }));
      try {
        const res = await fetch(`${API_URL}/api/topics/chapter/${chapterId}`, { headers: authHeaders() });
        if (res.ok) {
          const data = await res.json();
          setTopics(prev => ({ ...prev, [chapterId]: data }));
        }
      } catch (err) {
        console.error('Failed to load topics', err);
      } finally {
        setLoadingTopics(prev => ({ ...prev, [chapterId]: false }));
      }
    }
  };

  const getChaptersForSubject = (subjectId: string) => chapters.filter(c => c.subjectId === subjectId);
  const getTestsForChapter = (chapterId: string) => tests.filter(t => t.chapterId === chapterId);

  // Subject aesthetic themes helper
  const getSubjectTheme = (name: string, index: number) => {
    const lower = name.toLowerCase();
    if (lower.includes('physic')) {
      return {
        icon: Atom,
        bg: 'from-blue-600/20 via-cyan-500/10 to-transparent',
        border: 'border-cyan-500/40 hover:border-cyan-400',
        badge: 'bg-cyan-500/10 border-cyan-400/40 text-cyan-700',
        iconBg: 'bg-cyan-500/20 text-cyan-600 border-cyan-400/30',
        accentColor: 'text-cyan-600'
      };
    }
    if (lower.includes('chem')) {
      return {
        icon: FlaskConical,
        bg: 'from-emerald-600/20 via-teal-500/10 to-transparent',
        border: 'border-emerald-500/40 hover:border-emerald-400',
        badge: 'bg-emerald-500/10 border-emerald-400/40 text-emerald-700',
        iconBg: 'bg-emerald-500/20 text-emerald-600 border-emerald-400/30',
        accentColor: 'text-emerald-600'
      };
    }
    if (lower.includes('botany') || lower.includes('bio') || lower.includes('plant')) {
      return {
        icon: Leaf,
        bg: 'from-green-600/20 via-emerald-500/10 to-transparent',
        border: 'border-green-500/40 hover:border-green-400',
        badge: 'bg-green-500/10 border-green-400/40 text-green-700',
        iconBg: 'bg-green-500/20 text-green-600 border-green-400/30',
        accentColor: 'text-green-600'
      };
    }
    if (lower.includes('zoo') || lower.includes('anim')) {
      return {
        icon: Dna,
        bg: 'from-rose-600/20 via-pink-500/10 to-transparent',
        border: 'border-rose-500/40 hover:border-rose-400',
        badge: 'bg-rose-500/10 border-rose-400/40 text-rose-700',
        iconBg: 'bg-rose-500/20 text-rose-600 border-rose-400/30',
        accentColor: 'text-rose-600'
      };
    }
    if (lower.includes('math')) {
      return {
        icon: Calculator,
        bg: 'from-indigo-600/20 via-purple-500/10 to-transparent',
        border: 'border-indigo-500/40 hover:border-indigo-400',
        badge: 'bg-indigo-500/10 border-indigo-400/40 text-indigo-700',
        iconBg: 'bg-indigo-500/20 text-indigo-600 border-indigo-400/30',
        accentColor: 'text-indigo-600'
      };
    }
    // Fallback themes
    const fallbacks = [
      { icon: GraduationCap, bg: 'from-purple-600/20 to-transparent', border: 'border-purple-400/40 hover:border-purple-400', badge: 'bg-purple-500/10 text-purple-700', iconBg: 'bg-purple-500/20 text-purple-600', accentColor: 'text-purple-600' },
      { icon: BookOpen, bg: 'from-amber-600/20 to-transparent', border: 'border-amber-400/40 hover:border-amber-400', badge: 'bg-amber-500/10 text-amber-700', iconBg: 'bg-amber-500/20 text-amber-600', accentColor: 'text-amber-600' },
    ];
    return fallbacks[index % fallbacks.length];
  };

  const selectedSubject = subjects.find(s => s.id === selectedSubjectId);
  const selectedSubjectChapters = selectedSubjectId ? getChaptersForSubject(selectedSubjectId) : [];
  const selectedChapter = chapters.find(c => c.id === selectedChapterId);
  const selectedChapterIndex = selectedSubjectChapters.findIndex(c => c.id === selectedChapterId);

  return (
    <div className="space-y-6 font-sans pb-10">
      <AnimatePresence mode="wait">
        
        {/* ─── LEVEL 1: ALL SUBJECTS GRID VIEW ───────────────────────────── */}
        {!selectedSubjectId && (
          <motion.div
            key="subjects-grid"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Header Box */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                  <BookOpen className="w-7 h-7 text-emerald-600" />
                  My Syllabus & Subjects
                </h1>
                <p className="text-slate-600 text-xs sm:text-sm font-medium mt-1">
                  Click on any subject card to view its complete chapter list.
                </p>
              </div>

              <div className="px-3.5 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-black self-start sm:self-auto flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                {subjects.length} Enrolled Subjects
              </div>
            </div>

            {/* Subjects Cards Grid */}
            {subjects.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-slate-900/10 border border-slate-300/80 backdrop-blur-md">
                <p className="text-slate-600 font-bold">No subjects found for your enrolled course plans.</p>
                <p className="text-slate-500 text-xs mt-1">Please visit Plans page to subscribe to a course.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {subjects.map((subject, idx) => {
                  const theme = getSubjectTheme(subject.name, idx);
                  const IconComp = theme.icon;
                  const chapterList = getChaptersForSubject(subject.id);
                  let totalTestsCount = 0;
                  chapterList.forEach(c => {
                    totalTestsCount += getTestsForChapter(c.id).length;
                  });

                  return (
                    <motion.div
                      key={subject.id}
                      whileHover={{ y: -6, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setSelectedSubjectId(subject.id);
                        setSelectedChapterId(null);
                        window.scrollTo(0, 0);
                        const mainEl = document.querySelector('main');
                        if (mainEl) mainEl.scrollTop = 0;
                      }}
                      className={`rounded-2xl p-5 border bg-gradient-to-br ${theme.bg} ${theme.border} backdrop-blur-md cursor-pointer transition-all flex flex-col justify-between space-y-5 shadow-sm group hover:shadow-md relative overflow-hidden`}
                    >
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${theme.iconBg} shadow-xs`}>
                            <IconComp className="w-6 h-6" />
                          </div>

                          <span className={`px-2.5 py-1 rounded-lg border font-mono font-extrabold text-[11px] ${theme.badge}`}>
                            {chapterList.length} Chapters
                          </span>
                        </div>

                        <div>
                          <h3 className="text-xl font-black text-slate-900 tracking-tight leading-snug group-hover:text-emerald-700 transition-colors">
                            {subject.name}
                          </h3>
                          <p className="text-xs text-slate-500 font-medium mt-1">
                            Comprehensive syllabus notes, chapter topics & chapter mock exams.
                          </p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs font-black text-slate-700">
                        <span className="flex items-center gap-1.5 text-slate-500 font-bold">
                          <Layers className="w-3.5 h-3.5 text-slate-400" />
                          {totalTestsCount} Practice Tests
                        </span>

                        <span className="flex items-center gap-1 text-emerald-600 font-black group-hover:translate-x-1 transition-transform">
                          Open Chapters <ChevronRight className="w-4 h-4" />
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* ─── LEVEL 2: SUBJECT CHAPTERS LIST PAGE ───────────────────────────── */}
        {selectedSubjectId && !selectedChapterId && (
          <motion.div
            key="chapters-list-page"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Navigation Bar — Fixed responsive layout for Mobile */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-200/80 pb-3 sm:pb-4">
              <button
                onClick={() => {
                  setSelectedSubjectId(null);
                  window.scrollTo(0, 0);
                  const mainEl = document.querySelector('main');
                  if (mainEl) mainEl.scrollTop = 0;
                }}
                className="self-start px-3.5 py-2 bg-slate-900 hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs flex items-center gap-2 shrink-0 active:scale-95"
              >
                <ArrowLeft className="w-4 h-4 text-emerald-400 shrink-0" /> Back to Subjects
              </button>

              <span className="text-[11px] sm:text-xs font-black text-slate-600 uppercase tracking-wider truncate">
                {selectedSubject?.name} • Chapter List
              </span>
            </div>

            {/* Subject Banner */}
            {selectedSubject && (
              <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-r from-emerald-950/20 via-teal-950/10 to-slate-900/30 border border-emerald-500/40 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-600 shrink-0">
                    <BookOpen className="w-6 h-6 sm:w-7 sm:h-7" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      {selectedSubject.name}
                    </h2>
                    <p className="text-xs font-medium text-slate-600 mt-0.5">
                      Click any chapter below to open study notes & practice exams.
                    </p>
                  </div>
                </div>

                <span className="px-3 py-1 bg-emerald-600 text-white font-mono font-black text-xs rounded-xl shadow-xs self-start sm:self-auto">
                  {selectedSubjectChapters.length} Total Chapters
                </span>
              </div>
            )}

            {/* Chapters List Cards */}
            <div className="space-y-3 pt-1">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600" /> Click a Chapter to Open Details Page
              </h3>

              {selectedSubjectChapters.length === 0 ? (
                <div className="p-8 text-center rounded-xl bg-slate-900/10 border border-slate-300/80">
                  <p className="text-slate-500 text-xs font-bold">No chapters listed for this subject yet.</p>
                </div>
              ) : (
                selectedSubjectChapters.map((chapter, index) => {
                  const chapterTests = getTestsForChapter(chapter.id);

                  return (
                    <motion.div
                      key={chapter.id}
                      whileHover={{ y: -3, scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => handleChapterClick(chapter.id)}
                      className="p-4 sm:p-5 rounded-2xl border border-slate-300/80 hover:border-emerald-500 bg-slate-900/5 hover:bg-emerald-500/10 backdrop-blur-md cursor-pointer transition-all flex items-center justify-between gap-3 shadow-xs group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-700 font-mono font-black text-xs sm:text-sm flex items-center justify-center shrink-0">
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <h4 className="text-sm sm:text-base font-black text-slate-900 tracking-tight group-hover:text-emerald-700 transition-colors truncate">
                            {chapter.name}
                          </h4>
                          <p className="text-[11px] sm:text-xs font-bold text-slate-500 mt-0.5">
                            {chapterTests.length} Practice Tests
                          </p>
                        </div>
                      </div>

                      <span className="text-[11px] sm:text-xs font-extrabold text-emerald-700 bg-emerald-100/90 px-2.5 py-1.5 rounded-xl border border-emerald-200 group-hover:bg-emerald-600 group-hover:text-white transition-colors shrink-0">
                        Open Page ➔
                      </span>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}

        {/* ─── LEVEL 3: DEDICATED CHAPTER DETAIL PAGE ───────────────────────────── */}
        {selectedSubjectId && selectedChapterId && selectedChapter && (
          <motion.div
            key="chapter-detail-single-page"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Top Navigation Bar — Fixed responsive layout for Mobile */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-200/80 pb-3 sm:pb-4">
              <button
                onClick={() => {
                  setSelectedChapterId(null);
                  window.scrollTo(0, 0);
                  const mainEl = document.querySelector('main');
                  if (mainEl) mainEl.scrollTop = 0;
                }}
                className="self-start px-3.5 py-2 bg-slate-900 hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs flex items-center gap-2 shrink-0 active:scale-95"
              >
                <ArrowLeft className="w-4 h-4 text-emerald-400 shrink-0" /> Back to Chapters
              </button>

              <span className="text-[11px] sm:text-xs font-black text-slate-600 uppercase tracking-wider truncate">
                {selectedSubject?.name} • Chapter {selectedChapterIndex + 1}
              </span>
            </div>

            {/* Chapter Hero Title Banner */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/20 via-teal-950/10 to-slate-900/30 border-2 border-emerald-500/50 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-4">
                <span className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-mono font-black text-lg flex items-center justify-center shrink-0 shadow-md">
                  {selectedChapterIndex + 1}
                </span>
                <div>
                  <span className="text-[10px] font-black uppercase text-emerald-700 tracking-widest block">
                    {selectedSubject?.name} • CHAPTER DETAILS
                  </span>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    {selectedChapter.name}
                  </h2>
                </div>
              </div>

              <span className="px-3.5 py-1.5 bg-emerald-100 border border-emerald-300 text-emerald-800 font-mono font-extrabold text-xs rounded-xl self-start sm:self-auto">
                {getTestsForChapter(selectedChapter.id).length} Assigned Exams
              </span>
            </div>

            {/* SECTION A: CHAPTER DESCRIPTION & SYLLABUS NOTES CARD */}
            <div className="p-6 rounded-2xl border border-slate-300/80 bg-slate-900/10 backdrop-blur-md space-y-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-600" /> Chapter Overview & Description
                </h3>
                <span className="px-2.5 py-0.5 bg-emerald-100/90 text-emerald-800 border border-emerald-300 font-mono font-extrabold text-[10px] rounded-md uppercase">
                  Official Syllabus
                </span>
              </div>

              {/* Description Content */}
              <div className="p-4 rounded-xl bg-white/90 border border-slate-200 text-slate-800 text-xs sm:text-sm font-medium leading-relaxed shadow-xs">
                {selectedChapter.description ? (
                  <p className="whitespace-pre-line">{selectedChapter.description}</p>
                ) : (
                  <p>
                    This chapter covers foundational concepts, theoretical principles, numerical problem-solving methods, and exam-oriented high-weightage topics for {selectedSubject?.name}.
                  </p>
                )}
              </div>

              {/* Topics Breakdown */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-600" /> Key Topics & Syllabus Points
                </h4>

                {loadingTopics[selectedChapter.id] ? (
                  <div className="p-4 text-xs font-bold text-slate-500 animate-pulse">
                    Loading chapter topics...
                  </div>
                ) : (topics[selectedChapter.id] || []).length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {(topics[selectedChapter.id] || []).map((topic, i) => (
                      <div key={topic._id || topic.id || i} className="p-3.5 rounded-xl bg-white border border-slate-200/90 flex items-start gap-2.5 text-xs font-bold text-slate-800 shadow-xs">
                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[10px] font-mono text-emerald-700 block font-extrabold">Topic {i + 1}</span>
                          <span className="text-slate-800">{topic.title}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-xs font-medium italic">No specific topics listed for this chapter yet.</p>
                )}
              </div>
            </div>

            {/* SECTION B: ASSIGNED PRACTICE EXAM CARDS */}
            <div className="space-y-3.5 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" /> Practice Exams for {selectedChapter.name}
                </h3>
                <span className="text-xs font-extrabold text-slate-500">
                  {getTestsForChapter(selectedChapter.id).length} Tests
                </span>
              </div>

              {getTestsForChapter(selectedChapter.id).length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {getTestsForChapter(selectedChapter.id).map(test => (
                    <motion.div 
                      key={test.id} 
                      whileHover={{ y: -3, scale: 1.01 }}
                      className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/20 via-teal-950/10 to-slate-900/40 border-2 border-emerald-500/80 backdrop-blur-md flex flex-col justify-between gap-4 shadow-md ring-2 ring-emerald-500/10"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-700 border border-emerald-500/40 font-mono font-black text-[10px] rounded-md uppercase tracking-wider">
                            Chapter Mock Exam
                          </span>
                          <span className="text-xs font-bold text-slate-600">
                            ⏱️ {test.duration} Mins
                          </span>
                        </div>

                        <h4 className="text-base font-black text-slate-900 tracking-tight">
                          {test.title}
                        </h4>

                        <p className="text-xs font-medium text-slate-600">
                          Target Level: <span className="font-bold text-slate-800">{test.targetDifficulty || 'Mixed Difficulty'}</span> • Instant AI Score Analysis
                        </p>
                      </div>

                      <button 
                        onClick={() => navigate('/dashboard/tests')}
                        className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs rounded-xl uppercase tracking-wider shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 group"
                      >
                        Start Practice Exam <Play className="w-3.5 h-3.5 fill-white group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-xl bg-slate-900/10 border border-slate-300/80 text-center">
                  <p className="text-slate-500 text-xs font-bold">No practice tests assigned to this chapter currently.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
