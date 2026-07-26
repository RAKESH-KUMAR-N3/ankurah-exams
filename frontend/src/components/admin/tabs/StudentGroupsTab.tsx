import React, { useState, useEffect } from 'react';
import { Users, Edit2, Trash2, MapPin } from 'lucide-react';
import { StudentType } from '../../../types';
import { fetchStates } from '../../../lib/api';

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
  const [states, setStates] = useState<{ id?: string; _id?: string; name: string; code: string }[]>([]);

  useEffect(() => {
    fetchStates()
      .then((data: any) => {
        const list = Array.isArray(data) ? data : data?.data || [];
        setStates(list);
        if (list.length > 0 && !studentTypeForm.state) {
          setStudentTypeForm((prev: any) => ({ ...prev, state: list[0].code }));
        }
      })
      .catch(() => {
        setStates([
          { name: 'Andhra Pradesh', code: 'AP' },
          { name: 'Telangana', code: 'TG' }
        ]);
      });
  }, []);

  const cardColors = [
    { border: 'border-orange-100', text: 'text-orange-600' },
    { border: 'border-pink-100', text: 'text-pink-600' },
    { border: 'border-blue-100', text: 'text-blue-600' },
    { border: 'border-purple-100', text: 'text-purple-600' }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Create Student Group Form */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-emerald-600" /> Create Student Group
        </h3>
        <form onSubmit={handleCreateStudentType} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
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
            <div>
              <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">State</label>
              <select
                value={studentTypeForm.state || (states[0]?.code || 'AP')}
                onChange={(e) => setStudentTypeForm({ ...studentTypeForm, state: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none cursor-pointer"
              >
                {states.length > 0 ? (
                  states.map((st) => (
                    <option key={st.code} value={st.code}>
                      {st.name} ({st.code})
                    </option>
                  ))
                ) : (
                  <>
                    <option value="AP">Andhra Pradesh (AP)</option>
                    <option value="TG">Telangana (TG)</option>
                  </>
                )}
              </select>
            </div>
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
                onClick={() => { setEditingStudentTypeId(null); setStudentTypeForm({ name: '', state: states[0]?.code || 'AP' }); }}
                className="py-2.5 px-6 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold uppercase tracking-wider cursor-pointer transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Dynamic State Student Groups List */}
      <div className={`flex-1 grid grid-cols-1 ${states.length > 1 ? 'md:grid-cols-2' : ''} gap-6`}>
        {(states.length > 0 ? states : [{ name: 'Andhra Pradesh', code: 'AP' }, { name: 'Telangana', code: 'TG' }]).map((stState, idx) => {
          const color = cardColors[idx % cardColors.length];
          const matchedGroups = studentTypes.filter((st: StudentType) => st.state === stState.code);

          return (
            <div key={stState.code} className="bg-slate-50 rounded-3xl p-6 border border-slate-100 shadow-inner overflow-y-auto flex flex-col">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Users className={`w-5 h-5 ${color.text}`} /> {stState.name} ({stState.code}) Student Groups
              </h3>
              <div className="flex-1 space-y-3">
                {matchedGroups.map((st: StudentType) => (
                  <div key={st.id} className={`p-4 bg-white border ${color.border} shadow-sm rounded-xl flex justify-between items-center text-xs`}>
                    <span className="font-black text-slate-800">{st.name}</span>
                    <div className="flex gap-3">
                      <button onClick={() => handleEditStudentTypeClick(st)} className="text-blue-500 hover:text-blue-700 cursor-pointer"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteStudentType(st.id)} className="text-red-500 hover:text-red-700 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
                {matchedGroups.length === 0 && (
                  <div className="text-center text-slate-400 font-semibold py-4">
                    No {stState.code} groups created yet.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
