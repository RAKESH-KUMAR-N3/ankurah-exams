import express from 'express';
import { protect, authorize } from '../middlewares/authMiddleware';
import { createChapter, getChapters, updateChapter, deleteChapter } from '../controllers/chapterController';
import { validate, chapterSchema } from '../validations/schemas';

const router = express.Router();

router.use(protect, authorize('admin'));

router.route('/')
  .get(getChapters)
  .post(validate(chapterSchema), createChapter);

router.route('/:id')
  .put(validate(chapterSchema), updateChapter)
  .delete(deleteChapter);

export default router;
