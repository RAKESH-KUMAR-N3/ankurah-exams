import dotenv from 'dotenv';
import { connectDB } from './config/db';
import Subject from './models/Subject';
import CompetitiveSubject from './models/CompetitiveSubject';
import Chapter from './models/Chapter';
import ApEntranceQuestion from './models/ApEntranceQuestion';
import Question from './models/Question';

dotenv.config();

const physicsQuestions = [
  {
    content: "Physics is mainly concerned with the study of:",
    options: [
      "Living organisms",
      "Matter, energy and their interactions",
      "Historical events",
      "Human behavior"
    ],
    correctAnswer: "Matter, energy and their interactions",
    difficulty: "Easy"
  },
  {
    content: "Which of the following is a fundamental force of nature?",
    options: [
      "Frictional Force",
      "Muscular Force",
      "Gravitational Force",
      "Tension Force"
    ],
    correctAnswer: "Gravitational Force",
    difficulty: "Easy"
  },
  {
    content: "How many fundamental forces are recognized in modern physics?",
    options: [
      "2",
      "3",
      "4",
      "5"
    ],
    correctAnswer: "4",
    difficulty: "Easy"
  },
  {
    content: "Which of the following is NOT a fundamental force?",
    options: [
      "Electromagnetic Force",
      "Strong Nuclear Force",
      "Weak Nuclear Force",
      "Frictional Force"
    ],
    correctAnswer: "Frictional Force",
    difficulty: "Easy"
  },
  {
    content: "Which branch of physics deals with the motion of planets?",
    options: [
      "Thermodynamics",
      "Mechanics",
      "Optics",
      "Electronics"
    ],
    correctAnswer: "Mechanics",
    difficulty: "Easy"
  },
  {
    content: "The strongest fundamental force is:",
    options: [
      "Gravitational Force",
      "Electromagnetic Force",
      "Strong Nuclear Force",
      "Weak Nuclear Force"
    ],
    correctAnswer: "Strong Nuclear Force",
    difficulty: "Easy"
  },
  {
    content: "The weakest fundamental force is:",
    options: [
      "Gravitational Force",
      "Strong Nuclear Force",
      "Electromagnetic Force",
      "Weak Nuclear Force"
    ],
    correctAnswer: "Gravitational Force",
    difficulty: "Easy"
  },
  {
    content: "Physics helps in the development of:",
    options: [
      "Medical Technology",
      "Communication Systems",
      "Space Research",
      "All of the Above"
    ],
    correctAnswer: "All of the Above",
    difficulty: "Easy"
  },
  {
    content: "Which one is an example of an application of physics?",
    options: [
      "MRI Scanner",
      "Satellite Communication",
      "Laser Surgery",
      "All of the Above"
    ],
    correctAnswer: "All of the Above",
    difficulty: "Easy"
  },
  {
    content: "The SI system of units is accepted:",
    options: [
      "Only in India",
      "Only in Europe",
      "Internationally",
      "Only in the USA"
    ],
    correctAnswer: "Internationally",
    difficulty: "Easy"
  }
];

async function seedQuestions() {
  await connectDB();
  console.log("Connected to MongoDB...");

  // Find Subject
  let subject: any = await Subject.findOne({ name: { $regex: /physics-1/i } });
  if (!subject) {
    subject = await Subject.findOne({ name: { $regex: /physics/i } });
  }
  if (!subject) {
    let compSub = await CompetitiveSubject.findOne({ name: { $regex: /physics/i } });
    if (compSub) subject = compSub;
  }

  if (!subject) {
    console.error("Subject PHYSICS-1(NEET) not found!");
    process.exit(1);
  }

  console.log(`Target Subject: "${subject.name}" (${subject._id})`);

  // Find Chapter "Physical World" under this subject
  let chapter = await Chapter.findOne({
    subjectId: subject._id,
    title: { $regex: /physical world/i }
  });

  if (!chapter) {
    console.log("Chapter 'Physical World' not found. Creating it under PHYSICS-1(NEET)...");
    chapter = await Chapter.create({
      title: "Physical World",
      subjectId: subject._id
    });
  }

  console.log(`Target Chapter: "${chapter.title}" (${chapter._id})`);

  let apCreated = 0;
  let genCreated = 0;

  for (const q of physicsQuestions) {
    // Prevent exact duplicates
    const existingAp = await ApEntranceQuestion.findOne({
      subjectId: subject._id,
      chapterId: chapter._id,
      content: q.content
    });

    if (!existingAp) {
      await ApEntranceQuestion.create({
        subjectId: subject._id,
        chapterId: chapter._id,
        content: q.content,
        options: q.options,
        correctAnswer: q.correctAnswer,
        difficulty: q.difficulty,
        marks: 4,
        negativeMarks: 1
      });
      apCreated++;
    }

    const existingGen = await Question.findOne({
      subjectId: subject._id,
      chapterId: chapter._id,
      content: q.content
    });

    if (!existingGen) {
      await Question.create({
        subjectId: subject._id,
        chapterId: chapter._id,
        subjectCategory: "entrance",
        content: q.content,
        options: q.options,
        correctAnswer: q.correctAnswer,
        difficulty: q.difficulty,
        marks: 4,
        negativeMarks: 1
      });
      genCreated++;
    }
  }

  console.log(`✅ SUCCESSFULLY SEEDED: ${apCreated} questions to ApEntranceQuestion and ${genCreated} to Question collections!`);
  process.exit(0);
}

seedQuestions();
