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
  const { id, name, description, type, price, allowedStudentTypes, state } = req.body;

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
  const reqState = state || 'Both';

  // Get full StudentType documents to inspect state
  const rawTypes = Array.isArray(allowedStudentTypes) ? allowedStudentTypes : [];
  const studentTypes = await StudentType.find({ _id: { $in: rawTypes } });
  const studentTypeMap = new Map();
  studentTypes.forEach(st => studentTypeMap.set(st._id.toString(), st.state || 'AP'));

  // Filter allowed student types by AP vs TG
  const apStudentTypes = rawTypes.filter(stId => studentTypeMap.get(stId.toString()) === 'AP');
  const tgStudentTypes = rawTypes.filter(stId => studentTypeMap.get(stId.toString()) === 'TG');

  // If state === 'Both' for Entrance Exams, auto-create 2 separate records for AP and TG
  if (reqState === 'Both' && type !== 'competitive') {
    const apExam = await Exam.create({ 
      name: name.trim().endsWith('(AP)') ? name.trim() : `${name.trim()} (AP)`, 
      type: type || 'entrance',
      categoryId: category._id,
      description: description || '',
      examId: `${baseId}-ap-${Date.now().toString().slice(-4)}`,
      state: 'AP',
      allowedStudentTypes: apStudentTypes
    });

    if (price !== undefined && price !== null && price !== '') {
      await Plan.create({
        examId: apExam._id,
        name: `${apExam.name} Plan`,
        price: Number(price) || 0,
        description: `Full access plan for ${apExam.name}`
      });
    }

    const tgExam = await Exam.create({ 
      name: name.trim().endsWith('(TG)') ? name.trim() : `${name.trim()} (TG)`, 
      type: type || 'entrance',
      categoryId: category._id,
      description: description || '',
      examId: `${baseId}-tg-${Date.now().toString().slice(-4)}`,
      state: 'TG',
      allowedStudentTypes: tgStudentTypes
    });

    if (price !== undefined && price !== null && price !== '') {
      await Plan.create({
        examId: tgExam._id,
        name: `${tgExam.name} Plan`,
        price: Number(price) || 0,
        description: `Full access plan for ${tgExam.name}`
      });
    }

    res.status(201).json([apExam, tgExam]);
    return;
  }

  const generatedExamId = `${baseId}-${Date.now().toString().slice(-5)}`;
  const finalAllowedStudentTypes = reqState === 'AP' ? apStudentTypes : reqState === 'TG' ? tgStudentTypes : rawTypes;

  const exam = await Exam.create({ 
    name: name.trim(), 
    type: type || 'entrance',
    categoryId: category._id,
    description: description || '',
    examId: generatedExamId,
    state: reqState,
    allowedStudentTypes: finalAllowedStudentTypes
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
  const exams = await Exam.find({}).populate('categoryId').populate('allowedStudentTypes');
  res.json(exams);
});

// @desc    Update an Exam
// @route   PUT /api/exams/:id
// @access  Admin
export const updateExam = asyncHandler(async (req: Request, res: Response) => {
  const { name, type, categoryId, allowedStudentTypes, price, state } = req.body;
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

    if (state) exam.state = state;
    if (allowedStudentTypes) {
      const studentTypes = await StudentType.find({ _id: { $in: allowedStudentTypes } });
      const studentTypeMap = new Map();
      studentTypes.forEach(st => studentTypeMap.set(st._id.toString(), st.state || 'AP'));

      const targetState = state || exam.state || 'AP';
      if (targetState === 'AP' || targetState === 'TG') {
        exam.allowedStudentTypes = allowedStudentTypes.filter((stId: string) => studentTypeMap.get(stId.toString()) === targetState);
      } else {
        exam.allowedStudentTypes = allowedStudentTypes;
      }
    }
    const updatedExam = await exam.save();

    if (price !== undefined && price !== null && price !== '') {
      let plan = await Plan.findOne({ examId: exam._id });
      if (plan) {
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
