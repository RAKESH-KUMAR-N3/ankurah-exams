import React from 'react';
import { Trash2 } from 'lucide-react';
import { Timetable, Subject } from '../../../types';

export default function TimetableTab({
  timetableForm,
  setTimetableForm,
  handleCreateTimetable,
  handleDeleteTimetable,
  entranceExams,
  competitiveExams,
  subjects,
  timetables,
  loading
}: any) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-800">Define Academic Daily Slot</h3>
        <form onSubmit={handleCreateTimetable} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Slot ID</label>
              <input type="text" value={timetableForm.id} onChange={(e) => setTimetableForm({ ...timetableForm, id: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none" required />
            </div>
            <div>
              <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Date</label>
              <input type="date" value={timetableForm.date} onChange={(e) => setTimetableForm({ ...timetableForm, date: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none" required />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Target Exam</label>
              <select value={timetableForm.examId} onChange={(e) => setTimetableForm({ ...timetableForm, examId: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none" required>
                <option value="">Select Exam</option>
                {[...entranceExams, ...competitiveExams].map((ex: any) => (
                  <option key={ex.id} value={ex.id}>{ex.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Student Track</label>
              <select value={timetableForm.studentType} onChange={(e) => setTimetableForm({ ...timetableForm, studentType: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none" required>
                <option value="long_term">Long Term</option>
                <option value="regular_11">Senior Intermediate</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Subject</label>
              <select value={timetableForm.subjectId} onChange={(e) => setTimetableForm({ ...timetableForm, subjectId: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none" required>
                <option value="">Select Subject</option>
                {subjects.map((sub: Subject) => (
                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Study Topic Title</label>
            <input type="text" value={timetableForm.title} onChange={(e) => setTimetableForm({ ...timetableForm, title: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none" placeholder="e.g. Friction and laws of motion practice" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Practice MCQ Target</label>
              <input type="number" value={timetableForm.practiceMCQsCount} onChange={(e) => setTimetableForm({ ...timetableForm, practiceMCQsCount: parseInt(e.target.value, 10) })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none" />
            </div>
            <div>
              <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Revision Topic</label>
              <input type="text" value={timetableForm.revisionTopic} onChange={(e) => setTimetableForm({ ...timetableForm, revisionTopic: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none" placeholder="e.g. kinematics basics" />
            </div>
          </div>
          <button type="submit" disabled={loading} className="py-2 px-6 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-wider cursor-pointer">Publish Daily Slot</button>
        </form>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-800">Published Schedule Entries</h3>
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
          {timetables.map((tb: Timetable) => (
            <div key={tb.id} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs">
              <div>
                <span className="font-bold text-slate-950 block">{tb.studyTopic}</span>
                <span className="text-xs text-slate-400 font-semibold uppercase">{tb.date} - MCQs: {tb.practiceMCQsCount}</span>
              </div>
              <button onClick={() => handleDeleteTimetable(tb.id)} className="text-red-500 hover:text-red-700 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
