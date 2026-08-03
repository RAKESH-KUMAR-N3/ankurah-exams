import mongoose from 'mongoose';
import { Response } from 'express';
import { AuthRequest as Request } from '../middlewares/authMiddleware';
import TestAttempt from '../models/TestAttempt';
import Test from '../models/Test';
import Question from '../models/Question';
import ApEntranceQuestion from '../models/ApEntranceQuestion';
import TgEntranceQuestion from '../models/TgEntranceQuestion';
import CompetitiveQuestionBySubject from '../models/CompetitiveQuestionBySubject';
import Subject from '../models/Subject';
import { evaluateTestAttempt } from '../services/testEvaluationService';

const normalizeFilter = (query: any) => {
  const converted: any = {};
  for (const [key, val] of Object.entries(query)) {
    if (typeof val === 'string' && mongoose.isValidObjectId(val)) {
      converted[key] = { $in: [val, new mongoose.Types.ObjectId(val)] };
    } else if (Array.isArray(val)) {
      converted[key] = {
        $in: val.flatMap(item =>
          typeof item === 'string' && mongoose.isValidObjectId(item)
            ? [item, new mongoose.Types.ObjectId(item)]
            : [item]
        )
      };
    } else if (val && typeof val === 'object' && (val as any).$in) {
      converted[key] = {
        $in: (val as any).$in.flatMap((item: any) =>
          typeof item === 'string' && mongoose.isValidObjectId(item)
            ? [item, new mongoose.Types.ObjectId(item)]
            : [item]
        )
      };
    } else {
      converted[key] = val;
    }
  }
  return converted;
};

const fetchRandomQs = async (query: any, size: number) => {
  const normalized = normalizeFilter(query);
  const [ap, tg, comp] = await Promise.all([
    ApEntranceQuestion.aggregate([{ $match: normalized }, { $sample: { size } }]),
    TgEntranceQuestion.aggregate([{ $match: normalized }, { $sample: { size } }]),
    CompetitiveQuestionBySubject.aggregate([{ $match: normalized }, { $sample: { size } }])
  ]);
  return [...ap, ...tg, ...comp].sort(() => 0.5 - Math.random()).slice(0, size);
};

export const populateAttemptQuestions = async (attempt: any, selectFields: string) => {
  if (!attempt) return attempt;
  const attemptObj = attempt.toObject ? attempt.toObject() : attempt;
  if (!attemptObj.responses || attemptObj.responses.length === 0) return attemptObj;

  const qIds = attemptObj.responses
    .map((r: any) => (r.questionId?._id || r.questionId))
    .filter((id: any) => id && mongoose.isValidObjectId(id));
  if (qIds.length === 0) return attemptObj;

  const [ap, tg, comp, legacy] = await Promise.all([
    ApEntranceQuestion.find({ _id: { $in: qIds } }).select(selectFields).lean(),
    TgEntranceQuestion.find({ _id: { $in: qIds } }).select(selectFields).lean(),
    CompetitiveQuestionBySubject.find({ _id: { $in: qIds } }).select(selectFields).lean(),
    Question.find({ _id: { $in: qIds } }).select(selectFields).lean()
  ]);

  const allFound = [...ap, ...tg, ...comp, ...legacy];
  const subIds = allFound
    .map(q => q.subjectId?._id || q.subjectId)
    .filter(id => id && mongoose.isValidObjectId(id));
  
  const subjects = subIds.length > 0
    ? await Subject.find({ _id: { $in: subIds } }).select('name').lean()
    : [];
  const subMap = new Map(subjects.map((s: any) => [s._id.toString(), s]));

  const qMap = new Map();
  allFound.forEach((q: any) => {
    const rawSubId = (q.subjectId?._id || q.subjectId)?.toString();
    if (rawSubId && subMap.has(rawSubId)) {
      q.subjectId = subMap.get(rawSubId);
    }
    qMap.set(q._id.toString(), q);
  });

  attemptObj.responses.forEach((r: any) => {
    const rawId = (r.questionId?._id || r.questionId)?.toString();
    if (rawId && qMap.has(rawId)) {
      r.questionId = qMap.get(rawId);
    }
  });

  return attemptObj;
};

