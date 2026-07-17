import TestAttempt from '../models/TestAttempt';
import Test from '../models/Test';
import Question from '../models/Question';
import PerformanceMetric from '../models/PerformanceMetric';
import mongoose from 'mongoose';

export const evaluateTestAttempt = async (attemptId: string) => {
  const attempt = await TestAttempt.findById(attemptId).populate('testId');
  if (!attempt) throw new Error('Attempt not found');
  
  const test: any = attempt.testId;
  if (!test) throw new Error('Test not found');

  let score = 0;
  
  // Get all questions from the test
  const questions = await Question.find({ _id: { $in: test.questions } });
  const questionMap = new Map();
  questions.forEach(q => questionMap.set(q._id.toString(), q));

  // Evaluate each response
  const evaluatedResponses = attempt.responses.map((resp: any) => {
    const questionIdStr = resp.questionId.toString();
    const q: any = questionMap.get(questionIdStr);
    
    let isCorrect = false;
    
    if (q) {
      if (resp.selectedOption && resp.selectedOption === q.correctAnswer) {
        isCorrect = true;
        score += q.marks;
      } else if (resp.selectedOption && resp.selectedOption !== q.correctAnswer) {
        if (test.negativeMarking) {
          score -= q.negativeMarks;
        }
      }
    }
    
    return {
      questionId: resp.questionId,
      selectedOption: resp.selectedOption,
      isCorrect: isCorrect
    };
  });

  attempt.responses = evaluatedResponses as any;
  attempt.score = score;
  await attempt.save();

  // Now update performance metrics
  await updatePerformanceMetrics(attempt.studentId.toString(), test.examId.toString(), questions, evaluatedResponses);

  return attempt;
};

const updatePerformanceMetrics = async (
  studentId: string, 
  examId: string, 
  questions: any[], 
  evaluatedResponses: any[]
) => {
  let metric = await PerformanceMetric.findOne({ studentId, examId });
  
  if (!metric) {
    metric = new PerformanceMetric({
      studentId,
      examId,
      overallAccuracy: 0,
      chapterWiseStats: []
    });
  }
  
  // Calculate stats per chapter from this test attempt
  const chapterStatsMap = new Map();
  
  questions.forEach(q => {
    const chapterIdStr = q.chapterId.toString();
    const response = evaluatedResponses.find(r => r.questionId.toString() === q._id.toString());
    
    if (!chapterStatsMap.has(chapterIdStr)) {
      chapterStatsMap.set(chapterIdStr, { attempted: 0, correct: 0 });
    }
    
    const stats = chapterStatsMap.get(chapterIdStr);
    
    // If the student attempted the question
    if (response && response.selectedOption) {
      stats.attempted += 1;
      if (response.isCorrect) {
        stats.correct += 1;
      }
    }
  });

  // Update existing metric chapter stats
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

  // Recalculate overall accuracy
  let totalAttempted = 0;
  let totalCorrect = 0;
  
  metric.chapterWiseStats.forEach((cs: any) => {
    totalAttempted += cs.attemptedCount;
    totalCorrect += (cs.accuracy / 100) * cs.attemptedCount;
  });
  
  metric.overallAccuracy = totalAttempted > 0 ? (totalCorrect / totalAttempted) * 100 : 0;

  await metric.save();
};
