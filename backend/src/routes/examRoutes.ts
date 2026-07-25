import express from 'express';
import { protect, authorize } from '../middlewares/authMiddleware';
import { createExam, getExams, updateExam, deleteExam } from '../controllers/examController';
import { validate, examSchema } from '../validations/schemas';

const router = express.Router();

router.route('/')
  .get(protect, getExams)
  .post(protect, authorize('admin'), validate(examSchema), createExam);

router.route('/:id')
  .put(protect, authorize('admin'), validate(examSchema), updateExam)
  .delete(protect, authorize('admin'), deleteExam);

export default router;
