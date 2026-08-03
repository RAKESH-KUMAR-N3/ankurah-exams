export type UserRole = 'student' | 'admin';

export interface StudentType {
  id: string;
  name: string;
  state?: 'AP' | 'TG';
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  state?: 'AP' | 'TG' | 'Both';
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
  studentId: string | { name: string; email: string };
  testId?: string | { title: string; testType: string };
  testAttemptId?: string;
  questionId?: string | { content: string; options: string[]; correctAnswer: string };
  content: string;
  status: 'open' | 'answered' | 'closed';
  adminReply?: string;
  repliedBy?: string;
  repliedAt?: string;
  createdAt: string;
}

export interface EntranceExam {
  id: string;
  _id?: string;
  categoryId?: string;
  name: string;
  description: string;
  state?: 'AP' | 'TG' | 'Both';
  allowedStudentTypes?: any[];
  subjects?: any[];
}

export interface CompetitiveExam {
  id: string;
  _id?: string;
  categoryId?: string;
  name: string;
  description: string;
  state?: 'AP' | 'TG' | 'Both';
  allowedStudentTypes?: any[];
  subjects?: any[];
}

export interface StudyMaterial {
  id: string;
  title: string;
  subjectId: string;
  chapterId?: string;
  examId?: string;
  type: 'pdf' | 'video' | 'link' | 'note' | 'notes';
  url?: string;
  content?: string;
  description?: string;
  createdAt?: string;
}

export interface Subject {
  id: string;
  name: string;
  subjectCategory?: 'entrance' | 'competitive'; // entrance or competitive
  examIds: string[]; // Can map to multiple exams
  applicableFor?: string[];
  description: string;
}

export interface Chapter {
  id: string;
  subjectId: string;
  name: string;
  description: string;
}

export interface TimetableWeeklyChapter {
  subjectId: string;
  subjectName: string;
  chapterId: string;
  chapterName: string;
}

export interface Timetable {
  id: string;
  _id?: string;
  courseId?: string;
  courseName?: string;
  weekTitle?: string;
  weekNumber?: number;
  startDate?: string;
  endDate?: string;
  weeklyChapters?: TimetableWeeklyChapter[];
  weekendExamId?: string;
  weekendExamTitle?: string;
  status?: 'published' | 'draft';
  planId?: string;
  examId?: string;
  studentType?: string;
  studyPlan?: string;
  subjectId?: string;
  subjectIds?: string[];
  chapterId?: string;
  chapterName?: string;
  date?: string;        // YYYY-MM-DD
  scheduleType?: string; // 'daily' | 'weekly'
  dayOfWeek?: string;   // 'Monday', 'Tuesday', etc.
  title?: string;
  studyTopic?: string;
  imageUrl?: string;    // Base64 or URL of uploaded timetable image
  practiceMCQsCount?: number;
  revisionTopic?: string;
  assignment?: string;
  createdAt?: string;
}

export interface Topic {
  _id?: string;
  id?: string;
  chapterId: string;
  title: string;
  order?: number;
}

export interface Question {
  _id?: string;
  id?: string;
  categoryId?: string;
  subjectId: string;
  chapterId: string;
  content: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  // marks/negativeMarks are optional - now managed at Test level
  marks?: number;
  negativeMarks?: number;
}

export interface ChapterWeightageConfig {
  chapterId: string | any;
  questionCount: number;
}

export interface SubjectWeightageConfig {
  subjectId: string | any;
  chapters: ChapterWeightageConfig[];
  totalQuestions?: number;
}

export interface Test {
  _id?: string;
  id?: string;
  title: string;
  categoryId?: string;
  examIds?: string[] | any[];         // Multi-batch assignment
  studentTypeIds?: string[] | any[];  // Multi-group assignment
  testType: 'Chapter' | 'Grand' | 'Weekly' | 'Monthly' | 'Practice';
  isDynamic?: boolean;
  subjectId?: string | any;
  chapterId?: string | any;
  dynamicTotalQuestions?: number;
  targetDifficulty?: 'Easy' | 'Medium' | 'Hard' | 'Mixed';
  subjectConfigs?: SubjectWeightageConfig[];
  questions?: string[];
  duration: number;                   // in minutes
  marksPerQuestion?: number;          // default 4
  negativeMarksPerQuestion?: number;  // default 1
  retakeLimit?: number;               // 0 = unlimited
  isFullSyllabus?: boolean;
  status?: 'Draft' | 'Published';
  instructions?: string;
  createdAt?: string;
}

export interface TestAttempt {
  _id?: string;
  id?: string;
  studentId?: string;
  testId: string | any;
  attemptNumber?: number;
  score: number;
  totalMarks?: number;
  responses: {
    questionId: string | any;
    selectedOption?: string | null;
    isCorrect?: boolean | null;
  }[];
  status: 'In-Progress' | 'Completed' | 'Force-Submitted';
  tabSwitchCount?: number;
  autoSubmitted?: boolean;
  timeTakenSeconds?: number;
  submittedAt?: string;
  createdAt?: string;
}

export interface LeaderboardEntry {
  rank: number;
  studentId: string;
  name: string;
  totalScore: number;
  totalMarks: number;
  attemptCount: number;
  percentage: number;
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
