import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import User from '../models/User';
import Exam from '../models/Exam';
import StudentType from '../models/StudentType';
import generateToken from '../utils/generateToken';
import bcrypt from 'bcryptjs';

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user && (await bcrypt.compare(password, user.password))) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      token: generateToken(user._id.toString()),
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, phone, role, category, exams, studentType, plan } = req.body;

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    phone,
    role: role || 'student',
    category: category && category !== '' ? category : undefined,
    studentType: studentType && studentType !== '' ? studentType : undefined,
    exams: Array.isArray(exams) && exams.length > 0 ? exams : [],
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      token: generateToken(user._id.toString()),
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Get public metadata for registration (exams, studentTypes)
// @route   GET /api/auth/metadata
// @access  Public
export const getAuthMetadata = asyncHandler(async (req: Request, res: Response) => {
  const exams = await Exam.find({}).select('name description category');
  const studentTypes = await StudentType.find({}).select('name description');
  
  res.json({
    exams,
    studentTypes
  });
});
