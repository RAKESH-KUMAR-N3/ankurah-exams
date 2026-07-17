import { Response } from 'express';
import { AuthRequest as Request } from '../middlewares/authMiddleware';
import User from '../models/User';
import Exam from '../models/Exam';
import Subject from '../models/Subject';
import Chapter from '../models/Chapter';
import StudyMaterial from '../models/StudyMaterial';
import Test from '../models/Test';
import TestAttempt from '../models/TestAttempt';
import Notification from '../models/Notification';
import PerformanceMetric from '../models/PerformanceMetric';
import Timetable from '../models/Timetable';
import Transaction from '../models/Transaction';

export const getAdminDashboardSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const [
      totalStudents,
      activeStudents,
      totalExams,
      totalSubjects,
      totalChapters,
      totalMaterials,
      totalTests,
      totalAttempts,
      recentNotifications,
      transactions,
      recentTransactions
    ] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'student', isActive: true }),
      Exam.countDocuments(),
      Subject.countDocuments(),
      Chapter.countDocuments(),
      StudyMaterial.countDocuments(),
      Test.countDocuments(),
      TestAttempt.countDocuments(),
      Notification.find().sort({ createdAt: -1 }).limit(5).lean(),
      Transaction.find({ status: 'success' }).lean(),
      Transaction.find().sort({ createdAt: -1 }).limit(5).populate('studentId', 'name email').populate('planId', 'name').lean()
    ]);

    // Average scores
    const scoreAgg = await TestAttempt.aggregate([
      { $group: { _id: null, avgScore: { $avg: "$score" } } }
    ]);
    const avgScore = scoreAgg.length > 0 ? scoreAgg[0].avgScore : 0;

    // Revenue calculation
    const totalRevenue = transactions.reduce((sum, txn) => sum + (txn.amount || 0), 0);

    // Mock progress data for Bar Chart (e.g., last 6 months enrollment/revenue)
    const projectProgressData = [
      { name: 'Jan', students: 10, revenue: 5000 },
      { name: 'Feb', students: 15, revenue: 7500 },
      { name: 'Mar', students: 20, revenue: 10000 },
      { name: 'Apr', students: 28, revenue: 14000 },
      { name: 'May', students: 35, revenue: 17500 },
      { name: 'Jun', students: totalStudents || 45, revenue: totalRevenue || 22500 },
    ];

    res.json({
      totalStudents,
      activeStudents,
      totalExams,
      totalSubjects,
      totalChapters,
      totalMaterials,
      totalTests,
      totalAttempts,
      avgScore,
      recentNotifications,
      totalRevenue,
      last5Transactions: recentTransactions,
      projectProgressData
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getStudentDashboardSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?._id);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    // Queries scoped by student selection
    let baseQuery: any = { examId: { $in: user.exams || [] } };
    if (user.studentType) {
      baseQuery.$or = [
        { studentTypeId: user.studentType },
        { studentTypeId: { $exists: false } },
        { studentTypeId: null }
      ];
    } else {
      baseQuery.$or = [
        { studentTypeId: { $exists: false } },
        { studentTypeId: null }
      ];
    }

    // 1. Today's Timetable
    const todaysTimetableQuery = { ...baseQuery, date: { $gte: today, $lte: endOfDay } };
    const todaysTimetable = await Timetable.find(todaysTimetableQuery).populate('subjectId', 'name').lean();

    // 2. Upcoming Tests
    const upcomingTestsQuery = { ...baseQuery, status: 'Published' };
    const upcomingTests = await Test.find(upcomingTestsQuery).sort({ createdAt: -1 }).limit(3).lean();

    // 3. Recent Results & Performance
    const recentResults = await TestAttempt.find({ studentId: user._id })
      .populate('testId', 'title totalMarks')
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();

    const performance = await PerformanceMetric.find({ studentId: user._id }).lean();

    // 4. Latest Notifications
    const notificationConditions: any[] = [{ targetAudience: 'All' }];
    if (user.exams && user.exams.length > 0) {
      notificationConditions.push({ targetAudience: 'Exam', examId: { $in: user.exams } });
    }
    if (user.studentType) {
      notificationConditions.push({ targetAudience: 'StudentType', studentTypeId: user.studentType });
    }
    const latestNotifications = await Notification.find({
      status: 'Published',
      $or: notificationConditions
    }).sort({ createdAt: -1 }).limit(5).lean();

    res.json({
      todaysTimetable,
      upcomingTests,
      recentResults,
      performance,
      latestNotifications
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
