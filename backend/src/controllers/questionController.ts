import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import ApEntranceQuestion from '../models/ApEntranceQuestion';
import TgEntranceQuestion from '../models/TgEntranceQuestion';
import CompetitiveQuestionBySubject from '../models/CompetitiveQuestionBySubject';
import Subject from '../models/Subject';
import CompetitiveSubject from '../models/CompetitiveSubject';
import Chapter from '../models/Chapter';
import csvParser from 'csv-parser';
import { Readable } from 'stream';
import { resolveCorrectAnswer } from '../services/testEvaluationService';

import mongoose from 'mongoose';

// Helper: Determine target collection model based on subjectId
const getQuestionModelForSubject = async (subjectId: string) => {
  if (mongoose.isValidObjectId(subjectId)) {
    const compSub = await CompetitiveSubject.findById(subjectId);
    if (compSub) {
      return { model: CompetitiveQuestionBySubject, type: 'competitive' };
    }

    const sub = await Subject.findById(subjectId);
    if (sub && sub.state === 'TG') {
      return { model: TgEntranceQuestion, type: 'tg_entrance' };
    }
  }

  // Default to AP Entrance Question
  return { model: ApEntranceQuestion, type: 'ap_entrance' };
};

// @desc    Create a Question
// @route   POST /api/questions
// @access  Admin
export const createQuestion = asyncHandler(async (req: Request, res: Response) => {
  const { categoryId, subjectId, chapterId, content, options, correctAnswer, explanation, difficulty, marks, negativeMarks } = req.body;

  if (!subjectId) {
    res.status(400);
    throw new Error('subjectId is required');
  }

  const { model, type } = await getQuestionModelForSubject(subjectId);

  const rawDiff = (difficulty || 'Medium').toString().toLowerCase();
  const normalizedDifficulty = rawDiff.charAt(0).toUpperCase() + rawDiff.slice(1);

  const payload: any = {
    subjectId,
    content: content ? content.trim() : '',
    options: Array.isArray(options) ? options.map((o: string) => o.trim()) : [],
    correctAnswer: correctAnswer ? correctAnswer.trim() : '',
    explanation: explanation ? explanation.trim() : '',
    difficulty: normalizedDifficulty,
    marks: marks !== undefined && marks !== null ? Number(marks) : 4,
    negativeMarks: negativeMarks !== undefined && negativeMarks !== null ? Number(negativeMarks) : 1
  };

  if (type !== 'competitive') {
    if (chapterId && mongoose.isValidObjectId(chapterId)) {
      payload.chapterId = chapterId;
    }
  }

  const createdQuestion = await (model as any).create(payload);
  res.status(201).json(createdQuestion);
});

// @desc    Get all Questions (queries 'apentrancequestions', 'tgentrancequestions', and 'competitivequestionsbysubjects')
// @route   GET /api/questions
// @access  Admin
export const getQuestions = asyncHandler(async (req: Request, res: Response) => {
  const filter: any = {};
  if (req.query.subjectId) filter.subjectId = req.query.subjectId;
  if (req.query.chapterId) filter.chapterId = req.query.chapterId;
  if (req.query.difficulty) filter.difficulty = req.query.difficulty;

  const apRaw = await ApEntranceQuestion.find(filter).sort({ createdAt: -1 }).lean();
  const tgRaw = await TgEntranceQuestion.find(filter).sort({ createdAt: -1 }).lean();

  const compFilter: any = {};
  if (req.query.subjectId) compFilter.subjectId = req.query.subjectId;
  if (req.query.difficulty) compFilter.difficulty = req.query.difficulty;
  const compRaw = await CompetitiveQuestionBySubject.find(compFilter).sort({ createdAt: -1 }).lean();

  const apEnriched = await Promise.all(
    apRaw.map(async (q: any) => {
      const sub = await Subject.findById(q.subjectId).lean();
      const chap = q.chapterId ? await Chapter.findById(q.chapterId).lean() : null;
      return { ...q, subjectId: sub || { _id: q.subjectId, name: 'Subject' }, chapterId: chap || undefined };
    })
  );

  const tgEnriched = await Promise.all(
    tgRaw.map(async (q: any) => {
      const sub = await Subject.findById(q.subjectId).lean();
      const chap = q.chapterId ? await Chapter.findById(q.chapterId).lean() : null;
      return { ...q, subjectId: sub || { _id: q.subjectId, name: 'Subject' }, chapterId: chap || undefined };
    })
  );

  const compEnriched = await Promise.all(
    compRaw.map(async (q: any) => {
      const sub = await CompetitiveSubject.findById(q.subjectId).lean();
      return { ...q, subjectId: sub || { _id: q.subjectId, name: 'Subject' }, isCompetitive: true };
    })
  );

  res.json([...apEnriched, ...tgEnriched, ...compEnriched]);
});

