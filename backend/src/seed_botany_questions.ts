import dotenv from 'dotenv';
import { connectDB } from './config/db';
import Subject from './models/Subject';
import CompetitiveSubject from './models/CompetitiveSubject';
import Chapter from './models/Chapter';
import ApEntranceQuestion from './models/ApEntranceQuestion';
import Question from './models/Question';

dotenv.config();

const botanyQuestions = [
  {
    content: "Which of the following is the basic unit of classification?",
    options: [
      "Genus",
      "Family",
      "Species",
      "Order"
    ],
    correctAnswer: "Species",
    difficulty: "Easy"
  },
  {
    content: "The system of naming organisms using two scientific names is called:",
    options: [
      "Taxonomy",
      "Classification",
      "Binomial Nomenclature",
      "Systematics"
    ],
    correctAnswer: "Binomial Nomenclature",
    difficulty: "Easy"
  },
  {
    content: "Who introduced Binomial Nomenclature?",
    options: [
      "Charles Darwin",
      "Carolus Linnaeus",
      "Robert Hooke",
      "Gregor Mendel"
    ],
    correctAnswer: "Carolus Linnaeus",
    difficulty: "Easy"
  },
  {
    content: "Which branch of biology deals with the identification, naming and classification of organisms?",
    options: [
      "Ecology",
      "Genetics",
      "Taxonomy",
      "Physiology"
    ],
    correctAnswer: "Taxonomy",
    difficulty: "Easy"
  },
  {
    content: "Which of the following is NOT considered a characteristic of living organisms?",
    options: [
      "Growth",
      "Reproduction",
      "Metabolism",
      "Crystallization"
    ],
    correctAnswer: "Crystallization",
    difficulty: "Easy"
  },
  {
    content: "The correct taxonomic hierarchy from higher to lower category is:",
    options: [
      "Kingdom → Phylum → Class → Order → Family → Genus → Species",
      "Kingdom → Order → Class → Family → Genus → Species → Phylum",
      "Species → Genus → Family → Order → Class → Phylum → Kingdom",
      "Phylum → Kingdom → Class → Order → Family → Species → Genus"
    ],
    correctAnswer: "Kingdom → Phylum → Class → Order → Family → Genus → Species",
    difficulty: "Easy"
  },
  {
    content: "A Herbarium is a place where:",
    options: [
      "Living animals are preserved",
      "Dried and pressed plant specimens are preserved",
      "Seeds are germinated",
      "Microorganisms are cultured"
    ],
    correctAnswer: "Dried and pressed plant specimens are preserved",
    difficulty: "Easy"
  },
  {
    content: "Which taxonomic aid is mainly used for the identification of plants and animals based on contrasting characters?",
    options: [
      "Museum",
      "Botanical Garden",
      "Key",
      "Herbarium"
    ],
    correctAnswer: "Key",
    difficulty: "Easy"
  },
  {
    content: "Which one of the following taxonomic categories includes closely related genera?",
    options: [
      "Order",
      "Family",
      "Class",
      "Species"
    ],
    correctAnswer: "Family",
    difficulty: "Easy"
  },
  {
    content: "The scientific name of an organism should be written in:",
    options: [
      "CAPITAL LETTERS",
      "Italics (or underlined separately when handwritten)",
      "Bold letters only",
      "Normal text only"
    ],
    correctAnswer: "Italics (or underlined separately when handwritten)",
    difficulty: "Easy"
  }
];

async function seedBotanyQuestions() {
  await connectDB();
  console.log("Connected to MongoDB...");

  // Find Subject
  let subject: any = await Subject.findOne({ name: { $regex: /botany-1/i } });
  if (!subject) {
    subject = await Subject.findOne({ name: { $regex: /botany/i } });
  }
  if (!subject) {
    let compSub = await CompetitiveSubject.findOne({ name: { $regex: /botany/i } });
    if (compSub) subject = compSub;
  }

  if (!subject) {
    console.error("Subject BOTANY-1(NEET) not found!");
    process.exit(1);
  }

  console.log(`Target Subject: "${subject.name}" (${subject._id})`);

  // Find Chapter "The Living World" under this subject
  let chapter = await Chapter.findOne({
    subjectId: subject._id,
    title: { $regex: /the living world/i }
  });

  if (!chapter) {
    console.log("Chapter 'The Living World' not found. Creating it...");
    chapter = await Chapter.create({
      title: "The Living World",
      subjectId: subject._id
    });
  }

  console.log(`Target Chapter: "${chapter.title}" (${chapter._id})`);

  let apCreated = 0;
  let genCreated = 0;

  for (const q of botanyQuestions) {
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

seedBotanyQuestions();
