import mongoose from 'mongoose';

const testSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
    studentTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentType' }, // Optional for competitive
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }, // Optional (for grand tests)
    chapterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter' }, // Optional (for specific tests)
    testType: { type: String, enum: ['Weekly', 'Monthly', 'Practice'], required: true },
    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
    duration: { type: Number, required: true }, // in minutes
    totalMarks: { type: Number, required: true },
    instructions: { type: String },
    negativeMarking: { type: Boolean, default: false },
    status: { type: String, enum: ['Draft', 'Published'], default: 'Draft' },
  },
  { timestamps: true }
);

export default mongoose.model('Test', testSchema);
