import React, { useState } from 'react';
import { UserCheck, Shield, Sparkles, CheckCircle2, Search } from 'lucide-react';

export default function StudentsTab({ students = [], studentTypes = [], allPlans = [] }: any) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStudents = students.filter((s: any) =>
    !searchTerm ||
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-600" /> Enrolled Students & Subscription Tracker
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-1">View student groups, enrolled plans, and active subscriptions.</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search student by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider">
                <th className="p-4">Student</th>
                <th className="p-4">Student Group</th>
                <th className="p-4">Active Plan / Subscription</th>
                <th className="p-4">Status</th>
                <th className="p-4">Registered Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 font-medium">
                    No students registered yet.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student: any) => {
                  const studentTypeObjOrStr = student.studentType;
                  const extractedTypeName = typeof studentTypeObjOrStr === 'object' && studentTypeObjOrStr ? (studentTypeObjOrStr as any).name : studentTypeObjOrStr;
                  const stObj = studentTypes.find((st: any) => (st.id || st._id) === student.studentTypeId || st.name === extractedTypeName);
                  const groupName = stObj ? stObj.name : (extractedTypeName || 'Not Assigned');

                  // Find purchased plans
                  const purchased = student.purchasedPlans || [];
                  const activePlanNames = purchased.map((p: any) => {
                    const found = allPlans.find((pl: any) => (pl.id || pl._id) === p.planId);
                    return found ? found.name : 'Course Plan';
                  });

                  const planDisplay = activePlanNames.length > 0
                    ? activePlanNames.join(', ')
                    : (student.studyPlan ? `${student.studyPlan.replace('_', ' ').toUpperCase()} PLAN` : 'Yearly Academic Plan');

                  return (
                    <tr key={student.uid || student._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4">
                        <div className="font-extrabold text-slate-900 text-sm">{student.name}</div>
                        <div className="text-slate-500 text-[11px] font-medium">{student.email}</div>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 font-bold rounded-lg border border-slate-200">
                          <Shield className="w-3.5 h-3.5 text-emerald-600" />
                          {groupName}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          {planDisplay}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 font-black text-[10px] uppercase rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </span>
                      </td>
                      <td className="p-4 text-slate-500 font-medium">
                        {student.createdAt ? new Date(student.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
