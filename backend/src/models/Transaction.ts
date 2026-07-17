import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    planId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', required: true },
    amount: { type: Number, required: true },
    paymentMethod: { type: String, default: 'razorpay_dummy' },
    status: { type: String, enum: ['success', 'failed', 'pending'], default: 'success' },
    transactionId: { type: String, required: true, unique: true }, // Dummy or real razorpay ID
  },
  { timestamps: true }
);

export default mongoose.model('Transaction', transactionSchema);
