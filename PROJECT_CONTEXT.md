# PROJECT_CONTEXT.md
# Ankurah Exams — Exam Preparation Platform

---

## 1. Project Overview

A production-ready MERN Stack Exam Preparation Platform for students preparing for Entrance and Competitive exams.

- **Stack:** Node.js + Express + TypeScript + MongoDB (Mongoose) + React (Vite) + Firebase Auth (frontend only)
- **Roles:** Exactly 2 — `admin` and `student`. No other roles exist.
- **Plan:** Only one plan — **Yearly Plan**. No monthly, quarterly, or half-yearly plans.
- **Backend Port:** `5000`
- **Backend location:** `d:/MY-WORKS/Ankurah-Exams/backend/`
- **Frontend location:** `d:/MY-WORKS/Ankurah-Exams/frontend/`
- **Dev command:** `npm run dev` from root (runs both concurrently)

---

## 2. Current Architecture

### Backend — Express MVC

```
backend/src/
├── config/          → DB connection (connectDB)
├── controllers/     → Request handlers per module
├── middlewares/     → JWT auth (protect), RBAC (authorize), error handlers
├── models/          → Mongoose schemas (Indexed)
├── routes/          → Express route definitions
├── services/        → Business logic and reusable query layers
├── utils/           → generateToken (JWT)
├── validations/     → Centralized Joi schemas + validate() middleware factory
└── index.ts         → Express app entry point
```

### Frontend — React + Vite + TypeScript
- React Router DOM for routing (`/`, `/login`, `/register`, `/dashboard`)
- Firebase Authentication (client-side auth for current UI)
- Landing Page, Auth Page, Dashboard Shell
- Admin Dashboard and Student Dashboard (role-based rendering)

### Database
- **MongoDB Atlas** — cloud hosted
- Connection via `MONGO_URI` in `.env`

---

## 3. Completed Modules

### Backend (Admin Core)
- ✅ Express server setup with CORS, JSON middleware
- ✅ MongoDB connection via Mongoose
- ✅ JWT-based authentication (register, login)
- ✅ Role-based access control middleware
- ✅ Global error handler middleware (404 + general errors)
- ✅ Admin CRUD APIs for all 11 academic modules
- ✅ Centralized Joi validation layer for all routes
- ✅ TypeScript — compiles with zero errors

