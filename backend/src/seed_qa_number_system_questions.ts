import dotenv from 'dotenv';
import { connectDB } from './config/db';
import CompetitiveSubject from './models/CompetitiveSubject';
import Chapter from './models/Chapter';
import Question from './models/Question';

dotenv.config();

// SBI PO | Quantitative Aptitude | Number System — 10 Questions
const questions = [
  {
    content: 'Which of the following is the smallest prime number?',
    options: ['0', '1', '2', '3'],
    correctAnswer: 'C',
    difficulty: 'Easy',
  },
  {
    content: 'Which of the following numbers is divisible by 9?',
    options: ['234', '369', '527', '845'],
    correctAnswer: 'B',
    difficulty: 'Easy',
  },
  {
    content: 'The HCF of 24 and 36 is:',
    options: ['6', '8', '12', '18'],
    correctAnswer: 'C',
    difficulty: 'Easy',
  },
  {
    content: 'The LCM of 12 and 18 is:',
    options: ['24', '36', '48', '72'],
    correctAnswer: 'B',
    difficulty: 'Easy',
  },
  {
    content: 'How many factors does the number 36 have?',
    options: ['7', '8', '9', '10'],
    correctAnswer: 'C',
    difficulty: 'Medium',
  },
  {
    content: 'Which of the following is a perfect square?',
    options: ['225', '235', '245', '255'],
    correctAnswer: 'A',
    difficulty: 'Easy',
  },
  {
    content: 'The remainder when 125 is divided by 8 is:',
    options: ['3', '4', '5', '6'],
    correctAnswer: 'C',
    difficulty: 'Medium',
  },
  {
    content: 'Which of the following is a composite number?',
    options: ['17', '19', '21', '23'],
    correctAnswer: 'C',
    difficulty: 'Easy',
  },
  {
    content: 'The sum of the first 20 natural numbers is:',
    options: ['190', '200', '210', '220'],
    correctAnswer: 'C',
    difficulty: 'Medium',
  },
  {
    content: 'A number is divisible by both 3 and 5. Which of the following numbers satisfies the condition?',
    options: ['145', '120', '128', '142'],
    correctAnswer: 'B',
    difficulty: 'Easy',
  },
];

async function seedQANumberSystem() {
  await connectDB();
  console.log('Connected to MongoDB...');

  // 1. Find Quantitative Aptitude (Competitive)
  const subject = await CompetitiveSubject.findOne({ name: /quantitative\s*aptitude/i });
  if (!subject) {
    console.error('❌  Quantitative Aptitude not found in competitivesubjects!');
    process.exit(1);
  }
  console.log(`✅  Subject: "${subject.name}" (${subject._id})`);

  // 2. Find "Number System" chapter under this subject
  const chapter = await Chapter.findOne({
    subjectId: subject._id,
    title: /number\s*system/i,
  });
  if (!chapter) {
    console.error('❌  Chapter "Number System" not found! Run seed_qa_chapters.ts first.');
    process.exit(1);
  }
  console.log(`✅  Chapter: "${chapter.title}" (${chapter._id})`);

  // 3. Delete existing questions for this chapter to avoid duplicates
  const deleted = await Question.deleteMany({ chapterId: chapter._id, subjectId: subject._id });
  if (deleted.deletedCount > 0) {
    console.log(`⚠️   Cleared ${deleted.deletedCount} existing questions.`);
  }

  // 4. Insert questions
  const docs = questions.map((q, i) => ({
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
  console.log(`\n🎉  Successfully seeded ${docs.length} questions for "${subject.name} → ${chapter.title}"!`);
  docs.forEach((q, i) => console.log(`  Q${i + 1}. ${q.content.substring(0, 60)}...`));

  process.exit(0);
}

seedQANumberSystem().catch(err => {
  console.error('❌  Error:', err.message);
  process.exit(1);
});
