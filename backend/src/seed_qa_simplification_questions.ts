import dotenv from 'dotenv';
import { connectDB } from './config/db';
import CompetitiveSubject from './models/CompetitiveSubject';
import Chapter from './models/Chapter';
import Question from './models/Question';

dotenv.config();

// SBI PO | Quantitative Aptitude | Simplification — 10 Questions
const questions = [
  {
    content: 'What is the value of 25 × 4 ÷ 5?',
    options: ['10', '15', '20', '25'],
    correctAnswer: 'C',
    difficulty: 'Easy',
  },
  {
    content: 'Simplify: 48 + 32 ÷ 8',
    options: ['6', '48', '52', '80'],
    correctAnswer: 'C',
    difficulty: 'Easy',
  },
  {
    content: 'Find the value of (18 × 5) − 24.',
    options: ['56', '66', '76', '86'],
    correctAnswer: 'B',
    difficulty: 'Easy',
  },
  {
    content: 'Simplify: 72 ÷ 9 × 6',
    options: ['42', '48', '54', '60'],
    correctAnswer: 'B',
    difficulty: 'Easy',
  },
  {
    content: 'What is the value of (15 + 25) × 2?',
    options: ['60', '70', '80', '90'],
    correctAnswer: 'C',
    difficulty: 'Easy',
  },
  {
    content: 'Simplify: 144 ÷ 12 + 18',
    options: ['24', '28', '30', '32'],
    correctAnswer: 'C',
    difficulty: 'Easy',
  },
  {
    content: 'Find the value of 8² + 6².',
    options: ['90', '95', '100', '110'],
    correctAnswer: 'C',
    difficulty: 'Medium',
  },
  {
    content: 'Simplify: (36 ÷ 6) + (42 ÷ 7)',
    options: ['10', '11', '12', '13'],
    correctAnswer: 'C',
    difficulty: 'Easy',
  },
  {
    content: 'What is the value of 250 − 75 + 25?',
    options: ['175', '180', '190', '200'],
    correctAnswer: 'D',
    difficulty: 'Easy',
  },
  {
    content: 'Simplify: (16 × 5) + (81 ÷ 9)',
    options: ['85', '88', '89', '90'],
    correctAnswer: 'C',
    difficulty: 'Medium',
  },
];

async function seed() {
  await connectDB();
  console.log('Connected to MongoDB...');

  const subject = await CompetitiveSubject.findOne({ name: /quantitative\s*aptitude/i });
  if (!subject) { console.error('❌  Quantitative Aptitude not found!'); process.exit(1); }
  console.log(`✅  Subject: "${subject.name}" (${subject._id})`);

  const chapter = await Chapter.findOne({ subjectId: subject._id, title: /simplification/i });
  if (!chapter) { console.error('❌  Chapter "Simplification" not found!'); process.exit(1); }
  console.log(`✅  Chapter: "${chapter.title}" (${chapter._id})`);

  const deleted = await Question.deleteMany({ chapterId: chapter._id, subjectId: subject._id });
  if (deleted.deletedCount > 0) console.log(`⚠️   Cleared ${deleted.deletedCount} existing questions.`);

  const docs = questions.map(q => ({
    content: q.content,
    options: q.options,
    correctAnswer: q.correctAnswer,
    difficulty: q.difficulty,
    subjectId: subject._id,
    chapterId: chapter._id,
    subjectCategory: 'competitive',
    marks: 1,
    negativeMarks: 0.25,
  }));

  await Question.insertMany(docs);
  console.log(`\n🎉  Seeded ${docs.length} questions → "${subject.name} → ${chapter.title}"!`);
  process.exit(0);
}

seed().catch(err => { console.error('❌', err.message); process.exit(1); });
