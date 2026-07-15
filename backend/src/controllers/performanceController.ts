import { Response } from 'express';
import { AuthRequest as Request } from '../middlewares/authMiddleware';
import PerformanceMetric from '../models/PerformanceMetric';
import Chapter from '../models/Chapter';
import User from '../models/User';

export const getMyPerformance = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?._id);
    if (!user || !user.exams || user.exams.length === 0) {
      res.json([]);
      return;
    }

    const metrics = await PerformanceMetric.find({ studentId: user._id })
      .populate('examId', 'name')
      .populate({
        path: 'chapterWiseStats.chapterId',
        select: 'title subjectId',
        populate: {
          path: 'subjectId',
          select: 'name'
        }
      });

    // We can also generate recommendations on the fly
    const results = metrics.map((metric: any) => {
      const strongChapters: string[] = [];
      const weakChapters: string[] = [];
      const recommendations: string[] = [];

      metric.chapterWiseStats.forEach((stat: any) => {
        if (!stat.chapterId) return;
        
        const chapterTitle = stat.chapterId.title;
        
        if (stat.accuracy >= 70 && stat.attemptedCount > 5) {
          strongChapters.push(chapterTitle);
        } else if (stat.accuracy < 40 && stat.attemptedCount > 2) {
          weakChapters.push(chapterTitle);
          recommendations.push(`Revise ${chapterTitle}`);
          recommendations.push(`Attempt practice test for ${chapterTitle}`);
        }
      });

      if (recommendations.length === 0) {
        recommendations.push('Keep practicing more tests to generate insights.');
      }

      return {
        _id: metric._id,
        exam: metric.examId,
        overallAccuracy: metric.overallAccuracy,
        chapterWiseStats: metric.chapterWiseStats,
        strongChapters,
        weakChapters,
        recommendations
      };
    });

    res.json(results);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
