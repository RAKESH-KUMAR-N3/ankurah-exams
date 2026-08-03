import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Timetable from '../models/Timetable';

// @desc    Create a Timetable entry
// @route   POST /api/timetables
// @access  Admin
export const createTimetable = asyncHandler(async (req: Request, res: Response) => {
  const { 
    courseId,
    courseName,
    weekTitle,
    weekNumber,
    startDate,
    endDate,
    weeklyChapters,
    weekendExamId,
    weekendExamTitle,
    status,
    // legacy fields
    planId, examId, studentTypeId, subjectIds, subjectId, chapterName, 
    chapterId, date, scheduleType, dayOfWeek, startTime, endTime, 
    studyTopic, imageUrl, revision, practiceMCQs, assignment 
  } = req.body;

  const timetable = await Timetable.create({
    courseId: courseId || planId || examId,
    courseName,
    weekTitle: weekTitle || `Week ${weekNumber || 1}`,
    weekNumber: weekNumber || 1,
    startDate: startDate || new Date().toISOString().split('T')[0],
    endDate: endDate || new Date().toISOString().split('T')[0],
    weeklyChapters: weeklyChapters || [],
    weekendExamId: weekendExamId || '',
    weekendExamTitle: weekendExamTitle || '',
    status: status || 'published',

    // legacy
    planId: planId || courseId,
    examId: examId || courseId,
    studentTypeId,
    subjectIds: subjectIds || (subjectId ? [subjectId] : []),
    subjectId,
    chapterName,
    chapterId,
    date,
    scheduleType: scheduleType || 'weekly',
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
  const timetables = await Timetable.find({}).sort({ weekNumber: 1, createdAt: -1 });
  res.json(timetables);
});

// @desc    Get Timetables for a specific Course
// @route   GET /api/timetables/course/:courseId
// @access  Student / Admin
export const getTimetablesByCourse = asyncHandler(async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const timetables = await Timetable.find({
    $or: [
      { courseId: courseId },
      { planId: courseId },
      { examId: courseId }
    ]
  }).sort({ weekNumber: 1, createdAt: 1 });
  
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
