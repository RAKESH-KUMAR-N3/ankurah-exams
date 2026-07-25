import React from 'react';
import { Users, Edit2, Trash2 } from 'lucide-react';
import { StudentType } from '../../../types';

export default function StudentGroupsTab({
  studentTypes,
  studentTypeForm,
  setStudentTypeForm,
  editingStudentTypeId,
  setEditingStudentTypeId,
  handleCreateStudentType,
  handleDeleteStudentType,
  handleEditStudentTypeClick,
  loading
}: any) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Create Student Group</h3>
        <form onSubmit={handleCreateStudentType} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Group Name</label>
            <input
              type="text"
              placeholder="e.g. Inter 1st Year (MPC)"
              value={studentTypeForm.name}
              onChange={(e) => setStudentTypeForm({ ...studentTypeForm, name: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none"
              required
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="py-2.5 px-6 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold uppercase tracking-wider cursor-pointer flex-1 transition-colors"
            >
              {editingStudentTypeId ? 'Update Group' : 'Create Group'}
            </button>
            {editingStudentTypeId && (
              <button
                type="button"
                onClick={() => { setEditingStudentTypeId(null); setStudentTypeForm({ name: '' }); }}
                className="py-2.5 px-6 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold uppercase tracking-wider cursor-pointer transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
      
      <div className="bg-slate-50 rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-emerald-600" /> Active Student Groups
        </h3>
        <div className="flex-1 overflow-y-auto pr-2 space-y-3">
          {studentTypes.map((st: StudentType) => (
            <div key={st.id} className="p-4 bg-white border border-slate-100 shadow-sm rounded-xl flex justify-between items-center text-xs">
              <span className="font-black text-slate-800">{st.name}</span>
              <div className="flex gap-3">
                <button onClick={() => handleEditStudentTypeClick(st)} className="text-blue-500 hover:text-blue-700 cursor-pointer"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => handleDeleteStudentType(st.id)} className="text-red-500 hover:text-red-700 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
          {studentTypes.length === 0 && (
            <div className="text-center text-slate-400 font-semibold py-10">No groups created yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
