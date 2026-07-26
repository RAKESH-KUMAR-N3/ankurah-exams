import mongoose from 'mongoose';

const stateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true }, // e.g. 'AP', 'TG'
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('State', stateSchema, 'states');
