import mongoose from 'mongoose';

const studentGroupByStateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // e.g. 'Inter 1st Year (MPC)'
    state: { type: String, required: true }, // e.g. 'AP', 'TG'
    stateId: { type: mongoose.Schema.Types.ObjectId, ref: 'State' },
  },
  { timestamps: true }
);

studentGroupByStateSchema.index({ name: 1, state: 1 }, { unique: true });

export default mongoose.model('StudentGroupByState', studentGroupByStateSchema, 'studentgroupsbystates');
