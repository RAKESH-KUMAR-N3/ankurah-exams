import express from 'express';
import { getStates, createState, deleteState } from '../controllers/stateController';
import { protect, authorize } from '../middlewares/authMiddleware';

const router = express.Router();

router.route('/')
  .get(getStates)
  .post(protect, authorize('admin'), createState);

router.route('/:id')
  .delete(protect, authorize('admin'), deleteState);

export default router;
