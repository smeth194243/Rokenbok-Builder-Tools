import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import partsRouter from './routes/parts.js';
import bomRouter from './routes/bom.js';
import footprintRouter from './routes/footprint.js';
import { errorHandler } from './middleware/errors.js';

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not set. Copy server/.env.example to server/.env first.');
  process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  const dbReady = mongoose.connection.readyState === 1;
  res.status(dbReady ? 200 : 503).json({ ok: dbReady, db: dbReady ? 'connected' : 'disconnected' });
});

app.use('/api/parts', partsRouter);
app.use('/api/bom', bomRouter);
app.use('/api/footprint', footprintRouter);

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

app.use(errorHandler);

try {
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  console.log('Connected to MongoDB');
  app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
} catch (err) {
  console.error('Could not connect to MongoDB:', err.message);
  console.error('Is MongoDB running? See the README for setup steps.');
  process.exit(1);
}
