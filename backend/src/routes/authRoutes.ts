import express from 'express';
import { loginUser, registerUser } from '../controllers/authController';
import { validate, loginSchema, registerSchema } from '../validations/schemas';

const router = express.Router();

router.post('/login', validate(loginSchema), loginUser);
router.post('/register', validate(registerSchema), registerUser);

export default router;
