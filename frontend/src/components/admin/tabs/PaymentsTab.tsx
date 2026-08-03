import React, { useState, useMemo } from 'react';
import { useAdminContext } from '../../../context/AdminContext';
import {
  CreditCard, TrendingUp, CheckCircle2, Clock, XCircle,
  Search, Filter, IndianRupee, User, Calendar, Hash,
  BookOpen, BarChart2, Download
} from 'lucide-react';

export default function PaymentsTab() {
  const { allTransactions } = useAdminContext();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'pending' | 'failed'>('all');

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const successful = allTransactions.filter((t: any) => t.status === 'success');
    const pending    = allTransactions.filter((t: any) => t.status === 'pending');
    const failed     = allTransactions.filter((t: any) => t.status === 'failed');
    const revenue    = successful.reduce((sum: number, t: any) => sum + (Number(t.amount) || 0), 0);
    return { total: allTransactions.length, successful: successful.length, pending: pending.length, failed: failed.length, revenue };
  }, [allTransactions]);

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return allTransactions.filter((t: any) => {
      const q = search.toLowerCase();
      const nameMatch  = t.studentId?.name?.toLowerCase().includes(q);
      const emailMatch = t.studentId?.email?.toLowerCase().includes(q);
      const txnMatch   = t.transactionId?.toLowerCase().includes(q);
      const planMatch  = t.planId?.name?.toLowerCase().includes(q);
      const textMatch  = !q || nameMatch || emailMatch || txnMatch || planMatch;
      const stMatch    = statusFilter === 'all' || t.status === statusFilter;
      return textMatch && stMatch;
    });
  }, [allTransactions, search, statusFilter]);

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const fmtTime = (d: string) => new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const statusConfig: Record<string, { icon: React.ReactNode; badge: string; dot: string }> = {
    success: {
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
      badge: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
      dot: 'bg-emerald-400'
    },
    pending: {
      icon: <Clock className="w-4 h-4 text-amber-400" />,
      badge: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
      dot: 'bg-amber-400'
    },
    failed: {
      icon: <XCircle className="w-4 h-4 text-rose-400" />,
      badge: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
      dot: 'bg-rose-400'
    }
  };

  return (
    <div className="space-y-6 font-sans">

      {/* ── PAGE HEADER ───────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <p className="text-[10px] font-mono font-black text-emerald-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5" /> Revenue & Payments
          </p>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">Transaction History</h1>
          <p className="text-slate-400 text-xs font-bold mt-0.5">All student plan purchases and payment records.</p>
        </div>
        <button
          onClick={() => {
            const csv = [
              ['TXN ID', 'Student', 'Email', 'Plan', 'Amount', 'Date', 'Status'],
              ...allTransactions.map((t: any) => [
                t.transactionId, t.studentId?.name, t.studentId?.email,
                t.planId?.name, t.amount, fmtDate(t.createdAt), t.status
              ])
            ].map(r => r.join(',')).join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url  = URL.createObjectURL(blob);
            const a    = document.createElement('a'); a.href = url; a.download = 'transactions.csv'; a.click();
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black uppercase tracking-wider transition-all border border-emerald-400 shrink-0 cursor-pointer active:scale-95"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* ── STATS CARDS ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Revenue */}
        <div className="lg:col-span-2 p-4 bg-slate-950 border border-emerald-500/40 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/60 to-transparent pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <IndianRupee className="w-5 h-5 text-emerald-400" />
              <span className="text-[10px] font-mono font-black text-emerald-400 uppercase tracking-widest">Total Revenue</span>
            </div>
            <p className="text-3xl font-black text-white">
              ₹{stats.revenue.toLocaleString('en-IN')}
            </p>
            <p className="text-slate-400 text-xs font-bold mt-1">from {stats.successful} successful payments</p>
          </div>
        </div>

        {/* Total Transactions */}
        <div className="p-4 bg-slate-950 border border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <BarChart2 className="w-4 h-4 text-blue-400" />
            <span className="text-[10px] font-mono font-black text-slate-400 uppercase">Total</span>
          </div>
          <p className="text-2xl font-black text-white">{stats.total}</p>
          <p className="text-slate-500 text-[11px] font-bold mt-0.5">All Transactions</p>
        </div>

        {/* Successful */}
        <div className="p-4 bg-slate-950 border border-emerald-800/40">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] font-mono font-black text-emerald-400 uppercase">Success</span>
          </div>
          <p className="text-2xl font-black text-emerald-400">{stats.successful}</p>
          <p className="text-slate-500 text-[11px] font-bold mt-0.5">Confirmed Payments</p>
        </div>

        {/* Pending / Failed */}
        <div className="p-4 bg-slate-950 border border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] font-mono font-black text-amber-400 uppercase">Pending</span>
          </div>
          <p className="text-2xl font-black text-amber-400">{stats.pending}</p>
          <p className="text-slate-500 text-[11px] font-bold mt-0.5">
            + <span className="text-rose-400">{stats.failed} Failed</span>
          </p>
        </div>
      </div>

      {/* ── SEARCH & FILTER BAR ───────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by student name, email, transaction ID or plan..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-700 text-white text-xs font-bold placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          {(['all', 'success', 'pending', 'failed'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 text-[10px] font-mono font-black uppercase tracking-wider border transition-all cursor-pointer ${
                statusFilter === s
                  ? 'bg-emerald-500 text-black border-emerald-400'
                  : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-emerald-500/50 hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* ── RESULTS COUNT ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-mono font-bold text-slate-400">
          Showing <span className="text-emerald-400">{filtered.length}</span> of {allTransactions.length} transactions
        </p>
      </div>

      {/* ── TRANSACTION CARDS ────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="p-16 text-center bg-slate-950 border border-slate-800">
          <CreditCard className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <p className="text-white font-black uppercase text-sm">No Transactions Found</p>
          <p className="text-slate-400 text-xs font-bold mt-1">Try adjusting your search or filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((txn: any, idx: number) => {
            const cfg = statusConfig[txn.status] || statusConfig['pending'];
            return (
              <div
                key={txn._id || idx}
                className="bg-slate-950 border border-slate-800 hover:border-slate-600 transition-all p-4"
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">

                  {/* ── Serial + Status dot ── */}
                  <div className="hidden lg:flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 border border-slate-700 text-xs font-mono font-black text-slate-400 shrink-0">
                    {idx + 1}
                  </div>

                  {/* ── Student Info ── */}
                  <div className="flex items-center gap-3 lg:w-48 shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-sm font-black text-white shrink-0 uppercase">
                      {(txn.studentId?.name || 'U')[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-black text-sm truncate">{txn.studentId?.name || '—'}</p>
                      <p className="text-slate-400 text-[11px] font-bold truncate">{txn.studentId?.email || '—'}</p>
                    </div>
                  </div>

                  {/* ── Plan Details ── */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <p className="text-white font-black text-xs truncate">{txn.planId?.name || 'Unknown Plan'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Hash className="w-3 h-3 text-slate-500 shrink-0" />
                      <p className="text-slate-400 text-[10px] font-mono font-bold truncate">{txn.transactionId || '—'}</p>
                    </div>
                    {txn.planId?.examId && (
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono font-black text-slate-500 uppercase">Exam:</span>
                        <span className="text-[9px] font-mono text-emerald-400 font-bold truncate">{txn.planId?.examId}</span>
                      </div>
                    )}
                  </div>

                  {/* ── Amount ── */}
                  <div className="shrink-0 text-center lg:text-right">
                    <div className="flex items-center gap-1 justify-center lg:justify-end">
                      <IndianRupee className="w-3.5 h-3.5 text-white" />
                      <p className="text-white font-black text-lg">{Number(txn.amount || 0).toLocaleString('en-IN')}</p>
                    </div>
                    <p className="text-slate-400 text-[10px] font-bold">Payment Amount</p>
                  </div>

                  {/* ── Date & Time ── */}
                  <div className="shrink-0 text-center lg:text-right">
                    <div className="flex items-center gap-1 justify-center lg:justify-end">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <p className="text-white font-bold text-xs">{txn.createdAt ? fmtDate(txn.createdAt) : '—'}</p>
                    </div>
                    <p className="text-slate-500 text-[10px] font-mono font-bold mt-0.5">
                      {txn.createdAt ? fmtTime(txn.createdAt) : ''}
                    </p>
                  </div>

                  {/* ── Status Badge ── */}
                  <div className="shrink-0 flex items-center justify-center lg:justify-end">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono font-black uppercase tracking-wider ${cfg.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} animate-pulse`} />
                      {txn.status || 'unknown'}
                    </span>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
