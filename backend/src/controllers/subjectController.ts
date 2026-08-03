import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Subject from '../models/Subject';
import CompetitiveSubject from '../models/CompetitiveSubject';
import mongoose from 'mongoose';

// @desc    Create a Subject (Single or Bulk)
// @route   POST /api/subjects
// @access  Admin
export const createSubject = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, names, state, examId, examIds, subjectCategory, applicableFor } = req.body;

    const selectedCourseId = examId || (Array.isArray(examIds) && examIds.length > 0 ? examIds[0] : undefined);
    const courseIdArray = Array.isArray(examIds) && examIds.length > 0 
      ? examIds.map(String) 
      : (selectedCourseId ? [String(selectedCourseId)] : []);

    const validApplicable = Array.isArray(applicableFor) 
      ? applicableFor.filter(id => mongoose.Types.ObjectId.isValid(id)) 
      : [];

    const isCompetitive = subjectCategory === 'competitive';

    let createdItems = [];

    if (Array.isArray(names) && names.length > 0) {
      const cleanNames = names.map((n: string) => n.trim()).filter(Boolean);
      if (cleanNames.length === 0) {
        res.status(400).json({ message: 'At least one valid subject name is required' });
        return;
      }

      if (isCompetitive) {
        const docs = cleanNames.map(n => ({ 
          name: n, 
          subjectCategory: 'competitive', 
          examId: selectedCourseId,
          examIds: courseIdArray
        }));
        createdItems = await CompetitiveSubject.insertMany(docs);
      } else {
        const docs = cleanNames.map(n => ({ 
          name: n, 
          state: state || 'Both', 
          subjectCategory: 'entrance', 
          applicableFor: validApplicable, 
          examId: selectedCourseId,
          examIds: courseIdArray
        }));
        createdItems = await Subject.insertMany(docs);
      }
      res.status(201).json(createdItems);
      return;
    }

    if (!name || !name.trim()) {
      res.status(400).json({ message: 'Subject name is required' });
      return;
    }

    const cleanName = name.trim();

    if (isCompetitive) {
      const compSubject = await CompetitiveSubject.create({
        name: cleanName,
        subjectCategory: 'competitive',
        examId: selectedCourseId,
        examIds: courseIdArray
      });
      res.status(201).json(compSubject);
      return;
    } else {
      const subject = await Subject.create({
        name: cleanName,
        state: state || 'Both',
        subjectCategory: 'entrance',
        applicableFor: validApplicable,
        examId: selectedCourseId,
        examIds: courseIdArray
      });
      res.status(201).json(subject);
      return;
    }
  } catch (error: any) {
    console.error("Error in createSubject:", error);
    res.status(400).json({ message: error.message || 'Error creating subject' });
    return;
  }
});

// @desc    Get all Subjects (Entrance + Competitive)
// @route   GET /api/subjects
// @access  Admin
export const getSubjects = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const entranceSubjects = await Subject.find({}).sort({ createdAt: -1 });
  const compSubjects = await CompetitiveSubject.find({}).sort({ createdAt: -1 });
  res.json([...entranceSubjects, ...compSubjects]);
});

// @desc    Update a Subject
// @route   PUT /api/subjects/:id
// @access  Admin
export const updateSubject = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const isObjectId = mongoose.Types.ObjectId.isValid(id);

  const { name, state, examId, examIds, subjectCategory } = req.body;
  const selectedCourseId = examId || (Array.isArray(examIds) && examIds.length > 0 ? examIds[0] : undefined);
  const courseIdArray = Array.isArray(examIds) && examIds.length > 0 
    ? examIds.map(String) 
    : (selectedCourseId ? [String(selectedCourseId)] : []);

  if (isObjectId) {
    let compSub = await CompetitiveSubject.findById(id);
    if (compSub) {
      if (name) compSub.name = name.trim();
      if (selectedCourseId) compSub.examId = selectedCourseId;
      if (courseIdArray.length > 0) compSub.examIds = courseIdArray;
      const updatedComp = await compSub.save();
      res.json(updatedComp);
      return;
    }

    let subject = await Subject.findById(id);
    if (subject) {
      if (name) subject.name = name.trim();
      if (state) subject.state = state;
      if (subjectCategory) subject.subjectCategory = subjectCategory;
      if (selectedCourseId) subject.examId = selectedCourseId;
      if (courseIdArray.length > 0) subject.examIds = courseIdArray;
      const updatedSubject = await subject.save();
      res.json(updatedSubject);
      return;
    }
  }

  res.status(404);
  throw new Error('Subject not found');
});

// @desc    Delete a Subject
// @route   DELETE /api/subjects/:id
// @access  Admin
export const deleteSubject = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const isObjectId = mongoose.Types.ObjectId.isValid(id);

  if (isObjectId) {
    let compSub = await CompetitiveSubject.findById(id);
    if (compSub) {
      await CompetitiveSubject.deleteOne({ _id: compSub._id });
      res.json({ message: 'Competitive Subject removed' });
      return;
    }

    let subject = await Subject.findById(id);
    if (subject) {
      await Subject.deleteOne({ _id: subject._id });
      res.json({ message: 'Subject removed' });
      return;
    }
  }

  // String ID fallback
  const delRes1 = await Subject.deleteOne({ _id: id });
  if (delRes1.deletedCount > 0) {
    res.json({ message: 'Subject removed' });
    return;
  }

  const delRes2 = await CompetitiveSubject.deleteOne({ _id: id });
  if (delRes2.deletedCount > 0) {
    res.json({ message: 'Competitive Subject removed' });
    return;
  }

  res.status(404);
  throw new Error('Subject not found');
});
