import { Response } from 'express';
import { AuthRequest as Request } from '../middlewares/authMiddleware';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import Plan from '../models/Plan';
import Exam from '../models/Exam';
import Transaction from '../models/Transaction';
import User from '../models/User';

const getMockPaymentEnabled = () => {
  if (process.env.MOCK_PAYMENT === 'true') return true;
  if (process.env.MOCK_PAYMENT === 'false') return false;
  const keyId = process.env.RAZORPAY_KEY_ID || '';
  return !keyId || keyId === 'dummy' || keyId.includes('your_test_key');
};

const getRazorpay = () => new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'dummy',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy',
});

export const createOrder = async (req: Request, res: Response) => {
  try {
    const { planId } = req.body;
    if (!planId) {
      return res.status(400).json({ message: 'Plan ID is required' });
    }

    let plan: any = await Plan.findById(planId).catch(() => null);
    if (!plan) {
      plan = await Plan.findOne({ $or: [{ _id: planId }, { id: planId }, { examId: planId }] });
    }

    // If still not found in Plan model, fallback to Exam model
    if (!plan) {
      const examObj: any = await Exam.findById(planId).catch(() => null) || await Exam.findOne({ $or: [{ _id: planId }, { id: planId }] });
      if (examObj) {
        plan = {
          _id: examObj._id || examObj.id,
          name: examObj.name,
          price: examObj.price || 2500,
          examId: examObj._id || examObj.id
        };
      }
    }

    if (!plan) {
      return res.status(404).json({ message: 'Course plan not found' });
    }

    const priceAmount = plan.price || 2500;

    if (getMockPaymentEnabled()) {
      return res.status(200).json({
        id: `mock_order_${Date.now()}`,
        amount: priceAmount * 100, // paise
        currency: 'INR',
        mock: true,
      });
    }

    const options = {
      amount: priceAmount * 100,
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

    let plan: any = await Plan.findById(planId).catch(() => null);
    if (!plan) {
      plan = await Plan.findOne({ $or: [{ _id: planId }, { id: planId }, { examId: planId }] });
    }

    let examId = plan?.examId;
    let planPrice = plan?.price || 2500;

    if (!plan) {
      const examObj: any = await Exam.findById(planId).catch(() => null) || await Exam.findOne({ $or: [{ _id: planId }, { id: planId }] });
      if (examObj) {
        examId = examObj._id || examObj.id;
        planPrice = examObj.price || 2500;
      }
    }

    const validityMonths = 12;
    const purchasedAt = new Date();
    const expiryDate = new Date(purchasedAt);
    expiryDate.setMonth(expiryDate.getMonth() + validityMonths);

    const updateFields: any = {
      $push: {
        purchasedPlans: {
          planId,
          examId: examId || planId,
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
      const transaction = new Transaction({
        studentId,
        planId,
        amount: planPrice,
        paymentMethod: 'mock_payment',
        status: 'success',
        transactionId: razorpay_order_id || `MOCK_TXN_${Date.now()}`,
      });
      await transaction.save();

      await User.findByIdAndUpdate(studentId, updateFields);

      return res.status(200).json({ message: 'Mock payment verified successfully' });
    }

    // Actual Razorpay Signature verification
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(body.toString())
      .digest('hex');

    if (expectedSignature === razorpay_signature) {
      const transaction = new Transaction({
        studentId,
        planId,
        amount: planPrice,
        amount_paid: planPrice,
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
