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
  const [activeTab, setActiveTab] = useState<'entrance' | 'competitive'>(() => {
    const saved = sessionStorage.getItem('ankurah_subject_tab');
    return (saved as 'entrance' | 'competitive') || 'entrance';
  });
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

  // Separate AP & TG Subjects for Entrance Exams
  const apSubjects = entranceSubjects.filter((s: any) => s.state === 'AP' || s.state === 'Both' || !s.state);
  const tgSubjects = entranceSubjects.filter((s: any) => s.state === 'TG' || s.state === 'Both');

  const handleTabChange = (tab: 'entrance' | 'competitive') => {
    setActiveTab(tab);
    sessionStorage.setItem('ankurah_subject_tab', tab);
    setActiveForm('subject');
    setSubjectForm((prev: any) => ({ ...prev, subjectCategory: tab, state: tab === 'competitive' ? undefined : 'Both' }));
  };

  const renderSubjectItem = (sub: Subject) => {
    const subChapters = chapters.filter((c: Chapter) => c.subjectId === sub.id);

    return (
      <div key={sub.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div
          className="p-3.5 flex justify-between items-center hover:bg-slate-50 cursor-pointer transition-colors"
          onClick={() => activeTab === 'entrance' && toggleSubject(sub.id)}
        >
          <div className="flex items-center gap-2.5">
            {activeTab === 'entrance' && (
              expandedSubjects[sub.id] ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
            <div>
              <h4 className="font-bold text-slate-800 text-xs">{sub.name}</h4>
              {activeTab === 'entrance' && (
                <p className="text-[10px] text-slate-400 mt-0.5">{subChapters.length} chapter{subChapters.length !== 1 ? 's' : ''}</p>
              )}
            </div>
          </div>
          <div className="flex gap-1" onClick={e => e.stopPropagation()}>
            <button onClick={() => handleEditSubjectClick(sub)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
            <button onClick={() => handleDeleteSubject(sub.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        </div>
        {activeTab === 'entrance' && expandedSubjects[sub.id] && (
          <div className="bg-slate-50 p-2.5 border-t border-slate-100 space-y-1">
            {subChapters.map((ch: Chapter) => (
              <div key={ch.id} className="flex justify-between items-center py-1.5 px-2.5 bg-white border border-slate-100 rounded-lg group text-xs">
                <span className="font-semibold text-slate-700 truncate mr-2">{ch.name}</span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEditChapterClick(ch)} className="text-blue-500 hover:bg-blue-50 p-1 rounded transition-colors"><Edit2 className="w-3 h-3" /></button>
                  <button onClick={() => handleDeleteChapter(ch.id)} className="text-red-400 hover:text-red-600 p-1 rounded transition-colors"><Trash2 className="w-3 h-3" /></button>
                </div>
              </div>
            ))}
            {subChapters.length === 0 && (
              <div className="text-slate-400 italic text-[10px] py-1 px-2">No chapters yet.</div>
            )}
          </div>
        )}
      </div>
    );
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

      {/* Forms and List Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form Controls */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          {/* ── CREATE SUBJECT ── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-800">
                {activeTab === 'entrance' ? '📘 Create Entrance Subject' : '🏛️ Create Competitive Subject'}
              </h3>
            </div>
            <div className="p-5">
              <form onSubmit={handleCreateSubject} className="flex flex-col gap-4 text-xs">
                <div>
                  <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Subject Name</label>
                  <input
                    type="text"
                    placeholder={activeTab === 'entrance' ? 'e.g. Maths 1A' : 'e.g. General Knowledge'}
                    value={subjectForm.name}
                    onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value, subjectCategory: activeTab })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none"
                    required
                  />
                </div>

                {/* State Selection ONLY for Entrance Exams */}
                {activeTab === 'entrance' && (
                  <div>
                    <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">State</label>
                    <select
                      value={subjectForm.state || 'Both'}
                      onChange={(e) => setSubjectForm({ ...subjectForm, state: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none cursor-pointer"
                    >
                      <option value="Both">Both (AP & TG Separately)</option>
                      <option value="AP">Andhra Pradesh (AP Only)</option>
                      <option value="TG">Telangana (TG Only)</option>
                    </select>
                  </div>
                )}

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
                      onClick={() => { setEditingSubjectId(null); setSubjectForm((prev: any) => ({ ...prev, id: '', name: '', state: 'Both', description: '', applicableFor: [], examId: '' })); }}
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
                <h3 className="text-sm font-bold text-slate-800">Create Chapter</h3>
                {activeForm === 'chapter' ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
              </button>
              {activeForm === 'chapter' && (
                <div className="p-5">
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
                          <option key={sub.id} value={sub.id}>{sub.name} ({sub.state || 'AP'})</option>
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

        {/* Right 2 Columns: Subject Lists */}
        <div className="lg:col-span-2">
          {activeTab === 'entrance' ? (
            /* Entrance Exams: Split AP & TG Subjects */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* AP Subjects Card */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 shadow-inner flex flex-col">
                <h3 className="text-base font-bold text-slate-800 mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-orange-600" /> AP Subjects
                  </span>
                  <span className="text-xs font-black bg-orange-100 text-orange-700 px-2.5 py-0.5 rounded-full">
                    {apSubjects.length}
                  </span>
                </h3>
                <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[500px] pr-1">
                  {apSubjects.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs italic border border-dashed border-slate-200 rounded-xl bg-white">
                      No AP subjects created yet.
                    </div>
                  ) : (
                    apSubjects.map(renderSubjectItem)
                  )}
                </div>
              </div>

              {/* TG Subjects Card */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 shadow-inner flex flex-col">
                <h3 className="text-base font-bold text-slate-800 mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-pink-600" /> TG Subjects
                  </span>
                  <span className="text-xs font-black bg-pink-100 text-pink-700 px-2.5 py-0.5 rounded-full">
                    {tgSubjects.length}
                  </span>
                </h3>
                <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[500px] pr-1">
                  {tgSubjects.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs italic border border-dashed border-slate-200 rounded-xl bg-white">
                      No TG subjects created yet.
                    </div>
                  ) : (
                    tgSubjects.map(renderSubjectItem)
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Competitive Exams: Single Competitive Subjects Card */
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 shadow-inner flex flex-col">
              <h3 className="text-base font-bold text-slate-800 mb-3 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-blue-600" /> Competitive Subjects
                </span>
                <span className="text-xs font-black bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full">
                  {competitiveSubjects.length}
                </span>
              </h3>
              <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[500px] pr-1">
                {competitiveSubjects.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-xs italic border border-dashed border-slate-200 rounded-xl bg-white">
                    No competitive subjects created yet. (e.g. General Knowledge, Reasoning, Aptitude)
                  </div>
                ) : (
                  competitiveSubjects.map(renderSubjectItem)
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
