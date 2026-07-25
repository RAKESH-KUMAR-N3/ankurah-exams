import React, { useState, useEffect } from 'react';
import { MessageCircle, Send, Clock, CheckCircle2, RefreshCw } from 'lucide-react';
import { fetchMyDoubts, raiseDoubt } from '../../lib/api';

interface DoubtItem {
  _id: string;
  content: string;
  status: 'open' | 'answered' | 'closed';
  adminReply?: string;
  createdAt: string;
}

export default function StudentDoubts({ user }: { user: any }) {
  const [doubts, setDoubts] = useState<DoubtItem[]>([]);
  const [newDoubt, setNewDoubt] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchMyDoubts();
      setDoubts(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load doubts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoubt.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      await raiseDoubt({ content: newDoubt, questionId: 'general' });
      setNewDoubt('');
      load();
    } catch (e: any) {
      setError(e.message || 'Failed to submit doubt');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Ask a doubt */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60">
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-emerald-600" /> Ask a Doubt
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <textarea
            value={newDoubt}
            onChange={(e) => setNewDoubt(e.target.value)}
            placeholder="Type your question or doubt here..."
            className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none resize-none min-h-[120px]"
            required
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" /> {submitting ? 'Submitting...' : 'Submit Doubt'}
            </button>
          </div>
        </form>
      </div>

      {/* Doubts list */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-lg font-bold text-slate-800">Your Doubts</h3>
          <button onClick={load} className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600">
            <RefreshCw size={12} /> Refresh
          </button>
        </div>
        {doubts.length === 0 ? (
          <div className="text-center p-8 text-slate-500 bg-white rounded-xl border border-slate-100">
            You haven't asked any doubts yet.
          </div>
        ) : (
          doubts.map((doubt) => (
            <div key={doubt._id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/60">
              <div className="flex justify-between items-start mb-3">
                <p className="text-sm font-semibold text-slate-800">{doubt.content}</p>
                {doubt.status === 'answered' ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full whitespace-nowrap ml-2">
                    <CheckCircle2 className="w-3 h-3" /> Answered
                  </span>
                ) : doubt.status === 'closed' ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full whitespace-nowrap ml-2">
                    Closed
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-600 px-2.5 py-1 rounded-full whitespace-nowrap ml-2">
                    <Clock className="w-3 h-3" /> Pending
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-400 mb-4">
                Asked on {new Date(doubt.createdAt).toLocaleDateString()}
              </div>

              {doubt.adminReply && (
                <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100">
                  <div className="text-xs font-bold text-emerald-800 mb-1">Expert Response</div>
                  <p className="text-sm text-slate-700">{doubt.adminReply}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
