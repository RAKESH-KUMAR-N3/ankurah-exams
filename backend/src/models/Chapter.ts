import mongoose from 'mongoose';

delete mongoose.models.Chapter;

const chapterSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    subjectId: { type: mongoose.Schema.Types.Mixed, ref: 'Subject', required: true },
  },
  { timestamps: true }
);

export default mongoose.model('Chapter', chapterSchema);
