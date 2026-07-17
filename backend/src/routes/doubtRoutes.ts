import express from 'express';
import { askDoubt, getMyDoubts, getAllDoubts, answerDoubt } from '../controllers/doubtController';
import { protect, authorize } from '../middlewares/authMiddleware';

const router = express.Router();

router.route('/')
  .post(protect, askDoubt)
  .get(protect, getMyDoubts);

router.get('/all', protect, authorize('admin'), getAllDoubts);
router.put('/:id/answer', protect, authorize('admin'), answerDoubt);

export default router;
