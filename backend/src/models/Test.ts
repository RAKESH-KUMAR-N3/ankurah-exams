import mongoose from 'mongoose';

const testSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },

    // Multi-exam assignment: same test can be assigned to multiple exam groups/batches
    examIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Exam' }],

    // Multi-group targeting: same test can be assigned to multiple student groups
    studentTypeIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'StudentType' }],

    // Test type
    testType: { type: String, enum: ['Chapter', 'Grand', 'Weekly', 'Monthly', 'Practice'], required: true },

    // For Dynamic/Chapter tests
    isDynamic: { type: Boolean, default: false },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
    chapterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter' },
    dynamicTotalQuestions: { type: Number },
    targetDifficulty: { type: String, enum: ['Easy', 'Medium', 'Hard', 'Mixed'], default: 'Mixed' },

    // For Grand/Static tests - pre-loaded questions from CSV
    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],

    // Timing
    duration: { type: Number, required: true }, // in minutes

    // Marking scheme (global for all questions in this test)
    marksPerQuestion: { type: Number, default: 4 },
    negativeMarksPerQuestion: { type: Number, default: 1 },

    // Retake settings (0 = unlimited)
    retakeLimit: { type: Number, default: 0 },

    // Scope
    isFullSyllabus: { type: Boolean, default: false }, // true = Grand/Mock test

    // Visibility
    status: { type: String, enum: ['Draft', 'Published'], default: 'Draft' },

    instructions: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model('Test', testSchema);
