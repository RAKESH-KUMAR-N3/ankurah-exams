# Ankurah Exams API Documentation

## Authentication & Authorization
All endpoints (except `/api/auth/register` and `/api/auth/login`) require a Bearer token in the `Authorization` header.

```
Authorization: Bearer <your_jwt_token>
```

Roles:
- **Admin**: Has access to all `/api/categories`, `/api/exams`, `/api/reports`, `/api/import`, etc.
- **Student**: Has access to `/api/students/*`, `/api/test-attempts/*`, `/api/performance/*`, and `/api/dashboard/student`.

## Pagination, Filtering, and Search
All `GET` listing endpoints support the following query parameters:
- `page` (default: 1)
- `limit` (default: 10)
- `search` (searches predefined fields, e.g., name/title)
- `categoryId`, `examId`, `studentTypeId`, `subjectId`, `chapterId` (filters)

Example:
`GET /api/categories?page=1&limit=5&search=Entrance`

Response format:
```json
{
  "data": [...],
  "pagination": {
    "total": 20,
    "page": 1,
    "limit": 5,
    "totalPages": 4
  }
}
```

## Admin Dashboards & Reports
- `GET /api/dashboard/admin` - Fetches aggregated totals (students, exams, etc.)
- `GET /api/reports/overall` - Fetches overall performance accuracy
- `GET /api/reports/exam-wise` - Fetches average accuracy grouped by exam

## Student Management
- `GET /api/student-management/` - List all students (paginated)
- `GET /api/student-management/:id` - View student profile
- `PUT /api/student-management/:id/activate` - Activate a student account
- `PUT /api/student-management/:id/deactivate` - Deactivate a student account

## Bulk Import
Requires `multipart/form-data` with a file field named `file`.
- `POST /api/import/questions`
- `POST /api/import/materials`

## Student Functionality
- `GET /api/dashboard/student` - Fetches personal summary, upcoming tests, recent results.
- `GET /api/students/profile` - Fetches own profile.
- `PUT /api/students/profile` - Updates category, exams, studentType.
- `GET /api/students/subjects` - Fetches scoped subjects.
- `GET /api/students/materials` - Fetches scoped study materials.
- `GET /api/students/tests` - Fetches published, scoped tests.
- `POST /api/test-attempts/start/:testId` - Starts a test attempt.
- `PUT /api/test-attempts/save/:attemptId` - Saves intermediate answers.
- `POST /api/test-attempts/submit/:attemptId` - Submits and auto-scores the test.
- `GET /api/performance/my` - Fetches auto-generated performance metrics.
