import express from 'express';
import { protect, authorize } from '../middlewares/authMiddleware';
import { createTimetable, getTimetables, getTimetablesByCourse, updateTimetable, deleteTimetable } from '../controllers/timetableController';

const router = express.Router();

// Allow students and admins to read timetables
router.get('/', protect, getTimetables);
router.get('/course/:courseId', protect, getTimetablesByCourse);

// Admin-only routes
router.post('/', protect, authorize('admin'), createTimetable);
router.put('/:id', protect, authorize('admin'), updateTimetable);
router.delete('/:id', protect, authorize('admin'), deleteTimetable);

export default router;
