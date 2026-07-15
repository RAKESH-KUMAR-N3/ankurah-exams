import express from 'express';
import { protect, authorize } from '../middlewares/authMiddleware';
import { createExam, getExams, updateExam, deleteExam } from '../controllers/examController';
import { validate, examSchema } from '../validations/schemas';

const router = express.Router();

router.use(protect, authorize('admin'));

router.route('/')
  .get(getExams)
  .post(validate(examSchema), createExam);

router.route('/:id')
  .put(validate(examSchema), updateExam)
  .delete(deleteExam);

export default router;
