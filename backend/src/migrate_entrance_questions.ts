import dotenv from 'dotenv';
import { connectDB } from './config/db';
import Question from './models/Question';
import ApEntranceQuestion from './models/ApEntranceQuestion';
import TgEntranceQuestion from './models/TgEntranceQuestion';
import Subject from './models/Subject';

dotenv.config();

async function run() {
  await connectDB();
  const allLegacyQuestions = await Question.find({});
  console.log('Found legacy entrance questions in questions collection:', allLegacyQuestions.length);

  for (const q of allLegacyQuestions) {
    const sub = await Subject.findById(q.subjectId);
    if (sub && sub.state === 'TG') {
      await TgEntranceQuestion.create({
        subjectId: q.subjectId,
        chapterId: q.chapterId,
        content: q.content,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        difficulty: q.difficulty
      });
    } else {
      await ApEntranceQuestion.create({
        subjectId: q.subjectId,
        chapterId: q.chapterId,
        content: q.content,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        difficulty: q.difficulty
      });
    }
    await Question.deleteOne({ _id: q._id });
  }

  console.log('Successfully migrated all entrance questions to apentrancequestions and tgentrancequestions collections');
  process.exit(0);
}

run();
