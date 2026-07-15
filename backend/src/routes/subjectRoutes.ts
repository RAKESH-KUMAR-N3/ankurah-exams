import express from 'express';
import { protect, authorize } from '../middlewares/authMiddleware';
import { createSubject, getSubjects, updateSubject, deleteSubject } from '../controllers/subjectController';
import { validate, subjectSchema } from '../validations/schemas';

const router = express.Router();

router.use(protect, authorize('admin'));

router.route('/')
  .get(getSubjects)
  .post(validate(subjectSchema), createSubject);

router.route('/:id')
  .put(validate(subjectSchema), updateSubject)
  .delete(deleteSubject);

export default router;
