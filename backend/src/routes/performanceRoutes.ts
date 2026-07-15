import express from 'express';
import { protect } from '../middlewares/authMiddleware';
import { getMyPerformance } from '../controllers/performanceController';

const router = express.Router();

router.use(protect);

router.get('/my', getMyPerformance);

export default router;
