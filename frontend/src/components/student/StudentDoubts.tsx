import React, { useState, useEffect } from 'react';
import { User, Subject, Chapter, Test, TestAttempt } from '../../types';
import { 
  MessageCircle, Send, Clock, CheckCircle2, RefreshCw, 
  HelpCircle, BookOpen, Layers, FileText, Sparkles, Filter, AlertCircle
} from 'lucide-react';
import { fetchMyDoubts, raiseDoubt } from '../../lib/api';

interface DoubtItem {
  _id: string;
  content: string;
  status: 'open' | 'answered' | 'closed';
  adminReply?: string;
  createdAt: string;
}

interface StudentDoubtsProps {
  user: User;
  subjects?: Subject[];
  chapters?: Chapter[];
  tests?: Test[];
  attempts?: TestAttempt[];
}

export default function StudentDoubts({ 
  user, 
  subjects = [], 
  chapters = [], 
  tests = [], 
  attempts = [] 
}: StudentDoubtsProps) {
  const [doubts, setDoubts] = useState<DoubtItem[]>([]);
  const [newDoubt, setNewDoubt] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedChapterId, setSelectedChapterId] = useState<string>('');
  const [selectedAttemptId, setSelectedAttemptId] = useState<string>('');
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchMyDoubts();
      setDoubts(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load doubts history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Chapters filtered by selected subject
  const availableChapters = selectedSubjectId 
    ? chapters.filter(c => c.subjectId === selectedSubjectId)
    : chapters;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoubt.trim()) return;

    setSubmitting(true);
    setError('');
    setSuccessMsg('');

    // Build context tags
    const subjectObj = subjects.find(s => s.id === selectedSubjectId);
    const chapterObj = chapters.find(c => c.id === selectedChapterId);
    const attemptObj = attempts.find(a => (a as any)._id === selectedAttemptId || a.id === selectedAttemptId);
    const testObj = attemptObj ? tests.find(t => (t as any)._id === attemptObj.testId || t.id === attemptObj.testId) : null;

    let fullContent = newDoubt.trim();
    const tags: string[] = [];
    if (subjectObj) tags.push(`Subject: ${subjectObj.name}`);
    if (chapterObj) tags.push(`Chapter: ${chapterObj.name}`);
    if (testObj) tags.push(`Exam: ${testObj.title}`);

    if (tags.length > 0) {
      fullContent = `[📌 CONTEXT: ${tags.join(' | ')}]\n\n${fullContent}`;
    }

    try {
      await raiseDoubt({ content: fullContent, questionId: 'general' });
      setNewDoubt('');
      setSelectedSubjectId('');
      setSelectedChapterId('');
      setSelectedAttemptId('');
      setSuccessMsg('Your doubt has been raised successfully! Our expert faculty will answer shortly.');
      load();
    } catch (e: any) {
      setError(e.message || 'Failed to submit doubt.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-3">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-bold text-slate-500">Loading your academic doubts...</p>
      </div>
    );
  }

  return (
    <div id="student_doubts_section" className="space-y-5 sm:space-y-6 font-sans pb-10 max-w-full overflow-x-hidden">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 shrink-0" />
            Ask Faculty & Clear Doubts
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm font-medium mt-0.5">
            Ask any question from your enrolled subjects, chapters, or attempted exam scorecards.
          </p>
        </div>

        <button
          onClick={load}
          className="px-3.5 py-1.5 bg-slate-900 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1.5 self-start sm:self-auto shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Doubts
        </button>
      </div>

      {/* ─── FORM CARD: RAISE A DOUBT ────────────────────────────────────────── */}
      <div className="p-4 sm:p-6 rounded-lg border border-slate-200 bg-white space-y-4 shadow-2xs">
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 flex-wrap gap-2">
          <h2 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-emerald-600" /> Ask A New Question
          </h2>
          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono font-bold text-[10px] rounded uppercase">
            Direct Faculty Support
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          
          {/* Context Dropdowns Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            
            {/* 1. Subject Selector */}
            <div className="space-y-1">
              <label className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
                <BookOpen className="w-3 h-3 text-emerald-600" /> Subject (Optional)
              </label>
              <select
                value={selectedSubjectId}
                onChange={(e) => {
                  setSelectedSubjectId(e.target.value);
                  setSelectedChapterId('');
                }}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs font-semibold focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
              >
                <option value="">All / General Subject</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* 2. Chapter Selector */}
            <div className="space-y-1">
              <label className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
                <Layers className="w-3 h-3 text-emerald-600" /> Chapter (Optional)
              </label>
              <select
                value={selectedChapterId}
                onChange={(e) => setSelectedChapterId(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs font-semibold focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
              >
                <option value="">All / General Chapter</option>
                {availableChapters.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* 3. Attempted Exam Selector */}
            <div className="space-y-1">
              <label className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
                <FileText className="w-3 h-3 text-emerald-600" /> Attempted Exam (Optional)
              </label>
              <select
                value={selectedAttemptId}
                onChange={(e) => setSelectedAttemptId(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs font-semibold focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
              >
                <option value="">Select Attempted Exam...</option>
                {attempts.map(a => {
                  const aid = (a as any)._id || a.id;
                  const testObj = tests.find(t => (t as any)._id === a.testId || t.id === a.testId);
                  const title = testObj ? testObj.title : 'Practice Test';
                  return (
                    <option key={aid} value={aid}>
                      {title} ({a.score ?? 0} marks)
                    </option>
                  );
                })}
              </select>
            </div>

          </div>

          {/* Doubt Textarea */}
          <div className="space-y-1">
            <label className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
              <HelpCircle className="w-3 h-3 text-emerald-600" /> Detailed Question / Doubt Text
            </label>
            <textarea
              value={newDoubt}
              onChange={(e) => setNewDoubt(e.target.value)}
              placeholder="Describe your question in detail. E.g. 'Can you explain the solution for question 5 regarding projectile velocity?'"
              className="w-full p-3 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs font-medium focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all min-h-[90px] resize-none"
              required
            />
          </div>

          {/* Error / Success Feedback Messages */}
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Submit CTA */}
          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={submitting || !newDoubt.trim()}
              className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs uppercase tracking-wider rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" /> {submitting ? 'Submitting...' : 'Submit Doubt To Faculty'}
            </button>
          </div>

        </form>
      </div>

      {/* ─── DOUBTS HISTORY LIST ──────────────────────────────────────────────── */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <MessageCircle className="w-4 h-4 text-emerald-600" /> Your Raised Doubts ({doubts.length})
          </h3>
        </div>

        {doubts.length === 0 ? (
          <div className="p-8 text-center rounded-lg bg-white border border-slate-200 space-y-2 shadow-2xs">
            <HelpCircle className="w-8 h-8 mx-auto text-slate-400 opacity-60" />
            <p className="font-bold text-xs sm:text-sm text-slate-800">No doubts submitted yet.</p>
            <p className="text-[11px] text-slate-500 font-medium">Use the form above to post any question directly to expert faculty.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {doubts.map((doubt) => (
              <div 
                key={doubt._id} 
                className="p-4 rounded-lg border border-slate-200 hover:border-emerald-500 bg-white space-y-3 transition-all shadow-2xs"
              >
                {/* Header & Status Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-200">
                  <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 font-mono">
                    📅 Raised on {new Date(doubt.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>

                  {doubt.status === 'answered' ? (
                    <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono font-bold text-[10px] rounded uppercase tracking-wider flex items-center gap-1 self-start sm:self-auto">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Answered
                    </span>
                  ) : doubt.status === 'closed' ? (
                    <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 font-mono font-bold text-[10px] rounded uppercase tracking-wider self-start sm:self-auto">
                      Closed
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 bg-amber-50 text-amber-900 border border-amber-200 font-mono font-bold text-[10px] rounded uppercase tracking-wider flex items-center gap-1 self-start sm:self-auto">
                      <Clock className="w-3.5 h-3.5 text-amber-600" /> Pending Faculty Reply
                    </span>
                  )}
                </div>

                {/* Question Content */}
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold leading-relaxed whitespace-pre-line">
                  {doubt.content}
                </div>

                {/* Faculty Response Box */}
                {doubt.adminReply && (
                  <div className="p-3.5 rounded-lg bg-emerald-50/70 border border-emerald-200 space-y-1.5 shadow-2xs">
                    <div className="flex items-center gap-1.5">
                      <span className="p-1 bg-emerald-600 text-white rounded">
                        <Sparkles className="w-3 h-3" />
                      </span>
                      <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider">
                        Faculty Expert Answer
                      </span>
                    </div>
                    <p className="text-xs text-slate-800 font-bold leading-relaxed whitespace-pre-line">
                      {doubt.adminReply}
                    </p>
                  </div>
                )}

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
