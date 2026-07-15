import mongoose from 'mongoose';

const chapterSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  },
  { timestamps: true }
);

export default mongoose.model('Chapter', chapterSchema);
