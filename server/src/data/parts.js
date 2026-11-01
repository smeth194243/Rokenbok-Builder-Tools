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
];
