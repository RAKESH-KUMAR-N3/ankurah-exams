import mongoose from 'mongoose';

const topicSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    chapterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter', required: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

topicSchema.index({ chapterId: 1 });

export default mongoose.model('Topic', topicSchema);
