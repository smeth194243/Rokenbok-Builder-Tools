import mongoose from 'mongoose';
import Part from './models/Part.js';
import { parts } from './data/parts.js';

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI is not set. Copy server/.env.example to server/.env first.');
  process.exit(1);
}

try {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });

  // Upsert by name so the script is safe to run repeatedly.
  for (const part of parts) {
    await Part.findOneAndUpdate({ name: part.name }, part, {
      upsert: true,
      new: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    });
    console.log(`  seeded: ${part.name}`);
  }
  console.log(`Done. ${parts.length} parts in the database.`);
} catch (err) {
  console.error('Seeding failed:', err.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
