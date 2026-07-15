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
  role: Joi.string().valid('admin', 'student'),
  category: Joi.string(),
  exams: Joi.array().items(Joi.string()),
  studentType: Joi.string(),
  plan: Joi.string(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// ─── Category ────────────────────────────────────────────────────────────────
export const categorySchema = Joi.object({
  name: Joi.string().valid('Entrance Exams', 'Competitive Exams').required(),
});

// ─── Exam ─────────────────────────────────────────────────────────────────────
export const examSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  categoryId: Joi.string().required(),
});

// ─── StudentType ──────────────────────────────────────────────────────────────
export const studentTypeSchema = Joi.object({
  name: Joi.string().min(2).max(60).required(),
});

// ─── Subject ──────────────────────────────────────────────────────────────────
export const subjectSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  examId: Joi.string().required(),
  applicableFor: Joi.array().items(Joi.string()), // Array of StudentType ObjectIds
});

// ─── Chapter ──────────────────────────────────────────────────────────────────
export const chapterSchema = Joi.object({
  title: Joi.string().min(2).max(200).required(),
  subjectId: Joi.string().required(),
});

// ─── StudyMaterial ────────────────────────────────────────────────────────────
export const studyMaterialSchema = Joi.object({
  categoryId: Joi.string().required(),
  examId: Joi.string().required(),
  studentTypeId: Joi.string(),
  subjectId: Joi.string().required(),
  chapterId: Joi.string().required(),
  title: Joi.string().min(2).max(200).required(),
  type: Joi.string().valid('PDF', 'Notes', 'External Link', 'Video URL').required(),
  url: Joi.string().uri().required(),
});

// ─── Timetable ────────────────────────────────────────────────────────────────
export const timetableSchema = Joi.object({
  categoryId: Joi.string().required(),
  examId: Joi.string().required(),
  studentTypeId: Joi.string(),
  subjectId: Joi.string().required(),
  chapterId: Joi.string().required(),
  date: Joi.date().required(),
  startTime: Joi.string().required(),
  endTime: Joi.string().required(),
  studyTopic: Joi.string().min(2).required(),
  revision: Joi.string(),
  practiceMCQs: Joi.string(),
  assignment: Joi.string(),
});

// ─── Question ─────────────────────────────────────────────────────────────────
export const questionSchema = Joi.object({
  categoryId: Joi.string().required(),
  examId: Joi.string().required(),
  subjectId: Joi.string().required(),
  chapterId: Joi.string().required(),
  content: Joi.string().min(5).required(),
  options: Joi.array().items(Joi.string()).min(2).required(),
  correctAnswer: Joi.string().required(),
  explanation: Joi.string(),
  difficulty: Joi.string().valid('Easy', 'Medium', 'Hard'),
  marks: Joi.number().min(0).required(),
  negativeMarks: Joi.number().min(0).required(),
});

// ─── Test ─────────────────────────────────────────────────────────────────────
export const testSchema = Joi.object({
  title: Joi.string().min(2).max(200).required(),
  categoryId: Joi.string().required(),
  examId: Joi.string().required(),
  studentTypeId: Joi.string(),
  subjectId: Joi.string(),
  chapterId: Joi.string(),
  testType: Joi.string().valid('Weekly', 'Monthly', 'Practice').required(),
  questions: Joi.array().items(Joi.string()),
  duration: Joi.number().min(1).required(),
  totalMarks: Joi.number().min(1).required(),
  instructions: Joi.string(),
  negativeMarking: Joi.boolean(),
  status: Joi.string().valid('Draft', 'Published'),
});

// ─── Notification ─────────────────────────────────────────────────────────────
export const notificationSchema = Joi.object({
  title: Joi.string().min(2).max(200).required(),
  message: Joi.string().min(5).required(),
  targetAudience: Joi.string().valid('All', 'Exam', 'StudentType').required(),
  examId: Joi.string().when('targetAudience', { is: 'Exam', then: Joi.required() }),
  studentTypeId: Joi.string().when('targetAudience', { is: 'StudentType', then: Joi.required() }),
  status: Joi.string().valid('Draft', 'Published'),
});

// ─── Student Profile ──────────────────────────────────────────────────────────
export const studentProfileUpdateSchema = Joi.object({
  category: Joi.string().required(),
  exams: Joi.array().items(Joi.string()).min(1).required(),
  studentType: Joi.string().optional().allow(null, ''),
});

// ─── Test Attempt ─────────────────────────────────────────────────────────────
export const testAttemptSaveSchema = Joi.object({
  responses: Joi.array().items(
    Joi.object({
      questionId: Joi.string().required(),
      selectedOption: Joi.string().allow(null, '').optional(),
    })
  ).required(),
});
