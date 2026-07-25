import mongoose from 'mongoose';

const testAttemptSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    testId: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },

    // Which attempt number is this? (1 = first attempt, 2 = re-attempt, etc.)
    attemptNumber: { type: Number, default: 1 },

    score: { type: Number, default: 0 },
    totalMarks: { type: Number, default: 0 }, // Calculated at submit time

    responses: [
      {
        questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
        selectedOption: { type: String },
        isCorrect: { type: Boolean },
      }
    ],

    status: { type: String, enum: ['In-Progress', 'Completed', 'Force-Submitted'], default: 'In-Progress' },

    // Proctoring / Anti-cheat
    tabSwitchCount: { type: Number, default: 0 },
    autoSubmitted: { type: Boolean, default: false }, // true = auto-submitted due to 2nd tab switch or timeout

    // Timing
    timeTakenSeconds: { type: Number },
    submittedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model('TestAttempt', testAttemptSchema);
