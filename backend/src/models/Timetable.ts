import mongoose from 'mongoose';

const timetableSchema = new mongoose.Schema(
  {
    planId: { type: String },
    examId: { type: String },
    studentTypeId: { type: String },
    subjectIds: [{ type: String }],
    subjectId: { type: String },
    chapterName: { type: String },
    chapterId: { type: String },
    date: { type: String },
    scheduleType: { type: String, default: 'daily' }, // 'daily' | 'weekly'
    dayOfWeek: { type: String }, // e.g. 'Monday', 'Everyday'
    startTime: { type: String },
    endTime: { type: String },
    studyTopic: { type: String },
    imageUrl: { type: String }, // Base64 or image URL for uploaded schedule image
    revision: { type: String },
    practiceMCQs: { type: String },
    assignment: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model('Timetable', timetableSchema);