// @desc    Start or resume a test
// @route   POST /api/attempts/start/:testId
// @access  Student
export const startTest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { testId } = req.params;
    
    const test = await Test.findById(testId);
    if (!test) {
      res.status(404).json({ message: 'Test not found' });
      return;
    }
    
    if (test.status !== 'Published') {
      res.status(400).json({ message: 'Test is not published yet' });
      return;
    }

    // 1. Check if an In-Progress attempt already exists
    let existingAttempt = await TestAttempt.findOne({
      studentId: req.user?._id,
      testId,
      status: 'In-Progress'
    });

    if (existingAttempt) {
      const populatedExisting = await populateAttemptQuestions(existingAttempt, 'content options difficulty explanation chapterId subjectId');
      res.status(200).json(populatedExisting);
      return;
    }

    // 2. Count completed attempts for retake limit
    const completedAttempts = await TestAttempt.countDocuments({
      studentId: req.user?._id,
      testId,
      status: { $in: ['Completed', 'Force-Submitted'] }
    });

    // Check retake limit (0 = unlimited)
    if (test.retakeLimit > 0 && completedAttempts >= test.retakeLimit) {
      res.status(403).json({ 
        message: `Retake limit reached. You can only attempt this test ${test.retakeLimit} time(s).`,
        attemptsUsed: completedAttempts,
        retakeLimit: test.retakeLimit
      });
      return;
    }

    const attemptNumber = completedAttempts + 1;

    // Build question set
    let initialResponses: any[] = [];

    if (test.subjectConfigs && Array.isArray(test.subjectConfigs) && test.subjectConfigs.length > 0) {
      // Multi-Subject & Multi-Chapter test: pick questions in strict subject-wise order
      const allSelectedQuestions: any[] = [];
      const usedQuestionIds = new Set<string>();

      for (const sConf of test.subjectConfigs) {
        const subId = (sConf.subjectId?._id || sConf.subjectId)?.toString();
        if (!subId) continue;

        const chapters = sConf.chapters || [];
        for (const chap of chapters) {
          const chapId = (chap.chapterId?._id || chap.chapterId)?.toString();
          const targetCount = Number(chap.questionCount) || 0;
          if (targetCount <= 0 || !chapId) continue;

          const query: any = { subjectId: subId, chapterId: chapId };
          if (test.targetDifficulty && test.targetDifficulty !== 'Mixed') {
            query.difficulty = test.targetDifficulty;
          }

          let chapQuestions = await fetchRandomQs(query, targetCount * 2);
          chapQuestions = chapQuestions.filter(q => !usedQuestionIds.has(q._id.toString())).slice(0, targetCount);

          // Fallback 1: Relax difficulty if needed
          if (chapQuestions.length < targetCount && query.difficulty) {
            delete query.difficulty;
            let fallbackQs = await fetchRandomQs(query, (targetCount - chapQuestions.length) * 2);
            fallbackQs = fallbackQs.filter(
              q => !usedQuestionIds.has(q._id.toString()) && !chapQuestions.some(cq => cq._id.toString() === q._id.toString())
            );
            chapQuestions.push(...fallbackQs.slice(0, targetCount - chapQuestions.length));
          }

          // Fallback 2: Relax chapter filter within same subject if needed
          if (chapQuestions.length < targetCount) {
            const needed = targetCount - chapQuestions.length;
            let subFallback = await fetchRandomQs({ subjectId: subId }, needed * 2);
            subFallback = subFallback.filter(
              q => !usedQuestionIds.has(q._id.toString()) && !chapQuestions.some(cq => cq._id.toString() === q._id.toString())
            );
            chapQuestions.push(...subFallback.slice(0, needed));
          }

          chapQuestions.forEach(q => {
            usedQuestionIds.add(q._id.toString());
            allSelectedQuestions.push(q);
          });
        }
      }

      if (allSelectedQuestions.length === 0) {
        res.status(400).json({ 
          message: 'No questions found in Question Bank for the configured subjects/chapters of this test. Please upload questions in Question Bank first.' 
        });
        return;
      }

      initialResponses = allSelectedQuestions.map(q => ({
        questionId: q._id,
        selectedOption: null,
        isCorrect: null
      }));
    } else if (test.isDynamic && test.dynamicTotalQuestions) {
      // Dynamic test: pick random questions strictly from matching subject/exam
      let allowedSubjectIds: any[] = [];
      if (test.subjectId) {
        allowedSubjectIds = [(test.subjectId as any)._id || test.subjectId];
      } else if (test.examIds && test.examIds.length > 0) {
        const parsedExamIds = test.examIds.map((e: any) => (e._id || e.id || e).toString());
        const matchingSubjects = await Subject.find({
          $or: [
            { examId: { $in: parsedExamIds } },
            { applicableFor: { $in: req.user?.studentType ? [req.user.studentType] : [] } }
          ]
        }).select('_id');
        allowedSubjectIds = matchingSubjects.map((s: any) => s._id);
      }

      const matchQuery: any = {};
      if (allowedSubjectIds.length > 0) {
        matchQuery.subjectId = { $in: allowedSubjectIds };
      }
      if (test.chapterId) {
        matchQuery.chapterId = (test.chapterId as any)._id || test.chapterId;
      }
      if (test.targetDifficulty && test.targetDifficulty !== 'Mixed') {
        matchQuery.difficulty = test.targetDifficulty;
      }

      let randomQuestions = await fetchRandomQs(matchQuery, test.dynamicTotalQuestions);

      // Fallback 1: Relax difficulty filter, keep subject/chapter
      if (randomQuestions.length < test.dynamicTotalQuestions && matchQuery.difficulty) {
        delete matchQuery.difficulty;
        randomQuestions = await fetchRandomQs(matchQuery, test.dynamicTotalQuestions);
      }

      // Fallback 2: Relax chapter filter, keep subject(s)
      if (randomQuestions.length < test.dynamicTotalQuestions && matchQuery.chapterId && allowedSubjectIds.length > 0) {
        randomQuestions = await fetchRandomQs({ subjectId: { $in: allowedSubjectIds } }, test.dynamicTotalQuestions);
      }

      if (randomQuestions.length === 0) {
        res.status(400).json({ 
          message: 'No questions found in Question Bank for the subject of this test. Please upload questions in Question Bank first.' 
        });
        return;
      }

      initialResponses = randomQuestions.map(q => ({
        questionId: q._id,
        selectedOption: null,
        isCorrect: null
      }));
    } else if (test.questions && test.questions.length > 0) {
      initialResponses = test.questions.map(qId => ({
        questionId: qId,
        selectedOption: null,
        isCorrect: null
      }));
    }

    if (initialResponses.length === 0) {
      res.status(400).json({ message: 'No questions found in this test.' });
      return;
    }

    const attempt = new TestAttempt({
      studentId: req.user?._id,
      testId,
      attemptNumber,
      score: 0,
      responses: initialResponses,
      status: 'In-Progress',
      tabSwitchCount: 0,
      autoSubmitted: false
    });

    const savedAttempt = await attempt.save();

    const populatedAttempt = await populateAttemptQuestions(savedAttempt, 'content options difficulty explanation chapterId subjectId');

    res.status(201).json(populatedAttempt);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Save in-progress responses (auto-save)
