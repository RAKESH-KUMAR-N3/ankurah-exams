import dotenv from 'dotenv';
import { connectDB } from './config/db';
import Subject from './models/Subject';
import CompetitiveSubject from './models/CompetitiveSubject';
import Chapter from './models/Chapter';
import Topic from './models/Topic';

dotenv.config();

const chemistryData = [
  {
    chapter: "Some Basic Concepts of Chemistry",
    topics: [
      "Importance of Chemistry",
      "Nature of Matter",
      "Laws of Chemical Combination",
      "Dalton's Atomic Theory",
      "Atomic and Molecular Masses",
      "Mole Concept",
      "Avogadro Number",
      "Molar Mass",
      "Percentage Composition",
      "Empirical Formula",
      "Molecular Formula",
      "Stoichiometry",
      "Limiting Reagent"
    ]
  },
  {
    chapter: "Structure of Atom",
    topics: [
      "Discovery of Electron",
      "Discovery of Proton and Neutron",
      "Thomson Atomic Model",
      "Rutherford Atomic Model",
      "Bohr's Atomic Model",
      "Electromagnetic Radiation",
      "Photoelectric Effect",
      "Atomic Spectra",
      "Quantum Numbers",
      "Electronic Configuration",
      "Aufbau Principle",
      "Pauli Exclusion Principle",
      "Hund's Rule"
    ]
  },
  {
    chapter: "Classification of Elements and Periodicity in Properties",
    topics: [
      "Modern Periodic Law",
      "Long Form Periodic Table",
      "Groups and Periods",
      "Electronic Configuration",
      "Atomic Radius",
      "Ionic Radius",
      "Ionization Enthalpy",
      "Electron Gain Enthalpy",
      "Electronegativity",
      "Periodic Trends"
    ]
  },
  {
    chapter: "Chemical Bonding and Molecular Structure",
    topics: [
      "Octet Rule",
      "Ionic Bond",
      "Covalent Bond",
      "Lewis Structures",
      "Formal Charge",
      "Resonance",
      "VSEPR Theory",
      "Valence Bond Theory",
      "Hybridization",
      "Molecular Orbital Theory",
      "Hydrogen Bonding",
      "Bond Parameters",
      "Dipole Moment"
    ]
  },
  {
    chapter: "States of Matter",
    topics: [
      "Three States of Matter",
      "Intermolecular Forces",
      "Thermal Energy",
      "Gas Laws",
      "Boyle's Law",
      "Charles' Law",
      "Gay-Lussac's Law",
      "Avogadro's Law",
      "Ideal Gas Equation",
      "Dalton's Law of Partial Pressures",
      "Kinetic Theory of Gases",
      "Root Mean Square Speed",
      "Real Gases",
      "Liquefaction of Gases",
      "Vapour Pressure"
    ]
  },
  {
    chapter: "Thermodynamics",
    topics: [
      "System and Surroundings",
      "Types of Systems",
      "Internal Energy",
      "Heat and Work",
      "First Law of Thermodynamics",
      "Enthalpy",
      "Heat Capacity",
      "Hess's Law",
      "Bond Enthalpy",
      "Second Law of Thermodynamics",
      "Entropy",
      "Gibbs Free Energy",
      "Spontaneity of Reactions"
    ]
  },
  {
    chapter: "Equilibrium",
    topics: [
      "Dynamic Equilibrium",
      "Law of Mass Action",
      "Equilibrium Constant",
      "Le Chatelier's Principle",
      "Ionic Equilibrium",
      "Acids and Bases",
      "pH Scale",
      "Buffer Solutions",
      "Hydrolysis of Salts",
      "Solubility Product",
      "Common Ion Effect"
    ]
  },
  {
    chapter: "Redox Reactions",
    topics: [
      "Oxidation",
      "Reduction",
      "Oxidation Number",
      "Rules for Oxidation Number",
      "Oxidizing Agents",
      "Reducing Agents",
      "Balancing Redox Reactions",
      "Ion-Electron Method",
      "Applications of Redox Reactions"
    ]
  },
  {
    chapter: "Hydrogen",
    topics: [
      "Position of Hydrogen",
      "Isotopes of Hydrogen",
      "Preparation of Hydrogen",
      "Properties of Hydrogen",
      "Hydrides",
      "Water",
      "Hard and Soft Water",
      "Hydrogen Peroxide",
      "Heavy Water",
      "Uses of Hydrogen"
    ]
  },
  {
    chapter: "The s-Block Elements",
    topics: [
      "General Characteristics",
      "Alkali Metals",
      "Alkaline Earth Metals",
      "Physical Properties",
      "Chemical Properties",
      "Anomalous Behaviour of Lithium",
      "Diagonal Relationship",
      "Important Compounds of Sodium",
      "Important Compounds of Calcium",
      "Biological Importance"
    ]
  },
  {
    chapter: "Some p-Block Elements",
    topics: [
      "General Introduction",
      "Group 13 Elements",
      "Boron",
      "Aluminium",
      "Group 14 Elements",
      "Carbon Family",
      "Important Compounds",
      "Borax",
      "Boric Acid",
      "Carbon Monoxide",
      "Carbon Dioxide",
      "Silicates"
    ]
  },
  {
    chapter: "Organic Chemistry – Some Basic Principles and Techniques",
    topics: [
      "Introduction to Organic Chemistry",
      "Tetravalency of Carbon",
      "Classification of Organic Compounds",
      "Nomenclature (IUPAC)",
      "Structural Isomerism",
      "Electronic Effects",
      "Inductive Effect",
      "Resonance Effect",
      "Hyperconjugation",
      "Reaction Intermediates",
      "Types of Organic Reactions",
      "Purification of Organic Compounds",
      "Qualitative Analysis",
      "Quantitative Analysis"
    ]
  },
  {
    chapter: "Hydrocarbons",
    topics: [
      "Alkanes",
      "Alkenes",
      "Alkynes",
      "Aromatic Hydrocarbons",
      "Preparation Methods",
      "Physical Properties",
      "Chemical Properties",
      "Electrophilic Addition",
      "Electrophilic Substitution",
      "Markovnikov Rule",
      "Anti-Markovnikov Rule",
      "Ozonolysis",
      "Polymerization",
      "Uses of Hydrocarbons"
    ]
  },
  {
    chapter: "Environmental Chemistry",
    topics: [
      "Environmental Pollution",
      "Air Pollution",
      "Water Pollution",
      "Soil Pollution",
      "Industrial Waste",
      "Greenhouse Effect",
      "Global Warming",
      "Acid Rain",
      "Ozone Layer Depletion",
      "Smog",
      "Waste Management",
      "Green Chemistry"
    ]
  }
];

async function seedChemistry() {
  await connectDB();
  console.log("Connected to MongoDB...");

  // Find CHEMISTRY-1 subject
  let subject: any = await Subject.findOne({ name: { $regex: /chemistry-1/i } });
  if (!subject) {
    subject = await Subject.findOne({ name: { $regex: /chemistry/i } });
  }

  if (!subject) {
    let compSub = await CompetitiveSubject.findOne({ name: { $regex: /chemistry/i } });
    if (compSub) subject = compSub;
  }

  if (!subject) {
    console.log("Subject CHEMISTRY-1(NEET) not found in database! Creating it...");
    subject = await Subject.create({
      name: "CHEMISTRY-1(NEET)",
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

  for (const item of chemistryData) {
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

seedChemistry();
