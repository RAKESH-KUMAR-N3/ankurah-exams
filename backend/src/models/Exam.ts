import mongoose from 'mongoose';

const examSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  },
  { timestamps: true }
);

export default mongoose.model('Exam', examSchema);
