import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, enum: ['Entrance Exams', 'Competitive Exams'] },
  },
  { timestamps: true }
);

export default mongoose.model('Category', categorySchema);
