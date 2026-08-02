import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Subject from './models/Subject';
import Chapter from './models/Chapter';
import { connectDB } from './config/db';

dotenv.config();

// ============================================================
// SYLLABUS DATA - 2026 Official (EAPCET AP/TG, NEET, JEE Main, JEE Advanced)
// ============================================================

const syllabusData = [

  // ============================================================
  // EAPCET - MPC STREAM (Both AP & TG same syllabus, state-wise separate)
  // ============================================================

  {
    name: 'Mathematics (EAPCET MPC)',
    subjectCategory: 'entrance',
    state: 'Both',
    chapters: [
      // 1st Year
      { name: 'Functions', description: '1A - Algebra' },
      { name: 'Mathematical Induction', description: '1A - Algebra' },
      { name: 'Matrices', description: '1A - Algebra' },
      { name: 'Complex Numbers', description: '1A - Algebra' },
      { name: "De Moivre's Theorem", description: '1A - Algebra' },
      { name: 'Quadratic Expressions', description: '1A - Algebra' },
      { name: 'Theory of Equations', description: '1A - Algebra' },
      { name: 'Permutations & Combinations', description: '1A - Algebra' },
      { name: 'Binomial Theorem', description: '1A - Algebra' },
      { name: 'Partial Fractions', description: '1A - Algebra' },
      { name: 'Trigonometric Ratios & Identities', description: '1A - Trigonometry' },
      { name: 'Trigonometric Equations', description: '1A - Trigonometry' },
      { name: 'Inverse Trigonometric Functions', description: '1A - Trigonometry' },
      { name: 'Hyperbolic Functions', description: '1A - Trigonometry' },
      { name: 'Properties of Triangles', description: '1A - Trigonometry' },
      { name: 'Addition of Vectors', description: '1A - Vector Algebra' },
      { name: 'Product of Vectors', description: '1A - Vector Algebra' },
      // 2nd Year
      { name: 'Locus', description: '2A - Coordinate Geometry' },
      { name: 'Transformation of Axes', description: '2A - Coordinate Geometry' },
      { name: 'Straight Lines', description: '2A - Coordinate Geometry' },
      { name: 'Pair of Straight Lines', description: '2A - Coordinate Geometry' },
      { name: 'Circles', description: '2A - Coordinate Geometry' },
      { name: 'System of Circles', description: '2A - Coordinate Geometry' },
      { name: 'Parabola', description: '2B - Conic Sections' },
      { name: 'Ellipse', description: '2B - Conic Sections' },
      { name: 'Hyperbola', description: '2B - Conic Sections' },
      { name: 'Limits & Continuity', description: '2B - Calculus' },
      { name: 'Differentiation', description: '2B - Calculus' },
      { name: 'Applications of Derivatives', description: '2B - Calculus' },
      { name: 'Integration', description: '2B - Calculus' },
      { name: 'Definite Integrals', description: '2B - Calculus' },
      { name: 'Differential Equations', description: '2B - Calculus' },
      { name: 'Measures of Dispersion', description: '2B - Statistics & Probability' },
      { name: 'Probability', description: '2B - Statistics & Probability' },
    ]
  },

  {
    name: 'Physics (EAPCET)',
    subjectCategory: 'entrance',
    state: 'Both',
    chapters: [
      // 1st Year
      { name: 'Physical World', description: '1st Year Physics' },
      { name: 'Units & Measurements', description: '1st Year Physics' },
      { name: 'Motion in a Straight Line', description: '1st Year Physics' },
      { name: 'Motion in a Plane', description: '1st Year Physics' },
      { name: 'Laws of Motion', description: '1st Year Physics' },
      { name: 'Work, Energy & Power', description: '1st Year Physics' },
      { name: 'Systems of Particles & Rotational Motion', description: '1st Year Physics' },
      { name: 'Oscillations', description: '1st Year Physics' },
      { name: 'Gravitation', description: '1st Year Physics' },
      { name: 'Mechanical Properties of Solids', description: '1st Year Physics' },
      { name: 'Mechanical Properties of Fluids', description: '1st Year Physics' },
      { name: 'Thermal Properties of Matter', description: '1st Year Physics' },
      { name: 'Thermodynamics', description: '1st Year Physics' },
      { name: 'Kinetic Theory of Gases', description: '1st Year Physics' },
      { name: 'Waves', description: '1st Year Physics' },
      // 2nd Year
      { name: 'Electric Charges & Fields', description: '2nd Year Physics' },
      { name: 'Electrostatic Potential & Capacitance', description: '2nd Year Physics' },
      { name: 'Current Electricity', description: '2nd Year Physics' },
      { name: 'Moving Charges & Magnetism', description: '2nd Year Physics' },
      { name: 'Magnetism & Matter', description: '2nd Year Physics' },
      { name: 'Electromagnetic Induction', description: '2nd Year Physics' },
      { name: 'Alternating Current', description: '2nd Year Physics' },
      { name: 'Electromagnetic Waves', description: '2nd Year Physics' },
      { name: 'Ray Optics & Optical Instruments', description: '2nd Year Physics' },
      { name: 'Wave Optics', description: '2nd Year Physics' },
      { name: 'Dual Nature of Radiation & Matter', description: '2nd Year Physics' },
      { name: 'Atoms', description: '2nd Year Physics' },
      { name: 'Nuclei', description: '2nd Year Physics' },
      { name: 'Semiconductor Electronics', description: '2nd Year Physics' },
      { name: 'Communication Systems', description: '2nd Year Physics' },
    ]
  },

  {
    name: 'Chemistry (EAPCET)',
    subjectCategory: 'entrance',
    state: 'Both',
    chapters: [
      // 1st Year
      { name: 'Atomic Structure', description: '1st Year Chemistry' },
      { name: 'Classification of Elements & Periodicity', description: '1st Year Chemistry' },
      { name: 'Chemical Bonding & Molecular Structure', description: '1st Year Chemistry' },
      { name: 'States of Matter: Gases & Liquids', description: '1st Year Chemistry' },
      { name: 'Stoichiometry', description: '1st Year Chemistry' },
      { name: 'Thermodynamics', description: '1st Year Chemistry' },
      { name: 'Chemical Equilibrium & Acids-Bases', description: '1st Year Chemistry' },
      { name: 'Hydrogen & Its Compounds', description: '1st Year Chemistry' },
      { name: 's-Block Elements', description: '1st Year Chemistry' },
      { name: 'p-Block Elements (Groups 13 & 14)', description: '1st Year Chemistry' },
      { name: 'Environmental Chemistry', description: '1st Year Chemistry' },
      { name: 'Organic Chemistry - Basic Principles', description: '1st Year Chemistry' },
      { name: 'Hydrocarbons', description: '1st Year Chemistry' },
      // 2nd Year
      { name: 'Solid State', description: '2nd Year Chemistry' },
      { name: 'Solutions', description: '2nd Year Chemistry' },
      { name: 'Electrochemistry', description: '2nd Year Chemistry' },
      { name: 'Chemical Kinetics', description: '2nd Year Chemistry' },
      { name: 'Surface Chemistry', description: '2nd Year Chemistry' },
      { name: 'Metallurgy', description: '2nd Year Chemistry' },
      { name: 'p-Block Elements (Groups 15-18)', description: '2nd Year Chemistry' },
      { name: 'd & f Block Elements', description: '2nd Year Chemistry' },
      { name: 'Coordination Compounds', description: '2nd Year Chemistry' },
      { name: 'Haloalkanes & Haloarenes', description: '2nd Year Chemistry' },
      { name: 'Alcohols, Phenols & Ethers', description: '2nd Year Chemistry' },
      { name: 'Aldehydes, Ketones & Carboxylic Acids', description: '2nd Year Chemistry' },
      { name: 'Organic Compounds Containing Nitrogen', description: '2nd Year Chemistry' },
      { name: 'Biomolecules', description: '2nd Year Chemistry' },
      { name: 'Polymers', description: '2nd Year Chemistry' },
      { name: 'Chemistry in Everyday Life', description: '2nd Year Chemistry' },
    ]
  },

  // ============================================================
  // EAPCET - BiPC STREAM
  // ============================================================

  {
    name: 'Botany (EAPCET BiPC)',
    subjectCategory: 'entrance',
    state: 'Both',
    chapters: [
      // 1st Year Botany
      { name: 'Diversity in the Living World', description: '1st Year Botany' },
      { name: 'Plant Kingdom', description: '1st Year Botany' },
      { name: 'Morphology of Flowering Plants', description: '1st Year Botany' },
      { name: 'Cell: The Unit of Life', description: '1st Year Botany' },
      { name: 'Cell Cycle & Cell Division', description: '1st Year Botany' },
      { name: 'Transport in Plants', description: '1st Year Botany' },
      { name: 'Mineral Nutrition', description: '1st Year Botany' },
      { name: 'Photosynthesis in Higher Plants', description: '1st Year Botany' },
      { name: 'Respiration in Plants', description: '1st Year Botany' },
      { name: 'Plant Growth & Development', description: '1st Year Botany' },
      // 2nd Year Botany
      { name: 'Reproduction in Organisms', description: '2nd Year Botany' },
      { name: 'Sexual Reproduction in Flowering Plants', description: '2nd Year Botany' },
      { name: 'Genetics: Principles of Inheritance', description: '2nd Year Botany' },
      { name: 'Molecular Basis of Inheritance', description: '2nd Year Botany' },
      { name: 'Evolution', description: '2nd Year Botany' },
      { name: 'Microbes in Human Welfare', description: '2nd Year Botany' },
      { name: 'Biotechnology: Principles & Processes', description: '2nd Year Botany' },
      { name: 'Biotechnology & Its Applications', description: '2nd Year Botany' },
      { name: 'Organisms & Populations (Ecology)', description: '2nd Year Botany' },
      { name: 'Ecosystem', description: '2nd Year Botany' },
      { name: 'Biodiversity & Conservation', description: '2nd Year Botany' },
      { name: 'Environmental Issues', description: '2nd Year Botany' },
    ]
  },

  {
    name: 'Zoology (EAPCET BiPC)',
    subjectCategory: 'entrance',
    state: 'Both',
    chapters: [
      // 1st Year Zoology
      { name: 'Animal Kingdom (Classification)', description: '1st Year Zoology' },
      { name: 'Structural Organisation in Animals', description: '1st Year Zoology' },
      { name: 'Locomotion & Movement in Protozoa', description: '1st Year Zoology' },
      { name: 'Biomolecules', description: '1st Year Zoology' },
      { name: 'Digestion & Absorption', description: '1st Year Zoology' },
      { name: 'Breathing & Exchange of Gases', description: '1st Year Zoology' },
      { name: 'Body Fluids & Circulation', description: '1st Year Zoology' },
      { name: 'Excretory Products & Their Elimination', description: '1st Year Zoology' },
      { name: 'Locomotion & Movement', description: '1st Year Zoology' },
      { name: 'Neural Control & Coordination', description: '1st Year Zoology' },
      { name: 'Chemical Coordination & Integration', description: '1st Year Zoology' },
      // 2nd Year Zoology
      { name: 'Human Reproduction', description: '2nd Year Zoology' },
      { name: 'Reproductive Health', description: '2nd Year Zoology' },
      { name: 'Inheritance & Variation', description: '2nd Year Zoology' },
      { name: 'Molecular Basis of Inheritance', description: '2nd Year Zoology' },
      { name: 'Evolution & Origin of Life', description: '2nd Year Zoology' },
      { name: 'Human Health & Disease', description: '2nd Year Zoology' },
      { name: 'Strategies for Enhancement in Food Production', description: '2nd Year Zoology' },
      { name: 'Applied Biology - Sericulture', description: '2nd Year Zoology' },
      { name: 'Applied Biology - Aquaculture', description: '2nd Year Zoology' },
    ]
  },

  // ============================================================
  // NEET - Physics, Chemistry, Biology
  // ============================================================

  {
    name: 'Physics (NEET)',
    subjectCategory: 'entrance',
    state: 'Both',
    chapters: [
      // Class 11
      { name: 'Physical World & Measurement', description: 'Class 11 - NEET Physics' },
      { name: 'Kinematics', description: 'Class 11 - NEET Physics' },
      { name: 'Laws of Motion', description: 'Class 11 - NEET Physics' },
      { name: 'Work, Energy & Power', description: 'Class 11 - NEET Physics' },
      { name: 'Motion of Systems of Particles & Rigid Bodies', description: 'Class 11 - NEET Physics' },
      { name: 'Gravitation', description: 'Class 11 - NEET Physics' },
      { name: 'Properties of Bulk Matter', description: 'Class 11 - NEET Physics' },
      { name: 'Thermodynamics', description: 'Class 11 - NEET Physics' },
      { name: 'Behaviour of Perfect Gas & Kinetic Theory', description: 'Class 11 - NEET Physics' },
      { name: 'Oscillations & Waves', description: 'Class 11 - NEET Physics' },
      // Class 12
      { name: 'Electrostatics', description: 'Class 12 - NEET Physics' },
      { name: 'Current Electricity', description: 'Class 12 - NEET Physics' },
      { name: 'Magnetic Effects of Current & Magnetism', description: 'Class 12 - NEET Physics' },
      { name: 'Electromagnetic Induction & Alternating Currents', description: 'Class 12 - NEET Physics' },
      { name: 'Electromagnetic Waves', description: 'Class 12 - NEET Physics' },
      { name: 'Optics', description: 'Class 12 - NEET Physics' },
      { name: 'Dual Nature of Matter & Radiation', description: 'Class 12 - NEET Physics' },
      { name: 'Atoms & Nuclei', description: 'Class 12 - NEET Physics' },
      { name: 'Electronic Devices', description: 'Class 12 - NEET Physics' },
    ]
  },

  {
    name: 'Chemistry (NEET)',
    subjectCategory: 'entrance',
    state: 'Both',
    chapters: [
      // Class 11
      { name: 'Some Basic Concepts of Chemistry', description: 'Class 11 - NEET Chemistry' },
      { name: 'Structure of Atom', description: 'Class 11 - NEET Chemistry' },
      { name: 'Classification of Elements & Periodicity', description: 'Class 11 - NEET Chemistry' },
      { name: 'Chemical Bonding & Molecular Structure', description: 'Class 11 - NEET Chemistry' },
      { name: 'States of Matter', description: 'Class 11 - NEET Chemistry' },
      { name: 'Thermodynamics', description: 'Class 11 - NEET Chemistry' },
      { name: 'Equilibrium', description: 'Class 11 - NEET Chemistry' },
      { name: 'Redox Reactions', description: 'Class 11 - NEET Chemistry' },
      { name: 'Hydrogen', description: 'Class 11 - NEET Chemistry' },
      { name: 's-Block Elements (Alkali & Alkaline Earth Metals)', description: 'Class 11 - NEET Chemistry' },
      { name: 'Some p-Block Elements', description: 'Class 11 - NEET Chemistry' },
      { name: 'Organic Chemistry - Basic Principles', description: 'Class 11 - NEET Chemistry' },
      { name: 'Hydrocarbons', description: 'Class 11 - NEET Chemistry' },
      { name: 'Environmental Chemistry', description: 'Class 11 - NEET Chemistry' },
      // Class 12
      { name: 'Solid State', description: 'Class 12 - NEET Chemistry' },
      { name: 'Solutions', description: 'Class 12 - NEET Chemistry' },
      { name: 'Electrochemistry', description: 'Class 12 - NEET Chemistry' },
      { name: 'Chemical Kinetics', description: 'Class 12 - NEET Chemistry' },
      { name: 'Surface Chemistry', description: 'Class 12 - NEET Chemistry' },
      { name: 'General Principles & Processes of Isolation of Elements', description: 'Class 12 - NEET Chemistry' },
      { name: 'p-Block Elements', description: 'Class 12 - NEET Chemistry' },
      { name: 'd & f Block Elements', description: 'Class 12 - NEET Chemistry' },
      { name: 'Coordination Compounds', description: 'Class 12 - NEET Chemistry' },
      { name: 'Haloalkanes & Haloarenes', description: 'Class 12 - NEET Chemistry' },
      { name: 'Alcohols, Phenols & Ethers', description: 'Class 12 - NEET Chemistry' },
      { name: 'Aldehydes, Ketones & Carboxylic Acids', description: 'Class 12 - NEET Chemistry' },
      { name: 'Amines', description: 'Class 12 - NEET Chemistry' },
      { name: 'Biomolecules', description: 'Class 12 - NEET Chemistry' },
      { name: 'Polymers', description: 'Class 12 - NEET Chemistry' },
      { name: 'Chemistry in Everyday Life', description: 'Class 12 - NEET Chemistry' },
    ]
  },

  {
    name: 'Botany (NEET)',
    subjectCategory: 'entrance',
    state: 'Both',
    chapters: [
      { name: 'The Living World', description: 'Class 11 - NEET Botany' },
      { name: 'Biological Classification', description: 'Class 11 - NEET Botany' },
      { name: 'Plant Kingdom', description: 'Class 11 - NEET Botany' },
      { name: 'Morphology of Flowering Plants', description: 'Class 11 - NEET Botany' },
      { name: 'Anatomy of Flowering Plants', description: 'Class 11 - NEET Botany' },
      { name: 'Cell: The Unit of Life', description: 'Class 11 - NEET Botany' },
      { name: 'Cell Cycle & Cell Division', description: 'Class 11 - NEET Botany' },
      { name: 'Transport in Plants', description: 'Class 11 - NEET Botany' },
      { name: 'Mineral Nutrition', description: 'Class 11 - NEET Botany' },
      { name: 'Photosynthesis in Higher Plants', description: 'Class 11 - NEET Botany' },
      { name: 'Respiration in Plants', description: 'Class 11 - NEET Botany' },
      { name: 'Plant Growth & Development', description: 'Class 11 - NEET Botany' },
      { name: 'Sexual Reproduction in Flowering Plants', description: 'Class 12 - NEET Botany' },
      { name: 'Principles of Inheritance & Variation', description: 'Class 12 - NEET Botany' },
      { name: 'Molecular Basis of Inheritance', description: 'Class 12 - NEET Botany' },
      { name: 'Evolution', description: 'Class 12 - NEET Botany' },
      { name: 'Microbes in Human Welfare', description: 'Class 12 - NEET Botany' },
      { name: 'Biotechnology: Principles & Processes', description: 'Class 12 - NEET Botany' },
      { name: 'Biotechnology & Its Applications', description: 'Class 12 - NEET Botany' },
      { name: 'Organisms & Populations', description: 'Class 12 - NEET Botany' },
      { name: 'Ecosystem', description: 'Class 12 - NEET Botany' },
      { name: 'Biodiversity & Conservation', description: 'Class 12 - NEET Botany' },
      { name: 'Environmental Issues', description: 'Class 12 - NEET Botany' },
    ]
  },

  {
    name: 'Zoology (NEET)',
    subjectCategory: 'entrance',
    state: 'Both',
    chapters: [
      { name: 'Animal Kingdom', description: 'Class 11 - NEET Zoology' },
      { name: 'Structural Organisation in Animals', description: 'Class 11 - NEET Zoology' },
      { name: 'Biomolecules', description: 'Class 11 - NEET Zoology' },
      { name: 'Digestion & Absorption', description: 'Class 11 - NEET Zoology' },
      { name: 'Breathing & Exchange of Gases', description: 'Class 11 - NEET Zoology' },
      { name: 'Body Fluids & Circulation', description: 'Class 11 - NEET Zoology' },
      { name: 'Excretory Products & Their Elimination', description: 'Class 11 - NEET Zoology' },
      { name: 'Locomotion & Movement', description: 'Class 11 - NEET Zoology' },
      { name: 'Neural Control & Coordination', description: 'Class 11 - NEET Zoology' },
      { name: 'Chemical Coordination & Integration', description: 'Class 11 - NEET Zoology' },
      { name: 'Reproduction in Organisms', description: 'Class 12 - NEET Zoology' },
      { name: 'Human Reproduction', description: 'Class 12 - NEET Zoology' },
      { name: 'Reproductive Health', description: 'Class 12 - NEET Zoology' },
      { name: 'Human Health & Disease', description: 'Class 12 - NEET Zoology' },
      { name: 'Strategies for Enhancement in Food Production', description: 'Class 12 - NEET Zoology' },
      { name: 'Evolution', description: 'Class 12 - NEET Zoology' },
    ]
  },

  // ============================================================
  // JEE MAINS - Physics, Chemistry, Mathematics
  // ============================================================

  {
    name: 'Physics (JEE Mains)',
    subjectCategory: 'entrance',
    state: 'Both',
    chapters: [
      { name: 'Units, Dimensions & Measurement', description: 'JEE Main Physics' },
      { name: 'Kinematics', description: 'JEE Main Physics' },
      { name: 'Newton\'s Laws of Motion', description: 'JEE Main Physics' },
      { name: 'Work, Energy & Power', description: 'JEE Main Physics' },
      { name: 'Centre of Mass, Impulse & Momentum', description: 'JEE Main Physics' },
      { name: 'Rotational Dynamics', description: 'JEE Main Physics' },
      { name: 'Gravitation', description: 'JEE Main Physics' },
      { name: 'Simple Harmonic Motion', description: 'JEE Main Physics' },
      { name: 'Mechanical Properties of Solids & Fluids', description: 'JEE Main Physics' },
      { name: 'Thermal Properties, Calorimetry & Kinetic Theory', description: 'JEE Main Physics' },
      { name: 'Thermodynamics', description: 'JEE Main Physics' },
      { name: 'Waves & Sound', description: 'JEE Main Physics' },
      { name: 'Electrostatics', description: 'JEE Main Physics' },
      { name: 'Capacitance', description: 'JEE Main Physics' },
      { name: 'Current Electricity & Electrical Circuits', description: 'JEE Main Physics' },
      { name: 'Magnetic Field & Force', description: 'JEE Main Physics' },
      { name: 'Electromagnetic Induction', description: 'JEE Main Physics' },
      { name: 'Alternating Current', description: 'JEE Main Physics' },
      { name: 'Ray Optics', description: 'JEE Main Physics' },
      { name: 'Wave Optics', description: 'JEE Main Physics' },
      { name: 'Modern Physics - Photoelectric Effect', description: 'JEE Main Physics' },
      { name: 'Atomic Structure & Nuclear Physics', description: 'JEE Main Physics' },
      { name: 'Semiconductor Devices & Logic Gates', description: 'JEE Main Physics' },
      { name: 'Electromagnetic Waves & Communication', description: 'JEE Main Physics' },
      { name: 'Experimental Skills', description: 'JEE Main Physics' },
    ]
  },

  {
    name: 'Chemistry (JEE Mains)',
    subjectCategory: 'entrance',
    state: 'Both',
    chapters: [
      { name: 'Mole Concept & Stoichiometry', description: 'JEE Main Chemistry' },
      { name: 'Atomic Structure', description: 'JEE Main Chemistry' },
      { name: 'Periodic Table & Periodicity', description: 'JEE Main Chemistry' },
      { name: 'Chemical Bonding', description: 'JEE Main Chemistry' },
      { name: 'States of Matter', description: 'JEE Main Chemistry' },
      { name: 'Thermodynamics', description: 'JEE Main Chemistry' },
      { name: 'Chemical Equilibrium', description: 'JEE Main Chemistry' },
      { name: 'Ionic Equilibrium', description: 'JEE Main Chemistry' },
      { name: 'Redox Reactions & Electrochemistry', description: 'JEE Main Chemistry' },
      { name: 'Chemical Kinetics', description: 'JEE Main Chemistry' },
      { name: 'Solutions & Colligative Properties', description: 'JEE Main Chemistry' },
      { name: 'Solid State', description: 'JEE Main Chemistry' },
      { name: 'Surface Chemistry', description: 'JEE Main Chemistry' },
      { name: 'Hydrogen & s-Block Elements', description: 'JEE Main Chemistry' },
      { name: 'p-Block Elements (Group 13-18)', description: 'JEE Main Chemistry' },
      { name: 'd & f Block Elements', description: 'JEE Main Chemistry' },
      { name: 'Coordination Compounds', description: 'JEE Main Chemistry' },
      { name: 'Metallurgy & Environmental Chemistry', description: 'JEE Main Chemistry' },
      { name: 'Basic Organic Chemistry & IUPAC', description: 'JEE Main Chemistry' },
      { name: 'Hydrocarbons', description: 'JEE Main Chemistry' },
      { name: 'Haloalkanes & Haloarenes', description: 'JEE Main Chemistry' },
      { name: 'Alcohols, Phenols & Ethers', description: 'JEE Main Chemistry' },
      { name: 'Aldehydes, Ketones & Carboxylic Acids', description: 'JEE Main Chemistry' },
      { name: 'Amines & Diazonium Salts', description: 'JEE Main Chemistry' },
      { name: 'Biomolecules', description: 'JEE Main Chemistry' },
      { name: 'Polymers & Chemistry in Everyday Life', description: 'JEE Main Chemistry' },
    ]
  },

  {
    name: 'Mathematics (JEE Mains)',
    subjectCategory: 'entrance',
    state: 'Both',
    chapters: [
      { name: 'Sets, Relations & Functions', description: 'JEE Main Mathematics' },
      { name: 'Complex Numbers', description: 'JEE Main Mathematics' },
      { name: 'Matrices & Determinants', description: 'JEE Main Mathematics' },
      { name: 'Quadratic Equations & Inequalities', description: 'JEE Main Mathematics' },
      { name: 'Permutations & Combinations', description: 'JEE Main Mathematics' },
      { name: 'Binomial Theorem', description: 'JEE Main Mathematics' },
      { name: 'Sequences & Series', description: 'JEE Main Mathematics' },
      { name: 'Trigonometric Functions & Equations', description: 'JEE Main Mathematics' },
      { name: 'Inverse Trigonometric Functions', description: 'JEE Main Mathematics' },
      { name: 'Straight Lines & Pair of Straight Lines', description: 'JEE Main Mathematics' },
      { name: 'Circles', description: 'JEE Main Mathematics' },
      { name: 'Parabola', description: 'JEE Main Mathematics' },
      { name: 'Ellipse', description: 'JEE Main Mathematics' },
      { name: 'Hyperbola', description: 'JEE Main Mathematics' },
      { name: 'Vectors', description: 'JEE Main Mathematics' },
      { name: '3D Geometry', description: 'JEE Main Mathematics' },
      { name: 'Limits, Continuity & Differentiability', description: 'JEE Main Mathematics' },
      { name: 'Applications of Derivatives', description: 'JEE Main Mathematics' },
      { name: 'Indefinite Integration', description: 'JEE Main Mathematics' },
      { name: 'Definite Integration & Area Under Curves', description: 'JEE Main Mathematics' },
      { name: 'Differential Equations', description: 'JEE Main Mathematics' },
      { name: 'Probability & Statistics', description: 'JEE Main Mathematics' },
      { name: 'Mathematical Reasoning', description: 'JEE Main Mathematics' },
    ]
  },

  // ============================================================
  // JEE ADVANCED - Physics, Chemistry, Mathematics
  // ============================================================

  {
    name: 'Physics (JEE Advanced)',
    subjectCategory: 'entrance',
    state: 'Both',
    chapters: [
      { name: 'General Physics & Measurement', description: 'JEE Advanced Physics' },
      { name: 'Mechanics - Kinematics & Dynamics', description: 'JEE Advanced Physics' },
      { name: 'Systems of Particles - Centre of Mass', description: 'JEE Advanced Physics' },
      { name: 'Rigid Body Dynamics & Torque', description: 'JEE Advanced Physics' },
      { name: 'Gravitation & Orbital Mechanics', description: 'JEE Advanced Physics' },
      { name: 'Simple Harmonic Motion & Waves', description: 'JEE Advanced Physics' },
      { name: 'Properties of Matter & Fluid Mechanics', description: 'JEE Advanced Physics' },
      { name: 'Thermal Physics & Kinetic Theory', description: 'JEE Advanced Physics' },
      { name: 'Thermodynamics - Laws & Processes', description: 'JEE Advanced Physics' },
      { name: 'Electricity - Coulomb\'s Law to Gauss\'s Law', description: 'JEE Advanced Physics' },
      { name: 'Capacitors & Dielectrics (Advanced)', description: 'JEE Advanced Physics' },
      { name: 'Current Electricity - Kirchhoff & Networks', description: 'JEE Advanced Physics' },
      { name: 'Magnetic Force, Biot-Savart & Ampere', description: 'JEE Advanced Physics' },
      { name: 'Electromagnetic Induction - Faraday & Lenz', description: 'JEE Advanced Physics' },
      { name: 'Electromagnetic Waves', description: 'JEE Advanced Physics' },
      { name: 'Optics - Geometrical & Physical (Advanced)', description: 'JEE Advanced Physics' },
      { name: 'Modern Physics - Photoelectric & Atomic Models', description: 'JEE Advanced Physics' },
      { name: 'Nuclear Physics & Radioactivity', description: 'JEE Advanced Physics' },
    ]
  },

  {
    name: 'Chemistry (JEE Advanced)',
    subjectCategory: 'entrance',
    state: 'Both',
    chapters: [
      { name: 'Mole Concept, Stoichiometry & Gravimetric Analysis', description: 'JEE Advanced Chemistry' },
      { name: 'Atomic Structure & Quantum Mechanics', description: 'JEE Advanced Chemistry' },
      { name: 'Chemical Bonding - VBT, MOT & VSEPR', description: 'JEE Advanced Chemistry' },
      { name: 'Thermodynamics & Thermochemistry', description: 'JEE Advanced Chemistry' },
      { name: 'Chemical & Ionic Equilibrium', description: 'JEE Advanced Chemistry' },
      { name: 'Electrochemistry (Advanced)', description: 'JEE Advanced Chemistry' },
      { name: 'Chemical Kinetics & Nuclear Chemistry', description: 'JEE Advanced Chemistry' },
      { name: 'Solid State & Solutions', description: 'JEE Advanced Chemistry' },
      { name: 'Surface Chemistry & Catalysis', description: 'JEE Advanced Chemistry' },
      { name: 'Non-Metals - Hydrogen to p-Block', description: 'JEE Advanced Chemistry' },
      { name: 'd & f Block Elements (Advanced)', description: 'JEE Advanced Chemistry' },
      { name: 'Coordination Compounds & Isomerism', description: 'JEE Advanced Chemistry' },
      { name: 'Qualitative Analysis & Extractive Metallurgy', description: 'JEE Advanced Chemistry' },
      { name: 'Organic Reactions - Mechanism & Stereochemistry', description: 'JEE Advanced Chemistry' },
      { name: 'Hydrocarbons - Alkanes to Aromatics', description: 'JEE Advanced Chemistry' },
      { name: 'Halogen Compounds - SN1, SN2 & Elimination', description: 'JEE Advanced Chemistry' },
      { name: 'Oxygen-Containing Compounds (Alcohols to Acids)', description: 'JEE Advanced Chemistry' },
      { name: 'Nitrogen Compounds - Amines & Diazonium', description: 'JEE Advanced Chemistry' },
      { name: 'Biomolecules - Carbohydrates, Proteins, Nucleic Acids', description: 'JEE Advanced Chemistry' },
    ]
  },

  {
    name: 'Mathematics (JEE Advanced)',
    subjectCategory: 'entrance',
    state: 'Both',
    chapters: [
      { name: 'Algebra - Sets, Relations & Functions', description: 'JEE Advanced Mathematics' },
      { name: 'Algebra - Complex Numbers & Polynomials', description: 'JEE Advanced Mathematics' },
      { name: 'Matrices & Determinants (Advanced)', description: 'JEE Advanced Mathematics' },
      { name: 'Probability & Statistics (Advanced)', description: 'JEE Advanced Mathematics' },
      { name: 'Trigonometry - Functions & Equations', description: 'JEE Advanced Mathematics' },
      { name: 'Properties of Triangles & Inverse Trig', description: 'JEE Advanced Mathematics' },
      { name: 'Analytical Geometry - Straight Lines & Circles', description: 'JEE Advanced Mathematics' },
      { name: 'Conic Sections - Parabola, Ellipse & Hyperbola', description: 'JEE Advanced Mathematics' },
      { name: '3D Geometry - Lines, Planes & Distances', description: 'JEE Advanced Mathematics' },
      { name: 'Differential Calculus - Limits & Continuity', description: 'JEE Advanced Mathematics' },
      { name: 'Differential Calculus - Differentiation & Applications', description: 'JEE Advanced Mathematics' },
      { name: 'Integral Calculus - Indefinite & Definite', description: 'JEE Advanced Mathematics' },
      { name: 'Integral Calculus - Area & Differential Equations', description: 'JEE Advanced Mathematics' },
      { name: 'Vectors - Dot, Cross & Scalar Triple Product', description: 'JEE Advanced Mathematics' },
    ]
  },
];

