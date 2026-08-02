import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Exam from '../models/Exam';
import Plan from '../models/Plan';
import Category from '../models/Category';
import StudentType from '../models/StudentType';

// @desc    Create an Exam and its default Plan
// @route   POST /api/exams
// @access  Admin
export const createExam = asyncHandler(async (req: Request, res: Response) => {
  const { id, name, description, type, price, subjects, validityMonths } = req.body;

  if (!name || !name.trim()) {
    res.status(400);
    throw new Error('Exam name is required');
  }

  let categoryName = type === 'competitive' ? 'Competitive Exams' : 'Entrance Exams';
  let category = await Category.findOne({ name: categoryName });
  if (!category) {
    category = await Category.create({ name: categoryName });
  }

  const baseId = (id || name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const generatedExamId = `${baseId}-${Date.now().toString().slice(-5)}`;

  const exam = await Exam.create({ 
    name: name.trim(), 
    type: type || 'entrance',
    categoryId: category._id,
    description: description || '',
    examId: generatedExamId,
    state: 'Both',
    allowedStudentTypes: [],
    subjects: Array.isArray(subjects) ? subjects : [],
    validityMonths: validityMonths ? Number(validityMonths) : 12
  });

  if (price !== undefined && price !== null && price !== '') {
    await Plan.create({
      examId: exam._id,
      name: `${name.trim()} Plan`,
      price: Number(price) || 0,
      description: `Full access plan for ${name.trim()}`
    });
  }

  res.status(201).json(exam);
});

// @desc    Get all Exams
// @route   GET /api/exams
// @access  Admin
export const getExams = asyncHandler(async (req: Request, res: Response) => {
  const exams = await Exam.find({}).populate('categoryId').populate('allowedStudentTypes').populate('subjects', 'name subjectCategory');
  res.json(exams);
});

// @desc    Update an Exam
// @route   PUT /api/exams/:id
// @access  Admin
export const updateExam = asyncHandler(async (req: Request, res: Response) => {
  const { name, type, categoryId, price, subjects, validityMonths } = req.body;
  const exam = await Exam.findById(req.params.id);
  if (exam) {
    if (name) exam.name = name.trim();

    if (type) {
      let categoryName = type === 'competitive' ? 'Competitive Exams' : 'Entrance Exams';
      let category = await Category.findOne({ name: categoryName });
      if (!category) {
        category = await Category.create({ name: categoryName });
      }
      exam.categoryId = category._id;
    } else if (categoryId) {
      exam.categoryId = categoryId;
    }

    if (subjects !== undefined) exam.subjects = Array.isArray(subjects) ? subjects : [];
    if (validityMonths !== undefined) exam.validityMonths = Number(validityMonths) || 12;
    const updatedExam = await exam.save();

    if (price !== undefined && price !== null && price !== '') {
      let plan = await Plan.findOne({ examId: exam._id });
      if (plan) {
        plan.name = `${exam.name} Plan`;
        plan.price = Number(price) || 0;
        await plan.save();
      } else {
        await Plan.create({
          examId: exam._id,
          name: `${exam.name} Plan`,
          price: Number(price) || 0,
          description: `Full access plan for ${exam.name}`
        });
      }
    }

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
    await Plan.deleteMany({ examId: exam._id });
    await Exam.deleteOne({ _id: exam._id });
    res.json({ message: 'Exam and associated plan removed' });
  } else {
    res.status(404);
    throw new Error('Exam not found');
  }
});
