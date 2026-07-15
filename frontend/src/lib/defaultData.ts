import { doc, setDoc, writeBatch, collection, getDocs, limit, query } from 'firebase/firestore';
import { db } from './firebase';
import { EntranceExam, CompetitiveExam, Subject, Chapter, Question, Test, Timetable, StudyMaterial, Announcement, Notification } from '../types';

// Default Entrance Exams
export const defaultEntranceExams: EntranceExam[] = [
  { id: 'tg-eapcet', name: 'TG EAPCET', description: 'Engineering, Agriculture and Medical Common Entrance Test for Telangana' },
  { id: 'ap-eapcet', name: 'AP EAPCET', description: 'Engineering, Agriculture and Pharmacy Common Entrance Test for Andhra Pradesh' },
  { id: 'neet', name: 'NEET', description: 'National Eligibility cum Entrance Test for Medical (UG)' },
  { id: 'jee-main', name: 'JEE Main', description: 'Joint Entrance Examination Main for premier engineering institutes' },
  { id: 'jee-advanced', name: 'JEE Advanced', description: 'Joint Entrance Examination Advanced for IIT admissions' }
];

// Default Competitive Exams
export const defaultCompetitiveExams: CompetitiveExam[] = [
  { id: 'upsc-civils', name: 'Civil Services (UPSC)', description: 'Union Public Service Commission civil services examination' },
  { id: 'ssc-cgl', name: 'SSC CGL', description: 'Staff Selection Commission - Combined Graduate Level Exam' }
];

// Default Subjects
export const defaultSubjects: Subject[] = [
  { id: 'physics', name: 'Physics', examIds: ['tg-eapcet', 'ap-eapcet', 'neet', 'jee-main', 'jee-advanced'], description: 'Mechanics, Electromagnetism, Optics and Modern Physics' },
  { id: 'chemistry', name: 'Chemistry', examIds: ['tg-eapcet', 'ap-eapcet', 'neet', 'jee-main', 'jee-advanced'], description: 'Organic, Inorganic and Physical Chemistry' },
  { id: 'mathematics', name: 'Mathematics', examIds: ['tg-eapcet', 'ap-eapcet', 'jee-main', 'jee-advanced'], description: 'Algebra, Calculus, Coordinate Geometry and Trigonometry' },
  { id: 'biology', name: 'Biology', examIds: ['neet'], description: 'Botany and Zoology' }
];

// Default Chapters
export const defaultChapters: Chapter[] = [
  // Physics
  { id: 'kinematics', subjectId: 'physics', name: 'Kinematics', description: 'Motion in one and two dimensions' },
  { id: 'motion', subjectId: 'physics', name: 'Motion', description: 'Newton\'s Laws, friction and work-energy' },
  { id: 'rotation', subjectId: 'physics', name: 'Rotation', description: 'Rigid body dynamics, torque and angular momentum' },
  // Chemistry
  { id: 'organic', subjectId: 'chemistry', name: 'Organic Chemistry', description: 'Hydrocarbons, functional groups and reaction mechanisms' },
  { id: 'physical', subjectId: 'chemistry', name: 'Physical Chemistry', description: 'Thermodynamics, chemical equilibrium and chemical kinetics' },
  { id: 'inorganic', subjectId: 'chemistry', name: 'Inorganic Chemistry', description: 'Periodic table, coordination compounds and bonding' },
  // Mathematics
  { id: 'algebra', subjectId: 'mathematics', name: 'Algebra', description: 'Matrices, determinants, complex numbers, and quadratic equations' },
  { id: 'calculus', subjectId: 'mathematics', name: 'Calculus', description: 'Limits, continuity, differentiation, integration, and differential equations' }
];

