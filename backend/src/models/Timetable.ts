import mongoose from 'mongoose';

const timetableSchema = new mongoose.Schema(
  {
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
    studentTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentType' }, // Optional for competitive
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    chapterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter', required: true },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    studyTopic: { type: String, required: true },
    revision: { type: String },
    practiceMCQs: { type: String },
    assignment: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model('Timetable', timetableSchema);
