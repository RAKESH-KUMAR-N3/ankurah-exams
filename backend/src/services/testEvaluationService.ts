import TestAttempt from '../models/TestAttempt';
import Test from '../models/Test';
import Question from '../models/Question';
import ApEntranceQuestion from '../models/ApEntranceQuestion';
import TgEntranceQuestion from '../models/TgEntranceQuestion';
import CompetitiveQuestionBySubject from '../models/CompetitiveQuestionBySubject';
import PerformanceMetric from '../models/PerformanceMetric';
import mongoose from 'mongoose';

export const resolveCorrectAnswer = (rawCorrect: string, options: string[]): string => {
  if (!rawCorrect) return options?.[0] || '';
  const trimmed = rawCorrect.trim();
  if (options && options.includes(trimmed)) return trimmed;

  const lower = trimmed.toLowerCase();
  if (lower === 'option a' || lower === 'optiona' || lower === 'a' || lower === '1' || lower === 'option 1') {
    return options?.[0] || trimmed;
  }
  if (lower === 'option b' || lower === 'optionb' || lower === 'b' || lower === '2' || lower === 'option 2') {
    return options?.[1] || trimmed;
  }
  if (lower === 'option c' || lower === 'optionc' || lower === 'c' || lower === '3' || lower === 'option 3') {
    return options?.[2] || trimmed;
  }
  if (lower === 'option d' || lower === 'optiond' || lower === 'd' || lower === '4' || lower === 'option 4') {
    return options?.[3] || trimmed;
  }

  return trimmed;
};

export const isAnswerCorrect = (selectedOption: string, correctAnswer: string, options: string[]): boolean => {
  if (!selectedOption) return false;
  const sel = selectedOption.trim();
  const corr = (correctAnswer || '').trim();

  if (sel === corr) return true;
  if (sel.toLowerCase() === corr.toLowerCase()) return true;

  const resolvedCorr = resolveCorrectAnswer(corr, options || []);
  if (sel === resolvedCorr || sel.toLowerCase() === resolvedCorr.toLowerCase()) {
    return true;
  }

  const resolvedSel = resolveCorrectAnswer(sel, options || []);
  if (resolvedSel === corr || resolvedSel.toLowerCase() === corr.toLowerCase() || (resolvedCorr && resolvedSel === resolvedCorr)) {
    return true;
  }

  return false;
};

export const evaluateTestAttempt = async (attemptId: string) => {
  const attempt = await TestAttempt.findById(attemptId).populate('testId');
  if (!attempt) throw new Error('Attempt not found');
  
  const test: any = attempt.testId;
  if (!test) throw new Error('Test not found');

  // Get marks scheme from Test (global per question)
  const marksPerQuestion: number = test.marksPerQuestion ?? 4;
  const negativeMarksPerQuestion: number = test.negativeMarksPerQuestion ?? 1;

  let score = 0;
  let totalMarks = 0;

  // Get all questions for this attempt (queries apentrancequestions, tgentrancequestions, competitivequestionsbysubjects)
  const questionIds = attempt.responses
    .map((r: any) => (r.questionId?._id || r.questionId))
    .filter((id: any) => id && mongoose.isValidObjectId(id));

  const [apQuestions, tgQuestions, compQuestions, legacyQuestions] = await Promise.all([
    ApEntranceQuestion.find({ _id: { $in: questionIds } }).lean(),
    TgEntranceQuestion.find({ _id: { $in: questionIds } }).lean(),
    CompetitiveQuestionBySubject.find({ _id: { $in: questionIds } }).lean(),
    Question.find({ _id: { $in: questionIds } }).lean()
  ]);
  const questions = [...apQuestions, ...tgQuestions, ...compQuestions, ...legacyQuestions];
  const questionMap = new Map();
  questions.forEach(q => questionMap.set(q._id.toString(), q));

  totalMarks = attempt.responses.length * marksPerQuestion;

  // Evaluate each response using global marks scheme
  const evaluatedResponses = attempt.responses.map((resp: any) => {
    const rawQId = resp.questionId?._id || resp.questionId;
    const questionIdStr = rawQId ? rawQId.toString() : '';
    const q: any = questionMap.get(questionIdStr);
    
    let isCorrect = false;
    
    if (q) {
      if (resp.selectedOption && isAnswerCorrect(resp.selectedOption, q.correctAnswer, q.options)) {
        isCorrect = true;
        score += marksPerQuestion;
      } else if (resp.selectedOption) {
        // Apply negative marking
        score -= negativeMarksPerQuestion;
      }
      // No answer = no change (unattempted)
    }
    
    return {
      questionId: resp.questionId,
      selectedOption: resp.selectedOption,
      isCorrect: isCorrect
    };
  });

  attempt.responses = evaluatedResponses as any;
  attempt.score = Math.max(0, score); // score can't be negative
  attempt.totalMarks = totalMarks;
  attempt.submittedAt = attempt.submittedAt || new Date();
  await attempt.save();

  // Update performance metrics safely without breaking submission flow
  if (test.examIds && test.examIds.length > 0) {
    for (const examId of test.examIds) {
      try {
        const rawExamId = examId?._id || examId;
        if (rawExamId && mongoose.isValidObjectId(rawExamId)) {
          await updatePerformanceMetrics(attempt.studentId.toString(), rawExamId.toString(), questions, evaluatedResponses);
        }
      } catch (metricsErr) {
        console.warn('Non-blocking metrics update warning:', metricsErr);
      }
    }
  }

  return attempt;
};

