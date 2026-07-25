import express from 'express';
import multer from 'multer';
import { protect, authorize } from '../middlewares/authMiddleware';
import { createTest, getTests, getTestById, updateTest, deleteTest, grandTestUpload, toggleTestStatus } from '../controllers/testController';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(protect, authorize('admin'));

// CSV upload for Grand Test
router.post('/grand-test-upload', upload.single('file'), grandTestUpload);

// CRUD
router.route('/')
  .get(getTests)
  .post(createTest);

router.route('/:id')
  .get(getTestById)
  .put(updateTest)
  .delete(deleteTest);

// Publish / Draft toggle
router.patch('/:id/toggle-status', toggleTestStatus);

export default router;
