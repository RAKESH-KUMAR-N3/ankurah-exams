import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'student'], default: 'student' },
    
    // Student specific fields
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    studentType: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentType' },
    exams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Exam' }],
    purchasedPlans: [
      {
        planId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan' },
        examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam' },
        purchasedAt: { type: Date, default: Date.now },
        isActive: { type: Boolean, default: true }
      }
    ],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
