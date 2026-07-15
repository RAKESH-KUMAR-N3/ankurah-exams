import { Response } from 'express';
import { AuthRequest as Request } from '../middlewares/authMiddleware';
import User from '../models/User';
import Subject from '../models/Subject';
import Chapter from '../models/Chapter';
import StudyMaterial from '../models/StudyMaterial';
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
    if (!user || !user.exams || user.exams.length === 0) {
      res.json([]);
      return;
    }

    let query: any = { examId: { $in: user.exams } };
    if (user.studentType) {
      query.$or = [
        { applicableFor: user.studentType },
        { applicableFor: { $exists: false } },
        { applicableFor: { $size: 0 } }
      ];
    }
    
    const subjects = await Subject.find(query).populate('examId', 'name');
    res.json(subjects);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyChapters = async (req: Request, res: Response): Promise<void> => {
  try {
    const subjectId = req.query.subjectId;
    let query: any = {};
    if (subjectId) {
      query.subjectId = subjectId;
    } else {
      const user = await User.findById(req.user?._id);
      if (!user || !user.exams || user.exams.length === 0) {
        res.json([]);
        return;
      }
      
      let subjectQuery: any = { examId: { $in: user.exams } };
      if (user.studentType) {
        subjectQuery.$or = [
          { applicableFor: user.studentType },
          { applicableFor: { $exists: false } },
          { applicableFor: { $size: 0 } }
        ];
      }
      const subjects = await Subject.find(subjectQuery).select('_id');
      const subjectIds = subjects.map(s => s._id);
      query.subjectId = { $in: subjectIds };
    }

    const chapters = await Chapter.find(query).populate('subjectId', 'name');
    res.json(chapters);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyMaterials = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?._id);
    if (!user || !user.exams || user.exams.length === 0) {
      res.json([]);
      return;
    }
    
    let query: any = { examId: { $in: user.exams } };
    if (user.studentType) {
      query.$or = [
        { studentTypeId: user.studentType },
        { studentTypeId: { $exists: false } },
        { studentTypeId: null }
      ];
    } else {
      query.$or = [
        { studentTypeId: { $exists: false } },
        { studentTypeId: null }
      ];
    }
    
    const materials = await StudyMaterial.find(query)
      .populate('subjectId', 'name')
      .populate('chapterId', 'title');
    res.json(materials);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyTimetables = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?._id);
    if (!user || !user.exams || user.exams.length === 0) {
      res.json([]);
      return;
    }
    
    let query: any = { examId: { $in: user.exams } };
    if (user.studentType) {
      query.$or = [
        { studentTypeId: user.studentType },
        { studentTypeId: { $exists: false } },
        { studentTypeId: null }
      ];
    } else {
      query.$or = [
        { studentTypeId: { $exists: false } },
        { studentTypeId: null }
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
    if (!user || !user.exams || user.exams.length === 0) {
      res.json([]);
      return;
    }
    
    let query: any = { 
      examId: { $in: user.exams },
      status: 'Published'
    };
    
    if (user.studentType) {
      query.$or = [
        { studentTypeId: user.studentType },
        { studentTypeId: { $exists: false } },
        { studentTypeId: null }
      ];
    } else {
      query.$or = [
        { studentTypeId: { $exists: false } },
        { studentTypeId: null }
      ];
    }
    
    if (req.query.type) {
      query.testType = req.query.type;
    }
    
    const tests = await Test.find(query)
      .populate('subjectId', 'name')
      .populate('chapterId', 'title')
      .select('-questions'); // Exclude questions for list view
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
