import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Test from '../models/Test';

// @desc    Create a Test
// @route   POST /api/tests
// @access  Admin
export const createTest = asyncHandler(async (req: Request, res: Response) => {
  const { title, categoryId, examId, studentTypeId, subjectId, chapterId, testType, questions, duration, totalMarks, instructions, negativeMarking, status } = req.body;
  const test = await Test.create({
    title, categoryId, examId, studentTypeId, subjectId, chapterId, testType, questions, duration, totalMarks, instructions, negativeMarking, status
  });
  res.status(201).json(test);
});

// @desc    Get all Tests
// @route   GET /api/tests
// @access  Admin
export const getTests = asyncHandler(async (req: Request, res: Response) => {
  const tests = await Test.find({})
    .populate('categoryId examId studentTypeId subjectId chapterId questions');
  res.json(tests);
});

// @desc    Update a Test
// @route   PUT /api/tests/:id
// @access  Admin
export const updateTest = asyncHandler(async (req: Request, res: Response) => {
  const { title, categoryId, examId, studentTypeId, subjectId, chapterId, testType, questions, duration, totalMarks, instructions, negativeMarking, status } = req.body;
  const test = await Test.findById(req.params.id);
  
  if (test) {
    test.title = title || test.title;
    test.categoryId = categoryId || test.categoryId;
    test.examId = examId || test.examId;
    test.studentTypeId = studentTypeId || test.studentTypeId;
    test.subjectId = subjectId || test.subjectId;
    test.chapterId = chapterId || test.chapterId;
    test.testType = testType || test.testType;
    test.questions = questions || test.questions;
    test.duration = duration || test.duration;
    test.totalMarks = totalMarks || test.totalMarks;
    test.instructions = instructions || test.instructions;
    test.negativeMarking = negativeMarking !== undefined ? negativeMarking : test.negativeMarking;
    test.status = status || test.status;

    const updatedTest = await test.save();
    res.json(updatedTest);
  } else {
    res.status(404);
    throw new Error('Test not found');
  }
});

// @desc    Delete a Test
// @route   DELETE /api/tests/:id
// @access  Admin
export const deleteTest = asyncHandler(async (req: Request, res: Response) => {
  const test = await Test.findById(req.params.id);
  if (test) {
    await Test.deleteOne({ _id: test._id });
    res.json({ message: 'Test removed' });
  } else {
    res.status(404);
    throw new Error('Test not found');
  }
});
