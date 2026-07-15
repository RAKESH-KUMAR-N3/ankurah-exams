import { Request, Response } from 'express';
import PerformanceMetric from '../models/PerformanceMetric';

export const getOverallPerformanceReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const report = await PerformanceMetric.aggregate([
      {
        $group: {
          _id: null,
          avgAccuracy: { $avg: "$overallAccuracy" },
          totalMetrics: { $sum: 1 }
        }
      }
    ]);
    res.json(report.length > 0 ? report[0] : { avgAccuracy: 0, totalMetrics: 0 });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getExamWiseReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const report = await PerformanceMetric.aggregate([
      {
        $group: {
          _id: "$examId",
          avgAccuracy: { $avg: "$overallAccuracy" },
          studentCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "exams",
          localField: "_id",
          foreignField: "_id",
          as: "exam"
        }
      },
      {
        $unwind: "$exam"
      },
      {
        $project: {
          _id: 1,
          examName: "$exam.name",
          avgAccuracy: 1,
          studentCount: 1
        }
      }
    ]);
    res.json(report);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
