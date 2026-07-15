import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Timetable from '../models/Timetable';

// @desc    Create a Timetable entry
// @route   POST /api/timetables
// @access  Admin
export const createTimetable = asyncHandler(async (req: Request, res: Response) => {
  const { categoryId, examId, studentTypeId, subjectId, chapterId, date, startTime, endTime, studyTopic, revision, practiceMCQs, assignment } = req.body;
  const timetable = await Timetable.create({
    categoryId, examId, studentTypeId, subjectId, chapterId, date, startTime, endTime, studyTopic, revision, practiceMCQs, assignment
  });
  res.status(201).json(timetable);
});

// @desc    Get all Timetable entries
// @route   GET /api/timetables
// @access  Admin
export const getTimetables = asyncHandler(async (req: Request, res: Response) => {
  const timetables = await Timetable.find({})
    .populate('categoryId examId studentTypeId subjectId chapterId');
  res.json(timetables);
});

// @desc    Update a Timetable entry
// @route   PUT /api/timetables/:id
// @access  Admin
export const updateTimetable = asyncHandler(async (req: Request, res: Response) => {
  const { categoryId, examId, studentTypeId, subjectId, chapterId, date, startTime, endTime, studyTopic, revision, practiceMCQs, assignment } = req.body;
  const timetable = await Timetable.findById(req.params.id);
  
  if (timetable) {
    timetable.categoryId = categoryId || timetable.categoryId;
    timetable.examId = examId || timetable.examId;
    timetable.studentTypeId = studentTypeId || timetable.studentTypeId;
    timetable.subjectId = subjectId || timetable.subjectId;
    timetable.chapterId = chapterId || timetable.chapterId;
    timetable.date = date || timetable.date;
    timetable.startTime = startTime || timetable.startTime;
    timetable.endTime = endTime || timetable.endTime;
    timetable.studyTopic = studyTopic || timetable.studyTopic;
    timetable.revision = revision || timetable.revision;
    timetable.practiceMCQs = practiceMCQs || timetable.practiceMCQs;
    timetable.assignment = assignment || timetable.assignment;

    const updatedTimetable = await timetable.save();
    res.json(updatedTimetable);
  } else {
    res.status(404);
    throw new Error('Timetable not found');
  }
});

// @desc    Delete a Timetable entry
// @route   DELETE /api/timetables/:id
// @access  Admin
export const deleteTimetable = asyncHandler(async (req: Request, res: Response) => {
  const timetable = await Timetable.findById(req.params.id);
  if (timetable) {
    await Timetable.deleteOne({ _id: timetable._id });
    res.json({ message: 'Timetable removed' });
  } else {
    res.status(404);
    throw new Error('Timetable not found');
  }
});
