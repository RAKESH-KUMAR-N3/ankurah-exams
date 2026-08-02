import mongoose from 'mongoose';

const competitiveQuestionBySubjectSchema = new mongoose.Schema(
  {
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'CompetitiveSubject', required: true },
    content: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctAnswer: { type: String, required: true },
    explanation: { type: String },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard', 'easy', 'medium', 'hard', 'EASY', 'MEDIUM', 'HARD'], default: 'Medium' },
    marks: { type: Number },
    negativeMarks: { type: Number },
  },
  { timestamps: true }
);

competitiveQuestionBySubjectSchema.index({ subjectId: 1 });

export default mongoose.model(
  'CompetitiveQuestionBySubject',
  competitiveQuestionBySubjectSchema,
  'competitivequestionsbysubjects'
);
