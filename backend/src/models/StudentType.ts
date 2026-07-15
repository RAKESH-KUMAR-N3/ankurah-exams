import mongoose from 'mongoose';

const studentTypeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true }, // e.g., 'Inter 1st Year', 'Inter 2nd Year', 'Long Term'
  },
  { timestamps: true }
);

export default mongoose.model('StudentType', studentTypeSchema);
