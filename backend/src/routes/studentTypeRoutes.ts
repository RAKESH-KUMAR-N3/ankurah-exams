import express from 'express';
import { protect, authorize } from '../middlewares/authMiddleware';
import { createStudentType, getStudentTypes, updateStudentType, deleteStudentType } from '../controllers/studentTypeController';
import { validate, studentTypeSchema } from '../validations/schemas';

const router = express.Router();

router.use(protect, authorize('admin'));

router.route('/')
  .get(getStudentTypes)
  .post(validate(studentTypeSchema), createStudentType);

router.route('/:id')
  .put(validate(studentTypeSchema), updateStudentType)
  .delete(deleteStudentType);

export default router;
