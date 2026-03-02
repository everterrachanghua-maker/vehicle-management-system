export interface Vehicle {
  id: number;
  name: string;
  make: string;
  model: string;
  year: number;
  initial_mileage: number;
  current_odometer?: number;
  created_at: string;
}

export interface Log {
  id: number;
  vehicle_id: number;
  type: 'refuel' | 'mileage' | 'service';
  date: string;
  odometer: number;
  liters?: number;
  price_per_liter?: number;
  total_cost?: number;
  location?: string;
  notes?: string;
  created_at: string;
}
