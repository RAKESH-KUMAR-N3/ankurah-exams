import express from 'express';
import multer from 'multer';
import { getTopicsByChapter, createTopic, updateTopic, deleteTopic, parsePdfTopics } from '../controllers/topicController';
import { protect, authorize } from '../middlewares/authMiddleware';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

router.post('/parse-pdf', protect, authorize('admin'), upload.single('file'), parsePdfTopics);
router.get('/chapter/:chapterId', protect, getTopicsByChapter);
router.post('/', protect, authorize('admin'), createTopic);
router.put('/:id', protect, authorize('admin'), updateTopic);
router.delete('/:id', protect, authorize('admin'), deleteTopic);

export default router;
