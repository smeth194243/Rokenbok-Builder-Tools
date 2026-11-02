# Rokenbok Tools

Planning tools for people 3D-printing their own Rokenbok parts: a parts database, a filament/cost estimator, and (soon) a build footprint calculator.

**Stack:** React (Vite) · Node.js / Express · MongoDB (Mongoose)

> Status: weekend project, work in progress. Right now you get the parts database, a REST API, and a bill-of-materials builder (filament, print time, cost, spool usage) and a footprint calculator, on separate pages.

## Project layout

```
client/   React front end (Vite dev server on :5173)
server/   Express API + MongoDB models (API on :5000)
```

Both live in one repo. In development the Vite server proxies `/api/*` to Express.

## Setup

### 1. Install Node.js
Version 20.6 or newer (`node -v` to check). Get it from https://nodejs.org.

### 2. Install and start MongoDB (local)

MongoDB is the database. It runs as a background service on your machine and listens on port 27017.

**Windows**
1. Download **MongoDB Community Server** (MSI) from https://www.mongodb.com/try/download/community
2. Run the installer, choose **Complete**, and keep **"Install MongoDB as a Service"** ticked (default settings are fine). You can untick MongoDB Compass if you don't want the GUI, though it's handy for browsing your data.
3. The service starts automatically. To check, open PowerShell and run: `Get-Service MongoDB` (Status should be `Running`).

**macOS:** `brew tap mongodb/brew && brew install mongodb-community && brew services start mongodb-community`

**Linux:** follow https://www.mongodb.com/docs/manual/administration/install-on-linux/

Nothing else to configure: no accounts, no passwords. The database and collection are created automatically the first time we save data.

### 3. Install dependencies
From the repo root:

```
npm run install:all
```

### 4. Configure the server
Copy `server/.env.example` to `server/.env`. The defaults work with a local MongoDB.

### 5. Seed the database
```
npm run seed
```
Safe to re-run: it updates existing parts by name instead of duplicating them.

### 6. Run the app
```
npm run dev
```
Open http://localhost:5173. The API is at http://localhost:5000/api/health.

## API

| Method | Route | Notes |
| --- | --- | --- |
| GET | `/api/health` | Server + database status |
| GET | `/api/parts` | Optional `?q=text` search and `?category=beam` filter |
| GET | `/api/parts/:id` | One part |
| POST | `/api/parts` | Create a part |
| PUT | `/api/parts/:id` | Update a part |
| DELETE | `/api/parts/:id` | Delete a part |
| POST | `/api/bom/calculate` | Totals for a bill of materials (see below) |
| POST | `/api/footprint/calculate` | Convert blocks / grid units / real-world sizes (see below) |

### Calculate a bill of materials

`POST /api/bom/calculate`

```json
{
  "items": [
    { "partId": "<part _id>", "quantity": 10 },
    { "partId": "<part _id>", "quantity": 4 }
  ],
  "costPerKg": 20,
  "spoolGrams": 1000
}
```

`costPerKg` defaults to 0 and `spoolGrams` (optional) to 1000. Duplicate `partId`s are merged. Quantities must be whole numbers from 1 to 100000. The response has per-part `lines` (quantity, filament grams, print seconds and cost subtotal) and a `totals` object: part count, filament grams, print time (seconds, one printer), cost, and spool usage (`spoolsUsed` is a fraction, e.g. 0.63 = 63% of one spool; `spoolsToBuy` is rounded up).

### Footprint conversions

`POST /api/footprint/calculate`

```json
{ "unit": "ft", "length": 4, "width": 3, "height": 2 }
```

`unit` is one of `blocks`, `units` (20 mm grid units), `mm`, `cm`, `in`, `ft`, `m` and applies to every dimension. `height` is optional. Block and grid-unit values must be whole numbers.

A **block** is a measure of length: one full beam with a connector cube on each end (9 grid units, 180 mm). Each additional beam and cube adds another block (8 more units, 160 mm), so n blocks span `8n + 1` grid units: 1 block = 180 mm, 2 = 340 mm, 3 = 500 mm. The spacing lives in `server/src/constants.js` if it ever needs adjusting.

It works both ways: give it blocks or grid units to get exact real-world sizes, or give it a real-world size to get the largest whole number of blocks and grid units that fits (plus leftover space). The response has `dimensions` (per axis: `exact` measurements in mm/cm/in/ft/m and `fit` with whole units, blocks and leftover mm) and floor `area` (`exact`, and `fit` for the whole-grid area).

## Part data model

| Field | Meaning |
| --- | --- |
| `name` | Unique part name |
| `category` | `cube`, `beam`, or `riser` |
| `description` | Short description |
| `gridSize` | Length/width/height in Rokenbok grid units |
| `dimensionsMm` | Length/width/height in millimetres (1 unit = 20 mm) |
| `filamentGrams` | Estimated filament for one print |
| `printTimeSeconds` | Estimated print time for one print |
| `modelUrl` | Link to the printable model |

Starter parts are in `server/src/data/parts.js`; edit the numbers there and re-run `npm run seed`.

## Tests
```
npm test --prefix server
```
Covers the BOM math and validation. No database needed.

## Saved builds
The current build and price per kg are saved in the browser's `localStorage`, so they survive a refresh but only exist in that browser. Saving builds to MongoDB (so they follow you between devices, and can be shared) is planned; the only client code that would change is `client/src/hooks/useLocalStorage.js`.

## Roadmap
- ~~Bill of materials builder with filament cost totals~~ (done)
- ~~Footprint calculator (blocks / grid units / real-world sizes)~~ (done)
- Save builds to MongoDB
- Space/footprint calculator
- AI parts-list parser (Claude API)
- Later: 3D build planner
