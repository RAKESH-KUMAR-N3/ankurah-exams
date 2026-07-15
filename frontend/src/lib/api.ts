const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getToken = () => localStorage.getItem('token');

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getToken()}`,
});

const handleResponse = async (res: Response) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'API Error');
  return data;
};

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const apiLogin = (email: string, password: string) =>
  fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  }).then(handleResponse);

export const apiRegister = (name: string, email: string, password: string) =>
  fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, role: 'student' }),
  }).then(handleResponse);

// ─── Admin CRUD ───────────────────────────────────────────────────────────────
export const apiGet = (path: string, params: Record<string, string> = {}) => {
  const qs = new URLSearchParams(params).toString();
  return fetch(`${BASE_URL}${path}${qs ? '?' + qs : ''}`, {
    headers: authHeaders(),
  }).then(handleResponse);
};

export const apiPost = (path: string, body: any) =>
  fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  }).then(handleResponse);

export const apiPut = (path: string, body: any) =>
  fetch(`${BASE_URL}${path}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(body),
  }).then(handleResponse);

export const apiDelete = (path: string) =>
  fetch(`${BASE_URL}${path}`, {
    method: 'DELETE',
    headers: authHeaders(),
  }).then(handleResponse);

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const fetchAdminDashboard = () => apiGet('/api/dashboard/admin');
export const fetchStudentDashboard = () => apiGet('/api/dashboard/student');

// ─── Admin Data ───────────────────────────────────────────────────────────────
export const fetchCategories = (params?: Record<string, string>) => apiGet('/api/categories', params);
export const fetchExams = (params?: Record<string, string>) => apiGet('/api/exams', params);
export const fetchStudentTypes = (params?: Record<string, string>) => apiGet('/api/student-types', params);
export const fetchSubjects = (params?: Record<string, string>) => apiGet('/api/subjects', params);
export const fetchChapters = (params?: Record<string, string>) => apiGet('/api/chapters', params);
export const fetchQuestions = (params?: Record<string, string>) => apiGet('/api/questions', params);
export const fetchTests = (params?: Record<string, string>) => apiGet('/api/tests', params);
export const fetchStudyMaterials = (params?: Record<string, string>) => apiGet('/api/study-materials', params);
export const fetchTimetables = (params?: Record<string, string>) => apiGet('/api/timetables', params);
export const fetchNotifications = (params?: Record<string, string>) => apiGet('/api/notifications', params);
export const fetchStudentList = (params?: Record<string, string>) => apiGet('/api/student-management', params);

// ─── Student Data ─────────────────────────────────────────────────────────────
export const fetchMyProfile = () => apiGet('/api/students/profile');
export const fetchMySubjects = () => apiGet('/api/students/subjects');
export const fetchMyChapters = () => apiGet('/api/students/chapters');
export const fetchMyMaterials = () => apiGet('/api/students/materials');
export const fetchMyTimetables = () => apiGet('/api/students/timetables');
export const fetchMyTests = (type?: string) => apiGet('/api/students/tests', type ? { type } : {});
export const fetchMyNotifications = () => apiGet('/api/students/notifications');
export const fetchMyPerformance = () => apiGet('/api/performance/my');
export const fetchMyAttempts = () => apiGet('/api/test-attempts/my');
