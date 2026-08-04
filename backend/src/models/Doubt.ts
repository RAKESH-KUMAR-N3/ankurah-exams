import mongoose from 'mongoose';

const doubtSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    testId: { type: mongoose.Schema.Types.ObjectId, ref: 'Test' },        // Which test this doubt is from
    testAttemptId: { type: mongoose.Schema.Types.ObjectId, ref: 'TestAttempt' }, // Which specific attempt
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' }, // The question in doubt (optional for general doubts)
    content: { type: String, required: true },                            // Student's doubt message
    status: { type: String, enum: ['open', 'answered', 'closed'], default: 'open' },
    adminReply: { type: String },                                         // Admin's reply (was 'answer')
    repliedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },    // Which admin replied
    repliedAt: { type: Date }
  },
  { timestamps: true }
);

export default mongoose.model('Doubt', doubtSchema);
