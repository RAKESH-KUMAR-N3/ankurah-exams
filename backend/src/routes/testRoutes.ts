import express from 'express';
import { protect, authorize } from '../middlewares/authMiddleware';
import { createTest, getTests, updateTest, deleteTest } from '../controllers/testController';
import { validate, testSchema } from '../validations/schemas';

const router = express.Router();

router.use(protect, authorize('admin'));

router.route('/')
  .get(getTests)
  .post(validate(testSchema), createTest);

router.route('/:id')
  .put(validate(testSchema), updateTest)
  .delete(deleteTest);

export default router;
