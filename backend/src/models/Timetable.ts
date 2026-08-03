import mongoose from 'mongoose';

const weeklyChapterSchema = new mongoose.Schema({
  subjectId: { type: String, required: true },
  subjectName: { type: String, required: true },
  chapterId: { type: String, default: '' },
  chapterName: { type: String, default: '' },
}, { _id: false });

const timetableSchema = new mongoose.Schema(
  {
    courseId: { type: String, required: true },
    courseName: { type: String },
    weekTitle: { type: String, required: true }, // e.g. 'Week 1', 'Week 2'
    weekNumber: { type: Number, default: 1 },
    startDate: { type: String, required: true }, // e.g. '2026-08-04'
    endDate: { type: String, required: true },   // e.g. '2026-08-10'
    weeklyChapters: [weeklyChapterSchema],      // Subject-wise assigned chapters
    weekendExamId: { type: String },            // Linked Test ID from Test model
    weekendExamTitle: { type: String },
    status: { type: String, enum: ['published', 'draft'], default: 'published' },
    
    // Legacy fields backward compatibility
    planId: { type: String },
    examId: { type: String },
    studentTypeId: { type: String },
    subjectIds: [{ type: String }],
    subjectId: { type: String },
    chapterName: { type: String },
    chapterId: { type: String },
    date: { type: String },
    scheduleType: { type: String, default: 'weekly' },
    dayOfWeek: { type: String },
    startTime: { type: String },
    endTime: { type: String },
    studyTopic: { type: String },
    imageUrl: { type: String },
    revision: { type: String },
    practiceMCQs: { type: String },
    assignment: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model('Timetable', timetableSchema);
