import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Exam from '../models/Exam';

import Category from '../models/Category';
import Plan from '../models/Plan';

// @desc    Create an Exam and its default Plan
// @route   POST /api/exams
// @access  Admin
export const createExam = asyncHandler(async (req: Request, res: Response) => {
  const { id, name, description, type, price } = req.body;

  let categoryName = type === 'competitive' ? 'Competitive Exams' : 'Entrance Exams';
  let category = await Category.findOne({ name: categoryName });
  if (!category) {
    category = await Category.create({ name: categoryName });
  }

  const exam = await Exam.create({ 
    name, 
    categoryId: category._id,
    description,
    examId: id
  });

  if (price) {
     await Plan.create({
       examId: exam._id,
       name: type === 'entrance' ? 'Yearly Plan' : `${name} Plan`,
       price: Number(price),
       description: `Full access plan for ${name}`
     });
  }

  res.status(201).json(exam);
});

// @desc    Get all Exams
// @route   GET /api/exams
// @access  Admin
export const getExams = asyncHandler(async (req: Request, res: Response) => {
  const exams = await Exam.find({}).populate('categoryId');
  res.json(exams);
});

// @desc    Update an Exam
// @route   PUT /api/exams/:id
// @access  Admin
export const updateExam = asyncHandler(async (req: Request, res: Response) => {
  const { name, categoryId } = req.body;
  const exam = await Exam.findById(req.params.id);
  if (exam) {
    exam.name = name || exam.name;
    exam.categoryId = categoryId || exam.categoryId;
    const updatedExam = await exam.save();
    res.json(updatedExam);
  } else {
    res.status(404);
    throw new Error('Exam not found');
  }
});

// @desc    Delete an Exam
// @route   DELETE /api/exams/:id
// @access  Admin
export const deleteExam = asyncHandler(async (req: Request, res: Response) => {
  const exam = await Exam.findById(req.params.id);
  if (exam) {
    await Exam.deleteOne({ _id: exam._id });
    res.json({ message: 'Exam removed' });
  } else {
    res.status(404);
    throw new Error('Exam not found');
  }
});
