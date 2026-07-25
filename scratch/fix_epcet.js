const mongoose = require('mongoose');
require('dotenv').config({ path: 'backend/.env' });

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/ankurah';

async function run() {
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  const Exam = mongoose.model('Exam', new mongoose.Schema({ name: String }));
  const Plan = mongoose.model('Plan', new mongoose.Schema({ name: String, description: String, examId: mongoose.Schema.Types.ObjectId }));

  const exams = await Exam.find({});
  console.log('Exams found:', exams);

  for (const e of exams) {
    if (e.name === 'EPCET' || e.name === 'EPCET (TG)' || e.name === 'EAPCET (TG)') {
      if (e.name === 'EPCET') {
        e.name = 'EPCET (TG)';
        await e.save();
        console.log('Updated exam name to EPCET (TG)');
      }
    }
  }

  const plans = await Plan.find({}).populate('examId');
  console.log('Plans found:', plans);

  for (const p of plans) {
    if (p.description && p.description.includes('EPCET') && !p.description.includes('AP') && !p.description.includes('TG')) {
      p.description = p.description.replace('EPCET', 'EPCET (TG)');
      await p.save();
      console.log('Updated plan description:', p.description);
    }
  }

  mongoose.disconnect();
}

run().catch(console.error);
