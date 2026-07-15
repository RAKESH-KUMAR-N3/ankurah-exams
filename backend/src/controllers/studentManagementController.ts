import { Request, Response } from 'express';
import User from '../models/User';
import { getPaginatedData } from '../services/paginationService';

export const getStudents = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await getPaginatedData(User, { role: 'student' }, req.query, {
      searchFields: ['name', 'email'],
      populate: [
        { path: 'category', select: 'name' },
        { path: 'exams', select: 'name' },
        { path: 'studentType', select: 'name' }
      ],
      lean: true
    });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getStudentProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const student = await User.findOne({ _id: req.params.id, role: 'student' })
      .select('-password')
      .populate('category', 'name')
      .populate('exams', 'name')
      .populate('studentType', 'name')
      .lean();

    if (!student) {
      res.status(404).json({ message: 'Student not found' });
      return;
    }
    res.json(student);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const activateStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    const student = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'student' },
      { isActive: true },
      { new: true }
    ).select('-password');

    if (!student) {
      res.status(404).json({ message: 'Student not found' });
      return;
    }
    res.json({ message: 'Student activated successfully', student });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deactivateStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    const student = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'student' },
      { isActive: false },
      { new: true }
    ).select('-password');

    if (!student) {
      res.status(404).json({ message: 'Student not found' });
      return;
    }
    res.json({ message: 'Student deactivated successfully', student });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
