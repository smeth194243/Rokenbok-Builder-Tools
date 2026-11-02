import { Router } from 'express';
import { calculateFootprint, parseFootprintRequest } from '../services/footprint.js';

const router = Router();

// POST /api/footprint/calculate
// Body: { unit, length, width, height? }  (unit: blocks | units | mm | cm | in | ft | m)
router.post('/calculate', (req, res, next) => {
  try {
    res.json(calculateFootprint(parseFootprintRequest(req.body)));
  } catch (err) {
    next(err);
  }
});

export default router;
