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
  const filteredStudentTypes = (studentTypes || []).filter((st: any) => 
    !examForm.state || examForm.state === 'Both' || (st.state || 'AP') === examForm.state
  );

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
      ) : selectedExamCategory ? (
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
            <button onClick={() => { setSelectedExamCategory(null); setSelectedExamId(null); setEditingExamId(null); setExamForm({ id: '', name: '', description: '', type: 'entrance', price: '', allowedStudentTypes: [] }); }} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors">
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
                  {selectedExamCategory === 'entrance' && (
                    <div>
                      <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Target State</label>
                      <select value={examForm.state || 'Both'} onChange={(e) => setExamForm({ ...examForm, state: e.target.value })} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none">
                        <option value="Both">Both (AP and TG)</option>
                        <option value="AP">Andhra Pradesh (AP)</option>
                        <option value="TG">Telangana (TG)</option>
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Plan Fee (₹)</label>
                    <input type="number" placeholder="e.g. 15000" value={examForm.price} onChange={(e) => setExamForm({ ...examForm, price: e.target.value })} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none" required />
                  </div>
                </div>
                {selectedExamCategory !== 'competitive' && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-slate-500 font-bold uppercase tracking-wider">Eligible Student Groups</label>
                      {examForm.state && examForm.state !== 'Both' && (
                        <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          Showing {examForm.state} Groups
                        </span>
                      )}
                    </div>
                    <div className="max-h-52 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                      {filteredStudentTypes.map((st: any) => (
                        <label key={st.id || st._id} className="flex items-center justify-between gap-3 cursor-pointer text-slate-700 hover:bg-slate-100 p-2 rounded-lg transition-colors border border-slate-200 bg-white">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <input
                              type="checkbox"
                              className="w-4 h-4 text-emerald-600 rounded border-slate-300 flex-shrink-0 cursor-pointer"
                              checked={examForm.allowedStudentTypes?.includes(st.id || st._id) || false}
                              onChange={(e) => {
                                const stId = st.id || st._id;
                                const newTypes = e.target.checked
                                  ? [...(examForm.allowedStudentTypes || []), stId]
                                  : (examForm.allowedStudentTypes || []).filter((id: string) => id !== stId);
                                setExamForm({ ...examForm, allowedStudentTypes: newTypes });
                              }}
                            />
                            <span className="text-xs font-bold text-slate-800 whitespace-nowrap">{st.name}</span>
                          </div>
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 uppercase flex-shrink-0">
                            {st.state || 'AP'}
                          </span>
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
                    <button type="button" onClick={() => { setEditingExamId(null); setSelectedExamId(null); setExamForm({ id: '', name: '', description: '', type: selectedExamCategory, price: '', allowedStudentTypes: [] }); }} className="py-2 px-6 bg-red-100 text-red-600 rounded-xl font-bold uppercase tracking-wider cursor-pointer hover:bg-red-200 transition-colors">
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="space-y-4 flex flex-col h-full">
              <h3 className="text-lg font-bold text-slate-800 shrink-0">Active Course Plans</h3>
              <div className="space-y-6 h-[420px] overflow-y-auto pr-2 pb-4">
                {selectedExamCategory === 'entrance' ? (
                  <>
                    {/* AP Course Plans Card Section */}
                    <div className="bg-orange-50/40 border border-orange-200 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-extrabold text-orange-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                          Andhra Pradesh (AP) Course Plans
                        </h4>
                        <span className="text-[10px] font-bold bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full">
                          {entranceExams.filter((ex: any) => ex.state === 'AP' || ex.state === 'Both').length} Plans
                        </span>
                      </div>
                      {entranceExams.filter((ex: any) => ex.state === 'AP' || ex.state === 'Both').length === 0 ? (
                        <p className="text-[11px] text-slate-400 italic">No AP course plans created yet.</p>
                      ) : (
                        entranceExams.filter((ex: any) => ex.state === 'AP' || ex.state === 'Both').map((ex: any) => (
                          <div 
                            key={ex.id || ex._id} 
                            className={`flex flex-col p-3.5 bg-white border rounded-xl text-xs shadow-2xs hover:border-orange-300 transition-colors cursor-pointer ${editingExamId === (ex.id || ex._id) || selectedExamId === (ex.id || ex._id) ? 'border-orange-500 ring-2 ring-orange-500/20 bg-orange-50/10' : 'border-slate-200'}`} 
                            onClick={() => { setSelectedExamId(ex.id || ex._id); handleEditExamClick(ex); }}
                          >
                            <div className="flex justify-between items-center mb-1.5">
                              <span className="font-bold text-slate-800 text-xs">{ex.name}</span>
                              <div className="flex gap-1.5">
                                 <button onClick={(e) => { e.stopPropagation(); handleEditExamClick(ex); }} className="text-blue-500 hover:text-blue-700 cursor-pointer p-1"><Edit2 className="w-3.5 h-3.5" /></button>
                                 <button onClick={(e) => { e.stopPropagation(); handleDeleteExam(ex.id || ex._id, selectedExamCategory); }} className="text-red-500 hover:text-red-700 cursor-pointer p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                            </div>
                            <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 mt-1">
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="font-bold text-slate-500 uppercase tracking-wider">Plan Fee</span>
                                <span className="font-black text-slate-800 text-xs">
                                  ₹{allPlans.find((p: Plan) => String(p.examId) === String(ex.id || ex._id) || String(p.examId?._id) === String(ex.id || ex._id))?.price || 0}
                                </span>
                              </div>
                              {ex.allowedStudentTypes && ex.allowedStudentTypes.length > 0 && (
                                <div className="mt-1.5 pt-1.5 border-t border-slate-200/60">
                                  <span className="font-bold text-slate-500 uppercase tracking-wider text-[9px] mb-1 block">Eligible Groups</span>
                                  <div className="flex flex-wrap gap-1">
                                    {ex.allowedStudentTypes.map((typeObjOrId: any) => {
                                      const typeId = typeof typeObjOrId === 'string' ? typeObjOrId : (typeObjOrId._id || typeObjOrId.id);
                                      const stObj = typeof typeObjOrId === 'object' && typeObjOrId.name 
                                        ? typeObjOrId 
                                        : studentTypes?.find((s: any) => (s.id || s._id) === typeId);
                                      
                                      const typeName = stObj?.name;
                                      const stState = stObj?.state;
                                      
                                      return typeName ? (
                                        <span key={typeId} className="px-1.5 py-0.5 bg-orange-100/70 text-orange-900 border border-orange-200 rounded-md text-[9px] font-semibold flex items-center gap-1">
                                          {typeName} {stState && <span className="text-[8px] bg-orange-200 text-orange-900 px-1 rounded font-bold uppercase">{stState}</span>}
                                        </span>
                                      ) : null;
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* TG Course Plans Card Section */}
                    <div className="bg-pink-50/40 border border-pink-200 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-extrabold text-pink-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-pink-600" />
                          Telangana (TG) Course Plans
                        </h4>
                        <span className="text-[10px] font-bold bg-pink-100 text-pink-800 px-2 py-0.5 rounded-full">
                          {entranceExams.filter((ex: any) => ex.state === 'TG').length} Plans
                        </span>
                      </div>
                      {entranceExams.filter((ex: any) => ex.state === 'TG').length === 0 ? (
                        <p className="text-[11px] text-slate-400 italic">No TG course plans created yet.</p>
                      ) : (
                        entranceExams.filter((ex: any) => ex.state === 'TG').map((ex: any) => (
                          <div 
                            key={ex.id || ex._id} 
                            className={`flex flex-col p-3.5 bg-white border rounded-xl text-xs shadow-2xs hover:border-pink-300 transition-colors cursor-pointer ${editingExamId === (ex.id || ex._id) || selectedExamId === (ex.id || ex._id) ? 'border-pink-500 ring-2 ring-pink-500/20 bg-pink-50/10' : 'border-slate-200'}`} 
                            onClick={() => { setSelectedExamId(ex.id || ex._id); handleEditExamClick(ex); }}
                          >
                            <div className="flex justify-between items-center mb-1.5">
                              <span className="font-bold text-slate-800 text-xs">{ex.name}</span>
                              <div className="flex gap-1.5">
                                 <button onClick={(e) => { e.stopPropagation(); handleEditExamClick(ex); }} className="text-blue-500 hover:text-blue-700 cursor-pointer p-1"><Edit2 className="w-3.5 h-3.5" /></button>
                                 <button onClick={(e) => { e.stopPropagation(); handleDeleteExam(ex.id || ex._id, selectedExamCategory); }} className="text-red-500 hover:text-red-700 cursor-pointer p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                            </div>
                            <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 mt-1">
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="font-bold text-slate-500 uppercase tracking-wider">Plan Fee</span>
                                <span className="font-black text-slate-800 text-xs">
                                  ₹{allPlans.find((p: Plan) => String(p.examId) === String(ex.id || ex._id) || String(p.examId?._id) === String(ex.id || ex._id))?.price || 0}
                                </span>
                              </div>
                              {ex.allowedStudentTypes && ex.allowedStudentTypes.length > 0 && (
                                <div className="mt-1.5 pt-1.5 border-t border-slate-200/60">
                                  <span className="font-bold text-slate-500 uppercase tracking-wider text-[9px] mb-1 block">Eligible Groups</span>
                                  <div className="flex flex-wrap gap-1">
                                    {ex.allowedStudentTypes.map((typeObjOrId: any) => {
                                      const typeId = typeof typeObjOrId === 'string' ? typeObjOrId : (typeObjOrId._id || typeObjOrId.id);
                                      const stObj = typeof typeObjOrId === 'object' && typeObjOrId.name 
                                        ? typeObjOrId 
                                        : studentTypes?.find((s: any) => (s.id || s._id) === typeId);
                                      
                                      const typeName = stObj?.name;
                                      const stState = stObj?.state;
                                      
                                      return typeName ? (
                                        <span key={typeId} className="px-1.5 py-0.5 bg-pink-100/70 text-pink-900 border border-pink-200 rounded-md text-[9px] font-semibold flex items-center gap-1">
                                          {typeName} {stState && <span className="text-[8px] bg-pink-200 text-pink-900 px-1 rounded font-bold uppercase">{stState}</span>}
                                        </span>
                                      ) : null;
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                ) : (
                  competitiveExams.map((ex: any) => (
                    <div 
                      key={ex.id || ex._id} 
                      className={`flex flex-col p-4 bg-white border rounded-2xl mb-3 text-xs shadow-sm hover:border-blue-300 transition-colors cursor-pointer ${editingExamId === (ex.id || ex._id) || selectedExamId === (ex.id || ex._id) ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/20' : 'border-slate-200'}`} 
                      onClick={() => { setSelectedExamId(ex.id || ex._id); handleEditExamClick(ex); }}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-slate-800 text-sm">{ex.name}</span>
                        <div className="flex gap-2">
                           <button onClick={(e) => { e.stopPropagation(); handleEditExamClick(ex); }} className="text-blue-500 hover:text-blue-700 cursor-pointer p-1"><Edit2 className="w-4 h-4" /></button>
                           <button onClick={(e) => { e.stopPropagation(); handleDeleteExam(ex.id || ex._id, selectedExamCategory); }} className="text-red-500 hover:text-red-700 cursor-pointer p-1"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 mt-2">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-bold text-slate-500 uppercase tracking-wider">Associated Plan Fee</span>
                          <span className="font-black text-slate-800 text-xs">
                            ₹{allPlans.find((p: Plan) => String(p.examId) === String(ex.id || ex._id) || String(p.examId?._id) === String(ex.id || ex._id))?.price || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
