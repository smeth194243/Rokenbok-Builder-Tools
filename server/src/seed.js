import mongoose from 'mongoose';
import Part from './models/Part.js';
import { parts } from './data/parts.js';
import { seedParts } from './seedParts.js';

// npm run seed              -> add any missing parts, leave existing ones alone
// npm run seed -- --update  -> also overwrite existing parts with the data file's values
const update = process.argv.includes('--update');

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI is not set. Copy server/.env.example to server/.env first.');
  process.exit(1);
}

try {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });

  const results = await seedParts(Part, parts, { update });
  for (const { name, action } of results) console.log(`  ${action.padEnd(7)} ${name}`);

  const count = (action) => results.filter((r) => r.action === action).length;
  console.log(`Done. ${count('added')} added, ${count('updated')} updated, ${count('kept')} left as they were.`);
  if (count('kept') > 0 && !update) console.log('Run "npm run seed -- --update" to reset existing parts to the data file.');
} catch (err) {
  console.error('Seeding failed:', err.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
