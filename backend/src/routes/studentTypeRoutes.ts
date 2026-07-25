import express from 'express';
import { protect, authorize } from '../middlewares/authMiddleware';
import { createStudentType, getStudentTypes, updateStudentType, deleteStudentType } from '../controllers/studentTypeController';
import { validate, studentTypeSchema } from '../validations/schemas';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getStudentTypes)
  .post(authorize('admin'), validate(studentTypeSchema), createStudentType);

router.route('/:id')
  .put(authorize('admin'), validate(studentTypeSchema), updateStudentType)
  .delete(authorize('admin'), deleteStudentType);

export default router;
