import React, { useState, useEffect } from 'react';
import { Subject, Chapter } from '../../../types';
import { Edit2, Trash2, HelpCircle, CheckCircle2, Search, RefreshCw } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function QuestionBankTab({
  subjects,
  chapters,
  competitiveExams,
  questionForm,
  setQuestionForm,
  handleCreateQuestion,
  loading
}: any) {
  const [qTab, setQTab] = useState<'entrance' | 'competitive'>('entrance');
  const [activeView, setActiveView] = useState<'bulk' | 'single'>('bulk');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [bulkSubjectId, setBulkSubjectId] = useState('');
  const [bulkChapterId, setBulkChapterId] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);

  // Filter subjects per tab
  const compExamIds = (competitiveExams || []).map((e: any) => e.id || e._id);
  const tabSubjects = subjects.filter((s: any) => {
    let isComp = false;
    if (s.subjectCategory) {
      isComp = s.subjectCategory === 'competitive';
    } else {
      const exId = s.examId?._id || s.examId || s.examId?.id;
      if (exId && compExamIds.includes(exId)) isComp = true;
      else isComp = /general|knowledge|gk|reasoning|aptitude|current affairs|banking|clat|nda/i.test(s.name || '');
    }
    return qTab === 'competitive' ? isComp : !isComp;
  });

  // Questions list state
  const [questionsList, setQuestionsList] = useState<any[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Selected subject/chapter for viewing list
  const currentSubjectId = bulkSubjectId || questionForm.subjectId;
  const currentChapterId = bulkChapterId || questionForm.chapterId;

  // Fetch questions whenever currentSubjectId or currentChapterId changes
  const fetchQuestions = async () => {
    if (!currentSubjectId && !currentChapterId) {
      setQuestionsList([]);
      return;
    }
    setListLoading(true);
    try {
      let url = `${API_URL}/api/questions?`;
      if (currentSubjectId) url += `subjectId=${currentSubjectId}&`;
      if (currentChapterId) url += `chapterId=${currentChapterId}&`;
      
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (res.ok) {
        setQuestionsList(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch questions:', err);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [currentSubjectId, currentChapterId]);

  const handleBulkUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile || !bulkSubjectId) return;
    
    const formData = new FormData();
    formData.append('file', csvFile);
    formData.append('subjectId', bulkSubjectId);
    if (bulkChapterId) formData.append('chapterId', bulkChapterId);
    
    setBulkLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/questions/bulk-upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Bulk upload failed');
      alert(`🎉 Success! ${data.count} questions uploaded to the Question Bank.`);
      setCsvFile(null);
      fetchQuestions();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setBulkLoading(false);
    }
  };

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingQuestionId) {
      // Update existing question
      try {
        const payload = {
          subjectId: questionForm.subjectId,
          chapterId: questionForm.chapterId,
          content: questionForm.questionText,
          options: [questionForm.oA, questionForm.oB, questionForm.oC, questionForm.oD],
          correctAnswer: `Option ${String.fromCharCode(65 + questionForm.correctAnswerIndex)}`,
          explanation: questionForm.explanation,
          difficulty: questionForm.difficulty
        };
        const res = await fetch(`${API_URL}/api/questions/${editingQuestionId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Failed to update question');
        alert('Question updated successfully!');
        setEditingQuestionId(null);
        setQuestionForm({ id: '', subjectId: questionForm.subjectId, chapterId: questionForm.chapterId, questionText: '', oA: '', oB: '', oC: '', oD: '', correctAnswerIndex: 0, difficulty: 'medium', marks: 4, negativeMarks: 1, explanation: '' });
        fetchQuestions();
      } catch (err: any) {
        alert(err.message);
      }
    } else {
      await handleCreateQuestion(e);
      fetchQuestions();
    }
  };

  const handleEditClick = (q: any) => {
    setEditingQuestionId(q._id || q.id);
    const options = q.options || [];
    let correctIdx = 0;
    if (q.correctAnswer) {
      if (q.correctAnswer.includes('Option A') || q.correctAnswer === options[0]) correctIdx = 0;
      else if (q.correctAnswer.includes('Option B') || q.correctAnswer === options[1]) correctIdx = 1;
      else if (q.correctAnswer.includes('Option C') || q.correctAnswer === options[2]) correctIdx = 2;
      else if (q.correctAnswer.includes('Option D') || q.correctAnswer === options[3]) correctIdx = 3;
    }
    setQuestionForm({
      id: q._id || q.id,
      subjectId: q.subjectId?._id || q.subjectId || '',
      chapterId: q.chapterId?._id || q.chapterId || '',
      questionText: q.content || q.questionText || '',
      oA: options[0] || '',
      oB: options[1] || '',
      oC: options[2] || '',
      oD: options[3] || '',
      correctAnswerIndex: correctIdx,
      difficulty: (q.difficulty || 'medium').toLowerCase(),
      explanation: q.explanation || ''
    });
    setActiveView('single');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteQuestion = async (qId: string) => {
    if (!window.confirm("Are you sure you want to delete this question?")) return;
    try {
      const res = await fetch(`${API_URL}/api/questions/${qId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error('Failed to delete question');
      fetchQuestions();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredQuestions = questionsList.filter(q =>
    !searchTerm || (q.content || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex gap-2 border-b border-slate-200 pb-0">
        <button
          onClick={() => { setQTab('entrance'); setBulkSubjectId(''); setBulkChapterId(''); }}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-sm rounded-t-xl transition-all border-b-2 ${qTab === 'entrance' ? 'border-emerald-600 text-emerald-700 bg-emerald-50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
        >
          🎓 Entrance Exam Questions
        </button>
        <button
          onClick={() => { setQTab('competitive'); setBulkSubjectId(''); setBulkChapterId(''); }}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-sm rounded-t-xl transition-all border-b-2 ${qTab === 'competitive' ? 'border-blue-600 text-blue-700 bg-blue-50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
        >
          🏆 Competitive Exam Questions
        </button>
      </div>

      {/* ── TOP BAR & MODE TOGGLE ── */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-800">
            {qTab === 'entrance' ? 'Entrance Question Bank' : 'Competitive Question Bank'}
          </h3>
          <p className="text-xs text-slate-500 font-medium">Manage, edit, and bulk upload questions per subject and chapter.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => { setActiveView('bulk'); setEditingQuestionId(null); }}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors ${activeView === 'bulk' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            Bulk Upload (CSV)
          </button>
          <button 
            onClick={() => setActiveView('single')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors ${activeView === 'single' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            {editingQuestionId ? '✏️ Edit Question' : '+ Add Single Question'}
          </button>
        </div>
      </div>

      {/* ── BULK UPLOAD FORM ── */}
      {activeView === 'bulk' ? (
        <form onSubmit={handleBulkUpload} className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="space-y-4">
            <div>
              <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Subject</label>
              <select
                value={bulkSubjectId}
                onChange={(e) => {
                  setBulkSubjectId(e.target.value);
                  setBulkChapterId('');
                  setQuestionForm((prev: any) => ({ ...prev, subjectId: e.target.value, chapterId: '' }));
                }}
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                required
              >
                <option value="">Select Subject ({qTab === 'entrance' ? 'Entrance' : 'Competitive'})</option>
                {tabSubjects.map((sub: Subject) => (
                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                ))}
              </select>
            </div>
            {qTab === 'entrance' && (
              <div>
                <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Chapter</label>
                <select
                  value={bulkChapterId}
                  onChange={(e) => {
                    setBulkChapterId(e.target.value);
                    setQuestionForm((prev: any) => ({ ...prev, chapterId: e.target.value }));
                  }}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                  required={qTab === 'entrance'}
                >
                  <option value="">Select Chapter</option>
                  {chapters.filter((c: Chapter) => c.subjectId === bulkSubjectId).map((ch: Chapter) => (
                    <option key={ch.id} value={ch.id}>{ch.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="space-y-4 flex flex-col justify-end">
             <div>
              <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Upload CSV File</label>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none text-xs"
                required
              />
              <p className="text-[10px] text-slate-500 mt-2 font-medium">Columns: Question, Option A, Option B, Option C, Option D, Correct Answer, Explanation, Difficulty</p>
            </div>
            <button
              type="submit"
              disabled={bulkLoading || !csvFile}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold uppercase tracking-wider disabled:opacity-50 text-xs transition-colors cursor-pointer"
            >
              {bulkLoading ? 'Uploading Questions...' : 'Bulk Upload Questions'}
            </button>
          </div>
        </form>
      ) : (
        /* ── SINGLE / EDIT QUESTION FORM ── */
        <form onSubmit={handleSingleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="space-y-4">
            <div>
              <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Subject</label>
              <select
                value={questionForm.subjectId}
                onChange={(e) => setQuestionForm({ ...questionForm, subjectId: e.target.value, chapterId: '' })}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none"
                required
              >
                <option value="">Select Subject ({qTab === 'entrance' ? 'Entrance' : 'Competitive'})</option>
                {tabSubjects.map((sub: Subject) => (
                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                ))}
              </select>
            </div>
            {qTab === 'entrance' && (
              <div>
                <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Chapter</label>
                <select
                  value={questionForm.chapterId}
                  onChange={(e) => setQuestionForm({ ...questionForm, chapterId: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none"
                  required={qTab === 'entrance'}
                >
                  <option value="">Select Chapter</option>
                  {chapters.filter((c: Chapter) => c.subjectId === questionForm.subjectId).map((ch: Chapter) => (
                    <option key={ch.id} value={ch.id}>{ch.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Question Content</label>
              <textarea
                value={questionForm.questionText}
                onChange={(e) => setQuestionForm({ ...questionForm, questionText: e.target.value })}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none h-24"
                placeholder="Enter question text..."
                required
              />
            </div>
            <div>
              <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Answer Explanation</label>
              <textarea
                value={questionForm.explanation}
                onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none h-20"
                placeholder="Explain why correct answer is right..."
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Option A</label>
                <input type="text" value={questionForm.oA} onChange={(e) => setQuestionForm({ ...questionForm, oA: e.target.value })} className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-semibold" required />
              </div>
              <div>
                <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Option B</label>
                <input type="text" value={questionForm.oB} onChange={(e) => setQuestionForm({ ...questionForm, oB: e.target.value })} className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-semibold" required />
              </div>
              <div>
                <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Option C</label>
                <input type="text" value={questionForm.oC} onChange={(e) => setQuestionForm({ ...questionForm, oC: e.target.value })} className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-semibold" required />
              </div>
              <div>
                <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Option D</label>
                <input type="text" value={questionForm.oD} onChange={(e) => setQuestionForm({ ...questionForm, oD: e.target.value })} className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-semibold" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Correct Answer</label>
                <select
                  value={questionForm.correctAnswerIndex}
                  onChange={(e) => setQuestionForm({ ...questionForm, correctAnswerIndex: parseInt(e.target.value, 10) })}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-semibold"
                >
                  <option value={0}>Option A (0)</option>
                  <option value={1}>Option B (1)</option>
                  <option value={2}>Option C (2)</option>
                  <option value={3}>Option D (3)</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Difficulty</label>
                <select
                  value={questionForm.difficulty}
                  onChange={(e) => setQuestionForm({ ...questionForm, difficulty: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-semibold capitalize"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold uppercase tracking-wider cursor-pointer transition-colors"
              >
                {editingQuestionId ? 'Save Changes' : 'Add to Question Bank'}
              </button>
              {editingQuestionId && (
                <button
                  type="button"
                  onClick={() => { setEditingQuestionId(null); setQuestionForm({ id: '', subjectId: '', chapterId: '', questionText: '', oA: '', oB: '', oC: '', oD: '', correctAnswerIndex: 0, difficulty: 'medium', explanation: '' }); }}
                  className="py-3 px-6 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </form>
      )}

      {/* ── EXISTING QUESTIONS LIST & DISPLAY ── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <HelpCircle className="w-6 h-6 text-emerald-600" />
            <div>
              <h4 className="text-lg font-bold text-slate-800">
                Questions in Bank
              </h4>
              <p className="text-xs text-slate-500 font-medium">
                {currentSubjectId ? subjects.find((s: any) => s.id === currentSubjectId)?.name : 'Select a Subject & Chapter above'}
                {currentChapterId && ` → ${chapters.find((c: any) => c.id === currentChapterId)?.name}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search questions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Total Count Badge */}
            <span className="text-xs font-black bg-emerald-100 text-emerald-700 px-3 py-2 rounded-xl flex-shrink-0">
              Total: {questionsList.length}
            </span>

            {/* Refresh */}
            <button
              onClick={fetchQuestions}
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
              title="Refresh list"
            >
              <RefreshCw className={`w-4 h-4 ${listLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* List Body */}
        {!currentSubjectId && !currentChapterId ? (
          <div className="p-12 text-center text-slate-400">
            <HelpCircle className="w-12 h-12 mx-auto mb-3 text-slate-200" />
            <p className="font-bold text-slate-600">
              Select a Subject {qTab === 'entrance' ? 'and Chapter' : ''} above to view its questions.
            </p>
          </div>
        ) : listLoading ? (
          <div className="p-12 text-center text-slate-400 font-medium animate-pulse">
            Loading questions...
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <p className="font-bold text-slate-600">No questions found for this selection.</p>
            <p className="text-xs text-slate-400 mt-1">Upload a CSV file or add questions manually above.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto p-4 space-y-4">
            {filteredQuestions.map((q: any, idx: number) => {
              const options = q.options || [];
              return (
                <div key={q._id || q.id || idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 hover:border-emerald-300 transition-colors">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-start gap-2">
                      <span className="font-black text-slate-400 text-sm">{idx + 1}.</span>
                      <h5 className="font-bold text-slate-800 text-sm leading-relaxed">{q.content}</h5>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                        q.difficulty?.toLowerCase() === 'easy' ? 'bg-green-100 text-green-700' :
                        q.difficulty?.toLowerCase() === 'hard' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {q.difficulty || 'Medium'}
                      </span>
                      <button
                        onClick={() => handleEditClick(q)}
                        className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        title="Edit Question"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(q._id || q.id)}
                        className="p-1.5 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                        title="Delete Question"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Options List */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                    {options.map((opt: string, oIdx: number) => {
                      const optLabel = `Option ${String.fromCharCode(65 + oIdx)}`;
                      const isCorrect = q.correctAnswer?.includes(optLabel) || q.correctAnswer === opt;

                      return (
                        <div
                          key={oIdx}
                          className={`p-2 rounded-lg border font-semibold flex items-center gap-2 ${
                            isCorrect 
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
                              : 'bg-white border-slate-200 text-slate-700'
                          }`}
                        >
                          {isCorrect ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          ) : (
                            <span className="w-4 h-4 rounded-full bg-slate-200 text-[10px] font-bold flex items-center justify-center text-slate-600 flex-shrink-0">
                              {String.fromCharCode(65 + oIdx)}
                            </span>
                          )}
                          <span>{opt}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation if exists */}
                  {q.explanation && (
                    <div className="text-[11px] bg-white p-2 rounded-lg border border-slate-200 text-slate-600 italic">
                      💡 <strong>Explanation:</strong> {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
