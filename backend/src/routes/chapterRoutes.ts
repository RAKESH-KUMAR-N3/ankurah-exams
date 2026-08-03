import express from 'express';
import multer from 'multer';
import { protect, authorize } from '../middlewares/authMiddleware';
import { createChapter, getChapters, updateChapter, deleteChapter, parsePdfChapters, createChaptersWithTopics, deleteAllChaptersBySubject } from '../controllers/chapterController';
import { validate, chapterSchema } from '../validations/schemas';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

router.use(protect, authorize('admin'));

router.post('/parse-pdf', upload.single('file'), parsePdfChapters);
router.post('/with-topics', createChaptersWithTopics);
router.delete('/subject/:subjectId', deleteAllChaptersBySubject);

router.route('/')
  .get(getChapters)
  .post(validate(chapterSchema), createChapter);

router.route('/:id')
  .put(validate(chapterSchema), updateChapter)
  .delete(deleteChapter);

export default router;
