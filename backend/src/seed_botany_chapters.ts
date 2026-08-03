import dotenv from 'dotenv';
import { connectDB } from './config/db';
import Subject from './models/Subject';
import CompetitiveSubject from './models/CompetitiveSubject';
import Chapter from './models/Chapter';
import Topic from './models/Topic';

dotenv.config();

const botanyData = [
  {
    chapter: "The Living World",
    topics: [
      "Characteristics of Living Organisms",
      "Diversity in Living Organisms",
      "Taxonomy",
      "Systematics",
      "Nomenclature",
      "Binomial Nomenclature",
      "Taxonomic Categories",
      "Taxonomic Hierarchy",
      "Species",
      "Genus",
      "Family",
      "Order",
      "Class",
      "Phylum/Division",
      "Kingdom",
      "Taxonomical Aids",
      "Herbarium",
      "Botanical Gardens",
      "Museums",
      "Zoological Parks",
      "Identification Keys"
    ]
  },
  {
    chapter: "Biological Classification",
    topics: [
      "Five Kingdom Classification",
      "Kingdom Monera",
      "Archaebacteria",
      "Eubacteria",
      "Cyanobacteria",
      "Kingdom Protista",
      "Chrysophytes",
      "Dinoflagellates",
      "Euglenoids",
      "Slime Moulds",
      "Protozoans",
      "Kingdom Fungi",
      "Classification of Fungi",
      "Lichens",
      "Viruses",
      "Viroids",
      "Prions"
    ]
  },
  {
    chapter: "Plant Kingdom",
    topics: [
      "Algae",
      "Bryophytes",
      "Pteridophytes",
      "Gymnosperms",
      "Angiosperms",
      "Plant Life Cycles",
      "Alternation of Generations",
      "Economic Importance of Plants"
    ]
  },
  {
    chapter: "Morphology of Flowering Plants",
    topics: [
      "Root",
      "Stem",
      "Leaf",
      "Inflorescence",
      "Flower",
      "Fruit",
      "Seed",
      "Modification of Root",
      "Modification of Stem",
      "Modification of Leaves",
      "Types of Placentation",
      "Floral Formula",
      "Floral Diagram",
      "Families",
      "Fabaceae",
      "Solanaceae",
      "Liliaceae"
    ]
  },
  {
    chapter: "Anatomy of Flowering Plants",
    topics: [
      "Plant Tissues",
      "Meristematic Tissue",
      "Permanent Tissue",
      "Simple Tissues",
      "Complex Tissues",
      "Xylem",
      "Phloem",
      "Tissue Systems",
      "Anatomy of Root",
      "Anatomy of Stem",
      "Anatomy of Leaf",
      "Secondary Growth",
      "Annual Rings",
      "Heartwood",
      "Sapwood"
    ]
  },
  {
    chapter: "Cell – The Unit of Life",
    topics: [
      "Cell Theory",
      "Prokaryotic Cell",
      "Eukaryotic Cell",
      "Cell Wall",
      "Plasma Membrane",
      "Cell Organelles",
      "Nucleus",
      "Endoplasmic Reticulum",
      "Golgi Apparatus",
      "Lysosomes",
      "Ribosomes",
      "Mitochondria",
      "Plastids",
      "Vacuoles",
      "Cytoskeleton",
      "Cilia and Flagella"
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
    chapter: "Biomolecules",
    topics: [
      "Biomolecules",
      "Primary Metabolites",
      "Secondary Metabolites",
      "Carbohydrates",
      "Proteins",
      "Lipids",
      "Nucleic Acids",
      "Amino Acids",
      "Enzymes",
      "Classification of Enzymes",
      "Enzyme Action",
      "Factors Affecting Enzyme Activity",
      "Vitamins"
    ]
  },
  {
    chapter: "Photosynthesis in Higher Plants",
    topics: [
      "Photosynthesis",
      "Chloroplast",
      "Pigments",
      "Light Reaction",
      "Dark Reaction",
      "Calvin Cycle",
      "C4 Pathway",
      "CAM Pathway",
      "Photorespiration",
      "Factors Affecting Photosynthesis"
    ]
  },
  {
    chapter: "Respiration in Plants",
    topics: [
      "Respiration",
      "Glycolysis",
      "Krebs Cycle",
      "Electron Transport Chain",
      "Oxidative Phosphorylation",
      "Fermentation",
      "Respiratory Quotient",
      "Amphibolic Pathway",
      "Factors Affecting Respiration"
    ]
  },
  {
    chapter: "Plant Growth and Development",
    topics: [
      "Plant Growth",
      "Growth Curve",
      "Phases of Growth",
      "Plant Growth Regulators",
      "Auxins",
      "Gibberellins",
      "Cytokinins",
      "Abscisic Acid",
      "Ethylene",
      "Photoperiodism",
      "Vernalization",
      "Seed Dormancy",
      "Seed Germination"
    ]
  }
];

async function seedBotany() {
  await connectDB();
  console.log("Connected to MongoDB...");

  // Find BOTANY-1 subject
  let subject: any = await Subject.findOne({ name: { $regex: /botany-1/i } });
  if (!subject) {
    subject = await Subject.findOne({ name: { $regex: /botany/i } });
  }

  if (!subject) {
    let compSub = await CompetitiveSubject.findOne({ name: { $regex: /botany/i } });
    if (compSub) subject = compSub;
  }

  if (!subject) {
    console.log("Subject BOTANY-1(NEET) not found in database! Creating it...");
    subject = await Subject.create({
      name: "BOTANY-1(NEET)",
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

  for (const item of botanyData) {
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

seedBotany();
