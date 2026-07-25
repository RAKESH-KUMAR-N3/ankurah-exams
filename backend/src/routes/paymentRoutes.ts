import express from 'express';
import { protect, authorize } from '../middlewares/authMiddleware';
import { createOrder, verifyPayment } from '../controllers/paymentController';

const router = express.Router();

router.use(protect); // Need to be logged in to pay

router.post('/create-order', createOrder);
router.post('/verify', verifyPayment);

export default router;
