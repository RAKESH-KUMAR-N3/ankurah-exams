import { Request, Response } from 'express';
import Doubt from '../models/Doubt';

// @desc    Raise a doubt from scorecard (Student)
// @route   POST /api/doubts
// @access  Student
export const askDoubt = async (req: Request, res: Response): Promise<void> => {
  try {
    const { testId, testAttemptId, questionId, content } = req.body;
    const studentId = (req as any).user._id || (req as any).user.id;

    if (!content || !content.trim()) {
      res.status(400).json({ message: 'content is required' });
      return;
    }

    const isValidObjectId = (id: any) => id && typeof id === 'string' && id.match(/^[0-9a-fA-F]{24}$/);

    const newDoubt = new Doubt({
      studentId,
      testId: isValidObjectId(testId) ? testId : null,
      testAttemptId: isValidObjectId(testAttemptId) ? testAttemptId : null,
      questionId: isValidObjectId(questionId) ? questionId : null,
      content,
    });

    await newDoubt.save();

    const populated = await Doubt.findById(newDoubt._id)
      .populate('questionId', 'content options correctAnswer')
      .populate('testId', 'title');

    res.status(201).json(populated);
  } catch (error) {
    console.error('Error raising doubt:', error);
    res.status(500).json({ message: 'Server error creating doubt' });
  }
};

// @desc    Get student's own doubts
// @route   GET /api/doubts/my
// @access  Student
export const getMyDoubts = async (req: Request, res: Response): Promise<void> => {
  try {
    const studentId = (req as any).user._id || (req as any).user.id;

    const doubts = await Doubt.find({ studentId })
      .populate('questionId', 'content options correctAnswer')
      .populate('testId', 'title')
      .sort({ createdAt: -1 });

    res.json(doubts);
  } catch (error) {
    console.error('Error fetching doubts:', error);
    res.status(500).json({ message: 'Server error fetching doubts' });
  }
};

// @desc    Get all doubts (Admin)
// @route   GET /api/doubts
// @access  Admin
export const getAllDoubts = async (req: Request, res: Response): Promise<void> => {
  try {
    const filter: any = {};
    if (req.query.status) filter.status = req.query.status;

    const doubts = await Doubt.find(filter)
      .populate('studentId', 'name email')
      .populate('questionId', 'content options correctAnswer difficulty')
      .populate('testId', 'title testType')
      .sort({ createdAt: -1 });

    res.json(doubts);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching all doubts' });
  }
};

// @desc    Reply to a doubt (Admin)
// @route   PUT /api/doubts/:id/reply
// @access  Admin
export const replyToDoubt = async (req: Request, res: Response): Promise<void> => {
  try {
    const { adminReply } = req.body;
    const doubtId = req.params.id;
    const adminId = (req as any).user._id || (req as any).user.id;

    if (!adminReply) {
      res.status(400).json({ message: 'adminReply is required' });
      return;
    }

    const doubt = await Doubt.findById(doubtId);
    if (!doubt) {
      res.status(404).json({ message: 'Doubt not found' });
      return;
    }

    doubt.adminReply = adminReply;
    doubt.status = 'answered';
    doubt.repliedBy = adminId;
    doubt.repliedAt = new Date();

    await doubt.save();

    const updated = await Doubt.findById(doubt._id)
      .populate('studentId', 'name email')
      .populate('questionId', 'content options correctAnswer')
      .populate('testId', 'title');

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server error replying to doubt' });
  }
};

// @desc    Close a doubt
// @route   PATCH /api/doubts/:id/close
// @access  Admin
export const closeDoubt = async (req: Request, res: Response): Promise<void> => {
  try {
    const doubt = await Doubt.findByIdAndUpdate(
      req.params.id,
      { status: 'closed' },
      { new: true }
    );
    if (!doubt) {
      res.status(404).json({ message: 'Doubt not found' });
      return;
    }
    res.json(doubt);
  } catch (error) {
    res.status(500).json({ message: 'Server error closing doubt' });
  }
};