// @desc    Update a Question (checks all 3 collections)
// @route   PUT /api/questions/:id
// @access  Admin
export const updateQuestion = asyncHandler(async (req: Request, res: Response) => {
  const { categoryId, subjectId, chapterId, content, options, correctAnswer, explanation, difficulty } = req.body;

  let cleanDifficulty: string | undefined = undefined;
  if (difficulty) {
    const rawDiff = difficulty.toString().toLowerCase();
    cleanDifficulty = rawDiff.charAt(0).toUpperCase() + rawDiff.slice(1);
  }

  let apQ = await ApEntranceQuestion.findById(req.params.id);
  if (apQ) {
    if (subjectId !== undefined) apQ.subjectId = subjectId;
    if (chapterId !== undefined) apQ.chapterId = (chapterId && mongoose.isValidObjectId(chapterId)) ? chapterId : undefined;
    if (content !== undefined) apQ.content = content.trim();
    if (options !== undefined) apQ.options = Array.isArray(options) ? options.map((o: string) => o.trim()) : options;
    if (correctAnswer !== undefined) apQ.correctAnswer = correctAnswer.trim();
    if (explanation !== undefined) apQ.explanation = explanation.trim();
    if (cleanDifficulty !== undefined) apQ.difficulty = cleanDifficulty as any;

    const updated = await apQ.save();
    res.json(updated);
    return;
  }

  let tgQ = await TgEntranceQuestion.findById(req.params.id);
  if (tgQ) {
    if (subjectId !== undefined) tgQ.subjectId = subjectId;
    if (chapterId !== undefined) tgQ.chapterId = (chapterId && mongoose.isValidObjectId(chapterId)) ? chapterId : undefined;
    if (content !== undefined) tgQ.content = content.trim();
    if (options !== undefined) tgQ.options = Array.isArray(options) ? options.map((o: string) => o.trim()) : options;
    if (correctAnswer !== undefined) tgQ.correctAnswer = correctAnswer.trim();
    if (explanation !== undefined) tgQ.explanation = explanation.trim();
    if (cleanDifficulty !== undefined) tgQ.difficulty = cleanDifficulty as any;

    const updated = await tgQ.save();
    res.json(updated);
    return;
  }

  let compQ = await CompetitiveQuestionBySubject.findById(req.params.id);
  if (compQ) {
    if (subjectId !== undefined) compQ.subjectId = subjectId as any;
    if (content !== undefined) compQ.content = content.trim();
    if (options !== undefined) compQ.options = Array.isArray(options) ? options.map((o: string) => o.trim()) : options;
    if (correctAnswer !== undefined) compQ.correctAnswer = correctAnswer.trim();
    if (explanation !== undefined) compQ.explanation = explanation.trim();
    if (cleanDifficulty !== undefined) compQ.difficulty = cleanDifficulty as any;

    const updated = await compQ.save();
    res.json(updated);
    return;
  }

  res.status(404);
  throw new Error('Question not found');
});

