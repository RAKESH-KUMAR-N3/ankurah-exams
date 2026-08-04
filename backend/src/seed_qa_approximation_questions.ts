import dotenv from 'dotenv';
import { connectDB } from './config/db';
import CompetitiveSubject from './models/CompetitiveSubject';
import Chapter from './models/Chapter';
import Question from './models/Question';

dotenv.config();

const questions = [
  { content: 'The approximate value of 49 × 21 is:', options: ['900', '1000', '1100', '1200'], correctAnswer: 'B', difficulty: 'Easy' },
  { content: 'Approximate 198 ÷ 19.', options: ['8', '9', '10', '11'], correctAnswer: 'C', difficulty: 'Easy' },
  { content: 'The approximate value of 503 + 298 is:', options: ['700', '750', '800', '850'], correctAnswer: 'C', difficulty: 'Easy' },
  { content: 'Approximate 79 × 11.', options: ['700', '800', '900', '1000'], correctAnswer: 'C', difficulty: 'Easy' },
  { content: 'The approximate value of 998 − 503 is:', options: ['400', '450', '500', '550'], correctAnswer: 'C', difficulty: 'Easy' },
  { content: 'Approximate 245 ÷ 5.', options: ['45', '50', '55', '60'], correctAnswer: 'B', difficulty: 'Easy' },
  { content: 'The approximate value of 39² is:', options: ['1400', '1500', '1600', '1700'], correctAnswer: 'C', difficulty: 'Medium' },
  { content: 'Approximate the value of 152 + 347 + 503.', options: ['900', '950', '1000', '1050'], correctAnswer: 'C', difficulty: 'Easy' },
  { content: 'Approximate 88 × 49.', options: ['4000', '4500', '5000', '5500'], correctAnswer: 'B', difficulty: 'Medium' },
  { content: 'Approximate 1204 ÷ 6.', options: ['100', '150', '200', '250'], correctAnswer: 'C', difficulty: 'Easy' },
];

async function seed() {
  await connectDB();
  console.log('Connected to MongoDB...');

  const subject = await CompetitiveSubject.findOne({ name: /quantitative\s*aptitude/i });
  if (!subject) { console.error('❌  Quantitative Aptitude not found!'); process.exit(1); }
  console.log(`✅  Subject: "${subject.name}" (${subject._id})`);

  const chapter = await Chapter.findOne({ subjectId: subject._id, title: /approximation/i });
  if (!chapter) { console.error('❌  Chapter "Approximation" not found!'); process.exit(1); }
  console.log(`✅  Chapter: "${chapter.title}" (${chapter._id})`);

  const deleted = await Question.deleteMany({ chapterId: chapter._id, subjectId: subject._id });
  if (deleted.deletedCount > 0) console.log(`⚠️   Cleared ${deleted.deletedCount} existing questions.`);

  await Question.insertMany(questions.map(q => ({
    ...q, subjectId: subject._id, chapterId: chapter._id,
    subjectCategory: 'competitive', marks: 1, negativeMarks: 0.25,
  })));

  console.log(`\n🎉  Seeded ${questions.length} questions → "Quantitative Aptitude → Approximation"!`);
  process.exit(0);
}

seed().catch(err => { console.error('❌', err.message); process.exit(1); });
