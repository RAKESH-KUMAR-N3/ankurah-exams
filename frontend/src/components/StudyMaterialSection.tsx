import React, { useState } from 'react';
import { User, StudyMaterial, Subject, Chapter } from '../types';
import { BookOpen, FileText, Link as LinkIcon, Video, Download, Search, Tag, ExternalLink } from 'lucide-react';

interface StudyMaterialSectionProps {
  user: User;
  materials: StudyMaterial[];
  subjects: Subject[];
  chapters: Chapter[];
}

export default function StudyMaterialSection({
  user,
  materials,
  subjects,
  chapters
}: StudyMaterialSectionProps) {
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedChapter, setSelectedChapter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Get subjects that match user's selected exams
  const relevantSubjects = subjects.filter(sub => {
    return sub.examIds.some(id => 
      (user.selectedEntranceExams || []).includes(id) || 
      (user.selectedCompetitiveExams || []).includes(id)
    );
  });

  // 2. Filter chapters based on selected subject
  const relevantChapters = chapters.filter(ch => {
    if (selectedSubject === 'all') {
      return relevantSubjects.some(sub => sub.id === ch.subjectId);
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

    // Verify it is relevant to student's chosen exams
    const isExamRelevant = (user.selectedEntranceExams || []).includes(mat.examId) ||
                           (user.selectedCompetitiveExams || []).includes(mat.examId);
    return isExamRelevant;
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
            Access, download, and review curated materials mapped directly to your exams.
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
            const subject = subjects.find(s => s.id === mat.subjectId);
            const chapter = chapters.find(c => c.id === mat.chapterId);

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
                    <a 
                      href={mat.url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="py-1.5 px-3 bg-zinc-900 hover:bg-zinc-850 text-white rounded-sm text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-geom-sm"
                    >
                      {mat.type === 'pdf' ? (
                        <>
                          <Download className="w-3.5 h-3.5" /> Download PDF
                        </>
                      ) : mat.type === 'video' ? (
                        <>
                          <Video className="w-3.5 h-3.5" /> Watch Lecture
                        </>
                      ) : (
                        <>
                          <ExternalLink className="w-3.5 h-3.5" /> Open Resource
                        </>
                      )}
                    </a>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
