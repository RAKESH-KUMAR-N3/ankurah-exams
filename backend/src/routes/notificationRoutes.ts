import express from 'express';
import { protect, authorize } from '../middlewares/authMiddleware';
import {
  createNotification,
  getNotifications,
  updateNotification,
  deleteNotification,
} from '../controllers/notificationController';
import { validate, notificationSchema } from '../validations/schemas';

const router = express.Router();

router.use(protect, authorize('admin'));

router.route('/')
  .get(getNotifications)
  .post(validate(notificationSchema), createNotification);

router.route('/:id')
  .put(validate(notificationSchema), updateNotification)
  .delete(deleteNotification);

export default router;
