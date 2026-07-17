import express from 'express';
import { getPlans, purchasePlan, createPlan } from '../controllers/planController';
import { protect, authorize } from '../middlewares/authMiddleware';

const router = express.Router();

router.route('/')
  .get(protect, getPlans)
  .post(protect, authorize('admin'), createPlan);

router.post('/purchase', protect, purchasePlan);

export default router;
