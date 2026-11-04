import { Router } from 'express';
import mongoose from 'mongoose';
import Part from '../models/Part.js';
import { withDimensions } from '../services/parts.js';

const router = Router();

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Reject malformed ids before they reach Mongoose.
router.param('id', (req, res, next, id) => {
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: 'Invalid part id' });
  }
  next();
});

// GET /api/parts?q=beam&category=beam
router.get('/', async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.category) filter.category = String(req.query.category);
    if (req.query.q) {
      const rx = new RegExp(escapeRegex(String(req.query.q)), 'i');
      filter.$or = [{ name: rx }, { description: rx }];
    }
    const parts = await Part.find(filter).sort({ name: 1 });
    res.json(parts);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const part = await Part.findById(req.params.id);
    if (!part) return res.status(404).json({ error: 'Part not found' });
    res.json(part);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const part = await Part.create(withDimensions(req.body));
    res.status(201).json(part);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const part = await Part.findByIdAndUpdate(req.params.id, withDimensions(req.body), {
      new: true,
      runValidators: true,
    });
    if (!part) return res.status(404).json({ error: 'Part not found' });
    res.json(part);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const part = await Part.findByIdAndDelete(req.params.id);
    if (!part) return res.status(404).json({ error: 'Part not found' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
