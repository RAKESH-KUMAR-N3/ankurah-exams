import React, { useState } from 'react';
import { Edit2, Trash2, BookOpen, ChevronDown, ChevronRight, GraduationCap, Award } from 'lucide-react';
import { Subject, Chapter } from '../../../types';

export default function SubjectsAndChaptersTab({
  subjects,
  chapters,
  subjectForm,
  setSubjectForm,
  chapterForm,
  setChapterForm,
  handleCreateSubject,
  handleCreateChapter,
  handleEditSubjectClick,
  handleDeleteSubject,
  handleDeleteChapter,
  handleEditChapterClick,
  editingSubjectId,
  setEditingSubjectId,
  editingChapterId,
  setEditingChapterId,
  competitiveExams,
  loading
}: any) {
  const [activeTab, setActiveTab] = useState<'entrance' | 'competitive'>('entrance');
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});
  const [activeForm, setActiveForm] = useState<'subject' | 'chapter' | null>(() => {
    const saved = sessionStorage.getItem('ankurah_active_form');
    return (saved as 'subject' | 'chapter' | null) || null;
  });

  const handleSetActiveForm = (val: 'subject' | 'chapter' | null) => {
    setActiveForm(val);
    if (val) sessionStorage.setItem('ankurah_active_form', val);
    else sessionStorage.removeItem('ankurah_active_form');
  };

  const toggleSubject = (subjectId: string) => {
    setExpandedSubjects(prev => ({
      ...prev,
      [subjectId]: !prev[subjectId]
    }));
  };

  // Filter subjects by subjectCategory, examId, or name fallback
  const competitiveExamIds = (competitiveExams || []).map((e: any) => e.id || e._id);
  
  const isCompSubject = (s: any) => {
    if (s.subjectCategory) return s.subjectCategory === 'competitive';
    const examId = s.examId?._id || s.examId || s.examId?.id;
    if (examId && competitiveExamIds.includes(examId)) return true;
    return /general|knowledge|gk|reasoning|aptitude|current affairs|banking|clat|nda/i.test(s.name || '');
  };

  const entranceSubjects = subjects.filter((s: any) => !isCompSubject(s));
  const competitiveSubjects = subjects.filter((s: any) => isCompSubject(s));

  const activeSubjects = activeTab === 'entrance' ? entranceSubjects : competitiveSubjects;

  const handleTabChange = (tab: 'entrance' | 'competitive') => {
    setActiveTab(tab);
    setActiveForm('subject');
    setSubjectForm((prev: any) => ({ ...prev, subjectCategory: tab }));
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Tab Switch */}
      <div className="flex gap-2 border-b border-slate-200 pb-0">
        <button
          onClick={() => handleTabChange('entrance')}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-sm rounded-t-xl transition-all border-b-2 ${activeTab === 'entrance' ? 'border-emerald-600 text-emerald-700 bg-emerald-50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
        >
          <GraduationCap className="w-4 h-4" />
          Entrance Exams
          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">{entranceSubjects.length}</span>
        </button>
        <button
          onClick={() => handleTabChange('competitive')}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-sm rounded-t-xl transition-all border-b-2 ${activeTab === 'competitive' ? 'border-blue-600 text-blue-700 bg-blue-50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
        >
          <Award className="w-4 h-4" />
          Competitive Exams
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{competitiveSubjects.length}</span>
        </button>
      </div>

      {/* Forms Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="flex flex-col gap-6">

          {/* ── CREATE SUBJECT ── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">
                {activeTab === 'entrance' ? '📘 Create Entrance Subject' : '🏛️ Create Competitive Subject'}
              </h3>
            </div>
            <div className="p-6">
              <form onSubmit={handleCreateSubject} className="flex flex-col gap-4 text-xs">
                <div>
                  <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Subject Name</label>
                  <input
                    type="text"
                    placeholder={activeTab === 'entrance' ? 'e.g. Maths 1A (AP)' : 'e.g. General Knowledge (NDA)'}
                    value={subjectForm.name}
                    onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value, subjectCategory: activeTab })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none"
                    required
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`py-2.5 px-6 text-white rounded-xl font-bold uppercase tracking-wider cursor-pointer w-full transition-colors disabled:opacity-50 ${activeTab === 'competitive' ? 'bg-blue-700 hover:bg-blue-800' : 'bg-slate-900 hover:bg-slate-800'}`}
                  >
                    {editingSubjectId ? 'Update Subject' : 'Create Subject'}
                  </button>
                  {editingSubjectId && (
                    <button
                      type="button"
                      onClick={() => { setEditingSubjectId(null); setSubjectForm((prev: any) => ({ ...prev, id: '', name: '', description: '', applicableFor: [], examId: '' })); }}
                      className="py-2.5 px-6 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold uppercase tracking-wider cursor-pointer transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* ── CREATE CHAPTER (ONLY FOR ENTRANCE EXAMS) ── */}
          {activeTab === 'entrance' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <button
                type="button"
                onClick={() => handleSetActiveForm(activeForm === 'chapter' ? null : 'chapter')}
                className={`w-full p-4 flex justify-between items-center text-left transition-colors ${activeForm === 'chapter' ? 'bg-slate-50 border-b border-slate-200' : 'hover:bg-slate-50'}`}
              >
                <h3 className="text-lg font-bold text-slate-800">Create Chapter</h3>
                {activeForm === 'chapter' ? <ChevronDown className="w-5 h-5 text-slate-500" /> : <ChevronRight className="w-5 h-5 text-slate-500" />}
              </button>
              {activeForm === 'chapter' && (
                <div className="p-6">
                  <form onSubmit={handleCreateChapter} className="flex flex-col gap-4 text-xs">
                    <div>
                      <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Select Subject</label>
                      <select
                        value={chapterForm.subjectId}
                        onChange={(e) => {
                          if (!e.target.value) return;
                          setChapterForm({ ...chapterForm, subjectId: e.target.value });
                        }}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none cursor-pointer"
                        required
                      >
                        <option value="">Select Subject</option>
                        {activeSubjects.map((sub: Subject) => (
                          <option key={sub.id} value={sub.id}>{sub.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Chapter Title</label>
                      <input
                        type="text"
                        placeholder="e.g. Algebra"
                        value={chapterForm.name}
                        onChange={(e) => setChapterForm({ ...chapterForm, name: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none"
                        required
                      />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        type="submit"
                        disabled={loading}
                        className="py-2.5 px-6 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold uppercase tracking-wider cursor-pointer w-full transition-colors"
                      >
                        {editingChapterId ? 'Update Chapter' : 'Create Chapter'}
                      </button>
                      {editingChapterId && (
                        <button
                          type="button"
                          onClick={() => { setEditingChapterId(null); setChapterForm((prev: any) => ({ ...prev, id: '', name: '', description: '' })); }}
                          className="py-2.5 px-6 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold uppercase tracking-wider cursor-pointer transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── RIGHT PANEL: Existing Subjects / Chapters ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col">
          {activeForm === 'subject' || activeTab === 'competitive' ? (
            <>
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                <BookOpen className={`w-5 h-5 ${activeTab === 'competitive' ? 'text-blue-600' : 'text-emerald-600'}`} />
                {activeTab === 'entrance' ? 'Entrance Subjects' : 'Competitive Subjects'}
                <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full ml-1">{activeSubjects.length}</span>
              </h3>
              <div className="flex-1 overflow-y-auto space-y-3 max-h-[450px] pr-1">
                {activeSubjects.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 text-sm italic border border-dashed border-slate-300 rounded-xl bg-slate-50">
                    No {activeTab} subjects created yet.
                  </div>
                ) : (
                  activeSubjects.map((sub: Subject) => {
                    const subChapters = chapters.filter((c: Chapter) => c.subjectId === sub.id);
                    return (
                      <div key={sub.id} className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                        <div
                          className="p-4 flex justify-between items-center hover:bg-slate-100 cursor-pointer transition-colors"
                          onClick={() => activeTab === 'entrance' && toggleSubject(sub.id)}
                        >
                          <div className="flex items-center gap-3">
                            {activeTab === 'entrance' && (
                              expandedSubjects[sub.id] ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />
                            )}
                            <div>
                              <h4 className="font-bold text-slate-800 text-sm">{sub.name}</h4>
                              {activeTab === 'entrance' && (
                                <p className="text-xs text-slate-500 mt-0.5">{subChapters.length} chapter{subChapters.length !== 1 ? 's' : ''}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                            <button onClick={() => handleEditSubjectClick(sub)} className="p-2 text-blue-500 hover:bg-blue-100 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => handleDeleteSubject(sub.id)} className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                        {activeTab === 'entrance' && expandedSubjects[sub.id] && (
                          <div className="bg-white p-3 border-t border-slate-200 space-y-1">
                            {subChapters.map((ch: Chapter) => (
                              <div key={ch.id} className="flex justify-between items-center py-2 px-3 hover:bg-slate-50 rounded-lg group">
                                <span className="font-semibold text-slate-700 text-xs truncate mr-2">{ch.name}</span>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => handleEditChapterClick(ch)} className="text-blue-500 hover:bg-blue-100 p-1 rounded transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                                  <button onClick={() => handleDeleteChapter(ch.id)} className="text-red-400 hover:text-red-600 p-1 rounded transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                              </div>
                            ))}
                            {subChapters.length === 0 && (
                              <div className="text-slate-400 italic text-xs py-2 px-3">No chapters yet.</div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
              <BookOpen className="w-16 h-16 text-slate-200 mb-4" />
              <h3 className="text-xl font-bold text-slate-700 mb-2">Manage Academic Structure</h3>
              <p className="text-slate-500 font-medium max-w-sm">Click on 'Create Subject' or 'Create Chapter' to manage your curriculum.</p>
            </div>
          )}

          {activeForm === 'chapter' && (
            <>
              {(() => {
                const subjectChapters = chapters.filter((c: Chapter) => c.subjectId === chapterForm.subjectId);
                return (
                  <>
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-blue-600" /> Existing Chapters
                      </span>
                      {chapterForm.subjectId && (
                        <span className="text-xs font-black bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                          Total: {subjectChapters.length}
                        </span>
                      )}
                    </h3>
                    {!chapterForm.subjectId ? (
                      <div className="text-center py-10 flex flex-col items-center justify-center">
                        <BookOpen className="w-12 h-12 text-slate-200 mb-3" />
                        <p className="text-slate-500 font-medium">Select a subject to view its chapters here.</p>
                      </div>
                    ) : (
                      <div className="flex-1 overflow-y-auto space-y-3 max-h-[400px] pr-2">
                        {subjectChapters.length === 0 ? (
                          <div className="text-center py-6 text-slate-500 text-sm italic border border-dashed border-slate-300 rounded-xl bg-slate-50">
                            No chapters exist for this subject yet.
                          </div>
                        ) : (
                          subjectChapters.map((ch: Chapter) => (
                            <div key={ch.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center hover:bg-slate-100 transition-colors">
                              <h4 className="font-bold text-slate-800 text-sm">{ch.name}</h4>
                              <div className="flex items-center gap-1">
                                <button onClick={() => handleEditChapterClick(ch)} className="p-2 text-blue-500 hover:bg-blue-100 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                                <button onClick={() => handleDeleteChapter(ch.id)} className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </>
                );
              })()}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
