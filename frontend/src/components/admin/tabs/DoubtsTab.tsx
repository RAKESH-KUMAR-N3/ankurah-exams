import React, { useState, useEffect, useMemo } from 'react';
import { 
  HelpCircle, MessageCircle, CheckCircle2, Clock, Send, 
  RefreshCw, Filter, AlertCircle, Sparkles, User as UserIcon, BookOpen, X
} from 'lucide-react';
import { fetchAllDoubts, replyToDoubt, closeDoubt } from '../../../lib/api';

interface PopulatedUser {
  _id?: string;
  name?: string;
  email?: string;
}

interface PopulatedQuestion {
  _id?: string;
  content?: string;
  options?: string[];
  correctAnswer?: string;
  difficulty?: string;
}

interface PopulatedTest {
  _id?: string;
  title?: string;
  testType?: string;
}

interface AdminDoubt {
  _id: string;
  studentId?: PopulatedUser | string;
  questionId?: PopulatedQuestion | string;
  testId?: PopulatedTest | string;
  content: string;
  status: 'open' | 'answered' | 'closed';
  adminReply?: string;
  repliedAt?: string;
  createdAt: string;
}

export default function DoubtsTab() {
  const [doubts, setDoubts] = useState<AdminDoubt[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Reply Form State
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<string>('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadDoubts = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await fetchAllDoubts();
      setDoubts(Array.isArray(data) ? data : data?.data || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch student doubts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoubts();
  }, []);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setErrorMsg(null);
    loadDoubts();
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setSuccessMsg(null);
    setTimeout(() => setErrorMsg(null), 5000);
  };

  // Filtered Doubts
  const filteredDoubts = useMemo(() => {
    return doubts.filter(d => {
      // Filter by Status
      if (statusFilter !== 'all' && d.status !== statusFilter) return false;
      
      // Filter by Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const studentName = typeof d.studentId === 'object' ? d.studentId?.name || '' : '';
        const studentEmail = typeof d.studentId === 'object' ? d.studentId?.email || '' : '';
        const content = d.content || '';
        const testTitle = typeof d.testId === 'object' ? d.testId?.title || '' : '';
        return (
          studentName.toLowerCase().includes(q) ||
          studentEmail.toLowerCase().includes(q) ||
          content.toLowerCase().includes(q) ||
          testTitle.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [doubts, statusFilter, searchQuery]);

  // Statistics
  const openCount = useMemo(() => doubts.filter(d => d.status === 'open').length, [doubts]);
  const answeredCount = useMemo(() => doubts.filter(d => d.status === 'answered').length, [doubts]);
  const closedCount = useMemo(() => doubts.filter(d => d.status === 'closed').length, [doubts]);

  const handleOpenReplyForm = (d: AdminDoubt) => {
    setActiveReplyId(d._id);
    setReplyText(d.adminReply || '');
  };

  const handleSendReply = async (doubtId: string) => {
    if (!replyText.trim()) {
      showError("Please enter an expert faculty answer before submitting.");
      return;
    }

    setSubmittingReply(true);
    try {
      await replyToDoubt(doubtId, replyText.trim());
      showSuccess("Faculty answer submitted and sent to student successfully!");
      setActiveReplyId(null);
      setReplyText('');
    } catch (err: any) {
      showError(err.message || "Failed to submit reply.");
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleMarkClosed = async (doubtId: string) => {
    if (!window.confirm("Are you sure you want to mark this doubt as closed?")) return;
    try {
      await closeDoubt(doubtId);
      showSuccess("Doubt closed successfully.");
    } catch (err: any) {
      showError("Failed to close doubt.");
    }
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* ── HEADER TITLE & REFRESH ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight uppercase flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-emerald-400" /> Student Doubts & Faculty Support
          </h2>
          <p className="text-slate-400 text-xs font-bold mt-1">
            Receive student questions, provide expert faculty solutions, and track resolution status.
          </p>
        </div>

        <button
          onClick={loadDoubts}
          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer rounded-none self-start md:self-auto"
        >
          <RefreshCw className={`w-4 h-4 text-emerald-400 ${loading ? 'animate-spin' : ''}`} /> Refresh Doubts
        </button>
      </div>

      {/* ── ALERTS ── */}
      {successMsg && (
        <div className="bg-emerald-950 border border-emerald-500/40 text-emerald-300 p-3.5 rounded-none flex items-center gap-3 text-xs font-black">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="bg-rose-950 border border-rose-500/40 text-rose-300 p-3.5 rounded-none flex items-center gap-3 text-xs font-black">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ── STATS OVERVIEW CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-none space-y-1">
          <span className="text-[10px] font-mono font-black text-slate-400 uppercase">TOTAL DOUBTS</span>
          <p className="text-2xl font-black text-white">{doubts.length}</p>
        </div>
        <div className="p-4 bg-amber-950/40 border border-amber-500/40 rounded-none space-y-1">
          <span className="text-[10px] font-mono font-black text-amber-400 uppercase flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> PENDING ANSWERS
          </span>
          <p className="text-2xl font-black text-amber-300">{openCount}</p>
        </div>
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-none space-y-1">
          <span className="text-[10px] font-mono font-black text-emerald-400 uppercase flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> ANSWERED / SOLVED
          </span>
          <p className="text-2xl font-black text-emerald-300">{answeredCount}</p>
        </div>
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-none space-y-1">
          <span className="text-[10px] font-mono font-black text-slate-400 uppercase">CLOSED</span>
          <p className="text-2xl font-black text-slate-400">{closedCount}</p>
        </div>
      </div>

      {/* ── FILTER BAR & SEARCH ── */}
      <div className="bg-slate-950 border border-slate-800 rounded-none shadow-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              Student Doubts List ({filteredDoubts.length})
            </h3>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2">
            <input
              type="text"
              placeholder="Search student name, email, question..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="p-2 bg-slate-900 border border-slate-700 rounded-none text-white text-xs font-medium focus:outline-none focus:border-emerald-400 w-full sm:w-64"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-2 bg-slate-900 border border-slate-700 rounded-none text-white font-bold text-xs cursor-pointer focus:outline-none focus:border-emerald-400 w-full sm:w-auto"
            >
              <option value="all">All Statuses ({doubts.length})</option>
              <option value="open">Pending Answers ({openCount})</option>
              <option value="answered">Answered ({answeredCount})</option>
              <option value="closed">Closed ({closedCount})</option>
            </select>
          </div>
        </div>

        {/* ── DOUBTS LIST ── */}
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-mono text-xs font-bold">
            Loading student doubts...
          </div>
        ) : filteredDoubts.length === 0 ? (
          <div className="p-12 text-center bg-slate-900 border border-dashed border-slate-800 text-slate-400 text-xs font-bold">
            No doubts match the selected filter.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDoubts.map((d: AdminDoubt) => {
              const studentName = typeof d.studentId === 'object' ? d.studentId?.name || 'Student' : 'Student';
              const studentEmail = typeof d.studentId === 'object' ? d.studentId?.email || '' : '';
              const isReplying = activeReplyId === d._id;

              return (
                <div key={d._id} className="bg-slate-900 border border-slate-800 rounded-none p-4 space-y-3 hover:border-slate-700 transition-colors">
                  
                  {/* Doubt Header info */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-slate-800 border border-slate-700 rounded-none flex items-center justify-center text-emerald-400 font-black text-xs">
                        <UserIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-white uppercase">{studentName}</h4>
                        <span className="text-[10px] font-mono text-slate-400 block">{studentEmail}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-slate-400 font-bold">
                        📅 {new Date(d.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>

                      {d.status === 'answered' ? (
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[9px] font-mono font-black uppercase">
                          Answered
                        </span>
                      ) : d.status === 'closed' ? (
                        <span className="px-2 py-0.5 bg-slate-800 text-slate-400 border border-slate-700 text-[9px] font-mono font-black uppercase">
                          Closed
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[9px] font-mono font-black uppercase flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Pending Reply
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Student Question Content */}
                  <div className="p-3 bg-slate-950 border border-slate-800 text-white text-xs font-medium whitespace-pre-line leading-relaxed">
                    {d.content}
                  </div>

                  {/* Question details if tied to specific exam question */}
                  {typeof d.questionId === 'object' && d.questionId?.content && (
                    <div className="p-2.5 bg-slate-950/60 border border-slate-800 text-slate-300 text-[11px] font-mono space-y-1">
                      <span className="text-[9px] text-emerald-400 uppercase font-black block">LINKED EXAM QUESTION:</span>
                      <p className="line-clamp-2">{d.questionId.content}</p>
                    </div>
                  )}

                  {/* Existing Admin Reply Box (if answered) */}
                  {d.adminReply && !isReplying && (
                    <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs font-medium space-y-1">
                      <span className="text-[10px] font-mono font-black uppercase text-emerald-400 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" /> Faculty Solution:
                      </span>
                      <p className="whitespace-pre-line leading-relaxed font-bold">{d.adminReply}</p>
                    </div>
                  )}

                  {/* Inline Reply Form (when replying/editing reply) */}
                  {isReplying ? (
                    <div className="p-3 bg-slate-950 border border-emerald-500/60 rounded-none space-y-2">
                      <label className="block text-[10px] font-mono font-black text-emerald-400 uppercase">
                        TYPE EXPERT FACULTY SOLUTION:
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Provide clear step-by-step answer/explanation for the student..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        className="w-full p-2.5 bg-slate-900 border border-slate-700 text-white rounded-none text-xs font-medium focus:outline-none focus:border-emerald-400"
                      />
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => { setActiveReplyId(null); setReplyText(''); }}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-black uppercase cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={submittingReply || !replyText.trim()}
                          onClick={() => handleSendReply(d._id)}
                          className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black uppercase tracking-wider shadow-lg flex items-center gap-1.5 cursor-pointer border border-emerald-400 disabled:opacity-50"
                        >
                          <Send className="w-3.5 h-3.5" /> Submit & Send Answer
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Actions row */
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => handleOpenReplyForm(d)}
                        className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black uppercase tracking-wider cursor-pointer border border-emerald-400 flex items-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" /> {d.adminReply ? 'Edit Answer' : 'Reply to Student'}
                      </button>
                      {d.status !== 'closed' && (
                        <button
                          onClick={() => handleMarkClosed(d._id)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-black uppercase cursor-pointer border border-slate-700"
                        >
                          Mark Closed
                        </button>
                      )}
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
