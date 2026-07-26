import dotenv from 'dotenv';
import { connectDB } from './config/db';
import Question from './models/Question';
import CompetitiveQuestionBySubject from './models/CompetitiveQuestionBySubject';
import CompetitiveSubject from './models/CompetitiveSubject';

dotenv.config();

async function run() {
  await connectDB();
  const compSubjects = await CompetitiveSubject.find({});
  const compSubIds = compSubjects.map(s => s._id);
  const compQuestions = await Question.find({ subjectId: { $in: compSubIds } });
  console.log('Found competitive questions in questions collection:', compQuestions.length);

  for (const q of compQuestions) {
    await CompetitiveQuestionBySubject.create({
      subjectId: q.subjectId,
      content: q.content,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      difficulty: q.difficulty
    });
    await Question.deleteOne({ _id: q._id });
  }

  console.log('Successfully migrated all competitive questions to competitivequestionsbysubjects collection');
  process.exit(0);
}

run();
