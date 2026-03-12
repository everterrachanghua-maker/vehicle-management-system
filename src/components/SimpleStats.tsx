import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function SimpleStats({ vehicles }: { vehicles: any[] }) {
  const [records, setRecords] = useState<any[]>([]);

  useEffect(() => {
    const fetchRecords = async () => {
      const snap = await getDocs(collection(db, "records"));
      setRecords(snap.docs.map(d => d.data()));
    };
    fetchRecords();
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="font-bold text-slate-500">車輛數據匯總</h2>
      {vehicles.map(v => {
        const fuelCount = records.filter(r => r.vehicleId === v.id && r.type === 'fuel').length;
        return (
          <div key={v.id} className="bg-white p-6 rounded-3xl border shadow-sm space-y-4">
            <div className="flex justify-between border-b pb-2">
              <p className="font-bold">{v.name}</p>
              <p className="text-xs text-slate-400 font-mono">{v.plate}</p>
            </div>
            <div className="grid grid-cols-2 text-center">
              <div>
                <p className="text-xl font-bold text-indigo-600">{v.current_odo || 0} <span className="text-[10px]">km</span></p>
                <p className="text-[10px] text-slate-400">總累積里程</p>
              </div>
              <div>
                <p className="text-xl font-bold text-emerald-600">{fuelCount} <span className="text-[10px]">次</span></p>
                <p className="text-[10px] text-slate-400">加油頻率</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