// ============================================================
// SEED FUNCTION
// ============================================================

const seedSyllabus = async () => {
  try {
    await connectDB();
    console.log('✅ Connected to DB');

    let totalSubjects = 0;
    let totalChapters = 0;

    for (const subjectData of syllabusData) {
      // Check if subject already exists
      let existingSubject = await Subject.findOne({ name: subjectData.name });

      if (!existingSubject) {
        existingSubject = await Subject.create({
          name: subjectData.name,
          subjectCategory: subjectData.subjectCategory,
          state: subjectData.state,
        });
        console.log(`  ✅ Subject created: ${subjectData.name}`);
        totalSubjects++;
      } else {
        console.log(`  ⏭️  Subject already exists: ${subjectData.name}`);
      }

      // Add chapters for this subject
      for (const chapterData of subjectData.chapters) {
        const existingChapter = await Chapter.findOne({
          title: chapterData.name,
          subjectId: existingSubject._id,
        });

        if (!existingChapter) {
          await Chapter.create({
            title: chapterData.name,
            subjectId: existingSubject._id,
          });
          totalChapters++;
        }
      }
      console.log(`    📚 ${subjectData.chapters.length} chapters processed for ${subjectData.name}`);
    }

    console.log('\n🎉 Seed Complete!');
    console.log(`   Subjects created: ${totalSubjects}`);
    console.log(`   Chapters created: ${totalChapters}`);
    console.log('\n📌 Next Steps:');
    console.log('   1. Admin Panel → Courses/Plans tab');
    console.log('   2. Edit each course → select subjects from the list');
    console.log('   3. Students will see only their course subjects in Syllabus\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed Error:', error);
    process.exit(1);
  }
};

seedSyllabus();
