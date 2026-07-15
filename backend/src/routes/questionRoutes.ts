import express from 'express';
import { protect, authorize } from '../middlewares/authMiddleware';
import { createQuestion, getQuestions, updateQuestion, deleteQuestion } from '../controllers/questionController';
import { validate, questionSchema } from '../validations/schemas';

const router = express.Router();

router.use(protect, authorize('admin'));

router.route('/')
  .get(getQuestions)
  .post(validate(questionSchema), createQuestion);

router.route('/:id')
  .put(validate(questionSchema), updateQuestion)
  .delete(deleteQuestion);

export default router;
