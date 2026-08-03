import dotenv from 'dotenv';
import { connectDB } from './config/db';
import Subject from './models/Subject';
import CompetitiveSubject from './models/CompetitiveSubject';
import Chapter from './models/Chapter';
import Topic from './models/Topic';

dotenv.config();

const physicsData = [
  {
    chapter: "Physical World",
    topics: [
      "Physics – Scope and Excitement",
      "Nature of Physical Laws",
      "Fundamental Forces in Nature",
      "Physics, Technology and Society"
    ]
  },
  {
    chapter: "Units and Measurements",
    topics: [
      "Physical Quantities",
      "SI Units",
      "Fundamental and Derived Units",
      "Dimensional Analysis",
      "Significant Figures",
      "Precision and Accuracy",
      "Errors in Measurement",
      "Vernier Calipers",
      "Screw Gauge"
    ]
  },
  {
    chapter: "Motion in a Straight Line",
    topics: [
      "Position, Distance and Displacement",
      "Speed and Velocity",
      "Uniform and Non-uniform Motion",
      "Average and Instantaneous Velocity",
      "Acceleration",
      "Equations of Motion",
      "Velocity-Time Graphs",
      "Relative Motion (Basic)"
    ]
  },
  {
    chapter: "Motion in a Plane",
    topics: [
      "Scalars and Vectors",
      "Vector Addition and Resolution",
      "Projectile Motion",
      "Uniform Circular Motion",
      "Relative Velocity"
    ]
  },
  {
    chapter: "Laws of Motion",
    topics: [
      "Force",
      "Inertia",
      "Newton's First Law",
      "Newton's Second Law",
      "Newton's Third Law",
      "Momentum",
      "Conservation of Momentum",
      "Friction",
      "Circular Motion Applications"
    ]
  },
  {
    chapter: "Work, Energy and Power",
    topics: [
      "Work Done",
      "Kinetic Energy",
      "Potential Energy",
      "Work-Energy Theorem",
      "Conservation of Mechanical Energy",
      "Power",
      "Collisions (Basic)"
    ]
  },
  {
    chapter: "System of Particles and Rotational Motion",
    topics: [
      "Centre of Mass",
      "Motion of Centre of Mass",
      "Torque",
      "Angular Momentum",
      "Conservation of Angular Momentum",
      "Moment of Inertia",
      "Radius of Gyration",
      "Rotational Kinematics",
      "Rolling Motion",
      "Equilibrium of Rigid Bodies"
    ]
  },
  {
    chapter: "Gravitation",
    topics: [
      "Universal Law of Gravitation",
      "Gravitational Constant",
      "Acceleration Due to Gravity",
      "Variation of g",
      "Gravitational Potential",
      "Escape Velocity",
      "Orbital Velocity",
      "Satellites",
      "Kepler's Laws"
    ]
  },
  {
    chapter: "Mechanical Properties of Solids",
    topics: [
      "Elasticity",
      "Stress and Strain",
      "Hooke's Law",
      "Young's Modulus",
      "Bulk Modulus",
      "Shear Modulus",
      "Elastic Energy"
    ]
  },
  {
    chapter: "Mechanical Properties of Fluids",
    topics: [
      "Pressure",
      "Pascal's Law",
      "Archimedes' Principle",
      "Buoyancy",
      "Surface Tension",
      "Capillarity",
      "Viscosity",
      "Bernoulli's Principle",
      "Streamline Flow",
      "Reynolds Number"
    ]
  },
  {
    chapter: "Thermal Properties of Matter",
    topics: [
      "Temperature",
      "Heat",
      "Thermal Expansion",
      "Specific Heat Capacity",
      "Calorimetry",
      "Change of State",
      "Latent Heat",
      "Heat Transfer",
      "Newton's Law of Cooling"
    ]
  },
  {
    chapter: "Thermodynamics",
    topics: [
      "Thermal Equilibrium",
      "Internal Energy",
      "Work and Heat",
      "First Law of Thermodynamics",
      "Second Law of Thermodynamics",
      "Heat Engines",
      "Refrigerators",
      "Carnot Engine"
    ]
  },
  {
    chapter: "Kinetic Theory",
    topics: [
      "Molecular Nature of Matter",
      "Gas Laws",
      "Ideal Gas Equation",
      "Kinetic Theory of Gases",
      "Degrees of Freedom",
      "Mean Free Path",
      "Root Mean Square Speed"
    ]
  },
  {
    chapter: "Oscillations",
    topics: [
      "Periodic Motion",
      "Simple Harmonic Motion (SHM)",
      "Displacement",
      "Velocity and Acceleration in SHM",
      "Energy in SHM",
      "Spring-Mass System",
      "Simple Pendulum",
      "Damped Oscillations (Basic)"
    ]
  },
  {
    chapter: "Waves",
    topics: [
      "Wave Motion",
      "Types of Waves",
      "Transverse and Longitudinal Waves",
      "Wave Parameters",
      "Wave Equation",
      "Superposition Principle",
      "Standing Waves",
      "Beats",
      "Doppler Effect",
      "Sound Waves"
    ]
  }
];

async function seedPhysics() {
  await connectDB();
  console.log("Connected to MongoDB...");

  // Find PHYSICS subject (Entrance or Competitive)
  let subject: any = await Subject.findOne({ name: { $regex: /physics-1/i } });
  if (!subject) {
    subject = await Subject.findOne({ name: { $regex: /physics/i } });
  }

  if (!subject) {
    let compSub = await CompetitiveSubject.findOne({ name: { $regex: /physics/i } });
    if (compSub) {
      subject = compSub;
    }
  }

  if (!subject) {
    console.error("Subject PHYSICS-1(NEET) not found in database! Creating it...");
    subject = await Subject.create({
      name: "PHYSICS-1(NEET)",
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

  for (const item of physicsData) {
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

seedPhysics();
