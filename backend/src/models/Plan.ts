import mongoose from 'mongoose';

const planSchema = new mongoose.Schema(
  {
    examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
    name: { type: String, required: true }, // e.g., 'Full Year Plan'
    price: { type: Number, required: true, default: 0 },
    description: { type: String },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.model('Plan', planSchema);
