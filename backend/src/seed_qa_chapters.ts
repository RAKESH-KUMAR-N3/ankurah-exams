import dotenv from 'dotenv';
import { connectDB } from './config/db';
import CompetitiveSubject from './models/CompetitiveSubject';
import Chapter from './models/Chapter';
import Topic from './models/Topic';

dotenv.config();

// 25 Quantitative Aptitude chapters for SBI PO
const qaData = [
  { chapter: 'Number System', topics: [] },
  { chapter: 'Simplification', topics: [] },
  { chapter: 'Approximation', topics: [] },
  { chapter: 'BODMAS', topics: [] },
  { chapter: 'Percentage', topics: [] },
  { chapter: 'Profit & Loss', topics: [] },
  { chapter: 'Simple Interest', topics: [] },
  { chapter: 'Compound Interest', topics: [] },
  { chapter: 'Ratio & Proportion', topics: [] },
  { chapter: 'Partnership', topics: [] },
  { chapter: 'Average', topics: [] },
  { chapter: 'Age Problems', topics: [] },
  { chapter: 'Time & Work', topics: [] },
  { chapter: 'Pipes & Cisterns', topics: [] },
  { chapter: 'Time, Speed & Distance', topics: [] },
  { chapter: 'Boats & Streams', topics: [] },
  { chapter: 'Trains', topics: [] },
  { chapter: 'Mixtures & Alligations', topics: [] },
  { chapter: 'Mensuration', topics: [] },
  { chapter: 'Permutation & Combination', topics: [] },
  { chapter: 'Probability', topics: [] },
  { chapter: 'Data Interpretation', topics: [] },
  { chapter: 'Quadratic Equations', topics: [] },
  { chapter: 'Quantity Comparison', topics: [] },
  { chapter: 'Number Series', topics: [] },
];

async function seedQA() {
  await connectDB();
  console.log('Connected to MongoDB...');

  // Find Quantitative Aptitude subject in CompetitiveSubject collection
  let subject: any = await CompetitiveSubject.findOne({
    name: { $regex: /quantitative\s*aptitude/i }
  });

  if (!subject) {
    console.error('❌  "Quantitative Aptitude" not found in CompetitiveSubject collection!');
    console.log('Available competitive subjects:');
    const all = await CompetitiveSubject.find({}, 'name');
    all.forEach(s => console.log(`  - ${s.name}`));
    process.exit(1);
  }

  console.log(`✅  Found subject: "${subject.name}" (${subject._id})`);

  // Clear existing chapters to avoid duplicates
  const existingChs = await Chapter.find({ subjectId: subject._id });
  if (existingChs.length > 0) {
    console.log(`⚠️   Clearing ${existingChs.length} existing chapters...`);
    const existingChIds = existingChs.map(c => c._id);
    await Topic.deleteMany({ chapterId: { $in: existingChIds } });
    await Chapter.deleteMany({ subjectId: subject._id });
  }

  let totalChapters = 0;

  for (const [idx, item] of qaData.entries()) {
    await Chapter.create({
      title: item.chapter,
      subjectId: subject._id,
      order: idx + 1
    });
    totalChapters++;
    console.log(`  ${idx + 1}. ${item.chapter}`);
  }

  console.log(`\n🎉  Successfully seeded ${totalChapters} chapters for "${subject.name}"!`);
  process.exit(0);
}

seedQA().catch(err => {
  console.error('❌  Error:', err.message);
  process.exit(1);
});
