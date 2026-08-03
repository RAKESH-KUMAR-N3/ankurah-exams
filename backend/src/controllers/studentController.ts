import mongoose from 'mongoose';
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

const getStudentExamIds = async (user: any) => {
  const activePlans = user.purchasedPlans?.filter((p: any) => {
    if (!p.isActive) return false;
    if (p.expiryDate && new Date(p.expiryDate) < new Date()) return false;
    return true;
  }) || [];

  const rawIds = activePlans.flatMap((p: any) => [
    p.planId?.toString(),
    (p.examId?._id || p.examId)?.toString()
  ]).filter(Boolean);

  if (rawIds.length === 0) return { examRefStrings: [], examObjectIds: [], purchasedExams: [] };

  const validObjectIds = rawIds.filter((id: any) => mongoose.isValidObjectId(id)).map((id: any) => new mongoose.Types.ObjectId(id));
  
  const purchasedExams = await Exam.find({
    $or: [
      { _id: { $in: validObjectIds } },
      { examId: { $in: rawIds } }
    ]
  });

  const allStrings = new Set<string>(rawIds);
  purchasedExams.forEach(e => {
    allStrings.add(e._id.toString());
    if (e.examId) allStrings.add(e.examId);
  });

  const examRefStrings = Array.from(allStrings);
  const examObjectIds = examRefStrings.filter((id: any) => mongoose.isValidObjectId(id)).map((id: any) => new mongoose.Types.ObjectId(id));

  return { examRefStrings, examObjectIds, purchasedExams };
};

export const getMySubjects = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?._id);
    if (!user) { res.json([]); return; }

    const { examRefStrings, examObjectIds, purchasedExams } = await getStudentExamIds(user);
    if (examRefStrings.length === 0 && purchasedExams.length === 0) { res.json([]); return; }

    // Direct subjects attached to exams
    const directSubjectIds: string[] = [];
    purchasedExams.forEach(e => {
      if (Array.isArray(e.subjects)) {
        e.subjects.forEach((s: any) => directSubjectIds.push(s.toString()));
      }
    });
    const validDirectSubjectObjIds = directSubjectIds.filter((id: any) => mongoose.isValidObjectId(id)).map((id: any) => new mongoose.Types.ObjectId(id));
    const allExamRefs = [...examObjectIds, ...examRefStrings];

    const subjectQuery: any = {
      $or: [
        { _id: { $in: [...validDirectSubjectObjIds, ...directSubjectIds] } },
        { examId: { $in: allExamRefs } },
        { examIds: { $in: examRefStrings } }
      ]
    };

    const compSubjectQuery: any = {
      $or: [
        { _id: { $in: [...validDirectSubjectObjIds, ...directSubjectIds] } },
        { examId: { $in: allExamRefs } },
        { examIds: { $in: examRefStrings } }
      ]
    };

    // Fetch from both Subject and CompetitiveSubject collections
    const [entranceSubjects, compSubjects] = await Promise.all([
      Subject.find(subjectQuery).populate('applicableFor'),
      CompetitiveSubject.find(compSubjectQuery)
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

    const subjectId = req.query.subjectId;
    if (subjectId) {
      const validSubId = mongoose.isValidObjectId(subjectId) ? new mongoose.Types.ObjectId(subjectId as string) : subjectId;
      const chapters = await Chapter.find({
        $or: [
          { subjectId: subjectId },
          { subjectId: validSubId }
        ]
      }).populate('subjectId', 'name');
      res.json(chapters);
      return;
    }

    const { examRefStrings, examObjectIds, purchasedExams } = await getStudentExamIds(user);
    if (examRefStrings.length === 0 && purchasedExams.length === 0) { res.json([]); return; }

    // Direct subjects attached to exams
    const directSubjectIds: string[] = [];
    purchasedExams.forEach(e => {
      if (Array.isArray(e.subjects)) {
        e.subjects.forEach((s: any) => directSubjectIds.push(s.toString()));
      }
    });
    const validDirectSubjectObjIds = directSubjectIds.filter((id: any) => mongoose.isValidObjectId(id)).map((id: any) => new mongoose.Types.ObjectId(id));
    const allExamRefs = [...examObjectIds, ...examRefStrings];

    const subjectQuery: any = {
      $or: [
        { _id: { $in: [...validDirectSubjectObjIds, ...directSubjectIds] } },
        { examId: { $in: allExamRefs } },
        { examIds: { $in: examRefStrings } }
      ]
    };

    const [entranceSubjects, compSubjects] = await Promise.all([
      Subject.find(subjectQuery).select('_id'),
      CompetitiveSubject.find(subjectQuery).select('_id')
    ]);

    const allResolvedSubjectIds = [...entranceSubjects, ...compSubjects].map(s => s._id.toString());
    const validSubObjIds = allResolvedSubjectIds.filter((id: any) => mongoose.isValidObjectId(id)).map((id: any) => new mongoose.Types.ObjectId(id));

    if (allResolvedSubjectIds.length === 0) { res.json([]); return; }

    const chapters = await Chapter.find({
      $or: [
        { subjectId: { $in: allResolvedSubjectIds } },
        { subjectId: { $in: validSubObjIds } }
      ]
    }).populate('subjectId', 'name');

    res.json(chapters);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyTimetables = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?._id);

    if (!user) {
      res.json([]);
      return;
    }

    // Collect all IDs (planId + examId) from active purchased plans
    const activePlans = (user.purchasedPlans || []).filter((p: any) => p.isActive !== false);
    const purchasedPlanIds = activePlans.map((p: any) => (p.planId?._id || p.planId)?.toString()).filter(Boolean);
    const purchasedExamIds = activePlans.map((p: any) => (p.examId?._id || p.examId)?.toString()).filter(Boolean);

    // All IDs to match against courseId / planId / examId on the timetable
    const allIds = [...new Set([...purchasedPlanIds, ...purchasedExamIds])];

    // If no purchased plans, return all published timetables (preview mode)
    let query: any;
    if (allIds.length === 0) {
      query = { status: 'published' };
    } else {
      query = {
        $or: [
          { courseId: { $in: allIds } },
          { planId: { $in: allIds } },
          { examId: { $in: allIds } }
        ]
      };
    }

    const timetables = await Timetable.find(query).sort({ weekNumber: 1, createdAt: 1 });
    res.json(timetables);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};


