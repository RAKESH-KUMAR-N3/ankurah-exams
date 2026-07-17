import mongoose from 'mongoose';

const doubtSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam' },
    chapterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter' },
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
    content: { type: String, required: true },
    status: { type: String, enum: ['open', 'answered', 'closed'], default: 'open' },
    answer: { type: String },
    answeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    answeredAt: { type: Date }
  },
  { timestamps: true }
);

export default mongoose.model('Doubt', doubtSchema);
