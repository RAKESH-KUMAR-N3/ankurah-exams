import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    targetAudience: { 
      type: String, 
      enum: ['All', 'Exam', 'StudentType'], 
      required: true 
    },
    examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam' }, // If targetAudience is Exam
    studentTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentType' }, // If targetAudience is StudentType
    status: { type: String, enum: ['Draft', 'Published'], default: 'Draft' }
  },
  { timestamps: true }
);

export default mongoose.model('Notification', notificationSchema);
