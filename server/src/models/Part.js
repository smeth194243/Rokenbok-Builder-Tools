import mongoose from 'mongoose';
import { GRID_UNIT_MM } from '../constants.js';

const { Schema } = mongoose;

// A Rokenbok building is grid based: one grid unit = 20 mm.
export { GRID_UNIT_MM };

// Size in millimetres.
const mmSizeSchema = new Schema(
  {
    length: { type: Number, required: true, min: 0 },
    width: { type: Number, required: true, min: 0 },
    height: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

// Size in grid units: whole numbers, at least 1.
const wholeUnits = () => ({
  type: Number,
  required: true,
  min: [1, '{PATH} must be at least 1'],
  validate: { validator: Number.isInteger, message: '{PATH} must be a whole number' },
});

const gridSizeSchema = new Schema(
  { length: wholeUnits(), width: wholeUnits(), height: wholeUnits() },
  { _id: false }
);

const partSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      unique: true,
      trim: true,
      maxlength: [60, 'Name can be at most 60 characters'],
    },
    // Free-form (e.g. cube, beam, riser, plate) so new kinds of parts can be added.
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      lowercase: true,
      maxlength: [30, 'Category can be at most 30 characters'],
      index: true,
    },
    description: { type: String, default: '', trim: true, maxlength: [500, 'Description can be at most 500 characters'] },

    // Size in grid units, e.g. a full beam is 7 x 1 x 1.
    gridSize: { type: gridSizeSchema, required: true },
    // Physical size in millimetres. Normally derived from gridSize (see services/parts.js).
    dimensionsMm: { type: mmSizeSchema, required: true },

    // Estimates for printing ONE of this part.
    filamentGrams: { type: Number, required: [true, 'Filament weight is required'], min: [0, 'Filament weight cannot be negative'] },
    printTimeSeconds: {
      type: Number,
      required: [true, 'Print time is required'],
      min: [1, 'Print time must be at least 1 second'],
    },

    modelUrl: {
      type: String,
      default: '',
      trim: true,
      validate: {
        validator: (v) => v === '' || /^https?:\/\/\S+$/i.test(v),
        message: 'Model link must start with http:// or https://',
      },
    },
  },
  { timestamps: true }
);

export default mongoose.model('Part', partSchema);
