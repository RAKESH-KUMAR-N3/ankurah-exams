import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Subject from '../models/Subject';

// @desc    Create a Subject
// @route   POST /api/subjects
// @access  Admin
export const createSubject = asyncHandler(async (req: Request, res: Response) => {
  const { name, examId, applicableFor } = req.body;
  const subject = await Subject.create({ name, examId, applicableFor });
  res.status(201).json(subject);
});

// @desc    Get all Subjects
// @route   GET /api/subjects
// @access  Admin
export const getSubjects = asyncHandler(async (req: Request, res: Response) => {
  const subjects = await Subject.find({}).populate('examId applicableFor');
  res.json(subjects);
});

// @desc    Update a Subject
// @route   PUT /api/subjects/:id
// @access  Admin
export const updateSubject = asyncHandler(async (req: Request, res: Response) => {
  const { name, examId, applicableFor } = req.body;
  const subject = await Subject.findById(req.params.id);
  if (subject) {
    subject.name = name || subject.name;
    subject.examId = examId || subject.examId;
    subject.applicableFor = applicableFor || subject.applicableFor;
    const updatedSubject = await subject.save();
    res.json(updatedSubject);
  } else {
    res.status(404);
    throw new Error('Subject not found');
  }
});

// @desc    Delete a Subject
// @route   DELETE /api/subjects/:id
// @access  Admin
export const deleteSubject = asyncHandler(async (req: Request, res: Response) => {
  const subject = await Subject.findById(req.params.id);
  if (subject) {
    await Subject.deleteOne({ _id: subject._id });
    res.json({ message: 'Subject removed' });
  } else {
    res.status(404);
    throw new Error('Subject not found');
  }
});
