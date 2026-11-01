import { Router } from 'express';
import Part from '../models/Part.js';
import { calculateBom, parseBomRequest } from '../services/bom.js';

const router = Router();

// POST /api/bom/calculate
// Body: { items: [{ partId, quantity }], costPerKg, spoolGrams? }
router.post('/calculate', async (req, res, next) => {
  try {
    const request = parseBomRequest(req.body);
    const ids = request.items.map((i) => i.partId);
    const parts = ids.length ? await Part.find({ _id: { $in: ids } }).lean() : [];
    res.json(calculateBom(parts, request.items, request));
  } catch (err) {
    next(err);
  }
});

export default router;
