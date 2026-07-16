import React, { useState } from 'react';
import { User, EntranceExam, CompetitiveExam } from '../types';
import { Settings, Save, CheckCircle2, User as UserIcon, BookOpen, Sparkles } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const getToken = () => localStorage.getItem('token');
const authHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` });

interface SettingsSectionProps {
  user: User;
  entranceExams: EntranceExam[];
  competitiveExams: CompetitiveExam[];
  onProfileUpdated?: (updated: User) => void;
}

export default function SettingsSection({
  user,
  entranceExams,
  competitiveExams,
  onProfileUpdated
}: SettingsSectionProps) {
  const [name, setName] = useState(user.name);
  const [studentType, setStudentType] = useState(user.studentType || 'long_term');
  const [studyPlan, setStudyPlan] = useState(user.studyPlan || 'yearly');
  const [selectedEntrances, setSelectedEntrances] = useState<string[]>(user.selectedEntranceExams || []);
  const [selectedCompetitives, setSelectedCompetitives] = useState<string[]>(user.selectedCompetitiveExams || []);
  
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const toggleEntrance = (id: string) => {
    setSelectedEntrances(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleCompetitive = (id: string) => {
    setSelectedCompetitives(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await fetch(`${API_URL}/api/students/profile`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ name, studentType, studyPlan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update profile');

      setSuccessMsg('Academic profile updated successfully!');
      if (onProfileUpdated) {
        onProfileUpdated({ ...user, name, studentType, studyPlan });
      }
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update settings. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="settings_section" className="space-y-6 font-sans max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
          <Settings className="w-6 h-6 text-zinc-900" />
          Academic Profile & Settings
        </h1>
        <p className="text-zinc-500 text-sm mt-1">
          Customize your examination tracks, study plans, and personal student metrics.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-800 text-xs font-semibold flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-md text-rose-800 text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Basic Personal Profile info */}
        <div className="bg-white rounded-lg border border-geom-border p-6 shadow-geom space-y-4">
          <h3 className="font-bold text-zinc-900 text-sm flex items-center gap-2 pb-3 border-b border-geom-border">
            <UserIcon className="w-4.5 h-4.5 text-zinc-800" />
            Identity Details
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 border border-geom-border rounded-md text-zinc-900 font-semibold focus:outline-none focus:border-zinc-950"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Registered Email (Read-Only)</label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full px-3 py-2 bg-zinc-100 border border-geom-border rounded-md text-zinc-400 font-mono font-semibold"
              />
            </div>
          </div>
        </div>

        {/* Academic Program tracking */}
        <div className="bg-white rounded-lg border border-geom-border p-6 shadow-geom space-y-4">
          <h3 className="font-bold text-zinc-900 text-sm flex items-center gap-2 pb-3 border-b border-geom-border">
            <BookOpen className="w-4.5 h-4.5 text-zinc-800" />
            Academic Category & Planning
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Student Status / Category</label>
              <select
                value={studentType}
                onChange={(e) => setStudentType(e.target.value as any)}
                className="w-full px-3 py-2 bg-zinc-50 border border-geom-border rounded-md text-zinc-900 font-semibold focus:outline-none focus:border-zinc-950"
              >
                <option value="first_year">Intermediate 1st Year (Junior Colege)</option>
                <option value="second_year">Intermediate 2nd Year (Senior College)</option>
                <option value="long_term">JEE/NEET Long Term / Repeater</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Current Syllabus Study Plan</label>
              <select
                value={studyPlan}
                onChange={(e) => setStudyPlan(e.target.value as any)}
                className="w-full px-3 py-2 bg-zinc-50 border border-geom-border rounded-md text-zinc-900 font-semibold focus:outline-none focus:border-zinc-950"
              >
                <option value="yearly">Yearly Curriculum Coverage</option>
                <option value="half_yearly">Half-Yearly Intensive</option>
                <option value="quarterly">Quarterly Speedrun</option>
                <option value="custom">Self-Paced Custom Plan</option>
              </select>
            </div>
          </div>
        </div>

        {/* Target Examinations mappings */}
        <div className="bg-white rounded-lg border border-geom-border p-6 shadow-geom space-y-4">
          <h3 className="font-bold text-zinc-900 text-sm flex items-center gap-2 pb-3 border-b border-geom-border">
            <Sparkles className="w-4.5 h-4.5 text-zinc-800" />
            Syllabus Target Examinations
          </h3>
          <p className="text-zinc-500 text-[11px] leading-relaxed">
            Selecting examinations maps matching questions, mock test papers, and specific subjects directly into your daily dashboard slots.
          </p>

          <div className="space-y-4 text-xs">
            <div>
              <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Available College Entrance Exams</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {entranceExams.map(ex => {
                  const selected = selectedEntrances.includes(ex.id);
                  return (
                    <div
                      key={ex.id}
                      onClick={() => toggleEntrance(ex.id)}
                      className={`p-3 rounded-md border cursor-pointer transition-all flex items-center justify-between ${
                        selected 
                          ? 'bg-zinc-900 border-zinc-950 text-white shadow-geom-sm' 
                          : 'bg-zinc-50 border-geom-border hover:bg-zinc-100 text-zinc-700'
                      }`}
                    >
                      <div>
                        <span className="font-bold block text-[11px]">{ex.name}</span>
                        {ex.description && (
                          <span className={`text-[9px] block line-clamp-1 mt-0.5 ${selected ? 'text-zinc-400' : 'text-zinc-500'}`}>
                            {ex.description}
                          </span>
                        )}
                      </div>
                      <div className={`w-3.5 h-3.5 rounded-sm border shrink-0 flex items-center justify-center ${selected ? 'border-zinc-600 bg-emerald-500 text-white' : 'border-zinc-300 bg-white'}`}>
                        {selected && <span className="text-[9px] font-bold">✓</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 border-t border-geom-border">
              <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Available Public Competitive Exams</h4>
              {competitiveExams.length === 0 ? (
                <p className="text-[11px] text-zinc-400">No competitive exams are configured.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {competitiveExams.map(ex => {
                    const selected = selectedCompetitives.includes(ex.id);
                    return (
                      <div
                        key={ex.id}
                        onClick={() => toggleCompetitive(ex.id)}
                        className={`p-3 rounded-md border cursor-pointer transition-all flex items-center justify-between ${
                          selected 
                            ? 'bg-zinc-900 border-zinc-950 text-white shadow-geom-sm' 
                            : 'bg-zinc-50 border-geom-border hover:bg-zinc-100 text-zinc-700'
                        }`}
                      >
                        <div>
                          <span className="font-bold block text-[11px]">{ex.name}</span>
                          {ex.description && (
                            <span className={`text-[9px] block line-clamp-1 mt-0.5 ${selected ? 'text-zinc-400' : 'text-zinc-500'}`}>
                              {ex.description}
                            </span>
                          )}
                        </div>
                        <div className={`w-3.5 h-3.5 rounded-sm border shrink-0 flex items-center justify-center ${selected ? 'border-zinc-600 bg-emerald-500 text-white' : 'border-zinc-300 bg-white'}`}>
                          {selected && <span className="text-[9px] font-bold">✓</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-850 text-white text-xs font-bold rounded-sm uppercase tracking-wider cursor-pointer border border-zinc-900 shadow-geom flex items-center gap-2 transition-all"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Saving adjustments...' : 'Save Settings'}
          </button>
        </div>

      </form>
    </div>
  );
}
