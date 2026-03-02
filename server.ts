import express from 'express';
import { createServer as createViteServer } from 'vite';
import db from './src/db';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  
  // Get all vehicles
  app.get('/api/vehicles', (req, res) => {
    try {
      const vehicles = db.prepare('SELECT * FROM vehicles ORDER BY created_at DESC').all();
      // Get latest odometer for each vehicle
      const vehiclesWithStats = vehicles.map((v: any) => {
        const lastLog = db.prepare('SELECT odometer FROM logs WHERE vehicle_id = ? ORDER BY odometer DESC LIMIT 1').get(v.id) as any;
        return {
          ...v,
          current_odometer: lastLog ? lastLog.odometer : v.initial_mileage
        };
      });
      res.json(vehiclesWithStats);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch vehicles' });
    }
  });

  // Create vehicle
  app.post('/api/vehicles', (req, res) => {
    const { name, make, model, year, initial_mileage } = req.body;
    try {
      const stmt = db.prepare('INSERT INTO vehicles (name, make, model, year, initial_mileage) VALUES (?, ?, ?, ?, ?)');
      const info = stmt.run(name, make || '', model || '', year || new Date().getFullYear(), initial_mileage || 0);
      res.json({ id: info.lastInsertRowid });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create vehicle' });
    }
  });

  // Delete vehicle
  app.delete('/api/vehicles/:id', (req, res) => {
    try {
      db.prepare('DELETE FROM vehicles WHERE id = ?').run(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete vehicle' });
    }
  });

  // Get logs for a vehicle
  app.get('/api/vehicles/:id/logs', (req, res) => {
    try {
      const logs = db.prepare('SELECT * FROM logs WHERE vehicle_id = ? ORDER BY date DESC, odometer DESC').all(req.params.id);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch logs' });
    }
  });

  // Add log
  app.post('/api/vehicles/:id/logs', (req, res) => {
    const { type, date, odometer, liters, price_per_liter, total_cost, location, notes } = req.body;
    const vehicleId = req.params.id;
    
    try {
      const stmt = db.prepare(`
        INSERT INTO logs (vehicle_id, type, date, odometer, liters, price_per_liter, total_cost, location, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const info = stmt.run(
        vehicleId, 
        type, 
        date, 
        odometer, 
        liters || null, 
        price_per_liter || null, 
        total_cost || null, 
        location || '', 
        notes || ''
      );
      
      res.json({ id: info.lastInsertRowid });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to add log' });
    }
  });

  // Vite middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
