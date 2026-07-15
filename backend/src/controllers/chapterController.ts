import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Chapter from '../models/Chapter';

// @desc    Create a Chapter
// @route   POST /api/chapters
// @access  Admin
export const createChapter = asyncHandler(async (req: Request, res: Response) => {
  const { title, subjectId } = req.body;
  const chapter = await Chapter.create({ title, subjectId });
  res.status(201).json(chapter);
});

// @desc    Get all Chapters
// @route   GET /api/chapters
// @access  Admin
export const getChapters = asyncHandler(async (req: Request, res: Response) => {
  const chapters = await Chapter.find({}).populate('subjectId');
  res.json(chapters);
});

// @desc    Update a Chapter
// @route   PUT /api/chapters/:id
// @access  Admin
export const updateChapter = asyncHandler(async (req: Request, res: Response) => {
  const { title, subjectId } = req.body;
  const chapter = await Chapter.findById(req.params.id);
  if (chapter) {
    chapter.title = title || chapter.title;
    chapter.subjectId = subjectId || chapter.subjectId;
    const updatedChapter = await chapter.save();
    res.json(updatedChapter);
  } else {
    res.status(404);
    throw new Error('Chapter not found');
  }
});

// @desc    Delete a Chapter
// @route   DELETE /api/chapters/:id
// @access  Admin
export const deleteChapter = asyncHandler(async (req: Request, res: Response) => {
  const chapter = await Chapter.findById(req.params.id);
  if (chapter) {
    await Chapter.deleteOne({ _id: chapter._id });
    res.json({ message: 'Chapter removed' });
  } else {
    res.status(404);
    throw new Error('Chapter not found');
  }
});
