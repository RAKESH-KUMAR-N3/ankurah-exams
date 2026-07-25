import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Question from '../models/Question';
import csvParser from 'csv-parser';
import { Readable } from 'stream';
import { resolveCorrectAnswer } from '../services/testEvaluationService';

// @desc    Create a Question (standalone in question bank)
// @route   POST /api/questions
// @access  Admin
export const createQuestion = asyncHandler(async (req: Request, res: Response) => {
  const { categoryId, subjectId, chapterId, content, options, correctAnswer, explanation, difficulty } = req.body;
  const question = await Question.create({
    categoryId, subjectId, chapterId, content, options, correctAnswer, explanation, difficulty
    // marks/negativeMarks intentionally not stored here — managed at Test level
  });
  res.status(201).json(question);
});

// @desc    Get all Questions (filterable by subject/chapter/difficulty)
// @route   GET /api/questions
// @access  Admin
export const getQuestions = asyncHandler(async (req: Request, res: Response) => {
  const filter: any = {};
  if (req.query.subjectId) filter.subjectId = req.query.subjectId;
  if (req.query.chapterId) filter.chapterId = req.query.chapterId;
  if (req.query.difficulty) filter.difficulty = req.query.difficulty;

  const questions = await Question.find(filter)
    .populate('categoryId subjectId chapterId');
  res.json(questions);
});

// @desc    Update a Question
// @route   PUT /api/questions/:id
// @access  Admin
export const updateQuestion = asyncHandler(async (req: Request, res: Response) => {
  const { categoryId, subjectId, chapterId, content, options, correctAnswer, explanation, difficulty } = req.body;
  const question = await Question.findById(req.params.id);
  
  if (question) {
    if (categoryId !== undefined) question.categoryId = categoryId;
    if (subjectId !== undefined) question.subjectId = subjectId;
    if (chapterId !== undefined) question.chapterId = chapterId;
    if (content !== undefined) question.content = content;
    if (options !== undefined) question.options = options;
    if (correctAnswer !== undefined) question.correctAnswer = correctAnswer;
    if (explanation !== undefined) question.explanation = explanation;
    if (difficulty !== undefined) question.difficulty = difficulty;

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

// @desc    Bulk Upload Questions to Question Bank via CSV
// @route   POST /api/questions/bulk-upload
// @access  Admin
// CSV columns: content/Question, optionA, optionB, optionC, optionD, correctAnswer/Correct Answer, explanation/Explanation, difficulty/Difficulty
export const bulkUploadQuestions = asyncHandler(async (req: Request, res: Response) => {
  const { categoryId, subjectId, chapterId } = req.body;
  if (!req.file) {
    res.status(400);
    throw new Error('Please upload a CSV file');
  }

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

          const rowChapId = row['chapterId'] || chapterId;
          const validChapId = (rowChapId && rowChapId.trim()) ? rowChapId.trim() : undefined;

          return {
            categoryId: (row['categoryId'] || categoryId) || undefined,
            subjectId: row['subjectId'] || subjectId,
            chapterId: validChapId,
            content: row['content'] || row['Question'],
            options,
            correctAnswer,
            explanation: row['explanation'] || row['Explanation'] || '',
            difficulty: row['difficulty'] || row['Difficulty'] || 'Medium',
          };
        });

        const inserted = await Question.insertMany(questionsToInsert);
        res.status(201).json({ 
          message: `${inserted.length} questions uploaded successfully`, 
          count: inserted.length 
        });
      } catch (err: any) {
        res.status(500).json({ message: 'Error processing CSV data: ' + err.message });
      }
    });
});
