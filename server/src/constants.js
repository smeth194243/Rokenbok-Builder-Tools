// Shared Rokenbok measurements.

// One grid unit (the size of a connector cube) in millimetres.
export const GRID_UNIT_MM = 20;

// A "block" is a measure of length: one full beam (7 units) with a connector
// cube (1 unit) on each end, so the first block is 1 + 7 + 1 = 9 units long.
// Each additional block adds one more beam and one more cube: 8 more units.
// n blocks therefore span BLOCK_BASE_UNITS + BLOCK_PITCH_UNITS * n units.
// (Beam units already account for the snaps sinking into the cubes.)
export const BLOCK_BASE_UNITS = 1; // the cube that starts the row
export const BLOCK_PITCH_UNITS = 8; // beam (7) + cube (1) per block
