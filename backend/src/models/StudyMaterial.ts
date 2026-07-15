import mongoose from 'mongoose';

const studyMaterialSchema = new mongoose.Schema(
  {
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
    studentTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentType' }, // Optional
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    chapterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter', required: true },
    title: { type: String, required: true },
    type: { type: String, enum: ['PDF', 'Notes', 'External Link', 'Video URL'], required: true },
    url: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model('StudyMaterial', studyMaterialSchema);
