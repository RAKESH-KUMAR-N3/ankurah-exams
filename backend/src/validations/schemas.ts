import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware factory — wraps a Joi schema into a request body validator.
 * Usage: router.post('/route', validate(schema), controller)
 */
export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      res.status(400).json({
        message: 'Validation failed',
        details: error.details.map((d) => d.message),
      });
      return;
    }
    next();
  };
};

// ─── Auth ────────────────────────────────────────────────────────────────────
export const registerSchema = Joi.object({
  name: Joi.string().min(2).max(60).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  phone: Joi.string().allow('', null).optional(),
  role: Joi.string().valid('admin', 'student'),
  category: Joi.string().allow('', null).optional(),
  exams: Joi.array().items(Joi.string()).optional(),
  studentType: Joi.string().allow('', null).optional(),
  plan: Joi.string().allow('', null).optional(),
}).unknown(true);

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
}).unknown(true);

// ─── Category ────────────────────────────────────────────────────────────────
export const categorySchema = Joi.object({
  name: Joi.string().valid('Entrance Exams', 'Competitive Exams').required(),
}).unknown(true);

// ─── Exam ─────────────────────────────────────────────────────────────────────
export const examSchema = Joi.object({
  id: Joi.string().required(),
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().allow('', null).optional(),
  type: Joi.string().valid('entrance', 'competitive').required(),
  price: Joi.alternatives().try(Joi.string(), Joi.number()).allow('', null).optional(),
  allowedStudentTypes: Joi.array().items(Joi.string()).optional(),
  categoryId: Joi.string().optional(),
}).unknown(true);

// ─── StudentType ──────────────────────────────────────────────────────────────
export const studentTypeSchema = Joi.object({
  name: Joi.string().min(2).max(60).required(),
}).unknown(true);

// ─── Subject ──────────────────────────────────────────────────────────────────
export const subjectSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  examId: Joi.string().allow(null, '').optional(),
  subjectCategory: Joi.string().valid('entrance', 'competitive').optional(),
  applicableFor: Joi.array().items(Joi.string()).optional(),
}).unknown(true);

// ─── Chapter ──────────────────────────────────────────────────────────────────
export const chapterSchema = Joi.object({
  title: Joi.string().min(2).max(200).required(),
  subjectId: Joi.string().required(),
}).unknown(true);

// ─── StudyMaterial ────────────────────────────────────────────────────────────
export const studyMaterialSchema = Joi.object({
  categoryId: Joi.string().optional(),
  examId: Joi.string().allow('', null).optional(),
  studentTypeId: Joi.string().allow('', null).optional(),
  subjectId: Joi.string().required(),
  chapterId: Joi.string().allow('', null).optional(),
  title: Joi.string().min(2).max(200).required(),
  type: Joi.string().valid('PDF', 'Notes', 'External Link', 'Video URL').required(),
  url: Joi.string().required(),
}).unknown(true);

// ─── Timetable ────────────────────────────────────────────────────────────────
export const timetableSchema = Joi.object({
  categoryId: Joi.string().optional(),
  examId: Joi.string().optional(),
  studentTypeId: Joi.string().optional(),
  subjectId: Joi.string().required(),
  chapterId: Joi.string().allow('', null).optional(),
  date: Joi.date().required(),
  startTime: Joi.string().required(),
  endTime: Joi.string().required(),
  studyTopic: Joi.string().min(2).required(),
  revision: Joi.string().allow('', null).optional(),
  practiceMCQs: Joi.string().allow('', null).optional(),
  assignment: Joi.string().allow('', null).optional(),
}).unknown(true);

// ─── Question ─────────────────────────────────────────────────────────────────
export const questionSchema = Joi.object({
  categoryId: Joi.string().optional(),
  subjectId: Joi.string().required(),
  chapterId: Joi.string().allow('', null).optional(),
  content: Joi.string().min(2).required(),
  options: Joi.array().items(Joi.string()).min(2).required(),
  correctAnswer: Joi.string().required(),
  explanation: Joi.string().allow('', null).optional(),
  difficulty: Joi.string().valid('Easy', 'Medium', 'Hard', 'easy', 'medium', 'hard').optional(),
  marks: Joi.number().min(0).optional(),
  negativeMarks: Joi.number().min(0).optional(),
}).unknown(true);

// ─── Test ─────────────────────────────────────────────────────────────────────
export const testSchema = Joi.object({
  title: Joi.string().min(2).max(200).required(),
  categoryId: Joi.string().optional(),
  examIds: Joi.alternatives().try(
    Joi.array().items(Joi.string()),
    Joi.string()
  ).optional(),
  studentTypeId: Joi.string().optional(),
  subjectId: Joi.string().allow('', null).optional(),
  chapterId: Joi.string().allow('', null).optional(),
  testType: Joi.string().valid('Chapter', 'Grand', 'Weekly', 'Monthly', 'Practice').required(),
  isDynamic: Joi.boolean().optional(),
  dynamicTotalQuestions: Joi.number().min(1).optional(),
  targetDifficulty: Joi.string().valid('Easy', 'Medium', 'Hard', 'Mixed').optional(),
  questions: Joi.array().items(Joi.string()).optional(),
  duration: Joi.number().min(1).required(),
  marksPerQuestion: Joi.number().min(0).optional(),
  negativeMarksPerQuestion: Joi.number().min(0).optional(),
  retakeLimit: Joi.number().min(0).optional(),
  isFullSyllabus: Joi.boolean().optional(),
  instructions: Joi.string().allow('', null).optional(),
  status: Joi.string().valid('Draft', 'Published').optional(),
}).unknown(true);

// ─── Notification ─────────────────────────────────────────────────────────────
export const notificationSchema = Joi.object({
  title: Joi.string().min(2).max(200).required(),
  message: Joi.string().min(5).required(),
  targetAudience: Joi.string().valid('All', 'Exam', 'StudentType').required(),
  examId: Joi.string().when('targetAudience', { is: 'Exam', then: Joi.required() }),
  studentTypeId: Joi.string().when('targetAudience', { is: 'StudentType', then: Joi.required() }),
  status: Joi.string().valid('Draft', 'Published'),
}).unknown(true);

// ─── Student Profile ──────────────────────────────────────────────────────────
export const studentProfileUpdateSchema = Joi.object({
  category: Joi.string().required(),
  exams: Joi.array().items(Joi.string()).min(1).required(),
  studentType: Joi.string().optional().allow(null, ''),
}).unknown(true);

// ─── Test Attempt ─────────────────────────────────────────────────────────────
export const testAttemptSaveSchema = Joi.object({
  responses: Joi.array().items(
    Joi.object({
      questionId: Joi.string().required(),
      selectedOption: Joi.string().allow(null, '').optional(),
    })
  ).required(),
  timeTakenSeconds: Joi.number().min(0).optional(),
}).unknown(true);

// ─── Doubt ────────────────────────────────────────────────────────────────────
export const doubtSchema = Joi.object({
  testId: Joi.string().optional(),
  testAttemptId: Joi.string().optional(),
  questionId: Joi.string().required(),
  content: Joi.string().min(5).required(),
}).unknown(true);

export const doubtReplySchema = Joi.object({
  adminReply: Joi.string().min(1).required(),
}).unknown(true);
