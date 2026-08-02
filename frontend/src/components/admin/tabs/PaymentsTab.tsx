import React from 'react';
import { useAdminContext } from '../../../context/AdminContext';

export default function PaymentsTab() {
  const { allTransactions } = useAdminContext();
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-slate-800">Student Transaction History</h3>
      <div className="overflow-x-auto rounded-xl border border-slate-100">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase">
              <th className="p-4">Transaction ID</th>
              <th className="p-4">Student</th>
              <th className="p-4">Plan & Exam</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Date</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {allTransactions.map((txn: any) => (
              <tr key={txn._id} className="border-b border-slate-100 hover:bg-slate-50 font-semibold text-slate-700">
                <td className="p-4 font-mono text-emerald-600">{txn.transactionId}</td>
                <td className="p-4 font-bold text-slate-900">{txn.studentId?.name}<br /><span className="text-xs font-normal text-slate-500">{txn.studentId?.email}</span></td>
                <td className="p-4 text-slate-700">{txn.planId?.name}<br /><span className="text-[10px] uppercase text-emerald-500 font-bold">Exam ID: {txn.planId?.examId}</span></td>
                <td className="p-4 font-black text-slate-800">₹{txn.amount}</td>
                <td className="p-4">{new Date(txn.createdAt).toLocaleDateString()}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${txn.status === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
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
