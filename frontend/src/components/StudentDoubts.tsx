import React, { useState, useEffect } from 'react';
import { Doubt } from '../types';
import { MessageCircle, Send, Clock, CheckCircle2 } from 'lucide-react';

export default function StudentDoubts({ user }: { user: any }) {
  const [doubts, setDoubts] = useState<Doubt[]>([]);
  const [newDoubt, setNewDoubt] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock fetch doubts
    setTimeout(() => {
      setDoubts([
        {
          _id: 'd1',
          studentId: user?.uid,
          content: 'I am unable to understand the concept of relative velocity in 2D. Can you explain with an example?',
          status: 'answered',
          answer: 'Sure! Imagine you are in a moving train. To you, the objects inside are stationary, but to an observer outside, they are moving. We will upload a detailed video on this soon.',
          answeredAt: new Date().toISOString(),
          createdAt: new Date(Date.now() - 86400000).toISOString()
        },
        {
          _id: 'd2',
          studentId: user?.uid,
          content: 'In the mock test, Q15 has two options that look correct. Is it a multiple choice question?',
          status: 'open',
          createdAt: new Date().toISOString()
        }
      ]);
      setLoading(false);
    }, 800);
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoubt.trim()) return;

    // Optimistic UI update
    const doubt: Doubt = {
      _id: `temp_${Date.now()}`,
      studentId: user?.uid,
      content: newDoubt,
      status: 'open',
      createdAt: new Date().toISOString()
    };
    setDoubts([doubt, ...doubts]);
    setNewDoubt('');
    // In real app, make API call to save
  };

  if (loading) {
    return <div className="flex items-center justify-center p-12"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60">
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-emerald-600" /> Ask a Doubt
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <textarea
            value={newDoubt}
            onChange={(e) => setNewDoubt(e.target.value)}
            placeholder="Type your question or doubt here... (e.g. Can you explain question 5 from the recent test?)"
            className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none resize-none min-h-[120px]"
            required
          />
          <div className="flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4" /> Submit Doubt
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-800 px-1">Your Doubts</h3>
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
                  <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full">
                    <CheckCircle2 className="w-3 h-3" /> Answered
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-600 px-2.5 py-1 rounded-full">
                    <Clock className="w-3 h-3" /> Pending
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-400 mb-4">
                Asked on {new Date(doubt.createdAt).toLocaleDateString()}
              </div>
              
              {doubt.answer && (
                <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100">
                  <div className="text-xs font-bold text-emerald-800 mb-1 flex items-center gap-1">
                    Expert Response
                  </div>
                  <p className="text-sm text-slate-700">{doubt.answer}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