// Default Questions
export const defaultQuestions: Question[] = [
  // Kinematics (Physics)
  {
    id: 'q-kin-1',
    subjectId: 'physics',
    chapterId: 'kinematics',
    questionText: 'A ball is thrown vertically upwards with a velocity of 20 m/s from the top of a tower of height 25 m. How long does it take for the ball to hit the ground? (Take g = 10 m/s²)',
    options: [
      '2 seconds',
      '3 seconds',
      '5 seconds',
      '6 seconds'
    ],
    correctAnswerIndex: 2,
    explanation: 'Using the displacement equation: s = ut + 0.5 * a * t². Taking upwards as positive: s = -25 m, u = +20 m/s, a = -10 m/s². Thus, -25 = 20t - 5t² => 5t² - 20t - 25 = 0 => t² - 4t - 5 = 0 => (t - 5)(t + 1) = 0. Since time cannot be negative, t = 5 seconds.',
    difficulty: 'medium',
    marks: 4,
    negativeMarks: 1,
    tags: ['Equations of Motion', 'Gravity']
  },
  {
    id: 'q-kin-2',
    subjectId: 'physics',
    chapterId: 'kinematics',
    questionText: 'The displacement of a particle moving in a straight line is given by x = 2t³ - 5t² + 4t + 10 (where x is in meters and t is in seconds). What is the acceleration of the particle at t = 2 seconds?',
    options: [
      '10 m/s²',
      '14 m/s²',
      '16 m/s²',
      '24 m/s²'
    ],
    correctAnswerIndex: 1,
    explanation: 'Velocity v = dx/dt = 6t² - 10t + 4. Acceleration a = dv/dt = 12t - 10. At t = 2, a = 12(2) - 10 = 24 - 10 = 14 m/s².',
    difficulty: 'easy',
    marks: 4,
    negativeMarks: 1,
    tags: ['Derivatives', 'Acceleration']
  },
  // Rotation (Physics)
  {
    id: 'q-rot-1',
    subjectId: 'physics',
    chapterId: 'rotation',
    questionText: 'A thin uniform circular ring of mass M and radius R is rotating about its central axis perpendicular to its plane with an angular velocity ω. Two particles each of mass m are attached gently to the opposite ends of a diameter. What is the new angular velocity of the ring?',
    options: [
      'Mω / (M + 2m)',
      'Mω / (M + m)',
      '(M + 2m)ω / M',
      '(M - 2m)ω / (M + 2m)'
    ],
    correctAnswerIndex: 0,
    explanation: 'By Conservation of Angular Momentum: L_initial = L_final. Initial moment of inertia I_i = MR². Final moment of inertia I_f = MR² + 2mR². Therefore, I_i * ω_initial = I_f * ω_final => MR² * ω = (M + 2m)R² * ω_new => ω_new = Mω / (M + 2m).',
    difficulty: 'hard',
    marks: 4,
    negativeMarks: 1,
    tags: ['Angular Momentum', 'Moment of Inertia']
  },
  // Organic Chemistry (Chemistry)
  {
    id: 'q-org-1',
    subjectId: 'chemistry',
    chapterId: 'organic',
    questionText: 'Which of the following organic compounds is most acidic and why?',
    options: [
      'Ethanol',
      'Phenol',
      'Acetic Acid',
      'Water'
    ],
    correctAnswerIndex: 2,
    explanation: 'Acetic acid is the most acidic because its conjugate base (acetate ion) is stabilized by resonance with two equivalent electronegative oxygen atoms, which distributes the negative charge more effectively than in phenoxide.',
    difficulty: 'easy',
    marks: 4,
    negativeMarks: 1,
    tags: ['Acidity', 'Resonance Effect']
  },
  // Chemical Bonding (Chemistry)
  {
    id: 'q-bond-1',
    subjectId: 'chemistry',
    chapterId: 'inorganic',
    questionText: 'According to VSEPR theory, what is the shape and hybridization of the XeF₄ (Xenon Tetrafluoride) molecule?',
    options: [
      'Square Planar, sp³d²',
      'Tetrahedral, sp³',
      'Square Pyramidal, sp³d',
      'Octahedral, d²sp³'
    ],
    correctAnswerIndex: 0,
    explanation: 'Xenon has 8 valence electrons. In XeF₄, there are 4 single bonds with F and 2 lone pairs. Steric number = 4 + 2 = 6. Hybridization is sp³d². The electron geometry is octahedral, and the molecular shape is Square Planar to minimize lone pair-lone pair repulsion.',
    difficulty: 'medium',
    marks: 4,
    negativeMarks: 1,
    tags: ['VSEPR', 'Hybridization']
  },
  // Algebra (Mathematics)
  {
    id: 'q-alg-1',
    subjectId: 'mathematics',
    chapterId: 'algebra',
    questionText: 'If α and β are the roots of the equation x² - 5x + 6 = 0, find the value of α³ + β³.',
    options: [
      '35',
      '45',
      '65',
      '125'
    ],
    correctAnswerIndex: 0,
    explanation: 'Sum of roots α + β = 5. Product of roots αβ = 6. We know α³ + β³ = (α + β)³ - 3αβ(α + β). Substituting values: α³ + β³ = 5³ - 3(6)(5) = 125 - 90 = 35.',
    difficulty: 'easy',
    marks: 4,
    negativeMarks: 1,
    tags: ['Roots of Quadratic', 'Identities']
  },
  // Calculus (Mathematics)
  {
    id: 'q-calc-1',
    subjectId: 'mathematics',
    chapterId: 'calculus',
    questionText: 'What is the limit of (sin x - x) / x³ as x approaches 0?',
    options: [
      '0',
      '1/6',
      '-1/6',
      'does not exist'
    ],
    correctAnswerIndex: 2,
    explanation: 'Using the Taylor Series expansion of sin x near 0: sin x = x - x³/6 + O(x⁵). So, (sin x - x) / x³ = (-x³/6) / x³ = -1/6.',
    difficulty: 'hard',
    marks: 4,
    negativeMarks: 1,
    tags: ['Limits', 'L\'Hospital\'s Rule']
  }
];

