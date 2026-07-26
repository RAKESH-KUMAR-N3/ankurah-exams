import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import StudentType from '../models/StudentType';

// @desc    Create a StudentType
// @route   POST /api/student-types
// @access  Admin
export const createStudentType = asyncHandler(async (req: Request, res: Response) => {
  console.log('Received body in createStudentType:', req.body);
  const { name, state } = req.body;
  if (!name || !state) {
    res.status(400);
    throw new Error('Please provide group name and state');
  }
  const studentType = await StudentType.create({ name, state });
  res.status(201).json(studentType);
});

// @desc    Get all StudentTypes
// @route   GET /api/student-types
// @access  Admin
export const getStudentTypes = asyncHandler(async (req: Request, res: Response) => {
  const studentTypes = await StudentType.find({});
  res.json(studentTypes);
});

// @desc    Update a StudentType
// @route   PUT /api/student-types/:id
// @access  Admin
export const updateStudentType = asyncHandler(async (req: Request, res: Response) => {
  const { name, state } = req.body;
  const studentType = await StudentType.findById(req.params.id);
  if (studentType) {
    studentType.name = name || studentType.name;
    if (state) studentType.state = state;
    const updatedStudentType = await studentType.save();
    res.json(updatedStudentType);
  } else {
    res.status(404);
    throw new Error('StudentType not found');
  }
});

// @desc    Delete a StudentType
// @route   DELETE /api/student-types/:id
// @access  Admin
export const deleteStudentType = asyncHandler(async (req: Request, res: Response) => {
  const studentType = await StudentType.findById(req.params.id);
  if (studentType) {
    await StudentType.deleteOne({ _id: studentType._id });
    res.json({ message: 'StudentType removed' });
  } else {
    res.status(404);
    throw new Error('StudentType not found');
  }
});
