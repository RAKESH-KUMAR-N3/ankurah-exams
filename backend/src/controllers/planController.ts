import { Request, Response } from 'express';
import Plan from '../models/Plan';
import User from '../models/User';
import Exam from '../models/Exam';
import Category from '../models/Category';

// Get all plans grouped by category
export const getPlans = async (req: Request, res: Response): Promise<void> => {
  try {
    const plans = await Plan.find({ isActive: true }).populate({
      path: 'examId',
      populate: { path: 'categoryId' }
    });
    
    // We can just return raw plans and let frontend group them, or group them here.
    res.json(plans);
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ message: 'Server error fetching plans' });
  }
};

// Purchase a plan
export const purchasePlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { planId } = req.body;
    const userId = (req as any).user.id; // from auth middleware

    const plan = await Plan.findById(planId);
    if (!plan) {
      res.status(404).json({ message: 'Plan not found' });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Check if already purchased
    const alreadyPurchased = user.purchasedPlans.some(p => p.planId?.toString() === planId);
    if (alreadyPurchased) {
      res.status(400).json({ message: 'Plan already purchased' });
      return;
    }

    user.purchasedPlans.push({
      planId: plan._id,
      examId: plan.examId,
      purchasedAt: new Date(),
      isActive: true
    });

    await user.save();
    res.status(200).json({ message: 'Plan purchased successfully', purchasedPlans: user.purchasedPlans });
  } catch (error) {
    console.error('Error purchasing plan:', error);
    res.status(500).json({ message: 'Server error purchasing plan' });
  }
};

// Create a plan (Admin)
export const createPlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { examId, name, price, description } = req.body;
    const newPlan = new Plan({ examId, name, price, description });
    await newPlan.save();
    res.status(201).json(newPlan);
  } catch (error) {
    res.status(500).json({ message: 'Server error creating plan' });
  }
};
