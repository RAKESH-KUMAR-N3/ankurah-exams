import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Timetable from '../models/Timetable';

// @desc    Create a Timetable entry
// @route   POST /api/timetables
// @access  Admin
export const createTimetable = asyncHandler(async (req: Request, res: Response) => {
  const { 
    planId, examId, studentTypeId, subjectIds, subjectId, chapterName, 
    chapterId, date, scheduleType, dayOfWeek, startTime, endTime, 
    studyTopic, imageUrl, revision, practiceMCQs, assignment 
  } = req.body;

  const timetable = await Timetable.create({
    planId: planId || examId,
    examId: examId || planId,
    studentTypeId,
    subjectIds: subjectIds || (subjectId ? [subjectId] : []),
    subjectId,
    chapterName,
    chapterId,
    date,
    scheduleType: scheduleType || 'daily',
    dayOfWeek,
    startTime,
    endTime,
    studyTopic,
    imageUrl,
    revision,
    practiceMCQs,
    assignment
  });

  res.status(201).json(timetable);
});

// @desc    Get all Timetable entries
// @route   GET /api/timetables
// @access  Admin / Student
export const getTimetables = asyncHandler(async (req: Request, res: Response) => {
  const timetables = await Timetable.find({}).sort({ createdAt: -1 });
  res.json(timetables);
});

// @desc    Update a Timetable entry
// @route   PUT /api/timetables/:id
// @access  Admin
export const updateTimetable = asyncHandler(async (req: Request, res: Response) => {
  const timetable = await Timetable.findById(req.params.id);
  
  if (timetable) {
    Object.assign(timetable, req.body);
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
