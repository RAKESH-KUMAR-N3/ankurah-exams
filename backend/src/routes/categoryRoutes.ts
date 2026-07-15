import express from 'express';
import { protect, authorize } from '../middlewares/authMiddleware';
import { createCategory, getCategories, updateCategory, deleteCategory } from '../controllers/categoryController';
import { validate, categorySchema } from '../validations/schemas';

const router = express.Router();

router.use(protect, authorize('admin'));

router.route('/')
  .get(getCategories)
  .post(validate(categorySchema), createCategory);

router.route('/:id')
  .put(validate(categorySchema), updateCategory)
  .delete(deleteCategory);

export default router;