// @desc    Delete a Question (checks all 3 collections)
// @route   DELETE /api/questions/:id
// @access  Admin
export const deleteQuestion = asyncHandler(async (req: Request, res: Response) => {
  let apQ = await ApEntranceQuestion.findById(req.params.id);
  if (apQ) {
    await ApEntranceQuestion.deleteOne({ _id: apQ._id });
    res.json({ message: 'AP Entrance Question removed' });
    return;
  }

  let tgQ = await TgEntranceQuestion.findById(req.params.id);
  if (tgQ) {
    await TgEntranceQuestion.deleteOne({ _id: tgQ._id });
    res.json({ message: 'TG Entrance Question removed' });
    return;
  }

  let compQ = await CompetitiveQuestionBySubject.findById(req.params.id);
  if (compQ) {
    await CompetitiveQuestionBySubject.deleteOne({ _id: compQ._id });
    res.json({ message: 'Competitive Question removed' });
    return;
  }

  res.status(404);
  throw new Error('Question not found');
});

// @desc    Bulk Upload Questions via CSV
// @route   POST /api/questions/bulk-upload
// @access  Admin
export const bulkUploadQuestions = asyncHandler(async (req: Request, res: Response) => {
  const { categoryId, subjectId, chapterId } = req.body;
  if (!req.file) {
    res.status(400);
    throw new Error('Please upload a CSV file');
  }

  if (!subjectId) {
    res.status(400);
    throw new Error('subjectId is required for bulk upload');
  }

  const { model } = await getQuestionModelForSubject(subjectId);
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
          ].map(o => (o || '').toString().trim()).filter(Boolean);

          const rawCorrect = row['correctAnswer'] || row['Correct Answer'] || '';
          const correctAnswer = resolveCorrectAnswer(rawCorrect, options);

          const rowChapId = row['chapterId'] || chapterId;
          const validChapId = (rowChapId && rowChapId.trim()) ? rowChapId.trim() : undefined;

          return {
            categoryId: (row['categoryId'] || categoryId) || undefined,
            subjectId: row['subjectId'] || subjectId,
            chapterId: validChapId,
            content: (row['content'] || row['Question'] || '').toString().trim(),
            options,
            correctAnswer,
            explanation: (row['explanation'] || row['Explanation'] || '').toString().trim(),
            difficulty: row['difficulty'] || row['Difficulty'] || 'Medium',
          };
        });

        const inserted = await (model as any).insertMany(questionsToInsert);
        res.status(201).json({ 
          message: `${inserted.length} questions uploaded successfully`, 
          count: inserted.length 
        });
      } catch (err: any) {
        res.status(500).json({ message: 'Error processing CSV data: ' + err.message });
      }
    });
});

// @desc    Get chapter-wise question counts for a subject
// @route   GET /api/questions/chapter-counts?subjectId=xxx
// @access  Admin
export const getChapterQuestionCounts = asyncHandler(async (req: Request, res: Response) => {
  const { subjectId } = req.query as { subjectId?: string };

  if (!subjectId) {
    res.status(400);
    throw new Error('subjectId is required');
  }

  const isComp = await CompetitiveSubject.findById(subjectId).lean();
  
  let chapterCounts: Record<string, number> = {};

  if (isComp) {
    // Competitive questions don't have chapterId — return subject-level count
    const total = await CompetitiveQuestionBySubject.countDocuments({ subjectId });
    chapterCounts['_subject_total'] = total;
  } else {
    // AP or TG entrance
    const sub = await Subject.findById(subjectId).lean() as any;
    const isTG = sub?.state === 'TG';
    const Model = isTG ? TgEntranceQuestion : ApEntranceQuestion;

    const chapters = await Chapter.find({ subjectId }).lean();
    
    await Promise.all(chapters.map(async (c: any) => {
      const cid = c._id.toString();
      const cnt = await Model.countDocuments({ chapterId: c._id });
      chapterCounts[cid] = cnt;
    }));

    // Also count questions with no chapterId
    const noChap = await Model.countDocuments({ subjectId, chapterId: { $exists: false } });
    if (noChap > 0) chapterCounts['_no_chapter'] = noChap;
  }

  res.json({ subjectId, chapterCounts });
});

