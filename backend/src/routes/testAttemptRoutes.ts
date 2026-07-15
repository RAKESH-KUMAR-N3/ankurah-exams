import express from 'express';
import { protect } from '../middlewares/authMiddleware';
import { validate, testAttemptSaveSchema } from '../validations/schemas';
import {
  startTest,
  saveAttempt,
  submitTest,
  getMyResults,
  getResultDetails
} from '../controllers/testAttemptController';

const router = express.Router();

router.use(protect);

router.post('/start/:testId', startTest);
router.put('/save/:attemptId', validate(testAttemptSaveSchema), saveAttempt);
router.post('/submit/:attemptId', submitTest);

router.get('/my', getMyResults);
router.get('/:id', getResultDetails);

export default router;
