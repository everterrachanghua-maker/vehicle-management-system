import { useState } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { Plus, Gauge } from 'lucide-react';

export default function Garage({ vehicles }: { vehicles: any[] }) {
  const [showAdd, setShowAdd] = useState(false);

  const addVehicle = async (e: any) => {
    e.preventDefault();
    const name = e.target.name.value;
    const plate = e.target.plate.value;
    await addDoc(collection(db, "vehicles"), { name, plate, current_odo: 0 });
    setShowAdd(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-bold text-slate-500">我的車庫 ({vehicles.length})</h2>
        <button onClick={() => setShowAdd(true)} className="text-xs bg-indigo-600 text-white px-3 py-1 rounded-full">+ 新增車輛</button>
      </div>

      {showAdd && (
        <form onSubmit={addVehicle} className="bg-indigo-50 p-4 rounded-2xl space-y-3 border border-indigo-100">
          <input name="name" placeholder="車輛暱稱" className="w-full p-2 rounded-lg border-none" required />
          <input name="plate" placeholder="車牌號碼" className="w-full p-2 rounded-lg border-none" required />
          <button className="w-full bg-indigo-600 text-white py-2 rounded-lg font-bold">確認新增</button>
        </form>
      )}

      <div className="grid gap-3">
        {vehicles.map(v => (
          <div key={v.id} className="bg-white p-4 rounded-2xl shadow-sm border flex justify-between items-center">
            <div>
              <p className="font-bold">{v.name}</p>
              <p className="text-xs text-slate-400 font-mono">{v.plate}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-mono font-bold text-indigo-600">{v.current_odo?.toLocaleString()} km</p>
              <p className="text-[10px] text-slate-300">目前里程</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
