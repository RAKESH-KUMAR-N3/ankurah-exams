import express from 'express';
import { getTopicsByChapter, createTopic, updateTopic, deleteTopic } from '../controllers/topicController';
import { protect, authorize } from '../middlewares/authMiddleware';

const router = express.Router();

router.get('/chapter/:chapterId', protect, getTopicsByChapter);
router.post('/', protect, authorize('admin'), createTopic);
router.put('/:id', protect, authorize('admin'), updateTopic);
router.delete('/:id', protect, authorize('admin'), deleteTopic);

export default router;
