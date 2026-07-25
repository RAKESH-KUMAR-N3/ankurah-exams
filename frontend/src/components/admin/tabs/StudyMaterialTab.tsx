import React from 'react';
import { Trash2 } from 'lucide-react';
import { Plan, Subject, Chapter, StudyMaterial } from '../../../types';

export default function StudyMaterialTab({
  materialForm,
  setMaterialForm,
  handleCreateMaterial,
  handleDeleteMaterial,
  entranceExams,
  competitiveExams,
  subjects,
  chapters,
  materials,
  loading,
  studentTypes
}: any) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-800">Publish Study Resource</h3>
        <form onSubmit={handleCreateMaterial} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Upload PDF File</label>
            <input type="file" accept=".pdf" onChange={(e) => setMaterialForm({ ...materialForm, file: e.target.files?.[0] || null })} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-slate-900 file:text-white hover:file:bg-slate-800 cursor-pointer" required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Student Group (Optional filter)</label>
              <select value={materialForm.studentTypeId} onChange={(e) => setMaterialForm({ ...materialForm, studentTypeId: e.target.value, subjectId: '', chapterId: '' })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none cursor-pointer">
                <option value="">All Groups</option>
                {studentTypes?.map((st: any) => (
                  <option key={st.id} value={st.id}>{st.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Subject</label>
              <select value={materialForm.subjectId} onChange={(e) => setMaterialForm({ ...materialForm, subjectId: e.target.value, chapterId: '' })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none cursor-pointer" required>
                <option value="">Select Subject</option>
                {subjects.filter((sub: Subject) => materialForm.studentTypeId ? sub.applicableFor?.includes(materialForm.studentTypeId) : true).map((sub: Subject) => (
                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Chapter</label>
              <select value={materialForm.chapterId} onChange={(e) => setMaterialForm({ ...materialForm, chapterId: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" required disabled={!materialForm.subjectId}>
                <option value="">{materialForm.subjectId ? 'Select Chapter' : 'Please select subject first'}</option>
                {chapters.filter((c: Chapter) => c.subjectId === materialForm.subjectId).map((ch: Chapter) => (
                  <option key={ch.id} value={ch.id}>{ch.name}</option>
                ))}
              </select>
            </div>
          </div>
          <button type="submit" disabled={loading} className="py-2 px-6 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-wider cursor-pointer">Publish Resource</button>
        </form>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-800">Linked Study Resources</h3>
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
          {materials.map((mat: StudyMaterial) => (
            <div key={mat.id} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs">
              <div>
                <span className="font-bold block text-slate-950">{mat.title}</span>
                <span className="text-xs text-slate-400 uppercase font-semibold">{mat.type} - {mat.url.substring(0, 40)}...</span>
              </div>
              <button onClick={() => handleDeleteMaterial(mat.id)} className="text-red-500 hover:text-red-700 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
