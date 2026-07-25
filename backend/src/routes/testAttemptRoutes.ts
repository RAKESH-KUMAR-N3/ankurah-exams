import express from 'express';
import { protect } from '../middlewares/authMiddleware';
import { validate, testAttemptSaveSchema } from '../validations/schemas';
import {
  startTest,
  saveAttempt,
  submitTest,
  getMyResults,
  getResultDetails,
  recordTabSwitch,
  getLeaderboard
} from '../controllers/testAttemptController';

const router = express.Router();

router.use(protect);

// Leaderboard (accessible to all logged-in users)
router.get('/leaderboard', getLeaderboard);

// My results
router.get('/my', getMyResults);

// Attempt lifecycle
router.post('/start/:testId', startTest);
router.put('/save/:attemptId', validate(testAttemptSaveSchema), saveAttempt);
router.post('/submit/:attemptId', submitTest);

// Proctoring: record tab switch
router.post('/tab-switch/:attemptId', recordTabSwitch);

// Scorecard details
router.get('/:id', getResultDetails);

export default router;
