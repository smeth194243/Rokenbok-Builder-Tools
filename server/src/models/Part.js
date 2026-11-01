import mongoose from 'mongoose';

const { Schema } = mongoose;

// A Rokenbok building is grid based: one grid unit = 20 mm.
export const GRID_UNIT_MM = 20;

const sizeSchema = new Schema(
  {
    length: { type: Number, required: true, min: 0 },
    width: { type: Number, required: true, min: 0 },
    height: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const partSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: ['cube', 'beam', 'riser'],
      index: true,
    },
    description: { type: String, default: '', trim: true },

    // Size in grid units, e.g. a full beam is 1 x 1 x 7.
    gridSize: { type: sizeSchema, required: true },
    // Physical size in millimetres, e.g. a full beam is 20 x 20 x 140.
    dimensionsMm: { type: sizeSchema, required: true },

    // Estimates for printing ONE of this part.
    filamentGrams: { type: Number, required: true, min: 0 },
    printTimeSeconds: { type: Number, required: true, min: 0 },

    modelUrl: { type: String, default: '', trim: true },
  },
  { timestamps: true }
);

export default mongoose.model('Part', partSchema);
