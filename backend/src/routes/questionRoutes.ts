import express from 'express';
import multer from 'multer';
import { protect, authorize } from '../middlewares/authMiddleware';
import { createQuestion, getQuestions, updateQuestion, deleteQuestion, bulkUploadQuestions } from '../controllers/questionController';
import { validate, questionSchema } from '../validations/schemas';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(protect, authorize('admin'));

router.post('/bulk-upload', upload.single('file'), bulkUploadQuestions);

router.route('/')
  .get(getQuestions)
  .post(validate(questionSchema), createQuestion);

router.route('/:id')
  .put(validate(questionSchema), updateQuestion)
  .delete(deleteQuestion);

export default router;
