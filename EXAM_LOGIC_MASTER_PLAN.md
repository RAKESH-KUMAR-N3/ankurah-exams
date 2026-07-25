# Master Implementation Plan: Tests & Question Bank

Based on our discussions, here is the complete, detailed architecture for managing the Question Bank, Exam System, and Student Experience in Ankurah Exams.

## 1. Database Schema Changes (Backend)

### A. Question Model (`backend/src/models/Question.ts`)
- `subjectId` & `chapterId`
- `difficulty`: Enum ['Easy', 'Medium', 'Hard']
- *Note:* We will REMOVE the `marks` and `negativeMarks` fields from individual questions, as marks are decided globally during Test Creation.

### B. Test Model (`backend/src/models/Test.ts`)
- **`examIds`**: Array of Target Groups (e.g., allows assigning the same test to BOTH EAPCET Long Term and Crash Course simultaneously).
- `duration`: Number (Time limit in minutes)
- `marksPerQuestion`: Number (e.g., 4)
- `negativeMarksPerQuestion`: Number (e.g., 1)
- `retakeLimit`: Number (0 for unlimited, or e.g. 2 for max 2 retakes).
- `isFullSyllabus`: Boolean (True for Mock/Grand tests, False for Chapter tests)
- `status`: Enum ['Draft', 'Published'] (Controls visibility to students)

**For Chapter Tests (Dynamic):**
- `subjectId` & `chapterId`, `dynamicTotalQuestions`
- `targetDifficulty`: Enum ['Easy', 'Medium', 'Hard', 'Mixed']

### C. Doubt Model
- `studentId`, `questionId`, `testId`, `status`, `adminReply`

## 2. Admin UI: 'Create Tests' Tab

### Creating & Assigning Tests
- **Multi-select Groups:** Checkboxes to assign the test to multiple courses instantly.
- **Dynamic Tests:** Input Time Limit, Retake Limit, Global Marks, Subject, Chapter, Difficulty Level, and Total Questions.
- **Grand Tests:** Input Time Limit, Retake Limit, Global Marks, and upload the CSV File.

### Test Management
- **Edit Test:** Admin can change Time Limit, Retake Limit, Marks, or re-upload CSV anytime.
- **Publish Toggle:** Switch to change the status between 'Draft' and 'Published'.

## 3. Student Panel & Anti-Cheat Logic

### A. Strict Proctoring / Tab Lock System
- Forced into **Full Screen** mode on start.
- **1st Offense (Switching tabs):** Warning overlay "Please return to Full Screen mode".
- **2nd Offense:** Exam **automatically submits**. 
- *Note:* NO "Resume Exam". Exam must be completed in one sitting.

### B. Exam Execution & Visibility
- Strict countdown timer. Auto-submits when time is up.
- **Retake System:** In the Exam UI, if not attempted, show **"Start Exam"**. If attempted (and limit not crossed), show **"Re-attempt" / "Re-test"**. For dynamic tests, every re-attempt brings a fresh random set of questions!

## 4. Leaderboard & Analytics

### A. Leaderboard System
- **For Students:** The **Leaderboard** will be placed directly on the main **Student Dashboard** so they can immediately see their rank compared to others.
- **For Admin:** Admin dashboard will show top-performing students per test.

### B. Raise a Doubt
- While reviewing their scorecard, a student can click a **"Raise a Doubt"** button on any question.
- The Admin can view the doubt and reply directly.

*(Note: Timetable features are deferred for future discussion).*