// Default Tests
export const defaultTests: Test[] = [
  {
    id: 'test-weekly-1',
    title: 'Weekly Practice Test: Kinematics & Algebra',
    description: 'Weekly test evaluating core components of 1D/2D kinematics in Physics and quadratic equations in Mathematics.',
    type: 'weekly',
    duration: 15,
    totalMarks: 12,
    negativeMarking: true,
    isFullSyllabus: false,
    questionIds: ['q-kin-1', 'q-kin-2', 'q-alg-1'],
    createdAt: new Date().toISOString()
  },
  {
    id: 'test-monthly-1',
    title: 'Monthly Grand Test: Physics, Chemistry & Math',
    description: 'Comprehensive monthly exam assessing multiple chapters across all three core technical subjects.',
    type: 'monthly',
    duration: 30,
    totalMarks: 24,
    negativeMarking: true,
    isFullSyllabus: true,
    questionIds: ['q-kin-1', 'q-kin-2', 'q-rot-1', 'q-org-1', 'q-bond-1', 'q-alg-1'],
    createdAt: new Date().toISOString()
  }
];

// Default Timetables
export const defaultTimetables: Timetable[] = [
  {
    id: 't1',
    examId: 'jee-main',
    studentType: 'long_term',
    studyPlan: 'yearly',
    subjectId: 'physics',
    chapterId: 'kinematics',
    date: new Date().toISOString().split('T')[0], // Today
    title: 'Morning Kinematics Mastery Session',
    studyTopic: 'Revise uniform and non-uniform accelerated motion formulas. Solve 20 practice questions from Relative Velocity and Projectile Motion.',
    practiceMCQsCount: 15,
    revisionTopic: 'Relative Motion in 2D (Boat-River and Rain-Umbrella Problems)',
    assignment: 'Complete Assignment 3 on equations of motion.'
  },
  {
    id: 't2',
    examId: 'jee-main',
    studentType: 'long_term',
    studyPlan: 'yearly',
    subjectId: 'mathematics',
    chapterId: 'algebra',
    date: new Date().toISOString().split('T')[0], // Today
    title: 'Afternoon Algebra Core Concepts',
    studyTopic: 'Solve quadratic equations involving complex coefficients and study the behavior/graphs of quadratic functions.',
    practiceMCQsCount: 10,
    revisionTopic: 'Sum and Product of Roots, Newton\'s Relations',
    assignment: 'Solve algebra quiz on section 2.'
  },
  {
    id: 't3',
    examId: 'jee-main',
    studentType: 'long_term',
    studyPlan: 'yearly',
    subjectId: 'chemistry',
    chapterId: 'organic',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
    title: 'Tomorrow: Organic Nomenclature & GOC',
    studyTopic: 'Study inductive, electromeric, resonance and hyperconjugation effects. Understand stability criteria of Carbocations/Carbanions.',
    practiceMCQsCount: 20,
    revisionTopic: 'IUPAC Nomenclature for polyfunctional group systems',
    assignment: 'Draw resonance structures for Phenoxide and Acetate ions.'
  }
];

