import mongoose from 'mongoose';

delete mongoose.models.CompetitiveSubject;

const competitiveSubjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    examId: { type: mongoose.Schema.Types.Mixed },
    examIds: [{ type: String }],
    subjectCategory: { type: String, default: 'competitive' },
  },
  { timestamps: true }
);

export default mongoose.model('CompetitiveSubject', competitiveSubjectSchema, 'competitivesubjects');
