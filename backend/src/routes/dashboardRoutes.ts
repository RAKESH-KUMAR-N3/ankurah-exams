import express from 'express';
import { protect, authorize } from '../middlewares/authMiddleware';
import { getAdminDashboardSummary, getStudentDashboardSummary } from '../controllers/dashboardController';

const router = express.Router();

router.use(protect);

router.get('/admin', authorize('admin'), getAdminDashboardSummary);
router.get('/student', getStudentDashboardSummary);

export default router;
