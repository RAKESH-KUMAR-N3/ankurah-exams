import express from 'express';
import { protect, authorize } from '../middlewares/authMiddleware';
import { createTimetable, getTimetables, updateTimetable, deleteTimetable } from '../controllers/timetableController';
import { validate, timetableSchema } from '../validations/schemas';

const router = express.Router();

router.use(protect, authorize('admin'));

router.route('/')
  .get(getTimetables)
  .post(validate(timetableSchema), createTimetable);

router.route('/:id')
  .put(validate(timetableSchema), updateTimetable)
  .delete(deleteTimetable);

export default router;
