import React, { useState } from 'react';
import { FileText, Award, Edit2, Trash2, BookOpen, AlertCircle, Check, Clock, DollarSign, Plus, X, Search } from 'lucide-react';
import { Plan } from '../../../types';
import { useAdminContext } from '../../../context/AdminContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const getToken = () => localStorage.getItem('token');
const authHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` });

export default function ExamsAndPlansTab() {
  const { entranceExams, competitiveExams, subjects, allPlans, refreshAdminData } = useAdminContext();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Default to 'entrance' category by default
  const [selectedExamCategory, setSelectedExamCategory] = useState<'entrance' | 'competitive'>('entrance');
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [subjectSearchQuery, setSubjectSearchQuery] = useState('');

  const [examForm, setExamForm] = useState<{
    id: string;
    name: string;
    description: string;
    type: string;
    price: string;
    subjects: string[];
    validityMonths: number;
  }>({
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
      type: selectedExamCategory,
      price: '',
      subjects: [],
      validityMonths: 12
    });
    setEditingExamId(null);
    setSelectedExamId(null);
    setSubjectSearchQuery('');
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setExamForm(prev => ({ ...prev, type: selectedExamCategory }));
    setIsFormModalOpen(true);
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
      setIsFormModalOpen(false);
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
      type: exam.type || selectedExamCategory,
      price: plan ? String(plan.price) : (exam.price || ''),
      subjects: (exam.subjects || []).map((s: any) => typeof s === 'string' ? s : (s._id || s.id)),
      validityMonths: exam.validityMonths || plan?.validityMonths || 12
    });
    setIsFormModalOpen(true);
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
        setIsFormModalOpen(false);
      }
    } catch (err: any) {
      showError(err.message);
    }
  };

  // Filter and sort subjects by category for the multi-select (Strict Alphabetical Order A to Z)
  const currentCategorySubjects = (subjects || [])
    .filter((s: any) => 
      selectedExamCategory === 'competitive' ? s.subjectCategory === 'competitive' : s.subjectCategory !== 'competitive'
    )
    .sort((a: any, b: any) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

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

      {/* ── HEADER TOOLBAR: CATEGORY TOGGLE & ADD BUTTON ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        {/* Left: Category Toggle Switch */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-950/80 geom-grid-pattern-dark p-1 border-2 border-emerald-500/40 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.12)]">
            <button
              onClick={() => { setSelectedExamCategory('entrance'); resetForm(); }}
              className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-none transition-all flex items-center gap-2 cursor-pointer border ${
                selectedExamCategory === 'entrance'
                  ? 'bg-emerald-500 text-black border-emerald-400 shadow-md'
                  : 'text-slate-400 border-transparent hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" /> Entrance Tests ({entranceExams.length})
            </button>
            <button
              onClick={() => { setSelectedExamCategory('competitive'); resetForm(); }}
              className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-none transition-all flex items-center gap-2 cursor-pointer border ${
                selectedExamCategory === 'competitive'
                  ? 'bg-cyan-500 text-black border-cyan-400 shadow-md'
                  : 'text-slate-400 border-transparent hover:text-white'
              }`}
            >
              <Award className="w-3.5 h-3.5" /> Competitive Exams ({competitiveExams.length})
            </button>
          </div>
        </div>

        {/* Right: Add New Course Button */}
        <button
          onClick={handleOpenCreateModal}
          className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black uppercase tracking-wider rounded-none border border-emerald-400 shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" /> ADD NEW COURSE
        </button>
      </div>

      {/* ── COURSE PLANS GRID ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base md:text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            {selectedExamCategory === 'entrance' ? 'Entrance Test Courses' : 'Competitive Exam Courses'}
          </h2>
          <span className="text-xs font-black bg-slate-950 border border-slate-800 text-emerald-400 px-3 py-1 rounded-none uppercase tracking-widest">
            Total {currentExams.length} Active Courses
          </span>
        </div>

        {currentExams.length === 0 ? (
          <div className="p-12 text-center bg-slate-950 border border-slate-800 rounded-none space-y-3">
            <BookOpen size={44} className="mx-auto text-slate-600" />
            <p className="text-slate-400 text-xs font-bold">No {selectedExamCategory} course plans created yet.</p>
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2 bg-emerald-500 text-black text-xs font-black uppercase tracking-wider rounded-none hover:bg-emerald-400 transition-all inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" /> CREATE FIRST COURSE
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {currentExams.map((ex: any) => {
              const exId = ex.id || ex._id;
              const plan = allPlans.find((p: Plan) => String(p.examId) === String(exId) || String(p.examId?._id) === String(exId));
              const isSelected = editingExamId === exId || selectedExamId === exId;

              return (
                <div
                  key={exId}
                  className={`flex flex-col justify-between p-5 bg-slate-950/60 geom-grid-pattern-dark border-2 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.12)] hover:border-emerald-400 hover:shadow-[0_0_25px_rgba(16,185,129,0.2)] transition-all group ${
                    isSelected ? 'border-emerald-400 ring-2 ring-emerald-500/30 bg-slate-900/80' : 'border-emerald-500/40'
                  }`}
                >
                  <div className="space-y-3.5">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="px-2.5 py-0.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-mono font-black text-[9px] rounded-none uppercase tracking-widest mb-1.5 inline-block">
                          {ex.type || selectedExamCategory}
                        </span>
                        <h4 className="font-black text-white text-base uppercase tracking-wider leading-snug group-hover:text-emerald-400 transition-colors">
                          {ex.name}
                        </h4>
                        {ex.description && <p className="text-xs text-slate-400 font-bold mt-1 line-clamp-2">{ex.description}</p>}
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <button
                          onClick={() => handleEditExamClick(ex)}
                          className="p-1.5 text-slate-400 hover:text-white cursor-pointer transition-colors"
                          title="Edit Course"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteExam(exId)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 cursor-pointer transition-colors"
                          title="Delete Course"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 bg-slate-900 p-3 rounded-none border border-slate-800 text-xs">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div>
                          <span className="font-black text-slate-400 uppercase tracking-widest text-[9px] block">Fee</span>
                          <span className="font-black text-white font-mono text-sm">
                            ₹{plan?.price || ex.price || 0}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 justify-end text-right">
                        <div>
                          <span className="font-black text-slate-400 uppercase tracking-widest text-[9px] block">Validity</span>
                          <span className="font-black text-white font-mono text-sm">
                            {ex.validityMonths || plan?.validityMonths || 12} Months
                          </span>
                        </div>
                        <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                      </div>
                    </div>

                    {(() => {
                      const validExamSubjects = (ex.subjects || [])
                        .map((subObjOrId: any) => {
                          const subId = typeof subObjOrId === 'string' ? subObjOrId : (subObjOrId._id || subObjOrId.id);
                          return typeof subObjOrId === 'object' && subObjOrId.name
                            ? subObjOrId
                            : subjects?.find((s: any) => (s.id || s._id) === subId);
                        })
                        .filter(Boolean);

                      if (validExamSubjects.length === 0) return null;

                      return (
                        <div className="pt-3 border-t border-slate-900">
                          <span className="font-black text-slate-400 uppercase tracking-widest text-[9px] mb-2 block">
                            Included Subjects ({validExamSubjects.length}):
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {validExamSubjects.map((subObj: any) => (
                              <span key={subObj.id || subObj._id} className="px-2.5 py-1 bg-slate-900 text-emerald-400 border border-slate-800 rounded-none text-[10px] font-black uppercase tracking-wider">
                                {subObj.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── CREATE / EDIT COURSE PLAN POPUP MODAL (NO SCROLLBARS - CLEAN FULL VIEW) ── */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto font-sans">
          <div className="bg-slate-950 border border-emerald-500/40 rounded-none p-6 shadow-2xl w-full max-w-4xl space-y-4 text-slate-100 relative my-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-none">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-wider">
                    {editingExamId ? 'Edit Course Plan' : 'Create New Course Plan'}
                  </h3>
                  <span className="text-[10px] font-mono font-black text-emerald-400 uppercase tracking-widest">
                    CATEGORY: {selectedExamCategory === 'entrance' ? 'ENTRANCE TEST' : 'COMPETITIVE EXAM'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => { setIsFormModalOpen(false); resetForm(); }}
                className="p-2 text-slate-400 hover:text-white rounded-none hover:bg-slate-900 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleCreateExam} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-3">
                  <label className="block text-slate-300 font-black uppercase tracking-wider mb-1">Course Name</label>
                  <input
                    type="text"
                    value={examForm.name}
                    onChange={(e) => setExamForm({ ...examForm, name: e.target.value })}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-none text-white font-bold focus:outline-none focus:border-emerald-400 text-xs placeholder:text-slate-500"
                    required
                    placeholder="e.g. NEET Inter 1st Year, JEE Main 2026, AP EAPCET MPC"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-black uppercase tracking-wider mb-1">Plan Fee (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 1500"
                    value={examForm.price}
                    onChange={(e) => setExamForm({ ...examForm, price: e.target.value })}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-none text-white font-bold focus:outline-none focus:border-emerald-400 text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-black uppercase tracking-wider mb-1">Validity (Months)</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    placeholder="e.g. 12"
                    value={examForm.validityMonths || 12}
                    onChange={(e) => setExamForm({ ...examForm, validityMonths: parseInt(e.target.value) || 12 })}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-none text-white font-bold focus:outline-none focus:border-emerald-400 text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-black uppercase tracking-wider mb-1">Description (Optional)</label>
                  <input
                    type="text"
                    value={examForm.description}
                    onChange={(e) => setExamForm({ ...examForm, description: e.target.value })}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-none text-white font-bold focus:outline-none focus:border-emerald-400 text-xs placeholder:text-slate-500"
                    placeholder="e.g. Complete syllabus coverage"
                  />
                </div>
              </div>

              {/* Course Subjects Multi-select Header with Quick Select All / Deselect All Buttons */}
              <div className="space-y-2 pt-1 border-t border-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-slate-300 font-black uppercase tracking-wider flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-emerald-400" /> Included Course Subjects
                  </label>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const allSubIds = currentCategorySubjects.map((s: any) => s._id || s.id);
                        setExamForm({ ...examForm, subjects: allSubIds });
                      }}
                      className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider cursor-pointer"
                    >
                      + SELECT ALL ({currentCategorySubjects.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setExamForm({ ...examForm, subjects: [] })}
                      className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-black uppercase tracking-wider cursor-pointer"
                    >
                      DESELECT ALL
                    </button>
                    <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-none border border-emerald-500/40 uppercase tracking-widest">
                      {(examForm.subjects || []).length} SELECTED
                    </span>
                  </div>
                </div>

                {/* SUBJECT SEARCH BAR */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search subject name to filter (e.g. Physics, NEET, TG)..."
                    value={subjectSearchQuery}
                    onChange={(e) => setSubjectSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-none text-xs font-bold text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-400"
                  />
                </div>

                {/* Subjects Checkboxes Grid (NO SCROLLBARS - CLEAN 3-COLUMN / 4-COLUMN DISPLAY) */}
                <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-none grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {(() => {
                    const filtered = currentCategorySubjects
                      .filter((s: any) => s.name.toLowerCase().includes(subjectSearchQuery.toLowerCase()))
                      .sort((a: any, b: any) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

                    if (filtered.length === 0) {
                      return (
                        <p className="text-slate-400 italic text-[11px] p-2 col-span-4 text-center">
                          {subjectSearchQuery ? `No subjects match "${subjectSearchQuery}"` : "No subjects available. Create subjects in Subjects tab first."}
                        </p>
                      );
                    }

                    return filtered.map((sub: any) => {
                      const subId = sub._id || sub.id;
                      const isChecked = (examForm.subjects || []).includes(subId);
                      return (
                        <label
                          key={subId}
                          className={`flex items-center gap-2.5 cursor-pointer p-2 rounded-none transition-all border ${
                            isChecked 
                              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-black shadow-md' 
                              : 'bg-slate-950 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:text-white'
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-emerald-500 rounded-none border-slate-600 flex-shrink-0 cursor-pointer accent-emerald-500"
                            checked={isChecked}
                            onChange={(e) => {
                              const newSubs = e.target.checked
                                ? [...(examForm.subjects || []), subId]
                                : (examForm.subjects || []).filter((id: string) => id !== subId);
                              setExamForm({ ...examForm, subjects: newSubs });
                            }}
                          />
                          <span className="text-[11px] uppercase tracking-wider font-bold truncate">{sub.name}</span>
                        </label>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => { setIsFormModalOpen(false); resetForm(); }}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-black text-xs uppercase tracking-wider rounded-none transition-all cursor-pointer border border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider rounded-none shadow-lg transition-all cursor-pointer border border-emerald-400 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : editingExamId ? 'Update Course Plan' : 'Publish Course Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
