import mongoose from 'mongoose';

const examSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    examId: { type: String, required: true, unique: true },
    description: { type: String },
    type: { type: String, enum: ['entrance', 'competitive'], default: 'entrance' },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    allowedStudentTypes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'StudentType' }],
  },
  { timestamps: true }
);

export default mongoose.model('Exam', examSchema);
