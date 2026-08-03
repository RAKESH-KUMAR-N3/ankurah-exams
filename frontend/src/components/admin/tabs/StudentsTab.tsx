import React, { useState, useMemo } from 'react';
import {
  Users, Search, Filter, CheckCircle2, XCircle, Trash2,
  Shield, Sparkles, UserCheck, UserX, RefreshCw, Calendar,
  Mail, Hash
} from 'lucide-react';
import { useAdminContext } from '../../../context/AdminContext';

const API_URL = (import.meta as any).env?.VITE_API_URL || `http://${window.location.hostname}:5000`;
const getToken = () => localStorage.getItem('token');
const authHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` });

export default function StudentsTab() {
  const { students, studentTypes, allPlans, refreshAdminData } = useAdminContext();

  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [loadingId, setLoadingId]     = useState<string | null>(null);
  const [toast, setToast]             = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Filtered ──────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return students.filter((s: any) => {
      const textMatch = !q || s.name?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q);
      const stMatch   = statusFilter === 'all' || (statusFilter === 'active' ? s.isActive !== false : s.isActive === false);
      return textMatch && stMatch;
    });
  }, [students, search, statusFilter]);

  const stats = useMemo(() => ({
    total:    students.length,
    active:   students.filter((s: any) => s.isActive !== false).length,
    inactive: students.filter((s: any) => s.isActive === false).length,
    enrolled: students.filter((s: any) => (s.purchasedPlans || []).length > 0).length,
  }), [students]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const getGroupName = (student: any) => {
    const val = student.studentType;
    const name = typeof val === 'object' && val ? (val as any).name : val;
    const obj  = studentTypes.find((st: any) => (st.id || st._id) === student.studentTypeId || st.name === name);
    return obj ? obj.name : (name || null);
  };

  const getPlanNames = (student: any) => {
    const purchased = student.purchasedPlans || [];
    return purchased.map((p: any) => {
      const found = allPlans.find((pl: any) => (pl.id || pl._id) === (p.planId?._id || p.planId));
      return found ? found.name : 'Course Plan';
    });
  };

  // ── Actions ────────────────────────────────────────────────────────────────
  const doRequest = async (id: string, method: string, path: string, confirmMsg?: string) => {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setLoadingId(id);
    try {
      const res  = await fetch(`${API_URL}/api/student-management/${id}${path}`, { method, headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Request failed');
      showToast(data.message || 'Done', 'ok');
      await refreshAdminData();
    } catch (err: any) {
      showToast(err.message || 'Error', 'err');
    } finally {
      setLoadingId(null);
    }
  };

  const handleActivate   = (id: string) => doRequest(id, 'PUT', '/activate');
  const handleDeactivate = (id: string) => doRequest(id, 'PUT', '/deactivate');
  const handleDelete     = (id: string, name: string) =>
    doRequest(id, 'DELETE', '', `⚠️ Delete student "${name}"? This action cannot be undone.`);

  return (
    <div className="space-y-6 font-sans">

      {/* ── TOAST ───────────────────────────────────────────────────────── */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[9999] px-5 py-3 text-sm font-black uppercase tracking-wider border shadow-2xl flex items-center gap-3 ${
          toast.type === 'ok'
            ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
            : 'bg-rose-950 border-rose-500 text-rose-300'
        }`}>
          {toast.type === 'ok' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <p className="text-[10px] font-mono font-black text-emerald-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> Student Management
          </p>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">Enrolled Students</h1>
          <p className="text-slate-400 text-xs font-bold mt-0.5">Manage student accounts, subscriptions and access.</p>
        </div>
        <button
          onClick={() => refreshAdminData()}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase tracking-wider transition-all border border-slate-700 hover:border-emerald-500 cursor-pointer active:scale-95"
        >
          <RefreshCw className="w-4 h-4 text-emerald-400" /> Refresh
        </button>
      </div>

      {/* ── STATS ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Students', value: stats.total,    color: 'text-white',        border: 'border-slate-800', icon: <Users className="w-4 h-4 text-blue-400" /> },
          { label: 'Active',         value: stats.active,   color: 'text-emerald-400',  border: 'border-emerald-800/40', icon: <UserCheck className="w-4 h-4 text-emerald-400" /> },
          { label: 'Inactive',       value: stats.inactive, color: 'text-rose-400',     border: 'border-rose-900/40', icon: <UserX className="w-4 h-4 text-rose-400" /> },
          { label: 'Plan Enrolled',  value: stats.enrolled, color: 'text-amber-400',    border: 'border-amber-900/40', icon: <Sparkles className="w-4 h-4 text-amber-400" /> },
        ].map(s => (
          <div key={s.label} className={`p-4 bg-slate-950 border ${s.border}`}>
            <div className="flex items-center gap-2 mb-1">{s.icon}<span className="text-[10px] font-mono font-black text-slate-400 uppercase">{s.label}</span></div>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── SEARCH & FILTER ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-700 text-white text-xs font-bold placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          {(['all', 'active', 'inactive'] as const).map(s => (
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

      {/* ── COUNT ────────────────────────────────────────────────────────── */}
      <p className="text-xs font-mono font-bold text-slate-400">
        Showing <span className="text-emerald-400">{filtered.length}</span> of {students.length} students
      </p>

      {/* ── HEADER ROW (label row) ─────────────────────────────────────── */}
      <div className="hidden sm:grid grid-cols-[2fr_1fr_2fr_auto_auto] gap-3 px-4 py-2 bg-slate-900 border border-slate-800 text-[10px] font-mono font-black text-slate-400 uppercase tracking-wider">
        <span>Student</span>
        <span>Group</span>
        <span>Active Plans</span>
        <span>Status</span>
        <span className="text-right">Actions</span>
      </div>

      {/* ── ROWS ─────────────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center bg-slate-950 border border-slate-800">
          <Users className="w-10 h-10 text-slate-700 mx-auto mb-2" />
          <p className="text-slate-400 font-black uppercase text-xs">No students found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((student: any, idx: number) => {
            const id       = student.uid || student._id || student.id;
            const isActive = student.isActive !== false;
            const group    = getGroupName(student);
            const plans    = getPlanNames(student);
            const isLoading = loadingId === id;

            return (
              <div
                key={id}
                className={`bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all p-4 ${isLoading ? 'opacity-40 pointer-events-none' : ''}`}
              >
                {/* TOP ROW: avatar + name + email + status + date */}
                <div className="flex items-start justify-between gap-3 flex-wrap">

                  {/* Left: avatar + info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-700 to-teal-800 flex items-center justify-center text-sm font-black text-white shrink-0 uppercase">
                      {(student.name || 'U')[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-black text-sm truncate">{student.name || '—'}</p>
                      <p className="text-slate-400 font-bold text-[11px] truncate">{student.email || '—'}</p>
                      <p className="text-slate-600 font-mono text-[10px] mt-0.5">
                        {student.createdAt ? new Date(student.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                      </p>
                    </div>
                  </div>

                  {/* Right: status badge */}
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono font-black uppercase border shrink-0 ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                    {isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* MIDDLE ROW: group + plans */}
                <div className="mt-3 flex flex-wrap gap-2 items-center">
                  {group ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-900 border border-slate-700 text-slate-300 font-bold text-[11px]">
                      <Shield className="w-3 h-3 text-emerald-400 shrink-0" /> {group}
                    </span>
                  ) : (
                    <span className="text-slate-600 font-bold text-[11px]">No Group</span>
                  )}

                  {plans.length > 0 ? plans.map((p: string, i: number) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-300 font-bold text-[11px]">
                      <Sparkles className="w-3 h-3 shrink-0 text-amber-400" /> {p}
                    </span>
                  )) : (
                    <span className="text-slate-600 font-bold text-[11px]">No Plan</span>
                  )}
                </div>

                {/* BOTTOM ROW: actions */}
                <div className="mt-3 flex flex-wrap gap-2 pt-3 border-t border-slate-800">
                  {isActive ? (
                    <button
                      onClick={() => handleDeactivate(id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 text-[10px] font-mono font-black uppercase cursor-pointer transition-all"
                    >
                      <UserX className="w-3.5 h-3.5" /> Deactivate
                    </button>
                  ) : (
                    <button
                      onClick={() => handleActivate(id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-black uppercase cursor-pointer transition-all"
                    >
                      <UserCheck className="w-3.5 h-3.5" /> Activate
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(id, student.name)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 text-[10px] font-mono font-black uppercase cursor-pointer transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}