export const getMyTests = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?._id);
    if (!user) { res.json([]); return; }

    const { examRefStrings, examObjectIds, purchasedExams } = await getStudentExamIds(user);
    if (examRefStrings.length === 0 && purchasedExams.length === 0) { res.json([]); return; }

    const allExamRefs = [...examObjectIds, ...examRefStrings];

    // Find student's subjects as well so chapter tests created for those subjects are matched
    const directSubjectIds: string[] = [];
    purchasedExams.forEach(e => {
      if (Array.isArray(e.subjects)) {
        e.subjects.forEach((s: any) => directSubjectIds.push(s.toString()));
      }
    });
    const validDirectSubjectObjIds = directSubjectIds.filter((id: any) => mongoose.isValidObjectId(id)).map((id: any) => new mongoose.Types.ObjectId(id));

    const subjectQuery: any = {
      $or: [
        { _id: { $in: [...validDirectSubjectObjIds, ...directSubjectIds] } },
        { examId: { $in: allExamRefs } },
        { examIds: { $in: examRefStrings } }
      ]
    };
    const [entranceSubjects, compSubjects] = await Promise.all([
      Subject.find(subjectQuery).select('_id'),
      CompetitiveSubject.find(subjectQuery).select('_id')
    ]);
    const allSubjectIds = [...entranceSubjects, ...compSubjects].map(s => s._id.toString());
    const validSubObjIds = allSubjectIds.filter((id: any) => mongoose.isValidObjectId(id)).map((id: any) => new mongoose.Types.ObjectId(id));
    const allSubRefs = [...validSubObjIds, ...allSubjectIds];

    const conditions: any[] = [
      { status: 'Published' },
      {
        $or: [
          { examIds: { $in: allExamRefs } },
          { examId: { $in: allExamRefs } },
          ...(allSubRefs.length > 0 ? [{ subjectId: { $in: allSubRefs } }] : [])
        ]
      }
    ];

    if (user.studentType) {
      conditions.push({
        $or: [
          { studentTypeIds: user.studentType },
          { studentTypeIds: { $exists: false } },
          { studentTypeIds: { $size: 0 } }
        ]
      });
    } else {
      conditions.push({
        $or: [
          { studentTypeIds: { $exists: false } },
          { studentTypeIds: { $size: 0 } }
        ]
      });
    }

    if (req.query.type) {
      conditions.push({ testType: req.query.type });
    }

    const query: any = { $and: conditions };

    const tests = await Test.find(query)
      .populate('subjectId', 'name')
      .populate('chapterId', 'title')
      .populate('subjectConfigs.subjectId', 'name')
      .populate('subjectConfigs.chapters.chapterId', 'title')
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
