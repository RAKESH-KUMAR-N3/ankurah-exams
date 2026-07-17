import express from 'express';
import { getTransactions, createMockTransaction } from '../controllers/transactionController';
import { protect, authorize } from '../middlewares/authMiddleware';

const router = express.Router();

router.route('/')
  .get(protect, authorize('admin'), getTransactions);

router.post('/mock', protect, createMockTransaction); // For students or testing

export default router;
