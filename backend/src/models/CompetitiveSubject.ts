import mongoose from 'mongoose';

const competitiveSubjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam' },
    subjectCategory: { type: String, default: 'competitive' },
  },
  { timestamps: true }
);

export default mongoose.model('CompetitiveSubject', competitiveSubjectSchema, 'competitivesubjects');
