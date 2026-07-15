import express from 'express';
import multer from 'multer';
import { protect, authorize } from '../middlewares/authMiddleware';
import { importQuestions, importMaterials } from '../controllers/importController';

const router = express.Router();

// Setup multer for temporary file storage
const upload = multer({ dest: 'uploads/' });

router.use(protect);
router.use(authorize('admin'));

router.post('/questions', upload.single('file'), importQuestions);
router.post('/materials', upload.single('file'), importMaterials);

export default router;
