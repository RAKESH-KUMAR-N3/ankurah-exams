import React from 'react';
import { useAdminContext } from '../../../context/AdminContext';

export default function PaymentsTab() {
  const { allTransactions } = useAdminContext();
  return (
    <div className="space-y-6 text-slate-100">
      <h3 className="text-lg font-black text-white uppercase tracking-wider">Student Transaction History</h3>
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl">
        <table className="w-full text-left border-collapse text-xs text-slate-200">
          <thead>
            <tr className="bg-slate-800/80 border-b border-slate-700/80 text-slate-300 font-bold uppercase tracking-wider">
              <th className="p-4">Transaction ID</th>
              <th className="p-4">Student</th>
              <th className="p-4">Plan & Exam</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Date</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {allTransactions.map((txn: any) => (
              <tr key={txn._id} className="hover:bg-slate-800/50 font-semibold text-slate-200 transition-colors">
                <td className="p-4 font-mono text-emerald-400 font-bold">{txn.transactionId}</td>
                <td className="p-4 font-bold text-white">{txn.studentId?.name}<br /><span className="text-xs font-normal text-slate-400">{txn.studentId?.email}</span></td>
                <td className="p-4 text-slate-300">{txn.planId?.name}<br /><span className="text-[10px] uppercase text-emerald-400 font-bold">Exam ID: {txn.planId?.examId}</span></td>
                <td className="p-4 font-black text-white font-mono">₹{txn.amount}</td>
                <td className="p-4 text-slate-400">{new Date(txn.createdAt).toLocaleDateString()}</td>
                <td className="p-4">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${txn.status === 'success' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                    {txn.status}
                  </span>
                </td>
              </tr>
            ))}
            {allTransactions.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-slate-400 font-semibold">No transactions found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
