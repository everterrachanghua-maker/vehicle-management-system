import Database from 'better-sqlite3';

const db = new Database('vehicles.db');

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    make TEXT,
    model TEXT,
    year INTEGER,
    initial_mileage INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('refuel', 'mileage', 'service')),
    date TEXT NOT NULL,
    odometer INTEGER NOT NULL,
    liters REAL,
    price_per_liter REAL,
    total_cost REAL,
    location TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles (id) ON DELETE CASCADE
  );
`);

export default db;
