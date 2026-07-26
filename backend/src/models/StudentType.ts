import mongoose from 'mongoose';

const studentTypeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    state: { type: String, required: true }, // 'AP', 'TG', etc.
    stateId: { type: mongoose.Schema.Types.ObjectId, ref: 'State' },
  },
  { timestamps: true }
);

studentTypeSchema.index({ name: 1, state: 1 }, { unique: true });

// Explicitly store in 'studentgroupsbystates' collection in MongoDB
export default mongoose.model('StudentType', studentTypeSchema, 'studentgroupsbystates');
