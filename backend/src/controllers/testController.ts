import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Test from '../models/Test';
import Question from '../models/Question';
import csvParser from 'csv-parser';
import { Readable } from 'stream';
import { resolveCorrectAnswer } from '../services/testEvaluationService';

// @desc    Create a Test
// @route   POST /api/tests
// @access  Admin
export const createTest = asyncHandler(async (req: Request, res: Response) => {
  const {
    title, categoryId, examIds, studentTypeIds,
    subjectId, chapterId, testType,
    isDynamic, dynamicTotalQuestions, targetDifficulty,
    questions,
    duration, marksPerQuestion, negativeMarksPerQuestion,
    retakeLimit, isFullSyllabus, status, instructions
  } = req.body;

  const test = await Test.create({
    title, categoryId,
    examIds: Array.isArray(examIds) ? examIds : examIds ? [examIds] : [],
    studentTypeIds: Array.isArray(studentTypeIds) ? studentTypeIds : studentTypeIds ? [studentTypeIds] : [],
    subjectId, chapterId, testType,
    isDynamic: isDynamic || false,
    dynamicTotalQuestions, targetDifficulty,
    questions: questions || [],
    duration,
    marksPerQuestion: marksPerQuestion ?? 4,
    negativeMarksPerQuestion: negativeMarksPerQuestion ?? 1,
    retakeLimit: retakeLimit ?? 0,
    isFullSyllabus: isFullSyllabus ?? false,
    status: status || 'Draft',
    instructions
  });

  res.status(201).json(test);
});

// @desc    Get all Tests
// @route   GET /api/tests
// @access  Admin (all including Draft), Student (Published only via student route)
export const getTests = asyncHandler(async (req: Request, res: Response) => {
  const tests = await Test.find({})
    .populate('categoryId examIds studentTypeIds subjectId chapterId questions');
  res.json(tests);
});

// @desc    Get a single Test by ID
// @route   GET /api/tests/:id
// @access  Admin
export const getTestById = asyncHandler(async (req: Request, res: Response) => {
  const test = await Test.findById(req.params.id)
    .populate('categoryId examIds studentTypeIds subjectId chapterId questions');
  if (test) {
    res.json(test);
  } else {
    res.status(404);
    throw new Error('Test not found');
  }
});

// @desc    Update a Test
// @route   PUT /api/tests/:id
// @access  Admin
export const updateTest = asyncHandler(async (req: Request, res: Response) => {
  const test = await Test.findById(req.params.id);
  
  if (test) {
    const {
      title, categoryId, examIds, studentTypeIds,
      subjectId, chapterId, testType,
      isDynamic, dynamicTotalQuestions, targetDifficulty,
      questions,
      duration, marksPerQuestion, negativeMarksPerQuestion,
      retakeLimit, isFullSyllabus, status, instructions
    } = req.body;

    test.title = title || test.title;
    test.categoryId = categoryId || test.categoryId;
    if (examIds !== undefined) {
      test.examIds = Array.isArray(examIds) ? examIds : [examIds];
    }
    if (studentTypeIds !== undefined) {
      test.studentTypeIds = Array.isArray(studentTypeIds) ? studentTypeIds : [studentTypeIds];
    }
    if (subjectId !== undefined) test.subjectId = subjectId;
    if (chapterId !== undefined) test.chapterId = chapterId;
    if (testType !== undefined) test.testType = testType;
    if (isDynamic !== undefined) test.isDynamic = isDynamic;
    if (dynamicTotalQuestions !== undefined) test.dynamicTotalQuestions = dynamicTotalQuestions;
    if (targetDifficulty !== undefined) test.targetDifficulty = targetDifficulty;
    if (questions !== undefined) test.questions = questions;
    if (duration !== undefined) test.duration = duration;
    if (marksPerQuestion !== undefined) test.marksPerQuestion = marksPerQuestion;
    if (negativeMarksPerQuestion !== undefined) test.negativeMarksPerQuestion = negativeMarksPerQuestion;
    if (retakeLimit !== undefined) test.retakeLimit = retakeLimit;
    if (isFullSyllabus !== undefined) test.isFullSyllabus = isFullSyllabus;
    if (status !== undefined) test.status = status;
    if (instructions !== undefined) test.instructions = instructions;

    const updatedTest = await test.save();
    res.json(updatedTest);
  } else {
    res.status(404);
    throw new Error('Test not found');
  }
});

// @desc    Toggle Test Publish Status (Draft <-> Published)
// @route   PATCH /api/tests/:id/toggle-status
// @access  Admin
export const toggleTestStatus = asyncHandler(async (req: Request, res: Response) => {
  const test = await Test.findById(req.params.id);
  if (!test) {
    res.status(404);
    throw new Error('Test not found');
  }
  test.status = test.status === 'Published' ? 'Draft' : 'Published';
  await test.save();
  res.json({ message: `Test is now ${test.status}`, status: test.status });
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

// @desc    Upload Grand Test via CSV
// @route   POST /api/tests/grand-test-upload
// @access  Admin
export const grandTestUpload = asyncHandler(async (req: Request, res: Response) => {
  const {
    title, categoryId, examIds, studentTypeIds, duration,
    marksPerQuestion, negativeMarksPerQuestion,
    retakeLimit, instructions
  } = req.body;
  
  if (!req.file) {
    res.status(400);
    throw new Error('Please upload a CSV file');
  }

  const parsedExamIds = Array.isArray(examIds) ? examIds : examIds ? [examIds] : [];
  const parsedStudentTypeIds = Array.isArray(studentTypeIds) ? studentTypeIds : studentTypeIds ? [studentTypeIds] : [];

  const results: any[] = [];
  const stream = Readable.from(req.file.buffer);
  
  stream
    .pipe(csvParser())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      try {
        const questionsToInsert = results.map(row => {
          const options = [
            row['optionA'] || row['Option A'],
            row['optionB'] || row['Option B'],
            row['optionC'] || row['Option C'],
            row['optionD'] || row['Option D']
          ].filter(Boolean);

          const rawCorrect = row['correctAnswer'] || row['Correct Answer'] || '';
          const correctAnswer = resolveCorrectAnswer(rawCorrect, options);

          return {
            categoryId,
            subjectId: row['subjectId'] || req.body.subjectId || null,
            chapterId: row['chapterId'] || req.body.chapterId || null,
            content: row['content'] || row['Question'],
            options,
            correctAnswer,
            explanation: row['explanation'] || row['Explanation'] || '',
            difficulty: row['difficulty'] || row['Difficulty'] || 'Medium',
            // marks/negativeMarks not stored on question anymore — handled by Test
          };
        });

        const insertedQuestions = await Question.insertMany(questionsToInsert);
        const questionIds = insertedQuestions.map(q => q._id);

        const newTest = await Test.create({
          title,
          categoryId,
          examIds: parsedExamIds,
          studentTypeIds: parsedStudentTypeIds,
          testType: 'Grand',
          questions: questionIds,
          duration: Number(duration),
          marksPerQuestion: Number(marksPerQuestion ?? 4),
          negativeMarksPerQuestion: Number(negativeMarksPerQuestion ?? 1),
          retakeLimit: Number(retakeLimit ?? 0),
          isFullSyllabus: true,
          status: 'Draft', // Admin must explicitly publish
          isDynamic: false,
          instructions
        });

        res.status(201).json(newTest);
      } catch (err: any) {
        res.status(500).json({ message: 'Error processing Grand Test CSV: ' + err.message });
      }
    });
});
