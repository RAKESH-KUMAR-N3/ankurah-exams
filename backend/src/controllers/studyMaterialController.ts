import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import StudyMaterial from '../models/StudyMaterial';

// @desc    Create a StudyMaterial
// @route   POST /api/study-materials
// @access  Admin
export const createStudyMaterial = asyncHandler(async (req: Request, res: Response) => {
  const { categoryId, examId, studentTypeId, subjectId, chapterId, title, type, url } = req.body;
  const studyMaterial = await StudyMaterial.create({
    categoryId, examId, studentTypeId, subjectId, chapterId, title, type, url
  });
  res.status(201).json(studyMaterial);
});

// @desc    Get all StudyMaterials
// @route   GET /api/study-materials
// @access  Admin
export const getStudyMaterials = asyncHandler(async (req: Request, res: Response) => {
  const materials = await StudyMaterial.find({})
    .populate('categoryId examId studentTypeId subjectId chapterId');
  res.json(materials);
});

// @desc    Update a StudyMaterial
// @route   PUT /api/study-materials/:id
// @access  Admin
export const updateStudyMaterial = asyncHandler(async (req: Request, res: Response) => {
  const { categoryId, examId, studentTypeId, subjectId, chapterId, title, type, url } = req.body;
  const material = await StudyMaterial.findById(req.params.id);
  if (material) {
    material.categoryId = categoryId || material.categoryId;
    material.examId = examId || material.examId;
    material.studentTypeId = studentTypeId || material.studentTypeId;
    material.subjectId = subjectId || material.subjectId;
    material.chapterId = chapterId || material.chapterId;
    material.title = title || material.title;
    material.type = type || material.type;
    material.url = url || material.url;
    
    const updatedMaterial = await material.save();
    res.json(updatedMaterial);
  } else {
    res.status(404);
    throw new Error('StudyMaterial not found');
  }
});

// @desc    Delete a StudyMaterial
// @route   DELETE /api/study-materials/:id
// @access  Admin
export const deleteStudyMaterial = asyncHandler(async (req: Request, res: Response) => {
  const material = await StudyMaterial.findById(req.params.id);
  if (material) {
    await StudyMaterial.deleteOne({ _id: material._id });
    res.json({ message: 'StudyMaterial removed' });
  } else {
    res.status(404);
    throw new Error('StudyMaterial not found');
  }
});