const updatePerformanceMetrics = async (
  studentId: string, 
  examId: string, 
  questions: any[], 
  evaluatedResponses: any[]
) => {
  if (!studentId || !examId || !mongoose.isValidObjectId(studentId) || !mongoose.isValidObjectId(examId)) return;

  let metric = await PerformanceMetric.findOne({ studentId, examId });
  
  if (!metric) {
    metric = new PerformanceMetric({
      studentId: new mongoose.Types.ObjectId(studentId),
      examId: new mongoose.Types.ObjectId(examId),
      overallAccuracy: 0,
      chapterWiseStats: []
    });
  }
  
  // Calculate stats per chapter from this test attempt
  const chapterStatsMap = new Map();
  
  questions.forEach(q => {
    if (!q || !q.chapterId) return;
    const rawChap = q.chapterId?._id || q.chapterId;
    if (!rawChap) return;
    const chapterIdStr = rawChap.toString();
    if (!mongoose.isValidObjectId(chapterIdStr)) return;

    const response = evaluatedResponses.find(r => {
      const rqId = r.questionId?._id || r.questionId;
      return rqId && rqId.toString() === q._id.toString();
    });
    
    if (!chapterStatsMap.has(chapterIdStr)) {
      chapterStatsMap.set(chapterIdStr, { attempted: 0, correct: 0 });
    }
    
    const stats = chapterStatsMap.get(chapterIdStr);
    
    if (response && response.selectedOption) {
      stats.attempted += 1;
      if (response.isCorrect) {
        stats.correct += 1;
      }
    }
  });

  for (const [chapterIdStr, stats] of chapterStatsMap.entries()) {
    const existingChapterStat = metric.chapterWiseStats.find((cs: any) => cs.chapterId?.toString() === chapterIdStr);
    
    if (existingChapterStat) {
      const prevAttempted = existingChapterStat.attemptedCount || 0;
      const prevCorrect = (existingChapterStat.accuracy / 100) * prevAttempted || 0;
      
      const newAttempted = prevAttempted + stats.attempted;
      const newCorrect = prevCorrect + stats.correct;
      
      existingChapterStat.attemptedCount = newAttempted;
      existingChapterStat.accuracy = newAttempted > 0 ? (newCorrect / newAttempted) * 100 : 0;
    } else {
      metric.chapterWiseStats.push({
        chapterId: new mongoose.Types.ObjectId(chapterIdStr),
        attemptedCount: stats.attempted,
        accuracy: stats.attempted > 0 ? (stats.correct / stats.attempted) * 100 : 0
      });
    }
  }

  let totalAttempted = 0;
  let totalCorrect = 0;
  
  metric.chapterWiseStats.forEach((cs: any) => {
    totalAttempted += cs.attemptedCount;
    totalCorrect += (cs.accuracy / 100) * cs.attemptedCount;
  });
  
  metric.overallAccuracy = totalAttempted > 0 ? (totalCorrect / totalAttempted) * 100 : 0;

  await metric.save();
};
