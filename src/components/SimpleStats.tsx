import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Fuel, Gauge, Wrench } from 'lucide-react';

export default function SimpleStats({ vehicles }: { vehicles: any[] }) {
  const [counts, setCounts] = useState<any>({});

  useEffect(() => {
    const fetchCounts = async () => {
      const snap = await getDocs(collection(db, "records"));
      const logs = snap.docs.map(d => d.data());
      
      const stats: any = {};
      vehicles.forEach(v => {
        const vLogs = logs.filter(l => l.vehicleId === v.id);
        stats[v.id] = {
          fuelCount: vLogs.filter(l => l.type === 'fuel').length,
          serviceCount: vLogs.filter(l => l.type === 'service').length
        };
      });
      setCounts(stats);
    };
    fetchCounts();
  }, [vehicles]);

  return (
    <div className="space-y-4">
      <h2 className="font-bold text-slate-500">數據匯總</h2>
      {vehicles.map(v => (
        <div key={v.id} className="bg-white p-6 rounded-[32px] border shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b pb-4">
            <p className="font-black text-lg">{v.name}</p>
            <p className="text-xs text-slate-400">{v.plate}</p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-xl font-mono font-bold text-indigo-600">{v.current_odo}</p>
              <p className="text-[10px] text-slate-400">累積里程</p>
            </div>
            <div>
              <p className="text-xl font-mono font-bold text-emerald-600">{counts[v.id]?.fuelCount || 0}</p>
              <p className="text-[10px] text-slate-400">加油次數</p>
            </div>
            <div>
              <p className="text-xl font-mono font-bold text-amber-600">{counts[v.id]?.serviceCount || 0}</p>
              <p className="text-[10px] text-slate-400">保養次時</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
