import mongoose from 'mongoose';

const testAttemptSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    testId: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
    score: { type: Number, required: true },
    responses: [
      {
        questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
        selectedOption: { type: String },
        isCorrect: { type: Boolean },
      }
    ],
  },
  { timestamps: true }
);

export default mongoose.model('TestAttempt', testAttemptSchema);
