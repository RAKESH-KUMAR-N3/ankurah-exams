import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Subject from '../models/Subject';
import CompetitiveSubject from '../models/CompetitiveSubject';
import mongoose from 'mongoose';

// @desc    Create a Subject
// @route   POST /api/subjects
// @access  Admin
export const createSubject = asyncHandler(async (req: Request, res: Response) => {
  const { name, state, examId, subjectCategory, applicableFor } = req.body;

  if (!name || !name.trim()) {
    res.status(400);
    throw new Error('Subject name is required');
  }

  const cleanName = name.trim();
  const validExamId = (examId && mongoose.Types.ObjectId.isValid(examId)) ? examId : undefined;

  // Save Competitive subjects into 'competitivesubjects' collection
  if (subjectCategory === 'competitive') {
    const compSubject = await CompetitiveSubject.create({
      name: cleanName,
      subjectCategory: 'competitive',
      examId: validExamId,
    });
    res.status(201).json(compSubject);
    return;
  }

  // Entrance Subjects -> saved in 'subjects' collection
  const validApplicable = Array.isArray(applicableFor) ? applicableFor.filter(id => mongoose.Types.ObjectId.isValid(id)) : [];

  if (state === 'Both') {
    const apSubject = await Subject.create({
      name: cleanName,
      state: 'AP',
      subjectCategory: 'entrance',
      applicableFor: validApplicable,
      examId: validExamId,
    });
    const tgSubject = await Subject.create({
      name: cleanName,
      state: 'TG',
      subjectCategory: 'entrance',
      applicableFor: validApplicable,
      examId: validExamId,
    });
    res.status(201).json([apSubject, tgSubject]);
    return;
  } else {
    const subject = await Subject.create({
      name: cleanName,
      state: state || 'AP',
      subjectCategory: 'entrance',
      applicableFor: validApplicable,
      examId: validExamId,
    });
    res.status(201).json(subject);
    return;
  }
});

// @desc    Get all Subjects (Entrance + Competitive)
// @route   GET /api/subjects
// @access  Admin
export const getSubjects = asyncHandler(async (req: Request, res: Response) => {
  const entranceSubjects = await Subject.find({}).populate('examId applicableFor');
  const compSubjects = await CompetitiveSubject.find({}).populate('examId');
  res.json([...entranceSubjects, ...compSubjects]);
});

// @desc    Update a Subject
// @route   PUT /api/subjects/:id
// @access  Admin
export const updateSubject = asyncHandler(async (req: Request, res: Response) => {
  const { name, state, examId, subjectCategory } = req.body;

  let compSub = await CompetitiveSubject.findById(req.params.id);
  if (compSub) {
    if (name) compSub.name = name.trim();
    if (examId && mongoose.Types.ObjectId.isValid(examId)) compSub.examId = examId as any;
    const updatedComp = await compSub.save();
    res.json(updatedComp);
    return;
  }

  let subject = await Subject.findById(req.params.id);
  if (subject) {
    if (name) subject.name = name.trim();
    if (state) subject.state = state;
    if (subjectCategory) subject.subjectCategory = subjectCategory;
    if (examId && mongoose.Types.ObjectId.isValid(examId)) {
      subject.examId = examId as any;
    }
    const updatedSubject = await subject.save();
    res.json(updatedSubject);
    return;
  }

  res.status(404);
  throw new Error('Subject not found');
});

// @desc    Delete a Subject
// @route   DELETE /api/subjects/:id
// @access  Admin
export const deleteSubject = asyncHandler(async (req: Request, res: Response) => {
  let compSub = await CompetitiveSubject.findById(req.params.id);
  if (compSub) {
    await CompetitiveSubject.deleteOne({ _id: compSub._id });
    res.json({ message: 'Competitive Subject removed' });
    return;
  }

  let subject = await Subject.findById(req.params.id);
  if (subject) {
    await Subject.deleteOne({ _id: subject._id });
    res.json({ message: 'Subject removed' });
    return;
  }

  res.status(404);
  throw new Error('Subject not found');
});
