import React from 'react';
import { Shield, Database, TrendingUp, DollarSign, Check, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';

import { useAdminContext } from '../../../context/AdminContext';

export default function DashboardOverviewTab({ 
  successMsg,
  errorMsg
}: any) {
  const { dashboardStats, students, questions, tests, timetables } = useAdminContext();
  return (
    <>
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-6 gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Shield className="w-6 h-6 text-emerald-600" />
            Academic Management Console
          </h2>
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mt-1">Configure curriculum structure, question bank, timetables, and assessments.</p>
        </div>

        {successMsg && (
          <div className="flex items-center gap-2 py-2 px-4 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-100 animate-pulse">
            <Check className="w-4 h-4 text-emerald-600" />
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="flex items-center gap-2 py-2 px-4 bg-red-50 text-red-800 text-xs font-bold rounded-lg border border-red-100 animate-pulse">
            <AlertCircle className="w-4 h-4 text-red-600" />
            {errorMsg}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Students Registered</span>
          <span className="text-4xl font-black text-slate-800">{dashboardStats?.totalStudents || students.length}</span>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-emerald-500 shadow-[0_4px_20px_rgba(16,185,129,0.1)] flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-emerald-500 rounded-full opacity-10"></div>
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-2 flex items-center gap-1"><DollarSign className="w-3 h-3" /> Total Revenue</span>
          <span className="text-4xl font-black text-emerald-700">₹{dashboardStats?.totalRevenue || 0}</span>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Question Bank</span>
          <span className="text-4xl font-black text-slate-800">{dashboardStats?.totalQuestions || questions.length} <span className="text-xs font-semibold text-slate-400">items</span></span>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" /> Project Progress
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboardStats?.projectProgressData || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis yAxisId="left" orientation="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <RechartsTooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                <Bar yAxisId="left" dataKey="students" name="Students" fill="#0f172a" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar yAxisId="right" dataKey="revenue" name="Revenue (₹)" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-600" /> Recent Transactions
          </h3>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {dashboardStats?.last5Transactions?.map((txn: any) => (
              <div key={txn._id} className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <span className="font-bold text-xs text-slate-900 line-clamp-1">{txn.studentId?.name || 'Unknown Student'}</span>
                  <span className="font-black text-emerald-600 text-xs shrink-0">₹{txn.amount}</span>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-slate-500 font-semibold truncate pr-2">{txn.planId?.name || 'Unknown Plan'}</span>
                  <span className={`px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${txn.status === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {txn.status}
                  </span>
                </div>
              </div>
            ))}
            {(!dashboardStats?.last5Transactions || dashboardStats.last5Transactions.length === 0) && (
              <div className="text-center text-xs text-slate-400 py-10 font-semibold">No recent transactions</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
