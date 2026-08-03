import dotenv from 'dotenv';
import { connectDB } from './config/db';
import Subject from './models/Subject';
import CompetitiveSubject from './models/CompetitiveSubject';
import Chapter from './models/Chapter';
import Topic from './models/Topic';

dotenv.config();

const zoologyData = [
  {
    chapter: "Animal Kingdom",
    topics: [
      "Basis of Animal Classification",
      "Levels of Organization",
      "Symmetry",
      "Diploblastic and Triploblastic Organization",
      "Coelom",
      "Segmentation",
      "Notochord",
      "Classification of Animal Kingdom",
      "Phylum Porifera",
      "Phylum Cnidaria (Coelenterata)",
      "Phylum Ctenophora",
      "Phylum Platyhelminthes",
      "Phylum Aschelminthes (Nematoda)",
      "Phylum Annelida",
      "Phylum Arthropoda",
      "Phylum Mollusca",
      "Phylum Echinodermata",
      "Phylum Hemichordata",
      "Phylum Chordata",
      "Urochordata",
      "Cephalochordata",
      "Vertebrata",
      "Cyclostomata",
      "Chondrichthyes",
      "Osteichthyes",
      "Amphibia",
      "Reptilia",
      "Aves",
      "Mammalia"
    ]
  },
  {
    chapter: "Structural Organisation in Animals",
    topics: [
      "Animal Tissues",
      "Epithelial Tissue",
      "Connective Tissue",
      "Muscular Tissue",
      "Neural Tissue",
      "Cockroach – Morphology",
      "Cockroach – Anatomy",
      "Digestive System of Cockroach",
      "Circulatory System of Cockroach",
      "Respiratory System of Cockroach",
      "Excretory System of Cockroach",
      "Nervous System of Cockroach",
      "Reproductive System of Cockroach"
    ]
  },
  {
    chapter: "Biomolecules",
    topics: [
      "Biomolecules",
      "Primary Metabolites",
      "Secondary Metabolites",
      "Carbohydrates",
      "Proteins",
      "Amino Acids",
      "Lipids",
      "Nucleic Acids",
      "Enzymes",
      "Classification of Enzymes",
      "Enzyme Action",
      "Factors Affecting Enzyme Activity",
      "Vitamins"
    ]
  },
  {
    chapter: "Cell – The Unit of Life",
    topics: [
      "Cell Theory",
      "Prokaryotic Cell",
      "Eukaryotic Cell",
      "Plasma Membrane",
      "Cell Wall",
      "Nucleus",
      "Endoplasmic Reticulum",
      "Golgi Apparatus",
      "Lysosomes",
      "Ribosomes",
      "Mitochondria",
      "Centrosome",
      "Cilia and Flagella",
      "Vacuoles",
      "Cell Organelles"
    ]
  },
  {
    chapter: "Cell Cycle and Cell Division",
    topics: [
      "Cell Cycle",
      "Interphase",
      "G1 Phase",
      "S Phase",
      "G2 Phase",
      "Mitosis",
      "Cytokinesis",
      "Meiosis",
      "Meiosis I",
      "Meiosis II",
      "Significance of Cell Division"
    ]
  },
  {
    chapter: "Human Physiology – Digestion and Absorption",
    topics: [
      "Digestive System",
      "Alimentary Canal",
      "Digestive Glands",
      "Digestion of Food",
      "Absorption of Nutrients",
      "Assimilation",
      "Disorders of Digestive System"
    ]
  },
  {
    chapter: "Human Physiology – Breathing and Exchange of Gases",
    topics: [
      "Respiratory System",
      "Mechanism of Breathing",
      "Exchange of Gases",
      "Transport of Oxygen",
      "Transport of Carbon Dioxide",
      "Regulation of Respiration",
      "Respiratory Disorders"
    ]
  },
  {
    chapter: "Human Physiology – Body Fluids and Circulation",
    topics: [
      "Blood",
      "Blood Groups",
      "Plasma",
      "Formed Elements",
      "Blood Coagulation",
      "Lymph",
      "Human Heart",
      "Cardiac Cycle",
      "Electrocardiogram (ECG)",
      "Double Circulation",
      "Regulation of Cardiac Activity",
      "Circulatory Disorders"
    ]
  },
  {
    chapter: "Human Physiology – Excretory Products and Their Elimination",
    topics: [
      "Excretory System",
      "Human Kidney",
      "Nephron",
      "Formation of Urine",
      "Counter Current Mechanism",
      "Micturition",
      "Regulation of Kidney Function",
      "Dialysis",
      "Kidney Disorders"
    ]
  },
  {
    chapter: "Human Physiology – Locomotion and Movement",
    topics: [
      "Skeletal System",
      "Types of Bones",
      "Joints",
      "Muscles",
      "Muscle Contraction",
      "Sliding Filament Theory",
      "Disorders of Muscular and Skeletal System"
    ]
  },
  {
    chapter: "Human Physiology – Neural Control and Coordination",
    topics: [
      "Nervous System",
      "Neuron",
      "Nerve Impulse",
      "Central Nervous System",
      "Peripheral Nervous System",
      "Reflex Action",
      "Human Brain",
      "Spinal Cord",
      "Sense Organs"
    ]
  },
  {
    chapter: "Human Physiology – Chemical Coordination and Integration",
    topics: [
      "Endocrine Glands",
      "Hormones",
      "Hypothalamus",
      "Pituitary Gland",
      "Thyroid Gland",
      "Parathyroid Glands",
      "Adrenal Glands",
      "Pancreas",
      "Pineal Gland",
      "Thymus",
      "Testis",
      "Ovary",
      "Mechanism of Hormone Action",
      "Hormonal Disorders"
    ]
  }
];

async function seedZoology() {
  await connectDB();
  console.log("Connected to MongoDB...");

  // Find ZOOLOGY-1 subject
  let subject: any = await Subject.findOne({ name: { $regex: /zoology-1/i } });
  if (!subject) {
    subject = await Subject.findOne({ name: { $regex: /zoology/i } });
  }

  if (!subject) {
    let compSub = await CompetitiveSubject.findOne({ name: { $regex: /zoology/i } });
    if (compSub) subject = compSub;
  }

  if (!subject) {
    console.log("Subject ZOOLOGY-1(NEET) not found in database! Creating it...");
    subject = await Subject.create({
      name: "ZOOLOGY-1(NEET)",
      state: "Both",
      subjectCategory: "entrance"
    });
  }

  console.log(`Seeding chapters and topics for Subject: "${subject.name}" (${subject._id})`);

  // Clear existing chapters for this subject first to avoid duplication
  const existingChs = await Chapter.find({ subjectId: subject._id });
  const existingChIds = existingChs.map(c => c._id);
  await Topic.deleteMany({ chapterId: { $in: existingChIds } });
  await Chapter.deleteMany({ subjectId: subject._id });

  let totalChaptersCreated = 0;
  let totalTopicsCreated = 0;

  for (const item of zoologyData) {
    const ch = await Chapter.create({
      title: item.chapter,
      subjectId: subject._id
    });
    totalChaptersCreated++;

    if (item.topics && item.topics.length > 0) {
      const topicDocs = item.topics.map((t, idx) => ({
        title: t,
        chapterId: ch._id,
        order: idx
      }));
      await Topic.insertMany(topicDocs);
      totalTopicsCreated += topicDocs.length;
    }
  }

  console.log(`✅ SUCCESSFULLY SEEDED: ${totalChaptersCreated} Chapters and ${totalTopicsCreated} Topics for ${subject.name}!`);
  process.exit(0);
}

seedZoology();
