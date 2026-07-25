import React, { useState } from 'react';
import { User, StudyMaterial, Subject, Chapter } from '../../types';
import { BookOpen, FileText, Link as LinkIcon, Video, Eye, Search, Tag, ExternalLink, X } from 'lucide-react';

import { StudentType } from '../../types';

interface StudyMaterialSectionProps {
  user: User;
  materials: StudyMaterial[];
  subjects: Subject[];
  chapters: Chapter[];
  studentTypes?: StudentType[];
}

export default function StudyMaterialSection({
  user,
  materials,
  subjects,
  chapters,
  studentTypes = []
}: StudyMaterialSectionProps) {
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedChapter, setSelectedChapter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeViewer, setActiveViewer] = useState<{ title: string; url: string; type: string } | null>(null);

  // Determine student's assigned group name
  const studentTypeObj = studentTypes.find(st => (st.id || (st as any)._id) === (user as any).studentType || st.name === user.studentType);
  const studentGroupName = studentTypeObj
    ? studentTypeObj.name
    : (typeof user.studentType === 'object' ? (user.studentType as any)?.name : user.studentType || '');

  // Get all active exam IDs for the student
  const purchasedExamIds = (user.purchasedPlans || [])
    .filter((p: any) => p.isActive !== false)
    .map((p: any) => (p.examId?._id || p.examId || '').toString());

  const userExamIds = [
    ...(user.selectedEntranceExams || []).map((e: any) => (e._id || e.id || e).toString()),
    ...(user.selectedCompetitiveExams || []).map((e: any) => (e._id || e.id || e).toString()),
    ...purchasedExamIds
  ].filter(Boolean);

  // 1. Get subjects that match user's selected/purchased exams
  const examMatchedSubjects = subjects.filter(sub => {
    if (!sub.examIds || sub.examIds.length === 0) return true; // General subject for all
    if (userExamIds.length === 0) return true;
    return sub.examIds.some(id => userExamIds.includes(((id as any)?._id || id || '').toString()));
  });

  // 2. Filter subjects strictly according to the student's group (State: AP/TG, Stream: MPC/BiPC, Year: 1st/2nd)
  const relevantSubjects = (() => {
    if (!studentGroupName) return examMatchedSubjects;
    const lowerGroup = studentGroupName.toLowerCase();

    const isTG = lowerGroup.includes('(tg)') || lowerGroup.includes(' tg');
    const isAP = lowerGroup.includes('(ap)') || lowerGroup.includes(' ap');
    const isMPC = lowerGroup.includes('mpc');
    const isBIPC = lowerGroup.includes('bipc');
    const is1stYear = lowerGroup.includes('1st');
    const is2ndYear = lowerGroup.includes('2nd');

    return examMatchedSubjects.filter(sub => {
      const sName = (sub.name || '').toLowerCase();

      // State filter: AP vs TG
      if (isTG && (sName.includes('(ap)') || sName.includes(' ap'))) return false;
      if (isAP && (sName.includes('(tg)') || sName.includes(' tg'))) return false;

      // Stream filter: MPC vs BiPC
      if (isMPC && (sName.includes('botany') || sName.includes('zoology'))) return false;
      if (isBIPC && (sName.includes('maths 1a') || sName.includes('maths 1b') || sName.includes('maths 2a') || sName.includes('maths 2b'))) return false;

      // Year filter: 1st year vs 2nd year
      if (is1stYear) {
        if (sName.includes(' 2a') || sName.includes(' 2b') || sName.includes('physics 2') || sName.includes('chemistry 2') || sName.includes('botany 2') || sName.includes('zoology 2')) return false;
      }
      if (is2ndYear) {
        if (sName.includes(' 1a') || sName.includes(' 1b') || sName.includes('physics 1') || sName.includes('chemistry 1') || sName.includes('botany 1') || sName.includes('zoology 1')) return false;
      }

      return true;
    });
  })();

  // 2. Filter chapters based on selected subject
  const relevantChapters = chapters.filter(ch => {
    if (selectedSubject === 'all') {
      return relevantSubjects.some(sub => sub.id === ch.subjectId || (sub as any)._id === ch.subjectId);
    }
    return ch.subjectId === selectedSubject;
  });

  // 3. Filter study materials based on selections and search query
  const filteredMaterials = materials.filter(mat => {
    // Check subject
    if (selectedSubject !== 'all' && mat.subjectId !== selectedSubject) {
      return false;
    }
    // Check chapter
    if (selectedChapter !== 'all' && mat.chapterId !== selectedChapter) {
      return false;
    }
    // Check search query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchTitle = mat.title.toLowerCase().includes(q);
      const matchDesc = mat.description?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc) return false;
    }

    // Verify it is relevant to student's chosen/purchased exams
    const matExamId = (((mat as any).examId?._id || mat.examId || '')).toString();
    if (!matExamId) return true; // General material for all
    if (userExamIds.length === 0) return true;
    return userExamIds.includes(matExamId);
  });

  const getIconForType = (type: StudyMaterial['type']) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-5 h-5 text-red-600" />;
      case 'video':
        return <Video className="w-5 h-5 text-purple-600" />;
      case 'link':
        return <LinkIcon className="w-5 h-5 text-blue-600" />;
      default:
        return <BookOpen className="w-5 h-5 text-emerald-600" />;
    }
  };

  const getLabelForType = (type: StudyMaterial['type']) => {
    switch (type) {
      case 'pdf': return 'PDF Document';
      case 'video': return 'Video Lecture';
      case 'link': return 'Reference Link';
      default: return 'Study Notes';
    }
  };

  const getFullUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
      return url;
    }
    const cleanPath = url.startsWith('/') ? url : `/${url}`;
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return `${apiUrl}${cleanPath}`;
  };

  return (
    <div id="study_material_section" className="space-y-6 font-sans">
      
      {/* Title & Search bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-zinc-900" />
            Study Materials Catalog
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Access, view, and review curated materials mapped directly to your exams.
          </p>
        </div>

        {/* Search input */}
        <div className="relative max-w-xs w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search material titles..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-geom-border rounded-md text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-850 text-sm transition-all shadow-geom-sm"
          />
          <Search className="absolute left-3.5 top-2.5 w-4.5 h-4.5 text-zinc-400" />
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white p-4 rounded-lg border border-geom-border shadow-geom flex flex-col md:flex-row gap-4">
        {/* Subject dropdown */}
        <div className="flex-1 space-y-1">
          <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Filter Subject</label>
          <select
            value={selectedSubject}
            onChange={(e) => {
              setSelectedSubject(e.target.value);
              setSelectedChapter('all'); // reset chapter on subject switch
            }}
            className="w-full px-3 py-2 bg-zinc-50 border border-geom-border rounded-md text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-850 text-sm transition-all cursor-pointer"
          >
            <option value="all">All Subjects ({relevantSubjects.length})</option>
            {relevantSubjects.map(sub => (
              <option key={sub.id} value={sub.id}>{sub.name}</option>
            ))}
          </select>
        </div>

        {/* Chapter dropdown */}
        <div className="flex-1 space-y-1">
          <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Filter Chapter</label>
          <select
            value={selectedChapter}
            onChange={(e) => setSelectedChapter(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-50 border border-geom-border rounded-md text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-850 text-sm transition-all cursor-pointer"
          >
            <option value="all">All Chapters ({relevantChapters.length})</option>
            {relevantChapters.map(ch => (
              <option key={ch.id} value={ch.id}>{ch.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Material cards grid */}
      {filteredMaterials.length === 0 ? (
        <div className="bg-white rounded-lg border border-geom-border p-12 text-center shadow-geom">
          <FileText className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
          <h3 className="font-bold text-zinc-800 text-base">No Materials Available</h3>
          <p className="text-zinc-500 text-xs mt-1 max-w-sm mx-auto leading-relaxed">
            We couldn't find any study materials matching your selected filters or search parameters. Try clearing filters or searching for different keywords!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMaterials.map(mat => {
            const subject = subjects.find(s => s.id === mat.subjectId || (s as any)._id === mat.subjectId);
            const chapter = chapters.find(c => c.id === mat.chapterId || (c as any)._id === mat.chapterId);

            return (
              <div 
                key={mat.id} 
                className="bg-white rounded-lg border border-geom-border overflow-hidden hover:border-zinc-400 hover:shadow-geom-md transition-all flex flex-col justify-between group"
              >
                {/* Header graphic representing type */}
                <div className="h-24 bg-zinc-50 relative overflow-hidden flex items-center justify-center border-b border-geom-border geom-grid-pattern">
                  <div className="relative z-10 p-2.5 bg-white rounded-md shadow-geom-sm border border-geom-border group-hover:scale-105 transition-transform duration-200">
                    {getIconForType(mat.type)}
                  </div>
                  
                  {/* Subject badge floating */}
                  <span className="absolute top-3 left-3 px-2 py-0.5 bg-zinc-900 text-white font-bold text-[9px] rounded-sm tracking-wider uppercase shadow-geom-sm border border-zinc-800">
                    {subject?.name || 'General'}
                  </span>

                  <span className="absolute top-3 right-3 px-2 py-0.5 bg-white border border-geom-border text-zinc-600 font-bold text-[9px] rounded-sm uppercase tracking-wider shadow-geom-sm">
                    {getLabelForType(mat.type)}
                  </span>
                </div>

                {/* Content */}
                <div className="p-5 space-y-3 flex-grow flex flex-col justify-between">
                  <div className="space-y-1.5">
                    {chapter && (
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide flex items-center gap-1">
                        <Tag className="w-3 h-3 text-zinc-300" />
                        {chapter.name}
                      </span>
                    )}
                    <h3 className="font-bold text-zinc-900 text-sm leading-snug group-hover:text-zinc-950 transition-colors line-clamp-2">
                      {mat.title}
                    </h3>
                    <p className="text-zinc-500 text-xs leading-relaxed line-clamp-3">
                      {mat.description || 'No description provided for this academic study resource.'}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-geom-border flex items-center justify-between">
                    <span className="text-[9px] text-zinc-400 uppercase font-bold tracking-wider">
                      Status: Active
                    </span>
                    <button 
                      onClick={() => setActiveViewer({ title: mat.title, url: mat.url, type: mat.type })}
                      className="py-1.5 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      {mat.type === 'pdf' ? 'View PDF' : mat.type === 'video' ? 'Watch Lecture' : 'View Material'}
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* In-App Document & Video Viewer Modal */}
      {activeViewer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 md:p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden relative border border-slate-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0 select-none">
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-emerald-400" />
                <h3 className="font-extrabold text-sm md:text-base text-white truncate max-w-md md:max-w-xl">
                  {activeViewer.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveViewer(null)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Viewer */}
            <div className="flex-grow bg-slate-100 relative overflow-hidden select-none" onContextMenu={e => e.preventDefault()}>
              {activeViewer.type === 'video' ? (
                <iframe
                  src={getFullUrl(activeViewer.url).includes('youtube.com') || getFullUrl(activeViewer.url).includes('youtu.be')
                    ? getFullUrl(activeViewer.url).replace('watch?v=', 'embed/')
                    : getFullUrl(activeViewer.url)}
                  title={activeViewer.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <iframe
                  src={`${getFullUrl(activeViewer.url)}#toolbar=0&navpanes=0&scrollbar=1`}
                  title={activeViewer.title}
                  className="w-full h-full border-0"
                />
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
