import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'student'], default: 'student' },
    
    // Student specific fields
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    exams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Exam' }],
    studentType: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentType' },
    plan: { type: String, default: 'Yearly' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
