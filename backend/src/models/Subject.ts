import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    state: { type: String, enum: ['AP', 'TG', 'Both'], default: 'Both' },
    examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam' },
    subjectCategory: { type: String, enum: ['entrance', 'competitive'], default: 'entrance' },
    applicableFor: [{ type: mongoose.Schema.Types.ObjectId, ref: 'StudentType' }],
  },
  { timestamps: true }
);

export default mongoose.model('Subject', subjectSchema);
