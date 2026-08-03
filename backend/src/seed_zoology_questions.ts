import dotenv from 'dotenv';
import { connectDB } from './config/db';
import Subject from './models/Subject';
import CompetitiveSubject from './models/CompetitiveSubject';
import Chapter from './models/Chapter';
import ApEntranceQuestion from './models/ApEntranceQuestion';
import Question from './models/Question';

dotenv.config();

const zoologyQuestions = [
  {
    content: "Which phylum includes organisms commonly known as sponges?",
    options: [
      "Cnidaria",
      "Porifera",
      "Ctenophora",
      "Platyhelminthes"
    ],
    correctAnswer: "Porifera",
    difficulty: "Easy"
  },
  {
    content: "Which level of organization is exhibited by sponges?",
    options: [
      "Cellular level",
      "Tissue level",
      "Organ level",
      "Organ-system level"
    ],
    correctAnswer: "Cellular level",
    difficulty: "Easy"
  },
  {
    content: "Radial symmetry is found in which of the following animal groups?",
    options: [
      "Porifera and Annelida",
      "Cnidaria and Ctenophora",
      "Platyhelminthes and Aschelminthes",
      "Arthropoda and Mollusca"
    ],
    correctAnswer: "Cnidaria and Ctenophora",
    difficulty: "Easy"
  },
  {
    content: "Animals in which cells are arranged in two embryonic layers are called:",
    options: [
      "Triploblastic",
      "Diploblastic",
      "Coelomate",
      "Acoelomate"
    ],
    correctAnswer: "Diploblastic",
    difficulty: "Easy"
  },
  {
    content: "Which of the following is a characteristic feature of Phylum Platyhelminthes?",
    options: [
      "Pseudocoelom",
      "True Coelom",
      "Acoelomate condition",
      "Metameric Segmentation"
    ],
    correctAnswer: "Acoelomate condition",
    difficulty: "Easy"
  },
  {
    content: "Metameric segmentation is characteristic of:",
    options: [
      "Porifera",
      "Annelida and Arthropoda",
      "Cnidaria",
      "Mollusca"
    ],
    correctAnswer: "Annelida and Arthropoda",
    difficulty: "Easy"
  },
  {
    content: "Which phylum is characterized by the presence of a water vascular system?",
    options: [
      "Mollusca",
      "Echinodermata",
      "Hemichordata",
      "Chordata"
    ],
    correctAnswer: "Echinodermata",
    difficulty: "Medium"
  },
  {
    content: "Flame cells are the excretory structures found in:",
    options: [
      "Aschelminthes",
      "Platyhelminthes",
      "Annelida",
      "Arthropoda"
    ],
    correctAnswer: "Platyhelminthes",
    difficulty: "Medium"
  },
  {
    content: "Which of the following is a cartilaginous fish (Chondrichthyes)?",
    options: [
      "Labeo (Rohu)",
      "Scoliodon (Dog fish)",
      "Catla",
      "Exocoetus (Flying fish)"
    ],
    correctAnswer: "Scoliodon (Dog fish)",
    difficulty: "Medium"
  },
  {
    content: "Pneumatic (hollow) bones are found in:",
    options: [
      "Amphibia",
      "Reptilia",
      "Aves",
      "Mammalia"
    ],
    correctAnswer: "Aves",
    difficulty: "Easy"
  }
];

async function seedZoologyQuestions() {
  try {
    await connectDB();
    console.log('🌱 Connected to MongoDB for seeding ZOOLOGY-1 questions...');

    // Find ZOOLOGY-1 subject
    let zoologySubject: any = await Subject.findOne({ name: { $regex: /zoology-1/i } });
    if (!zoologySubject) {
      zoologySubject = await CompetitiveSubject.findOne({ name: { $regex: /zoology-1/i } });
    }

    if (!zoologySubject) {
      console.error('❌ ZOOLOGY-1 subject not found in DB!');
      process.exit(1);
    }

    console.log(`📌 Found ZOOLOGY-1 subject: ID=${zoologySubject._id}, Name=${zoologySubject.name}`);

    // Find Chapter 1: Animal Kingdom by title or regex
    let chapter1: any = await Chapter.findOne({
      subjectId: zoologySubject._id,
      $or: [
        { title: { $regex: /animal kingdom/i } },
        { name: { $regex: /animal kingdom/i } }
      ]
    });

    if (!chapter1) {
      console.log('Creating Chapter 1: Animal Kingdom...');
      chapter1 = await Chapter.create({
        subjectId: zoologySubject._id,
        title: 'Animal Kingdom'
      });
    } else if (!chapter1.title) {
      chapter1.title = 'Animal Kingdom';
      await chapter1.save();
    }

    console.log(`📌 Found/Created Chapter 1: ID=${chapter1._id}, Title=${chapter1.title}`);

    let seededCount = 0;
    for (const qData of zoologyQuestions) {
      const qPayload = {
        subjectId: zoologySubject._id,
        chapterId: chapter1._id,
        content: qData.content,
        questionText: qData.content,
        options: qData.options,
        correctAnswer: qData.correctAnswer,
        difficulty: qData.difficulty,
        marks: 4,
        negativeMarks: 1,
        explanation: `Detailed explanation for: ${qData.content}`
      };

      await ApEntranceQuestion.create(qPayload);
      await Question.create(qPayload);
      seededCount++;
    }

    console.log(`🎉 Successfully seeded ${seededCount} questions for ZOOLOGY-1 (NEET) - Chapter 1: Animal Kingdom!`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding zoology questions:', err);
    process.exit(1);
  }
}

seedZoologyQuestions();
