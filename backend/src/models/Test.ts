import mongoose from 'mongoose';

delete mongoose.models.Test;

const testSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    categoryId: { type: mongoose.Schema.Types.Mixed, ref: 'Category' },

    // Multi-exam assignment: same test can be assigned to multiple exam groups/batches
    examIds: [{ type: mongoose.Schema.Types.Mixed, ref: 'Exam' }],

    // Multi-group targeting: same test can be assigned to multiple student groups
    studentTypeIds: [{ type: mongoose.Schema.Types.Mixed, ref: 'StudentType' }],

    // Test type
    testType: { type: String, enum: ['Chapter', 'Grand', 'Weekly', 'Monthly', 'Practice'], required: true },

    // For Dynamic/Chapter tests
    isDynamic: { type: Boolean, default: false },
    subjectId: { type: mongoose.Schema.Types.Mixed, ref: 'Subject' },
    chapterId: { type: mongoose.Schema.Types.Mixed, ref: 'Chapter' },
    dynamicTotalQuestions: { type: Number },
    targetDifficulty: { type: String, enum: ['Easy', 'Medium', 'Hard', 'Mixed'], default: 'Mixed' },

    // For Multi-Subject & Multi-Chapter Dynamic tests with weightage
    subjectConfigs: [
      {
        subjectId: { type: mongoose.Schema.Types.Mixed, ref: 'Subject' },
        chapters: [
          {
            chapterId: { type: mongoose.Schema.Types.Mixed, ref: 'Chapter' },
            questionCount: { type: Number, default: 0 },
          },
        ],
        totalQuestions: { type: Number, default: 0 },
      },
    ],

    // For Grand/Static tests - pre-loaded questions from CSV
    questions: [{ type: mongoose.Schema.Types.Mixed, ref: 'Question' }],

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
