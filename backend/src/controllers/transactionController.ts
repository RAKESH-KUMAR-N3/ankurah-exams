import { Response } from 'express';
import { AuthRequest as Request } from '../middlewares/authMiddleware';
import Transaction from '../models/Transaction';
import User from '../models/User';
import Plan from '../models/Plan';

export const getTransactions = async (req: Request, res: Response) => {
  try {
    const transactions = await Transaction.find()
      .populate('studentId', 'name email')
      .populate('planId', 'name examId')
      .sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createMockTransaction = async (req: Request, res: Response) => {
  try {
    const { planId } = req.body;
    const studentId = req.user?._id;

    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    const transaction = new Transaction({
      studentId,
      planId,
      amount: plan.price,
      transactionId: `MOCK_TXN_${Date.now()}`,
    });

    await transaction.save();

    // Also update user's purchasedPlans
    await User.findByIdAndUpdate(studentId, {
      $push: {
        purchasedPlans: {
          planId,
          examId: plan.examId,
          isActive: true
        }
      }
    });

    res.status(201).json(transaction);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
