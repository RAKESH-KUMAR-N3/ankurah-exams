import dotenv from 'dotenv';
import { connectDB } from './config/db';
import Chapter from './models/Chapter';
import Subject from './models/Subject';
import CompetitiveSubject from './models/CompetitiveSubject';

dotenv.config();

async function run() {
  await connectDB();
  const allChapters = await Chapter.find({});
  const validSubjects = await Subject.find({});
  const validCompSubjects = await CompetitiveSubject.find({});
  
  const validSubjectIds = new Set([
    ...validSubjects.map(s => s._id.toString()),
    ...validCompSubjects.map(s => s._id.toString())
  ]);

  let deletedCount = 0;
  for (const ch of allChapters) {
    const subIdStr = ch.subjectId ? (ch.subjectId._id || ch.subjectId).toString() : '';
    if (!subIdStr || !validSubjectIds.has(subIdStr)) {
      await Chapter.deleteOne({ _id: ch._id });
      deletedCount++;
      console.log(`Deleted orphaned chapter: ${ch.name}`);
    }
  }

  console.log(`Successfully removed ${deletedCount} orphaned chapters from MongoDB`);
  process.exit(0);
}

run();
