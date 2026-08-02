import { Response } from 'express';
import { AuthRequest as Request } from '../middlewares/authMiddleware';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import Plan from '../models/Plan';
import Exam from '../models/Exam';
import Transaction from '../models/Transaction';
import User from '../models/User';

const getMockPaymentEnabled = () => process.env.MOCK_PAYMENT === 'true';

const getRazorpay = () => new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'dummy',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy',
});

export const createOrder = async (req: Request, res: Response) => {
  try {
    const { planId } = req.body;
    const plan = await Plan.findById(planId);

    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    if (getMockPaymentEnabled()) {
      // Return a mock order ID
      return res.status(200).json({
        id: `mock_order_${Date.now()}`,
        amount: plan.price * 100, // paise
        currency: 'INR',
        mock: true,
      });
    }

    // Actual Razorpay Order Creation
    const options = {
      amount: plan.price * 100, // amount in smallest currency unit
      currency: 'INR',
      receipt: `receipt_order_${Date.now()}`,
    };

    const order = await getRazorpay().orders.create(options);
    return res.status(200).json({ ...order, mock: false });

  } catch (error: any) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Failed to create order', error: error.message });
  }
};

export const verifyPayment = async (req: Request, res: Response) => {
  try {
    const { planId, razorpay_order_id, razorpay_payment_id, razorpay_signature, studentTypeId } = req.body;
    const studentId = req.user?._id;

    if (!studentId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    const exam = plan.examId ? await Exam.findById(plan.examId) : null;
    const validityMonths = (exam as any)?.validityMonths || 12;
    const purchasedAt = new Date();
    const expiryDate = new Date(purchasedAt);
    expiryDate.setMonth(expiryDate.getMonth() + validityMonths);

    const updateFields: any = {
      $push: {
        purchasedPlans: {
          planId,
          examId: plan.examId,
          isActive: true,
          purchasedAt,
          expiryDate
        }
      }
    };
    if (studentTypeId) {
      updateFields.$set = { studentType: studentTypeId };
    }

    if (getMockPaymentEnabled()) {
      // Bypass signature verification for mock
      const transaction = new Transaction({
        studentId,
        planId,
        amount: plan.price,
        paymentMethod: 'mock_payment',
        status: 'success',
        transactionId: razorpay_order_id || `MOCK_TXN_${Date.now()}`,
      });
      await transaction.save();

      await User.findByIdAndUpdate(studentId, updateFields);

      return res.status(200).json({ message: 'Mock payment verified successfully' });
    }

    // Actual Razorpay Signature Verification
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(body.toString())
      .digest('hex');

    if (expectedSignature === razorpay_signature) {
      // Signature is valid
      const transaction = new Transaction({
        studentId,
        planId,
        amount: plan.price,
        amount_paid: plan.price,
        paymentMethod: 'razorpay',
        status: 'success',
        transactionId: razorpay_payment_id,
      });
      await transaction.save();

      await User.findByIdAndUpdate(studentId, updateFields);

      return res.status(200).json({ message: 'Payment verified successfully' });
    } else {
      return res.status(400).json({ message: 'Invalid payment signature' });
    }
  } catch (error: any) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ message: 'Failed to verify payment', error: error.message });
  }
};
