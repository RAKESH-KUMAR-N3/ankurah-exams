export type UserRole = 'student' | 'admin';

export interface User {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  selectedEntranceExams?: string[];
  selectedCompetitiveExams?: string[];
  studentType?: 'first_year' | 'second_year' | 'long_term' | '';
  studyPlan?: 'quarterly' | 'half_yearly' | 'academic_year' | 'yearly' | '';
  purchasedPlans?: {
    planId: string;
    examId: string;
    purchasedAt: string;
    isActive: boolean;
  }[];
  streak?: number;
  lastActiveDate?: string;
  createdAt: string;
}

export interface Plan {
  _id: string;
  examId: string | any;
  name: string;
  price: number;
  description: string;
  isActive: boolean;
}

export interface Doubt {
  _id: string;
  studentId: string;
  examId?: string;
  chapterId?: string;
  questionId?: string;
  content: string;
  status: 'open' | 'answered' | 'closed';
  answer?: string;
  answeredBy?: string;
  answeredAt?: string;
  createdAt: string;
}

export interface EntranceExam {
  id: string;
  _id?: string;
  categoryId?: string;
  name: string;
  description: string;
}

export interface CompetitiveExam {
  id: string;
  _id?: string;
  categoryId?: string;
  name: string;
  description: string;
}

export interface Subject {
  id: string;
  name: string;
  examIds: string[]; // Can map to multiple exams
  description: string;
}

export interface Chapter {
  id: string;
  subjectId: string;
  name: string;
  description: string;
}

export interface Timetable {
  id: string;
  examId: string;
  studentType: string; // 'first_year' | 'second_year' | 'long_term' | ''
  studyPlan: string;   // 'quarterly' | 'half_yearly' | 'academic_year' | 'yearly' | ''
  subjectId: string;
  chapterId: string;
  date: string;        // YYYY-MM-DD
  title: string;
  studyTopic: string;
  practiceMCQsCount: number;
  revisionTopic: string;
  assignment?: string;
}

export interface StudyMaterial {
  id: string;
  examId: string;
  subjectId: string;
  chapterId: string;
  type: 'pdf' | 'notes' | 'link' | 'video';
  title: string;
  url: string;
  description: string;
}

export interface Question {
  id: string;
  subjectId: string;
  chapterId: string;
  questionText: string;
  options: string[]; // Exactly 4 options
  correctAnswerIndex: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
  negativeMarks: number;
  tags?: string[];
}

export interface Test {
  id: string;
  title: string;
  description: string;
  type: 'weekly' | 'monthly' | 'practice';
  duration: number; // in minutes
  totalMarks: number;
  negativeMarking: boolean;
  isFullSyllabus: boolean;
  subjectId?: string; // Optional if full syllabus
  chapterId?: string; // Optional if subject-wise or full syllabus
  examId?: any; // To link test with a specific exam
  questionIds: string[];
  createdAt: string;
}

export interface TestAttempt {
  id: string;
  userId: string;
  testId: string;
  answers: Record<string, number>; // Question ID -> selected option index (0-3), -1 for unattempted
  score: number;
  percentage: number;
  accuracy: number;
  correctCount: number;
  wrongCount: number;
  unattemptedCount: number;
  timeTakenSeconds: number;
  submittedAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  targetExams?: string[]; // IDs of exams this announcement targets. Empty means all.
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}
