import dotenv from 'dotenv';
import { connectDB } from './config/db';
import Exam from './models/Exam';
import StudentType from './models/StudentType';

dotenv.config();

async function run() {
  await connectDB();
  const allExams = await Exam.find({});
  const allStudentTypes = await StudentType.find({});
  const studentTypeMap = new Map();
  allStudentTypes.forEach(st => studentTypeMap.set(st._id.toString(), st.state || 'AP'));

  let updatedCount = 0;
  for (const ex of allExams) {
    if (!ex.state || ex.type === 'competitive') continue;

    if (Array.isArray(ex.allowedStudentTypes) && ex.allowedStudentTypes.length > 0) {
      const filteredTypes = ex.allowedStudentTypes.filter(stId => {
        const stState = studentTypeMap.get(stId.toString());
        return stState === ex.state;
      });

      if (filteredTypes.length !== ex.allowedStudentTypes.length) {
        ex.allowedStudentTypes = filteredTypes;
        await ex.save();
        updatedCount++;
        console.log(`Cleaned student groups for exam "${ex.name}" (${ex.state})`);
      }
    }
  }

  console.log(`Successfully cleaned ${updatedCount} exams in MongoDB.`);
  process.exit(0);
}

run();
