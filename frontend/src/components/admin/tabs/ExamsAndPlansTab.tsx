import React, { useState } from 'react';
import { FileText, Award, Edit2, Trash2, BookOpen, AlertCircle, Check, Clock, DollarSign } from 'lucide-react';
import { Plan, Subject } from '../../../types';
import { useAdminContext } from '../../../context/AdminContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const getToken = () => localStorage.getItem('token');
const authHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` });

export default function ExamsAndPlansTab() {
  const { entranceExams, competitiveExams, subjects, allPlans, refreshAdminData } = useAdminContext();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [selectedExamCategory, setSelectedExamCategory] = useState<'entrance' | 'competitive' | null>(() => {
    return (sessionStorage.getItem('ankurah_selected_exam_category') as 'entrance' | 'competitive') || null;
  });
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [examForm, setExamForm] = useState<{ id: string; name: string; description: string; type: string; price: string; subjects: string[]; validityMonths: number }>({
    id: '',
    name: '',
    description: '',
    type: 'entrance',
    price: '',
    subjects: [],
    validityMonths: 12
  });
  const [editingExamId, setEditingExamId] = useState<string | null>(null);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setErrorMsg(null);
    refreshAdminData();
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setSuccessMsg(null);
  };

  const resetForm = () => {
    setExamForm({
      id: '',
      name: '',
      description: '',
      type: selectedExamCategory || 'entrance',
      price: '',
      subjects: [],
      validityMonths: 12
    });
    setEditingExamId(null);
    setSelectedExamId(null);
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let cleanId = (examForm.id || examForm.name || 'exam').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || `exam-${Date.now()}`;
      let examType = selectedExamCategory || examForm.type;
      let res;
      if (editingExamId) {
        res = await fetch(`${API_URL}/api/exams/${editingExamId}`, {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify({
            name: examForm.name,
            description: examForm.description,
            type: examType,
            price: examForm.price,
            subjects: examForm.subjects,
            validityMonths: examForm.validityMonths
          })
        });
      } else {
        res = await fetch(`${API_URL}/api/exams`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({
            id: cleanId,
            name: examForm.name,
            description: examForm.description,
            type: examType,
            price: examForm.price,
            subjects: examForm.subjects,
            validityMonths: examForm.validityMonths
          })
        });
      }
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to save course plan');
      }
      resetForm();
      showSuccess(editingExamId ? "Course Plan updated successfully!" : "Course Plan created successfully!");
    } catch (err: any) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditExamClick = (exam: any) => {
    const examId = exam.id || exam._id;
    const plan = allPlans.find((p: Plan) => String(p.examId) === String(examId) || String(p.examId?._id) === String(examId));
    setEditingExamId(examId);
    setSelectedExamId(examId);
    setExamForm({
      id: examId,
      name: exam.name,
      description: exam.description || '',
      type: exam.type,
      price: plan ? String(plan.price) : (exam.price || ''),
      subjects: (exam.subjects || []).map((s: any) => typeof s === 'string' ? s : (s._id || s.id)),
      validityMonths: exam.validityMonths || plan?.validityMonths || 12
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteExam = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this Course Plan?")) return;
    try {
      const res = await fetch(`${API_URL}/api/exams/${id}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      if (!res.ok) throw new Error('Failed to delete course plan');
      showSuccess("Course Plan deleted successfully.");
      if (editingExamId === id) {
        resetForm();
      }
    } catch (err: any) {
      showError(err.message);
    }
  };

  // Filter subjects by category for the multi-select
  const currentCategorySubjects = (subjects || []).filter((s: any) => 
    selectedExamCategory === 'competitive' ? s.subjectCategory === 'competitive' : s.subjectCategory !== 'competitive'
  );

  const currentExams = selectedExamCategory === 'entrance' ? entranceExams : competitiveExams;

  return (
    <div className="flex flex-col gap-6 w-full">
      {errorMsg && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <span className="font-bold">{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="bg-emerald-50 text-emerald-600 p-4 rounded-xl border border-emerald-100 flex items-center gap-3">
          <Check className="w-5 h-5" />
          <span className="font-bold">{successMsg}</span>
        </div>
      )}
      {!selectedExamCategory ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-8">
          <h2 className="text-2xl font-black text-slate-800">Select Exam Category</h2>
          <div className="flex gap-6">
            <button
              onClick={() => { setSelectedExamCategory('entrance'); sessionStorage.setItem('ankurah_selected_exam_category', 'entrance'); }}
              className="px-8 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:border-emerald-500 transition-all flex flex-col items-center gap-3 cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                <FileText className="w-6 h-6 text-emerald-600" />
              </div>
              <span className="font-bold text-slate-800 group-hover:text-emerald-700">Entrance Tests</span>
            </button>
            <button
              onClick={() => { setSelectedExamCategory('competitive'); sessionStorage.setItem('ankurah_selected_exam_category', 'competitive'); }}
              className="px-8 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-500 transition-all flex flex-col items-center gap-3 cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                <Award className="w-6 h-6 text-blue-600" />
              </div>
              <span className="font-bold text-slate-800 group-hover:text-blue-700">Competitive Exams</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
            <button 
              onClick={() => { 
                setSelectedExamCategory(null); 
                sessionStorage.removeItem('ankurah_selected_exam_category');
                resetForm(); 
              }} 
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors"
            >
              <span className="text-lg leading-none">&larr;</span> Back
            </button>
            <h2 className="text-xl font-black text-slate-800">
              {selectedExamCategory === 'entrance' ? 'Entrance Test Courses' : 'Competitive Exam Courses'}
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Create / Edit Form */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-800">
                {editingExamId ? 'Update Course Plan' : 'Create New Course Plan'}
              </h3>
              <form onSubmit={handleCreateExam} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Course Name</label>
                  <input 
                    type="text" 
                    value={examForm.name} 
                    onChange={(e) => setExamForm({ ...examForm, name: e.target.value })} 
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-emerald-500" 
                    required 
                    placeholder="e.g. NEET Inter 1st Year, JEE Main 2026, AP EAPCET MPC" 
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Plan Fee (₹)</label>
                    <input 
                      type="number" 
                      placeholder="e.g. 1500" 
                      value={examForm.price} 
                      onChange={(e) => setExamForm({ ...examForm, price: e.target.value })} 
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-emerald-500" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Validity (Months)</label>
                    <input 
                      type="number" 
                      min="1" 
                      max="60" 
                      placeholder="e.g. 12" 
                      value={examForm.validityMonths || 12} 
                      onChange={(e) => setExamForm({ ...examForm, validityMonths: parseInt(e.target.value) || 12 })} 
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-emerald-500" 
                      required 
                    />
                  </div>
                </div>

                {/* Course Subjects Multi-select */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" /> Included Course Subjects
                    </label>
                    <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                      {(examForm.subjects || []).length} selected
                    </span>
                  </div>
                  <div className="max-h-56 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                    {currentCategorySubjects.length === 0 ? (
                      <p className="text-slate-400 italic text-[11px] p-2">No subjects available. Create subjects in the Subjects tab first.</p>
                    ) : (
                      currentCategorySubjects.map((sub: any) => {
                        const subId = sub._id || sub.id;
                        const isChecked = (examForm.subjects || []).includes(subId);
                        return (
                          <label key={subId} className={`flex items-center gap-2.5 cursor-pointer p-2 rounded-lg transition-colors border ${isChecked ? 'bg-emerald-50/60 border-emerald-300 text-emerald-950 font-bold' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'}`}>
                            <input
                              type="checkbox"
                              className="w-4 h-4 text-emerald-600 rounded border-slate-300 flex-shrink-0 cursor-pointer"
                              checked={isChecked}
                              onChange={(e) => {
                                const newSubs = e.target.checked
                                  ? [...(examForm.subjects || []), subId]
                                  : (examForm.subjects || []).filter((id: string) => id !== subId);
                                setExamForm({ ...examForm, subjects: newSubs });
                              }}
                            />
                            <span className="text-xs">{sub.name}</span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="py-2.5 px-6 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-wider cursor-pointer hover:bg-slate-800 transition-colors flex-1"
                  >
                    {editingExamId ? 'Update Course Plan' : 'Publish Course Plan'}
                  </button>
                  {editingExamId && (
                    <button 
                      type="button" 
                      onClick={resetForm} 
                      className="py-2.5 px-6 bg-red-100 text-red-600 rounded-xl font-bold uppercase tracking-wider cursor-pointer hover:bg-red-200 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Active Course Plans List */}
            <div className="space-y-4 flex flex-col h-full">
              <div className="flex items-center justify-between shrink-0">
                <h3 className="text-lg font-bold text-slate-800">Active Course Plans</h3>
                <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                  {currentExams.length} Courses
                </span>
              </div>

              <div className="space-y-3 h-[450px] overflow-y-auto pr-1 pb-4">
                {currentExams.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-slate-400">
                    <BookOpen size={36} className="mx-auto mb-2 opacity-30" />
                    <p className="text-xs font-semibold">No course plans created yet. Use the form on the left to add one.</p>
                  </div>
                ) : (
                  currentExams.map((ex: any) => {
                    const exId = ex.id || ex._id;
                    const plan = allPlans.find((p: Plan) => String(p.examId) === String(exId) || String(p.examId?._id) === String(exId));
                    const isSelected = editingExamId === exId || selectedExamId === exId;
                    
                    return (
                      <div 
                        key={exId} 
                        className={`flex flex-col p-4 bg-white border rounded-2xl text-xs shadow-2xs hover:border-emerald-300 transition-all cursor-pointer ${isSelected ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/10' : 'border-slate-200'}`} 
                        onClick={() => { setSelectedExamId(exId); handleEditExamClick(ex); }}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-extrabold text-slate-800 text-sm">{ex.name}</h4>
                            {ex.description && <p className="text-[11px] text-slate-400 mt-0.5">{ex.description}</p>}
                          </div>
                          <div className="flex gap-1.5">
                             <button onClick={(e) => { e.stopPropagation(); handleEditExamClick(ex); }} className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-1.5 rounded-lg cursor-pointer transition-colors" title="Edit Course"><Edit2 className="w-3.5 h-3.5" /></button>
                             <button onClick={(e) => { e.stopPropagation(); handleDeleteExam(exId); }} className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg cursor-pointer transition-colors" title="Delete Course"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Fee:</span>
                            <span className="font-black text-slate-800">
                              ₹{plan?.price || ex.price || 0}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 justify-end">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Validity:</span>
                            <span className="font-black text-slate-800">
                              {ex.validityMonths || plan?.validityMonths || 12} Mos
                            </span>
                          </div>
                        </div>

                        {ex.subjects && ex.subjects.length > 0 && (
                          <div className="mt-2.5 pt-2 border-t border-slate-100">
                            <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px] mb-1 block">Included Subjects:</span>
                            <div className="flex flex-wrap gap-1">
                              {ex.subjects.map((subObjOrId: any) => {
                                const subId = typeof subObjOrId === 'string' ? subObjOrId : (subObjOrId._id || subObjOrId.id);
                                const subObj = typeof subObjOrId === 'object' && subObjOrId.name 
                                  ? subObjOrId 
                                  : subjects?.find((s: any) => (s.id || s._id) === subId);
                                
                                return subObj?.name ? (
                                  <span key={subId} className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-[10px] font-semibold">
                                    {subObj.name}
                                  </span>
                                ) : null;
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
