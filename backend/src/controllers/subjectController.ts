import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Subject from '../models/Subject';
import mongoose from 'mongoose';

// @desc    Create a Subject
// @route   POST /api/subjects
// @access  Admin
export const createSubject = asyncHandler(async (req: Request, res: Response) => {
  const { name, examId, subjectCategory, applicableFor } = req.body;

  if (!name || !name.trim()) {
    res.status(400);
    throw new Error('Subject name is required');
  }

  const subjectData: any = {
    name: name.trim(),
    subjectCategory: subjectCategory || 'entrance',
    applicableFor: Array.isArray(applicableFor) ? applicableFor.filter(id => mongoose.Types.ObjectId.isValid(id)) : []
  };

  if (examId && mongoose.Types.ObjectId.isValid(examId)) {
    subjectData.examId = examId;
  }

  const subject = await Subject.create(subjectData);
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
  const { name, examId, subjectCategory, applicableFor } = req.body;
  const subject = await Subject.findById(req.params.id);

  if (subject) {
    if (name) subject.name = name.trim();
    if (subjectCategory) subject.subjectCategory = subjectCategory;

    if (examId && mongoose.Types.ObjectId.isValid(examId)) {
      subject.examId = examId as any;
    } else if (examId === null || examId === '') {
      subject.examId = undefined;
    }

    if (applicableFor && Array.isArray(applicableFor)) {
      subject.applicableFor = applicableFor.filter(id => mongoose.Types.ObjectId.isValid(id));
    }

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