// Default Study Materials
export const defaultStudyMaterials: StudyMaterial[] = [
  {
    id: 'sm-kin-1',
    examId: 'jee-main',
    subjectId: 'physics',
    chapterId: 'kinematics',
    type: 'pdf',
    title: 'Kinematics Absolute Revision Notes',
    url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop', // beautiful visual placeholder
    description: 'Super concise revision notes detailing every formula, graph, and core concept in Kinematics (1D, 2D and Projectile).'
  },
  {
    id: 'sm-alg-1',
    examId: 'jee-main',
    subjectId: 'mathematics',
    chapterId: 'algebra',
    type: 'notes',
    title: 'Algebra: Quadratic Equations Formula Sheet',
    url: 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=600&auto=format&fit=crop',
    description: 'A complete sheet compiling quadratic identities, common root conditions, range of quadratic expressions, and location of roots.'
  },
  {
    id: 'sm-org-1',
    examId: 'jee-main',
    subjectId: 'chemistry',
    chapterId: 'organic',
    type: 'link',
    title: 'Interactive General Organic Chemistry Guide',
    url: 'https://wikipedia.org/wiki/Organic_chemistry',
    description: 'A superb reference containing molecular orbital charts, resonance structures, and inductive stability animations.'
  }
];

// Default Announcements
export const defaultAnnouncements: Announcement[] = [
  {
    id: 'ann-1',
    title: 'Welcome to Ankurah Academic Core Portal!',
    content: 'We are thrilled to launch the new exam preparation environment. Explore customized study timetables, retrieve structured mock test evaluations, and monitor your progress trends with automated analytics.',
    targetExams: [], // all
    createdAt: '2026-07-15T08:00:00Z'
  },
  {
    id: 'ann-2',
    title: 'Upcoming High-Yield Revision Series',
    content: 'In preparation for upcoming national mock evaluations, we are publishing advanced Physics Mechanics sheets and Biology botany worksheets. Access them today under Study Materials.',
    targetExams: ['jee-main', 'neet'],
    createdAt: '2026-07-15T12:30:00Z'
  }
];

// Default Notifications (Sample alerts)
export const defaultNotifications: Notification[] = [
  {
    id: 'notif-1',
    userId: 'sample-student', // placeholder or will be populated per user
    title: 'Timetable Updated',
    message: 'Your personal daily revision slots have been updated by the academic coordinator.',
    isRead: false,
    createdAt: '2026-07-15T09:00:00Z'
  }
];

// Automated Seeding Function
export async function seedDatabaseIfEmpty() {
  try {
    // Check if entranceExams collection is empty as a quick indicator
    const examCheck = await getDocs(query(collection(db, 'entranceExams'), limit(1)));
    if (!examCheck.empty) {
      console.log('Database already populated, skipping auto-seed.');
      return;
    }

    console.log('Starting Firestore database seeding with default values...');
    const batch = writeBatch(db);

    // 1. Seed Entrance Exams
    for (const exam of defaultEntranceExams) {
      batch.set(doc(db, 'entranceExams', exam.id), exam);
    }

    // 2. Seed Competitive Exams
    for (const exam of defaultCompetitiveExams) {
      batch.set(doc(db, 'competitiveExams', exam.id), exam);
    }

    // 3. Seed Subjects
    for (const subj of defaultSubjects) {
      batch.set(doc(db, 'subjects', subj.id), subj);
    }

    // 4. Seed Chapters
    for (const ch of defaultChapters) {
      batch.set(doc(db, 'chapters', ch.id), ch);
    }

    // 5. Seed Questions
    for (const q of defaultQuestions) {
      batch.set(doc(db, 'questions', q.id), q);
    }

    // 6. Seed Tests
    for (const t of defaultTests) {
      batch.set(doc(db, 'tests', t.id), t);
    }

    // 7. Seed Timetables
    for (const tb of defaultTimetables) {
      batch.set(doc(db, 'timetables', tb.id), tb);
    }

    // 8. Seed Study Materials
    for (const sm of defaultStudyMaterials) {
      batch.set(doc(db, 'studyMaterials', sm.id), sm);
    }

    // 9. Seed Announcements
    for (const ann of defaultAnnouncements) {
      batch.set(doc(db, 'announcements', ann.id), ann);
    }

    // Commit batch
    await batch.commit();
    console.log('Database seeded successfully with default academic content!');
  } catch (error) {
    console.error('Error during database seeding:', error);
  }
}
