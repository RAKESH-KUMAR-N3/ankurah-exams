import express from 'express';
import { protect } from '../middlewares/authMiddleware';
import { validate, studentProfileUpdateSchema } from '../validations/schemas';
import {
  getProfile,
  updateProfile,
  getMySubjects,
  getMyChapters,
  getMyMaterials,
  getMyTimetables,
  getMyTests,
  getMyNotifications
} from '../controllers/studentController';

const router = express.Router();

// Apply protect middleware to all student routes
router.use(protect);

router.route('/profile')
  .get(getProfile)
  .put(validate(studentProfileUpdateSchema), updateProfile);

router.get('/subjects', getMySubjects);
router.get('/chapters', getMyChapters);
router.get('/materials', getMyMaterials);
router.get('/timetables', getMyTimetables);
router.get('/tests', getMyTests);
router.get('/notifications', getMyNotifications);

export default router;
