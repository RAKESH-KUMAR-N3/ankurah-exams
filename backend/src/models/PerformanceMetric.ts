import mongoose from 'mongoose';

const performanceMetricSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
    overallAccuracy: { type: Number, default: 0 },
    chapterWiseStats: [
      {
        chapterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter' },
        accuracy: { type: Number, default: 0 },
        attemptedCount: { type: Number, default: 0 },
      }
    ],
  },
  { timestamps: true }
);

export default mongoose.model('PerformanceMetric', performanceMetricSchema);
