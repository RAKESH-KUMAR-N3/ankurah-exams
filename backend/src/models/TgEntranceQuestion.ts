import mongoose from 'mongoose';

const tgEntranceQuestionSchema = new mongoose.Schema(
  {
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    chapterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter' },
    content: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctAnswer: { type: String, required: true },
    explanation: { type: String },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard', 'easy', 'medium', 'hard'], default: 'Medium' },
    marks: { type: Number },
    negativeMarks: { type: Number },
  },
  { timestamps: true }
);

tgEntranceQuestionSchema.index({ subjectId: 1, chapterId: 1 });

export default mongoose.model('TgEntranceQuestion', tgEntranceQuestionSchema, 'tgentrancequestions');
