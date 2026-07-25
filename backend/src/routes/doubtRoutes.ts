import express from 'express';
import { askDoubt, getMyDoubts, getAllDoubts, replyToDoubt, closeDoubt } from '../controllers/doubtController';
import { protect, authorize } from '../middlewares/authMiddleware';

const router = express.Router();

// Student routes
router.post('/', protect, askDoubt);                              // Raise a doubt from scorecard
router.get('/my', protect, getMyDoubts);                         // My doubts

// Admin routes
router.get('/', protect, authorize('admin'), getAllDoubts);       // All doubts (with optional ?status=open)
router.put('/:id/reply', protect, authorize('admin'), replyToDoubt);   // Reply to doubt
router.patch('/:id/close', protect, authorize('admin'), closeDoubt);   // Close doubt

export default router;
