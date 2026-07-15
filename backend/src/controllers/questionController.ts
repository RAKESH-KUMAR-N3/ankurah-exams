import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Question from '../models/Question';

// @desc    Create a Question
// @route   POST /api/questions
// @access  Admin
export const createQuestion = asyncHandler(async (req: Request, res: Response) => {
  const { categoryId, examId, subjectId, chapterId, content, options, correctAnswer, explanation, difficulty, marks, negativeMarks } = req.body;
  const question = await Question.create({
    categoryId, examId, subjectId, chapterId, content, options, correctAnswer, explanation, difficulty, marks, negativeMarks
  });
  res.status(201).json(question);
});

// @desc    Get all Questions
// @route   GET /api/questions
// @access  Admin
export const getQuestions = asyncHandler(async (req: Request, res: Response) => {
  const questions = await Question.find({})
    .populate('categoryId examId subjectId chapterId');
  res.json(questions);
});

// @desc    Update a Question
// @route   PUT /api/questions/:id
// @access  Admin
export const updateQuestion = asyncHandler(async (req: Request, res: Response) => {
  const { categoryId, examId, subjectId, chapterId, content, options, correctAnswer, explanation, difficulty, marks, negativeMarks } = req.body;
  const question = await Question.findById(req.params.id);
  
  if (question) {
    question.categoryId = categoryId || question.categoryId;
    question.examId = examId || question.examId;
    question.subjectId = subjectId || question.subjectId;
    question.chapterId = chapterId || question.chapterId;
    question.content = content || question.content;
    question.options = options || question.options;
    question.correctAnswer = correctAnswer || question.correctAnswer;
    question.explanation = explanation || question.explanation;
    question.difficulty = difficulty || question.difficulty;
    question.marks = marks || question.marks;
    question.negativeMarks = negativeMarks || question.negativeMarks;

    const updatedQuestion = await question.save();
    res.json(updatedQuestion);
  } else {
    res.status(404);
    throw new Error('Question not found');
  }
});

// @desc    Delete a Question
// @route   DELETE /api/questions/:id
// @access  Admin
export const deleteQuestion = asyncHandler(async (req: Request, res: Response) => {
  const question = await Question.findById(req.params.id);
  if (question) {
    await Question.deleteOne({ _id: question._id });
    res.json({ message: 'Question removed' });
  } else {
    res.status(404);
    throw new Error('Question not found');
  }
});
