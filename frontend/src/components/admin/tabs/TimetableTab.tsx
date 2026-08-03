import React, { useState } from 'react';
import { 
  Trash2, Calendar, BookOpen, Clock, Upload, Image as ImageIcon, 
  Check, AlertCircle, Sparkles, Layers, FileText, Plus, X, Eye, Shield
} from 'lucide-react';
import { Timetable, Subject } from '../../../types';
import { useAdminContext } from '../../../context/AdminContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const getToken = () => localStorage.getItem('token');
const authHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` });

export default function TimetableTab() {
  const { entranceExams, competitiveExams, subjects, allPlans, timetables, refreshAdminData } = useAdminContext();
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Deduplicate and extract exact unique 6 real courses created by Admin
  const rawPlans = [...allPlans, ...entranceExams, ...competitiveExams];
  const uniquePlansMap = new Map<string, { id: string; name: string; subjects: any[] }>();
  
  rawPlans.forEach((p: any) => {
    const cleanName = (p.name || '').replace(/\s*Plan\s*$/i, '').trim();
    if (!cleanName) return;
    const key = cleanName.toLowerCase();
    if (!uniquePlansMap.has(key)) {
      uniquePlansMap.set(key, {
        id: p.id || p._id,
        name: cleanName,
        subjects: p.subjects || []
      });
    }
  });
  const plansList = Array.from(uniquePlansMap.values());

  // Form State
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [scheduleType, setScheduleType] = useState<'daily' | 'weekly'>('daily');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dayOfWeek, setDayOfWeek] = useState<string>('Monday');
  
  // Multi-subject selection
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  
  // Topic Input Mode: 'text' vs 'image'
  const [inputMode, setInputMode] = useState<'text' | 'image'>('text');
  const [chapterName, setChapterName] = useState<string>('');
  const [studyTopic, setStudyTopic] = useState<string>('');
  const [revisionTopic, setRevisionTopic] = useState<string>('');
  const [practiceMCQsCount, setPracticeMCQsCount] = useState<number>(15);
  
  // Image Upload State
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  const [imagePreviewModalUrl, setImagePreviewModalUrl] = useState<string | null>(null);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setErrorMsg(null);
    refreshAdminData();
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setSuccessMsg(null);
    setTimeout(() => setErrorMsg(null), 5000);
  };

  // Filter subjects based on selected plan
  const filteredSubjects = selectedPlanId
    ? subjects.filter((s: any) => {
        if (!s.examIds || s.examIds.length === 0) return true;
        return s.examIds.includes(selectedPlanId);
      })
    : subjects;

  const toggleSubjectSelection = (subId: string) => {
    if (selectedSubjectIds.includes(subId)) {
      setSelectedSubjectIds(selectedSubjectIds.filter(id => id !== subId));
    } else {
      setSelectedSubjectIds([...selectedSubjectIds, subId]);
    }
  };

  // Handle Image File Upload (Base64)
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showError("Image size must be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadedImageUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCreateTimetable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanId) {
      showError("Please select a target Plan / Course first.");
      return;
    }

    if (selectedSubjectIds.length === 0) {
      showError("Please select at least one Subject.");
      return;
    }

    if (inputMode === 'text' && !studyTopic && !chapterName) {
      showError("Please enter Chapter Name or Study Topic details.");
      return;
    }

    if (inputMode === 'image' && !uploadedImageUrl) {
      showError("Please upload an image of the chapter & topic schedule.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        planId: selectedPlanId,
        examId: selectedPlanId,
        subjectIds: selectedSubjectIds,
        subjectId: selectedSubjectIds[0],
        chapterName: chapterName || 'Scheduled Topics',
        studyTopic: studyTopic || (inputMode === 'image' ? 'Image Timetable Schedule' : 'Daily Practice'),
        scheduleType,
        date: scheduleType === 'daily' ? date : '',
        dayOfWeek: scheduleType === 'weekly' ? dayOfWeek : '',
        imageUrl: inputMode === 'image' ? uploadedImageUrl : '',
        practiceMCQs: practiceMCQsCount.toString(),
        revision: revisionTopic
      };

      const res = await fetch(`${API_URL}/api/timetables`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to publish timetable schedule');

      // Reset form
      setChapterName('');
      setStudyTopic('');
      setRevisionTopic('');
      setUploadedImageUrl('');
      setSelectedSubjectIds([]);

      showSuccess("Timetable schedule published successfully!");
    } catch (err: any) {
      showError(err.message || "Failed to create timetable schedule.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTimetable = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this timetable entry?")) return;
    try {
      const res = await fetch(`${API_URL}/api/timetables/${id}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      if (!res.ok) throw new Error('Failed to delete timetable entry');
      showSuccess("Timetable slot deleted successfully.");
    } catch (err: any) {
      showError(err.message);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full text-slate-100 font-sans">
      
      {/* Alert Banners */}
      {errorMsg && (
        <div className="bg-rose-950/80 text-rose-200 p-4 rounded-2xl border border-rose-800 flex items-center gap-3 shadow-lg animate-shake">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span className="font-bold text-xs">{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="bg-emerald-950/80 text-emerald-200 p-4 rounded-2xl border border-emerald-800 flex items-center gap-3 shadow-lg">
          <Check className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="font-bold text-xs">{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* ─── LEFT COLUMN: TIMETABLE FORM ────────────────────────────────────────── */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md">
            
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white tracking-tight">Create Academic Timetable</h3>
                <p className="text-slate-400 text-xs font-medium">Assign daily/weekly study schedules to specific student plans.</p>
              </div>
            </div>

            <form onSubmit={handleCreateTimetable} className="space-y-6 text-xs">
              
              {/* STEP 1: SELECT TARGET PLAN / COURSE */}
              <div>
                <label className="block text-emerald-400 font-extrabold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" /> 1. Select Target Plan / Course
                </label>
                <select 
                  value={selectedPlanId} 
                  onChange={(e) => {
                    setSelectedPlanId(e.target.value);
                    setSelectedSubjectIds([]);
                  }} 
                  className="w-full p-3 bg-slate-950/80 border border-slate-700/80 rounded-xl text-white font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  required
                >
                  <option value="">-- Select Target Course ({plansList.length} Real Courses) --</option>
                  {plansList.map((plan: any) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* STEP 2: FREQUENCY & SCHEDULE TYPE */}
              <div>
                <label className="block text-emerald-400 font-extrabold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> 2. Schedule Type & Frequency
                </label>
                
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <button
                    type="button"
                    onClick={() => setScheduleType('daily')}
                    className={`py-2.5 px-4 rounded-xl font-extrabold uppercase tracking-wider cursor-pointer transition-all flex items-center justify-center gap-2 border ${
                      scheduleType === 'daily'
                        ? 'bg-emerald-500 text-black border-emerald-400 shadow-md'
                        : 'bg-slate-950/60 text-slate-300 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    <Calendar className="w-4 h-4" /> Daily Schedule
                  </button>
                  <button
                    type="button"
                    onClick={() => setScheduleType('weekly')}
                    className={`py-2.5 px-4 rounded-xl font-extrabold uppercase tracking-wider cursor-pointer transition-all flex items-center justify-center gap-2 border ${
                      scheduleType === 'weekly'
                        ? 'bg-cyan-500 text-black border-cyan-400 shadow-md'
                        : 'bg-slate-950/60 text-slate-300 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    <Clock className="w-4 h-4" /> Weekly Plan
                  </button>
                </div>

                {scheduleType === 'daily' ? (
                  <div>
                    <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1">Target Date</label>
                    <input 
                      type="date" 
                      value={date} 
                      onChange={(e) => setDate(e.target.value)} 
                      className="w-full p-3 bg-slate-950/80 border border-slate-700/80 rounded-xl text-white font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                      required 
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1">Day of Week</label>
                    <select 
                      value={dayOfWeek} 
                      onChange={(e) => setDayOfWeek(e.target.value)} 
                      className="w-full p-3 bg-slate-950/80 border border-slate-700/80 rounded-xl text-white font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
                    >
                      <option value="Monday">Monday</option>
                      <option value="Tuesday">Tuesday</option>
                      <option value="Wednesday">Wednesday</option>
                      <option value="Thursday">Thursday</option>
                      <option value="Friday">Friday</option>
                      <option value="Saturday">Saturday</option>
                      <option value="Sunday">Sunday</option>
                      <option value="Everyday">Everyday (All Days)</option>
                    </select>
                  </div>
                )}
              </div>

              {/* STEP 3: SELECT SUBJECTS (ONE OR MULTIPLE) */}
              <div>
                <label className="block text-emerald-400 font-extrabold uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" /> 3. Select Subject(s) (Multiple Allowed)</span>
                  <span className="text-[10px] text-slate-400">{selectedSubjectIds.length} selected</span>
                </label>

                {filteredSubjects.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 text-slate-400 text-center font-bold">
                    No subjects found for selected plan. Please select a plan or add subjects first.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[160px] overflow-y-auto p-2 bg-slate-950/60 rounded-xl border border-slate-800">
                    {filteredSubjects.map((sub: Subject) => {
                      const isSelected = selectedSubjectIds.includes(sub.id);
                      return (
                        <button
                          type="button"
                          key={sub.id}
                          onClick={() => toggleSubjectSelection(sub.id)}
                          className={`p-2.5 rounded-xl text-xs font-bold text-left transition-all cursor-pointer flex items-center justify-between border ${
                            isSelected
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm'
                              : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white'
                          }`}
                        >
                          <span className="truncate">{sub.name}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* STEP 4: CHAPTER & TOPIC DETAILS (TYPE TEXT OR UPLOAD IMAGE) */}
              <div>
                <label className="block text-emerald-400 font-extrabold uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> 4. Chapter & Topic Details</span>
                </label>

                {/* Input Mode Selector Tabs */}
                <div className="flex border-b border-slate-800 mb-4">
                  <button
                    type="button"
                    onClick={() => setInputMode('text')}
                    className={`py-2 px-4 font-bold text-xs cursor-pointer border-b-2 transition-all flex items-center gap-2 ${
                      inputMode === 'text'
                        ? 'border-emerald-400 text-emerald-400'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <FileText className="w-4 h-4" /> 📝 Type Text Details
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMode('image')}
                    className={`py-2 px-4 font-bold text-xs cursor-pointer border-b-2 transition-all flex items-center gap-2 ${
                      inputMode === 'image'
                        ? 'border-emerald-400 text-emerald-400'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <ImageIcon className="w-4 h-4" /> 🖼️ Upload Timetable Image
                  </button>
                </div>

                {inputMode === 'text' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1">Chapter Name</label>
                      <input 
                        type="text" 
                        value={chapterName} 
                        onChange={(e) => setChapterName(e.target.value)} 
                        className="w-full p-3 bg-slate-950/80 border border-slate-700/80 rounded-xl text-white font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                        placeholder="e.g. Kinematics & Laws of Motion" 
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1">Study Topic & Details</label>
                      <textarea 
                        rows={2} 
                        value={studyTopic} 
                        onChange={(e) => setStudyTopic(e.target.value)} 
                        className="w-full p-3 bg-slate-950/80 border border-slate-700/80 rounded-xl text-white font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" 
                        placeholder="e.g. Newton's 2nd Law problem solving & MCQ practice sheet" 
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-slate-400 font-bold uppercase tracking-wider mb-2">Upload Timetable Image Schedule</label>
                    {uploadedImageUrl ? (
                      <div className="relative p-3 rounded-xl bg-slate-950 border border-emerald-500/50 flex flex-col items-center gap-3">
                        <img 
                          src={uploadedImageUrl} 
                          alt="Timetable Preview" 
                          className="max-h-48 rounded-lg object-contain border border-slate-800" 
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setImagePreviewModalUrl(uploadedImageUrl)}
                            className="px-3 py-1.5 bg-slate-800 text-slate-200 rounded-lg text-xs font-bold hover:bg-slate-700 cursor-pointer flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" /> Preview Full
                          </button>
                          <button
                            type="button"
                            onClick={() => setUploadedImageUrl('')}
                            className="px-3 py-1.5 bg-rose-950 text-rose-300 rounded-lg text-xs font-bold hover:bg-rose-900 cursor-pointer flex items-center gap-1 border border-rose-800"
                          >
                            <X className="w-3.5 h-3.5" /> Remove Image
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-slate-700/80 bg-slate-950/60 hover:border-emerald-500/80 cursor-pointer transition-all group">
                        <Upload className="w-8 h-8 text-slate-400 group-hover:text-emerald-400 mb-2 transition-colors" />
                        <span className="font-extrabold text-white text-xs">Click or drag image file here</span>
                        <span className="text-[10px] text-slate-400 mt-0.5">Supports PNG, JPG, WEBP (Max 5MB)</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleImageChange} 
                          className="hidden" 
                        />
                      </label>
                    )}
                  </div>
                )}
              </div>

              {/* Extra Practice & Revision Targets */}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800">
                <div>
                  <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1">Practice MCQ Target</label>
                  <input 
                    type="number" 
                    value={practiceMCQsCount} 
                    onChange={(e) => setPracticeMCQsCount(parseInt(e.target.value, 10) || 0)} 
                    className="w-full p-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1">Revision Note (Optional)</label>
                  <input 
                    type="text" 
                    value={revisionTopic} 
                    onChange={(e) => setRevisionTopic(e.target.value)} 
                    className="w-full p-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-white font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                    placeholder="e.g. Formula revision" 
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading} 
                className="w-full py-3.5 px-6 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black font-black uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {loading ? (
                  <span>Publishing Schedule...</span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Publish Timetable Schedule
                  </>
                )}
              </button>

            </form>
          </div>
        </div>

        {/* ─── RIGHT COLUMN: PUBLISHED SCHEDULE ENTRIES LIST ────────────────────────── */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-400" />
              Published Schedules ({timetables.length})
            </h3>
          </div>

          <div className="space-y-3 max-h-[700px] overflow-y-auto pr-1">
            {timetables.map((tb: Timetable) => {
              const targetPlanObj = plansList.find(p => p.id === tb.planId || p.id === tb.examId);
              const targetPlanName = targetPlanObj ? targetPlanObj.name : 'All Enrolled Students';

              // Map subject names
              const mappedSubjectNames = (tb.subjectIds || (tb.subjectId ? [tb.subjectId] : [])).map(sId => {
                const subObj = subjects.find(s => s.id === sId || (s as any)._id === sId);
                return subObj ? subObj.name : 'Core Subject';
              });

              return (
                <div 
                  key={tb.id || tb._id} 
                  className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl flex flex-col gap-2.5 hover:border-slate-700 transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-extrabold text-[10px] uppercase tracking-wider border border-emerald-500/30">
                        {targetPlanName}
                      </span>
                      <span className="ml-2 px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-400 font-extrabold text-[10px] uppercase tracking-wider border border-cyan-500/30">
                        {tb.scheduleType === 'weekly' ? `Weekly (${tb.dayOfWeek || 'All Days'})` : `Daily (${tb.date || 'Scheduled'})`}
                      </span>
                    </div>

                    <button 
                      onClick={() => handleDeleteTimetable(tb.id || tb._id || '')} 
                      className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer transition-colors"
                      title="Delete Timetable"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Subject Badges */}
                  <div className="flex flex-wrap gap-1">
                    {mappedSubjectNames.map((sName, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] font-bold rounded border border-slate-700">
                        {sName}
                      </span>
                    ))}
                  </div>

                  {/* Content: Text vs Image */}
                  {tb.imageUrl ? (
                    <div className="relative group rounded-xl overflow-hidden border border-slate-800 bg-slate-950 p-2 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img 
                          src={tb.imageUrl} 
                          alt="Timetable Schedule" 
                          className="w-16 h-12 rounded object-cover border border-slate-700" 
                        />
                        <div>
                          <span className="font-extrabold text-xs text-white block">Image Schedule Attached</span>
                          <span className="text-[10px] text-slate-400">Click to expand schedule image</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setImagePreviewModalUrl(tb.imageUrl || '')}
                        className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-bold hover:bg-emerald-500/30 cursor-pointer flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {tb.chapterName && (
                        <div className="font-extrabold text-xs text-white">Ch: {tb.chapterName}</div>
                      )}
                      <div className="text-xs text-slate-300 font-medium">{tb.studyTopic || tb.title}</div>
                    </div>
                  )}

                  {/* Footer Meta */}
                  <div className="flex justify-between items-center pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 font-semibold">
                    <span>MCQ Target: <strong className="text-white font-mono">{tb.practiceMCQsCount || 10} Questions</strong></span>
                    {tb.revisionTopic && <span>Rev: <strong className="text-amber-400">{tb.revisionTopic}</strong></span>}
                  </div>

                </div>
              );
            })}

            {timetables.length === 0 && (
              <div className="text-center text-xs text-slate-500 py-12 font-bold bg-slate-900/60 rounded-2xl border border-slate-800">
                No published timetable schedules yet.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* FULL IMAGE PREVIEW MODAL */}
      {imagePreviewModalUrl && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col items-center">
            <button
              onClick={() => setImagePreviewModalUrl(null)}
              className="absolute top-4 right-4 p-2 bg-slate-800 text-slate-300 hover:text-white rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h4 className="text-sm font-bold text-white mb-3">Timetable Image Schedule Preview</h4>
            <img 
              src={imagePreviewModalUrl} 
              alt="Full Timetable Schedule" 
              className="max-h-[80vh] w-auto rounded-xl object-contain border border-slate-800" 
            />
          </div>
        </div>
      )}

    </div>
  );
}
