# ANKURAH EXAMS - Project Plan & Discussion Document
Last Updated: 25 Jul 2026

---

## CURRENT ARCHITECTURE

Category (e.g., "Entrance" / "Competitive")
  └── Exam (e.g., "TG EAPCET Engineering", "NDA")
          └── Plan (Fee linked to Exam, e.g. Rs.15000)
                  └── Student buys Plan gets access to:
                          - Subjects + Chapters + Topics (Syllabus Hierarchy)
                          - Tests (linked by examIds[], also shown chapter-wise in Syllabus)
                          - Questions (global, pulled by test config)
                          - (Note: No Study Materials module needed. Students use their own books based on the Topics list)

### WHAT ALREADY WORKS:
1. Multiple Plan Purchase - Student can buy EAPCET + NDA together. purchasedPlans[] array. Both unlock automatically.
2. Exam Attempt -> Evaluation -> Scorecard - Immediate result after submit.
3. Smart Answer Matching - CSV "Option A" resolved to actual option text for scoring.
4. Proctoring - Tab switch tracking + auto-submit on 2nd violation.
5. Leaderboard - Aggregated total score across all attempts.
6. Question Bank Bulk Upload (CSV) - Works.
7. Grand Test Upload (CSV + Test creation in one step) - Works.

---

## IDENTIFIED ISSUES & GAPS

### Issue 1: Competitive Exams - "Eligible Student Groups" should be HIDDEN
Problem: Admin lo Competitive Exam create cheseppudu "Eligible Student Groups" checkboxes chupistundi.
But Competitive Exams (NDA, CLAT, etc.) ki anyone can buy - no restriction needed.
Fix: ExamsAndPlansTab.tsx lo competitive category selected ainapudu student groups section hide cheyali.

### Issue 2: Subjects not linked to Exam
Problem: Admin Subject create cheseppudu which Exam it belongs to - that field is missing.
Student purchases EAPCET plan - which subjects should show? Currently filtered by studentType only.
Fix Options:
  Option A: Subject form lo "For which Exam?" multi-select dropdown add cheyali.
  Option B: Continue with applicableFor (StudentType) but ensure competitive exams have their own studentType or open access.

### Issue 3: Missing Topic Hierarchy & Redundant Study Materials
Current: Only Subjects & Chapters exist. Study Material PDF upload is present but not needed.
Fix: 
  - Remove Study Material functionality completely from Admin & Student panels.
  - Introduce "Topics" under Chapters (e.g., 1.1 What is Physics?).
  - Create a unified "My Syllabus" view for students displaying Subject -> Chapter -> Topic, along with Chapter-wise Tests.

---

## ADMIN SETUP SEQUENCE (Correct Order)

Step 1: Create Category
  - e.g., "Entrance" or "Competitive"

Step 2: Create Exam (under Category)
  - e.g., "TG EAPCET Engineering", "NDA 2026"
  - Entrance: select eligible student types
  - Competitive: leave student types empty (anyone can buy)

Step 3: Create Plan (linked to Exam)
  - Set price (Rs.) + link to exam
  - Students will buy this plan

Step 4: Create Subjects + Chapters + Topics
  - Link subject to exam(s) [NEEDS FIX - currently no exam field in subject form]
  - Add Chapters under each Subject
  - Add Topics (e.g. 1.1, 1.2) under each Chapter

Step 6: Upload Questions (Bulk CSV)
  - Select Subject + Chapter
  - Questions go to global Question Bank

Step 7: Create Tests
  - Mode A (Dynamic): auto-picks random questions by subject/chapter/difficulty
  - Mode B (Grand Test): upload CSV with questions, creates test in one operation
  - Assign test to exam(s) + configure marks/negativemarks/duration/retake limit

Step 8: Publish Test
  - Students see the test in their dashboard under the purchased exam

---

## STUDENT ACCESS FLOW

Student registers
-> Browses available plans
-> Buys Plan(s) - can buy multiple (EAPCET + NDA at same time)
-> Dashboard shows all content from ALL purchased plans in ONE place:
      - "My Syllabus": Interactive tree of Subjects -> Chapters -> Topics for each purchased exam
      - Published Tests assigned to purchased exams (visible in Exams page AND under the specific Chapter in My Syllabus)
      - Leaderboard (rank across all test attempts combined)
-> Attempts Test -> Immediate Scorecard shows score + question review
-> Can raise doubt on any question from scorecard
-> Can re-attempt (based on retakeLimit setting per test)

---

## PENDING FIXES (Priority Order)

1. [HIGH - PENDING]   Hide "Eligible Student Groups" for Competitive Exams in admin UI
2. [MEDIUM - PENDING] Subject form - add Exam linkage field
3. [HIGH - PENDING]   Syllabus Update: Remove Study Materials, Add Topics hierarchy, create "My Syllabus" view.
4. [HIGH - DONE]      0% score bug fix - "Option A" now resolved to actual option text
5. [HIGH - DONE]      Backend TypeScript - 0 errors
6. [HIGH - DONE]      Frontend TypeScript - 0 errors
7. [DONE]             Immediate scorecard after exam submit
8. [DONE]             Multi-exam test assignment (examIds[])
9. [DONE]             Grand Test CSV upload
10. [DONE]            Leaderboard aggregation

---

## OPEN DISCUSSIONS

Q1: Subject - Exam linkage: Option A (add exam field to subject form) vs Option B (keep studentType-based)?
Q2: [RESOLVED] Study Materials module is completely removed. Topics list is sufficient.
Q3: Payments - Real Razorpay integration for production?

---

## KEY FILES

Backend:
  models/Exam.ts              - Exam schema
  models/Plan.ts              - Plan schema (linked to Exam)
  models/User.ts              - purchasedPlans[] array
  models/Test.ts              - Test schema (examIds[], marksPerQuestion)
  services/testEvaluationService.ts - Scoring + Option A to text resolution
  controllers/testAttemptController.ts - Start/Save/Submit/Results APIs

Frontend (admin tabs):
  ExamsAndPlansTab.tsx        - Exam & Plan creation UI
  SubjectsAndChaptersTab.tsx  - Subject/Chapter management
  TestConfiguratorTab.tsx     - Test creation UI
  QuestionBankTab.tsx         - CSV bulk question upload

Frontend (student):
  ExamPage.tsx                - Fullscreen exam engine
  TestSection.tsx             - Test listing + results
  Leaderboard.tsx             - Rank leaderboard