// @route   PUT /api/attempts/save/:attemptId
// @access  Student
export const saveAttempt = async (req: Request, res: Response): Promise<void> => {
  try {
    const { attemptId } = req.params;
    const { responses } = req.body;
    
    const attempt = await TestAttempt.findOne({ _id: attemptId, studentId: req.user?._id });
    if (!attempt) {
      res.status(404).json({ message: 'Attempt not found' });
      return;
    }

    if (attempt.status !== 'In-Progress') {
      res.status(400).json({ message: 'This attempt has already been submitted' });
      return;
    }
    
    attempt.responses = responses as any;
    await attempt.save();
    
    res.json({ message: 'Progress saved successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Record a tab switch (proctoring)
// @route   POST /api/attempts/tab-switch/:attemptId
// @access  Student
export const recordTabSwitch = async (req: Request, res: Response): Promise<void> => {
  try {
    const { attemptId } = req.params;
    
    const attempt = await TestAttempt.findOne({ _id: attemptId, studentId: req.user?._id });
    if (!attempt || attempt.status !== 'In-Progress') {
      res.status(404).json({ message: 'Active attempt not found' });
      return;
    }

    attempt.tabSwitchCount = (attempt.tabSwitchCount || 0) + 1;

    // 2nd offense → auto-submit
    if (attempt.tabSwitchCount >= 2) {
      // Auto-evaluate and submit
      await attempt.save();
      const evaluated = await evaluateTestAttempt(attemptId);
      evaluated.status = 'Force-Submitted';
      evaluated.autoSubmitted = true;
      evaluated.submittedAt = new Date();
      await evaluated.save();

      res.json({ 
        message: 'Exam auto-submitted due to repeated tab switching',
        autoSubmitted: true,
        tabSwitchCount: attempt.tabSwitchCount,
        result: evaluated
      });
    } else {
      // 1st offense → warning only
      await attempt.save();
      res.json({ 
        message: 'Warning: Please return to Full Screen mode',
        autoSubmitted: false,
        tabSwitchCount: attempt.tabSwitchCount
      });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Submit test (manual or timer expiry)
// @route   POST /api/attempts/submit/:attemptId
// @access  Student
export const submitTest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { attemptId } = req.params;
    const { timeTakenSeconds } = req.body;
    
    let attempt = await TestAttempt.findOne({ _id: attemptId, studentId: req.user?._id });
    if (!attempt) {
      res.status(404).json({ message: 'Attempt not found' });
      return;
    }

    if (attempt.status === 'Completed' || attempt.status === 'Force-Submitted') {
      let result = await TestAttempt.findById(attempt._id)
        .populate({ path: 'testId', select: 'title testType duration marksPerQuestion negativeMarksPerQuestion' });
      result = await populateAttemptQuestions(result, 'content options correctAnswer explanation difficulty chapterId subjectId');
      res.json({ message: 'Test already submitted', result });
      return;
    }

    if (timeTakenSeconds !== undefined) {
      attempt.timeTakenSeconds = timeTakenSeconds;
    }
    await attempt.save();

    // Evaluate and score
    const evaluatedAttempt = await evaluateTestAttempt(attemptId);
    evaluatedAttempt.status = 'Completed';
    evaluatedAttempt.submittedAt = new Date();
    await evaluatedAttempt.save();

    // Populate for immediate scorecard display
    let result = await TestAttempt.findById(evaluatedAttempt._id)
      .populate({ path: 'testId', select: 'title testType duration marksPerQuestion negativeMarksPerQuestion' });
    result = await populateAttemptQuestions(result, 'content options correctAnswer explanation difficulty chapterId subjectId');
    
    res.json({ message: 'Test submitted successfully', result });
  } catch (error: any) {
    console.error('submitTest error:', error);
    res.status(500).json({ message: error.message || 'Failed to submit test' });
  }
};

// @desc    Get my results (all attempts)
// @route   GET /api/attempts/my
// @access  Student
export const getMyResults = async (req: Request, res: Response): Promise<void> => {
  try {
    const attempts = await TestAttempt.find({ 
      studentId: req.user?._id,
      status: { $in: ['Completed', 'Force-Submitted'] }
    });

    for (const attempt of attempts) {
      try {
        await evaluateTestAttempt(attempt._id.toString());
      } catch (evalErr) {}
    }

    const updatedAttempts = await TestAttempt.find({ 
      studentId: req.user?._id,
      status: { $in: ['Completed', 'Force-Submitted'] }
    })
      .populate('testId', 'title testType marksPerQuestion duration isFullSyllabus')
      .sort({ createdAt: -1 });
      
    res.json(updatedAttempts);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get scorecard details for a specific attempt
// @route   GET /api/attempts/:id
// @access  Student
export const getResultDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    let attempt = await TestAttempt.findOne({ _id: id, studentId: req.user?._id })
      .populate({
        path: 'testId',
        select: 'title testType marksPerQuestion negativeMarksPerQuestion duration instructions isFullSyllabus'
      });
      
    if (!attempt) {
      res.status(404).json({ message: 'Result not found' });
      return;
    }

    attempt = await populateAttemptQuestions(attempt, 'content options correctAnswer explanation difficulty chapterId subjectId');
    
    res.json(attempt);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get overall leaderboard (by total score across all completed tests)
// @route   GET /api/attempts/leaderboard
// @access  Student + Admin
export const getLeaderboard = async (req: Request, res: Response): Promise<void> => {
  try {
    // Aggregate: sum scores of all completed attempts per student
    const leaderboard = await TestAttempt.aggregate([
      { $match: { status: { $in: ['Completed', 'Force-Submitted'] } } },
      {
        $group: {
          _id: '$studentId',
          totalScore: { $sum: '$score' },
          totalMarks: { $sum: '$totalMarks' },
          attemptCount: { $sum: 1 }
        }
      },
      { $sort: { totalScore: -1 } },
      { $limit: 100 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'student'
        }
      },
      { $unwind: '$student' },
      {
        $project: {
          studentId: '$_id',
          name: '$student.name',
          totalScore: 1,
          totalMarks: 1,
          attemptCount: 1,
          percentage: {
            $cond: [
              { $gt: ['$totalMarks', 0] },
              { $multiply: [{ $divide: ['$totalScore', '$totalMarks'] }, 100] },
              0
            ]
          }
        }
      }
    ]);

    // Add rank
    const ranked = leaderboard.map((entry, index) => ({
      rank: index + 1,
      ...entry
    }));

    // Find current student's rank
    const myRank = ranked.find(r => r.studentId?.toString() === req.user?._id?.toString());

    res.json({ leaderboard: ranked, myRank: myRank || null });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
