import dotenv from 'dotenv';
import { connectDB } from './config/db';
import Exam from './models/Exam';
import Plan from './models/Plan';

dotenv.config();

async function run() {
  await connectDB();
  const bothExams = await Exam.find({ state: 'Both', type: 'entrance' });
  console.log('Found legacy Both entrance exams in MongoDB:', bothExams.length);

  for (const ex of bothExams) {
    const existingPlan = await Plan.findOne({ examId: ex._id });
    const price = existingPlan ? existingPlan.price : 0;
    const baseName = ex.name.replace(/\s*\((AP|TG|Both)\)\s*/gi, '').trim();
    const baseId = ex.examId ? ex.examId.replace(/-(ap|tg|both).*$/gi, '') : baseName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    // Create AP Exam
    const apExam = await Exam.create({
      name: `${baseName} (AP)`,
      type: 'entrance',
      categoryId: ex.categoryId,
      description: ex.description || '',
      examId: `${baseId}-ap-${Date.now().toString().slice(-4)}`,
      state: 'AP',
      allowedStudentTypes: ex.allowedStudentTypes || []
    });
    await Plan.create({
      examId: apExam._id,
      name: `${apExam.name} Plan`,
      price: price,
      description: `Full access plan for ${apExam.name}`
    });

    // Create TG Exam
    const tgExam = await Exam.create({
      name: `${baseName} (TG)`,
      type: 'entrance',
      categoryId: ex.categoryId,
      description: ex.description || '',
      examId: `${baseId}-tg-${Date.now().toString().slice(-4)}`,
      state: 'TG',
      allowedStudentTypes: ex.allowedStudentTypes || []
    });
    await Plan.create({
      examId: tgExam._id,
      name: `${tgExam.name} Plan`,
      price: price,
      description: `Full access plan for ${tgExam.name}`
    });

    // Delete old Both exam & plan
    await Plan.deleteMany({ examId: ex._id });
    await Exam.deleteOne({ _id: ex._id });
    console.log(`Migrated "${ex.name}" into separate AP and TG course plans.`);
  }

  console.log('Migration complete!');
  process.exit(0);
}

run();
