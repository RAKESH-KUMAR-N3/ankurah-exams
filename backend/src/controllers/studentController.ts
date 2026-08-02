import { Response } from 'express';
import { AuthRequest as Request } from '../middlewares/authMiddleware';
import User from '../models/User';
import Subject from '../models/Subject';
import Chapter from '../models/Chapter';
import Exam from '../models/Exam';
import CompetitiveSubject from '../models/CompetitiveSubject';

import Timetable from '../models/Timetable';
import Test from '../models/Test';
import Notification from '../models/Notification';

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?._id)
      .populate('category', 'name')
      .populate('exams', 'name')
      .populate('studentType', 'name')
      .select('-password');
      
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, exams, studentType } = req.body;
    
    const user = await User.findById(req.user?._id);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    user.category = category;
    user.exams = exams;
    user.studentType = studentType || undefined;

    const updatedUser = await user.save();
    
    const populatedUser = await User.findById(updatedUser._id)
      .populate('category', 'name')
      .populate('exams', 'name')
      .populate('studentType', 'name')
      .select('-password');
      
    res.json(populatedUser);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getMySubjects = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?._id);
    if (!user) { res.json([]); return; }

    // Only active (non-expired) plans
    const activePlans = user.purchasedPlans?.filter((p: any) => {
      if (!p.isActive) return false;
      if (p.expiryDate && new Date(p.expiryDate) < new Date()) return false;
      return true;
    }) || [];

    const purchasedExamIds = activePlans
      .map((p: any) => (p.examId?._id || p.examId)?.toString())
      .filter(Boolean);

    if (purchasedExamIds.length === 0) { res.json([]); return; }

    // Fetch exams with their attached subjects
    const purchasedExams = await Exam.find({ _id: { $in: purchasedExamIds } });

    // Collect all subject IDs from course subjects arrays
    const allSubjectIds: string[] = [];
    for (const exam of purchasedExams) {
      if (exam.subjects && exam.subjects.length > 0) {
        exam.subjects.forEach((sid: any) => allSubjectIds.push(sid.toString()));
      }
    }

    if (allSubjectIds.length === 0) { res.json([]); return; }

    // Fetch from both Subject and CompetitiveSubject collections
    const [entranceSubjects, compSubjects] = await Promise.all([
      Subject.find({ _id: { $in: allSubjectIds } }),
      CompetitiveSubject.find({ _id: { $in: allSubjectIds } })
    ]);

    // Deduplicate by ID (in case same subject attached to multiple courses)
    const seen = new Set();
    const subjects = [...entranceSubjects, ...compSubjects].filter(s => {
      const id = s._id.toString();
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });

    res.json(subjects);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyChapters = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?._id);
    if (!user) { res.json([]); return; }

    // Only active (non-expired) plans
    const activePlans = user.purchasedPlans?.filter((p: any) => {
      if (!p.isActive) return false;
      if (p.expiryDate && new Date(p.expiryDate) < new Date()) return false;
      return true;
    }) || [];

    const purchasedExamIds = activePlans
      .map((p: any) => (p.examId?._id || p.examId)?.toString())
      .filter(Boolean);

    if (purchasedExamIds.length === 0) { res.json([]); return; }

    const subjectId = req.query.subjectId;
    if (subjectId) {
      const chapters = await Chapter.find({ subjectId }).populate('subjectId', 'name');
      res.json(chapters);
      return;
    }

    // Get all subject IDs from purchased exam courses
    const purchasedExams = await Exam.find({ _id: { $in: purchasedExamIds } });
    const allSubjectIds: string[] = [];
    for (const exam of purchasedExams) {
      if (exam.subjects && exam.subjects.length > 0) {
        exam.subjects.forEach((sid: any) => allSubjectIds.push(sid.toString()));
      }
    }

    if (allSubjectIds.length === 0) { res.json([]); return; }

    const chapters = await Chapter.find({ subjectId: { $in: allSubjectIds } }).populate('subjectId', 'name');
    res.json(chapters);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};



export const getMyTimetables = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?._id);
    const purchasedExamIds = user?.purchasedPlans
      ?.filter((p: any) => p.isActive)
      .map((p: any) => (p.examId?._id || p.examId)?.toString())
      .filter(Boolean) || [];

    if (!user || purchasedExamIds.length === 0) {
      res.json([]);
      return;
    }

    let query: any = { examId: { $in: purchasedExamIds } };
    if (user.studentType) {
      query.$and = [
        {
          $or: [
            { studentTypeId: user.studentType },
            { studentTypeId: { $exists: false } },
            { studentTypeId: null }
          ]
        }
      ];
    }

    const timetables = await Timetable.find(query)
      .populate('subjectId', 'name')
      .populate('chapterId', 'title')
      .sort({ date: 1, startTime: 1 });
    res.json(timetables);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyTests = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?._id);
    const purchasedExamIds = user?.purchasedPlans
      ?.filter((p: any) => p.isActive)
      .map((p: any) => (p.examId?._id || p.examId)?.toString())
      .filter(Boolean) || [];

    if (!user || purchasedExamIds.length === 0) {
      res.json([]);
      return;
    }

    let query: any = { 
      examIds: { $in: purchasedExamIds },
      status: 'Published'
    };
    
    if (user.studentType) {
      query.$or = [
        { studentTypeIds: user.studentType },
        { studentTypeIds: { $exists: false } },
        { studentTypeIds: { $size: 0 } }
      ];
    } else {
      query.$or = [
        { studentTypeIds: { $exists: false } },
        { studentTypeIds: { $size: 0 } }
      ];
    }
    
    if (req.query.type) {
      query.testType = req.query.type;
    }
    
    const tests = await Test.find(query)
      .populate('subjectId', 'name')
      .populate('chapterId', 'title')
      .select('-questions');
    res.json(tests);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?._id);
    if (!user) {
      res.json([]);
      return;
    }
    
    const conditions: any[] = [{ targetAudience: 'All' }];
    
    if (user.exams && user.exams.length > 0) {
      conditions.push({
        targetAudience: 'Exam',
        examId: { $in: user.exams }
      });
    }
    
    if (user.studentType) {
      conditions.push({
        targetAudience: 'StudentType',
        studentTypeId: user.studentType
      });
    }
    
    const notifications = await Notification.find({
      status: 'Published',
      $or: conditions
    }).sort({ createdAt: -1 });
    
    res.json(notifications);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user?._id);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const bcrypt = require('bcryptjs');
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      res.status(400).json({ message: 'Current password is incorrect' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: 'Password updated successfully!' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
