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
      <h2 className="font-bold text-slate-500">數據匯總</h2>
      {vehicles.map(v => {
        const vLogs = records.filter(r => r.vehicleId === v.id);
        const fuelCount = vLogs.filter(r => r.type === 'fuel').length;
        const serviceCount = vLogs.filter(r => r.type === 'service').length;

        return (
          <div key={v.id} className="bg-white p-6 rounded-3xl border shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <p className="font-bold text-lg">{v.name}</p>
              <p className="text-xs text-slate-400 font-mono">{v.plate}</p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-lg font-bold text-indigo-600">{v.current_odo || 0}</p>
                <p className="text-[10px] text-slate-400 uppercase">總里程</p>
              </div>
              <div>
                <p className="text-lg font-bold text-emerald-600">{fuelCount}</p>
                <p className="text-[10px] text-slate-400 uppercase">加油頻率</p>
              </div>
              <div>
                <p className="text-lg font-bold text-amber-600">{serviceCount}</p>
                <p className="text-[10px] text-slate-400 uppercase">保養次數</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
