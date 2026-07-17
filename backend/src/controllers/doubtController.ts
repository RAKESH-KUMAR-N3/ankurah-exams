import { Request, Response } from 'express';
import Doubt from '../models/Doubt';

// Ask a doubt (Student)
export const askDoubt = async (req: Request, res: Response): Promise<void> => {
  try {
    const { examId, chapterId, questionId, content } = req.body;
    const studentId = (req as any).user.id;

    const newDoubt = new Doubt({
      studentId,
      examId,
      chapterId,
      questionId,
      content,
    });

    await newDoubt.save();
    res.status(201).json(newDoubt);
  } catch (error) {
    console.error('Error asking doubt:', error);
    res.status(500).json({ message: 'Server error creating doubt' });
  }
};

// Get student's doubts
export const getMyDoubts = async (req: Request, res: Response): Promise<void> => {
  try {
    const studentId = (req as any).user.id;
    // We could filter by examId if passed in query
    const filter: any = { studentId };
    if (req.query.examId) {
      filter.examId = req.query.examId;
    }

    const doubts = await Doubt.find(filter).populate('chapterId questionId').sort({ createdAt: -1 });
    res.json(doubts);
  } catch (error) {
    console.error('Error fetching doubts:', error);
    res.status(500).json({ message: 'Server error fetching doubts' });
  }
};

// Get all doubts (Admin)
export const getAllDoubts = async (req: Request, res: Response): Promise<void> => {
  try {
    const doubts = await Doubt.find().populate('studentId chapterId questionId').sort({ createdAt: -1 });
    res.json(doubts);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching all doubts' });
  }
};

// Answer a doubt (Admin)
export const answerDoubt = async (req: Request, res: Response): Promise<void> => {
  try {
    const { answer } = req.body;
    const doubtId = req.params.id;
    const adminId = (req as any).user.id;

    const doubt = await Doubt.findById(doubtId);
    if (!doubt) {
      res.status(404).json({ message: 'Doubt not found' });
      return;
    }

    doubt.answer = answer;
    doubt.status = 'answered';
    doubt.answeredBy = adminId;
    doubt.answeredAt = new Date();

    await doubt.save();
    res.json(doubt);
  } catch (error) {
    res.status(500).json({ message: 'Server error answering doubt' });
  }
};
