import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema(
  {
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    chapterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter' },
    content: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctAnswer: { type: String, required: true },
    explanation: { type: String },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
    // marks & negativeMarks are now handled globally at Test level (marksPerQuestion, negativeMarksPerQuestion)
    // Kept here as optional for backward compatibility only
    marks: { type: Number },
    negativeMarks: { type: Number },
  },
  { timestamps: true }
);

export default mongoose.model('Question', questionSchema);
