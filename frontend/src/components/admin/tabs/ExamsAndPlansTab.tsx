import React from 'react';
import { FileText, Award, Edit2, Trash2 } from 'lucide-react';
import { EntranceExam, CompetitiveExam, Plan, Test, Subject, Chapter } from '../../../types';

export default function ExamsAndPlansTab({
  selectedExamCategory,
  setSelectedExamCategory,
  selectedExamId,
  setSelectedExamId,
  entranceExams,
  competitiveExams,
  examForm,
  setExamForm,
  testForm,
  setTestForm,
  handleCreateExam,
  handleDeleteExam,
  handleCreateTest,
  handleDeleteTest,
  tests,
  allPlans,
  subjects,
  chapters,
  studentTypes,
  loading,
  editingExamId,
  setEditingExamId,
  handleEditExamClick
}: any) {
  return (
    <div className="flex flex-col gap-6 w-full">
      {!selectedExamCategory ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-8">
          <h2 className="text-2xl font-black text-slate-800">Select Exam Category</h2>
          <div className="flex gap-6">
            <button
              onClick={() => setSelectedExamCategory('entrance')}
              className="px-8 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:border-emerald-500 transition-all flex flex-col items-center gap-3 cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                <FileText className="w-6 h-6 text-emerald-600" />
              </div>
              <span className="font-bold text-slate-800 group-hover:text-emerald-700">Entrance Tests</span>
            </button>
            <button
              onClick={() => setSelectedExamCategory('competitive')}
              className="px-8 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-500 transition-all flex flex-col items-center gap-3 cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                <Award className="w-6 h-6 text-blue-600" />
              </div>
              <span className="font-bold text-slate-800 group-hover:text-blue-700">Competitive Exams</span>
            </button>
          </div>
        </div>
      ) : selectedExamCategory && !selectedExamId ? (
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
            <button onClick={() => setSelectedExamCategory(null)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors">
              <span className="text-lg leading-none">&larr;</span> Back
            </button>
            <h2 className="text-xl font-black text-slate-800">
              {selectedExamCategory === 'entrance' ? 'Entrance Tests' : 'Competitive Exams'}
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-800">
                {editingExamId ? 'Update Course Plan' : 'Create New Course Plan'}
              </h3>
              <form onSubmit={handleCreateExam} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Name</label>
                  <input type="text" value={examForm.name} onChange={(e) => setExamForm({ ...examForm, name: e.target.value })} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none" required placeholder="e.g. JEE Main" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Exam Type</label>
                    <select value={examForm.type} onChange={(e) => setExamForm({ ...examForm, type: e.target.value })} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none" disabled>
                      <option value={selectedExamCategory}>{selectedExamCategory === 'entrance' ? 'Entrance Test' : 'Competitive Exam'}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Plan Fee (₹)</label>
                    <input type="number" placeholder="e.g. 15000" value={examForm.price} onChange={(e) => setExamForm({ ...examForm, price: e.target.value })} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none" required />
                  </div>
                </div>
                {selectedExamCategory !== 'competitive' && (
                  <div>
                    <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Eligible Student Groups</label>
                    <div className="max-h-24 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {studentTypes && studentTypes.map((st: any) => (
                        <label key={st.id} className="flex items-center gap-2 cursor-pointer text-slate-700 hover:bg-slate-100 p-1 rounded-md transition-colors">
                          <input
                            type="checkbox"
                            className="w-3.5 h-3.5 text-emerald-600 rounded border-slate-300"
                            checked={examForm.allowedStudentTypes?.includes(st.id) || false}
                            onChange={(e) => {
                              const newTypes = e.target.checked
                                ? [...(examForm.allowedStudentTypes || []), st.id]
                                : (examForm.allowedStudentTypes || []).filter((id: string) => id !== st.id);
                              setExamForm({ ...examForm, allowedStudentTypes: newTypes });
                            }}
                          />
                          <span className="text-[11px] font-semibold">{st.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex gap-2 mt-1">
                  <button type="submit" disabled={loading} className="py-2 px-6 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-wider cursor-pointer hover:bg-slate-800 transition-colors flex-1">
                    {editingExamId ? 'Update Course Plan' : 'Publish Course Plan'}
                  </button>
                  {editingExamId && (
                    <button type="button" onClick={() => { setEditingExamId(null); setExamForm({ id: '', name: '', description: '', type: selectedExamCategory, price: '', allowedStudentTypes: [] }); }} className="py-2 px-6 bg-red-100 text-red-600 rounded-xl font-bold uppercase tracking-wider cursor-pointer hover:bg-red-200 transition-colors">
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="space-y-4 flex flex-col h-full">
              <h3 className="text-lg font-bold text-slate-800 shrink-0">Active Course Plans</h3>
              <div className="space-y-4 h-[420px] overflow-y-auto pr-2 pb-4">
                {(selectedExamCategory === 'entrance' ? entranceExams : competitiveExams).map((ex: any) => (
                  <div key={ex.id} className="flex flex-col p-4 bg-white border border-slate-200 rounded-2xl mb-3 text-xs shadow-sm hover:border-emerald-300 transition-colors cursor-pointer" onClick={() => setSelectedExamId(ex.id)}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-slate-800 text-sm">{ex.name}</span>
                      <div className="flex gap-2">
                         <button onClick={(e) => { e.stopPropagation(); handleEditExamClick(ex); }} className="text-blue-500 hover:text-blue-700 cursor-pointer p-1"><Edit2 className="w-4 h-4" /></button>
                         <button onClick={(e) => { e.stopPropagation(); handleDeleteExam(ex.id, selectedExamCategory); }} className="text-red-500 hover:text-red-700 cursor-pointer p-1"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 mt-2">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-bold text-slate-500 uppercase tracking-wider">Associated Plan Fee</span>
                        <span className="font-black text-slate-800 text-xs">
                          ₹{allPlans.find((p: Plan) => String(p.examId) === String(ex.id) || String(p.examId?._id) === String(ex.id))?.price || 0}
                        </span>
                      </div>
                      {ex.allowedStudentTypes && ex.allowedStudentTypes.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-slate-200">
                          <span className="font-bold text-slate-500 uppercase tracking-wider text-[9px] mb-1.5 block">Eligible Groups</span>
                          <div className="flex flex-wrap gap-1">
                            {ex.allowedStudentTypes.map((typeObjOrId: any) => {
                              const typeId = typeof typeObjOrId === 'string' ? typeObjOrId : (typeObjOrId._id || typeObjOrId.id);
                              const typeName = typeof typeObjOrId === 'object' && typeObjOrId.name 
                                ? typeObjOrId.name 
                                : studentTypes?.find((s: any) => s.id === typeId || s._id === typeId)?.name;
                              
                              return typeName ? (
                                <span key={typeId} className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[9px] font-semibold">
                                  {typeName}
                                </span>
                              ) : null;
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
                </div>
        </div>
      ) : null}
    </div>
  );
}
