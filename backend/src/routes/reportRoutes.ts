import express from 'express';
import { protect, authorize } from '../middlewares/authMiddleware';
import { getOverallPerformanceReport, getExamWiseReport } from '../controllers/reportController';

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/overall', getOverallPerformanceReport);
router.get('/exam-wise', getExamWiseReport);

export default router;
