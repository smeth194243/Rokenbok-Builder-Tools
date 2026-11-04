// Starter parts for the seed script. Numbers are estimates and can be
// refined at any time - re-run `npm run seed` to update existing parts.
const MODEL_URL = 'https://www.printables.com/model/1792983-rokenbok-beamblock-master-pack';

// Print times are written as minutes + seconds so they match the slicer.
const time = (minutes, seconds = 0) => minutes * 60 + seconds;

export const parts = [
  {
    name: 'Connector Cube',
    category: 'cube',
    description: '1 x 1 unit female cube that accepts the snaps from beams.',
    gridSize: { length: 1, width: 1, height: 1 },
    dimensionsMm: { length: 20, width: 20, height: 20 },
    filamentGrams: 2.6,
    printTimeSeconds: time(10, 5),
    modelUrl: MODEL_URL,
  },
  {
    name: 'Full Beam',
    category: 'beam',
    description: '1 x 7 unit beam with a male snap at each end.',
    gridSize: { length: 7, width: 1, height: 1 },
    dimensionsMm: { length: 140, width: 20, height: 20 },
    filamentGrams: 17,
    printTimeSeconds: time(49, 0),
    modelUrl: MODEL_URL,
  },
  {
    name: 'Half Beam',
    category: 'beam',
    description: '1 x 3 unit beam with a male snap at each end.',
    gridSize: { length: 3, width: 1, height: 1 },
    dimensionsMm: { length: 60, width: 20, height: 20 },
    filamentGrams: 7.53,
    printTimeSeconds: time(23, 15),
    modelUrl: MODEL_URL,
  },
  {
    name: 'Riser',
    category: 'riser',
    description: '1 x 2 unit beam with a female connector on one end and a male snap on the other.',
    gridSize: { length: 2, width: 1, height: 1 },
    dimensionsMm: { length: 40, width: 20, height: 20 },
    filamentGrams: 5.05,
    printTimeSeconds: time(16, 16),
    modelUrl: MODEL_URL,
  },

  // ---------------------------------------------------------------------------
  // The parts below were added with ESTIMATED print details (filament and time).
  // They were scaled from the measured parts above (beams run roughly 2.4-2.5 g
  // and 7-8 minutes per grid unit of length) and still need real numbers from
  // the slicer. dimensionsMm is left out: it is derived from gridSize (20 mm/unit).
  // ---------------------------------------------------------------------------
  {
    name: 'Curved Beam',
    category: 'curved beam',
    description: 'Curved beam that connects two opposite corners within a block (8 x 8 grid units).',
    gridSize: { length: 8, width: 8, height: 1 },
    filamentGrams: 31, // arc is about 12.6 units long
    printTimeSeconds: time(94, 0),
    modelUrl: MODEL_URL,
  },
  {
    name: 'Small Curved Beam',
    category: 'curved beam',
    description: 'Half-size curved beam that connects two perpendicular half beams within a block (4 x 4 grid units).',
    gridSize: { length: 4, width: 4, height: 1 },
    filamentGrams: 15.5, // arc is about 6.3 units long
    printTimeSeconds: time(47, 0),
    modelUrl: MODEL_URL,
  },
  {
    name: 'Mini Curved Beam',
    category: 'curved beam',
    description: 'Quarter-size curved beam that connects two perpendicular risers (2 x 2 grid units).',
    gridSize: { length: 2, width: 2, height: 1 },
    filamentGrams: 7.8, // arc is about 3.1 units long
    printTimeSeconds: time(23, 30),
    modelUrl: MODEL_URL,
  },
  {
    name: 'Deck Plate',
    category: 'plate',
    description:
      'Sits on top of a square block as a platform for vehicles to drive on. Covers a full 9 x 9 unit block; the plate itself measures 8 x 8 units.',
    gridSize: { length: 8, width: 8, height: 1 }, // height is a placeholder: real plate thickness not measured yet
    filamentGrams: 60,
    printTimeSeconds: time(180, 0),
    modelUrl: '',
  },
  {
    name: 'Half Deck Plate',
    category: 'plate',
    description:
      'Sits on top of a 1 x 0.5 block as a platform for vehicles to drive on. Covers a 5 x 9 unit area; the plate itself measures 8 x 4 units.',
    gridSize: { length: 8, width: 4, height: 1 }, // height is a placeholder, as above
    filamentGrams: 30,
    printTimeSeconds: time(90, 0),
    modelUrl: '',
  },
  {
    name: 'Single Snap Cube',
    category: 'cube',
    description: 'Connector cube with a male snap on one face.',
    gridSize: { length: 1, width: 1, height: 1 },
    filamentGrams: 3.3,
    printTimeSeconds: time(12, 30),
    modelUrl: MODEL_URL,
  },
  {
    name: 'Double Snap Cube',
    category: 'cube',
    description: 'Connector cube with male snaps on two opposite faces.',
    gridSize: { length: 1, width: 1, height: 1 },
    filamentGrams: 4,
    printTimeSeconds: time(15, 0),
    modelUrl: '',
  },
];
