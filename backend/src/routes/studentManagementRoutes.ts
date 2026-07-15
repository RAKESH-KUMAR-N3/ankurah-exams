import express from 'express';
import { protect, authorize } from '../middlewares/authMiddleware';
import {
  getStudents,
  getStudentProfile,
  activateStudent,
  deactivateStudent
} from '../controllers/studentManagementController';

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/', getStudents);
router.get('/:id', getStudentProfile);
router.put('/:id/activate', activateStudent);
router.put('/:id/deactivate', deactivateStudent);

export default router;