### Backend (Student Engine)
- ✅ Student profile completion (select category, exams, student type)
- ✅ Student dashboard data endpoints (fetch my exams, subjects, chapters)
- ✅ Study material retrieval (filtered by student's exam + student type)
- ✅ Timetable retrieval (filtered by student's exam + student type)
- ✅ Test attempt — start test, save attempt, submit answers, auto-score
- ✅ Results — view test attempt results and scores
- ✅ Performance analytics — accuracy per chapter, overall progress
- ✅ Published notifications retrieval for students

### Backend (Final Production Pass)
- ✅ Admin Dashboard Summary API
- ✅ Student Dashboard Summary API
- ✅ Reports & Analytics Engine
- ✅ Student Management APIs (List, Profile, Activate, Deactivate)
- ✅ Bulk Import APIs via CSV (Questions, Materials)
- ✅ Filtering, Pagination, and Search engine via `paginationService.ts`
- ✅ Dynamic MongoDB Querying across GET APIs

### Frontend
- ✅ Landing Page with header, footer, navigation
- ✅ Login and Register pages with React Router
- ✅ Auth form with eye icon password toggle
- ✅ Dashboard Shell (role-based: Admin or Student view)
- ✅ React Router setup (`BrowserRouter` in `main.tsx`)

---

## 4. Database Models Created

| Model | Key Fields |
|---|---|
| `User` | `name, email, password, role (admin/student), category (ref), exams ([ref]), studentType (ref), plan, isActive` |
| `Category` | `name (Entrance Exams / Competitive Exams)` |
| `Exam` | `name, categoryId (ref: Category)` |
| `StudentType` | `name` — dynamic, Admin-managed (e.g. Inter 1st Year, Inter 2nd Year, Long Term) |
| `Subject` | `name, examId (ref: Exam), applicableFor ([ref: StudentType])` |
| `Chapter` | `title, subjectId (ref: Subject)` |
| `StudyMaterial` | `categoryId, examId, studentTypeId (optional), subjectId, chapterId, title, type, url` |
| `Timetable` | `categoryId, examId, studentTypeId (optional), subjectId, chapterId, date, startTime, endTime, studyTopic, revision, practiceMCQs, assignment` |
| `Question` | `categoryId, examId, subjectId, chapterId, content, options[], correctAnswer, explanation, difficulty, marks, negativeMarks` |
| `Test` | `title, categoryId, examId, studentTypeId (optional), subjectId, chapterId, testType, questions ([ref]), duration, totalMarks, instructions, negativeMarking, status` |
| `TestAttempt` | `studentId, testId, score, responses[{questionId, selectedOption, isCorrect}]` |
| `PerformanceMetric` | `studentId, examId, overallAccuracy, chapterWiseStats[{chapterId, accuracy, attemptedCount}]` |
| `Notification` | `title, message, targetAudience, examId, studentTypeId, status` |

---

## 5. API Routes Created

*(New Routes Added)*
| Method | Route | Access | Purpose |
|---|---|---|---|
| GET/PUT | `/api/students/profile` | Student | Read/Update profile |
| GET | `/api/students/subjects` | Student | My subjects |
| GET | `/api/students/chapters` | Student | My chapters |
| GET | `/api/students/materials` | Student | My materials |
| GET | `/api/students/tests` | Student | My tests |
| POST | `/api/test-attempts/start/:id`| Student | Start test |
| PUT | `/api/test-attempts/save/:id` | Student | Save attempt |
| POST | `/api/test-attempts/submit/:id`| Student | Submit test |
| GET | `/api/test-attempts/my` | Student | Attempt history |
| GET | `/api/performance/my` | Student | Performance Analytics |
| GET | `/api/dashboard/admin` | Admin | Overall admin totals |
| GET | `/api/dashboard/student` | Student | Personal dashboard |
| GET | `/api/reports/overall` | Admin | Total analytics |
| GET | `/api/student-management/` | Admin | Manage students |
| POST | `/api/import/questions` | Admin | CSV Bulk Import |
*(And existing Admin CRUD APIs...)*

---

## 6. Business Rules Implemented

1. **Only 2 roles exist:** `admin` and `student`. No faculty, no super admin.
2. **StudentType** applies only to Entrance Exam students.
3. **Student Types are dynamic** — Admin creates/edits/deletes them.
4. **Only one plan** — Yearly. 
5. **Exam hierarchy is strict:** Category → Exam → StudentType (Entrance only) → Subject → Chapter → Material/Timetable/Test.
6. **Subjects can be scoped** to specific StudentTypes via `applicableFor` array.
7. **Tests/Notifications have a status** — `Draft` or `Published`. Students should only see Published tests/notifications.
8. **Admin APIs are protected** with `protect` + `authorize('admin')`.
9. **Joi validation** runs before every controller.

---

## 7. Important Decisions Taken

- **StudentType changed from static enum to dynamic model.** 
- **Firebase Auth is only used on the frontend (current UI).** The backend uses JWT.
- **`paginationService.ts` added** to dynamically handle pagination, searching, and filtering to keep controllers lightweight.
- **`isActive` added** to `User.ts` for student activation.
- **`csv-parser` & `multer`** added for handling bulk CSV imports.

---

## 8. Pending Modules

### Frontend (Future Phase)
- [ ] Connect frontend to backend REST APIs (currently frontend uses Firebase directly)
- [ ] Admin Dashboard UI (Exams, Subjects, Questions, Tests, Import, Reports)
- [ ] Student Dashboard UI (My Subjects, Timetable, Study Materials, Tests)
- [ ] Test-taking interface (Timer, Question Palette, Submit)
- [ ] Results and Performance charts

---

## 9. Things That Should NEVER Be Changed

1. **Role names** — exactly `admin` and `student`.
2. **No new roles** — no faculty, superadmin, moderator.
3. **No new plans** — only `Yearly`.
4. **`StudentType` must remain a DB model**.
5. **The hierarchical data flow** — Category → Exam → StudentType → Subject → Chapter → all child data.
6. **Admin route protection** — `protect` + `authorize('admin')`.
7. **Port is `5000`** for backend.
8. **MongoDB collection names** — auto-pluralized by Mongoose.
