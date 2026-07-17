import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { connectDB } from './config/db';
import { notFound, errorHandler } from './middlewares/errorMiddleware';

// Route imports
import authRoutes from './routes/authRoutes';
import categoryRoutes from './routes/categoryRoutes';
import examRoutes from './routes/examRoutes';
import studentTypeRoutes from './routes/studentTypeRoutes';
import subjectRoutes from './routes/subjectRoutes';
import chapterRoutes from './routes/chapterRoutes';
import studyMaterialRoutes from './routes/studyMaterialRoutes';
import timetableRoutes from './routes/timetableRoutes';
import questionRoutes from './routes/questionRoutes';
import testRoutes from './routes/testRoutes';
import notificationRoutes from './routes/notificationRoutes';
import studentRoutes from './routes/studentRoutes';
import testAttemptRoutes from './routes/testAttemptRoutes';
import performanceRoutes from './routes/performanceRoutes';
import importRoutes from './routes/importRoutes';
import studentManagementRoutes from './routes/studentManagementRoutes';
import reportRoutes from './routes/reportRoutes';
import dashboardRoutes from './routes/dashboardRoutes';

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req: express.Request, res: express.Response) => {
  res.send('Ankurah Exams API is running...');
});

// Auth routes (public)
app.use('/api/auth', authRoutes);

// Admin Academic Management routes (protected)
app.use('/api/categories', categoryRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/student-types', studentTypeRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/chapters', chapterRoutes);
app.use('/api/study-materials', studyMaterialRoutes);
app.use('/api/timetables', timetableRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/notifications', notificationRoutes);

// Student routes (protected for students)
app.use('/api/students', studentRoutes);
app.use('/api/test-attempts', testAttemptRoutes);
app.use('/api/performance', performanceRoutes);

// Admin / Dashboard / Reports
app.use('/api/import', importRoutes);
app.use('/api/student-management', studentManagementRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);


// Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
