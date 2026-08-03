import dotenv from 'dotenv';
import { connectDB } from './config/db';
import Subject from './models/Subject';
import CompetitiveSubject from './models/CompetitiveSubject';
import Chapter from './models/Chapter';

dotenv.config();

async function clearSubjects() {
  await connectDB();
  
  const deletedSubjects = await Subject.deleteMany({});
  const deletedCompSubjects = await CompetitiveSubject.deleteMany({});
  const deletedChapters = await Chapter.deleteMany({});

  console.log(`Deleted ${deletedSubjects.deletedCount} Subject documents`);
  console.log(`Deleted ${deletedCompSubjects.deletedCount} CompetitiveSubject documents`);
  console.log(`Deleted ${deletedChapters.deletedCount} Chapter documents`);

  console.log('ALL SUBJECTS CLEARED FROM DATABASE SUCCESSFULLY!');
  process.exit(0);
}

clearSubjects();
