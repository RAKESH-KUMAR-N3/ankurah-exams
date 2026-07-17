import { Response } from 'express';
import { AuthRequest as Request } from '../middlewares/authMiddleware';
import TestAttempt from '../models/TestAttempt';
import Test from '../models/Test';
import { evaluateTestAttempt } from '../services/testEvaluationService';

export const startTest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { testId } = req.params;
    
    const test = await Test.findById(testId);
    if (!test) {
      res.status(404).json({ message: 'Test not found' });
      return;
    }
    
    if (test.status !== 'Published') {
      res.status(400).json({ message: 'Test is not published yet' });
      return;
    }

    // Check if an uncompleted attempt exists? For now we just create a new one.
    const attempt = new TestAttempt({
      studentId: req.user?._id,
      testId,
      score: 0,
      responses: []
    });

    const savedAttempt = await attempt.save();
    res.status(201).json(savedAttempt);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const saveAttempt = async (req: Request, res: Response): Promise<void> => {
  try {
    const { attemptId } = req.params;
    const { responses } = req.body;
    
    const attempt = await TestAttempt.findOne({ _id: attemptId, studentId: req.user?._id });
    if (!attempt) {
      res.status(404).json({ message: 'Attempt not found' });
      return;
    }
    
    attempt.responses = responses as any;
    await attempt.save();
    
    res.json({ message: 'Progress saved successfully', attempt });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const submitTest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { attemptId } = req.params;
    
    const attempt = await TestAttempt.findOne({ _id: attemptId, studentId: req.user?._id });
    if (!attempt) {
      res.status(404).json({ message: 'Attempt not found' });
      return;
    }

    // Use service to evaluate and score
    const evaluatedAttempt = await evaluateTestAttempt(attemptId);
    
    res.json({ message: 'Test submitted successfully', result: evaluatedAttempt });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyResults = async (req: Request, res: Response): Promise<void> => {
  try {
    const attempts = await TestAttempt.find({ studentId: req.user?._id })
      .populate('testId', 'title testType totalMarks')
      .sort({ createdAt: -1 });
      
    res.json(attempts);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getResultDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const attempt = await TestAttempt.findOne({ _id: id, studentId: req.user?._id })
      .populate({
        path: 'testId',
        select: 'title testType totalMarks duration instructions'
      })
      .populate({
        path: 'responses.questionId',
        select: 'content options correctAnswer explanation difficulty marks negativeMarks chapterId'
      });
      
    if (!attempt) {
      res.status(404).json({ message: 'Result not found' });
      return;
    }
    
    res.json(attempt);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
