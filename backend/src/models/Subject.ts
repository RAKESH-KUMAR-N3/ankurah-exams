import mongoose from 'mongoose';

delete mongoose.models.Subject;

const subjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    state: { type: String, enum: ['AP', 'TG', 'Both'], default: 'Both' },
    examId: { type: mongoose.Schema.Types.Mixed },
    examIds: [{ type: String }],
    subjectCategory: { type: String, default: 'entrance' },
    applicableFor: [{ type: mongoose.Schema.Types.Mixed }],
  },
  { timestamps: true }
);

export default mongoose.model('Subject', subjectSchema);
