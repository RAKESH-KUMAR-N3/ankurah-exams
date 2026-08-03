import dotenv from 'dotenv';
import { connectDB } from './config/db';
import Subject from './models/Subject';
import CompetitiveSubject from './models/CompetitiveSubject';
import Chapter from './models/Chapter';
import ApEntranceQuestion from './models/ApEntranceQuestion';
import Question from './models/Question';

dotenv.config();

const chemistryQuestions = [
  {
    content: "Chemistry is the branch of science that deals with:",
    options: [
      "Living organisms only",
      "Matter, its properties, composition and changes",
      "Planets and stars",
      "Weather forecasting"
    ],
    correctAnswer: "Matter, its properties, composition and changes",
    difficulty: "Easy"
  },
  {
    content: "Which law states that matter can neither be created nor destroyed during a chemical reaction?",
    options: [
      "Law of Definite Proportions",
      "Law of Conservation of Mass",
      "Law of Multiple Proportions",
      "Gay-Lussac's Law"
    ],
    correctAnswer: "Law of Conservation of Mass",
    difficulty: "Easy"
  },
  {
    content: "The Law of Definite Proportions was proposed by:",
    options: [
      "John Dalton",
      "Antoine Lavoisier",
      "Joseph Proust",
      "Avogadro"
    ],
    correctAnswer: "Joseph Proust",
    difficulty: "Easy"
  },
  {
    content: "According to Dalton's Atomic Theory, atoms of the same element are:",
    options: [
      "Different in mass and properties",
      "Identical in mass and chemical properties",
      "Continuously divisible",
      "Created during chemical reactions"
    ],
    correctAnswer: "Identical in mass and chemical properties",
    difficulty: "Easy"
  },
  {
    content: "One mole of any substance contains:",
    options: [
      "3.14 × 10²³ particles",
      "6.022 × 10²³ particles",
      "9.81 × 10²³ particles",
      "1.602 × 10²³ particles"
    ],
    correctAnswer: "6.022 × 10²³ particles",
    difficulty: "Easy"
  },
  {
    content: "The SI unit of amount of substance is:",
    options: [
      "Gram",
      "Mole",
      "Kilogram",
      "Atomic Mass Unit"
    ],
    correctAnswer: "Mole",
    difficulty: "Easy"
  },
  {
    content: "The mass of one mole of a substance is called:",
    options: [
      "Atomic Mass",
      "Molecular Mass",
      "Molar Mass",
      "Relative Mass"
    ],
    correctAnswer: "Molar Mass",
    difficulty: "Easy"
  },
  {
    content: "Which of the following is used to calculate the simplest whole-number ratio of atoms in a compound?",
    options: [
      "Molecular Formula",
      "Structural Formula",
      "Empirical Formula",
      "Chemical Equation"
    ],
    correctAnswer: "Empirical Formula",
    difficulty: "Easy"
  },
  {
    content: "The reactant that gets completely consumed first in a chemical reaction is known as:",
    options: [
      "Excess Reagent",
      "Catalyst",
      "Limiting Reagent",
      "Product"
    ],
    correctAnswer: "Limiting Reagent",
    difficulty: "Easy"
  },
  {
    content: "The formula H₂O represents:",
    options: [
      "Empirical Formula only",
      "Molecular Formula of Water",
      "Structural Formula",
      "Ionic Formula"
    ],
    correctAnswer: "Molecular Formula of Water",
    difficulty: "Easy"
  }
];

async function seedChemistryQuestions() {
  await connectDB();
  console.log("Connected to MongoDB...");

  // Find Subject
  let subject: any = await Subject.findOne({ name: { $regex: /chemistry-1/i } });
  if (!subject) {
    subject = await Subject.findOne({ name: { $regex: /chemistry/i } });
  }
  if (!subject) {
    let compSub = await CompetitiveSubject.findOne({ name: { $regex: /chemistry/i } });
    if (compSub) subject = compSub;
  }

  if (!subject) {
    console.error("Subject CHEMISTRY-1(NEET) not found!");
    process.exit(1);
  }

  console.log(`Target Subject: "${subject.name}" (${subject._id})`);

  // Find Chapter "Some Basic Concepts of Chemistry" under this subject
  let chapter = await Chapter.findOne({
    subjectId: subject._id,
    title: { $regex: /some basic concepts/i }
  });

  if (!chapter) {
    console.log("Chapter 'Some Basic Concepts of Chemistry' not found. Creating it...");
    chapter = await Chapter.create({
      title: "Some Basic Concepts of Chemistry",
      subjectId: subject._id
    });
  }

  console.log(`Target Chapter: "${chapter.title}" (${chapter._id})`);

  let apCreated = 0;
  let genCreated = 0;

  for (const q of chemistryQuestions) {
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

seedChemistryQuestions();
