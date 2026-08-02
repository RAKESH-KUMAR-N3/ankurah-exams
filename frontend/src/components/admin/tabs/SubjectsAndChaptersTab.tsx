import React, { useState } from 'react';
import { Edit2, Trash2, BookOpen, ChevronDown, ChevronRight, GraduationCap, Award } from 'lucide-react';
import { Subject, Chapter } from '../../../types';
import { useAdminContext } from '../../../context/AdminContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const getToken = () => localStorage.getItem('token');
const authHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` });


export default function SubjectsAndChaptersTab() {
  const { subjects, chapters, studentTypes, competitiveExams, entranceExams, isDataLoading, refreshAdminData } = useAdminContext();

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [subjectForm, setSubjectForm] = useState<{ id: string; name: string; examId: string; applicableFor: string[]; description: string; subjectCategory?: string }>({ id: '', name: '', examId: '', applicableFor: [], description: '', subjectCategory: 'entrance' });
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);

  const [chapterForm, setChapterForm] = useState(() => {
    const savedGroup = sessionStorage.getItem('ankurah_chapter_group');
    const savedSubject = sessionStorage.getItem('ankurah_chapter_subject');
    return { id: '', examId: '', studentTypeId: savedGroup || '', subjectId: savedSubject || '', name: '', description: '' };
  });
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setErrorMsg(null);
    refreshAdminData();
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setSuccessMsg(null);
    setTimeout(() => setErrorMsg(null), 5000);
  };

  const handleEditSubjectClick = (sub: Subject) => {
    setSubjectForm({
      id: sub.id,
      name: sub.name,
      examId: sub.examIds?.[0] || '',
      applicableFor: sub.applicableFor?.map((a: any) => a._id || a.id || a) || [],
      description: sub.description || ''
    });
    setEditingSubjectId(sub.id);
    setActiveForm('subject');
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: any = {
        name: subjectForm.name,
        subjectCategory: (subjectForm as any).subjectCategory || 'entrance',
        applicableFor: []
      };
      if (subjectForm.examId && subjectForm.examId.trim()) {
        payload.examId = subjectForm.examId.trim();
      }

      let res;
      if (editingSubjectId) {
        res = await fetch(`${API_URL}/api/subjects/${editingSubjectId}`, {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`${API_URL}/api/subjects`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify(payload)
        });
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || (editingSubjectId ? 'Failed to update subject' : 'Failed to create subject'));
      }

      setSubjectForm(prev => ({ id: '', name: '', examId: '', applicableFor: [], description: '', subjectCategory: (prev as any).subjectCategory || 'entrance' }));
      setEditingSubjectId(null);
      refreshAdminData();
      showSuccess(editingSubjectId ? "Subject updated successfully!" : "Subject created successfully!");
    } catch (err: any) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubject = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this subject?")) return;
    try {
      const res = await fetch(`${API_URL}/api/subjects/${id}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      if (!res.ok) throw new Error('Failed to delete subject');
      refreshAdminData();
      showSuccess("Subject deleted successfully.");
    } catch (err: any) {
      showError(err.message);
    }
  };

  const handleEditChapterClick = (chap: Chapter) => {
    setChapterForm({
      id: chap.id,
      examId: '',
      studentTypeId: '',
      subjectId: chap.subjectId || '',
      name: chap.name,
      description: chap.description || ''
    });
    setEditingChapterId(chap.id);
    setActiveForm('chapter');
  };

  const handleCreateChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let res;
      if (editingChapterId) {
        res = await fetch(`${API_URL}/api/chapters/${editingChapterId}`, {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify({ title: chapterForm.name, subjectId: chapterForm.subjectId })
        });
      } else {
        res = await fetch(`${API_URL}/api/chapters`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ title: chapterForm.name, subjectId: chapterForm.subjectId })
        });
      }
      if (!res.ok) throw new Error(editingChapterId ? 'Failed to update chapter' : 'Failed to create chapter');

      setChapterForm(prev => ({ ...prev, id: '', name: '', description: '' }));
      setEditingChapterId(null);
      refreshAdminData();
      showSuccess(editingChapterId ? "Chapter updated successfully!" : "Chapter created successfully!");
    } catch (err: any) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChapter = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this chapter?")) return;
    try {
      const res = await fetch(`${API_URL}/api/chapters/${id}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      if (!res.ok) throw new Error('Failed to delete chapter');
      refreshAdminData();
      showSuccess("Chapter deleted successfully.");
    } catch (err: any) {
      showError(err.message);
    }
  };

  const [activeTab, setActiveTab] = useState<'entrance' | 'competitive'>(() => {
    const saved = sessionStorage.getItem('ankurah_subject_tab');
    return (saved as 'entrance' | 'competitive') || 'entrance';
  });
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});
  const [activeForm, setActiveForm] = useState<'subject' | 'chapter' | 'topic' | null>(() => {
    const saved = sessionStorage.getItem('ankurah_active_form');
    return (saved as 'subject' | 'chapter' | null) || null;
  });

  const [topicForm, setTopicForm] = useState({ id: '', subjectId: '', chapterId: '', title: '' });
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [loadingTopics, setLoadingTopics] = useState<Record<string, boolean>>({});
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});
  const [topics, setTopics] = useState<Record<string, any[]>>({});
  const [loadingTopicSubmit, setLoadingTopicSubmit] = useState(false);


  const handleSetActiveForm = (val: 'subject' | 'chapter' | 'topic' | null) => {
    setActiveForm(val);
    if (val) sessionStorage.setItem('ankurah_active_form', val);
    else sessionStorage.removeItem('ankurah_active_form');
  };


  const toggleChapter = async (chapterId: string) => {
    const isExpanded = !expandedChapters[chapterId];
    setExpandedChapters(prev => ({ ...prev, [chapterId]: isExpanded }));

    if (isExpanded && !topics[chapterId]) {
      setLoadingTopics(prev => ({ ...prev, [chapterId]: true }));
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/topics/chapter/${chapterId}`, {
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sessionStorage.getItem('token') || localStorage.getItem('token')}` }
        });
        if (res.ok) {
          const data = await res.json();
          setTopics(prev => ({ ...prev, [chapterId]: data.data || data }));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingTopics(prev => ({ ...prev, [chapterId]: false }));
      }
    }
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingTopicSubmit(true);
    try {
      const url = editingTopicId
        ? `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/topics/${editingTopicId}`
        : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/topics`;

      const method = editingTopicId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sessionStorage.getItem('token') || localStorage.getItem('token')}` },
        body: JSON.stringify({ chapterId: topicForm.chapterId, title: topicForm.title })
      });

      if (res.ok) {
        const data = await res.json();
        const savedTopic = data.data || data;

        setTopics(prev => {
          const chapterTopics = prev[topicForm.chapterId] || [];
          if (editingTopicId) {
            return { ...prev, [topicForm.chapterId]: chapterTopics.map(t => t._id === editingTopicId || t.id === editingTopicId ? savedTopic : t) };
          } else {
            return { ...prev, [topicForm.chapterId]: [...chapterTopics, savedTopic] };
          }
        });

        setTopicForm({ id: '', subjectId: '', chapterId: '', title: '' });
        setEditingTopicId(null);
        showSuccess(editingTopicId ? "Topic updated successfully!" : "Topic created successfully!");
      } else {
        const errData = await res.json().catch(() => ({}));
        showError(errData.message || (editingTopicId ? 'Failed to update topic' : 'Failed to create topic'));
      }
    } catch (e: any) {
      console.error(e);
      showError(e.message || 'Error saving topic');
    } finally {
      setLoadingTopicSubmit(false);
    }
  };

  const handleDeleteTopic = async (topicId: string, chapterId: string) => {
    if (!confirm('Are you sure you want to delete this topic?')) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/topics/${topicId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${sessionStorage.getItem('token') || localStorage.getItem('token')}` }
      });
      if (res.ok) {
        setTopics(prev => ({
          ...prev,
          [chapterId]: (prev[chapterId] || []).filter(t => t._id !== topicId && t.id !== topicId)
        }));
        if (editingTopicId === topicId) {
          setEditingTopicId(null);
          setTopicForm({ id: '', subjectId: '', chapterId: '', title: '' });
        }
        showSuccess("Topic deleted successfully.");
      } else {
        showError("Failed to delete topic.");
      }
    } catch (e: any) {
      console.error(e);
      showError(e.message || "Error deleting topic");
    }
  };

  const handleEditTopicClick = (topic: any, chapter: any) => {
    setTopicForm({ id: topic._id || topic.id, subjectId: chapter.subjectId, chapterId: topic.chapterId || chapter.id, title: topic.title });
    setEditingTopicId(topic._id || topic.id);
    setActiveForm('topic');
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
    sessionStorage.setItem('ankurah_subject_tab', tab);
    setActiveForm('subject');
    setSubjectForm((prev: any) => ({ ...prev, subjectCategory: tab }));
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
              <div key={ch.id} className="flex flex-col bg-white border border-slate-100 rounded-lg overflow-hidden">
                <div className="flex justify-between items-center py-1.5 px-2.5 group text-xs cursor-pointer hover:bg-slate-50" onClick={() => toggleChapter(ch.id)}>
                  <div className="flex items-center gap-2 truncate">
                    {expandedChapters[ch.id] ? <ChevronDown className="w-3 h-3 text-slate-400" /> : <ChevronRight className="w-3 h-3 text-slate-400" />}
                    <span className="font-semibold text-slate-700 truncate">{ch.name || (ch as any).title}</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                    <button onClick={() => handleEditChapterClick(ch)} className="text-blue-500 hover:bg-blue-50 p-1 rounded transition-colors"><Edit2 className="w-3 h-3" /></button>
                    <button onClick={() => handleDeleteChapter(ch.id)} className="text-red-400 hover:text-red-600 p-1 rounded transition-colors"><Trash2 className="w-3 h-3" /></button>
                  </div>
                </div>
                {expandedChapters[ch.id] && (
                  <div className="bg-slate-50/50 p-2 border-t border-slate-100 pl-6 space-y-1">
                    {loadingTopics[ch.id] ? (
                      <div className="text-[10px] text-slate-400 italic">Loading topics...</div>
                    ) : (topics[ch.id] || []).length === 0 ? (
                      <div className="text-[10px] text-slate-400 italic">No topics added.</div>
                    ) : (
                      (topics[ch.id] || []).map(topic => (
                        <div key={topic._id || topic.id} className="flex justify-between items-center py-1 px-2 bg-white rounded border border-slate-200 group text-[10px]">
                          <span className="text-slate-600 truncate">{topic.title}</span>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEditTopicClick(topic, ch)} className="text-blue-500 hover:bg-blue-50 p-0.5 rounded"><Edit2 className="w-2.5 h-2.5" /></button>
                            <button onClick={() => handleDeleteTopic(topic._id || topic.id, ch.id)} className="text-red-400 hover:text-red-600 p-0.5 rounded"><Trash2 className="w-2.5 h-2.5" /></button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
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
          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">{isDataLoading ? '...' : entranceSubjects.length}</span>
        </button>
        <button
          onClick={() => handleTabChange('competitive')}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-sm rounded-t-xl transition-all border-b-2 ${activeTab === 'competitive' ? 'border-blue-600 text-blue-700 bg-blue-50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
        >
          <Award className="w-4 h-4" />
          Competitive Exams
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{isDataLoading ? '...' : competitiveSubjects.length}</span>
        </button>
      </div>

      {/* Forms and List Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form Controls */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          {/* ── CREATE SUBJECT ── */}
          {/* ── CREATE SUBJECT ── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => handleSetActiveForm(activeForm === 'subject' ? null : 'subject')}
              className={`w-full p-4 flex justify-between items-center text-left transition-colors ${activeForm === 'subject' ? 'bg-slate-50 border-b border-slate-200' : 'hover:bg-slate-50'}`}
            >
              <h3 className="text-sm font-bold text-slate-800">
                {activeTab === 'entrance' ? '📘 Create Entrance Subject' : '🏛️ Create Competitive Subject'}
              </h3>
              {activeForm === 'subject' ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
            </button>
            {activeForm === 'subject' && (
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
                  {/* State selection removed as subjects are individual */}

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
            )}
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

          {/* ── CREATE TOPIC ── */}
          {activeTab === 'entrance' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <button
                type="button"
                onClick={() => handleSetActiveForm(activeForm === 'topic' ? null : 'topic')}
                className={`w-full p-4 flex justify-between items-center text-left transition-colors ${activeForm === 'topic' ? 'bg-slate-50 border-b border-slate-200' : 'hover:bg-slate-50'}`}
              >
                <h3 className="text-sm font-bold text-slate-800">Create Topic</h3>
                {activeForm === 'topic' ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
              </button>
              {activeForm === 'topic' && (
                <div className="p-5">
                  <form onSubmit={handleCreateTopic} className="flex flex-col gap-4 text-xs">
                    <div>
                      <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Select Subject</label>
                      <select
                        value={topicForm.subjectId}
                        onChange={(e) => setTopicForm({ ...topicForm, subjectId: e.target.value, chapterId: '' })}
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
                      <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Select Chapter</label>
                      <select
                        value={topicForm.chapterId}
                        onChange={(e) => setTopicForm({ ...topicForm, chapterId: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none cursor-pointer disabled:opacity-50"
                        required
                        disabled={!topicForm.subjectId}
                      >
                        <option value="">Select Chapter</option>
                        {chapters.filter((ch: Chapter) => ch.subjectId === topicForm.subjectId).map((ch: Chapter) => (
                          <option key={ch.id} value={ch.id}>{ch.name || (ch as any).title}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Topic Title</label>
                      <input
                        type="text"
                        placeholder="e.g. 1.1 Introduction"
                        value={topicForm.title}
                        onChange={(e) => setTopicForm({ ...topicForm, title: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none"
                        required
                      />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        type="submit"
                        disabled={loadingTopicSubmit}
                        className="py-2.5 px-6 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold uppercase tracking-wider cursor-pointer w-full transition-colors"
                      >
                        {editingTopicId ? 'Update Topic' : 'Create Topic'}
                      </button>
                      {editingTopicId && (
                        <button
                          type="button"
                          onClick={() => { setEditingTopicId(null); setTopicForm({ id: '', subjectId: '', chapterId: '', title: '' }); }}
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
            /* Entrance Exams: Single Entrance Subjects Card */
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 shadow-inner flex flex-col">
              <h3 className="text-base font-bold text-slate-800 mb-3 flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="w-4 h-4 text-emerald-600" /> All Entrance Subjects
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600">
                    {isDataLoading ? '...' : entranceSubjects.length}
                  </span>
                </div>
                {isDataLoading && (
                  <div className="flex flex-col items-center justify-center py-6 text-slate-400">
                    <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                    <p className="text-[10px] italic">Loading subjects...</p>
                  </div>
                )}
              </h3>
              <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[500px] pr-1">
                {!isDataLoading && entranceSubjects.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs italic border border-dashed border-slate-200 rounded-xl bg-white">
                    No entrance subjects created yet.
                  </div>
                ) : (
                  entranceSubjects.map(renderSubjectItem)
                )}
              </div>
            </div>
          ) : (
            /* Competitive Exams: Single Competitive Subjects Card */
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 shadow-inner flex flex-col">
              <h3 className="text-base font-bold text-slate-800 mb-3 flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                  <Award className="w-4 h-4 text-blue-600" /> Competitive Subjects
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-600">
                    {isDataLoading ? '...' : competitiveSubjects.length}
                  </span>
                </div>
                {isDataLoading && (
                  <div className="flex flex-col items-center justify-center py-6 text-slate-400">
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                    <p className="text-[10px] italic">Loading subjects...</p>
                  </div>
                )}
              </h3>
              <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[500px] pr-1">
                {!isDataLoading && competitiveSubjects.length === 0 ? (
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
