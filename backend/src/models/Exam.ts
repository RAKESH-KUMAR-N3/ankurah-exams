import mongoose from 'mongoose';

const examSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    examId: { type: String, required: true, unique: true },
    description: { type: String },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  },
  { timestamps: true }
);

export default mongoose.model('Exam', examSchema);
