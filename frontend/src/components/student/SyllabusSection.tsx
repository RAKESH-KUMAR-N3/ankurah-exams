import React, { useState, useEffect } from 'react';
import { User, Subject, Chapter, Topic, Test } from '../../types';
import { BookOpen, ChevronDown, ChevronRight, FileText, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
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
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);
  const [topics, setTopics] = useState<Record<string, Topic[]>>({});
  const [loadingTopics, setLoadingTopics] = useState<Record<string, boolean>>({});

  const toggleSubject = (subjectId: string) => {
    setExpandedSubject(expandedSubject === subjectId ? null : subjectId);
    setExpandedChapter(null); // reset chapter when changing subject
  };

  const toggleChapter = async (chapterId: string) => {
    if (expandedChapter === chapterId) {
      setExpandedChapter(null);
      return;
    }
    setExpandedChapter(chapterId);

    // Fetch topics for this chapter if not already fetched
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

  // Group chapters by subject
  const getChaptersForSubject = (subjectId: string) => chapters.filter(c => c.subjectId === subjectId);
  const getTestsForChapter = (chapterId: string) => tests.filter(t => t.chapterId === chapterId);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-100 p-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800">My Syllabus</h2>
            <p className="text-slate-500 text-xs mt-1">Browse topics and tests for your enrolled courses</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {subjects.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-slate-100">
            <p className="text-slate-500">No subjects found for your purchased plans.</p>
          </div>
        ) : (
          subjects.map(subject => (
            <div key={subject.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <button 
                onClick={() => toggleSubject(subject.id)}
                className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {expandedSubject === subject.id ? (
                    <ChevronDown className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  )}
                  <h3 className="text-lg font-bold text-slate-800">{subject.name}</h3>
                </div>
              </button>
              
              {expandedSubject === subject.id && (
                <div className="bg-slate-50 border-t border-slate-200 p-4 space-y-3">
                  {getChaptersForSubject(subject.id).length === 0 ? (
                    <p className="text-slate-500 text-sm italic">No chapters available.</p>
                  ) : (
                    getChaptersForSubject(subject.id).map(chapter => (
                      <div key={chapter.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                        <button 
                          onClick={() => toggleChapter(chapter.id)}
                          className="w-full p-3 flex items-center justify-between hover:bg-slate-50"
                        >
                          <div className="flex items-center gap-2">
                            {expandedChapter === chapter.id ? (
                              <ChevronDown className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-400" />
                            )}
                            <span className="font-semibold text-slate-700 text-sm">{chapter.name}</span>
                          </div>
                        </button>
                        
                        {expandedChapter === chapter.id && (
                          <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-4">
                            {/* Topics List */}
                            <div>
                              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Topics List</h4>
                              {loadingTopics[chapter.id] ? (
                                <p className="text-slate-400 text-xs animate-pulse">Loading topics...</p>
                              ) : topics[chapter.id]?.length > 0 ? (
                                <ul className="space-y-2">
                                  {topics[chapter.id].map((topic, i) => (
                                    <li key={topic._id || topic.id || i} className="flex items-start gap-2 text-sm text-slate-700 bg-white p-2.5 rounded-lg border border-slate-100">
                                      <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                                      <span>{topic.title}</span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-slate-400 text-xs italic">No topics listed for this chapter yet.</p>
                              )}
                            </div>

                            {/* Chapter Tests */}
                            <div className="pt-2 border-t border-slate-200">
                              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Chapter Tests</h4>
                              {getTestsForChapter(chapter.id).length > 0 ? (
                                <div className="space-y-2">
                                  {getTestsForChapter(chapter.id).map(test => (
                                    <div key={test.id} className="flex items-center justify-between p-3 bg-white border border-emerald-100 rounded-lg shadow-sm">
                                      <div className="flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-emerald-600" />
                                        <div>
                                          <p className="text-sm font-bold text-slate-800">{test.title}</p>
                                          <p className="text-[10px] text-slate-500">{test.duration} mins • {test.targetDifficulty || 'Mixed'}</p>
                                        </div>
                                      </div>
                                      <button 
                                        onClick={() => navigate('/dashboard/tests')}
                                        className="text-xs font-bold px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-md hover:bg-emerald-200 transition-colors"
                                      >
                                        Go to Exam
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-slate-400 text-xs italic">No tests assigned to this chapter yet.</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
